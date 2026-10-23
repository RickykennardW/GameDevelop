// A loss-only overlay. Native Lives/Finish and victory rules remain authoritative.
const scene=runtimeScene,sv=scene.getVariables(),game=scene.getGame(),input=game.getInputManager();
let go=scene.__gameOverUI;
if(!go){
 const config=sv.get('GameOverUIConfig').toJSObject(),menuData=game.getSceneAndExtensionsData('MainMenu').sceneData;
 const hoverScale=new gdjs.VariablesContainer(menuData.variables).get('MenuConfig').getChild('HoverScale').getAsNumber();
 game.__starfallHoverStep ||= ((current,target,dt)=>current+(target-current)*(1-Math.exp(-dt*16)));
 go=scene.__gameOverUI={config,hoverScale,active:false,phase:'IDLE',age:0,wasDown:input.isMouseButtonPressed(0),armed:false,menuArmed:false,pressed:'',buttons:[],activations:0,continues:0,requests:0,disposed:false};
 const layer=scene.getLayer('GameOverUI'),parent=layer.getRenderer().getRendererObject();
 const root=go.root=new PIXI.Container();root.interactive=false;root.interactiveChildren=false;root.visible=false;root.zIndex=0;parent.addChild(root);
 const overlay=go.overlay=new PIXI.Graphics();root.addChild(overlay);
 const ornament=go.ornament=new PIXI.Graphics();root.addChild(ornament);
 const title=go.title=new PIXI.Text('GAME OVER',{fontFamily:'Georgia, serif',fontSize:52,fill:0xf0e7ed,letterSpacing:3,dropShadow:true,dropShadowColor:0x180919,dropShadowBlur:8,dropShadowDistance:1,dropShadowAlpha:.65});title.anchor.set(.5);root.addChild(title);
 const prompt=go.prompt=new PIXI.Text('CLICK TO CONTINUE',{fontFamily:'Arial',fontSize:11,letterSpacing:2,fill:0xd4becb});prompt.anchor.set(.5);root.addChild(prompt);
 const smooth=n=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n);};
 const mix=(a,b,t)=>{let color=0;for(const shift of [16,8,0])color|=Math.round(((a>>shift)&255)*(1-t)+((b>>shift)&255)*t)<<shift;return color;};
 go.phaseTo=phase=>{go.phase=phase;sv.get('DefeatPhase').setString(phase);};
 go.block=()=>{
  if(!go.active)return;
  sv.get('GameOver').setBoolean(true);sv.get('DefeatActive').setBoolean(true);sv.get('WaveMode').setString('Waiting');
  sv.get('IndexOpen').setBoolean(false);sv.get('IndexBlocksInput').setBoolean(true);sv.get('TowerUIConsumesClick').setBoolean(true);sv.get('AudioUIConsumesClick').setBoolean(true);
  sv.get('PlayWaveRequested').setBoolean(false);sv.get('TowerShopRequestedType').setString('');
  scene.getTimeManager().setTimeScale(1);scene.getLayer('').setTimeScale(0);
  for(const name of ['IndexUI','IndexList','IndexDetail','SelectedTowerUI','ObstacleUI','FusionUI','DiscoveryUI','AudioUI'])scene.getLayer(name).show(false);
  if(scene.__towerShopUI)scene.__towerShopUI.indexRequested=false;
 };
 go.begin=()=>{
  if(go.active||sv.get('Lives').getAsNumber()>0)return false;
  go.active=true;go.activations++;go.age=0;go.wasDown=input.isMouseButtonPressed(0);go.armed=false;go.menuArmed=false;go.phaseTo('RED_FADE');
  if(scene.__fusion?.active)scene.__fusion.finish();scene.__freePlacement?.stop();scene.__obstaclePanel?.close();sv.get('SelectedTower').setNumber(0);
  if(scene.__audio){scene.__audio.ui.open=false;scene.__audio.ui.drag='';scene.__audio.ui.pressed='';if(scene.__audio.dirty)scene.__audio.persist();}
  for(const name of ['MessageText','WaveBannerPanel','WaveBannerTitle','WaveBannerDetail','WaveBannerReward'])for(const o of scene.getObjects(name))o.hide();
  const lives=scene.getObjects('LivesText')[0];if(lives)lives.setString(String(sv.get('Lives').getAsNumber()));
  const buttons=[['Restart','DefeatRestart','DefeatRestartLabel'],['MainMenu','DefeatMainMenu','DefeatMainMenuLabel']];if(scene.__campaignRun)buttons.push(['Levels','DefeatLevels','DefeatLevelsLabel']);
  for(const [id,frameName,labelName]of buttons){
   const frame=scene.createObject(frameName),label=scene.createObject(labelName);frame.setLayer('GameOverUI');label.setLayer('GameOverUI');frame.setZOrder(3);label.setZOrder(4);frame.hide();label.hide();go.buttons.push({id,frame,label,scale:1});
  }
  go.block();root.visible=true;layer.show(true);return true;
 };
 go.stopDefeatSound=()=>{for(const v of scene.__audio?.voices||[])if(v.key==='GameOver'){v.sound?.stop();v.end=0;}};
 go.leave=target=>{
  if(go.leaving||go.phase!=='MENU')return false;
  go.stopDefeatSound();scene.__audio?.play('UIClick');go.leaving={target,age:0};go.pressed='';go.phaseTo('LEAVING');
  return true;
 };
 go.paint=()=>{
  if(!go.active)return;
  const W=game.getGameResolutionWidth(),H=game.getGameResolutionHeight(),view=game.__celestialViewport;
  const scale=Math.min(W/1280,H/720,1.5),display=Math.min((view?.width||W)/W,(view?.height||H)/H),key=[W,H,view?.width,view?.height].join(':');
  layer.setCameraZoom(1);layer.setCameraX(W/2);layer.setCameraY(H/2);layer.show(true);
  if(go.layoutKey!==key){
   go.layoutKey=key;go.layoutCount=(go.layoutCount||0)+1;overlay.clear().beginFill(0xffffff).drawRect(0,0,W,H).endFill();
   ornament.clear().lineStyle(1,0xc2a5aa,.55).moveTo(-146,0).lineTo(-18,0).moveTo(18,0).lineTo(146,0).beginFill(0xd6b7bd,.7).drawPolygon([0,-4,4,0,0,4,-4,0]).endFill();
   title.style.fontSize=52*scale;title.style.letterSpacing=3*scale;prompt.style.fontSize=Math.max(11*scale,10/display);prompt.style.letterSpacing=1.5*scale;
   for(const b of go.buttons){b.label.setCharacterSize(Math.max(b.id==='Restart'?18:15,Math.ceil((b.id==='Restart'?12:11)/(scale*display))));b.label.setWrapping(true);b.label.setWrappingWidth(320*scale);b.label.setTextAlignment('center');}
  }
  const black=go.blackStart!==undefined?smooth((go.age-go.blackStart)/config.BlackSeconds):0;
  go.blackProgress=black;go.overlayTint=mix(config.RedTint,config.BlackTint,black);overlay.tint=go.overlayTint;
  const red=config.InitialOpacity+(config.RedOpacity-config.InitialOpacity)*smooth(go.age/config.RedSeconds);
  overlay.alpha=(red*(1-black)+config.BlackOpacity*black)*Math.min(1,go.age/.12);
  if(go.leaving)overlay.alpha=config.BlackOpacity+(1-config.BlackOpacity)*smooth(go.leaving.age/config.LeaveSeconds);
  go.overlayOpacity=overlay.alpha;
  const reveal=smooth((go.age-config.RedSeconds)/config.TitleSeconds),ty=H/2-105*scale*black;
  title.position.set(W/2,ty);title.alpha=reveal;title.scale.set(.985+.015*reveal);
  prompt.position.set(W/2,H/2+60*scale);prompt.alpha=smooth((go.age-config.RedSeconds-config.TitleSeconds)/config.PromptSeconds)*(1-black);
  ornament.position.set(W/2,ty-49*scale);ornament.scale.set(scale);ornament.alpha=reveal*.75;
  const buttonsAlpha=go.blackStart===undefined?0:smooth((go.age-go.blackStart-config.BlackSeconds)/config.ButtonsSeconds);
  const mx=gdjs.evtTools.input.getCursorX(scene,'GameOverUI',0),my=gdjs.evtTools.input.getCursorY(scene,'GameOverUI',0);
  go.hover='';
  for(const [i,b]of go.buttons.entries()){
   b.x=W/2;b.y=H/2+(12+83*i)*scale;
   const current=320*scale*b.scale,height=72*scale*b.scale;
   const hot=go.phase==='MENU'&&mx>=b.x-current/2&&mx<b.x+current/2&&my>=b.y-height/2&&my<b.y+height/2;
   if(hot)go.hover=b.id;
   b.scale=game.__starfallHoverStep(b.scale,hot?hoverScale:1,go.dt||0);
   b.frame.setAnimationName(hot?'Hover':'Normal');b.frame.setScale(scale*b.scale);b.frame.setPosition(b.x-b.frame.getWidth()/2,b.y-b.frame.getHeight()/2);
   // Match native wrapped Text's width, independent of the frame's hover scale.
   b.label.setScale(scale);b.label.setPosition(b.x-b.label.getWidth()/2,b.y-b.label.getHeight()/2);
   for(const o of [b.frame,b.label]){o.hide(buttonsAlpha<=0);o.setOpacity(255*buttonsAlpha);}
   b.rect={x:b.frame.getX(),y:b.frame.getY(),w:b.frame.getWidth(),h:b.frame.getHeight()};
  }
  const canvas=game.getRenderer().getCanvas();if(canvas)canvas.style.cursor=go.hover||go.phase==='AWAIT_CONTINUE'?'pointer':'default';
 };
 go.pre=()=>{if(!go.active&&sv.get('Lives').getAsNumber()<=0)go.begin();go.block();};
 go.update=()=>{
  if(go.disposed)return;
  if(!go.active){if(sv.get('Lives').getAsNumber()<=0)go.begin();else return;}
  go.block();const t=scene.getTimeManager(),scale=t.getTimeScale();go.dt=scale>0?Math.min(.1,Math.max(0,t.getElapsedTime()/scale/1000)):0;go.age+=go.dt;
  const down=input.isMouseButtonPressed(0),fresh=down&&!go.wasDown,readyAt=config.RedSeconds+config.TitleSeconds+config.PromptSeconds;
  if(go.phase==='RED_FADE'&&go.age>=config.RedSeconds)go.phaseTo('TITLE');
  if(go.phase==='TITLE'&&go.age>=readyAt){go.phaseTo('AWAIT_CONTINUE');go.armed=!down;}
  if(go.phase==='AWAIT_CONTINUE'){
   if(!down)go.armed=true;
   if(fresh&&go.armed){go.continues++;go.blackStart=go.age;go.phaseTo('MENU_TRANSITION');scene.__audio?.play('UIClick');}
  }
  if(go.phase==='MENU_TRANSITION'&&go.age>=go.blackStart+config.BlackSeconds+config.ButtonsSeconds){go.phaseTo('MENU');go.menuArmed=!down;}
  go.paint();
  if(go.phase==='MENU'){
   if(!down)go.menuArmed=true;
   if(fresh&&go.menuArmed)go.pressed=go.hover;
   if(!down&&go.wasDown&&go.pressed&&go.pressed===go.hover)go.leave(go.pressed==='Restart'?scene.getName():go.pressed==='Levels'?'Levels':'MainMenu');
   if(!down)go.pressed='';
  }
  if(go.leaving){go.leaving.age+=go.dt;if(go.leaving.age>=config.LeaveSeconds&&!go.leaving.requested){go.leaving.requested=true;go.requests++;gdjs.evtTools.runtimeScene.replaceScene(scene,go.leaving.target,false);}}
  go.wasDown=down;
 };
 go.dispose=()=>{if(go.disposed)return;go.disposed=true;if(go.leaving)game.__starfallMenuAudioReady=!!scene.__audio?.unlocked;go.stopDefeatSound();root.destroy({children:true});const canvas=game.getRenderer().getCanvas();if(canvas)canvas.style.cursor='default';};
 if(!gdjs.__starfallDefeatCallbacks){gdjs.__starfallDefeatCallbacks=true;gdjs.callbacksRuntimeScenePreEvents.push(s=>s.__gameOverUI?.pre());gdjs.callbacksRuntimeScenePostEvents.push(s=>{
  const g=s.getGame();if(g.__starfallMenuAudioReady&&s.__audio){delete g.__starfallMenuAudioReady;s.__audio.unlock();}
  s.__gameOverUI?.update();
 });gdjs.callbacksRuntimeSceneUnloading.push(s=>s.__gameOverUI?.dispose());}
}
// First-frame detection also covers a loss reached by the native Finish event.
if(!go.active&&sv.get('Lives').getAsNumber()<=0)go.begin();
