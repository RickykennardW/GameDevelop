# Developer Cheat Panel — Celestial_Void

Implemented directly on 27 October 2026. No backup, duplicate project, snapshot, asset copy, new dependency or Git-history change was created. The user's pre-existing `Tower Defense.json.autosave` change was left untouched.

## Access and controls

In **Game Scene Preview**, click **DEV** beside the Audio button above the map. Click DEV again or X to close. The launcher stays outside Gold/Lives/Wave and Tower Shop. It hides during onboarding, Index, Audio settings, active Fusion and victory/defeat; finish or Skip Tutorial first if necessary. Opening the panel does not pause or change gameplay speed.

The cosmic panel is300×470px on the reference desktop viewport and scrolls to its lower Fusion section. It uses the existing screen-space viewport/camera approach, not world coordinates. Small-window text and button sizes retain physical readability; invalid/hidden viewport dimensions keep the last valid geometry. The feedback footer replaces its own message rather than stacking toasts or using the Tower Shop.

![Developer panel with a real maxed Tower](<C:/Users/My ASUS/OneDrive/Documents/GitHub/GameDevelop/validation/Developer_Cheats.png>)

Gold controls: **+1000, +5000, +10000, +50000**, custom **Add Gold**, and clearly separate **Set Balance**. Custom values must be positive whole numbers; empty, zero, negative, decimal, scientific notation, non-numeric, unsafe and excessive inputs are rejected. `DevCheatConfig.GoldLimit` defaults to **1,000,000,000** and caps the resulting balance as well as the submitted amount. A failed operation leaves the balance unchanged.

Both Gold actions write the existing **Money** variable and update MoneyText immediately. They do not invoke normal reward callbacks, create a second currency, grant funds on scene/wave start, or write save data. Enter submits Add Gold once per keydown; focused text input does not forward gameplay hotkeys. Existing UIClick and its mixer/cooldown are reused. No new sounds are required.

## Real upgrade and Fusion transactions

Select an existing Tower, open DEV, choose **5–2** or **2–5**, and press **Max Selected Tower**. The current Star Cannon controller's `valid` function determines legal targets; `upgrade` performs each real paid upgrade. It preserves the same instance, TowerId, footprint, investment, targeting, damage, projectile logic and component rig. At base,5–2 spends11770 upgrade Gold and2–5 spends10120, in addition to the original300 purchase. Gold must be available first; insufficient funds are rejected before the sequence starts.

An already-maxed Tower is unchanged. A path already committed above level2 cannot be forced into the opposite dominant path. Starburst is explicitly unsupported for max upgrades because it has no normal upgrade paths. Future Tower types require their own authoritative upgrade adapter; this implementation does not assume they share Star Cannon rules.

**Start Normal Fusion** calls the existing `fusion.begin` for a selected eligible source and closes DEV. Partner selection, complementary5–2/2–5 compatibility, Tactical Fusion0.5×, regional footprint, road/obstacle collision, recipe cost, source consumption, cancellation and resulting Starburst all remain native. No fake Fusion Tower or recipe override is created.

**Not added:** reset upgrades and Unlock Fusion Testing. There is no complete native reset owner for investment/counters/stack/cooldown state, and the discovery archive is tied to persistent save/notification state. Use normal Sell and purchase again for a clean base Tower. Gold and max do not unlock Index entries or campaign levels automatically. A genuinely successful normal Fusion still invokes the normal discovery/save transaction; it is not a temporary discovery override.

The active catalog currently contains **Starburst Pure Fusion** only. Hybrid/Adaptive extension APIs remain intact, but this task adds no missing recipes or Evolution requirements and does not claim natural Hybrid/Adaptive gameplay testing. A non-persistent archive override would need a separate session/view API before it could be implemented safely.

UX comparison: [Ninja Kiwi's official BTD6 notes](https://store.steampowered.com/news/posts/?appgroupname=Bloons+TD+6&appids=960090&enddate=1712546013&feed=steam_community_announcements) expose sandbox tower placement/testing within editing tools. This panel follows the same principle of making experiments accessible, with clear amounts and feedback, while keeping actual game transactions and the project's own cosmic design. No Bloons artwork, audio or UI was copied.

## Development and release gate

Every mutating cheat action requires **DEV_CHEATS_ENABLED=true AND game.isPreview()===true**. The native public Preview flag is available in the installed GDevelop runtime. A missing/false API result fails closed. Controller creation uses the same gate; a non-preview runtime has no launcher, input or cheat controller even if the authored DEV flag remains true. Cached action references also re-check the central flag on each call.

Before release: open **Game Scene → Scene Variables → DEV_CHEATS_ENABLED**, set it to **false**, save, and use normal GDevelop export. There is no player-facing enable option or persisted setting. The registration builder never overwrites an existing false value. An exported Preview page still identifies itself as Preview; the release procedure uses the normal exporter.

DEV Gold is per run. Restart restores the authored sandbox50000 or the selected campaign mission's actual opening Gold. The panel does not reset or rewrite campaign/Fusion/monster/audio saves. Existing legitimate gameplay progression and discovery still follow their normal rules after a developer-funded transaction or battle.

## Files, variables and events

| File / section | Change |
| --- | --- |
| `layouts/game-scene.json` | DeveloperUI below highest GameOverUI; four new variables; initializer at events[0].events[6]; after-event at events[21].events[0]; embedded sources synchronized. No authored instance or object definition changes. |
| `tools/developer-cheats-runtime.js` | One scene-owned controller, gated Gold/max/Fusion actions, reusable PIXI controls/mask, one lazy browser text input, viewport layout, input capture and cleanup. |
| `tools/developer-cheats-after.js` | Calls the controller after existing gameplay events. |
| `tools/build-developer-cheats.py`, `tools/source-mapping.json` | Idempotent direct registration and source mapping. Existing flag/config values are preserved. |
| `tools/audio-runtime.js` | One input bridge: include DevUIConsumesClick in the existing input-consumption owner. Audio assets, mixing, music, volume and reward observers are unchanged. |
| `tools/nova-wave-manager.js` | Block manual Space start while DevGoldInputFocused. Wave generation, composition, intervals and economy formulas remain unchanged. |
| `tools/balance-browser.py`, `tools/run-clean-validation.py` | Native keyboard checks and a compiled validation page constructed with isPreview=false; no extra source-project copy. |
| `tools/developer-cheats-qa.js`, `developer-cheats-resize-qa.js`, `developer-cheats-release-qa.js`, `developer-campaign-qa.js` | Maintained native validation fixtures. |
| `PROJECT_GUIDE.md`, this report, `validation/developer-*.json`, `validation/Developer_Cheats*.png` | Configuration/release documentation and measured test evidence. |

New variables: **DEV_CHEATS_ENABLED** (authored Preview access), **DevCheatConfig** (GoldLimit, PanelWidth, PanelHeight, FeedbackSeconds), **DevUIConsumesClick** (pointer/held-drag consumption), **DevGoldInputFocused** (keyboard focus). The controller is `scene.__devCheats`. No new serialized GDevelop object definitions, resource identifiers, images or audio are added. UI frames/text are runtime PIXI elements on DeveloperUI; the numeric-entry field is one standard browser input with no library dependency.

The DEV pre-event callback precedes the Audio input observer even when enabled after initialization. Consumed presses update placement/world-selection button histories to prevent click-through and dragging a held UI press into a purchase. Input DOM/listeners and owned text textures are removed on scene unload. Normal shared textures are preserved. UI instances are reused rather than reconstructed each frame.

## Executed validation

The project was parsed and compiled using the maintained native GDevelop tools: all three scenes compile with **zero event diagnostics**. Campaign/scope validation passes **1033 checks plus3746 maintained structure/resource/source checks**. Direct comparison with Git HEAD confirms all original object definitions, authored instances and non-DEV variables are unchanged. Existing tower/enemy configs, prices, map, collision and audio hashes remain intact. Registration plus source embedding is idempotent.

| Evidence | Actual result |
| --- | --- |
| `validation/developer-cheats-native.json` | **53 checks**: all presets, custom/set/invalid/limit cases, immediate HUD, no reward/save writes, real placement, no click-through/drag purchase, no-selection/already-maxed/insufficient funds/locked paths, both paid legal maxes, actual targeting/projectile damage and valid component textures, native Fusion/cancel/commit/discovery, stable UI/input count, disabled cached actions and scene cleanup. |
| Same report, nativeKeyboard | Actual CDP pointer focus, typed250000, Enter adds once, immediate HUD and Space does not start a wave. |
| `validation/developer-cheats-resize.json` | **77 checks** across seven actual viewport changes:1280×720,960×600,640×400,480×300,320×240,1280×720,480×300. Bounded UI, HUD/Audio/Shop clearance, physical readability, correct click conversion, scrolled browser input, stable counts and zero/nonfinite minimize-like geometry retention. |
| `validation/developer-cheats-release.json` | **6 checks** using a real RuntimeGame constructed with isPreview=false while DEV remains true: no cheat controller/UI/input, no idle funds, normal purchase and upgrade still work. This is a native runtime-mode test, not an exported desktop package test. |
| `validation/developer-campaign.json` | **7 checks**: real Levels→1-1 opening600, onboarding gate, actual Skip, real preset to1600, no unlock, Restart disposes input and restores same mission600. |
| `validation/developer-tutorial-regression.json` | **25 checks**: selection tutorial, real valid/invalid placement, native first wave/projectile kill/reward, actual upgrade and normal tutorial completion. |
| `validation/developer-economy-regression.json` | **28 checks**: existing insufficient-Gold feedback/SFX, ghost preservation, purchase, road/ruin/tower collision, cancel and cleanup. |
| `validation/developer-fusion-regression.json` | **110 checks**: existing paid sources/upgrades, valid/invalid/canceled Fusion,0.5×, native Starburst firing/muzzles/projectiles/range and Index. |
| `validation/test-clean-project-results.txt`, `test-gold-budget-results.txt` | Maintained native suites: **354** Tower/selection/obstacle checks and **7486** original Gold-Budget checks pass. |

All listed browser reports end with **zero console errors**; native suites report zero console exceptions. An initial accelerated fixture unloaded scenes while Howler audio was still decoding, causing canceled-decode errors. The fixture now yields for actual decoding before unload; reruns are clean and production audio lifecycle/assets were not changed to hide the errors.

Remaining manual checks: interactive GDevelop editor/Preview, physical OS minimize/restore, touch/virtual keyboard and packaged desktop/mobile export. No long-duration memory soak or new Hybrid/Adaptive recipe testing is claimed. The local compiler emits its existing5.6.283 versus project5.6.284/include warnings; the maintained exporter supplies the native Health bundle and runtime tests succeed. Full folder-cleanliness validation remains blocked by the pre-existing `.autosave`; structural/resource validation is reported separately, not as a full cleanup pass.

## Rebuild / validate / remove

```powershell
python tools/build-developer-cheats.py
python tools/embed-free-placement.py
python tools/validate-campaign.py
node tools/validate-clean-project.cjs
python tools/run-clean-validation.py --prepare
python tools/balance-browser.py tools/developer-cheats-qa.js validation/developer-cheats-native.json --viewport=1280x720 --gesture --dev-keyboard-check
python tools/balance-browser.py tools/developer-cheats-release-qa.js validation/developer-cheats-release.json --viewport=1280x720 --non-preview
```

For disabling, the central false flag is sufficient; keep the native Preview gate. For complete future removal, remove the two DEV events/mappings, DeveloperUI/four variables and the two narrow input bridges, then re-embed and validate. No gameplay assets or recipes need replacing. No backup files were created.
