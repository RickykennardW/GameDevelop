// Star Cannon owns only its own volleys, homing projectiles and impact effects.
const scene=runtimeScene,sv=scene.getVariables(),get=n=>scene.getObjects(n);
let star=scene.__starCannon;
if(!star){
 const config=sv.get('StarCannonConfig').toJSObject();
 star=scene.__starCannon={config};
// Component transforms are shared by rendering, muzzle spawning and selection.
// Component transforms are shared by rendering, muzzle spawning and selection.
// Component transforms are shared by rendering, muzzle spawning and selection.
const componentConfig=sv.get('StarComponentConfig').toJSObject();
star.rotationSpeed=componentConfig.RotationDegreesPerSecond;
star.visuals=new Map();
star.visual=tower=>{
 const id=tower.getUniqueId(),key=tower.getVariables().get('VisualKey').getAsString();
 let pair=star.visuals.get(id);
 if(!pair){
  pair={Base:scene.createObject('StarCannonBaseVisual'),Turret:scene.createObject('StarCannonTurretVisual')};
  for(const o of [pair.Base,pair.Turret]){o.setLayer(tower.getLayer());o.getVariables().get('OwnerTowerId').setNumber(tower.getVariables().get('TowerId').getAsNumber());}
  const dispose=()=>{pair.Base.deleteFromScene();pair.Turret.deleteFromScene();star.visuals.delete(id);tower.unregisterDestroyCallback(dispose);};
  tower.registerDestroyCallback(dispose);star.visuals.set(id,pair);
 }
 if(pair.key!==key){pair.key=key;pair.meta=componentConfig.States[key];pair.Base.setAnimationName(key);pair.Turret.setAnimationName(key);}
 tower.setOpacity(0);return pair;
};
star.componentTransform=(tower,part)=>{
 const pair=star.visual(tower),meta=pair.meta,[x,y]=scene.__freePlacement.center(tower),size=64*scene.__worldStyle.star;
 if(part==='Base')return {x,y,size:size*meta.Base.Scale,anchor:meta.Base.Contact,angle:0};
 const baseSize=size*meta.Base.Scale,pivot=meta.Turret.Pivot;
 return {x:x+(meta.Base.Socket[0]-meta.Base.Contact[0])*baseSize,y:y+(meta.Base.Socket[1]-meta.Base.Contact[1])*baseSize,
  size:size*meta.Turret.Scale,anchor:pivot,angle:(tower.__starFacing??meta.RestFacing)-meta.RestFacing};
};
star.componentPoints=(tower,part,points)=>{
 const t=star.componentTransform(tower,part),r=t.angle*Math.PI/180,c=Math.cos(r),s=Math.sin(r);
 return points.map(([x,y])=>[t.x+(x-t.anchor[0])*t.size*c-(y-t.anchor[1])*t.size*s,t.y+(x-t.anchor[0])*t.size*s+(y-t.anchor[1])*t.size*c]);
};
star.muzzle=(tower,i)=>star.componentPoints(tower,'Turret',[star.visual(tower).meta.Turret.Muzzles[i]])[0];
star.render=()=>{
 const live=new Set(get('StarCannonTower').map(t=>t.getUniqueId()));
 for(const [id,pair] of star.visuals)if(!live.has(id)){pair.Base.deleteFromScene();pair.Turret.deleteFromScene();star.visuals.delete(id);}
 for(const tower of get('StarCannonTower')){
  const pair=star.visual(tower);tower.setOpacity(0);
  for(const [i,part] of ['Base','Turret'].entries()){
   const o=pair[part],t=star.componentTransform(tower,part);o.setLayer(tower.getLayer());o.setZOrder(tower.getZOrder()+i+1);o.setAngle(t.angle);
   o.setWidth(64);o.setHeight(64);o.setPosition(t.x-32,t.y-32);o.hide(tower.isHidden());o.updatePreRender(scene);
   const sprite=o.getRendererObject();sprite.anchor.set(...t.anchor);sprite.position.set(t.x,t.y);sprite.scale.set(t.size/sprite.texture.width,t.size/sprite.texture.height);sprite.rotation=t.angle*Math.PI/180;
   if(part==='Turret'){
    // The closed bitmap rear connects to the socket through a short rotating coupling.
    // Keep this in the same native turret owner so Sell/recycling cannot orphan it.
    let coupling=o.__starCoupling;if(!coupling||coupling.destroyed){coupling=o.__starCoupling=new PIXI.Graphics();o.__starCouplingKey='';}
    if(coupling.parent!==sprite)sprite.addChild(coupling);
    if(o.__starCouplingKey!==pair.key){
     o.__starCouplingKey=pair.key;const m=pair.meta.Turret,dx=(m.Mount[0]-m.Pivot[0])*sprite.texture.width,dy=(m.Mount[1]-m.Pivot[1])*sprite.texture.height;
     coupling.clear();coupling.lineStyle(106,0x785126,1).moveTo(0,0).lineTo(dx,dy);
     coupling.lineStyle(80,0xe9b94d,1).moveTo(0,0).lineTo(dx,dy);coupling.lineStyle(48,0xf4ecdc,1).moveTo(0,0).lineTo(dx,dy);
     coupling.lineStyle(12,0xf6d173,1).beginFill(0xe9e1d4).drawCircle(0,0,51).endFill();
     coupling.lineStyle(7,0xa08dce,1).beginFill(0x7758bd).drawCircle(0,0,27).endFill();
    }
   }
  }
 }
};

 star.valid=(a,b)=>Number.isInteger(a)&&Number.isInteger(b)&&a>=0&&b>=0&&a<=4&&b<=4&&!(a>=3&&b>=3);
 star.stats=(a,b)=>{
  if(!star.valid(a,b))return null;
  // Cumulative tier tables prevent accidental multiplicative upgrade stacking.
  const damage=config.BaseDamage*config.DamageMultipliers[a];
  const count=b>=4?3:b>=3?2:1,fraction=config.ProjectileFractions[b];
  return {Damage:damage,AttackRange:config.BaseRange*config.Path1RangeMultipliers[a]*config.Path2RangeMultipliers[b],
   AttackInterval:config.BaseInterval/config.SpeedMultipliers[b],
   ProjectileSpeed:config.ProjectileSpeed,ProjectileCount:count,ProjectileDamage:damage*fraction,
   SplashRatio:config.SplashRatios[a],SplashRadius:config.SplashRadii[a],
   ProjectileKind:a>=4?'Supernova':a>=3?'Explosion':b>=4?'Meteor':b>=3?'Twin':a>=1?'Reinforced':'Base'};
 };
 star.apply=tower=>{
  const v=tower.getVariables(),a=v.get('Path1Level').getAsNumber(),b=v.get('Path2Level').getAsNumber(),stats=star.stats(a,b);
  if(!stats)return false;
  for(const [key,value] of Object.entries(stats))typeof value==='string'?v.get(key).setString(value):v.get(key).setNumber(value);
  v.get('CurrentDamage').setNumber(stats.Damage);v.get('CurrentRange').setNumber(stats.AttackRange);
  v.get('CurrentAttackInterval').setNumber(stats.AttackInterval);v.get('CurrentProjectileSpeed').setNumber(stats.ProjectileSpeed);
  v.get('VisualKey').setString(a+'_'+b);tower.setAnimationName(a+'_'+b);
  // Same logical dimensions and persisted ground anchor in all 21 states.
  tower.setWidth(64);tower.setHeight(64);
  const anchor=config.VisualAnchors[a+'_'+b],scale=scene.__worldStyle.star;
  const ox=(anchor.X-.5)*64*scale,oy=(anchor.Y-.5)*64*scale;
  tower.setPosition(v.get('FootprintX').getAsNumber()-32-ox,v.get('FootprintY').getAsNumber()-32-oy);
  v.get('FootprintOffsetX').setNumber(ox);v.get('FootprintOffsetY').setNumber(oy);
  star.visual(tower);
  return true;
 };
 star.upgrade=(tower,path)=>{
  if(!get('StarCannonTower').includes(tower)||![1,2].includes(path)||sv.get('IndexBlocksInput').getAsBoolean())return false;
  const v=tower.getVariables(),a=v.get('Path1Level').getAsNumber(),b=v.get('Path2Level').getAsNumber();
  if(!star.valid(a,b))return false;
  const level=path===1?a:b,other=path===1?b:a;
  if(level>=4||(level+1>=3&&other>=3))return false;
  const cost=config.Paths[path-1].Upgrades[level].Cost;
  if(sv.get('Money').getAsNumber()<cost)return false;
  sv.get('Money').sub(cost);v.get(path===1?'Path1Level':'Path2Level').setNumber(level+1);
  v.get('TotalInvestment').add(cost);star.apply(tower);return true;
 };
 star.effect=(kind,x,y,size)=>{
  const o=scene.createObject('StarCannonImpact');o.setLayer('');o.setZOrder(15002);
  o.setAnimationName(kind);o.setWidth(size);o.setHeight(size);o.setPosition(x-size/2,y-size/2);
  o.__starEffect={x,y,size,age:0,life:kind==='Supernova'?.55:kind==='Explosion'?.42:.22};return o;
 };
 star.deal=(owner,enemy,damage)=>{
  const health=enemy.getBehavior('Health');if(health.IsDead()||!Number.isFinite(damage)||damage<=0)return 0;
  const before=Math.max(0,health.Health()),armor=Math.max(0,health.FlatDamageReduction());
  // Keep native flat armor; a positive impact always removes at least 1 HP.
  health.Hit(Math.max(damage,armor+config.MinimumDamage),false,armor>0);
  const actual=Math.max(0,before-Math.max(0,health.Health()));
  if(owner)owner.getVariables().get('DamageDealt').add(actual);
  return actual;
 };
 star.fire=(tower,target)=>{
  const v=tower.getVariables(),count=v.get('ProjectileCount').getAsNumber(),kind=v.get('ProjectileKind').getAsString();
  const width={Base:40,Reinforced:44,Explosion:48,Supernova:56,Twin:38,Meteor:36}[kind];
  if(!star.canFire(tower,target))return false;
  for(let i=0;i<count;i++){
   const p=scene.createObject('StarCannonProjectile'),pv=p.getVariables();
   p.setLayer('');p.setZOrder(15000);p.setAnimationName(kind);p.setWidth(width);p.setHeight(width/2);
   const [x,y]=star.muzzle(tower,i);
   p.setPosition(x-width/2,y-width/4);
   pv.get('OwnerTowerId').setNumber(v.get('TowerId').getAsNumber());pv.get('TargetId').setNumber(target.getUniqueId());
   pv.get('Damage').setNumber(v.get('ProjectileDamage').getAsNumber());pv.get('SplashRatio').setNumber(v.get('SplashRatio').getAsNumber());
   pv.get('SplashRadius').setNumber(v.get('SplashRadius').getAsNumber());pv.get('Speed').setNumber(v.get('ProjectileSpeed').getAsNumber());
   p.__starAge=0;p.__starHit=false;p.__starNew=true;p.__muzzleIndex=i;p.__spawnPoint=[x,y];
   const meta=star.visual(tower).meta;p.setAngle(tower.__starFacing+meta.Turret.MuzzleFacing[i]-meta.RestFacing);
   const heading=p.getAngle()*Math.PI/180;
   // A target touching the barrel is already behind its mouth: resolve contact
   // after the visible muzzle frame rather than drawing a backward projectile.
   p.__starContactHit=(target.getCenterXInScene()-x)*Math.cos(heading)+(target.getCenterYInScene()-y)*Math.sin(heading)<=0;
   const flash=star.effect('Base',x,y,24);flash.__starEffect.life=.10;flash.__muzzleFlash=true;flash.__muzzleIndex=i;flash.__ownerId=tower.getUniqueId();
  }
  return true;
 };
 star.wrap=degrees=>(degrees+540)%360-180;
 star.targetValid=(tower,target,liveSet)=>{
  if(!target||!(liveSet?liveSet.has(target):get('Enemy').includes(target))||target.getBehavior('Health').IsDead())return false;
  const [x,y]=scene.__freePlacement.center(tower),dx=target.getCenterXInScene()-x,dy=target.getCenterYInScene()-y,range=tower.getVariables().get('AttackRange').getAsNumber();
  return dx*dx+dy*dy<=range*range;
 };
 star.bearing=(tower,target)=>{const pivot=star.componentTransform(tower,'Turret');return Math.atan2(target.getCenterYInScene()-pivot.y,target.getCenterXInScene()-pivot.x)*180/Math.PI;};
 star.canFire=(tower,target)=>star.targetValid(tower,target)&&Math.abs(star.wrap(star.bearing(tower,target)-tower.__starFacing))<=componentConfig.FireToleranceDegrees;
}
const dt=gdjs.evtTools.runtimeScene.getElapsedTimeInSeconds(scene),enemies=get('Enemy'),liveSet=new Set(enemies);
for(const tower of get('StarCannonTower')){
 const v=tower.getVariables();
 if(tower.__starLifetime!==tower.getUniqueId()){
  tower.__starLifetime=tower.getUniqueId();tower.__starCooldown=0;tower.__starTargetId=0;
  if(v.get('TotalInvestment').getAsNumber()<=0)v.get('TotalInvestment').setNumber(v.get('PurchasePrice').getAsNumber()||300);
  star.apply(tower);tower.__starFacing=star.visual(tower).meta.RestFacing;
 }
 star.visual(tower);tower.__starCooldown=Math.max(0,tower.__starCooldown-dt);
 if(sv.get('GameOver').getAsBoolean())continue;
 let target=enemies.find(e=>e.getUniqueId()===tower.__starTargetId);
 if(!star.targetValid(tower,target,liveSet)){
  const [x,y]=scene.__freePlacement.center(tower);let nearest=Infinity;target=null;
  for(const enemy of enemies){if(!star.targetValid(tower,enemy,liveSet))continue;
   const d=Math.hypot(enemy.getCenterXInScene()-x,enemy.getCenterYInScene()-y);
   if(d<nearest){nearest=d;target=enemy;}
  }
  tower.__starTargetId=target?target.getUniqueId():0;
 }
 if(!target)continue; // Preserve last angle when no valid in-range enemy exists.
 const difference=star.wrap(star.bearing(tower,target)-tower.__starFacing),limit=star.rotationSpeed*dt;
 tower.__starFacing=star.wrap(tower.__starFacing+Math.max(-limit,Math.min(limit,difference)));
 v.get('TurretFacing').setNumber(tower.__starFacing);v.get('TargetId').setNumber(tower.__starTargetId);
 if(tower.__starCooldown<=0&&star.fire(tower,target))tower.__starCooldown=v.get('AttackInterval').getAsNumber();
}
const targets=new Map(enemies.map(e=>[e.getUniqueId(),e])),owners=new Map(get('StarCannonTower').map(t=>[t.getVariables().get('TowerId').getAsNumber(),t]));
for(const p of get('StarCannonProjectile').slice()){
 const v=p.getVariables(),target=targets.get(v.get('TargetId').getAsNumber());p.__starAge=(p.__starAge||0)+dt;
 if(!target||target.getBehavior('Health').IsDead()||p.__starAge>6){p.deleteFromScene();continue;}
 if(p.__starNew){p.__starNew=false;continue;}
 const x=p.getCenterXInScene(),y=p.getCenterYInScene(),tx=target.getCenterXInScene(),ty=target.getCenterYInScene();
 const dx=tx-x,dy=ty-y,d=Math.hypot(dx,dy),travel=v.get('Speed').getAsNumber()*dt;
 if(!p.__starContactHit)p.setAngle(Math.atan2(dy,dx)*180/Math.PI);
 if(!p.__starContactHit&&d>travel+4){p.setPosition(p.getX()+dx/d*travel,p.getY()+dy/d*travel);continue;}
 if(p.__starHit)continue;p.__starHit=true;
 const owner=owners.get(v.get('OwnerTowerId').getAsNumber()),damage=v.get('Damage').getAsNumber(),ratio=v.get('SplashRatio').getAsNumber(),radius=v.get('SplashRadius').getAsNumber();
 star.deal(owner,target,damage);
 // Primary gets direct damage exactly once; it never receives its own splash.
 if(ratio>0)for(const enemy of enemies){
  if(enemy!==target&&!enemy.getBehavior('Health').IsDead()&&Math.hypot(enemy.getCenterXInScene()-tx,enemy.getCenterYInScene()-ty)<=radius)
   star.deal(owner,enemy,damage*ratio);
 }
 const kind=p.getAnimationName(),impact=kind==='Supernova'?'Supernova':kind==='Explosion'?'Explosion':['Twin','Meteor'].includes(kind)?'Barrage':'Base';
 star.effect(impact,tx,ty,ratio>0?radius*2:30);p.deleteFromScene();
}
for(const effect of get('StarCannonImpact').slice()){
 const a=effect.__starEffect;if(!a){effect.deleteFromScene();continue;}
 a.age+=dt;if(a.age>=a.life){effect.deleteFromScene();continue;}
 const t=a.age/a.life,size=a.size*(1+t*.18);effect.setOpacity(255*(1-t));effect.setWidth(size);effect.setHeight(size);effect.setPosition(a.x-size/2,a.y-size/2);
}
