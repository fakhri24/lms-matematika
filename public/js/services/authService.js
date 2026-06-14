import { auth } from "../config/firebase.js";
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { mulaiPelacakanSesi, hentikanPelacakanSesi } from "./sessionTracker.js";


/**
 * Fungsi untuk memantau sesi user yang sedang aktif.
 * @param {Function} callbackValid - Dieksekusi jika user valid.
 * @param {boolean} isRoleAdmin - Jika true, hanya admin@albago.id yang lolos.
 */
export function pantauSesi(callbackValid, isRoleAdmin = false) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }
    if (isRoleAdmin && user.email !== "admin@albago.id") {
      window.location.href = "index.html";
      return;
    }
    if (!isRoleAdmin && user.email === "admin@albago.id") {
      window.location.href = "admin.html";
      return;
    }
    
    // Mulai pelacakan sesi jika yang login adalah siswa
    if (!isRoleAdmin && user.email !== "admin@albago.id") {
      const nis = user.email.split("@")[0];
      mulaiPelacakanSesi(nis);
    }

    if (callbackValid) callbackValid(user);
  });
}

/**
 * Fungsi untuk keluar dari aplikasi secara global
 */
export function logoutSistem() {
  hentikanPelacakanSesi();
  return signOut(auth)
    .then(() => {
      localStorage.clear();
      window.location.href = "index.html";
    })
    .catch((error) => {
      console.error("Gagal logout:", error);
    });
}

/**
 * Fungsi Login Sistem
 */
export async function loginSistem(nis, password) {
  // Logika 99999 dipusatkan di sini
  let emailAlbago = nis === "99999" ? "admin@albago.id" : `${nis}@albago.id`;
  return await signInWithEmailAndPassword(auth, emailAlbago, password);
}

/**
 * Fungsi Ubah Password
 */
export async function ubahPasswordSistem(
  currentUser,
  passLama,
  passBaru,
  isModeJebakan,
) {
  // Re-autentikasi jika bukan mode jebakan (bukan reset paksa dari admin)
  if (!isModeJebakan) {
    const kredensial = EmailAuthProvider.credential(
      currentUser.email,
      passLama,
    );
    await reauthenticateWithCredential(currentUser, kredensial);
  }
  // Update password
  await updatePassword(currentUser, passBaru);
  return true;
}
