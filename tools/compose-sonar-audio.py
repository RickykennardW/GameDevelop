"""Compose only the three original feedback cues; final OGG, no intermediate files."""
import asyncio, hashlib, importlib.util, json
from pathlib import Path
import numpy as np

ROOT=Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('local_codec',ROOT/'tools/audio-codec-browser.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
SR=48000
ASSETS=[('PurchaseDenied','assets/audio/ui/purchase_denied.ogg',.34),('SonarWarning','assets/audio/gameplay/sonar_warning.ogg',1.12),('SonarCritical','assets/audio/gameplay/sonar_critical.ogg',.86)]

def compose(name,duration):
    t=np.arange(round(SR*duration))/SR;x=np.zeros(len(t))
    def add(at,freq,decay,gain,buzz=False):
        q=t-at;u=np.maximum(0,q);env=np.minimum(1,u/.009)*np.exp(-u/decay)*(q>=0)
        phase=2*np.pi*(freq*u+freq*.006*np.sin(2*np.pi*1.7*u))
        tone=np.sin(phase)+(.22*np.sin(3*phase)+.07*np.sin(5*phase) if buzz else .16*np.sin(2.012*phase)+.045*np.sin(2.76*phase))
        if buzz:env*=np.minimum(1,np.maximum(0,.105-u)/.018)
        x[:]+=gain*tone*env
    if name=='PurchaseDenied':
        add(.01,185,.11,.65,True);add(.17,138,.11,.65,True)
    elif name=='SonarWarning':
        add(0,142,.21,.45);add(.14,622,.27,.62);add(.31,622,.20,.16);add(.49,622,.15,.065)
    else:
        add(0,740,.16,.58);add(.25,880,.17,.64);add(.08,185,.15,.23);add(.36,880,.13,.12)
    x-=x.mean();x*=.105/max(.001,np.sqrt(np.mean(x*x)));x=.40*np.tanh(x/.40)
    fade=round(.012*SR);x[:fade]*=np.linspace(0,1,fade);x[-fade:]*=np.linspace(1,0,fade)
    return x.astype(np.float32)

async def main():
    path=ROOT/'assets/audio/manifest.json';manifest=json.loads(path.read_text())
    async with module.Codec() as codec:
        for name,file,duration in ASSETS:
            data,metrics=await codec.encode(compose(name,duration),64000)
            assert .03<metrics['rms']<.2 and metrics['peak']<.65 and abs(metrics['duration']-duration)<.001,metrics
            target=ROOT/file;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
            entry={'id':name,'file':file,'resourceName':file,'kind':'sfx','bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'decoded':metrics,'method':'Original additive resonant pulses, shaped envelopes, diffuse echo; no samples or downloads'}
            manifest['assets']=[a for a in manifest['assets'] if a['id']!=name]+[entry]
            print(name,json.dumps(metrics),flush=True)
    manifest['totalBytes']=sum(a['bytes'] for a in manifest['assets']);path.write_text(json.dumps(manifest,indent=2)+'\n')

if __name__=='__main__':asyncio.run(main())
