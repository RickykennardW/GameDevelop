"""Original arranged soundtrack and foley synthesis; final OGG only, no WAVs.
Pads, formant choir, bowed strings, modal bells, bass and cinematic percussion.
"""
import asyncio,hashlib,json,math,importlib.util
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parent.parent;SR=48000
spec=importlib.util.spec_from_file_location('audio_codec',ROOT/'tools/audio-codec-browser.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);Codec=module.Codec
RNG=np.random.default_rng(177017)
def hz(note):return 440*2**((note-69)/12)
def time(duration):return np.arange(round(duration*SR),dtype=np.float32)/SR
def envelope(t,gate,attack=.03,release=.4):
 return np.minimum(1,t/max(.001,attack))**.75*np.where(t<=gate,1,np.exp(-np.maximum(0,t-gate)/max(.001,release)))
def voice(note,gate,kind='pad',phase=0):
 release={'pad':2.8,'choir':2.2,'strings':.7,'bell':2.4,'lead':1.3,'bass':.09}.get(kind,.5)
 t=time(gate+release*2.5);f=hz(note);x=np.zeros(len(t),dtype=np.float32)
 if kind=='bell':
  for ratio,amp,decay in [(1,1,1.6),(2.01,.22,.85),(2.756,.14,.6),(4.11,.065,.3),(5.42,.03,.18)]:x+=amp*np.sin(2*np.pi*f*ratio*t+phase)*np.exp(-t/decay)
  x*=np.minimum(1,t/.006);return x*.26
 if kind=='choir':
  formants=[(590,150),(1180,180),(2420,260)]
  for h in range(1,25):
   freq=f*h;weight=.10/h+sum(a*np.exp(-.5*((freq-center)/width)**2) for (center,width),a in zip(formants,[.42,.22,.08]))
   if freq<9000:x+=weight*np.sin(2*np.pi*freq*t+.04*h*np.sin(2*np.pi*.27*t+phase)+phase)
  x*=.4*(.86+.14*np.sin(2*np.pi*.15*t+phase))
 elif kind=='strings':
  for detune in [-.003,.003]:
   for h in range(1,9):x+=np.sin(2*np.pi*f*(1+detune)*h*t+.035*h*np.sin(2*np.pi*4.8*t+phase)+phase)/(h**1.5)*.22
 elif kind=='lead':
  x=np.sin(2*np.pi*f*t+.17*np.sin(2*np.pi*f*2*t))*.55+np.sin(2*np.pi*f*.998*t+phase)*.18
 elif kind=='bass':x=np.sin(2*np.pi*f*t)*.7+np.sin(4*np.pi*f*t)*.15
 else:
  for detune in [-.0028,.0028]:
   for h,amp in [(1,.28),(2,.085),(3,.045),(5,.012)]:x+=amp*np.sin(2*np.pi*f*(1+detune)*h*t+.08*np.sin(2*np.pi*.19*t+phase)+phase)
  x*=.88+.12*np.sin(2*np.pi*.13*t+phase)
 attack={'pad':1.9,'choir':1.25,'strings':.10,'lead':.08,'bass':.012}.get(kind,.05)
 x*=envelope(t,gate,attack,release)
 return x
def add(mix,x,start,gain,pan=0):
 start=round(start*SR)%len(mix);x=x.astype(np.float32,copy=False);p=(pan+1)*np.pi/4
 for c,g in [(0,np.cos(p)*gain),(1,np.sin(p)*gain)]:
  remaining=len(x);off=0;pos=start
  while remaining:
   n=min(remaining,len(mix)-pos);mix[pos:pos+n,c]+=x[off:off+n]*g;off+=n;remaining-=n;pos=0
def drum(gate=.45,heavy=False):
 t=time(gate);noise=RNG.normal(0,1,len(t)).astype(np.float32);smooth=np.convolve(noise,np.ones(31,dtype=np.float32)/31,mode='same')
 phase=2*np.pi*(45*t+90*(1-np.exp(-t*26))/26)
 x=.55*np.sin(phase)*np.exp(-t*10)+.18*smooth*np.exp(-t*18)
 if heavy:x+=.22*np.sin(2*np.pi*68*t)*np.exp(-t*4)
 x*=np.minimum(1,t/.004);x[-240:]*=np.linspace(1,0,240);return x
CHORDS=[('Dm9',[50,57,60,64]),('Gm9',[43,50,57,58,62]),('Bbmaj7',[46,53,57,62]),('Csus2',[48,55,62,64]),('Dm9',[50,57,60,64]),('Gm9',[43,50,57,58,62]),('Am(add4)',[45,52,55,62]),('Dm9',[50,57,60,64])]
MOTIF=[(0,74,1.2),(1.5,77,.8),(3,76,1.7),(5.5,69,1.2),(7.5,74,2.5)]
TRACKS=[
 ('AncientGalaxyAmbience','ancient_galaxy_ambience.ogg',64,32,'calm'),
 ('SacredVoidTemple','sacred_void_temple.ogg',60,32,'sacred'),
 ('CosmicDefense','cosmic_defense.ogg',96,48,'combat'),
 ('VoidAwakening','void_awakening.ogg',112,56,'elite')]
def music(bpm,bars,mood):
 beat=60/bpm;duration=bars*4*beat;mix=np.zeros((round(duration*SR),2),dtype=np.float32)
 t=np.arange(len(mix),dtype=np.float32)/SR;drone=round(hz(38)*duration)/duration
 for c in range(2):mix[:,c]=.026*np.sin(2*np.pi*drone*t+(.16 if c else 0))*(.88+.12*np.sin(2*np.pi*3*t/duration))+.011*np.sin(2*np.pi*drone*.5*t)
 chords=[]
 for bar in range(0,bars,2):
  name,notes=CHORDS[(bar//2)%8];chords.append({'bar':bar+1,'chord':name});section=bar//8
  for i,n in enumerate(notes):
   add(mix,voice(n,8*beat,'pad',i*.73),bar*4*beat,.14 if mood=='calm' else .115,(-.8+i*.4))
   add(mix,voice(n if n<60 else n-12,8*beat,'choir',i+.4),bar*4*beat,.06 if mood=='calm' else .13 if mood=='sacred' else .075,(-.6+i*.3))
   if mood!='calm':add(mix,voice(n,7.8*beat,'strings',i+.2),bar*4*beat,.028 if mood=='sacred' else .035,(-.65+i*.35))
  if bar%8 in [0,4]:add(mix,voice(notes[0]+24,1,'bell'),bar*4*beat,.055 if mood=='combat' else .10,-.35)
  if mood in ['combat','elite']:
   root=notes[0]-12
   for localbar in range(2):
    base=(bar+localbar)*4*beat;intensity=1+.12*np.sin(section*.8)
    for pulse in [0,1.5,2,3.5]:add(mix,voice(root,.27*beat,'bass'),base+pulse*beat,.13*intensity if mood=='combat' else .18*intensity,.0)
    for step in range(8):
     n=notes[[0,2,1,2,0,3,1,2][step]%len(notes)]+(12 if section%3==2 else 0)
     add(mix,voice(n,.25*beat,'strings',step*.4),base+step*.5*beat,.037 if mood=='combat' else .05,(-.45 if step%2 else .45))
    for pulse in ([0,2] if mood=='combat' else [0,1.5,2.5]):add(mix,drum(.55,mood=='elite'),base+pulse*beat,.12 if mood=='combat' else .18,.05)
    if mood=='elite' and localbar==1:add(mix,voice(notes[0]-12,2*beat,'strings'),base+2*beat,.055,-.2)
   if mood=='elite' and bar%8==6:
    swell=RNG.normal(0,1,round(7*beat*SR)).astype(np.float32);swell=np.convolve(swell,np.ones(49,dtype=np.float32)/49,mode='same');swell*=np.sin(np.linspace(0,np.pi,len(swell)))**2
    add(mix,swell,bar*4*beat,.015,.7)
  elif mood=='sacred' and bar%4==2:add(mix,drum(.6,True),bar*4*beat,.022,0)
 for phrase in range(0,bars,4):
  if mood=='calm' and phrase in [4,20]:continue
  shift=-12 if mood=='sacred' or (phrase//4)%4==3 else 0
  for offset,n,length in MOTIF:
   kind='bell' if mood=='sacred' else 'lead';gain={'calm':.07,'sacred':.15,'combat':.085,'elite':.10}[mood]
   add(mix,voice(n+shift,length*beat,kind,phrase*.1),phrase*4*beat+offset*beat,gain,-.2)
  if (phrase//4)%2:
   for offset,n in [(10,72),(12,70),(14,69)]:add(mix,voice(n,beat,'bell'),phrase*4*beat+offset*beat,.055,.42)
 # A deterministic diffuse reverb with circular convolution carries tails over
 # the end/start boundary. Notes and harmonic cadence also wrap, without silence.
 dry=mix.copy()
 for c in range(2):
  irlen=round((4.2 if mood in ['calm','sacred'] else 2.9)*SR);it=np.arange(irlen)/SR
  ir=RNG.normal(0,1,irlen)*np.exp(-it/(.82 if mood=='sacred' else .65))
  ir=np.convolve(ir,np.ones(37)/37,mode='same');ir/=np.sqrt(np.sum(ir**2));ir*=.18
  ir[round(.097*SR)]+=.10;ir[round(.181*SR)]+=.065;ir[round(.347*SR)]+=.035
  wet=np.fft.irfft(np.fft.rfft(dry[:,c])*np.fft.rfft(ir,n=len(mix)),n=len(mix)).astype(np.float32)
  mix[:,c]+=wet+.045*np.roll(dry[:,1-c],round(.223*SR))
 mix-=mix.mean(axis=0);rms=np.sqrt(np.mean(mix.astype(np.float64)**2));mix*=({'calm':.069,'sacred':.073,'combat':.078,'elite':.082}[mood])/rms
 mix=.52*np.tanh(mix/.52)
 return mix.astype(np.float32),{'bpm':bpm,'bars':bars,'duration':duration,'key':'D minor / suspended ninth','motif':'D5 F5 E5 A4 D5; response C5 Bb4 A4','chords':chords,'layers':['warm detuned cosmic pad','formant wordless choir','modal crystal bells','rounded motif lead','low D drone','diffuse circular reverb']+(['bowed additive strings'] if mood!='calm' else [])+(['pulsing bass','eighth-note string ostinato','controlled low percussion'] if mood in ['combat','elite'] else [])}
EFFECTS=[('TowerPlace','towers/tower_place.ogg',.36),('TowerUpgrade','towers/tower_upgrade.ogg',.68),('TowerMajorUpgrade','towers/tower_major_upgrade.ogg',.9),('TowerSell','towers/tower_sell.ogg',.4),('StarCannonFire','towers/star_cannon_fire.ogg',.14),('ProjectileImpact','towers/projectile_impact.ogg',.15),('EnemyHit','enemies/enemy_hit.ogg',.105),('CommonEnemyDeath','enemies/common_enemy_death.ogg',.38),('EliteEnemyDeath','enemies/elite_enemy_death.ogg',1.08),('VoidGolemSkillCast','skills/void_golem_skill.ogg',.72),('VoidFortificationApply','skills/void_fortification_apply.ogg',.34),('WaveStart','waves/wave_start.ogg',.78),('MilestoneWave','waves/milestone_wave.ogg',1.22),('WaveComplete','waves/wave_complete.ogg',.78),('GoldReward','gameplay/gold_reward.ogg',.2),('BaseDamage','gameplay/base_damage.ogg',.6),('GameOver','gameplay/game_over.ogg',2.35),('Victory','gameplay/victory.ogg',2.15),('UIClick','ui/ui_click.ogg',.075),('InvalidAction','ui/invalid_action.ogg',.2),('TowerSelect','ui/tower_select.ogg',.13)]
def effect(name,duration):
 t=time(duration);x=np.zeros(len(t),dtype=np.float32)
 noise=RNG.normal(0,1,len(t)).astype(np.float32);noise=np.convolve(noise,np.ones(9)/9,mode='same').astype(np.float32)
 def chirp(a,b,gain=1):
  phase=2*np.pi*(a*t+(b-a)*t*t/(2*duration));return gain*np.sin(phase+.35*np.sin(phase*2))*np.sin(np.pi*np.minimum(1,t/duration))**.6
 def bell(n,at,gain=.4):
  v=voice(n,.08,'bell');start=round(at*SR);num=min(len(v),len(x)-start)
  if num>0:x[start:start+num]+=v[:num]*gain
 if name in ['TowerPlace','TowerSelect','UIClick']:
  x+=.28*noise*np.exp(-t*95)+.3*np.sin(2*np.pi*220*t)*np.exp(-t*24);bell(74,.02,.8 if name=='TowerPlace' else .35)
 elif name in ['TowerUpgrade','TowerMajorUpgrade','Victory','WaveComplete','GoldReward']:
  for i,n in enumerate([62,69,74,77] if name in ['TowerMajorUpgrade','Victory'] else [69,74,76]):bell(n,i*duration/5,.7)
  x+=chirp(120,370,.22 if name=='GoldReward' else .3)
  if name=='Victory':x+=.12*(np.sin(2*np.pi*hz(50)*t)+np.sin(2*np.pi*hz(57)*t))*np.sin(np.pi*t/duration)
 elif name in ['TowerSell','GameOver']:
  x+=chirp(380,70,.48)+.06*noise*np.exp(-t*5);bell(62,0,.8);bell(57,duration*.23,.4)
 elif name in ['StarCannonFire','ProjectileImpact','EnemyHit']:
  x+=chirp(940 if name=='StarCannonFire' else 510,120,.55)+.22*noise*np.exp(-t*45);bell(86,.012,.25)
 elif name in ['CommonEnemyDeath','EliteEnemyDeath']:
  x+=chirp(230,42,.65)+.27*noise*np.exp(-t*9)
  for i,n in enumerate([86,81,74]):bell(n,.04+i*.07,.5)
  if name=='EliteEnemyDeath':x+=.5*np.sin(2*np.pi*(38*t+24*(1-np.exp(-t*8))/8))*np.exp(-t*3.7)+.18*np.convolve(noise,np.ones(71)/71,mode='same')*np.exp(-t*2)
 elif name in ['VoidGolemSkillCast','VoidFortificationApply','MilestoneWave','BaseDamage','WaveStart']:
  base=60 if name in ['VoidGolemSkillCast','MilestoneWave'] else 140
  x+=chirp(base,base*2,.52)+.20*np.sin(2*np.pi*hz(50)*t)*(1+np.sin(2*np.pi*6*t))*.5*np.sin(np.pi*t/duration)
  for i,n in enumerate([62,69,74]):bell(n,.02+i*duration/7,.42)
  if name=='BaseDamage':x+=.32*noise*np.exp(-t*18)+.12*np.sin(2*np.pi*440*t)*(np.sin(2*np.pi*3*t)>0)*np.exp(-t*6)
 elif name=='InvalidAction':x+=.36*np.sin(2*np.pi*125*t)*np.exp(-t*13)+.16*np.sin(2*np.pi*180*t)*np.exp(-t*18)
 else:raise ValueError(name)
 fade=min(480,len(x)//6);x[:fade]*=np.linspace(0,1,fade);x[-fade:]*=np.linspace(1,0,fade);x-=x.mean();rms=np.sqrt(np.mean(x*x));x*=.115/max(.001,rms);x=.44*np.tanh(x/.44);return x.astype(np.float32)
async def main():
 folder=ROOT/'assets/audio';folder.mkdir(parents=True,exist_ok=True);results=[]
 async with Codec() as codec:
  for name,file,bpm,bars,mood in TRACKS:
   print('COMPOSING',name,bpm,'BPM',flush=True);pcm,score=music(bpm,bars,mood);data,metrics=await codec.encode(pcm,112000)
   target=folder/'music'/file;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
   assert metrics['peak']<.8 and metrics['rms']>.025 and metrics['edgeRMS']>.01 and metrics['loopJump']<.05,metrics
   results.append({'id':name,'file':target.relative_to(ROOT).as_posix(),'kind':'music','bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'score':score,'decoded':metrics});print('ENCODED',name,len(data),metrics,flush=True);del pcm,data
  for name,file,duration in EFFECTS:
   pcm=effect(name,duration);data,metrics=await codec.encode(pcm,64000);target=folder/file;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
   assert metrics['peak']<.8 and metrics['rms']>.015,metrics
   results.append({'id':name,'file':target.relative_to(ROOT).as_posix(),'kind':'sfx','bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'decoded':metrics});print('SFX',name,len(data),flush=True)
 manifest={'method':'Original note-level DSP score /numpy additive+formant synthesis /cyclic convolution reverb /local Chromium WebCodecs Opus112k stereo BGM and64k monoSFX /in-memory PCM and OGG mux;no samples/downloads/intermediate WAVs','sampleRate':SR,'assets':results,'totalBytes':sum(r['bytes'] for r in results)}
 (folder/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8');print('COMPLETE',len(results),'finalOGG assets',manifest['totalBytes'],'bytes',flush=True)
if __name__=='__main__':asyncio.run(main())
