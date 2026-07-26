// --- DAFTAR MATERI INTI ---
export const DAFTAR_MATERI_INTI = ["Eksponen", "Logaritma", "Trigonometri"];

// =====================================================================
// PRASYARAT TAB TRIGONOMETRI — GERBANG "KUNCI MATERI"
// =====================================================================
// Disusun MANUAL oleh guru. Boleh disunting tangan; test menjaga
// integritasnya (tests/utils/kurikulumEngine.test.js).
//
// Aturan:
//   - Kunci  = sub-materi tab Trigonometri, nama persis seperti di Firestore.
//   - Nilai  = daftar sub-materi yang wajib berstatus master lebih dulu.
//   - Materi yang tidak terdaftar di sini => selalu terbuka.
//   - Tab Prasyarat tidak pernah dikunci, tetapi materinya boleh menjadi
//     syarat di sini (mis. Teorema Pythagoras).
//
// Urutan tampil kartu TIDAK diambil dari tabel ini, melainkan dari urutan
// kunci PETA_TAHAPAN di bawah — itulah urutan mengajar di kelas.
//
// Angka "%" pada komentar = porsi soal materi itu yang menyebut konsep
// tersebut di field `konsep_prasyarat`. Bukti pemakaian, bukan urutan ajar;
// dipakai sebagai bahan pertimbangan saat menyusun, bukan sebagai aturan.
export const PRASYARAT_TRIGONOMETRI = {
  // ── Tahap 1: Pengenalan & Konsep Dasar ─────────────────────────────
  // Pintu masuk tab. Digerbangkan atas keputusan guru: 63% soalnya memakai
  // Teorema Pythagoras, jadi siswa yang belum menguasainya belum siap.
  // Konsekuensi yang disengaja: SELURUH tab Trigonometri terkunci sampai
  // Teorema Pythagoras master.
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
    "Persamaan Linear Satu Variabel", // 60%
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
export const PETA_TAHAPAN = {
  // --- PRASYARAT MATEMATIKA DASAR ---
  "operasi aritmatika dasar": "Tahap 1: Aritmatika",
  "kpk dan fpb": "Tahap 1: Aritmatika",
  "operasi pecahan": "Tahap 1: Aritmatika",
  "operasi bentuk akar": "Tahap 1: Aritmatika",

  "pengenalan variabel": "Tahap 2: Gerbang Logika & Sudut",
  "manipulasi aljabar dasar": "Tahap 2: Gerbang Logika & Sudut",
  "persamaan linear satu variabel": "Tahap 2: Gerbang Logika & Sudut",
  "pengenalan sudut dasar": "Tahap 2: Gerbang Logika & Sudut",
  "sifat sudut (berpelurus)": "Tahap 2: Gerbang Logika & Sudut",
  "sifat sudut (berseberangan)": "Tahap 2: Gerbang Logika & Sudut",

  "terminologi bangun geometri": "Tahap 3: Spasial & Pemodelan",
  "sifat bangun datar": "Tahap 3: Spasial & Pemodelan",
  "jumlah sudut segitiga": "Tahap 3: Spasial & Pemodelan",
  "teorema pythagoras": "Tahap 3: Spasial & Pemodelan",
  "visualisasi spasial dan arah": "Tahap 3: Spasial & Pemodelan",
  "pemodelan navigasi (jurusan tiga angka)": "Tahap 3: Spasial & Pemodelan",
  "lingkaran luar segitiga": "Tahap 3: Spasial & Pemodelan",

  "representasi aljabar": "Tahap 4: Sistem & Realita",
  "sistem persamaan linear": "Tahap 4: Sistem & Realita",
  "sistem persamaan linear tiga variabel (spltv)": "Tahap 4: Sistem & Realita",
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

  // --- MATERI TRIGONOMETRI ---
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
