# Free placement dan circular footprint

Scene `Game Scene` sekarang menggunakan posisi cursor pada world layer tanpa SnapToGrid, rounding, atau syarat tile kosong. Posisi cursor adalah pusat pijakan tower; sprite ditempatkan relatif terhadap pusat ini agar ring berada di kaki tower. Attack range tetap berpusat pada pusat sprite sebagaimana sistem combat existing.

## Konfigurasi

Scene variable `TowerFootprints` menyediakan Radius, Width, dan Height per object tower:

| Tower | Object | Radius world px |
|---|---|---:|
| Basic | Tower | 32 |
| Heavy | ShotgunTower | 40 |
| Advanced | RocketTower | 34 |
| Archer | ArcherTower | 36 |

`TowerFootprintPadding` bernilai 2 px. Radius disalin ke variable instance `FootprintRadius` saat pembelian. Instance menyimpan `FootprintOffsetX/Y` dari titik pijakan per tipe (`AnchorX/Y`) dan render scale existing; `FootprintX/Y` mengikuti posisi aktual. Archer upgrades tetap memakai footprint instance yang sama. Mengubah konfigurasi memengaruhi pembelian berikutnya; tower yang sudah dibangun mempertahankan radiusnya.

## Event yang diubah

- Root event 6: posisi ghost langsung dari `getCursorX/Y(scene, "", 0)`, kemudian validasi geometry dan biaya. Action SnapToGrid serta collision sprite/grid lama sudah dilepas.
- Root event 9: hanya memproses edge mouse press. Cursor, geometry, seluruh tower, endpoint, Gold, dan UI diperiksa kembali sebelum create/charge. Holding mouse tidak membuat pembelian berulang. Builder kini berhenti sepenuhnya setelah satu pembelian berhasil; untuk membangun berikutnya, pilih Shop kembali. Klik invalid mempertahankan builder, sedangkan ESC/klik kanan membatalkannya. TowerId, PurchasePrice, TotalInvestment Archer, ukuran existing, timer shooting, dan sound placement tetap diinisialisasi.
- Root event 17: satu ring per owner, ghost footprint hijau/merah, dan `PlacementRangeIndicator` terpisah. Ghost radius sama dengan footprint fisik. Outer edge SVG ring disesuaikan dengan diameter collision. Saat Building Mode, ring existing tower dan 11 blocked-area rings terlihat. Pada normal tanpa selection semua build rings disembunyikan; selection menampilkan footprint tower terpilih dan range existing saja. Setelah placement dibatalkan/selection aktif, ghost dan range preview disembunyikan. Selling menghapus ring owner.
- Satu guard pada root event 3: selection tower existing berlaku ketika ghost placement tidak aktif. Klik lokasi tower saat placement memberi feedback invalid, sehingga tidak membatalkan placement secara tidak sengaja.

Sumber JS yang di-inline pada JSON tersedia di `tools/free-placement-runtime.js`, `tools/free-placement-click.js`, dan `tools/free-placement-rings.js`. Setelah mengedit sumber, jalankan `python tools/embed-free-placement.py` untuk memperbarui hanya bagian events JSON. GDevelop menjalankan kode yang tertanam di scene; tidak membutuhkan file tools pada runtime.

## Collision

Tower-tower menggunakan circle-to-circle untuk semua tipe: jarak pusat harus >= jumlah kedua radius + padding 2 px. AttackRange tidak pernah dipakai untuk collision.

Monster_Path tetap memakai instance, koordinat, PathOrder, dan movement existing. Geometry blocker mengikuti outer stroke SVG jalan 64 px. Segmen lurus memakai footprint ribbon; belokan menggunakan polygon ribbon quarter-circle radius 33 px dengan 64 subdivisions, lalu di-clip pada batas gambar tile. End-cap mengikuti ujung rounded. Circle diperiksa terhadap isi polygon dan jarak ke setiap edge; menyentuh jalan berarti invalid. Toleransi 0,04 px menutup error aproksimasi kurva. Area kosong di sudut luar belokan dapat dipakai meskipun lingkarannya masuk bounding rectangle tile lama.

Crystal, Rock, dan Ruin menggunakan blocked-circle authoritative yang dihitung dari contour asset ditambah margin 9 px. Spawn/Base memakai radius visual ditambah 11 px. Preview, click validation, serta ring menggunakan pusat/radius yang sama; circle menyentuh blocker berarti invalid. Shrub tetap nonblocking. Detail rework terbaru ada di `MEDIUM_CIRCLES_PANEL.md`.

Kamera gameplay memakai framing map statis; tower/ghost tidak dimasukkan ke auto-fit bounds. Resize viewport tetap menghitung framing responsif dari map. Seluruh footprint harus masuk Ground_Map dan viewport gameplay. HUD dan selected panel diperiksa pada screen coordinates yang dikonversi dari world layer; INDEX modal, sidebar, serta input UI memblokir placement. Ghost dihitung setiap frame, dan click menjalankan validator yang sama sekali lagi.

## Pengujian

- 61 pemeriksaan free placement: fractional/subpixel cursor, pembelian di antara grid, circle radii antarjenis, posisi berdekatan, jalan lurus/rounded, clearance 0,2 px, obstacle tidak beraturan, Spawn/Base, batas map, stale affordability, UI click-through, native upgrade/selling, cleanup, dan konversi camera.
- 7 pemeriksaan input mouse native, dengan screenshot hijau/merah dan tiga tower berdekatan.
- 52 pemeriksaan Celestial Void dan bonus wave satu kali tetap lulus.
- 419 pemeriksaan seluruh 50 wave, 64 mode/speed checks, 170 Archer checks, dan 143 cross-path checks lulus.
- 11 pemeriksaan native Archer/INDEX/wave, dan 7 pemeriksaan panel responsif/banner lulus.
- Native GDevelop 5.6.283 load/compile/export berhasil tanpa diagnostics. JSON, instance/group references, UUID, dan kesamaan kode inline terhadap sumber diperiksa.

Audit baseline memastikan semua original object definitions, scene variables, instance/waypoint, layers, dan event gameplay lain tetap sama. Wave reward +100 tidak diubah. Extension SnapToGrid lama tetap tersedia di project untuk kompatibilitas, tetapi tidak lagi dipanggil event placement.

Laporan dan screenshot ada pada `design_previews/free_placement/`. Fixture screenshot memakai Money 30000 untuk mencoba beberapa tower; starting Money project tetap 650. Pengujian 50 wave mempercepat fixture antrean untuk memeriksa correctness; bukan evaluasi balancing melalui playthrough strategi manusia.
