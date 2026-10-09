# Celestial Void — environment aktif

Map aktif memakai ground ungu gelap, nebula background, floating-island cliff frame, celestial roads ivory/gold, crystal cluster, cosmic rock, moon garden, purple foliage, Spawn Portal, Base Nexus dan Cosmic Codex. Semua texture aktif identik dengan backup sebelum cleanup.

Rute zig-zag empat baris di y176/440/704/968 dengan batas x88/1672, road88 world-unit,82 tile dan total jarak7128. Waypoints, kamera fit statis, spawn/base, circular placement validation, obstacle collision dan layout world tetap sama.

Scene memiliki20 Ground_Decoration:13 blocker dan7 shrub;12 interior obstacle removable (4 Crystal,5 Rock,3 Ruin), crystal atas permanen. Clear tetap250 Gold. Ring blocker/collider dan renderer memakai metadata ukuran yang sama.

Shop/HUD/Index/upgrade panel memakai palet purple/navy, lavender/cyan, price plaque, outline frame dan icon Cosmic Codex. Shop kini hanya Star Cannon300 Gold, tanpa track/thumb scrolling. Free placement memakai radius46 dan range authoritative Star, tidak lagi snap-to-grid.

Resource daftar aktif dan metadata theme ada di assets/celestial_void/manifest.json. Terrain.png disimpan sebagai authoring source; bitmap yang sama sudah embedded pada terrain-repeat.svg sehingga Terrain tidak perlu didaftarkan dua kali. Sumber gambar desain yang masih direferensikan manifest tetap tersedia.

Wave bonus tetap100 Gold satu kali dengan LastRewardedWave guard, Manual/Auto dan1x/2x. Semua core map/gameplay dipertahankan pada cleanup. Bukti terbaru: CLEANUP_REPORT.md dan design_previews/cleanup. Historical source/theme concepts tetap di design_previews/nova_map, celestial_void_implementation dan island_upgrade/Reference.png.
