// tests/utils/tataLetakPeta.test.js

import {
  hitungLapisanPembukaan,
  susunTataLetakPeta,
  kolapsTabTuntas,
  tentukanStatusNode,
  pecahBaris,
} from "../../public/js/utils/tataLetakPeta.js";
import {
  PETA_PRASYARAT,
  PETA_TAHAPAN,
  PETA_TAB_SUB_MATERI,
} from "../../public/js/utils/kurikulumData.js";
import { hitungStatusKunci } from "../../public/js/utils/kurikulumEngine.js";

// Peta kecil berbentuk berlian: B dan C sama-sama butuh A, lalu D butuh keduanya.
const berlian = {
  B: ["A"],
  C: ["A"],
  D: ["B", "C"],
};

describe("hitungLapisanPembukaan", () => {
  test("materi tanpa prasyarat jadi kolom nol", () => {
    expect(hitungLapisanPembukaan(berlian).lapisan[0]).toEqual(["a"]);
  });

  test("materi yang terbuka bersamaan berada di kolom yang sama", () => {
    const { lapisan } = hitungLapisanPembukaan(berlian);
    expect(lapisan.map((k) => k.sort())).toEqual([["a"], ["b", "c"], ["d"]]);
  });

  test("materi paling dalam menentukan jumlah kolom", () => {
    expect(hitungLapisanPembukaan({ B: ["A"], C: ["B"] }).lapisan).toHaveLength(
      3,
    );
  });

  test("peta bersiklus berhenti, tidak menggantung, dan melapor yatim", () => {
    // Tabel manual bisa salah tulis; peta harus tetap tampil apa adanya.
    const { lapisan, yatim } = hitungLapisanPembukaan({ A: ["B"], B: ["A"] });
    expect(lapisan).toEqual([]);
    expect(yatim.sort()).toEqual(["a", "b"]);
  });

  test("peta kosong tidak melempar galat", () => {
    expect(hitungLapisanPembukaan({})).toEqual({
      lapisan: [],
      yatim: [],
      label: new Map(),
    });
  });

  test("ejaan pada kunci dipakai untuk tampilan, bukan ejaan di daftar prasyarat", () => {
    // Kunci wajib sama persis dengan nama di Firestore, jadi kuncilah yang benar.
    const { label } = hitungLapisanPembukaan({ "Sudut Ganda": [], X: ["sudut ganda"] });
    expect(label.get("sudut ganda")).toBe("Sudut Ganda");
  });
});

describe("susunTataLetakPeta", () => {
  test("setiap materi dapat satu koordinat, dan sisi mengikuti prasyarat", () => {
    const { node, sisi, jumlahKolom, jumlahBaris } = susunTataLetakPeta(berlian);
    expect(node).toHaveLength(4);
    expect(jumlahKolom).toBe(3);
    expect(jumlahBaris).toBe(2);
    expect(sisi).toHaveLength(4);
  });

  test("prasyarat selalu berada di kolom kiri materinya", () => {
    // Inilah janji visual peta ini: arah kiri ke kanan berarti "maju".
    const { node, sisi } = susunTataLetakPeta(PETA_PRASYARAT);
    const kolom = new Map(node.map((n) => [n.nama, n.kolom]));
    const melanggar = sisi.filter(
      ({ dari, ke }) => kolom.get(dari) >= kolom.get(ke),
    );
    expect(melanggar).toEqual([]);
  });

  test("kolom pendek dipusatkan terhadap kolom tertinggi", () => {
    const { node } = susunTataLetakPeta(berlian);
    // Kolom "a" berisi 1 node sedangkan kolom tertinggi berisi 2.
    expect(node.find((n) => n.nama === "a").barisTampil).toBe(0.5);
  });

  test("urutan baris memakai urutan mengajar saat tidak ada pembanding lain", () => {
    const { node } = susunTataLetakPeta({ Z: [], A: [] }, ["A", "Z"]);
    expect(node.map((n) => n.nama)).toEqual(["a", "z"]);
  });

  test("tabel produksi tersusun penuh tanpa materi yatim", () => {
    const hasil = susunTataLetakPeta(
      PETA_PRASYARAT,
      Object.keys(PETA_TAHAPAN),
    );
    expect(hasil.yatim).toEqual([]);
    // 25 target tab Trigonometri + 4 target Eksponen (Fase 1) + 6 target
    // Logaritma (Fase 2) + 6 target Relasi dan Fungsi (Fase 3) + 4 target
    // Persamaan Kuadrat (Fase 4, plan/PLAN.md §11 -- Diskriminan dan Jenis
    // Akar, Vieta, Menyusun PK Baru, Aplikasi) + 3 target Fungsi Kuadrat
    // (Fase 5 -- Sifat dan Grafik, Menyusun Persamaan Parabola, Aplikasi)
    // + 6 target Pertidaksamaan (Fase 6 -- Linear, Program Linear, Kuadrat,
    // Rasional, Irasional, Aplikasi) + 4 target Fungsi Rasional (Fase 7 --
    // Pengertian, Domain dan Range, Asimtot, Menggambar Grafik) + 5 target
    // Kaidah Pencacahan & Peluang (Fase 8 -- Permutasi, Kombinasi, Ruang
    // Sampel dan Peluang Kejadian Tunggal, Frekuensi Relatif dan Harapan,
    // Peluang Kejadian Majemuk) + 4 target Nilai Mutlak (Fase 9 -- Definisi
    // dan Sifat, Persamaan, Pertidaksamaan, Grafik Fungsi; semua 70
    // prasyarat gerbang "semua"-nya sudah node lain, tidak menambah akar
    // baru) = 67 target + 13 akar (leaf, prasyarat:[]) = 80.
    //
    // +2 lagi 2026-07-28 (Gate B, plan/diagnostik/gate-b-analisis-konsep-
    // prasyarat.mjs): "Sifat Eksponen Bilangan Bulat" (pintu masuk tab
    // Eksponen, dulu akar tanpa syarat) dapat gerbang nyata dari data
    // konsep_prasyarat -> pindah dari akar jadi target (+1 target, -1
    // akar), dan gerbang barunya butuh 2 node baru sama sekali yang
    // sebelumnya tak pernah disebut di PETA_PRASYARAT: "Operasi Aritmatika
    // Dasar" dan "Pengenalan Variabel" (+2 akar). Total: 68 target + 14
    // akar = 82.
    //
    // +0 net di Persamaan Kuadrat (Gate B, sama hari): "Akar Persamaan
    // Kuadrat" pindah dari akar ke target, tapi ketiga prasyarat barunya
    // (Manipulasi Aljabar Dasar, Operasi Pecahan, Operasi Bentuk Akar)
    // semuanya sudah node lama -- 69 target + 13 akar, tetap 82 total.
    //
    // +1 lagi di Relasi dan Fungsi (Gate B, sama hari): "Substitusi Fungsi
    // Linear" pindah dari akar ke target (prasyaratnya Manipulasi Aljabar
    // Dasar/Pengenalan Variabel/PLSV semua sudah node lama), tapi "Analisis
    // Grafik Fungsi" dapat 1 node BARU yang belum pernah disebut di manapun:
    // "Representasi Aljabar" (+1 akar). Total: 70 target + 13 akar = 83.
    expect(hasil.node).toHaveLength(83);
    // Ambang dinaikkan dari 20 ke 23 di Fase 9 (plan/PLAN.md §11) karena
    // "Definisi dan Sifat Nilai Mutlak" digerbang oleh SELURUH sub-materi
    // SELURUH tab lain, jadi kolomnya = kolom terdalam dari SEMUA rantai
    // lain + 3 (rantai internalnya sendiri). Saat itu dikira ini kenaikan
    // TERAKHIR ("tidak ada tab baru lagi") -- ternyata keliru: §13 (Gate B,
    // 2026-07-28) menambah PRASYARAT BARU ke sub-materi yang SUDAH ada
    // (bukan tab baru), yang tetap memperdalam rantai yang sama persis
    // lewat mega-gerbang "semua tab" ini. Dinaikkan lagi ke 25 (Eksponen
    // dapat gerbang -> +1 kedalaman; Akar Persamaan Kuadrat dapat gerbang
    // -> +1 kedalaman lagi di rantai Persamaan/Fungsi Kuadrat). Kemungkinan
    // akan naik lagi tiap kali §13 menambah gerbang ke tab lain -- bukan
    // dianggap final sampai seluruh rollout §13 selesai. Riwayat: 8->15
    // (Fase 2), 15->20 (Fase 7), 20->23 (Fase 9), 23->25 (§13 Eksponen +
    // Persamaan Kuadrat).
    expect(hasil.jumlahKolom).toBeLessThanOrEqual(25);
  });

  test("kolom nol tabel produksi hanya berisi materi tab Prasyarat", () => {
    // Tab Prasyarat tidak pernah dikunci (keputusan #10), jadi kolom nol memang
    // tempatnya: bekal yang dibawa siswa sebelum masuk Trigonometri.
    const { node } = susunTataLetakPeta(PETA_PRASYARAT);
    const kolomNol = node.filter((n) => n.kolom === 0).map((n) => n.nama);
    const materiTrigonometri = new Set(
      Object.keys(PETA_PRASYARAT).map((n) => n.toLowerCase()),
    );
    kolomNol.forEach((nama) => {
      expect(materiTrigonometri.has(nama)).toBe(false);
    });
  });
});

describe("kolapsTabTuntas", () => {
  // Tab "Merah" punya rantai internal a1 -> a2; tab "Biru" cuma b1. Gerbang X
  // mensyaratkan ketiganya sekaligus -- kasus persis seperti "Pertidaksamaan
  // Linear" menyebut 11 sub-materi dari 3 tab.
  const petaTab = { Merah: ["a1", "a2"], Biru: ["b1"] };
  const peta = { a2: ["a1"], X: ["a1", "a2", "b1"] };
  const urutan = ["a1", "a2", "b1", "X"];

  test("tab yang seluruh anggotanya master dilipat jadi satu simpul", () => {
    const hasil = kolapsTabTuntas(peta, urutan, petaTab, ["a1", "a2", "b1"]);
    expect(hasil.tabTuntas.sort()).toEqual(["Biru", "Merah"]);
    expect(hasil.peta.X.sort()).toEqual(["Biru", "Merah"]);
  });

  test("rantai internal tab yang dilipat tidak lagi digambar sebagai sisi", () => {
    const hasil = kolapsTabTuntas(peta, urutan, petaTab, ["a1", "a2", "b1"]);
    // "a2" tadinya prasyarat "a1" (sesama Merah) -- sisi ini hilang, bukan
    // muncul sebagai self-loop "Merah" -> "Merah".
    expect(hasil.peta.Merah).toEqual([]);
  });

  test("tab yang belum lengkap master TIDAK dilipat", () => {
    // Merah belum lengkap (a2 belum master); Biru sudah.
    const hasil = kolapsTabTuntas(peta, urutan, petaTab, ["a1", "b1"]);
    expect(hasil.tabTuntas).toEqual(["Biru"]);
    expect(hasil.peta.X.sort()).toEqual(["Biru", "a1", "a2"].sort());
  });

  test("kecualikanTab mencegah pelipatan meski 100% master", () => {
    const hasil = kolapsTabTuntas(
      peta,
      urutan,
      petaTab,
      ["a1", "a2", "b1"],
      ["Merah"],
    );
    expect(hasil.tabTuntas).toEqual(["Biru"]);
    expect(hasil.peta.X.sort()).toEqual(["Biru", "a1", "a2"].sort());
  });

  test("urutanKurikulum dilipat & dedup, tab muncul di posisi anggota pertamanya", () => {
    const hasil = kolapsTabTuntas(peta, urutan, petaTab, ["a1", "a2", "b1"]);
    expect(hasil.urutanKurikulum).toEqual(["Merah", "Biru", "X"]);
  });

  test("setMaster berupa Set juga diterima", () => {
    const hasil = kolapsTabTuntas(
      peta,
      urutan,
      petaTab,
      new Set(["a1", "a2", "b1"]),
    );
    expect(hasil.tabTuntas.sort()).toEqual(["Biru", "Merah"]);
  });

  test("masukan kosong tidak melempar galat dan tidak melipat apa pun", () => {
    expect(() => kolapsTabTuntas({}, [], {}, [])).not.toThrow();
    const hasil = kolapsTabTuntas(peta, urutan, petaTab, []);
    expect(hasil.tabTuntas).toEqual([]);
    expect(hasil.peta).toEqual(peta);
  });

  test("gerbang produksi 'Pertidaksamaan Linear' terlipat jadi 3 nama tab saat prasyaratnya lengkap master", () => {
    // Kasus nyata yang memotivasi fitur ini: 11 sub-materi dari Eksponen +
    // Fungsi Kuadrat + Sistem Persamaan jadi cuma 3 simpul.
    const master = [
      ...PETA_TAB_SUB_MATERI["Eksponen"],
      ...PETA_TAB_SUB_MATERI["Fungsi Kuadrat"],
      ...PETA_TAB_SUB_MATERI["Sistem Persamaan"],
    ];
    const hasil = kolapsTabTuntas(
      PETA_PRASYARAT,
      Object.keys(PETA_TAHAPAN),
      PETA_TAB_SUB_MATERI,
      master,
    );
    expect(hasil.peta["Pertidaksamaan Linear"].sort()).toEqual(
      ["Eksponen", "Fungsi Kuadrat", "Sistem Persamaan"].sort(),
    );
  });
});

describe("tentukanStatusNode", () => {
  const statusKunci = hitungStatusKunci(berlian, new Set());

  test("materi yang sudah master ditandai master meski prasyaratnya belum", () => {
    // Konsisten dengan keputusan #8: bukti langsung mengalahkan dugaan.
    expect(tentukanStatusNode("b", statusKunci, new Set(["b"]))).toBe("master");
  });

  test("materi dengan prasyarat belum tuntas ditandai terkunci", () => {
    expect(tentukanStatusNode("b", statusKunci, new Set())).toBe("terkunci");
  });

  test("materi tanpa prasyarat yang belum dikerjakan ditandai siap", () => {
    expect(tentukanStatusNode("a", statusKunci, new Set())).toBe("siap");
  });
});

describe("pecahBaris", () => {
  test("nama pendek tetap satu baris", () => {
    expect(pecahBaris("Sudut Ganda", 23)).toEqual(["Sudut Ganda"]);
  });

  test("nama panjang dipenggal di sela kata", () => {
    expect(pecahBaris("Persamaan Trigonometri Bentuk Khusus", 23)).toEqual([
      "Persamaan Trigonometri",
      "Bentuk Khusus",
    ]);
  });

  test("kata yang lebih panjang dari satu baris tidak dipotong di tengah", () => {
    // Lebih baik meluber sedikit daripada nama materi jadi tak terbaca.
    expect(pecahBaris("Trigonometri", 5)).toEqual(["Trigonometri"]);
  });

  test("baris berlebih diringkas dengan elipsis", () => {
    expect(pecahBaris("a b c d e f", 1, 2)).toEqual(["a", "b…"]);
  });

  test("masukan kosong menghasilkan daftar kosong", () => {
    expect(pecahBaris("")).toEqual([]);
    expect(pecahBaris(null)).toEqual([]);
  });
});
