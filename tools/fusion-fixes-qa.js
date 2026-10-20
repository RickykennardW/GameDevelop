// Native scene fixture in an isolated browser profile; no live player save is touched.
(async()=>{
 const G=testGame,S=G.getSceneStack().getCurrentScene(),V=S.getVariables(),I=G.getInputManager(),checks=[];
 const ok=(value,label)=>{if(!value)throw Error(label);checks.push(label);};
 const step=(n=1)=>{for(let i=0;i<n;i++){S.renderAndStep(16.667);I.onFrameEnded();}},near=(a,b)=>Math.abs(a-b)<.0001;
 const move=(x,y,layer='')=>{I.onMouseMove(...S.getLayer(layer).convertInverseCoords(x,y,0,[0,0]));step(2);};
 const click=(x,y,layer='')=>{move(x,y,layer);I.onMouseButtonPressed(0);step(2);I.onMouseButtonReleased(0);step(2);};
 const get=n=>S.getObjects(n);G.pause(true);step(4);
 const F=S.__fusion,A=G.__fusionArchive,P=S.__freePlacement,star=S.__starCannon,N=S.__fusionDiscovery,index=S.__unitIndex;
 const audioSettings={...S.__audio.settings};localStorage.setItem('celestialVoidFusionUnrelatedCheck','preserve');
 // Existing valid legacy records and unknown future records must survive migration.
 const unknown={discovered:true,variants:{future_variant:true},extra:'keep'};
 if(globalThis.BALANCE_MODE==='migration'){
  localStorage.setItem(A.storageKey,JSON.stringify({version:1,metadata:{keep:'legacy'},entries:{StarburstCannon:true,FutureFusion:unknown,FutureHybrid:{discovered:true,variants:{h2:true}}},found:['LegacyUnknownFusion']}));
  return{checks:['seeded valid older discovery records in isolated profile'],audioSettings,expectation:'migration',unknown};
 }
 ok(A.persistent&&A.catalog.length===1&&!A.has('StarburstCannon'),'fresh Fusion archive starts undiscovered');
 const open=()=>{V.get('IndexOpen').setBoolean(true);step(3);};
 const close=()=>{V.get('IndexOpen').setBoolean(false);step(3);};
 const tab=name=>{const r=index.tabRects.find(r=>r.name===name);click(r.x+r.w/2,r.y+r.h/2,'IndexUI');ok(index.category===name,'actual '+name+' tab navigates');};
 open();ok(index.categories.join('|')==='Towers|Monsters|Fusion','three primary Index categories');tab('Fusion');
 ok(index.entries.length===1&&index.cards[0].locked&&index.cards[0].name.getString()==='???'&&index.cards[0].status.getString()==='UNDISCOVERED','unknown Fusion listed with hidden name/status');
 const portrait=index.cards[0].sprite,animation=portrait.getAnimationName();
 ok(animation==='StarburstCannon_IndexPortrait'&&portrait.getColor()==='0;0;0','silhouette uses dedicated Fusion showcase portrait with black per-sprite tint');
 ok(index.detail.description.getString().includes('CRYPTIC HINT')&&!index.objects.fusionRecipe0.getString().includes('5-2')&&index.detail.statValues.length===0,'cryptic hint visible; recipe and stats locked');
 if(globalThis.BALANCE_MODE==='unknown')return{checks,status:'undiscovered'};
 tab('Towers');ok(index.entries.length===1&&index.entries[0].type==='StarCannonTower','normal Tower Index unchanged and no Starburst duplicate');
 tab('Monsters');ok(index.entries.length===6&&S.__monsterDiscovery.scope==='session','six Monster entries and session behavior preserved');tab('Fusion');close();
 const make=(a,b,x,y)=>{const t=S.createObject('StarCannonTower'),v=t.getVariables();for(const [key,value]of Object.entries({TowerId:900000+t.getUniqueId(),PurchasePrice:300,TotalInvestment:300,Path1Level:a,Path2Level:b,FootprintX:x,FootprintY:y,FootprintRadius:46}))v.get(key).setNumber(value);step();star.apply(t);t.__starCooldown=100000;return t;};
 const a=make(5,2,300,352),b=make(2,5,900,352),ordinary=make(0,0,420,352),otherMax=make(5,2,1120,800);
 P.refresh();const gold=V.get('Money').getAsNumber(),writes=A.stats.writes,graphics=F.graphics;
 ok(F.begin(a),'eligible source enters partner selection');step(3);
 ok(F.markers.has(a.getUniqueId())&&F.markers.has(b.getUniqueId())&&F.markers.has(otherMax.getUniqueId())&&!F.markers.has(ordinary.getUniqueId())&&!F.footprints.size,'partner phase keeps Max-only candidate logos; no non-Max glow');
 ok(F.choose(b),'opposite path enters placement');move(300,352);
 ok(F.footprints.size===P.towers().length,'placement renders every tower footprint including non-Max');
 const zoom=S.getLayer('').getCameraZoom();
 for(const t of P.towers()){
  const r=F.footprints.get(t.getUniqueId()),c=S.getLayer('').convertInverseCoords(...P.center(t),0,[0,0]),source=t===a||t===b;
  ok(!!r&&near(r.x,c[0])&&near(r.y,c[1])&&near(r.radius,P.radius(t))&&near(r.screenRadius,P.radius(t)*zoom),'footprint follows actual center/radius for tower '+t.getUniqueId());
  ok(r.ignored===source&&r.color===(source?0x9de8f0:0xf49ab1),'source cyan/ignored versus occupied soft red '+t.getUniqueId());
 }
 ok(F.markers.size===2&&!F.markers.has(ordinary.getUniqueId())&&!F.markers.has(otherMax.getUniqueId()),'placement logos limited to the two chosen source towers');
 ok(F.ghost.getColor()==='180;255;230'&&F.preview.valid&&F.validate(...P.center(b)).valid,'green ghost can overlap either source only');
 ok(F.objects.cancel.getZOrder()>F.ghost.getZOrder()&&F.graphics.zIndex<F.objects.cancel.getZOrder(),'footprint graphics and ghost remain below Cancel/UI');
 const parent=S.getLayer('FusionUI').getRenderer().getRendererObject(),children=parent.children.length,footprintRefs=[...F.footprints.values()];step(240);
 ok(F.graphics===graphics&&parent.children.length===children&&[...F.footprints.values()].every((r,i)=>r===footprintRefs[i]),'240 frames reuse one renderer and footprint records without child growth');
 ok(!A.has('StarburstCannon')&&A.stats.writes===writes&&!A.queue.length&&!A.active,'preview does not unlock, save or announce discovery');
 move(370,352);ok(!F.preview.valid&&F.preview.reason==='tower'&&F.ghost.getColor()==='255;80;105','red ghost matches collision with non-Max footprint');
 const before=get('StarCannonTower').length;click(370,352);
 ok(get('StarCannonTower').length===before&&get('StarCannonTower').includes(a)&&get('StarCannonTower').includes(b)&&V.get('Money').getAsNumber()===gold&&!A.has('StarburstCannon'),'occupied click consumes nothing and never unlocks');
 move(600,352);ok(F.preview.reason==='region'&&!F.preview.valid,'outside union of source regions remains invalid');
 let road;for(let x=220;x<380&&!road;x+=10)for(let y=272;y<432;y+=10)if(F.validate(x,y).reason==='path'){road=[x,y];break;}
 ok(road&&!F.validate(...road).valid,'real road polygon still blocks Fusion');
 const block=S.createObject('Ground_Decoration');block.setAnimationName('Rock');block.setWidth(32);block.setHeight(32);block.setPosition(235,336);block.getVariables().get('Kind').setString('Rock');block.getVariables().get('LocalScale').setNumber(1);block.getVariables().get('Blocking').setBoolean(true);step(2);P.refresh();
 ok(F.validate(260,352).reason==='obstacle','existing obstacle remains blocked');block.deleteFromScene();step(2);P.refresh();
 if(globalThis.BALANCE_MODE==='placement'){move(300,352);return{checks,stage:F.stage,towerFootprints:F.footprints.size};}
 click(F.cancelRect.x+70,F.cancelRect.y+16,'FusionUI');
 ok(!F.active&&!F.footprints.size&&!F.markers.size&&F.ghost.isHidden()&&!A.has('StarburstCannon'),'Cancel cleans footprints/markers and leaves archive locked');
 for(let i=0;i<8;i++){F.begin(a);F.choose(b);step(2);F.cancel();step(2);}
 ok(!F.footprints.size&&!F.markers.size&&parent.children.length===children-2&&F.graphics===graphics,'eight repeated cancels leave no extra outline/logo children');
 const key1=A.resolve([a,b]),key2=A.resolve([b,a]);ok(key1.id===key2.id&&key1.variant===key2.variant&&key1.variant==='pure_52_25','reversed Pure recipe resolves to one stable variant');
 F.begin(a);F.choose(b);step(2);move(300,352);click(300,352);const fusion=get('StarCannonTower').find(star.isFusion);
 ok(fusion&&!get('StarCannonTower').includes(a)&&!get('StarCannonTower').includes(b)&&V.get('Money').getAsNumber()===gold,'successful native click creates Fusion then consumes only sources');fusion.__starCooldown=100000;
 ok(A.has('StarburstCannon')&&A.hasVariant('StarburstCannon','pure_52_25')&&A.stats.unlockedVariants===1&&A.stats.writes===writes+1,'only successful transaction unlocks shared state and saves once');
 ok(N.archive===F.archive&&N.archive===A&&A.stats.shown===1&&A.active?.first===true,'notification and Fusion logic share exactly one archive');
 ok(!N.root.interactive&&!N.root.interactiveChildren,'discovery panel never captures mouse input');
 ok(JSON.parse(localStorage.getItem(A.storageKey)).entries.StarburstCannon.variants.pure_52_25===true,'successful unlock is actually written to persistent storage');
 open();tab('Fusion');ok(!index.cards[0].locked&&index.cards[0].name.getString()==='Starburst Cannon'&&index.cards[0].status.getString()==='DISCOVERED'&&portrait.getColor()==='255;255;255','Index reveals original art/name/status immediately without restart');
 ok(index.objects.fusionRecipe0.getString()==='Star Cannon 5-2 + Star Cannon 2-5'&&index.detail.statValues.some(([label,value])=>label==='DAMAGE'&&value===90),'known canonical recipe and live stats displayed');
 close();open();tab('Towers');tab('Fusion');ok(!index.cards[0].locked&&index.cards.length===1,'close/reopen preserves unlock and no duplicate');close();
 // Notifications use real UI time under both 1x/2x and wait while Index/modal is open.
 const frozen=S.createObject('Enemy');frozen.getVariables().get('EnemyType').setString('Basic');S.__novaWisp.ensure(frozen);frozen.getVariables().get('MoveSpeed').setNumber(0);frozen.setPosition(1400,700);V.get('WaveMode').setString('ManualFast');step(2);
 ok(S.getTimeManager().getTimeScale()===2,'notification fixture uses actual2x wave mode');const age=A.active.age;step(30);ok(near(A.active.age-age,.50001),'notification advances half a second during 30 frames at2x');
 step(45);ok(N.icon.tint===0xffffff&&N.name.text==='Starburst Cannon'&&N.name.alpha===1,'silhouette animates into actual sprite and correct name');
 const g=N.screenRect,area=S.__towerShopUI.gameArea;ok(g.x>=0&&g.x+g.w<=area.right-8&&g.y>=area.top&&g.w===272&&g.h===60,'compact notice stays at the top-right gameplay edge outside the sidebar');
 if(globalThis.BALANCE_MODE==='notification')return{checks,notification:{age:A.active.age,first:A.active.first,shown:A.stats.shown}};
 frozen.deleteFromScene();V.get('WaveMode').setString('Waiting');step(260);ok(!A.active&&!A.queue.length&&!N.root.visible&&A.stats.shown===1&&A.stats.completed===1,'compact first discovery completes and cleans visible panel');
 const c=make(2,5,900,352),d=make(5,2,1300,800);F.begin(c);F.choose(d);step(2);const t=F.confirm(900,352);step(3);
 ok(t&&!A.queue.length&&!A.active&&A.stats.shown===1&&A.stats.unlockedVariants===1&&A.stats.writes===writes+1,'second reverse-order Fusion succeeds without duplicate first notification/save');t.__starCooldown=100000;
 // Extensibility fixture: future Hybrid needs four independent recipe discoveries.
 const hybrid={Id:'FutureHybrid',Name:'Future Hybrid',Kind:'Hybrid',Animation:'StarburstCannon',Stats:{Damage:90,AttackRange:227,AttackInterval:.4},Description:'Fixture only',Hint:'Future paths await.',AdaptiveVariants:true,Variants:Array.from({length:4},(_,i)=>({Id:'h'+i,Name:'Variant '+i,Recipe:[{Type:'FutureA',Path1:i,Path2:0,Label:'A'+i},{Type:'FutureB',Path1:0,Path2:i,Label:'B'+i}]}))};
 A.catalog.push(hybrid);ok(A.discover('FutureHybrid','h2')&&!A.discover('FutureHybrid','h2')&&A.progress('FutureHybrid').found===1&&A.progress('FutureHybrid').total===4,'one Hybrid variant unlocks1/4 and cannot repeat');
 ok(!A.hasVariant('FutureHybrid','h0')&&!A.hasVariant('FutureHybrid','h1')&&!A.hasVariant('FutureHybrid','h3'),'three other Adaptive variants stay individually locked');
 open();tab('Fusion');index.select('FutureHybrid');step(2);ok(index.cards.length===2&&index.objects.fusionProgress1.getString().endsWith('1 / 4')&&index.objects.fusionVariant01.getString().includes('UNDISCOVERED')&&index.objects.fusionVariant21.getString().includes('Variant 2'),'generic Fusion Index renders Hybrid progress and hides undiscovered recipes');close();
 A.catalog.pop();A.queue.length=0;A.active=null;A.state.entries.FutureFusion=unknown;A.state.metadata={keep:'current'};A.save();
 ok(localStorage.getItem('celestialVoidFusionUnrelatedCheck')==='preserve'&&JSON.stringify(S.__audio.settings)===JSON.stringify(audioSettings),'unrelated persistent key and audio preferences untouched');
 open();tab('Fusion');
 return{checks,audioSettings,expectation:'current',unknown,notifications:{firstShown:1,firstCompleted:1},footprints:4,storageKey:A.storageKey,viewport:[G.getGameResolutionWidth(),G.getGameResolutionHeight()]};
})()
