step(4);const p=scene.__freePlacement,ui=()=>scene.__towerShopUI,num=(o,n)=>o.getVariables().get(n).getAsNumber(),indicator=get('TilePlacement_Indicator')[0];vars.get('Money').setNumber(50000);
const near=(a,b)=>Math.abs(a-b)<1e-5;
const choose=type=>{const i=['Tower','ShotgunTower','RocketTower','ArcherTower'].indexOf(type);if(indicator.isHidden()||indicator.getAnimationName()!==type)clickObject(ui().cards[i].background);ok(!indicator.isHidden()&&indicator.getAnimationName()===type,'shop selects '+type);};
const find=(type,predicate=()=>true)=>{const g=get('Ground_Map')[0];for(let y=g.getY()+40.4;y<g.getY()+g.getHeight()-40;y+=13.3)for(let x=g.getX()+40.8;x<g.getX()+g.getWidth()-40;x+=13.7)if(p.validate(type,x,y).valid&&predicate(x,y))return [x,y];throw Error('No valid position '+type);};
choose('Tower');const pos=find('Tower',(x,y)=>p.validate('Tower',x+65,y).valid);move(...pos);step();
ok(near(indicator.getCenterXInScene(),pos[0])&&near(indicator.getCenterYInScene()+p.offsets('Tower')[1],pos[1]),'fractional cursor follows world position exactly');
move(pos[0]+.37,pos[1]+.61);step();ok(near(p.preview.x,pos[0]+.37)&&near(indicator.getCenterXInScene(),pos[0]+.37),'subpixel movement never snaps');
ok(scene.__placementBaseRing.getWidth()===52&&scene.__placementBaseRing.getHeight()===52,'preview circle is physical diameter, not ellipse');
ok(!scene.__placementRange.isHidden()&&scene.__placementRange.getWidth()===380,'separate attack-range preview');
const before=v('Money');click(...pos);let basic=get('Tower')[0];ok(basic&&near(p.center(basic)[0],pos[0])&&near(p.center(basic)[1],pos[1]),'tower placed between old grid coordinates at exact cursor');ok(v('Money')===before-250,'valid click charges once');
move(pos[0]+65,pos[1]);input.onMouseButtonPressed(0);step(2);const count=get('Tower').length;move(pos[0]+130,pos[1]);step(15);ok(get('Tower').length===count,'held press cannot purchase repeatedly');input.onMouseButtonReleased(0);step();
get('Tower').filter(o=>o!==basic).forEach(o=>o.deleteFromScene());step();
for(const type of ['Tower','ShotgunTower','RocketTower','ArcherTower']){
 choose(type);const radius=p.config(type).Radius,sum=radius+26+2;
 ok(!p.validate(type,pos[0]+sum-.25,pos[1]).valid&&p.validate(type,pos[0]+sum-.25,pos[1]).reason==='tower','mixed circle radii overlap rejected '+type);
 ok(p.validate(type,pos[0]+sum+.25,pos[1]).valid,'nearby nonoverlapping circles permitted '+type);
}
choose('ShotgunTower');let money=v('Money'),n=get('ShotgunTower').length;click(pos[0]+55,pos[1]);ok(get('ShotgunTower').length===n&&v('Money')===money,'invalid mixed-tower overlap never charges');
click(pos[0]+62.3,pos[1]);const heavy=get('ShotgunTower')[0];ok(heavy&&near(p.center(heavy)[0],pos[0]+62.3),'different types placed closely with correct radii');
ok(num(heavy,'FootprintRadius')===34&&num(basic,'FootprintRadius')===26,'instance footprint radii preserved');
// A stale green preview is never sufficient: obstacle/money is checked again inside click handler.
choose('Tower');const fresh=find('Tower');move(...fresh);step();ok(vars.get('PlacementValid').getAsBoolean(),'valid preview green');vars.get('Money').setNumber(0);const old=get('Tower').length;click(...fresh);ok(get('Tower').length===old&&v('Money')===0,'click revalidates affordability instead of stale green');vars.get('Money').setNumber(50000);
for(const kind of ['Crystal','Rock','Ruin']){
 const o=get('Ground_Decoration').find(o=>o.getVariables().get('Kind').getAsString()===kind);move(o.getCenterXInScene(),o.getCenterYInScene()+8);step();
 ok(!vars.get('PlacementValid').getAsBoolean()&&scene.__placementBaseRing.getColor()==='255;96;135','red preview at solid '+kind);
 money=v('Money');n=get('Tower').length;click(o.getCenterXInScene(),o.getCenterYInScene()+8);ok(get('Tower').length===n&&v('Money')===money,'solid '+kind+' native click rejected');
}
for(const name of ['SpawnMarker','BaseMarker']){const o=get(name)[0];money=v('Money');n=get('Tower').length;clickObject(o);ok(get('Tower').length===n&&v('Money')===money,'endpoint blocks '+name);}
const roads=get('Monster_Path'),straight=roads.find(o=>o.getAnimationName()==='H'&&o.getX()>get('SpawnMarker')[0].getX()+150);money=v('Money');n=get('Tower').length;clickObject(straight);ok(get('Tower').length===n&&v('Money')===money,'straight visual road blocks footprint');
const bends=roads.filter(o=>['NE','NW','SE','SW'].includes(o.getAnimationName()));
for(const bend of bends){const skin=bend.getAnimationName(),poly=p.roads[roads.indexOf(bend)];ok(p.polygon(bend.getCenterXInScene(),bend.getCenterYInScene(),26,poly),'circle detects rounded '+skin);}
// Compare against actual geometry, and test free grass whose circle intersects the old tile rectangle.
let cornerFree;
for(const o of bends){for(let y=o.getY()-24;y<=o.getY()+88&&!cornerFree;y+=3)for(let x=o.getX()-24;x<=o.getX()+88;x+=3){const nx=Math.max(o.getX(),Math.min(o.getX()+64,x)),ny=Math.max(o.getY(),Math.min(o.getY()+64,y));if(Math.hypot(x-nx,y-ny)<23.5&&p.validate('Tower',x,y).valid){cornerFree=[x,y];break;}}if(cornerFree)break;}
ok(!!cornerFree,'rounded corner free space is not blocked by old tile rectangle');move(...cornerFree);step();ok(vars.get('PlacementValid').getAsBoolean(),'green preview at rounded outer corner');money=v('Money');click(...cornerFree);ok(v('Money')===money-250,'native purchase near rounded corner');
const safe=find('Tower');const r=26;
let edge;
for(const o of roads.filter(o=>o.getAnimationName()==='H')){const x=o.getCenterXInScene(),y=o.getY()+64+r+.2;if(p.validate('Tower',x,y).valid){edge=[x,y];break;}}
ok(!!edge&&p.validate('Tower',...edge).valid&&!p.validate('Tower',edge[0],edge[1]-.4).valid,'road edge allows 0.2px clearance and rejects touch');
// Narrow obstacle contours exclude transparent texture corners.
let irregularFree;
for(const o of get('Ground_Decoration').filter(o=>o.getVariables().get('Blocking').getAsBoolean())){for(let y=o.getY()-24;y<=o.getY()+88&&!irregularFree;y+=3)for(let x=o.getX()-24;x<=o.getX()+88;x+=3){const nx=Math.max(o.getX(),Math.min(o.getX()+64,x)),ny=Math.max(o.getY(),Math.min(o.getY()+64,y));if(Math.hypot(x-nx,y-ny)<20&&p.validate('Tower',x,y).valid){irregularFree=[x,y];break;}}if(irregularFree)break;}
ok(!!irregularFree,'irregular obstacle permits space in transparent rectangle corners');
// Entire footprint must stay inside viewport/map; UI always consumes native placement.
const g=get('Ground_Map')[0];ok(!p.validate('Tower',g.getX()+r-.1,safe[1]).valid,'footprint outside map boundary rejected');
for(const name of ['HUDPanel','ShopPlayButton','ShopIndexButton']){money=v('Money');n=get('Tower').length;clickObject(get(name)[0]);ok(get('Tower').length===n&&v('Money')===money,'no UI click-through '+name);}
if(vars.get('IndexOpen').getAsBoolean()){input.onKeyPressed(27);step();input.onKeyReleased(27);step();}
choose('ArcherTower');const arPos=find('ArcherTower');money=v('Money');click(...arPos);const archer=get('ArcherTower')[0];ok(archer&&v('Money')===money-300,'Archer free placement native purchase');
indicator.hide();clickObject(archer);const rad=num(archer,'FootprintRadius'),center=p.center(archer);for(let i=0;i<3;i++)clickObject(scene.__selectedPanel.cards[0].background);clickObject(scene.__selectedPanel.cards[1].background);ok(archer.getAnimationName()==='3_1'&&num(archer,'FootprintRadius')===rad&&near(p.center(archer)[1],center[1]),'native cross-path upgrade preserves footprint radius and anchor');
money=v('Money');clickObject(scene.__selectedPanel.objects.sell);ok(get('ArcherTower').length===0&&v('Money')>money,'native sell refunds and deletes owner');step();ok(!scene.__towerBaseRings.has(archer.getUniqueId()),'sell leaves no orphan footing ring');choose('ArcherTower');ok(p.validate('ArcherTower',...arPos).valid,'selling restores usable placement area');
// Coordinate conversions remain correct under camera zoom and translation.
const layer=scene.getLayer(''),cx=layer.getCameraX(),cy=layer.getCameraY(),zoom=layer.getCameraZoom();layer.setCameraX(cx+37.2);layer.setCameraY(cy-12.4);layer.setCameraZoom(zoom*1.12);move(...safe);const transformed=p.cursor();ok(near(transformed[0],safe[0])&&near(transformed[1],safe[1]),'world cursor correct after camera translation and zoom');layer.setCameraX(cx);layer.setCameraY(cy);layer.setCameraZoom(zoom);
indicator.hide();lines.push('ALL FREE PLACEMENT TESTS PASSED');output.textContent=lines.join('\n');document.title='PASS FREE '+(lines.length-1)+' checks';
