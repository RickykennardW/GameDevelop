step(4);const star=scene.__starCannon,p=scene.__freePlacement,G=scene.__voidGolem,near=(a,b,e=1e-5)=>Math.abs(a-b)<e;
const num=(o,n)=>o.getVariables().get(n).getAsNumber(),health=e=>e.getBehavior('Health').Health();
vars.get('Money').setNumber(1000000);
const clear=()=>{for(const n of ['StarCannonTower','Enemy','StarCannonProjectile','StarCannonImpact','NovaWispDeathVisual'])get(n).slice().forEach(o=>o.deleteFromScene());step(2);};
const make=(a=0,b=0,x=800,y=352)=>{
 const t=scene.createObject('StarCannonTower'),tv=t.getVariables();p.positionSprite(t,'StarCannonTower',x,y);
 for(const [n,value]of Object.entries({FootprintX:x,FootprintY:y,FootprintRadius:46,TowerId:800000+t.getUniqueId(),PurchasePrice:300,TotalInvestment:300,Path1Level:a,Path2Level:b}))tv.get(n).setNumber(value);
 step();star.apply(t);t.__starCooldown=100000;return t;
};
const enemy=(x,y,type='Basic',hp=10000)=>{
 const e=scene.createObject('Enemy'),ev=e.getVariables();ev.get('EnemyType').setString(type);scene.__novaWisp.ensure(e);
 ev.get('MoveSpeed').setNumber(0);ev.get('Waypoint').setNumber(0);ev.get('GoldReward').setNumber(0);e.setPosition(x-e.getWidth()/2,y-e.getHeight()/2);step();
 e.getBehavior('Health').SetMaxHealth(hp);e.getBehavior('Health').SetHealth(hp);return e;
};
const align=(t,e)=>{t.__starFacing=star.bearing(t,e);star.render();};
const drain=()=>{for(let i=0;i<180&&get('StarCannonProjectile').length;i++)step();ok(!get('StarCannonProjectile').length,'projectiles terminate');};
const originalCamera=JSON.stringify([scene.getLayer('').getCameraX(),scene.getLayer('').getCameraY(),scene.getLayer('').getCameraZoom()]),route=JSON.stringify(vars.get('MonsterPathPoints').toJSObject());
let stateCount=0;
for(let a=0;a<=5;a++)for(let b=0;b<=5;b++){
 if(a>=3&&b>=3){ok(!star.valid(a,b)&&star.stats(a,b)===null,'reject invalid '+a+'-'+b);continue;}
 const t=make(a,b),tv=t.getVariables(),pair=star.visual(t),key=a+'_'+b;stateCount++;
 tv.get('DamageDealt').setNumber(123);const uid=t.getUniqueId(),xy=p.center(t),invest=num(t,'TotalInvestment');
 star.apply(t);star.apply(t);star.render();
 ok(pair.key===key&&pair.barrels.length===(b>=3?2:1)&&pair.nodes.every(n=>n.sprite.texture.valid),'real atlas textures and barrel count '+key);
 ok(near(num(t,'Damage'),50*(1+[0,.15,.3,.3,.3,.3][a]))&&near(num(t,'AttackInterval'),.9/(1+[0,.1,.2,.45,.45,.45][b])),'additive baseline stats '+key);
 ok(t.getUniqueId()===uid&&num(t,'DamageDealt')===123&&num(t,'TotalInvestment')===invest&&p.radius(t)===46&&near(p.center(t)[0],xy[0])&&near(p.center(t)[1],xy[1]),'repeat apply retains identity economy damage tracking footprint '+key);
 for(const direction of [-90,-45,0,45,90,135,180,225]){
  t.__starFacing=direction;star.render();const base=star.componentTransform(t,'Base'),turret=star.componentTransform(t,'Turret');
  const [x,y]=p.center(t),rad=direction*Math.PI/180;
  ok(base.angle===0&&pair.baseRig.rotation===0&&near(base.x,x)&&near(base.y,y)&&near(turret.x,x)&&near(turret.y,y),'stationary base / stable shared pivot '+key+'/'+direction);
  pair.meta.Turret.Muzzles.forEach((_,i)=>{const m=star.muzzle(t,i),forward=(m[0]-x)*Math.cos(rad)+(m[1]-y)*Math.sin(rad);ok(forward>30&&Math.hypot(m[0]-x,m[1]-y)<=46,'physical muzzle forward inside envelope '+key+'/'+direction+'/'+i);});
 }
 clear();
}
ok(stateCount===27,'all 27 physical states exercised at 8 directions');
clickObject(scene.__towerShopUI.cards[0].background);move(800,352);step(2);
const ghost=get('TilePlacement_Indicator')[0],ghostSprite=ghost.getRendererObject();
ok(!ghost.isHidden()&&near(ghostSprite.scale.x*ghostSprite.texture.width,88)&&near(ghostSprite.scale.y*ghostSprite.texture.height,88),'placement ghost matches modular tower canvas at unchanged radius46 '+JSON.stringify({hidden:ghost.isHidden(),w:ghost.getWidth(),h:ghost.getHeight(),sw:ghostSprite.scale.x*ghostSprite.texture.width,sh:ghostSprite.scale.y*ghostSprite.texture.height,active:p.active}));p.stop();step();
// Acquire real targets through the smooth aiming loop, not just a setAngle test.
for(const angle of [-90,-45,0,45,90,135,180,225]){
 const t=make(),r=angle*Math.PI/180,target=enemy(800+130*Math.cos(r),352+130*Math.sin(r));step(100);
 ok(star.canFire(t,target)&&Math.abs(star.wrap(t.__starFacing-angle))<.01,'actual target acquisition '+angle);
 const mouth=star.muzzle(t,0);star.fire(t,target);const shot=get('StarCannonProjectile')[0];
 ok(near(shot.getCenterXInScene(),mouth[0])&&near(shot.getCenterYInScene(),mouth[1])&&Math.abs(star.wrap(shot.getAngle()-angle))<.01,'actual mouth / heading '+angle);drain();clear();
}
for(const [start,path,allowed,blocked]of [[[2,2],1,[3,2],2],[[2,2],2,[2,3],1]]){
 const t=make(...start),tv=t.getVariables();const before=v('Money');ok(star.upgrade(t,path),'2-2 specialization buy path'+path);
 ok(num(t,'Path1Level')===allowed[0]&&num(t,'Path2Level')===allowed[1],'correct specialization state');const spent=v('Money');
 ok(!star.upgrade(t,blocked)&&v('Money')===spent,'other level3 blocked without spending');
 ok(star.upgrade(t,path)&&star.upgrade(t,path),'levels4 and5 reachable');const max=v('Money');
 ok(!star.upgrade(t,path)&&v('Money')===max,'max level5 cannot charge');clear();
}
ok(star.config.Paths[0].Upgrades.map(u=>u.Cost).join(',')==='160,300,1100,2800,7000'&&star.config.Paths[1].Upgrades.map(u=>u.Cost).join(',')==='130,280,1000,2500,5750','all prices / approved rounded tier5');
// The fourth SHOT is special; VFX frames and targets do not increment this counter.
let t=make(3,0),target=enemy(940,352),adjacent=enemy(955,382),outside=enemy(1050,450);align(t,target);
for(let n=1;n<=4;n++){
 const hp=health(target),splash=health(adjacent);ok(star.fire(t,target),'Nova sequence shot'+n);
 const bolt=get('StarCannonProjectile')[0];ok(get('StarCannonProjectile').length===1&&bolt.getAnimationName()===(n===4?'Nova':'Dense'),'only fourth projectile is Nova');
 drain();ok(near(hp-health(target),65*(n===4?1.75:1)),'direct damage exactly once '+n);ok(near(splash-health(adjacent),n===4?65*1.75*.25:0),'splash only on fourth / primary excluded '+n);
}
ok(health(outside)===10000,'Nova radius excludes distant enemy');ok(get('StarCannonImpact').some(o=>o.getAnimationName()==='Explosion'),'animated native Nova explosion exists');step(40);ok(!get('StarCannonImpact').length,'explosion cleanup');clear();
// Fracture composes with Fortification: 25 + 10 - (25 * 20%) = 30.
t=make(4,0);target=enemy(940,352,'VoidGolem');align(t,target);G.fort.apply(target);step();
t.__starShotCount=3;const before=health(target);star.fire(t,target);drain();
let rec=star.fractures.get(target.getUniqueId()),h=target.getBehavior('Health');
ok(rec&&h.FlatDamageReduction()===30&&num(target,'BaseArmor')===25,'fracture subtracts 20% BASE armor while keeping buff');
ok(near(before-health(target),65*1.75-30),'native Health armor applied once');
const firstExpiry=rec.expires,icon=rec.icon;step(40);t.__starShotCount=3;align(t,target);star.fire(t,target);drain();
ok(star.fractures.size===1&&rec.icon===icon&&rec.expires>firstExpiry&&h.FlatDamageReduction()===30,'fracture refreshes duration without stacking or extra icon');
ok(icon.getY()>target.getCenterYInScene()&&icon.getWidth()===17,'fracture icon stays below head / HP bar');
G.fort.end(G.fort.members.get(target.getUniqueId()));ok(h.FlatDamageReduction()===20,'buff expiry preserves fracture');
while(star.time<rec.expires+.02)step();ok(h.FlatDamageReduction()===25&&!star.fractures.size&&!get('StarCannonImpact').includes(icon),'fracture expires / restores native armor / destroys icon');
target.deleteFromScene();step();ok(!star.fractures.size,'enemy deletion leaves no debuff record');clear();
// Straight lance crosses five enemies once and never retargets after first death.
t=make(5,2);const line=Array.from({length:6},(_,i)=>enemy(860+i*23,352,'Basic'));align(t,line[0]);t.__starShotCount=3;star.fire(t,line[0]);
let lance=get('StarCannonProjectile')[0];ok(lance.__starLance&&lance.getAnimationName()==='Lance','Supernova fires distinct lance');
const angle=lance.getAngle();drain();ok(line.slice(0,5).every(e=>near(10000-health(e),65*1.75))&&health(line[5])===10000,'five targets max / each exactly once / sixth untouched');
ok(lance.__starHitTargets.size===5&&lance.getAngle()===angle,'five unique IDs / no homing rotation');clear();
t=make(5,0);target=enemy(900,352);const offLine=enemy(950,420);align(t,target);t.__starShotCount=3;star.fire(t,target);lance=get('StarCannonProjectile')[0];target.getBehavior('Health').SetHealth(0);drain();
ok(health(offLine)===10000&&lance.__starTravel<=lance.__starRange+1e-5,'dead original target does not cancel or redirect straight lance; finite range');clear();
// Twin alternation and independent local recoil, with no damage multiplication.
t=make(2,3);target=enemy(940,352);align(t,target);const sequence=[];
for(let n=0;n<4;n++){
 const before=health(target);star.fire(t,target);const bolt=get('StarCannonProjectile')[0];sequence.push(bolt.__muzzleIndex);
 ok(get('StarCannonProjectile').length===1&&near(num(bolt,'Damage'),65),'one full-damage Twin bolt per shot');
 step(2);star.render();const pair=star.visual(t),active=bolt.__muzzleIndex,other=1-active;
 ok(pair.barrels[active].sprite.y>pair.barrels[active].y&&near(pair.barrels[other].sprite.y,pair.barrels[other].y),'independent barrel recoil '+n);
 drain();ok(near(before-health(target),65),'Twin damage once '+n);step(12);
}
ok(sequence.join(',')==='0,1,0,1','left right alternation');clear();
t=make(2,4);target=enemy(940,352);align(t,target);
for(let n=1;n<=7;n++){star.fire(t,target);drain();ok(num(t,'RhythmStacks')===Math.min(5,n),'Rhythm max five stack '+n);}
ok(near(num(t,'AttackInterval'),.9/1.6),'Rhythm max +60% additive speed');while(star.time<t.__starLastShot+2.8)step();ok(num(t,'RhythmStacks')===5,'Rhythm remains before3s');
while(star.time<t.__starLastShot+3.05)step();ok(num(t,'RhythmStacks')===0&&near(num(t,'AttackInterval'),.9/1.45),'Rhythm resets3s after last real shot');clear();
// Drive from actual clock at both sides of activation and exact end boundary.
t=make(2,5);target=enemy(940,352);align(t,target);t.__starNextOverdrive=star.time+.03;step();ok(!t.__starOverdrive,'Overdrive inactive before cooldown');step();
ok(t.__starOverdrive&&near(t.__starOverdriveEnd-star.time,2),'Overdrive starts for2game seconds');
star.fire(t,target);let shots=get('StarCannonProjectile');ok(shots.length===2&&shots[0].__muzzleIndex!==shots[1].__muzzleIndex,'Overdrive two distinct simultaneous emitters');
const hpBefore=health(target);drain();ok(near(hpBefore-health(target),130),'Overdrive exactly two full-damage hits');
const end=t.__starOverdriveEnd;while(star.time<end+.01)step();ok(!t.__starOverdrive&&near(t.__starNextOverdrive-end,18),'Overdrive ends and waits18seconds');
align(t,target);star.fire(t,target);ok(get('StarCannonProjectile').length===1,'normal alternating fire restored immediately');drain();step(20);ok(!get('StarCannonProjectile').length,'no queued extra projectiles after Overdrive');
const next=t.__starNextOverdrive;while(star.time<next-.03)step();ok(!t.__starOverdrive,'cooldown cannot activate early');step(3);ok(t.__starOverdrive,'next cycle activates after20seconds');clear();
// Runtime clock speed, death cleanup and a bounded crowd render.
t=make(0,4);target=enemy(940,352);align(t,target);star.fire(t,target);drain();vars.get('WaveMode').setString('ManualFast');step();const now=star.time;step();ok(near(star.time-now,.033334),'Star mechanics use existing2x game clock');vars.get('WaveMode').setString('Waiting');clear();
const crowd=Array.from({length:40},(_,i)=>make(i%3,3+i%3,260+i%10*115,330+Math.floor(i/10)*150));
step(20);ok(star.visuals.size===40&&get('StarCannonBaseVisual').length===40&&get('StarCannonTurretVisual').length===40,'40 towers have one active component rig each');clear();
for(let n=0;n<5;n++){
 const tower=make(0,5);tower.__starNextOverdrive=star.time+.01;step();ok(tower.__starOverdrive,'pool fixture activates Overdrive');tower.deleteFromScene();step();
 const fresh=make(0,5);ok(!fresh.__starOverdrive&&fresh.__starNextOverdrive>star.time+17,'reused native tower has fresh Overdrive cooldown');clear();
}
ok(!star.visuals.size&&!star.fractures.size&&!get('StarCannonImpact').length&&!get('StarCannonBaseVisual').length&&!get('StarCannonTurretVisual').length,'all tower rigs projectiles VFX and debuffs clean up');
ok(originalCamera===JSON.stringify([scene.getLayer('').getCameraX(),scene.getLayer('').getCameraY(),scene.getLayer('').getCameraZoom()])&&route===JSON.stringify(vars.get('MonsterPathPoints').toJSObject()),'camera and path layout unchanged');
const unloadTower=make(4,0),unloadEnemy=enemy(940,352,'VoidGolem');star.fracture(unloadEnemy);star.render();const baseTexture=star.texture('p1_0','Base').baseTexture;
ok(star.visuals.size===1&&star.fractures.size===1&&star.textures.size>0,'unload fixture owns active rig debuff and cached frames');scene.unloadScene();
ok(!star.visuals.size&&!star.fractures.size&&!star.textures.size&&!baseTexture.destroyed,'scene unload releases rigs/debuffs/cropped textures while preserving shared atlas');
lines.push('ALL NOVA SPIKE TESTS PASSED');output.textContent=lines.join('\n');document.title='PASS '+(lines.length-1)+' Nova Spike checks';
