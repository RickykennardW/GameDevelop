// Render-only scale: object dimensions, native hitboxes and map fitting stay unchanged.
// Refresh native frame state first, then enlarge the PIXI sprite around its center anchor.
const system=runtimeScene.__archerSystem,style=runtimeScene.__worldStyle;
for(const [name,scale] of [["Tower",style.tower],["ShotgunTower",style.tower],["RocketTower",style.tower],["ArcherTower",style.archer],["ArcherProjectile",system?system.projectileVisualScale:1.8],["SpawnMarker",style.spawn],["BaseMarker",style.base],["Ground_Decoration",1.25],["Enemy",style.enemy],["Bullet",style.projectile],["RocketBullet",style.projectile]]) {
  for(const [index,object] of runtimeScene.getObjects(name).entries()) {
    const drawScale=name==="Ground_Decoration"?(style.props[object.getVariables().get("Kind").getAsString()] || 1)*(object.getVariables().get("LocalScale").getAsNumber()||1):scale;
    object.updatePreRender(runtimeScene);
    const sprite=object.getRendererObject();
    if(!sprite||!sprite.texture)continue;
    if(name==="Ground_Decoration"&&!sprite.texture.baseTexture.__islandFiltered){const t=sprite.texture.baseTexture;t.mipmap=PIXI.MIPMAP_MODES.ON;t.scaleMode=PIXI.SCALE_MODES.LINEAR;t.update();t.__islandFiltered=true;}
    sprite.scale.set(object.getWidth()/sprite.texture.width*drawScale,object.getHeight()/sprite.texture.height*drawScale);
  }
}
const ghost=runtimeScene.getObjects('TilePlacement_Indicator')[0];
if(ghost&&!ghost.isHidden()){
 const c=runtimeScene.__freePlacement.config(ghost.getAnimationName());ghost.updatePreRender(runtimeScene);
 const sprite=ghost.getRendererObject();sprite.scale.set(ghost.getWidth()/sprite.texture.width*c.RenderScale,ghost.getHeight()/sprite.texture.height*c.RenderScale);
}

// Depth follows planted feet, independently of collider/range dimensions.
for(const o of runtimeScene.getObjects('Ground_Decoration')){
 const k=o.getVariables().get('Kind').getAsString(),s=(style.props[k]||1)*(o.getVariables().get('LocalScale').getAsNumber()||1);
 o.setZOrder(100+Math.round(o.getCenterYInScene()+o.getHeight()*s*.30));
}
for(const n of ['Tower','ShotgunTower','RocketTower','ArcherTower','StarCannonTower'])for(const o of runtimeScene.getObjects(n))o.setZOrder(100+Math.round(runtimeScene.__freePlacement.center(o)[1]));
for(const o of runtimeScene.getObjects('Enemy')){
 o.setZOrder(100+Math.round(o.getCenterYInScene()+o.getHeight()*style.enemy/2));
 const pair=runtimeScene.__enemyHealthBars?.get(o.getUniqueId());if(pair){pair.background.setZOrder(20000);pair.fill.setZOrder(20001);}
}
for(const n of ['Bullet','RocketBullet','ArcherProjectile'])for(const o of runtimeScene.getObjects(n))o.setZOrder(15000);

if(runtimeScene.__starCannon)runtimeScene.__starCannon.render();

if(runtimeScene.__novaWisp)runtimeScene.__novaWisp.render();
