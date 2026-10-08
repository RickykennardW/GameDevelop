# Circle collision medium dan panel dinamis

Overlap sebelumnya diizinkan karena blocked circle obstacle hanya menjadi referensi visual. Validator memakai contour polygon yang dapat mengizinkan ruang di dalam circle. Implementasi terbaru memakai `__freePlacement.blockedCircle(owner)` sebagai satu sumber pusat/radius untuk preview, klik, dan visual ring.

Circle-to-circle terhadap semua solid props, Spawn, dan Base menolak `distance <= towerRadius + blockerRadius + 0.000001`. Klik menghitung ulang geometry sebelum create/charge; Gold tetap utuh jika invalid. Polygon road rounded tetap menjadi blocker jalan. Attack range tidak dipakai dalam collision.

Radius tower medium: Basic 32, Heavy 40, Advanced 34, Archer 36 px. Padding antar-tower tetap 2 px. Anchor alignment sebelumnya dipertahankan dan upgrade tetap memakai footprint instance yang sama.

Crystal/Rock/Ruin memakai pusat envelope contour masing-masing dan radius yang mencakup seluruh contour render, ditambah margin 9 px (sebelumnya 3 px). Spawn/Base memakai radius visual ditambah 11 px (sebelumnya visual circle +5 px, collision +3 px). Runtime menggunakan ukuran object aktual; circle visual tidak lagi lebih besar daripada collision. Pada ukuran map sekarang, radius Crystal sekitar 48,21 px, Rock 46,21 px, Ruin 48,35 px, Spawn 41,4 px, dan Base 67 px. Nilai tepat ikut posisi/ukuran owner. Pure shrubs dan backdrop tetap nonblocking.

Visibility:

- Normal tanpa selection: semua build/block circles hidden.
- Building: ghost footprint, footprint seluruh tower existing, serta 11 circle solid props/endpoints visible.
- Selected tower normal: hanya footprint owner terpilih dan RangeIndicator existing visible; footprint tower lain dan blocker obstacle hidden.
- INDEX modal menyembunyikan build circles. Selling/deleting membersihkan ring owner.

Selected panel menentukan sisi dari footprint center tower yang dikonversi ke screen coordinate dibanding midpoint `gameArea.left/right`, bukan lebar seluruh layar. Tower kiri menghasilkan panel kanan; tower kanan menghasilkan panel kiri. Posisi diperbarui saat selection berubah, termasuk render pada frame selection. Panel di-scale sesuai tinggi yang tersisa di bawah HUD, lebar setengah gameplay, dan ruang yang tidak menutupi footprint tower; kemudian di-clamp ke viewport gameplay. Transform SelectedTowerUI dan `screenRect` diperbarui bersama, sehingga pointer/upgrade/sell guards mengikuti sisi baru. Isi panel, shop, scrolling, PLAY/INDEX, serta harga tetap sama.

Source panel yang di-inline tersedia di `tools/selected-panel-runtime.js`. `python tools/embed-free-placement.py` juga memperbarui source panel, validator, klik, dan ring pada event blocks existing.

Perubahan scene terbatas pada roots 1 (selected panel), 6 (placement validator), 17 (circle visuals), serta radius pada `TowerFootprints`. Map, camera fixed, instance/waypoints, object definitions/resources, combat, wave/reward +100, Archer upgrade tree/cross-path, dan kontrol mode/kecepatan sama dengan baseline sebelum rework ini.

Pengujian GDevelop 5.6.283 + Chrome preview:

- 80 checks circle/panel: exact visual-vs-collision radii, tangency/overlap dan clearance untuk Crystal/Rock/Ruin/Spawn/Base, native purchase/Gold guard, selected footprint, perpindahan sisi, HUD/viewport, upgrade, selling, dan UI consumption.
- 14 checks mouse native pada 1280x800, 960x540, dan 800x480; termasuk mengganti selected tower langsung, upgrade, dan click invalid di circle blocker.
- 84 checks alignment/21 state Archer; 127 builder/fixed-camera checks; 419 seluruh 50-wave/combat checks; 170 Archer integration checks; 64 Manual/Auto/1x/2x checks lulus.
- JSON/reference/source audit dan native compile/export berhasil tanpa diagnostics.

Fixture Archer lama memakai lokasi yang terblokir oleh radius medium baru. Lokasi fixture diganti memakai pencarian native-valid; seluruh 170 assertions asli tetap dijalankan. Screenshot memakai Gold tambahan untuk testing; starting Money tetap 650. Laporan dan screenshot: `design_previews/medium_circles/`.
