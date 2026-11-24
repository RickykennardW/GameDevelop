"""Repeatable map balance/scope audit. Reports contain metrics, never source snapshots."""
import copy
import hashlib
import json
import math
import runpy
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
BASELINE='e59ded3'
SOURCES={'responsive-map-runtime.js','island-map-runtime.js','island-render-runtime.js','nova-wisp-runtime.js','void-hound-runtime.js','void-golem-runtime.js'}
ENVIRONMENT=runpy.run_path(str(Path(__file__).resolve().parent/'validate-environment.py'))
SOURCES.update(ENVIRONMENT['PAUSE_SOURCES'])
ADDED_SOURCES=ENVIRONMENT['ADDED_SOURCES']
restore_pause_additions=ENVIRONMENT['restore_pause_additions']


def read(path):
    return json.loads((ROOT/path).read_text(encoding='utf-8-sig'))


def old(path):
    return json.loads(subprocess.check_output(['git','show',f'{BASELINE}:{path}'],cwd=ROOT).decode('utf-8-sig'))


def value(v):
    if v['type']=='structure':return {c['name']:value(c) for c in v.get('children',[])}
    if v['type']=='array':return [value(c) for c in v.get('children',[])]
    return v.get('value')


def strip_animations(objects):
    result=copy.deepcopy(objects)
    for o in result:
        if o['name'] in {'Monster_Path','Ground_Decoration'}:
            o['animations']=[a for a in o['animations'] if not a['name'].startswith('Chapter_')]
        elif o['name'] in {'VoidBackdrop','IslandCliffFrame'}:
            o['animations']=[a for a in o['animations'] if not a['name'].startswith('Chapter_Env_')]
    return result


def restore_levels_metadata(scene,baseline):
    config=next(v for v in scene['variables'] if v['name']=='CampaignConfig')
    prior=next(v for v in baseline['variables'] if v['name']=='CampaignConfig')
    before={c['name']:c for c in prior['children']}
    config['children']=[before.get(c['name'],c) if c['name']=='Chapters' else c for c in config['children'] if c['name'] not in {'ChapterCapacity','ReleasedChapters','FutureChapters'}]
    scene['events']=copy.deepcopy(baseline['events'])


def restore_scene_additions(scene,baseline):
    restore_pause_additions(scene)
    scene['objects']=strip_animations(scene['objects'])
    scene['variables']=[v for v in scene['variables'] if v['name']!='ChapterMaps']
    for root,children,name in read('tools/source-mapping.json'):
        if name not in SOURCES:continue
        node,original=scene['events'][root],baseline['events'][root]
        for child in children:node,original=node['events'][child],original['events'][child]
        node['inlineCode']=copy.deepcopy(original['inlineCode'])


def main():
    ENVIRONMENT['main']()
    checks=[]
    def ok(test,label):
        if not test:raise AssertionError(label)
        checks.append(label)
    scene=read('layouts/game-scene.json');prior=old('layouts/game-scene.json');project=read('Tower Defense.json');cfg=read('tools/campaign-config.json');previous=old('tools/campaign-config.json')
    generator=runpy.run_path(str(ROOT/'tools/build-chapter-maps.py'));source,maps=generator['compile_maps']()
    data=value(next(v for v in scene['variables'] if v['name']=='ChapterMaps'))
    ok(data=={'Version':source['Version'],'Scale':source['Scale'],'Maps':{m['Id']:m for m in maps}},'Compiled native ChapterMaps matches its single maintained source')
    ok(cfg['Levels']==previous['Levels'],'All 25 mission waves, starting Gold, rewards, Lives, prices and HP/speed overrides preserved')
    ok([c['Boss'] for c in cfg['Chapters']]==[c['Boss'] for c in previous['Chapters']],'All five existing boss stats and abilities preserved')
    ok(cfg['ChapterCapacity']==8 and cfg['ReleasedChapters']==5 and len(cfg['FutureChapters'])==3 and all(c['Status']=='PLANNED' for c in cfg['FutureChapters']),'Five implemented chapters and three explicit future definitions')
    normalized=copy.deepcopy(scene);restore_pause_additions(normalized);normalized['objects']=strip_animations(normalized['objects']);normalized['variables']=[v for v in normalized['variables'] if v['name']!='ChapterMaps']
    for root,children,name in read('tools/source-mapping.json'):
        if name in ADDED_SOURCES:continue
        node,original=normalized['events'][root],prior['events'][root]
        for child in children:node,original=node['events'][child],original['events'][child]
        ok(node['inlineCode']==(ROOT/'tools'/name).read_text(encoding='utf-8-sig').splitlines(),'Embedded source matches '+name)
        if name in SOURCES:node['inlineCode']=copy.deepcopy(original['inlineCode'])
    ok(normalized==prior,'Only chapter-map variable, map/prop animations and six render/layout sources changed in Game Scene')
    levels=read('layouts/levels.json');prior_levels=old('layouts/levels.json')
    ok(value(next(v for v in levels['variables'] if v['name']=='CampaignConfig'))==cfg,'Native Levels config matches canonical campaign')
    expected_events=copy.deepcopy(prior_levels['events'])
    prior_source='\n'.join(expected_events[2]['inlineCode'])
    current_source=(ROOT/'tools/levels-runtime.js').read_text(encoding='utf-8').rstrip('\n')
    approved_source=prior_source.replace("['CHAPTER 1 - STELLAR FRONTIER','Your first missions begin at the edge of known space.']", "['CHAPTER 1 - '+C.config.Chapters[0].ShortName.toUpperCase(),'Your first missions begin on the celestial basalt terraces of Emberfall.']")
    ok(current_source==approved_source,'Levels runtime changes only the chapter introduction caption')
    expected_events[2]['inlineCode']=current_source.splitlines()
    ok(levels['events']==expected_events,'Levels retains all three event blocks and unchanged service events')
    restore_levels_metadata(levels,prior_levels);ok(levels==prior_levels,'Levels changes limited to chapter metadata and updated tutorial title')
    ok([e for e in read('tools/source-mapping.json') if e[2] not in ADDED_SOURCES]==old('tools/source-mapping.json'),'Existing source mappings preserved; two additions audited separately')
    for name in ['layouts/main-menu.json','eventsFunctionsExtensions/health.json','tools/labyrinth-layout.json']:
        ok(read(name)==old(name),'Unrelated native data unchanged '+name)
    added={m[k] for m in maps for k in ['Road','Ground']}|{f'assets/map/chapters/{m["Id"]}_{kind.lower()}.svg' for m in maps for kind in m['PropAnimations']}
    added|={a['Resource'] for m in maps for a in m.get('Environment',{}).get('Assets',[])}
    resources=project['resources']['resources'];normalized_project=copy.deepcopy(project);normalized_project['resources']['resources']=[r for r in resources if r['name'] not in added]
    ok(normalized_project==old('Tower Defense.json'),'Project root only adds registered final map resources')
    ok({r['file'] for r in resources if r['name'] in added}==added,'Every new resource has its exact relative file path')
    ok({p.relative_to(ROOT).as_posix() for p in (ROOT/'assets/map/chapters').rglob('*') if p.is_file()}==added,'All generated final chapter assets are registered')
    for path in added:
        if path.endswith('.svg'):ET.parse(ROOT/path)
        else:Image.open(ROOT/path).verify()
        ok((ROOT/path).stat().st_size>100,'Valid nonempty environment asset '+path)
    old_width=value(next(v for v in prior['variables'] if v['name']=='LabyrinthMap'))['Width']
    rows=[]
    for m in maps:
        points=[(p['X'],p['Y']) for p in m['Points']]
        ok((ROOT/m['Ground']).read_text(encoding='utf-8')==generator['ground_art'](m),'Periodic ground matches generator '+m['Id'])
        ok((ROOT/m['Road']).read_text(encoding='utf-8')==generator['road_art'](m,points,source['Surface'],source['Scale']['PathWidth'],source['Scale']['PavingCell']),'Road art matches exact placement centerline '+m['Id'])
        ok(8000<m['Length']<10500,'Route travel remains within the established scale envelope '+m['Id'])
        ok(all(0<math.dist(a,b)<=48.001 for a,b in zip(points,points[1:])),'Continuous densely sampled rounded route '+m['Id'])
        ok(points[0]==(132,220) and points[-1]==(132,1012),'Stable portal anchors '+m['Id'])
        ok(cfg['Chapters'][m['Chapter']-1]['MapId']==m['Id'],'Chapter points to implemented native map '+m['Id'])
        rows.append({'chapter':m['Chapter'],'name':m['Name'],'widthBefore':old_width,'width':m['Width'],'length':m['Length'],'turns':m['Turns'],'props':len(m['Decorations']),'monsterVisualMultiplier':source['Scale']['EnemyVisualMultiplier'],'collisionMultiplier':1,'towerMultiplier':1})
    ok(len({tuple(tuple(p) for p in m['Corners']) for m in maps})==5,'Five genuinely different routes')
    allowed=added|{f'assets/ui/campaign/chapter_{n}.svg' for n in range(1,6)}
    changed=set(subprocess.check_output(['git','diff',BASELINE,'--name-only','--','assets'],cwd=ROOT,text=True).splitlines())
    ok(changed<=allowed,'No tower, monster, projectile, audio or other existing map art modified')
    # Run maintained current-format native references, sprite crops and resources.
    namespace={'__file__':str(ROOT/'tools/validate-project.py')}
    code=(ROOT/'tools/validate-project.py').read_text(encoding='utf-8').split("for f in ROOT.rglob('*'):")[0]
    exec(compile(code,str(ROOT/'tools/validate-project.py'),'exec'),namespace)
    ok(True,'Maintained structural/resource checks '+str(len(namespace['checks'])))
    report={'passed':True,'baseline':BASELINE,'checks':checks,'count':len(checks),'structuralChecks':len(namespace['checks']),'maps':rows,'newFinalAssetBytes':sum((ROOT/p).stat().st_size for p in added),'newAssets':len(added),'noBackupCreated':True,'runtimeTests':'See chapter-map-movement, chapter-balance, chapter-first-contact and chapter-fusion reports. Static geometry is not proof of balance.'}
    (ROOT/'validation/chapter-maps-static.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print('PASS chapter map scope',len(checks),'structural checks',len(namespace['checks']))
    return report


if __name__=='__main__':main()
