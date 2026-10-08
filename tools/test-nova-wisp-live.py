"""Native browser inputs, visible PIXI transforms, resize and gameplay screenshots."""
import asyncio,json,subprocess,urllib.request,socket,base64
from pathlib import Path
import websockets
W=Path(r'C:\Users\My ASUS\.codex\visualizations\2026\10\06\01a11249-1cf3-7f03-9834-01083d6fb50c\gdevelop-shop-rework-validation')
OUT=Path(__file__).resolve().parent.parent/'design_previews/nova_wisp';OUT.mkdir(parents=True,exist_ok=True)
sock=socket.socket();sock.bind(('127.0.0.1',0));port=sock.getsockname()[1];sock.close()
proc=subprocess.Popen(['C:/Program Files/Google/Chrome/Application/chrome.exe','--headless','--allow-file-access-from-files','--remote-debugging-port='+str(port),'--user-data-dir='+str(W/'nova-wisp-live-profile'),'--window-size=1280,800','--hide-scrollbars',(W/'preview/sidebar-live.html').as_uri()],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
lines=[]
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
    r=json.loads(await ws.recv())
    if r.get('id')==count:
     if 'error' in r:raise RuntimeError(r['error'])
     return r.get('result',{})
  async def js(code):
   r=await call('Runtime.evaluate',dict(expression=code,returnByValue=True,awaitPromise=True))
   if 'exceptionDetails' in r:raise RuntimeError(r['exceptionDetails'])
   return r.get('result',{}).get('value')
  async def frames(n=4):await js('new Promise(r=>{let n='+str(n)+';const f=()=>--n?requestAnimationFrame(f):r(true);requestAnimationFrame(f)})')
  def ok(v,m):
   if not v:raise AssertionError(m)
   lines.append('PASS '+m)
  async def click(p):
   await call('Input.dispatchMouseEvent',dict(type='mouseMoved',**p));await frames()
   await call('Input.dispatchMouseEvent',dict(type='mousePressed',**p,button='left',clickCount=1));await frames()
   await call('Input.dispatchMouseEvent',dict(type='mouseReleased',**p,button='left',clickCount=1));await frames()
  async def screenshot(name):
   r=await call('Page.captureScreenshot',dict(format='png'));(OUT/(name+'.png')).write_bytes(base64.b64decode(r['data']))
  for _ in range(300):
   if await js('!!(window.testGame&&testGame.getSceneStack().getCurrentScene()?.__starCannon)'):break
   await asyncio.sleep(.1)
  ok(await js('!!testGame.getSceneStack().getCurrentScene().__starCannon'),'exported GDevelop runtime loaded')
  await call('Emulation.setDeviceMetricsOverride',dict(width=1920,height=1080,screenWidth=1920,screenHeight=1080,deviceScaleFactor=1,mobile=False));await frames(8)
  await js("window.S=testGame.getSceneStack().getCurrentScene();window.V=S.getVariables();window.F=S.__freePlacement;window.SC=S.__starCannon;window.OB=S.__obstaclePanel;window.O=n=>S.getObjects(n)[0];window.Q=(x,y)=>{const p=S.getLayer('').convertInverseCoords(x,y,0,[0,0]);return {x:p[0],y:p[1]}};window.P=o=>{const p=S.getLayer(o.getLayer()).convertInverseCoords(o.getCenterXInScene(),o.getCenterYInScene(),0,[0,0]);return {x:p[0],y:p[1]}};V.get('Money').setNumber(20000);window.cam=()=>JSON.stringify([S.getLayer('').getCameraX(),S.getLayer('').getCameraY(),S.getLayer('').getCameraZoom()]);window.beforeCam=cam();window.route=JSON.stringify(V.get('MonsterPathPoints').toJSObject());window.free=()=>{for(let y=300;y<970;y+=13.7)for(let x=350;x<1250;x+=13.7)if([[0,0],[-2,0],[2,0],[0,-2],[0,2]].every(q=>F.validate('StarCannonTower',x+q[0],y+q[1]).valid))return Q(x,y);throw Error('No free point')};true")
  await js("window.N=S.__novaWisp;window.originalPoint=V.get('MonsterPathPoints').getChild(0).toJSObject();window.directions=['Right','Down','Left','Up'];window.monsters=[];for(let i=0;i<4;i++){const e=S.createObject('Enemy');N.ensure(e);e.setPosition([330,735,1290,1535][i]-24,350-24);e.getVariables().get('MoveSpeed').setNumber(0);e.getVariables().get('Facing').setString(directions[i]);monsters.push(e);}true");await frames(20)
  ok(await js('monsters.every((e,i)=>e.getAnimationName()==="NovaIdle_"+directions[i]&&e.getAngle()===0&&e.getBehavior("Health").Health()===100)'), 'four distinct rendered facing views with identical stats')
  await screenshot('Nova_Wisp_Four_Directions')
  await js("window.localBefore=monsters.map(e=>({logical:[e.getCenterXInScene(),e.getCenterYInScene()],crystal:e.__novaRig.crystals[0].y,orbit:e.__novaRig.glow.geometry.graphicsData[1].shape.x,bob:e.getRendererObject().y}));true");await frames(30)
  ok(await js('monsters.every((e,i)=>{const b=localBefore[i];return e.getCenterXInScene()===b.logical[0]&&e.getCenterYInScene()===b.logical[1]&&Math.abs(e.__novaRig.crystals[0].y-b.crystal)>1&&Math.abs(e.__novaRig.glow.geometry.graphicsData[1].shape.x-b.orbit)>1})'),'native float/crystal/orbit animation with stationary collider')
  await js("monsters[0].getBehavior('Health').Hit(50,false,false);true");await frames(2)
  ok(await js('monsters[0].getBehavior("Health").Health()===50&&monsters[0].getAnimationName().startsWith("NovaHit_")'),'native hit flash at50HP')
  await screenshot('Nova_Wisp_Hit')
  await js("window.killGold=V.get('Money').getAsNumber();monsters[0].getBehavior('Health').Hit(50,false,false);true");await frames(8)
  ok(await js('!S.getObjects("Enemy").includes(monsters[0])&&S.getObjects("NovaWispDeathVisual").length===1&&V.get("Money").getAsNumber()===killGold+5'),'native death retains dissolve visual and grants5 once')
  await screenshot('Nova_Wisp_Death')
  await frames(50);ok(await js('!S.getObjects("NovaWispDeathVisual").length&&V.get("Money").getAsNumber()===killGold+5'),'native death visual finishes without duplicate reward')
  await js("S.getObjects('Enemy').slice().forEach(o=>o.deleteFromScene());true");await frames()
  await click(await js('P(O("ShopPlayButton"))'));await frames(60)
  for _ in range(20):
   if await js('S.__waveManager.index===4'):break
   await frames(60)
  ok(await js('V.get("Wave").getAsNumber()===1&&S.__waveManager.queue.length===4&&S.__waveManager.index===4&&S.getObjects("Enemy").length===4'),'native PLAY spawns exactly4 identical Nova Wisps sequentially')
  ok(await js('S.getObjects("Enemy").every(o=>o.getVariables().get("EnemyType").getAsString()==="Basic"&&o.getVariables().get("MoveSpeed").getAsNumber()===80&&o.getVariables().get("GoldReward").getAsNumber()===5&&o.getBehavior("Health").Health()===100)'),'actual Wave1 has no legacy tint, boss or stat scaling')
  await screenshot('Nova_Wisp_Wave_1')
  video=await js("new Promise(resolve=>{const canvas=document.querySelector('canvas'),stream=canvas.captureStream(60),mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm',rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:2500000}),chunks=[];rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};rec.onstop=()=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(chunks,{type:mime}));};rec.start();setTimeout(()=>rec.stop(),4000);})")
  (OUT/'Nova_Wisp_Animation.webm').write_bytes(base64.b64decode(video));ok(len(video)>10000,'four-second actual gameplay animation recording saved')
  await js("V.get('WaveActive').setBoolean(false);V.get('EnemiesToSpawn').setNumber(0);S.__waveManager.queue=[];S.__waveManager.index=0;S.getObjects('Enemy').slice().forEach(o=>o.deleteFromScene());for(let i=0;i<200;i++){const e=S.createObject('Enemy');N.ensure(e);e.setPosition(250+(i%25)*55-24,300+Math.floor(i/25)*72-24);e.getVariables().get('MoveSpeed').setNumber(0);e.getVariables().get('Facing').setString(directions[i%4]);}true");await frames(5)
  ok(await js('S.getObjects("Enemy").length===200&&S.__enemyHealthBars.size===200'),'200 simultaneously animated identical enemies and owned healthbars')
  await screenshot('Nova_Wisp_200_Performance')
  perf=await js('new Promise(resolve=>{const times=[];let before=performance.now();function tick(){const now=performance.now();times.push(now-before);before=now;if(times.length<120)requestAnimationFrame(tick);else resolve({frames:times.length,meanMs:times.reduce((a,b)=>a+b,0)/times.length,maxMs:Math.max(...times),actors:S.getObjects("Enemy").length});}requestAnimationFrame(tick);})')
  (OUT/'nova-performance.json').write_text(json.dumps(perf,indent=2),encoding='utf-8');ok(perf['frames']==120 and perf['actors']==200,'120-frame benchmark completed with200 actors')
  await js("S.getObjects('Enemy').slice(40).forEach(e=>e.deleteFromScene());true");await frames(8)
  perf40=await js('new Promise(resolve=>{const times=[];let before=performance.now();function tick(){const now=performance.now();times.push(now-before);before=now;if(times.length<120)requestAnimationFrame(tick);else resolve({frames:times.length,meanMs:times.reduce((a,b)=>a+b,0)/times.length,maxMs:Math.max(...times),actors:S.getObjects("Enemy").length});}requestAnimationFrame(tick);})')
  (OUT/'nova-performance-40.json').write_text(json.dumps(perf40,indent=2),encoding='utf-8');ok(perf40['frames']==120 and perf40['actors']==40,'120-frame benchmark completed with40 actors')
  print('PERFORMANCE40',json.dumps(perf40))
  print('PERFORMANCE',json.dumps(perf))
  print('\n'.join(lines));print('ALL NATIVE NOVA WISP CHECKS PASSED')
try:asyncio.run(main())
except Exception:
 print('\n'.join(lines));raise
finally:
 (OUT/'native-tests.txt').write_text('\n'.join(lines),encoding='utf-8');proc.terminate()
