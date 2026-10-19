(async()=>{
 const game=testGame,S=game.getSceneStack().getCurrentScene(),V=S.getVariables(),get=n=>S.getObjects(n),input=game.getInputManager(),checks=[];
 const ok=(value,label)=>{if(!value)throw Error(label);checks.push(label);},near=(a,b)=>Math.abs(a-b)<1e-4;
 const step=(n=1)=>{for(let i=0;i<n;i++){S.renderAndStep(16.667);input.onFrameEnded();}};
 const click=(x,y,layer='')=>{const l=S.getLayer(layer),point=l.convertInverseCoords(x,y,0,[0,0]);input.onMouseMove(...point);input.onMouseButtonPressed(0);step(2);input.onMouseButtonReleased(0);step(2);};
 const clickObject=o=>click(o.getX()+o.getWidth()/2,o.getY()+o.getHeight()/2,o.getLayer());
 game.pause(true);step(3);V.get('Money').setNumber(100000);
 const star=S.__starCannon,p=S.__freePlacement,shop=S.__towerShopUI,data=game.getSceneAndExtensionsData(S.getName()).sceneData;
 const definitions=Object.fromEntries(data.objects.map(o=>[o.name,o])),image=(name,animation)=>definitions[name].animations.find(a=>a.name===animation).directions[0].sprites[0].image;
 const portrait='assets/ui/star_cannon/StarCannon_UI_Portrait.png',config=JSON.stringify(V.get('StarCannonConfig').toJSObject()),worldArt=JSON.stringify(V.get('StarComponentConfig').toJSObject());
 ok(image('TileType_Button','StarCannonTower')===portrait,'shop/build uses dedicated angled portrait');
 ok(image('TilePlacement_Indicator','StarCannonTower').endsWith('/states/SC_0_0.png'),'placement ghost retains gameplay top-down sprite');
 ok(definitions.StarCannonTower.animations.every(a=>image('StarCannonTower',a.name).includes('/nova_spike/states/')),'all 27 world states retain original top-down art');
 ok(definitions.SelectedTowerPreview.animations.every(a=>image('SelectedTowerPreview',a.name).includes('/nova_spike/states/')),'selected tower identity preview retains actual upgrade state');
 const iconAnimations=definitions.StarUpgradeIcon.animations;
 ok(iconAnimations.length===12&&new Set(iconAnimations.map(a=>a.directions[0].sprites[0].image)).size===12,'two path symbols and ten distinct upgrade symbols');
 for(const a of iconAnimations){
  const file=a.directions[0].sprites[0].image,tex=game.getImageManager().getPIXITexture(file);
  ok(file.startsWith('assets/ui/star_cannon/')&&file.endsWith('.svg')&&tex.valid&&tex.width===128&&tex.height===128,'native symbolic icon loads: '+a.name);
 }
 const card=shop.cards[0],box=card.background;
 ok(shop.cards.length===1&&box.getWidth()===84&&box.getHeight()===112&&card.price.getString()==='300','one original small card /300 Gold');
 ok(near(card.icon.getCenterXInScene(),box.getX()+42)&&card.icon.getY()>card.name.getY()+card.name.getHeight()-9&&card.icon.getY()+card.icon.getHeight()<=card.price.getY()+1,'shop portrait centered between title and price');
 // Use the real build/purchase controls. No replacement purchasing code.
 const money=V.get('Money').getAsNumber();clickObject(box);click(300,352);
 const tower=get('StarCannonTower')[0];ok(!!tower&&V.get('Money').getAsNumber()===money-300,'real shop card builds Star Cannon for300');
 tower.__starCooldown=100000;V.get('SelectedTower').setNumber(tower.getVariables().get('TowerId').getAsNumber());step(3);
 const panel=S.__selectedPanel;
 const checkPanel=label=>{
  panel.cards.forEach((card,i)=>{
   const x=16+i*148,y=314,icon=card.icon,badge=panel.objects['pathBadge'+i],title=panel.objects['upgradeName'+i],description=panel.objects['description'+i],path=panel.objects['path'+i];
   ok(badge.getAnimationName()===(i?'PathSpeed':'PathDamage')&&image('StarUpgradeIcon',badge.getAnimationName()).endsWith('.svg'),'fixed damage/speed identity '+label+'/'+i);
   ok(image('StarUpgradeIcon',icon.getAnimationName()).endsWith('.svg')&&!icon.isHidden()&&icon.getWidth()===72&&near(icon.getCenterXInScene(),x+70),'large centered specific upgrade icon '+label+'/'+i);
   ok(badge.getX()+badge.getWidth()<path.getX()&&path.getY()+path.getHeight()<panel.objects['progress'+i+'_0'].getY(),'path label badge progress do not overlap '+label+'/'+i);
   ok(icon.getY()+icon.getHeight()<=title.getY()&&title.getY()+title.getHeight()<=description.getY()&&description.getY()+description.getHeight()<=y+222,'icon title description purchase do not overlap '+label+'/'+i);
  });
 };
 checkPanel('0-0');
 let before=V.get('Money').getAsNumber();clickObject(panel.cards[0].background);
 ok(tower.getVariables().get('Path1Level').getAsNumber()===1&&V.get('Money').getAsNumber()===before-160&&near(tower.getVariables().get('Damage').getAsNumber(),57.5),'real damage upgrade button preserves price/stat');checkPanel('1-0');
 before=V.get('Money').getAsNumber();clickObject(panel.cards[1].background);
 ok(tower.getVariables().get('Path2Level').getAsNumber()===1&&V.get('Money').getAsNumber()===before-130&&near(tower.getVariables().get('AttackInterval').getAsNumber(),.9/1.1),'real speed upgrade button preserves price/stat');checkPanel('1-1');
 // Display every next-upgrade icon, including locked and maximum-tier states.
 for(const [a,b]of [[2,0],[3,0],[4,0],[5,2],[0,2],[0,3],[0,4],[2,5]]){
  tower.getVariables().get('Path1Level').setNumber(a);tower.getVariables().get('Path2Level').setNumber(b);star.apply(tower);step(2);checkPanel(a+'-'+b);
 }
 V.get('IndexOpen').setBoolean(true);S.__unitIndex.category='Towers';step(3);
 ok(Object.keys(S.__unitIndex.objects).filter(k=>/^starUpgrade[01][0-4]$/.test(k)).every(k=>image('StarUpgradeIcon',S.__unitIndex.objects[k].getAnimationName()).endsWith('.svg')),'Index reuses the ten symbolic upgrade assets');
 V.get('IndexOpen').setBoolean(false);step(2);
 ok(config===JSON.stringify(V.get('StarCannonConfig').toJSObject())&&worldArt===JSON.stringify(V.get('StarComponentConfig').toJSObject()),'gameplay balancing and component/animation config unchanged');
 // Leave the production panel in a representative mixed-upgrade state.
 tower.getVariables().get('Path1Level').setNumber(2);tower.getVariables().get('Path2Level').setNumber(4);star.apply(tower);step(3);
 return {checks,viewport:[game.getGameResolutionWidth(),game.getGameResolutionHeight()],portrait,upgradeSymbols:iconAnimations.map(a=>({animation:a.name,file:a.directions[0].sprites[0].image})),shopCard:[box.getWidth(),box.getHeight()],panelRect:panel.screenRect};
})()
