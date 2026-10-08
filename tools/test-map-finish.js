
step(4);const p=scene.__freePlacement,roads=get('Monster_Path'),regions=scene.__islandRockRegions,edges=scene.__islandEdges,zoom=scene.getLayer('').getCameraZoom();vars.get('Money').setNumber(30000);
ok(regions.length>=12&&edges.length===regions.length,'modular rocky perimeter and matching region count');
const overlap=(a,b)=>a[0]<b[2]-.001&&a[2]>b[0]+.001&&a[1]<b[3]-.001&&a[3]>b[1]+.001;
for(const [i,r] of regions.entries()){
 const box=[r[0][0],r[0][1],r[2][0],r[2][1]];ok(roads.every(o=>!overlap(box,[o.getX(),o.getY(),o.getX()+64,o.getY()+64])),'rock region outside route '+i);
 const e=edges[i],bounds=e.sprite.getBounds();ok(Math.abs(bounds.width/zoom-(box[2]-box[0]))<.001&&Math.abs(bounds.height/zoom-(box[3]-box[1]))<.001,'rendered cliff bounds match polygon region '+i);ok(Math.abs(e.sprite.scale.x-e.sprite.scale.y)<.00001,'cliff crop has uniform scale '+i);
}
const ordered=roads.slice().sort((a,b)=>a.getVariables().get('PathOrder').getAsNumber()-b.getVariables().get('PathOrder').getAsNumber()),route=vars.get('MonsterPathPoints');ok(ordered.every((o,i)=>o.getVariables().get('PathOrder').getAsNumber()===i&&Math.abs(route.getChild(i).getChild('X').getAsNumber()-o.getCenterXInScene())<.001&&Math.abs(route.getChild(i).getChild('Y').getAsNumber()-o.getCenterYInScene())<.001),'waypoints regenerated exactly from clean road');
ok(get('Ground_Decoration').every(o=>{const s=o.getVariables().get('Kind').getAsString(),scale={Crystal:1.22,Rock:1.27,Ruin:1.8,Shrub:1.24}[s];const c=[o.getCenterXInScene(),o.getCenterYInScene()],box=[c[0]-32*scale,c[1]-32*scale,c[0]+32*scale,c[1]+32*scale];return roads.every(r=>!overlap(box,[r.getX(),r.getY(),r.getX()+64,r.getY()+64]));}),'all decoration render rectangles clear of every road tile');
const last=ordered.at(-1),base=get('BaseMarker')[0];ok(Math.abs(base.getCenterXInScene()-last.getCenterXInScene())<.001&&Math.abs(base.getCenterYInScene()-last.getCenterYInScene())<.001,'Base follows cleaned final lane');
const cam=()=>JSON.stringify([scene.getLayer('').getCameraX(),scene.getLayer('').getCameraY(),scene.getLayer('').getCameraZoom()]),fixed=cam();clickObject(scene.__towerShopUI.cards[0].background);const before=v('Money');
for(const r of [regions[0],regions[1],regions.at(-1)]){const x=(r[0][0]+r[2][0])/2,y=(r[0][1]+r[2][1])/2;click(x,y);ok(get('Tower').length===0&&v('Money')===before&&p.active,'rocky region rejects purchase without charge');ok(cam()===fixed,'rocky-edge invalid click leaves camera fixed');}
const g=get('Ground_Map')[0];let point;
for(let y=g.getY()+170.4;y<g.getY()+g.getHeight()-100&&!point;y+=13.7)for(let x=g.getX()+140.8;x<g.getX()+g.getWidth()-100;x+=13.7)if(p.validate('Tower',x,y).valid){point=[x,y];break;}
ok(!!point,'open soil remains freely placeable');move(...point);step();ok(vars.get('PlacementValid').getAsBoolean(),'green preview on clean soil');click(...point);const tower=get('Tower')[0];ok(tower&&v('Money')===before-250&&!p.active,'fractional free placement and single purchase preserved');ok(Math.abs(p.center(tower)[0]-point[0])<.001&&Math.abs(p.center(tower)[1]-point[1])<.001,'tower footprint uses exact click position');ok(cam()===fixed,'successful build leaves static camera unchanged');
lines.push('ALL MAP FINISH TESTS PASSED');output.textContent=lines.join('\n');document.title='PASS FINISH '+(lines.length-1)+' checks';
