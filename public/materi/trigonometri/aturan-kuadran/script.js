// public/js/controllers/AturanKuadranController.js

import { LatihanController } from "../../../js/controllers/LatihanController.js";
import { pantauSesi, logoutSistem } from "../../../js/services/authService.js";
import { MODE_LATIHAN } from "../../../js/utils/constants.js";

pantauSesi((user) => {
  // sesi aman
}, false);

window.keluarAplikasi = function () {
  logoutSistem();
};

class AturanKuadranController extends LatihanController {
  constructor() {
    super();
    // Memaksa mode formatif dan sub materi Aturan Kuadran
    this.state.modeLatihan = MODE_LATIHAN.FORMATIF;
    this.state.subMateriPilihan = "Aturan Kuadran";
    this.state.materiUtama = "Trigonometri Dasar"; // asumsikan ini jika kosong

    // Pastikan localStorage set untuk kompatibilitas LatihanController
    localStorage.setItem("mode_latihan", MODE_LATIHAN.FORMATIF);
    localStorage.setItem("sub_materi_aktif", "Aturan Kuadran");
  }

  async init() {
    // Setup UI interaktif Lingkaran Satuan
    this.setupCanvas();

    document
      .getElementById("btn-kembali-dasbor")
      .addEventListener("click", () => {
        window.location.href = "../../../dashboard-siswa.html";
      });

    const btnMulai = document.getElementById("btn-mulai-terbimbing");
    btnMulai.addEventListener("click", () => {
      document.getElementById("wadah-mulai-terbimbing").style.display = "none";
      document.getElementById("quiz-section").style.display = "block";
      document.getElementById("visual-inner").classList.add("stacked");

      // Inisialisasi controller latihan standar untuk mode formatif
      this.bindGlobalEvents();
      this.mulaiAplikasi();
    });

    // Tambahkan event untuk tombol lanjut ke sumatif
    document
      .getElementById("btn-lanjut-sumatif")
      .addEventListener("click", () => {
        localStorage.setItem("mode_latihan", MODE_LATIHAN.NORMAL);
        window.location.href = "../../../latihan.html";
      });
  }

  setupCanvas() {
    const canvas = document.getElementById("unit-circle");
    const ctx = canvas.getContext("2d");
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 100;

    let angle = 45; // derajat awal
    let isDragging = false;

    const drawCircle = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Sumbu X dan Y
      ctx.beginPath();
      // Garis utama
      ctx.moveTo(0, centerY);
      ctx.lineTo(canvas.width, centerY);
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, canvas.height);

      // Panah Kanan (Sumbu X positif)
      ctx.moveTo(canvas.width - 10, centerY - 6);
      ctx.lineTo(canvas.width, centerY);
      ctx.lineTo(canvas.width - 10, centerY + 6);

      // Panah Kiri (Sumbu X negatif)
      ctx.moveTo(10, centerY - 6);
      ctx.lineTo(0, centerY);
      ctx.lineTo(10, centerY + 6);

      // Panah Atas (Sumbu Y positif)
      ctx.moveTo(centerX - 6, 10);
      ctx.lineTo(centerX, 0);
      ctx.lineTo(centerX + 6, 10);

      // Panah Bawah (Sumbu Y negatif)
      ctx.moveTo(centerX - 6, canvas.height - 10);
      ctx.lineTo(centerX, canvas.height);
      ctx.lineTo(centerX + 6, canvas.height - 10);

      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Lingkaran
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Garis Sudut
      const rad = (angle * Math.PI) / 180;
      const endX = centerX + radius * Math.cos(rad);
      const endY = centerY - radius * Math.sin(rad); // Y terbalik di canvas

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = "var(--primary-color)";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Titik sudut (draggable)
      ctx.beginPath();
      ctx.arc(endX, endY, 8, 0, 2 * Math.PI);
      ctx.fillStyle = "var(--primary-color)";
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Arc sudut
      ctx.beginPath();
      ctx.arc(centerX, centerY, 30, 0, -rad, rad > 0);
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label Derajat
      ctx.fillStyle = "black";
      ctx.font = "bold 14px Arial";

      // 0 derajat (Kanan) - di luar lingkaran, sedikit di atas sumbu
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText("0°", centerX + radius + 10, centerY - 8);

      // 90 derajat (Atas) - di luar lingkaran, sedikit di kanan sumbu
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText("90°", centerX + 8, centerY - radius - 10);

      // 180 derajat (Kiri) - di luar lingkaran, sedikit di atas sumbu
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText("180°", 4, centerY - 8);

      // 270 derajat (Bawah) - di luar lingkaran, sedikit di kanan sumbu
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("270°", centerX + 8, centerY + radius + 10);
    };

    const updateASTC = (deg) => {
      // Normalisasi derajat 0 - 360
      let norm = deg % 360;
      if (norm < 0) norm += 360;

      document.getElementById("sudut-info").innerText =
        `Sudut: ${Math.round(norm)}°`;

      // Hapus semua class active
      document
        .querySelectorAll(".astc-row")
        .forEach((el) => el.classList.remove("active"));

      // Tentukan kuadran dan update UI
      let q = 1;
      if (norm >= 0 && norm <= 90) q = 1;
      else if (norm > 90 && norm <= 180) q = 2;
      else if (norm > 180 && norm <= 270) q = 3;
      else if (norm > 270 && norm <= 360) q = 4;

      document.getElementById(`row-q${q}`).classList.add("active");

      // Update background canvas
      canvas.className = `bg-q${q}`;
    };

    const getMouseAngle = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX || e.touches[0].clientX) - rect.left - centerX;
      const y = (e.clientY || e.touches[0].clientY) - rect.top - centerY;

      let rad = Math.atan2(-y, x); // -y karena koordinat canvas y ke bawah
      let deg = rad * (180 / Math.PI);
      if (deg < 0) deg += 360;
      return deg;
    };

    const startDrag = (e) => {
      isDragging = true;
      const deg = getMouseAngle(e);
      angle = deg;
      drawCircle();
      updateASTC(angle);
    };

    const drag = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const deg = getMouseAngle(e);
      angle = deg;
      drawCircle();
      updateASTC(angle);
    };

    const endDrag = () => {
      isDragging = false;
    };

    canvas.addEventListener("mousedown", startDrag);
    canvas.addEventListener("mousemove", drag);
    window.addEventListener("mouseup", endDrag);

    canvas.addEventListener("touchstart", startDrag);
    canvas.addEventListener("touchmove", drag, { passive: false });
    window.addEventListener("touchend", endDrag);

    // Initial draw
    drawCircle();
    updateASTC(angle);
  }
}

const app = new AturanKuadranController();
app.init();
