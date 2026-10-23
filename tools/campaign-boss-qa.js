// Isolated boss-mechanics fixtures; balance mode uses native fire and finite funds.
(async()=>{
 const G=testGame,I=G.getInputManager(),checks=[],wait=ms=>new Promise(r=>setTimeout(r,ms)),mode=globalThis.BALANCE_MODE||'',balance=mode.startsWith('balance'),startChapter=Number(mode.slice(7))||1;let S=G.getSceneStack().getCurrentScene();G.pause(true);
 const step=(n=1,ms=16.667)=>{for(let i=0;i<n;i++){G.getSceneStack().step(ms);I.onFrameEnded();}};const ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
 const click=(x,y,layer='CampaignUI')=>{I.onMouseMove(...S.getLayer(layer).convertInverseCoords(x,y,0,[0,0]));step();I.onMouseButtonPressed(0);step();I.onMouseButtonReleased(0);step();};const button=b=>click(b.rect.x+b.rect.w/2,b.rect.y+b.rect.h/2);
 const enter=async name=>{const old=S;for(let i=0;i<400;i++){step();if(G.getSceneStack().getCurrentScene()!==old&&G.getSceneStack().getCurrentScene()?.getName()===name)break;await wait(5);}S=G.getSceneStack().getCurrentScene();step(4);ok(S!==old&&S.getName()===name,'native boss scene transition '+name);};
 step(4);const C=G.__campaign,results=[];C.save.SelectTutorialDone=true;C.save.GameTutorialDone=true;
 for(let chapter=startChapter;chapter<=5;chapter++){
  C.save.Completed=Object.fromEntries(C.config.Levels.filter(l=>l.Index<chapter*5).map(l=>[l.Id,true]));C.persist();const U=S.__levelsUI;U.stage=-1;U.chooseChapter(chapter);U.chooseLevel(chapter+'-5');step(3);button(U.launch);await enter('Game Scene');await wait(350);
  const R=S.__campaignRun,V=S.getVariables(),last=R.level.Waves.length;V.get('Wave').setNumber(last-1);R.started=new Set(Array.from({length:last-1},(_,i)=>i+1));
  if(balance){
   // Budget fixture = starting funds + configured previous-wave kill income;
   // no free upgrades and no changed tower stats. Boss wave support is retained.
   V.get('Money').setNumber(R.level.StartingGold+R.level.Waves.slice(0,-1).reduce((n,w)=>n+w.ExpectedGold,0));const P=S.__freePlacement,points=V.get('MonsterPathPoints').toJSObject(),samples=[];
   for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],length=Math.hypot(a.X-b.X,a.Y-b.Y);for(let t=0;t<length;t+=40)samples.push([a.X+(b.X-a.X)*t/length,a.Y+(b.Y-a.Y)*t/length]);}
   P.refresh();const xs=points.map(p=>p.X),ys=points.map(p=>p.Y),candidates=[];
   for(let y=Math.min(...ys)+64;y<Math.max(...ys);y+=100)for(let x=Math.min(...xs)+70;x<Math.max(...xs);x+=105){if(P.validate('StarCannonTower',x,y,{ignoreGold:true}).valid)candidates.push({x,y,score:samples.filter(([a,b])=>Math.hypot(a-x,b-y)<210).length});}candidates.sort((a,b)=>b.score-a.score);
   const cap=[4,8,14,20,30][chapter-1];for(const spot of candidates){if(S.getObjects('StarCannonTower').length>=cap||V.get('Money').getAsNumber()<300)break;if(!P.validate('StarCannonTower',spot.x,spot.y).valid)continue;const card=S.__towerShopUI.cards[0].background;click(card.getCenterXInScene(),card.getCenterYInScene(),card.getLayer());click(spot.x,spot.y,'');}
   for(const t of S.getObjects('StarCannonTower')){if(V.get('Money').getAsNumber()>=160)S.__starCannon.upgrade(t,1);if(chapter>=3&&V.get('Money').getAsNumber()>=130)S.__starCannon.upgrade(t,2);}
  }
  R.pendingWave=true;step(2);S.__waveManager.elapsed=V.get('SpawnInterval').getAsNumber();step();const B=R.boss;
  ok(!!B&&B.enemy.getVariables().get('CampaignBoss').getAsBoolean()&&B.enemy.getBehavior('Health').MaxHealth()===B.config.HP,'boss is actual configured native enemy: '+R.level.Id);ok(R.bossUI.visible&&R.bossName.text.includes(B.config.Name.toUpperCase()),'boss has dedicated name/health display: '+chapter);
  if(balance){let elapsed=0;for(;elapsed<320&&!R.bossKilled&&!R.bossEscaped;elapsed+=.05){step(1,50);if(Math.round(elapsed*20)%400===0)await wait(1);}results.push({level:R.level.Id,bossHP:B.config.HP,remainingHP:B.enemy.getBehavior('Health').Health(),killed:R.bossKilled,escaped:R.bossEscaped,simulatedSeconds:elapsed,towers:S.getObjects('StarCannonTower').length,lives:V.get('Lives').getAsNumber(),goldLeft:V.get('Money').getAsNumber()});}
  else{
   const e=B.enemy,h=e.getBehavior('Health'),state=e.__golemState;state.nextCast=S.__voidGolem.frameTime+.03;step(4);ok(state.casting,'telegraphed stationary cast begins: '+chapter);const position=JSON.stringify([e.getX(),e.getY(),e.getVariables().get('Waypoint').getAsNumber()]);step(12);ok(JSON.stringify([e.getX(),e.getY(),e.getVariables().get('Waypoint').getAsNumber()])===position,'boss cannot drift during casting: '+chapter);step(38);ok(state.releaseCount===1&&!state.casting,'one cast releases fortification once: '+chapter);ok(S.__voidGolem.fort.members.get(e.getUniqueId()).active,'native Fortification buff applies to boss: '+chapter);ok(h.PercentDamageReduction()===(B.config.ShieldSeconds?B.config.ShieldPercent/100:0),'chapter shield uses existing Health reduction once: '+chapter);
   const queue=S.__waveManager.queue.length;h.SetHealth(h.MaxHealth()*.49);step(2);ok(S.__waveManager.queue.length===queue+B.config.Reserves.length,'half-health reserves match one configured group: '+chapter);const after=S.__waveManager.queue.length;step(5);ok(S.__waveManager.queue.length===after,'reserves cannot repeat every frame: '+chapter);step(270);ok(h.PercentDamageReduction()===0,'temporary shield expires cleanly: '+chapter);
   const paid=V.get('Money').getAsNumber();S.__starCannon.deal(null,e,1e9);step(3);ok(R.bossKilled&&V.get('Money').getAsNumber()>=paid+B.config.Reward,'boss death pays native configured reward once: '+chapter);const money=V.get('Money').getAsNumber();step(15);ok(V.get('Money').getAsNumber()===money,'boss corpse cannot duplicate Gold: '+chapter);results.push({level:R.level.Id,castCount:state.castCount,releases:state.releaseCount,reserves:B.config.Reserves.length,shield:B.config.ShieldPercent});
  }
  if(chapter<5){if(S.__gameOverUI.active){const go=S.__gameOverUI;step(160);click(10,10,'GameOverUI');step(60);const b=go.buttons.find(b=>b.id==='Levels');click(b.x,b.y,'GameOverUI');}else R.leave('Levels');await enter('Levels');}
 }
 return{checks,balance,results,fixture:balance?'finite configured pre-boss budget / native towers and full boss wave':'forced cast/health thresholds / native skill and reward handlers',notWholeMissionWinRate:true};
})()
