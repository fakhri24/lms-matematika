// public/js/views/koreksiUhSiswaView.js

/**
 * Renders a summary card for the student's daily test list.
 * @param {Object} data - Document data from Firestore
 * @param {number} index - Index of the document in the list
 */
export function createKoreksiCardHTML(data, index) {
  const metadata = data.metadata || {};
  const ringkasan = data.ringkasan_nilai || {};
  
  const topik = metadata.topik_ujian || "Ulangan Harian";
  const tanggal = metadata.tanggal_koreksi || "-";
  const kelas = metadata.kelas || "";
  
  const skorWajib = ringkasan.skor_wajib !== undefined ? ringkasan.skor_wajib : 0;
  const skorTambahan = ringkasan.skor_tambahan !== undefined ? ringkasan.skor_tambahan : 0;
  const predikat = ringkasan.predikat || "";
  
  const warnaSkor = ringkasan.persentase_kelulusan >= 75 ? "var(--success-color)" : "#ef4444";

  return `
    <div class="koreksi-card" data-index="${index}">
      <div class="flex-between flex-wrap gap-10">
        <div>
          <h4 class="text-primary font-bold mb-5">${topik}</h4>
          <p class="text-muted text-xs" style="margin: 0;">Tanggal Koreksi: ${tanggal} &bull; Kelas: ${kelas}</p>
        </div>
        <div class="text-right">
          <div class="font-bold text-xl" style="font-size: 1.4rem; color: ${warnaSkor};">
            ${skorWajib} + ${skorTambahan}
          </div>
          <span class="badge" style="background-color: ${warnaSkor}20; color: ${warnaSkor}; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">
            ${predikat}
          </span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renders the full details of a student's daily test correction.
 * @param {Object} data - Document data from Firestore
 */
export function createKoreksiDetailHTML(data) {
  const metadata = data.metadata || {};
  const ringkasan = data.ringkasan_nilai || {};
  const daftarSoal = data.daftar_soal || [];
  
  const topik = metadata.topik_ujian || "Ulangan Harian";
  const tanggal = metadata.tanggal_koreksi || "-";
  const nama = metadata.nama_siswa || "";
  const kelas = metadata.kelas || "";
  const mapel = metadata.mata_pelajaran || "Matematika";
  
  const skorWajib = ringkasan.skor_wajib !== undefined ? ringkasan.skor_wajib : 0;
  const skorTambahan = ringkasan.skor_tambahan !== undefined ? ringkasan.skor_tambahan : 0;
  const predikat = ringkasan.predikat || "";
  const warnaTema = ringkasan.persentase_kelulusan >= 75 ? "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)" : "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)";
  
  // PDF download button
  const pdfButtonHTML = data.pdf_url
    ? `
      <a href="${data.pdf_url}" target="_blank" class="btn btn-primary w-100 mb-20 flex-center gap-10" style="padding: 14px; text-decoration: none; border-radius: 10px; font-weight: bold; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border: none;">
        📄 Buka/Unduh Salinan Pekerjaan (PDF)
      </a>`
    : `
      <div class="info-box box-danger mb-20 text-center font-semibold text-sm">
        Salinan berkas PDF pekerjaan ulangan harian belum terunggah oleh guru.
      </div>`;

  // Render questions
  let soalHTML = "";
  daftarSoal.forEach((soal) => {
    // 1. Letak Kesalahan (Warning box)
    let letakKesalahanHTML = "";
    if (soal.letak_kesalahan && soal.letak_kesalahan.length > 0) {
      letakKesalahanHTML = `
        <div class="info-box box-danger" style="margin-top: 10px; padding: 10px 15px;">
          <p class="info-box-title" style="margin: 0 0 5px; color: #ef4444;">⚠️ LETAK KESALAHAN:</p>
          <ul style="margin: 0; padding-left: 18px; font-size: 0.85rem;">
            ${soal.letak_kesalahan.map((k) => `<li>${k}</li>`).join("")}
          </ul>
        </div>
      `;
    }

    // 2. Apresiasi & Catatan (Success/Warning box)
    let apresiasiHTML = "";
    if (soal.apresiasi_dan_catatan) {
      const isPerfectScore = soal.skor === soal.skor_maksimal;
      const boxClass = isPerfectScore ? "box-success" : "box-warning";
      const titleColor = isPerfectScore ? "#166534" : "#d97706";
      const icon = isPerfectScore ? "🌟" : "💡";

      apresiasiHTML = `
        <div class="info-box ${boxClass}" style="margin-top: 10px; padding: 10px 15px;">
          <p class="info-box-title" style="margin: 0 0 5px; color: ${titleColor};">${icon} CATATAN & APRESIASI:</p>
          <p class="text-sm" style="margin: 0;">${soal.apresiasi_dan_catatan}</p>
        </div>
      `;
    }

    const badgeWarna = soal.skor === soal.skor_maksimal ? "badge-success" : soal.skor > 0 ? "badge-warning" : "badge-danger";

    soalHTML += `
      <div class="soal-koreksi-card">
        <div class="flex-between flex-wrap gap-10 mb-10" style="align-items: flex-start;">
          <div>
            <span class="nomor-soal-header">Soal ${soal.nomor_soal}</span>
            <p class="text-xs text-muted" style="margin: 2px 0 0 0;">Topik: ${soal.topik_soal || "-"}</p>
          </div>
          <span class="badge ${badgeWarna}">
            Skor: <b>${soal.skor} / ${soal.skor_maksimal}</b>
          </span>
        </div>
        
        <div class="info-box box-primary" style="margin-top: 10px; padding: 12px 15px;">
          <p class="info-box-title" style="margin: 0 0 5px;">🔍 KOREKSI PENGERJAAN:</p>
          <p class="text-sm" style="margin: 0; line-height: 1.7;">${soal.koreksi_pengerjaan || "-"}</p>
        </div>

        ${letakKesalahanHTML}
        ${apresiasiHTML}
      </div>
    `;
  });

  return `
    <div class="motivasi-banner" style="background: ${warnaTema};">
      <div style="position: relative; z-index: 2;">
        <div class="flex-between flex-wrap gap-10 mb-15">
          <span class="badge" style="background: rgba(255, 255, 255, 0.2); color: white;">
            🏆 Evaluasi Ujian &bull; ${mapel}
          </span>
          <span class="text-sm font-semibold" style="opacity: 0.9;">
            Koreksi: ${tanggal}
          </span>
        </div>
        
        <h3 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 5px; line-height: 1.3;">
          ${topik}
        </h3>
        <p class="text-sm" style="opacity: 0.9; margin-bottom: 20px;">
          Nama: ${nama} (${kelas})
        </p>

        <div style="background: rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 15px; margin-bottom: 20px; border-left: 4px solid #fef3c7;">
          <p class="text-xs font-semibold" style="color: #fef3c7; margin: 0 0 5px 0; letter-spacing: 0.5px;">💬 CATATAN GURU:</p>
          <p class="text-sm" style="margin: 0; font-style: italic; line-height: 1.6;">
            "${data.catatan_motivasi_keseluruhan || "Terus semangat belajar dan pertahankan prestasimu!"}"
          </p>
        </div>

        <div class="flex-wrap gap-15" style="display: flex;">
          <div style="background: rgba(255, 255, 255, 0.15); padding: 8px 15px; border-radius: 6px; text-align: center;">
            <span class="text-xs" style="display: block; opacity: 0.8;">Skor Wajib</span>
            <span class="font-bold text-lg" style="font-size: 1.15rem;">${skorWajib} / 100</span>
          </div>
          <div style="background: rgba(255, 255, 255, 0.15); padding: 8px 15px; border-radius: 6px; text-align: center;">
            <span class="text-xs" style="display: block; opacity: 0.8;">Bonus Opsional</span>
            <span class="font-bold text-lg" style="font-size: 1.15rem;">+${skorTambahan}</span>
          </div>
          <div style="background: rgba(255, 255, 255, 0.15); padding: 8px 15px; border-radius: 6px; text-align: center;">
            <span class="text-xs" style="display: block; opacity: 0.8;">Predikat</span>
            <span class="font-bold text-lg" style="font-size: 1.15rem; color: #fef3c7;">${predikat}</span>
          </div>
        </div>
      </div>
      <!-- Decorative circle backgrounds -->
      <div style="position: absolute; right: -30px; top: -30px; width: 140px; height: 140px; background: rgba(255, 255, 255, 0.08); border-radius: 50%;"></div>
      <div style="position: absolute; right: 80px; bottom: -40px; width: 100px; height: 100px; background: rgba(255, 255, 255, 0.08); border-radius: 50%;"></div>
    </div>

    ${pdfButtonHTML}

    <h3 class="text-primary mb-15 mt-30" style="font-size: 1.25rem;">📝 Analisis Hasil Pemeriksaan Soal</h3>
    
    <div id="daftar-soal-koreksi">
      ${soalHTML}
    </div>
  `;
}
