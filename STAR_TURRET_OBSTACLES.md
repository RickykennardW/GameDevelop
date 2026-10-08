# Star Cannon Turret, Selection & Clear Obstacle — 2026-10-09

Implementasi selesai pada project folder GDevelop `Tower Defense.json` / `layouts/game-scene.json`, sebelum permintaan Nova Wisp berikutnya.

## Asset dan backup

- 21 PNG Base + 21 PNG Turret, seluruh kombinasi valid 0–4 kecuali kedua path >=3.
- File baru: `assets/star_cannon/components/StarCannon_Base_A_B.png` dan `StarCannon_Turret_A_B.png`.
- Seluruh PNG RGBA transparan, 1254 × 1254. Total 37,723,763 bytes.
- Original `Star_Cannon_A_B.png` tetap utuh dan tetap dipakai untuk ikon/Index/preview upgrade.
- Backup sebelum pengerjaan: `backups/pre_star_turret_obstacles_20261009.zip` (208 file). Hash semua asset original dibandingkan dengan backup dan sama.
- `generation-prompts.json`, `component-metadata.json`, `calibration.json`, `manifest.json` mencatat prompt, pivot/socket/muzzle/silhouette dan SHA256.
- Raster dibuat dengan imagegen berdasarkan masing-masing original; komponen belakang turret ditutup, dua muzzle state twin dan tiga muzzle state meteor dipertahankan. Dua sprite triple yang dekat tepi diperbaiki. Pengukuran alpha hanya membaca gambar; original tidak diedit.

## Owner, anchor dan rotasi

`StarCannonTower` tetap owner logical/stats/ID yang sama dan tetap anggota PlaceableTile. Opacity visual owner = 0; dua native Sprite baru `StarCannonBaseVisual` dan `StarCannonTurretVisual` menggambar komponen. Keduanya punya 21 animation state dan OwnerTowerId; callback lifetime membersihkannya saat Sell/delete/recycling.

FootprintX/Y tetap TowerAnchor. BaseContact tepat pada anchor, range tetap pada anchor. Base selalu angle 0. TurretPivot = socket Base yang dikalibrasi, berbeda dari bounding-box center. Metadata per state menyesuaikan draw scale/pivot agar komposit mendekati original. Coupling kecil ivory/gold/violet pada native turret menghubungkan closed rear ke socket pada semua arah; mengikuti owner lifecycle.

Turret memilih enemy hidup terdekat dalam range existing, lalu mempertahankan target ID selama valid. Target mati/keluar range memicu pencarian ulang; tanpa target, arah terakhir dipertahankan. Shortest-angle rotation = 240° per game-second (dt mengikuti speed existing). Tembakan hanya jika error <=8°; rest direction dikalibrasi sekitar -24°/-29°/-30°, bukan asumsi 0°.

World MuzzlePoint memakai matrix pivot + rotasi local offset + draw scale yang sama dengan renderer dan selection. Flash dan projectile berasal dari aperture masing-masing emitter. Native test membandingkan koordinat PIXI yang benar-benar dirender dengan world MuzzlePoint. Target yang sudah menyentuh/berada di belakang muzzle diselesaikan sebagai contact hit setelah frame muzzle terlihat, sehingga projectile tidak bergerak mundur; damage tetap satu kali.

Twin: dua ×65%; Meteor: tiga ×60%. Semua harga, damage, interval, range, speed, splash 40%/65%, radius 70/98, crosspath limit dan refund existing dipertahankan.

## Selection lima tower

SelectionGeometry berisi silhouette convex dari alpha frame aktif, padding nyaman 3 world pixels. Basic/Heavy/Advanced/Archer mengikuti transform visual dan animation aktif; Star memakai gabungan Base dan Turret yang berputar. Placement circle, selection silhouette, attack range adalah tiga geometri terpisah. Klik laras/Base memilih owner yang sama; area kosong luar footprint tidak memilih otomatis. Tower mendapat prioritas di atas obstacle; UI dikonsumsi sebelum map/build.

## Clear Obstacle

Harga 250 gold per owner. Klik normal membuka panel bertema Celestial Void, dengan CLEAR, CANCEL, X; ESC, Index dan pemilihan Builder menutup panel. Confirm memakai press/release pada owner ID yang sama dan memeriksa saldo terakhir. Saldo <250 mempertahankan obstacle dan menampilkan insufficient gold. Setelah sukses owner/selection ditutup sehingga klik kedua tidak menagih lagi.

Klasifikasi hanya Ground_Decoration solid yang seluruh lingkaran blockernya berada minimal 8 world px di dalam inner surface. 12 removable: 4 Crystal, 5 Rock, 3 Ruin. Crystal atas dekat batas pulau dan tujuh Shrub tetap permanent/nonblocking. Tebing, perimeter, background, Spawn, Base, Monster_Path dan ground tidak removable.

| Kind | Center world X,Y | LocalScale |
|---|---|---|
| Crystal | 468.16, 352.00 | 1 |
| Rock | 594.88, 352.00 | 1 |
| Ruin | 1038.40, 352.00 | 1 |
| Crystal | 1228.48, 616.00 | 1 |
| Rock | 1101.76, 616.00 | 1 |
| Ruin | 563.20, 616.00 | 1 |
| Crystal | 642.40, 880.00 | 1 |
| Rock | 769.12, 880.00 | 1 |
| Ruin | 1228.48, 880.00 | 1 |
| Rock | 420.64, 392.00 | 0.42 |
| Crystal | 1276.00, 658.00 | 0.46 |
| Rock | 1180.96, 924.00 | 0.43 |

ObstacleId = native unique ID. CLEAR menghapus satu visual owner, ring map keyed by ID, dan melakukan refresh blocker list; shadow dibuat ulang dari prop yang masih hidup pada frame berikutnya. Blocker owner lain, overlap, road polygons dan tower footprints tetap berlaku. Scene/camera/wave/route tidak direstart.

## File

Diubah: `Tower Defense.json` (42 resources), `layouts/game-scene.json` (dua visual definitions, metadata variables, ObstacleUI layer, scoped event additions/guards), `tools/star-cannon-runtime.js`, `tools/island-render-runtime.js`, `tools/free-placement-runtime.js`, `tools/embed-free-placement.py`.

Baru: `tools/star-visual-runtime.js`, `world-selection-runtime.js`, `obstacle-panel-runtime.js`, `integrate-star-turret-obstacles.py`, `measure-star-components.py`, tiga test source, 42 PNG dan metadata, gallery/screenshot/report dalam `design_previews/star_cannon`.

## Pengujian benar-benar dilakukan

- Native GDevelop 5.6.283 parser/compiler: 0 diagnostics; Pixi preview export true.
- 291 checks fitur baru: semua 21 upgrades melalui panel, stats, angle limit/2x/lock/switch/no-idle, mouth/flash, close contact, damage/splash, cleanup, lima tower selection, 12 props classification, saldo/Cancel/X/ESC/Index/doubleclick, clear/build/overlap, priority/UI-consumption.
- 22 input-native/CDP checks: pembelian dan upgrade 2-4, sprite-rendered mouth matrix, triple volley, range exit, rotated barrel selection, Sell, obstacle Clear, panel 800/FHD/QHD, camera/route tetap.
- Dua checks + inspeksi screenshot enam arah untuk single/triple gun.
- Regresi existing: 170 Archer, 419 full-map 50 wave, 64 wave-speed checks PASS. Fixture Archer memakai builder stop normal; fixture build memakai harga katalog terbaru, bukan harga Basic versi lama.
- 645 static checks: semua asset original dan object definitions/scene variables existing sama dengan backup; native gameplay di luar scoped change tetap sama, resource/object groups resolve, seluruh PNG benar-benar transparan.

Tidak ada klaim pengujian editor interaktif Windows: validasi buka/compile dilakukan memakai parser/compiler native GDevelop dan game dijalankan dari hasil export browser. Screenshot/gallery menunjukkan hasil actual runtime; bitmap perspective 3/4 diputar secara 2D sesuai arah targeting.
