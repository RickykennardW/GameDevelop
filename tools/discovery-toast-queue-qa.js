// Native spawn/archive APIs in an isolated preview, including future variant fixtures.
(async()=>{
 const G=testGame,S=G.getSceneStack().getCurrentScene(),V=S.getVariables(),D=S.__monsterDiscovery,A=G.__fusionArchive,F=S.__fusion,I=G.getInputManager(),checks=[];
 G.pause(true);const ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
 let maxVisible=0;
 const step=(n=1)=>{for(let i=0;i<n;i++){S.renderAndStep(16.667);I.onFrameEnded();maxVisible=Math.max(maxVisible,Number(D.root.visible)+Number(S.__fusionDiscovery.root.visible));if(maxVisible>1)throw Error('overlapping discovery toasts');}};
 const spawn=id=>{V.get('Wave').setNumber(1);V.get('WaveActive').setBoolean(true);V.get('WaveMode').setString('Manual');const w=S.__waveManager;w.queue=[id];w.index=0;w.elapsed=V.get('SpawnInterval').getAsNumber();V.get('EnemiesToSpawn').setNumber(1);step();};
 const until=predicate=>{for(let i=0;i<600&&!predicate();i++)step();ok(predicate(),'queued presentation advances');};
 step(4);spawn('Basic');ok(D.active?.id==='Basic','first native encounter begins monster toast');
 ok(A.discover('StarburstCannon','pure_52_25'),'actual archive API discovers canonical Pure Fusion');spawn('VoidHound');
 ok(!A.active&&A.queue.length===1&&D.queue.join()==='VoidHound','new Fusion and later monster wait in bounded queues');
 until(()=>!!A.active);ok(!D.active&&D.queue.join()==='VoidHound','FIFO displays Fusion before later monster');
 const age=A.active.age;V.get('IndexOpen').setBoolean(true);step(30);ok(A.active.age===age&&!D.root.visible&&!S.__fusionDiscovery.root.visible,'Index pauses presentation without dropping notifications');V.get('IndexOpen').setBoolean(false);
 until(()=>D.active?.id==='VoidHound');ok(!A.active&&A.stats.completed===1,'monster resumes after Fusion, never two panels');
 until(()=>!D.active);ok(D.stats.shown===2&&D.stats.completed===2&&maxVisible===1,'all native discoveries shown once with one panel');
 spawn('Basic');ok(!D.active&&D.stats.shown===2&&!A.discover('StarburstCannon','pure_52_25'),'known enemy/Fusion never repeat');
 const fixture={Id:'QueueHybrid',Name:'Queue Hybrid',Kind:'Hybrid',Animation:'StarburstCannon',AdaptiveVariants:true,Variants:[{Id:'one',Name:'Adaptive One',Recipe:[]},{Id:'two',Name:'Adaptive Two',Recipe:[]}]};A.catalog.push(fixture);
 ok(A.discover(fixture.Id,'one')&&A.discover(fixture.Id,'two'),'future Hybrid variants enqueue separately without changing real catalog JSON');step();
 ok(A.active?.variant==='one'&&A.queue[0].variant==='two'&&A.progress(fixture.Id).found===2,'adaptive progress and notification order share existing archive');
 until(()=>A.active?.variant==='two');step(55);ok(S.__fusionDiscovery.heading.text==='NEW VARIANT'&&S.__fusionDiscovery.name.text==='Adaptive Two','variant toast uses actual variant name');
 const make=(a,b,x)=>{const t=S.createObject('StarCannonTower'),v=t.getVariables();for(const[n,z]of Object.entries({TowerId:900000+t.getUniqueId(),Path1Level:a,Path2Level:b,FootprintX:x,FootprintY:352,FootprintRadius:46}))v.get(n).setNumber(z);step();S.__starCannon.apply(t);t.__starCooldown=100000;return t;};
 const a=make(5,2,300),b=make(2,5,900);F.begin(a);F.choose(b);step();const before=A.active.age;step(30);
 ok(S.getTimeManager().getTimeScale()===.5&&Math.abs(A.active.age-before-.50001)<.025,'toast runs on real-time clock during actual Tactical Fusion0.5x');F.cancel();
 until(()=>!A.active);ok(!A.queue.length&&G.__celestialDiscoveryOrder.tickets.size===0&&maxVisible===1,'mixed queue drains and presentation tickets are released');
 const toast=D.geometry();if(globalThis.BALANCE_MODE==='screenshot'){spawn('VoidGuard');step(60);}
 return{checks,maxVisible,toast,monster:D.stats,fusion:A.stats,frameClock:'native controlled frames / no balancing changes'};
})()
