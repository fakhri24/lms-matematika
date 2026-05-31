import { db } from "../config/firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { state } from "./adminState.js";
import { MODE_LATIHAN } from "../utils/constants.js";
import { siapkanDraftSoal } from "../utils/soalEngine.js";
import { PETA_PRASYARAT_MANUAL } from "../utils/kurikulumData.js";

// DOM Elements
const formSpesial = document.getElementById("form-latihan-spesial");
const inputJudul = document.getElementById("input-judul-spesial");
const inputDurasi = document.getElementById("input-durasi-spesial");
const inputMulai = document.getElementById("input-mulai-spesial");
const inputSelesai = document.getElementById("input-selesai-spesial");
const selectMateriSpesial = document.getElementById("select-materi-spesial");
const wadahCheckbox = document.getElementById("wadah-checkbox-submateri");
const wadahDaftar = document.getElementById("wadah-daftar-spesial");
const modalHasil = document.getElementById("modal-hasil-spesial");
const btnTutupModal = document.getElementById("btn-tutup-hasil-spesial");
const judulModal = document.getElementById("judul-modal-hasil-spesial");
const tabelHasil = document.getElementById("tabel-hasil-spesial");
const btnSubmit = document.getElementById("btn-submit-spesial");

let petaMateriSpesial = {};

export async function inisialisasiLatihanSpesial() {
  siapkanDropdownMateriSpesial();
  await muatDaftarLatihanSpesial();

  if (formSpesial) {
    formSpesial.addEventListener("submit", handleSimpanLatihan);
  }

  if (btnTutupModal) {
    btnTutupModal.addEventListener("click", () => {
      modalHasil.style.display = "none";
    });
  }
}

function siapkanDropdownMateriSpesial() {
  if (!selectMateriSpesial || !wadahCheckbox) return;

  petaMateriSpesial = {};

  // Extract from state.dataBankSoalMentah
  state.dataBankSoalMentah.forEach((d) => {
    const m = d.materi_utama;
    const sub = d.sub_materi;
    if (m && sub) {
      if (!petaMateriSpesial[m]) petaMateriSpesial[m] = new Set();
      petaMateriSpesial[m].add(sub);
    }
  });

  let html = '<option value="">-- Pilih Materi Utama --</option>';
  Object.keys(petaMateriSpesial)
    .sort()
    .forEach((m) => {
      html += `<option value="${m}">${m}</option>`;
    });
  selectMateriSpesial.innerHTML = html;

  selectMateriSpesial.addEventListener("change", function () {
    const materiTerpilih = this.value;
    if (materiTerpilih !== "" && petaMateriSpesial[materiTerpilih]) {
      const daftarSubMateri = Array.from(
        petaMateriSpesial[materiTerpilih],
      ).sort();
      let htmlCb = "";
      daftarSubMateri.forEach((sub, index) => {
        htmlCb += `
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
            <input type="checkbox" id="submateri-spesial-${index}" name="submateri_spesial" value="${sub}" style="cursor: pointer;" />
            <label for="submateri-spesial-${index}" style="cursor: pointer; font-size: 0.9rem;">${sub}</label>
          </div>
        `;
      });
      wadahCheckbox.innerHTML = htmlCb;
    } else {
      wadahCheckbox.innerHTML =
        '<p class="text-muted text-sm">Pilih materi utama terlebih dahulu...</p>';
    }
  });
}

async function handleSimpanLatihan(e) {
  e.preventDefault();

  const judul = inputJudul.value.trim();
  const durasi = parseInt(inputDurasi.value);
  const mulai = inputMulai.value;
  const selesai = inputSelesai.value;
  const materiUtamaPilihan = selectMateriSpesial.value;

  if (!materiUtamaPilihan) {
    alert("Silakan pilih materi utama.");
    return;
  }

  const checkboxPilihan = document.querySelectorAll(
    'input[name="submateri_spesial"]:checked',
  );
  const subMateriPilihan = Array.from(checkboxPilihan).map((cb) => cb.value);

  if (subMateriPilihan.length === 0) {
    alert("Silakan pilih minimal 1 sub-materi.");
    return;
  }

  if (new Date(mulai) >= new Date(selesai)) {
    alert("Waktu Selesai harus lebih lambat dari Waktu Mulai.");
    return;
  }

  btnSubmit.disabled = true;
  btnSubmit.innerText = "Menyimpan...";

  try {
    const dataBaru = {
      judul,
      durasi_menit: durasi,
      waktu_mulai: new Date(mulai).toISOString(),
      waktu_selesai: new Date(selesai).toISOString(),
      materi_utama: materiUtamaPilihan,
      sub_materi: subMateriPilihan,
      created_at: new Date().toISOString(),
    };

    await addDoc(collection(db, "latihan_spesial"), dataBaru);
    alert("Latihan Spesial berhasil dibuat!");

    // Reset form
    formSpesial.reset();

    // Refresh daftar
    await muatDaftarLatihanSpesial();
    wadahCheckbox.innerHTML =
      '<p class="text-muted text-sm">Pilih materi utama terlebih dahulu...</p>';
  } catch (error) {
    console.error("Gagal menyimpan Latihan Spesial:", error);
    alert("Gagal menyimpan data.");
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerText = "Simpan & Buat Latihan Spesial";
  }
}

async function muatDaftarLatihanSpesial() {
  if (!wadahDaftar) return;

  try {
    const q = query(
      collection(db, "latihan_spesial"),
      orderBy("created_at", "desc"),
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      wadahDaftar.innerHTML =
        '<p class="text-muted text-sm" style="padding: 10px;">Belum ada Latihan Spesial yang dibuat.</p>';
      return;
    }

    let html = "";
    snap.docs.forEach((doc) => {
      const data = doc.data();
      const id = doc.id;

      const tMulai = new Date(data.waktu_mulai).toLocaleString("id-ID", {
        dateStyle: "short",
        timeStyle: "short",
      });
      const tSelesai = new Date(data.waktu_selesai).toLocaleString("id-ID", {
        dateStyle: "short",
        timeStyle: "short",
      });

      const now = new Date();
      let statusHtml = "";
      if (now < new Date(data.waktu_mulai)) {
        statusHtml =
          '<span class="badge" style="background: #94a3b8; color: white;">Akan Datang</span>';
      } else if (now > new Date(data.waktu_selesai)) {
        statusHtml =
          '<span class="badge" style="background: #ef4444; color: white;">Sudah Berakhir</span>';
      } else {
        statusHtml =
          '<span class="badge" style="background: #10b981; color: white;">Sedang Aktif</span>';
      }

      html += `
        <div class="menu-card" style="text-align: left; padding: 20px;" data-id="${id}" data-judul="${data.judul}">
          <div class="flex-between mb-10">
            <h4 class="text-primary" style="margin: 0;">${data.judul}</h4>
            ${statusHtml}
          </div>
          <p class="text-sm mb-5">⏱️ ${data.durasi_menit} Menit</p>
          <p class="text-sm mb-5">📅 ${tMulai} - ${tSelesai}</p>
          <p class="text-xs text-muted mb-10">Sub-Materi: ${data.sub_materi.join(", ")}</p>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm btn-lihat-hasil" style="flex: 1;" data-id="${id}" data-judul="${data.judul}">Lihat Hasil Siswa</button>
            <button class="btn btn-primary btn-sm btn-download-soal" style="flex: 1;" data-judul="${data.judul}" data-sub-materi='${JSON.stringify(data.sub_materi)}'>⬇ Sampel Soal</button>
          </div>
        </div>
      `;
    });

    wadahDaftar.innerHTML = html;

    // Attach listener
    const tombolLihat = document.querySelectorAll(".btn-lihat-hasil");
    tombolLihat.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = e.target.getAttribute("data-id");
        const judul = e.target.getAttribute("data-judul");
        tampilkanHasilSiswa(id, judul);
      });
    });

    document.querySelectorAll(".btn-download-soal").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const judul = e.currentTarget.getAttribute("data-judul");
        const subMateriList = JSON.parse(
          e.currentTarget.getAttribute("data-sub-materi"),
        );
        downloadSampelSoal(subMateriList, judul);
      });
    });
  } catch (error) {
    console.error("Gagal memuat daftar Latihan Spesial:", error);
    wadahDaftar.innerHTML =
      '<p class="text-danger text-sm">Gagal memuat daftar latihan.</p>';
  }
}

function downloadSampelSoal(subMateriList, judul) {
  const soalPool = state.dataBankSoalMentah.filter((s) =>
    subMateriList.includes(s.sub_materi),
  );

  if (soalPool.length === 0) {
    alert("Belum ada soal di bank soal untuk sub-materi ini.");
    return;
  }

  const sampel = siapkanDraftSoal(soalPool, MODE_LATIHAN.SPESIAL);

  const urutanKurikulum = Object.keys(PETA_PRASYARAT_MANUAL);
  const indexKurikulum = (sub) => {
    const idx = urutanKurikulum.findIndex(
      (k) => k.toLowerCase() === sub.toLowerCase()
    );
    return idx === -1 ? 9999 : idx;
  };

  const sampelTerurut = [...sampel].sort((a, b) => {
    const levelA = parseInt(a.tingkat_kesulitan) || 1;
    const levelB = parseInt(b.tingkat_kesulitan) || 1;
    if (levelA !== levelB) return levelA - levelB;
    return indexKurikulum(a.sub_materi) - indexKurikulum(b.sub_materi);
  });

  const output = sampelTerurut.map((s, i) => ({
    no: i + 1,
    sub_materi: s.sub_materi,
    tingkat_kesulitan: s.tingkat_kesulitan,
    pertanyaan: s.pertanyaan,
    pilihan_jawaban: s.pilihan_jawaban,
    jawaban_benar: s.jawaban_benar,
    id_soal: s.id_unik_sistem,
  }));

  const blob = new Blob([JSON.stringify(output, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sampel-soal_${judul.replace(/\s+/g, "-")}_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function tampilkanHasilSiswa(idLatihan, judul) {
  if (!modalHasil || !tabelHasil) return;

  judulModal.innerText = `Hasil: ${judul}`;
  tabelHasil.innerHTML =
    '<tr><td colspan="5" class="text-center text-muted" style="padding: 20px">Memuat data...</td></tr>';
  modalHasil.style.display = "flex";

  try {
    const hasilTerkait = state.dataMentah.filter(
      (d) =>
        d.mode_latihan === MODE_LATIHAN.SPESIAL &&
        d.id_latihan_spesial === idLatihan &&
        d.status !== "draf",
    );

    if (hasilTerkait.length === 0) {
      tabelHasil.innerHTML =
        '<tr><td colspan="5" class="text-center text-muted" style="padding: 20px">Belum ada siswa yang mengerjakan.</td></tr>';
      return;
    }

    // Urutkan berdasarkan nilai tertinggi
    hasilTerkait.sort((a, b) => b.nilai - a.nilai);

    let html = "";
    hasilTerkait.forEach((data, index) => {
      const tSubmit = new Date(data.waktu_submit).toLocaleString("id-ID", {
        dateStyle: "short",
        timeStyle: "short",
      });
      const menit = Math.floor(data.durasi_detik / 60);
      const detik = data.durasi_detik % 60;

      html += `
        <tr>
          <td>${index + 1}</td>
          <td class="font-bold">${data.nama_siswa || "Siswa"}</td>
          <td class="text-center text-sm">${tSubmit}</td>
          <td class="text-center text-sm">${menit}m ${detik}s</td>
          <td class="text-center font-bold text-primary">${data.nilai}</td>
        </tr>
      `;
    });

    tabelHasil.innerHTML = html;
  } catch (error) {
    console.error("Gagal memuat hasil siswa:", error);
    tabelHasil.innerHTML =
      '<tr><td colspan="5" class="text-danger text-center" style="padding: 20px">Terjadi kesalahan saat memuat data.</td></tr>';
  }
}
