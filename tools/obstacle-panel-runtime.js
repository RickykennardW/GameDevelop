// Each removable prop owns its native visual, blocker, shadow and stable runtime ID.
const scene=runtimeScene,sv=scene.getVariables(),get=n=>scene.getObjects(n),p=scene.__freePlacement;
let ui=scene.__obstaclePanel;
if(!ui){
 ui=scene.__obstaclePanel={objects:{},wasDown:false,pressed:'',pressedOwner:0,message:''};
 ui.ensure=(key,name,z)=>{if(!ui.objects[key]){const o=scene.createObject(name);o.setLayer('ObstacleUI');o.setZOrder(z);ui.objects[key]=o;}return ui.objects[key];};
 ui.owner=()=>get('Ground_Decoration').find(o=>o.getUniqueId()===sv.get('SelectedObstacleId').getAsNumber()&&o.getVariables().get('EnvironmentCategory').getAsString()==='RemovableObstacle');
 ui.close=()=>{sv.get('SelectedObstacleId').setNumber(0);ui.message='';ui.screenRect=null;scene.getLayer('ObstacleUI').show(false);};
 ui.select=o=>{sv.get('SelectedTower').setNumber(0);sv.get('SelectedObstacleId').setNumber(o.getUniqueId());ui.message='';ui.render();};
 ui.classify=()=>{
  const placement=scene.__freePlacement,outline=scene.__islandSurfacePolygon;if(!placement||!outline)return;
  const left=outline[0],top=outline[1],right=outline[2],bottom=outline[5];
  for(const o of get('Ground_Decoration')){
   const v=o.getVariables(),c=placement.blockedCircle(o),interior=c.x-c.r>=left+8&&c.x+c.r<=right-8&&c.y-c.r>=top+8&&c.y+c.r<=bottom-8;
   v.get('ObstacleId').setNumber(o.getUniqueId());
   v.get('EnvironmentCategory').setString(v.get('Blocking').getAsBoolean()&&interior?'RemovableObstacle':'PermanentEnvironment');
  }
  for(const name of ['SpawnMarker','BaseMarker','Monster_Path','IslandCliffFrame','VoidBackdrop','Ground_Map'])for(const o of get(name))o.getVariables().get('EnvironmentCategory').setString('PermanentEnvironment');
 };
 ui.clear=()=>{
  const o=ui.owner();if(!o)return false;
  if(sv.get('Money').getAsNumber()<250){ui.message='INSUFFICIENT GOLD';return false;}
  const id=o.getUniqueId();sv.get('Money').sub(250);ui.close();
  o.deleteFromScene();const ring=scene.__blockedBuildRings?.get(id);if(ring){ring.deleteFromScene();scene.__blockedBuildRings.delete(id);}
  // Other owners' circles remain in the fresh blocker list, including overlaps.
  scene.__freePlacement.refresh();return true;
 };
 ui.render=()=>{
  Object.values(ui.objects).forEach(o=>o.hide());const owner=ui.owner(),layer=scene.getLayer('ObstacleUI');
  layer.show(!!owner);if(!owner){ui.screenRect=null;return;}
  const game=scene.getGame(),area=scene.__towerShopUI.gameArea,w=284,h=222,margin=8;
  const hud=get('HUDPanel')[0],hl=scene.getLayer('UI'),hudBottom=hl.convertInverseCoords(hud.getX(),hud.getY()+hud.getHeight(),0,[0,0])[1];
  const s=Math.max(.01,Math.min(1,(area.right-area.left-2*margin)/w,(game.getGameResolutionHeight()-hudBottom-3*margin)/h));
  const [ox,oy]=scene.getLayer('').convertInverseCoords(owner.getCenterXInScene(),owner.getCenterYInScene(),0,[0,0]);
  const x=Math.max(area.left+margin,Math.min(area.right-margin-w*s,ox+w*s<area.right-margin?ox+20:ox-20-w*s));
  const y=Math.max(hudBottom+margin,Math.min(game.getGameResolutionHeight()-margin-h*s,oy-h*s/2));
  layer.setCameraZoom(s);layer.setCameraX(game.getGameResolutionWidth()/2/s-x/s);layer.setCameraY(game.getGameResolutionHeight()/2/s-y/s);
  ui.screenRect={x,y,w:w*s,h:h*s};
  const panel=(k,x,y,w,h,name='SelectedPanelPlaque',color='255;255;255',z=2)=>{const o=ui.ensure(k,name,z);o.setPosition(x,y);o.setWidth(w);o.setHeight(h);o.setColor(color);o.hide(false);};
  const text=(k,t,x,y,w,size,color='234;224;255',bold=false,align='left')=>{const o=ui.ensure(k,'SelectedPanelText',5);o.setPosition(x,y);o.setWrapping(true);o.setWrappingWidth(w);o.setString(t);o.setCharacterSize(size);o.setBold(bold);o.setColor(color);o.setTextAlignment(align);o.hide(false);};
  const kind=owner.getVariables().get('Kind').getAsString(),title={Crystal:'ANCIENT CRYSTAL',Rock:'CELESTIAL ROCK',Ruin:'BROKEN RUINS'}[kind]||'SOLID OBSTACLE';
  panel('frame',0,0,w,h,'SelectedPanelBackground');panel('header',10,10,w-20,38);
  text('title',title,20,22,w-60,14,'236;225;255',true);text('close','X',w-34,22,18,13,'185;167;214',true);
  text('description','This obstacle blocks tower placement.',20,62,w-40,13);
  text('message',ui.message||'Clear this space for your defenses.',20,104,w-40,11,ui.message?'255;127;160':'174;161;199');
  panel('clear',16,132,w-32,38,'SelectedPanelPlaque',ui.hover==='Clear'?'211;230;255':'255;255;255');
  text('clearLabel','CLEAR  -  250 GOLD',24,145,w-48,13,'236;228;255',true,'center');
  panel('cancel',16,180,w-32,28,'SelectedPanelPlaque','166;151;194');
  text('cancelLabel','CANCEL',24,188,w-48,11,'235;222;255',true,'center');
 };
}
ui.classify();
const ghost=get('TilePlacement_Indicator')[0],input=scene.getGame().getInputManager(),down=input.isMouseButtonPressed(0);
if(!ui.owner()||sv.get('IndexBlocksInput').getAsBoolean()||(ghost&&!ghost.isHidden())||sv.get('TowerShopRequestedType').getAsString()||gdjs.evtTools.input.wasKeyJustPressed(scene,'Escape'))ui.close();
ui.render();const mx=gdjs.evtTools.input.getCursorX(scene,'ObstacleUI',0),my=gdjs.evtTools.input.getCursorY(scene,'ObstacleUI',0),inside=(x,y,w,h)=>mx>=x&&mx<x+w&&my>=y&&my<y+h;
const owner=ui.owner(),pointer=!!owner&&inside(0,0,284,222);
sv.get('ObstaclePanelPointerInside').setBoolean(pointer);
sv.get('TowerUIConsumesClick').setBoolean(sv.get('TowerUIConsumesClick').getAsBoolean()||pointer);
ui.hover=!pointer?'':inside(16,132,252,38)?'Clear':inside(16,180,252,28)?'Cancel':inside(246,10,28,38)?'Close':'Panel';
if(down&&!ui.wasDown){ui.pressed=ui.hover;ui.pressedOwner=owner?owner.getUniqueId():0;}
if(!sv.get('AudioUIConsumesClick').getAsBoolean()&&!down&&ui.wasDown&&owner&&ui.pressed===ui.hover&&ui.pressedOwner===owner.getUniqueId()){
 if(ui.hover==='Clear')ui.clear();else if(['Cancel','Close'].includes(ui.hover))ui.close();
 ui.render();
}
if(!down)ui.pressed='';ui.wasDown=down;
