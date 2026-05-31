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

    drawAngle(targetAngle, "#4f46e5", true);

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
    ctx.strokeStyle = "#4f46e5";
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  updatePenjelasan() {
    const wadah = document.getElementById("penjelasan-relasi");
    let html = "";

    if (this.relasi === "90-alpha") {
      html = `
        <p><b>Kuadran I ($90^\\circ - \\alpha$)</b></p>
        <p>Perhatikan bayangan segitiga biru dan abu-abu. Keduanya berada di Kuadran I. Poros vertikal ($90^\\circ$) menyebabkan <b>fungsi bertukar</b>: tinggi (sin) menjadi alas (cos) dan sebaliknya. Semua nilai positif di Kuadran I.</p>
        <ul>
          <li>$\\sin(90^\\circ - ${this.alpha}^\\circ) = +\\cos(${this.alpha}^\\circ)$</li>
          <li>$\\cos(90^\\circ - ${this.alpha}^\\circ) = +\\sin(${this.alpha}^\\circ)$</li>
          <li>$\\tan(90^\\circ - ${this.alpha}^\\circ) = +\\cot(${this.alpha}^\\circ)$</li>
        </ul>
      `;
    } else if (this.relasi === "90+alpha") {
      html = `
        <p><b>Kuadran II ($90^\\circ + \\alpha$)</b></p>
        <p>Fungsi bertukar akibat poros vertikal. Di Kuadran II: sin bernilai positif, cos bernilai negatif. Maka tinggi (sin baru) positif, alas (cos baru) negatif.</p>
        <ul>
          <li>$\\sin(90^\\circ + ${this.alpha}^\\circ) = +\\cos(${this.alpha}^\\circ)$</li>
          <li>$\\cos(90^\\circ + ${this.alpha}^\\circ) = -\\sin(${this.alpha}^\\circ)$</li>
          <li>$\\tan(90^\\circ + ${this.alpha}^\\circ) = -\\cot(${this.alpha}^\\circ)$</li>
        </ul>
      `;
    } else if (this.relasi === "270-alpha") {
      html = `
        <p><b>Kuadran III ($270^\\circ - \\alpha$)</b></p>
        <p>Fungsi bertukar akibat poros vertikal ($270^\\circ$). Di Kuadran III: sin negatif, cos negatif. Keduanya bernilai negatif.</p>
        <ul>
          <li>$\\sin(270^\\circ - ${this.alpha}^\\circ) = -\\cos(${this.alpha}^\\circ)$</li>
          <li>$\\cos(270^\\circ - ${this.alpha}^\\circ) = -\\sin(${this.alpha}^\\circ)$</li>
          <li>$\\tan(270^\\circ - ${this.alpha}^\\circ) = +\\cot(${this.alpha}^\\circ)$</li>
        </ul>
      `;
    } else if (this.relasi === "270+alpha") {
      html = `
        <p><b>Kuadran IV ($270^\\circ + \\alpha$)</b></p>
        <p>Fungsi bertukar akibat poros vertikal ($270^\\circ$). Di Kuadran IV: sin negatif, cos positif.</p>
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
