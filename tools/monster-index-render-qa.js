// Validate actual GPU output and live transforms, not only cached tint properties.
(async()=>{
 const G=testGame,S=G.getSceneStack().getCurrentScene(),V=S.getVariables(),I=G.getInputManager(),D=S.__monsterDiscovery,checks=[],observed=[];
 const ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);},step=(n=1)=>{for(let i=0;i<n;i++){S.renderAndStep(16.667);I.onFrameEnded();}};
 const move=r=>{I.onMouseMove(r.x+r.w/2,r.y+r.h/2);step(2);},click=r=>{move(r);I.onMouseButtonPressed(0);step(2);I.onMouseButtonReleased(0);step(2);};
 G.pause(true);step(3);const index=S.__unitIndex;V.get('IndexOpen').setBoolean(true);index.category='Monsters';step(3);
 const pixels=sprite=>{const renderer=G.getRenderer().getPIXIRenderer(),extract=renderer.extract||renderer.plugins.extract,p=extract.pixels(sprite);let colored=0,opaque=0;for(let n=0;n<p.length;n+=4)if(p[n+3]>24){opaque++;if(p[n]>5||p[n+1]>5||p[n+2]>5)colored++;}return{colored,opaque};};
 const measure=()=>index.monsterCards.map(({sprite:o})=>{const p=o.__discoveryPortrait,s=o.__archivePortrait?.sprite||o.getRendererObject(),meta=D.portraits[p.id],bounds=meta.VisualBounds;return{id:p.id,layer:o.getLayer(),native:[o.getWidth(),o.getHeight()],tint:s.tint,scale:[s.scale.x,s.scale.y],visible:s.visible,frame:p,visual:{x:s.position.x+(bounds[0]-s.anchor.x*s.texture.width)*s.scale.x,y:s.position.y+(bounds[1]-s.anchor.y*s.texture.height)*s.scale.y,w:bounds[2]*s.scale.x,h:bounds[3]*s.scale.y},pixels:pixels(o.__archivePortrait?.root||s),legacyRig:!!o.__golemPortraitRig?.visible};});
 if(globalThis.BALANCE_MODE==='before'){
  for(const id of ['VoidHound','VoidGolem','Basic','VoidGuard','VoidHound']){index.select(id);step(3);move(index.cardRects[2]);observed.push({selected:id,portraits:measure()});}
  return{observed,found:[...D.found],outlines:D.outlines.size};
 }
 ok(D.found.size===0,'fresh profile has zero discovered monsters');
 const audit=label=>{
  const items=measure();ok(items.length===7,label+': six thumbnails and one detail portrait');
  for(const r of items){const f=r.frame,b=r.visual;ok(!r.legacyRig,label+': no competing legacy portrait '+r.id);ok(b.w<=f.w+.1&&b.h<=f.h+.1&&b.x>=f.x-f.w/2-.1&&b.y>=f.y-f.h/2-.1&&b.x+b.w<=f.x+f.w/2+.1&&b.y+b.h<=f.y+f.h/2+.1,label+': visual alpha bounds fit '+r.id);if(!D.has(r.id))ok(r.pixels.opaque>0&&r.pixels.colored===0,label+': GPU output is black-only for locked '+r.id);else ok(r.pixels.colored>0,label+': GPU output restored for discovered '+r.id);}
  return items;
 };
 audit('initial');
 const collectionCount=S.getObjects('IndexMonsterImage').length;
 const children=()=>['IndexList','IndexDetail'].map(n=>S.getLayer(n).getRenderer().getRendererObject().children.length).join(':');const initialChildren=children();
 for(let n=0;n<24;n++){
  index.collectionScroll=index.collectionMaxScroll*(n%6)/5;step();const r=index.cardRects[n%6],previous=index.detail.id;move(r);ok(D.found.size===0&&index.detail.id===previous,'hover changes no discovery or selection '+n);
  click(r);ok(index.detail.id===D.ids[n%6],'actual card click selects '+D.ids[n%6]);audit('selection '+n);
 }
 ok(S.getObjects('IndexMonsterImage').length===collectionCount&&children()===initialChildren,'24 hover/selection changes keep object and render-child counts stable');
 const area=index.geometry.collection;for(const delta of [-120,-120,120,120]){I.onMouseMove(area.x+area.w/2,area.y+area.h/2);I.onMouseWheel(delta);step(2);audit('scroll '+delta);}
 ok(S.getLayer('IndexList').getRenderer().getRendererObject().mask===index.masks.IndexList&&S.getLayer('IndexDetail').getRenderer().getRendererObject().mask===index.masks.IndexDetail,'collection and detail retain separate clipping masks');
 for(const name of ['Towers','Fusion','Monsters','Towers','Monsters']){
  click(index.tabRects.find(r=>r.name===name));ok(index.category===name,'actual '+name+' tab navigation');
  if(name!=='Monsters')ok(S.getObjects('IndexMonsterImage').every(o=>o.isHidden())&&[...D.indexPortraits.values()].every(p=>!p.root.visible)&&D.outlines.size===0,'no monster visuals left in '+name);
 }
 const reopenChildren=children();for(let n=0;n<8;n++){click(index.closeRect);ok(!V.get('IndexOpen').getAsBoolean()&&[...D.indexPortraits.values()].every(p=>!p.root.visible),'close hides portrait extras '+n);V.get('IndexOpen').setBoolean(true);step(2);audit('reopen '+n);}
 ok(S.getObjects('IndexMonsterImage').length===collectionCount&&children()===reopenChildren&&D.indexPortraits.size===7&&D.outlines.size===0,'reopen cycle does not grow portrait cache or retain shadow copies');
 // Use the original encounter path; rendering and hover never write discovery.
 V.get('IndexOpen').setBoolean(false);V.get('Wave').setNumber(12);V.get('WaveActive').setBoolean(true);V.get('WaveMode').setString('Manual');const wave=S.__waveManager;wave.queue=['Basic','VoidHound','VoidGolem'];wave.index=0;wave.elapsed=V.get('SpawnInterval').getAsNumber()*4;V.get('EnemiesToSpawn').setNumber(3);step(3);
 V.get('IndexOpen').setBoolean(true);index.category='Monsters';index.select('VoidGolem');step(2);audit('real encounter');
 ok(D.has('Basic')&&D.has('VoidHound')&&D.has('VoidGolem')&&!D.has('VoidGuard'),'only actually encountered monsters discovered');
 ok(index.detail.name.getString()==='Void Golem'&&index.detail.statValues.some(([k,v])=>k==='HP'&&v===480),'selected discovered name/stats match encounter state');
 if(globalThis.BALANCE_MODE==='locked'){D.resetForNewGame();step(2);index.select('VoidHound');step(2);audit('session reset');}
 return{checks,found:[...D.found],portraits:measure(),objects:S.getObjects('IndexMonsterImage').length,outlines:D.outlines.size,viewport:[G.getGameResolutionWidth(),G.getGameResolutionHeight()]};
})()
