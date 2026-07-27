// --- DAFTAR MATERI INTI ---
export const DAFTAR_MATERI_INTI = [
  "Eksponen",
  "Logaritma",
  "Trigonometri",
  "Sistem Persamaan",
  "Relasi dan Fungsi",
  "Persamaan Kuadrat",
  "Fungsi Kuadrat",
  "Pertidaksamaan",
  "Fungsi Rasional",
  "Kaidah Pencacahan & Peluang",
  "Nilai Mutlak",
];

// =====================================================================
// PETA PRASYARAT LINTAS TAB — GERBANG "KUNCI MATERI"
// =====================================================================
// Sampai 2026-07-26 tabel ini cuma berisi tab Trigonometri (nama lamanya
// PRASYARAT_TRIGONOMETRI). Sejak ekspansi kurikulum ke banyak tab baru
// (plan/PLAN.md §11), cakupannya digeneralisasi: SETIAP tab materi utama
// boleh punya gerbang di sini, bukan cuma Trigonometri.
//
// Disusun MANUAL oleh guru/penyusun kurikulum. Boleh disunting tangan; test
// menjaga integritasnya (tests/utils/kurikulumEngine.test.js).
//
// Aturan:
//   - Kunci  = sub-materi APA SAJA (di tab manapun), nama persis seperti di Firestore.
//   - Nilai  = daftar sub-materi yang wajib berstatus master lebih dulu.
//   - Materi yang tidak terdaftar di sini => selalu terbuka.
//   - Tab Prasyarat (SMP) tidak pernah dikunci, tetapi materinya boleh
//     menjadi syarat di sini (mis. Teorema Pythagoras dulu berperan begitu;
//     sekarang ia sendiri sudah pindah jadi sub-materi tab Trigonometri).
//
// Urutan tampil kartu TIDAK diambil dari tabel ini, melainkan dari urutan
// kunci PETA_TAHAPAN di bawah — itulah urutan mengajar di kelas. Untuk
// gerbang ANTAR-TAB (mis. "seluruh sub-materi Eksponen" jadi syarat tab
// Logaritma), urutan tab-tab baru di PETA_TAHAPAN harus mengikuti urutan
// ajar prota (field RENCANA[].urut di file prota, bukan nomor bab buku).
//
// Angka "%" pada komentar = porsi soal materi itu yang menyebut konsep
// tersebut di field `konsep_prasyarat`. Bukti pemakaian, bukan urutan ajar;
// dipakai sebagai bahan pertimbangan saat menyusun, bukan sebagai aturan.
// Sub-materi tab baru yang belum punya soal (jadi belum punya data
// konsep_prasyarat) memakai rantai sekuensial sederhana dulu — lihat §11.
export const PETA_PRASYARAT = {
  // ═══════════════════════════════════════════════════════════════════
  // TAB EKSPONEN — rantai sekuensial sederhana (2026-07-26, plan/PLAN.md
  // §11). Belum ada data konsep_prasyarat (soal baru ditulis), jadi tiap
  // sub-materi cuma butuh SATU pendahulu langsung — diperkaya jadi
  // jaringan bercabang nanti setelah polanya kelihatan dari data nyata.
  // ═══════════════════════════════════════════════════════════════════
  "Operasi Bentuk Akar": ["Sifat Eksponen Bilangan Bulat"],
  "Merasionalkan Penyebut": ["Operasi Bentuk Akar"],
  "Eksponen Rasional (Pangkat Pecahan)": ["Merasionalkan Penyebut"],
  "Fungsi Eksponen": ["Eksponen Rasional (Pangkat Pecahan)"],

  // ═══════════════════════════════════════════════════════════════════
  // TAB LOGARITMA — gerbang antar-tab + rantai sekuensial (2026-07-26,
  // plan/PLAN.md §11). Pintu masuk tab (Pengenalan Logaritma) digerbangkan
  // oleh SELURUH sub-materi Eksponen master (Bab 4 prasyarat ["bab1"] di
  // RENCANA prota) — bukan representasi sebagian, karena belum ada data
  // konsep_prasyarat untuk memilih mana yang paling relevan.
  // ═══════════════════════════════════════════════════════════════════
  "Pengenalan Logaritma": [
    "Sifat Eksponen Bilangan Bulat",
    "Operasi Bentuk Akar",
    "Merasionalkan Penyebut",
    "Eksponen Rasional (Pangkat Pecahan)",
    "Fungsi Eksponen",
  ],
  "Sifat Operasi Logaritma": ["Pengenalan Logaritma"],
  "Mengubah Basis Logaritma": ["Sifat Operasi Logaritma"],
  "Identitas Pangkat Logaritma": ["Mengubah Basis Logaritma"],
  "Persamaan Logaritma": ["Identitas Pangkat Logaritma"],
  "Fungsi Logaritma": ["Persamaan Logaritma"],

  // ═══════════════════════════════════════════════════════════════════
  // TAB RELASI DAN FUNGSI — rantai sekuensial (2026-07-26, plan/PLAN.md
  // §11). Bab 7 prasyarat [] di RENCANA prota, jadi TIDAK ada gerbang
  // antar-tab di pintu masuknya ("Substitusi Fungsi Linear") — tab ini
  // terbuka begitu siswa masuk, hanya sekuensial di dalamnya.
  //
  // "Analisis Grafik Fungsi" digerbang belakangan (bukan bersamaan dengan
  // sisanya) setelah "Fungsi Piecewise" dikonfirmasi live — sub-materi ini
  // sudah live duluan sejak §10, jadi gerbangnya sengaja ditahan agar tidak
  // mendadak terkunci di rentang push-vs-impor (pola sama seperti Fase 1).
  // ═══════════════════════════════════════════════════════════════════
  "Definisi Relasi dan Fungsi": ["Substitusi Fungsi Linear"],
  "Jenis-jenis Fungsi": ["Definisi Relasi dan Fungsi"],
  "Fungsi Piecewise": ["Jenis-jenis Fungsi"],
  "Analisis Grafik Fungsi": ["Fungsi Piecewise"],
  "Sifat-sifat Fungsi": ["Fungsi Piecewise"],
  "Operasi Aljabar Fungsi": ["Sifat-sifat Fungsi"],

  // ═══════════════════════════════════════════════════════════════════
  // TAB PERSAMAAN KUADRAT — rantai sekuensial (2026-07-26, plan/PLAN.md
  // §11). Bab 5 prasyarat [] di RENCANA prota, jadi TIDAK ada gerbang
  // antar-tab di pintu masuknya ("Akar Persamaan Kuadrat").
  // ═══════════════════════════════════════════════════════════════════
  "Diskriminan dan Jenis Akar": ["Akar Persamaan Kuadrat"],
  "Jumlah dan Hasil Kali Akar (Vieta)": ["Diskriminan dan Jenis Akar"],
  "Menyusun Persamaan Kuadrat Baru": ["Jumlah dan Hasil Kali Akar (Vieta)"],
  "Aplikasi Persamaan Kuadrat": ["Menyusun Persamaan Kuadrat Baru"],

  // ═══════════════════════════════════════════════════════════════════
  // TAB FUNGSI KUADRAT — gerbang antar-tab + rantai sekuensial
  // (2026-07-26, plan/PLAN.md §11). Pintu masuk tab ("Sifat dan Grafik
  // Fungsi Kuadrat") digerbangkan oleh SELURUH sub-materi Relasi dan
  // Fungsi + SELURUH sub-materi Persamaan Kuadrat master (Bab 9 prasyarat
  // ["bab7","bab5"] di RENCANA prota) — kedua tab itu sudah lengkap sejak
  // Fase 3 & 4, jadi gerbang ini langsung ditulis penuh, tidak ditunda.
  //
  // "Sifat dan Grafik Fungsi Kuadrat" adalah RENAME dari sub-materi lama
  // "Fungsi Kuadrat" (materi_utama dulu "Aljabar Lanjutan", tab Prasyarat)
  // -- isinya sudah cocok (sifat & grafik parabola), tidak diubah, cuma
  // nama & materi_utama yang pindah. Karena ia sudah PUNYA 10 soal live
  // dan SEBELUMNYA tidak pernah dikunci (tab Prasyarat), begitu kode ini
  // aktif dan data reimport (nama baru) sudah masuk, ia otomatis jadi
  // gerbang pertama tab ini -- konsekuensi yang disengaja dari promosi
  // "Fungsi Kuadrat" jadi tab materi utama sendiri.
  // ═══════════════════════════════════════════════════════════════════
  "Sifat dan Grafik Fungsi Kuadrat": [
    "Substitusi Fungsi Linear",
    "Definisi Relasi dan Fungsi",
    "Jenis-jenis Fungsi",
    "Fungsi Piecewise",
    "Analisis Grafik Fungsi",
    "Sifat-sifat Fungsi",
    "Operasi Aljabar Fungsi",
    "Akar Persamaan Kuadrat",
    "Diskriminan dan Jenis Akar",
    "Jumlah dan Hasil Kali Akar (Vieta)",
    "Menyusun Persamaan Kuadrat Baru",
    "Aplikasi Persamaan Kuadrat",
  ],
  "Menyusun Persamaan Parabola": ["Sifat dan Grafik Fungsi Kuadrat"],
  "Aplikasi Fungsi Kuadrat": ["Menyusun Persamaan Parabola"],

  // ═══════════════════════════════════════════════════════════════════
  // TAB PERTIDAKSAMAAN — gerbang antar-tab + rantai sekuensial
  // (2026-07-26, plan/PLAN.md §11). Pintu masuk tab ("Pertidaksamaan
  // Linear") digerbangkan oleh SELURUH sub-materi Eksponen (5) + Fungsi
  // Kuadrat (3) + Sistem Persamaan (3) master (Bab 6 prasyarat
  // ["bab1","bab9","bab3"] di RENCANA prota) — ketiga tab prasyaratnya
  // sudah lengkap sejak Fase 1, 5, dan 0, jadi gerbang ini langsung
  // ditulis penuh, tidak ditunda.
  //
  // "Pertidaksamaan Kuadrat" TIDAK di-rename (namanya sudah persis subbab
  // 6.2 buku) -- cuma direklasifikasi `materi_utama`-nya dari "Aljabar
  // Lanjutan" ke "Pertidaksamaan" (tab Prasyarat -> tab sendiri), isinya
  // tidak diubah. Sama seperti "Fungsi Kuadrat" di Fase 5, ia sudah 10
  // soal live dan sebelumnya tidak pernah dikunci.
  // ═══════════════════════════════════════════════════════════════════
  "Pertidaksamaan Linear": [
    "Sifat Eksponen Bilangan Bulat",
    "Operasi Bentuk Akar",
    "Merasionalkan Penyebut",
    "Eksponen Rasional (Pangkat Pecahan)",
    "Fungsi Eksponen",
    "Sifat dan Grafik Fungsi Kuadrat",
    "Menyusun Persamaan Parabola",
    "Aplikasi Fungsi Kuadrat",
    "Persamaan Linear Satu Variabel (PLSV)",
    "Sistem Persamaan Linear Dua Variabel (SPLDV)",
    "Sistem Persamaan Linear Tiga Variabel (SPLTV)",
  ],
  "Program Linear": ["Pertidaksamaan Linear"],
  "Pertidaksamaan Kuadrat": ["Program Linear"],
  "Pertidaksamaan Rasional": ["Pertidaksamaan Kuadrat"],
  "Pertidaksamaan Irasional": ["Pertidaksamaan Rasional"],
  "Aplikasi Pertidaksamaan": ["Pertidaksamaan Irasional"],

  // ═══════════════════════════════════════════════════════════════════
  // TAB FUNGSI RASIONAL — gerbang antar-tab + rantai sekuensial
  // (2026-07-26, plan/PLAN.md §11). Pintu masuk tab ("Pengertian Fungsi
  // Rasional") digerbangkan oleh SELURUH sub-materi Relasi dan Fungsi (7)
  // + Fungsi Kuadrat (3) + Pertidaksamaan (6) master (Bab 8 prasyarat
  // ["bab7","bab9","bab6"] di RENCANA prota) — ketiga tab prasyaratnya
  // sudah lengkap sejak Fase 3, 5, dan 6, jadi gerbang ini langsung
  // ditulis penuh, tidak ditunda. Semua 4 sub-materi di tab ini benar-
  // benar baru (tidak ada reklasifikasi), jadi tidak ada risiko regresi
  // live seperti Fase 5/6.
  // ═══════════════════════════════════════════════════════════════════
  "Pengertian Fungsi Rasional": [
    "Substitusi Fungsi Linear",
    "Definisi Relasi dan Fungsi",
    "Jenis-jenis Fungsi",
    "Fungsi Piecewise",
    "Analisis Grafik Fungsi",
    "Sifat-sifat Fungsi",
    "Operasi Aljabar Fungsi",
    "Sifat dan Grafik Fungsi Kuadrat",
    "Menyusun Persamaan Parabola",
    "Aplikasi Fungsi Kuadrat",
    "Pertidaksamaan Linear",
    "Program Linear",
    "Pertidaksamaan Kuadrat",
    "Pertidaksamaan Rasional",
    "Pertidaksamaan Irasional",
    "Aplikasi Pertidaksamaan",
  ],
  "Domain dan Range Fungsi Rasional": ["Pengertian Fungsi Rasional"],
  "Asimtot Fungsi Rasional": ["Domain dan Range Fungsi Rasional"],
  "Menggambar Grafik Fungsi Rasional": ["Asimtot Fungsi Rasional"],

  // ═══════════════════════════════════════════════════════════════════
  // TAB KAIDAH PENCACAHAN & PELUANG — rantai sekuensial, TANPA gerbang
  // antar-tab (2026-07-26/27, plan/PLAN.md §11). Bab 10 (Kaidah Pencacahan)
  // prasyarat [] di RENCANA prota, jadi pintu masuk tab ("Aturan Penjumlahan
  // dan Perkalian") tidak digerbang tab lain. Tidak ada tab lain yang
  // menjadikan tab ini prasyaratnya (dicek di seluruh field prasyarat
  // RENCANA) -- satu-satunya pengecualian adalah Nilai Mutlak (Fase 9)
  // yang butuh "semua" tab, kasus khusus tersendiri.
  //
  // "Ruang Sampel dan Peluang Kejadian Tunggal" (pintu masuk Bab 11
  // Peluang) digerbangkan oleh SELURUH sub-materi Kaidah Pencacahan master
  // (Bab 11 prasyarat ["bab10"]) -- pola sama seperti gerbang antar-bab di
  // tab lain, hanya saja di sini kedua bab digabung jadi satu tab UI.
  // ═══════════════════════════════════════════════════════════════════
  "Permutasi": ["Aturan Penjumlahan dan Perkalian"],
  "Kombinasi": ["Permutasi"],
  "Ruang Sampel dan Peluang Kejadian Tunggal": [
    "Aturan Penjumlahan dan Perkalian",
    "Permutasi",
    "Kombinasi",
  ],
  "Frekuensi Relatif dan Harapan": ["Ruang Sampel dan Peluang Kejadian Tunggal"],
  "Peluang Kejadian Majemuk": ["Frekuensi Relatif dan Harapan"],

  // ═══════════════════════════════════════════════════════════════════
  // TAB NILAI MUTLAK — sisipan penutup kurikulum, gerbang KHUSUS "semua"
  // (2026-07-27, plan/PLAN.md §11). Bab ini TIDAK ada di buku cetak
  // (RENCANA prota: sisipan handout ±15 halaman), dan prasyaratnya di
  // RENCANA bukan daftar bab tertentu melainkan literal ["semua"] --
  // dikerjakan paling akhir (Fase 9) karena mensyaratkan SELURUH sub-materi
  // SELURUH tab lain sudah master lebih dulu.
  //
  // Rantai internal sekuensial biasa (3 entri di bawah). Gerbang pintu
  // masuknya ("Definisi dan Sifat Nilai Mutlak") TIDAK ditulis di sini --
  // isinya butuh Object.keys() dari SEMUA konstanta TAHAPAN_*, yang baru
  // dideklarasikan di bawah (const, jadi mengaksesnya di sini kena TDZ
  // error). Ditambahkan lewat assignment terpisah setelah TAHAPAN_TRIGONOMETRI
  // dideklarasikan, tepat sebelum `export const PETA_TAHAPAN` -- lihat
  // komentar di sana.
  // ═══════════════════════════════════════════════════════════════════
  "Persamaan Nilai Mutlak": ["Definisi dan Sifat Nilai Mutlak"],
  "Pertidaksamaan Nilai Mutlak": ["Persamaan Nilai Mutlak"],
  "Grafik Fungsi Nilai Mutlak": ["Pertidaksamaan Nilai Mutlak"],

  // ── Tahap 1: Pengenalan & Konsep Dasar ─────────────────────────────
  // Pintu masuk tab. Digerbangkan atas keputusan guru: 63% soalnya memakai
  // Teorema Pythagoras, jadi siswa yang belum menguasainya belum siap.
  // Konsekuensi yang disengaja: SELURUH tab Trigonometri terkunci sampai
  // Teorema Pythagoras master.
  //
  // Teorema Pythagoras sendiri TIDAK didaftarkan sebagai kunci (target) di
  // sini — sesuai buku, ia subbab 2.2 (persis sebelum rasio sisi-sisi),
  // jadi sub-materi PERTAMA tab Trigonometri, bukan gerbang generik dari
  // luar. Ia tidak butuh prasyarat lagi (2026-07-26, plan/PLAN.md §11).
  "Rasio Trigonometri Dasar": [
    "Teorema Pythagoras", // 63%
  ],

  "Nilai Sudut Istimewa": [
    "Rasio Trigonometri Dasar",
    "Operasi Bentuk Akar", // 48% — isinya √2/2, √3/2, dst.
  ],

  // ── Tahap 2: Ekspansi ke Sistem Koordinat ──────────────────────────
  "Aturan Kuadran": [
    "Rasio Trigonometri Dasar",
    "Pengenalan Sudut Dasar", // 100%
  ],

  "Sudut Berelasi (Horizontal)": [
    "Aturan Kuadran", // 100%
    "Nilai Sudut Istimewa", // 75%
  ],

  "Sudut Berelasi (Vertikal)": [
    "Sudut Berelasi (Horizontal)", // urutan ajar
  ],

  "Sifat Sudut Negatif": [
    "Aturan Kuadran", // 90%
  ],

  "Sudut Berelasi (Negatif dan >360°)": [
    "Sifat Sudut Negatif", // 64%
    "Sudut Berelasi (Horizontal)", // 27%
  ],

  "Operasi Aljabar Relasi Sudut": [
    "Sudut Berelasi (Horizontal)", // 100%
    "Sudut Berelasi (Vertikal)", // 70%
  ],

  // ── Tahap 3: Aplikasi & Geometri Sembarang ─────────────────────────
  "Aturan Sinus": [
    "Nilai Sudut Istimewa", // 50%
    "Jumlah Sudut Segitiga", // 30%
  ],

  "Aturan Cosinus": [
    "Aturan Sinus", // urutan ajar
    "Manipulasi Aljabar Dasar", // 70%
  ],

  "Luas Segitiga Trigonometri": [
    "Aturan Cosinus", // urutan ajar
  ],

  "Aplikasi Kontekstual Trigonometri": [
    "Aturan Sinus", // 30%
    "Aturan Cosinus",
  ],

  // ── Tahap 4: Analitik & Identitas Lanjutan ─────────────────────────
  "Identitas Trigonometri Dasar": [
    "Rasio Trigonometri Dasar", // 50%
    "Teorema Pythagoras", // 60% — sin²+cos²=1 memang Pythagoras
  ],

  "Jumlah dan Selisih Dua Sudut": [
    "Identitas Trigonometri Dasar", // urutan ajar
    "Nilai Sudut Istimewa", // 70%
  ],

  "Sudut Ganda": [
    "Jumlah dan Selisih Dua Sudut", // urutan ajar
  ],

  "Trigonometri Analitik Lanjutan": [
    "Sudut Ganda", // urutan ajar
    "Manipulasi Aljabar Dasar", // 50%
  ],

  // ── Tahap 5: Analisis Grafik & Fungsi Trigonometri ─────────────────
  "Konversi Derajat dan Radian": [
    "Pengenalan Sudut Dasar",
    "Operasi Pecahan", // 100%
  ],

  "Bentuk Umum Fungsi Trigonometri": [
    "Nilai Sudut Istimewa", // 80%
    "Aturan Kuadran", // 40%
  ],

  "Amplitudo": [
    "Bentuk Umum Fungsi Trigonometri", // 100%
  ],

  "Periode Fungsi Trigonometri": [
    "Bentuk Umum Fungsi Trigonometri",
    "Konversi Derajat dan Radian", // 40%
  ],

  "Fungsi Trigonometri": [
    "Amplitudo", // 40%
    "Periode Fungsi Trigonometri", // 40%
    "Translasi Vertikal", // 50%
  ],

  // ── Tahap 6: Persamaan Trigonometri ────────────────────────────────
  "Persamaan Trigonometri Dasar": [
    "Nilai Sudut Istimewa", // 100%
    "Persamaan Linear Satu Variabel (PLSV)", // 60% — nama disamakan dgn tab Sistem Persamaan, lihat §11
  ],

  "Persamaan Trigonometri Standar": [
    "Persamaan Trigonometri Dasar", // 100%
    "Aturan Kuadran", // 50%
  ],

  "Persamaan Trigonometri Lanjutan": [
    "Persamaan Trigonometri Standar", // urutan ajar
    "Akar Persamaan Kuadrat", // 100% -- nama lama "Persamaan Kuadrat Dasar", diganti 2026-07-26 (Fase 4, plan/PLAN.md §11)
    "Identitas Trigonometri Dasar", // 50%
  ],

  "Persamaan Trigonometri Bentuk Khusus": [
    "Persamaan Trigonometri Lanjutan", // urutan ajar
  ],
};


// =====================================================================
// PETA TAHAPAN UNTUK UI (PEMBATAS VISUAL & LEVELING)
// =====================================================================
// Dipecah jadi blok per tab (bukan satu objek datar) sejak ekspansi
// multi-tab (2026-07-26, plan/PLAN.md §11), supaya batas "mana yang tab
// Prasyarat (SMP, tidak pernah dikunci) vs mana yang tab materi utama
// (boleh digerbang)" tidak perlu ditebak dari komentar atau posisi index —
// tes mengimpor SUB_MATERI_PRASYARAT_SMP di bawah untuk memverifikasinya.

// --- MATERI EKSPONEN (tab "Eksponen", Bab 1 prota) ---
// Fase 1 lengkap 2026-07-26 (plan/PLAN.md §11). Urutan mengikuti buku
// (1.1 -> 1.2 -> 1.3), plus "Fungsi Eksponen" sebagai sisipan penutup
// (bukan subbab resmi buku, tapi celah CP Fase E/SNBT yang eksplisit
// dicatat di ROADMAP file prota).
const TAHAPAN_EKSPONEN = {
  "sifat eksponen bilangan bulat": "Tahap 1: Bilangan Berpangkat Bulat",
  "operasi bentuk akar": "Tahap 2: Bentuk Akar",
  "merasionalkan penyebut": "Tahap 2: Bentuk Akar",
  "eksponen rasional (pangkat pecahan)": "Tahap 3: Bentuk Pangkat Rasional",
  "fungsi eksponen": "Tahap 4: Aplikasi Eksponen",
};

// --- MATERI LOGARITMA (tab "Logaritma", Bab 4 prota) ---
// Fase 2 lengkap 2026-07-26 (plan/PLAN.md §11). "Sifat Operasi Logaritma"
// menggabungkan subbab 4.2+4.3 buku (penjumlahan & pengurangan basis sama
// — satu sifat, dua arah). "Fungsi Logaritma" sisipan penutup, sama seperti
// "Fungsi Eksponen" — celah CP Fase E/SNBT yang dicatat di ROADMAP prota.
// HARUS tetap di bawah TAHAPAN_EKSPONEN: gerbangnya (lihat PETA_PRASYARAT)
// mensyaratkan seluruh sub-materi Eksponen master lebih dulu.
const TAHAPAN_LOGARITMA = {
  "pengenalan logaritma": "Tahap 1: Definisi Logaritma",
  "sifat operasi logaritma": "Tahap 2: Sifat Operasi",
  "mengubah basis logaritma": "Tahap 3: Mengubah Basis",
  "identitas pangkat logaritma": "Tahap 4: Identitas Pangkat",
  "persamaan logaritma": "Tahap 5: Persamaan Logaritma",
  "fungsi logaritma": "Tahap 6: Aplikasi Logaritma",
};

// --- MATERI SISTEM PERSAMAAN (tab "Sistem Persamaan", Bab 3 prota) ---
// Dipindahkan dari tab Prasyarat 2026-07-26 (plan/PLAN.md §11). Nama
// PLSV/SPLDV distandarkan dengan akronim baku agar konsisten dengan SPLTV.
const TAHAPAN_SISTEM_PERSAMAAN = {
  "persamaan linear satu variabel (plsv)": "Tahap 1: Satu Variabel",
  "sistem persamaan linear dua variabel (spldv)": "Tahap 2: Dua Variabel",
  "sistem persamaan linear tiga variabel (spltv)": "Tahap 3: Tiga Variabel",
};

// --- MATERI RELASI DAN FUNGSI (tab "Relasi dan Fungsi", Bab 7 prota) ---
// Fase 3 lengkap 2026-07-26 (plan/PLAN.md §11). "Substitusi Fungsi Linear"
// dipindah dari tab Prasyarat jadi pintu masuk tab ini (skill paling dasar
// sebelum definisi formal). "Analisis Grafik Fungsi" juga dipindah dari
// blok Prasyarat SMP -- sudah ada 10 soal live, gerbangnya (dari Fungsi
// Piecewise) SENGAJA BELUM ditambahkan di PETA_PRASYARAT sampai soal
// Fungsi Piecewise dikonfirmasi sudah diimpor, supaya ia tidak mendadak
// terkunci di rentang push-kode-vs-impor-data (pola sama seperti Fase 1).
const TAHAPAN_RELASI_FUNGSI = {
  "substitusi fungsi linear": "Tahap 1: Substitusi Fungsi",
  "definisi relasi dan fungsi": "Tahap 2: Definisi Relasi dan Fungsi",
  "jenis-jenis fungsi": "Tahap 3: Jenis-jenis Fungsi",
  "fungsi piecewise": "Tahap 4: Fungsi Piecewise",
  "analisis grafik fungsi": "Tahap 5: Analisis Grafik Fungsi",
  "sifat-sifat fungsi": "Tahap 6: Sifat-sifat Fungsi",
  "operasi aljabar fungsi": "Tahap 7: Operasi Aljabar Fungsi",
};

// --- MATERI PERSAMAAN KUADRAT (tab "Persamaan Kuadrat", Bab 5 prota) ---
// Fase 4 lengkap 2026-07-26 (plan/PLAN.md §11). "Akar Persamaan Kuadrat"
// adalah RENAME dari "Persamaan Kuadrat Dasar" (isinya sudah cocok, tidak
// diubah). "Diskriminan dan Jenis Akar" adalah RENAME + ROMBAK ISI dari
// "Persamaan Kuadrat Lanjutan" (10 soal lama itu campur diskriminan/Vieta/
// PK baru; ditulis ulang jadi murni diskriminan, id tetap sama). Vieta dan
// Menyusun PK Baru yang tadinya bercampur di situ sekarang jadi sub-materi
// baru sendiri. Keduanya (materi_utama dulu "Aljabar Lanjutan") masih
// menunggu impor -- lihat status di plan/PLAN.md §11.
const TAHAPAN_PERSAMAAN_KUADRAT = {
  "akar persamaan kuadrat": "Tahap 1: Mencari Akar",
  "diskriminan dan jenis akar": "Tahap 2: Diskriminan dan Jenis Akar",
  "jumlah dan hasil kali akar (vieta)": "Tahap 3: Jumlah dan Hasil Kali Akar",
  "menyusun persamaan kuadrat baru": "Tahap 4: Menyusun Persamaan Kuadrat Baru",
  "aplikasi persamaan kuadrat": "Tahap 5: Aplikasi Persamaan Kuadrat",
};

// --- MATERI FUNGSI KUADRAT (tab "Fungsi Kuadrat", Bab 9 prota) ---
// Fase 5 lengkap 2026-07-26 (plan/PLAN.md §11). "Sifat dan Grafik Fungsi
// Kuadrat" adalah RENAME dari "Fungsi Kuadrat" (dulu tab Prasyarat, materi_
// utama "Aljabar Lanjutan") -- lihat catatan panjang di PETA_PRASYARAT di
// atas. "Menyusun Persamaan Parabola" dan "Aplikasi Fungsi Kuadrat" (dari
// subbab buku 9.2 dan 9.3 "Penyelesaian Masalah", nama disesuaikan standar
// "Aplikasi X" biar konsisten dengan tab lain) adalah sub-materi baru.
const TAHAPAN_FUNGSI_KUADRAT = {
  "sifat dan grafik fungsi kuadrat": "Tahap 1: Sifat dan Grafik",
  "menyusun persamaan parabola": "Tahap 2: Menyusun Persamaan Parabola",
  "aplikasi fungsi kuadrat": "Tahap 3: Aplikasi Fungsi Kuadrat",
};

// --- MATERI PERTIDAKSAMAAN (tab "Pertidaksamaan", Bab 6 prota) ---
// Fase 6 lengkap 2026-07-26 (plan/PLAN.md §11). "Pertidaksamaan Linear"
// dan "Program Linear" DIPECAH dari subbab buku 6.1 (aslinya "Pertidaksamaan
// Linear — termasuk Program Linear") -- keduanya dinilai terpisah di prota
// (UH tulis vs proyek), jadi layak jadi sub-materi sendiri, bukan digabung.
// "Pertidaksamaan Kuadrat" reklasifikasi (lihat PETA_PRASYARAT). "Aplikasi
// Pertidaksamaan" dari subbab 6.5 "Penyelesaian Masalah", nama disesuaikan
// standar "Aplikasi X".
const TAHAPAN_PERTIDAKSAMAAN = {
  "pertidaksamaan linear": "Tahap 1: Pertidaksamaan Linear",
  "program linear": "Tahap 2: Program Linear",
  "pertidaksamaan kuadrat": "Tahap 3: Pertidaksamaan Kuadrat",
  "pertidaksamaan rasional": "Tahap 4: Pertidaksamaan Rasional",
  "pertidaksamaan irasional": "Tahap 5: Pertidaksamaan Irasional",
  "aplikasi pertidaksamaan": "Tahap 6: Aplikasi Pertidaksamaan",
};

// --- MATERI FUNGSI RASIONAL (tab "Fungsi Rasional", Bab 8 prota) ---
// Fase 7 lengkap 2026-07-26 (plan/PLAN.md §11). Buku memecah bab ini jadi
// 6 subbab beralfabet (A. Pengertian, B. Mengidentifikasi, C. Domain,
// D. Range, E. Asimtot, F. Menggambar) untuk cuma 8 JP total -- terlalu
// halus untuk jadi 6 sub-materi terpisah, jadi DIGABUNG jadi 4: A+B jadi
// "Pengertian" (definisi + identifikasi, termasuk pengantar konsep lubang),
// C+D jadi "Domain dan Range" (dua sisi dari batasan nilai yang sama),
// E dan F tetap sendiri (masing-masing substansial). Bab ini di luar CP
// Fase E resmi (dicatat ROADMAP prota) dan dinilai lewat proyek, bukan UH
// tulis -- konsisten dengan tidak adanya sub-materi "Aplikasi" terpisah;
// "Menggambar Grafik" sudah menjadi sintesis akhirnya.
const TAHAPAN_FUNGSI_RASIONAL = {
  "pengertian fungsi rasional": "Tahap 1: Pengertian Fungsi Rasional",
  "domain dan range fungsi rasional": "Tahap 2: Domain dan Range",
  "asimtot fungsi rasional": "Tahap 3: Asimtot",
  "menggambar grafik fungsi rasional": "Tahap 4: Menggambar Grafik",
};

// --- MATERI KAIDAH PENCACAHAN & PELUANG (tab gabungan, Bab 10+11 prota) ---
// Fase 8 lengkap 2026-07-27 (plan/PLAN.md §11). Satu tab UI menggabungkan
// dua bab buku (Bab 10 Kaidah Pencacahan, Bab 11 Peluang) karena Bab 11
// digerbang penuh oleh Bab 10 (prasyarat ["bab10"]) -- pola sama seperti
// Peluang di RENCANA prota, cukup jadi Tahap 4-6 lanjutan tab yang sama,
// bukan tab terpisah. Nama sub-materi mengikuti subbab buku (10.1-10.3,
// 11.1-11.3), "Ruang Sampel, Peluang Kejadian Tunggal dan Komplemennya"
// dipendekkan jadi "Ruang Sampel dan Peluang Kejadian Tunggal" agar
// konsisten dengan gaya penamaan tab lain.
const TAHAPAN_KAIDAH_PENCACAHAN_PELUANG = {
  "aturan penjumlahan dan perkalian": "Tahap 1: Aturan Pencacahan",
  "permutasi": "Tahap 2: Permutasi",
  "kombinasi": "Tahap 3: Kombinasi",
  "ruang sampel dan peluang kejadian tunggal":
    "Tahap 4: Ruang Sampel dan Peluang Tunggal",
  "frekuensi relatif dan harapan": "Tahap 5: Frekuensi Relatif dan Harapan",
  "peluang kejadian majemuk": "Tahap 6: Peluang Kejadian Majemuk",
};

// --- PRASYARAT MATEMATIKA DASAR (SMP) — tab Prasyarat, TIDAK PERNAH dikunci ---
// Urutan tahap dirombak 2026-07-27 (plan/PLAN.md §10) mengikuti urutan Bagian
// Tes Diagnostik Numerasi Kelas X (Bilangan Bulat -> Faktorisasi -> Non-Bulat
// -> Aljabar -> Numerasi Terapan; Bagian 5-nya, PLSV/SPLDV, dilewati di sini
// karena sudah pindah ke tab "Sistem Persamaan" sejak 2026-07-26), supaya
// hasil tes bisa dipetakan 1:1 ke tahap remediasi. Sub-materi yang TIDAK
// diuji tes ini (sudut/geometri, sistem & realita, area kuadratik, fungsi &
// transformasi) ditaruh setelahnya, diurutkan dari yang paling dasar ke
// paling lanjut -- bukan hasil topological sort, keputusan pedagogis manual,
// belum ditinjau guru.
const TAHAPAN_PRASYARAT_SMP = {
  "operasi aritmatika dasar": "Tahap 1: Aritmatika",
  "sifat operasi bilangan": "Tahap 1: Aritmatika",
  "kpk dan fpb": "Tahap 1: Aritmatika",
  "operasi pecahan": "Tahap 1: Aritmatika",
  "operasi dan konversi desimal": "Tahap 1: Aritmatika",

  "pengenalan variabel": "Tahap 2: Aljabar Dasar",
  "manipulasi aljabar dasar": "Tahap 2: Aljabar Dasar",

  "persentase": "Tahap 3: Numerasi Terapan",
  "perbandingan dan skala": "Tahap 3: Numerasi Terapan",
  "pembulatan dan estimasi": "Tahap 3: Numerasi Terapan",

  "pengenalan sudut dasar": "Tahap 4: Sudut & Spasial",
  "sifat sudut (berpelurus)": "Tahap 4: Sudut & Spasial",
  "sifat sudut (berseberangan)": "Tahap 4: Sudut & Spasial",
  "terminologi bangun geometri": "Tahap 4: Sudut & Spasial",
  "sifat bangun datar": "Tahap 4: Sudut & Spasial",
  "jumlah sudut segitiga": "Tahap 4: Sudut & Spasial",
  "visualisasi spasial dan arah": "Tahap 4: Sudut & Spasial",
  "pemodelan navigasi (jurusan tiga angka)": "Tahap 4: Sudut & Spasial",
  "lingkaran luar segitiga": "Tahap 4: Sudut & Spasial",

  "representasi aljabar": "Tahap 5: Sistem & Realita",
  "relasi dinamis (jarak, kecepatan, waktu)": "Tahap 5: Sistem & Realita",

  "sistem persamaan linear-kuadrat (splk)": "Tahap 6: Area Kuadratik",
  "sistem persamaan kuadrat-kuadrat (spkk)": "Tahap 6: Area Kuadratik",

  "translasi horizontal": "Tahap 7: Fungsi & Transformasi Dasar",
  "translasi vertikal": "Tahap 7: Fungsi & Transformasi Dasar",
};

// --- MATERI TRIGONOMETRI ---
// Teorema Pythagoras dipindah ke sini 2026-07-26 (plan/PLAN.md §11) —
// persis subbab 2.2 di buku, sebelum rasio sisi-sisi (2.3). Posisinya
// HARUS tetap sebelum "rasio trigonometri dasar" karena ia gerbangnya
// (lihat PETA_PRASYARAT di atas) — jangan dipindah ke bawah.
const TAHAPAN_TRIGONOMETRI = {
  "teorema pythagoras": "Tahap 1: Pengenalan & Konsep Dasar",
  "rasio trigonometri dasar": "Tahap 1: Pengenalan & Konsep Dasar",
  "nilai sudut istimewa": "Tahap 1: Pengenalan & Konsep Dasar",

  "aturan kuadran": "Tahap 2: Ekspansi ke Sistem Koordinat",
  "sudut berelasi (horizontal)": "Tahap 2: Ekspansi ke Sistem Koordinat",
  "sudut berelasi (vertikal)": "Tahap 2: Ekspansi ke Sistem Koordinat",
  "sifat sudut negatif": "Tahap 2: Ekspansi ke Sistem Koordinat",
  "sudut berelasi (negatif dan >360°)": "Tahap 2: Ekspansi ke Sistem Koordinat",
  "operasi aljabar relasi sudut": "Tahap 2: Ekspansi ke Sistem Koordinat",

  "aturan sinus": "Tahap 3: Aplikasi & Geometri Sembarang",
  "aturan cosinus": "Tahap 3: Aplikasi & Geometri Sembarang",
  "luas segitiga trigonometri": "Tahap 3: Aplikasi & Geometri Sembarang",
  "aplikasi kontekstual trigonometri": "Tahap 3: Aplikasi & Geometri Sembarang",

  "identitas trigonometri dasar": "Tahap 4: Analitik & Identitas Lanjutan",
  "jumlah dan selisih dua sudut": "Tahap 4: Analitik & Identitas Lanjutan",
  "sudut ganda": "Tahap 4: Analitik & Identitas Lanjutan",
  "trigonometri analitik lanjutan": "Tahap 4: Analitik & Identitas Lanjutan",

  "konversi derajat dan radian":
    "Tahap 5: Analisis Grafik & Fungsi Trigonometri",
  "bentuk umum fungsi trigonometri":
    "Tahap 5: Analisis Grafik & Fungsi Trigonometri",
  amplitudo: "Tahap 5: Analisis Grafik & Fungsi Trigonometri",
  "periode fungsi trigonometri":
    "Tahap 5: Analisis Grafik & Fungsi Trigonometri",
  "fungsi trigonometri": "Tahap 5: Analisis Grafik & Fungsi Trigonometri",

  "persamaan trigonometri dasar": "Tahap 6: Persamaan Trigonometri",
  "persamaan trigonometri standar": "Tahap 6: Persamaan Trigonometri",
  "persamaan trigonometri lanjutan": "Tahap 6: Persamaan Trigonometri",
  "persamaan trigonometri bentuk khusus": "Tahap 6: Persamaan Trigonometri",
};

// --- MATERI NILAI MUTLAK (tab "Nilai Mutlak", sisipan penutup prota) ---
// Fase 9 lengkap 2026-07-27 (plan/PLAN.md §11). Sisipan handout, bukan bab
// buku -- judul subbab diambil dari RENCANA prota apa adanya, cuma "Definisi
// dan sifat" diperjelas jadi "Definisi dan Sifat Nilai Mutlak" (aslinya
// terlalu generik dibanding tiga sub-materi lain yang sudah menyebut
// "nilai mutlak" di judulnya sendiri).
const TAHAPAN_NILAI_MUTLAK = {
  "definisi dan sifat nilai mutlak": "Tahap 1: Definisi dan Sifat",
  "persamaan nilai mutlak": "Tahap 2: Persamaan Nilai Mutlak",
  "pertidaksamaan nilai mutlak": "Tahap 3: Pertidaksamaan Nilai Mutlak",
  "grafik fungsi nilai mutlak": "Tahap 4: Grafik Fungsi Nilai Mutlak",
};

// Dipakai test untuk memverifikasi tab Prasyarat (SMP) tidak pernah
// dikunci, terlepas dari tab materi utama lain yang boleh punya gerbang.
export const SUB_MATERI_PRASYARAT_SMP = Object.keys(TAHAPAN_PRASYARAT_SMP);

export const PETA_TAHAPAN = {
  ...TAHAPAN_EKSPONEN,
  ...TAHAPAN_LOGARITMA,
  ...TAHAPAN_RELASI_FUNGSI,
  ...TAHAPAN_PERSAMAAN_KUADRAT,
  ...TAHAPAN_FUNGSI_KUADRAT,
  ...TAHAPAN_SISTEM_PERSAMAAN,
  ...TAHAPAN_PERTIDAKSAMAAN,
  ...TAHAPAN_FUNGSI_RASIONAL,
  ...TAHAPAN_KAIDAH_PENCACAHAN_PELUANG,
  ...TAHAPAN_PRASYARAT_SMP,
  ...TAHAPAN_TRIGONOMETRI,
  ...TAHAPAN_NILAI_MUTLAK,
};

// =====================================================================
// KEANGGOTAAN TAB — untuk melipat tab yang tuntas jadi satu simpul di peta
// =====================================================================
// Dipakai oleh `kolapsTabTuntas()` (utils/tataLetakPeta.js) untuk tahu sub-
// materi mana saja milik tab yang sama, supaya begitu SEMUANYA master, peta
// materi bisa melipatnya jadi satu simpul "persimpangan" alih-alih menggambar
// tiap anggotanya satu per satu (plan/PLAN.md §12). Presentasi murni — tidak
// mengubah PETA_PRASYARAT ataupun gerbangnya.
//
// Sengaja tidak memasukkan TAHAPAN_PRASYARAT_SMP: tab Prasyarat bukan target
// gerbang siapa pun (§11), jadi tidak ada gunanya dilipat.
export const PETA_TAB_SUB_MATERI = {
  Eksponen: Object.keys(TAHAPAN_EKSPONEN),
  Logaritma: Object.keys(TAHAPAN_LOGARITMA),
  "Relasi dan Fungsi": Object.keys(TAHAPAN_RELASI_FUNGSI),
  "Persamaan Kuadrat": Object.keys(TAHAPAN_PERSAMAAN_KUADRAT),
  "Fungsi Kuadrat": Object.keys(TAHAPAN_FUNGSI_KUADRAT),
  "Sistem Persamaan": Object.keys(TAHAPAN_SISTEM_PERSAMAAN),
  Pertidaksamaan: Object.keys(TAHAPAN_PERTIDAKSAMAAN),
  "Fungsi Rasional": Object.keys(TAHAPAN_FUNGSI_RASIONAL),
  "Kaidah Pencacahan & Peluang": Object.keys(
    TAHAPAN_KAIDAH_PENCACAHAN_PELUANG,
  ),
  Trigonometri: Object.keys(TAHAPAN_TRIGONOMETRI),
  "Nilai Mutlak": Object.keys(TAHAPAN_NILAI_MUTLAK),
};

// =====================================================================
// GERBANG KHUSUS "SEMUA" — pintu masuk tab Nilai Mutlak (Fase 9)
// =====================================================================
// "Definisi dan Sifat Nilai Mutlak" digerbangkan oleh SELURUH sub-materi
// SELURUH tab lain (RENCANA prota mencantumkan prasyaratnya literal
// ["semua"]) -- TIDAK termasuk tab Prasyarat SMP, karena tab itu memang
// tidak pernah jadi target gerbang siapa pun (alasan sama seperti
// PETA_TAB_SUB_MATERI di atas mengecualikannya).
//
// Ditulis lewat assignment di SINI (paling akhir modul), bukan sebagai
// entri literal di tabel PETA_PRASYARAT di atas, karena dua alasan:
//   1. Daftarnya perlu SELURUH isi PETA_TAB_SUB_MATERI, yang baru selesai
//      dideklarasikan tepat di atas -- menuliskan ~70 nama sub-materi satu
//      per satu dengan tangan terlalu rawan salah ketik atau lupa sinkron
//      kalau kurikulum berubah.
//   2. Ejaannya harus Title Case (sama seperti seluruh entri PETA_PRASYARAT
//      lain) supaya panel "Kuasai dulu: ..." di peta-materi.html tetap
//      terbaca -- BUKAN kunci ternormalisasi huruf kecil dari
//      PETA_TAB_SUB_MATERI. `labelAsli()` menelusuri PETA_PRASYARAT yang
//      sudah lengkap terisi (tabel literal di atas) untuk kemunculan Title
//      Case ASLI tiap nama, memakai aturan prioritas yang sama seperti
//      `kumpulkanLabel()` di tataLetakPeta.js (kunci target menang, lalu
//      kemunculan pertama sebagai nilai menang atas sisanya).
function labelAsli(petaPrasyarat) {
  const label = new Map();
  Object.entries(petaPrasyarat).forEach(([target, daftar]) => {
    (daftar || []).forEach((p) => {
      const kunci = String(p).toLowerCase().trim();
      if (kunci && !label.has(kunci)) label.set(kunci, p);
    });
  });
  Object.keys(petaPrasyarat).forEach((target) => {
    label.set(String(target).toLowerCase().trim(), target);
  });
  return label;
}

const LABEL_SEBELUM_NILAI_MUTLAK = labelAsli(PETA_PRASYARAT);
PETA_PRASYARAT["Definisi dan Sifat Nilai Mutlak"] = Object.entries(
  PETA_TAB_SUB_MATERI,
)
  .filter(([tab]) => tab !== "Nilai Mutlak")
  .flatMap(([, anggota]) => anggota)
  .map((nama) => LABEL_SEBELUM_NILAI_MUTLAK.get(nama) || nama);
