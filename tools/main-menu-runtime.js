// Starfall Bastion title scene. The gameplay scene remains its own initializer.
const scene=runtimeScene,game=scene.getGame(),input=game.getInputManager();
let menu=scene.__mainMenu;
if(!menu){
 const config=scene.getVariables().get('MenuConfig').toJSObject();
 menu=scene.__mainMenu={config,age:0,down:false,pressed:'',hover:'',focus:'',transition:null,disposed:false,layoutCount:0,exitAttempts:0,sceneRequests:0};
 menu.objects=Object.fromEntries(['MenuBackground','MenuTitle','MenuStart','MenuExit','MenuStartLabel','MenuExitLabel','MenuSubtitle','MenuStatus'].map(n=>[n,scene.getObjects(n)[0]||scene.createObject(n)]));
 menu.buttons=['Start','Exit'].map(id=>({id,frame:menu.objects['Menu'+id],label:menu.objects['Menu'+id+'Label'],scale:1}));
 const gameplay=game.getSceneAndExtensionsData(config.GameplayScene).sceneData;
 const audio=new gdjs.VariablesContainer(gameplay.variables.filter(v=>v.name==='AudioConfig')).get('AudioConfig').toJSObject();
 let saved=game.__celestialAudioSettings;try{if(!saved)saved=JSON.parse(localStorage.getItem(audio.StorageKey)||'null');}catch(e){}
 menu.settings={Master:audio.Master,Music:audio.MusicVolume,SFX:audio.SFXVolume,UI:audio.UIVolume,MuteMusic:false,MuteSFX:false,...saved};
 menu.audioConfig=audio;menu.audio={music:null,unlocked:false,starts:0,clicks:0,gain:0};
 const sound=scene.getSoundManager();
 menu.unlock=()=>{
  if(menu.disposed||menu.audio.unlocked)return;
  if(typeof Howler!=='undefined')Howler.volume();
  const ctx=typeof Howler!=='undefined'?Howler.ctx:null;
  Promise.resolve(ctx?.state==='suspended'?ctx.resume():null).then(()=>{
   if(menu.disposed||!ctx||ctx.state!=='running')return;
   menu.audio.unlocked=true;game.__starfallMenuAudioReady=true;
   const s=menu.settings;
   if(s.MuteMusic||!s.Master||!s.Music)return;
   sound.playSoundOnChannel(audio.Music.SacredVoidTemple.File,1000,true,0,1);menu.audio.music=sound.getSoundOnChannel(1000);menu.audio.starts++;
  }).catch(()=>{});
 };
 menu.clickSound=()=>{const s=menu.settings,d=audio.SFX.UIClick;if(!menu.audio.unlocked||s.MuteSFX||!s.Master)return;sound.playSoundOnChannel(d.File,1020,false,s.Master/100*s.UI/100*d.Gain*100,1);menu.audio.clicks++;};
 document.addEventListener('pointerdown',menu.unlock);document.addEventListener('keydown',menu.unlock);document.addEventListener('touchstart',menu.unlock,{passive:true});
 const parent=scene.getLayer('MenuUI').getRenderer().getRendererObject();
 menu.fade=new PIXI.Graphics();menu.fade.interactive=false;menu.fade.zIndex=100;parent.addChild(menu.fade);
 menu.particles=new PIXI.Container();menu.particles.interactive=false;menu.particles.interactiveChildren=false;menu.particles.zIndex=1;parent.addChild(menu.particles);
 for(let i=0;i<18;i++){const star=new PIXI.Graphics();star.beginFill(i%3?0xc1b8ec:0xc4e5ff).drawCircle(0,0,i%4?1:1.5).endFill();menu.particles.addChild(star);}
 menu.begin=()=>{if(menu.transition)return;menu.clickSound();menu.transition={age:0};};
 menu.exit=()=>{
  if(menu.age<(menu.nextExit||0)||menu.transition)return;
  menu.nextExit=menu.age+.5;menu.exitAttempts++;menu.clickSound();
  const renderer=game.getRenderer();let native=false;
  try{native=!!renderer.getElectronRemote?.()||!!(typeof navigator!=='undefined'&&navigator.app?.exitApp);}catch(e){}
  menu.exitPlatform=native?'native':'browser';
  menu.objects.MenuStatus.setString(native?'Closing Starfall Bastion...':'This browser cannot close the game tab. You can close this tab.');
  gdjs.evtTools.runtimeScene.stopGame(scene);
 };
 menu.dispose=()=>{
  if(menu.disposed)return;menu.disposed=true;
  document.removeEventListener('pointerdown',menu.unlock);document.removeEventListener('keydown',menu.unlock);document.removeEventListener('touchstart',menu.unlock);
  menu.audio.music?.stop();menu.fade.destroy();menu.particles.destroy({children:true});
  const canvas=game.getRenderer().getCanvas();if(canvas)canvas.style.cursor='default';
 };
 if(!gdjs.__starfallMenuCallbacks){gdjs.__starfallMenuCallbacks=true;gdjs.callbacksRuntimeSceneUnloading.push(s=>s.__mainMenu?.dispose());
  // A trusted menu gesture already resumed Howler. Hand it to the existing
  // gameplay audio owner once, without modifying its mixer or saved settings.
  gdjs.callbacksRuntimeScenePostEvents.push(s=>{const g=s.getGame();if(g.__starfallMenuAudioReady&&s.__audio){delete g.__starfallMenuAudioReady;s.__audio.unlock();}});
 }
}
const dt=Math.min(.1,Math.max(0,scene.getTimeManager().getElapsedTime()/1000));menu.age+=dt;
const vw=Math.round(gdjs.RuntimeGameRenderer.getWindowInnerWidth()),vh=Math.round(gdjs.RuntimeGameRenderer.getWindowInnerHeight());
if(game.getAdaptGameResolutionAtRuntime())game.setAdaptGameResolutionAtRuntime(false);
if(Number.isFinite(vw)&&Number.isFinite(vh)&&vw>=64&&vh>=64&&!document.hidden){
 menu.viewport={w:vw,h:vh};
 const factor=Math.max(1,960/vw,540/vh),w=Math.round(vw*factor),h=Math.round(vh*factor);
 if(game.getGameResolutionWidth()!==w||game.getGameResolutionHeight()!==h){game.setGameResolutionSize(w,h);scene.onGameResolutionResized();}
}
const W=game.getGameResolutionWidth(),H=game.getGameResolutionHeight(),scale=Math.min(W/1280,H/720,1.5),key=[W,H,menu.viewport?.w,menu.viewport?.h].join(':');
const layer=scene.getLayer('MenuUI');layer.setCameraZoom(1);layer.setCameraX(W/2);layer.setCameraY(H/2);
scene.getLayer('').setCameraZoom(1);scene.getLayer('').setCameraX(W/2);scene.getLayer('').setCameraY(H/2);
const O=menu.objects;
if(menu.layoutKey!==key){
 menu.layoutKey=key;menu.layoutCount++;menu.geometry={w:W,h:H,scale};
 const displayScale=Math.min((menu.viewport?.w||W)/W,(menu.viewport?.h||H)/H);
 // Keep action labels readable even when the renderer scales a small window.
 O.MenuStartLabel.setCharacterSize(Math.max(18,Math.ceil(12/(scale*displayScale))));
 O.MenuExitLabel.setCharacterSize(Math.max(15,Math.ceil(11/(scale*displayScale))));
 O.MenuSubtitle.setCharacterSize(Math.max(10,Math.ceil(8/(scale*displayScale))));
 O.MenuStatus.setCharacterSize(Math.max(12,Math.ceil(11/(scale*displayScale))));
 O.MenuBackground.setScale(1);const fit=Math.max(W/O.MenuBackground.getWidth(),H/O.MenuBackground.getHeight());O.MenuBackground.setScale(fit);O.MenuBackground.setPosition((W-O.MenuBackground.getWidth())/2,(H-O.MenuBackground.getHeight())/2);
 O.MenuTitle.setScale(scale);O.MenuTitle.setPosition((W-O.MenuTitle.getWidth())/2,H/2-150*scale-O.MenuTitle.getHeight()/2);
 for(const button of menu.buttons){button.x=W/2;button.y=H/2+(button.id==='Start'?72:155)*scale;button.baseScale=scale;button.rect={x:button.x-160*scale,y:button.y-36*scale,w:320*scale,h:72*scale};}
 for(const name of ['MenuSubtitle','MenuStatus']){const o=O[name];o.setScale(scale);o.setWrapping(true);o.setWrappingWidth(name==='MenuStatus'?600:500);o.setTextAlignment('center');}
 O.MenuSubtitle.setPosition(W/2-250*scale,H/2-62*scale);
 O.MenuStatus.setPosition(W/2-300*scale,H/2+218*scale);
 menu.fade.clear().beginFill(0x030510).drawRect(0,0,W,H).endFill();
}
const mx=gdjs.evtTools.input.getCursorX(scene,'MenuUI',0),my=gdjs.evtTools.input.getCursorY(scene,'MenuUI',0),down=input.isMouseButtonPressed(0);
const hit=menu.buttons.find(b=>mx>=b.rect.x&&mx<b.rect.x+b.rect.w&&my>=b.rect.y&&my<b.rect.y+b.rect.h)?.id||'';
menu.hover=menu.transition?'':hit;
if(down&&!menu.down&&!menu.transition)menu.pressed=hit;
if(!down&&menu.down&&!menu.transition&&menu.pressed&&menu.pressed===hit){if(hit==='Start')menu.begin();else menu.exit();}
if(!down)menu.pressed='';menu.down=down;
if(!menu.transition&&gdjs.evtTools.input.wasKeyJustPressed(scene,'Return'))menu.begin();
for(const b of menu.buttons){
 const target=menu.hover===b.id?menu.config.HoverScale:1;b.scale+=(target-b.scale)*(1-Math.exp(-dt*16));
 b.frame.setAnimationName(menu.hover===b.id?'Hover':'Normal');b.frame.setScale(b.baseScale*b.scale);b.frame.setPosition(b.x-b.frame.getWidth()/2,b.y-b.frame.getHeight()/2);
 b.label.setWrapping(true);b.label.setWrappingWidth(320);b.label.setTextAlignment('center');b.label.setScale(b.baseScale*b.scale);b.label.setPosition(b.x-160*b.baseScale*b.scale,b.y-b.label.getHeight()/2);
}
const canvas=game.getRenderer().getCanvas();if(canvas)canvas.style.cursor=menu.hover&&!menu.transition?'pointer':'default';
const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
menu.particles.children.forEach((star,i)=>{star.position.set(((i*137+71)%1280)/1280*W,((i*79+31)%720)/720*H+(reduced?0:Math.sin(menu.age*.12+i)*5*scale));star.alpha=.08+(reduced?.12:.16*(.5+.5*Math.sin(menu.age*.4+i)));});
menu.fade.alpha=Math.max(0,1-menu.age/.5);
if(menu.transition){menu.transition.age+=dt;menu.fade.alpha=Math.min(1,menu.transition.age/menu.config.TransitionSeconds);if(menu.transition.age>=menu.config.TransitionSeconds&&!menu.transition.requested){menu.transition.requested=true;menu.sceneRequests++;gdjs.evtTools.runtimeScene.replaceScene(scene,menu.config.GameplayScene,false);}}
if(menu.audio.music){const s=menu.settings,target=s.MuteMusic?0:s.Master/100*s.Music/100;menu.audio.gain+=(target-menu.audio.gain)*(1-Math.exp(-dt*2));menu.audio.music.setVolume(menu.audio.gain*(menu.transition?1-menu.fade.alpha:1));}
