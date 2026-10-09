# Celestial Void — original galaxy audio

Implemented directly in the existing GDevelop project on 2026-10-10. Open `Tower Defense.json` as usual. The game owns all playback; there is no external player or additional scene. Click/tap or press a key to unlock browser audio, then use the small speaker beside the HUD to adjust the mix.

## Gameplay examined and integration scope

The actual project has one **Game Scene**, one Star Cannon shop card costing **300 Gold**, two upgrade paths, native sell/refund, free placement, homing projectiles, six enemy archetypes, stationary Void Golem casting and armor buffs, 45 Gold-Budget waves, milestone waves, Base damage, and an existing victory/game-over flow. Initial audio consisted of two short WAV resources and three `PlaySound` actions; there was no BGM or volume menu.

The implementation appends one audio event group to `layouts/game-scene.json`. `tools/audio-runtime.js` observes successful placement, upgrade, sell, firing, damage/death, cast/buff application, actual wave progression, enemy leaks and UI interactions. Wrappers preserve the original arguments, return values and gameplay side effects. Invalid purchase/placement/upgrade feedback never charges Gold. The existing Void Golem movement/cast state and buff calculations remain authoritative.

Six existing UI/input sources receive only a guard preventing clicks through the audio popup. Existing object names, stats, sprites, map geometry, waypoints, camera, shop layout, Index, upgrade panels and wave configuration are preserved. Four small audio widget definitions, three audio variables and one overlay layer are added. The two superseded WAVs and their three sound actions are replaced with the original audio resources; no other existing resource is removed.

## Four original compositions

All paths below are relative to the project folder under `assets/audio/`.

| Composition | File | Length | Tempo / arrangement |
|---|---|---:|---|
| Ancient Galaxy Ambience | `music/ancient_galaxy_ambience.ogg` | 120 s | 64 BPM, 32 bars; warm pads, distant wordless choir, crystal bells, sparse celestial motif and deep drone |
| Sacred Void Temple | `music/sacred_void_temple.ogg` | 128 s | 60 BPM, 32 bars; deeper choir, ceremonial bells, slow strings and restrained ritual percussion |
| Cosmic Defense | `music/cosmic_defense.ogg` | 120 s | 96 BPM, 48 bars; pulsing bass, string ostinato, controlled low drums and the same motif |
| Void Awakening | `music/void_awakening.ogg` | 120 s | 112 BPM, 56 bars; darker choir, heavier bass/percussion, low string swells and ancient bells |

The music is an original note-level score rendered with NumPy synthesis. Its shared motif is **D5–F5–E5–A4–D5**, with a **C5–Bb4–A4** response, over a recurring D-minor/suspended progression. Phrases change register, response, density and instrumentation across sections. Detuned additive pads, synthesized vowel-formant choir, bowed additive strings, inharmonic crystal bells, bass envelopes and noise/tuned cinematic percussion form the instruments. Circular convolution reverb and wrapped note tails keep ambience across the loop seam. No downloaded samples, copyrighted songs, religious chants or outside service were used.

The choir and orchestral colors are synthesized, rather than recorded singers or a studio orchestra. This is a fully arranged procedural soundtrack; its artistic timbre should still be auditioned by the developer.

Encoding uses the installed Chromium WebCodecs encoder: **48 kHz OGG Opus**, 112 kbps stereo BGM and 64 kbps mono SFX. PCM, reverb buffers and encoded packets exist only in memory. Exactly **25 final OGG assets, 7,704,588 bytes** are retained. `assets/audio/manifest.json` records the score, duration, encoded SHA-256 and decoded signal metrics. Reproducible composition/encoding sources are `tools/compose-galaxy-audio.py` and `tools/audio-codec-browser.py`.

## Original SFX and real triggers

| Folder | Final files | Trigger |
|---|---|---|
| `towers/` | `tower_place.ogg`, `tower_upgrade.ogg`, `tower_major_upgrade.ogg`, `tower_sell.ogg` | Successful purchase/placement, successful upgrade (tier 3+ uses major cue), successful sell/refund |
| `towers/` | `star_cannon_fire.ogg`, `projectile_impact.ogg` | One firing cue per volley; actual projectile impact, excluding muzzle VFX |
| `enemies/` | `enemy_hit.ogg`, `common_enemy_death.ogg`, `elite_enemy_death.ogg` | Positive nonlethal damage, actual Common death, actual Void Golem death |
| `skills/` | `void_golem_skill.ogg`, `void_fortification_apply.ogg` | One stationary cast entry; one application sound when buff recipients actually receive the skill |
| `waves/` | `wave_start.ogg`, `milestone_wave.ogg`, `wave_complete.ogg` | Actual native wave start/completion; waves 5/10/15/20/25/30/35/40/45 use the milestone alert in place of the normal alert |
| `gameplay/` | `gold_reward.ogg`, `base_damage.ogg`, `game_over.ogg`, `victory.ogg` | Aggregated kills, alive enemy reaching Base and reducing Lives, existing loss, existing wave-45 win |
| `ui/` | `ui_click.ogg`, `invalid_action.ogg`, `tower_select.ogg` | Shop/Index/mode/audio controls, rejected actions, existing tower selection |

SFX combine short mechanical/noise transients, shaped cosmic pitch sweeps, crystal harmonics and deeper stone/core collapse for the Elite. Common death/hit/fire cues have slight deterministic pitch variation. Golem cast playback follows existing 2x speed to remain synchronized with its unchanged cast animation.

## Dynamic playback and mix

| Existing gameplay state | Music |
|---|---|
| Initial wave-0 idle before building | Sacred Void Temple (`MENU` mapping; the project has no separate main-menu scene) |
| Building/preparation and between waves | Ancient Galaxy Ambience |
| Active ordinary wave | Cosmic Defense |
| Active native milestone wave | Void Awakening |
| Existing Game Over / Victory | Fade music out, play the corresponding one-shot |

Dedicated native GDevelop WebAudio channels **1000/1001** play looping BGM. Transitions use a **3-second smoothstep crossfade**, measured in wall time even at 2x game speed. The old track remains until the new buffer is loaded. Same-track state updates do not restart it. Rapid requests keep at most two tracks and resolve to the latest requested state. Terminal states cancel pending music starts and finish the fade. Decoded buffers use sample-accurate native looping; faded-out tracks are stopped/unloaded to bound memory. Only two BGM buffers are retained during a transition (approximately 95 MiB PCM at the longest durations), plus short preloaded SFX.

Defaults: **Master 100%, Music 35%, SFX 70%, UI 45%**. Four independent sliders and Music/SFX mute buttons apply immediately in a compact **308 × 276** popup. SFX mute includes interface sounds. Settings survive reload using `celestialVoidAudio.v1` in localStorage, with session settings retained if storage is unavailable. No gameplay pause or new menu is imposed. Audio begins only after a trusted browser gesture.

High-priority cues duck music to 68% of its current mixed level for 1.25 seconds, with short attack and gentle recovery. A single compressor after Howler's master gain protects summed output (threshold −6 dB, ratio 12:1, 6 dB knee, 3 ms attack, 120 ms release). It is initialized inside the user gesture and reused across frames.

| Priority pool | Native channels | Concurrent cap |
|---|---|---:|
| Low: fire, impact, hit, Common death, Gold | 1010–1013 | 4 |
| Medium: place, upgrade, sell, wave start/complete | 1014–1016 | 3 |
| High: Base, Elite skill/death, milestone, terminal | 1017–1019 | 3; may replace the oldest high-priority cue |
| Interface | 1020–1021 | 2 |

Total cap: **12 SFX + 2 BGM**. Low/medium/UI cues drop when their pool is busy. Fire has a 75 ms minimum interval, impact 80 ms, hit/Common death 120 ms, UI click 80 ms and rejection 180 ms. Gold is aggregated over 350 ms and played at most once per 800 ms. Cast/apply are per activation, not per affected enemy. No firing sound is emitted for every projectile in a multi-projectile volley. Settings, observers, callbacks, widgets and diagnostic history are bounded; scene unloading restores wrappers/listeners and unloads owned sounds.

## Executed validation and practical limits

Tests run against the **actual GDevelop 5.6.283 compiled/exported runtime in isolated headless Chrome**, not a replacement gameplay simulation. Evidence is in `design_previews/audio/`.

- Native project parser: one scene, 65 objects; **zero scene compilation diagnostics**; successful native export and native Health extension bundle.
- `runtime-audio.json`: **44 checks**, including gesture gating, initial music, live controls, native placement for 300 Gold, preparation/ordinary/milestone transitions, upgrades/rejection, fire/impact, Common death/Gold, stationary Elite cast/application/death, concurrency, ducking, actual Base leaks, Game Over and existing Victory. No console errors. The skill fixture shortens a cooldown only in the disposable test scene; the existing 25-second production cooldown is covered by the Golem regression suite.
- `deep-audio.json`: **19 in-page checks plus reload verification**. All four actual native audio buffers wrap across their end with no additional BGM start; rapid transition requests remain bounded. Native three-projectile Meteor volley produces one fire cue and no false muzzle impact. Sell refund, selection, mute, callback/widget allocation bounds, dispose and saved settings survive testing. Loop testing seeks close to each real buffer end while only the automatic state selector is isolated; native playback/fade code continues. No console errors.
- `audio-ui.json`: **13 native input checks**. Insufficient shop/upgrade Gold and invalid road placement produce rejection without changing balances/levels. Actual mute buttons and the Music slider work. Opening/dismissing the popup consumes clicks during builder mode; normal placement still succeeds once afterward. `Audio_Settings_Preview.png` shows this tested UI in the actual game.
- `audio-signal.json`: all 25 exported registered resources decode to their expected nonzero duration; every file is non-silent and individually unclipped. A rendered stress mix of **12 SFX + 2 BGM** with production default gain/compressor settings peaks at **0.6511**, with **zero samples at or above full scale**.
- `long-session.json`: actual five-wave session lasting **120.55 seconds**, using two paid base Star Cannons and existing AutoFast mode. Four normal alerts, one milestone alert, five completion cues and **one valid Base leak/damage cue** were observed; final Lives 9, Gold 1,103. Maximum observed concurrency was two BGM/five SFX, with unchanged 12 observers. **1,939,456 sampled real-output values** peaked at **0.3230**, RMS 0.0501, with no clipped samples observed. This is five real-time waves, rather than a full 45-wave wall-clock run.
- All seven existing native regression suites pass: Clean Project **283**, Nova Wisp **14,532**, Void Hound **117**, Common enemies **636**, HP/balance **183**, Void Golem **552**, Gold Budget **7,486** — **23,789 checks**, zero console exceptions. These include the complete 45-wave budget/roster/reward rules and gameplay integrity.
- `static-audit.json`: compares in memory against pre-audio commit `5b8bfc9`. It verifies every existing object, variable configuration, instance, layer, non-audio resource, gameplay event/condition and protected runtime source, all final paths/checksums, source/event consistency, unchanged Git HEAD, and preserved existing backups.

Signal tests confirm decoded PCM boundaries and native loop scheduling, rather than certifying subjective listening quality. The loop seam has no inserted silence; maximum adjacent boundary jump across BGM is 0.01344. Headless output is measured through an analyser after the actual production compressor. No human speaker/headphone audition, multi-hour endurance run, mobile/iOS test or packaged desktop/mobile build test was performed. Exported desktop Chromium preview is the tested platform. Opus support on additional target platforms must be checked before publishing there.

No `.bak`, `.backup`, `.old`, project copy, ZIP, backup directory/branch or Git history change was created. Existing user backups remain untouched. Final compressed audio and useful source/test evidence are retained; no intermediate audio files are kept.

## Maintenance

`python tools/embed-free-placement.py` synchronizes the runtime sources with the existing scene events. Then run `node tools/validate-clean-project.cjs` and `python tools/run-clean-validation.py --prepare` to refresh the native exported test harness. Set `GD_VALIDATION_RESULTS=design_previews/audio` when running regression suites. Audio fixtures run through `tools/balance-browser.py`; `--gesture` sends a trusted browser mouse event, and `--reload-check` verifies persisted settings for the deep test. `python tools/audit-audio.py` performs the read-only baseline comparison.

`tools/integrate-audio.py` is the guarded one-time migration and refuses to add a second audio group to an already integrated project. Do not rerun it for normal editing. Editing a score and rerendering audio requires refreshing `AudioConfig` duration/gain metadata when relevant.
