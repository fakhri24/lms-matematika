// public/js/admin/koreksiUhController.js

import { state } from "./adminState.js";
import {
  getAllKoreksiUh,
  saveKoreksiUh,
  deleteKoreksiUh,
  uploadPdfKoreksi,
} from "../services/koreksiUhService.js";
import { createRowKoreksiUhHTML } from "../views/adminKoreksiUhView.js";
import { cariKecocokanSiswa, apakahNamaFileCocok } from "../utils/koreksiHelper.js";

let daftarKoreksiMentah = [];
let daftarKoreksiAktif = [];
let dataJsonTerurai = null;
let halamanSaatIni = 1;
const barisPerHalaman = 10;

/**
 * Inisialisasi awal Controller Koreksi UH
 */
export async function inisialisasiKoreksiUh() {
  isiDropdownSiswa();
  setupListeners();
  await muatDaftarKoreksi();
}

/**
 * Mengisi dropdown pemilih siswa dengan data dari state.profilSiswa
 */
function isiDropdownSiswa() {
  const selectSiswa = document.getElementById("select-siswa-koreksi");
  if (!selectSiswa) return;

  const profilSiswa = state.profilSiswa || [];
  
  let htmlOpsi = '<option value="">-- Pilih Siswa Manual --</option>';
  profilSiswa.forEach((siswa) => {
    const namaSiswa = siswa.nama_lengkap || siswa.nama || "Siswa Tanpa Nama";
    htmlOpsi += `<option value="${siswa.id}">${namaSiswa} (${siswa.id} - ${siswa.kelas || ""})</option>`;
  });
  
  selectSiswa.innerHTML = htmlOpsi;
}

/**
 * Memuat daftar koreksi dari Firestore dan merender tabel
 */
async function muatDaftarKoreksi() {
  const tbody = document.getElementById("tabel-koreksi-uh");
  if (!tbody) return;

  try {
    daftarKoreksiMentah = await getAllKoreksiUh();
    daftarKoreksiAktif = [...daftarKoreksiMentah];
    halamanSaatIni = 1; // Reset ke halaman pertama saat muat ulang
    renderTabelKoreksi();
  } catch (error) {
    console.error("Gagal memuat daftar koreksi UH:", error);
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Gagal memuat data dari database.</td></tr>`;
  }
}

/**
 * Merender daftar koreksi ke tabel dengan paginasi
 */
function renderTabelKoreksi() {
  const tbody = document.getElementById("tabel-koreksi-uh");
  const infoHalaman = document.getElementById("info-halaman-koreksi");
  const btnPrev = document.getElementById("btn-prev-koreksi");
  const btnNext = document.getElementById("btn-next-koreksi");

  if (!tbody) return;

  tbody.innerHTML = "";

  if (daftarKoreksiAktif.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding: 20px;">Tidak ada data koreksi ulangan harian.</td></tr>`;
    if (infoHalaman) infoHalaman.innerText = "Halaman 1 dari 1";
    if (btnPrev) btnPrev.disabled = true;
    if (btnNext) btnNext.disabled = true;
    return;
  }

  const totalHalaman = Math.ceil(daftarKoreksiAktif.length / barisPerHalaman);
  
  // Validasi halaman saat ini agar tidak out of bound
  if (halamanSaatIni > totalHalaman) halamanSaatIni = totalHalaman;
  if (halamanSaatIni < 1) halamanSaatIni = 1;

  const dataHalamanIni = daftarKoreksiAktif.slice(
    (halamanSaatIni - 1) * barisPerHalaman,
    halamanSaatIni * barisPerHalaman
  );

  dataHalamanIni.forEach((koreksi, index) => {
    const indeksAbsolut = (halamanSaatIni - 1) * barisPerHalaman + index;
    tbody.innerHTML += createRowKoreksiUhHTML(koreksi, indeksAbsolut);
  });

  if (infoHalaman) {
    infoHalaman.innerText = `Halaman ${halamanSaatIni} dari ${totalHalaman}`;
  }
  if (btnPrev) {
    btnPrev.disabled = halamanSaatIni === 1;
  }
  if (btnNext) {
    btnNext.disabled = halamanSaatIni === totalHalaman;
  }

  // Reset check all & status hapus massal saat mengganti halaman/data
  const checkAll = document.getElementById("check-all-koreksi");
  if (checkAll) checkAll.checked = false;
  perbaruiStatusHapusMassal();
}

/**
 * Menyiapkan event listeners untuk tab koreksi UH
 */
function setupListeners() {
  const inputJson = document.getElementById("input-json-koreksi");
  const selectSiswa = document.getElementById("select-siswa-koreksi");
  const formKoreksi = document.getElementById("form-koreksi-uh");
  const searchInput = document.getElementById("search-koreksi-uh");
  const tbody = document.getElementById("tabel-koreksi-uh");

  // 1. Event upload file JSON koreksi
  inputJson?.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (evt) {
      try {
        const parsed = JSON.parse(evt.target.result);
        
        // Validasi format dasar
        if (!parsed.metadata || !parsed.daftar_soal || !parsed.ringkasan_nilai) {
          alert("Format JSON tidak valid! Pastikan memuat objek 'metadata', 'daftar_soal', dan 'ringkasan_nilai'.");
          inputJson.value = "";
          return;
        }

        dataJsonTerurai = parsed;
        tampilkanRingkasanJson(parsed);
        cocokkanSiswaOtomatis(parsed.metadata.nama_siswa);
      } catch (err) {
        console.error("Error parsing JSON:", err);
        alert("Gagal membaca file JSON. Pastikan file valid.");
        inputJson.value = "";
      }
    };
    reader.readAsText(file);
  });

  // 2. Event submit form simpan
  formKoreksi?.addEventListener("submit", async function (e) {
    e.preventDefault();
    
    const nis = selectSiswa.value;
    const inputUrl = document.getElementById("input-url-pdf-koreksi").value.trim();
    const inputFilePdf = document.getElementById("input-file-pdf-koreksi").files[0];
    const btnSubmit = document.getElementById("btn-submit-koreksi-uh");

    if (!dataJsonTerurai) {
      alert("Harap unggah file JSON koreksi terlebih dahulu!");
      return;
    }
    if (!nis) {
      alert("Harap pilih siswa terlebih dahulu!");
      return;
    }

    const topikUjian = dataJsonTerurai.metadata.topik_ujian || "UH Matematika";
    let pdfUrl = inputUrl;

    try {
      btnSubmit.disabled = true;
      btnSubmit.innerText = "⏳ Sedang memproses & menyimpan...";

      // Upload file PDF ke storage jika ada file yang diunggah
      if (inputFilePdf) {
        btnSubmit.innerText = "⏳ Mengunggah PDF Pekerjaan ke Storage...";
        pdfUrl = await uploadPdfKoreksi(nis, topikUjian, inputFilePdf);
      }

      if (!pdfUrl) {
        alert("Peringatan: Koreksi disimpan tanpa salinan PDF pekerjaan siswa.");
      }

      btnSubmit.innerText = "⏳ Menyimpan data koreksi ke database...";
      await saveKoreksiUh(nis, topikUjian, dataJsonTerurai, pdfUrl);

      alert("Sukses! Data koreksi ulangan harian berhasil disimpan.");
      
      // Reset Form
      formKoreksi.reset();
      dataJsonTerurai = null;
      document.getElementById("info-ringkasan-koreksi").style.display = "none";
      
      // Refresh Daftar
      await muatDaftarKoreksi();
    } catch (err) {
      console.error("Gagal menyimpan koreksi UH:", err);
      alert("Terjadi kesalahan saat menyimpan data. Coba lagi.");
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerText = "🚀 Simpan Koreksi Ulangan Harian";
    }
  });

  // 3. Event pencarian koreksi
  searchInput?.addEventListener("input", function () {
    const keyword = this.value.toLowerCase().trim();
    if (!keyword) {
      daftarKoreksiAktif = [...daftarKoreksiMentah];
    } else {
      daftarKoreksiAktif = daftarKoreksiMentah.filter((k) => {
        const nama = (k.metadata?.nama_siswa || "").toLowerCase();
        const kelas = (k.metadata?.kelas || "").toLowerCase();
        const topik = (k.metadata?.topik_ujian || "").toLowerCase();
        const nis = (k.nis_siswa || "").toLowerCase();
        return nama.includes(keyword) || kelas.includes(keyword) || topik.includes(keyword) || nis.includes(keyword);
      });
    }
    halamanSaatIni = 1; // Reset ke halaman pertama saat mencari
    renderTabelKoreksi();
  });

  // 3b. Event navigasi paginasi tabel
  const btnPrevKoreksi = document.getElementById("btn-prev-koreksi");
  const btnNextKoreksi = document.getElementById("btn-next-koreksi");

  btnPrevKoreksi?.addEventListener("click", () => {
    if (halamanSaatIni > 1) {
      halamanSaatIni--;
      renderTabelKoreksi();
    }
  });

  btnNextKoreksi?.addEventListener("click", () => {
    const totalHalaman = Math.ceil(daftarKoreksiAktif.length / barisPerHalaman);
    if (halamanSaatIni < totalHalaman) {
      halamanSaatIni++;
      renderTabelKoreksi();
    }
  });

  // 4. Event delegation untuk tombol Hapus
  tbody?.addEventListener("click", async function (e) {
    const btnHapus = e.target.closest("button[data-action='hapus-koreksi']");
    if (!btnHapus) return;

    const docId = btnHapus.getAttribute("data-id");
    const konfirmasi = confirm("Apakah Anda yakin ingin menghapus data koreksi ini secara permanen dari database?");
    if (!konfirmasi) return;

    try {
      btnHapus.disabled = true;
      btnHapus.innerText = "⏳...";
      await deleteKoreksiUh(docId);
      alert("Data koreksi berhasil dihapus.");
      await muatDaftarKoreksi();
    } catch (err) {
      console.error("Gagal menghapus data koreksi:", err);
      alert("Gagal menghapus data. Periksa koneksi.");
      btnHapus.disabled = false;
      btnHapus.innerText = "Hapus";
    }
  });

  // 4b. Event checkbox terdelegasi di tbody
  tbody?.addEventListener("change", function (e) {
    if (e.target.classList.contains("check-koreksi-item")) {
      perbaruiStatusHapusMassal();
      const checkAll = document.getElementById("check-all-koreksi");
      if (checkAll && !e.target.checked) {
        checkAll.checked = false;
      } else if (checkAll && e.target.checked) {
        const total = document.querySelectorAll(".check-koreksi-item").length;
        const checkedCount = document.querySelectorAll(".check-koreksi-item:checked").length;
        checkAll.checked = (total === checkedCount);
      }
    }
  });

  // 4c. Event Master Checkbox
  const checkAllKoreksi = document.getElementById("check-all-koreksi");
  checkAllKoreksi?.addEventListener("change", function () {
    const isChecked = this.checked;
    const items = document.querySelectorAll(".check-koreksi-item");
    items.forEach((item) => {
      item.checked = isChecked;
    });
    perbaruiStatusHapusMassal();
  });

  // 4d. Event Button Hapus Terpilih
  const btnHapusMassal = document.getElementById("btn-hapus-massal-koreksi");
  btnHapusMassal?.addEventListener("click", async function () {
    const checkboxTerpilih = document.querySelectorAll(".check-koreksi-item:checked");
    const idsToHapus = Array.from(checkboxTerpilih).map((chk) => chk.getAttribute("data-id"));
    
    if (idsToHapus.length === 0) return;

    const konfirmasi = confirm(`Apakah Anda yakin ingin menghapus ${idsToHapus.length} data koreksi yang dipilih secara permanen dari database?`);
    if (!konfirmasi) return;

    try {
      btnHapusMassal.disabled = true;
      btnHapusMassal.innerHTML = "⏳ Sedang menghapus...";

      // Jalankan penghapusan satu-persatu secara paralel
      const promises = idsToHapus.map((id) => deleteKoreksiUh(id));
      await Promise.all(promises);

      alert("Sukses menghapus data koreksi terpilih.");
      await muatDaftarKoreksi();
    } catch (err) {
      console.error("Gagal menghapus data koreksi secara massal:", err);
      alert("Terjadi kesalahan saat menghapus data. Beberapa data mungkin gagal terhapus.");
      await muatDaftarKoreksi();
    } finally {
      btnHapusMassal.disabled = false;
      perbaruiStatusHapusMassal();
    }
  });

  // 5. Event submit form batch ZIP
  const formBatch = document.getElementById("form-batch-koreksi-zip");
  const inputZip = document.getElementById("input-zip-koreksi");
  const progresBox = document.getElementById("progres-batch-koreksi");
  const progresLog = document.getElementById("progres-batch-log");
  const btnSubmitBatch = document.getElementById("btn-submit-batch-zip");

  formBatch?.addEventListener("submit", async function (e) {
    e.preventDefault();
    
    if (typeof JSZip === "undefined") {
      alert("Pustaka JSZip belum termuat! Harap tunggu atau refresh halaman.");
      return;
    }

    const file = inputZip.files[0];
    if (!file) {
      alert("Pilih file ZIP terlebih dahulu!");
      return;
    }

    try {
      btnSubmitBatch.disabled = true;
      btnSubmitBatch.innerText = "⏳ Sedang Memproses ZIP...";
      progresBox.style.display = "block";
      progresLog.innerHTML = "<p>📖 Membaca berkas ZIP...</p>";

      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);

      // Maps to hold file data
      const jsons = {};
      const pdfs = {};

      // Parse files inside ZIP
      const promises = [];
      zip.forEach((relativePath, zipEntry) => {
        if (zipEntry.dir) return;

        const basename = relativePath.split("/").pop(); // Get filename
        // Abaikan file tersembunyi/metadata macOS (__MACOSX) dan file diawali titik (.)
        if (relativePath.includes("__MACOSX") || basename.startsWith(".")) {
          return;
        }

        const lowercasePath = relativePath.toLowerCase();
        const dotIdx = basename.lastIndexOf(".");
        if (dotIdx === -1) return;
        const cleanName = basename.substring(0, dotIdx);

        if (lowercasePath.endsWith(".json")) {
          const p = zipEntry.async("string").then((content) => {
            try {
              jsons[cleanName] = JSON.parse(content);
            } catch (err) {
              tulisLog(`❌ Gagal membaca JSON '${relativePath}': Format tidak valid.`);
            }
          });
          promises.push(p);
        } else if (lowercasePath.endsWith(".pdf")) {
          const p = zipEntry.async("blob").then((blob) => {
            pdfs[cleanName] = blob;
          });
          promises.push(p);
        }
      });

      await Promise.all(promises);

      const totalJson = Object.keys(jsons).length;
      tulisLog(`📦 Berhasil membongkar ZIP: Ditemukan ${totalJson} file JSON koreksi dan ${Object.keys(pdfs).length} file PDF.`);

      if (totalJson === 0) {
        alert("Tidak ada file JSON koreksi (.json) yang ditemukan di dalam ZIP!");
        btnSubmitBatch.disabled = false;
        btnSubmitBatch.innerText = "🚀 Mulai Unggah Massal (Batch Upload)";
        return;
      }

      let suksesCount = 0;
      let gagalCount = 0;

      const profilSiswa = state.profilSiswa || [];

      // Proses setiap berkas koreksi secara paralel untuk kecepatan maksimal
      const uploadPromises = Object.entries(jsons).map(async ([jsonKey, jsonData]) => {
        const studentName = jsonData.metadata?.nama_siswa;
        const topikUjian = jsonData.metadata?.topik_ujian || "UH Matematika";

        if (!studentName) {
          tulisLog(`❌ Berkas '${jsonKey}.json' tidak memiliki metadata nama_siswa. Dilewati.`);
          gagalCount++;
          return;
        }

        // Match student profile
        const matchedStudent = cariKecocokanSiswa(studentName, profilSiswa);
        if (!matchedStudent) {
          tulisLog(`❌ Siswa bernama '${studentName}' (di berkas '${jsonKey}.json') tidak ditemukan di database. Dilewati.`);
          gagalCount++;
          return;
        }

        const nis = matchedStudent.id;
        tulisLog(`👤 Siswa '${studentName}' cocok dengan NIS: ${nis}.`);

        // Find matching PDF (Smart Suffix Matching)
        let matchedPdfBlob = null;
        let pdfFilename = "";
        
        for (const [pdfKey, blob] of Object.entries(pdfs)) {
          if (apakahNamaFileCocok(jsonKey, pdfKey)) {
            matchedPdfBlob = blob;
            pdfFilename = pdfKey + ".pdf";
            break;
          }
        }

        let pdfUrl = "";
        if (matchedPdfBlob) {
          tulisLog(`⏳ Mengunggah PDF '${pdfFilename}' untuk ${studentName}...`);
          try {
            // Konversi blob ke File object
            const pdfFile = new File([matchedPdfBlob], pdfFilename, { type: "application/pdf" });
            pdfUrl = await uploadPdfKoreksi(nis, topikUjian, pdfFile);
            tulisLog(`✅ PDF '${pdfFilename}' berhasil diunggah.`);
          } catch (uploadErr) {
            tulisLog(`⚠️ Gagal mengunggah PDF '${pdfFilename}' ke Storage: ${uploadErr.message}. Koreksi akan disimpan tanpa PDF.`);
          }
        } else {
          tulisLog(`⚠️ Berkas PDF pekerjaan untuk '${studentName}' tidak ditemukan di ZIP. Koreksi disimpan tanpa PDF.`);
        }

        tulisLog(`💾 Menyimpan data koreksi untuk ${studentName} ke Firestore...`);
        try {
          await saveKoreksiUh(nis, topikUjian, jsonData, pdfUrl);
          tulisLog(`🎉 Koreksi untuk ${studentName} BERHASIL disimpan!`);
          suksesCount++;
        } catch (saveErr) {
          tulisLog(`❌ Gagal menyimpan koreksi ke Firestore untuk ${studentName}: ${saveErr.message}`);
          gagalCount++;
        }
      });

      await Promise.all(uploadPromises);

      tulisLog(`🏁 **PROSES SELESAI**: Sukses: ${suksesCount}, Gagal/Dilewati: ${gagalCount}.`);
      alert(`Batch Upload Selesai!\nSukses: ${suksesCount}\nGagal/Dilewati: ${gagalCount}`);
      
      // Clean input & reload list
      inputZip.value = "";
      await muatDaftarKoreksi();
    } catch (err) {
      console.error("Gagal melakukan batch upload ZIP:", err);
      alert("Gagal memproses berkas ZIP: " + err.message);
    } finally {
      btnSubmitBatch.disabled = false;
      btnSubmitBatch.innerText = "🚀 Mulai Unggah Massal (Batch Upload)";
    }
  });

  function tulisLog(teks) {
    if (progresLog) {
      const p = document.createElement("p");
      p.innerHTML = teks;
      progresLog.appendChild(p);
      progresLog.scrollTop = progresLog.scrollHeight; // Auto scroll
    }
  }
}

/**
 * Menampilkan ringkasan informasi JSON di UI admin
 * @param {Object} parsed - Objek JSON koreksi
 */
function tampilkanRingkasanJson(parsed) {
  const container = document.getElementById("info-ringkasan-koreksi");
  const wadahRingkasan = document.getElementById("ringkasan-konten-json");
  if (!container || !wadahRingkasan) return;

  const meta = parsed.metadata || {};
  const ringkasan = parsed.ringkasan_nilai || {};

  wadahRingkasan.innerHTML = `
    <p><b>Nama Siswa:</b> ${meta.nama_siswa}</p>
    <p><b>Kelas:</b> ${meta.kelas || "-"}</p>
    <p><b>Topik Ujian:</b> ${meta.topik_ujian}</p>
    <p><b>Nilai Wajib:</b> ${ringkasan.skor_wajib} / ${ringkasan.skor_wajib_maksimal}</p>
    <p><b>Nilai Tambahan:</b> ${ringkasan.skor_tambahan || 0} / ${ringkasan.skor_tambahan_maksimal || 0}</p>
    <p><b>Predikat:</b> ${ringkasan.predikat || "-"}</p>
    <p><b>Jumlah Soal:</b> ${parsed.daftar_soal?.length || 0} soal</p>
  `;

  container.style.display = "block";
}

/**
 * Mencocokkan nama dari JSON dengan data profil siswa secara otomatis
 * @param {string} namaJson - Nama siswa dari berkas JSON
 */
export function cocokkanSiswaOtomatis(namaJson) {
  const selectSiswa = document.getElementById("select-siswa-koreksi");
  if (!selectSiswa || !namaJson) return;

  const profilSiswa = state.profilSiswa || [];
  const cocok = cariKecocokanSiswa(namaJson, profilSiswa);

  if (cocok) {
    selectSiswa.value = cocok.id; // Pilih NIS siswa
  } else {
    selectSiswa.value = ""; // Kosongkan agar guru memilih manual
    alert(`Peringatan: Siswa dengan nama "${namaJson}" tidak ditemukan di database. Harap pilih secara manual dari dropdown.`);
  }
}

/**
 * Memperbarui status tombol Hapus Terpilih berdasarkan jumlah checkbox yang dicentang
 */
function perbaruiStatusHapusMassal() {
  const btnHapusMassal = document.getElementById("btn-hapus-massal-koreksi");
  if (!btnHapusMassal) return;

  const checkboxTerpilih = document.querySelectorAll(".check-koreksi-item:checked");
  const jumlahSelected = checkboxTerpilih.length;

  if (jumlahSelected > 0) {
    btnHapusMassal.style.display = "inline-block";
    btnHapusMassal.innerHTML = `🗑️ Hapus Terpilih (<span id="jumlah-terpilih-koreksi">${jumlahSelected}</span>)`;
  } else {
    btnHapusMassal.style.display = "none";
    btnHapusMassal.innerHTML = `🗑️ Hapus Terpilih (<span id="jumlah-terpilih-koreksi">0</span>)`;
  }
}
