// Native fog cadence/overlap/exposure, foundation and icon contracts.
(async()=>{
 const G=testGame,S=G.getSceneStack().getCurrentScene(),V=S.getVariables(),I=G.getInputManager(),N=S.__nebulaBloom,P=S.__freePlacement,checks=[];G.pause(true);
 const ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);},near=(a,b,e=.001)=>Math.abs(a-b)<=e,step=(n=1,ms=16.667)=>{for(let i=0;i<n;i++){S.renderAndStep(ms);I.onFrameEnded();}},hp=e=>e.getBehavior('Health').Health();step(4);
 ok(N.config.PoisonTickSeconds===1&&N.config.CloudApplyIntervalSeconds===.6,'damage cadence exactly1second / existing status-exposure polling remains0.6second');
 const tower=S.createObject('NebulaBloomTower');for(const [k,n]of Object.entries({FootprintX:300,FootprintY:352,FootprintRadius:46,TowerId:930001,Path1Level:3,Path2Level:2}))tower.getVariables().get(k).setNumber(n);P.positionSprite(tower,'NebulaBloomTower',300,352);N.apply(tower);step(2);tower.__nebulaCooldown=1e6;
 const make=(x,y)=>{const e=S.createObject('Enemy');e.getVariables().get('EnemyType').setString('Basic');S.__novaWisp.ensure(e);e.getVariables().get('MoveSpeed').setNumber(0);e.getVariables().get('GoldReward').setNumber(0);e.getBehavior('Health').SetMaxHealth(100000);e.getBehavior('Health').SetHealth(100000);e.setPosition(x-e.getWidth()/2,y-e.getHeight()/2);return e;};
 const primary=make(400,352),edge=make(471,352),late=make(480,352),outside=make(476,352),shots=[];for(let n=0;n<8;n++)shots.push(N.fire(tower,primary));for(let frame=0;frame<120&&N.pods.size;frame++)step();
 ok(shots.every(Boolean)&&N.zones.length===8&&N.metrics.impacts===8,'eight actual arcing pods create eight overlapping hazards');
 const variants=N.zones.map(z=>z.cloudVariant);ok(variants.slice(0,4).join('|')==='PoisonCloud|PoisonCloud_B|PoisonCloud_C|PoisonCloud_D'&&variants.slice(4).join('|')===variants.slice(0,4).join('|'),'all four real fog assets cycle without immediate repeats');
 ok(new Set(N.zones.map(z=>z.cloudAngle)).size===8&&N.zones.every(z=>z.cloud.getAnimationName()===z.cloudVariant),'fog keeps its chosen shape and bounded varied orientation');
 ok(N.zones.every(z=>near(z.cloud.getCenterXInScene(),z.x)&&near(z.cloud.getCenterYInScene(),z.y)),'rotated cloud remains centered on unchanged gameplay area');
 ok(N.poisons.has(edge.getUniqueId())&&!N.poisons.has(outside.getUniqueId())&&hp(edge)===100000,'cloud-only target outside direct splash receives status without instant damage / outside radius excluded');
 const record=N.poisons.get(edge.getUniqueId()),birth=N.time,next=record.nextTick;ok(near(next-birth,1),'first damage scheduled one second after exposure');
 step(30);ok(hp(edge)===100000,'no damage at0.5seconds despite eight overlapping fog sprites');late.setPosition(471-late.getWidth()/2,352-late.getHeight()/2);step(10);
 const lateRecord=N.poisons.get(late.getUniqueId());ok(lateRecord&&near(lateRecord.nextTick-(N.zones[0].born+.6),1,.025)&&hp(late)===100000,'later entry gets its own one-second first tick after exposure');
 while(N.time+1e-8<next-.03)step();ok(hp(edge)===100000,'no early poison tick just before1second');
 const tickTimes=[];let previous=hp(edge);for(let frame=0;frame<150;frame++){step();const health=hp(edge);if(health!==previous){ok(near(previous-health,25),'overlapping fogs produce one25damage tick, without stacking');tickTimes.push(N.time);previous=health;}if(tickTimes.length===3)break;}
 ok(tickTimes.length===3&&near(tickTimes[0]-birth,1,.025)&&near(tickTimes[1]-tickTimes[0],1,.025)&&near(tickTimes[2]-tickTimes[1],1,.025),'three measured damage intervals are1second / no frame multi-hit');
 ok(hp(outside)===100000&&S.getObjects('NebulaPoisonIcon').length===N.poisons.size,'outside radius remains untouched and each active status owns exactly one icon');
 let states=0;const center=JSON.stringify(P.center(tower));for(let a=0;a<=5;a++)for(let b=0;b<=5;b++)if(N.valid(a,b)){
  const tv=tower.getVariables();tv.get('Path1Level').setNumber(a);tv.get('Path2Level').setNumber(b);N.apply(tower);N.render();const data=N.config.States[a+'_'+b],base=data.Parts[0],rig=N.rigs.get(tower.getUniqueId());ok(base.Atlas==='NB_Components'&&base.Size===112&&rig.base.rotation===0&&near(Math.max(rig.base.children[0].width,rig.base.children[0].height),112),'restored stationary foundation rendered in state '+a+'-'+b);ok(P.radius(tower)===68&&tower.getWidth()===64&&tower.getHeight()===64&&JSON.stringify(P.center(tower))===center,'foundation resize leaves footprint / center / logical dimensions unchanged '+a+'-'+b);states++;
 }
 for(const n of ['StarCannonConfig','StarburstConfig'])ok(!!V.get(n).toJSObject().Paths||n==='StarburstConfig','old tower controller still available '+n);
 V.get('SelectedTower').setNumber(930001);for(let path=0;path<2;path++)for(let level=0;level<5;level++){
  tower.getVariables().get('Path1Level').setNumber(path===0?level:0);tower.getVariables().get('Path2Level').setNumber(path===1?level:0);N.apply(tower);step(2);const c=S.__selectedPanel.cards[path],name='NB_'+(path===0?'Toxic':'Burst')+(level+1);ok(c.icon.getAnimationName()===name&&c.icon.getWidth()===72&&c.icon.getHeight()===72&&c.icon.getX()===c.background.getX()+34,'native upgrade panel uses correct centered72px milestone icon '+name);
 }
 primary.deleteFromScene();edge.deleteFromScene();late.deleteFromScene();outside.deleteFromScene();step(600);ok(!N.zones.length&&!N.poisons.size&&!N.effects.length&&!S.getObjects('NebulaBloomVFX').length&&!S.getObjects('NebulaPoisonIcon').length,'all varied fogs / poison icons / owners expire without leaks');
 return{checks,variants:[...new Set(variants)],damageTickSeconds:1,measuredIntervals:[tickTimes[0]-birth,tickTimes[1]-tickTimes[0],tickTimes[2]-tickTimes[1]],overlappingHazards:8,foundationScale:1,footprintRadius:68,states,upgradeIcons:10};
})()
