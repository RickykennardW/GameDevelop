# Starfall Bastion — MainMenu

Main menu diterapkan langsung dalam project. `Tower Defense.json` memakai `firstLayout: MainMenu`, dengan urutan `/layouts/main-menu` lalu `/layouts/game-scene`. Nama tampilan project menjadi Starfall Bastion. Start membuka `Game Scene` existing; gameplay tidak berjalan di belakang menu.

Enam asset final berada di `assets/ui/main_menu/`:

| File | Fungsi |
| --- | --- |
| `starfall_bastion_background.png` | Background original 1672x941, built-in image generation: benteng astral, bulan violet, nebula dan ruang gelap untuk UI |
| `starfall_title.svg` | Judul transparan, metallic gold, letterform Georgia yang dijadikan path dan ornamen celestial; tidak memerlukan font pada export |
| `start_normal.svg`, `start_hover.svg` | Bingkai primary action |
| `exit_normal.svg`, `exit_hover.svg` | Bingkai secondary action |

Label START dan EXIT GAME tetap Text Object native yang editable. Judul ditampilkan sekali. Prompt final dan metode tersimpan pada `tools/main-menu-art-prompt.md`; tidak ada stock image atau asset Bloons TD 6 yang diimpor.

Scene baru `layouts/main-menu.json` memiliki delapan object/instance: MenuBackground, MenuTitle, MenuStart, MenuExit, MenuStartLabel, MenuExitLabel, MenuSubtitle dan MenuStatus. Background memakai layer dasar dan elemen UI memakai MenuUI. Satu event JavaScript `[0]` berasal dari `tools/main-menu-runtime.js`. MenuConfig menyimpan GameplayScene, HoverScale 1.06 dan TransitionSeconds 0.28.

Hover memakai interpolasi menuju scale dari referensi stabil, pergantian state bingkai dan cursor pointer. Klik dihitung pada release yang cocok dengan press awal. Start dikunci selama fade 0.28 detik, lalu menjalankan `gdjs.evtTools.runtimeScene.replaceScene`. Scene unload melepas listener, partikel, fade dan audio menu.

Exit menjalankan aksi resmi `gdjs.evtTools.runtimeScene.stopGame`. Implementasi renderer GDevelop mendukung close window Electron atau navigator exit ketika tersedia. Pada Chrome aksi tersebut tidak menutup tab; menu menampilkan pesan singkat untuk menutup tab sendiri. Test mengamati pemanggilan quit sambil tetap menjalankan implementasi aslinya. Desktop window closing belum diuji.

Layout memakai desain 1280x720 dan canvas minimum 960x540 yang mempertahankan aspect ratio viewport. Background memakai proportional cover, title/buttons tetap di tengah, dan label tombol memiliki minimum fisik sekitar 12px/11px pada window kecil. Ukuran nol/nonfinite, ukuran sangat kecil atau document hidden mempertahankan layout valid terakhir. Layout dihitung ulang saat dimensi berubah; object digunakan ulang dan scale tidak terakumulasi.

Musik Sacred Void Temple dan UIClick digunakan kembali melalui AudioConfig existing. Menu membaca hanya konfigurasi audio dan preferensi Master/Music/UI/Mute yang tersimpan. Browser memulai audio setelah gesture. Musik menu hanya satu instance, fade saat Start, dan gesture sah diteruskan sekali kepada mixer gameplay. Tidak ada perubahan soundtrack, sonar, save rules atau balancing.

Perbandingan terhadap prinsip UX yang diminta dari Bloons TD 6: Start menjadi aksi paling jelas, Exit mendapat emphasis lebih rendah, teks kontras, spacing konsisten, hover terlihat dan masuk gameplay hanya satu klik. Ini keputusan desain berdasarkan kriteria usability pengguna; identitas visual tetap Starfall Bastion. Referensi produk resmi: https://store.steampowered.com/app/960090/Bloons_TD_6/.

File implementasi lain yang ditambah/diubah:

- `tools/build-main-menu.py`: membuat SVG final dan scene; tidak menyalin gameplay.
- `tools/embed-free-placement.py`: sinkronisasi source menu ke event.
- `tools/validate-clean-project.cjs`: kompilasi dua scene dan opsi `--scene=MainMenu`.
- `tools/validate-project.py`: validasi semua scene, dengan pengecekan combat pada Game Scene dan startup/source MainMenu.
- `tools/balance-browser.py`: readiness `--menu` dan `--then` untuk regresi dalam gameplay sesudah Start.
- `tools/main-menu-qa.js`: fixture native menu, hover, resize, quit, Start, save dan audio.
- `PROJECT_GUIDE.md`, prompt, report dan evidence dalam `validation/`.

Pengujian yang benar-benar dijalankan:

| Pemeriksaan | Hasil |
| --- | --- |
| Parser/compiler native GDevelop | Dua scene, 0 diagnostics; compiled preview berjalan |
| Menu final | 30 checks lolos; termasuk 20 siklus hover tiap tombol, quit browser, Start sekali, save/audio handoff; `validation/main-menu-native-tests.json` |
| Resize satu sesi | 7 viewport, 13 checks per ukuran: 1920x1080, 1280x720, 960x600, 640x400, 480x300, kembali 1280x720 dan 640x400; `validation/main-menu-resize.json` |
| Gameplay sesudah Start | 110 checks placement, upgrade 5-2/2-5, Fusion/tactical speed, collision, aiming/muzzle, projectile damage, sell dan Index lolos; `validation/main-menu-gameplay-regression.json` |
| Waves/Discovery/Index sesudah Start | 52 checks spawn wave native, enam monster, queue, reveal, unlock Index, click-through dan cleanup lolos; `validation/main-menu-wave-index-regression.json` |
| Scope/checksum | Gameplay JSON identik; mapping resource lama dan file audio identik; resource bertambah 407 menjadi 413; `validation/main-menu-scope-result.json` |
| Validator menyeluruh | 3759 checks lolos sebelum aturan no-backup menolak `Tower Defense.json.autosave` yang sudah ada; file itu dipertahankan. `validation/main-menu-static-validation.json` mencatat status FAIL dan alasan sebenarnya |

Semua preview di atas mencatat nol console error. Pengujian memakai runtime GDevelop native dalam Chrome, profile terisolasi dan fixture di memori. Kondisi ukuran nol disimulasikan melalui sumber dimensi runtime. Minimize/restore OS yang nyata dan penutupan aplikasi desktop tetap perlu pengujian manual. Preview khusus Game Scene di editor tetap langsung membuka gameplay; pilih preview MainMenu untuk melihat alur pembukaan.

Tidak ada backup, duplicate project, backup branch atau salinan asset untuk keamanan yang dibuat. Git history dipertahankan. Export preview adalah build validasi.
