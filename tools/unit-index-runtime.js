// Galactic Archives is presentation-only. Combat and discovery owners stay authoritative.
const scene=runtimeScene,sv=scene.getVariables(),game=scene.getGame(),input=game.getInputManager();
const width=game.getGameResolutionWidth(),height=game.getGameResolutionHeight(),data=game.getSceneAndExtensionsData(scene.getName()).sceneData;
let index=scene.__unitIndex;
if(!index){
 index=scene.__unitIndex={objects:{},cards:[],monsterCards:[],category:'Towers',selected:{},scroll:0,collectionScroll:0,wasDown:false,pressed:'',dragging:null,disposed:false};
 index.ensure=(key,name,layer,z)=>{let o=index.objects[key];if(!o){o=scene.createObject(name);o.setLayer(layer);o.setZOrder(z);index.objects[key]=o;}return o;};
 index.graphics={};index.masks={};
 for(const name of ['IndexUI','IndexList','IndexDetail']){
  const parent=scene.getLayer(name).getRenderer().getRendererObject(),g=new PIXI.Graphics();g.zIndex=-10;g.interactive=false;parent.addChild(g);index.graphics[name]=g;
  if(name!=='IndexUI'){const mask=new PIXI.Graphics();mask.zIndex=-20;parent.addChild(mask);parent.mask=mask;index.masks[name]=mask;}
 }
 index.select=id=>{index.selected[index.category]=id;index.scroll=0;index.renderKey=null;};
 index.dispose=()=>{if(index.disposed)return;index.disposed=true;for(const name of ['IndexUI','IndexList','IndexDetail']){scene.getLayer(name).getRenderer().getRendererObject().mask=null;index.graphics[name].destroy();index.masks[name]?.destroy();}};
 if(!gdjs.__indexShowcaseCallbacks){gdjs.__indexShowcaseCallbacks=true;gdjs.callbacksRuntimeSceneUnloading.push(s=>s.__unitIndex?.dispose());}
}
for(const name of ['IndexUI','IndexList','IndexDetail']){const l=scene.getLayer(name);l.setCameraZoom(1);l.setCameraX(width/2);l.setCameraY(height/2);}
const wasOpen=sv.get('IndexOpen').getAsBoolean(),shop=scene.__towerShopUI;
if(shop?.indexRequested){sv.get('IndexOpen').setBoolean(true);shop.indexRequested=false;}
let open=sv.get('IndexOpen').getAsBoolean();sv.get('IndexBlocksInput').setBoolean(wasOpen||open);
const down=input.isMouseButtonPressed(0);
if(!open){for(const name of ['IndexUI','IndexList','IndexDetail'])scene.getLayer(name).show(false);index.wasDown=down;index.pressed='';index.dragging=null;index.renderKey=null;return;}
const archive=game.__fusionArchive,discovery=scene.__monsterDiscovery,portraits=sv.get('IndexPortraitCatalog').toJSObject(),star=sv.get('StarCannonConfig').toJSObject();
const archetypes=sv.get('EnemyTypes').toJSObject(),catalog=sv.get('TowerShopCatalog').toJSObject(),categories=['Towers','Monsters','Fusion'];
if(!categories.includes(index.category))index.category='Towers';
const entries=index.category==='Towers'?catalog.flatMap(item=>{
 const def=data.objects.find(o=>o.name===item.Type);if(!def)return[];const v=Object.fromEntries(def.variables.map(v=>[v.name,v.value])),isStar=item.Type==='StarCannonTower';
 return[{id:item.Type,type:item.Type,name:v.TowerName||item.Name,price:item.Cost,damage:isStar?star.BaseDamage:v.Damage,range:isStar?star.BaseRange:v.AttackRange,cooldown:isStar?star.BaseInterval:v.AttackInterval,projectileSpeed:isStar?star.ProjectileSpeed:v.ProjectileSpeed,locked:false}];
}):index.category==='Monsters'?discovery.ids.map(id=>({id,typeId:id,name:archetypes[id].Name||id,...archetypes[id],locked:!discovery.has(id),monster:true})):archive.catalog.map(def=>({id:def.Id,type:def.Id,name:def.Name,definition:def,fusion:true,locked:!archive.has(def.Id)}));
index.entries=entries;index.categories=categories;
const categoryChanged=index.lastCategory!==index.category;
if(categoryChanged){index.scroll=0;index.collectionScroll=0;index.lastCategory=index.category;}
if(!entries.some(e=>e.id===index.selected[index.category]))index.selected[index.category]=entries[0]?.id;
const selected=entries.find(e=>e.id===index.selected[index.category]),selectedIndex=entries.indexOf(selected);
const mobile=width<760,w=Math.min(1320,width-32),h=Math.min(900,height-32),x=(width-w)/2,y=(height-h)/2;
const body={x:x+18,y:y+126,w:w-36,h:h-164},cw=Math.min(280,Math.max(196,w*.225));
const collection=mobile?{x:body.x,y:body.y,w:body.w,h:92}:{x:body.x,y:body.y,w:cw,h:body.h};
const detail=mobile?{x:body.x,y:body.y+106,w:body.w,h:body.h-106}:{x:body.x+cw+16,y:body.y,w:body.w-cw-16,h:body.h};
index.geometry={x,y,w,h,content:detail,collection,detail,mobile};
index.tabRects=categories.map((name,i)=>({name,x:x+20+i*(mobile?(w-40)/3:154),y:y+74,w:mobile?(w-56)/3:142,h:34}));
index.closeRect={x:x+w-58,y:y+20,w:36,h:36};
const mx=gdjs.evtTools.input.getCursorX(scene,'IndexUI',0),my=gdjs.evtTools.input.getCursorY(scene,'IndexUI',0),inside=r=>!!r&&mx>=r.x&&mx<r.x+r.w&&my>=r.y&&my<r.y+r.h;
const stride=mobile?182:90,rowWidth=mobile?172:collection.w-14;
index.collectionMaxScroll=Math.max(0,entries.length*stride-(mobile?collection.w:collection.h));
if(categoryChanged&&selectedIndex>=0)index.collectionScroll=Math.max(0,Math.min(index.collectionMaxScroll,selectedIndex*stride+80-(mobile?collection.w:collection.h)));
const wheel=input.getMouseWheelDelta();if(inside(collection))index.collectionScroll-=Math.sign(wheel)*52;else if(inside(detail))index.scroll-=Math.sign(wheel)*60;
index.collectionScroll=Math.max(0,Math.min(index.collectionMaxScroll,index.collectionScroll));
const cardRects=()=>entries.map((e,i)=>({id:e.id,x:collection.x+(mobile?i*stride-index.collectionScroll:0),y:collection.y+(mobile?0:i*stride-index.collectionScroll),w:rowWidth,h:80}));
index.cardRects=cardRects();
const detailTrack={x:detail.x+detail.w-8,y:detail.y,w:8,h:detail.h},collectionTrack=mobile?null:{x:collection.x+collection.w-7,y:collection.y,w:7,h:collection.h};
const hover=index.tabRects.find(inside)?.name||(inside(index.closeRect)?'Close':inside(detailTrack)&&index.maxScroll>0?'DetailTrack':inside(collectionTrack)&&index.collectionMaxScroll>0?'CollectionTrack':inside(collection)?index.cardRects.find(inside)?.id:'')||'';
if(down&&!index.wasDown){index.pressed=hover;if(hover.endsWith('Track'))index.dragging={list:hover==='CollectionTrack',y:my,value:hover==='CollectionTrack'?index.collectionScroll:index.scroll};}
if(down&&index.dragging){const d=index.dragging,r=d.list?collection:detail,max=d.list?index.collectionMaxScroll:index.maxScroll,thumb=Math.max(24,r.h*r.h/(r.h+max)),value=d.value+(my-d.y)*max/Math.max(1,r.h-thumb);if(d.list)index.collectionScroll=value;else index.scroll=value;}
index.collectionScroll=Math.max(0,Math.min(index.collectionMaxScroll,index.collectionScroll));index.cardRects=cardRects();
if(!down&&index.wasDown&&index.pressed===hover){
 if(hover==='Close'){sv.get('IndexOpen').setBoolean(false);open=false;}
 else if(categories.includes(hover)&&index.category!==hover){index.category=hover;index.renderKey=null;index.wasDown=down;index.pressed='';return;}
 else if(entries.some(e=>e.id===hover)){index.select(hover);index.wasDown=down;index.pressed='';return;}
}
if(gdjs.evtTools.input.wasKeyJustPressed(scene,'Escape')){sv.get('IndexOpen').setBoolean(false);open=false;}
if(!down)index.dragging=null;
index.scroll=Math.max(0,Math.min(index.maxScroll||0,index.scroll));
const key=JSON.stringify([index.category,index.selected[index.category],index.scroll,index.collectionScroll,width,height,hover,open,discovery.revision,archive.revision]);
if(index.renderKey===key){index.wasDown=down;if(!down)index.pressed='';return;}index.renderKey=key;index.renderCount=(index.renderCount||0)+1;
Object.values(index.objects).forEach(o=>o.hide());index.cards=[];index.monsterCards=[];index.measuredTexts=[];index.artRects=[];
for(const g of Object.values(index.graphics))g.clear();
for(const [name,r]of [['IndexList',collection],['IndexDetail',detail]])index.masks[name].clear().beginFill(0xffffff).drawRect(r.x,r.y,r.w,r.h).endFill();
const C={border:0x494169,gold:0xc5ab72,white:'242;236;255',muted:'172;166;197'};
const box=(layer,r,fill,border=C.border,radius=10,alpha=1)=>index.graphics[layer].lineStyle(1,border,.8).beginFill(fill,alpha).drawRoundedRect(r.x,r.y,r.w,r.h,radius).endFill();
const line=(layer,a,b,c,d,color=C.border)=>index.graphics[layer].lineStyle(1,color,.6).moveTo(a,b).lineTo(c,d);
const text=(key,value,px,py,ww,size=13,color=C.white,bold=false,layer='IndexUI')=>{
 const o=index.ensure(key,'IndexText',layer,3);o.setString(String(value));o.setCharacterSize(size);o.setBold(bold);o.setColor(color);o.setWrapping(true);o.setWrappingWidth(Math.max(20,ww));o.setPosition(px,py);o.hide(false);index.measuredTexts.push({key,object:o,x:px,y:py,w:ww});return o;
};
const label=(key,value,px,py,ww,layer='IndexDetail',color='192;173;123')=>text(key,value,px,py,ww,10,color,true,layer);
const g=index.graphics.IndexUI;g.beginFill(0x050610,.88).drawRect(0,0,width,height).endFill();box('IndexUI',{x,y,w,h},0x101024,0x797098,15,.99);
line('IndexUI',x+18,y+62,x+w-18,y+62,0x5c4a75);
for(const [sx,sy]of [[x+18,y+18],[x+w-18,y+18],[x+18,y+h-18],[x+w-18,y+h-18]])g.beginFill(C.gold,.9).drawPolygon([sx,sy-3,sx+3,sy,sx,sy+3,sx-3,sy]).endFill();
text('title','GALACTIC ARCHIVES',x+32,y+18,w-112,mobile?20:25,C.white,true);
label('archiveMark','CELESTIAL VOID  /  FIELD ENCYCLOPEDIA',x+34,y+47,w-130,'IndexUI','150;165;192');
box('IndexUI',index.closeRect,hover==='Close'?0x443458:0x211c36);text('buttonTextClose','X',index.closeRect.x+12,index.closeRect.y+9,20,15,C.white,true);
for(const r of index.tabRects){const active=r.name===index.category;box('IndexUI',r,active?0x302446:0x17142b,active?C.gold:C.border,7);text('tabText'+r.name,r.name.toUpperCase(),r.x+15,r.y+10,r.w-20,11,active?'234;216;170':C.muted,true);}
const found=entries.filter(e=>!e.locked).length;
const compact=w<1000;
text('subtitle',(index.category==='Towers'?'TOWER COLLECTION':index.category==='Monsters'?'MONSTER DISCOVERY':'FUSION ARCHIVE')+'  /  '+found+' / '+entries.length+' DISCOVERED',mobile?x+20:compact?x+w-338:x+w-350,compact?y+h-25:y+86,mobile?w-40:320,10,C.muted);
box('IndexUI',{x:collection.x-3,y:collection.y-3,w:collection.w+6,h:collection.h+6},0x121027,0x393152,10);
box('IndexUI',{x:detail.x-3,y:detail.y-3,w:detail.w+6,h:detail.h+6},0x14122b,0x54435f,10);
if(!mobile)text('footer',compact?'SCROLL EACH PANEL / ESC TO CLOSE':'SELECT AN ENTRY   /   SCROLL EACH PANEL   /   ESC TO CLOSE',x+32,y+h-25,compact?w-392:w-52,10,'139;137;167');
const fit=(o,b,r)=>{o.setScale(1);const scale=Math.min(r.w/b[2],r.h/b[3]);o.setScale(scale);o.setPosition(r.x+r.w/2-(b[0]+b[2]/2)*scale,r.y+r.h/2-(b[1]+b[3]/2)*scale);index.artRects.push({id:o.__archiveId,object:o,x:o.getX()+b[0]*scale,y:o.getY()+b[1]*scale,w:b[2]*scale,h:b[3]*scale,frame:r});};
const portrait=(key,e,r,layer)=>{
 if(e.monster){const o=index.ensure(key,'IndexMonsterImage',layer,2);o.__archivePortraitOwned=true;o.setAnimationName(e.Animation);o.setColor(e.locked?'0;0;0':'255;255;255');o.setOpacity(0);o.__discoveryLocked=e.locked;o.__discoveryPortrait={id:e.id,x:r.x+r.w/2,y:r.y+r.h/2,w:r.w,h:r.h};o.setWidth(r.w);o.setHeight(r.h);o.setPosition(r.x,r.y);o.hide(false);index.monsterCards.push({sprite:o});return o;}
 const meta=portraits[e.id],animation=meta&&data.objects.find(o=>o.name==='IndexShowcase').animations.find(a=>a.name===meta.Animation);
 if(!animation){label(key+'Pending','PORTRAIT PENDING',r.x+8,r.y+r.h/2-5,r.w-16,layer,'139;133;162');return null;}
 const o=index.ensure(key,'IndexShowcase',layer,2);o.setAnimationName(meta.Animation);o.setColor(e.locked?'0;0;0':'255;255;255');o.setOpacity(255);o.__archiveId=e.id;o.__fusionLocked=e.locked;o.hide(false);fit(o,meta.VisualBounds,r);return o;
};
for(const [i,e]of entries.entries()){
 const r=index.cardRects[i],active=e.id===index.selected[index.category];box('IndexList',r,active?0x302442:0x1a172f,active?C.gold:hover===e.id?0x8c79ba:0x403755,8);
 if(active)index.graphics.IndexList.beginFill(C.gold,.9).drawRoundedRect(r.x+1,r.y+14,3,r.h-28,2).endFill();
 const sprite=portrait('collection'+index.category+i,e,{x:r.x+9,y:r.y+10,w:56,h:60},'IndexList');
 const name=text('collectionName'+i,e.locked?'???':e.name,r.x+74,r.y+14,r.w-82,13,C.white,true,'IndexList');
 const status=text('collectionStatus'+i,e.locked?'UNDISCOVERED':e.monster||e.fusion?'DISCOVERED':'TOWER / AVAILABLE',r.x+74,r.y+48,r.w-82,9,e.locked?'154;139;175':'168;198;218',false,'IndexList');
 index.cards.push({name,status,sprite,locked:e.locked,id:e.id});
}
const scrollBar=(layer,r,max,value,horizontal=false)=>{if(max<=0)return;const g=index.graphics[layer],len=horizontal?r.w:r.h,thumb=Math.max(24,len*len/(len+max)),pos=value/max*(len-thumb);g.beginFill(0x3b3454).drawRoundedRect(r.x,r.y,r.w,r.h,3).endFill();g.beginFill(0x9b89ba).drawRoundedRect(r.x+(horizontal?pos:0),r.y+(horizontal?0:pos),horizontal?thumb:r.w,horizontal?r.h:thumb,3).endFill();};
scrollBar('IndexUI',mobile?{x:collection.x,y:collection.y+86,w:collection.w,h:4}:collectionTrack,index.collectionMaxScroll,index.collectionScroll,mobile);
if(selected){
 const e=selected,locked=e.locked,dx=detail.x+18,dw=detail.w-48,top=detail.y+16-index.scroll,stack=dw<480,artW=stack?Math.min(280,dw):Math.min(350,dw*.43),artH=Math.min(330,Math.max(128,detail.h-48)),artFrame={x:stack?dx+(dw-artW)/2:dx,y:top,w:artW,h:artH};
 box('IndexDetail',artFrame,0x111429,e.fusion?C.gold:0x344360,12);
 const ag=index.graphics.IndexDetail,cx=artFrame.x+artW/2,cy=top+artH*.57;
 ag.lineStyle(1,e.fusion?0x8d734b:0x48617e,.35).drawEllipse(cx,cy,artW*.43,artH*.27).drawEllipse(cx,cy,artW*.34,artH*.21);
 for(let k=0;k<5;k++)ag.beginFill(0x92a4cc,.4).drawCircle(artFrame.x+14+(k*37)%(artW-28),top+18+(k*53)%(artH-36),1).endFill();
 const art=portrait('detail'+index.category,e,{x:artFrame.x+16,y:artFrame.y+16,w:artW-32,h:artH-32},'IndexDetail');
 const tx=stack?dx:dx+artW+22,tw=stack?dw:dw-artW-22,ty=stack?top+artH+20:top+4;
 label('detailType',locked?'UNIDENTIFIED ARCHIVE':e.fusion?e.definition.Kind.toUpperCase()+' FUSION':e.monster?(e.Classification||'COMMON')+' ENEMY':'CELESTIAL ARTILLERY',tx,ty,tw);
 const title=text('detailName',locked?'???':e.name,tx,ty+20,tw,tw<250?24:30,C.white,true,'IndexDetail');
 let yy=ty+20+title.getHeight()+10;
 const desc=locked?(e.fusion?'CRYPTIC HINT\n'+e.definition.Hint:'An unknown presence moves through the Void. Encounter this enemy to reveal its archive.'):(e.fusion?e.definition.Description:e.monster?(e.Role||(e.id==='Basic'?'A wandering cosmic entity.':'Fast Void creature.')):'A single stellar cannon, forged in ivory and gold. Shape its energy through two upgrade paths.');
 const description=text('detailDescription',desc,tx,yy,tw,13,C.muted,false,'IndexDetail');yy+=description.getHeight()+18;
 const config=e.fusion?(data.variables.some(v=>v.name===e.definition.StatsConfig)?sv.get(e.definition.StatsConfig).toJSObject():e.definition.Stats||{}):null;
 const stats=locked?[]:e.monster?[['HP',e.HP],['ARMOR',e.Armor],['SPEED',e.Speed+' px/s'],['REWARD',e.Reward+' Gold']]:[['DAMAGE',e.fusion?config.Damage:e.damage],['INTERVAL',Number(e.fusion?config.AttackInterval:e.cooldown).toFixed(2)+' s'],['RANGE',(e.fusion?config.AttackRange:e.range)+' px'],[e.fusion?'RATE':'COST',e.fusion?(1/config.AttackInterval).toFixed(2)+' /s':e.price+' Gold']];
 index.statValues=stats;const statsTop=yy,cellW=(tw-10)/2;
 for(const [i,[name,value]]of stats.entries()){
  const sx=tx+i%2*(cellW+10),sy=statsTop+Math.floor(i/2)*64;box('IndexDetail',{x:sx,y:sy,w:cellW,h:54},0x201d38,0x393551,6);
  const icon=index.graphics.IndexDetail,ix=sx+14,iy=sy+13;icon.lineStyle(1,0xa4bedb,.85);
  if(name==='INTERVAL'||name==='RATE')icon.drawCircle(ix,iy,4).moveTo(ix,iy-3).lineTo(ix,iy).lineTo(ix+3,iy+1);
  else if(name==='RANGE')icon.drawCircle(ix,iy,4).moveTo(ix-6,iy).lineTo(ix+6,iy).moveTo(ix,iy-6).lineTo(ix,iy+6);
  else if(name==='HP')icon.moveTo(ix-4,iy).lineTo(ix+4,iy).moveTo(ix,iy-4).lineTo(ix,iy+4);
  else if(name==='ARMOR')icon.drawPolygon([ix-4,iy-4,ix+4,iy-4,ix+3,iy+2,ix,iy+5,ix-3,iy+2,ix-4,iy-4]);
  else icon.drawPolygon([ix,iy-5,ix+4,iy,ix,iy+5,ix-4,iy,ix,iy-5]);
  label('statLabel'+i,name,sx+26,sy+8,cellW-36,'IndexDetail','151;164;192');text('statValue'+i,value,sx+10,sy+24,cellW-20,18,C.white,true,'IndexDetail');
 }
 yy+=stats.length?128:0;
 if(!locked&&!e.monster){const property=e.fusion?(Number.isFinite(config.SplashRadius)&&Number.isFinite(config.SplashRatio)?'SPLASH  /  '+config.SplashRadius+' px  /  '+Math.round(config.SplashRatio*100)+'% damage':''):(Number.isFinite(e.projectileSpeed)?'PROJECTILE SPEED  /  '+e.projectileSpeed+' px/s':'');if(property){const properties=text('detailProperties',property,tx,yy,tw,11,'151;170;198',false,'IndexDetail');yy+=properties.getHeight()+14;}}
 if(locked){label('detailLock','UNDISCOVERED  /  DETAILS LOCKED',tx,yy,tw,'IndexDetail','163;144;188');yy+=32;}
 let sectionY=Math.max(top+artH+24,yy+8);
 const section=(key,title)=>{line('IndexDetail',dx,sectionY,dx+dw,sectionY,0x655470);label(key,title,dx,sectionY+14,dw);sectionY+=40;};
 const paragraph=(key,value)=>{const t=text(key,value,dx,sectionY,dw,13,C.muted,false,'IndexDetail');sectionY+=t.getHeight()+18;return t;};
 index.detail={id:e.id,entry:e,locked,sprite:art,name:title,description,statValues:stats};
 if(e.type==='StarCannonTower'){
  section('upgradesTitle','UPGRADE PATHS');const cols=dw>=580?2:1,colW=cols===2?(dw-16)/2:dw,starts=[];
  for(const [p,path]of star.Paths.entries()){
   const px=dx+(p%cols)*(colW+16);let py=cols===2?sectionY:sectionY+(p?starts[0]:0);const start=py;
   box('IndexDetail',{x:px,y:py,w:colW,h:50},p?0x20203c:0x292038,p?0x586e94:0x8a7052,7);label('pathNumber'+p,'PATH '+(p+1),px+12,py+8,colW-24,'IndexDetail',p?'158;204;229':'225;193;130');text('starPath'+p,path.Name,px+12,py+23,colW-24,12,C.white,true,'IndexDetail');py+=64;
   for(const [n,u]of path.Upgrades.entries()){
    const icon=index.ensure('starUpgrade'+p+n,'StarUpgradeIcon','IndexDetail',2);icon.setAnimationName(u.Icon);icon.setWidth(38);icon.setHeight(38);icon.setPosition(px+8,py+8);icon.hide(false);
    const name=text('upgradeName'+p+n,'0'+(n+1)+'  '+u.Name,px+56,py+8,colW-68,13,C.white,true,'IndexDetail');
    const desc=text('upgradeDesc'+p+n,u.Description,px+56,py+name.getHeight()+14,colW-68,12,C.muted,false,'IndexDetail');
    const rh=Math.max(92,name.getHeight()+desc.getHeight()+48);box('IndexDetail',{x:px,y:py,w:colW,h:rh-8},0x19162e,0x302b45,6);label('upgradeCost'+p+n,u.Cost+' GOLD',px+56,py+rh-30,colW-68,'IndexDetail','195;175;129');py+=rh;
   }
   starts[p]=py-start+18;
  }
  sectionY+=cols===2?Math.max(...starts):starts.reduce((a,b)=>a+b,0);paragraph('starRule','Level 3 specializes one path. The other path can reach level 2. Maximum level '+star.MaxLevel+'.');
 }else if(e.monster&&!locked){
  section('abilityHeading','ENEMY PROFILE');paragraph('monsterProfile',!e.SpecialAbility||e.SpecialAbility==='None'?'No special ability.':'SPECIAL ABILITY  /  '+e.SpecialAbility);
  if(e.id==='VoidGolem'){const skill=sv.get('VoidGolemConfig').toJSObject().Skill;paragraph('golemSkill','Stops to cast '+skill.Name+'. Grants +'+skill.ArmorBonus+' armor within '+skill.Radius+' px for '+skill.Duration+' s. Cooldown: '+skill.Cooldown+' s.');}
  paragraph('monsterFirstWave','FIRST APPEARANCE  /  WAVE '+e.MinimumWave+'+');
 }else if(e.fusion){
  section('recipeHeading',locked?'SEALED COMBINATION':'FUSION COMBINATION');const recipe=v=>v.Recipe.map(p=>p.Label||p.Type+' '+p.Path1+'-'+p.Path2).join(' + '),known=e.definition.Variants.filter(v=>archive.hasVariant(e.id,v.Id));
  paragraph('fusionRecipe'+selectedIndex,locked?'Combination locked':e.definition.AdaptiveVariants?'Each adaptive variant is discovered separately.':known.map(recipe).join('\n')||'Combination not yet recorded');
  if(e.definition.AdaptiveVariants){const progress=archive.progress(e.id);section('fusionProgress'+selectedIndex,'ADAPTIVE VARIANTS  /  '+progress.found+' / '+progress.total);e.definition.Variants.forEach((v,n)=>paragraph('fusionVariant'+n+selectedIndex,archive.hasVariant(e.id,v.Id)?v.Name+'\n'+recipe(v):'???  /  UNDISCOVERED'));}
  else if(!locked)paragraph('fusionIdentity','PURE EVOLUTION  /  One canonical recipe. Source order does not change the result.');
 }
 index.detailHeight=sectionY+index.scroll-detail.y;index.maxScroll=Math.max(0,index.detailHeight-detail.h+12);scrollBar('IndexUI',detailTrack,index.maxScroll,index.scroll);
}else{text('emptyArchive','No entries available.',detail.x+20,detail.y+30,detail.w-40,16,C.muted);index.maxScroll=0;}
for(const name of ['IndexUI','IndexList','IndexDetail'])scene.getLayer(name).show(open);
index.wasDown=down;if(!down)index.pressed='';
