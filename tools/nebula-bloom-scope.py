"""Normalize authorized additive tower art for the historical gameplay audit."""
import copy,json
from pathlib import Path

manifest=Path(__file__).resolve().parent.parent/'assets/towers/fusion/manifest.json'
pack=json.loads(manifest.read_text(encoding='utf-8')) if manifest.is_file() else {'towers':{},'assets':{}}
fusion_rows=pack['towers'].values()
fusion_previews=[r['gdevelopIndex'] for r in fusion_rows if 'gdevelopIndex' in r]
fusion_ids={r['entryId'] for r in fusion_previews}
fusion_tiers={id+'_E'+str(tier) for id in pack['towers'] for tier in range(1,4)}
fusion_animations={r['animation'] for r in fusion_previews}|fusion_tiers
fusion_cues={'Fusion_'+asset['sfxName'] for asset in pack['assets'].values() if asset['assetType']=='audio'}
fusion_portraits=fusion_ids|fusion_tiers
SHARED={'TilePlacement_Indicator','TileType_Button','SelectedTowerPreview','IndexShowcase','StarUpgradeIcon'}

def without_fusion_object(obj):
    o=copy.deepcopy(obj)
    if o['name'] in {'SelectedTowerPreview','IndexShowcase','IndexTowerImage','NebulaPoisonIcon','StarburstGhost'}:
        o['animations']=[a for a in o['animations'] if a['name'] not in fusion_animations|fusion_ids]
    return o

def without_fusion_variable(variable):
    v=copy.deepcopy(variable)
    if v['name'] in {'TowerFootprints','IndexPortraitCatalog'}:
        names=fusion_ids if v['name']=='TowerFootprints' else fusion_portraits
        v['children']=[c for c in v['children'] if c['name'] not in names]
    elif v['name']=='FusionCatalog':
        v['children']=[c for c in v['children'] if not any(p['name']=='Id' and p.get('value') in fusion_ids for p in c['children'])]
    elif v['name']=='AudioConfig':
        sfx=next(c for c in v['children'] if c['name']=='SFX')
        sfx['children']=[c for c in sfx['children'] if c['name'] not in fusion_cues]
    return v

def original_objects(objects):
    result=[without_fusion_object(o) for o in objects]
    for o in result:
        if o['name'] in SHARED:o['animations']=[a for a in o['animations'] if not a['name'].startswith('NB_') and a['name']!='NebulaBloomTower']
    return result
def original_variable(variable):
    v=without_fusion_variable(variable)
    if v['name'] in ['TowerFootprints','IndexPortraitCatalog']:v['children']=[c for c in v['children'] if c['name']!='NebulaBloomTower']
    elif v['name']=='TowerShopCatalog':v['children']=[c for c in v['children'] if not any(p.get('name')=='Type' and p.get('value')=='NebulaBloomTower' for p in c['children'])]
    return v
