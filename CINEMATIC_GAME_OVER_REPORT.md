# Starfall Bastion — Cinematic Game Over

Implemented directly in the existing split GDevelop project. No backups, project duplicates, replacement gameplay scenes, new audio files, or external dependencies were created. Git history was not modified.

## Gameplay and defeat integration

The actual scene is **Game Scene**, the lobby is **MainMenu**, and the existing loss event uses **Lives <= 0**. The native Finish event still deletes enemies reaching Base and subtracts Lives; the original loss event remains intact. Because the existing `GameOver` flag also represents victory, the new controller checks Lives independently and does not activate on positive-Lives victory.

`scene.__gameOverUI` activates once. Pre-event detection catches a pre-existing loss; the final scene event catches losses produced by native Finish during that frame. Activation cancels Tactical Fusion without consuming sources, clears placement ghosts/ranges, closes existing modals, and locks battlefield input. Native gameplay event groups receive a `DefeatActive=False` parent guard; their original children are unchanged. The world layer's timeScale becomes0, while the scene clock remains1 for UI, audio fades, and pointer detection. Rendering remains enabled to preserve existing tower/enemy/map presentation scales.

Wave spawning, movement, firing, damage, rewards, selection, upgrades and placement cannot continue during defeat. Discovery presentation waits without removing its active entry or queued tickets. Existing sonar detects GameOver and stops its voice/indicators. No whole-runtime pause is used by the production controller.

## Sequence and appearance

All timing/opacity values live in scene variable **GameOverUIConfig**:

| Phase | Behavior |
| --- | --- |
| Red fade | Single crimson overlay, tint `#550e28`; gentle initial12% opacity rising to60% over1.8s. Battlefield remains visible. |
| Title | Centered pale Georgia GAME OVER, subtle shadow/ornament, fade and scale0.985→1 over0.45s after the red fade. |
| Instruction | CLICK TO CONTINUE fades over0.2s. No action buttons yet. |
| Continue | Accepts a fresh primary click/tap only after readiness, approximately2.45s. Early presses and held defeat clicks cannot advance. |
| Menu transition | The same overlay interpolates crimson→`#05060e` and60→70% opacity over0.55s. Title moves upward smoothly. |
| Buttons | RESTART and MAIN MENU fade over0.25s, centered with consistent spacing. The continuing hold cannot choose either button. |
| Leave | One guarded native scene request after0.28s exit fade. |

Buttons reuse existing lobby Normal/Hover SVG animations; no new art/resource registration. Their smoothing helper is shared with the lobby: exponential interpolation toward its existing **1.06** HoverScale. Scale is recomputed from reference geometry and hover factor, never multiplied cumulatively. The clickable rectangle follows the visible frame. Mouse release must match the pressed button. Native touch-to-primary-input continuation was exercised.

`GameOverUI` is the highest layer. Its single overlay covers the logical viewport; buttons/title are centered relative to the viewport, independent of world camera. Geometry is cached until viewport dimensions change. Small windows preserve artwork proportions and readable button-label minimums. Invalid/zero dimensions retain the last valid layout through the existing resize owner.

## Restart, lobby and saved data

Restart uses native scene replacement of `scene.getName()`, reusing the scene's existing initialization. The authored defaults remain **Gold50000, Lives10, Wave0**. Old towers, enemies, projectiles, temporary scene state, ghosts, controller and overlay are disposed with the old scene. Normal placement and upgrading were exercised after Restart.

Restart preserves the existing RuntimeGame Monster discovery session, persistent Fusion archive and audio preferences. It deliberately does not call the older optional discovery reset API. Main Menu replaces the scene with **MainMenu**; Start then enters a clean gameplay scene again. No defeat objects/nodes carry into the lobby.

The existing audio observer plays GameOver once and fades its existing BGM. Existing UIClick confirms actions. Volume/mute and channel limits are unchanged. Trusted audio unlock is handed off when the old scene unloads, avoiding consumption by its final post-event callback. Native playback and mute were verified, including a real-time Restart/lobby round trip.

## Files and project elements changed

| File | Change |
| --- | --- |
| `layouts/game-scene.json` |3scene variables, highest GameOverUI layer,4native button/label definitions and editor folder, defeat guards, embedded controller and small integrations. |
| `layouts/main-menu.json` | Embedded source uses the shared existing hover formula. Scene layout/art unchanged. |
| `tools/game-over-runtime.js` | New single controller, visuals, input gating, lifecycle and native scene transitions. |
| `tools/build-game-over.py` | Idempotent registration using existing lobby object definitions/resources. |
| `tools/source-mapping.json` | Adjusted nested paths under native guards; appended event19/controller mapping. |
| `tools/main-menu-runtime.js` | Shared hover helper preserving the previous formula exactly. |
| `tools/responsive-map-runtime.js` | Defeat treated as a modal for shop/control input. |
| `tools/audio-runtime.js` | Audio settings input closes/locks during defeat; suppresses incidental modal-close/mode-change click cues. Mixer/audio assets unchanged. |
| `tools/monster-discovery-runtime.js`, `tools/fusion-archive-runtime.js` | Presentation waits during defeat; unlock/storage rules unchanged. |
| `tools/game-over-qa.js`, `tools/game-over-realtime-qa.js`, `tools/game-over-resize-qa.js`, `tools/validate-game-over.py` | Native runtime and static/scope verification. |
| `PROJECT_GUIDE.md`, this report, `validation/game-over-*`, three GameOver screenshots | Maintained instructions and actual validation evidence. |

New objects: **DefeatRestart, DefeatMainMenu, DefeatRestartLabel, DefeatMainMenuLabel**. New variables: **DefeatActive, DefeatPhase, GameOverUIConfig**. New layer: **GameOverUI**. No new authored instances: the four menu objects are created once per defeat.

Native guards wrap root event groups **1,3,10,15** and add a condition to root Standard events **5,7,9**. New controller: **19.events[0]**. The original loss/Finish events remain inside root10's guard. Original group children, all67object definitions,157authored instances,67pre-existing variables/configurations, resource registry and28audio files were verified against pre-change hashes. Root `Tower Defense.json` remains byte-identical.

## Tests actually executed

Compiled and exported both scenes with maintained installed libGD/GDJS tooling: **zero event compiler diagnostics**, native export successful. Ran the native GDevelop runtime in Chrome, not a separate UI demo.

| Test/report | Result |
| --- | --- |
| `validation/game-over-full.json` |53checks: actual Finish/Lives loss, gradual phases, early/held clicks, frozen state, one sound/overlay,40hover cycles, Restart, real post-Restart purchase/upgrade, preserved discovery/settings, second defeat, lobby/Start, victory exclusion.0console errors. |
| `validation/game-over-realtime.json` |19checks using actual wall-clock animation frames: native audio playback, muted second defeat, Restart, MainMenu and Start.0console errors. |
| `validation/game-over-resize.json` |114checks in one game across8actual viewport changes:1280×720,960×600,640×400,480×300,1280×720,640×400,1280×720,480×300. Native touch continuation; zero/NaN viewport simulations; no duplicate objects or cumulative growth.0console errors. |
| `validation/test-clean-project-results.txt` |354maintained gameplay checks passed;0console exceptions. |
| `validation/game-over-starburst-regression.json` |110Star Cannon/upgrade/Fusion/projectile/archive checks passed;0console errors. |
| `validation/game-over-economy-regression.json` |28placement/Gold/feedback/audio checks passed;0console errors. |
| `validation/game-over-discovery-regression.json` |18mixed discovery queue/Index/Fusion checks passed;0console errors. |
| `validation/game-over-sonar-regression.json` |476assertions including repeated global-voice checks, actual warning playback,1×/2×/0.5×, pause and defeat silence;0console errors. |
| `validation/game-over-lobby-regression.json` |30existing lobby/hover/Exit/Start/audio checks passed;0console errors. |
| `validation/game-over-static.json` |138scope/integration checks plus3702maintained structural/resource checks passed. |

The accelerated fixture initially unloaded scenes before asynchronous WebAudio decoding could run, producing decode errors. Fixture-only real-time yields fixed that test issue; the final accelerated and independent wall-clock runs both produced0console errors. Audio assets and the underlying playback/decoder implementation were not replaced.

Screenshots inspected: `validation/GameOver_Title.png`, `validation/GameOver_Menu.png`, `validation/GameOver_Compact.png`.

## Limits and existing validation warning

- OS-level minimize/restore was not directly exercised. Actual browser viewport resizing was exercised; zero/nonfinite minimize-like dimensions were simulated and retained the last valid layout.
- Tests used the installed native GDevelop compiler/export/runtime. Opening the project in the interactive GDevelop IDE and closing a desktop export through Exit were not exercised. Browser Exit invoked the native quit path and correctly retained its existing close-tab message.
- The bundled libGD compiler emits its pre-existing5.6.283/5.6.284 project-version warning. Both scenes nevertheless compile with0event diagnostics and run in the installed runtime. The maintained exporter supplies the custom Health behavior bundle after its include-discovery warning.
- The full `python tools/validate-project.py` command reaches its housekeeping scan and rejects the **pre-existing `Tower Defense.json.autosave`**. Structural/resource/source checks passed separately using the same validator code. This feature did not create, modify, or remove that unrelated editor autosave. The full cleanliness check is therefore **not reported as passed**.

No backup file/folder or duplicate source project was created. Normal compiled validation previews contain executable build output only.
