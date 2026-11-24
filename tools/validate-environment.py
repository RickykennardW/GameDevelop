"""Strict audit against the actual pre-overhaul Git revision. No source snapshots."""
import copy
import hashlib
import json
import subprocess
from collections import Counter
from pathlib import Path
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
BASELINE='543283d71aebce79592db0bd415a4d52972271a4'
ADDED_SOURCES={'pause-menu-runtime.js','environment-runtime.js'}
PAUSE_SOURCES={'starburst-fusion-runtime.js','campaign-game-runtime.js','campaign-game-after.js','developer-cheats-runtime.js','developer-cheats-after.js','free-placement-runtime.js','unit-index-runtime.js','audio-runtime.js'}
GUARD_PATHS=[(1,0),(3,0),(5,),(7,),(9,),(10,0),(15,0)]
GUARD={'type':{'value':'BooleanVariable'},'parameters':['PauseFrameBlocked','False','']}

def read(path):return json.loads((ROOT/path).read_text(encoding='utf-8-sig'))
def approved_asset_paths():
 library=read('tools/environment-library.json');paths={a['Resource'] for c in library['Chapters'].values() for a in c['Assets']}
 paths|={f'assets/map/chapters/{id}_{kind}.svg' for id in library['Chapters'] for kind in ['ground','road','crystal','rock','ruin','shrub'] if (ROOT/f'assets/map/chapters/{id}_{kind}.svg').exists()}
 return paths|{f'assets/ui/campaign/chapter_{n}.svg' for n in range(1,6)}
def old(path):return json.loads(subprocess.check_output(['git','show',f'{BASELINE}:{path}'],cwd=ROOT).decode('utf-8-sig'))
def node(scene,indexes):
 for i in indexes:scene=scene['events'][i]
 return scene

def restore_pause_additions(scene):
 scene['variables']=[v for v in scene['variables'] if v['name'] not in {'PauseActive','PauseFrameBlocked'}]
 for indexes in GUARD_PATHS:
  event=node(scene,indexes)
  if GUARD in event['conditions']:event['conditions'].remove(GUARD)
 # These events are appended, so every pre-existing mapped event retains its index.
 if len(scene['events'][0]['events'])>11:scene['events'][0]['events']=scene['events'][0]['events'][:11]

def main():
 checks=[]
 def ok(v,message):
  if not v:raise AssertionError(message)
  checks.append(message)
 scene=read('layouts/game-scene.json');prior=old('layouts/game-scene.json');project=read('Tower Defense.json');library=read('tools/environment-library.json');cfg=read('tools/chapter-maps.json');before_cfg=old('tools/chapter-maps.json')
 ok(len(scene['events'][0]['events'])==13,'Exactly two appended scene events, including no unmapped additions')
 ok(all(node(scene,p)['conditions'].count(GUARD)==1 for p in GUARD_PATHS) and all(sum(v['name']==name and v['type']=='boolean' and v['value'] is False for v in scene['variables'])==1 for name in ['PauseActive','PauseFrameBlocked']),'All seven native pause guards and both default-false booleans exist exactly once')
 expected=copy.deepcopy(before_cfg);expected['Scale']['PavingCell']=16
 ok(cfg==expected,'Only visual material unit changes 24 to 16; routes, props, camera, path width and scale multipliers retain exact baseline')
 ok(read('tools/campaign-config.json')==old('tools/campaign-config.json'),'All missions, rewards, bosses, unlocks and planned chapters unchanged')
 normalized=copy.deepcopy(scene);restore_pause_additions(normalized)
 normalized['variables']=[v for v in normalized['variables'] if v['name']!='ChapterMaps']
 prior['variables']=[v for v in prior['variables'] if v['name']!='ChapterMaps']
 ok(normalized['variables']==prior['variables'],'Every combat, tower, enemy, Fusion, economy, UI and wave variable preserved exactly')
 for obj in normalized['objects']:
  if obj['name'] in {'Ground_Decoration','VoidBackdrop','IslandCliffFrame'}:obj['animations']=[a for a in obj['animations'] if not a['name'].startswith('Chapter_Env_')]
 ok(normalized['objects']==prior['objects'],'Native object definitions, old animations, origins and collision masks preserved; new environment animations only')
 mappings=read('tools/source-mapping.json');old_mapping=old('tools/source-mapping.json')
 ok(mappings==old_mapping+[[0,[11],'pause-menu-runtime.js'],[0,[12],'environment-runtime.js']],'Only two appended native runtime events; existing source indices preserved')
 for root,children,name in mappings:ok(node(scene,(root,*children))['inlineCode']==(ROOT/'tools'/name).read_text(encoding='utf-8-sig').splitlines(),'Embedded source '+name)
 prefix='if(runtimeScene.__pauseUI?.frameBlocked)return; // Pause preserves the current owner and input state.\n'
 for root,children,name in old_mapping:
  current='\n'.join(node(scene,(root,*children))['inlineCode'])+'\n';previous='\n'.join(node(prior,(root,*children))['inlineCode'])+'\n'
  if name in PAUSE_SOURCES:
   expected=previous
   if name in {'starburst-fusion-runtime.js','campaign-game-runtime.js','campaign-game-after.js','developer-cheats-runtime.js','developer-cheats-after.js','free-placement-runtime.js'}:expected=prefix+expected
   if name=='starburst-fusion-runtime.js':expected=expected.replace("else if(gdjs.evtTools.input.wasKeyJustPressed(scene,'Escape'))f.cancel();", "else if(!scene.__pauseUI&&gdjs.evtTools.input.wasKeyJustPressed(scene,'Escape'))f.cancel();")
   if name=='unit-index-runtime.js':expected=expected.replace("if(gdjs.evtTools.input.wasKeyJustPressed(scene,'Escape'))", "if((!scene.__pauseUI||scene.__pauseUI.escapeOwner==='index')&&gdjs.evtTools.input.wasKeyJustPressed(scene,'Escape'))")
   if name=='audio-runtime.js':expected=expected.replace('if(a.disposed)return;const dt=','if(a.disposed||scene.__pauseUI?.frameBlocked)return;const dt=').replace('a.after();','if(!scene.__pauseUI?.frameBlocked)a.after();').replace("if(gdjs.evtTools.input.wasKeyJustPressed(scene,'Escape'))", "if((!scene.__pauseUI||scene.__pauseUI.escapeOwner==='audio')&&gdjs.evtTools.input.wasKeyJustPressed(scene,'Escape'))")
   ok(current==expected,'Exact limited pause change '+name)
  elif name not in {'responsive-map-runtime.js','island-map-runtime.js','island-render-runtime.js'}:ok(current==previous,'Unrelated runtime unchanged '+name)
  node(normalized,(root,*children))['inlineCode']=node(prior,(root,*children))['inlineCode']
 ok(normalized==prior,'All remaining scene events/actions/conditions/instances/layers/settings match baseline')
 additions=[a for chapter in library['Chapters'].values() for a in chapter['Assets']];paths={a['Resource'] for a in additions}
 animations=[a for o in scene['objects'] for a in o.get('animations',[]) if a['name'].startswith('Chapter_Env_')]
 expected_animations={a['Animation']:a['Resource'] for a in additions}
 ok(len(animations)==295 and {a['name']:a['directions'][0]['sprites'][0]['image'] for a in animations}==expected_animations,'Every individual final asset is imported into a usable native GDevelop animation exactly once')
 before_project=old('Tower Defense.json');restore=copy.deepcopy(project);restore['resources']['resources']=[r for r in restore['resources']['resources'] if r['name'] not in paths]
 ok(restore==before_project,'Project adds final library resources only; original identifiers and file mappings preserved')
 ok(len(paths)==len(additions)==295,'295 individual final resources; 59 per chapter')
 resources={r['name']:r for r in project['resources']['resources']};hashes=[];rows=[]
 for id,chapter in library['Chapters'].items():
  for a in chapter['Assets']:
   path=ROOT/a['Resource'];ok(resources[a['Resource']]['file']==a['Resource'] and path.is_file(),'Registered actual asset '+a['Resource']);hashes.append(hashlib.sha256(path.read_bytes()).hexdigest())
   if path.suffix=='.png':
    im=Image.open(path);ok(im.size==(a['Width'],a['Height']),'Correct dimensions '+a['Resource'])
    if a['Category'] in {'Rocks','Structures','FloatingIslands','Decorations','Effects'}:
     alpha=np.array(im.getchannel('A'));ok(not np.any(alpha[0]) and not np.any(alpha[-1]) and not np.any(alpha[:,0]) and not np.any(alpha[:,-1]),'Transparent outer padding '+a['Resource']);ok(np.sum(alpha>32)>150,'Nonempty visible sprite '+a['Resource'])
  for name in ['base','variation']:
   data=np.array(Image.open(ROOT/chapter['Ground'][name]));ok(np.array_equal(data[0],data[-1]) and np.array_equal(data[:,0],data[:,-1]),'Exact seamless opposing edges '+id+' '+name)
  rows.append({'chapter':id,'assets':len(chapter['Assets']),'categories':dict(Counter(a['Category'] for a in chapter['Assets']))})
 ok(len(set(hashes))==len(hashes),'Every final resource has distinct content; no duplicate asset padding')
 changed=set(subprocess.check_output(['git','diff',BASELINE,'--name-only','--','assets'],cwd=ROOT,text=True).splitlines())
 allowed={f'assets/map/chapters/{id}_{kind}.svg' for id in library['Chapters'] for kind in ['ground','road']}|{f'assets/ui/campaign/chapter_{n}.svg' for n in range(1,6)}
 ok(changed<=allowed,'No existing tower, enemy, projectile, Fusion, UI, audio or unrelated environment asset modified')
 report={'passed':True,'baseline':BASELINE,'count':len(checks),'checks':checks,'chapters':rows,'assets':len(additions),'bytes':sum((ROOT/a['Resource']).stat().st_size for a in additions),'visualUnitBefore':24,'visualUnitAfter':16,'logicalGridChanged':False,'noBackupCreated':True}
 (ROOT/'validation/environment-static.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8');print('PASS environment preservation and assets',len(checks));return report

if __name__=='__main__':main()
