import { LatihanController } from "../../../js/controllers/LatihanController.js";
import { pantauSesi, logoutSistem } from "../../../js/services/authService.js";
import { MODE_LATIHAN } from "../../../js/utils/constants.js";

pantauSesi((user) => {
  // sesi aman
}, false);

window.keluarAplikasi = function () {
  logoutSistem();
};

class SifatSudutNegatifController extends LatihanController {
  constructor() {
    super();
    this.state.modeLatihan = MODE_LATIHAN.FORMATIF;
    this.state.subMateriPilihan = "Sifat Sudut Negatif";
    this.state.materiUtama = "Trigonometri Dasar";

    localStorage.setItem("mode_latihan", MODE_LATIHAN.FORMATIF);
    localStorage.setItem("sub_materi_aktif", "Sifat Sudut Negatif");

    this.alpha = 30;
  }

  async init() {
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

      this.bindGlobalEvents();
      this.mulaiAplikasi();
    });

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

    slider.addEventListener("input", (e) => {
      this.alpha = parseInt(e.target.value);
      alphaValue.innerText = `${this.alpha}°`;
      this.updateVisual();
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

    // Sumbu X dan Y
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, canvas.height);
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Lingkaran satuan
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Menggambar satu sudut dengan proyeksi ke sumbu X
    const drawAngle = (angleDeg, color) => {
      const rad = (angleDeg * Math.PI) / 180;
      const endX = centerX + radius * Math.cos(rad);
      const endY = centerY - radius * Math.sin(rad);

      // Hipotenusa
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([]);
      ctx.stroke();

      // Proyeksi vertikal putus-putus dari titik ke sumbu X
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX, centerY);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Garis horizontal solid dari pusat ke proyeksi
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

    // Helper konversi derajat ke radian canvas (berlawanan arah jarum jam = negatif)
    const toCanvas = (deg) => ((360 - deg) * Math.PI) / 180;

    // --- Sudut α (biru, di atas sumbu X) ---
    drawAngle(this.alpha, "#4f46e5");

    // Arc kecil menandai sudut α dari sumbu X
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, toCanvas(0), toCanvas(this.alpha), true);
    ctx.strokeStyle = "#4f46e5";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label α
    const alphaRad = (this.alpha * Math.PI) / 180;
    ctx.fillStyle = "#4f46e5";
    ctx.font = "bold 14px Arial";
    ctx.fillText(
      "α",
      centerX + 35 * Math.cos(alphaRad / 2),
      centerY - 35 * Math.sin(alphaRad / 2),
    );

    // --- Sudut -α (oranye, di bawah sumbu X — cermin sumbu X) ---
    drawAngle(-this.alpha, "#f97316");

    // Arc kecil menandai sudut -α dari sumbu X ke bawah
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, toCanvas(0), toCanvas(-this.alpha), false);
    ctx.strokeStyle = "#f97316";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label -α
    ctx.fillStyle = "#f97316";
    ctx.font = "bold 14px Arial";
    ctx.fillText(
      "-α",
      centerX + 35 * Math.cos(alphaRad / 2),
      centerY + 35 * Math.sin(alphaRad / 2) + 4,
    );

    // Garis cermin putus-putus vertikal (titik α ke titik -α melalui sumbu X)
    const tipX = centerX + radius * Math.cos(alphaRad);
    ctx.beginPath();
    ctx.moveTo(tipX, centerY - radius * Math.sin(alphaRad));
    ctx.lineTo(tipX, centerY + radius * Math.sin(alphaRad));
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  updatePenjelasan() {
    const wadah = document.getElementById("penjelasan-relasi");

    const sinVal = `\\sin(${this.alpha}^\\circ)`;
    const cosVal = `\\cos(${this.alpha}^\\circ)`;
    const tanVal = `\\tan(${this.alpha}^\\circ)`;

    const html = `
      <p><b>Relasi Sudut Negatif ($-\\alpha$)</b></p>
      <p>Sudut $-\\alpha$ adalah <b>refleksi</b> dari sudut $\\alpha$ terhadap sumbu X.
      Sisi horizontal (cos) tidak berubah; sisi vertikal (sin) berbalik tanda.</p>
      <ul>
        <li>$\\sin(-${this.alpha}^\\circ) = -${sinVal}$</li>
        <li>$\\cos(-${this.alpha}^\\circ) = +${cosVal}$</li>
        <li>$\\tan(-${this.alpha}^\\circ) = -${tanVal}$</li>
      </ul>
    `;

    wadah.innerHTML = html;

    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([wadah]).catch((err) => console.log(err));
    }
  }

  setupCanvas() {
    this.updateVisual();
  }
}

const app = new SifatSudutNegatifController();
app.init();
