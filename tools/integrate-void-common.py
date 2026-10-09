"""One-shot scoped native-frame integration after backup and asset validation."""
import copy,json,uuid
from pathlib import Path
R=Path(__file__).resolve().parent.parent
SP,PP=R/'layouts/game-scene.json',R/'Tower Defense.json'
ST,PT=SP.read_text(encoding='utf-8'),PP.read_text(encoding='utf-8')
S,P=json.loads(ST),json.loads(PT)
assert not any(v['name']=='VoidCommonConfig' for v in S['variables'])
def variable(name,value):
 d={'persistentUuid':str(uuid.uuid4())}
 if name is not None:d['name']=name
 if isinstance(value,dict):d.update(type='structure',children=[variable(k,v) for k,v in value.items()])
 elif isinstance(value,list):d.update(type='array',children=[variable(None,v) for v in value])
 else:d.update(type='boolean' if isinstance(value,bool) else 'number' if isinstance(value,(int,float)) else 'string',value=value)
 return d
records={
 'VoidGuard':{'Name':'Void Guard','HP':150,'Speed':70,'Armor':10,'Reward':8,'MinimumWave':6,'Role':'Shielded Common Enemy','slug':'void_guard','RenderScale':1.8,'IdleDuration':1.2,'MoveDuration':.72,'HitDuration':.16,'DeathDuration':.65},
 'VoidSentinel':{'Name':'Void Sentinel','HP':120,'Speed':85,'Armor':0,'Reward':6,'MinimumWave':5,'Role':'Floating Common Enemy','slug':'void_sentinel','RenderScale':1.55,'IdleDuration':1.2,'MoveDuration':.64,'HitDuration':.16,'DeathDuration':.65},
 'VoidBrute':{'Name':'Void Brute','HP':220,'Speed':60,'Armor':15,'Reward':10,'MinimumWave':7,'Role':'Heavy Common Enemy','slug':'void_brute','RenderScale':2.1,'IdleDuration':1.4,'MoveDuration':1.05,'HitDuration':.18,'DeathDuration':.75}}
configs={}
types=next(v for v in S['variables'] if v['name']=='EnemyTypes')
enemy=next(o for o in S['objects'] if o['name']=='Enemy')
portrait=next(o for o in S['objects'] if o['name']=='IndexMonsterImage')
for name,data in records.items():
 manifest=json.loads((R/'assets/enemies'/data['slug']/'manifest.json').read_text())
 configs[name]={k:data[k] for k in ['RenderScale','IdleDuration','MoveDuration','HitDuration','DeathDuration']}
 types['children'].append(variable(name,{**{k:data[k] for k in ['Name','HP','Speed','Armor','Reward','MinimumWave','Role']},'Scale':1,'Tint':'255;255;255','Animation':name+'Idle_Down','AnimationPrefix':name,'SpecialAbility':'None'}))
 for direction in ['Up','Down','Left','Right']:
  polygon=[(.29,.25),(.67,.25),(.74,.53),(.67,.78),(.29,.78),(.23,.53)] if name=='VoidGuard' else [(.25,.30),(.75,.30),(.82,.52),(.72,.73),(.28,.73),(.18,.52)] if name=='VoidBrute' else [(.32,.26),(.67,.26),(.78,.5),(.67,.75),(.32,.75),(.22,.5)]
  for mode in ['Idle','Move','Hit','Death']:
   sprites=[]
   for frame in range(4):
    resource=next(f['file'] for f in manifest['frames'] if f['state']==mode and f['direction']==direction and f['frame']==frame)
    sprites.append({'hasCustomCollisionMask':True,'image':resource,'points':[],'originPoint':{'name':'origine','x':0,'y':0},'centerPoint':{'automatic':True,'name':'centre','x':0,'y':0},'customCollisionMask':[] if mode=='Death' else [[{'x':x*128,'y':y*128} for x,y in polygon]]})
   duration=data[mode+'Duration']
   animation={'name':name+mode+'_'+direction,'useMultipleDirections':False,'directions':[{'looping':mode in ['Idle','Move'],'timeBetweenFrames':duration/4,'sprites':sprites}]}
   enemy['animations'].append(animation)
   if mode=='Idle' and direction=='Down':portrait['animations'].append(copy.deepcopy(animation))
 for file in manifest['frames']:
  path=file['file'];assert (R/path).is_file();P['resources']['resources'].append({'alwaysLoaded':False,'file':path,'kind':'image','metadata':'','name':path,'smoothed':True,'userAdded':True})
S['variables'].append(variable('VoidCommonConfig',configs))
distribution=next(v for v in S['variables'] if v['name']=='EnemyWaveDistribution')
distribution['children'].append(variable('AddedTypes',[{'Type':'VoidSentinel','MinimumWave':5,'CountPerStep':2,'IncreaseEvery':3},{'Type':'VoidGuard','MinimumWave':6,'CountPerStep':2,'IncreaseEvery':4},{'Type':'VoidBrute','MinimumWave':7,'CountPerStep':1,'IncreaseEvery':5}]))
source=(R/'tools/void-common-runtime.js').read_text(encoding='utf-8')
S['events'][10]['events'][0]['events'].append({'type':'BuiltinCommonInstructions::JsCode','inlineCode':source.splitlines(),'parameterObjects':'','useStrict':True})
map_path=R/'tools/cleanup-audit/source-mapping.json';mapping=json.loads(map_path.read_text())
for idx,children,file in mapping:
 event=S['events'][idx]
 for child in children:event=event['events'][child]
 event['inlineCode']=(R/'tools'/file).read_text(encoding='utf-8-sig').splitlines()
def save(path,source,data,keys):
 decoder,cursor,changes=json.JSONDecoder(),1,[]
 while cursor<len(source):
  while source[cursor].isspace() or source[cursor]==',':cursor+=1
  if source[cursor]=='}':break
  key,length=decoder.raw_decode(source[cursor:]);cursor+=length
  while source[cursor].isspace() or source[cursor]==':':cursor+=1
  _,length=decoder.raw_decode(source[cursor:])
  if key in keys:changes.append((cursor,length,json.dumps(data[key],indent=2,ensure_ascii=False).replace('\n','\n  ')))
  cursor+=length
 for cursor,length,value in reversed(changes):source=source[:cursor]+value+source[cursor+length:]
 assert json.loads(source)==data;path.write_text(source,encoding='utf-8')
save(SP,ST,S,{'events','objects','variables'});save(PP,PT,P,{'resources'})
p=R/'tools/embed-free-placement.py';text=p.read_text().replace("(10, (0, 2), 'void-hound-runtime.js'),", "(10, (0, 2), 'void-hound-runtime.js'), (10, (0, 3), 'void-common-runtime.js'),");p.write_text(text,encoding='utf-8')
mapping.append([10,[0,3],'void-common-runtime.js']);map_path.write_text(json.dumps(mapping,indent=2),encoding='utf-8')
print('INTEGRATED3 types;192 native128px frames;48 states; no attack; existing59objects retained')
