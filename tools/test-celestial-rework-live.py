import asyncio,json,subprocess,urllib.request,socket,base64
from pathlib import Path
import websockets
W=Path(r'C:\Users\My ASUS\.codex\visualizations\2026\10\06\01a11249-1cf3-7f03-9834-01083d6fb50c\gdevelop-shop-rework-validation')
sock=socket.socket();sock.bind(('127.0.0.1',0));port=sock.getsockname()[1];sock.close()
proc=subprocess.Popen(['C:/Program Files/Google/Chrome/Application/chrome.exe','--headless','--allow-file-access-from-files','--remote-debugging-port='+str(port),'--user-data-dir='+str(W/'rework-live-profile'),'--window-size=1280,800','--hide-scrollbars',(W/'preview/sidebar-live.html').as_uri()],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
async def main():
 for _ in range(100):
  try:target=next(t for t in json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json')) if t['type']=='page');break
  except Exception:await asyncio.sleep(.1)
 async with websockets.connect(target['webSocketDebuggerUrl'],max_size=10000000) as ws:
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
  for _ in range(100):
   if await js('!!(window.testGame && testGame.getSceneStack().getCurrentScene()?.__archerSystem)'):break
   await asyncio.sleep(.1)
  await call('Emulation.setDeviceMetricsOverride',dict(width=1920,height=1080,screenWidth=1920,screenHeight=1080,deviceScaleFactor=1,mobile=False));await frames()
  await js('window.S=testGame.getSceneStack().getCurrentScene();window.V=S.getVariables();window.O=n=>S.getObjects(n)[0];window.P=o=>{const l=S.getLayer(o.getLayer()),p=l.convertInverseCoords(o.getCenterXInScene(),o.getCenterYInScene(),0,[0,0]);return {x:p[0],y:p[1]}};V.get("Money").setNumber(30000);')
  lines=[]
  def ok(v,m):
   if not v:raise AssertionError(m)
   lines.append('PASS '+m)
  async def click(p):
   await call('Input.dispatchMouseEvent',dict(type='mouseMoved',**p));await frames()
   await call('Input.dispatchMouseEvent',dict(type='mousePressed',**p,button='left',clickCount=1));await frames()
   await call('Input.dispatchMouseEvent',dict(type='mouseReleased',**p,button='left',clickCount=1));await frames()
  async def screenshot(name):
   r=await call('Page.captureScreenshot',dict(format='png'));(W/(name+'.png')).write_bytes(base64.b64decode(r['data']))
  await js("window.F=S.__freePlacement;window.Q=(x,y)=>{const p=S.getLayer('').convertInverseCoords(x,y,0,[0,0]);return {x:p[0],y:p[1]}};window.free=side=>{const g=O('Ground_Map'),area=S.__towerShopUI.gameArea,mid=(area.left+area.right)/2;for(let y=g.getY()+140.4;y<g.getY()+g.getHeight()-70;y+=13.7)for(let x=g.getX()+100.8;x<g.getX()+g.getWidth()-100;x+=13.7){const sx=Q(x,y).x;if((side==='left'?sx>mid-130&&sx<mid-60:sx>mid+60&&sx<mid+130)&&[[0,0],[-2,0],[2,0],[0,-2],[0,2]].every(v=>F.validate('ArcherTower',x+v[0],y+v[1]).valid))return Q(x,y);}throw Error('No native side point')};true")
  await call('Runtime.evaluate',dict(expression='document.documentElement.requestFullscreen()',userGesture=True,awaitPromise=True));await frames()
  ok(await js('!!document.fullscreenElement'),'browser Fullscreen API entered')
  ok(await js('S.getObjects("MapEndpointLabel").length===0'),'endpoint label instances removed')
  route=await js('JSON.stringify(V.get("MonsterPathPoints").toJSObject())')
  async def world_fit():
   return await js("(()=>{const a=S.__towerShopUI.gameArea.frame;return S.__islandEdges.every(e=>{const b=e.sprite.getBounds();return b.x>=a.left-.01&&b.y>=a.top-.01&&b.x+b.width<=a.right+.01&&b.y+b.height<=a.bottom+.01})})()")
  ok(await world_fit(),'Full HD complete cliff perimeter inside viewport')
  await screenshot('fullscreen-map-1920')
  for side in ['left','right']:
   await click(await js('P(S.__towerShopUI.cards[3].background)'));await click(await js('free('+json.dumps(side)+')'))
  ok(await js('S.getObjects("ArcherTower").length===2'),'native purchase two towers with medium footprints')
  await js('window.A=S.getObjects("ArcherTower")[0];window.B=S.getObjects("ArcherTower")[1];window.centered=o=>{const c=F.center(o),f=S.__towerBaseRings.get(o.getUniqueId()),r=O("RangeIndicator");return [f,r].every(v=>Math.abs(v.getCenterXInScene()-c[0])<.001&&Math.abs(v.getCenterYInScene()-c[1])<.001)};true')
  for tower,side in [('A','RIGHT'),('B','LEFT'),('A','RIGHT')]:
   await click(await js('P('+tower+')'))
   ok(await js('S.__selectedPanel.tower==='+tower+'&&S.__selectedPanel.panelSide==='+json.dumps(side)),'native click swaps tower and panel '+side)
   ok(await js('!O("RangeIndicator").isHidden()&&!S.__towerBaseRings.get('+tower+'.getUniqueId()).isHidden()&&[...S.__blockedBuildRings.values()].every(o=>o.isHidden())'),'native selected range plus one footprint '+side)
   ok(await js('centered('+tower+')'),'native selected footprint/range canonical center '+side)
   await screenshot('audit-panel-'+side.lower())
  await click(await js('P(S.__selectedPanel.cards[0].background)'))
  ok(await js('A.getAnimationName()==="1_0"&&A.getVariables().get("FootprintRadius").getAsNumber()===44'),'native dynamic panel upgrade retains radius')
  for width,height in [(2560,1440),(960,540),(800,480),(1920,1080)]:
   await call('Emulation.setDeviceMetricsOverride',dict(width=width,height=height,deviceScaleFactor=1,mobile=False));await frames(8)
   ok(await js('(()=>{const r=S.__selectedPanel.screenRect,a=S.__towerShopUI.gameArea,h=O("HUDPanel"),b=S.getLayer("UI").convertInverseCoords(h.getX(),h.getY()+h.getHeight(),0,[0,0])[1];return r.x>=0&&r.x+r.w<=a.right&&r.y>=b&&r.y+r.h<=testGame.getGameResolutionHeight()})()'),'native panel inside viewport and below HUD '+str(width))
   ok(await js('centered(A)&&A.getUniqueId()!==B.getUniqueId()'),'native range/footprint stable across resize '+str(width))
   ok(await js('JSON.stringify(V.get("MonsterPathPoints").toJSObject())')==route,'route unchanged across resize '+str(width))
   ok(await world_fit(),'complete cliff fits '+str(width))
   if width==2560:await screenshot('fullscreen-panel-2560')
   if width==800:await screenshot('fullscreen-panel-800')
  await click(await js('P(S.__towerShopUI.cards[0].background)'));await frames();await screenshot('fullscreen-building-circles')
  ok(await js('F.active&&[...S.__towerBaseRings.values()].every(o=>!o.isHidden())&&[...S.__blockedBuildRings.values()].every(o=>!o.isHidden())'),'native building shows all medium circles')
  await js("window.c=F.blockers.find(o=>o.owner.getVariables().get('Kind').getAsString()==='Crystal');window.touch=(()=>{const sum=40+c.r;for(let i=0;i<360;i++){const a=i*Math.PI/180;if(F.validate('Tower',c.x+(sum+3)*Math.cos(a),c.y+(sum+3)*Math.sin(a)).valid&&F.validate('Tower',c.x+sum*Math.cos(a),c.y+sum*Math.sin(a)).reason==='obstacle')return Q(c.x+(sum-2)*Math.cos(a),c.y+(sum-2)*Math.sin(a));}throw Error('No native tangent')})();window.money=V.get('Money').getAsNumber();true")
  await call('Input.dispatchMouseEvent',dict(type='mouseMoved',**await js('touch')));await frames();await screenshot('fullscreen-circle-invalid')
  ok(await js('!V.get("PlacementValid").getAsBoolean()&&S.__placementBaseRing.getColor()==="255;96;135"'),'native touching obstacle circle gives invalid preview')
  await click(await js('touch'))
  ok(await js('S.getObjects("Tower").length===0&&V.get("Money").getAsNumber()===money&&F.active'),'native overlapping-circle click does not charge')
  await call('Input.dispatchKeyEvent',dict(type='keyDown',key='Escape',code='Escape',windowsVirtualKeyCode=27));await frames();await call('Input.dispatchKeyEvent',dict(type='keyUp',key='Escape',code='Escape',windowsVirtualKeyCode=27));await frames();await screenshot('fullscreen-towers-1920')
  await click(await js('P(O("ShopPlayButton"))'));await frames(230)
  ok(await js('V.get("WaveActive").getAsBoolean()&&S.getObjects("Enemy").length>0'),'native PLAY starts active wave and spawns monsters')
  await screenshot('fullscreen-wave-1920')
  (W/'rework-native-validation.txt').write_text('\n'.join(lines)+'\nALL NATIVE MEDIUM CIRCLE/PANEL CHECKS PASSED\n');print(len(lines),'native medium circle/panel checks PASS')
try:asyncio.run(main())
finally:proc.terminate();proc.wait(timeout=10)

