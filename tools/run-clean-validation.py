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
OUT = Path(os.environ.get('GD_VALIDATION_RESULTS', ROOT / 'design_previews/cleanup'))
OUT.mkdir(parents=True, exist_ok=True)
NAMES = ['test-clean-project', 'test-nova-wisp', 'test-void-hound', 'test-void-common', 'test-healthbars-balance', 'test-void-golem', 'test-gold-budget']
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
    sys.exit(subprocess.run([sys.executable,str(ROOT/'tools/run-native-suite.py'),name],env={**os.environ,'GD_VALIDATION_RESULTS':str(OUT)}).returncode)
