// public/js/services/koreksiUhService.js

import { db, storage } from "../config/firebase.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  setDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";
import { normalisasiTopik } from "../utils/koreksiHelper.js";

/**
 * Mengambil seluruh data koreksi UH milik siswa tertentu berdasarkan NIS
 * @param {string} nis - NIS Siswa
 */
export async function getKoreksiUhByNis(nis) {
  const q = query(
    collection(db, "koreksi_uh"),
    where("nis_siswa", "==", nis)
  );
  const snap = await getDocs(q);
  const data = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  
  // Urutkan di memori berdasarkan waktu_submit desc untuk menghindari keharusan composite index
  return data.sort((a, b) => {
    const waktuA = a.waktu_submit ? new Date(a.waktu_submit).getTime() : 0;
    const waktuB = b.waktu_submit ? new Date(b.waktu_submit).getTime() : 0;
    return waktuB - waktuA;
  });
}

/**
 * Mengambil seluruh data koreksi UH di database (untuk Admin)
 */
export async function getAllKoreksiUh() {
  const q = query(
    collection(db, "koreksi_uh"),
    orderBy("waktu_submit", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

/**
 * Menyimpan data koreksi UH ke Firestore
 * @param {string} nis - NIS Siswa
 * @param {string} topikUjian - Topik Ujian
 * @param {Object} dataKoreksi - Objek koreksi utuh dari JSON
 * @param {string} pdfUrl - URL file PDF pekerjaan siswa
 */
export async function saveKoreksiUh(nis, topikUjian, dataKoreksi, pdfUrl) {
  const topikNormal = normalisasiTopik(topikUjian);
  const docId = `${nis}_${topikNormal}`;
  
  // Format dokumen utuh yang akan disimpan
  const docData = {
    ...dataKoreksi,
    nis_siswa: nis,
    pdf_url: pdfUrl,
    waktu_submit: new Date().toISOString(),
  };

  await setDoc(doc(db, "koreksi_uh", docId), docData);
  return docId;
}

/**
 * Menghapus data koreksi UH berdasarkan ID dokumen beserta berkas PDF di Firebase Storage jika ada
 * @param {string} docId - ID dokumen Firestore (format: {nis}_{topik_normal})
 */
export async function deleteKoreksiUh(docId) {
  const docRef = doc(db, "koreksi_uh", docId);
  
  try {
    // 1. Ambil data dokumen terlebih dahulu untuk mengetahui URL berkas PDF
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const pdfUrl = data.pdf_url;
      
      // Cek apakah berkas PDF diunggah ke Firebase Storage kita
      if (pdfUrl && pdfUrl.includes("firebasestorage.googleapis.com")) {
        try {
          const fileRef = ref(storage, `koreksi_uh/${docId}.pdf`);
          await deleteObject(fileRef);
          console.log("Berkas PDF pekerjaan di Storage berhasil dihapus.");
        } catch (storageErr) {
          // Tangani kemungkinan file tidak ada di storage (misalnya terhapus manual)
          console.warn("Berkas PDF di Storage tidak ditemukan atau gagal dihapus:", storageErr);
        }
      }
    }
  } catch (err) {
    console.error("Gagal mendeteksi berkas PDF untuk dihapus:", err);
  }

  // 2. Hapus dokumen di Firestore
  await deleteDoc(docRef);
}

/**
 * Mengunggah berkas PDF pekerjaan siswa ke Firebase Storage
 * @param {string} nis - NIS Siswa
 * @param {string} topikUjian - Topik Ujian
 * @param {File} file - Berkas PDF dari input file
 */
export async function uploadPdfKoreksi(nis, topikUjian, file) {
  const topikNormal = normalisasiTopik(topikUjian);
  const pathRef = `koreksi_uh/${nis}_${topikNormal}.pdf`;
  const storageRef = ref(storage, pathRef);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
}
