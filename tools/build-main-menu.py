"""Build the final vector UI and MainMenu directly. Never copy the gameplay scene."""
import copy, json, uuid
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen

ROOT=Path(__file__).resolve().parent.parent
ART=ROOT/'assets/ui/main_menu'
ART.mkdir(exist_ok=True)
font=TTFont('C:/Windows/Fonts/georgia.ttf');glyphs=font.getGlyphSet();cmap=font.getBestCmap()
cursor=0;paths=[];size=72/font['head'].unitsPerEm
for char in 'STARFALL BASTION':
    if char!=' ':
        pen=SVGPathPen(glyphs);glyphs[cmap[ord(char)]].draw(pen)
        paths.append(f'<path d="{pen.getCommands()}" transform="translate({cursor:.3f},108) scale({size:.8f},-{size:.8f})"/>')
    cursor+=font['hmtx'][cmap[ord(char)]][0]*size+5
left=(1000-cursor+5)/2
(ART/'starfall_title.svg').write_text(f'''<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="170" viewBox="0 0 1000 170">
<defs><linearGradient id="gold" x2="0" y2="1"><stop stop-color="#fff9e9"/><stop offset=".47" stop-color="#ead3a2"/><stop offset=".62" stop-color="#ad8960"/><stop offset="1" stop-color="#f4ddb0"/></linearGradient><filter id="aura" x="-30%" y="-70%" width="160%" height="240%"><feGaussianBlur stdDeviation="4"/></filter></defs>
<g fill="none" stroke="#c4a273" stroke-width=".8" opacity=".6"><path d="M205 145H468M532 145H795M355 26H470M530 26H645"/></g>
<path d="M500 7L504 22L518 26L504 30L500 45L496 30L482 26L496 22Z" fill="#dfc396"/><circle cx="500" cy="26" r="27" fill="none" stroke="#9b8f91" stroke-width=".6"/>
<g transform="translate({left:.3f},0)" fill="#9185da" opacity=".6" filter="url(#aura)">{''.join(paths)}</g>
<g transform="translate({left:.3f},0)" fill="url(#gold)" stroke="#ffedc7" stroke-width="4">{''.join(paths)}</g>
<path d="M500 139L506 145L500 151L494 145Z" fill="#c4a273"/></svg>''',encoding='utf-8')
for kind in ['start','exit']:
    for state in ['normal','hover']:
        primary=kind=='start';hover=state=='hover'
        border='#f3dcaa' if hover else '#ba9a69' if primary else '#7e7b9a'
        fill='#30284b' if hover else '#201c36' if primary else '#13182d'
        accent='#a6d8f3' if hover else '#8b90bd'
        (ART/f'{kind}_{state}.svg').write_text(f'''<svg xmlns="http://www.w3.org/2000/svg" width="320" height="72" viewBox="0 0 320 72">
<defs><linearGradient id="surface" x2="0" y2="1"><stop stop-color="{fill}"/><stop offset="1" stop-color="#0d1124" stop-opacity=".96"/></linearGradient><filter id="glow" x="-20%" y="-70%" width="140%" height="240%"><feGaussianBlur stdDeviation="2.5"/></filter></defs>
<path d="M18 7H302L313 18V54L302 65H18L7 54V18Z" fill="none" stroke="{accent}" stroke-width="3" opacity="{'.45' if hover else '.14'}" filter="url(#glow)"/>
<path d="M18 7H302L313 18V54L302 65H18L7 54V18Z" fill="url(#surface)" stroke="{border}" stroke-width="1.25"/>
<path d="M23 12H297L308 22V50L297 60H23L12 50V22Z" fill="none" stroke="{accent}" stroke-width=".65" opacity=".35"/>
<path d="M32 7H82M238 7H288M32 65H82M238 65H288" stroke="{border}" stroke-width="2"/>
<path d="M27 32L31 36L27 40L23 36Z M293 32L297 36L293 40L289 36Z" fill="{border}" opacity=".8"/></svg>''',encoding='utf-8')

project_path=ROOT/'Tower Defense.json';project=json.loads(project_path.read_text(encoding='utf-8'))
gameplay=json.loads((ROOT/'layouts/game-scene.json').read_text(encoding='utf-8'))
base_sprite=next(o for o in gameplay['objects'] if o['name']=='ShopPlayIcon')
base_text=next(o for o in gameplay['objects'] if o['name']=='IndexText')
def sprite(name,images):
    o=copy.deepcopy(base_sprite);o.update(name=name,persistentUuid=str(uuid.uuid4()))
    o['animations']=[]
    for label,image in images:
        frame=copy.deepcopy(base_sprite['animations'][0]['directions'][0]['sprites'][0]);frame['image']=image
        o['animations'].append({'name':label,'useMultipleDirections':False,'directions':[{'looping':False,'timeBetweenFrames':.1,'sprites':[frame]}]})
    return o
def text(name,value,size,bold,color):
    o=copy.deepcopy(base_text);o.update(name=name,persistentUuid=str(uuid.uuid4()),string=value,characterSize=size,bold=bold,textAlignment='center')
    r,g,b=map(int,color.split(';'));o['color']={'r':r,'g':g,'b':b}
    o['content'].update(text=value,characterSize=size,bold=bold,color=color,textAlignment='center');return o
resource=lambda f:'assets/ui/main_menu/'+f
objects=[sprite('MenuBackground',[('Default',resource('starfall_bastion_background.png'))]),sprite('MenuTitle',[('Default',resource('starfall_title.svg'))])]
for kind in ['start','exit']:objects.append(sprite('Menu'+kind.title(),[(state.title(),resource(f'{kind}_{state}.svg')) for state in ['normal','hover']]))
objects += [text('MenuStartLabel','START',18,True,'250;239;213'),text('MenuExitLabel','EXIT GAME',15,False,'205;211;231'),text('MenuSubtitle','CELESTIAL TOWER DEFENSE',10,False,'161;180;204'),text('MenuStatus','',12,False,'193;204;226')]
instances=[]
for name,x,y,w,h,z in [('MenuBackground',0,0,1280,720,0),('MenuTitle',140,125,1000,170,2),('MenuStart',480,396,320,72,3),('MenuExit',480,479,320,72,3),('MenuStartLabel',480,421,320,24,4),('MenuExitLabel',480,504,320,22,4),('MenuSubtitle',390,298,500,20,2),('MenuStatus',340,583,600,35,4)]:
    instances.append({'name':name,'persistentUuid':str(uuid.uuid4()),'x':x,'y':y,'zOrder':z,'layer':'' if name=='MenuBackground' else 'MenuUI','angle':0,'customSize':True,'width':w,'height':h,'depth':1,'keepRatio':True,'numberProperties':[],'stringProperties':[],'initialVariables':[]})
layers=[]
for name in ['', 'MenuUI']:
    layer=copy.deepcopy(gameplay['layers'][0]);layer.update(name=name,visibility=True);layers.append(layer)
scene={'name':'MainMenu','mangledName':'MainMenu','title':'Starfall Bastion','r':7,'v':9,'b':23,'disableInputWhenNotFocused':True,'standardSortMethod':True,'stopSoundsOnStartup':True,'renderer3DWorldScale':100,'uiSettings':{'grid':False,'zoomFactor':.75,'windowMask':False,'selectedLayer':'MenuUI','gameEditorMode':'instances-editor'},'objectsGroups':[],'variables':[{'name':'MenuConfig','type':'structure','children':[{'name':'GameplayScene','type':'string','value':'Game Scene'},{'name':'HoverScale','type':'number','value':1.06},{'name':'TransitionSeconds','type':'number','value':.28}]}],'objects':objects,'instances':instances,'layers':layers,'objectsFolderStructure':{'folderName':'__ROOT','children':[{'folderName':'ART','children':[{'objectName':n} for n in ['MenuBackground','MenuTitle']]},{'folderName':'ACTIONS','children':[{'objectName':n} for n in ['MenuStart','MenuExit','MenuStartLabel','MenuExitLabel']]},{'folderName':'TEXT','children':[{'objectName':n} for n in ['MenuSubtitle','MenuStatus']]}]},'behaviorsSharedData':[],'events':[{'type':'BuiltinCommonInstructions::JsCode','inlineCode':(ROOT/'tools/main-menu-runtime.js').read_text(encoding='utf-8').splitlines(),'parameterObjects':'','useStrict':True}]}
scene_path=ROOT/'layouts/main-menu.json'
if scene_path.exists():
    # Rebuild only the maintained event, preserving user-authored menu data.
    existing=json.loads(scene_path.read_text(encoding='utf-8'));existing['events'][0]['inlineCode']=scene['events'][0]['inlineCode'];scene=existing
scene_path.write_text(json.dumps(scene,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
for file in ['starfall_bastion_background.png','starfall_title.svg','start_normal.svg','start_hover.svg','exit_normal.svg','exit_hover.svg']:
    path=resource(file)
    if not any(r['name']==path for r in project['resources']['resources']):project['resources']['resources'].append({'name':path,'file':path,'kind':'image','smoothed':True,'userAdded':True,'metadata':''})
reference={'__REFERENCE_TO_SPLIT_OBJECT':True,'referenceTo':'/layouts/main-menu'}
project['layouts']=[reference]+[l for l in project['layouts'] if l.get('referenceTo')!='/layouts/main-menu']
project['firstLayout']='MainMenu';project['properties']['name']='Starfall Bastion'
project_path.write_text(json.dumps(project,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('MainMenu: 8 objects, 6 final art resources; entry scene MainMenu; gameplay file untouched.')
