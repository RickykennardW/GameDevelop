// Dependency-free numerical model. Native gameplay tests separately verify it.
// Uses the actual route, native component muzzle geometry, config, fixed armor,
// nearest-target lock, turn rate and homing travel. No enemy HP/speed scaling.
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'design_previews/gameplay_balance');
const before=JSON.parse(fs.readFileSync(path.join(out,'before-config.json'),'utf8'));
const probe=JSON.parse(fs.readFileSync(path.join(out,'before-healthbars.json'),'utf8')).result;
const unwrap=v=>v.type==='structure'?Object.fromEntries((v.children||[]).map(x=>[x.name,unwrap(x)])):v.type==='array'?(v.children||[]).map(unwrap):v.value;
const live=()=>Object.fromEntries(JSON.parse(fs.readFileSync(path.join(root,'layouts/game-scene.json'),'utf8')).variables.map(v=>[v.name,unwrap(v)]));
const valid=(a,b)=>a>=0&&b>=0&&a<=4&&b<=4&&!(a>=3&&b>=3);
function stats(v,a,b){
 if(!valid(a,b))return null;
 const c=v.StarCannonConfig,modern=!!c.DamageMultipliers;
 const damage=c.BaseDamage*(modern?c.DamageMultipliers[a]:(a>=1?1.15:1)*(a>=2?1.15:1)*(a>=4?1.35:1));
 const fraction=modern?c.ProjectileFractions[b]:b>=4?.60:b>=3?.65:1;
 const count=b>=4?3:b>=3?2:1;
 return {damage,range:c.BaseRange*(modern?c.Path1RangeMultipliers[a]*c.Path2RangeMultipliers[b]:(a>=2?1.05:1)*(b>=2?1.05:1)),
  interval:c.BaseInterval/(modern?c.SpeedMultipliers[b]:(b>=1?1.15:1)*(b>=2?1.10:1)),count,shot:damage*fraction,
  splash:modern?c.SplashRatios[a]:a>=4?.65:a>=3?.4:0,radius:modern?c.SplashRadii[a]:a>=4?c.ExplosionRadius*1.4:a>=3?c.ExplosionRadius:0};
}
const cost=(v,a,b)=>v.TowerShopCatalog[0].Cost+v.StarCannonConfig.Paths[0].Upgrades.slice(0,a).reduce((s,u)=>s+u.Cost,0)+v.StarCannonConfig.Paths[1].Upgrades.slice(0,b).reduce((s,u)=>s+u.Cost,0);
function queue(v,wave){
 const d=v.EnemyWaveDistribution,total=wave*d.TotalMultiplier,hounds=wave<d.HoundMinimumWave?0:Math.min(total,(1+Math.floor((wave-d.HoundMinimumWave)/d.HoundIncreaseEvery))*d.HoundsPerStep);
 const counts={VoidHound:hounds};let remaining=total-hounds-1;
 for(const e of d.AddedTypes){const wanted=wave<e.MinimumWave?0:e.CountPerStep*(1+Math.floor((wave-e.MinimumWave)/e.IncreaseEvery));counts[e.Type]=Math.max(0,Math.min(wanted,remaining));remaining-=counts[e.Type];}
 counts.Basic=total-Object.values(counts).reduce((a,b)=>a+b,0);
 const used=Object.fromEntries(Object.keys(counts).map(t=>[t,0])),q=[];let other=0;
 for(let i=0;i<total;i++){
  if(Math.floor((i+1)*hounds/total)>Math.floor(i*hounds/total)){q.push('VoidHound');used.VoidHound++;continue;}
  let chosen='',best=-Infinity;for(const [t,c]of Object.entries(counts))if(t!=='VoidHound'&&used[t]<c){const deficit=(other+1)*c/(total-hounds)-used[t];if(deficit>best){best=deficit;chosen=t;}}
  q.push(chosen);used[chosen]++;other++;
 }return {q,counts};
}
const pacing=(v,w)=>v.WavePacing?Math.max(v.WavePacing.MinimumInterval,v.NovaWispConfig.SpawnInterval-Math.max(0,w-v.WavePacing.SpeedUpAfterWave)*v.WavePacing.IntervalReductionPerWave):v.NovaWispConfig.SpawnInterval;
const damage=(v,raw,armor)=>Math.max(v.StarCannonConfig.MinimumDamage||0,raw-armor);
function builds(v){const r=[];for(let a=0;a<=4;a++)for(let b=0;b<=4;b++)if(valid(a,b)){
 const s=stats(v,a,b),c=cost(v,a,b),row={build:a+'-'+b,cost:c,damage:s.damage,interval:s.interval,range:s.range,shots:s.count,perShot:s.shot,splashRatio:s.splash,splashRadius:s.radius,dps:s.shot*s.count/s.interval,dpsPer1000Gold:s.shot*s.count/s.interval/c*1000};
 row.armoredDPS=Object.fromEntries(Object.entries(v.EnemyTypes).map(([t,e])=>[t,damage(v,s.shot,e.Armor)*s.count/s.interval]));
 row.splashDPSPerNeighbour=s.shot*s.splash/s.interval;row.marginal=[];
 for(const [x,y,which]of [[a-1,b,1],[a,b-1,2]])if(valid(x,y)){const prior=stats(v,x,y),delta=c-cost(v,x,y);row.marginal.push({path:which,cost:delta,dpsGain:row.dps-prior.shot*prior.count/prior.interval,dpsGainPerGold:(row.dps-prior.shot*prior.count/prior.interval)/delta,rangeGain:s.range-prior.range});}
 r.push(row);}return r;}
function economy(v){let gold=v.Money;const rows=[];for(let w=1;w<=50;w++){
 const {counts}=queue(v,w),kills=Object.entries(counts).reduce((s,[t,n])=>s+n*v.EnemyTypes[t].Reward,0),bonus=v.WaveCompletionReward??100;gold+=kills+bonus;
 rows.push({wave:w,counts,total:w*4,spawnInterval:pacing(v,w),killIncome:kills,completion:bonus,income:kills+bonus,cumulativeGold:gold,HPBudget:Object.entries(counts).reduce((s,[t,n])=>s+n*v.EnemyTypes[t].HP,0)});
 }return rows;}
const route=probe.route,segments=[];let routeLength=0;
for(let i=1;i<route.length;i++){const a=route[i-1],b=route[i],length=Math.hypot(b.X-a.X,b.Y-a.Y);segments.push({start:routeLength,length,x:a.X,y:a.Y,dx:(b.X-a.X)/length,dy:(b.Y-a.Y)/length});routeLength+=length;}
const position=e=>{while(e.seg+1<segments.length&&e.progress>segments[e.seg].start+segments[e.seg].length)e.seg++;const s=segments[e.seg],d=e.progress-s.start;e.x=s.x+s.dx*d;e.y=s.y+s.dy*d;};
const wrap=d=>(d+540)%360-180;
function component(t,v,points){
 const m=v.StarComponentConfig.States[t.a+'_'+t.b],size=160,bs=size*m.Base.Scale;
 const x=t.x+(m.Base.Socket[0]-m.Base.Contact[0])*bs,y=t.y+(m.Base.Socket[1]-m.Base.Contact[1])*bs;
 if(!points)return [x,y];
 const ts=size*m.Turret.Scale,r=(t.facing-m.RestFacing)*Math.PI/180,c=Math.cos(r),s=Math.sin(r),anchor=m.Turret.Pivot;
 return m.Turret.Muzzles.slice(0,t.s.count).map(([px,py],i)=>({x:x+(px-anchor[0])*ts*c-(py-anchor[1])*ts*s,y:y+(px-anchor[0])*ts*s+(py-anchor[1])*ts*c,heading:t.facing+m.Turret.MuzzleFacing[i]-m.RestFacing}));
}
function simulate(v,wave,placements,dt=.05){
 const q=queue(v,wave).q,interval=pacing(v,wave),towers=placements.map(([x,y,a,b])=>({x,y,a,b,s:stats(v,a,b),cooldown:0,target:null,facing:v.StarComponentConfig.States[a+'_'+b].RestFacing}));
 let time=0,next=interval,index=0,killed=0,leaked=0,totalDamage=0,projectiles=[],active=[],uid=0;
 while(time<350&&(index<q.length||active.length)){
  time+=dt;
  while(index<q.length&&time+1e-8>=next){const type=q[index++],c=v.EnemyTypes[type],e={id:++uid,type,hp:c.HP,speed:c.Speed,armor:c.Armor,progress:0,seg:0,alive:true};position(e);active.push(e);next+=interval;}
  for(const e of active){e.progress+=e.speed*dt;if(e.progress>=routeLength){e.alive=false;leaked++;}else position(e);}
  const hit=(e,raw)=>{if(!e.alive)return;const d=Math.min(e.hp,damage(v,raw,e.armor));e.hp-=d;totalDamage+=d;if(e.hp<=1e-8){e.alive=false;killed++;}};
  for(const t of towers){
   t.cooldown=Math.max(0,t.cooldown-dt);const range2=t.s.range*t.s.range,inRange=e=>e&&e.alive&&(e.x-t.x)**2+(e.y-t.y)**2<=range2;
   if(!inRange(t.target)){t.target=null;let nearest=Infinity;for(const e of active)if(inRange(e)){const d=(e.x-t.x)**2+(e.y-t.y)**2;if(d<nearest){nearest=d;t.target=e;}}}
   if(!t.target)continue;const pivot=component(t,v),angle=Math.atan2(t.target.y-pivot[1],t.target.x-pivot[0])*180/Math.PI,d=wrap(angle-t.facing),limit=v.StarComponentConfig.RotationDegreesPerSecond*dt;
   t.facing=wrap(t.facing+Math.max(-limit,Math.min(limit,d)));
   if(t.cooldown>0||Math.abs(wrap(angle-t.facing))>v.StarComponentConfig.FireToleranceDegrees)continue;
   for(const p of component(t,v,true)){
    const h=p.heading*Math.PI/180,contact=(t.target.x-p.x)*Math.cos(h)+(t.target.y-p.y)*Math.sin(h)<=0;
    projectiles.push({...p,t,enemy:t.target,age:0,fresh:true,contact});
   }t.cooldown=t.s.interval;
  }
  const liveShots=[];
  for(const p of projectiles){
   p.age+=dt;if(!p.enemy.alive||p.age>6)continue;if(p.fresh){p.fresh=false;liveShots.push(p);continue;}
   const e=p.enemy,dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy),travel=v.StarCannonConfig.ProjectileSpeed*dt;
   if(!p.contact&&d>travel+4){p.x+=dx/d*travel;p.y+=dy/d*travel;liveShots.push(p);continue;}
   hit(e,p.t.s.shot);if(p.t.s.splash>0)for(const other of active)if(other!==e&&other.alive&&Math.hypot(other.x-e.x,other.y-e.y)<=p.t.s.radius)hit(other,p.t.s.shot*p.t.s.splash);
  }
  projectiles=liveShots;active=active.filter(e=>e.alive);
 }
 return {wave,killed,leaked,total:q.length,clear:leaked===0&&killed===q.length,simulationSeconds:+time.toFixed(2),investment:placements.reduce((s,[x,y,a,b])=>s+cost(v,a,b),0),damage:+totalDamage.toFixed(2),placements};
}
const candidate=JSON.parse(JSON.stringify(before)),c=candidate.StarCannonConfig;
c.DamageMultipliers=[1,1.12,1.24,1.24,1.48];c.SpeedMultipliers=[1,1.10,1.22,1.22,1.22];c.Path1RangeMultipliers=[1,1,1.04,1.04,1.04];c.Path2RangeMultipliers=[1,1,1.04,1.04,1.04];c.ProjectileFractions=[1,1,1,.62,.56];c.SplashRatios=[0,0,0,.25,.40];c.SplashRadii=[0,0,0,64,84];c.MinimumDamage=1;
c.Paths[0].Upgrades.forEach((u,i)=>u.Cost=[160,300,1100,2800][i]);c.Paths[1].Upgrades.forEach((u,i)=>u.Cost=[130,280,1000,2500][i]);
candidate.WaveCompletionReward=60;candidate.WavePacing={MinimumInterval:.36,SpeedUpAfterWave:5,IntervalReductionPerWave:.015};
candidate.EnemyWaveDistribution.AddedTypes.find(e=>e.Type==='VoidGuard').CountPerStep=3;
candidate.EnemyWaveDistribution.AddedTypes.find(e=>e.Type==='VoidBrute').CountPerStep=2;
const selected=process.argv.includes('--live')?live():candidate;
const table={before:builds(before),after:builds(selected),economyBefore:economy(before),economyAfter:economy(selected),candidate:selected,routeLength,model:'50ms deterministic fixed-stat homing/turning/nearest-target model; native confirmation required'};
fs.writeFileSync(path.join(out,'balance-analysis.json'),JSON.stringify(table,null,2));
const waves=[1,5,10,15,20,35,50],points=probe.spots;
const scenarios={base:[[800,352,0,0]],max42:[[800,352,4,2]],max24:[[800,352,2,4]],sixBasic:[[300,352,0,0],[800,352,0,0],[1300,352,0,0],[400,616,0,0],[900,616,0,0],[1400,616,0,0]],mixed:[[300,352,2,0],[800,352,3,2],[1300,352,2,3],[400,616,1,1],[900,616,2,1],[1400,616,0,0]]};
const results={before:{},after:{}};
for(const [label,config]of [['before',before],['after',selected]])for(const [name,placements]of Object.entries(scenarios))results[label][name]=waves.map(w=>simulate(config,w,placements));
results.after.max42Positions=points.map(p=>simulate(selected,50,[p.concat([4,2])]));results.after.max24Positions=points.map(p=>simulate(selected,50,[p.concat([2,4])]));
fs.writeFileSync(path.join(out,'numerical-scenarios.json'),JSON.stringify(results,null,2));
for(const label of ['before','after'])for(const [name,rows]of Object.entries(results[label]))console.log(label,name,rows.map(r=>'W'+r.wave+':'+r.killed+'/'+r.total).join(' '));
console.log('GOLD',table.economyAfter.filter(r=>[5,10,15,20].includes(r.wave)).map(r=>[r.wave,r.cumulativeGold]));
module.exports={stats,cost,queue,pacing,simulate};
