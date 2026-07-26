// --- DAFTAR MATERI INTI ---
export const DAFTAR_MATERI_INTI = [
  "Eksponen",
  "Logaritma",
  "Trigonometri",
  "Sistem Persamaan",
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
    "Persamaan Kuadrat Dasar", // 100%
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

// --- MATERI SISTEM PERSAMAAN (tab "Sistem Persamaan", Bab 3 prota) ---
// Dipindahkan dari tab Prasyarat 2026-07-26 (plan/PLAN.md §11). Nama
// PLSV/SPLDV distandarkan dengan akronim baku agar konsisten dengan SPLTV.
const TAHAPAN_SISTEM_PERSAMAAN = {
  "persamaan linear satu variabel (plsv)": "Tahap 1: Satu Variabel",
  "sistem persamaan linear dua variabel (spldv)": "Tahap 2: Dua Variabel",
  "sistem persamaan linear tiga variabel (spltv)": "Tahap 3: Tiga Variabel",
};

// --- PRASYARAT MATEMATIKA DASAR (SMP) — tab Prasyarat, TIDAK PERNAH dikunci ---
const TAHAPAN_PRASYARAT_SMP = {
  "operasi aritmatika dasar": "Tahap 1: Aritmatika",
  // Ditambahkan 2026-07-26 (bersama dua sub-materi lain di bawah) untuk
  // menutup tiga celah tersisa dari analisis Tes Diagnostik Numerasi Kelas X
  // — lihat plan/PLAN.md §10. Posisi tahap belum ditinjau guru.
  "sifat operasi bilangan": "Tahap 1: Aritmatika",
  "kpk dan fpb": "Tahap 1: Aritmatika",
  "operasi pecahan": "Tahap 1: Aritmatika",
  "operasi dan konversi desimal": "Tahap 1: Aritmatika",

  "pengenalan variabel": "Tahap 2: Gerbang Logika & Sudut",
  "manipulasi aljabar dasar": "Tahap 2: Gerbang Logika & Sudut",
  "substitusi fungsi linear": "Tahap 2: Gerbang Logika & Sudut",
  "pengenalan sudut dasar": "Tahap 2: Gerbang Logika & Sudut",
  "sifat sudut (berpelurus)": "Tahap 2: Gerbang Logika & Sudut",
  "sifat sudut (berseberangan)": "Tahap 2: Gerbang Logika & Sudut",

  "terminologi bangun geometri": "Tahap 3: Spasial & Pemodelan",
  "sifat bangun datar": "Tahap 3: Spasial & Pemodelan",
  "jumlah sudut segitiga": "Tahap 3: Spasial & Pemodelan",
  "visualisasi spasial dan arah": "Tahap 3: Spasial & Pemodelan",
  "pemodelan navigasi (jurusan tiga angka)": "Tahap 3: Spasial & Pemodelan",
  "lingkaran luar segitiga": "Tahap 3: Spasial & Pemodelan",

  "representasi aljabar": "Tahap 4: Sistem & Realita",
  "relasi dinamis (jarak, kecepatan, waktu)": "Tahap 4: Sistem & Realita",

  "persamaan kuadrat dasar": "Tahap 5: Area Kuadratik",
  "persamaan kuadrat lanjutan": "Tahap 5: Area Kuadratik",
  "fungsi kuadrat": "Tahap 5: Area Kuadratik",
  "pertidaksamaan kuadrat": "Tahap 5: Area Kuadratik",
  "sistem persamaan linear-kuadrat (splk)": "Tahap 5: Area Kuadratik",
  "sistem persamaan kuadrat-kuadrat (spkk)": "Tahap 5: Area Kuadratik",

  "analisis grafik fungsi": "Tahap 6: Fungsi & Transformasi Dasar",
  "translasi horizontal": "Tahap 6: Fungsi & Transformasi Dasar",
  "translasi vertikal": "Tahap 6: Fungsi & Transformasi Dasar",

  // Ditambahkan 2026-07-26 untuk menutup celah cakupan Bagian 6 (Numerasi
  // Terapan) pada Tes Diagnostik Numerasi Kelas X — lihat plan/PLAN.md §10.
  // Posisi "Tahap 7" bersifat sementara; belum ditinjau oleh guru, cukup
  // ubah string tahapnya di sini kalau urutan mengajar sebenarnya berbeda.
  "persentase": "Tahap 7: Numerasi Terapan",
  "perbandingan dan skala": "Tahap 7: Numerasi Terapan",
  "pembulatan dan estimasi": "Tahap 7: Numerasi Terapan",
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

// Dipakai test untuk memverifikasi tab Prasyarat (SMP) tidak pernah
// dikunci, terlepas dari tab materi utama lain yang boleh punya gerbang.
export const SUB_MATERI_PRASYARAT_SMP = Object.keys(TAHAPAN_PRASYARAT_SMP);

export const PETA_TAHAPAN = {
  ...TAHAPAN_EKSPONEN,
  ...TAHAPAN_SISTEM_PERSAMAAN,
  ...TAHAPAN_PRASYARAT_SMP,
  ...TAHAPAN_TRIGONOMETRI,
};
