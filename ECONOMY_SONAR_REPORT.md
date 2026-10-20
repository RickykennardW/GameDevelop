# Placement Economy dan Celestial Sonar

Project aktif Celestial Void diedit langsung tanpa backup, salinan project/asset, snapshot atau perubahan Git history. Seluruh perubahan working tree sebelum task dipertahankan.

## Analisis dan perubahan pembelian

Pemilihan tower sebelumnya dibatasi Gold di **tiga tempat**: input card dalam responsive shop, kondisi native event selection, serta validator preview. Audio observer juga memainkan InvalidAction saat memilih card yang belum terjangkau. Akibatnya pemain tidak dapat merencanakan posisi tanpa uang cukup, dan status collision bercampur dengan status pembelian.

Sekarang input card dan event selection mengizinkan pemilihan terlepas dari Gold. Harga dan tampilan affordability card tetap mengikuti data existing. Validator shared mendukung opsi **`ignoreGold:true`** untuk preview normal; geometri collision tidak diduplikasi. `p.preview.valid` dan warna ghost menunjukkan lokasi, sedangkan `p.preview.affordable` menunjukkan kondisi ekonomi. Footprint dan range tetap terlihat.

Pada klik konfirmasi, sistem membaca cursor dan collider terbaru, memeriksa spatial/UI terlebih dahulu, lalu membaca **Money dan cost catalog saat itu**. Jika uang kurang, tidak membuat tower, tidak memotong Gold dan tidak menghentikan builder. Jika cukup, transaksi sinkron existing menginisialisasi satu tower, memotong cost sekali dan mengakhiri builder. Edge input tetap mencegah held-click melakukan transaksi berulang.

Pemanggilan `p.validate` tanpa opsi tetap memeriksa Gold, termasuk transaksi Tactical Fusion. Urutan UI/collision kini mendahului Gold sehingga klik sidebar/panel atau lokasi terhalang tidak dianggap kegagalan pembelian. Tidak mengubah harga Star Cannon **300 Gold**, Gold awal **50000**, reward, upgrade atau sell.

Feedback Gold memakai satu container/text reusable di ruang kosong sidebar: **NOT ENOUGH GOLD / Need N More Gold**. N dihitung dari Money aktual. `PlacementFeedbackConfig` menyimpan durasi **1 detik**, cooldown **0.65 detik**, dan ID sound. Klik cepat tidak menumpuk notice/cue; cooldown feedback tidak pernah menghalangi pembelian yang sudah valid. Pesan hilang saat cukup uang, Cancel atau kedaluwarsa; ghost tetap aktif sesudah penolakan. Audio observer tidak lagi memberi error saat memilih card, dan hanya memberi InvalidAction untuk lokasi yang memang terhalang.

## Celestial Sonar dan ETA

Project memakai `Enemy`, native Health, variable **Waypoint/MoveSpeed/PathFinished**, route **MonsterPathPoints**, dan BaseMarker. Movement memakai budget speedÃ—elapsed melalui seluruh waypoint, termasuk belokan. Golem berhenti melalui `__golemState.casting`, dengan durasi cast existing.

Manager baru berjalan **setelah movement, combat dan native Finish event**. Ia tidak menulis posisi monster, waypoint, speed, HP, Lives, Gold, wave atau Fusion. Untuk setiap enemy hidup:

`remaining = distance(current center, next waypoint) + sum(remaining route segments)`

`ETA_real = (remaining / current MoveSpeed + remaining Golem cast duration) / current timeScale`

Ini mencegah lane yang berdekatan dengan Base secara visual memicu alarm walaupun masih jauh sepanjang zigzag. MoveSpeed terbaru menangani perubahan speed; enemy dengan speed nol tidak diberi ETA palsu. Dead/finished diabaikan. Cast Golem menambahkan waktu stationary yang masih tersisa, tanpa membagi dengan kecepatan gerak teramati nol. Layout/path tidak diubah.

Parameter awal terpusat pada **CelestialSonarConfig**:

| Parameter | Nilai | Alasan |
|---|---:|---|
| WarningSeconds | 6 detik real | Waktu reaksi sebelum Finish tanpa alarm sepanjang wave |
| CriticalSeconds | 2.5 detik real | Eskalasi ketika kebocoran sangat dekat |
| RepeatSeconds | 6 detik real | Pengulangan ringan pada ancaman berkelanjutan |
| GlobalCooldown | 1 detik real | Menahan transisi cepat; eskalasi tetap bisa terdengar |
| WarningPeriod / CriticalPeriod | 2 / 1.2 detik | Pola radar berbeda tanpa flash layar |
| ReducedMotion | false, juga mengikuti browser preference | Memakai geometri stabil saat motion dikurangi |

Satu manager mengambil ETA paling mendesak dan menghitung jumlah ancaman. Dua puluh monster tidak membuat dua puluh suara. Critical dapat mengeskalasi Warning; downgrade hanya mengganti visual dan menunda repeat. Alert history/cooldown dipertahankan melintasi jeda pendek tanpa ancaman sehingga batch baru tidak terus memulai ping baru.

ETA mengikuti 1Ã—/2Ã—/Fusion0.5Ã—, sedangkan jam pengulangan tidak dikalikan game speed. Cue tidak dipercepat pitch-nya. Pause native menghentikan update; scale nol juga tidak memicu cue. Jika ancaman mati/lolos, wave kosong atau Game Over, radar dibersihkan. Pengurangan Lives tetap hanya melalui event Finish lama.

Visual memakai satu ring tipis amber pada Finish atau dua ring coral untuk Critical, notch 4/8, serta outline Lives dengan **! / !!**. Perbedaan jumlah/pola membuat status dapat dibedakan selain warna. Tidak ada popup, screen shake, vignette atau fill yang menutup map. Graphics noninteraktif, satu batch world dan satu HUD, berada di bawah HP bars dan dilepas saat scene unload. Field config ReducedMotion dan preferensi browser menonaktifkan ekspansi ring.

Sebagai pembanding prinsip UX, [catatan resmi Ninja Kiwi untuk BTD6](https://store.steampowered.com/news/posts/?appids=960090&enddate=1665538441&feed=steam_community_announcements) membahas polishing feedback, footprint/placement dan alignment UI. Pendekatan yang dipilih di sini memisahkan perencanaan dari transaksi dan memberi antisipasi berdasarkan jalur. Ini keputusan desain untuk Celestial Void; tidak menyalin asset, audio, UI atau mengklaim memakai algoritma internal BTD6.

## Audio original yang benar-benar dibuat

| ID / file final | Durasi | Bytes | Peak decoded |
|---|---:|---:|---:|
| PurchaseDenied â€” `assets/audio/ui/purchase_denied.ogg` | 0.34s | 3680 | 0.222 |
| SonarWarning â€” `assets/audio/gameplay/sonar_warning.ogg` | 1.12s | 10981 | 0.343 |
| SonarCritical â€” `assets/audio/gameplay/sonar_critical.ogg` | 0.86s | 8523 | 0.331 |

Ketiganya original procedural DSP: double electronic buzz, low resonant scan dengan bell/echo, dan double sonar pulse. Additive harmonics, envelope attack/release, echo dan soft saturation dirender dalam memori menggunakan NumPy, lalu WebCodecs lokal mengenkode **Opus OGG mono 48 kHz / 64 kbps**. Tidak menggunakan sample/download komersial, placeholder senyap atau intermediate WAV. Hanya tiga OGG final disimpan; seluruh audio lama byte-identik.

AudioConfig mendaftarkan cue melalui sistem sound/channel existing. PurchaseDenied dan Warning memakai pool medium; Critical pool high. Master, **SFX Volume** dan MuteSFX mengontrol semuanya, terpisah dari volume UI. BGM tetap berjalan; Critical memakai mild ducking high-priority existing. Cue sekali putar, dengan manager cooldown dan batas pool existing maksimal 12 SFX; tidak ada loop sonar permanen. Setting/persistence audio tidak diubah.

File tersedia pada project dan dapat diputar langsung. Pengujian membuktikan decode, signal, actual native channel playback dan volume/mute. Penilaian rasa suara/mix melalui speaker atau headphone pemain masih perlu dilakukan manual; tidak mengklaim telah melakukan sesi mendengarkan manusia.

## File, event, variable, object dan layer

| File | Perubahan |
|---|---|
| `tools/responsive-map-runtime.js` | Lepas syarat Money pada selection card; UI lainnya tetap |
| `tools/free-placement-runtime.js` | Opsi spatial-only, flag affordable, feedback Gold reusable/cooldown/lifecycle |
| `tools/free-placement-click.js` | Spatial dahulu, pengecekan Money terbaru, penolakan yang mempertahankan preview |
| `tools/audio-runtime.js` | UIClick pada selection; observer collision memakai spatial validation dan melewati sidebar |
| `tools/celestial-sonar-runtime.js` | Manager ETA, severity, global cooldown dan radar/HUD |
| `layouts/game-scene.json` | Event5: hapus hanya kondisi Money selection; embed source terkait; event baru `[18].events[0]` untuk sonar; dua config baru dan tiga cue dalam AudioConfig |
| `Tower Defense.json` | Registrasi tiga audio resource baru dengan path relatif |
| `assets/audio/manifest.json`, tiga OGG di atas | Provenance/checksum/decoded metrics dan final assets |
| `tools/compose-sonar-audio.py` | Source sintesis khusus tiga cue; tidak merender ulang BGM lama |
| `tools/register-sonar-feedback.py`, `tools/source-mapping.json` | Registrasi idempotent; mapping baru tanpa menggeser event existing |
| `tools/economy-placement-qa.js`, `celestial-sonar-qa.js` | Tes native dua fitur dan cleanup scene |
| `tools/audio-ui-qa.js`, `audio-signal-qa.js` | Ekspektasi selection baru; stress mix mencakup cue tambahan |
| `PROJECT_GUIDE.md`, laporan ini, `validation/` | Dokumentasi, screenshot dan bukti pemeriksaan |

Scene tetap **Game Scene**, tidak menambah/rename object definition atau layer. Ghost/range/object tower yang dipakai existing. Feedback memakai PIXI container/text pada **UI**; sonar Graphics pada world layer dan UI, dibatasi mask world existing. Dua scene variables baru: **PlacementFeedbackConfig**, **CelestialSonarConfig**. Total kini **407 resources = 379 images + 28 audio, 67 object definitions, 157 authored instances, 67 scene variables, 27 source mappings**.

Bukti scope disimpan sebagai hashes/counts/check flags saja pada `validation/economy-sonar-scope.json`. Main project selain resource, data scene selain event/config, seluruh variable existing selain penambahan SFX AudioConfig, seluruh asset existing selain manifest, runtime gameplay lain, wave, movement, damage, Fusion/Index dan native Finish events dipertahankan. Tidak ada source-project copy yang disimpan untuk validasi; preview adalah export native terkompilasi.

## Hasil pengujian aktual

Native GDevelop parser/compile/export: **1 scene, 67 objects, 0 scene diagnostics**. Warning versi libGD/include existing tetap muncul; helper native menyertakan bundle Health yang tersedia.

| Pengujian | Hasil |
|---|---|
| Economy placement, 1280Ã—720 | **25 checks**, 0 console errors |
| Economy placement, 640Ã—480 | **25 checks**, 0 console errors |
| Sonar full flow, 1280Ã—720 | **34 checks**, 0 console errors |
| Audio settings/input regression | **13 checks**, 0 console errors |
| Decode seluruh 28 audio + offline stress mix | **57 checks**, 0 console errors |
| Starburst/Fusion combat regression | **110 checks**, 0 console errors |
| Contextual Fusion sidebar/discovery/lifecycle | **247 checks**, 0 console errors |
| Native Gold-Budget Wave System | **7486 checks**, 0 console exceptions |

Economy test menggunakan klik nyata, delapan klik cepat dan held-click: tidak ada tower/charge ketika uang kurang. Reward enemy native 5 Gold menaikkan 295 menjadi 300 sehingga builder yang sama langsung membeli satu tower. Collision path/Ruin/tower mengalahkan feedback Gold. ESC, volume/mute, expiry dan actual scene replacement/graphics cleanup diuji.

Sonar test menggerakkan monster sepanjang route native sampai bocor: Warning muncul pada ETA 5.82s, Critical sekitar 2.15s, baru kemudian Lives berkurang sekali. Lane yang dekat Base tetapi masih jauh di route tidak memicu warning. Dua puluh enemy menghasilkan satu warning; severity escalation, downgrade, pembunuhan ancaman, batch baru dalam cooldown dan pengulangan sekitar 6.00012s diuji. Persistent-repeat fixture menahan posisi enemy dari test untuk mengukur cadence; kasus pertama sampai Finish memakai movement asli tanpa shim.

Speed1Ã—/2Ã— dan Tactical Fusion0.5Ã—, actual stationary Golem cast, zero-speed, native pause/resume, reduced motion, SFX settings dan Game Over diuji. Actual scene replacement menghancurkan graphics manager lama dan membuat state Normal baru.

Seluruh audio diekspor dan di-decode melalui browser native. Stress render **15 SFX + 2 BGM** secara sengaja melebihi cap simultan produksi; peak **0.73714**, clipped samples **0**. Gold-budget suite menguji 45 wave pada 32 seed dan native start/progressive spawning, bukan klaim playthrough manual 45 wave penuh. Regresi Fusion mencakup upgrade sumber, input/cancel/transaction, regional collision, aiming 8 arah, projectile/damage/sell dan sidebar 20 siklus.

Screenshot diperiksa visual: `Placement_Not_Enough_Gold.png`, `Celestial_Sonar_Warning.png`, `Celestial_Sonar_Critical.png` dalam `validation/`. Tidak ada notice besar di battlefield; ghost tetap hijau di lokasi clear saat uang kurang.

Validator statis ketat masih berhenti pada **`Tower Defense.json.autosave` yang sudah ada sebelum task**. File tersebut tidak dibuat/diubah/dihapus, hash awal/akhir dicatat. JSON/resource/source/audio checks yang mendahuluinya dijalankan; validator tidak dilemahkan. Sebanyak 3.705 checks selesai sebelum berhenti; detail ada pada scope report. `node --check` untuk source terkait serta `git diff --check` juga lulus. Hasil statis task sebelumnya tidak diklaim sebagai full pass saat ini.

Belum dilakukan operasi manual editor GDevelop, playthrough panjang, benchmark memory jangka panjang atau pengujian semua platform export/perangkat audio. Tidak ada backup baru dibuat.

## Cek manual tambahan

1. Stop Preview lama, reload project aktif dan Start Preview baru. Gold awal tetap 50000; untuk mencoba kasus miskin gunakan debugger/set Money 150 pada sesi uji.
2. Pilih Star Cannon, gerakkan ghost ke lokasi clear, klik cepat beberapa kali. Periksa range/warna lokasi, pesan singkat, suara double buzz, dan tidak ada charge/tower.
3. Tambahkan Gold hingga 300 melalui reward/debugger, tanpa memilih card lagi. Konfirmasi satu kali; pastikan hanya satu tower dan satu pemotongan 300. Uji ESC/collision.
4. Biarkan monster mengikuti jalur hingga mendekati Base. Dengarkan warning/critical dan periksa pola radar/Lives. Lakukan juga dengan banyak enemy,1Ã—/2Ã—, Fusion dan MuteSFX.
5. Uji keseimbangan sonar terhadap BGM melalui headphone/speaker. Jika perlu, tuning Gain di AudioConfig serta threshold/repeat di CelestialSonarConfig; jangan mengubah stats/route untuk menyesuaikan UX ini.
