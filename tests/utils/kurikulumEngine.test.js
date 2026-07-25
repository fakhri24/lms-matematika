import { describe, test, expect } from "@jest/globals";
import {
  normalisasiNama,
  apakahModeDikunci,
  isSubMateriMaster,
  hitungSetMaster,
  hitungUrutanTopologis,
  hitungStatusKunci,
  validasiKurikulum,
} from "../../public/js/utils/kurikulumEngine.js";
import { MODE_LATIHAN } from "../../public/js/utils/constants.js";

/** Pembantu: satu record ujian yang memenuhi semua syarat master. */
function hasilLulus(subMateri, tambahan = {}) {
  const detail = {};
  for (let i = 0; i < 10; i++) detail[`soal-${i}`] = { skor: 1 };
  return {
    sub_materi: subMateri,
    mode_latihan: MODE_LATIHAN.NORMAL,
    status: "selesai",
    nilai: 90,
    detail_jawaban: detail,
    ...tambahan,
  };
}

describe("normalisasiNama", () => {
  test("menyeragamkan huruf besar dan spasi berlebih", () => {
    expect(normalisasiNama("  Aturan Kuadran ")).toBe("aturan kuadran");
  });

  test("aman terhadap null dan undefined", () => {
    expect(normalisasiNama(null)).toBe("");
    expect(normalisasiNama(undefined)).toBe("");
  });
});

describe("apakahModeDikunci", () => {
  test("mode ujian dikunci", () => {
    expect(apakahModeDikunci(MODE_LATIHAN.NORMAL)).toBe(true);
    expect(apakahModeDikunci(MODE_LATIHAN.ACAK)).toBe(true);
  });

  test("mode lama di database tetap dihitung sebagai ujian", () => {
    expect(apakahModeDikunci(MODE_LATIHAN.LAMA_NORMAL)).toBe(true);
    expect(apakahModeDikunci(MODE_LATIHAN.LAMA_ACAK)).toBe(true);
  });

  test("formatif TIDAK dikunci — siswa selalu boleh belajar", () => {
    expect(apakahModeDikunci(MODE_LATIHAN.FORMATIF)).toBe(false);
    expect(apakahModeDikunci(MODE_LATIHAN.LAMA_LATIHAN)).toBe(false);
  });
});

describe("isSubMateriMaster", () => {
  test("lolos bila ujian selesai, nilai >= 80, dan >= 10 soal", () => {
    expect(isSubMateriMaster([hasilLulus("Eksponen")])).toBe(true);
  });

  test("gagal bila nilai di bawah ambang", () => {
    expect(isSubMateriMaster([hasilLulus("Eksponen", { nilai: 79 })])).toBe(
      false,
    );
  });

  test("gagal bila soal dikerjakan kurang dari 10", () => {
    expect(
      isSubMateriMaster([
        hasilLulus("Eksponen", { detail_jawaban: { a: 1, b: 1 } }),
      ]),
    ).toBe(false);
  });

  test("gagal bila statusnya masih draf", () => {
    expect(isSubMateriMaster([hasilLulus("Eksponen", { status: "draf" })])).toBe(
      false,
    );
  });

  test("formatif tidak pernah membuat master, sebagus apa pun nilainya", () => {
    expect(
      isSubMateriMaster([
        hasilLulus("Eksponen", {
          mode_latihan: MODE_LATIHAN.FORMATIF,
          nilai: 100,
        }),
      ]),
    ).toBe(false);
  });

  test("log_percobaan dipakai bila detail_jawaban tidak ada", () => {
    const log = {};
    for (let i = 0; i < 10; i++) log[`s${i}`] = { skor: 1 };
    expect(
      isSubMateriMaster([
        hasilLulus("Eksponen", { detail_jawaban: undefined, log_percobaan: log }),
      ]),
    ).toBe(true);
  });

  test("record legacy tanpa mode_latihan dianggap ujian normal", () => {
    expect(
      isSubMateriMaster([hasilLulus("Eksponen", { mode_latihan: undefined })]),
    ).toBe(true);
  });

  test("data rusak tidak menyebabkan exception", () => {
    expect(() =>
      isSubMateriMaster([null, undefined, {}, { nilai: "abc" }]),
    ).not.toThrow();
    expect(isSubMateriMaster([null, {}, { nilai: "abc" }])).toBe(false);
    expect(isSubMateriMaster("bukan array")).toBe(false);
  });
});

describe("hitungSetMaster", () => {
  test("mengumpulkan sub-materi yang sudah master secara ternormalisasi", () => {
    const set = hitungSetMaster([
      hasilLulus("Aturan Kuadran"),
      hasilLulus("Nilai Sudut Istimewa", { nilai: 50 }),
    ]);
    expect(set.has("aturan kuadran")).toBe(true);
    expect(set.has("nilai sudut istimewa")).toBe(false);
  });

  test("sumatif lulus TANPA formatif apa pun tetap master (revisi keputusan #3)", () => {
    const set = hitungSetMaster([hasilLulus("Aturan Kuadran")]);
    expect(set.has("aturan kuadran")).toBe(true);
  });

  test("beberapa percobaan digabung: satu yang lulus sudah cukup", () => {
    const set = hitungSetMaster([
      hasilLulus("Aturan Kuadran", { nilai: 40 }),
      hasilLulus("Aturan Kuadran", { nilai: 95 }),
    ]);
    expect(set.has("aturan kuadran")).toBe(true);
  });

  test("riwayat kosong menghasilkan himpunan kosong", () => {
    expect(hitungSetMaster([]).size).toBe(0);
    expect(hitungSetMaster(null).size).toBe(0);
  });
});

describe("hitungUrutanTopologis", () => {
  const peta = { B: ["A"], C: ["B"] };

  test("mengurutkan dari prasyarat ke target", () => {
    const { urutan } = hitungUrutanTopologis(peta);
    expect(urutan.indexOf("a")).toBeLessThan(urutan.indexOf("b"));
    expect(urutan.indexOf("b")).toBeLessThan(urutan.indexOf("c"));
  });

  test("kedalaman dipakai sebagai kolom untuk tata letak", () => {
    const { kedalaman } = hitungUrutanTopologis(peta);
    expect(kedalaman.get("a")).toBe(0);
    expect(kedalaman.get("b")).toBe(1);
    expect(kedalaman.get("c")).toBe(2);
  });

  test("mendeteksi siklus tanpa menggantung", () => {
    const { siklus } = hitungUrutanTopologis({ A: ["B"], B: ["A"] });
    expect(siklus.sort()).toEqual(["a", "b"]);
  });
});

describe("hitungStatusKunci", () => {
  const rantai = { B: ["A"], C: ["B"] };

  test("tanpa master, hanya akar yang terbuka", () => {
    const status = hitungStatusKunci(rantai, new Set());
    expect(status["a"].locked).toBe(false);
    expect(status["b"].locked).toBe(true);
    expect(status["c"].locked).toBe(true);
  });

  test("setelah A master, B terbuka tapi C masih terkunci", () => {
    const status = hitungStatusKunci(rantai, new Set(["a"]));
    expect(status["b"].locked).toBe(false);
    expect(status["c"].locked).toBe(true);
  });

  test("prereqBelum memuat nama asli untuk ditampilkan di toast", () => {
    const status = hitungStatusKunci({ "Nilai Sudut Istimewa": ["Rasio Trigonometri Dasar"] }, new Set());
    expect(status["nilai sudut istimewa"].prereqBelum).toEqual([
      "Rasio Trigonometri Dasar",
    ]);
  });

  test("materi dengan banyak prasyarat mencantumkan semua yang belum master", () => {
    const status = hitungStatusKunci({ D: ["A", "B", "C"] }, new Set(["b"]));
    expect(status["d"].prereqBelum.sort()).toEqual(["A", "C"]);
  });

  test("prasyarat lintas-tab tetap dievaluasi (keputusan #1)", () => {
    // Trigonometri disyaratkan menuntaskan materi dari tab Prasyarat
    const status = hitungStatusKunci(
      { "Rasio Trigonometri Dasar": ["Teorema Pythagoras"] },
      new Set(),
    );
    expect(status["rasio trigonometri dasar"].locked).toBe(true);
    expect(status["rasio trigonometri dasar"].prereqBelum).toEqual([
      "Teorema Pythagoras",
    ]);
  });

  test("simpul dalam siklus diperlakukan terkunci (fail-safe)", () => {
    const status = hitungStatusKunci({ A: ["B"], B: ["A"] }, new Set(["a", "b"]));
    expect(status["a"].locked).toBe(true);
    expect(status["a"].siklus).toBe(true);
  });

  test("menerima setMaster berupa array biasa", () => {
    const status = hitungStatusKunci(rantai, ["a"]);
    expect(status["b"].locked).toBe(false);
  });

  test("peta kosong tidak menyebabkan exception", () => {
    expect(() => hitungStatusKunci({}, new Set())).not.toThrow();
    expect(() => hitungStatusKunci(null, null)).not.toThrow();
  });
});

describe("validasiKurikulum", () => {
  test("menandai prasyarat yang soalnya di bawah ambang beserta dampaknya", () => {
    const hasil = validasiKurikulum({ B: ["A"], C: ["B"] }, { a: 3, b: 10, c: 10 });
    expect(hasil.valid).toBe(false);
    expect(hasil.prasyaratTakMungkinMaster).toHaveLength(1);
    expect(hasil.prasyaratTakMungkinMaster[0]).toMatchObject({
      subMateri: "A",
      jumlahSoal: 3,
      dibutuhkan: 10,
      materiTerkunci: 2, // B dan C ikut terkunci permanen
    });
  });

  test("prasyarat yang tidak ada di katalog dianggap 0 soal", () => {
    const hasil = validasiKurikulum({ B: ["A"] }, { b: 10 });
    expect(hasil.prasyaratTakMungkinMaster[0].jumlahSoal).toBe(0);
  });

  test("kurikulum sehat dinyatakan valid", () => {
    const hasil = validasiKurikulum({ B: ["A"] }, { a: 10, b: 10 });
    expect(hasil).toMatchObject({ valid: true, siklus: [] });
    expect(hasil.prasyaratTakMungkinMaster).toEqual([]);
  });

  test("melaporkan siklus", () => {
    const hasil = validasiKurikulum({ A: ["B"], B: ["A"] }, { a: 10, b: 10 });
    expect(hasil.valid).toBe(false);
    expect(hasil.siklus.sort()).toEqual(["A", "B"]);
  });
});
