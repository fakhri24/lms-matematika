// public/js/admin/bankSoalController.js

import { state } from "./adminState.js";
import {
  hapusSoalDB,
  tambahSoalDB,
  updateSoalDB,
  sinkronisasiMetadataSiswaDB,
  upsertSoalImportDB,
} from "../services/adminService.js";
// IMPORT VIEW BARU
import {
  createRowBankSoalHTML,
  createOpsiPreviewHTML,
  createPreviewSoalHTML,
  createLivePreviewHTML,
} from "../views/adminBankSoalView.js";

let halamanSaatIniSoal = 1;
const barisPerHalamanSoal = 10;
let timerLivePreview = null;

// ==========================================
// 1. RENDER & FILTER TABEL
// ==========================================
export function renderTabelBankSoal() {
  const tbody = document.getElementById("tabel-bank-soal");
  const infoHalaman = document.getElementById("info-halaman-soal");
  const btnPrev = document.getElementById("btn-prev-soal");
  const btnNext = document.getElementById("btn-next-soal");

  tbody.innerHTML = "";
  if (state.dataBankSoalAktif.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 30px;">Tidak ada soal ditemukan.</td></tr>`;
    return;
  }

  const totalHalaman = Math.ceil(
    state.dataBankSoalAktif.length / barisPerHalamanSoal,
  );
  const indeksAwal = (halamanSaatIniSoal - 1) * barisPerHalamanSoal;
  const dataHalamanIni = state.dataBankSoalAktif.slice(
    indeksAwal,
    indeksAwal + barisPerHalamanSoal,
  );

  dataHalamanIni.forEach((soal) => {
    // FORMAT DATA SEBELUM DIKIRIM KE VIEW
    let cuplikan = soal.pertanyaan.replace(/<[^>]*>?/gm, "");
    cuplikan =
      cuplikan.length > 50 ? cuplikan.substring(0, 50) + "..." : cuplikan;

    const statusPembahasan = soal.pembahasan
      ? '<span class="badge-nilai" style="background-color: var(--success-color);">Ada</span>'
      : '<span class="badge-nilai" style="background-color: #ef4444;">Belum</span>';

    const level = soal.tingkat_kesulitan || 1;
    const levelEmpiris = soal.tingkat_kesulitan_empiris || level;
    let badgeLevel = level == 3 ? "🟥" : level == 2 ? "🟨" : "🟩";

    if (level !== levelEmpiris) {
      const teksEmpiris =
        levelEmpiris == 3 ? "Sulit" : levelEmpiris == 2 ? "Sedang" : "Mudah";
      const ikonEmpiris =
        levelEmpiris == 3 ? "🟥" : levelEmpiris == 2 ? "🟨" : "🟩";
      badgeLevel += ` <span title='Anomali! Di lapangan soal ini terbukti ${teksEmpiris} (Win Rate: ${soal.win_rate || 0}%)' style='font-size:0.9rem; cursor:help;'>⚠️${ikonEmpiris}</span>`;
    }

    let arrPrasyarat = [];
    if (soal.konsep_prasyarat) {
      if (Array.isArray(soal.konsep_prasyarat))
        arrPrasyarat = soal.konsep_prasyarat;
      else if (typeof soal.konsep_prasyarat === "string")
        arrPrasyarat = soal.konsep_prasyarat.split(",").map((p) => p.trim());
    }

    let prasyaratHTML =
      '<span style="color:#94a3b8; font-size: 0.8rem;">-</span>';
    if (arrPrasyarat.length > 0 && arrPrasyarat[0] !== "") {
      prasyaratHTML = `<div style="display: flex; flex-wrap: wrap; gap: 4px; max-width: 180px;">`;
      arrPrasyarat.forEach((p) => {
        if (p)
          prasyaratHTML += `<span style="font-size: 0.7rem; color: #475569; background: #f1f5f9; padding: 3px 8px; border-radius: 12px; border: 1px solid #cbd5e1; white-space: nowrap;">🔑 ${p}</span>`;
      });
      prasyaratHTML += `</div>`;
    }

    // PANGGIL VIEW
    const tr = document.createElement("tr");
    tr.innerHTML = createRowBankSoalHTML(
      soal,
      badgeLevel,
      prasyaratHTML,
      cuplikan,
      statusPembahasan,
    );
    tbody.appendChild(tr);
  });

  infoHalaman.innerText = `Halaman ${halamanSaatIniSoal} dari ${totalHalaman}`;
  btnPrev.disabled = halamanSaatIniSoal === 1;
  btnNext.disabled = halamanSaatIniSoal === totalHalaman || totalHalaman === 0;
}

export function siapkanDropdownFilterBank() {
  const filterMateri = document.getElementById("filter-materi-bank");
  const filterSub = document.getElementById("filter-sub-bank");
  if (!filterMateri || !filterSub) return;

  const materiLama = filterMateri.value;
  const subLama = filterSub.value;

  state.petaMateriBankSoal = {};
  state.dataBankSoalMentah.forEach((s) => {
    const m = s.materi_utama || DATA_DEFAULT.MATERI;
    const sm = s.sub_materi || DATA_DEFAULT.SUB_MATERI;
    if (!state.petaMateriBankSoal[m]) state.petaMateriBankSoal[m] = new Set();
    state.petaMateriBankSoal[m].add(sm);
  });

  let htmlMateri = '<option value="">Semua Materi</option>';
  Object.keys(state.petaMateriBankSoal)
    .sort()
    .forEach((m) => (htmlMateri += `<option value="${m}">${m}</option>`));
  filterMateri.innerHTML = htmlMateri;
  filterMateri.value = materiLama;

  let htmlSub = '<option value="">Semua Sub-Materi</option>';
  if (materiLama !== "" && state.petaMateriBankSoal[materiLama]) {
    Array.from(state.petaMateriBankSoal[materiLama])
      .sort()
      .forEach((sm) => (htmlSub += `<option value="${sm}">${sm}</option>`));
  }
  filterSub.innerHTML = htmlSub;
  filterSub.value = subLama;
}

export const terapkanFilterBankSoal = function () {
  const keyword = (
    document.getElementById("search-bank-soal")?.value || ""
  ).toLowerCase();
  const materiPilihan =
    document.getElementById("filter-materi-bank")?.value || "";
  const subPilihan = document.getElementById("filter-sub-bank")?.value || "";

  state.dataBankSoalAktif = state.dataBankSoalMentah.filter((s) => {
    const matchSearch =
      (s.pertanyaan || "").toLowerCase().includes(keyword) ||
      (s.sub_materi || "").toLowerCase().includes(keyword) ||
      (s.materi_utama || "").toLowerCase().includes(keyword);
    const matchMateri =
      materiPilihan === "" ||
      (s.materi_utama || DATA_DEFAULT.MATERI) === materiPilihan;
    const matchSub =
      subPilihan === "" ||
      (s.sub_materi || DATA_DEFAULT.SUB_MATERI) === subPilihan;
    return matchSearch && matchMateri && matchSub;
  });

  halamanSaatIniSoal = 1;
  renderTabelBankSoal();
};

// ==========================================
// 2. PREVIEW & LIVE PREVIEW
// ==========================================
export function lihatPreviewSoal(idSoal) {
  const soal = state.dataBankSoalMentah.find((s) => s.id === idSoal);
  if (!soal) return;

  const wadah = document.getElementById("wadah-preview-soal");

  // Format Opsi
  let opsiHTMLStr = "";
  if (soal.opsi) {
    soal.opsi.forEach((opt, i) => {
      opsiHTMLStr += createOpsiPreviewHTML(
        opt,
        opt === soal.jawaban_benar,
        String.fromCharCode(65 + i),
      );
    });
  }

  // Format Prasyarat Badge
  const badgePrasyaratHTML = soal.konsep_prasyarat
    ? `<span style="font-size: 0.75rem; background: #f1f5f9; border: 1px solid #cbd5e1; padding: 4px 10px; border-radius: 20px; color: #64748b;"> 🔑 Prasyarat: ${Array.isArray(soal.konsep_prasyarat) ? soal.konsep_prasyarat.join(", ") : soal.konsep_prasyarat.replace(/,(?=[^\s])/g, ", ")}</span>`
    : "";

  // PANGGIL VIEW UNTUK PREVIEW
  wadah.innerHTML = createPreviewSoalHTML(
    soal,
    opsiHTMLStr,
    badgePrasyaratHTML,
  );

  document.getElementById("modal-preview").style.display = "flex";
  if (window.MathJax)
    MathJax.typesetPromise([wadah]).catch((err) => console.error(err));
}

export function tutupPreviewSoal() {
  document.getElementById("modal-preview").style.display = "none";
}

export function triggerLivePreview() {
  clearTimeout(timerLivePreview);
  timerLivePreview = setTimeout(() => {
    // AMBIL DATA DARI INPUT ADMIN
    const materi =
      document.getElementById("edit-materi").value || "Materi Umum";
    const sub = document.getElementById("edit-sub").value || "Sub-Materi";
    const tanya = (
      document.getElementById("edit-tanya").value ||
      '<i style="color:#94a3b8;">Ketik pertanyaanmu di sebelah kiri...</i>'
    ).replace(/\n/g, "<br>");
    const bahas = (document.getElementById("edit-bahas").value || "").replace(
      /\n/g,
      "<br>",
    );
    const kesulitan = document.getElementById("edit-kesulitan").value;
    const prasyarat = document.getElementById("edit-prasyarat").value.trim();
    const cluePreview = (
      document.getElementById("edit-clue")?.value || ""
    ).replace(/\n/g, "<br>");

    const warnaKesulitan =
      kesulitan == "3" ? "#ef4444" : kesulitan == "2" ? "#f59e0b" : "#10b981";
    const teksKesulitan =
      kesulitan == "3" ? "Sulit" : kesulitan == "2" ? "Sedang" : "Mudah";

    // Format Opsi Live Preview
    let opsiHTMLStr = "";
    for (let i = 0; i < 5; i++) {
      const teksOpsi = document.getElementById(`edit-opsi-${i}`).value.trim();
      const isKunci = document.getElementById(`edit-kunci-${i}`).checked;
      if (teksOpsi !== "") {
        opsiHTMLStr += createOpsiPreviewHTML(
          teksOpsi,
          isKunci,
          String.fromCharCode(65 + i),
        );
      }
    }

    // PANGGIL VIEW UNTUK LIVE PREVIEW
    const wadah = document.getElementById("wadah-live-preview");
    wadah.innerHTML = createLivePreviewHTML(
      materi,
      sub,
      tanya,
      bahas,
      kesulitan,
      prasyarat,
      warnaKesulitan,
      teksKesulitan,
      cluePreview,
      opsiHTMLStr,
    );

    if (window.MathJax)
      MathJax.typesetPromise([wadah]).catch((err) => console.error(err));
  }, 500);
}

// ==========================================
// 3. CRUD SOAL & SINKRONISASI
// ==========================================
export async function hapusSoal(idSoal) {
  if (!confirm("⚠️ Yakin ingin menghapus soal ini secara permanen?")) return;
  try {
    await hapusSoalDB(idSoal);
    state.dataBankSoalMentah = state.dataBankSoalMentah.filter(
      (s) => s.id !== idSoal,
    );

    terapkanFilterBankSoal();
    const totalHalaman = Math.ceil(
      state.dataBankSoalAktif.length / barisPerHalamanSoal,
    );
    if (halamanSaatIniSoal > totalHalaman && halamanSaatIniSoal > 1)
      halamanSaatIniSoal--;

    siapkanDropdownFilterBank();
    renderTabelBankSoal();
    sinkronisasiMetadata();
    alert("Berhasil! Soal telah dihapus.");
  } catch (error) {
    console.error("Error menghapus soal:", error);
    alert("Gagal menghapus soal. Periksa koneksi internetmu.");
  }
}

export function bukaModalTambah() {
  document.getElementById("judul-modal-soal").innerText =
    "➕ Tambah Soal Baru & Live Preview";
  [
    "edit-id",
    "edit-tanya",
    "edit-clue",
    "edit-bahas",
    "edit-prasyarat",
  ].forEach((id) => (document.getElementById(id).value = ""));
  document.getElementById("edit-kesulitan").value = "1";
  for (let i = 0; i < 5; i++) {
    document.getElementById(`edit-opsi-${i}`).value = "";
    document.getElementById(`edit-kunci-${i}`).checked = false;
  }
  document.getElementById("modal-edit-soal").style.display = "flex";
  triggerLivePreview();
}

export function bukaModalEdit(idSoal) {
  const soal = state.dataBankSoalMentah.find((s) => s.id === idSoal);
  if (!soal) return;

  document.getElementById("judul-modal-soal").innerText =
    "✏️ Edit Soal & Live Preview";
  document.getElementById("edit-id").value = soal.id;
  document.getElementById("edit-materi").value =
    soal.materi_utama || DATA_DEFAULT.MATERI;
  document.getElementById("edit-sub").value =
    soal.sub_materi || DATA_DEFAULT.SUB_MATERI;
  document.getElementById("edit-kesulitan").value =
    soal.tingkat_kesulitan || "1";
  document.getElementById("edit-prasyarat").value = Array.isArray(
    soal.konsep_prasyarat,
  )
    ? soal.konsep_prasyarat.join(", ")
    : soal.konsep_prasyarat || "";
  document.getElementById("edit-tanya").value = (soal.pertanyaan || "").replace(
    /<br\s*[\/]?>/gi,
    "\n",
  );
  document.getElementById("edit-clue").value = (soal.clue || "").replace(
    /<br\s*[\/]?>/gi,
    "\n",
  );
  document.getElementById("edit-bahas").value = (soal.pembahasan || "").replace(
    /<br\s*[\/]?>/gi,
    "\n",
  );

  const daftarOpsi = soal.opsi || [];
  for (let i = 0; i < 5; i++) {
    document.getElementById(`edit-opsi-${i}`).value = daftarOpsi[i] || "";
    document.getElementById(`edit-kunci-${i}`).checked =
      daftarOpsi[i] === soal.jawaban_benar;
  }
  document.getElementById("modal-edit-soal").style.display = "flex";
  triggerLivePreview();
}

export function tutupModalEdit() {
  document.getElementById("modal-edit-soal").style.display = "none";
}

export async function simpanEditSoal() {
  const idSoal = document.getElementById("edit-id").value;
  const materi = document.getElementById("edit-materi").value.trim();
  const sub = document.getElementById("edit-sub").value.trim();
  const btnSimpan = document.getElementById("btn-simpan-edit");

  const opsiBaru = [];
  let jawabanBenar = "";
  for (let i = 0; i < 5; i++) {
    const val = document.getElementById(`edit-opsi-${i}`).value.trim();
    if (val !== "") {
      opsiBaru.push(val);
      if (document.getElementById(`edit-kunci-${i}`).checked)
        jawabanBenar = val;
    }
  }

  if (!materi || !sub) return alert("Materi Utama dan Sub-Materi harus diisi!");
  if (!document.getElementById("edit-tanya").value || opsiBaru.length < 2)
    return alert("Pertanyaan dan minimal 2 opsi jawaban harus diisi!");
  if (!jawabanBenar)
    return alert(
      "Kamu belum memilih Kunci Jawaban! Klik salah satu radio button.",
    );

  btnSimpan.innerText = "Menyimpan...";
  btnSimpan.disabled = true;

  try {
    const dataSimpan = {
      materi_utama: materi,
      sub_materi: sub,
      tingkat_kesulitan: parseInt(
        document.getElementById("edit-kesulitan").value,
      ),
      konsep_prasyarat: document.getElementById("edit-prasyarat").value.trim()
        ? document
            .getElementById("edit-prasyarat")
            .value.trim()
            .split(",")
            .map((p) => p.trim())
            .filter((p) => p !== "")
        : [],
      pertanyaan: document
        .getElementById("edit-tanya")
        .value.replace(/\n/g, "<br>"),
      clue: document.getElementById("edit-clue").value.replace(/\n/g, "<br>"),
      opsi: opsiBaru,
      jawaban_benar: jawabanBenar,
      pembahasan: document
        .getElementById("edit-bahas")
        .value.replace(/\n/g, "<br>"),
      waktu_update: new Date().toISOString(),
    };

    if (idSoal === "") {
      const newId = await tambahSoalDB(dataSimpan);
      dataSimpan.id = newId;
      state.dataBankSoalMentah.unshift(dataSimpan);
    } else {
      await updateSoalDB(idSoal, dataSimpan);
      const index = state.dataBankSoalMentah.findIndex((s) => s.id === idSoal);
      if (index > -1)
        state.dataBankSoalMentah[index] = {
          ...state.dataBankSoalMentah[index],
          ...dataSimpan,
        };
    }

    siapkanDropdownFilterBank();
    terapkanFilterBankSoal();
    sinkronisasiMetadata();
    tutupModalEdit();
  } catch (error) {
    console.error("Gagal menyimpan soal:", error);
    alert("Gagal menyimpan. Pastikan koneksi internet stabil.");
  } finally {
    btnSimpan.innerText = "Simpan Perubahan";
    btnSimpan.disabled = false;
  }
}

export async function sinkronisasiMetadata() {
  try {
    const metaDataMap = {};
    state.dataBankSoalMentah.forEach((data) => {
      if (!data.sub_materi) return;
      const subMatNormal = data.sub_materi.toLowerCase().trim();
      if (!metaDataMap[subMatNormal])
        metaDataMap[subMatNormal] = {
          materi_utama: data.materi_utama || DATA_DEFAULT.MATERI,
          nama_asli: data.sub_materi,
          jumlah_soal: 0,
        };
      metaDataMap[subMatNormal].jumlah_soal++;
    });
    await sinkronisasiMetadataSiswaDB(metaDataMap);
  } catch (error) {
    console.error("Gagal sinkronisasi metadata:", error);
  }
}

// ==========================================
// 4. IMPORT & EXPORT JSON
// ==========================================
export function unduhBankSoalJSON() {
  if (state.dataBankSoalAktif.length === 0)
    return alert("Belum ada data soal untuk diunduh!");

  // 1. Mapping manual untuk memaksa urutan dan membuang kunci ekstra
  const dataBersih = state.dataBankSoalAktif.map((soal) => {
    return {
      id: soal.id,
      materi_utama: soal.materi_utama || "",
      sub_materi: soal.sub_materi || "",
      tingkat_kesulitan: soal.tingkat_kesulitan || 1,
      konsep_prasyarat: soal.konsep_prasyarat || [],
      pertanyaan: soal.pertanyaan || "",
      clue: soal.clue || "",
      opsi: soal.opsi || [],
      jawaban_benar: soal.jawaban_benar || "",
      pembahasan: soal.pembahasan || "",
    };
  });

  const blob = new Blob([JSON.stringify(dataBersih, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;

  // 3. Logika penamaan file dinamis yang baru
  const filterMateri = document.getElementById("filter-materi-bank")?.value;
  const filterSub = document.getElementById("filter-sub-bank")?.value;

  let namaFile = "bank_soal_all.json"; // Default jika tidak ada filter materi yang dipilih

  if (filterSub && filterSub !== "") {
    // Prioritas 1: Jika sub-materi dipilih
    const namaAman = filterSub.toLowerCase().replace(/[^a-z0-9]/g, "_");
    namaFile = `bank_soal_${namaAman}.json`;
  } else if (filterMateri && filterMateri !== "") {
    // Prioritas 2: Jika hanya materi utama yang dipilih (sub-materi "Semua")
    const namaAman = filterMateri.toLowerCase().replace(/[^a-z0-9]/g, "_");
    namaFile = `bank_soal_${namaAman}.json`;
  }

  link.download = namaFile;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function importBankSoalJSON(event, onCallbackSukses) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const kumpulanSoal = JSON.parse(e.target.result);
      if (!Array.isArray(kumpulanSoal))
        throw new Error("Format JSON harus berupa Array.");
      if (
        !confirm(`Kamu akan mengimport ${kumpulanSoal.length} soal. Lanjutkan?`)
      )
        return;

      let jumlahBerhasil = 0;
      const prosesImport = kumpulanSoal.map(async (soal) => {
        const { id, ...dataTanpaID } = soal;
        dataTanpaID.tingkat_kesulitan = dataTanpaID.tingkat_kesulitan || 1;
        dataTanpaID.materi_utama =
          dataTanpaID.materi_utama || DATA_DEFAULT.MATERI;
        dataTanpaID.sub_materi =
          dataTanpaID.sub_materi || DATA_DEFAULT.SUB_MATERI;
        dataTanpaID.waktu_update = new Date().toISOString();
        dataTanpaID.opsi = Array.isArray(dataTanpaID.opsi)
          ? dataTanpaID.opsi
          : [];
        dataTanpaID.konsep_prasyarat = Array.isArray(
          dataTanpaID.konsep_prasyarat,
        )
          ? dataTanpaID.konsep_prasyarat
          : [];
        if (dataTanpaID.pertanyaan)
          dataTanpaID.pertanyaan = dataTanpaID.pertanyaan.replace(
            /\n/g,
            "<br>",
          );
        if (dataTanpaID.clue)
          dataTanpaID.clue = dataTanpaID.clue.replace(/\n/g, "<br>");
        if (dataTanpaID.pembahasan)
          dataTanpaID.pembahasan = dataTanpaID.pembahasan.replace(
            /\n/g,
            "<br>",
          );

        await upsertSoalImportDB(id, dataTanpaID);
        jumlahBerhasil++;
      });

      await Promise.all(prosesImport);
      alert(`Berhasil! ${jumlahBerhasil} soal telah diproses.`);
      event.target.value = "";
      if (onCallbackSukses) onCallbackSukses();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };
  reader.readAsText(file);
}

// ==========================================
// 5. REGISTRASI EVENT LISTENER (Dipanggil 1x dari admin.js)
// ==========================================
export function setupBankSoalListeners(onImportSuccess) {
  document.getElementById("btn-prev-soal")?.addEventListener("click", () => {
    if (halamanSaatIniSoal > 1) {
      halamanSaatIniSoal--;
      renderTabelBankSoal();
    }
  });
  document.getElementById("btn-next-soal")?.addEventListener("click", () => {
    if (
      halamanSaatIniSoal <
      Math.ceil(state.dataBankSoalAktif.length / barisPerHalamanSoal)
    ) {
      halamanSaatIniSoal++;
      renderTabelBankSoal();
    }
  });

  document
    .getElementById("search-bank-soal")
    ?.addEventListener("input", terapkanFilterBankSoal);
  document
    .getElementById("filter-sub-bank")
    ?.addEventListener("change", terapkanFilterBankSoal);
  document
    .getElementById("filter-materi-bank")
    ?.addEventListener("change", function () {
      const m = this.value;
      let htmlSub = '<option value="">Semua Sub-Materi</option>';
      if (m !== "" && state.petaMateriBankSoal[m])
        Array.from(state.petaMateriBankSoal[m])
          .sort()
          .forEach((sm) => (htmlSub += `<option value="${sm}">${sm}</option>`));
      document.getElementById("filter-sub-bank").innerHTML = htmlSub;
      terapkanFilterBankSoal();
    });

  document.getElementById("tabel-bank-soal")?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const action = btn.getAttribute("data-action");
    const idSoal = btn.getAttribute("data-id");
    if (action === "preview") lihatPreviewSoal(idSoal);
    if (action === "edit") bukaModalEdit(idSoal);
    if (action === "delete") hapusSoal(idSoal);
  });

  document
    .getElementById("btn-tambah-soal")
    ?.addEventListener("click", bukaModalTambah);
  document
    .getElementById("btn-tutup-preview")
    ?.addEventListener("click", tutupPreviewSoal);
  document
    .getElementById("btn-tutup-edit-atas")
    ?.addEventListener("click", tutupModalEdit);
  document
    .getElementById("btn-batal-edit")
    ?.addEventListener("click", tutupModalEdit);
  document
    .getElementById("btn-simpan-edit")
    ?.addEventListener("click", simpanEditSoal);

  [
    "edit-materi",
    "edit-sub",
    "edit-prasyarat",
    "edit-tanya",
    "edit-clue",
    "edit-bahas",
    "edit-opsi-0",
    "edit-opsi-1",
    "edit-opsi-2",
    "edit-opsi-3",
    "edit-opsi-4",
  ].forEach((id) =>
    document.getElementById(id)?.addEventListener("input", triggerLivePreview),
  );
  [
    "edit-kesulitan",
    "edit-kunci-0",
    "edit-kunci-1",
    "edit-kunci-2",
    "edit-kunci-3",
    "edit-kunci-4",
  ].forEach((id) =>
    document.getElementById(id)?.addEventListener("change", triggerLivePreview),
  );

  document
    .getElementById("btn-download-json")
    ?.addEventListener("click", unduhBankSoalJSON);
  document
    .getElementById("btn-trigger-import")
    ?.addEventListener("click", () =>
      document.getElementById("input-file-json").click(),
    );
  document
    .getElementById("input-file-json")
    ?.addEventListener("change", (e) => importBankSoalJSON(e, onImportSuccess));
}
