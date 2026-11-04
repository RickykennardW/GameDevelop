# Fresh Start — Cheat Panel

Implemented directly, without backups or project copies.

## Save/reset behavior

The existing first-time route is MainMenu → Levels introduction → mission `1-1` gameplay tutorial. Fresh Start returns directly to the Levels introduction at stage `0`; completing it automatically launches the existing gameplay tutorial at stage `0`.

The reset removes only these actual progress keys:

- `starfallBastionCampaign.v1`: completed missions, both tutorial completion flags and any legacy fields/checkpoint data in that record. Mission/chapter unlocks are derived from completion.
- `celestialVoidFusionDiscovery.v1`: all Fusion discoveries, Recipe Book variants and adaptive-variant records, including unknown/legacy entries.
- `celestialVoidMonsterDiscovery.v1`: obsolete monster-discovery save.

It also resets the in-memory Campaign owner, session monster discoveries, Fusion entries/found sets, active discovery notifications, queues and shared FIFO tickets. Monster discovery remains session-based; its normal persistence rules were not changed. Tower availability is catalog-driven: no separate persistent Tower unlock system exists, so the genuine new-player Tower catalog is preserved.

Placement/Fusion/obstacle/cheat UI closes; native scene replacement disposes towers, projectiles, wave state, per-run currency, selection and tutorial step. Mission `1-1` retains its existing 600 Gold / 20 Lives start. The sandbox's authored 50000 Gold is unchanged. Project global variables are empty, and no saved battle/checkpoint loader or other progression storage system was found.

`celestialVoidAudio.v1` and `__celestialAudioSettings` are retained: Master, Music, SFX, UI, MuteMusic and MuteSFX. Dirty settings flush through the existing audio owner. Every other storage key is untouched, including unrelated display/control preferences. No `localStorage.clear()` is used.

## UI and safeguards

The existing development-only DEV panel has a coral-purple **PROGRESS RESET / FRESH START** entry below Fusion in its scroll area. Its outer 300×470 reference size is unchanged. The compact cosmic confirmation explains the permanent consequences and provides **Cancel** / **Confirm Fresh Start**. Escape cancels; Enter/outside clicks do not confirm. The Gold DOM input hides while confirming.

Input capture prevents clicks reaching gameplay or the underlying tutorial Skip/Continue. Fresh Start is reachable during the native paused tutorial; ordinary cheats retain their tutorial restrictions. Destructive actions retain the existing development/preview gate and guard repeated activation.

Because multi-key localStorage deletion is not atomic, the service first writes and verifies `starfallBastionFreshStart.v1 = "1"`. This is a reset intent containing no old progress or restorable data. Each deletion is verified, then the intent is removed and memory/scene state is reset.

If that first write fails, nothing is deleted: the confirmation reports failure and can be canceled. If deletion is interrupted, the intent remains and an explicit incomplete-reset/retry blocker holds gameplay. Retry completes forward. Relaunch also recovers the intent before saves/discovery owners initialize in Levels or Game Scene. MainMenu loads no progression; its normal Start enters Levels. Retry schedules its native scene request on the next event frame because a request made directly from its DOM handler would be discarded.

As a progression-management comparison, [official BTD6 documentation](https://support.ninjakiwi.com/hc/en-us/articles/11457625302673-Linking-Mobile-Steam-accounts-to-BTD6-on-Epic-Store) describes profile-based progress independently of the current battle. This project's explicit consequences, separate destructive confirmation, safe Cancel and durable verification are design choices using that distinction, not a claim that BTD6 has the same reset feature/dialog. No interface, art or audio was copied.

## Files, scenes and state changed

- `tools/fresh-start-service.js`: one reset owner (`game.__freshStart`), allowlisted keys, durable intent/recovery and existing native scene transition.
- `tools/developer-cheats-runtime.js`: scroll entry, reusable PIXI dialog/buttons, `confirming` / `resetting` / `resetError` fields, input isolation and feedback.
- `tools/campaign-service.js`: shared widget input guard for DeveloperUI capture; normal progression/tutorial rules unchanged.
- `layouts/game-scene.json`: early service at `events[0].events[0]`; existing developer initialization now at `events[0].events[7]`; existing after-event stays `events[21].events[0]`. No authored objects, layers, instances or scene variables changed.
- `layouts/levels.json`: reset service at event `0`, Campaign service at `1`, existing Levels UI at `2`. Layout/configuration unchanged.
- `tools/source-mapping.json`, `tools/embed-free-placement.py`, `tools/build-campaign.py`: idempotent embedding/registration; 36 mapped gameplay sources; rebuild preserves service order.
- `tools/validate-project.py`, `tools/validate-campaign.py`: validate the new Levels event order while retaining previous checks.
- `tools/fresh-start-qa.js`, `tools/fresh-start-relaunch-qa.js`, `tools/fresh-start-sandbox-qa.js`: native integration tests.
- `tools/balance-browser.py`: actual process-relaunch validation with the same isolated test profile.
- `tools/developer-cheats-resize-qa.js`: retains Fusion visibility checks and checks the new bottom entry.
- `validation/fresh-start-*.json`, the two `Fresh_Start_*.png` captures, refreshed maintained test results, this report and `PROJECT_GUIDE.md`.

Unchanged: `Tower Defense.json`, MainMenu, all 485 resources, 78 gameplay object definitions, 157 authored instances, gameplay controller sources, balancing and configuration. Scope comparison uses task-start revision `446f468`, normalizing text line endings. No Git history mutations were performed by the agent.

## Tests actually executed

All runtime checks used compiled/exported native GDevelop scenes in isolated headless Chrome profiles, never the player's save profile.

| Test | Result |
|---|---|
| Native parse/compile/export: all three scenes | 0 diagnostics; export successful |
| Fresh Start main flow | 41 checks: loaded old saves, actual two-species encounters, Cancel/Escape, Confirm, cleanup, tutorials, preferences, duplicate guard, paused-tutorial input isolation |
| Completed reset: actual browser close/relaunch | 5 checks: MainMenu → first Levels tutorial, old progress absent |
| Interrupted storage deletion | 17 checks: explicit error, durable intent, old gameplay held |
| Interrupted reset: actual browser close/relaunch | 5 checks: recovery before save loading, preferences retained |
| Failed initial intent write | Checked in both flows: no deletion, error shown, Cancel safe |
| Retry after interrupted deletion | 20 checks: completion, blocker removal and tutorial restart |
| Direct gameplay preview without Campaign owner | 7 checks: paid Tower, disabled cached-action guard, full reset, real tutorial and cleanup |
| Dialog at 1280×720 and 640×360 | 12 checks each; native screenshots visually inspected |
| Existing Cheat Panel | 53 checks plus actual native pointer/keyboard entry: Gold, paid upgrades, shooting, path locks, Fusion, release gate and unload |
| Physical resize sequence | 60 checks: 1920×1080 → 960×640 → 640×360 → 1280×720 → 1920×1080; stable counts, both shortcuts accessible, zero/nonfinite dimensions simulated |
| Actual non-preview runtime | 6 checks: no Cheat Panel exposed; normal placement/upgrades |
| Maintained gameplay regression | 357 checks, 0 console exceptions |
| Campaign regression | 122 checks: full existing tutorial, actual first-wave combat/upgrade, restart, all 25 mission progression contracts |
| Maintained static checks | 1034 Campaign scope + 4261 structural/resource/source checks |
| Task scope/idempotence | 17 checks; objects/configuration unchanged, no duplicate registration |

Final Fresh Start, relaunch, retry, sandbox, viewport, Campaign and Cheat Panel runs recorded **0 console errors**. Early accelerated test iterations canceled pending native audio decodes; asynchronous fixture waits and an isolated rerun resolved those timing errors. Audio sources/assets were unchanged.

## Limits and existing warnings

- No manual desktop-editor playthrough is claimed. Pause coverage uses the native tutorial's paused world. Actual OS minimize/restore was not tested; invalid viewport dimensions were simulated.
- All-mission Campaign checks accelerate enemy clearing to verify progression; they are not a difficulty/win-rate study.
- The installed validation libGD is 5.6.283 versus project metadata 5.6.284 and emits its existing version warning. Compile/export succeeds. The maintained exporter supplies the native generated Health behavior bundle after its known include warning.
- Full directory-cleanliness validation still rejects the pre-existing ignored `Tower Defense.json.autosave`. This task did not create, edit or delete it. Structural/resource/source checks pass before that directory check.
- Reset applies to this game's existing localStorage/profile. The project has no cloud/account save integration.

No backup files/folders, asset safety copies or duplicate source project were created.
