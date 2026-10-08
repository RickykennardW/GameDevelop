"""Replace only the active enemy archetype/wave count and scoped rendering/death code."""
import json,copy,uuid,hashlib
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parent.parent;sp=root/'layouts/game-scene.json';pp=root/'Tower Defense.json'
st=sp.read_text(encoding='utf-8');pt=pp.read_text(encoding='utf-8');s=json.loads(st);p=json.loads(pt)
def var(name,value):
 v={'persistentUuid':str(uuid.uuid4())}
 if name is not None:v['name']=name
 if isinstance(value,dict):v.update(type='structure',children=[var(k,x) for k,x in value.items()])
 elif isinstance(value,list):v.update(type='array',children=[var(None,x) for x in value])
 else:v.update(type='boolean' if isinstance(value,bool) else 'number' if isinstance(value,(int,float)) else 'string',value=value)
 return v
def getvar(name):return next(v for v in s['variables'] if v['name']==name)
def upsert(name,value):
 v=next((v for v in s['variables'] if v['name']==name),None)
 if v:v.clear();v.update(var(name,value))
 else:s['variables'].append(var(name,value))
def obj(name):return next(o for o in s['objects'] if o['name']==name)
def js(file,parameters=''):return {'type':'BuiltinCommonInstructions::JsCode','inlineCode':(root/'tools'/file).read_text(encoding='utf-8-sig').splitlines(),'parameterObjects':parameters,'useStrict':True}
if not any(v['name']=='LegacyEnemyTypes' for v in s['variables']):
 legacy=copy.deepcopy(getvar('EnemyTypes'));legacy['name']='LegacyEnemyTypes';s['variables'].append(legacy)
 legacy=copy.deepcopy(getvar('WaveConfigs'));legacy['name']='LegacyWaveConfigs';s['variables'].append(legacy)
upsert('EnemyTypes',{'Basic':{'Name':'Nova Wisp','HP':100,'Speed':80,'Reward':5,'Armor':0,'Scale':1,'Tint':'255;255;255','Animation':'NovaIdle_Down'}})
upsert('WaveConfigs',[{'Count':wave*4,'Basic':wave*4,'SpawnInterval':.9} for wave in range(1,51)])
views=json.loads((root/'assets/nova_wisp/views.json').read_text())
upsert('NovaWispConfig',{'Name':'Nova Wisp','EnemyType':'Basic','HP':100,'Speed':80,'Armor':0,'Reward':5,'SpawnInterval':.9,'LogicalSize':48,'DeathDuration':.65,'Views':views})
enemy=obj('Enemy');template=copy.deepcopy(enemy['animations'][0]);legacy=[a for a in enemy['animations'] if not a['name'].startswith('Nova')]
animations=[]
for mode in ['Idle','Move','Hit','Death']:
 for direction,m in views.items():
  a=copy.deepcopy(template);a['name']='Nova'+mode+'_'+direction;a['directions'][0]['looping']=mode!='Death';a['directions'][0]['timeBetweenFrames']=.12
  frame=copy.deepcopy(a['directions'][0]['sprites'][0]);w,h=Image.open(root/m['Image']).size;frame['image']=m['Image'];frame['originPoint']={'name':'origine','x':0,'y':0};frame['centerPoint']={'automatic':True,'name':'centre','x':0,'y':0};frame['points']=[];frame['hasCustomCollisionMask']=True
  import math
  frame['customCollisionMask']=[[{'x':w*(.5+.24*math.cos(i*math.pi/4)),'y':h*(.5+.24*math.sin(i*math.pi/4))} for i in range(8)]]
  a['directions'][0]['sprites']=[frame];animations.append(a)
enemy['animations']=animations+legacy
values={v['name']:v.get('value') for v in enemy['variables']};values.update(EnemyName='Nova Wisp',EnemyType='Basic',MoveSpeed=80,GoldReward=5,Armor=0,Facing='Right',MovementAnimation='NovaMove_Right',IdleAnimation='NovaIdle_Right',AnimationReferenceSpeed=80,RewardPaid=False)
enemy['variables']=[var(k,v) for k,v in values.items()]
if not any(o['name']=='NovaWispDeathVisual' for o in s['objects']):
 d=copy.deepcopy(enemy);d['name']='NovaWispDeathVisual';d['persistentUuid']=str(uuid.uuid4());d['variables']=[];d['behaviors']=[];d['effects']=[];d['animations']=[a for a in animations if a['name'].startswith('NovaDeath_')];s['objects'].append(d);s['objectsFolderStructure']['children'].append({'objectName':d['name']})
events=s['events'][10]['events']
if events[0].get('name')=='Original startup + Nova Wisp system':
 events[0]['events'][1]=js('nova-wisp-runtime.js')
else:
 events[0]={'type':'BuiltinCommonInstructions::Group','name':'Original startup + Nova Wisp system','events':[events[0],js('nova-wisp-runtime.js')]}
events[1]=js('nova-wave-manager.js');events[2]=js('nova-spawn-runtime.js');events[3]['events'][0]=js('nova-movement-runtime.js','MonsterEnemies');events[12]=js('nova-death-runtime.js')
if not any(c['type']['value']=='Health::Health::IsDead' for c in events[4]['conditions']):events[4]['conditions'].append({'type':{'inverted':True,'value':'Health::Health::IsDead'},'parameters':['MonsterEnemies','Health','']})
existing={r['name'] for r in p['resources']['resources']}
for file in sorted((root/'assets/nova_wisp').glob('*.png')):
 name=file.relative_to(root).as_posix()
 if name not in existing:p['resources']['resources'].append({'alwaysLoaded':False,'file':name,'kind':'image','metadata':'','name':name,'smoothed':True,'userAdded':True})
image=obj('IndexMonsterImage')
if not any(a['name']=='NovaIdle_Down' for a in image['animations']):image['animations'].append(copy.deepcopy(next(a for a in animations if a['name']=='NovaIdle_Down')))
def save_fields(path,source,data,keys):
 dec=json.JSONDecoder();cur=1;changes=[]
 while cur<len(source):
  while source[cur].isspace() or source[cur]==',':cur+=1
  if source[cur]=='}':break
  key,n=dec.raw_decode(source[cur:]);cur+=n
  while source[cur].isspace() or source[cur]==':':cur+=1
  _,n=dec.raw_decode(source[cur:])
  if key in keys:changes.append((cur,n,json.dumps(data[key],indent=2,ensure_ascii=False).replace('\n','\n  ')))
  cur+=n
 for start,n,t in reversed(changes):source=source[:start]+t+source[start+n:]
 assert json.loads(source)==data;path.write_text(source,encoding='utf-8')
save_fields(sp,st,s,{'objects','objectsFolderStructure','variables','events'});save_fields(pp,pt,p,{'resources'})
print('Nova Wisp: four views; 16 named animated states; Basic only; wave Ã—4; legacy preserved')
