"""Audit the First Contact scope and calculate affordability using live prices."""

import copy
import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASELINE = '0fdee95'
STAGE_SOURCES = {'campaign-game-runtime.js', 'nova-wave-manager.js', 'unit-index-runtime.js'}
REWARD_PATH = (10, 0, 9)
REWARD_GUARDS = [
    {'type': {'value': 'NumberVariable'}, 'parameters': ['Lives', '>', '0']},
    {'type': {'value': 'BooleanVariable'}, 'parameters': ['GameOver', 'False', '']},
]


def read(file):
    return json.loads((ROOT / file).read_text(encoding='utf-8-sig'))


def previous(file):
    data = subprocess.check_output(['git', 'show', f'{BASELINE}:{file}'], cwd=ROOT)
    return json.loads(data.decode('utf-8-sig'))


def value(node):
    if node['type'] == 'structure':
        return {child['name']: value(child) for child in node['children']}
    if node['type'] == 'array':
        return [value(child) for child in node['children']]
    return node['value']


def event(scene, path):
    node = scene
    for index in path:
        node = node['events'][index]
    return node


def restore_clear_guards(scene, original):
    before = event(original, REWARD_PATH)['conditions']
    target = event(scene, REWARD_PATH)
    assert target['conditions'] == before + REWARD_GUARDS, 'Native clear guard scope'
    target['conditions'] = before


def restore_first_level(scene, original):
    def first(layout):
        config = next(node for node in layout['variables'] if node['name'] == 'CampaignConfig')
        return next(node for node in config['children'] if node['name'] == 'Levels')['children']
    first(scene)[0] = first(original)[0]


def simulate(level, prices, upgrade, leak):
    bank, lives, total_spent = level['StartingGold'], level['StartingLives'], 0
    plan = [
        (1, 'Star Cannon', prices['StarCannonTower']),
        (2, 'Star Compression', upgrade['StarCannonConfig'][0][0]),
        (4, 'Second Star Cannon', prices['StarCannonTower']),
        (6, 'Nebula Bloom', prices['NebulaBloomTower']),
        (7, 'Nebula path 1 tiers 1–2', sum(upgrade['NebulaBloomConfig'][0][:2])),
        (8, 'Star path 1 tier 2', upgrade['StarCannonConfig'][0][1]),
        (8, 'Both Star path 2 tier 1', 2 * upgrade['StarCannonConfig'][1][0]),
        (9, 'Blight Bloom', upgrade['NebulaBloomConfig'][0][2]),
        (10, 'Rapid Starflow', upgrade['StarCannonConfig'][1][1]),
        (11, 'Nova Impact', upgrade['StarCannonConfig'][0][2]),
        (12, 'Second Nebula and path 2 tiers 1–2', prices['NebulaBloomTower'] + sum(upgrade['NebulaBloomConfig'][1][:2])),
        (13, 'Bloom Detonation', upgrade['NebulaBloomConfig'][1][2]),
        (13, 'Second Star path 2 tier 2', upgrade['StarCannonConfig'][1][1]),
    ]
    rows, bought = [], {}
    for spec in level['Waves']:
        wave = spec['Number']
        opening = bank
        while plan and plan[0][0] <= wave and plan[0][2] <= bank:
            _, name, cost = plan.pop(0)
            bank -= cost
            total_spent += cost
            bought[name] = wave
        if wave == 15:
            for name, config in [('Starbreaker', 'StarCannonConfig'), ('Caustic Canopy', 'NebulaBloomConfig')]:
                cost = upgrade[config][0][3]
                if bank >= cost:
                    bank -= cost
                    total_spent += cost
                    bought[name] = wave
                    break
        lives -= int(leak)
        lost = max(level['EnemyRewards'][kind] for kind in spec['Enemies']) if leak else 0
        income = spec['ExpectedGold'] - lost
        bonus = spec['CompletionGold'] if lives > 0 else 0
        bank += income + bonus
        rows.append({'wave': wave, 'enemies': sum(spec['Enemies'].values()), 'openingBank': opening,
                     'killGold': income, 'leakedGold': lost, 'clearGold': bonus, 'spentToDate': total_spent,
                     'closingBank': bank, 'lives': lives})
    assert bought['Star Compression'] <= 3 and bought['Second Star Cannon'] <= 6
    assert bought['Blight Bloom'] <= 10 and bought['Nova Impact'] <= 13
    return {'purchasesBeforeWave': bought, 'rows': rows}


def main():
    scene = read('layouts/game-scene.json')
    old_scene = previous('layouts/game-scene.json')
    variables = {node['name']: value(node) for node in scene['variables']}
    for root, children, source in read('tools/source-mapping.json'):
        target = event(scene, [root, *children])
        assert target['inlineCode'] == (ROOT / 'tools' / source).read_text(encoding='utf-8-sig').splitlines(), source
        if source in STAGE_SOURCES:
            target['inlineCode'] = event(old_scene, [root, *children])['inlineCode']
    restore_clear_guards(scene, old_scene)
    assert scene == old_scene, 'Game Scene scope beyond stage runtime and reward guards'

    config = read('tools/campaign-config.json')
    old_config = previous('tools/campaign-config.json')
    levels = read('layouts/levels.json')
    old_levels = previous('layouts/levels.json')
    assert value(next(node for node in levels['variables'] if node['name'] == 'CampaignConfig')) == config
    restore_first_level(levels, old_levels)
    assert levels == old_levels
    restore = copy.deepcopy(config)
    restore['Levels'][0] = old_config['Levels'][0]
    assert restore == old_config, 'Other 24 missions and chapter bosses must retain their exact configuration'
    for file in ('Tower Defense.json', 'layouts/main-menu.json', 'eventsFunctionsExtensions/health.json'):
        assert read(file) == previous(file), file
    assert not subprocess.check_output(['git', 'diff', BASELINE, '--name-only', '--', 'assets'], cwd=ROOT).strip()

    level, old_level = config['Levels'][0], old_config['Levels'][0]
    rewards = level['EnemyRewards']
    assert level['Id'] == '1-1' and len(level['Waves']) == 15
    assert set(rewards) == set(variables['EnemyTypes']) and all(type(amount) is int and amount > 0 for amount in rewards.values())
    assert variables['WaveCompletionReward'] == 0
    for kind in ('VoidHound', 'VoidGolem'):
        assert variables[kind + 'Config']['Reward'] == variables['EnemyTypes'][kind]['Reward'], kind
    seen = {}
    for spec in level['Waves']:
        wave = spec['Number']
        for kind in spec['Enemies']:
            seen.setdefault(kind, wave)
        assert spec['ExpectedGold'] == sum(rewards[kind] * count for kind, count in spec['Enemies'].items())
        assert 0 < spec['CompletionGold'] < spec['ExpectedGold']
        slots = spec.get('EliteSpawnSlots', [])
        assert len(slots) == spec['Enemies'].get('VoidGolem', 0) and slots == sorted(set(slots))
        assert all(1 < slot < sum(spec['Enemies'].values()) for slot in slots)
    assert seen == {kind: stats['MinimumWave'] for kind, stats in variables['EnemyTypes'].items()}
    assert level['ExpectedKillGold'] == sum(spec['ExpectedGold'] for spec in level['Waves'])
    prices = {item['Type']: item['Cost'] for item in variables['TowerShopCatalog']}
    upgrades = {key: [[tier['Cost'] for tier in path['Upgrades']] for path in variables[key]['Paths']]
                for key in ('StarCannonConfig', 'NebulaBloomConfig')}
    assert level['StartingGold'] - prices['StarCannonTower'] < min(path[0] for path in upgrades['StarCannonConfig'])
    report = {
        'passed': True, 'mission': level['Id'], 'previousWaves': len(old_level['Waves']), 'waves': len(level['Waves']),
        'previousStartingGold': old_level['StartingGold'], 'startingGold': level['StartingGold'],
        'rewards': {kind: {'old': variables['EnemyTypes'][kind]['Reward'], 'new': amount, 'firstWave': seen[kind]}
                    for kind, amount in rewards.items()},
        'previousKillGold': old_level['ExpectedKillGold'], 'potentialKillGold': level['ExpectedKillGold'],
        'potentialClearGold': sum(spec['CompletionGold'] for spec in level['Waves']),
        'prices': prices, 'upgradePrices': upgrades, 'otherMissionsUnchanged': True,
        'allKills': simulate(level, prices, upgrades, False),
        'oneHighestRewardLeakPerWave': simulate(level, prices, upgrades, True),
    }
    (ROOT / 'validation/stage-progression-static.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf8')
    print(json.dumps({k: v for k, v in report.items() if k not in {'allKills','oneHighestRewardLeakPerWave'}}))


if __name__ == '__main__':
    main()
