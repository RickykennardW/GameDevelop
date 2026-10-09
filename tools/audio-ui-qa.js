(async()=>{
 const G=testGame,S=G.getSceneStack().getCurrentScene(),V=S.getVariables(),A=S.__audio,P=S.__freePlacement,I=G.getInputManager(),checks=[],wait=ms=>new Promise(r=>setTimeout(r,ms));
 const ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
 const click=async(x,y)=>{I.onMouseMove(x,y);await wait(40);I.onMouseButtonPressed(0);await wait(55);I.onMouseButtonReleased(0);await wait(220);};
 const screen=(x,y,layer='')=>S.getLayer(layer).convertInverseCoords(x,y,0,[0,0]),card=S.__towerShopUI.cards[0].background;
 const clickCard=()=>click(...screen(card.getCenterXInScene(),card.getCenterYInScene(),card.getLayer()));
 await wait(500);ok(A.unlocked,'trusted audio context ready');
 V.get('Money').setNumber(299);let rejected=A.stats.requested.InvalidAction||0;await clickCard();ok((A.stats.requested.InvalidAction||0)===rejected+1&&V.get('Money').getAsNumber()===299,'shop insufficient Gold feedback preserves balance');P.stop();
 V.get('Money').setNumber(650);await clickCard();ok(P.active,'native builder started');
 const path=S.getObjects('Monster_Path').find(o=>P.validate('StarCannonTower',o.getCenterXInScene(),o.getCenterYInScene()).reason==='path');ok(!!path,'actual path rejects tower footprint');rejected=A.stats.requested.InvalidAction||0;
 await click(...screen(path.getCenterXInScene(),path.getCenterYInScene()));ok((A.stats.requested.InvalidAction||0)===rejected+1&&V.get('Money').getAsNumber()===650&&!S.getObjects('StarCannonTower').length,'invalid road placement emits one rejection /no charge');
 const b=A.geometry().button;await click(b.x+16,b.y+16);ok(A.ui.open,'settings open during builder');
 const box=A.geometry().panel,ui=A.stats.requested.UIClick||0;await click(box.x+50,box.y+225);ok(A.settings.MuteMusic&&(A.stats.requested.UIClick||0)===ui+1,'native Music mute button works');
 await click(box.x+50,box.y+225);ok(!A.settings.MuteMusic,'native Music unmute button works');
 await click(box.x+114+136*.7,box.y+51+37+12);ok(A.settings.Music===70&&A.music.every(s=>!s.sound||Math.abs(s.sound.getVolume()-s.gain*.7*A.duck)<.001),'native Music slider immediately changes actual channels');
 ok(P.active&&V.get('Money').getAsNumber()===650&&!S.getObjects('StarCannonTower').length,'popup clicks never buy/place a tower');
 const point=screen(300,352);await click(...point);ok(!A.ui.open&&P.active&&!S.getObjects('StarCannonTower').length,'outside popup dismissal consumes click before placement');
 await click(...point);ok(S.getObjects('StarCannonTower').length===1&&V.get('Money').getAsNumber()===350,'builder still places once after popup closes');
 V.get('Money').setNumber(0);const t=S.getObjects('StarCannonTower')[0],level=t.getVariables().get('Path1Level').getAsNumber();rejected=A.stats.requested.InvalidAction||0;
 ok(!S.__starCannon.upgrade(t,1)&&(A.stats.requested.InvalidAction||0)===rejected+1&&t.getVariables().get('Path1Level').getAsNumber()===level,'insufficient upgrade Gold cue leaves upgrade level unchanged');
 A.setSetting('Music',35);const speaker=A.geometry().button;await click(speaker.x+16,speaker.y+16);
 return{checks,geometry:A.geometry(),settings:A.settings,stats:A.stats};
})()
