// Reentrant UI checks, including repeated browser viewport resize on one scene.
(async()=>{
 const G=testGame,S=G.getSceneStack().getCurrentScene(),V=S.getVariables(),I=G.getInputManager(),N=S.__nebulaBloom,P=S.__freePlacement,checks=[];G.pause(true);
 const ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);},step=(n=1)=>{for(let i=0;i<n;i++){S.renderAndStep(16.667);I.onFrameEnded();}};step(4);
 V.get('IndexOpen').setBoolean(false);step(2);const shop=S.__towerShopUI,c=shop.cards[1],W=G.getGameResolutionWidth(),H=G.getGameResolutionHeight();
 ok(shop.cards.length===2&&c.background.getWidth()===84&&c.background.getHeight()===112,'two original-size cards after resize');
 const a=shop.cards[0].background,b=c.background;ok(b.getX()>a.getX()+a.getWidth()&&b.getY()===a.getY(),'Nebula stays in second grid column without moving Star Cannon');
 const portraitTexture=G.getImageManager().getPIXITexture(V.get('IndexPortraitCatalog').toJSObject().NebulaBloomTower.Image);ok(c.icon.getAnimationName()==='NB_Portrait'&&Math.abs(c.icon.getWidth()/c.icon.getHeight()-portraitTexture.width/portraitTexture.height)<.01,'dedicated portrait keeps its original aspect ratio');
 const layer=S.getLayer('TowerShopList'),screen=layer.convertInverseCoords(b.getX(),b.getY(),0,[0,0]);ok(screen[0]>=shop.gameArea.right&&screen[0]+b.getWidth()<=W&&screen[1]>=0&&screen[1]+b.getHeight()<=H,'Nebula shop card remains inside right sidebar');
 let t=S.getObjects('NebulaBloomTower')[0];if(!t){t=S.createObject('NebulaBloomTower');for(const [k,v]of Object.entries({FootprintX:300,FootprintY:352,FootprintRadius:46,TowerId:910001}))t.getVariables().get(k).setNumber(v);P.positionSprite(t,'NebulaBloomTower',300,352);N.apply(t);}V.get('SelectedTower').setNumber(t.getVariables().get('TowerId').getAsNumber());step(2);
 const u=S.__selectedPanel,r=u.screenRect;ok(r&&r.x>=0&&r.y>=0&&r.x+r.w<=shop.gameArea.right&&r.y+r.h<=H,'Nebula selected panel fits gameplay viewport');
 for(let path=0;path<2;path++)for(let level=0;level<5;level++){
  t.getVariables().get('Path1Level').setNumber(path===0?level:0);t.getVariables().get('Path2Level').setNumber(path===1?level:0);N.apply(t);step(2);
  const name=u.objects['upgradeName'+path],desc=u.objects['description'+path],purchase=u.objects['purchase'+path];ok(name.getY()+name.getHeight()<=desc.getY()&&desc.getY()+desc.getHeight()<=purchase.getY(),'selected upgrade name / description / price do not overlap '+path+'-'+(level+1));
 }
 V.get('SelectedTower').setNumber(0);V.get('IndexOpen').setBoolean(true);const index=S.__unitIndex;index.category='Towers';index.select('NebulaBloomTower');step(3);
 ok(index.detail.id==='NebulaBloomTower'&&index.detail.sprite.getAnimationName()==='NB_Portrait'&&index.entries.length===2,'Index uses Nebula showcase and retains Star Cannon entry');
 ok(index.statValues.find(([k])=>k==='DAMAGE')[1]===50,'Index shows authoritative new base damage');
 for(let p=0;p<2;p++)for(let n=0;n<5;n++){const name=index.objects['upgradeName'+p+n],desc=index.objects['upgradeDesc'+p+n],cost=index.objects['upgradeCost'+p+n];ok(desc.getY()>=name.getY()+name.getHeight()&&cost.getY()>=desc.getY()+desc.getHeight(),'Index upgrade name / description / price do not overlap '+p+'-'+(n+1));ok(index.objects['starUpgrade'+p+n].getAnimationName()==='NB_'+(p===0?'Toxic':'Burst')+(n+1),'correct Nebula milestone symbol '+p+'-'+(n+1));}
 for(const a of index.artRects)ok(a.x>=a.frame.x-.01&&a.y>=a.frame.y-.01&&a.x+a.w<=a.frame.x+a.frame.w+.01&&a.y+a.h<=a.frame.y+a.frame.h+.01,'portrait alpha stays inside its frame');
 for(const v of index.measuredTexts)ok(v.object.getWidth()<=v.w+2,'wrapped archive text '+v.key);
 const dr=index.geometry.detail;ok(dr.x>=0&&dr.y>=0&&dr.x+dr.w<=W&&dr.y+dr.h<=H,'Index stays inside viewport');index.scroll=index.maxScroll;step(3);ok(index.objects.starRule.getY()+index.objects.starRule.getHeight()<=dr.y+dr.h,'last Nebula tier and locking rule reachable by scrolling');
 index.scroll=0;step(2);const count=Object.keys(index.objects).length,render=index.renderCount;step(30);ok(Object.keys(index.objects).length===count&&index.renderCount===render,'idle Index does not duplicate objects or redraw');
 const out={checks,window:[innerWidth,innerHeight],logical:[W,H],selected:r,portrait:'NB_Portrait',scroll:index.maxScroll,uiObjectCount:count};if(globalThis.BALANCE_MODE!=='index')V.get('IndexOpen').setBoolean(false);return out;
})()
