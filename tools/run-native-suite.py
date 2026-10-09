"""Run an exported GDevelop fixture via CDP; stop its owned browser before saving.

Avoid Chrome --dump-dom waiting indefinitely on background children/pipe handles.
No project copies, no persistent browser cache, no user browser interaction.
"""
import asyncio,html,json,os,re,socket,subprocess,sys,tempfile,time,urllib.request
from pathlib import Path
import websockets
ROOT=Path(__file__).resolve().parent.parent
W=Path(os.environ.get('GD_VALIDATION_HOME',r'C:\Users\My ASUS\.codex\visualizations\2026\10\06\01a11249-1cf3-7f03-9834-01083d6fb50c\gdevelop-shop-rework-validation'))
OUT=Path(os.environ.get('GD_VALIDATION_RESULTS',ROOT/'design_previews/void_golem'));OUT.mkdir(parents=True,exist_ok=True)
name=sys.argv[1];assert re.fullmatch('test-[a-z-]+',name)
sock=socket.socket();sock.bind(('127.0.0.1',0));port=sock.getsockname()[1];sock.close()
profile=tempfile.TemporaryDirectory(prefix='native-suite-profile-',dir=W)
resolved=Path(profile.name).resolve();assert resolved.parent==W.resolve() and resolved.name.startswith('native-suite-profile-')
proc=subprocess.Popen(['C:/Program Files/Google/Chrome/Application/chrome.exe','--headless','--disable-extensions','--disable-background-networking','--disable-component-update','--disable-sync','--no-first-run','--allow-file-access-from-files','--remote-debugging-port='+str(port),'--user-data-dir='+profile.name,'--window-size=1280,800',(W/'preview'/(name+'.html')).as_uri()],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
async def run():
    target=None
    for _ in range(100):
        try:target=next(t for t in json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json',timeout=1)) if t['type']=='page');break
        except Exception:
            if proc.poll() is not None:raise RuntimeError('Native Chrome exited before debugging endpoint')
            await asyncio.sleep(.1)
    if not target:raise RuntimeError('Native Chrome debugging endpoint unavailable')
    async with websockets.connect(target['webSocketDebuggerUrl'],max_size=30000000) as ws:
        counter=0;errors=[]
        async def call(method,params=None):
            nonlocal counter
            counter+=1;await ws.send(json.dumps(dict(id=counter,method=method,params=params or {})))
            while True:
                r=json.loads(await asyncio.wait_for(ws.recv(),timeout=180))
                if r.get('method')=='Runtime.exceptionThrown':errors.append(r)
                if r.get('id')==counter:return r.get('result',{})
        await call('Runtime.enable')
        deadline=time.monotonic()+180;text=''
        while time.monotonic()<deadline:
            r=await call('Runtime.evaluate',dict(expression="document.getElementById('results')?.textContent||''",returnByValue=True))
            text=r.get('result',{}).get('value','')
            if 'TESTS PASSED' in text or 'FAIL ' in text:break
            await asyncio.sleep(.2)
        return text,errors
try:text,errors=asyncio.run(run())
finally:
    if proc.poll() is None:subprocess.run(['taskkill','/PID',str(proc.pid),'/T','/F'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    proc.wait(timeout=10)
    try:profile.cleanup()
    except OSError:pass
(OUT/(name+'-results.txt')).write_text(text,encoding='utf-8')
(OUT/(name+'-console.json')).write_text(json.dumps(errors,indent=2),encoding='utf-8')
passed='FAIL ' not in text and 'ALL ' in text and 'TESTS PASSED' in text and not errors
print('PASS' if passed else 'FAIL',name,'checks=',len(re.findall(r'^PASS ',text,re.M)),'consoleExceptions=',len(errors))
if not passed:print(text[-4000:]);sys.exit(1)
