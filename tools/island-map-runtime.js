// Directional skins reuse the same road instances, centers, masks and PathOrder.
const scene=runtimeScene,get=n=>scene.getObjects(n),sv=scene.getVariables();
const roads=get("Monster_Path").slice().sort((a,b)=>a.getVariables().get("PathOrder").getAsNumber()-b.getVariables().get("PathOrder").getAsNumber());
const side=(o,n)=>n.getX()>o.getX()?"E":n.getX()<o.getX()?"W":n.getY()>o.getY()?"S":"N";
roads.forEach((o,i)=>{
  const sides=[i?side(o,roads[i-1]):null,i<roads.length-1?side(o,roads[i+1]):null].filter(Boolean);
  let skin;
  if(sides.length===1)skin="Cap_"+sides[0];
  else if(sides.includes("E")&&sides.includes("W"))skin="H";
  else if(sides.includes("N")&&sides.includes("S"))skin="V";
  else skin=(sides.includes("N")?"N":"S")+(sides.includes("E")?"E":"W");
  if(o.getAnimationName()!==skin)o.setAnimationName(skin);
  o.pauseAnimation();o.setAnimationFrame((skin==="H"||skin==="V")?i%4:0);
});
const kinds=["Crystal","Rock","Ruin","Shrub"];
get("Ground_Decoration").forEach((o,i)=>{
  const kind=o.getVariables().get("Kind").getAsString()||kinds[i%4];if(o.getAnimationName()!==kind)o.setAnimationName(kind);
  o.setWidth(64);o.setHeight(64);o.getVariables().get("Blocking").setBoolean(kind!=="Shrub");o.getVariables().get("Kind").setString(kind);
});
let backdrop=scene.__voidBackdrop;
if(!backdrop)backdrop=scene.__voidBackdrop=scene.createObject("VoidBackdrop");
const ground=get("Ground_Map")[0];backdrop.setLayer("");backdrop.setZOrder(ground.getZOrder()-10);
backdrop.setPosition(ground.getX(),ground.getY());backdrop.setWidth(ground.getWidth());backdrop.setHeight(ground.getHeight());
// Compose the existing frame as proportionally scaled perimeter pieces outside the road.
// No full-frame stretch, no rocky art laid beneath the bottom road.
if(scene.__islandCliffFrame){scene.__islandCliffFrame.deleteFromScene();scene.__islandCliffFrame=null;}
const left=Math.min(...roads.map(o=>o.getX()))-16,right=Math.max(...roads.map(o=>o.getX()+o.getWidth()))+16;
const top=Math.min(...roads.map(o=>o.getY()))-112,bottom=Math.max(...roads.map(o=>o.getY()+o.getHeight()))+16;
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
 e.sprite.texture=e.texture;e.sprite.anchor.set(0);e.sprite.position.set(d.x,d.y);e.sprite.scale.set(unit,unit);
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
ground.setColor("192;195;218");
