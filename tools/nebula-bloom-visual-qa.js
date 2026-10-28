// Native visual showcase: upgraded towers and stationary high-HP targets only.
// This is an art/VFX capture fixture, not a balanced encounter or win-rate test.
(async()=>{
 const G=testGame,S=G.getSceneStack().getCurrentScene(),V=S.getVariables(),I=G.getInputManager(),N=S.__nebulaBloom,P=S.__freePlacement;G.pause(true);
 const step=(n=1)=>{for(let i=0;i<n;i++){S.renderAndStep(16.667);I.onFrameEnded();}};step(4);V.get('SelectedTower').setNumber(0);
 const make=(x,y,a,b)=>{if(!P.validate('NebulaBloomTower',x,y).valid)throw Error('Invalid showcase footprint');const t=S.createObject('NebulaBloomTower');for(const [key,value]of Object.entries({FootprintX:x,FootprintY:y,FootprintRadius:46,TowerId:920000+t.getUniqueId(),Path1Level:a,Path2Level:b}))t.getVariables().get(key).setNumber(value);P.positionSprite(t,'NebulaBloomTower',x,y);N.apply(t);return t;};
 const toxic=make(300,352,5,2),heavy=make(900,616,2,5);step(2);toxic.__nebulaCooldown=heavy.__nebulaCooldown=1e6;
 const enemy=(x,y,type)=>{const e=S.createObject('Enemy');e.getVariables().get('EnemyType').setString(type);S.__novaWisp.ensure(e);e.getVariables().get('MoveSpeed').setNumber(0);e.getVariables().get('GoldReward').setNumber(0);e.getBehavior('Health').SetMaxHealth(100000);e.getBehavior('Health').SetHealth(100000);e.setPosition(x-e.getWidth()/2,y-e.getHeight()/2);return e;};
 const a=enemy(440,176,'Basic'),b=enemy(1050,440,'VoidBrute');enemy(480,176,'VoidGuard');enemy(1100,440,'VoidHound');N.fire(toxic,a);step(64);const shot=N.fire(heavy,b);while(N.pods.has(shot.id))step();N.fire(toxic,a);step(8);
 if(!N.zones.length||!N.effects.length||!N.pods.size||!N.poisons.size)throw Error('Showcase needs live cloud / explosion / arcing pod / poison icon');
 if(globalThis.BALANCE_MODE==='panel'){V.get('SelectedTower').setNumber(toxic.getVariables().get('TowerId').getAsNumber());step(2);}
 return{states:['5-2','2-5'],actualArc:true,actualAreaDamage:true,clouds:N.zones.length,poisons:N.poisons.size,impactEffects:N.effects.length,fixture:'stationary high-HP visual targets; no gameplay balance claim'};
})()
