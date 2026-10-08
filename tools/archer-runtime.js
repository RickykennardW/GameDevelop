// Archer modifiers are composed per instance. Existing FireBullet and Health behaviors
// remain the authoritative cooldown, firing, projectile force and damage systems.
const scene = runtimeScene, sv = scene.getVariables();
let archer = scene.__archerSystem;
if (!archer) {
  const config = sv.get("ArcherConfig").toJSObject();
  archer = scene.__archerSystem = { config, visualScale: scene.__worldStyle.archer, projectileVisualScale: 1.8 };
  archer.stats = (a,b) => ({
    Damage: config.BaseDamage + (a>=1 ? config.SharpenedDamage : 0) + (b>=4 ? config.HeavyDamage : 0),
    AttackRange: config.BaseRange + (b>=1 ? config.EagleRange : 0),
    AttackInterval: a>=4 ? config.StormInterval : a>=2 ? config.QuickInterval : config.BaseInterval,
    ProjectileSpeed: b>=2 ? config.SwiftSpeed : config.BaseProjectileSpeed,
    ProjectilePierce: b>=4 ? 3 : b>=3 ? 2 : 1,
    ArcherCount: a>=3 ? 2 : 1
  });
  archer.apply = tower => {
    const v=tower.getVariables(), a=v.get("Path1Level").getAsNumber(), b=v.get("Path2Level").getAsNumber();
    if (!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a>4||b>4||(a>=3&&b>=3)) return false;
    const stats=archer.stats(a,b);
    for(const [name,value] of Object.entries(stats)) v.get(name).setNumber(value);
    v.get("CurrentDamage").setNumber(stats.Damage);v.get("CurrentRange").setNumber(stats.AttackRange);
    v.get("CurrentAttackInterval").setNumber(stats.AttackInterval);v.get("CurrentProjectileSpeed").setNumber(stats.ProjectileSpeed);
    v.get("VisualKey").setString(a+"_"+b);
    tower.setAnimationName(a+"_"+b);tower.setWidth(64);tower.setHeight(64);
    const fire=tower.getBehavior("FireBullet");fire.SetCooldown(stats.AttackInterval);fire.SetBulletQuantity(stats.ArcherCount);
    return true;
  };
  archer.upgrade = (tower,path) => {
    // Validate again here, independent of the card's visual/disabled state.
    if(!scene.getObjects("ArcherTower").includes(tower)||![1,2].includes(path)||sv.get("IndexBlocksInput").getAsBoolean())return false;
    const v=tower.getVariables(),a=v.get("Path1Level").getAsNumber(),b=v.get("Path2Level").getAsNumber();
    if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a>4||b>4||(a>=3&&b>=3))return false;
    const level=path===1?a:b,other=path===1?b:a;
    if(level>=4||(level+1>=3&&other>=3))return false;
    const cost=config.Paths[path-1].Upgrades[level].Cost;
    if(sv.get("Money").getAsNumber()<cost)return false;
    sv.get("Money").setNumber(sv.get("Money").getAsNumber()-cost);
    v.get(path===1?"Path1Level":"Path2Level").setNumber(level+1);
    v.get("TotalInvestment").setNumber(v.get("TotalInvestment").getAsNumber()+cost);
    archer.apply(tower);return true;
  };
}
const towers=scene.getObjects("ArcherTower"), enemies=scene.getObjects("Enemy");
for(const tower of towers) {
  const v=tower.getVariables();
  if(!tower.__archerReady) {
    tower.__archerReady=true;
    if(v.get("TotalInvestment").getAsNumber()<=0)v.get("TotalInvestment").setNumber(v.get("PurchasePrice").getAsNumber()||300);
    archer.apply(tower);
  }
  if(sv.get("GameOver").getAsBoolean())continue;
  let target=null,nearest=Infinity;
  for(const enemy of enemies) {
    if(enemy.getBehavior("Health").IsDead())continue;
    const d=Math.hypot(enemy.getCenterXInScene()-tower.getCenterXInScene(),enemy.getCenterYInScene()-tower.getCenterYInScene());
    if(d<=v.get("AttackRange").getAsNumber()&&d<nearest){target=enemy;nearest=d;}
  }
  if(!target)continue;
  const old=new Set(scene.getObjects("ArcherProjectile"));
  const bulletMap=Hashtable.newFrom({ArcherProjectile:[]}),targetMap=Hashtable.newFrom({Enemy:[target]});
  tower.getBehavior("FireBullet").FireTowardObject(tower.getCenterXInScene(),tower.getCenterYInScene(),bulletMap,targetMap,v.get("ProjectileSpeed").getAsNumber());
  const shots=scene.getObjects("ArcherProjectile").filter(p=>!old.has(p));
  shots.forEach((p,i)=>{
    const pv=p.getVariables();pv.get("RemainingHits").setNumber(v.get("ProjectilePierce").getAsNumber());
    p.setAnimationName(v.get("Path2Level").getAsNumber()>=3?"Bolt":"Arrow");p.setWidth(22);p.setHeight(7);
    // Frame points follow each drawn weapon. Scale about the unchanged tower center.
    const point = i === 0 ? "FirePointA" : "FirePointB";
    const cx=tower.getCenterXInScene(), cy=tower.getCenterYInScene();
    const muzzleX=cx+(tower.getPointX(point)-cx)*archer.visualScale;
    const muzzleY=cy+(tower.getPointY(point)-cy)*archer.visualScale;
    p.setPosition(muzzleX-p.getWidth()/2,muzzleY-p.getHeight()/2);
    p.setLayer(tower.getLayer());p.setZOrder(10);p.setOpacity(255);
    const angle=Math.atan2(target.getCenterYInScene()-p.getCenterYInScene(),target.getCenterXInScene()-p.getCenterXInScene())*180/Math.PI;
    p.setAngle(angle);p.clearForces();p.addPolarForce(angle,v.get("ProjectileSpeed").getAsNumber(),1);
    p.__archerHits=new Set();p.__archerPrevious=[p.getX(),p.getY()];p.__archerAge=0;
  });
}
const owners=new Map([...scene.getObjects("Tower"),...scene.getObjects("ShotgunTower"),...scene.getObjects("RocketTower"),...towers].map(t=>[t.getVariables().get("TowerId").getAsNumber(),t]));
const dt=gdjs.evtTools.runtimeScene.getElapsedTimeInSeconds(scene);
for(const p of scene.getObjects("ArcherProjectile").slice()) {
  const v=p.getVariables();if(!p.__archerHits)p.__archerHits=new Set();
  p.__archerAge=(p.__archerAge||0)+dt;
  if(p.__archerAge>6||v.get("RemainingHits").getAsNumber()<=0){p.deleteFromScene();continue;}
  const end=[p.getX(),p.getY()],start=p.__archerPrevious||end;
  const dx=end[0]-start[0],dy=end[1]-start[1],length=Math.hypot(dx,dy);
  const hits=[];
  for(const enemy of enemies) {
    if(enemy.getBehavior("Health").IsDead()||p.__archerHits.has(enemy.getUniqueId()))continue;
    // Broad phase, then the native collision masks sampled along the actual segment.
    const pad=Math.max(p.getWidth(),p.getHeight());
    if(Math.max(start[0],end[0])+pad<enemy.getX()||Math.min(start[0],end[0])-pad>enemy.getX()+enemy.getWidth()||Math.max(start[1],end[1])+pad<enemy.getY()||Math.min(start[1],end[1])-pad>enemy.getY()+enemy.getHeight())continue;
    const steps=Math.max(1,Math.ceil(length/3));
    for(let i=0;i<=steps;i++) {
      const t=i/steps;p.setPosition(start[0]+dx*t,start[1]+dy*t);
      if(gdjs.RuntimeObject.collisionTest(p,enemy,false)){hits.push({enemy,t});break;}
    }
  }
  p.setPosition(...end);hits.sort((a,b)=>a.t-b.t);
  for(const {enemy} of hits) {
    if(v.get("RemainingHits").getAsNumber()<=0)break;
    const health=enemy.getBehavior("Health"),before=Math.max(0,health.Health());
    if(before<=0)continue;
    p.__archerHits.add(enemy.getUniqueId());health.Hit(v.get("Damage").getAsNumber(),false,false);
    const actual=Math.max(0,before-Math.max(0,health.Health()));
    v.get("ActualDamage").setNumber(actual);
    const owner=owners.get(v.get("OwnerTowerId").getAsNumber());
    if(owner){const dealt=owner.getVariables().get("DamageDealt");dealt.setNumber(dealt.getAsNumber()+actual);}
    v.get("RemainingHits").setNumber(v.get("RemainingHits").getAsNumber()-1);
  }
  if(v.get("RemainingHits").getAsNumber()<=0)p.deleteFromScene();
  else p.__archerPrevious=end;
}