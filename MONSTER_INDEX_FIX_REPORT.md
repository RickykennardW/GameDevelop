# Galactic Archives — Monster portrait rendering fix

20 Oktober 2026. Perbaikan langsung pada project aktif, tanpa backup, salinan project/asset, snapshot, atau perubahan Git history. Perubahan working tree dari pekerjaan sebelumnya dipertahankan.

## Temuan berdasarkan implementasi dan preview

1. Setiap portrait Index sebelumnya mempunyai sprite utama **dan salinan outline berskala 1.06x**. Jadi ada tujuh artwork utama dan tujuh salinan tambahan. Ini memang duplikasi visual; pengujian tidak menunjukkan object baru terus dibuat setiap frame.
2. Fit dilakukan langsung pada renderer PIXI, sedangkan dimensi native `IndexMonsterImage` masih sebesar gambar sumber: Nova 1254×1254, Hound 1536×1024 dan Golem 1024×1536. Transformasi native dapat diterapkan lagi pada fase pre-render GDevelop, setelah callback UI.
3. Renderer Index lama Hound masih mengubah texture/anchor/scale object yang sama. Golem mempunyai jalur rig portrait berwarna tersendiri, terpisah dari tint native. Beberapa pemilik rendering untuk satu slot membuat transformasi, visibility dan tint sulit dijamin konsisten. Jalur actor gameplay terpisah dan tetap dipertahankan.
4. Mask panel tersedia, tetapi belum ada mask target khusus untuk masing-masing thumbnail/detail. Outline yang diperbesar dan transformasi yang ditimpa dapat keluar dari frame portrait.

Baseline native dengan profil baru berhasil menunjukkan dimensi native yang terlalu besar dan outline duplikat. Body berwarna pada kondisi0/6 tidak selalu terulang dalam baseline tersebut; screenshot referensi tidak tersedia pada pesan terbaru. Karena itu, hasil perbaikan diuji dari **pixel hasil render GPU seluruh slot**, bukan hanya nilai properti `tint`.

Sebagai pembanding readability, [catatan resmi Ninja Kiwi untuk BTD6](https://store.steampowered.com/news/posts/?appids=960090&enddate=1665538441&feed=steam_community_announcements) membahas koreksi selection, clipping, texture sizing dan alignment UI. Prinsip yang dipakai di sini adalah pilihan yang konsisten dan gambar yang tetap dalam batasnya. Artwork, tema dan layout Celestial Void dipertahankan; tidak menyalin asset/UI atau mengklaim memakai implementasi internal BTD6.

## Perbaikan dan batas perubahan

- **Satu pemilik artwork per slot.** `monster-discovery-runtime.js` memiliki satu sprite PIXI dan mask per native handle. Cache dibatasi enam thumbnail+satu detail. Tidak membuat salinan outline/shadow Index.
- Native `IndexMonsterImage` tetap dipakai sebagai handle UI, diberi ukuran frame yang benar dan opacity 0. Artwork yang terlihat dirender oleh adapter tunggal. Renderer Index legacy Hound/Golem melewati handle bertanda `__archivePortraitOwned`.
- Setiap update mengatur ulang texture, anchor, scale seragam, posisi, rotation, alpha, tint dan blend mode. Fit memakai alpha bounds/frame idle asli; setiap slot mempunyai mask sendiri di dalam mask collection/detail existing.
- Undiscovered memakai tint **0x000000, alpha 1, normal blending** pada texture beralpha asli. Warna tidak menembus overlay. Thumbnail/detail membaca `d.has(id)` dari state encounter yang sama; lock teks tetap dijaga sampai revision UI diperbarui. Setelah encounter sah, artwork/nama/stat terbuka bersama.
- Hover hanya memberi feedback kartu. Selection memakai key slot yang stabil, tidak melakukan discovery. Tab lain/tutup Index menyembunyikan root; callback destruction/unload melepas resource UI tanpa menghancurkan shared texture.
- Monster discovery beta tetap berbasis sesi sesuai project existing. Ordinary scene replacement mempertahankannya; launch aplikasi baru/New Game eksplisit meresetnya. Fusion discovery permanen dan adaptive variant discovery tidak diubah.

Tidak ada resource/artwork/object definition/layer/scene variable baru. Tidak ada perubahan gameplay, damage, armor, wave, skill, stats, upgrade, Fusion, map, camera atau harga. `Tower Defense.json` byte-identik dengan awal task ini. Semua scene data di luar events tetap identik; runtime lain tidak berubah. Bukti hash/count saja disimpan pada `validation/monster-index-fix-scope.json`.

## File, object dan event

| File | Bagian yang diubah pada task ini |
|---|---|
| `tools/unit-index-runtime.js` | Cabang portrait monster: native handle bounded, ownership flag, metadata frame; Tower/Fusion portrait dan layout tetap |
| `tools/monster-discovery-runtime.js` | `paintIndex`, cache portrait dan disposal; state encounter, session/persistence serta animasi notifikasi tetap |
| `tools/void-hound-runtime.js` | Satu guard ownership pada loop `IndexMonsterImage`; actor gameplay tidak diubah |
| `tools/void-golem-runtime.js` | Satu guard ownership/hide legacy UI rig pada loop `IndexMonsterImage`; actor/skill/buff tidak diubah |
| `layouts/game-scene.json` | Embed ulang empat source di event existing: Index `events[1].events[0]`, discovery `events[0].events[2]`, Hound `events[10].events[0].events[2]`, Golem `events[10].events[0].events[4]` |
| `tools/monster-index-render-qa.js` | Tes baru input, actual GPU pixel, bounds, lifecycle dan encounter |
| `tools/discovery-qa.js`, `discovery-beta-qa.js`, `index-showcase-qa.js`, `test-void-hound.js`, `test-void-golem.js` | Pemeriksaan artwork diarahkan ke renderer tunggal; assertion gameplay/discovery tetap dipertahankan |
| `PROJECT_GUIDE.md`, `INDEX_REDESIGN_REPORT.md`, laporan ini, `validation/` | Dokumentasi arsitektur terkini dan bukti pengujian |

Object yang terdampak hanya handle **IndexMonsterImage**. Tidak ada rename object/variable, perubahan catalog, atau event gameplay baru. Total tetap 404 resources, 67 object definitions, 157 authored instances, 65 scene variables dan 26 runtime source mappings.

## Pengujian yang benar-benar dijalankan

Semua suite browser berikut memakai compiled preview native GDevelop dan profil test terisolasi. Tidak mengubah save pengguna.

| Pengujian | Hasil |
|---|---|
| Native parser/compile/export | Berhasil,67objects dan0scene diagnostics; warning versi libGD/include existing ditangani helper native Health yang sudah tersedia |
| `monster-index-render-qa.js`,1280×720 | **906 checks**, 0 console errors |
| Suite yang sama,960×640 | **928 checks**, 0 console errors |
| Suite yang sama,640×480 | **928 checks**, 0 console errors |
| Full discovery/notification | **52 checks**, 0 console errors |
| Monster session/portrait | **53 checks**, 0 console errors, actual scene replacement dan browser close/relaunch |
| Tower/Monster/Fusion Index | **121 checks**, 0 console errors |
| Fusion transaction/discovery | **59 checks + 8 page reload + 8 browser relaunch**, 0 console errors |
| Native Hound gameplay/portrait | **117 checks**, 0 console exceptions |
| Native Golem movement/skill/buff/portrait | **552 checks**, 0 console exceptions |

Tes terfokus mencakup 24 pergantian selection melalui klik, hover semua jenis, wheel dua arah, perpindahan tab dan 8 kali tutup/buka. Jumlah native portrait/render children stabil; cache tetap 7 dan outline 0. Alpha bounds tetap di dalam frame. Pixel GPU locked mempunyai bentuk nonkosong dan **nol pixel berwarna**; sesudah actual spawn encounter, jenis yang ditemui mempunyai artwork berwarna. Hover/click/render tidak menambah discovery. Pada viewport kecil koleksi tetap menggunakan horizontal scroll existing.

Suite regresi juga menguji queue semua enam discovery, klik placement tembus notifikasi, sound sekali per jenis, data/config/camera tetap, Fusion sukses/cancel/placement, resep Pure tanpa urutan, partial Hybrid independen dan save audio/Fusion tetap terpelihara. Hound/Golem suite mempertahankan pemeriksaan actor/collision/death serta stationary casting, buff armor dan 2x timing existing.

Screenshot terkini diperiksa visual: `validation/Monster_Index_Fixed.png`, `Monster_Index_Locked_960.png`, `Monster_Index_Locked_640.png`. Laporan mesin: `monster-index-render-*.json`, `monster-index-session-regression.json`, `monster-fix-index-regression.json`, `monster-fix-discovery-full.json`, `monster-fix-fusion-regression.json` dan hasil native Hound/Golem di `validation/`.

**Batas validator statis:** JSON/resources/object/layer/source mapping dan audio dependency checks yang mendahului pemeriksaan backup berhasil, tetapi `python tools/validate-project.py` berhenti pada **`Tower Defense.json.autosave`** yang sudah ada sebelum task ini. File tersebut tidak dibuat/diubah/dihapus oleh pekerjaan ini; hash awal/akhir identik. Validator tidak dilemahkan. Sebanyak 3.674 pemeriksaan selesai sebelum berhenti; detail dicatat pada scope report. Pemeriksaan `node --check` untuk empat runtime terkait dan tes baru, serta `git diff --check`, lulus. `validation/static-checks.json` adalah hasil task sebelumnya, bukan klaim validator ketat saat ini lulus.

Tidak dilakukan pengoperasian manual editor GDevelop, playthrough penuh 45 wave, benchmark memori jangka panjang atau pengujian semua platform export. Siklus lifecycle terbatas yang diuji tidak memperlihatkan penambahan object/render children. Tidak ada backup baru yang dibuat.

## Cek manual di GDevelop

1. **Stop Preview lama, reload project aktif `Tower Defense.json`, lalu Start Preview baru** agar source event terbaru dimuat. Jangan membuka autosave sebagai project aktif.
2. Buka Monsters pada sesi baru 0/6: seluruh thumbnail/detail harus hitam, nama `???`, stats/skill terkunci. Hover lalu klik bergantian minimal 20 kali, scroll dua arah.
3. Pindah Towers/Fusion/Monsters dan tutup/buka berulang. Tidak boleh ada portrait tertinggal. Ubah ukuran window 1280×720, 960×640, 640×480.
4. Mulai wave sampai monster ditemui melalui spawn normal. Buka Index: hanya yang benar-benar ditemui terbuka. Uji ordinary scene reload dan New Game sesuai perilaku sesi existing.
5. Periksa portrait3/4 Tower/Fusion, upgrade info, Fusion locked/unlocked, lalu lanjutkan placement/combat/upgrade/sell dan elite cast seperti biasa. Jalankan sesi panjang untuk melengkapi pengujian stabilitas terbatas otomatis.
