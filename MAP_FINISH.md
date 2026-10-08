# Map finishing dan rocky placement regions

Masalah lama berasal dari satu cliff frame yang diperbesar mengikuti viewport. Alpha pocket sisi frame tidak tersambung ke terrain, sedangkan tepi bawah gambar berisi batu/foliage yang berada di bawah jalur terakhir. Membesarkan gambar itu juga membuat beberapa cliff terpotong.

`tools/island-map-runtime.js` kini merender perimeter dari crop asset Cliff_Frame existing. Corner dan edge memakai skala seragam 0,5; edge panjang diulang, dan hanya potongan terakhir dipotong sesuai panjang sisa. Tidak ada bitmap yang diubah atau stretch nonuniform. Satu object native IslandCliffFrame menjadi owner layer/Z-order bagi child sprite PIXI cropped, sehingga source-frame sizing GDevelop tidak merusak proporsinya. Texture cache/child berlebih dibersihkan ketika jumlah segmen berubah.

Perimeter ditempatkan di luar bounding route dengan clearance 16 world px di kiri/kanan/bawah; bagian atas mempunyai ruang untuk portal. Terrain mask memakai underlap 32 px di bawah bagian dalam frame, menutup alpha pocket/celah tanpa menutup nebula di luar pulau.

Jalur terakhir dinaikkan satu tile 64 px pada generator layout existing. Pola lima baris zig-zag tetap sama; rute berkurang satu segmen vertical tile. Posisi Base dan dekorasi pada sela baris bawah dihitung ulang dari rows oleh pipeline existing. Waypoint dihasilkan dari Monster_Path aktual, bukan koordinat artwork yang terpisah. Semua tile tetap 64x64 dengan corner/cap existing.

Framing statis map memakai padding kiri/kanan 128, atas 96, dan bawah 120 world px agar cliff masuk ke viewport. Kamera tetap berdasarkan map statis; tower, cursor, panel, dan placement tidak ikut auto-fit. UI/resize logic tetap dipakai.

## Blocker

Delapan belas region polygon berbentuk rectangle mencakup potongan rocky perimeter. Validator circle-vs-polygon memeriksa footprint tower terhadap semua region tersebut. Inner soil polygon juga mensyaratkan seluruh footprint tetap di dalam tanah, sehingga terrain underlap/rock fringe/void tidak menjadi tempat membangun. Blocker region tidak bertumpuk dengan tile road.

Circle radius tower medium, collision antar-tower, obstacle circle individual, Spawn/Base, canonical center, preview valid/invalid, single placement, cancel, selected panel, serta attack range tidak berubah. Ground props tetap memakai circle authoritative sebelumnya; cliff kontinu memakai area region yang lebih sesuai. Tidak menambah object solid atau event pembelian kedua.

## Validasi

- 69 map finish checks: setiap region/render bounds sinkron, uniform scaling, seluruh region di luar route, semua rectangle render dekorasi clear dari tile jalan, waypoint/Base sync, area rock menolak pembelian tanpa Gold deduction, tanah kosong menerima fractional placement, kamera fixed.
- 419 pemeriksaan seluruh 50 wave, movement, composition, combat, reward +100, dan terminal wave lulus.
- 80 obstacle/panel checks, 170 Archer integration checks, serta 64 Manual/Auto/1x/2x checks lulus.
- 20 pemeriksaan mouse native pada 1280x800, 960x540, dan 800x480 lulus. Screenshot final diperiksa untuk tepi, gaps, jalur bawah, Base, dan UI.
- JSON/resource references valid; native GDevelop 5.6.283 compile/export 0 diagnostics.
- Audit perubahan hanya event roots 0 (layout/perimeter) dan 6 (region placement). Semua object definitions, resource files, scene variables, serialized instances, layers, stats, combat/upgrade/wave/sell events tetap sama.

Fixture lama menggunakan grid sampling 64 px yang tidak dapat menemukan sela valid untuk Heavy radius 40 pada beberapa lane. Fixture diganti dengan sampling posisi world pecahan tanpa mengubah collision. Untuk selection test yang tower-nya tertutup panel, panel ditutup lewat tombol X sebelum klik tower tersebut; input protection produksi tidak dihapus. Semua assertion regresi asli tetap dijalankan.

Laporan/screenshot: `design_previews/map_finish/`. Source test: `tools/test-map-finish.js`. Sumber responsive layout sekarang disimpan di `tools/responsive-map-runtime.js` dan ikut di-inline oleh `python tools/embed-free-placement.py`. Gold pada screenshot hanya fixture testing; starting Gold tetap 650. Tes 50 wave mempercepat spawn fixture untuk correctness, bukan playthrough strategi manusia.
