// Real input/transactions in the exported native scene; fixture balances are isolated.
(async()=>{
 const G=testGame,S=G.getSceneStack().getCurrentScene(),V=S.getVariables(),I=G.getInputManager(),P=S.__freePlacement,A=S.__audio,get=n=>S.getObjects(n),checks=[];
 const ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);},step=(n=1)=>{for(let i=0;i<n;i++){S.renderAndStep(16.667);I.onFrameEnded();}},wait=ms=>new Promise(r=>setTimeout(r,ms));
 const move=(x,y,layer='')=>{I.onMouseMove(...S.getLayer(layer).convertInverseCoords(x,y,0,[0,0]));step(2);},click=(x,y,layer='')=>{move(x,y,layer);I.onMouseButtonPressed(0);step(2);I.onMouseButtonReleased(0);step(2);};
 const card=S.__towerShopUI.cards[0],select=()=>click(card.background.getCenterXInScene(),card.background.getCenterYInScene(),card.background.getLayer());
 G.pause(true);step(4);const config=JSON.stringify(['StarCannonConfig','StarburstConfig','EnemyTypes','WaveBudgetConfig','MonsterPathPoints'].map(n=>V.get(n).toJSObject())),camera=JSON.stringify([S.getLayer('').getCameraX(),S.getLayer('').getCameraY(),S.getLayer('').getCameraZoom()]);
 V.get('Money').setNumber(150);const rejected=A.stats.requested.InvalidAction||0,denied=A.stats.requested.PurchaseDenied||0;select();move(300,352);
 ok(P.active&&!get('TilePlacement_Indicator')[0].isHidden()&&!S.__placementRange.isHidden(),'underfunded shop selection keeps ghost and range');
 ok((A.stats.requested.InvalidAction||0)===rejected&&(A.stats.requested.PurchaseDenied||0)===denied,'selection does not emit either error cue');
 ok(P.preview.valid&&!P.preview.affordable&&get('TilePlacement_Indicator')[0].getColor()==='197;255;221','spatially clear preview stays green when unaffordable');
 ok(P.validate('StarCannonTower',300,352).reason==='gold'&&P.validate('StarCannonTower',300,352,{ignoreGold:true}).valid,'shared validator retains strict default for Fusion and optional spatial preview');
 click(300,352);ok(P.active&&!get('StarCannonTower').length&&V.get('Money').getAsNumber()===150&&!S.__placementRange.isHidden(),'purchase fails without spawning/charging or closing builder');
 ok(P.feedback.shown===1&&P.feedback.root.visible&&P.feedback.title.text==='NOT ENOUGH GOLD'&&P.feedback.detail.text==='Need 150 More Gold','one lightweight notice uses current deficit');
 const moneyText=get('MoneyText')[0],hud=get('HUDPanel')[0];
 ok(P.feedback.root.x===moneyText.getX()&&P.feedback.root.y===hud.getY()+hud.getHeight()+4&&P.feedback.screenRect.x<S.__towerShopUI.gameArea.right,'feedback follows Gold HUD anchor outside Tower Shop');
 ok(card.background.getWidth()===84&&card.background.getHeight()===112&&card.background.getY()===S.__towerShopUI.geometry.listY,'Gold feedback does not move or resize shop card');
 ok(moneyText.getColor()==='255;140;152','Gold amount flashes coral on rejection');
 ok((A.stats.requested.PurchaseDenied||0)===denied+1&&(A.stats.requested.InvalidAction||0)===rejected,'one purchase cue and no duplicate generic invalid sound');
 await wait(100);const voice=A.voices.find(v=>v.key==='PurchaseDenied');ok(voice?.sound?.playing()&&voice.sound.getVolume()>0,'original double buzz actually plays on native SFX channel');
 A.setSetting('SFX',25);ok(Math.abs(voice.sound.getVolume()-.25*A.config.SFX.PurchaseDenied.Gain)<.001,'SFX volume independently controls purchase-denied cue');A.setSetting('SFX',70);
 const root=P.feedback.root,shown=P.feedback.shown;for(let i=0;i<8;i++){I.onMouseButtonPressed(0);step();I.onMouseButtonReleased(0);step();}
 ok(P.feedback.root===root&&P.feedback.shown===shown&&(A.stats.requested.PurchaseDenied||0)===denied+1&&!get('StarCannonTower').length,'eight rapid clicks reuse notice and obey global feedback cooldown');
 V.get('Money').setNumber(200);click(300,352);ok(P.feedback.detail.text==='Need 100 More Gold','deficit refreshes from current money even during feedback cooldown');
 if(globalThis.BALANCE_MODE==='feedback')return{checks,preview:P.preview,feedback:{shown:P.feedback.shown,detail:P.feedback.detail.text}};
 // Gain real native kill Gold while the same builder stays active.
 V.get('Money').setNumber(295);const enemy=S.createObject('Enemy');S.__novaWisp.ensure(enemy);enemy.getVariables().get('MoveSpeed').setNumber(0);enemy.getVariables().get('GoldReward').setNumber(5);enemy.setPosition(1400,700);enemy.getBehavior('Health').SetHealth(0);step(3);
 ok(V.get('Money').getAsNumber()===300&&P.active&&!P.feedback.root.visible,'actual enemy reward makes same preview affordable and clears stale deficit');
 const placed=A.stats.requested.TowerPlace||0;move(300,352);I.onMouseButtonPressed(0);step(20);
 ok(get('StarCannonTower').length===1&&V.get('Money').getAsNumber()===0&&!P.active&&!V.get('PlacementValid').getAsBoolean(),'newly affordable held click buys once at unchanged price300');
 ok((A.stats.requested.TowerPlace||0)===placed+1&&S.__placementRange.isHidden(),'successful purchase plays placement cue once and removes range');
 I.onMouseButtonReleased(0);step(2);const tower=get('StarCannonTower')[0];ok(tower.getVariables().get('PurchasePrice').getAsNumber()===300&&tower.getVariables().get('TotalInvestment').getAsNumber()===300,'investment initialization remains unchanged');tower.deleteFromScene();step(2);
 V.get('Money').setNumber(150);select();const path=get('Monster_Path').find(o=>P.validate('StarCannonTower',o.getCenterXInScene(),o.getCenterYInScene(),{ignoreGold:true}).reason==='path');const cue=A.stats.requested.PurchaseDenied||0;
 click(path.getCenterXInScene(),path.getCenterYInScene());ok(P.preview.reason==='path'&&!P.preview.valid&&(A.stats.requested.PurchaseDenied||0)===cue&&P.active,'path collision wins over insufficient Gold');
 const ruin=P.blockers.find(c=>c.owner.getVariables().get('Kind').getAsString()==='Ruin'&&P.validate('StarCannonTower',c.x,c.y,{ignoreGold:true}).reason==='obstacle');ok(!!ruin,'real Ruin collider test point exists');click(ruin.x,ruin.y);ok(P.preview.reason==='obstacle'&&(A.stats.requested.PurchaseDenied||0)===cue,'real Ruin remains blocked with no money error');
 const busy=S.createObject('StarCannonTower'),bv=busy.getVariables();bv.get('FootprintX').setNumber(420);bv.get('FootprintY').setNumber(352);bv.get('FootprintRadius').setNumber(46);step(2);click(420,352);ok(P.preview.reason==='tower'&&!P.preview.valid,'other tower collider remains blocked');busy.deleteFromScene();step(2);
 const balance=V.get('Money').getAsNumber();I.onKeyPressed(27);step();I.onKeyReleased(27);step(2);ok(!P.active&&get('TilePlacement_Indicator')[0].isHidden()&&S.__placementRange.isHidden()&&V.get('Money').getAsNumber()===balance&&(A.stats.requested.PurchaseDenied||0)===cue,'ESC cancels ghost/range/feedback without spending or rejection cue');
 select();move(300,352);step(50);click(300,352);ok(P.feedback.root.visible,'second denied attempt may show after cooldown');step(75);ok(!P.feedback.root.visible&&P.active&&moneyText.getColor()===P.feedback.moneyColor,'notice expires in 1.2 seconds and restores Gold color while preview remains');
 A.setSetting('MuteSFX',true);step(45);const muted=P.feedback.sounds;click(300,352);ok(P.feedback.sounds===muted&&P.feedback.root.visible,'Mute SFX suppresses purchase sound but preserves visual feedback');A.setSetting('MuteSFX',false);P.stop();step(2);
 ok(config===JSON.stringify(['StarCannonConfig','StarburstConfig','EnemyTypes','WaveBudgetConfig','MonsterPathPoints'].map(n=>V.get(n).toJSObject()))&&camera===JSON.stringify([S.getLayer('').getCameraX(),S.getLayer('').getCameraY(),S.getLayer('').getCameraZoom()]),'tower/enemy/wave configuration and path/camera unchanged');
 const previousRoot=P.feedback.root,next=G.getSceneStack().replace(S.getName());next.renderAndStep(16.667);I.onFrameEnded();ok(previousRoot.destroyed&&!next.__freePlacement.feedback.root&&!next.__freePlacement.active,'actual scene replacement releases notice graphics and starts with no stale builder');
 return{checks,feedback:{shown:P.feedback.shown,sounds:P.feedback.sounds},audio:{denied:A.stats.played.PurchaseDenied,placed:A.stats.played.TowerPlace},viewport:[G.getGameResolutionWidth(),G.getGameResolutionHeight()]};
})()
