"""Generate the native road sprite and waypoints from labyrinth-layout.json."""

import copy
import json
import math
import runpy
import uuid
import xml.etree.ElementTree as ET
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ART = 'assets/map/monster_path/celestial_labyrinth.svg'
RESOURCE = 'assets/celestial_void/celestial_labyrinth.svg'
SOURCE = 'tools/labyrinth-layout.json'
VARIABLE = runpy.run_path(str(ROOT/'tools/register-fusion-index-assets.py'))['variable']


def read(file):
    return json.loads((ROOT/file).read_text(encoding='utf-8-sig'))


def write_json(file, value):
    (ROOT/file).write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')


def centerline(corners, corner_radius):
    result = [corners[0]]

    def straight_to(end):
        start = result[-1]
        steps = max(1, math.ceil(math.dist(start,end)/48))
        result.extend(tuple(a+(b-a)*i/steps for a,b in zip(start,end)) for i in range(1,steps+1))

    for before, bend, after in zip(corners,corners[1:],corners[2:]):
        incoming, outgoing = math.dist(before,bend), math.dist(bend,after)
        u = tuple((b-a)/incoming for a,b in zip(before,bend))
        v = tuple((b-a)/outgoing for a,b in zip(bend,after))
        assert abs(sum(a*b for a,b in zip(u,v))) < 1e-8
        radius = min(corner_radius, incoming/2-1, outgoing/2-1)
        assert radius > 0
        entry = tuple(b-a*radius for b,a in zip(bend,u))
        center = tuple(a+b*radius for a,b in zip(entry,v))
        straight_to(entry)
        for i in range(1,9):
            angle = i*math.pi/16
            result.append(tuple(c+radius*(a*math.sin(angle)-b*math.cos(angle)) for c,a,b in zip(center,u,v)))
    straight_to(corners[-1])
    return [(round(x,4),round(y,4)) for x,y in result]


def point_distance(point, a, b):
    dx,dy = b[0]-a[0],b[1]-a[1]
    t = max(0,min(1,((point[0]-a[0])*dx+(point[1]-a[1])*dy)/(dx*dx+dy*dy)))
    return math.dist(point,(a[0]+t*dx,a[1]+t*dy))


def svg(config, points):
    width = config['Width']
    left,top,right,bottom = (config['Surface'][key] for key in ('left','top','right','bottom'))
    w,h = right-left,bottom-top
    outline = 'M'+' L'.join(f'{x:.4f} {y:.4f}' for x,y in points)
    namespace = 'http://www.w3.org/2000/svg'
    ET.register_namespace('',namespace)
    original = ET.parse(ROOT/'assets/map/monster_path/path_H.svg').getroot()
    pattern = original.find(f'.//{{{namespace}}}pattern')
    pattern.set('patternTransform','scale(.72)')
    jewel = original.find(f'{{{namespace}}}g')
    jewel.attrib.clear()
    jewel.set('id','celestialSeal')
    join = 'stroke-linejoin="round" stroke-linecap="round" fill="none"'
    lines = [f'<svg xmlns="{namespace}" width="{w}" height="{h}" viewBox="{left} {top} {w} {h}">',
             '<defs>',ET.tostring(pattern,encoding='unicode'),ET.tostring(jewel,encoding='unicode'),
             '<linearGradient id="ivory" x2="0" y2="1">',
             '<stop stop-color="#fff7e8"/><stop offset=".48" stop-color="#f2e6f0"/><stop offset="1" stop-color="#eadbeb"/>',
             '</linearGradient>',
             f'<mask id="floor" maskUnits="userSpaceOnUse" x="{left}" y="{top}" width="{w}" height="{h}">',
             f'<path d="{outline}" {join} stroke="#fff" stroke-width="{width-6}"/>',
             '</mask></defs>']
    for thickness,color in [(width,'#332139'),(width-1.6,'#a47c53'),(width-3.4,'#f8d797'),(width-6,'url(#ivory)')]:
        lines.append(f'<path d="{outline}" {join} stroke="{color}" stroke-width="{thickness:g}"/>')
    lines.append(f'<rect x="{left}" y="{top}" width="{w}" height="{h}" fill="url(#bricks)" mask="url(#floor)"/>')
    distance,next_seal = 0,120
    for a,b in zip(points,points[1:]):
        length=math.dist(a,b)
        while next_seal <= distance+length:
            t=(next_seal-distance)/length
            x,y=(a[i]+(b[i]-a[i])*t for i in range(2))
            if math.dist((x,y),points[0])>110 and math.dist((x,y),points[-1])>110:
                lines.append(f'<use href="#celestialSeal" transform="translate({x:.2f} {y:.2f}) scale(.57) translate(-32 -32)"/>')
            next_seal+=146
        distance+=length
    return '\n'.join([*lines,'</svg>',''])


def build():
    config = read(SOURCE)
    corners = config['Corners']
    width = config['Width']
    left,top,right,bottom = (config['Surface'][key] for key in ('left','top','right','bottom'))
    segments = list(zip(corners,corners[1:]))
    assert corners[0]==[132,220] and corners[-1]==[132,1012]
    for i,(a,b) in enumerate(segments):
        assert (a[0]==b[0]) != (a[1]==b[1])
        for x,y in (a,b):
            assert left+width/2<x<right-width/2 and top+width/2<y<bottom-width/2
        for c,d in segments[i+2:]:
            dx=max(0,min(a[0],b[0])-max(c[0],d[0]),min(c[0],d[0])-max(a[0],b[0]))
            dy=max(0,min(a[1],b[1])-max(c[1],d[1]),min(c[1],d[1])-max(a[1],b[1]))
            assert math.hypot(dx,dy)>width, (a,b,c,d)
    points = centerline(corners,config['CornerRadius'])
    length = sum(math.dist(a,b) for a,b in zip(points,points[1:]))
    for kind,x,y,scale in config['Decorations']:
        factor={'Crystal':1.65,'Rock':1.75,'Ruin':2.30,'Shrub':1.65}[kind]
        # The square art bounds must clear the road as well as the native blocker.
        visual_radius=64*factor*scale/math.sqrt(2)
        assert min(point_distance((x,y),a,b) for a,b in zip(points,points[1:]))>width/2+visual_radius, (kind,x,y)
        assert min(x-left,right-x,y-top,bottom-y)>visual_radius, (kind,x,y)

    scene_file,project_file,mapping_file='layouts/game-scene.json','Tower Defense.json','tools/source-mapping.json'
    scene,project,mapping = map(read,(scene_file,project_file,mapping_file))
    objects={o['name']:o for o in scene['objects']}
    road_animations=objects['Monster_Path']['animations']
    road_animations[:]=[entry for entry in road_animations if entry['name']!='Labyrinth']
    animation=copy.deepcopy(road_animations[0])
    animation['name']='Labyrinth'
    direction=animation['directions'][0]
    direction['sprites']=direction['sprites'][:1]
    direction['sprites'][0].update(image=RESOURCE,hasCustomCollisionMask=False,customCollisionMask=[])
    road_animations.append(animation)
    instances=scene['instances']
    road=next(i for i in instances if i['name']=='Monster_Path')
    road.update(x=left,y=top,width=right-left,height=bottom-top,zOrder=-1,
                numberProperties=[{'name':'animation','value':len(road_animations)-1}])
    old_props=[i for i in instances if i['name']=='Ground_Decoration']
    for name,point,size in [('SpawnMarker',points[0],32),('BaseMarker',points[-1],80)]:
        portal=next(i for i in instances if i['name']==name)
        portal.update(x=point[0]-size/2,y=point[1]-size/2)
    props=[]
    for j,(kind,x,y,scale) in enumerate(config['Decorations']):
        instance=copy.deepcopy(old_props[j] if j<len(old_props) else old_props[0])
        if j>=len(old_props):
            instance['persistentUuid']=str(uuid.uuid5(uuid.NAMESPACE_URL,f'celestial-void/labyrinth/prop/{j}'))
        index=next(i for i,a in enumerate(objects['Ground_Decoration']['animations']) if a['name']==kind)
        instance.update(x=x-32,y=y-32,numberProperties=[{'name':'animation','value':index}],
                        initialVariables=[VARIABLE('Kind',kind),VARIABLE('LocalScale',scale),VARIABLE('Blocking',kind!='Shrub')])
        props.append(instance)
    scene['instances']=[i for i in instances if i['name'] not in {'Monster_Path','Ground_Decoration'}]+[road,*props]
    data={'Width':width,'Surface':config['Surface'],'MainRows':config['MainRows'],'Length':round(length,4),
          'Turns':len(corners)-2,'Points':[{'X':x,'Y':y} for x,y in points]}
    scene['variables']=[v for v in scene['variables'] if v['name']!='LabyrinthMap']+[VARIABLE('LabyrinthMap',data)]
    resources=project['resources']['resources']
    if not any(r['name']==RESOURCE for r in resources):
        resources.append({'file':ART,'name':RESOURCE,'kind':'image','metadata':'','smoothed':True,'userAdded':True})
    if not any(m[2]=='labyrinth-route-runtime.js' for m in mapping):
        mapping.append([2,[0,0],'labyrinth-route-runtime.js'])
    for root,children,name in mapping:
        event=scene['events'][root]
        for index in children: event=event['events'][index]
        event['inlineCode']=(ROOT/'tools'/name).read_text(encoding='utf-8-sig').splitlines()
    (ROOT/ART).write_text(svg(config,points),encoding='utf-8')
    write_json(scene_file,scene)
    write_json(project_file,project)
    write_json(mapping_file,mapping)
    print(f'{width} px, {length:.2f} px long, {data["Turns"]} turns, {len(points)} waypoints, {len(props)} props')


if __name__=='__main__':
    build()
