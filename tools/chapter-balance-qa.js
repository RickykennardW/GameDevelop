// Whole missions use natural combat and earned Gold. Only campaign unlocks are fixtures.
(async()=>{
 const G=testGame,I=G.getInputManager(),stack=G.getSceneStack(),checks=[],results=[];
 let S=stack.getCurrentScene();G.pause(true);
 const ok=(c,m)=>{if(!c)throw Error(m);checks.push(m);},wait=ms=>new Promise(r=>setTimeout(r,ms));
 const step=(n=1,ms=16.667,draw=true)=>{for(let i=0;i<n;i++){if(draw)stack.step(ms);else S.renderAndStep(ms,{skipDrawing:true});I.onFrameEnded();}};
 const click=(x,y,layer='CampaignUI')=>{I.onMouseMove(...S.getLayer(layer).convertInverseCoords(x,y,0,[0,0]));step(2);I.onMouseButtonPressed(0);step();I.onMouseButtonReleased(0);step(2);};
 const button=b=>click(b.rect.x+b.rect.w/2,b.rect.y+b.rect.h/2);
 const enter=async name=>{const old=S;for(let k=0;k<400;k++){step();if(stack.getCurrentScene()!==old&&stack.getCurrentScene()?.getName()===name)break;await wait(3);}S=stack.getCurrentScene();step(6);ok(S!==old&&S.getName()===name,'Native transition '+name);};
 step(4);const C=G.__campaign;C.save.SelectTutorialDone=C.save.GameTutorialDone=true;C.save.Completed=Object.fromEntries(C.config.Levels.map(l=>[l.Id,true]));S.__levelsUI.stage=-1;
 const mode=globalThis.BALANCE_MODE||'mixed',mixed=!mode.includes('cannon'),legacy=mode.includes('legacy'),speed=mode.includes('cannon')&&!mode.includes('damage');
 const numbers=mode.match(/\d+/g)||[],start=Number(numbers[0])||1,onlyMission=Number(numbers[1])||0;
 if(legacy)for(const ch of C.config.Chapters)ch.MapId='legacy-benchmark';
 for(let chapter=start;chapter<=(onlyMission?start:5);chapter++)for(const mission of onlyMission?[onlyMission]:[1,3,5]){
  if(chapter===1&&mission===1)continue; // Dedicated two-strategy 15-wave test.
  const U=S.__levelsUI;U.chooseChapter(chapter);U.chooseLevel(chapter+'-'+mission);step(3);button(U.launch);await enter('Game Scene');await wait(100);
  const R=S.__campaignRun,V=S.getVariables(),P=S.__freePlacement,shop=S.__towerShopUI,star=S.__starCannon,bloom=S.__nebulaBloom,get=n=>S.getObjects(n),num=k=>V.get(k).getAsNumber();
  const types=['StarCannonTower','NebulaBloomTower'],initial=num('Money'),rows=[],purchases=[];
  let spent=0,killGold=0,clearGold=0,observed=0;
  const spawn=R.spawned;
  R.spawned=(e,t,i)=>{spawn(e,t,i);observed++;const health=e.getBehavior('Health'),ev=e.getVariables(),release=()=>{if(health.IsDead()&&!ev.get('PathFinished').getAsBoolean())killGold+=ev.get('GoldReward').getAsNumber();e.unregisterDestroyCallback(release);};e.registerDestroyCallback(release);};
  const samples=[];
  for(let i=1;i<shop.level.points.length;i++){
   const a=shop.level.points[i-1],b=shop.level.points[i],d=Math.hypot(b.X-a.X,b.Y-a.Y);
   for(let f=0;f<d;f+=30)samples.push([a.X+(b.X-a.X)*f/d,a.Y+(b.Y-a.Y)*f/d]);
  }
  const sites={};
  for(const type of types){const range=(type===types[0]?star.stats(0,0):bloom.stats(0,0)).AttackRange;sites[type]=[];
   for(let y=170;y<990;y+=24)for(let x=280;x<1660;x+=32)if(P.validate(type,x,y,{cost:0}).valid){
    // Coverage is measured in actual road length, with a small opening-lane tie breaker.
    const covered=samples.reduce((n,[a,b],i)=>n+(Math.hypot(a-x,b-y)<range?1+.15*(1-i/samples.length):0),0);
    sites[type].push({x,y,score:covered});
   }sites[type].sort((a,b)=>b.score-a.score);
  }
  const close=()=>{V.get('SelectedTower').setNumber(0);P.stop();I.onMouseMove(1100,20);step(3);};
  const buy=type=>{close();const cost=shop.cards.find(c=>c.item.Type===type).item.Cost,all=P.towers();
   const spot=sites[type].filter(s=>P.validate(type,s.x,s.y).valid).sort((a,b)=>{
    const score=s=>s.score/(1+all.reduce((n,t)=>n+(Math.hypot(P.center(t)[0]-s.x,P.center(t)[1]-s.y)<260?.45:0),0));return score(b)-score(a);
   })[0];if(!spot||num('Money')<cost)return false;
   const before=num('Money'),card=shop.cards.find(c=>c.item.Type===type).background;click(card.getCenterXInScene(),card.getCenterYInScene(),card.getLayer());click(spot.x,spot.y,'');
   const tower=get(type).find(t=>Math.hypot(...P.center(t).map((n,i)=>n-[spot.x,spot.y][i]))<.1);
   ok(tower&&num('Money')===before-cost,'Paid placement '+R.level.Id+' '+type);spent+=cost;purchases.push({wave:num('Wave')+1,type,site:[spot.x,spot.y],cost});close();return true;
  };
  const upgrade=(tower,path)=>{const system=tower.getName()===types[0]?star:bloom,level=tower.getVariables().get('Path'+path+'Level').getAsNumber(),next=system.config.Paths[path-1].Upgrades[level];if(!next||num('Money')<next.Cost)return false;const before=num('Money');
   if(!system.upgrade(tower,path))return false;
   ok(num('Money')===before-next.Cost,'Paid upgrade '+R.level.Id+' '+next.Name);spent+=next.Cost;purchases.push({wave:num('Wave')+1,type:tower.getName(),path,tier:level+1,cost:next.Cost});return true;
  };
  const invest=wave=>{
   // Two explicit bounded policies allow comparison without perfect information
   // or bonus income. Prices, locking and unit stats remain native.
   const cap=mode.includes('focused')?6:[4,6,8,10,12][chapter-1];
   for(let attempts=0;attempts<40;attempts++){
    const stars=get(types[0]),blooms=get(types[1]),all=[...stars,...blooms];let action=false;
    if(!stars.length)action=buy(types[0]);
    else if(mixed&&!blooms.length&&num('Money')>=500)action=buy(types[1]);
    else if(all.length<cap&&num('Money')>=300){const want=mixed&&blooms.length<Math.floor((all.length+1)/3)?types[1]:types[0];action=buy(want);if(!action&&want===types[1])action=buy(types[0]);}
    if(action)continue;
    if(mode.includes('focused')&&stars.length){const first=stars[0],tv=first.getVariables();if(tv.get('Path1Level').getAsNumber()<4){if(upgrade(first,1))continue;break;}}
    // Cost-effective tier1/2 crosspaths first, then specialization and tier3/4.
    for(const tier of [1,2,3,4,5]){
     for(const tower of all){const tv=tower.getVariables(),isBloom=tower.getName()===types[1],main=isBloom?1:speed?2:1,other=3-main;
      for(const path of [main,other]){
       const target=path===main?tier:Math.min(2,tier),level=tv.get('Path'+path+'Level').getAsNumber();
       if(level<target&&upgrade(tower,path)){action=true;break;}
      }if(action)break;
     }if(action)break;
    }
    if(!action)break;
   }close();
  };
  for(const spec of R.level.Waves){
   invest(spec.Number);const before=num('Money'),beforeKills=killGold,beforeLives=num('Lives');R.pendingWave=true;step(2);
   ok(num('Wave')===spec.Number,'Native authored wave '+R.level.Id+'/'+spec.Number);
   let elapsed=0;
   for(let k=0;k<9000&&num('LastRewardedWave')<spec.Number&&!V.get('GameOver').getAsBoolean();k++){step(1,80,false);elapsed+=S.getTimeManager().getElapsedTime()/1000;if(k%600===0)await wait(1);}
   const completed=num('LastRewardedWave')===spec.Number,bonus=completed?(spec.CompletionGold||0):0;clearGold+=bonus;
   ok(num('Money')===before+killGold-beforeKills+bonus,'Native reward reconciliation '+R.level.Id+'/'+spec.Number);
   rows.push({wave:spec.Number,lives:num('Lives'),leaks:beforeLives-num('Lives'),bank:num('Money'),spent,elapsed,completed});
   if(num('Lives')<=0)break;
   ok(completed,'Authored wave terminates '+R.level.Id+'/'+spec.Number);
  }
  // Death animations may finish one frame after the victory event. Reward paid
  // observers are settled before recording this balance sample.
  step(5);
  const result={mission:R.level.Id,chapter,strategy:mixed?(mode.includes('focused')?'mixed-focused':'mixed-area'):speed?'cannon-speed':'cannon-damage',won:R.finished&&num('Lives')>0,startingGold:initial,spent,killGold,clearGold,finalGold:num('Money'),lives:num('Lives'),observed,rows,purchases,fixtureGold:0,fixtureDamage:0};
  results.push(result);console.log('BALANCE PROGRESS '+JSON.stringify({...result,rows:undefined,purchases:undefined}));
  if(num('Lives')<=0){
   step(170);click(10,10,'GameOverUI');step(65);
   const b=S.__gameOverUI.buttons.find(b=>b.id==='Levels');click(b.x,b.y,'GameOverUI');
  }else R.leave('Levels');
  await enter('Levels');
 }
 return{checks,results,naturalCombat:true,allPurchasesUseActualPrices:true,saveUnlockFixture:true,notHumanWinRateStudy:true};
})()
