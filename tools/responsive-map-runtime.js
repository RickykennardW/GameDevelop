// Responsive two-column shop with one official Star Cannon. All purchase and wave actions stay in the native events below.
const scene = runtimeScene;
const variables = scene.getVariables();
// Independent world presentation controls; combat stats are deliberately separate.
const style=scene.__worldStyle || (scene.__worldStyle={road:88,star:2.5,
 enemy:1.55,spawn:5.2,base:2.15,
 props:{Crystal:1.65,Rock:1.75,Ruin:2.30,Shrub:1.65},
 footprints:{StarCannonTower:46},cliffUnit:.32});
if(!scene.__worldStyleInitialized){
 for(const [name,radius] of Object.entries(style.footprints)){
  const v=variables.get('TowerFootprints').getChild(name);v.getChild('Radius').setNumber(radius);
  v.getChild('RenderScale').setNumber(style.star);
 }
 scene.__worldStyleInitialized=true;
}
const get = name => scene.getObjects(name);
const first = name => get(name)[0];
const number = name => variables.get(name).getAsNumber();
const boolean = name => variables.get(name).getAsBoolean();
const mode = () => variables.get("WaveMode").getAsString();
// One authoritative state: Waiting(0), Manual(1), ManualFast(2), Auto(3), AutoFast(4).
const autoMode = () => mode() === "Auto" || mode() === "AutoFast";
const fastMode = () => mode() === "ManualFast" || mode() === "AutoFast";
const syncWaveControl = () => {
  const valid = ["Waiting","Manual","ManualFast","Auto","AutoFast"];
  if (!valid.includes(mode())) variables.get("WaveMode").setString(boolean("WaveActive") ? "Manual" : "Waiting");
  const manager = scene.__waveManager;
  const spawningDone = !manager || manager.index >= manager.queue.length;
  const finished = !boolean("WaveActive") && number("EnemiesToSpawn") === 0 && get("Enemy").length === 0 && spawningDone;
  if (boolean("GameOver") || number("Lives") <= 0) variables.get("WaveMode").setString("Waiting");
  else if (!autoMode() && finished) variables.get("WaveMode").setString("Waiting");
  else if (mode() === "Waiting" && boolean("WaveActive")) variables.get("WaveMode").setString("Manual");
  const scale = fastMode() ? 2 : 1;
  const time = scene.getTimeManager();
  if (time.getTimeScale() !== scale) time.setTimeScale(scale);
};
syncWaveControl();
const modal = boolean("IndexOpen");
let ui = scene.__towerShopUI;
if (!ui || ui.root !== first("TowerShopBox")) {
  ui = scene.__towerShopUI = { root: first("TowerShopBox"), cards: [], wasDown: false, pressedCard: -1, pressedControl: "", dragging: false };
  ui.ensure = (name, index) => {
    let object = get(name).find(object => object.getVariables().get("ShopIndex").getAsNumber() === index);
    if (!object) { object = scene.createObject(name); object.getVariables().get("ShopIndex").setNumber(index); }
    object.setLayer("TowerShopList");
    return object;
  };
  const container = scene.getLayer("TowerShopList").getRenderer().getRendererObject();
  ui.mask = new PIXI.Graphics();
  container.addChild(ui.mask);
  container.mask = ui.mask;
}
// Match the actual Preview/window viewport; keep UI pixels and camera zoom at 1.
const game = scene.getGame();
const viewportWidth = Math.round(gdjs.RuntimeGameRenderer.getWindowInnerWidth());
const viewportHeight = Math.round(gdjs.RuntimeGameRenderer.getWindowInnerHeight());
if (viewportWidth > 0 && viewportHeight > 0 && (game.getGameResolutionWidth() !== viewportWidth || game.getGameResolutionHeight() !== viewportHeight)) {
  game.setGameResolutionSize(viewportWidth, viewportHeight);
  scene.onGameResolutionResized();
}
const width = game.getGameResolutionWidth();
const height = game.getGameResolutionHeight();
// UI uses a stable logical shop X outside the buildable world area. Its camera anchors it to screen right.
const sidebarMargin = 8, mapSidebarGap = 10;
const sidebarScreenX = width - 224 - sidebarMargin;
const gameAreaRight = Math.max(1, sidebarScreenX - mapSidebarGap);
const offsetX = 1376 + sidebarMargin - width;
for (const layerName of ["UI", "TowerShopList"]) {
  const layer = scene.getLayer(layerName);
  layer.setCameraZoom(1, 0);
  layer.setCameraX(width / 2 + offsetX, 0);
  layer.setCameraY(height / 2, 0);
}
// One reference world, independent of monitor resolution. Fullscreen changes the
// world camera, not route density. World units, footprints and combat ranges stay intact.
const map = scene.getLayer("");
const compactHUD = gameAreaRight < 348;
const hudHeight = compactHUD ? 104 : 44;
const safeTop = 16 + hudHeight + 20;
// HUD overlays the empty upper cliff margin; its input guard remains authoritative.
// On narrow portrait windows reserve the taller HUD band explicitly.
const frameTop = compactHUD ? safeTop : 16;
const mapFrame = { left: 16, top: frameTop, right: Math.max(17,gameAreaRight-16), bottom: Math.max(frameTop+1,height-24) };
const layoutKey = "celestial-four-lane-88";
if (!ui.level) {
  // Four broad lanes preserve total travel distance (7128 vs 7168 world units),
  // while allowing wider roads and larger sprites without shrinking build pockets.
  const cell=style.road,left=cell,right=cell*19,firstY=cell*2;
  const rows = [2,5,8,11].map(row=>row*cell);
  const corners = [[left,rows[0]]];
  rows.forEach((y,i)=>{if(i)corners.push([corners[corners.length-1][0],y]);corners.push([i%2===0?right:left,y]);});
  const positions = [corners[0]];
  for (const [tx,ty] of corners.slice(1)) {
    let [x,y] = positions[positions.length-1];
    while (x!==tx || y!==ty) { x+=Math.sign(tx-x)*cell;y+=Math.sign(ty-y)*cell;positions.push([x,y]); }
  }
  const tiles = get("Monster_Path").slice().sort((a,b)=>a.getVariables().get("PathOrder").getAsNumber()-b.getVariables().get("PathOrder").getAsNumber());
  positions.forEach(([x,y],i)=>{
    const tile = tiles[i] || scene.createObject("Monster_Path");
    tile.setLayer("");tile.setZOrder(0);tile.setWidth(cell);tile.setHeight(cell);tile.setPosition(x,y);tile.setAnimationName("Surface");tile.getVariables().get("PathOrder").setNumber(i);
  });
  tiles.slice(positions.length).forEach(tile=>tile.deleteFromScene());
  const spawnPoint=[left+cell/2,firstY+cell/2],last=positions.at(-1),basePoint=[last[0]+cell/2,last[1]+cell/2];
  const spawn = first("SpawnMarker"), base=first("BaseMarker");
  spawn.setPosition(spawnPoint[0]-16,spawnPoint[1]-16);spawn.setWidth(32);spawn.setHeight(32);spawn.setZOrder(0);
  base.setPosition(basePoint[0]-40,basePoint[1]-40);base.setWidth(80);base.setHeight(80);
  const trees = get("Ground_Decoration");
  const middle=(left+right)/2;
  const treePoints=[];
  // Asymmetric floor clusters: keep generous bend pockets and multiple open strips.
  const compositions=[[.24,.32,.60,.67],[.72,.64,.30,.39],[.35,.43,.72,.79]];
  for(let band=0;band<3;band++){
    const y=(rows[band]+cell+rows[band+1])/2-32;
    for(const t of compositions[band])treePoints.push([left+(right-left)*t-32,y]);
  }
  trees.forEach((tree,i)=>{tree.setPosition(...treePoints[i%12]);tree.getVariables().get('LocalScale').setNumber(1);tree.getVariables().get('Kind').setString(['Crystal','Rock','Ruin','Shrub'][i%4]);});
  // Smaller satellites enrich floor clusters without adding another large obstruction.
  for(const [kind,t,band,dy,size] of [
    ['Rock',.21,0,40,.42],['Shrub',.29,0,46,.56],
    ['Crystal',.75,1,42,.46],['Shrub',.67,1,50,.53],
    ['Rock',.69,2,44,.43],['Shrub',.39,2,48,.56],
    ['Crystal',.48,-1,0,.80],['Shrub',.54,-1,20,.72]]){
      const o=scene.createObject('Ground_Decoration');o.setLayer('');o.getVariables().get('Kind').setString(kind);o.getVariables().get('LocalScale').setNumber(size);
      const y=band<0?firstY-72:(rows[band]+cell+rows[band+1])/2+dy;
      o.setPosition(left+(right-left)*t-32,y-32);
  }
  // Exact outer extent of the proportional perimeter in island-map-runtime.js,
  // plus 12 world px breathing room. All frame pieces fit, including hanging rock.
  ui.mapBounds={left:left-16-225*style.cliffUnit-12,top:firstY-112-180*style.cliffUnit-12,
    right:right+cell+16+225*style.cliffUnit+12,bottom:rows.at(-1)+cell+16+206*style.cliffUnit+12};
  ui.level={key:layoutKey,rows,left,right,spawn:spawnPoint,base:basePoint,tileCount:positions.length,length:(positions.length-1)*cell};
  variables.get("MapRouteDirty").setBoolean(true);
}
const bounds = {...ui.mapBounds};
// Fixed gameplay framing depends only on static map geometry, never on towers/ghosts.
ui.fittedBounds=bounds;
const zoom = Math.max(0.001,Math.min((mapFrame.right-mapFrame.left)/(bounds.right-bounds.left),(mapFrame.bottom-mapFrame.top)/(bounds.bottom-bounds.top)));
map.setCameraZoom(zoom,0);
map.setCameraX((bounds.left+bounds.right)/2-((mapFrame.left+mapFrame.right)/2-width/2)/zoom,0);
map.setCameraY((bounds.top+bounds.bottom)/2-((mapFrame.top+mapFrame.bottom)/2-height/2)/zoom,0);
// The original grass texture tiles naturally across ALL visible gameplay pixels.
const ground = first("Ground_Map");
const min = map.convertCoords(0,0,0,[0,0]), max=map.convertCoords(gameAreaRight,height,0,[0,0]);
ground.setPosition(min[0],min[1]);ground.setWidth(max[0]-min[0]);ground.setHeight(max[1]-min[1]);
if (!ui.mapMask) {
  const container=map.getRenderer().getRendererObject();ui.mapMask=new PIXI.Graphics();container.addChild(ui.mapMask);container.mask=ui.mapMask;
}
const maskKey=[width,height,gameAreaRight,zoom,map.getCameraX(),map.getCameraY()].join(",");
if(ui.mapMaskKey!==maskKey){ui.mapMask.clear().beginFill(0xffffff).drawRect(min[0],min[1],max[0]-min[0],max[1]-min[1]).endFill();ui.mapMaskKey=maskKey;}
ui.gameArea={left:0,top:0,right:gameAreaRight,bottom:height,sidebarX:sidebarScreenX,gap:mapSidebarGap,margin:sidebarMargin,frame:mapFrame};

ui.geometry = { rootX: 1152, rootY: sidebarMargin, panelHeight: height - sidebarMargin * 2, listX: 1168, listY: 72 + sidebarMargin, listWidth: 176 };
const geometry = ui.geometry;
geometry.bottom = geometry.rootY + geometry.panelHeight;
geometry.listHeight = Math.max(1, geometry.bottom - geometry.listY - 88);
geometry.playY = geometry.bottom - 72;
geometry.trackX = 1350;
const rect = (name, x, y, w, h) => { const o = first(name); o.setPosition(x, y); if (w !== undefined) o.setWidth(w); if (h !== undefined) o.setHeight(h); };
rect("TowerShopBox", 1152, geometry.rootY, 224, geometry.panelHeight);
rect("ShopHeaderPlaque", 1166, geometry.rootY + 10, 196, 48);
rect("ShopFooterFrame", 1160, geometry.playY - 4, 208, 72);
rect("AssetPanelTitle", 1168, geometry.rootY + 16, 192, 24);
rect("AssetPanelSubtitle", 1168, geometry.rootY + 37, 192, 16);
rect("ShopIndexButton", 1168, geometry.playY, 92, 60);

rect("ShopPlayButton", 1268, geometry.playY, 92, 60);
rect("ShopPlayIcon", 1302, geometry.playY + 8, 24, 24);
rect("ShopPlayLabel", 1268, geometry.playY + 36, 92, 20);
rect("ShopSpeedBadge", 1332, geometry.playY + 8, 20, 14);
rect("ShopScrollTrack", geometry.trackX, geometry.listY, 8, geometry.listHeight);

// Keep the original HUD artwork. On narrow windows only its row arrangement changes.
const hudWidth = compactHUD ? Math.max(1, Math.min(196, gameAreaRight - 32)) : 316;
rect("HUDPanel", offsetX + 16, 16, hudWidth, hudHeight);
get("HUDIcon").forEach((o, i) => { o.setPosition(offsetX + (compactHUD ? 28 : [28,148,230][i]), compactHUD ? 26 + i * 30 : 26); o.setWidth(24); o.setHeight(24); });
for (const [i,name] of ["MoneyText","LivesText","WaveText"].entries()) {
  rect(name, offsetX + (compactHUD ? 60 : [60,180,262][i]), compactHUD ? 25 + i * 30 : 25, compactHUD ? Math.max(1,hudWidth-52) : [80,40,62][i], 28);
}
const message = first("MessageText");
message.setWidth(Math.max(1, gameAreaRight - 32));
message.setPosition(offsetX + 16, height / 2 - 20);
// Prices have exactly one source: the existing costs migrated unchanged into TowerShopCatalog.
const catalog = variables.get("TowerShopCatalog").toJSObject();
for (const name of ["AssetCardPanel", "TileType_Button", "AssetTowerLabel", "AssetTowerPrice", "ShopCoin"]) {
  get(name).slice().forEach(object => {
    if (object.getVariables().get("ShopIndex").getAsNumber() >= catalog.length) object.deleteFromScene(scene);
  });
}
ui.cards.length = catalog.length;
for (let i = 0; i < catalog.length; i++) {
  const item = catalog[i];
  if (!ui.cards[i]) {
    const card = ui.cards[i] = { background: ui.ensure("AssetCardPanel", i), icon: ui.ensure("TileType_Button", i), name: ui.ensure("AssetTowerLabel", i), price: ui.ensure("AssetTowerPrice", i), coin: ui.ensure("ShopCoin", i) };
    
    if (card.icon.hasBehavior("Effect")) card.icon.getBehavior("Effect").enableEffect("Outline", false);
    card.icon.setAnimationName(item.IconAnimation || item.Type);
    const ratio = card.icon.getWidth() / Math.max(1, card.icon.getHeight());
    card.iconWidth = ratio > 1 ? 56 : 56 * ratio;
    card.iconHeight = ratio > 1 ? 56 / ratio : 56;
  }
  const card = ui.cards[i];
  card.item = item;
  card.icon.getVariables().get("TowerType").setString(item.Type);
  card.icon.getVariables().get("Cost").setNumber(item.Cost);
  card.name.setString(item.Name);
  card.name.setCharacterSize(11);card.name.setWrapping(true);card.name.setWrappingWidth(76);card.name.setTextAlignment("center");
  card.price.setCharacterSize(13);card.price.setWrapping(true);card.price.setWrappingWidth(46);card.price.setTextAlignment("center");
  card.price.setString(String(item.Cost));
}
const contentHeight = Math.ceil(catalog.length / 2) * 120 - 8;
const maxScroll = Math.max(0, contentHeight - geometry.listHeight);
let scroll = Math.max(0, Math.min(maxScroll, number("TowerShopScroll")));
const input = scene.getGame().getInputManager();
const mx = gdjs.evtTools.input.getCursorX(scene, "UI", 0);
const my = gdjs.evtTools.input.getCursorY(scene, "UI", 0);
const inside = (x,y,w,h) => mx >= x && mx < x+w && my >= y && my < y+h;
const shopVisible = !modal;
const inList = inside(geometry.listX, geometry.listY, geometry.listWidth, geometry.listHeight);
const inTrack = inside(geometry.trackX - 3, geometry.listY, 14, geometry.listHeight);
variables.get("TowerShopPointerInside").setBoolean(shopVisible && inList);
variables.get("TowerShopRequestedType").setString("");
variables.get("PlayWaveRequested").setBoolean(false);
if (shopVisible && (inList || inTrack)) scroll = Math.max(0, Math.min(maxScroll, scroll - Math.sign(input.getMouseWheelDelta()) * 48));
const hoveredIndex = () => {
  if (!shopVisible || !inList) return -1;
  const x = mx - geometry.listX, y = my - geometry.listY + scroll;
  const col = Math.floor(x / 92), row = Math.floor(y / 120), index = row * 2 + col;
  return col < 2 && x % 92 < 84 && y % 120 < 112 && index < catalog.length ? index : -1;
};
const ready = !boolean("WaveActive") && !boolean("GameOver") && number("Wave") < (number("MaximumWave")||45);
const overIndex = !modal && inside(1168, geometry.playY, 92, 60);
const overPlay = !modal && inside(1268, geometry.playY, 92, 60);
const down = input.isMouseButtonPressed(0);
let hovered = hoveredIndex();
if (down && !ui.wasDown) {
  ui.pressedCard = hovered;
  ui.pressedControl = overIndex ? "Index" : overPlay ? "Play" : "";
  if (inTrack && maxScroll > 0 && shopVisible) { ui.dragging = true; ui.dragStartY = my; ui.dragStartScroll = scroll; ui.pressedCard = -1; }
}
const thumbHeight = maxScroll > 0 ? Math.max(22, geometry.listHeight * geometry.listHeight / contentHeight) : geometry.listHeight;
if (ui.dragging && down) scroll = Math.max(0, Math.min(maxScroll, ui.dragStartScroll + (my - ui.dragStartY) * maxScroll / Math.max(1, geometry.listHeight - thumbHeight)));
if (!down && ui.wasDown) {
  if (ui.pressedControl === "Index" && overIndex) ui.indexRequested = true;
  if (ui.pressedControl === "Play" && overPlay && !boolean("GameOver")) {
    if (mode() === "Waiting") {
      if (ready) variables.get("PlayWaveRequested").setBoolean(true);
    } else {
      const cycle = ["Manual","ManualFast","Auto","AutoFast"];
      variables.get("WaveMode").setString(cycle[(cycle.indexOf(mode()) + 1) % cycle.length]);
      // Cancelling AUTO between waves returns to waiting; an active wave never pauses.
      syncWaveControl();
    }
  }
  if (!ui.dragging && ui.pressedCard >= 0 && ui.pressedCard === hovered && number("Money") >= catalog[hovered].Cost) variables.get("TowerShopRequestedType").setString(catalog[hovered].Type);
  ui.pressedCard = -1; ui.pressedControl = ""; ui.dragging = false;
}
ui.wasDown = down;
variables.get("TowerShopScroll").setNumber(scroll);
hovered = hoveredIndex();
ui.mask.clear().beginFill(0xffffff).drawRect(geometry.listX, geometry.listY, geometry.listWidth, geometry.listHeight).endFill();
ui.cards.forEach((card, i) => {
  const x = geometry.listX + (i % 2) * 92, y = geometry.listY + Math.floor(i / 2) * 120 - scroll;
  card.background.setPosition(x, y); card.background.setWidth(84); card.background.setHeight(112);
  const pressed = down && ui.pressedCard === i && hovered === i;
  const scale = pressed ? 0.94 : hovered === i ? 1.04 : 1;
  card.icon.setWidth(card.iconWidth * scale); card.icon.setHeight(card.iconHeight * scale);
  card.icon.setPosition(x + 42 - card.icon.getWidth()/2, y + 51 - card.icon.getHeight()/2);
  card.name.setPosition(x + 4, y + 5); card.name.setWidth(76); card.name.setHeight(18);
  card.coin.setPosition(x + 13, y + 91); card.coin.setWidth(15); card.coin.setHeight(15);
  card.price.setPosition(x + 31, y + 91); card.price.setWidth(46); card.price.setHeight(20);
});
rect("ShopScrollThumb", geometry.trackX, geometry.listY + (maxScroll > 0 ? scroll / maxScroll * (geometry.listHeight - thumbHeight) : 0), 8, thumbHeight);
ui.scrollMax = maxScroll; ui.hovered = hovered; ui.ready = ready; ui.overPlay = overPlay;
ui.refresh = () => {
  const selectedTower = number("SelectedTower") > 0;
  scene.getLayer("TowerShopList").show(true);
  const indicator = first("TilePlacement_Indicator");
  ui.cards.forEach((card, i) => {
    const affordable = number("Money") >= card.item.Cost;
    const selected = !indicator.isHidden() && indicator.getAnimationName() === card.item.Type;
    const pressed = ui.wasDown && ui.pressedCard === i && ui.hovered === i;
    card.background.setColor(selected ? "188;237;255" : pressed ? "184;152;232" : ui.hovered === i ? "218;199;255" : "235;224;255");
    if (card.background.hasBehavior("Effect")) card.background.getBehavior("Effect").enableEffect("Outline", selected);
    card.background.setOpacity(affordable ? 255 : 220);
    card.icon.setOpacity(affordable ? 255 : 190);
    card.price.setColor(affordable ? "244;232;255" : "255;120;155");
    card.name.setColor(affordable ? "245;233;255" : "173;150;203");
    for (const part of [card.background,card.icon,card.name,card.price,card.coin]) part.hide(false);
  });
  syncWaveControl();
  const ended = boolean("GameOver"), current = mode();
  const isAuto = autoMode(), isFast = fastMode();
  const isManual = current === "Manual" || current === "ManualFast";
  first("ShopPlayButton").setOpacity(ended ? 155 : 255);
  first("ShopPlayButton").setColor(isFast ? "149;234;255" : ui.overPlay ? "207;194;255" : "240;228;255");
  if (first("ShopPlayButton").hasBehavior("Effect")) first("ShopPlayButton").getBehavior("Effect").enableEffect("Outline", isFast && !ended);
  first("ShopPlayIcon").hide(ended || isAuto);
  first("ShopPlayIcon").setAnimationName(isManual ? "Manual" : "Play");
  first("ShopPlayLabel").setCharacterSize(ended ? 12 : 14);
  first("ShopPlayLabel").setString(ended ? (number("Lives") > 0 ? "COMPLETE" : "GAME OVER") : isAuto ? "AUTO" : isManual ? "MANUAL" : "PLAY");
  first("ShopPlayLabel").setY(geometry.playY + (ended || isAuto ? 22 : 36));
  first("ShopSpeedBadge").hide(!isFast || ended);
  first("ShopIndexButton").setColor(overIndex ? "207;194;255" : "255;255;255");
  const indexIcon = first("Index_logo"), indexButton = first("ShopIndexButton");
  const iconScale = overIndex ? (ui.wasDown && ui.pressedControl === "Index" ? 0.95 : 1.05) : 1;
  const iconSize = Math.min(indexButton.getWidth(), indexButton.getHeight()) * 0.90 * iconScale;
  indexIcon.setWidth(iconSize); indexIcon.setHeight(iconSize);
  indexIcon.setPosition(indexButton.getX() + (indexButton.getWidth() - iconSize) / 2, indexButton.getY() + (indexButton.getHeight() - iconSize) / 2);
  first("ShopScrollThumb").setOpacity(maxScroll > 0 ? 255 : 110);
};
