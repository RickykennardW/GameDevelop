# Supernova Lance — 3 piercing hits + Nova explosions

Gold awal scene sekarang **50.000** (`Money`), sebelumnya 10.000. Nilai ini hanya nilai awal; placement, upgrade, reward dan sell tetap menggunakan ekonomi existing. Preview baru benar-benar menampilkan 50000 pada HUD tanpa override fixture. Placement 300 menghasilkan 49700; upgrade Path 1 hingga Lv5 menghasilkan 38340 dengan biaya existing.

## Mekanik aktif

- **Setiap tembakan keempat** pada 5-0, 5-1 dan 5-2 menjadi Lance. Tembakan normal, attack interval, target tracking tower dan crosspath modifier dipertahankan.
- Lance bergerak lurus tanpa homing ulang, mengenai maksimal **3 direct target unik**. Sesudah hit pertama/kedua, projectile tetap berjalan. Sesudah hit ketiga, projectile berhenti dan dihapus. Range/lifetime existing tetap menjadi batas jika hanya ada 0–2 target.
- Setiap direct hit yang benar-benar terjadi menghasilkan satu Nova explosion di pusat monster yang terkena: maksimal **3 explosion**, tanpa menunggu VFX sebelumnya selesai.
- Radius memakai **`StarCannonConfig.Nova.SplashRadius = 76`**, diameter VFX **152 px**, multiplier damage spesial **1,75**, splash ratio **0,25**. Tidak ada perubahan multiplier, harga, attack speed atau radius.
- Primary target dikecualikan dari AoE impact miliknya. Target yang sudah ditembus juga tidak diberi splash dari impact berikutnya. Setiap projectile mempunyai `__starHitTargets` dan `__starAoETargets`, memakai unique enemy IDs; satu monster hanya menerima satu aplikasi splash per Lance, termasuk pada ledakan yang overlap.
- Monster yang menerima splash lebih awal lalu benar-benar dilewati masih dapat menerima satu direct hit. Dua jenis hit tersebut dicatat terpisah; tidak ada refund damage atau perhitungan armor kedua di luar `star.deal`/Health existing.
- Direct hit dan penerima splash mewarisi **Armor Fracture 20% base armor selama 3 detik**. Refresh tetap memakai satu record/ikon per enemy. Posisi ikon tetap di atas tengah HP bar.
- Candidate yang mati akibat splash sebelumnya pada sweep frame yang sama dilewati: tidak dihitung sebagai direct hit dan tidak memunculkan phantom explosion.
- Ledger dibuat ulang saat projectile native/pool dipakai. Ledger hanya menyimpan IDs, bukan referensi enemy. Projectile, VFX dan status cleanup tetap memakai lifecycle existing.

## Perubahan file, object, event dan asset

- **`layouts/game-scene.json`**: `Money=50000`, `StarCannonConfig.Lance.MaxTargets=3`, deskripsi upgrade Supernova Cannon sesuai mekanik baru, dan embedding source Star Cannon terbaru.
- **`tools/star-cannon-runtime.js`**: `star.fire` memberi Lance splash radius/ratio yang sama dengan Nova; helper `star.explode` memakai satu logic splash/VFX bersama Lv3/4/5; loop Lance mencatat direct/splash, meledak per impact, melewati candidate mati dan berhenti pada hit ketiga. Event yang di-embed adalah `events[10]` grup **Tower Defense**, child `events[5]` (`JsCode`).
- **`tools/build-nova-spike.py`**: default builder menjadi cap 3 dan deskripsi baru; rebuild tetap mempertahankan live centralized config, termasuk radius 76.
- **`tools/test-nova-spike.js`**: expected Lance 3 target/3 explosion/one splash per enemy.
- **`tools/star-cannon-vfx-qa.js`**: expected fresh Gold 50000 dan saldo pembelian/upgrade baru; pemeriksaan Nova Lv3/4 dan status tetap dipertahankan.
- **`tools/supernova-lance-qa.js`**: fixture khusus 1/2/3/4/5 target, cluster, armor/status, counter/crosspath, candidate mati, pooling dan cleanup.
- **`PROJECT_GUIDE.md`, `NOVA_SPIKE_REPORT.md`, `STAR_CANNON_VFX_STATUS_REPORT.md`**: nilai dan rujukan dokumentasi diselaraskan. Hasil/screenshot ada di `validation/`.

Object existing **`StarCannonProjectile`**, **`StarCannonImpact`**, **`Enemy`**, dan registry status tetap digunakan; tidak ada object/resource baru atau rename. Artwork Lance dan **`assets/effects/star_cannon/StarCannon_VFX_NovaExplosion.png`** digunakan kembali tanpa modifikasi. Resource definitions dan seluruh asset byte-identik dengan sebelum task ini.

## Pengujian yang dijalankan

- Native GDevelop parser, scene compile dan export berhasil: **0 scene diagnostics**. Export helper menyertakan extension Health existing. Warning versi/include toolchain lokal tetap ada; editor desktop tidak dioperasikan manual.
- **426 pemeriksaan Supernova Lance** lulus di preview native Chrome **1920×1080**, **0 console error**. Pembelian/upgrade melalui UI, 1/2/3 real impacts, 4–5 line targets, continued movement, stop at third, radius boundary, cluster dedup, damage/armor, Fracture refresh/expiry, status row, 5-0/5-1/5-2, changed target counter, pure Path 2, same-frame splash-killed candidate, vanished original target, pooling dan cleanup semuanya diuji.
- **179 pemeriksaan Nova VFX/status** kembali lulus: Lv3/Lv4, radius 76, delapan cropped frames, diameter 152, damage sekali, expiry/refresh dan status pada keenam archetype.
- Regresi native **731 Nova Spike**, **552 Void Golem**, dan **354 placement/UI/sell/obstacle/Index** lulus, **0 exception**.
- Validator JSON/resources/native source lulus; **397 resources**, **65 objects**, **157 authored instances**, tanpa missing references atau backup.
- Scope hash di `validation/supernova-lance-scope.json` memastikan scene data di luar Gold/cap/deskripsi yang diotorisasi tetap sama: instance, layer, map, config monster/wave/HP bar/camera/placement, biaya dan balancing lain. Resource list, statistik Star Cannon serta fungsi Fracture/armor/direct damage/target validation byte-identik. File ini hanya menyimpan hashes/counts, bukan salinan source.
- Screenshot **`validation/Supernova_Triple_Explosion_Preview.png`** diperiksa: tiga impact animation dapat hidup bersamaan, tetap memakai small AoE dan status/HP terbaca. Saldo screenshot 38340 merupakan hasil pembelian/upgrade sebenarnya dari Gold awal 50000.

Tidak ada benchmark performa panjang atau playthrough manual penuh 45 wave. VFX memakai delapan texture cache yang sama, durasi 0,64 detik, maksimal tiga ledakan per Lance; tidak ada animasi/partikel yang menghitung damage. Tidak ada backup, duplikasi source project, asset baru atau perubahan Git history.
