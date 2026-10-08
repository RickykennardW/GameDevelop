"""Native browser inputs, visible PIXI transforms, resize and gameplay screenshots."""
import asyncio,json,subprocess,urllib.request,socket,base64
from pathlib import Path
import websockets
W=Path(r'C:\Users\My ASUS\.codex\visualizations\2026\10\06\01a11249-1cf3-7f03-9834-01083d6fb50c\gdevelop-shop-rework-validation')
OUT=Path(__file__).resolve().parent.parent/'design_previews/star_cannon';OUT.mkdir(exist_ok=True)
sock=socket.socket();sock.bind(('127.0.0.1',0));port=sock.getsockname()[1];sock.close()
proc=subprocess.Popen(['C:/Program Files/Google/Chrome/Application/chrome.exe','--headless','--allow-file-access-from-files','--remote-debugging-port='+str(port),'--user-data-dir='+str(W/'turret-obstacle-live-profile'),'--window-size=1280,800','--hide-scrollbars',(W/'preview/sidebar-live.html').as_uri()],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
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
  await click(await js('P(S.__towerShopUI.cards[4].background)'));await click(await js('free()'))
  ok(await js('S.getObjects("StarCannonTower").length===1&&V.get("Money").getAsNumber()===19700&&!F.active'),'native Star card and single free placement charge 300')
  await js('window.A=O("StarCannonTower");window.aid=A.getUniqueId();true')
  await click(await js('(()=>{const q=SC.componentPoints(A,"Base",[[.5,.78]])[0];return Q(...q)})()'))
  ok(await js('S.__selectedPanel.tower===A'),'native visible Base click opens upgrades')
  for _ in range(2):await click(await js('P(S.__selectedPanel.cards[0].background)'))
  for _ in range(4):await click(await js('P(S.__selectedPanel.cards[1].background)'))
  ok(await js('A.getVariables().get("VisualKey").getAsString()==="2_4"&&SC.visual(A).Base.getAnimationName()==="2_4"&&SC.visual(A).Turret.getAnimationName()==="2_4"'),'native panel buys Meteor Barrage 2-4 pair')
  await js("window.center=F.center(A);window.E=S.createObject('Enemy');E.setAnimationName('Idle Run');E.setPosition(center[0]+150-E.getWidth()/2,center[1]-70-E.getHeight()/2);E.getVariables().get('MoveSpeed').setNumber(0);E.getVariables().get('Waypoint').setNumber(0);E.getVariables().get('EnemyType').setString('Normal');E.getBehavior('Health').SetMaxHealth(10000);E.getBehavior('Health').SetHealth(10000);A.__starCooldown=10000;V.get('GameOver').setBoolean(false);true");await frames(80)
  ok(await js('SC.canFire(A,E)&&SC.visual(A).Base.getAngle()===0&&Math.abs(SC.visual(A).Turret.getAngle())>1'),'live turret tracks in-range enemy while Base stays fixed')
  ok(await js("(()=>{const pair=SC.visual(A),s=pair.Turret.getRendererObject();return pair.meta.Turret.Muzzles.every(([x,y],i)=>{const global=s.toGlobal(new PIXI.Point((x-s.anchor.x)*s.texture.width,(y-s.anchor.y)*s.texture.height)),m=SC.muzzle(A,i),screen=Q(...m);return Math.hypot(global.x-screen.x,global.y-screen.y)<.01})})()"),'actual rendered PIXI mouths match world MuzzlePoints')
  await js("V.get('SelectedTower').setNumber(0);SC.fire(A,E);window.lastShots=S.getObjects('StarCannonProjectile').map(o=>o.__spawnPoint);true")
  ok(await js('lastShots.length===3&&S.getObjects("StarCannonImpact").filter(o=>o.__muzzleFlash).length===3'),'live triple volley and three muzzle flashes')
  await screenshot('Rotating_Meteor_Barrage')
  await frames(40);await js("E.setPosition(center[0]+1000,center[1]);window.angle=A.__starFacing;true");await frames(8)
  ok(await js('A.__starTargetId===0&&A.__starFacing===angle'),'live target exits range and rotation stops')
  await click(await js('Q(...SC.muzzle(A,0))'))
  ok(await js('S.__selectedPanel.tower===A'),'native rotated barrel click selects the same owner')
  await screenshot('Rotating_Turret_Selected')
  for width,height in [(2560,1440),(800,480),(1920,1080)]:
   await call('Emulation.setDeviceMetricsOverride',dict(width=width,height=height,deviceScaleFactor=1,mobile=False));await frames(8)
   ok(await js("(()=>{const pair=SC.visual(A),c=F.center(A),b=SC.componentPoints(A,'Base',[pair.meta.Base.Contact])[0],r=O('RangeIndicator');return Math.hypot(c[0]-b[0],c[1]-b[1])<.001&&Math.hypot(c[0]-r.getCenterXInScene(),c[1]-r.getCenterYInScene())<.001})()"),'Base anchor and selected range stable at '+str(width))
   ok(await js('JSON.stringify(V.get("MonsterPathPoints").toJSObject())===route'),'route unchanged at '+str(width))
  await click(await js('P(S.__selectedPanel.objects.sell)'))
  ok(await js('!S.getObjects("StarCannonTower").length&&!S.getObjects("StarCannonBaseVisual").length&&!S.getObjects("StarCannonTurretVisual").length&&SC.visuals.size===0'),'native Sell cleans both component owners')
  await js("E.deleteFromScene();window.R=O('Ground_Decoration');window.interior=S.getObjects('Ground_Decoration').filter(o=>o.getVariables().get('EnvironmentCategory').getAsString()==='RemovableObstacle');window.R=interior.find(o=>o.getVariables().get('Kind').getAsString()==='Rock');window.rid=R.getUniqueId();window.gold=V.get('Money').getAsNumber();true")
  await click(await js('P(R)'))
  ok(await js('OB.owner()===R&&!S.__selectedPanel.tower'),'native Rock click opens Clear panel')
  await screenshot('Clear_Obstacle_Panel')
  for width,height in [(800,480),(2560,1440),(1920,1080)]:
   await call('Emulation.setDeviceMetricsOverride',dict(width=width,height=height,deviceScaleFactor=1,mobile=False));await frames(8)
   ok(await js('(()=>{const r=OB.screenRect,a=S.__towerShopUI.gameArea;return r.x>=a.left&&r.x+r.w<=a.right&&r.y>=0&&r.y+r.h<=testGame.getGameResolutionHeight()})()'),'Clear panel fits outside shop at '+str(width))
   if width==800:await screenshot('Clear_Panel_800')
  await click(await js('P(OB.objects.clear)'))
  ok(await js('V.get("Money").getAsNumber()===gold-250&&!S.getObjects("Ground_Decoration").includes(R)&&!F.blockers.some(b=>b.owner.getUniqueId()===rid)&&!S.__blockedBuildRings.has(rid)'),'native Clear removes only its owner and exactly 250 gold')
  ok(await js('cam()===beforeCam&&JSON.stringify(V.get("MonsterPathPoints").toJSObject())===route'),'native clearing leaves camera and monster route fixed')
  await screenshot('Obstacle_Cleared_Map')
  print('\n'.join(lines));print('ALL NATIVE TURRET / OBSTACLE CHECKS PASSED')
try:asyncio.run(main())
except Exception:
 print('\n'.join(lines));raise
finally:
 (OUT/'native-tests.txt').write_text('\n'.join(lines),encoding='utf-8');proc.terminate()
