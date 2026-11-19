// Native selected-chapter geometry, scale and movement. Unlocks are test-profile fixtures.
(async()=>{
 const G=testGame,I=G.getInputManager(),stack=G.getSceneStack(),checks=[],results=[];
 let S=stack.getCurrentScene();G.pause(true);
 const ok=(value,message)=>{if(!value)throw Error(message);checks.push(message);};
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const step=(count=1,ms=16.667,draw=true)=>{for(let i=0;i<count;i++){if(draw)stack.step(ms);else S.renderAndStep(ms,{skipDrawing:true});I.onFrameEnded();}};
 const click=(x,y,layer='CampaignUI')=>{I.onMouseMove(...S.getLayer(layer).convertInverseCoords(x,y,0,[0,0]));step(2);I.onMouseButtonPressed(0);step();I.onMouseButtonReleased(0);step(2);};
 const button=b=>click(b.rect.x+b.rect.w/2,b.rect.y+b.rect.h/2);
 const enter=async name=>{const old=S;for(let n=0;n<400;n++){step();if(stack.getCurrentScene()!==old&&stack.getCurrentScene()?.getName()===name)break;await wait(4);}S=stack.getCurrentScene();step(6);ok(S!==old&&S.getName()===name,'Native scene transition '+name);};
 step(5);const C=G.__campaign,mode=globalThis.BALANCE_MODE||'audit',visual=mode.startsWith('visual-'),only=visual?Number(mode.split('-')[1]):0;
 C.save.SelectTutorialDone=true;C.save.GameTutorialDone=true;C.save.Completed=Object.fromEntries(C.config.Levels.map(l=>[l.Id,true]));
 S.__levelsUI.stage=-1;
 ok(C.config.ChapterCapacity===8&&C.config.FutureChapters.length===3&&[6,7,8].every(n=>!C.chapterUnlocked(n)&&!C.launch(n+'-1')),'Five playable chapters and three unlaunchable expansion definitions');
 const chapters=only?[only]:[1,2,3,4,5];
 for(const chapter of chapters){
  let U=S.__levelsUI;U.chooseChapter(chapter);U.chooseLevel(chapter+'-1');step(3);button(U.launch);await enter('Game Scene');await wait(150);step(2);
  const V=S.getVariables(),shop=S.__towerShopUI,L=shop.level,P=S.__freePlacement,meta=S.__chapterMap.config,map=S.getLayer(''),get=n=>S.getObjects(n),n=k=>V.get(k).getAsNumber();
  ok(meta.Chapter===chapter&&get('Monster_Path').length===1&&get('Monster_Path')[0].getAnimationName()===meta.Animation,'Selected chapter owns one native road '+chapter);
  ok(S.__chapterMap.groundReady&&get('Ground_Map')[0].getRendererObject().texture===G.getImageManager().getPIXITexture(meta.Ground)&&get('Ground_Map')[0].getRendererObject().texture.width===128,'Selected seamless terrain is loaded without a fallback texture '+chapter);
  ok(L.width===60&&JSON.stringify(V.get('MonsterPathPoints').toJSObject())===JSON.stringify(L.points)&&L.points.length===n('MonsterPathPointCount'),'Rendering / movement / placement share one 60-unit centerline '+chapter);
  ok(S.__worldStyle.enemyVisualMultiplier===.9&&P.config('StarCannonTower').Radius===46&&P.config('NebulaBloomTower').Radius===68,'Render-only enemy reduction retains both tower footprints '+chapter);
  ok(get('Ground_Decoration').length===meta.Decorations.length&&P.blockers.filter(b=>b.owner.getName()==='Ground_Decoration').every(b=>!P.pathOverlaps(b.x,b.y,b.r)),'All actual blocking props clear the selected route '+chapter);
  ok(get('SpawnMarker')[0].getCenterXInScene()===L.spawn[0]&&get('BaseMarker')[0].getCenterYInScene()===L.base[1],'Spawn and Finish markers share route endpoints '+chapter);
  const a=map.convertInverseCoords(shop.mapBounds.left,shop.mapBounds.top,0,[0,0]),b=map.convertInverseCoords(shop.mapBounds.right,shop.mapBounds.bottom,0,[0,0]);
  ok(a[0]>=shop.gameArea.frame.left-.1&&b[0]<shop.gameArea.sidebarX&&a[1]>=shop.gameArea.frame.top-.1&&b[1]<=shop.gameArea.frame.bottom+.1,'Fitted world stays inside gameplay viewport '+chapter);
  // A regular sample lattice is comparable across layouts. It is not a packing count.
  const sites=Object.fromEntries(P.towerTypes.map(type=>[type,[]]));
  for(let y=150;y<=990;y+=20)for(let x=200;x<=1690;x+=24)for(const type of P.towerTypes)if(P.validate(type,x,y,{cost:0,ignoreGold:true}).valid)sites[type].push([x,y]);
  console.log('BALANCE PROGRESS '+JSON.stringify({chapter,sites:Object.fromEntries(Object.entries(sites).map(([k,v])=>[k,v.length]))}));
  ok(Object.values(sites).every(s=>s.length>=40),'Every normal/Fusion footprint has at least forty legal sample sites '+chapter);
  const row={chapter,map:meta.Id,length:L.length,turns:L.turns,width:L.width,props:meta.Decorations.length,sites:Object.fromEntries(Object.entries(sites).map(([k,v])=>[k,v.length])),zoom:map.getCameraZoom(),samples:{},travel:{}};
  if(visual){step(3);return {checks,results:[row],visualOnly:true};}
  if(mode==='geometry'){
   results.push(row);if(chapter<5){S.__campaignRun.leave('Levels');await enter('Levels');}continue;
  }
  // Native placement and refund handlers run against the widened path, with each
  // mission's existing opening funds. Movement test below has no surviving tower.
  for(const type of ['StarCannonTower','NebulaBloomTower']){
   const cost=shop.cards.find(c=>c.item.Type===type).item.Cost;
   if(n('Money')<cost)continue;
   const xy=sites[type].find(([x,y])=>P.validate(type,x,y).valid),card=shop.cards.find(c=>c.item.Type===type).background,before=n('Money');
   click(card.getCenterXInScene(),card.getCenterYInScene(),card.getLayer());click(...xy,'');
   const tower=get(type)[0];ok(tower&&n('Money')===before-cost,'Paid native '+type+' placement '+chapter);
   const radius=P.config(type).Radius;
   ok(!P.validate(type,...P.center(tower),{ignoreGold:true}).valid&&!P.validate(type,L.points[10].X,L.points[10].Y,{ignoreGold:true}).valid,'Tower spacing and road rejection '+type+' '+chapter);
   V.get('SelectedTower').setNumber(tower.getVariables().get('TowerId').getAsNumber());step(3);
   const sell=S.__selectedPanel.objects.sell;click(sell.getCenterXInScene(),sell.getCenterYInScene(),sell.getLayer());step(2);P.stop();V.get('SelectedTower').setNumber(0);
   ok(!get(type).length&&n('Money')>before-cost&&P.config(type).Radius===radius,'Native sale refunds and frees footprint '+type+' '+chapter);
  }
  // All six live archetypes use their own speed, animations, collision and skill.
  S.__campaignRun.pendingWave=true;step(2);const manager=S.__waveManager;
  ok(manager.index===0,'Movement fixture starts before first spawn '+chapter);
  manager.queue=Object.keys(V.get('EnemyTypes').toJSObject());manager.index=0;V.get('EnemiesToSpawn').setNumber(manager.queue.length);V.get('WaveEnemyCount').setNumber(manager.queue.length);
  const R=S.__campaignRun,spawned=R.spawned,records=new Map(),types=manager.queue.slice();
  R.spawned=(e,type,index)=>{spawned(e,type,index);const id=e.getUniqueId(),rec={e,type,age:0,finished:false,directions:new Set(),frames:new Set(),casts:0,dimensions:[e.getWidth(),e.getHeight()]};records.set(id,rec);const cleanup=()=>{rec.finished=e.getVariables().get('PathFinished').getAsBoolean();e.unregisterDestroyCallback(cleanup);};e.registerDestroyCallback(cleanup);};
  let time=0;
  for(let frames=0;frames<9000&&[...records.values()].filter(r=>r.finished).length<types.length;frames++){
   step(1,80,false);time+=S.getTimeManager().getElapsedTime()/1000;
   for(const rec of records.values()){
    if(!get('Enemy').includes(rec.e))continue;
    const e=rec.e,v=e.getVariables(),waypoint=v.get('Waypoint').getAsNumber();rec.age+=.08;
    rec.directions.add(v.get('Facing').getAsString());rec.frames.add(rec.type==='VoidHound'?e.__houndRig?.frame:rec.type==='Basic'?Math.floor((e.__novaState?.age||0)*8)%4:e.getAnimationFrame());
    if(waypoint>0&&waypoint<L.points.length){const prev=L.points[waypoint-1],next=L.points[waypoint];if(P.segment(e.getCenterXInScene(),e.getCenterYInScene(),[prev.X,prev.Y],[next.X,next.Y])>.04)throw Error('Off-route '+chapter+' '+rec.type);}
    if(e.__golemState?.casting)rec.casts++;
    if(e.getWidth()!==rec.dimensions[0]||e.getHeight()!==rec.dimensions[1])throw Error('Collision dimensions changed during travel');
   }
   if(frames%600===0)await wait(1);
  }
  console.log('BALANCE PROGRESS '+JSON.stringify({chapter,records:[...records.values()].map(r=>({type:r.type,finished:r.finished,directions:[...r.directions],frames:[...r.frames],age:r.age})),live:get('Enemy').length}));
  ok(records.size===6&&[...records.values()].every(r=>r.finished&&r.directions.size===4&&r.frames.size>1),'Six archetypes animate and traverse every heading to Finish '+chapter);
  ok([...records.values()].find(r=>r.type==='VoidGolem').casts>0,'Stationary Golem casting remains active during travel '+chapter);
  ok(n('Lives')===R.level.StartingLives-6,'Exactly six valid arrivals deduct six Lives '+chapter);
  row.travel=Object.fromEntries([...records.values()].map(r=>[r.type,{seconds:r.age,dimensions:r.dimensions,headings:[...r.directions],animationFrames:r.frames.size,castingFrames:r.casts}]));row.simulatedSeconds=time;
  results.push(row);console.log('BALANCE PROGRESS '+JSON.stringify({chapter,geometry:true,travel:true,sites:row.sites}));
  if(chapter<5){R.leave('Levels');await enter('Levels');}
 }
 return {checks,results,fixture:'Completed-save unlock and six-archetype spawn queue only. Native speeds, movement, cast, placement and sale.',allMissionsNaturalPlaytest:false};
})()
