# Pemeliharaan Celestial Void

## Sumber aktif

Project utama adalah `Tower Defense.json`; scene terpisah berada di `layouts/game-scene.json`. Seluruh property, ukuran, instance, camera, object folder, gameplay variable dan event berada pada kedua file ini. Extension Health berada di `eventsFunctionsExtensions/health.json`.

`tools/source-mapping.json` memetakan 23 source JavaScript ke event scene. `python tools/embed-free-placement.py` melakukan embedding langsung, tanpa membuat salinan. Jangan mengembalikan script migrasi lama atau file konfigurasi hasil eksperimen yang sudah dihapus. Semua perubahan harus mengikuti **NO BACKUP** pada `AGENTS.md`.

## Sistem yang dipertahankan

- Satu Star Cannon resmi, harga 300 Gold, 21 kombinasi upgrade valid dari dua path. 21 Base, 21 Turret dan21 preview state tetap tersedia. Rotation, muzzle, homing, splash, sell dan collision tetap pada source existing.
- Nova Wisp, Void Hound, Void Guard, Void Sentinel, Void Brute dan elite Void Golem menggunakan object Enemy bersama. Animasi arah/state, armor, HP, movement, death dan HP bars tetap tersedia.
- Golem memakai stationary cast dan Void Fortification: konfigurasi authoritative ada pada `VoidGolemConfig`, bukan file metadata eksperimen lama.
- Map Celestial Void, waypoints, Spawn/Base, obstacle blockers/removal, Tower Shop, Selected Upgrade Panel, Index, HUD dan camera tetap.
- 45 waves memakai `WaveBudgetConfig`, dengan milestone dan seeded enemy composition existing. Cleanup tidak mengubah harga, damage, stats, rewards, pacing, 1x/2x atau Manual/Auto.

## Konfigurasi dan animasi

Gunakan scene variables sebagai sumber authoritative:

| Variable | Fungsi |
|---|---|
| `StarCannonConfig` | Stats dan dua upgrade path |
| `StarComponentConfig` | Seluruh pivot, muzzle, socket, hull dan scale 21 kombinasi |
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

Empat BGM OGG di `assets/audio/music`: Ancient Galaxy Ambience 120s / 64 BPM, Sacred Void Temple 128s / 60 BPM, Cosmic Defense 120s / 96 BPM, Void Awakening 120s / 112 BPM. Semua berbagi motif D5–F5–E5–A4–D5 dan respon C5–Bb4–A4, dengan pad kosmik, choir formant tanpa kata, crystal bells, strings, bass dan perkusi terkontrol.

`tools/compose-galaxy-audio.py` dan `tools/audio-codec-browser.py` adalah source komposisi/encoding original yang dipertahankan, bukan file hasil eksperimen. Render memakai NumPy dan WebCodecs lokal; tidak memakai sample lagu komersial, layanan luar atau intermediate WAV. `assets/audio/manifest.json` masih dipakai validasi 25 audio dan memisahkan `resourceName` dari `file`.

Runtime memakai crossfade 3s, looping native, maksimal 2 BGM dan 12 SFX, rate limits, Gold aggregation, high-priority ducking dan compressor. Default Master 100%, Music 35%, SFX 70%, UI 45%; localStorage menyimpan pengaturan. Chrome memerlukan interaksi pengguna untuk unlock audio.

## Validasi dan development

`tools/validate-project.py` memeriksa JSON, split references, resource paths/casing, object folders/groups, instance layers, source/event consistency, audio hashes, asset yang tidak didaftarkan, dan ketiadaan backup. Tool tidak menyimpan isi JSON project untuk pemulihan.

`tools/validate-clean-project.cjs` memakai libGD serta runtime GDevelop yang terpasang untuk compile/export native, dan membersihkan hanya direktori build preview khusus sebelum regenerasi. Ia tidak membuat project source copy. `run-clean-validation.py` dan tujuh suite native memeriksa placement, 21 upgrade combinations, rotation/muzzle, projectile, enemy, HP bars, obstacle removal, UI, camera dan seluruh 45-wave rules.

`preview-smoke.js`, fixture audio, dan driver `balance-browser.py` dipertahankan karena benar-benar dipakai untuk pemeriksaan preview/loop/volume/SFX. Artefak pengembangan dan hasil test historis dihapus; `validation/` berisi bukti terbaru. Cache/toolchain bersama di luar project bukan dependency folder yang disalin ke project dan tidak dihapus.

Excel final di `data/` adalah deliverable pengguna yang dipertahankan byte-identik. Ia tidak mengendalikan balancing game dan harus diperbarui bila konfigurasi gameplay kelak berubah.
