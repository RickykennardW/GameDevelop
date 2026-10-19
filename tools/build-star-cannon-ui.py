"""Build original native SVG UI symbols and wire UI-only Star Cannon artwork.

The illustrated shop portrait is produced with image_gen. This maintained builder
does not modify tower/world animations, variables, prices, events or gameplay.
"""
import copy,json,math
from pathlib import Path

ROOT=Path(__file__).resolve().parent.parent
UI=ROOT/'assets/ui/star_cannon'
PORTRAIT='assets/ui/star_cannon/StarCannon_UI_Portrait.png'
ICONS={
    'PathDamage':'Path_StellarDestruction',
    'PathSpeed':'Path_CelestialBarrage',
    'SC_Nova_P1_1':'StarCompression',
    'SC_Nova_P1_2':'DenseStellarCore',
    'SC_Nova_P1_3':'NovaImpact',
    'SC_Nova_P1_4':'Starbreaker',
    'SC_Nova_P1_5':'SupernovaCannon',
    'SC_Nova_P2_1':'AstralAccelerator',
    'SC_Nova_P2_2':'RapidStarflow',
    'SC_Nova_P2_3':'TwinStarMuzzle',
    'SC_Nova_P2_4':'CosmicRhythm',
    'SC_Nova_P2_5':'CelestialOverdrive',
}

def polygon(points):return 'M '+' L '.join(f'{x:.2f} {y:.2f}' for x,y in points)+' Z'
def radial_star(cx,cy,outer,inner,n=4,offset=-math.pi/2):
    return polygon([(cx+math.cos(offset+i*math.pi/n)*(outer if i%2==0 else inner),cy+math.sin(offset+i*math.pi/n)*(outer if i%2==0 else inner)) for i in range(n*2)])
def gear(cx,cy,r=39,hole=17,teeth=10):
    points=[]
    for i in range(teeth*4):
        angle=-math.pi/2+(i-.5)*math.tau/(teeth*4);radius=r if i%4 in [1,2] else r*.8
        points.append((cx+math.cos(angle)*radius,cy+math.sin(angle)*radius))
    body=polygon(points)+f' M {cx-hole} {cy} a {hole} {hole} 0 1 0 {hole*2} 0 a {hole} {hole} 0 1 0 {-hole*2} 0 Z'
    return f'<path d="{body}" fill="url(#gold)" fill-rule="evenodd" stroke="#ffefbd" stroke-width="2"/>'
def icon_svg(name):
    gold='fill="url(#gold)" stroke="#fff0c4" stroke-width="2.4" stroke-linejoin="round"'
    ice='fill="url(#ice)" stroke="#e5f7ff" stroke-width="2.4" stroke-linejoin="round"'
    violet='fill="url(#violet)" stroke="#dcd4ff" stroke-width="2.4" stroke-linejoin="round"'
    white='fill="#f6fbff"'
    if name=='Path_StellarDestruction':
        body=f'<path d="{radial_star(64,64,49,28,8)}" fill="url(#violet)" opacity=".6"/><path d="M 64 18 L 90 48 L 76 48 L 76 97 L 52 97 L 52 48 L 38 48 Z" {gold}/><path d="M 61 39 L 67 39 L 67 86 L 61 86 Z" {white}/><path d="M 28 78 L 35 92 M 100 78 L 93 92 M 47 108 L 81 108" fill="none" stroke="#95d9ff" stroke-width="5" stroke-linecap="round"/>'
    elif name=='Path_CelestialBarrage':
        body=gear(71,64,44,20)+f'<path d="M 72 31 L 53 66 L 68 66 L 60 96 L 88 55 L 73 55 L 83 31 Z" {ice}/><path d="M 12 44 L 28 44 M 7 64 L 24 64 M 12 84 L 28 84" fill="none" stroke="#94e7ff" stroke-width="6" stroke-linecap="round"/>'
    elif name=='StarCompression':
        body=f'<path d="M 64 31 L 85 64 L 64 97 L 43 64 Z" {violet}/><path d="M 64 46 L 75 64 L 64 82 L 53 64 Z" {white}/><path d="M 12 52 L 24 52 L 24 43 L 41 64 L 24 85 L 24 76 L 12 76 Z M 116 52 L 104 52 L 104 43 L 87 64 L 104 85 L 104 76 L 116 76 Z" {gold}/><path d="M 49 15 L 64 28 L 79 15 M 49 113 L 64 100 L 79 113" fill="none" stroke="#b4e7ff" stroke-width="6" stroke-linejoin="round"/>'
    elif name=='DenseStellarCore':
        body=f'<path d="M 64 14 L 106 38 L 106 89 L 64 114 L 22 89 L 22 38 Z" {gold}/><path d="M 64 25 L 96 44 L 96 83 L 64 102 L 32 83 L 32 44 Z" fill="#231749" stroke="#d1c1ff" stroke-width="3"/><path d="M 64 34 L 87 49 L 87 78 L 64 94 L 41 78 L 41 49 Z" {violet}/><path d="M 64 37 L 64 63 L 43 50 M 64 63 L 85 50 M 64 63 L 64 91" fill="none" stroke="#f6f5ff" stroke-width="3"/><circle cx="64" cy="63" r="9" fill="url(#pearl)"/>'
    elif name=='NovaImpact':
        body=f'<circle cx="64" cy="64" r="40" fill="none" stroke="#ab9eff" stroke-width="4"/><path d="{radial_star(64,64,53,23,8)}" {gold}/><path d="{radial_star(64,64,32,11,4)}" {ice}/><circle cx="64" cy="64" r="10" fill="#fffaff"/>'
    elif name=='Starbreaker':
        body=f'<path d="M 62 15 L 25 29 L 27 67 Q 31 89 58 108 L 52 82 L 67 64 L 53 49 Z" {gold}/><path d="M 75 16 L 106 29 L 104 67 Q 100 91 72 112 L 65 85 L 80 65 L 67 49 Z" {ice}/><path d="M 67 15 L 59 49 L 74 64 L 59 83 L 67 111" fill="none" stroke="#c297ff" stroke-width="5"/><path d="M 9 76 L 24 70 M 107 65 L 120 60 M 14 27 L 25 38" fill="none" stroke="#e5b7ff" stroke-width="5" stroke-linecap="round"/>'
    elif name=='SupernovaCannon':
        body=f'<g transform="rotate(-42 64 64)"><path d="M 12 53 L 81 53 L 81 36 L 117 64 L 81 92 L 81 75 L 12 75 Z" {ice}/><path d="M 19 64 L 103 64" fill="none" stroke="#ffffff" stroke-width="5"/><path d="M 48 30 L 41 47 M 38 84 L 31 100 M 82 29 L 75 46 M 73 84 L 66 101" fill="none" stroke="url(#gold)" stroke-width="9" stroke-linecap="round"/></g>'
    elif name=='AstralAccelerator':
        body=gear(64,65,44,20)+f'<path d="M 67 33 L 47 68 L 63 68 L 57 98 L 85 56 L 69 56 L 78 33 Z" {ice}/><path d="M 15 24 L 25 34 M 105 99 L 115 109" fill="none" stroke="#b2a4ff" stroke-width="5" stroke-linecap="round"/>'
    elif name=='RapidStarflow':
        body=f'<path d="M 42 27 L 75 64 L 42 101 L 23 101 L 56 64 L 23 27 Z" {ice}/><path d="M 79 27 L 112 64 L 79 101 L 60 101 L 93 64 L 60 27 Z" {gold}/><path d="M 11 48 L 31 48 M 5 64 L 26 64 M 11 80 L 31 80" fill="none" stroke="#a49eff" stroke-width="5" stroke-linecap="round"/>'
    elif name=='TwinStarMuzzle':
        body=f'<path d="M 25 102 L 25 38 L 51 38 L 51 102 L 44 110 L 32 110 Z M 77 102 L 77 38 L 103 38 L 103 102 L 96 110 L 84 110 Z" {gold}/><path d="M 32 43 L 44 43 L 44 93 L 32 93 Z M 84 43 L 96 43 L 96 93 L 84 93 Z" {violet}/><path d="{radial_star(38,24,16,6)} {radial_star(90,24,16,6)}" {ice}/><path d="M 20 103 L 108 103" fill="none" stroke="#e6ecff" stroke-width="5" stroke-linecap="round"/>'
    elif name=='CosmicRhythm':
        body='<circle cx="64" cy="64" r="43" fill="none" stroke="url(#gold)" stroke-width="6"/><circle cx="64" cy="64" r="31" fill="none" stroke="#99d9ff" stroke-width="3" stroke-dasharray="38 14"/>'
        body+=f'<path d="M 28 65 L 44 65 L 53 43 L 65 86 L 77 50 L 85 65 L 101 65" fill="none" stroke="#f4eaff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>'
        for i in range(5):
            a=-math.pi/2+i*math.tau/5;x=64+43*math.cos(a);y=64+43*math.sin(a)
            body+=f'<circle cx="{x:.2f}" cy="{y:.2f}" r="6" fill="#b9caff" stroke="#fff1ca" stroke-width="2"/>'
    elif name=='CelestialOverdrive':
        body=f'<path d="M 27 26 Q 9 46 20 84 M 101 26 Q 119 46 108 84" fill="none" stroke="url(#gold)" stroke-width="8" stroke-linecap="round"/><path d="M 40 18 L 24 65 L 41 65 L 32 109 L 69 48 L 49 48 L 60 18 Z" {ice}/><path d="M 78 18 L 62 65 L 79 65 L 70 109 L 107 48 L 87 48 L 98 18 Z" {violet}/><path d="M 20 97 L 28 106 M 108 97 L 100 106" fill="none" stroke="#fff0bd" stroke-width="5" stroke-linecap="round"/>'
    else:raise ValueError(name)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
<defs>
<linearGradient id="gold" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#fff2bd"/><stop offset=".42" stop-color="#e7bc5d"/><stop offset=".72" stop-color="#a9702b"/><stop offset="1" stop-color="#f8d990"/></linearGradient>
<linearGradient id="ice" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="#f8ffff"/><stop offset=".44" stop-color="#9be4ff"/><stop offset="1" stop-color="#638bf7"/></linearGradient>
<linearGradient id="violet" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e2d5ff"/><stop offset=".48" stop-color="#9471e9"/><stop offset="1" stop-color="#5838ad"/></linearGradient>
<radialGradient id="pearl"><stop stop-color="#fffaff"/><stop offset=".3" stop-color="#d4e8ff"/><stop offset=".7" stop-color="#8f83ff"/><stop offset="1" stop-color="#7163df" stop-opacity=".12"/></radialGradient>
<radialGradient id="halo"><stop stop-color="#a79bff" stop-opacity=".18"/><stop offset="1" stop-color="#9783ff" stop-opacity="0"/></radialGradient>
</defs><circle cx="64" cy="64" r="58" fill="url(#halo)"/>{body}</svg>'''

def apply_ui(project,scene):
    """Reusable integration; preserve existing animation identities and gameplay."""
    objects={o['name']:o for o in scene['objects']}
    portrait=objects['TileType_Button']['animations'][0]
    for direction in portrait['directions']:
        for sprite in direction['sprites']:sprite['image']=PORTRAIT
    upgrades=objects['StarUpgradeIcon']['animations'];byname={a['name']:a for a in upgrades}
    template=copy.deepcopy(upgrades[0])
    for animation,filename in ICONS.items():
        if animation not in byname:
            a=copy.deepcopy(template);a['name']=animation;upgrades.append(a);byname[animation]=a
        a=byname[animation];a['directions'][0]['sprites'][0]['image']=f'assets/ui/star_cannon/{filename}.svg'
    resources=project['resources']['resources'];registered={r['name'] for r in resources}
    for file in [PORTRAIT]+[f'assets/ui/star_cannon/{f}.svg' for f in ICONS.values()]:
        assert (ROOT/file).is_file(),file
        if file not in registered:resources.append({'file':file,'kind':'image','metadata':'','name':file,'smoothed':True,'userAdded':True})

def main():
    UI.mkdir(parents=True,exist_ok=True)
    for name in ICONS.values():(UI/(name+'.svg')).write_text(icon_svg(name)+'\n',encoding='utf-8')
    mainfile=ROOT/'Tower Defense.json';scenefile=ROOT/'layouts/game-scene.json'
    p=json.loads(mainfile.read_text(encoding='utf-8-sig'));s=json.loads(scenefile.read_text(encoding='utf-8-sig'))
    apply_ui(p,s)
    for path,data in [(mainfile,p),(scenefile,s)]:path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('UI artwork integrated: one angled portrait, two path badges, ten specific upgrade symbols. No gameplay configuration changed.')

if __name__=='__main__':main()
