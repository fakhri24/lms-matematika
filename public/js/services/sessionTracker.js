// public/js/services/sessionTracker.js
import { db } from "../config/firebase.js";
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

let intervalId = null;
let currentNis = null;
let lastTickTime = Date.now();
const TICK_INTERVAL = 5000; // 5 detik
const SYNC_THRESHOLD = 60; // Sinkron ke DB setiap 60 detik terakumulasi

function getSesiStorage() {
  const data = sessionStorage.getItem(`sesi_terakhir_${currentNis}`);
  if (data) {
    try {
      return JSON.parse(data);
    } catch(e) {}
  }
  return {
    waktu_login: new Date().toISOString(),
    waktu_logout: new Date().toISOString(),
    durasi_aktif_detik: 0,
    unsynced_detik: 0
  };
}

function setSesiStorage(sesi) {
  sessionStorage.setItem(`sesi_terakhir_${currentNis}`, JSON.stringify(sesi));
}

export function mulaiPelacakanSesi(nis) {
  if (intervalId) return;
  
  currentNis = nis;
  lastTickTime = Date.now();
  
  // Buat sesi baru jika tidak ada di sessionStorage tab ini
  const sesi = getSesiStorage();
  setSesiStorage(sesi);
  
  cobaSinkronisasiPenuh(); // Sinkronisasi awal (mencatat waktu login)

  intervalId = setInterval(() => {
    const now = Date.now();
    const gapMs = now - lastTickTime;
    
    // Asalkan jedanya wajar (kurang dari 2 menit)
    if (gapMs > 0 && gapMs < 120000) {
      const sesiSekarang = getSesiStorage();
      sesiSekarang.waktu_logout = new Date().toISOString(); 
      
      // HANYA tambah durasi jika tab sedang dilihat (aktif) DAN berada di halaman latihan
      const isHalamanLatihan = window.location.pathname.includes('latihan');
      if (!document.hidden && isHalamanLatihan) {
        const gapDetik = Math.round(gapMs / 1000);
        sesiSekarang.durasi_aktif_detik += gapDetik;
        sesiSekarang.unsynced_detik += gapDetik;
      }
      
      setSesiStorage(sesiSekarang);
      
      if (sesiSekarang.unsynced_detik >= SYNC_THRESHOLD) {
        cobaSinkronisasi();
      }
    }
    
    lastTickTime = now;
  }, TICK_INTERVAL);
}

export function hentikanPelacakanSesi() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (currentNis) {
    const sesi = getSesiStorage();
    sesi.waktu_logout = new Date().toISOString();
    setSesiStorage(sesi);
    
    cobaSinkronisasiPenuh().then(() => {
      sessionStorage.removeItem(`sesi_terakhir_${currentNis}`);
      currentNis = null;
    }).catch(() => {});
  }
}

async function cobaSinkronisasi() {
  if (!currentNis) return;
  const sesi = getSesiStorage();
  
  if (sesi.unsynced_detik < SYNC_THRESHOLD) return;

  try {
    const referensiSiswa = doc(db, "data_siswa", currentNis);
    await updateDoc(referensiSiswa, {
      sesi_terakhir: {
        waktu_login: sesi.waktu_login,
        waktu_logout: sesi.waktu_logout,
        durasi_aktif_detik: sesi.durasi_aktif_detik
      }
    });
    
    sesi.unsynced_detik = 0;
    setSesiStorage(sesi);
  } catch (error) {
    console.error("Gagal sinkronisasi sesi login:", error);
  }
}

async function cobaSinkronisasiPenuh() {
  if (!currentNis) return;
  const sesi = getSesiStorage();

  try {
    const referensiSiswa = doc(db, "data_siswa", currentNis);
    await updateDoc(referensiSiswa, {
      sesi_terakhir: {
        waktu_login: sesi.waktu_login,
        waktu_logout: sesi.waktu_logout,
        durasi_aktif_detik: sesi.durasi_aktif_detik
      }
    });
    sesi.unsynced_detik = 0;
    setSesiStorage(sesi);
  } catch (error) {
    console.error("Gagal sinkronisasi sesi login:", error);
  }
}
