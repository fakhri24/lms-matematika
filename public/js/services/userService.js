// public/js/services/userService.js
import { db } from "../config/firebase.js";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

export async function getSiswaByNis(nis) {
  const docSnap = await getDoc(doc(db, "data_siswa", nis));
  return docSnap.exists() ? docSnap.data() : null;
}

export async function updateGelarAktif(nis, gelar) {
  await updateDoc(doc(db, "data_siswa", nis), { gelar_aktif: gelar });
}

export async function updateStatusPassword(nis, status) {
  await updateDoc(doc(db, "data_siswa", nis), { wajib_ganti_password: status });
}

export async function getMapGelarSemuaSiswa() {
  const snap = await getDocs(collection(db, "data_siswa"));
  const mapGelar = {};
  snap.forEach((docSnap) => {
    mapGelar[docSnap.id] = docSnap.data().gelar_aktif || DATA_DEFAULT.GELAR;
  });
  return mapGelar;
}
