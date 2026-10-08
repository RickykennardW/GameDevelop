# Star Cannon — playable tower

Implemented in the latest Game Scene without replacing existing towers or source
art. Backup before integration: `backups/pre_star_cannon_20261009.zip` (154 files,
verified ZIP integrity). The previously mentioned Star Cannon reference was not
found in the workspace; art follows the supplied ivory/gold/purple-blue specification
and the existing Celestial Void theme.

## Assets

All assets are saved in `assets/star_cannon/` and registered in Tower Defense.json.

- 21 unique generated RGBA PNG tower sprites, 1254x1254, with true alpha transparency:
  `Star_Cannon_A_B.png` for every A/B in 0..4 except 3-3, 3-4, 4-3 and 4-4.
- 6 transparent SVG projectile types: Base, Reinforced, Explosion, Supernova, Twin,
  Meteor. They include a broad luminous star/core and baked comet/streak trails.
  Logical widths are 40/44/48/56/38/36 world units, respectively; height is half width.
- 4 transparent SVG impacts: Base, Explosion, Supernova, Barrage. These fade and
  expand for .22/.42/.55 game seconds, with no continuous particle emitter.
- 8 SVG upgrade icons: ReinforcedCore, HeavyImpact, StarExplosion, Supernova,
  RapidFire, PrecisionCore, TwinStar, MeteorBarrage.

PNG sprites were produced with the built-in imagegen tool, one distinct request per
state, using 0-0 as the reference for the other twenty states. Exact prompts and mode
are saved in `generation-prompts.json`. SVG VFX/icons are deterministic native vector
graphics. Original tower/monster/environment images were neither changed nor resized.

The base is a restrained single ivory cannon. Early damage states add armor/gold;
speed states add cyan conduits and stabilizer rings. Twin and Meteor have visibly two
and three emitters. Crosspath sprites combine both influences rather than reusing
the same PNG. All twenty-one files have different SHA256 hashes.

Source-space firing points for Twin/Triple were reviewed against their visible
emitters and saved in emitter-points.json. Per-state GroundContact anchors account
for transparent margins; sprite position changes compensate around the same stored
FootprintX/Y. Neither upgrading nor swapping images moves the canonical ground center,
circle, range, owner ID or camera. Preview placement uses the calibrated 0-0 anchor.

An asset contact sheet and browser gallery are available in
`design_previews/star_cannon/Asset_Gallery.png` and Asset_Gallery.html.

## Base values and upgrade prices

Price 300 gold; base damage 50; range 210 (same as Archer); interval .9 seconds;
projectile speed 520 world units/second. Default targeting chooses the nearest live
enemy inside the actual range from the canonical footprint center. It is single target.
Footprint radius 46, logical sprite 64x64, render scale 2.5.

Prices were unspecified and chosen to follow the existing four-tier upgrade pattern:

| Path | Level | Name | Cost |
|---|---:|---|---:|
| Star Destroyer | 1 | Reinforced Core | 125 |
| Star Destroyer | 2 | Heavy Impact | 200 |
| Star Destroyer | 3 | Star Explosion | 650 |
| Star Destroyer | 4 | Supernova | 1250 |
| Cosmic Barrage | 1 | Rapid Fire | 100 |
| Cosmic Barrage | 2 | Precision Core | 175 |
| Cosmic Barrage | 3 | Twin Star | 600 |
| Cosmic Barrage | 4 | Meteor Barrage | 1100 |

The base interval and radius were chosen for this new tower. Existing balance tables,
prices, damage, cooldowns, ranges, enemy stats, wave composition and route are unchanged.

## Calculation rules

For damage path A and barrage path B, bonuses multiply against the base values:

```
normalDamage = 50 * (A>=1 ? 1.15 : 1) * (A>=2 ? 1.15 : 1) * (A>=4 ? 1.35 : 1)
range = 210 * (A>=2 ? 1.05 : 1) * (B>=2 ? 1.05 : 1)
interval = .9 / ((B>=1 ? 1.15 : 1) * (B>=2 ? 1.10 : 1))
projectileCount = B>=4 ? 3 : B>=3 ? 2 : 1
eachProjectileDamage = normalDamage * (B>=4 ? .60 : B>=3 ? .65 : 1)
splashFraction = A>=4 ? .65 : A>=3 ? .40 : 0
radius = A>=4 ? 98 : A>=3 ? 70 : 0
```

Damage path values are 50, 57.5, 66.125, 66.125, 89.26875. When both paths reach Lv2,
range is 231.525 and interval approximately .71146245 seconds. Attack speed bonuses
divide interval, rather than treating +15% speed as -15% interval. UI values are
displayed to two decimals; combat keeps full numeric precision.

Twin 0-3 emits two shots of 32.5 damage, total 65. Meteor 0-4 replaces this with three
shots of 30 damage, total 90. At 2-4 each shot deals 39.675, total 119.025. They never
emit a combined 2+3 volley. Panel damage displays normal damage; the added summary
clearly states projectile count and percentage per shot.

Star Explosion deals full direct damage to its primary target, then 40% once to each
other live enemy inside radius 70. Supernova changes that fraction to 65% and radius
98; it does not add 40% and 65%. The primary is explicitly excluded from splash.
Projectile damage, fraction, radius, skin and owner are snapshotted at firing so an
upgrade cannot change an in-flight shot. Projectiles home toward their original live
target, dissipate if it dies, and expire after six game seconds. Timers/movement use
the existing scene elapsed game time, respecting 1x/2x exactly once.

Damage Dealt sums actual HP removed by direct and splash hits, including overkill
clamping. Existing enemy death/reward events remain responsible for kill gold and
the +100 wave bonus. Selling follows the existing 70% of base plus paid upgrades;
Star-only rounding compensation avoids floating-point undercount, e.g. 2800→1960.
Old tower refund behavior is preserved.

## Crosspath and integration

Each path caps at Lv4. A next upgrade is rejected only when its next level is at
least 3 and the other path is already at least 3. Thus 4-2, 2-4, 3-1 and 1-3 work;
3-3/4-3/3-4/4-4 do not. Runtime revalidates membership, state, funds, cap and Index
input blocking independently of the visual lock. Purchase is one transaction and
investment is recorded once.

Three native object definitions were added: StarCannonTower, StarCannonProjectile,
StarCannonImpact. The PlaceableTile group and free-placement type list include Star.
The fifth catalog item costs 300 and creates the standard single-placement builder.
The separate upgrade panel retains left/right placement, progress, costs, descriptions,
lock/max state, current sprite, range and sell. It adds named Star paths and a volley/
splash summary. Index includes the new entry and all eight icons with distinct object
keys so Archer icons remain visible too.

Star combat is a separate JS event inside Tower Defense, after Archer and before the
existing projectile/death/reward passes. Native old combat/wave event blocks are byte
equivalent after JSON parse; Star's cooldown is initialized per unique runtime lifetime
to support GDevelop object recycling after sell/deletion.

Changed files:

- Tower Defense.json: append 39 image resources only.
- layouts/game-scene.json: new objects/config/catalog/footprint/group member; append
  animations to existing UI/preview objects; embed integration source and Star event.
- tools/star-cannon-runtime.js: new stats, upgrades, targeting, volleys, hits and VFX.
- selected-panel-runtime.js and unit-index-runtime.js: support both upgrade systems.
- responsive-map-runtime.js, island-render-runtime.js, free-placement-runtime.js,
  free-placement-click.js: new type/render/footprint/investment handling.
- embed-free-placement.py, integrate-star-cannon.py: source adapter/one-time integration.
- assets/star_cannon/config.json, manifest.json, emitter-points.json and prompts.
- test-star-cannon.js and test-star-cannon-live.py: runtime and native interaction tests.

Stat configuration used at runtime is the scene's StarCannonConfig. config.json is
the authored integration mirror; updating that mirror alone does not modify a saved
scene. The integration script intentionally rejects an already-integrated scene.

## Executed verification

- GDevelop native parser, extension/scene compilation, Pixi preview export: success,
  zero scene diagnostics. Every sprite resource/group reference resolves to an
  existing native object/image. JSON valid; source/event parity checked.
- Star Cannon runtime suite: 211 PASS covering native shop purchase, fractional
  placement, road/tower blocking, ESC/right cancel, all 21 combinations bought via
  panel controls, lock, anchoring, investment/refund, base auto-attack, all six
  projectile skins, actual twin/triple fractions, direct versus splash exclusion,
  radius 98 boundary, immutable shots, overkill, fresh purchase after sell, 2x,
  Index and effect cleanup.
- Existing Archer integration/state/crosspath/combat/sell suite: 170 PASS.
- Existing complete 50-wave composition/pathing/combat/reward/victory suite: 419 PASS.
- Existing Manual/Auto/1x/2x/Index/shop/sell/wave-control suite: 64 PASS.
- Native Chrome mouse/key/Fullscreen API suite: 39 PASS including Star placement,
  two panel sides, selected circles, native upgrades to 4-2 and 2-4, blocked-circle
  rejection, viewport resize, actual-wave projectile rendering, upgraded sell and
  three simultaneously live Meteor projectiles.
- PNG verification: all 21 RGBA files have transparent pixels and unique hashes.
  SVG gallery/preview visually checked. Existing source PNG/SVG bytes unchanged.

One old fixture assumed four shop entries and was adjusted to five; its original
Archer cost, upgrade, combat and icon assertions remain intact. Logs/screenshots are
stored under `design_previews/star_cannon/`. Tests ran the exported GDevelop runtime
in local headless Chrome; Full HD/QHD sizes are viewport emulation, and no physical
monitor performance benchmark or GDevelop editor GUI session is claimed.

Preview screenshots include Supernova_Panel.png, Meteor_Panel.png, Combat_FullHD.png,
Barrage_Combat_FullHD.png, Panel_QHD.png and Responsive_800.png. No requested feature
remains unimplemented; the chosen new-tower prices/interval/radius can be playtested
and tuned without changing existing tower balance.
