import { LatihanController } from "../../../js/controllers/LatihanController.js";
import { pantauSesi, logoutSistem } from "../../../js/services/authService.js";
import { MODE_LATIHAN } from "../../../js/utils/constants.js";

pantauSesi((user) => {
  // sesi aman
}, false);

window.keluarAplikasi = function () {
  logoutSistem();
};

class SudutBerelasiController extends LatihanController {
  constructor() {
    super();
    // Memaksa mode formatif dan sub materi Sudut Berelasi Horizontal
    this.state.modeLatihan = MODE_LATIHAN.FORMATIF;
    this.state.subMateriPilihan = "Sudut Berelasi (Horizontal)"; // Sesuaikan dengan DB Bank Soal
    this.state.materiUtama = "Trigonometri Dasar";

    // Pastikan localStorage set untuk kompatibilitas LatihanController
    localStorage.setItem("mode_latihan", MODE_LATIHAN.FORMATIF);
    localStorage.setItem("sub_materi_aktif", "Sudut Berelasi (Horizontal)");

    this.alpha = 30;
    this.relasi = "180-alpha";
  }

  async init() {
    // Setup UI interaktif Lingkaran Satuan
    this.setupCanvas();
    this.setupControls();

    document
      .getElementById("btn-kembali-dasbor")
      .addEventListener("click", () => {
        window.location.href = "../../../dashboard-siswa.html";
      });

    const btnMulai = document.getElementById("btn-mulai-terbimbing");
    btnMulai.addEventListener("click", () => {
      document.getElementById("wadah-mulai-terbimbing").style.display = "none";
      document.getElementById("quiz-section").style.display = "block";

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

  setupControls() {
    const slider = document.getElementById("alpha-slider");
    const alphaValue = document.getElementById("alpha-value");
    const radios = document.querySelectorAll('input[name="relasi"]');

    slider.addEventListener("input", (e) => {
      this.alpha = parseInt(e.target.value);
      alphaValue.innerText = `${this.alpha}°`;
      this.updateVisual();
    });

    radios.forEach((radio) => {
      radio.addEventListener("change", (e) => {
        if (e.target.checked) {
          this.relasi = e.target.value;
          this.updateVisual();
        }
      });
    });
  }

  updateVisual() {
    this.drawCircle();
    this.updatePenjelasan();
  }

  drawCircle() {
    const canvas = document.getElementById("unit-circle");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 100;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Gambar sumbu X dan Y
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, canvas.height);
    ctx.strokeStyle = "#334155"; // Abu-abu gelap tegas
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Gambar Lingkaran
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = "#64748b"; // Abu-abu sedang
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Fungsi utilitas untuk menggambar garis dan segitiga
    const drawAngle = (angleDeg, color, isDashed = false) => {
      const rad = (angleDeg * Math.PI) / 180;
      const endX = centerX + radius * Math.cos(rad);
      const endY = centerY - radius * Math.sin(rad);

      // Garis sudut (hipotenusa)
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      if (isDashed) ctx.setLineDash([6, 6]);
      else ctx.setLineDash([]);
      ctx.stroke();

      // Proyeksi ke sumbu X (tinggi / y)
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX, centerY);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Garis horizontal dari titik pusat ke titik proyeksi (alas / x)
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(endX, centerY);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Titik di ujung lingkaran
      ctx.beginPath();
      ctx.arc(endX, endY, 6, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    };

    // 1. Gambar Sudut Acuan (Alpha) di K-I
    drawAngle(this.alpha, "#475569"); // Warna abu-abu gelap tegas untuk acuan

    // Arc simbol sudut alpha (dari sumbu X / 0° ke alpha°)
    const toCanvas = (deg) => ((360 - deg) * Math.PI) / 180;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 18, toCanvas(0), toCanvas(this.alpha), true);
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label Alpha
    const alphaRad = (this.alpha * Math.PI) / 180;
    ctx.fillStyle = "#0f172a"; // Hitam
    ctx.font = "bold 14px Arial";
    ctx.fillText(
      "α",
      centerX + 35 * Math.cos(alphaRad / 2),
      centerY - 35 * Math.sin(alphaRad / 2),
    );

    // 2. Gambar Sudut Relasi
    let targetAngle = 0;
    if (this.relasi === "180-alpha") {
      targetAngle = 180 - this.alpha;
      canvas.className = "bg-q2"; // opsional jika ada css
    } else if (this.relasi === "180+alpha") {
      targetAngle = 180 + this.alpha;
      canvas.className = "bg-q3";
    } else if (this.relasi === "360-alpha") {
      targetAngle = 360 - this.alpha;
      canvas.className = "bg-q4";
    }

    drawAngle(targetAngle, "#0d9488");

    // Arc simbol sudut α diukur dari poros horizontal (180° atau 360°)
    let refAngle, arcAnticlockwise;
    if (this.relasi === "180-alpha") {
      refAngle = 180;
      arcAnticlockwise = false; // dari 180° clockwise ke (180°-α) = naik ke Q-II
    } else if (this.relasi === "180+alpha") {
      refAngle = 180;
      arcAnticlockwise = true; // dari 180° counterclockwise ke (180°+α) = turun ke Q-III
    } else {
      refAngle = 360;
      arcAnticlockwise = false; // dari 360° clockwise ke (360°-α) = turun ke Q-IV
    }
    ctx.beginPath();
    ctx.arc(
      centerX,
      centerY,
      25,
      toCanvas(refAngle),
      toCanvas(targetAngle),
      arcAnticlockwise,
    );
    ctx.strokeStyle = "#0d9488";
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  updatePenjelasan() {
    const wadah = document.getElementById("penjelasan-relasi");
    let html = "";

    if (this.relasi === "180-alpha") {
      html = `
        <p><b>Kuadran II ($180^\\circ - \\alpha$)</b></p>
        <p>Perhatikan bayangan segitiga biru. Tingginya (sumbu-y/sin) sama dan berada di atas sumbu-x (positif). Alasnya (sumbu-x/cos) sama panjang tetapi ke arah kiri (negatif).</p>
        <ul>
          <li>$\\sin(180^\\circ - ${this.alpha}^\\circ) = +\\sin(${this.alpha}^\\circ)$</li>
          <li>$\\cos(180^\\circ - ${this.alpha}^\\circ) = -\\cos(${this.alpha}^\\circ)$</li>
          <li>$\\tan(180^\\circ - ${this.alpha}^\\circ) = -\\tan(${this.alpha}^\\circ)$</li>
        </ul>
      `;
    } else if (this.relasi === "180+alpha") {
      html = `
        <p><b>Kuadran III ($180^\\circ + \\alpha$)</b></p>
        <p>Tingginya (sumbu-y/sin) mengarah ke bawah (negatif). Alasnya (sumbu-x/cos) mengarah ke kiri (negatif).</p>
        <ul>
          <li>$\\sin(180^\\circ + ${this.alpha}^\\circ) = -\\sin(${this.alpha}^\\circ)$</li>
          <li>$\\cos(180^\\circ + ${this.alpha}^\\circ) = -\\cos(${this.alpha}^\\circ)$</li>
          <li>$\\tan(180^\\circ + ${this.alpha}^\\circ) = +\\tan(${this.alpha}^\\circ)$</li>
        </ul>
      `;
    } else if (this.relasi === "360-alpha") {
      html = `
        <p><b>Kuadran IV ($360^\\circ - \\alpha$)</b></p>
        <p>Tingginya (sumbu-y/sin) mengarah ke bawah (negatif). Alasnya (sumbu-x/cos) mengarah ke kanan (positif).</p>
        <ul>
          <li>$\\sin(360^\\circ - ${this.alpha}^\\circ) = -\\sin(${this.alpha}^\\circ)$</li>
          <li>$\\cos(360^\\circ - ${this.alpha}^\\circ) = +\\cos(${this.alpha}^\\circ)$</li>
          <li>$\\tan(360^\\circ - ${this.alpha}^\\circ) = -\\tan(${this.alpha}^\\circ)$</li>
        </ul>
      `;
    }

    wadah.innerHTML = html;

    // Re-render MathJax
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([wadah]).catch((err) => console.log(err));
    }
  }

  setupCanvas() {
    this.updateVisual();
  }
}

const app = new SudutBerelasiController();
app.init();
