step(5);
const star=scene.__starCannon,nova=scene.__novaWisp,near=(a,b)=>Math.abs(a-b)<1e-5;
const types=['Basic','VoidHound','VoidGuard','VoidSentinel','VoidBrute'],widths={Basic:24,VoidHound:30,VoidGuard:30,VoidSentinel:26,VoidBrute:36};
const clear=()=>{get('Enemy').slice().forEach(e=>e.deleteFromScene());get('NovaWispDeathVisual').slice().forEach(e=>e.deleteFromScene());step(2);};
const make=(type,x=900,y=600)=>{const e=scene.createObject('Enemy');e.getVariables().get('EnemyType').setString(type);nova.ensure(e);e.getVariables().get('MoveSpeed').setNumber(0);e.setPosition(x-24,y-24);return e;};
const objectsPresent=pair=>get('HealthBarBackground').includes(pair.background)&&get('HealthBarFill').includes(pair.fill);
const original=vars.get('MonsterPathPoints').toJSObject(),routeCount=v('MonsterPathPointCount');
vars.get('Money').setNumber(100000);vars.get('Lives').setNumber(10000);
for(const type of types){
 clear();const e=make(type);step();const health=e.getBehavior('Health'),id=e.getUniqueId(),pair=scene.__enemyHealthBars.get(id);
 ok(!!pair&&objectsPresent(pair)&&pair.background.getVariables().get('OwnerEnemyId').getAsNumber()===id&&pair.fill.getVariables().get('OwnerEnemyId').getAsNumber()===id,'spawn creates independently owned pair '+type);
 for(const ratio of [1,.75,.61,.6,.5,.3,.25,.001,1.2]){
  health.SetMaxHealth(10000);health.SetHealth(10000*ratio);step();
  const expected=Math.min(1,ratio),color=expected>.6?'93;203;123':expected>=.3?'239;192;70':'235;84;96';
  ok(pair.background.getWidth()===widths[type]&&pair.background.getHeight()===6&&near(pair.fill.getWidth(),(widths[type]-2)*expected),'fixed width/accurate fill independent of HP '+type+'/'+ratio);
  ok(pair.fill.getColor()===color&&!pair.fill.isHidden()&&pair.background.getZOrder()===20000&&pair.fill.getZOrder()===20001,'visible compact threshold colors/above world '+type+'/'+ratio);
 }
 health.SetMaxHealth(100);health.SetHealth(100);const point=vars.get('MonsterPathPoints').getChild(0);vars.get('MonsterPathPointCount').setNumber(1);
 for(const [dir,dx,dy]of [['Up',0,-300],['Down',0,300],['Left',-300,0],['Right',300,0]]){
  e.setPosition(900-24,600-24);e.getVariables().get('Waypoint').setNumber(0);e.getVariables().get('MoveSpeed').setNumber(70);point.getChild('X').setNumber(900+dx);point.getChild('Y').setNumber(600+dy);step(5);
  ok(e.getVariables().get('Facing').getAsString()===dir&&near(pair.background.getX()+widths[type]/2,e.getCenterXInScene())&&near(pair.background.getY()+6,e.getCenterYInScene()-scene.__enemyHealthBarState.config.Types[type].HeadOffset),'follows native movement and facing '+type+'/'+dir);
  const br=pair.background.getRendererObject().getBounds(),body=(type==='VoidHound'?e.__houndRig.body:e.getRendererObject()).getBounds();
  ok(br.y+br.height<body.y+1,'bar stays above rendered head '+type+'/'+dir);
 }
 e.getVariables().get('MoveSpeed').setNumber(0);vars.get('MonsterPathPointCount').setNumber(routeCount);original.forEach((p,i)=>{const q=vars.get('MonsterPathPoints').getChild(i);q.getChild('X').setNumber(p.X);q.getChild('Y').setNumber(p.Y);});
 const created=scene.__enemyHealthBarState.createdPairs;step(80);ok(scene.__enemyHealthBarState.createdPairs===created,'no per-frame healthbar allocations '+type);
 e.setLayer('UI');step();ok(pair.background.getLayer()==='UI'&&pair.fill.getLayer()==='UI','bar follows owner layer '+type);e.setLayer('');step();
 pair.fill.deleteFromScene();step(2);const repaired=scene.__enemyHealthBars.get(id);
 ok(repaired!==pair&&objectsPresent(repaired)&&e.destroyCallbacks.has(repaired.cleanup)&&!e.destroyCallbacks.has(pair.cleanup),'external bar deletion repairs pair/removes stale callback '+type);
 e.getVariables().get('Waypoint').setNumber(routeCount);e.getVariables().get('MoveSpeed').setNumber(80);const lives=v('Lives'),gold=v('Money');step(2);
 ok(!get('Enemy').includes(e)&&!scene.__enemyHealthBars.has(id)&&v('Lives')===lives-1&&v('Money')===gold,'base cleanup/no orphan or kill reward '+type);
}
// Exact production failure: old corpse survives while its freed native bars are pooled.
for(const type of types.filter(t=>t!=='Basic')){
 clear();const corpse=make(type);step();const old=scene.__enemyHealthBars.get(corpse.getUniqueId());corpse.getBehavior('Health').SetHealth(0);step(3);
 ok(!corpse.destroyCallbacks.has(old.cleanup)&&!scene.__enemyHealthBars.has(corpse.getUniqueId()),'logical death unregisters bar callback before corpse expires '+type);
 const live=make('Basic',800,600);step(2);const pair=scene.__enemyHealthBars.get(live.getUniqueId());
 ok(old.background===pair.background||old.fill===pair.fill,'native pool actually reused deleted bar '+type);
 step(50);ok(get('Enemy').includes(live)&&objectsPresent(pair)&&scene.__enemyHealthBars.get(live.getUniqueId())===pair,'old corpse cannot delete recycled living enemy bars '+type);
}
clear();const crowd=Array.from({length:200},(_,i)=>make(types[i%5],300+i%25*50,350+Math.floor(i/25)*70));step(2);
ok(scene.__enemyHealthBars.size===200&&get('HealthBarBackground').length===200&&get('HealthBarFill').length===200,'200 enemies /200 independent native pairs');
const created=scene.__enemyHealthBarState.createdPairs;step(100);
ok(scene.__enemyHealthBarState.createdPairs===created&&crowd.every(e=>objectsPresent(scene.__enemyHealthBars.get(e.getUniqueId()))),'200 owners remain visible without object creation each frame');
clear();ok(!scene.__enemyHealthBars.size&&!get('HealthBarFill').length&&!get('HealthBarBackground').length,'200-owner deletion leaves no orphan bars');
for(const type of ['VoidGuard','VoidBrute']){
 const e=make(type);step();const health=e.getBehavior('Health'),before=health.Health();star.deal(null,e,.1);step();
 ok(near(health.Health(),before-1),'positive sub-armor damage has minimum1 '+type);
 const hp=health.Health();star.deal(null,e,0);star.deal(null,e,-10);star.deal(null,e,NaN);step();ok(near(health.Health(),hp),'invalid/zero damage cannot create phantom hits '+type);clear();
}
ok(star.valid(4,2)&&star.valid(2,4)&&!star.valid(3,3)&&!star.valid(4,3)&&!star.valid(4,4),'all specialization restrictions retained');
const beforeMoney=v('Money'),tower=scene.createObject('StarCannonTower'),tv=tower.getVariables();scene.__freePlacement.positionSprite(tower,'StarCannonTower',800,352);tv.get('FootprintX').setNumber(800);tv.get('FootprintY').setNumber(352);tv.get('TowerId').setNumber(987654);step();
for(let i=0;i<4;i++)ok(star.upgrade(tower,1),'buy Path1 tier '+(i+1));for(let i=0;i<2;i++)ok(star.upgrade(tower,2),'buy Path2 cross tier '+(i+1));
ok(near(beforeMoney-v('Money'),4770)&&tv.get('TotalInvestment').getAsNumber()===5070,'4-2 native costs/investment exactly5070 including300 purchase');
const money=v('Money');ok(!star.upgrade(tower,2)&&!star.upgrade(tower,1)&&v('Money')===money,'locked/max upgrade cannot charge gold');
tower.deleteFromScene();step();
lines.push('ALL HEALTHBAR BALANCE TESTS PASSED');output.textContent=lines.join('\n');document.title='PASS '+(lines.length-1)+' HP/balance checks';
