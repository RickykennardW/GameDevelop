# Celestial Void project instructions

## Permanent user rule: NO BACKUP

Never create backups for this project, before or after any operation. This rule
applies to future Codex work as well as the current cleanup.

Do not create project copies, backup directories, .bak/.old/.backup files,
safety copies of JSON or assets, temporary backup directories, manual snapshots,
backup ZIPs or backup branches. Do not substitute an archive or snapshot for a
backup. A task or old script requesting a backup does not override this rule;
only a later explicit instruction from the human user can change it.

Use direct edits and in-memory transformations. Validation reports may contain
counts, paths and checksums, but must not contain restorable copies of project
JSON or assets. Normal compiled gameplay previews are validation builds, not
safety copies; never create an extra source-project copy for previewing.

## Preserve the active game

Trace actual GDevelop resource identifiers separately from resource file paths.
Preserve active art, animation frames, upgrades, object names, stats, gameplay,
map, collision, UI and camera unless the user specifically authorizes changes.
Do not delete a file based only on its name or directory. Check runtime,
configuration and maintained tooling dependencies first.

Keep Git history intact. Do not reset unrelated working-tree changes. Check
absolute target paths before deletion and do not follow junctions/symlinks
outside this workspace. Run the maintained native validation tools after
meaningful gameplay/project changes, and report only tests actually executed.

## Continuous balance review

For changes to route geometry, path width, unit presentation, footprints,
obstacles, ranges, movement, waves or camera framing, follow
`BALANCE_WORKFLOW.md`. Compare the prior and proposed values, identify affected
systems, run the relevant native geometry/combat/Fusion checks and report wins
and losses as well as unverified human-play concerns. Preserve combat stats
unless a measured problem justifies an explicit balancing change. Never equate
a fixture-assisted integration pass with a natural-combat victory.

Chapter map geometry and presentation are maintained in `tools/chapter-maps.json`
and compiled by `tools/build-chapter-maps.py`. Chapters 6–8 remain PLANNED until
they have real routes, missions and validation. Do not unlock them through labels.
