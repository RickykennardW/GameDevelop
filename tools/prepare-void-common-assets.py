"""Permitted sprite image processing: extract generated poses, normalize/pad to128px.
The creature illustrations come from imagegen; processing does not invent artwork.
Input: design_previews/void_enemies/source-map.json with twelve selected image paths.
"""
import hashlib, json
from pathlib import Path
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parent.parent
PREVIEW=ROOT/'design_previews/void_enemies'
SOURCE=json.loads((PREVIEW/'source-map.json').read_text(encoding='utf-8'))
SLUGS={'VoidGuard':'void_guard','VoidSentinel':'void_sentinel','VoidBrute':'void_brute'}
STATES=['Idle','Move','Hit','Death']
report=[]
for enemy, directions in SOURCE.items():
    folder=ROOT/'assets/enemies'/SLUGS[enemy]
    folder.mkdir(parents=True,exist_ok=True)
    sources=PREVIEW/'source_atlases'/SLUGS[enemy]
    sources.mkdir(parents=True,exist_ok=True)
    manifest=[]
    for direction, source in directions.items():
        data=Path(source).read_bytes()
        source_copy=sources/(enemy+'_'+direction+'_Atlas.png')
        source_copy.write_bytes(data)
        image=Image.open(source_copy).convert('RGBA')
        rgba=np.array(image);alpha=rgba[:,:,3];height,width=alpha.shape
        assert alpha.min()==0 and (alpha==0).mean()>.10,(enemy,direction,'background not transparent')
        ys=[0]
        for k in [1,2,3]:
            target=round(k*height/4);profile=(alpha>64).sum(axis=1)
            ys.append(min(range(max(1,target-32),min(height-1,target+33)),key=lambda y:(profile[y],abs(y-target))))
        ys.append(height)
        cells=[]
        for row in range(4):
            low,high=ys[row:row+2];profile=(alpha[low:high]>64).sum(axis=0);xs=[0]
            for k in [1,2,3]:
                target=round(k*width/4)
                xs.append(min(range(max(1,target-45),min(width-1,target+46)),key=lambda x:(profile[x],abs(x-target))))
            xs.append(width)
            for column in range(4):
                left,right=xs[column:column+2]
                crop=image.crop((left,low,right,high))
                a=np.array(crop.getchannel('A'))
                meaningful=np.argwhere(a>12)
                assert len(meaningful)>100
                y0,x0=meaningful.min(axis=0);y1,x1=meaningful.max(axis=0)+1
                origin=((column+.5)*width/4-left,(row+.55)*height/4-low)
                # Largest distance from common source origin; one scale per direction.
                extent=max(abs(x0-origin[0]),abs(x1-origin[0]),abs(y0-origin[1]),abs(y1-origin[1]))
                cells.append((row,column,crop,origin,extent,[left,low,right-left,high-low]))
        scale=54/max(cell[4] for cell in cells)
        for row,column,crop,origin,extent,rect in cells:
            size=(max(1,round(crop.width*scale)),max(1,round(crop.height*scale)))
            resized=crop.resize(size,Image.Resampling.LANCZOS)
            # Clear invisible RGB fringe only; preserve all visible original alpha.
            canvas=Image.new('RGBA',(128,128),(0,0,0,0))
            at=(round(64-origin[0]*scale),round(64-origin[1]*scale))
            canvas.paste(resized,at)
            file=folder/(STATES[row]+'_'+direction+'_'+str(column)+'.png')
            canvas.save(file,optimize=True)
            bbox=canvas.getchannel('A').getbbox()
            pixels=np.array(canvas.getchannel('A'))
            assert bbox and (pixels==0).mean()>.20
            assert not (pixels[0,:]>32).any() and not (pixels[-1,:]>32).any() and not (pixels[:,0]>32).any() and not (pixels[:,-1]>32).any(),(enemy,direction,row,column,'opaque clipping')
            manifest.append({'file':file.relative_to(ROOT).as_posix(),'state':STATES[row],'direction':direction,'frame':column,'size':[128,128],'origin':[0,0],'center':[64,64],'sourceRect':rect,'sourceScale':scale,'alphaBBox':bbox,'zeroAlphaFraction':float((pixels==0).mean()),'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
    assert len(manifest)==64 and len({p['sha256'] for p in manifest})==64
    document={'enemyID':enemy,'mode':'imagegen illustration + permitted PIL extraction/resize/padding','nativeFrameSize':[128,128],'categories':STATES,'directions':['Up','Down','Left','Right'],'frames':manifest,'bytes':sum(p['bytes'] for p in manifest)}
    (folder/'manifest.json').write_text(json.dumps(document,indent=2),encoding='utf-8')
    report.append({'enemy':enemy,'frames':64,'bytes':document['bytes']})
(PREVIEW/'asset-processing-summary.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('PREPARED',report)
