"""Add Star Cannon without replacing existing tower/event definitions."""
import copy,json,uuid
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parent.parent
path=root/'layouts/game-scene.json';original=path.read_text(encoding='utf-8');scene=json.loads(original)
project_path=root/'Tower Defense.json';project_original=project_path.read_text(encoding='utf-8');project=json.loads(project_original)
def var(name,value):
 result={'persistentUuid':str(uuid.uuid4())}
 if name is not None:result['name']=name
 if isinstance(value,dict):result.update(type='structure',children=[var(k,v) for k,v in value.items()])
 elif isinstance(value,list):result.update(type='array',children=[var(None,v) for v in value])
 else:result.update(type='boolean' if isinstance(value,bool) else 'number' if isinstance(value,(float,int)) else 'string',value=value)
 return result
def obj(name):return next(o for o in scene['objects'] if o['name']==name)
def new_ids(v):
 if isinstance(v,dict):
  if 'persistentUuid' in v:v['persistentUuid']=str(uuid.uuid4())
  for x in v.values():new_ids(x)
 elif isinstance(v,list):
  for x in v:new_ids(x)
def animation(name,file):
 a=copy.deepcopy(obj('ArcherTower')['animations'][0]);a['name']=name
 sprite=a['directions'][0]['sprites'][0];sprite['image']=file
 w,h=Image.open(root/file).size if file.endswith('.png') else ((96,48) if 'Projectile_' in file else (64,64))
 sprite['originPoint']={'name':'origine','x':0,'y':0};sprite['centerPoint']={'automatic':True,'name':'centre','x':0,'y':0}
 sprite['points']=[{'name':'FirePoint'+letter,'x':w*x,'y':h*y} for letter,x,y in [('A',.80,.32),('B',.88,.43),('C',.72,.22)]]
 sprite['hasCustomCollisionMask']=True
 sprite['customCollisionMask']=[[{'x':w*x,'y':h*y} for x,y in [(.25,.20),(.92,.20),(.92,.86),(.25,.86)]]]
 if not file.endswith('.png'):sprite['hasCustomCollisionMask']=False;sprite['points']=[]
 if file.endswith('.png') and 'Star_Cannon_' in file:
  key='_'.join(Path(file).stem.split('_')[-2:]);anchor=config.get('VisualAnchors',{}).get(key)
  emitters_path=root/'assets/star_cannon/emitter-points.json'
  emitters=json.loads(emitters_path.read_text(encoding='utf-8')) if emitters_path.exists() else {}
  if key in emitters:sprite['points']=[{'name':'FirePoint'+chr(65+i),'x':w*x,'y':h*y} for i,(x,y) in enumerate(emitters[key])]
  if anchor:sprite['points'].append({'name':'GroundContact','x':anchor['X']*w,'y':anchor['Y']*h})
 return a
pairs=[(a,b) for a in range(5) for b in range(5) if not(a>=3 and b>=3)]
assert all((root/f'assets/star_cannon/Star_Cannon_{a}_{b}.png').is_file() for a,b in pairs),'Missing generated state'
assert not any(o['name']=='StarCannonTower' for o in scene['objects']),'Already integrated'
config=json.loads((root/'assets/star_cannon/config.json').read_text(encoding='utf-8'))
tower=copy.deepcopy(obj('ArcherTower'));new_ids(tower);tower['name']='StarCannonTower'
values={v['name']:v.get('value') for v in tower['variables']}
values.update(TowerName='Star Cannon',TowerType='StarCannon',Damage=50,CurrentDamage=50,AttackInterval=.9,CurrentAttackInterval=.9,
 ProjectileSpeed=520,CurrentProjectileSpeed=520,AttackRange=210,CurrentRange=210,ProjectileCount=1,ProjectileDamage=50,ProjectileKind='Base',SplashRatio=0,SplashRadius=0)
values.pop('ArcherCount',None);values.pop('ProjectilePierce',None)
tower['variables']=[var(k,v) for k,v in values.items()]
tower['animations']=[animation(f'{a}_{b}',f'assets/star_cannon/Star_Cannon_{a}_{b}.png') for a,b in pairs]
scene['objects'].append(tower)
for name,prototype,values,animations in [
 ('StarCannonProjectile','ArcherProjectile',{'OwnerTowerId':0,'TargetId':0,'Damage':50,'SplashRatio':0,'SplashRadius':0,'Speed':520},[(k,'Projectile_'+k+'.svg') for k in ['Base','Reinforced','Explosion','Supernova','Twin','Meteor']]),
 ('StarCannonImpact','ArcherProjectile',{},[(k,'Impact_'+k+'.svg') for k in ['Base','Explosion','Supernova','Barrage']])]:
 o=copy.deepcopy(obj(prototype));new_ids(o);o['name']=name;o['variables']=[var(k,v) for k,v in values.items()];o['behaviors']=[]
 o['animations']=[animation(k,'assets/star_cannon/'+f) for k,f in animations];scene['objects'].append(o)
base='assets/star_cannon/Star_Cannon_0_0.png'
for name in ['TileType_Button','TilePlacement_Indicator','IndexTowerImage']:obj(name)['animations'].append(animation('StarCannonTower',base))
for a,b in pairs:obj('SelectedTowerPreview')['animations'].append(animation(f'SC_{a}_{b}',f'assets/star_cannon/Star_Cannon_{a}_{b}.png'))
for path_cfg in config['Paths']:
 for upgrade in path_cfg['Upgrades']:obj('ArcherUpgradeIcon')['animations'].append(animation(upgrade['Icon'],'assets/star_cannon/Upgrade_'+upgrade['Icon'][3:]+'.svg'))
scene['variables'].append(var('StarCannonConfig',config))
next(v for v in scene['variables'] if v['name']=='TowerShopCatalog')['children'].append(var(None,{'Cost':300,'IconAnimation':'StarCannonTower','Name':'STAR CANNON','Type':'StarCannonTower'}))
next(v for v in scene['variables'] if v['name']=='TowerFootprints')['children'].append(var('StarCannonTower',{'AnchorX':config['VisualAnchors']['0_0']['X'],'AnchorY':config['VisualAnchors']['0_0']['Y'],'Width':64,'Height':64,'Radius':46,'RenderScale':2.5}))
next(g for g in scene['objectsGroups'] if g['name']=='PlaceableTile')['objects'].append({'name':'StarCannonTower'})
folder=scene.get('objectsFolderStructure')
if folder and isinstance(folder,dict):
 for name in ['StarCannonTower','StarCannonProjectile','StarCannonImpact']:folder.setdefault('children',[]).append({'objectName':name})
scene['events'][1]['events'][0]['inlineCode']=(root/'tools/unit-index-runtime.js').read_text(encoding='utf-8').splitlines()
scene['events'][10]['events'].insert(9,{'type':'BuiltinCommonInstructions::JsCode','inlineCode':(root/'tools/star-cannon-runtime.js').read_text(encoding='utf-8').splitlines(),'parameterObjects':'','useStrict':True})
resources=project['resources']['resources'];existing={r['name'] for r in resources}
for f in sorted((root/'assets/star_cannon').iterdir()):
 if f.suffix not in ['.png','.svg']:continue
 name=f.relative_to(root).as_posix()
 if name not in existing:resources.append({'kind':'image','name':name,'file':name,'metadata':'','smoothed':True,'userAdded':True});existing.add(name)
def save_changed(p,text,new):
 decoder=json.JSONDecoder();i=1;edits=[]
 while True:
  while text[i].isspace() or text[i]==',':i+=1
  if text[i]=='}':break
  key,n=decoder.raw_decode(text[i:]);i+=n
  while text[i].isspace() or text[i]==':':i+=1
  value,n=decoder.raw_decode(text[i:])
  if value!=new[key]:edits.append((i,i+n,json.dumps(new[key],indent=2,ensure_ascii=False).replace('\n','\n  ')))
  i+=n
 for a,b,replacement in reversed(edits):text=text[:a]+replacement+text[b:]
 assert json.loads(text)==new;p.write_text(text,encoding='utf-8')
save_changed(path,original,scene);save_changed(project_path,project_original,project)
print('Added 21 states, 6 projectiles, 4 impacts, 8 icons; native objects and resources registered')
