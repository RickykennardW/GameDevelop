# Void Hound — implemented in latest Celestial Void project

Exactly one new enemy ID **VoidHound** (Fast Enemy). Nova Wisp remains intact. HP/MaxHP60, speed135, armor0, reward7, special abilityNone, minimumWave4. No additional variant, size/color/stat scaling or ability.

## Assets and animation

Four transparent RGBA PNGs in `assets/void_hound`: VoidHound_Right_Atlas.png, VoidHound_Left_Atlas.png, VoidHound_Down_Atlas.png, VoidHound_Up_Atlas.png.64 distinct painted poses:4 facings ×4 states ×4 poses. Source blueprint is the supplied Void Hound concept; built-in **imagegen** created detailed black/violet organic armor, long pointed glowing jaw, quadruped legs, claws, tendrils and tail. The full blueprint was never registered as a sprite. Prompt/reference records: assets/void_hound/generation-prompts.json. PNGs copied intact; Python only inspected alpha/gutters/frame bounds/hashes, without repainting/re-encoding raster pixels.

All PNGs have real zero-alpha transparent pixels,64 unique nonempty pose hashes and original-alpha manifests. Runtime uses cached GPU texture rectangles sharing four atlas base textures, avoiding64 separate bitmap loads. Combined PNG size: 8,471,547 bytes. views.json and manifest.json record frame rectangles, normalized anchors and RGBA/hash evidence.

Idle uses1.2s breathing/tendril loop; Run0.36s gallop loop with four different leg poses; Hit0.16s recoil/flash plus violet sparks; Death0.65s collapse/dissolve frames, alpha fade and violet fragments. Four directional paintings are used; no whole-sprite rotation/flip substitution. Animation follows game time, including existing2x controls.

The logical Enemy collider stays48×48 through frame/facing changes; its polygon covers body, excluding decorative tail/tendrils. Render cell width96world units is fixed for this one enemy, independent of wave. Actual body fills part of that transparent cell and remains proportional to the road. Neither map/camera nor Nova/tower scale changed.

## Integration

Shared native object **Enemy**, groupMonsterEnemies and unchangedHealth behavior are reused. New scene variables VoidHoundConfig and EnemyWaveDistribution; EnemyTypes gains oneVoidHound child. Enemy adds16 animation labels and IndexMonsterImage adds oneHound portrait. No new enemy object/group/behavior or independent targeting/path system is created. Source initializer: tools/void-hound-runtime.js. Shared wave/spawn/movement/death/healthbar/renderer hooks dispatch byEnemyType; Nova rendering logic receives only a type guard and otherwise keeps its original rig/assets/animations/stats.

Existing Star detection, homing projectiles, damage, splash, upgrade, sell and placement code are byte-for-byte unchanged. Nova's config, original sprite clips, resources, maxHP100/speed80/reward5 and asset bytes match the complete pre-task backup. Map/route/UI instances, layers, groups, obstacle/placement systems, Shop84×112, prices, HUD, control code and all other scene variables also match backup.

On lethal damage the Hound pays7 once, stops moving, switches to an empty native collision mask, hides its healthbar and cannot be selected as a combat target. It remains in the scene during its0.65s death animation, then deletes itself and owned rendering objects. Nova retains its original immediate logical removal plus death proxy. Base escape retains one life loss and no kill reward; wave bonus remains100 once.

Index keeps its existing layout/navigation and adds the Hound beside Nova with canonical stats and cropped single-cell portrait. Tower Shop still contains only Star Cannon300Gold in the original small grid slot.

## Waves

Total=Wave×4. Both enemies spawn sequentially at existing0.9game-second interval and are evenly interleaved. No HP/speed/reward scaling.

| Wave | Nova Wisp | Void Hound | Total |
|---|---:|---:|---:|
|1|4|0|4|
|2|8|0|8|
|3|12|0|12|
|4|12|4|16|
|5|16|4|20|
|6|20|4|24|
|7|20|8|28|
|8|24|8|32|
|9|28|8|36|
|10|28|12|40|

For Wave11–50: Hounds=4×(1+floor((Wave−4)/3)); Nova=4×Wave−Hounds. The Hound count therefore increases4 at waves4,7,10,13,...; Wave50=136Nova+64Hounds. Editable distribution fields are TotalMultiplier4/HoundMinimumWave4/HoundIncreaseEvery3/HoundsPerStep4. All50 rows are recorded in design_previews/void_hound/implementation-summary.json.50 waves still contain5,100 total actual spawns.

## Files

Created: four PNGs +views/manifest/prompts metadata; void-hound-runtime.js; scoped one-shot integrate-void-hound.py; test-void-hound.js/test-void-hound-live.py; VOID_HOUND.md; preview/gallery/video/audit/results in design_previews/void_hound; full backup backups/pre_void_hound_20261009.zip.

Modified existing files (exact diff against the latest backup):
- BALANCE.md
- NOVA_WISP.md
- README.md
- Tower Defense.json
- layouts/game-scene.json
- tools/embed-free-placement.py
- tools/enemy-healthbar-runtime.js
- tools/island-render-runtime.js
- tools/nova-death-runtime.js
- tools/nova-movement-runtime.js
- tools/nova-spawn-runtime.js
- tools/nova-wave-manager.js
- tools/nova-wisp-runtime.js
- tools/run-clean-validation.py
- tools/test-clean-project-live.py
- tools/test-clean-project.js
- tools/test-nova-wisp.js
- tools/unit-index-runtime.js
- design_previews/cleanup/test-clean-project-results.txt
- design_previews/cleanup/test-nova-wisp-results.txt
- tools/cleanup-audit/source-mapping.json

Source embedding/helper mapping and regression expectations were updated for the new type. Original Star/map/Shop/placement/upgrade sources and all original registered resource bytes remain unchanged. No prior cleanup content was restored.

## Executed validation

- Native GDevelop5.6.283 parser:1scene/59object definitions. Compiler0diagnostics, native exportPASS. All131 resources present.
-117 Hound checks: exact60/135/0/7,64 usable pose textures, four directional run loops, idle loop/collider stability, native collision alive/dead, actual Star hits60→10→dead, DamageDealt60, hit keeps movement, death retained until completion, no duplicate7reward, one base life/no reward, full82-waypoint zigzag/bends at135, Nova preserved, Index cropped portrait, smallShop unchanged.
-10,428 mixed50-wave checks: real native spawn instances/IDs for all5,100 enemies, exact requested composition, fixed100/80/5 Nova and60/135/7 Hound, sequential spawn, wave drain, bonus100once, no duplicate rewards, victory50, Nova movement/rig/hit/death/combat/base handling.
-283 original Star/placement tests: all21 crosspaths, unchanged stats/costs/splash/volley/muzzle/targeting/range/refund, obstacle250, input guards and Shop/Index.
-13 native browser checks: actual UI PLAY intoWave4 creates12Nova+4Hounds sequentially, four facing paintings at60HP, Nova100 preserved, Index, native purchase300/placement, actual Star homing shots/death/7reward/DamageDealt60, fixedcamera/route/smallShop, and captured4-second mixed-wave animation. Console log0 errors/uncaught exceptions/missing assets.
-269 static/hash/reference/source-embedding checks against backup, including original config, native event conditions/actions, map/layers/groups/folders, assets and protected source bytes.

Evidence: design_previews/void_hound/{test-void-hound-results.txt,test-nova-wisp-results.txt,test-clean-project-results.txt,native-tests.txt,static-audit.json,console-errors.json}. Actual gameplay screenshots and Void_Hound_Gameplay_Animation.webm are saved alongside Asset_Gallery.html.

## Limits

Animation uses four AI-painted poses per state/facing and runtime texture selection, not a skeletal rig. Generated atlas dimensions differ; frame metadata, normalization and center-preserving swaps keep a consistent logical sprite size/anchor. The editor's raw image thumbnail shows its atlas; game Preview and gallery show individual animated frames.

All50-wave testing accelerates spawn and corpse retirement in test fixtures to avoid waiting through5,100 real-time enemies; separate Hound tests/native preview verify full death timing and complete path movement. No complete human strategy/difficulty playthrough is claimed. Desktop editor GUI opening was not automated; native parsing/compilation/export and real preview were executed. No known failing game check remains.

Open the updated Tower Defense.json again if an editor still holds the pre-task scene in memory. Money in screenshots is a test fixture; project startingMoney650/Lives10 and unrelated economy are unchanged.
