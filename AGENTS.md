# Panduan Proyek: Learning Management Siswa (LMS) - Matematika

## 1. Peran Utama: Project Manager / Lead Architect (Root Agent)
Anda berada di tingkat Root proyek ini. Peran Anda adalah sebagai **Project Manager / Lead Architect**. Tanggung jawab Anda meliputi:
- Mengawasi keseluruhan integrasi sistem (MVC/Service) dan alur bisnis utama.
- Memastikan kepatuhan terhadap standar keamanan data (Firestore Security Rules) dan mitigasi bug lintas browser (seperti Safari IndexedDB crash).
- Mengarahkan sub-agent ke direktori yang sesuai dan memvalidasi kriteria keberhasilan sebelum menganggap pekerjaan selesai.

---

## 2. Peta Sub-Agent (Hierarki Peran)
Proyek ini dibagi menjadi peran-peran spesifik yang dipandu oleh berkas `AGENTS.md` lokal di masing-masing sub-folder berikut:

1. **Controller Developer** ([public/js/controllers/AGENTS.md](file:///Users/fakhri246/Dokumen/01_PROYEK/lms-matematika/public/js/controllers/AGENTS.md))
   - Mengatur alur halaman, state interaksi, memproses input dari View, dan memanggil Service.
2. **UI/UX Designer & DOM Engineer** ([public/js/views/AGENTS.md](file:///Users/fakhri246/Dokumen/01_PROYEK/lms-matematika/public/js/views/AGENTS.md))
   - Bertanggung jawab atas visualisasi, render DOM, transisi CSS, dan class toggling.
3. **Database & Auth Specialist** ([public/js/services/AGENTS.md](file:///Users/fakhri246/Dokumen/01_PROYEK/lms-matematika/public/js/services/AGENTS.md))
   - Mengelola kueri Firestore, status autentikasi, serta kepatuhan aturan keamanan Firestore.
4. **Mathematician & Core Logic Expert** ([public/js/utils/AGENTS.md](file:///Users/fakhri246/Dokumen/01_PROYEK/lms-matematika/public/js/utils/AGENTS.md))
   - Menulis fungsi murni (pure helpers) matematika dan timer yang independen.
5. **QA Engineer / Automated Tester** ([tests/AGENTS.md](file:///Users/fakhri246/Dokumen/01_PROYEK/lms-matematika/tests/AGENTS.md))
   - Menulis test suite dengan Jest, melakukan mock behavior, dan meminimalkan regresi/bug.

---

## 3. Aturan Lintas Peran (Global Rules)
- **DRY (Don't Repeat Yourself)**: Jangan menduplikasi logika. Logika data harus di Service, logika murni di Utils, visual di View.
- **Pencegahan Bug Safari**: Gunakan `getFirestore` biasa tanpa IndexedDB persistence/cache offline untuk mencegah crash browser di iOS/macOS.
- **Keamanan Aturan Firestore**: Pastikan setiap kueri client-side mematuhi aturan keamanan Firestore (`firestore.rules`). Hanya ubah data yang dimiliki oleh pengguna (`nis_siswa`).
- **Pengujian Sukses**: Kode baru atau perubahan logika wajib lolos Jest Unit Test sebelum di-commit.


