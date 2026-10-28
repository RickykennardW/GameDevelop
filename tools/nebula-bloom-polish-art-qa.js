// Native image-manager capture of final SVG icons / PNG fog. No product UI edit.
(async()=>{
 const G=testGame,S=G.getSceneStack().getCurrentScene(),I=G.getInputManager(),N=S.__nebulaBloom,mode=globalThis.BALANCE_MODE||'icons';G.pause(true);const step=()=>{S.renderAndStep(16.667);I.onFrameEnded();};step();
 const W=G.getGameResolutionWidth(),H=G.getGameResolutionHeight(),layer=S.getLayer('IndexUI'),parent=layer.getRenderer().getRendererObject(),bg=new PIXI.Graphics();bg.zIndex=-20;bg.beginFill(0x101022).drawRect(0,0,W,H).endFill();parent.addChild(bg);
 const text=(value,x,y,w,size=16,color='233;223;247')=>{const o=S.createObject('IndexText');o.setLayer('IndexUI');o.setZOrder(9);o.setString(value);o.setCharacterSize(size);o.setWrapping(true);o.setWrappingWidth(w);o.setPosition(x,y);o.setColor(color);o.setTextAlignment('center');return o;};
 text(mode==='fog'?'NEBULA BLOOM / FOUR TOXIC FOG SHAPES':'NEBULA BLOOM / TEN DISTINCT UPGRADE SYMBOLS',32,22,W-64,25);const captures=[];
 if(mode==='fog'){
  const names=N.config.CloudVariants,cw=(W-64)/4;
  for(let i=0;i<4;i++){const x=32+i*cw,anim=names[i],o=S.createObject('NebulaBloomVFX');o.setLayer('IndexUI');o.setZOrder(2);o.setAnimationName(anim);o.setWidth(230);o.setHeight(230);o.setPosition(x+(cw-230)/2,95);o.setOpacity(255);text('FOG '+String.fromCharCode(65+i),x,65,cw,17);text(i===0?'Existing soft wreath':i===1?'Curved spore stream':i===2?'Broken nebula cluster':'Branching cosmic plume',x,335,cw,14);const low=S.createObject('NebulaBloomVFX');low.setLayer('IndexUI');low.setZOrder(2);low.setAnimationName(anim);low.setWidth(230);low.setHeight(230);low.setPosition(x+(cw-230)/2,415);low.setOpacity(255*.17);captures.push(anim);}
  text('Top: source shapes / Bottom: actual cloud opacity 17% / Shapes rotate and cycle in combat',30,H-38,W-60,14,'164;190;218');
 }else{
  const cw=(W-64)/5;for(let p=0;p<2;p++)for(let level=0;level<5;level++){const u=N.config.Paths[p].Upgrades[level],x=32+level*cw,y=100+p*280;const o=S.createObject('StarUpgradeIcon');o.setLayer('IndexUI');o.setZOrder(2);o.setAnimationName(u.Icon);o.setWidth(128);o.setHeight(128);o.setPosition(x+(cw-128)/2,y);text(u.Name,x+5,y+140,cw-10,15);const small=S.createObject('StarUpgradeIcon');small.setLayer('IndexUI');small.setZOrder(2);small.setAnimationName(u.Icon);small.setWidth(36);small.setHeight(36);small.setPosition(x+(cw-36)/2,y+191);captures.push(u.Icon);}
  text('TOXIC SPOREBLOOM',32,69,W-64,17,'209;167;240');text('CATACLYSM BLOOM',32,350,W-64,17,'168;216;244');text('Native SVG render / Large artwork and 36px readability sample',30,H-30,W-60,13,'164;190;218');
 }
 step();for(const l of G.getSceneAndExtensionsData(S.getName()).sceneData.layers)S.getLayer(l.name).show(l.name==='IndexUI');layer.show(true);parent.sortChildren();S.getRenderer().render();
 return{mode,captures,viewport:[W,H],nativeTextures:true,gameplayModified:false};
})()
