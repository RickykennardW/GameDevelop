"""Embed the reviewed placement sources in their existing GDevelop event blocks."""
import json
from pathlib import Path

root = Path(__file__).resolve().parent.parent
path = root / 'layouts/game-scene.json'
source = path.read_text(encoding='utf-8')
scene = json.loads(source)
for index, child, filename in [
    (0, 0, 'responsive-map-runtime.js'),
    (0, 1, 'island-map-runtime.js'),
    (1, 0, 'unit-index-runtime.js'),
    (15, 0, 'island-render-runtime.js'),
    (1, 1, 'selected-panel-runtime.js'),
    (1, 2, 'obstacle-panel-runtime.js'),
    (3, 0, 'world-selection-runtime.js'),
    (6, None, 'free-placement-runtime.js'),
    (9, 0, 'free-placement-click.js'),
    (17, 0, 'free-placement-rings.js'),
    (10, 9, 'star-cannon-runtime.js'),
    (10, 1, 'nova-wave-manager.js'),
    (10, 2, 'nova-spawn-runtime.js'),
    (10, 12, 'nova-death-runtime.js'),
    (10, (0, 1), 'nova-wisp-runtime.js'),
    (10, (3, 0), 'nova-movement-runtime.js'),
]:
    event = scene['events'][index]
    if child is not None:
        for nested in (child if isinstance(child, tuple) else (child,)):
            event = event['events'][nested]
    assert event['type'] == 'BuiltinCommonInstructions::JsCode'
    event['inlineCode'] = (root / 'tools' / filename).read_text(encoding='utf-8-sig').splitlines()

# Locate the top-level events value, skipping nested keys with identical names.
decoder = json.JSONDecoder()
cursor = 1
while cursor < len(source):
    while source[cursor].isspace() or source[cursor] == ',':
        cursor += 1
    if source[cursor] == '}':
        raise ValueError('Missing root events')
    key, length = decoder.raw_decode(source[cursor:])
    cursor += length
    while source[cursor].isspace() or source[cursor] == ':':
        cursor += 1
    _, length = decoder.raw_decode(source[cursor:])
    if key == 'events':
        replacement = json.dumps(scene['events'], indent=2, ensure_ascii=False).replace('\n', '\n  ')
        result = source[:cursor] + replacement + source[cursor + length:]
        assert json.loads(result) == scene
        path.write_text(result, encoding='utf-8')
        break
    cursor += length
