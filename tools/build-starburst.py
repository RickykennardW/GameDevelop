"""Assemble the original Starburst atlas and add its minimal native definitions.
Direct source edits only; image composition is the same as the maintained Nova
modular pipeline. No project copies, safety assets or intermediate images.
"""
import copy,json,math
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parent.parent
PREFIX='assets/towers/starburst_cannon'
ATLAS=PREFIX+'/Starburst_Modular_Atlas.png'
PREVIEW=PREFIX+'/Starburst_Preview.png'

def pack(name,x):
 v={'name':name}
 if isinstance(x,dict):v.update(type='structure',children=[pack(k,y) for k,y in x.items()])
 elif isinstance(x,list):v.update(type='array',children=[pack(str(i),y) for i,y in enumerate(x)])
 else:v.update(type='boolean' if isinstance(x,bool) else 'string' if isinstance(x,str) else 'number',value=x)
 return v
def apply_starburst(project,scene):
 asset=ROOT/PREFIX;asset.mkdir(parents=True,exist_ok=True)
 im=Image.open(ROOT/ATLAS).convert('RGBA');alpha=im.getchannel('A');w,h=im.size
 assert alpha.getextrema()[0]==0
 solid=alpha.point(lambda a:255 if a>=8 else 0)
 # Find real transparent gutters; generated components need not meet a rigid grid.
 cx=min(range(int(w*.48),int(w*.55)),key=lambda x:(sum(solid.crop((x,0,x+1,h)).getdata()),abs(x-w/2)))
 cuts=[min(range(int(h*.43),int(h*.60)),key=lambda y:(sum(solid.crop((l,y,r,y+1)).getdata()),abs(y-h/2))) for l,r in [(0,cx),(cx,w)]]
 regions=[(0,0,cx,cuts[0]),(cx,0,w,cuts[1]),(0,cuts[0],cx,h),(cx,cuts[1],w,h)]
 frames={}
 for slot,rect in zip(['Base','Chassis','Barrel','Core'],regions):
  l,t,r,b=rect;x,y,xx,yy=solid.crop(rect).getbbox();frames[slot]=[l+x,t+y,xx-x,yy-y]
 parts=[{'Kit':'Starburst','Slot':'Chassis','Rect':[11,8,66,70],'Role':'Housing'},
  {'Kit':'Starburst','Slot':'Barrel','Rect':[34,2,20,60],'Role':'Barrel0'},
  {'Kit':'Starburst','Slot':'Barrel','Rect':[13,14,14,44],'Role':'Barrel1'},
  {'Kit':'Starburst','Slot':'Barrel','Rect':[61,14,14,44],'Role':'Barrel2'},
  {'Kit':'Starburst','Slot':'Core','Rect':[28,47,32,32],'Role':'Core'}]
 hull=[[x/88,y/88] for x,y in [[34,2],[54,2],[75,17],[80,47],[70,73],[44,82],[18,73],[8,47],[13,17]]]
 state={'RestFacing':-90,'BaseKit':'Starburst','BaseRect':[2,2,84,84],
  'Base':{'Contact':[.5,.5],'Socket':[.5,.5],'Scale':.55,'Hull':[[.5+.475*math.cos(i*math.tau/24),.5+.475*math.sin(i*math.tau/24)] for i in range(24)]},
  'Turret':{'Pivot':[.5,.5],'Mount':[.5,.5],'Scale':.55,'Muzzles':[[.5,4.1/88],[20/88,15.54/88],[68/88,15.54/88]],'Hull':hull},'Parts':parts}
 cfg={'Name':'Starburst Cannon','FusionCost':0,'RegionalRadius':96,'FusionTimeScale':.5,'OverlayOpacity':.25,
  'Damage':90,'AttackInterval':.4,'AttackRange':227,'ProjectileSpeed':600,'SplashRadius':64,'SplashRatio':.20,'RotationDegreesPerSecond':300,
  'Kit':{'Image':ATLAS,'Frames':frames},'State':state,'Preview':PREVIEW}
 existing=next((v for v in scene['variables'] if v['name']=='StarburstConfig'),None)
 if existing:
  # Preserve tuned gameplay fields; artwork rebuild only replaces the art metadata.
  for field in existing.get('children',[]):
   if field['name'] not in ['Kit','State','Preview']:cfg[field['name']]=field.get('value')
 var=pack('StarburstConfig',cfg)
 if existing:scene['variables'][scene['variables'].index(existing)]=var
 else:scene['variables'].append(var)
 if not any(v['name']=='FusionActive' for v in scene['variables']):scene['variables'].append(pack('FusionActive',False))
 canvas=Image.new('RGBA',(352,352))
 for slot,rect in [('Base',state['BaseRect'])]+[(p['Slot'],p['Rect']) for p in parts]:
  x,y,sw,sh=frames[slot];dx,dy,dw,dh=rect
  canvas.alpha_composite(im.crop((x,y,x+sw,y+sh)).resize((round(dw*4),round(dh*4)),Image.Resampling.LANCZOS),(round(dx*4),round(dy*4)))
 canvas.save(ROOT/PREVIEW,optimize=True)
 objects={o['name']:o for o in scene['objects']}
 def animation(name,images):
  a=copy.deepcopy(objects['StarCannonTower']['animations'][0]);a['name']=name;d=a['directions'][0];d['looping']=False;d['timeBetweenFrames']=.05;sp=copy.deepcopy(d['sprites'][0]);sp['points']=[];sp['customCollisionMask']=[];sp['hasCustomCollisionMask']=False;d['sprites']=[]
  for image in images:s=copy.deepcopy(sp);s['image']=image;d['sprites'].append(s)
  return a
 def put(obj,name,images):
  objects[obj]['animations']=[a for a in objects[obj]['animations'] if a['name']!=name]+[animation(name,images)]
 for obj,name in [('StarCannonTower','Fusion'),('StarCannonBaseVisual','Fusion'),('StarCannonTurretVisual','Fusion'),('SelectedTowerPreview','SC_Fusion'),('IndexTowerImage','StarburstCannon')]:put(obj,name,[PREVIEW])
 put('StarCannonBaseVisual','StarburstAtlas',[ATLAS])
 files=[]
 for frame,pulse in enumerate([.78,1,.9]):
  file=PREFIX+f'/Starburst_Bolt_{frame}.svg';files.append(file)
  (ROOT/file).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="128" height="48" viewBox="0 0 128 48"><defs><linearGradient id="g"><stop stop-color="#5d3dcd" stop-opacity="0"/><stop offset=".5" stop-color="#6baaff"/><stop offset="1" stop-color="#fff7ff"/></linearGradient></defs><g opacity="{pulse}"><path d="M 4 24 L 82 10 L 125 24 L 82 38 Z" fill="url(#g)"/><path d="M 34 24 L 89 18 L 119 24 L 89 30 Z" fill="#f3e4ff"/><path d="M 82 7 L 93 17 L 113 24 L 93 31 L 82 41 L 80 29 L 66 24 L 80 19 Z" fill="none" stroke="#b893ff" stroke-width="2"/><path d="M 4 14 Q 43 19 78 21 M 4 34 Q 43 29 78 27" fill="none" stroke="#81caff" stroke-width="2"/></g></svg>',encoding='utf-8')
 put('StarCannonProjectile','Starburst',files);objects['StarCannonProjectile']['animations'][-1]['directions'][0]['looping']=True
 if 'StarburstGhost' not in objects:
  ghost=copy.deepcopy(objects['TilePlacement_Indicator']);ghost['name']='StarburstGhost';ghost['animations']=[animation('Preview',[PREVIEW])];scene['objects'].append(ghost)
  folder=next(f for f in scene['objectsFolderStructure']['children'] if f['folderName']=='03_TOWERS');folder['children'].append({'folderName':'StarburstFusion','children':[{'objectName':'StarburstGhost'}]})
 if not any(l['name']=='FusionUI' for l in scene['layers']):
  layer=copy.deepcopy(scene['layers'][-1]);layer['name']='FusionUI';layer['visibility']=False;layer['isLocked']=True;scene['layers'].append(layer)
 resources=project['resources']['resources'];ids={r['name'] for r in resources}
 for file in [ATLAS,PREVIEW]+files:
  if file not in ids:resources.append({'file':file,'kind':'image','metadata':'','name':file,'smoothed':True,'userAdded':True})
 mapping_path=ROOT/'tools/source-mapping.json';mapping=json.loads(mapping_path.read_text())
 if not any(m[2]=='starburst-fusion-runtime.js' for m in mapping):
  event=copy.deepcopy(scene['events'][0]['events'][0]);event['inlineCode']=[]
  child=len(scene['events'][0]['events']);scene['events'][0]['events'].append(event);mapping.append([0,[child],'starburst-fusion-runtime.js']);mapping_path.write_text(json.dumps(mapping,indent=2)+'\n')
 import runpy
 runpy.run_path(str(ROOT/'tools/build-fusion-archive.py'))['apply_archive'](scene)
 return cfg
if __name__=='__main__':
 project=json.loads((ROOT/'Tower Defense.json').read_text());scene=json.loads((ROOT/'layouts/game-scene.json').read_text())
 cfg=apply_starburst(project,scene)
 for file,data in [('Tower Defense.json',project),('layouts/game-scene.json',scene)]: (ROOT/file).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print('Starburst: original atlas, assembled preview, 3 bolt frames, native ghost/layer, centralized configuration registered.')
