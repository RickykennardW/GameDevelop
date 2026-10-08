"""Read-only alpha measurements + explicit socket/muzzle calibration metadata."""
import json,math
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parent.parent;folder=root/'assets/star_cannon/components'
def read(path):return Image.open(path).convert('RGBA')
def footprint(path):
 im=read(path);w,h=im.size;alpha=im.getchannel('A');bounds=alpha.point(lambda a:255 if a>=128 else 0).getbbox();bottom=bounds[3]
 points=[(x,y) for y in range(max(0,bottom-int(h*.12)),bottom,3) for x in range(0,w,3) if alpha.getpixel((x,y))>=128]
 lo=min(x for x,y in points);hi=max(x for x,y in points)
 return [(lo+hi)/2/w,bottom/h-.045],(hi-lo)/w
def hull(path):
 im=read(path);w,h=im.size;alpha=im.getchannel('A');points=[]
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
# Calibrated on source images; per-state edits are reviewed in the component gallery.
emitters=json.loads((root/'assets/star_cannon/emitter-points.json').read_text())
overrides_path=folder/'calibration.json';overrides=json.loads(overrides_path.read_text()) if overrides_path.exists() else {}
states={}
for a in range(5):
 for b in range(5):
  if a>=3 and b>=3:continue
  key=f'{a}_{b}';base=folder/f'StarCannon_Base_{key}.png';turret=folder/f'StarCannon_Turret_{key}.png'
  if not(base.exists() and turret.exists()):continue
  contact,width=footprint(base);original_contact,original_width=footprint(root/f'assets/star_cannon/Star_Cannon_{key}.png');scale=original_width/width
  m={'Base':{'Contact':contact,'Socket':[contact[0],contact[1]-.21/scale],'Scale':scale,'Hull':hull(base)},'Turret':{'Pivot':[.49,.60],'Scale':1,'Muzzles':emitters.get(key,[[.80,.32]]),'Hull':hull(turret)},'RestFacing':-30}
  for part in ['Base','Turret']:
   if part in overrides.get(key,{}):m[part].update(overrides[key][part])
  if 'RestFacing' in overrides.get(key,{}):m['RestFacing']=overrides[key]['RestFacing']
  states[key]=m
data={'RotationDegreesPerSecond':240,'FireToleranceDegrees':8,'States':states}
(folder/'component-metadata.json').write_text(json.dumps(data,indent=2),encoding='utf-8')
print('Measured',len(states),'component pairs')
# A live DOM composite allows inspection without baking a replacement whole-map sprite.
for page in range(3):
 keys=list(states)[page*7:(page+1)*7];cards=[]
 for key in keys:
  m=states[key];anchor=m['Base']['Contact'];size=240;bs=size*m['Base']['Scale'];ts=size*m['Turret']['Scale'];px=(m['Base']['Socket'][0]-anchor[0])*bs;py=(m['Base']['Socket'][1]-anchor[1])*bs
  original=(root/f'assets/star_cannon/Star_Cannon_{key}.png').as_uri();b=(folder/f'StarCannon_Base_{key}.png').as_uri();t=(folder/f'StarCannon_Turret_{key}.png').as_uri()
  dots=''.join(f'<i style="left:{120+px+(x-m["Turret"]["Pivot"][0])*ts}px;top:{216+py+(y-m["Turret"]["Pivot"][1])*ts}px">{i+1}</i>' for i,(x,y) in enumerate(m['Turret']['Muzzles']))
  cards.append(f'<article><h3>{key} Original / Composite / Turret</h3><div class="row"><img class="original" src="{original}"><div class="canvas"><div class="ring"></div><img style="width:{bs}px;left:{120-anchor[0]*bs}px;top:{216-anchor[1]*bs}px" src="{b}"><img style="width:{ts}px;left:{120+px-m["Turret"]["Pivot"][0]*ts}px;top:{216+py-m["Turret"]["Pivot"][1]*ts}px" src="{t}">{dots}</div><img class="original" src="{t}"></div></article>')
 html='<!doctype html><meta charset="utf-8"><style>body{background:#20162f;color:#eadaff;font:14px Arial;margin:12px}article{display:inline-block;width:750px;height:285px}h3{margin:0}img{object-fit:contain}.row{display:flex}.original,.canvas{width:240px;height:260px;position:relative}.canvas img{position:absolute}.ring{position:absolute;left:74px;top:204px;width:92px;height:24px;border:1px solid cyan;border-radius:50%}i{position:absolute;color:red;font:bold 12px Arial;border:1px solid lime;border-radius:50%}</style>'+''.join(cards)
 out=root/f'design_previews/star_cannon/Component_Gallery_{page+1}.html';out.parent.mkdir(parents=True,exist_ok=True);out.write_text(html,encoding='utf-8')
