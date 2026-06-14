// public/js/views/pilihMateriView.js

/**
 * Membuat tombol navigasi Tab
 */
export function createTabButtonHTML(idTab, namaTab, isAktif) {
  return `
    <button class="tab-btn ${isAktif ? "active" : ""}" data-target="${idTab}">
      ${namaTab}
    </button>
  `;
}

/**
 * Membuat garis pemisah antar Tahapan Kurikulum
 */
export function createTahapSeparatorHTML(namaTahap) {
  return `
    <div class="tahap-separator">
      <span>${namaTahap}</span>
    </div>
  `;
}

/**
 * Membuat kartu materi yang bisa di-klik
 */
export function createMateriCardHTML(materiUtama, namaAsli, jumlahSoal) {
  return `
    <div class="question-card materi-card" data-materi="${materiUtama}" data-sub="${namaAsli}">
      <h4 class="text-primary mb-5" style="margin-top: 0;">📌 ${namaAsli}</h4>
      <p class="text-sm text-muted" style="margin: 0;">
        Tersedia ${jumlahSoal} Soal &bull; <span style="color: #94a3b8;">${materiUtama}</span>
      </p>
    </div>
  `;
}

/**
 * Tampilan jika gagal terhubung ke database
 */
export function createErrorStateHTML() {
  return "<p class='text-center text-danger'>Gagal terhubung ke database.</p>";
}
