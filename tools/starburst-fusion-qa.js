(async()=>{
 const game=testGame,S=game.getSceneStack().getCurrentScene(),V=S.getVariables(),I=game.getInputManager(),get=n=>S.getObjects(n),checks=[];
 const ok=(x,m)=>{if(!x)throw Error(m);checks.push(m);},near=(a,b)=>Math.abs(a-b)<1e-4,step=(n=1)=>{for(let i=0;i<n;i++){S.renderAndStep(16.667);I.onFrameEnded();}};
 const move=(x,y,layer='')=>{I.onMouseMove(...S.getLayer(layer).convertInverseCoords(x,y,0,[0,0]));step(2);};
 const click=(x,y,layer='')=>{move(x,y,layer);I.onMouseButtonPressed(0);step(2);I.onMouseButtonReleased(0);step(2);};
 const clickObject=o=>click(o.getCenterXInScene(),o.getCenterYInScene(),o.getLayer());
 game.pause(true);step(4);const F=S.__fusion,star=S.__starCannon,P=S.__freePlacement;
 ok(F&&!F.active&&V.get('Money').getAsNumber()===50000,'fresh game keeps50000 Gold and fusion inactive');
 const cfg=F.config,camera=JSON.stringify([S.getLayer('').getCameraX(),S.getLayer('').getCameraY(),S.getLayer('').getCameraZoom()]),route=JSON.stringify(V.get('MonsterPathPoints').toJSObject());
 const enemy=(x,y,hp=10000)=>{const e=S.createObject('Enemy'),v=e.getVariables();v.get('EnemyType').setString('Basic');S.__novaWisp.ensure(e);v.get('MoveSpeed').setNumber(0);v.get('GoldReward').setNumber(0);e.setPosition(x-e.getWidth()/2,y-e.getHeight()/2);step();e.getBehavior('Health').SetMaxHealth(hp);e.getBehavior('Health').SetHealth(hp);return e;};
 const make=(a,b,x,y)=>{const t=S.createObject('StarCannonTower'),v=t.getVariables();for(const [n,value]of Object.entries({TowerId:900000+t.getUniqueId(),PurchasePrice:300,TotalInvestment:300,Path1Level:a,Path2Level:b,FootprintX:x,FootprintY:y,FootprintRadius:46}))v.get(n).setNumber(value);step();star.apply(t);t.__starCooldown=100000;return t;};
 const build=(a,b,x,y)=>{V.get('SelectedTower').setNumber(0);step(2);clickObject(S.__towerShopUI.cards[0].background);click(x,y);const t=get('StarCannonTower').find(t=>near(P.center(t)[0],x)&&near(P.center(t)[1],y));ok(!!t,'real shop placement '+a+'-'+b);t.__starCooldown=100000;V.get('SelectedTower').setNumber(t.getVariables().get('TowerId').getAsNumber());step(2);for(let i=0;i<a;i++)clickObject(S.__selectedPanel.cards[0].background);for(let i=0;i<b;i++)clickObject(S.__selectedPanel.cards[1].background);ok(t.getVariables().get('Path1Level').getAsNumber()===a&&t.getVariables().get('Path2Level').getAsNumber()===b,'native panel reaches '+a+'-'+b);V.get('SelectedTower').setNumber(0);step(2);return t;};
 P.refresh();const A=build(5,2,300,352);let spot;
 for(let x=780;x<=1500;x+=20)if(P.validate('StarCannonTower',x,352).valid){spot=[x,352];break;}
 ok(!!spot,'distant second tower fits real island floor');const B=build(2,5,...spot),gold=V.get('Money').getAsNumber();
 ok(gold===27510&&A.getVariables().get('TotalInvestment').getAsNumber()===12070&&B.getVariables().get('TotalInvestment').getAsNumber()===10420,'both max investments spent normally /Gold27510');
 const frozen=enemy(1400,700);V.get('WaveMode').setString('ManualFast');step(2);ok(S.getTimeManager().getTimeScale()===2,'fixture uses existing2x wave speed');
 const enter=t=>{V.get('SelectedTower').setNumber(t.getVariables().get('TowerId').getAsNumber());step(2);ok(!!S.__selectedPanel.fusionButton,'eligible max tower has Fusion button');clickObject(S.__selectedPanel.fusionButton);ok(F.active&&F.stage==='partner'&&S.getTimeManager().getTimeScale()===.5,'actual Fusion button enters selection /0.5x without pausing');};
 enter(A);const before=star.time;step(12);ok(star.time>before&&near(star.time-before,.100002),'gameplay clock keeps moving at0.5x');
 ok(!F.choose(A)&&get('StarCannonTower').includes(A)&&get('StarCannonTower').includes(B),'same source rejected without deletion');
 const same=make(5,2,1100,800),unfinished=make(4,2,1250,800);ok(!F.choose(same)&&!F.choose(unfinished)&&F.markers.has(A.getUniqueId())&&F.markers.has(B.getUniqueId())&&!F.markers.has(unfinished.getUniqueId()),'same dominant path /unfinished rejected; max-only markers');
 I.onKeyPressed(27);step();I.onKeyReleased(27);step(2);
 ok(!F.active&&F.stage==='idle'&&!F.markers.size&&F.ghost.isHidden()&&S.getTimeManager().getTimeScale()===2&&V.get('Money').getAsNumber()===gold,'ESC clears mode/markers/ghost, restores2x and keeps Gold');same.deleteFromScene();unfinished.deleteFromScene();step();
 enter(B);click(...P.center(A));ok(F.stage==='placement'&&F.a===B&&F.b===A,'reverse order2-5 +5-2 chosen by actual map click');
 move(...P.center(A));ok(F.preview.valid&&!F.ghost.isHidden()&&get('StarCannonTower').includes(A)&&get('StarCannonTower').includes(B),'ghost valid over source footprint; both sources still alive');
 const middle=[(P.center(A)[0]+P.center(B)[0])/2,352];move(...middle);ok(!F.preview.valid&&F.preview.reason==='region','distant middle excluded by regional placement');
 click(...middle);ok(F.active&&get('StarCannonTower').length===2&&V.get('Money').getAsNumber()===gold,'invalid placement cannot consume or charge');
 click(F.cancelRect.x+60,F.cancelRect.y+16,'FusionUI');ok(!F.active&&S.getTimeManager().getTimeScale()===2&&get('StarCannonTower').length===2,'Cancel button during ghost preserves both sources /speed');
 enter(A);click(...P.center(B));move(...P.center(A));
 const third=make(0,0,420,352);move(370,352);ok(!F.preview.valid&&F.preview.reason==='tower','only source collisions ignored; unrelated tower still blocks');ok(!F.confirm(370,352)&&get('StarCannonTower').includes(A)&&get('StarCannonTower').includes(B),'invalid third-tower collision refuses confirm');third.deleteFromScene();step();
 let pathSpot;for(let dx=-80;dx<=80&&!pathSpot;dx+=10)for(let dy=-80;dy<=80;dy+=10){const q=[300+dx,352+dy];if(F.validate(...q).reason==='path'){pathSpot=q;break;}}
 ok(!!pathSpot&&!F.validate(...pathSpot).valid,'existing road polygon remains blocked in fusion region');
 const blocker=S.createObject('Ground_Decoration');blocker.setAnimationName('Rock');blocker.setWidth(32);blocker.setHeight(32);blocker.setPosition(345,336);blocker.getVariables().get('Kind').setString('Rock');blocker.getVariables().get('LocalScale').setNumber(1);blocker.getVariables().get('Blocking').setBoolean(true);step(2);P.refresh();move(330,352);ok(!F.preview.valid&&F.preview.reason==='obstacle','normal obstacle circle still blocks fusion');blocker.deleteFromScene();step(2);P.refresh();move(300,352);
 ok(F.preview.valid&&F.validate(...P.center(B)).valid,'both regional source positions eligible after obstacle removal');
 if(globalThis.BALANCE_MODE==='placement')return{checks,gold,stage:F.stage,scale:S.getTimeManager().getTimeScale(),sources:2,regionalRadius:cfg.RegionalRadius};
 A.getVariables().get('DamageDealt').setNumber(123);B.getVariables().get('DamageDealt').setNumber(456);
 const archiveRevision=F.archive.revision;click(300,352);let T=get('StarCannonTower').find(star.isFusion);
 ok(T&&!get('StarCannonTower').includes(A)&&!get('StarCannonTower').includes(B)&&get('StarCannonTower').length===1,'valid map click consumes exactly two sources /creates one Starburst');T.__starCooldown=100000;
 ok(!F.active&&F.ghost.isHidden()&&!F.markers.size&&S.getTimeManager().getTimeScale()===2&&V.get('Money').getAsNumber()===gold,'successful transaction clears mode /restores speed /charges only configured0');
 ok(T.getVariables().get('TotalInvestment').getAsNumber()===22490&&T.getVariables().get('DamageDealt').getAsNumber()===579&&T.getVariables().get('TowerName').getAsString()==='Starburst Cannon','investment and prior damage tracking transferred');
 ok(F.archive.found.has('StarburstCannon')&&F.archive.revision===archiveRevision+1&&!F.archive.discover('StarburstCannon'),'archive unlock exactly once');
 ok(!star.upgrade(T,1)&&!star.upgrade(T,2)&&!F.begin(T)&&!star.valid(5,5),'fusion cannot upgrade again /normal locking preserved');
 V.get('IndexOpen').setBoolean(true);step(2);S.__unitIndex.category='Towers';step(2);ok(S.__unitIndex.entries.length===2&&S.__unitIndex.entries[0].type==='StarCannonTower'&&S.__unitIndex.entries[1].type==='NebulaBloomTower','normal Tower Index has no duplicate fusion');S.__unitIndex.category='Fusion';step(2);ok(S.__unitIndex.entries.length===1&&S.__unitIndex.cards[0].id==='StarburstCannon'&&!S.__unitIndex.cards[0].locked,'discovered fusion opens in separate Fusion Index');V.get('IndexOpen').setBoolean(false);step(3);
 ok(S.__towerShopUI.cards.length===2&&S.__towerShopUI.cards[0].item.Cost===300&&S.__towerShopUI.cards[1].item.Cost===500,'Star Cannon remains first300 / Nebula occupies second slot500');frozen.deleteFromScene();step();V.get('WaveMode').setString('Waiting');step();
 // Actual auto aiming, stationary pedestal and one projectile per 3-muzzle cycle.
 const sequence=[];for(const angle of [-90,-45,0,45,90,135,180,225]){
  const r=angle*Math.PI/180,[x,y]=P.center(T),target=enemy(x+145*Math.cos(r),y+145*Math.sin(r)),side=enemy(target.getCenterXInScene()-40*Math.sin(r),target.getCenterYInScene()+40*Math.cos(r)),outside=enemy(target.getCenterXInScene()-65*Math.sin(r),target.getCenterYInScene()+65*Math.cos(r));
  step(100);ok(star.canFire(T,target)||(()=>{T.__starTargetId=target.getUniqueId();step(100);return star.canFire(T,target);})(),'natural aiming reaches target '+angle);
  const pair=star.visual(T),base=star.componentTransform(T,'Base'),pivot=star.componentTransform(T,'Turret');
  ok(pair.barrels.length===3&&pair.baseRig.rotation===0&&pair.Base.getAngle()===0&&near(base.x,pivot.x)&&near(base.y,pivot.y),'3 barrels /stationary base /stable shared pivot '+angle);
  const index=T.__starNextMuzzle||0,mouth=star.muzzle(T,index),before=target.getBehavior('Health').Health(),secondary=side.getBehavior('Health').Health();ok(star.fire(T,target),'fusion fires '+angle);let bolt=get('StarCannonProjectile')[0];sequence.push(bolt.__muzzleIndex);
  ok(get('StarCannonProjectile').length===1&&bolt.getAnimationName()==='Starburst'&&near(bolt.getCenterXInScene(),mouth[0])&&near(bolt.getCenterYInScene(),mouth[1])&&Math.hypot(mouth[0]-x,mouth[1]-y)<=46,'one unique bolt from physical muzzle inside footprint '+angle);
  step(2);star.render();ok(pair.barrels[index].sprite.y>pair.barrels[index].y,'active barrel recoil '+angle);
  let guard=0;while(get('StarCannonProjectile').length&&guard++<100)step();ok(guard<100&&near(before-target.getBehavior('Health').Health(),90)&&near(secondary-side.getBehavior('Health').Health(),18)&&outside.getBehavior('Health').Health()===10000,'90 direct /18 splash /radius64 /no fourth-shot multiplication '+angle);
  const fx=get('StarCannonImpact').find(o=>o.getAnimationName()==='Explosion');ok(fx&&fx.__starEffect.size===128&&fx.getZOrder()<S.__enemyHealthBars.get(target.getUniqueId()).background.getZOrder(),'small Nova impact below HP bar '+angle);
  const after=target.getBehavior('Health').Health();step(42);ok(target.getBehavior('Health').Health()===after&&!get('StarCannonImpact').some(o=>o.getAnimationName()==='Explosion'),'VFX cleanup /no animation damage '+angle);
  get('Enemy').slice().forEach(e=>e.deleteFromScene());step(2);
 }
 ok(sequence.join(',')==='0,1,2,0,1,2,0,1','heavy center /left /right muzzle alternation without triple fire');
 V.get('SelectedTower').setNumber(T.getVariables().get('TowerId').getAsNumber());step(2);ok(S.__selectedPanel.cards.length===0&&T.getVariables().get('SellValue').getAsNumber()===15743,'fusion selected panel and invested sell value correct');
 const beforeSell=V.get('Money').getAsNumber();clickObject(S.__selectedPanel.objects.sell);ok(!get('StarCannonTower').includes(T)&&V.get('Money').getAsNumber()===beforeSell+15743,'actual sell UI refunds preserved total investment');
 // Cancellation if a selected source disappears externally must not consume the survivor.
 const C=make(5,2,300,352),D=make(2,5,...spot);ok(F.begin(C)&&F.choose(D),'external deletion fixture enters fusion');D.deleteFromScene();step(2);ok(!F.active&&get('StarCannonTower').includes(C),'lost source automatically cancels without consuming survivor');C.deleteFromScene();step(2);
 for(let i=0;i<3;i++){const a=make(5,2,300,352),b=make(2,5,...spot);F.begin(a);F.choose(b);step(2);F.cancel();a.deleteFromScene();b.deleteFromScene();step(2);}
 // Transaction guards also hold if a later balance pass adds a fusion fee.
 const ga=make(5,2,300,352),gb=make(2,5,...spot),savedGold=V.get('Money').getAsNumber();F.begin(ga);F.choose(gb);step(2);F.config.FusionCost=1000;V.get('Money').setNumber(0);move(300,352);
 ok(!F.confirm(300,352)&&get('StarCannonTower').includes(ga)&&get('StarCannonTower').includes(gb)&&V.get('Money').getAsNumber()===0,'insufficient fee cannot consume sources or charge');F.config.FusionCost=0;V.get('Money').setNumber(savedGold);
 const create=S.createObject;S.createObject=function(name){return name==='StarCannonTower'?null:create.call(this,name);};const refused=F.confirm(300,352);S.createObject=create;
 ok(!refused&&get('StarCannonTower').includes(ga)&&get('StarCannonTower').includes(gb)&&V.get('Money').getAsNumber()===savedGold,'creation failure leaves source towers and economy intact');
 V.get('GameOver').setBoolean(true);step(2);ok(!F.active&&get('StarCannonTower').includes(ga)&&get('StarCannonTower').includes(gb),'Game Over safely cancels active fusion');V.get('GameOver').setBoolean(false);ga.deleteFromScene();gb.deleteFromScene();step(2);
 ok(!F.markers.size&&!get('StarCannonTower').length&&!get('StarCannonBaseVisual').length&&!get('StarCannonTurretVisual').length&&get('StarburstGhost').length===1&&F.ghost.isHidden(),'repeat cancel /pooling leaves one reusable hidden ghost and no tower rigs');
 ok(camera===JSON.stringify([S.getLayer('').getCameraX(),S.getLayer('').getCameraY(),S.getLayer('').getCameraZoom()])&&route===JSON.stringify(V.get('MonsterPathPoints').toJSObject()),'camera /waypoints unchanged by fusion');
 // A native fusion result and actual impact are left for the screenshot.
 const a=make(5,2,300,352),b=make(2,5,...spot);a.getVariables().get('TotalInvestment').setNumber(12070);b.getVariables().get('TotalInvestment').setNumber(10420);F.begin(a);F.choose(b);step(2);move(300,352);T=F.confirm(300,352);step(2);T.__starCooldown=100000;const target=enemy(440,352);step(100);T.__starFacing=star.bearing(T,target);star.fire(T,target);while(get('StarCannonProjectile').length)step();step(9);V.get('SelectedTower').setNumber(T.getVariables().get('TowerId').getAsNumber());step(2);
 return{checks,initialGold:50000,realBuildGold:gold,config:{damage:cfg.Damage,interval:cfg.AttackInterval,range:cfg.AttackRange,splashRadius:cfg.SplashRadius,splashRatio:cfg.SplashRatio,fusionCost:cfg.FusionCost,region:cfg.RegionalRadius},muzzleSequence:sequence,discovered:[...F.archive.found],viewport:[game.getGameResolutionWidth(),game.getGameResolutionHeight()]};
})()
