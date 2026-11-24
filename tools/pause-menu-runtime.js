// Escape owns one modal at a time. Simulation and UI use separate clocks.
const scene=runtimeScene,game=scene.getGame(),sv=scene.getVariables();
if(scene.__pauseUI)return;
const input=game.getInputManager(),layer=scene.getLayer('GameOverUI');
const p=scene.__pauseUI={active:false,confirming:false,leaving:false,disposed:false,frameBlocked:false,age:0,down:input.isMouseButtonPressed(0),pressed:'',saved:null,escapeOwner:'',requests:0};
const root=p.root=new PIXI.Container();root.visible=false;root.interactive=false;root.interactiveChildren=false;root.zIndex=2;layer.getRenderer().getRendererObject().addChild(root);
const shade=p.shade=new PIXI.Graphics(),panel=p.panel=new PIXI.Graphics();root.addChild(shade,panel);
const text=(value,size,color,bold=false)=>{const t=new PIXI.Text(value,{fontFamily:bold?'Georgia, serif':'Arial',fontSize:size,fill:color,fontWeight:bold?'bold':'normal',align:'center'});t.anchor.set(.5);root.addChild(t);return t;};
p.title=text('PAUSED',34,0xf0e5c6,true);p.note=text('The battlefield is on hold.',13,0xaebfd8);p.hint=text('ESC  /  RESUME',10,0x8da9bd);
p.buttons=['resume','chapters','stay','return'].map(id=>{const g=new PIXI.Graphics();root.addChild(g);return{id,g,t:text(({resume:'RESUME',chapters:'RETURN TO CHAPTERS',stay:'STAY',return:'RETURN'})[id],13,0xe9e7dc),rect:null};});
p.block=()=>{p.frameBlocked=true;sv.get('PauseActive').setBoolean(p.active);sv.get('PauseFrameBlocked').setBoolean(true);scene.getTimeManager().setTimeScale(0);scene.getLayer('').setTimeScale(0);};
p.alignInputs=()=>{
 const down=input.isMouseButtonPressed(0);p.down=down;p.pressed='';
 for(const owner of [scene.__towerShopUI,scene.__freePlacement,scene.__worldSelection,scene.__unitIndex,scene.__fusion,scene.__selectedPanel,scene.__obstaclePanel])if(owner){owner.wasDown=down;owner.pressed='';owner.pressedControl='';owner.pressedCard=-1;}
 sv.get('TowerPointerWasDown').setBoolean(down);sv.get('PlayWaveRequested').setBoolean(false);
};
p.open=()=>{
 if(p.active||p.leaving||p.disposed||sv.get('Lives').getAsNumber()<=0||sv.get('GameOver').getAsBoolean()||sv.get('DefeatActive').getAsBoolean()||scene.__campaignRun?.transition||scene.__campaignRun?.finished||scene.__devCheats?.resetting||scene.__freshStart?.transition)return false;
 p.saved={sceneScale:scene.getTimeManager().getTimeScale(),worldScale:scene.getLayer('').getTimeScale(),waveMode:sv.get('WaveMode').getAsString(),layerVisible:layer.isVisible()};
 p.active=true;p.confirming=false;p.age=0;p.openedAt=typeof performance!=='undefined'?performance.now():Date.now();root.visible=true;layer.show(true);p.alignInputs();p.block();return true;
};
p.resume=()=>{
 if(!p.active||p.leaving)return false;
 p.active=false;p.confirming=false;root.visible=false;layer.show(p.saved.layerVisible);sv.get('PauseActive').setBoolean(false);
 scene.getTimeManager().setTimeScale(p.saved.sceneScale);scene.getLayer('').setTimeScale(p.saved.worldScale);
 // The closing input edge is shielded for the remainder of this frame.
 p.frameBlocked=true;sv.get('PauseFrameBlocked').setBoolean(true);p.alignInputs();p.releaseShield=true;return true;
};
p.returnToChapters=()=>{
 if(!p.active||p.leaving||p.disposed)return false;
 p.leaving=true;p.confirming=false;p.requests++;p.block();p.alignInputs();
 const C=game.__campaign;if(C&&scene.__campaignRun){C.chapter=scene.__campaignRun.level.Chapter;C.selected=scene.__campaignRun.level.Id;}
 game.__starfallMenuAudioReady=!!scene.__audio?.unlocked;
 // replaceScene unloads all native instances and invokes maintained owners' cleanup.
 gdjs.evtTools.runtimeScene.replaceScene(scene,C?.config.LevelsScene||'Levels',false);return true;
};
p.pre=()=>{
 if(p.disposed)return;
 p.frameBlocked=p.active||p.leaving;sv.get('PauseFrameBlocked').setBoolean(p.frameBlocked);sv.get('PauseActive').setBoolean(p.active);p.escapeOwner='';
 const element=typeof document!=='undefined'?document.activeElement:null;
 const typing=!!element&&(element.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(element.tagName));
 if(gdjs.evtTools.input.wasKeyJustPressed(scene,'Escape')){
  if(typing)p.escapeOwner='text';
  else if(p.active){p.escapeOwner='pause';if(p.confirming){p.confirming=false;p.alignInputs();}else p.resume();}
  else if(scene.__devCheats?.open&&!scene.__devCheats.obscured())p.escapeOwner='developer';
  else if(sv.get('IndexOpen').getAsBoolean())p.escapeOwner='index';
  else if(scene.__audio?.ui.open)p.escapeOwner='audio';
  else {p.escapeOwner='pause';p.open();}
 }
 if(p.active||p.leaving)p.block();
};
p.after=()=>{
 if(p.disposed)return;
 if(p.releaseShield){p.releaseShield=false;scene.getTimeManager().setTimeScale(p.saved.sceneScale);scene.getLayer('').setTimeScale(p.saved.worldScale);}
 if(!p.active){root.visible=false;return;}
 p.block();
 const W=game.getGameResolutionWidth(),H=game.getGameResolutionHeight(),canvas=game.getRenderer().getCanvas(),display=canvas.getBoundingClientRect().width/W;
 const area=scene.__towerShopUI?.gameArea,cx=area?(area.left+area.right)/2:W/2,cy=H/2;
 const scale=Math.max(.72,Math.min(1.15,H/720)),w=Math.min(420*scale,(area?area.right-area.left:W)-24),h=300*scale;
 const now=typeof performance!=='undefined'?performance.now():Date.now();p.age=Math.max(0,(now-p.openedAt)/1000);root.visible=true;root.alpha=Math.min(1,p.age/.16);
 layer.show(true);layer.setCameraZoom(1);layer.setCameraX(W/2);layer.setCameraY(H/2);
 shade.clear().beginFill(0x030714,.67).drawRect(0,0,W,H).endFill();
 panel.clear().lineStyle(1,0x7cabc5,.85).beginFill(0x0c1328,.96).drawRoundedRect(cx-w/2,cy-h/2,w,h,12).endFill();
 panel.lineStyle(1,0xe0bb79,.7).moveTo(cx-54*scale,cy-h/2+21*scale).lineTo(cx+54*scale,cy-h/2+21*scale);
 p.title.text=p.confirming?'RETURN TO CHAPTERS?':'PAUSED';p.title.style.fontSize=(p.confirming?22:34)*scale;p.title.position.set(cx,cy-91*scale);
 p.note.text=p.confirming?'Current match progress may be lost.':'The battlefield is on hold.';p.note.style.fontSize=Math.max(13*scale,10/display);p.note.position.set(cx,cy-48*scale);
 p.hint.text=p.confirming?'ESC  /  STAY':'ESC  /  RESUME';p.hint.style.fontSize=Math.max(10*scale,8/display);p.hint.position.set(cx,cy+124*scale);
 const mx=gdjs.evtTools.input.getCursorX(scene,'GameOverUI',0),my=gdjs.evtTools.input.getCursorY(scene,'GameOverUI',0),down=input.isMouseButtonPressed(0);let hover='';
 const ids=p.confirming?['stay','return']:['resume','chapters'];
 p.buttons.forEach(b=>{const i=ids.indexOf(b.id),visible=i>=0;b.g.visible=b.t.visible=visible;b.rect=null;if(!visible)return;
  const bh=Math.max(47*scale,28/display),row=Math.max(61*scale,bh+10*scale),r=b.rect={x:cx-w/2+28*scale,y:cy-12*scale+i*row,w:w-56*scale,h:bh};const hit=mx>=r.x&&mx<r.x+r.w&&my>=r.y&&my<r.y+r.h;if(hit)hover=b.id;
  b.g.clear().lineStyle(1,hit?0xedd195:0x526d90,.9).beginFill(hit?0x233952:0x14223a,.97).drawRoundedRect(r.x,r.y,r.w,r.h,5).endFill();b.t.position.set(cx,r.y+r.h/2);b.t.style.fontSize=Math.max(12*scale,9/display);
 });
 if(down&&!p.down)p.pressed=hover;
 if(!down&&p.down){const action=p.pressed===hover?hover:'';p.pressed='';if(action==='resume')p.resume();else if(action==='chapters'){p.confirming=true;p.alignInputs();}else if(action==='stay'){p.confirming=false;p.alignInputs();}else if(action==='return')p.returnToChapters();}
 p.down=down;
};
p.dispose=()=>{if(p.disposed)return;p.disposed=true;const labels=[p.title,p.note,p.hint,...p.buttons.map(b=>b.t)],textures=labels.map(t=>t.texture);for(const t of labels)t.destroy({texture:true,baseTexture:true});p.texturesReleased=textures.every(t=>!t.baseTexture||t.baseTexture.destroyed);root.destroy({children:true,texture:false,baseTexture:false});};
if(!gdjs.__celestialPauseCallbacks){gdjs.__celestialPauseCallbacks=true;gdjs.callbacksRuntimeScenePreEvents.unshift(s=>s.__pauseUI?.pre());gdjs.callbacksRuntimeScenePostEvents.push(s=>s.__pauseUI?.after());gdjs.callbacksRuntimeSceneUnloading.push(s=>s.__pauseUI?.dispose());}
p.pre();
