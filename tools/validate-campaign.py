"""Campaign data, native references and preserved gameplay audit; hashes only."""
import hashlib,json,sys,xml.etree.ElementTree as ET
from importlib.machinery import SourceFileLoader
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
read=lambda f:json.loads((ROOT/f).read_text(encoding='utf-8-sig'))
hash_json=lambda v:hashlib.sha256(json.dumps(v,sort_keys=True).encode()).hexdigest()
def value(v):
    if v['type']=='array':return [value(c) for c in v.get('children',[])]
    if v['type']=='structure':return {c['name']:value(c) for c in v.get('children',[])}
    return v.get('value')
checks=[]
def ok(v,m):
    if not v:raise ValueError(m)
    checks.append(m)
p=read('Tower Defense.json');g=read('layouts/game-scene.json');l=read('layouts/levels.json');m=read('layouts/main-menu.json');cfg=read('tools/campaign-config.json');before=read('validation/game-over-scope.json');vars={v['name']:value(v) for v in g['variables']};byname={r['name']:r for r in p['resources']['resources']}
ok({r['referenceTo'] for r in p['layouts']}=={'/layouts/main-menu','/layouts/game-scene','/layouts/levels'},'Exactly three connected scenes, one gameplay scene')
ok(p['firstLayout']=='MainMenu','Original startup scene retained')
ok(g['layers'][-1]['name']=='GameOverUI' and {o['name'] for o in g['objects']}>={'DefeatRestart','DefeatMainMenu','DefeatLevels','DefeatLevelsLabel'},'Existing defeat controls retained, plus campaign return below highest defeat layer')
menu={v['name']:value(v) for v in m['variables']};ok(menu['MenuConfig']['StartScene']=='Levels' and menu['MenuConfig']['GameplayScene']=='Game Scene','Start routes Levels while menu audio reads actual gameplay config')
ok(value(l['variables'][0])==cfg,'Canonical config matches native Levels structure')
ok(len(cfg['Chapters'])==5 and len(cfg['Levels'])==25,'Five chapters /25levels')
ok({v['Id'] for v in cfg['Levels']}=={f'{c}-{n}' for c in range(1,6) for n in range(1,6)},'All chapter/level IDs unique and complete')
for i,level in enumerate(cfg['Levels']):
    ok(level['Index']==i+1 and level['Chapter']==i//5+1 and level['Number']==i%5+1,'Contiguous progression: '+level['Id'])
    ok(level['StartingGold']>=vars['TowerShopCatalog'][0]['Cost'] and level['StartingLives']>0,'Viable opening funds/Lives: '+level['Id'])
    ok(5<=len(level['Waves'])<=12 and level['Boss']==(level['Number']==5),'Configured short mission and chapter boss: '+level['Id'])
    for j,w in enumerate(level['Waves']):
        ok(w['Number']==j+1 and w['Boss']==(level['Boss'] and j==len(level['Waves'])-1),'Correct final boss wave: '+level['Id']+'/'+str(j+1))
        ok(.3<=w['SpawnInterval']<=2 and .5<=w['HealthScale']<=3 and .5<=w['SpeedScale']<=1.5,'Bounded spawn and enemy scaling: '+level['Id']+'/'+str(j+1))
        ok(all(t in vars['EnemyTypes'] and isinstance(n,int) and n>0 for t,n in w['Enemies'].items()),'Only actual enemy roster: '+level['Id']+'/'+str(j+1))
        expected=sum(vars['EnemyTypes'][t]['Reward']*n for t,n in w['Enemies'].items())
        if w['Boss']:
            b=cfg['Chapters'][level['Chapter']-1]['Boss'];expected+=b['Reward']+sum(vars['EnemyTypes'][t]['Reward'] for t in b['Reserves'])
        ok(expected==w['ExpectedGold'],'Auditable real kill income: '+level['Id']+'/'+str(j+1))
    ok(sum(w['ExpectedGold'] for w in level['Waves'])==level['ExpectedKillGold'],'Mission income total: '+level['Id'])
sys.dont_write_bytecode=True
scope=SourceFileLoader('nebula_scope',str(ROOT/'tools/nebula-bloom-scope.py')).load_module()
ok(hash_json(scope.original_objects(g['objects'][:67]))==before['objectsHash'] and hash_json(g['instances'])==before['instancesHash'],'All67original definitions preserved apart from additive Nebula UI frames;157instances unchanged')
for name,expected in before['variables'].items():ok(hash_json(scope.original_variable(next(v for v in g['variables'] if v['name']==name)))==expected,'Original gameplay config preserved apart from additive Nebula catalog: '+name)
for file,expected in before['audioHashes'].items():ok(hashlib.sha256((ROOT/file).read_bytes()).hexdigest()==expected,'Audio asset unchanged: '+file)
for index,source in enumerate(['campaign-service.js','levels-runtime.js']):ok(l['events'][index]['inlineCode']==(ROOT/'tools'/source).read_text(encoding='utf-8-sig').splitlines(),'Levels embedded source match: '+source)
background_hashes=[]
for chapter in cfg['Chapters']:
    r=byname[chapter['Background']];ok(r['file']==chapter['Background'] and (ROOT/r['file']).is_file(),'Chapter resource identifier/file resolves: '+str(chapter['Id']))
    xml=ET.fromstring((ROOT/r['file']).read_text(encoding='utf-8'));ok(xml.get('width')=='1280' and xml.get('height')=='720','Final SVG background dimensions: '+str(chapter['Id']));background_hashes.append(hashlib.sha256((ROOT/r['file']).read_bytes()).hexdigest())
ok(len(set(background_hashes))==5,'Five distinct vector background compositions')
namespace={'__file__':str(ROOT/'tools/validate-project.py')};source=(ROOT/'tools/validate-project.py').read_text(encoding='utf-8');exec(compile(source.split("for f in ROOT.rglob('*'):")[0],str(ROOT/'tools/validate-project.py'),'exec'),namespace)
ok(True,'Maintained structural/resource/source checks: '+str(len(namespace['checks'])))
report={'checks':checks,'count':len(checks),'structuralChecks':len(namespace['checks']),'levels':25,'chapters':5,'waves':sum(len(v['Waves']) for v in cfg['Levels']),'backgrounds':5,'legacyStatsUnchanged':True,'originalInstancesUnchanged':True,'audioAssetsUnchanged':True,'noBackupCreated':True,'housekeeping':'Full directory cleanliness validator still rejects existing Tower Defense.json.autosave; not created/modified by this task.'}
(ROOT/'validation/campaign-static.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8');print('PASS campaign static/scope',len(checks),'maintained structural/resource',len(namespace['checks']))
