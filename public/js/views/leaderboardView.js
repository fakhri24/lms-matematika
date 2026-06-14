// public/js/views/leaderboardView.js

/**
 * Membuat tombol (chip) untuk saran materi
 */
export function createSaranBtnHTML(sub, isAktif) {
  const btnClass = isAktif ? "btn-primary" : "btn-secondary badge-outline";
  return `<button class="btn ${btnClass} saran-btn" style="padding: 6px 12px; font-size: 0.8rem; border-radius: 20px;" data-sub="${sub}">${sub}</button>`;
}

/**
 * Tampilan List per Peringkat di Papan Kegigihan
 */
export function createRankItemHTML(
  nama,
  totalSoal,
  teksWaktu,
  index,
  ikonRank,
  teksGelar,
) {
  const warnaNomor = index < 3 ? "#f59e0b" : "var(--text-muted)";
  const badgeGelar = `<span class="badge badge-warning" style="font-size: 0.65rem; padding: 2px 6px; margin-right: 4px; vertical-align: middle;">[${teksGelar}]</span>`;

  return `
    <div class="rank-item">
      <div class="flex-center gap-15">
        <div class="rank-number" style="color: ${warnaNomor};">${ikonRank}</div>
        <div>
          <div class="player-name">${badgeGelar}${nama}</div>
          <span class="text-xs text-muted">Mengerjakan <strong>${totalSoal}</strong> Soal</span>
        </div>
      </div>
      <div class="text-right">
        <div class="text-primary font-bold" style="font-size: 0.9rem;">⏱️ ${teksWaktu}</div>
        <span class="text-muted" style="font-size: 0.7rem;">Jam Terbang</span>
      </div>
    </div>`;
}

/**
 * Tampilan Kartu di Wall of Mastery
 */
export function createMasteryCardHTML(nama, teksGelar, jumlahLulus) {
  return `
    <div class="mastery-card">
      <div class="badge-title">${teksGelar}</div>
      <h3 class="text-main" style="margin: 5px 0 10px 0; font-size: 1.1rem;">${nama}</h3>
      <p class="text-muted" style="font-size: 0.75rem; margin: 0;">Menembus batas kelulusan ${jumlahLulus}x</p>
    </div>`;
}

/**
 * Kumpulan Empty States (Tampilan Kosong)
 */
export function createEmptySaranHTML() {
  return `<span class="text-sm text-danger">Arena tidak ditemukan.</span>`;
}

export function createSisaSaranHTML(jumlahSisa) {
  return `<span class="text-muted" style="font-size: 0.75rem; align-self: center; margin-left: 4px;">...dan ${jumlahSisa} arena lainnya</span>`;
}

export function createEmptyKegigihanHTML() {
  return `<p class="text-center text-muted mt-20">Belum ada jejak petualangan di wilayah ini.</p>`;
}

export function createEmptyMasteryHTML() {
  return `
    <div class="text-center mt-20" style="padding: 40px 20px; background: white; border-radius: 12px; border: 1px dashed var(--border-color);">
      <span style="font-size: 3rem;">🏰</span>
      <h3 class="text-muted mt-15">Tembok Masih Kosong</h3>
    </div>`;
}
