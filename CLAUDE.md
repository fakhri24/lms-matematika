# Panduan Proyek: Learning Management Siswa (LMS) - Matematika

> **Berkas ini adalah sumber kebenaran struktur & aturan proyek.** Ia dibaca otomatis di setiap sesi, jadi apa pun yang harus selalu diketahui sebelum menyentuh kode ditulis di sini — bukan di tempat lain.
>
> **Hierarki dokumen:**
>
> | Berkas | Peran | Kalau bertentangan |
> |---|---|---|
> | `CLAUDE.md` (ini) + `CLAUDE.md` per-folder | Struktur, batas antar lapisan, aturan yang mengikat | **Menang** |
> | `plan/PLAN.md` | Catatan rancangan satu fitur: keputusan, alasan, jalan buntu | Menyesuaikan diri |
>
> PLAN.md menjelaskan **mengapa** sesuatu diputuskan; CLAUDE.md menetapkan **apa** yang berlaku. Kalau sebuah aturan di PLAN.md ternyata mengikat lintas fitur, **naikkan ke sini** — jangan biarkan ia hanya hidup di PLAN.md, karena PLAN.md tidak dibaca otomatis.
>
> Setiap kali struktur folder, batas lapisan, atau aturan global berubah, **perbarui berkas ini di commit yang sama**.
>
> `AGENTS.md` di akar adalah **symlink** ke berkas ini, supaya agen selain Claude Code (yang mencari nama standar `AGENTS.md`) tetap menemukan panduan yang sama. Jangan menyuntingnya terpisah dan jangan mengubahnya jadi salinan — dua berkas dengan isi sama pasti akan menyimpang.

## 1. Peran Utama: Project Manager / Lead Architect (Root Agent)
Anda berada di tingkat Root proyek ini. Peran Anda adalah sebagai **Project Manager / Lead Architect**. Tanggung jawab Anda meliputi:
- Mengawasi keseluruhan integrasi sistem (MVC/Service) dan alur bisnis utama.
- Memastikan kepatuhan terhadap standar keamanan data (Firestore Security Rules) dan mitigasi bug lintas browser (seperti Safari IndexedDB crash).
- Mengarahkan sub-agent ke direktori yang sesuai dan memvalidasi kriteria keberhasilan sebelum menganggap pekerjaan selesai.

---

## 2. Bentuk Aplikasi

Vanilla ES module, **tanpa build step**. Firebase JS SDK 10.8.1 diimpor langsung dari CDN gstatic. Di-deploy ke Firebase Hosting, dan `firebase.json` **hanya menyajikan `public/`** — berkas di luar itu (`plan/`, `arsip-data/`, `grader-manual/`) tidak pernah ikut ter-deploy.

Satu halaman = satu berkas HTML di `public/` + satu kontroler. Tidak ada router.

| Lokasi | Isi | Panduan |
|---|---|---|
| `public/js/pages/` | Kontroler halaman siswa (6) — `pilihMateri`, `petaMateri`, `dashboardSiswa`, `riwayat`, `rekapHasil`, `koreksiUhSiswa` | [controllers/CLAUDE.md](public/js/controllers/CLAUDE.md) |
| `public/js/admin/` | Kontroler panel admin (7) — bank soal, analisis, ketuntasan, koreksi UH, latihan spesial, status | [controllers/CLAUDE.md](public/js/controllers/CLAUDE.md) |
| `public/js/controllers/` | `LatihanController.js` — mesin pengerjaan soal, satu-satunya kontroler berbasis kelas | [controllers/CLAUDE.md](public/js/controllers/CLAUDE.md) |
| `public/js/views/` | Pembangun markup + render DOM | [views/CLAUDE.md](public/js/views/CLAUDE.md) |
| `public/js/services/` | Kueri Firestore & autentikasi | [services/CLAUDE.md](public/js/services/CLAUDE.md) |
| `public/js/utils/` | Fungsi murni (kurikulum, soal, timer, teks) | [utils/CLAUDE.md](public/js/utils/CLAUDE.md) |
| `public/js/config/` | `firebase.js` — **satu-satunya** tempat SDK diinisialisasi | — |
| `public/js/*.js` | Entry point lepas: `app.js`, `auth.js`, `admin.js`, `leaderboard.js` | — |
| `tests/` | Jest (jsdom, `NODE_OPTIONS=--experimental-vm-modules`) | [tests/CLAUDE.md](tests/CLAUDE.md) |
| `plan/` | Catatan rancangan + skrip diagnostik. Tidak di-deploy. | [plan/PLAN.md](plan/PLAN.md) |
| `grader-manual/` | Koreksi UH manual & data siswa. Tidak di-deploy. | [grader-manual/CLAUDE.md](grader-manual/CLAUDE.md) |

> **Catatan penamaan:** `pages/` dan `admin/` berisi kontroler, sama seperti `controllers/`. Pemisahannya historis, bukan arsitektural — ketiganya tunduk pada panduan controller yang sama.

---

## 3. Alur Data Utama

**Identitas siswa** — `localStorage.nis_siswa`. Tidak ada sesi Firebase Auth per-siswa.

**Sumber kebenaran hasil** — koleksi `hasil_latihan` (ujian sumatif **dan** draf formatif), plus `progres_belajar` untuk log per-soal.

**Gerbang prasyarat** — sebuah materi Trigonometri hanya bisa dikerjakan sebagai *ujian* bila semua prasyaratnya sudah `master`. Prasyaratnya tabel manual (`PRASYARAT_TRIGONOMETRI`), urutan kartu dari `PETA_TAHAPAN`. Formatif **selalu terbuka**. Rinciannya di [plan/PLAN.md](plan/PLAN.md).

**Definisi "master" ada di SATU tempat** — `isHasilMasterSumatif()` di `utils/kurikulumEngine.js`. `gelarService` dan `ketuntasanController` mengimpornya. **Jangan pernah menyalin ulang aturannya**: sebelum 2026-07-26 aturan itu ditulis di tiga tempat dan ketiganya berselisih, sehingga panel guru menampilkan "Lulus" untuk siswa yang materinya justru terkunci.

**Penguncian adalah UX sisi-klien, bukan kontrol keamanan.** Siswa yang paham teknis bisa membuka `latihan.html` langsung. Itu dapat diterima karena skor tetap tercatat per-siswa; menegakkannya sungguhan butuh Cloud Function dan di luar cakupan hosting statis.

---

## 4. Aturan Lintas Peran (Global Rules)

- **DRY (Don't Repeat Yourself)**: Jangan menduplikasi logika. Logika data di Service, logika murni di Utils, visual di View. Kalau sebuah aturan bisnis ditulis di dua tempat, ia **akan** menyimpang — lihat kasus "master" di §3.
- **Batas View ↔ Controller**: **View memiliki markup, Controller merangkai.** View membangun HTML (`createXxxHTML`) atau merender elemen; Controller boleh `querySelector` untuk memasang listener, membaca `data-*`, dan menyalakan/mematikan kelas CSS untuk state. Yang **tidak boleh** di Controller: merakit string HTML, menulis `innerHTML` berisi markup, atau mengatur gaya inline. Semua markup lahir di `views/`.
- **View dilarang menyentuh data**: Tidak ada impor Firebase di `views/`. Sekarang 100% patuh — pertahankan.
- **Controller dilarang memanggil Firebase langsung**: Impor `db`/`auth` atau modul Firestore hanya boleh di `services/`. *(Pengecualian yang tersisa: `admin/latihanSpesialController.js` — utang teknis, jangan ditiru.)*
- **Pencegahan Bug Safari**: Gunakan `getFirestore` biasa tanpa IndexedDB persistence/cache offline untuk mencegah crash browser di iOS/macOS. Hindari juga pinch-zoom berbasis transform; pakai kontainer bergulir + toggle kelas CSS.
- **Keamanan Aturan Firestore**: Pastikan setiap kueri client-side mematuhi `firestore.rules`. Hanya ubah data yang dimiliki pengguna (`nis_siswa`).
- **Pengujian Sukses**: Kode baru atau perubahan logika wajib lolos Jest sebelum di-commit. Fungsi di `utils/` **wajib** punya unit test pendamping.
- **Ambang 10 Soal per Sub-Materi**: Setiap sub-materi wajib punya **minimal `MASTERY.SOAL_MIN` (10) soal** di bank soal sebelum boleh dipakai untuk ujian sumatif. Ambang ini bukan angka hiasan — `isHasilMasterSumatif()` mensyaratkan >= 10 soal dikerjakan, jadi sub-materi bersoal kurang dari itu **tidak akan pernah bisa di-master**: gelarnya tak pernah terbit, dan kalau ia jadi prasyarat, semua materi di hilirnya terkunci permanen. Konsekuensinya:
  - Menambah sub-materi ke `PRASYARAT_TRIGONOMETRI` tanpa 10 soal = mengunci mati satu cabang kurikulum. Jalankan `plan/diagnostik/gate-a-audit-kurikulum.mjs` sebelum menambah.
  - Idealnya ujian sumatif pada sub-materi di bawah ambang **ditolak di depan**. **Penjaga ini belum ada di kode** (per 2026-07-26) — jangan berasumsi sudah terpasang.
  - Data lama yang terlanjur di bawah ambang **sengaja dibiarkan** (keputusan pemilik proyek, 2026-07-26). Jangan menghapusnya tanpa permintaan eksplisit.
  - Mode formatif **tidak** terkena ambang ini. Formatif adalah latihan terbimbing yang memang boleh pendek, dan tidak pernah dihitung sebagai bukti penguasaan.
- **Jangan menghidupkan kembali topological sort.** Urutan materi adalah keputusan pedagogis milik guru, bukan sesuatu yang disimpulkan mesin. Kahn pernah dipakai lalu dibongkar; alasannya di [plan/PLAN.md](plan/PLAN.md) §7. Berlaku juga untuk sekadar tata letak.
