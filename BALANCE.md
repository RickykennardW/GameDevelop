# Balance aktif Celestial Void - 2026-10-09

Project: `Tower Defense.json`, scene: `layouts/game-scene.json`.
Sumber balance: scene variables `StarCannonConfig`, `EnemyTypes`, `EnemyWaveDistribution`, `WavePacing`, `WaveCompletionReward`, `EnemyHPBarConfig`.
Laporan audit, perbandingan sebelum/sesudah, simulasi, pengujian, dan batasnya: [HP_BARS_BALANCE_REPORT.md](HP_BARS_BALANCE_REPORT.md).

Star Cannon tetap satu-satunya tower, harga300 Gold, base damage50, range210, interval0.9s, projectile speed520. Tidak ada critical damage.
Starting Gold650, Lives10, leak1Life, sell70% dari total investasi (dibulatkan ke bawah), clear obstacle250. Tidak ada passive Gold.
Bonus wave60 Gold satu kali (sebelumnya100). Auto intermission3s dan Manual/Auto1x/2x dipertahankan.

| Enemy | HP | Speed | Flat armor | Gold | Mulai wave | Lebar HP bar |
|---|---:|---:|---:|---:|---:|---:|
| Nova Wisp | 100 | 80 | 0 | 5 | 1 | 24 |
| Void Hound | 60 | 135 | 0 | 7 | 4 | 30 |
| Void Guard | 150 | 70 | 10 | 8 | 6 | 30 |
| Void Sentinel | 120 | 85 | 0 | 6 | 5 | 26 |
| Void Brute | 220 | 60 | 15 | 10 | 7 | 36 |

Enemy stats/roles/art/animations tetap. Damage positif memakai `max(1, RawDamage - FlatArmor)`, melalui Health asli; 0/negative/NaN tidak menciptakan hit. Tidak ada shield/attack/variant/boss baru.
HP bars memakai track/fill native berpasangan dengan ID lifetime, tinggi6, inner fill `(Width-2)*clamp(HP/MaxHP,0,1)`. Callback dilepas pada logical death sebelum object bar dipakai ulang oleh enemy lain. Green >60%, yellow30-60%, red <30%. Ukuran tidak berasal dari nilai MaxHP atau skala atlas.

## Dua path Star Cannon

Path1 cumulative damage50/56/62/62/74, range multiplier1/1/1.04/1.04/1.04.
Path2 cumulative speed multiplier1/1.10/1.22/1.22/1.22, range multiplier1/1/1.04/1.04/1.04.
Path1 level3:25% splash/radius64; level4:40% splash/radius84. Primary tidak menerima splash miliknya sendiri.
Path2 level3:2 shots masing-masing62%; level4:3 shots masing-masing56%. Satu projectile hanya menyelesaikan satu impact. Overkill/reward tidak dihitung dua kali.
Max masing-masing path4. Salah satu path>=3 membatasi lainnya<=2:21 build valid, 3-3/4-3/4-4 terlarang.

| Tier | Star Destroyer | Cosmic Barrage |
|---|---:|---:|
| 1 | 160 | 130 |
| 2 | 300 | 280 |
| 3 | 1100 | 1000 |
| 4 | 2800 | 2500 |

Total cost4-2=5070;2-4=4670. Theoretical single-target DPS4-2=100.31;2-4=141.19 sebelum armor, overkill, turning, travel atau range downtime. Splash tergantung jumlah dan jarak tetangga, bukan multiplier DPS permanen.

## Wave

50 waves, jumlah `wave*4`, total5100 enemy. Tidak ada HP/speed/reward scaling.
Hound:mulai4, +4 setiap3wave; Sentinel:mulai5,+2 setiap3wave; Guard:mulai6,+3 setiap4wave; Brute:mulai7,+2 setiap5wave. Menggantikan slot Nova; posisi interleave Hound tetap.
Spawn interval `max(0.36, 0.9 - max(0,wave-5)*0.015)` game-seconds. Waves1-5 tetap0.9;W10=.825,W20=.675,W35=.45,W41-50=.36.
Wave50=50Nova+64Hound+32Sentinel+36Guard+18Brute.

| Setelah wave | Total Gold tersedia jika semua kill, sebelum belanja |
|---|---:|
| 5 | 1268 |
| 10 | 2558 |
| 15 | 4534 |
| 20 | 7202 |

Bukti terbaru: `design_previews/gameplay_balance/`. Total Gold tabel termasuk650 awal, bukan sisa uang pemain setelah membeli tower.
