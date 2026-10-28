# Nebula Bloom - implementasi dan validasi

> Laporan implementasi awal. Fix berikutnya mengubah tick poison menjadi1detik,
> memperbesar fondasi visual12.5%, menambah tiga fog dan mengganti sepuluh icon.
> Status terkini: bangunan sudah dipulihkan ke desain awal; radius placement menjadi68. Parameter dan hasil tes terbaru: [NEBULA_BLOOM_PLACEMENT_REPORT.md](NEBULA_BLOOM_PLACEMENT_REPORT.md).

Tanggal: 28 Oktober 2026. Project aktif: `Tower Defense.json`, scene `layouts/game-scene.json`.

## Hasil

Nebula Bloom adalah Tower mortar kedua yang playable: harga500 Gold, card kecil pada slot kanan atas, portrait3/4 tersendiri, projectile parabola, impact AoE, dua path sampai5-2/2-5, sell, selection, range dan Index. **Tidak ada Fusion Nebula Bloom.** Star Cannon, Starburst, musuh, campaign, wave, map dan camera existing dipertahankan.

Brief yang diterima hanya berisi teks; gambar konsep Nebula Bloom yang disebut dalam brief tidak disertakan. Artwork baru dibuat dari deskripsi ivory/gold/violet/nebula-blue, bukan diklaim menyalin blueprint yang tidak tersedia.

## Analisis dan integrasi

Project menggunakan tiga scene: MainMenu, Levels dan Game Scene. Gameplay menggabungkan events GDevelop native dengan source JavaScript yang di-embed melalui `tools/source-mapping.json`. Placement memakai catalog/footprint bersama, Health native menangani damage/armor, death handler existing membayar reward sekali, dan registry status existing menyusun icon di atas HP bar. Selected Panel, shop serta Galactic Archives memiliki layer UI dan layout responsif sendiri. Starburst menggunakan object Star Cannon dengan identitas Fusion; Nebula tidak dimasukkan ke recipe/controller tersebut.

Prinsip pembacaan mortar seperti acuan Bloons TD diterapkan secara umum: titik impact terbaca, lintasan lob jelas, perubahan milestone punya bentuk berbeda, dan pilihan DoT versus burst punya konsekuensi nyata. Tidak ada artwork, UI, audio atau angka balancing Bloons yang disalin. Referensi primer yang ditinjau: [catatan resmi Ninja Kiwi di Steam](https://store.steampowered.com/news/posts/?appids=960090&enddate=1716946448&feed=steam_community_announcements).

Lima object GDevelop baru:

| Object | Fungsi |
|---|---|
| `NebulaBloomTower` | Handle gameplay/selection,27 animasi state native |
| `NebulaBloomPod` | Sebelas varian projectile parabola |
| `NebulaBloomVFX` | Impact, flash, shockwave, pollen, cloud dan patch |
| `NebulaPoisonIcon` | Status poison dalam registry HP existing |
| `NebulaBloomArtSource` | Deklarasi preload lima atlas untuk native image manager; sengaja tanpa instance |

Object terakhir adalah dependency aktif renderer. GDevelop tidak otomatis memuat raw atlas yang hanya tertulis dalam konfigurasi JavaScript; deklarasi animasinya memastikan texture tersedia dalam preview/export. Jangan menghapusnya sebagai unused berdasarkan jumlah instance.

Tiga event baru, semuanya di Game Scene:

- `[0].events[7]`: inisialisasi `nebula-bloom-runtime.js`.
- `[10].events[0].events[6]`: `nebula-bloom-combat.js`, di dalam combat guard existing dan sebelum death/reward. Event death lama bergeser6 ke7, isinya dipertahankan.
- `[14].events[1]`: `nebula-bloom-render.js`.

Satu scene variable baru: `NebulaBloomConfig`. Entry baru ditambahkan pada `TowerShopCatalog`, `TowerFootprints`, `IndexPortraitCatalog`, group `PlaceableTile`, serta folder editor `NEBULA BLOOM`. Tidak ada instance map authored yang ditambah/dipindah. MainMenu/Levels JSON tidak diubah.

## Asset dan animasi

**64 resource final baru**, semuanya terdaftar; total project418 menjadi482. Semua PNG memiliki alpha transparan yang diuji.

| Lokasi | Isi |
|---|---|
| `assets/towers/nebula_bloom/atlases/` | 5atlas: Components, ToxicHeads, CataclysmHeads, Pods, Effects |
| `assets/towers/nebula_bloom/states/` | 27komposit128x128, seluruh hash berbeda |
| `assets/towers/nebula_bloom/projectiles/` | 11pod96x96 dari BasePod sampai NebulaCataclysmShell |
| `assets/towers/nebula_bloom/effects/` | 8texture128x128: BaseImpact, ToxicBurst, PoisonCloud, ToxicPatch, HeavyBurst, Shockwave, SporeApply, PoisonIcon |
| `assets/towers/nebula_bloom/ui/` | 12SVG: dua badge path dan sepuluh simbol upgrade |
| `assets/ui/nebula_bloom/NebulaBloom_Portrait.png` | Portrait showcase3/4 khusus shop/Index |

Enam artwork original dibuat dengan built-in image generation. Prompt/provenance: `tools/nebula-bloom-art.json`. Pillow dipakai untuk crop alpha, downsample atlas, resize dan komposisi modular. Tidak mengunduh asset pihak ketiga. Rebuild selanjutnya memakai atlas final dalam workspace dan tidak memerlukan cache image generator.

27state menggunakan base konstan, head berbeda per tier, jumlah/posisi spore emitters dan armored chambers sesuai kedua path. Perubahannya geometri, bukan recolor saja. Footprint selalu radius46; handle logical64x64; renderer world scale2.2. Upgrade tidak memindahkan pusat atau memperbesar collision.

Base tetap diam, head melakukan aiming, core berdenyut. Idle, Charge, Firing, Recoil dan Recovery adalah **animasi transform/timeline runtime**, bukan lima sprite-sheet frame-by-frame baru. Projectile berputar dalam parabola dengan shadow ground. Impact memakai flash singkat, expansion, ring dan fade; cloud/patch transparan dengan fade masuk/keluar. Sebelas named impact family menggunakan ulang delapan texture, dengan komposisi/ukuran/pollen/aftereffects yang berkembang; bukan sebelas lukisan explosion terpisah. Efek tidak mempunyai callback damage.

## Gameplay dan tuning awal

Sumber tuning: `tools/nebula-bloom-config.json`, ditanam builder ke `NebulaBloomConfig`. Runtime preview/export membaca scene variable tersebut. Setelah mengubah source config, jalankan builder dan embedding.

| Parameter dasar | Nilai |
|---|---:|
| Purchase | 500Gold |
| Direct area damage | 50 sebelum armor |
| Interval | 2.8s |
| Range | 340world px |
| Blast radius | 52world px |
| Flight | 0.72-1.12s sesuai jarak |
| Arc height | 105world px |
| Poison tick | setiap0.6s game time |

Harga/angka ini adalah tuning awal Tower baru; tidak mengubah balancing Tower/musuh lama. BaseDamage awal45 diuji pada wave bergerak dan menghasilkan kebocoran. Nilai50 dipilih setelah uji ulang dengan tiga mortar base, tanpa mengubah HP/speed/reward musuh. Itu bukan studi win rate atau validasi seluruh campaign dengan Nebula saja.

| Lv | Toxic Sporebloom | Harga | Poison/tick | Poison duration | Cloud duration/radius |
|---|---|---:|---:|---:|---|
| 1 | Irritant Spores |180|8|2s|tidak ada |
| 2 | Virulent Pollen |420|14|3s|tidak ada |
| 3 | Blight Bloom |900|25|3.6s|3s /60px |
| 4 | Caustic Canopy |2300|40|4.2s|4s /70px |
| 5 | Pestilent Superbloom |6200|60|5s|6s /82px |

| Lv | Cataclysm Bloom | Harga | Direct multiplier | Blast radius multiplier |
|---|---|---:|---:|---:|
|1|Heavy Seed Pod|200|1.25|1.0|
|2|Enlarged Burst Core|460|1.5|1.2|
|3|Bloom Detonation|1050|2.4|1.5|
|4|Stellar Overbloom|2600|4.4|1.9|
|5|Nebula Cataclysm|7000|7.5|2.45|

Crosspath burst juga memperbesar cloud radius. Toxic memberikan range multiplier1/1/1.03/1.05/1.08/1.12. Interval tidak mendapat attack-speed bonus. Contoh:5-2 mempunyai75direct damage,62.4blast radius,98.4cloud radius dan60poison/tick;2-5 mempunyai375direct damage,127.4blast radius dan14poison/tick tanpa cloud. Total investasi5-2=11160;2-5=12410, termasuk purchase.

Projectile mengunci prediksi lokasi sepanjang waypoint existing saat diluncurkan. Projectile tidak mengubah arah untuk homing; musuh dapat keluar dari titik impact. Setiap enemy di radius menerima satu direct hit melalui `__starCannon.deal`, termasuk armor/minimum damage native. Poison juga memakai adapter yang sama, sehingga armor tidak dikurangi dua kali. Tidak ada kalkulasi Gold/reward baru.

Satu record poison terkuat per enemy. Aplikasi sama/lebih kuat memperbarui durasi; poison lebih lemah tidak menumpuk atau memperpanjang poison kuat. Tick pertama setelah0.6s. Cloud hanya mengaplikasikan/refresh status; tidak menambahkan tick damage AoE kedua. Status dapat berlanjut sesudah enemy keluar dari cloud sampai durasi poison berakhir. UID pemilik melindungi attribution ketika tower di-sell/instance dipakai ulang; pod dan poison yang sudah diluncurkan tetap menyelesaikan snapshot serangannya.

Pause existing membekukan combat; speed2x dan Tactical Fusion0.5x mengikuti game time. Temporary pods, VFX, zones, status/icons dan modular rigs dibersihkan saat lifetime habis, owner mati, GameOver atau scene unload. Cap128 hanya membuang visual transient tertua; tidak menghapus damage.

## UI dan kompatibilitas

Shop tetap grid kecil dua kolom84x112: Star Cannon pertama300, Nebula kedua500. Shop mask/scroll, Play, Index, HUD dan layout map existing dipertahankan. Portrait3/4 tidak di-stretch. Selected Panel memakai preview state dan icon/path baru, paid upgrade normal, crosspath locking dan refund existing. Deskripsi kartu dipersingkat lewat `PanelDescription`; Index memakai deskripsi lengkap. Range dan world selection mengenali object Nebula.

Galactic Archives tetap Towers/Monsters/Fusion; Nebula merupakan entry Tower normal yang tersedia. Tidak membuat unlock/save scheme baru atau mengubah discovery musuh/Fusion. DEV Max mendispatch controller Nebula dan membayar upgrade normal; shortcut Fusion menolak Nebula. Gate Preview/DEV existing tetap.

Tutorial pertama mensyaratkan Star Cannon. Request Nebula ditahan selama langkah wajib pertama, agar600Gold tidak habis pada pembelian500 yang membuat latihan Star Cannon macet. Sesudah tutorial selesai/di-skip, pembelian Nebula normal. Mission budget, wave dan tutorial transaksi Star Cannon tidak diubah.

Audio existing dipakai ulang untuk placement, upgrade, impact dan damage melalui observer sistem audio; tidak membuat audio/lagu baru dan tidak menggunakan suara laser untuk mortar.

## File yang dibuat/diubah

- Project: `Tower Defense.json` hanya resource registrations; `layouts/game-scene.json` menambah object/config/frames/folder/group dan tiga JS events serta embedding source terkait.
- Source baru: `tools/nebula-bloom-runtime.js`, `nebula-bloom-combat.js`, `nebula-bloom-render.js`.
- Source shared yang disentuh: `free-placement-runtime.js`, `free-placement-click.js`, `world-selection-runtime.js`, `selected-range-runtime.js`, `island-render-runtime.js`, `responsive-map-runtime.js`, `selected-panel-runtime.js`, `unit-index-runtime.js`, `audio-runtime.js`, `developer-cheats-runtime.js`, `campaign-game-runtime.js`, `source-mapping.json`.
- Tool/config: `build-nebula-bloom.py`, `nebula-bloom-config.json`, `nebula-bloom-art.json`, `nebula-bloom-scope.py`; audit campaign diperluas hanya untuk additive catalog/UI frames, tanpa melonggarkan pemeriksaan statistik lama.
- QA baru: `nebula-bloom-qa.js`, `nebula-bloom-status-qa.js`, `nebula-bloom-ui-qa.js`, `nebula-bloom-wave-qa.js`, `nebula-bloom-stress-qa.js`, `nebula-bloom-visual-qa.js`.
- QA lama: asumsi one-card/one-Tower-entry diperbarui pada clean-project, void-golem, starburst-fusion, index-showcase dan main-menu; `campaign-qa.js` menambah pemeriksaan training Nebula. Assertion gameplay Tower/musuh lama tetap dijalankan.
- Dokumentasi: `PROJECT_GUIDE.md`, laporan ini. Bukti PNG/JSON/native test logs berada di `validation/`.

## Pengujian yang benar-benar dijalankan

Native libGD mem-parse ketiga scene dan mengompilasi event dengan **0 diagnostics**. Preview GDevelop hasil export dijalankan dengan Chrome headless melalui maintained CDP harness; bukan simulation engine pengganti. Fixture mengoperasikan native input, object, scene, damage dan events project. Test profile terisolasi dari save pemain.

| Pemeriksaan | Hasil |
|---|---|
| Nebula native contracts |137checks;27state,9kombinasi ilegal, pembelian, sell, arc, AoE sekali, poison/cloud, semua fase animasi, DEV, unload |
| Status/armor/time |12checks; Fortification + poison,50damage dari60raw/10armor, cleanup icon independen, pause,2x,0.5x, reward sekali, owner UID |
| Nebula UI |103checks pada1280x720;10deskripsi/price tidak overlap,10icon Index benar, portrait alpha fit, scrolling/cached objects |
| Resize satu scene |6ukuran berturut-turut,103checks per ukuran;1280x720,960x640,640x360,1600x900,640x360,1280x720; logical minimum960x540 |
| Natural moving wave |3mortar base dibeli normal500masing-masing,20Nova Wisp wave1 asli; selesai52.5simulated seconds,20kills,100Gold,10Lives utuh;40shots/40impacts |
| Stress |8mortar final +64stationary high-HP probes;900frames/15game seconds; maksimum8pods,128effects,48poisons,12zones;12s drain bersih |
| Native clean project regression |357checks |
| Native Nova Spike regression |731checks |
| Native Void Golem regression |552checks |
| Native Gold-Budget regression |7486checks,45wave rules |
| Starburst Fusion regression |110checks |
| Index showcase regression |124checks |
| Placement economy/audio cue |28checks dengan trusted gesture; Tetot dan volume/mute existing tetap |
| DEV regression |53checks ditambah native DOM keyboard/Enter/input-isolation checks |
| Main Menu regression |34checks; startup/hover, zero-size simulation, MainMenu-Levels-Game Scene, cleanup dan musik menu aktual;0console errors |
| Tutorial campaign |29checks; real first kill/upgrade, blok Nebula saat training, pembelian500 sesudah selesai;500Gold tambahan hanya fixture untuk pembelian terakhir |
| Campaign progression |122checks,25mission/204wave dengan fast-clear lethal fixtures dan audio tetap gated;0console errors. Tidak menguji win rate atau BGM pada run ini |
| Static/scope campaign |1033checks +4238structural/resource/source checks |
| Semantic comparison dengan Git HEAD |21checks; semua73object lama,79variable lama dan157authored instances dipertahankan selain penambahan yang disebutkan |
| Asset/build |64resource final,52PNG transparan,27state hash berbeda; rebuild+embedding idempotent pada67file yang dibandingkan |

Semua suite native Nebula, UI, stress dan regresi Tower/Fusion/Index/economy/DEV pada tabel menghasilkan **0 console errors**. Uji stress terpisah mencatat median step6.2ms/p959.6ms pada mesin ini; angka ini bukan jaminan FPS semua perangkat. Pengujian utama AoE/poison memakai stationary probes supaya batas damage dapat diukur; natural wave test terpisah memakai movement/HP/reward asli tanpa forced damage. Capture combat memakai high-HP stationary probes dan upgrade fixture, bukan klaim hasil pertandingan.

## Batasan dan temuan tersisa

- Full campaign fast-clear menggunakan lethal fixture hits untuk memeriksa progression204wave/25mission, bukan win-rate study. Run dengan trusted audio gesture menyelesaikan122state checks tetapi mencatat49error decode BGM saat audio di-load/unload pada perpindahan scene yang sangat cepat. Audio resources original tidak diubah. Temuan fixture ini dicatat di `validation/nebula-campaign-regression.json`; tidak diklaim sebagai audio pass atau diperbaiki dengan perubahan gameplay di luar scope.
- Validator struktur/resource/source lolos. Validator kebersihan direktori penuh `python tools/validate-project.py` berhenti pada **`Tower Defense.json.autosave` lama** yang sudah ada sebelum task ini. File itu tidak dibuat, diubah atau dihapus oleh task Nebula Bloom. Bukti scope berada di `validation/campaign-static.json` dan `validation/nebula-bloom-scope.json`.
- Installed libGD5.6.283 membaca project5.6.284 sehingga memberi version warning existing. Native compile tetap0diagnostics; harness memasok generated Health behavior bundle dari compiler native seperti workflow project sebelumnya. Tidak mengklaim membuka project melalui GUI IDE versi terbaru.
- Belum dilakukan human playtest seluruh campaign, hours-long soak, export mobile/device testing, atau physical OS minimize/restore. Resize yang diuji adalah perubahan viewport browser aktual via CDP. Balancing baru tetap perlu penilaian pemain pada mixed waves/Elite.

Tidak ada backup, project copy, safety asset copy, snapshot atau backup branch yang dibuat. Git history tidak diubah. Build preview adalah compiled validation export normal, bukan salinan source project untuk pemulihan.

## Menjalankan ulang

```powershell
python tools/build-nebula-bloom.py
python tools/embed-free-placement.py
node tools/validate-clean-project.cjs
python tools/run-clean-validation.py --prepare
python tools/balance-browser.py tools/nebula-bloom-qa.js validation/nebula-bloom-native.json --viewport=1280x720
python tools/balance-browser.py tools/nebula-bloom-status-qa.js validation/nebula-bloom-status.json --viewport=1280x720
python tools/balance-browser.py tools/nebula-bloom-ui-qa.js validation/nebula-bloom-resize.json --viewport=1280x720 --resize-sequence=1280x720,960x640,640x360,1600x900,640x360,1280x720
python -B tools/validate-campaign.py
```

Jangan regenerasi export preview ketika suite browser lain masih menggunakannya. Semua transformasi builder langsung/in-memory; tidak ada langkah backup.
