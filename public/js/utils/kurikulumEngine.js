// public/js/utils/kurikulumEngine.js
//
// Fungsi murni untuk gerbang prasyarat ("kunci materi").
// Tanpa DOM, tanpa Firestore — semuanya dapat diuji dengan Jest.
// Rujukan rancangan: plan/PLAN.md

import { MODE_LATIHAN, MASTERY, STATUS_LATIHAN } from "./constants.js";

/** Normalisasi nama sub-materi agar perbandingan konsisten. */
export function normalisasiNama(nama) {
  return String(nama ?? "")
    .toLowerCase()
    .trim();
}

/** Mode yang dihitung sebagai ujian sumatif (termasuk penamaan lama di database). */
const MODE_UJIAN = new Set([
  MODE_LATIHAN.NORMAL,
  MODE_LATIHAN.ACAK,
  MODE_LATIHAN.LAMA_NORMAL,
  MODE_LATIHAN.LAMA_ACAK,
]);

/**
 * Apakah mode latihan tertentu ikut dikunci oleh gerbang prasyarat?
 * Formatif selalu terbuka agar siswa tak pernah terhalang untuk belajar.
 */
export function apakahModeDikunci(modeLatihan) {
  return MODE_UJIAN.has(modeLatihan);
}

/** Menghitung berapa soal yang benar-benar dikerjakan pada satu record hasil. */
function jumlahSoalDikerjakan(hasil) {
  if (hasil?.detail_jawaban) return Object.keys(hasil.detail_jawaban).length;
  if (hasil?.log_percobaan) return Object.keys(hasil.log_percobaan).length;
  return 0;
}

/**
 * Apakah SATU rekaman hasil membuktikan penguasaan?
 * Syarat: ujian sumatif selesai, nilai >= NILAI_MIN, dan >= SOAL_MIN soal dikerjakan.
 *
 * Inilah **satu-satunya** tempat aturan itu ditulis. Sebelumnya aturan yang sama
 * disalin di tiga tempat dan ketiganya sempat berselisih — panel Ketuntasan
 * admin melewatkan syarat SOAL_MIN, sehingga menampilkan "Lulus" untuk latihan
 * yang tidak menerbitkan gelar dan tidak membuka gerbang prasyarat.
 */
export function isHasilMasterSumatif(hasil, ambang = MASTERY) {
  if (!hasil) return false;
  if (!apakahModeDikunci(hasil.mode_latihan || MODE_LATIHAN.NORMAL))
    return false;
  if (hasil.status === STATUS_LATIHAN.DRAF) return false;
  if (!(Number(hasil.nilai) >= ambang.NILAI_MIN)) return false;
  return jumlahSoalDikerjakan(hasil) >= ambang.SOAL_MIN;
}

/**
 * Apakah kumpulan riwayat ini membuktikan satu sub-materi sudah "master"?
 * Cukup satu rekaman yang memenuhi syarat.
 */
export function isSubMateriMaster(riwayatSubMateri, ambang = MASTERY) {
  if (!Array.isArray(riwayatSubMateri)) return false;
  return riwayatSubMateri.some((hasil) => isHasilMasterSumatif(hasil, ambang));
}

/**
 * Mengubah seluruh riwayat latihan seorang siswa menjadi himpunan sub-materi
 * (ternormalisasi) yang sudah berstatus master.
 */
export function hitungSetMaster(riwayatLatihan, ambang = MASTERY) {
  const setMaster = new Set();
  if (!Array.isArray(riwayatLatihan)) return setMaster;

  const perSubMateri = new Map();
  riwayatLatihan.forEach((hasil) => {
    if (!hasil?.sub_materi) return;
    const kunci = normalisasiNama(hasil.sub_materi);
    if (!perSubMateri.has(kunci)) perSubMateri.set(kunci, []);
    perSubMateri.get(kunci).push(hasil);
  });

  perSubMateri.forEach((daftar, subMateri) => {
    if (isSubMateriMaster(daftar, ambang)) setMaster.add(subMateri);
  });

  return setMaster;
}


/**
 * Inti fitur: menentukan status terkunci setiap sub-materi.
 *
 * Sebuah sub-materi terkunci jika ada prasyarat langsungnya yang belum master.
 * Transitivitas tercapai sendiri: prasyarat yang terkunci pasti belum master,
 * sehingga materi di belakangnya ikut tertahan.
 *
 * Materi yang tidak terdaftar di peta tidak muncul di hasil — artinya terbuka.
 *
 * Pengecualian: sub-materi yang SUDAH master tidak pernah terkunci. Gerbang ini
 * memakai prasyarat untuk menduga kesiapan siswa, sedangkan nilai sumatif >=80
 * atas materi itu sendiri adalah bukti kesiapan yang langsung. Bukti langsung
 * mengalahkan dugaan; tanpa ini siswa yang menguasai materi lewat urutan lain
 * (atau di bawah kurikulum lama) justru terhalang mengulang materinya sendiri.
 *
 * @returns {Object} peta { subMateriTernormalisasi: { locked, prereqBelum } }
 */
export function hitungStatusKunci(petaPrasyarat, setMaster) {
  const master =
    setMaster instanceof Set ? setMaster : new Set(setMaster || []);

  const status = {};
  Object.entries(petaPrasyarat || {}).forEach(([target, daftarPrasyarat]) => {
    const kunci = normalisasiNama(target);
    if (!kunci) return;

    // Nama prasyarat dibiarkan apa adanya supaya bisa ditampilkan ke siswa.
    const prereqBelum = (daftarPrasyarat || []).filter((prasyarat) => {
      const p = normalisasiNama(prasyarat);
      return p && p !== kunci && !master.has(p);
    });

    status[kunci] = {
      locked: !master.has(kunci) && prereqBelum.length > 0,
      prereqBelum,
    };
  });

  return status;
}

/**
 * Diagnostik untuk peta prasyarat yang disusun manual.
 *
 * Tabel tulisan tangan rentan salah secara senyap, jadi tiga hal diperiksa:
 *
 *  1. `namaTakDikenal` — salah ketik. Nama yang tidak ada di urutan kurikulum
 *     tak akan pernah cocok dengan riwayat siswa, sehingga materinya terkunci
 *     selamanya tanpa pesan salah apa pun.
 *  2. `urutanMundur` — prasyarat yang ditulis SESUDAH materinya dalam urutan
 *     mengajar. Ini pengganti deteksi siklus: pada daftar berurut, siklus
 *     mustahil terbentuk selama setiap prasyarat berada lebih awal.
 *  3. `prasyaratTakMungkinMaster` — prasyarat dengan soal < SOAL_MIN. Materi
 *     seperti itu tak akan pernah bisa di-master, jadi semua materi di
 *     belakangnya terkunci permanen.
 *
 * @param {Object}   petaPrasyarat   { "Nama Materi": ["Prasyarat", ...] }
 * @param {string[]} urutanKurikulum urutan mengajar, mis. Object.keys(PETA_TAHAPAN)
 * @param {Object}   petaJumlahSoal  { subMateriTernormalisasi: jumlahSoal }
 */
export function validasiKurikulum(
  petaPrasyarat,
  urutanKurikulum = [],
  petaJumlahSoal = {},
  ambang = MASTERY,
) {
  const posisi = new Map(
    urutanKurikulum.map((nama, i) => [normalisasiNama(nama), i]),
  );

  const namaTakDikenal = [];
  const urutanMundur = [];
  const prasyaratDipakai = new Map(); // ternormalisasi -> nama asli
  const anak = new Map(); // prasyarat -> [materi yang membutuhkannya]

  Object.entries(petaPrasyarat || {}).forEach(([target, daftarPrasyarat]) => {
    const t = normalisasiNama(target);
    if (!posisi.has(t)) namaTakDikenal.push(target);

    (daftarPrasyarat || []).forEach((prasyarat) => {
      const p = normalisasiNama(prasyarat);
      if (!posisi.has(p)) {
        namaTakDikenal.push(prasyarat);
        return;
      }
      prasyaratDipakai.set(p, prasyarat);
      if (!anak.has(p)) anak.set(p, []);
      anak.get(p).push(t);

      if (posisi.has(t) && posisi.get(p) >= posisi.get(t)) {
        urutanMundur.push({ subMateri: target, prasyarat });
      }
    });
  });

  // Seluruh materi hilir yang ikut terkunci bila satu prasyarat bermasalah.
  const hilir = (mulai) => {
    const hasil = new Set();
    const antrian = [mulai];
    while (antrian.length > 0) {
      (anak.get(antrian.shift()) || []).forEach((target) => {
        if (!hasil.has(target)) {
          hasil.add(target);
          antrian.push(target);
        }
      });
    }
    return hasil;
  };

  const prasyaratTakMungkinMaster = [];
  prasyaratDipakai.forEach((namaAsli, prasyarat) => {
    const jumlahSoal = petaJumlahSoal[prasyarat] ?? 0;
    if (jumlahSoal < ambang.SOAL_MIN) {
      prasyaratTakMungkinMaster.push({
        subMateri: namaAsli,
        jumlahSoal,
        dibutuhkan: ambang.SOAL_MIN,
        materiTerkunci: hilir(prasyarat).size,
      });
    }
  });

  return {
    namaTakDikenal,
    urutanMundur,
    prasyaratTakMungkinMaster,
    valid:
      namaTakDikenal.length === 0 &&
      urutanMundur.length === 0 &&
      prasyaratTakMungkinMaster.length === 0,
  };
}
