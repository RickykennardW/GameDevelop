# Perbaikan hover dan alignment tombol

## Akar masalah yang terkonfirmasi

Keempat tombol memakai label Text Object tunggal, terpisah dari sprite bingkai. Font, alignment dan teks tidak berganti antar-state. Tidak ada label hover duplikat atau tween posisi lain. Dua controller menu menerapkan faktor hover yang sama pada bingkai dan label, lalu mengurangi setengah lebar bingkai hasil scaling dari posisi X label.

Renderer wrapped Text GDevelop memusatkan teks pada `object.x + wrappingWidth / 2`. Wrapping width sebelumnya tetap320, sedangkan perhitungan X mengasumsikan width ikut dikalikan scale. Pada scale dasar1 dan hover1.06, hasilnya `-160 * 1.06 + 160 = -9.6px`. Pada viewport kecil, perbedaan scale dasar juga menyebabkan offset dalam keadaan normal.

Pengukuran native sebelum edit mengonfirmasi drift sekitar9.600006px pada Start, Exit, Restart dan Main Menu. Bukti sebelum perubahan adalah data pengukuran di `validation/hover-alignment-before-lobby.json` dan `validation/hover-alignment-before-defeat.json`, bukan salinan project.

## Perubahan minimal

- `tools/main-menu-runtime.js`: label Start/Exit memakai scale dasar viewport tanpa faktor hover, wrapping width320×scale dasar, X berdasarkan setengah `label.getWidth()`, dan Y berdasarkan setengah tinggi label aktual.
- `tools/game-over-runtime.js`: koreksi identik pada Restart/Main Menu; wrapping width diperbarui pada relayout viewport.
- `layouts/main-menu.json`: event JavaScript0 disinkronkan dengan source menu.
- `layouts/game-scene.json`: event19.events[0] disinkronkan dengan source Game Over.
- `tools/menu-button-alignment-qa.js`: fixture pengukuran glyph native setiap frame.
- `PROJECT_GUIDE.md`, laporan ini, dan laporan pengukuran di `validation/hover-alignment-*`.

Object yang terlibat: `MenuStartLabel`, `MenuExitLabel`, `DefeatRestartLabel`, `DefeatMainMenuLabel`, bersama bingkai existing masing-masing. Tidak ada perubahan definisi object, authored instances, labels, font, warna, artwork, dimensi dasar tombol, variable, layer, harga, atau mekanisme klik/transisi.

Bingkai tetap memakai interpolasi hover1.06, animasi Normal/Hover, border/glow dan posisi pusat existing. Label mempertahankan ukuran normal selama hover/press sehingga pusat dan ukuran glyph stabil. Tidak ada perubahan gameplay maupun pembuatan backup.

Pencarian source menemukan hanya dua controller tersebut yang memakai helper hover dan perhitungan label ini, mencakup tepat empat tombol yang dilaporkan. Tidak ada tombol lain dengan implementasi yang sama yang perlu diedit.

## Pengujian aktual

Preview menggunakan compiler/exporter dan runtime GDevelop native di Chrome. Fixture memeriksa batas glyph renderer aktual, bukan hanya posisi nominal Text Object.

| Pemeriksaan | Hasil |
| --- | --- |
| Sebelum perubahan | Keempat tombol terukur bergeser kiri sekitar9.6px saat hover penuh. |
| Alignment MainMenu |60checks lolos; `validation/hover-alignment-lobby.json`. |
| Alignment Game Over |60checks lolos; `validation/hover-alignment-defeat.json`. |
| State yang diukur | Cursor di luar, masuk, hover diam, mouse ditekan, keluar sambil ditekan, release di luar,12siklus masuk/keluar berulang per tombol pada setiap viewport, dan kembali ke ukuran dasar. |
| Resize dalam sesi yang sama |1280×720 →960×600 →640×400 →480×300 →1280×720, untuk kedua scene. |
| Pergeseran/centering setelah fix | Pergeseran maksimum pusat glyph0; error pusat X/Y0; perubahan dimensi glyph0 pada seluruh state/viewport yang diuji. |
| Hover visual | Bingkai tetap menuju1.06, menggunakan state Hover dan kembali ke Normal tanpa pertumbuhan kumulatif. |
| Fungsi MainMenu |30checks existing lolos, termasuk Start, Exit native path, settings/save dan audio; `validation/hover-alignment-lobby-regression.json`. |
| Fungsi Game Over |53checks existing lolos, termasuk Restart, Main Menu, Start kembali, input guards, reset run dan discovery/audio; `validation/hover-alignment-game-over-regression.json`. |
| JSON/resource/source |138scope checks dan3702pemeriksaan structural/resource existing lolos melalui `python tools/validate-game-over.py`. |
| Kompilasi | Kedua scene berhasil dikompilasi/export dengan0event diagnostics. |
| Console preview |0errors pada seluruh pengujian sebelum/sesudah dan regresi tersebut. |

Tidak mengklaim membuka IDE GDevelop interaktif atau menguji penutupan desktop export. Exit diuji pada native quit path di browser, dengan perilaku close-tab existing tetap. Compiler tetap menampilkan warning versi bundled libGD yang sudah ada; hasil kompilasi dan preview di atas benar-benar dijalankan. Validator kebersihan penuh tidak diklaim lolos karena editor autosave existing; perubahan pengguna pada `Tower Defense.json.autosave` dibiarkan utuh.

Tidak ada backup, folder backup, duplikat project, perubahan Git history, atau asset baru.
