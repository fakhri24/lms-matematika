import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

// Konfigurasi tunggal untuk seluruh aplikasi LMS Matematika
const firebaseConfig = {
  apiKey: "AIzaSyAbOd9idwh_JzFBRJi-NReVoXcPEVCeUqI",
  authDomain: "lms-matematika.firebaseapp.com",
  projectId: "lms-matematika",
  storageBucket: "lms-matematika.firebasestorage.app",
  messagingSenderId: "55262690926",
  appId: "1:55262690926:web:0304fb47d2e22df78c307f",
};

// Inisialisasi Firebase
export const app = initializeApp(firebaseConfig);

// Gunakan getFirestore biasa (Memory Cache) untuk menghindari bug IndexedDB di Safari yang menyebabkan aplikasi hang/freeze
export const db = getFirestore(app);

export const auth = getAuth(app);

export const storage = getStorage(app);
