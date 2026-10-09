(()=>{
 const S=testGame.getSceneStack().getCurrentScene(),V=S.getVariables(),N=S.__novaWisp,G=S.__voidGolem;
 const dirs=['Up','Down','Left','Right'],actors=[];
 for(let i=0;i<4;i++){
  const e=S.createObject('Enemy');e.getVariables().get('EnemyType').setString('VoidGolem');N.ensure(e);e.getVariables().get('Facing').setString(dirs[i]);e.getVariables().get('MoveSpeed').setNumber(0);e.setPosition(360+i*350-32,385-32);actors.push(e);
 }
 for(let i=0;i<5;i++){
  const e=S.createObject('Enemy');e.getVariables().get('EnemyType').setString(['Basic','VoidHound','VoidGuard','VoidSentinel','VoidBrute'][i]);N.ensure(e);e.getVariables().get('MoveSpeed').setNumber(0);e.setPosition(300+i*270-24,690-24);
 }
 for(let i=0;i<8;i++)S.renderAndStep(16.667);
 return{actors:actors.map(e=>({hp:e.getBehavior('Health').Health(),armor:e.getBehavior('Health').FlatDamageReduction(),size:[e.getWidth(),e.getHeight()],animation:e.getAnimationName(),frame:e.getAnimationFrame(),rendererVisible:e.__golemRig?.container.visible,bodyBounds:e.__golemRig?.body.getBounds(),healthbarWidth:S.__enemyHealthBars.get(e.getUniqueId())?.background.getWidth()})),budgets:[1,5,6,10,11,12,15,16,45].map(w=>[w,S.__goldBudget.generate(w)]),maxWave:V.get('MaximumWave').getAsNumber()};
})()
