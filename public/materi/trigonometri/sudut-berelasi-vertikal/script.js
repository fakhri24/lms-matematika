import { LatihanController } from "../../../js/controllers/LatihanController.js";
import { pantauSesi, logoutSistem } from "../../../js/services/authService.js";
import { MODE_LATIHAN } from "../../../js/utils/constants.js";

pantauSesi((user) => {
  // sesi aman
}, false);

window.keluarAplikasi = function () {
  logoutSistem();
};

class SudutBerelasiVertikalController extends LatihanController {
  constructor() {
    super();
    this.dashboardUrl = "../../../dashboard-siswa.html";
    this.state.modeLatihan = MODE_LATIHAN.FORMATIF;
    this.state.subMateriPilihan = "Sudut Berelasi (Vertikal)";
    this.state.materiUtama = "Trigonometri Dasar";

    localStorage.setItem("mode_latihan", MODE_LATIHAN.FORMATIF);
    localStorage.setItem("sub_materi_aktif", "Sudut Berelasi (Vertikal)");

    this.alpha = 30;
    this.relasi = "90-alpha";
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

    // projectToY=false → proyeksi ke sumbu X (gaya horizontal, untuk sudut alpha)
    // projectToY=true  → proyeksi ke sumbu Y (gaya vertikal, untuk sudut relasi)
    const drawAngle = (angleDeg, color, projectToY = false) => {
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

      if (projectToY) {
        // Proyeksi ke sumbu Y: garis horizontal putus-putus dari titik ke sumbu Y
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(centerX, endY);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Garis vertikal solid dari pusat ke proyeksi di sumbu Y
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX, endY);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();
      } else {
        // Proyeksi ke sumbu X: garis vertikal putus-putus dari titik ke sumbu X
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX, centerY);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Garis horizontal solid dari pusat ke proyeksi di sumbu X
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(endX, centerY);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Titik di ujung lingkaran
      ctx.beginPath();
      ctx.arc(endX, endY, 6, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    };

    // Sudut Acuan (Alpha) di K-I — proyeksi ke sumbu X
    drawAngle(this.alpha, "#475569", false);

    // Arc simbol sudut alpha (dari sumbu X / 0° ke alpha°)
    const toCanvas = (deg) => ((360 - deg) * Math.PI) / 180;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 18, toCanvas(0), toCanvas(this.alpha), true);
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Panah di ujung arc sudut α
    if (this.alpha > 8) {
      const aRad = (this.alpha * Math.PI) / 180;
      const arcEndX = centerX + 18 * Math.cos(aRad);
      const arcEndY = centerY - 18 * Math.sin(aRad);
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
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.stroke();
    }

    const alphaRad = (this.alpha * Math.PI) / 180;
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 14px Arial";
    ctx.fillText(
      "α",
      centerX + 35 * Math.cos(alphaRad / 2),
      centerY - 35 * Math.sin(alphaRad / 2),
    );

    // Sudut Relasi — proyeksi ke sumbu Y
    let targetAngle = 0;
    if (this.relasi === "90-alpha") {
      targetAngle = 90 - this.alpha;
    } else if (this.relasi === "90+alpha") {
      targetAngle = 90 + this.alpha;
    } else if (this.relasi === "270-alpha") {
      targetAngle = 270 - this.alpha;
    } else if (this.relasi === "270+alpha") {
      targetAngle = 270 + this.alpha;
    }

    drawAngle(targetAngle, "#0d9488", true);

    // Arc menunjukkan sudut α diukur dari poros vertikal (sumbu Y)
    let refAngle, arcAnticlockwise;
    if (this.relasi === "90-alpha") {
      refAngle = 90;
      arcAnticlockwise = false; // dari atas (90°) searah jarum jam ke (90°-α)
    } else if (this.relasi === "90+alpha") {
      refAngle = 90;
      arcAnticlockwise = true; // dari atas (90°) berlawanan jarum jam ke (90°+α)
    } else if (this.relasi === "270-alpha") {
      refAngle = 270;
      arcAnticlockwise = false; // dari bawah (270°) searah jarum jam ke (270°-α)
    } else {
      refAngle = 270;
      arcAnticlockwise = true; // dari bawah (270°) berlawanan jarum jam ke (270°+α)
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

    // Panah di ujung arc relasi
    {
      const tRad = (targetAngle * Math.PI) / 180;
      const relArcEndX = centerX + 25 * Math.cos(tRad);
      const relArcEndY = centerY - 25 * Math.sin(tRad);
      const relTAngle = arcAnticlockwise
        ? Math.atan2(-Math.cos(tRad), -Math.sin(tRad))
        : Math.atan2(Math.cos(tRad), Math.sin(tRad));
      const arrowLen = 6;
      const spread = 0.4;
      ctx.beginPath();
      ctx.moveTo(relArcEndX, relArcEndY);
      ctx.lineTo(
        relArcEndX + arrowLen * Math.cos(relTAngle + Math.PI - spread),
        relArcEndY + arrowLen * Math.sin(relTAngle + Math.PI - spread),
      );
      ctx.moveTo(relArcEndX, relArcEndY);
      ctx.lineTo(
        relArcEndX + arrowLen * Math.cos(relTAngle + Math.PI + spread),
        relArcEndY + arrowLen * Math.sin(relTAngle + Math.PI + spread),
      );
      ctx.strokeStyle = "#0d9488";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([]);
      ctx.stroke();
    }

    // Label sudut relasi di bisector arc
    let labelText, bisectorDeg;
    if (this.relasi === "90-alpha") {
      labelText = "90\u00b0-\u03b1";
      bisectorDeg = 90 - this.alpha / 2;
    } else if (this.relasi === "90+alpha") {
      labelText = "90\u00b0+\u03b1";
      bisectorDeg = 90 + this.alpha / 2;
    } else if (this.relasi === "270-alpha") {
      labelText = "270\u00b0-\u03b1";
      bisectorDeg = 270 - this.alpha / 2;
    } else {
      labelText = "270\u00b0+\u03b1";
      bisectorDeg = 270 + this.alpha / 2;
    }
    const labelBisRad = (bisectorDeg * Math.PI) / 180;
    ctx.fillStyle = "#0d9488";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      labelText,
      centerX + 50 * Math.cos(labelBisRad),
      centerY - 50 * Math.sin(labelBisRad),
    );
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }

  updatePenjelasan() {
    const wadah = document.getElementById("penjelasan-relasi");
    let html = "";

    if (this.relasi === "90-alpha") {
      html = `
        <p><b>Kuadran I ($90^\\circ - \\alpha$)</b></p>
        <p>Perhatikan bayangan segitiga biru dan abu-abu. Keduanya berada di Kuadran I. <br>Poros vertikal ($90^\\circ$) menyebabkan <b>fungsi bertukar</b>: tinggi (sin) menjadi alas (cos) dan sebaliknya. <br>Semua nilai positif di Kuadran I.</p>
        <ul>
          <li>$\\sin(90^\\circ - ${this.alpha}^\\circ) = +\\cos(${this.alpha}^\\circ)$</li>
          <li>$\\cos(90^\\circ - ${this.alpha}^\\circ) = +\\sin(${this.alpha}^\\circ)$</li>
          <li>$\\tan(90^\\circ - ${this.alpha}^\\circ) = +\\cot(${this.alpha}^\\circ)$</li>
        </ul>
      `;
    } else if (this.relasi === "90+alpha") {
      html = `
        <p><b>Kuadran II ($90^\\circ + \\alpha$)</b></p>
        <p>Fungsi bertukar akibat poros vertikal. <br>Di Kuadran II: sin bernilai positif.</p>
        <ul>
          <li>$\\sin(90^\\circ + ${this.alpha}^\\circ) = +\\cos(${this.alpha}^\\circ)$</li>
          <li>$\\cos(90^\\circ + ${this.alpha}^\\circ) = -\\sin(${this.alpha}^\\circ)$</li>
          <li>$\\tan(90^\\circ + ${this.alpha}^\\circ) = -\\cot(${this.alpha}^\\circ)$</li>
        </ul>
      `;
    } else if (this.relasi === "270-alpha") {
      html = `
        <p><b>Kuadran III ($270^\\circ - \\alpha$)</b></p>
        <p>Fungsi bertukar akibat poros vertikal ($270^\\circ$). <br>Di Kuadran III: tan bernilai positif.</p>
        <ul>
          <li>$\\sin(270^\\circ - ${this.alpha}^\\circ) = -\\cos(${this.alpha}^\\circ)$</li>
          <li>$\\cos(270^\\circ - ${this.alpha}^\\circ) = -\\sin(${this.alpha}^\\circ)$</li>
          <li>$\\tan(270^\\circ - ${this.alpha}^\\circ) = +\\cot(${this.alpha}^\\circ)$</li>
        </ul>
      `;
    } else if (this.relasi === "270+alpha") {
      html = `
        <p><b>Kuadran IV ($270^\\circ + \\alpha$)</b></p>
        <p>Fungsi bertukar akibat poros vertikal ($270^\\circ$). <br>Di Kuadran IV: cos bernilai positif.</p>
        <ul>
          <li>$\\sin(270^\\circ + ${this.alpha}^\\circ) = -\\cos(${this.alpha}^\\circ)$</li>
          <li>$\\cos(270^\\circ + ${this.alpha}^\\circ) = +\\sin(${this.alpha}^\\circ)$</li>
          <li>$\\tan(270^\\circ + ${this.alpha}^\\circ) = -\\cot(${this.alpha}^\\circ)$</li>
        </ul>
      `;
    }

    wadah.innerHTML = html;

    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([wadah]).catch((err) => console.log(err));
    }
  }

  setupCanvas() {
    this.updateVisual();
  }
}

const app = new SudutBerelasiVertikalController();
app.init();
