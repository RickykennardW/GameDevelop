# Final cleanup — Celestial Void

Pembersihan dilakukan langsung pada working tree existing, tanpa membuat backup, salinan pengaman JSON/asset, archive, snapshot, branch atau commit. Aturan **NO BACKUP** untuk pekerjaan berikutnya dicatat di `AGENTS.md`. Git history tidak diubah.

## Hasil penyimpanan

- **336 file fisik dihapus permanen**, total **917.288.936 byte / 917,29 MB / 874,79 MiB**.
- **5 file backup/autosave lama** termasuk dalam 336 file tersebut.
- Pengurangan bersih folder kerja sekitar **913,4 MB**, setelah menghitung dokumentasi dan bukti validasi terbaru. Perhitungan berdasarkan panjang file, di luar `.git`; bukan ukuran alokasi NTFS.
- Satu junction `outputs/.../node_modules` dilepas. Target cache bersama di luar project tetap utuh; isinya tidak dihitung sebagai file yang dihapus atau ruang yang dihemat.
- Tidak ada folder kosong, junction, file backup, autosave atau duplikasi JSON project yang tersisa di working tree.

Rincian penghapusan fisik:

| Kategori | File | Byte |
|---|---:|---:|
| Backup dalam `backups/` | 3 | 740.545.863 |
| Autosave project lama | 1 | 1.015.367 |
| Preview, prototype dan hasil pengujian historis | 247 | 170.926.499 |
| Hasil sementara pembuatan Excel | 10 | 1.308.004 |
| Script migrasi, probe dan testing yang sudah digantikan | 39 | 452.448 |
| Dokumentasi yang sudah digantikan | 13 | 113.789 |
| Metadata offline dan source gambar yang redundan | 22 | 2.925.982 |
| Texture tombol yang identik | 1 | 984 |
| **Total** | **336** | **917.288.936** |

Lima backup lama: dua ZIP pra-organisasi/editor, `backups/fullscreen_scale_before/game-scene.json`, `Tower Defense.json.autosave`, dan snapshot konfigurasi `design_previews/gameplay_balance/before-config.json`. Nama checksum manifest yang mengandung kata “before” tidak dihitung sebagai backup project.

## Folder yang dibersihkan

`backups/`, `design_previews/`, `outputs/`, dan `tools/cleanup-audit/` dihapus setelah dependency diperiksa. `tools/` serta metadata artwork pada `assets/enemies/`, `assets/towers/star_cannon/` dan `assets/map/celestial_void/` dipangkas. Tidak ada file dipindahkan ke Archive/Old/Backup.

Excel final pengguna dipindahkan langsung ke `data/Celestial_Void_Data_Wave_Monster_Tower.xlsx`, tanpa mengubah isinya. Preview, formula scan dan generator sekali pakainya dihapus. `README.md` dan `PROJECT_GUIDE.md` menjadi dokumentasi pemeliharaan yang berlaku.

## Dependency dan JSON

Audit menelusuri folder project, satu scene, extension Health, object/group/instance, event, 23 source JavaScript, resource definitions, konfigurasi dan tooling yang dipertahankan. Resource identifier dibedakan dari path file fisik, termasuk referensi yang dibentuk runtime.

Perubahan JSON hanya:

1. Menggabungkan texture `index-button.svg` dengan `button.svg` yang SHA-256-nya identik. Satu referensi texture ShopIndexButton diperbarui dan satu resource entry redundan dihapus. Nama object, ukuran, event dan fungsi tombol tetap.
2. Menghapus tiga group tanpa referensi: `TowerShopContent`, `GroundMapVisuals`, `MapEndpoints`.
3. Menghapus satu conditional kosong tanpa action/subevent, serta satu reset `SpawnTimer` yang tidak pernah dibaca.

Seluruh **65 object definitions, 157 scene instances, 58 scene variables dan 23 source runtime** dipertahankan. Tidak ada scene aktif, variable gameplay atau object aktif yang dihapus. Data instance, variable/config, layer, camera/editor settings, object folders dan shared behaviors cocok dengan checksum sebelum penghapusan. Seluruh source runtime tetap byte-identik dan cocok dengan inline events.

Metadata frame/pivot yang dihapus sudah tersedia pada konfigurasi scene aktif. `Terrain.png` offline juga sudah tertanam lengkap pada SVG ground aktif; SVG tersebut tidak diubah. Selain satu texture duplikat, byte seluruh resource art/audio aktif tetap sama.

## File aktif yang dipertahankan

- **356 resource terdaftar: 331 image dan 25 audio**, seluruh path tersedia. `assets/` berisi tepat resource tersebut ditambah manifest audio yang masih dipakai QA.
- Star Cannon harga 300 Gold, dua upgrade path/21 kombinasi, seluruh base/turret/preview, projectile, muzzle dan impact effects.
- Nova Wisp, Void Hound, Void Guard, Void Sentinel, Void Brute dan Void Golem; seluruh frame arah/state, HP bars, death effect, stationary casting dan Void Fortification.
- Map Celestial Void, Monster Path/waypoints, Spawn/Base, obstacle/collision/removal, Tower Shop, Index, Selected Upgrade Panel, HUD dan camera.
- Empat BGM, 21 SFX, audio manifest, runtime volume/crossfade/limiter, serta source komposisi dan encoding original.
- Extension Health, 23 source runtime, embedding source mapping, tujuh suite regresi native dan alat preview/audio yang benar-benar dipakai dalam validasi ini.
- Excel final di `data/` tetap byte-identik. Workbook tersebut merupakan deliverable pengguna, bukan konfigurasi balancing runtime.

## Validasi yang benar-benar dijalankan

**Static:** JSON utama, scene dan extension valid; split file, resource paths/casing, object/instance/layer/group references, source/event mapping, checksum 25 audio, asset registration, dan ketiadaan backup diperiksa oleh `tools/validate-project.py`.

**Native GDevelop:** libGD membaca project berisi satu scene/65 object; scene dan extension Health berhasil dikompilasi, dengan **0 scene diagnostic**. Native preview diekspor ulang dari project terbaru. Adapter headless memasukkan kode Health hasil kompilasi native dan dependency debugger/runtime yang biasanya disiapkan IDE.

**Visual preview:** map/idle, selected tower, Index dan combat dijalankan dalam Chrome headless menggunakan runtime GDevelop asli. Keempat render cocok **piksel demi piksel** dengan checksum preview sebelum cleanup. Tidak dibuat salinan gambar “before” baru. Shop tetap satu card kecil 84 × 112 pada slot pertama; enam enemy, HP bars dan tiga projectile Meteor ter-render. Camera dan geometri muzzle tetap sama; semua console error kosong. Satu gambar hasil terbaru ada di `validation/Gameplay_Preview.png`.

**Gameplay:** tujuh suite native lolos **23.789 pemeriksaan**, dengan 0 console exception:

| Suite | Pemeriksaan |
|---|---:|
| Tower, selection, obstacle dan UI | 283 |
| Nova Wisp | 14.532 |
| Void Hound | 117 |
| Common Void enemies | 636 |
| HP bars dan balance invariants | 183 |
| Void Golem dan skill | 552 |
| Gold-Budget dan aturan 45 wave | 7.486 |

**Audio:** lima fixture lolos 137 pemeriksaan. Semua 25 audio berhasil di-decode; empat BGM melewati batas loop tanpa instance baru; crossfade, placement, upgrade, sell, invalid actions, Golem cast/buff/death, wave/milestone, Base Damage, Game Over/Victory dan settings reload diuji. Stress mix 12 SFX + 2 BGM tidak clipping.

**Sesi real-time:** lima wave dengan dua Star Cannon yang dibeli seharga normal selesai dalam sekitar 120,7 detik pada mode 2× existing. Wave 5 memakai milestone cue; satu enemy yang lolos memicu satu Base Damage. Batas channel/observer tetap terjaga, audio tidak silent, dan tidak ditemukan sampel clipping. Production gameplay tidak diedit untuk fixture ini.

Bukti terbaru berada di `validation/`: hasil suite, console, render checksum, audio checks, native compile log dan `cleanup-summary.json`. Laporan hanya menyimpan hasil/count/checksum, bukan isi project untuk pemulihan.

## Batas pengujian

Preview diuji otomatis melalui compiler/runtime GDevelop dan Chrome lokal, bukan sesi editor GUI interaktif. Kampanye penuh 45 wave tidak dimainkan real-time sampai akhir; aturan seluruh wave diperiksa oleh suite native dan state Victory/Game Over diuji melalui fixture. Export mobile/desktop distributable tidak diuji. Tidak ada perubahan balancing, gameplay, UI layout, map atau camera dalam cleanup ini.

**Backup baru dibuat: 0. Backup lama yang dihapus: 5.**
