"""Register Fusion Index metadata and its discovery event, without touching art/stats."""
import json,copy
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
def pack(name,x):
 v={'name':name}
 if isinstance(x,dict):v.update(type='structure',children=[pack(k,y) for k,y in x.items()])
 elif isinstance(x,list):v.update(type='array',children=[pack(str(i),y) for i,y in enumerate(x)])
 else:v.update(type='boolean' if isinstance(x,bool) else 'string' if isinstance(x,str) else 'number',value=x)
 return v
def apply_archive(scene):
 if not any(v['name']=='FusionCatalog' for v in scene['variables']):
  scene['variables'].append(pack('FusionCatalog',[{
   'Id':'StarburstCannon','Name':'Starburst Cannon','Kind':'Pure','Animation':'StarburstCannon','StatsConfig':'StarburstConfig',
   'Hint':'A heavy star and a restless pulse must share one constellation.',
   'Description':'A fused stellar core. Three muzzles alternate powerful bolts with small impact splash.',
   'AdaptiveVariants':False,
   'Variants':[{'Id':'pure_52_25','Name':'Pure Ascension','Recipe':[{'Type':'StarCannonTower','Path1':5,'Path2':2,'Label':'Star Cannon 5-2'},{'Type':'StarCannonTower','Path1':2,'Path2':5,'Label':'Star Cannon 2-5'}]}]
  }]))
 path=ROOT/'tools/source-mapping.json';mapping=json.loads(path.read_text())
 entry=next((m for m in mapping if m[2]=='fusion-archive-runtime.js'),None)
 if entry is None:
  entry=[0,[len(scene['events'][0]['events'])],'fusion-archive-runtime.js'];mapping.append(entry);path.write_text(json.dumps(mapping,indent=2)+'\n')
 if len(scene['events'][0]['events'])==entry[1][0]:
  event=copy.deepcopy(scene['events'][0]['events'][0]);event['inlineCode']=[];scene['events'][0]['events'].append(event)
if __name__=='__main__':
 path=ROOT/'layouts/game-scene.json';scene=json.loads(path.read_text());apply_archive(scene);path.write_text(json.dumps(scene,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print('Registered FusionCatalog and one discovery runtime event; existing art/stats unchanged.')
