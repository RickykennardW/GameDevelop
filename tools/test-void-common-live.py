"""Native inputs and rendered screenshots/video; no game code is replaced."""
import asyncio, base64, json, socket, subprocess, urllib.request
from pathlib import Path
import websockets
W=Path(r'C:\Users\My ASUS\.codex\visualizations\2026\10\06\01a11249-1cf3-7f03-9834-01083d6fb50c\gdevelop-shop-rework-validation')
OUT=Path(__file__).resolve().parent.parent/'design_previews/void_enemies'
OUT.mkdir(parents=True,exist_ok=True)
sock=socket.socket();sock.bind(('127.0.0.1',0));port=sock.getsockname()[1];sock.close()
proc=subprocess.Popen(['C:/Program Files/Google/Chrome/Application/chrome.exe','--headless','--allow-file-access-from-files','--remote-debugging-port='+str(port),'--user-data-dir='+str(W/'void-common-live-profile'),'--window-size=1920,1080','--hide-scrollbars',(W/'preview/clean-sidebar-live.html').as_uri()],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
lines=[];errors=[]
async def main():
 for _ in range(200):
  try:target=next(t for t in json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json')) if t['type']=='page');break
  except Exception:await asyncio.sleep(.1)
 async with websockets.connect(target['webSocketDebuggerUrl'],max_size=20000000) as ws:
  count=0
  async def call(method,params=None):
   nonlocal count
   count+=1;await ws.send(json.dumps(dict(id=count,method=method,params=params or {})))
   while True:
    result=json.loads(await ws.recv())
    if result.get('method')=='Runtime.exceptionThrown' or (result.get('method')=='Runtime.consoleAPICalled' and result['params'].get('type')=='error') or (result.get('method')=='Log.entryAdded' and result['params']['entry'].get('level')=='error'):errors.append(result)
    if result.get('id')==count:
     if 'error' in result:raise RuntimeError(result['error'])
     return result.get('result',{})
  async def js(code):
   result=await call('Runtime.evaluate',dict(expression=code,returnByValue=True,awaitPromise=True))
   if 'exceptionDetails' in result:raise RuntimeError(result['exceptionDetails'])
   return result.get('result',{}).get('value')
  async def frames(n=4):await js('new Promise(r=>{let n='+str(n)+';const f=()=>--n?requestAnimationFrame(f):r(true);requestAnimationFrame(f)})')
  def ok(value,message):
   if not value:raise AssertionError(message)
   lines.append('PASS '+message)
  async def click(point):
   await call('Input.dispatchMouseEvent',dict(type='mouseMoved',**point));await frames()
   await call('Input.dispatchMouseEvent',dict(type='mousePressed',**point,button='left',clickCount=1));await frames()
   await call('Input.dispatchMouseEvent',dict(type='mouseReleased',**point,button='left',clickCount=1));await frames()
  async def screenshot(name):
   result=await call('Page.captureScreenshot',dict(format='png'));(OUT/(name+'.png')).write_bytes(base64.b64decode(result['data']))
  await call('Runtime.enable');await call('Log.enable');await call('Page.enable');await call('Page.reload');await asyncio.sleep(.5)
  for _ in range(300):
   if await js('!!(window.testGame&&testGame.getSceneStack().getCurrentScene()?.__voidHound)'):break
   await asyncio.sleep(.1)
  ok(await js('!!testGame.getSceneStack().getCurrentScene().__voidHound'),'native exported GDevelop runtime loaded')
  await call('Emulation.setDeviceMetricsOverride',dict(width=1920,height=1080,deviceScaleFactor=1,mobile=False));await frames(8)
  await js("window.S=testGame.getSceneStack().getCurrentScene();window.V=S.getVariables();window.F=S.__freePlacement;window.SC=S.__starCannon;window.H=S.__voidHound;window.N=S.__novaWisp;window.O=n=>S.getObjects(n)[0];window.Q=(x,y)=>{const p=S.getLayer('').convertInverseCoords(x,y,0,[0,0]);return {x:p[0],y:p[1]}};window.P=o=>{const p=S.getLayer(o.getLayer()).convertInverseCoords(o.getCenterXInScene(),o.getCenterYInScene(),0,[0,0]);return {x:p[0],y:p[1]}};window.cam=()=>JSON.stringify([S.getLayer('').getCameraX(),S.getLayer('').getCameraY(),S.getLayer('').getCameraZoom()]);window.beforeCam=cam();window.route=JSON.stringify(V.get('MonsterPathPoints').toJSObject());V.get('Money').setNumber(20000);window.free=()=>{for(let y=300;y<970;y+=13.7)for(let x=350;x<1250;x+=13.7)if(F.validate('StarCannonTower',x,y).valid)return Q(x,y);throw Error('no free point')};true")
  await js("window.C=S.__voidCommon;window.ids=['VoidGuard','VoidSentinel','VoidBrute'];window.dirs=['Up','Down','Left','Right'];window.actors=[];for(let row=0;row<3;row++)for(let col=0;col<4;col++){const e=S.createObject('Enemy');e.getVariables().get('EnemyType').setString(ids[row]);C.ensure(e);e.setPosition([350,730,1110,1490][col]-24,[350,600,865][row]-24);e.getVariables().get('MoveSpeed').setNumber(0);e.getVariables().get('Facing').setString(dirs[col]);C.setAnimation(e,'Idle_');actors.push(e);}true");await frames(20)
  ok(await js('actors.every((e,i)=>e.getAnimationName()===ids[Math.floor(i/4)]+"Idle_"+dirs[i%4]&&e.getWidth()===48&&e.getHeight()===48&&e.getAngle()===0)'),'twelve native views:3species x4directions,48px stable collider/no rotation')
  ok(await js('actors.every(e=>e.getBehavior("Health").MaxHealth()===({VoidGuard:150,VoidSentinel:120,VoidBrute:220})[e.getVariables().get("EnemyType").getAsString()])'),'actual150/120/220HP initialized')
  await screenshot('Three_Enemies_Four_Directions')
  await click(await js('P(O("ShopIndexButton"))'));await click(await js('P(S.__unitIndex.objects.tab1)'))
  ok(await js('S.__unitIndex.entries.length===5&&S.__unitIndex.entries[0].name==="Nova Wisp"&&S.__unitIndex.entries[1].name==="Void Hound"'),'native Index preserves old entries and adds exactly3')
  await screenshot('Five_Enemy_Index');await click(await js('P(S.__unitIndex.objects.buttonClose)'))
  await js('window.types=["Basic","VoidHound","VoidGuard","VoidSentinel","VoidBrute"];window.fill=(count)=>{S.getObjects("Enemy").slice().forEach(e=>e.deleteFromScene());for(let i=0;i<count;i++){const e=S.createObject("Enemy"),t=types[i%5];e.getVariables().get("EnemyType").setString(t);if(t==="Basic")N.ensure(e);else if(t==="VoidHound")H.ensure(e);else C.ensure(e);e.setPosition(250+(i%25)*53-24,310+Math.floor(i/25)*65-24);e.getVariables().get("MoveSpeed").setNumber(0);}return true};fill(40)');await frames(10)
  async def benchmark(count):
   result=await js('new Promise(resolve=>{const times=[];let previous=performance.now();function tick(){const now=performance.now();times.push(now-previous);previous=now;if(times.length<120)requestAnimationFrame(tick);else resolve({actors:S.getObjects("Enemy").length,frames:times.length,meanMs:times.reduce((a,b)=>a+b,0)/times.length,maxMs:Math.max(...times)});}requestAnimationFrame(tick);})')
   (OUT/('performance-'+str(count)+'.json')).write_text(json.dumps(result,indent=2),encoding='utf-8');return result
  perf40=await benchmark(40);ok(perf40['actors']==40 and perf40['frames']==120,'actual120-frame mixed40-enemy performance measured')
  await js('fill(200)');await frames(10);perf200=await benchmark(200);ok(perf200['actors']==200,'actual200 mixed-enemy stress benchmark measured')
  await screenshot('Mixed_200_Enemy_Stress')
  await js('S.getObjects("Enemy").slice().forEach(e=>e.deleteFromScene());true');await frames(8)
  ok(await js('C.actors.size===0&&S.__enemyHealthBars.size===0'),'native deletion cleans all common actors/owned healthbars')
  await js('V.get("Wave").setNumber(6);V.get("LastRewardedWave").setNumber(6);true');await click(await js('P(O("ShopPlayButton"))'));await click(await js('P(O("ShopPlayButton"))'))
  for _ in range(40):
   if await js('S.__waveManager.index===28'):break
   await frames(60)
  ok(await js('V.get("Wave").getAsNumber()===7&&S.getObjects("Enemy").length===28&&S.__waveManager.queue.filter(t=>t==="VoidGuard").length===2&&S.__waveManager.queue.filter(t=>t==="VoidSentinel").length===2&&S.__waveManager.queue.filter(t=>t==="VoidBrute").length===1&&S.__waveManager.queue.filter(t=>t==="VoidHound").length===8'),'nativeWave7 exact15Nova/8Hound/2Sentinel/2Guard/1Brute sequential spawn')
  await screenshot('Five_Types_Mixed_Wave_7')
  video=await js("new Promise(resolve=>{const stream=document.querySelector('canvas').captureStream(60),rec=new MediaRecorder(stream,{mimeType:'video/webm',videoBitsPerSecond:2500000}),chunks=[];rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};rec.onstop=()=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(chunks,{type:'video/webm'}));};rec.start();setTimeout(()=>rec.stop(),5000);})")
  (OUT/'Five_Enemy_Gameplay_Animation.webm').write_bytes(base64.b64decode(video));ok(len(video)>10000,'actualfive-second mixed-wave animation recorded')
  await js('S.getObjects("Enemy").slice().forEach(e=>e.deleteFromScene());V.get("Wave").setNumber(0);V.get("LastRewardedWave").setNumber(0);V.get("WaveActive").setBoolean(false);V.get("EnemiesToSpawn").setNumber(0);V.get("WaveMode").setString("Waiting");S.__waveManager.queue=[];S.__waveManager.index=0;V.get("Money").setNumber(20000);true');await frames()
  await click(await js('P(S.__towerShopUI.cards[0].background)'));await click(await js('free()'))
  ok(await js('S.getObjects("StarCannonTower").length===1&&V.get("Money").getAsNumber()===19700'),'smallStarShop/native purchase/placement300 unchanged')
  await js('window.T=O("StarCannonTower");window.center=F.center(T);window.G=S.createObject("Enemy");G.getVariables().get("EnemyType").setString("VoidGuard");C.ensure(G);G.setPosition(center[0]+150-24,center[1]-70-24);G.getVariables().get("MoveSpeed").setNumber(0);window.g0=V.get("Money").getAsNumber();true')
  for _ in range(150):
   if await js('G.getBehavior("Health").Health()<150'):break
   await frames(2)
  ok(await js('G.getBehavior("Health").Health()===110'),'actualStar50 damage minus existing10armor yields40')
  await screenshot('Guard_Hit_Armor_10')
  for _ in range(220):
   if await js('G.__voidCommonState.dying'):break
   await frames(2)
  ok(await js('G.__voidCommonState.dying&&G.getHitBoxes().length===0&&V.get("Money").getAsNumber()===g0+8'),'nativeGuarddeath disables collision and pays8once')
  await screenshot('Guard_Death');await frames(60)
  ok(await js('!S.getObjects("Enemy").includes(G)&&V.get("Money").getAsNumber()===g0+8&&T.getVariables().get("DamageDealt").getAsNumber()===150'),'native death finishes/8reward/150actualDamageDealt')
  ok(await js('cam()===beforeCam&&JSON.stringify(V.get("MonsterPathPoints").toJSObject())===route&&S.__towerShopUI.cards[0].background.getWidth()===84'),'map/camera/route/smallStarShop unchanged')
  (OUT/'console-errors.json').write_text(json.dumps(errors,indent=2),encoding='utf-8');ok(not errors,'console0 errors/missing assets/uncaught exceptions')
  print('PERFORMANCE40',json.dumps(perf40));print('PERFORMANCE200',json.dumps(perf200))
  print('\n'.join(lines));print('ALL NATIVE VOID COMMON CHECKS PASSED')
try:asyncio.run(main())
except Exception:
 print('\n'.join(lines));raise
finally:
 (OUT/'native-tests.txt').write_text('\n'.join(lines),encoding='utf-8');proc.terminate()
