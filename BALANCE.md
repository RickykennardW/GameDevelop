# Konfigurasi aktif â€” Star Cannon dan Nova Wisp

Sumber resmi: scene variables `TowerShopCatalog`, `StarCannonConfig`, `NovaWispConfig`, dan `EnemyTypes` di `layouts/game-scene.json`. Cleanup tidak mengubah balancing.

| Unit | Harga / reward | HP / damage | Range / speed | Interval |
|---|---:|---:|---:|---:|
| Star Cannon | 300 Gold | 50 damage | 210 range | 0.9 detik |
| Nova Wisp | 5 Gold per kill | 100 HP | 80 speed | spawn 0.9 detik |
| Void Hound | 7 Gold per kill | 60 HP | 135 speed | spawn 0.9 detik |
| Void Guard | 8 Gold per kill | 150 HP | 70 speed | spawn 0.9 detik |
| Void Sentinel | 6 Gold per kill | 120 HP | 85 speed | spawn 0.9 detik |
| Void Brute | 10 Gold per kill | 220 HP | 60 speed | spawn 0.9 detik |

Money awal 650; Lives awal 10. Wave n berisi n Ã— 4 Nova Wisp identik. Wave 1/10/50 berisi 4/40/200; total 5.100 enemy untuk 50 wave. Tidak ada scaling HP, speed, armor, ukuran, atau reward. Bonus completion +100 Gold satu kali per wave; Auto menunggu 3 detik. Tidak ada wave 51.

Path Star Destroyer: Reinforced Core 125, Heavy Impact 200, Star Explosion 650, Supernova 1250 Gold.
Path Cosmic Barrage: Rapid Fire 100, Precision Core 175, Twin Star 600, Meteor Barrage 1100 Gold.
Dua path tidak boleh sama-sama mencapai level3; tersedia 21 kombinasi. Twin memakai 2 Ã—65% damage dan Meteor 3 Ã—60%. Multiplier, splash, projectile speed, refund70% dari total investasi, muzzle, serta stats per-upgrade dipertahankan dari konfigurasi sebelum cleanup.

PLAY memulai wave; klik berikutnya berputar Manual1x â†’ Manual2x â†’ Auto1x â†’ Auto2x. Semua waktu gameplay memakai time scale yang sama. Clear obstacle tetap 250 Gold. Lihat CLEANUP_REPORT.md untuk bukti pengujian dan batas pengujian.

Distribusi mudah diedit lewat EnemyWaveDistribution di scene variables. Wave50=136Nova+64Hounds. Tidak ada variant/stat scaling. Bonus100, Star stats, refund, obstacle250, Money/Lives awal dan controls tidak berubah.

Common additions: Sentinel wave5/count2/every3; Guard wave6/count2/every4; Brute wave7/count1/every5. New enemies replace Nova slots; Hound count and original slot positions stay. Wave50=71Nova+64Hound+32Sentinel+24Guard+9Brute. Existing Health flat armor:10Guard/15Brute. No shield/attack. Details: VOID_COMMON_ENEMIES.md.
