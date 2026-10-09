// Selection silhouettes are independent of placement/range circles and logical sprite bounds.
const scene=runtimeScene,sv=scene.getVariables(),p=scene.__freePlacement,input=scene.getGame().getInputManager();
const down=input.isMouseButtonPressed(0),pressed=down&&!sv.get('TowerPointerWasDown').getAsBoolean();
let pick=scene.__worldSelection;
if(!pick){
 const geometry=sv.get('SelectionGeometry').toJSObject();
 pick=scene.__worldSelection={geometry};
 pick.hitPolygon=(x,y,points,padding=3)=>scene.__freePlacement.polygon(x,y,padding,points);
 pick.spritePoints=(o,scale,hull)=>{
  const r=o.getAngle()*Math.PI/180,c=Math.cos(r),s=Math.sin(r),w=o.getWidth()*scale,h=o.getHeight()*scale;
  const x=o.getCenterXInScene(),y=o.getCenterYInScene();
  return hull.map(([a,b])=>[x+(a-.5)*w*c-(b-.5)*h*s,y+(a-.5)*w*s+(b-.5)*h*c]);
 };
 pick.towerHit=(o,x,y)=>{
  const visual=scene.__starCannon?.visual(o);if(!visual)return false;
  return ['Base','Turret'].some(part=>pick.hitPolygon(x,y,scene.__starCannon.componentPoints(o,part,visual.meta[part].Hull)));
 };
 pick.obstacleHit=(o,x,y)=>{
  const kind=o.getVariables().get('Kind').getAsString(),hull=geometry.Ground_Decoration?.[kind]?.Hull;if(!hull)return false;
  const scale=(scene.__worldStyle.props[kind]||1)*(o.getVariables().get('LocalScale').getAsNumber()||1);
  return pick.hitPolygon(x,y,pick.spritePoints(o,scale,hull));
 };
}
if(!pressed||!p)return;
if(sv.get('IndexBlocksInput').getAsBoolean()||sv.get('TowerUIConsumesClick').getAsBoolean()||sv.get('SelectedPanelPointerInside').getAsBoolean()||sv.get('ObstaclePanelPointerInside').getAsBoolean())return;
const [x,y]=p.cursor(),screen=scene.getLayer('').convertInverseCoords(x,y,0,[0,0]),area=scene.__towerShopUI.gameArea;
if(screen[0]<area.left||screen[0]>=area.right||screen[1]<area.top||screen[1]>=area.bottom)return;
const hud=scene.getObjects('HUDPanel')[0],hl=scene.getLayer('UI'),a=hl.convertInverseCoords(hud.getX(),hud.getY(),0,[0,0]),b=hl.convertInverseCoords(hud.getX()+hud.getWidth(),hud.getY()+hud.getHeight(),0,[0,0]);
if(screen[0]>=a[0]&&screen[0]<=b[0]&&screen[1]>=a[1]&&screen[1]<=b[1])return;
if(p.active||!scene.getObjects('TilePlacement_Indicator')[0].isHidden())return;
const tower=p.towers().filter(o=>pick.towerHit(o,x,y)).sort((a,b)=>b.getZOrder()-a.getZOrder())[0];
if(tower){scene.__obstaclePanel?.close();sv.get('SelectedTower').setNumber(tower.getVariables().get('TowerId').getAsNumber());return;}
const obstacle=scene.getObjects('Ground_Decoration').filter(o=>o.getVariables().get('EnvironmentCategory').getAsString()==='RemovableObstacle'&&pick.obstacleHit(o,x,y)).sort((a,b)=>b.getZOrder()-a.getZOrder())[0];
sv.get('SelectedTower').setNumber(0);
if(obstacle)scene.__obstaclePanel.select(obstacle);else scene.__obstaclePanel?.close();
