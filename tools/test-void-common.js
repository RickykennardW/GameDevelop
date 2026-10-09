step(5);const c=scene.__voidCommon,n=scene.__novaWisp,h=scene.__voidHound,star=scene.__starCannon,p=scene.__freePlacement,near=(a,b)=>Math.abs(a-b)<.0001;
const stats=vars.get('EnemyTypes').toJSObject(),data=game.getSceneAndExtensionsData('Game Scene').sceneData;
const expected={VoidGuard:[150,70,10,8,6],VoidSentinel:[120,85,0,6,5],VoidBrute:[220,60,15,10,7]};
const clear=()=>{for(const name of ['Enemy','NovaWispDeathVisual','StarCannonProjectile','StarCannonImpact'])get(name).slice().forEach(e=>e.deleteFromScene());step();};
const make=(type,x=900,y=600,dir='Right')=>{const e=scene.createObject('Enemy');e.getVariables().get('EnemyType').setString(type);c.ensure(e);e.setPosition(x-24,y-24);e.getVariables().get('Facing').setString(dir);e.getVariables().get('MoveSpeed').setNumber(0);c.setAnimation(e,'Idle_');return e;};
ok(Object.keys(stats).sort().join(',')==='Basic,VoidBrute,VoidGolem,VoidGuard,VoidHound,VoidSentinel','exactly six enemy types, three additions only');
ok(Object.keys(c.configs).length===3&&stats.Basic.HP===100&&stats.VoidHound.HP===60&&stats.VoidHound.Speed===135,'old Nova/Hound fixed stats preserved');
vars.get('Money').setNumber(100000);vars.get('Lives').setNumber(10000);
const point=vars.get('MonsterPathPoints').getChild(0),old=point.toJSObject(),count=v('MonsterPathPointCount');
for(const [type,[HP,speed,armor,reward,minWave]] of Object.entries(expected)){
 ok(stats[type].HP===HP&&stats[type].Speed===speed&&stats[type].Armor===armor&&stats[type].Reward===reward&&stats[type].MinimumWave===minWave&&stats[type].SpecialAbility==='None','exact stats/no abilities '+type);
 const animations=data.objects.find(o=>o.name==='Enemy').animations.filter(a=>a.name.startsWith(type));
 ok(animations.length===16&&animations.every(a=>!/attack|laser|bash|swing/i.test(a.name)&&a.directions[0].sprites.length===4),'sixteen native states/four actual frames/no attacks '+type);
 for(const [dir,dx,dy] of [['Up',0,-300],['Down',0,300],['Left',-300,0],['Right',300,0]]){
  clear();let e=make(type,900,600,dir);step();const collider=[e.getCenterXInScene(),e.getCenterYInScene()],idle=new Set();
  for(let i=0;i<100;i++){step();idle.add(e.getAnimationFrame());}
  ok(e.getAnimationName()===type+'Idle_'+dir&&idle.size===4,'four-frame native idle loop '+type+'/'+dir);
  ok(e.getWidth()===48&&e.getHeight()===48&&near(e.getCenterXInScene(),collider[0])&&near(e.getCenterYInScene(),collider[1]),'idle origin/collider stable '+type+'/'+dir);
  point.getChild('X').setNumber(900+dx);point.getChild('Y').setNumber(600+dy);vars.get('MonsterPathPointCount').setNumber(1);e.getVariables().get('Waypoint').setNumber(0);e.getVariables().get('MoveSpeed').setNumber(speed);step();
  ok(e.getAnimationName()===type+'Move_'+dir&&e.getAngle()===0&&!e.isFlippedX(),'correct actual view without rotation/mirror '+type+'/'+dir);
  ok(near(Math.hypot(e.getCenterXInScene()-900,e.getCenterYInScene()-600),speed*.016667),'exact movement speed/origin after direction swap '+type+'/'+dir);
  const move=new Set();for(let i=0;i<80;i++){step();move.add(e.getAnimationFrame());}
  ok(move.size===4,'native four-phase walking/floating '+type+'/'+dir);e.getVariables().get('MoveSpeed').setNumber(0);
  const money=v('Money'),before=e.getBehavior('Health').Health();e.getBehavior('Health').Hit(50,false,true);step();
  ok(e.getBehavior('Health').Health()===before-(50-armor)&&e.getAnimationName()===type+'Hit_'+dir,'existing Health armor and native Hit '+type+'/'+dir);
  const hit=new Set();for(let i=0;i<14;i++){if(e.getAnimationName().includes('Hit_'))hit.add(e.getAnimationFrame());step();}
  ok(hit.size===4&&e.getAnimationName()===type+'Idle_'+dir,'short four-frame hit recovers '+type+'/'+dir);
  e.getBehavior('Health').SetHealth(0);step();const deathCenter=[e.getCenterXInScene(),e.getCenterYInScene()],death=new Set();
  ok(e.getAnimationName()===type+'Death_'+dir&&e.getHitBoxes().length===0&&v('Money')===money+reward,'death mask disabled and one exact reward '+type+'/'+dir);
  for(let i=0;i<60&&get('Enemy').includes(e);i++){death.add(e.getAnimationFrame());ok(near(e.getCenterXInScene(),deathCenter[0])&&near(e.getCenterYInScene(),deathCenter[1]),'dead collider never moves '+type+'/'+dir+'/'+i);step();}
  ok(death.size===4&&!get('Enemy').includes(e)&&v('Money')===money+reward&&!c.actors.has(e.getUniqueId()),'four death frames, cleanup and no duplicate reward '+type+'/'+dir);
 }
 point.getChild('X').setNumber(old.X);point.getChild('Y').setNumber(old.Y);vars.get('MonsterPathPointCount').setNumber(count);clear();
 // Real existing Star projectiles, using public Health armor rather than a new damage formula.
 const t=scene.createObject('StarCannonTower'),tv=t.getVariables();p.positionSprite(t,'StarCannonTower',700,550);tv.get('FootprintX').setNumber(700);tv.get('FootprintY').setNumber(550);tv.get('FootprintRadius').setNumber(46);tv.get('TowerId').setNumber(991000+t.getUniqueId());step();t.__starCooldown=100000;
 const e=make(type,840,510),money=v('Money');step();let before=HP,hits=0;
 while(!e.__voidCommonState.dying&&hits<10){t.__starFacing=star.bearing(t,e);ok(star.fire(t,e),'actual Star volley '+type+'/'+hits);for(let i=0;i<60&&e.getBehavior('Health').Health()===before;i++)step();const after=Math.max(0,e.getBehavior('Health').Health());ok(after===Math.max(0,before-(50-armor)),'actual armored projectile damage '+type+'/'+hits);before=after;hits++;}
 ok(e.__voidCommonState.dying&&near(tv.get('DamageDealt').getAsNumber(),HP)&&v('Money')===money+reward,'Star tracks actual HP damage and exact reward '+type);
 step(60);ok(!get('Enemy').includes(e),'Star kill finishes native death '+type);t.deleteFromScene();clear();
 // Every new type follows the complete existing82-waypoint route at its own speed.
 const route=vars.get('MonsterPathPoints').toJSObject(),actor=make(type,route[0].X,route[0].Y);actor.getVariables().get('MoveSpeed').setNumber(speed);const lives=v('Lives'),gold=v('Money'),dirs=new Set();
 for(let i=0;i<5000&&get('Enemy').includes(actor);i++){scene.renderAndStep(100);input.onFrameEnded();if(get('Enemy').includes(actor))dirs.add(actor.getVariables().get('Facing').getAsString());}
 ok(!get('Enemy').includes(actor)&&v('Lives')===lives-1&&v('Money')===gold&&dirs.has('Left')&&dirs.has('Right')&&dirs.has('Down'),'entire82-waypoint zigzag/base rule '+type);
}
clear();ok(c.actors.size===0&&scene.__enemyHealthBars.size===0,'no leaked common actors/owned healthbars after lifecycle tests');
vars.get('IndexOpen').setBoolean(true);step();scene.__unitIndex.category='Monsters';step();ok(scene.__unitIndex.entries.length===6&&scene.__unitIndex.entries.every(e=>e.HP>0),'Index has exactly six nonempty canonical entries');vars.get('IndexOpen').setBoolean(false);step();
ok(scene.__towerShopUI.cards.length===1&&scene.__towerShopUI.cards[0].background.getWidth()===84,'original small single-Star shop unchanged');
lines.push('ALL VOID COMMON TESTS PASSED');output.textContent=lines.join('\n');document.title='PASS '+(lines.length-1)+' common enemy checks';
