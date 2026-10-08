"""Scoped GDevelop additions. Original tower stats, map, native events and assets stay intact."""
import copy,json,uuid,hashlib,zipfile
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parent.parent
scene_path=root/'layouts/game-scene.json';project_path=root/'Tower Defense.json'
scene_text=scene_path.read_text(encoding='utf-8');project_text=project_path.read_text(encoding='utf-8')
scene=json.loads(scene_text);project=json.loads(project_text)
def variable(name,value):
 v={'persistentUuid':str(uuid.uuid4())}
 if name is not None:v['name']=name
 if isinstance(value,dict):v.update(type='structure',children=[variable(k,x) for k,x in value.items()])
 elif isinstance(value,list):v.update(type='array',children=[variable(None,x) for x in value])
 else:v.update(type='boolean' if isinstance(value,bool) else 'number' if isinstance(value,(int,float)) else 'string',value=value)
 return v
def setvar(name,value):
 existing=next((v for v in scene['variables'] if v.get('name')==name),None)
 v=variable(name,value)
 if existing:existing.clear();existing.update(v)
 else:scene['variables'].append(v)
def object_(name):return next(o for o in scene['objects'] if o['name']==name)
def ids(x):
 if isinstance(x,dict):
  if 'persistentUuid' in x:x['persistentUuid']=str(uuid.uuid4())
  for y in x.values():ids(y)
 elif isinstance(x,list):
  for y in x:ids(y)
def hull(image):
 # Read-only silhouette measurement, no raster manipulation or generated PNG rewriting.
 file=next((r['file'] for r in project['resources']['resources'] if r['name']==image),image)
 im=Image.open(root/file).convert('RGBA');w,h=im.size;alpha=im.getchannel('A');points=[]
 for y in range(0,h,max(1,h//160)):
  xs=[x for x in range(0,w,max(1,w//160)) if alpha.getpixel((x,y))>=100]
  if xs:points.extend([(min(xs)/w,y/h),(max(xs)/w,y/h)])
 points=sorted(set(points))
 def cross(o,a,b):return (a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0])
 def half(ps):
  out=[]
  for p in ps:
   while len(out)>=2 and cross(out[-2],out[-1],p)<=0:out.pop()
   out.append(p)
  return out
 return [[round(x,5),round(y,5)] for x,y in half(points)[:-1]+half(points[::-1])[:-1]]
metadata=json.loads((root/'assets/star_cannon/components/component-metadata.json').read_text())
for part in ['Base','Turret']:
 name='StarCannon'+part+'Visual'
 if not any(o['name']==name for o in scene['objects']):
  obj=copy.deepcopy(object_('StarCannonTower'));ids(obj);obj.update(name=name,variables=[variable('OwnerTowerId',0)],effects=[],behaviors=[])
  for animation in obj['animations']:
   key=animation['name'];sprite=animation['directions'][0]['sprites'][0];image=f'assets/star_cannon/components/StarCannon_{part}_{key}.png'
   w,h=Image.open(root/image).size;sprite['image']=image;sprite['hasCustomCollisionMask']=False;sprite['customCollisionMask']=[]
   m=metadata['States'][key][part]
   sprite['points']=[{'name':'GroundContact' if part=='Base' else 'TurretPivot','x':w*m['Contact' if part=='Base' else 'Pivot'][0],'y':h*m['Contact' if part=='Base' else 'Pivot'][1]}]
   if part=='Turret':sprite['points'] += [{'name':'Muzzle'+chr(65+i),'x':w*x,'y':h*y} for i,(x,y) in enumerate(m['Muzzles'])]
  scene['objects'].append(obj)
  scene['objectsFolderStructure']['children'].append({'objectName':name})
geometry={}
for name in ['Tower','ShotgunTower','RocketTower','ArcherTower','Ground_Decoration']:
 geometry[name]={}
 for a in object_(name)['animations']:
  image=a['directions'][0]['sprites'][0]['image'];geometry[name][a['name']]={'Hull':hull(image)}
setvar('SelectionGeometry',geometry);setvar('StarComponentConfig',metadata)
for name,value in [('WorldSelectionHandled',False),('SelectedObstacleId',0),('ObstaclePanelPointerInside',False)]:setvar(name,value)
if not any(l['name']=='ObstacleUI' for l in scene['layers']):
 layer=copy.deepcopy(next(l for l in scene['layers'] if l['name']=='SelectedTowerUI'));layer['name']='ObstacleUI';scene['layers'].append(layer)
def js(file):return {'type':'BuiltinCommonInstructions::JsCode','inlineCode':(root/'tools'/file).read_text(encoding='utf-8-sig').splitlines(),'parameterObjects':'','useStrict':True}
if len(scene['events'][3]['events'])==6:
 scene['events'][3]['events'][2]['conditions'].append({'type':{'value':'BooleanVariable'},'parameters':['WorldSelectionHandled','False','']})
 scene['events'][3]['events'].insert(0,js('world-selection-runtime.js'))
else:scene['events'][3]['events'][0]=js('world-selection-runtime.js')
if len(scene['events'][1]['events'])==2:scene['events'][1]['events'].append(js('obstacle-panel-runtime.js'))
else:scene['events'][1]['events'][2]=js('obstacle-panel-runtime.js')
resources=project['resources']['resources'];existing={r['name'] for r in resources}
for path in sorted((root/'assets/star_cannon/components').glob('*.png')):
 file=path.relative_to(root).as_posix()
 if file not in existing:resources.append({'alwaysLoaded':False,'file':file,'kind':'image','metadata':'','name':file,'smoothed':True,'userAdded':True})
def save_fields(path,source,data,keys):
 decoder=json.JSONDecoder();cursor=1;changes=[]
 while cursor<len(source):
  while source[cursor].isspace() or source[cursor]==',':cursor+=1
  if source[cursor]=='}':break
  key,length=decoder.raw_decode(source[cursor:]);cursor+=length
  while source[cursor].isspace() or source[cursor]==':':cursor+=1
  _,length=decoder.raw_decode(source[cursor:])
  if key in keys:changes.append((cursor,length,json.dumps(data[key],indent=2,ensure_ascii=False).replace('\n','\n  ')))
  cursor+=length
 for start,length,text in reversed(changes):source=source[:start]+text+source[start+length:]
 assert json.loads(source)==data
 path.write_text(source,encoding='utf-8')
save_fields(scene_path,scene_text,scene,{'objects','objectsFolderStructure','variables','layers','events'})
save_fields(project_path,project_text,project,{'resources'})
print('Integrated 42 component resources, visual owners, selection silhouettes and obstacle UI')
