# NOVA map — eksplorasi desain

Tahap ini hanya membuat mockup dan rencana asset. Gambar preview belum diimpor ke GDevelop dan bukan texture map final.

## Geometri yang dipertahankan

- Resolusi editor 1280×720, dengan viewport adaptif. Referensi preview terakhir 1280×800.
- Area gambar konsep 1038×800. Sidebar berada pada x=1048, lebar 224, margin kanan 8 dan gap map 10; sidebar tidak termasuk mockup.
- Ground aktif: `Ground_Map`, TiledSprite, memakai `Default size/towerDefense_tile024.png`.
- Road: `Monster_Path`, sprite tile 64×64, memakai `towerDefense_tile050.png` untuk Surface. Editor memiliki 114 tile berurutan.
- Waypoint berasal dari pusat tile melalui `PathOrder`, lalu ditulis ke `MonsterPathPoints`. Turn centers editor: (96,224), (1376,224), (1376,416), (96,416), (96,608), (1376,608), (1376,800), (96,800), (96,1056), (1376,1056).
- Scene menghitung ulang geometri awal mengikuti viewport ketika belum ada unit/wave. Saat unit sudah ada, kamera menyesuaikan viewport tanpa memindahkan route. Koordinat pada mockup adalah referensi layar, bukan pengganti waypoint dunia.
- Spawn dan Base adalah penanda visual di endpoint pertama/terakhir. Sprite existing: `assets/ui/play.svg` dan `Default size/towerDefense_tile203.png`.
- Tower belum memiliki instance permanen di editor; pemain menempatkannya pada grid 64. Footprint/collision tetap existing. Render map saat ini: Basic/Heavy/Advanced 1.25×, Archer 1.5× dengan 21 state. Preview UI dan shop menggunakan scaling terpisah.
- Dekorasi existing: 12 `Ground_Decoration`, menggunakan `StartingTree.png`. Semua object map berada pada layer world; UI/sidebar memakai layer terpisah dan map mask berhenti sebelum sidebar.

## Paket modular untuk setiap opsi

Prefix nama: `Nova_A`, `Nova_B`, `Nova_C`, atau `Nova_D`. Daftar berikut direncanakan untuk masing-masing opsi, belum merupakan asset siap pakai.

| Asset | Jumlah | Aturan |
|---|---:|---|
| `Ground_Seamless` | 1 | Repeat X/Y; tone tenang, tanpa glow merata atau dekor besar yang berulang |
| `Path_H`, `Path_V` | 2 | Connector identik pada tengah sisi; arah H/V dibaca dari tetangga waypoint |
| `Corner_NE`, `Corner_NW`, `Corner_SE`, `Corner_SW` | 4 | Semua memakai ukuran canvas dan mask gameplay yang sama |
| `Edge_N`, `Edge_E`, `Edge_S`, `Edge_W` | 4 | Overlay batas road opsional, tanpa collision/logic baru |
| `EndCap_N`, `EndCap_E`, `EndCap_S`, `EndCap_W` | 4 | Menutup endpoint, tanpa menggeser pusat spawn/base |
| `Spawn_Platform`, `Base_Platform` | 2 | Transparan, anchor konsisten dengan penanda existing |
| Dekorasi kecil/besar | 6 | Variasi rendah; tidak menutup road, endpoint, tower atau area baca unit |
| Nebula/background | 1 opsional | Layer visual di belakang terrain; tidak menentukan area placement |

Total rencana: 23 asset inti + 1 background opsional per konsep.

Master art dapat dibuat 256×256; tile runtime diekspor 64×64 agar cocok dengan ukuran resource/waypoint existing. Jika kelak menggunakan texture resolusi lebih tinggi, scale texture dan collision mask harus diverifikasi secara terpisah. Jangan otomatis mengubah mask mengikuti alpha gambar.

Ground wajib diuji sebagai pola 3×3/5×5 untuk memeriksa sambungan, pengulangan mencolok dan perbedaan warna sisi. H/V/corner/end-cap wajib diuji sebagai route zig-zag lengkap. Glow tipis tetap berada pada modul path, tidak mengubah footprint. Origin, center, `PathOrder`, mask dan seluruh waypoint tetap existing.

## Perbedaan asset per konsep

| Opsi | Ground / road | Enam dekorasi yang direncanakan | Spawn / Base | Kesulitan relatif |
|---|---|---|---|---|
| A — Nebula Kingdom | Ungu-biru muted / batu astral violet | Kristal kecil, kristal cluster, meteor kecil, meteor besar, debu bintang, rune stone | Portal astral / citadel nebula emas | Sedang; atlas batu dan seam ground |
| B — Galactic Outpost | Tanah planet biru-teal / panel logam cyan | Antena pendek, antena tinggi, crystal pod, batu kecil, batu alien cluster, lampu energi | Arrival pad / outpost fortress | Sedang; sambungan garis neon harus presisi |
| C — Celestial Islands | Daratan indigo / jembatan moonstone | Kristal melayang, cluster kristal, awan kecil, awan perimeter, stardust, batu langit | Moon gateway / sanctuary cream-gold | Tinggi; tepi pulau, awan dan depth illusion memerlukan overlay |
| D — Dark Nova | Charcoal-indigo / jalur violet-magenta | Kristal kecil, kristal besar, asteroid kecil, asteroid cluster, cosmic dust, fissure accent | Rift platform / dark citadel | Sedang; kontrol kontras/glow paling penting |

Untuk C, kesan melayang harus diwujudkan dengan dekorasi/lapisan visual. Tidak boleh membuat lubang fisik baru atau mengurangi area placement tanpa persetujuan perubahan layout.

## Keterbacaan dan implementasi setelah pemilihan

- Road harus berbeda nilai terang dan tekstur dari ground. Glow dibatasi pada tepi/joint, bukan seluruh permukaan map.
- Unit monster berada di road: silhouette dan health bar perlu diuji terhadap warna path; arrow/bolt cream-gold dan range indicator harus tetap jelas.
- Tower kayu/brown-gold cocok paling alami dengan A/C. B memberi kontras sci-fi/fantasy yang lebih kuat. D menonjolkan tower dan projectile melalui background gelap.
- Pilih animation road H/V/corner/end-cap dari hubungan tile sebelumnya dan berikutnya; ini hanya pemilihan visual pada object `Monster_Path` yang sama. Jangan mengubah urutan, posisi atau movement.
- Platform Spawn/Base hanya mengganti visual, bukan penentuan endpoint atau Lives.
- Tidak ada pekerjaan implementasi yang dimulai sebelum pengguna memilih A/B/C/D.

Mockup AI adalah referensi art direction. Semua detail dan sambungan modular perlu dibuat serta divalidasi lagi setelah pilihan ditetapkan; satu gambar preview tidak akan dipakai sebagai pengganti sistem map gameplay.
