"""Register cinematic defeat in place, retaining native gameplay events intact."""
import copy, json, uuid
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
path=ROOT/'layouts/game-scene.json';scene=json.loads(path.read_text(encoding='utf-8'))
menu=json.loads((ROOT/'layouts/main-menu.json').read_text(encoding='utf-8'))
def pack(name,value):
    v={'name':name,'persistentUuid':str(uuid.uuid4())}
    if isinstance(value,dict):return {**v,'type':'structure','children':[pack(k,x) for k,x in value.items()]}
    return {**v,'type':'boolean' if isinstance(value,bool) else 'number' if isinstance(value,(int,float)) else 'string','value':value}
config={'RedSeconds':1.8,'TitleSeconds':.45,'PromptSeconds':.2,'BlackSeconds':.55,'ButtonsSeconds':.25,'LeaveSeconds':.28,'InitialOpacity':.12,'RedOpacity':.60,'BlackOpacity':.70,'RedTint':0x550e28,'BlackTint':0x05060e}
for name,value in [('DefeatActive',False),('DefeatPhase','IDLE'),('GameOverUIConfig',config)]:
    if not any(v['name']==name for v in scene['variables']):scene['variables'].append(pack(name,value))
objects=[]
for name,source,label in [('DefeatRestart','MenuStart',None),('DefeatMainMenu','MenuExit',None),('DefeatRestartLabel','MenuStartLabel','RESTART'),('DefeatMainMenuLabel','MenuExitLabel','MAIN MENU')]:
    if any(o['name']==name for o in scene['objects']):continue
    o=copy.deepcopy(next(o for o in menu['objects'] if o['name']==source));o['name']=name;o['persistentUuid']=str(uuid.uuid4())
    if label:o['string']=label;o['content']['text']=label
    scene['objects'].append(o);objects.append(name)
if objects:
    ui=next(f for f in scene['objectsFolderStructure']['children'] if f.get('folderName')=='06_UI')
    ui['children'].append({'folderName':'GameOver','children':[{'objectName':name} for name in objects]})
if not any(l['name']=='GameOverUI' for l in scene['layers']):
    layer=copy.deepcopy(menu['layers'][1]);layer.update(name='GameOverUI',visibility=False);scene['layers'].append(layer)
condition={'type':{'value':'BooleanVariable'},'parameters':['DefeatActive','False','']}
mapping_path=ROOT/'tools/source-mapping.json';mapping=json.loads(mapping_path.read_text())
for root in [1,3,10,15]:
    group=scene['events'][root]
    guarded=len(group['events'])==1 and condition in group['events'][0].get('conditions',[])
    if not guarded:
        group['events']=[{'type':'BuiltinCommonInstructions::Standard','conditions':[copy.deepcopy(condition)],'actions':[],'events':group['events']}]
        for entry in mapping:
            if entry[0]==root:entry[1]=[0]+entry[1]
for root in [5,7,9]:
    event=scene['events'][root]
    if condition not in event['conditions']:event['conditions'].append(copy.deepcopy(condition))
name='Starfall cinematic defeat'
index=next((i for i,e in enumerate(scene['events']) if e.get('name')==name),None)
if index is None:
    index=len(scene['events']);scene['events'].append({'type':'BuiltinCommonInstructions::Group','name':name,'parameters':[],'events':[{'type':'BuiltinCommonInstructions::JsCode','parameterObjects':'','useStrict':True,'inlineCode':[]}]})
entry=[index,[0],'game-over-runtime.js']
if entry not in mapping:mapping.append(entry)
mapping_path.write_text(json.dumps(mapping,indent=2)+'\n',encoding='utf-8')
path.write_text(json.dumps(scene,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Defeat state/config, four reused button definitions, GameOverUI layer and guarded native events registered. No resource or balancing changes.')
