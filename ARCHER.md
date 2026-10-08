# Archer Tower

The Archer costs **300 Gold**. Existing tower balance, map, monsters, waves and Wave Control are unchanged.

| Base stat | Value |
|---|---:|
| Damage per arrow | 18 |
| Attack interval | 0.55 s |
| Range | 210 px |
| Projectile speed | 480 px/s |
| Pierce | 1 enemy |
| Archers | 1 |

Its base damage rate is about 32.7/s, below the Basic Tower's 40/s. Its modest extra range and faster projectile compensate for its higher purchase price. Upgrade prices increase substantially at specialization and final levels; this is an initial balance configuration, not a claim of completed strategic playtesting.

| Path | Level | Upgrade | Cost | Cumulative effect |
|---|---:|---|---:|---|
| Rapid Archer | 1 | Sharpened Arrows | 100 | +5 damage |
| Rapid Archer | 2 | Quick Draw | 200 | Interval becomes 0.40 s |
| Rapid Archer | 3 | Twin Archers | 650 | Two arrows from separate firing points per cycle |
| Rapid Archer | 4 | Arrow Storm | 1200 | Interval becomes 0.24 s; both archers retained |
| Crossbow / Piercing | 1 | Eagle Eye | 100 | +35 range |
| Crossbow / Piercing | 2 | Swift Arrows | 175 | Projectile speed becomes 760 px/s; interval unchanged |
| Crossbow / Piercing | 3 | Piercing Crossbow | 600 | Crossbow bolt hits up to 2 different enemies |
| Crossbow / Piercing | 4 | Heavy Bolts | 1100 | +12 damage; hits up to 3 different enemies |

All purchased modifiers remain active. Level 3 chooses the specialization path, which can continue to level 4. The other path remains available up to level 2, even if its upgrades are purchased after specialization. Only its level 3 purchase is locked. The 3-3, 3-4, 4-3 and 4-4 combinations are refused by the upgrade function as well as the UI.

`ArcherConfig` is the authoritative stat/upgrade table. `Path1Level`, `Path2Level`, `TotalInvestment`, current stats, `VisualKey`, `TowerId` and `DamageDealt` belong to each Archer instance. Upgrade changes the same instance's animation; it preserves identity and damage attribution. Selling returns the existing 70% of base cost plus every purchased upgrade, rounded down.

Archer extends `PlaceableTile`, uses the existing native purchase/placement events and the existing `FireBullet` behavior for nearest-target projectile firing/cooldowns. `ArcherProjectile` uses the existing `Health.Hit` API. Each projectile tracks unique enemy lifetimes, samples native collision masks along its flight to prevent tunneling, and reports actual HP lost to its owning tower. Projectile stats are captured when fired. Arrows fly straight; they do not home. Scene time scale drives flight and cooldowns, with no multiplication of base stats.

The new `SelectedTowerUI` overlay sits directly left of Tower Shop without resizing the map. The shop remains visible and usable. Existing towers show their stats, image and sell control without invented upgrades. The panel consumes pointer input, closes on empty map/Escape/sell/deletion, and has release-edge upgrade/sell controls. INDEX reads the same ArcherConfig and reuses all eight upgrade icons.

The complete 31-image resource manifest is [assets/archer/manifest.json](assets/archer/manifest.json): 21 tower combinations, 8 upgrade icons and 2 projectiles. Generated images use actual alpha transparency, the same 512px canvas, fixed world footprint and consistent import anchors. Image prompts and import provenance are recorded with the manifest.

Map Archer artwork is rendered at 150% around its unchanged center for all 21 animations. Its physical dimensions, collision masks and placement footprint remain 64x64. Arrow/Bolt artwork is rendered at 180% with full opacity and world Z-order 10, above terrain, enemies and towers, below health bars/UI. Physical projectile dimensions remain 22x7; speed, lifetime, damage and pierce are unchanged. Projectile import bounds ignore alpha values at or below 8 outside the visible artwork so faint transparent outliers no longer shrink the arrow inside its canvas. Each tower animation has FirePointA and, for twin archers, FirePointB; spawn coordinates follow those weapons and account for the visual enlargement. Right-facing source art rotates with its flight angle.
