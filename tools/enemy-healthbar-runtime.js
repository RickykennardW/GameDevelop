// One native track/fill pair per living Enemy lifetime, after movement/combat.
// Detach cleanup at logical death: pooled bars can be reused before corpses expire.
const scene=runtimeScene;
let bars=scene.__enemyHealthBars;
if(!bars)bars=scene.__enemyHealthBars=new Map();
let state=scene.__enemyHealthBarState;
if(!state)state=scene.__enemyHealthBarState={config:scene.getVariables().get('EnemyHPBarConfig').toJSObject(),createdPairs:0};
const backgrounds=new Set(scene.getObjects('HealthBarBackground'));
const fills=new Set(scene.getObjects('HealthBarFill'));
const living=new Set();
const dispose=pair=>{
 if(pair.disposed)return;pair.disposed=true;
 if(pair.enemy.getUniqueId()===pair.id)pair.enemy.unregisterDestroyCallback(pair.cleanup);
 // References alone are insufficient: GDevelop reinitializes pooled object instances.
 for(const [object,uid]of [[pair.background,pair.backgroundId],[pair.fill,pair.fillId]])
  if(object.getUniqueId()===uid&&object.getVariables().get('OwnerEnemyId').getAsNumber()===pair.id)object.deleteFromScene();
 if(bars.get(pair.id)===pair)bars.delete(pair.id);
};
for(const enemy of scene.getObjects('Enemy')){
 const id=enemy.getUniqueId(),health=enemy.getBehavior('Health');let pair=bars.get(id);
 if(health.IsDead()) {if(pair)dispose(pair);continue;}
 living.add(id);
 if(pair&&(pair.enemy!==enemy||pair.background.getUniqueId()!==pair.backgroundId||pair.fill.getUniqueId()!==pair.fillId||!backgrounds.has(pair.background)||!fills.has(pair.fill))){dispose(pair);pair=null;}
 if(!pair){
  const background=scene.createObject('HealthBarBackground'),fill=scene.createObject('HealthBarFill');
  pair={id,enemy,background,fill,backgroundId:background.getUniqueId(),fillId:fill.getUniqueId(),width:-1,height:-1,ratio:-1,color:'',disposed:false};
  pair.cleanup=()=>dispose(pair);enemy.registerDestroyCallback(pair.cleanup);bars.set(id,pair);state.createdPairs++;
  background.getVariables().get('OwnerEnemyId').setNumber(id);fill.getVariables().get('OwnerEnemyId').setNumber(id);
  background.setColor('255;255;255');background.setOpacity(255);fill.setOpacity(255);
 }
 const type=enemy.getVariables().get('EnemyType').getAsString(),cfg=state.config.Types[type]||state.config.Types.Basic;
 const width=cfg.Width,height=state.config.Height,current=health.Health(),maximum=health.MaxHealth();
 const ratio=Number.isFinite(current)&&Number.isFinite(maximum)&&maximum>0?Math.max(0,Math.min(1,current/maximum)):0;
 // Stable world dimensions/offsets, independent of HP, atlas size and render-only scale.
 const x=enemy.getCenterXInScene()-width/2,y=enemy.getCenterYInScene()-cfg.HeadOffset-height;
 const layer=enemy.getLayer();
 for(const object of [pair.background,pair.fill])if(object.getLayer()!==layer)object.setLayer(layer);
 pair.background.setZOrder(state.config.ZOrder);pair.fill.setZOrder(state.config.ZOrder+1);
 pair.background.setPosition(x,y);pair.fill.setPosition(x+1,y+1);
 if(pair.width!==width||pair.height!==height){
  pair.background.setWidth(width);pair.background.setHeight(height);pair.fill.setHeight(height-2);
  pair.width=width;pair.height=height;pair.ratio=-1;
 }
 if(pair.ratio!==ratio){pair.fill.setWidth((width-2)*ratio);pair.ratio=ratio;}
 const color=ratio>.6?'93;203;123':ratio>=.3?'239;192;70':'235;84;96';
 if(pair.color!==color){pair.fill.setColor(color);pair.color=color;}
 pair.background.hide(enemy.isHidden());pair.fill.hide(enemy.isHidden()||ratio<=0);
}
// Also recover from unusual external deletions without accumulating orphan owners.
for(const [id,pair]of bars)if(!living.has(id))dispose(pair);
