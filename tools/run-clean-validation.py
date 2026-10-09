"""Prepare native exported preview harnesses or run a meaningful regression suite.

First: node tools/validate-clean-project.cjs
Then: python tools/run-clean-validation.py --prepare
Then: python tools/run-clean-validation.py test-clean-project
      python tools/run-clean-validation.py test-nova-wisp
      python tools/test-clean-project-live.py
GD_VALIDATION_HOME may override the installed native validation runtime directory.
"""
import os, re, sys, subprocess, html
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
W = Path(os.environ.get('GD_VALIDATION_HOME', r'C:\Users\My ASUS\.codex\visualizations\2026\10\06\01a11249-1cf3-7f03-9834-01083d6fb50c\gdevelop-shop-rework-validation'))
OUT = ROOT / 'design_previews/cleanup'
OUT.mkdir(parents=True, exist_ok=True)
NAMES = ['test-clean-project', 'test-nova-wisp', 'test-void-hound', 'test-void-common']
if sys.argv[1:] == ['--prepare']:
    template = (W / 'preview/index.html').read_text(encoding='utf-8')
    prefix = (ROOT / 'tools/validation-fixture.txt').read_text(encoding='utf-8')
    for name in NAMES:
        body = (ROOT / 'tools' / (name + '.js')).read_text(encoding='utf-8')
        footer = "\n}catch(e){output.textContent=lines.join('\\n')+'\\nFAIL '+e.stack;document.title='FAIL '+e.message;}\n}\n"
        page = template.replace('<body>', '<body><pre id="results">RUNNING</pre>')
        page = page.replace('    (function() {', prefix + body + footer + '\n    (function() {')
        page = page.replace('game.startGameLoop();', 'runTowerTests(game);')
        (W / 'preview' / (name + '.html')).write_text(page, encoding='utf-8')
    (W / 'preview/clean-sidebar-live.html').write_text(template.replace('game.startGameLoop();', 'window.testGame=game;game.startGameLoop();'), encoding='utf-8')
    print('Prepared fresh native preview harnesses')
else:
    name = sys.argv[1]
    assert name in NAMES
    result = subprocess.run(['C:/Program Files/Google/Chrome/Application/chrome.exe', '--headless', '--allow-file-access-from-files', '--user-data-dir=' + str(W / (name + '-clean-profile')), '--window-size=1280,800', '--virtual-time-budget=120000', '--dump-dom', (W / 'preview' / (name + '.html')).as_uri()], capture_output=True, text=True, timeout=180)
    match = re.search(r'<pre id="results"[^>]*>(.*?)</pre>', result.stdout, re.S)
    text = html.unescape(match.group(1)) if match else result.stderr[-2000:]
    (OUT / (name + '-results.txt')).write_text(text, encoding='utf-8')
    passed = result.returncode == 0 and 'FAIL ' not in text and 'ALL ' in text and 'TESTS PASSED' in text
    print('PASS' if passed else 'FAIL', name, 'checks=', len(re.findall(r'^PASS ', text, re.M)))
    if not passed:
        print(text[-4000:])
        sys.exit(1)
