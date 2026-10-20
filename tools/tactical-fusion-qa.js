// Real exported native scene; fixture towers/props live only in an isolated test profile.
(async()=>{
 const G=testGame,S=G.getSceneStack().getCurrentScene(),V=S.getVariables(),I=G.getInputManager(),get=n=>S.getObjects(n),checks=[];
 const ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);},near=(a,b)=>Math.abs(a-b)<.0001,step=(n=1)=>{for(let i=0;i<n;i++){S.renderAndStep(16.667);I.onFrameEnded();}};
 const move=(x,y,layer='')=>{I.onMouseMove(...S.getLayer(layer).convertInverseCoords(x,y,0,[0,0]));step(2);},click=(x,y,layer='')=>{move(x,y,layer);I.onMouseButtonPressed(0);step(2);I.onMouseButtonReleased(0);step(2);};
 const intersects=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
 const rect=o=>{const l=S.getLayer(o.getLayer()),a=l.convertInverseCoords(o.getX(),o.getY(),0,[0,0]),b=l.convertInverseCoords(o.getX()+o.getWidth(),o.getY()+o.getHeight(),0,[0,0]);return{x:a[0],y:a[1],w:b[0]-a[0],h:b[1]-a[1]};};
 G.pause(true);step(4);const F=S.__fusion,P=S.__freePlacement,A=G.__fusionArchive,N=S.__fusionDiscovery,star=S.__starCannon,map=S.getLayer('');
 const baseline={gold:V.get('Money').getAsNumber(),camera:[map.getCameraX(),map.getCameraY(),map.getCameraZoom()],route:V.get('MonsterPathPoints').toJSObject(),config:V.get('StarburstConfig').toJSObject()};
 const make=(a,b,x,y)=>{const t=S.createObject('StarCannonTower'),v=t.getVariables();for(const [n,z]of Object.entries({TowerId:900000+t.getUniqueId(),PurchasePrice:300,TotalInvestment:300,Path1Level:a,Path2Level:b,FootprintX:x,FootprintY:y,FootprintRadius:46}))v.get(n).setNumber(z);step();star.apply(t);t.__starCooldown=100000;return t;};
 const a=make(5,2,300,352),b=make(2,5,900,352),ordinary=make(0,0,420,352),otherMax=make(5,2,1120,800);
 const auditHud=r=>{
  const area=S.__towerShopUI.gameArea;ok(r.x>=area.sidebarX&&r.x+r.w<=G.getGameResolutionWidth()-8&&r.y>=8&&r.y+r.h<=G.getGameResolutionHeight()-8,'compact HUD stays wholly inside sidebar');
  for(const o of [get('ShopHeaderPlaque')[0],get('ShopFooterFrame')[0],get('HUDPanel')[0],...S.__towerShopUI.cards.map(c=>c.background)].filter(o=>!o.isHidden()))ok(!intersects(r,rect(o)),'HUD avoids '+o.getName());
  for(const other of [S.__selectedPanel.screenRect,S.__obstaclePanel.screenRect].filter(Boolean))ok(!intersects(r,other),'HUD avoids Selected/Obstacle panel');
 };
 ok(F.begin(a),'eligible source starts tactical mode');step(3);auditHud(F.bannerRect);
 ok(F.sidebar.phase==='SELECT_PARTNER'&&get('AssetPanelTitle')[0].getString()==='FUSION'&&F.sidebar.result===null,'partner sidebar uses selection state without a second result panel');
 ok(F.markers.has(a.getUniqueId())&&F.markers.has(b.getUniqueId())&&F.markers.has(otherMax.getUniqueId())&&!F.markers.has(ordinary.getUniqueId()),'only max towers receive candidate indicators');
 ok(!F.obstacleFootprints.size&&S.getTimeManager().getTimeScale()===.5,'partner mode preserves0.5x and does not show placement blockers early');
 if(globalThis.BALANCE_MODE==='partner')return{checks,hud:F.bannerRect};
 click(...P.center(b));ok(F.stage==='placement'&&F.b===b,'distant source selected by real map input');move(...P.center(a));auditHud(F.bannerRect);
 ok(F.preview.valid&&F.validate(...P.center(b)).valid&&F.ghost.getColor()==='180;255;230','green ghost may overlap either consumed source');
 ok(F.sidebar.phase==='PREVIEW_PLACEMENT'&&F.sidebar.result.id==='StarburstCannon'&&F.sidebar.result.cost===F.config.FusionCost,'placement sidebar identifies actual fusion and cost through catalog');
 const auditBlockers=()=>{
  ok(F.obstacleFootprints.size===P.blockers.length,'every actual environment collider has one footprint');
  const drawings=F.worldGraphics.geometry.graphicsData.filter(d=>d.lineStyle.color===0xf2b866&&d.shape.type===PIXI.SHAPES.CIRC);
  ok(drawings.length===P.blockers.length,'actual graphics batch has one amber circle per validator blocker');
  for(const c of P.blockers){const r=F.obstacleFootprints.get(c.owner.getUniqueId()),pt=map.convertInverseCoords(c.x,c.y,0,[0,0]);
   ok(r&&r.owner===c.owner&&r.shape==='circle'&&near(r.x,c.x)&&near(r.y,c.y)&&near(r.r,c.r),'visual reads same collider record as validator: '+c.owner.getUniqueId());
   ok(near(r.screenX,pt[0])&&near(r.screenY,pt[1])&&near(r.screenRadius,c.r*map.getCameraZoom())&&drawings.some(d=>near(d.shape.x,r.screenX)&&near(d.shape.y,r.screenY)&&near(d.shape.radius,r.screenRadius)),'rendered geometry matches camera/collider: '+c.owner.getUniqueId());
  }
  for(const o of get('Ground_Decoration').filter(o=>!o.getVariables().get('Blocking').getAsBoolean()))ok(!F.obstacleFootprints.has(o.getUniqueId()),'non-blocking decoration has no amber footprint: '+o.getUniqueId());
 };
 auditBlockers();ok(['Ruin','Rock','Crystal'].every(k=>P.blockers.some(c=>c.owner.getVariables().get('Kind').getAsString()===k)),'real map includes ruins/rock/crystal blocking examples');
 ok(P.blockers.filter(c=>['SpawnMarker','BaseMarker'].includes(c.owner.getName())).every(c=>F.obstacleFootprints.has(c.owner.getUniqueId())),'Spawn and Base actual placement colliders also visible');
 ok(F.footprints.size===P.towers().length&&[...F.footprints.values()].filter(r=>r.ignored).length===2&&F.footprints.get(ordinary.getUniqueId()).color===0xf49ab1&&F.footprints.get(otherMax.getUniqueId()).color===0xf49ab1,'all ordinary/max towers show red except two cyan source footprints');
 ok(F.worldGraphics.zIndex>F.graphics.zIndex&&F.worldGraphics.zIndex<F.ghost.getZOrder()&&F.worldGraphics.mask===F.worldMask,'batched footprints above dimmer, clipped below ghost/UI');
 ok(!F.worldGraphics.interactive&&!F.hudGraphics.interactive&&!F.worldMask.interactive,'decorative graphics do not capture pointer input');
 const graphics=F.worldGraphics,records=[...F.obstacleFootprints.values()],parent=S.getLayer('FusionUI').getRenderer().getRendererObject(),children=parent.children.length,objectCount=get('IndexText').length;step(240);
 ok(F.worldGraphics===graphics&&parent.children.length===children&&get('IndexText').length===objectCount&&[...F.obstacleFootprints.values()].every((r,i)=>r===records[i]),'240frames reuse graphics, native HUD objects and obstacle records');
 const prop=S.createObject('Ground_Decoration');prop.getVariables().get('Kind').setString('Ruin');prop.getVariables().get('LocalScale').setNumber(.5);prop.setPosition(300,320);step(3);move(300,352);
 ok(P.blockers.some(c=>c.owner===prop)&&F.obstacleFootprints.has(prop.getUniqueId())&&F.preview.reason==='obstacle'&&F.ghost.getColor()==='255;80;105','new real Ruin blocker appears and turns overlapping ghost red');auditBlockers();
 const before=F.obstacleFootprints.get(prop.getUniqueId()).x;prop.setX(prop.getX()+300);step(3);ok(near(F.obstacleFootprints.get(prop.getUniqueId()).x-before,300),'moving obstacle updates footprint from refreshed validator geometry');
 prop.setPosition(300,320);step(3);ok(!F.confirm(300,352)&&get('StarCannonTower').includes(a)&&get('StarCannonTower').includes(b)&&V.get('Money').getAsNumber()===baseline.gold,'ruin collision cannot consume sources or charge Gold');
 const propId=prop.getUniqueId();prop.deleteFromScene();step(3);move(300,352);ok(!F.obstacleFootprints.has(propId)&&!P.blockers.some(c=>c.owner===prop)&&F.preview.valid,'removed obstacle leaves neither stale footprint nor stale collision');
 move(370,352);ok(F.preview.reason==='tower'&&F.ghost.getColor()==='255;80;105','other tower collision remains active');move(600,352);ok(F.preview.reason==='region','distant middle remains outside source regions');
 let road;for(let x=220;x<380&&!road;x+=10)for(let y=272;y<432;y+=10)if(F.validate(x,y).reason==='path'){road=[x,y];break;}ok(!!road,'native path still blocks fusion');
 const sidebar=S.__towerShopUI.gameArea.sidebarX;click(sidebar-2,G.getGameResolutionHeight()-32,'FusionUI');ok(F.active&&get('StarCannonTower').includes(a)&&get('StarCannonTower').includes(b),'map/sidebar boundary click cannot consume sources');
 move(300,352);if(globalThis.BALANCE_MODE==='placement')return{checks,hud:F.bannerRect,blockers:F.obstacleFootprints.size,towers:F.footprints.size};
 click(F.cancelRect.x+F.cancelRect.w/2,F.cancelRect.y+F.cancelRect.h/2,'FusionUI');
 ok(!F.active&&!F.obstacleFootprints.size&&!F.footprints.size&&!F.markers.size&&F.ghost.isHidden()&&!F.worldGraphics.geometry.graphicsData.length&&!F.worldMask.geometry.graphicsData.length,'Cancel removes footprints, ghost, dimmer and masks');
 const settled=parent.children.length;for(let i=0;i<8;i++){F.begin(a);F.choose(b);step(3);ok(F.worldMask.geometry.graphicsData.length===1,'clipping mask restored on repeated entry '+i);I.onKeyPressed(27);step();I.onKeyReleased(27);step(2);ok(!F.active&&!F.obstacleFootprints.size&&!F.markers.size,'ESC cleans tactical mode '+i);}
 ok(parent.children.length===settled&&F.worldGraphics===graphics,'eight ESC/cancel cycles add no rendering children');
 // Runtime config edit verifies cost text is not a hardcoded example; restore it before transaction.
 const fee=F.config.FusionCost;F.config.FusionCost=175;F.begin(a);F.choose(b);step(2);ok(F.sidebar.texts.get('cost').text==='175 Gold','HUD follows live config changes');F.cancel();F.config.FusionCost=fee;
 F.begin(a);click(...P.center(b));move(300,352);click(300,352);const fused=get('StarCannonTower').find(star.isFusion);ok(fused&&!get('StarCannonTower').includes(a)&&!get('StarCannonTower').includes(b)&&near(V.get('Money').getAsNumber(),baseline.gold-fee),'valid native placement preserves transactional fusion/cost');fused.__starCooldown=100000;
 ok(!F.active&&!F.obstacleFootprints.size&&A.has('StarburstCannon')&&A.stats.shown===1&&A.active?.first,'successful fusion cleans placement and announces first discovery once');step(75);auditHud(N.screenRect);
 ok(!N.root.interactive&&!N.root.interactiveChildren&&N.screenRect.w<=200&&N.screenRect.h<=116&&N.icon.tint===0xffffff,'compact discovery toast is small, revealed and non-interactive');
 ok(N.name.text===F.config.Name&&N.heading.text==='NEW FUSION DISCOVERED!'&&N.root.visible&&N.name.alpha===1,'toast retains actual name and discovery context');
 if(globalThis.BALANCE_MODE==='notification')return{checks,hud:N.screenRect,discovered:[...A.found]};
 step(200);ok(!A.active&&!N.root.visible&&A.stats.shown===1&&A.stats.completed===1,'brief toast clears after existing four-second duration');
 ok(!A.discover('StarburstCannon','pure_52_25')&&!A.queue.length,'already-known fusion cannot repeat first-discovery toast');
 V.get('IndexOpen').setBoolean(true);step(2);S.__unitIndex.category='Fusion';step(3);ok(!S.__unitIndex.cards[0].locked&&S.__unitIndex.cards[0].name.getString()===F.config.Name,'Fusion Index uses same updated discovery state');V.get('IndexOpen').setBoolean(false);step(2);
 ok(JSON.stringify(baseline.camera)===JSON.stringify([map.getCameraX(),map.getCameraY(),map.getCameraZoom()])&&JSON.stringify(baseline.route)===JSON.stringify(V.get('MonsterPathPoints').toJSObject())&&JSON.stringify(baseline.config)===JSON.stringify(V.get('StarburstConfig').toJSObject()),'camera, route and gameplay config unchanged');
 return{checks,viewport:[G.getGameResolutionWidth(),G.getGameResolutionHeight()],blockers:P.blockers.length,notificationCount:A.stats.shown};
})()
