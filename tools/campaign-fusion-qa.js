// Existing Pure Fusion must remain economically attainable in late campaign.
(async()=>{
 const G=testGame,I=G.getInputManager(),C=G.__campaign,checks=[],wait=ms=>new Promise(r=>setTimeout(r,ms));let S=G.getSceneStack().getCurrentScene();G.pause(true);
 const step=(n=1)=>{for(let i=0;i<n;i++){G.getSceneStack().step(16.667);I.onFrameEnded();}},ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
 const click=(x,y,layer='')=>{I.onMouseMove(...S.getLayer(layer).convertInverseCoords(x,y,0,[0,0]));step();I.onMouseButtonPressed(0);step();I.onMouseButtonReleased(0);step();};step(3);
 C.save.Completed=Object.fromEntries(C.config.Levels.slice(0,-1).map(l=>[l.Id,true]));C.save.SelectTutorialDone=C.save.GameTutorialDone=true;const U=S.__levelsUI;U.stage=-1;U.chooseChapter(5);U.chooseLevel('5-5');step();click(U.launch.rect.x+U.launch.rect.w/2,U.launch.rect.y+U.launch.rect.h/2,'CampaignUI');
 for(let i=0;i<300;i++){step();if(G.getSceneStack().getCurrentScene()?.__campaignRun)break;await wait(5);}S=G.getSceneStack().getCurrentScene();step(4);const R=S.__campaignRun,V=S.getVariables(),F=S.__fusion,star=S.__starCannon;
 const funds=R.level.StartingGold+R.level.Waves.slice(0,-1).reduce((n,w)=>n+w.ExpectedGold,0);V.get('Money').setNumber(funds);
 const make=(a,b,x)=>{const card=S.__towerShopUI.cards[0].background;click(card.getCenterXInScene(),card.getCenterYInScene(),card.getLayer());click(x,352);const t=S.getObjects('StarCannonTower').at(-1);ok(!!t,'actual campaign shop buys source tower');for(let n=0;n<a;n++)ok(star.upgrade(t,1),'actual Path1 upgrade spends configured cost');for(let n=0;n<b;n++)ok(star.upgrade(t,2),'actual Path2 upgrade spends configured cost');return t;};
 const A=make(5,2,300),B=make(2,5,900),spent=funds-V.get('Money').getAsNumber();ok(spent===22490&&V.get('Money').getAsNumber()>0,'finite earned pre-boss budget can fund unchanged22,490Gold pair');ok(F.begin(A)&&F.choose(B)&&S.getTimeManager().getTimeScale()===.5,'existing Tactical Fusion works in campaign at0.5x');
 click(300,352);ok(S.getObjects('StarCannonTower').length===1&&star.isFusion(S.getObjects('StarCannonTower')[0])&&!F.active,'real regional placement consumes both sources into Starburst');ok(G.__fusionArchive.has('StarburstCannon')&&!C.save.Completed['5-5'],'Fusion discovery persists without granting mission victory');
 return{checks,mission:R.level.Id,finitePreBossFunds:funds,actualPairCost:spent,remainingGold:V.get('Money').getAsNumber(),recipesOrTowerStatsChanged:false,priorIncomeFixture:true};
})()
