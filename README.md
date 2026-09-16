# 🎓 Dataktif Learn — Modern Local Video Course & LMS Platform

**Dataktif Learn** adalah platform pembelajaran daring (*Learning Management System / LMS*) dan pemutar kursus video berbasis lokal dengan manajemen kurikulum pendidikan modern.

Aplikasi ini secara otomatis memindai (*scan*) direktori kursus video di penyimpanan lokal Anda, mengekstrak thumbnail dan durasi langsung dari file video menggunakan `ffmpeg`, menyusun struktur folder bertingkat menjadi kurikulum modul yang terorganisir, serta menyajikan pengalaman belajar interaktif lengkap dengan pelacakan progres, fitur *auto-advance* pelajaran, dan ringkasan kelulusan.

---

## ✨ Fitur Utama (Key Features)

### 1. 📂 Pemindai & Manajemen Kursus Lokal (Course Library Engine)
* **Pemetaan Struktur Modul Otomatis**: Folder utama otomatis dikenali sebagai 1 *Main Course*, dengan sub-folder di dalamnya sebagai modul/bab kurikulum yang saling terhubung tanpa terpecah.
* **Auto-Generated Video Thumbnail**: Thumbnail beresolusi tinggi diambil langsung dari frame video lokal menggunakan `ffmpeg` / `sharp` (dengan fallback kanvas otomatis).
* **HTTP 206 Partial Content Streaming**: Pemutaran video lokal dengan buffering instan dan scrubbing lancar tanpa membebani memori sistem.
* **Manajer Multi-Library**: Menambah, mengedit, atau menghapus beberapa lokasi direktori kursus sekaligus melalui UI pengaturan (*Pustaka Course*).

### 2. 🏠 Beranda & Dashboard Pembelajaran (Learning Hub)
* **Hero Banner Beranimasi Video**: Banner utama berlatar belakang video animasi looping yang dinamis dan berkelas, lengkap dengan kartu sambutan personal, deskripsi, dan tombol aksi cepat.
* **Dua Kartu Kursus Melayang (Floating Rotated Cards)**:
  * **Kartu Kiri**: Berada di layer atas banner (posisi tengah agak kanan atas) dengan rotasi artistik ke kiri, tombol aksi *"Mulai Belajar"* berwarna biru di atas gambar, dan judul materi yang bersih.
  * **Kartu Kanan**: Berotasi ke kanan dan menjorok keluar dari batas banner (*protruding outside*) dengan efek bayangan mendalam.
* **Ringkasan 4 Metrik Statistik Belajar**:
  * 📚 Kursus Aktif
  * ✅ Pelajaran yang Telah Diselesaikan
  * ⏱️ Total Akumulasi Jam Belajar
  * 🏆 Persentase Tingkat Kelulusan
* **Rak Lanjutkan Pembelajaran (Continue Learning)**: Menampilkan kursus yang sedang aktif ditonton lengkap dengan progress bar dan penunjuk pelajaran berikutnya.
* **Eksplorasi Kategori & Rak Masterclass**: Mengelompokkan materi ke dalam baris kursus unggulan (*Featured*) dan kursus terbaru (*New*).

### 3. 🎬 Halaman Katalog Kursus & Navigasi Fleksibel
* **Halaman Course Mandiri**: Menampilkan katalog video streaming lengkap dengan latar belakang video pemandangan alam berulang (*smooth fade-out/fade-in to white loop*).
* **Dropdown Kategori di Navbar**: Menu kategori yang ringkas dan elegan untuk memfilter katalog berdasarkan bidang keahlian tanpa memuat ulang halaman.
* **Pencarian Cerdas Interaktif**: Tombol `Cari` yang bertransisi mulus (*smooth card expansion*) menjadi bilah pencarian responsif lengkap dengan pintasan keyboard `Escape` dan tombol reset.
* **Floating Glassmorphism Navbar**: Navbar transparan di posisi paling atas yang otomatis berubah menjadi kartu melayang (*floating pill*) berefek kaca buram (*frosted glass*) saat halaman di-scroll ke bawah (> 50px).
* **Layering Dialog & Pop-up yang Rapi**: Seluruh jendela pop-up modal (detail materi, pengaturan direktori) diposisikan secara konsisten di atas layer navbar.

### 4. 🧑‍🏫 Classroom Player & Pengalaman Belajar
* **Pemutar Video Edukasi Terintegrasi**: Pemutar video dengan kontrol lengkap, pemulihan posisi tonton terakhir (*resume playback*), penanda selesai (*Mark Completed*), dan daftar putar kurikulum modul.
* **Pemutaran Otomatis (Auto-Advance Next Lesson)**: Saat video pelajaran selesai, sistem langsung melanjutkan ke pelajaran berikutnya secara otomatis tanpa kembali ke menu utama.
* **Halaman Apresiasi & Ringkasan Kelulusan (Course Completion)**: Menampilkan ringkasan pencapaian belajar dan kartu kelulusan begitu semua modul dalam kursus berhasil diselesaikan.

### 5. 🌐 Multi-Bahasa & Manajemen Profil Akun
* **Bilingual Support (Bahasa Indonesia & English US)**: Seluruh antarmuka aplikasi dapat dialihkan secara instan melalui menu Pengaturan Bahasa.
* **Profil Pengguna Personal**: Profil terintegrasi (default: **Farrel Berwyn**, Role: **Student**) dengan penyimpanan profil lokal yang reaktif.

---

## 🛠️ Arsitektur Teknologi (Tech Stack)

| Lapisan | Teknologi | Deskripsi |
| :--- | :--- | :--- |
| **Frontend** | **React 18 + TypeScript** | Komponen UI reaktif, modular, dan type-safe |
| **Styling** | **Tailwind CSS** | Utilitas styling modern, glassmorphism, dan animasi transisi |
| **Build Tool** | **Vite** | Pengembangan lokal kilat dengan Hot Module Replacement |
| **Icons** | **Lucide React** | Set ikon vektor modern dan konsisten |
| **Backend API** | **Node.js + Express** | Server lokal REST API & HTTP Range Video Streaming |
| **Media Processing** | **FFmpeg, FFprobe, Sharp** | Ekstraksi thumbnail, metadata durasi, dan pengoptimalan gambar |

---

## 📁 Struktur Folder Kursus yang Didukung

Dataktif Learn membaca folder kursus lokal Anda secara hierarkis:

```text
D:/MyCourses/
├── Claude Course ChatBot-MCP-Skills-Artifacts/
│   ├── 01 - Pengenalan & Setup/
│   │   ├── 01 Konsep Prompt Engineering.mp4
│   │   └── 02 Menghubungkan MCP Server.mp4
│   ├── 02 - Workflow & Artifacts/
│   │   ├── 01 Membuat Proyek Baru.mp4
│   │   └── 02 Integrasi API Eksternal.mp4
│   └── course.json (Opsional: kustom judul & kategori)
└── UI-UX Mastery/
    ├── 01 Fundamental Desain.mp4
    └── 02 Prototyping Figma.mp4
```

> **Catatan**: Jika dalam sebuah folder terdapat sub-folder, seluruhnya akan disatukan ke dalam **1 Main Course** dengan modul-modul kurikulum yang terstruktur rapi.

---

## 🚀 Panduan Memulai Cepat (Quick Start)

### 1. Prasyarat Sistem
* [Node.js](https://nodejs.org) (versi 18.0 atau lebih baru disarankan)
* [FFmpeg](https://ffmpeg.org) (opsional, untuk menghasilkan thumbnail otomatis beresolusi tinggi dari video lokal)

### 2. Instalasi Dependensi
Buka terminal pada direktori proyek, lalu jalankan:
```bash
npm install
```

### 3. Menjalankan Aplikasi
Jalankan server pengembangan Vite dan Express backend secara bersamaan:
```bash
npm run dev
```

Buka browser Anda dan akses:
👉 **`http://localhost:3000`**

### 4. Menghubungkan Folder Kursus Anda
1. Buka menu **Pustaka Course** di pojok kanan atas navbar.
2. Klik **Tambah Folder Baru**.
3. Masukkan jalur direktori lokal tempat Anda menyimpan video kursus (contoh: `D:\AI Course` atau `C:\Users\Nama\Videos\Tutorials`).
4. Berikan label kategori (misal: *Technology & Engineering*, *Business*, *Design*).
5. Klik **Simpan & Pindai**. Aplikasi akan langsung memindai seluruh folder dan menyusun kurikulum kursus Anda secara otomatis!

---

## 📜 Lisensi & Penggunaan
Dikembangkan khusus untuk pengalaman belajar mandiri yang nyaman, elegan, dan terstruktur dari koleksi video lokal Anda.
