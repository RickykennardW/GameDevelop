(async()=>{
 const game=testGame,S=game.getSceneStack().getCurrentScene(),V=S.getVariables(),D=S.__monsterDiscovery,I=game.getInputManager(),get=n=>S.getObjects(n),checks=[];
 const ok=(v,label)=>{if(!v)throw Error(label);checks.push(label);},step=(n=1)=>{for(let i=0;i<n;i++){S.renderAndStep(16.667);I.onFrameEnded();}},wait=ms=>new Promise(r=>setTimeout(r,ms));
 game.pause(true);step(3);
 const mode=globalThis.BALANCE_MODE||'full',originalGameplay=JSON.stringify(['StarCannonConfig','EnemyTypes','WaveBudgetConfig','MonsterPathPoints','TowerFootprints'].map(n=>V.get(n).toJSObject()));
 const camera=JSON.stringify([S.getLayer('').getCameraX(),S.getLayer('').getCameraY(),S.getLayer('').getCameraZoom()]);
 const open=category=>{V.get('IndexOpen').setBoolean(true);S.__unitIndex.category=category;step(3);return S.__unitIndex;};
 const spawn=ids=>{
  V.get('IndexOpen').setBoolean(false);V.get('Wave').setNumber(1);V.get('WaveActive').setBoolean(true);V.get('WaveMode').setString('Manual');V.get('GameOver').setBoolean(false);
  const state=S.__waveManager;state.queue=ids.slice();state.index=0;state.elapsed=V.get('SpawnInterval').getAsNumber()*ids.length;V.get('EnemiesToSpawn').setNumber(ids.length);step();
  return get('Enemy').slice(-ids.length);
 };
 const towerSnapshot=()=>Object.entries(S.__unitIndex.objects).filter(([k,o])=>!o.isHidden()&&typeof o.getString==='function').map(([k,o])=>[k,o.getString()]);
 const output=()=>({checks,mode,ids:D.ids,found:[...D.found],queued:D.queue.slice(),active:D.active,scope:D.scope,stats:D.stats,geometry:D.active?D.geometry():null,renderCount:S.__unitIndex.renderCount});
 ok(D.ready&&D.ids.length===6&&D.found.size===0,'fresh save: six stable monster IDs /all locked before Index');
 ok(!D.root.visible&&D.queue.length===0,'fresh game has no discovery popup or pending discovery');
 open('Towers');const towersBefore=towerSnapshot();ok(S.__unitIndex.entries[0].name==='Star Cannon'&&Object.keys(S.__unitIndex.objects).filter(k=>/^starUpgrade[01][0-3]$/.test(k)).length===8,'Tower Index fully visible with eight upgrades without unlock');
 let index=open('Monsters');
 ok(index.cards.length===6&&D.found.size===0,'opening Index never discovers monsters');
 for(const c of index.cards){index.select(c.id);step(2);ok(c.name.getString()==='???'&&index.detail.name.getString()==='???'&&index.detail.statValues.length===0&&index.detail.description.getString().includes('Encounter this enemy'),'locked name/stats/ability/description hidden');const r=c.sprite.__archivePortrait.sprite;ok(r.tint===0,'true black silhouette, including Golem cropped atlas');}
 ok(index.objects.subtitle.getString()==='MONSTER DISCOVERY  /  0 / 6 DISCOVERED','progress derives from active registered Index monsters');
 const redraws=index.renderCount;step(12);ok(index.renderCount===redraws,'unchanged Index is not redrawn every frame');
 if(mode==='locked')return output();
 const fake=S.createObject('Enemy');fake.getVariables().get('EnemyType').setString('VoidGolem');S.__novaWisp.ensure(fake);step();ok(!D.has('VoidGolem'),'preview/template enemy does not unlock anything');fake.deleteFromScene();step();
 const [basic]=spawn(['Basic']);ok(D.has('Basic')&&D.found.size===1&&D.active?.id==='Basic'&&D.stats.unlocks===1,'actual native wave spawn discovers Nova Wisp exactly once');
 ok(D.scope==='session'&&game.__celestialMonsterDiscoverySession.found.has('Basic')&&localStorage.getItem('celestialVoidMonsterDiscovery.v1')===null,'discovery lives in RuntimeGame memory /no persistent discovery write');
 ok(D.icon.tint===0&&D.nameText.alpha===0,'reveal starts with black silhouette and hidden name');step(12);ok(D.active.age>.2&&D.root.alpha===1,'slide-in and fade-in finish in 0.2 seconds');step(12);
 ok(D.icon.tint>0&&D.icon.tint<0xffffff&&D.nameText.alpha===0,'silhouette reveals into original color before name appears');
 if(mode==='notification'){step(35);ok(D.nameText.text==='Nova Wisp'&&D.nameText.alpha===1,'correct monster name fully revealed');return output();}
 const renderRevision=index.renderCount;index=open('Monsters');index.select('Basic');step(2);ok(index.cards[0].name.getString()==='Nova Wisp'&&index.detail.statValues.some(([key,value])=>key==='HP'&&value===100)&&index.cards[1].name.getString()==='???'&&index.renderCount>renderRevision,'Index updates discovered entry live /unseen kinds remain secret');
 const [hound]=spawn(['VoidHound']);ok(D.active.id==='Basic'&&D.queue.join()==='VoidHound','second discovery is queued instead of stacking panels');
 spawn(['Basic','VoidHound']);ok(D.stats.unlocks===2&&D.queue.length===1,'subsequent real spawns of known kinds never repeat unlock or notification');
 const revision=D.revision;for(let i=0;i<100;i++)D.onWaveSpawn(hound,'VoidHound');ok(D.revision===revision&&D.queue.length===1,'duplicate calls are idempotent /queue bounded by monster types');
 if(mode==='session')return{...output(),sessionFound:[...D.found]};
 step(220);ok(D.active?.id==='VoidHound'&&D.stats.shown===2,'queue advances to second monster after first compact notification');step(245);ok(!D.active&&!D.root.visible&&!D.queue.length,'queue drains /no duplicate panels remain');
 spawn(['VoidGuard']);const t1=D.active.age;step(60);const normal=D.active.age-t1;V.get('WaveMode').setString('ManualFast');step();const t2=D.active.age;step(60);const fast=D.active.age-t2;
 ok(Math.abs(normal-fast)<.035&&Math.abs(normal-1)<.035,'notification clock is one real second at both game speed1x and2x');
 V.get('WaveMode').setString('Manual');step(185);
 // Keep Index open while the existing spawn function executes a valid wave spawn.
 V.get('IndexOpen').setBoolean(true);S.__unitIndex.category='Monsters';step();const state=S.__waveManager;state.queue=['VoidSentinel'];state.index=0;state.elapsed=V.get('SpawnInterval').getAsNumber();V.get('EnemiesToSpawn').setNumber(1);V.get('WaveActive').setBoolean(true);step(2);
 ok(D.has('VoidSentinel')&&S.__unitIndex.cards[3].name.getString()==='Void Sentinel'&&S.__unitIndex.cards[4].name.getString()==='???','open Index refreshes once when actual spawn unlocks a type');
 const count=S.__unitIndex.renderCount;step(12);ok(S.__unitIndex.renderCount===count,'live update does not cause perpetual Index redraw/flicker');
 spawn(['VoidBrute','VoidGolem']);ok(D.found.size===6&&D.queue.join()==='VoidBrute,VoidGolem','all six existing types integrated /several simultaneous discoveries retain order');
 open('Monsters');ok(S.__unitIndex.objects.subtitle.getString()==='MONSTER DISCOVERY  /  6 / 6 DISCOVERED'&&S.__unitIndex.cards.every(c=>c.name.getString()!=='???'),'progress and all existing data unlock without changing stats');
 for(const c of S.__unitIndex.cards){const sprite=c.sprite.__archivePortrait.sprite;ok(sprite.tint===0xffffff,'discovered monster restored to full original color');}
 open('Towers');ok(JSON.stringify(towerSnapshot())===JSON.stringify(towersBefore),'Tower Index content unchanged after all monster discoveries');V.get('IndexOpen').setBoolean(false);step(2);
 ok(!D.root.interactive&&!D.root.interactiveChildren,'notification does not subscribe to or intercept pointer input');
 ok(D.root.mask===D.mask&&!D.mask.interactive,'slide animation is clipped to its free UI rectangle /cannot sweep across HUD');
 const p=S.__freePlacement;V.get('Money').setNumber(10000);const card=S.__towerShopUI.cards[0].background,cardXY=S.getLayer(card.getLayer()).convertInverseCoords(card.getCenterXInScene(),card.getCenterYInScene(),0,[0,0]);I.onMouseMove(...cardXY);step();I.onMouseButtonPressed(0);step();I.onMouseButtonReleased(0);step();ok(p.active,'existing shop input enters builder');
 const valid=[300,352],screen=S.getLayer('').convertInverseCoords(...valid,0,[0,0]);ok(p.validate('StarCannonTower',...valid).valid,'existing placement validator accepts original test footprint');
 // Place the purely visual test panel over the valid click, using the same runtime renderer.
 const geo=D.geometry;D.geometry=()=>({x:screen[0]-220,y:screen[1]-66,w:440,h:132,scale:1});step(65);
 const before=get('StarCannonTower').length,gold=V.get('Money').getAsNumber();I.onMouseMove(...screen);I.onMouseButtonPressed(0);step();I.onMouseButtonReleased(0);step();
 ok(get('StarCannonTower').length===before+1&&V.get('Money').getAsNumber()===gold-300,'click through actual visible notification still places tower /charges exactly300');D.geometry=geo;
 const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
 const tower=get('StarCannonTower')[0];V.get('SelectedTower').setNumber(tower.getVariables().get('TowerId').getAsNumber());step(2);
 const rect=D.geometry(),selected=S.__selectedPanel.screenRect,ui=S.getLayer('UI'),hud=get('HUDPanel')[0],top=ui.convertInverseCoords(hud.getX(),hud.getY(),0,[0,0]);
 ok(rect.x>=0&&rect.x+rect.w<S.__towerShopUI.gameArea.right&&!overlaps(rect,{x:top[0],y:top[1],w:hud.getWidth(),h:hud.getHeight()})&&(!selected||!overlaps(rect,selected)),'responsive notification fits free UI space outside HUD/shop/upgrade panel');
 const callbacks=gdjs.callbacksRuntimeScenePostEvents.length,children=D.root.children.length;step(800);ok(!D.active&&D.queue.length===0&&D.stats.shown===6&&D.stats.completed===6,'each discovered type shown once /all six notifications complete');
 ok(D.root.children.length===children&&D.indexPortraits.size===D.ids.length+1&&D.outlines.size===0&&gdjs.callbacksRuntimeScenePostEvents.length===callbacks,'render nodes/portrait cache/callback count remain bounded: six thumbnails, one detail, no shadow duplicates');
 ok(camera===JSON.stringify([S.getLayer('').getCameraX(),S.getLayer('').getCameraY(),S.getLayer('').getCameraZoom()])&&originalGameplay===JSON.stringify(['StarCannonConfig','EnemyTypes','WaveBudgetConfig','MonsterPathPoints','TowerFootprints'].map(n=>V.get(n).toJSObject())),'camera/path/tower/enemy/wave/placement configuration unchanged');
 ok(D.stats.sounds===6,'one quiet discovery sound per queued first encounter using existing audio system');
 return{...output(),normalSeconds:normal,fastSeconds:fast,sessionFound:[...D.found],note:'Tests use the original native wave spawn with controlled fixture queues, never a replacement spawner.'};
})()
