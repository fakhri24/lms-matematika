// public/js/utils/kurikulumEngine.js
//
// Fungsi murni untuk gerbang prasyarat ("kunci materi").
// Tanpa DOM, tanpa Firestore — semuanya dapat diuji dengan Jest.
// Rujukan rancangan: plan/PLAN.md

import { MODE_LATIHAN, MASTERY } from "./constants.js";

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
 * Apakah kumpulan riwayat ini membuktikan satu sub-materi sudah "master"?
 * Syarat: ujian sumatif selesai, nilai >= NILAI_MIN, dan >= SOAL_MIN soal dikerjakan.
 */
export function isSubMateriMaster(riwayatSubMateri, ambang = MASTERY) {
  if (!Array.isArray(riwayatSubMateri)) return false;

  return riwayatSubMateri.some((hasil) => {
    if (!hasil) return false;
    if (!apakahModeDikunci(hasil.mode_latihan || MODE_LATIHAN.NORMAL))
      return false;
    if (hasil.status === "draf") return false;
    if (!(Number(hasil.nilai) >= ambang.NILAI_MIN)) return false;
    return jumlahSoalDikerjakan(hasil) >= ambang.SOAL_MIN;
  });
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
 * Membangun graf prasyarat -> target beserta inDegree.
 * Peta dipakai UTUH (lintas tab), tanpa penyaringan per tab.
 */
function bangunGraf(petaPrasyarat) {
  const anak = new Map();
  const prasyaratDari = new Map();
  const inDegree = new Map();
  const namaAsli = new Map();

  const daftarkan = (nama) => {
    const kunci = normalisasiNama(nama);
    if (!anak.has(kunci)) anak.set(kunci, []);
    if (!prasyaratDari.has(kunci)) prasyaratDari.set(kunci, []);
    if (!inDegree.has(kunci)) inDegree.set(kunci, 0);
    if (!namaAsli.has(kunci)) namaAsli.set(kunci, String(nama).trim());
    return kunci;
  };

  Object.entries(petaPrasyarat || {}).forEach(([target, daftarPrasyarat]) => {
    const targetKunci = daftarkan(target);
    (daftarPrasyarat || []).forEach((prasyarat) => {
      const prasyaratKunci = daftarkan(prasyarat);
      if (prasyaratKunci === "" || prasyaratKunci === targetKunci) return;
      if (anak.get(prasyaratKunci).includes(targetKunci)) return;
      anak.get(prasyaratKunci).push(targetKunci);
      prasyaratDari.get(targetKunci).push(prasyaratKunci);
      inDegree.set(targetKunci, inDegree.get(targetKunci) + 1);
    });
  });

  return { anak, prasyaratDari, inDegree, namaAsli };
}

/**
 * Urutan topologis (Algoritma Kahn) sekaligus kedalaman tiap simpul.
 * Simpul yang tidak pernah keluar dari antrian berarti terlibat siklus.
 */
export function hitungUrutanTopologis(petaPrasyarat) {
  const { anak, inDegree, namaAsli } = bangunGraf(petaPrasyarat);
  const sisaDerajat = new Map(inDegree);
  const kedalaman = new Map();

  const antrian = [];
  inDegree.forEach((derajat, simpul) => {
    if (derajat === 0) {
      antrian.push(simpul);
      kedalaman.set(simpul, 0);
    }
  });

  const urutan = [];
  while (antrian.length > 0) {
    const sekarang = antrian.shift();
    urutan.push(sekarang);
    anak.get(sekarang).forEach((target) => {
      kedalaman.set(
        target,
        Math.max(kedalaman.get(target) ?? 0, (kedalaman.get(sekarang) ?? 0) + 1),
      );
      sisaDerajat.set(target, sisaDerajat.get(target) - 1);
      if (sisaDerajat.get(target) === 0) antrian.push(target);
    });
  }

  const siklus = [];
  sisaDerajat.forEach((derajat, simpul) => {
    if (derajat > 0) siklus.push(simpul);
  });

  return { urutan, kedalaman, siklus, namaAsli };
}

/**
 * Inti fitur: menentukan status terkunci setiap sub-materi.
 *
 * Sebuah sub-materi terkunci jika ada prasyarat langsungnya yang belum master.
 * Transitivitas tercapai sendiri: prasyarat yang terkunci pasti belum master,
 * sehingga simpul di belakangnya tetap terkunci.
 *
 * Simpul yang terlibat siklus diperlakukan terkunci (fail-safe) agar peta yang
 * rusak tidak membuat materi lolos tanpa validasi.
 *
 * @returns {Object} peta { subMateriTernormalisasi: { locked, prereqBelum, siklus } }
 */
export function hitungStatusKunci(petaPrasyarat, setMaster) {
  const master = setMaster instanceof Set ? setMaster : new Set(setMaster || []);
  const { prasyaratDari, namaAsli } = bangunGraf(petaPrasyarat);
  const { siklus } = hitungUrutanTopologis(petaPrasyarat);
  const setSiklus = new Set(siklus);

  const status = {};
  prasyaratDari.forEach((daftarPrasyarat, simpul) => {
    const prereqBelum = daftarPrasyarat
      .filter((prasyarat) => !master.has(prasyarat))
      .map((prasyarat) => namaAsli.get(prasyarat) || prasyarat);

    const terlibatSiklus = setSiklus.has(simpul);
    status[simpul] = {
      locked: terlibatSiklus || prereqBelum.length > 0,
      prereqBelum,
      siklus: terlibatSiklus,
    };
  });

  return status;
}

/**
 * Diagnostik kurikulum untuk admin.
 *
 * Menandai prasyarat yang MUSTAHIL dicapai: sub-materi dengan jumlah soal di
 * bawah SOAL_MIN tidak akan pernah bisa di-master, sehingga seluruh rantai
 * sesudahnya terkunci permanen.
 *
 * @param {Object} petaPrasyarat  PETA_PRASYARAT_MANUAL
 * @param {Object} petaJumlahSoal { subMateriTernormalisasi: jumlahSoal }
 */
export function validasiKurikulum(
  petaPrasyarat,
  petaJumlahSoal = {},
  ambang = MASTERY,
) {
  const { anak, namaAsli } = bangunGraf(petaPrasyarat);
  const { siklus } = hitungUrutanTopologis(petaPrasyarat);

  const semuaPrasyarat = new Set();
  Object.values(petaPrasyarat || {}).forEach((daftar) =>
    (daftar || []).forEach((p) => semuaPrasyarat.add(normalisasiNama(p))),
  );

  // Seluruh materi hilir yang ikut terkunci bila satu simpul bermasalah.
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
  semuaPrasyarat.forEach((prasyarat) => {
    const jumlahSoal = petaJumlahSoal[prasyarat] ?? 0;
    if (jumlahSoal < ambang.SOAL_MIN) {
      prasyaratTakMungkinMaster.push({
        subMateri: namaAsli.get(prasyarat) || prasyarat,
        jumlahSoal,
        dibutuhkan: ambang.SOAL_MIN,
        materiTerkunci: hilir(prasyarat).size,
      });
    }
  });

  return {
    prasyaratTakMungkinMaster,
    siklus: siklus.map((s) => namaAsli.get(s) || s),
    valid: prasyaratTakMungkinMaster.length === 0 && siklus.length === 0,
  };
}
