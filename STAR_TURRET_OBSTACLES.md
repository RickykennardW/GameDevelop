# Turret, selection dan removable obstacle aktif

Star Cannon memakai komponen Base/Turret dengan metadata pivot, contact, muzzle, serta silhouette. Rotasi tidak menggeser footprint, range atau camera. Klik body/base/barrel memilih owner yang sama; panel upgrade dapat berpindah kiri/kanan. Sell membersihkan owner serta kedua komponen.

Celestial Void map, portal, nexus, crystals, ruins, rocks, cosmic vegetation, circular blockers, fixed camera dan MonsterPathPoints dipertahankan. Obstacle panel memiliki Clear250 Gold, Cancel dan X; Escape menutupnya. Gold kurang250 mempertahankan object/blocker. Clear menghapus hanya owner yang dipilih, ring dan blocker miliknya. Overlap blocker lain tetap menghalangi placement. Input panel/Index/builder mempertahankan prioritas agar tidak membeli, menyeleksi atau menghapus object di bawah UI secara keliru.

Kode obstacle-panel-runtime.js dan map initialization identik dengan backup. Uji terbaru meliputi21 upgrade states, muzzle aktual PIXI, native click, Clear/refund, camera/route, serta ukuran800×480,1920×1080,2560×1440. Bukti: design_previews/cleanup dan CLEANUP_REPORT.md.
