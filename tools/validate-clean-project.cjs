const fs=require('fs'),path=require('path'),vm=require('vm');
const root=process.cwd(),dir=process.env.GD_VALIDATION_HOME||"C:\\Users\\My ASUS\\.codex\\visualizations\\2026\\10\\06\\01a11249-1cf3-7f03-9834-01083d6fb50c\\gdevelop-shop-rework-validation";
require(path.join(dir,'libGD.js'))({locateFile:f=>path.join(dir,f)}).then(gd=>{try{
 gd.initializePlatforms();
 const runtime='C:/Users/My ASUS/AppData/Local/Programs/GDevelop/resources/GDJS/Runtime';
 for(const name of ['TweenBehavior','TileMap','3D','Physics3DBehavior','Effects']){
  const mod=require(path.join(runtime,'Extensions',name,'JsExtension.js'));
  const native=mod.createExtension(x=>x,gd);gd.JsPlatform.get().addNewExtension(native);
 }
 const data=JSON.parse(fs.readFileSync(path.join(root,'Tower Defense.json'),'utf8'));
 for(const key of ['layouts','eventsFunctionsExtensions'])data[key]=data[key].map(r=>JSON.parse(fs.readFileSync(path.join(root,r.referenceTo.slice(1)+'.json'),'utf8')));
 data.properties.folderProject=false;
 const project=new gd.Project(),element=gd.Serializer.fromJSON(JSON.stringify(data));project.unserializeFrom(element);
 const platform=gd.JsPlatform.get(),helper=new gd.MetadataDeclarationHelper(),maps=[];
 for(let i=0;i<project.getEventsFunctionsExtensionsCount();i++){
  const ext=project.getEventsFunctionsExtensionAt(i),native=new gd.PlatformExtension();gd.MetadataDeclarationHelper.declareExtension(native,ext);
  const fns=ext.getEventsFunctions();for(let n=0;n<fns.getEventsFunctionsCount();n++)helper.generateFreeFunctionMetadata(project,native,ext,fns.getEventsFunctionAt(n));
  const bs=ext.getEventsBasedBehaviors();for(let n=0;n<bs.getCount();n++){
   const b=bs.getAt(n),map=new gd.MapStringString(),f=b.getEventsFunctions();for(let j=0;j<f.getEventsFunctionsCount();j++)map.set(f.getEventsFunctionAt(j).getName(),f.getEventsFunctionAt(j).getName());
   gd.MetadataDeclarationHelper.generateBehaviorMetadata(project,native,ext,b,map);maps.push({ext,b,map});
  
  for(const {ext:owner,b} of maps.filter(x=>x.ext===ext)){
   const metadata=native.getBehaviorMetadata(ext.getName()+"::"+b.getName());metadata.addIncludeFile('gdjs-evtsext__'+ext.getName().toLowerCase()+'__'+b.getName().toLowerCase()+'.js');
  }
 }platform.addNewExtension(native);
 }
 console.log('PARSER: scenes='+project.getLayoutsCount()+', objects='+project.getLayoutAt(0).getObjects().getObjectsCount());
 const diagnostics=new gd.DiagnosticReport(),includes=new gd.SetString(),gen=new gd.LayoutCodeGenerator(project);
 const code=gen.generateLayoutCompleteCode(project.getLayoutAt(0),includes,diagnostics,true);fs.writeFileSync(path.join(dir,'scene.js'),code);new vm.Script(code);
 console.log('SCENE COMPILE diagnostics',diagnostics.count());if(diagnostics.count())throw new Error('Scene diagnostics must be zero');for(let i=0;i<diagnostics.count();i++){const d=diagnostics.get(i);console.log(d.getMessage(),d.getObjectName(),d.getActualValue(),d.getExpectedValue());}
 const bg=new gd.BehaviorCodeGenerator(project);
 for(const {ext,b,map} of maps){const ns=gd.MetadataDeclarationHelper.getBehaviorFunctionCodeNamespace(b,gd.MetadataDeclarationHelper.getExtensionCodeNamespacePrefix(ext));const code=bg.generateRuntimeBehaviorCompleteCode(ext,b,ns,map,includes,true);new vm.Script(code);fs.writeFileSync(path.join(dir,ext.getName()+'_'+b.getName()+'.js'),code);fs.writeFileSync(path.join(dir,'gdjs-evtsext__'+ext.getName().toLowerCase()+'__'+b.getName().toLowerCase()+'.js'),code);}
 const fg=new gd.EventsFunctionsExtensionCodeGenerator(project);
 for(let i=0;i<project.getEventsFunctionsExtensionsCount();i++){const ext=project.getEventsFunctionsExtensionAt(i),fns=ext.getEventsFunctions();for(let n=0;n<fns.getEventsFunctionsCount();n++){const f=fns.getEventsFunctionAt(n),ns=gd.MetadataDeclarationHelper.getFreeFunctionCodeNamespace(f,gd.MetadataDeclarationHelper.getExtensionCodeNamespacePrefix(ext)),code=fg.generateFreeEventsFunctionCompleteCode(ext,f,ns,includes,true);new vm.Script(code);fs.writeFileSync(path.join(dir,ext.getName()+'_'+f.getName()+'.js'),code);}}
 const v=includes.toNewVectorString();const list=Array.from({length:v.size()},(_,i)=>v.at(i));fs.writeFileSync(path.join(dir,'includes.json'),JSON.stringify(list));fs.writeFileSync(path.join(dir,'project.json'),JSON.stringify(data));console.log('EXTENSIONS COMPILE PASS; includes',list);
 const out=path.join(dir,'preview');fs.mkdirSync(out,{recursive:true});const adapter=new gd.AbstractFileSystemJS();
 adapter.mkDir=d=>{fs.mkdirSync(d,{recursive:true});return true;};adapter.dirExists=d=>fs.existsSync(d)&&fs.statSync(d).isDirectory();
 adapter.clearDir=d=>true;adapter.getTempDir=()=>dir;adapter.fileNameFrom=d=>path.basename(d);adapter.dirNameFrom=d=>path.dirname(d);adapter.isAbsolute=d=>path.isAbsolute(d);
 adapter.copyFile=(a,b)=>{try{fs.mkdirSync(path.dirname(b),{recursive:true});fs.copyFileSync(a,b);return true;}catch(e){console.log('COPY FAIL',a,b);return false;}};
 adapter.writeToFile=(a,b)=>{fs.mkdirSync(path.dirname(a),{recursive:true});fs.writeFileSync(a,b);return true;};adapter.readFile=d=>fs.existsSync(d)?fs.readFileSync(d,'utf8'):'';
 adapter.makeAbsolute=(a,b)=>path.resolve(b||root,a);adapter.makeRelative=(a,b)=>path.relative(b,a);adapter.fileExists=d=>fs.existsSync(d);adapter.readDir=d=>{const v=new gd.VectorString();for(const n of fs.readdirSync(d))v.push_back(n);return v;};
 const exporter=new gd.Exporter(adapter,path.dirname(runtime)),opts=new gd.PreviewExportOptions(project,out);opts.setLayoutName('Game Scene');opts.setShouldClearExportFolder(false);exporter.setCodeOutputDirectory(dir);
 project.setProjectFile(path.join(root,'Tower Defense.json'));console.log('EXPORT',exporter.exportProjectForPixiPreview(opts),exporter.getLastError());
 // The headless native exporter lacks the IDE's extension bundling coordinator.
 // Supply native-generated behavior code, with no gameplay shims or legacy libraries.
 const htmlPath=path.join(out,'index.html');let html=fs.readFileSync(htmlPath,'utf8');
 for(const {ext,b} of maps){const file='gdjs-evtsext__'+ext.getName().toLowerCase()+'__'+b.getName().toLowerCase()+'.js';fs.copyFileSync(path.join(dir,file),path.join(out,file));html=html.replace('<script src="code0.js"','<script src="'+file+'"></script>\n\t<script src="code0.js"');}
 // Supply complete native debugger dependencies and preview-only web manifest.
 const debuggerDir=path.join(runtime,'debugger-client');
 for(const file of ['abstract-debugger-client.js','window-message-debugger-client.js'])fs.copyFileSync(path.join(debuggerDir,file),path.join(out,'debugger-client',file));
 html=html.replace(/<script src="debugger-client[\\/]minimal-debugger-client\.js"[^>]*><\/script>/,'<script src="debugger-client/abstract-debugger-client.js"></script><script src="debugger-client/window-message-debugger-client.js"></script>');
 if(!html.includes('abstract-debugger-client.js'))html=html.replace(/<script src="debugger-client[\\/]window-message-debugger-client\.js"/,'<script src="debugger-client/abstract-debugger-client.js"></script><script src="debugger-client/window-message-debugger-client.js"');
 fs.writeFileSync(path.join(out,'manifest.webmanifest'),JSON.stringify({name:data.properties.name||'Celestial Void',start_url:'./index.html',display:'standalone'}));
 fs.writeFileSync(htmlPath,html);console.log('CUSTOM BEHAVIOR BUNDLE',maps.length);


}catch(e){console.error('CHECK FAILED',e.message||String(e));process.exitCode=1;}});

