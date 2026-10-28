# Nebula Bloom - foundation platform rework

> Revisi fondasi visual ini dibatalkan sesuai koreksi pengguna. Bangunan dipulihkan ke desain awal, dan yang diperbesar adalah placement footprint. Status/angka terkini: [NEBULA_BLOOM_PLACEMENT_REPORT.md](NEBULA_BLOOM_PLACEMENT_REPORT.md).

28 Oktober2026. Perubahan khusus visual fondasi, langsung pada project aktif. Tidak membuat backup, salinan source/asset, snapshot project, atau branch. Perubahan working tree sebelumnya dipertahankan.

## Perbaikan visual

Atlas lama memiliki delapan kaki tipis yang mendominasi diameter luarnya. Ring penyangga di antara kaki masih sempit dan tertutup body, sehingga peningkatan skala sebelumnya belum membuat fondasi terasa kokoh.

Fondasi kini memakai **platform ivory-gold penuh**, dengan permukaan penyangga melingkar lebar, rim berlapis yang tebal, border gold dan inlay violet. Ring tetap terlihat mengelilingi body pada state dasar maupun upgrade final. Style mengikuti material Celestial/Nebula existing.

Asset final baru: `assets/towers/nebula_bloom/components/NB_Foundation.png` (256x256 dengan alpha asli). Dibuat dengan built-in imagegen, kemudian hanya di-crop/fit/resize secara mekanis. Prompt final/provenance berada di `FoundationSource` pada `tools/nebula-bloom-art.json`. Hasil pertama yang masih menyerupai kaki lama tidak diimpor ke project.

Batas komponen luar tetap126 pada canvas128x128, dengan body86-90. Permukaan penyangga yang terisi pada annulus luar (75-93% radius) naik dari51.46% menjadi95.34%; angka ini mengukur kontinuitas permukaan pada batas yang sama, bukan perubahan footprint atau persentase diameter gameplay. Ring baru lebih penuh dan terlihat jelas di map tanpa memperluas bounds tower.

## Semua state ikut berubah

Seluruh **27 kombinasi valid** menggunakan platform baru, termasuk0-0,3-0/3-1/3-2,4-0/4-1/4-2,5-0/5-1/5-2 dan varian Cataclysm sampai2-5. Semua PNG `assets/towers/nebula_bloom/states/NB_a_b.png` diregenerasi dari komposisi yang sama dengan renderer in-game.

Builder mengganti hanya bagian pertama `States.*.Parts` dari atlas `NB_Components` frame0 ke atlas satu frame `NB_Foundation`. Head, core, spore nodes, chambers, aiming, animasi dan statistik tidak berubah. Atlas komponen lama tetap byte-identik karena bagian-bagian lain masih aktif digunakan.

Footprint tetap radius46; logical size64x64; RenderScale2.2; center/pivot dan placement/collision tetap. Base tetap diam ketika head melakukan aiming. Shop portrait, icon upgrade, UI layout dan Tower lain dipertahankan.

## File/project yang diubah

- Asset baru: `assets/towers/nebula_bloom/components/NB_Foundation.png`.
- Asset diperbarui: seluruh27PNG state di `assets/towers/nebula_bloom/states/`.
- `tools/nebula-bloom-config.json`: menambah `FoundationImage`; angka `FoundationSize` dan semua parameter gameplay tetap.
- `tools/build-nebula-bloom.py`: import foundation final, metadata single-frame dan referensi base seluruh state. Rebuild berikutnya memakai asset workspace, tidak membutuhkan cache imagegen.
- `tools/nebula-bloom-art.json`: prompt dan provenance final.
- `Tower Defense.json`: satu resource image baru;485 menjadi486.
- `layouts/game-scene.json`: referensi art/frames dalam `NebulaBloomConfig` serta satu animasi preload pada `NebulaBloomArtSource`. Tidak ada event/object/layer baru.
- QA baru: `tools/nebula-bloom-foundation-map-qa.js`, fixture pembelian/upgrade normal dan label screenshot validasi.
- Dokumentasi: `PROJECT_GUIDE.md`, penunjuk revisi pada laporan sebelumnya, dan laporan ini.

**Seluruh JavaScript existing dan event logic tetap byte/struktur-identik terhadap awal task**, termasuk controller Nebula Bloom, placement, collision, upgrade, projectile, AoE, poison1detik, audio, UI serta Tower lain. Tidak ada gameplay variable lain atau authored scene instance yang berubah.

## Validasi aktual

| Pemeriksaan | Hasil |
|---|---|
| Native GDevelop parse/compile tiga scene | Lolos,0event diagnostics |
| Native map sebelum/sesudah | Masing-masing12checks,0console errors; actual shop purchase500 dan paid upgrades pada0-0,3-2,5-2,2-5 |
| Native Nebula regression |137checks,0console errors; seluruh27state, placement/anchor/range, upgrade/sell, arc/AoE/poison serta unload |
| Audit baseline task |1249checks; seluruh gameplay/config/JavaScript/UI/asset lain dipertahankan, hanya art reference dan27komposit yang berubah |
| Maintained campaign/static |1033checks +4266structural/resource/source checks lolos |
| Rebuild |Idempotent pada70file yang dibandingkan dengan checksum,0perubahan setelah rebuild ulang |
| Visual inspection |Platform lebih jelas mengelilingi body pada keempat tower di map dan seluruh27state pada contact sheet; tidak terpotong di canvas128 |

Capture **`validation/Nebula_Foundation_Before.png`** dan **`validation/Nebula_Foundation_After.png`** memakai resolusi1280x720, posisi/center yang sama, footprint46, transaksi upgrade yang sama, Gold akhir23270 dan camera existing. Screenshot runtime ini dibuat untuk perbandingan visual yang diminta, bukan salinan source project atau asset untuk pemulihan. Label state hanya milik fixture validasi.

Contact sheet final: `validation/Nebula_Bloom_27_States.png`. Bukti JSON: `validation/nebula-foundation-before.json`, `nebula-foundation-after.json`, `nebula-foundation-regression.json`, `nebula-foundation-static.json`, `nebula-foundation-build.json`. Baseline menyimpan checksum/counts saja.

Preview dijalankan dari export native GDevelop melalui Chrome headless. Tidak mengklaim human playtest panjang, perangkat mobile atau pembukaan GUI IDE manual. Warning versi libGD5.6.283 versus project5.6.284 existing tetap, tetapi compile/runtime yang dijalankan lolos. Validator kebersihan direktori penuh tetap berhenti pada `Tower Defense.json.autosave` lama; file itu tidak dibuat/diubah/dihapus task ini.

Tidak ada backup baru dan tidak ada perubahan Git history.
