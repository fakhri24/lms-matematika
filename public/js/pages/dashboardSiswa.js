// public/js/pages/dashboardSiswa.js

import {
  pantauSesi,
  logoutSistem,
  ubahPasswordSistem,
} from "../services/authService.js";
import { getRiwayatTerakhir, getLatihanSpesialAktif } from "../services/latihanService.js";
import {
  getSiswaByNis,
  updateGelarAktif,
  updateStatusPassword,
} from "../services/userService.js";
import { DATA_DEFAULT, STATUS_LATIHAN, MODE_LATIHAN } from "../utils/constants.js";

let currentUserLengkap = null;
let isModeJebakan = false;

const nis = localStorage.getItem("nis_siswa");
const nama = localStorage.getItem("nama_siswa") || DATA_DEFAULT.NAMA;
let gelarAktif = localStorage.getItem("gelar_aktif") || DATA_DEFAULT.GELAR;
let gelarTerbuka = JSON.parse(
  localStorage.getItem("gelar_terbuka") || `[${DATA_DEFAULT.GELAR}]`,
);

function renderSapaan() {
  document.getElementById("sapaan-siswa").innerText = `Hi, ${nama}!`;
  document.getElementById("badge-gelar-siswa").innerText = `${gelarAktif}`;
}

async function muatSkorTerakhir() {
  try {
    const dataTerakhir = await getRiwayatTerakhir(nis, 5);
    const dataSelesai = dataTerakhir.find(
      (d) => d.status !== STATUS_LATIHAN.DRAF,
    );
    if (dataSelesai) {
      document.getElementById("skor-terakhir").innerText = dataSelesai.nilai;
      document.getElementById("materi-terakhir").innerText =
        `${dataSelesai.materi_utama || DATA_DEFAULT.MATERI}: ${dataSelesai.sub_materi || DATA_DEFAULT.SUB_MATERI}`;
    }
  } catch (error) {
    console.error("Gagal memuat skor terakhir:", error);
  }
}

async function muatLatihanSpesial() {
  try {
    const spesialAktif = await getLatihanSpesialAktif();
    const banner = document.getElementById("banner-latihan-spesial");
    if (!banner) return;

    if (spesialAktif) {
      document.getElementById("banner-spesial-judul").innerText = spesialAktif.judul;
      document.getElementById("banner-spesial-submateri").innerText = `Sub-Materi: ${spesialAktif.sub_materi.join(", ")}`;
      document.getElementById("banner-spesial-durasi").innerText = `⏱️ ${spesialAktif.durasi_menit} Menit`;
      
      const tSelesai = new Date(spesialAktif.waktu_selesai);
      const updateWaktu = () => {
        const selisih = Math.max(0, Math.floor((tSelesai - new Date()) / 1000));
        if (selisih <= 0) {
          banner.style.display = "none";
        } else {
          const jam = Math.floor(selisih / 3600);
          const menit = Math.floor((selisih % 3600) / 60);
          document.getElementById("banner-spesial-waktu").innerText = `Berakhir dalam ${jam}j ${menit}m`;
        }
      };
      
      updateWaktu();
      setInterval(updateWaktu, 60000); // Update tiap menit

      document.getElementById("btn-kerjakan-spesial").onclick = () => {
        localStorage.setItem("mode_latihan", MODE_LATIHAN.SPESIAL);
        localStorage.setItem("id_latihan_spesial", spesialAktif.id);
        localStorage.setItem("judul_latihan_spesial", spesialAktif.judul);
        localStorage.setItem("durasi_latihan_spesial", spesialAktif.durasi_menit);
        localStorage.setItem("sub_materi_spesial", JSON.stringify(spesialAktif.sub_materi));
        
        window.location.href = "latihan.html";
      };

      banner.style.display = "block";
    } else {
      banner.style.display = "none";
    }
  } catch (error) {
    console.error("Gagal memuat Latihan Spesial:", error);
  }
}

pantauSesi(async (user) => {
  currentUserLengkap = user;
  renderSapaan();
  muatSkorTerakhir();
  muatLatihanSpesial();

  if (nis) {
    try {
      const dataSiswa = await getSiswaByNis(nis);
      if (dataSiswa && dataSiswa.wajib_ganti_password === true) {
        isModeJebakan = true;
        document.getElementById("judul-modal-sandi").innerText =
          "Keamanan Akun";
        document.getElementById("deskripsi-modal-sandi").innerText =
          "Kamu masih menggunakan password bawaan. Demi keamanan, wajib buat password baru yang rahasia sekarang.";
        document.getElementById("wadah-pass-lama").style.display = "none";
        document.getElementById("btn-tutup-modal-sandi").style.display = "none";
        document.getElementById("modal-ganti-password").style.display = "flex";
      }
    } catch (error) {
      console.error("Gagal mengecek status keamanan:", error);
    }
  }
}, false);

function navigasi(url) {
  window.location.href = url;
}

function keluarAplikasi() {
  logoutSistem();
}

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("menu-materi")
    ?.addEventListener("click", () => navigasi("pilih-materi.html"));
  document
    .getElementById("menu-rekap")
    ?.addEventListener("click", () => navigasi("rekap-hasil.html"));
  document
    .getElementById("menu-riwayat")
    ?.addEventListener("click", () => navigasi("riwayat.html"));
  document
    .getElementById("menu-leaderboard")
    ?.addEventListener("click", () => navigasi("leaderboard.html"));
  document
    .getElementById("menu-koreksi-uh")
    ?.addEventListener("click", () => navigasi("koreksi-uh.html"));
  document
    .getElementById("btn-logout")
    ?.addEventListener("click", keluarAplikasi);

  document.getElementById("btn-ubah-sandi")?.addEventListener("click", () => {
    isModeJebakan = false;
    document.getElementById("input-pass-lama").value = "";
    document.getElementById("input-pass-baru").value = "";
    document.getElementById("input-pass-konfirmasi").value = "";
    document.getElementById("error-ganti-pass").style.display = "none";
    document.getElementById("judul-modal-sandi").innerText = "Ubah Password";
    document.getElementById("deskripsi-modal-sandi").innerText =
      "Silakan masukkan password saat ini dan password baru untuk memperbarui keamanan akunmu.";
    document.getElementById("wadah-pass-lama").style.display = "block";
    document.getElementById("btn-tutup-modal-sandi").style.display = "block";
    document.getElementById("modal-ganti-password").style.display = "flex";
  });

  const modalGelar = document.getElementById("modal-gelar");
  const wadahGelar = document.getElementById("wadah-daftar-gelar");

  document
    .getElementById("btn-buka-lemari-gelar")
    ?.addEventListener("click", () => {
      wadahGelar.innerHTML = "";
      gelarTerbuka.forEach((gelar) => {
        const isAktif = gelar === gelarAktif;
        const btn = document.createElement("button");
        btn.className = isAktif ? "btn btn-primary" : "btn btn-secondary";
        btn.style.cssText =
          "border-radius: 20px; padding: 8px 16px; font-size: 0.85rem;";
        btn.innerText = isAktif ? `👑 ${gelar}` : gelar;

        if (!isAktif) {
          btn.addEventListener("click", async () => {
            gelarAktif = gelar;
            localStorage.setItem("gelar_aktif", gelarAktif);
            renderSapaan();
            modalGelar.style.display = "none";
            try {
              await updateGelarAktif(nis, gelarAktif);
            } catch (err) {
              console.error("Gagal simpan gelar:", err);
            }
          });
        }
        wadahGelar.appendChild(btn);
      });
      modalGelar.style.display = "flex";
    });

  document
    .getElementById("btn-tutup-lemari-gelar")
    ?.addEventListener("click", () => (modalGelar.style.display = "none"));

  document
    .getElementById("btn-tutup-modal-sandi")
    ?.addEventListener(
      "click",
      () =>
        (document.getElementById("modal-ganti-password").style.display =
          "none"),
    );

  document
    .getElementById("btn-simpan-password")
    ?.addEventListener("click", async () => {
      const btnSimpan = document.getElementById("btn-simpan-password");
      const passLama = document.getElementById("input-pass-lama").value;
      const passBaru = document.getElementById("input-pass-baru").value;
      const passKonfirmasi = document.getElementById(
        "input-pass-konfirmasi",
      ).value;
      const pesanError = document.getElementById("error-ganti-pass");

      if (!isModeJebakan && !passLama)
        return showPassError("Password saat ini wajib diisi!");
      if (passBaru.length < 6)
        return showPassError("Password baru minimal 6 karakter!");
      if (passBaru !== passKonfirmasi)
        return showPassError("Konfirmasi password baru tidak cocok!");

      btnSimpan.innerText = "Memverifikasi...";
      btnSimpan.disabled = true;
      pesanError.style.display = "none";

      try {
        // Eksekusi auth service tanpa memanggil logic auth firebase di UI
        await ubahPasswordSistem(
          currentUserLengkap,
          passLama,
          passBaru,
          isModeJebakan,
        );

        if (isModeJebakan) await updateStatusPassword(nis, false);

        alert("Aman! Password berhasil diperbarui.");
        document.getElementById("modal-ganti-password").style.display = "none";
        isModeJebakan = false;
      } catch (error) {
        if (
          error.code === "auth/invalid-credential" ||
          error.code === "auth/wrong-password"
        )
          showPassError("Password saat ini (lama) salah!");
        else if (error.code === "auth/requires-recent-login")
          showPassError("Sesi terlalu lama. Silakan logout dan login kembali.");
        else showPassError("Terjadi kesalahan. Coba lagi nanti.");
      } finally {
        btnSimpan.innerText = "Simpan & Lanjutkan";
        btnSimpan.disabled = false;
      }
    });

  function showPassError(msg) {
    const el = document.getElementById("error-ganti-pass");
    el.innerText = msg;
    el.style.display = "block";
  }
});
