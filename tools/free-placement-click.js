// Re-read the world cursor and recompute every guard at the click edge.
const scene=runtimeScene,p=scene.__freePlacement,sv=scene.getVariables(),input=scene.getGame().getInputManager();
const down=input.isMouseButtonPressed(0),pressed=down&&!p.wasDown;p.wasDown=down;
sv.get('PlacementCommitted').setBoolean(false);
const indicator=scene.getObjects('TilePlacement_Indicator')[0];
const right=gdjs.evtTools.input.isMouseButtonPressed(scene,'Right'),cancel=right&&!p.rightWasDown;p.rightWasDown=right;
if(cancel&&p.active){p.stop();return;}
if(!pressed||!p.active||!p.type||indicator.isHidden())return;
const type=indicator.getAnimationName(),[x,y]=p.cursor();p.refresh();const result=p.validate(type,x,y);
sv.get('PlacementValid').setBoolean(result.valid);sv.get('PlacementBlockReason').setString(result.reason);
if(!result.valid)return;
const conf=p.config(type),tower=scene.createObject(type);if(!tower)return;
tower.setLayer('');const [ox,oy]=p.offsets(type);p.positionSprite(tower,type,x,y);tower.setZOrder(2);
const tv=tower.getVariables();sv.get('NextTowerId').add(1);tv.get('TowerId').setNumber(sv.get('NextTowerId').getAsNumber());tv.get('PurchasePrice').setNumber(result.cost);
tv.get('FootprintRadius').setNumber(conf.Radius);tv.get('FootprintOffsetX').setNumber(ox);tv.get('FootprintOffsetY').setNumber(oy);tv.get('FootprintX').setNumber(x);tv.get('FootprintY').setNumber(y);
if(type==='ArcherTower'||type==='StarCannonTower')tv.get('TotalInvestment').setNumber(result.cost);
if(type==='ShotgunTower'||type==='RocketTower')tower.resetTimer('shoot');
sv.get('Money').sub(result.cost);sv.get('PlacementCommitted').setBoolean(true);
// Single placement consumes the builder, not only the current mouse edge.
p.stop();
// A held press cannot buy another tower, even after moving to another valid location.
