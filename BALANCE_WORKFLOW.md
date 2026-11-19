# Continuous chapter balance review

Use this workflow whenever routes, widths, sizes, footprints, obstacles, range,
movement, waves, difficulty or camera framing change. Never create backups or
duplicate source projects. Read the Git baseline in memory and edit directly.

## Sources and scale contract

- `tools/chapter-maps.json`: five routes, palettes, props and the shared scale.
- `tools/campaign-config.json`: existing 25 missions, income, enemies and bosses.
- Tower/enemy combat configuration remains in native scene variables. Visual
  multipliers must not alter Health, speed, projectile hitboxes or attack range.
- Maintain one route for road art, native waypoints, placement and ETA. Do not
  draw a different road over an unchanged collision ribbon.
- UI design reference remains 1280 × 720; build surface is 1704 × 1008. Paths are 60 world
  units with square 24-unit paving; enemy render multiplier is 0.9. Tower and
  collision multipliers remain 1. Camera fitting uses the existing cliff bounds
  (1872 × 1155.52 world units including framing margins), independent of route.

## Review before changing

Record the Git revision, old/new values and expected effects on route exposure,
placement clearances, escape time, AoE coverage and economy. Check dynamic
resource identifiers separately from file paths. Check all six enemy archetypes,
both source towers and every Fusion footprint. Keep future content PLANNED.

## Build and validate

Use the installed GDevelop toolchain through `GD_VALIDATION_HOME`, as described
in the maintained native tools. The exporter creates a compiled preview, never
a safety copy of the source project. Do not run `build-campaign.py` just to change
a map: chapter metadata is applied by the chapter builder.

```powershell
python -B tools/build-chapter-maps.py
python -B tools/embed-free-placement.py
python -B tools/validate-chapter-maps.py
python -B tools/validate-stage-progression.py
python -B tools/validate-campaign.py
python -B tools/validate-labyrinth.py
python -B tools/validate-fusion-pack.py
node tools/validate-clean-project.cjs --scene=Levels
python -B tools/run-clean-validation.py --prepare
python -B tools/balance-browser.py tools/chapter-map-qa.js validation/chapter-map-movement.json --levels
python -B tools/balance-browser.py tools/campaign-qa.js validation/chapter-campaign-runtime.json --levels
python -B tools/balance-browser.py tools/campaign-boss-qa.js validation/chapter-boss-runtime.json --levels
python -B tools/balance-browser.py tools/campaign-fusion-qa.js validation/chapter-campaign-fusion.json --levels
python -B tools/balance-browser.py tools/stage-progression-qa.js validation/chapter-first-contact-area.json --levels --mode=prioritize-area
python -B tools/balance-browser.py tools/stage-progression-qa.js validation/chapter-first-contact-speed.json --levels
python -B tools/balance-browser.py tools/chapter-balance-qa.js validation/chapter-balance-mixed-spread.json --levels --mode=mixed
python -B tools/balance-browser.py tools/chapter-balance-qa.js validation/chapter-balance-cannon-spread.json --levels --mode=cannon
```

The two whole-mission policies cover missions 1, 3 and 5 in each chapter; 1-1
uses its separate 15-wave test. Every wave of each selected mission must finish
through native combat, with real prices and kill income. Save unlocks are isolated
test fixtures. Never inject Gold, reduce enemy HP or force deaths in these tests.
Single-mission modes include `mixed-4-5`, `cannon-4-5`, `cannon-damage-4-5`
and `mixed-focused-4-5`. Policies deliberately differ; they are not an optimal AI.

For legacy comparison, `legacy-mixed-4-5` uses the retained pre-chapter route in
the isolated fixture only. Do not add a production debug route switch. When a
loss appears, compare exposure and placement before changing stats. Preserve
loss reports and explain which map/policy produced them.

Run the Fusion suites after exporting the normal Game Scene entry point:

```powershell
node tools/validate-clean-project.cjs
python -B tools/run-clean-validation.py --prepare
python -B tools/balance-browser.py tools/fusion-evolution-matrix-qa.js validation/chapter-fusion-matrix.json --gesture
python -B tools/balance-browser.py tools/fusion-evolution-combat-qa.js validation/chapter-fusion-combat.json --gesture
python -B tools/balance-browser.py tools/responsive-ui-qa.js validation/chapter-game-resize.json --resize-sequence=1280x720,960x540,640x360,1920x1080,1280x720 --minimize-check
python -B tools/balance-browser.py tools/celestial-sonar-qa.js validation/chapter-sonar.json --gesture
python -B tools/balance-browser.py tools/discovery-toast-queue-qa.js validation/chapter-discovery-queue.json
```

These suites use finite-state/damage/Gold fixtures to isolate behavior. They prove
recipe ordering, transactions, footprints, tier abilities, muzzle/projectile paths
and cleanup; they do not prove that a naturally funded Fusion wins a campaign.

For UI changes, export Levels again before running the resize suite:

```powershell
python -B tools/balance-browser.py tools/campaign-resize-qa.js validation/chapter-resize.json --levels --resize-sequence=1280x720,960x540,640x360,1920x1080,1280x720 --minimize-check
```

## Gates and report

1. Native compilation must have no scene diagnostics. Resources and embedded
   sources must resolve; gameplay/stat diffs require explicit justification.
2. Routes must connect, fit the surface and agree with placement. Every normal
   and Fusion footprint must have usable sites. Sample-grid counts overlap and
   must never be reported as the number of towers that fit simultaneously.
3. Test all six enemy types, four headings, casting and Finish arrivals. Check
   paid placement, sale, upgrades, targeting, muzzle position and real damage.
4. Exercise early/middle/boss missions with at least two policies. Preserve losses;
   do not tune a test until every strategy wins and then claim perfect balance.
5. Compare chapters and the old map when a change reduces viability. Fix geometry
   regressions first. Check armor specialization, crowd control, reserve income
   and distributed coverage before proposing a stat adjustment.
6. Provide diagnostic 1–10 scores, state whether each is inspection, a native
   measurement or UNVERIFIED human experience. Scores are not measured win rates.
7. Human playtesting still covers fresh onboarding, all 25 missions, crowded
   late-game readability, audio listening, long-session memory/FPS and differing
   player skill. Treat these as outstanding until actually performed.

Historical validators normalize only approved additions, and the current chapter
scope validator separately checks them against Git `e59ded3`. Do not broadly
disable assertions to make a changed map pass. A future authorized stat change
needs its own explicit baseline and tests rather than weakening this audit.
