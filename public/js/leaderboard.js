// public/js/leaderboard.js
import { getMapGelarSemuaSiswa } from "./services/userService.js";
import { getSemuaHasilLatihanGlobal } from "./services/latihanService.js";
import {
  DATA_DEFAULT,
  MODE_LATIHAN,
  STATUS_LATIHAN,
} from "./utils/constants.js";

// IMPORT VIEW BARU
import {
  createSaranBtnHTML,
  createRankItemHTML,
  createMasteryCardHTML,
  createEmptySaranHTML,
  createSisaSaranHTML,
  createEmptyKegigihanHTML,
  createEmptyMasteryHTML,
} from "./views/leaderboardView.js";

let agregatSiswa = {};
let mapGelarSiswa = {};
let tabAktif = "kegigihan";
let daftarSemuaSubMateri = [];
let subMateriAktif = "";

const searchInput = document.getElementById("search-submateri");
const wadahSaran = document.getElementById("wadah-saran-materi");
const tabKegigihan = document.getElementById("tab-kegigihan");
const tabMastery = document.getElementById("tab-mastery");
const wadahLeaderboard = document.getElementById("wadah-leaderboard");
const teksRule = document.getElementById("teks-rule");

function formatWaktuBelajar(detik) {
  const jam = Math.floor(detik / 3600);
  const menit = Math.floor((detik % 3600) / 60);
  if (jam > 0) return `${jam}j ${menit}m`;
  if (menit > 0) return `${menit} menit`;
  return `${detik % 3600} detik`;
}

async function muatDataLeaderboard() {
  try {
    mapGelarSiswa = await getMapGelarSemuaSiswa();
    const dataLatihanAll = await getSemuaHasilLatihanGlobal();
    const setSubMateri = new Set();
    agregatSiswa = {};

    dataLatihanAll.forEach((d) => {
      // (Logika agregasi dan perhitungan tidak ada yang berubah, tetap di controller)
      if (d.status === STATUS_LATIHAN.DRAF) return;
      const sub = d.sub_materi || DATA_DEFAULT.MATERI;
      const nis = d.nis_siswa;
      const nama = d.nama_siswa || DATA_DEFAULT.NAMA;
      const durasi = d.durasi_detik || 0;
      const nilai = d.nilai || 0;
      const mode = d.mode_latihan || MODE_LATIHAN.NORMAL;

      setSubMateri.add(sub);

      const jumlahJawaban = d.detail_jawaban
        ? Object.keys(d.detail_jawaban).length
        : 0;
      const jumlahLog = d.log_percobaan
        ? Object.keys(d.log_percobaan).length
        : 0;

      // Mengambil nilai terbesar karena log_percobaan selalu merekam SEMUA interaksi soal
      let soalDikerjakan = Math.max(jumlahJawaban, jumlahLog);

      if (!agregatSiswa[sub]) agregatSiswa[sub] = {};
      if (!agregatSiswa[sub][nis]) {
        agregatSiswa[sub][nis] = {
          nis,
          nama,
          total_soal: 0,
          total_durasi: 0,
          skor_mastery: [],
        };
      }

      agregatSiswa[sub][nis].total_soal += soalDikerjakan;
      agregatSiswa[sub][nis].total_durasi += durasi;

      if (
        (mode === MODE_LATIHAN.NORMAL || mode === MODE_LATIHAN.ACAK) &&
        nilai > 85 &&
        soalDikerjakan >= 10
      ) {
        agregatSiswa[sub][nis].skor_mastery.push(nilai);
      }
    });

    daftarSemuaSubMateri = Array.from(setSubMateri).sort();
    renderSaranMateri("");
    wadahLeaderboard.innerHTML = `<p style="text-align:center; color: var(--text-muted); margin-top: 40px;">Pilih salah satu arena di atas untuk melihat klasemen.</p>`;
  } catch (error) {
    console.error("Gagal memuat leaderboard:", error);
    wadahLeaderboard.innerHTML = `<p style="text-align:center; color: #ef4444;">Gagal terhubung ke database.</p>`;
  }
}

function renderSaranMateri(kataKunci) {
  const filterKetik = kataKunci.toLowerCase().trim();
  let hasilFilter =
    filterKetik !== ""
      ? daftarSemuaSubMateri.filter((sub) =>
          sub.toLowerCase().includes(filterKetik),
        )
      : daftarSemuaSubMateri;

  const batasTampil = 7;
  const hasilDibatasi = hasilFilter.slice(0, batasTampil);

  if (hasilDibatasi.length === 0) {
    wadahSaran.innerHTML = createEmptySaranHTML();
    return;
  }

  // 1. PANGGIL VIEW: Merakit tombol dengan HTML string
  let htmlSaran = hasilDibatasi
    .map((sub) => createSaranBtnHTML(sub, sub === subMateriAktif))
    .join("");

  if (hasilFilter.length > batasTampil) {
    htmlSaran += createSisaSaranHTML(hasilFilter.length - batasTampil);
  }

  wadahSaran.innerHTML = htmlSaran;
}

// 2. EVENT DELEGATION BARU (Sangat Efisien)
wadahSaran.addEventListener("click", (e) => {
  const btn = e.target.closest(".saran-btn");
  if (btn) {
    subMateriAktif = btn.getAttribute("data-sub");
    renderSaranMateri(searchInput.value);
    prosesTampilan();
  }
});

searchInput.addEventListener("input", (e) => renderSaranMateri(e.target.value));

function prosesTampilan() {
  if (!subMateriAktif) return;
  const daftarSiswa = Object.values(agregatSiswa[subMateriAktif] || {});

  if (tabAktif === "kegigihan") {
    teksRule.innerHTML =
      "<strong>Papan Kegigihan:</strong> Peringkat akumulasi soal diselesaikan dan jam terbang.";
    daftarSiswa.sort((a, b) =>
      b.total_soal !== a.total_soal
        ? b.total_soal - a.total_soal
        : b.total_durasi - a.total_durasi,
    );
    renderPapanKegigihan(daftarSiswa);
  } else if (tabAktif === "mastery") {
    teksRule.innerHTML =
      "<strong>Wall of Mastery:</strong> Mengukir nama yang berhasil mencetak skor ujian <strong>> 85</strong>.";
    renderWallOfMastery(daftarSiswa.filter((s) => s.skor_mastery.length >= 1));
  }
}

function renderPapanKegigihan(data) {
  if (data.length === 0)
    return (wadahLeaderboard.innerHTML = createEmptyKegigihanHTML());

  let htmlList = `<div class="rank-list">`;
  data.forEach((p, index) => {
    // Menyiapkan Variabel untuk dikirim ke View
    let ikonRank =
      index === 0
        ? "🔥"
        : index === 1
          ? "⭐"
          : index === 2
            ? "✨"
            : `#${index + 1}`;
    let gelarSiswa = mapGelarSiswa[p.nis] || DATA_DEFAULT.GELAR;
    let teksWaktu = formatWaktuBelajar(p.total_durasi);

    // 3. PANGGIL VIEW: Merakit baris ranking
    htmlList += createRankItemHTML(
      p.nama,
      p.total_soal,
      teksWaktu,
      index,
      ikonRank,
      gelarSiswa,
    );
  });
  wadahLeaderboard.innerHTML = htmlList + `</div>`;
}

function renderWallOfMastery(data) {
  if (data.length === 0)
    return (wadahLeaderboard.innerHTML = createEmptyMasteryHTML());

  let htmlGrid = `<div class="mastery-grid">`;
  data.forEach((p) => {
    let gelarSiswa = mapGelarSiswa[p.nis] || DATA_DEFAULT.GELAR;

    // 4. PANGGIL VIEW: Merakit kartu mastery
    htmlGrid += createMasteryCardHTML(
      p.nama,
      gelarSiswa,
      p.skor_mastery.length,
    );
  });
  wadahLeaderboard.innerHTML = htmlGrid + `</div>`;
}

// Event Listeners Dasar
tabKegigihan.addEventListener("click", () => {
  tabAktif = "kegigihan";
  tabKegigihan.className = "btn btn-primary";
  tabMastery.className = "btn btn-secondary";
  prosesTampilan();
});
tabMastery.addEventListener("click", () => {
  tabAktif = "mastery";
  tabMastery.className = "btn btn-primary";
  tabKegigihan.className = "btn btn-secondary";
  prosesTampilan();
});
document
  .getElementById("btn-kembali")
  ?.addEventListener(
    "click",
    () => (window.location.href = "dashboard-siswa.html"),
  );
muatDataLeaderboard();
