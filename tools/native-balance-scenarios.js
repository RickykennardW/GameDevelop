(async()=>{
 const game=testGame,input=game.getInputManager();game.pause(true);
 const results=[],checks=[];const ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
 const placements={base:[[800,352,0,0]],max42:[[800,352,4,2]],max24:[[800,352,2,4]],sixBasic:[[300,352,0,0],[800,352,0,0],[1300,352,0,0],[400,616,0,0],[900,616,0,0],[1400,616,0,0]],mixed:[[300,352,2,0],[800,352,3,2],[1300,352,2,3],[400,616,1,1],[900,616,2,1],[1400,616,0,0]]};
 const fresh=()=>{const S=new gdjs.RuntimeScene(game);S.loadFromScene(game.getSceneAndExtensionsData('Game Scene'));for(let i=0;i<5;i++){S.renderAndStep(50);input.onFrameEnded();}return S;};
 const step=S=>{S.renderAndStep(50);input.onFrameEnded();};
 const buy=(S,x,y,a=0,b=0)=>{
  const V=S.getVariables(),p=S.__freePlacement,star=S.__starCannon;
  const validation=p.validate('StarCannonTower',x,y);ok(validation.valid,'native valid placement '+[x,y]);
  const t=S.createObject('StarCannonTower'),v=t.getVariables();V.get('Money').sub(validation.cost);
  p.positionSprite(t,'StarCannonTower',x,y);v.get('FootprintX').setNumber(x);v.get('FootprintY').setNumber(y);v.get('FootprintRadius').setNumber(validation.radius);v.get('TowerId').setNumber(990000+t.getUniqueId());step(S);
  for(let i=0;i<a;i++)ok(star.upgrade(t,1),'native Path1 purchase '+(i+1));for(let i=0;i<b;i++)ok(star.upgrade(t,2),'native Path2 purchase '+(i+1));return t;
 };
 const start=S=>{
  const o=S.getObjects('ShopPlayButton')[0],q=S.getLayer(o.getLayer()).convertInverseCoords(o.getCenterXInScene(),o.getCenterYInScene(),0,[0,0]);
  input.onMouseMove(...q);input.onMouseButtonPressed(0);step(S);step(S);input.onMouseButtonReleased(0);step(S);step(S);
 };
 const wave=async S=>{
  const V=S.getVariables(),money=V.get('Money').getAsNumber(),lives=V.get('Lives').getAsNumber(),w=V.get('Wave').getAsNumber()+1;
  start(S);ok(V.get('Wave').getAsNumber()===w,'native PLAY starts expected wave '+w);
  let frames=0,peak=0;
  while(V.get('WaveActive').getAsBoolean()&&!V.get('GameOver').getAsBoolean()&&frames<8000){
   step(S);frames++;peak=Math.max(peak,S.getObjects('Enemy').length);
   if(frames%200===0)await new Promise(r=>setTimeout(r,0));
  }
  const leaked=lives-V.get('Lives').getAsNumber(),total=w*4,spawned=S.__waveManager.index;
  ok(frames<8000,'native wave terminates within400 simulated seconds');
  return {wave:w,total,spawned,killed:total-leaked,leaked,clear:leaked===0&&spawned===total&&!S.getObjects('Enemy').length,gameOver:V.get('GameOver').getAsBoolean(),frames,peak,spawnInterval:V.get('SpawnInterval').getAsNumber(),income:V.get('Money').getAsNumber()-money,gold:V.get('Money').getAsNumber(),lives:V.get('Lives').getAsNumber(),remainingEnemies:S.getObjects('Enemy').length};
 };
 for(const [name,w]of (globalThis.BALANCE_MODE==='campaign'?[]:[['base',20],['max42',50],['max24',50],['sixBasic',20],['sixBasic',50],['mixed',20],['mixed',50]])){
  const S=fresh(),V=S.getVariables();V.get('Money').setNumber(100000);V.get('Lives').setNumber(10000);
  const towers=placements[name].map(p=>buy(S,...p));V.get('Wave').setNumber(w-1);V.get('LastRewardedWave').setNumber(w-1);
  const result=await wave(S);result.scenario=name;result.investment=towers.reduce((s,t)=>s+t.getVariables().get('TotalInvestment').getAsNumber(),0);results.push(result);
  ok(S.__enemyHealthBars.size===0&&!S.getObjects('HealthBarFill').length&&!S.getObjects('HealthBarBackground').length,'native full-wave lifecycle no orphan bars '+name+'/'+w);
  if(name==='base'||name.startsWith('max'))ok(result.leaked>10,'single tower insufficient for diagnostic wave '+name+'/'+w);
  if(w===20&&['sixBasic','mixed'].includes(name))ok(result.clear,'native multi-tower Wave20 affordable/viable '+name);
  if(name==='mixed'&&w===50)ok(result.clear,'native mixed investments can clear Wave50');
  console.log('BALANCE PROGRESS '+JSON.stringify(result));S.unloadScene();
 }
 // Actual starting economy: base tower first; buy support for Sentinel introduction.
 {
  const S=fresh();const t=buy(S,800,352),V=S.getVariables(),rows=[];
  for(let w=1;w<=5;w++){if(w===5)buy(S,300,352);const r=await wave(S);console.log('BALANCE PROGRESS early '+JSON.stringify(r));ok(r.clear,'native earned-income early Wave '+w);rows.push(r);}
  ok(V.get('Money').getAsNumber()===668&&V.get('Lives').getAsNumber()===10,'native early5 economy:650start-600purchases+618income=668');
  results.push({scenario:'earlyCampaign',waves:rows,investment:600});console.log('BALANCE PROGRESS early campaign1-5 passed');S.unloadScene();
 }
 // Native sequential1-20 campaign; all purchases use actually earned gold.
 {
  const S=fresh(),V=S.getVariables(),positions=placements.mixed.map(p=>p.slice(0,2)),towers=[];
  towers.push(buy(S,...positions[0]),buy(S,...positions[1]));
  const purchases=[[5,2],[9,3],[13,4],[17,5]],tasks=[[6,0,1],[8,0,1],[7,1,1],[9,1,1],[11,1,2],[13,1,2],[16,1,1],[8,2,2],[12,2,2],[13,2,1],[15,2,1],[19,2,2],[15,3,1],[16,3,2],[17,4,1],[18,4,1],[19,4,2]],done=new Set(),rows=[];
  for(let w=1;w<=20;w++){
   for(const [at,index]of purchases)if(w>=at&&!towers[index]&&V.get('Money').getAsNumber()>=300)towers[index]=buy(S,...positions[index]);
   for(let i=0;i<tasks.length;i++){const [at,index,path]=tasks[i];if(w>=at&&towers[index]&&!done.has(i)&&S.__starCannon.upgrade(towers[index],path))done.add(i);}
   const r=await wave(S);r.builds=towers.map(t=>[t.getVariables().get('Path1Level').getAsNumber(),t.getVariables().get('Path2Level').getAsNumber()]);r.investment=towers.reduce((s,t)=>s+t.getVariables().get('TotalInvestment').getAsNumber(),0);rows.push(r);
   ok(!r.gameOver&&r.lives>0,'native earned-income campaign survives Wave '+w);ok(V.get('Money').getAsNumber()>=0,'campaign never overspends');
   if([5,10,15,20].includes(w))console.log('BALANCE PROGRESS campaign '+JSON.stringify(r));
  }
  results.push({scenario:'earnedIncomeCampaign',waves:rows});S.unloadScene();
 }
 game.pause(false);return {checks:checks.length,results,method:'native compiled events and actual homing projectiles at50ms/step; standalone difficulty fixtures have10000Lives to count every leak, campaign retains10Lives/650Gold; no gameplay logic substituted'};
})()
