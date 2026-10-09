// Original soundtrack/foley. Audio-only observers preserve native gameplay returns.
const scene=runtimeScene,sv=scene.getVariables(),game=scene.getGame(),manager=scene.getSoundManager();
let a=scene.__audio;
if(!a){
 const config=sv.get('AudioConfig').toJSObject(),defaults={Master:config.Master,Music:config.MusicVolume,SFX:config.SFXVolume,UI:config.UIVolume,MuteMusic:false,MuteSFX:false};
 let saved=game.__celestialAudioSettings;
 if(!saved)try{saved=JSON.parse(localStorage.getItem(config.StorageKey)||'null');}catch(e){}
 const settings={...defaults};for(const key of ['Master','Music','SFX','UI'])if(Number.isFinite(saved?.[key]))settings[key]=Math.max(0,Math.min(100,saved[key]));
 for(const key of ['MuteMusic','MuteSFX'])if(typeof saved?.[key]==='boolean')settings[key]=saved[key];
 game.__celestialAudioSettings=settings;
 a=scene.__audio={config,settings,now:0,unlocked:false,disposed:false,last:{wave:sv.get('Wave').getAsNumber(),reward:sv.get('LastRewardedWave').getAsNumber(),lives:sv.get('Lives').getAsNumber(),index:false,category:'Towers',selected:0,mode:'Waiting'},preparation:false,flow:'MENU',desired:'',fade:null,pending:null,duck:1,duckUntil:0,goldPending:0,goldStarted:0,lastGold:-10,voices:[],cooldowns:new Map(),hooks:[],objects:{},ui:{open:false,down:false,pressed:'',drag:''},stats:{requested:{},played:{},dropped:{},bgmStarts:{},maxMusic:0,maxVoices:0,baseEvents:0,casts:0,applies:0,goldBatches:0},history:[]};
 a.music=[1000,1001].map(channel=>({channel,file:'',id:'',gain:0,target:0,from:0,sound:null,prepared:null,started:false}));
 for(const [group,channels]of [['low',[1010,1011,1012,1013]],['medium',[1014,1015,1016]],['high',[1017,1018,1019]],['ui',[1020,1021]]])for(const channel of channels)a.voices.push({group,channel,end:0,key:'',sound:null,gain:0});
 const bump=(where,key)=>where[key]=(where[key]||0)+1;
 a.log=(type,key)=>{a.history.push({type,key,time:a.now});if(a.history.length>256)a.history.shift();};
 a.persist=()=>{game.__celestialAudioSettings=a.settings;try{localStorage.setItem(config.StorageKey,JSON.stringify(a.settings));a.storageOK=true;}catch(e){a.storageOK=false;}a.dirty=false;};
 a.mixVolume=(group,gain=1)=>a.settings.Master/100*(group==='ui'?a.settings.UI:a.settings.SFX)/100*gain*(a.settings.MuteSFX?0:1);
 a.applyMix=()=>{
  for(const s of a.music)if(s.sound)s.sound.setVolume(s.gain*a.settings.Master/100*a.settings.Music/100*a.duck*(a.settings.MuteMusic?0:1));
  for(const v of a.voices)if(v.sound)v.sound.setVolume(a.mixVolume(v.group,v.gain));
 };
 a.setSetting=(key,value)=>{
  if(['Master','Music','SFX','UI'].includes(key))value=Math.max(0,Math.min(100,Math.round(Number(value)||0)));
  else if(['MuteMusic','MuteSFX'].includes(key))value=!!value;else return;
  a.settings[key]=value;a.dirty=true;a.applyMix();if(key==='MuteSFX'&&value)for(const v of a.voices){v.sound?.stop();v.end=0;}
 };
 a.play=(key,rate=1)=>{
  const def=config.SFX[key];if(!def)return false;bump(a.stats.requested,key);
  if(!a.unlocked||a.disposed||a.settings.MuteSFX||a.settings.Master===0){bump(a.stats.dropped,key);return false;}
  if(a.now<(a.cooldowns.get(key)||0)){bump(a.stats.dropped,key);return false;}
  const pool=a.voices.filter(v=>v.group===def.Group);let slot=pool.find(v=>a.now>=v.end||v.sound?.stopped());
  if(!slot&&def.Group==='high')slot=pool.reduce((old,v)=>v.end<old.end?v:old);
  if(!slot){bump(a.stats.dropped,key);return false;}
  slot.sound?.stop();const pitch=rate*(def.VaryPitch?1+(((a.stats.requested[key]*17)%7)-3)*.005:1);
  manager.playSoundOnChannel(def.File,slot.channel,false,a.mixVolume(def.Group,def.Gain)*100,pitch);
  slot.sound=manager.getSoundOnChannel(slot.channel);slot.end=a.now+def.Duration/pitch;slot.key=key;slot.gain=def.Gain;
  a.cooldowns.set(key,a.now+def.Cooldown);bump(a.stats.played,key);a.log('sfx',key);
  if(def.Group==='high')a.duckUntil=Math.max(a.duckUntil,a.now+1.25);
  a.stats.maxVoices=Math.max(a.stats.maxVoices,a.voices.filter(v=>v.end>a.now).length);return true;
 };
 a.ensureLimiter=()=>{
  const ctx=typeof Howler!=='undefined'?Howler.ctx:null;
  if(!ctx||!Howler.masterGain||game.__celestialAudioLimiter?.context===ctx)return;
  game.__celestialAudioLimiter?.disconnect();
  const node=ctx.createDynamicsCompressor();node.threshold.value=-6;node.knee.value=6;node.ratio.value=12;node.attack.value=.003;node.release.value=.12;
  Howler.masterGain.disconnect();Howler.masterGain.connect(node);node.connect(ctx.destination);game.__celestialAudioLimiter=node;
 };
 a.unlock=()=>{
  if(a.disposed||a.unlocked)return;
  // Howler creates its context lazily; initialise it inside the trusted gesture.
  if(typeof Howler!=='undefined')Howler.volume();
  const ctx=typeof Howler!=='undefined'?Howler.ctx:null;
  const resume=ctx&&ctx.state!=='running'?ctx.resume():Promise.resolve();
  Promise.resolve(resume).then(()=>{if(a.disposed)return;a.unlocked=true;
   a.ensureLimiter();
  }).catch(()=>{});
 };
 a.gesture=()=>a.unlock();document.addEventListener('pointerdown',a.gesture);document.addEventListener('keydown',a.gesture);document.addEventListener('touchstart',a.gesture,{passive:true});
 a.release=s=>{s.sound?.stop();if(s.file)manager.unloadAudio(s.file,false);s.file='';s.id='';s.gain=0;s.started=false;s.prepared=null;s.sound=null;};
 a.requestMusic=id=>{
  const file=id?config.Music[id]?.File:'';if(!a.unlocked){a.desired=id;return;}
  if(a.fade&&file&&!a.music.some(s=>s.file===file)&&a.music.every(s=>s.file)){a.pending=id;return;}
  if(file&&a.music.some(s=>s.file===file&&s.target===1)){a.desired=id;return;}
  a.desired=id;a.pending=null;let target=file?a.music.find(s=>s.file===file):null;
  if(file&&!target){target=a.music.find(s=>!s.file);if(!target){a.pending=id;return;}
   target.file=file;target.id=id;target.gain=0;target.started=false;target.prepared=manager.createHowlerSound(file,false,0,true,1);
  }
  for(const s of a.music){s.from=s.gain;s.target=s===target?1:0;}
  a.fade={elapsed:0,wait:!!target&&!target.started};a.log('music',id||'FADE_OUT');
 };
 a.updateMusic=dt=>{
  if(!a.unlocked)return;
  a.ensureLimiter();
  const target=a.music.find(s=>s.target===1);
  if(target&&!target.started&&target.prepared?.isLoaded()){
   manager.playSoundOnChannel(target.file,target.channel,true,0,1);target.sound=manager.getSoundOnChannel(target.channel);target.started=true;target.prepared=null;bump(a.stats.bgmStarts,target.id);
   if(a.fade){a.fade.wait=false;a.fade.elapsed=0;}
  }
  if(a.fade&&!a.fade.wait){a.fade.elapsed+=dt;const p=Math.min(1,a.fade.elapsed/config.CrossfadeSeconds),smooth=p*p*(3-2*p);
   for(const s of a.music)s.gain=s.from+(s.target-s.from)*smooth;
   if(p>=1){for(const s of a.music)if(s.file&&s.target===0)a.release(s);a.fade=null;if(a.pending!==null){const pending=a.pending;a.pending=null;a.requestMusic(pending);}}
  }
  const duckTarget=a.now<a.duckUntil?.68:1;a.duck+=(duckTarget-a.duck)*Math.min(1,dt/(duckTarget<1?.08:.65));
  a.applyMix();a.stats.maxMusic=Math.max(a.stats.maxMusic,a.music.filter(s=>s.started).length);
 };
 a.flowState=()=>{
  if(sv.get('GameOver').getAsBoolean())return sv.get('Lives').getAsNumber()>0&&sv.get('Wave').getAsNumber()>=sv.get('MaximumWave').getAsNumber()?'VICTORY':'GAME_OVER';
  if(sv.get('WaveActive').getAsBoolean())return sv.get('WaveIsMilestone').getAsBoolean()?'MILESTONE_COMBAT':'NORMAL_COMBAT';
  return sv.get('Wave').getAsNumber()===0&&!a.preparation&&!scene.__freePlacement?.active&&!scene.getObjects('StarCannonTower').length?'MENU':'PREPARATION';
 };
 a.hook=(object,name,around)=>{if(!object||!object[name]||object[name].__audioObserver)return;const original=object[name];const wrapped=function(...args){return around(original,this,args);};wrapped.__audioObserver=true;object[name]=wrapped;a.hooks.push({object,name,original,wrapped});};
 a.attachEnemy=e=>{const id=e.getUniqueId();if(e.__audioOwner===a&&e.__audioEnemyId===id)return;e.__audioOwner=a;e.__audioEnemyId=id;
  const cleanup=()=>{if(!a.disposed&&e.getUniqueId()===id&&e.getVariables().get('PathFinished').getAsBoolean()&&!e.getBehavior('Health').IsDead())a.pendingBase=(a.pendingBase||0)+1;e.unregisterDestroyCallback(cleanup);};e.__audioCleanup=cleanup;e.registerDestroyCallback(cleanup);
 };
 a.noteDeath=e=>{const v=e.getVariables();if(v.get('PathFinished').getAsBoolean())return;a.play(v.get('EnemyType').getAsString()==='VoidGolem'?'EliteEnemyDeath':'CommonEnemyDeath');if(!a.goldPending)a.goldStarted=a.now;a.goldPending+=v.get('GoldReward').getAsNumber();};
 a.install=()=>{
  const star=scene.__starCannon,g=scene.__voidGolem;
  a.hook(scene.__novaWisp,'ensure',(fn,obj,args)=>{const result=fn.apply(obj,args);a.attachEnemy(args[0]);return result;});
  for(const e of scene.getObjects('Enemy'))a.attachEnemy(e);
  a.hook(star,'upgrade',(fn,obj,args)=>{const result=fn.apply(obj,args);if(result){const level=args[0].getVariables().get(args[1]===1?'Path1Level':'Path2Level').getAsNumber();a.play(level>=3?'TowerMajorUpgrade':'TowerUpgrade');}else a.play('InvalidAction');return result;});
  a.hook(star,'fire',(fn,obj,args)=>{a.firing=(a.firing||0)+1;let result;try{result=fn.apply(obj,args);}finally{a.firing--;}if(result)a.play('StarCannonFire');return result;});
  a.hook(star,'effect',(fn,obj,args)=>{const result=fn.apply(obj,args);if(!a.firing)a.play('ProjectileImpact');return result;});
  a.hook(star,'deal',(fn,obj,args)=>{const result=fn.apply(obj,args);if(result>0&&!args[1].getBehavior('Health').IsDead())a.play('EnemyHit');return result;});
  a.hook(scene.__novaWisp,'death',(fn,obj,args)=>{const result=fn.apply(obj,args);a.noteDeath(args[0]);return result;});
  for(const [obj,stateKey]of [[scene.__voidHound,'__houndState'],[scene.__voidCommon,'__voidCommonState'],[g,'__golemState']])a.hook(obj,'beginDeath',(fn,owner,args)=>{const before=args[0][stateKey]?.dying,result=fn.apply(owner,args);if(!before&&args[0][stateKey]?.dying)a.noteDeath(args[0]);return result;});
  a.hook(g,'beforeMove',(fn,obj,args)=>{const before=args[0].__golemState?.castCount||0,result=fn.apply(obj,args);if((args[0].__golemState?.castCount||0)>before){a.stats.casts++;a.play('VoidGolemSkillCast',scene.getTimeManager().getTimeScale());}return result;});
  a.hook(g?.fort,'apply',(fn,obj,args)=>{const result=fn.apply(obj,args);if(result.length){a.stats.applies++;a.play('VoidFortificationApply');}return result;});
  a.hook(scene.__obstaclePanel,'clear',(fn,obj,args)=>{const result=fn.apply(obj,args);a.play(result?'UIClick':'InvalidAction');return result;});
 };
 a.ensure=(key,name,z)=>{if(!a.objects[key]){const o=scene.createObject(name);o.setLayer('AudioUI');o.setZOrder(z);a.objects[key]=o;}return a.objects[key];};
 a.geometry=()=>{const width=game.getGameResolutionWidth(),height=game.getGameResolutionHeight(),hud=scene.getObjects('HUDPanel')[0];const point=hud?scene.getLayer('UI').convertInverseCoords(hud.getX()+hud.getWidth(),hud.getY()+6,0,[0,0]):[8,16];const x=Math.max(8,Math.min(width-40,point[0]+8)),y=point[1];return{button:{x,y,w:32,h:32},panel:{x:Math.max(8,Math.min(width-316,x)),y:Math.max(8,Math.min(height-292,y+40)),w:308,h:276}};};
 a.pre=()=>{
  if(a.disposed)return;const dt=scene.getTimeManager().getElapsedTime()/Math.max(.001,scene.getTimeManager().getTimeScale())/1000;a.dt=Math.min(.2,Math.max(0,dt));a.now+=a.dt;
  const input=game.getInputManager(),down=input.isMouseButtonPressed(0),released=!down&&a.ui.down,pressed=down&&!a.ui.down;
  const geometry=a.geometry(),mx=gdjs.evtTools.input.getCursorX(scene,'AudioUI',0),my=gdjs.evtTools.input.getCursorY(scene,'AudioUI',0),inside=r=>mx>=r.x&&mx<r.x+r.w&&my>=r.y&&my<r.y+r.h;
  if(sv.get('IndexBlocksInput').getAsBoolean()){a.ui.open=false;a.ui.drag='';}
  let consume=false,key='';const b=geometry.button,p=geometry.panel;
  if(!sv.get('IndexBlocksInput').getAsBoolean()){
   if(inside(b))key='Speaker';
   if(a.ui.open){consume=true;if(inside({x:p.x+p.w-36,y:p.y+8,w:28,h:28}))key='Close';
    for(const [i,label]of ['Master','Music','SFX','UI'].entries())if(inside({x:p.x+114,y:p.y+51+i*37,w:136,h:26}))key=label;
    if(inside({x:p.x+18,y:p.y+211,w:132,h:28}))key='MuteMusic';if(inside({x:p.x+160,y:p.y+211,w:132,h:28}))key='MuteSFX';
    if(pressed&&!inside(p)&&key!=='Speaker'){a.ui.open=false;a.ui.pressed='';consume=true;}
    if(gdjs.evtTools.input.wasKeyJustPressed(scene,'Escape')){a.ui.open=false;a.ui.pressed='';consume=true;}
   }
   if(inside(b))consume=true;
   if(pressed&&key){a.ui.pressed=key;if(['Master','Music','SFX','UI'].includes(key))a.ui.drag=key;}
   if(a.ui.drag&&down){a.setSetting(a.ui.drag,(mx-p.x-114)/136*100);consume=true;}
   if(released&&a.ui.pressed){consume=true;const chosen=a.ui.pressed;
    if(chosen===key){if(chosen==='Speaker')a.ui.open=!a.ui.open;else if(chosen==='Close')a.ui.open=false;else if(chosen==='MuteMusic'||chosen==='MuteSFX')a.setSetting(chosen,!a.settings[chosen]);a.play('UIClick');}
    a.ui.pressed='';a.ui.drag='';if(a.dirty)a.persist();
   }
  }
  sv.get('AudioUIConsumesClick').setBoolean(consume);sv.get('AudioPanelOpen').setBoolean(a.ui.open);a.ui.pointer=consume;
  const shop=scene.__towerShopUI;
  if(released&&!consume&&shop?.pressedCard>=0&&shop.pressedCard===shop.hovered){const item=shop.cards[shop.pressedCard].item;a.play(sv.get('Money').getAsNumber()<item.Cost?'InvalidAction':'UIClick');}
  const panel=scene.__selectedPanel;
  if(released&&!consume&&panel?.pressed==='Sell'&&panel.tower&&panel.pressedTower===panel.tower.getVariables().get('TowerId').getAsNumber()){
   const x=gdjs.evtTools.input.getCursorX(scene,'SelectedTowerUI',0),y=gdjs.evtTools.input.getCursorY(scene,'SelectedTowerUI',0);if(x>=16&&x<304&&y>=614&&y<662)a.pendingSell=panel.pressedTower;
  }
  if(pressed&&!consume&&scene.__freePlacement?.active&&!scene.getObjects('TilePlacement_Indicator')[0].isHidden()){
   const [x,y]=scene.__freePlacement.cursor(),valid=scene.__freePlacement.validate(scene.__freePlacement.type,x,y);if(!valid.valid&&valid.reason!=='ui')a.play('InvalidAction');
  }
  a.ui.down=down;
 };
 a.draw=()=>{
  const layer=scene.getLayer('AudioUI');layer.setCameraZoom(1);layer.setCameraX(game.getGameResolutionWidth()/2);layer.setCameraY(game.getGameResolutionHeight()/2);
  for(const o of Object.values(a.objects))o.hide();const visible=!sv.get('IndexBlocksInput').getAsBoolean();layer.show(visible);if(!visible)return;
  const {button:b,panel:p}=a.geometry();
  const rect=(key,x,y,w,h,color='255;255;255',name='AudioPanel',z=1)=>{const o=a.ensure(key,name,z);o.setPosition(x,y);o.setWidth(w);o.setHeight(h);o.setColor(color);o.hide(false);return o;};
  const text=(key,value,x,y,w,size=12,bold=false,color='231;222;250')=>{const o=a.ensure(key,'AudioText',6);o.setPosition(x,y);o.setString(value);o.setCharacterSize(size);o.setWrapping(true);o.setWrappingWidth(w);o.setColor(color);o.setBold(bold);o.hide(false);};
  rect('speakerPanel',b.x,b.y,b.w,b.h);const icon=a.ensure('speaker','AudioSpeaker',5);icon.setPosition(b.x+4,b.y+4);icon.setWidth(24);icon.setHeight(24);icon.setOpacity(a.settings.Master===0?110:255);icon.hide(false);
  if(!a.ui.open)return;rect('popup',p.x,p.y,p.w,p.h);text('title','AUDIO',p.x+18,p.y+15,220,14,true);text('close','X',p.x+p.w-27,p.y+15,20,12,true);
  ['Master','Music','SFX','UI'].forEach((key,i)=>{const y=p.y+51+i*37;const value=a.settings[key];text('label'+key,key.toUpperCase(),p.x+18,y+4,92,11,true);rect('track'+key,p.x+114,y+10,136,5,'86;65;116','AudioBlock',3);rect('fill'+key,p.x+114,y+10,Math.max(1,136*value/100),5,'150;115;210','AudioBlock',4);rect('knob'+key,p.x+111+136*value/100,y+5,7,15,'221;207;247','AudioBlock',5);text('number'+key,value+'%',p.x+258,y+3,42,11);});
  for(const [key,label,x]of [['MuteMusic','MUSIC',p.x+18],['MuteSFX','SFX',p.x+160]]){rect(key,x,p.y+211,132,28,a.settings[key]?'164;139;190':'255;255;255');text('mute'+key,(a.settings[key]?'UNMUTE ':'MUTE ')+label,x+12,p.y+219,112,10,true);}
  text('saved',a.storageOK===false?'Settings for this session':'Saved on this device',p.x+18,p.y+250,268,10,false,'166;150;193');
 };
 a.after=()=>{
  if(a.disposed)return;
  a.install();const last=a.last,wave=sv.get('Wave').getAsNumber(),reward=sv.get('LastRewardedWave').getAsNumber(),lives=sv.get('Lives').getAsNumber(),flow=a.flowState();
  if(sv.get('PlacementCommitted').getAsBoolean()){a.preparation=true;a.play('TowerPlace');}
  if(a.pendingSell){if(!scene.getObjects('StarCannonTower').some(t=>t.getVariables().get('TowerId').getAsNumber()===a.pendingSell))a.play('TowerSell');a.pendingSell=0;}
  const composition=scene.__waveManager?.composition;
  if(wave>last.wave&&sv.get('WaveActive').getAsBoolean()&&composition?.wave===wave)a.play(sv.get('WaveIsMilestone').getAsBoolean()?'MilestoneWave':'WaveStart');
  if(reward>last.reward&&composition?.wave===reward&&flow!=='GAME_OVER')a.play('WaveComplete');
  if(lives<last.lives){const lost=Math.min(a.pendingBase||0,Math.ceil(last.lives-lives));a.stats.baseEvents+=lost;for(let i=0;i<lost;i++)a.play('BaseDamage');}a.pendingBase=0;
  const index=sv.get('IndexOpen').getAsBoolean(),category=scene.__unitIndex?.category||'Towers',selected=sv.get('SelectedTower').getAsNumber(),mode=sv.get('WaveMode').getAsString();
  if(index!==last.index||(index&&category!==last.category)||(mode!==last.mode&&wave===last.wave))a.play('UIClick');
  if(selected>0&&selected!==last.selected)a.play('TowerSelect');
  if(flow!==a.flow){if(flow==='GAME_OVER'||flow==='VICTORY'){for(const v of a.voices)if(v.group==='low'){v.sound?.stop();v.end=0;}a.play(flow==='VICTORY'?'Victory':'GameOver');}a.flow=flow;}
  const mapping={MENU:'SacredVoidTemple',PREPARATION:'AncientGalaxyAmbience',NORMAL_COMBAT:'CosmicDefense',MILESTONE_COMBAT:'VoidAwakening',GAME_OVER:'',VICTORY:''};
  const song=mapping[flow];if(song!==a.desired||a.unlocked&&!a.music.some(s=>s.file)&&song)a.requestMusic(song);
  a.updateMusic(a.dt||0);
  if(a.goldPending&&a.now-a.goldStarted>=.35&&a.now-a.lastGold>=.8){a.play('GoldReward');a.stats.goldBatches++;a.lastGold=a.now;a.goldPending=0;}
  a.last={wave,reward,lives,index,category,selected,mode};a.draw();
 };
 a.dispose=()=>{if(a.disposed)return;a.disposed=true;for(const s of a.music)a.release(s);for(const v of a.voices)v.sound?.stop();for(const def of Object.values(config.SFX))manager.unloadAudio(def.File,false);for(const e of scene.getObjects('Enemy'))if(e.__audioOwner===a){e.unregisterDestroyCallback(e.__audioCleanup);e.__audioOwner=null;}for(const h of a.hooks)if(h.object[h.name]===h.wrapped)h.object[h.name]=h.original;document.removeEventListener('pointerdown',a.gesture);document.removeEventListener('keydown',a.gesture);document.removeEventListener('touchstart',a.gesture);};
 if(!gdjs.__celestialAudioCallbacks){gdjs.__celestialAudioCallbacks=true;gdjs.callbacksRuntimeScenePreEvents.push(s=>s.__audio?.pre());gdjs.callbacksRuntimeSceneUnloading.push(s=>s.__audio?.dispose());}
 // The first frame predates registration; later frames use the pre-event hook.
 a.pre();
}
a.after();
