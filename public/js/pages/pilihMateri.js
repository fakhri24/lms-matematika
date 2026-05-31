// public/js/pages/pilihMateri.js

import { getMetadataSoal } from "../services/latihanService.js";
import {
  DAFTAR_MATERI_INTI,
  PETA_PRASYARAT_MANUAL,
  PETA_TAHAPAN,
} from "../utils/kurikulumData.js";
import { MODE_LATIHAN, DATA_DEFAULT } from "../utils/constants.js";

// IMPORT VIEW BARU
import {
  createTabButtonHTML,
  createTahapSeparatorHTML,
  createMateriCardHTML,
  createErrorStateHTML,
} from "../views/pilihMateriView.js";

// =====================================================================
// ENGINE PENGURUT MATERI CERDAS (GRAF TERISOLASI)
// =====================================================================
function bangunGraphKurikulum(dataBankSoalTab) {
  // (Logika Graph Tetap Sama - Tidak Diubah)
  const inDegree = {};
  const adjList = {};
  const semuaMateri = new Set();
  const namaAsliMap = {};
  const materiSahDiTabIni = new Set();

  dataBankSoalTab.forEach((data) => {
    if (data.sub_materi)
      materiSahDiTabIni.add(data.sub_materi.toLowerCase().trim());
  });

  dataBankSoalTab.forEach((data) => {
    if (!data.sub_materi) return;
    const subNormal = data.sub_materi.toLowerCase().trim();
    semuaMateri.add(subNormal);
    namaAsliMap[subNormal] = data.sub_materi;
    if (inDegree[subNormal] === undefined) inDegree[subNormal] = 0;
    if (!adjList[subNormal]) adjList[subNormal] = [];
  });

  dataBankSoalTab.forEach((data) => {
    if (!data.sub_materi) return;
    const targetAsli = data.sub_materi.trim();
    const targetLower = targetAsli.toLowerCase();
    let prasyaratArray = PETA_PRASYARAT_MANUAL[targetAsli] || [];

    prasyaratArray.forEach((p) => {
      const sumberLower = p.toLowerCase().trim();
      if (sumberLower !== "" && materiSahDiTabIni.has(sumberLower)) {
        if (!adjList[sumberLower]) {
          adjList[sumberLower] = [];
          inDegree[sumberLower] = 0;
        }
        if (!adjList[sumberLower].includes(targetLower)) {
          adjList[sumberLower].push(targetLower);
          inDegree[targetLower]++;
        }
      }
    });
  });

  return { inDegree, adjList, semuaMateri, namaAsliMap };
}

// =====================================================================
// FUNGSI UTAMA: MUAT, PISAHKAN TAB, DAN RENDER
// =====================================================================
async function muatMateri() {
  try {
    const metaDataMap = await getMetadataSoal();

    if (!metaDataMap) {
      document.getElementById("teks-loading").innerText =
        "Belum ada materi tersedia.";
      return;
    }

    const kelompokData = { Prasyarat: [] };
    DAFTAR_MATERI_INTI.forEach((materi) => (kelompokData[materi] = []));

    Object.values(metaDataMap).forEach((meta) => {
      const objekTiruan = { sub_materi: meta.nama_asli };
      if (DAFTAR_MATERI_INTI.includes(meta.materi_utama)) {
        kelompokData[meta.materi_utama].push(objekTiruan);
      } else {
        kelompokData["Prasyarat"].push(objekTiruan);
      }
    });

    const wadahTombol = document.getElementById("wadah-tombol-tab");
    const wadahKonten = document.getElementById("wadah-konten-tab");
    wadahTombol.innerHTML = "";
    wadahKonten.innerHTML = "";
    let tabPertamaAktif = false;
    const urutanTab = ["Prasyarat", ...DAFTAR_MATERI_INTI];

    urutanTab.forEach((namaTab) => {
      const dataTab = kelompokData[namaTab];
      if (dataTab.length === 0) return;

      // BFS Topological Sort
      const { inDegree, adjList, semuaMateri } = bangunGraphKurikulum(dataTab);
      const queue = [];
      const urutanHasil = [];

      semuaMateri.forEach((materi) => {
        if (inDegree[materi] === 0) queue.push(materi);
      });

      while (queue.length > 0) {
        const saatIni = queue.shift();
        urutanHasil.push(saatIni);
        adjList[saatIni].forEach((target) => {
          inDegree[target]--;
          if (inDegree[target] === 0) queue.push(target);
        });
      }

      const isAktif = !tabPertamaAktif;
      if (isAktif) tabPertamaAktif = true;
      const idTab = `tab-${namaTab.toLowerCase().replace(/\s+/g, "-")}`;

      // 1. PANGGIL VIEW: Tombol Tab
      wadahTombol.innerHTML += createTabButtonHTML(idTab, namaTab, isAktif);

      // Wrapper Tab Pane
      let htmlKonten = `<div id="${idTab}" class="tab-pane ${isAktif ? "active" : ""}">`;
      let tahapAktif = "";

      urutanHasil.forEach((subNormal) => {
        const meta = Object.values(metaDataMap).find(
          (m) => m.nama_asli.toLowerCase().trim() === subNormal,
        );
        if (!meta || meta.jumlah_soal === 0) return;

        const namaTahap =
          PETA_TAHAPAN[subNormal] || "Tahap Eksplorasi Lanjutan";
        if (namaTahap !== tahapAktif) {
          // 2. PANGGIL VIEW: Separator
          htmlKonten += createTahapSeparatorHTML(namaTahap);
          tahapAktif = namaTahap;
        }

        // 3. PANGGIL VIEW: Kartu Materi
        htmlKonten += createMateriCardHTML(
          meta.materi_utama,
          meta.nama_asli,
          meta.jumlah_soal,
        );
      });

      htmlKonten += `</div>`;
      wadahKonten.innerHTML += htmlKonten;
    });

    wadahTombol.style.display = "flex";
  } catch (error) {
    console.error("Gagal memuat materi:", error);
    document.getElementById("wadah-konten-tab").innerHTML =
      createErrorStateHTML();
  }
}

// =====================================================================
// MANAJEMEN EVENT LISTENER & DOM (Tetap Sama)
// =====================================================================
function ubahTampilanMode() {
  const mode = document.querySelector(
    'input[name="mode_latihan"]:checked',
  ).value;
  const labelFormatif = document.getElementById("label-formatif");
  const labelNormal = document.getElementById("label-normal");
  const labelAcak = document.getElementById("label-acak");

  [labelFormatif, labelNormal, labelAcak].forEach((label) => {
    if (label) {
      label.style.borderColor = "var(--border-color)";
      label.style.backgroundColor = "white";
      label.querySelector("strong").style.color = "var(--text-main)";
    }
  });

  let labelAktif;
  if (mode === MODE_LATIHAN.FORMATIF) labelAktif = labelFormatif;
  else if (mode === MODE_LATIHAN.NORMAL) labelAktif = labelNormal;
  else if (mode === MODE_LATIHAN.ACAK) labelAktif = labelAcak;

  if (labelAktif) {
    labelAktif.style.borderColor = "var(--primary-color)";
    labelAktif.style.backgroundColor = "#f0fdfa";
    labelAktif.querySelector("strong").style.color = "var(--primary-color)";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const btnKembali = document.getElementById("btn-kembali");
  if (btnKembali)
    btnKembali.addEventListener(
      "click",
      () => (window.location.href = "dashboard-siswa.html"),
    );

  document.querySelectorAll('input[name="mode_latihan"]').forEach((radio) => {
    radio.addEventListener("change", ubahTampilanMode);
  });
});

document.getElementById("wadah-tombol-tab").addEventListener("click", (e) => {
  const btn = e.target.closest(".tab-btn");
  if (btn) {
    const idTarget = btn.getAttribute("data-target");
    document
      .querySelectorAll(".tab-pane")
      .forEach((pane) => pane.classList.remove("active"));
    document
      .querySelectorAll(".tab-btn")
      .forEach((b) => b.classList.remove("active"));
    const targetPane = document.getElementById(idTarget);
    if (targetPane) targetPane.classList.add("active");
    btn.classList.add("active");
  }
});

document.getElementById("wadah-konten-tab").addEventListener("click", (e) => {
  const card = e.target.closest(".materi-card");
  if (card) {
    const materiUtama = card.getAttribute("data-materi");
    const subMateri = card.getAttribute("data-sub");
    const modeTerpilih = document.querySelector(
      'input[name="mode_latihan"]:checked',
    ).value;

    localStorage.setItem("mode_latihan", modeTerpilih);
    localStorage.setItem("materi_utama_aktif", materiUtama);
    localStorage.setItem("sub_materi_aktif", subMateri);

    if (
      subMateri === "Aturan Kuadran" &&
      modeTerpilih === MODE_LATIHAN.FORMATIF
    ) {
      window.location.href = "materi/trigonometri/aturan-kuadran/index.html";
    } else if (
      subMateri === "Sudut Berelasi (Horizontal)" &&
      modeTerpilih === MODE_LATIHAN.FORMATIF
    ) {
      window.location.href =
        "materi/trigonometri/sudut-berelasi-horizontal/index.html";
    } else if (
      subMateri === "Sudut Berelasi (Vertikal)" &&
      modeTerpilih === MODE_LATIHAN.FORMATIF
    ) {
      window.location.href =
        "materi/trigonometri/sudut-berelasi-vertikal/index.html";
    } else if (
      subMateri === "Sifat Sudut Negatif" &&
      modeTerpilih === MODE_LATIHAN.FORMATIF
    ) {
      window.location.href =
        "materi/trigonometri/sifat-sudut-negatif/index.html";
    } else if (
      subMateri === "Sudut Berelasi (Negatif dan >360°)" &&
      modeTerpilih === MODE_LATIHAN.FORMATIF
    ) {
      window.location.href =
        "materi/trigonometri/sudut-berelasi-negatif-360/index.html";
    } else {
      window.location.href = "latihan.html";
    }
  }
});

muatMateri();
