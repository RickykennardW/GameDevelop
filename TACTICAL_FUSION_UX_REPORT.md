# Tactical Fusion — footprint lingkungan dan Compact HUD

Tahap berikutnya mengganti kotak instruksi di bawah shop dengan sidebar Fusion kontekstual: [FUSION_SIDEBAR_REDESIGN_REPORT.md](FUSION_SIDEBAR_REDESIGN_REPORT.md). Footprint lingkungan tetap dipertahankan; ukuran/struktur HUD pada laporan ini adalah catatan tahap sebelumnya.

20 Oktober 2026. Project aktif diedit langsung. Tidak ada backup, salinan project/asset, snapshot, branch cadangan atau perubahan Git history. Perubahan working tree sebelumnya dipertahankan.

## Akar masalah

Fusion renderer sebelumnya hanya melakukan loop `p.towers()`. Ruins, Crystal, Rock, Spawn dan Base sudah menjadi blocker melalui `__freePlacement.blockers`, tetapi tidak ikut digambar. Ring build biasa juga hanya terlihat ketika placement tower normal aktif; Fusion memanggil `p.stop()`, sehingga ring tersebut disembunyikan.

Panel instruksi lama berukuran sampai 460×96 ditambah tombol Cancel terpisah dan diposisikan pada bagian atas battlefield. Notifikasi discovery Fusion memakai panel 440×132 dengan geometry notifikasi monster di area map. Keduanya merupakan masalah presentation; validator dan transaksi Fusion sudah berjalan.

## Footprint yang diterapkan

- Satu batch `worldGraphics` pada FusionUI menggambar collider dari **array `p.blockers` yang sama persis dengan validator**. Warna amber transparan, outline tipis, dan diamond kecil membedakannya dari footprint tower.
- Collider lingkungan aktual semuanya berupa **circle**: `p.blockedCircle` menghitung circle dari contour prop yang sudah diskalakan, atau ukuran Spawn/Base. Maka outline circle adalah bentuk collision sebenarnya. Polygon dari artwork tidak dipakai sebagai pengganti collider; algoritma collision tidak diubah. Road tetap memakai polygon validator existing dan terlihat sebagai jalur map.
- Ruins/Crystal/Rock blocking, Spawn dan Base ikut ditampilkan. Shrub yang tidak blocking tidak diberi footprint. Tidak ada daftar nama dekorasi tambahan yang dipaksakan menjadi blocker.
- Tower tetap memakai center/radius authoritative existing. Dua sumber cyan dan boleh di-overlap; tower Max/Non-Max lain tetap merah dan memblokir. Ghost tetap hijau/merah dari `f.validate`. Regional radius, road, map boundary dan padding tetap.
- Outline berada di atas dimming existing dan di bawah ghost/tombol. Mask membatasi batch world pada area battlefield, sehingga tidak menggambar ke sidebar.
- `obstacleFootprints` menyimpan record per owner, bukan membuat object native baru per frame. Geometry mengikuti collider yang di-refresh setiap frame. Owner yang dihapus/tidak blocking dilepas dari cache; Cancel/sukses membersihkan batch, cache, marker, ghost dan mask. Re-entry membangun ulang mask yang sudah dibersihkan.

## Compact Fusion HUD dan toast

Lokasi yang dipilih adalah **ruang kosong Tower Shop di bawah card Star Cannon, di atas footer Index/Play**. Shop tetap berukuran sama dan card tidak dipindah/diperbesar. Fungsi `hudSlot(height)` membaca posisi layar sebenarnya melalui konversi layer UI/TowerShopList, mengurangi area header, footer, card dan panel lain, lalu memakai gap yang tersedia. Tidak menambah area input pada map.

HUD dasar **200×174** memakai plaque/text existing pada FusionUI, background purple, detail gold kecil dan typography ringkas:

- Partner: `FUSION MODE`, pilih opposite Max-Level path, recipe 5-2 + 2-5.
- Placement: nama tower hasil dari config, `Place near Tower A or B`, status validasi serta legend amber/red.
- Kedua tahap: **Fusion Cost dibaca dari config**, Cancel/ESC berada di dalam panel.

Discovery tetap terpisah dari instruksi: toast **200×116** pada DiscoveryUI memakai gap sidebar yang sama setelah Fusion selesai. Nama/artwork aktual, reveal, queue, chime dan durasi empat detik dipertahankan. Animasi gerak diperkecil menjadi 12px dan dimask pada slot. Semua dekorasi PIXI noninteraktif. Toast menunggu ketika Fusion/Index/notifikasi monster aktif; varian yang sudah ditemukan tidak mengulang notifikasi.

Sebagai pembanding prinsip UX, [catatan resmi Ninja Kiwi untuk BTD6](https://store.steampowered.com/news/posts/?appids=960090&enddate=1665538441&feed=steam_community_announcements) mencatat perbaikan alignment UI pada berbagai resolusi. Keputusan desain di project ini adalah menjaga battlefield terbuka, memakai cue placement konsisten dan memisahkan instruksi dari discovery. Ini desain Celestial Void sendiri, tanpa menyalin asset/UI atau mengklaim memakai collision internal BTD6.

## File, scene, object, variable dan event

| File | Perubahan task ini |
|---|---|
| `tools/starburst-fusion-runtime.js` | Batch/mask footprint lingkungan, cache owner, helper slot sidebar, Compact Fusion HUD dan cleanup renderer |
| `tools/fusion-archive-runtime.js` | Presentation toast: ukuran/layout, slot sidebar dan gerak reveal; state/save/recipe tidak diubah |
| `layouts/game-scene.json` | Embed dua source pada event existing `events[0].events[3]` dan `events[0].events[4]` |
| `tools/tactical-fusion-qa.js` | Tes native geometry, input, layout responsif, lifecycle, transaksi dan toast |
| `tools/fusion-fixes-qa.js` | Assertion posisi notifikasi disesuaikan dari map ke sidebar; assertion gameplay/discovery lainnya tetap |
| `PROJECT_GUIDE.md`, `FUSION_FIXES_REPORT.md`, laporan ini, `validation/tactical-fusion-*` | Dokumentasi serta hasil validasi |

Scene tetap **Game Scene**. Object existing yang dipakai ulang: **SelectedPanelPlaque**, **IndexText**, **StarburstGhost**; layer existing **FusionUI/DiscoveryUI**. Tidak ada object definition, resource, layer, scene variable atau asset baru. Native instance HUD dibuat secara reusable saat runtime, sebagaimana sistem UI existing.

`Tower Defense.json`, seluruh scene data selain events, konfigurasi dan runtime lain tetap identik terhadap awal task. Khususnya `free-placement-runtime.js` dan seluruh collider/validator tetap byte-identik. Fungsi eligibility, pairing, begin/choose, validation dan confirm transaction Fusion serta bagian state/storage Fusion archive juga diperiksa terhadap source awal. Bukti hash/count tanpa source recoverable: `validation/tactical-fusion-scope.json`.

## Pengujian aktual

Native GDevelop parser membaca **1 scene / 67 object**, compile menghasilkan **0 scene diagnostics**, export preview berhasil. Toolchain libGD lokal mengeluarkan warning versi/include existing; helper validation menyertakan bundle Health native yang sudah dipakai sebelumnya.

| Suite native di profil test terisolasi | Hasil |
|---|---|
| Tactical Fusion, 1280×720 | **144 checks**, 0 console errors |
| Tactical Fusion, 960×640 | **144 checks**, 0 console errors |
| Tactical Fusion, 640×480 | **144 checks**, 0 console errors |
| Starburst gameplay/combat regression | **110 checks**, 0 console errors |
| Fusion Index/discovery/save regression | **59 checks + 8 page reload + 8 full browser relaunch**, 0 console errors |

Tes terfokus mencocokkan semua **15 collider lingkungan map asli** dengan geometry circle amber pada batch PIXI, termasuk radius setelah camera zoom. Tujuh dekorasi non-blocking tidak diberi footprint. Fixture Ruin ditambahkan pada scene test: placement ditolak, sumber/Gold tetap; perpindahan 300 world px menggeser footprint sesuai collider, dan deletion menghilangkan collision/outline. Semua ini hanya fixture test, tidak masuk project aktif.

Tes juga mencakup Max/Non-Max, pemilihan partner jauh via klik map, overlap kedua sumber, penolakan tower lain/road/outside region, klik dekat batas sidebar, Cancel dan ESC, cleanup sukses, serta delapan siklus mode berulang. Sebanyak 240 frame tidak menambah native HUD objects/render children dan tetap memakai record footprint yang sama. HUD diuji menghindari card/header/footer/HUD/Selected Panel pada tiga resolusi; perubahan fee sementara di fixture membuktikan label membaca config.

Regresi gameplay menjalankan pembelian/upgrade melalui UI native, pemulihan 2x setelah mode 0.5x, transaksi/refund, aiming delapan arah, tiga muzzle, recoil, projectile, direct/splash damage, VFX cleanup dan upgrade locking. Save regression memeriksa first discovery sekali, Fusion Index, partial Hybrid independen, ordinary reload dan browser relaunch tanpa menghapus audio/unrelated storage pengguna. Semua memakai profil test tersendiri.

Screenshot tambahan diperiksa secara visual:

- `validation/Tactical_Fusion_Placement_1280.png` — **111 checks** sebelum berhenti pada placement.
- `validation/Tactical_Fusion_Placement_640.png` — **111 checks** sebelum berhenti pada placement.
- `validation/Tactical_Fusion_Toast_960.png` — **140 checks** sebelum berhenti pada toast.

Syntax JSON, resource/source mapping, JavaScript syntax dan batas scope diperiksa. **Validator ketat tetap berhenti pada `Tower Defense.json.autosave` yang sudah ada sebelum task**, bukan karena resource hilang. Autosave tersebut tidak dibuat/diubah/dihapus; checksum awal/akhir dicatat. Validator tidak dilemahkan dan hasil statis task lama tidak diklaim sebagai hasil lulus task ini. Detail jumlah checks sampai berhenti ada pada scope report.

Belum dilakukan interaksi manual di editor GDevelop, playthrough penuh 45 wave, benchmark jangka panjang atau pengujian semua platform export. Uji lifecycle terbatas tidak menunjukkan pertumbuhan object/graphics children. Tidak ada backup baru dibuat.

## Manual testing tambahan

1. Stop Preview lama, reload `Tower Defense.json` aktif dan Start Preview baru.
2. Pilih tower 5-2, aktifkan Fusion lalu pilih 2-5 yang jauh. Periksa HUD di sidebar dan semua outline amber pada Ruins/Crystal/Rock/Spawn/Base; Shrub tidak beroutline.
3. Gerakkan ghost pada Ruins, tower lain, jalan dan di dekat kedua sumber. Hanya lokasi valid berwarna hijau. Coba konfirmasi invalid: sumber dan Gold harus tetap.
4. Coba Cancel tombol dan ESC beberapa kali, lalu lakukan Fusion sukses. Tidak boleh ada ghost, dimming, marker atau footprint tertinggal; speed kembali.
5. Pada profil belum ditemukan, periksa toast kecil sidebar dan Fusion Index. Ulang Fusion yang sama: jangan ada toast pertama berulang. Resize 1280×720 / 960×640 / 640×480 dan lanjutkan sesi panjang untuk melengkapi uji stabilitas otomatis yang terbatas.
