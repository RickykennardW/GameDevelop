"""Validate current project and maintained dependencies without creating backups."""
import hashlib,json,re,sys
from PIL import Image
from collections import Counter
from pathlib import Path

ROOT=Path(__file__).resolve().parent.parent
checks=[]
def ok(value,label):
    if not value:raise ValueError(label)
    checks.append(label)
def read(file):return json.loads((ROOT/file).read_text(encoding='utf-8-sig'))
p=read('Tower Defense.json')
references=[]
for key in ['layouts','eventsFunctionsExtensions','externalEvents','externalLayouts']:
    for ref in p[key]:
        if '__REFERENCE_TO_SPLIT_OBJECT' in ref:
            file=ref['referenceTo'].lstrip('/')+'.json'
            ok((ROOT/file).is_file(),'Split file exists: '+file);references.append(file)
scenes=[read(ref['referenceTo'].lstrip('/')+'.json') for ref in p['layouts']]
resources=p['resources']['resources'];byname={r['name']:r for r in resources}
ok(len(byname)==len(resources),'Unique resource identifiers')
ok(len({r['file'].casefold() for r in resources})==len(resources),'No duplicate resource file entries')
for resource in resources:
    path=(ROOT/resource['file']).resolve()
    ok(path.is_relative_to((ROOT/'assets').resolve()) and path.is_file(),'Resource file exists inside assets: '+resource['name'])
    at=ROOT
    for part in Path(resource['file']).parts:
        ok(part in {x.name for x in at.iterdir()},'Exact path spelling: '+str(at/part));at/=part
all_strings=[]
def strings(value):
    if isinstance(value,str):all_strings.append(value)
    elif isinstance(value,dict):
        for x in value.values():strings(x)
    elif isinstance(value,list):
        for x in value:strings(x)
for scene in scenes:
    def variable_value(v):
        if v['type']=='array':return [variable_value(c) for c in v.get('children',[])]
        if v['type']=='structure':return {c['name']:variable_value(c) for c in v.get('children',[])}
        return v.get('value')
    variables={v['name']:variable_value(v) for v in scene['variables']}
    if 'StarComponentConfig' in variables:
        component=variables['StarComponentConfig'];star=variables['StarCannonConfig']
        expected={f'{a}_{b}' for a in range(6) for b in range(6) if not(a>=3 and b>=3)}
        ok(set(component['States'])==expected and star['MaxLevel']==5,'Nova Spike complete 27-state matrix / cap5')
        for key,meta in component['States'].items():
            for part in ['Base','Turret']:
                ok(all(isinstance(q,list) and len(q)==2 and all(isinstance(n,(int,float)) for n in q) for q in meta[part]['Hull']),'Native numeric selection hull pairs: '+key+'/'+part)
            ok(len(meta['Turret']['Muzzles'])==(2 if int(key.split('_')[1])>=3 else 1),'Nova muzzle count: '+key)
        portraits=variables.get('MonsterPortraitConfig',{})
        portrait_object=next(o for o in scene['objects'] if o['name']=='IndexMonsterImage')
        for id,meta in portraits.items():
            animation=next(a for a in portrait_object['animations'] if a['name']==meta['Animation'])
            ok(meta['Animation']==variables['EnemyTypes'][id]['Animation'] and 'Idle' in meta['Animation'],'Portrait uses existing canonical idle animation: '+id)
            ok(meta['Image']==animation['directions'][0]['sprites'][0]['image'] and meta['Image'] in byname,'Portrait uses original first idle frame resource: '+id)
            with Image.open(ROOT/byname[meta['Image']]['file']) as original:
                im=original.convert('RGBA')
                if 'Frame' in meta:
                    x,y,w,h=meta['Frame'];ok(x>=0 and y>=0 and x+w<=im.width and y+h<=im.height,'Portrait crop stays inside atlas: '+id)
                    im=im.crop((x,y,x+w,y+h))
                alpha=im.getchannel('A');ok(alpha.getextrema()[0]==0 and alpha.getextrema()[1]>0,'Portrait preserves actual transparent background: '+id)
                l,t,r,b=alpha.point(lambda a:255 if a>=8 else 0).getbbox()
                ok(meta['VisualBounds']==[l,t,r-l,b-t],'Portrait visual bounds match original alpha pixels: '+id)
        ok(set(portraits)=={id for id,stats in variables['EnemyTypes'].items() if stats.get('Animation') in {a['name'] for a in portrait_object['animations']}},'Every active Index monster has one portrait configuration')
    names={o['name'] for o in scene['objects']}|{o['name'] for o in p['objects']}
    layers={l['name'] for l in scene['layers']}
    ok(len(names)==len(scene['objects'])+len(p['objects']),'Object names unique')
    for i in scene['instances']:ok(i['name'] in names and i['layer'] in layers,'Instance object/layer valid: '+i['name'])
    for g in scene['objectsGroups']:ok(all(x['name'] in names for x in g['objects']),'Group members valid: '+g['name'])
    leaves=[]
    def folders(node):
        if 'objectName' in node:leaves.append(node['objectName'])
        else:
            ok(bool(node.get('children')),'Nonempty editor folder: '+node['folderName'])
            for child in node['children']:folders(child)
    folders(scene['objectsFolderStructure'])
    ok(Counter(leaves)==Counter(o['name'] for o in scene['objects']),'Every object occurs once in editor folders')
    strings(scene)
    def media(value):
        if isinstance(value,dict):
            for k,v in value.items():
                if k in ['image','texture'] and isinstance(v,str) and v:ok(v in byname,'Object image/texture resolves: '+v)
                else:media(v)
        elif isinstance(value,list):
            for v in value:media(v)
    media(scene['objects'])
mapping=read('tools/source-mapping.json')
gameplay=next(s for s in scenes if s['name']=='Game Scene')
for index,path,name in mapping:
    event=gameplay['events'][index]
    for n in path:event=event['events'][n]
    source=ROOT/'tools'/name
    ok(source.is_file() and event['inlineCode']==source.read_text(encoding='utf-8-sig').splitlines(),'Runtime source/event match: '+name)
menu=next((s for s in scenes if s['name']=='MainMenu'),None)
if menu:
    ok(p['firstLayout']=='MainMenu' and scenes[0]['name']=='MainMenu','MainMenu is explicit first layout')
    ok(menu['events'][0]['inlineCode']==(ROOT/'tools/main-menu-runtime.js').read_text(encoding='utf-8-sig').splitlines(),'MainMenu maintained event/source match')
    menu_variables={v['name']:v for v in menu['variables']}
    target=next(v['value'] for v in menu_variables['MenuConfig']['children'] if v['name']=='GameplayScene')
    ok(target==gameplay['name'],'MainMenu gameplay/audio configuration reference resolves')
campaign=next((s for s in scenes if s['name']=='Levels'),None)
if campaign:
    for index,name in enumerate(['campaign-service.js','levels-runtime.js']):
        ok(campaign['events'][index]['inlineCode']==(ROOT/'tools'/name).read_text(encoding='utf-8-sig').splitlines(),'Levels maintained event/source match: '+name)
    start=next(v['value'] for v in menu_variables['MenuConfig']['children'] if v['name']=='StartScene')
    ok(start=='Levels','MainMenu Start explicitly routes to Levels')
ok(all(r['name'] in all_strings for r in resources),'Every resource is referenced by the active scene/configuration')
manifest=read('assets/audio/manifest.json')
for asset in manifest['assets']:
    name=asset.get('resourceName',asset['file'])
    ok(name in byname and byname[name]['file']==asset['file'],'Audio identifier/file mapping: '+asset['id'])
    ok(hashlib.sha256((ROOT/asset['file']).read_bytes()).hexdigest()==asset['sha256'],'Audio checksum: '+asset['id'])
allowed={r['file'] for r in resources}|{'assets/audio/manifest.json'}
actual={f.relative_to(ROOT).as_posix() for f in (ROOT/'assets').rglob('*') if f.is_file()}
ok(actual==allowed,'Only active resources and the maintained audio manifest remain in assets')
for f in ROOT.rglob('*'):
    parts=f.relative_to(ROOT).parts
    if parts and parts[0]=='.git':continue
    ok(not f.is_junction() and not f.is_symlink(),'No external dependency junction: '+str(f.relative_to(ROOT)))
    ok(not any(part.lower() in ['backup','backups','archive','old'] for part in parts),'No backup/archive directory: '+str(f.relative_to(ROOT)))
    if f.is_file():
        ok(f.suffix.lower() not in ['.bak','.old','.backup','.autosave','.zip'],'No backup file: '+str(f.relative_to(ROOT)))
        if f.suffix=='.json' and f.name!='Tower Defense.json':
            d=json.loads(f.read_text(encoding='utf-8-sig'))
            ok(not(isinstance(d,dict) and {'gdVersion','layouts','resources'}<=set(d)),'No duplicate project JSON: '+str(f.relative_to(ROOT)))
ok('NO BACKUP' in (ROOT/'AGENTS.md').read_text(),'Permanent user rule recorded in AGENTS.md')
report={'checksPassed':len(checks),'sceneCount':len(scenes),'resourceCount':len(resources),'resourceKinds':dict(Counter(r['kind'] for r in resources)),'objectCount':sum(len(s['objects']) for s in scenes),'instanceCount':sum(len(s['instances']) for s in scenes),'variableCount':sum(len(s['variables']) for s in scenes),'objectsByScene':{s['name']:len(s['objects']) for s in scenes},'runtimeSourceCount':len(mapping),'noBackupFiles':True,'checks':checks}
out=ROOT/'validation';out.mkdir(exist_ok=True)
(out/'static-checks.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='checks'}))
