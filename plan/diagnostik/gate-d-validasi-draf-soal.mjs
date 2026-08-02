// GATE D — Validasi draf soal SEBELUM diimpor ke Firestore (read-only, offline)
// Jalankan dari akar repo:
//   node plan/diagnostik/gate-d-validasi-draf-soal.mjs                      -> semua draf di arsip-data/bank_soal/
//   node plan/diagnostik/gate-d-validasi-draf-soal.mjs <file.json> [...]    -> file tertentu
//
// Kenapa ada: impor soal ke Firestore itu satu arah. Sekali masuk, soal
// cacat baru ketahuan saat siswa mengerjakannya. Gate C mengaudit bank yang
// SUDAH masuk; Gate D memeriksa draf yang BELUM masuk. Dua kelas bug yang
// mustahil dilihat mata saat meninjau 40 soal ber-LaTeX:
//
//   1. Kunci jawaban tidak cocok dengan pertanyaan (salah hitung).
//   2. Dua opsi ternyata BERNILAI SAMA, mis. $4\sqrt{10}$ dan $2\sqrt{40}$,
//      atau $\frac{9\sqrt3}{9}$ dan $\sqrt3$. Soal jadi punya dua jawaban
//      benar (atau nol, kalau yang kembar itu bukan kuncinya).
//
// Caranya: LaTeX tiap opsi diterjemahkan ke ekspresi JavaScript lalu
// dievaluasi secara numerik. Soal bervariabel diuji dengan beberapa
// himpunan nilai acak-tetap ("probe") -- dua ekspresi dianggap sama hanya
// kalau nilainya sama di SELURUH probe.
//
// Skrip ini TIDAK mengubah apa pun. Keluar dengan kode 1 kalau ada temuan
// FATAL, supaya bisa dipakai sebagai penjaga sebelum impor.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const DIR_DRAF = join(ROOT, "arsip-data/bank_soal");

// Ambang headroom formatif adaptif per level (lihat CLAUDE.md dan PLAN.md
// §13.2/§14). Angkanya sengaja disalin dari Gate C supaya kedua gate
// memakai definisi yang sama.
const AMBANG_MIN_SOAL = { 1: 8, 2: 6, 3: 4 };

const FIELD_WAJIB = [
  "materi_utama", "sub_materi", "tingkat_kesulitan", "konsep_prasyarat",
  "pertanyaan", "clue", "opsi", "jawaban_benar", "pembahasan",
];

// Nilai uji untuk soal bervariabel. Positif semua (bank soal ini memakai
// akar, jadi basis negatif tidak bermakna) dan tidak bulat, supaya
// kebetulan-cocok karena angka "cantik" tidak lolos.
const PROBES = [
  { x: 1.7, y: 2.3, a: 3.1, b: 4.7, p: 5.3, m: 2.9, n: 3.7 },
  { x: 2.9, y: 1.3, a: 4.1, b: 3.7, p: 1.9, m: 5.1, n: 2.3 },
  { x: 5.3, y: 6.1, a: 1.9, b: 2.7, p: 3.3, m: 4.3, n: 6.7 },
];
const VARIABEL = Object.keys(PROBES[0]);

// ---------------------------------------------------------------------------
// Penerjemah LaTeX -> JavaScript
// ---------------------------------------------------------------------------
// Subset yang didukung: \sqrt{}, \sqrt[n]{}, \frac{}{}, ^, \times, \cdot,
// \div, ":", desimal koma Indonesia, kurung, dan variabel satu huruf.
// Fungsi bantu sengaja dinamai HURUF BESAR (SQ, RT, PW) supaya tidak pernah
// bentrok dengan variabel yang selalu huruf kecil saat menyisipkan tanda
// kali implisit.

/** Ambil isi kurung kurawal yang dimulai di indeks `i` (s[i] === "{"). */
function isiKurawal(s, i) {
  let dalam = 1, keluar = "", j = i + 1;
  while (dalam > 0) {
    if (j >= s.length) throw new Error("kurung kurawal tidak tertutup");
    if (s[j] === "{") dalam++;
    else if (s[j] === "}") dalam--;
    if (dalam > 0) keluar += s[j];
    j++;
  }
  return [keluar, j];
}

/**
 * Cari basis pangkat tepat sebelum indeks `i`, lalu kembalikan
 * [awalBasis, basis]. Basis bisa berupa grup berkurung atau token biasa.
 */
function basisPangkat(s, i) {
  let j = i - 1;
  if (s[j] === ")") {
    let dalam = 1;
    j--;
    while (j >= 0 && dalam > 0) {
      if (s[j] === ")") dalam++;
      else if (s[j] === "(") dalam--;
      j--;
    }
    return [j + 1, s.slice(j + 1, i)];
  }
  while (j >= 0 && /[A-Za-z0-9.]/.test(s[j])) j--;
  return [j + 1, s.slice(j + 1, i)];
}

function latexToJs(latexAsli) {
  let s = String(latexAsli).trim();
  if (s.startsWith("$") && s.endsWith("$")) s = s.slice(1, -1);

  // Opsi yang bukan skalar tunggal WAJIB ditolak, bukan dinilai apa adanya.
  // Pasangan koordinat "(-4, 0)" dan daftar urutan "\frac{1}{4}, 0,3,
  // \frac{2}{5}" bukan bilangan; kalau dipaksa dievaluasi, koma terbaca
  // sebagai operator koma JavaScript (atau sebagai pemisah desimal) dan dua
  // opsi yang jelas berbeda bisa tampak bernilai sama. Koma hanya sah
  // sebagai pemisah desimal, yaitu persis di antara dua angka.
  const komaBukanDesimal = /(?<!\d),|,(?!\d)/.test(s.replace(/\s+/g, "$&"));
  const pasanganTerurut = /^\(.*,.*\)$/.test(s.trim());
  if (komaBukanDesimal || pasanganTerurut || /,\s/.test(s)) {
    throw new Error("bukan skalar tunggal (pasangan/daftar), tidak dinilai");
  }
  for (const sampah of ["\\left", "\\right", "\\,", "\\!", " "]) {
    s = s.split(sampah).join("");
  }
  s = s.replace(/\{,\}/g, ","); // penulisan desimal $0{,}25$
  s = s.split("\\times").join("*").split("\\cdot").join("*").split("\\div").join("/");
  s = s.replace(/:/g, "/"); // notasi pembagian di soal Indonesia

  // \sqrt[n]{m} -> RT((m),(n))
  for (;;) {
    const m = /\\sqrt\[([^\]]+)\]\{/.exec(s);
    if (!m) break;
    const [isi, akhir] = isiKurawal(s, m.index + m[0].length - 1);
    s = `${s.slice(0, m.index)}RT((${isi}),(${m[1]}))${s.slice(akhir)}`;
  }
  // \sqrt{m} -> SQ((m))
  for (;;) {
    const i = s.indexOf("\\sqrt{");
    if (i === -1) break;
    const [isi, akhir] = isiKurawal(s, i + 5);
    s = `${s.slice(0, i)}SQ((${isi}))${s.slice(akhir)}`;
  }
  // \frac{p}{q} -> ((p)/(q))
  // Pecahan campuran ("1\frac{1}{2}" = satu setengah) TIDAK didukung: kalau
  // diperlakukan sebagai perkalian implisit nilainya jadi 0,5, bukan 1,5.
  // Lebih baik menolak daripada diam-diam salah menilai.
  if (/\d\\frac\{/.test(s)) throw new Error("pecahan campuran tidak didukung");
  for (;;) {
    const i = s.indexOf("\\frac{");
    if (i === -1) break;
    const [pembilang, tengah] = isiKurawal(s, i + 5);
    if (s[tengah] !== "{") throw new Error("\\frac tanpa penyebut");
    const [penyebut, akhir] = isiKurawal(s, tengah);
    s = `${s.slice(0, i)}((${pembilang})/(${penyebut}))${s.slice(akhir)}`;
  }

  // Pangkat: basis^{eksponen} -> PW((basis),(eksponen))
  // Dibungkus fungsi, bukan operator **, supaya "-x^2" tidak jadi
  // SyntaxError seperti pada "-x ** 2" di JavaScript.
  for (;;) {
    const i = s.indexOf("^");
    if (i === -1) break;
    let eksponen, akhir;
    if (s[i + 1] === "{") {
      [eksponen, akhir] = isiKurawal(s, i + 1);
    } else {
      const m = /^-?[A-Za-z0-9.]/.exec(s.slice(i + 1));
      if (!m) throw new Error("pangkat tanpa eksponen");
      eksponen = m[0];
      akhir = i + 1 + m[0].length;
    }
    const [awal, basis] = basisPangkat(s, i);
    if (!basis) throw new Error("pangkat tanpa basis");
    s = `${s.slice(0, awal)}PW((${basis}),(${eksponen}))${s.slice(akhir)}`;
  }

  // Desimal koma Indonesia: 0,25 -> 0.25 (hanya antara dua deret angka).
  s = s.replace(/(\d),(?=\d)/g, "$1.");

  // Tanda kali implisit: 2SQ(3) -> 2*SQ(3), )( -> )*(, bSQ(2) -> b*SQ(2)
  s = s.replace(/(?<=[\d)])(?=[A-Za-z(])/g, "*");
  s = s.replace(new RegExp(`(?<=[${VARIABEL.join("")}])(?=[A-Z(])`, "g"), "*");

  if (/\\|\{|\}/.test(s)) throw new Error(`sisa LaTeX tak dikenali: ${s}`);
  if (!new RegExp(`^[0-9.+\\-*/(),SQRTPW${VARIABEL.join("")}]*$`).test(s)) {
    throw new Error(`karakter tak diizinkan: ${s}`);
  }
  return s;
}

const SQ = (v) => Math.sqrt(v);
const RT = (v, n) => Math.pow(v, 1 / n);
const PW = (v, e) => Math.pow(v, e);

function evaluasi(ekspresiJs, probe) {
  const argNama = [...VARIABEL, "SQ", "RT", "PW"];
  const argNilai = [...VARIABEL.map((v) => probe[v]), SQ, RT, PW];
  // eslint-disable-next-line no-new-func
  const fn = new Function(...argNama, `"use strict"; return (${ekspresiJs});`);
  const hasil = fn(...argNilai);
  if (typeof hasil !== "number" || !Number.isFinite(hasil)) {
    throw new Error(`hasil bukan bilangan berhingga (${hasil})`);
  }
  return hasil;
}

/** Nilai satu opsi di seluruh probe. */
function nilaiOpsi(latex) {
  const js = latexToJs(latex);
  return PROBES.map((probe) => evaluasi(js, probe));
}

function samaNilai(a, b) {
  return a.every((v, i) => {
    const u = b[i];
    return Math.abs(v - u) <= 1e-9 * Math.max(1, Math.abs(v), Math.abs(u));
  });
}

// ---------------------------------------------------------------------------
// Pemeriksaan per soal
// ---------------------------------------------------------------------------

function periksaSoal(soal, nomor, konteks) {
  const fatal = [];
  const info = [];
  const label = `[${nomor}]`;

  const hilang = FIELD_WAJIB.filter((f) => !(f in soal));
  if (hilang.length) {
    fatal.push(`${label} field wajib hilang: ${hilang.join(", ")}`);
    return { fatal, info };
  }
  if ("id" in soal) {
    fatal.push(`${label} punya field "id" -- draf impor tidak boleh membawa id Firestore`);
  }
  if (![1, 2, 3].includes(soal.tingkat_kesulitan)) {
    fatal.push(`${label} tingkat_kesulitan bukan 1/2/3: ${soal.tingkat_kesulitan}`);
  }
  if (!Array.isArray(soal.opsi) || soal.opsi.length !== 5) {
    fatal.push(`${label} opsi harus tepat 5, dapat ${soal.opsi?.length}`);
    return { fatal, info };
  }
  if (new Set(soal.opsi).size !== 5) {
    fatal.push(`${label} ada opsi yang teksnya identik`);
  }
  if (!soal.opsi.includes(soal.jawaban_benar)) {
    fatal.push(`${label} jawaban_benar tidak ada di daftar opsi`);
  }
  if (!Array.isArray(soal.konsep_prasyarat)) {
    fatal.push(`${label} konsep_prasyarat harus array`);
  } else {
    const asing = soal.konsep_prasyarat.filter((k) => !konteks.subMateriDikenal.has(k));
    if (asing.length) {
      fatal.push(`${label} konsep_prasyarat tidak dikenal sebagai sub_materi: ${asing.join(", ")}`);
    }
  }
  if (konteks.pertanyaanLama.has(normalisasi(soal.pertanyaan))) {
    fatal.push(`${label} pertanyaan sudah ada di bank_soal_all.json (duplikat impor)`);
  }
  if (konteks.pertanyaanBaru.has(normalisasi(soal.pertanyaan))) {
    fatal.push(`${label} pertanyaan duplikat di dalam draf ini`);
  }
  konteks.pertanyaanBaru.add(normalisasi(soal.pertanyaan));

  // --- inti: nilai numerik tiap opsi ---
  if (soal.opsi.some((o) => String(o).includes("="))) {
    info.push(`${label} LEWAT nilai — opsi berupa persamaan/relasi, wajib dicek manual`);
    return { fatal, info };
  }
  let nilai;
  try {
    nilai = soal.opsi.map(nilaiOpsi);
  } catch (e) {
    info.push(`${label} LEWAT nilai — tidak terparse (${e.message}), wajib dicek manual`);
    return { fatal, info };
  }
  // Soal yang menanyakan BENTUK atau IDENTIFIKASI, bukan nilai: di situ opsi
  // bernilai sama justru inti soalnya. "Bentuk paling sederhana dari
  // perbandingan $84:126$" memang menyediakan $6:9$ dan $14:21$ yang senilai
  // tapi belum sederhana; "Manakah yang BUKAN penerapan sifat distributif"
  // menyediakan empat bentuk yang semuanya bernilai 161. Diuji ke bank 1473
  // soal: tanpa pengecualian ini muncul 56 pasangan "bernilai sama" dan
  // hampir seluruhnya memang disengaja. Untuk soal seperti itu temuan
  // diturunkan jadi peringatan.
  const PENANDA_SOAL_BENTUK = [
    "paling sederhana", "senilai", "setara", "ekuivalen", "manakah",
    "bukan", "urutkan", "angka penting", "bentuk pangkat", "bentuk akar",
    "angka di belakang koma", "bentuk faktor", "perbandingan",
  ];
  const tentangBentuk = PENANDA_SOAL_BENTUK.some((k) =>
    String(soal.pertanyaan).toLowerCase().includes(k),
  );

  const iKunci = soal.opsi.indexOf(soal.jawaban_benar);
  const cocok = nilai.map((v, i) => (samaNilai(v, nilai[iKunci]) ? i : -1)).filter((i) => i >= 0);
  if (cocok.length !== 1) {
    // Kunci berbagi nilai dengan opsi lain: dua jawaban sama-sama bisa
    // dibela. Fatal, KECUALI soalnya memang tentang bentuk.
    const pesan =
      `${label} ${cocok.length} opsi bernilai sama dengan KUNCI: ` +
      cocok.map((i) => soal.opsi[i]).join("  |  ");
    if (tentangBentuk) info.push(`${pesan} — soal tentang bentuk, cek manual`);
    else fatal.push(pesan);
  }
  // Dua distraktor yang kembar tidak membuat soal salah, hanya memboroskan
  // satu opsi. Selalu peringatan.
  for (let i = 0; i < 5; i++) {
    for (let j = i + 1; j < 5; j++) {
      if (i !== iKunci && j !== iKunci && samaNilai(nilai[i], nilai[j])) {
        info.push(`${label} dua distraktor bernilai sama: ${soal.opsi[i]}  =  ${soal.opsi[j]}`);
      }
    }
  }

  // --- kunci vs ekspresi di pertanyaan (PERINGATAN, bukan fatal) ---
  // Menangkap salah hitung: kunci yang unik tapi keliru (mis. soal
  // "$\sqrt{72}$" berkunci "$8\sqrt2$") -- kelas bug yang tidak bisa dilihat
  // dari daftar opsi saja.
  //
  // Sengaja TIDAK fatal. Diuji ke seluruh 1437 soal bank yang sudah ada,
  // aturan longgar memberi 172 alarm dan seluruh sampel yang diperiksa
  // ternyata soal sah: pembulatan ("Bulatkan $47$..." -> 50), soal yang
  // menanyakan sesuatu selain nilai ekspresi ("Nilai $y$ adalah", "$5\%$
  // dari $400$"), dan angka insidental dalam narasi ("$8$ orang").
  // Penyaringan di bawah membuang sebagian besar di antaranya, tapi premis
  // "satu ekspresi terbaca = itu yang ditanyakan" tetap tidak bisa
  // dijamin -- jadi ini bahan cek manual, bukan penghalang impor.
  const KATA_BUKAN_EVALUASI = [
    "bulatkan", "pembulatan", "taksir", "kira-kira", "hampir", "perkiraan",
    "estimasi", "terdekat", "memenuhi", "nilai $x", "nilai $y",
  ];
  const teksSoal = String(soal.pertanyaan).toLowerCase();
  const segmen = [...String(soal.pertanyaan).matchAll(/\$([^$]+)\$/g)].map((m) => m[1]);
  const layakDicek =
    segmen.length === 1 &&
    !/=|<|>|\\ge|\\le|\\pm|\\%|%/.test(segmen[0]) &&
    /\\sqrt|\\frac|\^|\+|-|\\times|\\div|:|\\cdot/.test(segmen[0]) &&
    !KATA_BUKAN_EVALUASI.some((k) => teksSoal.includes(k));
  if (layakDicek) {
    let nilaiSoal = null;
    try {
      nilaiSoal = nilaiOpsi(segmen[0]);
    } catch {
      /* bukan ekspresi yang bisa dinilai */
    }
    if (nilaiSoal && !samaNilai(nilaiSoal, nilai[iKunci])) {
      info.push(
        `${label} PERIKSA — nilai ekspresi di pertanyaan (${nilaiSoal[0].toPrecision(8)}) ` +
          `beda dengan kunci ${soal.jawaban_benar} (${nilai[iKunci][0].toPrecision(8)})`,
      );
    }
  }
  return { fatal, info };
}

// Normalisasi untuk deteksi duplikat: HANYA huruf besar/kecil dan spasi yang
// diabaikan. Jangan membuang tanda baca matematis -- "$-3^4$" dan "$(-3)^4$"
// adalah dua soal berbeda (-81 vs 81), dan versi lama yang membuang semua
// karakter non-alfanumerik menyatukan keduanya jadi duplikat palsu.
function normalisasi(teks) {
  return String(teks).toLowerCase().replace(/\s+/g, "");
}

// ---------------------------------------------------------------------------
// Muat berkas
// ---------------------------------------------------------------------------

function kumpulkanJson(target) {
  const st = statSync(target);
  if (st.isFile()) return [target];
  return readdirSync(target)
    .map((nama) => join(target, nama))
    .flatMap((p) => (statSync(p).isDirectory() ? kumpulkanJson(p) : p.endsWith(".json") ? [p] : []));
}

const argumen = process.argv.slice(2);
let berkas;
try {
  berkas = argumen.length
    ? argumen.flatMap((p) => kumpulkanJson(resolve(p)))
    : kumpulkanJson(DIR_DRAF);
} catch (e) {
  console.error(`Tidak bisa membaca target: ${e.message}`);
  process.exit(1);
}
if (!berkas.length) {
  console.log("Tidak ada berkas draf .json untuk divalidasi.");
  process.exit(0);
}

const bankLama = JSON.parse(readFileSync(join(ROOT, "arsip-data/bank_soal_all.json"), "utf8"));
const konteks = {
  subMateriDikenal: new Set(bankLama.map((s) => s.sub_materi)),
  pertanyaanLama: new Set(bankLama.map((s) => normalisasi(s.pertanyaan))),
  pertanyaanBaru: new Set(),
};

// ---------------------------------------------------------------------------
// Jalankan
// ---------------------------------------------------------------------------

let totalFatal = 0;
let totalSoal = 0;
const tambahan = new Map(); // sub_materi -> {1,2,3}

for (const f of berkas) {
  let data;
  try {
    data = JSON.parse(readFileSync(f, "utf8"));
  } catch (e) {
    console.log(`\n=== ${relative(ROOT, f)} ===\n  ✗ JSON tidak valid: ${e.message}`);
    totalFatal++;
    continue;
  }
  if (!Array.isArray(data)) {
    console.log(`\n=== ${relative(ROOT, f)} ===\n  ✗ isi berkas harus array soal`);
    totalFatal++;
    continue;
  }

  // Arsip hasil impor (setiap entri sudah membawa id Firestore) bukan draf:
  // isinya memang sudah ada di bank, dan sebagian memakai kosakata
  // konsep_prasyarat versi lama. Lewati, jangan dihitung sebagai temuan.
  const berId = data.filter((s) => s && typeof s === "object" && "id" in s).length;
  if (data.length && berId === data.length) {
    console.log(
      `\n=== ${relative(ROOT, f)} (${data.length} soal) ===\n` +
        "  – dilewati: seluruh entri sudah ber-id (arsip hasil impor, bukan draf)",
    );
    continue;
  }

  console.log(`\n=== ${relative(ROOT, f)} (${data.length} soal) ===`);
  let fatalBerkas = 0;
  if (berId > 0) {
    console.log(`  ✗ berkas campur: ${berId} dari ${data.length} entri sudah ber-id`);
    fatalBerkas++;
  }
  const info = [];
  data.forEach((soal, i) => {
    totalSoal++;
    const hasil = periksaSoal(soal, i + 1, konteks);
    hasil.fatal.forEach((p) => console.log(`  ✗ ${p}`));
    info.push(...hasil.info);
    fatalBerkas += hasil.fatal.length;
    if (soal.sub_materi && [1, 2, 3].includes(soal.tingkat_kesulitan)) {
      if (!tambahan.has(soal.sub_materi)) tambahan.set(soal.sub_materi, { 1: 0, 2: 0, 3: 0 });
      tambahan.get(soal.sub_materi)[soal.tingkat_kesulitan]++;
    }
  });
  info.forEach((p) => console.log(`  · ${p}`));
  totalFatal += fatalBerkas;
  if (!fatalBerkas) console.log(`  ✓ ${data.length} soal lolos semua pemeriksaan`);
}

// --- proyeksi komposisi setelah impor ---
console.log("\n=== Proyeksi komposisi setelah impor ===");
const lamaPerSub = new Map();
for (const s of bankLama) {
  if (!lamaPerSub.has(s.sub_materi)) lamaPerSub.set(s.sub_materi, { 1: 0, 2: 0, 3: 0 });
  if ([1, 2, 3].includes(s.tingkat_kesulitan)) lamaPerSub.get(s.sub_materi)[s.tingkat_kesulitan]++;
}
for (const [sub, tambah] of [...tambahan].sort()) {
  const lama = lamaPerSub.get(sub) ?? { 1: 0, 2: 0, 3: 0 };
  const baru = { 1: lama[1] + tambah[1], 2: lama[2] + tambah[2], 3: lama[3] + tambah[3] };
  const total = baru[1] + baru[2] + baru[3];
  const kurang = [1, 2, 3].filter((L) => baru[L] < AMBANG_MIN_SOAL[L]);
  const status = kurang.length
    ? `⚠️  masih di bawah ambang headroom di level ${kurang.join(", ")}`
    : "✓ headroom aman di semua level";
  console.log(
    `  ${sub}\n` +
      `    ${lama[1]}/${lama[2]}/${lama[3]} (${lama[1] + lama[2] + lama[3]})` +
      ` -> ${baru[1]}/${baru[2]}/${baru[3]} (${total})   ${status}`,
  );
}

console.log(
  `\n${totalFatal ? "✗ GAGAL" : "✓ LOLOS"} — ${totalSoal} soal diperiksa, ${totalFatal} temuan fatal.`,
);
process.exit(totalFatal ? 1 : 0);
