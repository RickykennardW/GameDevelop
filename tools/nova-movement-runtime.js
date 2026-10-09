// Called once per picked MonsterEnemies instance. Consume the full movement budget
// through consecutive tile centers, even at corners or after a long frame.
const enemy = objects[0];
runtimeScene.__novaWisp.ensure(enemy);
if(enemy.getBehavior("Health").IsDead())return;
const vars = enemy.getVariables();
const sceneVars = runtimeScene.getVariables();
const route = sceneVars.get("MonsterPathPoints");
const count = sceneVars.get("MonsterPathPointCount").getAsNumber();
let waypoint = vars.get("Waypoint").getAsNumber();
const speed = Math.max(0, vars.get("MoveSpeed").getAsNumber());
let budget = speed * gdjs.evtTools.runtimeScene.getElapsedTimeInSeconds(runtimeScene);
let moved = false;
let facing = vars.get('Facing').getAsString()||'Right';
while (waypoint < count && budget > 0.000001) {
  const point = route.getChild(waypoint);
  const dx = point.getChild("X").getAsNumber() - enemy.getCenterXInScene();
  const dy = point.getChild("Y").getAsNumber() - enemy.getCenterYInScene();
  const distance = Math.hypot(dx, dy);
  if (distance < 0.000001) { waypoint++; continue; }
  const step = Math.min(distance, budget);
  enemy.setPosition(enemy.getX() + dx / distance * step, enemy.getY() + dy / distance * step);
  facing = Math.abs(dx)>=Math.abs(dy)?(dx>=0?'Right':'Left'):(dy>=0?'Down':'Up');
  moved = true;
  budget -= step;
  if (step >= distance - 0.000001) waypoint++;
}
vars.get("Waypoint").setNumber(waypoint);
vars.get("PathFinished").setBoolean(waypoint >= count);
vars.get("IsMoving").setBoolean(moved);
vars.get('Facing').setString(facing);enemy.flipX(false);enemy.setAngle(0);
const prefix=vars.get('EnemyType').getAsString()==='VoidHound'?'Hound':'Nova';
vars.get('MovementAnimation').setString(prefix+'Move_'+facing);vars.get('IdleAnimation').setString(prefix+'Idle_'+facing);
const moveAnimation = vars.get("MovementAnimation").getAsString();
const idleAnimation = vars.get("IdleAnimation").getAsString();
const animation = moved || !idleAnimation ? moveAnimation : idleAnimation;
if (animation && enemy.getAnimationName() !== animation) {
  if(prefix==='Hound')runtimeScene.__voidHound.setAnimation(enemy,animation);else enemy.setAnimationName(animation);
}
if (moved) {
  enemy.setAnimationSpeedScale(speed / Math.max(1, vars.get("AnimationReferenceSpeed").getAsNumber()));
  enemy.playAnimation();
} else if (idleAnimation) {
  enemy.setAnimationSpeedScale(1);
  enemy.playAnimation();
} else {
  // Idle Run is a combined clip; pause its current frame when no separate idle exists.
  enemy.pauseAnimation();
}