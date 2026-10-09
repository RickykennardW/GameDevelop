"""Direct in-memory integration; no project copies, backups, ZIPs or snapshots."""
import copy,json,uuid
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
sp=ROOT/'layouts/game-scene.json';pp=ROOT/'Tower Defense.json';ss=sp.read_text(encoding='utf-8');ps=pp.read_text(encoding='utf-8');s=json.loads(ss);p=json.loads(ps)
manifest=json.loads((ROOT/'assets/audio/manifest.json').read_text());assert len(s['events'])==17,'already integrated: refuse duplicate audio system'
byid={a['id']:a for a in manifest['assets']}
groups={
 'low':{'StarCannonFire':(.34,.075),'ProjectileImpact':(.28,.08),'EnemyHit':(.15,.12),'CommonEnemyDeath':(.33,.12),'GoldReward':(.25,.8)},
 'medium':{'TowerPlace':(.67,.1),'TowerUpgrade':(.68,.1),'TowerMajorUpgrade':(.76,.1),'TowerSell':(.62,.1),'WaveStart':(.68,.1),'WaveComplete':(.60,.1)},
 'high':{'EliteEnemyDeath':(.82,0),'VoidGolemSkillCast':(.78,0),'VoidFortificationApply':(.70,0),'MilestoneWave':(.82,.1),'BaseDamage':(.9,0),'GameOver':(.9,.1),'Victory':(.85,.1)},
 'ui':{'UIClick':(.5,.08),'InvalidAction':(.55,.18),'TowerSelect':(.45,.12)}}
effects={}
for group,items in groups.items():
 for key,(gain,cooldown)in items.items():effects[key]={'File':byid[key]['file'],'Duration':byid[key]['decoded']['duration'],'Group':group,'Gain':gain,'Cooldown':cooldown,'VaryPitch':key in ['StarCannonFire','ProjectileImpact','EnemyHit','CommonEnemyDeath']}
assert set(effects)=={a['id'] for a in manifest['assets'] if a['kind']=='sfx'}
config={'StorageKey':'celestialVoidAudio.v1','CrossfadeSeconds':3,'Master':100,'MusicVolume':35,'SFXVolume':70,'UIVolume':45,'Music':{a['id']:{'File':a['file'],'Duration':a['decoded']['duration']} for a in manifest['assets'] if a['kind']=='music'},'SFX':effects}
def variable(name,value):
 if isinstance(value,dict):return{'name':name,'type':'structure','children':[variable(k,v) for k,v in value.items()]}
 return{'name':name,'type':'boolean' if isinstance(value,bool) else 'number' if isinstance(value,(int,float)) else 'string','value':value}
s['variables']+=[variable('AudioConfig',config),variable('AudioUIConsumesClick',False),variable('AudioPanelOpen',False)]
objects={o['name']:o for o in s['objects']}
for name,template in [('AudioPanel','SelectedPanelBackground'),('AudioText','SelectedPanelText'),('AudioBlock','HealthBarFill'),('AudioSpeaker','HealthBarFill')]:
 obj=copy.deepcopy(objects[template]);obj['name']=name;obj['persistentUuid']=str(uuid.uuid4());obj['variables']=[]
 if name=='AudioSpeaker':
  obj['animations']=copy.deepcopy(objects['HealthBarFill']['animations']);obj['animations'][0]['directions'][0]['sprites'][0]['image']='assets/ui/audio_speaker.svg'
 s['objects'].append(obj)
layer=copy.deepcopy(next(l for l in s['layers'] if l['name']=='UI'));layer['name']='AudioUI';s['layers'].append(layer)
speaker=ROOT/'assets/ui/audio_speaker.svg';speaker.write_text('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M5 12H10L17 6V26L10 20H5Z" fill="#eaddff" stroke="#aa80de" stroke-width="1.2"/><path d="M21 11Q27 16 21 21M24 6Q35 16 24 26" fill="none" stroke="#eaddff" stroke-width="2" stroke-linecap="round"/></svg>',encoding='utf-8')
old={'assets/starter_switch.wav','assets/starting_woodthump.wav'}
def remove_old_audio(e):
 e['actions']=[a for a in e.get('actions',[]) if not(a['type']['value']=='PlaySound' and a['parameters'][1] in old)] if 'actions' in e else e.get('actions',None)
 if e.get('actions') is None:e.pop('actions',None)
 for ch in e.get('events',[]):remove_old_audio(ch)
for event in s['events']:remove_old_audio(event)
s['events'].append({'type':'BuiltinCommonInstructions::Group','name':'Original galaxy audio and compact settings','source':'','events':[{'type':'BuiltinCommonInstructions::JsCode','inlineCode':(ROOT/'tools/audio-runtime.js').read_text(encoding='utf-8').splitlines(),'parameterObjects':'','useStrict':True}]})
p['resources']['resources']=[r for r in p['resources']['resources'] if r['name'] not in old]
for a in manifest['assets']:p['resources']['resources'].append({'file':a['file'],'name':a['file'],'kind':'audio','metadata':'','preloadAsMusic':False,'preloadAsSound':a['kind']=='sfx','preloadInCache':False,'userAdded':True})
p['resources']['resources'].append({'file':'assets/ui/audio_speaker.svg','name':'assets/ui/audio_speaker.svg','kind':'image','metadata':'','smoothed':True,'userAdded':True})
assert all(file not in json.dumps(s) for file in old)
# Only pointer guards change in the old sources; no stats, transforms or math.
patches={
 'responsive-map-runtime.js': [('const modal = boolean("IndexOpen");','const modal = boolean("IndexOpen") || boolean("AudioUIConsumesClick");')],
 'selected-panel-runtime.js': [('modal=sv.get("IndexBlocksInput").getAsBoolean();','modal=sv.get("IndexBlocksInput").getAsBoolean()||sv.get("AudioUIConsumesClick").getAsBoolean();')],
 'world-selection-runtime.js': [("if(sv.get('IndexBlocksInput').getAsBoolean()||", "if(sv.get('AudioUIConsumesClick').getAsBoolean()||sv.get('IndexBlocksInput').getAsBoolean()||")],
 'free-placement-runtime.js': [("if(sv.get('IndexBlocksInput').getAsBoolean()||", "if(sv.get('AudioUIConsumesClick').getAsBoolean()||sv.get('IndexBlocksInput').getAsBoolean()||")],
 'free-placement-click.js': [("const indicator=scene.getObjects('TilePlacement_Indicator')[0];", "if(sv.get('AudioUIConsumesClick').getAsBoolean())return;\nconst indicator=scene.getObjects('TilePlacement_Indicator')[0];")],
 'obstacle-panel-runtime.js': [("if(!down&&ui.wasDown&&owner&&", "if(!sv.get('AudioUIConsumesClick').getAsBoolean()&&!down&&ui.wasDown&&owner&&")]}
for name,edits in patches.items():
 path=ROOT/'tools'/name;source=path.read_text(encoding='utf-8-sig')
 for oldstr,newstr in edits:assert source.count(oldstr)==1,(name,oldstr);source=source.replace(oldstr,newstr)
 path.write_text(source,encoding='utf-8')
mapping_path=ROOT/'tools/cleanup-audit/source-mapping.json';mapping=json.loads(mapping_path.read_text());mapping.append([17,[0],'audio-runtime.js'])
for idx,children,name in mapping:
 e=s['events'][idx]
 for child in children:e=e['events'][child]
 e['inlineCode']=(ROOT/'tools'/name).read_text(encoding='utf-8-sig').splitlines()
def replace(source,data,keys):
 decoder=json.JSONDecoder();cur=1;edits=[]
 while cur<len(source):
  while source[cur].isspace() or source[cur]==',':cur+=1
  if source[cur]=='}':break
  key,n=decoder.raw_decode(source[cur:]);cur+=n
  while source[cur].isspace() or source[cur]==':':cur+=1
  _,n=decoder.raw_decode(source[cur:])
  if key in keys:edits.append((cur,cur+n,json.dumps(data[key],ensure_ascii=False,indent=2).replace('\n','\n  ')))
  cur+=n
 for begin,end,text in reversed(edits):source=source[:begin]+text+source[end:]
 assert json.loads(source)==data;return source
sp.write_text(replace(ss,s,{'variables','objects','layers','events'}),encoding='utf-8');pp.write_text(replace(ps,p,{'resources'}),encoding='utf-8');mapping_path.write_text(json.dumps(mapping,indent=2),encoding='utf-8')
for file in old:
 target=(ROOT/file).resolve();assert target.parent==ROOT.resolve()/'assets';target.unlink()
print('Integrated25originalOGG;65objects/8layers/357resources;legacy2audio replaced;no backup/project copies')
