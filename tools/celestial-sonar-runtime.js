// Read-only route ETA observer. Native movement, damage, Lives and waves remain owners.
const scene=runtimeScene,sv=scene.getVariables(),game=scene.getGame();
let sonar=scene.__celestialSonar;
if(!sonar){
 const config=sv.get('CelestialSonarConfig').toJSObject();
 sonar=scene.__celestialSonar={config,state:'NORMAL',now:0,lastAlert:'NORMAL',nextSound:0,nextRepeat:0,nearest:null,count:0,disposed:false,sounds:{WARNING:0,CRITICAL:0}};
 sonar.stop=()=>{
  for(const voice of scene.__audio?.voices||[])if(voice.key===config.WarningSound||voice.key===config.CriticalSound){voice.sound?.stop();voice.end=0;}
 };
 const world=sonar.world=new PIXI.Graphics(),hud=sonar.hud=new PIXI.Graphics();world.interactive=false;hud.interactive=false;world.zIndex=19800;hud.zIndex=30009;scene.getLayer('').getRenderer().getRendererObject().addChild(world);scene.getLayer('UI').getRenderer().getRendererObject().addChild(hud);
 const mark=sonar.mark=new PIXI.Text('!',{fontFamily:'Arial',fontSize:12,fontWeight:'bold',fill:0xf4bd75});mark.interactive=false;mark.zIndex=30010;scene.getLayer('UI').getRenderer().getRendererObject().addChild(mark);mark.visible=false;
 sonar.estimate=(enemy,points,tail,scale)=>{
  const v=enemy.getVariables();if(enemy.getBehavior('Health').IsDead()||v.get('PathFinished').getAsBoolean()||v.get('EnemyState').getAsString()==='Dying')return null;
  const waypoint=Math.max(0,Math.floor(v.get('Waypoint').getAsNumber())),speed=v.get('MoveSpeed').getAsNumber();
  if(waypoint>=points.length||!Number.isFinite(speed)||speed<=.000001)return null;
  const point=points[waypoint],distance=Math.hypot(enemy.getCenterXInScene()-point.X,enemy.getCenterYInScene()-point.Y)+tail[waypoint];
  const g=enemy.__golemState,cast=g?.casting?Math.max(0,scene.__voidGolem.config.Skill.CastDuration-(scene.__voidGolem.frameTime-g.castStart)):0;
  const eta=(distance/speed+cast)/scale;if(!Number.isFinite(eta))return null;return{id:enemy.getUniqueId(),eta,distance,speed,cast};
 };
 sonar.paint=()=>{
  world.clear();hud.clear();mark.visible=false;if(sonar.state==='NORMAL')return;
  const end=sonar.points?.at(-1),base=scene.getObjects('BaseMarker')[0];if(!end||!base)return;
  const critical=sonar.state==='CRITICAL',color=critical?0xff7c94:0xe9ba70,period=critical?config.CriticalPeriod:config.WarningPeriod,phase=(sonar.now%period)/period,zoom=scene.getLayer('').getCameraZoom();
  const r=base.getWidth()*(scene.__worldStyle?.base||1)/2+10,reduced=config.ReducedMotion||typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  for(let i=0;i<(critical?2:1);i++){
   const t=reduced?i*.35:(phase+i*.45)%1;world.lineStyle(1.2/zoom,color,reduced?.75:(1-t)*.72+.12).drawCircle(end.X,end.Y,r+(reduced?i*10:t*30));
  }
  // Different ring counts and notch patterns distinguish urgency beyond hue.
  for(let i=0;i<(critical?8:4);i++){const a=i*Math.PI/(critical?4:2),ra=r+3;world.lineStyle(1.5/zoom,color,.8).moveTo(end.X+Math.cos(a)*ra,end.Y+Math.sin(a)*ra).lineTo(end.X+Math.cos(a)*(ra+9),end.Y+Math.sin(a)*(ra+9));}
  const lives=scene.getObjects('LivesText')[0];if(lives){const x=lives.getX(),y=lives.getY(),w=lives.getWidth(),h=lives.getHeight();hud.lineStyle(1,color,.8).drawRoundedRect(x-4,y-2,w+8,h+4,5);if(critical)hud.lineStyle(1,color,.4).drawRoundedRect(x-6,y-4,w+12,h+8,6);mark.text=critical?'!!':'!';mark.style.fill=color;mark.position.set(x+w-7,y-10);mark.visible=true;}
 };
 sonar.update=()=>{
  if(sonar.disposed)return;const scale=scene.getTimeManager().getTimeScale(),elapsed=scene.getTimeManager().getElapsedTime();
  if(scale<=0||elapsed<=0)return;sonar.now+=Math.max(0,elapsed/scale/1000);
  const previous=sonar.state;sonar.nearest=null;sonar.count=0;
  if(config.Enabled&&!sv.get('GameOver').getAsBoolean()&&sv.get('Lives').getAsNumber()>0){
   const count=sv.get('MonsterPathPointCount').getAsNumber(),points=sv.get('MonsterPathPoints').toJSObject().slice(0,count),tail=new Array(points.length).fill(0);sonar.points=points;
   for(let i=points.length-2;i>=0;i--)tail[i]=tail[i+1]+Math.hypot(points[i+1].X-points[i].X,points[i+1].Y-points[i].Y);
   for(const enemy of scene.getObjects('Enemy')){const threat=sonar.estimate(enemy,points,tail,scale);if(!threat||threat.eta>config.WarningSeconds+(previous==='NORMAL'?0:config.HysteresisSeconds))continue;sonar.count++;if(!sonar.nearest||threat.eta<sonar.nearest.eta)sonar.nearest=threat;}
  }
  let desired=!sonar.nearest?'NORMAL':sonar.nearest.eta<=config.CriticalSeconds+(previous==='CRITICAL'?config.HysteresisSeconds:0)?'CRITICAL':'WARNING';
  // Immediate escalation/clear; small real-time debounce only for a live downgrade.
  if(previous==='CRITICAL'&&desired==='WARNING'){
   if(!sonar.downgradeAt)sonar.downgradeAt=sonar.now+config.DeescalationSeconds;
   if(sonar.now<sonar.downgradeAt)desired='CRITICAL';
  }else sonar.downgradeAt=0;
  sonar.state=desired;
  if(desired==='NORMAL'){
   if(previous!=='NORMAL')sonar.stop();
   sonar.nextRepeat=0;sonar.lastAlert='NORMAL';sonar.downgradeAt=0;
   // Keep the minimum audio gap across brief NORMAL periods, never the repeat.
  }else{
   const interval=desired==='CRITICAL'?config.CriticalRepeatSeconds:config.WarningRepeatSeconds;
   if(previous!==desired){
    if(desired==='CRITICAL')sonar.stop();
    sonar.nextRepeat=previous==='CRITICAL'?sonar.now+interval:sonar.now;
   }
   if(sonar.now>=sonar.nextSound&&sonar.now>=sonar.nextRepeat){
    // A single owned voice: escalation can replace Warning but never stack it.
    sonar.stop();
    const played=scene.__audio?.play(sonar.state==='CRITICAL'?config.CriticalSound:config.WarningSound);if(played)sonar.sounds[sonar.state]++;
    sonar.lastAlert=sonar.state;sonar.nextSound=sonar.now+config.GlobalCooldown;sonar.nextRepeat=sonar.now+interval;
   }
  }
  sonar.paint();
 };
 sonar.dispose=()=>{if(sonar.disposed)return;sonar.disposed=true;sonar.stop();world.destroy();hud.destroy();mark.destroy();};
 if(!gdjs.__celestialSonarCallbacks){gdjs.__celestialSonarCallbacks=true;gdjs.callbacksRuntimeSceneUnloading.push(s=>s.__celestialSonar?.dispose());}
}
sonar.update();
