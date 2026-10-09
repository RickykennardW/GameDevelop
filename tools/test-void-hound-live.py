"""Native inputs and rendered screenshots/video; no game code is replaced."""
import asyncio, base64, json, socket, subprocess, urllib.request
from pathlib import Path
import websockets
W=Path(r'C:\Users\My ASUS\.codex\visualizations\2026\10\06\01a11249-1cf3-7f03-9834-01083d6fb50c\gdevelop-shop-rework-validation')
OUT=Path(__file__).resolve().parent.parent/'design_previews/void_hound'
OUT.mkdir(parents=True,exist_ok=True)
sock=socket.socket();sock.bind(('127.0.0.1',0));port=sock.getsockname()[1];sock.close()
proc=subprocess.Popen(['C:/Program Files/Google/Chrome/Application/chrome.exe','--headless','--allow-file-access-from-files','--remote-debugging-port='+str(port),'--user-data-dir='+str(W/'void-hound-live-profile'),'--window-size=1920,1080','--hide-scrollbars',(W/'preview/clean-sidebar-live.html').as_uri()],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
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
  await js("window.directions=['Right','Left','Down','Up'];window.hounds=directions.map((d,i)=>{const e=S.createObject('Enemy');e.getVariables().get('EnemyType').setString('VoidHound');H.ensure(e);e.setPosition([330,735,1200,1515][i]-24,350-24);e.getVariables().get('MoveSpeed').setNumber(0);e.getVariables().get('Facing').setString(d);return e;});window.nova=S.createObject('Enemy');N.ensure(nova);nova.setPosition(900-24,600-24);nova.getVariables().get('MoveSpeed').setNumber(0);true");await frames(15)
  ok(await js('hounds.every((e,i)=>e.getAnimationName()==="HoundIdle_"+directions[i]&&e.getBehavior("Health").Health()===60&&e.getWidth()===48&&e.getHeight()===48&&e.getAngle()===0)'),'four Hound views60HP/stable48px colliders')
  ok(await js('nova.getBehavior("Health").Health()===100&&!!nova.__novaRig'),'Nova100HP/animation rig retained')
  await screenshot('Void_Hound_Four_Directions')
  await click(await js('P(O("ShopIndexButton"))'));await click(await js('P(S.__unitIndex.objects.tab1)'))
  ok(await js('S.__unitIndex.entries.length===5&&S.__unitIndex.entries[1].name==="Void Hound"&&S.__unitIndex.entries[1].HP===60&&S.__unitIndex.entries[1].Speed===135&&S.__unitIndex.entries[1].Reward===7'),'native Index shows five canonical enemies')
  await screenshot('Index_Nova_And_Void_Hound');await click(await js('P(S.__unitIndex.objects.buttonClose)'))
  await js('S.getObjects("Enemy").slice().forEach(e=>e.deleteFromScene());V.get("Wave").setNumber(3);V.get("LastRewardedWave").setNumber(3);true');await frames()
  await click(await js('P(O("ShopPlayButton"))'));await click(await js('P(O("ShopPlayButton"))'))
  for _ in range(30):
   if await js('S.__waveManager.index===16'):break
   await frames(60)
  ok(await js('V.get("Wave").getAsNumber()===4&&S.getObjects("Enemy").length===16&&S.getObjects("Enemy").filter(e=>e.getVariables().get("EnemyType").getAsString()==="VoidHound").length===4'),'native PLAY Wave4 sequential12Nova+4Hounds')
  ok(await js('S.getObjects("Enemy").every(e=>e.getVariables().get("MoveSpeed").getAsNumber()===(e.getVariables().get("EnemyType").getAsString()==="VoidHound"?135:80))'),'live mixed wave135/80 fixed speeds')
  await screenshot('Void_Hound_Mixed_Wave_4')
  video=await js("new Promise(resolve=>{const stream=document.querySelector('canvas').captureStream(60),rec=new MediaRecorder(stream,{mimeType:'video/webm',videoBitsPerSecond:2500000}),chunks=[];rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};rec.onstop=()=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(chunks,{type:'video/webm'}));};rec.start();setTimeout(()=>rec.stop(),4000);})")
  (OUT/'Void_Hound_Gameplay_Animation.webm').write_bytes(base64.b64decode(video));ok(len(video)>10000,'actual four-second mixed-wave animation recorded')
  await js('S.getObjects("Enemy").slice().forEach(e=>e.deleteFromScene());V.get("Wave").setNumber(0);V.get("LastRewardedWave").setNumber(0);V.get("WaveActive").setBoolean(false);V.get("EnemiesToSpawn").setNumber(0);V.get("WaveMode").setString("Waiting");S.__waveManager.queue=[];S.__waveManager.index=0;V.get("Money").setNumber(20000);true');await frames()
  await click(await js('P(S.__towerShopUI.cards[0].background)'));await click(await js('free()'))
  ok(await js('S.getObjects("StarCannonTower").length===1&&V.get("Money").getAsNumber()===19700'),'native small Star card/purchase/placement300')
  await js('window.T=O("StarCannonTower");window.center=F.center(T);window.E=S.createObject("Enemy");E.getVariables().get("EnemyType").setString("VoidHound");H.ensure(E);E.setPosition(center[0]+150-24,center[1]-70-24);E.getVariables().get("MoveSpeed").setNumber(0);window.g0=V.get("Money").getAsNumber();true')
  for _ in range(120):
   if await js('E.getBehavior("Health").Health()<=10'):break
   await frames(2)
  ok(await js('E.getBehavior("Health").Health()===10'),'actual native Star projectile60to10')
  await screenshot('Void_Hound_Hit_By_Star')
  for _ in range(120):
   if await js('E.__houndState.dying'):break
   await frames(2)
  ok(await js('E.__houndState.dying&&E.getHitBoxes().length===0&&V.get("Money").getAsNumber()===g0+7'),'native death disables collision and pays7once')
  await screenshot('Void_Hound_Death_Dissolve');await frames(60)
  ok(await js('!S.getObjects("Enemy").includes(E)&&V.get("Money").getAsNumber()===g0+7&&T.getVariables().get("DamageDealt").getAsNumber()===60'),'native death finishes/7reward/60actualDamageDealt')
  ok(await js('cam()===beforeCam&&JSON.stringify(V.get("MonsterPathPoints").toJSObject())===route&&S.__towerShopUI.cards[0].background.getWidth()===84'),'map/camera/route/smallStarShop unchanged')
  (OUT/'console-errors.json').write_text(json.dumps(errors,indent=2),encoding='utf-8');ok(not errors,'console0 errors/missing assets/uncaught exceptions')
  print('\n'.join(lines));print('ALL NATIVE VOID HOUND CHECKS PASSED')
try:asyncio.run(main())
except Exception:
 print('\n'.join(lines));raise
finally:
 (OUT/'native-tests.txt').write_text('\n'.join(lines),encoding='utf-8');proc.terminate()
