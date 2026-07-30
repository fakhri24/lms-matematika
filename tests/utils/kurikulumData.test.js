import { describe, test, expect } from "@jest/globals";
import { getTautanEksternalMatrikulasi } from "../../public/js/utils/kurikulumData.js";

describe("getTautanEksternalMatrikulasi", () => {
  test("mengembalikan tautan materi & drilling untuk sub-materi yang dipetakan", () => {
    const hasil = getTautanEksternalMatrikulasi(
      "Matrikulasi - Operasi Aritmatika Dasar",
    );
    expect(hasil).toEqual({
      materi:
        "https://fakhri24.github.io/materi-numerasi-x/materi/01-operasi-aritmatika-dasar.html",
      drilling: "https://fakhri24.github.io/drilling-100/materi.html?id=01",
    });
  });

  test("mengabaikan perbedaan kapitalisasi & spasi tepi (normalisasiNama)", () => {
    const hasil = getTautanEksternalMatrikulasi(
      "  MATRIKULASI - kpk DAN fpb  ",
    );
    expect(hasil).toEqual({
      materi: "https://fakhri24.github.io/materi-numerasi-x/materi/03-kpk-dan-fpb.html",
      drilling: "https://fakhri24.github.io/drilling-100/materi.html?id=03",
    });
  });

  test("mengembalikan tautan yang benar untuk PLSV & SPLDV (nama panjang berkurung)", () => {
    expect(
      getTautanEksternalMatrikulasi(
        "Matrikulasi - Persamaan Linear Satu Variabel (PLSV)",
      ),
    ).toEqual({
      materi: "https://fakhri24.github.io/materi-numerasi-x/materi/08-plsv.html",
      drilling: "https://fakhri24.github.io/drilling-100/materi.html?id=08",
    });
    expect(
      getTautanEksternalMatrikulasi(
        "Matrikulasi - Sistem Persamaan Linear Dua Variabel (SPLDV)",
      ),
    ).toEqual({
      materi: "https://fakhri24.github.io/materi-numerasi-x/materi/09-spldv.html",
      drilling: "https://fakhri24.github.io/drilling-100/materi.html?id=09",
    });
  });

  test("mengembalikan null untuk sub-materi dari tab lain", () => {
    expect(getTautanEksternalMatrikulasi("Aturan Kuadran")).toBeNull();
    expect(getTautanEksternalMatrikulasi("Persentase")).toBeNull(); // bukan "Matrikulasi - Persentase"
  });

  test("mengembalikan null untuk input kosong/null/undefined", () => {
    expect(getTautanEksternalMatrikulasi("")).toBeNull();
    expect(getTautanEksternalMatrikulasi(null)).toBeNull();
    expect(getTautanEksternalMatrikulasi(undefined)).toBeNull();
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
    const hasil = namaLengkap.map((nama) => getTautanEksternalMatrikulasi(nama));
    expect(hasil.every((h) => h !== null)).toBe(true);

    const idDrillingSet = new Set(hasil.map((h) => h.drilling));
    expect(idDrillingSet.size).toBe(12);
  });
});
