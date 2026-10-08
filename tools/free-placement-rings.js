const scene=runtimeScene,p=scene.__freePlacement,sv=scene.getVariables(),get=n=>scene.getObjects(n);
let rings=scene.__towerBaseRings;if(!rings)rings=scene.__towerBaseRings=new Map();
const buildVisible=p.active&&!get('TilePlacement_Indicator')[0].isHidden()&&!sv.get('IndexBlocksInput').getAsBoolean();
const towers=p.towers(),live=new Set(towers.map(o=>o.getUniqueId()));
for(const [id,ring] of rings)if(!live.has(id)){ring.deleteFromScene();rings.delete(id);}
for(const tower of towers){
 const id=tower.getUniqueId();let ring=rings.get(id);if(!ring){ring=scene.createObject('TowerBaseRing');rings.set(id,ring);}
 const r=p.radius(tower),[x,y]=p.center(tower);
 ring.setLayer(tower.getLayer());ring.setZOrder(1);ring.setWidth(r*2);ring.setHeight(r*2);ring.setPosition(x-r,y-r);ring.setColor('153;223;245');ring.setOpacity(215);const isSelected=!p.active&&tower.getVariables().get('TowerId').getAsNumber()===sv.get('SelectedTower').getAsNumber()&&!sv.get('IndexBlocksInput').getAsBoolean();ring.hide((!buildVisible&&!isSelected)||tower.isHidden());
}
// Reuse owner rings; the same authoritative circle is used by the click/preview validator.
let blocked=scene.__blockedBuildRings;if(!blocked)blocked=scene.__blockedBuildRings=new Map();
const blockers=p.blockers.map(b=>b.owner);
const blockerIds=new Set(blockers.map(o=>o.getUniqueId()));
for(const [id,ring] of blocked)if(!blockerIds.has(id)){ring.deleteFromScene();blocked.delete(id);}
for(const o of blockers){
 const id=o.getUniqueId();let ring=blocked.get(id);if(!ring){ring=scene.createObject('TowerBaseRing');blocked.set(id,ring);}
 const {x,y,r}=p.blockedCircle(o);
 ring.setLayer(o.getLayer());ring.setZOrder(o.getZOrder()-1);ring.setWidth(r*2);ring.setHeight(r*2);ring.setPosition(x-r,y-r);
 ring.setColor('255;116;175');ring.setOpacity(195);ring.hide(!buildVisible||o.isHidden());
}
let ghost=scene.__placementBaseRing;if(!ghost)ghost=scene.__placementBaseRing=scene.createObject('TowerBaseRing');
let range=scene.__placementRange;if(!range)range=scene.__placementRange=scene.createObject('PlacementRangeIndicator');
const indicator=get('TilePlacement_Indicator')[0],preview=p.preview,visible=buildVisible,conf=p.config(preview.type),r=conf.Radius||24;
ghost.setLayer('');ghost.setZOrder(30001);ghost.setWidth(r*2);ghost.setHeight(r*2);ghost.setPosition(preview.x-r,preview.y-r);ghost.setColor(preview.valid?'119;255;189':'255;96;135');ghost.setOpacity(235);ghost.hide(!visible);
const data=scene.getGame().getSceneAndExtensionsData(scene.getName()).sceneData.objects.find(o=>o.name===preview.type),attack=data&&data.variables.find(v=>v.name==='AttackRange'),ar=attack?Number(attack.value):0;
range.setLayer('');range.setZOrder(0);range.setWidth(ar*2);range.setHeight(ar*2);range.setPosition(preview.x-ar,preview.y-ar);range.setOpacity(100);range.hide(!visible);
if(visible){
 indicator.setColor(preview.valid?'197;255;221':'255;136;171');indicator.setOpacity(preview.valid?175:120);indicator.setZOrder(30002);
 indicator.updatePreRender(scene);const sprite=indicator.getRendererObject(),scale=conf.RenderScale;if(sprite&&sprite.texture)sprite.scale.set(indicator.getWidth()/sprite.texture.width*scale,indicator.getHeight()/sprite.texture.height*scale);
}
get('MessageText').forEach(o=>{o.setColor('237;228;255');o.setCharacterSize(26);o.setBold(true);o.setTextAlignment('center');});
