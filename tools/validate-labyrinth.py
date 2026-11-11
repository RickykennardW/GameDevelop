"""Check generated geometry and the scope of the map change against Git."""

import copy
import json
import math
import runpy
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASELINE = '32e360d39c536d6f802703df736a10731caf1e08'
MAP_OBJECTS = {'Monster_Path','Ground_Decoration','SpawnMarker','BaseMarker'}
MAP_SOURCES = {'responsive-map-runtime.js','island-map-runtime.js','free-placement-runtime.js','labyrinth-route-runtime.js'}
RESOURCE = 'assets/celestial_void/celestial_labyrinth.svg'
ART = 'assets/map/monster_path/celestial_labyrinth.svg'


def old(file):
    return json.loads(subprocess.check_output(['git','show',f'{BASELINE}:{file}'],cwd=ROOT).decode('utf-8-sig'))


def without_map_instances(instances):
    return [i for i in instances if i['name'] not in MAP_OBJECTS]


def without_map_animations(objects):
    result=copy.deepcopy(objects)
    for obj in result:
        if obj['name']=='Monster_Path':
            obj['animations']=[a for a in obj['animations'] if a['name']!='Labyrinth']
    return result


def unpack(value):
    if value['type']=='structure': return {c['name']:unpack(c) for c in value['children']}
    if value['type']=='array': return [unpack(c) for c in value['children']]
    return value['value']


def main():
    read=lambda f:json.loads((ROOT/f).read_text(encoding='utf-8-sig'))
    config=read('tools/labyrinth-layout.json')
    old_scene=old('layouts/game-scene.json')
    scene=read('layouts/game-scene.json')
    layout=unpack(next(v for v in scene['variables'] if v['name']=='LabyrinthMap'))
    build=runpy.run_path(str(ROOT/'tools/build-labyrinth.py'))
    points=build['centerline'](config['Corners'],config['CornerRadius'])
    length=sum(math.dist(a,b) for a,b in zip(points,points[1:]))
    assert [(p['X'],p['Y']) for p in layout['Points']]==points
    assert round(length,4)==layout['Length'] and length>7128
    assert (ROOT/ART).read_text(encoding='utf8')==build['svg'](config,points)
    art=ET.parse(ROOT/ART).getroot()
    assert layout['Width']==32 and max(float(p.get('stroke-width')) for p in art if p.tag.endswith('path'))==32
    instances=scene['instances']
    roads=[i for i in instances if i['name']=='Monster_Path']
    assert len(roads)==1 and roads[0]['zOrder']<min(i['zOrder'] for i in instances if i['name'] in {'SpawnMarker','BaseMarker'})
    for name,point in [('SpawnMarker',points[0]),('BaseMarker',points[-1])]:
        portal=next(i for i in instances if i['name']==name)
        assert (portal['x']+portal['width']/2,portal['y']+portal['height']/2)==point
    assert without_map_instances(instances)==without_map_instances(old_scene['instances'])
    scene['instances']=old_scene['instances']
    scene['objects']=without_map_animations(scene['objects'])
    scene['variables']=[v for v in scene['variables'] if v['name']!='LabyrinthMap']
    for root,children,name in read('tools/source-mapping.json'):
        event=scene['events'][root]
        original=old_scene['events'][root]
        for index in children:
            event=event['events'][index]
            original=original['events'][index]
        assert event['inlineCode']==(ROOT/'tools'/name).read_text(encoding='utf-8-sig').splitlines(),name
        if name in MAP_SOURCES:
            event['inlineCode']=original['inlineCode']
    assert scene==old_scene,'Scene changes beyond the map scope'
    project=read('Tower Defense.json')
    resources=project['resources']['resources']
    assert sum(r['name']==RESOURCE and r['file']==ART for r in resources)==1
    project['resources']['resources']=[r for r in resources if r['name']!=RESOURCE]
    assert project==old('Tower Defense.json'),'Project changes beyond the road resource'
    for file in ('layouts/main-menu.json','layouts/levels.json','eventsFunctionsExtensions/health.json'):
        assert read(file)==old(file),file
    assert not subprocess.check_output(['git','diff',BASELINE,'--name-only','--','assets'],cwd=ROOT).strip(), 'Existing art/audio modified'
    report={'passed':True,'width':layout['Width'],'length':layout['Length'],'originalLength':7128,'turns':layout['Turns'],
            'waypoints':len(points),'decorations':len(config['Decorations']),'nonMapSceneDataMatchBaseline':True,'baseline':BASELINE}
    (ROOT/'validation/labyrinth-static.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
    print(json.dumps(report))


if __name__=='__main__':
    main()
