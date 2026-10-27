"""Register the optional developer overlay directly, without project copies."""
import copy,json
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
path=ROOT/'layouts/game-scene.json'
scene=json.loads(path.read_text(encoding='utf-8'))
def variable(name,value):
    if isinstance(value,dict):return dict(name=name,type='structure',children=[variable(k,v) for k,v in value.items()])
    return dict(name=name,type='boolean' if isinstance(value,bool) else 'number',value=value)
for name,value in [('DEV_CHEATS_ENABLED',True),('DevCheatConfig',{'GoldLimit':1000000000,'PanelWidth':300,'PanelHeight':470,'FeedbackSeconds':1.8}),('DevUIConsumesClick',False),('DevGoldInputFocused',False)]:
    if not any(v['name']==name for v in scene['variables']):scene['variables'].append(variable(name,value))
if not any(l['name']=='DeveloperUI' for l in scene['layers']):
    layer=copy.deepcopy(next(l for l in scene['layers'] if l['name']=='AudioUI'));layer['name']='DeveloperUI'
    scene['layers'].insert(next(i for i,l in enumerate(scene['layers']) if l['name']=='GameOverUI'),layer)
mapping_path=ROOT/'tools/source-mapping.json';mapping=json.loads(mapping_path.read_text(encoding='utf-8'))
def event(name):return {'type':'BuiltinCommonInstructions::JsCode','parameterObjects':'','useStrict':True,'inlineCode':(ROOT/'tools'/name).read_text(encoding='utf-8').splitlines()}
if not any(m[2]=='developer-cheats-runtime.js' for m in mapping):
    index=len(scene['events'][0]['events']);scene['events'][0]['events'].append(event('developer-cheats-runtime.js'));mapping.append([0,[index],'developer-cheats-runtime.js'])
if not any(m[2]=='developer-cheats-after.js' for m in mapping):
    index=len(scene['events']);scene['events'].append({'type':'BuiltinCommonInstructions::Group','name':'Development-only cheat controls','events':[event('developer-cheats-after.js')]});mapping.append([index,[0],'developer-cheats-after.js'])
path.write_text(json.dumps(scene,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
mapping_path.write_text(json.dumps(mapping,indent=2)+'\n',encoding='utf-8')
print('Registered DeveloperUI and four development variables; existing settings retained')
