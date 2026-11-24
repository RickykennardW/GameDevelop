"""Extract authored sprite sheets into usable assets; no project/source snapshots.

Input sheets are generated originals, not copies of existing game resources.
Only asset separation, alpha normalization, seam correction and modular masks
are performed here. No towers, enemies or combat data are touched.
"""
import base64
import hashlib
import io
import json
import math
import os
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

ROOT=Path(__file__).resolve().parents[1]
GENERATED=Path(os.environ.get('CELESTIAL_GENERATED_ART',r'C:/Users/My ASUS/.codex/generated_images/01a20c44-7491-7e53-95d8-ce8b225695a5'))
SHEETS={
 'emberfall':'exec-51528bee-fbf3-4d75-a10f-ddc5fa57c0d2.png',
 'nebula':'exec-28c75bba-70dc-4a33-b9e9-6a0286d65638.png',
 'reliquary':'exec-dc2e9eb6-ccb5-4a2a-92b7-8b9e2f834416.png',
 'astral':'exec-85b0a633-9656-401b-8023-d70a5aae1b92.png',
 'belt':'exec-7997fa87-4688-4c8f-8f42-3c3865876acf.png'}
MATERIAL='exec-f3d32fcf-1e59-4928-959d-f79f508df99d.png'
HORIZONS='exec-a2035ea5-1c5d-40c5-8903-208898701aff.png'
NAMES={
 'emberfall':['basalt_slab','obsidian_peak','split_boulder','basalt_cluster','basalt_columns','magma_rock','magma_crystals','volcanic_boulder','carved_basalt','lava_chimney','cooled_ridge','gold_ore','geothermal_reactor','mining_drill','broken_pillar','geothermal_shrine','magma_turbine','energy_obelisk','ruined_arch','excavator_relic','basalt_island','fractured_island','distant_island','spire_island','broken_molten_island','ember_plant','ash_vent','lava_pool','magma_fissure','gold_crystals','ash_mound','volcanic_flowers','ground_rune','ember_motes','smoke_wisp','ash_plume'],
 'nebula':['moonstone_slab','spiral_crystal','star_geode','celestial_pebbles','crystal_fan','hollow_starstone','prism_cluster','star_ore','orbit_fossil','energy_geode','rock_helix','meteor_cluster','star_observatory','celestial_portal','nebula_generator','alien_monument','star_chart','orbital_lens','gravity_anchor','broken_astrolabe','nebula_island','crescent_island','star_island','ring_island','shattered_island','luminous_fern','star_beacon','nebula_pool','energy_fissure','tiny_crystal','star_flower','floating_lights','celestial_seal','star_motes','cyan_wisp','dust_swirl'],
 'reliquary':['snow_slab','glacier_spire','split_ice','snow_cluster','ice_shelf','dark_ice','frost_crystals','glacial_boulder','frozen_stele','ice_chimney','glacier_ridge','silver_ore','frozen_temple','ice_observatory','cryogenic_machine','frozen_monument','frost_pylon','reliquary_chamber','frozen_gateway','cryo_antenna','glacier_island','snow_island','distant_ice_island','ice_spire_island','broken_glacier_island','frozen_plant','frost_vent','frozen_pool','frosted_crack','tiny_crystal','snow_mound','frost_flowers','frozen_seal','snow_motes','cold_mist','ice_dust'],
 'astral':['carved_slab','pillar_shaft','sandstone_boulder','stone_fragments','fluted_columns','carved_block','energy_crystal','statue_head','celestial_stele','broken_capital','arch_fragment','bronze_relic','celestial_temple','solar_observatory','broken_monument','alien_gateway','energy_machine','celestial_altar','armillary_sanctuary','ruined_colonnade','temple_island','celestial_platform','distant_stone_island','architectural_island','broken_ancient_island','golden_plant','incense_vent','energy_pool','ground_channel','tiny_crystal','sandstone_rubble','alien_statue','celestial_seal','gold_motes','energy_wisp','sand_plume'],
 'belt':['meteor_slab','nickel_spire','split_asteroid','meteor_cluster','iron_columns','copper_asteroid','mineral_crystal','meteor_boulder','alien_bulkhead','hollow_asteroid','metallic_ridge','ore_node','mining_station','drill_rig','mining_tower','alien_factory','space_antenna','energy_capacitor','salvage_crane','breached_habitat','metal_asteroid','industrial_platform','distant_meteor','industrial_asteroid','planetary_chunk','copper_plant','steam_vent','cooling_pool','cable_channel','tiny_mineral','scrap_heap','amber_lamp','maintenance_hatch','debris_specks','steam_wisp','spark_plume']}

def url(image):
 out=io.BytesIO();image.save(out,format='PNG');return 'data:image/png;base64,'+base64.b64encode(out.getvalue()).decode()

def seamless(image):
 """Periodic plus smooth decomposition removes lighting/edge discontinuities."""
 a=np.array(image.convert('RGB').resize((128,128),Image.Resampling.LANCZOS),dtype=float)
 # Remove broad baked lighting, which otherwise reads as horizontal bands when
 # repeated by a native TiledSprite. Fine authored material detail remains.
 blur=np.asarray(Image.fromarray(a.astype(np.uint8)).filter(ImageFilter.GaussianBlur(13)),dtype=float)
 a=np.clip(a-blur+a.mean(axis=(0,1),keepdims=True),0,255)
 h,w,_=a.shape;v=np.zeros_like(a)
 v[0,:,:]=a[-1,:,:]-a[0,:,:];v[-1,:,:]=-v[0,:,:]
 v[:,0,:]+=a[:,-1,:]-a[:,0,:];v[:,-1,:]-=a[:,-1,:]-a[:,0,:]
 denominator=2*np.cos(2*np.pi*np.arange(w)/w)[None,:]+2*np.cos(2*np.pi*np.arange(h)/h)[:,None]-4;denominator[0,0]=1
 smooth=np.fft.fft2(v,axes=(0,1))/denominator[:,:,None];smooth[0,0,:]=0
 result=np.clip(a-np.fft.ifft2(smooth,axes=(0,1)).real,0,255)
 # Blend opposing border neighborhoods, not just a single pixel. A one-pixel
 # equality alone can still leave a dark rectangular seam in a repeated tile.
 for k in range(16):
  f=.5*(1-k/16);left=result[:,k,:].copy();right=result[:,-1-k,:].copy();result[:,k,:]=left*(1-f)+right*f;result[:,-1-k,:]=right*(1-f)+left*f
 for k in range(16):
  f=.5*(1-k/16);top=result[k,:,:].copy();bottom=result[-1-k,:,:].copy();result[k,:,:]=top*(1-f)+bottom*f;result[-1-k,:,:]=bottom*(1-f)+top*f
 result=np.clip(result,0,255).astype(np.uint8);result[-1,:,:]=result[0,:,:];result[:,-1,:]=result[:,0,:]
 return Image.fromarray(result).convert('RGBA')

def isolate(sheet,index):
 row,col=divmod(index,6);w,h=sheet.size
 cell=sheet.crop((round(col*w/6),round(row*h/6),round((col+1)*w/6),round((row+1)*h/6))).convert('RGBA')
 a=np.array(cell);alpha=a[:,:,3].astype(float)
 # The generator supplied low-alpha matte in some sheets. Remove that matte,
 # retain antialiasing, and explicitly leave transparent padding for native art.
 floor=65 if index>=33 else 105
 alpha=np.clip((alpha-floor)*255/(245-floor),0,255).astype(np.uint8)
 alpha[:2]=0;alpha[-2:]=0;alpha[:,:2]=0;alpha[:,-2:]=0;a[:,:,3]=alpha
 cell=Image.fromarray(a);box=cell.getchannel('A').point(lambda x:255 if x>24 else 0).getbbox()
 assert box,(index,'empty generated asset')
 cell=cell.crop(box);cell.thumbnail((236,236),Image.Resampling.LANCZOS)
 result=Image.new('RGBA',(256,256));result.alpha_composite(cell,((256-cell.width)//2,(256-cell.height)//2))
 return result

def ground_modules(base,variation,road):
 modules={'base':base,'variation':variation}
 # Role-specific masks, not recolors. Every seamless interior tile has identical
 # opposing edges; edges/corners are intentionally transparent map-boundary tiles.
 for name in ['edge','outer_corner','inner_corner','obstacle_adjacent','decorative','special','transition','ash_or_dust','material_inlay','fractured']:
  image=base.copy();mask=Image.new('L',(128,128));d=ImageDraw.Draw(mask)
  if name=='edge':d.polygon([(0,12),(20,8),(44,15),(70,6),(100,13),(127,9),(127,127),(0,127)],fill=255);image.putalpha(mask)
  elif name=='outer_corner':d.rounded_rectangle((8,8,160,160),radius=38,fill=255);image.putalpha(mask)
  elif name=='inner_corner':mask.paste(255,(0,0,128,128));d.ellipse((-39,-39,52,52),fill=0);image.putalpha(mask)
  else:
   if name=='obstacle_adjacent':d.ellipse((17,17,111,111),fill=220)
   elif name=='decorative':d.polygon([(22,20),(94,32),(111,79),(67,112),(15,77)],fill=140)
   elif name=='special':d.ellipse((24,24,104,104),fill=180)
   elif name=='transition':d.rectangle((28,0,100,128),fill=180)
   elif name=='ash_or_dust':d.ellipse((9,33,109,96),fill=130)
   elif name=='material_inlay':d.rounded_rectangle((24,24,104,104),radius=12,fill=205)
   else:d.polygon([(19,27),(100,18),(91,76),(115,108),(22,101)],fill=230)
   mask=mask.filter(ImageFilter.GaussianBlur(10));image=Image.composite(road if name in ['special','material_inlay'] else variation,base,mask)
  modules[name]=image
 return modules

def path_modules(texture,edge):
 result={};S=128
 for name in ['straight','curve','corner','intersection','transition','spawn','finish','endcap']:
  mask=Image.new('L',(S,S));d=ImageDraw.Draw(mask)
  if name=='curve':d.arc((-64,-64,64,64),0,90,fill=255,width=60)
  elif name=='corner':d.line([(0,64),(64,64),(64,0)],fill=255,width=60);d.ellipse((34,34,94,94),fill=255)
  elif name=='intersection':d.rectangle((34,0,94,128),fill=255);d.rectangle((0,34,128,94),fill=255)
  elif name=='endcap':d.rectangle((0,34,64,94),fill=255);d.ellipse((34,34,94,94),fill=255)
  elif name in ['spawn','finish']:d.rectangle((0,34,128,94),fill=255);d.ellipse((18,18,110,110),fill=255)
  elif name=='transition':d.polygon([(0,44),(128,24),(128,104),(0,84)],fill=255)
  else:d.rectangle((0,34,128,94),fill=255)
  outline=mask.filter(ImageFilter.MaxFilter(7));im=Image.new('RGBA',(S,S),edge);im.putalpha(outline);floor=texture.copy();floor.putalpha(mask);im.alpha_composite(floor)
  mark=ImageDraw.Draw(im)
  if name=='spawn':
   for x in (38,58,78):mark.line([(x,48),(x+12,64),(x,80)],fill=edge,width=3)
  elif name=='finish':mark.ellipse((38,38,90,90),outline=edge,width=3);mark.polygon([(64,47),(80,64),(64,81),(48,64)],outline=edge,width=3)
  result[name]=im
 return result

def frame_art(meta,base,rocks):
 # Retain the exact native frame crop contract. New faces use chapter materials
 # and different structural patterns, never the old purple crystal cliff.
 p=meta['Palette'];id=meta['Id'];accent=p['Accent'];tex=url(base)
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="1448" height="1086"><defs><pattern id="rock" width="128" height="128" patternUnits="userSpaceOnUse"><image href="{tex}" width="128" height="128"/></pattern><linearGradient id="depth" x2="0" y2="1"><stop stop-color="#05070b" stop-opacity=".12"/><stop offset="1" stop-color="#05070b" stop-opacity=".85"/></linearGradient></defs>'
 svg+='<defs><clipPath id="rim"><rect width="1448" height="180"/><rect y="880" width="1448" height="206"/><rect y="180" width="225" height="700"/><rect x="1223" y="180" width="225" height="700"/></clipPath>'
 for i,path in enumerate(rocks):svg+=f'<image id="stone{i}" href="{url(Image.open(ROOT/path))}" width="256" height="256"/>'
 svg+='</defs><g clip-path="url(#rim)">'
 for i,x in enumerate(range(-50,1460,135)):
  svg+=f'<use href="#stone{i%12}" x="{x}" y="-60"/><use href="#stone{(i*5+3)%12}" x="{x-15}" y="852"/>'
 for i,y in enumerate(range(125,910,130)):
  svg+=f'<use href="#stone{(i*7+1)%12}" x="-35" y="{y}"/><use href="#stone{(i*5+2)%12}" x="1210" y="{y}"/>'
 svg+='</g></svg>\n'
 return svg

def main():
 cfg=json.loads((ROOT/'tools/chapter-maps.json').read_text());materials=Image.open(GENERATED/MATERIAL);horizons=Image.open(GENERATED/HORIZONS);manifest={'Version':1,'Generator':'built-in image generation; sheet separation and seam correction','SourceHashes':{},'Chapters':{}}
 for path in list(SHEETS.values())+[MATERIAL,HORIZONS]:manifest['SourceHashes'][path]=hashlib.sha256((GENERATED/path).read_bytes()).hexdigest()
 for row,meta in enumerate(cfg['Maps']):
  id=meta['Id'];directory=ROOT/'assets/map/chapters'/id;assets=[]
  def save(category,name,image,purpose):
   path=directory/category/(name+'.png');path.parent.mkdir(parents=True,exist_ok=True);image.save(path,optimize=True)
   relative=path.relative_to(ROOT).as_posix();record={'Name':name,'Category':category,'Resource':relative,'Width':image.width,'Height':image.height,'Purpose':purpose,'Animation':'Chapter_Env_'+id+'_'+name}
   if category in ['Rocks','Structures']:
    a=np.asarray(image.getchannel('A'));ys,xs=np.where(a>32);record['OpaqueRadius']=float(np.max(np.hypot(xs-image.width/2,ys-image.height/2)))+2
   assets.append(record);return relative
  sheet=Image.open(GENERATED/SHEETS[id]);props=[]
  for i,name in enumerate(NAMES[id]):
   category='Rocks' if i<12 else 'Structures' if i<20 else 'FloatingIslands' if i<25 else 'Decorations' if i<33 else 'Effects'
   path=save(category,name,isolate(sheet,i),'blocking prop art' if i<20 else 'distant nonblocking island' if i<25 else 'nonblocking ground detail' if i<33 else 'restrained static atmospheric cutout');props.append(path)
  sw,sh=materials.size
  swatches=[seamless(materials.crop((round(c*sw/3),round(row*sh/5),round((c+1)*sw/3),round((row+1)*sh/5)))) for c in range(3)]
  # Quiet terrain stays behind enemies and footprint outlines; road stays bright.
  base=ImageEnhance.Brightness(swatches[0]).enhance(.74);variation=ImageEnhance.Brightness(swatches[1]).enhance(.74)
  road=ImageEnhance.Brightness(swatches[2]).enhance(1.12 if id=='emberfall' else 1.0)
  ground={name:save('Ground',name,im,'modular terrain '+name) for name,im in ground_modules(base,variation,road).items()}
  paths={name:save('Path','path_'+name,im,'60-unit route module; visual only') for name,im in path_modules(road,meta['Palette']['Edge']).items()}
  roadmat=save('Path','path_material',road,'seamless shared route material')
  horizon=horizons.crop((0,round(row*horizons.height/5),horizons.width,round((row+1)*horizons.height/5))).convert('RGBA')
  bg=save('Background','planetary_horizon',horizon,'distant atmosphere; never a flattened gameplay map')
  frame=directory/'Ground/cliff_frame.svg';frame.write_text(frame_art(meta,base,props[:12]),encoding='utf-8');framepath=frame.relative_to(ROOT).as_posix();assets.append({'Name':'cliff_frame','Category':'Ground','Resource':framepath,'Width':1448,'Height':1086,'Purpose':'native cropped perimeter; original collision envelope','Animation':'Chapter_Env_'+id+'_cliff_frame'})
  manifest['Chapters'][id]={'Assets':assets,'Ground':ground,'Paths':paths,'RoadMaterial':roadmat,'Backdrop':bg,'Frame':framepath,'Rocks':props[:12],'Structures':props[12:20],'Islands':props[20:25],'Decorations':props[25:33],'Effects':props[33:]}
 (ROOT/'tools/environment-library.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8');print(json.dumps({k:len(v['Assets']) for k,v in manifest['Chapters'].items()}))

if __name__=='__main__':main()
