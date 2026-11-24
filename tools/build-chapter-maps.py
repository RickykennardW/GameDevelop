"""Compile five chapter maps from one scale/geometry source. Direct edits only."""
import copy
import base64
import json
import math
import random
import runpy
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
lib = runpy.run_path(str(ROOT/'tools/build-labyrinth.py'))
sample, distance = lib['centerline'], lib['point_distance']


def var(name, value):
    if isinstance(value, dict):
        return {'name': name, 'type': 'structure', 'children': [var(k,v) for k,v in value.items()]}
    if isinstance(value, list):
        return {'name': name, 'type': 'array', 'children': [var(str(i),v) for i,v in enumerate(value)]}
    return {'name':name, 'type':'boolean' if isinstance(value,bool) else 'number' if isinstance(value,(int,float)) else 'string', 'value':value}


def read(path):
    return json.loads((ROOT/path).read_text(encoding='utf-8-sig'))


def write(path, data):
    (ROOT/path).write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')


def ground_art(meta):
    """Periodic 128px terrain. Edge-crossing details are explicitly wrapped."""
    if meta.get('Environment'):
        data=base64.b64encode((ROOT/meta['Environment']['Ground']['base']).read_bytes()).decode()
        return '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><image href="data:image/png;base64,'+data+'" width="128" height="128"/></svg>\n'
    p=meta['Palette'];rng=random.Random(700+meta['Chapter'])
    shapes=[f'<rect width="128" height="128" fill="{p["Ground"]}"/>']
    for _ in range(26):
        x,y=rng.randrange(128),rng.randrange(128);r=rng.randrange(3,16)
        for dx in (-128,0,128):
            for dy in (-128,0,128):
                shapes.append(f'<path d="M{x+dx-r} {y+dy}l{r} {-r//2} {r} {r//3} {-r//3} {r//2}Z" fill="{p["Stone"]}" opacity=".5"/>')
    # Low-contrast periodic veins remain buildable. Bright environmental features
    # are confined to blocking prop clusters in the runtime, never fake hazards.
    for y in (24,88):
        shapes.append(f'<path d="M0 {y}l32 8 32-8 32 8 32-8" fill="none" stroke="{p["Accent"]}" stroke-width=".55" opacity=".07"/>')
    return '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">'+''.join(shapes)+'</svg>\n'


def road_art(meta, points, surface, width, cell):
    p=meta['Palette'];l,t,r,b=(surface[k] for k in ('left','top','right','bottom'))
    path='M'+' L'.join(f'{x:.4f} {y:.4f}' for x,y in points)
    if meta.get('Environment'):
        data=base64.b64encode((ROOT/meta['Environment']['RoadMaterial']).read_bytes()).decode();unit=cell*4
        svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{r-l}" height="{b-t}" viewBox="{l} {t} {r-l} {b-t}"><defs><pattern id="material" width="{unit}" height="{unit}" patternUnits="userSpaceOnUse"><image href="data:image/png;base64,{data}" width="{unit}" height="{unit}"/></pattern></defs>'
        for size,color in [(width,'#0b0e13'),(width-2,p['Edge']),(width-6,'#a5a6a0'),(width-9,'url(#material)')]:
            svg+=f'<path d="{path}" fill="none" stroke="{color}" stroke-width="{size}" stroke-linecap="round" stroke-linejoin="round"/>'
        return svg+'</svg>\n'
    # Square paving cells replace the prior 11.52 x 5.76 brick grid.
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="{r-l}" height="{b-t}" viewBox="{l} {t} {r-l} {b-t}">
<defs><pattern id="pave" width="{cell}" height="{cell}" patternUnits="userSpaceOnUse"><path d="M0 0H{cell}V{cell}" fill="none" stroke="#635775" stroke-width=".65" opacity=".38"/><path d="M2 2H{cell-2}" stroke="#fff9ee" stroke-width=".8" opacity=".4"/><circle cx="{cell/2}" cy="{cell/2}" r="1" fill="{p['Accent']}" opacity=".25"/></pattern>
<mask id="floor"><path d="{path}" fill="none" stroke="white" stroke-width="{width-9}" stroke-linecap="round" stroke-linejoin="round"/></mask></defs>'''
    for size,color in [(width,'#121322'),(width-2,p['Edge']),(width-6,'#f3dfb9'),(width-9,p['Road'])]:
        svg+=f'<path d="{path}" fill="none" stroke="{color}" stroke-width="{size}" stroke-linecap="round" stroke-linejoin="round"/>'
    svg+=f'<rect x="{l}" y="{t}" width="{r-l}" height="{b-t}" fill="url(#pave)" mask="url(#floor)"/>'
    traveled,next_seal=0,180
    for a,bp in zip(points,points[1:]):
        length=math.dist(a,bp)
        while next_seal<=traveled+length:
            f=(next_seal-traveled)/length;x,y=(a[i]+(bp[i]-a[i])*f for i in range(2))
            if math.dist((x,y),points[0])>100 and math.dist((x,y),points[-1])>100:
                svg+=f'<path d="M{x} {y-9}l3 6 6 3-6 3-3 6-3-6-6-3 6-3Z" fill="none" stroke="{p["Edge"]}" stroke-width="1.2" opacity=".8"/>'
            next_seal+=192
        traveled+=length
    return svg+'</svg>\n'


def prop_art(meta,kind):
    p=meta['Palette'];a=p['Accent'];id=meta['Id']
    defs=f'<defs><linearGradient id="stone" x2=".7" y2="1"><stop stop-color="{p["Stone"]}"/><stop offset="1" stop-color="#101520"/></linearGradient><linearGradient id="metal" x2=".4" y2="1"><stop stop-color="#f4e6cb"/><stop offset=".5" stop-color="{a}"/><stop offset="1" stop-color="#55506b"/></linearGradient><linearGradient id="core" x2="1" y2="1"><stop stop-color="#f8f4ff"/><stop offset=".45" stop-color="{a}"/><stop offset="1" stop-color="#594179"/></linearGradient></defs>'
    base='<ellipse cx="32" cy="55" rx="24" ry="6" fill="#090e18" opacity=".5"/>'
    if kind=='Crystal':
        body=''
        for x,y,w,h in [(28,4,17,47),(12,25,12,30),(44,27,11,27)]:
            body+=f'<path d="M{x} {y}l{w//2} {-y+5 if y>5 else 0} {w//2} {h*.5} {-w*.4} {h*.5} {-w*.6} {-h*.25}Z" fill="url(#core)" stroke="{a}" stroke-width=".7"/>'
            body+=f'<path d="M{x+w/2} {y}v{h*.8}l{w*.5} {-h*.3}" fill="none" stroke="#f3f1f5" opacity=".6" stroke-width=".6"/>'
        if id=='emberfall':body='<path d="M11 46l8-24 14-18 16 21 7 24-25 12Z" fill="url(#stone)" stroke="#87707e"/><path d="M33 10l-5 17 9 8-8 20m8-20 10-4m-19-4-9 3" fill="none" stroke="#fca46a" stroke-width="2"/><path d="M33 10l-5 17 9 8-8 20" fill="none" stroke="#ffe3b0" stroke-width=".6"/>'
    elif kind=='Rock':
        body=f'<path d="M5 44l10-16 13-6 14 5 10 12 7 8-8 8-24 5-20-8Z" fill="url(#stone)" stroke="{a}" stroke-opacity=".4"/><path d="M15 29l14 8 13-10M29 37l-3 19M42 27l-3 13 16 9" fill="none" stroke="{a}" stroke-width=".8" opacity=".65"/>'
        if id=='belt':body+=f'<path d="M10 46l14-13 21 3 10 12-10 8-27-1Z" fill="none" stroke="#91939e" stroke-width="1"/><rect x="43" y="34" width="10" height="6" fill="#739eab"/><path d="M13 49l5 4m0-7 5 4m0-7 5 4" stroke="{a}" stroke-width="2"/>'
        elif id=='reliquary':body+='<path d="M11 40l12-13 14 3 12 13-10 10-22-1Z" fill="#82b5c6" opacity=".55"/><path d="M23 27l4 15 10-12m-10 12 12 11" fill="none" stroke="#d7f1fa" opacity=".7"/>'
    elif kind=='Ruin':
        body=f'<path d="M6 46l26-12 26 12v8L32 63 6 54Z" fill="url(#stone)" stroke="{a}" stroke-opacity=".65"/><ellipse cx="32" cy="46" rx="24" ry="10" fill="url(#stone)" stroke="{a}"/><ellipse cx="32" cy="46" rx="16" ry="6" fill="none" stroke="{a}" stroke-width="1.5"/>'
        if id=='emberfall':body+=f'<path d="M24 12l8-8 9 8v28l-9 8-8-8Z" fill="url(#stone)" stroke="#a08b90"/><path d="M32 9v30" stroke="#f6ba75" stroke-width="3"/><path d="M22 28l-7 12 6 4m22-16 7 12-6 4" fill="none" stroke="url(#metal)" stroke-width="3"/>'
        elif id=='reliquary':body+='<path d="M17 40V14L32 4l15 10v26l-15 9Z" fill="url(#core)" stroke="#cae9f4"/><path d="M32 7v35m-12-26 12 9 12-9" fill="none" stroke="#e9f5ff" opacity=".7"/><path d="M25 32l7-9 7 9-7 10Z" fill="#455c82" stroke="#a9ecf0"/>'
        elif id=='astral':body+='<path d="M13 44V15l8-10h22l8 10v29h-9V19l-5-5H27l-5 5v25Z" fill="url(#metal)" stroke="#e8cea1" stroke-width=".7"/><path d="M28 25l4-6 4 6-4 10Z" fill="#96bbdf"/><path d="M14 17h8m20 0h8" stroke="#fff4ce"/>'
        else:body+='<path d="M20 40V18l7-7h11l7 7v22Z" fill="url(#stone)" stroke="#8195a7"/><path d="M24 20h17v9H24Z" fill="#7da6ba"/><path d="M32 11V3m-10 7h20" stroke="#b2a88d" stroke-width="2"/><path d="M23 35h18" stroke="#d7b97f" stroke-width="2"/>'
    else:
        body=''.join(f'<path d="M32 56Q{x-6} {y+6} {x} {y}Q{x+9} {y+5} 32 56Z" fill="{a}" opacity=".55" stroke="{p["Stone"]}"/>' for x,y in [(14,30),(23,21),(35,19),(47,29),(53,39),(12,43)])
        body+='<path d="M31 56l-3-25m4 22 12-17m-15 12-11-8" stroke="#c0b5da" stroke-width=".7" opacity=".45"/>'
    return '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">'+defs+base+body+'</svg>\n'


def chapter_backdrop(meta):
    if meta.get('Environment'):
        data=base64.b64encode((ROOT/meta['Environment']['Backdrop']).read_bytes()).decode()
        return '<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><image href="data:image/png;base64,'+data+'" width="1280" height="720" preserveAspectRatio="xMidYMid slice"/><rect width="1280" height="720" fill="#050b14" opacity=".48"/></svg>\n'
    p=meta['Palette'];rng=random.Random(940+meta['Chapter']);a=p['Accent'];id=meta['Id']
    stars=''.join(f'<circle cx="{rng.randrange(1280)}" cy="{rng.randrange(720)}" r="{rng.choice([.6,1,1.3])}" fill="{a}" opacity="{rng.uniform(.15,.5):.2f}"/>' for _ in range(150))
    defs=f'<defs><linearGradient id="space" x2="1" y2="1"><stop stop-color="#070c1c"/><stop offset="1" stop-color="{p["Ground"]}"/></linearGradient><radialGradient id="planet" cx=".32" cy=".22"><stop stop-color="{a}"/><stop offset=".5" stop-color="{p["Stone"]}"/><stop offset="1" stop-color="#0a1020"/></radialGradient><radialGradient id="haze"><stop stop-color="{a}" stop-opacity=".15"/><stop offset="1" stop-color="{a}" stop-opacity="0"/></radialGradient></defs>'
    shapes=f'<rect width="1280" height="720" fill="url(#space)"/>{stars}<ellipse cx="1000" cy="300" rx="520" ry="400" fill="url(#haze)"/>'
    if id in ('emberfall','reliquary'):
        shapes+='<circle cx="1050" cy="245" r="140" fill="url(#planet)"/><circle cx="1050" cy="245" r="141" fill="none" stroke="'+a+'" opacity=".3"/>'
        shapes+=f'<path d="M945 166l42 39-20 40 62 26-12 53 56 41m-44-94 43-37-18-46 44-55" fill="none" stroke="{a}" stroke-width="{3 if id=="emberfall" else 1.5}" opacity=".6"/>'
    if id=='nebula':
        for i in range(7):shapes+=f'<path d="M-100 {100+i*80}Q400 {i*55} 750 {200+i*50}T1400 {i*60}" fill="none" stroke="{a}" stroke-width="35" opacity=".025"/>'
    if id=='astral':
        for x,y in [(985,150),(150,390),(1120,460)]:shapes+=f'<path d="M{x} {y+170}V{y+35}l32-35h96l32 35v135h-25V{y+46}l-20-20h-70l-20 20v124Z" fill="{p["Stone"]}" stroke="{a}" opacity=".45"/><ellipse cx="{x+80}" cy="{y+183}" rx="115" ry="25" fill="#101929" stroke="{a}" opacity=".3"/>'
    if id=='belt':
        for i in range(25):
            x,y=rng.randrange(1280),rng.randrange(720);r=rng.randrange(12,50)
            shapes+=f'<path d="M{x-r} {y}l{r*.6} {-r*.6} {r*.9} {r*.1} {r*.5} {r*.7} {-r*.5} {r*.5} {-r} {-r*.1}Z" fill="{p["Stone"]}" stroke="{a}" stroke-opacity=".25" opacity=".5"/>'
    for i in range(6):
        x=40+i*235;y=660-rng.randrange(70)
        shapes+=f'<path d="M{x-95} 720V{y+25}l80-48 80 18 40 90Z" fill="{p["Stone"]}" opacity=".35"/>'
    return '<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720">'+defs+shapes+'<rect width="1280" height="720" fill="#060919" opacity=".2"/></svg>\n'


def props(meta, points, surface, width):
    rng=random.Random(100+meta['Chapter']);spots=[]
    kinds=['Crystal','Rock','Ruin','Shrub']+['Ruin']*(meta['RuinWeight']-1)
    candidates=[(x,y) for y in range(170,990,12) for x in range(330,1590,32)]
    rng.shuffle(candidates)
    for index,(x,y) in enumerate(candidates):
        kind=kinds[index%len(kinds)];scale=.52 if kind!='Ruin' else .55
        factor={'Crystal':1.65,'Rock':1.75,'Ruin':2.30,'Shrub':1.65}[kind]
        radius=64*factor*scale/math.sqrt(2)+16
        if min(x-surface['left'],surface['right']-x,y-surface['top'],surface['bottom']-y)<radius:continue
        if min(distance((x,y),a,b) for a,b in zip(points,points[1:]))<width/2+radius:continue
        if any(math.dist((x,y),(a[1],a[2]))<190 for a in spots):continue
        if any(math.dist((x,y),p)<180 for p in (points[0],points[-1])):continue
        spots.append([kind,x,y,scale])
        if len(spots)==meta['PropCount']:break
    assert len(spots)>=min(10,meta['PropCount']), (meta['Id'],len(spots))
    return spots


def compile_maps():
    cfg=read('tools/chapter-maps.json');surface=cfg['Surface'];width=cfg['Scale']['PathWidth']
    library=read('tools/environment-library.json') if (ROOT/'tools/environment-library.json').exists() else None
    maps=[]
    for source in cfg['Maps']:
        m=copy.deepcopy(source);corners=m['Corners'];segments=list(zip(corners,corners[1:]))
        for i,(a,b) in enumerate(segments):
            assert (a[0]==b[0]) != (a[1]==b[1]),m['Id']
            for x,y in (a,b):
                assert surface['left']+width/2<x<surface['right']-width/2 and surface['top']+width/2<y<surface['bottom']-width/2
            for c,d in segments[i+2:]:
                # Disjoint axis-aligned bounding boxes are exact for these segments.
                dx=max(0,min(a[0],b[0])-max(c[0],d[0]),min(c[0],d[0])-max(a[0],b[0]))
                dy=max(0,min(a[1],b[1])-max(c[1],d[1]),min(c[1],d[1])-max(a[1],b[1]))
                assert math.hypot(dx,dy)>width+8,(m['Id'],a,b,c,d)
        points=sample(corners,36)
        m.update(Width=width,Surface=surface,MainRows=m.pop('Rows'),Points=[{'X':x,'Y':y} for x,y in points],Length=round(sum(math.dist(a,b) for a,b in zip(points,points[1:])),4),Turns=len(corners)-2,Decorations=props(m,points,surface,width),Animation='Chapter_'+m['Id'],Ground=f'assets/map/chapters/{m["Id"]}_ground.svg',Road=f'assets/map/chapters/{m["Id"]}_road.svg',PropAnimations={k:'Chapter_'+m['Id']+'_'+k for k in ['Crystal','Rock','Ruin','Shrub']} if m['Id']!='nebula' else {})
        if library:m['Environment']=library['Chapters'][m['Id']]
        maps.append(m)
    return cfg, maps


def build():
    cfg,maps=compile_maps();scene=read('layouts/game-scene.json');project=read('Tower Defense.json');campaign=read('tools/campaign-config.json');levels=read('layouts/levels.json')
    data={'Version':cfg['Version'],'Scale':cfg['Scale'],'Maps':{m['Id']:m for m in maps}}
    scene['variables']=[v for v in scene['variables'] if v['name']!='ChapterMaps']+[var('ChapterMaps',data)]
    road=next(o for o in scene['objects'] if o['name']=='Monster_Path');template=copy.deepcopy(road['animations'][0])
    road['animations']=[a for a in road['animations'] if not a['name'].startswith('Chapter_')]
    decor=next(o for o in scene['objects'] if o['name']=='Ground_Decoration');decor['animations']=[a for a in decor['animations'] if not a['name'].startswith('Chapter_')]
    for name in ['VoidBackdrop','IslandCliffFrame']:
        obj=next(o for o in scene['objects'] if o['name']==name);obj['animations']=[a for a in obj['animations'] if not a['name'].startswith('Chapter_Env_')]
    directory=ROOT/'assets/map/chapters';directory.mkdir(parents=True,exist_ok=True)
    for m in maps:
        (ROOT/f'assets/ui/campaign/chapter_{m["Chapter"]}.svg').write_text(chapter_backdrop(m),encoding='utf-8')
        for path,art in [(m['Ground'],ground_art(m)),(m['Road'],road_art(m,[(p['X'],p['Y']) for p in m['Points']],cfg['Surface'],cfg['Scale']['PathWidth'],cfg['Scale']['PavingCell']))]:
            ET.fromstring(art);(ROOT/path).write_text(art,encoding='utf-8')
            if not any(r['name']==path for r in project['resources']['resources']):project['resources']['resources'].append({'name':path,'file':path,'kind':'image','metadata':'','smoothed':True,'userAdded':True})
        animation=copy.deepcopy(template);animation['name']=m['Animation'];animation['directions']=animation['directions'][:1];sprite=animation['directions'][0]['sprites'][0];sprite.update(image=m['Road'],hasCustomCollisionMask=False,customCollisionMask=[]);animation['directions'][0]['sprites']=[sprite];road['animations'].append(animation)
        for kind,name in m['PropAnimations'].items():
            path=f'assets/map/chapters/{m["Id"]}_{kind.lower()}.svg';art=prop_art(m,kind);ET.fromstring(art);(ROOT/path).write_text(art,encoding='utf-8')
            if not any(r['name']==path for r in project['resources']['resources']):project['resources']['resources'].append({'name':path,'file':path,'kind':'image','metadata':'','smoothed':True,'userAdded':True})
            animation=copy.deepcopy(template);animation['name']=name;animation['directions']=animation['directions'][:1];sprite=animation['directions'][0]['sprites'][0];sprite.update(image=path,hasCustomCollisionMask=False,customCollisionMask=[]);animation['directions'][0]['sprites']=[sprite];decor['animations'].append(animation)
        if m.get('Environment'):
            env=m['Environment']
            for asset in env['Assets']:
                path=asset['Resource']
                if not any(r['name']==path for r in project['resources']['resources']):project['resources']['resources'].append({'name':path,'file':path,'kind':'image','metadata':'','smoothed':True,'userAdded':True})
                name='VoidBackdrop' if path==env['Backdrop'] else 'IslandCliffFrame' if path==env['Frame'] else 'Ground_Decoration'
                obj=next(o for o in scene['objects'] if o['name']==name)
                animation=copy.deepcopy(template);animation['name']=asset['Animation'];animation['directions']=animation['directions'][:1];sprite=animation['directions'][0]['sprites'][0];sprite.update(image=path,hasCustomCollisionMask=False,customCollisionMask=[]);animation['directions'][0]['sprites']=[sprite];obj['animations'].append(animation)
        chapter=campaign['Chapters'][m['Chapter']-1];chapter.update(Name=m['Name'],ShortName=m['ShortName'],Description=m['Description'],MapId=m['Id'],Status='IMPLEMENTED')
    campaign.update(ChapterCapacity=8,ReleasedChapters=5,FutureChapters=cfg['FutureChapters'])
    levels['variables']=[var('CampaignConfig',campaign)]
    write('layouts/game-scene.json',scene);write('Tower Defense.json',project);write('tools/campaign-config.json',campaign);write('layouts/levels.json',levels)
    print(json.dumps([{'chapter':m['Chapter'],'length':m['Length'],'turns':m['Turns'],'props':len(m['Decorations'])} for m in maps]))


if __name__=='__main__':
    build()
