// public/js/services/adminService.js

import { db } from "../config/firebase.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
  addDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

/**
 * Menarik SEMUA riwayat latihan siswa dari awal sampai akhir
 */
export async function getAllRiwayatLatihan() {
  const q = query(
    collection(db, "hasil_latihan"),
    orderBy("waktu_submit", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => docSnap.data());
}

/**
 * Menarik SEMUA data soal dari bank soal
 */
export async function getAllBankSoal() {
  const snap = await getDocs(collection(db, "bank_soal"));
  return snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

/**
 * Menghapus 1 soal secara permanen
 */
export async function hapusSoalDB(idSoal) {
  await deleteDoc(doc(db, "bank_soal", idSoal));
}

/**
 * Menambah soal baru ke database
 */
export async function tambahSoalDB(dataSoal) {
  const docRef = await addDoc(collection(db, "bank_soal"), dataSoal);
  return docRef.id;
}

/**
 * Menyimpan editan soal yang sudah ada
 */
export async function updateSoalDB(idSoal, dataSoal) {
  await updateDoc(doc(db, "bank_soal", idSoal), dataSoal);
}

/**
 * Digunakan oleh mesin AI kalibrasi untuk update level empiris & win rate
 */
export async function updateStatistikEmpirisSoal(idSoal, level, winRate) {
  await updateDoc(doc(db, "bank_soal", idSoal), {
    tingkat_kesulitan_empiris: level,
    win_rate: winRate,
  });
}

/**
 * Mengupdate daftar kurikulum yang dibaca oleh halaman Pilih Materi Siswa
 */
export async function sinkronisasiMetadataSiswaDB(metaDataMap) {
  await setDoc(doc(db, "metadata", "statistik_soal"), {
    data_materi: metaDataMap,
  });
}

/**
 * Khusus untuk fitur Import JSON (Menimpa soal lama atau buat dokumen baru)
 */
export async function upsertSoalImportDB(id, dataSoal) {
  const idValid =
    id &&
    String(id).trim() !== "" &&
    String(id) !== "null" &&
    String(id) !== "undefined";
  const refDokumen = idValid
    ? doc(db, "bank_soal", String(id))
    : doc(collection(db, "bank_soal"));
  await setDoc(refDokumen, dataSoal);
}
