// Deterministic composition once per wave; cost is each archetype's kill reward.
const scene=runtimeScene,sv=scene.getVariables();
if(!scene.__goldBudget){
 const config=sv.get('WaveBudgetConfig').toJSObject(),types=sv.get('EnemyTypes').toJSObject();
 const budget=scene.__goldBudget={config,types,generations:0};
 sv.get('MaximumWave').setNumber(config.LastWave);
 budget.value=wave=>{
  const base=config.StartingBudget+config.BudgetIncrement*(wave-1-Math.floor((wave-1)/config.MilestoneEvery));
  return Math.round(base*(wave%config.MilestoneEvery===0?config.MilestoneMultiplier:1));
 };
 budget.rng=wave=>{let seed=(config.Seed^Math.imul(wave,0x9e3779b9))>>>0||1;return()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296;};};
 budget.generate=wave=>{
  if(!Number.isInteger(wave)||wave<1||wave>config.LastWave)throw Error('Wave outside configured budget range');
  const rng=budget.rng(wave),limit=budget.value(wave),milestone=wave%config.MilestoneEvery===0;
  // GDevelop structures may serialize children in another order. Stable names
  // keep seeded plans identical in the editor, native preview and config audit.
  const eligible=Object.keys(types).sort().filter(t=>wave>=(types[t].MinimumWave??(t==='Basic'?1:4))&&types[t].Reward>0);
  const common=eligible.filter(t=>types[t].Classification!=='Elite'),elites=eligible.filter(t=>types[t].Classification==='Elite'&&wave>=config.EliteUnlockAfterWave+1);
  const cost=t=>types[t].Reward,queue=[],counts=Object.fromEntries(Object.keys(types).map(t=>[t,0]));let remaining=limit;
  const weighted=pool=>{let weight=pool.reduce((s,t)=>s+(config.CommonWeights[t]||1)*(milestone&&types[t].Armor>0?config.MilestoneArmorWeight:1),0),roll=rng()*weight;for(const t of pool){roll-=(config.CommonWeights[t]||1)*(milestone&&types[t].Armor>0?config.MilestoneArmorWeight:1);if(roll<=0)return t;}return pool[pool.length-1];};
  if(elites.length){
   const chance=Math.min(config.EliteMaxChance,config.EliteBaseChance+Math.max(0,wave-12)*config.EliteChancePerWave+(milestone?config.EliteMilestoneChanceBonus:0));
   if(rng()<chance){
    const elite=elites[Math.floor(rng()*elites.length)],cap=Math.min(config.EliteMaxCount,1+Math.floor(Math.max(0,wave-types[elite].MinimumWave)/config.EliteCountEvery),Math.floor(limit*(milestone?config.EliteMilestoneBudgetShare:config.EliteBudgetShare)/cost(elite)));
    const count=cap>0?1+Math.floor(rng()*cap):0;
    for(let i=0;i<count;i++){queue.push(elite);counts[elite]++;remaining-=cost(elite);}
   }
  }
  const pool=[],choices=common.slice(),poolCount=1+Math.floor(rng()*Math.min(config.MaxCommonTypes,common.length));
  const armored=choices.filter(t=>types[t].Armor>0);
  if(milestone&&config.MilestoneGuaranteeArmored&&armored.length){const chosen=weighted(armored);pool.push(chosen);choices.splice(choices.indexOf(chosen),1);}
  while(pool.length<poolCount&&choices.length){const chosen=weighted(choices);pool.push(chosen);choices.splice(choices.indexOf(chosen),1);}
  while(true){const affordable=pool.filter(t=>cost(t)<=remaining);if(!affordable.length)break;const t=weighted(affordable);queue.push(t);counts[t]++;remaining-=cost(t);}
  // Repair a small common tail using unlocked coins. No over-budget or elite add-ons.
  const reach=amount=>{
   const dp=new Array(amount+1).fill(null);dp[0]=[];
   for(let sum=1;sum<=amount;sum++)for(const t of common)if(cost(t)<=sum&&dp[sum-cost(t)]!==null){dp[sum]=dp[sum-cost(t)].concat(t);break;}
   return dp[amount];
  };
  if(remaining>0){
   let refund=remaining,removed=0,replacement=reach(refund);
   while(replacement===null&&removed<8&&queue.length&&types[queue[queue.length-1]].Classification!=='Elite'){
    const t=queue.pop();counts[t]--;refund+=cost(t);removed++;replacement=reach(refund);
   }
   if(replacement!==null){for(const t of replacement){queue.push(t);counts[t]++;}remaining=0;}
   else remaining=refund;
  }
  for(let i=queue.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[queue[i],queue[j]]=[queue[j],queue[i]];}
  const spent=queue.reduce((s,t)=>s+cost(t),0);if(spent>limit)throw Error('Wave budget exceeded');
  return{wave,budget:limit,spent,unused:limit-spent,milestone,queue,counts,eligible};
 };
}
