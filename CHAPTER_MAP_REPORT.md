# Chapter maps, proportions and balance audit

Tanggal: 19 November 2026. Baseline sebelum pekerjaan: Git `e59ded3`.

## Status implementasi

Lima chapter sekarang memakai lima route, terrain, palet dan susunan obstacle
yang benar-benar berbeda saat gameplay. Kelima chapter tetap memakai Game Scene
bersama; tidak ada duplikasi scene atau project. Chapter 6–8 disiapkan sebagai
metadata **PLANNED**, belum memiliki map atau misi dan tidak dapat diluncurkan.

Progression/save, 25 misi, 214 wave, starting Gold, Lives, reward, HP/speed override,
harga dan kelima konfigurasi boss dipertahankan. Tidak ada rebalance statistik
Tower/monster. Perbedaan kesulitan tambahan berasal dari geometry dan penempatan.

## Audit sebelum perubahan

Semua chapter sebelumnya memakai `LabyrinthMap` yang sama: panjang 9776.5263,
16 belokan, 331 waypoint dan ribbon selebar 32 world units. Pola SVG 16 × 16
memakai transform 0.72; satu bata yang terlihat berukuran 11.52 × 5.76, rasio 2:1.
Ini membuat paving terlihat kecil dan memanjang. Render Wisp selebar 74.4 pada
path 32 berarti rasio visual sekitar 2.33 kali lebar path. Brute dan Golem lebih
besar lagi. Masalah berasal dari kombinasi path sempit, pola bata kecil dan
render scale; kamera dan collider tidak perlu diubah untuk memperbaikinya.

Tower memakai footprint terpisah dari sprite, demikian juga enemy memakai
collider terpisah dari render rig. Karena itu pengecilan render tidak diterapkan
ke Health, movement, projectile hit detection atau radius serangan.

| Komponen | Sebelum | Sesudah |
| --- | ---: | ---: |
| Resolusi desain UI | 1280 × 720 | sama |
| Surface world | 1704 × 1008 | sama |
| Batas surface | (72,64)–(1776,1072) | sama |
| Framing world termasuk cliff/margin | 1872 × 1155.52 | sama |
| Lebar path gameplay dan artwork | 32 | 60 |
| Paving visual | bata 11.52 × 5.76 | persegi 24 × 24 |
| Ground repeat | terrain lama | seamless tile 128 × 128 per chapter |
| Radius rounding route | 18 | 36, dibatasi panjang segment |
| Jarak sampling waypoint maksimum | 48 | 48 |
| Enemy render multiplier tambahan | 1 | 0.9 |
| Enemy collider common / Golem | 48 / 64 | sama |
| Tower render / collision multiplier | 1 / 1 | sama |

Ground tile berbeda dari paving. Persegi 24 × 24 adalah ukuran pola lantai road,
bukan grid wajib untuk Tower: free placement tetap aktif.

| Enemy | Render envelope nominal lama | Baru | Collider |
| --- | ---: | ---: | ---: |
| Nova Wisp | 74.4 | 66.96 | 48, tetap |
| Void Hound | 96 | 86.4 | 48, tetap |
| Void Guard | 86.4 | 77.76 | 48, tetap |
| Void Sentinel | 74.4 | 66.96 | 48, tetap |
| Void Brute | 100.8 | 90.72 | 48, tetap |
| Void Golem | 120 | 108 | 64, tetap |

Angka render adalah ukuran frame/rig nominal sebelum camera zoom, bukan ukuran
pixel opaque yang persis sama untuk setiap pose. Glow dan serpihan dapat meluas.
Wisp sekarang sekitar 1.12 kali lebar path; Elite tetap sengaja lebih besar.

Star Cannon tetap memakai frame logis 64, world render scale 2.5 dan radius
footprint 46. Nebula Bloom tetap frame 64, render scale 2.2 dan radius 68 dengan
safety gap 8. Art Tower, muzzle, projectile, range dan VFX combat tidak diganti.
Radius Fusion tetap Meteor 60, Plaguebreaker 56, Supernova 64, Toxic 54, Venom 64;
Starburst menggunakan footprint Star Cannon yang sudah ada.

## Kelima map yang diterapkan

Semua route single-entry/single-exit yang terhubung dengan sudut membulat.
Spawn tetap (132,220), Finish tetap (132,1012). Tidak menambahkan split-path
mechanics yang tidak didukung sistem movement existing. Semua memakai motif
celestial, batas path jelas, ground gelap dan dekorasi di luar ribbon gameplay.

| Chapter | Map / karakter | Panjang route | Belokan | Prop aktual | Preview native |
| --- | --- | ---: | ---: | ---: | --- |
| 1 | Emberfall: basalt hangat, obsidian, geothermal vents, lava pada fringe luar | 9245.4946 | 12 | 11 | [Emberfall](validation/chapter-1.png) |
| 2 | Nebula: violet/blue shelves, kristal existing, eastern hairpin | 9690.4103 | 14 | 7 | [Nebula](validation/chapter-2.png) |
| 3 | Reliquary: cyan frost, cryogenic vault, dua hooked corridors | 9095.3261 | 16 | 16 | [Reliquary](validation/chapter-3.png) |
| 4 | Astral Ruins: gold pylons, temple courtyards, offset avenues | 9639.3261 | 16 | 10 | [Astral Ruins](validation/chapter-4.png) |
| 5 | Shattered Belt: asteroid terraces, mining terminals, staggered switchbacks | 9599.3261 | 16 | 15 | [Shattered Belt](validation/chapter-5.png) |

Panjang baru hanya sekitar 0.9–7.0% lebih pendek dari route lama. Tidak ada chapter
yang dipersulit dengan memotong perjalanan secara ekstrem. Perbedaan lane spacing,
hook dan obstacle mengubah peluang coverage. Satu posisi tidak otomatis menjadi
posisi terbaik di semua chapter.

Emberfall memberi belokan lebih sedikit dan teras awal lebar. Nebula memisahkan
outer approach dan inner return sehingga pertahanan perlu tersebar. Reliquary
menciptakan kantong firing terpisah. Astral Ruins menuntut pemilihan courtyard dan
spesialisasi anti-boss. Shattered Belt menggabungkan jalur tidak rata, keterbatasan
ruang dan ekonomi late campaign yang sudah ada. Lava dan detail terang tidak
menandai hazard baru: mereka berada pada fringe non-buildable atau cluster blocker.

Scene editor tetap menggunakan template shared yang lama. Saat run dimulai,
`CampaignConfig.Chapters[].MapId` memilih `ChapterMaps.Maps`, kemudian road,
ground, props, native waypoints dan placement menggunakan geometry tersebut.
Preview langsung Game Scene menggunakan Emberfall dengan aturan sandbox lama;
peluncuran melalui Levels menggunakan Gold/wave misi, misalnya 420 Gold untuk 1-1.

## Placement dan perbaikan selama iterasi

Sample lattice yang sama dipakai pada setiap map (24 world units horizontal,
20 vertikal). Setiap kandidat diperiksa oleh validator placement native, termasuk
road, portal, tower footprint, surface dan blocker. Jumlah berikut saling overlap,
**bukan** kapasitas Tower yang dapat dibangun bersamaan.

| Chapter | Star | Bloom | Meteor | Plague | Supernova | Toxic | Venom |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 465 | 102 | 109 | 190 | 106 | 199 | 106 |
| 2 | 301 | 94 | 105 | 164 | 98 | 172 | 98 |
| 3 | 371 | 145 | 177 | 201 | 156 | 208 | 156 |
| 4 | 355 | 115 | 135 | 142 | 122 | 147 | 122 |
| 5 | 314 | 95 | 108 | 133 | 102 | 138 | 102 |

Iterasi Nebula membuka dua corridor dan mengurangi props yang menutup lokasi
Bloom. Astral Ruins memperpanjang avenue tengah, merapikan lower return dan
mengurangi props aktual dari 13 menjadi 10: lokasi Star meningkat 312→355 dan
Bloom 102→115. Tidak mengubah footprint Tower untuk mengejar jumlah lokasi.

Penghapusan instance prop saat runtime memakai salinan daftar sebelum iterasi,
agar native deletion tidak menyebabkan prop selang-seling tertinggal. Ground
berbasis konfigurasi dimuat melalui native image manager sebelum `setTexture`;
ini mengatasi texture fallback saat resource path tidak terdeteksi scene preloader.
Load callback dijaga terhadap scene yang sudah di-unload.

## Progression dan balance combat alami

Urutan unlock tetap 1-1→1-5→2-1 dan seterusnya sampai 5-5. Boss harus benar-benar
dikalahkan. Replay, defeat, restart, tutorial flags dan discovery save dipertahankan.
Future chapters memiliki kapasitas konfigurasi 8 dengan hanya 5 released chapters;
tidak ada tombol/misi palsu untuk Chapter 6–8.

Benchmark whole mission memakai **native combat, harga asli dan income kill asli**.
Tidak memberikan Gold tambahan atau damage fixture. Unlock save hanya disiapkan
dalam profil browser terisolasi agar setiap misi dapat dipilih. Dua kebijakan awal:
Star Cannon berorientasi speed dan kombinasi Star/Bloom berorientasi area. Pembelian
tersebar di beberapa bagian route, lalu membeli upgrade lewat handler native.
Setiap wave dan transaksi Gold direkonsiliasi. Ini AI sederhana, bukan strategi optimal.

Misi 1, 3 dan 5 per chapter diuji sampai seluruh wave atau kekalahan. Misi 1-1 memakai
dua test khusus 15 wave. Artinya 15 misi berbeda mendapat combat alami; misi 2 dan
4 per chapter belum semuanya dimainkan tanpa fixture. Hasil kalah tidak disembunyikan.

| Chapter / misi awal–tengah–boss | Mixed area: Lives akhir | Cannon speed: Lives akhir |
| --- | --- | --- |
| 1: 1-1 / 1-3 / 1-5 | 11 / 20 / 20 | 7 / 20 / 20 |
| 2: 2-1 / 2-3 / 2-5 | 18 / 18 / 18 | 18 / 18 / 18 |
| 3: 3-1 / 3-3 / 3-5 | 16 / 16 / 16 | 16 / 16 / 16 |
| 4: 4-1 / 4-3 / 4-5 | 14 / 14 / kalah pada boss | 14 / 14 / 14 |
| 5: 5-1 / 5-3 / 5-5 | 12 / 12 / 12 | 12 / 12 / 12 |

Matriks final berisi 29 kemenangan dari 30 kombinasi misi–policy. Angka ini hanya
hasil test deterministik tersebut, bukan estimasi win rate pemain. Untuk Chapter 4,
hasil retest map final menggantikan hasil geometry awal pada laporan spread.

Untuk Chapter 4, kebijakan mixed yang terlalu menyebar dan percobaan focused
tetap kalah pada boss, meskipun seluruh escort wave selesai tanpa kehilangan Lives.
Kebijakan cannon berorientasi speed pada map final juga selesai dengan 14 Lives,
belanja 9080 Gold dan bank 2111. Kebijakan cannon berorientasi damage
menyelesaikan 4-5 dengan **14 Lives**, belanja
9100 Gold dan bank akhir 2091, tanpa fixture Gold/damage. Terdapat strategi menang
pada map final, tetapi toleransi terhadap build area/support perlu playtest lanjutan.

Benchmark mixed identik pada map lama memenangkan 4-5 dengan 14 Lives. Jadi ada
perubahan nyata pada kebutuhan coverage/spesialisasi; tidak mengklaim keseimbangan
strategi identik dengan map lama. Dua kebijakan generik awal juga menghasilkan
kekalahan pada beberapa misi akhir sebelum penempatan pertahanan diperbaiki.
Semua laporan percobaan tetap disimpan sebagai bukti diagnostik.

1-1 tetap lebih panjang daripada misi chapter awal lainnya karena rework 15 wave
yang sudah ada sebelum pekerjaan ini. Kebocoran wave 5–8 pada kedua strategi
menandakan onboarding/economy perlu ditinjau bersama pemain baru. Tidak mengubah
reward/HP diam-diam untuk menghasilkan angka kemenangan yang lebih bagus.

## Pengujian yang benar-benar dijalankan

| Pemeriksaan | Hasil / batas bukti |
| --- | --- |
| Native GDevelop parser/compiler/export | 3 scene, 87 event Game Scene, 0 scene diagnostics; preview berjalan di Chrome headless |
| Chapter scope / resource / source | 114 pemeriksaan scope + 6844 pemeriksaan struktur/resource lolos |
| Historical campaign / stage / labyrinth / Fusion validators | Lolos; normalisasi chapter yang diizinkan diperiksa lagi oleh scope audit ketat terhadap `e59ded3` |
| Geometry + movement native | 97 assertions; 6 archetype × 5 map mencapai Finish, semua heading/animation phase, collider tetap, Golem casting tetap; exactly 6 arrivals mengurangi 6 Lives per map |
| Paid Tower placement/sale | Star di semua map; Bloom pada misi yang opening Gold-nya cukup; footprint overlap dan road ditolak; sale refund sekali |
| 1-1 natural combat | 143 assertions per strategi; 15 wave selesai, 11 / 7 Lives; pause, speed, insufficient Gold, kill/clear reward diperiksa |
| Representative whole missions | Semua wave misi 1/3/5; menang dan kalah dicatat, Gold direkonsiliasi; bukan semua 25 misi natural playtest |
| Campaign progression | 122 assertions, semua 25 mission contracts, onboarding, next/restart/defeat/save; memakai accelerated kill fixture setelah engagement nyata pertama |
| Lima boss skill/reward | 74 assertions; stationary cast, shield/buff expiry, reserves dan reward sekali; memakai forced thresholds, bukan win-rate test |
| Pure Fusion late campaign | 20 assertions pada 5-5: pair 5-2/2-5 benar-benar dibeli 22490 dari finite pre-boss-income fixture 27307, 0.5× placement, source consumed, discovery tersimpan |
| Six Fusion recipe transaction matrix | 234 assertions; 12 transaksi forward/reverse, region, cancel, invalid Gold, atomic result, Index, sale dan rig cleanup |
| Fusion E1–E3 combat | 161 assertions; muzzle, projectile, native Health/armor/poison, AoE, evolution/sell, damage accounting dan audio manager; enemy/Gold fixtures terisolasi |
| Adaptive archive extension fixture | 5 assertions; unlock satu variant tidak meng-unlock tiga lainnya, Index cryptic state tetap; tidak mengaktifkan konten Adaptive baru |
| Star Cannon native regression | 731 checks, 0 console exceptions |
| Void Golem native regression | 552 checks, 0 console exceptions |
| Levels resize | 1280×720→960×540→640×360→1920×1080→1280×720; layout, hover, tutorial dan instance reuse lolos; native minimize/restore serta invalid-size simulation diperiksa |
| Game Scene resize | Urutan viewport yang sama; Shop/HUD, Index 3 kategori, Selected Panel, Fusion 0.5×, toast, audio panel dan CSS mouse input lolos; restore tidak memperbesar geometri |
| Discovery queue | 18 assertions; monster/Pure/Hybrid variant fixture ditampilkan FIFO satu panel, pause Index dan real-time 0.5× benar |
| Celestial Sonar | Native real-route ETA, upstream false-positive rejection, satu global voice, repeat Warning 6 detik / Critical 3 detik, pause/resume, Tactical 0.5×, stationary Golem, mute/volume dan Finish damage lolos |
| Visual inspection | Kelima screenshot native diperiksa; HUD, shop, portal, jalan dan props terlihat di dalam frame |

Laporan browser final yang berhasil tidak memiliki console error. Compiler bawaan
memberi peringatan include Health sebelum maintained exporter memasok bundle
native Health yang benar; native combat/HP tests kemudian benar-benar dijalankan.
Tidak membuka UI editor GDevelop secara manual; kompatibilitas dibuktikan parser,
compiler dan runtime native, bukan klaim klik manual editor.

## Skor diagnostik 1–10

Skor berikut penilaian engineering sementara, **bukan hasil survei atau win rate**.
Angka lebih tinggi berarti lebih dekat pada target desain. Human enjoyment,
learning curve dan fairness semua skill level tetap **UNVERIFIED**.

| Kategori | Skor | Dasar penilaian |
| --- | ---: | --- |
| Map readability | 9 | Jalan berkontras jelas, satu centerline, tidak ada self-intersection |
| Tile-to-Monster proportions | 8 | Paving persegi, path 60, render 0.9; Elite sengaja lebih besar |
| Tower-to-Monster proportions | 8 | Art Tower tetap, render enemy lebih kecil; perlu lihat crowded combat secara manusia |
| Path width | 8 | Cocok dengan collider 48/64 dan batas placement; tidak memperbesar collider |
| Placement opportunities | 7 | Semua footprint punya lokasi valid; Bloom/Fusion lebih terbatas daripada Star |
| Monster movement | 9 | 30 traversal native, empat arah, casting/arrival valid |
| Tower targeting / muzzle | 9 | Combat natural, Star regression dan Fusion E1–E3 native |
| Early-wave difficulty | 7 | Bisa menang dua strategi, tetapi 1-1 kehilangan 9/13 Lives |
| Mid-wave difficulty | 7 | Representative missions selesai; banyak perfect-defense hasil policy otomatis |
| Late/boss difficulty | 6 | Boss Chapter 4 sensitif pada komposisi; membutuhkan human playtest |
| Overall chapter difficulty | 7 | Semua chapter punya strategi menang; kurva tidak terbukti sempurna |

| Chapter | Readability | Placement | Kesulitan sesuai target, provisional |
| --- | ---: | ---: | ---: |
| Emberfall | 9 | 8 | 7 |
| Nebula | 9 | 7 | 8 |
| Reliquary | 9 | 8 | 8 |
| Astral Ruins | 9 | 7 | 6 |
| Shattered Belt | 9 | 7 | 7 |

Bloons TD 6 dipakai sebagai acuan prinsip keterbacaan, kombinasi Tower, upgrade,
map dan boss, bukan sumber artwork atau angka balance. Konteks publisher:
[Bloons TD 6 di Steam](https://store.steampowered.com/app/960090/Bloons_TD_6/).

## Performance dan batas yang belum teruji

26 SVG final baru berukuran sekitar 280 KB total; 5 ground 128×128, 5 road
1704×1008 dan 16 prop 64×64. Semua terdaftar dan digunakan. Chapter backdrops
existing diganti dengan lima komposisi bertema pada ukuran 1280×720 yang sama.
Tidak menambah loop particle. Satu Graphics ornament statis dibuat per scene dan
dibersihkan saat unload; prop count turun dari 28 ke 7–16. Scene memakai satu road
dan satu ground; tidak menumpuk lima environment. Ground hanya dimuat untuk
chapter terpilih. Native sprite preloader masih dapat memuat semua road/prop
animations yang terdaftar; ini bukan streaming asset penuh per chapter.

FPS, VRAM dan heap selama sesi beberapa jam di perangkat target **belum diukur**.
Bounded Fusion test mencatat peak 4 projectile, 4 zone, 11 effect, 8 scheduled
actions dan 6 audio voices; ini bukan bukti FPS untuk wave paling padat.

Perlu tes manual: misi 2/4 semua chapter tanpa fixture, pemain baru 1-1, alternatif
mixed/support pada boss 4-5, funding Fusion/Evolution dalam run penuh, readability
HP bar/status ketika penuh VFX, keyboard/mouse pada resolusi kecil, audio listening
dan exported build pada perangkat target. Adaptive variants yang sebelumnya
dinonaktifkan tidak diaktifkan; hanya kompatibilitas archive extension diuji.

Validator kebersihan direktori penuh masih menolak `Tower Defense.json.autosave`
yang sudah ada sebelum task. File tersebut tidak dibuat, diubah atau dihapus.
Validasi struktur/resource terpisah lolos. Tidak ada backup baru, salinan source,
backup branch atau perubahan Git history. Folder `.idea/` milik pengguna dibiarkan.

## File, scene, object dan event yang berubah

- `Tower Defense.json`: 26 registrasi resource map final dengan path relatif.
- `layouts/game-scene.json`: satu variable struktur `ChapterMaps`, lima animasi
  `Monster_Path`, 16 animasi `Ground_Decoration`, dan enam source event layout/render
  yang disinkronkan. Nama object, instance authored, layer dan event lain tetap.
- `layouts/levels.json`, `tools/campaign-config.json`: chapter name/description,
  MapId/status dan kapasitas future chapters; semua misi/boss tetap.
- `tools/responsive-map-runtime.js`: pilih map, pasang route/props/portal/ground.
- `tools/island-map-runtime.js`: terrain tint, themed prop, cliff tint, ornament.
- `tools/island-render-runtime.js`, `nova-wisp-runtime.js`, `void-hound-runtime.js`,
  `void-golem-runtime.js`: tambahan render-only multiplier 0.9.
- `tools/levels-runtime.js`: satu caption onboarding menunjuk Emberfall.
- `assets/map/chapters/`: 26 asset SVG final; `assets/ui/campaign/chapter_1.svg`
  sampai `chapter_5.svg`: backdrop chapter.
- `tools/chapter-maps.json`, `build-chapter-maps.py`, `validate-chapter-maps.py`,
  `chapter-map-qa.js`, `chapter-balance-qa.js`: konfigurasi/build/audit/test berulang.
- Maintained validator `validate-labyrinth.py`, `validate-stage-progression.py`,
  `validate-fusion-pack.py`: menerima tambahan chapter yang dibatasi scope audit.
- Fixture `campaign-qa.js`, `campaign-fusion-qa.js`, `fusion-evolution-combat-qa.js`:
  memilih titik legal pada geometry baru, tidak memodifikasi gameplay.
- `AGENTS.md`, `BALANCE_WORKFLOW.md`, `tools/campaign-reference.py`,
  `CAMPAIGN_LEVEL_REFERENCE.md`: prosedur continuous review dan referensi terbaru.
- `validation/chapter-*.json` dan lima PNG: hasil pemeriksaan/preview, tanpa salinan
  JSON project atau asset untuk pemulihan.
