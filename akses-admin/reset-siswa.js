const admin = require("firebase-admin");
const serviceAccount = require("./kunci-rahasia-firebase.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

// Menangkap NIS yang diketik admin di terminal
const nisTarget = process.argv[2];

async function resetPasswordSiswa() {
  if (!nisTarget) {
    console.log(
      "Error: Masukkan NIS! Contoh penggunaan: node reset-siswa.js 2024001",
    );
    process.exit(1);
  }

  const nisStr = String(nisTarget);
  const passwordReset = `${nisStr}00`; // Kembali ke password awal

  try {
    console.log(`Mencari akun dengan NIS: ${nisStr}...`);

    // 1. Paksa ubah password di Firebase Auth
    await auth.updateUser(nisStr, {
      password: passwordReset,
    });

    // 2. Kembalikan status wajib ganti password di Firestore
    await db.collection("data_siswa").doc(nisStr).set(
      {
        wajib_ganti_password: true,
      },
      { merge: true },
    );

    console.log(`✅ BERHASIL! Akun ${nisStr} telah di-reset.`);
    console.log(
      `Silakan instruksikan siswa login kembali dengan password: ${passwordReset}`,
    );
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      console.log(`❌ GAGAL: Akun dengan NIS ${nisStr} tidak ditemukan.`);
    } else {
      console.error(`❌ Terjadi kesalahan:`, error.message);
    }
  }
  process.exit();
}

resetPasswordSiswa();
