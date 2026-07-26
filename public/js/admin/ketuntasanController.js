// public/js/admin/ketuntasanController.js

import { state } from "./adminState.js";
import { DATA_DEFAULT, MODE_LATIHAN, STATUS_LATIHAN } from "../utils/constants.js";
import { isHasilMasterSumatif } from "../utils/kurikulumEngine.js";

let petaMateriKetuntasan = {};

export function siapkanDropdownKetuntasan() {
  const dropdownMateri = document.getElementById("filter-materi-ketuntasan");
  const dropdownSub = document.getElementById("filter-submateri-ketuntasan");
  
  if (!dropdownMateri || !dropdownSub) return;
  
  petaMateriKetuntasan = {};
  
  // Ambil struktur materi dari dataBankSoalMentah (sama seperti di analisis)
  state.dataBankSoalMentah.forEach((d) => {
    const m = d.materi_utama || DATA_DEFAULT.MATERI;
    const sub = d.sub_materi || DATA_DEFAULT.SUB_MATERI;
    if (!petaMateriKetuntasan[m]) petaMateriKetuntasan[m] = new Set();
    petaMateriKetuntasan[m].add(sub);
  });

  const defaultMateri = "Aritmatika dan Aljabar Dasar";
  const defaultSub = "Operasi Aritmatika Dasar";
  
  const savedMateri = localStorage.getItem("lms_admin_materi_ketuntasan") || defaultMateri;
  const savedSub = localStorage.getItem("lms_admin_sub_ketuntasan") || defaultSub;

  dropdownMateri.innerHTML = '<option value="">-- Semua Materi Utama --</option>';
  Object.keys(petaMateriKetuntasan).sort().forEach((m) => {
    dropdownMateri.innerHTML += `<option value="${m}">${m}</option>`;
  });
  
  if (petaMateriKetuntasan[savedMateri]) {
    dropdownMateri.value = savedMateri;
  } else if (petaMateriKetuntasan[defaultMateri]) {
    dropdownMateri.value = defaultMateri;
  }
  
  dropdownSub.innerHTML = '<option value="">-- Semua Sub-Materi --</option>';
  const selectedMateri = dropdownMateri.value;
  if (selectedMateri !== "" && petaMateriKetuntasan[selectedMateri]) {
    Array.from(petaMateriKetuntasan[selectedMateri]).sort().forEach((sm) => {
      dropdownSub.innerHTML += `<option value="${sm}">${sm}</option>`;
    });
    if (petaMateriKetuntasan[selectedMateri].has(savedSub)) {
      dropdownSub.value = savedSub;
    } else if (petaMateriKetuntasan[selectedMateri].has(defaultSub)) {
      dropdownSub.value = defaultSub;
    }
  }

  dropdownMateri.addEventListener("change", function () {
    const materiTerpilih = this.value;
    localStorage.setItem("lms_admin_materi_ketuntasan", materiTerpilih);
    
    dropdownSub.innerHTML = '<option value="">-- Semua Sub-Materi --</option>';
    if (materiTerpilih !== "" && petaMateriKetuntasan[materiTerpilih]) {
      Array.from(petaMateriKetuntasan[materiTerpilih]).sort().forEach((sm) => {
        dropdownSub.innerHTML += `<option value="${sm}">${sm}</option>`;
      });
      dropdownSub.value = "";
    }
    localStorage.setItem("lms_admin_sub_ketuntasan", dropdownSub.value);
    
    resetPageKetuntasan();
    renderTabelKetuntasan();
  });

  dropdownSub.addEventListener("change", () => {
    localStorage.setItem("lms_admin_sub_ketuntasan", dropdownSub.value);
    resetPageKetuntasan();
    renderTabelKetuntasan();
  });
}

let currentPageKetuntasan = 1;
const itemsPerPageKetuntasan = 10;
let allKetuntasanRows = [];

export function resetPageKetuntasan() {
  currentPageKetuntasan = 1;
}

export function renderTabelKetuntasan() {
  const tabelBody = document.getElementById("tabel-ketuntasan");
  if (!tabelBody) return;
  
  const filterMateri = document.getElementById("filter-materi-ketuntasan")?.value || "";
  const filterSub = document.getElementById("filter-submateri-ketuntasan")?.value || "";
  const filterKelas = document.getElementById("filter-kelas-ketuntasan")?.value || "";

  // Agregasi Data Mentah
  // Map per siswa -> sub_materi -> { formatif: 0, sumatif_lulus: 0 }
  const rekapSiswa = {};
  
  const subMateriList = [];
  for (const mUtama in petaMateriKetuntasan) {
    if (filterMateri && mUtama !== filterMateri) continue;
    petaMateriKetuntasan[mUtama].forEach(sm => {
      if (filterSub && sm !== filterSub) return;
      subMateriList.push({ materi_utama: mUtama, sub_materi: sm });
    });
  }
  
  const totalSoalPerSub = {};
  state.dataBankSoalMentah.forEach(s => {
    const mat = s.materi_utama || DATA_DEFAULT.MATERI;
    const sub = s.sub_materi || DATA_DEFAULT.SUB_MATERI;
    const key = `${mat}_${sub}`;
    if (!totalSoalPerSub[key]) totalSoalPerSub[key] = 0;
    totalSoalPerSub[key]++;
  });
  
  state.siswaUnik.forEach(siswa => {
    const profil = state.profilSiswa ? state.profilSiswa.find(p => p.id === siswa.nis) : null;
    const kelasSiswa = profil ? profil.kelas : null;
    if (filterKelas && kelasSiswa !== filterKelas) return;

    rekapSiswa[siswa.nis] = {
      nama: siswa.nama,
      materi: {}
    };
    subMateriList.forEach(sm => {
      rekapSiswa[siswa.nis].materi[sm.sub_materi] = {
        materi_utama: sm.materi_utama,
        formatif: 0,
        sumatif_lulus: 0,
        max_draft_attempted: 0
      };
    });
  });

  state.dataMentah.forEach(d => {
    if (!d.nis_siswa) return;
    
    const matUtama = d.materi_utama || DATA_DEFAULT.MATERI;
    const subMat = d.sub_materi || d.materi_uji || "Campuran";
    
    if (filterMateri && matUtama !== filterMateri) return;
    if (filterSub && subMat !== filterSub) return;
    
    if (!rekapSiswa[d.nis_siswa]) return; // Fallback
    
    if (!rekapSiswa[d.nis_siswa].materi[subMat]) {
      rekapSiswa[d.nis_siswa].materi[subMat] = {
        materi_utama: matUtama,
        formatif: 0,
        sumatif_lulus: 0,
        max_draft_attempted: 0
      };
    }
    
    const rek = rekapSiswa[d.nis_siswa].materi[subMat];
    const mode = d.mode_latihan || MODE_LATIHAN.NORMAL;
    
    // Formatif
    if (mode === MODE_LATIHAN.FORMATIF || mode === MODE_LATIHAN.LAMA_LATIHAN) {
      if (d.status === STATUS_LATIHAN.DRAF) {
        const jmlJawaban = d.detail_jawaban ? Object.keys(d.detail_jawaban).length : 0;
        const jmlLog = d.log_percobaan ? Object.keys(d.log_percobaan).length : 0;
        const attempted = Math.max(jmlJawaban, jmlLog);
        
        const keyTotalSoal = `${matUtama}_${subMat}`;
        const totalSoalSub = totalSoalPerSub[keyTotalSoal] || 1;
        
        if (attempted >= totalSoalSub) {
          rek.formatif++;
        } else {
          if (attempted > rek.max_draft_attempted) {
            rek.max_draft_attempted = attempted;
          }
        }
      } else {
        rek.formatif++;
      }
    }
    
    // Sumatif lulus = definisi "master" yang sama dengan gerbang prasyarat dan
    // gelar. Dulu di sini hanya `nilai >= 80`, tanpa syarat minimal 10 soal,
    // sehingga panel ini bisa menulis "Lulus" untuk materi yang bagi siswa
    // masih terkunci dan belum berhak gelar.
    if (isHasilMasterSumatif(d)) {
      rek.sumatif_lulus++;
    }
  });

  allKetuntasanRows = [];

  for (const nis in rekapSiswa) {
    const dataSiswa = rekapSiswa[nis];
    for (const subMat in dataSiswa.materi) {
      const m = dataSiswa.materi[subMat];
      
      const keyTotalSoal = `${m.materi_utama}_${subMat}`;
      const totalSoal = totalSoalPerSub[keyTotalSoal] || 1;
      
      let lblFormatif = '';
      if (m.formatif === 0) {
        if (m.max_draft_attempted > 0) {
          const pct = Math.round((m.max_draft_attempted / totalSoal) * 100);
          lblFormatif = `<span class="text-warning font-bold" style="font-size: 0.95rem;">⏳ ${pct}%</span>`;
        } else {
          lblFormatif = '<span class="text-muted font-bold" style="font-size: 0.95rem;">0%</span>';
        }
      } else if (m.formatif === 1) {
        lblFormatif = '✅';
      } else {
        lblFormatif = `✅ (${m.formatif})`;
      }

      const lblSumatif = m.sumatif_lulus === 0 ? '❌' : (m.sumatif_lulus === 1 ? '✅' : `✅ (${m.sumatif_lulus})`);

      allKetuntasanRows.push({
        nama: dataSiswa.nama,
        materiUtama: m.materi_utama,
        subMateri: subMat,
        lblFormatif,
        lblSumatif
      });
    }
  }

  renderCurrentPageKetuntasan();
}

function renderCurrentPageKetuntasan() {
  const tabelBody = document.getElementById("tabel-ketuntasan");
  if (!tabelBody) return;

  if (allKetuntasanRows.length === 0) {
    tabelBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 30px">Tidak ada data ketuntasan untuk filter terpilih.</td></tr>`;
    updatePaginationKetuntasan(1);
    return;
  }

  const totalPages = Math.ceil(allKetuntasanRows.length / itemsPerPageKetuntasan) || 1;
  if (currentPageKetuntasan > totalPages) currentPageKetuntasan = totalPages;

  const startIndex = (currentPageKetuntasan - 1) * itemsPerPageKetuntasan;
  const pageData = allKetuntasanRows.slice(startIndex, startIndex + itemsPerPageKetuntasan);

  tabelBody.innerHTML = "";
  let startNo = startIndex + 1;
  pageData.forEach(row => {
    tabelBody.innerHTML += `
      <tr>
        <td>${startNo++}</td>
        <td class="truncate" style="max-width: 200px;">${row.nama}</td>
        <td class="truncate" style="max-width: 250px;">${row.materiUtama} - ${row.subMateri}</td>
        <td class="text-center font-bold" style="font-size: 1.1rem;">${row.lblFormatif}</td>
        <td class="text-center font-bold" style="font-size: 1.1rem;">${row.lblSumatif}</td>
      </tr>
    `;
  });

  const sisaBaris = itemsPerPageKetuntasan - pageData.length;
  for (let i = 0; i < sisaBaris; i++) {
    tabelBody.innerHTML += `<tr class="dummy-row"><td colspan="5"><span style="font-size: 1.1rem; opacity: 0; pointer-events: none;">✅</span></td></tr>`;
  }

  updatePaginationKetuntasan(totalPages);
}

function updatePaginationKetuntasan(totalPages) {
  const infoHalaman = document.getElementById("info-halaman-ketuntasan");
  const btnPrev = document.getElementById("btn-prev-ketuntasan");
  const btnNext = document.getElementById("btn-next-ketuntasan");
  
  if (infoHalaman) infoHalaman.textContent = `Halaman ${currentPageKetuntasan} dari ${totalPages}`;
  if (btnPrev) btnPrev.disabled = currentPageKetuntasan <= 1;
  if (btnNext) btnNext.disabled = currentPageKetuntasan >= totalPages;
}

export function setupKetuntasanPaginationListeners() {
  document.getElementById("btn-prev-ketuntasan")?.addEventListener("click", () => {
    if (currentPageKetuntasan > 1) {
      currentPageKetuntasan--;
      renderCurrentPageKetuntasan();
    }
  });
  
  document.getElementById("btn-next-ketuntasan")?.addEventListener("click", () => {
    const totalPages = Math.ceil(allKetuntasanRows.length / itemsPerPageKetuntasan) || 1;
    if (currentPageKetuntasan < totalPages) {
      currentPageKetuntasan++;
      renderCurrentPageKetuntasan();
    }
  });
}

// Untuk export CSV
export function getKetuntasanDataForExport() {
  const filterMateri = document.getElementById("filter-materi-ketuntasan")?.value || "";
  const filterSub = document.getElementById("filter-submateri-ketuntasan")?.value || "";
  const filterKelas = document.getElementById("filter-kelas-ketuntasan")?.value || "";

  const rekapSiswa = {};
  const subMateriList = [];
  for (const mUtama in petaMateriKetuntasan) {
    if (filterMateri && mUtama !== filterMateri) continue;
    petaMateriKetuntasan[mUtama].forEach(sm => {
      if (filterSub && sm !== filterSub) return;
      subMateriList.push({ materi_utama: mUtama, sub_materi: sm });
    });
  }

  const totalSoalPerSub = {};
  state.dataBankSoalMentah.forEach(s => {
    const mat = s.materi_utama || DATA_DEFAULT.MATERI;
    const sub = s.sub_materi || DATA_DEFAULT.SUB_MATERI;
    const key = `${mat}_${sub}`;
    if (!totalSoalPerSub[key]) totalSoalPerSub[key] = 0;
    totalSoalPerSub[key]++;
  });

  state.siswaUnik.forEach(siswa => {
    const profil = state.profilSiswa ? state.profilSiswa.find(p => p.id === siswa.nis) : null;
    const kelasSiswa = profil ? profil.kelas : null;
    if (filterKelas && kelasSiswa !== filterKelas) return;

    rekapSiswa[siswa.nis] = { nama: siswa.nama, materi: {} };
    subMateriList.forEach(sm => {
      rekapSiswa[siswa.nis].materi[sm.sub_materi] = {
        materi_utama: sm.materi_utama,
        formatif: 0,
        sumatif_lulus: 0,
        max_draft_attempted: 0
      };
    });
  });

  state.dataMentah.forEach(d => {
    if (!d.nis_siswa) return;
    const matUtama = d.materi_utama || DATA_DEFAULT.MATERI;
    const subMat = d.sub_materi || d.materi_uji || "Campuran";
    
    if (filterMateri && matUtama !== filterMateri) return;
    if (filterSub && subMat !== filterSub) return;
    
    if (!rekapSiswa[d.nis_siswa]) return;
    if (!rekapSiswa[d.nis_siswa].materi[subMat]) {
      rekapSiswa[d.nis_siswa].materi[subMat] = { materi_utama: matUtama, formatif: 0, sumatif_lulus: 0, max_draft_attempted: 0 };
    }
    
    const rek = rekapSiswa[d.nis_siswa].materi[subMat];
    const mode = d.mode_latihan || MODE_LATIHAN.NORMAL;
    
    if (mode === MODE_LATIHAN.FORMATIF || mode === MODE_LATIHAN.LAMA_LATIHAN) {
      if (d.status === STATUS_LATIHAN.DRAF) {
        const jmlJawaban = d.detail_jawaban ? Object.keys(d.detail_jawaban).length : 0;
        const jmlLog = d.log_percobaan ? Object.keys(d.log_percobaan).length : 0;
        const attempted = Math.max(jmlJawaban, jmlLog);
        
        const keyTotalSoal = `${matUtama}_${subMat}`;
        const totalSoalSub = totalSoalPerSub[keyTotalSoal] || 1;
        
        if (attempted >= totalSoalSub) {
          rek.formatif++;
        } else {
          if (attempted > rek.max_draft_attempted) {
            rek.max_draft_attempted = attempted;
          }
        }
      } else {
        rek.formatif++;
      }
    }
    
    // Definisi sama dengan agregasi tabel di atas — lihat catatan di sana.
    if (isHasilMasterSumatif(d)) {
      rek.sumatif_lulus++;
    }
  });

  const exportData = [];
  let no = 1;
  for (const nis in rekapSiswa) {
    const dataSiswa = rekapSiswa[nis];
    for (const subMat in dataSiswa.materi) {
      const m = dataSiswa.materi[subMat];
      const keyTotalSoal = `${m.materi_utama}_${subMat}`;
      const totalSoal = totalSoalPerSub[keyTotalSoal] || 1;
      
      let lblFormatif = '';
      if (m.formatif === 0) {
        if (m.max_draft_attempted > 0) {
          const pct = Math.round((m.max_draft_attempted / totalSoal) * 100);
          lblFormatif = `Belum Selesai (${pct}%)`;
        } else {
          lblFormatif = '0%';
        }
      } else if (m.formatif === 1) {
        lblFormatif = 'Selesai (1)';
      } else {
        lblFormatif = `Selesai (${m.formatif})`;
      }
      
      const lblSumatif = m.sumatif_lulus === 0 ? 'Belum' : (m.sumatif_lulus === 1 ? 'Lulus (1)' : `Lulus (${m.sumatif_lulus})`);
      exportData.push({
        no: no++,
        nama: dataSiswa.nama,
        materiUtama: m.materi_utama,
        subMateri: subMat,
        formatif: lblFormatif,
        sumatif: lblSumatif
      });
    }
  }
  return exportData;
}
