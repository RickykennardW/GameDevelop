// Original island border and terrain frame. The route sprite is authored in the scene.
const scene=runtimeScene,get=n=>scene.getObjects(n);
const environment=scene.__chapterMap?.config.Environment;
const kinds=["Crystal","Rock","Ruin","Shrub"];
get("Ground_Decoration").forEach((o,i)=>{
  const kind=o.getVariables().get("Kind").getAsString()||kinds[i%4];
  const pool=environment&&(kind==='Ruin'?environment.Structures:kind==='Shrub'?environment.Decorations:environment.Rocks),resource=pool?.[(i*5+(kind==='Crystal'?6:0))%pool.length];
  const asset=resource&&environment.Assets.find(a=>a.Resource===resource);
  const animation=asset?.Animation||scene.__chapterMap?.config.PropAnimations[kind]||kind;if(o.getAnimationName()!==animation)o.setAnimationName(animation);
  o.getVariables().get('EnvironmentAsset').setString(resource||'');
  o.setWidth(64);o.setHeight(64);o.getVariables().get("Blocking").setBoolean(kind!=="Shrub");o.getVariables().get("Kind").setString(kind);
  if(scene.__chapterMap)o.setColor(environment||scene.__chapterMap.config.PropAnimations[kind]?'255;255;255':scene.__chapterMap.config.Palette.Prop);
});
let backdrop=scene.__voidBackdrop;
if(!backdrop)backdrop=scene.__voidBackdrop=scene.createObject("VoidBackdrop");
const ground=get("Ground_Map")[0];backdrop.setLayer("");backdrop.setZOrder(ground.getZOrder()-10);
if(environment)backdrop.setAnimationName(environment.Assets.find(a=>a.Resource===environment.Backdrop).Animation);
backdrop.setPosition(ground.getX(),ground.getY());backdrop.setWidth(ground.getWidth());backdrop.setHeight(ground.getHeight());
if(environment){const ratio=environment.Assets.find(a=>a.Resource===environment.Backdrop);const w=Math.max(ground.getWidth(),ground.getHeight()*ratio.Width/ratio.Height),h=w*ratio.Height/ratio.Width;backdrop.setWidth(w);backdrop.setHeight(h);backdrop.setPosition(ground.getCenterXInScene()-w/2,ground.getCenterYInScene()-h/2);}
// Compose the existing frame as proportionally scaled perimeter pieces outside the road.
// No full-frame stretch, no rocky art laid beneath the bottom road.
if(scene.__islandCliffFrame){scene.__islandCliffFrame.deleteFromScene();scene.__islandCliffFrame=null;}
const {left,top,right,bottom}=scene.__towerShopUI.level.surface;
const unit=scene.__worldStyle.cliffUnit,L=225,R=225,T=180,B=206,W=1448,H=1086,lw=L*unit,rw=R*unit,th=T*unit,bh=B*unit;
const pieces=[];
const add=(sx,sy,sw,sh,x,y,w,h)=>pieces.push({sx,sy,sw,sh,x,y,w,h});
add(0,0,L,T,left-lw,top-th,lw,th);add(W-R,0,R,T,right,top-th,rw,th);
add(0,H-B,L,B,left-lw,bottom,lw,bh);add(W-R,H-B,R,B,right,bottom,rw,bh);
// Repeat long edges at uniform scale and crop the final piece, keeping rock proportions.
for(let x=left;x<right-.001;){const width=Math.min((W-L-R)*unit,right-x);add(L,0,width/unit,T,x,top-th,width,th);add(L,H-B,width/unit,B,x,bottom,width,bh);x+=width;}
for(let y=top;y<bottom-.001;){const height=Math.min((H-T-B)*unit,bottom-y);add(0,T,L,height/unit,left-lw,y,lw,height);add(W-R,T,R,height/unit,right,y,rw,height);y+=height;}
// One native owner keeps the correct world layer/Z-order; its PIXI children use
// cropped textures at uniform scale without changing GDevelop's frame-size calculations.
let holder=scene.__cliffOwner;if(!holder)holder=scene.__cliffOwner=scene.createObject('IslandCliffFrame');
if(environment)holder.setAnimationName(environment.Assets.find(a=>a.Resource===environment.Frame).Animation);
holder.setLayer('');holder.setZOrder(-7);holder.updatePreRender(scene);
const root=holder.getRendererObject();if(!scene.__cliffBaseTexture)scene.__cliffBaseTexture=root.texture.baseTexture;
root.texture=PIXI.Texture.EMPTY;root.anchor.set(0);root.position.set(0,0);root.scale.set(1,1);
let edges=scene.__islandEdges;if(!edges)edges=scene.__islandEdges=[];
while(edges.length>pieces.length){const e=edges.pop();root.removeChild(e.sprite);e.sprite.destroy();e.texture.destroy(false);}
let shadows=scene.__environmentShadows;
if(!shadows){shadows=scene.__environmentShadows=new PIXI.Graphics();root.addChildAt(shadows,0);}
shadows.clear();
for(const o of get('Ground_Decoration')){
 const kind=o.getVariables().get('Kind').getAsString(),scale=(scene.__worldStyle.props[kind]||1)*(o.getVariables().get('LocalScale').getAsNumber()||1),w=o.getWidth()*scale;
 const x=o.getCenterXInScene(),y=o.getCenterYInScene()+w*.30;
 shadows.beginFill(0x100c25,kind==='Shrub'?.16:.30).drawEllipse(x,y,w*.34,w*.08).endFill();
}
const regions=[];
for(const [i,d] of pieces.entries()){
 let e=edges[i];if(!e){e=edges[i]={sprite:new PIXI.Sprite()};root.addChild(e.sprite);}
 const key=[d.sx,d.sy,d.sw,d.sh].join(',');
 if(e.key!==key){if(e.texture)e.texture.destroy(false);e.texture=new PIXI.Texture(scene.__cliffBaseTexture,new PIXI.Rectangle(d.sx,d.sy,d.sw,d.sh));e.key=key;}
 e.sprite.texture=e.texture;e.sprite.anchor.set(0);e.sprite.position.set(d.x,d.y);e.sprite.scale.set(unit,unit);e.sprite.tint=environment?0xffffff:scene.__chapterMap?.config.Palette.Cliff||0xffffff;
 regions.push([[d.x,d.y],[d.x+d.w,d.y],[d.x+d.w,d.y+d.h],[d.x,d.y+d.h]]);
}
scene.__islandRockRegions=regions;
// Buildable top surface is separate from the rocky frame. Terrain extends UNDER the
// inner fringe so transparent pockets in the edge sprites cannot expose accidental holes.
scene.__islandSurfacePolygon=[left,top,right,top,right,bottom,left,bottom];
const drawable=ground.getRendererObject();
if(!scene.__islandSurfaceMask){scene.__islandSurfaceMask=new PIXI.Graphics();scene.getLayer('').getRenderer().getRendererObject().addChild(scene.__islandSurfaceMask);drawable.mask=scene.__islandSurfaceMask;}
const underlap=32,mask=scene.__islandSurfaceMask,key=[left,top,right,bottom].join(',');
if(scene.__islandSurfaceKey!==key){mask.clear().beginFill(0xffffff).drawRoundedRect(left-underlap,top-underlap,right-left+underlap*2,bottom-top+underlap*2,20).endFill();scene.__islandSurfaceKey=key;}
ground.setColor(scene.__chapterMap?'255;255;255':"192;195;218");
// Static chapter ornament geometry is allocated once and sits behind the road.
// Bright vents/crystals/reactors are confined to authored blocking prop clusters.
if(scene.__chapterMap&&!environment&&!scene.__chapterEnvironment){
 const meta=scene.__chapterMap.config,accent=parseInt(meta.Palette.Accent.slice(1),16),g=scene.__chapterEnvironment=new PIXI.Graphics();
 g.zIndex=-2;g.interactive=false;scene.getLayer('').getRenderer().getRendererObject().addChild(g);
 if(meta.Id==='emberfall'){
  // Lava flows occupy the non-buildable outer cliff fringe only.
  for(const x of [left-14,right+15]){
   const path=(line,color,alpha)=>{g.lineStyle(line,color,alpha).moveTo(x,top+25);for(let y=top+25;y<bottom;y+=65)g.lineTo(x+Math.sin(y*.023)*8,y);};
   path(14,0x6d2638,.8);path(6,0xea7850,.7);path(1.5,0xffd791,.8);
  }
 }
 for(const [kind,x,y,scale]of meta.Decorations){
  if(kind==='Shrub')continue;
  if(meta.Id==='emberfall'){
   g.lineStyle(8,0x451f37,.8).moveTo(x-32,y+18).lineTo(x-12,y+10).lineTo(x+8,y+24).lineTo(x+32,y+15);
   g.lineStyle(2,0xe88c5d,.65).moveTo(x-32,y+18).lineTo(x-12,y+10).lineTo(x+8,y+24).lineTo(x+32,y+15);
   g.lineStyle(1,accent,.6).drawEllipse(x,y+15,35,16);
  }else if(meta.Id==='nebula'){
   g.beginFill(accent,.07).drawEllipse(x,y+18,46,21).endFill();
   g.lineStyle(1,accent,.35).drawEllipse(x,y+18,36,15);
   for(let i=0;i<4;i++)g.beginFill(0xbcdcff,.55).drawCircle(x-34+i*21,y+28+(i%2)*5,1.3).endFill();
  }else if(meta.Id==='reliquary'){
   g.lineStyle(1,accent,.6).beginFill(0x375768,.65).drawPolygon([x-36,y+12,x-12,y-7,x+33,y+2,x+41,y+24,x+5,y+37,x-26,y+30]).endFill();
   g.lineStyle(1,0xb7e5ee,.6).moveTo(x-26,y+30).lineTo(x,y+12).lineTo(x+30,y+18);
  }else if(meta.Id==='astral'){
   g.lineStyle(2,accent,.55).beginFill(0x49403b,.6).drawRoundedRect(x-35,y-25,70,62,5).endFill();
   g.lineStyle(1,accent,.35).drawCircle(x,y+8,27).moveTo(x-28,y+8).lineTo(x+28,y+8).moveTo(x,y-19).lineTo(x,y+35);
  }else{
   g.lineStyle(1,0x85818b,.6).beginFill(0x131b27,.7).drawPolygon([x-39,y+10,x-14,y-9,x+32,y-2,x+41,y+26,x+4,y+37,x-30,y+29]).endFill();
   for(let i=0;i<3;i++)g.lineStyle(2,accent,.65).moveTo(x-30+i*7,y+24).lineTo(x-24+i*7,y+30);
   g.lineStyle(1,0x94cbd8,.45).drawRect(x+20,y+16,13,8);
  }
 }
 if(!gdjs.__chapterEnvironmentCleanup){gdjs.__chapterEnvironmentCleanup=true;gdjs.callbacksRuntimeSceneUnloading.push(s=>s.__chapterEnvironment?.destroy());}
}
