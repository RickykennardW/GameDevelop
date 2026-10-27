// Campaign entry and developer session Gold, using the actual native scene transitions.
(async()=>{
 const G=testGame,I=G.getInputManager(),checks=[];let S=G.getSceneStack().getCurrentScene();G.pause(true);
 const ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);},step=(n=1)=>{for(let i=0;i<n;i++){G.getSceneStack().step(16.667);I.onFrameEnded();}},wait=ms=>new Promise(r=>setTimeout(r,ms));
 const click=(x,y,layer='CampaignUI')=>{I.onMouseMove(...S.getLayer(layer).convertInverseCoords(x,y,0,[0,0]));step(2);I.onMouseButtonPressed(0);step(2);I.onMouseButtonReleased(0);step(2);},btn=b=>click(b.rect.x+b.rect.w/2,b.rect.y+b.rect.h/2);
 step(4);const C=G.__campaign,U=S.__levelsUI;btn(U.skip);U.chooseLevel('1-1');step();btn(U.launch);for(let i=0;i<300&&!G.getSceneStack().getCurrentScene()?.__campaignRun;i++){step();await wait(5);}S=G.getSceneStack().getCurrentScene();step(4);let V=S.getVariables(),d=S.__devCheats;
 ok(S.getName()==='Game Scene'&&S.__campaignRun.level.Id==='1-1'&&V.get('Money').getAsNumber()===600,'real Levels launch keeps configured1-1 opening600Gold');
 ok(d.enabled()&&!d.root.visible&&!d.addGold(1000)&&V.get('Money').getAsNumber()===600,'onboarding modal hides and guards DEV / no tutorial Gold grant');
 btn(S.__campaignRun.skip);step(2);ok(C.save.GameTutorialDone&&d.root.visible&&!d.open,'normal Skip Tutorial releases DEV without changing unlocks');
 const r=d.g.button;click(r.x+r.w/2,r.y+r.h/2,'DeveloperUI');const b=d.presets[0],p=d.g.panel,u=d.g.unit;click(p.x+(b.r.x+b.r.w/2)*u,p.y+(48+b.r.y+b.r.h/2)*u,'DeveloperUI');
 ok(V.get('Money').getAsNumber()===1600&&S.getObjects('MoneyText')[0].getString()==='1600','actual campaign DEV preset adds1000 to current mission Gold');
 ok(!Object.keys(C.save.Completed).length&&!C.available('1-2'),'funding does not grant completion / level unlock / boss proof');
 const input=d.input,oldRoot=d.root;await wait(250);S=G.getSceneStack().replace('Game Scene');step(4);V=S.getVariables();
 ok(oldRoot.destroyed&&!input.isConnected&&!document.querySelector('[data-celestial-dev-input]'),'campaign Restart disposes overlay and input');
 ok(S.__campaignRun.level.Id==='1-1'&&V.get('Money').getAsNumber()===600&&!Object.keys(C.save.Completed).length,'Restart restores same mission opening / DEV funds are not persistent currency');
 return{checks,mission:'1-1',openingGold:600,cheatSessionOnly:true,unlocksUnchanged:true};
})()
