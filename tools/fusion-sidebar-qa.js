// Contextual sidebar UX in the actual native exported preview; isolated test state only.
(async()=>{
 const G=testGame,S=G.getSceneStack().getCurrentScene(),V=S.getVariables(),I=G.getInputManager(),get=n=>S.getObjects(n),checks=[];
 const ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);},step=(n=1)=>{for(let i=0;i<n;i++){S.renderAndStep(16.667);I.onFrameEnded();}},near=(a,b)=>Math.abs(a-b)<.0001;
 const move=(x,y,layer='')=>{I.onMouseMove(...S.getLayer(layer).convertInverseCoords(x,y,0,[0,0]));step(2);},click=(x,y,layer='')=>{move(x,y,layer);I.onMouseButtonPressed(0);step(2);I.onMouseButtonReleased(0);step(2);};
 const rect=o=>{const l=S.getLayer(o.getLayer()),a=l.convertInverseCoords(o.getX(),o.getY(),0,[0,0]),b=l.convertInverseCoords(o.getX()+o.getWidth(),o.getY()+o.getHeight(),0,[0,0]);return{x:a[0],y:a[1],w:b[0]-a[0],h:b[1]-a[1]};};
 const intersects=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
 const pixels=sprite=>{const r=G.getRenderer().getPIXIRenderer(),p=(r.extract||r.plugins.extract).pixels(sprite);let opaque=0,colored=0;for(let i=0;i<p.length;i+=4)if(p[i+3]>24){opaque++;if(p[i]>5||p[i+1]>5||p[i+2]>5)colored++;}return{opaque,colored};};
 G.pause(true);step(4);const F=S.__fusion,U=F.sidebar,A=G.__fusionArchive,P=S.__freePlacement,star=S.__starCannon,shop=S.__towerShopUI;
 const footerObjects=['ShopFooterFrame','ShopIndexButton','ShopPlayButton','ShopPlayLabel'],footer=footerObjects.map(n=>[n,rect(get(n)[0])]);
 const normal=()=>{ok(get('AssetPanelTitle')[0].getString()==='TOWERS'&&get('AssetPanelSubtitle')[0].getString()==='BUILD DEFENSE','normal header restored');ok(S.getLayer('TowerShopList').isVisible()&&shop.cards.every(c=>[c.background,c.icon,c.name,c.price,c.coin].every(o=>!o.isHidden())),'normal shop artwork/cards visible');ok(!U.root.visible&&Object.values(F.objects).every(o=>o.isHidden()),'no fusion body/native controls visible after exit');};
 const footerAudit=()=>{for(const [n,r]of footer)ok(JSON.stringify(rect(get(n)[0]))===JSON.stringify(r)&&!get(n)[0].isHidden(),'footer stays in place and visible: '+n);ok(!intersects(F.bannerRect,rect(get('ShopFooterFrame')[0])),'Fusion body/Cancel does not cover footer');};
 const audit=()=>{
  ok(get('AssetPanelTitle')[0].getString()==='FUSION'&&get('AssetPanelSubtitle')[0].getString().includes('0.5'),'contextual Fusion header and tactical speed');
  ok(!S.getLayer('TowerShopList').isVisible()&&shop.cards.every(c=>[c.background,c.icon,c.name,c.price,c.coin].every(o=>o.isHidden())),'entire purchase collection hidden during Fusion');
  ok(get('ShopScrollTrack')[0].isHidden()&&get('ShopScrollThumb')[0].isHidden(),'shop scrollbar hidden during Fusion');
  ok(U.root.visible&&!U.root.interactive&&!U.root.interactiveChildren,'single reusable non-interactive contextual body');
  const area=shop.gameArea;ok(F.bannerRect.x>=area.sidebarX&&F.bannerRect.x+F.bannerRect.w<=G.getGameResolutionWidth()-8,'Fusion body fits existing sidebar width');
  ok(F.cancelRect.h>=40&&F.objects.cancelText.getString()==='Cancel / ESC'&&F.objects.cancelText.getCharacterSize()>=14,'Cancel has comfortable40px target and readable14px text');
  ok(!U.texts.has('legend')&&!Object.values(F.objects).some(o=>o.getString?.().includes('AMBER:')),'no debug legend or instruction plaque');footerAudit();
  for(const [key,t]of U.texts)if(t.visible){ok(t.style.fontSize>=9&&t.width<=t.style.wordWrapWidth+2,'text stays within column: '+key);if(!U.maxScroll)ok(t.y+t.height<=U.screenRect.h+.5,'visible text fits unscrolled body: '+key);}
  for(const [key,p]of U.portraits)if(p.sprite.visible){const {x,y,w,h}=p.frame;ok(p.sprite.x>=x&&p.sprite.x<=x+w&&p.sprite.y>=y&&p.sprite.y<=y+h,'portrait centered in its own frame: '+key);}
 };
 normal();const camera=JSON.stringify([S.getLayer('').getCameraX(),S.getLayer('').getCameraY(),S.getLayer('').getCameraZoom()]);
 const make=(a,b,x,y)=>{const t=S.createObject('StarCannonTower'),v=t.getVariables();for(const [n,z]of Object.entries({TowerId:900000+t.getUniqueId(),PurchasePrice:300,TotalInvestment:300,Path1Level:a,Path2Level:b,FootprintX:x,FootprintY:y,FootprintRadius:46}))v.get(n).setNumber(z);step();star.apply(t);t.__starCooldown=100000;return t;};
 const a=make(5,2,300,352),b=make(2,5,900,352),other=make(0,0,420,352),gold=V.get('Money').getAsNumber(),writes=A.stats.writes;
 V.get('SelectedTower').setNumber(a.getVariables().get('TowerId').getAsNumber());step(3);const button=S.__selectedPanel.fusionButton;click(button.getCenterXInScene(),button.getCenterYInScene(),button.getLayer());ok(F.active,'actual selected tower Fusion button starts mode');audit();
 ok(U.phase==='SELECT_PARTNER'&&U.sourceEntries[0].name===a.getVariables().get('TowerName').getAsString()&&U.sourceEntries[0].path1===5&&U.sourceEntries[0].path2===2&&U.sourceEntries[1]===null,'source A reads actual tower; source B awaits selection');
 ok(U.portraits.get('source0').sprite.visible&&U.portraits.get('source0').resource===V.get('IndexPortraitCatalog').toJSObject().StarCannonTower.Image,'source A uses available original showcase artwork instead of a fallback');
 ok(U.texts.get('sourceQuestion1').visible&&U.texts.get('status').text==='Select a Max-Level Tower'&&!U.result,'partner phase shows one concise task');
 if(globalThis.BALANCE_MODE==='partner')return{checks,phase:U.phase};
 click(...P.center(b));move(...P.center(a));audit();
 ok(U.phase==='PREVIEW_PLACEMENT'&&U.sourceEntries[1].name===b.getVariables().get('TowerName').getAsString()&&U.sourceEntries[1].path1===2&&U.sourceEntries[1].path2===5,'source B updates from actual distant tower');
 ok(U.portraits.get('source1').sprite.visible&&U.portraits.get('source1').resource===U.portraits.get('source0').resource,'both selected source portraits use actual artwork');
 ok(U.result.id==='StarburstCannon'&&U.result.locked&&U.result.name==='???'&&U.portraits.get('result').sprite.tint===0&&!U.texts.get('sourceQuestion1').visible,'unknown evolution has real black silhouette/name lock, no stale partner placeholder');
 const lockedPixels=pixels(U.portraits.get('result').sprite);ok(lockedPixels.opaque>0&&lockedPixels.colored===0,'actual GPU result pixels preserve alpha and contain no leaked color while locked');
 ok(U.result.cost===F.config.FusionCost&&U.texts.get('cost').text===F.config.FusionCost+' Gold','evolution uses actual configured fusion cost');
 ok(!A.has('StarburstCannon')&&A.stats.writes===writes,'viewing result never unlocks or saves discovery');
 const stable=JSON.stringify(F.bannerRect);move(370,352);ok(F.preview.reason==='tower'&&U.status==='Occupied'&&F.ghost.getColor()==='255;80;105','invalid tower message follows actual validator');move(600,352);ok(U.status==='Outside Fusion Zone','regional failure uses concise message');
 const ruin=S.createObject('Ground_Decoration');ruin.getVariables().get('Kind').setString('Ruin');ruin.getVariables().get('LocalScale').setNumber(.5);ruin.setPosition(300,320);step(2);move(300,352);ok(F.preview.reason==='obstacle'&&U.status==='Blocked by Ruins','ruin message identifies collider that actually overlaps');ruin.deleteFromScene();step(2);move(300,352);
 const savedGold=V.get('Money').getAsNumber();V.get('Money').setNumber(-1);step(2);ok(F.preview.reason==='gold'&&U.status==='Insufficient Gold','Gold failure comes from unchanged validator');V.get('Money').setNumber(savedGold);step(2);
 ok(JSON.stringify(F.bannerRect)===stable,'invalid messages do not resize or move the sidebar');
 if(U.maxScroll){const before=U.scroll;I.onMouseMove(U.screenRect.x+U.screenRect.w/2,U.screenRect.y+U.screenRect.h/2);I.onMouseWheel(-120);step(2);ok(U.scroll>before&&U.root.mask===U.mask,'short viewport scrolls clipped body without shrinking typography');footerAudit();}
 if(globalThis.BALANCE_MODE==='locked')return{checks,phase:U.phase,result:U.result};
 click(F.cancelRect.x+F.cancelRect.w/2,F.cancelRect.y+20,'FusionUI');normal();ok(get('StarCannonTower').includes(a)&&get('StarCannonTower').includes(b)&&V.get('Money').getAsNumber()===gold,'Cancel keeps both sources and Gold');
 // Warm all controls once; twenty cycles must reuse the same body, sprites and texts.
 const parent=S.getLayer('FusionUI').getRenderer().getRendererObject(),children=parent.children.length,uiObjects=Object.values(F.objects).length,bodyChildren=U.root.children.length;
 for(let n=0;n<20;n++){F.begin(n%2?a:b);step(2);F.choose(n%2?b:a);step(2);ok(U.sourceEntries[0].path1===(n%2?5:2)&&U.sourceEntries[1].path1===(n%2?2:5),'source slots reflect reversed order '+n);if(n%2){click(F.cancelRect.x+100,F.cancelRect.y+20,'FusionUI');}else{I.onKeyPressed(27);step();I.onKeyReleased(27);step(2);}normal();ok(!F.markers.size&&!F.footprints.size&&!F.obstacleFootprints.size&&F.ghost.isHidden(),'mode cleanup '+n);}
 ok(parent.children.length===children&&Object.values(F.objects).length===uiObjects&&U.root.children.length===bodyChildren,'twenty cycles create no extra body, portrait, text or layer children');
 // Presentation reads data without a Star Cannon name literal.
 const name=a.getVariables().get('TowerName').getAsString();a.getVariables().get('TowerName').setString('Astral Test');F.begin(a);step(2);ok(U.sourceEntries[0].name==='Astral Test'&&U.texts.get('sourceName0').text==='Astral Test','source labels use live tower names');F.cancel();a.getVariables().get('TowerName').setString(name);step(2);
 F.begin(a);F.choose(b);step(2);move(300,352);click(300,352);const fusion=get('StarCannonTower').find(star.isFusion);ok(fusion&&!get('StarCannonTower').includes(a)&&!get('StarCannonTower').includes(b),'valid native placement still consumes exactly two sources');fusion.__starCooldown=100000;normal();
 ok(A.has('StarburstCannon')&&A.stats.unlockedVariants===1&&A.stats.writes===writes+1,'successful fusion alone opens shared discovery state');
 // Re-open with a new pair after the real first discovery; result is now revealed.
 const c=make(5,2,900,352),d=make(2,5,1300,800);F.begin(c);F.choose(d);step(3);move(...P.center(c));audit();
 ok(!U.result.locked&&U.result.name===A.definition('StarburstCannon').Name&&U.portraits.get('result').sprite.tint===0xffffff&&!U.texts.get('resultLock').visible,'known evolution shows actual catalog name/art without old lock label');
 ok(pixels(U.portraits.get('result').sprite).colored>0,'actual GPU result artwork becomes colored after successful discovery');
 if(globalThis.BALANCE_MODE==='known')return{checks,phase:U.phase,result:U.result};
 F.cancel();step(2);normal();V.get('IndexOpen').setBoolean(true);step(2);S.__unitIndex.category='Fusion';step(2);ok(!S.__unitIndex.cards[0].locked,'Fusion Index uses successful transaction discovery');
 ok(JSON.stringify([S.getLayer('').getCameraX(),S.getLayer('').getCameraY(),S.getLayer('').getCameraZoom()])===camera,'sidebar mode does not resize/reframe battlefield');
 return{checks,viewport:[G.getGameResolutionWidth(),G.getGameResolutionHeight()],cycles:20};
})()
