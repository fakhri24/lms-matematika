// public/js/views/riwayatSiswaView.js

/**
 * Membuat HTML untuk satu baris kartu riwayat di daftar utama.
 */
export function createHistoryCardHTML(
  data,
  tgl,
  teksDurasi,
  badgeDraf,
  warnaSkor,
  teksSkor,
) {
  return `
    <div class="flex-between">
      <div>
        <h4 class="text-main flex-center gap-5 mb-5" style="justify-content: flex-start;">
          ${data.sub_materi || "Latihan"} ${badgeDraf}
        </h4>
        <p class="text-muted text-sm" style="margin: 0;">${tgl} &bull; ${data.materi_utama || "Umum"} &bull; ${teksDurasi}</p>
      </div>
      <div class="font-bold text-right" style="font-size: 1.5rem; color: ${warnaSkor}; line-height: 1.1;">
        ${teksSkor}
      </div>
    </div>
  `;
}

/**
 * Membuat HTML untuk satu kotak review soal (pembahasan).
 */
export function createReviewSoalHTML(
  nomor,
  statusTeks,
  soalData,
  jawabanSiswa,
  isBenar,
) {
  let prasyaratHTML = "";
  if (soalData.konsep_prasyarat) {
    const prasyaratTeks = Array.isArray(soalData.konsep_prasyarat)
      ? soalData.konsep_prasyarat.join(", ")
      : soalData.konsep_prasyarat.replace(/,(?=[^\s])/g, ", ");
    prasyaratHTML = `<span class="badge badge-prasyarat">🔑 Prasyarat: <b>${prasyaratTeks}</b></span>`;
  }

  const clueHTML = soalData.clue
    ? `
    <div class="info-box box-warning mb-15">
      <p class="info-box-title">💡 PETUNJUK (CLUE):</p>
      <p class="text-sm" style="margin: 0;">${soalData.clue}</p>
    </div>`
    : "";

  return `
    <div class="soal-review">
      <div class="flex-between flex-wrap gap-10 mb-10" style="align-items: flex-start;">
        <h4 class="text-primary" style="margin: 0;">Soal ${nomor} ${statusTeks}</h4>
        ${prasyaratHTML}
      </div>
      <p class="mb-15" style="font-size: 1.05rem;">${soalData.pertanyaan}</p>
      
      <div class="text-sm mb-15" style="line-height: 1.8;">
        <p style="margin: 0;">Jawaban Kamu: <strong>${jawabanSiswa}</strong></p>
        ${!isBenar ? `<p style="margin: 0;">Kunci Jawaban: <strong class="text-success">${soalData.jawaban_benar}</strong></p>` : ""}
      </div>

      ${clueHTML}

      <div class="info-box box-primary">
        <p class="info-box-title">💡 PEMBAHASAN:</p>
        <p class="text-sm" style="margin: 0;">${soalData.pembahasan || "<i class='text-danger'>Pembahasan belum tersedia untuk soal ini.</i>"}</p>
      </div>
    </div>
  `;
}
