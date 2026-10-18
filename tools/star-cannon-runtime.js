// One Star Cannon controller: native tower identity/Health/economy are retained.
// Atlas rigs are visual only. A shot, not an animation frame, owns its damage.
const scene=runtimeScene,sv=scene.getVariables(),get=n=>scene.getObjects(n);
let star=scene.__starCannon;
if(!star){
 const config=sv.get('StarCannonConfig').toJSObject(),componentConfig=sv.get('StarComponentConfig').toJSObject();
 star=scene.__starCannon={config,componentConfig,time:0,visuals:new Map(),textures:new Map(),fractures:new Map()};
 star.rotationSpeed=componentConfig.RotationDegreesPerSecond;
 star.wrap=degrees=>(degrees+540)%360-180;
 star.valid=(a,b)=>Number.isInteger(a)&&Number.isInteger(b)&&a>=0&&b>=0&&a<=config.MaxLevel&&b<=config.MaxLevel&&!(a>=3&&b>=3);
 star.stats=(a,b,stacks=0)=>{
  if(!star.valid(a,b))return null;
  const damage=config.BaseDamage*(1+config.DamageBonuses[a]);
  const speedBonus=config.SpeedBonuses[b]+(b>=4?Math.min(config.Rhythm.MaxStacks,Math.max(0,stacks))*config.Rhythm.PerStackSpeedBonus:0);
  return {Damage:damage,AttackRange:config.BaseRange*config.Path1RangeMultipliers[a]*config.Path2RangeMultipliers[b],
   AttackInterval:config.BaseInterval/(1+speedBonus),ProjectileSpeed:config.ProjectileSpeed,ProjectileCount:1,ProjectileDamage:damage,
   SplashRatio:0,SplashRadius:0,ProjectileKind:b>=5?'Overdrive':b>=4?'Rhythm':b>=3?'Twin':a>=2?'Dense':a>=1?'Compressed':b>=2?'Starflow':b>=1?'Accelerated':'Base'};
 };
 star.texture=(kit,slot)=>{
  const key=kit+':'+slot;if(star.textures.has(key))return star.textures.get(key);
  const meta=componentConfig.Kits[kit],source=scene.getGame().getImageManager().getPIXITexture(meta.Image);
  const texture=new PIXI.Texture(source.baseTexture,new PIXI.Rectangle(...meta.Frames[slot]));star.textures.set(key,texture);return texture;
 };
 star.ensureState=tower=>{
  const id=tower.getUniqueId();if(tower.__starStateOwner===id)return;
  tower.__starStateOwner=id;tower.__starOverdrive=false;tower.__starNextOverdrive=undefined;tower.__starOverdriveEnd=0;
  tower.__starNextMuzzle=0;tower.__starBarrelShots=[];tower.__starShotCount=tower.getVariables().get('ShotCounter').getAsNumber();tower.__starLastShot=star.time;tower.__starFacing=-90;
  tower.getVariables().get('RhythmStacks').setNumber(0);tower.getVariables().get('OverdriveActive').setBoolean(false);
 };
 star.visual=tower=>{
  star.ensureState(tower);
  const id=tower.getUniqueId(),key=tower.getVariables().get('VisualKey').getAsString();let pair=star.visuals.get(id);
  if(!pair){
   pair={Base:scene.createObject('StarCannonBaseVisual'),Turret:scene.createObject('StarCannonTurretVisual'),baseRig:new PIXI.Container(),turretRig:new PIXI.Container(),barrels:[],nodes:[]};
   for(const o of [pair.Base,pair.Turret])o.getVariables().get('OwnerTowerId').setNumber(tower.getVariables().get('TowerId').getAsNumber());
   const cleanup=()=>{
    pair.Base.deleteFromScene();pair.Turret.deleteFromScene();
    for(const rig of [pair.baseRig,pair.turretRig])if(!rig.destroyed)rig.destroy({children:true,texture:false,baseTexture:false});
    star.visuals.delete(id);tower.unregisterDestroyCallback(cleanup);
   };
   tower.registerDestroyCallback(cleanup);pair.cleanup=cleanup;star.visuals.set(id,pair);
  }
  if(pair.key!==key){
   pair.key=key;pair.meta=componentConfig.States[key];pair.Base.setAnimationName(key);pair.Turret.setAnimationName(key);
   for(const rig of [pair.baseRig,pair.turretRig])for(const child of rig.removeChildren())child.destroy({children:true,texture:false,baseTexture:false});
   pair.nodes=[];pair.barrels=[];
   const add=(rig,kit,slot,rect,role)=>{const sp=new PIXI.Sprite(star.texture(kit,slot));const [x,y,w,h]=rect;sp.position.set(x-44,y-44);sp.width=w;sp.height=h;rig.addChild(sp);const node={sprite:sp,role,x:x-44,y:y-44,w,h};pair.nodes.push(node);if(role.startsWith('Barrel'))pair.barrels.push(node);return node;};
   add(pair.baseRig,componentConfig.BaseKit,'Base',componentConfig.BaseRect,'Base');
   for(const p of pair.meta.Parts)add(pair.turretRig,p.Kit,p.Slot,p.Rect,p.Role);
   pair.energy=new PIXI.Graphics();pair.turretRig.addChild(pair.energy);
  }
  tower.setOpacity(0);return pair;
 };
 star.componentTransform=(tower,part)=>{
  const pair=star.visual(tower),meta=pair.meta,[x,y]=scene.__freePlacement.center(tower),size=64*scene.__worldStyle.star;
  return {x,y,size:size*meta[part].Scale,anchor:part==='Base'?meta.Base.Contact:meta.Turret.Pivot,angle:part==='Base'?0:(tower.__starFacing??meta.RestFacing)-meta.RestFacing};
 };
 star.componentPoints=(tower,part,points)=>{
  const t=star.componentTransform(tower,part),r=t.angle*Math.PI/180,c=Math.cos(r),s=Math.sin(r);
  return points.map(([x,y])=>[t.x+(x-t.anchor[0])*t.size*c-(y-t.anchor[1])*t.size*s,t.y+(x-t.anchor[0])*t.size*s+(y-t.anchor[1])*t.size*c]);
 };
 star.recoil=(tower,i)=>{
  const shot=tower.__starBarrelShots?.[i];if(!shot)return 0;
  const age=star.time-shot.time,t=age/shot.duration;if(t<0||t>=1)return 0;
  return componentConfig.RecoilDistance*(t<.18?t/.18:(1-t)/.82);
 };
 star.muzzle=(tower,i=0)=>{
  const mouth=star.visual(tower).meta.Turret.Muzzles[i];if(!mouth)return null;
  return star.componentPoints(tower,'Turret',[[mouth[0],mouth[1]+star.recoil(tower,i)/componentConfig.CanvasSize]])[0];
 };
 star.render=()=>{
  const live=new Set(get('StarCannonTower').map(t=>t.getUniqueId()));
  for(const [id,pair] of star.visuals)if(!live.has(id))pair.cleanup();
  for(const tower of get('StarCannonTower')){
   const pair=star.visual(tower),v=tower.getVariables(),a=v.get('Path1Level').getAsNumber(),b=v.get('Path2Level').getAsNumber();tower.setOpacity(0);
   const parent=scene.getLayer(tower.getLayer()).getRenderer().getRendererObject();
   for(const [i,part]of ['Base','Turret'].entries()){
    const o=pair[part],rig=part==='Base'?pair.baseRig:pair.turretRig,t=star.componentTransform(tower,part);
    o.setLayer(tower.getLayer());o.setZOrder(tower.getZOrder()+i+1);o.setAngle(t.angle);o.setWidth(64);o.setHeight(64);o.setPosition(t.x-32,t.y-32);o.setOpacity(0);o.hide(tower.isHidden());
    if(rig.parent!==parent)parent.addChild(rig);rig.position.set(t.x,t.y);rig.scale.set(t.size/componentConfig.CanvasSize);rig.rotation=t.angle*Math.PI/180;rig.visible=!tower.isHidden();rig.zIndex=o.getZOrder()+.1;
   }
   pair.barrels.forEach((node,i)=>node.sprite.y=node.y+star.recoil(tower,i));
   const remaining=tower.__starCooldown||0,chargeDuration=Math.min(componentConfig.ChargeMaxDuration,v.get('AttackInterval').getAsNumber()*componentConfig.ChargeIntervalFraction);
   const charge=tower.__starTargetId?Math.max(0,1-remaining/Math.max(.001,chargeDuration)):0;
   const stacks=v.get('RhythmStacks').getAsNumber(),active=!!tower.__starOverdrive,specialReady=a>=3&&(tower.__starShotCount||0)%config.Nova.EveryShots===config.Nova.EveryShots-1,pulse=.5+.5*Math.sin(star.time*3),energy=pair.energy;
   energy.clear();energy.beginFill(active?0xb7eeff:specialReady?0xd39aff:0x8aa7ff,.12+.12*pulse+charge*.2).drawCircle(0,12,8+charge*(specialReady?5:2)).endFill();
   for(let i=0;i<pair.barrels.length;i++){
    const mouth=pair.meta.Turret.Muzzles[i],x=(mouth[0]-.5)*88,y=(mouth[1]-.5)*88+star.recoil(tower,i);
    energy.lineStyle(specialReady?1.4:1,active?0xd7fcff:specialReady?0xe5b4ff:0xa8bfff,.3+charge*.6).drawCircle(x,y,2+charge*(specialReady?4:2));
    if(specialReady&&charge>0)energy.lineStyle(1,0xcaaaff,charge*.65).moveTo(x,10).lineTo(x,y+3);
   }
   if(a>=3)for(let n=0;n<config.Nova.EveryShots;n++)energy.beginFill(n<(tower.__starShotCount||0)%config.Nova.EveryShots?0xe2bcff:0x51446f,.9).drawCircle(-9+n*6,29,1.5).endFill();
   if(b>=4)for(let n=0;n<config.Rhythm.MaxStacks;n++)energy.beginFill(n<stacks?0xbdefff:0x51446f,n<stacks?.65+.25*pulse:.6).drawCircle(-12+n*6,29,1.5+(n<stacks?.25*pulse:0)).endFill();
   if(active)energy.lineStyle(1.2,0xb1e9ff,.4+.2*pulse).drawEllipse(0,9,26,18);
  }
 };
 star.syncStats=tower=>{
  const v=tower.getVariables(),stats=star.stats(v.get('Path1Level').getAsNumber(),v.get('Path2Level').getAsNumber(),v.get('RhythmStacks').getAsNumber());if(!stats)return false;
  for(const [key,value]of Object.entries(stats))typeof value==='string'?v.get(key).setString(value):v.get(key).setNumber(value);
  v.get('CurrentDamage').setNumber(stats.Damage);v.get('CurrentRange').setNumber(stats.AttackRange);v.get('CurrentAttackInterval').setNumber(stats.AttackInterval);v.get('CurrentProjectileSpeed').setNumber(stats.ProjectileSpeed);return true;
 };
 star.apply=tower=>{
  star.ensureState(tower);
  if(!star.syncStats(tower))return false;
  const v=tower.getVariables(),a=v.get('Path1Level').getAsNumber(),b=v.get('Path2Level').getAsNumber();
  v.get('VisualKey').setString(a+'_'+b);tower.setAnimationName(a+'_'+b);tower.setWidth(64);tower.setHeight(64);
  // Canonical ground position is unchanged through every component replacement.
  tower.setPosition(v.get('FootprintX').getAsNumber()-32,v.get('FootprintY').getAsNumber()-32);v.get('FootprintOffsetX').setNumber(0);v.get('FootprintOffsetY').setNumber(0);
  if(b>=5&&tower.__starNextOverdrive===undefined)tower.__starNextOverdrive=star.time+config.Overdrive.CooldownAfterEnd;
  star.visual(tower);return true;
 };
 star.upgrade=(tower,path)=>{
  if(!get('StarCannonTower').includes(tower)||![1,2].includes(path)||sv.get('IndexBlocksInput').getAsBoolean())return false;
  const v=tower.getVariables(),a=v.get('Path1Level').getAsNumber(),b=v.get('Path2Level').getAsNumber();if(!star.valid(a,b))return false;
  const level=path===1?a:b,other=path===1?b:a;if(level>=config.MaxLevel||(level+1>=3&&other>=3))return false;
  const cost=config.Paths[path-1].Upgrades[level].Cost;if(sv.get('Money').getAsNumber()<cost)return false;
  sv.get('Money').sub(cost);v.get(path===1?'Path1Level':'Path2Level').setNumber(level+1);v.get('TotalInvestment').add(cost);star.apply(tower);return true;
 };
 star.effect=(kind,x,y,size)=>{
  const o=scene.createObject('StarCannonImpact');o.setLayer('');o.setZOrder(15002);o.setAnimationName(kind);o.setWidth(size);o.setHeight(size);o.setPosition(x-size/2,y-size/2);
  o.__starDebuff=false;o.__muzzleFlash=false;o.__ownerId=0;o.__muzzleIndex=0;o.setOpacity(255);o.setAnimationFrame(0);o.playAnimation();
  o.__starEffect={x,y,size,age:0,life:kind==='Explosion'?.48:kind==='Surge'?.6:.28};return o;
 };
 star.fractureReduction=enemy=>{
  const rec=star.fractures.get(enemy.getUniqueId());return rec&&rec.enemy===enemy&&star.time<rec.expires?rec.baseArmor*config.Fracture.BaseArmorReduction:0;
 };
 star.refreshArmor=enemy=>{
  const rec=scene.__voidGolem?.fort.members.get(enemy.getUniqueId());
  if(rec){scene.__voidGolem.fort.armor(rec);return;}
  const v=enemy.getVariables(),base=sv.get('EnemyTypes').toJSObject()[v.get('EnemyType').getAsString()]?.Armor??v.get('BaseArmor').getAsNumber();
  const armor=Math.max(0,base-star.fractureReduction(enemy));v.get('EffectiveArmor').setNumber(armor);v.get('Armor').setNumber(armor);enemy.getBehavior('Health').SetFlatDamageReduction(armor);
 };
 star.endFracture=(rec,visual=true)=>{
  star.fractures.delete(rec.id);if(rec.icon&&get('StarCannonImpact').includes(rec.icon))rec.icon.deleteFromScene();
  if(rec.enemy.getUniqueId()===rec.id){
   const s=rec.enemy.getVariables().get('StatusEffects').getChild('ArmorFracture');s.getChild('Active').setBoolean(false);s.getChild('ExpiresAt').setNumber(0);s.getChild('ArmorReduction').setNumber(0);
   star.refreshArmor(rec.enemy);if(visual&&!rec.enemy.getBehavior('Health').IsDead())star.effect('Stabilize',rec.enemy.getCenterXInScene()-18,rec.enemy.getCenterYInScene()+12,18);
   rec.enemy.unregisterDestroyCallback(rec.cleanup);
  }
 };
 star.fracture=enemy=>{
  const id=enemy.getUniqueId();let rec=star.fractures.get(id);
  if(!rec){
   const type=enemy.getVariables().get('EnemyType').getAsString(),fort=scene.__voidGolem?.fort.ensure(enemy);
   rec={id,enemy,baseArmor:fort?.baseArmor??sv.get('EnemyTypes').toJSObject()[type]?.Armor??enemy.getBehavior('Health').FlatDamageReduction()};
   rec.cleanup=()=>star.endFracture(rec,false);enemy.registerDestroyCallback(rec.cleanup);star.fractures.set(id,rec);
   rec.icon=star.effect('FractureIcon',enemy.getCenterXInScene()-18,enemy.getCenterYInScene()+12,17);rec.icon.__starDebuff=true;
  }
  rec.expires=star.time+config.Fracture.Duration;
  const s=enemy.getVariables().get('StatusEffects').getChild('ArmorFracture');s.getChild('Active').setBoolean(true);s.getChild('ExpiresAt').setNumber(rec.expires);s.getChild('ArmorReduction').setNumber(rec.baseArmor*config.Fracture.BaseArmorReduction);
  star.refreshArmor(enemy);return rec;
 };
 star.deal=(owner,enemy,damage)=>{
  const health=enemy.getBehavior('Health');if(health.IsDead()||!Number.isFinite(damage)||damage<=0)return 0;
  const before=Math.max(0,health.Health()),armor=Math.max(0,health.FlatDamageReduction());health.Hit(Math.max(damage,armor+config.MinimumDamage),false,armor>0);
  const actual=Math.max(0,before-Math.max(0,health.Health()));if(owner)owner.getVariables().get('DamageDealt').add(actual);return actual;
 };
 star.targetValid=(tower,target,liveSet)=>{
  if(!target||!(liveSet?liveSet.has(target):get('Enemy').includes(target))||target.getBehavior('Health').IsDead())return false;
  const [x,y]=scene.__freePlacement.center(tower),range=tower.getVariables().get('AttackRange').getAsNumber();return Math.hypot(target.getCenterXInScene()-x,target.getCenterYInScene()-y)<=range;
 };
 star.bearing=(tower,target)=>{const pivot=star.componentTransform(tower,'Turret');return Math.atan2(target.getCenterYInScene()-pivot.y,target.getCenterXInScene()-pivot.x)*180/Math.PI;};
 star.canFire=(tower,target)=>star.targetValid(tower,target)&&Math.abs(star.wrap(star.bearing(tower,target)-tower.__starFacing))<=componentConfig.FireToleranceDegrees;
 star.projectileAccent=(p,a,b)=>{
  const sprite=p.getRendererObject();let accent=p.__starAccent;
  if(!accent||accent.destroyed)accent=p.__starAccent=new PIXI.Graphics();if(accent.parent!==sprite)sprite.addChild(accent);accent.clear();
  // Crosspath adds the other path's conduits/compression collar to the primary
  // projectile body. These decorative primitives never create a damage object.
  if(a>0&&b>0&&b<3){accent.lineStyle(1,0x9ceeff,.8).moveTo(18,17).lineTo(76,20).lineTo(113,24);if(b>=2)accent.moveTo(10,31).lineTo(78,28).lineTo(113,24);}
  if(a>0&&b>=3){accent.lineStyle(a>=2?2:1,0xffdf9e,.85).drawEllipse(96,24,3,a>=2?9:7);if(a>=2)accent.lineStyle(1,0xe5d2ff,.8).drawEllipse(86,24,2,7);}
 };
 star.fire=(tower,target)=>{
  if(!star.canFire(tower,target))return false;
  const v=tower.getVariables(),a=v.get('Path1Level').getAsNumber(),b=v.get('Path2Level').getAsNumber();
  tower.__starShotCount=(tower.__starShotCount||0)+1;v.get('ShotCounter').setNumber(tower.__starShotCount);
  const special=a>=3&&tower.__starShotCount%config.Nova.EveryShots===0,lance=special&&a>=5;
  const kind=special?(lance?'Lance':a>=4?'Fractured':'Nova'):v.get('ProjectileKind').getAsString();
  const dual=b>=3,overdrive=b>=5&&tower.__starOverdrive,indices=overdrive?[0,1]:[dual?(tower.__starNextMuzzle||0):0];
  if(dual&&!overdrive)tower.__starNextMuzzle=1-indices[0];
  const width=lance?56:special?46:34,height=lance?16:18;
  for(const i of indices){
   const p=scene.createObject('StarCannonProjectile'),pv=p.getVariables(),[x,y]=star.muzzle(tower,i);
   p.setLayer('');p.setZOrder(15000);p.setAnimationName(kind);p.setWidth(width);p.setHeight(height);p.setPosition(x-width/2,y-height/2);p.setAngle(tower.__starFacing);
   pv.get('OwnerTowerId').setNumber(v.get('TowerId').getAsNumber());pv.get('TargetId').setNumber(target.getUniqueId());pv.get('Damage').setNumber(v.get('Damage').getAsNumber()*(special?config.Nova.DamageMultiplier:1));
   pv.get('SplashRatio').setNumber(special&&!lance?config.Nova.SplashRatio:0);pv.get('SplashRadius').setNumber(special&&!lance?config.Nova.SplashRadius:0);pv.get('Speed').setNumber(v.get('ProjectileSpeed').getAsNumber());
   const heading=p.getAngle()*Math.PI/180;p.__starAge=0;p.__starHit=false;p.__starNew=true;p.__muzzleIndex=i;p.__spawnPoint=[x,y];p.__starDirection=[Math.cos(heading),Math.sin(heading)];
   p.__starLance=lance;p.__starHitTargets=new Set();p.__starTravel=0;p.__starRange=v.get('AttackRange').getAsNumber();p.__starFracture=special&&a>=4;p.__starCrossSpeed=b;p.__starCompression=a;
   star.projectileAccent(p,a,b);
   p.__starContactHit=!lance&&(target.getCenterXInScene()-x)*Math.cos(heading)+(target.getCenterYInScene()-y)*Math.sin(heading)<=0;
   const flash=star.effect(lance?'Pierce':special?'Fracture':'Base',x,y,special?30:22);flash.__starEffect.life=.10;flash.__muzzleFlash=true;flash.__muzzleIndex=i;flash.__ownerId=tower.getUniqueId();
   if(!tower.__starBarrelShots)tower.__starBarrelShots=[];
   tower.__starBarrelShots[i]={time:star.time,duration:Math.min(componentConfig.RecoilMaxDuration,v.get('AttackInterval').getAsNumber()*componentConfig.RecoilIntervalFraction)};
  }
  if(b>=4)v.get('RhythmStacks').setNumber(Math.min(config.Rhythm.MaxStacks,v.get('RhythmStacks').getAsNumber()+1));
  tower.__starLastShot=star.time;v.get('LastShotTime').setNumber(star.time);star.syncStats(tower);return true;
 };
 // Cropped atlas textures belong to this scene; shared base textures remain owned
 // by the game's image manager. Tower destroy callbacks own every rig/VFX.
 star.dispose=()=>{for(const rec of [...star.fractures.values()])star.endFracture(rec,false);for(const pair of [...star.visuals.values()])pair.cleanup();for(const texture of star.textures.values())texture.destroy(false);star.textures.clear();};
 if(!gdjs.__novaSpikeCallbacks){gdjs.__novaSpikeCallbacks=true;gdjs.callbacksRuntimeSceneUnloading.push(s=>s.__starCannon?.dispose());}
}
const dt=gdjs.evtTools.runtimeScene.getElapsedTimeInSeconds(scene),enemies=get('Enemy'),liveSet=new Set(enemies);star.time+=dt;
for(const rec of [...star.fractures.values()]){
 if(!liveSet.has(rec.enemy)||rec.enemy.getUniqueId()!==rec.id||rec.enemy.getBehavior('Health').IsDead()||star.time+1e-8>=rec.expires){star.endFracture(rec);continue;}
 const icon=rec.icon;icon.setPosition(rec.enemy.getCenterXInScene()-26,rec.enemy.getCenterYInScene()+4);icon.setOpacity(200+Math.round(35*Math.sin(star.time*4)));icon.hide(rec.enemy.isHidden());icon.setAnimationFrame(1);
}
for(const tower of get('StarCannonTower')){
 const v=tower.getVariables();
 if(tower.__starLifetime!==tower.getUniqueId()){
  tower.__starLifetime=tower.getUniqueId();tower.__starCooldown=0;tower.__starTargetId=0;tower.__starShotCount=v.get('ShotCounter').getAsNumber();tower.__starBarrelShots=[];tower.__starNextMuzzle=0;tower.__starLastShot=star.time;
  if(v.get('TotalInvestment').getAsNumber()<=0)v.get('TotalInvestment').setNumber(v.get('PurchasePrice').getAsNumber()||300);
  star.apply(tower);tower.__starFacing=star.visual(tower).meta.RestFacing;
 }
 star.visual(tower);tower.__starCooldown=Math.max(0,tower.__starCooldown-dt);
 const b=v.get('Path2Level').getAsNumber();
 if(b>=4&&star.time-(tower.__starLastShot??star.time)+1e-8>=star.config.Rhythm.ResetAfter&&v.get('RhythmStacks').getAsNumber()>0){v.get('RhythmStacks').setNumber(0);star.syncStats(tower);}
 if(sv.get('GameOver').getAsBoolean())continue;
 if(b>=5){
  if(tower.__starOverdrive&&star.time+1e-8>=tower.__starOverdriveEnd){tower.__starOverdrive=false;tower.__starNextOverdrive=tower.__starOverdriveEnd+star.config.Overdrive.CooldownAfterEnd;star.effect('Stabilize',...scene.__freePlacement.center(tower),65);}
  if(!tower.__starOverdrive&&star.time+1e-8>=tower.__starNextOverdrive){tower.__starOverdrive=true;tower.__starOverdriveEnd=star.time+star.config.Overdrive.Duration;star.effect('Surge',...scene.__freePlacement.center(tower),75);}
  v.get('OverdriveActive').setBoolean(!!tower.__starOverdrive);v.get('OverdriveRemaining').setNumber(tower.__starOverdrive?Math.max(0,tower.__starOverdriveEnd-star.time):Math.max(0,tower.__starNextOverdrive-star.time));
 }
 let target=enemies.find(e=>e.getUniqueId()===tower.__starTargetId);
 if(!star.targetValid(tower,target,liveSet)){
  const [x,y]=scene.__freePlacement.center(tower);let nearest=Infinity;target=null;
  for(const enemy of enemies)if(star.targetValid(tower,enemy,liveSet)){const distance=Math.hypot(enemy.getCenterXInScene()-x,enemy.getCenterYInScene()-y);if(distance<nearest){nearest=distance;target=enemy;}}
  tower.__starTargetId=target?target.getUniqueId():0;
 }
 if(!target)continue;
 const difference=star.wrap(star.bearing(tower,target)-tower.__starFacing),limit=star.rotationSpeed*dt;
 tower.__starFacing=star.wrap(tower.__starFacing+Math.max(-limit,Math.min(limit,difference)));v.get('TurretFacing').setNumber(tower.__starFacing);v.get('TargetId').setNumber(tower.__starTargetId);
 if(tower.__starCooldown<=0&&star.fire(tower,target))tower.__starCooldown=v.get('AttackInterval').getAsNumber();
}
const targets=new Map(enemies.map(e=>[e.getUniqueId(),e])),owners=new Map(get('StarCannonTower').map(t=>[t.getVariables().get('TowerId').getAsNumber(),t]));
for(const p of get('StarCannonProjectile').slice()){
 const v=p.getVariables();p.__starAge=(p.__starAge||0)+dt;
 if(p.__starAge>(p.__starLance?star.config.Lance.Lifetime:star.config.ProjectileLifetime)){star.effect('Dissipate',p.getCenterXInScene(),p.getCenterYInScene(),24);p.deleteFromScene();continue;}
 if(p.__starNew){p.__starNew=false;continue;}
 const owner=owners.get(v.get('OwnerTowerId').getAsNumber()),damage=v.get('Damage').getAsNumber(),x=p.getCenterXInScene(),y=p.getCenterYInScene();
 const travel=v.get('Speed').getAsNumber()*dt;
 if(p.__starLance){
  const [ux,uy]=p.__starDirection,remaining=Math.max(0,p.__starRange-p.__starTravel),step=Math.min(travel,remaining),hits=[];
  for(const enemy of enemies){
   if(enemy.getBehavior('Health').IsDead()||p.__starHitTargets.has(enemy.getUniqueId()))continue;
   const dx=enemy.getCenterXInScene()-x,dy=enemy.getCenterYInScene()-y,along=dx*ux+dy*uy;
   const radius=star.config.Lance.HitRadius+Math.min(enemy.getWidth(),enemy.getHeight())*.2;
   if(along>=-radius&&along<=step+radius&&Math.abs(dx*uy-dy*ux)<=radius)hits.push({enemy,along});
  }
  hits.sort((a,b)=>a.along-b.along);
  for(const {enemy,along}of hits){
   if(p.__starHitTargets.size>=star.config.Lance.MaxTargets)break;
   p.__starHitTargets.add(enemy.getUniqueId());if(p.__starFracture)star.fracture(enemy);star.deal(owner,enemy,damage);star.effect('Pierce',x+ux*Math.max(0,along),y+uy*Math.max(0,along),32);
  }
  p.__starTravel+=step;p.setPosition(p.getX()+ux*step,p.getY()+uy*step);
  if(p.__starHitTargets.size>=star.config.Lance.MaxTargets||p.__starTravel+1e-8>=p.__starRange||p.__starAge>=star.config.Lance.Lifetime){star.effect('Dissipate',p.getCenterXInScene(),p.getCenterYInScene(),40);p.deleteFromScene();}
  continue;
 }
 const target=targets.get(v.get('TargetId').getAsNumber());
 if(!target||target.getBehavior('Health').IsDead()){star.effect('Dissipate',x,y,20);p.deleteFromScene();continue;}
 const tx=target.getCenterXInScene(),ty=target.getCenterYInScene(),dx=tx-x,dy=ty-y,distance=Math.hypot(dx,dy);
 if(!p.__starContactHit)p.setAngle(Math.atan2(dy,dx)*180/Math.PI);
 if(!p.__starContactHit&&distance>travel+star.config.ProjectileContactRadius){p.setPosition(p.getX()+dx/distance*travel,p.getY()+dy/distance*travel);continue;}
 if(p.__starHit)continue;p.__starHit=true;
 if(p.__starFracture)star.fracture(target);star.deal(owner,target,damage);
 const ratio=v.get('SplashRatio').getAsNumber(),radius=v.get('SplashRadius').getAsNumber();
 if(ratio>0)for(const enemy of enemies)if(enemy!==target&&!enemy.getBehavior('Health').IsDead()&&Math.hypot(enemy.getCenterXInScene()-tx,enemy.getCenterYInScene()-ty)<=radius){if(p.__starFracture)star.fracture(enemy);star.deal(owner,enemy,damage*ratio);}
 star.effect(ratio>0?'Explosion':p.__starFracture?'Fracture':'Base',tx,ty,ratio>0?radius*2:30);p.deleteFromScene();
}
for(const effect of get('StarCannonImpact').slice()){
 if(effect.__starDebuff)continue;
 const a=effect.__starEffect;if(!a){effect.deleteFromScene();continue;}a.age+=dt;
 if(a.age>=a.life){effect.deleteFromScene();continue;}
 const t=a.age/a.life,size=a.size;effect.setAnimationFrame(Math.min(5,Math.floor(t*6)));effect.pauseAnimation();effect.setOpacity(255*(1-t*.45));effect.setWidth(size);effect.setHeight(size);effect.setPosition(a.x-size/2,a.y-size/2);
}
