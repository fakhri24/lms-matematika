import { describe, test, expect } from "@jest/globals";
import {
  getTautanEksternalFormatif,
  PETA_TAB_SUB_MATERI,
} from "../../public/js/utils/kurikulumData.js";

describe("getTautanEksternalFormatif", () => {
  test("mengembalikan tautan materi & drilling untuk sub-materi yang dipetakan", () => {
    const hasil = getTautanEksternalFormatif(
      "Matrikulasi - Operasi Aritmatika Dasar",
    );
    expect(hasil).toEqual({
      materi:
        "https://fakhri24.github.io/materi-numerasi-x/materi/01-operasi-aritmatika-dasar.html",
      drilling: "https://fakhri24.github.io/drilling-100/materi.html?id=01",
    });
  });

  test("mengabaikan perbedaan kapitalisasi & spasi tepi (normalisasiNama)", () => {
    const hasil = getTautanEksternalFormatif(
      "  MATRIKULASI - kpk DAN fpb  ",
    );
    expect(hasil).toEqual({
      materi: "https://fakhri24.github.io/materi-numerasi-x/materi/03-kpk-dan-fpb.html",
      drilling: "https://fakhri24.github.io/drilling-100/materi.html?id=03",
    });
  });

  test("mengembalikan tautan yang benar untuk PLSV & SPLDV (nama panjang berkurung)", () => {
    expect(
      getTautanEksternalFormatif(
        "Matrikulasi - Persamaan Linear Satu Variabel (PLSV)",
      ),
    ).toEqual({
      materi: "https://fakhri24.github.io/materi-numerasi-x/materi/08-plsv.html",
      drilling: "https://fakhri24.github.io/drilling-100/materi.html?id=08",
    });
    expect(
      getTautanEksternalFormatif(
        "Matrikulasi - Sistem Persamaan Linear Dua Variabel (SPLDV)",
      ),
    ).toEqual({
      materi: "https://fakhri24.github.io/materi-numerasi-x/materi/09-spldv.html",
      drilling: "https://fakhri24.github.io/drilling-100/materi.html?id=09",
    });
  });

  test("mengembalikan null untuk sub-materi dari tab lain", () => {
    expect(getTautanEksternalFormatif("Aturan Kuadran")).toBeNull();
    expect(getTautanEksternalFormatif("Persentase")).toBeNull(); // bukan "Matrikulasi - Persentase"
  });

  test("mengembalikan null untuk input kosong/null/undefined", () => {
    expect(getTautanEksternalFormatif("")).toBeNull();
    expect(getTautanEksternalFormatif(null)).toBeNull();
    expect(getTautanEksternalFormatif(undefined)).toBeNull();
  });

  test("memetakan seluruh 12 sub-materi Matrikulasi Numerasi tanpa duplikat idDrilling", () => {
    const namaLengkap = [
      "Matrikulasi - Operasi Aritmatika Dasar",
      "Matrikulasi - Sifat Operasi Bilangan",
      "Matrikulasi - KPK dan FPB",
      "Matrikulasi - Operasi Pecahan",
      "Matrikulasi - Operasi dan Konversi Desimal",
      "Matrikulasi - Pengenalan Variabel",
      "Matrikulasi - Manipulasi Aljabar Dasar",
      "Matrikulasi - Persamaan Linear Satu Variabel (PLSV)",
      "Matrikulasi - Sistem Persamaan Linear Dua Variabel (SPLDV)",
      "Matrikulasi - Persentase",
      "Matrikulasi - Perbandingan dan Skala",
      "Matrikulasi - Pembulatan dan Estimasi",
    ];
    const hasil = namaLengkap.map((nama) => getTautanEksternalFormatif(nama));
    expect(hasil.every((h) => h !== null)).toBe(true);

    const idDrillingSet = new Set(hasil.map((h) => h.drilling));
    expect(idDrillingSet.size).toBe(12);
  });

  test("memetakan sub-materi Eksponen ke halaman belajar-eksponen + drilling E1..E5", () => {
    expect(getTautanEksternalFormatif("Sifat Eksponen Bilangan Bulat")).toEqual({
      materi: "https://fakhri24.github.io/belajar-eksponen/",
      drilling: "https://fakhri24.github.io/drilling-100/materi.html?id=E1",
    });
    expect(
      getTautanEksternalFormatif("Eksponen Rasional (Pangkat Pecahan)"),
    ).toEqual({
      materi: "https://fakhri24.github.io/belajar-eksponen/",
      drilling: "https://fakhri24.github.io/drilling-100/materi.html?id=E4",
    });
    expect(getTautanEksternalFormatif("  FUNGSI eksponen ")).toEqual({
      materi: "https://fakhri24.github.io/belajar-eksponen/",
      drilling: "https://fakhri24.github.io/drilling-100/materi.html?id=E5",
    });
  });

  // Penjaga sinkronisasi: menambah sub-materi ke tab Eksponen tanpa menambah
  // tautannya di sini akan membuat siswa kehilangan tombol materi/drilling
  // di mode formatif, tanpa error apa pun di runtime.
  test("SELURUH sub-materi tab Eksponen punya tautan, id drilling unik", () => {
    const hasil = PETA_TAB_SUB_MATERI.Eksponen.map((nama) =>
      getTautanEksternalFormatif(nama),
    );
    expect(hasil.every((h) => h !== null)).toBe(true);
    expect(new Set(hasil.map((h) => h.drilling)).size).toBe(
      PETA_TAB_SUB_MATERI.Eksponen.length,
    );
  });

  test("tabel tautan tidak bisa diubah lewat objek yang dikembalikan", () => {
    const pertama = getTautanEksternalFormatif("Operasi Bentuk Akar");
    pertama.materi = "https://contoh.invalid/dirusak";
    expect(getTautanEksternalFormatif("Operasi Bentuk Akar").materi).toBe(
      "https://fakhri24.github.io/belajar-eksponen/",
    );
  });
});
