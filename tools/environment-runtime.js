// Only chapter art. Native routes, obstacle circles and tower statistics remain owners.
const scene=runtimeScene,meta=scene.__chapterMap?.config,env=meta?.Environment;
if(!env||!scene.__freePlacement||scene.__environmentLibrary)return;
const parent=scene.getLayer('').getRenderer().getRendererObject(),game=scene.getGame(),image=path=>game.getImageManager().getPIXITexture(path),surface=meta.Surface;
const e=scene.__environmentLibrary={disposed:false,roots:[],sprites:[],patches:[],islands:[],details:[]};
const container=z=>{const root=new PIXI.Container();root.zIndex=z;root.interactive=false;root.interactiveChildren=false;parent.addChild(root);e.roots.push(root);return root;};
const terrain=container(-8),distant=container(-16),details=container(-2);
const sprite=(path,x,y,w,root,alpha=1)=>{const s=new PIXI.Sprite(image(path));s.anchor.set(.5);s.position.set(x,y);s.scale.set(w/s.texture.width);s.alpha=alpha;root.addChild(s);e.sprites.push(s);return s;};
// Material patches have organic masks, so no visible 128px square tile grid.
for(let i=0;i<24;i++){
 const x=surface.left+145+(i*311)%(surface.right-surface.left-290),y=surface.top+105+(i*173)%(surface.bottom-surface.top-210),w=220+(i%3)*28;
 const s=sprite(i%3===0?env.Ground.decorative:env.Ground.variation,x,y,w,terrain,.30),mask=new PIXI.Graphics();mask.beginFill(0xffffff).drawEllipse(x,y,w*.48,w*.30).endFill();terrain.addChild(mask);s.mask=mask;e.patches.push({sprite:s,mask});
}
// Five distinct island silhouettes are kept beyond the buildable surface.
const positions=[[surface.left-75,surface.top+250,140],[surface.right+85,surface.top+180,155],[surface.left+460,surface.bottom+85,135],[surface.right-270,surface.bottom+80,120],[surface.left+690,surface.top-90,110]];
env.Islands.forEach((path,i)=>{const [x,y,w]=positions[i];const s=sprite(path,x,y,w,distant,.62);e.islands.push(s);});
// Small scenery stays inside already unavailable obstacle footprints. It never
// creates an invisible blocker or covers otherwise usable tower placement.
scene.getObjects('Ground_Decoration').filter(o=>o.getVariables().get('Blocking').getAsBoolean()).forEach((o,i)=>{
 const c=scene.__freePlacement.blockedCircle(o),path=env.Decorations[i%env.Decorations.length];
 const s=sprite(path,c.x+c.r*.45,c.y+c.r*.27,Math.min(28,c.r*.6),details,.72);e.details.push(s);
});
env.Effects.forEach((path,i)=>sprite(path,surface.left+330+i*480,surface.bottom+60,100,distant,.18));
e.dispose=()=>{if(e.disposed)return;e.disposed=true;for(const r of e.roots)r.destroy({children:true,texture:false,baseTexture:false});e.roots=[];e.sprites=[];};
if(!gdjs.__environmentLibraryCleanup){gdjs.__environmentLibraryCleanup=true;gdjs.callbacksRuntimeSceneUnloading.push(s=>s.__environmentLibrary?.dispose());}
