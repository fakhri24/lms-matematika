// public/js/utils/koreksiHelper.js

/**
 * Menormalisasi Topik Ujian agar aman digunakan sebagai ID dokumen Firestore dan nama file Storage
 */
export function normalisasiTopik(topik) {
  return (topik || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Mencari siswa yang cocok berdasarkan nama dari JSON dengan daftar profil siswa
 * @param {string} namaJson - Nama siswa dari JSON
 * @param {Array} profilSiswa - Daftar profil siswa di database
 * @returns {Object|null} - Profil siswa yang cocok, atau null
 */
export function cariKecocokanSiswa(namaJson, profilSiswa) {
  if (!namaJson || !Array.isArray(profilSiswa)) return null;

  const namaNormal = namaJson.trim().toLowerCase();
  
  // 1. Cari kecocokan persis (case-insensitive)
  const cocokPersis = profilSiswa.find((siswa) => {
    const namaSiswa = siswa.nama_lengkap || siswa.nama || "";
    return namaSiswa.trim().toLowerCase() === namaNormal;
  });
  if (cocokPersis) return cocokPersis;

  // 2. Cari berdasarkan kecocokan nama depan
  const namaDepan = namaNormal.split(" ")[0];
  if (namaDepan && namaDepan.length > 1) { // Minimal 2 karakter untuk nama depan agar tidak salah cocok
    const cocokSebagian = profilSiswa.find((siswa) => {
      const namaSiswa = siswa.nama_lengkap || siswa.nama || "";
      return namaSiswa.trim().toLowerCase().startsWith(namaDepan);
    });
    if (cocokSebagian) return cocokSebagian;
  }

  return null;
}

/**
 * Mengecek apakah nama berkas JSON dan PDF memiliki kesamaan akhiran (suffix) yang cocok
 * @param {string} jsonName - Nama berkas JSON (tanpa ekstensi)
 * @param {string} pdfName - Nama berkas PDF (tanpa ekstensi)
 */
export function apakahNamaFileCocok(jsonName, pdfName) {
  if (!jsonName || !pdfName) return false;
  
  // Normalisasi: kecilkan huruf dan buang semua simbol/spasi/ekstensi jika terbawa
  const cleanJson = jsonName.trim().toLowerCase().replace(/\.(json|pdf)$/i, "").replace(/[^a-z0-9]/g, "");
  const cleanPdf = pdfName.trim().toLowerCase().replace(/\.(json|pdf)$/i, "").replace(/[^a-z0-9]/g, "");
  
  // Kecocokan persis
  if (cleanJson === cleanPdf) return true;
  
  // Suffix matching: salah satu diakhiri oleh yang lain
  return cleanJson.endsWith(cleanPdf) || cleanPdf.endsWith(cleanJson);
}
