"""Apply the reviewed numerical balance without touching artwork, instances or layout.

Run analyze-game-balance.cjs first; then embed-free-placement.py after this.
Preserves original variable UUIDs and native event structure.
"""
import copy, json
from pathlib import Path

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'design_previews/gameplay_balance'
scene_path=ROOT/'layouts/game-scene.json'; project_path=ROOT/'Tower Defense.json'
scene_source=scene_path.read_text(encoding='utf-8'); project_source=project_path.read_text(encoding='utf-8')
scene=json.loads(scene_source); project=json.loads(project_source)
candidate=json.loads((OUT/'balance-analysis.json').read_text(encoding='utf-8'))['candidate']

def assign(var,value):
    if isinstance(value,dict):
        var['type']='structure'; existing={v['name']:v for v in var.get('children',[])}
        var['children']=[assign(existing.get(k,{'name':k}),v) for k,v in value.items()]
    elif isinstance(value,list):
        var['type']='array'; existing=var.get('children',[])
        var['children']=[assign(existing[i] if i<len(existing) else {},v) for i,v in enumerate(value)]
    else:
        var['type']='boolean' if isinstance(value,bool) else 'number' if isinstance(value,(int,float)) else 'string'
        var['value']=value
    return var

variables={v['name']:v for v in scene['variables']}
def setvar(name,value):
    if name not in variables:
        variables[name]={'name':name}; scene['variables'].append(variables[name])
    assign(variables[name],value)

c=copy.deepcopy(candidate['StarCannonConfig']); c['ExplosionRadius']=64
descriptions=[['Damage: 50 -> 56','Damage: 56 -> 62\nRange +4%','25% splash\n64-unit radius','Damage: 62 -> 74\n40% splash\n84-unit radius'],
              ['Attack speed +10%','Attack speed: +22% total\nRange +4%','2 shots\n62% damage each','3 shots\n56% damage each']]
for p,path in enumerate(c['Paths']):
    for i,u in enumerate(path['Upgrades']):u['Description']=descriptions[p][i]
setvar('StarCannonConfig',c)
for key in ['EnemyWaveDistribution','WavePacing','WaveCompletionReward']:setvar(key,candidate[key])
setvar('EnemyHPBarConfig',{'Height':6,'ZOrder':20000,'Types':{
    'Basic':{'Width':24,'HeadOffset':40},'VoidHound':{'Width':30,'HeadOffset':60},
    'VoidGuard':{'Width':30,'HeadOffset':48},'VoidSentinel':{'Width':26,'HeadOffset':42},
    'VoidBrute':{'Width':36,'HeadOffset':55}}})

reward_event=scene['events'][10]['events'][8]
money_action=next(a for a in reward_event['actions'] if a['parameters'][0]=='Money')
assert money_action['parameters'][2] in ['100','WaveCompletionReward']
money_action['parameters'][2]='WaveCompletionReward'
banner=scene['events'][15]['events'][0]
banner['inlineCode']=[line.replace('?"+100 GOLD":""','?"+"+sv.get("WaveCompletionReward").getAsNumber()+" GOLD":""') for line in banner['inlineCode']]

background=next(o for o in scene['objects'] if o['name']=='HealthBarBackground')
background['animations'][0]['directions'][0]['sprites'][0]['image']='assets/ui/enemy-health-track.svg'
resources=project['resources']['resources']
if not any(r.get('file')=='assets/ui/enemy-health-track.svg' for r in resources):
    resource=copy.deepcopy(next(r for r in resources if r.get('file')=='assets/ui/enemy-health-pixel.svg'))
    resource['file']='assets/ui/enemy-health-track.svg'; resource['name']='assets/ui/enemy-health-track.svg'; resources.append(resource)

def replace_sections(source,data,keys):
    decoder=json.JSONDecoder();cursor=1;edits=[]
    while cursor<len(source):
        while source[cursor].isspace() or source[cursor]==',':cursor+=1
        if source[cursor]=='}':break
        key,length=decoder.raw_decode(source[cursor:]);cursor+=length
        while source[cursor].isspace() or source[cursor]==':':cursor+=1
        _,length=decoder.raw_decode(source[cursor:])
        if key in keys:edits.append((cursor,cursor+length,json.dumps(data[key],indent=2,ensure_ascii=False).replace('\n','\n  ')))
        cursor+=length
    for start,end,value in reversed(edits):source=source[:start]+value+source[end:]
    assert json.loads(source)==data
    return source

scene_path.write_text(replace_sections(scene_source,scene,{'variables','events','objects'}),encoding='utf-8')
project_path.write_text(replace_sections(project_source,project,{'resources'}),encoding='utf-8')
print('Applied reviewed balance / HP track; no scene instances, layer geometry or enemy art edited')
