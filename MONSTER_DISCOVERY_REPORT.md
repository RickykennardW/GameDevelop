# Monster Discovery — Beta Portrait & Session Fix

Perbaikan langsung pada project existing, tanpa backup dan tanpa redesign panel/notifikasi, gameplay, balancing atau asset monster.

## Penyebab dan perbaikan portrait

Notifikasi sebelumnya membaca image raw dari animasi Index. Void Hound memakai atlas 1536 × 1024 berisi 4 kolom × 4 baris, sehingga seluruh sheet ikut ditampilkan. Renderer gameplay Hound sudah memakai crop yang benar. Kini `MonsterPortraitConfig` dan satu resolver texture UI dipakai bersama oleh Index dan notifikasi.

| Monster | Animasi idle / frame | Source file aktif | Pemakaian |
|---|---|---|---|
| Nova Wisp | `NovaIdle_Down`, frame 0 | `assets/enemies/nova_wisp/animations/NovaWisp_Down.png` | PNG individual langsung |
| Void Hound | `HoundIdle_Down`, frame 0 | `assets/enemies/void_hound/animations/VoidHound_Down_Atlas.png` | Crop atlas `[0, 0, 384, 255]`, row 0 / column 0 |
| Void Guard | `VoidGuardIdle_Down`, frame 0 | `assets/enemies/void_guard/animations/idle/Idle_Down_0.png` | PNG individual langsung; tidak memakai Move/Up |
| Void Sentinel | `VoidSentinelIdle_Down`, frame 0 | `assets/enemies/void_sentinel/animations/idle/Idle_Down_0.png` | PNG individual langsung |
| Void Brute | `VoidBruteIdle_Down`, frame 0 | `assets/enemies/void_brute/animations/idle/Idle_Down_0.png` | PNG individual langsung |
| Void Golem | `VoidGolemIdle_Down`, frame 0 | `assets/enemies/void_golem/animations/VoidGolem_Down.png` | Crop atlas `[0, 0, 256, 307]`, row 0 / column 0 |

Crop memakai batas frame dari konfigurasi animasi existing. Tidak ada frame tetangga atau background checkerboard yang disertakan. PNG individual tidak di-extract ulang. Transparansi RGBA asli dipertahankan; tidak ada perubahan byte gambar gameplay.

Ukuran dan posisi portrait dihitung dengan satu skala proporsional berdasarkan visual bounding box alpha (threshold 8/255), bukan dimensi atlas. Threshold hanya untuk pengukuran: tidak membuang/mengubah pixel texture. Body berada di tengah, aspect ratio tetap dan seluruh frame asli tetap tersedia. Golem tidak lagi membawa padding layout gameplay ke ukuran portrait UI. Siluet, outline, reveal, panel, durasi empat detik, queue, posisi dan SFX existing tetap berlaku.

**Resource/file gambar baru: 0.** Dua crop texture UI dibuat di memori untuk Hound/Golem, dipakai ulang dan dilepas saat scene unload tanpa menghancurkan base texture gameplay. Project tetap memiliki 356 resource: 331 image + 25 audio.

## Discovery hanya selama sesi beta

Status kini berada pada `RuntimeGame.__celestialMonsterDiscoverySession`, menggunakan Set ID monster, queue, notifikasi aktif dan revision counter. Tidak menggunakan localStorage, sessionStorage, file save atau persistent GDevelop variables untuk menyimpan discovery.

- Launch aplikasi/game baru: seluruh monster UNDISCOVERED.
- Pertama kali benar-benar spawn dalam wave: jenis itu DISCOVERED dan masuk queue sekali pada sesi tersebut.
- Index buka/tutup, wave berubah, 1×/2× dan UI/gameplay lainnya: tidak mereset status.
- Perpindahan/reload scene biasa dalam RuntimeGame yang sama: status, queue dan notifikasi aktif tetap; tidak ada duplikasi suara.
- Exit aplikasi lalu launch ulang: RuntimeGame baru, seluruh discovery kosong dan notifikasi boleh muncul kembali.
- Restart/New Game eksplisit: panggil `runtimeScene.getGame().__celestialMonsterDiscoverySession?.resetForNewGame()` sebelum mengganti/restart scene. API hanya mereset discovery. API scene `runtimeScene.__monsterDiscovery.resetForNewGame()` juga tersedia. Keduanya memakai state sesi yang sama.

Project saat ini tidak memiliki tombol Restart/New Game tersendiri. Tidak ditambahkan tombol/scene baru; reset eksplisit disediakan dan diuji melalui API di atas, sementara ordinary scene replacement tetap mempertahankan sesi.

Data lama tidak pernah dibaca. Hanya key lama `celestialVoidMonsterDiscovery.v1` yang dihapus sekali pada inisialisasi sesi baru; cache discovery legacy di RuntimeGame juga dibuang. Tidak ada `localStorage.clear()`. Preferensi audio/settings dan key lain dipertahankan. Bila browser melarang akses storage, pengabaian data lama dan sesi kosong tetap berjalan.

## File berubah

- `layouts/game-scene.json`: tambah metadata `MonsterPortraitConfig`; embed ulang discovery runtime dan Index runtime. Tidak mengubah object definitions, instance, stat, wave, map atau animasi Enemy.
- `tools/monster-discovery-runtime.js`: resolver single-frame/bounds, kepemilikan texture UI, state sesi, reset New Game, selective cleanup key lama, dan kelanjutan queue antar-scene.
- `tools/unit-index-runtime.js`: menyampaikan slot/center portrait ke resolver bersama; layout card existing tetap.
- `tools/discovery-beta-qa.js`: fixture baru untuk seluruh portrait dan lifecycle sesi.
- `tools/discovery-qa.js`: adaptasi pengujian discovery dari persistent menjadi session-only.
- `tools/balance-browser.py`: verifikasi aplikasi browser benar-benar ditutup dan diluncurkan ulang dengan profile test yang sama.
- `tools/test-void-hound.js`: assertion portrait kini membandingkan source base texture, koordinat crop dan ukuran frame; tidak mensyaratkan object texture UI dan gameplay identik.
- `tools/validate-project.py`: validasi metadata idle/frame, resource, transparansi dan visual bounds keenam portrait.
- `README.md`, `PROJECT_GUIDE.md`, laporan ini: dokumentasi beta terkini.
- `validation/`: evidence native/static, hasil regresi dan preview terkini. Fixture persistence lama digantikan pengujian sesi/relaunch.

Sumber spawn, movement, combat, audio runtime, stats, asset asli dan source mapping tidak diubah dalam pekerjaan ini.

## Pengujian yang dijalankan

1. Native GDevelop membaca scene/65 object, mengompilasi scene dan extension Health serta mengekspor preview dengan **0 scene diagnostic**. JSON/resource/source mapping valid; 59 scene variables (satu tambahan metadata portrait), 157 instance dan 24 runtime source.
2. **53 pemeriksaan beta** lolos: semua enam sumber Idle_Down yang benar; satu frame atlas untuk Hound/Golem; penggunaan PNG individual; texture bersama antara Index/notifikasi; hitam penuh saat locked; visual bounding box, center dan aspect ratio; lifecycle scene; New Game; serta resource/crop cleanup. Console error 0.
3. Browser headless Chrome benar-benar ditutup secara normal lalu diluncurkan kembali menggunakan profile test yang sama. Legacy save sengaja diisi seluruh monster discovered sebelum exit. Setelah relaunch: found kosong, queue kosong, notifikasi aktif kosong, key legacy hilang; Master audio 73% dan key lain tetap. Native spawn Nova Wisp kemudian berhasil memunculkan discovery lagi.
4. Ordinary native scene replacement mempertahankan dua discovered types, notifikasi aktif dan queue tanpa memutar ulang sound. Reset New Game eksplisit mengosongkan discovery/queue; first encounter berikutnya memunculkan satu notifikasi lagi.
5. **43 pemeriksaan portrait** masing-masing lolos pada preview Hound dan Guard. Hasil gambar aktual: `validation/Discovery_VoidHound.png`, `validation/Discovery_VoidGuard.png`. Keduanya ditinjau secara visual: satu monster, transparansi, body centered, tanpa atlas/checkerboard atau clipping body.
6. **52 pemeriksaan discovery/notifikasi** lolos pada 1920×1080, 1280×720 dan 960×640: trigger wave existing, satu notifikasi per jenis, queue enam jenis, siluet/reveal, live Index, timing sama pada 1×/2×, bebas HUD/shop/upgrade, pointer pass-through, placement 300 Gold, dan bounded render nodes/cache/callbacks. Tower Index tetap sama.
7. Ketujuh suite native gameplay lolos **23.789 pemeriksaan**, tanpa exception: Tower/selection/obstacle/shop (283), Nova Wisp (14.532), Void Hound (117), Void common (636), HP bars/balance (183), Void Golem (552), Gold Budget (7.486). Gameplay animations arah/state dan frame asli tetap berfungsi.
8. Idle map/HUD/Tower Shop tetap identik piksel dengan preview sebelumnya. Semua path resource valid; seluruh checksum audio tetap sama. Data instance, existing scene variables/config, layer/editor settings dan source gameplay yang dilindungi tidak berubah.

Pengujian menggunakan runtime/compiler GDevelop asli dan preview Chrome terisolasi. Fixture mengontrol queue pada scene test sambil memakai spawner native existing. GUI editor interaktif, packaged desktop/mobile export dan kampanye real-time penuh 45 wave tidak dijalankan. Uji close/relaunch di atas benar-benar mengganti proses browser; bukan hanya reload halaman.

**Backup baru: 0. Tidak ada asset gameplay yang diganti.**
