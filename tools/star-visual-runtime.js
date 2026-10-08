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
