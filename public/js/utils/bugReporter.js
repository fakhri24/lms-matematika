// public/js/utils/bugReporter.js

// ⚠️ GANTI DENGAN URL WEBHOOK DISCORD MILIKMU
const DISCORD_WEBHOOK_URL =
  "https://discord.com/api/webhooks/1505175434847846440/xTSCppeKAn9r2D9kJyh40QaPrWE3Lu30Z7XbiE2YPm0nXNCBUk-V0hwbxENzB0VnMwQJ";

document.addEventListener("DOMContentLoaded", () => {
  const btnBuka = document.getElementById("btn-buka-laporan");
  const btnTutup = document.getElementById("btn-tutup-laporan");
  const modalLaporan = document.getElementById("modal-laporan");
  const btnKirim = document.getElementById("btn-kirim-laporan");

  if (!btnBuka || !modalLaporan) return;

  btnBuka.addEventListener("click", () => {
    modalLaporan.style.display = "flex";
  });

  btnTutup.addEventListener("click", () => {
    modalLaporan.style.display = "none";
  });

  btnKirim.addEventListener("click", async () => {
    const tipe = document.getElementById("input-tipe-laporan").value;
    const deskripsi = document
      .getElementById("input-deskripsi-laporan")
      .value.trim();
    const fileInput = document.getElementById("input-gambar-laporan");

    if (!deskripsi) {
      alert("Deskripsi laporan tidak boleh kosong!");
      return;
    }

    btnKirim.innerText = "Mengirim...";
    btnKirim.disabled = true;

    // Ambil data otomatis dari penyimpanan lokal
    const namaSiswa = localStorage.getItem("nama_siswa") || "Anonim";
    const nisSiswa = localStorage.getItem("nis_siswa") || "Tidak diketahui";
    const lokasiHalaman = window.location.href;

    // Format pesan untuk Discord
    const pesanTeks = `**${tipe}**\n👤 **Siswa:** ${namaSiswa} (${nisSiswa})\n📍 **Halaman:** ${lokasiHalaman}\n📝 **Deskripsi:**\n${deskripsi}`;

    // Gunakan FormData agar bisa mengirim gambar & teks sekaligus
    const formData = new FormData();
    formData.append("content", pesanTeks);

    if (fileInput.files.length > 0) {
      formData.append("file", fileInput.files[0]);
    }

    try {
      const response = await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        body: formData,
        // Jangan set header 'Content-Type' secara manual jika pakai FormData
      });

      if (response.ok) {
        alert("Terima kasih! Laporanmu berhasil dikirim ke Admin.");
        modalLaporan.style.display = "none";
        document.getElementById("input-deskripsi-laporan").value = "";
        fileInput.value = "";
      } else {
        throw new Error("Gagal merespon Discord.");
      }
    } catch (error) {
      console.error("Gagal mengirim laporan:", error);
      alert("Gagal mengirim laporan. Pastikan koneksi internetmu lancar.");
    } finally {
      btnKirim.innerText = "🚀 Kirim ke Admin";
      btnKirim.disabled = false;
    }
  });
});
