// GATE A — Audit integritas kurikulum (read-only, offline)
// Sumber: dump arsip-data/*.json  (APROKSIMASI dari Firestore bank_soal)
// Jalankan dari akar repo:  node plan/diagnostik/gate-a-audit-kurikulum.mjs
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Akar repo dihitung dari lokasi berkas ini (plan/diagnostik/ -> ../../)
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SOAL_MIN = 10;

const { PETA_PRASYARAT: PETA_PRASYARAT_MANUAL } = await import(
  pathToFileURL(join(ROOT, "public/js/utils/kurikulumData.js")).href
);

// --- 1. Kumpulkan semua berkas bank_soal ---
function walk(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (e.endsWith(".json")) acc.push(p);
  }
  return acc;
}
const kandidat = [
  join(ROOT, "arsip-data/bank_soal_all.json"),
  join(ROOT, "arsip-data/bank_soal_revisi.json"),
  join(ROOT, "artefak/bank_soal_artefak.json"),
  ...walk(join(ROOT, "arsip-data/bank_soal")),
];

// --- 2. Dedupe lintas berkas ---
const seen = new Map(); // key -> sub_materi
let totalRow = 0;
const perBerkas = [];
for (const f of kandidat) {
  let data;
  try {
    data = JSON.parse(readFileSync(f, "utf8"));
  } catch {
    continue;
  }
  if (!Array.isArray(data)) continue;
  let baru = 0;
  for (const s of data) {
    if (!s || !s.sub_materi) continue;
    totalRow++;
    const key = s.id || `${s.sub_materi}::${(s.pertanyaan || "").slice(0, 120)}`;
    if (!seen.has(key)) {
      seen.set(key, s.sub_materi.toLowerCase().trim());
      baru++;
    }
  }
  perBerkas.push([f.replace(ROOT + "/", ""), data.length, baru]);
}

// --- 3. Hitung soal per sub-materi ---
const jumlahSoal = {};
for (const sub of seen.values()) jumlahSoal[sub] = (jumlahSoal[sub] || 0) + 1;

// --- 4. Himpunan prasyarat & target dari peta hard-code ---
const norm = (s) => s.toLowerCase().trim();
const semuaPrasyarat = new Set();
const semuaTarget = new Set();
for (const [target, list] of Object.entries(PETA_PRASYARAT_MANUAL)) {
  semuaTarget.add(norm(target));
  for (const p of list) semuaPrasyarat.add(norm(p));
}
const semuaNode = new Set([...semuaPrasyarat, ...semuaTarget]);

// --- 5. TEMUAN UTAMA: prasyarat yang tak mungkin di-master ---
const takMungkin = [];
for (const p of [...semuaPrasyarat].sort()) {
  const n = jumlahSoal[p] || 0;
  if (n < SOAL_MIN) takMungkin.push({ prasyarat: p, jumlah_soal: n });
}

// --- 6. Dampak: rantai yang terkunci akibat tiap temuan ---
const anak = {}; // prasyarat -> [target]
for (const [target, list] of Object.entries(PETA_PRASYARAT_MANUAL)) {
  for (const p of list) (anak[norm(p)] ||= []).push(norm(target));
}
function hilir(start) {
  const out = new Set();
  const q = [start];
  while (q.length) {
    for (const t of anak[q.shift()] || []) {
      if (!out.has(t)) {
        out.add(t);
        q.push(t);
      }
    }
  }
  return out;
}

// --- 7. Deteksi siklus (Kahn atas peta penuh) ---
const inDeg = {};
for (const n of semuaNode) inDeg[n] = 0;
for (const [target, list] of Object.entries(PETA_PRASYARAT_MANUAL))
  for (const _ of list) inDeg[norm(target)]++;
const q = [...semuaNode].filter((n) => inDeg[n] === 0);
let diproses = 0;
const qq = [...q];
const inDeg2 = { ...inDeg };
while (qq.length) {
  const cur = qq.shift();
  diproses++;
  for (const t of anak[cur] || []) if (--inDeg2[t] === 0) qq.push(t);
}
const siklus = [...semuaNode].filter((n) => inDeg2[n] > 0);

// ================= LAPORAN =================
console.log("=".repeat(72));
console.log("GATE A — AUDIT INTEGRITAS KURIKULUM");
console.log("=".repeat(72));
console.log(
  `\nSumber: ${perBerkas.length} berkas dump, ${totalRow} baris → ${seen.size} soal unik`,
);
console.log(`Sub-materi punya soal : ${Object.keys(jumlahSoal).length}`);
console.log(`Node di peta prasyarat: ${semuaNode.size}`);
console.log(`  - jadi prasyarat    : ${semuaPrasyarat.size}`);
console.log(`  - jadi target       : ${semuaTarget.size}`);
console.log(`Akar rantai (bukan target): ${[...semuaNode].filter((n) => !semuaTarget.has(n)).join(", ")}`);

console.log("\n" + "-".repeat(72));
console.log(`TEMUAN 1 — PRASYARAT DENGAN jumlah_soal < ${SOAL_MIN} (deadlock permanen)`);
console.log("-".repeat(72));
if (takMungkin.length === 0) {
  console.log("✅ KOSONG — tidak ada prasyarat yang mustahil di-master.");
} else {
  for (const t of takMungkin) {
    const dampak = hilir(t.prasyarat);
    console.log(
      `\n❌ "${t.prasyarat}" — ${t.jumlah_soal} soal (butuh ${SOAL_MIN})`,
    );
    console.log(`   mengunci ${dampak.size} materi hilir`);
    if (dampak.size) {
      const arr = [...dampak];
      console.log(
        `   → ${arr.slice(0, 6).join(", ")}${arr.length > 6 ? ` … (+${arr.length - 6} lagi)` : ""}`,
      );
    }
  }
}

console.log("\n" + "-".repeat(72));
console.log("TEMUAN 2 — SIKLUS DI PETA PRASYARAT");
console.log("-".repeat(72));
console.log(
  siklus.length === 0
    ? `✅ KOSONG — DAG valid (${diproses}/${semuaNode.size} node terurut).`
    : `❌ Siklus melibatkan: ${siklus.join(", ")}`,
);

console.log("\n" + "-".repeat(72));
console.log(`TEMUAN 3 — SEBARAN jumlah_soal SEMUA NODE PETA (ambang ${SOAL_MIN})`);
console.log("-".repeat(72));
const baris = [...semuaNode]
  .map((n) => ({ n, c: jumlahSoal[n] || 0 }))
  .sort((a, b) => a.c - b.c);
for (const { n, c } of baris) {
  const flag = c === 0 ? "⛔ TIDAK ADA SOAL" : c < SOAL_MIN ? "⚠️  < ambang" : "✅";
  console.log(`  ${String(c).padStart(3)} soal  ${flag.padEnd(18)} ${n}`);
}

const punyaSoalTapiTakDipetakan = Object.keys(jumlahSoal)
  .filter((s) => !semuaNode.has(s))
  .sort();
console.log("\n" + "-".repeat(72));
console.log("TEMUAN 4 — PUNYA SOAL TAPI TIDAK ADA DI PETA (default: TERBUKA, keputusan #6)");
console.log("-".repeat(72));
console.log(
  punyaSoalTapiTakDipetakan.length === 0
    ? "✅ KOSONG"
    : punyaSoalTapiTakDipetakan.map((s) => `  ${jumlahSoal[s]} soal — ${s}`).join("\n"),
);

console.log("\n" + "=".repeat(72));
console.log(
  takMungkin.length === 0 && siklus.length === 0
    ? "VERDIKT GATE A: ✅ LOLOS (berdasarkan dump arsip)"
    : "VERDIKT GATE A: ❌ TIDAK LOLOS — perlu keputusan §4.1",
);
console.log("=".repeat(72));
console.log("\n⚠️  CATATAN: angka di atas dari dump arsip-data, BUKAN Firestore live.");
console.log("   Sumber otoritatif = metadata/statistik_soal. Verifikasi via §8-verify.");
