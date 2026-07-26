// tests/utils/tataLetakPeta.test.js

import {
  hitungLapisanPembukaan,
  susunTataLetakPeta,
  tentukanStatusNode,
  pecahBaris,
} from "../../public/js/utils/tataLetakPeta.js";
import {
  PETA_PRASYARAT,
  PETA_TAHAPAN,
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
    // Logaritma (Fase 2) + 6 target Relasi dan Fungsi (Fase 3) + 3 target
    // Persamaan Kuadrat (Fase 4, plan/PLAN.md §11 -- Vieta, Menyusun PK
    // Baru, Aplikasi; "Diskriminan dan Jenis Akar" masih akar sampai
    // gerbangnya menyusul) + 11 akar (leaf, prasyarat:[]).
    expect(hasil.node).toHaveLength(55);
    // Ambang dinaikkan dari 8 ke 15 di Fase 2 (plan/PLAN.md §11): Logaritma
    // digerbang oleh SELURUH sub-materi Eksponen, jadi rantai Eksponen(5)+
    // Logaritma(6) tersambung lurus jadi satu jalur sedalam 11 kolom. Ini
    // gejala nyata bahwa peta-materi.html (satu peta gabungan semua tab)
    // akan makin sulit dibaca seiring tab baru bertambah — pertimbangkan
    // memisah peta per tab alih-alih terus menaikkan ambang ini.
    expect(hasil.jumlahKolom).toBeLessThanOrEqual(15);
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
