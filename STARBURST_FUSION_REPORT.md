# Starburst Cannon — playable Pure Fusion prototype

Implementasi aktif langsung di project folder GDevelop. Gold awal tetap **50000**. Tidak ada backup, salinan source project, backup asset atau perubahan Git history.

Pembaruan setelah prototype: footprint seluruh tower, tiga tab Index, dan discovery Fusion permanen dijelaskan di **[FUSION_FIXES_REPORT.md](FUSION_FIXES_REPORT.md)**. Bagian pengujian di bawah mencatat validasi awal prototype; hasil terbaru ada pada laporan tersebut.

## Cara mencoba

1. Bangun Star Cannon **5-2** dan satu lagi **2-5**. Harga existing menghasilkan investasi 12070 + 10420 = **22490 Gold**; dari Gold awal50000 tersisa27510.
2. Pilih salah satu tower tersebut lalu tekan **FUSION / CELESTIAL ASCENSION** di bawah card upgrade. Mode fusion melambat ke **0,5x**, dengan shade25%, highlight tower max dan penanda FUSION.
3. Klik tower dengan path utama lawan. Pasangan sama, tower belum lengkap, dan memilih diri sendiri ditolak.
4. Ghost Starburst mengikuti cursor. Dua lingkaran regional menunjukkan radius **96 world px** dari masing-masing sumber. Placement bebas di dalam union regional, tetap tunduk pada semua blocker existing.
5. Klik spot valid untuk konfirmasi. Kedua sumber baru dihapus setelah kandidat Starburst berhasil dibuat. Cancel atau Esc membatalkan tanpa konsumsi/biaya. Speed kembali ke nilai sebelum fusion.

Biaya tambahan fusion prototype **0 Gold**. Tidak ada auto relocation, penjualan otomatis, atau fallback placement paksa. Gold tidak dipotong saat memilih pasangan atau selama preview.

## Analisis dan perbandingan Bloons TD

Controller lama sudah mempunyai pedestal diam, turret pivot, barrel recoil, muzzles fisik, native Health/damage, footprint validator, Selected Panel, sell dan Index. Karena itu Starburst memakai **varian native `StarCannonTower`**, dengan **`TowerType = StarburstCannon`** dan `VisualKey=Fusion`. Ini mempertahankan selection, range, ekonomi dan lifecycle object yang sudah bekerja; 27 state dan upgrade locking Star Cannon biasa tetap terpisah dan sama.

Sebagai pembanding, [catatan resmi Ninja Kiwi v27.0](https://store.steampowered.com/news/posts/?appids=960090&enddate=1665538441&feed=steam_community_announcements) memperkenalkan Paragon yang menggabungkan identitas jalur tower sejenis dan menyerap tower sumber. Keputusan desain untuk project ini: hanya dua pasangan exact yang dipilih pemain, preview regional sebelum konsumsi, Cancel eksplisit, tanpa degree/XP/sacrifice massal. Ini merupakan interpretasi untuk prototype Celestial Void, bukan klaim bahwa Bloons TD memakai UX regional/0,5x ini.

Readability: artwork benar-benar overhead, pedestal tetap diam, kepala simetris menghadap target, tiga muzzle memiliki arah utara yang sama pada rest pose. Satu projectile per interval bergantian **center → left → right**; tiga barrel tidak menggandakan fire rate. Range dan footprint tidak diperbesar untuk mengejar kesan kuat. Damage per shot lebih tinggi dari rapid-only, interval lebih cepat dari heavy-only, dengan splash lebih kecil dan tanpa paket Lance/Fracture/Rhythm/Overdrive penuh. Nilai ini untuk testing, bukan hasil balancing jangka panjang.

## Parameter terpusat

Semua berada di scene variable **`StarburstConfig`**:

| Parameter | Nilai awal test |
| --- | --- |
| FusionCost | 0 Gold |
| RegionalRadius | 96 px dari center salah satu sumber |
| FusionTimeScale / OverlayOpacity | 0.5 / 0.25 |
| Damage | 90 per bolt |
| AttackInterval | 0.4 detik, satu bolt per interval |
| AttackRange | 227 px |
| ProjectileSpeed | 600 px/s |
| SplashRadius / SplashRatio | 64 px / 20%, satu impact |
| RotationDegreesPerSecond | 300 |

Footprint memakai konfigurasi Star Cannon existing **radius46**. Range indicator mengikuti227. Direct dan splash memakai `star.deal`/Health existing: armor diterapkan sekali per aplikasi, primary target dikecualikan dari splash miliknya. VFX tidak mempunyai damage tick. Normal Nova radius76, Lance3 impacts, Fracture, stat/cost/additive/crosspath lama tidak diubah.

## Asset dan state animasi

Final asset di **`assets/towers/starburst_cannon/`**:

- **`Starburst_Modular_Atlas.png`**: artwork original **built-in image_gen**, RGBA1280×1280. Empat komponen: `Base` diam, `Chassis` berotasi, `Barrel` dipasang tiga kali dengan recoil independen, `Core` mengikuti turret dan menerima energy pulse. Reference adalah blueprint pengguna serta atlas p1_5/p2_5 existing. Prompt specification/method ada di **`tools/starburst-art.json`**.
- **`Starburst_Preview.png`**: komposit352×352 dari komponen yang sama, dipakai native editor, Selected Preview, Index dan ghost. Ini asset aktif untuk UI/native loading, bukan screenshot yang menggantikan gameplay.
- **`Starburst_Bolt_0.svg`**, **`_1.svg`**, **`_2.svg`**: tiga frame bolt stellar terarah, code-native sesuai pipeline projectile SVG existing; pulse, core dan trail biru-violet/putih.

Native animation names: `Fusion` pada tower/base/turret existing, `SC_Fusion` pada Selected Preview, `StarburstCannon` pada Index portrait, `Starburst` looping pada projectile. Base atlas dependency dideklarasikan melalui animation `StarburstAtlas` untuk preload/export.

Idle memakai core pulse; aiming memakai rotasi halus300°/s; shooting memakai recoil per muzzle dan flash existing; impact memakai delapan frame **Nova explosion existing** selama0,64s dengan diameter128 untuk radius64. Tidak ada duplikasi atlas atau asset explosion baru.

## Logic, input, lifecycle dan archive

- Runtime baru **`scene.__fusion`**: `begin`, `choose`, `validate`, `confirm`, `cancel`, `dispose`. State `idle → partner → placement → idle`.
- Validator `p.validate(type,x,y,options)` menambahkan opsi mengabaikan **hanya kedua sumber** dan memakai biaya fusion. Bounds, rocky island outline, road polygons, obstacle/spawn/base, tower lain, sidebar/HUD dan UI tetap aktif. Validator placement normal tanpa options tetap identik perilakunya.
- Konfirmasi memeriksa ulang pasangan/lifetime ID/lokasi/Gold, membuat dan menerapkan kandidat lebih dahulu, lalu mengonsumsi sumber dan biaya. Factory failure, pasangan hilang atau Gold kurang mempertahankan sumber. Game Over membatalkan mode.
- `TotalInvestment` dan damage tracking dua sumber dijumlahkan; sell memakai refund existing70%. Refund nyata untuk investasi22490 adalah **15743**.
- Selama fusion, input shop/play/Index/audio/selection/build normal diblokir dari klik modal. Wave mode tidak diganti; clock existing memakai0,5x selama modal lalu kembali ke speed sebelumnya. Game tidak di-pause oleh fitur ini.
- Layer **`FusionUI`** mengikuti viewport, bukan camera map. Fixed UI/ghost dipakai ulang; marker dinamis dihapus saat selesai. Scene unload membersihkan UI/graphics. Source rig cleanup memakai callback tower existing.
- Hook **`game.__fusionArchive`** kini memakai persistence lokal terpisah untuk Fusion, bersama Index dan notifikasi. Starburst muncul hanya di tab **Fusion**; progress varian dan resep urutan terbalik dinormalisasi. Tidak ada API reset otomatis. Discovery monster beta tetap mengikuti sesi. Detail migrasi, storage key dan hasil restart nyata ada di `FUSION_FIXES_REPORT.md`. Shop tetap satu card Star Cannon300.

## File, object dan event yang berubah

- **`Tower Defense.json`**: registrasi lima resource aktif baru saja.
- **`layouts/game-scene.json`**: `StarburstConfig`, `FusionActive`, native ghost/layer/folder serta animation dependencies baru, dan embedded source.
- **Object baru `StarburstGhost`**, layer `FusionUI`. Tidak ada rename object/variable lama dan tidak ada type shop baru.
- **`tools/starburst-fusion-runtime.js`**: state/transaction/UI/input, di-embed dalam grup scene `events[0]`, child `events[3]`. `tools/source-mapping.json` menambah satu mapping.
- **`tools/star-cannon-runtime.js`**: branch varian Starburst pada components/stats/fire/rotation; Star Cannon biasa, Lance, Fracture dan native damage tetap menggunakan path existing.
- **`tools/free-placement-runtime.js`**: optional ignored source towers / fusion fee. `tools/free-placement-click.js`, `tools/world-selection-runtime.js`, `tools/responsive-map-runtime.js`, `tools/audio-runtime.js`: input-modal guards dan time-scale override selama fusion.
- **`tools/selected-panel-runtime.js`**: tombol Fusion untuk exact5-2/2-5, panel Starburst dan refund. Label Lance lama yang masih tertulis5 target kini membaca cap aktif dari config.
- **`tools/unit-index-runtime.js`**: tab Fusion tersendiri, entry siluet sebelum discovery, portrait/nama/resep terbuka setelah sukses, stats dari config.
- **`tools/build-starburst.py`**: atlas gutters/crops, composited preview, bolt frames dan native registration. Hook ditambahkan ke `tools/build-nova-spike.py` agar rebuild tidak menghilangkan Fusion; konfigurasi tuned tetap dipertahankan.
- **`tools/starburst-fusion-qa.js`**, **`tools/starburst-art.json`**, `PROJECT_GUIDE.md`, laporan ini dan evidence di `validation/`.

## Validasi nyata

- JSON/resource/source mapping validator lulus. **402 resources (377 image,25 audio)**, **66 objects**, **157 authored instances**, **63 scene variables**, **25 runtime sources**. Tidak ada missing resource/backup.
- Native GDevelop parser/compile/export berhasil dengan **0 scene diagnostics**. Toolchain lokal mengeluarkan warning versi/include yang sudah ada; helper menyertakan native Health bundle. Editor desktop tidak dioperasikan manual.
- **109 pemeriksaan Fusion** lulus pada **1920×1080** dan **960×640**, tanpa console error. Termasuk real shop builds/upgrades, exact/reverse pair, invalid partner,0,5x clock tetap bergerak, Esc/Cancel, green/red regional ghost, road/other tower/obstacle, no pre-consumption, actual confirm, transferable investment/refund, Index unlock, aiming8 arah, stationary pedestal, physical muzzles, alternating0-1-2, recoil, direct90/splash18/radius64, no repeated VFX damage, factory failure, insufficient fee, Game Over, source deletion, repeated cancellation/pooling dan unchanged camera/route.
- **28 pemeriksaan placement flow** tambahan lulus dan native screenshot diambil. Screenshot placement/gameplay/960 diperiksa; UI tetap terlihat dan ghost/region jelas.
- Regresi native: **731 Nova Spike**, **354 placement/UI/sell/obstacle/Index**, **552 Void Golem**, **7486 Gold-Budget wave checks** lulus tanpa exception.
- **`validation/starburst-scope-check.json`** memverifikasi hashes saja: setelah mengeluarkan penambahan Fusion, semua existing scene config/objects/instances/layers/folders dan resource entries cocok dengan sebelum task. Tidak ada salinan restorable source disimpan.

Evidence: **`validation/starburst-fusion-qa.json`**, **`starburst-fusion-qa-960.json`**, **`starburst-placement-qa.json`**, **`Starburst_Fusion_Gameplay.png`**, **`Starburst_Fusion_Placement.png`**, **`Starburst_Fusion_960.png`**. Angka Gold dalam screenshot berasal dari transaksi fixture nyata (build/upgrade/sell); fresh scene tetap50000.

Belum dilakukan playthrough manual penuh45 wave atau balancing/performance benchmark panjang. Native fixture memverifikasi gameplay yang disebutkan, bukan seluruh platform/export target. Prototype sudah playable; biaya0 dan statistik awal sengaja terbuka untuk tuning berikutnya. **Tidak ada backup dibuat.**
