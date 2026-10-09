step(5);const nova=scene.__novaWisp,manager=scene.__waveManager,star=scene.__starCannon,p=scene.__freePlacement,num=(o,n)=>o.getVariables().get(n).getAsNumber(),near=(a,b)=>Math.abs(a-b)<.0001;
const route=vars.get('MonsterPathPoints').toJSObject(),routeCount=v('MonsterPathPointCount'),fixedRoute=JSON.stringify(route),fixedCamera=JSON.stringify([scene.getLayer('').getCameraX(),scene.getLayer('').getCameraY(),scene.getLayer('').getCameraZoom()]);
const clear=()=>{for(const n of ['Enemy','NovaWispDeathVisual','StarCannonProjectile','StarCannonImpact'])get(n).slice().forEach(o=>o.deleteFromScene());step();};
const make=(x=700,y=600)=>{const e=scene.createObject('Enemy');nova.ensure(e);e.setPosition(x-24,y-24);e.getVariables().get('MoveSpeed').setNumber(0);return e;};
ok(Object.keys(vars.get('EnemyTypes').toJSObject()).join(',')==='Basic,VoidHound','exactly Nova Wisp and one Void Hound archetype');
ok(nova.config.HP===100&&nova.config.Speed===80&&nova.config.Armor===0&&nova.config.Reward===5,'canonical HP100 speed80 armor0 reward5 config');
ok(Object.keys(nova.config.Views).length===4&&Object.values(nova.config.Views).every(x=>x.Crystals.length===4),'four genuine views and four individually animated crystal regions');
vars.get('Money').setNumber(100000);vars.get('Lives').setNumber(10000);
// Every real native wave starts through its existing Play request and sequential spawner.
for(let wave=1;wave<=50;wave++){
 clear();vars.get('GameOver').setBoolean(false);vars.get('Wave').setNumber(wave-1);vars.get('LastRewardedWave').setNumber(wave-1);vars.get('WaveActive').setBoolean(false);vars.get('WaveMode').setString('Waiting');vars.get('EnemiesToSpawn').setNumber(0);manager.queue=[];manager.index=0;manager.wait=3;
 clickObject(get('ShopPlayButton')[0]);ok(v('Wave')===wave&&manager.queue.length===wave*4&&manager.queue.filter(x=>x==='VoidHound').length===(wave<4?0:4*(1+Math.floor((wave-4)/3)))&&manager.queue.every(x=>['Basic','VoidHound'].includes(x)),'native total and predictable two-type distribution '+wave);
 let spawned=0,rewards=0,ids=new Set(),before=v('Money');
 while(manager.index<manager.queue.length){
  manager.elapsed=nova.config.SpawnInterval;step();const es=get('Enemy');
  ok(es.length===1,'one-at-a-time spawn '+wave+'/'+(spawned+1));const e=es[0],health=e.getBehavior('Health');spawned++;ids.add(e.getUniqueId());
  const isHound=e.getVariables().get('EnemyType').getAsString()==='VoidHound',HP=isHound?60:100,speed=isHound?135:80,reward=isHound?7:5;rewards+=reward;
  ok(health.Health()===HP&&health.MaxHealth()===HP&&num(e,'MoveSpeed')===speed&&num(e,'GoldReward')===reward&&num(e,'Armor')===0&&e.getWidth()===48&&e.getHeight()===48&&e.getColor()==='255;255;255','fixed archetype stats '+wave+'/'+spawned);
  health.SetHealth(0);step();if(isHound){e.__houndState.deathAge=scene.__voidHound.config.DeathDuration;step();}get('NovaWispDeathVisual').slice().forEach(o=>o.deleteFromScene());
 }
 step();ok(spawned===wave*4&&ids.size===spawned&&!get('Enemy').length&&v('EnemiesToSpawn')===0&&!vars.get('WaveActive').getAsBoolean(),'exact spawn drain and completion '+wave);
 ok(v('Money')===before+rewards+100,'fixed5/7 kill rewards and unchanged single completion bonus '+wave);const balance=v('Money');step(4);ok(v('Money')===balance,'no duplicate kill or completion reward '+wave);
}
ok(vars.get('GameOver').getAsBoolean()&&v('Wave')===50,'existing victory after wave50');clear();vars.get('GameOver').setBoolean(false);vars.get('WaveActive').setBoolean(false);vars.get('WaveMode').setString('Waiting');vars.get('Wave').setNumber(0);vars.get('LastRewardedWave').setNumber(0);manager.queue=[];manager.index=0;
// Facing follows full world movement vector, never whole-sprite rotation or flip tricks.
const point=vars.get('MonsterPathPoints').getChild(0),oldX=point.getChild('X').getAsNumber(),oldY=point.getChild('Y').getAsNumber();
for(const [direction,dx,dy] of [['Right',100,0],['Left',-100,0],['Down',0,100],['Up',0,-100]]){
 const e=make(900,600);e.getVariables().get('MoveSpeed').setNumber(80);e.getVariables().get('Waypoint').setNumber(0);point.getChild('X').setNumber(900+dx);point.getChild('Y').setNumber(600+dy);vars.get('MonsterPathPointCount').setNumber(1);step();
 ok(e.getVariables().get('Facing').getAsString()===direction&&e.getAnimationName()==='NovaMove_'+direction&&e.getAngle()===0&&!e.isFlippedX(),'correct distinct movement view '+direction);
 ok(near(Math.hypot(e.getCenterXInScene()-900,e.getCenterYInScene()-600),80*.016667),'unaltered movement budget '+direction);e.deleteFromScene();step();
}
point.getChild('X').setNumber(oldX);point.getChild('Y').setNumber(oldY);vars.get('MonsterPathPointCount').setNumber(routeCount);
let e=make(),st=e.__novaState;step();const logical=[e.getCenterXInScene(),e.getCenterYInScene()],rig=e.__novaRig,cy=rig.crystals[0].y,orbit=rig.glow.geometry.graphicsData[1].shape.x,bodyY=e.getRendererObject().y;step(20);
ok(e.getAnimationName()==='NovaIdle_Right'&&near(e.getCenterXInScene(),logical[0])&&near(e.getCenterYInScene(),logical[1]),'idle floats without moving path collider');
ok(Math.abs(rig.crystals[0].y-cy)>1&&Math.abs(e.getRendererObject().y-bodyY)>.05&&Math.abs(rig.glow.geometry.graphicsData[1].shape.x-orbit)>1,'independent crystal float, bob and moving orbit highlights');
clear();
// Two actual 50-damage Star projectiles, with one single 5-gold kill reward.
const t=scene.createObject('StarCannonTower'),tv=t.getVariables();p.positionSprite(t,'StarCannonTower',700,550);tv.get('FootprintX').setNumber(700);tv.get('FootprintY').setNumber(550);tv.get('FootprintRadius').setNumber(46);tv.get('TowerId').setNumber(99999);step();t.__starCooldown=100000;
e=make(840,510);step();t.__starFacing=star.bearing(t,e);const gold=v('Money'),uid=e.getUniqueId();ok(star.fire(t,e),'first actual Star volley launched');
for(let i=0;i<60&&e.getBehavior('Health').Health()===100;i++)step();
ok(e.getBehavior('Health').Health()===50&&get('Enemy').includes(e)&&v('Money')===gold,'first Star hit 100 to50, no reward');
ok(e.getAnimationName()==='NovaHit_Right'&&e.__novaState.hit>0&&e.__novaRig.body.tint===0xcceeff,'short light-blue hit and armor shake animation');
e.getVariables().get('MoveSpeed').setNumber(80);const x=e.getCenterXInScene(),y=e.getCenterYInScene();step();ok(Math.hypot(e.getCenterXInScene()-x,e.getCenterYInScene()-y)>0&&e.__novaState.hit>0,'hit reaction does not interrupt route movement');e.getVariables().get('MoveSpeed').setNumber(0);t.__starFacing=star.bearing(t,e);ok(star.fire(t,e),'second actual Star volley launched');
for(let i=0;i<60&&get('Enemy').includes(e);i++)step();
ok(!get('Enemy').includes(e)&&v('Money')===gold+5&&near(num(t,'DamageDealt'),100),'second hit kills once and awards exactly5 with100 actual damage');
ok(!scene.__enemyHealthBars.has(uid)&&get('NovaWispDeathVisual').length===1,'logical target/healthbar removed while death visual remains');
const death=get('NovaWispDeathVisual')[0];step(15);ok(get('NovaWispDeathVisual').includes(death)&&death.__novaRig.pieces.length===6&&death.__novaRig.crystals.every(x=>x.alpha<1),'armor separates, crystals scatter and core collapses before cleanup');
const balance=v('Money');step(50);ok(!get('NovaWispDeathVisual').length&&v('Money')===balance,'death completes and cleans up with no duplicate reward');t.deleteFromScene();step();
// Base escape keeps existing life cost and grants no kill reward.
e=make();e.getVariables().get('MoveSpeed').setNumber(80);e.getVariables().get('Waypoint').setNumber(routeCount);const lives=v('Lives'),money=v('Money');step();ok(!get('Enemy').includes(e)&&v('Lives')===lives-1&&v('Money')===money&&!get('NovaWispDeathVisual').length,'base arrival subtracts one life, no kill reward');
vars.get('IndexOpen').setBoolean(true);step();scene.__unitIndex.category='Monsters';step();ok(scene.__unitIndex.entries.length===2&&scene.__unitIndex.entries[0].name==='Nova Wisp'&&scene.__unitIndex.entries[0].HP===100&&scene.__unitIndex.entries[1].name==='Void Hound'&&scene.__unitIndex.entries[1].HP===60,'Index preserves Nova and adds one Void Hound');vars.get('IndexOpen').setBoolean(false);step();
// Exercise all five tower combat implementations against the same Basic enemy.
for(const name of p.types){
 const tower=scene.createObject(name),v0=tower.getVariables();p.positionSprite(tower,name,700,550);v0.get('FootprintX').setNumber(700);v0.get('FootprintY').setNumber(550);v0.get('FootprintRadius').setNumber(p.config(name).Radius);v0.get('TowerId').setNumber(88000+tower.getUniqueId());step();
 if(name==='StarCannonTower')tower.__starCooldown=0;
 const target=make(840,510),before=v('Money');step(600);ok(!get('Enemy').includes(target)&&v('Money')===before+5,'tower detects, shoots, damages and kills Nova Wisp '+name);tower.deleteFromScene();clear();step();
}
ok(JSON.stringify(vars.get('MonsterPathPoints').toJSObject())===fixedRoute&&JSON.stringify([scene.getLayer('').getCameraX(),scene.getLayer('').getCameraY(),scene.getLayer('').getCameraZoom()])===fixedCamera,'path/camera untouched by enemy replacement');
ok(p.types.length===1&&scene.__towerShopUI.cards.length===1&&scene.__obstaclePanel&&scene.__starCannon.visuals.size===0,'official tower shop, clear obstacle and component systems remain available');
lines.push('ALL NOVA WISP TESTS PASSED');output.textContent=lines.join('\n');document.title='PASS '+(lines.length-1)+' Nova checks';
