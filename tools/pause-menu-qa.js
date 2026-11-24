// Native runtime isolation test. Gold/unlocks are fixtures, not a balance victory.
(async()=>{
 const G=testGame,I=G.getInputManager(),stack=G.getSceneStack(),checks=[];let S=stack.getCurrentScene();G.pause(true);
 const ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);},wait=ms=>new Promise(r=>setTimeout(r,ms));
 const step=(n=1,ms=16.667)=>{for(let i=0;i<n;i++){stack.step(ms);I.onFrameEnded();}};
 const click=(x,y,layer='')=>{I.onMouseMove(...S.getLayer(layer).convertInverseCoords(x,y,0,[0,0]));step(2);I.onMouseButtonPressed(0);step();I.onMouseButtonReleased(0);step(2);};
 const object=o=>click(o.getCenterXInScene(),o.getCenterYInScene(),o.getLayer());
 const button=b=>click(b.rect.x+b.rect.w/2,b.rect.y+b.rect.h/2,'CampaignUI');
 const pauseButton=id=>{const b=S.__pauseUI.buttons.find(b=>b.id===id);ok(!!b.rect,'Visible pause control '+id);click(b.rect.x+b.rect.w/2,b.rect.y+b.rect.h/2,'GameOverUI');};
 const key=code=>{I.onKeyPressed(code);step();I.onKeyReleased(code);step(2);};
 const enter=async name=>{const old=S;for(let i=0;i<500;i++){step();if(stack.getCurrentScene()!==old&&stack.getCurrentScene()?.getName()===name)break;await wait(3);}S=stack.getCurrentScene();step(8);ok(S!==old&&S.getName()===name,'Native replacement to '+name);};
 step(4);const C=G.__campaign;C.save.SelectTutorialDone=C.save.GameTutorialDone=true;C.save.Completed=Object.fromEntries(C.config.Levels.map(l=>[l.Id,true]));S.__levelsUI.stage=-1;S.__levelsUI.chooseChapter(1);S.__levelsUI.chooseLevel('1-1');step(3);button(S.__levelsUI.launch);await enter('Game Scene');
 const V=S.getVariables(),P=S.__freePlacement,R=S.__campaignRun,get=n=>S.getObjects(n),n=k=>V.get(k).getAsNumber();
 const vars=o=>{const keys=[];o.getVariables()._variables.keys(keys);return Object.fromEntries(keys.map(k=>[k,o.getVariables().get(k).toJSObject()]));};
 const snapshot=()=>JSON.stringify({enemies:get('Enemy').map(o=>[o.getUniqueId(),o.getX(),o.getY(),vars(o),o.getBehavior('Health').Health()]),towers:P.towers().map(o=>[o.getUniqueId(),vars(o)]),projectiles:get('StarCannonProjectile').map(o=>[o.getUniqueId(),o.getX(),o.getY(),vars(o)]),wave:n('Wave'),money:n('Money'),lives:n('Lives'),spawn:S.__waveManager?.index,spawnTime:S.__waveManager?.elapsed,combatTime:R.now,evolutionTime:S.__fusionEvolution.time});
 // A real enemy wave and a real tower shot must exist before testing freeze.
 V.get('Money').setNumber(150000);R.pendingWave=true;step(3);
 let targetSite;
 for(let y=150;y<970&&!targetSite;y+=12)for(let x=300;x<1600;x+=16)if(P.validate('StarCannonTower',x,y).valid&&Math.hypot(x-300,y-220)<320){targetSite=[x,y];break;}
 ok(!!targetSite,'Legal paid tower site for pause combat');object(S.__towerShopUI.cards[0].background);click(...targetSite);ok(get('StarCannonTower').length===1,'Native shop purchases test tower');
 for(let i=0;i<1000&&!get('StarCannonProjectile').length;i++)step();
 ok(get('Enemy').length>0&&get('StarCannonProjectile').length>0,'Native enemy movement and tower projectile active before pause');
 const worldLayerScale=S.getLayer('').getTimeScale();
 for(const speed of [1,2]){
  V.get('WaveMode').setString(speed===2?'ManualFast':'Manual');step();ok(S.getTimeManager().getTimeScale()===speed,'Pre-pause speed '+speed);
  key(27);const p=S.__pauseUI;ok(p.active&&p.root.visible&&S.getLayer('GameOverUI').isVisible()&&S.getTimeManager().getTimeScale()===0&&S.getLayer('').getTimeScale()===0,'Escape opens visible pause at '+speed+'x');
  const state=snapshot(),stored=p.saved.sceneScale,mode=V.get('WaveMode').getAsString();step(120,50);ok(snapshot()===state,'Enemies, attacks, projectiles, spawn timers, wave, abilities and Gold freeze at '+speed+'x');
  I.onKeyPressed(27);step(40);ok(!p.active,'One held Escape closes the menu once');I.onKeyReleased(27);step(2);
  ok(p.saved.sceneScale===stored&&S.getTimeManager().getTimeScale()===speed&&S.getLayer('').getTimeScale()===worldLayerScale&&V.get('WaveMode').getAsString()===mode,'Exact speed, layer and wave mode restored at '+speed+'x');
 }
 // Underlying UI clicks and hotkeys cannot buy or launch while paused.
 key(27);const before=n('Money'),towerCount=P.towers().length;object(S.__towerShopUI.cards[1].background);click(...targetSite);key(32);step(4);ok(n('Money')===before&&P.towers().length===towerCount&&S.__pauseUI.active,'Pause consumes shop, map and wave input');pauseButton('resume');ok(!S.__pauseUI.active&&n('Money')===before,'Resume click does not leak to underlying UI');
 V.get('IndexOpen').setBoolean(true);step(2);key(27);ok(!V.get('IndexOpen').getAsBoolean()&&!S.__pauseUI.active,'Index Escape closes Index without opening pause');
 S.__audio.ui.open=true;step(2);key(27);ok(!S.__audio.ui.open&&!S.__pauseUI.active,'Audio Escape closes audio without opening pause');
 V.get('IndexOpen').setBoolean(true);S.__audio.ui.open=true;step(2);ok(!S.__audio.ui.open&&V.get('IndexOpen').getAsBoolean(),'Existing Index modal excludes the audio panel');key(27);ok(!V.get('IndexOpen').getAsBoolean()&&!S.__pauseUI.active,'Escape closes the visible Index without opening Pause');
 const dev=S.__devCheats;if(dev?.enabled()){dev.toggle();step(2);key(27);ok(!dev.open&&!S.__pauseUI.active,'Developer panel owns Escape');dev.toggle();step(2);dev.askFresh();step(2);key(27);ok(dev.open&&!dev.confirming&&!S.__pauseUI.active,'Developer confirmation returns to its panel');key(27);}
 const field=document.createElement('input');document.body.appendChild(field);field.focus();key(27);ok(!S.__pauseUI.active,'Focused text input keeps Escape priority');field.remove();
 R.finished=true;step();key(27);ok(!S.__pauseUI.active,'Mission result rejects pause');R.finished=false;step();
 // Stop this fixture's wave without claiming a combat victory; isolate Fusion UI.
 for(const o of get('Enemy'))o.deleteFromScene();for(const o of get('StarCannonProjectile'))o.deleteFromScene();S.__waveManager.queue=[];S.__waveManager.index=0;V.get('EnemiesToSpawn').setNumber(0);V.get('WaveActive').setBoolean(false);V.get('WaveMode').setString('Waiting');
 for(const t of P.towers())t.deleteFromScene();step(3);V.get('Money').setNumber(150000);
 const recipe=G.__fusionArchive.definition('StarburstCannon').Variants[0].Recipe;
 const sites=[];
 for(const [j,source]of recipe.entries()){
  V.get('SelectedTower').setNumber(0);I.onMouseMove(0,0);step(3);let xy;P.refresh();for(let y=180;y<960&&!xy;y+=20)for(let x=j?1000:350;x<(j?1540:620);x+=20)if(P.validate(source.Type,x,y).valid){xy=[x,y];break;}
  ok(!!xy,'Native legal Fusion source site '+j);V.get('SelectedTower').setNumber(0);step(2);object(S.__towerShopUI.cards.find(c=>c.item.Type===source.Type).background);click(...xy);const tower=P.towers().find(o=>Math.hypot(...P.center(o).map((v,i)=>v-xy[i]))<1);ok(!!tower,'Native source purchase '+j);V.get('SelectedTower').setNumber(tower.getVariables().get('TowerId').getAsNumber());step(3);
  for(const [path,level]of [source.Path1,source.Path2].entries())for(let i=0;i<level;i++)object(S.__selectedPanel.cards[path].background);
  sites.push(tower);
 }
 const f=S.__fusion;V.get('SelectedTower').setNumber(sites[0].getVariables().get('TowerId').getAsNumber());step(3);object(S.__selectedPanel.fusionButton);ok(f.active&&f.stage==='partner'&&S.getTimeManager().getTimeScale()===.5,'Native Fusion starts Tactical 0.5x');
 const ids=sites.map(o=>o.getUniqueId()),gold=n('Money');key(27);ok(S.__pauseUI.active&&f.active&&f.stage==='partner','Escape pauses Fusion partner selection without cancellation');step(60);pauseButton('resume');ok(f.active&&f.a===sites[0]&&S.getTimeManager().getTimeScale()===.5&&n('Money')===gold,'Fusion partner and Tactical speed restore');
 click(...P.center(sites[1]));ok(f.stage==='placement','Native compatible partner enters regional placement');const result=f.result.id;
 key(27);ok(S.__pauseUI.active&&f.active&&f.stage==='placement','Escape pauses regional placement without consuming sources');step(60);key(27);ok(f.active&&f.stage==='placement'&&f.result.id===result&&S.getTimeManager().getTimeScale()===.5&&ids.every(id=>P.towers().some(o=>o.getUniqueId()===id))&&n('Money')===gold,'Regional Fusion placement restores exact sources, result, Gold and 0.5x');
 const left=P.center(sites[0]),right=P.center(sites[1]);ok(f.validate(...left).valid&&f.validate((left[0]+right[0])/2,(left[1]+right[1])/2).reason==='region','Fusion source region validity survives pause');
 const fusionInput=document.createElement('input');document.body.appendChild(fusionInput);fusionInput.focus();key(27);ok(f.active&&f.stage==='placement'&&!S.__pauseUI.active,'Focused text Escape neither cancels Fusion nor opens Pause');fusionInput.remove();
 key(27);pauseButton('chapters');ok(S.__pauseUI.confirming&&S.__pauseUI.active,'Return asks about loss of current match');key(27);ok(S.__pauseUI.active&&!S.__pauseUI.confirming,'Escape dismisses confirmation to Stay');pauseButton('chapters');pauseButton('stay');ok(S.__pauseUI.active&&!S.__pauseUI.confirming,'Stay keeps the match paused');
 const old=S,save=JSON.stringify(C.save),archive=localStorage.getItem(G.__fusionArchive.storageKey),audio=JSON.stringify(G.__celestialAudioSettings);pauseButton('chapters');pauseButton('return');await enter('Levels');
 ok(old.__pauseUI.disposed&&old.__pauseUI.texturesReleased&&old.__environmentLibrary.disposed&&old.__fusion.disposed&&old.__campaignRun.disposed,'Leaving disposes pause text textures, environment, Fusion and campaign owners');
 ok(JSON.stringify(C.save)===save&&localStorage.getItem(G.__fusionArchive.storageKey)===archive&&Object.entries(JSON.parse(audio)).every(([k,v])=>G.__celestialAudioSettings[k]===v),'Chapter return preserves permanent progression, discoveries and audio settings');
 ok(S.__levelsUI.chapter===1&&S.__levelsUI.selected==='1-1','Existing Chapter Selection restores the selected mission');button(S.__levelsUI.launch);await enter('Game Scene');
 ok(!S.getObjects('Enemy').length&&!S.getObjects('StarCannonTower').length&&!S.getObjects('StarCannonProjectile').length&&S.getTimeManager().getTimeScale()===1&&!S.__pauseUI.active,'New match starts clean at normal speed without duplicate gameplay instances');
 if(globalThis.BALANCE_MODE==='visual'){key(27);await wait(180);step(2);ok(S.__pauseUI.active&&S.__pauseUI.root.visible,'Pause reopens in a fresh match');console.log('BALANCE PROGRESS '+JSON.stringify({pause:S.__pauseUI.active,alpha:S.__pauseUI.root.alpha,layer:S.getLayer('GameOverUI').isVisible(),width:G.getGameResolutionWidth(),buttons:S.__pauseUI.buttons.map(b=>({id:b.id,rect:b.rect}))}));}
 return {passed:true,count:checks.length,checks,fixture:'Finite Gold and saved unlock fixtures; real native movement/projectiles/shop/upgrades/Fusion/UI handlers. No natural-combat victory claimed.'};
})()
