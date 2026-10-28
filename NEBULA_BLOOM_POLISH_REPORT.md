# Nebula Bloom - fog, tick, foundation dan upgrade icons

> Status terkini: fog/tick1detik/icon pada laporan ini dipertahankan. Perubahan fondasi visual dibatalkan; bangunan kembali ke desain awal dan placement footprint menjadi68. Lihat [NEBULA_BLOOM_PLACEMENT_REPORT.md](NEBULA_BLOOM_PLACEMENT_REPORT.md).

28 Oktober2026. Perubahan langsung pada project aktif; tidak membuat backup, salinan project/asset, snapshot atau branch. Perubahan working tree dari pekerjaan sebelumnya dipertahankan.

## Empat perbaikan

**Fog:** `PoisonCloud.png` dipertahankan sebagai A. Tiga PNG baru256x256 dengan alpha asli dibuat menggunakan built-in imagegen:

- `assets/towers/nebula_bloom/effects/PoisonCloud_B.png`: aliran spora melengkung/S.
- `assets/towers/nebula_bloom/effects/PoisonCloud_C.png`: gugus nebula terpecah dan asimetris.
- `assets/towers/nebula_bloom/effects/PoisonCloud_D.png`: plume organik bercabang.

Setiap zona memilih bentuk A/B/C/D bergiliran; putaran berikutnya memakai rotasi berbeda dengan langkah73derajat. Bentuk dipilih sekali saat zona dibuat, tidak berganti setiap frame. Pilihan visual tidak mengonsumsi random gameplay. Alpha runtime tetap17%, fade lama dipertahankan, patch penanda radius tetap ada. Ukuran fog baru difit secara proporsional ke radius visual yang sama; rotasi tidak menggeser pusat area.

Prompt lengkap dan file hasil imagegen tersimpan pada `FogSources` di `tools/nebula-bloom-art.json`. Final asset sudah berada dalam workspace dan terdaftar di GDevelop. Pillow hanya melakukan fit/resize/centering dengan alpha asli; tidak menggambar cloud pengganti. Preview: `validation/Nebula_Bloom_Fog_Variants.png` (baris atas source shapes, baris bawah opacity runtime17%).

**Tick damage:** `tools/nebula-bloom-config.json` mengubah `PoisonTickSeconds` dari0.6 menjadi1.0 detik waktu game, mengikuti speed existing. Builder menanamnya sebagai `NebulaBloomConfig.PoisonTickSeconds` pada Game Scene. Satu record/timer per enemy tetap dipakai. Aplikasi poison tidak membuat tick langsung, refresh tidak mereset jadwal tick, dan cloud overlap tidak menggandakan damage status. Interval1detik berlaku untuk status poison Nebula yang sama, baik diaplikasikan oleh impact maupun hazard.

`CloudApplyIntervalSeconds=0.6` mempertahankan cadence deteksi/aplikasi status sebelumnya. Polling ini hanya memberi/refresh status; damage tetap dijalankan timer poison1detik. Enemy yang masuk terlambat mendapat timer pertamanya sendiri setelah status diterapkan. Semua angka damage per tick, durasi poison/cloud, radius, armor integration dan strongest-poison rule tetap.

**Foundation:** builder menaikkan ukuran komponen `NB_Components` frame0 dari112 menjadi126 (+12.5%). Semua27komposit `states/NB_a_b.png` diperbarui dan renderer modular membaca geometri yang sama. Head/core/spore chambers, pusat tower, logical64x64, RenderScale2.2, footprint radius46 dan placement/collision tetap. Atlas foundation asli tidak ditimpa; yang berubah adalah ukuran komposisinya, sehingga fondasi lebih terlihat di bawah badan.

**Icon upgrade:** sepuluh SVG existing ditulis ulang dengan geometri berbeda, bukan recolor atau penambahan jumlah kelopak dari satu template. Resource/animation names tetap sama:

| Upgrade | Asset | Identitas |
|---|---|---|
| Irritant Spores | `NB_Toxic1.svg` | Seed/drop dan butir spora |
| Virulent Pollen | `NB_Toxic2.svg` | Pollen plume asimetris |
| Blight Bloom | `NB_Toxic3.svg` | Toxic blossom burst |
| Caustic Canopy | `NB_Toxic4.svg` | Canopy kabut dan spora turun |
| Pestilent Superbloom | `NB_Toxic5.svg` | Crown/lotus plague bloom |
| Heavy Seed Pod | `NB_Burst1.svg` | Seed shell berlapis armor |
| Enlarged Burst Core | `NB_Burst2.svg` | Inti membesar, band orbit dan tekanan keluar |
| Bloom Detonation | `NB_Burst3.svg` | Detonation blossom bersudut |
| Stellar Overbloom | `NB_Burst4.svg` | Stellar blast dengan orbit energi |
| Nebula Cataclysm | `NB_Burst5.svg` | Floral cataclysm dan halo pecah |

Lokasi seluruh icon: `assets/towers/nebula_bloom/ui/`. Generator maintained: `tools/nebula-bloom-icons.py`, dipanggil builder. Dua badge path lama tidak diubah. Preview native ukuran128px dan36px: `validation/Nebula_Bloom_Upgrade_Icons.png`. Selected Panel tetap memakai icon72x72 dengan alignment/tombol existing; Index memakai animation identifiers yang sama.

## Project, resource dan event yang berubah

- `Tower Defense.json`: hanya menambah tiga image resources. Total482 menjadi485.
- `layouts/game-scene.json`: update `NebulaBloomConfig`, tiga tambahan animation pada `NebulaBloomVFX`, dan embed controller Nebula terbaru. Tidak menambah object, layer, scene atau event.
- `tools/nebula-bloom-runtime.js`: memilih cloud shape/rotation ketika impact membuat zona; memisahkan polling exposure dari tick damage. Controller existing pada `[0].events[7]`; tick combat tetap `[10].events[0].events[6]`; renderer tetap `[14].events[1]`.
- `tools/build-nebula-bloom.py`: ukuran foundation dari konfigurasi, import/fit tiga fog dan generator icon spesifik. Build idempotent.
- `tools/nebula-bloom-config.json`: parameter di atas; harga, damage, range, interval tembakan, radius, durasi dan costs tidak diubah.
- `tools/nebula-bloom-art.json`: provenance/prompt tiga fog baru.
- `tools/nebula-bloom-icons.py`: source sepuluh icon.
- `tools/nebula-bloom-polish-qa.js`: pengukuran native cadence, overlap, exposure,27foundation dan icon panel.
- `tools/nebula-bloom-polish-art-qa.js`: fixture capture native PNG/SVG, bukan UI baru dalam game.
- `tools/nebula-bloom-status-qa.js`: fixture lethal-poison menunggu75frame, sesuai tick1detik; assertion armor/reward tetap.
- `PROJECT_GUIDE.md` dan laporan ini: dokumentasi terkini. Laporan implementasi awal diberi tautan ke fix ini.

Tidak ada resource identifier lama yang diganti. Seluruh asset di luar27komposit Nebula dan10icon upgrade tetap byte-identik terhadap awal task, termasuk atlas/body,11projectile, portrait, impact, patch, audio dan asset Tower lain.

## Validasi yang dijalankan

| Test | Hasil aktual |
|---|---|
| Native libGD parse/compile tiga scene | Lolos;0event diagnostics |
| Focused polish |82checks,0console errors;8pod nyata membuat8hazard overlap;4shape dipakai;tidak ada damage pada0.5detik;3interval terukur1.00002/1.00002/1.00002detik;25damage/tick tetap sekali;entry terlambat dan cleanup lolos |
| Foundation |Seluruh27state diperiksa di renderer native; base126, body/footprint/center tetap |
| Existing Nebula contracts |137checks,0console errors; actual placement/upgrade/sell, arc, direct AoE, poison, locking, DEV dan scene-unload |
| Buff/armor/time/reward |12checks,0console errors; poison + Fortification, armor sekali, pause,2x, Tactical Fusion0.5x dan reward/death sekali |
| Star Cannon / Starburst regression |110checks,0console errors; normal paid upgrades, Fusion transaction, firing/muzzle/damage di8arah, sell/refund dan cleanup |
| Responsive UI |6urutan resize1280x720/960x640/640x360/1600x900/640x360/1280x720;103checks setiap ukuran,0console errors; icon/description/price tidak overlap |
| Maintained campaign/static |1033scope checks dan4259structural/resource/source checks lolos |
| Baseline task checksum audit |655checks; seluruh object/variable/runtime/asset lain dipertahankan; hanya perubahan empat area yang dikecualikan |
| Rebuild + embed |Idempotent,69file dibandingkan dengan checksum,0perubahan pada build ulang |
| Native art capture |Keempat fog dan sepuluh icon dirender dari texture manager GDevelop;0console errors, diperiksa secara visual |
| Combat visual capture |Native5-2 dan2-5, real arc/AoE/cloud/poison; fixture target stationary ber-HP tinggi, bukan uji win rate |

Detail bukti: `validation/nebula-polish-native.json`, `nebula-polish-static.json`, `nebula-polish-baseline.json` (checksum saja), `nebula-polish-build.json`, `nebula-polish-icons.json`, `nebula-polish-fog.json`, serta hasil native Nebula/status/resize. Preview world dan27state terbaru memakai file PNG validation existing.

Uji memakai compiled GDevelop preview di Chrome headless melalui maintained harness, bukan engine simulasi pengganti. Sandbox menghalangi tiga percobaan browser awal; percobaan tersebut dihentikan dan uji dijalankan ulang dengan izin browser lokal. Hanya run yang benar-benar selesai dihitung pada tabel.

Belum dilakukan human playtest panjang atau pengujian mobile/GUI IDE secara manual. Warning versi libGD5.6.283 versus project5.6.284 existing tetap; compile dan runtime yang diuji berhasil. Validator kebersihan direktori penuh masih menandai `Tower Defense.json.autosave` lama; file tersebut tidak dibuat/diubah/dihapus task ini. Tidak mengklaim seluruh project bebas backup lama.

## Menjalankan ulang

```powershell
python tools/build-nebula-bloom.py
python tools/embed-free-placement.py
node tools/validate-clean-project.cjs
python tools/run-clean-validation.py --prepare
python tools/balance-browser.py tools/nebula-bloom-polish-qa.js validation/nebula-polish-native.json --viewport=1280x720
python tools/balance-browser.py tools/nebula-bloom-qa.js validation/nebula-bloom-native.json --viewport=1280x720
python tools/balance-browser.py tools/nebula-bloom-status-qa.js validation/nebula-bloom-status.json --viewport=1280x720
python -B tools/validate-campaign.py
```

Jangan meregenerasi export ketika browser QA masih berjalan. Tidak ada langkah backup sebelum maupun sesudah build.
