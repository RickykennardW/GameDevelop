"""Register selected final directional atlases, without editing or duplicating frames.
Reads alpha to compute runtime texture regions and foot anchors; no raster edits.
Only four selected built-in outputs are copied into game resources.
"""
import hashlib,json,shutil,sys
from pathlib import Path
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parent.parent
folder=ROOT/'assets/enemies/void_golem';folder.mkdir(parents=True,exist_ok=True)
selected={
 'Down':r'C:\Users\My ASUS\.codex\generated_images\01a11249-1cf3-7f03-9834-01083d6fb50c\exec-79d9156e-000e-4fe8-b923-f83000613508.png',
 'Up':r'C:\Users\My ASUS\.codex\generated_images\01a11249-1cf3-7f03-9834-01083d6fb50c\exec-78a63d93-5459-4b84-935d-0392e9eb9707.png',
 'Left':r'C:\Users\My ASUS\.codex\generated_images\01a11249-1cf3-7f03-9834-01083d6fb50c\exec-e837fd79-f125-4868-96c0-d4943aa67186.png',
 'Right':r'C:\Users\My ASUS\.codex\generated_images\01a11249-1cf3-7f03-9834-01083d6fb50c\exec-7c0453f2-d1d8-4923-b8dd-0a2a7c7027ae.png'}
views={};audit=[]
for direction,source in selected.items():
    target=folder/('VoidGolem_'+direction+'.png')
    if not target.exists():shutil.copyfile(source,target)
    else:assert target.read_bytes()==Path(source).read_bytes(),'refuse overwriting unrecognized asset'
    im=Image.open(target);assert im.mode=='RGBA';alpha=np.array(im.getchannel('A'));h,w=alpha.shape
    assert alpha.min()==0 and float((alpha==0).mean())>.1,'true transparent alpha required'
    profile=(alpha>100).sum(axis=1);ys=[0]
    for i in range(1,5):
        expected=round(i*h/5)
        ys.append(min(range(expected-60,expected+61),key=lambda y:(profile[y],abs(y-expected))))
    ys.append(h);frames=[];anchors=[];hashes=[]
    for row in range(5):
        y0,y1=ys[row:row+2]
        feet=[];cells=[]
        for col in range(4):
            x0=round(col*w/4);x1=round((col+1)*w/4);a=alpha[y0:y1,x0:x1]
            hits=np.argwhere(a>160);assert len(hits)>100
            # Opaque foot baseline from the lower body, excluding the soft glow.
            foot=float(np.quantile(hits[:,0],.995));feet.append(foot)
            cells.append((x0,x1,a))
        death_anchor=float(np.median(feet[:2]))
        for col,(x0,x1,a) in enumerate(cells):
            origin_x=(col+.5)*w/4-x0
            origin_y=death_anchor if row==3 else feet[col]
            frames.append([x0,y0,x1-x0,y1-y0]);anchors.append([origin_x/(x1-x0),origin_y/(y1-y0)])
            hashes.append(hashlib.sha256(a.tobytes()).hexdigest())
    assert len(set(hashes))==20,'twenty actual distinct source frames'
    views[direction]={'Image':target.relative_to(ROOT).as_posix(),'CellWidth':w/4,'Frames':frames,'Anchors':anchors}
    audit.append({'direction':direction,'size':[w,h],'alphaZeroFraction':float((alpha==0).mean()),'frameCount':20,'distinctAlphaFrames':len(set(hashes)),'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
# Uniform orig/trim canvas supplies transparent padding without raster edits.
canvas_height=max(frame[3] for view in views.values() for frame in view['Frames'])
for view in views.values():view['CellHeight']=canvas_height
manifest={'enemyID':'VoidGolem','method':'built-in imagegen;selected4directional atlases;runtime alpha-region/foot-anchor metadata;no raster editing','categories':['Idle','Move','Hit','Death','Skill'],'directions':['Up','Down','Left','Right'],'framesPerClip':4,'views':views,'files':audit,'totalBytes':sum(a['bytes'] for a in audit)}
(folder/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print('Prepared4finalRGBA atlases /80 distinct poses /20 clips;',manifest['totalBytes'],'bytes; no backup or intermediate copies')
