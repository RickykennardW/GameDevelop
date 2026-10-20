# Galactic Archives — Index UI redesign

Catatan lanjutan: koreksi renderer Monster Index dan validasi terkini ada di [MONSTER_INDEX_FIX_REPORT.md](MONSTER_INDEX_FIX_REPORT.md). Hasil di bawah merupakan pengujian tahap redesign sebelumnya; adapter monster kini memakai satu portrait bermask per slot, tanpa outline duplikat. Validator terkini berhenti pada autosave pengguna yang sudah ada sebelum koreksi, sebagaimana dijelaskan pada laporan lanjutan.

20 Oktober2026. Project aktif diedit langsung, **tanpa backup, salinan project, safety copy asset, snapshot, atau perubahan Git history**.

## Analisis sebelum perubahan

Project mempunyai satu split scene **Game Scene**, dengan event Index di `events[1].events[0]`, Monster Discovery di `events[0].events[2]`, dan Fusion archive di `events[0].events[4]`. Index lama memakai IndexUI/IndexList, satu daftar panjang, portrait sekitar58–76px dan semua detail/upgrade dalam kartu yang sama. `IndexTowerImage` masih memakai SC_0_0/Starburst_Preview top-down. Sudut tersebut benar untuk gameplay, tetapi tidak memperlihatkan volume body, barrel dan pedestal untuk ensiklopedia.

Sistem data yang sudah bekerja dipertahankan: TowerShopCatalog/StarCannonConfig, EnemyTypes/VoidGolemConfig, FusionCatalog, session monster discovery, dan persistent `game.__fusionArchive`. Discovery Fusion tetap memakai key `celestialVoidFusionDiscovery.v1`, recipe tanpa urutan dan unlock hanya setelah transaksi berhasil. Tidak ada harga/stat/resep gameplay baru.

## Desain baru

- **Header:** GALACTIC ARCHIVES, tiga tab utama, close X dan Escape. Midnight blue/deep purple, border tipis, accent celestial gold serta cyan; tanpa dekorasi yang mengalahkan informasi.
- **Collection:** thumbnail konsisten, nama/status, highlight gold untuk entry terpilih. Pilihan disimpan per kategori dan dibuat terlihat saat kembali ke kategori. Scroll koleksi independen dari detail.
- **Detail:** showcase besar, kategori/nama/deskripsi, empat kartu statistik dengan simbol Graphics sederhana, property aktual, lalu upgrade/ability/recipe. Semua teks memakai wrapping dan tinggi konten yang diukur. Sepuluh tier upgrade dibaca langsung dari config beserta icon/cost existing.
- **Responsive:** desktop memakai koleksi kiri/detail kanan. Di bawah760px, koleksi menjadi strip horizontal; detail tetap dapat di-scroll. Dua mask terpisah menjaga isi di dalam panel, header/tabs/close tetap dapat dipakai.
- **Fusion:** card menggunakan gold accent. Locked memakai siluet hitam dari portrait3/4 aslinya, `???`, cryptic hint dan detail/resep tersegel. Discovered membuka art, nama, recipe dan stats dari config. Adaptive variants tetap terkunci per varian; bukan unlock massal.
- **Monster:** enam portrait/frame idle existing digunakan kembali dengan crop/visual bounds yang sama, tanpa edit artwork/animasi enemy. Detail menunjukkan HP,armor,speed,reward,ability serta wave awal dari data aktif. Golem membaca Void Fortification dari config.
- **Notification coordination:** saat Index terbuka, notifikasi monster menunggu. Queue, active age dan unlock tetap utuh; setelah ditutup notifikasi dilanjutkan. Ini hanya presentation timing, tanpa menghentikan gameplay atau mengubah discovery/save. Notifikasi Fusion tetap memakai controller sebelumnya.

Sebagai pembanding, [catatan resmi Ninja Kiwi untuk BTD6](https://store.steampowered.com/news/posts/?appids=960090&enddate=1665538441&feed=steam_community_announcements) membahas perbaikan clipping/alignment UI serta tombol close X. Tolok ukur yang diterapkan: navigasi eksplisit, pilihan yang mudah dikenali, art sebagai fokus dan informasi yang dapat dipindai. Layout collection/detail, palette, ornaments dan artwork di sini merupakan desain Celestial Void; bukan salinan UI/aset BTD6 atau klaim bahwa arsip BTD6 persis memakai layout ini.

## Artwork yang benar-benar dibuat

Menggunakan **built-in image_gen**, bukan rotate/stretch sprite gameplay. Kedua file **1254×1254 RGBA** memiliki alpha transparan; native renderer mem-fit seluruh alpha bounds dengan scale seragam.

| File final | Isi |
|---|---|
| `assets/ui/index/portraits/StarCannon_IndexPortrait.png` | Showcase3/4 satu barrel, ivory/silver armor, gold frame, violet-blue core/crystals dan pedestal |
| `assets/ui/index/portraits/StarburstCannon_IndexPortrait.png` | Showcase3/4 satu heavy central barrel dan dua side barrels, fusion core, celestial ivory/gold identity |

Prompt lengkap, reference roles dan final paths: **`tools/index-portrait-art.json`**. Tidak ada portrait wajib yang masih perlu dibuat manual untuk dua unit aktif tersebut. Portrait khusus setiap tier upgrade belum dibuat; Index memakai portrait utama dan icon tier existing sesuai fallback yang diminta. Future tower/Fusion tanpa mapping mempunyai slot **PORTRAIT PENDING**, tanpa crash atau menjadikan sprite top-down sebagai hasil akhir.

Original IndexTowerImage, seluruh gameplay states/atlases, ghost, Selected Panel, shop portrait, projectile dan VFX tidak diganti. Native battlefield tetap overhead dengan aiming/rotation/recoil yang lama.

## File, object, layer dan event

| File | Perubahan |
|---|---|
| `Tower Defense.json` | Tambah registrasi dua image resource; property game existing tetap sama |
| `layouts/game-scene.json` | Object UI `IndexShowcase`, layer `IndexDetail`, variable `IndexPortraitCatalog`, object-folder membership; embed dua source terkait |
| `tools/unit-index-runtime.js` | Header, collection/detail, selection, independent scroll/masks, dedicated portrait, stats/upgrade/recipe rendering, lifecycle/cache |
| `tools/monster-discovery-runtime.js` | Adapter thumbnail+detail pada layer masing-masing dan menunggu notifikasi ketika Index terbuka; owner data/unlock/storage tidak berubah |
| `tools/build-index-showcase.py` | Registrasi UI idempotent; alpha-bound metadata tanpa mengubah pixel artwork |
| `tools/build-starburst.py` | Hook mempertahankan mapping Index pada rebuild berikutnya |
| `tools/index-portrait-art.json` | Provenance/prompt kedua portrait final |
| `tools/index-showcase-qa.js` | Native layout/artwork/input/scroll/data tests |
| `tools/discovery-qa.js`, `tools/fusion-fixes-qa.js` | Ekspektasi UI disesuaikan ke collection/detail dan portrait baru; behavioral checks dipertahankan |
| `PROJECT_GUIDE.md`, `FUSION_FIXES_REPORT.md`, laporan ini, `validation/` | Dokumentasi dan bukti |

Tidak ada rename object/variable lama, authored instance baru, atau source mapping/event gameplay baru. Event Index dan Monster Discovery existing tetap pada posisinya. Total **404 resources =379 image+25 audio, 67 object definitions,157 authored instances,65 scene variables,26 runtime source mappings**.

## Validasi nyata

- Native GDevelop parser/compile/export berhasil dengan **0 scene diagnostics**. Toolchain lokal mempunyai warning versi/include existing dan validation helper memasukkan native Health bundle. Editor desktop tidak dioperasikan manual.
- Native UI suite: **121 checks pada1280×720,121 pada960×640,120 pada640×480**. Meliputi tab, thumbnail clicks, wheel di masing-masing panel, seluruh upgrade, alpha bounds, wrapping, locked/reveal, actual monster encounter, no notification overlap, Close/Escape, unchanged Gold/stats dan cache stabil120 frame. Semuanya tanpa console error.
- Screenshot Tower, Fusion discovered, Fusion locked dan Monster diperiksa secara visual; portrait utama tidak terpotong atau didistorsi. Pada640×480 konten detail panjang memang memerlukan scroll; navigasi tetap terlihat.
- Fusion transaction/discovery suite: **59 checks +8 page reload +8 full browser relaunch**. Successful Fusion tetap membuka Index segera, kedua sumber baru dikonsumsi setelah valid, urutan terbalik satu recipe, notifikasi pertama sekali dan partial Hybrid tetap independen. Save/audio/unrelated storage tetap terpelihara.
- Native Fusion combat/transaction regression: **110 checks**, termasuk aiming8 arah, tiga muzzle bergantian, recoil, projectile, direct/splash, VFX cleanup, Cancel/speed, collision, refund serta guard transaksi.
- Native Nova Spike **731** dan placement/shop/UI/sell/collision **354** checks lulus tanpa exception.
- Monster portrait/session regression: **53 checks** serta actual scene reload dan full browser restart, tanpa console errors. Data/discovery sesi serta audio preferences tetap sesuai perilaku lama.
- Monster discovery full flow: **52 checks** lulus, termasuk semua enam queue, satu sound per jenis, klik tembus notifikasi, unchanged camera/config, dan cache tujuh portrait yang bounded (enam thumbnail+satu detail).
- Validasi akhir **5677 checks** JSON/resources/references/source mapping/no-backup lulus. `node --check` untuk runtime terkait serta `git diff --check` juga lulus.
- **`validation/index-redesign-scope.json`** menyimpan hash/count/check flags saja. Semua asset existing, resource entries existing, property project, gameplay runtime dan scene data existing byte/semantically cocok setelah hanya mengeluarkan tambahan UI baru. Bagian owner unlock/state/persistence monster sebelum renderer juga identik. Tidak ada salinan JSON/asset untuk recovery.

Evidence utama: `validation/index-showcase-final.json`, `index-showcase-960.json`, `index-showcase-640.json`, `index-fusion-discovery.json`, `index-monster-regression.json`, `index-starburst-combat.json`, dan `index-discovery-full.json`. Preview: `Index_Showcase_Tower_1280.png`, `Index_Showcase_Fusion.png`, `Index_Showcase_Locked.png`, `Index_Showcase_Monster.png`, `Index_Showcase_960.png`, `Index_Showcase_640.png`.

Belum dilakukan playthrough manual45 wave, benchmark memori jangka panjang, atau tes seluruh platform export. Persistence diuji pada profile/browser origin yang sama; origin/profile berbeda mempunyai storage tersendiri. Tidak ada klaim bahwa seluruh platform sudah diuji.

## Cek manual singkat

1. Start Preview1280×720. Buka Index, pindah tiga tab dan klik beberapa thumbnail Monster; pastikan selection/detail berubah dan dua scroll independen.
2. Scroll Tower sampai dua tier5. Periksa semua nama/description/cost serta icon, lalu Close/Escape dan coba placement/upgrade/shooting biasa.
3. Pada profile Fusion belum ditemukan, periksa siluet/hint tanpa recipe. Lakukan Fusion5-2 +2-5 valid; buka Index dan periksa portrait/name/resep langsung terbuka.
4. Jalankan ulang preview dengan storage yang sama; progress harus tetap. Coba window960×640 dan640×480, scroll sampai semua bagian terlihat.
