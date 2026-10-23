// The driver changes real Chrome viewports; one scene and UI owner are reused.
(()=>{
 const G=testGame,S=G.getSceneStack().getCurrentScene(),I=G.getInputManager(),C=G.__campaign,U=S.__levelsUI,checks=[];G.pause(true);
 const step=(n=1)=>{for(let i=0;i<n;i++){G.getSceneStack().step(16.667);I.onFrameEnded();}},ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);};step(4);
 let fixture=S.__campaignResize;
 if(!fixture){fixture=S.__campaignResize={root:U.root,nodeCount:U.root.children.length,bgs:[...U.bg]};C.save.Completed=Object.fromEntries(C.config.Levels.map(l=>[l.Id,true]));}
 const {W,H,display}=U.screen();
 for(let chapter=1;chapter<=5;chapter++){
  U.chooseChapter(chapter);step(36);const b=U.bg[U.bgFront];ok(b.getAnimationName()==='Chapter'+chapter&&Math.abs(b.getWidth()/b.getHeight()-1280/720)<.001,'chapter background fits without stretch: '+chapter);
  ok(U.nodes.every((n,i)=>n.number.text===chapter+'-'+(i+1)&&n.container.x-n.style.r>=0&&n.container.x+n.style.r<=W&&n.container.y-n.style.r>=0&&n.container.y+n.style.r<H),'all five level pads remain bounded: '+chapter);
  for(const n of U.nodes){const before=[n.number.x,n.number.y,n.number.style.fontSize];I.onMouseMove(...S.getLayer('CampaignUI').convertInverseCoords(n.x,n.y,0,[0,0]));step(12);ok(before.join()=== [n.number.x,n.number.y,n.number.style.fontSize].join()&&n.number.anchor.x===.5,'hover never shifts hex label: '+n.levelId);}
  ok(U.nodes[4].boss.visible&&U.nodes[4].number.style.fontSize*display>=12.99,'boss label/number remain readable: '+chapter);
  ok(U.title.getBounds().bottom<U.tabs[0].rect.y&&U.tabs[0].rect.y+U.tabs[0].rect.h<U.chapterTitle.getBounds().y&&U.chapterTitle.getBounds().bottom<U.description.getBounds().y,'header, chapter tabs and text never overlap: '+chapter);
  ok(U.mission.getBounds().bottom<=U.details.getBounds().y&&U.launch.rect.y>=U.details.getBounds().bottom&&U.launch.rect.y+U.launch.rect.h<U.progress.getBounds().y,'mission details, launch and footer never overlap: '+chapter);
 }
 // All onboarding steps can still point at their actual resized targets.
 for(const stage of [0,1,2,3]){U.stage=stage;step(2);ok(U.coach.visible&&U.coachTitle.getBounds().x>=0&&U.coachTitle.getBounds().right<=W&&U.coachBody.getBounds().x>=0&&U.coachBody.getBounds().right<=W,'tutorial title/body stay inside viewport: '+stage);}
 U.stage=-1;step();ok(U.root===fixture.root&&U.root.children.length===fixture.nodeCount&&U.bg.every((b,i)=>b===fixture.bgs[i])&&S.getObjects('CampaignBackdrop').length===2,'all chapter switches/resize reuse UI and two backgrounds');
 const getW=gdjs.RuntimeGameRenderer.getWindowInnerWidth,getH=gdjs.RuntimeGameRenderer.getWindowInnerHeight;
 try{gdjs.RuntimeGameRenderer.getWindowInnerWidth=()=>0;gdjs.RuntimeGameRenderer.getWindowInnerHeight=()=>NaN;G.onWindowInnerSizeChanged();step(3);ok(G.getGameResolutionWidth()===W&&G.getGameResolutionHeight()===H,'invalid minimize-like viewport preserves last valid canvas');}finally{gdjs.RuntimeGameRenderer.getWindowInnerWidth=getW;gdjs.RuntimeGameRenderer.getWindowInnerHeight=getH;G.onWindowInnerSizeChanged();step();}
 return{checks,physical:[innerWidth,innerHeight],logical:[W,H],children:U.root.children.length,invalidSizeSimulation:true};
})()
