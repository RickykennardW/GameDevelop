// One fixed-stat Void Hound archetype; share Enemy, Health, route and combat.
const scene=runtimeScene,sv=scene.getVariables(),get=n=>scene.getObjects(n);
let hound=scene.__voidHound;
if(!hound){
 const config=sv.get('VoidHoundConfig').toJSObject();
 hound=scene.__voidHound={config,textures:new Map()};
 hound.ensure=e=>{
  if(e.__houndUid===e.getUniqueId())return e.__houndState;
  const cx=e.getCenterXInScene(),cy=e.getCenterYInScene();e.setWidth(48);e.setHeight(48);e.setPosition(cx-24,cy-24);e.setAngle(0);e.flipX(false);
  const v=e.getVariables(),health=e.getBehavior('Health');
  v.get('EnemyType').setString('VoidHound');v.get('EnemyName').setString(config.Name);v.get('Armor').setNumber(0);v.get('GoldReward').setNumber(config.Reward);v.get('MoveSpeed').setNumber(config.Speed);v.get('AnimationReferenceSpeed').setNumber(config.Speed);v.get('RewardPaid').setBoolean(false);
  v.get('Facing').setString(v.get('Facing').getAsString()||'Right');health.SetMaxHealth(config.HP);health.SetHealth(config.HP);
  e.__houndUid=e.getUniqueId();e.__houndState={age:0,hit:0,lastHP:config.HP,dying:false,deathAge:0,phase:(e.getUniqueId()*.61803398875%1)*Math.PI*2};
  return e.__houndState;
 };
 hound.texture=(direction,row,column)=>{
  const key=direction+':'+row+':'+column;if(hound.textures.has(key))return hound.textures.get(key);
  const meta=config.Views[direction],sheet=scene.getGame().getImageManager().getPIXITexture(meta.Image),rect=meta.Frames[row*config.Columns+column];
  const texture=new PIXI.Texture(sheet.baseTexture,new PIXI.Rectangle(...rect));hound.textures.set(key,texture);return texture;
 };
 hound.setAnimation=(e,name)=>{
  const cx=e.getCenterXInScene(),cy=e.getCenterYInScene();e.setAnimationName(name);e.setWidth(48);e.setHeight(48);e.setPosition(cx-24,cy-24);
 };
 hound.beginDeath=e=>{
  const state=hound.ensure(e);if(state.dying)return;
  state.dying=true;state.deathAge=0;state.hit=0;e.getVariables().get('IsMoving').setBoolean(false);
  hound.setAnimation(e,'HoundDeath_'+(e.getVariables().get('Facing').getAsString()||'Right'));
 };
 hound.rig=e=>{
  let rig=e.__houndRig;const root=e.getRendererObject();
  if(!rig||rig.owner!==e.getUniqueId()||rig.container.destroyed){
   if(rig&&!rig.container.destroyed)rig.container.destroy({children:true,texture:false,baseTexture:false});
   const container=new PIXI.Container(),shadow=new PIXI.Graphics(),body=new PIXI.Sprite(),fx=new PIXI.Graphics();body.anchor.set(.5,.55);container.addChild(shadow,body,fx);root.addChild(container);
   rig=e.__houndRig={owner:e.getUniqueId(),container,shadow,body,fx,frame:-1,mode:'',direction:''};
   const cleanup=()=>{if(!container.destroyed)container.destroy({children:true,texture:false,baseTexture:false});e.unregisterDestroyCallback(cleanup);};e.registerDestroyCallback(cleanup);
  }
  if(rig.container.parent!==root)root.addChild(rig.container);return rig;
 };
 hound.render=()=>{
  const dt=gdjs.evtTools.runtimeScene.getElapsedTimeInSeconds(scene);
  for(const e of get('Enemy').slice()){
   if(e.getVariables().get('EnemyType').getAsString()!=='VoidHound')continue;
   const state=hound.ensure(e),v=e.getVariables(),hp=e.getBehavior('Health').Health();
   if(hp<state.lastHP&&hp>0)state.hit=config.HitDuration;state.lastHP=hp;state.age+=dt;state.hit=Math.max(0,state.hit-dt);
   if(state.dying){state.deathAge+=dt;if(state.deathAge>=config.DeathDuration){e.deleteFromScene();continue;}}
   const direction=v.get('Facing').getAsString()||'Right',mode=state.dying?'Death':state.hit>0?'Hit':v.get('IsMoving').getAsBoolean()?'Move':'Idle';
   const row={Idle:0,Move:1,Hit:2,Death:3}[mode],period=mode==='Idle'?config.IdleDuration:mode==='Move'?config.RunDuration:mode==='Hit'?config.HitDuration:config.DeathDuration;
   const t=mode==='Death'?state.deathAge:mode==='Hit'?config.HitDuration-state.hit:state.age;
   const frame=mode==='Death'||mode==='Hit'?Math.min(3,Math.floor(t/period*4)):Math.floor((t%period)/period*4);
   hound.setAnimation(e,'Hound'+mode+'_'+direction);e.updatePreRender(scene);const rig=hound.rig(e),root=e.getRendererObject(),texture=hound.texture(direction,row,frame),meta=config.Views[direction];
   rig.body.texture=texture;rig.body.anchor.set(...meta.Anchors[row*config.Columns+frame]);rig.frame=frame;rig.mode=mode;rig.direction=direction;
   root.texture=PIXI.Texture.EMPTY;root.anchor.set(0);root.position.set(e.getCenterXInScene(),e.getCenterYInScene());root.scale.set(1);root.rotation=0;
   const scale=config.RenderSize/meta.CellWidth;rig.body.scale.set(scale);rig.body.alpha=state.dying?Math.max(0,1-state.deathAge/config.DeathDuration):1;
   const recoil=state.hit>0?Math.sin((config.HitDuration-state.hit)/config.HitDuration*Math.PI)*2:0,d={Right:[-1,0],Left:[1,0],Down:[0,-1],Up:[0,1]}[direction];
   rig.body.position.set(d[0]*recoil,d[1]*recoil+(mode==='Idle'?Math.sin(state.age*3+state.phase)*.35:0));
   rig.body.tint=state.hit>0?0xf0ceff:0xffffff;
   rig.shadow.clear().beginFill(0x130b27,.22*rig.body.alpha).drawEllipse(0,config.RenderSize*.19,config.RenderSize*.22,config.RenderSize*.04).endFill();
   const fx=rig.fx;fx.clear();
   if(mode==='Move')for(let i=0;i<4;i++){const q=(state.age*3+i/4)%1;fx.beginFill(i%2?0xad5fff:0x8650d5,(1-q)*.25).drawCircle(d[0]*(24+q*15),d[1]*(24+q*15)+(i%2?3:-3),.7+q).endFill();}
   if(state.hit>0||state.dying){const q=state.dying?state.deathAge/config.DeathDuration:1-state.hit/config.HitDuration;for(let i=0;i<8;i++){const a=i*Math.PI/4+state.phase;fx.beginFill(i%2?0xcca5ff:0x8f39ed,(1-q)*.7).drawCircle(Math.cos(a)*(10+q*24),Math.sin(a)*(7+q*16),1.2*(1-q)+.2).endFill();}}
  }
  // Index portrait uses a single atlas cell, never the entire sprite sheet.
  for(const o of get('IndexMonsterImage')){
   if(o.isHidden()||!o.getAnimationName().startsWith('Hound'))continue;
   o.updatePreRender(scene);const sprite=o.getRendererObject(),texture=hound.texture('Down',0,0);sprite.texture=texture;sprite.anchor.set(.5);sprite.position.set(o.getCenterXInScene(),o.getCenterYInScene());sprite.scale.set(o.getWidth()/texture.width,o.getHeight()/texture.height);sprite.rotation=0;
  }
 };
}
