// One official tower; range remains centered on its persisted placement anchor.
const scene=runtimeScene,sv=scene.getVariables(),range=scene.getObjects('RangeIndicator')[0];
const tower=scene.getObjects('StarCannonTower').find(o=>o.getVariables().get('TowerId').getAsNumber()===sv.get('SelectedTower').getAsNumber());
if(tower){
 const v=tower.getVariables(),r=v.get('AttackRange').getAsNumber(),[x,y]=scene.__freePlacement.center(tower);
 range.setWidth(r*2);range.setHeight(r*2);range.setPosition(x-r,y-r);range.hide(false);
}else{sv.get('SelectedTower').setNumber(0);range.hide();}
if(scene.__selectedPanel)scene.__selectedPanel.render();
