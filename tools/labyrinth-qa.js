// Exercise the authored centerline, native placement and movement in GDevelop.
(() => {
 const game=testGame,scene=game.getSceneStack().getCurrentScene(),vars=scene.getVariables(),input=game.getInputManager();
 game.pause(true);
 const step=(n=1,ms=16.667)=>{for(let i=0;i<n;i++){scene.renderAndStep(ms);input.onFrameEnded();}};
 step(5);
 const get=name=>scene.getObjects(name),shop=scene.__towerShopUI,map=scene.getLayer('');
 const level=shop.level,p=scene.__freePlacement,checks=[];
 const ok=(condition,message)=>{if(!condition)throw Error(message);checks.push(message);};
 const road=get('Monster_Path')[0],points=vars.get('MonsterPathPoints').toJSObject();
 const near=(a,b,t=.01)=>Math.abs(a-b)<t;
 const n=name=>vars.get(name).getAsNumber();
 const move=(x,y,layer='')=>{input.onMouseMove(...scene.getLayer(layer).convertInverseCoords(x,y,0,[0,0]));step(2);};
 const click=(x,y,layer='')=>{move(x,y,layer);input.onMouseButtonPressed(0);step(2);input.onMouseButtonReleased(0);step(2);};
 const clickObject=o=>click(o.getCenterXInScene(),o.getCenterYInScene(),o.getLayer());
 const center=o=>[o.getCenterXInScene(),o.getCenterYInScene()];
 const mode=globalThis.BALANCE_MODE||'visual';
 ok(!!road&&get('Monster_Path').length===1&&road.getAnimationName()==='Labyrinth'&&road.getRendererObject().texture.valid,'Native road uses the rendered ivory labyrinth');
 ok(level.width===32&&level.turns===16&&n('MonsterPathPointCount')===points.length&&JSON.stringify(points)===JSON.stringify(level.points),'32 px artwork, waypoints and footprint share one layout');
 ok(level.spawn.join()==='132,220'&&level.base.join()==='132,1012'&&center(get('SpawnMarker')[0]).join()===level.spawn.join()&&center(get('BaseMarker')[0]).join()===level.base.join(),'Both portals retain their gameplay anchors');
 ok(level.surface.left===72&&level.surface.top===64&&level.surface.right===1776&&level.surface.bottom===1072,'Original top surface and cliff anchors');
 ok(p.pathOverlaps(900,112,0)&&!p.pathOverlaps(900,112.02,0),'Straight path edge is exactly 16 px from center on each side');
 const terrain=get('Ground_Decoration'),nonBlocking=terrain.filter(o=>!o.getVariables().get('Blocking').getAsBoolean());
 ok(terrain.length===28&&nonBlocking.length>0&&nonBlocking.every(o=>!p.blockers.some(b=>b.owner===o)),'Existing foliage remains non-blocking');
 ok(p.blockers.filter(b=>b.owner.getName()==='Ground_Decoration').every(b=>!p.pathOverlaps(b.x,b.y,b.r)),'All authored obstacle circles clear the route');
 const rows=level.rows.slice(0,-1).map((row,i)=>(row+level.rows[i+1])/2);
 const candidates=(type,left=280,right=1560)=>{
  const spots=[];
  for(const y of rows)for(let x=left;x<=right;x+=16)if(p.validate(type,x,y,{cost:0}).valid)spots.push([x,y]);
  return spots;
 };
 const available=Object.fromEntries(p.towerTypes.map(type=>[type,candidates(type).length]));
 ok(Object.values(available).every(count=>count>40),'Every normal and Evolution footprint has room in multiple corridors');
 if(mode==='visual'||mode==='resize'){
  const bounds=shop.mapBounds,frame=shop.gameArea.frame,a=map.convertInverseCoords(bounds.left,bounds.top,0,[0,0]),b=map.convertInverseCoords(bounds.right,bounds.bottom,0,[0,0]);
  const w=game.getGameResolutionWidth(),h=game.getGameResolutionHeight();
  ok(a[0]>=frame.left-.1&&a[1]>=frame.top-.1&&b[0]<=frame.right+.1&&b[1]<=frame.bottom+.1&&b[0]<shop.gameArea.sidebarX,'World and preserved cliffs stay out of the sidebar');
  const hud=center(get('HUDPanel')[0]),hudScreen=scene.getLayer('UI').convertInverseCoords(...hud,0,[0,0]);
  ok(hudScreen[0]>0&&hudScreen[0]<shop.gameArea.right&&hudScreen[1]>0&&hudScreen[1]<h,'Existing HUD stays in its screen-space safe area');
  const box=game.getRenderer().getCanvas().getBoundingClientRect();
  return {checks,available,length:level.length,waypoints:points.length,viewport:[w,h],canvas:[box.width,box.height],zoom:map.getCameraZoom()};
 }
 const moveSpeed=e=>e.getVariables().get('MoveSpeed').getAsNumber();
 if(mode==='movement'){
  const kinds=Object.keys(vars.get('EnemyTypes').toJSObject());
  vars.get('Lives').setNumber(50);
  clickObject(get('ShopPlayButton')[0]);
  const wave=scene.__waveManager,original=wave.queue.length;
  ok(n('Wave')===1&&original===20&&wave.index===0,'Native Play starts the original twenty-enemy wave');
  wave.queue.push(...kinds,'Basic','Basic');
  vars.get('EnemiesToSpawn').setNumber(wave.queue.length);
  const total=wave.queue.length,tail=new Array(points.length).fill(0),records=new Map();
  for(let i=points.length-2;i>=0;i--)tail[i]=tail[i+1]+Math.hypot(points[i].X-points[i+1].X,points[i].Y-points[i+1].Y);
  const escaped=[];
  let frames=0,elapsed=0;
  for(;frames<6500&&escaped.length<total;frames++){
   step(1,80);
   elapsed+=gdjs.evtTools.runtimeScene.getElapsedTimeInSeconds(scene);
   for(const enemy of get('Enemy')){
    const v=enemy.getVariables(),uid=enemy.getUniqueId(),type=v.get('EnemyType').getAsString();
    const waypoint=v.get('Waypoint').getAsNumber(),xy=center(enemy);
    const target=points[waypoint],previous=points[Math.max(0,waypoint-1)];
    if(!target)continue;
    const next=[target.X,target.Y],last=[previous.X,previous.Y];
    if(p.segment(...xy,last,next)>.025)throw Error(type+' anchor off route near waypoint '+waypoint);
    const remaining=tail[waypoint]+Math.hypot(xy[0]-next[0],xy[1]-next[1]);
    const record=records.get(uid);
    if(!record){
     if(Math.hypot(xy[0]-level.spawn[0],xy[1]-level.spawn[1])>moveSpeed(enemy)*.082+.01)throw Error('Enemy skipped the spawn portal');
     records.set(uid,{type,remaining,waypoint,speed:moveSpeed(enemy)});
     const finish=()=>{
      escaped.push({type,waypoint:v.get('Waypoint').getAsNumber(),position:center(enemy),finished:v.get('PathFinished').getAsBoolean()});
      enemy.unregisterDestroyCallback(finish);
     };
     enemy.registerDestroyCallback(finish);
     if(records.size===total-1)v.get('MoveSpeed').setNumber(moveSpeed(enemy)*.65);
     if(records.size===total)v.get('MoveSpeed').setNumber(moveSpeed(enemy)*1.5);
    }else{
     if(waypoint<record.waypoint||remaining>record.remaining+.025||record.remaining-remaining>Math.max(record.speed,moveSpeed(enemy))*.082+.04)throw Error(type+' skipped or reversed a route segment');
     Object.assign(record,{remaining,waypoint,speed:moveSpeed(enemy)});
    }
   }
  }
  ok(records.size===total&&kinds.every(kind=>[...records.values()].some(r=>r.type===kind)),'Full wave and all six archetypes traversed the route');
  const valid=escaped.length===total&&n('Lives')===50-total&&escaped.every(e=>e.finished&&e.waypoint===points.length&&Math.hypot(e.position[0]-level.base[0],e.position[1]-level.base[1])<.025);
  if(!valid)throw Error('Finish diagnostics '+JSON.stringify({frames,elapsed,lives:n('Lives'),escaped,remaining:[...get('Enemy')].map(e=>[e.getVariables().get('EnemyType').getAsString(),center(e)])}));
  ok(valid,'Every escape deducts one Life only after reaching the Finish portal');
  ok(!get('Enemy').length&&n('Money')===50000,'Escapes clear the wave without awarding kill Gold');
  return {checks,normalWaveEnemies:original,testEnemies:total,archetypes:kinds,frames,simulatedSeconds:elapsed,lives:n('Lives'),escaped};
 }

 const build=(type,site)=>{
  vars.get('SelectedTower').setNumber(0);step(2);
  clickObject(shop.cards.find(c=>c.item.Type===type).background);
  click(...site);
  const tower=get(type).find(o=>p.center(o).every((v,i)=>near(v,site[i],.1)));
  ok(!!tower,'Paid placement of '+type);
  return tower;
 };
 for(const type of p.types){
  const ruins=p.blockers.filter(b=>b.owner.getVariables().get('Kind').getAsString()==='Ruin');
  ok(p.validate(type,900,266,{cost:0}).reason==='path'&&p.validate(type,1670,260,{cost:0}).reason==='path','Straight and curved road block '+type);
  ok(ruins.some(r=>p.validate(type,r.x,r.y,{cost:0}).reason==='obstacle')&&['bounds','rocky-edge'].includes(p.validate(type,74,350,{cost:0}).reason),'Ruins and the border block '+type);
  ok(candidates(type).some(([x,y])=>y>700&&y<765),'Former road includes buildable ground for '+type);
 }
 const starting=n('Money');
 const starSite=candidates('StarCannonTower',330,510).find(p=>p[1]>300);
 const bloomSite=candidates('NebulaBloomTower',830,970).find(p=>p[1]>300);
 const star=build('StarCannonTower',starSite),bloom=build('NebulaBloomTower',bloomSite);
 ok(n('Money')===starting-800,'Unchanged shop prices charged exactly once');
 vars.get('SelectedTower').setNumber(bloom.getVariables().get('TowerId').getAsNumber());step(2);
 for(let i=0;i<3;i++)clickObject(scene.__selectedPanel.cards[0].background);
 ok(bloom.getVariables().get('Path1Level').getAsNumber()===3,'Nebula Bloom buys its normal Poison Zone upgrade');
 vars.get('SelectedTower').setNumber(0);step(2);
 clickObject(shop.cards[0].background);move(900,266);
 ok(p.preview.reason==='path'&&get('TilePlacement_Indicator')[0].getColor()==='255;136;171','Builder ghost shows the new path exclusion');
 p.stop();
 const before=n('Money');
 clickObject(get('ShopPlayButton')[0]);
 const rewards=scene.__waveManager.queue.reduce((sum,type)=>sum+vars.get('EnemyTypes').getChild(type).getChild('Reward').getAsNumber(),0);
 for(let i=0;i<2450&&n('LastRewardedWave')<1&&!vars.get('GameOver').getAsBoolean();i++)step(1,80);
 ok(n('LastRewardedWave')===1&&n('Lives')===10&&n('Money')===before+rewards,'Actual first wave clears with native kill Gold and full Lives');
 const towerDamage=t=>t.getVariables().get('DamageDealt').getAsNumber();
 ok(towerDamage(star)>0&&towerDamage(bloom)>0&&scene.__nebulaBloom.metrics.directHits>0&&scene.__nebulaBloom.metrics.zonesCreated>0,'Star Cannon and Nebula Bloom hit moving enemies, including AoE and Poison Zones');
 return {checks,damage:[towerDamage(star),towerDamage(bloom)],income:n('Money')-before,available};
})()
