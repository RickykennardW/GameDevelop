# Celestial Void Tower Defense

Buka **Tower Defense.json** dengan GDevelop. Project folder memiliki satu scene `layouts/game-scene.json`, satu tower resmi **Star Cannon**, dan dua enemy **Nova Wisp** dan **Void Hound** untuk50 wave.

Dokumentasi aktif: CLEANUP_REPORT.md, BALANCE.md, STAR_CANNON.md, NOVA_WISP.md, VOID_HOUND.md, STAR_TURRET_OBSTACLES.md, CELESTIAL_VOID.md. Resource gameplay berada di assets; runtime source berada di tools dan disalin ke event menggunakan `python tools/embed-free-placement.py`.

Backup lengkap sebelum cleanup: `backups/pre_star_only_cleanup_20261009.zip`. Skrip migrasi dan laporan/preview versi lama sudah diarsipkan dalam backup. Buka file utama yang sudah dibersihkan saat GDevelop masih menyimpan project lama di memori; autosave pra-cleanup juga tersedia dalam backup.

Pengujian: `node tools/validate-clean-project.cjs`, lalu `python tools/run-clean-validation.py --prepare`, `python tools/run-clean-validation.py test-clean-project`, `python tools/run-clean-validation.py test-nova-wisp`, dan `python tools/test-clean-project-live.py`. Adapter memakai libGD/native runtime GDevelop yang terpasang pada mesin ini; set GD_VALIDATION_HOME untuk lokasi alternatif. Header tes live juga mencatat lokasi default.

Preview terbaru: design_previews/cleanup. Asset contact sheets Star/Nova dan konsep map disimpan terpisah sebagai referensi desain; bukan resource gameplay yang diload game.

Void Hound: assets/void_hound, empat atlas/64 poses, muncul mulai Wave4. Detail distribusi dan bukti terbaru ada di VOID_HOUND.md serta design_previews/void_hound.
