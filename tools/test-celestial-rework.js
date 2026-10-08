step(4);const p=scene.__freePlacement,u=scene.__towerShopUI,s=scene.__worldStyle;
vars.get('Money').setNumber(50000);
ok(u.level.rows.length===4&&get('Monster_Path').length===82,'four full zig-zag lanes without hidden route');
ok(get('Monster_Path').every(o=>o.getWidth()===88&&o.getHeight()===88),'all road tiles enlarged with consistent corner dimensions');
ok(get('MapEndpointLabel').length===0,'no endpoint label instances');
const route=vars.get('MonsterPathPoints'),roads=get('Monster_Path').sort((a,b)=>a.getVariables().get('PathOrder').getAsNumber()-b.getVariables().get('PathOrder').getAsNumber());
ok(roads.every((o,i)=>Math.abs(o.getCenterXInScene()-route.getChild(i).getChild('X').getAsNumber())<.001&&Math.abs(o.getCenterYInScene()-route.getChild(i).getChild('Y').getAsNumber())<.001),'every waypoint matches actual widened road center');
for(const [name,o] of [['SpawnMarker',roads[0]],['BaseMarker',roads.at(-1)]]){
 const m=get(name)[0];ok(Math.abs(m.getCenterXInScene()-o.getCenterXInScene())<.001&&Math.abs(m.getCenterYInScene()-o.getCenterYInScene())<.001,'endpoint center '+name);
 ok(!p.validate('Tower',m.getCenterXInScene(),m.getCenterYInScene()).valid,'endpoint blocks construction '+name);
}
const props=get('Ground_Decoration');ok(props.length===20,'twelve main floor structures plus eight satellites');
ok(new Set(props.map(o=>o.getVariables().get('Kind').getAsString())).size===4,'crystals rocks ruins foliage all retained');
ok(scene.__environmentShadows.geometry.graphicsData.length===20,'one contact shadow per floor element');
for(const o of props){
 const kind=o.getVariables().get('Kind').getAsString(),scale=s.props[kind]*(o.getVariables().get('LocalScale').getAsNumber()||1),w=o.getWidth()*scale,h=o.getHeight()*scale;
 const a=[o.getCenterXInScene()-w/2,o.getCenterYInScene()-h/2,o.getCenterXInScene()+w/2,o.getCenterYInScene()+h/2];
 ok(roads.every(r=>a[0]>=r.getX()+r.getWidth()-.001||a[2]<=r.getX()+.001||a[1]>=r.getY()+r.getHeight()-.001||a[3]<=r.getY()+.001),'rendered floor asset clear of road '+kind+' '+o.getUniqueId());
 if(o.getVariables().get('Blocking').getAsBoolean()){
  const b=p.blockedCircle(o);ok(!p.validate('Tower',b.x,b.y).valid,'solid structure rejects footprint '+kind+' '+o.getUniqueId());
 }
}
const names=['Tower','ShotgunTower','RocketTower','ArcherTower'],radii=[40,48,42,44],counts={};
for(const name of names){
 let count=0;for(let y=270.3;y<960;y+=19.7)for(let x=170.4;x<1580;x+=23.1)if(p.validate(name,x,y).valid)count++;
 counts[name]=count;ok(count>100,'ample fractional placement samples '+name+': '+count);
}
const cam=()=>JSON.stringify([scene.getLayer('').getCameraZoom(),scene.getLayer('').getCameraX(),scene.getLayer('').getCameraY()]),fixed=cam();
for(let i=0;i<4;i++){
 clickObject(u.cards[i].background);let point;
 for(let y=280.3;y<960&&!point;y+=17.7)for(let x=190.4;x<1580;x+=19.1)if(p.validate(names[i],x,y).valid){point=[x,y];break;}
 ok(!!point,'find unsnapped valid point '+names[i]);move(...point);step();
 const ghost=get('TilePlacement_Indicator')[0],c=p.config(names[i]),sprite=ghost.getRendererObject();
 ok(Math.abs(sprite.scale.x*sprite.texture.width-ghost.getWidth()*c.RenderScale)<.001,'preview scale matches actual tower '+names[i]);
 const before=v('Money');click(...point);const tower=get(names[i])[0],center=p.center(tower);
 ok(tower&&Math.abs(center[0]-point[0])<.001&&Math.abs(center[1]-point[1])<.001&&p.radius(tower)===radii[i],'footprint exact center and configured radius '+names[i]);
 ok(!p.active&&v('Money')===before-[250,500,700,300][i],'single placement and unchanged cost '+names[i]);
 ok(!p.validate(names[i],...center).valid,'existing tower prevents overlap '+names[i]);
 ok(cam()===fixed,'camera unchanged by purchase '+names[i]);
}
ok(Math.abs(u.level.length-7168)/7168<.01,'route travel distance preserved within one percent');
lines.push('ALL CELESTIAL REWORK TESTS PASSED');output.textContent=lines.join('\n');
