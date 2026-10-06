# Ramadhan × Ila — Anniversary 07.10.2022

Versi ini dibuat lebih romantis dan cinematic: velvet merah, champagne gold, glow lembut, bintang, heart particles, surat, gallery, video, dan soundtrack instrumental original.

## Buka halaman

1. Buka `index.html`.
2. Masukkan kode tanggal: `07102022`.
3. Tekan **Mulai cerita**.
4. Musik akan mulai saat masuk. Kalau browser menahan autoplay, cukup tekan tombol Music sekali.

## Media

- Foto-foto kenangan kita sudah dimasukkan ke galeri.
- Foto sudah disiapkan dalam frame portrait agar enak dilihat di HP.
- 2 video sudah dibuat versi silent/tanpa audio.
- Ada soundtrack instrumental original di `assets/music/our-story-original.mp3`.

## Kelola foto/video sendiri

Di halaman utama tekan tombol **✦** atau **Kelola foto**.

Kamu bisa:
- hapus foto/video;
- tambah foto dari HP/laptop;
- tambah video sendiri;
- geser urutan dengan drag & drop;
- pakai tombol ↑ / ↓ untuk memindahkan item satu per satu;
- tekan ✂ untuk crop, zoom, geser framing, pilih rasio, dan rotasi 90°;
- tekan ↔ pada dua foto untuk langsung menukar posisinya;
- reset kembali ke media awal.

Perubahan media tambahan disimpan di **browser/perangkat yang dipakai**, jadi tidak mengubah file asli di ZIP.

## Ganti lagu

Buka **✦ → Musik**, lalu pilih MP3/M4A/WAV milikmu. Lagu itu akan dipakai sebagai soundtrack di browser tersebut.

## Ganti nama & kata-kata

Edit `config.js`:
- `namaKamu`
- `namaDia`
- `kodeTanggal`
- `tanggalJadian`
- `pembuka`
- `bab`
- `alasan`
- `surat`
- `kejutan`

## Catatan

Website ini tidak membutuhkan instalasi framework. Cukup buka `index.html` di browser.
## Upgrade desain — Premium Anniversary

Versi ini menambahkan konsep cinematic memory experience: hero collage berbentuk polaroid, masonry gallery yang mempertahankan portrait/landscape, memory reel berjalan, random memory, favorit, collage generator, enhanced lightbox, countdown anniversary berikutnya, floating action dock, dan mode suasana champagne daylight.

### Kualitas foto
Asset web di `assets/foto/` dioptimalkan ulang dari folder `originals/foto/` menggunakan WebP kualitas tinggi dengan framing asli. Foto tidak dipaksa di-crop menjadi kotak yang sama.

### Catatan editor
Fitur kelola foto/video/musik + edit crop memakai penyimpanan lokal browser (IndexedDB + localStorage). Jadi tambah/hapus/urut ulang/edit langsung terasa di browser tanpa merusak file media asli di project.

## Update: Romantic Multi-Page Mode

Website sekarang memakai pola **multi-page feel / single-page app**. Menu `Story`, `Foto`, `Video`, dan `Message` berganti ke halaman/scene sendiri tanpa menggulir ke anchor lama. Setiap perpindahan kembali ke atas dan diberi transisi cinematic.

Nama utama: **Ramadhan Tri Atmojo × Ila Meydina**. Ada tambahan elemen lucu-romantis seperti status kecil pasangan, couple card, warning message, dan page transition.

`Message` sekarang menjadi ruang surat tersendiri, lengkap dengan amplop dan bagian penutup.

