# Celestial Void — Fusion Asset Rebuild

## A. Cleanup

Saya menghapus 10 gambar dari percobaan yang dihentikan dan dua skrip draf, `tools/fusion-effects.py` serta `tools/fusion-audio.py`. Totalnya 21.608.769 byte. Daftar lengkap mencatat nama file, ukuran, dan commit pembanding. Draf tersebut belum mendaftarkan resource atau menyentuh scene, sehingga jumlah referensi lama yang perlu dihapus adalah nol. [Daftar penghapusan](validation/fusion-rebuild-cleanup.json)

Inventaris dan perbandingan Git mengonfirmasi bahwa aset asli Star Cannon, Nebula Bloom, Starburst, monster, map, dan audio tetap utuh. File `Tower Defense.json.autosave` yang sudah ada dipertahankan. Pekerjaan ini tidak membuat backup atau salinan proyek.

## B. Art Direction

Star Cannon menjadi acuan untuk rangka gading berfaset, filigri emas, inti bintang biru-ungu, dan arah muzzle yang jelas. Nebula Bloom menjadi acuan untuk kelopak gading, bibir emas, inti galaksi violet, serta peluncur benih yang tumbuh dari bunga. Starburst menjadi acuan pemisahan pedestal dan head, skala battlefield, serta detail portrait. Saya membandingkan Venom Cataclysm dengan aset kedua induk dan Starburst sebelum mengerjakan empat Hybrid. [Acuan art](tools/fusion-art-direction.json) · [Perbandingan Venom](validation/Venom_Cataclysm_Art_Gate.png)

Dari Bloons TD 6 saya mengambil prinsip keterbacaan pada skala bermain. Jumlah emitter, bentuk badan, dan arah serangan membedakan tower, sementara upgrade mengubah detail yang dapat dilihat saat tower sedang idle. Flash singkat dan batas opacity zona memberi ruang bagi target dan HP bar. Material, bentuk bunga, dan artwork berasal dari acuan Celestial Void. [Bloons TD 6, Ninja Kiwi](https://store.steampowered.com/app/960090/Bloons_TD_6/) · [Trailer resmi](https://www.youtube.com/watch?v=X1pgB2iHbBI)

## C. Asset Production

| Fusion | Sumber | Perkembangan E1 → E2 → E3 |
| --- | --- | --- |
| Venom Cataclysm | Nebula Bloom 5–2 + Nebula Bloom 2–5 | Bunga bermahkota ganda, kelopak melebar, lalu inti dan mahkota dalam yang lebih padat. Benih violet meninggalkan spora dan zona dengan efek Toxic Collapse. |
| Plaguebreaker Cannon | Star Cannon 5–2 + Nebula Bloom 5–2 | Tombak stellar tunggal, kelopak melingkari ruang infus, lalu lance berfaset lebih tajam. Proyektil infus, kilat kontak, dan Venom Detonation membedakan serangan beratnya. |
| Supernova Obliterator | Star Cannon 5–2 + Nebula Bloom 2–5 | Lensa bunga lebar, cincin reaktor berkembang, lalu puncak kelopak dengan lensa putih-biru. Ledakan, shockwave kedua, dan tautan chain dibuat terpisah. |
| Toxic Constellation | Star Cannon 2–5 + Nebula Bloom 5–2 | Dua emitter di cabang terbuka, emitter tengah muncul di E2, lalu detail inti dan pola Toxic Network di E3. Shard kecil dan garis violet menjaga bentuk serangan cepat terbaca. |
| Meteor Storm Array | Star Cannon 2–5 + Nebula Bloom 2–5 | Tiga benih tersusun seperti kipas, ruang cluster bertambah, lalu filigri meteor dengan rekahan amber. Proyektil induk dan pecahan terpisah mendukung Cluster Split dan Meteor Rain. |

Paket berisi 312 aset, total 43.381.417 byte. Ada 259 PNG ber-alpha dan 53 WAV. Untuk 15 varian, masing-masing tersedia lima bagian terpisah, preview top-down, atlas gerak, portrait 3/4, siluet dengan alpha yang sama, thumbnail, dan ikon. Set juga memuat lima shadow, lima selection outline, 12 atlas proyektil, 65 atlas efek per keluarga, dan tujuh atlas materialisasi bersama. [Katalog E1–E3](validation/Fusion_Production_Catalog.png) · [Preview animasi dan audio](validation/Fusion_Asset_Preview.html)

Frame gerak mencakup idle, pulse, aim, charge, pre-fire, pelepasan dari tiap emitter, recoil atau buka-tutup kelopak, recovery, reload, dan special. Tiap keluarga punya efek Ascend ke E2 dan E3. Artwork karakter dan bahan efek dibuat dengan ImageGen berdasarkan sprite dan portrait asli, lalu dipisahkan menjadi komponen. Prompt, acuan, dan checksum tersedia pada `artSources` dan `effectArtSource` di manifest.

Cue WAV disintesis dengan resonansi kristal, harmonik, envelope, dan lapisan noise berfilter. Variasi tembakan Toxic dan Meteor memiliki panduan gain dan jeda antar-cue. Durasi cue 0,102–0,810 detik, dengan peak individual −8,87 hingga −2,73 dBFS. [Inventaris cue dan timing](assets/towers/fusion/manifest.json)

**Starburst Cannon** diaudit sebagai Pure Fusion aktif. Manifest mencatat pedestal, chassis, barrel, core, tiga muzzle, tiga frame bolt pada 20 FPS, impact Nova delapan frame, cue audio yang dipakai bersama, dan portrait asli dengan tint hitam saat terkunci. Audit mencatat satu bentuk aktif dan status E2/E3 Starburst. [Audit Starburst di manifest](assets/towers/fusion/manifest.json)

## D. GDevelop Preparation

Semua paket produksi ada di `assets/towers/fusion/`, dikelompokkan per keluarga dan subfolder tier, proyektil, VFX, audio, serta Index. `manifest.json` menyimpan resep untuk integrasi nanti, relasi file dengan ID resource, status impor, ukuran canvas, urutan frame, FPS, loop, origin, offset muzzle per pose, skala, anchor, layer, durasi, dan tujuan cue. Status paket adalah `Complete` untuk aset dan `AwaitingLogic` untuk gameplay. [Manifest produksi](assets/towers/fusion/manifest.json)

Canvas rig 192 × 192 memakai pivot `(96, 96)` dan pose awal menghadap atas. Pedestal tetap diam. Head berotasi dari pivot yang sama dan offset emitter mengikuti pose animasi. Skala visual referensi 0,66 unit dunia per piksel aset. Panduan VFX memisahkan zona di bawah musuh dan flash singkat. Skala tersebut hanya metadata visual. [Fixture render di battlefield](validation/Fusion_Render_Proof.png)

`Tower Defense.json` mendapat lima resource portrait E1. `layouts/game-scene.json` mendapat lima animasi `IndexShowcase` dan lima pasangan data `IndexPortraitCatalog` / `FusionCatalog` dengan ID `FusionPreview_*`. Galactic Archives menggunakan renderer, tint, dan sistem hint yang sudah ada. Kelima entri berstatus `RegisteredIndex` dan terkunci dengan `Variants` kosong. 307 aset lainnya berstatus `ReadyToImport`. Starburst tetap menggunakan ID dan resep aktifnya. [Preview Galactic Archives](validation/Fusion_Index_Preview.png)

Atlas multi-clip bisa diekstrak menjadi grid Piskel per animasi, lalu diimpor dengan FPS dan origin dari manifest. Contoh mengekstrak tembakan Venom E1 ke tujuan PNG baru. [Panduan Piskel GDevelop](https://wiki.gdevelop.io/gdevelop5/tutorials/piskel-sprite-sheets/) · [Dukungan audio GDevelop](https://wiki.gdevelop.io/gdevelop5/all-features/audio/)

```powershell
python -B tools/export-fusion-clip.py assets/towers/fusion/venom_cataclysm/e1/motion.png Fire_M1 "$env:TEMP/venom-e1-fire-piskel.png"
```

## E. QA

| Pemeriksaan yang dijalankan | Hasil |
| --- | --- |
| `validate-fusion-pack.py` | 13.592 pemeriksaan lulus. Path, hash, dimensi, alpha siluet, posisi muzzle pada frame, dan waveform diverifikasi. 245 klip dan 2.172 frame diperiksa. [Hasil statis](validation/fusion-pack-static.json) |
| `validate-campaign.py` | 1.034 pemeriksaan campaign dan 5.237 pemeriksaan struktur lulus. Perbandingan JSON menunjukkan perubahan hanya pada tambahan data Index. [Hasil campaign](validation/campaign-static.json) |
| Kompilasi dan ekspor native GDevelop 5.6.286 | `MainMenu`, `Game Scene`, dan `Levels` dikompilasi dengan nol diagnostik. Preview dibuka dengan Chrome headless. |
| Fixture aset di GDevelop | 574 pemeriksaan lulus. Semua tier, 208 transformasi muzzle pada delapan sudut, pedestal tetap diam, 53 WAV didekode, dan campuran enam cue tembakan cepat diperiksa. Nol error konsol. [Hasil native](validation/fusion-pack-native.json) |
| Gameplay existing | Suite proyek lulus 357 pemeriksaan. Starburst lulus 110 pemeriksaan termasuk transaksi Fusion, rotasi, damage dan splash, serta sell. Nebula Bloom lulus 137 pemeriksaan termasuk 27 state legal, pelepasan benih, dan damage. [Suite proyek](validation/test-clean-project-results.txt) · [Starburst](validation/fusion-pack-starburst-regression.json) · [Nebula Bloom](validation/fusion-pack-nebula-regression.json) |
| Galactic Archives dan persistence | 134 pemeriksaan Index lulus. Uji terpisah mengonfirmasi Starburst bisa dibuka dan dipulihkan setelah reload serta restart Chrome, dengan lima preview tetap terkunci. [Index](validation/fusion-pack-index-regression.json) · [Persistence](validation/fusion-pack-persistence-regression.json) |
| Pipeline preview | Seluruh 245 grid Piskel diuji dalam memori untuk urutan dan alpha. Preview HTML diuji di Chrome untuk pemilihan lima keluarga, E3, pose Fire, rotasi, toggle siluet, pause, dan playback satu cue. |

Tes audio memverifikasi decode dan level sinyal. Pengujian lima Fusion baru mencakup aset dan fixture visual. Penempatan, efek damage, serta playback SFX dari event combat lima Fusion baru menunggu integrasi gameplay. Paket aset yang diminta tersedia, dan Starburst E2/E3 berada di luar audit ini.

Pemeriksaan kebersihan direktori penuh berhenti pada `Tower Defense.json.autosave` yang sudah ada. Validasi resource, kompilasi, dan preview di atas dijalankan terpisah. Tidak ada backup baru.
