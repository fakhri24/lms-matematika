// public/js/pages/petaMateri.js
//
// Halaman "Peta Materi": tampilan visual dari gerbang prasyarat yang sama
// dengan yang mengunci kartu di pilih-materi.html. Rancangan: plan/PLAN.md §6.

import { getRiwayatLatihanSiswa } from "../services/latihanService.js";
import {
  PETA_PRASYARAT,
  PETA_TAHAPAN,
} from "../utils/kurikulumData.js";
import {
  hitungSetMaster,
  hitungStatusKunci,
} from "../utils/kurikulumEngine.js";
import {
  susunTataLetakPeta,
  tentukanStatusNode,
} from "../utils/tataLetakPeta.js";
import {
  createPetaSVG,
  createDetailHTML,
  createPetaErrorHTML,
} from "../views/petaMateriView.js";

const URUTAN_KURIKULUM = Object.keys(PETA_TAHAPAN);

let tataLetak = null;
let statusPerNode = {};

/**
 * Mengambil riwayat siswa lalu mengubahnya jadi status per materi.
 *
 * Berbeda dari halaman pilih materi yang fail-safe ke "tidak ada yang terkunci",
 * di sini kegagalan dilaporkan terang-terangan: peta yang menampilkan semua
 * materi sebagai "siap" padahal datanya gagal dimuat akan menyesatkan siswa.
 */
async function muatStatus() {
  const nis = localStorage.getItem("nis_siswa");
  if (!nis) return { setMaster: new Set(), gagal: false, tanpaSesi: true };

  try {
    const riwayat = await getRiwayatLatihanSiswa(nis);
    return { setMaster: hitungSetMaster(riwayat), gagal: false };
  } catch (error) {
    console.error("Gagal memuat riwayat untuk peta materi:", error);
    return { setMaster: new Set(), gagal: true };
  }
}

function tampilkanCatatan(pesan) {
  const wadah = document.getElementById("catatan-peta");
  if (!wadah) return;
  wadah.textContent = pesan;
  wadah.classList.toggle("tampil", Boolean(pesan));
}

function pilihNode(nama) {
  const wadahDetail = document.getElementById("detail-peta");
  const node = tataLetak?.node.find((n) => n.nama === nama);
  const info = statusPerNode[nama] || {};

  document
    .querySelectorAll(".peta-node.terpilih")
    .forEach((el) => el.classList.remove("terpilih"));
  if (node) {
    document
      .querySelector(`.peta-node[data-nama="${CSS.escape(nama)}"]`)
      ?.classList.add("terpilih");
  }

  wadahDetail.innerHTML = createDetailHTML(
    node,
    info.status || "siap",
    info.prereqBelum || [],
  );
}

/**
 * Menggeser peta ke satu materi.
 *
 * Sengaja tidak memakai `scrollIntoView`: fungsi itu ikut menggulung halaman,
 * sehingga siswa terlempar dari kepala halaman setiap kali peta difokuskan.
 * Di sini hanya wadah pengguliran peta yang digeser.
 */
function geserPetaKe(nama, halus = true) {
  const wadah = document.querySelector(".peta-scroll");
  const el = document.querySelector(`.peta-node[data-nama="${CSS.escape(nama)}"]`);
  if (!wadah || !el) return;

  const kotak = el.getBoundingClientRect();
  const bingkai = wadah.getBoundingClientRect();
  wadah.scrollTo({
    left:
      wadah.scrollLeft +
      (kotak.left - bingkai.left) -
      (bingkai.width - kotak.width) / 2,
    top:
      wadah.scrollTop +
      (kotak.top - bingkai.top) -
      (bingkai.height - kotak.height) / 2,
    behavior: halus ? "smooth" : "auto",
  });
}

/** Materi pertama yang siap dikerjakan siswa — garis depan progresnya. */
function cariGarisDepan() {
  const siap = tataLetak?.node
    .filter((n) => statusPerNode[n.nama]?.status === "siap")
    .sort((a, b) => a.kolom - b.kolom || a.baris - b.baris)[0];
  return siap || tataLetak?.node[0];
}

function fokusKeGarisDepan(halus = true) {
  const target = cariGarisDepan();
  if (!target) return;
  geserPetaKe(target.nama, halus);
  pilihNode(target.nama);
}

async function muatPeta() {
  const wadah = document.getElementById("wadah-peta");

  try {
    const { setMaster, gagal, tanpaSesi } = await muatStatus();

    tataLetak = susunTataLetakPeta(PETA_PRASYARAT, URUTAN_KURIKULUM);
    const statusKunci = hitungStatusKunci(PETA_PRASYARAT, setMaster);

    statusPerNode = {};
    tataLetak.node.forEach((n) => {
      statusPerNode[n.nama] = {
        status: tentukanStatusNode(n.nama, statusKunci, setMaster),
        prereqBelum: statusKunci[n.nama]?.prereqBelum || [],
      };
    });

    wadah.innerHTML = createPetaSVG(tataLetak, statusPerNode);

    const jumlahMaster = tataLetak.node.filter(
      (n) => statusPerNode[n.nama].status === "master",
    ).length;
    document.getElementById("ringkasan-peta").textContent =
      `${jumlahMaster} dari ${tataLetak.node.length} materi sudah dikuasai.`;

    if (gagal) {
      tampilkanCatatan(
        "Riwayat latihanmu gagal dimuat, jadi peta ini menampilkan keadaan awal. Muat ulang halaman untuk mencoba lagi.",
      );
    } else if (tanpaSesi) {
      tampilkanCatatan(
        "Kamu belum masuk, jadi peta ini menampilkan keadaan awal tanpa progresmu.",
      );
    } else {
      tampilkanCatatan("");
    }

    fokusKeGarisDepan(false);
  } catch (error) {
    console.error("Gagal menyusun peta materi:", error);
    wadah.innerHTML = createPetaErrorHTML();
  }
}

// =====================================================================
// EVENT
// =====================================================================
document.getElementById("wadah-peta").addEventListener("click", (e) => {
  const node = e.target.closest(".peta-node");
  if (node) pilihNode(node.getAttribute("data-nama"));
});

// Simpul SVG bisa difokus dengan tab, jadi Enter/Spasi harus ikut bekerja.
document.getElementById("wadah-peta").addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const node = e.target.closest(".peta-node");
  if (node) {
    e.preventDefault();
    pilihNode(node.getAttribute("data-nama"));
  }
});

document
  .getElementById("btn-fokus")
  .addEventListener("click", () => fokusKeGarisDepan(true));

// Peta selebar 7 kolom tidak muat di layar ponsel. Alih-alih mengecilkannya
// sejak awal sampai tak terbaca, ukuran asli tetap jadi bawaan dan siswa yang
// memutuskan kapan ingin melihat bentuk utuhnya.
document.getElementById("btn-zoom").addEventListener("click", (e) => {
  const wadah = document.querySelector(".peta-scroll");
  const utuh = wadah.classList.toggle("pas-layar");
  e.currentTarget.textContent = utuh ? "🔍 Ukuran asli" : "🔍 Lihat utuh";
  if (!utuh) fokusKeGarisDepan(false);
});

document
  .getElementById("btn-kembali")
  .addEventListener("click", () => (window.location.href = "pilih-materi.html"));

muatPeta();
