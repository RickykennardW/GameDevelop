"""Register two showcase portraits and Index-only UI data without touching gameplay."""
import copy,json,uuid
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parent.parent
PORTRAITS={'StarCannonTower':'StarCannon_IndexPortrait','StarburstCannon':'StarburstCannon_IndexPortrait'}
def pack(name,value):
    result={'name':name}
    if isinstance(value,dict):result.update(type='structure',children=[pack(k,v) for k,v in value.items()])
    elif isinstance(value,list):result.update(type='array',children=[pack(str(k),v) for k,v in enumerate(value)])
    else:result.update(type='boolean' if isinstance(value,bool) else 'string' if isinstance(value,str) else 'number',value=value)
    return result
def apply_index(project,scene):
    objects={o['name']:o for o in scene['objects']};showcase=objects.get('IndexShowcase')
    if showcase is None:
        showcase=copy.deepcopy(objects['IndexTowerImage']);showcase['name']='IndexShowcase';showcase['persistentUuid']=str(uuid.uuid4());scene['objects'].append(showcase)
    template=copy.deepcopy(objects['IndexTowerImage']['animations'][0]);showcase['animations']=[];mapping={}
    for key,animation in PORTRAITS.items():
        file=f'assets/ui/index/portraits/{animation}.png';im=Image.open(ROOT/file);bounds=im.getchannel('A').getbbox();assert bounds
        a=copy.deepcopy(template);a['name']=animation;a['directions'][0]['sprites'][0]['image']=file;showcase['animations'].append(a)
        mapping[key]={'Animation':animation,'Image':file,'VisualBounds':[bounds[0],bounds[1],bounds[2]-bounds[0],bounds[3]-bounds[1]]}
        if not any(r['name']==file for r in project['resources']['resources']):project['resources']['resources'].append({'file':file,'kind':'image','metadata':'','name':file,'smoothed':True,'userAdded':True})
    scene['variables']=[v for v in scene['variables'] if v['name']!='IndexPortraitCatalog']+[pack('IndexPortraitCatalog',mapping)]
    if not any(l['name']=='IndexDetail' for l in scene['layers']):
        source=next(l for l in scene['layers'] if l['name']=='IndexList');layer=copy.deepcopy(source);layer['name']='IndexDetail';scene['layers'].insert(scene['layers'].index(source)+1,layer)
    def folder(node):
        if any(c.get('objectName')=='IndexTowerImage' for c in node.get('children',[])):
            if not any(c.get('objectName')=='IndexShowcase' for c in node['children']):node['children'].append({'objectName':'IndexShowcase'})
        for child in node.get('children',[]):folder(child)
    folder(scene['objectsFolderStructure'])
if __name__=='__main__':
    pfile=ROOT/'Tower Defense.json';sfile=ROOT/'layouts/game-scene.json';project=json.loads(pfile.read_text());scene=json.loads(sfile.read_text());apply_index(project,scene)
    for file,data in [(pfile,project),(sfile,scene)]:file.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Registered two portraits, IndexShowcase, IndexDetail and IndexPortraitCatalog; existing art/stats unchanged.')
