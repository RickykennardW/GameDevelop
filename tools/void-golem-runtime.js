// One elite archetype; native Enemy/Health/path, five directional atlas animations.
// This block runs before spawn/movement. Buff expiration precedes all combat.
const scene=runtimeScene,sv=scene.getVariables();
let g=scene.__voidGolem;
if(!g){
 const config=sv.get('VoidGolemConfig').toJSObject(),types=sv.get('EnemyTypes').toJSObject();
 g=scene.__voidGolem={config,types,time:0,frameTime:0,actors:new Map(),textures:new Map()};
 const alive=(e,liveSet)=>(liveSet?liveSet.has(e):scene.getObjects('Enemy').includes(e))&&!e.getBehavior('Health').IsDead()&&!e.getVariables().get('PathFinished').getAsBoolean()&&e.getVariables().get('EnemyState').getAsString()!=='ReachedBase';
 const f=g.fort={name:'VoidFortification',members:new Map(),pulses:new Map(),createdVFX:0,casts:0};
 const owns=(object,uid,id,variable)=>object&&object.getUniqueId()===uid&&object.getVariables().get(variable).getAsNumber()===id;
 const status=rec=>rec.enemy.getVariables().get('StatusEffects').getChild(f.name);
 f.armor=rec=>{
  const v=rec.enemy.getVariables(),value=rec.baseArmor+(rec.active?config.Skill.ArmorBonus:0),health=rec.enemy.getBehavior('Health');
  v.get('BaseArmor').setNumber(rec.baseArmor);v.get('EffectiveArmor').setNumber(value);v.get('Armor').setNumber(value);
  if(health.FlatDamageReduction()!==value)health.SetFlatDamageReduction(value);
 };
 f.end=rec=>{
  if(owns(rec.vfx,rec.vfxId,rec.id,'OwnerEnemyId'))rec.vfx.deleteFromScene();rec.vfx=null;
  rec.active=false;rec.expires=0;
  if(rec.enemy.getUniqueId()===rec.id){
   f.armor(rec);const v=rec.enemy.getVariables(),s=status(rec);
   v.get('VoidFortificationActive').setBoolean(false);v.get('VoidFortificationExpirationTime').setNumber(0);
   s.getChild('Active').setBoolean(false);s.getChild('ExpiresAt').setNumber(0);s.getChild('ArmorBonus').setNumber(0);
  }
 };
 f.remove=enemy=>{
  const id=enemy.getUniqueId(),rec=f.members.get(id);if(!rec)return;
  f.end(rec);enemy.unregisterDestroyCallback(rec.cleanup);f.members.delete(id);
  for(const [key,p]of f.pulses)if(p.casterId===id){if(owns(p.object,p.uid,id,'OwnerEnemyId'))p.object.deleteFromScene();f.pulses.delete(key);}
 };
 f.ensure=enemy=>{
  const id=enemy.getUniqueId();if(f.members.has(id))return f.members.get(id);if(!alive(enemy))return null;
  const v=enemy.getVariables(),type=v.get('EnemyType').getAsString(),baseArmor=types[type]?.Armor??enemy.getBehavior('Health').FlatDamageReduction();
  const rec={id,enemy,baseArmor,active:false,expires:0,vfx:null,vfxId:0};
  rec.cleanup=()=>f.remove(enemy);enemy.registerDestroyCallback(rec.cleanup);f.members.set(id,rec);f.end(rec);return rec;
 };
 f.preFrame=()=>{
  const liveSet=new Set(scene.getObjects('Enemy'));
  for(const rec of f.members.values()){
   if(rec.enemy.getUniqueId()!==rec.id){f.end(rec);f.members.delete(rec.id);continue;}
   if(!alive(rec.enemy,liveSet)){f.remove(rec.enemy);continue;}
   if(rec.active&&g.frameTime+1e-8>=rec.expires)f.end(rec);
  }
 };
 f.apply=caster=>{
  if(!alive(caster))return [];
  const cx=caster.getCenterXInScene(),cy=caster.getCenterYInScene(),radius2=config.Skill.Radius**2,targets=[];
  const enemies=scene.getObjects('Enemy'),liveSet=new Set(enemies);
  for(const e of enemies){
   if(!alive(e,liveSet))continue;const dx=e.getCenterXInScene()-cx,dy=e.getCenterYInScene()-cy;
   if(dx*dx+dy*dy>radius2+1e-8)continue;
   const rec=f.ensure(e);rec.active=true;rec.expires=g.frameTime+config.Skill.Duration;f.armor(rec);
   const v=e.getVariables(),s=status(rec);v.get('VoidFortificationActive').setBoolean(true);v.get('VoidFortificationExpirationTime').setNumber(rec.expires);
   s.getChild('Active').setBoolean(true);s.getChild('ExpiresAt').setNumber(rec.expires);s.getChild('ArmorBonus').setNumber(config.Skill.ArmorBonus);targets.push(rec.id);
  }
  const pulse=scene.createObject('VoidFortificationCastPulse'),id=caster.getUniqueId();
  pulse.getVariables().get('OwnerEnemyId').setNumber(id);pulse.setLayer(caster.getLayer());pulse.setZOrder(11990);
  f.pulses.set(pulse.getUniqueId(),{object:pulse,uid:pulse.getUniqueId(),casterId:id,x:cx,y:cy,start:g.frameTime,life:config.Skill.PulseDuration});f.casts++;
  return targets;
 };
 f.render=()=>{
  const liveIcons=new Set(scene.getObjects('VoidFortificationVFX')),liveSet=new Set(scene.getObjects('Enemy'));
  for(const rec of f.members.values())if(rec.active&&alive(rec.enemy,liveSet)){
   if(!owns(rec.vfx,rec.vfxId,rec.id,'OwnerEnemyId')||!liveIcons.has(rec.vfx)){
    const icon=scene.createObject('VoidFortificationVFX');icon.getVariables().get('OwnerEnemyId').setNumber(rec.id);rec.vfx=icon;rec.vfxId=icon.getUniqueId();f.createdVFX++;
   }
   const e=rec.enemy,icon=rec.vfx,type=e.getVariables().get('EnemyType').getAsString(),hp=sv.get('EnemyHPBarConfig').getChild('Types').getChild(type);
   const size=type==='VoidGolem'?config.Skill.EliteIconSize:config.Skill.CommonIconSize;
   icon.setLayer(e.getLayer());icon.setZOrder(14990);icon.setWidth(size);icon.setHeight(size);
   icon.setPosition(e.getCenterXInScene()+hp.getChild('Width').getAsNumber()/2+3,e.getCenterYInScene()-hp.getChild('HeadOffset').getAsNumber()-7);
   icon.setOpacity(Math.round(224+25*Math.sin(g.frameTime*3+rec.id)));icon.hide(e.isHidden());
  }
  for(const [id,p]of f.pulses){
   const t=(g.frameTime-p.start)/p.life;
   if(t>=1){if(owns(p.object,p.uid,p.casterId,'OwnerEnemyId'))p.object.deleteFromScene();f.pulses.delete(id);continue;}
   const size=24+(config.Skill.Radius*2-24)*Math.max(0,t);p.object.setWidth(size);p.object.setHeight(size);p.object.setPosition(p.x-size/2,p.y-size/2);p.object.setOpacity(Math.round(190*(1-t)));
  }
 };
 g.has=e=>e.getVariables().get('EnemyType').getAsString()==='VoidGolem';
 g.ensure=e=>{
  if(e.__golemUid===e.getUniqueId())return e.__golemState;
  const id=e.getUniqueId(),v=e.getVariables(),health=e.getBehavior('Health'),cx=e.getCenterXInScene(),cy=e.getCenterYInScene();
  e.setAnimationName('VoidGolemIdle_'+(v.get('Facing').getAsString()||'Right'));e.setWidth(config.LogicalSize);e.setHeight(config.LogicalSize);e.setPosition(cx-config.LogicalSize/2,cy-config.LogicalSize/2);e.setAngle(0);e.flipX(false);e.setOpacity(0);
  v.get('EnemyType').setString('VoidGolem');v.get('EnemyName').setString('Void Golem');v.get('MoveSpeed').setNumber(config.Speed);v.get('AnimationReferenceSpeed').setNumber(config.Speed);v.get('GoldReward').setNumber(config.Reward);v.get('Armor').setNumber(config.Armor);v.get('RewardPaid').setBoolean(false);
  health.SetMaxHealth(config.HP);health.SetHealth(config.HP);health.SetFlatDamageReduction(config.Armor);health.SetPercentDamageReduction(0);
  const state=e.__golemState={id,spawnTime:g.frameTime,nextCast:g.frameTime+config.Skill.Cooldown,casting:false,castStart:0,applied:false,dying:false,deathStart:0,mode:'',modeStart:g.frameTime,lastHP:config.HP,hitUntil:0,castCount:0,releaseCount:0};e.__golemUid=id;g.actors.set(id,e);
  v.get('EnemyState').setString('Moving');v.get('IsCasting').setBoolean(false);v.get('SkillCooldown').setNumber(config.Skill.Cooldown);v.get('SkillCastTimer').setNumber(0);v.get('SkillAppliedThisCast').setBoolean(false);
  const cleanup=()=>{f.remove(e);g.actors.delete(id);e.unregisterDestroyCallback(cleanup);};e.registerDestroyCallback(cleanup);f.ensure(e);return state;
 };
 g.setAnimation=(e,requested)=>{
  const state=g.ensure(e),v=e.getVariables(),dir=state.casting?state.facing:v.get('Facing').getAsString()||'Right';
  const mode=state.dying?'Death':state.casting?'Skill':g.frameTime<state.hitUntil?'Hit':requested.includes('Move')?'Move':'Idle',name='VoidGolem'+mode+'_'+dir;
  if(e.getAnimationName()!==name){const cx=e.getCenterXInScene(),cy=e.getCenterYInScene();e.setAnimationName(name);e.setWidth(config.LogicalSize);e.setHeight(config.LogicalSize);e.setPosition(cx-config.LogicalSize/2,cy-config.LogicalSize/2);e.setAnimationFrame(0);e.setAnimationElapsedTime(0);e.setAnimationSpeedScale(1);e.playAnimation();state.modeStart=g.frameTime;}
  state.mode=mode;state.direction=dir;
 };
 g.beforeMove=e=>{
  const state=g.ensure(e),v=e.getVariables();
  if(v.get('PathFinished').getAsBoolean()||v.get('Waypoint').getAsNumber()>=sv.get('MonsterPathPointCount').getAsNumber()){
   state.casting=false;v.get('IsCasting').setBoolean(false);v.get('EnemyState').setString('ReachedBase');v.get('PathFinished').setBoolean(true);f.remove(e);return false;
  }
  if(sv.get('GameOver').getAsBoolean()||state.dying)return false;
  if(!state.casting&&g.frameTime+1e-8>=state.nextCast){
   state.casting=true;state.castStart=g.frameTime;state.nextCast=g.frameTime+config.Skill.Cooldown;state.applied=false;state.facing=v.get('Facing').getAsString()||'Right';state.x=e.getX();state.y=e.getY();state.waypoint=v.get('Waypoint').getAsNumber();state.castCount++;
   v.get('IsCasting').setBoolean(true);v.get('EnemyState').setString('Casting');v.get('SkillAppliedThisCast').setBoolean(false);g.setAnimation(e,'Skill');
  }
  v.get('SkillCooldown').setNumber(Math.max(0,state.nextCast-g.frameTime));
  if(state.casting){
   e.setPosition(state.x,state.y);v.get('Waypoint').setNumber(state.waypoint);v.get('Facing').setString(state.facing);v.get('IsMoving').setBoolean(false);v.get('SkillCastTimer').setNumber(g.frameTime-state.castStart);g.setAnimation(e,'Skill');return false;
  }
  v.get('EnemyState').setString('Moving');return true;
 };
 g.beginDeath=e=>{
  const state=g.ensure(e);if(state.dying)return;state.dying=true;state.deathStart=g.frameTime;state.casting=false;state.hitUntil=0;
  const v=e.getVariables();v.get('IsCasting').setBoolean(false);v.get('EnemyState').setString('Dying');v.get('IsMoving').setBoolean(false);f.remove(e);g.setAnimation(e,'Death');
 };
 g.postCombat=()=>{
  // Damage/death precedes release. A lethal hit in the release frame cancels it.
  const liveEnemies=scene.getObjects('Enemy'),liveSet=new Set(liveEnemies);
  for(const e of liveEnemies)if(alive(e,liveSet))f.ensure(e);
  for(const e of g.actors.values()){
   const state=e.__golemState,v=e.getVariables();if(state.dying||!alive(e,liveSet)||!state.casting)continue;
   const elapsed=g.frameTime-state.castStart;v.get('SkillCastTimer').setNumber(elapsed);
   if(!state.applied&&elapsed+1e-8>=config.Skill.ReleaseTime){state.applied=true;state.releaseTargets=f.apply(e);state.releaseCount++;v.get('SkillAppliedThisCast').setBoolean(true);}
   if(elapsed+1e-8>=config.Skill.CastDuration){state.casting=false;v.get('IsCasting').setBoolean(false);v.get('EnemyState').setString('Moving');g.setAnimation(e,'Idle');}
  }
  g.time=g.frameTime;
 };
 g.texture=(dir,mode,frame)=>{
  const key=dir+':'+mode+':'+frame;if(g.textures.has(key))return g.textures.get(key);
  const row=['Idle','Move','Hit','Death','Skill'].indexOf(mode),view=config.Views[dir],region=view.Frames[row*4+frame],base=scene.getGame().getImageManager().getPIXITexture(view.Image);
  const texture=new PIXI.Texture(base.baseTexture,new PIXI.Rectangle(...region),new PIXI.Rectangle(0,0,view.CellWidth,view.CellHeight),new PIXI.Rectangle(0,0,region[2],region[3]));g.textures.set(key,texture);return texture;
 };
 g.rig=e=>{
  let rig=e.__golemRig;const id=e.getUniqueId();
  if(!rig||rig.id!==id||rig.container.destroyed){
   if(rig&&!rig.container.destroyed)rig.container.destroy({children:true,texture:false,baseTexture:false});
   const container=new PIXI.Container(),body=new PIXI.Sprite();container.addChild(body);rig=e.__golemRig={id,container,body};
   const cleanup=()=>{if(!container.destroyed)container.destroy({children:true,texture:false,baseTexture:false});e.unregisterDestroyCallback(cleanup);};e.registerDestroyCallback(cleanup);
  }
  const layer=scene.getLayer(e.getLayer()).getRenderer().getRendererObject();if(rig.container.parent!==layer)layer.addChild(rig.container);
  rig.container.zIndex=e.getZOrder()+.25;rig.container.position.set(e.getCenterXInScene(),e.getCenterYInScene());rig.container.visible=!e.isHidden();return rig;
 };
 g.portrait=(o,x,y,size)=>{o.__golemPortrait={x,y,size};o.setOpacity(0);};
 g.render=()=>{
  for(const e of g.actors.values()){
   const state=e.__golemState,hp=e.getBehavior('Health').Health();
   if(hp<state.lastHP&&hp>0)state.hitUntil=g.frameTime+config.HitDuration;state.lastHP=hp;
   if(state.dying&&g.frameTime-state.deathStart+1e-8>=config.DeathDuration){e.deleteFromScene();continue;}
   g.setAnimation(e,e.getVariables().get('IsMoving').getAsBoolean()?'Move':'Idle');
   const mode=state.mode,period={Idle:config.IdleDuration,Move:config.MoveDuration,Hit:config.HitDuration,Death:config.DeathDuration,Skill:config.Skill.CastDuration}[mode];
   const age=mode==='Skill'?g.frameTime-state.castStart:mode==='Death'?g.frameTime-state.deathStart:g.frameTime-state.modeStart;
   const frame=Math.min(3,Math.floor((['Idle','Move'].includes(mode)?age%period:Math.max(0,age))/period*4));e.setAnimationFrame(frame);e.setOpacity(0);e.updatePreRender(scene);
   const rig=g.rig(e),view=config.Views[state.direction],row=['Idle','Move','Hit','Death','Skill'].indexOf(mode),anchor=view.Anchors[row*4+frame];rig.body.texture=g.texture(state.direction,mode,frame);rig.body.anchor.set(anchor[0],anchor[1]*view.Frames[row*4+frame][3]/view.CellHeight);rig.body.scale.set(config.RenderSize/view.CellWidth);rig.body.rotation=0;
   rig.body.position.set(0,0);rig.body.tint=g.frameTime<state.hitUntil?0xeee3ff:0xffffff;rig.body.alpha=state.dying?Math.max(0,1-(g.frameTime-state.deathStart)/config.DeathDuration):1;
  }
  for(const o of scene.getObjects('IndexMonsterImage')){
   if(o.isHidden()||!o.getAnimationName().startsWith('VoidGolem')){if(o.__golemPortraitRig)o.__golemPortraitRig.visible=false;continue;}
   let rig=o.__golemPortraitRig;
   if(!rig||rig.destroyed){rig=o.__golemPortraitRig=new PIXI.Sprite(g.texture('Down','Idle',0));const cleanup=()=>{if(!rig.destroyed)rig.destroy({texture:false,baseTexture:false});o.unregisterDestroyCallback(cleanup);};o.registerDestroyCallback(cleanup);}
   const parent=scene.getLayer(o.getLayer()).getRenderer().getRendererObject();if(rig.parent!==parent)parent.addChild(rig);
   const layout=o.__golemPortrait;if(!layout){rig.visible=false;continue;}rig.visible=true;rig.zIndex=o.getZOrder()+.25;rig.anchor.set(.5,.5);rig.position.set(layout.x,layout.y);rig.scale.set(layout.size/rig.texture.height);o.setOpacity(0);
  }
  f.render();
 };
}
g.frameTime=g.time+gdjs.evtTools.runtimeScene.getElapsedTimeInSeconds(scene);
g.fort.preFrame();
