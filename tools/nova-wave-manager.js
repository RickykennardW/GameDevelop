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
  // Fixed archetype stats; composition and gradual pacing supply progression.
  const config = sv.get("NovaWispConfig").toJSObject();
  const distribution=sv.get("EnemyWaveDistribution").toJSObject();
  const total=wave*distribution.TotalMultiplier;
  const hounds=wave<distribution.HoundMinimumWave?0:Math.min(total,(Math.floor((wave-distribution.HoundMinimumWave)/distribution.HoundIncreaseEvery)+1)*distribution.HoundsPerStep);
  const counts={VoidHound:hounds};let remaining=total-hounds-1;
  for(const entry of distribution.AddedTypes||[]){
   const wanted=wave<entry.MinimumWave?0:entry.CountPerStep*(1+Math.floor((wave-entry.MinimumWave)/entry.IncreaseEvery));
   counts[entry.Type]=Math.max(0,Math.min(wanted,remaining));remaining-=counts[entry.Type];
  }
  counts.Basic=total-Object.values(counts).reduce((a,b)=>a+b,0);
  // Preserve every original Hound slot; fairly distribute new types among Nova slots.
  const queue=[],used=Object.fromEntries(Object.keys(counts).map(type=>[type,0]));let otherIndex=0;
  for(let i=0;i<total;i++){
   if(Math.floor((i+1)*hounds/total)>Math.floor(i*hounds/total)){queue.push('VoidHound');used.VoidHound++;continue;}
   let chosen='',best=-Infinity;
   for(const [type,count] of Object.entries(counts))if(type!=='VoidHound'&&used[type]<count){const deficit=(otherIndex+1)*count/(total-hounds)-used[type];if(deficit>best){best=deficit;chosen=type;}}
   queue.push(chosen);used[chosen]++;otherIndex++;
  }
  state.queue=queue;state.index=0;state.elapsed=0;state.wait=3;
  const pacing=sv.get('WavePacing').toJSObject();
  const interval=Math.max(pacing.MinimumInterval,config.SpawnInterval-Math.max(0,wave-pacing.SpeedUpAfterWave)*pacing.IntervalReductionPerWave);
  sv.get("Wave").setNumber(wave);sv.get("SpawnInterval").setNumber(interval);
  sv.get("EnemiesToSpawn").setNumber(queue.length);sv.get("WaveActive").setBoolean(true);message.hide();
}
