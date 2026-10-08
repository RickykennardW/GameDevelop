# Full project audit, recovery, dan canonical placement center

## Backup dan kondisi awal

JSON project yang tersimpan dapat dibaca. Sebelum perubahan dibuat backup lengkap `backups/pre_alignment_audit_20261008_221639.zip` (33.751.439 bytes), termasuk file project, scene/extensions, asset, source tools, dokumen, preview, serta Git diff/status. ZIP diuji dan tidak memiliki entry rusak. Tidak dilakukan rollback menyeluruh.

Git HEAD `1cc40e3` merupakan versi sebelum rework Celestial Void. Karena itu perubahan terhadap HEAD tidak otomatis merupakan kesalahan Save. Audit juga membandingkan snapshot `before-medium-circles.json`, source JS terakhir yang diuji, manifest, dan laporan runtime terakhir.

## Temuan Save

Event panel selected, placement validator, dan circle visuals pada file scene kembali persis ke implementasi sebelum rework medium. Radius juga kembali menjadi 26/34/28/30. Ini bertentangan dengan source tools dan manifest terbaru: radius 32/40/34/36, circle blocker authoritative, selected footprint, serta panel dinamis. Ketiga event dipulihkan secara selektif melalui sumber yang sudah diuji; radius medium dikembalikan.

Metadata lain berasal dari serialisasi editor: UUID variable, pengurutan children structure, array children tanpa nama, field `keepRatio:false` yang dihilangkan, dan inline JavaScript string satu baris. Perbandingan nilai semantic menunjukkan scene variables tetap sama dengan versi sebelum-medium. Instance name/position/size/angle/layer/Z-order tidak berubah. Object Tower/Heavy/Advanced/Archer/Enemy dan combat stats juga sama. Metadata editor yang valid dipertahankan; satu JS string dinormalisasi kembali menjadi daftar baris tanpa mengubah kode.

## Root cause alignment dan fix

Footprint menggunakan pusat pijakan, tetapi native selected range event masih menggunakan `PlaceableTile.CenterX/Y()` (tengah gambar). Range preview juga memakai center gambar indicator. Offset akibat tinggi sprite berbeda setiap tipe; Archer memiliki offset horizontal tambahan karena base anchor. Akibatnya range dan footprint tidak concentric meskipun radius benar.

`FootprintX/Y` sekarang menjadi canonical world placement center yang disimpan saat pembelian. Collider, owner ring, selected panel side, serta selected/preview range membaca center yang sama. `positionSprite()` dipakai bersama oleh ghost dan final tower, menghitung sprite top-left dari canonical center dan anchor calibration existing. Owner ring tidak lagi menulis ulang posisi canonical setiap frame dari sprite center.

Selected range native event menghitung top-left dari `FootprintX/Y - AttackRange`. Preview range memakai `preview.x/y - AttackRange`. Width/height tetap `AttackRange * 2`. Stroke luar SVG range dikoreksi dari radius source 298 ke 298,5 dengan stroke 3 px, sehingga outer edge mencapai radius canvas 300 px secara tepat. Statistik AttackRange tidak berubah.

Origin, automatic center, FirePoint custom points, collision masks, source PNG, dan 21 canvas Archer 512x512 diperiksa dan dipertahankan. Tidak perlu menggeser origin atau menambah custom point baru: `AnchorX/Y` yang sudah dikalibrasi pada base pixel sudah tepat, dan render transform diuji terhadap canonical center untuk empat tower. Kamera tidak dipakai untuk memperbaiki alignment.

## Fitur yang dipulihkan/dipertahankan

- Celestial Void dan road rounded tetap memakai instance/waypoint existing.
- Free placement, medium radii Basic 32 / Heavy 40 / Advanced 34 / Archer 36, dan satu circle definition untuk visual + collider obstacle.
- Semua solid props, Spawn/Base, tower lain, jalan, UI, serta seluruh footprint terhadap batas map diperiksa sebelum create/charge.
- Single placement dan cleanup setelah sukses; invalid tetap builder aktif; ESC/right-click membatalkan.
- Normal deselected menyembunyikan circle; Building menampilkan semua build circles; Selected hanya menampilkan footprint owner dan range.
- Panel tetap di sisi berlawanan dari posisi tower dalam gameplay viewport, tidak mengubah world/camera.
- UID, DamageDealt, cross-path Lv1/Lv2, upgrade, sell, Gold deduction, +100 wave reward, dan Manual/Auto/1x/2x dipertahankan.

Range tetap satu object selected indicator; build preview range memakai object terpisah yang sudah tersedia. Footprint/blocker rings memakai owner maps existing. Tidak menambah object indicator, layer, resource, atau sistem gameplay baru. Audit menemukan satu handler create/payment placement; posisi selected range ditulis oleh satu event, dan preview range oleh satu render handler. Tidak ditemukan duplikasi event yang menyebabkan charge/placement ganda.

## File/event yang diubah

- `layouts/game-scene.json`: recovery JS roots 1/6/9/17, canonical selected range pada root 12, normalisasi string pada root 13, dan pemulihan Radius di TowerFootprints. UUID/order struktur lain tetap dipertahankan.
- `tools/free-placement-runtime.js`: canonical getter dan helper posisi sprite bersama.
- `tools/free-placement-click.js`: memakai helper yang sama saat create.
- `tools/free-placement-rings.js`: preview range memakai canonical center; owner ring tidak menimpa pusat.
- `assets/celestial_void/range.svg`: outer edge sesuai radius canvas.
- `tools/test-canonical-centers.js`, laporan/screenshot audit, serta dokumen ini.

Source `tools/selected-panel-runtime.js` tetap menjadi implementasi panel terakhir yang diuji dan di-embed untuk memulihkan file scene. Jalankan `python tools/embed-free-placement.py` setelah mengedit source JS; helper itu mempertahankan event native selected range yang sudah diperbaiki.

## Pengujian yang dilakukan

Native GDevelop 5.6.283 dapat membaca, compile, dan export project: 0 diagnostics. Preview export dijalankan di Chrome, dengan fixture runtime otomatis dan input mouse native melalui CDP.

| Pemeriksaan | Lulus |
|---|---:|
| Struktur/resource/animation/origin/custom point/mask | 70 |
| Canonical centers semua tower dan 21 state Archer | 60 |
| Collision medium dan panel dinamis | 80 |
| Render base alignment dan visibility | 84 |
| Single placement/cancel/fixed camera | 127 |
| Seluruh 50 wave, spawn/combat/reward | 419 |
| Archer integration/upgrades/projectiles/sell | 170 |
| Cross-path | 143 |
| Manual/Auto/1x/2x | 64 |
| Mouse native, panel switch, upgrade, dan viewport resize | 20 |

Resize native diuji pada 1280x800, 960x540, dan 800x480: selected range dan footprint tetap mengambil canonical world center yang sama. Upgrade Eagle Eye memperbesar radius sesuai statistik dengan pusat tetap; UID dan DamageDealt tidak reset. Sell dan empty selection menghilangkan indicator yang relevan. Semua JSON/resource paths, image/texture refs, layer/group refs, SVG XML, dan 21 state Archer valid.

Laporan dan screenshot tersimpan di `design_previews/full_project_audit/`. Gold tambahan pada screenshot hanya fixture test; starting Money tetap 650. Pengujian 50 wave mempercepat antrean fixture untuk correctness. Playthrough strategi panjang dan penilaian rasa kesulitan manusia belum dilakukan. Saat mencoba ulang di editor, gunakan project disk terbaru agar Save dari tab versi lama tidak menimpa recovery ini lagi.
