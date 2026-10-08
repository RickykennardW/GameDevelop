# Gameplay rescale dan environment Celestial Void

Implementasi melanjutkan versi terakhir setelah FULLSCREEN_SCALE.md. Backup sebelum
perubahan: `backups/pre_celestial_rework_20261009.zip`, 152 file, sekitar 29.9 MB;
integritas ZIP sudah diperiksa. Analisis dan preview skala dilakukan sebelum penataan
environment. Project tidak ditulis ulang seluruhnya.

## Hasil skala

Sebelumnya pembesaran kamera saja dibatasi kebutuhan menampilkan lima baris jalur.
Sekarang render sprite, footprint, lebar jalan dan komposisi map diatur terpisah.
Konfigurasi berada di awal `tools/responsive-map-runtime.js`, pada `__worldStyle`.
RenderScale footprint diinisialisasi dari konfigurasi tersebut agar ghost, anchor
sprite, tower sebenarnya dan renderer memakai nilai yang sama. AttackRange tetap
berasal dari stat gameplay lama.

| Kelompok | Render scale lama | Render scale baru |
|---|---:|---:|
| Basic / Heavy / Advanced | 1.25 | 1.8 |
| Archer, seluruh 21 kombinasi state | 1.5 | 2.25 |
| Monster, seluruh archetype | 1 | 1.55 di atas scale archetype lama |
| Bullet / RocketBullet | 1 | 1.2 |
| Archer projectile | 1.8 | 1.8 |
| Spawn Portal | 4 | 5.2 |
| Base Nexus | 1.65 | 2.15 |
| Crystal | 1.22 | 1.65 |
| Rock | 1.27 | 1.75 |
| Moon Garden / Crescent Ruin | 1.8 | 2.3 |
| Purple foliage | 1.24 | 1.65 |

Ukuran sprite logis dan hitbox monster/projectile tetap sama. Render dilakukan lewat
PIXI setelah native frame update; scaling visual tidak mengubah HP, speed, collision
damage atau stat. Filtering pixel art lama dipertahankan; texture environment tetap
memakai filtering linear/mipmap yang sebelumnya diterapkan. PNG/SVG sumber tidak
diubah dan tidak ada asset tower/monster yang diganti.

| Ukuran di viewport | Sebelum | Sesudah |
|---|---:|---:|
| Full HD path | 56.6 px | 77.4 px |
| Full HD tower umum, lebar canvas | 70.7 px | 101.3 px |
| Full HD Archer, lebar canvas | 84.8 px | 126.6 px |
| Full HD monster pada archetype yang sama | 100% | sekitar 154% |
| QHD path | 76.1 px | 106.6 px |
| QHD tower umum | 95.2 px | 139.6 px |
| QHD Archer | 114.2 px | 174.5 px |

Ukuran canvas termasuk bagian transparan sprite; detail opaque lebih kecil. Tidak
ada klaim kecocokan piksel dengan screenshot Bloons, yang tidak terlampir kembali
di permintaan ini. Acuan proporsi digunakan secara kualitatif dan hasil diukur pada
runtime project sendiri.

## Layout, kamera dan waypoint

Jalan 64 menjadi 88 unit dunia, menggunakan skin ivory/gold dan belokan rounded
yang sama. Tile, sudut, cap, blocker ribbon dan titik tengah semuanya mengikuti
ukuran sebenarnya. Blocker road sudah mendukung skala lebar/tinggi tile dari bentuk
normalisasi 64, sehingga tidak perlu mengubah bentuk dasarnya atau logic movement.

Layout berubah dari lima menjadi empat lintasan zig-zag. Rute lengkap memiliki 82
tile, X kiri 88, X kanan 1672, dan baris Y 176/440/704/968. Celah lantai antarjalan
176 unit memberi ruang bagi footprint baru dan struktur. Semua endpoint terlihat;
Base sekarang berada di ujung kiri bawah, mengikuti tile terakhir. Tidak ada bagian
rute yang disembunyikan. Geometri ini dijelaskan sebelum implementasi.

Panjang rute 7128 unit, sebelumnya 7168: berkurang 40 unit atau 0.56%. Speed tetap
sama, sehingga waktu tempuh juga berbeda sekitar 0.56%. Jumlah belokan dan posisi
strategis berubah; pengalaman bermain tidak diklaim identik meski seluruh angka
balancing dipertahankan. Eksperimen awal 80-unit yang lebih pendek diganti oleh
layout final ini untuk menjaga durasi traversal mendekati versi sebelumnya.

Kamera hanya mengikuti batas statis seluruh artwork, bukan posisi mouse, tower atau
panel. Full HD zoom .8836 menjadi .8793; QHD 1.1895 menjadi 1.2116. Pembesaran utama
berasal dari ukuran world object dan jalan, bukan pembesaran UI. Tower Shop tetap
224 piksel; gap 10 dan margin kanan 8; area gameplay berakhir pada X 1678 di Full HD.
HUD, Index, Play dan panel kiri/kanan memakai layer/kamera terpisah seperti sebelumnya.

## Environment di lantai

Tiga band lantai mendapat kelompok asimetris crystal/rock/moon ruin/foliage. Susunan
berulang satu baris untuk setiap band diganti dengan cluster bergantian; dua cluster
kecil juga mengisi lantai atas. Crystal, broken pillars, crescent dan stone circle
memakai artwork yang telah tersedia pada Moon Garden dan Crystal Cluster.

Ada 20 Ground_Decoration: 12 struktur utama lama ditata ulang dan 8 satellite baru,
terdiri atas 2 rock kecil, 2 crystal kecil dan 4 foliage. Total 13 solid structure
dan 7 foliage non-blocking; Spawn/Base menambahkan 2 blocker. Satellite memiliki
LocalScale sendiri dan memakai object/resource native yang sudah valid. Tidak ada
resource baru dan tidak ada placeholder persegi sebagai artwork environment.

Setiap elemen mendapat contact shadow ellipse lembut pada kaki. Fragmen/vegetasi
dari artwork lama dan satellite menghubungkan cluster dengan lantai. Cliff luar
memakai sumber yang sama pada skala .32, sebelumnya .50: lebih rendah dan tidak
mendominasi seperti pagar. Perimeter proporsional, terrain underlap dan region
cliff tetap dipertahankan. Struktur utama kini berada di lantai, sementara edge
masih menunjukkan pulau melayang.

Depth mengikuti kaki struktur, ground center tower dan kaki monster. Health bar
dan projectile berada di atas world object; UI tetap pada layer tersendiri. Shadow
terikat pada native cliff owner di bawah path/struktur. Tidak ada contact shadow
yang ikut menjadi collision obstacle.

## Footprint dan blocker

Radius Tower 32→40, Heavy 40→48, Advanced 34→42, Archer 36→44. Anchor normalisasi
tidak diubah; render scale baru digunakan untuk offset sprite, termasuk semua state
Archer. FootprintX/Y tetap posisi world placement yang otoritatif. Ghost dan hasil
placement memakai scale/offset yang sama; circle range tetap memakai AttackRange
lama dan pusat yang sama dengan footprint.

Solid props menggunakan circle envelope dari contour sumber, dikalikan render scale
Kind dan LocalScale. Moon Garden memiliki alas melingkar, sehingga tetap memakai
circle konservatif dari contour, bukan polygon baru yang berbeda dari ring visual.
Validator dan outline selalu berasal dari circle yang sama. Cliff memakai region
polygon dari potongan artwork yang sama; path memakai scaled ribbon/quarter-arc
polygon. Foliage tidak memblok placement.

Pengujian sampler menemukan ratusan posisi fractional valid untuk setiap tipe tower
di viewport pengujian. Nilai ini adalah sampel yang saling dapat overlap, bukan jumlah
tower yang bisa dibangun bersamaan. Bend pockets dan sebagian strip tengah tetap
dibiarkan kosong. Seluruh bounding rectangle render 20 prop bebas dari bounding
tile jalan, termasuk sprite besar dan satellite.

## File dan event

- `layouts/game-scene.json`: hanya root events dan nilai Radius/RenderScale pada
  TowerFootprints. Definisi object, instance awal, layer, group dan variable lainnya
  tidak berubah.
- Event 0: konfigurasi, layout, framing, penataan floor; event 6: scale blocker;
  event 14: posisi/ukuran health bar; event 15: sprite scaling, shadow/depth;
  event 17: scale ghost dan Z-order preview. Pada event 10 child 8, satu nilai
  Archer visualScale kini membaca konfigurasi; perhitungan muzzle mengikuti sprite.
- Source: responsive-map-runtime.js, island-map-runtime.js, island-render-runtime.js,
  free-placement-runtime.js, free-placement-rings.js; semuanya ditanam kembali lewat
  embed-free-placement.py. selected-panel-runtime dan free-placement-click tidak berubah.
- `assets/celestial_void/manifest.json`: metadata skala/layout terbaru.
- Test baru: test-celestial-rework.js dan test-celestial-rework-live.py.

Audit ZIP memastikan Tower Defense.json, seluruh resource dan file PNG/SVG sumber
identik. Wave manager, movement, targeting, damage, harga, investment, upgrade rule,
sell, reward +100 dan semua event combat selain konfigurasi visual Archer identik.
Label SPAWN/BASE tetap tidak ada.

## Pengujian yang benar-benar dijalankan

Native GDevelop parser/extension compiler/scene compiler dan export preview Pixi
berhasil: nol diagnostik scene. Runtime dijalankan di Chrome lokal, tidak hanya
memeriksa syntax JSON.

- Environment, waypoint, empat purchase, ruang placement dan scale ghost: 73 PASS.
- Regresi seluruh 50 wave, composition, speed/HP/reward, damage, cadence dan victory:
  419 PASS.
- Archer seluruh state/cross-path, combat, projectiles dan sell: 170 PASS.
- Circle/blocker, tangent invalid/valid, panel dinamis dan sell: 84 PASS.
- Health bar seluruh archetype dan 160 monster, damage, movement, destruction: 51 PASS.
- Manual/Auto/1x/2x, Index, bonus dan purchase/sell: 64 PASS.
- Native mouse/key/Fullscreen API, panel kedua sisi, resize, lingkaran dan PLAY:
  34 PASS, termasuk Full HD/QHD/960x540/800x480 dan seluruh cliff tetap terlihat.
- Screenshot showcase: keempat tower dibeli/diletakkan lewat native input dan
  monster/projectile terlihat pada gameplay nyata.

Fixture lama yang mengasumsikan rows[4] atau radius 36 diperbarui untuk layout dan
radius final. Assertion balancing lama tetap dipertahankan. Log lengkap, metric JSON
sebelum/sesudah dan screenshot tersedia di `design_previews/celestial_rework/`.

Fullscreen API benar-benar dimasuki dalam uji browser headless; Full HD/QHD adalah
emulasi ukuran viewport. Belum ada pemeriksaan manual pada monitor fisik. Tidak ada
kegagalan pengujian final yang diketahui; perubahan jumlah belokan/layout dan selisih
waktu tempuh 0.56% adalah batas yang perlu dipertimbangkan saat playtest berikutnya.
