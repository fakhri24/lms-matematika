const admin = require("firebase-admin");
const serviceAccount = require("./kunci-rahasia-firebase.json"); // Pastikan nama filenya sama!
const dataSiswa = require("./data_siswa.json"); // File JSON mentahmu

// Inisialisasi Jalur VIP Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

async function importDataSiswa() {
  console.log("=== MEMULAI IMPORT DATA SISWA ===");
  let sukses = 0;
  let gagal = 0;

  for (const siswa of dataSiswa) {
    const nisStr = String(siswa.nis);
    const emailDummy = `${nisStr}@albago.id`;
    const passwordAwal = `${nisStr}00`; // Sesuai kesepakatan: NIS+00 (contoh: 202400100)

    try {
      // 1. Buat Akun di Firebase Auth
      await auth.createUser({
        uid: nisStr, // Pakai NIS sebagai UID agar sinkron
        email: emailDummy,
        password: passwordAwal,
        displayName: siswa.nama,
      });

      // 2. Buat Catatan Profil di Firestore
      await db
        .collection("data_siswa")
        .doc(nisStr)
        .set(
          {
            nama_lengkap: siswa.nama,
            kelas: siswa.kelas || "Tanpa Kelas",
            wajib_ganti_password: true, // INI KUNCI UTAMANYA!
            gelar_aktif: "Petarung Baru",
            gelar_terbuka: ["Petarung Baru"],
          },
          { merge: true },
        );

      console.log(`[+] Berhasil import: ${siswa.nama} (${nisStr})`);
      sukses++;
    } catch (error) {
      // Jika email atau uid sudah ada, biasanya karena data tertimpa/import ulang
      if (error.code === "auth/email-already-exists" || error.code === "auth/uid-already-exists") {
        console.log(
          `[!] Akun ${nisStr} sudah ada di Auth. Memperbarui data Firestore...`,
        );
        // Tetap update nama di Firestore kalau NIS sudah ada
        await db.collection("data_siswa").doc(nisStr).set(
          {
            nama_lengkap: siswa.nama,
            kelas: siswa.kelas || "Tanpa Kelas",
          },
          { merge: true },
        );
        sukses++;
      } else {
        console.error(`[-] Gagal import ${siswa.nama}:`, error.message);
        gagal++;
      }
    }
  }

  console.log("=================================");
  console.log(`Selesai! Berhasil: ${sukses}, Gagal: ${gagal}`);
  process.exit();
}

importDataSiswa();
