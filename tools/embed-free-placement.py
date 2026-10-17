"""Embed maintained runtime sources directly; never create project copies."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
path=ROOT/'layouts/game-scene.json'
source=path.read_text(encoding='utf-8')
scene=json.loads(source)
mapping=json.loads((ROOT/'tools/source-mapping.json').read_text(encoding='utf-8'))
for root,children,filename in mapping:
    event=scene['events'][root]
    for child in children:event=event['events'][child]
    assert event['type']=='BuiltinCommonInstructions::JsCode',filename
    event['inlineCode']=(ROOT/'tools'/filename).read_text(encoding='utf-8-sig').splitlines()
decoder=json.JSONDecoder();cursor=1
while cursor<len(source):
    while source[cursor].isspace() or source[cursor]==',':cursor+=1
    key,length=decoder.raw_decode(source[cursor:]);cursor+=length
    while source[cursor].isspace() or source[cursor]==':':cursor+=1
    _,length=decoder.raw_decode(source[cursor:])
    if key=='events':
        text=json.dumps(scene['events'],ensure_ascii=False,indent=2).replace('\n','\n  ')
        result=source[:cursor]+text+source[cursor+length:]
        assert json.loads(result)==scene
        if result!=source:path.write_text(result,encoding='utf-8')
        break
    cursor+=length
