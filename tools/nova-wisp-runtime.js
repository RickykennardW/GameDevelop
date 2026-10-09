// One archetype, four genuine views. Animation transforms never move the route collider.
const scene=runtimeScene,sv=scene.getVariables(),get=n=>scene.getObjects(n);
let nova=scene.__novaWisp;
if(!nova){
 const config=sv.get('NovaWispConfig').toJSObject();
 nova=scene.__novaWisp={config,atlases:new Map()};
 nova.ensure=e=>{
  if(e.getVariables().get('EnemyType').getAsString()==='VoidHound')return scene.__voidHound.ensure(e);
  if(e.__novaUid===e.getUniqueId())return e.__novaState;
  const cx=e.getCenterXInScene(),cy=e.getCenterYInScene();e.setWidth(48);e.setHeight(48);e.setPosition(cx-24,cy-24);e.setAngle(0);e.flipX(false);
  e.__novaUid=e.getUniqueId();e.__novaState={age:0,hit:0,lastHP:e.getBehavior('Health').Health(),phase:(e.getUniqueId()*.61803398875%1)*Math.PI*2};
  const v=e.getVariables();v.get('EnemyName').setString('Nova Wisp');v.get('EnemyType').setString('Basic');v.get('Armor').setNumber(0);
  v.get('RewardPaid').setBoolean(false);v.get('Facing').setString(v.get('Facing').getAsString()||'Right');return e.__novaState;
 };
 nova.atlas=direction=>{
  if(nova.atlases.has(direction))return nova.atlases.get(direction);
  const meta=config.Views[direction],texture=scene.getGame().getImageManager().getPIXITexture(meta.Image),w=texture.width,h=texture.height;
  const crop=rect=>new PIXI.Texture(texture.baseTexture,new PIXI.Rectangle(Math.round(rect[0]*w),Math.round(rect[1]*h),Math.round(rect[2]*w),Math.round(rect[3]*h)));
  const data={meta,texture,w,h,crystals:meta.Crystals.map(c=>({texture:crop(c.Rect),...c})),pieces:[]};
  for(let y=0;y<2;y++)for(let x=0;x<3;x++){const rect=[.16+x*.24,.26+y*.25,.24,.25];data.pieces.push({rect,texture:crop(rect)});}
  nova.atlases.set(direction,data);return data;
 };
 nova.rig=(o,direction,death=false)=>{
  const root=o.getRendererObject();let rig=o.__novaRig;
  if(!rig||rig.owner!==o.getUniqueId()||rig.container.destroyed){
   if(rig&&!rig.container.destroyed)rig.container.destroy({children:true,texture:false,baseTexture:false});
   const container=new PIXI.Container(),body=new PIXI.Sprite(),mask=new PIXI.Graphics(),crystals=[],glow=new PIXI.Graphics(),shadow=new PIXI.Graphics(),pieces=[];
   container.addChild(shadow,body,mask);body.mask=mask;container.addChild(glow);
   for(let i=0;i<4;i++){const sprite=new PIXI.Sprite();container.addChild(sprite);crystals.push(sprite);}
   if(death)for(let i=0;i<6;i++){const sprite=new PIXI.Sprite();container.addChild(sprite);pieces.push(sprite);}
   rig=o.__novaRig={owner:o.getUniqueId(),container,body,mask,crystals,glow,shadow,pieces,direction:'',death};root.addChild(container);
   const cleanup=()=>{if(!container.destroyed)container.destroy({children:true,texture:false,baseTexture:false});o.unregisterDestroyCallback(cleanup);};o.registerDestroyCallback(cleanup);
  }
  if(rig.container.parent!==root)root.addChild(rig.container);
  if(rig.direction!==direction){
   rig.direction=direction;const a=nova.atlas(direction),w=a.w,h=a.h;rig.atlas=a;
   rig.body.texture=a.texture;rig.body.anchor.set(.5);rig.mask.clear().beginFill(0xffffff).drawRect(-w/2,-h/2,w,h);
   for(const c of a.crystals){rig.mask.beginHole().drawPolygon(c.Hull.flatMap(([x,y])=>[(x-.5)*w,(y-.5)*h])).endHole();}rig.mask.endFill();
   rig.crystals.forEach((s,i)=>{const c=a.crystals[i];s.visible=!!c;if(c){s.texture=c.texture;s.anchor.set(.5);s.__base=[(c.Rect[0]+c.Rect[2]/2-.5)*w,(c.Rect[1]+c.Rect[3]/2-.5)*h];}});
   rig.pieces.forEach((s,i)=>{const c=a.pieces[i];s.texture=c.texture;s.anchor.set(.5);s.__base=[(c.rect[0]+c.rect[2]/2-.5)*w,(c.rect[1]+c.rect[3]/2-.5)*h];});
   rig.shadow.clear().beginFill(0x160f30,.25).drawEllipse(0,h*.41,w*.16,h*.035).endFill();
  }
  return rig;
 };
 nova.death=e=>{
  const state=nova.ensure(e),o=scene.createObject('NovaWispDeathVisual'),v=e.getVariables(),direction=v.get('Facing').getAsString()||'Right';
  o.setLayer(e.getLayer());o.setAnimationName('NovaDeath_'+direction);o.setWidth(48);o.setHeight(48);o.setPosition(e.getCenterXInScene()-24,e.getCenterYInScene()-24);
  o.setZOrder(e.getZOrder());o.__novaDeath={age:0,life:.65,direction,phase:state.phase,bob:Math.sin(state.age*3.5+state.phase)*1.4};return o;
 };
 nova.animate=(o,direction,state,death=false)=>{
  o.updatePreRender(scene);const rig=nova.rig(o,direction,death),a=rig.atlas,w=a.w,h=a.h,root=o.getRendererObject(),size=48*scene.__worldStyle.enemy;
  const age=state.age,phase=age*(death?7:3.5)+state.phase,bob=death?state.bob:Math.sin(phase)*1.4,hit=death?0:state.hit;
  root.texture=PIXI.Texture.EMPTY;root.anchor.set(0);root.position.set(o.getCenterXInScene(),o.getCenterYInScene()+bob);root.scale.set(size/w,size/h);root.rotation=0;
  rig.body.position.set(hit?Math.sin(age*180)*24:0,hit?Math.cos(age*140)*12:0);rig.body.scale.set(1);rig.body.alpha=1;rig.body.tint=hit?0xcceeff:0xffffff;
  rig.crystals.forEach((s,i)=>{if(s.visible){s.position.set(s.__base[0]+Math.sin(phase+i)*w*.006,s.__base[1]+Math.sin(phase*.8+i*1.7)*h*.018);s.scale.set(1);s.alpha=1;}});
  rig.shadow.alpha=1;rig.shadow.position.y=-bob*w/size;
  const g=rig.glow,cx=(a.meta.Core[0]-.5)*w,cy=(a.meta.Core[1]-.5)*h,pulse=.12+.08*Math.sin(age*4+state.phase);g.clear();
  g.beginFill(hit?0xeaffff:0xb1a4ff,hit?.8:pulse).drawCircle(cx,cy,w*(direction==='Up'?.035:.065)).endFill();
  // Orbit highlights move along the painted ribbon. The stone body never spins.
  for(let i=0;i<3;i++){const t=age*.7+i*Math.PI*2/3,px=Math.cos(t)*w*.34,py=Math.sin(t)*h*.10,x=px*Math.cos(.22)-py*Math.sin(.22),y=px*Math.sin(.22)+py*Math.cos(.22);g.beginFill(i%2?0x9fe9ff:0xd1aaff,.65).drawCircle(x,y,w*.006).endFill();}
  if(!death&&o.getVariables().get('IsMoving').getAsBoolean()){
   const vectors={Right:[-1,0],Left:[1,0],Down:[0,-1],Up:[0,1]},d=vectors[direction];
   for(let i=0;i<3;i++){const t=(age*1.4+i/3)%1,dist=w*(.35+t*.19),x=d[0]*dist+Math.sin(age*3+i)*w*.015,y=d[1]*dist+Math.cos(age*3+i)*h*.015;g.beginFill(i%2?0x8bdbff:0xab72ff,(1-t)*.45).drawCircle(x,y,w*(.005+.005*(1-t))).endFill();}
  }
  if(death){
   const t=Math.min(1,age/state.life),spread=Math.max(0,(t-.12)/.88);rig.body.alpha=Math.max(0,1-t*4);rig.body.scale.set(Math.max(.1,1-t*2));rig.shadow.alpha=1-t;
   rig.crystals.forEach((s,i)=>{if(s.visible){s.position.set(s.__base[0]*(1+spread*.65),s.__base[1]*(1+spread*.5));s.alpha=1-t;s.scale.set(1-t*.4);}});
   rig.pieces.forEach((s,i)=>{const d=s.__base,r=Math.hypot(...d)||1;s.position.set(d[0]+d[0]/r*spread*w*.17,d[1]+d[1]/r*spread*h*.17);s.rotation=spread*(i%2?1:-1)*.65;s.alpha=Math.max(0,(1-t)*.65);s.scale.set(1);});
   g.clear();g.beginFill(0xb991ff,(1-t)*.75).drawCircle(cx,cy,w*.09*Math.max(.06,1-t*2)).endFill();
   for(let i=0;i<10;i++){const angle=i*Math.PI*2/10+state.phase,d=w*(.05+t*.38),r=w*.006*(1-t);g.beginFill(i%2?0xa7e5ff:0xc999ff,1-t).drawCircle(cx+Math.cos(angle)*d,cy+Math.sin(angle)*d*.7,r).endFill();}
  }
 };
 nova.render=()=>{
  const dt=gdjs.evtTools.runtimeScene.getElapsedTimeInSeconds(scene);
  for(const e of get('Enemy')){
   if(e.getVariables().get('EnemyType').getAsString()==='VoidHound')continue;
   const state=nova.ensure(e),v=e.getVariables(),hp=e.getBehavior('Health').Health();if(hp<state.lastHP&&hp>0)state.hit=.16;state.lastHP=hp;state.age+=dt;state.hit=Math.max(0,state.hit-dt);
   const direction=v.get('Facing').getAsString()||'Right',mode=state.hit>0?'Hit':v.get('IsMoving').getAsBoolean()?'Move':'Idle';e.setAnimationName('Nova'+mode+'_'+direction);nova.animate(e,direction,state);
  }
  for(const o of get('NovaWispDeathVisual').slice()){
   const state=o.__novaDeath;if(!state){o.deleteFromScene();continue;}state.age+=dt;if(state.age>=state.life){o.deleteFromScene();continue;}nova.animate(o,state.direction,state,true);
  }
 };
}
