// Native Index, actual PIXI atlas slicing and WAV decoding in an isolated preview.
(async () => {
 const game = testGame;
 const scene = game.getSceneStack().getCurrentScene();
 const vars = scene.getVariables();
 const input = game.getInputManager();
 const checks = [];
 const near = (a,b) => Math.abs(a-b) < .002;
 const ok = (condition,message) => {
  if (!condition) throw Error(message);
  checks.push(message);
 };
 const step = (count=1) => {
  for (let i=0; i<count; i++) {
   scene.renderAndStep(16.667);
   input.onFrameEnded();
  }
 };
 const uri = file => new URL(file,TEST_WORKSPACE_URI).href;
 const manifest = await (await fetch(uri('assets/towers/fusion/manifest.json'))).json();
 const assets = manifest.assets;
 const families = Object.values(manifest.towers);
 game.pause(true);
 step(3);
 const archive = game.__fusionArchive;
 const save = localStorage.getItem(archive.storageKey);
 const archiveRevision = archive.revision;
 vars.get('IndexOpen').setBoolean(true);
 step(2);
 const index = scene.__unitIndex;
 index.category = 'Fusion';
 step(2);
 ok(index.entries.length===6 && index.entries[0].id==='StarburstCannon','Fusion Index contains Starburst and five art previews');
 for (const family of families) {
  const data = family.gdevelopIndex;
  index.select(data.entryId);
  step(2);
  const card = index.cards.find(item => item.id===data.entryId);
  const sprite = index.detail.sprite;
  ok(card?.locked && card.name.getString()==='???' && index.detail.locked, family.id+' entry remains sealed');
  ok(sprite?.getAnimationName()===data.animation && sprite.getColor()==='0;0;0' &&
     sprite.getRendererObject().texture.valid, family.id+' existing Index uses the real portrait alpha');
  ok(index.detail.description.getString().includes(family.hint),family.id+' has its own cryptic hint');
  ok(!archive.has(data.entryId),family.id+' remains undiscovered after browsing');
  const parts = family.recipe.map(part => ({Type:part.object,Path1:part.path1,Path2:part.path2}));
  const result=archive.resolve(parts);
  ok(family.gameplayStatus==='Playable'?result?.id===family.id:result===null,family.id+' recipe resolution matches manifest integration state');
 }
 ok(localStorage.getItem(archive.storageKey)===save && archive.revision===archiveRevision,'Preview browsing writes no discovery state');
 index.category='Towers';
 step(2);
 ok(index.entries.map(x=>x.id).join(',')==='StarCannonTower,NebulaBloomTower','Existing two-tower archive');
 index.category='Monsters';
 step(2);
 ok(index.entries.length===6,'Existing monster archive roster');
 vars.get('IndexOpen').setBoolean(false);
 step(2);
 ok(scene.getObjects('StarCannonTower').length===0 && scene.getObjects('NebulaBloomTower').length===0,'Asset pack adds no gameplay instances');

 const audio = new OfflineAudioContext(1,44100,44100);
 let decoded = 0;
 let largestPeak = 0;
 for (const asset of Object.values(assets)) {
  if (asset.assetType!=='audio') continue;
  const response = await fetch(uri(asset.file));
  const clip = await audio.decodeAudioData(await response.arrayBuffer());
  ok(clip.numberOfChannels===1 && near(clip.duration,asset.durationSeconds),asset.sfxName+' browser WAV decoder');
  decoded++;
 }
 for (const family of families.filter(x=>['ToxicConstellation','MeteorStormArray'].includes(x.id))) {
  const asset = assets[family.audio[0]];
  const mix = new OfflineAudioContext(1,44100,44100);
  const clip = await mix.decodeAudioData(await (await fetch(uri(asset.file))).arrayBuffer());
  for (let i=0; i<6; i++) {
   const source = mix.createBufferSource();
   const gain = mix.createGain();
   source.buffer = clip;
   gain.gain.value = asset.recommendedGain;
   source.connect(gain).connect(mix.destination);
   source.start(i*asset.minimumRepeatSeconds);
  }
  const output = (await mix.startRendering()).getChannelData(0);
  const peak = output.reduce((value,sample)=>Math.max(value,Math.abs(sample)),0);
  largestPeak = Math.max(largestPeak,peak);
  ok(peak>.03 && peak<.25,family.id+' rapid-fire gain and rate guide avoid clipping in a six-cue render');
 }

 async function loadTexture(file) {
  const image = new Image();
  image.src = uri(file);
  await image.decode();
  const texture = PIXI.Texture.from(image);
  if (!texture.valid) throw Error('PIXI texture invalid '+file);
  return texture;
 }
 function frameTexture(atlas, rect) {
  return new PIXI.Texture(atlas.baseTexture,new PIXI.Rectangle(...rect));
 }
 const world = scene.getLayer('').getRenderer().getRendererObject();
 const stage = new PIXI.Container();
 stage.zIndex = 10500;
 stage.interactive = false;
 stage.interactiveChildren = false;
 world.addChild(stage);
 const spots = [[350,352],[915,352],[1430,352],[475,616],[1150,616]];
 const hitSpots = [[460,220],[1010,220],[1500,220],[530,484],[1215,484]];
 const effectNames = ['CosmicPoisonCloud','VenomDetonation','LargeCelestialExplosion','ToxicNetwork','MeteorRain'];
 let testedTiers = 0;
 let transforms = 0;
 for (let familyIndex=0; familyIndex<families.length; familyIndex++) {
  const family = families[familyIndex];
  const [x,y] = spots[familyIndex];
  const [hx,hy] = hitSpots[familyIndex];
  for (const [tier,details] of Object.entries(family.tiers)) {
   const baseTexture = await loadTexture(details.parts.base);
   const atlas = await loadTexture(details.motionAtlas);
   const clipSet = assets[details.motionAtlas].clips;
   const rig = new PIXI.Container();
   rig.position.set(x,y);
   rig.scale.set(family.assetScaleWorldPerPixel);
   const base = new PIXI.Sprite(baseTexture);
   base.anchor.set(.5);
   const head = new PIXI.Container();
   const first = frameTexture(atlas,clipSet.Idle.frameRects[0]);
   const sprite = new PIXI.Sprite(first);
   sprite.anchor.set(.5);
   head.addChild(sprite);
   rig.addChild(base,head);
   stage.addChild(rig);
   for (const [name,clip] of Object.entries(clipSet)) {
    const texture = frameTexture(atlas,clip.frameRects[Math.floor(clip.frameCount/2)]);
    ok(texture.valid && texture.width===192 && texture.height===192,family.id+' '+tier+' slices '+name);
    texture.destroy(false);
   }
   const baseBefore = base.toGlobal(new PIXI.Point(0,0));
   for (const degrees of [0,45,90,135,180,225,270,315]) {
    const angle = degrees*Math.PI/180;
    head.rotation = angle;
    for (let i=0; i<details.rig.muzzlePoints.length; i++) {
     const fire = clipSet['Fire_M'+(i+1)];
     const frame = Math.floor(fire.frameCount/2);
     const [mx,my] = fire.muzzlePointsByFrame[frame][i];
     const local = [mx-96,my-96];
     const global = head.toGlobal(new PIXI.Point(...local));
     const actual = stage.toLocal(global);
     const scaled = family.assetScaleWorldPerPixel;
     const expected = [
      x+scaled*(local[0]*Math.cos(angle)-local[1]*Math.sin(angle)),
      y+scaled*(local[0]*Math.sin(angle)+local[1]*Math.cos(angle)),
     ];
     ok(near(actual.x,expected[0]) && near(actual.y,expected[1]),family.id+' '+tier+' muzzle '+i+' at '+degrees+' degrees');
     transforms++;
    }
    const baseAfter = base.toGlobal(new PIXI.Point(0,0));
    ok(base.rotation===0 && near(baseBefore.x,baseAfter.x) && near(baseBefore.y,baseAfter.y),
       family.id+' '+tier+' base fixed at '+degrees+' degrees');
   }
   testedTiers++;
   if (tier!=='E3') {
    rig.destroy({children:true,texture:false,baseTexture:false});
    first.destroy(false);
    atlas.destroy(true);
    baseTexture.destroy(true);
    continue;
   }
   head.rotation = Math.atan2(hy-y,hx-x)+Math.PI/2;
   const fire = clipSet.Fire_M1;
   sprite.texture = frameTexture(atlas,fire.frameRects[1]);
   first.destroy(false);
   const effect = family.effects.map(file=>assets[file]).find(asset=>asset.clip.animationName===effectNames[familyIndex]);
   const fxAtlas = await loadTexture(effect.file);
   const fx = new PIXI.Sprite(frameTexture(fxAtlas,effect.clip.frameRects[Math.floor(effect.clip.frameCount*.32)]));
   fx.anchor.set(.5);
   fx.position.set(hx,hy);
   fx.width = effect.renderSizeWorldPx;
   fx.height = effect.renderSizeWorldPx;
   stage.addChildAt(fx,0);
   const shot = assets[family.projectiles[0]];
   const shotAtlas = await loadTexture(shot.file);
   const [mx,my] = fire.muzzlePointsByFrame[1][0];
   const mouth = stage.toLocal(head.toGlobal(new PIXI.Point(mx-96,my-96)));
   const pod = new PIXI.Sprite(frameTexture(shotAtlas,shot.clip.frameRects[2]));
   pod.anchor.set(.5);
   pod.rotation = head.rotation;
   pod.width = shot.renderSizeWorldPx;
   pod.height = shot.renderSizeWorldPx;
   pod.position.set((mouth.x+hx)/2,(mouth.y+hy)/2);
   stage.addChild(pod);
   const label = new PIXI.Text(family.name.toUpperCase()+'  E3',{fontFamily:'Arial',fontSize:17,fill:0xffedd2,
                                                                stroke:0x170e2f,strokeThickness:4,fontWeight:'bold'});
   label.anchor.set(.5);
   label.position.set(x,y+75);
   stage.addChild(label);
  }
 }
 const caption = new PIXI.Text('FUSION ART PREVIEW  /  ROTATION, PROJECTILE AND IMPACT',
                               {fontFamily:'Arial',fontSize:17,fill:0xe7d5ff,stroke:0x1d1534,strokeThickness:4});
 caption.position.set(205,1060);
 stage.addChild(caption);
 step(5);
 return {checks,testedTiers,muzzleTransforms:transforms,browserDecodedWav:decoded,rapidPreviewPeak:largestPeak,
         authoringPreviewOnly:true,nativeIndexEntries:6};
})()
