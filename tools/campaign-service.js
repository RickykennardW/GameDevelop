// One persistent campaign owner; only this namespaced storage key is written.
const campaignGame=runtimeScene.getGame();
if(!campaignGame.__campaign){
 const config=runtimeScene.getVariables().get('CampaignConfig').toJSObject(),known=new Map(config.Levels.map(l=>[l.Id,l]));
 let saved={};try{saved=JSON.parse(localStorage.getItem(config.StorageKey)||'{}')||{};}catch(e){}
 const completed={};for(const level of config.Levels){if(!saved.Completed?.[level.Id])break;completed[level.Id]=true;}
 const c=campaignGame.__campaign={config,known,active:null,chapter:1,selected:'1-1',writes:0,save:{...saved,Version:1,Completed:completed,SelectTutorialDone:saved.SelectTutorialDone===true,GameTutorialDone:saved.GameTutorialDone===true}};
 c.frontier=()=>Math.min(config.Levels.length,Object.keys(c.save.Completed).length+1);
 c.chapterUnlocked=n=>Number.isInteger(n)&&n>=1&&n<=config.Chapters.length&&(n===1||!!c.save.Completed[config.Levels.find(l=>l.Chapter===n-1&&l.Boss)?.Id]);
 c.available=id=>known.has(id)&&known.get(id).Index<=c.frontier();
 c.persist=()=>{try{localStorage.setItem(config.StorageKey,JSON.stringify(c.save));c.storageOK=true;c.writes++;}catch(e){c.storageOK=false;}};
 c.launch=id=>{if(!c.available(id))return false;c.active=id;c.selected=id;c.chapter=known.get(id).Chapter;return true;};
 c.complete=run=>{
  if(!run||run!==run.scene.__campaignRun||run.level.Id!==c.active||!run.validVictory()||!c.available(c.active))return false;
  if(!c.save.Completed[c.active]){c.save.Completed[c.active]=true;c.persist();}return true;
 };
 c.tutorialDone=key=>{if(!c.save[key]){c.save[key]=true;c.persist();}};
 c.chapter=config.Levels[c.frontier()-1].Chapter;c.selected=config.Levels[c.frontier()-1].Id;
}
// PIXI is already the project's UI renderer. Text anchors are independent of
// decorative hover scaling, including at small physical viewport sizes.
if(!campaignGame.__campaignWidgets){
 campaignGame.__campaignWidgets=scene=>{
  const layer=scene.getLayer('CampaignUI'),root=new PIXI.Container();root.interactive=false;root.interactiveChildren=false;layer.getRenderer().getRendererObject().addChild(root);
  const u={scene,layer,root,down:scene.getGame().getInputManager().isMouseButtonPressed(0),pressed:'',hover:''};
  u.text=(value,size=14,color=0xc6c9e0,bold=false,parent=root)=>{const t=new PIXI.Text(value,{fontFamily:'Arial',fontSize:size,fill:color,fontWeight:bold?'bold':'normal',align:'center'});t.anchor.set(.5);parent.addChild(t);return t;};
  u.button=(id,label,parent=root)=>{const container=new PIXI.Container(),frame=new PIXI.Graphics();container.addChild(frame);parent.addChild(container);const text=u.text(label,14,0xe8e1d0,true,container);return{id,container,frame,text,enabled:true,visible:true};};
  u.place=(b,x,y,w,h,font=14)=>{b.container.position.set(x,y);b.rect={x:x-w/2,y:y-h/2,w,h};b.w=w;b.h=h;b.text.style.fontSize=font;b.text.position.set(0,0);};
  u.paint=(b,hot=false)=>{b.container.visible=b.visible!==false;const key=[b.w,b.h,hot,b.enabled].join(':');if(b.key===key)return;b.key=key;const g=b.frame;g.clear().lineStyle(1,hot?0xe4cf93:b.enabled?0x897658:0x3e3e55,.9).beginFill(hot?0x292343:0x11162b,b.enabled?.96:.65).drawRoundedRect(-b.w/2,-b.h/2,b.w,b.h,6).endFill();g.lineStyle(.7,0x747fae,.35).drawRoundedRect(-b.w/2+4,-b.h/2+4,b.w-8,b.h-8,3);b.text.alpha=b.enabled?1:.4;};
  u.input=buttons=>{const input=scene.getGame().getInputManager(),down=input.isMouseButtonPressed(0),x=gdjs.evtTools.input.getCursorX(scene,'CampaignUI',0),y=gdjs.evtTools.input.getCursorY(scene,'CampaignUI',0),hit=buttons.find(b=>b.visible!==false&&b.enabled!==false&&(b.hit?b.hit(x,y):b.rect&&x>=b.rect.x&&x<b.rect.x+b.rect.w&&y>=b.rect.y&&y<b.rect.y+b.rect.h));u.hover=hit?.id||'';if(down&&!u.down)u.pressed=u.hover;const action=!down&&u.down&&u.pressed===u.hover?u.hover:'';if(!down)u.pressed='';u.down=down;return action;};
  u.screen=()=>{const g=scene.getGame(),W=g.getGameResolutionWidth(),H=g.getGameResolutionHeight(),rect=g.getRenderer().getCanvas().getBoundingClientRect(),candidate=rect.width/W;if(Number.isFinite(candidate)&&candidate>0&&rect.width>=64&&rect.height>=64&&!document.hidden)u.lastDisplay=candidate;return{W,H,s:Math.min(W/1280,H/720,1.5),display:u.lastDisplay||1};};
  u.dispose=()=>{if(root.destroyed)return;const texts=[];const visit=n=>{if(n instanceof PIXI.Text)texts.push(n);else for(const c of n.children||[])visit(c);};visit(root);for(const text of texts)text.destroy({texture:true,baseTexture:true});root.destroy({children:true,texture:false,baseTexture:false});};return u;
 };
}
