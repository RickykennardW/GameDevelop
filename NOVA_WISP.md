# Nova Wisp â€” enemy aktif seluruh50 wave

Object `Enemy`, group `MonsterEnemies`, dan behavior `Health` dipertahankan. Empat PNG RGBA1254Ã—1254 di assets/nova_wisp menyediakan arah Right/Left/Down/Up. State Idle/Move/Hit/Death, pergerakan kristal, orbit glow, bob, hit reaction, dissolve death, serta healthbar generik tetap aktif. Transform animasi tidak menggeser collider/route.

Satu archetype Basic:100HP, speed80, armor0, reward5. Wave n =nÃ—4 enemy; interval spawn0.9 game-second. Bonus wave100 Gold; semua50 wave aktif dan tidak ada wave51. Tidak ada varian stats/warna/ukuran atau boss queue.

Source aktif: nova-wisp-runtime.js, nova-wave-manager.js, nova-spawn-runtime.js, nova-movement-runtime.js, nova-death-runtime.js, enemy-healthbar-runtime.js. Kode core Nova sama dengan backup sebelum cleanup. Slime clips/resources/configs dan legacy recovery variables sudah dihapus dari project aktif; salinan penuh ada di backup.

Index Monsters memuat Nova Wisp dan satu Void Hound. Asset gallery dan video gerak tetap tersedia di design_previews/nova_wisp. Hasil uji terbaru ada di design_previews/cleanup/test-nova-wisp-results.txt. Rincian: CLEANUP_REPORT.md.
