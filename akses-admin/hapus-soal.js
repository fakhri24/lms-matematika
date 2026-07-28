const admin = require("firebase-admin");
const serviceAccount = require("./kunci-rahasia-firebase.json");
const fs = require("fs");

// Inisialisasi Jalur VIP Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function hapusSoal(idSoal) {
  const id = String(idSoal).trim();
  try {
    const ref = db.collection("bank_soal").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      console.log(`[!] Soal ${id} tidak ditemukan di bank_soal, dilewati.`);
      return false;
    }
    const { sub_materi, pertanyaan } = snap.data();
    await ref.delete();
    console.log(
      `[+] Berhasil hapus ${id} (${sub_materi || "?"}) — ${(pertanyaan || "").replace(/<[^>]+>/g, " ").slice(0, 60)}`,
    );
    return true;
  } catch (error) {
    console.error(`❌ GAGAL hapus ${id}:`, error.message);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Penggunaan Script:");
    console.log("  Mode Satuan : node hapus-soal.js <idSoal>");
    console.log("  Mode Batch  : node hapus-soal.js --batch <file.json>");
    console.log(
      '  (file.json berisi array id, contoh: ["abc123", "def456"])',
    );
    process.exit(1);
  }

  if (args[0] === "--batch") {
    const fileTarget = args[1];
    if (!fileTarget) {
      console.log(
        "Error: Berikan nama file JSON! Contoh: node hapus-soal.js --batch daftar_hapus_soal.json",
      );
      process.exit(1);
    }

    let listId;
    try {
      const data = fs.readFileSync(fileTarget, "utf8");
      listId = JSON.parse(data);
      if (!Array.isArray(listId)) {
        throw new Error(
          'Format JSON harus berupa array id (contoh: ["abc123", "def456"])',
        );
      }
    } catch (e) {
      console.error("Error membaca file batch:", e.message);
      process.exit(1);
    }

    console.log(`Memulai mode batch untuk ${listId.length} soal...`);
    let sukses = 0,
      gagal = 0;
    for (const id of listId) {
      const isSuccess = await hapusSoal(id);
      if (isSuccess) sukses++;
      else gagal++;
    }
    console.log(`\n=== Selesai Eksekusi Batch ===`);
    console.log(`Total Sukses : ${sukses}`);
    console.log(`Total Gagal/Dilewati : ${gagal}`);
  } else {
    // Mode satuan
    await hapusSoal(args[0]);
  }

  process.exit(0);
}

main();
