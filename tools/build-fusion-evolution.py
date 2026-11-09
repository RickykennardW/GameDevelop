"""Embed the Fusion balance config and connect the authored pack to Game Scene."""

import copy
import hashlib
import json
import runpy
import uuid
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = 'assets/towers/fusion/manifest.json'
BALANCE = 'tools/fusion-evolution-config.json'
SOURCES = 'tools/source-mapping.json'
variable = runpy.run_path(str(ROOT / 'tools/register-fusion-index-assets.py'))['variable']


def read(file):
    return json.loads((ROOT / file).read_text(encoding='utf-8-sig'))


def write(file, data):
    path = ROOT / file
    result = json.dumps(data, ensure_ascii=False, indent=2) + '\n'
    if path.read_text(encoding='utf-8-sig') != result:
        path.write_text(result, encoding='utf-8')


def put(records, name, entry):
    for i, old in enumerate(records):
        if old['name'] == name:
            records[i] = entry
            return
    records.append(entry)


def build():
    project_file, scene_file = 'Tower Defense.json', 'layouts/game-scene.json'
    project, scene, manifest, config = map(read, (project_file, scene_file, MANIFEST, BALANCE))
    assets, families = manifest['assets'], manifest['towers']
    assert families.keys() == config['Towers'].keys()
    for file, asset in assets.items():
        path = (ROOT / file).resolve()
        assert path.is_relative_to((ROOT / 'assets/towers/fusion').resolve()) and file == asset['file'], file
        assert hashlib.sha256(path.read_bytes()).hexdigest() == asset['sha256'], file
    variables = {v['name']: v for v in scene['variables']}
    objects = {o['name']: o for o in scene['objects']}
    resources = {r['name']: r for r in project['resources']['resources']}
    paths = {r['file'].casefold(): r['name'] for r in resources.values()}
    registered = set()

    def resource(file, status='RegisteredGameplay'):
        asset = assets[file]
        name = asset['resourceName']
        if name not in resources:
            assert file.casefold() not in paths, file
            flags = {'preloadAsMusic': False, 'preloadAsSound': False, 'preloadInCache': False} if asset['assetType'] == 'audio' else {'smoothed': True}
            entry = {'file': file, 'kind': 'audio' if asset['assetType'] == 'audio' else 'image',
                     'metadata': '', 'name': name, 'userAdded': True, **flags}
            resources[name] = entry
            paths[file.casefold()] = name
            project['resources']['resources'].append(entry)
        else:
            assert resources[name]['file'] == file, name
        registered.add(file)
        asset['importStatus'] = status
        return name

    def animation(name, image):
        entry = copy.deepcopy(objects['StarburstGhost']['animations'][0])
        entry['name'] = name
        entry['directions'][0]['sprites'][0]['image'] = image
        return entry

    def use_animation(obj, name, image):
        put(objects[obj]['animations'], name, animation(name, image))

    def clip_data(file, clip):
        data = {'file': resource(file), 'frames': clip['frameRects'], 'fps': clip['fps'],
                'loop': clip['loop'], 'origin': clip['origin']}
        if 'muzzlePointsByFrame' in clip:
            data['muzzles'] = clip['muzzlePointsByFrame']
        asset = assets[file]
        if 'renderSizeWorldPx' in asset:
            data['size'] = asset['renderSizeWorldPx']
        if 'layerHint' in asset:
            data['layer'] = asset['layerHint']
        return data

    def atlas_map(files):
        return {assets[file]['clip']['animationName']: clip_data(file, assets[file]['clip']) for file in files}

    sfx = next(v for v in variables['AudioConfig']['children'] if v['name'] == 'SFX')['children']

    def audio(files):
        result = {}
        for file in files:
            asset = assets[file]
            cue = asset['sfxName']
            key = 'Fusion_' + cue
            prominent = any(word in cue for word in ('ascension', 'materialization', 'complete', 'explosion', 'collapse', 'detonation', 'activation', 'burst', 'network'))
            gain = asset['recommendedGain'] * (0.6 if 'flight' in cue or 'release' in cue else 1)
            put(sfx, key, variable(key, {'File': resource(file), 'Group': 'medium' if prominent else 'low',
                                        'Gain': round(gain, 3), 'Duration': asset['durationSeconds'],
                                        'Cooldown': asset['minimumRepeatSeconds'], 'VaryPitch': not prominent}))
            result[cue] = key
        return result

    family_ids = set(families)
    old_ids = {'FusionPreview_' + id for id in family_ids}
    catalog = variables['FusionCatalog']['children']
    catalog[:] = [row for row in catalog if not any(c['name'] == 'Id' and c.get('value') in old_ids | family_ids for c in row['children'])]
    portraits = variables['IndexPortraitCatalog']['children']
    portraits[:] = [row for row in portraits if row['name'] not in old_ids]
    objects['IndexShowcase']['animations'][:] = [a for a in objects['IndexShowcase']['animations'] if a['name'] not in {id+'_E1' for id in old_ids}]
    tower_names = {'StarCannonTower': 'Star Cannon', 'NebulaBloomTower': 'Nebula Bloom'}
    for row in variables['TowerShopCatalog']['children']:
        fields = {x['name']: x.get('value') for x in row['children']}
        tower_names[fields['Type']] = fields['Name']
    shared = manifest['shared']
    art = {'towers': {}, 'shared': {'effects': atlas_map(shared['effects']), 'sound': audio(shared['audio']),
                                   'timeline': shared['materializationTimeline'], 'pureAccent': shared['pureAccent']}}

    for id, family in families.items():
        definition = config['Towers'][id]
        assert family['productionStatus'] == 'Complete'
        style = {'scale': family['assetScaleWorldPerPixel'], 'tiers': [], 'projectiles': atlas_map(family['projectiles']),
                 'effects': atlas_map(family['effects']), 'sound': audio(family['audio']),
                 'shadow': resource(family['accessories']['shadow'])}
        art['towers'][id] = style
        for tier_index, (tier, detail) in enumerate(family['tiers'].items()):
            assert tier == f'E{tier_index + 1}'
            definition['Tiers'][tier_index]['Name'] = detail['name']
            atlas = detail['motionAtlas']
            portrait = detail['index']['portrait']
            portrait_name = id + '_' + tier
            portrait_id = id if tier_index == 0 else portrait_name
            portrait_resource = resource(portrait, 'RegisteredIndex')
            use_animation('IndexShowcase', portrait_name, portrait_resource)
            put(portraits, portrait_id, variable(portrait_id, {'Animation': portrait_name, 'Image': portrait_resource,
                                                             'VisualBounds': assets[portrait]['visualBounds']}))
            preview = resource(detail['preview'])
            use_animation('SelectedTowerPreview', portrait_name, preview)
            style['tiers'].append({'name': tier, 'base': resource(detail['parts']['base']), 'pivot': detail['rig']['pivot'],
                                   'facing': detail['rig']['restFacingDegrees'], 'muzzles': detail['rig']['muzzlePoints'],
                                   'clips': {name: clip_data(atlas, clip) for name, clip in assets[atlas]['clips'].items()}})
        use_animation('StarburstGhost', id, resource(family['tiers']['E1']['preview']))
        use_animation('IndexTowerImage', id + '_E1', resource(family['tiers']['E1']['index']['portrait'], 'RegisteredIndex'))
        if 'PoisonStatus' in style['effects']:
            use_animation('NebulaPoisonIcon', id, style['effects']['PoisonStatus']['file'])
        index_file = family['tiers']['E1']['index']['portrait']
        family['gameplayStatus'] = 'Playable'
        family['gdevelopIndex'] = {'entryId': id, 'animation': id + '_E1', 'object': 'IndexShowcase',
                                   'resourceName': assets[index_file]['resourceName'], 'importStatus': 'RegisteredIndex', 'recipeStatus': 'Active'}
        recipe = [{'Type': p['object'], 'Path1': p['path1'], 'Path2': p['path2'],
                   'Label': f"{tower_names[p['object']]} {p['path1']}-{p['path2']}"} for p in family['recipe']]
        catalog.append(variable(str(len(catalog)), {
            'Id': id, 'Name': family['name'], 'Kind': family['category'], 'Animation': id + '_E1',
            'Hint': family['hint'], 'Description': definition['Tiers'][0]['Description'], 'AdaptiveVariants': False,
            'Variants': [{'Id': 'fusion', 'Name': family['name'], 'Recipe': recipe}],
        }))
        # Each result has a distinct native logical owner. The pooled renderer
        # attaches its stationary base and rotating head to the real world layer.
        obj = copy.deepcopy(objects['StarburstGhost'])
        fields = {name: 0 for name in ('TowerId', 'PurchasePrice', 'TotalInvestment', 'DamageDealt', 'Damage', 'AttackRange',
                                       'AttackInterval', 'ProjectileSpeed', 'CurrentDamage', 'CurrentRange', 'CurrentAttackInterval',
                                       'CurrentProjectileSpeed', 'SellValue', 'FootprintX', 'FootprintY', 'FootprintRadius',
                                       'FootprintOffsetX', 'FootprintOffsetY', 'TargetId', 'ShotCounter', 'TurretFacing')}
        fields.update(TowerType=id, TowerName=family['name'], EvolutionTier=1, EvolutionPhase='Idle')
        obj.update(name=id, persistentUuid=str(uuid.uuid5(uuid.NAMESPACE_URL, 'starfall-bastion/'+id)),
                   variables=[variable(name, val) for name, val in fields.items()],
                   animations=[animation(tier, resource(detail['preview'])) for tier, detail in family['tiers'].items()])
        put(scene['objects'], id, obj)
        footprints = variables['TowerFootprints']['children']
        put(footprints, id, variable(id, {'AnchorX': .5, 'AnchorY': .5, 'Height': 64, 'Width': 64,
                                          'Radius': definition['Radius'], 'SafetyGap': definition['SafetyGap'],
                                          'RenderScale': 1}))

    # GDevelop's scene preloader finds images through native animations. The
    # compact atlas metadata alone does not preload them before the first hit.
    preload_name = 'FusionEvolutionArtSource'
    referenced = {s['image'] for o in scene['objects'] if o['name'] != preload_name
                  for a in o.get('animations', []) for d in a['directions'] for s in d['sprites']}
    atlas_images = sorted(assets[file]['resourceName'] for file in registered if assets[file]['assetType'] != 'audio'
                          and assets[file]['resourceName'] not in referenced)
    registry = copy.deepcopy(objects['StarburstGhost'])
    registry.update(name=preload_name, persistentUuid=str(uuid.uuid5(uuid.NAMESPACE_URL, 'starfall-bastion/'+preload_name)),
                    animations=[animation(f'Atlas_{i:03}', image) for i, image in enumerate(atlas_images)])
    put(scene['objects'], preload_name, registry)
    folder = next(f for f in scene['objectsFolderStructure']['children'] if f['folderName'] == '03_TOWERS')
    entry = {'folderName': 'Fusion Evolutions', 'children': [{'objectName': id} for id in (*families, preload_name)]}
    for i, child in enumerate(folder['children']):
        if child.get('folderName') == entry['folderName']:
            folder['children'][i] = entry
            break
    else:
        folder['children'].append(entry)
    put(scene['variables'], 'FusionEvolutionConfig', variable('FusionEvolutionConfig', config))
    # Compact animation metadata is decoded once per scene. Resource names are
    # still registered natively, so the export does not need filesystem access.
    put(scene['variables'], 'FusionEvolutionArt', variable('FusionEvolutionArt', json.dumps(art, separators=(',', ':'))))
    mapping = read(SOURCES)
    for name in ('fusion-evolution-runtime.js', 'fusion-evolution-combat.js'):
        if any(entry[2] == name for entry in mapping):
            continue
        init = scene['events'][0]['events']
        mapping.append([0, [len(init)], name])
        init.append({'type': 'BuiltinCommonInstructions::JsCode', 'parameterObjects': '', 'useStrict': True, 'inlineCode': []})
    for index, children, name in mapping:
        event = scene['events'][index]
        for child in children:
            event = event['events'][child]
        event['inlineCode'] = (ROOT / 'tools' / name).read_text(encoding='utf-8-sig').splitlines()
    write(project_file, project)
    write(scene_file, scene)
    write(SOURCES, mapping)
    write(MANIFEST, manifest)
    print(f'Connected {len(families)} native Fusion towers and {len(registered)} art/audio resources.')


if __name__ == '__main__':
    build()
