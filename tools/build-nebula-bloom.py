"""Assemble generated modular artwork and register Nebula Bloom directly.

Pillow performs mechanical atlas preparation/composition, not painted stand-ins.
Existing assets/configs are preserved; no project or asset safety copies exist.
"""
import copy,hashlib,json,math,runpy,uuid
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parent.parent
ART=ROOT/'assets/towers/nebula_bloom';PREFIX=ART.relative_to(ROOT).as_posix()
STATES=[(a,b) for a in range(6) for b in range(6) if not(a>=3 and b>=3)]
def read(p):return json.loads((ROOT/p).read_text(encoding='utf-8-sig'))
def save(p,d):(ROOT/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def pack(name,x):
    if isinstance(x,dict):return dict(name=name,type='structure',children=[pack(k,v) for k,v in x.items()])
    if isinstance(x,list):return dict(name=name,type='array',children=[pack(str(i),v) for i,v in enumerate(x)])
    return dict(name=name,type='boolean' if isinstance(x,bool) else 'string' if isinstance(x,str) else 'number',value=x)
def unpack(v):
    if v['type']=='structure':return {c['name']:unpack(c) for c in v.get('children',[])}
    if v['type']=='array':return [unpack(c) for c in v.get('children',[])]
    return v.get('value')
def box(im):
    r=im.getchannel('A').point(lambda a:255 if a>=12 else 0).getbbox();assert r
    return r
def atlas_frames(im,cols,rows):
    out=[]
    for i in range(cols*rows):
        l,t,r,b=[round(n) for n in [(i%cols)*im.width/cols,(i//cols)*im.height/rows,(i%cols+1)*im.width/cols,(i//cols+1)*im.height/rows]]
        x,y,xx,yy=box(im.crop((l,t,r,b)));out.append([l+x,t+y,xx-x,yy-y])
    return out
def fitted(im,size):
    out=Image.new('RGBA',(size,size));im=im.crop(box(im));im.thumbnail((size-8,size-8),Image.Resampling.LANCZOS);out.alpha_composite(im,((size-im.width)//2,(size-im.height)//2));return out
def fog_fitted(im):
    # Mechanical fit only: all significant alpha stays within the same circular
    # visual radius, without painting, masking or distorting the generated shape.
    im=im.crop(box(im));cx,cy=im.width/2,im.height/2
    extent=max(math.hypot(x-cx,y-cy) for y in range(im.height) for x in range(im.width) if im.getpixel((x,y))[3]>=12)
    scale=120/extent;im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
    out=Image.new('RGBA',(256,256));out.alpha_composite(im,((256-im.width)//2,(256-im.height)//2));return out

def main():
    project=read('Tower Defense.json');scene=read('layouts/game-scene.json');cfg=read('tools/nebula-bloom-config.json');manifest=read('tools/nebula-bloom-art.json')
    for folder in ['atlases','states','projectiles','effects','ui']:(ART/folder).mkdir(parents=True,exist_ok=True)
    portrait=ROOT/'assets/ui/nebula_bloom/NebulaBloom_Portrait.png';portrait.parent.mkdir(parents=True,exist_ok=True)
    for name,source in manifest['Sources'].items():
        target=portrait if name=='NebulaBloom_Portrait.png' else ART/'atlases'/name
        if not target.exists():
            im=Image.open(Path(manifest['GeneratedDirectory'])/source).convert('RGBA');assert im.getchannel('A').getextrema()[0]==0
            if target==portrait:im.thumbnail((768,768),Image.Resampling.LANCZOS)
            else:im=im.resize((im.width//2,im.height//2),Image.Resampling.LANCZOS)
            im.save(target,optimize=True)
    layouts={'NB_Components':(3,2),'NB_ToxicHeads':(3,2),'NB_CataclysmHeads':(3,2),'NB_Pods':(4,3),'NB_Effects':(4,2)}
    images={};frames={};cfg['Atlases']={}
    for name,(cols,rows) in layouts.items():
        image=Image.open(ART/'atlases'/(name+'.png')).convert('RGBA');images[name]=image;frames[name]=atlas_frames(image,cols,rows);cfg['Atlases'][name]={'Image':PREFIX+'/atlases/'+name+'.png','Frames':frames[name]}
    def crop(atlas,n):
        x,y,w,h=frames[atlas][n];return images[atlas].crop((x,y,x+w,y+h))
    cfg['States']={}
    for a,b in STATES:
        parts=[{'Atlas':'NB_Components','Frame':0,'Group':'Base','X':64,'Y':64,'Size':cfg['FoundationSize'],'Angle':0}]
        # Cross-path changes are actual chambers/emitters with fixed bounds.
        for i in range(a):
            angle=math.radians(-125+i*250/max(1,a-1));parts.append({'Atlas':'NB_Components','Frame':4,'Group':'Base','X':64+math.cos(angle)*43,'Y':64+math.sin(angle)*43,'Size':19 if a>=3 else 25,'Angle':i*35})
        for i in range(b):
            angle=math.radians(30+i*240/max(1,b-1));parts.append({'Atlas':'NB_Components','Frame':5,'Group':'Base','X':64+math.cos(angle)*43,'Y':64+math.sin(angle)*43,'Size':19 if b>=3 else 25,'Angle':i*45})
        head='NB_ToxicHeads' if a>=3 or a>0 and b<3 else 'NB_CataclysmHeads'
        frame=a if head=='NB_ToxicHeads' else b
        parts.append({'Atlas':'NB_Components' if a==b==0 else head,'Frame':1 if a==b==0 else frame,'Group':'Head','X':64,'Y':64,'Size':86+min(4,max(a,b)),'Angle':0})
        parts.append({'Atlas':'NB_Components','Frame':2,'Group':'Core','X':64,'Y':64,'Size':16+min(5,a+b),'Angle':0})
        result=Image.new('RGBA',(128,128))
        for part in parts:
            im=crop(part['Atlas'],part['Frame']);im.thumbnail((part['Size'],part['Size']),Image.Resampling.LANCZOS)
            if part['Angle']:im=im.rotate(-part['Angle'],resample=Image.Resampling.BICUBIC,expand=True)
            result.alpha_composite(im,(round(part['X']-im.width/2),round(part['Y']-im.height/2)))
        key=f'{a}_{b}';name=PREFIX+'/states/NB_'+key+'.png';result.save(ROOT/name,optimize=True);cfg['States'][key]={'Parts':parts,'Image':name}
    pods=['BasePod','ToxicPod','VirulentPod','BlightPod','CausticPod','PestilentPod','HeavySeedPod','EnlargedBurstPod','BloomDetonationShell','StellarOverbloomShell','NebulaCataclysmShell']
    cfg['Pods']={}
    for i,name in enumerate(pods):
        path=PREFIX+'/projectiles/'+name+'.png';fitted(crop('NB_Pods',i),96).save(ROOT/path,optimize=True);cfg['Pods'][name]=path
    effects=['BaseImpact','ToxicBurst','PoisonCloud','ToxicPatch','HeavyBurst','Shockwave','SporeApply','PoisonIcon'];cfg['Effects']={}
    for i,name in enumerate(effects):
        path=PREFIX+'/effects/'+name+'.png';fitted(crop('NB_Effects',i),128).save(ROOT/path,optimize=True);cfg['Effects'][name]=path
    for name in cfg['CloudVariants'][1:]:
        path=PREFIX+'/effects/'+name+'.png'
        if not (ROOT/path).exists():
            source=manifest['FogSources'][name];im=Image.open(Path(manifest['GeneratedDirectory'])/source['File']).convert('RGBA');assert im.getchannel('A').getextrema()[0]==0
            fog_fitted(im).save(ROOT/path,optimize=True)
        cfg['Effects'][name]=path
    cfg['ImpactFamilies']={'Base':'BaseImpact','Toxic':['IrritantSporesImpact','VirulentPollenBurst','BlightSporeImpact','CausticCloudBurst','PestilentSuperbloomImpact'],'Burst':['HeavySeedImpact','EnlargedExplosion','BloomDetonation','StellarOverbloomBlast','NebulaCataclysmDetonation']}
    # UI symbols extend the project's existing native SVG icon language.
    for family in ['Toxic','Burst']:
        for level in [0]:
            name='NB_'+(family+str(level) if level else 'ToxicPath' if family=='Toxic' else 'CataclysmPath');petals=5+level
            shapes=''.join(f'<ellipse cx="64" cy="36" rx="12" ry="28" transform="rotate({i*360/petals} 64 64)" fill="url(#p)" stroke="#e2c995" stroke-width="2"/>' for i in range(petals))
            nodes=''.join(f'<circle cx="{64+math.cos(i*math.tau/max(1,level))*46:.2f}" cy="{64+math.sin(i*math.tau/max(1,level))*46:.2f}" r="5" fill="#a2e7ee" stroke="#6144a5"/>' for i in range(level)) if family=='Toxic' else ''.join(f'<circle cx="64" cy="64" r="{18+i*5}" fill="none" stroke="#e4c28a" stroke-width="2"/>' for i in range(level))
            svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><defs><linearGradient id="p" x2="1" y2="1"><stop stop-color="#f3e8e8"/><stop offset="1" stop-color="{("#7454bc" if family=="Toxic" else "#a992df")}"/></linearGradient><radialGradient id="c"><stop stop-color="#c1fbff"/><stop offset=".4" stop-color="#b688ff"/><stop offset="1" stop-color="#33266e"/></radialGradient></defs>{shapes}{nodes}<circle cx="64" cy="64" r="19" fill="url(#c)" stroke="#f1d395" stroke-width="3"/></svg>'
            (ART/'ui'/(name+'.svg')).write_text(svg,encoding='utf-8')
    runpy.run_path(str(ROOT/'tools/nebula-bloom-icons.py'))['write_icons'](ART/'ui')
    resources=project['resources']['resources']
    # Restore the original component, removing only the superseded platform.
    retired='assets/towers/nebula_bloom/components/NB_Foundation.png'
    resources[:]=[r for r in resources if r['name']!=retired]
    for file in [p for p in ART.rglob('*') if p.is_file()]+[portrait]:
        path=file.relative_to(ROOT).as_posix()
        if path==retired:continue
        if not any(r['name']==path for r in resources):resources.append({'name':path,'file':path,'kind':'image','smoothed':True,'userAdded':True,'metadata':''})
    originals={o['name']:o for o in scene['objects']}
    def animation(name,image):
        frame=copy.deepcopy(originals['StarCannonTower']['animations'][0]['directions'][0]['sprites'][0]);frame['image']=image
        return {'name':name,'useMultipleDirections':False,'directions':[{'looping':True,'timeBetweenFrames':.1,'sprites':[frame]}]}
    def add_animation(obj,name,image):
        if not any(a['name']==name for a in obj['animations']):obj['animations'].append(animation(name,image))
    common={'TowerId':0,'PurchasePrice':cfg['Cost'],'TotalInvestment':cfg['Cost'],'DamageDealt':0,'Damage':cfg['BaseDamage'],'AttackRange':cfg['BaseRange'],'AttackInterval':cfg['BaseInterval'],'ProjectileSpeed':0,'Path1Level':0,'Path2Level':0,'CurrentDamage':cfg['BaseDamage'],'CurrentRange':cfg['BaseRange'],'CurrentAttackInterval':cfg['BaseInterval'],'CurrentProjectileSpeed':0,'SellValue':math.floor(cfg['Cost']*.7),'TowerName':cfg['Name'],'TowerType':'NebulaBloom','VisualKey':'0_0','ShotCounter':0,'SplashRadius':cfg['BaseRadius']}
    # GDevelop preloads images declared in object animations. Config-only atlas
    # strings otherwise return its placeholder texture until explicitly loaded.
    cfg['ArtSourceObject']='NebulaBloomArtSource'
    definitions=[('NebulaBloomTower',[(k,c['Image']) for k,c in cfg['States'].items()],common),('NebulaBloomPod',list(cfg['Pods'].items()),{}),('NebulaBloomVFX',list(cfg['Effects'].items()),{}),('NebulaPoisonIcon',[('Poison',cfg['Effects']['PoisonIcon'])],{'OwnerEnemyId':0}),('NebulaBloomArtSource',[(n,a['Image']) for n,a in cfg['Atlases'].items()],{})]
    definitions[2][1].extend((name,cfg['Effects']['ToxicBurst']) for name in cfg['ImpactFamilies']['Toxic'])
    definitions[2][1].extend((name,cfg['Effects']['HeavyBurst']) for name in cfg['ImpactFamilies']['Burst'])
    for name,animations,variables in definitions:
        obj=next((o for o in scene['objects'] if o['name']==name),None)
        if obj is None:
            obj=copy.deepcopy(originals['StarCannonTower']);obj.update(name=name,persistentUuid=str(uuid.uuid4()),effects=[],behaviors=[]);scene['objects'].append(obj)
        obj['variables']=[pack(n,v) for n,v in variables.items()];obj['animations']=[animation(n,image) for n,image in animations]
    for a,b in STATES:add_animation(originals['SelectedTowerPreview'],f'NB_{a}_{b}',cfg['States'][f'{a}_{b}']['Image'])
    add_animation(originals['TilePlacement_Indicator'],'NebulaBloomTower',cfg['States']['0_0']['Image']);add_animation(originals['TileType_Button'],'NB_Portrait',portrait.relative_to(ROOT).as_posix());add_animation(originals['IndexShowcase'],'NB_Portrait',portrait.relative_to(ROOT).as_posix())
    for path in (ART/'ui').glob('*.svg'):add_animation(originals['StarUpgradeIcon'],path.stem,path.relative_to(ROOT).as_posix())
    variables={v['name']:v for v in scene['variables']}
    if 'NebulaBloomConfig' in variables:scene['variables'][scene['variables'].index(variables['NebulaBloomConfig'])]=pack('NebulaBloomConfig',cfg)
    else:scene['variables'].append(pack('NebulaBloomConfig',cfg))
    catalog=variables['TowerShopCatalog'];entry={'Cost':cfg['Cost'],'IconAnimation':'NB_Portrait','Name':'NEBULA BLOOM','Type':'NebulaBloomTower'}
    current=next((v for v in catalog['children'] if unpack(v).get('Type')=='NebulaBloomTower'),None)
    if current:catalog['children'][catalog['children'].index(current)]=pack(str(catalog['children'].index(current)),entry)
    else:catalog['children'].append(pack(str(len(catalog['children'])),entry))
    footprint={'AnchorX':.5,'AnchorY':.5,'Height':64,'Radius':cfg['FootprintRadius'],'SafetyGap':cfg['FootprintSafetyGap'],'RenderScale':cfg['RenderScale'],'Width':64}
    for key,val in [('TowerFootprints',footprint),('IndexPortraitCatalog',{'Animation':'NB_Portrait','Image':portrait.relative_to(ROOT).as_posix(),'VisualBounds':list(box(Image.open(portrait).convert('RGBA')))})]:
        if key=='IndexPortraitCatalog':l,t,r,b=val['VisualBounds'];val['VisualBounds']=[l,t,r-l,b-t]
        owner=variables[key];owner['children']=[c for c in owner['children'] if c['name']!='NebulaBloomTower']+[pack('NebulaBloomTower',val)]
    placeables=next(g for g in scene['objectsGroups'] if g['name']=='PlaceableTile')['objects']
    if not any(o['name']=='NebulaBloomTower' for o in placeables):placeables.append({'name':'NebulaBloomTower'})
    folder=scene['objectsFolderStructure'];names=set()
    def walk(f):
        if 'objectName' in f:names.add(f['objectName'])
        else:
            for c in f['children']:walk(c)
    walk(folder);new=[{'objectName':name} for name,_,_ in definitions if name not in names]
    if new:folder['children'].append({'folderName':'NEBULA BLOOM','children':new})
    mapping=read('tools/source-mapping.json')
    def event(file):return {'type':'BuiltinCommonInstructions::JsCode','parameterObjects':'','useStrict':True,'inlineCode':(ROOT/'tools'/file).read_text(encoding='utf-8').splitlines()}
    if not any(m[2]=='nebula-bloom-runtime.js' for m in mapping):
        index=len(scene['events'][0]['events']);scene['events'][0]['events'].append(event('nebula-bloom-runtime.js'));mapping.append([0,[index],'nebula-bloom-runtime.js'])
    if not any(m[2]=='nebula-bloom-combat.js' for m in mapping):
        scene['events'][10]['events'][0]['events'].insert(6,event('nebula-bloom-combat.js'))
        for m in mapping:
            if m[0]==10 and len(m[1])>=2 and m[1][0]==0 and m[1][1]>=6:m[1][1]+=1
        mapping.append([10,[0,6],'nebula-bloom-combat.js'])
    if not any(m[2]=='nebula-bloom-render.js' for m in mapping):
        index=len(scene['events'][14]['events']);scene['events'][14]['events'].append(event('nebula-bloom-render.js'));mapping.append([14,[index],'nebula-bloom-render.js'])
    save('Tower Defense.json',project);save('layouts/game-scene.json',scene);save('tools/source-mapping.json',mapping)
    # A visual QA artifact, not a gameplay resource or a safety copy.
    sheet=Image.new('RGB',(6*150,6*166),(15,16,35));draw=ImageDraw.Draw(sheet)
    for a in range(6):
        for b in range(6):
            x,y=b*150,a*166;draw.text((x+64,y+143),f'{a}-{b}',fill=(220,210,240))
            if (a,b) in STATES:sheet.paste(Image.open(ART/'states'/f'NB_{a}_{b}.png'),(x+11,y+8),Image.open(ART/'states'/f'NB_{a}_{b}.png'))
            else:draw.text((x+56,y+60),'LOCKED',fill=(94,84,110))
    sheet.save(ROOT/'validation/Nebula_Bloom_27_States.png')
    print('Nebula Bloom registered:',len(STATES),'modular states;',len(cfg['Pods']),'pods;',len(resources),'total resources')
if __name__=='__main__':main()
