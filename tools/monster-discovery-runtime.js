// Archive state is presentation-only. The sole unlock caller is the native wave spawn.
const scene=runtimeScene,game=scene.getGame(),sv=scene.getVariables();
let d=scene.__monsterDiscovery;
if(!d){
 const types=sv.get('EnemyTypes').toJSObject(),definition=game.getSceneAndExtensionsData(scene.getName()).sceneData.objects.find(o=>o.name==='IndexMonsterImage');
 const animations=new Map(definition.animations.map(a=>[a.name,a.directions[0].sprites[0].image]));
 const ids=definition.animations.flatMap(animation=>Object.keys(types).filter(id=>types[id].Animation===animation.name));
 let session=game.__celestialMonsterDiscoverySession;
 if(!session){
  session=game.__celestialMonsterDiscoverySession={found:new Set(),queue:[],active:null,revision:0,stats:{unlocks:0,shown:0,sounds:0,completed:0}};
  // Explicit Restart/New Game calls this; ordinary scene changes do not.
  session.resetForNewGame=()=>{session.found.clear();session.queue.length=0;session.active=null;session.revision++;for(const key of Object.keys(session.stats))session.stats[key]=0;for(const key of game.__celestialDiscoveryOrder?.tickets.keys()||[])if(key.startsWith('monster:'))game.__celestialDiscoveryOrder.tickets.delete(key);};
  delete game.__celestialMonsterDiscovery;
  // Ignore all legacy discovery data. Remove only its old key, never settings.
  try{localStorage.removeItem('celestialVoidMonsterDiscovery.v1');}catch(e){}
 }
 d=scene.__monsterDiscovery={scope:'session',ids,types,session,found:session.found,queue:session.queue,get active(){return session.active;},set active(value){session.active=value;},get revision(){return session.revision;},ready:false,disposed:false,outlines:new Map(),indexPortraits:new Map(),textures:new Map(),ownedTextures:new Set(),portraits:sv.get('MonsterPortraitConfig').toJSObject(),stats:session.stats};
 d.ready=true;
 d.has=id=>d.found.has(id);
 d.resetForNewGame=session.resetForNewGame;
 d.onWaveSpawn=(enemy,id)=>{
  const wave=scene.__waveManager;
  if(d.disposed||!ids.includes(id)||d.has(id)||!sv.get('WaveActive').getAsBoolean()||sv.get('GameOver').getAsBoolean()||!wave||wave.queue[wave.index-1]!==id||!scene.getObjects('Enemy').includes(enemy)||enemy.getVariables().get('EnemyType').getAsString()!==id||enemy.getBehavior('Health').IsDead())return false;
  d.found.add(id);session.revision++;d.stats.unlocks++;d.queue.push(id);scene.__discoveryToast?.enqueue('monster',id);return true;
 };
 d.texture=id=>{
  if(d.textures.has(id))return d.textures.get(id);
  const meta=d.portraits[id],base=game.getImageManager().getPIXITexture(meta?.Image||animations.get(types[id].Animation));
  // Only atlases need frame extraction; individual PNGs remain shared unchanged.
  const texture=meta?.Frame?new PIXI.Texture(base.baseTexture,new PIXI.Rectangle(...meta.Frame)):base;
  if(meta?.Frame)d.ownedTextures.add(texture);
  if(texture)d.textures.set(id,texture);return texture;
 };
 d.fitPortrait=(sprite,id,x,y,width,height)=>{
  const texture=d.texture(id),bounds=d.portraits[id]?.VisualBounds||[0,0,texture.width,texture.height];sprite.texture=texture;
  sprite.anchor.set((bounds[0]+bounds[2]/2)/texture.width,(bounds[1]+bounds[3]/2)/texture.height);
  sprite.scale.set(Math.min(width/bounds[2],height/bounds[3]));sprite.position.set(x,y);sprite.rotation=0;
 };
 // One compact presentation style for every existing archive queue. Unlock and
 // persistence remain with their original owners; presentation never discovers.
 const layer=scene.getLayer('DiscoveryUI'),parent=layer.getRenderer().getRendererObject();
 const toast=scene.__discoveryToast={duration:3.2};
 // FIFO presentation across the existing independent discovery/save systems.
 // Tickets live only in this RuntimeGame, not in archive persistence.
 const order=game.__celestialDiscoveryOrder||(game.__celestialDiscoveryOrder={next:0,tickets:new Map()});
 const ticket=(kind,event)=>kind+':'+(typeof event==='string'?event:event.id+':'+event.variant);
 toast.enqueue=(kind,event)=>{const key=ticket(kind,event);if(!order.tickets.has(key))order.tickets.set(key,++order.next);return order.tickets.get(key);};
 toast.take=(kind,event)=>order.tickets.delete(ticket(kind,event));
 toast.canBegin=kind=>{
  const monster=d.queue[0],fusion=game.__fusionArchive?.queue[0];
  const m=monster?toast.enqueue('monster',monster):Infinity,f=fusion?toast.enqueue('fusion',fusion):Infinity;
  return kind==='monster'?m<=f:f<m;
 };
 toast.geometry=()=>{
  const area=scene.__towerShopUI.gameArea,hud=scene.getObjects('HUDPanel')[0];
  const top=scene.getLayer('UI').convertInverseCoords(hud.getX(),hud.getY(),0,[0,0]);
  const w=272,h=60;return{x:area.right-12-w,y:Math.max(4,top[1]-8),w,h,scale:1};
 };
 toast.create=z=>{
  const root=new PIXI.Container(),mask=new PIXI.Graphics();root.interactive=false;root.interactiveChildren=false;root.visible=false;root.zIndex=z;mask.zIndex=z-1;mask.interactive=false;parent.addChild(mask,root);root.mask=mask;
  const panel=new PIXI.Graphics();root.addChild(panel);
  panel.lineStyle(1,0xc5ab72,.9).beginFill(0x181027,.97).drawRoundedRect(0,0,272,60,7).endFill();
  panel.lineStyle(1,0x8bb9e9,.3).moveTo(53,10).lineTo(53,50);
  panel.lineStyle(1,0x8d70bb,.45).beginFill(0x100b22).drawRoundedRect(7,9,40,42,5).endFill();
  const text=(value,x,y,size,color,bold=false)=>{const t=new PIXI.Text(value,{fontFamily:'Arial',fontSize:size,fill:color,fontWeight:bold?'bold':'normal',wordWrap:true,wordWrapWidth:198});t.position.set(x,y);root.addChild(t);return t;};
  const heading=text('NEW DISCOVERY',63,7,9,0xaacdf3,true),name=text('',63,21,13,0xf3e8ff,true),detail=text('Monster Archive Updated',63,41,9,0xaf9fc6);
  const icon=new PIXI.Sprite();icon.anchor.set(.5);icon.position.set(27,30);root.addChild(icon);
  const stars=[];for(let i=0;i<3;i++){const star=new PIXI.Graphics();star.beginFill(i%2?0xcaa1ff:0xa4dcff).drawPolygon([0,-2,1,-1,2,0,1,1,0,2,-1,1,-2,0,-1,-1]).endFill();root.addChild(star);stars.push(star);}
  return{root,mask,icon,heading,name,detail,stars};
 };
 toast.paint=(view,age)=>{
  const g=toast.geometry(),smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);},enter=smooth(age/.2),exit=smooth((age-2.9)/.3),reveal=smooth((age-.2)/.45);
  view.screenRect=g;const key=[g.x,g.y,g.w,g.h].join(':');if(view.maskKey!==key){view.mask.clear().beginFill(0xffffff).drawRect(g.x,g.y,g.w,g.h).endFill();view.maskKey=key;}
  view.mask.visible=true;view.root.visible=true;view.root.alpha=enter*(1-exit);view.root.scale.set(1);view.root.position.set(g.x,g.y-(1-enter)*8-exit*8);
  const c=Math.round(255*reveal);view.icon.tint=(c<<16)|(c<<8)|c;view.name.alpha=smooth((age-.65)/.2);
  view.stars.forEach((star,i)=>{star.position.set(27+Math.cos(age+i*2.1)*20,30+Math.sin(age+i*2.1)*20);star.alpha=reveal*.3*Math.sin(age*2+i)**2;});
 };
 const view=d.toast=toast.create(100),{root,mask,icon,name}=view;d.root=root;d.mask=mask;d.icon=icon;d.nameText=name;d.stars=view.stars;
 d.geometry=toast.geometry;
 d.bindPortrait=id=>{
  if(!d.texture(id))return false;
  name.text=types[id].Name||id;name.scale.set(1);name.scale.set(Math.min(1,198/Math.max(1,name.width),18/Math.max(1,name.height)));
  d.fitPortrait(icon,id,27,30,38,40);d.boundPortrait=id;return true;
 };
 d.begin=id=>{
  if(!d.bindPortrait(id))return false;toast.take('monster',id);d.active={id,age:0};d.stats.shown++;
  if(scene.__audio?.play('DiscoveryUnlock'))d.stats.sounds++;return true;
 };
 d.paint=()=>{
  if(!d.active){root.visible=false;mask.visible=false;return;}
  if(d.boundPortrait!==d.active.id)d.bindPortrait(d.active.id);
  // geometry remains replaceable by native click-through validation fixtures.
  const geometry=toast.geometry;toast.geometry=d.geometry;toast.paint(view,d.active.age);toast.geometry=geometry;
 };
 d.paintIndex=()=>{
  const index=scene.__unitIndex,visible=sv.get('IndexOpen').getAsBoolean()&&index?.category==='Monsters';
  for(const outline of d.outlines.values())if(!outline.destroyed)outline.destroy({texture:false,baseTexture:false});d.outlines.clear();
  for(const portrait of d.indexPortraits.values())portrait.root.visible=false;
  if(!visible)return;
  for(const {sprite:object} of index.monsterCards||index.cards){
   const frame=object.__discoveryPortrait;if(!frame||object.isHidden())continue;
   // The native object is a bounded UI handle, never a second visible artwork.
   object.__archivePortraitOwned=true;object.setOpacity(0);const native=object.getRendererObject();native.alpha=0;native.visible=false;
   if(object.__golemPortraitRig)object.__golemPortraitRig.visible=false;
   let portrait=d.indexPortraits.get(object);
   if(!portrait){
    const root=new PIXI.Container(),mask=new PIXI.Graphics(),sprite=new PIXI.Sprite();root.interactive=false;root.interactiveChildren=false;mask.interactive=false;sprite.interactive=false;sprite.mask=mask;root.addChild(mask,sprite);
    portrait={root,mask,sprite,frameKey:''};d.indexPortraits.set(object,portrait);object.__archivePortrait=portrait;
    const cleanup=()=>{sprite.mask=null;if(!root.destroyed)root.destroy({children:true,texture:false,baseTexture:false});d.indexPortraits.delete(object);delete object.__archivePortrait;object.unregisterDestroyCallback(cleanup);};object.registerDestroyCallback(cleanup);
   }
   const {root,mask,sprite}=portrait,parent=scene.getLayer(object.getLayer()).getRenderer().getRendererObject();if(root.parent!==parent)parent.addChild(root);
   root.zIndex=object.getZOrder();root.position.set(0);root.scale.set(1);root.rotation=0;root.alpha=1;root.visible=true;
   d.fitPortrait(sprite,frame.id,frame.x,frame.y,frame.w,frame.h);
   // Read encounter state afresh. A new unlock stays black until the matching text refresh.
   const locked=!d.has(frame.id)||object.__discoveryLocked;sprite.tint=locked?0x000000:0xffffff;sprite.alpha=1;sprite.visible=true;sprite.blendMode=PIXI.BLEND_MODES.NORMAL;portrait.id=frame.id;portrait.locked=locked;
   const frameKey=[frame.x,frame.y,frame.w,frame.h].join(':');if(portrait.frameKey!==frameKey){mask.clear().beginFill(0xffffff).drawRect(frame.x-frame.w/2,frame.y-frame.h/2,frame.w,frame.h).endFill();portrait.frameKey=frameKey;}
  }
 };
 d.update=()=>{
  if(d.disposed)return;
  const uiLayer=scene.getLayer('DiscoveryUI');uiLayer.setCameraZoom(1);uiLayer.setCameraX(game.getGameResolutionWidth()/2);uiLayer.setCameraY(game.getGameResolutionHeight()/2);
  // Keep queued announcements intact while the encyclopedia owns the screen.
  if(sv.get('DefeatActive').getAsBoolean()||sv.get('IndexOpen').getAsBoolean()||!d.active&&(game.__fusionArchive?.active||!toast.canBegin('monster'))){root.visible=false;mask.visible=false;d.paintIndex();return;}
  const dt=Math.max(0,scene.getTimeManager().getElapsedTime()/Math.max(.001,scene.getTimeManager().getTimeScale())/1000);
  if(d.active){d.active.age+=dt;if(d.active.age>=toast.duration){d.active=null;d.stats.completed++;}}
  if(!d.active&&d.queue.length&&toast.canBegin('monster')){if(d.begin(d.queue[0]))d.queue.shift();}
  d.paint();d.paintIndex();
 };
 d.dispose=()=>{if(d.disposed)return;d.disposed=true;for(const portrait of d.indexPortraits.values()){portrait.sprite.mask=null;if(!portrait.root.destroyed)portrait.root.destroy({children:true,texture:false,baseTexture:false});}d.indexPortraits.clear();for(const outline of d.outlines.values())if(!outline.destroyed)outline.destroy({texture:false,baseTexture:false});d.outlines.clear();d.textures.clear();root.mask=null;root.destroy({children:true,texture:false,baseTexture:false});mask.destroy();for(const texture of d.ownedTextures)texture.destroy(false);d.ownedTextures.clear();};
 if(!gdjs.__celestialDiscoveryCallbacks){gdjs.__celestialDiscoveryCallbacks=true;gdjs.callbacksRuntimeScenePostEvents.push(s=>s.__monsterDiscovery?.update());gdjs.callbacksRuntimeSceneUnloading.push(s=>s.__monsterDiscovery?.dispose());}
}
