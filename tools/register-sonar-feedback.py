"""Register feedback configuration/resources directly; preserve existing tuning."""
import json,uuid
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
def pack(name,value):
    v={'name':name,'persistentUuid':str(uuid.uuid4())}
    if isinstance(value,dict):return {**v,'type':'structure','children':[pack(k,x) for k,x in value.items()]}
    return {**v,'type':'boolean' if isinstance(value,bool) else 'number' if isinstance(value,(int,float)) else 'string','value':value}
scene_path=ROOT/'layouts/game-scene.json';scene=json.loads(scene_path.read_text())
configs={
 'PlacementFeedbackConfig':{'Duration':1.2,'Cooldown':.65,'Sound':'PurchaseDenied'},
 'CelestialSonarConfig':{'Enabled':True,'WarningSeconds':6,'CriticalSeconds':2.5,'WarningRepeatSeconds':6,'CriticalRepeatSeconds':3,'DeescalationSeconds':.25,'HysteresisSeconds':.25,'GlobalCooldown':1,'WarningPeriod':2,'CriticalPeriod':1.2,'ReducedMotion':False,'WarningSound':'SonarWarning','CriticalSound':'SonarCritical'}
}
for name,value in configs.items():
    if not any(v['name']==name for v in scene['variables']):scene['variables'].append(pack(name,value))
sfx=next(v for v in scene['variables'] if v['name']=='AudioConfig')['children'];sfx=next(v for v in sfx if v['name']=='SFX')['children']
for name,file,duration,gain,group,cooldown in [
 ('PurchaseDenied','assets/audio/ui/purchase_denied.ogg',.34,.55,'medium',.65),
 ('SonarWarning','assets/audio/gameplay/sonar_warning.ogg',1.12,.6,'medium',1),
 ('SonarCritical','assets/audio/gameplay/sonar_critical.ogg',.86,.67,'high',1)]:
    if not any(v['name']==name for v in sfx):sfx.append(pack(name,{'File':file,'Duration':duration,'Gain':gain,'Group':group,'Cooldown':cooldown,'VaryPitch':False}))
conditions=scene['events'][5]['conditions']
scene['events'][5]['conditions']=[c for c in conditions if not(c['type']['value']=='NumberVariable' and c['parameters']==['Money','>=','TileType_Button.Variable(Cost)'])]
name='Celestial sonar proximity warning'
index=next((i for i,e in enumerate(scene['events']) if e.get('name')==name),None)
if index is None:
    index=len(scene['events']);scene['events'].append({'name':name,'type':'BuiltinCommonInstructions::Group','events':[{'type':'BuiltinCommonInstructions::JsCode','inlineCode':[],'parameterObjects':'','useStrict':True,'eventsSheetExpanded':False}],'parameters':[]})
mapping_path=ROOT/'tools/source-mapping.json';mapping=json.loads(mapping_path.read_text());entry=[index,[0],'celestial-sonar-runtime.js']
if entry not in mapping:mapping.append(entry)
mapping_path.write_text(json.dumps(mapping,indent=2)+'\n')
scene_path.write_text(json.dumps(scene,ensure_ascii=False,indent=2)+'\n')
project_path=ROOT/'Tower Defense.json';project=json.loads(project_path.read_text());resources=project['resources']['resources']
for file in ['assets/audio/ui/purchase_denied.ogg','assets/audio/gameplay/sonar_warning.ogg','assets/audio/gameplay/sonar_critical.ogg']:
    if not any(r['name']==file for r in resources):resources.append({'file':file,'kind':'audio','metadata':'','name':file,'preloadAsMusic':False,'preloadAsSound':False,'preloadInCache':False,'userAdded':True})
project_path.write_text(json.dumps(project,ensure_ascii=False,indent=2)+'\n')
print('Registered three final audio resources, two feedback configs and one sonar event. No gameplay tuning changed.')
