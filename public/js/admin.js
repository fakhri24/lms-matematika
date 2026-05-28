// public/js/admin.js

import { pantauSesi, logoutSistem } from "./services/authService.js";
import { state } from "./admin/adminState.js";
import {
  getAllRiwayatLatihan,
  getAllBankSoal,
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
} from "./admin/analisisController.js";
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
    // A. Ambil Data Riwayat & Ekstrak Daftar Siswa Unik
    state.dataMentah = await getAllRiwayatLatihan();
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

    // B. Ambil Data Bank Soal & Sortir
    state.dataBankSoalMentah = await getAllBankSoal();
    state.dataBankSoalMentah.sort((a, b) => {
      const waktuA = a.waktu_update ? new Date(a.waktu_update) : new Date(0);
      const waktuB = b.waktu_update ? new Date(b.waktu_update) : new Date(0);
      return waktuB - waktuA;
    });
    state.dataBankSoalAktif = [...state.dataBankSoalMentah];

    // C. Distribusikan Perintah Render ke Controller
    renderTabelRiwayat();
    siapkanDropdownFilterBank();
    renderTabelBankSoal();
    prosesAnalisisSoalLokal(); // Kalkulasi grafik di Tab Analisis Soal
  } catch (error) {
    console.error("Gagal memuat data awal admin:", error);
    alert("Gagal memuat data dari server. Periksa koneksi internet.");
  }
}

// ==========================================
// 3. PENGATURAN TAB NAVIGASI & LISTENER
// ==========================================
function gantiTab(tabPilihan) {
  const tabs = ["riwayat", "analisis", "soal", "bank-soal"];
  tabs.forEach((t) => {
    const targetTab = document.getElementById(`tab-${t}`);
    const targetBtn = document.getElementById(`btn-tab-${t}`);
    if (targetTab)
      targetTab.style.display = t === tabPilihan ? "block" : "none";
    if (targetBtn)
      targetBtn.className =
        t === tabPilihan ? "btn btn-primary" : "btn btn-secondary";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // A. Navigasi Tab
  const tombolTabs = ["riwayat", "analisis", "soal", "bank-soal"];
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
});
