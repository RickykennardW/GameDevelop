// A separate UI overlay. Shop and map geometry stay independent of selection.
const scene=runtimeScene,sv=scene.getVariables(),game=scene.getGame();
let ui=scene.__selectedPanel;
if(!ui) {
  ui=scene.__selectedPanel={objects:{},wasDown:false,pressed:"",pressedTower:0,cards:[]};
  ui.ensure=(key,name,z=1)=>{
    if(!ui.objects[key]){const o=scene.createObject(name);o.setLayer("SelectedTowerUI");o.setZOrder(z);ui.objects[key]=o;}
    return ui.objects[key];
  };
}
const towers=scene.getObjects("StarCannonTower");
let selected=towers.find(t=>t.getVariables().get("TowerId").getAsNumber()===sv.get("SelectedTower").getAsNumber());
if(!selected&&sv.get("SelectedTower").getAsNumber()>0)sv.get("SelectedTower").setNumber(0);
const input=game.getInputManager(),down=input.isMouseButtonPressed(0),modal=sv.get("IndexBlocksInput").getAsBoolean()||sv.get("AudioUIConsumesClick").getAsBoolean()||sv.get('FusionActive').getAsBoolean()||sv.get('CampaignModal').getAsBoolean()||sv.get('CampaignUIConsumesClick').getAsBoolean();
const h=680,w=320,layer=scene.getLayer("SelectedTowerUI");
let scale=1,sx=8,sy=8;
const positionPanel=tower=>{
 const area=scene.__towerShopUI.gameArea,margin=8,map=scene.getLayer("");
 const center=tower?(scene.__freePlacement?scene.__freePlacement.center(tower):[tower.getCenterXInScene(),tower.getCenterYInScene()]):[(area.left+area.right)/2,0];
 const screen=tower?map.convertInverseCoords(center[0],center[1],0,[0,0]):center;
 const right=tower&&screen[0]<(area.left+area.right)/2;
 const hud=scene.getObjects("HUDPanel")[0],hudLayer=scene.getLayer("UI");
 const hudBottom=hudLayer.convertInverseCoords(hud.getX(),hud.getY()+hud.getHeight(),0,[0,0])[1];
 sy=Math.max(margin,hudBottom+margin);
 const footprint=tower&&scene.__freePlacement?scene.__freePlacement.radius(tower)*map.getCameraZoom():0;
 const sideRoom=tower?(right?area.right-margin-screen[0]-footprint-margin:screen[0]-footprint-margin-area.left-margin):area.right-area.left-2*margin;
 scale=Math.max(.01,Math.min(1,(game.getGameResolutionHeight()-sy-margin)/h,((area.right-area.left)/2-2*margin)/w,sideRoom/w));
 sx=right?area.right-margin-w*scale:area.left+margin;
 sx=Math.max(area.left+margin,Math.min(area.right-margin-w*scale,sx));
 layer.setCameraZoom(scale);layer.setCameraX(game.getGameResolutionWidth()/2/scale-sx/scale);layer.setCameraY(game.getGameResolutionHeight()/2/scale-sy/scale);
 ui.panelSide=right?"RIGHT":"LEFT";ui.screenRect=tower?{x:sx,y:sy,w:w*scale,h:h*scale}:null;
};
positionPanel(selected);
const mx=gdjs.evtTools.input.getCursorX(scene,"SelectedTowerUI",0),my=gdjs.evtTools.input.getCursorY(scene,"SelectedTowerUI",0);
const inside=(x,y,width,height)=>mx>=x&&mx<x+width&&my>=y&&my<y+height;
const pointer=!!selected&&!modal&&inside(0,0,w,h);
sv.get("SelectedPanelPointerInside").setBoolean(pointer);
sv.get("TowerUIConsumesClick").setBoolean(pointer);
ui.screenRect=selected?{x:sx,y:sy,w:w*scale,h:h*scale}:null;
const canFuse=scene.__fusion?.eligible(selected)||false;
const hover=!selected||modal?"":canFuse&&inside(16,584,288,26)?'Fusion':inside(16,h-66,w-32,48)?"Sell":inside(278,12,26,26)?"Close":inside(16,314,140,270)?"Path1":inside(164,314,140,270)?"Path2":pointer?"Panel":"";
if(down&&!ui.wasDown){ui.pressed=hover;ui.pressedTower=selected?selected.getVariables().get("TowerId").getAsNumber():0;}
if(!down&&ui.wasDown&&selected&&!modal&&ui.pressed===hover&&ui.pressedTower===selected.getVariables().get("TowerId").getAsNumber()) {
  if(hover==="Sell") {
    const v=selected.getVariables(),investment=v.get("TotalInvestment").getAsNumber();
    sv.get("Money").setNumber(sv.get("Money").getAsNumber()+Math.floor(investment*sv.get("SellRefundRate").getAsNumber()+1e-8));
    selected.deleteFromScene();sv.get("SelectedTower").setNumber(0);selected=null;
  } else if(hover==='Fusion'){scene.__fusion?.begin(selected);selected=null;}
  else if(hover==="Close") {sv.get("SelectedTower").setNumber(0);selected=null;}
  else if((hover==="Path1"||hover==="Path2"))scene.__starCannon?.upgrade(selected,hover==="Path1"?1:2);
}
if(!down)ui.pressed="";ui.wasDown=down;
ui.render=()=>{
  Object.values(ui.objects).forEach(o=>o.hide());
  const tower=towers.find(t=>t.getVariables().get("TowerId").getAsNumber()===sv.get("SelectedTower").getAsNumber()&&scene.getObjects(t.getName()).includes(t));
  positionPanel(tower);layer.show(!!tower);ui.tower=tower;ui.cards=[];
  if(!tower){ui.screenRect=null;return;}
  const v=tower.getVariables(),isStar=true,isFusion=scene.__starCannon.isFusion(tower),hasUpgrades=!isFusion,cfg=sv.get("StarCannonConfig").toJSObject();
  const panel=(key,x,y,width,height,color="255;255;255",name="SelectedPanelBackground",z=1)=>{const o=ui.ensure(key,name,z);o.setPosition(x,y);o.setWidth(width);o.setHeight(height);o.setColor(color);o.setOpacity(255);o.hide(false);return o;};
  const text=(key,value,x,y,width,size=13,color="240;230;255",bold=false)=>{const o=ui.ensure(key,"SelectedPanelText",4);o.setPosition(x,y);o.setWrapping(true);o.setWrappingWidth(width);o.setTextAlignment("left");o.setString(String(value));o.setCharacterSize(size);o.setBold(bold);o.setColor(color);o.hide(false);return o;};
  panel("frame",0,0,w,h);
  panel("header",12,10,w-24,42,"255;255;255","SelectedPanelPlaque",2);
  text("title",v.get("TowerName").getAsString().toUpperCase(),22,22,w-66,17,"243;234;255",true);
  text("close","X",286,20,16,14,"194;171;233",true);
  const preview=ui.ensure("preview","SelectedTowerPreview",3);preview.setAnimationName("SC_"+v.get("VisualKey").getAsString());preview.setScale(1);const ratio=preview.getWidth()/Math.max(1,preview.getHeight());preview.setWidth(ratio>=1?84:84*ratio);preview.setHeight(ratio>=1?84/ratio:84);preview.setPosition((w-preview.getWidth())/2,62+(84-preview.getHeight())/2);preview.hide(false);
  if(hasUpgrades)text("build",v.get("Path1Level").getAsNumber()+" - "+v.get("Path2Level").getAsNumber(),138,148,64,12,"163;224;251",true);
  const stats=[["DAMAGE",Number(v.get("Damage").getAsNumber().toFixed(2))],["FIRE INTERVAL",Number(v.get("AttackInterval").getAsNumber()).toFixed(2)+" s"],["ATTACK RANGE",Number(v.get("AttackRange").getAsNumber().toFixed(2))+" px"],["DAMAGE DEALT",Math.round(v.get("DamageDealt").getAsNumber())]];
  stats.forEach(([label,value],i)=>{
    const y=174+i*25;text("statLabel"+i,label,24,y,164,12,"171;159;199");const o=text("statValue"+i,value,194,y,100,13,"240;233;255",true);o.setTextAlignment("right");
    panel("rule"+i,24,y+20,272,1,"93;66;125","SelectedProgressBlock",2);
  });
  if(hasUpgrades) {
    if(isStar){
      const a=v.get('Path1Level').getAsNumber(),b=v.get('Path2Level').getAsNumber();
      const mode=a>=5?'EVERY 4TH: LANCE / '+cfg.Lance.MaxTargets+' IMPACTS':a>=3?'EVERY 4TH: NOVA / 175% DAMAGE':b>=5?(v.get('OverdriveActive').getAsBoolean()?'OVERDRIVE: DUAL FIRE':'ALTERNATING / OVERDRIVE '+v.get('OverdriveRemaining').getAsNumber().toFixed(1)+'s'):b>=3?'ALTERNATING MUZZLES':'SINGLE STELLAR BOLT';
      text('starMode',mode+(b>=4?' / RHYTHM '+v.get('RhythmStacks').getAsNumber()+'/5':''),24,276,272,10,'184;211;239');
    }
    text("upgrades","UPGRADES",116,isStar?294:282,150,14,"160;230;249",true);
    cfg.Paths.forEach((path,i)=>{
      const level=v.get(i===0?"Path1Level":"Path2Level").getAsNumber(),other=v.get(i===0?"Path2Level":"Path1Level").getAsNumber();
      const locked=level>=2&&other>=3,max=level>=cfg.MaxLevel,upgrade=path.Upgrades[max?cfg.MaxLevel-1:level],affordable=sv.get("Money").getAsNumber()>=upgrade.Cost;
      const x=16+i*148,y=314,active=!locked&&!max;
      const background=panel("card"+i,x,y,140,270,locked?"116;95;148":active&&hover==="Path"+(i+1)?"230;210;255":"240;224;255","SelectedUpgradeCard",2);
      const badge=ui.ensure("pathBadge"+i,"StarUpgradeIcon",3);badge.setAnimationName(i===0?"PathDamage":"PathSpeed");badge.setWidth(24);badge.setHeight(24);badge.setPosition(x+10,y+12);badge.setOpacity(locked?170:255);badge.hide(false);
      text("path"+i,isStar?path.Name:"PATH "+(i+1),x+40,y+12,90,isStar?10:13,"193;224;255",true);
      for(let n=0;n<cfg.MaxLevel;n++)panel("progress"+i+"_"+n,x+12+n*23,y+46,20,8,n<level?"151;232;255":"112;93;146","SelectedProgressBlock",3);
      const icon=ui.ensure("icon"+i,"StarUpgradeIcon",3);icon.setAnimationName(upgrade.Icon);icon.setWidth(72);icon.setHeight(72);icon.setPosition(x+34,y+61);icon.setOpacity(locked?165:255);icon.hide(false);
      const title=upgrade.Name;
      const name=text("upgradeName"+i,title,x+10,y+138,120,12,"237;224;255",true);name.setTextAlignment("center");
      const desc=text("description"+i,upgrade.Description,x+10,y+174,120,11,"184;174;208");desc.setTextAlignment("center");
      panel("purchase"+i,x+10,y+222,120,34,locked?"130;105;157":"255;255;255","SelectedPanelPlaque",3);
      const status=max?"MAX LEVEL":locked?"LOCKED":upgrade.Cost+" GOLD";
      const label=text("cost"+i,status,x+14,y+232,112,12,locked?"201;181;224":!max&&!affordable?"255;130;164":"229;226;255",true);label.setTextAlignment("center");
      if(locked) {
        panel("lockBody"+i,x+63,y+202,14,12,"168;147;211","SelectedProgressBlock",4);
        panel("lockLeft"+i,x+65,y+195,2,9,"168;147;211","SelectedProgressBlock",4);
        panel("lockTop"+i,x+65,y+194,10,2,"168;147;211","SelectedProgressBlock",4);
        panel("lockRight"+i,x+73,y+195,2,9,"168;147;211","SelectedProgressBlock",4);
        panel("lockHole"+i,x+69,y+205,2,5,"42;29;65","SelectedProgressBlock",5);
      }
      ui.cards.push({path:i+1,level,locked,max,affordable,background,icon,name,cost:label});
    });
    if(scene.__fusion?.eligible(tower)){
      ui.fusionButton=panel('fusion',16,584,288,26,hover==='Fusion'?'207;222;255':'255;255;255','SelectedPanelPlaque',3);
      text('fusionLabel','FUSION  /  CELESTIAL ASCENSION',35,592,260,11,'207;224;255',true);
    }else{ui.fusionButton=null;text("lockHint","Specialization caps the other path at Lv2.",24,593,272,11,"167;151;195");}
  } else{
    ui.fusionButton=null;text('fusionIdentity','PURE FUSION / STARBURST',32,302,260,15,'198;223;255',true);
    text('fusionInfo','Heavy core + rapid release\nThree alternating muzzle positions\nSmall impact splash\nNo further upgrades',32,344,260,14,'204;188;228');
    text("none","ASCENSION COMPLETE",55,462,240,14,"174;214;239",true);
  }
  const investment=v.get("TotalInvestment").getAsNumber()||v.get("PurchasePrice").getAsNumber();
  const sellValue=Math.floor(investment*sv.get("SellRefundRate").getAsNumber()+(isStar?1e-8:0));v.get("SellValue").setNumber(sellValue);
  panel("sell",16,h-66,w-32,48,hover==="Sell"?"187;222;255":"255;255;255","SelectedPanelPlaque",3);
  text("sellText","SELL",30,h-49,90,14,"230;222;255",true);
  const sell=text("sellValue",sellValue+" GOLD",154,h-49,132,14,"230;222;255",true);sell.setTextAlignment("right");
  text("hint","Empty map / ESC to close",83,h-14,220,10,"161;146;185");
};
