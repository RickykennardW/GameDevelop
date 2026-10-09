(async()=>{
 const game=testGame,S=game.getSceneStack().getCurrentScene(),A=S.__audio,manifest=await(await fetch('file:///C:/Users/My%20ASUS/OneDrive/Documents/GitHub/GameDevelop/assets/audio/manifest.json')).json(),checks=[],buffers={};const ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
 const decode=new OfflineAudioContext(2,48000,48000);const results=[];
 for(const asset of manifest.assets){const resource=game.getGameData().resources.resources.find(r=>r.name===asset.file);ok(!!resource,'registered '+asset.id);const blob=await(await fetch(resource.file)).arrayBuffer(),buffer=await decode.decodeAudioData(blob);buffers[asset.id]=buffer;let peak=0,sum=0,edgeJump=0;for(let c=0;c<buffer.numberOfChannels;c++){const x=buffer.getChannelData(c);edgeJump=Math.max(edgeJump,Math.abs(x[0]-x[x.length-1]));for(let i=0;i<x.length;i++){peak=Math.max(peak,Math.abs(x[i]));sum+=x[i]*x[i];}}
  ok(Math.abs(buffer.duration-asset.decoded.duration)<.001&&peak<.8&&sum>0,'valid non-silent/unclipped '+asset.id);results.push({id:asset.id,duration:buffer.duration,peak,rms:Math.sqrt(sum/(buffer.length*buffer.numberOfChannels)),edgeJump});
 }
 const offline=new OfflineAudioContext(2,48000*4,48000),limiter=offline.createDynamicsCompressor();limiter.threshold.value=-6;limiter.knee.value=6;limiter.ratio.value=12;limiter.attack.value=.003;limiter.release.value=.12;limiter.connect(offline.destination);
 const ids=['StarCannonFire','ProjectileImpact','EnemyHit','CommonEnemyDeath','TowerPlace','TowerUpgrade','TowerSell','EliteEnemyDeath','VoidGolemSkillCast','BaseDamage','UIClick','TowerSelect'];
 for(const id of ids){const node=offline.createBufferSource(),gain=offline.createGain(),d=A.config.SFX[id];node.buffer=buffers[id];gain.gain.value=(d.Group==='ui'?.45:.7)*d.Gain;node.connect(gain);gain.connect(limiter);node.start(.05);}
 for(const id of ['CosmicDefense','VoidAwakening']){const node=offline.createBufferSource(),gain=offline.createGain();node.buffer=buffers[id];gain.gain.value=.35*.5;node.connect(gain);gain.connect(limiter);node.start();}
 const mixed=await offline.startRendering();let peak=0,clipped=0;for(let c=0;c<2;c++)for(const x of mixed.getChannelData(c)){peak=Math.max(peak,Math.abs(x));if(Math.abs(x)>=1)clipped++;}ok(peak<1&&clipped===0,'12 simultaneous default-mix SFX plus2BGM do not clip after limiter');
 return{checks,assets:results,mixStress:{voices:12,bgm:2,peak,clipped},method:'Decode every exported registered audio resource;native OfflineAudioContext/rendered mix with production limiter settings'};
})()
