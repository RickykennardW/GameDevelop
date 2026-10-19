(async()=>{
 const game=testGame,S=game.getSceneStack().getCurrentScene(),V=S.getVariables(),get=n=>S.getObjects(n),I=game.getInputManager(),checks=[];
 const ok=(x,m)=>{if(!x)throw Error(m);checks.push(m);},near=(a,b)=>Math.abs(a-b)<1e-4,step=(n=1)=>{for(let i=0;i<n;i++){S.renderAndStep(16.667);I.onFrameEnded();}};
 const click=(x,y,layer='')=>{const point=S.getLayer(layer).convertInverseCoords(x,y,0,[0,0]);I.onMouseMove(...point);I.onMouseButtonPressed(0);step(2);I.onMouseButtonReleased(0);step(2);};
 const clickObject=o=>click(o.getCenterXInScene(),o.getCenterYInScene(),o.getLayer());
 game.pause(true);step(3);const star=S.__starCannon,G=S.__voidGolem,R=S.__enemyStatusIcons,H=S.__enemyHealthBarState.config;
 ok(V.get('Money').getAsNumber()===50000&&get('MoneyText')[0].getString()==='50000','fresh native preview starts with50000 Gold in HUD');
 if(globalThis.BALANCE_MODE==='initial')return{checks,initialGold:V.get('Money').getAsNumber()};
 const enemy=(type,x,y)=>{const e=S.createObject('Enemy'),v=e.getVariables();v.get('EnemyType').setString(type);S.__novaWisp.ensure(e);v.get('MoveSpeed').setNumber(0);v.get('GoldReward').setNumber(0);e.setPosition(x-e.getWidth()/2,y-e.getHeight()/2);step();e.getBehavior('Health').SetMaxHealth(10000);e.getBehavior('Health').SetHealth(10000);return e;};
 const hp=e=>e.getBehavior('Health').Health(),armor=e=>e.getBehavior('Health').FlatDamageReduction();
 const explode=()=>get('StarCannonImpact').filter(e=>e.getAnimationName()==='Explosion');
 clickObject(S.__towerShopUI.cards[0].background);click(300,352);const t=get('StarCannonTower')[0];
 ok(t&&V.get('Money').getAsNumber()===49700,'placement spends300 normally; Gold is not overwritten each frame');t.__starCooldown=100000;
 V.get('SelectedTower').setNumber(t.getVariables().get('TowerId').getAsNumber());step(2);
 for(let i=0;i<3;i++)clickObject(S.__selectedPanel.cards[0].background);
 ok(t.getVariables().get('Path1Level').getAsNumber()===3&&V.get('Money').getAsNumber()===48140,'real UI upgrades to Nova Impact at unchanged prices');
 V.get('SelectedTower').setNumber(0);step();let target=enemy('Basic',440,352),adjacent=enemy('Basic',470,372),outside=enemy('Basic',570,450);
 const expanded=enemy('Basic',510,352),edge=enemy('Basic',516,352),beyond=enemy('Basic',517,352),boundary=[expanded,edge,beyond];
 ok(star.config.Nova.SplashRadius===76&&near(76/64-1,.1875)&&star.vfxConfig.NovaExplosion.SizeMultiplier===1,'small AoE radius76 is18.75% larger /visual multiplier remains1');
 let finalExplosion;
 for(let shot=1;shot<=4;shot++){
  t.__starFacing=star.bearing(t,target);const before=[hp(target),hp(adjacent),hp(outside)],boundaryBefore=boundary.map(hp);ok(star.fire(t,target),'actual shot '+shot);
  let guard=0;while(get('StarCannonProjectile').length&&guard++<120)step();ok(guard<120,'shot impact completes '+shot);
  if(shot<4){ok(explode().length===0,'normal shot has no Nova explosion '+shot);ok(near(before[0]-hp(target),65)&&hp(adjacent)===before[1]&&boundary.every((e,i)=>hp(e)===boundaryBefore[i]),'normal direct damage without extra AoE '+shot);}
  else{
   finalExplosion=explode()[0];ok(explode().length===1&&finalExplosion,'fourth shot creates one dedicated Nova explosion');
   ok(near(finalExplosion.__starEffect.x,target.getCenterXInScene())&&near(finalExplosion.__starEffect.y,target.getCenterYInScene()),'explosion is centered at actual projectile impact');
   ok(near(before[0]-hp(target),65*1.75)&&near(before[1]-hp(adjacent),65*1.75*.25)&&hp(outside)===before[2],'Nova direct/AoE remains175% and25% splash /outside untouched');
   ok(near(boundaryBefore[0]-hp(expanded),65*1.75*.25)&&near(boundaryBefore[1]-hp(edge),65*1.75*.25)&&hp(beyond)===boundaryBefore[2],'fourth shot now hits70px and76px /77px remains outside small AoE');
   ok(finalExplosion.__starEffect.size===152&&finalExplosion.getWidth()===152&&finalExplosion.getHeight()===152,'VFX diameter152 matches new radius76 exactly');
  }
 }
 const after=[hp(target),hp(adjacent),...boundary.map(hp)],frames=new Set(),life=finalExplosion.__starEffect.life;
 while(get('StarCannonImpact').includes(finalExplosion)){
  if(finalExplosion.__novaTexture){const renderer=finalExplosion.getRendererObject(),texture=renderer.texture;frames.add(finalExplosion.__novaFrame);ok(texture===finalExplosion.__novaTexture&&texture.width<texture.baseTexture.width&&texture.height<texture.baseTexture.height&&near(texture.width*Math.abs(renderer.scale.x),152)&&near(texture.height*Math.abs(renderer.scale.y),152),'Nova shows one cropped atlas frame at matching152px diameter');}
  ok(hp(target)===after[0]&&hp(adjacent)===after[1]&&boundary.every((e,i)=>hp(e)===after[i+2]),'animation frame cannot repeat damage');step();
 }
 ok(frames.size===8&&life===.64,'flash burst bloom particles dissipation cover eight frames');ok(!explode().length,'Nova animation deletes at end');
 // A recycled effect must return to its own texture, never display a stale atlas.
 const recycled=star.effect('Base',500,500,30);step();ok(!recycled.__novaTexture&&recycled.getRendererObject().texture.width===128,'pooled normal VFX restores its own native texture');step(25);
 V.get('SelectedTower').setNumber(t.getVariables().get('TowerId').getAsNumber());step(2);clickObject(S.__selectedPanel.cards[0].background);
 ok(t.getVariables().get('Path1Level').getAsNumber()===4&&V.get('Money').getAsNumber()===45340,'real UI upgrades Starbreaker at unchanged2800 price');V.get('SelectedTower').setNumber(0);step();
 t.__starFacing=star.bearing(t,target);for(let i=0;i<4;i++){star.fire(t,target);while(get('StarCannonProjectile').length)step();}
 const applied=star.fractures.get(target.getUniqueId());ok(applied&&applied.icon.getAnimationName()==='FractureIcon','Starbreaker special shot applies actual armor break icon');
 ok(star.fractures.has(expanded.getUniqueId())&&star.fractures.has(edge.getUniqueId())&&!star.fractures.has(beyond.getUniqueId()),'Starbreaker inherits radius76 without changing fracture logic or touching outside enemy');
 const data=game.getSceneAndExtensionsData(S.getName()).sceneData,art=data.objects.find(o=>o.name==='StarCannonImpact').animations.find(a=>a.name==='FractureIcon').directions[0].sprites[0].image;
 ok(art==='assets/effects/star_cannon/Debuff_ArmorFracture_Icon.svg','debuff uses dedicated readable cracked-shield asset');
 for(const e of get('Enemy').slice())e.deleteFromScene();step(2);
 const types=['Basic','VoidHound','VoidGuard','VoidSentinel','VoidBrute','VoidGolem'],actors=types.map((type,i)=>enemy(type,1000+i*3,600));
 const caster=actors[5];G.fort.apply(caster);step(2);
 actors.forEach((e,i)=>{e.setPosition(440+i*235-e.getWidth()/2,352-e.getHeight()/2);star.fracture(e);});step(2);
 const layout=(e,label,count=2)=>{
  const id=e.getUniqueId(),bar=S.__enemyHealthBars.get(id).background,owner=R.owners.get(id),items=[...owner.icons.values()].sort((a,b)=>a.icon.getX()-b.icon.getX());
  const cfg=H.Types[e.getVariables().get('EnemyType').getAsString()];
  ok(near(bar.getCenterXInScene(),e.getCenterXInScene())&&near(bar.getY(),e.getCenterYInScene()-cfg.HeadOffset-H.Height),'HP bar geometry unchanged '+label);
  ok(items.length===count&&near((items[0].icon.getX()+items.at(-1).icon.getX()+items.at(-1).icon.getWidth())/2,bar.getCenterXInScene()),'whole status row centered above HP '+label);
  ok(items.every(item=>near(item.icon.getY()+item.icon.getHeight(),bar.getY()-R.config.GapAboveHealthBar)&&item.icon.getZOrder()>bar.getZOrder()),'statuses above bar with gap /correct layering '+label);
  for(let i=1;i<items.length;i++)ok(near(items[i].icon.getX()-items[i-1].icon.getX()-items[i-1].icon.getWidth(),R.config.HorizontalSpacing),'consistent horizontal status spacing '+label);
 };
 actors.forEach((e,i)=>layout(e,types[i]));
 actors.forEach(e=>e.setPosition(e.getX()+11,e.getY()+13));step(2);actors.forEach((e,i)=>layout(e,'moving '+types[i]));
 const rec=star.fractures.get(caster.getUniqueId()),icon=rec.icon,expiry=rec.expires;step(30);star.fracture(caster);step();
 ok(rec.icon===icon&&rec.expires>expiry&&R.owners.get(caster.getUniqueId()).icons.size===2,'fracture refresh keeps one debuff icon /one buff icon');
 ok(armor(caster)===30,'Golem armor remains25 +10 buff -5 fracture');
 while(star.time<rec.expires-.04)step();ok(star.fractures.has(caster.getUniqueId()),'fracture remains until3s from refresh');
 while(star.time<rec.expires+.02)step();ok(!star.fractures.has(caster.getUniqueId())&&!get('StarCannonImpact').includes(icon)&&armor(caster)===35,'fracture ends at3s /removes icon /keeps elite buff');
 actors.forEach((e,i)=>layout(e,'after expiry '+types[i],1));
 const totalIcons=R.owners.size;actors[1].getBehavior('Health').SetHealth(0);step(2);ok(R.owners.size===totalIcons-1,'logical death removes owned status row');
 actors[2].deleteFromScene();step(2);ok(!R.owners.has(actors[2].getUniqueId()),'external enemy removal leaves no status owner');
 // Restore six living archetypes for a representative native screenshot.
 for(const e of get('Enemy').slice())e.deleteFromScene();step(2);
 const display=types.map((type,i)=>enemy(type,1000+i*3,600));G.fort.apply(display[5]);step();
 display.forEach((e,i)=>{e.setPosition(440+i*235-e.getWidth()/2,352-e.getHeight()/2);star.fracture(e);});step(2);
 t.__starFacing=star.bearing(t,display[0]);for(let i=0;i<4;i++){star.fire(t,display[0]);while(get('StarCannonProjectile').length)step();}step(12);
 ok(explode().length===1,'final native scene shows real Nova explosion and centered statuses');
 return {checks,initialGold:50000,currentGold:V.get('Money').getAsNumber(),novaRadius:star.config.Nova.SplashRadius,novaVFXDiameter:star.config.Nova.SplashRadius*2*star.vfxConfig.NovaExplosion.SizeMultiplier,explosionFrames:[...frames],statusTypes:types,statusOwners:R.owners.size,explosionAsset:star.vfxConfig.NovaExplosion.Image,fractureAsset:art,viewport:[game.getGameResolutionWidth(),game.getGameResolutionHeight()]};
})()
