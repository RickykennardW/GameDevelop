// Native Stage 1-1 combat from Levels. The fixtures never grant Gold or deal damage.
(async()=>{
 const game=testGame,input=game.getInputManager(),stack=game.getSceneStack(),checks=[],rows=[];
 const control=globalThis.BALANCE_MODE==='base-only';
 const prioritizeArea=globalThis.BALANCE_MODE==='prioritize-area';
 let scene=stack.getCurrentScene();
 const ok=(condition,message)=>{if(!condition)throw Error(message);checks.push(message);};
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const step=(count=1)=>{for(let i=0;i<count;i++){stack.step(16.667);input.onFrameEnded();}};
 const click=(x,y,layer='CampaignUI')=>{
  input.onMouseMove(...scene.getLayer(layer).convertInverseCoords(x,y,0,[0,0]));step(2);
  input.onMouseButtonPressed(0);step();input.onMouseButtonReleased(0);step(2);
 };
 const button=b=>click(b.rect.x+b.rect.w/2,b.rect.y+b.rect.h/2);
 const object=o=>click(o.getCenterXInScene(),o.getCenterYInScene(),o.getLayer());
 game.pause(true);step(4);
 const levels=scene.__levelsUI;
 button(levels.skip);button(levels.launch);
 for(let i=0;i<450&&stack.getCurrentScene()?.getName()!=='Game Scene';i++){step();await wait(8);}
 scene=stack.getCurrentScene();step(5);
 const run=scene.__campaignRun,v=scene.getVariables(),level=run?.level;
 const get=name=>scene.getObjects(name),num=name=>v.get(name).getAsNumber(),flag=name=>v.get(name).getAsBoolean();
 ok(level?.Id==='1-1'&&num('Money')===level.StartingGold&&num('MaximumWave')===15,'Levels launches the 15-wave stage with the configured Gold');
 button(run.skip);ok(run.stage===-1,'Native tutorial skip releases controls for the strategy test');
 const shop=scene.__towerShopUI,p=scene.__freePlacement;
 const types={star:'StarCannonTower',bloom:'NebulaBloomTower'};
 const select=type=>object(shop.cards.find(c=>c.item.Type===type).background);
 const close=()=>{v.get('SelectedTower').setNumber(0);p.stop();step(2);};
 const clearSite=(type,x,y)=>p.validate(type,x,y,{cost:0}).valid;
 const candidates=shop.level.rows.slice(0,-1).flatMap((y,i)=>{
  const midpoint=(y+shop.level.rows[i+1])/2;
  return Array.from({length:76},(_,j)=>[280+16*j,midpoint]);
 });
 const site=(type,preferred)=>{
  for(const [x,y] of preferred)if(clearSite(type,x,y))return[x,y];
  return candidates.find(([x,y])=>clearSite(type,x,y));
 };
 let spent=0,purchases=[];
 const buy=(type,xy)=>{
  close();const before=num('Money'),cost=shop.cards.find(c=>c.item.Type===type).item.Cost;
  ok(!!xy&&before>=cost,'Earned Gold covers '+type+' before wave '+(num('Wave')+1));
  select(type);click(...xy,'');
  const tower=get(type).find(o=>Math.hypot(p.center(o)[0]-xy[0],p.center(o)[1]-xy[1])<.1);
  ok(tower&&num('Money')===before-cost,'Native purchase charges '+cost+' for '+type);
  spent+=cost;purchases.push({wave:num('Wave')+1,tower:type,cost,site:xy});return tower;
 };
 const upgrade=(tower,path)=>{
  const type=tower.getName(),config=type===types.star?scene.__starCannon.config:scene.__nebulaBloom.config;
  const tv=tower.getVariables(),level=tv.get('Path'+path+'Level'),previous=level.getAsNumber();
  const next=config.Paths[path-1].Upgrades[previous],cash=num('Money');
  ok(next&&cash>=next.Cost,'Earned Gold covers '+next?.Name+' before wave '+(num('Wave')+1));
  v.get('SelectedTower').setNumber(tv.get('TowerId').getAsNumber());step(2);
  object(scene.__selectedPanel.cards[path-1].background);
  ok(level.getAsNumber()===previous+1&&num('Money')===cash-next.Cost,'Native upgrade buys '+next.Name+' exactly once');
  spent+=next.Cost;purchases.push({wave:num('Wave')+1,tower:type,path,tier:previous+1,cost:next.Cost});close();
 };
 const star=buy(types.star,site(types.star,[[455,181],[300,355]]));
 if(!control){
  const before=num('Money'),xy=site(types.bloom,[[900,355]]);
  select(types.bloom);click(...xy,'');
  ok(num('Money')===before&&!get(types.bloom).length&&p.active&&p.type===types.bloom,'Unaffordable purchase keeps Gold and the placement ghost');
  ok(p.feedback.shown===1&&p.feedback.root.visible,'Existing insufficient-Gold feedback is active');
  close();
 }
 const samples=new Map(),rewardTypes=new Map();
 const spawned=run.spawned;
 run.spawned=(enemy,type,index)=>{
  spawned(enemy,type,index);
  const tv=enemy.getVariables(),reward=tv.get('GoldReward').getAsNumber();
  const wave=num('Wave');
  if(!samples.has(wave))samples.set(wave,[]);
  const record={type,reward,slot:index+1,dead:false,finished:false};samples.get(wave).push(record);rewardTypes.set(type,reward);
  const release=()=>{
   record.dead=enemy.getBehavior('Health').IsDead();record.finished=tv.get('PathFinished').getAsBoolean();
   enemy.unregisterDestroyCallback(release);
  };
  enemy.registerDestroyCallback(release);
 };
 const verifyIndex=()=>{
  ok(scene.__monsterDiscovery.found.size===6,'Real wave spawns discover all six entries');
  v.get('IndexOpen').setBoolean(true);const index=scene.__unitIndex;index.category='Monsters';step(3);
  for(const [id,reward] of rewardTypes){
   index.select(id);step(3);
   ok(!index.detail.locked&&index.detail.id===id&&index.statValues.some(([label,value])=>label==='REWARD'&&value===reward+' Gold')&&index.objects.statValue3.getString()===reward+' Gold','Displayed per-kill reward matches native '+id+' spawn');
  }
  v.get('IndexOpen').setBoolean(false);step(3);
 };
 let bloom,extraStar,extraBloom;
 const spend=wave=>{
  if(wave===2)upgrade(star,1);
  if(wave===4)extraStar=buy(types.star,site(types.star,[[1380,181],[1550,181],[1360,355]]));
  if(wave===6)bloom=buy(types.bloom,site(types.bloom,[[900,355],[780,540]]));
  if(wave===7){upgrade(bloom,1);upgrade(bloom,1);}
  if(wave===8){upgrade(star,1);upgrade(star,2);if(!prioritizeArea)upgrade(extraStar,2);}
  if(wave===9&&num('Money')>=900)upgrade(bloom,1);
  if(wave===10){if(bloom.getVariables().get('Path1Level').getAsNumber()===2)upgrade(bloom,1);upgrade(star,2);if(prioritizeArea)upgrade(extraStar,2);}
  if(wave===11)upgrade(star,1);
  if(wave===12){extraBloom=buy(types.bloom,site(types.bloom,[[1260,540],[1360,912]]));upgrade(extraBloom,2);upgrade(extraBloom,2);}
  if(wave===13){upgrade(extraBloom,2);upgrade(extraStar,2);verifyIndex();}
  if(wave>=14&&num('Money')>=2800&&star.getVariables().get('Path1Level').getAsNumber()===3)upgrade(star,1);
  if(wave===15&&num('Money')>=2300)upgrade(bloom,1);
 };
 for(const spec of level.Waves){
  const wave=spec.Number;
  if(!control)spend(wave);
  const before=num('Money'),lives=num('Lives');
  object(get('ShopPlayButton')[0]);
  ok(num('Wave')===wave&&flag('WaveActive'),'Native Play starts wave '+wave);
  object(get('ShopPlayButton')[0]);
  ok(scene.getTimeManager().getTimeScale()===2,'Native speed button selects 2x for wave '+wave);
  if(wave===1){
   const beforePause=scene.__waveManager.elapsed;
   await wait(120);
   ok(scene.__waveManager.elapsed===beforePause,'Native game pause freezes wave scheduling');
  }
  let elapsed=0;
  for(let frames=0;frames<4600&&num('LastRewardedWave')<wave&&!flag('GameOver');frames++){
   scene.renderAndStep(50,{skipDrawing:true});input.onFrameEnded();
   elapsed+=scene.getTimeManager().getElapsedTime()/1000;
   if(frames%400===0)await wait(1);
  }
  const enemies=samples.get(wave)||[],killGold=enemies.filter(e=>e.dead&&!e.finished).reduce((sum,e)=>sum+e.reward,0);
  const completed=num('LastRewardedWave')===wave,clearGold=completed?spec.CompletionGold:0;
  const row={wave,spawned:enemies.length,kills:enemies.filter(e=>e.dead&&!e.finished).length,leaks:lives-num('Lives'),killGold,clearGold,spent,bank:num('Money'),lives:num('Lives'),elapsed,completed};
  rows.push(row);console.log('BALANCE PROGRESS '+JSON.stringify(row));
  ok(num('Money')===before+killGold+clearGold,'Kill Gold and one clear bonus reconcile for wave '+wave);
  if(flag('GameOver')&&num('Lives')<=0)break;
  ok(completed&&enemies.length===Object.values(spec.Enemies).reduce((a,b)=>a+b,0),'Entire authored wave '+wave+' spawns and resolves');
  ok(enemies.filter(e=>e.finished).length===row.leaks,'Only Finish arrivals deduct Lives in wave '+wave);
  if(spec.EliteSpawnSlots)ok(JSON.stringify(enemies.filter(e=>e.type==='VoidGolem').map(e=>e.slot))===JSON.stringify(spec.EliteSpawnSlots),'Elite arrives with the intended escorts in wave '+wave);
  step(10);ok(num('Money')===row.bank,'Waiting cannot repeat the bonus from wave '+wave);
 }
 if(control){
  ok(num('Lives')<=0&&!run.finished&&rows.at(-1).wave>=3,'One unupgraded Star Cannon reaches the introduction then fails the pressure curve');
 }else{
  ok(run.finished&&num('Lives')>0&&num('LastRewardedWave')===15&&game.__campaign.save.Completed['1-1']&&game.__campaign.available('1-2'),'Earned-income defense wins all 15 waves and unlocks the next mission');
  ok(scene.__nebulaBloom.metrics.zonesCreated>0&&scene.__nebulaBloom.metrics.directHits>0,'Native Nebula splash and Poison Zones contribute during the strategy');
 }
 return{checks,control,prioritizeArea,startingGold:level.StartingGold,initialStar:purchases[0].site,purchases,rows,finalGold:num('Money'),lives:num('Lives'),nativeCombatOnly:true};
})()
