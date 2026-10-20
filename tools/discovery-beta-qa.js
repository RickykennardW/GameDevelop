(async()=>{
 const game=testGame,S=game.getSceneStack().getCurrentScene(),V=S.getVariables(),D=S.__monsterDiscovery,I=game.getInputManager(),checks=[],mode=globalThis.BALANCE_MODE||'full';
 const ok=(value,label)=>{if(!value)throw Error(label);checks.push(label);},step=(n=1)=>{for(let i=0;i<n;i++){S.renderAndStep(16.667);I.onFrameEnded();}};
 game.pause(true);step(3);
 const spawn=ids=>{V.get('IndexOpen').setBoolean(false);V.get('Wave').setNumber(1);V.get('WaveActive').setBoolean(true);V.get('WaveMode').setString('Manual');const wave=S.__waveManager;wave.queue=ids.slice();wave.index=0;wave.elapsed=V.get('SpawnInterval').getAsNumber()*ids.length;V.get('EnemiesToSpawn').setNumber(ids.length);step();};
 const open=()=>{V.get('IndexOpen').setBoolean(true);S.__unitIndex.category='Monsters';step(3);};
 ok(D.scope==='session'&&D.found.size===0,'fresh RuntimeGame starts all six types undiscovered');
 const resourceHashes=game.getGameData().resources.resources.length,observed=[];
 open();
 for(let i=0;i<D.ids.length;i++){
  const id=D.ids[i],meta=D.portraits[id],texture=D.texture(id),object=S.__unitIndex.cards[i].sprite,sprite=object.__archivePortrait?.sprite||(object.__golemPortraitRig?.visible?object.__golemPortraitRig:object.getRendererObject());
  ok(meta.Animation.endsWith('Idle_Down'),'existing front/down Idle chosen for '+id);
  ok(sprite.texture===texture,'Index shares canonical single-frame portrait '+id);
  ok(sprite.tint===0,'locked portrait remains a solid black silhouette '+id);
  if(meta.Frame)ok(texture.frame.width===meta.Frame[2]&&texture.frame.height===meta.Frame[3]&&texture.frame.width<texture.baseTexture.width,'atlas restricted to exactly one native frame '+id);
  else ok(texture===game.getImageManager().getPIXITexture(meta.Image),'individual PNG reused directly '+id);
  const [x,y,w,h]=meta.VisualBounds,box=object.__discoveryPortrait;
  ok(Math.abs(sprite.scale.x-sprite.scale.y)<1e-7&&w*sprite.scale.x<=box.w+.01&&h*sprite.scale.y<=box.h+.01,'visual bounding box fits portrait /aspect ratio preserved '+id);
  ok(Math.abs(sprite.position.x+(x+w/2-sprite.anchor.x*texture.width)*sprite.scale.x-box.x)<.01&&Math.abs(sprite.position.y+(y+h/2-sprite.anchor.y*texture.height)*sprite.scale.y-box.y)<.01,'visual monster center matches Index container '+id);
  observed.push({id,animation:meta.Animation,frame:meta.Frame||'individual PNG',textureSize:[texture.width,texture.height],visualBounds:meta.VisualBounds});
 }
 ok(D.texture('VoidHound').width===384&&D.texture('VoidHound').height===255,'Void Hound is one384x255 idle cell /not1536x1024 atlas');
 ok(D.texture('VoidGuard')===game.getImageManager().getPIXITexture(D.portraits.VoidGuard.Image)&&D.portraits.VoidGuard.Image.endsWith('/Idle_Down_0.png'),'Void Guard uses existing individual Idle_Down_0 /not Move_Up');
 if(mode==='locked')return{checks,observed,scope:D.scope};
 const choice=mode==='hound'?'VoidHound':mode==='guard'?'VoidGuard':'Basic';spawn([choice]);step(76);
 ok(D.icon.texture===D.texture(choice)&&D.nameText.text===D.types[choice].Name,'notification uses same single-frame portrait/name as Index');
 ok(D.icon.tint===0xffffff&&D.nameText.alpha===1,'original reveal animation completes');
 ok(Math.abs(D.icon.scale.x-D.icon.scale.y)<1e-7,'notification portrait never stretched');
 const b=D.portraits[choice].VisualBounds;ok(Math.abs(D.icon.anchor.x*D.icon.texture.width-(b[0]+b[2]/2))<.01&&Math.abs(D.icon.anchor.y*D.icon.texture.height-(b[1]+b[3]/2))<.01,'notification centers the actual visible monster body');
 if(mode==='hound'||mode==='guard')return{checks,observed,scope:D.scope,shown:D.active,stats:D.stats};
 // A new Game object must ignore old save data; only audio/preferences stay durable.
 spawn(['VoidHound']);spawn(['Basic','VoidHound']);ok(D.stats.unlocks===2&&D.stats.shown===1&&D.queue.length===1,'same kind once per session /queue design unchanged');
 open();V.get('IndexOpen').setBoolean(false);step();open();ok(D.found.size===2,'Index open/close never resets discovery');
 V.get('Wave').setNumber(2);V.get('WaveMode').setString('ManualFast');step(4);V.get('WaveMode').setString('Manual');step();ok(D.found.size===2,'wave and1x/2x changes do not reset discovery');
 const session=D.session,shown=D.stats.shown,activeAge=D.active.age;
 const next=game.getSceneStack().replace(S.getName());ok(!!next&&next!==S,'actual native ordinary scene replacement succeeds');
 next.renderAndStep(16.667);I.onFrameEnded();const N=next.__monsterDiscovery;
 ok(D.disposed&&D.root.destroyed&&D.ownedTextures.size===0,'old scene releases owned portrait crops /shared images survive');
 ok(N.session===session&&N.has('Basic')&&N.has('VoidHound'),'ordinary scene reload keeps runtime discovery session');
 ok(N.active?.id==='Basic'&&N.active.age>=activeAge&&N.queue.join()==='VoidHound'&&N.stats.shown===shown,'ordinary scene reload preserves active/queued notifications without duplicate sound');
 N.resetForNewGame();next.renderAndStep(16.667);I.onFrameEnded();
 ok(N.found.size===0&&!N.active&&!N.queue.length&&!N.root.visible,'explicit New Game reset clears discovery and pending notifications');
 const nv=next.getVariables(),nw=next.__waveManager;nv.get('Wave').setNumber(1);nv.get('WaveActive').setBoolean(true);nv.get('WaveMode').setString('Manual');nw.queue=['Basic'];nw.index=0;nw.elapsed=nv.get('SpawnInterval').getAsNumber();nv.get('EnemiesToSpawn').setNumber(1);next.renderAndStep(16.667);I.onFrameEnded();
 ok(N.has('Basic')&&N.stats.unlocks===1&&N.stats.shown===1,'first encounter announces again after explicit New Game');
 ok(game.getGameData().resources.resources.length===resourceHashes,'no new image resources or gameplay asset replacements');
 next.__audio.setSetting('Master',73);next.__audio.persist();
 localStorage.setItem('celestialVoidMonsterDiscovery.v1',JSON.stringify({version:1,discovered:Object.fromEntries(N.ids.map(id=>[id,true]))}));
 localStorage.setItem('celestialVoidBetaUnrelatedCheck','preserve');
 return{checks,observed,scope:N.scope,sessionFound:[...N.found],sessionAudioSettings:{...next.__audio.settings},note:'Legacy discovery is deliberately seeded for the real browser close/relaunch check; no user profile is used.'};
})()
