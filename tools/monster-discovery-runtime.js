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
  session.resetForNewGame=()=>{session.found.clear();session.queue.length=0;session.active=null;session.revision++;for(const key of Object.keys(session.stats))session.stats[key]=0;};
  delete game.__celestialMonsterDiscovery;
  // Ignore all legacy discovery data. Remove only its old key, never settings.
  try{localStorage.removeItem('celestialVoidMonsterDiscovery.v1');}catch(e){}
 }
 d=scene.__monsterDiscovery={scope:'session',ids,types,session,found:session.found,queue:session.queue,get active(){return session.active;},set active(value){session.active=value;},get revision(){return session.revision;},ready:false,disposed:false,outlines:new Map(),textures:new Map(),ownedTextures:new Set(),portraits:sv.get('MonsterPortraitConfig').toJSObject(),stats:session.stats};
 d.ready=true;
 d.has=id=>d.found.has(id);
 d.resetForNewGame=session.resetForNewGame;
 d.onWaveSpawn=(enemy,id)=>{
  const wave=scene.__waveManager;
  if(d.disposed||!ids.includes(id)||d.has(id)||!sv.get('WaveActive').getAsBoolean()||sv.get('GameOver').getAsBoolean()||!wave||wave.queue[wave.index-1]!==id||!scene.getObjects('Enemy').includes(enemy)||enemy.getVariables().get('EnemyType').getAsString()!==id||enemy.getBehavior('Health').IsDead())return false;
  d.found.add(id);session.revision++;d.stats.unlocks++;d.queue.push(id);return true;
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
 const layer=scene.getLayer('DiscoveryUI'),parent=layer.getRenderer().getRendererObject();
 const root=d.root=new PIXI.Container();root.interactive=false;root.interactiveChildren=false;root.visible=false;root.zIndex=100;parent.addChild(root);
 const mask=d.mask=new PIXI.Graphics();mask.interactive=false;mask.zIndex=99;parent.addChild(mask);root.mask=mask;
 const panel=new PIXI.Graphics();root.addChild(panel);
 for(let i=5;i>0;i--)panel.beginFill(0x8953e6,.018).drawRoundedRect(-i*2,-i*2,440+i*4,132+i*4,14+i).endFill();
 panel.beginFill(0x090819,.75).drawRoundedRect(2,5,440,132,12).endFill();
 panel.lineStyle(1.5,0xc1a46a,.95).beginFill(0x1a1030,.98).drawRoundedRect(0,0,440,132,12).endFill();
 panel.lineStyle(1,0x68528e,.85).drawRoundedRect(5,5,430,122,9);
 panel.lineStyle(1,0x789acb,.35).moveTo(112,29).lineTo(412,29);
 panel.lineStyle(1,0xc1a46a,.8).moveTo(16,26).lineTo(16,16).lineTo(36,16).moveTo(424,26).lineTo(424,16).lineTo(404,16).moveTo(424,106).lineTo(424,116).lineTo(404,116);
 panel.lineStyle(1,0x9e7bc6,.55).beginFill(0x100b22).drawCircle(59,67,43).endFill();
 panel.lineStyle(1,0xc1a46a,.6).drawCircle(59,67,39);
 for(const [x,y,r]of [[59,22,4],[59,112,4],[103,67,3],[15,67,3],[420,108,3]])panel.beginFill(0xc4a76f,.8).drawPolygon([x,y-r,x+r,y,x,y+r,x-r,y]).endFill();
 const makeText=(value,x,y,size,color,bold=false)=>{const t=new PIXI.Text(value,{fontFamily:'Arial',fontSize:size,fill:color,fontWeight:bold?'bold':'normal'});t.position.set(x,y);root.addChild(t);return t;};
 makeText('CELESTIAL ARCHIVE',113,12,10,0xd5bd87,true).style.letterSpacing=2;
 makeText('NEW DISCOVERY!',113,36,13,0xa6d9ff,true);
 const name=d.nameText=makeText('',112,56,21,0xf3e8ff,true);
 makeText('New enemy encountered',113,85,11,0xb7a6cd);
 makeText('Monster Index Updated',113,103,11,0x97bbdf);
 const outline=d.iconOutline=new PIXI.Sprite(),icon=d.icon=new PIXI.Sprite();
 outline.anchor.set(.5);icon.anchor.set(.5);outline.tint=0x452460;outline.position.set(59,67);icon.position.set(59,67);root.addChild(outline,icon);
 d.stars=[];
 for(let i=0;i<8;i++){const star=new PIXI.Graphics(),r=i%3===0?3:2;star.beginFill(i%2?0xcaa1ff:0xa4dcff).drawPolygon([0,-r,r*.3,-r*.3,r,0,r*.3,r*.3,0,r,-r*.3,r*.3,-r,0,-r*.3,-r*.3]).endFill();root.addChild(star);d.stars.push(star);}
 d.geometry=()=>{
  const width=game.getGameResolutionWidth(),height=game.getGameResolutionHeight(),right=Math.max(20,scene.__towerShopUI.gameArea.right-12);
  const hud=scene.getObjects('HUDPanel')[0],ui=scene.getLayer('UI');
  const corner=ui.convertInverseCoords(hud.getX()+hud.getWidth(),hud.getY()+hud.getHeight(),0,[0,0]);
  const selected=scene.__selectedPanel?.screenRect,obstacles=[{x:0,y:0,w:corner[0]+56,h:corner[1]+4},...(selected?[selected]:[])],candidates=[];
  // Pack into free screen rectangles without ever changing the existing HUD/panels.
  for(const y of [16,corner[1]+18,...(selected?[selected.y+selected.h+12]:[])]){
   if(y>=height-12)continue;let gaps=[[12,right]];
   for(const o of obstacles)if(o.y<y+132&&o.y+o.h>y)gaps=gaps.flatMap(([l,r])=>o.x>=r||o.x+o.w<=l?[[l,r]]:[[l,Math.min(r,o.x-12)],[Math.max(l,o.x+o.w+12),r]].filter(([a,b])=>b>a));
   for(const [left,end]of gaps){const scale=Math.min(1,(end-left)/440,(height-y-12)/132);if(scale>0)candidates.push({x:left+(end-left-440*scale)/2,y,w:440*scale,h:132*scale,scale});}
  }
  candidates.sort((a,b)=>b.scale-a.scale||a.y-b.y);return candidates[0]||{x:12,y:height-20,w:44,h:13.2,scale:.1};
 };
 d.bindPortrait=id=>{
  const texture=d.texture(id);if(!texture)return false;
  name.text=types[id].Name||id;name.scale.set(1);name.scale.set(Math.min(1,302/Math.max(1,name.width)));
  d.fitPortrait(icon,id,59,67,75,75);d.fitPortrait(outline,id,59,67,75,75);outline.scale.set(icon.scale.x*1.07);d.boundPortrait=id;return true;
 };
 d.begin=id=>{
  if(!d.bindPortrait(id))return false;d.active={id,age:0};d.stats.shown++;
  if(scene.__audio?.play('DiscoveryUnlock'))d.stats.sounds++;return true;
 };
 d.paint=()=>{
  if(!d.active){root.visible=false;mask.visible=false;return;}
  if(d.boundPortrait!==d.active.id)d.bindPortrait(d.active.id);
  const age=d.active.age,smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
  const enter=smooth(age/.4),exit=smooth((age-3.2)/.8),reveal=smooth((age-.4)/.6),g=d.geometry();d.screenRect=g;
  const maskKey=[g.x,g.y,g.w,g.h,g.scale].join(':');if(maskKey!==d.maskKey){mask.clear().beginFill(0xffffff).drawRect(g.x-6*g.scale,g.y-6*g.scale,g.w+12*g.scale,g.h+12*g.scale).endFill();d.maskKey=maskKey;}mask.visible=true;
  root.visible=true;root.alpha=enter*(1-exit);root.scale.set(g.scale);root.position.set(g.x,g.y-(1-enter)*150*g.scale-exit*150*g.scale);
  const c=Math.round(255*reveal);icon.tint=(c<<16)|(c<<8)|c;name.alpha=smooth((age-1)/.2);
  d.stars.forEach((star,i)=>{const t=age*.8+i*.79;star.position.set(58+Math.cos(t)*(.6+reveal*.4)*(38+i%3*10),65+Math.sin(t)*(.6+reveal*.4)*43);star.alpha=reveal*(.3+.4*Math.sin(age*3+i)**2);});
 };
 d.paintIndex=()=>{
  const index=scene.__unitIndex,visible=sv.get('IndexOpen').getAsBoolean()&&index?.category==='Monsters';
  for(const outline of d.outlines.values())outline.visible=false;
  if(!visible)return;
  for(const card of index.cards){const object=card.sprite,locked=object.__discoveryLocked,sprite=object.__golemPortraitRig?.visible?object.__golemPortraitRig:object.getRendererObject();sprite.tint=locked?0:0xffffff;
   const portrait=object.__discoveryPortrait;if(portrait)d.fitPortrait(sprite,portrait.id,portrait.x,portrait.y,portrait.w,portrait.h);
   if(!d.outlines.has(object)){
    const outline=new PIXI.Sprite(sprite.texture);outline.tint=0x3b2351;outline.zIndex=object.getZOrder()-.1;outline.interactive=false;outline.visible=false;
    scene.getLayer('IndexList').getRenderer().getRendererObject().addChild(outline);d.outlines.set(object,outline);
    const cleanup=()=>{if(!outline.destroyed)outline.destroy({texture:false,baseTexture:false});d.outlines.delete(object);object.unregisterDestroyCallback(cleanup);};object.registerDestroyCallback(cleanup);
   }
   const outline=d.outlines.get(object);outline.visible=locked&&!object.isHidden();outline.texture=sprite.texture;outline.anchor.copyFrom(sprite.anchor);outline.position.copyFrom(sprite.position);outline.scale.set(sprite.scale.x*1.06,sprite.scale.y*1.06);outline.rotation=sprite.rotation;
  }
 };
 d.update=()=>{
  if(d.disposed)return;
  const uiLayer=scene.getLayer('DiscoveryUI');uiLayer.setCameraZoom(1);uiLayer.setCameraX(game.getGameResolutionWidth()/2);uiLayer.setCameraY(game.getGameResolutionHeight()/2);
  const dt=Math.max(0,scene.getTimeManager().getElapsedTime()/Math.max(.001,scene.getTimeManager().getTimeScale())/1000);
  if(d.active){d.active.age+=dt;if(d.active.age>=4){d.active=null;d.stats.completed++;}}
  if(!d.active&&d.queue.length){if(d.begin(d.queue[0]))d.queue.shift();}
  d.paint();d.paintIndex();
 };
 d.dispose=()=>{if(d.disposed)return;d.disposed=true;for(const outline of d.outlines.values())if(!outline.destroyed)outline.destroy({texture:false,baseTexture:false});d.outlines.clear();d.textures.clear();root.mask=null;root.destroy({children:true,texture:false,baseTexture:false});mask.destroy();for(const texture of d.ownedTextures)texture.destroy(false);d.ownedTextures.clear();};
 if(!gdjs.__celestialDiscoveryCallbacks){gdjs.__celestialDiscoveryCallbacks=true;gdjs.callbacksRuntimeScenePostEvents.push(s=>s.__monsterDiscovery?.update());gdjs.callbacksRuntimeSceneUnloading.push(s=>s.__monsterDiscovery?.dispose());}
}
