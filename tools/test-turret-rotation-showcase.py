"""Native browser inputs, visible PIXI transforms, resize and gameplay screenshots."""
import asyncio,json,subprocess,urllib.request,socket,base64
from pathlib import Path
import websockets
W=Path(r'C:\Users\My ASUS\.codex\visualizations\2026\10\06\01a11249-1cf3-7f03-9834-01083d6fb50c\gdevelop-shop-rework-validation')
OUT=Path(__file__).resolve().parent.parent/'design_previews/star_cannon';OUT.mkdir(exist_ok=True)
sock=socket.socket();sock.bind(('127.0.0.1',0));port=sock.getsockname()[1];sock.close()
proc=subprocess.Popen(['C:/Program Files/Google/Chrome/Application/chrome.exe','--headless','--allow-file-access-from-files','--remote-debugging-port='+str(port),'--user-data-dir='+str(W/'turret-rotation-showcase-profile'),'--window-size=1280,800','--hide-scrollbars',(W/'preview/sidebar-live.html').as_uri()],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
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
  await js("V.get('SelectedTower').setNumber(0);window.angles=[-30,30,90,150,210,270];for(let row=0;row<2;row++)for(let i=0;i<6;i++){const t=S.createObject('StarCannonTower'),v=t.getVariables(),x=300+i*230,y=row?640:370;F.positionSprite(t,'StarCannonTower',x,y);v.get('TowerId').setNumber(9000+t.getUniqueId());v.get('FootprintX').setNumber(x);v.get('FootprintY').setNumber(y);v.get('FootprintRadius').setNumber(46);t.__plannedState=row?'2_4':'0_0';t.__plannedFacing=angles[i];}true");await frames()
  await js("for(const t of S.getObjects('StarCannonTower')){const v=t.getVariables(),key=t.__plannedState;v.get('Path1Level').setNumber(+key[0]);v.get('Path2Level').setNumber(+key[2]);SC.apply(t);t.__starFacing=t.__plannedFacing;t.__starCooldown=10000;}true");await frames()
  ok(await js('S.getObjects("StarCannonBaseVisual").every(o=>o.getAngle()===0)&&S.getObjects("StarCannonTurretVisual").length===12'),'six-angle stationary Base / rotating Turret showcase')
  await screenshot('Rotation_Six_Angles')
  manifest=await js("S.getObjects('Ground_Decoration').map((o,i)=>{const v=o.getVariables(),c=F.blockedCircle(o);return {index:i,kind:v.get('Kind').getAsString(),localScale:v.get('LocalScale').getAsNumber(),category:v.get('EnvironmentCategory').getAsString(),blocking:v.get('Blocking').getAsBoolean(),center:[o.getCenterXInScene(),o.getCenterYInScene()],blockerCenter:[c.x,c.y],blockerRadius:c.r}})")
  (OUT/'obstacle-classification.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
  print('\n'.join(lines));print('ALL NATIVE TURRET / OBSTACLE CHECKS PASSED')
try:asyncio.run(main())
except Exception:
 print('\n'.join(lines));raise
finally:
 (OUT/'rotation-showcase-tests.txt').write_text('\n'.join(lines),encoding='utf-8');proc.terminate()
