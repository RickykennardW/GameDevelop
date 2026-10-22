// Re-run in one native game while the browser driver changes its actual viewport.
(async()=>{
 const G=testGame,I=G.getInputManager(),S=G.getSceneStack().getCurrentScene(),checks=[];G.pause(true);
 const ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);},near=(a,b,t=.1)=>Math.abs(a-b)<t;
 const step=(n=1)=>{for(let i=0;i<n;i++){G.getSceneStack().step(16.667);I.onFrameEnded();}};
 const V=S.getVariables();step(3);
 if(!S.__gameOverResizeFixture){
  // Keep accelerated layout assertions from unloading audio before its native
  // asynchronous decoder can finish (normal animation frames yield naturally).
  await new Promise(r=>setTimeout(r,350));
  V.get('Lives').setNumber(0);I.onMouseButtonReleased(0);step();
  await new Promise(r=>setTimeout(r,350));step(160);const go=S.__gameOverUI;
  ok(go.phase==='AWAIT_CONTINUE','defeat animation finishes while world is inactive');
  // Touch simulates the same primary input as the native mobile runtime.
  I.onTouchStart(91,20,20);step();I.onTouchEnd(91);step(60);
  ok(go.phase==='MENU'&&go.continues===1,'native touch continues exactly once');
  S.__gameOverResizeFixture={go,root:go.root,nodes:go.root.children.length,buttons:go.buttons.map(b=>b.frame),money:V.get('Money').getAsNumber(),wave:V.get('Wave').getAsNumber()};
 }
 const f=S.__gameOverResizeFixture,go=f.go;I.onMouseMove(0,0);step(45);
 const W=G.getGameResolutionWidth(),H=G.getGameResolutionHeight(),canvas=G.getRenderer().getCanvas().getBoundingClientRect(),display=canvas.width/W;
 ok(near(go.title.x,W/2)&&go.title.y<H/2&&go.title.y>0,'title stays centered inside actual viewport');
 ok(near(go.overlay.width,W)&&near(go.overlay.height,H),'single overlay covers actual logical viewport');
 for(const b of go.buttons){const r=b.rect;ok(near(b.x,W/2)&&r.x>=0&&r.y>=0&&r.x+r.w<=W&&r.y+r.h<=H,'button centered and bounded: '+b.id);ok(near(b.scale,1,.0001)&&near(b.frame.getScaleX(),b.frame.getScaleY(),.00001),'base size and artwork aspect ratio stable: '+b.id);ok(b.label.getCharacterSize()*b.label.getScaleX()*display>=(b.id==='Restart'?11.99:10.99),'physical text remains readable: '+b.id);}
 ok(go.buttons[0].rect.y+go.buttons[0].rect.h<go.buttons[1].rect.y,'menu buttons never overlap');
 ok(go.root===f.root&&go.root.children.length===f.nodes&&go.buttons.every((b,i)=>b.frame===f.buttons[i])&&S.getObjects('DefeatRestart').length===1&&S.getObjects('DefeatMainMenu').length===1,'resize reuses one overlay and one button pair');
 const count=go.layoutCount;step(10);ok(go.layoutCount===count,'unchanged viewport does not rebuild geometry');
 const width=gdjs.RuntimeGameRenderer.getWindowInnerWidth,height=gdjs.RuntimeGameRenderer.getWindowInnerHeight;
 try{for(const bad of [0,NaN]){gdjs.RuntimeGameRenderer.getWindowInnerWidth=()=>bad;gdjs.RuntimeGameRenderer.getWindowInnerHeight=()=>bad;G.onWindowInnerSizeChanged();step(3);ok(G.getGameResolutionWidth()===W&&G.getGameResolutionHeight()===H&&go.layoutCount===count,'invalid viewport retains last layout: '+String(bad));}}finally{gdjs.RuntimeGameRenderer.getWindowInnerWidth=width;gdjs.RuntimeGameRenderer.getWindowInnerHeight=height;G.onWindowInnerSizeChanged();step(3);}
 ok(V.get('Money').getAsNumber()===f.money&&V.get('Wave').getAsNumber()===f.wave&&S.getLayer('').getTimeScale()===0&&go.activations===1,'resize never advances gameplay or retriggers defeat');
 return{checks,physical:[innerWidth,innerHeight],logical:[W,H],layoutCount:go.layoutCount,buttons:go.buttons.map(b=>b.rect),invalidSizeSimulation:true};
})()
