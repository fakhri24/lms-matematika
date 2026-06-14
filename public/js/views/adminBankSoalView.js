// public/js/views/adminBankSoalView.js

/**
 * Membuat satu baris (tr) untuk tabel Bank Soal
 */
export function createRowBankSoalHTML(
  soal,
  badgeLevel,
  prasyaratHTML,
  cuplikan,
  statusPembahasan,
) {
  return `
    <td class="text-sm font-semibold truncate" style="max-width: 150px; vertical-align: middle;">${badgeLevel} ${soal.sub_materi || "Umum"}</td>
    <td style="width: 180px; min-width: 180px; max-width: 180px; vertical-align: middle;">${prasyaratHTML}</td>
    <td class="text-sm text-muted truncate" style="max-width: 250px; vertical-align: middle;">${cuplikan}</td>
    <td class="text-sm font-bold text-success truncate" style="max-width: 150px; vertical-align: middle;" data-original-title="${soal.jawaban_benar}">${soal.jawaban_benar}</td>
    <td class="text-center" style="vertical-align: middle;">${statusPembahasan}</td>
    <td class="text-center" style="vertical-align: middle;">
      <div class="flex-center gap-5">
        <button class="btn btn-secondary btn-sm" data-action="preview" data-id="${soal.id}" title="Preview">👁️</button>
        <button class="btn btn-primary btn-sm" style="background-color: #f59e0b; border:none;" data-action="edit" data-id="${soal.id}" title="Edit">✏️</button>
        <button class="btn btn-primary btn-sm text-danger" style="background-color: #fee2e2; border:none;" data-action="delete" data-id="${soal.id}" title="Hapus">🗑️</button>
      </div>
    </td>`;
}

/**
 * Membuat HTML untuk Opsi Pilihan Ganda (dipakai di Preview & Live Preview)
 */

export function createOpsiPreviewHTML(teksOpsi, isBenar, huruf) {
  // Menggunakan state classes dari CSS (opsi-benar)
  const classStatus = isBenar ? "opsi-benar" : "";
  return `
    <div class="option-label ${classStatus}" style="padding: 10px; cursor: default;">
      ${isBenar ? "✅" : "⚪"} 
      <span style="flex: 1;"><strong style="margin-right: 5px;">${huruf}.</strong> ${teksOpsi}</span>
    </div>`;
}

/**
 * Membuat kotak Clue & Pembahasan secara dinamis menggunakan class Info Box
 */
export function createInfoBoxHTML(judul, isi, ikon) {
  if (!isi) return "";

  // Penentuan class otomatis berdasarkan judul (Clue = Kuning, Bahas = Biru)
  let boxClass = "info-box mb-15";
  if (judul.includes("CLUE")) boxClass += " box-warning";
  else if (judul.includes("PEMBAHASAN")) boxClass += " box-primary";

  return `
    <div class="${boxClass}">
      <p class="info-box-title">${ikon} ${judul}:</p>
      <p class="text-sm" style="margin: 0; line-height: 1.6;">${isi}</p>
    </div>`;
}

/**
 * Membuat struktur lengkap Modal Preview (Statis)
 */
export function createPreviewSoalHTML(soal, opsiHTMLStr, badgePrasyaratHTML) {
  const clueBox = createInfoBoxHTML("PETUNJUK (CLUE)", soal.clue, "💡");
  const bahasBox = createInfoBoxHTML(
    "PEMBAHASAN",
    soal.pembahasan ||
      "<i class='text-danger'>Pembahasan belum tersedia untuk soal ini.</i>",
    "💡",
  );

  return `
    <div class="flex-wrap gap-10 mb-15">
      <span class="badge badge-info">${soal.materi_utama || "Materi Umum"} &raquo; ${soal.sub_materi || "Sub-Materi"}</span>
      ${badgePrasyaratHTML}
    </div>
    <div class="mb-20" style="font-size: 1.1rem; line-height: 1.6;">${soal.pertanyaan}</div>
    <div class="options-container mb-15">
      ${opsiHTMLStr}
    </div>
    ${clueBox}
    ${bahasBox}
  `;
}

/**
 * Membuat struktur lengkap Modal Live Preview (Dinamis saat Admin mengetik)
 */
export function createLivePreviewHTML(
  materi,
  sub,
  tanya,
  bahas,
  kesulitan,
  prasyarat,
  warnaKesulitan,
  teksKesulitan,
  cluePreview,
  opsiHTMLStr,
) {
  const prasyaratBadge = prasyarat
    ? `<span class="badge badge-prasyarat">Prasyarat: ${prasyarat.replace(/,(?=[^\s])/g, ", ")}</span>`
    : "";

  const clueBox = createInfoBoxHTML("PETUNJUK (CLUE)", cluePreview, "💡");
  const bahasBox = createInfoBoxHTML("PEMBAHASAN", bahas, "💡");

  return `
    <div class="flex-wrap gap-10 mb-15">
      <span class="badge badge-info">${materi} &raquo; ${sub}</span>
      <span class="badge text-white" style="background-color: ${warnaKesulitan};">Lvl ${kesulitan} (${teksKesulitan})</span>
      ${prasyaratBadge}
    </div>
    <div class="mb-20" style="font-size: 1.1rem; line-height: 1.6;">${tanya}</div>
    <div class="options-container mb-15">
      ${opsiHTMLStr}
    </div>
    ${clueBox}
    ${bahasBox}
  `;
}
