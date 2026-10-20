# Contextual Fusion Sidebar

20 Oktober 2026. Project aktif diedit langsung tanpa backup, salinan project/asset, snapshot atau perubahan Git history. Semua perubahan yang sudah ada pada working tree dipertahankan.

## Penyebab struktur UI lama tidak menyatu

Mode sebelumnya masih menampilkan header TOWERS, card pembelian dan scrollbar, kemudian menambahkan plaque instruksi Fusion di bawahnya. Akibatnya sidebar menyampaikan dua tujuan sekaligus: membeli tower dan memilih bahan Fusion. Recipe, biaya, instruksi, penjelasan sumber dan legenda collider memakai bobot visual hampir sama. Memperkecil plaque tidak menyelesaikan konflik tersebut.

## Layout yang sekarang diterapkan

**Normal:** header TOWERS / BUILD DEFENSE, satu card Star Cannon, scrollbar dan footer existing. Ukuran sidebar tetap **224px**, sesuai project aktual; tidak diperlebar menjadi300â€“320px karena akan mengubah area map/camera. Contoh ukuran dalam permintaan diterapkan sebagai prinsip proporsi, bukan alasan menggeser battlefield.

**Fusion:** frame dan header sidebar existing digunakan kembali. Header berubah menjadi **FUSION**, ikon celestial kecil dan indikator tactical speed aktual. Seluruh collection pembelian serta scrollbar disembunyikan sementara, bukan ditimpa panel baru.

- **SELECT_PARTNER:** slot A berisi portrait, TowerName dan path aktual. Slot B menampilkan `? / Select`. Satu instruksi `Select a Max-Level Tower` dan tombol Cancel.
- **PREVIEW_PLACEMENT:** kedua slot menunjukkan tower yang dipilih dengan tanda plus. Bagian Evolution menampilkan portrait/nama sesuai discovery, biaya dari config dan satu status placement.
- **Cancel/sukses:** body Fusion disembunyikan, cache UI dipakai ulang, header/card/scrollbar shop kembali. Tidak menggeser kontrol footer.

Body memiliki lebar 200 px di dalam frame 224 px. Slot source berdampingan dengan border lembut, bukan panel bersarang dengan glow berulang. Artwork showcase existing dipakai kembali. Nama source dibaca dari variable tower; identitas portrait dicari melalui catalog/type/object metadata. Tidak ada literal nama Star Cannon yang menentukan isi slot. Hasil dibaca dari `archive.resolve([A,B])` dan `archive.definition`, bukan asumsi satu nama evolution untuk semua pasangan mendatang. Logic recipe yang boleh digunakan tetap milik controller existing; redesign ini tidak menambahkan mekanik Hybrid baru.

Hasil yang belum ditemukan menggunakan **siluet hitam dengan alpha asli dan nama `???`**; biaya tetap menunjukkan nilai transaksi aktual. Tidak membuka resep, artwork berwarna atau discovery hanya karena UI dirender. Sesudah transaksi yang sah membuka discovery, hasil berikutnya menampilkan nama/artwork aslinya. Tidak mengubah Fusion Index maupun toast discovery.

Status invalid ringkas berasal dari reason validator: `Occupied`, `Outside Fusion Zone`, `Path blocked`, `Insufficient Gold`, dan sebagainya. `Blocked by Ruins/Rock/Crystal` hanya ditampilkan jika collider dari daftar blocker benar-benar overlap dengan ghost. Baris status memakai ruang tetap sehingga error tidak menggeser Cancel atau memperbesar panel.

Teks utama tetap12â€“14px dan label sekunder9â€“10px. **Cancel / ESC** mempunyai hit area selebar body dan tinggi 40 px. Konten mengikuti tinggi fase; tidak membuat bingkai besar dengan padding kosong. Pada viewport pendek, body bermask dapat di-scroll sementara Cancel tetap di luar scroll di atas footer. Dimming 25% kini hanya menutupi battlefield; sidebar aktif tetap terbaca. Footprint/candidate/ghost tetap pada renderer sebelumnya.

Sebagai pembanding prinsip contextual UI, [catatan resmi Ninja Kiwi untuk BTD6](https://store.steampowered.com/news/posts/?appids=960090&enddate=1665538441&feed=steam_community_announcements) mencatat pemeliharaan selection, refresh tower UI, text clipping dan button alignment. Keputusan desain di sini adalah menampilkan satu tujuan sesuai state dan informasi yang diperlukan saat itu. Palette, struktur, icon dan artwork tetap Celestial Void; tidak menyalin UI/aset atau mengklaim memakai implementasi internal BTD6.

## File, scene, event, object dan layer

| File | Perubahan pada task ini |
|---|---|
| `tools/responsive-map-runtime.js` | Cabang visual `ui.refresh`: header Fusion/normal serta visibility card/layer list/scrollbar. Geometry map, input shop/wave dan footer handler tetap |
| `tools/starburst-fusion-runtime.js` | Body contextual, source/result dari data aktif, mask/scroll/lifecycle, pesan pendek, dimmer hanya battlefield; mengganti plaque/legend instruksi lama |
| `layouts/game-scene.json` | Embed dua source pada event existing `events[0].events[0]` dan `events[0].events[3]` |
| `tools/fusion-sidebar-qa.js` | Tes baru state UI, gambar/pixel GPU, input, lifecycle 20 siklus dan ukuran viewport |
| `tools/tactical-fusion-qa.js` | Assertion UI disesuaikan dengan mode sidebar; tes collision/footprint/transaksi tetap |
| `PROJECT_GUIDE.md`, `TACTICAL_FUSION_UX_REPORT.md`, laporan ini, `validation/fusion-sidebar-*` | Dokumentasi dan bukti pengujian |

Scene tetap **Game Scene**. Header memakai object existing **AssetPanelTitle/AssetPanelSubtitle/ShopHeaderPlaque** pada UI. Card existing disembunyikan melalui **TowerShopList** serta visibility masing-masing komponennya. Body mempunyai satu container/graphics/mask dan cache text/portrait pada **FusionUI**; Cancel memakai **SelectedPanelPlaque/IndexText** existing. Tidak ada object definition, resource, asset, layer atau scene variable baru.

State gameplay **FusionActive** dan stage controller tetap existing. `sidebar.phase`, scroll dan cache adalah state presentation JavaScript, bukan variable gameplay baru. Eligibility, pairing, begin/choose, validator dan confirm transaction tidak diubah. Seluruh scene data selain event embedding, project utama, config, combat runtime, archive/storage dan renderer footprint tetap sesuai awal task; bukti hash/count saja pada `validation/fusion-sidebar-scope.json`.

## Pengujian yang benar-benar dijalankan

Native parser/compile/export berhasil: **1 scene, 67 objects, 0 scene diagnostics**. Warning versi libGD/include existing tetap muncul; helper native menyertakan behavior Health yang sudah tersedia. Tidak mengoperasikan editor GDevelop secara manual.

Suite `tools/fusion-sidebar-qa.js` dijalankan pada1280Ã—720 (resolusi asli project),960Ã—640,640Ã—480 serta640Ã—400. Hasil final/count per viewport terdapat pada `validation/fusion-sidebar-1280.json`, `fusion-sidebar-960.json`, `fusion-sidebar-640.json`, `fusion-sidebar-short.json`; semuanya 0 console errors. Hasil: **247 checks** pada masing-masing 1280×720, 960×640 dan 640×480; **228 checks** pada 640×400. Tes meliputi:

- Klik tombol Fusion pada Selected Tower Panel sebenarnya; shop beralih mode dan source A sesuai data.
- Pemilihan source B yang jauh melalui klik map, portrait/path aktual dan urutan A/B dibalik.
- Siluet/nama terkunci tanpa menulis archive; pemeriksaan pixel GPU mendeteksi **nol pixel berwarna** pada result terkunci dan artwork berwarna setelah discovery sukses.
- Ghost valid/invalid, pesan tower/Ruin/region/Gold dari validator, ukuran sidebar tetap stabil.
- Cancel mouse dan ESC, pengembalian shop pada sukses, header/card/scrollbar normal pulih.
- **20 siklus keluar-masuk** per run: native controls, portrait/text cache dan rendering children tidak bertambah.
- Footer Index/Play tetap pada koordinat semula dan tidak tertutup. Teks muat dalam kolom; portrait berada pada frame masing-masing. Viewport640Ã—400 benar-benar menguji wheel/clip body tanpa mengecilkan font.
- Nama source diubah sementara dalam fixture untuk memastikan label membaca variable aktual, bukan literal nama tower.

Regresi tambahan yang lulus, semuanya 0 console errors:

| Suite | Hasil |
|---|---|
| Tactical footprint/placement/transaksi,960Ã—640 | **142 checks** |
| Starburst gameplay/combat | **110 checks** |
| Fusion Index/discovery/persistence | **59 checks + 8 page reload + 8 full browser relaunch** |

Regresi mencakup footprint 15 blocker map, pergerakan/deletion Ruin, tower Max/Non-Max, regional placement, source collision exemption, penolakan placement invalid, pemulihan 2x dari 0.5x, pembelian/upgrade sumber, delapan arah aiming, muzzle/recoil, projectile/damage/splash, sell/refund dan discovery Pure/partial Hybrid/save. Semua fixture hanya berjalan dalam profil browser test terisolasi; tidak mengubah save pemain.

Screenshot yang diperiksa visual:

- `validation/Fusion_Sidebar_Select_Partner.png`
- `validation/Fusion_Sidebar_Known_Result.png`
- `validation/Fusion_Sidebar_Locked_640.png`

Syntax JSON, JavaScript dan kecocokan seluruh runtime/event diuji. Validator statis ketat tetap berhenti pada **`Tower Defense.json.autosave` yang sudah ada sebelum pekerjaan ini**; checksum-nya tetap. Tidak membuat/menghapus/memindahkan autosave tersebut dan tidak melemahkan validator. Sebanyak **3.680 checks** selesai sebelum validator berhenti; batas scope dicatat pada scope report. `node --check` untuk dua runtime dan dua fixture terkait serta `git diff --check` juga lulus. Hasil statis task lama tidak diklaim sebagai full pass task ini.

Belum dilakukan playthrough manual 45 wave, benchmark memori jangka panjang atau pengujian semua platform export. Tidak ada backup baru dibuat.

## Manual testing tambahan

1. Stop Preview lama, reload project aktif `Tower Defense.json`, lalu Start Preview baru.
2. Periksa normal shop, kemudian pilih tower 5-2 dan tekan Fusion. Header/card harus berganti menjadi UI source selection; footer tetap terlihat.
3. Pilih 2-5 di lokasi jauh, periksa slot B, hasil locked/known, cost dan ghost. Gerakkan ke Ruins/tower/jalan/outside zone; status harus ringkas dan Cancel tetap di tempat.
4. Cancel lewat tombol/ESC, lalu ulang dan selesaikan Fusion valid. Shop normal harus pulih. Discovery pertama dan Fusion Index tetap bekerja; pasangan dikenal tidak membuat notifikasi pertama lagi.
5. Resize window dan jalankan sesi panjang untuk melengkapi pemeriksaan lifecycle otomatis terbatas.
