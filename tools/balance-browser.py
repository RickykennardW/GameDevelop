"""Run diagnostic/validation JavaScript in the actual exported GDevelop preview.

Fixture scripts operate a test scene only. They do not replace gameplay code.
Usage: python tools/balance-browser.py SCRIPT.js OUTPUT.json [SCREENSHOT.png]
"""
import asyncio, base64, json, os, socket, subprocess, sys, tempfile, urllib.request
from pathlib import Path
import websockets

ROOT = Path(__file__).resolve().parent.parent
W = Path(os.environ.get('GD_VALIDATION_HOME', r'C:\Users\My ASUS\.codex\visualizations\2026\10\06\01a11249-1cf3-7f03-9834-01083d6fb50c\gdevelop-shop-rework-validation'))
sock = socket.socket(); sock.bind(('127.0.0.1', 0)); port = sock.getsockname()[1]; sock.close()
profile=tempfile.TemporaryDirectory(prefix='balance-browser-profile-',dir=W)
profile_path=Path(profile.name).resolve()
assert profile_path.parent==W.resolve() and profile_path.name.startswith('balance-browser-profile-')
proc = subprocess.Popen(['C:/Program Files/Google/Chrome/Application/chrome.exe', '--headless', '--disable-extensions', '--disable-background-networking', '--disable-component-update', '--disable-sync', '--no-first-run', '--allow-file-access-from-files', '--remote-debugging-port='+str(port), '--user-data-dir='+profile.name, '--window-size=1920,1080', '--hide-scrollbars', (W/'preview/clean-sidebar-live.html').as_uri()], stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)

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
        for _ in range(300):
            if await js('!!(window.testGame&&testGame.getSceneStack().getCurrentScene()?.__starCannon)'): break
            await asyncio.sleep(.1)
        await call('Emulation.setDeviceMetricsOverride', dict(width=1920,height=1080,deviceScaleFactor=1,mobile=False))
        mode=next((a.split('=',1)[1] for a in sys.argv[3:] if a.startswith('--mode=')),None)
        if mode: await js('globalThis.BALANCE_MODE='+json.dumps(mode))
        if '--gesture' in sys.argv:
            await js('globalThis.audioGateBeforeGesture=!!testGame.getSceneStack().getCurrentScene().__audio&&!testGame.getSceneStack().getCurrentScene().__audio.unlocked')
            await call('Input.dispatchMouseEvent',dict(type='mousePressed',x=10,y=10,button='left',clickCount=1))
            await call('Input.dispatchMouseEvent',dict(type='mouseReleased',x=10,y=10,button='left',clickCount=1))
        try: result = await js(Path(sys.argv[1]).read_text(encoding='utf-8'))
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
        screenshot_data=None
        screenshot=next((a for a in sys.argv[3:] if not a.startswith('--')),None)
        if screenshot:
            await asyncio.sleep(.2)
            r = await call('Page.captureScreenshot',dict(format='png'))
            screenshot_data=base64.b64decode(r['data'])
        print('RESULT', json.dumps(result)[:3500]); print('CONSOLE ERRORS',len(errors))
        return dict(result=result,progress=progress,consoleErrors=errors),screenshot,screenshot_data
try: report,screenshot,screenshot_data=asyncio.run(main())
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
