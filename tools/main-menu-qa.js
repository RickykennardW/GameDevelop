(async()=>{
 const G=testGame,S=G.getSceneStack().getCurrentScene(),M=S.__mainMenu,I=G.getInputManager(),checks=[],mode=globalThis.BALANCE_MODE||'full';G.pause(true);
 const ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);},wait=ms=>new Promise(r=>setTimeout(r,ms));
 const step=(n=1)=>{for(let i=0;i<n;i++){G.getSceneStack().step(16.667);I.onFrameEnded();}};
 const move=(x,y)=>{I.onMouseMove(x,y);step();};const click=(b)=>{move(b.x,b.y);I.onMouseButtonPressed(0);step();I.onMouseButtonReleased(0);step();};
 step(35);const W=G.getGameResolutionWidth(),H=G.getGameResolutionHeight(),O=M.objects;
 ok(S.getName()==='MainMenu'&&G.getGameData().firstLayout==='MainMenu','MainMenu is configured startup scene');
 ok(!S.__starCannon&&!G.__fusionArchive&&!G.__celestialMonsterDiscoverySession,'gameplay does not run behind menu');
 ok(S.getObjects('MenuStart').length===1&&S.getObjects('MenuExit').length===1,'exactly one native button per action');
 ok(Math.abs(O.MenuTitle.getCenterXInScene()-W/2)<.1&&O.MenuTitle.getY()>0&&O.MenuTitle.getY()+O.MenuTitle.getHeight()<M.buttons[0].rect.y,'title centered above buttons without overlap');
 for(const b of M.buttons){ok(Math.abs(b.x-W/2)<.1&&b.rect.x>=0&&b.rect.y>=0&&b.rect.x+b.rect.w<=W&&b.rect.y+b.rect.h<=H,'button centered inside viewport: '+b.id);ok(Math.abs(b.frame.getScaleX()-b.frame.getScaleY())<.00001,'button artwork keeps aspect ratio: '+b.id);}
 ok(O.MenuBackground.getWidth()>=W-.1&&O.MenuBackground.getHeight()>=H-.1,'background covers viewport without stretching');
 ok(Math.abs(O.MenuBackground.getWidth()/O.MenuBackground.getHeight()-1672/941)<.002,'original background aspect ratio preserved');
 const layout=M.layoutCount;step(10);ok(M.layoutCount===layout,'unchanged viewport does not rebuild layout');
 const vw=gdjs.RuntimeGameRenderer.getWindowInnerWidth,vh=gdjs.RuntimeGameRenderer.getWindowInnerHeight;
 try{gdjs.RuntimeGameRenderer.getWindowInnerWidth=()=>0;gdjs.RuntimeGameRenderer.getWindowInnerHeight=()=>0;G.onWindowInnerSizeChanged();step(3);ok(G.getGameResolutionWidth()===W&&G.getGameResolutionHeight()===H&&M.layoutCount===layout,'zero/minimized viewport retains last valid layout');}finally{gdjs.RuntimeGameRenderer.getWindowInnerWidth=vw;gdjs.RuntimeGameRenderer.getWindowInnerHeight=vh;G.onWindowInnerSizeChanged();step();}
 if(mode==='screenshot'||mode==='resize')return{checks,viewport:[innerWidth,innerHeight],logical:[W,H],title:[O.MenuTitle.getX(),O.MenuTitle.getY(),O.MenuTitle.getWidth(),O.MenuTitle.getHeight()],buttons:M.buttons.map(b=>b.rect),layoutCount:M.layoutCount,invalidSizeSimulation:true};
 for(const b of M.buttons){
  move(b.x,b.y);ok(b.scale>1&&b.scale<M.config.HoverScale,'hover interpolates smoothly from base: '+b.id);step(25);
  ok(b.scale>=1.05&&b.scale<=1.0601&&b.frame.getAnimationName()==='Hover'&&G.getRenderer().getCanvas().style.cursor==='pointer','hover reaches stable1.06 and highlights: '+b.id);
  for(let i=0;i<20;i++){move(0,0);step(25);move(b.x,b.y);step(25);}move(0,0);step(35);
  ok(Math.abs(b.scale-1)<.0001&&b.frame.getAnimationName()==='Normal','twenty hover cycles restore exact base: '+b.id);
 }
 ok(M.audio.starts<=1,'menu music is started at most once per scene');
 if(M.audio.music){await wait(60);ok(M.audio.music.playing()&&Math.abs(M.audio.music.getVolume()-M.settings.Master/100*M.settings.Music/100)<.005,'native Sacred Void Temple plays at saved mix level');}
 const renderer=G.getRenderer(),stop=renderer.stopGame;let quits=0;renderer.stopGame=function(...args){quits++;return stop.apply(this,args);};
 try{click(M.buttons[1]);step(12);ok(quits===1&&M.exitAttempts===1,'Exit invokes actual supported GDevelop quit path once');ok(G.getSceneStack().getCurrentScene()===S&&M.exitPlatform==='browser'&&O.MenuStatus.getString().includes('cannot close'),'browser no-op quit stays on menu with honest close-tab message');}finally{renderer.stopGame=stop;}
 localStorage.setItem('starfallMenuUnrelatedCheck','preserve');
 localStorage.setItem('celestialVoidFusionDiscovery.v1',JSON.stringify({version:1,entries:{StarburstCannon:{discovered:true,variants:{pure_52_25:true}}}}));
 click(M.buttons[0]);ok(!!M.transition&&M.sceneRequests===0,'Start enters one guarded fade transition');I.onMouseButtonPressed(0);step(5);I.onMouseButtonReleased(0);step();G.pause(false);
 for(let i=0;i<200;i++){if(G.getSceneStack().getCurrentScene()?.__starCannon)break;await wait(25);}G.pause(true);
 const next=G.getSceneStack().getCurrentScene();ok(next.getName()==='Game Scene'&&!!next.__starCannon,'Start enters existing Game Scene via native scene request');
 next.renderAndStep(16.667);I.onFrameEnded();await wait(30);
 ok(M.disposed&&M.fade.destroyed&&M.particles.destroyed&&M.sceneRequests===1,'menu nodes/audio/listeners released and transition requested once');
 ok(next.getObjects('Monster_Path').length===82&&next.__towerShopUI.cards.length===1&&next.getObjects('StarCannonTower').length===0,'original map and one-card shop initialize once');
 ok(next.getVariables().get('Money').getAsNumber()===50000&&next.getVariables().get('Lives').getAsNumber()===10&&next.getVariables().get('Wave').getAsNumber()===0,'gameplay keeps current Gold/Lives/Wave initialization');
 ok(G.__fusionArchive.has('StarburstCannon')&&localStorage.getItem('starfallMenuUnrelatedCheck')==='preserve','Start preserves archive and unrelated saved progress');
 ok(next.__audio.unlocked,'trusted menu audio gesture transfers to existing gameplay mixer');
 return{checks,exit:{nativeQuitCalls:quits,actualPlatform:M.exitPlatform,desktopCloseNotTested:true},transition:{scene:next.getName(),requests:M.sceneRequests},audio:{menuStarts:M.audio.starts,clicks:M.audio.clicks,gameplayUnlocked:next.__audio.unlocked},nodes:M.particles.children?.length||0};
})()
