// public/js/utils/tataLetakPeta.js
//
// Tata letak murni untuk visualisasi peta materi (rancangan: plan/PLAN.md §6).
// Tanpa DOM, tanpa Firestore — fungsi di sini hanya memetakan nama materi ke
// koordinat grid (kolom, baris). Ukuran piksel dan warna ditentukan di
// views/petaMateriView.js.
//
// Kolomnya adalah LAPISAN PEMBUKAAN, bukan kedalaman topologis: kolom ke-N
// berisi materi yang terbuka setelah seluruh isi kolom 0..N-1 dikuasai. Nilainya
// dihitung dengan menjalankan `hitungStatusKunci()` berulang — mesin yang sama
// dengan yang mengunci kartu di halaman pilih materi, jadi peta ini mustahil
// berbohong tentang gerbangnya.

import { hitungStatusKunci, normalisasiNama } from "./kurikulumEngine.js";

/**
 * Mengumpulkan semua nama di peta prasyarat beserta ejaan aslinya untuk tampil.
 * Ejaan pada kunci menang atas ejaan pada daftar prasyarat, karena kuncilah yang
 * wajib sama persis dengan nama di Firestore.
 */
function kumpulkanLabel(petaPrasyarat) {
  const label = new Map(); // ternormalisasi -> nama tampil
  Object.entries(petaPrasyarat || {}).forEach(([target, daftar]) => {
    (daftar || []).forEach((prasyarat) => {
      const p = normalisasiNama(prasyarat);
      if (p && !label.has(p)) label.set(p, prasyarat);
    });
  });
  Object.keys(petaPrasyarat || {}).forEach((target) => {
    const t = normalisasiNama(target);
    if (t) label.set(t, target);
  });
  return label;
}

/**
 * Membagi materi ke dalam lapisan pembukaan.
 *
 * Lapisan 0 = materi yang tidak punya prasyarat di peta ini (untuk tabel
 * Trigonometri: materi tab Prasyarat yang jadi gerbang masuk). Lapisan
 * berikutnya = materi yang terbuka begitu seluruh lapisan sebelumnya dikuasai.
 *
 * Perhatikan: perhitungan ini SENGAJA tidak memakai status master siswa, supaya
 * bentuk peta sama untuk semua orang dan tidak berubah-ubah setiap kali seorang
 * siswa menuntaskan satu materi. Keadaan siswa dipakai untuk mewarnai simpul,
 * bukan untuk memindahkannya.
 *
 * @returns {{ lapisan: string[][], yatim: string[], label: Map<string,string> }}
 *          `yatim` = materi yang tak pernah terbuka meski semua lapisan
 *          sebelumnya dituntaskan; selalu kosong bila tabelnya sehat.
 */
export function hitungLapisanPembukaan(petaPrasyarat) {
  const label = kumpulkanLabel(petaPrasyarat);
  const target = new Set(
    Object.keys(petaPrasyarat || {}).map(normalisasiNama),
  );

  const akar = [...label.keys()].filter((nama) => !target.has(nama));
  const terbuka = new Set(akar);
  const lapisan = akar.length > 0 ? [akar] : [];

  // Batas iterasi = jumlah node. Peta yang sehat selesai jauh lebih cepat; batas
  // ini ada supaya tabel yang rusak berhenti, bukan menggantung browser siswa.
  for (let i = 0; i < label.size; i++) {
    const status = hitungStatusKunci(petaPrasyarat, terbuka);
    const baru = Object.keys(status).filter(
      (nama) => !status[nama].locked && !terbuka.has(nama),
    );
    if (baru.length === 0) break;
    lapisan.push(baru);
    baru.forEach((nama) => terbuka.add(nama));
  }

  return {
    lapisan,
    yatim: [...label.keys()].filter((nama) => !terbuka.has(nama)),
    label,
  };
}

/**
 * Menyusun koordinat grid setiap materi.
 *
 * Urutan baris dalam satu kolom memakai rerata baris prasyaratnya (barycenter),
 * cara paling sederhana untuk menekan garis yang saling menyilang. Materi tanpa
 * prasyarat — dan materi yang seri — diurutkan mengikuti urutan mengajar supaya
 * hasilnya stabil, bukan bergantung urutan penulisan tabel.
 *
 * @param {Object}   petaPrasyarat   { "Nama Materi": ["Prasyarat", ...] }
 * @param {string[]} urutanKurikulum urutan mengajar, mis. Object.keys(PETA_TAHAPAN)
 * @returns {{ node: Array, sisi: Array, jumlahKolom: number, jumlahBaris: number, yatim: string[] }}
 */
export function susunTataLetakPeta(petaPrasyarat, urutanKurikulum = []) {
  const { lapisan, yatim, label } = hitungLapisanPembukaan(petaPrasyarat);

  const urutanAjar = new Map(
    urutanKurikulum.map((nama, i) => [normalisasiNama(nama), i]),
  );
  const peringkatAjar = (nama) =>
    urutanAjar.has(nama) ? urutanAjar.get(nama) : Number.MAX_SAFE_INTEGER;

  const prasyaratDari = new Map();
  Object.entries(petaPrasyarat || {}).forEach(([target, daftar]) => {
    const t = normalisasiNama(target);
    prasyaratDari.set(
      t,
      (daftar || [])
        .map(normalisasiNama)
        .filter((p) => p && p !== t && label.has(p)),
    );
  });

  const baris = new Map();
  const rerataBarisPrasyarat = (nama) => {
    const induk = (prasyaratDari.get(nama) || []).filter((p) => baris.has(p));
    if (induk.length === 0) return Number.NEGATIVE_INFINITY;
    return induk.reduce((total, p) => total + baris.get(p), 0) / induk.length;
  };

  const kolomTersusun = lapisan.map((isiKolom) => {
    const terurut = [...isiKolom].sort((a, b) => {
      const ra = rerataBarisPrasyarat(a);
      const rb = rerataBarisPrasyarat(b);
      if (ra !== rb) return ra - rb;
      return peringkatAjar(a) - peringkatAjar(b);
    });
    // Baris baru ditulis SETELAH kolom ini selesai diurutkan, supaya barycenter
    // hanya melihat kolom-kolom di kirinya.
    terurut.forEach((nama, i) => baris.set(nama, i));
    return terurut;
  });

  const jumlahBaris = kolomTersusun.reduce(
    (maks, kolom) => Math.max(maks, kolom.length),
    0,
  );

  const node = [];
  kolomTersusun.forEach((isiKolom, indeksKolom) => {
    // Kolom pendek digeser ke tengah agar peta tidak berat sebelah ke atas.
    const geser = (jumlahBaris - isiKolom.length) / 2;
    isiKolom.forEach((nama, indeksBaris) => {
      node.push({
        nama,
        label: label.get(nama) || nama,
        kolom: indeksKolom,
        baris: indeksBaris,
        barisTampil: indeksBaris + geser,
        prasyarat: prasyaratDari.get(nama) || [],
      });
    });
  });

  const posisi = new Map(node.map((n) => [n.nama, n]));
  const sisi = [];
  node.forEach((n) => {
    n.prasyarat.forEach((p) => {
      if (posisi.has(p)) sisi.push({ dari: p, ke: n.nama });
    });
  });

  return { node, sisi, jumlahKolom: kolomTersusun.length, jumlahBaris, yatim };
}

/**
 * Tiga keadaan yang ditampilkan di peta.
 * "siap" berarti seluruh prasyaratnya sudah dikuasai — inilah garis depan siswa.
 */
export function tentukanStatusNode(nama, statusKunci = {}, setMaster) {
  const master = setMaster instanceof Set ? setMaster : new Set(setMaster || []);
  if (master.has(nama)) return "master";
  if (statusKunci[nama]?.locked) return "terkunci";
  return "siap";
}

/**
 * Memecah nama materi menjadi beberapa baris agar muat di dalam kotak SVG.
 * SVG `<text>` tidak membungkus teks sendiri, jadi pemenggalannya harus dihitung.
 * Kata yang lebih panjang dari satu baris dibiarkan meluber daripada dipotong
 * di tengah — nama materi lebih baik tetap terbaca utuh.
 */
export function pecahBaris(teks, maksKarakter = 24, maksBaris = 3) {
  const kata = String(teks ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (kata.length === 0) return [];

  const baris = [];
  let berjalan = "";
  kata.forEach((k) => {
    const calon = berjalan ? `${berjalan} ${k}` : k;
    if (calon.length <= maksKarakter || !berjalan) {
      berjalan = calon;
    } else {
      baris.push(berjalan);
      berjalan = k;
    }
  });
  if (berjalan) baris.push(berjalan);

  if (baris.length <= maksBaris) return baris;
  const dipotong = baris.slice(0, maksBaris);
  dipotong[maksBaris - 1] = `${dipotong[maksBaris - 1]}…`;
  return dipotong;
}
