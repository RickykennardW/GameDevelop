// Display-only pass after movement/damage/removal: one pair per unique enemy lifetime.
// GDevelop gives recycled instances a new unique id. No nearest-enemy selection.
let bars = runtimeScene.__enemyHealthBars;
if (!bars) bars = runtimeScene.__enemyHealthBars = new Map();
for (const enemy of runtimeScene.getObjects("Enemy")) {
  const id = enemy.getUniqueId();
  let pair = bars.get(id);
  if (!pair) {
    const background = runtimeScene.createObject("HealthBarBackground");
    const fill = runtimeScene.createObject("HealthBarFill");
    pair = { enemy, background, fill, width: -1, height: -1, ratio: -1, color: "" };
    bars.set(id, pair);
    background.getVariables().get("OwnerEnemyId").setNumber(id);
    fill.getVariables().get("OwnerEnemyId").setNumber(id);
    background.setColor("38;47;35"); background.setOpacity(225);
    // Covers kills, reaching the base, external deletion and scene cleanup.
    const cleanup = () => {
      background.deleteFromScene(); fill.deleteFromScene(); bars.delete(id);
      enemy.unregisterDestroyCallback(cleanup);
    };
    enemy.registerDestroyCallback(cleanup);
  }
  const health = enemy.getBehavior("Health");
  const current = health.Health(), maximum = health.MaxHealth();
  const ratio = maximum > 0 ? Math.max(0, Math.min(1, current / maximum)) : 0;
  const boss = enemy.getVariables().get("EnemyType").getAsString() === "Boss";
  const visualScale=runtimeScene.__worldStyle.enemy;
  const width = Math.round(Math.max(boss ? 48 : 28, Math.min(boss ? 58 : 44, enemy.getWidth() * 0.9)) * visualScale);
  const height = boss ? 9 : 7;
  const x = enemy.getCenterXInScene() - width / 2;
  const y = enemy.getCenterYInScene() - enemy.getHeight()*visualScale/2 - height - Math.max(4, Math.min(7, enemy.getHeight() * 0.12));
  const layer = enemy.getLayer();
  if (pair.background.getLayer() !== layer) pair.background.setLayer(layer);
  if (pair.fill.getLayer() !== layer) pair.fill.setLayer(layer);
  // World layer follows the map camera; UI/HUD layers remain above it.
  const z = Math.max(20, enemy.getZOrder() + 1);
  pair.background.setZOrder(z); pair.fill.setZOrder(z + 1);
  pair.background.setPosition(x, y); pair.fill.setPosition(x + 1, y + 1);
  if (pair.width !== width || pair.height !== height) {
    pair.background.setWidth(width); pair.background.setHeight(height);
    pair.fill.setHeight(height - 2); pair.ratio = -1;
    pair.width = width; pair.height = height;
  }
  if (pair.ratio !== ratio) {
    // Origin is top-left. Only the right edge changes when HP changes.
    pair.fill.setWidth((width - 2) * ratio); pair.ratio = ratio;
  }
  const color = ratio > 0.6 ? "119;191;84" : ratio >= 0.3 ? "238;181;64" : "220;79;64";
  if (pair.color !== color) { pair.fill.setColor(color); pair.color = color; }
  pair.background.hide(enemy.isHidden()); pair.fill.hide(enemy.isHidden() || ratio <= 0);
}