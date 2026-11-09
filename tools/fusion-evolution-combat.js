// Combat runs on the same scaled clock and native Health adapter as Nebula Bloom.
const scene = runtimeScene, ev = scene.__fusionEvolution, nb = scene.__nebulaBloom;
if (!ev || !nb || ev.tick) return;
const {rules, art} = ev;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi,n));
const point = enemy => [enemy.getCenterXInScene(),enemy.getCenterYInScene()];
const range = (x,y,a,b) => Math.hypot(x-a,y-b);
const owner = shot => ev.rigs.get(shot.ownerId)?.tower === shot.owner ? shot.owner : null;
const hit = (shot, enemy, damage) => scene.__starCannon.deal(owner(shot),enemy,damage,true);
const presentation = {
 venom:{charge:'flower_core_charge', chargeFx:'FlowerCorePulse', fire:['petal_launch'], release:'seed_release', flight:'seed_flight',
        flash:'SeedPodLaunch', expire:'SeedExpiration'},
 plague:{charge:'stellar_charge', chargeFx:'StellarCharge', fire:['stellar_lance_fire'], release:'lance_release', flight:'plaguebolt_flight',
         flash:'MuzzleFlash', expire:'BoltExpiration'},
 supernova:{charge:'reactor_bloom_charge', chargeFx:'SupernovaCharge', fire:['supernova_discharge'], release:'stellar_core_release', flight:'compressed_core_flight',
            flash:'MuzzleRelease', expire:'CosmicDissipation'},
 toxic:{charge:'constellation_charge', fire:['toxic_shard_a','toxic_shard_b'], release:'light_seed_release', flight:'constellation_seed_flight',
        flash:'RapidSeedLaunch', expire:'ShardExpiration'},
 meteor:{charge:'meteor_reactor_charge', fire:['meteor_seed_a','meteor_seed_b','meteor_seed_c'], release:'meteor_seed_release', flight:'meteor_flight',
         flash:'RapidMeteorSeedLaunch', expire:'MeteorExpiration'},
};

function schedule(delay, run) {
 if (ev.scheduled.length >= rules.MaxScheduled) return false;
 ev.scheduled.push({at:ev.time+delay,run});
 ev.metrics.peakScheduled = Math.max(ev.metrics.peakScheduled,ev.scheduled.length);
 return true;
}

function area(shot, enemies, x, y, radius, damage, ledger = null) {
 for (const enemy of enemies) {
  const uid = enemy.getUniqueId();
  if (ledger?.has(uid) || !nb.alive(enemy) || range(x,y,...point(enemy)) > radius) continue;
  ledger?.add(uid);
  hit(shot, enemy, damage);
 }
}

function emit(state, name, start, target, options = {}) {
 if (ev.projectiles.length >= rules.MaxProjectiles) return null;
 const s = state.stats, clip = state.style.projectiles[name];
 const destination = options.point || point(target);
 const distance = range(...start,...destination);
 const flight = options.flight ?? (s.ArcHeight ? clamp(distance/s.ProjectileSpeed,s.MinFlight,s.MaxFlight) : null);
 const heading = Math.atan2(destination[1]-start[1], destination[0]-start[0]);
 const forward = state.facing*Math.PI/180;
 const contact = !flight && options.kind!=='fragment' && ((destination[0]-start[0])*Math.cos(forward)+(destination[1]-start[1])*Math.sin(forward) <= 0);
 const sprite = ev.takeSprite('shot');
 const shot = {id:state.id, owner:state.tower, ownerId:state.uid, stats:s, tier:state.tier, name, clip,
               sprite, kind:options.kind || 'normal', target, targetId:target?.getUniqueId(), start, destination,
               x:start[0], y:start[1], angle:contact ? forward : heading, contact, born:ev.time,
               flight, arc:s.ArcHeight || 0, flightCue:!options.kind || options.kind==='cluster' || options.kind==='special',
               ledger:options.ledger};
 ev.projectiles.push(shot);
 ev.metrics.peakProjectiles = Math.max(ev.metrics.peakProjectiles,ev.projectiles.length);
 ev.metrics.shots++;
 return shot;
}

function removeLink(link) {
 ev.links.delete(link);
 link.a.link = link.b.link = null;
 ev.release(link.sprite);
}

function removeZone(zone) {
 if (zone.link) removeLink(zone.link);
 for (const entry of zone.visuals) ev.release(entry.sprite);
 ev.zones.splice(ev.zones.indexOf(zone),1);
}

function linkZone(zone, siblings) {
 const s = zone.stats;
 let other = null, distance = s.LinkRange;
 for (const candidate of siblings) {
  if (!candidate.linkedPoison || candidate.link || candidate.expires <= ev.time) continue;
  const d = range(zone.x,zone.y,candidate.x,candidate.y);
  if (d < s.LinkMinDistance || d > distance) continue;
  other = candidate;
  distance = d;
 }
 if (!other) return;
 const link = {a:zone, b:other, sprite:ev.takeSprite('ground'), born:ev.time};
 zone.link = other.link = link;
 ev.links.add(link);
 ev.metrics.links++;
 ev.fx(zone.id,'ToxicNetwork',(zone.x+other.x)/2,(zone.y+other.y)/2,{alpha:.52});
 ev.sound(zone.id,'toxic_network');
}

function addZone(shot, x, y) {
 const {id, ownerId, stats:s, tier} = shot;
 let siblings = ev.zones.filter(zone => zone.ownerId===ownerId);
 if (siblings.length >= s.ZoneLimit) removeZone(siblings.shift());
 if (ev.zones.length >= rules.MaxZones) {
  const oldest = ev.zones[0];
  removeZone(oldest);
  siblings = siblings.filter(zone => zone!==oldest);
 }
 const venom = s.Kit==='venom';
 const layers = venom ? [['PoisonGround',.45],['CosmicPoisonCloud',.58],['PoisonZoneBoundary',.6],
                         [tier===3?'PoisonEnergySwirl':'FloatingSpores',.48]] : [['MiniPoisonZone',.65]];
 if (!venom && tier>=2 && siblings.length) layers.push(['MultiplePoisonZones',.33]);
 const visuals = layers.map(([name,alpha])=>({clip:art.towers[id].effects[name],alpha,sprite:ev.takeSprite('ground')}));
 const poison = {PoisonDamage:s.PoisonDamage, PoisonDuration:s.PoisonDuration, PoisonIcon:id};
 const zone = {id, owner:shot.owner, ownerId, stats:s, visuals, poison, x, y, radius:s.ZoneRadius,
               born:ev.time, expires:ev.time+s.ZoneDuration, nextPulse:ev.time, link:null};
 ev.zones.push(zone);
 ev.metrics.zones++;
 ev.metrics.peakZones = Math.max(ev.metrics.peakZones,ev.zones.length);
 if (s.LinkRange) {
  zone.linkedPoison = {...poison,PoisonDamage:s.PoisonDamage*(1+s.LinkBonus)};
  linkZone(zone, siblings);
 }
 return zone;
}

function expireZone(zone, enemies) {
 const {id, x, y, radius, stats} = zone;
 removeZone(zone);
 ev.fx(id,'PoisonZoneFade',x,y,{size:radius*2,alpha:.65});
 if (stats.CollapseDamage) {
  area(zone,enemies,x,y,radius,stats.CollapseDamage);
  ev.fx(id,'ToxicCollapse',x,y,{size:radius*2.1});
  ev.sound(id,'toxic_collapse','impact');
  const state = ev.rigs.get(zone.ownerId);
  if (state) state.specialUntil = ev.time+.42;
  ev.metrics.collapses++;
 }
}

function chain(shot, x, y, remaining, ledger) {
 const {id, stats:s} = shot;
 schedule(s.ChainDelay, enemies => {
  const first = remaining===s.ChainMax, state = ev.rigs.get(shot.ownerId);
  if (first && (!state || state.nextSpecial > ev.time)) return;
  let target = null, nearest = s.ChainReach;
  for (const enemy of enemies) {
   if (ledger.has(enemy.getUniqueId()) || !nb.alive(enemy)) continue;
   const d = range(x,y,...point(enemy));
   if (d <= nearest) { nearest=d; target=enemy; }
  }
  if (!target) return;
  const [tx,ty] = point(target);
  if (first) {
   state.nextSpecial = ev.time+s.ChainCooldown;
   state.specialUntil = ev.time+.42;
  }
  area(shot,enemies,tx,ty,s.ChainRadius,s.ChainDamage,ledger);
  ev.fx(id,'SupernovaChainLink',(x+tx)/2,(y+ty)/2,{size:nearest+26,height:42,angle:Math.atan2(ty-y,tx-x),alpha:.65});
  ev.fx(id,'SupernovaChainBurst',tx,ty,{size:s.ChainRadius*2});
  ev.sound(id,'supernova_chain','impact');
  ev.metrics.chains++;
  if (remaining>1) chain(shot,tx,ty,remaining-1,ledger);
 });
}

function cluster(shot, enemies, x, y, ledger) {
 const {id,stats:s} = shot, state = ev.rigs.get(shot.ownerId);
 ev.fx(id,'ClusterSplit',x,y);
 ev.fx(id,'ClusterBurst',x,y,{delay:.05,alpha:.65});
 ev.sound(id,'cluster_split');
 const targets = enemies.filter(e=>nb.alive(e)&&!ledger.has(e.getUniqueId())&&range(x,y,...point(e))<=s.FragmentReach);
 targets.sort((a,b)=>range(x,y,...point(a))-range(x,y,...point(b)));
 if (!state) return;
 for (const [i,target] of targets.slice(0,s.FragmentLimit).entries()) {
  const child = emit(state,i?'MeteorFragmentLarge':'MeteorFragmentSmall',[x,y],target,{kind:'fragment',ledger});
  if (!child) break;
  child.stats = shot.stats;
  ev.metrics.fragments++;
 }
}

const impact = {
 venom(shot, target, x, y, enemies) {
  const {id,stats:s,tier} = shot;
  area(shot,enemies,x,y,s.BlastRadius,s.Damage);
  ev.fx(id,tier>1?'CataclysmSeedExplosion':'VenomSeedImpact',x,y,{size:s.BlastRadius*2.05});
  ev.sound(id,tier>1?'cataclysm_seed_burst':'venom_seed_impact','impact');
  addZone(shot,x,y);
  ev.sound(id,'spore_sizzle');
 },
 plague(shot, target, x, y, enemies) {
  const {id,stats:s,tier} = shot;
  const mark = nb.poisons.get(target.getUniqueId());
  const poisoned = mark && mark.expires>nb.time;
  const detonate = poisoned && shot.kind==='special';
  const bonus = poisoned ? s.PoisonedBonus || 0 : 0;
  const blast = detonate ? s.Damage*s.DetonationRatio+Math.min(mark.damage,s.PoisonDamage)*s.DetonationPoisonScale : 0;
  if (detonate) nb.clearPoison(mark);
  hit(shot,target,s.Damage*(1+bonus)+blast);
  if (detonate) {
   area(shot,enemies,x,y,s.DetonationRadius,blast,new Set([target.getUniqueId()]));
   ev.fx(id,'VenomDetonation',x,y,{size:s.DetonationRadius*2.1});
   ev.fx(id,'PoisonFragments',x,y,{delay:.1,alpha:.6});
   ev.sound(id,'venom_detonation','impact');
   ev.metrics.detonations++;
   return;
  }
  ev.fx(id,bonus?'CorruptedStellarExplosion':'HeavyHitFlash',x,y,{alpha:.76});
  ev.sound(id,bonus?'corrupted_stellar_burst':'poison_hit','impact');
  if (nb.poison(target,{...s,PoisonIcon:id},shot.owner,shot.ownerId)) {
   ev.fx(id,'PoisonApplication',x,y,{alpha:.58});
   if (bonus) ev.fx(id,'PoisonIntensity',x,y,{size:28,life:.24,frame:tier-1,alpha:.68});
   ev.sound(id,'spore_infusion');
  }
 },
 supernova(shot, target, x, y, enemies) {
  const {id,stats:s} = shot, ledger = new Set();
  area(shot,enemies,x,y,s.BlastRadius,s.Damage,ledger);
  ev.fx(id,'CoreHit',x,y,{alpha:.7});
  ev.fx(id,'LargeCelestialExplosion',x,y,{size:s.BlastRadius*2.02,alpha:.74});
  ev.fx(id,'PrimaryShockwave',x,y,{size:s.BlastRadius*2.02,alpha:.57});
  ev.fx(id,'StellarFragments',x,y,{delay:.12,alpha:.52});
  ev.sound(id,shot.tier===1?'core_impact':'supernova_explosion','impact');
  if (s.ShockRadius) schedule(s.ShockDelay, current => {
   area(shot,current,x,y,s.ShockRadius,s.ShockDamage,ledger);
   ev.fx(id,'SecondaryShockwave',x,y,{size:s.ShockRadius*2,alpha:.52});
   ev.sound(id,'secondary_shockwave','impact');
   ev.metrics.shocks++;
  });
  if (s.ChainMax && (ev.rigs.get(shot.ownerId)?.nextSpecial ?? Infinity)<=ev.time) chain(shot,x,y,s.ChainMax,ledger);
 },
 toxic(shot, target, x, y) {
  hit(shot,target,shot.stats.Damage);
  ev.fx(shot.id,'SmallToxicImpact',x,y);
  ev.fx(shot.id,'SporeScatter',x,y,{alpha:.56});
  ev.sound(shot.id,'small_toxic_impact','impact');
  if (addZone(shot,x,y).link===null) ev.sound(shot.id,'spore_scatter');
 },
 meteor(shot, target, x, y, enemies) {
  const {id,stats:s,kind} = shot;
  const radius = kind==='rain' ? s.RainRadius : kind==='fragment' ? s.FragmentRadius : s.BlastRadius;
  const damage = kind==='rain' ? s.RainDamage : kind==='fragment' ? s.FragmentDamage : s.Damage;
  const ledger = kind==='cluster' ? new Set() : shot.ledger;
  area(shot,enemies,x,y,radius,damage,ledger);
  ev.fx(id,kind==='fragment'?'FragmentImpact':kind==='rain'||kind==='cluster'?'CelestialBloomImpact':'SmallMeteorExplosion',x,y,{size:radius*2.05});
  if (kind==='fragment') ev.sound(id,'meteor_fragment_hit','impact');
  else if (kind==='rain'||kind==='cluster') {
   ev.fx(id,'SmallShockwaves',x,y,{size:radius*2.15,alpha:.54});
   ev.sound(id,'celestial_bloom_impact','impact');
  } else ev.sound(id,'meteor_fragment_hit','impact');
  if (kind==='cluster') cluster(shot,enemies,x,y,ledger);
 },
};

function finishShot(shot, target, x, y, enemies) {
 ev.metrics.impacts++;
 impact[shot.stats.Kit](shot,target,x,y,enemies);
}

function expireShot(shot) {
 const effects = presentation[shot.stats.Kit];
 ev.fx(shot.id,effects.expire,shot.x,shot.y,{alpha:.62});
 if (shot.stats.Kit==='meteor') ev.fx(shot.id,'EmberDissipation',shot.x,shot.y,{alpha:.44});
}

function moveShot(shot, dt, enemies) {
 const age = ev.time-shot.born, s = shot.stats;
 if (age <= 0) return false;
 if (age >= rules.ProjectileLifetime) { expireShot(shot); return true; }
 if (shot.flightCue && age >= rules.FlightCueAt) {
  shot.flightCue = false;
  ev.sound(shot.id,presentation[s.Kit].flight);
 }
 if (shot.flight) {
  const p = Math.min(1,age/shot.flight), [x,y] = shot.destination;
  shot.x = shot.start[0]+(x-shot.start[0])*p;
  shot.y = shot.start[1]+(y-shot.start[1])*p-4*shot.arc*p*(1-p);
  if (p < 1) return false;
  finishShot(shot,null,x,y,enemies);
  return true;
 }
 const target = shot.target;
 if (!nb.alive(target) || target.getUniqueId()!==shot.targetId) { expireShot(shot); return true; }
 const [x,y] = point(target), dx=x-shot.x,dy=y-shot.y,d=Math.hypot(dx,dy),travel=s.ProjectileSpeed*dt;
 if (shot.contact || d<=travel+rules.ContactRadius) { finishShot(shot,target,x,y,enemies); return true; }
 shot.angle = Math.atan2(dy,dx);
 shot.x += dx/d*travel;
 shot.y += dy/d*travel;
 return false;
}

function rain(state, target) {
 const {id,stats:s} = state;
 if (!s.RainCount || ev.time<state.nextSpecial) return;
 const center = nb.predict(target,s.RainFlight);
 let count = 0;
 for (let i=0;i<s.RainCount;i++) {
  const angle = i*2.399963229728653, r=s.RainSpread*Math.sqrt(i/s.RainCount);
  const x=center[0]+r*Math.cos(angle), y=center[1]+r*Math.sin(angle);
  if (schedule(.07+i*s.RainSpacing,()=>{
   if (ev.rigs.get(state.uid)!==state) return;
   const shot = emit(state,i%2?'MeteorFragmentSmall':'MeteorFragmentLarge',[x+18,y-s.RainDropHeight],null,
                     {kind:'rain',point:[x,y],flight:s.RainFlight});
   if (shot) ev.metrics.rainDrops++;
  })) count++;
 }
 if (!count) return;
 state.nextSpecial = ev.time+s.RainCooldown;
 state.specialUntil = ev.time+.55;
 ev.fx(id,'MeteorRain',...center,{alpha:.63});
 ev.sound(id,'meteor_rain_activation');
}

function launch(state, target, kind = 'normal') {
 const {id,stats:s} = state, muzzle = state.nextMuzzle;
 const motion = 'Fire_M'+(muzzle+1), from = ev.muzzle(state,muzzle,motion);
 let name;
 switch (s.Kit) {
  case 'venom': name=state.tier>1?'CataclysmSeedPod':'VenomSeedPod'; break;
  case 'plague': name=kind==='special'?'VenomDetonationShot':'PlaguebreakerBolt'; break;
  case 'supernova': name=state.tier>1?'SupernovaShell':'CompressedSupernovaCore'; break;
  case 'toxic': name=muzzle===2?'ConstellationVenomSeed':'ToxicStarShard'; break;
  case 'meteor': name=kind==='cluster'?'ClusterMeteor':'MeteorFragment'; break;
 }
 const distance = range(...from,...point(target));
 const flight = s.ArcHeight ? clamp(distance/s.ProjectileSpeed,s.MinFlight,s.MaxFlight) : null;
 const shot = emit(state,name,from,target,{kind:kind==='normal'?undefined:kind,point:flight?nb.predict(target,flight):null,flight});
 if (!shot) return false;
 state.nextMuzzle = (muzzle+1)%state.art.muzzles.length;
 state.lastFire = ev.time;
 state.firedMotion = motion;
 state.tower.getVariables().get('ShotCounter').add(1);
 ev.motion(state,motion,true);
 const effects = presentation[s.Kit];
 ev.fx(id,effects.flash,...from,{angle:(state.facing+90)*Math.PI/180,alpha:.72});
 if (s.Kit==='plague') ev.fx(id,'SporeInfusion',...from,{alpha:.65});
 // Accent releases replace the normal cue on the special/secondary emitter.
 const alternateRelease = (s.Kit==='venom'||s.Kit==='supernova') && state.salvo%2===1;
 const cue = kind==='special' || kind==='cluster' || muzzle===2 && s.Kit==='toxic' || alternateRelease
  ? effects.release : effects.fire[muzzle%effects.fire.length];
 ev.sound(id,cue,'fire');
 return shot;
}

function validTarget(state, target, uid) {
 return target?.getUniqueId()===uid && nb.alive(target) && scene.__starCannon.targetValid(state.tower,target,nb.liveSet);
}

function targetFor(state, enemies) {
 if (validTarget(state,state.target,state.targetId)) return state.target;
 const center = scene.__freePlacement.center(state.tower), strong = state.stats.Kit==='plague';
 let best = null, priority = Infinity;
 for (const enemy of enemies) {
  if (!nb.alive(enemy)) continue;
  const d = range(...center,...point(enemy));
  if (d > state.stats.AttackRange) continue;
  const score = strong ? -enemy.getBehavior('Health').Health() : d;
  if (score < priority) { priority=score; best=enemy; }
 }
 state.target = best;
 state.targetId = best?.getUniqueId() || 0;
 state.tower.getVariables().get('TargetId').setNumber(state.targetId);
 return best;
}

function poseAfterFire(state, aligned) {
 let age = ev.time-state.lastFire;
 const clips = state.art.clips;
 for (const motion of [state.firedMotion,'Recoil','Recovery','Reload']) {
  if (!motion) continue;
  const duration = ev.duration(clips[motion]);
  if (age < duration) { ev.motion(state,motion); return; }
  age -= duration;
 }
 ev.motion(state,state.specialUntil>ev.time?'SpecialAttack':state.target?(aligned?'EnergyPulse':'AimReady'):'Idle');
}

function tickTower(state, dt, enemies) {
 const {stats:s, tower, id} = state;
 const target = targetFor(state,enemies);
 state.cooldown = Math.max(0,state.cooldown-dt);
 let aligned = false;
 if (target) {
  const [x,y] = scene.__freePlacement.center(tower), [tx,ty] = point(target);
  const wanted = Math.atan2(ty-y,tx-x)*180/Math.PI, turn = scene.__starCannon.wrap(wanted-state.facing);
  const cap = s.AimDegreesPerSecond*dt;
  state.facing = scene.__starCannon.wrap(state.facing+clamp(turn,-cap,cap));
  tower.getVariables().get('TurretFacing').setNumber(state.facing);
  aligned = Math.abs(scene.__starCannon.wrap(wanted-state.facing))<=rules.FireToleranceDegrees;
 }
 // The windup occupies the end of the cooldown, so the configured interval
 // remains the interval between attacks (between salvos for Meteor).
 if (!target || !aligned || state.cooldown>s.Windup+1e-8) {
  state.windup = null;
  poseAfterFire(state,aligned);
  return;
 }
 if (state.windup===null) {
  state.windup = ev.time;
  const effects = presentation[s.Kit];
  ev.sound(id,effects.charge,'charge');
  if (effects.chargeFx) ev.fx(id,effects.chargeFx,0,0,{attached:state,life:s.Windup,alpha:.62});
  if (s.Kit==='supernova') ev.fx(id,'ReactorBloom',0,0,{attached:state,life:s.Windup,alpha:.56});
 }
 const age = ev.time-state.windup;
 const special = s.DetonateEvery && (state.salvo+1)%s.DetonateEvery===0;
 if (state.cooldown>1e-8 || age<s.Windup-dt-1e-8) {
  ev.motion(state,age<s.Windup*.35?'PreFire':special||state.specialUntil>ev.time?'SpecialAttack':'Charge');
  return;
 }
 if (!launch(state,target,special?'special':'normal')) return;
 state.salvo++;
 state.windup = null;
 state.cooldown = s.AttackInterval;
 if (!s.SalvoSize) return;
 const clustered = s.ClusterEvery && state.salvo%s.ClusterEvery===0;
 const uid = target.getUniqueId();
 for (let i=1;i<s.SalvoSize;i++) schedule(s.SalvoSpacing*i, current=>{
  if (ev.rigs.get(state.uid)!==state) return;
  const aim = validTarget(state,target,uid) ? target : targetFor(state,current);
  if (aim) launch(state,aim,clustered&&i===s.SalvoSize-1?'cluster':'normal');
 });
 rain(state,target);
}

ev.tick = (dt, enemies) => {
 if (ev.disposed || dt<=0) return;
 ev.time += dt;
 for (const state of ev.rigs.values()) tickTower(state,dt,enemies);
 for (let i=0;i<ev.scheduled.length;) {
  const task = ev.scheduled[i];
  if (ev.time+1e-8<task.at) { i++; continue; }
  ev.scheduled.splice(i,1);
  task.run(enemies);
 }
 for (let i=ev.projectiles.length-1;i>=0;i--) {
  const shot = ev.projectiles[i];
  if (!moveShot(shot,dt,enemies)) continue;
  ev.release(shot.sprite);
  ev.projectiles.splice(i,1);
 }
 for (let i=ev.zones.length-1;i>=0;i--) {
  const zone = ev.zones[i];
  if (ev.time>=zone.expires) { expireZone(zone,enemies); continue; }
  if (ev.time+1e-8<zone.nextPulse) continue;
  zone.nextPulse = ev.time+nb.config.CloudApplyIntervalSeconds;
  const poison = zone.link && zone.linkedPoison ? zone.linkedPoison : zone.poison;
  for (const enemy of enemies) if (nb.alive(enemy) && range(zone.x,zone.y,...point(enemy))<=zone.radius) nb.poison(enemy,poison,zone.owner,zone.ownerId);
 }
};

ev.renderCombat = () => {
 for (const shot of ev.projectiles) {
  const sprite = shot.sprite, age = ev.time-shot.born;
  sprite.position.set(shot.x,shot.y);
  sprite.rotation = shot.angle+Math.PI/2;
  sprite.visible = true;
  ev.paintFrame(sprite,shot.clip,ev.frameAt(shot.clip,age),shot.clip.size);
 }
 for (const zone of ev.zones) {
  const age = ev.time-zone.born, fade = Math.min(1,age/.18,(zone.expires-ev.time)/.32);
  for (const {sprite,clip,alpha} of zone.visuals) {
   sprite.position.set(zone.x,zone.y);
   sprite.visible = true;
   sprite.alpha = alpha*fade;
   ev.paintFrame(sprite,clip,ev.frameAt(clip,age),zone.radius*2.04);
  }
 }
 for (const {a,b,born,sprite} of ev.links) {
  const clip = art.towers[a.id].effects.ConstellationEnergyLine;
  sprite.position.set((a.x+b.x)/2,(a.y+b.y)/2);
  sprite.rotation = Math.atan2(b.y-a.y,b.x-a.x);
  sprite.visible = true;
  sprite.alpha = .62;
  ev.paintFrame(sprite,clip,ev.frameAt(clip,ev.time-born),range(a.x,a.y,b.x,b.y)+12,28);
 }
};
ev.resetCombat = () => {
 for (const shot of ev.projectiles) ev.release(shot.sprite);
 ev.projectiles.length = 0;
 while (ev.zones.length) removeZone(ev.zones.at(-1));
 ev.scheduled.length = 0;
};
