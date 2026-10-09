step(5);const B=scene.__goldBudget,stats=vars.get('EnemyTypes').toJSObject(),near=(a,b)=>Math.abs(a-b)<1e-7;
const expected={1:100,2:150,3:200,4:250,5:360,6:300,7:350,8:400,9:450,10:600,11:500,12:550,15:840,16:700,45:2280};
for(const [wave,value]of Object.entries(expected))ok(B.value(+wave)===value,'specified budget '+wave+'='+value);
ok(v('MaximumWave')===45&&v('WaveCompletionReward')===0,'45 waves/kill-only income/no completion gift');
const originalSeed=B.config.Seed;let eliteWaves=0,nonEliteLate=0,lateBasic=false,singleType=false,mixed=false;
for(let seed=1;seed<=32;seed++){
 B.config.Seed=seed;
 for(let wave=1;wave<=45;wave++){
  const r=B.generate(wave),sum=r.queue.reduce((s,t)=>s+stats[t].Reward,0),theoretical=(100+50*(wave-1-Math.floor((wave-1)/5)))*(wave%5===0?1.2:1);
  ok(r.budget===theoretical&&sum===r.spent&&r.spent<=r.budget&&r.unused===r.budget-r.spent,'cost/budget accounting '+seed+'/'+wave);
  ok(r.unused===0,'efficient exact spend '+seed+'/'+wave);
  ok(r.queue.every(t=>stats[t]&&wave>=(stats[t].MinimumWave??1)),'only unlocked existing archetypes '+seed+'/'+wave);
  const elites=r.counts.VoidGolem;
  ok(wave>=12||elites===0,'Golem unlock12 '+seed+'/'+wave);
  ok(elites<=5&&elites*20<=r.budget*(wave%5===0?.15:.1)+1e-7,'elite count/budget share cap '+seed+'/'+wave);
  if(wave%5===0&&wave>=10)ok(r.counts.VoidGuard+r.counts.VoidBrute>0,'milestone includes durable commons '+seed+'/'+wave);
  const represented=Object.values(r.counts).filter(n=>n>0).length;singleType||=represented===1;mixed||=represented>1;
  if(wave>=12){if(elites)eliteWaves++;else nonEliteLate++;}
  if(wave>=20&&r.counts.Basic>0)lateBasic=true;
 }
}
B.config.Seed=originalSeed;
ok(eliteWaves>0&&nonEliteLate>0&&lateBasic&&singleType&&mixed,'elite uncommon/not forced;commons late;single/mixed compositions supported');
for(const wave of [1,5,12,15,20,40,45])ok(JSON.stringify(B.generate(wave))===JSON.stringify(B.generate(wave)),'repeatable seeded generation '+wave);
ok(B.generate(40).eligible.includes('Basic')&&B.generate(40).eligible.length===6,'no arbitrary maximum unlock wave;all six eligible late');
let threw=false;try{B.generate(46);}catch(e){threw=true;}ok(threw,'no wave46');
const config={...B.config};B.config.StartingBudget=200;B.config.BudgetIncrement=25;B.config.MilestoneEvery=3;B.config.MilestoneMultiplier=1.5;
ok(B.value(1)===200&&B.value(3)===375&&B.value(4)===250,'budget formula fully configurable');Object.assign(B.config,config);
const before=v('Money'),generated=B.generations;clickObject(get('ShopPlayButton')[0]);
ok(v('Wave')===1&&scene.__waveManager.queue.length===20&&B.generations===generated+1,'native wave1 has20 enemies,not wave*4');
ok(v('Money')===before,'budget is not granted when wave starts');step(100);
ok(B.generations===generated+1&&scene.__waveManager.index>0&&scene.__waveManager.index<20,'progressive spawning /one composition per wave');
lines.push('ALL GOLD BUDGET TESTS PASSED');output.textContent=lines.join('\n');document.title='PASS '+(lines.length-1)+' budget checks';
