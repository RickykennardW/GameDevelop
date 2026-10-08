// Shared validator for free world-space placement. Rendering tiles never snap towers.
const scene=runtimeScene,sv=scene.getVariables(),get=n=>scene.getObjects(n);
let p=scene.__freePlacement;
if(!p){
 p=scene.__freePlacement={wasDown:false,active:false,type:'',rightWasDown:false};
 p.stop=()=>{
  p.active=false;p.type='';get('TilePlacement_Indicator').forEach(o=>o.hide());
  if(scene.__placementBaseRing)scene.__placementBaseRing.hide();
  if(scene.__placementRange)scene.__placementRange.hide();
  if(scene.__towerBaseRings)for(const ring of scene.__towerBaseRings.values())ring.hide();
  if(scene.__blockedBuildRings)for(const ring of scene.__blockedBuildRings.values())ring.hide();
  sv.get('PlacementValid').setBoolean(false);sv.get('MapPlacementFits').setBoolean(false);
  sv.get('TowerCost').setNumber(0);sv.get('TowerShopRequestedType').setString('');sv.get('PlacementBlockReason').setString('');
  if(p.preview){p.preview.valid=false;p.preview.type='';}
  get('TileType_Button').forEach(o=>{if(o.hasBehavior('Effect'))o.getBehavior('Effect').enableEffect('Outline',false);});
 };
 p.types=['Tower','ShotgunTower','RocketTower','ArcherTower','StarCannonTower'];
 p.config=type=>p.types.includes(type)?sv.get('TowerFootprints').getChild(type).toJSObject():{};
 p.towers=()=>p.types.flatMap(get);
 p.offsets=type=>{const c=p.config(type);return [(c.AnchorX-.5)*c.Width*c.RenderScale,(c.AnchorY-.5)*c.Height*c.RenderScale];};
 // Persisted world placement center is authoritative; image centers never drive circles.
 p.center=o=>[o.getVariables().get('FootprintX').getAsNumber(),o.getVariables().get('FootprintY').getAsNumber()];
 p.positionSprite=(o,type,x,y)=>{const c=p.config(type),[ox,oy]=p.offsets(type);o.setWidth(c.Width);o.setHeight(c.Height);o.setPosition(x-c.Width/2-ox,y-c.Height/2-oy);};
 p.radius=o=>o.getVariables().get('FootprintRadius').getAsNumber()||p.config(o.getName()).Radius;
 p.segment=(x,y,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],d=dx*dx+dy*dy,t=d?Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/d)):0;return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);};
 p.polygon=(x,y,r,points)=>{
  let inside=false;
  for(let i=0,j=points.length-1;i<points.length;j=i++){
   const a=points[j],b=points[i];if(p.segment(x,y,a,b)<=r+0.04)return true;
   if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }return inside;
 };
 // SVG road ribbon: 64px outer stroke around radius-33 quarter arcs, clipped to each tile.
 p.clip=(poly,axis,edge,greater)=>{
  const out=[];let a=poly.at(-1),ai=greater?a[axis]>=edge:a[axis]<=edge;
  for(const b of poly){const bi=greater?b[axis]>=edge:b[axis]<=edge;if(ai!==bi){const t=(edge-a[axis])/(b[axis]-a[axis]);out.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}if(bi)out.push(b);a=b;ai=bi;}return out;
 };
 p.roadSkin=skin=>{
  if(['H','V'].includes(skin))return [[0,0],[64,0],[64,64],[0,64]];
  let poly=[];
  const turns={NE:[65,-1,Math.PI/2,Math.PI],NW:[-1,-1,0,Math.PI/2],SE:[65,65,Math.PI,Math.PI*1.5],SW:[-1,65,-Math.PI/2,0]};
  if(turns[skin]){
   const [cx,cy,a,b]=turns[skin];for(let i=0;i<=64;i++){const t=a+(b-a)*i/64;poly.push([cx+65*Math.cos(t),cy+65*Math.sin(t)]);}
   for(let i=64;i>=0;i--){const t=a+(b-a)*i/64;poly.push([cx+Math.cos(t),cy+Math.sin(t)]);}
  }else{
   // Rounded cap plus half tile toward the neighbouring road.
   const side=skin.slice(4),rotation={E:0,S:Math.PI/2,W:Math.PI,N:-Math.PI/2}[side]||0;
   const local=[[66,0],[66,64],[32,64]];for(let i=1;i<=64;i++){const t=Math.PI/2+Math.PI*i/64;local.push([32+32*Math.cos(t),32+32*Math.sin(t)]);}poly=local.map(([x,y])=>[32+(x-32)*Math.cos(rotation)-(y-32)*Math.sin(rotation),32+(x-32)*Math.sin(rotation)+(y-32)*Math.cos(rotation)]);
  }
  for(const [a,e,g] of [[0,0,true],[0,64,false],[1,0,true],[1,64,false]])poly=p.clip(poly,a,e,g);return poly;
 };
 p.localRoads=new Map();
 // Normalised opaque contours follow each generated prop, including transparent corners.
 p.obstacleShapes={
  Crystal:[[.55,.065],[.71,.26],[.72,.51],[.81,.49],[.90,.65],[.94,.77],[.85,.86],[.63,.94],[.40,.91],[.21,.83],[.09,.73],[.12,.63],[.16,.34],[.25,.29],[.40,.48],[.42,.21]],
  Rock:[[.18,.44],[.30,.38],[.32,.28],[.52,.24],[.64,.28],[.72,.43],[.79,.34],[.85,.50],[.93,.55],[.93,.65],[.80,.70],[.63,.76],[.42,.73],[.29,.69],[.11,.68],[.065,.60],[.11,.48]],
  Ruin:[[.5,.06],[.75,.16],[.9,.35],[.97,.55],[.86,.82],[.58,.96],[.29,.89],[.045,.62],[.12,.37],[.3,.16]]
 };
 // One authoritative circle definition drives validation and the displayed outline.
 p.blockedCircle=o=>{
  let x=o.getCenterXInScene(),y=o.getCenterYInScene(),r;
  if(o.getName()==='Ground_Decoration'){
   const kind=o.getVariables().get('Kind').getAsString(),shape=p.obstacleShapes[kind]||[[0,0],[1,0],[1,1],[0,1]],scale=(scene.__worldStyle.props[kind]||1)*(o.getVariables().get("LocalScale").getAsNumber()||1);
   const points=shape.map(([a,b])=>[x+(a-.5)*o.getWidth()*scale,y+(b-.5)*o.getHeight()*scale]);
   const minX=Math.min(...points.map(v=>v[0])),maxX=Math.max(...points.map(v=>v[0])),minY=Math.min(...points.map(v=>v[1])),maxY=Math.max(...points.map(v=>v[1]));
   x=(minX+maxX)/2;y=(minY+maxY)/2;r=Math.max(...points.map(v=>Math.hypot(v[0]-x,v[1]-y)))+9;
  }else r=o.getWidth()*(o.getName()==='SpawnMarker'?scene.__worldStyle.spawn:scene.__worldStyle.base)/2+11;
  return {owner:o,x,y,r};
 };
 p.refresh=()=>{
  p.roads=get('Monster_Path').map(o=>{const skin=o.getAnimationName();if(!p.localRoads.has(skin))p.localRoads.set(skin,p.roadSkin(skin));return p.localRoads.get(skin).map(([x,y])=>[o.getX()+x*o.getWidth()/64,o.getY()+y*o.getHeight()/64]);});
  p.blockers=[...get('Ground_Decoration').filter(o=>o.getVariables().get('Blocking').getAsBoolean()),...get('SpawnMarker'),...get('BaseMarker')].map(p.blockedCircle);

 };
 p.validate=(type,x,y)=>{
  const conf=p.config(type);if(!conf||!conf.Radius)return {valid:false,reason:'type'};
  const r=conf.Radius,ground=get('Ground_Map')[0],map=scene.getLayer(''),ui=scene.__towerShopUI.gameArea;
  if(x-r<ground.getX()||x+r>ground.getX()+ground.getWidth()||y-r<ground.getY()||y+r>ground.getY()+ground.getHeight())return {valid:false,reason:'bounds'};
  if((scene.__islandRockRegions||[]).some(poly=>p.polygon(x,y,r,poly)))return {valid:false,reason:'rocky-edge'};
  // The inner top-surface boundary excludes the rocky perimeter underlay.
  const outline=scene.__islandSurfacePolygon;
  if(outline){const points=[];for(let i=0;i<outline.length;i+=2)points.push([outline[i],outline[i+1]]);
   if(!p.polygon(x,y,0,points)||points.some((a,i)=>p.segment(x,y,a,points[(i+1)%points.length])<=r))return {valid:false,reason:'bounds'};
  }
  const screen=map.convertInverseCoords(x,y,0,[0,0]),z=map.getCameraZoom(),sr=r*z;
  if(screen[0]-sr<ui.left||screen[0]+sr>ui.right||screen[1]-sr<ui.top||screen[1]+sr>ui.bottom)return {valid:false,reason:'bounds'};
  if(p.roads.some(poly=>p.polygon(x,y,r,poly)))return {valid:false,reason:'path'};
  if(p.towers().some(o=>{const c=p.center(o);return Math.hypot(x-c[0],y-c[1])<r+p.radius(o)+sv.get('TowerFootprintPadding').getAsNumber()-1e-6;}))return {valid:false,reason:'tower'};
  if(p.blockers.some(o=>Math.hypot(x-o.x,y-o.y)<=r+o.r+1e-6))return {valid:false,reason:'obstacle'};
  const item=sv.get('TowerShopCatalog').toJSObject().find(i=>i.Type===type);
  if(!item||sv.get('Money').getAsNumber()<item.Cost)return {valid:false,reason:'gold'};
  const obstaclePanel=scene.__obstaclePanel?.screenRect,panel=scene.__selectedPanel&&scene.__selectedPanel.screenRect,hud=get('HUDPanel')[0],layer=scene.getLayer('UI');
  const a=layer.convertInverseCoords(hud.getX(),hud.getY(),0,[0,0]),b=layer.convertInverseCoords(hud.getX()+hud.getWidth(),hud.getY()+hud.getHeight(),0,[0,0]);
  const rectHit=(a,b,c,d)=>{const nx=Math.max(a,Math.min(a+c,screen[0])),ny=Math.max(b,Math.min(b+d,screen[1]));return Math.hypot(screen[0]-nx,screen[1]-ny)<=sr;};
  if(sv.get('IndexBlocksInput').getAsBoolean()||sv.get('TowerUIConsumesClick').getAsBoolean()||sv.get('SelectedPanelPointerInside').getAsBoolean()||screen[0]>=ui.sidebarX||rectHit(a[0],a[1],b[0]-a[0],b[1]-a[1])||(panel&&rectHit(panel.x,panel.y,panel.w,panel.h))||(obstaclePanel&&rectHit(obstaclePanel.x,obstaclePanel.y,obstaclePanel.w,obstaclePanel.h)))return {valid:false,reason:'ui'};
  return {valid:true,reason:'',cost:item.Cost,radius:r};
 };
 p.cursor=()=>[gdjs.evtTools.input.getCursorX(scene,'',0),gdjs.evtTools.input.getCursorY(scene,'',0)];
}
// Existing towers retain an instance footprint even when Archer animation changes.
for(const o of p.towers())if(!o.getVariables().get('FootprintRadius').getAsNumber()){
 o.getVariables().get('FootprintRadius').setNumber(p.config(o.getName()).Radius);const [ox,oy]=p.offsets(o.getName());o.getVariables().get('FootprintOffsetX').setNumber(ox);o.getVariables().get('FootprintOffsetY').setNumber(oy);o.getVariables().get('FootprintX').setNumber(o.getCenterXInScene()+ox);o.getVariables().get('FootprintY').setNumber(o.getCenterYInScene()+oy);
}
p.refresh();
const indicator=get('TilePlacement_Indicator')[0],type=indicator.getAnimationName(),conf=p.config(type),[x,y]=p.cursor();
if(conf&&conf.Radius)p.positionSprite(indicator,type,x,y);
// Shop selection shows the indicator; every exit clears the actual build state.
if(indicator.isHidden()){if(p.active)p.stop();p.preview={x,y,type:'',valid:false};sv.get('PlacementValid').setBoolean(false);sv.get('MapPlacementFits').setBoolean(false);return;}
p.active=true;p.type=type;
const result=p.validate(type,x,y);p.preview={x,y,type,...result};
sv.get('PlacementValid').setBoolean(!indicator.isHidden()&&result.valid);sv.get('MapPlacementFits').setBoolean(result.valid);sv.get('TowerCost').setNumber(result.cost||sv.get('TowerShopCatalog').toJSObject().find(i=>i.Type===type)?.Cost||0);
sv.get('PlacementBlockReason').setString(result.reason);
