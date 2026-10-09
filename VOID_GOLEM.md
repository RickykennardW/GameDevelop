# Void Golem Elite / Void Fortification / Gold Budget

Implementasi langsung pada project Celestial Void, 2026-10-09. Satu Elite baru `VoidGolem`; roster menjadi enam. Lima artwork/stat enemy lama, Star Cannon300Gold,21build upgrade, placement/sell/targeting/projectile/range, map82waypoints sepanjang7128logicalpx, camera dan layout UI tetap.

## Analisis struktur sebelum perubahan

Project folder `Tower Defense.json` merujuk satu scene `layouts/game-scene.json` dan extension Health. Native enemy tetap object `Enemy`; jenis ditentukan `EnemyType` dalam `EnemyTypes`. Runtime empat-arah, path/Waypoint, armor Health.FlatDamageReduction, reward satu kali, HP bar pasangan ber-ID dan renderer PIXI sudah digunakan oleh lima archetype lama. Stat Golem dan status menggunakan sistem yang sama.

Root event10 memiliki init Nova/Hound/Common, wave manager, spawn, movement, Star combat, death, completion dan HUD. Dua initializer baru berada di10/0/4 serta10/0/5. `beforeMove` dipanggil sebelum route progression; release diproses di akhir death handler, setelah Star combat. HP bars tetap event13; renderer Golem dipanggil dari akhir event14. Ini mencegah buff dirilis oleh caster yang terkena lethal damage pada frame release.

Baseline Git58e7779848d8af059823ec98e26323b4fa3c08c3 masih aktif. Baseline sebenarnya memakai50wave dan bonus completion60; instruksi terbaru menetapkan45 dan Gold dari kill. Karena itu maximum/hud/victory menjadi45 dan bonus completion0. Completion tracking tetap; banner tidak menampilkan+0Gold. Starting650, sell70%, dan harga/stat Cannon tidak berubah.

## Asset dan empat arah

Built-in imagegen dipakai dengan blueprint sebagai referensi utama. Empat PNG final RGBA1024Ã—1536 disalin persis dari hasil tool: Down/front, Up/rear (tanpa core dada), Left/Right profil. Tidak ada recolor/duplikasi enemy lama atau buffed monster. Hanya empat atlas masuk resource aktif, total12.82MB; alpha0 nyata sekitar26% pada tiap sheet. Up diperbaiki lewat imagegen agar rear armor berbeda dari front.

Setiap atlas berisi5baris Ã—4pose: Idle, Move, Hit, Death, Skill. Total20clip/80pose berbeda. Nama mengikuti convention existing `VoidGolemMove_Up`, dst; tidak ada Attack. Frame source tidak diekstrak/disalin menjadi80file. Metadata region/foot anchor dibaca dari alpha; renderer memakai shared PIXI.Texture cache dengan orig/trim canvas256Ã—342 seragam dan skala120/256. Native logical sprite64Ã—64, origin/center stabil, collision mask hidup kompak dan Death tanpa hitbox. Tidak memutar atau vertical-flip sprite untuk menghasilkan arah.

Idle memiliki bob/pulse/halo, Move langkah berat bergantian, Hit flash/recoil singkat, Death armor/core terpisah dan fade, Skill pose defensif. Empat frame per state; runtime crop yang berbeda benar-benar ditampilkan dan diuji. Foot anchor metadata menjaga ground point antar pose; collider tidak mengikuti artwork yang membesar/terpecah. HP bar Golem40px/tinggi6, head offset140; bar lama tetap24/30/30/26/36.

Lihat `design_previews/void_golem/Animation_Preview.html` untuk20clip yang dapat dipause/diubah kecepatannya, serta dua screenshot native Casting/Buff. Prompt tool dan hash/dimensi/alpha tercatat di `generation-prompts.json` dan manifest.

## State, casting diam dan timing

Per instance: Moving â†’ Casting â†’ Moving, dengan Dying/ReachedBase prioritas tinggi. Cooldown dimulai25game-seconds setelah spawn dan independen. Saat cast mulai, simpan X/Y/Waypoint/Facing, hentikan traversal sebelum budget movement dipakai, paksa Skill sesuai arah tersimpan. Selama0.8s tidak ada drift, advancement atau teleport. Base MoveSpeed50 tidak ditulis nol; setelah selesai lanjut posisi/waypoint yang sama pada frame berikutnya.

Release pada0.6s, selesai0.8s, cooldown berikut25s dari awal cast. Timeline relatif spawn sekitar25/25.6/25.8/35.6/50. Timers memakai elapsed game-time asli termasuk mode2x. Death membatalkan cast dan release yang belum terjadi. Hit saat cast mengubah tint ringan; Skill tetap aktif dan damage tetap diterima. Gold20 dibayar sekali, Death0.9s menyelesaikan empat pose lalu peer/corpse dibersihkan. Tidak ada invulnerability/heal/regen/damage skill.

## Void Fortification dan armor

HP480, Speed50, BaseArmor25, Gold20, MinimumWave12, ClassificationElite. Skill tunggal: +10Armor, duration10s, cooldown25s, radius100logicalpx, cast0.8s, release0.6s.

Saat release, snapshot semua Enemy hidup termasuk caster dengan distance<=100. Exclude dead/reached-base; Tower/Base tidak di-query. Masuk radius setelah release tidak otomatis terkena; keluar tetap menyimpan buff. Caster mati sesudah release tidak menghapus buff ally yang sudah diberikan.

Named effect `StatusEffects.VoidFortification` plus BaseArmor/EffectiveArmor/Active/Expiration. Effective=immutable BaseArmor+(active?10:0), bukan penambahan berulang. Aplikasi caster kedua hanya refresh expiry ke waktu release+10s dan mempertahankan satu VFX. Armor Health.FlatDamageReduction aktual di-update hanya saat berubah; expire mengembalikan25Golem,10Guard,0Nova, dst. Expiry berlangsung sebelum combat; lethal combat mendahului release.

## Cast VFX dan status VFX terpisah

`VoidFortificationCastPulse`: satu SVG200px, rune/ring violet tipis mengembang24â†’200 selama0.4s lalu fade; z11990, pusat snapshot caster. `VoidFortificationVFX`: empat SVG32px loop0.2s, shield batu/void dengan rune yang berdenyut; ukuran14common/18Elite, di kanan HP bar, z14990. Projectile tetap15000 dan HP20000. Efek tidak menutup core/face atau bar.

Satu native overlay per enemy aktif. Map keyed UID + destroy callback + owner/overlay lifetime UID mencegah salah pemilik saat GDevelop recycling object. Overlay mengikuti logical center/layer dan dihapus pada expire/death/base/delete. Tidak dibuat ulang tiap frame; refresh memakai icon sama. Cast pulse dan buff shield memiliki lifetime berbeda. Seluruh archetype memakai resource shield yang sama; tidak ada enam versi buffed artwork.

## Gold Budget dan komposisi

```
BaseBudget =100+50*(W-1-floor((W-1)/5))
WaveBudget =BaseBudget*(W%5==0 ?1.2:1)
```

Config `WaveBudgetConfig`: initial100, increment50, every5, multiplier1.2, LastWave45, Seed177017. Budget contohW1=100,W5=360,W6=300,W10=600,W11=500,W12=550,W15=840,W16=700,W45=2280. Budget tidak masuk Money saat mulai wave. Cost per enemy=reward5/7/6/8/10/20, unlock1/4/5/6/7/12. Common tetap eligible setelah unlock; Elite juga harus setelah5.

Seeded xorshift dan stable sorted archetype names menghasilkan plan konsisten antara serializer GDevelop dan model. Generate hanya sekali ketika Play/Auto memulai wave. Pilih1â€“3 jenis common berbobot, bukan semua tipe wajib. Repair tail kecil dengan coin DP memakai common eligible jika diperlukan untuk membelanjakan sisa tanpa over-budget. Elite opsional: chance .25 +.012/wave setelah12, milestone+.35, cap.85; jumlah cap5 serta porsi budget10%normal/15%milestone, count bertumbuh tiap8wave. Semua parameter ada di config. Milestone menjamin satu jenis common berarmor ketika tersedia dan bobot armor1.6. Wave5 belum memiliki Guard/Brute, bonus budget tetap20%.

Seed aktif: W12 belum memilih Golem meski eligible; pertama muncul13. W45=224Brute+2Golem,226enemy, budget2280. Total45wave46980killGold. Tidak ada stat scaling. Rule active `Wave*4` dan EnemyWaveDistribution lama dihapus; progressive spawn pacing tetap max(.36,.9-max(0,W-5)*.015), speed enemy tetap. Victory berhenti45, completion mempertahankan reward-once bookkeeping tetapi tidak memberi bonus uang.

## Pengujian yang benar-benar dijalankan

GDevelop5.6.283 native parser memuat1scene/61objects/333resources; scene + Health extension compiler0diagnostic; export preview sukses. Adapter membundel Health generated code serta debugger dependency native; tidak mengganti gameplay dengan shims.

| Suite | Checks lulus |
|---|---:|
| test-clean-project | 283 |
| test-gold-budget | 7486 |
| test-healthbars-balance | 183 |
| test-nova-wisp | 14532 |
| test-void-common | 636 |
| test-void-golem | 552 |
| test-void-hound | 117 |

Total23789pemeriksaan dalam7suite, semua0console exception. Static audit1342checks:345asset lama tidak berubah, resource/animation references valid, native event lain dipertahankan, source/embed sesuai, geometry/layer/properties sama, runtime Star/placement/selection/HP/old enemy/Health tetap (Git text line endings dinormalisasi).

Tes mencakup80texture crop/canvas seragam;20clip Idle/Move/Hit/Death/Skill; empat arah tanpa spin; HP/armor/collider;25s cooldown dan50s cast kedua; independent instance; semua frame casting X/Y/Waypoint/Facing diam; resume50px/s; Hit tidak membatalkan Skill; native lethal projectile tepat0.6s membatalkan release;2x game-time; single20Gold reward; base leak tanpa killGold; radius100 boundary; snapshot enter/leave; nonstack/refresh; caster death;10s expiry; follow/z; cleanup200recipients; Index6entry dan Shop satu card84Ã—112/300Gold.

Projectile native50damage melakukan25damage saat armor25 dan15damage saat armor35. Native2â€“4 volley34.72Ã—3 terhadap armor35 melakukan3damage, sesuai minimum1/hit. Regression21upgrade combinations, sell refund, target/range/rotation, obstacle clearing/UI, lima enemy lama serta actual sequentialspawn/kill/completion45waves lulus. Budget32seedÃ—45=1440compositions dicek unlock/cost/exact spend/Elite caps/milestone/late common; tidak ada wave46.

Native earned-income campaign1â€“5 dengan650Gold/10Lives dan2baseCannon total600 clear tanpa leak, saldo1110. Diagnostic wave13 satu Cannon base leak75/90 dan Golem cast5kali sepanjang jalan. Wave45 satu4â€“2 leak186/226; satu2â€“4 leak188/226. Native8Cannon4â€“2 total40560 clear wave45(224Brute+2Golem) tanpa leak, reward2280, peak77,117.4simulated-seconds. Late fixtures memakai100000Gold/10000Lives untuk mengukur combat; seluruh placement dan upgrade dibayar melalui fungsi asli.

Stress actual requestAnimationFrame120samples/crowd:200enemy(33Golem)+200shield mean6.95ms,p95=16.8ms;450enemy(75Golem)+450shield mean17.34ms,p95=29.9ms. Tidak ada VFX/HP bar pair baru tiap frame; semua owner/peer/bar/shield/pulse bersih setelahdelete. Screenshotnative4arah/Skill/shields dan semua live fixtures0console errors. Galeri20canvas/empat atlas final juga dibuka di Chrome dan diperiksa animasinya berjalan,0exception. Log parser/compiler final tersedia di native-compile.txt.

Harness --dump-dom pertama timeout ketika7Chrome dibuka paralel. Diganti CDP dan browser terisolasi yang ditutup sebelum hasil disimpan; hasil final di atas diperoleh dari run sukses. Beberapa fixture baru diperbaiki (Index roster5â†’6, pooled projectile flags, requestPlay melalui tombol asli, mode2x setelah enemy ada, posisi diagnosis lolos validator); gameplay tidak diubah untuk melewatkan tes.

## Temuan balance dan keterbatasan

Gold reward adalah cost ekonomi, bukan ukuran threat identik. Golem20Gold berarmor35 saat buff membuat rapid low-per-hit Meteor2â€“4 sangat lemah: theoretical direct DPS turun39.53(armor25)â†’4.07(armor35), sedangkan4â€“2=66.42â†’52.87. Base=27.78â†’16.67. Mengabaikan splash/range/travel/overkill; tidak menyesuaikan stat atau harga secara diam-diam. Banyak tower/high per-hit damage dan posisi tetap berpengaruh. Wave45 jauh lebih banyak tank daripada sistem lama; waktu fixture satu tower sekitar217game-seconds, delapan tower117.4s. Ini dilaporkan sebagai konsekuensi budget/spawn pacing yang dipertahankan.

GUI editor GDevelop belum dioperasikan manual; parser/compiler terpasang dan actual compiled runtime preview sudah diuji. Atlas Golem menggunakan custom crop renderer, mengikuti pola presentation layer project: raw animation editor dapat memperlihatkan full atlas berulang, sedangkan gameplay menampilkan80region berbeda. Empat frame per clip memberikan animasi pendek, bukan interpolasi rig3D. Existing artwork benar-benar tetap.

Belum menjalankan campaign earned-income penuh1â€“45; bukti actual1â€“5 dan diagnostic late wave terpisah. Angka FPS/headless ini spesifik mesin dan fixture statis tanpa tower, bukan jaminan mobile/GPU lain. Validation folder berisi compiled preview untuk tes, bukan salinan JSON project/backup. Preview fixtures memendekkan cooldown untuk screenshot saja; production tetap25s.

## File yang dibuat dan diubah

File gameplay baru: empat `assets/enemies/void_golem/VoidGolem_{Up,Down,Left,Right}.png`, `manifest.json`; lima `assets/effects/void_fortification/{Shield_0.svg,Shield_1.svg,Shield_2.svg,Shield_3.svg,CastPulse.svg}`; `tools/void-golem-runtime.js`, `tools/gold-budget-runtime.js`.

File tracked yang diubah:

- `BALANCE.md`
- `README.md`
- `Tower Defense.json`
- `layouts/game-scene.json`
- `tools/cleanup-audit/source-mapping.json`
- `tools/embed-free-placement.py`
- `tools/island-render-runtime.js`
- `tools/nova-death-runtime.js`
- `tools/nova-movement-runtime.js`
- `tools/nova-spawn-runtime.js`
- `tools/nova-wave-manager.js`
- `tools/nova-wisp-runtime.js`
- `tools/responsive-map-runtime.js`
- `tools/run-clean-validation.py`
- `tools/test-clean-project.js`
- `tools/test-nova-wisp.js`
- `tools/test-void-common.js`
- `tools/test-void-hound.js`
- `tools/unit-index-runtime.js`
- `tools/validate-clean-project.cjs`

Tool/report baru (di luar dua runtime dan asset di atas):

- `tools/analyze-gold-waves.cjs`
- `tools/audit-void-golem.py`
- `tools/gold-budget-runtime.js`
- `tools/integrate-void-golem.py`
- `tools/live-void-golem-qa.js`
- `tools/native-gold-budget-scenarios.js`
- `tools/native-late-defense-qa.js`
- `tools/prepare-void-golem.py`
- `tools/probe-void-golem.js`
- `tools/run-native-suite.py`
- `tools/test-gold-budget.js`
- `tools/test-void-golem.js`
- `tools/void-golem-runtime.js`

Dokumentasi baru `VOID_GOLEM.md`; seluruh bukti/prompt/summary/wave plan/screenshot/animation gallery berada di `design_previews/void_golem/`. Raw resource hanya empat atlas dan lima SVG; tidak ada frame image duplikat atau buffed monster.

## Konfirmasi tanpa backup

Tidak membuat .bak/.backup/.old/ZIP/backup folder/snapshot/backup branch/duplicate project JSON. File aktif diedit langsung dengan transformasi in-memory. Git HEAD/history tidak dimodifikasi; user backup existing tidak disentuh. Audit membandingkan Git blob di memori tanpa menulis salinan project. Export native diperlukan untuk menjalankan tes dan tidak menulis project.json duplikat.
