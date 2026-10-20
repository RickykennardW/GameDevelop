// Reused in one native scene across actual Chrome viewport resizes.
(()=>{
 const G=testGame,S=G.getSceneStack().getCurrentScene(),V=S.getVariables(),I=G.getInputManager();G.pause(true);
 const step=(n=3)=>{for(let i=0;i<n;i++){S.renderAndStep(16.667);I.onFrameEnded();}};step();
 const rect=o=>{const l=S.getLayer(o.getLayer()),a=l.convertInverseCoords(o.getX(),o.getY(),0,[0,0]),b=l.convertInverseCoords(o.getX()+o.getWidth(),o.getY()+o.getHeight(),0,[0,0]);return{x:a[0],y:a[1],w:b[0]-a[0],h:b[1]-a[1]};};
 const shop=S.__towerShopUI,metrics={viewport:[innerWidth,innerHeight],resolution:[G.getGameResolutionWidth(),G.getGameResolutionHeight()],shop:rect(shop.root),card:rect(shop.cards[0].background),hud:rect(S.getObjects('HUDPanel')[0])};
 V.get('IndexOpen').setBoolean(true);S.__unitIndex.category='Towers';step();metrics.index=S.__unitIndex.geometry;metrics.indexObjects=Object.keys(S.__unitIndex.objects).length;
 V.get('IndexOpen').setBoolean(false);step();
 if(globalThis.BALANCE_MODE==='baseline')return metrics;
 const checks=[],ok=(v,m)=>{if(!v)throw Error(m+': '+JSON.stringify(metrics));checks.push(m);};
 const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
 const inside=(r,b)=>r.x>=b.x-.1&&r.y>=b.y-.1&&r.x+r.w<=b.x+b.w+.1&&r.y+r.h<=b.y+b.h+.1;
 const W=G.getGameResolutionWidth(),H=G.getGameResolutionHeight(),bounds={x:0,y:0,w:W,h:H};
 ok(metrics.resolution.every(Number.isFinite),'finite resolution');ok(metrics.card.w>0&&metrics.card.w<=84.01,'small card never grows beyond design');
 ok(inside(metrics.shop,bounds)&&Math.abs(metrics.shop.x+metrics.shop.w-(W-8))<.1,'shop right anchor stays inside viewport');
 ok(metrics.hud.x===16&&metrics.hud.y===16&&inside(metrics.hud,bounds),'HUD anchor returns to reference position');
 const canvas=G.getRenderer().getPIXIRenderer().view.getBoundingClientRect(),factor=canvas.width/W;
 ok(metrics.card.w*factor<=84.01&&metrics.card.h*factor<=112.01,'physical card shrinks proportionally in a small window');
 ok(Math.abs(canvas.width/canvas.height-W/H)<.005,'renderer preserves aspect ratio');
 const D=S.__monsterDiscovery,F=S.__fusion,P=S.__freePlacement,star=S.__starCannon;
 let fixture=S.__resizeFixture;
 if(!fixture){
  const make=(a,b,x,y)=>{const t=S.createObject('StarCannonTower'),v=t.getVariables();for(const[n,z]of Object.entries({TowerId:900000+t.getUniqueId(),Path1Level:a,Path2Level:b,FootprintX:x,FootprintY:y,FootprintRadius:46}))v.get(n).setNumber(z);step();star.apply(t);t.__starCooldown=100000;return t;};
  fixture=S.__resizeFixture={a:make(5,2,300,352),b:make(2,5,900,352),snapshots:{}};
 }
 for(const category of ['Towers','Monsters','Fusion']){
  V.get('IndexOpen').setBoolean(true);S.__unitIndex.category=category;step();
  const U=S.__unitIndex,g=U.geometry;ok(inside(g,bounds)&&g.detail.h>=100&&g.detail.w>=100,'positive clipped Index detail: '+category);
  for(const r of U.artRects)ok(r.w>0&&r.h>0&&inside(r,r.frame),'portrait aspect fit: '+category);
  const renders=U.renderCount;step(8);ok(U.renderCount===renders,'unchanged Index uses cached layout: '+category);
 }
 V.get('IndexOpen').setBoolean(false);V.get('SelectedTower').setNumber(fixture.a.getVariables().get('TowerId').getAsNumber());step();
 ok(inside(S.__selectedPanel.screenRect,{x:0,y:0,w:shop.gameArea.right,h:H}),'Selected Tower panel remains in gameplay viewport');
 D.begin('Basic');D.active.age=1;step();const toast=D.geometry();
 ok(toast.w===272&&toast.h===60&&inside(toast,{x:0,y:0,w:shop.gameArea.right,h:H})&&!overlap(toast,metrics.hud)&&!overlap(toast,S.__selectedPanel.screenRect),'compact toast avoids HUD, shop and Selected Tower panel');
 ok(!D.root.interactive&&!D.root.interactiveChildren,'toast does not capture mouse');D.active=null;step();
 F.begin(fixture.a);F.choose(fixture.b);step();
 ok(F.active&&S.getTimeManager().getTimeScale()===.5&&inside(F.bannerRect,bounds),'Fusion sidebar and placement HUD stay bounded at tactical speed');
 ok(!overlap(F.cancelRect,rect(S.getObjects('ShopFooterFrame')[0])),'Cancel does not cover Play/Index controls');
 F.cancel();step();
 S.__audio.ui.open=true;step();ok(inside(S.__audio.geometry().panel,bounds),'audio settings panel fits');S.__audio.ui.open=false;
 const before={resolution:[W,H],revision:G.__celestialViewport.revision,shop:rect(shop.root)};
 const getWidth=gdjs.RuntimeGameRenderer.getWindowInnerWidth,getHeight=gdjs.RuntimeGameRenderer.getWindowInnerHeight;
 try{
  for(const [w,h]of [[0,0],[NaN,Infinity],[1,1]]){
   gdjs.RuntimeGameRenderer.getWindowInnerWidth=()=>w;gdjs.RuntimeGameRenderer.getWindowInnerHeight=()=>h;
   G.onWindowInnerSizeChanged();step();
   ok(W===G.getGameResolutionWidth()&&H===G.getGameResolutionHeight()&&JSON.stringify(rect(shop.root))===JSON.stringify(before.shop)&&G.__celestialViewport.revision===before.revision,'invalid/minimized viewport preserves last layout: '+w+'/'+h);
  }
 }finally{gdjs.RuntimeGameRenderer.getWindowInnerWidth=getWidth;gdjs.RuntimeGameRenderer.getWindowInnerHeight=getHeight;G.onWindowInnerSizeChanged();step();}
 // Dispatch CSS-coordinate browser events through the real renderer conversion,
 // in addition to deterministic InputManager regression suites.
 const nativeCanvas=G.getRenderer().getPIXIRenderer().view,c=rect(shop.cards[0].background),balance=V.get('Money').getAsNumber();
 P.stop();V.get('Money').setNumber(50);step();
 const pointer={clientX:canvas.left+(c.x+c.w/2)*factor,clientY:canvas.top+(c.y+c.h/2)*factor,bubbles:true,button:0};
 for(const type of ['mousemove','mousedown','mouseup']){nativeCanvas.dispatchEvent(new MouseEvent(type,{...pointer,buttons:type==='mousedown'?1:0}));step();}
 ok(P.active&&P.type==='StarCannonTower'&&V.get('Money').getAsNumber()===50,'CSS pointer maps to shop card after resize and restore');P.stop();V.get('Money').setNumber(balance);step();
 const key=W+'x'+H,snapshot=JSON.stringify({shop:rect(shop.root),card:rect(shop.cards[0].background),hud:rect(S.getObjects('HUDPanel')[0]),index:S.__unitIndex.geometry});
 if(fixture.snapshots[key])ok(snapshot===fixture.snapshots[key],'restore has identical geometry without cumulative scaling');fixture.snapshots[key]=snapshot;
 return{...metrics,checks,physicalCard:[metrics.card.w*factor,metrics.card.h*factor],viewportRevision:G.__celestialViewport.revision,invalidViewportSimulation:true};
})()
