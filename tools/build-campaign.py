"""Register one data-driven campaign scene, final SVG art and runtime sources.
Direct edits only. No source-project copies, snapshots or backups.
"""
import copy,json,math,random,uuid
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
load=lambda f:json.loads((ROOT/f).read_text(encoding='utf-8-sig'))
def save(f,v): (ROOT/f).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def var(name,value):
    base={'name':name}
    if isinstance(value,dict):return {**base,'type':'structure','children':[var(k,v) for k,v in value.items()]}
    if isinstance(value,list):return {**base,'type':'array','children':[var(str(i),v) for i,v in enumerate(value)]}
    return {**base,'type':'boolean' if isinstance(value,bool) else 'number' if isinstance(value,(int,float)) else 'string','value':value}
def defaults():
    titles=['Stellar Frontier','Nebula Expanse','Ancient Celestial Ruins','Event Horizon','Cosmic Singularity']
    bosses=['The Rift Devourer','The Nebula Warden','The Astral Colossus','The Void Sovereign','The Entropy Architect']
    descriptions=['The edge of known space. Establish your first line of defense.','Read the currents. Adapt to fast and shielded enemy formations.','Awaken the ruins. Hold your ground against ancient constructs.','Where light bends. Watch the Finish and prepare for pressure.','The final fracture. Unite every lesson against the heart of the Void.']
    names=[['First Contact','Drifting Signals','Astral Crossing','Frontier Watch','The Rift Devourer'],['Violet Passage','Dust Runners','Veil of Stone','Nebula Vigil','The Nebula Warden'],['Forgotten Beacon','Temple Approach','Ancient Procession','Sanctum Siege','The Astral Colossus'],['Falling Light','Gravity Wake','Shadow Convergence','Last Horizon','The Void Sovereign'],['Celestial Fracture','Convergent Stars','Entropy Rising','Bastion of Light','The Entropy Architect']]
    totals=[[5,5,6,6,7],[6,7,7,8,8],[7,8,8,9,9],[8,9,9,10,10],[9,10,10,11,12]]
    cfg={'Version':1,'StorageKey':'starfallBastionCampaign.v1','GameplayScene':'Game Scene','LevelsScene':'Levels','MenuScene':'MainMenu','Chapters':[],'Levels':[]}
    roster=['Basic','VoidHound','VoidSentinel','VoidGuard','VoidBrute']
    reward={'Basic':5,'VoidHound':7,'VoidSentinel':6,'VoidGuard':8,'VoidBrute':10,'VoidGolem':20}
    for c in range(1,6):
        boss={'Name':bosses[c-1],'HP':[1200,3600,4400,6500,9000][c-1],'Armor':[5,10,15,18,20][c-1],'Speed':[36,39,37,41,42][c-1],'Reward':[250,450,750,1100,1800][c-1],'CastCooldown':[14,12,11,10,9][c-1],'ShieldPercent':[0,18,0,10,15][c-1],'ShieldSeconds':[0,4,0,3,4][c-1],'SurgeMultiplier':[1,1,1,1.3,1.2][c-1],'SurgeSeconds':4,'Reserves':([] if c<3 else ['VoidGuard']*(c+1)+(['VoidHound']*(c+1) if c>=4 else [])),'ReserveThreshold':.5,'Pattern':['Rift pulse: a telegraphed pause before fortification. Keep firing.','Nebula shield: a brief, visible defense after each cast.','Ancient procession: reinforcements arrive once at half health.','Horizon surge: a telegraphed burst of speed after casting.','Entropy convergence: shields, surges and one final reinforcement group.'][c-1]}
        cfg['Chapters'].append({'Id':c,'Name':titles[c-1],'ShortName':['Frontier','Nebula','Ruins','Horizon','Singularity'][c-1],'Description':descriptions[c-1],'Background':f'assets/ui/campaign/chapter_{c}.svg','Boss':boss})
        for l in range(1,6):
            index=(c-1)*5+l;gold=([9000,11000,13000,15500,18000][l-1] if c==5 else [600,1200,2100,3300][c-1]+(l-1)*[75,150,200,300][c-1])
            level={'Id':f'{c}-{l}','Index':index,'Chapter':c,'Number':l,'Name':names[c-1][l-1],'StartingGold':gold,'StartingLives':[20,18,16,14,12][c-1],'Intermission':5,'Tutorial':index==1,'Boss':l==5,'Waves':[]}
            for w in range(1,totals[c-1][l-1]+1):
                count=[8,16,26,40,74][c-1]+(l-1)*[2,3,4,5,6][c-1]+(w-1)*[2,3,4,5,6][c-1]
                if index==1 and w==1:count=6
                pool=roster[:min(5,index)]
                weights=[6,2,3,2,2][:len(pool)];rng=random.Random(index*997+w*31);counts={}
                for k in range(count):
                    t=rng.choices(pool,weights)[0];counts[t]=counts.get(t,0)+1
                if c>=2 and l>=3 and w%3==0:counts['VoidGolem']=1+(c>=4)
                last=w==totals[c-1][l-1];is_boss=l==5 and last
                wave={'Number':w,'Enemies':counts,'SpawnInterval':round(max(.38,[1.5,1.15,.95,.8,.7][c-1]-(l-1)*.025-(w-1)*.025),3),'HealthScale':round([.85,1,1.1,1.25,1.45][c-1]+(l-1)*.025+(w-1)*.02,3),'SpeedScale':round([.9,.95,1,1.04,1.08][c-1]+(l-1)*.008,3),'Boss':is_boss}
                wave['ExpectedGold']=sum(n*reward[t] for t,n in counts.items())+(boss['Reward']+sum(reward[t] for t in boss['Reserves']) if is_boss else 0)
                level['Waves'].append(wave)
            level['ExpectedKillGold']=sum(w['ExpectedGold'] for w in level['Waves']);cfg['Levels'].append(level)
    return cfg
config_file=ROOT/'tools/campaign-config.json'
if not config_file.exists():save('tools/campaign-config.json',defaults())
cfg=load('tools/campaign-config.json')
art=ROOT/'assets/ui/campaign';art.mkdir(parents=True,exist_ok=True)
# Original vector backgrounds: five distinct compositions, no bitmap placeholders.
for c in range(1,6):
    colors=[('#030c20','#12385e','#77c6eb'),('#110820','#52235e','#d999f7'),('#100f25','#2e2451','#e5c47e'),('#040610','#211c39','#bca8eb'),('#0b112b','#3a306d','#bce9ff')][c-1]
    rng=random.Random(600+c);stars=''.join(f'<circle cx="{rng.randrange(1280)}" cy="{rng.randrange(720)}" r="{rng.choice([.6,.8,1,1.4])}" fill="{colors[2]}" opacity="{rng.uniform(.15,.6):.2f}"/>' for _ in range(170))
    base=f'<rect width="1280" height="720" fill="url(#space)"/><ellipse cx="950" cy="320" rx="500" ry="330" fill="url(#haze)"/>{stars}'
    if c==1:
        feature='<circle cx="1030" cy="260" r="128" fill="url(#planet)"/><ellipse cx="1030" cy="260" rx="220" ry="24" fill="none" stroke="#7dc8ec" opacity=".22" transform="rotate(-24 1030 260)"/><circle cx="180" cy="150" r="28" fill="#364c7e" opacity=".35"/>'
    elif c==2:
        feature=''.join(f'<path d="M-120 {160+i*65} Q300 {10+i*60} 660 {240+i*50} T1450 {90+i*65}" fill="none" stroke="{colors[2]}" stroke-width="{38+i*12}" opacity=".035" filter="url(#blur)"/>' for i in range(7))+'<path d="M970 160l40 85-28 90-42-80z M1050 420l22 45-28 65-16-58z" fill="#ad83dc" opacity=".3"/>'
    elif c==3:
        feature=''.join(f'<path d="M{x} {y+165}V{y+35}L{x+35} {y}H{x+115}L{x+150} {y+35}V{y+165}H{x+123}V{y+48}L{x+102} {y+25}H{x+49}L{x+27} {y+48}V{y+165}Z" fill="#453c62" stroke="#ae9368" opacity=".37"/><path d="M{x-25} {y+172}l105 40 98-40-25-25H{x}z" fill="#1a1c34" stroke="#796482" opacity=".45"/>' for x,y in [(920,115),(160,360),(1070,470)])
    elif c==4:
        feature='<ellipse cx="1000" cy="270" rx="210" ry="74" transform="rotate(-22 1000 270)" fill="none" stroke="#8471ae" stroke-width="18" opacity=".2" filter="url(#blur)"/><ellipse cx="1000" cy="270" rx="200" ry="49" transform="rotate(-22 1000 270)" fill="none" stroke="#d9b7e9" stroke-width="3" opacity=".45"/><circle cx="1000" cy="270" r="95" fill="#02030b"/><circle cx="1000" cy="270" r="98" fill="none" stroke="#a594c8" opacity=".4"/>'
    else:
        feature='<ellipse cx="1020" cy="220" rx="220" ry="180" fill="url(#haze)"/><path d="M1100 -20L980 150l48 80-145 164 87-30-80 200 200-235-76-35 110-160-62 10z" fill="#b7bbfa" opacity=".12" stroke="#e0ebff" stroke-width="2"/><path d="M1100 -20L980 150l48 80-145 164M1028 230l170 80 80-30M970 364l-95 85-90-15" fill="none" stroke="#bedcff" stroke-width="3" opacity=".4"/>'
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><defs><linearGradient id="space" x2="1" y2="1"><stop stop-color="{colors[0]}"/><stop offset="1" stop-color="{colors[1]}"/></linearGradient><radialGradient id="haze"><stop stop-color="{colors[2]}" stop-opacity=".16"/><stop offset="1" stop-color="{colors[1]}" stop-opacity="0"/></radialGradient><radialGradient id="planet" cx=".3" cy=".2"><stop stop-color="#6594b7"/><stop offset=".7" stop-color="#1b3555"/><stop offset="1" stop-color="#071225"/></radialGradient><filter id="blur"><feGaussianBlur stdDeviation="18"/></filter></defs>{base}{feature}<rect width="1280" height="720" fill="#070719" opacity=".23"/></svg>'
    (art/f'chapter_{c}.svg').write_text(svg,encoding='utf-8')
p=load('Tower Defense.json');g=load('layouts/game-scene.json');m=load('layouts/main-menu.json')
for c in cfg['Chapters']:
    f=c['Background']
    if not any(r['name']==f for r in p['resources']['resources']):p['resources']['resources'].append({'name':f,'file':f,'kind':'image','smoothed':True,'userAdded':True,'metadata':''})
obj=copy.deepcopy(next(o for o in m['objects'] if o['name']=='MenuBackground'));obj['name']='CampaignBackdrop';obj['persistentUuid']=str(uuid.uuid4());frame=copy.deepcopy(obj['animations'][0]['directions'][0]['sprites'][0]);obj['animations']=[]
for c in cfg['Chapters']:
    sprite=copy.deepcopy(frame);sprite['image']=c['Background'];obj['animations'].append({'name':'Chapter'+str(c['Id']),'useMultipleDirections':False,'directions':[{'looping':False,'timeBetweenFrames':.1,'sprites':[sprite]}]})
event=lambda source:{'type':'BuiltinCommonInstructions::JsCode','parameterObjects':'','useStrict':True,'inlineCode':(ROOT/'tools'/source).read_text(encoding='utf-8-sig').splitlines()}
levels_path=ROOT/'layouts/levels.json'
if levels_path.exists():levels=load('layouts/levels.json');levels['variables']=[var('CampaignConfig',cfg)];levels['events']=[event('campaign-service.js'),event('levels-runtime.js')]
else:
    levels={k:copy.deepcopy(v) for k,v in m.items() if k not in ['objects','instances','events','variables','objectsFolderStructure']}
    levels.update(name='Levels',mangledName='Levels',title='Galactic Campaign',objects=[obj],instances=[],variables=[var('CampaignConfig',cfg)],events=[event('campaign-service.js'),event('levels-runtime.js')],objectsGroups=[],objectsFolderStructure={'folderName':'__ROOT','children':[{'folderName':'CAMPAIGN','children':[{'objectName':'CampaignBackdrop'}]}]})
    levels['layers'][1]['name']='CampaignUI'
    levels['uiSettings']['selectedLayer']='CampaignUI'
save('layouts/levels.json',levels)
ref={'__REFERENCE_TO_SPLIT_OBJECT':True,'referenceTo':'/layouts/levels'}
if not any(r.get('referenceTo')=='/layouts/levels' for r in p['layouts']):p['layouts'].append(ref)
menu_config=next(v for v in m['variables'] if v['name']=='MenuConfig')
if not any(v['name']=='StartScene' for v in menu_config['children']):menu_config['children'].append(var('StartScene','Levels'))
for name,value in [('CampaignModal',False),('CampaignUIConsumesClick',False),('CampaignCombatPaused',False),('CampaignTutorialActive',False),('CampaignLevelId','')]:
    if not any(v['name']==name for v in g['variables']):g['variables'].append(var(name,value))
if not any(l['name']=='CampaignUI' for l in g['layers']):
    layer=copy.deepcopy(m['layers'][1]);layer['name']='CampaignUI';g['layers'].insert(-1,layer)
if not any(o['name']=='DefeatLevels' for o in g['objects']):
    for name,source,text in [('DefeatLevels','DefeatMainMenu',None),('DefeatLevelsLabel','DefeatMainMenuLabel','LEVELS')]:
        o=copy.deepcopy(next(o for o in g['objects'] if o['name']==source));o['name']=name;o['persistentUuid']=str(uuid.uuid4())
        if text:o['string']=text;o['content']['text']=text
        g['objects'].append(o)
        ui=next(f for f in g['objectsFolderStructure']['children'] if f.get('folderName')=='06_UI');folder=next(f for f in ui['children'] if f.get('folderName')=='GameOver');folder['children'].append({'objectName':name})
mapping=load('tools/source-mapping.json')
if not any(e[2]=='campaign-game-runtime.js' for e in mapping):
    index=len(g['events'][0]['events']);g['events'][0]['events'].append(event('campaign-game-runtime.js'));mapping.append([0,[index],'campaign-game-runtime.js'])
    index=len(g['events']);g['events'].append({'type':'BuiltinCommonInstructions::Group','name':'Campaign tutorials, boss encounters and mission results','events':[event('campaign-game-after.js')]});mapping.append([index,[0],'campaign-game-after.js'])
def guard(event,name):
    cond={'type':{'value':'BooleanVariable'},'parameters':[name,'False','']}
    if cond not in event.setdefault('conditions',[]):event['conditions'].append(cond)
for i in [5,9]:
    for n in ['CampaignModal','CampaignUIConsumesClick']:guard(g['events'][i],n)
guard(g['events'][3]['events'][0],'CampaignModal');guard(g['events'][3]['events'][0],'CampaignUIConsumesClick');guard(g['events'][10]['events'][0],'CampaignCombatPaused')
save('Tower Defense.json',p);save('layouts/game-scene.json',g);save('layouts/main-menu.json',m);save('tools/source-mapping.json',mapping)
print('Registered Levels,25 configured missions,5 final vector backgrounds, campaign UI/defeat integration. No backup created.')
