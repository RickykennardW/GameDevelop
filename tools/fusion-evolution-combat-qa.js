// Isolated native Health, projectile and tier tests. Fixture enemies stay still.
(async()=>{
 const game=testGame,scene=game.getSceneStack().getCurrentScene(),v=scene.getVariables(),input=game.getInputManager();
 game.pause(true);
 const step=(n=1)=>{for(let i=0;i<n;i++){scene.renderAndStep(16.667);input.onFrameEnded();}};
 step(4);
 const p=scene.__freePlacement,f=scene.__fusion,ev=scene.__fusionEvolution,nb=scene.__nebulaBloom,star=scene.__starCannon;
 const checks=[],audio=scene.__audio;
 const ok=(x,m)=>{if(!x)throw Error(m);checks.push(m);};
 const near=(a,b)=>Math.abs(a-b)<.04;
 const at=(x,y)=>[x,y];
 const value=(o,k)=>o.getVariables().get(k).getAsNumber();
 const hp=e=>e.getBehavior('Health').Health();
 const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const until=(predicate,message,max=450)=>{for(let i=0;i<max&&!predicate();i++)step();if(!predicate())throw Error(message);};
 const after=seconds=>step(Math.ceil(seconds/.016667));
 const click=o=>{
  const layer=scene.getLayer(o.getLayer());input.onMouseMove(...layer.convertInverseCoords(o.getCenterXInScene(),o.getCenterYInScene(),0,[0,0]));
  step(2);input.onMouseButtonPressed(0);step(2);input.onMouseButtonReleased(0);step(3);
 };
 const select=t=>{v.get('SelectedTower').setNumber(t?value(t,'TowerId'):0);step(2);};
 const enemies=()=>scene.getObjects('Enemy');
 const makeEnemy=(x,y,health=100000,armor=0)=>{
  const o=scene.createObject('Enemy'),vars=o.getVariables(),h=o.getBehavior('Health');
  vars.get('EnemyType').setString(armor?'VoidGuard':'Basic');o.setAnimationName('NovaIdle_Right');o.setWidth(48);o.setHeight(48);o.setPosition(x-24,y-24);
  scene.__novaWisp.ensure(o);vars.get('MoveSpeed').setNumber(0);vars.get('GoldReward').setNumber(0);
  h.SetMaxHealth(health);h.SetHealth(health);h.SetFlatDamageReduction(armor);h.SetPercentDamageReduction(0);
  return o;
 };
 const clearCombat=()=>{enemies().slice().forEach(e=>e.deleteFromScene());ev.clearTransients();step(2);};
 const stop=state=>{state.cooldown=10000;state.windup=null;};
 const fire=state=>{state.cooldown=0;state.windup=null;};
 const makeSource=(part,x,y)=>{
  const tower=scene.createObject(part.Type),vars=tower.getVariables();
  for(const [name,n] of Object.entries({TowerId:100000+tower.getUniqueId(),FootprintX:x,FootprintY:y,FootprintRadius:p.config(part.Type).Radius,
    Path1Level:part.Path1,Path2Level:part.Path2,PurchasePrice:10000,TotalInvestment:10000,DamageDealt:0}))vars.get(name).setNumber(n);
  (part.Type==='StarCannonTower'?star:nb).apply(tower);
  return tower;
 };
 const fuse=id=>{
  select(null);clearCombat();v.get('Money').setNumber(100000);
  const parts=game.__fusionArchive.definition(id).Variants[0].Recipe;
  const output=id==='StarburstCannon'?'StarCannonTower':id;
  let site;
  p.refresh();
  for(let x=280;x<620&&!site;x+=12)if(p.validate(output,x,352,{cost:0}).valid)site=[x,352];
  if(!site)throw Error('No regional anchor');
  const a=makeSource(parts[0],...site),b=makeSource(parts[1],900,352);
  step(2);
  if(!(f.begin(a)&&f.choose(b)))throw Error('Cannot begin '+id);
  const tower=f.confirm(...site);
  if(!tower)throw Error('Cannot confirm '+id+' '+f.error);
  step(3);return tower;
 };
 const upgrade=(tower,tier)=>{
  select(tower);
  const state=ev.rigs.get(tower.getUniqueId()),oldArt=state?.art,oldRig=state?.root,uid=tower.getUniqueId();
  const anchor=p.center(tower),radius=p.radius(tower),damage=value(tower,'DamageDealt'),cash=v.get('Money').getAsNumber();
  const stats=ev.stats(ev.type(tower),tier),card=scene.__selectedPanel.evolutionCard;
  ok(card?.next===tier&&card.cost===stats.Cost,'Native panel offers E'+tier+' / '+stats.Name);
  if(tier===2){
   v.get('Money').setNumber(stats.Cost-1);click(card.background);
   ok(ev.tier(tower)===tier-1&&v.get('Money').getAsNumber()===stats.Cost-1,'Insufficient upgrade Gold leaves the tier intact');
   v.get('Money').setNumber(cash);
  }
  click(card.background);
  ok(ev.tier(tower)===tier&&tower.getUniqueId()===uid&&p.radius(tower)===radius&&p.center(tower).every((n,i)=>near(n,anchor[i]))&&
     value(tower,'DamageDealt')===damage&&v.get('Money').getAsNumber()===cash-stats.Cost,'Paid tier preserves identity, anchor and Damage Dealt');
  ok(value(tower,'Damage')===stats.Damage&&value(tower,'AttackInterval')===stats.AttackInterval&&value(tower,'AttackRange')===stats.AttackRange,'Native tower stats match the configured tier');
  if(state)ok(state.root===oldRig&&state.art!==oldArt&&state.turret.texture.valid,'Tier swaps the authored art in place');
  if(tier===3)ok(!scene.__selectedPanel.evolutionCard&&!ev.upgrade(tower),'E3 caps the single evolution path');
  return stats;
 };
 const retire=tower=>{ok(value(tower,'DamageDealt')>0,ev.type(tower)+' credits real combat damage to its owner');clearCombat();select(tower);const cash=v.get('Money').getAsNumber(),sell=value(tower,'SellValue');click(scene.__selectedPanel.objects.sell);ok(!p.towers().includes(tower)&&v.get('Money').getAsNumber()===cash+sell,'Upgraded Evolution sells once at the configured refund');};
 const firstShot=(state,stopAfter=true)=>{
  const shots=ev.metrics.shots;
  until(()=>ev.metrics.shots>shots,state.id+' did not target/fire');
  const shot=ev.projectiles.find(s=>s.ownerId===state.uid);
  ok(!!shot&&state.motion.startsWith('Fire_M')&&shot.sprite.texture.valid&&state.pedestal.rotation===0,'Actual animated launch / stationary base '+state.id);
  const muzzle=Number(state.motion.slice(6))-1,start=ev.muzzle(state,muzzle,state.motion);
  ok(start.every((n,i)=>near(n,shot.start[i]))&&near(shot.x,start[0])&&near(shot.y,start[1]),'Visible shot starts at the authored rotated muzzle '+state.id);
  if(stopAfter)stop(state);
  return shot;
 };
 const waitHit=shot=>until(()=>!ev.projectiles.includes(shot),shot.name+' did not reach impact');
 const progress=name=>console.log('BALANCE PROGRESS '+name+' combat passed');
 await sleep(180);
 ok(audio.unlocked,'Trusted browser gesture unlocked the native audio manager');

 // The old Starburst E1 adapter still uses the original bolt and splash. Its
 // optional purchased tiers reuse that adapter, pose and stationary pedestal.
 let tower=fuse('StarburstCannon'),[x,y]=p.center(tower);
 ok(value(tower,'Damage')===90&&value(tower,'AttackInterval')===.4&&value(tower,'AttackRange')===227,'Starburst E1 remains at its established combat values');
 upgrade(tower,2);const starE3=upgrade(tower,3),starTarget=makeEnemy(x+135,y);
 until(()=>hp(starTarget)<100000,'Upgraded Starburst did not hit');tower.__starCooldown=1e6;
 ok(near(hp(starTarget),100000-starE3.Damage)&&near(value(tower,'DamageDealt'),starE3.Damage),'Starburst E3 hits through the original projectile and accounting');
 retire(tower);progress('Starburst');

 tower=fuse('VenomCataclysm');let state=ev.rigs.get(tower.getUniqueId());[x,y]=p.center(tower);
 let target=makeEnemy(x+155,y,100000,7),nearby=makeEnemy(x+155,y+42),outside=makeEnemy(x+155,y+112);
 let shot=firstShot(state);
 step(4);
 ok(shot.flight>0&&shot.y<shot.start[1]&&shot.x>shot.start[0],'Venom pod visibly travels along a mortar arc');
 waitHit(shot);
 let zone=ev.zones[0],mark=nb.poisons.get(target.getUniqueId());
 const actualArmor=target.getBehavior('Health').FlatDamageReduction();
 ok(zone?.radius===62&&actualArmor>0&&near(hp(target),100000-155+actualArmor)&&near(hp(nearby),100000-155)&&hp(outside)===100000,
    'Venom E1 impacts one AoE and leaves its configured poison zone / '+[zone?.radius,hp(target),hp(nearby),hp(outside),actualArmor]);
 ok(mark?.owner===tower&&mark.icon.getAnimationName()==='VenomCataclysm'&&scene.__enemyStatusIcons.owners.get(target.getUniqueId()).icons.size===1,'One native status icon follows the target');
 const weaker=nb.stats(1,0),beforeTick=hp(target),damageBefore=value(tower,'DamageDealt');
 ok(!nb.poison(target,weaker,null,0)&&nb.poisons.get(target.getUniqueId())===mark,'Shared Nebula status rejects a weaker overlapping poison');
 until(()=>hp(target)<beforeTick,'Shared poison clock did not tick');
 ok(near(beforeTick-hp(target),22-actualArmor)&&value(tower,'DamageDealt')>damageBefore,'Poison ticks once through armor and credits the Evolution');
 clearCombat();const venom2=upgrade(tower,2);target=makeEnemy(x+154,y);fire(state);shot=firstShot(state);waitHit(shot);zone=ev.zones[0];
 ok(zone.radius===venom2.ZoneRadius&&near(zone.expires-zone.born,venom2.ZoneDuration),'Venom E2 expands radius and duration');
 clearCombat();const venom3=upgrade(tower,3);target=makeEnemy(x+156,y);fire(state);shot=firstShot(state);waitHit(shot);zone=ev.zones[0];
 after(venom3.ZoneDuration-.22);
 const late=makeEnemy(zone.x,zone.y+25),far=makeEnemy(zone.x,zone.y+zone.radius+6),collapsed=ev.metrics.collapses;
 until(()=>ev.metrics.collapses>collapsed,'Toxic Collapse did not fire');
 ok(hp(late)===100000-venom3.CollapseDamage&&hp(far)===100000&&ev.effects.some(e=>e.name==='ToxicCollapse'),'Venom E3 collapse damages only enemies in the naturally expiring zone');
 after(.4);ok(ev.metrics.collapses===collapsed+1&&!ev.zones.length,'Collapse resolves exactly once and clears its zone');
 retire(tower);progress('Venom Cataclysm');

 tower=fuse('PlaguebreakerCannon');state=ev.rigs.get(tower.getUniqueId());[x,y]=p.center(tower);
 nearby=makeEnemy(x+90,y,750);target=makeEnemy(x+155,y);
 shot=firstShot(state);ok(shot.target===target,'Plaguebreaker targets the strongest enemy in range');waitHit(shot);
 ok(hp(target)===100000-148&&nb.poisons.has(target.getUniqueId())&&hp(nearby)===750,'E1 heavy bolt hits directly and infuses one poison');
 clearCombat();const plague2=upgrade(tower,2);target=makeEnemy(x+150,y);nb.poison(target,nb.stats(1,0),null,0);fire(state);shot=firstShot(state);waitHit(shot);
 ok(near(100000-hp(target),plague2.Damage*(1+plague2.PoisonedBonus)),'E2 applies its bonus to an existing shared poison');
 clearCombat();const plague3=upgrade(tower,3);target=makeEnemy(x+150,y);nearby=makeEnemy(x+150,y+37,50000);
 nb.poison(target,nb.stats(1,0),null,0);state.salvo=plague3.DetonateEvery-1;fire(state);shot=firstShot(state);
 ok(shot.name==='VenomDetonationShot','The fourth Plaguebreaker shot uses the dedicated special projectile');
 waitHit(shot);
 ok(ev.metrics.detonations===1&&!nb.poisons.has(target.getUniqueId())&&hp(nearby)<50000&&ev.effects.some(e=>e.name==='VenomDetonation'),'E3 consumes the target mark once and damages the nearby enemy');
 retire(tower);progress('Plaguebreaker Cannon');

 tower=fuse('SupernovaObliterator');state=ev.rigs.get(tower.getUniqueId());[x,y]=p.center(tower);
 target=makeEnemy(x+126,y);nearby=makeEnemy(x+126,y+60);outside=makeEnemy(x+126,y+99);shot=firstShot(state);waitHit(shot);
 ok(hp(target)===100000-215&&hp(nearby)===100000-215&&hp(outside)===100000&&ev.effects.some(e=>e.name==='LargeCelestialExplosion'),'Supernova E1 uses a bounded primary area and impact animation');
 clearCombat();const nova2=upgrade(tower,2);target=makeEnemy(x+130,y);nearby=makeEnemy(x+130,y+106);fire(state);shot=firstShot(state);waitHit(shot);
 ok(hp(target)===100000-nova2.Damage&&hp(nearby)===100000,'E2 secondary damage waits until the shockwave');
 const shocks=ev.metrics.shocks;until(()=>ev.metrics.shocks>shocks,'Supernova did not release its secondary shockwave');
 ok(hp(target)===100000-nova2.Damage&&hp(nearby)===100000-nova2.ShockDamage,'Secondary shockwave excludes enemies already hit');
 clearCombat();const nova3=upgrade(tower,3);target=makeEnemy(x+130,y);nearby=makeEnemy(x+130,y+141);outside=makeEnemy(x+130,y+278);
 fire(state);shot=firstShot(state);waitHit(shot);until(()=>ev.metrics.chains===2,'Supernova did not chain into two groups');
 ok(hp(target)===100000-nova3.Damage&&hp(nearby)===100000-nova3.ChainDamage&&hp(outside)===100000-nova3.ChainDamage,'E3 chain hits up to two new groups once each');
 fire(state);shot=firstShot(state);waitHit(shot);after(.8);
 ok(ev.metrics.chains===2&&state.nextSpecial>ev.time,'Chain obeys the configured cooldown');
 retire(tower);progress('Supernova Obliterator');

 tower=fuse('ToxicConstellation');state=ev.rigs.get(tower.getUniqueId());[x,y]=p.center(tower);
 target=makeEnemy(x+150,y);shot=firstShot(state);waitHit(shot);
 ok(state.nextMuzzle===1&&ev.zones.length===1&&hp(target)===100000-33,'Toxic E1 alternates muzzle and creates a small zone');
 fire(state);shot=firstShot(state);waitHit(shot);
 ok(state.nextMuzzle===0&&ev.zones.length===2,'E1 uses two authored muzzle positions');
 clearCombat();const toxic2=upgrade(tower,2);target=makeEnemy(x+145,y);const zoneCount=ev.metrics.zones;fire(state);
 until(()=>ev.metrics.zones>=zoneCount+7,'Toxic E2 rapid fire did not produce seven impacts');stop(state);
 ok(state.art.muzzles.length===3&&ev.zones.length===toxic2.ZoneLimit,'E2 uses three muzzles and evicts oldest zones at the cap');
 clearCombat();const toxic3=upgrade(tower,3);target=makeEnemy(x+140,y);fire(state);shot=firstShot(state);waitHit(shot);
 target.setPosition(x+800,y+200);nearby=makeEnemy(x+140,y+59);fire(state);shot=firstShot(state);waitHit(shot);
 ok(ev.links.size===1&&ev.metrics.links===1,'E3 connects two distinct nearby zones exactly once');
 const overlap=makeEnemy(x+140,y+29);until(()=>nb.poisons.has(overlap.getUniqueId()),'Toxic Network did not apply shared poison');
 mark=nb.poisons.get(overlap.getUniqueId());
 ok(near(mark.damage,toxic3.PoisonDamage*(1+toxic3.LinkBonus))&&scene.__enemyStatusIcons.owners.get(overlap.getUniqueId()).icons.size===1,'Linked zone synergy still yields only one poison status');
 until(()=>hp(overlap)<100000,'Network poison did not tick');
 ok(near(100000-hp(overlap),mark.damage),'Overlapping network zones apply one tick per interval');
 retire(tower);progress('Toxic Constellation');

 tower=fuse('MeteorStormArray');state=ev.rigs.get(tower.getUniqueId());[x,y]=p.center(tower);
 target=makeEnemy(x+155,y);nearby=makeEnemy(x+155,y+22);outside=makeEnemy(x+155,y+75);
 const initial=ev.metrics.shots;shot=firstShot(state);waitHit(shot);after(.56);
 ok(ev.metrics.shots-initial===3&&hp(target)===100000-3*44&&hp(nearby)===100000-3*44&&hp(outside)===100000,'Meteor E1 sends exactly three staggered shots with small splash');
 clearCombat();const meteor2=upgrade(tower,2);target=makeEnemy(x+151,y);nearby=makeEnemy(x+151,y+90);outside=makeEnemy(x+151,y-85);
 state.salvo=meteor2.ClusterEvery-1;fire(state);shot=firstShot(state);after(1.05);
 ok(ev.metrics.fragments===meteor2.FragmentLimit&&hp(nearby)===100000-meteor2.FragmentDamage&&hp(outside)===100000-meteor2.FragmentDamage,'Cluster creates two fragments which hit distinct secondary enemies once');
 clearCombat();const meteor3=upgrade(tower,3);after(meteor3.RainCooldown+.1);target=makeEnemy(x+150,y);fire(state);shot=firstShot(state);after(2);
 ok(ev.metrics.rainDrops===meteor3.RainCount&&state.nextSpecial>ev.time&&hp(target)<100000-3*meteor3.Damage,'Meteor Rain emits six damaging drops over the target area then waits for cooldown');
 retire(tower);progress('Meteor Storm Array');

 for(const [id,style] of Object.entries(ev.art.towers))ok(Object.values(style.sound).some(key=>audio.stats.played[key]>0),id+' routed through the native SFX mixer');
 const played=Object.fromEntries(Object.entries(audio.stats.played).filter(([key])=>key.startsWith('Fusion_')));
 ok(audio.stats.maxVoices<=audio.voices.length&&!ev.rigs.size&&!ev.projectiles.length&&!ev.effects.length&&!ev.zones.length&&!ev.scheduled.length&&!ev.links.size&&!nb.poisons.size,'All combat objects drain and audio stays within the existing voice budget');
 audio.setSetting('MuteMusic',true);
 audio.setSetting('SFX',30);
 const peaks={};
 const monitor=Howler.ctx.createAnalyser(),samples=new Float32Array(monitor.fftSize);
 Howler.masterGain.connect(monitor);
 try{
  for(const [id,style] of Object.entries(ev.art.towers)){
   const [cue,key]=Object.entries(style.sound).find(([name,key])=>played[key]);
   const def=audio.config.SFX[key];
   const prepared=scene.getSoundManager().createHowlerSound(def.File,false,0,false,1);
   for(let tries=0;tries<40&&!prepared.isLoaded();tries++)await sleep(25);
   ok(prepared.isLoaded(),id+' browser decodes the registered audio resource');
   for(const voice of audio.voices){voice.sound?.stop();voice.end=0;}
   after(.85);
   ok(ev.sound(id,cue),id+' uses a native sound channel');
   const voice=audio.voices.find(voice=>voice.key===key&&voice.end>audio.now);
   ok(voice?.sound&&Math.abs(voice.sound.getVolume()-def.Gain*.3)<.001,id+' obeys the 30% SFX slider');
   let peak=0;
   for(let i=0;i<10;i++){
    await sleep(13);monitor.getFloatTimeDomainData(samples);
    peak=Math.max(peak,samples.reduce((max,n)=>Math.max(max,Math.abs(n)),0));
   }
   ok(peak>.001,id+' produces a non-silent Web Audio signal');
   peaks[id]=peak;
  }
  audio.setSetting('MuteSFX',true);
  ok(!ev.sound('MeteorStormArray','meteor_seed_a')&&audio.voices.every(voice=>voice.end===0),'Mute SFX suppresses Evolution cues and stops active voices');
 }finally{Howler.masterGain.disconnect(monitor);monitor.disconnect();}
 return {checks,played,peaks,metrics:ev.metrics,poisonTicks:nb.metrics.poisonTicks,maxAudioVoices:audio.stats.maxVoices};
})()
