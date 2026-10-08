const sv=runtimeScene.getVariables(), state=runtimeScene.__waveManager;
if (state && sv.get("WaveActive").getAsBoolean() && !sv.get("GameOver").getAsBoolean() && sv.get("Lives").getAsNumber()>0) {
  state.elapsed += gdjs.evtTools.runtimeScene.getElapsedTimeInSeconds(runtimeScene);
  const interval=sv.get("SpawnInterval").getAsNumber();
  while (state.index<state.queue.length && state.elapsed>=interval) {
    state.elapsed-=interval;
    state.index++;const type="Basic", stats=sv.get("EnemyTypes").getChild("Basic").toJSObject();
    const enemy=runtimeScene.createObject("Enemy"), vars=enemy.getVariables();
    vars.get("EnemyType").setString(type);vars.get("MoveSpeed").setNumber(stats.Speed);vars.get("GoldReward").setNumber(stats.Reward);
    enemy.setWidth(48);enemy.setHeight(48);enemy.setAngle(0);enemy.flipX(false);enemy.setColor("255;255;255");
    vars.get("EnemyName").setString("Nova Wisp");vars.get("Armor").setNumber(0);vars.get("Facing").setString("Right");vars.get("MovementAnimation").setString("NovaMove_Right");vars.get("IdleAnimation").setString("NovaIdle_Right");
    const point=sv.get("MonsterPathPoints").getChild(0);
    enemy.setPosition(point.getChild("X").getAsNumber()-enemy.getWidth()/2,point.getChild("Y").getAsNumber()-enemy.getHeight()/2);
    enemy.setAnimationName(vars.get("MovementAnimation").getAsString());
    enemy.getBehavior("Health").SetMaxHealth(stats.HP);enemy.getBehavior("Health").SetHealth(stats.HP);
    sv.get("EnemiesToSpawn").setNumber(state.queue.length-state.index);
  }
}