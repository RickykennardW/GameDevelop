(async()=>{
 const game=testGame,S=game.getSceneStack().getCurrentScene(),V=S.getVariables(),I=game.getInputManager(),get=n=>S.getObjects(n),checks=[];
 const ok=(x,m)=>{if(!x)throw Error(m);checks.push(m);},near=(a,b)=>Math.abs(a-b)<1e-4,step=(n=1)=>{for(let i=0;i<n;i++){S.renderAndStep(16.667);I.onFrameEnded();}};
 const click=(x,y,layer='')=>{I.onMouseMove(...S.getLayer(layer).convertInverseCoords(x,y,0,[0,0]));I.onMouseButtonPressed(0);step(2);I.onMouseButtonReleased(0);step(2);};
 const clickObject=o=>click(o.getCenterXInScene(),o.getCenterYInScene(),o.getLayer());
 game.pause(true);step(3);const star=S.__starCannon,P=S.__freePlacement,D=65*1.75,A=D*.25;
 ok(V.get('Money').getAsNumber()===50000&&get('MoneyText')[0].getString()==='50000','fresh preview HUD starts at50000 Gold without fixture override');
 ok(star.config.Lance.MaxTargets===3&&star.config.Nova.SplashRadius===76&&star.config.Nova.EveryShots===4&&star.config.Nova.SplashRatio===.25&&star.config.Nova.DamageMultiplier===1.75,'central cap3 /radius76 /fourth shot /175% and25% preserved');
 const camera=JSON.stringify([S.getLayer('').getCameraX(),S.getLayer('').getCameraY(),S.getLayer('').getCameraZoom()]),route=JSON.stringify(V.get('MonsterPathPoints').toJSObject());
 clickObject(S.__towerShopUI.cards[0].background);click(300,352);let t=get('StarCannonTower')[0];
 ok(!!t&&V.get('Money').getAsNumber()===49700,'actual shop placement spends300 from50000');t.__starCooldown=100000;
 V.get('SelectedTower').setNumber(t.getVariables().get('TowerId').getAsNumber());step(2);for(let i=0;i<5;i++)clickObject(S.__selectedPanel.cards[0].background);
 ok(t.getVariables().get('Path1Level').getAsNumber()===5&&V.get('Money').getAsNumber()===38340,'actual upgrade panel reaches Level5 at unchanged160/300/1100/2800/7000 costs');
 V.get('SelectedTower').setNumber(0);step();
 const effects=[],damage=[],nativeEffect=star.effect,nativeDeal=star.deal;
 star.effect=(...args)=>{const o=nativeEffect(...args);if(args[0]==='Explosion')effects.push({id:o.getUniqueId(),object:o,x:args[1],y:args[2],size:args[3]});return o;};
 star.deal=(owner,e,raw)=>{const id=e.getUniqueId(),before=e.getBehavior('Health').Health(),result=nativeDeal(owner,e,raw);damage.push({id,raw,actual:result,before});return result;};
 const clear=()=>{V.get('SelectedTower').setNumber(0);for(const n of ['StarCannonTower','Enemy','StarCannonProjectile','StarCannonImpact','NovaWispDeathVisual'])get(n).slice().forEach(o=>o.deleteFromScene());step(2);effects.length=0;damage.length=0;};
 const make=(a=5,b=0)=>{const o=S.createObject('StarCannonTower'),v=o.getVariables();P.positionSprite(o,'StarCannonTower',300,352);for(const [n,x]of Object.entries({FootprintX:300,FootprintY:352,FootprintRadius:46,TowerId:900000+o.getUniqueId(),PurchasePrice:300,TotalInvestment:300,Path1Level:a,Path2Level:b}))v.get(n).setNumber(x);step();star.apply(o);o.__starCooldown=100000;return o;};
 const enemy=(x,y=352,type='Basic',health=10000)=>{const e=S.createObject('Enemy'),v=e.getVariables();v.get('EnemyType').setString(type);S.__novaWisp.ensure(e);v.get('MoveSpeed').setNumber(0);v.get('GoldReward').setNumber(0);e.setPosition(x-e.getWidth()/2,y-e.getHeight()/2);step();e.getBehavior('Health').SetMaxHealth(health);e.getBehavior('Health').SetHealth(health);return e;};
 const hp=e=>e.getBehavior('Health').Health(),fire=(tower,target,special=true)=>{if(special)tower.__starShotCount=3;tower.__starFacing=star.bearing(tower,target);effects.length=0;damage.length=0;ok(star.fire(tower,target),'native fire accepted');const p=get('StarCannonProjectile')[0];ok(p.__starHitTargets.size===0&&(!p.__starLance||p.__starAoETargets.size===0),'new/pooled projectile starts with empty ledgers');return p;};
 const drain=(p,label)=>{const angle=p.getAngle(),states=[];let last=0,guard=0;while(get('StarCannonProjectile').includes(p)&&guard++<160){step();if(p.__starHitTargets.size!==last){last=p.__starHitTargets.size;states.push([last,get('StarCannonProjectile').includes(p)]);}if(p.__starLance)ok(p.getAngle()===angle,'straight heading '+label);}ok(guard<160&&!get('StarCannonProjectile').includes(p),'finite projectile cleanup '+label);return states;};
 const verify=(p,actors,count,label)=>{
  ok(p.__starHitTargets.size===count&&effects.length===count,'exactly'+count+' real direct hits and explosions '+label);
  ok(effects.every((f,i)=>near(f.x,actors[i].getCenterXInScene())&&near(f.y,actors[i].getCenterYInScene())&&f.size===152),'impact centers /152px diameter '+label);
  ok(damage.filter(d=>near(d.raw,D)).length===count&&new Set(damage.filter(d=>near(d.raw,D)).map(d=>d.id)).size===count,'direct damage once per unique target '+label);
  const splashes=damage.filter(d=>near(d.raw,A));ok(new Set(splashes.map(d=>d.id)).size===splashes.length,'at most one AoE application per enemy per Lance '+label);
  const after=actors.map(hp),calls=damage.length;step(42);ok(actors.every((e,i)=>hp(e)===after[i])&&damage.length===calls&&!get('StarCannonImpact').some(o=>o.getAnimationName()==='Explosion'),'VFX fades without extra damage '+label);
 };
 clear();
 for(const n of [1,2,3]){
  t=make();const actors=Array.from({length:n},(_,i)=>enemy(440+i*40)),p=fire(t,actors[0]),states=drain(p,n+' enemies');
  ok(states.filter(s=>s[0]<3).every(s=>s[1])&&(n<3||states.at(-1)[1]===false),'continues after first/second; stops on third '+n);
  ok(near(10000-hp(actors[0]),D),'primary excluded from its own and later splash '+n);
  verify(p,actors,n,n+' enemies');clear();
 }
 for(const n of [4,5]){
  t=make();const actors=[440,480,520,580,660].slice(0,n).map(x=>enemy(x)),p=fire(t,actors[0]);drain(p,n+' line');
  ok(actors.slice(0,3).every(e=>p.__starHitTargets.has(e.getUniqueId()))&&actors.slice(3).every(e=>!p.__starHitTargets.has(e.getUniqueId())),'only first3 direct targets '+n);
  ok(near(10000-hp(actors[3]),A)&&(n===4||hp(actors[4])===10000),'fourth may receive third explosion splash; distant fifth untouched '+n);
  ok(p.getCenterXInScene()<=actors[2].getCenterXInScene()+1e-4,'projectile never travels beyond third impact '+n);
  verify(p,actors,3,n+' line');clear();
 }
 // Overlapping blasts, inherited fracture and per-projectile lifetime identity.
 t=make();const cluster=[440,480,520].map(x=>enemy(x)),side=enemy(480,397),edge=enemy(440,428),outside=enemy(440,429),golem=enemy(480,400,'VoidGolem'),all=[...cluster,side,edge,outside,golem];
 let p=fire(t,cluster[0]),firstProjectileId=p.getUniqueId();drain(p,'overlap cluster');
 ok(cluster.every((e,i)=>near(10000-hp(e),D+(i?A:0)))&&near(10000-hp(side),A)&&near(10000-hp(edge),A)&&hp(outside)===10000,'overlap has one splash, primary excluded, exact radius76 boundary');
 ok(near(10000-hp(golem),A-20)&&golem.getBehavior('Health').FlatDamageReduction()===20,'fracture20% of base25 armor before one native splash armor calculation');
 const rec=star.fractures.get(golem.getUniqueId()),icon=rec.icon,expiry=rec.expires;
 for(const e of [...cluster,side,edge,golem]){const bar=S.__enemyHealthBars.get(e.getUniqueId()).background,row=S.__enemyStatusIcons.owners.get(e.getUniqueId()),items=[...row.icons.values()];ok(items.length===1&&near(row.layout.center,bar.getCenterXInScene())&&items[0].icon.getY()+items[0].icon.getHeight()<bar.getY(),'one cracked shield above centered HP '+e.getVariables().get('EnemyType').getAsString());}
 ok(!star.fractures.has(outside.getUniqueId()),'outside radius gets no fracture');verify(p,cluster,3,'overlap cluster');
 const golemHP=hp(golem);p=fire(t,cluster[0]);ok(p.getUniqueId()!==firstProjectileId,'new projectile gets independent native lifetime ID');drain(p,'second Lance');
 ok(near(golemHP-hp(golem),A-20)&&rec.icon===icon&&rec.expires>expiry,'next Lance can splash again /refresh3s with same icon');
 while(star.time<rec.expires-.04)step();ok(star.fractures.has(golem.getUniqueId()),'fracture active until3s from last valid application');
 while(star.time<rec.expires+.02)step();ok(!star.fractures.has(golem.getUniqueId())&&golem.getBehavior('Health').FlatDamageReduction()===25,'fracture expires3s /restores original armor');clear();
 // Real shot counter survives changing targets on all supported 5-x combinations.
 for(const b of [0,1,2]){
  t=make(5,b);const actors=[440,480,520].map(x=>enemy(x));
  ok(near(t.getVariables().get('AttackInterval').getAsNumber(),.9/(1+[0,.1,.2][b])),'attack interval unchanged5-'+b);
  for(let shot=1;shot<=4;shot++){
   const before=actors.map(hp),target=actors[shot===3?1:0];p=fire(t,target,false);
   ok(p.__starLance===(shot===4)&&t.__starShotCount===shot,'fourth shot only across target changes5-'+b+'/'+shot);
   drain(p,'5-'+b+'/'+shot);
   if(shot<4)ok(effects.length===0&&near(before[shot===3?1:0]-hp(target),65),'normal shot retains65 direct /no Nova explosion5-'+b+'/'+shot);
   else{ok(actors.every((e,i)=>near(before[i]-hp(e),D+(i?A:0))),'crosspath preserves direct/AoE damage5-'+b);verify(p,actors,3,'5-'+b);}
  }
  clear();
 }
 t=make(0,5);let normal=enemy(440);p=fire(t,normal);drain(p,'Path2');ok(!p.__starLance&&effects.length===0&&near(10000-hp(normal),50),'Path2 fourth shot unaffected');clear();
 // A splash-killed candidate in the same fast sweep cannot create a phantom blast.
 t=make();const sweep=[enemy(440),enemy(460,352,'Basic',10),enemy(480),enemy(500)];p=fire(t,sweep[0]);p.getVariables().get('Speed').setNumber(10000);drain(p,'fast sweep');
 ok(effects.length===3&&p.__starHitTargets.size===3&&!p.__starHitTargets.has(sweep[1].getUniqueId())&&p.__starHitTargets.has(sweep[3].getUniqueId()),'dead splash victim skipped in same-frame direct candidates /no phantom explosion');clear();
 t=make();normal=enemy(440);p=fire(t,normal);normal.deleteFromScene();drain(p,'deleted original');ok(effects.length===0&&p.__starHitTargets.size===0,'no phantom explosion when original enemy disappears');clear();
 ok(!star.fractures.size&&!S.__enemyStatusIcons.owners.size&&!get('StarCannonImpact').length&&!get('StarCannonProjectile').length,'projectiles explosions and status owners all clean up');
 ok(camera===JSON.stringify([S.getLayer('').getCameraX(),S.getLayer('').getCameraY(),S.getLayer('').getCameraZoom()])&&route===JSON.stringify(V.get('MonsterPathPoints').toJSObject()),'camera and waypoint data unchanged');
 // Representative final native frame: three overlapping real impact animations.
 t=make();const display=[440,480,520].map(x=>enemy(x));p=fire(t,display[0]);while(get('StarCannonProjectile').includes(p))step();step(2);
 ok(get('StarCannonImpact').filter(o=>o.getAnimationName()==='Explosion').length===3,'three concurrent native Nova explosion animations at real impact positions');
 star.effect=nativeEffect;star.deal=nativeDeal;
 return{checks,initialGold:50000,currentGold:V.get('Money').getAsNumber(),maxDirectTargets:star.config.Lance.MaxTargets,radius:star.config.Nova.SplashRadius,visualDiameter:152,damageMultiplier:star.config.Nova.DamageMultiplier,splashRatio:star.config.Nova.SplashRatio,fractureDuration:star.config.Fracture.Duration,explosionAsset:star.vfxConfig.NovaExplosion.Image,combinations:['5-0','5-1','5-2'],viewport:[game.getGameResolutionWidth(),game.getGameResolutionHeight()]};
})()
