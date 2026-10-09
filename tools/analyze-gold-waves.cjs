// Config-driven gold plan and armor/DPS compatibility. No dependencies/project writes.
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..'),scene=JSON.parse(fs.readFileSync(path.join(root,'layouts/game-scene.json'),'utf8'));
const unwrap=v=>v.type==='structure'?Object.fromEntries((v.children||[]).map(x=>[x.name,unwrap(x)])):v.type==='array'?(v.children||[]).map(unwrap):v.value;
const values=Object.fromEntries(scene.variables.map(v=>[v.name,unwrap(v)]));
const runtimeScene={getVariables:()=>({get:name=>({toJSObject:()=>values[name],setNumber:v=>values[name]=v})})};
vm.runInNewContext(fs.readFileSync(path.join(root,'tools/gold-budget-runtime.js'),'utf8'),{runtimeScene,Math,Error,Number,Object});
const b=runtimeScene.__goldBudget,rows=[];let cumulative=values.Money,firstElite=null;
for(let w=1;w<=b.config.LastWave;w++){
 const r=b.generate(w);cumulative+=r.spent;if(r.counts.VoidGolem&&firstElite===null)firstElite=w;
 rows.push({wave:w,budget:r.budget,spent:r.spent,unused:r.unused,milestone:r.milestone,counts:r.counts,enemies:r.queue.length,eligible:r.eligible,goldIfAllKilledBeforeSpending:cumulative});
}
const c=values.StarCannonConfig,dps=[];
for(let a=0;a<=4;a++)for(let p=0;p<=4;p++)if(!(a>=3&&p>=3)){
 const count=p>=4?3:p>=3?2:1,raw=c.BaseDamage*c.DamageMultipliers[a]*c.ProjectileFractions[p],interval=c.BaseInterval/c.SpeedMultipliers[p];
 dps.push({build:a+'-'+p,shots:count,perShot:raw,interval,unarmoredDPS:raw*count/interval,golemArmor25DPS:Math.max(1,raw-25)*count/interval,fortifiedGolemArmor35DPS:Math.max(1,raw-35)*count/interval});
}
const out=path.join(root,'design_previews/void_golem/wave-plan.json');
fs.writeFileSync(out,JSON.stringify({method:'actual seeded gold generator;income assumesall kills, no spending/sell;DPS upper bound excludes range,turning,travel,overkill and splash',seed:b.config.Seed,firstEliteWave:firstElite,totalEnemies:rows.reduce((s,r)=>s+r.enemies,0),totalKillGold:rows.reduce((s,r)=>s+r.spent,0),rows,dps},null,2));
console.log('WAVE PLAN',rows.filter(r=>[1,5,10,12,15,20,40,45].includes(r.wave)));console.log('First elite selected',firstElite);console.log('GOLEM DPS',dps.filter(r=>['0-0','4-2','2-4'].includes(r.build)));
