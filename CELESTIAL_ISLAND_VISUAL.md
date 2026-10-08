# Celestial Void floating island visual upgrade

Target visual menggunakan gambar pengguna yang disimpan di `design_previews/island_upgrade/Reference.png`. Implementasi memakai artwork berlapis dan road modular; bukan screenshot referensi yang menggantikan sistem map.

## Asset dan layering

Lima bitmap baru dibuat dengan built-in `image_gen.imagegen` dan disimpan di `assets/celestial_void/island/`. Prompt lengkap dan lokasi keluaran asli tersimpan pada `generation-prompts.json`.

- `Nebula.png`: void/nebula ungu gelap, bintang, serta pecahan pulau jauh. Mengganti texture VoidBackdrop existing, di bawah terrain.
- `Terrain.png`: painted rocky soil slate-purple. `terrain-repeat.svg` memakai mirrored repeat sehingga sambungan edge kontinu tanpa mengubah bitmap asli. Ground_Map existing benar-benar memakai texture ini; old ground tidak disembunyikan di bawahnya.
- `Cliff_Frame.png`: overlay perimeter transparan dengan tebing batu menggantung, foliage, dan kristal. Satu object visual `IslandCliffFrame` mengikuti framing map; tidak masuk group collision/combat atau auto-fit camera.
- `Moon_Garden.png`: crescent ruins, moonstone platform, pilar, kristal kecil, dan foliage. Mengganti animasi Ruin pada tiga obstacle existing. Render scale 1,8; logical size/positions tetap.
- `Purple_Foliage.png`: low purple foliage untuk tiga Shrub existing, tetap nonblocking. Resource baru memakai alpha transparan asli.

Ground memakai outline mask organik untuk mengekspos nebula di sisi/di bawah tebing. Layer order: nebula -20, terrain -10, cliff frame -7, obstacle props -5, road 0, lalu indicator/tower/enemy/projectile serta UI existing. Filtering/mipmap pada prop membantu detail tetap terbaca pada ukuran runtime.

## Jalan

Sepuluh SVG road existing diperbarui menjadi batu ivory/cream dengan mortar brick pattern, border gold, serta astral ornaments. Corner rounded dan end-cap memakai geometry/stroke outer 64 px yang sama. Dua texture plain H/V ditambahkan; empat frame statis pada animasi H/V membuat ornament tampil setiap empat tile. Semua frame berukuran 64x64 dan memakai mask/origin yang sama. Road dihentikan pada frame yang dipilih berdasarkan PathOrder; tidak menambah animasi bergerak atau mengubah route.

## Spawn dan Base

Artwork portal/nexus yang sudah sesuai tema tetap dipakai, dengan render scale Spawn 4,0 (sekitar 128 world px) dan Base 1,65 (132 world px). Ukuran logical 32/80 dan native collision endpoint untuk movement/base logic tetap sama. Label ditempatkan di atas artwork agar tidak bertumpuk.

## Penyesuaian placement yang diperlukan

Sistem free placement, canonical center, radius tower medium, single placement/cancel, dan circle-to-circle tetap dipakai. Hanya data visual blocker disinkronkan:

- Ruin contour profile diperbarui untuk silhouette moon garden dan render scale 1,8.
- Spawn blocker mengikuti render 4,0 dengan radius 75 px; Base mengikuti render 1,65 dengan radius 77 px.
- Footprint harus berada sepenuhnya di dalam polygon shoreline yang sama dengan mask terrain. Ini mencegah placement pada void/cliff fringe yang kini terlihat. Collider jalan rounded tetap sama.

Solid obstacle count tetap sembilan ditambah Spawn/Base. Circle visual dan validator membaca fungsi blockedCircle yang sama. Cliffs/background adalah scenery fringe dan batas terrain, tidak menambah obstacle placement terpisah. Tower/Archer/Enemy stats, harga, wave composition, attack/upgrade logic, reward +100, creation/payment handler, selection/range system, serta UI dan responsive camera code tidak berubah.

## Validasi

- 25 checks hybrid island: asset active, tidak ada ground/background duplikat, outline mask, tile/waypoint alignment, classification, circle/artwork sync, dan shoreline.
- 80 circle/dynamic panel checks; 60 canonical center/all Archer visual state checks.
- 419 checks seluruh 50 wave/movement/combat/reward; 170 Archer integration checks; 64 Manual/Auto/1x/2x checks lulus.
- 20 mouse native/UI/resize/placement checks pada 1280x800, 960x540, dan 800x480 lulus. Screenshot gameplay final diperiksa secara visual.
- Native GDevelop 5.6.283 load/compile/export berhasil, 0 diagnostics. Seluruh JSON/resource/image references dan SVG XML valid.
- Audit memastikan semua scene instances, waypoints, variables, layer definitions, object groups, tower/enemy definitions, dan event gameplay/UI lainnya tetap sama.

Screenshot dan laporan tersedia pada `design_previews/island_upgrade/`. Gold tambahan pada screenshot adalah fixture testing; starting Gold tetap 650. Tes 50 wave memakai fixture spawn yang dipercepat untuk correctness, bukan playthrough strategi manusia.

Source map visual dan filtering tersedia di `tools/island-map-runtime.js` dan `tools/island-render-runtime.js`. Keduanya di-inline oleh `python tools/embed-free-placement.py` bersama sumber placement/UI existing.
