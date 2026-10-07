# Tower Defense: konfigurasi 50 wave

Sumber konfigurasi: `layouts/game-scene.json`, scene variables `WaveConfigs`, `EnemyTypes`, dan `TowerShopCatalog`.
Semua HP, speed, dan reward berasal dari tipe enemy; tidak ada scaling berdasarkan wave.
Lima archetype memakai object Enemy yang sama dengan tint/ukuran berbeda dan animasi Idle Run. Semua mengikuti Monster_Path.

| Object | Role | Cost | Damage | Range | Cooldown |
|---|---|---:|---:|---:|---:|
| Tower | Basic | 250 | 20 | 190 | 0.50 |
| ShotgunTower | Heavy | 500 | 80 | 230 | 1.50 |
| RocketTower | Advanced | 700 | 35 | 260 | 0.50 |

Heavy sekarang satu peluru; Advanced menggunakan visual rocket dengan satu target. Ini menjaga baseline DPS 40 / 53.33 / 70 tanpa penggandaan pellet atau splash.
Starting Money 650. Refund tetap 70% dari harga pembelian. Tidak ada bonus gold wave baru.

| Wave | Enemy | Interval (s) | Total HP | Gold jika semua dikalahkan |
|---|---:|---:|---:|---:|
| 1 | 6 | 1.20 | 600 | 60 |
| 5 | 15 | 0.95 | 1350 | 160 |
| 10 | 21 | 0.80 | 4260 | 376 |
| 20 | 42 | 0.65 | 8425 | 755 |
| 30 | 59 | 0.55 | 14500 | 1250 |
| 40 | 78 | 0.45 | 22350 | 1880 |
| 45 | 116 | 0.40 | 28425 | 2495 |
| 50 | 160 | 0.35 | 47200 | 3920 |

AUTO default OFF. ON memulai wave berikutnya setelah antrean kosong, semua enemy selesai, WaveActive false, lalu jeda 3 detik. Wave pertama tetap dimulai dengan PLAY/SPACE. Tombol PLAY memakai WaveMode Waiting / Manual / Auto. Saat wave berjalan, klik hanya mengubah Manual dan Auto; tidak memulai wave baru. Membatalkan Auto saat intermission mengembalikan PLAY dan membatalkan countdown. Game berakhir setelah wave 50 atau Lives habis.
Wave 50 mempunyai lima kelompok serangan, masing-masing diakhiri Boss, dengan total tepat 60 Fast, 45 Tank, 50 Elite, dan 5 Boss.

Validasi: parsing seluruh JSON, kompilasi/export core GDevelop 5.6.283, pembelian/placement, damage dan cadence aktual ketiga tower, komposisi serta stat seluruh 50 wave, reward serentak, movement, AUTO/manual, dan tidak ada wave 51. Preview panel diperiksa secara visual.
Uji otomatis menggunakan percepatan antrean spawn untuk memeriksa semua instance. Ini bukan playthrough strategi pemain penuh; rasa kesulitan dan kelayakan tiap strategi belum dinilai melalui playtest manusia. Tidak dilakukan penyesuaian balance di luar angka permintaan.

INDEX tersedia di samping PLAY, dengan tab TOWERS/MONSTERS, scroll, CLOSE, dan Escape. Angka tower dibaca dari object variables dan TowerShopCatalog; angka monster dari EnemyTypes. Panel hanya menampilkan unit yang sudah tersedia. Gameplay tetap berjalan saat INDEX terbuka.
