// public/js/admin/analisisController.js

import { state } from "./adminState.js";
import { updateStatistikEmpirisSoal } from "../services/adminService.js";
import { renderTabelBankSoal } from "./bankSoalController.js";
import {
  DATA_DEFAULT,
  MODE_LATIHAN,
  STATUS_LATIHAN,
} from "../utils/constants.js";
// IMPORT VIEW BARU
import {
  createRowRiwayatGlobalHTML,
  createSaranPencarianHTML,
  createRowDetailSiswaHTML,
} from "../views/adminAnalisisView.js";
import { getKetuntasanDataForExport } from "./ketuntasanController.js";

// State Lokal untuk Paginasi & Detail
let halamanSaatIni = 1;
const barisPerHalaman = 10;
let dataDetailSiswaAktif = [];
let halamanDetailSiswa = 1;
const barisPerHalamanDetail = 10;

let grafikLineAktif = null;
let grafikRadarAktif = null;
let nisAnalisisAktif = null;

// ==========================================
// 1. TABEL RIWAYAT & DETAIL SISWA
// ==========================================
export function renderTabelRiwayat() {
  const tabelHasil = document.getElementById("tabel-hasil");
  if (!tabelHasil) return;
  tabelHasil.innerHTML = "";

  const dataUnik = [];
  const nisDitemukan = new Set();

  state.dataTabelAktif.forEach((item) => {
    if (!nisDitemukan.has(item.nis_siswa)) {
      nisDitemukan.add(item.nis_siswa);
      const total = state.dataMentah.filter(
        (d) => d.nis_siswa === item.nis_siswa,
      ).length;
      dataUnik.push({ ...item, total_latihan: total });
    }
  });

  if (dataUnik.length === 0) {
    tabelHasil.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 30px;">Tidak ada data ditemukan.</td></tr>`;
    return;
  }

  const totalHalaman = Math.ceil(dataUnik.length / barisPerHalaman);
  const dataHalamanIni = dataUnik.slice(
    (halamanSaatIni - 1) * barisPerHalaman,
    halamanSaatIni * barisPerHalaman,
  );

  dataHalamanIni.forEach((data) => {
    const statusPengerjaan = data.status || STATUS_LATIHAN.SELESAI;
    const warnaBadge = data.nilai >= 75 ? "var(--success-color)" : "#ef4444";
    let teksNilai = `<span class="badge-nilai" style="background-color: ${warnaBadge};">${data.nilai}</span>`;

    if (statusPengerjaan === STATUS_LATIHAN.DRAF) {
      teksNilai = `<span class="badge-nilai" style="background-color: #f59e0b; color: white;" title="Sedang Dikerjakan">⏳ ${data.nilai}</span>`;
    }

    // --- TAMBAHKAN LOGIKA PENENTUAN MODE DI SINI ---
    let labelMode = '<span class="badge badge-info">🎯 Sumatif (Normal)</span>';
    if (data.mode_latihan === MODE_LATIHAN.FORMATIF) {
      labelMode = '<span class="badge badge-warning">🛠️ Formatif</span>';
    } else if (data.mode_latihan === MODE_LATIHAN.ACAK) {
      labelMode = '<span class="badge badge-danger">🎲 Sumatif (Acak)</span>';
    }

    // Kirim variabel labelMode ke dalam View
    tabelHasil.innerHTML += createRowRiwayatGlobalHTML(
      data,
      teksNilai,
      labelMode,
    );
  });

  const sisaBaris = barisPerHalaman - dataHalamanIni.length;
  const dummyRowHTML = `
    <tr class="dummy-row">
      <td colspan="6">
        <div style="visibility: hidden; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div class="text-sm">X</div>
            <div style="font-size: 0.85rem;">X</div>
            <div style="font-size: 0.75rem; margin-top: 2px;">X</div>
          </div>
          <button class="btn btn-sm" style="padding: 4px 10px;">X</button>
        </div>
      </td>
    </tr>
  `;
  for (let i = 0; i < sisaBaris; i++) {
    tabelHasil.innerHTML += dummyRowHTML;
  }

  const infoHalaman = document.getElementById("info-halaman");
  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");
  if (infoHalaman)
    infoHalaman.innerText = `Halaman ${halamanSaatIni} dari ${totalHalaman}`;
  if (btnPrev) btnPrev.disabled = halamanSaatIni === 1;
  if (btnNext)
    btnNext.disabled = halamanSaatIni === totalHalaman || totalHalaman === 0;
}

export function lihatDetailSiswa(nis, nama) {
  dataDetailSiswaAktif = state.dataMentah.filter((d) => d.nis_siswa === nis);
  halamanDetailSiswa = 1;
  document.getElementById("judul-detail-siswa").innerText = nama;
  document.getElementById("subjudul-detail-siswa").innerText = `NIS: ${nis}`;

  const dataValid = dataDetailSiswaAktif.filter(
    (d) => d.status !== STATUS_LATIHAN.DRAF,
  );

  let totalWaktu = 0;
  let totalSoal = 0;
  dataValid.forEach((d) => {
    totalWaktu += d.durasi_detik || 0;
    const jmlJawaban = d.detail_jawaban
      ? Object.keys(d.detail_jawaban).length
      : 0;
    const jmlLog = d.log_percobaan ? Object.keys(d.log_percobaan).length : 0;
    totalSoal += Math.max(jmlJawaban, jmlLog);
  });

  document.getElementById("admin-detail-latihan").innerText = dataValid.length;
  document.getElementById("admin-detail-soal").innerText = totalSoal;

  const jam = Math.floor(totalWaktu / 3600);
  const mnt = Math.floor((totalWaktu % 3600) / 60);
  document.getElementById("admin-detail-waktu").innerText =
    jam > 0 ? `${jam}j ${mnt}m` : mnt > 0 ? `${mnt}m` : `${totalWaktu}s`;

  const profil = state.profilSiswa ? state.profilSiswa.find((p) => p.id === nis) : null;
  const sesi = profil && profil.sesi_terakhir ? profil.sesi_terakhir : null;
  
  const elemLogin = document.getElementById("admin-detail-waktu-login");
  const elemDurasi = document.getElementById("admin-detail-durasi-login");
  const elemLogout = document.getElementById("admin-detail-waktu-logout");
  
  if (sesi) {
    const formatWaktu = (isoStr) => {
      if (!isoStr) return "-";
      return new Date(isoStr).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    };
    
    let isAktif = false;
    if (sesi.waktu_logout) {
      const logoutTime = new Date(sesi.waktu_logout).getTime();
      if (Date.now() - logoutTime < 120000) isAktif = true; // Dianggap aktif jika < 2 menit
    }
    
    if (elemLogin) elemLogin.innerText = formatWaktu(sesi.waktu_login);
    if (elemLogout) elemLogout.innerText = isAktif ? "-" : formatWaktu(sesi.waktu_logout);
    
    if (elemDurasi) {
      const durasiDetik = sesi.durasi_aktif_detik || 0;
      const jam = Math.floor(durasiDetik / 3600);
      const mnt = Math.floor((durasiDetik % 3600) / 60);
      elemDurasi.innerText = jam > 0 ? `${jam}j ${mnt}m` : mnt > 0 ? `${mnt}m` : `${durasiDetik}s`;
    }
  } else {
    if (elemLogin) elemLogin.innerText = "-";
    if (elemLogout) elemLogout.innerText = "-";
    if (elemDurasi) elemDurasi.innerText = "-";
  }


  let rata = 0;
  if (dataValid.length > 0) {
    const tigaTerakhir = dataValid.slice(0, 3);
    const sum = tigaTerakhir.reduce((acc, curr) => acc + curr.nilai, 0);
    rata = Math.round(sum / tigaTerakhir.length);
  }
  document.getElementById("admin-detail-rata").innerText = rata;

  document.getElementById("modal-detail-siswa").style.display = "flex";
  renderTabelDetailSiswa();
}

export function renderTabelDetailSiswa() {
  const tbody = document.getElementById("tabel-detail-siswa");
  if (!tbody) return;
  tbody.innerHTML = "";
  const totalHalaman = Math.ceil(
    dataDetailSiswaAktif.length / barisPerHalamanDetail,
  );
  const dataHalamanIni = dataDetailSiswaAktif.slice(
    (halamanDetailSiswa - 1) * barisPerHalamanDetail,
    halamanDetailSiswa * barisPerHalamanDetail,
  );

  dataHalamanIni.forEach((data) => {
    const waktu = new Date(data.waktu_submit).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    const jmlJawaban = data.detail_jawaban
      ? Object.keys(data.detail_jawaban).length
      : 0;
    const jmlLog = data.log_percobaan
      ? Object.keys(data.log_percobaan).length
      : 0;
    const jumlahSoal = Math.max(jmlJawaban, jmlLog);
    const durasiDetik = data.durasi_detik || 0;
    const menit = Math.floor(durasiDetik / 60);
    const detik = durasiDetik % 60;
    const teksDurasi = menit > 0 ? `${menit}m ${detik}s` : `${detik}s`;

    // Membersihkan Inline CSS Mode Latihan menggunakan .badge
    let labelMode = '<span class="badge badge-info">🎯 Normal</span>';
    if (data.mode_latihan === MODE_LATIHAN.FORMATIF)
      labelMode = '<span class="badge badge-warning">🧭 Formatif</span>';
    else if (data.mode_latihan === MODE_LATIHAN.ACAK)
      labelMode = '<span class="badge badge-danger">🎲 Acak</span>';

    const statusPengerjaan = data.status || STATUS_LATIHAN.SELESAI;
    const warnaBadge = data.nilai >= 75 ? "var(--success-color)" : "#ef4444";
    let teksNilai = `<span class="badge-nilai" style="background-color: ${warnaBadge};">${data.nilai}</span>`;
    let infoStatus = "";

    // Membersihkan Inline CSS Info Status
    if (statusPengerjaan === STATUS_LATIHAN.DRAF) {
      teksNilai = `<span class="text-warning font-bold" style="font-style: italic;">${data.nilai} (Smntr)</span>`;
      infoStatus = `<br><span class="badge badge-warning" style="margin-top: 5px;">⏳ Sedang Dikerjakan</span>`;
    } else {
      infoStatus = `<br><span class="badge badge-success" style="margin-top: 5px;">✅ Selesai</span>`;
    }

    tbody.innerHTML += createRowDetailSiswaHTML(
      data,
      waktu,
      teksDurasi,
      labelMode,
      infoStatus,
      teksNilai,
      jumlahSoal,
    );
  });

  const sisaBarisDetail = barisPerHalamanDetail - dataHalamanIni.length;
  const dummyRowDetail = `
    <tr class="dummy-row">
      <td colspan="6">
        <div style="visibility: hidden;">
          <div style="font-size: 0.9rem;">X</div>
          <div style="font-size: 0.8rem;">X</div>
        </div>
      </td>
    </tr>
  `;
  for (let i = 0; i < sisaBarisDetail; i++) {
    tbody.innerHTML += dummyRowDetail;
  }

  const infoHal = document.getElementById("info-halaman-detail");
  const btnPrev = document.getElementById("btn-prev-detail");
  const btnNext = document.getElementById("btn-next-detail");
  if (infoHal)
    infoHal.innerText = `Halaman ${halamanDetailSiswa} dari ${totalHalaman}`;
  if (btnPrev) btnPrev.disabled = halamanDetailSiswa === 1;
  if (btnNext)
    btnNext.disabled =
      halamanDetailSiswa === totalHalaman || totalHalaman === 0;
}

export function refreshTampilanRiwayat() {
  const searchInput = document.getElementById("search-siswa");
  const filterKelas = document.getElementById("filter-kelas-riwayat")?.value || "";
  const keyword = searchInput ? searchInput.value.toLowerCase() : "";
  
  state.dataTabelAktif = state.dataMentah.filter((d) => {
    let matchesKeyword = true;
    if (keyword) {
      matchesKeyword = (d.nama_siswa || "").toLowerCase().includes(keyword) ||
          (d.nis_siswa || "").toLowerCase().includes(keyword) ||
          (d.sub_materi || "").toLowerCase().includes(keyword);
    }
    
    let matchesKelas = true;
    if (filterKelas) {
      const profil = state.profilSiswa ? state.profilSiswa.find(p => p.id === d.nis_siswa) : null;
      const kelasSiswa = profil ? profil.kelas : null;
      matchesKelas = (kelasSiswa === filterKelas);
    }
    
    return matchesKeyword && matchesKelas;
  });
  
  renderTabelRiwayat();
  prosesAnalisisSoalLokal();

  const modalDetail = document.getElementById("modal-detail-siswa");
  if (modalDetail && modalDetail.style.display === "flex" && dataDetailSiswaAktif.length > 0) {
    const nisTarget = dataDetailSiswaAktif[0].nis_siswa;
    const namaTarget = document.getElementById("judul-detail-siswa").innerText;
    lihatDetailSiswa(nisTarget, namaTarget);
  }

  if (nisAnalisisAktif && document.getElementById("wadah-kotak-analisis")?.style.display !== "none") {
    renderGrafikSiswa(nisAnalisisAktif);
  }
}

export function tutupModalDetail() {
  document.getElementById("modal-detail-siswa").style.display = "none";
}

// ==========================================
// 2. GRAFIK PERFORMA (CHART.JS)
// ==========================================
export function renderGrafikSiswa(nisTarget) {
  if (grafikLineAktif) grafikLineAktif.destroy();
  if (grafikRadarAktif) grafikRadarAktif.destroy();
  nisAnalisisAktif = nisTarget;

  const wadahKotak = document.getElementById("wadah-kotak-analisis");
  const filterRadar = document.getElementById("filter-radar");
  const filterRentang = document.getElementById("filter-rentang-line");
  const filterModeAnalisis = document.getElementById("filter-mode-analisis");

  if (!nisTarget) {
    if (filterRadar) filterRadar.disabled = true;
    if (filterRentang) filterRentang.disabled = true;
    if (filterModeAnalisis) filterModeAnalisis.disabled = true;
    if (wadahKotak) wadahKotak.style.display = "none";
    return;
  }

  if (filterModeAnalisis) filterModeAnalisis.disabled = false;
  if (wadahKotak) wadahKotak.style.display = "grid";

  let semuaDataSiswa = state.dataMentah.filter(
    (item) =>
      item.nis_siswa === nisTarget && item.status !== STATUS_LATIHAN.DRAF,
  );

  let totalWaktuGlobal = 0;
  let totalSoalGlobal = 0;
  semuaDataSiswa.forEach((d) => {
    totalWaktuGlobal += d.durasi_detik || 0;
    const jmlJawaban = d.detail_jawaban
      ? Object.keys(d.detail_jawaban).length
      : 0;
    const jmlLog = d.log_percobaan ? Object.keys(d.log_percobaan).length : 0;
    totalSoalGlobal += Math.max(jmlJawaban, jmlLog);
  });

  document.getElementById("analisis-soal").innerText = totalSoalGlobal;
  const jam = Math.floor(totalWaktuGlobal / 3600);
  const mnt = Math.floor((totalWaktuGlobal % 3600) / 60);
  document.getElementById("analisis-waktu").innerText =
    jam > 0 ? `${jam}j ${mnt}m` : mnt > 0 ? `${mnt}m` : `${totalWaktuGlobal}s`;

  const modeDipilih = filterModeAnalisis ? filterModeAnalisis.value : "sumatif";
  let dataSiswaTersaring = semuaDataSiswa.filter((d) => {
    const mode = d.mode_latihan || MODE_LATIHAN.NORMAL;
    if (modeDipilih === "sumatif")
      return (
        mode === MODE_LATIHAN.NORMAL ||
        mode === MODE_LATIHAN.ACAK ||
        mode === MODE_LATIHAN.LAMA_NORMAL ||
        mode === MODE_LATIHAN.LAMA_ACAK
      );
    else
      return (
        mode === MODE_LATIHAN.FORMATIF || mode === MODE_LATIHAN.LAMA_LATIHAN
      );
  });

  document.getElementById("label-analisis-sesi").innerText =
    modeDipilih === "sumatif" ? "(Ujian)" : "(Latihan)";
  document.getElementById("analisis-latihan").innerText =
    dataSiswaTersaring.length;

  let rata = 0;
  if (dataSiswaTersaring.length > 0) {
    const tigaTerakhir = dataSiswaTersaring.slice(0, 3);
    const sum = tigaTerakhir.reduce((acc, curr) => acc + curr.nilai, 0);
    rata = Math.round(sum / tigaTerakhir.length);
  }
  document.getElementById("analisis-rata").innerText = rata;

  const dataKronologis = [...dataSiswaTersaring].reverse();
  if (filterRentang) filterRentang.disabled = false;

  const ctxRadar = document.getElementById("grafikRadarSiswa");
  if (ctxRadar) {
    const divRadar = ctxRadar.parentElement;
    if (modeDipilih === "formatif") {
      divRadar.style.display = "none";
    } else {
      divRadar.style.display = "block";
      if (filterRadar) filterRadar.disabled = false;
      const rekapMakro = {},
        rekapMikro = {};
      const daftarMateriUtama = new Set();

      dataSiswaTersaring.forEach((item) => {
        const matUtama = item.materi_utama || DATA_DEFAULT.MATERI,
          subMat = item.sub_materi || item.materi_uji || "Campuran";
        daftarMateriUtama.add(matUtama);

        if (!rekapMakro[matUtama])
          rekapMakro[matUtama] = { total: 0, count: 0 };
        rekapMakro[matUtama].total += item.nilai;
        rekapMakro[matUtama].count++;

        if (!rekapMikro[matUtama]) rekapMikro[matUtama] = {};
        if (!rekapMikro[matUtama][subMat])
          rekapMikro[matUtama][subMat] = { total: 0, count: 0 };
        rekapMikro[matUtama][subMat].total += item.nilai;
        rekapMikro[matUtama][subMat].count++;
      });

      if (filterRadar) {
        filterRadar.innerHTML =
          '<option value="makro">Makro (Semua Materi)</option>';
        daftarMateriUtama.forEach(
          (m) =>
            (filterRadar.innerHTML += `<option value="${m}">Mikro: ${m}</option>`),
        );
      }

      function gambarRadar(mode) {
        if (grafikRadarAktif) grafikRadarAktif.destroy();
        let labels =
          mode === "makro"
            ? Object.keys(rekapMakro)
            : Object.keys(rekapMikro[mode]);
        let dataPoin =
          mode === "makro"
            ? labels.map((m) =>
                Math.round(rekapMakro[m].total / rekapMakro[m].count),
              )
            : labels.map((s) =>
                Math.round(
                  rekapMikro[mode][s].total / rekapMikro[mode][s].count,
                ),
              );

        grafikRadarAktif = new Chart(
          document.getElementById("grafikRadarSiswa").getContext("2d"),
          {
            type: "radar",
            data: {
              labels: labels,
              datasets: [
                {
                  label: "Penguasaan",
                  data: dataPoin,
                  backgroundColor: "rgba(59, 130, 246, 0.2)",
                  borderColor: "#3b82f6",
                },
              ],
            },
            options: {
              scales: {
                r: { beginAtZero: true, max: 100, ticks: { display: false } },
              },
              plugins: { legend: { display: false } },
            },
          },
        );
      }

      gambarRadar("makro");
      if (filterRadar)
        filterRadar.onchange = (e) => gambarRadar(e.target.value);
    }
  }

  function gambarLine(mode) {
    if (grafikLineAktif) grafikLineAktif.destroy();
    let dataTampil = dataKronologis;
    let startIndex = 0;
    if (mode === "10" && dataKronologis.length > 10) {
      dataTampil = dataKronologis.slice(-10);
      startIndex = dataKronologis.length - 10;
    }
    const warnaGaris = modeDipilih === "sumatif" ? "#3b82f6" : "#f59e0b";
    const warnaBG =
      modeDipilih === "sumatif"
        ? "rgba(59, 130, 246, 0.1)"
        : "rgba(245, 158, 11, 0.1)";

    const ctxLine = document.getElementById("grafikPerkembangan");
    if (ctxLine) {
      grafikLineAktif = new Chart(ctxLine.getContext("2d"), {
        type: "line",
        data: {
          labels: dataTampil.map((_, i) => `Lat ${startIndex + i + 1}`),
          datasets: [
            {
              label: "Skor",
              data: dataTampil.map((d) => d.nilai),
              borderColor: warnaGaris,
              backgroundColor: warnaBG,
              fill: true,
              tension: 0.3,
            },
          ],
        },
        options: { scales: { y: { beginAtZero: true, max: 100 } } },
      });
    }
  }

  gambarLine(filterRentang ? filterRentang.value : "10");
  if (filterRentang) filterRentang.onchange = (e) => gambarLine(e.target.value);
}

// ==========================================
// 3. ANALISIS SOAL LOKAL (ROBOT KALIBRASI 2D)
// ==========================================
export function prosesAnalisisSoalLokal() {
  try {
    const BATAS_INKUBASI = 30;
    const petaSoal = {};
    const petaMateriAnalisis = {};

    state.dataBankSoalMentah.forEach((d) => {
      const m = d.materi_utama || DATA_DEFAULT.MATERI;
      const sub = d.sub_materi || DATA_DEFAULT.SUB_MATERI;

      if (!petaMateriAnalisis[m]) petaMateriAnalisis[m] = new Set();
      petaMateriAnalisis[m].add(sub);

      petaSoal[d.id] = {
        pertanyaan: d.pertanyaan,
        jawaban_benar: d.jawaban_benar,
        sub_materi: sub,
        konsep_prasyarat: d.konsep_prasyarat || "-",
        tingkat_kesulitan: d.tingkat_kesulitan || 1,
        tingkat_kesulitan_empiris: d.tingkat_kesulitan_empiris || null,
        win_rate: d.win_rate || 0,
        total_dijawab: 0,
        total_benar: 0,
        formatif_mandiri: 0,
        formatif_clue: 0,
        formatif_mentok: 0,
        formatif_total: 0,
        total_waktu_detik: 0,
        total_dilihat: 0,
      };
    });

    state.dataMentah.forEach((data) => {
      if (data.status === STATUS_LATIHAN.DRAF) return;
      const mode = data.mode_latihan || MODE_LATIHAN.NORMAL;

      if (data.log_percobaan) {
        for (const [idSoal, log] of Object.entries(data.log_percobaan)) {
          if (petaSoal[idSoal] && log.durasi_detik) {
            petaSoal[idSoal].total_waktu_detik += log.durasi_detik;
            petaSoal[idSoal].total_dilihat++;
          }
        }
      }

      if (mode === MODE_LATIHAN.FORMATIF) {
        if (data.log_percobaan) {
          for (const [idSoal, log] of Object.entries(data.log_percobaan)) {
            if (
              petaSoal[idSoal] &&
              (log.status_selesai === true || log.lihat_bahas === true)
            ) {
              petaSoal[idSoal].formatif_total++;
              if (log.skor_soal === 100) petaSoal[idSoal].formatif_mandiri++;
              else if (log.skor_soal === 70) petaSoal[idSoal].formatif_clue++;
              else petaSoal[idSoal].formatif_mentok++;
            }
          }
        }
      } else {
        if (data.detail_jawaban) {
          for (const [idSoal, jawabanSiswa] of Object.entries(
            data.detail_jawaban,
          )) {
            if (petaSoal[idSoal]) {
              petaSoal[idSoal].total_dijawab++;
              if (jawabanSiswa === petaSoal[idSoal].jawaban_benar)
                petaSoal[idSoal].total_benar++;
            }
          }
        }
      }
    });

    state.dataAnalisisSoalEkspor = petaSoal;
    let adaPerubahanLevel = false;

    state.dataBankSoalMentah.forEach(async (soal) => {
      const dataAnalisis = petaSoal[soal.id];
      if (!dataAnalisis || dataAnalisis.total_dijawab < BATAS_INKUBASI) return;

      const persentaseBenar = Math.round(
        (dataAnalisis.total_benar / dataAnalisis.total_dijawab) * 100,
      );
      let levelDataDriven = 1;
      if (persentaseBenar <= 40) levelDataDriven = 3;
      else if (persentaseBenar <= 70) levelDataDriven = 2;

      if (soal.tingkat_kesulitan_empiris !== levelDataDriven) {
        soal.tingkat_kesulitan_empiris = levelDataDriven;
        soal.win_rate = persentaseBenar;
        adaPerubahanLevel = true;
        if (petaSoal[soal.id]) {
          petaSoal[soal.id].tingkat_kesulitan_empiris = levelDataDriven;
          petaSoal[soal.id].win_rate = persentaseBenar;
        }
        try {
          await updateStatistikEmpirisSoal(
            soal.id,
            levelDataDriven,
            persentaseBenar,
          );
        } catch (err) {
          console.error("Gagal update data empiris:", err);
        }
      }
    });

    if (adaPerubahanLevel) renderTabelBankSoal();

    const dropdownMateri = document.getElementById("filter-materi-soal");
    const dropdownSub = document.getElementById("filter-submateri-soal");
    const dropdownPerspektif = document.getElementById(
      "filter-perspektif-soal",
    );
    const teksDeskripsi = document.getElementById("deskripsi-grafik-soal");

    if (dropdownMateri) {
      dropdownMateri.innerHTML =
        '<option value="">-- Pilih Materi Utama --</option>';
      Object.keys(petaMateriAnalisis)
        .sort()
        .forEach((m) => {
          dropdownMateri.innerHTML += `<option value="${m}">${m}</option>`;
        });

      dropdownMateri.addEventListener("change", function () {
        const materiTerpilih = this.value;
        dropdownSub.innerHTML =
          '<option value="">-- Pilih Sub-Materi --</option>';
        if (materiTerpilih !== "" && petaMateriAnalisis[materiTerpilih]) {
          Array.from(petaMateriAnalisis[materiTerpilih])
            .sort()
            .forEach((sm) => {
              dropdownSub.innerHTML += `<option value="${sm}">${sm}</option>`;
            });
        }
        const grafikLama = Chart.getChart("grafikTingkatKesulitan");
        if (grafikLama) grafikLama.destroy();
      });
    }

    const renderGrafikSoal = function () {
      if (!dropdownSub || !dropdownPerspektif) return;
      const subMateriDipilih = dropdownSub.value;
      const perspektif = dropdownPerspektif.value;

      const grafikLama = Chart.getChart("grafikTingkatKesulitan");
      if (grafikLama) grafikLama.destroy();
      if (!subMateriDipilih) return;

      const soalTerkait = Object.values(petaSoal).filter(
        (s) => s.sub_materi === subMateriDipilih,
      );
      const labels = soalTerkait.map((_, i) => `Soal ${i + 1}`);
      const teksSoalPendek = soalTerkait.map((s) =>
        s.pertanyaan.length > 50
          ? s.pertanyaan.substring(0, 50) + "..."
          : s.pertanyaan,
      );
      const rataWaktuData = soalTerkait.map((s) => {
        if (s.total_dilihat === 0) return "0s";
        const rata = Math.round(s.total_waktu_detik / s.total_dilihat);
        const m = Math.floor(rata / 60);
        const d = rata % 60;
        return m > 0 ? `${m}m ${d}s` : `${d}s`;
      });

      const canvasEl = document.getElementById("grafikTingkatKesulitan");
      if (!canvasEl) return;
      const ctx = canvasEl.getContext("2d");

      if (perspektif === "sumatif") {
        teksDeskripsi.innerHTML =
          "Menunjukkan tingkat kesulitan soal murni dari tes. <span style='color: #10b981; font-weight: bold'>Hijau (>70%)</span>: Mudah, <span style='color: #f59e0b; font-weight: bold'>Kuning (41-70%)</span>: Sedang, <span style='color: #ef4444; font-weight: bold'>Merah (<= 40%)</span>: Sulit.";
        const persentaseBenar = soalTerkait.map((s) =>
          s.total_dijawab === 0
            ? 0
            : Math.round((s.total_benar / s.total_dijawab) * 100),
        );
        new Chart(ctx, {
          type: "bar",
          data: {
            labels: labels,
            datasets: [
              {
                label: "Persentase Benar",
                data: persentaseBenar,
                backgroundColor: persentaseBenar.map((val) => {
                  if (val <= 40) return "rgba(239, 68, 68, 0.7)";
                  if (val <= 70) return "rgba(245, 158, 11, 0.7)";
                  return "rgba(16, 185, 129, 0.7)";
                }),
                borderRadius: 6,
              },
            ],
          },
          options: {
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, max: 100 } },
            plugins: {
              tooltip: {
                callbacks: {
                  title: function (t) {
                    return teksSoalPendek[t[0].dataIndex];
                  },
                  label: function (c) {
                    return ` Benar: ${c.raw}%`;
                  },
                  footer: function (t) {
                    const idx = t[0].dataIndex;
                    const dataSoal = soalTerkait[idx];
                    return `  Rata-rata pengerjaan: ${rataWaktuData[idx]}\n  Level Sistem: ${dataSoal.tingkat_kesulitan} | Level Empiris: ${dataSoal.tingkat_kesulitan_empiris || dataSoal.tingkat_kesulitan}`;
                  },
                },
              },
            },
          },
        });
      } else {
        teksDeskripsi.innerHTML =
          "Evaluasi bantuan belajar. <span style='color: #10b981; font-weight: bold'>Hijau</span>: Lolos tanpa bantuan. <span style='color: #f59e0b; font-weight: bold'>Kuning</span>: Berhasil setelah diberi Clue. <span style='color: #ef4444; font-weight: bold'>Merah</span>: Gagal / Nyerah buka pembahasan.";
        const pctMandiri = soalTerkait.map((s) =>
          s.formatif_total === 0
            ? 0
            : Math.round((s.formatif_mandiri / s.formatif_total) * 100),
        );
        const pctClue = soalTerkait.map((s) =>
          s.formatif_total === 0
            ? 0
            : Math.round((s.formatif_clue / s.formatif_total) * 100),
        );
        const pctMentok = soalTerkait.map((s) =>
          s.formatif_total === 0
            ? 0
            : Math.round((s.formatif_mentok / s.formatif_total) * 100),
        );
        new Chart(ctx, {
          type: "bar",
          data: {
            labels: labels,
            datasets: [
              {
                label: "Lolos Mandiri",
                data: pctMandiri,
                backgroundColor: "rgba(16, 185, 129, 0.8)",
              },
              {
                label: "Butuh Clue",
                data: pctClue,
                backgroundColor: "rgba(245, 158, 11, 0.8)",
              },
              {
                label: "Mentok / Nyerah",
                data: pctMentok,
                backgroundColor: "rgba(239, 68, 68, 0.8)",
              },
            ],
          },
          options: {
            maintainAspectRatio: false,
            scales: {
              x: { stacked: true },
              y: { stacked: true, beginAtZero: true, max: 100 },
            },
            plugins: {
              tooltip: {
                callbacks: {
                  title: function (t) {
                    return teksSoalPendek[t[0].dataIndex];
                  },
                  label: function (c) {
                    return ` ${c.dataset.label}: ${c.raw}%`;
                  },
                  footer: function (t) {
                    const idx = t[0].dataIndex;
                    const dataSoal = soalTerkait[idx];
                    return `  Rata-rata pengerjaan: ${rataWaktuData[idx]}\n  Level Sistem: ${dataSoal.tingkat_kesulitan} | Level Empiris: ${dataSoal.tingkat_kesulitan_empiris || dataSoal.tingkat_kesulitan}`;
                  },
                },
              },
            },
          },
        });
      }
    };

    if (dropdownSub) dropdownSub.addEventListener("change", renderGrafikSoal);
    if (dropdownPerspektif)
      dropdownPerspektif.addEventListener("change", renderGrafikSoal);
  } catch (error) {
    console.error("Gagal memproses data analisis:", error);
  }
}

// ==========================================
// 4. MESIN EKSPOR CSV
// ==========================================
export function setupExportCSV() {
  const btnEkspor = document.getElementById("btn-ekspor");
  if (!btnEkspor) return;

  btnEkspor.addEventListener("click", () => {
    const jenis = document.getElementById("jenis-ekspor").value;
    let csvContent = "\uFEFF";
    const escapeCSV = (str) => `"${String(str).replace(/"/g, '""')}"`;

    if (jenis === "riwayat") {
      if (state.dataMentah.length === 0) return alert("Belum ada data!");
      
      const filterKelas = document.getElementById("filter-kelas-riwayat")?.value || "";
      let dataToExport = state.dataMentah;
      if (filterKelas) {
         dataToExport = dataToExport.filter(d => {
            const profil = state.profilSiswa ? state.profilSiswa.find(p => p.id === d.nis_siswa) : null;
            return profil && profil.kelas === filterKelas;
         });
      }

      csvContent +=
        "Nama Siswa,NIS,Mode Latihan,Status Pengerjaan,Materi Utama,Sub-Materi,Total Soal,Skor Akhir,Durasi (Detik),Waktu Submit\n";
      dataToExport.forEach((d) => {
        const waktu = new Date(d.waktu_submit).toLocaleString("id-ID");
        const totalSoal = d.detail_jawaban
          ? Object.keys(d.detail_jawaban).length
          : 0;
        let teksMode =
          d.mode_latihan === MODE_LATIHAN.FORMATIF
            ? "Formatif"
            : d.mode_latihan === MODE_LATIHAN.ACAK
              ? MODE_LATIHAN.LAMA_ACAK
              : MODE_LATIHAN.LAMA_NORMAL;
        const statusData =
          d.status === STATUS_LATIHAN.DRAF
            ? "Sedang Dikerjakan (Draft)"
            : STATUS_LATIHAN.SELESAI;
        csvContent += `${escapeCSV(d.nama_siswa)},${escapeCSV(d.nis_siswa)},${teksMode},${statusData},${escapeCSV(d.materi_utama)},${escapeCSV(d.sub_materi)},${totalSoal},${d.nilai},${d.durasi_detik || 0},${escapeCSV(waktu)}\n`;
      });
      unduhFileCSV(csvContent, "Albago_Riwayat_Latihan.csv");
    } else if (jenis === "rekap") {
      if (
        state.dataMentah.length === 0 ||
        Object.keys(state.dataAnalisisSoalEkspor).length === 0
      )
        return alert("Belum ada data atau tab Analisis Soal belum dimuat!");
      const rekapSiswa = {};
      const semuaSubMateri = new Set();
      const dataSumatif = state.dataMentah.filter(
        (d) =>
          d.mode_latihan !== MODE_LATIHAN.FORMATIF &&
          d.mode_latihan !== MODE_LATIHAN.LAMA_LATIHAN,
      );
      if (dataSumatif.length === 0)
        return alert("Belum ada data ujian murni untuk direkap!");

      dataSumatif.forEach((latihan) => {
        const nis = latihan.nis_siswa,
          sub = latihan.sub_materi || DATA_DEFAULT.SUB_MATERI;
        semuaSubMateri.add(sub);
        if (!rekapSiswa[nis])
          rekapSiswa[nis] = {
            nama: latihan.nama_siswa || DATA_DEFAULT.NAMA,
            data_per_sub: {},
          };
        if (!rekapSiswa[nis].data_per_sub[sub])
          rekapSiswa[nis].data_per_sub[sub] = {
            skor_soal: [],
            total_durasi: 0,
          };
        rekapSiswa[nis].data_per_sub[sub].total_durasi +=
          latihan.durasi_detik || 0;
        if (latihan.detail_jawaban) {
          for (const [idSoal, jwb] of Object.entries(latihan.detail_jawaban)) {
            const infoSoal = state.dataAnalisisSoalEkspor[idSoal];
            if (infoSoal)
              rekapSiswa[nis].data_per_sub[sub].skor_soal.push(
                jwb === infoSoal.jawaban_benar ? 1 : 0,
              );
          }
        }
      });

      const daftarSubMateri = Array.from(semuaSubMateri);
      let headerCSV = "Nama Siswa,NIS,Waktu Login Terakhir,Durasi Aktif Sesi Terakhir (Menit),Waktu Logout Terakhir,Total Soal Diuji (Sumatif)";
      daftarSubMateri.forEach((sub) => {
        headerCSV += `,Soal: ${escapeCSV(sub)},Akurasi 10 Terakhir: ${escapeCSV(sub)} (%),Total Waktu: ${escapeCSV(sub)} (Menit)`;
      });
      csvContent += headerCSV + "\n";

      for (const nis in rekapSiswa) {
        const s = rekapSiswa[nis];
        let totalSoalGlobal = 0;
        for (const sub in s.data_per_sub)
          totalSoalGlobal += s.data_per_sub[sub].skor_soal.length;
          
        const profil = state.profilSiswa ? state.profilSiswa.find((p) => p.id === nis) : null;
        const sesi = profil && profil.sesi_terakhir ? profil.sesi_terakhir : null;
        
        let loginStr = "-";
        let logoutStr = "-";
        let durasiSesiMenit = 0;
        
        if (sesi) {
          let isAktif = false;
          if (sesi.waktu_logout) {
            const logoutTime = new Date(sesi.waktu_logout).getTime();
            if (Date.now() - logoutTime < 120000) isAktif = true;
          }
          loginStr = sesi.waktu_login ? new Date(sesi.waktu_login).toLocaleString("id-ID") : "-";
          logoutStr = isAktif ? "-" : (sesi.waktu_logout ? new Date(sesi.waktu_logout).toLocaleString("id-ID") : "-");
          durasiSesiMenit = Math.round((sesi.durasi_aktif_detik || 0) / 60);
        }

        let barisData = `${escapeCSV(s.nama)},${escapeCSV(nis)},${escapeCSV(loginStr)},${durasiSesiMenit},${escapeCSV(logoutStr)},${totalSoalGlobal}`;
        daftarSubMateri.forEach((sub) => {
          const infoSub = s.data_per_sub[sub] || {
            skor_soal: [],
            total_durasi: 0,
          };
          const listJawaban = infoSub.skor_soal;
          const totalMenit = Math.round(infoSub.total_durasi / 60);
          const sepuluhTerakhir = listJawaban.slice(0, 10);
          const jumlahBenar = sepuluhTerakhir.reduce((a, b) => a + b, 0);
          const akurasi =
            sepuluhTerakhir.length === 0
              ? 0
              : Math.round((jumlahBenar / sepuluhTerakhir.length) * 100);
          barisData += `,${listJawaban.length},${akurasi}%,${totalMenit}`;
        });
        csvContent += barisData + "\n";
      }
      unduhFileCSV(csvContent, "Albago_Mastery_Analysis.csv");
    } else if (jenis === "soal") {
      const soalArray = Object.values(state.dataAnalisisSoalEkspor);
      if (soalArray.length === 0) return alert("Belum ada data soal!");
      csvContent +=
        "Sub-Materi,Konsep Prasyarat,Teks Pertanyaan,Level Sistem,Level Empiris,Total Dijawab (Murni),Total Menjawab Benar (Murni),Persentase Kesulitan,Rata-rata Waktu (Detik)\n";
      soalArray.forEach((s) => {
        const persentase =
          s.total_dijawab === 0
            ? 0
            : Math.round((s.total_benar / s.total_dijawab) * 100);
        const rataWaktu =
          s.total_dilihat === 0
            ? 0
            : Math.round(s.total_waktu_detik / s.total_dilihat);
        const levelSys = s.tingkat_kesulitan || 1;
        const levelEmp = s.tingkat_kesulitan_empiris || levelSys;
        csvContent += `${escapeCSV(s.sub_materi)},${escapeCSV(s.konsep_prasyarat)},${escapeCSV(s.pertanyaan)},${levelSys},${levelEmp},${s.total_dijawab},${s.total_benar},${persentase}%,${rataWaktu}\n`;
      });
      unduhFileCSV(csvContent, "Albago_Analisis_Butir_Soal.csv");
    } else if (jenis === "ketuntasan") {
      const dataKetuntasan = getKetuntasanDataForExport();
      if (dataKetuntasan.length === 0) return alert("Belum ada data ketuntasan untuk filter saat ini!");
      csvContent += "No,Nama Siswa,Materi Utama,Sub Materi,Selesai Formatif,Selesai Sumatif dan >= 80\n";
      dataKetuntasan.forEach((k) => {
        csvContent += `${k.no},${escapeCSV(k.nama)},${escapeCSV(k.materiUtama)},${escapeCSV(k.subMateri)},${escapeCSV(k.formatif)},${escapeCSV(k.sumatif)}\n`;
      });
      unduhFileCSV(csvContent, "Albago_Ketuntasan_Materi.csv");
    }
  });
}

function unduhFileCSV(content, fileName) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ==========================================
// 5. REGISTRASI SEMUA EVENT LISTENER LOKAL
// ==========================================
export function setupAnalisisListeners() {
  document.getElementById("btn-prev")?.addEventListener("click", () => {
    if (halamanSaatIni > 1) {
      halamanSaatIni--;
      renderTabelRiwayat();
    }
  });
  document.getElementById("btn-next")?.addEventListener("click", () => {
    if (
      halamanSaatIni < Math.ceil(state.dataTabelAktif.length / barisPerHalaman)
    ) {
      halamanSaatIni++;
      renderTabelRiwayat();
    }
  });

  const searchInput = document.getElementById("search-siswa");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const keyword = this.value.toLowerCase();
      state.dataTabelAktif = !keyword
        ? [...state.dataMentah]
        : state.dataMentah.filter(
            (d) =>
              (d.nama_siswa || "").toLowerCase().includes(keyword) ||
              (d.nis_siswa || "").toLowerCase().includes(keyword) ||
              (d.sub_materi || "").toLowerCase().includes(keyword),
          );
      halamanSaatIni = 1;
      renderTabelRiwayat();
    });
  }

  const filterModeAnalisis = document.getElementById("filter-mode-analisis");
  if (filterModeAnalisis)
    filterModeAnalisis.addEventListener("change", () => {
      if (nisAnalisisAktif) renderGrafikSiswa(nisAnalisisAktif);
    });

  const inputSearchAnalisis = document.getElementById("search-analisis");
  const boxSaran = document.getElementById("box-saran-analisis");
  if (inputSearchAnalisis && boxSaran) {
    inputSearchAnalisis.addEventListener("input", (e) => {
      const keyword = e.target.value.toLowerCase();
      if (!keyword) {
        boxSaran.style.display = "none";
        return;
      }
      const hasil = state.siswaUnik.filter(
        (s) =>
          s.nama.toLowerCase().includes(keyword) ||
          s.nis.toLowerCase().includes(keyword),
      );
      if (hasil.length > 0) {
        boxSaran.innerHTML = "";
        hasil.forEach((siswa) => {
          const item = document.createElement("div");
          item.style.padding = "10px 12px";
          item.style.cursor = "pointer";
          item.style.borderBottom = "1px solid #f1f5f9";
          item.innerHTML = createSaranPencarianHTML(siswa);
          item.onclick = () => {
            inputSearchAnalisis.value = siswa.nama;
            boxSaran.style.display = "none";
            renderGrafikSiswa(siswa.nis);
          };
          boxSaran.appendChild(item);
        });
        boxSaran.style.display = "block";
      } else {
        boxSaran.innerHTML = `<div style="padding:10px; color:#94a3b8; font-size:0.8rem; text-align:center;">Tidak ditemukan</div>`;
        boxSaran.style.display = "block";
      }
    });
  }

  // ==========================================
  // TAMBAHAN: PAGINASI MODAL DETAIL SISWA
  // ==========================================
  document.getElementById("btn-prev-detail")?.addEventListener("click", () => {
    if (halamanDetailSiswa > 1) {
      halamanDetailSiswa--;
      renderTabelDetailSiswa();
    }
  });

  document.getElementById("btn-next-detail")?.addEventListener("click", () => {
    if (
      halamanDetailSiswa <
      Math.ceil(dataDetailSiswaAktif.length / barisPerHalamanDetail)
    ) {
      halamanDetailSiswa++;
      renderTabelDetailSiswa();
    }
  });
}
