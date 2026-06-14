// public/js/pages/rekapHasil.js
import { getRiwayatLatihanAsc } from "../services/latihanService.js";
import {
  DATA_DEFAULT,
  MODE_LATIHAN,
  STATUS_LATIHAN,
} from "../utils/constants.js";

const nis = localStorage.getItem("nis_siswa");

let dataSiswaMentah = [];
let rekapMakro = {};
let rekapMikro = {};
let radarChartInstance = null;
let lineChartInstance = null;
let tabAktif = "sumatif";

const gantiTab = function (tabPilihan) {
  tabAktif = tabPilihan;
  document.getElementById("btn-tab-sumatif").className =
    tabPilihan === "sumatif" ? "btn btn-primary" : "btn btn-secondary";
  document.getElementById("btn-tab-formatif").className =
    tabPilihan === "formatif" ? "btn btn-primary" : "btn btn-secondary";
  document.getElementById("wadah-radar").style.display =
    tabPilihan === "sumatif" ? "block" : "none";
  updateTampilanLayar(false);
};

function getSemuaDataValid() {
  return dataSiswaMentah.filter((d) => d.status !== STATUS_LATIHAN.DRAF);
}

function saringDataBerdasarkanTab() {
  const dataValid = getSemuaDataValid();
  return dataValid.filter((d) => {
    const mode = d.mode_latihan || MODE_LATIHAN.NORMAL;
    if (tabAktif === "sumatif")
      return (
        mode === MODE_LATIHAN.NORMAL ||
        mode === MODE_LATIHAN.ACAK ||
        mode === MODE_LATIHAN.LAMA_NORMAL ||
        mode === MODE_LATIHAN.LAMA_ACAK
      );
    else return mode === MODE_LATIHAN.FORMATIF || mode === "latihan";
  });
}

window.updateTampilanLayar = function (hanyaUpdateRadar = false) {
  const semuaDataValid = getSemuaDataValid();
  const dataTersaring = saringDataBerdasarkanTab();

  if (!hanyaUpdateRadar) {
    let totalWaktuGlobal = 0;
    let totalSoalGlobal = 0;

    semuaDataValid.forEach((item) => {
      totalWaktuGlobal += item.durasi_detik || 0;
      const jmlJawaban = item.detail_jawaban
        ? Object.keys(item.detail_jawaban).length
        : 0;
      const jmlLog = item.log_percobaan
        ? Object.keys(item.log_percobaan).length
        : 0;
      totalSoalGlobal += Math.max(jmlJawaban, jmlLog);
    });

    document.getElementById("global-total-soal").innerText = totalSoalGlobal;
    const jam = Math.floor(totalWaktuGlobal / 3600);
    const menit = Math.floor((totalWaktuGlobal % 3600) / 60);
    document.getElementById("global-total-waktu").innerText =
      jam > 0
        ? `${jam}j ${menit}m`
        : menit > 0
          ? `${menit}m`
          : `${totalWaktuGlobal}s`;

    const teksLabel = tabAktif === "sumatif" ? "Ujian" : "Latihan";
    document.getElementById("label-sesi-tab").innerText = teksLabel;
    document.getElementById("label-rata-tab").innerText =
      teksLabel.toLowerCase();
    document.getElementById("tab-total-latihan").innerText =
      dataTersaring.length;

    let rataTerkini = 0;
    if (dataTersaring.length > 0) {
      const tigaTerakhir = dataTersaring.slice(-3);
      rataTerkini = Math.round(
        tigaTerakhir.reduce((sum, item) => sum + item.nilai, 0) /
          tigaTerakhir.length,
      );
    }
    document.getElementById("tab-rata-terkini").innerText = rataTerkini;

    rekapMakro = {};
    rekapMikro = {};
    const setMateriUtama = new Set();
    const filterRadarEl = document.getElementById("filter-radar-siswa");
    const filterRentangEl = document.getElementById("filter-rentang-siswa");
    const nilaiRadarLama = filterRadarEl.value;

    dataTersaring.forEach((item) => {
      const matUtama = item.materi_utama || "Umum";
      const subMat = item.sub_materi || "Latihan";
      setMateriUtama.add(matUtama);

      if (!rekapMakro[matUtama]) rekapMakro[matUtama] = { total: 0, count: 0 };
      rekapMakro[matUtama].total += item.nilai;
      rekapMakro[matUtama].count++;

      if (!rekapMikro[matUtama]) rekapMikro[matUtama] = {};
      if (!rekapMikro[matUtama][subMat])
        rekapMikro[matUtama][subMat] = { total: 0, count: 0 };
      rekapMikro[matUtama][subMat].total += item.nilai;
      rekapMikro[matUtama][subMat].count++;
    });

    filterRadarEl.innerHTML = '<option value="makro">Makro (Semua)</option>';
    setMateriUtama.forEach(
      (m) =>
        (filterRadarEl.innerHTML += `<option value="${m}">Mikro: ${m}</option>`),
    );
    filterRadarEl.value = setMateriUtama.has(nilaiRadarLama)
      ? nilaiRadarLama
      : "makro";

    renderLineChart(filterRentangEl.value, dataTersaring);
  }

  if (tabAktif === "sumatif")
    renderRadarChart(document.getElementById("filter-radar-siswa").value);
};

async function muatRekapHasil() {
  try {
    dataSiswaMentah = await getRiwayatLatihanAsc(nis);
    if (dataSiswaMentah.length === 0) {
      alert("Belum ada data latihan. Yuk, cobain latihan pertamamu!");
      window.location.href = "dashboard-siswa.html";
      return;
    }
    updateTampilanLayar();
  } catch (err) {
    console.error("Gagal memuat rekap:", err);
  }
}

function renderLineChart(modeRentang, dataTersaring) {
  if (lineChartInstance) lineChartInstance.destroy();
  let dataTampil = dataTersaring;
  let startIndex = 0;

  if (modeRentang === "10" && dataTersaring.length > 10) {
    dataTampil = dataTersaring.slice(-10);
    startIndex = dataTersaring.length - 10;
  }

  const ctx = document.getElementById("lineChartSiswa").getContext("2d");
  lineChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: dataTampil.map((_, i) => `Lat ${startIndex + i + 1}`),
      datasets: [
        {
          label: "Skor",
          data: dataTampil.map((item) => item.nilai),
          borderColor: tabAktif === "sumatif" ? "#0d9488" : "#f59e0b",
          backgroundColor:
            tabAktif === "sumatif"
              ? "rgba(13, 148, 136, 0.1)"
              : "rgba(245, 158, 11, 0.1)",
          fill: true,
          tension: 0.3,
          pointRadius: 5,
        },
      ],
    },
    options: {
      scales: { y: { beginAtZero: true, max: 100 } },
      plugins: { legend: { display: false } },
    },
  });
}

function renderRadarChart(modeRadar) {
  if (radarChartInstance) radarChartInstance.destroy();
  let labels = [],
    dataPoin = [];
  const isMakro = modeRadar === "makro";

  if (isMakro) {
    labels = Object.keys(rekapMakro);
    dataPoin = labels.map((l) =>
      Math.round(rekapMakro[l].total / rekapMakro[l].count),
    );
  } else {
    if (!rekapMikro[modeRadar]) return;
    labels = Object.keys(rekapMikro[modeRadar]);
    dataPoin = labels.map((l) =>
      Math.round(
        rekapMikro[modeRadar][l].total / rekapMikro[modeRadar][l].count,
      ),
    );
  }

  const ctx = document.getElementById("radarChartSiswa").getContext("2d");
  radarChartInstance = new Chart(ctx, {
    type: "radar",
    data: {
      labels: labels,
      datasets: [
        {
          label: isMakro ? "Rata-rata Makro (%)" : `Detail ${modeRadar} (%)`,
          data: dataPoin,
          backgroundColor: isMakro
            ? "rgba(13, 148, 136, 0.2)"
            : "rgba(16, 185, 129, 0.2)",
          borderColor: isMakro ? "#0d9488" : "#10b981",
          pointBackgroundColor: isMakro ? "#0f766e" : "#059669",
        },
      ],
    },
    options: {
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: { display: false, stepSize: 20 },
        },
      },
      plugins: { legend: { display: false } },
    },
  });
}

muatRekapHasil();

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("btn-kembali")
    ?.addEventListener(
      "click",
      () => (window.location.href = "dashboard-siswa.html"),
    );
  document
    .getElementById("btn-tab-sumatif")
    ?.addEventListener("click", () => gantiTab("sumatif"));
  document
    .getElementById("btn-tab-formatif")
    ?.addEventListener("click", () => gantiTab("formatif"));
  document
    .getElementById("filter-rentang-siswa")
    ?.addEventListener("change", () => updateTampilanLayar(false));
  document
    .getElementById("filter-radar-siswa")
    ?.addEventListener("change", () => updateTampilanLayar(true));
});
