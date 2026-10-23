const sv = runtimeScene.getVariables();
const num = n => sv.get(n).getAsNumber();
const yes = n => sv.get(n).getAsBoolean();
const auto = () => ["Auto","AutoFast"].includes(sv.get("WaveMode").getAsString());
const enemies = runtimeScene.getObjects("Enemy");
const dt = gdjs.evtTools.runtimeScene.getElapsedTimeInSeconds(runtimeScene);
const mission=runtimeScene.__campaignRun;
if(mission)sv.get('MaximumWave').setNumber(mission.level.Waves.length);
const intermission=mission?.level.Intermission??3;
let state = runtimeScene.__waveManager;
if (!state) state = runtimeScene.__waveManager = { queue: [], index: 0, elapsed: 0, wait: 3 };
const message = runtimeScene.getObjects("MessageText")[0];
const idle = !yes("WaveActive") && num("EnemiesToSpawn") === 0 && enemies.length === 0 && state.index >= state.queue.length;
if (!auto() || !idle) state.wait = intermission;
else if (num("Wave") > 0 && num("Wave") < num("MaximumWave") && !yes("GameOver")) {
  state.wait = Math.max(0, state.wait - dt);
  message.setString("Wave " + num("Wave") + " Complete\nNext Wave\n" + Math.ceil(state.wait)); message.hide(false);
}
if (idle && !auto() && num("Wave") > 0 && !yes("GameOver")) { message.setString("Wave " + num("Wave") + " Complete! Press PLAY"); message.hide(false); }
sv.get("IntermissionRemaining").setNumber(state.wait);
const manual = !yes("IndexBlocksInput") && sv.get("WaveMode").getAsString() === "Waiting" && (yes("PlayWaveRequested") || gdjs.evtTools.input.wasKeyJustPressed(runtimeScene, "Space"));
if (idle && !yes("GameOver") && num("Lives") > 0 && num("Wave") < num("MaximumWave") && (!mission||mission.canStart(num('Wave')+1)) && (manual || mission?.pendingWave || (auto() && num("Wave") > 0 && state.wait <= 0))) {
  if (!auto()) sv.get("WaveMode").setString("Manual");
  const wave = num("Wave") + 1;
  const config=sv.get('NovaWispConfig').toJSObject();
  const generated=mission?mission.wavePlan(wave):runtimeScene.__goldBudget.generate(wave);
  runtimeScene.__goldBudget.generations++;
  state.queue=generated.queue;state.index=0;state.elapsed=0;state.wait=intermission;state.composition=generated;
  if(mission)mission.pendingWave=false;
  sv.get('WaveBudget').setNumber(generated.budget);sv.get('WaveBudgetSpent').setNumber(generated.spent);sv.get('WaveBudgetUnused').setNumber(generated.unused);
  sv.get('WaveEnemyCount').setNumber(generated.queue.length);sv.get('WaveIsMilestone').setBoolean(generated.milestone);
  const pacing=sv.get('WavePacing').toJSObject();
  const interval=mission?mission.level.Waves[wave-1].SpawnInterval:Math.max(pacing.MinimumInterval,config.SpawnInterval-Math.max(0,wave-pacing.SpeedUpAfterWave)*pacing.IntervalReductionPerWave);
  sv.get("Wave").setNumber(wave);sv.get("SpawnInterval").setNumber(interval);
  sv.get("EnemiesToSpawn").setNumber(state.queue.length);sv.get("WaveActive").setBoolean(true);message.hide();
}
