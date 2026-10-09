# Full project cleanup — Star Cannon only

Cleanup diterapkan pada project terbaru `Tower Defense.json` dan `layouts/game-scene.json`.

## Backup dan audit

Backup lengkap: `backups/pre_star_only_cleanup_20261009.zip` (439,050,356 bytes). ZIP integrity diperiksa; setiap asset/history yang dihapus diperiksa hash/path dan salinan backup. Skrip cleanup sekali pakai serta snapshot audit lama diarsipkan dalam `backups/cleanup_procedure_20261009.zip`.

Audit `tools/cleanup-audit/dependency-plan.json`:125 resource dipertahankan (94 KEEP +31 SHARED),93 resource entries REMOVE. Satu authoring bitmap Terrain dipertahankan setelah dibuktikan identik dengan bitmap embedded pada terrain-repeat.svg. Scene, external-events/layouts, object groups/folders, native/JS events, scene/global variables, catalogs, animations, behaviors, UI dan resource references diperiksa. Project memiliki satu scene, tanpa external events/layouts aktif.

## Konten yang dihapus

- Empat tower lama: Basic (`Tower`), Heavy (`ShotgunTower`), Advanced (`RocketTower`), Archer (`ArcherTower`); termasuk sprites, exclusive projectile/attack/upgrade logic, footprint/config, preview dan UI.
- Slime clips Hit/Idle Run, sprite resources, legacy archetypes Normal/Fast/Tank/Elite/Boss, wave backups/config lama dan Index entries. Enemy object, MonsterEnemies group dan Health behavior tetap aktif sebagai Nova Wisp.
-411 file asset physical, total12,764,475 bytes, termasuk320 file ukuran default orphan. Tiga custom extension files lama ButtonStates/FireBullet/SnapToGrid dibuang; Health tetap utuh. Dua buku Index lama tidak direferensikan; Cosmic Codex aktif dipertahankan.
-28 object definitions dihapus;85→57. Daftar persis ada pada `removeObjects` di dependency-plan.json. Tiga tower/projectile lama, obsolete detail/sell labels, separator, old scroller dan redundant Shop Index label dibuang. Shared ArcherUpgradeIcon direfactor menjadi StarUpgradeIcon, delapan state SC dan semua consumer tetap valid.
- Event tree85→59 node (termasuk group/comment). Obsolete attack/collision events untuk tiga tower, Archer runtime, FireBullet initialization, card-scale/tween, bbox selection fallback dan old information panel dibersihkan. Healthbar/range menjadi generik. Input ID/ESC, placement, rewards, controls dan combat Star/Nova dipertahankan.
- Sepuluh scene variables lama dibuang; daftar persis pada removeVariables. Unused object behaviors/shared-data dibuang. Migrasi lama dan tes yang bisa memasukkan konten lama lagi dipindahkan ke backup.

## Shop dan Index

Shop memakai satu kartu penuh **STAR CANNON —300 GOLD**, icon/nama/harga di tengah, panduan dua upgrade path, tanpa empty slots/scroller. Header, theme Celestial Void, HUD, Index dan PLAY/Manual/Auto tetap ada.

Index Towers menghapus empat entry lama dan hanya menampilkan Star Cannon, stats live, delapan icon/deskripsi upgrade dan kedua path. Monsters hanya Nova Wisp; tabs/Close/Escape berfungsi. Scroll Index dipertahankan karena isi upgrade tetap panjang pada viewport kecil.

## Shared dan authoring yang dipertahankan

31 SHARED resource tetap dipakai: map/environment textures, ground/road, Spawn/Base, Cosmic Codex, panel/frame/plaque, coin, range/placement/healthbar texture, Star previews/upgrade icons. Semua63 PNG Star (42 Base/Turret +21 original), projectile/impact SVG dan metadata pivot/muzzle/calibration utuh. Empat Nova PNG, views/crystal metadata, animations dan Health utuh.

Terrain.png, input Reference.png yang direferensikan manifest, gallery komponen/asset, video Nova dan konsep nova_map adalah authoring/reference, bukan orphan gameplay. Semua media assets yang tidak diregistrasi hanya Terrain.png; alasannya terdokumentasi. Tidak ada dependency yang belum jelas dihapus. Gambar konsep/history yang tetap disimpan tidak diload gameplay. History lain tersedia di backup.

## File yang berubah

File project utama/scene; runtime Shop, Index, selected panel, placement/click/selection/render; dua source baru selected-range-runtime.js dan enemy-healthbar-runtime.js; source embed helper; Celestial manifest; tests Star/Nova/native; README/BALANCE/Star/Nova/Map/Obstacle docs. Daftar persis dibandingkan backup dan seluruh angka ada di tools/cleanup-audit/final-summary.json.

Resource orphan dan history yang dihapus tercatat per-file, reason, bytes dan SHA256 pada dependency-plan.json / artifact-removal-plan.json. Pre-cleanup autosave diperiksa secara semantik: tidak ada perubahan object/variable tambahan; perbedaan adalah serialization float/order/default editor. Autosave lama disimpan dalam full backup dan dihapus dari folder aktif agar tidak memulihkan konten lama.

## Hasil pengujian

- JSON/SVG parser64 pemeriksaan lulus; native GDevelop5.6.283 memuat satu scene/57 objects, compile0 diagnostics, export berhasil. Registered resource125/125 tersedia, semua references/group/folder valid. Active JSON/source tidak mengandung retired content/mojibake.
-408 pemeriksaan static/reference/source embedding/hash lulus. Star/Nova core config/runtime, obstacle panel, map initialization, resources aktif dibandingkan byte-for-byte dengan backup. Waypoints/camera tidak berubah.
-283 tes preview: seluruh21 kombinasi upgrade melalui UI, empat crosspath invalid, unchanged stats/cost/splash/twin/triple damage, target lock/rotation, muzzle transforms, DamageDealt, investment/sell, placement/range/footprint, insufficient money, obstacle collision/Clear250, input priorities, Shop dan Index.
-10.428 tes Nova: semua50 wave/5.100 instance spawn berurutan,100HP/80speed/reward5 tetap sama, bonus100 satu kali, movement/directions/animation/hit/death/base damage, combat Star, victory50, no duplicate reward/no legacy spawn.
-32 tes browser input nyata: Index/Towers/Monsters/Close, purchase300, free placement, upgrade2-4, turret dan actual PIXI muzzle, triple shots, selection/Sell, Clear250, fixed camera/route, viewport800×480/1920×1080/2560×1440, PLAY dan empat mode. Actual Nova clock doubles at2x. Console error/exception/missing asset=0; log `design_previews/cleanup/console-errors.json` berisi [].

Bukti terbaru: design_previews/cleanup/test-clean-project-results.txt, test-nova-wisp-results.txt, native-tests.txt dan screenshots Shop/Index/selected turret/Clear. Skrip native exporter uji melengkapi library Health/debugger serta manifest preview memakai kode native GDevelop; tidak ada gameplay shim, event dummy atau konten lama yang dipulihkan.

## Ukuran terukur

| Scope | Sebelum | Sesudah |
|---|---:|---:|
| Working tree (bytes) | 214,611,239 | 143,560,621 |
| Project JSON | 77,149 | 38,849 |
| Scene JSON | 2,975,958 | 2,266,505 |
| Registered resource physical bytes |100,935,041|87,827,403|
| Object definitions |85|57|
| Resource entries |218|125|
| Event tree nodes |85|59|

Pengurangan working tree: **71,050,618 bytes (33.11%)**. 214.61→143.56 MB (decimal).

Working tree dibandingkan dengan scope yang sama, mengecualikan .git dan backups. Backup lengkap memang menyimpan konten yang dibuang sehingga folder backups tidak ikut dianggap penghematan. Preview/design source yang disimpan masih termasuk ukuran working tree. Registered resource bytes dihitung dari file physical unik; bukan hasil estimasi size ZIP.

## Batas verifikasi dan masalah tersisa

Tidak ditemukan masalah gameplay/broken references pada tes tersebut. Pembukaan GUI editor GDevelop tidak diautomasi; project telah lolos parser/compiler native dan runtime preview.50 wave memakai accelerated test fixtures, bukan playthrough strategi manusia penuh. Tidak mengubah balancing/menilai difficulty.

Buka ulang **Tower Defense.json** jika editor masih menyimpan scene sebelum cleanup di memori. Money pada screenshot test20000; Money awal project tetap650, Lives10, tower300, wave bonus100, Clear250.
