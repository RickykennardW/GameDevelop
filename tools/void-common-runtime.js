// Three fixed-stat common enemies; native sprite frames, shared Enemy/Health/path.
const scene=runtimeScene,sv=scene.getVariables();
let common=scene.__voidCommon;
if(!common){
 const configs=sv.get('VoidCommonConfig').toJSObject(),types=sv.get('EnemyTypes').toJSObject();
 common=scene.__voidCommon={configs,types,actors:new Map()};
 common.has=type=>Object.prototype.hasOwnProperty.call(configs,type);
 common.ensure=e=>{
  const type=e.getVariables().get('EnemyType').getAsString();if(!common.has(type))return null;
  if(e.__voidCommonUid===e.getUniqueId())return e.__voidCommonState;
  const stats=types[type],cfg=configs[type],v=e.getVariables(),health=e.getBehavior('Health'),cx=e.getCenterXInScene(),cy=e.getCenterYInScene(),id=e.getUniqueId();
  e.setWidth(48);e.setHeight(48);e.setPosition(cx-24,cy-24);e.setAngle(0);e.flipX(false);e.setOpacity(255);e.setColor('255;255;255');
  v.get('EnemyName').setString(stats.Name);v.get('MoveSpeed').setNumber(stats.Speed);v.get('GoldReward').setNumber(stats.Reward);v.get('Armor').setNumber(stats.Armor);v.get('AnimationReferenceSpeed').setNumber(stats.Speed);v.get('RewardPaid').setBoolean(false);v.get('Facing').setString(v.get('Facing').getAsString()||'Right');
  health.SetMaxHealth(stats.HP);health.SetHealth(stats.HP);health.SetFlatDamageReduction(stats.Armor);health.SetPercentDamageReduction(0);
  const state=e.__voidCommonState={type,cfg,lastHP:stats.HP,hit:0,dying:false,deathAge:0,mode:'',direction:'',frame:-1};e.__voidCommonUid=id;common.actors.set(id,e);
  const cleanup=()=>{common.actors.delete(id);e.unregisterDestroyCallback(cleanup);};e.registerDestroyCallback(cleanup);
  return state;
 };
 common.setAnimation=(e,requested)=>{
  const state=common.ensure(e),v=e.getVariables(),direction=v.get('Facing').getAsString()||'Right';
  const mode=state.dying?'Death':state.hit>0?'Hit':requested.includes('Move_')?'Move':'Idle',name=state.type+mode+'_'+direction;
  if(e.getAnimationName()!==name){const cx=e.getCenterXInScene(),cy=e.getCenterYInScene();e.setAnimationName(name);e.setWidth(48);e.setHeight(48);e.setPosition(cx-24,cy-24);e.setAnimationFrame(0);e.playAnimation();}
  state.mode=mode;state.direction=direction;
 };
 common.beginDeath=e=>{
  const state=common.ensure(e);if(state.dying)return;
  state.dying=true;state.deathAge=0;state.hit=0;e.getVariables().get('IsMoving').setBoolean(false);common.setAnimation(e,'Death_');
 };
 common.render=()=>{
  const dt=gdjs.evtTools.runtimeScene.getElapsedTimeInSeconds(scene);
  for(const e of common.actors.values()){
   const state=e.__voidCommonState,health=e.getBehavior('Health'),hp=health.Health();
   if(hp<state.lastHP&&hp>0)state.hit=state.cfg.HitDuration;state.lastHP=hp;
   state.hit=Math.max(0,state.hit-dt);
   if(state.dying){state.deathAge+=dt;if(state.deathAge>=state.cfg.DeathDuration){e.deleteFromScene();continue;}}
   common.setAnimation(e,e.getVariables().get('IsMoving').getAsBoolean()?'Move_':'Idle_');
   const color=state.hit>0?'238;212;255':'255;255;255';if(e.getColor()!==color)e.setColor(color);
   if(state.dying)e.setOpacity(Math.round(255*Math.max(0,1-state.deathAge/state.cfg.DeathDuration)));
   state.frame=e.getAnimationFrame();
  }
 };
}
