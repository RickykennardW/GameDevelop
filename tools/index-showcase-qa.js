// Exercise the actual exported GDevelop scene; profile/fixtures are isolated from player saves.
(async()=>{
 const G=testGame,S=G.getSceneStack().getCurrentScene(),V=S.getVariables(),I=G.getInputManager(),checks=[];
 const ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);},step=(n=1)=>{for(let i=0;i<n;i++){S.renderAndStep(16.667);I.onFrameEnded();}};
 const click=(r,layer='IndexUI')=>{I.onMouseMove(...S.getLayer(layer).convertInverseCoords(r.x+r.w/2,r.y+r.h/2,0,[0,0]));step(2);I.onMouseButtonPressed(0);step(2);I.onMouseButtonReleased(0);step(3);};
 G.pause(true);step(3);const index=S.__unitIndex,archive=G.__fusionArchive,D=S.__monsterDiscovery;
 const config=JSON.stringify(V.get('StarCannonConfig').toJSObject()),money=V.get('Money').getAsNumber(),found=[...archive.found];
 V.get('IndexOpen').setBoolean(true);step(3);
 const tab=name=>{click(index.tabRects.find(r=>r.name===name));ok(index.category===name,'native '+name+' navigation');};
 ok(index.categories.join('|')==='Towers|Monsters|Fusion'&&S.getLayer('IndexDetail').isVisible(),'three categories and dedicated detail layer');
 ok(index.entries.length===1&&index.detail.id==='StarCannonTower'&&index.detail.sprite.getAnimationName()==='StarCannon_IndexPortrait','Tower detail uses dedicated showcase portrait');
 ok(index.cards[0].sprite.getName()==='IndexShowcase'&&index.cards[0].sprite.getAnimationName()==='StarCannon_IndexPortrait','collection thumbnail also uses showcase artwork');
 ok(index.statValues.find(([k])=>k==='DAMAGE')[1]===50&&index.statValues.find(([k])=>k==='RANGE')[1]==='210 px'&&index.statValues.find(([k])=>k==='INTERVAL')[1]==='0.90 s','base stats read from live authoritative config');
 ok(Object.keys(index.objects).filter(k=>/^starUpgrade[01][0-4]$/.test(k)).length===10,'all ten upgrade tiers and existing icons retained');
 for(let p=0;p<2;p++)for(let n=0;n<5;n++){const name=index.objects['upgradeName'+p+n],desc=index.objects['upgradeDesc'+p+n],cost=index.objects['upgradeCost'+p+n];ok(desc.getY()>=name.getY()+name.getHeight()&&cost.getY()>=desc.getY()+desc.getHeight(),'upgrade name/description/cost do not overlap '+p+'-'+n);}
 const checkArt=()=>{for(const r of index.artRects)ok(r.x>=r.frame.x-.01&&r.y>=r.frame.y-.01&&r.x+r.w<=r.frame.x+r.frame.w+.01&&r.y+r.h<=r.frame.y+r.frame.h+.01,'portrait alpha bounds contained '+r.id);};checkArt();
 ok(index.geometry.detail.x>=0&&index.geometry.detail.x+index.geometry.detail.w<=G.getGameResolutionWidth()&&index.geometry.detail.y+index.geometry.detail.h<=G.getGameResolutionHeight(),'responsive panels remain inside viewport');
 for(const t of index.measuredTexts)ok(t.object.getWidth()<=t.w+2,'text respects wrapping width '+t.key);
 const counts={objects:Object.keys(index.objects).length,ui:index.graphics.IndexUI.parent.children.length,detail:index.graphics.IndexDetail.parent.children.length};const renders=index.renderCount;step(120);
 ok(index.renderCount===renders&&Object.keys(index.objects).length===counts.objects&&index.graphics.IndexUI.parent.children.length===counts.ui&&index.graphics.IndexDetail.parent.children.length===counts.detail,'idle Index caches rendering and creates no repeated UI objects');
 const originalScroll=index.collectionScroll;const dr=index.geometry.detail;I.onMouseMove(dr.x+dr.w/2,dr.y+dr.h/2);I.onMouseWheel(-120);step(2);ok(index.scroll>0&&index.collectionScroll===originalScroll,'actual detail wheel scroll independent from collection');index.scroll=index.maxScroll;step(2);
 ok(index.objects.starRule.getY()+index.objects.starRule.getHeight()<=index.geometry.detail.y+index.geometry.detail.h,'final tier/rule reachable at bottom of detail scroll');index.scroll=0;step(2);
 if(globalThis.BALANCE_MODE==='tower')return{checks,viewport:[G.getGameResolutionWidth(),G.getGameResolutionHeight()],layout:index.geometry};
 tab('Fusion');ok(index.cards.length===1&&index.detail.locked&&index.detail.name.getString()==='???','undiscovered Fusion detail remains sealed');
 ok(index.detail.sprite.getAnimationName()==='StarburstCannon_IndexPortrait'&&index.detail.sprite.getColor()==='0;0;0','Fusion silhouette is actual new 3/4 portrait');
 ok(!index.statValues.length&&index.objects.fusionRecipe0.getString()==='Combination locked'&&index.detail.description.getString().includes('CRYPTIC HINT'),'locked recipe/skills/stats remain hidden while hint visible');checkArt();
 ok(JSON.stringify([...archive.found])===JSON.stringify(found),'opening and selecting Index never unlocks discovery');
 if(globalThis.BALANCE_MODE==='locked')return{checks,viewport:[G.getGameResolutionWidth(),G.getGameResolutionHeight()]};
 tab('Monsters');ok(index.cards.length===6&&index.monsterCards.length===7,'six original monster thumbnails and one selected large portrait');
 const cr=index.geometry.collection,ds=index.scroll;I.onMouseMove(cr.x+cr.w/2,cr.y+cr.h/2);I.onMouseWheel(-120);step(2);ok(index.collectionScroll>0&&index.scroll===ds,'actual collection wheel scroll independent from detail');
 index.collectionScroll=0;step(2);click(index.cardRects[1]);ok(index.detail.id==='VoidHound','actual thumbnail click selects and updates detail');
 for(let n=0;n<6;n++){index.select(D.ids[n]);step(2);const d=index.detail,o=d.sprite,sprite=o.__archivePortrait.sprite,texture=D.texture(D.ids[n]);ok(d.locked&&sprite.texture===texture&&sprite.tint===0&&!d.statValues.length,'existing single-frame monster silhouette/data retained '+D.ids[n]);}
 // Discover via actual native wave spawn hook, not an Index unlock shortcut.
 V.get('IndexOpen').setBoolean(false);V.get('Wave').setNumber(12);V.get('WaveActive').setBoolean(true);V.get('WaveMode').setString('Manual');const wave=S.__waveManager;wave.queue=D.ids.slice();wave.index=0;wave.elapsed=V.get('SpawnInterval').getAsNumber()*10;V.get('EnemiesToSpawn').setNumber(6);step(3);
 V.get('IndexOpen').setBoolean(true);index.category='Monsters';index.select('VoidGolem');step(3);
 const noticeAge=D.active?.age,noticeQueue=D.queue.length;step(30);ok(!D.root.visible&&D.active?.age===noticeAge&&D.queue.length===noticeQueue,'Monster announcements wait without overlap or loss while Index is open');
 ok(!index.detail.locked&&index.detail.name.getString()==='Void Golem'&&index.statValues.find(([k])=>k==='HP')[1]===480,'real encounter reveals correct monster portrait/name/stats');
 ok(index.objects.golemSkill.getString().includes('Void Fortification')&&index.objects.golemSkill.getString().includes('+10 armor'),'elite ability reads existing skill config');
 if(globalThis.BALANCE_MODE==='monster')return{checks,viewport:[G.getGameResolutionWidth(),G.getGameResolutionHeight()]};
 tab('Fusion');
 // Successful transaction is covered end-to-end by fusion-fixes-qa; this isolates UI reveal.
 archive.discover('StarburstCannon','pure_52_25');step(3);
 ok(!index.detail.locked&&index.detail.name.getString()==='Starburst Cannon'&&index.detail.sprite.getColor()==='255;255;255','shared discovery revision reveals showcase without restarting Index');
 ok(index.objects.fusionRecipe0.getString()==='Star Cannon 5-2 + Star Cannon 2-5'&&index.statValues.find(([k])=>k==='DAMAGE')[1]===90,'known recipe and real Fusion stats shown');checkArt();
 const count=Object.keys(index.objects).length;for(let n=0;n<4;n++){tab('Towers');tab('Monsters');tab('Fusion');}
 ok(Object.keys(index.objects).length===count,'category switching reuses existing native UI objects');
 ok(JSON.stringify(V.get('StarCannonConfig').toJSObject())===config&&V.get('Money').getAsNumber()===money,'Index changes no tower stats or Gold');
 ok(S.getObjects('StarCannonTower').length===0&&S.getObjects('StarCannonProjectile').length===0,'Index portraits do not instantiate gameplay towers/projectiles');
 if(globalThis.BALANCE_MODE==='fusion')return{checks,viewport:[G.getGameResolutionWidth(),G.getGameResolutionHeight()]};
 const close=index.closeRect;click(close);ok(!V.get('IndexOpen').getAsBoolean()&&!S.getLayer('IndexUI').isVisible()&&!S.getLayer('IndexDetail').isVisible(),'close X hides both panels and all Index layers');
 V.get('IndexOpen').setBoolean(true);step(2);I.onKeyPressed(27);step();I.onKeyReleased(27);step(2);ok(!V.get('IndexOpen').getAsBoolean(),'Escape closes responsive Index');
 V.get('IndexOpen').setBoolean(true);index.category='Towers';index.select('StarCannonTower');step(2);
 return{checks,viewport:[G.getGameResolutionWidth(),G.getGameResolutionHeight()],layout:index.geometry,artwork:index.artRects.map(r=>({id:r.id,w:r.w,h:r.h})),note:'UI-only fixture uses one discovery API call; actual Fusion transaction/persistence tested separately.'};
})()
