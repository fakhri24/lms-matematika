// --- DAFTAR MATERI INTI ---
export const DAFTAR_MATERI_INTI = ["Eksponen", "Logaritma", "Trigonometri"];

// =====================================================================
// PETA KURIKULUM MANUAL (LINEAR PROGRESSION)
// =====================================================================
export const PETA_PRASYARAT_MANUAL = {
  // --- PRASYARAT MATEMATIKA DASAR ---

  // Tahap 1: Aritmatika
  "KPK dan FPB": ["Operasi Aritmatika Dasar"],
  "Operasi Pecahan": ["KPK dan FPB"],
  "Operasi Bentuk Akar": ["Operasi Pecahan"],

  // Tahap 2: Gerbang Logika & Sudut
  "Pengenalan Variabel": ["Operasi Bentuk Akar"],
  "Manipulasi Aljabar Dasar": ["Pengenalan Variabel"],
  "Persamaan Linear Satu Variabel": ["Manipulasi Aljabar Dasar"],
  "Pengenalan Sudut Dasar": ["Persamaan Linear Satu Variabel"],
  "Sifat Sudut (Berpelurus)": ["Pengenalan Sudut Dasar"],
  "Sifat Sudut (Berseberangan)": ["Sifat Sudut (Berpelurus)"],

  // Tahap 3: Spasial & Pemodelan
  "Terminologi Bangun Geometri": ["Sifat Sudut (Berseberangan)"],
  "Sifat Bangun Datar": ["Terminologi Bangun Geometri"],
  "Jumlah Sudut Segitiga": ["Sifat Bangun Datar"],
  "Teorema Pythagoras": ["Jumlah Sudut Segitiga"],
  "Visualisasi Spasial dan Arah": ["Teorema Pythagoras"],
  "Pemodelan Navigasi (Jurusan Tiga Angka)": ["Visualisasi Spasial dan Arah"],
  "Lingkaran Luar Segitiga": ["Pemodelan Navigasi (Jurusan Tiga Angka)"],

  // Tahap 4: Sistem & Realita
  "Representasi Aljabar": ["Lingkaran Luar Segitiga"],
  "Sistem Persamaan Linear": ["Representasi Aljabar"],
  "Sistem Persamaan Linear Tiga Variabel (SPLTV)": ["Sistem Persamaan Linear"],
  "Relasi Dinamis (Jarak, Kecepatan, Waktu)": [
    "Sistem Persamaan Linear Tiga Variabel (SPLTV)",
  ],

  // Tahap 5: Area Kuadratik
  "Persamaan Kuadrat Dasar": ["Relasi Dinamis (Jarak, Kecepatan, Waktu)"],
  "Persamaan Kuadrat Lanjutan": ["Persamaan Kuadrat Dasar"],
  "Fungsi Kuadrat": ["Persamaan Kuadrat Lanjutan"],
  "Pertidaksamaan Kuadrat": ["Fungsi Kuadrat"],
  "Sistem Persamaan Linear-Kuadrat (SPLK)": ["Pertidaksamaan Kuadrat"],
  "Sistem Persamaan Kuadrat-Kuadrat (SPKK)": [
    "Sistem Persamaan Linear-Kuadrat (SPLK)",
  ],

  // Tahap 6: Fungsi & Transformasi Dasar (BARU)
  "Analisis Grafik Fungsi": ["Sistem Persamaan Kuadrat-Kuadrat (SPKK)"],
  "Translasi Horizontal": ["Analisis Grafik Fungsi"],
  "Translasi Vertikal": ["Translasi Horizontal"],

  // --- MATERI TRIGONOMETRI ---

  // Tahap 1: Pengenalan & Konsep Dasar
  "Nilai Sudut Istimewa": ["Rasio Trigonometri Dasar"],

  // Tahap 2: Ekspansi ke Sistem Koordinat
  "Aturan Kuadran": ["Nilai Sudut Istimewa"],
  "Sudut Berelasi (Horizontal)": ["Aturan Kuadran"],
  "Sudut Berelasi (Vertikal)": ["Sudut Berelasi (Horizontal)"],
  "Sifat Sudut Negatif": ["Sudut Berelasi (Vertikal)"],
  "Sudut Berelasi (Negatif dan >360°)": ["Sifat Sudut Negatif"],
  "Operasi Aljabar Relasi Sudut": ["Sudut Berelasi (Negatif dan >360°)"],

  // Tahap 3: Aplikasi & Geometri Sembarang
  "Aturan Sinus": ["Operasi Aljabar Relasi Sudut"],
  "Aturan Cosinus": ["Aturan Sinus"],
  "Luas Segitiga Trigonometri": ["Aturan Cosinus"],
  "Aplikasi Kontekstual Trigonometri": ["Luas Segitiga Trigonometri"],

  // Tahap 4: Analitik & Identitas Lanjutan
  "Identitas Trigonometri Dasar": ["Aplikasi Kontekstual Trigonometri"],
  "Jumlah dan Selisih Dua Sudut": ["Identitas Trigonometri Dasar"],
  "Sudut Ganda": ["Jumlah dan Selisih Dua Sudut"],
  "Trigonometri Analitik Lanjutan": ["Sudut Ganda"],

  // Tahap 5: Analisis Grafik & Fungsi Trigonometri (DIPISAH)
  "Konversi Derajat dan Radian": ["Trigonometri Analitik Lanjutan"],
  "Bentuk Umum Fungsi Trigonometri": ["Konversi Derajat dan Radian"],
  Amplitudo: ["Bentuk Umum Fungsi Trigonometri"],
  "Periode Fungsi Trigonometri": ["Amplitudo"],
  "Fungsi Trigonometri": ["Periode Fungsi Trigonometri"],

  // Tahap 6: Persamaan Trigonometri (DIPISAH)
  "Persamaan Trigonometri Dasar": ["Fungsi Trigonometri"],
  "Persamaan Trigonometri Standar": ["Persamaan Trigonometri Dasar"],
  "Persamaan Trigonometri Lanjutan": ["Persamaan Trigonometri Standar"],
  "Persamaan Trigonometri Bentuk Khusus": ["Persamaan Trigonometri Lanjutan"],
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
