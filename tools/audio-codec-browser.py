"""Use the installed Chromium Opus encoder; PCM/packets stay in memory.
No external service, downloaded codec, temporary WAV or separate audio player.
"""
import asyncio,base64,json,socket,struct,subprocess,tempfile,urllib.request
from pathlib import Path
import numpy as np
import websockets
ROOT=Path(__file__).resolve().parent.parent
W=Path(r'C:\Users\My ASUS\.codex\visualizations\2026\10\06\01a11249-1cf3-7f03-9834-01083d6fb50c\gdevelop-shop-rework-validation')
class Codec:
 async def __aenter__(self):
  sock=socket.socket();sock.bind(('127.0.0.1',0));port=sock.getsockname()[1];sock.close()
  self.profile=tempfile.TemporaryDirectory(prefix='audio-codec-profile-',dir=W)
  assert Path(self.profile.name).resolve().parent==W.resolve()
  self.proc=subprocess.Popen(['C:/Program Files/Google/Chrome/Application/chrome.exe','--headless','--disable-extensions','--disable-background-networking','--no-first-run','--allow-file-access-from-files','--remote-debugging-port='+str(port),'--user-data-dir='+self.profile.name,(W/'preview/clean-sidebar-live.html').as_uri()],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
  target=None
  for _ in range(100):
   try:target=next(t for t in json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json',timeout=1)) if t['type']=='page');break
   except Exception:await asyncio.sleep(.1)
  if not target:raise RuntimeError('Local codec browser unavailable')
  self.ws=await websockets.connect(target['webSocketDebuggerUrl'],max_size=40000000);self.index=0
  for _ in range(150):
   if await self.js('!!window.testGame'):break
   await asyncio.sleep(.1)
  await self.js('testGame.pause(true);true');return self
 async def js(self,code):
  self.index+=1;await self.ws.send(json.dumps({'id':self.index,'method':'Runtime.evaluate','params':{'expression':code,'returnByValue':True,'awaitPromise':True}}))
  while True:
   r=json.loads(await self.ws.recv())
   if r.get('id')==self.index:
    if 'error' in r or 'exceptionDetails' in r.get('result',{}):raise RuntimeError(str(r)[:2500])
    return r.get('result',{}).get('result',{}).get('value')
 async def encode(self,pcm,bitrate):
  channels=1 if pcm.ndim==1 else pcm.shape[1];samples=len(pcm)
  await self.js('''(()=>{globalThis.audioPackets=[];globalThis.audioDescription=null;globalThis.encoderError=null;globalThis.encoder=new AudioEncoder({output:(chunk,meta)=>{const a=new Uint8Array(chunk.byteLength);chunk.copyTo(a);let s='';for(let i=0;i<a.length;i++)s+=String.fromCharCode(a[i]);audioPackets.push(btoa(s));if(meta?.decoderConfig?.description)audioDescription=Array.from(new Uint8Array(meta.decoderConfig.description));},error:e=>encoderError=String(e)});encoder.configure({codec:'opus',sampleRate:48000,numberOfChannels:CHANNELS,bitrate:BITRATE});return true;})()'''.replace('CHANNELS',str(channels)).replace('BITRATE',str(bitrate)))
  for start in range(0,samples,48000):
   block=pcm[start:start+48000];planar=np.ascontiguousarray(block.T,dtype='<f4');data=base64.b64encode(planar.tobytes()).decode()
   await self.js("(()=>{const b=Uint8Array.from(atob("+json.dumps(data)+"),c=>c.charCodeAt(0)),a=new AudioData({format:'f32-planar',sampleRate:48000,numberOfFrames:"+str(len(block))+",numberOfChannels:"+str(channels)+",timestamp:"+str(round(start/48000*1e6))+",data:b});encoder.encode(a);a.close();return true;})()")
  result=await self.js('(async()=>{await encoder.flush();encoder.close();if(encoderError)throw Error(encoderError);return {packets:audioPackets,description:audioDescription};})()')
  packets=[base64.b64decode(p) for p in result['packets']]
  description=bytes(result['description'] or [])
  head=description if description.startswith(b'OpusHead') else b'OpusHead'+bytes([1,channels])+struct.pack('<HIhB',312,48000,0,0)
  skip=struct.unpack_from('<H',head,10)[0]
  assert len(packets)*960>=samples+skip,(len(packets),samples,skip)
  vendor=b'Celestial Void original DSP';tags=b'OpusTags'+struct.pack('<I',len(vendor))+vendor+struct.pack('<I',0)
  serial=0x564F4944+channels;pages=[page(head,2,0,serial,0),page(tags,0,0,serial,1)]
  for i,packet in enumerate(packets):pages.append(page(packet,4 if i==len(packets)-1 else 0,samples+skip if i==len(packets)-1 else (i+1)*960,serial,i+2))
  data=b''.join(pages);report=await self.decode_metrics(data)
  assert abs(report['duration']-samples/48000)<.0001,(report['duration'],samples/48000)
  return data,report
 async def decode_metrics(self,data):
  encoded=base64.b64encode(data).decode()
  return await self.js('''(async()=>{const bytes=Uint8Array.from(atob(DATA),c=>c.charCodeAt(0)),ctx=new OfflineAudioContext(2,48000,48000),b=await ctx.decodeAudioData(bytes.buffer);let sum=0,peak=0,jump=0,edge=0,edgeSum=0;for(let c=0;c<b.numberOfChannels;c++){const x=b.getChannelData(c);jump=Math.max(jump,Math.abs(x[0]-x[x.length-1]));for(let i=0;i<x.length;i++){sum+=x[i]*x[i];peak=Math.max(peak,Math.abs(x[i]));if(i<2400||i>=x.length-2400){edgeSum+=x[i]*x[i];edge++;}}}return{duration:b.duration,samples:b.length,channels:b.numberOfChannels,rms:Math.sqrt(sum/(b.length*b.numberOfChannels)),peak,loopJump:jump,edgeRMS:Math.sqrt(edgeSum/edge)};})()'''.replace('DATA',json.dumps(encoded)))
 async def __aexit__(self,*args):
  await self.ws.close()
  subprocess.run(['taskkill','/PID',str(self.proc.pid),'/T','/F'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
  self.proc.wait(timeout=10)
  try:self.profile.cleanup()
  except OSError:pass
def page(packet,flags,granule,serial,sequence):
 lacing=[255]*(len(packet)//255)+[len(packet)%255]
 header=b'OggS'+bytes([0,flags])+struct.pack('<QII',granule,serial,sequence)+b'\0'*4+bytes([len(lacing)])+bytes(lacing)
 data=bytearray(header+packet);crc=0
 for byte in data:
  crc^=byte<<24
  for _ in range(8):crc=((crc<<1)^0x04C11DB7 if crc&0x80000000 else crc<<1)&0xffffffff
 struct.pack_into('<I',data,22,crc);return bytes(data)
