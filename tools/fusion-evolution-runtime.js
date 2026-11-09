// Native Evolution owners, atlas rendering, pooled visuals and paid tier changes.
const scene = runtimeScene;
if (scene.__fusionEvolution) return;
const sv = scene.getVariables(), game = scene.getGame();
const balance = sv.get('FusionEvolutionConfig').toJSObject();
const art = JSON.parse(sv.get('FusionEvolutionArt').getAsString());
const world = scene.getLayer('').getRenderer().getRendererObject();
const ev = scene.__fusionEvolution = {
 balance, art, rules: balance.Rules, time: 0, rigs: new Map(), frames: new Map(), pool: [],
 effects: [], projectiles: [], zones: [], links: new Set(), scheduled: [], soundAfter: {}, disposed: false,
 metrics: {shots: 0, impacts: 0, zones: 0, collapses: 0, detonations: 0, shocks: 0, chains: 0,
           links: 0, fragments: 0, rainDrops: 0, materializations: 0, upgrades: 0,
           peakProjectiles: 0, peakZones: 0, peakEffects: 0, peakScheduled: 0, visualsDropped: 0},
};
const image = name => game.getImageManager().getPIXITexture(name);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const starburst = 'StarburstCannon';
const roots = {};
for (const [name, order] of [['ground', 92], ['shot', 15000], ['fx', 15002]]) {
 const root = new PIXI.Container();
 root.zIndex = order;
 root.interactive = false;
 root.interactiveChildren = false;
 world.addChild(root);
 roots[name] = root;
}

ev.type = tower => {
 if (!tower) return '';
 const name = tower.getName();
 if (name === 'StarCannonTower') return scene.__starCannon?.isFusion(tower) ? starburst : '';
 return balance.Towers[name] ? name : '';
};
ev.tier = tower => clamp(Math.trunc(tower.getVariables().get('EvolutionTier').getAsNumber()) || 1, 1, 3);
ev.stats = (id, tier = 1) => {
 if (id === starburst) {
  const base = scene.__starCannon?.fusionConfig;
  return base ? {...base, ...balance.StarburstTiers[tier-1]} : null;
 }
 const spec = balance.Towers[id], upgrade = spec?.Tiers[tier-1];
 if (!upgrade) return null;
 const {Tiers, ...shared} = spec;
 return {...shared, ...upgrade};
};
ev.duration = clip => clip.frames.length / clip.fps;
ev.frameAt = (clip, age) => {
 const n = Math.max(0, Math.floor(age*clip.fps+1e-8));
 return clip.loop ? n % clip.frames.length : Math.min(n, clip.frames.length-1);
};
ev.texture = (clip, index) => {
 const rect = clip.frames[index], key = clip.file + ':' + rect.join(',');
 let texture = ev.frames.get(key);
 if (!texture) {
  const atlas = image(clip.file);
  texture = new PIXI.Texture(atlas.baseTexture, new PIXI.Rectangle(...rect));
  ev.frames.set(key, texture);
 }
 return texture;
};
ev.paintFrame = (sprite, clip, frame, width, height = width) => {
 const texture = ev.texture(clip, frame);
 if (sprite.texture !== texture) sprite.texture = texture;
 sprite.anchor.set(clip.origin[0]/texture.width, clip.origin[1]/texture.height);
 sprite.scale.set(width/texture.width, height/texture.height);
};
ev.takeSprite = layer => {
 const sprite = ev.pool.pop() || new PIXI.Sprite();
 sprite.anchor.set(.5);
 sprite.alpha = 1;
 sprite.rotation = 0;
 sprite.tint = 0xffffff;
 sprite.visible = false;
 roots[layer].addChild(sprite);
 return sprite;
};
ev.release = sprite => {
 sprite.parent?.removeChild(sprite);
 sprite.texture = PIXI.Texture.EMPTY;
 sprite.visible = false;
 ev.pool.push(sprite);
};
ev.sound = (id, cue, bus = '') => {
 const audio = scene.__audio;
 const key = (id === 'Shared' ? art.shared.sound : art.towers[id]?.sound)?.[cue];
 if (!audio || !key || audio.now < (ev.soundAfter[bus] || 0)) return false;
 const gap = {fire: ev.rules.FireAudioGap, impact: ev.rules.ImpactAudioGap, charge: ev.rules.ChargeAudioGap}[bus];
 if (gap) ev.soundAfter[bus] = audio.now + gap;
 return audio.play(key);
};
ev.fx = (id, name, x, y, options = {}) => {
 const clip = (id === 'Shared' ? art.shared.effects : art.towers[id]?.effects)?.[name];
 if (!clip) return null;
 if (ev.effects.length >= ev.rules.MaxEffects) {
  ev.metrics.visualsDropped++;
  return null;
 }
 const effect = {
  name, clip, x, y, sprite: ev.takeSprite(clip.layer === 'Below enemies' ? 'ground' : 'fx'),
  start: ev.time + (options.delay || 0), life: options.life ?? ev.duration(clip),
  width: options.size ?? clip.size, height: options.height ?? options.size ?? clip.size,
  alpha: options.alpha ?? .8, angle: options.angle || 0, to: options.to,
  frame: options.frame, attached: options.attached,
 };
 ev.effects.push(effect);
 ev.metrics.peakEffects = Math.max(ev.metrics.peakEffects, ev.effects.length);
 return effect;
};
ev.motion = (state, key, restart = false) => {
 if (!restart && state.motion === key) return;
 state.motion = key;
 state.motionAt = ev.time;
 state.tower.getVariables().get('EvolutionPhase').setString(key);
};
ev.muzzle = (state, index, motion = state.motion, frame = 0) => {
 const {pivot, clips, muzzles, facing} = state.art;
 const point = clips[motion]?.muzzles?.[frame]?.[index] || muzzles[index];
 const [x,y] = scene.__freePlacement.center(state.tower);
 const angle = (state.facing-facing)*Math.PI/180;
 const dx = (point[0]-pivot[0])*state.style.scale, dy = (point[1]-pivot[1])*state.style.scale;
 return [x+dx*Math.cos(angle)-dy*Math.sin(angle), y+dx*Math.sin(angle)+dy*Math.cos(angle)];
};
ev.apply = (tower, tier = ev.tier(tower)) => {
 const id = ev.type(tower), stats = ev.stats(id, tier);
 if (!stats) return false;
 const vars = tower.getVariables();
 if (id === starburst) {
  vars.get('EvolutionTier').setNumber(tier);
  return scene.__starCannon.syncStats(tower);
 }
 const style = art.towers[id], model = style.tiers[tier-1];
 const base = image(model.base), head = ev.texture(model.clips.Idle, 0), shadow = image(style.shadow);
 if (!base.valid || !head.valid || !shadow.valid) return false;
 const uid = tower.getUniqueId();
 let state = ev.rigs.get(uid);
 if (!state) {
  const root = new PIXI.Container(), pedestal = new PIXI.Sprite(), turret = new PIXI.Sprite();
  const shade = new PIXI.Sprite(shadow);
  shade.anchor.set(.5);
  shade.alpha = .65;
  root.addChild(shade, pedestal, turret);
  root.interactiveChildren = false;
  world.addChild(root);
  state = {id, uid, tower, style, root, shade, pedestal, turret, facing: model.facing, target: null, targetId: 0,
           cooldown: 0, nextSpecial: ev.time, windup: null, nextMuzzle: 0, lastFire: -Infinity, salvo: 0};
  state.cleanup = () => {
   tower.unregisterDestroyCallback(state.cleanup);
   root.destroy({children:true, texture:false, baseTexture:false});
   ev.rigs.delete(uid);
  };
  tower.registerDestroyCallback(state.cleanup);
  ev.rigs.set(uid, state);
 }
 state.art = model;
 state.stats = stats;
 state.tier = tier;
 state.nextMuzzle %= model.muzzles.length;
 if (stats.RainCooldown && !state.rainReady) {
  state.nextSpecial = ev.time + stats.RainCooldown;
  state.rainReady = true;
 }
 ev.motion(state, 'Idle', true);
 state.pedestal.texture = base;
 state.pedestal.anchor.set(model.pivot[0]/base.width, model.pivot[1]/base.height);
 state.turret.texture = head;
 state.turret.anchor.set(model.pivot[0]/head.width, model.pivot[1]/head.height);
 vars.get('EvolutionTier').setNumber(tier);
 for (const key of ['Damage','AttackRange','AttackInterval','ProjectileSpeed']) vars.get(key).setNumber(stats[key]);
 for (const [field,key] of [['CurrentDamage','Damage'],['CurrentRange','AttackRange'],['CurrentAttackInterval','AttackInterval'],['CurrentProjectileSpeed','ProjectileSpeed']]) vars.get(field).setNumber(stats[key]);
 tower.setAnimationName('E'+tier);
 scene.__freePlacement.positionSprite(tower, id, ...scene.__freePlacement.center(tower));
 tower.setOpacity(0);
 return true;
};

ev.upgrade = tower => {
 const id = ev.type(tower);
 if (!id || scene.__fusion?.active || sv.get('IndexBlocksInput').getAsBoolean() ||
     sv.get('GameOver').getAsBoolean() || !scene.getObjects(tower.getName()).includes(tower)) return false;
 const next = ev.tier(tower)+1, stats = next <= 3 && ev.stats(id, next);
 if (!stats || sv.get('Money').getAsNumber() < stats.Cost) {
  scene.__audio?.play('InvalidAction');
  return false;
 }
 if (!ev.apply(tower, next)) return false;
 sv.get('Money').sub(stats.Cost);
 tower.getVariables().get('TotalInvestment').add(stats.Cost);
 const [x,y] = scene.__freePlacement.center(tower);
 if (id === starburst) {
  ev.fx('Shared','FinalEnergyPulse',x,y,{size:118, alpha:.65});
  scene.__audio?.play('TowerMajorUpgrade');
 } else {
  ev.fx(id, 'AscendToE'+next, x, y);
  const cue = Object.keys(art.towers[id].sound).find(name => name.endsWith('_ascension'));
  ev.sound(id, cue);
 }
 ev.metrics.upgrades++;
 return true;
};
ev.materialize = (id, sources, tower, pure) => {
 const [x,y] = scene.__freePlacement.center(tower);
 for (const {clip, startSeconds: delay} of art.shared.timeline) {
  if (clip === 'SourceDissolve' || clip === 'EnergyTransfer') {
   for (const [sx,sy] of sources) ev.fx('Shared', clip, sx, sy, {delay, alpha:.6, to:clip==='EnergyTransfer' ? [x,y] : null});
  } else ev.fx('Shared', clip, x, y, {delay, alpha:.68});
 }
 if (pure) ev.fx('Shared', art.shared.pureAccent, x, y, {delay:.21, alpha:.6});
 const state = ev.rigs.get(tower.getUniqueId());
 if (state) {
  state.materialized = ev.time;
  state.cooldown = Math.max(state.cooldown, ev.rules.MaterializationSeconds);
  const cue = Object.keys(art.towers[id].sound).find(name => name.endsWith('_materialization'));
  ev.sound(id, cue);
 } else ev.sound('Shared','fusion_complete');
 ev.metrics.materializations++;
};

ev.render = () => {
 if (ev.disposed) return;
 if (sv.get('GameOver').getAsBoolean()) ev.clearTransients();
 for (const state of ev.rigs.values()) {
  const {root, tower, style, art: model} = state, [x,y] = scene.__freePlacement.center(tower);
  root.position.set(x,y);
  root.scale.set(style.scale);
  root.alpha = state.materialized === undefined ? 1 : clamp((ev.time-state.materialized)/ev.rules.MaterializationSeconds, .15, 1);
  root.zIndex = tower.getZOrder()+.1;
  root.visible = !tower.isHidden();
  state.turret.rotation = (state.facing-model.facing)*Math.PI/180;
  const clip = model.clips[state.motion];
  const texture = ev.texture(clip, ev.frameAt(clip, ev.time-state.motionAt));
  if (state.turret.texture !== texture) state.turret.texture = texture;
 }
 for (let i = ev.effects.length-1; i >= 0; i--) {
  const effect = ev.effects[i], age = ev.time-effect.start, sprite = effect.sprite;
  if (age >= effect.life || effect.attached?.root.destroyed) {
   ev.release(sprite);
   ev.effects.splice(i,1);
   continue;
  }
  if (age < 0) continue;
  const t = age/effect.life;
  const [x,y] = effect.attached ? scene.__freePlacement.center(effect.attached.tower) : [effect.x,effect.y];
  sprite.position.set(effect.to ? x+(effect.to[0]-x)*t : x, effect.to ? y+(effect.to[1]-y)*t : y);
  sprite.visible = true;
  sprite.rotation = effect.angle;
  sprite.alpha = effect.alpha;
  ev.paintFrame(sprite, effect.clip, effect.frame ?? ev.frameAt(effect.clip, age), effect.width, effect.height);
 }
 ev.renderCombat?.();
};
ev.clearTransients = () => {
 for (const effect of ev.effects) ev.release(effect.sprite);
 ev.effects.length = 0;
 ev.resetCombat?.();
};
ev.dispose = () => {
 if (ev.disposed) return;
 ev.clearTransients();
 for (const state of ev.rigs.values()) state.cleanup();
 for (const sprite of ev.pool) sprite.destroy({texture:false,baseTexture:false});
 ev.pool.length = 0;
 for (const root of Object.values(roots)) root.destroy();
 for (const frame of ev.frames.values()) frame.destroy(false);
 ev.frames.clear();
 ev.disposed = true;
};
if (!gdjs.__fusionEvolutionCleanup) {
 gdjs.__fusionEvolutionCleanup = true;
 gdjs.callbacksRuntimeSceneUnloading.push(s => s.__fusionEvolution?.dispose());
}
