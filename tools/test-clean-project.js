step(5);const star=scene.__starCannon,p=scene.__freePlacement,shop=scene.__towerShopUI,ob=scene.__obstaclePanel,pick=scene.__worldSelection;
const near=(a,b)=>Math.abs(a-b)<.0001,num=(o,n)=>o.getVariables().get(n).getAsNumber(),sv=vars;
const camera=()=>JSON.stringify([scene.getLayer('').getCameraX(),scene.getLayer('').getCameraY(),scene.getLayer('').getCameraZoom()]);
const route=JSON.stringify(sv.get('MonsterPathPoints').toJSObject()),fixedCamera=camera();
const remove=(...names)=>{for(const n of names)get(n).slice().forEach(o=>o.deleteFromScene());step();};
sv.get('Money').setNumber(100000);const make=(name='StarCannonTower',a=0,b=0)=>{
 const t=scene.createObject(name),v=t.getVariables();p.positionSprite(t,name,700,550);v.get('TowerId').setNumber(9000+t.getUniqueId());v.get('FootprintX').setNumber(700);v.get('FootprintY').setNumber(550);v.get('FootprintRadius').setNumber(p.config(name).Radius);v.get('PurchasePrice').setNumber(300);step();
 if(name==='StarCannonTower'){v.get('Path1Level').setNumber(a);v.get('Path2Level').setNumber(b);star.apply(t);t.__starCooldown=100000;}return t;
};
const enemy=(x,y,hp=1000)=>{const e=scene.createObject('Enemy');scene.__novaWisp.ensure(e);e.setAnimationName('NovaMove_Right');e.setWidth(48);e.setHeight(48);e.setPosition(x-e.getWidth()/2,y-e.getHeight()/2);e.getVariables().get('MoveSpeed').setNumber(0);e.getVariables().get('EnemyType').setString('Normal');e.getVariables().get('GoldReward').setNumber(0);e.getVariables().get('Waypoint').setNumber(0);e.getBehavior('Health').SetMaxHealth(hp);e.getBehavior('Health').SetHealth(hp);return e;};
const health=e=>e.getBehavior('Health').Health();
const close=()=>{sv.get('SelectedTower').setNumber(0);ob.close();step();};
ok(shop.cards.length===1&&p.types.length===1,'one official Star shop card and footprint type');
let states=0;
for(let a=0;a<=4;a++)for(let b=0;b<=4;b++){
 if(a>=3&&b>=3){ok(star.stats(a,b)===null,'invalid crosspath rejected '+a+'_'+b);continue;}
 states++;const t=make('StarCannonTower'),v0=t.getVariables(),anchor=p.center(t),id=t.getUniqueId(),gold=v('Money');
 sv.get('SelectedTower').setNumber(num(t,'TowerId'));step();
 for(let i=0;i<a;i++)clickObject(scene.__selectedPanel.cards[0].background);
 for(let i=0;i<b;i++)clickObject(scene.__selectedPanel.cards[1].background);
 const pair=star.visual(t),key=a+'_'+b,cost=star.config.Paths[0].Upgrades.slice(0,a).reduce((s,u)=>s+u.Cost,0)+star.config.Paths[1].Upgrades.slice(0,b).reduce((s,u)=>s+u.Cost,0);
 ok(pair.Base.getAnimationName()===key&&pair.Turret.getAnimationName()===key&&near(v('Money'),gold-cost),'native upgrade panel buys both component states '+key);
 ok(near(num(t,'Damage'),[50,56,62,62,74][a])&&near(num(t,'AttackRange'),210*(a>=2?1.04:1)*(b>=2?1.04:1))&&near(num(t,'AttackInterval'),.9/[1,1.1,1.22,1.22,1.22][b]),'reviewed damage range cooldown '+key);
 const baseContact=star.componentPoints(t,'Base',[pair.meta.Base.Contact])[0];
 ok(near(baseContact[0],anchor[0])&&near(baseContact[1],anchor[1])&&p.radius(t)===46&&t.getUniqueId()===id&&camera()===fixedCamera,'base contact and canonical footprint stable '+key);
 const range=get('RangeIndicator')[0];ok(near(range.getCenterXInScene(),anchor[0])&&near(range.getCenterYInScene(),anchor[1])&&near(range.getWidth(),num(t,'AttackRange')*2),'range remains centered '+key);
 const target=enemy(840,510,10000);step(70);ok(star.canFire(t,target),'smooth tracking reaches aligned target '+key);
 const rotation=pair.Turret.getAngle();ok(pair.Base.getAngle()===0&&Math.abs(rotation)>1,'base stays still while turret rotates '+key);
 remove('StarCannonProjectile','StarCannonImpact');const count=b>=4?3:b>=3?2:1;
 ok(star.fire(t,target),'aligned volley emitted '+key);const shots=get('StarCannonProjectile'),flashes=get('StarCannonImpact').filter(o=>o.__muzzleFlash);
 ok(shots.length===count&&flashes.length===count&&new Set(shots.map(o=>o.__spawnPoint.join(','))).size===count,'distinct emitter and muzzle flash count '+key);
 ok(shots.every((shot,i)=>{const m=star.muzzle(t,i),flash=flashes[i];return near(shot.getCenterXInScene(),m[0])&&near(shot.getCenterYInScene(),m[1])&&near(flash.getCenterXInScene(),m[0])&&near(flash.getCenterYInScene(),m[1])&&near(num(shot,'Damage'),num(t,'Damage')*(b>=4?.56:b>=3?.62:1));}),'projectiles and flashes at transformed mouths with correct damage fractions '+key);
 step(80);ok(near(10000-health(target),num(t,'Damage')*count*(b>=4?.56:b>=3?.62:1))&&near(num(t,'DamageDealt'),10000-health(target)),'actual volley hits once and accounts damage '+key);
 remove('Enemy','StarCannonProjectile','StarCannonImpact');
 const money=v('Money'),investment=num(t,'TotalInvestment');click(100,638,'SelectedTowerUI');
 ok(!get('StarCannonTower').length&&!get('StarCannonBaseVisual').length&&!get('StarCannonTurretVisual').length&&star.visuals.size===0&&v('Money')===money+Math.floor(investment*7/10),'sell removes pair and refunds once '+key);
}
ok(states===21,'all 21 valid combinations exercised');close();
let t=make(),pair=star.visual(t),last=t.__starFacing;step(20);ok(near(t.__starFacing,last),'no enemy: no idle rotation');
let far=enemy(1200,550);step(20);ok(near(t.__starFacing,last)&&t.__starTargetId===0,'out-of-range enemy never tracked');remove('Enemy');
let first=enemy(600,550),second=enemy(820,550);const before=t.__starFacing;step();
ok(t.__starTargetId===first.getUniqueId()&&Math.abs(star.wrap(t.__starFacing-before))<=240*.017,'nearest acquisition and per-frame shortest-angle cap');
second.setPosition(710-second.getWidth()/2,550-second.getHeight()/2);step(8);ok(t.__starTargetId===first.getUniqueId(),'nearer newcomer does not steal valid lock');
first.setPosition(1600,550);step();ok(t.__starTargetId===second.getUniqueId(),'out-of-range lock switches to valid target');
second.getBehavior('Health').SetHealth(0);step(2);last=t.__starFacing;step(15);ok(t.__starTargetId===0&&near(last,t.__starFacing),'dead lock cleared and turret holds last direction');
remove('Enemy');let target=enemy(810,580);t.__starCooldown=0;t.__starFacing=star.wrap(star.bearing(t,target)+180);step();
ok(!get('StarCannonProjectile').length&&!star.canFire(t,target),'misaligned cannon cannot fire');step(70);ok(get('StarCannonProjectile').length>0||health(target)<1000,'aligned cannon resumes autonomous firing');
remove('Enemy','StarCannonProjectile','StarCannonImpact','StarCannonTower');
// Direct splash excludes primary and applies the reviewed fractions and radii.
for(const a of [3,4]){
 t=make('StarCannonTower',a,0);target=enemy(840,510,10000);const adjacent=enemy(860,510,10000),outside=enemy(1100,510,10000);step(70);star.fire(t,target);step(80);
 ok(near(10000-health(target),num(t,'Damage'))&&near(10000-health(adjacent),num(t,'Damage')*(a===3?.25:.4))&&health(outside)===10000,'reviewed direct and splash damage/radius Lv'+a);
 remove('Enemy','StarCannonProjectile','StarCannonImpact','StarCannonTower');
}
// Very close target: show each muzzle shot, then contact-hit without reversing its heading.
t=make('StarCannonTower',4,0);const pivot=star.componentTransform(t,'Turret');target=enemy(pivot.x,pivot.y-45,1000);t.__starFacing=star.bearing(t,target);star.fire(t,target);
let contact=get('StarCannonProjectile')[0];ok(contact&&contact.__starContactHit,'near-barrel contact shot detected without adding a minimum range');const heading=contact.getAngle();step();ok(contact.getAngle()===heading&&health(target)===1000,'contact projectile keeps barrel heading during visible muzzle frame');step();ok(near(1000-health(target),74)&&!get('StarCannonProjectile').length,'contact resolves reviewed damage once without backward travel');remove('Enemy','StarCannonProjectile','StarCannonImpact','StarCannonTower');
const speedCheck=mode=>{t=make();target=enemy(840,510,100000);sv.get('WaveMode').setString(mode);t.__starCooldown=100000;step(70);const face=star.bearing(t,target);t.__starFacing=star.wrap(face+100);const old=t.__starFacing;step();const delta=Math.abs(star.wrap(t.__starFacing-old));remove('Enemy','StarCannonTower');return delta;};
const one=speedCheck('Manual'),two=speedCheck('ManualFast');ok(two>one*1.9&&two<one*2.1,'240-degree rotation follows existing 2x game clock');sv.get('WaveMode').setString('Waiting');step();
// All visual silhouettes select the owning tower, independent of logical 64px bounds.
for(const name of p.types){
 t=make(name);close();const conf=p.config(name);let points;
 if(name==='StarCannonTower')points=star.componentPoints(t,'Base',[[.5,.78]]);
 else {const hull=pick.geometry[name][t.getAnimationName()].Hull;points=pick.spritePoints(t,conf.RenderScale,[[hull.reduce((s,q)=>s+q[0],0)/hull.length,hull.reduce((s,q)=>s+q[1],0)/hull.length]]);}
 click(...points[0]);ok(sv.get('SelectedTower').getAsNumber()===num(t,'TowerId'),'visible base/body selection '+name);
 if(name==='StarCannonTower'){
  close();t.__starFacing=130;step();click(...star.muzzle(t,0));ok(sv.get('SelectedTower').getAsNumber()===num(t,'TowerId'),'rotated visible star muzzle selects owner');
 }
 close();const [x,y]=p.center(t),radius=p.radius(t);let empty;
 for(let i=0;i<360;i++){const a=i*Math.PI/180,q=[x+radius*.98*Math.cos(a),y+radius*.98*Math.sin(a)];if(!pick.towerHit(t,...q)){empty=q;break;}}
 ok(!!empty,'selection silhouette excludes empty footprint area '+name);click(...empty);ok(v('SelectedTower')===0,'empty outer footprint never selects '+name);
 remove(name);close();
}
ob.classify();const solids=get('Ground_Decoration').filter(o=>o.getVariables().get('Blocking').getAsBoolean()),removable=solids.filter(o=>o.getVariables().get('EnvironmentCategory').getAsString()==='RemovableObstacle');
ok(removable.length===12&&solids.length===13,'12 interior solid obstacles removable; edge crystal permanent');
ok(get('Ground_Decoration').filter(o=>o.getVariables().get('Kind').getAsString()==='Shrub').every(o=>o.getVariables().get('EnvironmentCategory').getAsString()==='PermanentEnvironment'),'nonblocking foliage never sold as a clearable blocker');
ok(['SpawnMarker','BaseMarker','Monster_Path','IslandCliffFrame','VoidBackdrop'].every(n=>get(n).every(o=>o.getVariables().get('EnvironmentCategory').getAsString()==='PermanentEnvironment')),'spawn base road cliffs and cosmic background permanent');
const permanent=solids.find(o=>o.getVariables().get('EnvironmentCategory').getAsString()==='PermanentEnvironment');clickObject(permanent);ok(v('SelectedObstacleId')===0,'edge crystal click cannot open Clear');
// Choose a real interior owner whose cleared space admits a tower circle.
let obstacle,free;for(const o of removable){const old=p.blockers;p.blockers=old.filter(b=>b.owner!==o);const c=p.blockedCircle(o);
 for(let y=c.y-45;y<=c.y+45&&!free;y+=5)for(let x=c.x-45;x<=c.x+45;x+=5)if(p.validate('StarCannonTower',x,y).valid){obstacle=o;free=[x,y];break;}
 p.blockers=old;if(free)break;}
ok(!!obstacle,'real removable owner has usable cleared floor');const id=obstacle.getUniqueId(),otherIds=p.blockers.filter(b=>b.owner!==obstacle).map(b=>b.owner.getUniqueId());
clickObject(obstacle);ok(ob.owner()===obstacle&&scene.getLayer('ObstacleUI').isVisible()&&v('SelectedTower')===0,'normal click opens themed Clear panel without deleting');
const price=v('Money');click(142,194,'ObstacleUI');ok(!ob.owner()&&get('Ground_Decoration').includes(obstacle)&&v('Money')===price,'Cancel keeps obstacle and gold');
clickObject(obstacle);click(256,26,'ObstacleUI');ok(!ob.owner()&&v('Money')===price,'X closes without charge');
sv.get('Money').setNumber(249);clickObject(obstacle);click(142,151,'ObstacleUI');ok(ob.owner()===obstacle&&v('Money')===249&&ob.message==='INSUFFICIENT GOLD','insufficient gold retains visual blocker and shows message');
sv.get('Money').setNumber(1000);click(142,151,'ObstacleUI');ok(!get('Ground_Decoration').includes(obstacle)&&!ob.owner()&&v('Money')===750&&!scene.__blockedBuildRings.has(id),'clear charges exactly 250 and removes owned object/ring/selection');
ok(!p.blockers.some(b=>b.owner.getUniqueId()===id)&&otherIds.every(id=>p.blockers.some(b=>b.owner.getUniqueId()===id)),'only selected owner blocker removed');
click(142,151,'ObstacleUI');ok(v('Money')===750,'second Clear-position click cannot charge again');
ok(p.validate('StarCannonTower',...free).valid,'cleared circle available if no other blockers');clickObject(shop.cards[0].background);click(...free);ok(get('StarCannonTower').length===1&&v('Money')===750-sv.get('TowerShopCatalog').toJSObject()[0].Cost,'actual purchase builds in cleared space at unchanged catalog price');remove('StarCannonTower');close();
const next=removable.find(o=>get('Ground_Decoration').includes(o));clickObject(shop.cards[0].background);const gold=v('Money');clickObject(next);ok(p.active&&!ob.owner()&&v('Money')===gold&&!sv.get('PlacementValid').getAsBoolean(),'builder obstacle click stays invalid and cannot open Clear');p.stop();step();
const overlapping=scene.createObject('Ground_Decoration');overlapping.setAnimationName(next.getAnimationName());overlapping.setWidth(next.getWidth());overlapping.setHeight(next.getHeight());overlapping.setPosition(next.getX(),next.getY());overlapping.getVariables().get('Kind').setString(next.getVariables().get('Kind').getAsString());overlapping.getVariables().get('LocalScale').setNumber(next.getVariables().get('LocalScale').getAsNumber());step();
ob.select(next);sv.get('Money').setNumber(1000);const c=p.blockedCircle(next);click(142,151,'ObstacleUI');ok(p.blockers.some(b=>b.owner===overlapping)&&p.validate('StarCannonTower',c.x,c.y).reason==='obstacle','overlapping other owner remains blocked after clear');overlapping.deleteFromScene();step();
ok(camera()===fixedCamera&&JSON.stringify(sv.get('MonsterPathPoints').toJSObject())===route,'clear selection build and combat never shift camera or route');
// Input priority and mutually exclusive panels on deliberately overlapping visual fixtures.
const remaining=get('Ground_Decoration').find(o=>o.getVariables().get('EnvironmentCategory').getAsString()==='RemovableObstacle');
t=make();const oc=p.blockedCircle(remaining);t.getVariables().get('FootprintX').setNumber(oc.x);t.getVariables().get('FootprintY').setNumber(oc.y);star.apply(t);step();close();
const basePick=star.componentPoints(t,'Base',[[.5,.78]])[0];click(...basePick);ok(v('SelectedTower')===num(t,'TowerId')&&!ob.owner(),'tower visual selection takes priority over underlying obstacle');
ob.select(remaining);step();ok(v('SelectedTower')===0&&!scene.__selectedPanel.tower,'obstacle selection closes tower upgrade panel');
const balance=v('Money'),beforeCount=get('StarCannonTower').length;click(40,84,'ObstacleUI');ok(ob.owner()===remaining&&get('StarCannonTower').length===beforeCount&&v('Money')===balance,'panel body click is consumed without map selection or placement');
input.onKeyPressed(27);step();input.onKeyReleased(27);step();ok(!ob.owner(),'Escape closes Clear panel');
ob.select(remaining);step();sv.get('IndexOpen').setBoolean(true);step();ok(!ob.owner()&&sv.get('IndexBlocksInput').getAsBoolean(),'Index closes Clear and blocks map input');sv.get('IndexOpen').setBoolean(false);step();
remove('StarCannonTower');close();ob.select(remaining);step();click(1600,600);ok(!ob.owner()&&v('SelectedTower')===0,'empty ground closes obstacle and tower selection');
ok(get('StarCannonBaseVisual').length===0&&get('StarCannonTurretVisual').length===0,'no leaked component objects after priority fixtures');
vars.get('IndexOpen').setBoolean(true);step();scene.__unitIndex.category='Towers';step();ok(scene.__unitIndex.entries.length===1&&scene.__unitIndex.entries[0].type==='StarCannonTower'&&scene.__unitIndex.entries[0].price===300,'Index one official Star entry with300 price');ok(Object.keys(scene.__unitIndex.objects).filter(k=>/^starUpgrade[01][0-3]$/.test(k)).length===8,'Index retains all eight Star upgrade icons');scene.__unitIndex.category='Monsters';step();ok(scene.__unitIndex.entries.length===6&&scene.__unitIndex.entries[0].name==='Nova Wisp'&&scene.__unitIndex.entries[1].name==='Void Hound','Index preserves Nova/Hound plus four Void archetypes');vars.get('IndexOpen').setBoolean(false);step();ok(shop.scrollMax===0&&get('TileType_Button').length===1&&get('AssetCardPanel').length===1&&shop.cards[0].background.getWidth()===84&&shop.cards[0].background.getHeight()===112&&shop.cards[0].background.getX()===1168&&shop.cards[0].price.getString()==='300'&&!shop.guide&&get('ShopScrollTrack').length===1&&get('ShopScrollThumb').length===1,'single small first card in original two-column shop, no empty cards or upgrade guide, price300');
lines.push('ALL TURRET / SELECTION / OBSTACLE TESTS PASSED');output.textContent=lines.join('\n');document.title='PASS '+(lines.length-1)+' checks';
