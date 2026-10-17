(async()=>{
 const game=testGame,S=game.getSceneStack().getCurrentScene(),V=S.getVariables(),get=n=>S.getObjects(n),input=game.getInputManager(),checks=[];
 const ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);};game.pause(true);
 const step=(n=1)=>{for(let i=0;i<n;i++){S.renderAndStep(16.667);input.onFrameEnded();}};
 const mode=globalThis.BALANCE_MODE||'idle',star=S.__starCannon,p=S.__freePlacement;V.get('Money').setNumber(20000);step(4);
 ok(S.getLayer('').getCameraZoom()>0&&get('Monster_Path').length===82,'native map /82 road tiles');
 ok(S.__towerShopUI.cards.length===1&&S.__towerShopUI.cards[0].background.getWidth()<200,'one small Star Cannon shop card');
 let tower=null,muzzle=null;
 if(mode==='selected'||mode==='combat'){
  tower=S.createObject('StarCannonTower');p.positionSprite(tower,'StarCannonTower',300,352);const v=tower.getVariables();for(const [key,value]of Object.entries({FootprintX:300,FootprintY:352,FootprintRadius:46,TowerId:900001,PurchasePrice:300,TotalInvestment:300,Path1Level:2,Path2Level:4}))v.get(key).setNumber(value);star.apply(tower);tower.__starCooldown=10000;step(2);
  if(mode==='selected'){V.get('SelectedTower').setNumber(900001);step(3);ok(S.__selectedPanel.tower===tower&&S.__selectedPanel.cards.length===2,'native selected tower /two upgrade paths');}
 }
 if(mode==='index'){
  V.get('IndexOpen').setBoolean(true);S.__unitIndex.category='Monsters';step(4);ok(S.__unitIndex.entries.length===6,'native Index contains all six enemy types');
 }
 if(mode==='combat'){
  const types=['Basic','VoidHound','VoidGuard','VoidSentinel','VoidBrute','VoidGolem'];
  types.forEach((type,i)=>{const e=S.createObject('Enemy'),v=e.getVariables(),stats=V.get('EnemyTypes').getChild(type).toJSObject();v.get('EnemyType').setString(type);e.getBehavior('Health').SetMaxHealth(stats.HP);e.getBehavior('Health').SetHealth(stats.HP);S.__novaWisp.ensure(e);v.get('MoveSpeed').setNumber(0);e.setPosition(500+i*140-e.getWidth()/2,352-e.getHeight()/2);});step(2);
  const target=get('Enemy')[0];tower.__starFacing=star.bearing(tower,target);muzzle=star.visual(tower).meta.Turret.Muzzles.map((_,i)=>star.muzzle(tower,i));ok(star.fire(tower,target),'native multi-projectile fire');ok(get('StarCannonProjectile').length===3,'three native Meteor projectiles spawned');step(1);
  // Fix animation phase only in this disposable test scene for image comparison.
  for(const e of get('Enemy')){
   for(const key of ['__novaState','__houndState','__voidCommonState'])if(e[key]){e[key].age=1;e[key].phase=0;}
   e.pauseAnimation();e.setAnimationFrame(1);
  }
  S.__novaWisp.render();S.__voidHound.render();S.__voidCommon.render();S.__voidGolem.render();S.renderAndStep(0);input.onFrameEnded();
  ok(S.__enemyHealthBars.size===6,'six native paired HP bars');ok(get('StarCannonProjectile').length>0,'native projectile render remains visible');
 }
 const camera=[S.getLayer('').getCameraX(),S.getLayer('').getCameraY(),S.getLayer('').getCameraZoom()];
 const layers=[];S.getAllLayerNames(layers);
 return{checks,mode,camera,muzzle,objects:get('Monster_Path').length,resources:game.getGameData().resources.resources.length,shopCardSize:[S.__towerShopUI.cards[0].background.getWidth(),S.__towerShopUI.cards[0].background.getHeight()],layers};
})()
