"""Scoped semantic/hash audit against the task's pre-change backup."""
import copy, hashlib, json, re, zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent;OUT=ROOT/'design_previews/gameplay_balance';checks=[]
def ok(condition,message):
    if not condition:raise AssertionError(message)
    checks.append(message)
with zipfile.ZipFile(ROOT/'backups/pre_hp_bars_balance_20261009.zip') as z:
    old_scene=json.loads(z.read('layouts/game-scene.json'));old_project=json.loads(z.read('Tower Defense.json'))
    ok(z.testzip() is None,'pre-change source/config backup ZIP integrity')
    scene=json.loads((ROOT/'layouts/game-scene.json').read_text(encoding='utf-8'));project=json.loads((ROOT/'Tower Defense.json').read_text(encoding='utf-8'))
    for k in old_scene:
        if k not in ['variables','events','objects']:ok(scene[k]==old_scene[k],'scene field unchanged: '+k)
    for k in old_project:
        if k!='resources':ok(project[k]==old_project[k],'project field unchanged: '+k)
    changed_vars={'StarCannonConfig','EnemyWaveDistribution'};added={'WavePacing','WaveCompletionReward','EnemyHPBarConfig'}
    old_vars={v['name']:v for v in old_scene['variables']};variables={v['name']:v for v in scene['variables']}
    ok(set(variables)==set(old_vars)|added,'only three intentional scene configuration variables added')
    for name,variable in old_vars.items():
        if name not in changed_vars:ok(variables[name]==variable,'original variable/stats preserved: '+name)
    ok(len(scene['objects'])==59,'native object definitions remain59')
    for old,new in zip(old_scene['objects'],scene['objects']):
        normalized=copy.deepcopy(new)
        if new['name']=='HealthBarBackground':normalized['animations'][0]['directions'][0]['sprites'][0]['image']='assets/ui/enemy-health-pixel.svg'
        ok(normalized==old,'original object/art/animations preserved: '+new['name'])
    source_mapping=json.loads((ROOT/'tools/cleanup-audit/source-mapping.json').read_text())
    modified={'enemy-healthbar-runtime.js','nova-wave-manager.js','star-cannon-runtime.js'}
    for index,children,file in source_mapping:
        e=scene['events'][index];o=old_scene['events'][index]
        for child in children or []:e=e['events'][child];o=o['events'][child]
        ok(e['inlineCode']==(ROOT/'tools'/file).read_text(encoding='utf-8-sig').splitlines(),'embedded source matches: '+file)
        if file not in modified:ok(e==o,'unrelated embedded event preserved: '+file)
    normalized_events=copy.deepcopy(scene['events'])
    for index,children,file in source_mapping:
        if file not in modified:continue
        e=normalized_events[index];old=old_scene['events'][index]
        for child in children or []:e=e['events'][child];old=old['events'][child]
        e['inlineCode']=old['inlineCode']
    normalized_events[10]['events'][8]['actions'][0]['parameters'][2]='100'
    normalized_events[15]['events'][0]['inlineCode']=old_scene['events'][15]['events'][0]['inlineCode']
    ok(normalized_events==old_scene['events'],'all unrelated native event logic / event topology retained')
    for name in z.namelist():
        if name.startswith('tools/') and name.endswith('runtime.js') and Path(name).name not in modified:
            ok((ROOT/name).read_bytes()==z.read(name),'unrelated runtime byte-identical: '+name)
    ok((ROOT/'eventsFunctionsExtensions/health.json').read_bytes()==z.read('eventsFunctionsExtensions/health.json'),'native Health extension byte-identical')
    resources=project['resources']['resources'];original=old_project['resources']['resources']
    ok(resources[:-1]==original and resources[-1]['file']=='assets/ui/enemy-health-track.svg','only one HP track resource added; original323 resources retained')
    names=[r['name'] for r in resources];ok(len(names)==len(set(names)),'no duplicate resource names')
    for r in resources:ok((ROOT/r['file']).is_file(),'resource file resolves: '+r['file'])
    registered=set(names)
    for o in scene['objects']:
        for a in o.get('animations',[]):
            for d in a.get('directions',[]):
                for sprite in d.get('sprites',[]):ok(sprite['image'] in registered,'native frame has registered resource: '+o['name']+'/'+a['name'])
    object_names={o['name'] for o in scene['objects']}
    def walk_events(events):
        for e in events:
            if 'inlineCode' in e:
                source='\n'.join(e['inlineCode'])
                for literal in re.findall(r'\.(?:createObject|getObjects)\([\"\']([^\"\']+)[\"\']\)',source):
                    ok(literal in object_names,'native JS object reference exists: '+literal)
            walk_events(e.get('events',[]))
    walk_events(scene['events'])
hashes=json.loads((OUT/'before-asset-hashes.json').read_text())
for file,h in hashes.items():ok(hashlib.sha256((ROOT/file).read_bytes()).hexdigest()==h,'original asset bytes preserved: '+file)
result={'passed':len(checks),'checks':checks,'objectDefinitions':59,'resources':len(resources),'originalAssetsVerified':len(hashes)}
(OUT/'static-audit.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print('PASS',len(checks),'scoped static/hash/reference checks;59 objects/'+str(len(resources))+' resources;'+str(len(hashes))+' original assets unchanged')
