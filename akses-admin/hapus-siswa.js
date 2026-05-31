const admin = require("firebase-admin");
const serviceAccount = require("./kunci-rahasia-firebase.json");
const fs = require("fs");

// Inisialisasi Jalur VIP Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

async function hapusSiswa(nis) {
  const nisStr = String(nis).trim();
  console.log(`\n=== Memproses penghapusan untuk NIS: ${nisStr} ===`);
  
  try {
    // 1. Hapus Auth (Email/Login)
    try {
      await auth.deleteUser(nisStr);
      console.log(`[+] Berhasil menghapus akun dari Firebase Auth.`);
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
         console.log(`[!] Akun Firebase Auth tidak ditemukan, melanjutkan proses.`);
      } else {
         throw e;
      }
    }

    // 2. Hapus profil dari data_siswa
    await db.collection("data_siswa").doc(nisStr).delete();
    console.log(`[+] Berhasil menghapus profil dari koleksi data_siswa.`);

    // 3. Hapus riwayat dari hasil_latihan
    const hasilSnap = await db.collection("hasil_latihan").where("nis_siswa", "==", nisStr).get();
    if (!hasilSnap.empty) {
      const batch = db.batch();
      let count = 0;
      hasilSnap.forEach(doc => {
        batch.delete(doc.ref);
        count++;
      });
      await batch.commit();
      console.log(`[+] Berhasil menghapus ${count} riwayat dari koleksi hasil_latihan.`);
    } else {
      console.log(`[+] Tidak ada riwayat ditemukan di koleksi hasil_latihan.`);
    }

    // 4. Hapus progres dari progres_belajar
    const progresSnap = await db.collection("progres_belajar").where("nis_siswa", "==", nisStr).get();
    if (!progresSnap.empty) {
      const batch2 = db.batch();
      let count2 = 0;
      progresSnap.forEach(doc => {
        batch2.delete(doc.ref);
        count2++;
      });
      await batch2.commit();
      console.log(`[+] Berhasil menghapus ${count2} progres dari koleksi progres_belajar.`);
    } else {
      console.log(`[+] Tidak ada progres ditemukan di koleksi progres_belajar.`);
    }
    
    console.log(`✅ BERHASIL: Semua data terkait NIS ${nisStr} telah bersih terhapus.`);
    return true;
  } catch (error) {
    console.error(`❌ GAGAL: Terjadi kesalahan saat menghapus ${nisStr}:`, error.message);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log("Penggunaan Script:");
    console.log("  Mode Satuan : node hapus-siswa.js <NIS>");
    console.log("  Mode Batch  : node hapus-siswa.js --batch <file.json>");
    process.exit(1);
  }

  if (args[0] === "--batch") {
    const fileTarget = args[1];
    if (!fileTarget) {
      console.log("Error: Berikan nama file JSON! Contoh: node hapus-siswa.js --batch daftar_hapus.json");
      process.exit(1);
    }
    
    try {
      const data = fs.readFileSync(fileTarget, "utf8");
      const listNis = JSON.parse(data);
      
      if (!Array.isArray(listNis)) {
        throw new Error("Format JSON harus berupa array (contoh: [\"2024001\", \"2024002\"])");
      }
      
      console.log(`Memulai mode batch untuk ${listNis.length} siswa...`);
      let sukses = 0, gagal = 0;
      
      for (const nis of listNis) {
        const isSuccess = await hapusSiswa(nis);
        if (isSuccess) sukses++;
        else gagal++;
      }
      console.log(`\n=== Selesai Eksekusi Batch ===`);
      console.log(`Total Sukses : ${sukses}`);
      console.log(`Total Gagal  : ${gagal}`);
      
    } catch (e) {
      console.error("Error membaca file batch:", e.message);
      process.exit(1);
    }
    
  } else {
    // Mode satuan
    const nisTarget = args[0];
    await hapusSiswa(nisTarget);
  }
  
  process.exit(0);
}

main();
