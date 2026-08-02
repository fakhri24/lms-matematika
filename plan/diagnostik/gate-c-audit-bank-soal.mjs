// GATE C — Audit komposisi bank soal per sub-materi (read-only, offline)
// Sumber: arsip-data/bank_soal_all.json (sama seperti Gate A/B)
// Jalankan dari akar repo: node plan/diagnostik/gate-c-audit-bank-soal.mjs "<sub_materi>" ["<sub_materi 2>" ...]
// Tanpa argumen: audit SEMUA sub-materi (ringkas, satu baris per sub-materi).
//
// Tujuan: sebelum menambah/mengurasi soal satu sub-materi, ketahui dulu
// komposisinya tanpa menghitung manual satu-satu (seperti yang dilakukan
// untuk Operasi Aritmatika Dasar, lihat plan/PLAN.md §13.1). Skrip ini
// TIDAK memutuskan apa pun sendiri -- murni bahan pertimbangan:
//   1. Distribusi level (mudah/sedang/sulit) vs kuota draf sumatif 4-4-2.
//   2. Rasio soal "ekspresi telanjang" vs "soal cerita berkonteks" (heuristik
//      kata penanda narasi -- boleh salah klasifikasi sebagian, cek manual
//      untuk kasus yang meragukan).
//   3. Kandidat duplikat struktural: soal-soal dengan "kerangka operator"
//      yang identik setelah angka & konteks dilepas (mis. dua soal yang
//      sama-sama "A op B op (C op D)" tapi angkanya beda dihitung sebagai
//      kandidat duplikat, BUKAN otomatis dihapus -- tetap butuh penilaian
//      manual, persis seperti proses kemarin).
import { readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const FILTER = process.argv.slice(2); // kosong = semua sub-materi

const soal = JSON.parse(
  readFileSync(join(ROOT, "arsip-data/bank_soal_all.json"), "utf8"),
);

// --- Heuristik: soal cerita vs ekspresi telanjang ---
// Penanda narasi umum di bank soal ini (Bahasa Indonesia, konteks cerita).
const PENANDA_CERITA = [
  "Sebuah", "Seorang", "Suatu", "Sebanyak", "Dalam sebuah", "Andi", "Rani",
  "Budi", "Ibu", "Pak", "Bu", "Ia", "mereka", "siswa", "pedagang",
  "toko", "gudang", "tim", "kota", "kolam", "kebun", "sekolah",
];
// Pencocokan WAJIB berbatas kata. Versi pertama memakai includes(), sehingga
// "tim" ikut cocok di dalam "\times" dan "estimasi", "Andi" di dalam
// "perbandingan", "Bu " di dalam "sumbu X", "Pak " di dalam "sepak bola":
// 132 soal (9% bank) salah dihitung sebagai soal cerita, dan sub-materi yang
// isinya penuh "\times" tampak seolah punya konteks padahal ekspresi telanjang
// semua. "Ibu" ditulis eksplisit supaya "Ibu memiliki ..." tidak ikut hilang
// saat "Bu" dibatasi kata.
const RE_CERITA = new RegExp(
  `(?<![a-z])(${PENANDA_CERITA.map((p) => p.toLowerCase()).join("|")})(?![a-z])`,
);
function isCerita(pertanyaan) {
  return RE_CERITA.test(pertanyaan.toLowerCase());
}

// --- Heuristik: kerangka operator (signature) untuk deteksi duplikat ---
// Lepas semua angka, LaTeX \times/\div jadi simbol tunggal, lalu lepas
// spasi -- hasilnya "bentuk" soal yang independen dari angka spesifik.
function signatureOperator(pertanyaan) {
  return pertanyaan
    .replace(/\$/g, "")
    .replace(/-?\d+(\.\d+)?/g, "N")
    .replace(/\\times/g, "*")
    .replace(/\\div/g, "/")
    .replace(/\\frac\{[^}]*\}\{[^}]*\}/g, "FRAC")
    .replace(/\\circ/g, "deg")
    .replace(/[a-zA-Z,.'"!?]/g, "") // buang narasi, sisakan kerangka simbol
    .replace(/\s+/g, "");
}

function auditSubMateri(sub, daftar) {
  const total = daftar.length;
  const perLevel = { 1: 0, 2: 0, 3: 0 };
  let cerita = 0;
  daftar.forEach((s) => {
    const lvl = parseInt(s.tingkat_kesulitan) || 1;
    perLevel[lvl] = (perLevel[lvl] || 0) + 1;
    if (isCerita(s.pertanyaan)) cerita++;
  });

  // Kandidat duplikat: signature sama DAN level sama (beda level = beda
  // tujuan pedagogis meski kerangka mirip, tidak dihitung duplikat).
  // CATATAN PENTING soal cerita: signature-nya melepas SEMUA kata narasi
  // (termasuk kata kerja operasi seperti "dibagi"/"disetor"), jadi dua soal
  // cerita bisa collapse ke signature identik ("N") padahal operasinya beda
  // -- sinyal ini LEMAH untuk cerita, cuma berarti "sama-sama satu soal
  // satu-langkah dengan angka", bukan "duplikat". Untuk soal ekspresi
  // telanjang (operator LaTeX kelihatan di teks) sinyalnya KUAT karena
  // signature menangkap urutan operator & kurung yang sebenarnya.
  const bySignature = {};
  daftar.forEach((s) => {
    const key = `${s.tingkat_kesulitan}::${signatureOperator(s.pertanyaan)}`;
    (bySignature[key] ||= []).push(s);
  });
  const kandidatDuplikat = Object.values(bySignature)
    .filter((g) => g.length > 1)
    .map((g) => ({ soal: g, sinyalKuat: !isCerita(g[0].pertanyaan) }));

  return { total, perLevel, cerita, murni: total - cerita, kandidatDuplikat };
}

// --- Kelompokkan seluruh bank per sub-materi ---
const perSub = {};
for (const s of soal) {
  if (!s.sub_materi) continue;
  (perSub[s.sub_materi] ||= []).push(s);
}

const target = FILTER.length > 0 ? FILTER : Object.keys(perSub).sort();

for (const sub of target) {
  const daftar = perSub[sub];
  if (!daftar) {
    console.log(`\n[!] Sub-materi "${sub}" tidak ditemukan di bank soal.`);
    continue;
  }
  const hasil = auditSubMateri(sub, daftar);
  console.log(`\n=== ${sub} (${daftar[0]?.materi_utama || "?"}) ===`);
  console.log(
    `  Total: ${hasil.total}  |  Level 1/2/3: ${hasil.perLevel[1]}/${hasil.perLevel[2]}/${hasil.perLevel[3]}  |  Cerita/Murni: ${hasil.cerita}/${hasil.murni}`,
  );
  if (hasil.total < 10) console.log(`  ⚠️  DI BAWAH SOAL_MIN (10)`);

  // Ambang mistake-budget K = N - BENAR_MANDIRI_UNTUK_NAIK[level] (sejak
  // 2026-07-28: naik level butuh sekian benar MANDIRI kumulatif -- tanpa
  // lihat clue/pembahasan, boleh diselingi salah -- bukan lagi 3 beruntun;
  // lihat soalEngine.perbaruiLevelAdaptif & AMBANG_NAIK_LEVEL di sana.
  // Level 1/2 butuh 4 (disamakan kuota sumatif mudah/sedang), Level 3 cuma
  // butuh 2 (disamakan kuota sumatif sulit). Tiap benar BARU mengunci soal
  // itu keluar dari pool "belum benar" permanen -- lihat
  // soalEngine.pilihSoalFormatifBerikutnya & LatihanController.js. K =
  // berapa kali salah yang masih bisa ditoleransi sebelum siswa TERPAKSA
  // diberi soal yang jawabannya sudah dia tahu. K negatif = cacat
  // struktural: bahkan tanpa satu kesalahan pun, stok soal segar tak cukup.
  // idSoalSudahBenar direstore dari progres_belajar (latihanService.js),
  // jadi ini akumulasi SELURUH riwayat siswa di sub-materi itu, bukan cuma
  // satu sesi.
  // Ambang K tidak simetris: Level 1 adalah lantai (tidak ada penurunan di
  // bawahnya) -- siswa lemah bisa terjebak lama di sana, butuh buffer
  // terbesar. Level 2/3 lebih transit (2x salah langsung turun level).
  const BENAR_MANDIRI_UNTUK_NAIK = { 1: 4, 2: 4, 3: 2 };
  const AMBANG_K = { 1: 4, 2: 2, 3: 2 }; // -> min soal: L1>=8, L2>=6, L3>=4
  [1, 2, 3].forEach((lvl) => {
    const n = hasil.perLevel[lvl] || 0;
    const k = n - BENAR_MANDIRI_UNTUK_NAIK[lvl];
    if (k < AMBANG_K[lvl]) {
      const label = k < 0 ? "CACAT STRUKTURAL" : "di bawah ambang";
      const minSoal = BENAR_MANDIRI_UNTUK_NAIK[lvl] + AMBANG_K[lvl];
      console.log(
        `  ⚠️  Level ${lvl}: ${n} soal, K=${k} (${label}, target K>=${AMBANG_K[lvl]} / min ${minSoal} soal) -- siswa bisa dipaksa mengulang soal yang sudah pernah dijawab benar`,
      );
    }
  });
  if (hasil.kandidatDuplikat.length > 0) {
    console.log(`  Kandidat duplikat struktural (${hasil.kandidatDuplikat.length} kelompok):`);
    hasil.kandidatDuplikat.forEach(({ soal: g, sinyalKuat }) => {
      const label = sinyalKuat ? "sinyal KUAT (ekspresi telanjang)" : "sinyal lemah (cerita, cek manual)";
      console.log(`    - [level ${g[0].tingkat_kesulitan}] ${g.length}x mirip -- ${label}:`);
      g.forEach((s) => console.log(`        ${s.id} :: ${s.pertanyaan.slice(0, 70).replace(/\n/g, " ")}`));
    });
  }
}

if (FILTER.length === 0) {
  console.log(`\n\nTotal sub-materi diaudit: ${target.length}`);
}
