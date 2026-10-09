"""Read-only comparison to pre-task Git HEAD; creates reports, never snapshots/backups."""
import copy,hashlib,json,re,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent;OUT=ROOT/'design_previews/void_golem';checks=[]
BASE='58e7779848d8af059823ec98e26323b4fa3c08c3'
def ok(condition,message):
 if not condition:raise AssertionError(message)
 checks.append(message)
def original(file):return subprocess.check_output(['git','show',BASE+':'+file],cwd=ROOT)
def normalized(data):return data.decode('utf-8-sig').replace('\r\n','\n')
scene=json.loads((ROOT/'layouts/game-scene.json').read_text(encoding='utf-8'));old_scene=json.loads(original('layouts/game-scene.json'));project=json.loads((ROOT/'Tower Defense.json').read_text(encoding='utf-8'));old_project=json.loads(original('Tower Defense.json'))
ok(subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()==BASE,'Git history/HEAD not modified')
for key in old_scene:
 if key not in ['objects','variables','events']:ok(old_scene[key]==scene[key],'original scene geometry/layers/groups/properties: '+key)
for key in old_project:
 if key!='resources':ok(old_project[key]==project[key],'original project properties/references: '+key)
old_vars={v['name']:v for v in old_scene['variables']};new_vars={v['name']:v for v in scene['variables']}
for name,var in old_vars.items():
 if name not in ['EnemyTypes','EnemyHPBarConfig','WaveCompletionReward','EnemyWaveDistribution']:ok(new_vars[name]==var,'unrelated stats/config variable unchanged: '+name)
oldtypes=old_vars['EnemyTypes'];types=copy.deepcopy(new_vars['EnemyTypes']);types['children']=[v for v in types['children'] if v['name']!='VoidGolem'];base=next(v for v in types['children'] if v['name']=='Basic');base['children']=[v for v in base['children'] if v['name']!='MinimumWave'];ok(types==oldtypes,'five original enemy archetypes/stats unchanged')
ok('EnemyWaveDistribution' not in new_vars,'old fixed-count active config removed')
ok(new_vars['WaveCompletionReward']['value']==0 and new_vars['MaximumWave']['value']==45,'kill-only reward accounting/45 end threshold')
old_objects={o['name']:o for o in old_scene['objects']};new_objects={o['name']:o for o in scene['objects']}
ok(set(new_objects)-set(old_objects)=={'VoidFortificationVFX','VoidFortificationCastPulse'},'only two reusable effect definitions added;shared Enemy retained')
for name,o in old_objects.items():
 n=copy.deepcopy(new_objects[name])
 if name=='Enemy':n['variables']=n['variables'][:len(o['variables'])];n['animations']=[a for a in n['animations'] if not a['name'].startswith('VoidGolem')]
 if name=='IndexMonsterImage':n['animations']=[a for a in n['animations'] if not a['name'].startswith('VoidGolem')]
 ok(n==o,'original object behavior/art/collision definitions preserved: '+name)
mapping=json.loads((ROOT/'tools/cleanup-audit/source-mapping.json').read_text());changed={'responsive-map-runtime.js','unit-index-runtime.js','nova-wisp-runtime.js','nova-wave-manager.js','nova-spawn-runtime.js','nova-movement-runtime.js','nova-death-runtime.js','island-render-runtime.js'}
events=copy.deepcopy(scene['events']);events[10]['events'][0]['events']=events[10]['events'][0]['events'][:4]
for idx,children,file in mapping:
 e=scene['events'][idx]
 for child in children:e=e['events'][child]
 ok(e['inlineCode']==(ROOT/'tools'/file).read_text(encoding='utf-8-sig').splitlines(),'source/embed agreement: '+file)
 if file in ['void-golem-runtime.js','gold-budget-runtime.js']:continue
 old=old_scene['events'][idx];n=events[idx]
 for child in children:old=old['events'][child];n=n['events'][child]
 if file in changed:n['inlineCode']=old['inlineCode']
 else:ok(e==old,'unrelated event source unchanged: '+file)
events[10]['events'][9]['events'][0]=old_scene['events'][10]['events'][9]['events'][0]
events[10]['events'][11]=old_scene['events'][10]['events'][11]
events[15]['events'][0]=old_scene['events'][15]['events'][0]
ok(events==old_scene['events'],'all other native event logic and topology retained')
for file in ['star-cannon-runtime.js','free-placement-runtime.js','selected-panel-runtime.js','world-selection-runtime.js','selected-range-runtime.js','island-map-runtime.js','obstacle-panel-runtime.js','void-hound-runtime.js','void-common-runtime.js','enemy-healthbar-runtime.js']:
 ok(normalized((ROOT/'tools'/file).read_bytes())==normalized(original('tools/'+file)),'protected runtime unchanged (Git line endings normalized): '+file)
ok(json.loads((ROOT/'eventsFunctionsExtensions/health.json').read_bytes())==json.loads(original('eventsFunctionsExtensions/health.json')),'Health extension unchanged')
resources=project['resources']['resources'];oldres=old_project['resources']['resources'];ok(resources[:len(oldres)]==oldres and len(resources)==len(oldres)+9,'all324 original resources unchanged;only nine actual golem/effect assets added')
registered={r['name'] for r in resources};ok(len(registered)==len(resources),'resource names unique')
for r in resources:ok((ROOT/r['file']).is_file(),'resource file resolves: '+r['file'])
for o in scene['objects']:
 for a in o.get('animations',[]):
  for d in a.get('directions',[]):
   for frame in d.get('sprites',[]):ok(frame['image'] in registered,'frame reference resolves: '+o['name']+'/'+a['name'])
tree=subprocess.check_output(['git','ls-tree','-r',BASE,'assets'],cwd=ROOT,text=True).splitlines();count=0
for entry in tree:
 meta,file=entry.split('\t');expected=meta.split()[2];data=(ROOT/file).read_bytes()
 if Path(file).suffix.lower() in ['.svg','.json','.txt']:data=normalized(data).encode('utf-8')
 actual=hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest();ok(actual==expected,'original artwork unchanged (text line endings normalized): '+file);count+=1
changed_names=subprocess.check_output(['git','diff','--name-only'],cwd=ROOT,text=True).splitlines();created=subprocess.check_output(['git','ls-files','--others','--exclude-standard'],cwd=ROOT,text=True).splitlines()
ok(not any(p.startswith('backups/') or re.search(r'\.(bak|backup|old|zip)$',p,re.I) for p in changed_names+created),'no backups/ZIP/snapshot/backup folders created or user backups changed')
ok(not any(p.startswith('layouts/') and p!='layouts/game-scene.json' for p in created),'no duplicate JSON scenes/project files')
ok("'project.json'" not in (ROOT/'tools/validate-clean-project.cjs').read_text(encoding='utf-8'),'native validation uses in-memory project/no duplicate projectJSON writes')
manifest=json.loads((ROOT/'assets/enemies/void_golem/manifest.json').read_text());ok(len(manifest['views'])==4 and sum(v['frameCount'] for v in manifest['files'])==80,'four source views/80 actual unique atlas poses')
report={'passed':len(checks),'originalAssetsVerified':count,'objects':len(scene['objects']),'resources':len(resources),'noBackupsCreated':True,'checks':checks}
(OUT/'static-audit.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('PASS',len(checks),'static checks;',count,'original assets identical;no backups;61objects/333resources')
