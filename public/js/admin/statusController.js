import { getAllProfilSiswa } from "../services/adminService.js";

let intervalStatus = null;
let isTabAktif = false; // Status apakah tab Status Siswa sedang dilihat

/**
 * Merender tabel status siswa
 */
let currentPageStatus = 1;
const itemsPerPageStatus = 10;
let allStatusRows = [];

export function resetPageStatus() {
  currentPageStatus = 1;
}

export async function renderTabelStatus() {
  const tbody = document.getElementById("tabel-status");
  if (!tbody) return;
  
  try {
    let profilSiswa = await getAllProfilSiswa();
    
    const filterKelas = document.getElementById("filter-kelas-status")?.value || "";
    if (filterKelas) {
      profilSiswa = profilSiswa.filter(s => s.kelas === filterKelas);
    }
    // Urutkan berdasarkan nama_lengkap
    profilSiswa.sort((a, b) => {
      const namaA = a.nama_lengkap ? a.nama_lengkap.toLowerCase() : "";
      const namaB = b.nama_lengkap ? b.nama_lengkap.toLowerCase() : "";
      return namaA.localeCompare(namaB);
    });
    
    allStatusRows = profilSiswa;
    renderCurrentPageStatus();
  } catch (error) {
    console.error("Gagal render status:", error);
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger" style="padding: 20px">Gagal memuat data</td></tr>`;
  }
}

function renderCurrentPageStatus() {
  const tbody = document.getElementById("tabel-status");
  if (!tbody) return;

  if (allStatusRows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted" style="padding: 20px">Tidak ada data siswa</td></tr>`;
    updatePaginationStatus(1);
    return;
  }

  const totalPages = Math.ceil(allStatusRows.length / itemsPerPageStatus) || 1;
  if (currentPageStatus > totalPages) currentPageStatus = totalPages;

  const startIndex = (currentPageStatus - 1) * itemsPerPageStatus;
  const pageData = allStatusRows.slice(startIndex, startIndex + itemsPerPageStatus);

  let html = "";
  pageData.forEach((siswa, index) => {
    let isAktif = false;
    let durasiStr = "0m 0s";
    
    if (siswa.sesi_terakhir) {
      const { waktu_logout, durasi_aktif_detik } = siswa.sesi_terakhir;
      
      if (waktu_logout) {
        const logoutTime = new Date(waktu_logout).getTime();
        const now = Date.now();
        if (now - logoutTime < 120000) {
          isAktif = true;
        }
      }
      
      if (durasi_aktif_detik) {
        const m = Math.floor(durasi_aktif_detik / 60);
        const s = durasi_aktif_detik % 60;
        durasiStr = `${m}m ${s}s`;
      }
    }
    
    html += `
      <tr>
        <td>${startIndex + index + 1}</td>
        <td class="truncate" style="max-width: 250px;">${siswa.nama_lengkap || 'Siswa Tanpa Nama'} <br><span class="text-xs text-muted">NIS: ${siswa.id || '-'}</span></td>
        <td style="text-align: center; font-size: 1.2rem;">${isAktif ? '✅' : '❌'}</td>
        <td style="text-align: center;">${durasiStr}</td>
      </tr>
    `;
  });

  const sisaBaris = itemsPerPageStatus - pageData.length;
  const dummyRowStatus = `
    <tr class="dummy-row">
      <td colspan="4">
        <div style="visibility: hidden;">
          <div>X</div>
          <div class="text-xs">X</div>
        </div>
      </td>
    </tr>
  `;
  for (let i = 0; i < sisaBaris; i++) {
    html += dummyRowStatus;
  }

  tbody.innerHTML = html;
  updatePaginationStatus(totalPages);
}

function updatePaginationStatus(totalPages) {
  const infoHalaman = document.getElementById("info-halaman-status");
  const btnPrev = document.getElementById("btn-prev-status");
  const btnNext = document.getElementById("btn-next-status");
  
  if (infoHalaman) infoHalaman.textContent = `Halaman ${currentPageStatus} dari ${totalPages}`;
  if (btnPrev) btnPrev.disabled = currentPageStatus <= 1;
  if (btnNext) btnNext.disabled = currentPageStatus >= totalPages;
}

export function setupStatusPaginationListeners() {
  document.getElementById("btn-prev-status")?.addEventListener("click", () => {
    if (currentPageStatus > 1) {
      currentPageStatus--;
      renderCurrentPageStatus();
    }
  });
  
  document.getElementById("btn-next-status")?.addEventListener("click", () => {
    const totalPages = Math.ceil(allStatusRows.length / itemsPerPageStatus) || 1;
    if (currentPageStatus < totalPages) {
      currentPageStatus++;
      renderCurrentPageStatus();
    }
  });
}

/**
 * Memulai auto-refresh tabel setiap 1 menit (hanya ketika tab aktif)
 */
export function mulaiAutoRefreshStatus() {
  if (intervalStatus) clearInterval(intervalStatus);
  
  // Refresh setiap 1 menit
  intervalStatus = setInterval(() => {
    if (isTabAktif) {
      renderTabelStatus();
    }
  }, 60000);
}

/**
 * Mengatur status visibilitas tab
 */
export function setTabStatusAktif(aktif) {
  isTabAktif = aktif;
  if (aktif) {
    // Render langsung saat tab dibuka
    renderTabelStatus();
  }
}
