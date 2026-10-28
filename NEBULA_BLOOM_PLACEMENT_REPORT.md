# Nebula Bloom - building restoration dan placement footprint

28 Oktober2026. Scope: memulihkan visual bangunan sebelum pembesaran fondasi dan memperbaiki occupancy Nebula Bloom. Tidak membuat backup, duplicate project, safety asset copies, snapshot project atau branch; Git history tidak diubah.

## Bangunan asli dipulihkan

Seluruh27PNG `assets/towers/nebula_bloom/states/NB_a_b.png` kembali memakai **atlas asli `NB_Components`, frame0, ukuran112** untuk bagian base. Kelopak, mortar head, core, emitters dan aiming/firing tetap memakai artwork/komposisi aslinya. Tidak membuat desain bangunan baru.

`git log --all` tidak mempunyai commit untuk file Nebula yang masih uncommitted. Karena itu tidak dilakukan checkout/reset/revert project. Atlas asli masih tersedia, dan **semua27PNG hasil restorasi cocok byte-for-byte** dengan checksum desain awal pada `validation/nebula-polish-baseline.json`. Checksum hanya memverifikasi hasil; tidak berisi salinan asset/JSON untuk dipulihkan.

Platform keliru `assets/towers/nebula_bloom/components/NB_Foundation.png`, satu resource registration, metadata frame/preload dan `FoundationImage` dilepas. Itu satu-satunya asset yang dihapus; seluruh asset lain selain27PNG yang direstorasi tetap byte-identik terhadap awal task. Total resource486 menjadi485. Empat fog, tick poison1detik, sebelas projectile, seluruh VFX, sepuluh icon baru, portrait shop dan artwork Star Cannon dipertahankan.

## Dasar ukuran footprint baru

Placement memakai lingkaran pada world coordinates, bukan native sprite collision mask. `TowerFootprints.Width/Height=64` adalah ukuran logical sprite; authoritative occupancy berasal dari `Radius` dan instance `FootprintRadius`.

Pengukuran dilakukan pada seluruh27state setelah pemulihan visual: alpha pixel>=12, static attachments, head berotasi penuh, charge scale maksimum1.035, core scale maksimum1.2, recoil/bob allowance3.6canvas, dan root scale `64*2.2/128=1.1`. Swept silhouette terluas adalah **67.4645988world px** pada state0-5. Konfigurasi placement dibulatkan ke **68**, dengan safety gap8world px. Detail tiap state: `validation/nebula-occupancy-measurement.json`.

| Parameter | Lama | Baru |
|---|---:|---:|
| Radius placement Nebula |46|68|
| Diameter occupancy Nebula |92|136|
| Safety gap pair yang melibatkan Nebula |2|8|
| Radius Star Cannon / Starburst |46|46|
| Logical sprite Nebula |64x64|64x64|
| RenderScale Nebula |2.2|2.2|

Radius68 dipakai sejak0-0 dan tidak berubah saat upgrade. Ukuran base visual dikembalikan ke112; tidak diperbesar untuk memenuhi occupancy. Attack range340 pada base dan radius blast/poison/cloud tidak dipakai sebagai placement radius.

## Formula collision dan simetri

Validator bersama memakai:

```text
MinimumDistance = RadiusCalon + EffectiveRadiusTowerLain + PairGap
PairGap = max(TowerFootprintPadding, SafetyGapTipeCalon, SafetyGapTipeTowerLain)
```

`TowerFootprintPadding` global tetap2. Hanya `TowerFootprints.NebulaBloomTower` yang memiliki `SafetyGap=8`; nilainya disalin builder dari `NebulaBloomConfig.FootprintSafetyGap`.

| Pair | Jarak minimum lama | Jarak minimum baru |
|---|---:|---:|
| Nebula -> Nebula |94|144|
| Nebula -> Star Cannon |94|122|
| Star Cannon -> Nebula |94|122|
| Nebula -> Starburst |94|122|
| Star Cannon -> Star Cannon |94|94|

Actual distance di bawah minimum ditolak; tepat pada batas diterima dengan epsilon numerik existing1e-6. Radius candidate juga dipakai untuk path, bounds, rocky perimeter dan obstacles. Ruin/obstacle colliders existing dipertahankan. Ghost dan owner outline memakai radius68 yang sama; diameter136 dibedakan dari attack-range diameter680. Invalid ghost merah, valid hijau; click invalid tidak membeli/memotong Gold dan ghost tetap aktif. Setelah sukses, outline disembunyikan sesuai mekanisme existing.

Fusion tetap melewatkan hanya dua source owners melalui `ignoreTowers`. Tower lain, termasuk Nebula legacy dengan radius yang diperbaiki, dan Ruins tetap diperiksa. Recipe, fee, stats, Tactical0.5x dan discovery tidak diubah.

## Kompatibilitas tower existing

`p.radius` memberi minimum radius konfigurasi baru untuk Nebula. Instance lama yang masih menyimpan radius lebih kecil dinormalisasi ke68 tanpa memodifikasi center, identity, level, investment atau Gold. Radius legacy yang sudah lebih besar tidak diperkecil. Upgrade tidak melakukan pengubahan footprint tambahan.

Tidak ada Tower authored dalam157scene instances project ini, dan tidak ditemukan native action untuk menyimpan/memuat battle-tower layout; persistence aktif adalah campaign, archive/discovery dan audio. Tidak ditambahkan/reset sistem save apa pun.

Fixture legacy mengimpor dua Nebula pada jarak94 yang dahulu valid. Keduanya tetap ada di posisi semula walaupun kini berada di dalam batas144. Tidak ada auto-delete/auto-relocation; placement baru menghormati occupancy yang diperluas. Kasus ini diverifikasi langsung. Jika sesi/load lama mempunyai kepadatan serupa, kebijakan yang sama berlaku.

## File dan event

- `tools/nebula-bloom-config.json`: `FoundationSize=112`, `FootprintRadius=68`, `FootprintSafetyGap=8`; menghapus `FoundationImage`. Parameter damage, speed, costs, DoT, trajectory, range dan AoE tetap.
- `tools/build-nebula-bloom.py`: restorasi komponen base asli pada27state, mapping radius/gap ke `TowerFootprints`, menghapus hanya resource platform keliru dari registration/preload.
- `tools/free-placement-runtime.js`: `p.radius`, `p.gap`, `p.minimumDistance`, symmetric pair check dan kompatibilitas radius legacy. Ini satu-satunya JavaScript gameplay yang berubah.
- `tools/nebula-bloom-art.json`: melepas provenance platform yang dibatalkan; prompt original dan fog dipertahankan.
- `Tower Defense.json`: satu resource keliru dilepas. `layouts/game-scene.json`: update konfigurasi, preload, dan inline source placement. **Event JS yang berubah: `events[6]`**. Semua native event structure/actions/order lainnya tetap; tidak ada object/event/layer baru.
-27PNG state direstorasi; satu platform keliru dihapus. Tidak ada artwork lain yang diganti.
- `tools/nebula-occupancy-qa.js`: native input/validator/fusion/legacy/upgrade tests dan capture map.
- `tools/nebula-bloom-qa.js`: expected occupancy68; posisi fixture kedua800,352 menggantikan900,352 yang memang kini terlalu dekat dengan Ruin. Tidak mengubah map atau melonggarkan validation.
- `tools/nebula-bloom-polish-qa.js`: expected base asli112 dan occupancy68; semua assertion fog/tick/overlap tetap.
- `PROJECT_GUIDE.md` dan penunjuk pada laporan lama diperbarui untuk mencegah pembesaran fondasi visual kembali diterapkan.

## Pengujian aktual

| Test | Hasil |
|---|---|
| Native compile ketiga scene |0event diagnostics |
| Occupancy native |96checks,0console errors: jarak144/122 dari kedua arah, pembelian nyata, invalid/valid ghost, Ruins/path/bounds, legacy, Fusion dan paid5-2/2-5 |
| Blocked-ghost capture |97checks,0console errors; ghost aktual ditolak di antara dua tower |
| Nebula gameplay regression |137checks,0console errors;27state, paid upgrade/sell, original damage, arc, AoE, poison dan cleanup |
| Fog/tick/icon regression |82checks,0console errors;4fog,8hazard overlap tetap1tick/detik, status cleanup dan10icon panel |
| Shared clean-project regression |357checks,0console exceptions; original Star upgrade/firing/sell serta placement/camera/obstacle contracts |
| Native UI |103checks,0console errors; portrait, panel alignment, icons, Index scroll dan text bounds |
| Exact restoration |27/27PNG cocok checksum desain awal sebelum pembesaran |
| Scope audit |1247checks; stats, fog/VFX/projectile/icons, UI/camera, source JS lain dan authored instances dipertahankan |
| Maintained static/campaign |1033scope checks +4259structural/resource/source checks lolos |
| Build |Idempotent pada69file, tidak membuat salinan project/asset |

Native test memakai compiled GDevelop preview dan Chrome headless, bukan engine pengganti. Fixture memakai100000Gold hanya pada profile pengujian untuk membeli banyak upgrade/Fusion; starting Gold di project tidak berubah. Label state/radius pada screenshot adalah overlay fixture, bukan UI baru dalam game.

Bukti: `validation/nebula-occupancy-native.json`, `nebula-occupancy-blocked.json`, `nebula-restored-gameplay.json`, `nebula-preserved-fog.json`, `nebula-occupancy-ui.json`, `nebula-occupancy-static.json`, `nebula-occupancy-build.json`, `nebula-restoration.json` dan screenshot `Nebula_Occupancy_Safe.png` / `Nebula_Occupancy_Blocked.png`. Baseline berisi checksum/counts saja.

Validator kebersihan direktori penuh masih menandai `Tower Defense.json.autosave` lama; file itu tidak dibuat/diubah/dihapus task ini. Native libGD5.6.283 memberi warning untuk project5.6.284 seperti sebelumnya, namun compile/runtime yang dijalankan lolos. Tidak mengklaim human playtest panjang atau pengujian GUI/mobile manual.

Prinsip readability tower defense yang diterapkan: ruang dicadangkan sejak pembelian pertama untuk bentuk upgrade final, occupancy sama dengan preview, serta feedback valid/invalid jelas. Tidak menyalin artwork maupun aturan game lain.

Tidak ada backup baru, hard reset, revert project menyeluruh atau perubahan Git history.
