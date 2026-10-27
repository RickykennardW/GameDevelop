// A development-only economy/upgrade UI. Native prices, recipes and validation own all transactions.
const scene=runtimeScene,sv=scene.getVariables(),game=scene.getGame();
if(!scene.__devCheats&&sv.get('DEV_CHEATS_ENABLED').getAsBoolean()&&game.isPreview?.()===true){
 const config=sv.get('DevCheatConfig').toJSObject(),layer=scene.getLayer('DeveloperUI'),root=new PIXI.Container();root.interactive=false;root.interactiveChildren=false;layer.getRenderer().getRendererObject().addChild(root);
 const d=scene.__devCheats={config,root,open:false,disposed:false,scroll:0,down:game.getInputManager().isMouseButtonPressed(0),captured:false,pressed:'',pending:'',path:1,selectedId:0,notice:'Session tools / normal prices apply',noticeAge:0,buttons:[],lastDisplay:1};
 d.enabled=()=>!d.disposed&&sv.get('DEV_CHEATS_ENABLED').getAsBoolean()&&game.isPreview?.()===true;
 d.obscured=()=>sv.get('GameOver').getAsBoolean()||sv.get('DefeatActive').getAsBoolean()||sv.get('IndexOpen').getAsBoolean()||sv.get('AudioPanelOpen').getAsBoolean()||sv.get('CampaignTutorialActive').getAsBoolean()||sv.get('FusionActive').getAsBoolean();
 d.feedback=(message,error=false)=>{d.notice=message;d.error=error;d.noticeAge=config.FeedbackSeconds;};
 d.guard=()=>{if(!d.enabled()){d.feedback('Developer Cheats Disabled',true);return false;}if(d.obscured()){d.feedback('Close the active modal / testing flow first',true);return false;}return true;};
 d.amount=raw=>{const value=String(raw??'').trim();if(!/^[1-9]\d*$/.test(value))return null;const n=Number(value),limit=Math.min(Number.MAX_SAFE_INTEGER,Number(config.GoldLimit));return Number.isSafeInteger(n)&&Number.isFinite(limit)&&limit>0&&n<=limit?n:null;};
 d.moneyHUD=()=>{for(const text of scene.getObjects('MoneyText'))text.setString(String(sv.get('Money').getAsNumber()));};
 d.gold=(raw,set=false)=>{
  if(!d.guard())return false;const n=d.amount(raw),before=sv.get('Money').getAsNumber(),limit=Math.min(Number.MAX_SAFE_INTEGER,Number(config.GoldLimit));
  if(n===null||!Number.isSafeInteger(before)||before<0||!Number.isSafeInteger(set?n:before+n)||(set?n:before+n)>limit){d.feedback('Invalid Gold Amount / limit '+Number(limit).toLocaleString('en-US'),true);return false;}
  sv.get('Money').setNumber(set?n:before+n);d.moneyHUD();d.feedback((set?'SET ': '+')+n.toLocaleString('en-US')+' DEV GOLD');scene.__audio?.play('UIClick');return true;
 };
 d.addGold=raw=>d.gold(raw,false);d.setGold=raw=>d.gold(raw,true);
 d.selected=()=>scene.getObjects('StarCannonTower').find(t=>t.getVariables().get('TowerId').getAsNumber()===sv.get('SelectedTower').getAsNumber());
 d.target=()=>{const star=scene.__starCannon,max=star?.config.MaxLevel;if(!Number.isInteger(max))return null;let cross=-1;for(let n=0;n<=max;n++)if(star.valid(max,n)&&star.valid(n,max))cross=n;return cross<0?null:d.path===1?[max,cross]:[cross,max];};
 d.setPath=path=>{if(!d.guard()||![1,2].includes(path))return false;d.path=path;return true;};
 d.maxSelected=()=>{
  if(!d.guard())return false;const tower=d.selected(),star=scene.__starCannon;
  if(!tower){d.feedback('No Tower Selected',true);return false;}
  if(!star||star.isFusion(tower)){d.feedback('Selected Tower has no supported upgrade path',true);return false;}
  const target=d.target(),v=tower.getVariables(),current=[v.get('Path1Level').getAsNumber(),v.get('Path2Level').getAsNumber()];
  if(!target||!star.valid(...current)||!star.valid(...target)||current.some((n,i)=>n>target[i])){d.feedback('Path Locked / choose the other legal build',true);return false;}
  if(current.every((n,i)=>n===target[i])){d.feedback('Tower Already Maxed');return false;}
  let cost=0;const sequence=[];
  for(let path=0;path<2;path++)for(let n=current[path];n<target[path];n++){const upgrade=star.config.Paths[path]?.Upgrades[n];if(!Number.isSafeInteger(upgrade?.Cost)||upgrade.Cost<0){d.feedback('Unsupported Tower upgrade configuration',true);return false;}cost+=upgrade.Cost;sequence.push(path+1);}
  if(sv.get('Money').getAsNumber()<cost){d.feedback('Need '+(cost-sv.get('Money').getAsNumber()).toLocaleString('en-US')+' more Gold',true);return false;}
  for(const path of sequence){if(!d.enabled()||!star.upgrade(tower,path)){d.moneyHUD();d.feedback('Upgrade stopped by native validation',true);return false;}}
  d.moneyHUD();star.render();scene.__selectedPanel?.render();d.feedback('Tower Maxed / '+target.join('-')+' / '+cost.toLocaleString('en-US')+' Gold spent');return true;
 };
 d.startFusion=()=>{if(!d.guard())return false;const tower=d.selected();if(!tower){d.feedback('No Tower Selected',true);return false;}if(!scene.__fusion?.eligible(tower)){d.feedback('Fusion needs a legal 5-2 or 2-5 source',true);return false;}if(!scene.__fusion.begin(tower)){d.feedback('Fusion unavailable',true);return false;}d.close();return true;};
 d.text=(value,size=12,color=0xcdd2e8,bold=false,parent=root)=>{const t=new PIXI.Text(value,{fontFamily:'Arial',fontSize:size,fill:color,fontWeight:bold?'bold':'normal'});parent.addChild(t);return t;};
 d.button=(id,label,parent=root)=>{const container=new PIXI.Container(),frame=new PIXI.Graphics();container.addChild(frame);parent.addChild(container);const text=d.text(label,12,0xe2e2f0,true,container);text.anchor.set(.5);const b={id,container,frame,text};d.buttons.push(b);return b;};
 d.place=(b,x,y,w,h)=>{b.r={x,y,w,h};b.container.position.set(x,y);b.text.position.set(w/2,h/2);};
 d.paint=(b,hot=false,active=false)=>{const {w,h}=b.r,key=[w,h,hot,active].join(':');if(b.key===key)return;b.key=key;b.frame.clear().lineStyle(1,active?0xa7cae9:hot?0xb5a8dc:0x60527e,.9).beginFill(active?0x353052:hot?0x302747:0x1a1b35,.97).drawRoundedRect(0,0,w,h,5).endFill();};
 d.launcher=d.button('toggle','DEV');d.launcher.text.style.fontSize=10;
 d.panel=new PIXI.Container();root.addChild(d.panel);d.frame=new PIXI.Graphics();d.panel.addChild(d.frame);d.title=d.text('DEVELOPER TOOLS',14,0xddcff1,true,d.panel);d.subtitle=d.text('SESSION TESTING',9,0x88bed1,false,d.panel);d.exit=d.button('close','X',d.panel);
 d.body=new PIXI.Container();d.content=new PIXI.Container();d.mask=new PIXI.Graphics();d.panel.addChild(d.body,d.mask);d.body.addChild(d.content);d.body.mask=d.mask;
 d.balance=d.text('',13,0xe5d7a7,true,d.content);d.goldLabel=d.text('GOLD CONTROLS',10,0x91c6da,true,d.content);d.presets=[1000,5000,10000,50000].map(n=>d.button('gold'+n,'+'+n.toLocaleString('en-US'),d.content));
 d.customLabel=d.text('CUSTOM AMOUNT',10,0xaeb7d3,true,d.content);d.inputFrame=new PIXI.Graphics();d.content.addChild(d.inputFrame);d.add=d.button('add','ADD GOLD',d.content);d.set=d.button('set','SET BALANCE',d.content);d.limit=d.text('',9,0x9399b5,false,d.content);
 d.towerLabel=d.text('TOWER TESTING',10,0x91c6da,true,d.content);d.towerName=d.text('',12,0xd9d8e6,false,d.content);d.paths=[d.button('path1','5 - 2',d.content),d.button('path2','2 - 5',d.content)];d.max=d.button('max','MAX SELECTED TOWER',d.content);d.costNote=d.text('Uses real upgrade costs and legal path locks.',10,0x999fbb,false,d.content);
 d.fusionLabel=d.text('FUSION TESTING',10,0x91c6da,true,d.content);d.fusion=d.button('fusion','START NORMAL FUSION',d.content);d.fusionNote=d.text('Use the real recipe, partner and placement controls.\nDiscovery overrides are not applied.',10,0x999fbb,false,d.content);
 d.status=d.text('',11,0x9ad3de,false,d.panel);d.status.style.wordWrap=true;d.rules=new PIXI.Graphics();d.content.addChild(d.rules);
 d.close=()=>{d.open=false;d.pressed='';d.pending='';d.input?.blur();if(d.input)d.input.style.display='none';};
 d.ensureInput=()=>{
  if(d.input)return;const input=d.input=document.createElement('input');input.type='text';input.inputMode='numeric';input.autocomplete='off';input.maxLength=12;input.placeholder='250000';input.setAttribute('aria-label','Developer Gold amount');input.setAttribute('data-celestial-dev-input','');
  Object.assign(input.style,{position:'fixed',boxSizing:'border-box',margin:'0',padding:'5px 9px',border:'1px solid #71618f',borderRadius:'4px',background:'#11172d',color:'#e2e4f4',fontFamily:'Arial, sans-serif',outlineColor:'#9dccdb',zIndex:'2000',display:'none'});document.body.appendChild(input);
  for(const name of ['pointerdown','pointerup','mousedown','mouseup','touchstart','touchend','wheel'])input.addEventListener(name,e=>e.stopPropagation());
  d.keyGuard=e=>{if(document.activeElement!==input)return;e.stopImmediatePropagation();if(e.type==='keydown'&&e.key==='Enter'){e.preventDefault();d.addGold(input.value);}else if(e.type==='keydown'&&e.key==='Escape'){e.preventDefault();d.close();}};
  for(const name of ['keydown','keyup','keypress'])window.addEventListener(name,d.keyGuard,true);
 };
 d.toggle=()=>{if(!d.guard())return false;if(d.open)d.close();else{d.open=true;d.scroll=0;d.ensureInput();}scene.__audio?.play('UIClick');return true;};
 d.geometry=()=>{
  const W=game.getGameResolutionWidth(),H=game.getGameResolutionHeight(),canvas=game.getRenderer().getCanvas().getBoundingClientRect(),display=canvas.width/W;if(Number.isFinite(display)&&display>0&&canvas.width>=64&&canvas.height>=64&&!document.hidden)d.lastDisplay=display;
  const unit=Math.max(1,1/d.lastDisplay),area=scene.__towerShopUI?.gameArea,right=area?.right||W,audio=scene.__audio?.geometry().button||{x:8,y:16,w:32,h:32},size=36*unit;
  const button={x:Math.max(8*unit,Math.min(right-size-8*unit,audio.x+audio.w+8)),y:Math.max(8*unit,audio.y),w:size,h:size};
  const w=Math.min(config.PanelWidth*unit,right-16*unit),x=Math.max(8*unit,Math.min(right-w-8*unit,button.x)),y=button.y+size+8*unit,h=Math.max(120*unit,Math.min(config.PanelHeight*unit,H-y-8*unit));return{W,H,unit,display:d.lastDisplay,button,panel:{x,y,w,h},body:{x,y:y+48*unit,w,h:h-96*unit}};
 };
 d.contains=(r,x,y)=>!!r&&x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h;
 d.layout=()=>{
  const g=d.geometry(),{unit,button,panel:p}=g;d.g=g;layer.setCameraZoom(1);layer.setCameraX(g.W/2);layer.setCameraY(g.H/2);d.launcher.container.position.set(button.x,button.y);d.launcher.container.scale.set(unit);d.place(d.launcher,0,0,36,36);d.launcher.container.position.set(button.x,button.y);
  d.panel.position.set(p.x,p.y);d.panel.scale.set(unit);const w=p.w/unit,h=p.h/unit,bodyH=h-96;d.panel.visible=d.open;d.frame.clear().lineStyle(1,0x9a82b6,.9).beginFill(0x0e1329,.97).drawRoundedRect(0,0,w,h,8).endFill().lineStyle(1,0xb5a575,.35).moveTo(12,43).lineTo(w-12,43).moveTo(12,h-46).lineTo(w-12,h-46);d.title.position.set(14,10);d.subtitle.position.set(14,28);d.place(d.exit,w-38,8,28,28);
  d.body.position.set(0,48);d.mask.clear().beginFill(0xffffff).drawRect(0,48,w,bodyH).endFill();d.maxScroll=Math.max(0,520-bodyH);d.subtitle.text=d.maxScroll?'SESSION TESTING / SCROLL':'SESSION TESTING';d.scroll=Math.max(0,Math.min(d.maxScroll,d.scroll));d.content.position.set(0,-d.scroll);
  d.goldLabel.position.set(14,3);d.balance.position.set(14,21);d.balance.text=sv.get('Money').getAsNumber().toLocaleString('en-US')+' GOLD';const cell=(w-36)/2;
  d.presets.forEach((b,i)=>d.place(b,12+(i%2)*(cell+12),45+Math.floor(i/2)*38,cell,30));d.customLabel.position.set(14,127);d.inputRect={x:12,y:146,w:w-24,h:32};d.inputFrame.clear().lineStyle(1,0x60527e).beginFill(0x11172d).drawRoundedRect(12,146,w-24,32,4).endFill();d.place(d.add,12,186,cell,30);d.place(d.set,24+cell,186,cell,30);d.limit.text='MAX BALANCE '+Number(config.GoldLimit).toLocaleString('en-US');d.limit.position.set(14,224);
  d.towerLabel.position.set(14,260);d.towerName.position.set(14,278);const tower=d.selected(),v=tower?.getVariables(),id=tower?.getUniqueId()||0;if(id!==d.selectedId){d.selectedId=id;d.path=v?.get('Path2Level').getAsNumber()>=3?2:1;}d.towerName.text=tower?(scene.__starCannon?.isFusion(tower)?'Starburst / no upgrade paths':'Star Cannon / '+v.get('Path1Level').getAsNumber()+'-'+v.get('Path2Level').getAsNumber()):'No Tower Selected';d.paths.forEach((b,i)=>d.place(b,12+i*(cell+12),301,cell,28));d.place(d.max,12,337,w-24,34);d.costNote.position.set(14,380);d.costNote.style.wordWrap=true;d.costNote.style.wordWrapWidth=w-28;
  d.fusionLabel.position.set(14,421);d.place(d.fusion,12,442,w-24,32);d.fusionNote.position.set(14,483);d.fusionNote.style.wordWrap=true;d.fusionNote.style.wordWrapWidth=w-28;d.rules.clear().lineStyle(1,0x4d435e,.7).moveTo(12,247).lineTo(w-12,247).moveTo(12,408).lineTo(w-12,408);d.status.text=d.notice;d.status.style.fill=d.error?0xf3a1ae:0x9ad3de;d.status.style.wordWrapWidth=w-28;d.status.position.set(14,h-36);
  if(d.maxScroll>0){d.frame.lineStyle(2,0x544866).moveTo(w-5,50).lineTo(w-5,h-50);const len=Math.max(20,bodyH*bodyH/520),sy=48+d.scroll/d.maxScroll*(bodyH-len);d.frame.lineStyle(2,0x9d8fbb).moveTo(w-5,sy).lineTo(w-5,sy+len);}
  if(d.input){const r=d.inputRect,visible=d.open&&r.y-d.scroll>=0&&r.y+r.h-d.scroll<=bodyH&&root.visible&&!document.hidden;d.input.style.display=visible?'block':'none';if(!visible&&document.activeElement===d.input)d.input.blur();if(visible){const rect=game.getRenderer().getCanvas().getBoundingClientRect(),scale=d.g.display;Object.assign(d.input.style,{left:(rect.left+(p.x+r.x*unit)*scale)+'px',top:(rect.top+(p.y+(48+r.y-d.scroll)*unit)*scale)+'px',width:(r.w*unit*scale)+'px',height:(r.h*unit*scale)+'px',fontSize:(13*unit*scale)+'px'});}}
 };
 d.hit=()=>{
  const x=gdjs.evtTools.input.getCursorX(scene,'DeveloperUI',0),y=gdjs.evtTools.input.getCursorY(scene,'DeveloperUI',0),g=d.g;if(d.contains(g.button,x,y))return'toggle';if(!d.open||!d.contains(g.panel,x,y))return'';const px=(x-g.panel.x)/g.unit,py=(y-g.panel.y)/g.unit;if(d.contains(d.exit.r,px,py))return'close';
  if(d.contains(g.body,x,y)){for(const b of [...d.presets,d.add,d.set,...d.paths,d.max,d.fusion])if(d.contains(b.r,px,py-48+d.scroll))return b.id;}return'panel';
 };
 d.pre=()=>{
  if(d.disposed)return;sv.get('DevUIConsumesClick').setBoolean(false);sv.get('DevGoldInputFocused').setBoolean(false);root.visible=d.enabled()&&!d.obscured();const down=game.getInputManager().isMouseButtonPressed(0);d.pending='';
  if(!root.visible){d.close();d.down=down;d.captured=false;return;}d.layout();const hit=d.hit(),inside=hit!=='',focused=document.activeElement===d.input;
  if(d.open&&gdjs.evtTools.input.wasKeyJustPressed(scene,'Escape')){d.close();d.captured=true;}
  if(down&&!d.down){d.pressed=hit;d.captured=inside||focused;if(d.input&&hit!=='panel')d.input.blur();}
  if(!down&&d.down){if(d.pressed===hit&&hit)d.pending=hit;d.pressed='';}
  const consume=inside||d.captured||focused;sv.get('DevUIConsumesClick').setBoolean(consume);sv.get('DevGoldInputFocused').setBoolean(focused);
  if(consume){if(scene.__freePlacement)scene.__freePlacement.wasDown=down;sv.get('TowerPointerWasDown').setBoolean(down);}
  if(d.open&&d.contains(d.g.body,gdjs.evtTools.input.getCursorX(scene,'DeveloperUI',0),gdjs.evtTools.input.getCursorY(scene,'DeveloperUI',0))){const wheel=game.getInputManager().getMouseWheelDelta();if(wheel)d.scroll=Math.max(0,Math.min(d.maxScroll,d.scroll-Math.sign(wheel)*38));}
  if(!down)d.captured=false;d.down=down;d.hover=hit;
 };
 d.after=()=>{
  if(d.disposed)return;if(!d.enabled()||d.obscured()){d.close();root.visible=false;return;}root.visible=true;const action=d.pending;d.pending='';if(action==='toggle')d.toggle();else if(action==='close')d.close();else if(action.startsWith('gold'))d.addGold(action.slice(4));else if(action==='add')d.addGold(d.input?.value);else if(action==='set')d.setGold(d.input?.value);else if(action==='path1'||action==='path2')d.setPath(Number(action.at(-1)));else if(action==='max')d.maxSelected();else if(action==='fusion')d.startFusion();
  d.layout();for(const b of d.buttons)d.paint(b,d.hover===b.id,b.id==='path'+d.path);const tm=scene.getTimeManager(),dt=Math.min(.2,Math.max(0,tm.getElapsedTime()/Math.max(.001,tm.getTimeScale())/1000));d.noticeAge=Math.max(0,d.noticeAge-dt);if(d.noticeAge===0){d.notice='Session tools / normal prices apply';d.error=false;}
 };
 d.dispose=()=>{if(d.disposed)return;d.close();d.disposed=true;d.input?.remove();if(d.keyGuard)for(const name of ['keydown','keyup','keypress'])window.removeEventListener(name,d.keyGuard,true);d.body.mask=null;const texts=[];const visit=n=>{if(n instanceof PIXI.Text)texts.push(n);else for(const c of n.children||[])visit(c);};visit(root);for(const text of texts)text.destroy({texture:true,baseTexture:true});root.destroy({children:true,texture:false,baseTexture:false});};
 // Prepend input gating even when DEV is enabled after the audio owner exists.
 if(!gdjs.__developerCheatsCallbacks){gdjs.__developerCheatsCallbacks=true;gdjs.callbacksRuntimeScenePreEvents.unshift(s=>s.__devCheats?.pre());gdjs.callbacksRuntimeSceneUnloading.push(s=>s.__devCheats?.dispose());}
 d.pre();
}
