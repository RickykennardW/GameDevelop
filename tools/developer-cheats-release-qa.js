// Real RuntimeGame construction uses isPreview:false in the compiled validation page.
(()=>{
 const G=testGame,S=G.getSceneStack().getCurrentScene(),V=S.getVariables(),I=G.getInputManager(),checks=[];G.pause(true);
 const ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);},step=(n=1)=>{for(let i=0;i<n;i++){S.renderAndStep(16.667);I.onFrameEnded();}},click=(x,y,l='')=>{I.onMouseMove(...S.getLayer(l).convertInverseCoords(x,y,0,[0,0]));step(2);I.onMouseButtonPressed(0);step(2);I.onMouseButtonReleased(0);step(2);};
 step(4);ok(G.isPreview()===false&&V.get('DEV_CHEATS_ENABLED').getAsBoolean(),'actual non-preview RuntimeGame constructed with authored DEV flag still true');
 ok(!S.__devCheats&&!document.querySelector('[data-celestial-dev-input]'),'non-preview mode never creates controller, cheat UI or custom input');
 const before=V.get('Money').getAsNumber();step(120);ok(V.get('Money').getAsNumber()===before&&before===50000&&!V.get('DevUIConsumesClick').getAsBoolean(),'release idle cannot grant Gold or consume ordinary input');
 const card=S.__towerShopUI.cards[0].background;click(card.getCenterXInScene(),card.getCenterYInScene(),card.getLayer());click(300,352);const t=S.getObjects('StarCannonTower')[0];ok(t&&V.get('Money').getAsNumber()===before-300,'normal Tower purchase remains valid in non-preview mode');
 ok(S.__starCannon.upgrade(t,1)&&t.getVariables().get('Path1Level').getAsNumber()===1&&V.get('Money').getAsNumber()===before-460,'normal upgrade / price / statistics unaffected in release mode');
 ok(!S.__devCheats&&document.querySelectorAll('[data-celestial-dev-input]').length===0,'ordinary gameplay does not lazily expose a release cheat action');
 return{checks,nativeRuntimeOptions:{isPreview:G.isPreview()},configuredDeveloperFlag:true,cheatControllerAbsent:true};
})()
