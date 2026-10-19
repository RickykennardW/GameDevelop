// Transactional Pure Fusion. Original towers remain alive until valid placement.
const scene=runtimeScene,sv=scene.getVariables(),game=scene.getGame(),get=n=>scene.getObjects(n),p=scene.__freePlacement,star=scene.__starCannon;
if(!p||!star)return;
let f=scene.__fusion;
if(!f){
 const config=sv.get('StarburstConfig').toJSObject(),layer=scene.getLayer('FusionUI');
 const archive=game.__fusionArchive;if(!archive?.persistent)return;
 f=scene.__fusion={config,archive,active:false,stage:'idle',objects:{},markers:new Map(),footprints:new Map(),wasDown:false,pressed:'',error:'',disposed:false};
 f.graphics=new PIXI.Graphics();layer.getRenderer().getRendererObject().addChild(f.graphics);f.graphics.zIndex=0;
 f.ensure=(key,name,z=2)=>{if(!f.objects[key]){const o=scene.createObject(name);o.setLayer('FusionUI');o.setZOrder(z);f.objects[key]=o;}return f.objects[key];};
 f.ghost=f.ensure('ghost','StarburstGhost',3);f.ghost.hide();
 f.eligible=t=>!!t&&get('StarCannonTower').includes(t)&&!star.isFusion(t)&&((t.getVariables().get('Path1Level').getAsNumber()===5&&t.getVariables().get('Path2Level').getAsNumber()===2)||(t.getVariables().get('Path1Level').getAsNumber()===2&&t.getVariables().get('Path2Level').getAsNumber()===5));
 f.pair=(a,b)=>f.eligible(a)&&f.eligible(b)&&a!==b&&a.getVariables().get('Path1Level').getAsNumber()!==b.getVariables().get('Path1Level').getAsNumber();
 f.alive=(t,id)=>!!t&&t.getUniqueId()===id&&get('StarCannonTower').includes(t);
 f.message=reason=>({region:'Place near either source tower',path:'Monster path is blocked',tower:'Another tower blocks this spot',obstacle:'Obstacle or structure blocks this spot',bounds:'Keep the footprint on the island',gold:'Not enough Gold',ui:'Move the preview onto the map',pair:'Select the opposite max path: 5-2 + 2-5'}[reason]||'Choose a clear placement near either source');
 f.finish=()=>{
  f.active=false;f.stage='idle';f.a=null;f.b=null;f.aId=0;f.bId=0;f.preview=null;f.error='';f.pressed='';sv.get('FusionActive').setBoolean(false);
  f.graphics.clear();f.footprints.clear();for(const m of f.markers.values())m.destroy();f.markers.clear();Object.values(f.objects).forEach(o=>o.hide());layer.show(false);
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
  const g=f.graphics,map=scene.getLayer(''),zoom=map.getCameraZoom(),screen=t=>map.convertInverseCoords(...p.center(t),0,[0,0]),area=scene.__towerShopUI.gameArea;
  g.clear().beginFill(0x09051b,config.OverlayOpacity).drawRect(0,0,w,h).endFill();
  const markerIds=new Set(),footprintIds=new Set();
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
  const bw=Math.max(180,Math.min(460,area.right-area.left-24)),bx=area.left+(area.right-area.left-bw)/2,by=Math.max(66,h*.08);
  const plaque=f.ensure('banner','SelectedPanelPlaque',4);plaque.setPosition(bx,by);plaque.setWidth(bw);plaque.setHeight(96);plaque.hide(false);
  f.bannerRect={x:bx,y:by,w:bw,h:96};
  const text=(key,value,x,y,width,size=12)=>{const o=f.ensure(key,'IndexText',5);o.setString(value);o.setCharacterSize(size);o.setBold(key==='title');o.setColor('235;222;255');o.setWrapping(true);o.setWrappingWidth(width);o.setPosition(x,y);o.hide(false);return o;};
  text('title','CELESTIAL ASCENSION',bx+16,by+12,bw-32,16);
  text('instruction',f.stage==='partner'?'Choose the opposite max path: 5-2 + 2-5':'Place Starburst near either source tower',bx+16,by+37,bw-32,12);
  text('detail',f.error||(f.preview&&!f.preview.valid?f.message(f.preview.reason):f.stage==='placement'?'Click a valid spot / '+config.FusionCost+' Gold fusion':'Both towers stay until placement is confirmed'),bx+16,by+61,bw-32,11);
  const cy=Math.min(h-50,by+106),button=f.ensure('cancel','SelectedPanelPlaque',4);button.setPosition(bx+(bw-156)/2,cy);button.setWidth(156);button.setHeight(34);button.hide(false);text('cancelText','CANCEL  /  ESC',bx+(bw-156)/2+18,cy+9,130,12);f.cancelRect={x:button.getX(),y:cy,w:156,h:34};
 };
 f.dispose=()=>{if(f.disposed)return;if(f.active)f.finish();for(const o of Object.values(f.objects))o.deleteFromScene();f.objects={};f.graphics.destroy();f.disposed=true;};
 if(!gdjs.__starburstFusionCallbacks){gdjs.__starburstFusionCallbacks=true;gdjs.callbacksRuntimeSceneUnloading.push(s=>s.__fusion?.dispose());}
}
const input=game.getInputManager(),down=input.isMouseButtonPressed(0);
if(f.active){
 if(!f.alive(f.a,f.aId)||!f.eligible(f.a)||(f.b&&(!f.alive(f.b,f.bId)||!f.pair(f.a,f.b)))||sv.get('GameOver').getAsBoolean())f.cancel();
 else if(gdjs.evtTools.input.wasKeyJustPressed(scene,'Escape'))f.cancel();
 else{
  f.render();const x=gdjs.evtTools.input.getCursorX(scene,'FusionUI',0),y=gdjs.evtTools.input.getCursorY(scene,'FusionUI',0),r=f.cancelRect,cancel=x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h;
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
