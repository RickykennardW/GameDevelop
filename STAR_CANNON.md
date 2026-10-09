# Star Cannon — tower resmi tunggal

`StarCannonTower` adalah owner logical, ID, footprint, dan stats. `StarCannonBaseVisual` serta `StarCannonTurretVisual` masing-masing memiliki 21 state. Semua 42 PNG komponen dan 21 PNG original tetap utuh; original digunakan di Shop, Index, dan preview. Metadata socket, ground contact, silhouette, muzzle, projectile/impact SVG, dan delapan upgrade icon dipertahankan.

Kode aktif: `tools/star-cannon-runtime.js`, `tools/star-visual-runtime.js`, `tools/selected-panel-runtime.js`. Source mapping event tersimpan di `tools/cleanup-audit/source-mapping.json`.

Base tetap angle0; turret memilih target hidup dalam range, mempertahankan target selama valid, berputar240 derajat per game-second, dan menembak pada error <=8 derajat. Muzzle dunia berasal dari transform pivot/rotation/scale yang sama dengan renderer. Twin/Triple memiliki dua/tiga emitter berbeda. Footprint radius46, posisi anchor, range, selection, DamageDealt, investasi/refund, dan crosspath rules tetap sama.

Shared upgrade icon object sekarang bernama `StarUpgradeIcon`; delapan state SC dipertahankan dan seluruh consumer diperbarui. Shop hanya satu Star Cannon300 Gold. Index mempunyai satu entry dengan kedua path lengkap.

Asset gallery: `design_previews/star_cannon/Asset_Gallery.html` dan tiga `Component_Gallery_*.html`. Bukti terbaru dan rincian cleanup: CLEANUP_REPORT.md.
