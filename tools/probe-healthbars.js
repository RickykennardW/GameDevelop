(()=>{
 const S=testGame.getSceneStack().getCurrentScene(),V=S.getVariables(),types=['Basic','VoidHound','VoidGuard','VoidSentinel','VoidBrute'],dirs=['Up','Down','Left','Right'];
 V.get('GameOver').setBoolean(true);
 const es=[];
 for(let row=0;row<5;row++)for(let col=0;col<4;col++){
  const e=S.createObject('Enemy'),v=e.getVariables(),t=types[row];v.get('EnemyType').setString(t);
  S.__novaWisp.ensure(e);v.get('MoveSpeed').setNumber(0);v.get('Facing').setString(dirs[col]);
  e.setPosition(380+col*350-24,280+row*165-24);es.push(e);
 }
 const steps=n=>{for(let i=0;i<n;i++)S.renderAndStep(16.667);};
 steps(10);
 const snap=()=>es.map(e=>{const p=S.__enemyHealthBars.get(e.getUniqueId()),b=p.background,f=p.fill;
  return {type:e.getVariables().get('EnemyType').getAsString(),direction:e.getVariables().get('Facing').getAsString(),enemyLogical:[e.getX(),e.getY(),e.getWidth(),e.getHeight(),e.getCenterXInScene(),e.getCenterYInScene()],enemyVisible:e.getRendererObject().getBounds(),bar:[b.getX(),b.getY(),b.getWidth(),b.getHeight()],fill:[f.getWidth(),f.getHeight(),f.getOpacity(),f.isHidden()],barTexture:[b.getRendererObject().texture.width,b.getRendererObject().texture.height],fillBounds:f.getRendererObject().getBounds()};});
 const full=JSON.parse(JSON.stringify(snap()));
 for(const e of es)e.getBehavior('Health').SetHealth(e.getBehavior('Health').MaxHealth()/2);
 steps(3);const half=JSON.parse(JSON.stringify(snap()));
 const victim=es[8],oldPair=S.__enemyHealthBars.get(victim.getUniqueId());
 victim.getBehavior('Health').SetHealth(0);steps(3);
 const replacement=S.createObject('Enemy');S.__novaWisp.ensure(replacement);replacement.getVariables().get('MoveSpeed').setNumber(0);replacement.setPosition(820,600);steps(2);
 const newPair=S.__enemyHealthBars.get(replacement.getUniqueId());
 const reused=oldPair.background===newPair.background||oldPair.fill===newPair.fill;
 steps(50);
 const recycle={reused,liveEnemy:S.getObjects('Enemy').includes(replacement),ownerInMap:S.__enemyHealthBars.has(replacement.getUniqueId()),backgroundInScene:S.getObjects('HealthBarBackground').includes(newPair.background),fillInScene:S.getObjects('HealthBarFill').includes(newPair.fill)};
 V.get('Money').setNumber(100000);
 const spots=[];for(const y of [352,616,880])for(let x=300;x<=1500;x+=100)if(S.__freePlacement.validate('StarCannonTower',x,y).valid)spots.push([x,y]);
 return {full,half,recycle,route:V.get('MonsterPathPoints').toJSObject(),spots,barOwners:S.__enemyHealthBars.size};
})()
