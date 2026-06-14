// public/js/pages/riwayat.js

// 1. IMPORT DARI SERVICE LAYER (Bebas dari firebase-firestore)
import {
  getRiwayatLatihanSiswa,
  getSoalById,
} from "../services/latihanService.js";
// IMPORT VIEW BARU
import {
  createHistoryCardHTML,
  createReviewSoalHTML,
} from "../views/riwayatSiswaView.js";
import { MODE_LATIHAN, STATUS_LATIHAN } from "../utils/constants.js";

const nis = localStorage.getItem("nis_siswa");

// Variabel State untuk Paginasi & Search
let dataRiwayatMentah = [];
let dataRiwayatAktif = [];
let halamanSaatIni = 1;
const barisPerHalaman = 10;

// Elemen DOM
const pembungkusDaftar = document.getElementById("pembungkus-daftar");
const daftarRiwayat = document.getElementById("daftar-riwayat");
const navigasiHalaman = document.getElementById("navigasi-halaman");
const infoHalaman = document.getElementById("info-halaman");
const btnPrev = document.getElementById("btn-prev");
const btnNext = document.getElementById("btn-next");
const searchRiwayat = document.getElementById("search-riwayat");
const detailReview = document.getElementById("detail-review");
const wadahPembahasan = document.getElementById("wadah-pembahasan");

// ==========================================
// FUNGSI MUAT DATA MENGGUNAKAN SERVICE
// ==========================================
async function muatDaftar() {
  try {
    // Tarik data dengan API yang jauh lebih rapi
    dataRiwayatMentah = await getRiwayatLatihanSiswa(nis);
    dataRiwayatAktif = [...dataRiwayatMentah];
    renderDaftar();
  } catch (error) {
    console.error("Gagal memuat riwayat:", error);
    daftarRiwayat.innerHTML =
      "<p style='text-align:center; color:#ef4444;'>Terjadi kesalahan saat memuat data.</p>";
  }
}

// Fungsi Render Paginasi
window.renderDaftar = function () {
  daftarRiwayat.innerHTML = "";
  if (dataRiwayatAktif.length === 0) {
    daftarRiwayat.innerHTML =
      "<p style='text-align:center; padding: 20px; color: var(--text-muted);'>Tidak ada riwayat.</p>";
    navigasiHalaman.style.display = "none";
    return;
  }

  navigasiHalaman.style.display = "flex";
  const totalHalaman = Math.ceil(dataRiwayatAktif.length / barisPerHalaman);
  const dataHalamanIni = dataRiwayatAktif.slice(
    (halamanSaatIni - 1) * barisPerHalaman,
    halamanSaatIni * barisPerHalaman,
  );

  dataHalamanIni.forEach((data, index) => {
    // 1. FORMAT DATA (Logika Controller)
    const tgl = new Date(data.waktu_submit).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    const menit = Math.floor((data.durasi_detik || 0) / 60);
    const detik = (data.durasi_detik || 0) % 60;
    const teksDurasi = menit > 0 ? `${menit}m ${detik}s` : `${detik}s`;

    const isDraf = data.status === STATUS_LATIHAN.DRAF;
    const badgeDraf = isDraf ? `<span class="badge-draf">Draft</span>` : ""; // Style bisa dipindah ke CSS nanti
    const warnaSkor = isDraf
      ? "#f59e0b"
      : data.nilai >= 75
        ? "var(--success-color)"
        : "#ef4444";
    const teksSkor = isDraf
      ? `<span style="font-size:0.8rem; display:block;">Sementara</span>${data.nilai}`
      : data.nilai;

    // 2. PANGGIL VIEW
    const elemen = document.createElement("div");
    elemen.className = "history-card";
    elemen.setAttribute(
      "data-index",
      (halamanSaatIni - 1) * barisPerHalaman + index,
    );
    elemen.innerHTML = createHistoryCardHTML(
      data,
      tgl,
      teksDurasi,
      badgeDraf,
      warnaSkor,
      teksSkor,
    );

    daftarRiwayat.appendChild(elemen);
  });

  infoHalaman.innerText = `Halaman ${halamanSaatIni} dari ${totalHalaman}`;
  btnPrev.disabled = halamanSaatIni === 1;
  btnNext.disabled = halamanSaatIni === totalHalaman;
};

// Event Listener Paginasi
btnPrev.addEventListener("click", () => {
  if (halamanSaatIni > 1) {
    halamanSaatIni--;
    renderDaftar();
  }
});

btnNext.addEventListener("click", () => {
  if (halamanSaatIni < Math.ceil(dataRiwayatAktif.length / barisPerHalaman)) {
    halamanSaatIni++;
    renderDaftar();
  }
});

// Event Listener Live Search
searchRiwayat.addEventListener("input", function () {
  const keyword = this.value.toLowerCase();
  dataRiwayatAktif = dataRiwayatMentah.filter(
    (d) =>
      (d.sub_materi || "").toLowerCase().includes(keyword) ||
      (d.materi_utama || "").toLowerCase().includes(keyword),
  );
  halamanSaatIni = 1;
  renderDaftar();
});

// Buka Review Jawaban
const bukaReview = async function (dataLatihan) {
  const detailJawaban = dataLatihan.detail_jawaban;
  if (!detailJawaban)
    return alert("Detail jawaban tidak tersedia untuk sesi ini.");

  pembungkusDaftar.style.display = "none";
  detailReview.style.display = "block";
  wadahPembahasan.innerHTML =
    "<p class='text-center text-muted mt-20'>Mengekstrak pembahasan dari database...</p>";

  let htmlKonten = "";
  let nomor = 1;

  const daftarIdSoal = dataLatihan.urutan_soal || Object.keys(detailJawaban);

  for (const idSoal of daftarIdSoal) {
    const jawabanSiswa = detailJawaban[idSoal];
    if (jawabanSiswa === undefined) continue;

    const soalData = await getSoalById(idSoal);

    if (soalData) {
      const isBenar = jawabanSiswa === soalData.jawaban_benar;
      let statusTeks = "";

      // Gunakan Utility Classes (.badge, .badge-success, dll)
      if (
        dataLatihan.mode_latihan === MODE_LATIHAN.FORMATIF &&
        dataLatihan.log_percobaan &&
        dataLatihan.log_percobaan[idSoal]
      ) {
        const log = dataLatihan.log_percobaan[idSoal];

        if (log.lihat_bahas) {
          statusTeks =
            "<span class='badge badge-danger'>Buka Pembahasan</span>";
        } else if (log.percobaan === 1) {
          statusTeks = "<span class='badge badge-success'>Lolos Mandiri</span>";
        } else {
          statusTeks = `<span class='badge badge-warning'>Benar (${log.percobaan - 1}x Salah)</span>`;
        }
      } else {
        statusTeks = isBenar
          ? "<span class='badge badge-success'>Benar</span>"
          : "<span class='badge badge-danger'>Salah</span>";
      }

      // Panggil View yang sudah kita buat di Fase 4.3 (Sangat Bersih!)
      htmlKonten += createReviewSoalHTML(
        nomor,
        statusTeks,
        soalData,
        jawabanSiswa,
        isBenar,
      );
      nomor++;
    }
  }

  wadahPembahasan.innerHTML = htmlKonten;
  if (window.MathJax) MathJax.typesetPromise([wadahPembahasan]);
};

// Tutup Review (Kembali ke Daftar)
const tutupReview = function () {
  detailReview.style.display = "none";
  pembungkusDaftar.style.display = "block";
};

muatDaftar();

// ==========================================
// MANAJEMEN EVENT LISTENER & EVENT DELEGATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  const btnKembali = document.getElementById("btn-kembali");
  if (btnKembali) {
    btnKembali.addEventListener("click", () => {
      window.location.href = "dashboard-siswa.html";
    });
  }

  const btnTutupReview = document.getElementById("btn-tutup-review");
  if (btnTutupReview) {
    btnTutupReview.addEventListener("click", tutupReview);
  }

  const daftarRiwayat = document.getElementById("daftar-riwayat");
  if (daftarRiwayat) {
    daftarRiwayat.addEventListener("click", (e) => {
      const kartuRiwayat = e.target.closest(".history-card");
      if (kartuRiwayat) {
        const indeksTarget = kartuRiwayat.getAttribute("data-index");
        const dataLatihanUtuh = dataRiwayatAktif[indeksTarget];
        bukaReview(dataLatihanUtuh);
      }
    });
  }
});
