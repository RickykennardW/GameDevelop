(async()=>{
 const S=testGame.getSceneStack().getCurrentScene(),V=S.getVariables(),types=['Basic','VoidHound','VoidGuard','VoidSentinel','VoidBrute'],dirs=['Up','Down','Left','Right'];
 const checks=[];const ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
 const frames=async n=>new Promise(r=>{const tick=()=>--n?requestAnimationFrame(tick):r();requestAnimationFrame(tick);});
 const remove=name=>S.getObjects(name).slice().forEach(e=>e.deleteFromScene());
 const enemy=(type,x,y,dir='Right')=>{const e=S.createObject('Enemy'),v=e.getVariables();v.get('EnemyType').setString(type);S.__novaWisp.ensure(e);v.get('MoveSpeed').setNumber(0);v.get('Facing').setString(dir);e.setPosition(x-24,y-24);return e;};
 const allBars=()=>S.getObjects('Enemy').filter(e=>!e.getBehavior('Health').IsDead()).every(e=>{const p=S.__enemyHealthBars.get(e.getUniqueId());return p&&S.getObjects('HealthBarBackground').includes(p.background)&&S.getObjects('HealthBarFill').includes(p.fill)&&!p.background.isHidden();});
 for(let i=0;i<12;i++){
  const t=S.createObject('StarCannonTower'),v=t.getVariables(),x=300+i%6*220,y=352+Math.floor(i/6)*264;
  S.__freePlacement.positionSprite(t,'StarCannonTower',x,y);v.get('FootprintX').setNumber(x);v.get('FootprintY').setNumber(y);v.get('TowerId').setNumber(990000+t.getUniqueId());
 }
 await frames(5);S.getObjects('StarCannonTower').forEach(t=>t.__starCooldown=100000);
 const perf=[];
 for(const count of [40,200]){
  remove('Enemy');for(let i=0;i<count;i++)enemy(types[i%5],300+i%25*50,310+Math.floor(i/25)*70);await frames(10);
  const created=S.__enemyHealthBarState.createdPairs;
  const measurement=await new Promise(resolve=>{
   const times=[];let previous=performance.now();const tick=()=>{
    const now=performance.now();times.push(now-previous);previous=now;
    S.getObjects('StarCannonTower').forEach(t=>t.__starTargetId=0); // Acquisition stress, no game code substitution.
    if(times.length<120)requestAnimationFrame(tick);else resolve({enemies:count,towers:12,samples:times.length,meanMs:times.reduce((a,b)=>a+b,0)/times.length,maxMs:Math.max(...times),note:'static mixed enemies /12 towers, forced target reacquisition, shooting held by cooldown; headless device sample'});
   };requestAnimationFrame(tick);
  });perf.push(measurement);
  ok(allBars()&&S.__enemyHealthBars.size===count,'live '+count+' independently visible HP bars');
  ok(S.__enemyHealthBarState.createdPairs===created,'live '+count+' no per-frame bar allocation');
 }
 remove('Enemy');remove('StarCannonTower');await frames(5);
 ok(S.__enemyHealthBars.size===0&&S.__starCannon.visuals.size===0,'live stress fixture owner cleanup');
 const actors=[];
 for(let row=0;row<5;row++)for(let col=0;col<4;col++){
  const e=enemy(types[row],380+col*350,280+row*165,dirs[col]);e.getBehavior('Health').SetHealth(e.getBehavior('Health').MaxHealth()*[1,.75,.5,.25][col]);actors.push(e);
 }
 await frames(12);ok(allBars()&&actors.length===20,'five enemy types x four directions visible together');
 for(let i=0;i<actors.length;i++){
  const e=actors[i],p=S.__enemyHealthBars.get(e.getUniqueId()),ratio=[1,.75,.5,.25][i%4],width=[24,30,30,26,36][Math.floor(i/4)];
  ok(p.background.getWidth()===width&&Math.abs(p.fill.getWidth()-(width-2)*ratio)<.001,'live compact width / HP percentage '+types[Math.floor(i/4)]+'/'+dirs[i%4]);
 }
 const card=S.__towerShopUI.cards[0].background;
 ok(card.getWidth()===84&&card.getHeight()===112&&V.get('Money').getAsNumber()===650,'original shop card /650starting Gold intact');
 return {checks:checks.length,performance:perf,visibleViews:20,colors:'100% and75% green /50% yellow /25% red',hpWidth:[24,30,30,26,36]};
})()
