step(4);const s=scene.__starCannon,p=scene.__freePlacement,ui=scene.__towerShopUI,near=(a,b)=>Math.abs(a-b)<.00001;
ok(ui.cards.length===5&&vars.get('TowerShopCatalog').toJSObject()[4].Cost===300,'Star Cannon fifth shop card and exact cost 300');
ok(ui.cards[4].name.getString()==='STAR CANNON'&&ui.cards[4].icon.getAnimationName()==='StarCannonTower','Star shop title and icon');
vars.get('Money').setNumber(100000);clickObject(ui.cards[4].background);ok(p.active&&p.type==='StarCannonTower','whole card starts native Star builder');
let point;for(let y=300.3;y<960&&!point;y+=11.7)for(let x=220.4;x<1580;x+=13.1)if(p.validate('StarCannonTower',x,y).valid){point=[x,y];break;}
ok(!!point,'find valid fractional free placement');const before=v('Money');click(...point);let A=get('StarCannonTower')[0];
ok(A&&v('Money')===before-300&&!p.active,'one native placement charges once and exits builder');
ok(near(p.center(A)[0],point[0])&&near(p.center(A)[1],point[1])&&p.radius(A)===46,'exact unsnapped Star footprint');
clickObject(ui.cards[4].background);const paid=v('Money');click(...point);ok(get('StarCannonTower').length===1&&v('Money')===paid,'tower overlap never charges');
const road=get('Monster_Path')[10];click(road.getCenterXInScene(),road.getCenterYInScene());ok(get('StarCannonTower').length===1&&v('Money')===paid,'widened road blocks Star placement');
input.onMouseButtonPressed(1);step();input.onMouseButtonReleased(1);step();ok(!p.active,'right click cancels Star builder');
clickObject(ui.cards[4].background);input.onKeyPressed(27);step();input.onKeyReleased(27);step();ok(!p.active,'Escape cancels Star builder');
clickObject(A);ok(scene.__selectedPanel.tower===A&&scene.__selectedPanel.cards.length===2,'native selection opens two Star upgrade paths');
ok(scene.__selectedPanel.objects.path0.getString()==='STAR DESTROYER'&&scene.__selectedPanel.objects.path1.getString()==='COSMIC BARRAGE','panel shows named Star paths');
ok(scene.__selectedPanel.objects.title.getString()==='STAR CANNON'&&scene.__selectedPanel.objects.preview.getAnimationName()==='SC_0_0','panel Star title and live preview');
const rv=A.getVariables(),range=get('RangeIndicator')[0];ok(near(range.getWidth(),420)&&near(range.getCenterYInScene(),p.center(A)[1]),'base range 210 uses canonical footprint center');
const number=(o,n)=>o.getVariables().get(n).getAsNumber();
vars.get('Money').setNumber(20);const snapshot=number(A,'TotalInvestment');clickObject(scene.__selectedPanel.cards[0].background);ok(number(A,'Path1Level')===0&&number(A,'TotalInvestment')===snapshot&&v('Money')===20,'unaffordable upgrade rejected in actual panel');
vars.get('Money').setNumber(100000);const cam=()=>JSON.stringify([scene.getLayer('').getCameraX(),scene.getLayer('').getCameraY(),scene.getLayer('').getCameraZoom()]),fixed=cam();
const remove=(...names)=>{for(const n of names)get(n).slice().forEach(o=>o.deleteFromScene());step();};
const makeTower=(a=0,b=0)=>{
 const t=scene.createObject('StarCannonTower');p.positionSprite(t,'StarCannonTower',700,550);const v=t.getVariables();
 v.get('TowerId').setNumber(9000+t.getUniqueId());v.get('FootprintX').setNumber(700);v.get('FootprintY').setNumber(550);v.get('FootprintRadius').setNumber(46);
 step();v.get('Path1Level').setNumber(a);v.get('Path2Level').setNumber(b);s.apply(t);t.__starCooldown=100000;return t;
};
// Purchase every valid build through panel buttons, including primary-first crosspaths.
remove('StarCannonTower');vars.get('SelectedTower').setNumber(0);step();
for(let a=0;a<=4;a++)for(let b=0;b<=4;b++){
 if(a>=3&&b>=3){ok(s.stats(a,b)===null,'invalid combined specialization rejected '+a+'_'+b);continue;}
 const t=makeTower(),v0=t.getVariables(),center=p.center(t),uid=t.getUniqueId(),money=v('Money');vars.get('SelectedTower').setNumber(number(t,'TowerId'));step();
 for(let i=0;i<a;i++){clickObject(scene.__selectedPanel.cards[0].background);}
 for(let i=0;i<b;i++){clickObject(scene.__selectedPanel.cards[1].background);}
 const cost=s.config.Paths[0].Upgrades.slice(0,a).reduce((x,u)=>x+u.Cost,0)+s.config.Paths[1].Upgrades.slice(0,b).reduce((x,u)=>x+u.Cost,0);
 ok(t.getAnimationName()===a+'_'+b&&number(t,'Path1Level')===a&&number(t,'Path2Level')===b&&near(number(t,'TotalInvestment'),300+cost)&&near(v('Money'),money-cost),'actual purchased visual and investment '+a+'_'+b);
 ok(near(number(t,'Damage'),[50,57.5,66.125,66.125,89.26875][a]),'multiplicative damage '+a+'_'+b);
 ok(near(number(t,'AttackRange'),210*(a>=2?1.05:1)*(b>=2?1.05:1))&&near(number(t,'AttackInterval'),[.9,.9/1.15,.9/1.15/1.1,.9/1.15/1.1,.9/1.15/1.1][b]),'range and rate stack '+a+'_'+b);
 ok(t.getUniqueId()===uid&&near(p.center(t)[0],center[0])&&near(p.center(t)[1],center[1])&&number(t,'FootprintRadius')===46&&cam()===fixed,'upgrade keeps owner anchor footprint camera '+a+'_'+b);
 const cx=t.getCenterXInScene(),cy=t.getCenterYInScene(),scale=scene.__worldStyle.star;
 ok(near(cx+(t.getPointX('GroundContact')-cx)*scale,center[0])&&near(cy+(t.getPointY('GroundContact')-cy)*scale,center[1]),'rendered contact registered to footprint '+a+'_'+b);
 ok(scene.__selectedPanel.objects.preview.getAnimationName()==='SC_'+a+'_'+b,'panel follows composed visual '+a+'_'+b);
 if(a>=3||b>=3){const path=a>=3?2:1,card=scene.__selectedPanel.cards[path-1];if((path===1?a:b)===2){
  const gold=v('Money');ok(card.locked,'secondary Lv3 visually locked '+a+'_'+b);clickObject(card.background);ok(v('Money')===gold&&!s.upgrade(t,path),'secondary Lv3 blocked by UI and system '+a+'_'+b);
 }}
 const investment=number(t,'TotalInvestment'),gold=v('Money');click(100,638,'SelectedTowerUI');ok(get('StarCannonTower').length===0&&v('Money')===gold+Math.floor(investment*7/10),'sell refunds base and upgrades once '+a+'_'+b);
}
vars.get('SelectedTower').setNumber(0);step();
const enemy=(x,y,hp=1000)=>{const e=scene.createObject('Enemy');e.setAnimationName('Idle Run');e.setPosition(x-e.getWidth()/2,y-e.getHeight()/2);const v=e.getVariables();v.get('MoveSpeed').setNumber(0);v.get('EnemyType').setString('Normal');v.get('Waypoint').setNumber(0);e.getBehavior('Health').SetMaxHealth(hp);e.getBehavior('Health').SetHealth(hp);return e;};
const health=e=>e.getBehavior('Health').Health();
// A new purchase after selling upgraded/recycled objects starts at 0-0 and fires.
vars.get('Money').setNumber(100000);clickObject(ui.cards[4].background);click(...point);const fresh=get('StarCannonTower')[0];
let freshTarget=enemy(point[0]+100,point[1]);step();
ok(fresh.getAnimationName()==='0_0'&&number(fresh,'Damage')===50&&number(fresh,'TotalInvestment')===300&&get('StarCannonProjectile').length===1,'new purchase after upgrade/sell resets lifetime and immediately attacks');
remove('Enemy','StarCannonProjectile','StarCannonImpact','StarCannonTower');
let t=makeTower(),target=enemy(800,550);t.__starCooldown=0;step();ok(get('StarCannonProjectile').length===1&&get('StarCannonProjectile')[0].getAnimationName()==='Base','base autonomous target acquisition and visible projectile');
t.__starCooldown=100000;step(50);ok(near(health(target),950)&&near(number(t,'DamageDealt'),50),'base real direct damage and owner attribution');remove('Enemy','StarCannonProjectile','StarCannonImpact','StarCannonTower');
for(const [a,b,count,damage,kind] of [[1,0,1,57.5,'Reinforced'],[3,0,1,66.125,'Explosion'],[4,0,1,89.26875,'Supernova'],[0,3,2,32.5,'Twin'],[0,4,3,30,'Meteor'],[2,3,2,42.98125,'Twin'],[2,4,3,39.675,'Meteor']]){
 t=makeTower(a,b);target=enemy(800,550);s.fire(t,target);const shots=get('StarCannonProjectile').slice();
 ok(shots.length===count&&shots.every(o=>near(number(o,'Damage'),damage)&&o.getAnimationName()===kind),'snapshot projectile count/fraction/skin '+a+'_'+b);
 ok(new Set(shots.map(o=>[o.getX().toFixed(3),o.getY().toFixed(3)].join(','))).size===count,'distinct real emitter origins '+a+'_'+b);
 step(60);ok(near(1000-health(target),count*damage)&&near(number(t,'DamageDealt'),count*damage),'actual volley damage once '+a+'_'+b);remove('Enemy','StarCannonProjectile','StarCannonImpact','StarCannonTower');
}
for(const a of [3,4]){
 t=makeTower(a,0);target=enemy(800,550);const inside=enemy(800,610),outside=enemy(800,665),damage=a===3?66.125:89.26875,ratio=a===3?.4:.65;
 s.fire(t,target);step(60);ok(near(1000-health(target),damage),'primary full damage without own splash '+a);
 ok(near(1000-health(inside),damage*ratio)&&near(health(outside),1000),'single splash fraction and radius boundary '+a);
 ok(near(number(t,'DamageDealt'),damage*(1+ratio)),'direct plus actual splash attributed once '+a);remove('Enemy','StarCannonProjectile','StarCannonImpact','StarCannonTower');
}
// Radius 98 at Supernova includes an enemy 90 units away, unlike level 3 radius 70.
t=makeTower(4,0);target=enemy(800,550);let edge=enemy(890,550);s.fire(t,target);step(60);ok(near(1000-health(edge),89.26875*.65)&&near(number(t,'SplashRadius'),98),'Supernova radius is 1.4 times level 3');remove('Enemy','StarCannonProjectile','StarCannonImpact','StarCannonTower');
t=makeTower(0,3);target=enemy(800,550);s.fire(t,target);const oldShots=get('StarCannonProjectile').slice();t.getVariables().get('Path2Level').setNumber(4);s.apply(t);ok(oldShots.every(o=>near(number(o,'Damage'),32.5)&&o.getAnimationName()==='Twin'),'in-flight projectile stats immutable after upgrade');remove('Enemy','StarCannonProjectile','StarCannonImpact','StarCannonTower');
t=makeTower();target=enemy(800,550,10);s.fire(t,target);step(60);ok(near(number(t,'DamageDealt'),10),'damage dealt clamps overkill to actual HP');remove('Enemy','StarCannonProjectile','StarCannonImpact','StarCannonTower');
const firing=mode=>{const t=makeTower(),e=enemy(800,550,100000),ids=new Set();vars.get('WaveMode').setString(mode);t.__starCooldown=0;for(let i=0;i<120;i++){step();for(const p of get('StarCannonProjectile'))ids.add(p.getUniqueId());}const result=ids.size;remove('Enemy','StarCannonProjectile','StarCannonImpact','StarCannonTower');return result;};
const one=firing('Manual'),two=firing('ManualFast');ok(two>one&&two>=one*1.6&&two<=one*2.2,'native cooldown respects global 2x');vars.get('WaveMode').setString('Waiting');step();
vars.get('IndexOpen').setBoolean(true);step();const index=scene.__unitIndex;ok(index.entries.some(e=>e.type==='StarCannonTower'&&e.damage===50&&e.range===210&&e.price===300),'Star appears in live Index with actual base stats');
ok(Object.keys(index.objects).filter(k=>k.startsWith('starUpgrade')&&!k.startsWith('starUpgradeName')&&!k.startsWith('starUpgradeDesc')).length===8,'Index shows eight Star upgrade icons');
vars.get('IndexOpen').setBoolean(false);step();ok(get('StarCannonImpact').length===0&&get('StarCannonProjectile').length===0,'effects and projectiles cleaned up');
lines.push('ALL STAR CANNON TESTS PASSED');output.textContent=lines.join('\n');
