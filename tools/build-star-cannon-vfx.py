"""Integrate final Nova explosion atlas and armor status artwork, without backups.

Only visual configuration/animations. Initial Gold remains a scene variable;
rebuilding artwork never overwrites economy or gameplay configuration.
"""
import copy,json,re
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parent.parent
ATLAS='assets/effects/star_cannon/StarCannon_VFX_NovaExplosion.png'
ICON='assets/effects/star_cannon/Debuff_ArmorFracture_Icon.svg'

def variable(name,value):
    v={'name':name}
    if isinstance(value,dict):v.update(type='structure',children=[variable(k,x) for k,x in value.items()])
    elif isinstance(value,list):v.update(type='array',children=[variable(str(i),x) for i,x in enumerate(value)])
    else:v.update(type='boolean' if isinstance(value,bool) else 'string' if isinstance(value,str) else 'number',value=value)
    return v

def apply_vfx(project,scene):
    with Image.open(ROOT/ATLAS) as im:
        w,h=im.size;assert im.mode=='RGBA' and im.getchannel('A').getextrema()[0]==0
    frames=[]
    for i in range(8):
        x=round(i%4*w/4);right=round((i%4+1)*w/4);y=round(i//4*h/2);bottom=round((i//4+1)*h/2)
        frames.append([x,y,right-x,bottom-y])
    values={v['name']:v for v in scene['variables']}
    visual={'NovaExplosion':{'Image':ATLAS,'Frames':frames,'Duration':.64,'SizeMultiplier':1,'PeakOpacity':225,'ZOrder':15002},'ArmorFractureIcon':ICON}
    statuses={'GapAboveHealthBar':3,'HorizontalSpacing':3,'ZOrderOffset':10,'ArmorFractureSize':18,'FortificationOrder':10,'FractureOrder':20}
    for name,value in [('StarCannonVFXConfig',visual),('EnemyStatusIconConfig',statuses)]:
        if name not in values:scene['variables'].append(variable(name,value))
        elif name=='StarCannonVFXConfig':
            # Keep hand-tuned visual timing/mix while refreshing atlas bounds.
            cfg=values[name];nova=next(c for c in cfg['children'] if c['name']=='NovaExplosion')
            for child in nova['children']:
                if child['name']=='Frames':child.update(variable('Frames',frames))
    impact=next(o for o in scene['objects'] if o['name']=='StarCannonImpact');anims={a['name']:a for a in impact['animations']};template=copy.deepcopy(impact['animations'][0])
    for name,file in [('Explosion',ATLAS),('FractureIcon',ICON)]:
        if name not in anims:a=copy.deepcopy(template);a['name']=name;impact['animations'].append(a);anims[name]=a
        d=anims[name]['directions'][0];sprite=copy.deepcopy(d['sprites'][0]);sprite['image']=file;d['sprites']=[sprite];d['looping']=False;d['timeBetweenFrames']=.08
    resources=project['resources']['resources'];registered={r['name'] for r in resources}
    for file in [ATLAS,ICON]:
        assert (ROOT/file).is_file()
        if file not in registered:resources.append({'file':file,'kind':'image','metadata':'','name':file,'smoothed':True,'userAdded':True})
    # Only superseded generic VFX frames; every other project asset is retained.
    old=[r for r in resources if re.fullmatch(r'assets/towers/star_cannon/nova_spike/vfx/(Explosion|FractureIcon)_[0-5]\.svg',r['file'])]
    strings=json.dumps(scene);removed=[]
    for r in old:
        assert '"'+r['name']+'"' not in strings,'Old frame still in use: '+r['name']
        path=(ROOT/r['file']).resolve();assert path.is_relative_to((ROOT/'assets/towers/star_cannon/nova_spike/vfx').resolve()) and not path.is_symlink() and not path.is_junction()
        if path.is_file():path.unlink();removed.append(r['file'])
    names={r['name'] for r in old};resources[:]=[r for r in resources if r['name'] not in names]
    return removed

def main():
    (ROOT/ICON).write_text('''<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
<defs><linearGradient id="g" x2=".7" y2="1"><stop stop-color="#fff4c6"/><stop offset=".45" stop-color="#e9ba59"/><stop offset="1" stop-color="#ad752d"/></linearGradient><linearGradient id="b" x2=".6" y2="1"><stop stop-color="#ffffff"/><stop offset=".4" stop-color="#b9eaff"/><stop offset="1" stop-color="#8c77ec"/></linearGradient></defs>
<path d="M 59 12 L 21 28 L 24 66 Q 27 91 57 113 L 49 85 L 64 66 L 49 48 Z" fill="url(#g)" stroke="#291e49" stroke-width="7" stroke-linejoin="round"/>
<path d="M 77 12 L 108 28 L 105 66 Q 102 93 74 114 L 64 85 L 82 65 L 65 48 Z" fill="url(#b)" stroke="#291e49" stroke-width="7" stroke-linejoin="round"/>
<path d="M 59 14 L 23 29 M 77 14 L 106 29 M 29 69 Q 34 88 53 102 M 100 69 Q 95 89 78 103" fill="none" stroke="#fff7db" stroke-width="5" stroke-linecap="round"/>
<path d="M 65 11 L 56 47 L 73 65 L 57 85 L 66 115" fill="none" stroke="#d49fff" stroke-width="6" stroke-linejoin="round"/>
</svg>\n''',encoding='utf-8')
    mainfile=ROOT/'Tower Defense.json';scenefile=ROOT/'layouts/game-scene.json';project=json.loads(mainfile.read_text(encoding='utf-8-sig'));scene=json.loads(scenefile.read_text(encoding='utf-8-sig'))
    removed=apply_vfx(project,scene)
    for path,data in [(mainfile,project),(scenefile,scene)]:path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    out=ROOT/'validation/star-vfx-assets.json';prior=json.loads(out.read_text()) if out.exists() else {}
    out.write_text(json.dumps({'explosion':ATLAS,'armorFracture':ICON,'frames':8,'supersededGenericFramesRemoved':removed or prior.get('supersededGenericFramesRemoved',[]),'initialGold':next(v for v in scene['variables'] if v['name']=='Money')['value'],'gameplayModifiersUnchanged':True},indent=2)+'\n',encoding='utf-8')
    print('Integrated 8-frame Nova explosion, static armor fracture icon, shared status UI config; replaced generic frames:',len(removed))

if __name__=='__main__':main()
