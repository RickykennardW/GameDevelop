# Celestial Void implementation

Scene `Game Scene` memakai tema Celestial Void berdasarkan konsep terpilih di `design_previews/nova_map/Nova_Celestial_Void_Preview.png`. Project tetap memakai file utama `Tower Defense.json` dan scene terpisah `layouts/game-scene.json`.

## Map dan asset

- `Ground_Map` memakai tile ground ungu gelap seamless; `VoidBackdrop` menambahkan nebula dan bintang tipis di batas ground.
- `Monster_Path` memakai 10 skin modular: horizontal, vertical, empat belokan rounded, dan empat end-cap. Skin dipilih dari adjacency `PathOrder`. Instance, koordinat waypoint, footprint 64 px, dan collision tetap sama.
- `SpawnMarker` menjadi portal kosmik; `BaseMarker` menjadi crystal nexus. Ukuran fisik dan area collision endpoint tetap sama. Pembesaran hanya pada render.
- `Ground_Decoration` memakai 12 posisi existing: tiga kristal, tiga batu, tiga reruntuhan, dan tiga semak. Dekorasi tetap di luar jalan.
- `GrassGround` dan `Ground_Tilemap` yang tidak digunakan sudah dilepas dari definisi/folder scene. Ground aktif diganti pada object existing; tidak ada map lama tersembunyi di bawahnya. Resource lama yang mungkin dipakai ulang tetap disimpan.

Asset final berada di `assets/celestial_void/`; daftar lengkap ada pada `manifest.json`. Tujuh PNG transparan mencakup portal, nexus, crystal cluster, cosmic rock, lunar ruin, purple shrub, dan cosmic codex. Prompt dan sumber generasi disimpan dalam `generated-sources.json`. Terrain, road, ring, dan panel memakai SVG modular.

## UI

Shop, scroll track/thumb, HUD, selected tower panel, upgrade cards, progression, sell, header, price plaque, Play/Manual/Auto, dan INDEX memakai palet ungu/navy dengan lavender/cyan. Icon INDEX diganti cosmic codex. Struktur, hit area, scrolling, serta kontrol existing dipertahankan.

`TowerBaseRing` mengikuti setiap tower dan dibersihkan saat owner dijual/dihapus. Ring pijakan berbentuk lingkaran dengan diameter sesuai radius tiap jenis tower, terpisah dari `RangeIndicator`. Ghost ring hijau/merah memakai hasil validasi native `PlacementValid`. Ring tidak masuk group collision atau placement. Build rings tampil saat Building Mode; saat selection normal hanya footprint tower terpilih tampil bersama range; crystal/rock/ruin dan Spawn/Base juga memiliki blocked-area circle visual.

## Placement blocking

`Ground_Decoration.Blocking` bernilai true untuk Crystal/Rock/Ruin dan false untuk Shrub. Validator free placement menolak footprint circle yang menyentuh blocked circle authoritative obstacle. Guard native untuk jalan, Spawn, Base, tower lain, batas map, sidebar, dan panel tetap berlaku. Snapping telah dihapus pada rework free placement; detail dan konfigurasi terkini ada di `FREE_PLACEMENT.md`.

## Bonus wave

Event baru memberi `Money += 100` jika `WaveActive`, wave > 0, `EnemiesToSpawn == 0`, jumlah Enemy == 0, dan `WaveSpawningFinished` true. Nilai wave harus melebihi `LastRewardedWave`; marker ini langsung diperbarui setelah pembayaran.

Bonus berlaku satu kali pada Manual, Manual 2x, Auto, Auto 2x, termasuk wave 50. Enemy yang mencapai Base juga dihitung selesai. Jika enemy terakhir menghabiskan Lives dan antrean benar-benar selesai, bonus tetap diberikan sesuai kriteria selesai; defeat dengan wave belum selesai tidak mendapat bonus. Banner completion menampilkan `+100 GOLD` dan fade setelah 2,6 detik nyata.

Harga, damage, range, cooldown, enemy stats, kill reward, komposisi 50 wave, sell formula, Archer upgrade/cross-path, dan event combat/spawn/movement tetap sama dengan baseline sebelum rework. Bonus wave adalah tambahan ekonomi yang diminta.

## Validasi

- Native GDevelop 5.6.283 load, compile, dan export berhasil: 0 diagnostics.
- 52 pemeriksaan Celestial Void: blocking, ring, native purchase, cleanup, reward guards, terminal wave, dan empat mode.
- 419 pemeriksaan seluruh 50 wave: komposisi, stat, spawn, movement, combat, reward, victory, dan tidak ada wave 51.
- 64 pemeriksaan state/speed Manual/Auto/2x, termasuk UI, sell, dan intermission.
- Regresi Archer 170, cross-path 143, dan healthbar 51 pemeriksaan lulus.
- 11 pemeriksaan klik mouse native untuk Archer/INDEX/kontrol wave; 7 pemeriksaan native untuk panel responsif dan reward banner.
- JSON, SVG, resource, object/group/instance references, dan kesamaan baseline diverifikasi. Semua original scene variables dan instance tetap sama; object Tower/Shotgun/Rocket/Archer/Enemy serta 12 blok combat/spawn/movement awal sama persis.

Laporan dan screenshot ada di `design_previews/celestial_void_implementation/`. Screenshot memakai fixture pengujian dengan Gold tambahan untuk mencoba upgrade; starting Money project tetap 650. Tes 50 wave memakai percepatan fixture spawn, bukan penilaian strategi atau balancing melalui playthrough manusia.
