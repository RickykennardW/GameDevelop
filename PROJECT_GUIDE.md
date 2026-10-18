# Pemeliharaan Celestial Void

## Sumber aktif

Project utama adalah `Tower Defense.json`; scene terpisah berada di `layouts/game-scene.json`. Seluruh property, ukuran, instance, camera, object folder, gameplay variable dan event berada pada kedua file ini. Extension Health berada di `eventsFunctionsExtensions/health.json`.

`tools/source-mapping.json` memetakan 24 source JavaScript ke event scene. `python tools/embed-free-placement.py` melakukan embedding langsung, tanpa membuat salinan. Jangan mengembalikan script migrasi lama atau file konfigurasi hasil eksperimen yang sudah dihapus. Semua perubahan harus mengikuti **NO BACKUP** pada `AGENTS.md`.

## Sistem yang dipertahankan

- Satu Star Cannon resmi, harga 300 Gold, desain Nova Spike, 27 kombinasi upgrade valid dari dua path sampai Lv5. Base tetap diam, chassis dan core mengikuti pivot bersama, barrel recoil independen. Path 1 memakai Nova setiap tembakan keempat, Armor Fracture dan Lance lurus; Path 2 memakai muzzle bergantian, Rhythm dan Overdrive. Targeting, sell dan footprint tetap pada sistem existing.
- Nova Wisp, Void Hound, Void Guard, Void Sentinel, Void Brute dan elite Void Golem menggunakan object Enemy bersama. Animasi arah/state, armor, HP, movement, death dan HP bars tetap tersedia.
- Golem memakai stationary cast dan Void Fortification: konfigurasi authoritative ada pada `VoidGolemConfig`, bukan file metadata eksperimen lama.
- Map Celestial Void, waypoints, Spawn/Base, obstacle blockers/removal, Tower Shop, Selected Upgrade Panel, Index, HUD dan camera tetap.
- 45 waves memakai `WaveBudgetConfig`, dengan milestone dan seeded enemy composition existing. Cleanup tidak mengubah harga, damage, stats, rewards, pacing, 1x/2x atau Manual/Auto.

## Konfigurasi dan animasi

Gunakan scene variables sebagai sumber authoritative:

| Variable | Fungsi |
|---|---|
| `StarCannonConfig` | Stats, additive modifiers, harga, Nova, Fracture, Rhythm, Overdrive dan Lance |
| `StarComponentConfig` | Atlas frames, modular parts, pivot, muzzle, hull, scale dan recoil 27 kombinasi |
| `NovaWispConfig.Views` | Atlas/crop/anchor Nova Wisp |
| `VoidHoundConfig.Views` | Atlas/crop/anchor Hound |
| `VoidCommonConfig` dan object Enemy animations | Frame state/direction Guard, Sentinel dan Brute |
| `VoidGolemConfig.Views` | Atlas/crop/anchor serta konfigurasi elite |
| `EnemyHPBarConfig` | Geometri dan offset HP bars |
| `TowerFootprints`, `SelectionGeometry` | Placement dan selection |
| `WaveBudgetConfig`, `EnemyTypes`, `WavePacing` | Wave, stats enemy dan pacing |
| `AudioConfig` | Music states, SFX, volume, cooldown dan resource identifiers |

Metadata frame/pivot yang dipakai game sudah tersimpan di konfigurasi aktif tersebut. File provenance, generation prompt, manifest artwork dan metadata duplikat dari prosedur migrasi lama tidak diperlukan saat membuka atau menjalankan game.

Setiap resource dikelola oleh GDevelop melalui **name** dan **file** yang berbeda. Jangan mengganti object/variable/resource name hanya agar menyerupai path filesystem. Tombol Play dan Index kini memakai satu texture identik bersama melalui identifier `assets/celestial_void/ui/button.svg`; object dan fungsi kedua tombol tetap terpisah.

## Audio original

Empat BGM OGG di `assets/audio/music`: Ancient Galaxy Ambience 120s / 64 BPM, Sacred Void Temple 128s / 60 BPM, Cosmic Defense 120s / 96 BPM, Void Awakening 120s / 112 BPM. Semua berbagi motif D5â€“F5â€“E5â€“A4â€“D5 dan respon C5â€“Bb4â€“A4, dengan pad kosmik, choir formant tanpa kata, crystal bells, strings, bass dan perkusi terkontrol.

`tools/compose-galaxy-audio.py` dan `tools/audio-codec-browser.py` adalah source komposisi/encoding original yang dipertahankan, bukan file hasil eksperimen. Render memakai NumPy dan WebCodecs lokal; tidak memakai sample lagu komersial, layanan luar atau intermediate WAV. `assets/audio/manifest.json` masih dipakai validasi 25 audio dan memisahkan `resourceName` dari `file`.

Runtime memakai crossfade 3s, looping native, maksimal 2 BGM dan 12 SFX, rate limits, Gold aggregation, high-priority ducking dan compressor. Default Master 100%, Music 35%, SFX 70%, UI 45%; localStorage menyimpan pengaturan. Chrome memerlukan interaksi pengguna untuk unlock audio.

## Validasi dan development

`tools/validate-project.py` memeriksa JSON, split references, resource paths/casing, object folders/groups, instance layers, source/event consistency, audio hashes, asset yang tidak didaftarkan, dan ketiadaan backup. Tool tidak menyimpan isi JSON project untuk pemulihan.

`tools/validate-clean-project.cjs` memakai libGD serta runtime GDevelop yang terpasang untuk compile/export native, dan membersihkan hanya direktori build preview khusus sebelum regenerasi. Ia tidak membuat project source copy. `run-clean-validation.py` dan delapan suite native memeriksa placement, 27 upgrade combinations, rotation/muzzle, projectile, enemy, HP bars, obstacle removal, UI, camera dan seluruh 45-wave rules.

`tools/build-nova-spike.py` menyusun preview dan konfigurasi frame dari sebelas atlas artwork final di `assets/towers/star_cannon/nova_spike/atlases/`. Seluruh 27 komposit PNG dipakai oleh object native untuk editor/shop/ghost/Index/Selected Panel; renderer world menyusun bagian atlas yang sama. Perulangan build mempertahankan balancing Nova Spike yang sudah ada. `tools/nova-spike-prompts.json` menyimpan prompt produksi image_gen, termasuk koreksi unit barrel Rhythm. Jalankan embedding dan compile ulang setelah perubahan source. Rincian parameter, file dan pengujian ada di `NOVA_SPIKE_REPORT.md`.

`preview-smoke.js`, fixture audio, dan driver `balance-browser.py` dipertahankan karena benar-benar dipakai untuk pemeriksaan preview/loop/volume/SFX. Artefak pengembangan dan hasil test historis dihapus; `validation/` berisi bukti terbaru. Cache/toolchain bersama di luar project bukan dependency folder yang disalin ke project dan tidak dihapus.

Excel final di `data/` adalah deliverable pengguna yang dipertahankan byte-identik. Ia tidak mengendalikan balancing game dan harus diperbarui bila konfigurasi gameplay kelak berubah.

## Monster discovery dan notifikasi

`tools/monster-discovery-runtime.js` diinisialisasi sesudah responsive shop/map dan sebelum Index/spawn. Satu callback `onWaveSpawn(enemy,type)` di akhir inisialisasi enemy pada `nova-spawn-runtime.js` adalah satu-satunya trigger unlock. Jangan memindahkannya ke object creation umum atau renderer Index.

Versi beta memakai `game.__celestialMonsterDiscoverySession` di memori RuntimeGame berdasarkan ID `EnemyTypes` yang stabil (`Basic` adalah Nova Wisp). Launch aplikasi baru membuat sesi kosong; perpindahan/reload scene biasa mempertahankan discovery serta notifikasi aktif/queue. Key discovery lama `celestialVoidMonsterDiscovery.v1` diabaikan dan hanya key tersebut dihapus sekali saat sesi baru. Settings/audio tidak dihapus. Untuk Restart/New Game eksplisit, panggil `runtimeScene.getGame().__celestialMonsterDiscoverySession?.resetForNewGame()` sebelum mengganti scene; API hanya mereset discovery, bukan gameplay lain. Project belum memiliki tombol Restart/New Game tersendiri, sehingga tidak ditambahkan kontrol UI baru. Registry otomatis mengikuti archetype aktif yang memiliki animation portrait di IndexMonsterImage, dalam urutan portrait existing. Untuk monster baru, daftarkan archetype dan portrait asli; tidak perlu mengubah daftar ID dalam notifikasi.

Index menampilkan siluet hitam lewat tint per sprite, dengan salinan texture berwarna ungu gelap sebagai outline. Original texture tidak diedit. `MonsterPortraitConfig` memilih frame idle existing per jenis. Hound memakai cell `[0,0,384,255]` dan Golem `[0,0,256,307]`; jenis lain memakai PNG individual langsung. Texture satu frame dan fit berdasarkan visual alpha bounds yang sama digunakan oleh seluruh portrait Index/notifikasi; crop GPU hanya dimiliki UI dan dilepas ketika scene unload. Hanya nama/stat/role monster yang terkunci disamarkan; Tower Index tetap penuh. Dirty key pada Index meliputi status discovery sehingga unlock langsung terlihat tanpa redraw setiap frame.

Layer `DiscoveryUI` memakai graphics/text/sprite PIXI yang reusable dan tidak interaktif. Animasi empat detik memakai waktu tanpa multiplier gameplay, queue maksimal satu entry per jenis, dan geometry menghindari HUD, sidebar serta Selected Tower Panel. Cue `DiscoveryUnlock` memakai chime WaveComplete existing pada volume UI yang lebih rendah; BGM tetap berjalan. Source ada pada mapping runtime ke-24.

Pengujian: `python tools/balance-browser.py tools/discovery-qa.js validation/discovery-full.json --gesture`. `--viewport=960x640` memeriksa layout responsif. `python tools/balance-browser.py tools/discovery-beta-qa.js validation/discovery-beta.json --gesture --discovery-relaunch-check` menguji ordinary scene reload, reset New Game eksplisit, lalu benar-benar menutup dan meluncurkan kembali browser dengan profile test yang sama. Discovery harus kosong lagi, preferensi audio dan key lain harus tetap. Gunakan profile test terisolasi, bukan storage pengguna.
