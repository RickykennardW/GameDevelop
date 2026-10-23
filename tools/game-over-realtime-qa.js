// Wall-clock native preview: no accelerated frames and no replacement audio.
(async()=>{
 const G=testGame,I=G.getInputManager(),checks=[],wait=ms=>new Promise(r=>setTimeout(r,ms));
 let S=G.getSceneStack().getCurrentScene();G.pause(false);
 const ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
 const until=async(fn,label)=>{for(let i=0;i<250&&!fn();i++)await wait(40);ok(fn(),label);};
 const click=async(x,y,layer)=>{I.onMouseMove(...S.getLayer(layer).convertInverseCoords(x,y,0,[0,0]));I.onMouseButtonPressed(0);await wait(60);I.onMouseButtonReleased(0);await wait(60);};
 await wait(500);ok(S.__audio.unlocked,'native audio unlocked by browser gesture');
 const finish=()=>{const V=S.getVariables(),p=V.get('MonsterPathPoints').toJSObject().at(-1),e=S.createObject('Enemy');S.__novaWisp.ensure(e);e.setPosition(p.X-e.getWidth()/2,p.Y-e.getHeight()/2);e.getVariables().get('Waypoint').setNumber(V.get('MonsterPathPoints').toJSObject().length-1);V.get('Lives').setNumber(1);};
 finish();await until(()=>S.__gameOverUI.active,'real-time Finish triggers actual defeat');const first=S.__gameOverUI,A=S.__audio;
 await wait(400);ok(first.phase==='RED_FADE'&&first.overlayOpacity<.6&&first.title.alpha===0,'real-time red fade precedes title');
 const voice=A.voices.find(v=>v.key==='GameOver');ok(voice?.sound?.playing()&&voice.sound.getVolume()>0,'native defeat audio actually plays at configured volume');
 await until(()=>first.phase==='AWAIT_CONTINUE','real-time title and instruction complete');
 ok((A.stats.played.GameOver||0)===1&&S.getVariables().get('Lives').getAsNumber()===0,'one defeat sound and no repeated Lives damage');
 await click(20,20,'GameOverUI');await until(()=>first.phase==='MENU','real-time click reveals black menu');
 ok(Math.abs(first.overlayOpacity-.7)<.001&&S.getLayer('').getTimeScale()===0,'black menu stays translucent and world frozen');
 const b=first.buttons[0];await click(b.x,b.y,'GameOverUI');await until(()=>G.getSceneStack().getCurrentScene()!==S,'Restart performs native scene replacement');S=G.getSceneStack().getCurrentScene();
 await until(()=>!!S.__audio&&S.__audio.unlocked,'Restart retains audio unlock');await wait(600);
 ok(S.getName()==='Game Scene'&&!S.__gameOverUI.active&&S.getVariables().get('Lives').getAsNumber()===10,'new run starts without defeat overlay');
 S.__audio.setSetting('MuteSFX',true);S.__audio.persist();finish();await until(()=>S.__gameOverUI.active,'second real-time Finish works');const second=S.__gameOverUI;
 await wait(450);ok((S.__audio.stats.requested.GameOver||0)===1&&!(S.__audio.stats.played.GameOver||0)&&!S.__audio.voices.some(v=>v.key==='GameOver'&&v.sound?.playing()),'defeat respects saved SFX mute');
 await until(()=>second.phase==='AWAIT_CONTINUE','muted defeat still animates');await click(20,20,'GameOverUI');await until(()=>second.phase==='MENU','second menu becomes interactive');
 const back=second.buttons[1];await click(back.x,back.y,'GameOverUI');await until(()=>G.getSceneStack().getCurrentScene()!==S,'Main Menu performs native scene replacement');S=G.getSceneStack().getCurrentScene();await wait(1000);
 ok(S.getName()==='MainMenu'&&!S.__gameOverUI&&S.__mainMenu.settings.MuteSFX,'lobby has no defeat overlay and preserves mute');
 const start=S.__mainMenu.buttons[0];await click(start.x,start.y,'MenuUI');await until(()=>G.getSceneStack().getCurrentScene()?.__levelsUI,'lobby Start opens Levels');S=G.getSceneStack().getCurrentScene();await wait(700);const U=S.__levelsUI;
 await click(U.skip.rect.x+U.skip.rect.w/2,U.skip.rect.y+U.skip.rect.h/2,'CampaignUI');await click(U.launch.rect.x+U.launch.rect.w/2,U.launch.rect.y+U.launch.rect.h/2,'CampaignUI');await until(()=>!!G.getSceneStack().getCurrentScene()?.__campaignRun,'explicit launch enters gameplay');S=G.getSceneStack().getCurrentScene();await wait(700);
 ok(S.getVariables().get('Lives').getAsNumber()===S.__campaignRun.level.StartingLives&&!S.__gameOverUI.active&&S.__audio.settings.MuteSFX,'complete real-time round trip preserves preferences');G.pause(true);
 return{checks,actualWallClockFrames:true,audioPlayed:true,muteVerified:true,scene:S.getName()};
})()
