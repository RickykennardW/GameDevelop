// Called after actual page reload and full Chrome restart by balance-browser.py.
(()=>{
 const expected=globalThis.FUSION_PERSISTENCE_EXPECTATION,G=testGame,S=G.getSceneStack().getCurrentScene(),A=G.__fusionArchive,V=S.getVariables(),I=G.getInputManager(),checks=[];
 const ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);},step=(n=1)=>{for(let i=0;i<n;i++){S.renderAndStep(16.667);I.onFrameEnded();}};G.pause(true);step(3);
 ok(A.persistent&&A.storageOK&&A.has('StarburstCannon')&&A.hasVariant('StarburstCannon','pure_52_25'),'Fusion entry and canonical Pure variant restored');
 ok(A.stats.shown===0&&A.stats.unlockedVariants===0&&!A.queue.length&&!A.active,'loading known progress does not announce first discovery again');
 ok(JSON.stringify(S.__audio.settings)===JSON.stringify(expected.audioSettings)&&localStorage.getItem('celestialVoidFusionUnrelatedCheck')==='preserve','audio settings and unrelated storage survive');
 ok(A.state.metadata.keep===(expected.expectation==='migration'?'legacy':'current')&&JSON.stringify(A.state.entries.FutureFusion)===JSON.stringify(expected.unknown),'unknown saved entries and top-level metadata preserved');
 const h=A.state.entries.FutureHybrid;ok(h.variants.h2===true&&!h.variants.h0&&!h.variants.h1&&!h.variants.h3,'partial Hybrid save never unlocks remaining variants');
 if(expected.expectation==='migration')ok(A.has('LegacyUnknownFusion')&&A.state.entries.LegacyUnknownFusion.discovered,'legacy found list imported without erasing unknown progress');
 ok(S.__monsterDiscovery.scope==='session'&&!S.__monsterDiscovery.found.size,'existing fresh-session Monster discovery behavior retained');
 V.get('IndexOpen').setBoolean(true);step(2);const index=S.__unitIndex,r=index.tabRects.find(r=>r.name==='Fusion');
 I.onMouseMove(r.x+r.w/2,r.y+r.h/2);step();I.onMouseButtonPressed(0);step();I.onMouseButtonReleased(0);step(2);
 ok(index.category==='Fusion'&&index.entries.length===1&&!index.cards[0].locked&&index.cards[0].name.getString()==='Starburst Cannon'&&index.cards[0].sprite.getColor()==='255;255;255','Fusion Index actually opens with revealed original art/name');
 ok(index.objects.fusionRecipe0.getString()==='Star Cannon 5-2 + Star Cannon 2-5','canonical recipe still visible after loading');
 return{checks,storageOK:A.storageOK,discovered:[...A.found],variant:A.progress('StarburstCannon')};
})()
