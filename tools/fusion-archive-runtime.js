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
  const first=!a.has(id),r=a.record(id);r.discovered=true;r.variants[variant]=true;a.found.add(id);a.revision++;a.stats.unlockedVariants++;a.save();a.queue.push({id,variant,first});scene.__discoveryToast?.enqueue('fusion',a.queue.at(-1));return true;
 };
 a.discoverRecipe=parts=>{const r=a.resolve(parts);return r?{...r,unlocked:a.discover(r.id,r.variant)}:null;};
 if(saveNeeded)a.save();
}
let view=scene.__fusionDiscovery;
if(!view){
 // Refresh definitions on scene reload; records and queue remain one shared source.
 archive.catalog=catalog;
 view=scene.__fusionDiscovery={archive,disposed:false};
 const layer=scene.getLayer('DiscoveryUI'),shared=scene.__discoveryToast;
 const visual=shared.create(204);Object.assign(view,visual);const {root,mask}=visual;
 view.bind=event=>{
  const def=archive.definition(event.id),object=game.getSceneAndExtensionsData(scene.getName()).sceneData.objects.find(o=>o.name==='IndexTowerImage'),animation=object.animations.find(a=>a.name===def.Animation);
  const texture=game.getImageManager().getPIXITexture(animation.directions[0].sprites[0].image);view.icon.texture=texture;view.icon.scale.set(Math.min(38/texture.width,40/texture.height));
  view.heading.text=event.first?'NEW DISCOVERY':'NEW VARIANT';view.name.text=event.first?def.Name:def.Variants.find(v=>v.Id===event.variant)?.Name||def.Name;view.name.scale.set(1);view.name.scale.set(Math.min(1,18/Math.max(1,view.name.height),198/Math.max(1,view.name.width)));view.detail.text=def.Kind+' Fusion Archive Updated';view.bound=event;
 };
 view.update=()=>{
  if(view.disposed)return;
  if(sv.get('IndexOpen').getAsBoolean()||scene.__monsterDiscovery?.active||!archive.active&&!shared.canBegin('fusion')){root.visible=false;mask.visible=false;return;}
  const dt=Math.max(0,scene.getTimeManager().getElapsedTime()/Math.max(.001,scene.getTimeManager().getTimeScale())/1000);
  if(archive.active){archive.active.age+=dt;if(archive.active.age>=shared.duration){archive.active=null;archive.stats.completed++;}}
  if(!archive.active&&archive.queue.length&&shared.canBegin('fusion')){const event=archive.queue.shift();shared.take('fusion',event);archive.active={...event,age:0};archive.stats.shown++;if(scene.__audio?.play('DiscoveryUnlock'))archive.stats.sounds++;}
  const active=archive.active;if(!active){root.visible=false;mask.visible=false;return;}if(view.bound!==active)view.bind(active);
  layer.setCameraZoom(1);layer.setCameraX(game.getGameResolutionWidth()/2);layer.setCameraY(game.getGameResolutionHeight()/2);
  shared.paint(view,active.age);
 };
 view.dispose=()=>{if(view.disposed)return;view.disposed=true;root.mask=null;root.destroy({children:true,texture:false,baseTexture:false});mask.destroy();};
 if(!gdjs.__fusionArchiveCallbacks){gdjs.__fusionArchiveCallbacks=true;gdjs.callbacksRuntimeScenePostEvents.push(s=>s.__fusionDiscovery?.update());gdjs.callbacksRuntimeSceneUnloading.push(s=>s.__fusionDiscovery?.dispose());}
}
