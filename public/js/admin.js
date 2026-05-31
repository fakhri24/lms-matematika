// public/js/admin.js

import { pantauSesi, logoutSistem } from "./services/authService.js";
import { state } from "./admin/adminState.js";
import {
  getAllRiwayatLatihan,
  getAllBankSoal,
  getAllProfilSiswa,
} from "./services/adminService.js";
import {
  setupBankSoalListeners,
  renderTabelBankSoal,
  siapkanDropdownFilterBank,
  unduhBankSoalJSON,
  sinkronisasiMetadata,
} from "./admin/bankSoalController.js";
import {
  renderTabelRiwayat,
  lihatDetailSiswa,
  tutupModalDetail,
  renderTabelDetailSiswa,
  prosesAnalisisSoalLokal,
  setupAnalisisListeners,
  setupExportCSV,
  refreshTampilanRiwayat,
} from "./admin/analisisController.js";
import {
  mulaiAutoRefreshStatus,
  setTabStatusAktif,
  renderTabelStatus,
  setupStatusPaginationListeners,
  resetPageStatus,
} from "./admin/statusController.js";
import {
  siapkanDropdownKetuntasan,
  renderTabelKetuntasan,
  setupKetuntasanPaginationListeners,
  resetPageKetuntasan,
} from "./admin/ketuntasanController.js";
import { inisialisasiLatihanSpesial } from "./admin/latihanSpesialController.js";
import { DATA_DEFAULT, STATUS_LATIHAN } from "./utils/constants.js";

// ==========================================
// 1. AUTENTIKASI & LOGOUT
// ==========================================
pantauSesi((user) => {
  document.body.style.display = "block";
  muatDataAwal();
}, true); // "true" berarti wajib Admin

window.keluarAplikasi = function () {
  logoutSistem();
};
document
  .getElementById("btn-logout-admin")
  ?.addEventListener("click", keluarAplikasi);

// ==========================================
// 2. INISIALISASI DATA UTAMA
// ==========================================
async function muatDataAwal() {
  try {
    // Eksekusi semua pengambilan data secara paralel (bersamaan) untuk memangkas waktu loading
    const [dataRiwayatLengkap, dataBankSoalLengkap, dataProfilSiswaLengkap] = await Promise.all([
      getAllRiwayatLatihan(),
      getAllBankSoal(),
      getAllProfilSiswa()
    ]);

    // A. Proses Data Riwayat & Ekstrak Daftar Siswa Unik
    state.dataMentah = dataRiwayatLengkap;
    const setSiswa = new Set();
    state.siswaUnik = [];

    state.dataMentah.forEach((d) => {
      if (d.nis_siswa && d.status !== STATUS_LATIHAN.DRAF) {
        if (!setSiswa.has(d.nis_siswa)) {
          setSiswa.add(d.nis_siswa);
          state.siswaUnik.push({
            nis: d.nis_siswa,
            nama: d.nama_siswa || DATA_DEFAULT.NAMA,
          });
        }
      }
    });
    state.dataTabelAktif = [...state.dataMentah];

    // B. Proses Data Bank Soal & Sortir
    state.dataBankSoalMentah = dataBankSoalLengkap;
    state.dataBankSoalMentah.sort((a, b) => {
      const waktuA = a.waktu_update ? new Date(a.waktu_update) : new Date(0);
      const waktuB = b.waktu_update ? new Date(b.waktu_update) : new Date(0);
      return waktuB - waktuA;
    });
    state.dataBankSoalAktif = [...state.dataBankSoalMentah];

    // C. Proses Data Profil Siswa
    state.profilSiswa = dataProfilSiswaLengkap;

    // D. Populasi Dropdown Kelas
    const setKelas = new Set();
    state.profilSiswa.forEach(p => {
      if (p.kelas) setKelas.add(p.kelas);
    });
    const kelasUnik = Array.from(setKelas).sort();
    const opsiKelas = '<option value="">Semua Kelas</option>' + kelasUnik.map(k => `<option value="${k}">${k}</option>`).join('');
    
    const ddlRiwayat = document.getElementById("filter-kelas-riwayat");
    if (ddlRiwayat) ddlRiwayat.innerHTML = opsiKelas;
    
    const ddlStatus = document.getElementById("filter-kelas-status");
    if (ddlStatus) ddlStatus.innerHTML = opsiKelas;
    
    const ddlKetuntasan = document.getElementById("filter-kelas-ketuntasan");
    if (ddlKetuntasan) {
      ddlKetuntasan.innerHTML = opsiKelas;
      const savedKelas = localStorage.getItem("lms_admin_kelas_ketuntasan") || "";
      ddlKetuntasan.value = savedKelas;
    }

    const delay = () => new Promise(r => setTimeout(r, 10));

    // E. Distribusikan Perintah Render ke Controller dengan jeda (mencegah hang)
    await delay();
    renderTabelRiwayat();
    
    await delay();
    siapkanDropdownFilterBank();
    renderTabelBankSoal();
    
    await delay();
    prosesAnalisisSoalLokal(); // Kalkulasi grafik di Tab Analisis Soal
    
    await delay();
    siapkanDropdownKetuntasan();
    renderTabelKetuntasan();
    
    await delay();
    mulaiAutoRefreshStatus(); // Inisialisasi auto-refresh status siswa
    mulaiAutoRefreshRiwayat(); // Inisialisasi auto-refresh riwayat latihan
    inisialisasiLatihanSpesial(); // Inisialisasi Latihan Spesial
  } catch (error) {
    console.error("Gagal memuat data awal admin:", error);
    alert("Gagal memuat data dari server. Periksa koneksi internet.");
  }
}

let intervalRiwayat = null;
function mulaiAutoRefreshRiwayat() {
  if (intervalRiwayat) clearInterval(intervalRiwayat);
  intervalRiwayat = setInterval(async () => {
    try {
      state.dataMentah = await getAllRiwayatLatihan();
      state.profilSiswa = await getAllProfilSiswa();
      
      const setSiswa = new Set();
      state.siswaUnik = [];
      state.dataMentah.forEach((d) => {
        if (d.nis_siswa && d.status !== STATUS_LATIHAN.DRAF) {
          if (!setSiswa.has(d.nis_siswa)) {
            setSiswa.add(d.nis_siswa);
            state.siswaUnik.push({
              nis: d.nis_siswa,
              nama: d.nama_siswa || DATA_DEFAULT.NAMA,
            });
          }
        }
      });
      refreshTampilanRiwayat();
    } catch (error) {
      console.error("Gagal auto-refresh riwayat:", error);
    }
  }, 60000);
}

// ==========================================
// 3. PENGATURAN TAB NAVIGASI & LISTENER
// ==========================================
function gantiTab(tabPilihan) {
  const tabs = ["riwayat", "status", "analisis", "soal", "bank-soal", "ketuntasan", "latihan-spesial"];
  tabs.forEach((t) => {
    const targetTab = document.getElementById(`tab-${t}`);
    const targetBtn = document.getElementById(`btn-tab-${t}`);
    if (targetTab)
      targetTab.style.display = t === tabPilihan ? "block" : "none";
    if (targetBtn)
      targetBtn.className =
        t === tabPilihan ? "btn btn-primary" : "btn btn-secondary";
  });
  
  setTabStatusAktif(tabPilihan === "status");
}

document.addEventListener("DOMContentLoaded", () => {
  // A. Navigasi Tab
  const tombolTabs = ["riwayat", "status", "analisis", "soal", "bank-soal", "ketuntasan", "latihan-spesial"];
  tombolTabs.forEach((id) => {
    document
      .getElementById(`btn-tab-${id}`)
      ?.addEventListener("click", () => gantiTab(id));
  });

  // B. Setup Ekspor/Impor Bank Soal (Dari bankSoalController)
  document
    .getElementById("btn-download-json")
    ?.addEventListener("click", unduhBankSoalJSON);
  setupBankSoalListeners(async () => {
    // Callback ketika Import sukses: Refresh data
    state.dataBankSoalMentah = await getAllBankSoal();
    state.dataBankSoalMentah.sort((a, b) => {
      if (a.waktu_update && b.waktu_update)
        return new Date(b.waktu_update) - new Date(a.waktu_update);
      return 0;
    });
    state.dataBankSoalAktif = [...state.dataBankSoalMentah];
    siapkanDropdownFilterBank();
    renderTabelBankSoal();

    // --- TAMBAHKAN BARIS INI ---
    await sinkronisasiMetadata();
    // ---------------------------
  });

  // C. Setup Listener Analisis & Riwayat
  setupAnalisisListeners();
  setupExportCSV();
  
  // Setup Listener untuk Dropdown Kelas
  document.getElementById("filter-kelas-riwayat")?.addEventListener("change", refreshTampilanRiwayat);
  
  document.getElementById("filter-kelas-status")?.addEventListener("change", () => {
    resetPageStatus();
    renderTabelStatus();
  });
  
  document.getElementById("filter-kelas-ketuntasan")?.addEventListener("change", (e) => {
    localStorage.setItem("lms_admin_kelas_ketuntasan", e.target.value);
    resetPageKetuntasan();
    renderTabelKetuntasan();
  });
  
  // Setup Listener Pagination
  setupStatusPaginationListeners();
  setupKetuntasanPaginationListeners();

  // D. Event Delegation Tabel Riwayat (Tombol Lihat Detail Siswa)
  document.getElementById("tabel-hasil")?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action='lihat-detail']");
    if (btn) {
      const nisTarget = btn.getAttribute("data-nis");
      const namaTarget = btn.getAttribute("data-nama");
      lihatDetailSiswa(nisTarget, namaTarget);
    }
  });

  // E. Listener Modal Detail Siswa
  document
    .getElementById("btn-tutup-detail-siswa")
    ?.addEventListener("click", tutupModalDetail);
  // F. Smart Truncate Hover (Custom Tooltip dengan delay)
  const customTooltip = document.createElement("div");
  customTooltip.style.position = "absolute";
  customTooltip.style.backgroundColor = "#334155";
  customTooltip.style.color = "white";
  customTooltip.style.padding = "6px 12px";
  customTooltip.style.borderRadius = "6px";
  customTooltip.style.fontSize = "0.75rem";
  customTooltip.style.maxWidth = "300px";
  customTooltip.style.zIndex = "9999";
  customTooltip.style.pointerEvents = "none";
  customTooltip.style.opacity = "0";
  customTooltip.style.transition = "opacity 0.2s ease-in-out";
  customTooltip.style.display = "none";
  customTooltip.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
  document.body.appendChild(customTooltip);

  let tooltipTimeout = null;
  let currentHoverTarget = null;

  // Hapus atribut title bawaan secara agresif dari elemen .truncate agar tidak dobel
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            const truncates = node.classList && node.classList.contains("truncate") 
              ? [node] 
              : node.querySelectorAll ? node.querySelectorAll(".truncate") : [];
            
            truncates.forEach((el) => {
              if (el.hasAttribute("title")) {
                el.setAttribute("data-original-title", el.getAttribute("title"));
                el.removeAttribute("title");
              }
            });
          }
        });
      }
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });

  document.addEventListener("mouseover", (e) => {
    const target = e.target.closest(".truncate");

    // Copot atribut 'title' asli agar tidak bertabrakan dengan bawaan browser (backup)
    if (e.target.hasAttribute && e.target.hasAttribute("title")) {
      e.target.setAttribute("data-original-title", e.target.getAttribute("title"));
      e.target.removeAttribute("title");
    }
    if (target && target.hasAttribute("title")) {
      target.setAttribute("data-original-title", target.getAttribute("title"));
      target.removeAttribute("title");
    }

    if (target === currentHoverTarget) return; // Jika mouse bergerak di elemen yg sama

    // Reset jika berpindah elemen
    clearTimeout(tooltipTimeout);
    customTooltip.style.opacity = "0";
    customTooltip.style.display = "none";
    currentHoverTarget = target;

    if (!target) return;

    let originalTitle = target.getAttribute("data-original-title");
    if (!originalTitle) {
      originalTitle = target.innerText.trim();
      target.setAttribute("data-original-title", originalTitle);
    }
    if (!originalTitle) return;

    if (target.scrollWidth > target.clientWidth) {
      // Tunggu 600ms (sedikit lebih cepat dari bawaan browser)
      tooltipTimeout = setTimeout(() => {
        customTooltip.innerText = originalTitle;
        customTooltip.style.display = "block";

        const rect = target.getBoundingClientRect();
        customTooltip.style.left = `${rect.left + window.scrollX}px`;
        customTooltip.style.top = `${rect.bottom + window.scrollY + 8}px`;

        // Penyesuaian agar tidak keluar batas kanan layar
        setTimeout(() => {
          const ttRect = customTooltip.getBoundingClientRect();
          if (ttRect.right > window.innerWidth) {
            customTooltip.style.left = `${window.innerWidth - ttRect.width - 15 + window.scrollX}px`;
          }
          customTooltip.style.opacity = "1";
        }, 10);
      }, 600); 
    }
  });

  document.addEventListener("mouseout", (e) => {
    const target = e.target.closest(".truncate");
    if (!target) return;

    // Pastikan mouse benar-benar keluar dari elemen (bukan ke child-nya)
    if (target.contains(e.relatedTarget)) return;

    clearTimeout(tooltipTimeout);
    customTooltip.style.opacity = "0";
    setTimeout(() => {
      if (customTooltip.style.opacity === "0") {
        customTooltip.style.display = "none";
      }
    }, 200);
    currentHoverTarget = null;
  });

  window.addEventListener("scroll", () => {
    clearTimeout(tooltipTimeout);
    customTooltip.style.opacity = "0";
    customTooltip.style.display = "none";
    currentHoverTarget = null;
  });
});
