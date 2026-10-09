# Celestial Void Tower Defense

Buka **Tower Defense.json** dengan GDevelop. Project folder memiliki satu scene `layouts/game-scene.json`, satu tower resmi **Star Cannon**, dan lima enemy **Nova Wisp, Void Hound, Void Guard, Void Sentinel, Void Brute** untuk50 wave.

Dokumentasi aktif: CLEANUP_REPORT.md, BALANCE.md, STAR_CANNON.md, NOVA_WISP.md, VOID_HOUND.md, VOID_COMMON_ENEMIES.md, VOID_COMMON_ENEMIES.md, STAR_TURRET_OBSTACLES.md, CELESTIAL_VOID.md. Resource gameplay berada di assets; runtime source berada di tools dan disalin ke event menggunakan `python tools/embed-free-placement.py`.

Backup lengkap sebelum cleanup: `backups/pre_star_only_cleanup_20261009.zip`. Skrip migrasi dan laporan/preview versi lama sudah diarsipkan dalam backup. Buka file utama yang sudah dibersihkan saat GDevelop masih menyimpan project lama di memori; autosave pra-cleanup juga tersedia dalam backup.

Pengujian: `node tools/validate-clean-project.cjs`, lalu `python tools/run-clean-validation.py --prepare`, `python tools/run-clean-validation.py test-clean-project`, `python tools/run-clean-validation.py test-nova-wisp`, dan `python tools/test-clean-project-live.py`. Adapter memakai libGD/native runtime GDevelop yang terpasang pada mesin ini; set GD_VALIDATION_HOME untuk lokasi alternatif. Header tes live juga mencatat lokasi default.

Preview terbaru: design_previews/cleanup. Asset contact sheets Star/Nova dan konsep map disimpan terpisah sebagai referensi desain; bukan resource gameplay yang diload game.

Void Hound: assets/void_hound, empat atlas/64 poses, muncul mulai Wave4. Detail distribusi dan bukti terbaru ada di VOID_HOUND.md serta design_previews/void_hound.

Tiga common Void enemies: assets/enemies/void_guard, void_sentinel, void_brute;192 nativeRGBA frames128px. Animations/armor/waves/current test evidence: VOID_COMMON_ENEMIES.md dan design_previews/void_enemies.

Three common enemies: assets/enemies/void_guard, void_sentinel, void_brute.192native RGBA frames128px. Current animation/armor/wave/test report: VOID_COMMON_ENEMIES.md.

Balance/HP bars terbaru (2026-10-09): HP_BARS_BALANCE_REPORT.md dan BALANCE.md. Bukti ada di design_previews/gameplay_balance. Stats enemy/art/animasi tetap; konfigurasi upgrade, bonus wave, distribusi tank, spawn pacing, dan pasangan HP bar diperbarui. Laporan cleanup/enemy sebelumnya merupakan catatan versi saat dibuat.

Tes HP/balance: `python tools/run-clean-validation.py test-healthbars-balance`. Skrip model tanpa dependencies: `node tools/analyze-game-balance.cjs --live`. Set `GD_VALIDATION_RESULTS` ke folder hasil yang diinginkan agar bukti lama tidak tertimpa.
