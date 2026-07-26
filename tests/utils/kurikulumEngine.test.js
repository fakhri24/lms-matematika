import { describe, test, expect } from "@jest/globals";
import {
  normalisasiNama,
  apakahModeDikunci,
  isHasilMasterSumatif,
  isSubMateriMaster,
  hitungSetMaster,
  hitungStatusKunci,
  validasiKurikulum,
} from "../../public/js/utils/kurikulumEngine.js";
import { MODE_LATIHAN } from "../../public/js/utils/constants.js";
import {
  PETA_PRASYARAT,
  PETA_TAHAPAN,
} from "../../public/js/utils/kurikulumData.js";

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

describe("isHasilMasterSumatif — satu definisi untuk gerbang, gelar, dan panel admin", () => {
  test("nilai cukup tapi soal kurang dari 10 TIDAK dihitung lulus", () => {
    // Inilah selisih yang dulu memisahkan panel Ketuntasan dari gerbang dan
    // gelar: panel hanya mengecek nilai >= 80, sehingga menulis "Lulus" untuk
    // ujian yang tidak membuka materi lanjutan dan tidak menerbitkan gelar.
    const pendek = hasilLulus("Aturan Kuadran", {
      nilai: 100,
      detail_jawaban: { a: 1, b: 1, c: 1 },
    });
    expect(pendek.nilai >= 80).toBe(true);
    expect(isHasilMasterSumatif(pendek)).toBe(false);
  });

  test("mode ujian lama tetap dihitung", () => {
    // gelarService dulu hanya mengenal tes_normal/tes_acak, sehingga rekaman
    // lama tidak pernah menerbitkan gelar padahal gerbang menganggapnya master.
    expect(
      isHasilMasterSumatif(
        hasilLulus("Aturan Kuadran", { mode_latihan: MODE_LATIHAN.LAMA_ACAK }),
      ),
    ).toBe(true);
  });

  test("draf tidak pernah lulus", () => {
    // gelarService dulu tidak mengecek status sama sekali.
    expect(
      isHasilMasterSumatif(hasilLulus("Aturan Kuadran", { status: "draf" })),
    ).toBe(false);
  });

  test("sepakat dengan isSubMateriMaster untuk rekaman tunggal", () => {
    const contoh = [
      hasilLulus("A"),
      hasilLulus("A", { nilai: 79 }),
      hasilLulus("A", { status: "draf" }),
      hasilLulus("A", { detail_jawaban: { a: 1 } }),
      hasilLulus("A", { mode_latihan: MODE_LATIHAN.FORMATIF }),
    ];
    contoh.forEach((hasil) => {
      expect(isSubMateriMaster([hasil])).toBe(isHasilMasterSumatif(hasil));
    });
  });

  test("data rusak tidak menyebabkan exception", () => {
    [null, undefined, {}, { nilai: "abc" }].forEach((rusak) => {
      expect(isHasilMasterSumatif(rusak)).toBe(false);
    });
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


describe("hitungStatusKunci", () => {
  const rantai = { B: ["A"], C: ["B"] };

  test("materi yang tak terdaftar di peta tidak muncul di hasil, artinya terbuka", () => {
    // Inilah cara tab Prasyarat dibiarkan bebas: materinya memang tak ditulis.
    expect(hitungStatusKunci(rantai, new Set())["a"]).toBeUndefined();
  });

  test("tanpa master, semua materi berprasyarat terkunci", () => {
    const status = hitungStatusKunci(rantai, new Set());
    expect(status["b"].locked).toBe(true);
    expect(status["c"].locked).toBe(true);
  });

  test("setelah A master, B terbuka tapi C masih terkunci", () => {
    const status = hitungStatusKunci(rantai, new Set(["a"]));
    expect(status["b"].locked).toBe(false);
    expect(status["c"].locked).toBe(true);
  });

  test("prereqBelum memuat nama asli untuk ditampilkan di toast", () => {
    const status = hitungStatusKunci(
      { "Nilai Sudut Istimewa": ["Rasio Trigonometri Dasar"] },
      new Set(),
    );
    expect(status["nilai sudut istimewa"].prereqBelum).toEqual([
      "Rasio Trigonometri Dasar",
    ]);
  });

  test("materi dengan banyak prasyarat mencantumkan semua yang belum master", () => {
    const status = hitungStatusKunci({ D: ["A", "B", "C"] }, new Set(["b"]));
    expect(status["d"].prereqBelum.sort()).toEqual(["A", "C"]);
  });

  test("prasyarat lintas-tab tetap dievaluasi (keputusan #1)", () => {
    // Materi Trigonometri boleh mensyaratkan materi dari tab Prasyarat.
    const status = hitungStatusKunci(
      { "Rasio Trigonometri Dasar": ["Teorema Pythagoras"] },
      new Set(),
    );
    expect(status["rasio trigonometri dasar"].locked).toBe(true);
    expect(status["rasio trigonometri dasar"].prereqBelum).toEqual([
      "Teorema Pythagoras",
    ]);
  });

  test("materi yang sudah master tidak pernah terkunci walau prasyaratnya belum", () => {
    // Kasus nyata: siswa master di bawah kurikulum lama, lalu peta berubah.
    const status = hitungStatusKunci(rantai, new Set(["c"]));
    expect(status["c"].locked).toBe(false);
    expect(status["b"].locked).toBe(true);
  });

  test("prereqBelum tetap dilaporkan untuk materi master yang prasyaratnya bolong", () => {
    expect(hitungStatusKunci(rantai, new Set(["c"]))["c"].prereqBelum).toEqual([
      "B",
    ]);
  });

  test("menerima setMaster berupa array biasa", () => {
    expect(hitungStatusKunci(rantai, ["a"])["b"].locked).toBe(false);
  });

  test("peta kosong tidak menyebabkan exception", () => {
    expect(() => hitungStatusKunci({}, new Set())).not.toThrow();
    expect(() => hitungStatusKunci(null, null)).not.toThrow();
  });
});

describe("validasiKurikulum", () => {
  const urutan = ["A", "B", "C"];

  test("menandai prasyarat yang soalnya di bawah ambang beserta dampaknya", () => {
    const hasil = validasiKurikulum({ B: ["A"], C: ["B"] }, urutan, {
      a: 3,
      b: 10,
      c: 10,
    });
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
    const hasil = validasiKurikulum({ B: ["A"] }, urutan, { b: 10 });
    expect(hasil.prasyaratTakMungkinMaster[0].jumlahSoal).toBe(0);
  });

  test("kurikulum sehat dinyatakan valid", () => {
    const hasil = validasiKurikulum({ B: ["A"] }, urutan, { a: 10, b: 10 });
    expect(hasil).toMatchObject({
      valid: true,
      namaTakDikenal: [],
      urutanMundur: [],
    });
  });

  test("salah ketik nama tertangkap sebagai namaTakDikenal", () => {
    // Tanpa cek ini, "Teorema Pytagoras" mengunci materinya selamanya, diam-diam.
    const hasil = validasiKurikulum({ B: ["Aa"] }, urutan, { b: 10 });
    expect(hasil.valid).toBe(false);
    expect(hasil.namaTakDikenal).toEqual(["Aa"]);
  });

  test("prasyarat yang ditulis sesudah materinya tertangkap sebagai urutanMundur", () => {
    // Pengganti deteksi siklus: pada daftar berurut, ini satu-satunya cara
    // sebuah peta bisa memutar balik.
    const hasil = validasiKurikulum({ A: ["C"] }, urutan, { a: 10, c: 10 });
    expect(hasil.valid).toBe(false);
    expect(hasil.urutanMundur).toEqual([{ subMateri: "A", prasyarat: "C" }]);
  });

  test("materi yang menjadi prasyarat dirinya sendiri juga urutanMundur", () => {
    const hasil = validasiKurikulum({ B: ["B"] }, urutan, { b: 10 });
    expect(hasil.urutanMundur).toHaveLength(1);
  });
});

describe("PETA_PRASYARAT — integritas tabel yang dipakai produksi", () => {
  // Tabel ini disusun tangan, jadi salahnya senyap: materi yang tak pernah
  // terbuka tidak melempar error, ia hanya hilang dari jangkauan siswa.
  // Catatan: syarat "prasyarat harus punya >= 10 soal" tidak diuji di sini
  // karena butuh data bank soal; lihat plan/diagnostik/gate-a-audit-kurikulum.mjs.
  const urutan = Object.keys(PETA_TAHAPAN);
  const hasil = validasiKurikulum(PETA_PRASYARAT, urutan);

  test("semua nama dikenal kurikulum", () => {
    expect(hasil.namaTakDikenal).toEqual([]);
  });

  test("setiap prasyarat diajarkan lebih dulu daripada materinya", () => {
    expect(hasil.urutanMundur).toEqual([]);
  });

  test("hanya materi tab Trigonometri yang dikunci", () => {
    // Blok Trigonometri menempati ekor PETA_TAHAPAN, mulai dari materi ini.
    const awalTrig = urutan.indexOf("rasio trigonometri dasar");
    const diLuarBlok = Object.keys(PETA_PRASYARAT).filter(
      (nama) => urutan.indexOf(normalisasiNama(nama)) < awalTrig,
    );
    expect(diLuarBlok).toEqual([]);
  });

  test("tab Prasyarat sepenuhnya terbuka", () => {
    const status = hitungStatusKunci(PETA_PRASYARAT, new Set());
    const awalTrig = urutan.indexOf("rasio trigonometri dasar");
    const prasyaratTerkunci = urutan
      .slice(0, awalTrig)
      .filter((nama) => status[nama]?.locked);
    expect(prasyaratTerkunci).toEqual([]);
  });

  test("seluruh tab Trigonometri dapat dibuka bila prasyaratnya dituntaskan", () => {
    // Menjamin tak ada materi yatim: setiap materi punya jalur menuju terbuka.
    const master = new Set(
      urutan.slice(0, urutan.indexOf("rasio trigonometri dasar")),
    );
    const trig = urutan.slice(urutan.indexOf("rasio trigonometri dasar"));
    for (let lapis = 0; lapis < trig.length; lapis++) {
      const status = hitungStatusKunci(PETA_PRASYARAT, master);
      const terbuka = trig.filter((n) => !master.has(n) && !status[n]?.locked);
      if (terbuka.length === 0) break;
      terbuka.forEach((n) => master.add(n));
    }
    expect(trig.filter((n) => !master.has(n))).toEqual([]);
  });
});
