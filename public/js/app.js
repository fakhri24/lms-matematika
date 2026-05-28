// public/js/app.js

// --- 1. IMPORTS ---
import { pantauSesi, logoutSistem } from "./services/authService.js";
import {
  feedbackSalahSatu,
  feedbackSalahDua,
  feedbackSalahTiga,
  feedbackPilihBahas,
  feedbackBenarSempurna,
  feedbackBenarBahas,
  getPesanAcak,
} from "./utils/feedbackDictionary.js";
import { cekMasteryDanGelar } from "./services/gelarService.js";
import {
  mulaiAtauLanjutStopwatch,
  dapatkanDanResetDurasiTerakhir,
  dapatkanTotalWaktuSekarang,
} from "./utils/timerSensor.js";
import { siapkanDraftSoal } from "./utils/soalEngine.js";
import {
  getBankSoalBySubMateri,
  getProgresFormatif,
  getDrafFormatif,
  simpanProgresSatuSoal,
  resetProgresFormatif,
  simpanDrafFormatifDB,
  simpanHasilAkhirDB,
  hapusDrafFormatifDB,
} from "./services/latihanService.js";
import {
  renderKartuSoal,
  renderElemenFormatif,
  createWilayahTertaklukkanHTML,
} from "./views/soalView.js";
import {
  MODE_LATIHAN,
  STATUS_LATIHAN,
  DATA_DEFAULT,
  LEVEL_SOAL,
} from "./utils/constants.js";

// --- 2. STATE MANAGEMENT ---
const state = {
  kumpulanSoal: [],
  indeksSaatIni: 0,
  offsetNomorSoal: 0,
  totalSoalKeseluruhan: 0,
  riwayatProgresGlobal: {},
  durasiSebelumnya: 0,
  memoriJawaban: {},
  urutanSoalGlobal: [],
  logPercobaanSebelumnya: {},
  intervalTimer: null,
  intervalAutosave: null,
  isSelesai: false,

  // Sesudah:
  modeLatihan: localStorage.getItem("mode_latihan") || MODE_LATIHAN.NORMAL,
  subMateriPilihan:
    localStorage.getItem("sub_materi_aktif") || DATA_DEFAULT.SUB_MATERI,
  materiUtama:
    localStorage.getItem("materi_utama_aktif") || DATA_DEFAULT.MATERI,
  nisAktif: localStorage.getItem("nis_siswa"),
  namaAktif: localStorage.getItem("nama_siswa") || DATA_DEFAULT.NAMA,
};

// --- 3. DOM ELEMENTS ---
const el = {
  wadahSoal: document.getElementById("wadah-soal"),
  statusKoneksi: document.getElementById("status-koneksi"),
  areaNavigasi: document.getElementById("navigasi-soal"),
  btnSkip: document.getElementById("btn-skip"),
  btnSimpan: document.getElementById("btn-simpan"),
  btnSebelumnya: document.getElementById("btn-sebelumnya"),
  btnSelanjutnya: document.getElementById("btn-selanjutnya"),
  btnSelesai: document.getElementById("btn-selesai"),
  teksHalaman: document.getElementById("teks-halaman"),
  elemenTimer: document.getElementById("tampilan-timer"),
  btnKembaliDasbor: document.getElementById("btn-kembali-dasbor"),
  wadahFeedback: document.getElementById("wadah-feedback-formatif"),
  pesanFeedback: document.getElementById("pesan-feedback"),
  areaClue: document.getElementById("area-clue"),
  teksClue: document.getElementById("teks-clue"),
  areaPembahasan: document.getElementById("area-pembahasan"),
  teksPembahasan: document.getElementById("teks-pembahasan"),
  btnCekJawaban: document.getElementById("btn-cek-jawaban"),
  btnLihatBahas: document.getElementById("btn-lihat-bahas"),
  btnLanjutFormatif: document.getElementById("btn-lanjut-formatif"),
};

// ==========================================
// 4. VIEW CONTROLLER (Delegasi ke soalView)
// ==========================================
function renderSoal() {
  const soal = state.kumpulanSoal[state.indeksSaatIni];
  el.btnCekJawaban.disabled = false;
  inisialisasiMemoriSoal(soal.id_unik_sistem);

  const dataMemori = state.memoriJawaban[soal.id_unik_sistem];
  const nomorTampil = state.offsetNomorSoal + state.indeksSaatIni + 1;

  // GUNAKAN VIEW UNTUK GAMBAR KARTU SOAL
  renderKartuSoal(
    el,
    soal,
    dataMemori,
    state.modeLatihan,
    nomorTampil,
    state.totalSoalKeseluruhan,
  );

  // Reset UI Tombol & Feedback Global
  el.btnSelesai.style.display = "none";
  el.wadahFeedback.style.display = "none";
  el.areaClue.style.display = "none";
  el.areaPembahasan.style.display = "none";

  const isTerakhir = state.indeksSaatIni === state.kumpulanSoal.length - 1;

  if (state.modeLatihan === MODE_LATIHAN.FORMATIF) {
    // Sembunyikan navigasi sumatif
    [el.btnSkip, el.btnSimpan, el.btnSebelumnya, el.btnSelanjutnya].forEach(
      (b) => (b.style.display = "none"),
    );

    // GUNAKAN VIEW UNTUK GAMBAR FORMATIF
    renderElemenFormatif(el, soal, dataMemori, isTerakhir);
  } else {
    // Mode Sumatif / Ujian
    el.btnCekJawaban.style.display = "none";
    el.btnLihatBahas.style.display = "none";
    el.btnLanjutFormatif.style.display = "none";

    if (state.modeLatihan === MODE_LATIHAN.NORMAL) {
      el.btnSebelumnya.style.display =
        state.indeksSaatIni === 0 ? "none" : "inline-block";
      el.btnSelanjutnya.style.display = isTerakhir ? "none" : "inline-block";
      if (isTerakhir) el.btnSelesai.style.display = "inline-block";
    } else {
      // tes_acak
      if (isTerakhir) {
        el.btnSkip.style.display = "none";
        el.btnSimpan.style.display = "none";
        el.btnSelesai.style.display = "inline-block";
      } else {
        el.btnSkip.style.display = "inline-block";
        el.btnSimpan.style.display = "inline-block";
      }
    }
  }

  renderMathJax();
  mulaiAtauLanjutStopwatch();
}

function renderMathJax() {
  if (window.MathJax && typeof window.MathJax.typesetPromise === "function") {
    MathJax.typesetPromise([el.wadahSoal, el.wadahFeedback]).catch((err) =>
      console.error(err),
    );
  } else {
    setTimeout(() => {
      if (window.MathJax && typeof window.MathJax.typesetPromise === "function")
        MathJax.typesetPromise([el.wadahSoal, el.wadahFeedback]).catch((err) =>
          console.error(err),
        );
    }, 500);
  }
}

function perbaruiTampilanTimer() {
  let selisihDetik = dapatkanTotalWaktuSekarang();

  // Jika mode formatif, tambahkan akumulasi waktu dari memori khusus untuk SOAL INI SAJA
  if (
    state.modeLatihan === MODE_LATIHAN.FORMATIF &&
    state.kumpulanSoal.length > 0
  ) {
    const idSoalAktif = state.kumpulanSoal[state.indeksSaatIni].id_unik_sistem;
    const waktuLamaSoalIni =
      state.memoriJawaban[idSoalAktif]?.durasi_detik || 0;
    selisihDetik += waktuLamaSoalIni;
  }

  const menit = Math.floor(selisihDetik / 60)
    .toString()
    .padStart(2, "0");
  const detik = (selisihDetik % 60).toString().padStart(2, "0");
  el.elemenTimer.innerText = `⏱️ ${menit}:${detik}`;
}

// ==========================================
// 5. CORE LOGIC
// ==========================================
function inisialisasiMemoriSoal(idSoal) {
  if (!state.memoriJawaban[idSoal]) {
    state.memoriJawaban[idSoal] = {
      percobaan: 0,
      jawaban_terakhir: null,
      status_selesai: false,
      skor_soal: 0,
      lihat_clue: false,
      lihat_bahas: false,
      pesan_aktif: "",
    };
  }
}

function simpanDurasiKeSoal(idSoal) {
  const durasiTambahan = dapatkanDanResetDurasiTerakhir();
  if (!state.memoriJawaban[idSoal]) inisialisasiMemoriSoal(idSoal);
  if (!state.memoriJawaban[idSoal].durasi_detik)
    state.memoriJawaban[idSoal].durasi_detik = 0;
  state.memoriJawaban[idSoal].durasi_detik += durasiTambahan;
  if (state.memoriJawaban[idSoal].durasi_detik > 900)
    state.memoriJawaban[idSoal].durasi_detik = 900;
}

function amankanJawabanLayar() {
  const radioTerpilih = document.querySelector('input[name="jawaban"]:checked');
  if (radioTerpilih) {
    const idSoalAktif = state.kumpulanSoal[state.indeksSaatIni].id_unik_sistem;
    inisialisasiMemoriSoal(idSoalAktif);
    state.memoriJawaban[idSoalAktif].jawaban_terakhir = radioTerpilih.value;
  }
}

async function sinkronRiwayatFormatifSementara() {
  // --- TAMBAHKAN BARIS INI ---
  amankanJawabanLayar();
  // ---------------------------

  // 1. Flush/Amankan dulu sisa stopwatch yang sedang berjalan ke soal saat ini
  simpanDurasiKeSoal(state.kumpulanSoal[state.indeksSaatIni].id_unik_sistem);

  // 2. Jumlahkan semua durasi yang sudah terekam aman di memori
  let tambahanWaktuSesiIni = 0;
  for (const idSoal in state.memoriJawaban) {
    if (state.memoriJawaban[idSoal].durasi_detik) {
      tambahanWaktuSesiIni += state.memoriJawaban[idSoal].durasi_detik;
    }
  }

  // 3. Gabungkan dengan durasi dari sesi draf sebelumnya (jika ada)
  const durasiTotalKumulatif = state.durasiSebelumnya + tambahanWaktuSesiIni;

  let totalPoinSementara = 0;
  let detailJawabanGabungan = {};
  let jumlahSelesai = 0;

  for (const id in state.riwayatProgresGlobal) {
    totalPoinSementara += state.riwayatProgresGlobal[id].skor;
    detailJawabanGabungan[id] = state.riwayatProgresGlobal[id].jawaban;
    jumlahSelesai++;
  }

  for (const idSoal in state.memoriJawaban) {
    if (state.memoriJawaban[idSoal].status_selesai) {
      totalPoinSementara += state.memoriJawaban[idSoal].skor_soal;
      detailJawabanGabungan[idSoal] =
        state.memoriJawaban[idSoal].jawaban_terakhir;
      if (!state.riwayatProgresGlobal[idSoal]) jumlahSelesai++;
    }
  }

  const skorSementara =
    state.totalSoalKeseluruhan === 0
      ? 0
      : Math.round(totalPoinSementara / state.totalSoalKeseluruhan);

  const dataHasil = {
    nis_siswa: state.nisAktif,
    nama_siswa: state.namaAktif,
    materi_utama: state.materiUtama,
    sub_materi: state.subMateriPilihan,
    nilai: skorSementara,
    durasi_detik: durasiTotalKumulatif,
    waktu_submit: new Date().toISOString(),
    detail_jawaban: detailJawabanGabungan,
    log_percobaan: { ...state.logPercobaanSebelumnya, ...state.memoriJawaban },
    urutan_soal: state.urutanSoalGlobal,
    mode_latihan: MODE_LATIHAN.FORMATIF,
    keterangan: `Progres: ${jumlahSelesai} dari ${state.totalSoalKeseluruhan} Soal`,
    status: STATUS_LATIHAN.DRAF,
  };

  const docIdKustom = `${state.nisAktif}_${state.subMateriPilihan.replace(/\s+/g, "")}_formatif_draft`;
  await simpanDrafFormatifDB(docIdKustom, dataHasil);
}

// ==========================================
// 6. EVENT LISTENERS
// ==========================================
pantauSesi((user) => {
  // Kosongkan saja, karena jika lolos fungsi mulaiAplikasi() di bawah akan jalan
}, false);

window.keluarAplikasi = function () {
  logoutSistem();
};

document
  .getElementById("btn-kembali-modal-hasil")
  ?.addEventListener("click", () => {
    window.location.href = "dashboard-siswa.html";
  });

// Event Listener Formatif
el.btnCekJawaban.addEventListener("click", () => {
  if (el.btnCekJawaban.disabled) return;
  el.btnCekJawaban.disabled = true;

  const radioTerpilih = document.querySelector('input[name="jawaban"]:checked');
  if (!radioTerpilih) {
    el.btnCekJawaban.disabled = false;
    return alert("Pilih jawaban dulu!");
  }

  const soal = state.kumpulanSoal[state.indeksSaatIni];
  const dataMemori = state.memoriJawaban[soal.id_unik_sistem];
  const jawabanUser = radioTerpilih.value;

  dataMemori.percobaan += 1;
  dataMemori.jawaban_terakhir = jawabanUser;

  if (jawabanUser === soal.jawaban_benar) {
    dataMemori.status_selesai = true;
    if (dataMemori.lihat_bahas) {
      dataMemori.skor_soal = 30;
      dataMemori.pesan_aktif = getPesanAcak(feedbackBenarBahas);
    } else if (dataMemori.lihat_clue || dataMemori.percobaan > 1) {
      dataMemori.skor_soal = 70;
      dataMemori.pesan_aktif = getPesanAcak(feedbackBenarSempurna);
    } else {
      dataMemori.skor_soal = 100;
      dataMemori.pesan_aktif = getPesanAcak(feedbackBenarSempurna);
    }

    if (state.modeLatihan === MODE_LATIHAN.FORMATIF) {
      simpanProgresSatuSoal(
        state.nisAktif,
        state.subMateriPilihan,
        soal.id_unik_sistem,
        dataMemori.skor_soal,
        jawabanUser,
      );
    }
  } else {
    if (dataMemori.percobaan >= 3) {
      dataMemori.lihat_bahas = true;
      dataMemori.pesan_aktif = getPesanAcak(feedbackSalahTiga);
    } else {
      const containerOpsi = document.getElementById(
        `opsi-container-${soal.id_unik_sistem}`,
      );
      if (containerOpsi) {
        containerOpsi.style.transform = "translateX(-5px)";
        setTimeout(
          () => (containerOpsi.style.transform = "translateX(5px)"),
          100,
        );
        setTimeout(
          () => (containerOpsi.style.transform = "translateX(0)"),
          200,
        );
      }
      dataMemori.pesan_aktif =
        dataMemori.percobaan === 2
          ? getPesanAcak(feedbackSalahDua)
          : getPesanAcak(feedbackSalahSatu);
      if (dataMemori.percobaan === 1) dataMemori.lihat_clue = true;
    }
  }
  simpanDurasiKeSoal(soal.id_unik_sistem);
  renderSoal();
});

el.btnLihatBahas.addEventListener("click", () => {
  const soal = state.kumpulanSoal[state.indeksSaatIni];
  const dataMemori = state.memoriJawaban[soal.id_unik_sistem];
  dataMemori.lihat_bahas = true;
  dataMemori.pesan_aktif = getPesanAcak(feedbackPilihBahas);
  simpanDurasiKeSoal(soal.id_unik_sistem);
  renderSoal();
});

el.btnLanjutFormatif.addEventListener("click", () => {
  simpanDurasiKeSoal(state.kumpulanSoal[state.indeksSaatIni].id_unik_sistem);
  state.indeksSaatIni++;
  renderSoal();
});

// Event Listeners Navigasi Sumatif
el.btnSkip.addEventListener("click", () => {
  simpanDurasiKeSoal(state.kumpulanSoal[state.indeksSaatIni].id_unik_sistem);
  state.indeksSaatIni++;
  renderSoal();
});

el.btnSimpan.addEventListener("click", () => {
  if (!document.querySelector('input[name="jawaban"]:checked'))
    return alert("Pilih jawaban dulu!");
  amankanJawabanLayar();
  simpanDurasiKeSoal(state.kumpulanSoal[state.indeksSaatIni].id_unik_sistem);
  state.indeksSaatIni++;
  renderSoal();
});

el.btnSebelumnya.addEventListener("click", () => {
  amankanJawabanLayar();
  simpanDurasiKeSoal(state.kumpulanSoal[state.indeksSaatIni].id_unik_sistem);
  state.indeksSaatIni--;
  renderSoal();
});

el.btnSelanjutnya.addEventListener("click", () => {
  amankanJawabanLayar();
  simpanDurasiKeSoal(state.kumpulanSoal[state.indeksSaatIni].id_unik_sistem);
  state.indeksSaatIni++;
  renderSoal();
});

// LOGIKA AKHIR PENGERJAAN
el.btnSelesai.addEventListener("click", async () => {
  state.isSelesai = true; // <-- TAMBAHKAN INI
  simpanDurasiKeSoal(state.kumpulanSoal[state.indeksSaatIni].id_unik_sistem);

  if (state.modeLatihan !== MODE_LATIHAN.FORMATIF) {
    amankanJawabanLayar();
    if (state.indeksSaatIni < state.kumpulanSoal.length - 1) {
      if (
        !confirm("Kamu belum melihat semua soal. Yakin ingin mengakhiri ujian?")
      )
        return;
    }
  }

  clearInterval(state.intervalTimer);

  // --- TAMBAHKAN BARIS INI ---
  if (state.intervalAutosave) clearInterval(state.intervalAutosave);

  // SOLUSI: Jumlahkan durasi per soal dari memori jawaban yang sudah terekam aman
  let durasiTotalKumulatif =
    state.modeLatihan === MODE_LATIHAN.FORMATIF ? state.durasiSebelumnya : 0;
  for (const idSoal in state.memoriJawaban) {
    if (state.memoriJawaban[idSoal].durasi_detik) {
      durasiTotalKumulatif += state.memoriJawaban[idSoal].durasi_detik;
    }
  }

  el.btnSelesai.innerText = "Mengirim...";
  el.btnSelesai.disabled = true;

  let nilaiAkhir = 0;
  let jumlahBenar = 0;
  const formatDetailJawabanDB = {};

  if (state.modeLatihan === MODE_LATIHAN.FORMATIF) {
    let totalPoinFormatif = 0;
    for (const id in state.riwayatProgresGlobal) {
      totalPoinFormatif += state.riwayatProgresGlobal[id].skor;
      formatDetailJawabanDB[id] = state.riwayatProgresGlobal[id].jawaban;
      jumlahBenar++;
    }
    for (const idSoal in state.memoriJawaban) {
      if (state.memoriJawaban[idSoal].status_selesai) {
        totalPoinFormatif += state.memoriJawaban[idSoal].skor_soal;
        formatDetailJawabanDB[idSoal] =
          state.memoriJawaban[idSoal].jawaban_terakhir;
        jumlahBenar++;
      }
    }
    nilaiAkhir =
      state.totalSoalKeseluruhan === 0
        ? 0
        : Math.round(totalPoinFormatif / state.totalSoalKeseluruhan);
  } else {
    state.kumpulanSoal.forEach((soal) => {
      const memori = state.memoriJawaban[soal.id_unik_sistem];
      if (memori && memori.jawaban_terakhir) {
        formatDetailJawabanDB[soal.id_unik_sistem] = memori.jawaban_terakhir;
        if (memori.jawaban_terakhir === soal.jawaban_benar) jumlahBenar++;
      }
    });
    nilaiAkhir =
      Object.keys(state.memoriJawaban).length === 0
        ? 0
        : Math.round((jumlahBenar / state.kumpulanSoal.length) * 100);
  }

  const dataHasil = {
    nis_siswa: state.nisAktif,
    nama_siswa: state.namaAktif,
    nilai: nilaiAkhir,
    detail_jawaban: formatDetailJawabanDB,
    log_percobaan:
      state.modeLatihan === MODE_LATIHAN.FORMATIF
        ? { ...state.logPercobaanSebelumnya, ...state.memoriJawaban }
        : state.memoriJawaban,
    urutan_soal:
      state.modeLatihan === MODE_LATIHAN.FORMATIF
        ? state.urutanSoalGlobal
        : state.kumpulanSoal.map((s) => s.id_unik_sistem),
    durasi_detik: durasiTotalKumulatif,
    waktu_submit: new Date().toISOString(),
    materi_utama: state.materiUtama,
    sub_materi: state.subMateriPilihan,
    mode_latihan: state.modeLatihan,
    status: STATUS_LATIHAN.SELESAI,
  };

  try {
    await simpanHasilAkhirDB(dataHasil);

    if (state.modeLatihan === MODE_LATIHAN.FORMATIF) {
      const docIdKustom = `${state.nisAktif}_${dataHasil.sub_materi.replace(/\s+/g, "")}_formatif_draft`;
      await hapusDrafFormatifDB(docIdKustom);
    }

    const gelarDidapat = await cekMasteryDanGelar(
      state.nisAktif,
      dataHasil.sub_materi,
      nilaiAkhir,
      state.modeLatihan,
    );

    document.getElementById("skor-akhir").innerText = nilaiAkhir;
    const teksDurasi =
      Math.floor(durasiTotalKumulatif / 60) > 0
        ? `${Math.floor(durasiTotalKumulatif / 60)} menit ${durasiTotalKumulatif % 60} detik`
        : `${durasiTotalKumulatif} detik`;

    document.getElementById("detail-hasil").innerText =
      state.modeLatihan === MODE_LATIHAN.FORMATIF
        ? `Latihan Selesai, ${state.namaAktif}! Kamu menaklukkan ${jumlahBenar} soal dalam ${teksDurasi} dengan skor ${nilaiAkhir}.`
        : `Luar biasa, ${state.namaAktif}! Kamu menjawab benar ${jumlahBenar} dari ${state.totalSoalKeseluruhan} soal dalam ${teksDurasi}.`;

    const teksApresiasi = document.getElementById("teks-apresiasi");
    if (gelarDidapat) {
      teksApresiasi.innerHTML = `Luar Biasa!<br><span style="display:inline-block; margin-top:10px; font-size:1rem; color:#d97706; background:#fef3c7; padding:6px 15px; border-radius:20px; border:2px solid #fbbf24; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.2);">👑 Gelar Baru Terbuka: ${gelarDidapat}</span>`;
    } else {
      teksApresiasi.innerText =
        nilaiAkhir >= 80
          ? "Luar Biasa!"
          : nilaiAkhir >= 60
            ? "Bagus!"
            : "Ayo Belajar Lagi!";
    }

    document.getElementById("modal-hasil").style.display = "flex";
  } catch (error) {
    alert("Koneksi gagal. Klik Selesai lagi.");
    el.btnSelesai.innerText = "Selesai Kerjakan";
    el.btnSelesai.disabled = false;
  }
});

// ==========================================
// 7. INITIALIZATION
// ==========================================
async function mulaiAplikasi() {
  el.statusKoneksi.innerText = "Mengambil data petualangan...";

  try {
    let daftarSoalSelesai = [];

    if (state.modeLatihan === MODE_LATIHAN.FORMATIF) {
      state.riwayatProgresGlobal = await getProgresFormatif(
        state.nisAktif,
        state.subMateriPilihan,
      );
      daftarSoalSelesai = Object.keys(state.riwayatProgresGlobal);

      const draftData = await getDrafFormatif(
        state.nisAktif,
        state.subMateriPilihan,
      );
      if (draftData) {
        state.durasiSebelumnya = draftData.durasi_detik || 0;
        state.logPercobaanSebelumnya = draftData.log_percobaan || {};

        // --- TAMBAHKAN BLOK KODE INI ---
        // Pindahkan log percobaan dari draft ke memori UI agar layar mengingat jawaban
        for (const idSoal in state.logPercobaanSebelumnya) {
          // Jangan timpa jika soal tersebut sebenarnya sudah "Selesai"
          if (!daftarSoalSelesai.includes(idSoal)) {
            state.memoriJawaban[idSoal] = {
              ...state.logPercobaanSebelumnya[idSoal],
            };
          }
        }
        // -------------------------------
      }
    }

    state.offsetNomorSoal =
      state.modeLatihan === MODE_LATIHAN.FORMATIF
        ? daftarSoalSelesai.length
        : 0;

    const semuaSoalUtuh = await getBankSoalBySubMateri(state.subMateriPilihan);

    let semuaSoalValid = semuaSoalUtuh;
    if (state.modeLatihan === MODE_LATIHAN.FORMATIF) {
      semuaSoalUtuh.sort(
        (a, b) =>
          (parseInt(a.tingkat_kesulitan) || LEVEL_SOAL.MUDAH) -
          (parseInt(b.tingkat_kesulitan) || LEVEL_SOAL.MUDAH),
      );
      state.urutanSoalGlobal = semuaSoalUtuh.map((s) => s.id_unik_sistem);
      semuaSoalValid = semuaSoalUtuh.filter(
        (s) => !daftarSoalSelesai.includes(s.id_unik_sistem),
      );
    }

    state.kumpulanSoal = siapkanDraftSoal(semuaSoalValid, state.modeLatihan);
    state.totalSoalKeseluruhan =
      state.modeLatihan === MODE_LATIHAN.FORMATIF
        ? semuaSoalUtuh.length
        : state.kumpulanSoal.length;

    if (state.kumpulanSoal.length > 0) {
      let textMode =
        state.modeLatihan === MODE_LATIHAN.ACAK
          ? "Mode Tantangan"
          : state.modeLatihan === MODE_LATIHAN.FORMATIF
            ? "Latihan Terbimbing"
            : "Mode Normal";
      el.statusKoneksi.innerText = `${textMode} | ${state.subMateriPilihan}`;
      el.areaNavigasi.style.display = "flex";
      renderSoal();

      el.elemenTimer.style.display = "block";
      state.intervalTimer = setInterval(perbaruiTampilanTimer, 1000);

      // --- TAMBAHKAN BLOK KODE INI ---
      if (state.modeLatihan === MODE_LATIHAN.FORMATIF) {
        // Simpan otomatis secara diam-diam setiap 60 detik (60000 ms)
        state.intervalAutosave = setInterval(() => {
          // Hanya lakukan autosave jika tab sedang aktif / dilihat
          if (!document.hidden) {
            sinkronRiwayatFormatifSementara();
            console.log("Riwayat tersimpan");
          }
        }, 60000);
      }
      // -------------------------------

      if (state.modeLatihan === MODE_LATIHAN.FORMATIF) {
        el.btnKembaliDasbor.innerText = "💾 Simpan & Kembali";
        el.btnKembaliDasbor.onclick = async () => {
          el.btnKembaliDasbor.innerText = "Menyimpan...";
          el.btnKembaliDasbor.disabled = true;
          try {
            await sinkronRiwayatFormatifSementara();
          } finally {
            window.location.href = "dashboard-siswa.html";
          }
        };
      } else {
        el.btnKembaliDasbor.innerText = "❌ Batalkan Tes";
        el.btnKembaliDasbor.onclick = () => {
          if (
            confirm(
              "Yakin ingin membatalkan ujian? Semua jawabanmu yang belum diselesaikan akan hangus dan tidak tersimpan.",
            )
          ) {
            window.location.href = "dashboard-siswa.html";
          }
        };
      }
    } else {
      if (
        state.modeLatihan === MODE_LATIHAN.FORMATIF &&
        semuaSoalUtuh.length > 0
      ) {
        el.areaNavigasi.style.display = "none";
        el.elemenTimer.style.display = "none";
        el.statusKoneksi.innerText = "Wilayah Tertaklukkan!";
        // PANGGIL VIEW YANG BARU DIBUAT
        el.wadahSoal.innerHTML = createWilayahTertaklukkanHTML(
          state.namaAktif,
          state.subMateriPilihan,
        );
        document
          .getElementById("btn-reset-progres")
          .addEventListener("click", async (e) => {
            e.target.innerText = "Mereset...";
            e.target.disabled = true;
            await resetProgresFormatif(state.nisAktif, state.subMateriPilihan);

            // --- TAMBAHKAN 2 BARIS INI UNTUK MENGHAPUS ZOMBIE DRAFT ---
            const docIdKustom = `${state.nisAktif}_${state.subMateriPilihan.replace(/\s+/g, "")}_formatif_draft`;
            await hapusDrafFormatifDB(docIdKustom);
            // ----------------------------------------------------------

            window.location.reload();
          });
        document
          .getElementById("btn-kembali-tamat")
          ?.addEventListener(
            "click",
            () => (window.location.href = "dashboard-siswa.html"),
          );
      } else {
        el.statusKoneksi.innerText = "Maaf, belum ada soal di wilayah ini.";
      }
    }
  } catch (error) {
    console.error(error);
  }
}

mulaiAplikasi();

// --- TAMBAHKAN BLOK INI DI BARIS PALING BAWAH ---
window.addEventListener("beforeunload", (e) => {
  if (
    state.modeLatihan === MODE_LATIHAN.FORMATIF &&
    state.kumpulanSoal.length > 0 &&
    !state.isSelesai // <-- TAMBAHKAN SYARAT INI
  ) {
    // Tembak penyimpanan secara sinkron agar berjalan sebelum browser mati
    sinkronRiwayatFormatifSementara();
  }
});
