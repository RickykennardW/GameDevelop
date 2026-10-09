(async()=>{
 const S=testGame.getSceneStack().getCurrentScene(),V=S.getVariables(),G=S.__voidGolem,F=G.fort,checks=[];
 const ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
 const wait=async n=>new Promise(r=>{const tick=()=>--n?requestAnimationFrame(tick):r();requestAnimationFrame(tick);});
 const remove=n=>S.getObjects(n).slice().forEach(o=>o.deleteFromScene());
 const make=(type,x,y,dir='Right',speed=0)=>{const e=S.createObject('Enemy'),v=e.getVariables();v.get('EnemyType').setString(type);S.__novaWisp.ensure(e);const size=type==='VoidGolem'?64:48;e.setPosition(x-size/2,y-size/2);v.get('Facing').setString(dir);v.get('MoveSpeed').setNumber(speed);return e;};
 const mode=globalThis.BALANCE_MODE||'cast',performanceResults=[];
 if(mode==='gallery'){
  const frame=document.createElement('iframe');frame.style.cssText='position:fixed;inset:0;width:100%;height:100%;border:0;z-index:9999';
  const loaded=new Promise(resolve=>frame.onload=resolve);frame.src='file:///C:/Users/My%20ASUS/OneDrive/Documents/GitHub/GameDevelop/design_previews/void_golem/Animation_Preview.html';document.body.append(frame);await loaded;await new Promise(r=>setTimeout(r,500));
  ok(frame.contentDocument.querySelectorAll('canvas').length===20,'gallery20 directional clips');
  ok(frame.contentWindow.eval('Object.values(images).every(im=>im.complete&&im.naturalWidth===1024)'),'four final atlas images loaded');
  ok(frame.contentWindow.eval('clips.every(c=>c.canvas.width===256&&c.canvas.height===342&&c.label.textContent.includes("frame"))'),'gallery uniform canvas dimensions');return{checks,clips:20,atlasImages:4};
 }
 if(mode==='stress'){
  for(const count of [200,450]){
   remove('Enemy');const enemies=Array.from({length:count},(_,i)=>make(['Basic','VoidHound','VoidGuard','VoidSentinel','VoidBrute','VoidGolem'][i%6],300+i%25*45,330+Math.floor(i/25)*40));await wait(4);
   for(const e of enemies){const r=F.ensure(e);r.active=true;r.expires=G.frameTime+100;F.armor(r);}
   await wait(5);const created=F.createdVFX,pairs=S.__enemyHealthBarState.createdPairs;
   const times=await new Promise(resolve=>{const times=[];let prev=performance.now();const tick=()=>{const now=performance.now();times.push(now-prev);prev=now;if(times.length<120)requestAnimationFrame(tick);else resolve(times);};requestAnimationFrame(tick);});
   const sorted=times.slice().sort((a,b)=>a-b),row={enemies:count,golems:enemies.filter(e=>G.has(e)).length,shields:S.getObjects('VoidFortificationVFX').length,samples:120,meanMs:times.reduce((a,b)=>a+b)/times.length,p95Ms:sorted[Math.floor(.95*sorted.length)],maxMs:Math.max(...times),newVFX:F.createdVFX-created,newHPBarPairs:S.__enemyHealthBarState.createdPairs-pairs};performanceResults.push(row);
   ok(row.shields===count&&row.newVFX===0&&row.newHPBarPairs===0,'native real-frame '+count+' enemies/bars/shields without allocations');console.log('BALANCE PROGRESS '+JSON.stringify(row));
  }
  remove('Enemy');await wait(4);ok(!F.members.size&&!G.actors.size&&!S.getObjects('VoidFortificationVFX').length&&!S.__enemyHealthBars.size,'stress cleanup no dangling effects/peers/bars');
  return{checks,performance:performanceResults,note:'120 actual requestAnimationFrame samples per crowd;headless Chrome on this machine;static enemies,no towers;not a universal FPS guarantee'};
 }
 const dirs=['Up','Down','Left','Right'],golems=dirs.map((d,i)=>make('VoidGolem',420+i*330,485,d)),allies=['Basic','VoidHound','VoidGuard','VoidSentinel','VoidBrute'].map((t,i)=>make(t,350+i*280,720));await wait(4);
 if(mode==='directions')return{checks,views:golems.map(e=>({animation:e.getAnimationName(),hp:e.getBehavior('Health').Health(),armor:e.getBehavior('Health').FlatDamageReduction(),bounds:e.__golemRig.body.getBounds()})),atlasCanvas:[256,342]};
 if(mode==='buff'){
  for(const e of [...golems,...allies])F.apply(e);await wait(5);
  ok(S.getObjects('VoidFortificationVFX').length===9,'nine native shield owners visible');
  return{checks,armor:[...golems,...allies].map(e=>({enemy:e.getVariables().get('EnemyType').getAsString(),armor:e.getBehavior('Health').FlatDamageReduction()})),shields:9};
 }
 for(const e of golems)e.__golemState.nextCast=G.frameTime+.001;
 await wait(4);const held=golems.map(e=>[e.getX(),e.getY(),e.getVariables().get('Waypoint').getAsNumber()]);await wait(22);
 ok(golems.every((e,i)=>e.__golemState.casting&&e.getX()===held[i][0]&&e.getY()===held[i][1]&&e.getVariables().get('Waypoint').getAsNumber()===held[i][2]),'live four-direction casting stationary');
 ok(golems.every(e=>e.getAnimationName().startsWith('VoidGolemSkill_')),'live Skill retains facing');
 return{checks,casting:golems.map(e=>({animation:e.getAnimationName(),castAge:G.frameTime-e.__golemState.castStart,position:[e.getX(),e.getY()],waypoint:e.getVariables().get('Waypoint').getAsNumber()})),fixture:'shortened cooldown for screenshot only;production25seconds'};
})()
