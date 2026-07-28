// GATE B — Analisis konsep_prasyarat vs PETA_PRASYARAT (read-only, offline)
// Sumber: arsip-data/bank_soal_all.json (sama seperti Gate A)
// Jalankan dari akar repo: node plan/diagnostik/gate-b-analisis-konsep-prasyarat.mjs [ambang%] [materi_utama...]
//
// Tujuan: PETA_PRASYARAT untuk tab selain Trigonometri masih rantai
// sekuensial sederhana (satu prasyarat langsung per node), ditulis SEBELUM
// soal & field konsep_prasyarat ada. Sekarang datanya sudah ada — skrip ini
// menghitung, untuk tiap sub-materi, persentase soalnya yang menyebut tiap
// konsep di konsep_prasyarat, lalu membandingkan dengan PETA_PRASYARAT yang
// berlaku sekarang: mana yang sudah didukung data, mana yang disarankan data
// tapi belum ditulis, mana yang ditulis tapi lemah dukungan datanya.
//
// PENTING (lihat CLAUDE.md §4): ini BUKAN topological sort otomatis. Output
// skrip ini adalah BAHAN PERTIMBANGAN untuk keputusan manual guru/penyusun,
// persis seperti komentar "%" di kurikulumData.js sendiri. Threshold hanya
// penyaring kebisingan, bukan aturan mutlak — kasus di ambang batas tetap
// perlu penilaian pedagogis.
import { readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const AMBANG = Number(process.argv[2]) || 30; // persen
const FILTER_MATERI = process.argv.slice(3); // kosong = semua tab

const { PETA_PRASYARAT } = await import(
  pathToFileURL(join(ROOT, "public/js/utils/kurikulumData.js")).href
);

const soal = JSON.parse(
  readFileSync(join(ROOT, "arsip-data/bank_soal_all.json"), "utf8"),
);

// Normalisasi ringan: rename murni yang sudah disepakati (idempoten, aman
// dijalankan sebelum maupun sesudah data live diperbaiki). "Pemodelan
// Matematika" didrop karena itu nama TAB, bukan sub-materi, dan selalu
// muncul berdampingan dengan tag lain yang lebih spesifik.
const RENAME = {
  "Persamaan Linear Satu Variabel": "Persamaan Linear Satu Variabel (PLSV)",
  "Persamaan Kuadrat Dasar": "Akar Persamaan Kuadrat",
  "Persamaan Kuadrat Lanjutan": "Diskriminan dan Jenis Akar",
};
const DROP = new Set(["Pemodelan Matematika"]);

// --- 1. Kumpulkan statistik per sub-materi ---
const perSub = {}; // sub -> { total, materi_utama, konsep: {nama: count} }
for (const s of soal) {
  if (!s.sub_materi) continue;
  const key = s.sub_materi;
  if (!perSub[key]) perSub[key] = { total: 0, materi_utama: s.materi_utama, konsep: {} };
  perSub[key].total++;
  for (let k of s.konsep_prasyarat || []) {
    k = RENAME[k] || k;
    if (DROP.has(k) || k === key) continue;
    perSub[key].konsep[k] = (perSub[key].konsep[k] || 0) + 1;
  }
}

const norm = (s) => (s || "").trim();

// --- 1b. Closure transitif dari peta yang berlaku sekarang, supaya edge
// yang "disarankan data" tapi sudah otomatis terpenuhi via rantai existing
// (A→B→C: menambah A sebagai syarat langsung C tidak mengubah gating apa
// pun) tidak diusulkan sebagai perubahan nyata. ---
function prasyaratTransitif(node, seen = new Set()) {
  for (const p of PETA_PRASYARAT[node] || []) {
    const n = norm(p);
    if (!seen.has(n)) {
      seen.add(n);
      prasyaratTransitif(n, seen);
    }
  }
  return seen;
}

// --- 2. Bandingkan tiap sub-materi dengan PETA_PRASYARAT ---
const urutanTab = [
  "Eksponen", "Logaritma", "Persamaan Kuadrat", "Fungsi Kuadrat",
  "Relasi dan Fungsi", "Sistem Persamaan", "Pertidaksamaan", "Fungsi Rasional",
  "Kaidah Pencacahan & Peluang", "Nilai Mutlak", "Numerasi Terapan",
  "Pemodelan Matematika", "Transformasi Geometri", "Geometri Dasar",
  "Aljabar Lanjutan", "Aritmatika dan Aljabar Dasar", "Trigonometri",
];

for (const tab of urutanTab) {
  if (FILTER_MATERI.length && !FILTER_MATERI.includes(tab)) continue;
  const subDiTab = Object.entries(perSub).filter(([, v]) => v.materi_utama === tab);
  if (!subDiTab.length) continue;

  console.log("\n" + "=".repeat(72));
  console.log(`TAB: ${tab}`);
  console.log("=".repeat(72));

  for (const [sub, v] of subDiTab) {
    const edgeSekarang = new Set((PETA_PRASYARAT[sub] || []).map(norm));
    const sorted = Object.entries(v.konsep)
      .map(([k, c]) => ({ k, pct: Math.round((100 * c) / v.total) }))
      .sort((a, b) => b.pct - a.pct);

    const disarankan = sorted.filter((x) => x.pct >= AMBANG);
    const sudahTerpenuhiTransitif = prasyaratTransitif(sub);
    const edgeBaruSemua = disarankan.filter((x) => !edgeSekarang.has(x.k));
    const edgeBaru = edgeBaruSemua.filter((x) => !sudahTerpenuhiTransitif.has(x.k));
    const edgeRedundan = edgeBaruSemua.filter((x) => sudahTerpenuhiTransitif.has(x.k));
    const edgeDidukung = [...edgeSekarang].filter((e) =>
      disarankan.some((x) => x.k === e),
    );
    const edgeLemah = [...edgeSekarang].filter(
      (e) => !disarankan.some((x) => x.k === e),
    );

    console.log(`\n  ${sub}  (${v.total} soal, gerbang sekarang: ${edgeSekarang.size ? [...edgeSekarang].join(", ") : "—"})`);
    if (edgeBaru.length) {
      console.log(
        `    + EDGE BARU NYATA (belum di peta, belum terpenuhi transitif): ` +
          edgeBaru.map((x) => `${x.k} (${x.pct}%)`).join(", "),
      );
    }
    if (edgeRedundan.length) {
      console.log(
        `    · disebut di data tapi SUDAH otomatis terpenuhi via rantai: ` +
          edgeRedundan.map((x) => `${x.k} (${x.pct}%)`).join(", "),
      );
    }
    if (edgeLemah.length) {
      console.log(
        `    ~ SUDAH DI PETA, DUKUNGAN DATA <${AMBANG}%: ${edgeLemah.join(", ")}`,
      );
    }
    if (edgeDidukung.length) {
      console.log(`    = SUDAH DI PETA & didukung data: ${edgeDidukung.join(", ")}`);
    }
    if (!edgeBaru.length && !edgeLemah.length && !edgeSekarang.size) {
      console.log(`    (tidak ada konsep_prasyarat dominan di atas ${AMBANG}%)`);
    }
  }
}

console.log("\n" + "=".repeat(72));
console.log(`Ambang: ${AMBANG}%. Ganti lewat argumen: node gate-b-... 40`);
console.log("Filter tab: node gate-b-... 30 Eksponen Logaritma");
console.log("=".repeat(72));
