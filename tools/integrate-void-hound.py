"""One-shot scoped integration; preserve existing project fields and generated PNG alpha."""
import copy, hashlib, json, uuid
from pathlib import Path
from PIL import Image
import numpy as np

R = Path(__file__).resolve().parent.parent
SRC = Path(r'C:\Users\My ASUS\.codex\generated_images\01a11249-1cf3-7f03-9834-01083d6fb50c')
FILES = {'Right':'exec-2b3f4d65-1c98-45c7-b907-0db2332308b7.png','Left':'exec-6826b834-af60-4336-bcb9-404a94cc1ced.png','Down':'exec-5d13ac1f-fa79-467a-9a84-91ebab4bffd8.png','Up':'exec-317daedd-e294-45a0-801a-925d916868a9.png'}
SP, PP = R/'layouts/game-scene.json', R/'Tower Defense.json'
ST, PT = SP.read_text(encoding='utf-8'), PP.read_text(encoding='utf-8')
SCENE, PROJECT = json.loads(ST), json.loads(PT)
assert not any(v['name']=='VoidHoundConfig' for v in SCENE['variables']), 'Already integrated; use embed helper for subsequent source edits.'
DEST = R/'assets/void_hound'
DEST.mkdir(exist_ok=True)
VIEWS, MANIFEST = {}, []
for direction, file in FILES.items():
    target = DEST/('VoidHound_'+direction+'_Atlas.png')
    assert not target.exists()
    target.write_bytes((SRC/file).read_bytes())
    im = Image.open(target)
    assert im.mode == 'RGBA'
    a = np.array(im.getchannel('A'))
    assert a.min()==0 and (a==0).mean()>.30
    width, height = im.size
    rowcuts = [0]
    for k in [1,2,3]:
        expected = round(height*k/4)
        profile = (a>64).sum(axis=1)
        cut = min(range(max(1,expected-30),min(height-1,expected+31)), key=lambda y:(profile[y],abs(y-expected)))
        rowcuts.append(cut)
    rowcuts.append(height)
    frames, anchors, checks = [], [], []
    for row in range(4):
        lo, hi = rowcuts[row:row+2]
        profile = (a[lo:hi]>64).sum(axis=0)
        cuts = [0]
        for k in [1,2,3]:
            expected = round(width*k/4)
            cut = min(range(max(1,expected-45),min(width-1,expected+46)), key=lambda x:(profile[x],abs(x-expected)))
            cuts.append(cut)
        cuts.append(width)
        for col in range(4):
            x1,x2 = cuts[col:col+2]
            frames.append([x1,lo,x2-x1,hi-lo])
            anchors.append([((col+.5)*width/4-x1)/(x2-x1),((row+.55)*height/4-lo)/(hi-lo)])
            checks.append({'row':row,'column':col,'poseSHA256':hashlib.sha256(np.array(im)[lo:hi,x1:x2].tobytes()).hexdigest(),'opaquePixels':int((a[lo:hi,x1:x2]>64).sum())})
    image = target.relative_to(R).as_posix()
    VIEWS[direction] = {'Image':image,'Width':width,'Height':height,'CellWidth':width/4,'Frames':frames,'Anchors':anchors}
    MANIFEST.append({'file':image,'mode':'RGBA','size':[width,height],'zeroAlphaFraction':float((a==0).mean()),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'frames':checks})
(DEST/'views.json').write_text(json.dumps(VIEWS,indent=2),encoding='utf-8')
(DEST/'manifest.json').write_text(json.dumps({'enemy':'VoidHound','archetypes':1,'method':'built-in imagegen; PNG copied intact; alpha/gutters measured read-only; GPU texture crops share each atlas','reference':'D:/My Data ALL/Downloads/Lembar Konsep Musuh Void Hound.png','assets':MANIFEST},indent=2),encoding='utf-8')

def variable(name, value):
    data = {'persistentUuid':str(uuid.uuid4())}
    if name is not None: data['name']=name
    if isinstance(value,dict): data.update(type='structure',children=[variable(k,v) for k,v in value.items()])
    elif isinstance(value,list): data.update(type='array',children=[variable(None,v) for v in value])
    else: data.update(type='boolean' if isinstance(value,bool) else 'number' if isinstance(value,(int,float)) else 'string',value=value)
    return data

config = {'Name':'Void Hound','EnemyID':'VoidHound','Type':'Fast Enemy','HP':60,'Speed':135,'Armor':0,'Reward':7,'SpecialAbility':'None','MinimumWave':4,'Columns':4,'RenderSize':96,'IdleDuration':1.2,'RunDuration':.36,'HitDuration':.16,'DeathDuration':.65,'Views':VIEWS}
SCENE['variables'].append(variable('VoidHoundConfig',config))
SCENE['variables'].append(variable('EnemyWaveDistribution',{'TotalMultiplier':4,'HoundMinimumWave':4,'HoundIncreaseEvery':3,'HoundsPerStep':4}))
types = next(v for v in SCENE['variables'] if v['name']=='EnemyTypes')
types['children'].append(variable('VoidHound',{'Name':'Void Hound','HP':60,'Speed':135,'Reward':7,'Armor':0,'Scale':1,'Tint':'255;255;255','Animation':'HoundIdle_Down','MinimumWave':4,'SpecialAbility':'None'}))
enemy = next(o for o in SCENE['objects'] if o['name']=='Enemy')
index = next(o for o in SCENE['objects'] if o['name']=='IndexMonsterImage')
for direction, meta in VIEWS.items():
    for mode in ['Idle','Move','Hit','Death']:
        width, height = meta['Width'], meta['Height']
        polygon = [(.18,.40),(.35,.31),(.72,.32),(.82,.5),(.70,.68),(.3,.68)] if direction in ['Right','Left'] else [(.34,.25),(.64,.25),(.76,.50),(.64,.75),(.34,.75),(.24,.50)]
        mask = [] if mode=='Death' else [[{'x':x*width,'y':y*height} for x,y in polygon]]
        frame = {'hasCustomCollisionMask':True,'image':meta['Image'],'points':[],'originPoint':{'name':'origine','x':0,'y':0},'centerPoint':{'automatic':True,'name':'centre','x':0,'y':0},'customCollisionMask':mask}
        anim = {'name':'Hound'+mode+'_'+direction,'useMultipleDirections':False,'directions':[{'looping':mode in ['Idle','Move'],'timeBetweenFrames':.09,'sprites':[frame]}]}
        enemy['animations'].append(anim)
        if direction=='Down' and mode=='Idle': index['animations'].append(copy.deepcopy(anim))
for meta in VIEWS.values():
    PROJECT['resources']['resources'].append({'alwaysLoaded':False,'file':meta['Image'],'kind':'image','metadata':'','name':meta['Image'],'smoothed':True,'userAdded':True})

# Account for measured gutter offsets without changing generated PNG pixels.
path = R/'tools/void-hound-runtime.js'
source = path.read_text(encoding='utf-8').replace('rig.body.texture=texture;rig.frame=frame;', 'rig.body.texture=texture;rig.body.anchor.set(...meta.Anchors[row*config.Columns+frame]);rig.frame=frame;').replace('const scale=config.RenderSize/Math.max(texture.width,texture.height);','const scale=config.RenderSize/meta.CellWidth;')
path.write_text(source,encoding='utf-8')
SCENE['events'][10]['events'][0]['events'].append({'type':'BuiltinCommonInstructions::JsCode','inlineCode':source.splitlines(),'parameterObjects':'','useStrict':True})
mapping_path = R/'tools/cleanup-audit/source-mapping.json'
mapping = json.loads(mapping_path.read_text())
for idx, children, file in mapping:
    event = SCENE['events'][idx]
    for child in children: event=event['events'][child]
    event['inlineCode']=(R/'tools'/file).read_text(encoding='utf-8-sig').splitlines()

def save(path, source, data, keys):
    decoder, cursor, changes = json.JSONDecoder(), 1, []
    while cursor<len(source):
        while source[cursor].isspace() or source[cursor]==',': cursor+=1
        if source[cursor]=='}': break
        key,length=decoder.raw_decode(source[cursor:]);cursor+=length
        while source[cursor].isspace() or source[cursor]==':': cursor+=1
        _,length=decoder.raw_decode(source[cursor:])
        if key in keys: changes.append((cursor,length,json.dumps(data[key],indent=2,ensure_ascii=False).replace('\n','\n  ')))
        cursor+=length
    for cursor,length,value in reversed(changes): source=source[:cursor]+value+source[cursor+length:]
    assert json.loads(source)==data
    path.write_text(source,encoding='utf-8')
save(SP,ST,SCENE,{'events','objects','variables'})
save(PP,PT,PROJECT,{'resources'})
path=R/'tools/embed-free-placement.py'
source=path.read_text().replace("(10, (0, 1), 'nova-wisp-runtime.js'),", "(10, (0, 1), 'nova-wisp-runtime.js'), (10, (0, 2), 'void-hound-runtime.js'),")
path.write_text(source,encoding='utf-8')
mapping.append([10,[0,2],'void-hound-runtime.js'])
mapping_path.write_text(json.dumps(mapping,indent=2),encoding='utf-8')
print('INTEGRATED:4 RGBA atlases/64 poses, exactly1 new archetype, shared Enemy/Health/route/combat')
