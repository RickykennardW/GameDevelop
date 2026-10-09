(async()=>{
 const game=testGame,S=game.getSceneStack().getCurrentScene(),V=S.getVariables(),A=S.__audio,manager=S.getSoundManager(),checks=[],wait=ms=>new Promise(r=>setTimeout(r,ms));const ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
 const until=async fn=>{const start=performance.now();while(!fn()&&performance.now()-start<10000)await wait(30);ok(fn(),'bounded native readiness');};
 await until(()=>A.unlocked&&A.music.some(s=>s.started));await wait(3200);
 // Isolate buffer-loop verification from the automatic state selector only.
 // Native sound manager and the production fade update continue unchanged.
 const originalAfter=A.after;A.after=()=>{A.install();A.updateMusic(A.dt||.016667);A.draw();};
 const loops=[];
 for(const id of Object.keys(A.config.Music)){
  A.requestMusic(id);await until(()=>A.music.some(s=>s.id===id&&s.started));await wait(3250);
  const slot=A.music.find(s=>s.id===id),count=A.stats.bgmStarts[id];slot.sound.setSeek(A.config.Music[id].Duration-.065);await wait(170);
  const seek=slot.sound.getSeek();ok(slot.sound.playing()&&seek>=0&&seek<.8&&A.stats.bgmStarts[id]===count,'actual decoded buffer wraps without new BGM '+id);loops.push({id,seekAfterBoundary:seek,starts:count});
 }
 // Rapid state changes finish their fade, then honor the latest request.
 A.requestMusic('AncientGalaxyAmbience');await wait(100);A.requestMusic('CosmicDefense');A.requestMusic('SacredVoidTemple');
 await wait(6600);ok(A.music.filter(s=>s.started).length<=2,'rapid state changes never create third BGM');
 A.after=originalAfter;
 // The automatic flow still controls music on the next game frame.
 game.pause(true);const star=S.__starCannon,p=S.__freePlacement;V.get('Money').setNumber(100000);
 const step=(n=1)=>{for(let i=0;i<n;i++){S.renderAndStep(16.667);game.getInputManager().onFrameEnded();}},tower=S.createObject('StarCannonTower'),tv=tower.getVariables();p.positionSprite(tower,'StarCannonTower',300,352);tv.get('FootprintX').setNumber(300);tv.get('FootprintY').setNumber(352);tv.get('FootprintRadius').setNumber(46);tv.get('TowerId').setNumber(999876);step(2);tower.__starCooldown=100000;
 for(let i=0;i<2;i++)star.upgrade(tower,1);for(let i=0;i<4;i++)star.upgrade(tower,2);
 const enemy=S.createObject('Enemy');S.__novaWisp.ensure(enemy);enemy.setPosition(400-24,352-24);enemy.getVariables().get('MoveSpeed').setNumber(0);step(2);tower.__starFacing=star.bearing(tower,enemy);const fire=A.stats.requested.StarCannonFire||0,impact=A.stats.requested.ProjectileImpact||0;
 ok(star.fire(tower,enemy),'three-shot native Meteor volley fires');ok(S.getObjects('StarCannonProjectile').length===3&&(A.stats.requested.StarCannonFire||0)===fire+1&&(A.stats.requested.ProjectileImpact||0)===impact,'one audio discharge for3projectiles /zero muzzle impacts');step(60);ok((A.stats.requested.ProjectileImpact||0)>impact,'true impacts play afterward');
 enemy.deleteFromScene();step(3);V.get('SelectedTower').setNumber(tv.get('TowerId').getAsNumber());step(3);ok((A.stats.requested.TowerSelect||0)>0,'native tower selection feedback');
 const sell=A.stats.requested.TowerSell||0,before=V.get('Money').getAsNumber(),expected=tower.getVariables().get('SellValue').getAsNumber(),input=game.getInputManager(),xy=S.getLayer('SelectedTowerUI').convertInverseCoords(160,638,0,[0,0]);input.onMouseMove(...xy);input.onMouseButtonPressed(0);step(3);input.onMouseButtonReleased(0);step(3);
 ok(!S.getObjects('StarCannonTower').includes(tower)&&(A.stats.requested.TowerSell||0)===sell+1&&V.get('Money').getAsNumber()===before+expected,'actual Sell event emits one SFX /refund unchanged');
 A.setSetting('MuteSFX',true);const played=A.stats.played.UIClick||0;ok(!A.play('UIClick')&&(A.stats.played.UIClick||0)===played,'MuteSFX suppresses UI and combat');A.setSetting('MuteSFX',false);
 const hooks=A.hooks.length,objects=Object.keys(A.objects).length;step(500);ok(A.hooks.length===hooks&&Object.keys(A.objects).length===objects,'no per-frame callback/widget allocation');
 const bases=A.stats.baseEvents;V.get('Lives').setNumber(2);step();ok(A.stats.baseEvents===bases,'changing Lives without an actual leaked enemy has no damage sound');
 A.setSetting('Master',73);A.setSetting('Music',21);A.setSetting('SFX',62);A.setSetting('UI',42);A.setSetting('MuteMusic',true);A.persist();
 const saved={...A.settings};A.dispose();ok(A.music.every(s=>!s.started)&&A.voices.every(v=>!v.sound||!v.sound.isLoaded()||v.sound.stopped()),'dispose stops channels /unloads owned buffers');
 return{checks,loops,hooks,widgets:objects,stats:A.stats,saved,reloadExpected:true};
})()
