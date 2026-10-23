# Galactic Campaign — implementation and validation

Implemented directly in Celestial_Void / Starfall Bastion on 23 October 2026. No backup, duplicate source project, archive, snapshot, or Git-history change was created. Existing user changes, including the editor autosave and earlier hover-alignment work, were preserved.

## Play the campaign

Preview **MainMenu**, press **Start**, select a mission in **Levels**, then press **Launch Mission**. A fresh save offers only 1-1 and starts the selection tutorial. Directly previewing **Game Scene** intentionally retains the existing sandbox: 50000 Gold, 10 Lives, 45 waves.

Campaign missions reuse the existing Celestial Void battlefield, waypoints, ruins, collision and camera. The five new chapter backgrounds belong to the mission-selection screen; this implementation does not claim 25 newly drawn combat maps.

![Levels scene](<C:/Users/My ASUS/OneDrive/Documents/GitHub/GameDevelop/validation/Campaign_Levels.png>)

## Scenes, objects and event changes

| File / section | Change |
| --- | --- |
| `Tower Defense.json` | Registers `/layouts/levels` and five image resources. Startup remains MainMenu. |
| `layouts/levels.json` | New Levels scene, CampaignConfig structure, CampaignUI layer, CampaignBackdrop sprite with five chapter animations, two JavaScript events. Two background instances are reused for crossfading. |
| `layouts/main-menu.json`, `tools/main-menu-runtime.js` | MenuConfig.StartScene=Levels. Start transitions to Levels; GameplayScene remains the audio-config reference. Existing Start/Exit frames, label alignment and Exit behavior are retained. |
| `layouts/game-scene.json` | CampaignUI below GameOverUI; DefeatLevels/DefeatLevelsLabel reuse the existing button resources. Adds five campaign variables and narrowly scoped tutorial/input/combat guards. |
| Gameplay events `[0].events[5]`, `[20].events[0]` | Campaign initialization/before-frame gate and after-native-combat observer. Sources: `campaign-game-runtime.js`, `campaign-game-after.js`. |
| `tools/nova-wave-manager.js` | Optional configured campaign wave plans and first-wave gate. Original sandbox Gold-Budget generator remains available unchanged. |
| `tools/nova-spawn-runtime.js`, `tools/nova-death-runtime.js` | Per-spawn mission scaling/boss setup and observation after the original one-time kill payment. No second damage/reward pipeline. |
| `tools/free-placement-runtime.js`, `responsive-map-runtime.js`, `selected-panel-runtime.js` | Respect campaign modal/input-consumption flags; placement collision, costs and world geometry are unchanged. |
| `tools/game-over-runtime.js` | Campaign-only Levels return button. Restart reloads the same selected mission; Main Menu remains available. |
| `tools/build-campaign.py`, `embed-free-placement.py`, `source-mapping.json` | Idempotent registration and maintained source embedding. Config edits survive rebuild. |

The hex pads, chapter selectors, text, spotlight, coach, boss bar and mission-result controls are reusable PIXI UI elements on CampaignUI. They do not introduce combat object types. Native scene transitions and the existing input/renderer APIs are used.

Original scope audit confirms all **67 pre-existing object definitions**, **157 authored instances**, **67 original variables/configurations**, and **28 audio assets** are unchanged. Original tower statistics, 300-Gold shop price, 5–2/2–5 upgrade locks, Starburst recipe, map art and path remain intact.

## Configuration, progression and persistence

`tools/campaign-config.json` is the source of truth: **5 chapters, 25 missions, 204 explicit waves**. Each mission specifies opening Gold/Lives, wave count, intermission, type/count composition, spawn interval, HP/speed factors and boss status. Each chapter owns its boss configuration. Full per-wave counts, income and preparation notes are in [CAMPAIGN_LEVEL_REFERENCE.md](CAMPAIGN_LEVEL_REFERENCE.md).

`tools/campaign-service.js` owns `game.__campaign`. The dedicated localStorage key **starfallBastionCampaign.v1** stores Version, Completed, SelectTutorialDone and GameTutorialDone. Highest available mission/chapter and boss completion are derived from the contiguous completed prefix. Unknown unrelated save metadata is retained; audio/Fusion storage keys are not overwritten. Saves occur on a new completion or tutorial completion, not each frame.

A mission completes only when its actual configured waves have started and cleared, the native queue is exhausted, no enemies remain, Lives>0 and the native completion condition succeeds. A boss mission additionally requires the actual boss to have died. Entering a mission never unlocks anything. Boss escape causes defeat. Replay and defeat preserve previous completions. After 5-5, all 25 missions remain replayable and the result reads CAMPAIGN COMPLETE.

Runtime owners are `scene.__levelsUI` and `scene.__campaignRun`. Per-scene state is rebuilt on Restart; mission configuration is applied once before the first wave. The run tracks started waves, actual kills, boss UID/lifetime and completion to prevent stale pooled-object references or repeated unlock payments.

| New Game Scene variable | Responsibility |
| --- | --- |
| CampaignLevelId | Selected run ID, such as 3-2. |
| CampaignTutorialActive | Whether the first-mission coach is active. |
| CampaignModal | Prevent world interactions through a modal instruction/result. |
| CampaignUIConsumesClick | Consume coach-panel presses, including held clicks dragged onto the map. |
| CampaignCombatPaused | Gate native combat and freeze the world layer while keeping UI/audio responsive. |

## Tutorials

Selection: Welcome → Chapter 1 → actual 1-1 hex selection → explicit Launch. The spotlight follows real UI bounds. Back is available during onboarding; returning before completion safely restarts it. Skip only records tutorial completion and never unlocks a mission.

Mission 1-1: battlefield/path/Finish → actual Star Cannon selection → valid paid placement → automatic targeting/range → acknowledged first wave of six Nova Wisps → real first kill and original Gold payment → actual upgrade panel → Training Complete. Invalid road/ruin/occupied placement never advances the tutorial or deducts Gold. Opening funds cannot be spent on obstacle removal before the required placement. No fake reward or parallel enemy spawner exists. Upgrade Continue remains available when an upgrade is unaffordable; Skip is available throughout. Opening Index/audio or changing speed does not reset the state machine.

The selection and gameplay tutorial completion flags persist independently. Existing Monster Discovery remains session-scoped according to the project's prior beta design; campaign, Fusion discovery and audio preferences use their existing persistent storage scopes.

## Chapter art and responsive UI

Five final, original vector compositions were created in `assets/ui/campaign/chapter_1.svg` through `chapter_5.svg`: blue planetary frontier; magenta nebula/crystals; gold-violet floating ruins; dark black-hole lensing; bright celestial fractures. These are code-authored final backgrounds, not generated concept placeholders. Resource identifiers and relative file paths are separately checked.

Five curved, connected hex pads show centered mission numbers, lock icons, restrained available/selected glow, completion ticks and a gold BOSS treatment on each fifth mission. Locked chapter selection shows its prerequisite. Background switches crossfade over 0.5s with subtle drift.

Viewport sizing follows the project's existing reference approach, with a minimum logical canvas of 960×540 and proportional physical display scaling. Text-aware flow avoids overlaps in small windows. Zero/nonfinite/hidden viewport dimensions retain the last valid geometry. Hover changes frames rather than moving labels. Backgrounds preserve aspect ratio. UI containers/text are reused; listeners and owned text textures are disposed on unload while shared sprite textures remain intact.

The progression choices borrow readable completion markers, prerequisite unlocks and distinct boss presentation from the principles illustrated in [Ninja Kiwi's official Bloons TD 6 update notes](https://store.steampowered.com/news/posts/?appids=960090&enddate=1634162592&feed=steam_community_announcements). No Bloons UI, artwork or audio was copied.

## Initial economy and difficulty

| Chapter | Opening Gold across levels 1–5 | Lives | Waves across levels 1–5 |
| --- | --- | ---: | --- |
| 1 | 600 / 675 / 750 / 825 / 900 | 20 | 5 / 5 / 6 / 6 / 7 |
| 2 | 1200 / 1350 / 1500 / 1650 / 1800 | 18 | 6 / 7 / 7 / 8 / 8 |
| 3 | 2100 / 2300 / 2500 / 2700 / 2900 | 16 | 7 / 8 / 8 / 9 / 9 |
| 4 | 3300 / 3600 / 3900 / 4200 / 4500 | 14 | 8 / 9 / 9 / 10 / 10 |
| 5 | 9000 / 11000 / 13000 / 15500 / 18000 | 12 | 9 / 10 / 10 / 11 / 12 |

These are documented initial tuning values, not a measured human win-rate curve. Difficulty varies composition, counts, spawn spacing, HP, movement and boss abilities rather than HP alone. Early missions are short and forgiving. All regular archetype rewards remain unchanged; wave-completion gifts remain zero. Tutorial progression adds no Gold. Currency belongs to each mission run, with no persistent currency awarded for replaying completed levels.

Chapter 5 funds account for the existing **22490 Gold** investment required to build the 5–2 and 2–5 Pure Fusion sources. In 5-5, configured income before the boss brings the potential budget to **27307 Gold**, leaving **4817** after that pair. A native transaction test actually bought/upgraded both sources and completed regional Pure Fusion into Starburst, consuming two sources once. No recipe, fee or tower stat was reduced to make this possible.

## Boss implementation and balance

All five bosses are real, separately configured **Void Golem variants using the existing art, portrait, four-direction animation, Health, path movement, stationary casting and Fortification VFX/audio**. There are no five new bespoke boss illustrations or sprite sheets. Existing milestone-wave audio introduces the encounter once. A boss name/HP bar, entrance ring and readable casting/shield/surge/reinforcement messages distinguish the encounters. The boss bar anchors below the HUD and any active discovery toast, outside the Tower Shop.

| Boss | HP / armor / speed | Kill Gold | Cast start interval | Extra mechanics |
| --- | --- | ---: | ---: | --- |
| Rift Devourer | 1200 / 5 / 36 | 250 | 14s | Basic telegraphed Fortification. |
| Nebula Warden | 3600 / 10 / 39 | 450 | 12s | 18% temporary shield for 4s after release. |
| Astral Colossus | 4400 / 15 / 37 | 750 | 11s | One group of 4 Void Guards at half HP. |
| Void Sovereign | 6500 / 18 / 41 | 1100 | 10s | 10% shield for 3s; ×1.3 speed for 4s; 5 Guards + 5 Hounds once. |
| Entropy Architect | 9000 / 20 / 42 | 1800 | 9s | 15% shield for 4s; ×1.2 speed for 4s; 6 Guards + 6 Hounds once. |

The native cast remains stationary for 0.8s, releasing at 0.6s. Existing Fortification adds 10 armor for 10s within radius100. Boss-only shields use Health.PercentDamageReduction once; surges derive from base movement rather than multiplying previous speeds. Reserves enter the original paced wave queue and grant Gold only when actually killed. They cannot re-trigger each frame. The native death handler owns boss kill rewards. No unavoidable direct attack or blanket tower immunity was added.

Native boss-wave benchmarks used real shop purchases/upgrades, finite configured income from preceding waves, full final-wave support enemies and actual targeting/projectiles. All five bosses died with Lives intact using 4/8/14/20/26 towers respectively; simulated combat times were approximately 114/144/143/125/154 seconds. These isolate the final boss wave and credit the preceding configured income; they do not simulate the cost of every decision throughout each full mission. Initial late-boss HP was reduced after native tests showed it could escape. Human strategy and complete-mission difficulty still require playtesting.

## Actual validation results

Tests run against the native compiled GDevelop JavaScript preview in isolated headless Chrome profiles. Test fixtures do not alter saved player data or permanent balancing. Three scenes compile with **0 event diagnostics**; all registered active resources resolve. The local compiler is 5.6.283 while project metadata is 5.6.284 and emits its existing version/include warnings; the maintained exporter supplies the Health behavior bundle and all runtime tests below complete without console exceptions.

| Evidence in `validation/` | Actual result |
| --- | --- |
| `campaign-static.json` | 1033 campaign/scope checks plus 3744 maintained structure/resource/source checks pass. Original gameplay configurations, authored instances and audio hashes match. |
| `campaign-full.json` | 120 checks pass: all 25 native wave/spawn/death/reward/victory/unlock contracts, boss proof, loss, same-mission Restart, replay, Levels return and actual page reload persistence. Uses accelerated lethal fixture hits; this is integration coverage, not a natural 25-mission playtest. |
| `campaign-first-mission-playtest.json` | 26 checks pass: entire 1-1, real placement/upgrade, native aiming/shooting/kills, finite Gold and no forced damage. Two towers finish with all 20 Lives and 130 Gold. |
| `campaign-boss-mechanics.json` | 69 checks pass: five native variants, stationary casts, one release, real Fortification/shields, one reinforcement group, expiring defense and one native boss reward. |
| `campaign-boss-balance.json` | Five final boss-wave benchmarks succeed using native fire and finite budget; no forced damage. |
| `campaign-fusion-economy.json` | 20 checks pass: actual 5-5 budget, paid 5–2/2–5 sources, Tactical Fusion0.5×, regional placement, two-source consumption and Starburst archive unlock. |
| `campaign-resize.json` | 392 checks across seven viewport changes from 1280×720 down to 320×240 and back; all five backgrounds, readable labels, bounded coach, no hover drift, two reused backgrounds/25 root children, invalid-dimension retention. |
| `campaign-main-menu.json` | 34 checks: Start→Levels, no bypass, Exit native browser path, tutorial Back/resume/Skip, explicit mission launch and audio handoff. |
| `campaign-game-over-regression.json` | 55 checks: native loss/cinematic/Restart/Main Menu, direct-preview values and new menu-selection flow. |
| `campaign-fusion-regression.json` | 110 checks: source purchases/upgrades/locking, Pure Fusion, placement/cancel,0.5×, muzzle/projectile/range and archive. |
| `campaign-economy-regression.json` | 28 checks: insufficient-Gold ghost/feedback/SFX, actual one-time purchase, ruin/path collision, cancellation and scene cleanup. |
| `campaign-sonar-regression.json` | 476 checks: real path-distance detection, warning6s/critical3s repeats, one voice, pause/speed and Finish/Lives handling. |
| `campaign-discovery-regression.json` | 18 checks: native monster/Pure Fusion discovery, queued one-toast presentation, Index hold/resume and future variant API fixtures. |
| `campaign-index-regression.json` | 121 checks: existing categories, portraits, tier data, silhouettes, clipping and responsive archive layout. |
| `test-clean-project-results.txt`, `test-gold-budget-results.txt` | Maintained sandbox suites: 354 and 7486 checks pass respectively; original tower/selection/obstacle and 45-wave budget behavior retained. |

All listed browser evidence reports **zero console errors**. Reload testing verifies all25 completion flags, both tutorial flags, non-default audio preferences, the exact Fusion archive save and an unrelated storage key remain intact. Git diff whitespace validation passes.

## Remaining testing and limitations

- **Not all 25 missions have been played through with natural combat or human players.** Whole-mission native combat was tested for 1-1; the five boss benchmarks isolate their final waves. Use the chapter preparation notes and manual checklist in CAMPAIGN_LEVEL_REFERENCE.md to tune complete missions and gather player feedback. No numerical human win-rate is claimed.
- The current active Fusion catalog contains Starburst Pure Fusion. Existing Hybrid/Adaptive extension APIs and notification fixtures were preserved and tested, but there are no active Hybrid/Adaptive recipes in this checkout to claim as natural playable regression coverage. Campaign does not invent recipes.
- Headless native preview, actual browser resize and simulated zero/nonfinite minimize-like dimensions were tested. Interactive GDevelop editor operation, OS minimize/restore, physical touch, desktop application Exit and exported mobile/desktop builds still need manual checks.
- No extended multi-hour memory/performance soak was run. Scene transitions dispose owned UI/listeners and repeated resize checks show stable instance counts.
- The full directory-cleanliness validator still rejects the **pre-existing user-modified `Tower Defense.json.autosave`**. It was not changed or removed by this task. Structural/resource validation and native preview succeed; the full housekeeping command is not reported as passing.
- Five boss art variants deliberately reuse Void Golem artwork. Bespoke boss illustrations remain an optional future art task, not an unmarked placeholder dependency.

## Maintained workflow

Change `tools/campaign-config.json`, then run:

```powershell
python tools/build-campaign.py
python tools/embed-free-placement.py
python tools/campaign-reference.py
python tools/validate-campaign.py
node tools/validate-clean-project.cjs --scene=Levels
python tools/run-clean-validation.py --prepare
python tools/balance-browser.py tools/campaign-qa.js validation/campaign-full.json --levels --viewport=1280x720 --campaign-reload-check
```

Use `--mode=playtest` for natural 1-1 combat, `tools/campaign-boss-qa.js --mode=balance` for final boss-wave benchmarks, and `tools/campaign-resize-qa.js` with the driver's resize sequence for viewport coverage. Compile the default Game Scene preview again before using legacy direct-scene suites. Do not regenerate preview files while a browser test is reading them. Generated preview files are compiled validation builds; no extra source project copy is made.
