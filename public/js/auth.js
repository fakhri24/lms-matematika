import { db } from "./config/firebase.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
// TAMBAHKAN import authService
import { loginSistem } from "./services/authService.js";
import { DATA_DEFAULT } from "./utils/constants.js";

const btnLogin = document.getElementById("btn-login");
const nisInput = document.getElementById("nis-input");
const passInput = document.getElementById("pass-input");
const pesanError = document.getElementById("pesan-error");

function tekanEnterUntukLogin(event) {
  if (event.key === "Enter") {
    btnLogin.click();
  }
}

nisInput.addEventListener("keydown", tekanEnterUntukLogin);
passInput.addEventListener("keydown", tekanEnterUntukLogin);

btnLogin.addEventListener("click", async () => {
  const nis = nisInput.value;
  const password = passInput.value;

  if (!nis || !password) {
    tampilkanError("NIS dan Password wajib diisi.");
    return;
  }

  btnLogin.innerText = "Mengecek...";
  btnLogin.disabled = true;

  try {
    // 1. Panggil service login (Email/99999 diurus di dalam service)
    const userCredential = await loginSistem(nis, password);

    // 2. Cek apakah yang login admin
    if (userCredential.user.email === "admin@albago.id") {
      window.location.href = "admin.html";
      return;
    }

    // 3. Logika Siswa (Tetap tarik data dari firestore)
    const referensiSiswa = doc(db, "data_siswa", nis);
    const dataSiswa = await getDoc(referensiSiswa);

    let namaAsli = "Siswa Albago";
    let gelarAktif = DATA_DEFAULT.GELAR;
    let gelarTerbuka = [DATA_DEFAULT.GELAR];

    if (dataSiswa.exists()) {
      const data = dataSiswa.data();
      namaAsli = data.nama_lengkap || "Siswa Albago";
      gelarAktif = data.gelar_aktif || DATA_DEFAULT.GELAR;
      gelarTerbuka = data.gelar_terbuka || [DATA_DEFAULT.GELAR];
    }

    localStorage.setItem("nis_siswa", nis);
    localStorage.setItem("nama_siswa", namaAsli);
    localStorage.setItem("gelar_aktif", gelarAktif);
    localStorage.setItem("gelar_terbuka", JSON.stringify(gelarTerbuka));

    window.location.href = "dashboard-siswa.html";
  } catch (error) {
    console.error("Error Lengkap:", error);
    tampilkanError("NIS atau Password kamu salah.");
    btnLogin.innerText = "Masuk ke Aplikasi";
    btnLogin.disabled = false;
  }
});

function tampilkanError(teks) {
  pesanError.innerText = teks;
  pesanError.style.display = "block";
}
