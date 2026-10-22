"""Run diagnostic/validation JavaScript in the actual exported GDevelop preview.

Fixture scripts operate a test scene only. They do not replace gameplay code.
Usage: python tools/balance-browser.py SCRIPT.js OUTPUT.json [SCREENSHOT.png]
"""
import asyncio, base64, hashlib, io, json, os, socket, subprocess, sys, tempfile, urllib.request
from pathlib import Path
import websockets

ROOT = Path(__file__).resolve().parent.parent
W = Path(os.environ.get('GD_VALIDATION_HOME', r'C:\Users\My ASUS\.codex\visualizations\2026\10\06\01a11249-1cf3-7f03-9834-01083d6fb50c\gdevelop-shop-rework-validation'))
sock = socket.socket(); sock.bind(('127.0.0.1', 0)); port = sock.getsockname()[1]; sock.close()
profile=tempfile.TemporaryDirectory(prefix='balance-browser-profile-',dir=W)
profile_path=Path(profile.name).resolve()
assert profile_path.parent==W.resolve() and profile_path.name.startswith('balance-browser-profile-')
def start_browser():
    return subprocess.Popen(['C:/Program Files/Google/Chrome/Application/chrome.exe', '--headless', '--disable-extensions', '--disable-background-networking', '--disable-component-update', '--disable-sync', '--no-first-run', '--allow-file-access-from-files', '--remote-debugging-port='+str(port), '--user-data-dir='+profile.name, '--window-size=1920,1080', '--hide-scrollbars', (W/'preview/clean-sidebar-live.html').as_uri()], stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
proc = start_browser()

async def main():
    target = None
    for _ in range(50):
        try:
            target = next(t for t in json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json', timeout=1)) if t['type']=='page'); break
        except Exception:
            if proc.poll() is not None: raise RuntimeError(proc.stderr.read().decode(errors='replace')[-3000:])
            await asyncio.sleep(.1)
    if not target: raise RuntimeError('Native Chrome debugging endpoint did not start')
    async with websockets.connect(target['webSocketDebuggerUrl'], max_size=40000000) as ws:
        count = 0; errors = []; progress = []
        async def call(method, params=None):
            nonlocal count
            count += 1; await ws.send(json.dumps(dict(id=count, method=method, params=params or {})))
            while True:
                r = json.loads(await ws.recv())
                if r.get('method')=='Runtime.consoleAPICalled':
                    for arg in r['params'].get('args',[]):
                        if isinstance(arg.get('value'),str) and arg['value'].startswith('BALANCE PROGRESS'):
                            progress.append(arg['value'])
                            print(arg['value'],flush=True)
                if r.get('method')=='Runtime.exceptionThrown' or (r.get('method')=='Runtime.consoleAPICalled' and r['params'].get('type')=='error') or (r.get('method')=='Log.entryAdded' and r['params']['entry'].get('level')=='error'): errors.append(r)
                if r.get('id')==count:
                    if 'error' in r: raise RuntimeError(r['error'])
                    return r.get('result', {})
        async def js(code):
            r = await call('Runtime.evaluate', dict(expression=code, returnByValue=True, awaitPromise=True))
            if 'exceptionDetails' in r: raise RuntimeError(r['exceptionDetails'])
            return r.get('result', {}).get('value')
        await call('Runtime.enable'); await call('Log.enable'); await call('Page.reload')
        ready='__mainMenu' if '--menu' in sys.argv else '__starCannon'
        for _ in range(300):
            if await js('!!(window.testGame&&testGame.getSceneStack().getCurrentScene()?.'+ready+')'): break
            await asyncio.sleep(.1)
        viewport=next((a.split('=',1)[1] for a in sys.argv[3:] if a.startswith('--viewport=')),'1920x1080')
        vw,vh=map(int,viewport.split('x'))
        await call('Emulation.setDeviceMetricsOverride', dict(width=vw,height=vh,deviceScaleFactor=1,mobile=False))
        mode=next((a.split('=',1)[1] for a in sys.argv[3:] if a.startswith('--mode=')),None)
        if mode: await js('globalThis.BALANCE_MODE='+json.dumps(mode))
        if '--gesture' in sys.argv:
            await js('globalThis.audioGateBeforeGesture=!!testGame.getSceneStack().getCurrentScene().__audio&&!testGame.getSceneStack().getCurrentScene().__audio.unlocked')
            await call('Input.dispatchMouseEvent',dict(type='mousePressed',x=10,y=10,button='left',clickCount=1))
            await call('Input.dispatchMouseEvent',dict(type='mouseReleased',x=10,y=10,button='left',clickCount=1))
        try:
            sequence=next((a.split('=',1)[1] for a in sys.argv[3:] if a.startswith('--resize-sequence=')),None)
            if sequence:
                result={'resizeSequence':[]}
                for dimensions in sequence.split(','):
                    rw,rh=map(int,dimensions.split('x'))
                    await call('Emulation.setDeviceMetricsOverride',dict(width=rw,height=rh,deviceScaleFactor=1,mobile=False))
                    await asyncio.sleep(.2)
                    result['resizeSequence'].append(await js(Path(sys.argv[1]).read_text(encoding='utf-8')))
            else: result = await js(Path(sys.argv[1]).read_text(encoding='utf-8'))
        except Exception as exc:
            Path(sys.argv[2]).write_text(json.dumps(dict(failure=str(exc),progress=progress,consoleErrors=errors),indent=2),encoding='utf-8'); raise
        if '--reload-check' in sys.argv:
            await call('Page.reload')
            for _ in range(300):
                if await js('!!(window.testGame&&testGame.getSceneStack().getCurrentScene()?.__audio)'): break
                await asyncio.sleep(.1)
            reloaded=await js('({settings:testGame.getSceneStack().getCurrentScene().__audio.settings,unlocked:testGame.getSceneStack().getCurrentScene().__audio.unlocked})')
            if reloaded['settings']!=result['saved'] or reloaded['unlocked']:raise RuntimeError('Audio settings/autoplay reload check failed')
            result['reload']=reloaded
        if '--fusion-relaunch-check' in sys.argv:
            await call('Page.reload')
            for _ in range(300):
                if await js('!!(window.testGame&&testGame.getSceneStack().getCurrentScene()?.__fusion&&testGame.__fusionArchive?.persistent)'): break
                await asyncio.sleep(.1)
            await js('globalThis.FUSION_PERSISTENCE_EXPECTATION='+json.dumps(result))
            result['pageReload']=await js((ROOT/'tools/fusion-persistence-qa.js').read_text(encoding='utf-8'))
        screenshot_data=None
        screenshot=next((a for a in sys.argv[3:] if not a.startswith('--')),None)
        pixel_sha=next((a.split('=',1)[1] for a in sys.argv[3:] if a.startswith('--pixel-sha=')),None)
        if screenshot or pixel_sha:
            await asyncio.sleep(.2)
            r = await call('Page.captureScreenshot',dict(format='png'))
            screenshot_data=base64.b64decode(r['data'])
            if pixel_sha:
                from PIL import Image
                pixels=Image.open(io.BytesIO(screenshot_data)).convert('RGB')
                actual=hashlib.sha256(pixels.tobytes()).hexdigest()
                if actual!=pixel_sha:raise RuntimeError('Native gameplay pixel comparison failed: '+actual)
                result['pixelComparison']={'matchesPreviousPreview':True,'sha256':actual,'size':list(pixels.size)}
            if not screenshot:screenshot_data=None
        print('RESULT', json.dumps(result)[:3500]); print('CONSOLE ERRORS',len(errors))
        if '--discovery-relaunch-check' in sys.argv or '--fusion-relaunch-check' in sys.argv:
            await ws.send(json.dumps(dict(id=count+1,method='Browser.close')))
            await asyncio.sleep(.1)
        return dict(result=result,progress=progress,consoleErrors=errors),screenshot,screenshot_data
async def verify_fusion_relaunch(expected):
    target=None
    for _ in range(100):
        try:target=next(t for t in json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json',timeout=1)) if t['type']=='page');break
        except Exception:await asyncio.sleep(.1)
    if not target:raise RuntimeError('Relaunched Fusion browser endpoint unavailable')
    async with websockets.connect(target['webSocketDebuggerUrl'],max_size=40000000) as ws:
        counter=0
        async def evaluate(code):
            nonlocal counter
            counter+=1;await ws.send(json.dumps(dict(id=counter,method='Runtime.evaluate',params=dict(expression=code,returnByValue=True,awaitPromise=True))))
            while True:
                r=json.loads(await ws.recv())
                if r.get('id')==counter:
                    if 'error' in r or 'exceptionDetails' in r.get('result',{}):raise RuntimeError(str(r))
                    return r.get('result',{}).get('result',{}).get('value')
        for _ in range(300):
            if await evaluate('!!(window.testGame&&testGame.getSceneStack().getCurrentScene()?.__fusion&&testGame.__fusionArchive?.persistent)'):break
            await asyncio.sleep(.1)
        await evaluate('globalThis.FUSION_PERSISTENCE_EXPECTATION='+json.dumps(expected))
        return await evaluate((ROOT/'tools/fusion-persistence-qa.js').read_text(encoding='utf-8'))
async def verify_discovery_relaunch():
    target=None
    for _ in range(100):
        try:target=next(t for t in json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json',timeout=1)) if t['type']=='page');break
        except Exception:await asyncio.sleep(.1)
    if not target:raise RuntimeError('Relaunched browser endpoint unavailable')
    async with websockets.connect(target['webSocketDebuggerUrl'],max_size=40000000) as ws:
        counter=0
        async def evaluate(code):
            nonlocal counter
            counter+=1;await ws.send(json.dumps(dict(id=counter,method='Runtime.evaluate',params=dict(expression=code,returnByValue=True,awaitPromise=True))))
            while True:
                r=json.loads(await ws.recv())
                if r.get('id')==counter:
                    if 'exceptionDetails' in r.get('result',{}):raise RuntimeError(str(r))
                    return r.get('result',{}).get('result',{}).get('value')
        for _ in range(300):
            if await evaluate('!!(window.testGame&&testGame.getSceneStack().getCurrentScene()?.__monsterDiscovery?.ready)'):break
            await asyncio.sleep(.1)
        return await evaluate("""(()=>{const g=testGame,s=g.getSceneStack().getCurrentScene(),d=s.__monsterDiscovery,v=s.getVariables();g.pause(true);const before={found:[...d.found],queue:d.queue.length,active:d.active,scope:d.scope,legacy:localStorage.getItem('celestialVoidMonsterDiscovery.v1'),unrelated:localStorage.getItem('celestialVoidBetaUnrelatedCheck'),audio:{...s.__audio.settings}};v.get('Wave').setNumber(1);v.get('WaveActive').setBoolean(true);v.get('WaveMode').setString('Manual');const w=s.__waveManager;w.queue=['Basic'];w.index=0;w.elapsed=v.get('SpawnInterval').getAsNumber();v.get('EnemiesToSpawn').setNumber(1);s.renderAndStep(16.667);return{before,encounterAgain:d.has('Basic')&&d.stats.shown===1&&d.stats.unlocks===1};})()""")
try:
    report,screenshot,screenshot_data=asyncio.run(main())
    if '--discovery-relaunch-check' in sys.argv:
        proc.wait(timeout=15)
        proc=start_browser()
        relaunched=asyncio.run(verify_discovery_relaunch());before=relaunched['before']
        if before['found'] or before['queue'] or before['active'] or before['legacy'] is not None or before['scope']!='session' or before['unrelated']!='preserve' or before['audio']!=report['result']['sessionAudioSettings'] or not relaunched['encounterAgain']:raise RuntimeError('Discovery fresh-session/audio-preference relaunch check failed: '+str(relaunched))
        report['result']['applicationRelaunch']=relaunched
        print('APPLICATION RELAUNCH PASS: discovery reset; encounter announces again; audio/unrelated storage preserved')
    if '--fusion-relaunch-check' in sys.argv:
        proc.wait(timeout=15)
        proc=start_browser()
        report['result']['applicationRelaunch']=asyncio.run(verify_fusion_relaunch(report['result']))
        print('FUSION APPLICATION RELAUNCH PASS: unlock/recipe restored; no duplicate notification; other storage preserved')
finally:
    # Stop this uniquely profiled browser and its descendants before deleting cache.
    if proc.poll() is None:
        subprocess.run(['taskkill','/PID',str(proc.pid),'/T','/F'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    proc.wait(timeout=10)
    try: profile.cleanup()
    except OSError: pass # A delayed Chromium child may still hold a cache file.
# Flush evidence after native Chrome releases memory/cache pressure on the drive.
Path(sys.argv[2]).write_text(json.dumps(report,indent=2),encoding='utf-8')
if screenshot_data:Path(screenshot).write_bytes(screenshot_data)
