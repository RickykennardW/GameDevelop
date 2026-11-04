// Runs in a newly launched browser process using the same isolated profile.
(async()=>{
 const G=testGame,I=G.getInputManager(),checks=[],expected=globalThis.FRESH_START_EXPECTATION,wait=ms=>new Promise(r=>setTimeout(r,ms));G.pause(true);let S=G.getSceneStack().getCurrentScene();
 const ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);},step=(n=1)=>{for(let i=0;i<n;i++){G.getSceneStack().step(16.667);I.onFrameEnded();}};
 step(5);ok(S.getName()==='MainMenu','application actually relaunched at intended MainMenu');
 const menu=S.__mainMenu,b=menu.buttons[0];I.onMouseMove(...S.getLayer('MenuUI').convertInverseCoords(b.x,b.y,0,[0,0]));I.onMouseButtonPressed(0);step(2);I.onMouseButtonReleased(0);step(25);
 for(let n=0;n<400;n++){step();if(G.getSceneStack().getCurrentScene()?.__levelsUI)break;await wait(5);}S=G.getSceneStack().getCurrentScene();step(4);
 const c=G.__campaign,reset=G.__freshStart;ok(S.getName()==='Levels'&&S.__levelsUI.stage===0&&c.frontier()===1&&!c.save.SelectTutorialDone&&!c.save.GameTutorialDone&&Object.keys(c.save.Completed).length===0,'after full process relaunch, Start opens first tutorial with no restored progress');
 ok(reset.keys.every(k=>localStorage.getItem(k)===null)&&localStorage.getItem(reset.intentKey)===null,'all old save/discovery keys remain cleared after relaunch');
 ok(localStorage.getItem(expected.audioKey)===JSON.stringify(expected.settings)&&Object.keys(expected.settings).every(k=>G.__celestialAudioSettings[k]===expected.settings[k])&&localStorage.getItem('freshStartUnrelatedCheck')==='keep-control-display-settings','audio and unrelated preferences survive full process relaunch');
 ok(reset.resets===(expected.pending?1:0),expected.pending?'interrupted reset automatically completes forward before save initialization':'completed reset is not unnecessarily performed again');
 return{checks,completedInterruptedReset:expected.pending};
})()
