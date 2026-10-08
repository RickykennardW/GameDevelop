step(4);const p=scene.__freePlacement,indicator=get('TilePlacement_Indicator')[0],types=['Tower','ShotgunTower','RocketTower','ArcherTower'];vars.get('Money').setNumber(50000);
const snap=()=>JSON.stringify({camera:[scene.getLayer('').getCameraX(),scene.getLayer('').getCameraY(),scene.getLayer('').getCameraZoom()],ground:get('Ground_Map').map(o=>[o.getX(),o.getY(),o.getWidth(),o.getHeight()]),roads:get('Monster_Path').map(o=>[o.getX(),o.getY()]),endpoints:['SpawnMarker','BaseMarker'].map(n=>get(n).map(o=>[o.getX(),o.getY()]))});
const fixed=snap(),stable=m=>ok(snap()===fixed,m),count=()=>p.towers().length;
const choose=type=>{const n=count();clickObject(scene.__towerShopUI.cards[types.indexOf(type)].background);ok(p.active&&p.type===type&&!indicator.isHidden(),'shop enters builder once '+type);ok(count()===n,'shop click never places '+type);};
const normal=m=>ok(!p.active&&p.type===''&&indicator.isHidden()&&scene.__placementBaseRing.isHidden()&&scene.__placementRange.isHidden()&&!vars.get('PlacementValid').getAsBoolean()&&v('TowerCost')===0,m);
const free=type=>{const g=get('Ground_Map')[0];for(let y=g.getY()+100.4;y<g.getY()+g.getHeight()-40;y+=13.3)for(let x=g.getX()+40.8;x<g.getX()+g.getWidth()-40;x+=13.7)if(p.validate(type,x,y).valid)return [x,y];throw Error('No free position');};
for(const type of types){
 choose(type);const pos=free(type),money=v('Money'),n=count();move(...pos);step();const x=indicator.getCenterXInScene()+p.offsets(type)[0],y=indicator.getCenterYInScene()+p.offsets(type)[1];click(...pos);
 ok(count()===n+1,'one successful placement '+type);const tower=get(type).at(-1);ok(Math.abs(p.center(tower)[0]-x)<1e-6&&Math.abs(p.center(tower)[1]-y)<1e-6,'tower remains at exact preview '+type);
 ok(v('Money')===money-({Tower:250,ShotgunTower:500,RocketTower:700,ArcherTower:300}[type]),'one charge '+type);normal('successful placement clears all builder state '+type);ok(v('SelectedTower')===0,'placement click does not select new tower '+type);
 click(...free(type));ok(count()===n+1&&v('Money')===money-({Tower:250,ShotgunTower:500,RocketTower:700,ArcherTower:300}[type]),'next map click never buys another '+type);stable('camera/ground/route unchanged '+type);
}
choose('ArcherTower');const money=v('Money'),n=count();
for(const name of ['Monster_Path','Ground_Decoration','SpawnMarker','BaseMarker']){const o=get(name)[0];clickObject(o);ok(count()===n&&v('Money')===money&&p.active&&!indicator.isHidden(),'invalid retains builder and money '+name);stable('invalid location never moves map '+name);}
const g=get('Ground_Map')[0],rad=p.config('ArcherTower').Radius;click(g.getX()+rad-.1,g.getY()+200);ok(p.active&&count()===n&&v('Money')===money,'outside footprint retains builder without charge');stable('out-of-bounds click never moves camera');
const affordablePos=free('ArcherTower');move(...affordablePos);step();vars.get('Money').setNumber(0);click(...affordablePos);ok(p.active&&count()===n&&v('Money')===0,'insufficient gold retains builder');vars.get('Money').setNumber(money);
input.onMouseButtonPressed(1);step(2);input.onMouseButtonReleased(1);step();normal('right click cancels logical builder and all previews');ok(count()===n&&v('Money')===money,'right cancel makes no purchase');
choose('Tower');input.onKeyPressed(27);step(2);input.onKeyReleased(27);step();normal('ESC cancels logical builder and all previews');ok(count()===n&&v('Money')===money,'ESC cancel makes no purchase');
// Place at the real viewport edges, beyond the old static auto-fit bounds.
for(const [type,side] of [['Tower','left'],['ArcherTower','right'],['ShotgunTower','left'],['RocketTower','right']]){
 choose(type);const r=p.config(type).Radius,x=side==='left'?g.getX()+r+.5:g.getX()+g.getWidth()-r-.5;let pos;
 for(let y=g.getY()+110.4;y<g.getY()+g.getHeight()-60;y+=13.7)if(p.validate(type,x,y).valid){pos=[x,y];break;}
 ok(!!pos,'whole-footprint valid at '+side+' edge '+type);const n=count(),money=v('Money');move(...pos);step();stable('edge preview cannot move map '+type);click(...pos);step(20);ok(count()===n+1&&v('Money')<money,'edge placement succeeds '+type);normal('edge placement ends builder '+type);stable('edge placement leaves camera zoom/position and ground fixed '+type);
}
choose('Tower');for(let i=0;i<=12;i++){move(g.getX()+i*g.getWidth()/12,g.getY()+100);step();stable('moving cursor along top edge fixed '+i);move(g.getX()+1,g.getY()+100+i*(g.getHeight()-150)/12);step();stable('moving cursor along left edge fixed '+i);move(g.getX()+g.getWidth()-1,g.getY()+100+i*(g.getHeight()-150)/12);step();stable('moving cursor along right edge fixed '+i);}input.onMouseButtonPressed(1);step();input.onMouseButtonReleased(1);step();normal('edge movement can cancel normally');
const tower=get('ArcherTower')[0];clickObject(tower);ok(v('SelectedTower')===tower.getVariables().get('TowerId').getAsNumber()&&scene.__selectedPanel.tower===tower,'normal click opens selected panel');stable('selection does not move map');
lines.push('ALL BUILDER FIX TESTS PASSED');output.textContent=lines.join('\n');document.title='PASS BUILDER '+(lines.length-1)+' checks';
