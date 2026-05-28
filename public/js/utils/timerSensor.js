// public/js/utils/timerSensor.js

import { MODE_LATIHAN } from "./constants.js";

// Variabel State Internal
let waktuMulaiTatapan = null;
let totalDurasiBerjalan = 0;
let statusLayar = "aktif";
let timerIdle;
let timerStuck;

// ==========================================
// FUNGSI EKSPOR UNTUK APP.JS
// ==========================================
export function mulaiAtauLanjutStopwatch() {
  waktuMulaiTatapan = Date.now();
  resetSensorAktivitas();
}

export function dapatkanDanResetDurasiTerakhir() {
  if (waktuMulaiTatapan) {
    const selisihDetik = Math.floor((Date.now() - waktuMulaiTatapan) / 1000);
    totalDurasiBerjalan += selisihDetik;
    waktuMulaiTatapan = Date.now();
  }
  const durasiAkhir = totalDurasiBerjalan;
  totalDurasiBerjalan = 0;
  return durasiAkhir;
}

function pauseDanAkumulasiWaktu() {
  if (waktuMulaiTatapan) {
    const selisihDetik = Math.floor((Date.now() - waktuMulaiTatapan) / 1000);
    totalDurasiBerjalan += selisihDetik;
    waktuMulaiTatapan = null;
  }
}

export function dapatkanTotalWaktuSekarang() {
  let tambahan = 0;
  if (waktuMulaiTatapan && statusLayar === "aktif") {
    tambahan = Math.floor((Date.now() - waktuMulaiTatapan) / 1000);
  }
  return totalDurasiBerjalan + tambahan;
}

// ==========================================
// MESIN SENSOR (BEKERJA DI BALIK LAYAR)
// ==========================================
function resetSensorAktivitas() {
  if (statusLayar === "idle") return;

  clearTimeout(timerIdle);
  clearTimeout(timerStuck);

  // Ambil elemen DOM dari HTML
  const toastStuck = document.getElementById("toast-stuck");
  const modalIdle = document.getElementById("modal-idle");

  // Timer Stuck (10 Menit tanpa klik/scroll)
  timerStuck = setTimeout(() => {
    if (statusLayar !== "idle" && toastStuck) {
      const mode = localStorage.getItem("mode_latihan") || MODE_LATIHAN.NORMAL;
      toastStuck.innerHTML =
        mode === MODE_LATIHAN.FORMATIF
          ? "Psst... Soal ini sepertinya alot ya? Jangan ragu cek Clue / Pembahasan kalau mentok!"
          : "Waktu terus berjalan! Jangan ragu lewati soal ini dulu kalau terlalu sulit.";

      toastStuck.style.bottom = "30px";
      setTimeout(() => {
        toastStuck.style.bottom = "-100px";
      }, 6000);
    }
  }, 600000);

  // Timer Idle AFK (5 Menit ditinggal kursor/keyboard)
  timerIdle = setTimeout(() => {
    statusLayar = "idle";
    pauseDanAkumulasiWaktu();
    if (modalIdle) modalIdle.style.display = "flex"; // Munculkan modal
  }, 300000);
}

// Event Delegation untuk tombol lanjut (aman meskipun elemennya ada di HTML luar)
document.body.addEventListener("click", (e) => {
  if (e.target.id === "btn-lanjut-idle") {
    statusLayar = "aktif";
    const modalIdle = document.getElementById("modal-idle");
    if (modalIdle) modalIdle.style.display = "none";
    mulaiAtauLanjutStopwatch();
  }
});

// Deteksi Aktivitas Kursor/Scroll
["mousemove", "keydown", "scroll", "touchstart"].forEach((evt) => {
  document.addEventListener(evt, resetSensorAktivitas);
});

// Deteksi Jika Siswa Pindah Tab (Alt+Tab / Ganti Jendela)
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    pauseDanAkumulasiWaktu();
  } else {
    if (statusLayar !== "idle") mulaiAtauLanjutStopwatch();
  }
});
