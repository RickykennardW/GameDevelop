// Modular celestial mortar. Damage uses the existing native Health/armor adapter.
const scene=runtimeScene,sv=scene.getVariables(),game=scene.getGame(),get=n=>scene.getObjects(n);
if(!scene.__nebulaBloom){
 const config=sv.get('NebulaBloomConfig').toJSObject();
 const nb=scene.__nebulaBloom={config,time:0,rigs:new Map(),textures:new Map(),pods:new Map(),effects:[],zones:[],poisons:new Map(),disposed:false,metrics:{shots:0,impacts:0,directHits:0,poisonTicks:0,poisonsApplied:0,zonesCreated:0,visualsDropped:0}};
 nb.valid=(a,b)=>Number.isInteger(a)&&Number.isInteger(b)&&a>=0&&b>=0&&a<=config.MaxLevel&&b<=config.MaxLevel&&!(a>=3&&b>=3);
 nb.isFusion=()=>false;
 nb.stats=(a,b)=>nb.valid(a,b)?{Damage:config.BaseDamage*config.BurstDamage[b],AttackRange:config.BaseRange*config.ToxicRange[a],AttackInterval:config.BaseInterval,ProjectileSpeed:0,BlastRadius:config.BaseRadius*config.BurstRadius[b],SplashRadius:config.BaseRadius*config.BurstRadius[b],PoisonDamage:config.PoisonDamage[a],PoisonDuration:config.PoisonDuration[a],ZoneRadius:config.ZoneRadius[a]*config.BurstRadius[b],ZoneDuration:config.ZoneDuration[a],Path1:a,Path2:b,PodSize:config.PodSize+a+2*b,Pod:b>=3?['BloomDetonationShell','StellarOverbloomShell','NebulaCataclysmShell'][b-3]:a>0?['ToxicPod','VirulentPod','BlightPod','CausticPod','PestilentPod'][a-1]:b>0?['HeavySeedPod','EnlargedBurstPod'][b-1]:'BasePod'}:null;
 nb.texture=(atlas,frame)=>{const key=atlas+':'+frame;if(!nb.textures.has(key)){const a=config.Atlases[atlas],t=game.getImageManager().getPIXITexture(a.Image);nb.textures.set(key,new PIXI.Texture(t.baseTexture,new PIXI.Rectangle(...a.Frames[frame])));}return nb.textures.get(key);};
 nb.alive=e=>!!e&&(nb.liveSet?nb.liveSet.has(e):get('Enemy').includes(e))&&!e.getBehavior('Health').IsDead()&&!e.getVariables().get('PathFinished').getAsBoolean();
 nb.owner=r=>r.owner&&r.owner.getUniqueId()===r.ownerId&&get('NebulaBloomTower').includes(r.owner)?r.owner:null;
 nb.apply=tower=>{
  if(!get('NebulaBloomTower').includes(tower))return false;const v=tower.getVariables(),a=v.get('Path1Level').getAsNumber(),b=v.get('Path2Level').getAsNumber(),s=nb.stats(a,b);if(!s)return false;
  for(const [key,val]of Object.entries(s))if(typeof val==='number')v.get(key).setNumber(val);v.get('CurrentDamage').setNumber(s.Damage);v.get('CurrentRange').setNumber(s.AttackRange);v.get('CurrentAttackInterval').setNumber(s.AttackInterval);v.get('CurrentProjectileSpeed').setNumber(0);v.get('VisualKey').setString(a+'_'+b);tower.setAnimationName(a+'_'+b);tower.setWidth(64);tower.setHeight(64);const [x,y]=scene.__freePlacement.center(tower);tower.setPosition(x-32,y-32);tower.setOpacity(0);return true;
 };
 nb.upgrade=(tower,path)=>{
  if(!get('NebulaBloomTower').includes(tower)||![1,2].includes(path)||sv.get('IndexBlocksInput').getAsBoolean()||scene.__fusion?.active)return false;
  const v=tower.getVariables(),a=v.get('Path1Level').getAsNumber(),b=v.get('Path2Level').getAsNumber(),level=path===1?a:b,other=path===1?b:a;if(!nb.valid(a,b)||level>=config.MaxLevel||level+1>=3&&other>=3)return false;
  const cost=config.Paths[path-1].Upgrades[level].Cost;if(sv.get('Money').getAsNumber()<cost)return false;sv.get('Money').sub(cost);v.get(path===1?'Path1Level':'Path2Level').setNumber(level+1);v.get('TotalInvestment').add(cost);nb.apply(tower);return true;
 };
 nb.rig=tower=>{
  const id=tower.getUniqueId(),key=tower.getVariables().get('VisualKey').getAsString();let r=nb.rigs.get(id);
  if(!r){const root=new PIXI.Container(),base=new PIXI.Container(),head=new PIXI.Container();root.addChild(base,head);r={id,tower,root,base,head};r.cleanup=()=>{if(tower.getUniqueId()===id)tower.unregisterDestroyCallback(r.cleanup);root.destroy({children:true,texture:false,baseTexture:false});nb.rigs.delete(id);};tower.registerDestroyCallback(r.cleanup);nb.rigs.set(id,r);}
  if(r.key!==key){for(const group of [r.base,r.head])for(const child of group.removeChildren())child.destroy({children:true,texture:false,baseTexture:false});r.key=key;r.cores=[];
   for(const p of config.States[key].Parts){const sprite=new PIXI.Sprite(nb.texture(p.Atlas,p.Frame));sprite.anchor.set(.5);sprite.position.set(p.X-64,p.Y-64);sprite.scale.set(p.Size/Math.max(sprite.texture.width,sprite.texture.height));sprite.rotation=p.Angle*Math.PI/180;(p.Group==='Base'?r.base:r.head).addChild(sprite);if(p.Group==='Core')r.cores.push({sprite,scale:sprite.scale.x});}
  }return r;
 };
 nb.removeObject=(o,id)=>{if(o&&o.getUniqueId()===id&&get(o.getName()).includes(o))o.deleteFromScene();};
 nb.fx=(kind,x,y,size,life=.6,alpha=.7,delay=0,drift=null)=>{
  if(nb.effects.length>=config.MaxImpactVisuals){const old=nb.effects.shift();nb.removeObject(old.object,old.id);nb.metrics.visualsDropped++;}
  const object=scene.createObject('NebulaBloomVFX');object.setAnimationName(kind);object.setLayer('');object.setZOrder(15002);object.hide(delay>0);const r={object,id:object.getUniqueId(),kind,x,y,size,life,alpha,age:-delay,drift};nb.effects.push(r);return r;
 };
 nb.clearPoison=r=>{
  if(nb.poisons.get(r.id)!==r)return;nb.poisons.delete(r.id);if(r.enemy.getUniqueId()===r.id){r.enemy.unregisterDestroyCallback(r.cleanup);scene.__enemyStatusIcons?.remove(r.enemy,'NebulaPoison',r.id);}nb.removeObject(r.icon,r.iconId);
 };
 nb.poison=(enemy,snapshot,owner,ownerId)=>{
  if(!snapshot.PoisonDamage||!nb.alive(enemy))return false;const id=enemy.getUniqueId();let r=nb.poisons.get(id);
  if(r&&r.damage>snapshot.PoisonDamage)return false;
  if(!r){const icon=scene.createObject('NebulaPoisonIcon');r={id,enemy,icon,iconId:icon.getUniqueId(),nextTick:nb.time+config.PoisonTickSeconds,bound:false};r.cleanup=()=>nb.clearPoison(r);enemy.registerDestroyCallback(r.cleanup);nb.poisons.set(id,r);nb.metrics.poisonsApplied++;nb.fx('SporeApply',enemy.getCenterXInScene(),enemy.getCenterYInScene(),24,.3,.55);}
  r.damage=snapshot.PoisonDamage;r.expires=nb.time+snapshot.PoisonDuration;r.owner=owner;r.ownerId=ownerId;
  if(scene.__enemyStatusIcons){scene.__enemyStatusIcons.set(enemy,'NebulaPoison',r.icon,config.StatusIconSize,config.StatusIconOrder);r.bound=true;}return true;
 };
 nb.impact=r=>{
  const s=r.stats,x=r.target[0],y=r.target[1],owner=nb.owner(r);nb.metrics.impacts++;
  // One native armor-aware direct hit per Enemy; decorative VFX never deal damage.
  for(const e of get('Enemy'))if(nb.alive(e)&&Math.hypot(e.getCenterXInScene()-x,e.getCenterYInScene()-y)<=s.BlastRadius){scene.__starCannon.deal(owner,e,s.Damage);nb.metrics.directHits++;nb.poison(e,s,r.owner,r.ownerId);}
  const size=s.BlastRadius*2*128/120,poison=s.Path1>0,kind=s.Path2>=3?config.ImpactFamilies.Burst[s.Path2-1]:poison?config.ImpactFamilies.Toxic[s.Path1-1]:s.Path2>0?config.ImpactFamilies.Burst[s.Path2-1]:'BaseImpact';nb.fx(kind,x,y,size,.58,poison?.62:.78);nb.fx('BaseImpact',x,y,Math.min(42,size*.45),.14,.8);nb.fx('Shockwave',x,y,size,.55,.6);
  if(s.Path2>=3)nb.fx('Shockwave',x,y,size,.7,.4,.09);
  const count=Math.min(8,2+Math.max(s.Path1,s.Path2));for(let i=0;i<count;i++){const a=i*Math.PI*2/count;nb.fx('SporeApply',x,y,12+s.Path1+s.Path2,.65,.55,i*.012,[Math.cos(a)*s.BlastRadius*.75,Math.sin(a)*s.BlastRadius*.75]);}
  if(s.ZoneDuration){const patch=scene.createObject('NebulaBloomVFX'),cloud=scene.createObject('NebulaBloomVFX'),cloudVariant=config.CloudVariants[nb.metrics.zonesCreated%config.CloudVariants.length],cloudAngle=nb.metrics.zonesCreated*config.CloudRotationStep%360;patch.setAnimationName('ToxicPatch');cloud.setAnimationName(cloudVariant);cloud.setAngle(cloudAngle);for(const o of [patch,cloud]){o.setLayer('');o.setZOrder(91);o.hide(false);}nb.zones.push({x,y,radius:s.ZoneRadius,stats:s,owner:r.owner,ownerId:r.ownerId,patch,patchId:patch.getUniqueId(),cloud,cloudId:cloud.getUniqueId(),cloudVariant,cloudAngle,born:nb.time,expires:nb.time+s.ZoneDuration,nextPulse:nb.time});nb.metrics.zonesCreated++;}
 };
 nb.predict=(enemy,flight)=>{
  let x=enemy.getCenterXInScene(),y=enemy.getCenterYInScene(),left=enemy.__golemState?.casting?0:Math.max(0,enemy.getVariables().get('MoveSpeed').getAsNumber())*flight;const path=sv.get('MonsterPathPoints').toJSObject();
  for(let i=Math.max(0,enemy.getVariables().get('Waypoint').getAsNumber());i<path.length&&left>0;i++){const p=path[i],dx=p.X-x,dy=p.Y-y,d=Math.hypot(dx,dy);if(d>left)return[x+dx*left/d,y+dy*left/d];left-=d;x=p.X;y=p.Y;}return[x,y];
 };
 nb.fire=(tower,enemy)=>{
  if(!get('NebulaBloomTower').includes(tower)||!nb.alive(enemy)||sv.get('GameOver').getAsBoolean())return false;const [x,y]=scene.__freePlacement.center(tower),v=tower.getVariables(),s=nb.stats(v.get('Path1Level').getAsNumber(),v.get('Path2Level').getAsNumber()),dist=Math.hypot(enemy.getCenterXInScene()-x,enemy.getCenterYInScene()-y);if(!s||dist>s.AttackRange)return false;
  const flight=config.FlightMin+(config.FlightMax-config.FlightMin)*Math.min(1,dist/s.AttackRange),target=nb.predict(enemy,flight),angle=Math.atan2(target[1]-y,target[0]-x),start=[x+Math.cos(angle)*16,y+Math.sin(angle)*16],object=scene.createObject('NebulaBloomPod');object.setLayer('');object.setZOrder(15003);object.setAnimationName(s.Pod);object.setWidth(s.PodSize);object.setHeight(s.PodSize);object.setPosition(start[0]-s.PodSize/2,start[1]-config.LaunchHeight-s.PodSize/2);object.hide(false);
  const record={object,id:object.getUniqueId(),owner:tower,ownerId:tower.getUniqueId(),stats:s,start,target,flight,age:0,ground:start,altitude:config.LaunchHeight};nb.pods.set(record.id,record);tower.__nebulaFired=nb.time;v.get('ShotCounter').add(1);nb.metrics.shots++;return record;
 };
 nb.tick=()=>{
  if(nb.disposed||sv.get('GameOver').getAsBoolean())return;const dt=Math.min(.2,Math.max(0,scene.getTimeManager().getElapsedTime()/1000));nb.time+=dt;const all=get('Enemy');nb.liveSet=new Set(all);const enemies=all.filter(nb.alive);
  for(const t of get('NebulaBloomTower')){
   const v=t.getVariables();if(t.__nebulaLifetime!==t.getUniqueId()){t.__nebulaLifetime=t.getUniqueId();t.__nebulaCooldown=0;t.__nebulaFacing=-90;t.__nebulaFired=-10;if(v.get('TotalInvestment').getAsNumber()<=0)v.get('TotalInvestment').setNumber(v.get('PurchasePrice').getAsNumber()||config.Cost);nb.apply(t);}nb.rig(t);t.__nebulaCooldown=Math.max(0,t.__nebulaCooldown-dt);
   const [x,y]=scene.__freePlacement.center(t),range=v.get('AttackRange').getAsNumber();let target=null,nearest=Infinity;for(const e of enemies){const d=Math.hypot(e.getCenterXInScene()-x,e.getCenterYInScene()-y);if(d<=range&&d<nearest){nearest=d;target=e;}}
   t.__nebulaTarget=target?.getUniqueId()||0;if(target){const facing=Math.atan2(target.getCenterYInScene()-y,target.getCenterXInScene()-x)*180/Math.PI,difference=(facing-t.__nebulaFacing+540)%360-180,limit=config.AimDegreesPerSecond*dt;t.__nebulaFacing+=Math.max(-limit,Math.min(limit,difference));if(t.__nebulaCooldown<=0&&nb.fire(t,target))t.__nebulaCooldown=v.get('AttackInterval').getAsNumber();}
  }
  for(const r of [...nb.pods.values()]){
   if(r.object.getUniqueId()!==r.id||!get('NebulaBloomPod').includes(r.object)){nb.pods.delete(r.id);continue;}r.age+=dt;const p=Math.min(1,r.age/r.flight);r.ground=[r.start[0]+(r.target[0]-r.start[0])*p,r.start[1]+(r.target[1]-r.start[1])*p];r.altitude=config.LaunchHeight*(1-p)+4*config.ArcHeight*p*(1-p);r.object.setPosition(r.ground[0]-r.stats.PodSize/2,r.ground[1]-r.altitude-r.stats.PodSize/2);r.object.setAngle(p*280);if(p>=1){nb.impact(r);nb.removeObject(r.object,r.id);nb.pods.delete(r.id);}
  }
  for(const z of [...nb.zones]){
   if(nb.time>=z.expires){nb.removeObject(z.patch,z.patchId);nb.removeObject(z.cloud,z.cloudId);nb.zones.splice(nb.zones.indexOf(z),1);continue;}
   if(nb.time+1e-8>=z.nextPulse){z.nextPulse=nb.time+config.CloudApplyIntervalSeconds;for(const e of enemies)if(nb.alive(e)&&Math.hypot(e.getCenterXInScene()-z.x,e.getCenterYInScene()-z.y)<=z.radius)nb.poison(e,z.stats,z.owner,z.ownerId);}
  }
  for(const r of [...nb.poisons.values()]){
   if(r.enemy.getUniqueId()!==r.id||!nb.alive(r.enemy)){nb.clearPoison(r);continue;}
   while(r.nextTick<=nb.time+1e-8&&r.nextTick<=r.expires+1e-8&&nb.alive(r.enemy)){scene.__starCannon.deal(nb.owner(r),r.enemy,r.damage);nb.metrics.poisonTicks++;r.nextTick+=config.PoisonTickSeconds;}
   if(nb.time>=r.expires||!nb.alive(r.enemy))nb.clearPoison(r);
  }
  for(const r of [...nb.effects]){r.age+=dt;if(r.object.getUniqueId()!==r.id||!get('NebulaBloomVFX').includes(r.object)||r.age>=r.life){nb.removeObject(r.object,r.id);nb.effects.splice(nb.effects.indexOf(r),1);}}nb.liveSet=null;
 };
 nb.render=()=>{
  if(nb.disposed)return;if(sv.get('GameOver').getAsBoolean())nb.clearTransients();const live=new Set(get('NebulaBloomTower').map(t=>t.getUniqueId()));for(const [id,r]of nb.rigs)if(!live.has(id))r.cleanup();
  for(const tower of get('NebulaBloomTower')){
   if(!config.States[tower.getVariables().get('VisualKey').getAsString()])nb.apply(tower);const r=nb.rig(tower),parent=scene.getLayer(tower.getLayer()).getRenderer().getRendererObject();if(r.root.parent!==parent)parent.addChild(r.root);r.root.position.set(...scene.__freePlacement.center(tower));r.root.scale.set(64*config.RenderScale/128);r.root.zIndex=tower.getZOrder()+.1;r.root.visible=!tower.isHidden();r.base.rotation=0;r.head.rotation=((tower.__nebulaFacing??-90)+90)*Math.PI/180;
   const age=nb.time-(tower.__nebulaFired??-10),charge=tower.__nebulaTarget?Math.max(0,1-(tower.__nebulaCooldown||0)/config.ChargeSeconds):0,recoil=age<config.RecoilSeconds?Math.sin(age/config.RecoilSeconds*Math.PI):0;r.head.scale.set(1+charge*.035-recoil*.08);r.head.position.y=Math.sin(nb.time*1.8)*.6+recoil*3;
   for(const c of r.cores){c.sprite.scale.set(c.scale*(1+.05*Math.sin(nb.time*3)+charge*.15));c.sprite.alpha=.82+charge*.18;}tower.setOpacity(0);tower.getVariables().get('BloomPhase').setString(age<.08?'Firing':age<.2?'Recoil':age<config.RecoilSeconds?'Recovery':charge>0?'Charge':'Idle');
  }
  if(!nb.shadow){nb.shadow=new PIXI.Graphics();nb.shadow.zIndex=90;scene.getLayer('').getRenderer().getRendererObject().addChild(nb.shadow);}nb.shadow.clear();
  for(const r of nb.pods.values())nb.shadow.beginFill(0x0b0823,.3).drawEllipse(r.ground[0],r.ground[1],r.stats.PodSize*.38,r.stats.PodSize*.16).endFill();
  for(const r of nb.effects){const o=r.object;if(r.age<0){o.hide();continue;}const t=Math.min(1,r.age/r.life),growth=r.kind==='SporeApply'?.8+.2*t:.2+.8*(1-Math.pow(1-t,2)),size=r.size*growth;o.hide(false);o.setWidth(size);o.setHeight(size);o.setPosition(r.x+(r.drift?.[0]||0)*t-size/2,r.y+(r.drift?.[1]||0)*t-size/2);o.setOpacity(255*r.alpha*Math.pow(1-t,1.25));o.setAngle((r.kind==='Shockwave'?0:18)*t);}
  for(const z of nb.zones){const remaining=Math.min(1,(z.expires-nb.time)/.5),age=Math.min(1,(nb.time-z.born)/.2),size=z.radius*2*128/120;for(const [o,scale,alpha]of [[z.patch,1,.22],[z.cloud,.97+.02*Math.sin(nb.time*1.5),.17]]){o.setWidth(size*scale);o.setHeight(size*scale);o.setPosition(z.x-size*scale/2,z.y-size*scale/2);o.setOpacity(255*alpha*remaining*age);}}
  for(const r of nb.poisons.values())if(!r.bound&&scene.__enemyStatusIcons){scene.__enemyStatusIcons.set(r.enemy,'NebulaPoison',r.icon,config.StatusIconSize,config.StatusIconOrder);r.bound=true;}scene.__enemyStatusIcons?.render();
 };
 nb.clearTransients=()=>{for(const r of [...nb.poisons.values()])nb.clearPoison(r);for(const r of nb.pods.values())nb.removeObject(r.object,r.id);nb.pods.clear();for(const r of nb.effects)nb.removeObject(r.object,r.id);nb.effects=[];for(const z of nb.zones){nb.removeObject(z.patch,z.patchId);nb.removeObject(z.cloud,z.cloudId);}nb.zones=[];nb.shadow?.clear();};
 nb.dispose=()=>{if(nb.disposed)return;nb.clearTransients();for(const r of [...nb.rigs.values()])r.cleanup();nb.shadow?.destroy();for(const t of nb.textures.values())t.destroy(false);nb.textures.clear();nb.disposed=true;};
 if(!gdjs.__nebulaBloomCleanup){gdjs.__nebulaBloomCleanup=true;gdjs.callbacksRuntimeSceneUnloading.push(s=>s.__nebulaBloom?.dispose());}
}
