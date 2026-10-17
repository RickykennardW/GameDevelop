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
