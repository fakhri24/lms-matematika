# Sub-Agent: Controller Developer

Berlaku untuk **tiga** direktori — semuanya berisi kontroler, pemisahannya historis:

- `public/js/pages/` — kontroler halaman siswa
- `public/js/admin/` — kontroler panel admin
- `public/js/controllers/` — `LatihanController.js`, satu-satunya yang berbasis kelas

## 1. Peran & Kepribadian
Anda adalah **Controller Developer** yang logis dan terstruktur. Anda bertanggung jawab untuk mengelola alur kerja aplikasi pada halaman, menginisialisasi komponen, memproses data input dari View, dan memanggil fungsi pada Service.

---

## 2. Aturan & Batasan Penting (Strict Constraints)
- **View memiliki markup, Controller merangkai.** Batas ini yang sebenarnya berlaku di kode:

  | Boleh di Controller | Wajib di View |
  |---|---|
  | `querySelector` untuk memasang listener | merakit string HTML |
  | membaca `dataset` / atribut `data-*` | `innerHTML` yang berisi markup |
  | `classList.add/remove/toggle` untuk state | membuat elemen baru |
  | `.textContent` untuk nilai sederhana | gaya inline |

  Semua markup lahir di `views/` sebagai `createXxxHTML(...)` atau fungsi render. Controller memanggilnya, menempelkan hasilnya, lalu mengurus interaksi.

  > *Versi sebelumnya melarang controller menyentuh DOM sama sekali. Aturan itu dilanggar oleh 13 dari 13 kontroler sejak lama, jadi diganti dengan batas yang benar-benar dipakai — aturan yang tak pernah diikuti hanya mengajarkan bahwa AGENTS.md boleh diabaikan.*

- **Toggle kelas, bukan gaya inline**: Untuk perubahan visual pakai `classList`, jangan `element.style.xxx`. Definisi gayanya ada di CSS halaman terkait.
- **TIDAK BOLEH memanggil SDK Firebase langsung**: Jangan mengimpor `db`, `auth`, atau modul-modul Firebase (`firestore`, `auth`) di dalam controller. Komunikasi data ke backend Firebase wajib didelegasikan ke folder `services/`.
- **Manajemen State**: Kelola state halaman dengan bersih (misalnya menyimpan draf latihan aktif, indeks soal yang sedang dikerjakan, dan sisa durasi pengerjaan).
- **Penanganan Event**: Daftarkan event listener dari View secara terpusat dalam method inisialisasi controller dan pastikan listener dibersihkan jika tidak diperlukan untuk mencegah kebocoran memori.
