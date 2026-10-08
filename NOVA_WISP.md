# Nova Wisp — satu enemy untuk seluruh wave (2026-10-09)

Diimplementasikan langsung pada project terbaru, setelah Star Cannon turret/Clear Obstacle selesai. Backup state sebelum Nova: `backups/pre_nova_wisp_20261009.zip`. Laporan sebelumnya: `STAR_TURRET_OBSTACLES.md`.

## Analisis dan scope

Project folder mempunyai satu scene `layouts/game-scene.json`. Object `Enemy` sudah direferensikan seluruh tower, projectile dan group `MonsterEnemies`. Wave manager dan spawner berada pada child1/2 root event10; movement pada child3; kill reward/delete pada child12. Route/camera/map berada pada event0/2 dan tidak berubah. Enemy lama memakai dua clip Slime dan lima archetype berwarna dengan weighted/boss queues.

Implementasi mempertahankan nama Enemy/MonsterEnemies dan Health behavior. Hanya active enemy config, wave queue, visual movement/death dan Index enemy diubah. Stat/asset seluruh tower, upgrades, placement, selling, Clear Obstacle, map/waypoint, Spawn/Base, scene/layer, life cost dan bonus completion100 tetap seperti backup.

## Asset

Empat PNG RGBA transparan 1254×1254: `NovaWisp_Right.png`, `NovaWisp_Left.png`, `NovaWisp_Down.png`, `NovaWisp_Up.png`, di `assets/nova_wisp`.

Semua dibuat dengan imagegen berdasarkan blueprint user. Front/down mengikuti inti besar; profil kanan/kiri memperlihatkan aperture pada sisi berbeda; back/up memperlihatkan pelindung belakang dan aperture kecil. Material ivory stone, spherical purple-blue core, ring orbit tipis, dan empat kristal melayang mengikuti blueprint. Tidak ada label/background lembar konsep di sprite.

Ini empat tampak dari SATU Basic Nova Wisp. Tidak ada Fast/Heavy/Elite/Boss/Armored/Giant atau variasi stat/warna/ukuran.

`generation-prompts.json` menyimpan prompt; `views.json` menyimpan core dan contour/rect kristal hasil pengukuran alpha baca-saja; `manifest.json` menyimpan ukuran/hash. PNG tidak dipotong/disunting oleh script. Renderer menggunakan bagian texture asli dan mask untuk menggerakkan kristal secara terpisah, tanpa menduplikasi kristal pada body.

## Stat dan wave

Name Nova Wisp; Type Basic; MaxHP100; Speed80; Armor0; Reward5; no special ability.

Wave n = tepat n×4 Basic Nova Wisps, seluruh 50 wave existing. Wave1/2/3/10/50 = 4/8/12/40/200. Spawn berurutan, interval game-time konstan0.9s (jarak nominal72worldpx pada80speed), bukan burst semua sekaligus. Mode Manual/ManualFast/Auto/AutoFast mengikuti existing controller. Tidak ada HP/speed/size/tint/armor scaling atau boss queue. LegacyEnemyTypes/LegacyWaveConfigs dan clip/resources lama tetap tersedia untuk pemulihan, tetapi active EnemyTypes/Index hanya Basic.

## Animasi dan orientasi

16 named states (Idle/Move/Hit/Death × Right/Down/Left/Up). Empat painted PNG dirender melalui compositor procedural GDJS/PIXI yang sudah ada dalam GDevelop, tanpa library/plugin tambahan.

Idle: bob halus, pulse core, empat kristal bergerak sendiri, highlights ring mengorbit. Move: mekanisme sama dengan tiga trail glints kecil di belakang arah gerak. Facing ditentukan dari vektor movement aktual, termasuk sumbu Y; body tidak diputar/flip untuk menggantikan gambar arah. Collision/route center tetap stabil dan bob hanya display.

Hit: flash biru muda dan armor shake0.16s, movement tetap berjalan. Death: pada0HP owner Enemy langsung berhenti/keluar dari combat; satu `NovaWispDeathVisual` cosmetic menyelesaikan core collapse, enam armor fragments, crystal scatter dan fade0.65s. Object cosmetic bukan anggota MonsterEnemies dan tidak bisa ditarget/damage/reward. RewardPaid + lifetime IDs mencegah reward dan visual cleanup ganda. Datang ke Base mengurangi satu life existing tanpa kill reward.

Logical sprite48×48 dengan octagonal core collision mask, render scale enemy existing1.55. Semua pose memakai centered origins dan ukuran sama. Texture/frame regions dibagi per4direction atlas; tiap enemy mempunyai jumlah komponen/partikel terbatas. Destruction callback membersihkan rig/mask/bar saat mati, escape, recycle atau scene cleanup.

## File dibuat

- `assets/nova_wisp/`: empat PNG + views/prompt/manifest.
- `tools/nova-wisp-runtime.js`, `nova-wave-manager.js`, `nova-spawn-runtime.js`, `nova-movement-runtime.js`, `nova-death-runtime.js`.
- `tools/integrate-nova-wisp.py`, `test-nova-wisp.js`, `test-nova-wisp-live.py`.
- `design_previews/nova_wisp/`: asset gallery, actual-game screenshots, animation WebM, test logs, static audit, benchmarks.
- File audit di `tools/nova-audit-*` menyimpan definisi/event awal untuk penelusuran.

## File diubah

`Tower Defense.json`: empat image resources. `layouts/game-scene.json`: Enemy animations/variables, cosmetic death definition, active/legacy config, scoped spawn/movement/death events dan Index portrait. `tools/unit-index-runtime.js`: satu active Nova Wisp entry/portrait. `tools/island-render-runtime.js`: Nova render pass. `tools/embed-free-placement.py`: source mapping termasuk nested Nova init/movement. Source turret/Clear/tower stats tidak diubah oleh implementasi Nova.

## Validasi yang dilakukan

- Parser/compiler native GDevelop5.6.283:0 diagnostics, export Pixi preview true. Semua JSON/resource/Group references valid.
- 10432 assertions PASS: seluruh50wave, 5.100 actual sequential spawns, identical stats, counts, rewards/completion, four-axis movement, independent crystal/orbit/bob, hit/death, exact two actual Star50 projectiles ->100/50/0, one5reward, no reward at Base, semua5tower combat.
- 12 native/CDP checks PASS: four rendered views, animation motion, hit/death, real PLAY4spawns, four-second gameplay recording,40/200actors benchmark.
- Regresi sesudah Nova: 291 Star turret/Clear/selection, 170 Archer, 64 wave controls PASS. Fixtures memakai ukuran Nova yang baru; assertion sprite-frame lama diganti pengukuran clock animasi procedural2x.
-655 static checks PASS: seluruh asset original, tower definitions/variables/combat, UI/placement/upgrade/clear, scene instances/layers, map/camera/waypoint sama dengan backup; resource refs resolve; PNG genuine alpha.

## Performa dan batas validasi

120-frame requestAnimationFrame benchmark browser headless lokal pada FHD:40actors mean7.20ms, max25.30ms;200actors mean30.73ms, max45.90ms (sekitar32.5fps pada200). Hasil bergantung perangkat/browser; tidak menjanjikan FPS yang sama di semua perangkat.

Buka/compile dibuktikan dengan parser/compiler native dan game dieksekusi dari export. Tidak ada klaim editor Windows dibuka secara interaktif. Animasi adalah gerakan komponen procedural di runtime; PNG menyediakan painted art empat arah. Clip `Nova_Wisp_Animation.webm` direkam dari gameplay sebenarnya, bukan mockup.
