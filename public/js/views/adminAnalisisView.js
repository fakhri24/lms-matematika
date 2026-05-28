// public/js/views/adminAnalisisView.js

/**
 * Membuat satu baris tabel untuk Riwayat Latihan Global
 */
export function createRowRiwayatGlobalHTML(data, badgeSkor, labelMode) {
  const tgl = new Date(data.waktu_submit).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
    <td style="vertical-align: middle;">
      <div class="text-main font-bold" style="font-size: 0.9rem; max-width: 160px; white-space: normal; word-wrap: break-word; text-transform: uppercase; line-height: 1.4;">
        ${data.nama_siswa || "Anonim"}
      </div>
    </td>
    <td style="vertical-align: middle;">
      <div class="text-sm" style="color: #475569;">${data.materi_utama || "-"}</div>
      <strong class="text-main" style="font-size: 0.85rem;">${data.sub_materi || "-"}</strong><br>
      <span style="font-size: 0.75rem; color: #94a3b8;">${tgl}</span>
    </td>
    <td class="text-center" style="vertical-align: middle;">
      ${labelMode}
    </td>
    <td class="text-center text-main font-bold" style="vertical-align: middle;">
      ${data.total_latihan || 0}
    </td>
    <td class="text-center" style="vertical-align: middle;">
      ${badgeSkor}
    </td>
    <td class="text-center" style="vertical-align: middle;">
      <button class="btn btn-secondary btn-sm" data-action="lihat-detail" data-nis="${data.nis_siswa}" data-nama="${data.nama_siswa || "Anonim"}">🔍 Detail</button>
    </td>
  `;
}

/**
 * Membuat daftar saran pencarian (dropdown autocomplete)
 */
export function createSaranPencarianHTML(siswa) {
  return `
    <div class="saran-item flex-between" data-nis="${siswa.nis}" data-nama="${siswa.nama}" style="padding: 10px 15px; cursor: pointer; border-bottom: 1px solid var(--border-color);">
      <strong class="text-main text-sm">${siswa.nama}</strong>
      <small class="text-muted" style="background: #f8fafc; padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border-color);">${siswa.nis}</small>
    </div>
  `;
}

/**
 * Membuat satu baris tabel untuk Modal Detail Siswa
 */
export function createRowDetailSiswaHTML(
  data,
  waktu,
  teksDurasi,
  labelMode,
  infoStatus,
  teksNilai,
  jumlahSoal,
) {
  return `
    <td style="vertical-align: middle;">
      <strong class="text-main" style="font-size: 0.9rem;">${data.sub_materi || "Latihan"}</strong><br>
      <small class="text-muted">${data.materi_utama || "Umum"}</small>
    </td>
    <td class="text-center" style="vertical-align: middle;">
      ${labelMode}
    </td>
    <td class="text-center text-main font-bold" style="vertical-align: middle;">
      ${jumlahSoal}
    </td>
    <td class="text-muted" style="font-size: 0.8rem; vertical-align: middle; white-space: nowrap;">
      ${waktu}
    </td>
    <td class="text-center font-semibold" style="vertical-align: middle; font-size: 0.85rem;">
      ${teksDurasi}
    </td>
    <td class="text-center" style="vertical-align: middle;">
      ${teksNilai}
      ${infoStatus}
    </td>
  `;
}
