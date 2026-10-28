"""Normalize only authorized additive Nebula UI/catalog extensions for old audits."""
import copy
SHARED={'TilePlacement_Indicator','TileType_Button','SelectedTowerPreview','IndexShowcase','StarUpgradeIcon'}
def original_objects(objects):
    result=copy.deepcopy(objects)
    for o in result:
        if o['name'] in SHARED:o['animations']=[a for a in o['animations'] if not a['name'].startswith('NB_') and a['name']!='NebulaBloomTower']
    return result
def original_variable(variable):
    v=copy.deepcopy(variable)
    if v['name'] in ['TowerFootprints','IndexPortraitCatalog']:v['children']=[c for c in v['children'] if c['name']!='NebulaBloomTower']
    elif v['name']=='TowerShopCatalog':v['children']=[c for c in v['children'] if not any(p.get('name')=='Type' and p.get('value')=='NebulaBloomTower' for p in c['children'])]
    return v
