// One permanent Fusion discovery source for notification, variants and Index.
// Storage follows the existing audio-settings mechanism; monster session state stays separate.
const scene=runtimeScene,game=scene.getGame(),sv=scene.getVariables(),catalog=sv.get('FusionCatalog').toJSObject();
let archive=game.__fusionArchive;
if(!archive?.persistent){
 const oldFound=[...(archive?.found||[])],key='celestialVoidFusionDiscovery.v1';let state={version:1,entries:{}},storageOK=true,saveNeeded=false;
 try{const raw=JSON.parse(localStorage.getItem(key)||'null');if(raw&&typeof raw==='object'&&!Array.isArray(raw)){state={...raw,entries:raw.entries&&typeof raw.entries==='object'&&!Array.isArray(raw.entries)?raw.entries:{}};state.version=raw.version||1;}}catch(e){storageOK=false;}
 archive=game.__fusionArchive={persistent:true,storageKey:key,state,storageOK,catalog,found:new Set(),revision:0,queue:[],active:null,stats:{unlockedVariants:0,shown:0,completed:0,sounds:0,writes:0}};
 const a=archive;
 a.definition=id=>a.catalog.find(d=>d.Id===id);
 a.recipeKey=parts=>parts.map(p=>{
  if(p?.getVariables){const v=p.getVariables();return(v.get('TowerType').getAsString()==='StarburstCannon'?'StarburstCannon':p.getName())+':'+v.get('Path1Level').getAsNumber()+'-'+v.get('Path2Level').getAsNumber();}
  return p.Type+':'+p.Path1+'-'+p.Path2;
 }).sort().join('|');
 a.resolve=parts=>{const k=a.recipeKey(parts);for(const d of a.catalog)for(const v of d.Variants||[])if(a.recipeKey(v.Recipe)===k)return{id:d.Id,variant:v.Id};return null;};
 a.record=id=>{let r=a.state.entries[id];if(!r||typeof r!=='object'||Array.isArray(r)){r={discovered:r===true,variants:{}};a.state.entries[id]=r;}if(!r.variants||typeof r.variants!=='object'||Array.isArray(r.variants))r.variants={};return r;};
 a.has=id=>a.found.has(id);
 a.hasVariant=(id,variant)=>a.state.entries[id]?.variants?.[variant]===true;
 a.progress=id=>{const d=a.definition(id),variants=d?.Variants||[];return{found:variants.filter(v=>a.hasVariant(id,v.Id)).length,total:variants.length};};
 a.save=()=>{try{localStorage.setItem(key,JSON.stringify(a.state));a.storageOK=true;a.stats.writes++;return true;}catch(e){a.storageOK=false;return false;}};
 const legacy=[...oldFound,...(Array.isArray(state.found)?state.found:[])];
 for(const id of legacy)if(typeof id==='string'){a.record(id).discovered=true;saveNeeded=true;}
 for(const id of Object.keys(state.entries)){
  const r=a.record(id),d=a.definition(id);if(r.discovered===true||Object.values(r.variants).some(v=>v===true)){
   a.found.add(id);r.discovered=true;
   // A legacy Pure unlock implies its sole variant. Hybrid progress never fans out.
   if(d?.Kind==='Pure'&&d.Variants?.length===1&&!Object.keys(r.variants).length){r.variants[d.Variants[0].Id]=true;saveNeeded=true;}
  }
 }
 a.discover=(id,variant)=>{
  const d=a.definition(id);if(!d)return false;
  variant=variant||(d.Kind==='Pure'&&d.Variants.length===1?d.Variants[0].Id:'');
  if(!d.Variants.some(v=>v.Id===variant)||a.hasVariant(id,variant))return false;
  const first=!a.has(id),r=a.record(id);r.discovered=true;r.variants[variant]=true;a.found.add(id);a.revision++;a.stats.unlockedVariants++;a.save();a.queue.push({id,variant,first});return true;
 };
 a.discoverRecipe=parts=>{const r=a.resolve(parts);return r?{...r,unlocked:a.discover(r.id,r.variant)}:null;};
 if(saveNeeded)a.save();
}
let view=scene.__fusionDiscovery;
if(!view){
 // Refresh definitions on scene reload; records and queue remain one shared source.
 archive.catalog=catalog;
 view=scene.__fusionDiscovery={archive,disposed:false};
 const layer=scene.getLayer('DiscoveryUI'),parent=layer.getRenderer().getRendererObject(),root=view.root=new PIXI.Container(),mask=view.mask=new PIXI.Graphics();
 root.interactive=false;root.interactiveChildren=false;root.visible=false;root.zIndex=204;mask.zIndex=203;mask.interactive=false;root.mask=mask;parent.addChild(mask,root);
 const panel=new PIXI.Graphics();root.addChild(panel);panel.lineStyle(1.5,0xd1ae70,.95).beginFill(0x1a1030,.98).drawRoundedRect(0,0,440,132,12).endFill();panel.lineStyle(1,0x76609c,.8).drawRoundedRect(5,5,430,122,9);panel.lineStyle(1,0xa8cbee,.4).moveTo(112,29).lineTo(420,29);panel.lineStyle(1,0xc1a46a,.8).drawCircle(59,67,41);
 for(const [x,y]of [[16,16],[424,16],[16,116],[424,116]])panel.beginFill(0xe2c98d).drawPolygon([x,y-4,x+4,y,x,y+4,x-4,y]).endFill();
 const text=(s,x,y,size,color,bold=false)=>{const t=new PIXI.Text(s,{fontFamily:'Arial',fontSize:size,fill:color,fontWeight:bold?'bold':'normal'});t.position.set(x,y);root.addChild(t);return t;};
 text('CELESTIAL ARCHIVE',112,12,10,0xd5bd87,true).style.letterSpacing=2;
 view.heading=text('NEW FUSION DISCOVERED!',112,36,13,0xa6d9ff,true);view.name=text('',112,56,21,0xf3e8ff,true);view.detail=text('',112,85,11,0xb7a6cd);text('Fusion Index Updated',112,103,11,0x97bbdf);
 view.icon=new PIXI.Sprite();view.icon.anchor.set(.5);view.icon.position.set(59,67);root.addChild(view.icon);
 view.stars=[];for(let i=0;i<6;i++){const s=new PIXI.Graphics();s.beginFill(i%2?0xcaa1ff:0xa4dcff).drawPolygon([0,-3,1,-1,3,0,1,1,0,3,-1,1,-3,0,-1,-1]).endFill();root.addChild(s);view.stars.push(s);}
 view.bind=event=>{
  const def=archive.definition(event.id),object=game.getSceneAndExtensionsData(scene.getName()).sceneData.objects.find(o=>o.name==='IndexTowerImage'),animation=object.animations.find(a=>a.name===def.Animation);
  const texture=game.getImageManager().getPIXITexture(animation.directions[0].sprites[0].image);view.icon.texture=texture;view.icon.scale.set(Math.min(76/texture.width,76/texture.height));
  view.heading.text=event.first?'NEW FUSION DISCOVERED!':'NEW VARIANT DISCOVERED!';view.name.text=def.Name;view.name.scale.set(1);view.name.scale.set(Math.min(1,304/Math.max(1,view.name.width)));view.detail.text=def.Kind+' Fusion revealed';view.bound=event;
 };
 view.update=()=>{
  if(view.disposed)return;
  if(sv.get('FusionActive').getAsBoolean()||sv.get('IndexOpen').getAsBoolean()||scene.__monsterDiscovery?.active){root.visible=false;mask.visible=false;return;}
  const dt=Math.max(0,scene.getTimeManager().getElapsedTime()/Math.max(.001,scene.getTimeManager().getTimeScale())/1000);
  if(archive.active){archive.active.age+=dt;if(archive.active.age>=4){archive.active=null;archive.stats.completed++;}}
  if(!archive.active&&archive.queue.length){archive.active={...archive.queue.shift(),age:0};archive.stats.shown++;if(scene.__audio?.play('DiscoveryUnlock'))archive.stats.sounds++;}
  const active=archive.active;if(!active){root.visible=false;mask.visible=false;return;}if(view.bound!==active)view.bind(active);
  layer.setCameraZoom(1);layer.setCameraX(game.getGameResolutionWidth()/2);layer.setCameraY(game.getGameResolutionHeight()/2);
  const g=scene.__monsterDiscovery.geometry(),age=active.age,smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);},enter=smooth(age/.4),exit=smooth((age-3.2)/.8),reveal=smooth((age-.4)/.6);
  view.screenRect=g;const maskKey=[g.x,g.y,g.w,g.h,g.scale].join(':');if(view.maskKey!==maskKey){mask.clear().beginFill(0xffffff).drawRect(g.x-6*g.scale,g.y-6*g.scale,g.w+12*g.scale,g.h+12*g.scale).endFill();view.maskKey=maskKey;}
  root.visible=true;mask.visible=true;root.alpha=enter*(1-exit);root.scale.set(g.scale);root.position.set(g.x,g.y-(1-enter)*150*g.scale-exit*150*g.scale);const c=Math.round(255*reveal);view.icon.tint=(c<<16)|(c<<8)|c;view.name.alpha=smooth((age-1)/.2);
  view.stars.forEach((s,i)=>{s.position.set(59+Math.cos(age+i)*43,67+Math.sin(age+i)*40);s.alpha=reveal*.65;});
 };
 view.dispose=()=>{if(view.disposed)return;view.disposed=true;root.mask=null;root.destroy({children:true,texture:false,baseTexture:false});mask.destroy();};
 if(!gdjs.__fusionArchiveCallbacks){gdjs.__fusionArchiveCallbacks=true;gdjs.callbacksRuntimeScenePostEvents.push(s=>s.__fusionDiscovery?.update());gdjs.callbacksRuntimeSceneUnloading.push(s=>s.__fusionDiscovery?.dispose());}
}
