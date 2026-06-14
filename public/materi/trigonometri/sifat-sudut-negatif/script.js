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
    this.dashboardUrl = "../../../dashboard-siswa.html";
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
    ctx.moveTo(2, centerY);
    ctx.lineTo(canvas.width - 2, centerY);
    ctx.moveTo(centerX, 2);
    ctx.lineTo(centerX, canvas.height - 2);
    // Panah kanan
    ctx.moveTo(canvas.width - 10, centerY - 5);
    ctx.lineTo(canvas.width - 2, centerY);
    ctx.lineTo(canvas.width - 10, centerY + 5);
    // Panah kiri
    ctx.moveTo(10, centerY - 5);
    ctx.lineTo(2, centerY);
    ctx.lineTo(10, centerY + 5);
    // Panah atas
    ctx.moveTo(centerX - 5, 10);
    ctx.lineTo(centerX, 2);
    ctx.lineTo(centerX + 5, 10);
    // Panah bawah
    ctx.moveTo(centerX - 5, canvas.height - 10);
    ctx.lineTo(centerX, canvas.height - 2);
    ctx.lineTo(centerX + 5, canvas.height - 10);
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
    drawAngle(this.alpha, "#0d9488");

    // Arc kecil menandai sudut α dari sumbu X
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, toCanvas(0), toCanvas(this.alpha), true);
    ctx.strokeStyle = "#0d9488";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Panah di ujung arc sudut α
    if (this.alpha > 8) {
      const aRad = (this.alpha * Math.PI) / 180;
      const arcEndX = centerX + 20 * Math.cos(aRad);
      const arcEndY = centerY - 20 * Math.sin(aRad);
      const tAngle = Math.atan2(-Math.cos(aRad), -Math.sin(aRad));
      const arrowLen = 6;
      const spread = 0.4;
      ctx.beginPath();
      ctx.moveTo(arcEndX, arcEndY);
      ctx.lineTo(
        arcEndX + arrowLen * Math.cos(tAngle + Math.PI - spread),
        arcEndY + arrowLen * Math.sin(tAngle + Math.PI - spread),
      );
      ctx.moveTo(arcEndX, arcEndY);
      ctx.lineTo(
        arcEndX + arrowLen * Math.cos(tAngle + Math.PI + spread),
        arcEndY + arrowLen * Math.sin(tAngle + Math.PI + spread),
      );
      ctx.strokeStyle = "#0d9488";
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.stroke();
    }

    // Label α
    const alphaRad = (this.alpha * Math.PI) / 180;
    ctx.fillStyle = "#0d9488";
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

    // Panah di ujung arc sudut -α
    if (this.alpha > 8) {
      const negArcEndX = centerX + 20 * Math.cos(alphaRad);
      const negArcEndY = centerY + 20 * Math.sin(alphaRad);
      const negTAngle = Math.atan2(Math.cos(alphaRad), -Math.sin(alphaRad));
      const arrowLen = 6;
      const spread = 0.4;
      ctx.beginPath();
      ctx.moveTo(negArcEndX, negArcEndY);
      ctx.lineTo(
        negArcEndX + arrowLen * Math.cos(negTAngle + Math.PI - spread),
        negArcEndY + arrowLen * Math.sin(negTAngle + Math.PI - spread),
      );
      ctx.moveTo(negArcEndX, negArcEndY);
      ctx.lineTo(
        negArcEndX + arrowLen * Math.cos(negTAngle + Math.PI + spread),
        negArcEndY + arrowLen * Math.sin(negTAngle + Math.PI + spread),
      );
      ctx.strokeStyle = "#f97316";
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.stroke();
    }

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
      <p>Sudut $-\\alpha$ adalah <b>refleksi</b> dari sudut $\\alpha$ terhadap sumbu X.<br>
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
