// public/js/app.js

import { LatihanController } from "./controllers/LatihanController.js";
import { pantauSesi, logoutSistem } from "./services/authService.js";

// Pantau sesi login (jika lolos, fungsi di dalam init controller akan aman)
pantauSesi((user) => {
  // Kosongkan saja, jika tidak dilempar ke login berarti sesi valid
}, false);

// Global function untuk logout
window.keluarAplikasi = function () {
  logoutSistem();
};

// Inisialisasi aplikasi Latihan
const app = new LatihanController();
app.init();
