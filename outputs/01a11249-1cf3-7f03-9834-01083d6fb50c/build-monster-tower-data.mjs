import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { Workbook, SpreadsheetFile, FileBlob } from '@oai/artifact-tool';

const out = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(out, '../..');
const sourceFiles = ['Tower Defense.json','layouts/game-scene.json','tools/gold-budget-runtime.js','tools/star-cannon-runtime.js','tools/selected-panel-runtime.js'];
const before = new Map();
for (const name of sourceFiles) before.set(name, await fs.readFile(path.join(root,name)));
const scene = JSON.parse(before.get('layouts/game-scene.json').toString('utf8'));
const unwrap = v => v.type === 'structure' ? Object.fromEntries((v.children||[]).map(x=>[x.name,unwrap(x)])) : v.type === 'array' ? (v.children||[]).map(unwrap) : v.value;
const values = Object.fromEntries(scene.variables.map(v=>[v.name,unwrap(v)]));
const config = values.StarCannonConfig, waveConfig = values.WaveBudgetConfig;
const runtimeScene = {getVariables:()=>({get:name=>({toJSObject:()=>values[name],setNumber:n=>values[name]=n})})};
const embedded = scene.events[10].events[0].events[5].inlineCode.join('\n');
assert.equal(embedded, before.get('tools/gold-budget-runtime.js').toString('utf8').replace(/\r/g,'').trimEnd());
vm.runInNewContext(embedded,{runtimeScene,Math,Number,Object,Error});
const gold = runtimeScene.__goldBudget;
const plans = Array.from({length:waveConfig.LastWave},(_,i)=>gold.generate(i+1));
const ids = ['Basic','VoidHound','VoidSentinel','VoidGuard','VoidBrute','VoidGolem'];
const monsters = ids.map(id=>({id,...values.EnemyTypes[id]}));
assert.equal(monsters.length,6);
const star = {valid:(a,b)=>Number.isInteger(a)&&Number.isInteger(b)&&a>=0&&b>=0&&a<=4&&b<=4&&!(a>=3&&b>=3)};
const starSource = before.get('tools/star-cannon-runtime.js').toString('utf8');
const startStats = starSource.indexOf('star.stats=(a,b)=>{'), endStats = starSource.indexOf('\n star.apply=',startStats);
assert(startStats>=0&&endStats>startStats);
vm.runInNewContext(starSource.slice(startStats,endStats),{star,config});
const builds=[];
for(let a=0;a<=4;a++) for(let b=0;b<=4;b++) if(star.valid(a,b)) builds.push({a,b,...star.stats(a,b)});
assert.equal(builds.length,21);
const price = values.TowerShopCatalog.find(x=>x.Type==='StarCannonTower').Cost;
const refund = values.SellRefundRate;
assert.equal(price,300);assert.equal(refund,.7);
for(const p of plans){
 assert.equal(p.queue.length,Object.values(p.counts).reduce((s,n)=>s+n,0));
 assert.equal(p.spent,p.queue.reduce((s,id)=>s+values.EnemyTypes[id].Reward,0));
 assert(p.spent<=p.budget);
}

const wb=Workbook.create();
const sheets=Object.fromEntries(['Waves','Monster','Tower','Upgrade'].map(name=>[name,wb.worksheets.add(name)]));
const purple='#4B2D73', light='#F4EFF9', ink='#282133', gray='#70677B';
function col(i){let s='';for(i++;i;i=Math.floor((i-1)/26))s=String.fromCharCode(65+(i-1)%26)+s;return s;}
function put(sheet,address,matrix){sheet.getRange(address).values=matrix;}
function formula(sheet,address,matrix){sheet.getRange(address).formulas=matrix;}
function base(sheet,lastCol,lastRow,title,widths){
 sheet.showGridLines=false;
 const area=sheet.getRange(`A1:${lastCol}${lastRow}`);
 area.format.font={name:'Arial',size:10,color:ink};area.format.fill='#FFFFFF';area.format.rowHeight=23;area.format.verticalAlignment='center';
 widths.forEach((w,i)=>sheet.getRange(`${col(i)}1:${col(i)}${lastRow}`).format.columnWidthPx=w);
 put(sheet,'A2',[[title]]);sheet.getRange(`A2:${lastCol}2`).format.font={name:'Arial',size:16,bold:true,color:purple};sheet.getRange(`A2:${lastCol}2`).format.rowHeight=30;
 sheet.getRange(`A2:${lastCol}2`).format.borders={bottom:{style:'thin',color:'#AB90C6'}};
}
function table(sheet,address,name){
 const t=sheet.tables.add(address,true,name);t.style='TableStyleLight1';t.showFilterButton=true;
 const m=address.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/),first=+m[2],last=+m[4],header=sheet.getRange(`${m[1]}${first}:${m[3]}${first}`);
 header.format.fill=purple;header.format.font={name:'Arial',size:10,bold:true,color:'#FFFFFF'};header.format.wrapText=true;header.format.horizontalAlignment='center';header.format.rowHeight=40;
 header.format.borders={insideVertical:{style:'thin',color:'#FFFFFF'}};
 for(let row=first+1;row<=last;row++)if((row-first)%2===0)sheet.getRange(`${m[1]}${row}:${m[3]}${row}`).format.fill=light;
 return t;
}
function note(sheet,address,text){put(sheet,address,[[text]]);sheet.getRange(address).format.font={name:'Arial',size:10,color:gray,italic:true};}

// Monster sources and defensive skill. This order aligns with the wave columns.
const mon=sheets.Monster;
base(mon,'K',29,'Statistik Monster',[130,148,84,78,100,90,86,115,85,188,96]);mon.tabColor='#765794';
note(mon,'A3','HP, speed, armor dan Gold Reward tetap untuk semua wave. Speed/radius menggunakan logical pixels.');
note(mon,'A5','Armor buff berlaku jika monster menerima Void Fortification. Common tidak memiliki skill aktif.');
note(mon,'A6','Sumber: game-scene.json, EnemyTypes dan VoidGolemConfig.Skill. ID Basic adalah Nova Wisp.');
put(mon,'A7:K7',[['ID Monster','Nama','Kelas','HP','Speed (px/s)','Reward (Gold)','Armor dasar','Armor saat buff','Unlock wave','Skill aktif','Damage Base']]);
put(mon,'A8:K13',monsters.map(m=>[m.id,m.Name,m.Classification||'Common',m.HP,m.Speed,m.Reward,m.Armor,null,m.MinimumWave,m.SpecialAbility&&m.SpecialAbility!=='None'?m.SpecialAbility:'Tidak ada',1]));
formula(mon,'H8:H13',monsters.map((m,i)=>[`=G${i+8}+$B$19`]));
table(mon,'A7:K13','MonsterStats');mon.getRange('D8:I13').setNumberFormat('#,##0');mon.getRange('K8:K13').setNumberFormat('0');mon.getRange('D8:I13').format.horizontalAlignment='right';mon.getRange('K8:K13').format.horizontalAlignment='right';
mon.getRange('A8:K13').format.rowHeight=30;
mon.getRange('I8:I13').format.borders={right:{style:'thin',color:'#DED4EA'}};
put(mon,'A17',[['Void Fortification']]);mon.getRange('A17:K17').format.font={name:'Arial',size:10,bold:true,color:purple};
put(mon,'A19:B21',[['Bonus armor',values.VoidGolemConfig.Skill.ArmorBonus],['Cast (detik)',values.VoidGolemConfig.Skill.CastDuration],['Damage skill',values.VoidGolemConfig.Skill.Damage]]);
put(mon,'D19:E20',[['Durasi (detik)',values.VoidGolemConfig.Skill.Duration],['Release (detik)',values.VoidGolemConfig.Skill.ReleaseTime]]);
put(mon,'G19:H20',[['Cooldown (detik)',values.VoidGolemConfig.Skill.Cooldown],['Radius (px)',values.VoidGolemConfig.Skill.Radius]]);
for(const r of ['B19:B21','E19:E20','H19:H20']){mon.getRange(r).setNumberFormat('0.0');mon.getRange(r).format.horizontalAlignment='right';}
for(const r of ['D19:D20','G19:G20'])mon.getRange(r).format.wrapText=true;
mon.getRange('A19:K20').format.rowHeight=31;
note(mon,'A24','Cast berhenti 0,8 detik. Buff diberikan pada 0,6 detik kepada self dan ally dalam radius 100 px.');
note(mon,'A25','Bonus armor tidak menumpuk. Cast berikutnya memperbarui durasi buff menjadi 10 detik.');
note(mon,'A26','Damage Base = 1 nyawa saat monster mencapai Base. Sumber: event path/base pada game-scene.json.');

// Upgrade prices/descriptions and authoritative cumulative tier multipliers.
const up=sheets.Upgrade;
base(up,'K',30,'Upgrade Star Cannon',[138,100,186,113,252,111,125,108,114,133,133]);up.tabColor='#765794';
note(up,'A3','Jika satu jalur mencapai tier 3, jalur lain maksimal tier 2. Terdapat 21 kombinasi valid.');
put(up,'A4:D4',[['Path 1',config.Paths[0].Name,'Path 2',config.Paths[1].Name]]);up.getRange('B4').format.font={name:'Arial',size:10,bold:true};up.getRange('D4').format.font={name:'Arial',size:10,bold:true};
up.getRange('B4').format.wrapText=true;up.getRange('D4').format.wrapText=true;up.getRange('A4:K4').format.rowHeight=32;
note(up,'A6','Sumber: game-scene.json, StarCannonConfig.Paths dan tabel pengali.');
put(up,'A7:E7',[['Jalur','Tier','Nama upgrade','Harga (Gold)','Efek upgrade']]);
const upgrades=config.Paths.flatMap(p=>p.Upgrades.map((u,i)=>[p.Name,i+1,u.Name,u.Cost,u.Description.replace(/\n/g,'; ')]));
put(up,'A8:E15',upgrades);table(up,'A7:E15','UpgradePrices');up.getRange('A8:E15').format.rowHeight=46;up.getRange('A8:A15').format.wrapText=true;up.getRange('C8:C15').format.wrapText=true;up.getRange('E8:E15').format.wrapText=true;up.getRange('B8:B15').format.horizontalAlignment='right';up.getRange('D8:D15').format.horizontalAlignment='right';up.getRange('D8:D15').setNumberFormat('#,##0');
up.getRange('D8:D15').format.borders={right:{style:'thin',color:'#DED4EA'}};
put(up,'A18',[['Pengali dan biaya kumulatif per tier']]);up.getRange('A18:K18').format.font={name:'Arial',size:10,bold:true,color:purple};
note(up,'A19','Gunakan tier Path 1 untuk damage/splash, dan tier Path 2 untuk speed/jumlah projectile/fraksi damage.');
put(up,'A21:K21',[['Tier','Damage x','Atk speed x','Range P1 x','Range P2 x','Jumlah shot','Damage fraksi','Splash %','Splash radius','Gold P1 kumulatif','Gold P2 kumulatif']]);
put(up,'A22:K26',Array.from({length:5},(_,i)=>[i,config.DamageMultipliers[i],config.SpeedMultipliers[i],config.Path1RangeMultipliers[i],config.Path2RangeMultipliers[i],i>=4?3:i>=3?2:1,config.ProjectileFractions[i],config.SplashRatios[i],config.SplashRadii[i],null,null]));
formula(up,'J22:K26',Array.from({length:5},(_,i)=>[`=SUMIFS($D$8:$D$15,$A$8:$A$15,$B$4,$B$8:$B$15,"<="&A${22+i})`,`=SUMIFS($D$8:$D$15,$A$8:$A$15,$D$4,$B$8:$B$15,"<="&A${22+i})`]));
table(up,'A21:K26','TierMultipliers');up.getRange('B22:E26').setNumberFormat('0.00');up.getRange('G22:H26').setNumberFormat('0%');up.getRange('I22:K26').setNumberFormat('#,##0');up.getRange('A22:K26').format.horizontalAlignment='right';

// Tower table calculated from current base stats and tier inputs.
const tow=sheets.Tower;
base(tow,'O',38,'Statistik Tower dan Kombinasi Upgrade',[120,93,109,106,113,111,113,100,97,110,114,122,122,122,115]);tow.tabColor=purple;
note(tow,'A3','Star Cannon adalah satu-satunya tower yang tersedia. Range/speed projectile menggunakan logical pixels.');
note(tow,'A4','Sumber: StarCannonConfig, TowerShopCatalog, SellRefundRate dan rumus star.stats pada project aktif.');
put(tow,'A5:J5',[['Tower','Harga (Gold)','Base damage','Base range','Base interval (s)','Speed projectile','Awal shot','Min damage','Sell refund','Footprint radius']]);
put(tow,'A6:J6',[['Star Cannon',price,config.BaseDamage,config.BaseRange,config.BaseInterval,config.ProjectileSpeed,1,config.MinimumDamage,refund,values.TowerFootprints.StarCannonTower.Radius]]);
table(tow,'A5:J6','BaseTower');tow.getRange('B6:J6').format.horizontalAlignment='right';tow.getRange('B6:D6').setNumberFormat('#,##0');tow.getRange('E6').setNumberFormat('0.00');tow.getRange('I6').setNumberFormat('0%');
note(tow,'A8','DPS = damage langsung per detik. Perhitungan mengabaikan splash, travel, rotasi, range downtime dan overkill.');
put(tow,'A10:O10',[['Build','Path 1','Path 2','Damage sebelum fraksi','Jumlah projectile','Damage / projectile','Interval (s)','Range (px)','Splash %','Splash radius','DPS armor 0','DPS Golem armor 25','DPS Golem armor 35','Investasi (Gold)','Sell (Gold)']]);
put(tow,'A11:C31',builds.map(b=>[`${b.a}-${b.b}`,b.a,b.b]));
const tiers="'Upgrade'!$A$22:$K$26";
formula(tow,'D11:O31',builds.map((b,i)=>{const r=i+11;return[
 `=$C$6*VLOOKUP(B${r},${tiers},2,FALSE)`,
 `=VLOOKUP(C${r},${tiers},6,FALSE)`,
 `=D${r}*VLOOKUP(C${r},${tiers},7,FALSE)`,
 `=$E$6/VLOOKUP(C${r},${tiers},3,FALSE)`,
 `=$D$6*VLOOKUP(B${r},${tiers},4,FALSE)*VLOOKUP(C${r},${tiers},5,FALSE)`,
 `=VLOOKUP(B${r},${tiers},8,FALSE)`,
 `=VLOOKUP(B${r},${tiers},9,FALSE)`,
 `=F${r}*E${r}/G${r}`,
 `=MAX($H$6,F${r}-VLOOKUP("VoidGolem",'Monster'!$A$8:$K$13,7,FALSE))*E${r}/G${r}`,
 `=MAX($H$6,F${r}-VLOOKUP("VoidGolem",'Monster'!$A$8:$K$13,8,FALSE))*E${r}/G${r}`,
 `=$B$6+VLOOKUP(B${r},${tiers},10,FALSE)+VLOOKUP(C${r},${tiers},11,FALSE)`,
 `=ROUNDDOWN(N${r}*$I$6+0.00000001,0)`
];}));
table(tow,'A10:O31','TowerBuilds');tow.getRange('B11:O31').format.horizontalAlignment='right';for(const r of ['D11:D31','F11:H31','K11:M31'])tow.getRange(r).setNumberFormat('0.00');tow.getRange('I11:I31').setNumberFormat('0%');tow.getRange('N11:O31').setNumberFormat('#,##0');
note(tow,'A34','Armor mengurangi damage setiap hit. Minimum damage positif = 1, termasuk ketika armor lebih besar dari raw damage.');
note(tow,'A35','Build 2-4: Meteor 34,72 damage/projectile melawan armor 35 menjadi 1 damage/hit. Tidak ada critical damage.');

// Primary 45-wave output. Composition is exported from the seeded game generator.
const ws=sheets.Waves;
base(ws,'N',64,'Celestial Void - Monster per Wave',[79,103,102,102,110,102,102,102,106,104,117,104,108,127]);ws.tabColor=purple;
put(ws,'A3:B3',[['Seed aktif',waveConfig.Seed]]);put(ws,'D3:E3',[['Wave',waveConfig.LastWave]]);put(ws,'G3',[['Total monster']]);formula(ws,'H3',[['=SUM(I8:I52)']]);put(ws,'J3',[['Gold kill maks']]);formula(ws,'K3',[['=SUM(K8:K52)']]);ws.getRange('B3:N3').setNumberFormat('#,##0');
note(ws,'A4','Jumlah monster adalah komposisi seed aktif. Angka 0 berarti jenis tidak terpilih pada wave tersebut.');
note(ws,'A5','Gold kill maks mengasumsikan semua monster dibunuh. Tidak termasuk saldo awal, sell, atau belanja.');
note(ws,'A6','Sumber: generator Gold Budget pada event project aktif dan config WaveBudgetConfig.');
put(ws,'A7:N7',[['Wave','Jenis wave',...monsters.map(m=>m.Name),'Total monster','Budget (Gold)','Gold kill maks','Sisa budget','Spawn interval (s)','Total HP dasar']]);
put(ws,'A8:H52',plans.map(p=>[p.wave,p.milestone?'Milestone':'Normal',...ids.map(id=>p.counts[id])]));
formula(ws,'I8:N52',plans.map((p,i)=>{const r=i+8;return[
 `=SUM(C${r}:H${r})`,
 `=ROUND(($B$59+$E$59*(A${r}-1-INT((A${r}-1)/$H$59)))*IF(MOD(A${r},$H$59)=0,$K$59,1),0)`,
 `=${ids.map((id,j)=>`${col(j+2)}${r}*VLOOKUP("${id}",'Monster'!$A$8:$K$13,6,FALSE)`).join('+')}`,
 `=J${r}-K${r}`,
 `=MAX($B$61,$E$60-MAX(0,A${r}-$H$60)*$K$60)`,
 `=${ids.map((id,j)=>`${col(j+2)}${r}*VLOOKUP("${id}",'Monster'!$A$8:$K$13,4,FALSE)`).join('+')}`
];}));
table(ws,'A7:N52','WaveRoster');ws.freezePanes.freezeRows(7);ws.freezePanes.freezeColumns(2);ws.getRange('A8:A52').setNumberFormat('0');ws.getRange('C8:N52').format.horizontalAlignment='right';ws.getRange('C8:L52').setNumberFormat('#,##0');ws.getRange('M8:M52').setNumberFormat('0.000');ws.getRange('N8:N52').setNumberFormat('#,##0');
ws.getRange('B8:B52').conditionalFormats.add('containsText',{text:'Milestone',format:{fill:'#E7D7F4',font:{bold:true,color:purple}}});
ws.getRange('H8:H52').conditionalFormats.add('cellIs',{operator:'greaterThan',formula:0,format:{fill:'#E7D7F4',font:{bold:true,color:purple}}});
ws.getRange('L8:L52').conditionalFormats.add('cellIs',{operator:'lessThan',formula:0,format:{fill:'#FCE3E3',font:{bold:true,color:'#A22424'}}});
put(ws,'A54:B54',[['TOTAL',null]]);formula(ws,'C54:N54',[Array.from({length:12},(_,i)=>i===10?'':`=SUM(${col(i+2)}8:${col(i+2)}52)`)]);ws.getRange('A54:N54').format.font={name:'Arial',size:10,bold:true,color:purple};ws.getRange('A54:N54').format.borders={top:{style:'thin',color:'#AB90C6'}};ws.getRange('C54:N54').setNumberFormat('#,##0');ws.getRange('C54:N54').format.horizontalAlignment='right';
put(ws,'A57',[['Aturan wave dari project']]);ws.getRange('A57:N57').format.font={name:'Arial',size:10,bold:true,color:purple};
put(ws,'A59:B61',[['Budget awal',waveConfig.StartingBudget],['Wave terakhir',waveConfig.LastWave],['Spawn minimum (s)',values.WavePacing.MinimumInterval]]);
put(ws,'D59:E61',[['Kenaikan budget',waveConfig.BudgetIncrement],['Spawn dasar (s)',values.NovaWispConfig.SpawnInterval],['Seed',waveConfig.Seed]]);
put(ws,'G59:H61',[['Milestone tiap',waveConfig.MilestoneEvery],['Percepat setelah',values.WavePacing.SpeedUpAfterWave],['Gold awal',values.Money]]);
put(ws,'J59:K61',[['Milestone x',waveConfig.MilestoneMultiplier],['Reduksi spawn (s)',values.WavePacing.IntervalReductionPerWave],['Bonus wave',values.WaveCompletionReward]]);
ws.getRange('B61').setNumberFormat('0.000');ws.getRange('E60').setNumberFormat('0.000');ws.getRange('K59').setNumberFormat('0.0');ws.getRange('K60').setNumberFormat('0.000');
for(const address of ['A59:A61','D59:D61','G59:G61','J59:J61'])ws.getRange(address).format.wrapText=true;
ws.getRange('A59:N61').format.rowHeight=31;
note(ws,'A63','Komposisi tetap untuk seed yang diekspor. Mengubah seed/budget di Excel tidak menjalankan ulang generator monster.');

// Calculation and source reconciliation, including an actual reversible edit.
wb.recalculate();
const near=(a,b)=>assert(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const data=ws.getRange('A8:N52').values;
plans.forEach((p,i)=>{const r=data[i];assert.equal(r[8],p.queue.length);assert.equal(r[9],p.budget);assert.equal(r[10],p.spent);assert.equal(r[11],p.unused);near(r[12],Math.max(values.WavePacing.MinimumInterval,values.NovaWispConfig.SpawnInterval-Math.max(0,p.wave-values.WavePacing.SpeedUpAfterWave)*values.WavePacing.IntervalReductionPerWave));assert.equal(r[13],p.queue.reduce((s,id)=>s+values.EnemyTypes[id].HP,0));});
const buildData=tow.getRange('A11:O31').values;
builds.forEach((b,i)=>{const r=buildData[i];near(r[3],b.Damage);near(r[4],b.ProjectileCount);near(r[5],b.ProjectileDamage);near(r[6],b.AttackInterval);near(r[7],b.AttackRange);near(r[8],b.SplashRatio);near(r[9],b.SplashRadius);near(r[10],b.ProjectileDamage*b.ProjectileCount/b.AttackInterval);const expectedCost=price+config.Paths[0].Upgrades.slice(0,b.a).reduce((s,u)=>s+u.Cost,0)+config.Paths[1].Upgrades.slice(0,b.b).reduce((s,u)=>s+u.Cost,0);assert.equal(r[13],expectedCost);assert.equal(r[14],Math.floor(expectedCost*refund+1e-8));});
// Changing one count updates total count, kill Gold, remaining budget and total HP.
put(ws,'C8',[[21]]);wb.recalculate();assert.equal(ws.getRange('I8').values[0][0],21);assert.equal(ws.getRange('K8').values[0][0],105);assert.equal(ws.getRange('L8').values[0][0],-5);assert.equal(ws.getRange('N8').values[0][0],2100);put(ws,'C8',[[20]]);
put(mon,'B19',[[11]]);wb.recalculate();assert.equal(mon.getRange('H13').values[0][0],36);put(mon,'B19',[[10]]);
wb.recalculate();
const originalMonsterRows=mon.getRange('A8:K13').values;
put(mon,'A8:K13',originalMonsterRows.slice().reverse());wb.recalculate();
assert.equal(ws.getRange('K8').values[0][0],100);assert.equal(ws.getRange('N8').values[0][0],2000);
near(tow.getRange('L11').values[0][0],(50-25)/.9);
put(mon,'A8:K13',originalMonsterRows);formula(mon,'H8:H13',monsters.map((m,i)=>[`=G${i+8}+$B$19`]));
wb.recalculate();
const errors=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:20},summary:'Formula error scan',maxChars:2000});
await fs.writeFile(path.join(out,'formula-scan.ndjson'),errors.ndjson);
console.log('FORMULA SCAN',errors.ndjson);
for(const sheet of Object.values(sheets))for(const row of sheet.getUsedRange().values)for(const v of row)if(typeof v==='string')assert(!/^#(REF!|DIV\/0!|VALUE!|NAME\?|N\/A|NUM!|NULL!|SPILL!|CALC!)/.test(v),v);
console.log((await wb.inspect({kind:'table',range:'Waves!A8:N12',include:'values,formulas',tableMaxRows:5,tableMaxCols:14,maxChars:1600})).ndjson);
const views=[['Waves','A1:N20','waves'],['Waves','A42:N54','waves-final'],['Monster','A1:K26','monster'],['Tower','A1:O20','tower'],['Upgrade','A1:K26','upgrade']];
for(const [sheetName,range,name]of views){const preview=await wb.render({sheetName,range,scale:1.5,format:'png'});await fs.writeFile(path.join(out,name+'.png'),new Uint8Array(await preview.arrayBuffer()));}
const target=path.join(out,'Celestial_Void_Data_Wave_Monster_Tower.xlsx');
const xlsx=await SpreadsheetFile.exportXlsx(wb);await xlsx.save(target);
// Roundtrip ensures exported tables/formulas and cached values remain usable.
const reopened=await SpreadsheetFile.importXlsx(await FileBlob.load(target));reopened.recalculate();
assert.equal(reopened.worksheets.getItem('Waves').getRange('I8').values[0][0],20);
assert.equal(reopened.worksheets.getItem('Waves').getRange('J12').values[0][0],360);
assert.equal(reopened.worksheets.getItem('Monster').getRange('H13').values[0][0],35);
const row42=builds.findIndex(b=>b.a===4&&b.b===2)+11;assert.equal(reopened.worksheets.getItem('Tower').getRange('N'+row42).values[0][0],5070);
for(const [name,bytes]of before)assert((await fs.readFile(path.join(root,name))).equals(bytes),`Game source changed: ${name}`);
const validation={waves:plans.length,monsters:monsters.length,towerBuilds:builds.length,upgrades:upgrades.length,seed:waveConfig.Seed,totalEnemies:plans.reduce((s,p)=>s+p.queue.length,0),totalKillGold:plans.reduce((s,p)=>s+p.spent,0),firstSelectedGolemWave:plans.find(p=>p.counts.VoidGolem>0).wave,checks:['45 wave compositions reconcile to active embedded generator','all monster rows match EnemyTypes','21 build stats reconcile to actual star.stats','8 prices/descriptions match config','count/buff input edits recalculate and restored','monster ID lookups stay correct after row reordering','formula scan clear','XLSX roundtrip verified','game files unchanged'],sourceHashes:Object.fromEntries([...before].map(([name,bytes])=>[name,crypto.createHash('sha256').update(bytes).digest('hex')]))};
await fs.writeFile(path.join(out,'validation.json'),JSON.stringify(validation,null,2));
console.log('SAVED',target);console.log('VALIDATED',JSON.stringify(validation));
