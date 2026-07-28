import { db } from "../config/firebase.js";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  setDoc,
  addDoc,
  deleteDoc,
  limit,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

export async function getMetadataSoal() {
  const docSnap = await getDoc(doc(db, "metadata", "statistik_soal"));
  return docSnap.exists() ? docSnap.data().data_materi : null;
}

export async function getRiwayatLatihanSiswa(nis) {
  const q = query(
    collection(db, "hasil_latihan"),
    where("nis_siswa", "==", nis)
  );
  const snap = await getDocs(q);
  const data = snap.docs.map((docSnap) => docSnap.data());
  return data.sort((a, b) => new Date(b.waktu_submit) - new Date(a.waktu_submit));
}

export async function getSoalById(idSoal) {
  const soalSnap = await getDoc(doc(db, "bank_soal", idSoal));
  return soalSnap.exists() ? soalSnap.data() : null;
}

export async function getBankSoalBySubMateri(subMateri) {
  const q = query(
    collection(db, "bank_soal"),
    where("sub_materi", "==", subMateri),
  );
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => ({
    id_unik_sistem: docSnap.id,
    ...docSnap.data(),
  }));
}

export async function getProgresFormatif(nis, subMateri) {
  const docSnap = await getDoc(
    doc(db, "progres_belajar", `${nis}_${subMateri}`),
  );
  const data = docSnap.exists() ? docSnap.data() : {};
  return {
    logProgres: data.log_progres || {},
    levelSaatIni: data.level_saat_ini || 1,
    levelTertinggiDicapai: data.level_tertinggi_dicapai || 1,
    jumlahBenarMandiri: data.jumlah_benar_mandiri || 0,
    totalSalahDiLevelIni: data.total_salah_di_level_ini || 0,
    formatifTuntas: data.formatif_tuntas || false,
    nilaiTuntasTerakhir: data.nilai_tuntas_terakhir ?? null,
  };
}

export async function getDrafFormatif(nis, subMateri) {
  const docId = `${nis}_${subMateri.replace(/\s+/g, "")}_formatif_draft`;
  const docSnap = await getDoc(doc(db, "hasil_latihan", docId));
  return docSnap.exists() ? docSnap.data() : null;
}

export async function simpanProgresAdaptif(nis, subMateri, stateAdaptif) {
  const {
    idSoal,
    benar,
    skorSoal,
    jawabanSiswa,
    levelSaatIni,
    levelTertinggiDicapai,
    jumlahBenarMandiri,
    totalSalahDiLevelIni,
    formatifTuntas,
    nilaiTuntasTerakhir,
  } = stateAdaptif;

  const payload = {
    nis_siswa: nis,
    sub_materi: subMateri,
    level_saat_ini: levelSaatIni,
    level_tertinggi_dicapai: levelTertinggiDicapai,
    jumlah_benar_mandiri: jumlahBenarMandiri,
    total_salah_di_level_ini: totalSalahDiLevelIni,
    formatif_tuntas: formatifTuntas,
  };
  if (benar) {
    payload.log_progres = { [idSoal]: { skor: skorSoal, jawaban: jawabanSiswa } };
  }
  if (formatifTuntas) {
    payload.nilai_tuntas_terakhir = nilaiTuntasTerakhir;
  }

  const docRef = doc(db, "progres_belajar", `${nis}_${subMateri}`);
  await setDoc(docRef, payload, { merge: true });
}

export async function resetProgresFormatif(nis, subMateri) {
  await updateDoc(
    // <--- Konsekuensi: Ubah setDoc menjadi updateDoc
    doc(db, "progres_belajar", `${nis}_${subMateri}`),
    {
      log_progres: {},
      level_saat_ini: 1,
      level_tertinggi_dicapai: 1,
      jumlah_benar_mandiri: 0,
      total_salah_di_level_ini: 0,
      formatif_tuntas: false,
      nilai_tuntas_terakhir: null,
    },
  );
}

export async function simpanDrafFormatifDB(docIdKustom, dataHasil) {
  await setDoc(doc(db, "hasil_latihan", docIdKustom), dataHasil, {
    merge: true,
  });
}

export async function simpanHasilAkhirDB(dataHasil) {
  await addDoc(collection(db, "hasil_latihan"), dataHasil);
}

export async function hapusDrafFormatifDB(docIdKustom) {
  await deleteDoc(doc(db, "hasil_latihan", docIdKustom));
}

// --- FUNGSI BARU UNTUK REKAP & LEADERBOARD ---
export async function getRiwayatLatihanAsc(nis) {
  const q = query(
    collection(db, "hasil_latihan"),
    where("nis_siswa", "==", nis)
  );
  const snap = await getDocs(q);
  const data = snap.docs.map((docSnap) => docSnap.data());
  return data.sort((a, b) => new Date(a.waktu_submit) - new Date(b.waktu_submit));
}

export async function getRiwayatTerakhir(nis, limitAngka = 5) {
  const q = query(
    collection(db, "hasil_latihan"),
    where("nis_siswa", "==", nis)
  );
  const snap = await getDocs(q);
  const data = snap.docs.map((docSnap) => docSnap.data());
  return data
    .sort((a, b) => new Date(b.waktu_submit) - new Date(a.waktu_submit))
    .slice(0, limitAngka);
}

export async function getSemuaHasilLatihanGlobal() {
  const snap = await getDocs(collection(db, "hasil_latihan"));
  return snap.docs.map((docSnap) => docSnap.data());
}

export async function getLatihanSpesialAktif() {
  const q = query(
    collection(db, "latihan_spesial"),
    orderBy("created_at", "desc"),
    limit(5)
  );
  const snap = await getDocs(q);
  const now = new Date();
  
  // Cari yang waktu_mulai <= now <= waktu_selesai
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const start = new Date(data.waktu_mulai);
    const end = new Date(data.waktu_selesai);
    if (now >= start && now <= end) {
      return { id: docSnap.id, ...data };
    }
  }
  return null;
}

// FUNGSI BARU UNTUK ATURAN KUADRAN (3 TERCEPAT PERCOBAAN PERTAMA)
export async function cekTop3Tercepat(subMateri, nisUser) {
  const q = query(
    collection(db, "hasil_latihan"),
    where("sub_materi", "==", subMateri),
    where("mode_latihan", "==", "tes_normal")
  );
  const snap = await getDocs(q);
  const semuaData = snap.docs.map(doc => doc.data());
  
  // Urutkan berdasarkan waktu_submit (paling lama ke baru)
  semuaData.sort((a, b) => new Date(a.waktu_submit) - new Date(b.waktu_submit));
  
  // Ambil HANYA percobaan pertama setiap siswa
  const percobaanPertamaMap = new Map();
  semuaData.forEach(data => {
    if (!percobaanPertamaMap.has(data.nis_siswa)) {
      percobaanPertamaMap.set(data.nis_siswa, data);
    }
  });
  
  // Jika percobaan pertama user tidak ada, berarti ini bukan percobaan pertamanya atau belum ada data
  if (!percobaanPertamaMap.has(nisUser)) return false;
  
  // Ambil semua percobaan pertama, lalu urutkan berdasarkan durasi (tercepat ke terlama)
  const daftarPertama = Array.from(percobaanPertamaMap.values());
  daftarPertama.sort((a, b) => {
    if (a.durasi_detik === b.durasi_detik) {
      // Jika durasi sama, yang submit duluan yang menang
      return new Date(a.waktu_submit) - new Date(b.waktu_submit);
    }
    return a.durasi_detik - b.durasi_detik;
  });
  
  // Ambil Top 3
  const top3 = daftarPertama.slice(0, 3);
  
  // Cek apakah nisUser ada di dalam top 3 ini
  const isMasukTop3 = top3.some(user => user.nis_siswa === nisUser);
  
  // Cek apakah percobaan saat ini (yang terbaru) adalah percobaan pertamanya
  // dengan membandingkan waktu submit
  const percobaanTerbaruUser = semuaData.filter(d => d.nis_siswa === nisUser).pop();
  const percobaanPertamaUser = percobaanPertamaMap.get(nisUser);
  
  // Jika percobaan terbaru BUKAN percobaan pertama, kembalikan false
  if (percobaanTerbaruUser.waktu_submit !== percobaanPertamaUser.waktu_submit) {
    return false;
  }

  return isMasukTop3;
}
