# Builder mode dan map shift

Penyebab builder tetap aktif: event pembelian sebelumnya hanya mengonsumsi mouse press. State placement dan indicator tetap aktif sehingga klik berikutnya dapat membeli tower lagi.

Root event 6 sekarang menjaga state scene-local `__freePlacement.active/type`. Root event 9 menerima placement hanya ketika state tersebut aktif. Setelah tower dibuat, diinisialisasi, dan dibayar satu kali, `stop()` mereset state/type, validity/cost/shop request, outline, serta menyembunyikan ghost, footprint preview, dan build range. Klik invalid mempertahankan state dan Gold. ESC melalui event cancel existing dan klik kanan melalui input edge memanggil cleanup yang sama. State ini tidak membutuhkan variable global baru. Selection tidak terjadi pada klik placement karena berjalan lebih awal dan mensyaratkan ghost tidak aktif.

Penyebab map bergeser: root event 0, child responsive map, memperluas `ui.mapBounds` dengan bounding box semua tower setiap frame. Placement di pinggir memperbesar fitted bounds, sehingga zoom/pusat kamera berubah dan Ground_Map ikut dihitung ulang.

Loop yang memasukkan tower ke fitted bounds sudah dilepas. Framing kamera sekarang hanya berasal dari map existing. Tidak ada offset koreksi, perubahan waypoint, pan ke cursor, atau pemindahan object ke UI layer. Resize viewport tetap menyesuaikan framing responsif, lalu kamera stabil selama bermain/building.

Perubahan dibatasi pada event roots 0, 6, dan 9, serta sumber placement terkait. Object, asset, instance, scene variables, footprint configuration, layer, combat, Archer upgrades, wave/reward +100, dan kontrol mode/kecepatan tetap sama dengan baseline sebelum bugfix.

Pengujian berhasil pada preview hasil export native GDevelop 5.6.283 di Chrome:

- 127 pemeriksaan builder/camera: semua tipe tower, satu biaya/satu tower, klik lanjutan, invalid, ESC/right cancel, edge kiri/kanan, exact preview position, serta scan cursor pada tepi map. Camera position/zoom, ground, route, dan endpoint dibandingkan sebelum/sesudah.
- 29 pemeriksaan input mouse native, termasuk empat tower di kedua tepi, cancel, dan resize viewport nyata dari 1280x800 ke 960x540.
- Regresi 61 free placement, 52 Celestial Void/reward, 419 seluruh 50 wave/combat, dan 64 Manual/Auto/2x lulus.
- 11 pemeriksaan native Archer upgrade/selection/INDEX/wave control lulus.
- JSON/reference audit dan native load/compile/export berhasil tanpa diagnostics.

Laporan serta screenshot sebelum/sesudah ada di `design_previews/builder_camera_fix/`. Source test utama: `tools/test-builder-fix.js`. Fixture screenshot memakai Gold tambahan untuk pengujian; starting Money project tidak berubah. Pengujian 50 wave mempercepat antrean fixture untuk memeriksa correctness, bukan evaluasi balancing melalui playthrough manusia.
