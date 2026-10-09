// Display-only objects: none belongs to Enemy or PlaceableTile.
const sv = runtimeScene.getVariables();
const game = runtimeScene.getGame();
const width = game.getGameResolutionWidth(), height = game.getGameResolutionHeight();
const input = game.getInputManager();
let index = runtimeScene.__unitIndex;
if (!index) {
  index = runtimeScene.__unitIndex = { objects: {}, cards: [], category: "Towers", scroll: 0, wasDown: false, pressed: "", dragging: false };
  index.ensure = (key, name, layer, z) => {
    if (!index.objects[key]) {
      const object = runtimeScene.createObject(name); object.setLayer(layer); object.setZOrder(z);
      index.objects[key] = object;
    }
    return index.objects[key];
  };
  const container = runtimeScene.getLayer("IndexList").getRenderer().getRendererObject();
  index.mask = new PIXI.Graphics(); container.addChild(index.mask); container.mask = index.mask;
}
for (const name of ["IndexUI", "IndexList"]) {
  const layer = runtimeScene.getLayer(name);
  layer.setCameraZoom(1); layer.setCameraX(width/2); layer.setCameraY(height/2);
}
const wasOpen = sv.get("IndexOpen").getAsBoolean();
const shop = runtimeScene.__towerShopUI;
if (shop && shop.indexRequested) { sv.get("IndexOpen").setBoolean(true); shop.indexRequested = false; }
let open = sv.get("IndexOpen").getAsBoolean();
// Block the entire closing frame too, so CLOSE/Escape cannot activate controls beneath.
sv.get("IndexBlocksInput").setBoolean(wasOpen || open);
const down = input.isMouseButtonPressed(0);
if (!open) {
  runtimeScene.getLayer("IndexUI").show(false); runtimeScene.getLayer("IndexList").show(false);
  index.wasDown = down; index.pressed = ""; index.dragging = false;
  return;
}
const mx = gdjs.evtTools.input.getCursorX(runtimeScene,"IndexUI",0), my = gdjs.evtTools.input.getCursorY(runtimeScene,"IndexUI",0);
const w = Math.min(700,width-32), h = Math.min(600,height-32), x = (width-w)/2, y = (height-h)/2;
const content = { x:x+20,y:y+108,w:w-52,h:h-180 };
index.geometry = {x,y,w,h,content};
const inside = (a,b,c,d) => mx>=a && mx<a+c && my>=b && my<b+d;
const closeY=y+h-54, tabWidth=(w-48)/2;
const hover = inside(x+20,y+62,tabWidth,32)?"Towers":inside(x+28+tabWidth,y+62,tabWidth,32)?"Monsters":inside(x+w-140,closeY,120,34)?"Close":inside(x+20,closeY,38,34)?"Up":inside(x+64,closeY,38,34)?"Down":"";
if (down && !index.wasDown) index.pressed=hover;
if ((!down && index.wasDown && index.pressed==="Close" && hover==="Close") || gdjs.evtTools.input.wasKeyJustPressed(runtimeScene,"Escape")) {
  sv.get("IndexOpen").setBoolean(false);open=false;
}
if (!down && index.wasDown && index.pressed===hover && ["Towers","Monsters"].includes(hover) && index.category!==hover) { index.category=hover;index.scroll=0; }
// Read the same object variables/catalog/archetypes that the game uses. No copied balance table.
const data=game.getSceneAndExtensionsData(runtimeScene.getName()).sceneData;
const catalog=sv.get("TowerShopCatalog").toJSObject();
const archetypes=sv.get("EnemyTypes").toJSObject();
const roles={Basic:"Basic cosmic enemy / No special ability",VoidHound:"Fast Enemy / Armor 0 / No special ability / Wave 4+",VoidGolem:"Elite / Armor25 / Void Fortification +10 armor / Wave12+"};
const entries=index.category==="Towers" ? catalog.map(item=>{
  const definition=data.objects.find(o=>o.name===item.Type); if(!definition)return null;
  const values=Object.fromEntries(definition.variables.map(v=>[v.name,v.value]));
  return {name:values.TowerName||item.Name,animation:item.IconAnimation||item.Type,damage:values.Damage,range:values.AttackRange,cooldown:values.AttackInterval,price:item.Cost,
    projectileSpeed:values.ProjectileSpeed, special:"Cosmic cannon / 2 UPGRADE PATHS.",type:item.Type};
}).filter(Boolean) : ["Basic","VoidHound","VoidGuard","VoidSentinel","VoidBrute","VoidGolem"].filter(name=>archetypes[name]).map(name=>({name:archetypes[name].Name||name,...archetypes[name],role:roles[name]||(archetypes[name].Role+" / Armor "+archetypes[name].Armor+" / No special ability / Wave "+archetypes[name].MinimumWave+"+")}));
index.entries=entries;
const heights=entries.map(e=>e.type==="StarCannonTower"?470:148), offsets=[];let total=0;heights.forEach(h=>{offsets.push(total);total+=h+12;});
const stride=160, maxScroll=Math.max(0,total-12-content.h);
if(inside(content.x,content.y,content.w+16,content.h))index.scroll-=Math.sign(input.getMouseWheelDelta())*52;
if(!down && index.wasDown && index.pressed===hover){if(hover==="Up")index.scroll-=stride;if(hover==="Down")index.scroll+=stride;}
const trackX=x+w-24,thumbHeight=maxScroll>0?Math.max(28,content.h*content.h/(total-12)):content.h;
if(down&&!index.wasDown&&inside(trackX-3,content.y,14,content.h)){index.dragging=true;index.dragY=my;index.dragScroll=index.scroll;}
if(down&&index.dragging)index.scroll=index.dragScroll+(my-index.dragY)*maxScroll/Math.max(1,content.h-thumbHeight);
if(!down)index.dragging=false;
index.scroll=Math.max(0,Math.min(maxScroll,index.scroll));index.maxScroll=maxScroll;
const panel=(key,a,b,c,d,color,opacity=255,layer="IndexUI",z=1)=>{
  const o=index.ensure(key,"IndexPanel",layer,z);o.setPosition(a,b);o.setWidth(c);o.setHeight(d);o.setColor(color);o.setOpacity(opacity);o.hide(false);return o;
};
const text=(key,value,a,b,c,size,color="231;225;253",bold=false,layer="IndexUI",z=2)=>{
  const o=index.ensure(key,"IndexText",layer,z);o.setPosition(a,b);o.setWidth(c);o.setString(String(value));o.setCharacterSize(size);o.setColor(color);o.setBold(bold);o.hide(false);return o;
};
Object.values(index.objects).forEach(o=>o.hide());
panel("shade",0,0,width,height,"20;29;23",190,"IndexUI",0);
panel("frame",x,y,w,h,"255;255;255");
text("title","UNIT INDEX",x+22,y+16,w-44,24,"239;232;255",true);
text("subtitle","Field guide  /  Live gameplay stats",x+22,y+44,w-44,12,"170;159;196");
for(const [i,category] of ["Towers","Monsters"].entries()){
  const tx=x+20+i*(tabWidth+8),active=index.category===category;
  panel("tab"+i,tx,y+62,tabWidth,32,active?"163;138;206":"87;67;120");
  text("tabText"+i,category.toUpperCase(),tx+14,y+69,tabWidth-28,14,"234;228;251",true);
}
index.mask.clear().beginFill(0xffffff).drawRect(content.x,content.y,content.w,content.h).endFill();
index.cards=[];
entries.forEach((entry,i)=>{
  const cardHeight=heights[i],cy=content.y+offsets[i]-index.scroll,cx=content.x,cw=content.w;
  panel("card"+i,cx,cy,cw,cardHeight,"87;66;115",255,"IndexList",0);
  panel("portrait"+i,cx+12,cy+12,80,124,"115;86;145",255,"IndexList",1);
  const monster=index.category==="Monsters", sprite=index.ensure((monster?"monster":"tower")+i,monster?"IndexMonsterImage":"IndexTowerImage","IndexList",2);
  sprite.setAnimationName(monster?(entry.Animation||"NovaIdle_Down"):entry.animation);
  sprite.setColor(monster?entry.Tint:"255;255;255");
  // Fit each existing image to the portrait; no real gameplay unit is created.
  if(monster&&entry.Animation?.startsWith('VoidGolem')){
    sprite.setWidth(64);sprite.setHeight(64);sprite.setPosition(cx+20,cy+42);runtimeScene.__voidGolem?.portrait(sprite,cx+52,cy+74,100);
  }else{
    sprite.setOpacity(255);sprite.setScale(1);const ratio=sprite.getWidth()/Math.max(1,sprite.getHeight());
    const size=monster?Math.min(66,46*(entry.Scale||1)):58;
    sprite.setWidth(ratio>=1?size:size*ratio);sprite.setHeight(ratio>=1?size/ratio:size);
    sprite.setPosition(cx+52-sprite.getWidth()/2,cy+74-sprite.getHeight()/2);
  }
  sprite.hide(false);
  const name=text("name"+i,entry.name,cx+108,cy+12,cw-124,20,"237;228;255",true,"IndexList");
  const stats=monster?"HP: "+entry.HP+"     Speed: "+entry.Speed+"\nGold Reward: "+entry.Reward+" Gold":"Damage: "+entry.damage+"     Range: "+entry.range+"\nCooldown: "+Number(entry.cooldown).toFixed(2)+" s     Price: "+entry.price+" Gold";
  const statText=text("stats"+i,stats,cx+108,cy+44,cw-124,15,"218;206;241",false,"IndexList");
  const special=text("special"+i,(monster?"ROLE\n":"SPECIAL\n")+(monster?entry.role:entry.special),cx+108,cy+92,cw-124,13,"181;168;214",false,"IndexList");
  if(entry.type==="StarCannonTower") {
    const isStar=entry.type==="StarCannonTower",prefix="star";
    text(prefix+"Speed", "Star speed: "+entry.projectileSpeed+" px/s",cx+108,cy+130,cw-124,12,"181;168;214",false,"IndexList");
    const cfg=sv.get("StarCannonConfig").toJSObject(), column=(cw-32)/2;
    cfg.Paths.forEach((path,p)=>{
      const px=cx+16+p*column;
      text(prefix+"Path"+p,path.Name,px,cy+164,column-12,13,"200;187;231",true,"IndexList");
      path.Upgrades.forEach((upgrade,n)=>{
        const yy=cy+192+n*58,icon=index.ensure(prefix+"Upgrade"+p+n,"StarUpgradeIcon","IndexList",3);
        icon.setAnimationName(upgrade.Icon);icon.setPosition(px,yy);icon.setWidth(40);icon.setHeight(40);icon.hide(false);
        text(prefix+"UpgradeName"+p+n,"Lv"+(n+1)+" "+upgrade.Name,px+46,yy,column-56,11,"237;228;255",true,"IndexList");
        text(prefix+"UpgradeDesc"+p+n,upgrade.Description+"\n"+upgrade.Cost+" Gold",px+46,yy+16,column-56,11,"181;168;214",false,"IndexList");
      });
    });
    text(prefix+"Rule","Level 3 specializes one path. The other can reach Lv2.",cx+16,cy+436,cw-32,12,"194;179;224",true,"IndexList");
  }
  index.cards.push({name,stats:statText,special,sprite});
});
panel("track",trackX,content.y,8,content.h,"72;54;101");
panel("thumb",trackX,content.y+(maxScroll?index.scroll/maxScroll*(content.h-thumbHeight):0),8,thumbHeight,"167;136;214");
for(const [key,label,bx,bw] of [["Up","UP",x+20,38],["Down","DN",x+64,38],["Close","CLOSE",x+w-140,120]]){
  panel("button"+key,bx,closeY,bw,34,hover===key?"161;136;209":"102;78;138");
  text("buttonText"+key,label,bx+8,closeY+9,bw-16,13,"234;226;255",true);
}
text("count",entries.length+" "+index.category.toUpperCase()+"  /  SCROLL",x+118,closeY+10,Math.max(80,w-280),12,"177;161;205");
runtimeScene.getLayer("IndexUI").show(open);runtimeScene.getLayer("IndexList").show(open);
index.wasDown=down;if(!down)index.pressed="";
