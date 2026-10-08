> Rework lanjutan telah mengganti ukuran dan obstacle collision menjadi circle authoritative, menampilkan footprint selected tower, serta menambah panel dinamis. Konfigurasi terkini: `MEDIUM_CIRCLES_PANEL.md`. Bagian berikut mencatat tahap kalibrasi alignment sebelumnya.

# Placement alignment dan blocked-area circles

Misalignment berasal dari offset kaki universal 24 px. Asset tower mempunyai proporsi, alpha padding, ukuran logical, dan render scale berbeda; khusus Advanced, gambar horizontal membuat offset tersebut meletakkan circle terlalu jauh di bawah sprite.

Scene variable `TowerFootprints` sekarang menyimpan titik pijakan normalized `AnchorX/Y`, RenderScale sebagai referensi kalibrasi render existing, serta radius per tipe. Cursor world, ghost, physical footprint, dan ring memakai titik pijakan yang sama. Sprite tetap memakai origin/center existing; penempatannya dihitung relatif terhadap titik pijakan. Attack range dan firing points mengikuti koordinat native tower seperti sebelumnya.

| Tower | Anchor pada source image | Radius baru |
|---|---|---:|
| Basic | (32, 52) dari 64x64 | 26 px |
| Heavy | (29, 94) dari 58x99 | 34 px |
| Advanced | (8, 4) dari 16x8 | 28 px |
| Archer | (272, 432) dari canvas 512x512 | 30 px |

Offset instance dihitung sekali dari anchor tersebut dan pembesaran render existing. Archer menggunakan reference base plane yang sama untuk semua 21 state visual; upgrade tidak mengubah footprint/anchor instance. Radius diperbesar 2–4 px dibanding versi sebelumnya. Padding antar-footprint tetap 2 px. Footprint circle adalah geometri placement tower; attack range tetap terpisah.

Event root 6 menghitung ghost dan footprint anchor. Root 9 memakai anchor yang sama saat membuat tower dan menyimpan `FootprintOffsetX/Y`. Root 17 mengelola visibility dan circle owner. `TowerBaseRing` existing dipakai ulang; tidak ada object/resource baru atau collision system duplikat.

Tiga crystal, tiga cosmic rock, tiga lunar ruin, Spawn, dan Base memiliki blocked-area ring pink-magenta. Prop rings mengikuti envelope contour polygon masing-masing ditambah 3 px; endpoint rings mengikuti ukuran visual ditambah 5 px. Radius berbeda sesuai bentuk/ukuran actual. Ring adalah referensi visual konservatif: geometry polygon obstacle dan blocker endpoint existing tetap menentukan validitas, sehingga tidak mengganti obstacle tidak beraturan menjadi collision lingkaran besar. Semak, nebula, dan stardust tidak mendapat blocker ring.

Semua build rings (existing tower, ghost, obstacle, Spawn/Base) hanya terlihat ketika builder aktif dan INDEX tidak menutup input. Successful placement, cancel ESC/klik kanan, dan normal selection menyembunyikan ring. Normal selection tetap menampilkan RangeIndicator existing. Owner maps menjaga satu ring per object dan membersihkan ring ketika owner dijual/dihapus.

Validasi native GDevelop 5.6.283 dan Chrome preview:

- 84 pemeriksaan alignment/visibility: transform pixel render ke ring center untuk empat tipe tower, seluruh 21 state Archer, Building/Normal/Selected modes, solid props, Spawn/Base, cancel, selling, serta collision.
- 18 pemeriksaan mouse native dengan screenshot empat tower dan perubahan mode.
- Regresi 61 free-placement checks, 127 builder/camera checks, 419 checks seluruh 50 wave/combat, 170 Archer checks, serta 64 checks Manual/Auto/1x/2x lulus.
- JSON dan source-reference audit valid; native compile/export berhasil dengan 0 diagnostics.

Object definitions, map/resources/instances/layers, UI, combat, upgrade, fixed camera, wave, reward +100, serta semua scene variables selain kalibrasi TowerFootprints dipertahankan. Screenshot dan laporan ada pada `design_previews/build_circles/`. Source pengujian khusus: `tools/test-build-circles.js`. Gold tambahan dalam screenshot hanya fixture testing; starting Gold tetap 650.
