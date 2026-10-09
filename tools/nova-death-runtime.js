// Logical death is immediate; a separate non-targetable visual completes its dissolve.
const scene=runtimeScene,sv=scene.getVariables(),nova=scene.__novaWisp;
for(const e of scene.getObjects('Enemy').slice()){
 if(!e.getBehavior('Health').IsDead())continue;
 nova.ensure(e);const v=e.getVariables();
 scene.__voidGolem?.fort.remove(e);
 if(!v.get('RewardPaid').getAsBoolean()){
  v.get('RewardPaid').setBoolean(true);
  if(!v.get('PathFinished').getAsBoolean()){sv.get('Money').add(v.get('GoldReward').getAsNumber());if(scene.__voidGolem?.has(e))scene.__voidGolem.beginDeath(e);else if(v.get('EnemyType').getAsString()==='VoidHound')scene.__voidHound.beginDeath(e);else if(scene.__voidCommon?.has(v.get('EnemyType').getAsString()))scene.__voidCommon.beginDeath(e);else nova.death(e);}
 }
 if((scene.__voidGolem?.has(e)||v.get('EnemyType').getAsString()==='VoidHound'||scene.__voidCommon?.has(v.get('EnemyType').getAsString()))&&!v.get('PathFinished').getAsBoolean())continue;
 e.deleteFromScene();
}
scene.__voidGolem?.postCombat();
