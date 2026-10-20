// Transactional Pure Fusion. Original towers remain alive until valid placement.
const scene=runtimeScene,sv=scene.getVariables(),game=scene.getGame(),get=n=>scene.getObjects(n),p=scene.__freePlacement,star=scene.__starCannon;
if(!p||!star)return;
let f=scene.__fusion;
if(!f){
 const config=sv.get('StarburstConfig').toJSObject(),layer=scene.getLayer('FusionUI');
 const archive=game.__fusionArchive;if(!archive?.persistent)return;
 f=scene.__fusion={config,archive,active:false,stage:'idle',objects:{},markers:new Map(),footprints:new Map(),obstacleFootprints:new Map(),wasDown:false,pressed:'',error:'',disposed:false};
 f.graphics=new PIXI.Graphics();layer.getRenderer().getRendererObject().addChild(f.graphics);f.graphics.zIndex=0;
 // One reusable batch above the dimmer; clip world hints away from all sidebar UI.
 f.worldGraphics=new PIXI.Graphics();f.worldMask=new PIXI.Graphics();f.worldGraphics.zIndex=1;f.worldGraphics.interactive=false;f.worldMask.interactive=false;f.worldGraphics.mask=f.worldMask;layer.getRenderer().getRendererObject().addChild(f.worldMask,f.worldGraphics);
 f.hudGraphics=new PIXI.Graphics();f.hudGraphics.zIndex=5;f.hudGraphics.interactive=false;layer.getRenderer().getRendererObject().addChild(f.hudGraphics);
 f.ensure=(key,name,z=2)=>{if(!f.objects[key]){const o=scene.createObject(name);o.setLayer('FusionUI');o.setZOrder(z);f.objects[key]=o;}return f.objects[key];};
 f.ghost=f.ensure('ghost','StarburstGhost',3);f.ghost.hide();
 f.hudSlot=height=>{
  const rect=o=>{const l=scene.getLayer(o.getLayer()),a=l.convertInverseCoords(o.getX(),o.getY(),0,[0,0]),b=l.convertInverseCoords(o.getX()+o.getWidth(),o.getY()+o.getHeight(),0,[0,0]);return{x:a[0],y:a[1],w:b[0]-a[0],h:b[1]-a[1]};};
  const box=rect(get('TowerShopBox')[0]),header=rect(get('ShopHeaderPlaque')[0]),footer=rect(get('ShopFooterFrame')[0]),x=box.x+12,w=box.w-24;
  let gaps=[[header.y+header.h+10,footer.y-10]];
  const occupied=[...scene.__towerShopUI.cards.map(c=>rect(c.background)),scene.__selectedPanel?.screenRect,scene.__obstaclePanel?.screenRect,...(scene.__audio?.ui.open?[scene.__audio.geometry().panel]:[])].filter(Boolean);
  for(const r of occupied)if(r.x<x+w&&r.x+r.w>x)gaps=gaps.flatMap(([a,b])=>r.y>=b||r.y+r.h<=a?[[a,b]]:[[a,Math.min(b,r.y-10)],[Math.max(a,r.y+r.h+10),b]].filter(([a,b])=>b>a));
  gaps.sort((a,b)=>(b[1]-b[0])-(a[1]-a[0]));const gap=gaps[0];if(!gap)return null;
  const scale=Math.min(1,w/200,(gap[1]-gap[0])/height);return{x:x+(w-200*scale)/2,y:gap[0],w:200*scale,h:height*scale,scale};
 };
 // One contextual body replaces shop content; it never adds a second sidebar frame.
 const sidebar=f.sidebar={root:new PIXI.Container(),mask:new PIXI.Graphics(),graphics:new PIXI.Graphics(),texts:new Map(),portraits:new Map(),scroll:0,phase:'',sourceEntries:[],result:null};
 sidebar.root.zIndex=4;sidebar.root.interactive=false;sidebar.root.interactiveChildren=false;sidebar.mask.interactive=false;sidebar.root.mask=sidebar.mask;sidebar.root.addChild(sidebar.graphics);layer.getRenderer().getRendererObject().addChild(sidebar.mask,sidebar.root);sidebar.root.visible=false;
 const portraitCatalog=sv.get('IndexPortraitCatalog').toJSObject(),sceneData=game.getSceneAndExtensionsData(scene.getName()).sceneData;
 f.sourceInfo=t=>{
  if(!t)return null;const v=t.getVariables(),variant=v.get('TowerType').getAsString(),catalog=sv.get('TowerShopCatalog').toJSObject(),type=portraitCatalog[variant]||archive.definition(variant)||catalog.some(c=>c.Type===variant)?variant:t.getName(),shop=catalog.find(c=>c.Type===type);
  return{type,name:v.get('TowerName').getAsString()||shop?.Name||type,path1:v.get('Path1Level').getAsNumber(),path2:v.get('Path2Level').getAsNumber()};
 };
 f.renderSidebar=()=>{
  const toScreen=o=>{const l=scene.getLayer(o.getLayer()),a=l.convertInverseCoords(o.getX(),o.getY(),0,[0,0]),b=l.convertInverseCoords(o.getX()+o.getWidth(),o.getY()+o.getHeight(),0,[0,0]);return{x:a[0],y:a[1],w:b[0]-a[0],h:b[1]-a[1]};};
  const box=toScreen(get('TowerShopBox')[0]),header=toScreen(get('ShopHeaderPlaque')[0]),footer=toScreen(get('ShopFooterFrame')[0]),x=box.x+12,y=header.y+header.h+12,w=box.w-24;
  const placement=f.stage==='placement',phase=placement?'PREVIEW_PLACEMENT':'SELECT_PARTNER',natural=placement?254:174,bodyHeight=Math.max(1,Math.min(natural,footer.y-y-60));
  if(sidebar.phase!==phase){sidebar.scroll=0;sidebar.phase=phase;}
  const cursorX=gdjs.evtTools.input.getCursorX(scene,'FusionUI',0),cursorY=gdjs.evtTools.input.getCursorY(scene,'FusionUI',0);
  sidebar.maxScroll=Math.max(0,natural-bodyHeight);if(cursorX>=x&&cursorX<x+w&&cursorY>=y&&cursorY<y+bodyHeight)sidebar.scroll-=Math.sign(game.getInputManager().getMouseWheelDelta())*30;sidebar.scroll=Math.max(0,Math.min(sidebar.maxScroll,sidebar.scroll));
  sidebar.screenRect={x,y,w,h:bodyHeight};sidebar.root.position.set(x,y-sidebar.scroll);sidebar.root.visible=true;
  const maskKey=[x,y,w,bodyHeight].join(':');if(sidebar.maskKey!==maskKey){sidebar.mask.clear().beginFill(0xffffff).drawRect(x,y,w,bodyHeight).endFill();sidebar.maskKey=maskKey;}
  const g=sidebar.graphics;g.clear();for(const t of sidebar.texts.values())t.visible=false;for(const p of sidebar.portraits.values())p.sprite.visible=false;
  const text=(key,value,tx,ty,width,size=12,color=0xece4fa,bold=false)=>{
   let t=sidebar.texts.get(key);if(!t){t=new PIXI.Text('',{fontFamily:'Arial'});t.interactive=false;sidebar.root.addChild(t);sidebar.texts.set(key,t);}
   t.text=value;t.style.fontSize=size;t.style.fill=color;t.style.fontWeight=bold?'bold':'normal';t.style.wordWrap=true;t.style.wordWrapWidth=width;t.style.breakWords=true;t.position.set(tx,ty);t.visible=true;return t;
  };
  const image=(key,type,animation,frame,locked=false)=>{
   const meta=portraitCatalog[type],fallback=sceneData.objects.find(o=>o.name==='IndexTowerImage')?.animations.find(a=>a.name===animation||a.name===type),resource=meta?.Image||fallback?.directions[0].sprites[0].image;
   let rec=sidebar.portraits.get(key);if(!rec){const sprite=new PIXI.Sprite();sprite.interactive=false;sidebar.root.addChild(sprite);rec={sprite};sidebar.portraits.set(key,rec);}
   if(!resource){rec.sprite.visible=false;return false;}
   const texture=game.getImageManager().getPIXITexture(resource),bounds=meta?.VisualBounds||[0,0,texture.width,texture.height],sprite=rec.sprite;
   sprite.texture=texture;sprite.anchor.set((bounds[0]+bounds[2]/2)/texture.width,(bounds[1]+bounds[3]/2)/texture.height);sprite.scale.set(Math.min(frame.w/bounds[2],frame.h/bounds[3]));sprite.position.set(frame.x+frame.w/2,frame.y+frame.h/2);sprite.rotation=0;sprite.alpha=1;sprite.tint=locked?0x000000:0xffffff;sprite.blendMode=PIXI.BLEND_MODES.NORMAL;sprite.visible=true;Object.assign(rec,{resource,type,frame,locked});return true;
  };
  text('sources','SOURCE TOWERS',0,0,w,10,0xc9b785,true);
  sidebar.sourceEntries=[f.sourceInfo(f.a),f.sourceInfo(f.b)];const cw=(w-24)/2;
  sidebar.sourceEntries.forEach((entry,i)=>{
   const sx=i*(cw+24);g.lineStyle(1,0x655276,.55).beginFill(0x19142c,.85).drawRoundedRect(sx,17,cw,106,8).endFill();text('sourceId'+i,i?'B':'A',sx+8,23,12,9,0xc9b785,true);
   if(entry){if(!image('source'+i,entry.type,entry.type,{x:sx+17,y:25,w:cw-34,h:43}))text('sourceFallback'+i,'?',sx+cw/2-7,35,22,25,0xa698c4);text('sourceName'+i,entry.name,sx+6,73,cw-12,12,0xece4fa,true);text('sourcePath'+i,entry.path1+' - '+entry.path2,sx+cw/2-17,104,50,12,0xcab884,true);}
   else{text('sourceQuestion'+i,'?',sx+cw/2-8,35,24,28,0xa698c4);text('sourceName'+i,'Select',sx+cw/2-18,77,60,12,0xb2a4ca);}
  });
  text('plus','+',cw+6,54,20,22,0xc9b785);
  sidebar.result=null;
  if(placement){
   const resolved=archive.resolve([f.a,f.b]),definition=resolved&&archive.definition(resolved.id),locked=!definition||!archive.has(definition.Id);
   sidebar.result={id:definition?.Id||'',name:locked?'???':definition.Name,locked,cost:config.FusionCost};
   g.lineStyle(1,0x655276,.55).moveTo(0,133).lineTo(w,133);text('evolution','EVOLUTION',0,140,w,10,0xc9b785,true);
   g.beginFill(0x332448,.7).drawRoundedRect(0,158,64,64,9).endFill();if(!image('result',definition?.Id,definition?.Animation,{x:4,y:162,w:56,h:56},locked))text('resultFallback','?',24,174,26,24,0xa698c4);
   text('resultName',sidebar.result.name,74,160,w-74,14,0xeee6ff,true);if(locked)text('resultLock','UNDISCOVERED',74,180,w-74,9,0xa799bb);
   text('cost',config.FusionCost+' Gold',74,201,w-74,13,0xe3ca8d,true);
   let status=f.preview&&!f.preview.valid?f.message(f.preview.reason):f.error||'Place near either source tower';
   if(f.preview?.reason==='obstacle'){
    const radius=p.config('StarCannonTower').Radius,hit=p.blockers.find(c=>Math.hypot(f.preview.x-c.x,f.preview.y-c.y)<=radius+c.r+1e-6);
    const kind=hit?.owner.getVariables().get('Kind').getAsString();status=kind==='Ruin'?'Blocked by Ruins':kind==='Rock'?'Blocked by Rock':kind==='Crystal'?'Blocked by Crystal':f.message('obstacle');
   }
   sidebar.status=status;text('status',status,0,226,w,12,f.preview?.valid?0xafdace:0xeea1b2);
  }else{sidebar.status=f.error||'Select a Max-Level Tower';text('status',sidebar.status,0,143,w,14,f.error?0xeea1b2:0xece4fa,true);}
  // Fixed large hit target stays available even when a short viewport needs body scrolling.
  const cy=y+bodyHeight+10,button=f.ensure('cancel','SelectedPanelPlaque',4);button.setPosition(x,cy);button.setWidth(w);button.setHeight(40);button.setColor('210;190;248');button.hide(false);
  const label=f.ensure('cancelText','IndexText',5);label.setString('Cancel / ESC');label.setCharacterSize(14);label.setBold(true);label.setTextAlignment('center');label.setWrapping(true);label.setWrappingWidth(w);label.setColor('246;235;255');label.setPosition(x,cy+11);label.hide(false);
  f.cancelRect={x,y:cy,w,h:40};f.bannerRect={x,y,w,h:bodyHeight+50};f.hudGraphics.clear();
  f.hudGraphics.lineStyle(1,0xd8ba7d,.95).moveTo(header.x+13,header.y+21).lineTo(header.x+18,header.y+15).lineTo(header.x+23,header.y+21).lineTo(header.x+18,header.y+27).closePath();
  if(sidebar.maxScroll)f.hudGraphics.lineStyle(2,0xb9a0d6,.6).moveTo(x+w+5,y+3).lineTo(x+w+5,y+bodyHeight-3);
 };
 f.eligible=t=>!!t&&get('StarCannonTower').includes(t)&&!star.isFusion(t)&&((t.getVariables().get('Path1Level').getAsNumber()===5&&t.getVariables().get('Path2Level').getAsNumber()===2)||(t.getVariables().get('Path1Level').getAsNumber()===2&&t.getVariables().get('Path2Level').getAsNumber()===5));
 f.pair=(a,b)=>f.eligible(a)&&f.eligible(b)&&a!==b&&a.getVariables().get('Path1Level').getAsNumber()!==b.getVariables().get('Path1Level').getAsNumber();
 f.alive=(t,id)=>!!t&&t.getUniqueId()===id&&get('StarCannonTower').includes(t);
 f.message=reason=>({region:'Outside Fusion Zone',path:'Path blocked',tower:'Occupied',obstacle:'Blocked by obstacle',bounds:'Outside build area','rocky-edge':'Outside build area',gold:'Insufficient Gold',ui:'Move onto the map',pair:'Choose a compatible tower'}[reason]||'Choose a clear spot');
 f.finish=()=>{
  f.active=false;f.stage='idle';f.a=null;f.b=null;f.aId=0;f.bId=0;f.preview=null;f.error='';f.pressed='';sv.get('FusionActive').setBoolean(false);
  f.graphics.clear();f.worldGraphics.clear();f.worldMask.clear();f.worldMaskKey='';f.hudGraphics.clear();f.footprints.clear();f.obstacleFootprints.clear();for(const m of f.markers.values())m.destroy();f.markers.clear();Object.values(f.objects).forEach(o=>o.hide());f.bannerRect=null;f.cancelRect=null;layer.show(false);
  sidebar.root.visible=false;sidebar.scroll=0;sidebar.phase='';sidebar.sourceEntries=[];sidebar.result=null;
  scene.getTimeManager().setTimeScale(f.previousScale||1);f.previousScale=undefined;
 };
 f.cancel=()=>{if(!f.active)return false;f.finish();scene.__audio?.play('UIClick');return true;};
 f.begin=t=>{
  if(f.active||!f.eligible(t)||sv.get('GameOver').getAsBoolean()||sv.get('IndexBlocksInput').getAsBoolean())return false;
  f.previousScale=scene.getTimeManager().getTimeScale();f.active=true;f.stage='partner';f.a=t;f.aId=t.getUniqueId();f.b=null;f.error='';f.wasDown=game.getInputManager().isMouseButtonPressed(0);f.pressed='';
  sv.get('FusionActive').setBoolean(true);sv.get('SelectedTower').setNumber(0);sv.get('IndexOpen').setBoolean(false);scene.__obstaclePanel?.close();p.stop();
  if(scene.__audio){scene.__audio.ui.open=false;scene.__audio.ui.pressed='';}scene.getTimeManager().setTimeScale(config.FusionTimeScale);scene.__audio?.play('UIClick');return true;
 };
 f.choose=t=>{if(!f.active||f.stage!=='partner'||!f.pair(f.a,t)){f.error=f.message('pair');scene.__audio?.play('InvalidAction');return false;}f.b=t;f.bId=t.getUniqueId();f.stage='placement';f.error='';scene.__audio?.play('TowerSelect');return true;};
 f.validate=(x,y)=>{
  if(!f.active||f.stage!=='placement'||!f.alive(f.a,f.aId)||!f.alive(f.b,f.bId)||!f.pair(f.a,f.b))return{valid:false,reason:'pair'};
  if(![f.a,f.b].some(t=>{const c=p.center(t);return Math.hypot(x-c[0],y-c[1])<=config.RegionalRadius;}))return{valid:false,reason:'region'};
  const point=scene.getLayer('').convertInverseCoords(x,y,0,[0,0]);
  if([f.bannerRect,f.cancelRect].some(r=>r&&point[0]>=r.x&&point[0]<r.x+r.w&&point[1]>=r.y&&point[1]<r.y+r.h))return{valid:false,reason:'ui'};
  return p.validate('StarCannonTower',x,y,{ignoreTowers:new Set([f.a,f.b]),cost:config.FusionCost});
 };
 f.confirm=(x,y)=>{
  const valid=f.validate(x,y);if(!valid.valid){f.error=f.message(valid.reason);scene.__audio?.play('InvalidAction');return false;}
  const a=f.a,b=f.b,t=scene.createObject('StarCannonTower');if(!t){f.error='Unable to create tower';return false;}
  const v=t.getVariables(),av=a.getVariables(),bv=b.getVariables(),cost=config.FusionCost,investment=av.get('TotalInvestment').getAsNumber()+bv.get('TotalInvestment').getAsNumber()+cost;
  const id=Math.max(sv.get('NextTowerId').getAsNumber(),...get('StarCannonTower').map(o=>o.getVariables().get('TowerId').getAsNumber()))+1;
  for(const [name,value]of Object.entries({TowerId:id,PurchasePrice:investment,TotalInvestment:investment,DamageDealt:av.get('DamageDealt').getAsNumber()+bv.get('DamageDealt').getAsNumber(),Path1Level:5,Path2Level:2,FootprintX:x,FootprintY:y,FootprintRadius:p.config('StarCannonTower').Radius,FootprintOffsetX:0,FootprintOffsetY:0,ShotCounter:0}))v.get(name).setNumber(value);
  v.get('TowerType').setString('StarburstCannon');v.get('TowerName').setString(config.Name);t.setLayer('');
  try{if(!star.apply(t))throw Error('Invalid fusion stats');}catch(e){t.deleteFromScene();f.error='Fusion could not be completed';return false;}
  const discovery=archive.resolve([a,b]);
  sv.get('NextTowerId').setNumber(id);sv.get('Money').sub(cost);a.deleteFromScene();b.deleteFromScene();if(discovery)archive.discover(discovery.id,discovery.variant);
  f.finish();sv.get('SelectedTower').setNumber(id);scene.__audio?.play('TowerMajorUpgrade');return t;
 };
 f.render=()=>{
  const w=game.getGameResolutionWidth(),h=game.getGameResolutionHeight();layer.setCameraZoom(1);layer.setCameraX(w/2);layer.setCameraY(h/2);layer.show(f.active);if(!f.active)return;
  const g=f.worldGraphics,map=scene.getLayer(''),zoom=map.getCameraZoom(),screen=t=>map.convertInverseCoords(...p.center(t),0,[0,0]),area=scene.__towerShopUI.gameArea;
  f.graphics.clear().beginFill(0x09051b,config.OverlayOpacity).drawRect(area.left,area.top,area.right-area.left,area.bottom-area.top).endFill();g.clear();
  const maskKey=[area.left,area.top,area.right,area.bottom].join(':');if(f.worldMaskKey!==maskKey){f.worldMask.clear().beginFill(0xffffff).drawRect(area.left,area.top,area.right-area.left,area.bottom-area.top).endFill();f.worldMaskKey=maskKey;}
  const markerIds=new Set(),footprintIds=new Set(),obstacleIds=new Set();
  if(f.stage==='placement')for(const collider of p.blockers){
   // These are the exact circles tested by p.validate, including Spawn and Base.
   const {owner,x,y,r}=collider,id=owner.getUniqueId(),point=map.convertInverseCoords(x,y,0,[0,0]),radius=r*zoom,color=0xf2b866;
   g.lineStyle(1.5,color,.85).beginFill(color,.055).drawCircle(point[0],point[1],radius).endFill();
   const top=point[1]-radius;g.lineStyle(1,color,.95).beginFill(0x271a30,.85).drawPolygon([point[0],top-3,point[0]+3,top,point[0],top+3,point[0]-3,top]).endFill();
   const record=f.obstacleFootprints.get(id)||{};Object.assign(record,{id,owner,shape:'circle',x,y,r,screenX:point[0],screenY:point[1],screenRadius:radius,color});f.obstacleFootprints.set(id,record);obstacleIds.add(id);
  }
  for(const id of f.obstacleFootprints.keys())if(!obstacleIds.has(id))f.obstacleFootprints.delete(id);
  for(const t of p.towers()){
   const v=t.getVariables(),max=Math.max(v.get('Path1Level').getAsNumber(),v.get('Path2Level').getAsNumber())===5&&!star.isFusion(t);
   const id=t.getUniqueId(),[x,y]=screen(t),valid=f.pair(f.a,t),selected=t===f.a||t===f.b;
   if(f.stage==='placement'){
    const radius=p.radius(t),color=selected?0x9de8f0:0xf49ab1;
    g.lineStyle(2,color,.95).beginFill(color,selected ? .025 : .045).drawCircle(x,y,radius*zoom).endFill();
    const record=f.footprints.get(id)||{};Object.assign(record,{id,x,y,radius,screenRadius:radius*zoom,color,ignored:selected});f.footprints.set(id,record);footprintIds.add(id);
   }else if(max){const color=selected?0xf5d58d:valid?0x9df1ff:0x8a75aa;g.lineStyle(selected||valid?3:1,color,selected||valid?.95:.4).drawCircle(x,y,(p.radius(t)+5)*zoom);}
   if(!(f.stage==='partner'?max:selected))continue;
   markerIds.add(id);const color=selected?0xf5d58d:valid?0x9df1ff:0x8a75aa;
   let marker=f.markers.get(id);if(!marker){marker=new PIXI.Text('FUSION',{fontFamily:'Arial',fontSize:10,fontWeight:'bold',fill:color,stroke:0x211236,strokeThickness:3});marker.anchor.set(.5,1);marker.zIndex=2;layer.getRenderer().getRendererObject().addChild(marker);f.markers.set(id,marker);}marker.position.set(x,y-(p.radius(t)+8)*zoom);marker.style.fill=color;
  }
  for(const [id,m]of f.markers)if(!markerIds.has(id)){m.destroy();f.markers.delete(id);}
  for(const id of f.footprints.keys())if(!footprintIds.has(id))f.footprints.delete(id);
  if(f.stage==='placement'){
   for(const t of [f.a,f.b]){const [x,y]=screen(t);g.lineStyle(2,0xbfa0ff,.5).beginFill(0x9470d0,.07).drawCircle(x,y,config.RegionalRadius*zoom).endFill();}
   const [x,y]=p.cursor(),result=f.validate(x,y),point=map.convertInverseCoords(x,y,0,[0,0]);if(f.preview&&(f.preview.x!==x||f.preview.y!==y))f.error='';f.preview={x,y,...result};
   const size=88*zoom;f.ghost.setWidth(size);f.ghost.setHeight(size);f.ghost.setPosition(point[0]-size/2,point[1]-size/2);f.ghost.setOpacity(185);f.ghost.setColor(result.valid?'180;255;230':'255;80;105');f.ghost.hide(false);
   g.lineStyle(2,result.valid?0x9aedd5:0xff5b79,.95).drawCircle(...point,p.config('StarCannonTower').Radius*zoom);
  }
  f.renderSidebar();
 };
 f.dispose=()=>{if(f.disposed)return;if(f.active)f.finish();for(const o of Object.values(f.objects))o.deleteFromScene();f.objects={};f.worldGraphics.mask=null;f.worldGraphics.destroy();f.worldMask.destroy();sidebar.root.mask=null;sidebar.root.destroy({children:true,texture:false,baseTexture:false});sidebar.mask.destroy();sidebar.texts.clear();sidebar.portraits.clear();f.hudGraphics.destroy();f.graphics.destroy();f.disposed=true;};
 if(!gdjs.__starburstFusionCallbacks){gdjs.__starburstFusionCallbacks=true;gdjs.callbacksRuntimeSceneUnloading.push(s=>s.__fusion?.dispose());}
}
const input=game.getInputManager(),down=input.isMouseButtonPressed(0);
if(f.active){
 if(!f.alive(f.a,f.aId)||!f.eligible(f.a)||(f.b&&(!f.alive(f.b,f.bId)||!f.pair(f.a,f.b)))||sv.get('GameOver').getAsBoolean())f.cancel();
 else if(gdjs.evtTools.input.wasKeyJustPressed(scene,'Escape'))f.cancel();
 else{
  f.render();const x=gdjs.evtTools.input.getCursorX(scene,'FusionUI',0),y=gdjs.evtTools.input.getCursorY(scene,'FusionUI',0),r=f.cancelRect,cancel=!!r&&x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h;
  if(down&&!f.wasDown)f.pressed=cancel?'cancel':f.stage;
  if(!down&&f.wasDown){
   if(cancel&&f.pressed==='cancel')f.cancel();
   else if(f.pressed===f.stage){const [wx,wy]=p.cursor(),area=scene.__towerShopUI.gameArea,screen=scene.getLayer('').convertInverseCoords(wx,wy,0,[0,0]);
    if(screen[0]>=area.left&&screen[0]<area.right&&screen[1]>=area.top&&screen[1]<area.bottom){
     if(f.stage==='partner'){const target=p.towers().filter(t=>scene.__worldSelection.towerHit(t,wx,wy)).sort((a,b)=>b.getZOrder()-a.getZOrder())[0];f.choose(target);}
     else f.confirm(wx,wy);
    }
   }
   f.pressed='';
  }
 }
}
f.wasDown=down;
