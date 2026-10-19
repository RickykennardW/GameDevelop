# Star Cannon — Nova VFX, Armor Fracture dan status monster

Pada tahap VFX awal, scene variable `Money` dinaikkan dari 650 menjadi 10000. Nilai aktif kini **50.000**, sesuai permintaan berikutnya; lihat `SUPERNOVA_LANCE_REPORT.md`. Tidak ada event yang mengisi ulang Gold setiap frame. Pembelian, upgrade dan reward tetap berjalan normal.

## Asset / resource

- **`assets/effects/star_cannon/StarCannon_VFX_NovaExplosion.png`**: atlas RGBA original, 1774×887, delapan frame. Fase flash, shockwave/burst, energy bloom, partikel dan dissipation. Dibuat memakai **built-in image_gen**, kemudian disempurnakan untuk sprite importing. Prompt final ada di `tools/star-cannon-vfx-art.json`.
- **`assets/effects/star_cannon/Debuff_ArmorFracture_Icon.svg`**: ikon tameng retak khusus, transparan, gold/putih/blue-violet, source 128×128, display 18 world px. Dibuat sebagai vector native agar garis tetap jelas pada ukuran kecil.
- Dua resource baru menggantikan **12 frame SVG generik** `Explosion_0..5.svg` dan `FractureIcon_0..5.svg` yang sudah tidak direferensikan. Frame gameplay/projectile/tower dan artwork UI sebelumnya tetap dipertahankan.

Tidak ada object baru atau rename. Object **`StarCannonImpact`** mempertahankan animation identity `Explosion` dan `FractureIcon`. `VoidFortificationVFX` tetap menggunakan artwork yang sama.

## Implementasi

Nova explosion muncul pada titik impact tembakan Nova khusus yang sudah ada. Atlas dipotong menjadi texture frame di GPU dan di-cache per scene; tidak ada delapan salinan atlas atau source project. Delapan frame berjalan selama **0,64 detik**, memakai ukuran visual yang diturunkan dari radius existing. Opacity turun pada fase akhir, dan object dihapus setelah selesai. Z-order efek tetap di bawah HP bar/status.

Counter shot, 175% damage, splash 25%, target exclusion, armor dan damage accounting tidak diubah. Radius Nova kini **76 world px**, naik dari 64 (+18,75%) sesuai permintaan penyesuaian small AoE. Diameter VFX otomatis mengikuti radius: **152 px**, sebelumnya 128; `SizeMultiplier` tetap 1. Satu nilai `StarCannonConfig.Nova.SplashRadius` mengatur projectile damage area dan ukuran visual, tanpa perubahan event/runtime. Animasi tidak mempunyai callback damage. Tembakan biasa tidak memunculkan explosion Nova. Recycled normal VFX kembali ke texture native yang benar.

Armor Fracture tetap memakai **20% base armor selama 3 detik**, refresh tanpa stack. Satu record enemy memiliki satu ikon; refresh mempertahankan icon yang sama. Ikon hilang saat expiry, death/deletion, atau scene unload. Flash stabilisasi singkat saat expiry muncul pada posisi ikon terakhir.

**`scene.__enemyStatusIcons`** mengatur posisi semua status aktif di project: Fortification dan Armor Fracture. Status owner tetap mengendalikan durasi dan object cleanup; registry hanya menyusun tampilan:

- Center grup mengikuti center **HP track**, bukan ujung kanan/fill HP.
- Baris horizontal berada **3 world px di atas HP bar**, dengan spacing 3 px.
- Jumlah/ukuran ikon menentukan lebar grup; grup tetap centered saat status ditambah atau berakhir.
- Buff/debuff common dan elite mengikuti aturan yang sama, termasuk Void Golem.
- HP bar tidak dipindah atau diubah ukurannya.
- Registry memeriksa lifetime ID, owner, object presence dan cleanup saat enemy/scene dihapus.

Status baru dapat memakai `scene.__enemyStatusIcons.set(enemy, key, icon, size, order)` dan `remove(enemy, key, lifetimeId)` agar mengikuti layout yang sama. Registry tidak memodifikasi stats, movement atau input.

## File yang diubah / dibuat pada task ini

- `Tower Defense.json`: registrasi resource VFX baru dan penghapusan entri generik yang diganti.
- `layouts/game-scene.json`: Gold awal, dua konfigurasi visual baru, dua animation resource di `StarCannonImpact`, dan embedding source.
- `tools/star-cannon-runtime.js`: renderer delapan frame Nova, ikon fracture baru dan koneksi ke layout status; hit/damage code tetap.
- `tools/enemy-healthbar-runtime.js`: registry/layout status; seluruh kode pengukuran/posisi HP bar existing tetap identik.
- `tools/void-golem-runtime.js`: register/remove buff icon dalam status row; buff/casting/armor logic tetap.
- `tools/island-render-runtime.js`: satu panggilan layout status setelah seluruh owner selesai merender.
- `tools/build-nova-spike.py`: mempertahankan VFX baru saat artwork direbuild.
- Baru: `tools/build-star-cannon-vfx.py`, `tools/star-cannon-vfx-art.json`, `tools/star-cannon-vfx-qa.js`, dua asset di atas dan laporan ini.
- `tools/test-nova-spike.js` dan `tools/test-void-golem.js`: expected position disesuaikan ke atas tengah HP bar.
- `PROJECT_GUIDE.md`: dokumentasi konfigurasi/API.
- `validation/`: hasil, hash/scope audit dan screenshot terbaru.

Perubahan UI shop/upgrade dari task sebelumnya dipertahankan. Tidak ada backup, source project copy, backup asset atau perubahan Git history.

## Validasi yang benar-benar dijalankan

- Parser/compile/export native GDevelop berhasil, **0 scene diagnostics**. Preview menjalankan runtime GDevelop yang terpasang di Chrome headless terisolasi. Warning versi/include toolchain lokal tetap ditangani helper Health existing.
- **175 pemeriksaan VFX/status** lulus pada **1920×1080** dan **960×640**, tanpa console error. Termasuk delapan cropped frame, impact position, damage hanya sekali, normal shots tanpa explosion, expiry/refresh, enam archetype, movement, centered row dua ikon dan recenter ke satu ikon, death/deletion, native button purchases dan harga upgrade.
- Fresh preview terpisah benar-benar menampilkan **10000 Gold** pada HUD tanpa fixture override. Setelah placement menjadi 9700 dan setelah upgrade berkurang sesuai biaya.
- Native regression: **731 Nova Spike**, **552 Void Golem**, **184 HP bar**, **354 placement/UI/sell**, **7486 Gold-Budget wave checks** lulus. Wave reward/budget tidak berubah.
- Scope audit memverifikasi hash Star stats/component config, EnemyTypes, Void Golem config, HP bar geometry, TowerFootprints, wave/pacing, waypoint, seluruh instance dan layer tetap sama. Kode shot, targeting, upgrade, direct damage dan projectile/AoE loop juga identik. Bukti: `validation/star-vfx-scope-check.json`.
- Resource/reference/JSON validator lulus; 397 resources (372 image, 25 audio), 65 object definitions, 157 authored instances, 61 scene variables, 24 runtime sources. Tidak ada missing resource atau file backup.

Screenshot: **`validation/Preview_Initial_10000_Gold.png`**, **`validation/StarCannon_Nova_Status_Preview.png`**, **`validation/StarCannon_Nova_Status_960.png`**. Hasil detail: `validation/star-vfx-qa*.json` dan `validation/star-vfx-initial.json`.

Pengujian menggunakan fixture native terkontrol; tidak dilakukan playthrough manual penuh 45 wave atau pengoperasian manual editor GDevelop. Tidak ada klaim pengujian platform lain.

## Penyesuaian small AoE — 18 Oktober 2026

Perubahan data game pada tahap ini hanya `layouts/game-scene.json` → `StarCannonConfig.Nova.SplashRadius`: **64 → 76 (+18,75%)**. Perbandingan struktur JSON sebelum/sesudah memastikan hanya satu nilai tersebut berubah. Runtime existing meneruskan radius ke projectile dan memakai `radius * 2` untuk VFX, sehingga diameter otomatis **128 → 152**; tidak perlu mengubah event, source runtime, asset, damage atau frekuensi. Builder artwork mempertahankan live config ini saat rebuild. Starbreaker mengikuti small AoE baru; Lance Supernova tetap memakai logic lurus existing.

`tools/star-cannon-vfx-qa.js` diperluas untuk menguji batas area aktual. **179 pemeriksaan native pada 1920×1080 lulus, tanpa console error**: upgrade melalui UI ke Lv3, tembakan 1–3 tetap normal, tembakan keempat mengenai musuh pada jarak 70 dan 76 px, sementara 77 px tidak terkena. Seluruh delapan frame mempunyai diameter render 152 px, damage tidak berulang, VFX selesai/dihapus, Starbreaker memakai radius yang sama dan status tetap di atas HP. Screenshot terbaru di `validation/StarCannon_Nova_Status_Preview.png` telah diperiksa secara visual; efek tetap lokal pada satu lane dan HP/status terbaca.

Suite regresi **731 Nova Spike** kembali lulus, tanpa exception, termasuk damage, upgrade locking, Fracture, Supernova Lance dan cleanup. Native parser/compile/export berhasil dengan **0 scene diagnostics**; validator JSON/resource lulus **5398 pemeriksaan**, tanpa missing resource/file backup. Hasil radius/diameter terbaru ada di `validation/star-vfx-qa.json`; screenshot/hasil 960 px di atas berasal dari tahap VFX awal. Tidak dilakukan benchmark performa panjang; jumlah object, frame, texture dan durasi animasi tidak ditambah. Tidak ada backup dibuat.
