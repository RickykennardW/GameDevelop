# Balance aktif Celestial Void - 2026-10-09

Project: `Tower Defense.json`, scene: `layouts/game-scene.json`.
Sumber balance: scene variables `StarCannonConfig`, `EnemyTypes`, `WaveBudgetConfig`, `VoidGolemConfig`, `WavePacing`, `WaveCompletionReward`, `EnemyHPBarConfig`.
Laporan audit, perbandingan sebelum/sesudah, simulasi, pengujian, dan batasnya: [HP_BARS_BALANCE_REPORT.md](HP_BARS_BALANCE_REPORT.md).

Star Cannon tetap satu-satunya tower, harga300 Gold, base damage50, range210, interval0.9s, projectile speed520. Tidak ada critical damage.
Starting Gold650, Lives10, leak1Life, sell70% dari total investasi (dibulatkan ke bawah), clear obstacle250. Tidak ada passive Gold.
Bonus completion wave0: income wave hanya dari kill reward; budget tidak diberikan ketika wave dimulai. Auto intermission3s dan Manual/Auto1x/2x dipertahankan.

| Enemy | HP | Speed | Flat armor | Gold | Mulai wave | Lebar HP bar |
|---|---:|---:|---:|---:|---:|---:|
| Nova Wisp | 100 | 80 | 0 | 5 | 1 | 24 |
| Void Hound | 60 | 135 | 0 | 7 | 4 | 30 |
| Void Guard | 150 | 70 | 10 | 8 | 6 | 30 |
| Void Sentinel | 120 | 85 | 0 | 6 | 5 | 26 |
| Void Brute | 220 | 60 | 15 | 10 | 7 | 36 |
| Void Golem (Elite) | 480 | 50 | 25 (35 saat buff) | 20 | 12 | 40 |

Stat/art/animasi lima enemy lama tetap; hanya satu Elite Void Golem ditambahkan. Damage positif memakai `max(1, RawDamage - FlatArmor)`, melalui Health asli; 0/negative/NaN tidak menciptakan hit. Void Golem memiliki satu skill defensif, Void Fortification; detail state/VFX ada di VOID_GOLEM.md.
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

45 waves, jumlah enemy berasal dari total nilai kill reward, tanpa HP/speed/reward scaling. Cost masing-masing enemy5/7/8/6/10/20 sama dengan Gold Reward asli.

`BaseBudget = 100 + 50*(W - 1 - floor((W - 1)/5))`

`WaveBudget = BaseBudget * (W % 5 == 0 ? 1.2 : 1)`

Budget dapat dikonfigurasi di `WaveBudgetConfig`. Seed177017, komposisi sekali per wave; unlock1/4/5/6/7/12, semua common tetap eligible setelah unlock. Pilih1–3 jenis common secara berbobot, lakukan repair tail kecil jika sisa tidak bisa dibelanjakan. Elite opsional, maksimal5 dan dibatasi10% budget normal/15% milestone. Milestone menambah bobot enemy berarmor serta menjamin common berarmor saat tersedia. Tidak semua tipe dipaksa muncul. Void Golem pertama terpilih wave13 untuk seed aktif; eligible mulai12.

Spawn interval tetap `max(0.36, 0.9 - max(0,wave-5)*0.015)` game-seconds. Waves1-5=.9,W10=.825,W20=.675,W35=.45,W41-45=.36. Spawn progresif, enemy speed tetap. Budget hanya batas komposisi, bukan uang awal wave. Bonus completion60 sebelumnya kini0 sesuai aturan kill-only income; sell tetap70%.

| Wave | Budget | Jumlah enemy seed aktif |
|---|---:|---:|
| 1 | 100 | 20 |
| 5 | 360 | 52 |
| 6 | 300 | lihat wave-plan.json |
| 10 | 600 | 75 |
| 11 | 500 | lihat wave-plan.json |
| 12 | 550 | 86 |
| 15 | 840 | 105 |
| 16 | 700 | lihat wave-plan.json |
| 45 | 2280 | 226 (224Brute+2Golem) |

Jika semua musuh dibunuh sebelum belanja,650awal+46980reward=47630 Gold selama45waves; tidak termasuk penjualan. Angka ini merupakan upper bound pendapatan, bukan sisa uang pemain atau bukti campaign penuh.

## Void Fortification dan kompatibilitas damage

Golem berhenti total0.8s; release pada0.6s. Skill cooldown25s mulai dari awal casting; buff+10 armor selama10s dalam radius100logicalpx. Snapshot target pada release, tidak menumpuk, refresh durasi. BaseArmor tetap; caster mati tidak membatalkan buff ally yang telah diberikan. Skill tidak menimbulkan damage, heal atau invulnerability.

| Build | Damage per projectile | DPS vs armor25 | DPS vs armor35 |
|---|---:|---:|---:|
| 0-0 | 50 | 27.78 | 16.67 |
| 2-4 | 34.72 ×3 | 39.53 | 4.07 |
| 4-2 | 74 | 66.42 | 52.87 |

Angka theoretical direct DPS mengabaikan range/rotasi/travel/overkill/splash. Buffed Golem armor35 melebihi raw Meteor34.72 sehingga setiap projectile melakukan minimum1damage; actual native volley tiga Meteor menghasilkan3damage. Harga20Golem sebagai cost tidak menggambarkan threat yang setara20Gold enemy ringan. Perbedaan kesulitan komposisi dilaporkan; Star stats/harga/armor enemy tidak diubah.

Actual native tests: dua base Cannon (total600, mulai650/10Lives) clear campaign1–5,0leak, saldo1110. Satu base Cannon wave13 leak75/90. Satu4-2 wave45 leak186/226; satu2-4 leak188/226. Delapan4-2, totalinvestasi40560, clear fixture wave45 tanpa leak,2280Gold kill, peak77enemy. Fixture late memiliki100000Gold/10000Lives untuk mengukur combat; belum membuktikan campaign earned-income1–45 penuh.

Bukti aktif: `design_previews/void_golem/` dan laporan `VOID_GOLEM.md`; `design_previews/gameplay_balance/` serta `HP_BARS_BALANCE_REPORT.md` adalah catatan versi sebelum Gold Budget.
