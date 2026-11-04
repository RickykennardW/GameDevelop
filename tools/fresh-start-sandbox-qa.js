// Direct gameplay preview has no campaign owner until Fresh Start enters Levels.
(async()=>{
 const G=testGame,I=G.getInputManager(),checks=[],wait=ms=>new Promise(r=>setTimeout(r,ms));let S=G.getSceneStack().getCurrentScene();G.pause(true);
 const step=(n=1)=>{for(let i=0;i<n;i++){G.getSceneStack().step(16.667);I.onFrameEnded();}},ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);},click=(x,y,layer)=>{I.onMouseMove(...S.getLayer(layer).convertInverseCoords(x,y,0,[0,0]));step();I.onMouseButtonPressed(0);step(2);I.onMouseButtonReleased(0);step(2);};
 step(5);ok(!G.__campaign&&S.__devCheats.enabled(),'direct gameplay preview starts without a campaign owner');
 const p=S.__freePlacement,card=S.__towerShopUI.cards[0].background;click(card.getCenterXInScene(),card.getCenterYInScene(),card.getLayer());click(300,352,'');const tower=S.getObjects('StarCannonTower')[0];ok(!!tower&&S.getVariables().get('Money').getAsNumber()===49700,'real paid tower exists before reset');
 const d=S.__devCheats;let b=d.g.button;click(b.x+b.w/2,b.y+b.h/2,'DeveloperUI');d.scroll=d.maxScroll;d.layout();b=d.fresh.r;click(d.g.panel.x+(b.x+b.w/2)*d.g.unit,d.g.panel.y+(48-d.scroll+b.y+b.h/2)*d.g.unit,'DeveloperUI');ok(d.confirming,'direct preview Fresh Start is confirmed separately');
 // A disabled cached action cannot erase progress even with a dialog open.
 const before=G.__freshStart.resets;S.getVariables().get('DEV_CHEATS_ENABLED').setBoolean(false);ok(!d.freshStart()&&G.__freshStart.resets===before,'disabled development gate blocks cached destructive action');S.getVariables().get('DEV_CHEATS_ENABLED').setBoolean(true);
 b=d.confirmReset.r;click((b.x+b.w/2)*d.g.unit,(b.y+b.h/2)*d.g.unit,'DeveloperUI');
 for(let n=0;n<400;n++){step();if(G.getSceneStack().getCurrentScene()?.__levelsUI)break;await wait(5);}S=G.getSceneStack().getCurrentScene();step(4);
 ok(S.getName()==='Levels'&&S.__levelsUI.stage===0&&G.__campaign.frontier()===1&&!G.__campaign.save.GameTutorialDone,'direct sandbox reset initializes the real first-time campaign/tutorial');
 ok(d.disposed&&d.root.destroyed&&!d.input.isConnected&&!S.getObjects('StarCannonTower').includes(tower),'native replacement unloads paid tower and cheat UI');
 ok(!p.active&&!G.__celestialMonsterDiscoverySession.found.size&&!G.__fusionArchive.found.size,'placement and discoveries cannot leak into a fresh campaign');
 return{checks};
})()
