step(5);const G=scene.__voidGolem,F=G.fort,N=scene.__novaWisp,star=scene.__starCannon,near=(a,b)=>Math.abs(a-b)<.0001;
const data=game.getSceneAndExtensionsData('Game Scene').sceneData,route=vars.get('MonsterPathPoints').toJSObject(),routeCount=v('MonsterPathPointCount');
const clear=()=>{for(const name of ['Enemy','NovaWispDeathVisual','StarCannonProjectile','StarCannonImpact','StarCannonTower'])get(name).slice().forEach(e=>e.deleteFromScene());step(2);};
const make=(type='VoidGolem',x=900,y=600,dir='Right')=>{const e=scene.createObject('Enemy');e.getVariables().get('EnemyType').setString(type);N.ensure(e);const size=type==='VoidGolem'?64:48;e.setPosition(x-size/2,y-size/2);e.getVariables().get('Facing').setString(dir);e.getVariables().get('MoveSpeed').setNumber(0);return e;};
const restore=()=>{vars.get('MonsterPathPointCount').setNumber(routeCount);route.forEach((p,i)=>{const q=vars.get('MonsterPathPoints').getChild(i);q.getChild('X').setNumber(p.X);q.getChild('Y').setNumber(p.Y);});};
const until=(condition,max=5000)=>{let n=0;while(!condition()&&n++<max)step();ok(n<max,'bounded native timeline');};
const hp=e=>e.getBehavior('Health').Health(),armor=e=>e.getBehavior('Health').FlatDamageReduction();
vars.get('Money').setNumber(100000);vars.get('Lives').setNumber(10000);
ok(Object.keys(vars.get('EnemyTypes').toJSObject()).length===6&&G.config.HP===480&&G.config.Speed===50&&G.config.Armor===25&&G.config.Reward===20,'six archetypes/exact elite stats');
const clips=data.objects.find(o=>o.name==='Enemy').animations.filter(a=>a.name.startsWith('VoidGolem'));
ok(clips.length===20&&clips.every(a=>a.directions[0].sprites.length===4&&!a.name.includes('Attack')),'20native directional clips/80 actual atlas poses/no attacks');
for(const d of ['Up','Down','Left','Right'])for(const m of ['Idle','Move','Hit','Death','Skill'])for(let f=0;f<4;f++){
 const tex=G.texture(d,m,f);ok(tex.orig.width===256&&tex.orig.height===342,'uniform atlas frame canvas '+d+'/'+m+'/'+f);
}
for(const [dir,dx,dy]of [['Up',0,-300],['Down',0,300],['Left',-300,0],['Right',300,0]]){
 clear();const e=make('VoidGolem',900,600,dir);step();const id=e.getUniqueId(),state=e.__golemState,idle=new Set();
 for(let i=0;i<85;i++){step();idle.add(e.__golemRig.body.texture);}
 ok(idle.size===4&&e.getAnimationName()==='VoidGolemIdle_'+dir,'four actual idle textures '+dir);
 ok(e.getWidth()===64&&e.getHeight()===64&&hp(e)===480&&armor(e)===25&&e.getHitBoxes().length>0,'stable collider/base health/armor '+dir);
 const point=vars.get('MonsterPathPoints').getChild(0);point.getChild('X').setNumber(900+dx);point.getChild('Y').setNumber(600+dy);vars.get('MonsterPathPointCount').setNumber(1);e.getVariables().get('Waypoint').setNumber(0);e.getVariables().get('MoveSpeed').setNumber(50);
 const move=new Set();for(let i=0;i<80;i++){step();move.add(e.__golemRig.body.texture);}
 ok(move.size===4&&e.getAnimationName()==='VoidGolemMove_'+dir&&e.getAngle()===0&&!e.isFlippedX(),'four directional walking frames/no spin '+dir);
 const before=hp(e),x=e.getX(),y=e.getY();star.deal(null,e,50);step();const hit=new Set();
 for(let i=0;i<12;i++){if(e.getAnimationName().includes('Hit_'))hit.add(e.__golemRig.body.texture);step();}
 ok(hp(e)===before-25&&hit.size===4&&Math.hypot(e.getX()-x,e.getY()-y)>0,'four hit frames/flat armor/hit does not stop movement '+dir);
 state.nextCast=G.frameTime+.001;step();const frozen=[e.getX(),e.getY(),e.getVariables().get('Waypoint').getAsNumber()],castStart=state.castStart,skill=new Set();
 ok(state.casting&&e.getAnimationName()==='VoidGolemSkill_'+dir,'directional skill begins '+dir);
 let n=0;
 while(state.casting&&n++<60){
  skill.add(e.__golemRig.body.texture);
  if(n===15){const h=hp(e);star.deal(null,e,50);ok(hp(e)<h,'vulnerable while casting '+dir);}
  step();ok(near(e.getX(),frozen[0])&&near(e.getY(),frozen[1])&&e.getVariables().get('Waypoint').getAsNumber()===frozen[2],'no drift/teleport/waypoint progress while casting '+dir+'/'+n);
  if(state.casting)ok(e.getAnimationName()==='VoidGolemSkill_'+dir,'hit cannot override skill '+dir+'/'+n);
 }
 ok(n<60&&skill.size===4&&state.castCount===1&&state.releaseCount===1&&near(state.nextCast-castStart,25),'four skill frames/one release/cooldown from cast start '+dir);
 ok(e.getVariables().get('MoveSpeed').getAsNumber()===50&&armor(e)===35&&e.getVariables().get('BaseArmor').getAsNumber()===25,'base speed intact/self35armor/base25 '+dir);
 const cx=e.getCenterXInScene(),cy=e.getCenterYInScene();step();ok(near(Math.hypot(e.getCenterXInScene()-cx,e.getCenterYInScene()-cy),50*.016667),'resume exact movement budget/current point '+dir);
 const gold=v('Money');e.getBehavior('Health').SetHealth(0);step();const death=new Set();
 ok(e.getAnimationName()==='VoidGolemDeath_'+dir&&!e.getHitBoxes().length&&!scene.__enemyHealthBars.has(id)&&!F.members.has(id)&&v('Money')===gold+20,'death priority/no collider/bar/buff/single20reward '+dir);
 while(get('Enemy').includes(e)){death.add(e.getAnimationFrame());step();}
 ok(death.size===4&&!G.actors.has(id)&&e.__golemRig.container.destroyed&&v('Money')===gold+20,'four death frames/rig cleanup/no duplicate reward '+dir);restore();
}
clear();const caster=make('VoidGolem',route[0].X,route[0].Y),st=caster.__golemState;caster.getVariables().get('MoveSpeed').setNumber(50);
until(()=>st.casting,1600);ok(st.castStart-st.spawnTime>=25&&st.castStart-st.spawnTime<25.02,'actual first cooldown25seconds');
const frozen=[caster.getX(),caster.getY(),caster.getVariables().get('Waypoint').getAsNumber()];
until(()=>st.applied,45);const release=G.frameTime;
ok(release-st.castStart>=.6&&release-st.castStart<.62&&armor(caster)===35,'actual release at25.6/self35armor');
until(()=>!st.casting,20);ok(G.frameTime-st.castStart>=.8&&G.frameTime-st.castStart<.82&&near(caster.getX(),frozen[0])&&near(caster.getY(),frozen[1]),'cast finishes after0.8 without movement');
until(()=>!caster.getVariables().get('VoidFortificationActive').getAsBoolean(),650);ok(G.frameTime-release>=10&&G.frameTime-release<10.02&&armor(caster)===25,'buff expires10seconds/exact base armor restoration');
until(()=>st.castCount===2,1000);ok(st.castStart-st.spawnTime>=50&&st.castStart-st.spawnTime<50.04,'second casting at50seconds,not after expiry');
step(300);const second=make('VoidGolem',700,500);ok(near(second.__golemState.nextCast-second.__golemState.spawnTime,25)&&second.__golemState.nextCast-st.nextCast>4.9,'independent per-instance cooldown');
clear();const a=make(),nova=make('Basic',980,600),guard=make('VoidGuard',1000,600),hound=make('VoidHound',1000.1,600),sentinel=make('VoidSentinel',1030,600),brute=make('VoidBrute',970,600);step();
a.__golemState.nextCast=G.frameTime+.001;step();step(20);sentinel.setPosition(960-24,600-24);brute.setPosition(1100-24,600-24);until(()=>a.__golemState.applied,30);
ok(armor(a)===35&&armor(nova)===10&&armor(guard)===20&&armor(sentinel)===10&&armor(hound)===0&&armor(brute)===15,'release snapshot/radius<=100/common armor correct');
ok(get('VoidFortificationVFX').length===4&&get('VoidFortificationCastPulse').length===1,'one transient pulse plus independent persistent shields');
const rec=F.members.get(nova.getUniqueId()),icon=rec.vfx,oldExpires=rec.expires;nova.setPosition(1150-24,600-24);hound.setPosition(930-24,600-24);step(4);
ok(armor(nova)===10&&armor(hound)===0,'leaving retains/entering afterward does not gain aura');
ok(near(icon.getX(),nova.getCenterXInScene()+12+3)&&icon.getZOrder()===14990&&scene.__enemyHealthBars.get(nova.getUniqueId()).background.getZOrder()>icon.getZOrder(),'shield follows exact owner/below HP/projectiles');
const b=make('VoidGolem',1150,600);step();F.apply(b);step();
ok(armor(nova)===10&&rec.baseArmor===0&&rec.expires>oldExpires&&rec.vfx===icon,'two casters refresh10seconds without stacking/duplicate icon');
const refreshed=rec.expires;b.getBehavior('Health').SetHealth(0);step();ok(armor(nova)===10,'instant allied buff persists after caster death');
until(()=>!rec.active,650);ok(armor(nova)===0&&G.frameTime>=refreshed&&!get('VoidFortificationVFX').includes(icon),'refreshed duration expires and removes VFX');
clear();const canceled=make(),ally=make('Basic',950,600);step();canceled.__golemState.nextCast=G.frameTime+.001;step();step(15);const casts=F.casts,gold=v('Money');canceled.getBehavior('Health').SetHealth(0);step(60);
ok(canceled.__golemState.releaseCount===0&&F.casts===casts&&!ally.getVariables().get('VoidFortificationActive').getAsBoolean()&&v('Money')===gold+20,'death before release cancels casting and cannot buff/pay twice');
clear();const base=make();step();F.apply(base);step();base.getVariables().get('Waypoint').setNumber(routeCount);const lives=v('Lives'),money=v('Money');step(2);
ok(!get('Enemy').includes(base)&&v('Lives')===lives-1&&v('Money')===money&&!F.members.has(base.getUniqueId())&&!get('VoidFortificationVFX').length,'base arrival disables casting/buff/VFX/no kill reward');
clear();const crowd=Array.from({length:200},(_,i)=>make(['Basic','VoidHound','VoidGuard','VoidSentinel','VoidBrute','VoidGolem'][i%6],900+i%10*4,600+Math.floor(i/10)*4));step();F.apply(crowd[5]);step();const created=F.createdVFX;
ok(get('VoidFortificationVFX').length===200,'200 recipients use same shared VFX assets');step(100);
ok(F.createdVFX===created&&get('VoidFortificationVFX').length===200,'200 shields are not created every frame');clear();
ok(!F.members.size&&!F.pulses.size&&!G.actors.size&&!get('VoidFortificationVFX').length&&!get('VoidFortificationCastPulse').length&&!scene.__enemyHealthBars.size,'all owned bodies/shields/pulses/bars clean up');
vars.get('IndexOpen').setBoolean(true);step();scene.__unitIndex.category='Monsters';step();scene.__unitIndex.scroll=scene.__unitIndex.maxScroll;step();
ok(scene.__unitIndex.entries.length===6&&scene.__unitIndex.entries[5].Name==='Void Golem'&&get('IndexMonsterImage').some(o=>o.__golemPortraitRig?.visible),'Index preserves five and shows sixth elite cropped portrait');
vars.get('IndexOpen').setBoolean(false);step();ok(scene.__towerShopUI.cards.length===1&&scene.__towerShopUI.cards[0].background.getWidth()===84,'unchanged Star-only small shop');
// Real homing volleys verify existing armor damage and both upgrade paths.
clear();const tank=make('VoidGolem',930,600),tower=scene.createObject('StarCannonTower'),tv=tower.getVariables(),placement=scene.__freePlacement;
placement.positionSprite(tower,'StarCannonTower',800,616);tv.get('FootprintX').setNumber(800);tv.get('FootprintY').setNumber(616);tv.get('FootprintRadius').setNumber(46);tv.get('TowerId').setNumber(991177);step();tower.__starCooldown=100000;
const volley=()=>{tower.__starFacing=star.bearing(tower,tank);ok(star.fire(tower,tank),'actual aligned Golem volley launched');until(()=>!get('StarCannonProjectile').length,100);};
let before=hp(tank);volley();ok(hp(tank)===before-25,'native50 projectile minus base25 armor');F.apply(tank);step();before=hp(tank);volley();ok(hp(tank)===before-15,'native50 projectile minus buffed35 armor');
for(let i=0;i<2;i++)ok(star.upgrade(tower,1),'existing damage tier bought');for(let i=0;i<4;i++)ok(star.upgrade(tower,2),'existing Meteor tier bought');F.apply(tank);step();before=hp(tank);volley();ok(near(hp(tank),before-3),'native2-4 three Meteors respect minimum1 versus35armor');tower.deleteFromScene();clear();
// Lethal native projectile exactly on the release frame must cancel the buff.
const interrupted=make(),nearby=make('Basic',950,600);step();const interruptedState=interrupted.__golemState;interruptedState.nextCast=G.frameTime+.001;step();step(35);
interrupted.getBehavior('Health').SetHealth(1);const projectile=scene.createObject('StarCannonProjectile'),pv=projectile.getVariables();projectile.setAnimationName('Base');projectile.setWidth(40);projectile.setHeight(20);projectile.setPosition(interrupted.getCenterXInScene()-20,interrupted.getCenterYInScene()-10);pv.get('TargetId').setNumber(interrupted.getUniqueId());pv.get('Damage').setNumber(50);pv.get('Speed').setNumber(520);projectile.__starNew=false;projectile.__starHit=false;projectile.__starAge=0;projectile.__starContactHit=true;
const releaseCasts=F.casts;step();ok(interruptedState.dying&&!interruptedState.applied&&F.casts===releaseCasts&&armor(nearby)===0,'lethal homing hit on0.6release frame has death priority');clear();
const accelerated=make();vars.get('WaveMode').setString('ManualFast');step(2);const startClock=G.frameTime;step(1);
ok(near(G.frameTime-startClock,.016667*2),'Elite timers use existing2x game clock');accelerated.__golemState.nextCast=G.frameTime+.001;step();const fastX=accelerated.getX(),fastY=accelerated.getY();step(18);
ok(accelerated.__golemState.applied&&accelerated.__golemState.casting&&accelerated.getX()===fastX&&accelerated.getY()===fastY,'2x release after0.6game seconds without drift');step(6);ok(!accelerated.__golemState.casting,'2x cast finishes after0.8game seconds');clear();vars.get('WaveMode').setString('Waiting');step();
lines.push('ALL VOID GOLEM TESTS PASSED');output.textContent=lines.join('\n');document.title='PASS '+(lines.length-1)+' elite checks';
