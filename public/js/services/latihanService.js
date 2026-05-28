// public/js/services/latihanService.js
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
    where("nis_siswa", "==", nis),
    orderBy("waktu_submit", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => docSnap.data());
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
  return docSnap.exists() && docSnap.data().log_progres
    ? docSnap.data().log_progres
    : {};
}

export async function getDrafFormatif(nis, subMateri) {
  const docId = `${nis}_${subMateri.replace(/\s+/g, "")}_formatif_draft`;
  const docSnap = await getDoc(doc(db, "hasil_latihan", docId));
  return docSnap.exists() ? docSnap.data() : null;
}

export async function simpanProgresSatuSoal(
  nis,
  subMateri,
  idSoal,
  skorSoal,
  jawabanSiswa,
) {
  const docRef = doc(db, "progres_belajar", `${nis}_${subMateri}`);
  await setDoc(
    docRef,
    {
      nis_siswa: nis,
      sub_materi: subMateri,
      log_progres: { [idSoal]: { skor: skorSoal, jawaban: jawabanSiswa } },
    },
    { merge: true },
  );
}

export async function resetProgresFormatif(nis, subMateri) {
  await updateDoc(
    // <--- Konsekuensi: Ubah setDoc menjadi updateDoc
    doc(db, "progres_belajar", `${nis}_${subMateri}`),
    { log_progres: {} },
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
    where("nis_siswa", "==", nis),
    orderBy("waktu_submit", "asc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => docSnap.data());
}

export async function getRiwayatTerakhir(nis, limitAngka = 5) {
  const q = query(
    collection(db, "hasil_latihan"),
    where("nis_siswa", "==", nis),
    orderBy("waktu_submit", "desc"),
    limit(limitAngka),
  );
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => docSnap.data());
}

export async function getSemuaHasilLatihanGlobal() {
  const snap = await getDocs(collection(db, "hasil_latihan"));
  return snap.docs.map((docSnap) => docSnap.data());
}
