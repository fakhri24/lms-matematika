// public/js/views/soalView.js

import { MODE_LATIHAN } from "../utils/constants.js";
import { getTautanEksternalFormatif } from "../utils/kurikulumData.js";

let _renderCount = 0;

export function renderKartuSoal(
  el,
  soal,
  dataMemori,
  modeLatihan,
  nomorTampil,
  totalSoal,
) {
  _renderCount++;
  const daftarPilihan = soal.opsi || soal.pilihan_jawaban || [];
  const isKunciPilihan =
    modeLatihan === MODE_LATIHAN.FORMATIF && dataMemori.status_selesai
      ? "disabled"
      : "";

  const levelKesulitan = parseInt(soal.tingkat_kesulitan) || 1;
  const bintangVisual = "⭐".repeat(levelKesulitan);

  el.wadahSoal.innerHTML = `
    <div class="question-card">
      <div class="flex-between mb-15">
          <h3 class="question-title" style="margin: 0;">Soal Nomor ${nomorTampil}</h3>
          <span class="badge badge-warning" style="letter-spacing: 2px;">
              ${bintangVisual}
          </span>
      </div>
      <p class="question-text">${soal.pertanyaan}</p>
      <hr class="divider">
      <div class="options-container" id="opsi-container-${soal.id_unik_sistem}">
        ${daftarPilihan
          .map((pilihan, index) => {
            const huruf = String.fromCharCode(65 + index);
            const isChecked =
              pilihan === dataMemori.jawaban_terakhir ? "checked" : "";
            let classTambahan = "";

            // Menentukan State Class dari CSS
            if (
              modeLatihan === MODE_LATIHAN.FORMATIF &&
              dataMemori.status_selesai
            ) {
              if (pilihan === soal.jawaban_benar) {
                classTambahan = "opsi-benar";
              } else if (pilihan === dataMemori.jawaban_terakhir) {
                classTambahan = "opsi-salah";
              } else {
                classTambahan = "opsi-disabled";
              }
            }

            return `
            <label class="option-label ${classTambahan}">
              <input type="radio" name="jawaban" value="${pilihan}" ${isChecked} ${isKunciPilihan}>
              <span style="flex: 1;"><strong style="margin-right: 8px;">${huruf}.</strong> ${pilihan}</span>
            </label>`;
          })
          .join("")}
      </div>
    </div>`;

  el.teksHalaman.innerText =
    modeLatihan === MODE_LATIHAN.FORMATIF
      ? `Soal ke-${nomorTampil}`
      : `${nomorTampil} / ${totalSoal}`;

  if (el.areaTautanEksternal) {
    const tautanEksternal =
      modeLatihan === MODE_LATIHAN.FORMATIF
        ? getTautanEksternalFormatif(soal.sub_materi)
        : null;

    if (tautanEksternal) {
      el.areaTautanEksternal.innerHTML = `
        <div class="flex-center flex-wrap gap-10">
          <a href="${tautanEksternal.materi}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">📖 Pelajari Materi</a>
          <a href="${tautanEksternal.drilling}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">🎯 Latihan Drilling Khusus</a>
        </div>`;
      el.areaTautanEksternal.style.display = "block";
    } else {
      el.areaTautanEksternal.style.display = "none";
    }
  }
}

export function renderElemenFormatif(el, soal, dataMemori, isTerakhir) {
  // Reset base class untuk kotak pesan feedback
  el.pesanFeedback.className = "text-center font-bold mb-15";

  if (!dataMemori.status_selesai) {
    el.btnCekJawaban.style.display = "inline-block";
    el.btnLanjutFormatif.style.display = "none";
    el.wadahFeedback.style.display = "block";
    if (dataMemori.pesan_aktif) {
      el.pesanFeedback.style.display = "block";
      el.pesanFeedback.innerHTML = dataMemori.pesan_aktif;

      const renderAtCall = _renderCount;
      setTimeout(() => {
        if (_renderCount === renderAtCall)
          el.pesanFeedback.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
      }, 50);
    } else {
      el.pesanFeedback.style.display = "none";
    }

    if (dataMemori.percobaan === 0) {
      el.btnCekJawaban.innerText = "Cek Jawaban";
      el.btnLihatBahas.style.display = "none";
    } else if (dataMemori.percobaan === 1) {
      el.btnCekJawaban.innerText = "Coba Lagi";
      el.pesanFeedback.className += " box-danger"; // State Salah
      el.areaClue.style.display = "block";

      let teksBantuan = soal.clue;
      if (!teksBantuan && soal.konsep_prasyarat) {
        const prasyaratStr = Array.isArray(soal.konsep_prasyarat)
          ? soal.konsep_prasyarat.join(", ")
          : soal.konsep_prasyarat;
        teksBantuan = `Coba ingat-ingat lagi konsep tentang **${prasyaratStr}** untuk memecahkan soal ini.`;
      } else if (!teksBantuan) {
        teksBantuan = `Ayo perhatikan lagi pertanyaannya dengan teliti.`;
      }
      el.teksClue.innerHTML = teksBantuan;
      el.btnLihatBahas.style.display = "none";
    } else {
      el.btnCekJawaban.innerText = "Coba Lagi";
      el.pesanFeedback.className += " box-danger"; // State Salah
      el.areaClue.style.display = "block";
      el.btnLihatBahas.style.display = "inline-block";
    }

    if (dataMemori.lihat_bahas) {
      el.areaPembahasan.style.display = "block";
      el.teksPembahasan.innerHTML =
        soal.pembahasan ||
        "<i class='text-danger'>Pembahasan belum tersedia.</i>";
      el.btnLihatBahas.style.display = "none";
      el.pesanFeedback.className =
        "text-center font-bold mb-15 " +
        (dataMemori.percobaan >= 3 ? "box-warning" : "box-primary");
    }
  } else {
    // State Selesai (Benar)
    el.btnCekJawaban.style.display = "none";
    el.btnLihatBahas.style.display = "none";
    el.wadahFeedback.style.display = "block";
    el.pesanFeedback.style.display = "block";
    el.pesanFeedback.innerText = dataMemori.pesan_aktif;
    el.pesanFeedback.className += " box-success"; // State Benar

    const renderAtCall = _renderCount;
    setTimeout(() => {
      if (_renderCount === renderAtCall)
        el.pesanFeedback.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
    }, 50);

    if (dataMemori.lihat_clue) el.areaClue.style.display = "block";
    if (dataMemori.lihat_bahas) {
      el.areaPembahasan.style.display = "block";
      el.teksPembahasan.innerHTML =
        soal.pembahasan ||
        "<i class='text-danger'>Pembahasan belum tersedia.</i>";
    }

    if (!isTerakhir) {
      el.btnLanjutFormatif.style.display = "inline-block";
    } else {
      el.btnSelesai.style.display = "inline-block";
    }
  }
}

export function createFormatifTuntasHTML(
  namaAktif,
  subMateriPilihan,
  nilaiTuntasTerakhir,
  levelTertinggiDicapai,
) {
  const bintangTertinggi = "⭐".repeat(levelTertinggiDicapai || 1);
  return `
    <div class="text-center" style="padding: 40px 20px; background: white; border-radius: 12px; border: 1px solid var(--border-color);">
      <span style="font-size: 4rem;">🎉</span>
      <h2 class="text-primary mt-15 mb-10">Tuntas, ${namaAktif}!</h2>
      <p class="text-muted mb-10">Kamu berhasil menjawab benar 3x berturut-turut di level tersulit wilayah <strong>${subMateriPilihan}</strong>.</p>
      <p class="text-muted mb-25">Skor akurasi: <strong>${nilaiTuntasTerakhir ?? 0}%</strong> &middot; Level tertinggi dicapai: <strong>${bintangTertinggi}</strong></p>
      <div class="flex-center gap-10" style="flex-wrap: wrap;">
        <button id="btn-lanjut-sumatif" class="btn btn-success btn-sm" style="padding: 10px 20px;">🎯 Uji Kompetensi (Sumatif)</button>
        <button id="btn-reset-progres" class="btn btn-primary btn-sm" style="padding: 10px 20px;">Latihan Lagi dari Awal</button>
        <button id="btn-kembali-tamat" class="btn btn-secondary btn-sm" style="padding: 10px 20px;">Kembali ke Dasbor</button>
      </div>
    </div>
  `;
}
