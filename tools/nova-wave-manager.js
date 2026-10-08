const sv = runtimeScene.getVariables();
const num = n => sv.get(n).getAsNumber();
const yes = n => sv.get(n).getAsBoolean();
const auto = () => ["Auto","AutoFast"].includes(sv.get("WaveMode").getAsString());
const enemies = runtimeScene.getObjects("Enemy");
const dt = gdjs.evtTools.runtimeScene.getElapsedTimeInSeconds(runtimeScene);
let state = runtimeScene.__waveManager;
if (!state) state = runtimeScene.__waveManager = { queue: [], index: 0, elapsed: 0, wait: 3 };
const message = runtimeScene.getObjects("MessageText")[0];
const idle = !yes("WaveActive") && num("EnemiesToSpawn") === 0 && enemies.length === 0 && state.index >= state.queue.length;
if (!auto() || !idle) state.wait = 3;
else if (num("Wave") > 0 && num("Wave") < 50 && !yes("GameOver")) {
  state.wait = Math.max(0, state.wait - dt);
  message.setString("Wave " + num("Wave") + " Complete\nNext Wave\n" + Math.ceil(state.wait)); message.hide(false);
}
if (idle && !auto() && num("Wave") > 0 && !yes("GameOver")) { message.setString("Wave " + num("Wave") + " Complete! Press PLAY"); message.hide(false); }
sv.get("IntermissionRemaining").setNumber(state.wait);
const manual = !yes("IndexBlocksInput") && sv.get("WaveMode").getAsString() === "Waiting" && (yes("PlayWaveRequested") || gdjs.evtTools.input.wasKeyJustPressed(runtimeScene, "Space"));
if (idle && !yes("GameOver") && num("Lives") > 0 && num("Wave") < 50 && (manual || (auto() && num("Wave") > 0 && state.wait <= 0))) {
  if (!auto()) sv.get("WaveMode").setString("Manual");
  const wave = num("Wave") + 1;
  // One identical Basic Nova Wisp archetype, with count as the only wave scaling.
  const config = sv.get("NovaWispConfig").toJSObject();
  const queue = Array(wave * 4).fill("Basic");
  state.queue=queue;state.index=0;state.elapsed=0;state.wait=3;
  sv.get("Wave").setNumber(wave);sv.get("SpawnInterval").setNumber(config.SpawnInterval);
  sv.get("EnemiesToSpawn").setNumber(queue.length);sv.get("WaveActive").setBoolean(true);message.hide();
}