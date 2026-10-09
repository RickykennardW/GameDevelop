# Three Void common enemies — implemented

The latest Tower Defense.json / layouts/game-scene.json now supports exactly five enemy types. Exactly three were added: VoidGuard, VoidSentinel, VoidBrute. Nova Wisp and Void Hound remain intact. No attack animations, enemy attacks/projectiles/lasers, active shield, buffs, variants or new tower damage mechanics.

| Enemy | HP / MaxHP | Speed | Armor flat | Gold | First wave |
|---|---:|---:|---:|---:|---:|
| Void Guard |150|70|10|8|6|
| Void Sentinel |120|85|0|6|5|
| Void Brute |220|60|15|10|7|

Special Ability=None for all. Sword/shield are visual equipment. Sentinel is Floating Common rather than an attacker. Brute is Heavy Common, not a boss. No HP/speed/size/color scaling by wave.

## Asset creation and animation

Final folders: `assets/enemies/void_guard/`, `void_sentinel/`, `void_brute/`. Each has64RGBA PNGs128×128 and a manifest.192native frames /48clips /4poses per clip. Combined PNGs:3,174,541bytes (~3.17MB decimal).

Built-in **imagegen** generated reference-based illustrations for each enemy/facing. The supplied blueprint guided ivory/dark-purple stone armor, violet cores, weapon/construct/quadruped silhouettes. The complete blueprint was never registered as a sprite. Original atlases, exact prompts and authoring reference are retained under design_previews/void_enemies; these large sources are not loaded by the game.

Permitted image processing extracts poses, uses Lanczos resize and transparent padding to create consistent128px native frames. It preserves generated artwork rather than substituting geometric placeholders. Manifests record frame ordering, hashes, alpha, source rectangles/scales and common origins. All192frames are unique, have real zero-alpha pixels, transparent margins and no opaque clipping.

Every new enemy has native GDevelop clips named EnemyID +Idle/Move/Hit/Death +_Up/_Down/_Left/_Right. Each clip references four actual PNG frames. Idle/Move loop; Hit/Death do not. No attack/swing/bash/laser clip exists. Sword/shield stay at rest while legs walk. Sentinel floats with core/crystal movement. Brute walks slowly on four legs. Hit is brief recoil/flash; death collapses/fragments armor/core and dissolves.

UP uses a rear painting, not an upside-down front image. Guard UP was refined to show rear helmet/cape, plain shield reverse on anatomical left and lowered sword on anatomical right; front visor/chest are hidden. Sentinel UP has small rear port/back plates, DOWN has the large lens; LEFT/RIGHT reveal side depth. Brute front/back armor and side quadruped views differ. There is no90/180degree whole-sprite rotation or horizontal-flip substitution.

Native center64/64 and logical48×48 colliders stay fixed through frame/direction changes. Body-only masks exclude weapons/decorative crystals; all death masks are empty. RenderScale:Guard1.8, Sentinel1.55 (Nova baseline), Brute2.1. These only affect the new sprites; map/camera/tower/Nova/Hound scale remains unchanged. No per-enemy graphics rig/particle emitter is created for the new native sprites.

## Shared gameplay and existing armor

The existing Enemy object, Health behavior, MonsterEnemies group, sequential spawner, waypoint movement and Star targeting/projectiles are reused. No new enemy object definitions, duplicate spawner or separate movement/targeting system was added. Object count remains59. A single `tools/void-common-runtime.js` initializer owns only these three types and their hit/death/lifetime state; standard native sprites advance the frames.

Existing Health already provides flat armor. Spawn/initialize sets FlatDamageReduction10/0/15 and PercentDamageReduction0. The only Star combat-source change is `Hit(damage,false,Armor>0)`: existing armor processing becomes active for specified armored enemies; shield processing remains off. No new damage formula is invented. A50-point Star hit deals40 toGuard and35 toBrute. DamageDealt records actual HP lost, excluding armor/overkill.

Star visuals/stats, projectile velocity, targeting, muzzle transforms, splash multipliers,21crosspaths, sell/refund, placement/range remain unchanged. Original Nova/Hound assets, sprite clips/config/stats are preserved. Health extension itself is unchanged.

Death pays8/6/10 once via RewardPaid, stops movement, disables collision/targeting/healthbar, completes0.65s Guard/Sentinel or0.75s Brute death, then deletes the enemy/owned state. Base escape retains one life loss/no kill reward. Wave bonus100 once and existing controls stay unchanged.

Index preserves its layout and Nova/Hound first, then adds Guard/Sentinel/Brute portraits/stats. Tower Shop remains only Star Cannon300Gold in its small84×112 first grid slot. World instances, layers, groups, folders, UI/header/footer/scroll/HUD and unrelated native events are unchanged.

## Configurable waves

Total=Wave×4 for all50waves; spawn interval remains0.9game-second. Every old Hound count **and original Hound slot index** is preserved. New types replace only Nova slots. Original waves1–4 remain equivalent.

EnemyWaveDistribution.AddedTypes defaults:

- Sentinel: minimum5, count2 per step, increase every3waves.
- Guard: minimum6, count2 per step, increase every4waves.
- Brute: minimum7, count1 per step, increase every5waves.

Count=0 before minimum, otherwise CountPerStep×(1+floor((wave−minimum)/IncreaseEvery)). Remaining slots are Nova; allocation caps retain Nova availability. New types are fairly interleaved, not spawned simultaneously. Individual stats do not scale.

| Wave | Nova | Hound | Sentinel | Guard | Brute | Total |
|---|---:|---:|---:|---:|---:|---:|
|1|4|0|0|0|0|4|
|2|8|0|0|0|0|8|
|3|12|0|0|0|0|12|
|4|12|4|0|0|0|16|
|5|14|4|2|0|0|20|
|6|16|4|2|2|0|24|
|7|15|8|2|2|1|28|
|8|17|8|4|2|1|32|
|9|21|8|4|2|1|36|
|10|19|12|4|4|1|40|
|50|71|64|32|24|9|200|

The complete50-row table is in design_previews/void_enemies/implementation-summary.json. All50waves still create5,100 enemy instances total.

## Files created and modified

Created:192PNGframes plus three manifests; tools/void-common-runtime.js, prepare-void-common-assets.py, integrate-void-common.py, test-void-common.js, test-void-common-live.py; this report; original atlases/prompts/reference, gallery, screenshots, video, benchmark/audit/regression evidence under design_previews/void_enemies. Full latest backup: backups/pre_three_void_enemies_20261009.zip, ZIP integrity verified.

Modified: project/resource JSON and scene animations/archetypes/distribution; Nova dispatcher/spawn/movement/death, healthbar/renderer hooks; Index entries/order; the one Star armor flag; source embed/helper mapping; regression expectations; README/BALANCE. Exact before-backup file lists are in implementation-summary.json and modified-files.txt.

JSON changes append192registered resources,48new Enemy clips/3Index clips,3archetypes/1config, additional distribution controls and1initializer. Original resource entries/bytes and all unrelated project fields remain intact. All native event conditions/actions are preserved. No cleanup content was restored.

## Actual verification

- Native GDevelop5.6.283 parser:1scene/59objects; compiler0diagnostics; exportPASS. All323resource paths exist.
-636 new-enemy checks: all12directional Idle/Move/Hit/Death combinations (48clips),4native frames each, no attacks/rotation, stable origins/colliders/speeds, exact stats/armor, real Star projectiles/40-and35damage, full death sequences/rewards/no duplicates, complete82-waypoint route/base rule for each type, actor/healthbar cleanup, Index and smallShop.
-10,428 five-type50wave checks: all5,100 actual spawn IDs, composition/minimums/fixed HP/speed/armor/rewards, sequential spawn, drain, bonus100once, no duplicate payments, victory50 and preserved Nova behavior.
-117 Hound regressions and283 Star/placement/21upgrade/obstacle250/input/refund/muzzle checks PASS.
-15 actual native-browser checks:12views/HP, five-entryIndex, nativeWave7 exact15Nova+8Hound+2Sentinel+2Guard+1Brute, purchase300/placement, actual Star armor hit/Guard death8Gold/DamageDealt150, map/camera/route/smallShop, video, lifecycle cleanup and console.
-662static/reference/alpha/hash/source-embedding/protected-configuration checks. Health/Nova/Hound assets/config, map/Shop/placement sources unchanged. Star semanticdiff is exactly the armor flag.

Benchmark120rAF samples:40mixed enemies mean6.94ms/max18.80ms;200mixed enemies mean7.04ms/max20.60ms in headless preview on this machine. Actor and healthbar ownership maps clear after deletion. Console0errors/uncaught exceptions/missing assets.

Evidence: static-audit.json, console-errors.json, native-tests.txt, test-void-common-results.txt, test-nova-wisp-results.txt, test-void-hound-results.txt, test-clean-project-results.txt, performance-40.json, performance-200.json and Five_Enemy_Gameplay_Animation.webm. Asset_Gallery.html reviews all clips; Three_Enemies_Previews.png compares rear/front/side paintings.

## Limits

Four AI-painted poses per native clip rather than skeletal/hand-keyed animation. Tiny illustration changes remain between poses; normalized origins and logical colliders stay fixed. All requested48clips and12facings are implemented/tested; none omitted.

50wave fixtures accelerate spawn/corpse retirement; separate animation/death/full-route and native-preview tests cover real timing. This is not a complete human strategy/difficulty playthrough. Headless performance samples are not an FPS guarantee for every device. Desktop editor GUI opening was not automated; native parser/compiler/export and actual preview were executed. No known failing implementation check remains.

Reopen updated Tower Defense.json if an editor still holds the pre-task scene in memory. Screenshot money is a test fixture; startingMoney650/Lives10 and unrelated economy are unchanged.
