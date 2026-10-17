# Celestial Void Tower Defense

Buka **Tower Defense.json** di GDevelop. Project memakai satu Game Scene, satu Star Cannon dengan 21 kombinasi upgrade valid, enam enemy, 45 Gold-Budget waves, dan audio galaxy dinamis.

**NO BACKUP â€” aturan permanen pengguna untuk seluruh pekerjaan Codex.** Jangan membuat salinan project/asset, folder backup, .bak/.old/.backup, JSON pengaman, ZIP atau snapshot manual. Instruksi lengkap ada di **AGENTS.md**.

Struktur aktif:

- `layouts/game-scene.json`: scene, object definitions, instance, event dan konfigurasi authoritative.
- `eventsFunctionsExtensions/health.json`: extension Health yang digunakan gameplay.
- `assets/`: map, Star Cannon, enemy, UI, effects, audio dan texture shared yang aktif.
- `tools/`: 24 source runtime, embedding dan tool validasi yang masih dipakai; source komposisi audio original.
- `data/Celestial_Void_Data_Wave_Monster_Tower.xlsx`: file Excel final yang sebelumnya diminta pengguna.
- `validation/`: hasil pemeriksaan terbaru, tanpa salinan JSON project atau asset pengaman.

Panduan pemeliharaan: **PROJECT_GUIDE.md**. Hasil pembersihan: **FINAL_CLEANUP_REPORT.md**.

Sesudah mengedit source runtime, jalankan `python tools/embed-free-placement.py`. Resource identifier dapat berbeda dari lokasi file; gunakan `resources[].name` untuk referensi runtime dan `resources[].file` untuk filesystem.

Validasi:

```powershell
python tools/validate-project.py
node tools/validate-clean-project.cjs
python tools/run-clean-validation.py --prepare
python tools/run-clean-validation.py test-clean-project
```

Suite lain: `test-nova-wisp`, `test-void-hound`, `test-void-common`, `test-healthbars-balance`, `test-void-golem`, `test-gold-budget`. Native compiler/runtime GDevelop tersedia pada mesin ini; `GD_VALIDATION_HOME` dapat menunjuk lokasi adapter lain. Export preview adalah build gameplay yang diregenerasi langsung, bukan backup atau salinan project sumber.

Klik/tap atau tekan tombol untuk mengaktifkan audio browser. Speaker kecil di sebelah HUD mengatur Master/Music/SFX/UI dan mute. Bila GDevelop masih menampilkan data lama, buka ulang project utama.

Monster Index memakai discovery per jenis: siluet dan data tersembunyi sampai spawn wave pertama. Untuk beta, status hanya berlaku selama satu sesi aplikasi dan reset saat launch ulang/New Game; notifikasi Celestial Archive berdurasi empat detik memakai queue. Rincian implementasi dan pengujian: **MONSTER_DISCOVERY_REPORT.md**.
