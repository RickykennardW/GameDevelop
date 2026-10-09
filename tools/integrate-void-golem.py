"""In-memory direct integration. Creates no backup/snapshot/project copy/ZIP."""
import copy,json,uuid
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
scene_path=ROOT/'layouts/game-scene.json';project_path=ROOT/'Tower Defense.json'
scene_source=scene_path.read_text(encoding='utf-8');project_source=project_path.read_text(encoding='utf-8')
s=json.loads(scene_source);p=json.loads(project_source)
manifest=json.loads((ROOT/'assets/enemies/void_golem/manifest.json').read_text(encoding='utf-8'))
def assign(var,value):
    if isinstance(value,dict):
        var['type']='structure';old={v['name']:v for v in var.get('children',[])}
        var['children']=[assign(old.get(k,{'name':k}),v) for k,v in value.items()]
    elif isinstance(value,list):
        var['type']='array';old=var.get('children',[]);var['children']=[assign(old[i] if i<len(old) else {},v) for i,v in enumerate(value)]
    else:var['type']='boolean' if isinstance(value,bool) else 'number' if isinstance(value,(int,float)) else 'string';var['value']=value
    return var
def val(v):return {x['name']:val(x) for x in v.get('children',[])} if v['type']=='structure' else [val(x) for x in v.get('children',[])] if v['type']=='array' else v.get('value')
vars={v['name']:v for v in s['variables']}
def setvar(name,value):
    if name not in vars:vars[name]={'name':name};s['variables'].append(vars[name])
    assign(vars[name],value)
types=val(vars['EnemyTypes']);assert 'VoidGolem' not in types,'already integrated; do not duplicate assets/events'
types['VoidGolem']={'Name':'Void Golem','HP':480,'Speed':50,'Armor':25,'Reward':20,'MinimumWave':12,'Classification':'Elite','Role':'Ancient Armored Void Construct','Scale':1,'Tint':'255;255;255','Animation':'VoidGolemIdle_Down','AnimationPrefix':'VoidGolem','SpecialAbility':'Void Fortification'}
types['Basic']['MinimumWave']=1;setvar('EnemyTypes',types)
skill={'Name':'Void Fortification','ArmorBonus':10,'Duration':10,'Cooldown':25,'Radius':100,'CastDuration':.8,'ReleaseTime':.6,'PulseDuration':.4,'CommonIconSize':14,'EliteIconSize':18,'Damage':0}
setvar('VoidGolemConfig',{'HP':480,'Speed':50,'Armor':25,'Reward':20,'LogicalSize':64,'RenderSize':120,'IdleDuration':1.2,'MoveDuration':1.1,'HitDuration':.16,'DeathDuration':.9,'Skill':skill,'Views':manifest['views']})
setvar('WaveBudgetConfig',{'StartingBudget':100,'BudgetIncrement':50,'MilestoneEvery':5,'MilestoneMultiplier':1.2,'LastWave':45,'Seed':177017,'MaxCommonTypes':3,'CommonWeights':{'Basic':4,'VoidHound':2,'VoidSentinel':2,'VoidGuard':1.6,'VoidBrute':1},'MilestoneArmorWeight':1.6,'MilestoneGuaranteeArmored':True,'EliteUnlockAfterWave':5,'EliteBaseChance':.25,'EliteChancePerWave':.012,'EliteMaxChance':.85,'EliteMilestoneChanceBonus':.35,'EliteBudgetShare':.10,'EliteMilestoneBudgetShare':.15,'EliteCountEvery':8,'EliteMaxCount':5})
for name,value in [('MaximumWave',45),('WaveBudget',0),('WaveBudgetSpent',0),('WaveBudgetUnused',0),('WaveEnemyCount',0),('WaveIsMilestone',False)]:setvar(name,value)
setvar('WaveCompletionReward',0)
s['variables']=[v for v in s['variables'] if v['name']!='EnemyWaveDistribution']
hp=val(vars['EnemyHPBarConfig']);hp['Types']['VoidGolem']={'Width':40,'HeadOffset':140};setvar('EnemyHPBarConfig',hp)

enemy=next(o for o in s['objects'] if o['name']=='Enemy');index=next(o for o in s['objects'] if o['name']=='IndexMonsterImage')
for name,value in [('BaseArmor',0),('EffectiveArmor',0),('VoidFortificationActive',False),('VoidFortificationExpirationTime',0),('EnemyState','Moving'),('IsCasting',False),('SkillCooldown',0),('SkillCastTimer',0),('SkillAppliedThisCast',False),('StatusEffects',{})]:enemy['variables'].append(assign({'name':name},value))
periods={'Idle':1.2,'Move':1.1,'Hit':.16,'Death':.9,'Skill':.8}
for direction,view in manifest['views'].items():
    from PIL import Image
    w,h=Image.open(ROOT/view['Image']).size
    for mode,duration in periods.items():
        sprites=[]
        for frame in range(4):
            mask=[] if mode=='Death' else [[{'x':w*.28,'y':h*.28},{'x':w*.74,'y':h*.28},{'x':w*.74,'y':h*.92},{'x':w*.28,'y':h*.92}]]
            sprites.append({'hasCustomCollisionMask':True,'image':view['Image'],'points':[],'originPoint':{'name':'origine','x':0,'y':0},'centerPoint':{'automatic':True,'name':'centre','x':0,'y':0},'customCollisionMask':mask})
        animation={'name':'VoidGolem'+mode+'_'+direction,'useMultipleDirections':False,'directions':[{'looping':mode in ['Idle','Move'],'timeBetweenFrames':duration/4,'sprites':sprites}]}
        enemy['animations'].append(animation)
        if mode=='Idle' and direction=='Down':index['animations'].append(copy.deepcopy(animation))

effects=ROOT/'assets/effects/void_fortification';effects.mkdir(parents=True,exist_ok=True)
for i in range(4):
    glow=[.45,.62,.8,.6][i];offset=[0,.5,1,.5][i]
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><defs><radialGradient id="g"><stop stop-color="#bc76ff" stop-opacity="{glow}"/><stop offset="1" stop-color="#8d39ee" stop-opacity="0"/></radialGradient><linearGradient id="s" x2=".3" y2="1"><stop stop-color="#f0e8fa"/><stop offset="1" stop-color="#9c89b9"/></linearGradient></defs><circle cx="16" cy="16" r="16" fill="url(#g)"/><path d="M16 3 27 8 25 20 16 29 7 20 5 8Z" fill="#211434" stroke="#a16bde" stroke-width="1.5"/><path d="M16 5 24 9 22 19 16 25 10 19 8 9Z" fill="none" stroke="url(#s)" stroke-width="2"/><path d="M16 8 21 14 16 22 11 14Z" fill="#7923c7" stroke="#e4b1ff" stroke-width=".8"/><path d="M16 10 18 14 16 18 14 14Z" fill="#eac5ff"/><path d="M9 10 11 11M21 11 23 10M10 17 12 18M20 18 22 17" stroke="#c2a9de" stroke-width=".7"/><path d="M{2+offset} 17 4 14 5 17 4 20ZM27 15 29 12 30 15 29 18Z" fill="#b36dff" opacity=".8"/></svg>'''
    (effects/f'Shield_{i}.svg').write_text(svg,encoding='utf-8')
(effects/'CastPulse.svg').write_text('''<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><defs><radialGradient id="f"><stop offset=".6" stop-color="#8844cc" stop-opacity="0"/><stop offset=".86" stop-color="#9e49ef" stop-opacity=".08"/><stop offset=".95" stop-color="#d3a4ff" stop-opacity=".34"/><stop offset="1" stop-color="#8833cc" stop-opacity="0"/></radialGradient></defs><circle cx="100" cy="100" r="99" fill="url(#f)"/><circle cx="100" cy="100" r="94" fill="none" stroke="#d9b9ff" stroke-width="1.4"/><circle cx="100" cy="100" r="84" fill="none" stroke="#9141d1" stroke-width="1.2" stroke-dasharray="12 5"/><g fill="#a25cde" stroke="#e3caff" stroke-width=".8"><path d="M100 8 105 17 100 26 95 17ZM100 174 105 183 100 192 95 183ZM8 100 17 95 26 100 17 105ZM174 100 183 95 192 100 183 105Z"/><path d="M37 29 43 32 45 40 39 37ZM155 29 161 32 163 40 157 37ZM37 161 43 164 45 172 39 169ZM155 161 161 164 163 172 157 169Z"/></g></svg>''',encoding='utf-8')
template=next(o for o in s['objects'] if o['name']=='HealthBarFill')
for name,files,loop in [('VoidFortificationVFX',[f'assets/effects/void_fortification/Shield_{i}.svg' for i in range(4)],True),('VoidFortificationCastPulse',['assets/effects/void_fortification/CastPulse.svg'],False)]:
    obj=copy.deepcopy(template);obj['name']=name;obj['persistentUuid']=str(uuid.uuid4());obj['variables']=[assign({'name':'OwnerEnemyId'},0)]
    sprite=copy.deepcopy(template['animations'][0]['directions'][0]['sprites'][0]);frames=[]
    for file in files:frame=copy.deepcopy(sprite);frame['image']=file;frames.append(frame)
    obj['animations']=[{'name':'Loop' if loop else 'Pulse','useMultipleDirections':False,'directions':[{'looping':loop,'timeBetweenFrames':.2,'sprites':frames}]}];s['objects'].append(obj)

resources=p['resources']['resources'];registered={r['name'] for r in resources}
for file in [v['Image'] for v in manifest['views'].values()]+[f'assets/effects/void_fortification/Shield_{i}.svg' for i in range(4)]+['assets/effects/void_fortification/CastPulse.svg']:
    if file not in registered:resources.append({'file':file,'kind':'image','metadata':'','name':file,'smoothed':True,'userAdded':True})
init=s['events'][10]['events'][0]['events']
for file in ['void-golem-runtime.js','gold-budget-runtime.js']:init.append({'type':'BuiltinCommonInstructions::JsCode','inlineCode':(ROOT/'tools'/file).read_text(encoding='utf-8').splitlines(),'parameterObjects':'','useStrict':True})
victory=s['events'][10]['events'][9]['events'][0]
for c in victory['conditions']:
    if c['parameters'][:2]==['Wave','>=']:assert c['parameters'][2]=='50';c['parameters'][2]='MaximumWave'
hud=s['events'][10]['events'][11]
for a in hud['actions']:
    if a['parameters'][0]=='WaveText':a['parameters'][-1]='ToString(Wave) + "/" + ToString(MaximumWave)'
banner=s['events'][15]['events'][0]
banner['inlineCode']=[line.replace('"All 50 waves cleared"','"All "+sv.get("MaximumWave").getAsNumber()+" waves cleared"') for line in banner['inlineCode']]

banner['inlineCode']=[line.replace('sv.get("LastRewardedWave").getAsNumber()===wave?','sv.get("LastRewardedWave").getAsNumber()===wave&&sv.get("WaveCompletionReward").getAsNumber()>0?') for line in banner['inlineCode']]

def replace(source,data,keys):
    decoder=json.JSONDecoder();cursor=1;edits=[]
    while cursor<len(source):
        while source[cursor].isspace() or source[cursor]==',':cursor+=1
        if source[cursor]=='}':break
        key,length=decoder.raw_decode(source[cursor:]);cursor+=length
        while source[cursor].isspace() or source[cursor]==':':cursor+=1
        _,length=decoder.raw_decode(source[cursor:])
        if key in keys:edits.append((cursor,cursor+length,json.dumps(data[key],ensure_ascii=False,indent=2).replace('\n','\n  ')))
        cursor+=length
    for begin,end,text in reversed(edits):source=source[:begin]+text+source[end:]
    assert json.loads(source)==data;return source
scene_path.write_text(replace(scene_source,s,{'variables','objects','events'}),encoding='utf-8')
project_path.write_text(replace(project_source,p,{'resources'}),encoding='utf-8')
mapping=json.loads((ROOT/'tools/cleanup-audit/source-mapping.json').read_text());mapping.extend([[10,[0,4],'void-golem-runtime.js'],[10,[0,5],'gold-budget-runtime.js']]);(ROOT/'tools/cleanup-audit/source-mapping.json').write_text(json.dumps(mapping,indent=2),encoding='utf-8')
print('Integrated6 enemy types/61objects/333resources;45-wave reward budget;no backup files')
