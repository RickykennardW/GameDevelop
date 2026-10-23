// Real native Finish/Lives loss, isolated fixtures, no permanent balancing changes.
(async()=>{
 const G=testGame,I=G.getInputManager(),checks=[],mode=globalThis.BALANCE_MODE||'full',wait=ms=>new Promise(r=>setTimeout(r,ms));let S=G.getSceneStack().getCurrentScene();G.pause(true);
 const ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);},near=(a,b,t=.03)=>Math.abs(a-b)<t;
 const step=(n=1)=>{for(let i=0;i<n;i++){G.getSceneStack().step(16.667);I.onFrameEnded();}};
 const until=predicate=>{for(let i=0;i<1000&&!predicate();i++)step();ok(predicate(),'native phase advances');};
 const move=(x,y,layer='')=>{I.onMouseMove(...S.getLayer(layer).convertInverseCoords(x,y,0,[0,0]));step();};
 const click=(x,y,layer='')=>{move(x,y,layer);I.onMouseButtonPressed(0);step();I.onMouseButtonReleased(0);step();};
 const enter=async name=>{G.pause(false);for(let i=0;i<300;i++){if(G.getSceneStack().getCurrentScene()?.getName()===name)break;await wait(20);}G.pause(true);S=G.getSceneStack().getCurrentScene();step(3);ok(S.getName()===name,'native scene transition reaches '+name);};
 step(5);await wait(50);const V=S.getVariables(),get=n=>S.getObjects(n),A=S.__audio,D=S.__monsterDiscovery,F=S.__fusion,star=S.__starCannon,go=S.__gameOverUI;
 const definition=G.getSceneAndExtensionsData(S.getName()).sceneData,defaults=Object.fromEntries(definition.variables.filter(v=>['Money','Lives','Wave'].includes(v.name)).map(v=>[v.name,v.value]));
 ok(!go.active&&go.phase==='IDLE'&&!S.getLayer('GameOverUI').isVisible()&&get('DefeatRestart').length===0,'fresh game has no visible or duplicate defeat menu');
 const make=(a,b,x)=>{const t=S.createObject('StarCannonTower'),v=t.getVariables();for(const [n,z]of Object.entries({TowerId:900000+t.getUniqueId(),PurchasePrice:300,TotalInvestment:300,Path1Level:a,Path2Level:b,FootprintX:x,FootprintY:352,FootprintRadius:46}))v.get(n).setNumber(z);step();star.apply(t);return t;};
 const t1=make(5,2,300),t2=make(2,5,900);
 // Unlock a real encounter through the existing wave spawner; retain it on restart.
 V.get('Wave').setNumber(1);V.get('WaveActive').setBoolean(true);V.get('WaveMode').setString('Manual');const w=S.__waveManager;w.queue=['Basic'];w.index=0;w.elapsed=V.get('SpawnInterval').getAsNumber();V.get('EnemiesToSpawn').setNumber(1);step();
 ok(D.has('Basic')&&D.active?.id==='Basic','real wave spawn supplies discovery to preserve');
 G.__fusionArchive.discover('StarburstCannon','pure_52_25');A.setSetting('Music',27);A.persist();const settings={...A.settings},archive=G.__fusionArchive,session=D.session;
 const points=V.get('MonsterPathPoints').toJSObject();
 const atFinish=()=>{const e=S.createObject('Enemy');e.getVariables().get('EnemyType').setString('Basic');S.__novaWisp.ensure(e);const last=points.at(-1),previous=points.at(-2),length=Math.hypot(previous.X-last.X,previous.Y-last.Y);e.setPosition(last.X+(previous.X-last.X)*.1/length-e.getWidth()/2,last.Y+(previous.Y-last.Y)*.1/length-e.getHeight()/2);e.getVariables().get('Waypoint').setNumber(points.length-1);return e;};
 F.begin(t1);F.choose(t2);ok(F.active&&S.getTimeManager().getTimeScale()===.5,'defeat fixture begins during real Tactical Fusion');
 const finisher=atFinish();V.get('Lives').setNumber(1);I.onMouseMove(0,0);I.onMouseButtonPressed(0);step(3);
 ok(!get('Enemy').includes(finisher)&&V.get('Lives').getAsNumber()===0&&V.get('GameOver').getAsBoolean()&&go.active,'actual native Finish deletes enemy, removes last Life and activates defeat');
 ok(go.activations===1&&V.get('DefeatActive').getAsBoolean()&&go.phase==='RED_FADE','defeat locks once in loss-only state');
 ok(go.overlayOpacity<.2&&go.title.alpha===0&&go.buttons.every(b=>b.frame.isHidden()&&b.label.isHidden()),'red begins gently with no instant title or buttons');
 ok(!F.active&&F.ghost.isHidden()&&!S.__freePlacement.active&&get('TilePlacement_Indicator')[0].isHidden(),'defeat cancels tactical/ghost placement without consuming either source');
 ok(get('StarCannonTower').length===2&&S.getLayer('').getTimeScale()===0&&S.getTimeManager().getTimeScale()===1,'world freezes while UI scene clock keeps running');
 // Controlled frame stepping must still yield to real async audio decoding,
 // as requestAnimationFrame does in normal play, before a scene unload occurs.
 await wait(350);const defeatVoice=A.voices.find(v=>v.key==='GameOver');
 ok(defeatVoice?.sound?.playing()&&defeatVoice.sound.getVolume()>0,'existing defeat sound actually plays on native SFX channel');
 const snapshot=()=>JSON.stringify({lives:V.get('Lives').getAsNumber(),gold:V.get('Money').getAsNumber(),wave:V.get('Wave').getAsNumber(),spawn:V.get('EnemiesToSpawn').getAsNumber(),enemies:get('Enemy').map(e=>[e.getUniqueId(),e.getX(),e.getY(),e.getBehavior('Health').Health()]),projectiles:get('StarCannonProjectile').map(p=>[p.getUniqueId(),p.getX(),p.getY()]),starTime:star.time,golemTime:S.__voidGolem.time,spawnIndex:w.index,elapsed:w.elapsed});
 const frozen=snapshot(),discoveryAge=D.active.age,played=A.stats.requested.GameOver||0,root=go.root,children=root.children.length;
 step(35);ok(go.overlayOpacity>.20&&go.overlayOpacity<.6&&go.title.alpha===0,'crimson opacity grows smoothly before title delay');
 if(mode==='red')return{checks,phase:go.phase,age:go.age,opacity:go.overlayOpacity};
 I.onMouseButtonReleased(0);step();I.onMouseButtonPressed(0);step();ok(go.continues===0,'fresh click during initial fade is ignored');
 until(()=>go.phase==='AWAIT_CONTINUE');step(3);
 ok(go.continues===0&&!go.armed&&go.title.alpha===1&&go.prompt.alpha===1,'held early/defeat click cannot continue after title appears');
 ok(near(go.overlayOpacity,.60,.001)&&go.buttons.every(b=>b.frame.isHidden()),'red remains translucent60percent with buttons hidden');
 ok(snapshot()===frozen&&near(D.active.age,discoveryAge,.00001),'enemy/projectile/wave/economy clocks and queued discovery stay frozen');
 ok((A.stats.requested.GameOver||0)===played&&played===1,'existing defeat sound requested once despite Lives staying zero');
 ok(S.__celestialSonar.state==='NORMAL'&&!S.__celestialSonar.mark.visible,'sonar stops after defeat');
 ok(!star.upgrade(t1,1)&&!F.begin(t1),'normal upgrade and Fusion APIs reject defeat input');
 // Manual frame stepping does not yield to WebAudio's asynchronous decoder.
 // Give the real native sound callbacks time before forcing a scene unload.
 await wait(350);
 if(mode==='title')return{checks,phase:go.phase,age:go.age,opacity:go.overlayOpacity};
 I.onMouseButtonReleased(0);step();ok(go.continues===0&&go.armed,'release arms a fresh continue without triggering it');
 move(G.getGameResolutionWidth()/2,G.getGameResolutionHeight()/2+12,'GameOverUI');I.onMouseButtonPressed(0);step();ok(go.phase==='MENU_TRANSITION'&&go.continues===1,'one fresh click begins the red-to-black transition');
 step(16);ok(go.overlayTint!==go.config.RedTint&&go.overlayTint!==go.config.BlackTint&&go.overlayOpacity>.60&&go.overlayOpacity<.70,'single overlay interpolates tint and alpha during transition');
 until(()=>go.phase==='MENU');step(20);
 ok(go.continues===1&&!go.menuArmed&&!go.leaving&&go.requests===0,'continuing hold cannot also click Restart');
 ok(near(go.overlayOpacity,.70,.001)&&go.overlayTint===go.config.BlackTint&&go.buttons.every(b=>!b.frame.isHidden()&&near(b.frame.getOpacity(),255,1)),'final black is70percent with two visible buttons');
 ok(root===go.root&&root.children.length===children&&get('DefeatRestart').length===1&&get('DefeatMainMenu').length===1,'one overlay and one pair of buttons reused across frames');
 I.onMouseButtonReleased(0);step(2);ok(!go.leaving,'continue release does not choose a final button');
 const beforeTime=go.age;S.getTimeManager().setTimeScale(2);step(60);ok(near(go.age-beforeTime,1,.025)&&S.getLayer('').getTimeScale()===0,'Game Over animation uses real time while gameplay stays frozen');
 for(const b of go.buttons){move(0,0,'GameOverUI');step(35);move(b.x,b.y,'GameOverUI');ok(b.scale>1&&b.scale<go.hoverScale,'hover begins smoothly: '+b.id);step(25);ok(b.scale>=1.05&&b.scale<=1.0601&&b.frame.getAnimationName()==='Hover','lobby hover1.06 reused: '+b.id);for(let i=0;i<20;i++){move(0,0,'GameOverUI');step(25);move(b.x,b.y,'GameOverUI');step(25);}move(0,0,'GameOverUI');step(35);ok(near(b.scale,1,.0001),'twenty hover cycles restore base: '+b.id);}
 ok(snapshot()===frozen&&(A.stats.requested.GameOver||0)===1,'long menu interaction changes no gameplay and never repeats defeat audio');
 if(mode==='menu')return{checks,phase:go.phase,age:go.age,opacity:go.overlayOpacity,buttons:go.buttons.map(b=>b.rect)};
 const restart=go.buttons[0];click(restart.x,restart.y,'GameOverUI');ok(go.phase==='LEAVING'&&go.leaving.target==='Game Scene','Restart locks a native gameplay reload');
 step(25);await enter('Game Scene');const N=S.getVariables(),newGo=S.__gameOverUI;
 ok(go.disposed&&go.root.destroyed&&go.requests===1&&!newGo.active&&!S.getLayer('GameOverUI').isVisible(),'Restart disposes old overlay and creates no visible new overlay');
 ok(['Money','Lives','Wave'].every(n=>N.get(n).getAsNumber()===defaults[n])&&!N.get('GameOver').getAsBoolean()&&!N.get('WaveActive').getAsBoolean(),'Restart restores authored Gold/Lives/Wave and run flags');
 ok(S.getObjects('Enemy').length===0&&S.getObjects('StarCannonProjectile').length===0&&S.getObjects('StarCannonTower').length===0&&!S.__freePlacement.active&&!S.__fusion.active&&S.getLayer('').getTimeScale()===1,'Restart clears actors, projectiles, towers, ghosts and frozen world');
 ok(G.__fusionArchive===archive&&archive.has('StarburstCannon')&&S.__monsterDiscovery.session===session&&S.__monsterDiscovery.has('Basic'),'Restart preserves Fusion and Monster discoveries');
 await wait(50);ok(JSON.stringify(S.__audio.settings)===JSON.stringify(settings)&&S.__audio.unlocked,'Restart preserves audio preferences and trusted gesture');
 const card=S.__towerShopUI.cards[0].background;click(card.getCenterXInScene(),card.getCenterYInScene(),card.getLayer());click(300,352);const tower=S.getObjects('StarCannonTower')[0];ok(!!tower&&N.get('Money').getAsNumber()===defaults.Money-300,'real placement works after Restart at unchanged300Gold');
 ok(S.__starCannon.upgrade(tower,1),'normal tower upgrade works after Restart');
 await wait(300);
 N.get('IndexOpen').setBoolean(true);S.__unitIndex.category='Monsters';step(3);ok(S.__unitIndex.cards[0].name.getString()==='Nova Wisp','Index retains discovered name after Restart');N.get('IndexOpen').setBoolean(false);step(2);
 // Defeat again through the actual Finish path in the fresh run.
 const newPoints=N.get('MonsterPathPoints').toJSObject(),last=newPoints.at(-1),prev=newPoints.at(-2),enemy=S.createObject('Enemy');S.__novaWisp.ensure(enemy);enemy.setPosition(last.X-enemy.getWidth()/2,last.Y-enemy.getHeight()/2);enemy.getVariables().get('Waypoint').setNumber(newPoints.length-1);N.get('Lives').setNumber(1);step(3);
 ok(newGo.active&&newGo.activations===1&&N.get('Lives').getAsNumber()===0,'fresh run can lose normally again without duplicate activation');
 await wait(350);
 I.onMouseButtonReleased(0);until(()=>newGo.phase==='AWAIT_CONTINUE');click(15,15,'GameOverUI');until(()=>newGo.phase==='MENU');const back=newGo.buttons[1];click(back.x,back.y,'GameOverUI');step(25);await enter('MainMenu');
 ok(newGo.disposed&&newGo.root.destroyed&&newGo.requests===1&&!S.__gameOverUI&&S.__mainMenu.objects.MenuStart,'Main Menu returns to existing lobby with no defeat UI carried over');
 await wait(600);
 const main=S.__mainMenu;click(main.buttons[0].x,main.buttons[0].y,'MenuUI');step(25);await enter('Levels');ok(!S.__starCannon,'lobby Start requires mission selection');await wait(350);
 const U=S.__levelsUI;click(U.skip.rect.x+U.skip.rect.w/2,U.skip.rect.y+U.skip.rect.h/2,'CampaignUI');click(U.launch.rect.x+U.launch.rect.w/2,U.launch.rect.y+U.launch.rect.h/2,'CampaignUI');step(25);await enter('Game Scene');
 ok(!S.__gameOverUI.active&&S.getVariables().get('Lives').getAsNumber()===S.__campaignRun.level.StartingLives&&S.getObjects('StarCannonTower').length===0,'explicit mission launch initializes one clean run');
 ok(S.__monsterDiscovery.has('Basic')&&G.__fusionArchive.has('StarburstCannon')&&JSON.stringify(S.__audio.settings)===JSON.stringify(settings),'lobby round trip preserves progression and settings');
 // Existing positive-Lives victory is deliberately outside the loss sequence.
 S.getVariables().get('GameOver').setBoolean(true);S.getVariables().get('Wave').setNumber(S.getVariables().get('MaximumWave').getAsNumber());step(3);ok(!S.__gameOverUI.active&&!S.getVariables().get('DefeatActive').getAsBoolean(),'positive-Lives victory never activates defeat overlay');
 return{checks,defeatActivations:go.activations,continues:go.continues,sceneRequests:[go.requests,newGo.requests],singleOverlayChildren:children,defaults,preservedSettings:settings,actualFinishLoss:true};
})()
