// public/js/pages/koreksiUhSiswa.js

import { pantauSesi } from "../services/authService.js";
import { getKoreksiUhByNis } from "../services/koreksiUhService.js";
import {
  createKoreksiCardHTML,
  createKoreksiDetailHTML,
} from "../views/koreksiUhSiswaView.js";

// State
let dataKoreksiMentah = [];
let dataKoreksiAktif = [];
let nisSiswa = localStorage.getItem("nis_siswa");

// DOM Elements
const pembungkusDaftar = document.getElementById("pembungkus-daftar");
const daftarKoreksi = document.getElementById("daftar-koreksi");
const searchInput = document.getElementById("search-koreksi");
const detailKoreksi = document.getElementById("detail-koreksi");
const wadahDetail = document.getElementById("wadah-detail");

// 1. Pantau Sesi Pengguna
pantauSesi(async (user) => {
  if (user) {
    nisSiswa = user.email.split("@")[0];
    localStorage.setItem("nis_siswa", nisSiswa);
    await muatKoreksiSiswa();
  }
}, false); // Hanya untuk Siswa (bukan Admin)

/**
 * Mengambil data koreksi UH dari service
 */
async function muatKoreksiSiswa() {
  if (!nisSiswa) return;
  
  try {
    dataKoreksiMentah = await getKoreksiUhByNis(nisSiswa);
    dataKoreksiAktif = [...dataKoreksiMentah];
    renderDaftarKoreksi();
  } catch (error) {
    console.error("Gagal memuat koreksi UH:", error);
    if (daftarKoreksi) {
      daftarKoreksi.innerHTML =
        "<p style='text-align:center; color:#ef4444; padding: 20px;'>Gagal memuat data koreksi ulangan. Periksa koneksi internet Anda.</p>";
    }
  }
}

/**
 * Merender daftar kartu koreksi di halaman
 */
function renderDaftarKoreksi() {
  if (!daftarKoreksi) return;

  daftarKoreksi.innerHTML = "";

  if (dataKoreksiAktif.length === 0) {
    daftarKoreksi.innerHTML =
      "<p style='text-align:center; padding: 30px; color: var(--text-muted);'>Tidak ada data koreksi ulangan harian yang tersedia.</p>";
    return;
  }

  dataKoreksiAktif.forEach((koreksi, index) => {
    const cardWrapper = document.createElement("div");
    cardWrapper.innerHTML = createKoreksiCardHTML(koreksi, index);
    
    // Simpan data aslinya di element untuk event delegation
    const cardEl = cardWrapper.firstElementChild;
    daftarKoreksi.appendChild(cardEl);
  });
}

/**
 * Membuka panel detail koreksi ulangan harian
 * @param {Object} koreksi - Data koreksi utuh
 */
function bukaDetailKoreksi(koreksi) {
  if (!pembungkusDaftar || !detailKoreksi || !wadahDetail) return;

  pembungkusDaftar.style.display = "none";
  detailKoreksi.style.display = "block";
  
  // Render Detail
  wadahDetail.innerHTML = createKoreksiDetailHTML(koreksi);
  
  // Trigger MathJax untuk me-render persamaan matematika LaTeX
  if (window.MathJax) {
    MathJax.typesetPromise([wadahDetail]).catch((err) => {
      console.error("MathJax typesetting error:", err);
    });
  }
}

/**
 * Menutup panel detail koreksi dan kembali ke daftar
 */
function tutupDetailKoreksi() {
  if (!pembungkusDaftar || !detailKoreksi) return;
  detailKoreksi.style.display = "none";
  pembungkusDaftar.style.display = "block";
}

// 2. Setup Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  // Tombol Kembali Ke Dashboard
  const btnKembali = document.getElementById("btn-kembali");
  btnKembali?.addEventListener("click", () => {
    window.location.href = "dashboard-siswa.html";
  });

  // Tombol Tutup Detail
  const btnTutupDetail = document.getElementById("btn-tutup-detail");
  btnTutupDetail?.addEventListener("click", tutupDetailKoreksi);

  // Pencarian Live Search
  searchInput?.addEventListener("input", function () {
    const keyword = this.value.toLowerCase().trim();
    if (!keyword) {
      dataKoreksiAktif = [...dataKoreksiMentah];
    } else {
      dataKoreksiAktif = dataKoreksiMentah.filter((k) => {
        const topik = (k.metadata?.topik_ujian || "").toLowerCase();
        const tanggal = (k.metadata?.tanggal_koreksi || "").toLowerCase();
        return topik.includes(keyword) || tanggal.includes(keyword);
      });
    }
    renderDaftarKoreksi();
  });

  // Event Delegation klik kartu koreksi
  daftarKoreksi?.addEventListener("click", (e) => {
    const card = e.target.closest(".koreksi-card");
    if (card) {
      const idx = parseInt(card.getAttribute("data-index"), 10);
      const dataLengkap = dataKoreksiAktif[idx];
      if (dataLengkap) {
        bukaDetailKoreksi(dataLengkap);
      }
    }
  });
});
