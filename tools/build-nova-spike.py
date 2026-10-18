"""Assemble final modular Nova Spike sprites and configure the active split project.

Generated artwork stays in its original alpha atlas. Frames are cropped by the
native renderer; Pillow only assembles the matching editor/Index previews.
No source-project copies, safety assets, or intermediate images are written.
"""
import json, math, hashlib, copy
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parent.parent
ASSET=ROOT/'assets/towers/star_cannon/nova_spike'
PREFIX=ASSET.relative_to(ROOT).as_posix()
STATES=[(a,b) for a in range(6) for b in range(6) if not(a>=3 and b>=3)]
def load(p):return json.loads((ROOT/p).read_text(encoding='utf-8-sig'))
def save(p,d):(ROOT/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def unpack(v):
    if v['type']=='structure':return {c['name']:unpack(c) for c in v.get('children',[])}
    if v['type']=='array':return [unpack(c) for c in v.get('children',[])]
    return v.get('value')
def pack(name,x):
    v={'name':name}
    if isinstance(x,dict):v.update(type='structure',children=[pack(k,y) for k,y in x.items()])
    elif isinstance(x,(list,tuple)):v.update(type='array',children=[pack(str(k),y) for k,y in enumerate(x)])
    else:v.update(type='boolean' if isinstance(x,bool) else 'string' if isinstance(x,str) else 'number',value=x)
    return v

def frames(image):
    # Find the actual empty row between left-column parts rather than cutting
    # blindly at the atlas midpoint (some generated barrels start a little above it).
    w,h=image.size;alpha=image.getchannel('A');hw=w//2;hh=h//2
    def cut(x0,x1):
        rows=[(sum(alpha.crop((x0,y,x1,y+1)).point(lambda a:255 if a>=8 else 0).getdata()),abs(y-hh),y) for y in range(int(h*.44),int(h*.56))]
        return min(rows)[2]
    ly,ry=cut(0,hw),cut(hw,w)
    regions=[(0,0,hw,ly),(hw,0,w,ry),(0,ly,hw,h),(hw,ry,w,h)]
    result={}
    for name,(l,t,r,b) in zip(['Base','Chassis','Barrel','Core'],regions):
        bounds=alpha.crop((l,t,r,b)).point(lambda a:255 if a>=8 else 0).getbbox()
        assert bounds,name
        x,y,xx,yy=bounds;result[name]=[l+x,t+y,xx-x,yy-y]
    return result

def main():
    project=load('Tower Defense.json');scene=load('layouts/game-scene.json')
    variables={v['name']:unpack(v) for v in scene['variables']}
    old=variables['StarCannonConfig'];resources=project['resources']['resources']
    images={};kits={}
    for path in sorted((ASSET/'atlases').glob('*.png')):
        im=Image.open(path).convert('RGBA');assert im.getchannel('A').getextrema()==(0,255)
        key=path.stem;images[key]=im;kits[key]={'Image':path.relative_to(ROOT).as_posix(),'Frames':frames(im)}
    assert set(kits)=={f'p1_{i}' for i in range(6)}|{f'p2_{i}' for i in range(1,6)}
    states={}
    def part(kit,slot,rect,role='Housing'):
        return {'Kit':kit,'Slot':slot,'Rect':rect,'Role':role}
    for a,b in STATES:
        key=f'{a}_{b}';dual=b>=3;primary=f'p2_{b}' if dual else f'p1_{a}'
        parts=[part(primary,'Chassis',[15,17,58,52] if dual else [16,12,56,64])]
        if not dual and b:parts.append(part(f'p2_{b}','Core',[26,53,36,26] if b==1 else [20,50,48,30],'Accelerator'))
        barrels=[]
        for i,x in enumerate([33,55] if dual else [44]):
            rect=[x-8,4,16,56] if dual else [32,6,24,58]
            barrels.append(part(primary,'Barrel',rect,'Barrel'+str(i)))
        parts+=barrels
        parts.append(part(primary,'Core',[30,47,28,28] if dual else [30,43,28,32],'Core'))
        if dual and a:
            # Compression is a physical braced core module, not a tint. Each
            # barrel keeps its independently animated recoil slide underneath.
            parts+=[part(f'p1_{a}','Core',[x-6,35,12,15],'Compression'+str(i)) for i,x in enumerate([33,55])]
        muzzles=[[(p['Rect'][0]+p['Rect'][2]/2)/88,(p['Rect'][1]+p['Rect'][3]*.035)/88] for p in barrels]
        hull=[]
        for p in parts:
            x,y,w,h=p['Rect'];hull.extend([[x/88,y/88],[(x+w)/88,y/88],[(x+w)/88,(y+h)/88],[x/88,(y+h)/88]])
        # Convex hull for world selection; includes the actual mechanical barrels.
        points=sorted(set(map(tuple,hull)))
        def cross(o,a,b):return (a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0])
        lower=[];upper=[]
        for q in points:
            while len(lower)>1 and cross(lower[-2],lower[-1],q)<=0:lower.pop()
            lower.append(q)
        for q in reversed(points):
            while len(upper)>1 and cross(upper[-2],upper[-1],q)<=0:upper.pop()
            upper.append(q)
        states[key]={'RestFacing':-90,'Base':{'Contact':[.5,.5],'Socket':[.5,.5],'Scale':.55,'Hull':[[.5+.475*math.cos(i*math.tau/24),.5+.475*math.sin(i*math.tau/24)] for i in range(24)]},
            'Turret':{'Pivot':[.5,.5],'Mount':[.5,.5],'Scale':.55,'Muzzles':muzzles,'MuzzleFacing':[-90]*len(muzzles),'Hull':lower[:-1]+upper[:-1]},'Parts':parts}
        assert max(math.hypot((q[0]-.5)*88,(q[1]-.5)*88) for q in hull)<46
    components={'RotationDegreesPerSecond':variables['StarComponentConfig']['RotationDegreesPerSecond'],'FireToleranceDegrees':variables['StarComponentConfig']['FireToleranceDegrees'],
        'CanvasSize':88,'BaseKit':'p1_0','BaseRect':[2,2,84,84],'Kits':kits,'States':states,
        'RecoilDistance':3,'RecoilIntervalFraction':.65,'RecoilMaxDuration':.22,'ChargeIntervalFraction':.28,'ChargeMaxDuration':.18}
    # Additive modifiers are centralized, never applied incrementally to tower stats.
    config={k:old[k] for k in ['BaseDamage','BaseInterval','BaseRange','ProjectileSpeed','MinimumDamage','ExplosionRadius']}
    config.update(MaxLevel=5,DamageBonuses=[0,.15,.30,.30,.30,.30],SpeedBonuses=[0,.10,.20,.45,.45,.45],
        Path1RangeMultipliers=old['Path1RangeMultipliers'][:3]+[old['Path1RangeMultipliers'][3],old['Path1RangeMultipliers'][4],old['Path1RangeMultipliers'][4]],
        Path2RangeMultipliers=old['Path2RangeMultipliers'][:3]+[old['Path2RangeMultipliers'][3],old['Path2RangeMultipliers'][4],old['Path2RangeMultipliers'][4]],
        Nova={'EveryShots':4,'DamageMultiplier':1.75,'SplashRadius':old['ExplosionRadius'],'SplashRatio':old.get('SplashRatios',[0,0,0,.25])[3]},
        Fracture={'BaseArmorReduction':.20,'Duration':3},Rhythm={'PerStackSpeedBonus':.03,'MaxStacks':5,'ResetAfter':3},
        Overdrive={'Duration':2,'CooldownAfterEnd':18},Lance={'MaxTargets':5,'Lifetime':6,'HitRadius':4},
        ProjectileLifetime=6,ProjectileContactRadius=4,VisualAnchors={k:{'X':.5,'Y':.5} for k in states})
    names=[['Star Compression','Dense Stellar Core','Nova Impact','Starbreaker','Supernova Cannon'],['Astral Accelerator','Rapid Starflow','Twin Star Muzzle','Cosmic Rhythm','Celestial Overdrive']]
    descriptions=[['+15% base damage.','+30% total base damage.','Every 4th shot: 175% damage + nova splash.','Nova fractures 20% base armor for 3s.','Every 4th shot: straight lance, up to 5 enemies.'],['+10% base attack speed.','+20% total base attack speed.','Two alternating muzzles; +45% total speed.','+3% speed/shot, max 5. Reset after 3s idle.','Dual fire 2s; 18s cooldown after ending.']]
    paths=[]
    for p in range(2):
        costs=[u['Cost'] for u in old['Paths'][p]['Upgrades'][:4]]
        costs.append(math.ceil(costs[3]*[2.5,2.3][p]/50)*50)
        paths.append({'Name':['STELLAR DESTRUCTION','CELESTIAL BARRAGE'][p],'Upgrades':[{'Name':name,'Cost':costs[i],'Description':descriptions[p][i],'Icon':f'SC_Nova_P{p+1}_{i+1}'} for i,name in enumerate(names[p])]})
    config['Paths']=paths
    if old.get('MaxLevel')==5:
        # Later artwork rebuilds retain the live centralized balancing config.
        config=old;config['VisualAnchors']={k:{'X':.5,'Y':.5} for k in states};paths=config['Paths']
    # Generate matching full sprites for native editor, shop, placement ghost,
    # Index and Selected Tower preview; world rendering uses the same rectangles.
    (ASSET/'states').mkdir(exist_ok=True);previews={}
    def paste(canvas,kit,slot,rect):
        x,y,w,h=kits[kit]['Frames'][slot];part_image=images[kit].crop((x,y,x+w,y+h))
        dx,dy,dw,dh=rect;size=(round(dw*4),round(dh*4))
        canvas.alpha_composite(part_image.resize(size,Image.Resampling.LANCZOS),(round(dx*4),round(dy*4)))
    for key,meta in states.items():
        canvas=Image.new('RGBA',(352,352));paste(canvas,'p1_0','Base',components['BaseRect'])
        for p in meta['Parts']:paste(canvas,p['Kit'],p['Slot'],p['Rect'])
        file=ASSET/'states'/f'SC_{key}.png';canvas.save(file,optimize=True);previews[key]=canvas
    assert len({hashlib.sha256(im.tobytes()).hexdigest() for im in previews.values()})==27
    # Vector energy assets extend the existing native SVG visual language.
    (ASSET/'projectiles').mkdir(exist_ok=True);(ASSET/'vfx').mkdir(exist_ok=True)
    kinds=['Base','Compressed','Dense','Nova','Fractured','Lance','Accelerated','Starflow','Twin','Rhythm','Overdrive']
    palette=['#8acfff','#a7cfff','#f4d4ff','#d6a2ff','#ef99ff','#faf0ff','#70dcff','#89f2ff','#a4b7ff','#e0acff','#e5f9ff']
    for i,(kind,color) in enumerate(zip(kinds,palette)):
        for frame in range(3):
            pulse=[.72,1,.86][frame];r=5+(i%3);lance=kind=='Lance';body='M 8 24 L 112 16 L 126 24 L 112 32 Z' if lance else f'M 22 24 Q 70 {24-r*2} 115 24 Q 70 {24+r*2} 22 24 Z'
            channels=''.join(f'<path d="M {12+j*9} {15+j%2*18} Q 52 {12+j*7} 104 24" fill="none" stroke="{color}" stroke-width="{1+j%2}" opacity=".55"/>' for j in range(1+i%4))
            ring=''.join(f'<ellipse cx="{84-j*14}" cy="24" rx="3" ry="{7+j}" fill="none" stroke="#eddcff" opacity=".7"/>' for j in range((i//2)%3))
            svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="128" height="48" viewBox="0 0 128 48"><defs><radialGradient id="g"><stop stop-color="#ffffff"/><stop offset=".22" stop-color="{color}"/><stop offset=".58" stop-color="#8b4de9" stop-opacity=".7"/><stop offset="1" stop-color="#371561" stop-opacity="0"/></radialGradient><linearGradient id="b"><stop stop-color="{color}" stop-opacity="0"/><stop offset=".7" stop-color="{color}"/><stop offset="1" stop-color="#ffffff"/></linearGradient></defs><ellipse cx="83" cy="24" rx="43" ry="21" fill="url(#g)" opacity="{pulse}"/>{channels}<path d="{body}" fill="url(#b)" stroke="{color}" stroke-width="1"/><path d="M 48 24 L 119 24" stroke="white" stroke-width="2" opacity="{pulse}"/>{ring}</svg>'
            (ASSET/'projectiles'/f'{kind}_{frame}.svg').write_text(svg,encoding='utf-8')
    effects=['Base','Explosion','Fracture','Pierce','Dissipate','Surge','Stabilize','FractureIcon']
    for k,kind in enumerate(effects):
        for frame in range(6):
            t=(frame+1)/6;r=6+44*t;alpha=1-t*.82;color=['#a2dcff','#bc8bff','#e19eff','#d9eaff','#9eb6ff','#b4f4ff','#a4c4ff','#e0a0ff'][k]
            rays=''.join(f'<path d="M {64+math.cos(j*math.tau/8)*r*.4:.2f} {64+math.sin(j*math.tau/8)*r*.4:.2f} L {64+math.cos(j*math.tau/8)*(r+10):.2f} {64+math.sin(j*math.tau/8)*(r+10):.2f}" stroke="{color}" stroke-width="{3*(1-t)+.5}"/>' for j in range(8))
            shield='<path d="M 64 20 L 96 34 L 91 76 L 64 106 L 37 76 L 32 34 Z M 64 22 L 56 48 L 73 60 L 60 80 L 67 104 M 38 72 L 59 63 M 73 60 L 93 44" fill="none" stroke="#efc7ff" stroke-width="5"/>' if kind=='FractureIcon' else ''
            svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><defs><radialGradient id="g"><stop stop-color="#ffffff" stop-opacity="{1-t*.9}"/><stop offset=".2" stop-color="{color}" stop-opacity=".7"/><stop offset="1" stop-color="{color}" stop-opacity="0"/></radialGradient></defs><g opacity="{alpha}"><circle cx="64" cy="64" r="{r+14}" fill="url(#g)"/><circle cx="64" cy="64" r="{r}" fill="none" stroke="{color}" stroke-width="{4*(1-t)+1}"/><circle cx="64" cy="64" r="{r*.7}" fill="none" stroke="#fff0ff" stroke-width="1"/>{rays}{shield}</g></svg>'
            (ASSET/'vfx'/f'{kind}_{frame}.svg').write_text(svg,encoding='utf-8')
    # Remove old art identifiers only after replacing every actual scene reference.
    old_resources=[r for r in resources if r['file'].startswith('assets/towers/star_cannon/') and not r['file'].startswith(PREFIX+'/')]
    old_ids={r['name'] for r in old_resources}
    newfiles=[p.relative_to(ROOT).as_posix() for p in ASSET.rglob('*') if p.is_file()]
    existing={r['name'] for r in resources}
    for file in newfiles:
        if file not in existing:resources.append({'file':file,'kind':'image','metadata':'','name':file,'smoothed':True,'userAdded':True})
    objects={o['name']:o for o in scene['objects']}
    template=objects['StarCannonTower']['animations'][0]
    def animation(name,files,loop=False,period=.06):
        anim=copy.deepcopy(template);anim['name']=name;d=anim['directions'][0];d['looping']=loop;d['timeBetweenFrames']=period;sp=copy.deepcopy(d['sprites'][0]);sp['points']=[];sp['customCollisionMask']=[];sp['hasCustomCollisionMask']=False
        d['sprites']=[]
        for file in files:q=copy.deepcopy(sp);q['image']=file;d['sprites'].append(q)
        return anim
    for name,prefix in [('StarCannonTower',''),('StarCannonBaseVisual',''),('StarCannonTurretVisual',''),('SelectedTowerPreview','SC_')]:
        objects[name]['animations']=[animation(prefix+key,[f'{PREFIX}/states/SC_{key}.png']) for key in states]
    # Declare atlas dependencies in native animations as well as JS config so
    # GDevelop's image preloader/export dependency collector can see them.
    objects['StarCannonBaseVisual']['animations'] += [animation('NovaKit_'+key,[meta['Image']]) for key,meta in kits.items()]
    for name in ['TileType_Button','TilePlacement_Indicator','IndexTowerImage']:objects[name]['animations']=[animation('StarCannonTower',[f'{PREFIX}/states/SC_0_0.png'])]
    objects['StarCannonProjectile']['animations']=[animation(kind,[f'{PREFIX}/projectiles/{kind}_{i}.svg' for i in range(3)],True,.045) for kind in kinds]
    objects['StarCannonImpact']['animations']=[animation(kind,[f'{PREFIX}/vfx/{kind}_{i}.svg' for i in range(6)],False,.05) for kind in effects]
    objects['StarUpgradeIcon']['animations']=[animation(u['Icon'],[f'{PREFIX}/states/SC_{n+1 if p==0 else 0}_{n+1 if p==1 else 0}.png']) for p,path in enumerate(paths) for n,u in enumerate(path['Upgrades'])]
    variables['StarCannonConfig']=config;variables['StarComponentConfig']=components
    variables['TowerFootprints']['StarCannonTower']['AnchorX']=.5;variables['TowerFootprints']['StarCannonTower']['AnchorY']=.5
    for v in scene['variables']:
        if v['name'] in ['StarCannonConfig','StarComponentConfig','TowerFootprints']:v.update(pack(v['name'],variables[v['name']]))
    serialized=json.dumps(scene)
    assert not any('"'+name+'"' in serialized for name in old_ids),'An old Star asset remains referenced'
    resources[:]=[r for r in resources if r['name'] not in old_ids]
    save('layouts/game-scene.json',scene);save('Tower Defense.json',project)
    deleted=[]
    for r in old_resources:
        path=(ROOT/r['file']).resolve();assert path.is_relative_to(ASSET.parent.resolve()) and not path.is_symlink() and not path.is_junction()
        if path.is_file():deleted.append({'file':r['file'],'bytes':path.stat().st_size});path.unlink()
    for path in sorted(ASSET.parent.rglob('*'),key=lambda p:len(p.parts),reverse=True):
        if path.is_dir() and not any(path.iterdir()):path.rmdir()
    out=ROOT/'validation';out.mkdir(exist_ok=True)
    # A contact sheet is a requested visual deliverable, not a source backup.
    sheet=Image.new('RGB',(9*180,3*215+70),'#100c24');draw=ImageDraw.Draw(sheet)
    font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',16);title=ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf',22)
    draw.text((20,15),'STAR CANNON / NOVA SPIKE — 27 STATES / SAME FOOTPRINT',font=title,fill='#e4d7ff')
    order=[(a,b) for a in range(3) for b in range(3)]+[(a,b) for a in range(3,6) for b in range(3)]+[(a,b) for b in range(3,6) for a in range(3)]
    for i,(a,b) in enumerate(order):
        x=i%9*180;y=70+i//9*215;draw.rounded_rectangle((x+6,y+4,x+173,y+207),10,fill='#1b1433',outline='#786045')
        im=previews[f'{a}_{b}'].resize((168,168),Image.Resampling.LANCZOS);sheet.paste(im,(x+6,y+12),im)
        draw.text((x+72,y+181),f'{a}-{b}',font=font,fill='#dec58e')
    sheet.save(out/'Nova_Spike_27_States.png',optimize=True)
    prior=load('validation/nova-spike-assets.json') if (out/'nova-spike-assets.json').is_file() else {}
    report={'stateCount':27,'atlasCount':len(kits),'newResources':len(newfiles),'oldResourcesRemoved':deleted or prior.get('oldResourcesRemoved',[]),'physicalEnvelopeRadius':46,'logicalSize':64,'level5Costs':[p['Upgrades'][4]['Cost'] for p in paths],'generation':'Built-in image_gen; original modular painted components; deterministic native assembly (not recoloring).'}
    save('validation/nova-spike-assets.json',report)
    print(json.dumps({k:v for k,v in report.items() if k!='oldResourcesRemoved'}));print('Removed old Star assets:',len(deleted))

if __name__=='__main__':main()
