import { LatihanController } from "../../../js/controllers/LatihanController.js";
import { pantauSesi, logoutSistem } from "../../../js/services/authService.js";
import { MODE_LATIHAN } from "../../../js/utils/constants.js";

pantauSesi((user) => {
  // sesi aman
}, false);

window.keluarAplikasi = function () {
  logoutSistem();
};

class SudutBerelasiNegatif360Controller extends LatihanController {
  constructor() {
    super();
    this.state.modeLatihan = MODE_LATIHAN.FORMATIF;
    this.state.subMateriPilihan = "Sudut Berelasi (Negatif dan >360°)";
    this.state.materiUtama = "Trigonometri Dasar";

    localStorage.setItem("mode_latihan", MODE_LATIHAN.FORMATIF);
    localStorage.setItem(
      "sub_materi_aktif",
      "Sudut Berelasi (Negatif dan >360°)",
    );

    this.theta = 450;
    this.modeEksplorasi = "positif"; // "positif" | "negatif" | "kombinasi"
  }

  // Reduksi sudut ke [0°, 360°)
  normalize(deg) {
    let r = deg % 360;
    return r < 0 ? r + 360 : r;
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
    const slider = document.getElementById("theta-slider");
    const numberInput = document.getElementById("theta-number");
    const radioButtons = document.querySelectorAll(
      'input[name="mode-eksplorasi"]',
    );

    radioButtons.forEach((radio) => {
      radio.addEventListener("change", (e) => {
        this.modeEksplorasi = e.target.value;
        this._updateSliderConfig();
        this.updateVisual();
      });
    });

    slider.addEventListener("input", (e) => {
      this.theta = parseInt(e.target.value);
      numberInput.value = this.theta;
      this.updateVisual();
    });

    numberInput.addEventListener("input", (e) => {
      const val = parseInt(e.target.value);
      if (isNaN(val)) return;
      const { min, max } = this._getModeRange();
      const clamped = Math.min(max, Math.max(min, val));
      this.theta = clamped;
      slider.value = clamped;
      this.updateVisual();
    });

    numberInput.addEventListener("blur", (e) => {
      const { min, max } = this._getModeRange();
      const val = parseInt(e.target.value);
      const clamped = isNaN(val)
        ? this.theta
        : Math.min(max, Math.max(min, val));
      this.theta = clamped;
      numberInput.value = clamped;
      slider.value = clamped;
      this.updateVisual();
    });
  }

  _getModeRange() {
    if (this.modeEksplorasi === "positif") return { min: 361, max: 1080 };
    if (this.modeEksplorasi === "negatif") return { min: -359, max: -1 };
    return { min: -1080, max: -361 };
  }

  _updateSliderConfig() {
    const slider = document.getElementById("theta-slider");
    const numberInput = document.getElementById("theta-number");
    const { min, max } = this._getModeRange();

    if (this.modeEksplorasi === "positif") {
      this.theta = 450;
    } else if (this.modeEksplorasi === "negatif") {
      this.theta = -150;
    } else {
      this.theta = -450;
    }

    slider.min = min;
    slider.max = max;
    slider.value = this.theta;
    numberInput.min = min;
    numberInput.max = max;
    numberInput.value = this.theta;
  }

  updateVisual() {
    this.drawCircle();
    this.updatePenjelasan();
  }

  drawCircle() {
    const canvas = document.getElementById("unit-circle");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = 100;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sumbu X dan Y
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(canvas.width, cy);
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, canvas.height);
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    ctx.stroke();

    // Lingkaran satuan
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const normalized = this.normalize(this.theta);

    // Gambar visualisasi sesuai mode
    if (this.modeEksplorasi === "positif") {
      this._drawSpiralCCW(ctx, cx, cy, this.theta, "#f59e0b");
    } else if (this.modeEksplorasi === "negatif") {
      this._drawArcCW(ctx, cx, cy, Math.abs(this.theta), "#ef4444");
    } else {
      this._drawSpiralCW(ctx, cx, cy, Math.abs(this.theta), "#ef4444");
    }

    // Panah biru ke sudut ternormalisasi
    this._drawArrow(ctx, cx, cy, radius, normalized, "#0d9488");

    // Arc kecil penanda sudut normalized (dari 0° CCW ke normalized)
    const toCanvas = (deg) => ((360 - deg) * Math.PI) / 180;
    if (normalized > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, 22, toCanvas(0), toCanvas(normalized), true);
      ctx.strokeStyle = "#0d9488";
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.stroke();
    }

    // Label "≡ X°" di ujung panah biru
    const normRad = (normalized * Math.PI) / 180;
    const labelR = radius + 20;
    ctx.save();
    ctx.fillStyle = "#0d9488";
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `\u2261${normalized}\u00b0`,
      cx + labelR * Math.cos(normRad),
      cy - labelR * Math.sin(normRad),
    );
    ctx.restore();
  }

  _drawArrow(ctx, cx, cy, radius, angleDeg, color) {
    const rad = (angleDeg * Math.PI) / 180;
    const endX = cx + radius * Math.cos(rad);
    const endY = cy - radius * Math.sin(rad);

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([]);
    ctx.stroke();

    // Titik di ujung
    ctx.beginPath();
    ctx.arc(endX, endY, 5, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }

  // Spiral Archimedean berlawanan arah jarum jam (untuk sudut >360°, mode A)
  _drawSpiralCCW(ctx, cx, cy, totalDeg, color) {
    const steps = Math.max(300, Math.round(totalDeg * 2));
    const startR = 12;
    const endR = Math.min(42, 12 + (totalDeg / 360) * 10);
    const turns = Math.floor(totalDeg / 360);

    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const a = t * totalDeg * (Math.PI / 180);
      const rr = startR + (endR - startR) * t;
      const x = cx + rr * Math.cos(a);
      const y = cy - rr * Math.sin(a); // CCW: y berkurang saat sin positif
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 2]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Label jumlah putaran di atas spiral
    if (turns > 0) {
      ctx.save();
      ctx.fillStyle = color;
      ctx.font = "bold 11px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`${turns}\u00d7 putaran`, cx + 14, cy - 50);
      ctx.restore();
    }
  }

  // Spiral Archimedean searah jarum jam (untuk kombinasi negatif+>360°, mode C)
  _drawSpiralCW(ctx, cx, cy, totalDeg, color) {
    const steps = Math.max(300, Math.round(totalDeg * 2));
    const startR = 12;
    const endR = Math.min(42, 12 + (totalDeg / 360) * 10);
    const turns = Math.floor(totalDeg / 360);

    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const a = t * totalDeg * (Math.PI / 180);
      const rr = startR + (endR - startR) * t;
      const x = cx + rr * Math.cos(a);
      const y = cy + rr * Math.sin(a); // CW: y bertambah saat sin positif
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 2]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Label jumlah putaran di bawah spiral
    if (turns > 0) {
      ctx.save();
      ctx.fillStyle = color;
      ctx.font = "bold 11px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`${turns}\u00d7 putaran`, cx + 14, cy + 56);
      ctx.restore();
    }
  }

  // Arc putus-putus searah jarum jam (untuk sudut negatif kecil, mode B)
  _drawArcCW(ctx, cx, cy, absDeg, color) {
    // ctx.arc dengan anticlockwise=false = CW secara visual di layar
    ctx.beginPath();
    ctx.arc(cx, cy, 40, 0, (absDeg * Math.PI) / 180, false);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Titik di ujung arc
    const endCanvasAngle = (absDeg * Math.PI) / 180;
    const dotX = cx + 40 * Math.cos(endCanvasAngle);
    const dotY = cy + 40 * Math.sin(endCanvasAngle);
    ctx.beginPath();
    ctx.arc(dotX, dotY, 3.5, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();

    // Label theta° di tengah arc
    const midAngle = (absDeg / 2) * (Math.PI / 180);
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `${this.theta}\u00b0`,
      cx + 54 * Math.cos(midAngle),
      cy + 54 * Math.sin(midAngle),
    );
    ctx.restore();
  }

  updatePenjelasan() {
    const wadah = document.getElementById("penjelasan-relasi");
    const theta = this.theta;
    const normalized = this.normalize(theta);
    let html = "";

    if (this.modeEksplorasi === "positif") {
      const n = Math.floor(theta / 360);
      const sisa = theta - n * 360;
      html = `
        <p><b>Sudut Lebih dari Satu Putaran</b></p>
        <p>Kurangi kelipatan 360° sampai sudut masuk ke $[0°, 360°)$.</p>
        <ul>
          <li>$${theta}° = ${n} \\times 360° + ${sisa}°$</li>
          <li>$\\sin(${theta}°) = \\sin(${sisa}°)$</li>
          <li>$\\cos(${theta}°) = \\cos(${sisa}°)$</li>
          <li>$\\tan(${theta}°) = \\tan(${sisa}°)$</li>
        </ul>
      `;
    } else if (this.modeEksplorasi === "negatif") {
      html = `
        <p><b>Sudut Negatif</b></p>
        <p>Tambahkan 360° agar sudut menjadi positif di $[0°, 360°)$.</p>
        <ul>
          <li>$${theta}° + 360° = ${normalized}°$</li>
          <li>$\\sin(${theta}°) = \\sin(${normalized}°)$</li>
          <li>$\\cos(${theta}°) = \\cos(${normalized}°)$</li>
          <li>$\\tan(${theta}°) = \\tan(${normalized}°)$</li>
        </ul>
      `;
    } else {
      const absTheta = Math.abs(theta);
      const n = Math.ceil(absTheta / 360);
      html = `
        <p><b>Negatif dan Lebih dari Satu Putaran</b></p>
        <p>Tambahkan kelipatan 360° yang cukup agar sudut masuk ke $[0°, 360°)$.</p>
        <ul>
          <li>$${theta}° + ${n} \\times 360° = ${normalized}°$</li>
          <li>$\\sin(${theta}°) = \\sin(${normalized}°)$</li>
          <li>$\\cos(${theta}°) = \\cos(${normalized}°)$</li>
          <li>$\\tan(${theta}°) = \\tan(${normalized}°)$</li>
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

const app = new SudutBerelasiNegatif360Controller();
app.init();
