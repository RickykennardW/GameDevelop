// Measure actual native glyph bounds through every hover/press frame.
(()=>{
 const G=testGame,S=G.getSceneStack().getCurrentScene(),I=G.getInputManager(),checks=[],baseline=globalThis.BALANCE_MODE==='baseline';G.pause(true);
 const step=(n=1)=>{for(let i=0;i<n;i++){G.getSceneStack().step(16.667);I.onFrameEnded();}};
 const ok=(value,label)=>{if(!value)throw Error(label);checks.push(label);};
 step(4);const lobby=!!S.__mainMenu,layer=lobby?'MenuUI':'GameOverUI';
 if(!lobby&&!S.__gameOverUI.active){S.getVariables().get('Lives').setNumber(0);I.onMouseButtonReleased(0);step(160);I.onMouseMove(10,10);I.onMouseButtonPressed(0);step();I.onMouseButtonReleased(0);step(60);}
 const owner=lobby?S.__mainMenu:S.__gameOverUI,buttons=owner.buttons;
 const move=(x,y)=>I.onMouseMove(...S.getLayer(layer).convertInverseCoords(x,y,0,[0,0]));
 const measure=b=>{const p=b.label.getRendererObject(),r=p.getBounds();return{x:r.x+r.width/2,y:r.y+r.height/2,w:r.width,h:r.height,labelX:b.label.getX(),labelY:b.label.getY(),scale:b.label.getScaleX(),frameScale:b.scale,highlight:b.frame.getAnimationName()};};
 const results=[];move(0,0);step(90);
 for(const b of buttons){
  const normal=measure(b),samples=[];let maxShift=0,maxCenterError=0,maxSizeChange=0;
  const sample=state=>{const m=measure(b),target=S.getLayer(layer).convertInverseCoords(b.x,b.y,0,[0,0]);maxShift=Math.max(maxShift,Math.hypot(m.x-normal.x,m.y-normal.y));maxCenterError=Math.max(maxCenterError,Math.hypot(m.x-target[0],m.y-target[1]));maxSizeChange=Math.max(maxSizeChange,Math.abs(m.w-normal.w),Math.abs(m.h-normal.h));return{state,...m};};
  const frames=(n,state)=>{for(let i=0;i<n;i++){step();sample(state);}samples.push(sample(state));};
  samples.push(sample('outside'));move(b.x,b.y);frames(1,'entering');frames(65,'hover');
  ok(b.scale>=1.05&&b.scale<=1.0601&&b.frame.getAnimationName()==='Hover','background hover enlargement/glow retained: '+b.id);
  I.onMouseButtonPressed(0);frames(12,'pressed');move(0,0);frames(1,'leaving-pressed');I.onMouseButtonReleased(0);frames(65,'outside-after-release');
  for(let cycle=0;cycle<12;cycle++){move(b.x,b.y);frames(20,'repeat-enter');move(0,0);frames(20,'repeat-leave');}frames(70,'restored');
  ok(Math.abs(b.scale-1)<.000001&&b.frame.getAnimationName()==='Normal','repeated hover restores frame without triggering click: '+b.id);
  ok(lobby?!owner.transition&&owner.exitAttempts===0:owner.phase==='MENU'&&!owner.leaving,'press/release outside does not trigger action: '+b.id);
  if(!baseline){ok(maxShift<.02,'glyph center stays fixed through every interaction frame: '+b.id);ok(maxCenterError<.02,'glyphs remain centered on button X/Y: '+b.id);ok(maxSizeChange<.02,'text dimensions remain constant during hover/press: '+b.id);}
  results.push({button:b.id,maxShift,maxCenterError,maxSizeChange,states:samples.slice(0,7),last:sample('last')});
 }
 return{checks,scene:S.getName(),physical:[innerWidth,innerHeight],logical:[G.getGameResolutionWidth(),G.getGameResolutionHeight()],baseline,results};
})()
