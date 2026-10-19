# Star Cannon Nova Spike â€” implementation report

Implementasi langsung pada `Tower Defense.json` dan `layouts/game-scene.json` selesai. Nama object dan tower tetap Star Cannon. Tidak ada backup, salinan project sumber, branch baru, atau perubahan Git history.

## Visual dan asset

- **27/27 state unik**: 9 early/crosspath, 9 Stellar Destruction, 9 Celestial Barrage. Perbedaan berupa housing, barrel, compression core dan accelerator yang berbeda secara fisik, bukan recolor.
- **11 atlas PNG RGBA original** diproduksi dengan built-in **image_gen**, memakai blueprint pengguna sebagai art direction. Artwork tidak dipotong dari blueprint. Satu koreksi image_gen mengganti unit barrel Rhythm yang semula tergambar ganda menjadi unit tunggal.
- Native renderer menyusun stationary base, rotating chassis, barrel independen dan energy core. Komponen dapat dibagikan, tetapi 27 hasil komposit berbeda. Atlas dipakai langsung oleh renderer, sedangkan 27 PNG komposit dipakai oleh editor, shop, placement ghost, Index dan Selected Panel.
- **11 keluarga projectile Ã— 3 frame = 33 SVG**: Base, Compressed, Dense, Nova, Fractured, Lance, Accelerated, Starflow, Twin, Rhythm, Overdrive. SVG memperluas visual energy yang sudah berbasis vector; frame mengubah pulse, core dan trail. Crosspath menambahkan accelerator conduit atau compression collar pada projectile utama.
- **8 VFX Ã— 6 frame = 48 SVG**: Base, Explosion, Fracture, Pierce, Dissipate, Surge, Stabilize, FractureIcon. Native runtime mengatur progression dan cleanup; damage tidak berasal dari partikel atau frame animasi.
- **119 resource final** tersimpan di `assets/towers/star_cannon/nova_spike/`: `atlases/` (11), `states/` (27), `projectiles/` (33), `vfx/` (48). Sepuluh upgrade icon menggunakan komposit final yang sama, tanpa duplikasi file icon.
- **81 resource Star Cannon lama** dihapus setelah seluruh referensi scene diganti. Daftar lengkap, path dan ukuran ada di `validation/nova-spike-assets.json`. File/resource di luar Star Cannon dipertahankan.
- Ukuran artwork final sekitar **20,81 MiB**, menggantikan sekitar **59,45 MiB** asset Star lama. Pengurangan asset sekitar **38,64 MiB**; ukuran ini tidak menghitung screenshot/laporan validasi.

Prompt produksi: `tools/nova-spike-prompts.json`. Assembly dan pembaruan frame: `tools/build-nova-spike.py`. Build artwork ulang mempertahankan balancing Nova Spike yang sudah tersimpan pada konfigurasi aktif.

Preview seluruh state pada skala yang sama: **`validation/Nova_Spike_27_States.png`**. Screenshot native: `Nova_Selected.png`, `Nova_Combat.png`, `Nova_Index.png`, `Nova_Responsive.png` di `validation/`.

## Footprint, aiming dan animasi

- Logical tower tetap **64Ã—64**, radius placement/collision tetap **46 px**. `FootprintX/Y` dan investment tidak berubah saat upgrade. Anchor komponen baru konsisten di pusat `.5,.5`.
- Rotating part rectangle terjauh berada pada radius **44,284 px**, di dalam envelope 46 px. Base tetap diam; ukuran fisik tidak bertambah pada level tinggi.
- Aiming memakai target lock existing, shortest-angle rotation **240 derajat/detik**, shared center pivot dan toleransi tembak existing. Target yang keluar range/mati dilepas; meriam mempertahankan arah ketika tidak ada target.
- Idle core pulse, charge menuju muzzle, special charge, muzzle flash, local recoil dan recovery berjalan terpisah dari damage. Durasi recoil/charge mengikuti attack interval. Twin mempunyai dua barrel yang recoil secara independen.
- Crop atlas di-cache per scene. Satu tower hanya memiliki rig state aktif. Sell/unload membersihkan owner rig, native component objects dan debuff; unload melepas cropped textures tanpa menghancurkan shared atlas image manager.
- State sementara dibersihkan saat GDevelop memakai ulang pooled object. Timer Overdrive, muzzle sequence, recoil dan flag VFX tidak diwariskan dari tower/effect yang sudah dihapus.

## Balancing terpusat

Sumber runtime adalah scene variable **`StarCannonConfig`**. Tidak ada rumus bonus incremental saat upgrade/asset berganti.

| Parameter | Nilai |
|---|---|
| Base damage / interval / range / projectile speed | 50 / 0,9 s / 210 / 520, dipertahankan |
| Harga tower | 300 Gold |
| Path 1 biaya Lv1â€“5 | 160, 300, 1100, 2800, **7000** |
| Path 2 biaya Lv1â€“5 | 130, 280, 1000, 2500, **5750** |
| Damage permanen P1 | +0%, +15%, +30%, +30%, +30%, +30% base |
| Speed permanen P2 | +0%, +10%, +20%, +45%, +45%, +45% base |
| Nova | Setiap shot ke-4, **175% final damage** |
| Nova splash | Radius 64, ratio 25%, mempertahankan parameter ledakan Lv3 lama; primary tidak terkena splash kedua kali |
| Armor Fracture | 20% **base armor**, 3 s; refresh tanpa stack; armor minimum 0 |
| Cosmic Rhythm | +3% speed/shot, maksimal 5 stack; reset setelah 3 s tidak menembak |
| Max Rhythm | Total +60% base speed, interval 0,9/1,6 s |
| Overdrive | Aktif 2 s, cooldown 18 s setelah berakhir; siklus 20 s |
| Aktivasi pertama Overdrive | 18 s setelah memperoleh Lv5 |
| Lance | Maksimal 3 direct target unik, ledakan radius 76 per hit; satu splash per enemy per projectile. Arah lurus tanpa homing ulang; berakhir pada batas target/range/lifetime. Lihat `SUPERNOVA_LANCE_REPORT.md` |

Range multiplier upgrade existing dipertahankan. Upgrade Lv1â€“4 tidak berubah harga. Harga Lv5 mengikuti faktor 2,5Ã— / 2,3Ã— Lv4 lalu dibulatkan naik ke kelipatan 50 Gold, sesuai jawaban pengguna.

Fracture berkomposisi dengan native Health dan Fortification: Golem 25 base +10 buff âˆ’5 fracture =30 armor. Buff dan fracture dapat kedaluwarsa dalam urutan mana pun. Damage Dealt mencatat HP aktual yang hilang setelah armor dan tidak melebihi HP target.

Path 2 Lv3â€“4 menembak **satu projectile per shot**, kiri/kanan bergantian pada interval akhir. Hanya Overdrive aktif yang menghasilkan dua projectile per shot. Satu volley memberi satu stack Rhythm. Counter special meningkat pada shot yang benar-benar berhasil diluncurkan.

Crosspath memakai satu validasi: masing-masing maksimal Lv5, kedua path tidak boleh sama-sama Lv3+. `2-2 â†’ 3-2` dan `2-2 â†’ 2-3` valid; `3-3` dan `5-5` ditolak tanpa charge Gold.

## File yang berubah

- `Tower Defense.json`: resource registrations Star Cannon.
- `layouts/game-scene.json`: 10 object animation sets terkait Star Cannon, `StarCannonConfig`, `StarComponentConfig`, anchor Star di `TowerFootprints`, dan embedded runtime sources.
- `tools/star-cannon-runtime.js`: modular rig, aiming transforms, shot state, projectiles/specials, VFX dan ownership cleanup.
- `tools/void-golem-runtime.js`: satu expression effective armor untuk menggabungkan fracture dengan Fortification. Stat, cast, cooldown, buff dan movement Golem tidak diubah.
- `tools/selected-panel-runtime.js`: lima level, nama/preview baru, status tembakan dan spacing yang diperlukan.
- `tools/unit-index-runtime.js`: sepuluh upgrade dan tambahan tinggi konten/scroll untuk baris kelima; sistem discovery tidak diubah.
- `tools/free-placement-rings.js`: skala gambar ghost disamakan dengan canvas Nova Spike pada renderer preview terakhir, tanpa mengubah logical size, placement/collision atau camera.
- Baru: `tools/build-nova-spike.py`, `tools/nova-spike-prompts.json`, `tools/test-nova-spike.js`.
- Validasi diperbarui: `tools/validate-project.py`, `tools/run-clean-validation.py`, `tools/test-clean-project.js`, `tools/test-healthbars-balance.js`, `tools/test-void-golem.js`, `tools/preview-smoke.js`.
- Dokumentasi: `README.md`, `PROJECT_GUIDE.md`, laporan ini. Hasil terbaru berada di `validation/`.

Perbandingan in-memory dengan Git HEAD memastikan seluruh object property di luar animation set tersebut, authored instances, layer, camera, waypoint, map, enemy stats, wave config, UI shop geometry dan event non-JavaScript tetap identik. Bukti: `validation/nova-scope-check.json`. Tidak ada tower lama yang dikembalikan.

## Pengujian yang benar-benar dijalankan

Project dibaca oleh parser libGD, scene dan extension dikompilasi native tanpa scene diagnostic, kemudian diekspor menjadi preview GDJS. Pengujian menjalankan engine tersebut di Chrome headless terisolasi, menggunakan native objects, input/UI, Health, renderer dan audio. Tidak ada salinan source project untuk preview.

| Suite native | Assertion lulus |
|---|---:|
| Nova Spike: 27 state Ã— 8 arah, real target acquisition, specials, locking, pooling, unload | 731 |
| Placement / UI upgrade / selection / obstacle / sell / camera | 354 |
| Nova Wisp | 14532 |
| Void Hound | 117 |
| Void Guard / Sentinel / Brute | 636 |
| Health bars / minimum damage / investment | 184 |
| Void Golem casting / Fortification / armor | 552 |
| Gold-Budget dan seluruh 45-wave rules | 7486 |
| **Total delapan suite** | **24592** |

Semua delapan suite selesai tanpa console exception. Tambahan **44 pemeriksaan audio** dan **53 discovery Beta** lulus, tanpa console error. Audio placement/upgrade/fire/impact, stationary skill, BGM transitions, volume, concurrency, Game Over dan Victory tetap bekerja. Ordinary scene reload tetap mempertahankan discovery per sesi, dan explicit New Game reset masih bekerja.

Static validator memeriksa JSON, resource identifiers/path/casing, object references, source/event consistency, native hull pairs, 27-state matrix, audio hashes dan NO BACKUP. Pemeriksaan artwork tambahan **98 checks** memverifikasi frame bounds, alpha, ukuran preview dan envelope; hash semua 27 PNG berbeda. Detail: `validation/nova-asset-checks.json` dan `validation/static-checks.json`.

Preview native dengan tower selected/combat/Index diperiksa secara visual pada **1920Ã—1080**, serta selected panel pada **960Ã—640**. Shop tetap satu card **84Ã—112**, harga 300, slot pertama dan scroll/button behavior existing.

## Batas pengujian

Tidak dilakukan playthrough manual penuh 45 wave untuk menilai tingkat kesulitan balancing baru. Pengujian specials memakai fixture native terkontrol; bukan klaim seluruh kemungkinan pertandingan sudah dicoba. Tidak dilakukan benchmark pada perangkat low-end atau export Android/iOS. Atlas dan VFX sudah diuji di renderer native desktop/browser.

Parser libGD lokal melaporkan versinya lebih lama daripada versi project dan peringatan serializer/include bawaan. Scene tetap berhasil dikompilasi dengan 0 diagnostic; helper validasi memasang bundle Health native dan preview berjalan. Editor desktop GDevelop tidak dioperasikan secara manual dalam pengujian ini.

Tidak ada fitur yang ditinggalkan sebagai placeholder. Asset source mengandung komponen modular yang dapat dibagikan, bukan 27 lukisan tower independen; ini mengikuti izin pengguna untuk reuse komponen teknis dengan komposit yang unik. **Tidak ada backup baru yang dibuat.**
