"""Read-only comparison against the pre-audio commit; write audit evidence only."""
import ast, copy, hashlib, json, subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parent.parent
BASE='5b8bfc9633cf0cd838e28130432e4251ba7c4c2d'
def git(*args):
    return subprocess.check_output(['git',*args],cwd=ROOT)
def old(path):
    return git('show',BASE+':'+path).decode('utf-8-sig')
def read(path):
    return (ROOT/path).read_text(encoding='utf-8-sig')
checks=[]
def ok(value,message):
    assert value,message
    checks.append(message)
ok(git('rev-parse','HEAD').decode().strip()==BASE,'Git HEAD/history unchanged')
p=json.loads(read('Tower Defense.json'));s=json.loads(read('layouts/game-scene.json'))
op=json.loads(old('Tower Defense.json'));os=json.loads(old('layouts/game-scene.json'))
ok({k:v for k,v in p.items() if k!='resources'}=={k:v for k,v in op.items() if k!='resources'},'Project properties, global objects, extensions, variables and scene links unchanged')
ok({k:v for k,v in s.items() if k not in ['events','objects','variables','layers']}=={k:v for k,v in os.items() if k not in ['events','objects','variables','layers']},'Instances, positions, map, object groups, scene properties and shared behavior data unchanged')
ok(s['objects'][:len(os['objects'])]==os['objects'],'All 61 existing object definitions, sprites, sizes and tower/enemy stats unchanged')
ok(s['variables'][:len(os['variables'])]==os['variables'],'All existing scene variable values and gameplay configuration unchanged')
ok(s['layers'][:len(os['layers'])]==os['layers'],'All seven existing layer and camera definitions unchanged')
ok([o['name'] for o in s['objects'][len(os['objects']):]]==['AudioPanel','AudioText','AudioBlock','AudioSpeaker'],'Only four audio widget definitions added')
ok([v['name'] for v in s['variables'][len(os['variables']):]]==['AudioConfig','AudioUIConsumesClick','AudioPanelOpen'],'Only three audio variables added')
ok([l['name'] for l in s['layers'][len(os['layers']):]]==['AudioUI'],'Only the audio overlay layer added')

legacy={'assets/starter_switch.wav','assets/starting_woodthump.wav'}
baseline_events=copy.deepcopy(os['events']);removed=[]
def strip_audio(e,path):
    if 'actions' in e:
        keep=[]
        for action in e['actions']:
            if action['type']['value']=='PlaySound' and action['parameters'][1] in legacy:removed.append(path)
            else:keep.append(action)
        e['actions']=keep
    for i,ch in enumerate(e.get('events',[])):strip_audio(ch,path+[i])
for i,e in enumerate(baseline_events):strip_audio(e,[i])
ok(removed==[[5,0],[5,1],[9,1]],'Exactly three legacy PlaySound actions replaced; no gameplay action removed')
mapping=json.loads(read('tools/cleanup-audit/source-mapping.json'))
base_mapping=json.loads(old('tools/cleanup-audit/source-mapping.json'))
ok(mapping[:-1]==base_mapping and mapping[-1]==[17,[0],'audio-runtime.js'],'Existing source mapping preserved; one audio event appended')
patches=next(ast.literal_eval(n.value) for n in ast.parse(read('tools/integrate-audio.py')).body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='patches' for t in n.targets))
for idx,children,name in mapping:
    event=s['events'][idx]
    for child in children:event=event['events'][child]
    source=read('tools/'+name)
    ok(event['inlineCode']==source.splitlines(),'Source/embed agree: '+name)
    if idx==17:continue
    before=old('tools/'+name)
    expected=before
    for search,replacement in patches.get(name,[]):
        ok(expected.count(search)==1,'Unique audio input guard: '+name)
        expected=expected.replace(search,replacement)
    ok(expected==source,'Protected gameplay source unchanged except an audio input guard: '+name)
    restored=baseline_events[idx]
    for child in children:restored=restored['events'][child]
    restored['inlineCode']=source.splitlines()
ok(s['events'][:17]==baseline_events,'All original event trees/actions/conditions identical after the six UI guards and three legacy sound substitutions')
ok(len(s['events'])==18 and s['events'][17]['name']=='Original galaxy audio and compact settings','One appended audio group; no unrelated new gameplay event')

manifest=json.loads(read('assets/audio/manifest.json'));assets=manifest['assets']
ok(len(assets)==25 and sum(a['kind']=='music' for a in assets)==4,'Exactly four original BGM and 21 SFX')
resources=p['resources']['resources'];byname={r['name']:r for r in resources}
ok(len(byname)==len(resources),'Resource names unique')
expected=[r for r in op['resources']['resources'] if r['name'] not in legacy]
ok(resources[:len(expected)]==expected,'Every pre-existing non-audio resource remains identical')
ok({k:v for k,v in p['resources'].items() if k!='resources'}=={k:v for k,v in op['resources'].items() if k!='resources'},'Resource folder metadata unchanged')
ok({r['name'] for r in resources[len(expected):]}=={a['file'] for a in assets}|{'assets/ui/audio_speaker.svg'},'Only final used audio resources and speaker SVG registered')
def value(v):
    return {c['name']:value(c) for c in v['children']} if v['type']=='structure' else v['value']
config=value(next(v for v in s['variables'] if v['name']=='AudioConfig'))
ok({d['File'] for d in config['Music'].values()}|{d['File'] for d in config['SFX'].values()}=={a['file'] for a in assets},'Every final OGG is used in the runtime configuration')
ok(set(config['SFX'])=={a['id'] for a in assets if a['kind']=='sfx'},'Every SFX has a configured event cue')
for asset in assets:
    path=(ROOT/asset['file']).resolve()
    ok(path.is_relative_to(ROOT.resolve()) and path.is_file(),'Relative asset exists: '+asset['id'])
    ok(byname[asset['file']]['kind']=='audio' and byname[asset['file']]['file']==asset['file'],'Audio registration valid: '+asset['id'])
    actual=hashlib.sha256(path.read_bytes()).hexdigest()
    ok(actual==asset['sha256'],'Final encoded checksum: '+asset['id'])
for resource in resources:
    if resource.get('file'):ok((ROOT/resource['file']).is_file(),'Referenced resource exists: '+resource['name'])
names={o['name'] for o in s['objects']}|{o['name'] for o in p['objects']}
ok(all(i['name'] in names for i in s['instances']),'Every scene instance still has a valid object definition')
for oldfile in legacy:ok(oldfile not in json.dumps(p)+json.dumps(s),'No stale legacy audio reference: '+oldfile)
changed=git('diff','--name-only','--','assets').decode().splitlines()
ok(set(changed)==legacy,'Existing art/map/enemy/tower assets are byte-identical; only two superseded audio files removed')
untracked=git('ls-files','--others','--exclude-standard').decode().splitlines()
ok(not any(Path(f).suffix.lower() in ['.bak','.backup','.old','.zip'] or any('backup' in part.lower() for part in Path(f).parts) for f in untracked),'No new backup files, folders, copies or ZIP archives')
ok(not git('diff','--name-only','--','backups').strip(),'Existing user backups preserved')
for f in untracked:
    if f.endswith('.json'):
        data=json.loads(read(f))
        ok(not isinstance(data,dict) or 'gdVersion' not in data,'No duplicate project JSON: '+f)
report={'baselineCommit':BASE,'checks':checks,'counts':{'checks':len(checks),'objects':len(s['objects']),'layers':len(s['layers']),'resources':len(resources),'BGM':4,'SFX':21},'audioBytes':sum((ROOT/a['file']).stat().st_size for a in assets),'removedLegacyAudio':sorted(legacy),'noBackupsCreated':True}
(ROOT/'design_previews/audio/static-audit.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='checks'}))
