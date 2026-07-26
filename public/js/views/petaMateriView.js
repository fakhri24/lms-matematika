// public/js/views/petaMateriView.js
//
// Merender peta materi sebagai SVG murni, tanpa pustaka luar — konsisten dengan
// gaya proyek (vanilla ES modules, tanpa build step).
//
// View ini tidak menghitung apa pun: koordinat datang dari utils/tataLetakPeta.js
// dan status kunci dari utils/kurikulumEngine.js.

import { amankanTeks } from "../utils/teksAman.js";
import { pecahBaris } from "../utils/tataLetakPeta.js";

// Ukuran dalam satuan viewBox. Halaman menskalakannya lewat CSS, jadi angka di
// sini murni soal proporsi antar-simpul, bukan piksel layar.
const UKURAN = {
  lebarNode: 176,
  tinggiNode: 56,
  jarakKolom: 244, // lebar node + sela 68
  jarakBaris: 74, // tinggi node + sela 18
  tepi: 28,
  tinggiJudulKolom: 34, // ruang untuk label kolom di atas peta
};

const IKON_STATUS = { master: "✅", siap: "▶", terkunci: "🔒" };

function posisiX(kolom) {
  return UKURAN.tepi + kolom * UKURAN.jarakKolom;
}

function posisiY(barisTampil) {
  return (
    UKURAN.tepi + UKURAN.tinggiJudulKolom + barisTampil * UKURAN.jarakBaris
  );
}

/**
 * Judul kolom digambar di dalam SVG, bukan di HTML terpisah, supaya posisinya
 * ikut menskala bersama peta dan mustahil melenceng dari kolomnya.
 */
function judulKolom(jumlahKolom) {
  return Array.from({ length: jumlahKolom }, (_, i) => {
    // Sengaja BUKAN "Tahap": nama itu sudah dipakai PETA_TAHAPAN untuk tahap
    // mengajar di kelas, dan kolom di sini artinya berbeda.
    const teks = i === 0 ? "Bekal awal" : `Lapis ${i}`;
    return `<text class="peta-judul-kolom" x="${posisiX(i) + UKURAN.lebarNode / 2}" y="${UKURAN.tepi + 14}" text-anchor="middle">${teks}</text>`;
  }).join("");
}

/**
 * Garis lengkung dari tepi kanan prasyarat ke tepi kiri materi yang dibukanya.
 * Bezier dipakai supaya garis yang melompati beberapa baris tetap mudah diikuti
 * mata; garis lurus diagonal akan saling menyilang dan sulit dibedakan.
 */
function garisSisi(dariNode, keNode, statusSumber) {
  const x1 = posisiX(dariNode.kolom) + UKURAN.lebarNode;
  const y1 = posisiY(dariNode.barisTampil) + UKURAN.tinggiNode / 2;
  const x2 = posisiX(keNode.kolom);
  const y2 = posisiY(keNode.barisTampil) + UKURAN.tinggiNode / 2;
  const lengkung = Math.max(32, (x2 - x1) / 2);

  return `<path class="peta-sisi ${statusSumber === "master" ? "tuntas" : ""}" d="M ${x1} ${y1} C ${x1 + lengkung} ${y1}, ${x2 - lengkung} ${y2}, ${x2} ${y2}" />`;
}

function kotakNode(node, status, prereqBelum) {
  const x = posisiX(node.kolom);
  const y = posisiY(node.barisTampil);
  const baris = pecahBaris(node.label, 23, 3);

  // Blok teks dipusatkan vertikal terhadap kotaknya.
  const tinggiBaris = 13;
  const awalY = y + UKURAN.tinggiNode / 2 - ((baris.length - 1) * tinggiBaris) / 2 + 4;
  const tspan = baris
    .map(
      (teks, i) =>
        `<tspan x="${x + UKURAN.lebarNode / 2}" y="${awalY + i * tinggiBaris}">${amankanTeks(teks)}</tspan>`,
    )
    .join("");

  const keterangan =
    status === "terkunci"
      ? `Terkunci. Perlu dikuasai dulu: ${prereqBelum.join(", ")}`
      : status === "master"
        ? "Sudah dikuasai"
        : "Siap dikerjakan";

  return `
    <g class="peta-node ${status}" data-nama="${amankanTeks(node.nama)}" tabindex="0" role="button"
       aria-label="${amankanTeks(`${node.label}. ${keterangan}`)}">
      <title>${amankanTeks(`${node.label} — ${keterangan}`)}</title>
      <rect class="peta-kotak" x="${x}" y="${y}" width="${UKURAN.lebarNode}" height="${UKURAN.tinggiNode}" rx="10" />
      <text class="peta-ikon" x="${x + 12}" y="${y + 16}">${IKON_STATUS[status] || ""}</text>
      <text class="peta-label" text-anchor="middle">${tspan}</text>
    </g>`;
}

/**
 * @param {Object} tataLetak hasil `susunTataLetakPeta()`
 * @param {Object} statusPerNode { namaTernormalisasi: { status, prereqBelum } }
 */
export function createPetaSVG(tataLetak, statusPerNode = {}) {
  const { node, sisi, jumlahKolom, jumlahBaris } = tataLetak;
  const lebar =
    UKURAN.tepi * 2 + (jumlahKolom - 1) * UKURAN.jarakKolom + UKURAN.lebarNode;
  const tinggi =
    UKURAN.tepi * 2 +
    UKURAN.tinggiJudulKolom +
    (jumlahBaris - 1) * UKURAN.jarakBaris +
    UKURAN.tinggiNode;

  const petaNode = new Map(node.map((n) => [n.nama, n]));
  const gambarSisi = sisi
    .map(({ dari, ke }) =>
      garisSisi(
        petaNode.get(dari),
        petaNode.get(ke),
        statusPerNode[dari]?.status,
      ),
    )
    .join("");

  const gambarNode = node
    .map((n) =>
      kotakNode(
        n,
        statusPerNode[n.nama]?.status || "siap",
        statusPerNode[n.nama]?.prereqBelum || [],
      ),
    )
    .join("");

  return `
    <svg id="svg-peta" viewBox="0 0 ${lebar} ${tinggi}" width="${lebar}" height="${tinggi}"
         role="img" aria-label="Peta prasyarat materi Trigonometri" xmlns="http://www.w3.org/2000/svg">
      <g class="peta-lapisan-judul">${judulKolom(jumlahKolom)}</g>
      <g class="peta-lapisan-sisi">${gambarSisi}</g>
      <g class="peta-lapisan-node">${gambarNode}</g>
    </svg>`;
}

/** Panel penjelasan saat satu materi dipilih. */
export function createDetailHTML(node, status, prereqBelum = []) {
  if (!node) {
    return `<p class="text-muted text-sm" style="margin:0">Ketuk salah satu materi di peta untuk melihat statusnya.</p>`;
  }

  const kalimat = {
    master: "Sudah kamu kuasai. Boleh diulang kapan saja untuk menjaga nilai.",
    siap: "Prasyaratnya sudah lengkap — materi ini siap kamu kerjakan.",
    terkunci: "Masih terkunci untuk mode sumatif. Mode Formatif tetap terbuka.",
  };

  const daftar =
    status === "terkunci" && prereqBelum.length > 0
      ? `<p class="peta-detail-prasyarat">Kuasai dulu: <strong>${prereqBelum.map(amankanTeks).join(" &bull; ")}</strong></p>`
      : "";

  return `
    <h4 class="peta-detail-judul ${status}">${IKON_STATUS[status]} ${amankanTeks(node.label)}</h4>
    <p class="text-sm" style="margin:6px 0 0">${kalimat[status]}</p>
    ${daftar}`;
}

export function createPetaErrorHTML() {
  return "<p class='text-center text-danger'>Gagal memuat peta materi.</p>";
}
