step(5);const h=scene.__voidHound,n=scene.__novaWisp,star=scene.__starCannon,p=scene.__freePlacement,near=(a,b)=>Math.abs(a-b)<.0001;
const clear=()=>{for(const name of ['Enemy','NovaWispDeathVisual','StarCannonProjectile','StarCannonImpact'])get(name).slice().forEach(e=>e.deleteFromScene());step();};
const make=(x=800,y=550)=>{const e=scene.createObject('Enemy');e.getVariables().get('EnemyType').setString('VoidHound');h.ensure(e);e.getVariables().get('MoveSpeed').setNumber(0);e.setPosition(x-24,y-24);return e;};
const types=vars.get('EnemyTypes').toJSObject();ok(Object.keys(types).sort().join(',')==='Basic,VoidBrute,VoidGuard,VoidHound,VoidSentinel','exactly five archetypes, original Hound fixed');
ok(h.config.HP===60&&h.config.Speed===135&&h.config.Armor===0&&h.config.Reward===7&&h.config.SpecialAbility==='None'&&h.config.MinimumWave===4,'exact fixed Hound stats/no additional ability');
for(const direction of ['Right','Left','Down','Up']){
 ok(h.config.Views[direction].Frames.length===16,'four states x four atlas poses '+direction);
 for(let row=0;row<4;row++){
  const textures=new Set();for(let col=0;col<4;col++){const t=h.texture(direction,row,col);ok(t.valid&&t.width>0&&t.height>0,'valid cropped atlas frame '+direction+'/'+row+'/'+col);textures.add(t);}
  ok(textures.size===4,'four distinct cached frame textures '+direction+'/'+row);
 }
}
vars.get('Money').setNumber(100000);vars.get('Lives').setNumber(10000);
let e=make();step();ok(e.getBehavior('Health').Health()===60&&e.getBehavior('Health').MaxHealth()===60,'Hound initializes actual Health60');
ok(e.getVariables().get('EnemyType').getAsString()==='VoidHound'&&e.getVariables().get('GoldReward').getAsNumber()===7,'Nova helper never overwrites Hound identity');
const point=vars.get('MonsterPathPoints').getChild(0),old=point.toJSObject(),count=v('MonsterPathPointCount');
for(const [dir,dx,dy] of [['Right',100,0],['Left',-100,0],['Down',0,100],['Up',0,-100]]){
 clear();e=make(900,600);point.getChild('X').setNumber(900+dx);point.getChild('Y').setNumber(600+dy);vars.get('MonsterPathPointCount').setNumber(1);e.getVariables().get('MoveSpeed').setNumber(135);step();
 ok(e.getAnimationName()==='HoundMove_'+dir&&e.getAngle()===0&&!e.isFlippedX(),'genuine directional run without whole-sprite rotation '+dir);
 ok(near(Math.hypot(e.getCenterXInScene()-900,e.getCenterYInScene()-600),135*.016667),'actual movement budget135 '+dir);
 const poses=new Set();for(let i=0;i<24;i++){step();poses.add(e.__houndRig.frame);}ok(poses.size===4,'four articulated run poses play '+dir);
}
point.getChild('X').setNumber(old.X);point.getChild('Y').setNumber(old.Y);vars.get('MonsterPathPointCount').setNumber(count);clear();
e=make();step();const center=[e.getCenterXInScene(),e.getCenterYInScene()],idleFrames=new Set();for(let i=0;i<80;i++){step();idleFrames.add(e.__houndRig.frame);}
ok(idleFrames.size===4&&e.__houndRig.mode==='Idle'&&e.getCenterXInScene()===center[0]&&e.getCenterYInScene()===center[1],'idle breathing/tendril frames loop without collider drift');
ok(e.getHitBoxes().length>0,'living Hound has compact body-only native collision mask');
clear();const t=scene.createObject('StarCannonTower'),tv=t.getVariables();p.positionSprite(t,'StarCannonTower',700,550);tv.get('FootprintX').setNumber(700);tv.get('FootprintY').setNumber(550);tv.get('FootprintRadius').setNumber(46);tv.get('TowerId').setNumber(990001);step();t.__starCooldown=100000;
e=make(840,510);step();t.__starFacing=star.bearing(t,e);const gold=v('Money');ok(star.fire(t,e),'existing Star targeting/fire accepts Void Hound');
for(let i=0;i<60&&e.getBehavior('Health').Health()===60;i++)step();
ok(e.getBehavior('Health').Health()===10&&e.__houndRig.mode==='Hit'&&e.__houndState.hit>0&&v('Money')===gold,'first actual projectile60ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢10 and short hit flash/no reward');
e.getVariables().get('MoveSpeed').setNumber(135);const x=e.getCenterXInScene(),y=e.getCenterYInScene();step();ok(Math.hypot(e.getCenterXInScene()-x,e.getCenterYInScene()-y)>0,'hit does not stop path movement');e.getVariables().get('MoveSpeed').setNumber(0);t.__starFacing=star.bearing(t,e);star.fire(t,e);
for(let i=0;i<60&&!e.__houndState.dying;i++)step();
ok(e.__houndState.dying&&get('Enemy').includes(e)&&v('Money')===gold+7,'death retained until dissolve completes;7Gold awarded once');
ok(e.getHitBoxes().length===0&&!star.targetValid(t,e)&&!scene.__enemyHealthBars.has(e.getUniqueId()),'death disables native collision, targeting and healthbar');
const deathCenter=[e.getCenterXInScene(),e.getCenterYInScene()];step(10);ok(e.getCenterXInScene()===deathCenter[0]&&e.getCenterYInScene()===deathCenter[1],'dead Hound stops movement immediately');
ok(!star.fire(t,e),'existing combat refuses dead target');step(50);ok(!get('Enemy').includes(e)&&v('Money')===gold+7,'death finishes, logical object removed and no duplicate reward');
ok(near(tv.get('DamageDealt').getAsNumber(),60),'actual Hound damage tracked60, overkill excluded');t.deleteFromScene();clear();
e=make();e.getVariables().get('MoveSpeed').setNumber(135);e.getVariables().get('Waypoint').setNumber(count);const lives=v('Lives'),money=v('Money');step();ok(!get('Enemy').includes(e)&&v('Lives')===lives-1&&v('Money')===money,'Hound base escape costs one existing life/no kill reward');
clear();const route=vars.get('MonsterPathPoints').toJSObject();e=make(route[0].X,route[0].Y);e.getVariables().get('MoveSpeed').setNumber(135);const routeGold=v('Money'),routeLives=v('Lives'),directionsSeen=new Set();
for(let i=0;i<4000&&get('Enemy').includes(e);i++){scene.renderAndStep(100);input.onFrameEnded();if(get('Enemy').includes(e))directionsSeen.add(e.getVariables().get('Facing').getAsString());}
ok(!get('Enemy').includes(e)&&v('Lives')===routeLives-1&&v('Money')===routeGold&&directionsSeen.has('Right')&&directionsSeen.has('Left')&&directionsSeen.has('Down'),'complete unchanged82-waypoint zigzag at135 through all bends, one base damage/no reward');
const nova=scene.createObject('Enemy');n.ensure(nova);nova.getVariables().get('MoveSpeed').setNumber(0);step();ok(nova.getBehavior('Health').Health()===100&&nova.__novaRig&&nova.getAnimationName().startsWith('Nova'),'Nova health/animation rig preserved');clear();
vars.get('IndexOpen').setBoolean(true);step();scene.__unitIndex.category='Monsters';step();ok(scene.__unitIndex.entries.length===5&&scene.__unitIndex.entries[1].name==='Void Hound'&&scene.__unitIndex.entries[1].Speed===135,'Index displays canonical Hound stats beside Nova');
const portrait=scene.__unitIndex.cards[1].sprite;ok(portrait.getRendererObject().texture===h.texture('Down',0,0),'Index renders one portrait cell without atlas leakage');vars.get('IndexOpen').setBoolean(false);step();
ok(scene.__towerShopUI.cards.length===1&&scene.__towerShopUI.cards[0].background.getWidth()===84,'small single-Star shop unchanged');
lines.push('ALL VOID HOUND TESTS PASSED');output.textContent=lines.join('\n');document.title='PASS '+(lines.length-1)+' Void Hound checks';
