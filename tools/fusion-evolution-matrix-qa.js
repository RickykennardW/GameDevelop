// Twelve real shop / upgrade / sidebar / regional placement transactions.
(async()=>{
 const game=testGame,scene=game.getSceneStack().getCurrentScene(),vars=scene.getVariables(),input=game.getInputManager();
 game.pause(true);
 const step=(n=1)=>{for(let i=0;i<n;i++){scene.renderAndStep(16.667);input.onFrameEnded();}};
 step(4);
 const p=scene.__freePlacement,f=scene.__fusion,evo=scene.__fusionEvolution,archive=game.__fusionArchive;
 const shop=scene.__towerShopUI,checks=[],transactions=[];
 const ok=(value,label)=>{if(!value)throw Error(label);checks.push(label);};
 const cash=()=>vars.get('Money').getAsNumber();
 const num=(o,key)=>o.getVariables().get(key).getAsNumber();
 const move=(x,y,layer='')=>{input.onMouseMove(...scene.getLayer(layer).convertInverseCoords(x,y,0,[0,0]));step(2);};
 const click=(x,y,layer='')=>{move(x,y,layer);input.onMouseButtonPressed(0);step(2);input.onMouseButtonReleased(0);step(3);};
 const clickObject=o=>click(o.getCenterXInScene(),o.getCenterYInScene(),o.getLayer());
 const key=code=>{input.onKeyPressed(code);step();input.onKeyReleased(code);step(2);};
 const select=t=>{vars.get('SelectedTower').setNumber(t?num(t,'TowerId'):0);step(2);};
 const same=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1])<.1;
 const rows=shop.level.rows.slice(0,-1).map((r,i)=>(r+shop.level.rows[i+1])/2);
 const site=(type,output,left,right)=>{
  p.refresh();
  for(const y of rows)for(let x=left;x<=right;x+=16){
   if(p.validate(type,x,y,{cost:0}).valid&&p.validate(output,x,y,{cost:0}).valid)return[x,y];
  }
  throw Error('No fixture ground for '+type+' / '+output);
 };
 const build=(source,at)=>{
  select(null);clickObject(shop.cards.find(c=>c.item.Type===source.Type).background);click(...at);
  const tower=scene.getObjects(source.Type).find(o=>same(p.center(o),at));
  ok(!!tower,'Shop buys '+source.Type);
  select(tower);
  ok(!scene.__selectedPanel.fusionButton,'Unupgraded tower has no Fusion button');
  for(const [path,level] of [source.Path1,source.Path2].entries()){
   for(let i=0;i<level;i++)clickObject(scene.__selectedPanel.cards[path].background);
  }
  ok(num(tower,'Path1Level')===source.Path1&&num(tower,'Path2Level')===source.Path2&&!!scene.__selectedPanel.fusionButton,
     source.Type+' '+source.Path1+'-'+source.Path2+' exposes native Fusion button');
  select(null);
  return tower;
 };
 const enter=t=>{select(t);clickObject(scene.__selectedPanel.fusionButton);ok(f.stage==='partner'&&scene.getTimeManager().getTimeScale()===.5,'Tactical Fusion keeps simulation at 0.5x');};
 const stored=()=>JSON.parse(localStorage.getItem(archive.storageKey)||'{"entries":{}}').entries;
 const showIndex=id=>{vars.get('IndexOpen').setBoolean(true);step(2);const index=scene.__unitIndex;index.category='Fusion';index.select(id);step(2);return index;};
 const closeIndex=()=>{vars.get('IndexOpen').setBoolean(false);step(3);};
 const starburst='StarburstCannon';
 const expected=[starburst,'VenomCataclysm','PlaguebreakerCannon','SupernovaObliterator','ToxicConstellation','MeteorStormArray'];
 ok(archive.catalog.map(r=>r.Id).join()===expected.join()&&expected.every(id=>!archive.has(id)),'Six canonical Index entries start undiscovered');
 const locked=showIndex(expected[1]);
 ok(locked.detail.locked&&locked.detail.name.getString()==='???'&&locked.detail.sprite.getColor()==='0;0;0'&&
    locked.detail.description.getString().includes('CRYPTIC HINT')&&locked.statValues.length===0,'Locked Index uses real silhouette and hides skills/stats');
 closeIndex();
 vars.get('WaveMode').setString('AutoFast');step(2);
 let ghost;
 for(const id of expected){
  const def=archive.definition(id),variant=def.Variants[0],output=id===starburst?'StarCannonTower':id;
  for(const reversed of [false,true]){
   const recipe=reversed?variant.Recipe.slice().reverse():variant.Recipe;
   vars.get('Money').setNumber(150000);
   const A=build(recipe[0],site(recipe[0].Type,output,280,620));
   const B=build(recipe[1],site(recipe[1].Type,output,920,1520));
   const left=p.center(A),right=p.center(B),sourceIds=[A.getUniqueId(),B.getUniqueId()];
   A.getVariables().get('DamageDealt').setNumber(23);
   B.getVariables().get('DamageDealt').setNumber(47);
   const gold=cash(),invested=num(A,'TotalInvestment')+num(B,'TotalInvestment'),writes=archive.stats.writes;
   enter(A);
   if(!ghost)ghost=f.ghost;
   ok(f.ghost===ghost&&f.markers.has(sourceIds[0])&&f.markers.has(sourceIds[1]),id+' reuses the ghost and highlights both sources');
   click(...right);move(...left);
   const cost=id===starburst?f.config.FusionCost:evo.balance.Towers[id].FusionCost;
   ok(f.stage==='placement'&&f.result.id===id&&f.sidebar.result.cost===cost&&f.sidebar.result.locked===!reversed,id+' sidebar resolves the ordered or reversed recipe');
   ok(f.ghost.getAnimationName()===(id===starburst?'Preview':id)&&f.preview.radius===p.config(output).Radius&&f.preview.valid&&
      f.ghost.getColor()==='180;255;230'&&(!reversed?!!f.ghost.getRendererObject().filters:true),id+' result art and valid footprint match the recipe');
   move(...right);ok(f.preview.valid&&f.validate((left[0]+right[0])/2,(left[1]+right[1])/2).reason==='region',id+' placement allowed at either source and rejected between them');
   ok(p.towers().includes(A)&&p.towers().includes(B)&&cash()===gold&&archive.stats.writes===writes,id+' preview leaves both sources, Gold and discovery intact');

   if(id==='VenomCataclysm'&&!reversed){
    const at=left;
    let road;
    for(let dx=-80;dx<=80&&!road;dx+=10)for(let dy=-80;dy<=80;dy+=10){
     const spot=[at[0]+dx,at[1]+dy];if(f.validate(...spot).reason==='path'){road=spot;break;}
    }
    ok(!!road,'Result footprint blocks the real road ribbon');
    move(...road);ok(f.ghost.getColor()==='255;80;105','Invalid path turns the result ghost red');
    const ruin=scene.createObject('Ground_Decoration'),rv=ruin.getVariables();
    ruin.setAnimationName('Ruin');ruin.setWidth(36);ruin.setHeight(36);ruin.setPosition(at[0]-18,at[1]-18);
    rv.get('Kind').setString('Ruin');rv.get('Blocking').setBoolean(true);rv.get('LocalScale').setNumber(1);
    step(2);p.refresh();move(...at);
    ok(f.validate(...at).reason==='obstacle'&&f.obstacleFootprints.has(ruin.getUniqueId()),'Ruin collider and visible outline use the same geometry');
    ruin.deleteFromScene();step(2);
    const other=scene.createObject('StarCannonTower'),ov=other.getVariables();
    for(const [name,n] of Object.entries({TowerId:900000,FootprintX:at[0]+75,FootprintY:at[1],FootprintRadius:46}))ov.get(name).setNumber(n);
    step(2);move(...at);
    ok(f.validate(...at).reason==='tower'&&f.footprints.get(other.getUniqueId()).ignored===false,'Unrelated towers block the result footprint');
    other.deleteFromScene();step(2);
    vars.get('Money').setNumber(cost-1);click(...at);
    ok(f.stage==='placement'&&f.preview.reason==='gold'&&cash()===cost-1&&p.towers().includes(A)&&p.towers().includes(B)&&!archive.has(id),'Underfunded confirmation preserves both sources and the save');
    vars.get('Money').setNumber(gold);step(2);
    const create=scene.createObject;
    scene.createObject=function(name){return name===output?null:create.call(this,name);};
    const failure=f.confirm(...at);scene.createObject=create;
    ok(!failure&&cash()===gold&&p.towers().includes(A)&&p.towers().includes(B),'Result creation failure rolls back before either source or Gold changes');
    key(27);
    ok(!f.active&&f.ghost.isHidden()&&!f.markers.size&&!f.footprints.size&&cash()===gold&&scene.getTimeManager().getTimeScale()===2,'ESC clears every Fusion overlay and restores 2x');
    enter(B);click(...left);click(f.cancelRect.x+f.cancelRect.w/2,f.cancelRect.y+20,'FusionUI');
    ok(!f.active&&p.towers().includes(A)&&p.towers().includes(B),'Native Cancel preserves both source towers');
    enter(A);click(...right);
   }

   const anchor=reversed?right:left;
   click(...anchor);
   const result=p.towers()[0];
   ok(!f.active&&p.towers().length===1&&result.getName()===output&&evo.type(result)===id&&evo.tier(result)===1&&same(p.center(result),anchor),id+' creates exactly one native E1 at the clicked source');
   ok(num(result,'DamageDealt')===70&&num(result,'TotalInvestment')===invested+cost&&cash()===gold-cost&&
      !f.confirm(...anchor)&&scene.getTimeManager().getTimeScale()===2,id+' transfer, fee and one-time confirmation are atomic');
   ok(archive.has(id)&&stored()[id]?.variants[variant.Id]===true&&archive.stats.writes===writes+(reversed?0:1),id+' discovery writes once per result');
   const expectedFound=expected.slice(0,expected.indexOf(id)+1);
   ok(expected.filter(id=>archive.has(id)).join()===expectedFound.join(),id+' discovery does not unlock other results');
   if(!reversed){
    const index=showIndex(id);
    ok(!index.detail.locked&&index.detail.name.getString()===def.Name&&index.detail.sprite.getColor()==='255;255;255'&&
       index.objects['fusionRecipe'+expected.indexOf(id)].getString().includes(variant.Recipe[0].Label)&&
       !index.objects.evolutionDesc3.isHidden(),id+' reveals portrait, exact recipe and tier abilities after placement');
    closeIndex();
   }
   select(null);click(...anchor);
   ok(scene.__selectedPanel.tower===result&&!scene.__selectedPanel.fusionButton&&scene.__selectedPanel.evolutionCard?.next===2,id+' selectable Evolution owns one upgrade card');
   const sell=num(result,'SellValue'),before=cash();
   clickObject(scene.__selectedPanel.objects.sell);
   ok(!p.towers().length&&cash()===before+sell&&!evo.rigs.size,id+' native sale refunds once and disposes the rig');
   transactions.push({id,reversed,anchor,cost,sourceInvestment:invested});
  }
  console.log('BALANCE PROGRESS '+id+' passed forward and reverse');
 }
 return {checks,transactions,stored:expected.map(id=>[id,Object.keys(stored()[id].variants)]),materializations:evo.metrics.materializations};
})()
