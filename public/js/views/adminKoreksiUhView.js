// public/js/views/adminKoreksiUhView.js

/**
 * Membuat baris tabel HTML untuk satu item data koreksi UH
 * @param {Object} data - Objek data koreksi UH utuh dari database
 * @param {number} index - Indeks baris
 */
export function createRowKoreksiUhHTML(data, index) {
  const metadata = data.metadata || {};
  const ringkasan = data.ringkasan_nilai || {};
  const nama = metadata.nama_siswa || "Nama Tidak Diketahui";
  const kelas = metadata.kelas || "-";
  const topik = metadata.topik_ujian || "Topik Tidak Diketahui";
  
  // Format nilai
  const skorWajib = ringkasan.skor_wajib !== undefined ? ringkasan.skor_wajib : 0;
  const skorTambahan = ringkasan.skor_tambahan !== undefined ? ringkasan.skor_tambahan : 0;
  const nilaiTeks = `${skorWajib} (+${skorTambahan})`;

  // Tombol PDF
  const pdfBtn = data.pdf_url
    ? `<a href="${data.pdf_url}" target="_blank" class="btn btn-secondary btn-sm" style="padding: 4px 8px; border-radius: 6px;">📄 Buka</a>`
    : `<span class="text-muted text-xs">Tidak ada</span>`;

  return `
    <tr data-index="${index}">
      <td class="text-center">
        <input type="checkbox" class="check-koreksi-item" data-id="${data.id}" style="cursor: pointer;" />
      </td>
      <td class="font-semibold truncate" title="${nama}">${nama}</td>
      <td class="text-muted">${kelas}</td>
      <td class="truncate" title="${topik}">${topik}</td>
      <td class="text-center font-bold text-primary">${nilaiTeks}</td>
      <td class="text-center">${pdfBtn}</td>
      <td class="text-center">
        <button
          class="btn btn-sm font-semibold"
          style="background-color: #fee2e2; color: #ef4444; border: 1px solid #fca5a5; border-radius: 6px; padding: 4px 8px;"
          data-action="hapus-koreksi"
          data-id="${data.id}"
        >
          Hapus
        </button>
      </td>
    </tr>
  `;
}
