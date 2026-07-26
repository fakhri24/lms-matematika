import { jest, describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  createMateriCardHTML,
  tampilkanToast,
} from "../../public/js/views/pilihMateriView.js";

/** Menyuntik HTML kartu ke DOM agar bisa diperiksa seperti di halaman asli. */
function render(html) {
  document.body.innerHTML = `<div id="wadah">${html}</div>`;
  return document.querySelector(".materi-card");
}

describe("createMateriCardHTML — status kunci", () => {
  test("kartu terbuka tidak membawa penanda terkunci", () => {
    const card = render(
      createMateriCardHTML("Trigonometri", "Aturan Kuadran", 20, {
        locked: false,
      }),
    );
    expect(card.getAttribute("data-terkunci")).toBe("false");
    expect(card.querySelector(".materi-info-kunci")).toBeNull();
  });

  test("kartu terkunci membawa data-terkunci dan daftar prasyarat", () => {
    const card = render(
      createMateriCardHTML("Trigonometri", "Nilai Sudut Istimewa", 31, {
        locked: true,
        prereqBelum: ["Rasio Trigonometri Dasar"],
      }),
    );
    expect(card.getAttribute("data-terkunci")).toBe("true");
    expect(card.getAttribute("data-prereq")).toContain(
      "Rasio Trigonometri Dasar",
    );
    expect(card.querySelector(".materi-info-kunci").textContent).toContain(
      "Rasio Trigonometri Dasar",
    );
  });

  test("beberapa prasyarat ditampilkan sekaligus", () => {
    const card = render(
      createMateriCardHTML("Prasyarat", "Teorema Pythagoras", 10, {
        locked: true,
        prereqBelum: ["Sifat Bangun Datar", "Jumlah Sudut Segitiga"],
      }),
    );
    const teks = card.querySelector(".materi-info-kunci").textContent;
    expect(teks).toContain("Sifat Bangun Datar");
    expect(teks).toContain("Jumlah Sudut Segitiga");
  });

  test("kelas .locked TIDAK dipasang oleh view (itu tugas controller sesuai mode)", () => {
    const card = render(
      createMateriCardHTML("Prasyarat", "KPK dan FPB", 10, {
        locked: true,
        prereqBelum: ["Operasi Aritmatika Dasar"],
      }),
    );
    expect(card.classList.contains("locked")).toBe(false);
  });

  test("materi yang sudah master mendapat lencana", () => {
    const card = render(
      createMateriCardHTML("Prasyarat", "KPK dan FPB", 10, { master: true }),
    );
    expect(card.querySelector(".materi-lencana-master")).not.toBeNull();
  });

  test("nama materi dengan karakter khusus tidak merusak markup", () => {
    const card = render(
      createMateriCardHTML(
        "Trigonometri",
        'Sudut Berelasi (Negatif dan >360°) "uji"',
        11,
        {},
      ),
    );
    expect(card.getAttribute("data-sub")).toBe(
      'Sudut Berelasi (Negatif dan >360°) "uji"',
    );
  });

  test("statusKunci boleh dikosongkan (materi belum dipetakan → terbuka)", () => {
    const card = render(createMateriCardHTML("Eksponen", "Sifat Eksponen", 4));
    expect(card.getAttribute("data-terkunci")).toBe("false");
  });
});

describe("tampilkanToast", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("membuat toast sekali saja dan menampilkan pesan", () => {
    tampilkanToast("pesan pertama");
    tampilkanToast("pesan kedua");

    const semuaToast = document.querySelectorAll(".toast-kunci");
    expect(semuaToast).toHaveLength(1);
    expect(semuaToast[0].innerHTML).toBe("pesan kedua");
    expect(semuaToast[0].classList.contains("tampil")).toBe(true);
  });

  test("toast menghilang setelah 4 detik", () => {
    tampilkanToast("halo");
    const toast = document.querySelector(".toast-kunci");
    jest.advanceTimersByTime(4000);
    expect(toast.classList.contains("tampil")).toBe(false);
  });

  test("pemanggilan berulang menyetel ulang pewaktu", () => {
    tampilkanToast("satu");
    jest.advanceTimersByTime(3000);
    tampilkanToast("dua");
    jest.advanceTimersByTime(3000);

    const toast = document.querySelector(".toast-kunci");
    // Toast masih tampil karena pewaktu di-reset saat pemanggilan kedua.
    expect(toast.classList.contains("tampil")).toBe(true);
  });
});
