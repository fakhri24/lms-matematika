import { db } from "../config/firebase.js";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  setDoc,
  arrayUnion,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
// STATUS_LATIHAN & LEVEL_SOAL sebelumnya diimpor tapi tak pernah dipakai di
// berkas ini; ikut dibersihkan bersama refactor definisi master.
import { MODE_LATIHAN, DATA_DEFAULT, MASTERY } from "../utils/constants.js";
import { isSubMateriMaster } from "../utils/kurikulumEngine.js";

// --- FUNGSI CEK MASTERY & UNLOCK GELAR ---
export async function cekMasteryDanGelar(
  nis,
  subMateri,
  nilaiSekarang,
  modeLatihan,
) {
  // Hanya berlaku untuk Ujian (bukan formatif terbimbing)
  if (
    modeLatihan === MODE_LATIHAN.FORMATIF ||
    modeLatihan === DATA_DEFAULT.SUB_MATERI
  )
    return null;

  // Saringan awal yang murah: kalau nilai kali ini saja belum cukup, tak perlu
  // menarik histori. Keputusan sesungguhnya tetap di isSubMateriMaster().
  if (nilaiSekarang < MASTERY.NILAI_MIN) return null;

  try {
    // 1. Tarik semua histori ujian di sub-materi ini
    const q = query(
      collection(db, "hasil_latihan"),
      where("nis_siswa", "==", nis),
      where("sub_materi", "==", subMateri),
    );
    const snap = await getDocs(q);

    const riwayat = snap.docs.map((docSnap) => docSnap.data());

    // 2. Aturan "master" tidak ditulis ulang di sini — satu definisi di
    //    kurikulumEngine, sama persis dengan yang dipakai gerbang prasyarat
    //    dan panel Ketuntasan. Dulu disalin manual dan sempat menyimpang.
    if (isSubMateriMaster(riwayat)) {
      let namaMateriSingkat = subMateri;
      if (subMateri.length > 25) {
        namaMateriSingkat = subMateri.substring(0, 25).trim() + "...";
      }

      const docRef = doc(db, "data_siswa", nis);
      const docSnap = await getDoc(docRef);

      let gelarTerbuka = [DATA_DEFAULT.GELAR];
      if (docSnap.exists() && docSnap.data().gelar_terbuka) {
        gelarTerbuka = docSnap.data().gelar_terbuka;
      }

      // Cek apakah di array sudah ada gelar yang mengandung nama materi ini
      const sudahPunyaGelarIni = gelarTerbuka.some((gelar) =>
        gelar.endsWith(namaMateriSingkat),
      );

      // Hanya generate dan simpan gelar JIKA BELUM PUNYA SAMA SEKALI
      if (!sudahPunyaGelarIni) {
        // Daftar prefix dengan nuansa realistis, profesi, spesialis, dan kepangkatan
        const daftarPrefiks = [
          "Pakar",
          "Maestro",
          "Virtuoso",
          "Spesialis",
          "Analis",
          "Profesor",
          "Grandmaster",
          "Suhu",
          "Arsitek",
          "Teknisi",
          "Jenius",
          "Strategis",
          "Penakluk",
          "Veteran",
          "Gladiator",
          "Ksatria",
          "Pendekar",
          "Pemburu",
          "Algojo",
          "Pawang",
          "Penjinak",
          "Penjaga",
          "Ranger",
          "Vanguard",
          "Paladin",
          "Assassin",
          "Penguasa",
          "Raja",
          "Sultan",
          "Lord",
          "Hacker",
          "Pemecah",
          "Penjelajah",
          "Navigator",
          "Detektif",
          "Sniper",
          "Kalkulator",
          "Visioner",
          "Master",
        ];

        const prefiksAcak =
          daftarPrefiks[Math.floor(Math.random() * daftarPrefiks.length)];
        const gelarBaru = `${prefiksAcak} ${namaMateriSingkat}`;

        // Simpan ke database
        await setDoc(
          docRef,
          { gelar_terbuka: arrayUnion(gelarBaru) },
          { merge: true },
        );

        // Simpan ke local storage
        gelarTerbuka.push(gelarBaru);
        localStorage.setItem("gelar_terbuka", JSON.stringify(gelarTerbuka));

        return gelarBaru; // Munculkan pop-up
      }
    }
  } catch (error) {
    console.error("Gagal mengecek mastery:", error);
  }
  return null;
}
