// public/js/views/pilihMateriView.js

import { amankanTeks } from "../utils/teksAman.js";

/**
 * Membuat tombol navigasi Tab
 */
export function createTabButtonHTML(idTab, namaTab, isAktif) {
  return `
    <button class="tab-btn ${isAktif ? "active" : ""}" data-target="${idTab}">
      ${namaTab}
    </button>
  `;
}

/**
 * Membuat garis pemisah antar Tahapan Kurikulum
 */
export function createTahapSeparatorHTML(namaTahap) {
  return `
    <div class="tahap-separator">
      <span>${namaTahap}</span>
    </div>
  `;
}

/**
 * Membuat kartu materi yang bisa di-klik.
 *
 * `statusKunci` menandai apakah prasyaratnya belum tuntas. Kartu selalu membawa
 * informasi itu, tetapi kelas `.locked` baru dipasang oleh controller sesuai
 * mode yang dipilih — formatif tidak pernah dikunci.
 *
 * @param {{ locked?: boolean, prereqBelum?: string[], master?: boolean }} statusKunci
 */
export function createMateriCardHTML(
  materiUtama,
  namaAsli,
  jumlahSoal,
  statusKunci = {},
) {
  const { locked = false, prereqBelum = [], master = false } = statusKunci;

  const daftarPrasyarat = prereqBelum.map(amankanTeks).join(" &bull; ");
  const infoKunci = locked
    ? `<p class="materi-info-kunci">🔒 Perlu dikuasai dulu: <strong>${daftarPrasyarat}</strong></p>`
    : "";
  const lencanaMaster = master
    ? ` <span class="materi-lencana-master" title="Sudah dikuasai">✅</span>`
    : "";

  return `
    <div class="question-card materi-card" data-materi="${amankanTeks(materiUtama)}" data-sub="${amankanTeks(namaAsli)}" data-terkunci="${locked}" data-prereq="${daftarPrasyarat}">
      <h4 class="text-primary mb-5" style="margin-top: 0;">📌 ${amankanTeks(namaAsli)}${lencanaMaster}</h4>
      <p class="text-sm text-muted" style="margin: 0;">
        Tersedia ${jumlahSoal} Soal &bull; <span style="color: #94a3b8;">${amankanTeks(materiUtama)}</span>
      </p>
      ${infoKunci}
    </div>
  `;
}

/**
 * Tampilan jika gagal terhubung ke database
 */
export function createErrorStateHTML() {
  return "<p class='text-center text-danger'>Gagal terhubung ke database.</p>";
}

let idPewaktuToast = null;

/**
 * Menampilkan pesan sementara di bawah layar (dipakai saat kartu terkunci diklik).
 */
export function tampilkanToast(pesan) {
  let toast = document.getElementById("toast-pilih-materi");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-pilih-materi";
    toast.className = "toast-kunci";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }

  toast.innerHTML = pesan;
  // Paksa reflow agar animasi tetap jalan saat toast diklik berulang kali.
  void toast.offsetWidth;
  toast.classList.add("tampil");

  if (idPewaktuToast) clearTimeout(idPewaktuToast);
  idPewaktuToast = setTimeout(() => toast.classList.remove("tampil"), 4000);
}
