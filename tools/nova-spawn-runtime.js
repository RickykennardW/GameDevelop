const sv=runtimeScene.getVariables(), state=runtimeScene.__waveManager;
if (state && sv.get("WaveActive").getAsBoolean() && !sv.get("GameOver").getAsBoolean() && sv.get("Lives").getAsNumber()>0) {
  state.elapsed += gdjs.evtTools.runtimeScene.getElapsedTimeInSeconds(runtimeScene);
  const interval=sv.get("SpawnInterval").getAsNumber();
  while (state.index<state.queue.length && state.elapsed>=interval) {
    state.elapsed-=interval;
    const type=state.queue[state.index++], stats=sv.get("EnemyTypes").getChild(type).toJSObject();
    const enemy=runtimeScene.createObject("Enemy"), vars=enemy.getVariables();
    vars.get("EnemyType").setString(type);vars.get("MoveSpeed").setNumber(stats.Speed);vars.get("GoldReward").setNumber(stats.Reward);
    enemy.setWidth(48);enemy.setHeight(48);enemy.setAngle(0);enemy.flipX(false);enemy.setColor("255;255;255");
    const prefix=stats.AnimationPrefix||(type==="VoidHound"?"Hound":"Nova");vars.get("EnemyName").setString(stats.Name);vars.get("Armor").setNumber(stats.Armor);vars.get("Facing").setString("Right");vars.get("MovementAnimation").setString(prefix+"Move_Right");vars.get("IdleAnimation").setString(prefix+"Idle_Right");vars.get("AnimationReferenceSpeed").setNumber(stats.Speed);
    const point=sv.get("MonsterPathPoints").getChild(0);
    enemy.setAnimationName(vars.get("MovementAnimation").getAsString());
    const size=type==='VoidGolem'?runtimeScene.__voidGolem.config.LogicalSize:48;
    enemy.setWidth(size);enemy.setHeight(size);
    enemy.setPosition(point.getChild("X").getAsNumber()-size/2,point.getChild("Y").getAsNumber()-size/2);
    enemy.getBehavior("Health").SetMaxHealth(stats.HP);enemy.getBehavior("Health").SetHealth(stats.HP);enemy.getBehavior("Health").SetFlatDamageReduction(stats.Armor);enemy.getBehavior("Health").SetPercentDamageReduction(0);
    runtimeScene.__novaWisp.ensure(enemy);runtimeScene.__voidGolem.fort.ensure(enemy);
    sv.get("EnemiesToSpawn").setNumber(state.queue.length-state.index);
  }
}
