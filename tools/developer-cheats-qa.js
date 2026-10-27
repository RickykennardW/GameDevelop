// Native UI/economy/upgrade/Fusion integration in an isolated compiled preview.
(async()=>{
 const G=testGame,I=G.getInputManager(),checks=[];let S=G.getSceneStack().getCurrentScene();G.pause(true);
 const step=(n=1)=>{for(let i=0;i<n;i++){S.renderAndStep(16.667);I.onFrameEnded();}},ok=(x,m)=>{if(!x)throw Error(m);checks.push(m);},V=()=>S.getVariables(),money=()=>V().get('Money').getAsNumber(),towers=()=>S.getObjects('StarCannonTower');
 const move=(x,y,layer='')=>{I.onMouseMove(...S.getLayer(layer).convertInverseCoords(x,y,0,[0,0]));step(2);},click=(x,y,layer='')=>{move(x,y,layer);I.onMouseButtonPressed(0);step(2);I.onMouseButtonReleased(0);step(2);};
 const button=id=>{const d=S.__devCheats,b=d.buttons.find(b=>b.id===id);if(id==='toggle'){const r=d.g.button;click(r.x+r.w/2,r.y+r.h/2,'DeveloperUI');return;}
  if(id!=='close'){const center=b.r.y+b.r.h/2,h=d.g.body.h/d.g.unit;if(center-d.scroll>h-12||center-d.scroll<12)d.scroll=Math.max(0,Math.min(d.maxScroll,center-h/2));d.layout();}
  const g=d.g;click(g.panel.x+(b.r.x+b.r.w/2)*g.unit,g.panel.y+((id==='close'?0:48-d.scroll)+b.r.y+b.r.h/2)*g.unit,'DeveloperUI');};
 const storage=()=>JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])));
 step(5);let d=S.__devCheats;ok(!!d&&d.enabled()&&!d.open,'development-enabled Game Scene has one closed DEV launcher');const initial=money(),saved=storage(),rewardCues=S.__audio.stats.requested.GoldReward||0,rootChildren=d.root.children.length;
 step(120);ok(initial===50000&&money()===initial&&V().get('Wave').getAsNumber()===0,'scene load / idle grants no developer Gold or automatic wave');
 button('toggle');ok(d.open&&document.querySelectorAll('[data-celestial-dev-input]').length===1,'actual DEV click opens compact panel and one input');
 for(const n of [1000,5000,10000,50000]){const before=money();button('gold'+n);ok(money()===before+n&&S.getObjects('MoneyText')[0].getString()===String(before+n),'preset '+n+' updates real Money and HUD exactly once');}
 d.input.value='250000';const beforeCustom=money();button('add');ok(money()===beforeCustom+250000,'custom input / Add Gold uses real balance');
 for(const raw of ['', '0','-1','abc','1.5','1e6','Infinity','1000000000000','  ']){const before=money();d.input.value=raw;button('add');ok(money()===before&&d.notice.includes('Invalid Gold'),'invalid custom amount rejected: '+JSON.stringify(raw));}
 d.input.value='1000000000';button('set');ok(money()===1e9,'Set Balance is explicitly separate and respects configured limit');button('gold1000');ok(money()===1e9&&d.notice.includes('Invalid Gold'),'addition cannot overflow configured maximum balance');
 d.input.value='50000';button('set');ok(money()===50000,'Set Balance restores a valid positive testing balance');
 ok(!d.maxSelected()&&d.notice==='No Tower Selected'&&money()===50000,'no-selection Max cannot spend Gold or fabricate a Tower');
 ok((S.__audio.stats.requested.GoldReward||0)===rewardCues&&storage()===saved,'developer Gold writes no reward events or persistent player save');
 button('close');ok(!d.open&&d.input.style.display==='none','visible X closes input and panel');
 const builderCard=S.__towerShopUI.cards[0].background;click(builderCard.getCenterXInScene(),builderCard.getCenterYInScene(),builderCard.getLayer());button('toggle');const builderCash=money();button('gold1000');ok(S.__freePlacement.active&&towers().length===0&&money()===builderCash+1000,'developer button and preset never place a ghost through the panel');
 move(d.g.panel.x+20,d.g.panel.y+20,'DeveloperUI');I.onMouseButtonPressed(0);step(2);move(300,352);step(2);I.onMouseButtonReleased(0);step(2);ok(S.__freePlacement.active&&towers().length===0,'holding a developer-panel press and dragging onto valid ground cannot buy a Tower');button('close');I.onKeyPressed(27);step();I.onKeyReleased(27);step(2);
 const build=(x,y)=>{const card=S.__towerShopUI.cards[0].background;click(card.getCenterXInScene(),card.getCenterYInScene(),card.getLayer());const before=money();click(x,y);const t=towers().find(t=>Math.hypot(...S.__freePlacement.center(t).map((n,i)=>n-[x,y][i]))<1);ok(!!t&&money()===before-300,'normal paid Star Cannon placement after developer funding');V().get('SelectedTower').setNumber(t.getVariables().get('TowerId').getAsNumber());step(2);return t;};
 const A=build(300,352),aid=A.getUniqueId(),center=JSON.stringify(S.__freePlacement.center(A));button('toggle');const opening=money();d.setGold(1);button('max');ok(money()===1&&A.getVariables().get('Path1Level').getAsNumber()===0&&d.notice.startsWith('Need '),'unaffordable max refuses before any upgrade / never grants free upgrades');d.setGold(opening);const beforeA=money();button('max');
 ok(A.getVariables().get('Path1Level').getAsNumber()===5&&A.getVariables().get('Path2Level').getAsNumber()===2&&money()===beforeA-11770,'Max Selected uses native purchases for5-2 at unchanged11770 upgrade cost');
 ok(A.getUniqueId()===aid&&towers().length===1&&JSON.stringify(S.__freePlacement.center(A))===center&&A.getVariables().get('TotalInvestment').getAsNumber()===12070,'max preserves identity, footprint and native investment');
 ok(A.getVariables().get('Damage').getAsNumber()===S.__starCannon.stats(5,2).Damage&&A.getVariables().get('VisualKey').getAsString()==='5_2'&&S.__selectedPanel.tower===A,'real statistics, component rig and selected panel reflect max upgrade');
 if(globalThis.BALANCE_MODE==='shot'){d.input.value='';move(10,10,'DeveloperUI');return{checks,shot:true,maxedTower:'5-2',gold:money()};}
 const once=money();button('max');ok(money()===once&&d.notice==='Tower Already Maxed','already-maxed action is idempotent with no spending');button('path2');button('max');ok(money()===once&&A.getVariables().get('Path2Level').getAsNumber()===2&&d.notice.includes('Path Locked'),'opposite max target cannot bypass existing cross-path locks');
 button('toggle');const B=build(900,352);button('toggle');button('path2');const beforeB=money();button('max');ok(B.getVariables().get('Path1Level').getAsNumber()===2&&B.getVariables().get('Path2Level').getAsNumber()===5&&money()===beforeB-10120,'alternate max target reaches2-5 through native10120 upgrade spend');
 button('toggle');
 const combat=t=>{const [x,y]=S.__freePlacement.center(t),enemy=S.createObject('Enemy'),v=enemy.getVariables();v.get('EnemyType').setString('Basic');S.__novaWisp.ensure(enemy);v.get('MoveSpeed').setNumber(0);v.get('GoldReward').setNumber(0);enemy.setPosition(x+80-enemy.getWidth()/2,y-enemy.getHeight()/2);enemy.getBehavior('Health').SetMaxHealth(100000);enemy.getBehavior('Health').SetHealth(100000);t.__starCooldown=0;t.__starFacing=S.__starCannon.bearing(t,enemy);step(240);ok(enemy.getBehavior('Health').Health()<100000&&t.getVariables().get('ShotCounter').getAsNumber()>0,'maxed '+t.getVariables().get('VisualKey').getAsString()+' aims / fires native projectiles / damages enemy');ok(S.__starCannon.visual(t).nodes.every(n=>n.sprite.texture.valid),'maxed component animation textures remain valid');enemy.deleteFromScene();step(2);};combat(A);combat(B);
 V().get('SelectedTower').setNumber(A.getVariables().get('TowerId').getAsNumber());step(2);button('toggle');const archiveBefore=G.__fusionArchive.revision,funds=money();button('fusion');const F=S.__fusion;
 ok(F.active&&F.stage==='partner'&&!d.open&&!d.root.visible&&d.input.style.display==='none'&&S.getTimeManager().getTimeScale()===.5,'developer Fusion shortcut enters real Tactical Fusion / hides DEV UI');
 click(...S.__freePlacement.center(B));ok(F.stage==='placement'&&F.a===A&&F.b===B,'real map partner selection respects native compatible source pair');
 const road=S.getObjects('Monster_Path')[8];click(road.getCenterXInScene(),road.getCenterYInScene());ok(F.active&&money()===funds&&towers().length===2,'invalid Fusion placement cannot consume sources or Gold');
 click(F.cancelRect.x+40,F.cancelRect.y+18,'FusionUI');ok(!F.active&&money()===funds&&towers().includes(A)&&towers().includes(B)&&G.__fusionArchive.revision===archiveBefore,'normal Fusion cancellation preserves Gold, identity and archive state');
 V().get('SelectedTower').setNumber(A.getVariables().get('TowerId').getAsNumber());step(2);button('toggle');button('fusion');click(...S.__freePlacement.center(B));click(...S.__freePlacement.center(A));const result=towers()[0];
 ok(towers().length===1&&S.__starCannon.isFusion(result)&&!towers().includes(A)&&!towers().includes(B)&&money()===funds-F.config.FusionCost,'native regional Fusion consumes two real sources, creates Starburst and charges exact recipe cost');
 ok(G.__fusionArchive.revision===archiveBefore+1&&G.__fusionArchive.has('StarburstCannon'),'only successful normal Fusion discovers recipe through existing persistent archive');
 button('toggle');const noUpgrades=money();button('max');ok(money()===noUpgrades&&d.notice.includes('no supported upgrade path')&&towers().length===1,'Starburst cannot receive fabricated Star Cannon path levels');
 for(let i=0;i<10;i++){button('toggle');button('toggle');}ok(d.open&&d.root.children.length===rootChildren&&document.querySelectorAll('[data-celestial-dev-input]').length===1,'repeated open / close reuses UI and one input');
 const savedAfterFusion=storage(),releaseBalance=money(),cachedAdd=d.addGold;V().get('DEV_CHEATS_ENABLED').setBoolean(false);step(2);
 ok(!d.root.visible&&!d.open&&d.input.style.display==='none','runtime disable removes launcher, popup and input');
 ok(!cachedAdd(1000)&&!d.setGold(1)&&!d.maxSelected()&&!d.startFusion()&&!d.toggle()&&!d.setPath(2)&&money()===releaseBalance&&storage()===savedAfterFusion,'all cached cheat actions check development flag and cannot mutate release state');
 // Let actual asynchronous audio decodes settle before destroying their owner.
 // Synchronous accelerated frames otherwise cancel pending Howler loads unrealistically.
 await new Promise(r=>setTimeout(r,500));
 const data=G.getSceneAndExtensionsData(S.getName()).sceneData,flag=data.variables.find(v=>v.name==='DEV_CHEATS_ENABLED');flag.value=false;const previous=d,oldInput=d.input;S=G.getSceneStack().replace('Game Scene');step(4);
 ok(previous.root.destroyed&&previous.disposed&&!oldInput.isConnected&&!document.querySelector('[data-celestial-dev-input]'),'real scene unload removes UI, text textures, DOM input and listeners');
 ok(!S.__devCheats&&money()===50000&&towers().length===0,'release-disabled scene initializes with no developer controller / no money grant');
 const releaseStart=money(),releaseTower=build(300,352);ok(money()===releaseStart-300&&!!releaseTower,'ordinary placement remains functional when cheats are disabled');
 await new Promise(r=>setTimeout(r,500));flag.value=true;S=G.getSceneStack().replace('Game Scene');step(4);d=S.__devCheats;button('toggle');d.input.value='';d.input.focus();step(2);
 ok(d.open&&document.activeElement===d.input&&V().get('DevGoldInputFocused').getAsBoolean(),'fresh development scene supports focused custom entry after repeated scene changes');
 return{checks,keyboardReady:true,initialGold:initial,currentGold:money(),developerLimit:d.config.GoldLimit,nativeFusionOnly:true,recipeOverride:false,viewport:[G.getGameResolutionWidth(),G.getGameResolutionHeight()]};
})()
