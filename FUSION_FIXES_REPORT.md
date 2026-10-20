# Fusion placement, Index dan discovery — 19 Oktober 2026

Perbaikan langsung pada project aktif. **Tidak ada backup, salinan JSON/asset, snapshot, branch cadangan, perubahan Git history, asset baru atau balancing baru.**

Catatan versi: laporan ini mencatat task19 Oktober. Pada20 Oktober tampilan Index dan dua portrait showcase diperbarui; lihat **[INDEX_REDESIGN_REPORT.md](INDEX_REDESIGN_REPORT.md)**. Logic discovery/placement yang dijelaskan di sini tetap dipertahankan.

Koreksi UX berikutnya: [TACTICAL_FUSION_UX_REPORT.md](TACTICAL_FUSION_UX_REPORT.md) menambahkan footprint collider lingkungan dan memindahkan instruksi/toast Fusion ke sidebar. Deskripsi posisi notifikasi lama di bawah merupakan catatan historis; aturan transaksi/discovery tetap sama.

## Temuan dari project nyata

1. `starburst-fusion-runtime.js` melewati tower non-Max sebelum menggambar highlight. Akibatnya renderer tidak pernah menggambar area occupied mereka. Collision sudah benar melalui `p.validate`; sumber masalah berada pada visibility renderer.
2. `unit-index-runtime.js` hanya mempunyai Towers/Monsters. Fusion yang sudah ditemukan ditambahkan ke daftar Towers. Belum ada kategori Fusion, entry undiscovered, atau metadata varian terpisah.
3. Archive lama berupa `found` Set di memori RuntimeGame, tanpa penyimpanan permanen. Pada file yang diperiksa, sukses Fusion hanya memutar `TowerMajorUpgrade`; belum ada notifikasi visual khusus Fusion. Notifikasi visual yang tersedia milik Monster Discovery. Jadi kasus notifikasi Fusion lama versus siluet tidak dapat direproduksi persis dari file ini. Perbaikan memakai satu state kanonis baru untuk controller, notifikasi dan Index, menghilangkan pemisahan status serta keterbatasan sesi tersebut.

Sebagai pembanding kualitas, [catatan resmi Ninja Kiwi](https://store.steampowered.com/news/posts/?appids=960090&enddate=1665538441&feed=steam_community_announcements) mencatat perbaikan UI Paragon yang salah memilih hasil serta audio upgrade yang sebelumnya berulang saat memuat save. Prinsip yang diterapkan di sini: indikator harus sesuai hasil validasi, kategori harus membedakan tipe unit, dan feedback discovery harus mengikuti transaksi sukses serta save yang sama. Ini keputusan UX Celestial Void; tidak menyalin art, aturan Paragon, atau mengklaim BTD6 memakai layout/regional placement ini.

## Perubahan implementasi

- **Footprints:** pada fase partner, Max-only highlight/logo tetap berlaku. Pada fase placement, semua `p.towers()` digambar dari `p.center(t)` dan radius asli `p.radius(t)`, bukan sprite. Sumber A/B cyan dan tetap diabaikan validator; lainnya merah lembut dan tetap collision. Satu Graphics existing menggambar sesudah shade25%; tombol/banner berada di atas ghost/footprints. Map record dipakai ulang, bukan object outline baru tiap frame. Finish/Cancel membersihkan records dan marker.
- **Index:** tiga tab **Towers / Monsters / Fusion** dengan style purple existing. Starburst hanya Fusion. Undiscovered memakai asset asli dengan tint hitam, `???`, status, hint dan detail terkunci. Discovery langsung membuka art/nama/status, damage/range/interval dari `StarburstConfig`, deskripsi dan resep **Star Cannon 5-2 + Star Cannon 2-5**. Tidak ada entry shop tambahan.
- **Shared permanent state:** `game.__fusionArchive` menyimpan key localStorage **`celestialVoidFusionDiscovery.v1`**. Controller unlock sesudah transaksi berhasil. Notifikasi dan Index membaca instance yang sama; `revision` menyegarkan Index tanpa restart. Reverse recipe mempunyai ID Pure sama, **`pure_52_25`**. Discovery berikutnya tidak menyimpan/menotifikasi ulang.
- **Extensibility:** scene variable **FusionCatalog** mendefinisikan ID, nama, Kind, portrait, hint, config stats dan daftar recipe/variant. UI/service generik mendukung Pure dan Hybrid, termasuk empat varian independen. Hanya Starburst didaftarkan sebagai konten aktif; pengujian Hybrid memakai fixture di profile terisolasi, bukan tower atau asset game baru.
- **Notification:** sprite asli, purple/gold cosmic panel, reveal siluet, slide/fade empat detik, queue dan chime DiscoveryUnlock existing. Geometry menghindari HUD/shop/Selected Panel. Noninteraktif, tidak mengubah speed/pause, dan menunggu ketika Index/Fusion/notifikasi monster aktif. Shared textures tidak dihancurkan saat unload.
- **Save compatibility:** legacy Pure boolean/`found` list serta archive memori yang masih tersedia dapat dimigrasi. Unknown records, unknown variant IDs dan metadata tetap dipertahankan. Hybrid tidak otomatis membuka seluruh variannya. Tidak ada reset storage lain. Monster discovery tetap mengikuti perilaku sesi beta yang sudah ada. Progress dari sesi lama yang sudah berakhir tanpa pernah disimpan tidak dapat dipulihkan dari data yang memang tidak ada.

## File/object/event

| File | Bagian yang berubah |
|---|---|
| `layouts/game-scene.json` | Tambahan FusionCatalog dan JsCode event `[0].events[4]`; re-embed source Fusion dan Index |
| `tools/starburst-fusion-runtime.js` | Renderer footprint semua tower, Z-order UI, unlock melalui shared archive sesudah sukses |
| `tools/unit-index-runtime.js` | Tiga tab, data-driven Fusion card, silhouette/reveal/recipes/variant progress |
| `tools/fusion-archive-runtime.js` | Service persistence/migration, variant registry dan notification view baru |
| `tools/source-mapping.json` | Mapping event discovery Fusion baru |
| `tools/build-fusion-archive.py` | Registrasi metadata/event idempotent |
| `tools/build-starburst.py` | Hook metadata agar rebuild berikutnya mempertahankan fitur |
| `tools/fusion-fixes-qa.js`, `tools/fusion-persistence-qa.js` | Native UI/placement/discovery/migration/restart fixtures |
| `tools/starburst-fusion-qa.js` | Ekspektasi Index diperbarui ke kategori Fusion |
| `tools/balance-browser.py` | Opsi reload dan relaunch nyata untuk persistence Fusion |
| `PROJECT_GUIDE.md`, `STARBURST_FUSION_REPORT.md`, laporan ini, `validation/` | Dokumentasi dan bukti validasi |

Tidak ada object/layer native baru. `StarburstGhost`, FusionUI, DiscoveryUI, IndexTowerImage, IndexText dan IndexPanel existing dipakai ulang. **`Tower Defense.json` tidak berubah dalam task ini.** Jumlah tetap **402 resources, 66 objects, 157 authored instances**; menjadi **64 scene variables dan 26 runtime source mappings**.

## Pengujian yang benar-benar dijalankan

- Native GDevelop parser, scene compile/export: berhasil, **0 scene diagnostics**. Installed libGD5.6.283 mengeluarkan warning versi project/include existing; helper validation memasukkan bundle Health. Ini bukan pengujian klik manual editor desktop.
- Full targeted native checks: **59** pada1920×1080 dan **59** pada960×640. Masing-masing dilanjutkan **8 checks page reload +8 checks full browser close/relaunch**. Silhouette→real art, recipe, saved status, no repeat notification, source collisions, non-Max footprint, real tab clicks dan storage lain lulus. **0 console errors**.
- Migration: seeded save lama di profile terisolasi, **9 checks reload +9 checks relaunch**, termasuk unknown metadata/entry, legacy found list, partial Hybrid dan audio preference. Lulus tanpa error.
- Visual fixtures: **33 placement**, **6 undiscovered Index**, **51 notification checks**. Screenshot placement, locked/unlocked Index,960 UI dan first discovery benar-benar diperiksa.
- Existing Fusion combat/transaction suite: **110 checks**, meliputi real shop placement/upgrades, reverse pair,0.5x,Cancel/Esc, regional/path/obstacle/tower validation, creation failure, fee failure, source deletion, Gold/refund, aiming delapan arah, pivot, muzzles0→1→2, recoil, direct90/splash18/radius64, impact cleanup dan Game Over.
- Native regressions: **731 Nova Spike**, **354 placement/UI/shop/sell/Index**, **552 Void Golem**, **7486 Gold-Budget wave checks**; semuanya lulus tanpa exception.
- Monster discovery beta: **53 checks**, ordinary scene reload, explicit New Game reset dan full browser relaunch lulus; perilaku sesi/audio tetap sama.
- Hash scope checks membuktikan semua scene objects/config/layers/instances existing sama setelah mengecualikan event dan tambahan FusionCatalog. Source Star Cannon, placement validator, Monster discovery, wave manager, Void Golem dan audio byte-identik dengan sebelum task. `validation/fusion-fixes-scope.json` hanya berisi hash/count/check flags, bukan salinan source.
- Validator akhir: **5569 checks** JSON/resource/reference/source mapping/no-backup lulus. `node --check` untuk tiga runtime terkait serta dua fixture baru dan `git diff --check` juga lulus.

Evidence utama: `validation/fusion-fixes-qa.json`, `fusion-fixes-960.json`, `fusion-migration-qa.json`, `starburst-fusion-qa.json`, `discovery-beta.json`. Screenshots: `Fusion_All_Footprints.png`, `Fusion_Index_Undiscovered.png`, `Fusion_Index_Revealed.png`, `Fusion_Index_960.png`, `Fusion_First_Discovery.png`.

Batas verifikasi: tidak melakukan playthrough manual45 wave, sesi benchmark memori panjang, atau seluruh platform export. Uji renderer membuktikan jumlah child stabil selama240 frame dan delapan siklus Cancel; bukan klaim universal bebas memory leak. Persistence diuji pada Chrome dengan profile sama; localStorage tetap bergantung pada storage aplikasi/browser yang tersedia dan tidak dihapus pengguna. Preview/editor yang memakai origin/profile berbeda mempunyai save masing-masing.

## Regression manual singkat di GDevelop

1. Buka project aktif dan Start Preview. Pada profile belum discovered, buka **Index → Fusion**: pastikan siluet, `???`, hint dan resep terkunci; Towers hanya Star Cannon dan Monsters tetap tersedia.
2. Bangun Star Cannon5-2 dan2-5 serta satu tower non-Max. Klik Fusion pada source Max, pilih pasangan: periksa semua footprint terlihat, A/B cyan, tower lain merah dan tanpa logo kandidat non-Max.
3. Gerakkan ghost ke tower lain/path/obstacle/di luar region. Ghost harus merah dan klik tidak mengonsumsi sumber. Cancel/Esc harus membersihkan outline dan memulihkan speed.
4. Konfirmasi spot valid dekat source. Pastikan dua sumber baru dikonsumsi, Starburst muncul dan satu notifikasi discovery tampil. Buka Fusion Index: art/nama/resep harus langsung terbuka.
5. Tutup lalu jalankan ulang preview pada storage/profile yang sama. Entry harus tetap discovered. Buat Fusion kedua dengan urutan terbalik: tidak ada first discovery ulang. Periksa aiming, tiga muzzle bergantian, projectile, impact, damage dan sell tetap bekerja.
