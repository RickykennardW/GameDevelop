# Star Cannon — UI presentation fix

Build/shop kini memakai portrait 3/4 Nova Spike yang dibuat khusus untuk UI. Kotak upgrade memakai ikon simbolis, dengan badge damage/speed pada nama path. Tidak ada perubahan gameplay atau balancing dan tidak ada backup yang dibuat.

## Asset dan object

Semua asset baru berada di **`assets/ui/star_cannon/`** dan diregistrasikan memakai relative resource identifiers yang sama dengan path file.

| File | Pemakaian |
|---|---|
| `StarCannon_UI_Portrait.png` | `TileType_Button`, portrait build/shop |
| `Path_StellarDestruction.svg` | Badge damage tetap pada Path 1 |
| `Path_CelestialBarrage.svg` | Badge speed/gear tetap pada Path 2 |
| `StarCompression.svg` | Compression / power dipadatkan |
| `DenseStellarCore.svg` | Dense faceted core |
| `NovaImpact.svg` | Nova explosion burst |
| `Starbreaker.svg` | Cracked shield / armor fracture |
| `SupernovaCannon.svg` | Piercing lance |
| `AstralAccelerator.svg` | Accelerator gear |
| `RapidStarflow.svg` | Rapid flow / motion chevrons |
| `TwinStarMuzzle.svg` | Twin muzzle / dual shot |
| `CosmicRhythm.svg` | Pulse ring / lima node |
| `CelestialOverdrive.svg` | Dual overclock / energy surge |

Portrait PNG RGBA **1254×1254** mempunyai alpha asli; komposisi 3/4 satu laras berdasarkan Nova Spike, bukan crop blueprint. Diproduksi menggunakan **built-in image_gen**. Prompt final dan metode ada di `tools/star-cannon-ui-art.json`.

Dua belas ikon SVG original dibuat sebagai simbol vector native melalui `tools/build-star-cannon-ui.py`, mengikuti asset UI SVG existing: gold, ice blue, violet dan white highlights, stroke tegas, transparan, tanpa miniatur tower. Ukuran sumber 128×128; memakai bentuk yang berbeda untuk tiap upgrade.

Object yang diperbarui hanya **`TileType_Button`** dan **`StarUpgradeIcon`**. Sepuluh animation identifier upgrade existing tetap dipertahankan; ditambah `PathDamage` dan `PathSpeed`. Tidak ada rename object, object gameplay baru, atau asset gameplay lama yang dihapus. Karena Index memakai `StarUpgradeIcon` bersama, sepuluh ikon simbolis juga tampil di sana; layout Index tetap sama.

Card shop tetap **84×112** pada slot kiri atas dengan harga **300 Gold**. Portrait memakai canvas 64 px, center yang disesuaikan agar tidak menyentuh judul/harga. Upgrade memakai ikon utama 72 px dan badge path 24 px; nama path, progress, nama upgrade, deskripsi, harga dan hit area existing dipertahankan.

## File yang diubah / ditambahkan

- `Tower Defense.json`: registrasi **13** resource UI baru; 394 resource lama tetap ada.
- `layouts/game-scene.json`: referensi image kedua object UI dan embedding dua source UI; seluruh 59 scene variables tetap identik.
- `tools/responsive-map-runtime.js`: fit dan posisi portrait shop; tidak mengubah ukuran card, scroll, Play, Index atau purchase logic.
- `tools/selected-panel-runtime.js`: badge path, posisi judul path, ukuran/posisi simbol utama dan opacity locked.
- `tools/build-nova-spike.py`: hook agar build artwork ulang mempertahankan UI portrait/icon ini.
- Baru: `tools/build-star-cannon-ui.py`, `tools/star-cannon-ui-art.json`, `tools/star-cannon-ui-qa.js`, 13 asset di atas dan laporan ini.
- `PROJECT_GUIDE.md`: petunjuk pemeliharaan UI.
- `validation/`: screenshot, scope audit, hasil UI QA dan hasil regresi terbaru. Tidak berisi salinan source project.

`TilePlacement_Indicator`, seluruh 27 state world, modular atlas, projectile, VFX, `SelectedTowerPreview` dan `IndexTowerImage` tetap menggunakan asset gameplay yang sama. Preview tower di bagian atas detail panel masih menunjukkan state aktual; kedua **kotak upgrade** menggunakan simbol.

## Validasi yang dijalankan

- JSON/resource/reference/source validation: **lulus**. Total 407 resources: 382 image dan 25 audio; tetap 65 object definitions, 157 authored instances, 59 scene variables, dan 24 runtime sources.
- Parser dan compile scene/extension native GDevelop: **0 scene diagnostics**, export preview berhasil. Toolchain lokal masih mengeluarkan warning versi libGD/include bawaan; helper memasang bundle Health yang diperlukan dan runtime preview berjalan.
- UI QA native Chrome: **112 checks** pada masing-masing **1920×1080**, **1280×720**, **960×640**, tanpa console error. Termasuk resource simbol, semua tingkat upgrade, alignment badge/progress/icon/teks/harga, build lewat shop dan klik upgrade kedua path.
- Regresi native `test-clean-project`: **354 checks lulus**, mencakup seluruh pembelian upgrade, locking, placement, seleksi, sell/refund, obstacle dan camera.
- Regresi native `test-nova-spike`: **731 checks lulus**, termasuk 27 state, aiming, muzzle/recoil, special projectiles, armor interaction dan cleanup.
- Audit terhadap Git HEAD mengonfirmasi **seluruh scene variable/config gameplay identik**, semua instance/layer tetap, semua resource lama dipertahankan, dan source gameplay serta asset top-down byte-identik. Hanya dua inline event UI yang berubah. Bukti: `validation/star-ui-scope-check.json`.

Preview native diperiksa secara visual. Screenshot: **`validation/StarCannon_UI_Selected.png`**, **`validation/StarCannon_UI_960.png`**, **`validation/StarCannon_UI_Index.png`**. Hasil detail: `validation/star-ui-qa*.json` dan hasil dua suite native.

Pengujian dilakukan pada runtime GDevelop hasil export dengan fixture native terkontrol, bukan melalui pengoperasian manual editor desktop. Tidak dilakukan playthrough penuh 45 wave karena perubahan hanya presentasi UI. **Tidak ada backup, duplicate project, atau perubahan Git history.**
