// Multi-tower battle and layout probes against the compiled GDevelop scene.
(async()=>{
 const game=testGame,scene=game.getSceneStack().getCurrentScene(),v=scene.getVariables(),input=game.getInputManager();
 game.pause(true);
 const step=(n=1,ms=16.667)=>{for(let i=0;i<n;i++){scene.renderAndStep(ms);input.onFrameEnded();}};
 step(3);
 const p=scene.__freePlacement,f=scene.__fusion,ev=scene.__fusionEvolution,nb=scene.__nebulaBloom,star=scene.__starCannon;
 const checks=[];
 const ok=(value,message)=>{if(!value)throw Error(message);checks.push(message);};
 const mode=globalThis.BALANCE_MODE;
 const make=(type,x,y,path=[0,0],tier=3)=>{
  const tower=scene.createObject(type),tv=tower.getVariables();
  for(const [name,n] of Object.entries({TowerId:80000+tower.getUniqueId(),FootprintX:x,FootprintY:y,FootprintRadius:p.config(type).Radius,
       Path1Level:path[0],Path2Level:path[1],PurchasePrice:500,TotalInvestment:500}))tv.get(name).setNumber(n);
  tower.setZOrder(2);
  const success=ev.type(tower)?ev.apply(tower,tier):(type==='NebulaBloomTower'?nb:star).apply(tower);
  if(!success)throw Error('Cannot create fixture '+type);
  return tower;
 };
 const enemy=(x,y,hp)=>{
  const e=scene.createObject('Enemy'),vars=e.getVariables(),health=e.getBehavior('Health');
  vars.get('EnemyType').setString('Basic');e.setAnimationName('NovaIdle_Right');e.setWidth(48);e.setHeight(48);e.setPosition(x-24,y-24);
  scene.__novaWisp.ensure(e);vars.get('MoveSpeed').setNumber(0);vars.get('GoldReward').setNumber(0);
  health.SetMaxHealth(hp);health.SetHealth(hp);return e;
 };
 if(mode==='resize'){
  if(!scene.__fusionResizeFixture){
   v.get('Money').setNumber(100000);
   const a=make('NebulaBloomTower',300,352,[5,2]),b=make('StarCannonTower',900,352,[2,5]);
   step(3);ok(f.begin(a)&&f.choose(b),'Actual Toxic Constellation placement mode started');
   scene.__fusionResizeFixture={a,b,ghost:f.ghost,footprints:f.footprints};
  }
  const fixture=scene.__fusionResizeFixture;
  const view=scene.getLayer('').convertInverseCoords(...p.center(fixture.a),0,[0,0]);
  input.onMouseMove(...view);step(5);
  const w=game.getGameResolutionWidth(),h=game.getGameResolutionHeight();
  const box=f.sidebar.screenRect,button=f.cancelRect,zoom=scene.getLayer('').getCameraZoom();
  const expected=ev.art.towers.ToxicConstellation.tiers[0].pivot[0]*2*ev.art.towers.ToxicConstellation.scale*zoom;
  const canvas=game.getRenderer().getCanvas().getBoundingClientRect();
  ok([w,h,zoom,box.x,box.y,box.w,box.h,button.y].every(Number.isFinite)&&zoom>0,'Resize retains finite camera and sidebar layout');
  ok(f.active&&f.ghost===fixture.ghost&&f.footprints===fixture.footprints&&f.footprints.size===2,'Resize reuses live ghost, markers and source footprints');
  ok(f.ghost.getAnimationName()==='ToxicConstellation'&&Math.abs(f.ghost.getWidth()-expected)<.002&&Math.abs(f.ghost.getWidth()-f.ghost.getHeight())<.002,'Ghost size recomputes from the reference without stretching');
  ok(box.x>=0&&box.y>=0&&box.x+box.w<=w+.01&&button.y+button.h<=h+.01,'Sidebar and Cancel stay inside the logical viewport');
  return {checks,viewport:[w,h],canvas:[canvas.width,canvas.height],sidebar:box,ghost:f.ghost.getWidth(),zoom,hidden:document.hidden};
 }

 const ids=['VenomCataclysm','PlaguebreakerCannon','SupernovaObliterator','ToxicConstellation','MeteorStormArray'];
 const points=[[340,352],[894,352],[1418,352],[447,610],[1140,610]];
 if(mode==='wave'){
  const a=make('NebulaBloomTower',300,352,[5,2]),b=make('NebulaBloomTower',900,352,[2,5]);
  step(2);ok(f.begin(a)&&f.choose(b),'Wave fixture enters the actual Venom Cataclysm transaction');
  const venom=f.confirm(300,352);ok(!!venom,'Actual regional Fusion places Venom E1');step(3);
  const money=v.get('Money').getAsNumber(),lives=v.get('Lives').getAsNumber();
  const button=scene.getObjects('ShopPlayButton')[0],layer=scene.getLayer(button.getLayer());
  input.onMouseMove(...layer.convertInverseCoords(button.getCenterXInScene(),button.getCenterYInScene(),0,[0,0]));step(2);
  input.onMouseButtonPressed(0);step(2);input.onMouseButtonReleased(0);step(2);
  const queue=scene.__waveManager.queue.slice(),enemyTypes=v.get('EnemyTypes').toJSObject();
  ok(v.get('Wave').getAsNumber()===1&&queue.length===20,'Native Play starts the original first wave');
  let frames=0,predicted=false;
  for(;frames<2400&&v.get('LastRewardedWave').getAsNumber()<1&&!v.get('GameOver').getAsBoolean();frames++){
   step(1,50);
   for(const shot of ev.projectiles)if(shot.target&&Math.hypot(shot.destination[0]-shot.target.getCenterXInScene(),shot.destination[1]-shot.target.getCenterYInScene())>8)predicted=true;
  }
  ok(predicted&&ev.metrics.shots>0&&ev.metrics.impacts>0,'Venom leads moving native wave enemies and hits ground impacts');
  ok(v.get('LastRewardedWave').getAsNumber()===1&&v.get('Lives').getAsNumber()===lives&&
     v.get('Money').getAsNumber()===money+queue.reduce((total,type)=>total+enemyTypes[type].Reward,0),'Moving wave clears and awards only the original Gold with Lives intact');
  step(180,50);
  ok(!ev.projectiles.length&&!ev.effects.length&&!ev.zones.length&&!nb.poisons.size,'Wave leaves no orphan combat or status records');
  return{checks,nativeWave:1,enemyCount:queue.length,simulatedSeconds:frames*.05,metrics:ev.metrics};
 }
 const towers=ids.map((id,i)=>make(id,...points[i]));
 if(mode==='capture'){
  const price=type=>v.get('TowerShopCatalog').toJSObject().find(item=>item.Type===type).Cost;
  for(const [i,tower] of towers.entries()){
   const id=ids[i],recipe=game.__fusionArchive.definition(id).Variants[0].Recipe;
   const sourceCost=recipe.reduce((total,part)=>{
    const cfg=part.Type==='StarCannonTower'?star.config:nb.config;
    return total+price(part.Type)+[part.Path1,part.Path2].reduce((sum,n,path)=>sum+cfg.Paths[path].Upgrades.slice(0,n).reduce((amount,upgrade)=>amount+upgrade.Cost,0),0);
   },0);
   tower.getVariables().get('TotalInvestment').setNumber(sourceCost+ev.balance.Towers[id].FusionCost+ev.stats(id,2).Cost+ev.stats(id,3).Cost);
  }
  for(const [x,y] of points)for(const dx of [95,124,151])enemy(x+dx,y-111,1500);
  step(125);
  v.get('SelectedTower').setNumber(towers[2].getVariables().get('TowerId').getAsNumber());step(3);
  ok(ev.metrics.shots>0&&ev.metrics.impacts>0&&scene.__selectedPanel.tower===towers[2],'Active Fusion gameplay with the E3 Evolution panel');
  return{checks,metrics:ev.metrics};
 }
 for(const [id,x,y] of [['ToxicConstellation',590,352],['ToxicConstellation',790,610],['ToxicConstellation',1310,610],
                        ['MeteorStormArray',510,352],['MeteorStormArray',1000,610],['MeteorStormArray',1440,610]])towers.push(make(id,x,y));
 const targets=[];
 for(const y of [222,484,744])for(let x=270;x<=1580;x+=84)targets.push(enemy(x,y,200000));
 v.get('WaveMode').setString('AutoFast');step(2);
 const start=performance.now();
 step(720);
 const elapsed=performance.now()-start,m=ev.metrics;
 ok(scene.getTimeManager().getTimeScale()===2&&m.shots>400&&m.impacts>350&&m.rainDrops>=24,'2x sustained battle processes projectiles, impacts and Meteor Rain');
 ok(m.zones>100&&m.peakZones<=ev.rules.MaxZones&&ev.zones.filter(zone=>zone.stats.Kit==='toxic').length<=16,'Many poison zones are bounded globally and per tower');
 ok(m.peakEffects<=ev.rules.MaxEffects&&m.peakProjectiles<=ev.rules.MaxProjectiles&&m.peakScheduled<=ev.rules.MaxScheduled,'Projectiles, visual effects and scheduled attacks respect their capacity');
 ok(nb.poisons.size<=targets.length&&[...nb.poisons.values()].every(p=>p.enemy.getUniqueId()===p.id),'Every enemy has at most one live shared poison record');
 ok(new Set([...ev.rigs.values()].map(r=>r.root)).size===towers.length&&ev.frames.size<=2172,'One rig per owner and a bounded shared frame cache');
 ok(scene.__audio.stats.maxVoices<=scene.__audio.voices.length,'Rapid fire shares the existing audio voice cap');
 const poolBefore=ev.pool.length,frames=ev.frames.size;
 for(const t of towers)t.deleteFromScene();
 for(const target of targets)target.deleteFromScene();
 step(620);
 ok(!ev.projectiles.length&&!ev.effects.length&&!ev.zones.length&&!ev.links.size&&!ev.scheduled.length&&!ev.rigs.size&&!nb.poisons.size,
    'All owners and transient combat records drain after battle');
 await new Promise(resolve=>setTimeout(resolve,180));
 const next=game.getSceneStack().replace('Game Scene');next.renderAndStep(16.667);input.onFrameEnded();
 ok(ev.disposed&&!ev.frames.size&&!ev.pool.length&&next.__fusionEvolution!==ev,'Actual scene restart disposes every cropped texture and pooled sprite');
 return {checks,metrics:m,frames,pooledSpritesDuringFight:poolBefore,fixtureEnemies:targets.length,fixtureTowers:towers.length,
         simulatedFrames:720,headlessElapsedMs:Math.round(elapsed),headlessMsPerStep:Math.round(elapsed/720*100)/100};
})()
