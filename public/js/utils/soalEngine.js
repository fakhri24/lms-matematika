// public/js/utils/soalEngine.js

import { MODE_LATIHAN } from "./constants.js";

/**
 * Fungsi utilitas untuk mengocok array (Fisher-Yates Shuffle)
 */
export function acakArray(array) {
  let arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Mengelompokkan soal per tingkat kesulitan (1/2/3), dipakai formatif adaptif.
 */
export function kelompokkanSoalPerLevel(semuaSoal) {
  const perLevel = { 1: [], 2: [], 3: [] };
  semuaSoal.forEach((s) => {
    const level = parseInt(s.tingkat_kesulitan) || 1;
    const levelValid = perLevel[level] ? level : 1;
    perLevel[levelValid].push(s);
  });
  return perLevel;
}

/**
 * Formatif adaptif: pilih satu soal acak dari level saat ini, mengecualikan
 * soal yang sudah pernah dijawab benar. Kalau level ini tidak punya soal
 * yang belum benar, ulangi acak dari soal yang sudah benar di level itu
 * (latihan tambahan) — supaya syarat naik/turun level tetap murni performa,
 * bukan kehabisan stok. Kalau level ini benar-benar tidak punya soal sama
 * sekali, jatuh ke gabungan semua level (fallback bank soal timpang).
 */
export function pilihSoalFormatifBerikutnya(
  soalPerLevel,
  levelSaatIni,
  idSoalSudahBenar,
) {
  const belumBenarDari = (kumpulan) =>
    kumpulan.filter((s) => !idSoalSudahBenar.includes(s.id_unik_sistem));

  const poolLevel = soalPerLevel[levelSaatIni] || [];
  let kandidat =
    belumBenarDari(poolLevel).length > 0 ? belumBenarDari(poolLevel) : poolLevel;

  if (kandidat.length === 0) {
    const semuaSoal = [1, 2, 3].flatMap((lvl) => soalPerLevel[lvl] || []);
    kandidat =
      belumBenarDari(semuaSoal).length > 0
        ? belumBenarDari(semuaSoal)
        : semuaSoal;
  }

  if (kandidat.length === 0) return null;
  return acakArray(kandidat)[0];
}

/**
 * Aturan naik/turun level formatif adaptif, dari satu jawaban (benar/salah):
 * - Benar 3x berturut-turut -> naik level (mentok 3; di level 3 jadi TUNTAS,
 *   bukan naik level lagi).
 * - Salah 2x kumulatif (tidak harus berturut-turut) -> turun level (mentok 1).
 * - Kedua counter direset saat level berubah (naik/turun); counter salah
 *   TIDAK direset saat jawaban benar (sengaja kumulatif).
 * Menerima & mengembalikan objek state baru, tidak memodifikasi input (murni).
 */
export function perbaruiLevelAdaptif(stateLevel, benar) {
  let { levelSaatIni, levelTertinggiDicapai, streakBenar, totalSalahDiLevelIni } =
    stateLevel;
  let tuntas = false;

  if (benar) {
    streakBenar += 1;
    if (streakBenar >= 3) {
      if (levelSaatIni < 3) {
        levelSaatIni += 1;
        levelTertinggiDicapai = Math.max(levelTertinggiDicapai, levelSaatIni);
        streakBenar = 0;
        totalSalahDiLevelIni = 0;
      } else {
        tuntas = true;
      }
    }
  } else {
    totalSalahDiLevelIni += 1;
    streakBenar = 0;
    if (totalSalahDiLevelIni >= 2) {
      if (levelSaatIni > 1) levelSaatIni -= 1;
      totalSalahDiLevelIni = 0;
    }
  }

  return { levelSaatIni, levelTertinggiDicapai, streakBenar, totalSalahDiLevelIni, tuntas };
}

/**
 * Mengacak urutan tampil `opsi` satu soal (mis. supaya jawaban benar tidak
 * selalu di posisi A ketika soal ditulis dengan urutan itu di bank soal).
 * `jawaban_benar` disimpan sebagai teks pilihan itu sendiri (bukan indeks),
 * jadi pengecekan benar/salah di LatihanController tidak perlu tahu urutan
 * aslinya -- aman diacak di sini tanpa menyentuh logika manapun.
 */
export function acakOpsiSoal(soal) {
  if (!Array.isArray(soal?.opsi)) return soal;
  return { ...soal, opsi: acakArray(soal.opsi) };
}

/**
 * Mengatur drafting soal (Ujian = Maks 10 dengan rasio 4-4-2, Spesial = 1-3-1).
 * Formatif punya alur sendiri lewat pilihSoalFormatifBerikutnya di atas.
 */
export function siapkanDraftSoal(semuaSoalValid, modeLatihan) {
  let drafFinal = [];

  if (modeLatihan === MODE_LATIHAN.SPESIAL) {
    // Spesial: 1 Mudah, 3 Sedang, 1 Sulit PER sub-materi
    // Kita asumsikan `semuaSoalValid` berisi soal dari beberapa sub-materi
    // Kelompokkan dulu per sub-materi
    const soalPerSub = {};
    semuaSoalValid.forEach((s) => {
      const sub = s.sub_materi || "Lainnya";
      if (!soalPerSub[sub]) soalPerSub[sub] = { mudah: [], sedang: [], sulit: [] };
      
      const level = parseInt(s.tingkat_kesulitan) || 1;
      if (level === 1) soalPerSub[sub].mudah.push(s);
      else if (level === 2) soalPerSub[sub].sedang.push(s);
      else soalPerSub[sub].sulit.push(s);
    });

    let draftSpesial = [];
    Object.keys(soalPerSub).forEach(sub => {
      let { mudah, sedang, sulit } = soalPerSub[sub];
      mudah = acakArray(mudah);
      sedang = acakArray(sedang);
      sulit = acakArray(sulit);

      // Ambil 1 mudah, 3 sedang, 1 sulit
      let pilihan = [
        ...mudah.splice(0, 1),
        ...sedang.splice(0, 3),
        ...sulit.splice(0, 1)
      ];

      // Fallback jika ada yang kurang (misal tidak ada soal sulit)
      if (pilihan.length < 5) {
        let sisa = acakArray([...mudah, ...sedang, ...sulit]);
        pilihan = [...pilihan, ...sisa.splice(0, 5 - pilihan.length)];
      }

      draftSpesial = [...draftSpesial, ...pilihan];
    });

    // Acak urutan akhir
    return acakArray(draftSpesial);
  }

  // --- LOGIKA KHUSUS UJIAN SUMATIF/ACAK (MAKS 10 SOAL) ---
  let mudah = [];
  let sedang = [];
  let sulit = [];

  semuaSoalValid.forEach((s) => {
    const level = parseInt(s.tingkat_kesulitan) || 1;
    if (level === 1) mudah.push(s);
    else if (level === 2) sedang.push(s);
    else sulit.push(s);
  });

  // Kocok masing-masing keranjang
  mudah = acakArray(mudah);
  sedang = acakArray(sedang);
  sulit = acakArray(sulit);

  // Ambil Kuota (Drafting 4-4-2)
  drafFinal = [
    ...mudah.splice(0, 4),
    ...sedang.splice(0, 4),
    ...sulit.splice(0, 2),
  ];

  // Fallback: Kalau total belum 10, ambil acak dari sisa keranjang
  if (drafFinal.length < 10) {
    let keranjangSisa = acakArray([...mudah, ...sedang, ...sulit]);
    let kekurangan = 10 - drafFinal.length;
    drafFinal = [...drafFinal, ...keranjangSisa.splice(0, kekurangan)];
  }

  // Pengurutan Akhir
  if (modeLatihan === MODE_LATIHAN.ACAK) {
    return acakArray(drafFinal);
  } else {
    // tes_normal (Urut dari termudah)
    return drafFinal.sort(
      (a, b) =>
        (parseInt(a.tingkat_kesulitan) || 1) -
        (parseInt(b.tingkat_kesulitan) || 1),
    );
  }
}
