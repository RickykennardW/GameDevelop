// A durable reset intent, not a save copy. Never clear unrelated preferences.
const resetGame=runtimeScene.getGame();
if(!resetGame.__freshStart){
 const data=resetGame.getSceneAndExtensionsData('Levels').sceneData;
 const config=new gdjs.VariablesContainer(data.variables).get('CampaignConfig').toJSObject();
 const service=resetGame.__freshStart={intentKey:'starfallBastionFreshStart.v1',keys:[config.StorageKey,'celestialVoidFusionDiscovery.v1','celestialVoidMonsterDiscovery.v1'],target:config.LevelsScene,pending:false,busy:false,error:'',resets:0};
 service.clearMemory=()=>{
  const c=resetGame.__campaign;
  if(c){c.save={Version:1,Completed:{},SelectTutorialDone:false,GameTutorialDone:false};c.active=null;c.chapter=config.Levels[0].Chapter;c.selected=config.Levels[0].Id;c.storageOK=true;}
  const a=resetGame.__fusionArchive;
  if(a){a.state={version:1,entries:{}};a.found.clear();a.queue.length=0;a.active=null;a.revision++;for(const k of Object.keys(a.stats))a.stats[k]=0;}
  resetGame.__celestialMonsterDiscoverySession?.resetForNewGame();
  delete resetGame.__celestialMonsterDiscovery;
  const order=resetGame.__celestialDiscoveryOrder;if(order){order.tickets.clear();order.next=0;}
 };
 service.commit=()=>{
  if(service.busy)return false;service.busy=true;service.error='';
  try{
   // Commit intent before the first removal. A crash or storage error is
   // completed forward on the next boot, before either archive/save loads.
   localStorage.setItem(service.intentKey,'1');
   if(localStorage.getItem(service.intentKey)!=='1')throw Error('Reset intent was not saved');
   service.pending=true;
   for(const key of service.keys){localStorage.removeItem(key);if(localStorage.getItem(key)!==null)throw Error('Progress data could not be cleared');}
   localStorage.removeItem(service.intentKey);
   if(localStorage.getItem(service.intentKey)!==null)throw Error('Reset could not be finalized');
   service.clearMemory();service.pending=false;service.resets++;return true;
  }catch(e){service.error='Fresh Start could not finish. Allow local storage, then retry.';return false;}
  finally{service.busy=false;}
 };
 service.leave=scene=>{
  // Native scene replacement unloads towers, projectiles, wave/currency state,
  // UI listeners and temporary placement. The existing Levels tutorial owns
  // the first-time flow; mission 1-1 then starts its own step-zero tutorial.
  scene.__devCheats?.close();scene.__fusion?.finish();scene.__freePlacement?.stop();scene.__obstaclePanel?.close();
  if(scene.__audio?.dirty)scene.__audio.persist();
  resetGame.__starfallMenuAudioReady=!!scene.__audio?.unlocked||!!resetGame.__starfallMenuAudioReady;
  gdjs.evtTools.runtimeScene.replaceScene(scene,service.target,false);
 };
 service.recovery=scene=>{
  if(service.overlay)return;
  // Only a failed, already-confirmed transaction uses this boot-time blocker.
  // DOM input remains available when the native game loop is paused.
  const overlay=service.overlay=document.createElement('div'),box=document.createElement('div'),title=document.createElement('strong'),message=document.createElement('p'),retry=document.createElement('button');
  overlay.setAttribute('data-celestial-reset-recovery','');overlay.setAttribute('role','alertdialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Fresh Start incomplete');
  Object.assign(overlay.style,{position:'fixed',inset:'0',zIndex:'3000',display:'grid',placeItems:'center',background:'#040617dd',padding:'16px',fontFamily:'Arial, sans-serif',color:'#ded7ed'});
  Object.assign(box.style,{maxWidth:'360px',padding:'22px',border:'1px solid #bd9b6a',borderRadius:'8px',background:'#101329'});title.textContent='Fresh Start incomplete';message.textContent=service.error+' Gameplay is held until the reset is complete.';retry.textContent='Retry Fresh Start';Object.assign(retry.style,{padding:'10px 14px',background:'#51304c',border:'1px solid #d6a08c',borderRadius:'4px',color:'#fff',cursor:'pointer'});
  box.append(title,message,retry);overlay.append(box);document.body.append(overlay);resetGame.pause(true);retry.focus();
  retry.onclick=()=>{if(!service.commit()){message.textContent=service.error;return;}overlay.remove();service.overlay=null;service.resumeScene=scene;resetGame.pause(false);};
 };
 try{service.pending=localStorage.getItem(service.intentKey)!==null;}catch(e){}
 if(service.pending){if(service.commit())service.leave(runtimeScene);else service.recovery(runtimeScene);}
}
// DOM retry runs outside scene events. Request the transition on the next native
// event frame so RuntimeScene does not discard an out-of-frame change request.
if(resetGame.__freshStart.resumeScene===runtimeScene){resetGame.__freshStart.resumeScene=null;resetGame.__freshStart.leave(runtimeScene);}
