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
 * Mengatur drafting soal (Formatif = Semua, Ujian = Maks 10 dengan rasio 4-4-2)
 */
export function siapkanDraftSoal(semuaSoalValid, modeLatihan) {
  let drafFinal = [];

  if (modeLatihan === MODE_LATIHAN.FORMATIF) {
    // Formatif: Ambil semua, langsung urutkan dari yang paling mudah
    drafFinal = [...semuaSoalValid];
    drafFinal.sort(
      (a, b) =>
        (parseInt(a.tingkat_kesulitan) || 1) -
        (parseInt(b.tingkat_kesulitan) || 1),
    );
    return drafFinal;
  }

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
