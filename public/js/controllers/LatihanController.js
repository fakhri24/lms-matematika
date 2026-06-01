import {
  feedbackSalahSatu,
  feedbackSalahDua,
  feedbackSalahTiga,
  feedbackPilihBahas,
  feedbackBenarSempurna,
  feedbackBenarBahas,
  getPesanAcak,
} from "../utils/feedbackDictionary.js";
import { cekMasteryDanGelar } from "../services/gelarService.js";
import {
  mulaiAtauLanjutStopwatch,
  dapatkanDanResetDurasiTerakhir,
  dapatkanTotalWaktuSekarang,
} from "../utils/timerSensor.js";
import { siapkanDraftSoal } from "../utils/soalEngine.js";
import {
  getBankSoalBySubMateri,
  getProgresFormatif,
  getDrafFormatif,
  simpanProgresSatuSoal,
  resetProgresFormatif,
  simpanDrafFormatifDB,
  simpanHasilAkhirDB,
  hapusDrafFormatifDB,
  cekTop3Tercepat,
} from "../services/latihanService.js";
import {
  renderKartuSoal,
  renderElemenFormatif,
  createWilayahTertaklukkanHTML,
} from "../views/soalView.js";
import {
  MODE_LATIHAN,
  STATUS_LATIHAN,
  DATA_DEFAULT,
  LEVEL_SOAL,
} from "../utils/constants.js";

export class LatihanController {
  constructor() {
    this.state = {
      kumpulanSoal: [],
      indeksSaatIni: 0,
      offsetNomorSoal: 0,
      totalSoalKeseluruhan: 0,
      riwayatProgresGlobal: {},
      durasiSebelumnya: 0,
      memoriJawaban: {},
      urutanSoalGlobal: [],
      logPercobaanSebelumnya: {},
      intervalTimer: null,
      intervalAutosave: null,
      isSelesai: false,

      modeLatihan: localStorage.getItem("mode_latihan") || MODE_LATIHAN.NORMAL,
      subMateriPilihan:
        localStorage.getItem("mode_latihan") === MODE_LATIHAN.SPESIAL
          ? JSON.parse(localStorage.getItem("sub_materi_spesial") || "[]")
          : localStorage.getItem("sub_materi_aktif") || DATA_DEFAULT.SUB_MATERI,
      materiUtama:
        localStorage.getItem("materi_utama_aktif") || DATA_DEFAULT.MATERI,
      nisAktif: localStorage.getItem("nis_siswa"),
      namaAktif: localStorage.getItem("nama_siswa") || DATA_DEFAULT.NAMA,

      // Khusus Latihan Spesial
      idLatihanSpesial: localStorage.getItem("id_latihan_spesial"),
      judulLatihanSpesial: localStorage.getItem("judul_latihan_spesial"),
      durasiLatihanSpesial: parseInt(
        localStorage.getItem("durasi_latihan_spesial") || "0",
      ),
    };

    this.el = {
      wadahSoal: document.getElementById("wadah-soal"),
      statusKoneksi: document.getElementById("status-koneksi"),
      areaNavigasi: document.getElementById("navigasi-soal"),
      btnSkip: document.getElementById("btn-skip"),
      btnSimpan: document.getElementById("btn-simpan"),
      btnSebelumnya: document.getElementById("btn-sebelumnya"),
      btnSelanjutnya: document.getElementById("btn-selanjutnya"),
      btnSelesai: document.getElementById("btn-selesai"),
      teksHalaman: document.getElementById("teks-halaman"),
      elemenTimer: document.getElementById("tampilan-timer"),
      btnKembaliDasbor: document.getElementById("btn-kembali-dasbor"),
      wadahFeedback: document.getElementById("wadah-feedback-formatif"),
      pesanFeedback: document.getElementById("pesan-feedback"),
      areaClue: document.getElementById("area-clue"),
      teksClue: document.getElementById("teks-clue"),
      areaPembahasan: document.getElementById("area-pembahasan"),
      teksPembahasan: document.getElementById("teks-pembahasan"),
      btnCekJawaban: document.getElementById("btn-cek-jawaban"),
      btnLihatBahas: document.getElementById("btn-lihat-bahas"),
      btnLanjutFormatif: document.getElementById("btn-lanjut-formatif"),
    };

    this.dashboardUrl = "dashboard-siswa.html";
  }

  async init() {
    this.bindGlobalEvents();
    await this.mulaiAplikasi();
  }

  bindGlobalEvents() {
    document
      .getElementById("btn-kembali-modal-hasil")
      ?.addEventListener("click", () => {
        window.location.href = this.dashboardUrl;
      });

    this.el.btnCekJawaban?.addEventListener("click", () =>
      this.handleCekJawaban(),
    );
    this.el.btnLihatBahas?.addEventListener("click", () =>
      this.handleLihatBahas(),
    );
    this.el.btnLanjutFormatif?.addEventListener("click", () =>
      this.handleNavigasi(1),
    );
    this.el.btnSkip?.addEventListener("click", () => this.handleNavigasi(1));

    this.el.btnSimpan?.addEventListener("click", () => {
      if (!document.querySelector('input[name="jawaban"]:checked'))
        return alert("Pilih jawaban dulu!");
      this.amankanJawabanLayar();
      this.handleNavigasi(1);
    });

    this.el.btnSebelumnya?.addEventListener("click", () => {
      this.amankanJawabanLayar();
      this.handleNavigasi(-1);
    });

    this.el.btnSelanjutnya?.addEventListener("click", () => {
      this.amankanJawabanLayar();
      this.handleNavigasi(1);
    });

    this.el.btnSelesai?.addEventListener("click", () => this.handleSelesai());

    window.addEventListener("beforeunload", (e) => {
      if (
        this.state.modeLatihan === MODE_LATIHAN.FORMATIF &&
        this.state.kumpulanSoal.length > 0 &&
        !this.state.isSelesai
      ) {
        this.sinkronRiwayatFormatifSementara();
      }
    });
  }

  renderSoal() {
    const soal = this.state.kumpulanSoal[this.state.indeksSaatIni];
    if (this.el.btnCekJawaban) this.el.btnCekJawaban.disabled = false;
    this.inisialisasiMemoriSoal(soal.id_unik_sistem);

    const dataMemori = this.state.memoriJawaban[soal.id_unik_sistem];
    const nomorTampil =
      this.state.offsetNomorSoal + this.state.indeksSaatIni + 1;

    renderKartuSoal(
      this.el,
      soal,
      dataMemori,
      this.state.modeLatihan,
      nomorTampil,
      this.state.totalSoalKeseluruhan,
    );

    if (this.el.btnSelesai) this.el.btnSelesai.style.display = "none";
    if (this.el.wadahFeedback) this.el.wadahFeedback.style.display = "none";
    if (this.el.areaClue) this.el.areaClue.style.display = "none";
    if (this.el.areaPembahasan) this.el.areaPembahasan.style.display = "none";

    const isTerakhir =
      this.state.indeksSaatIni === this.state.kumpulanSoal.length - 1;

    if (this.state.modeLatihan === MODE_LATIHAN.FORMATIF) {
      [
        this.el.btnSkip,
        this.el.btnSimpan,
        this.el.btnSebelumnya,
        this.el.btnSelanjutnya,
      ].forEach((b) => {
        if (b) b.style.display = "none";
      });
      renderElemenFormatif(this.el, soal, dataMemori, isTerakhir);
    } else {
      if (this.el.btnCekJawaban) this.el.btnCekJawaban.style.display = "none";
      if (this.el.btnLihatBahas) this.el.btnLihatBahas.style.display = "none";
      if (this.el.btnLanjutFormatif)
        this.el.btnLanjutFormatif.style.display = "none";

      if (this.state.modeLatihan === MODE_LATIHAN.NORMAL) {
        if (this.el.btnSebelumnya)
          this.el.btnSebelumnya.style.display =
            this.state.indeksSaatIni === 0 ? "none" : "inline-block";
        if (this.el.btnSelanjutnya)
          this.el.btnSelanjutnya.style.display = isTerakhir
            ? "none"
            : "inline-block";
        if (isTerakhir && this.el.btnSelesai)
          this.el.btnSelesai.style.display = "inline-block";
      } else {
        if (isTerakhir) {
          if (this.el.btnSkip) this.el.btnSkip.style.display = "none";
          if (this.el.btnSimpan) this.el.btnSimpan.style.display = "none";
          if (this.el.btnSelesai)
            this.el.btnSelesai.style.display = "inline-block";
        } else {
          if (this.el.btnSkip) this.el.btnSkip.style.display = "inline-block";
          if (this.el.btnSimpan)
            this.el.btnSimpan.style.display = "inline-block";
        }
      }
    }

    // Reset scroll ke atas setelah semua konten selesai dirender
    const wrapper = document.getElementById("soal-card-wrapper");
    if (wrapper)
      setTimeout(() => {
        wrapper.scrollTop = 0;
      }, 0);

    this.renderMathJax();
    mulaiAtauLanjutStopwatch();
  }

  renderMathJax() {
    if (window.MathJax && typeof window.MathJax.typesetPromise === "function") {
      MathJax.typesetPromise([this.el.wadahSoal, this.el.wadahFeedback]).catch(
        (err) => console.error(err),
      );
    } else {
      setTimeout(() => {
        if (
          window.MathJax &&
          typeof window.MathJax.typesetPromise === "function"
        )
          MathJax.typesetPromise([
            this.el.wadahSoal,
            this.el.wadahFeedback,
          ]).catch((err) => console.error(err));
      }, 500);
    }
  }

  perbaruiTampilanTimer() {
    let selisihDetik = dapatkanTotalWaktuSekarang();

    if (
      this.state.modeLatihan === MODE_LATIHAN.FORMATIF &&
      this.state.kumpulanSoal.length > 0
    ) {
      const idSoalAktif =
        this.state.kumpulanSoal[this.state.indeksSaatIni].id_unik_sistem;
      const waktuLamaSoalIni =
        this.state.memoriJawaban[idSoalAktif]?.durasi_detik || 0;
      selisihDetik += waktuLamaSoalIni;
    }

    if (this.state.modeLatihan === MODE_LATIHAN.SPESIAL) {
      const waktuBerjalan = Math.floor(
        (Date.now() - (this.state.waktuMulaiLatihanSpesial || Date.now())) /
          1000,
      );
      const batasDetik = this.state.durasiLatihanSpesial * 60;
      const sisaDetik = Math.max(0, batasDetik - waktuBerjalan);

      const menit = Math.floor(sisaDetik / 60)
        .toString()
        .padStart(2, "0");
      const detik = (sisaDetik % 60).toString().padStart(2, "0");

      if (this.el.elemenTimer) {
        if (sisaDetik <= 300) {
          // 5 menit terakhir
          this.el.elemenTimer.style.color = "#ef4444";
          this.el.elemenTimer.style.borderColor = "#ef4444";
        }

        this.el.elemenTimer.innerText = `⏳ ${menit}:${detik}`;
      }

      if (sisaDetik <= 0 && !this.state.isSelesai) {
        alert("Waktu Habis! Jawabanmu akan disubmit otomatis.");
        this.handleSelesai();
      }
    } else {
      const menit = Math.floor(selisihDetik / 60)
        .toString()
        .padStart(2, "0");
      const detik = (selisihDetik % 60).toString().padStart(2, "0");
      if (this.el.elemenTimer)
        this.el.elemenTimer.innerText = `⏱️ ${menit}:${detik}`;
    }
  }

  inisialisasiMemoriSoal(idSoal) {
    if (!this.state.memoriJawaban[idSoal]) {
      this.state.memoriJawaban[idSoal] = {
        percobaan: 0,
        jawaban_terakhir: null,
        status_selesai: false,
        skor_soal: 0,
        lihat_clue: false,
        lihat_bahas: false,
        pesan_aktif: "",
      };
    }
  }

  simpanDurasiKeSoal(idSoal) {
    const durasiTambahan = dapatkanDanResetDurasiTerakhir();
    if (!this.state.memoriJawaban[idSoal]) this.inisialisasiMemoriSoal(idSoal);
    if (!this.state.memoriJawaban[idSoal].durasi_detik)
      this.state.memoriJawaban[idSoal].durasi_detik = 0;
    this.state.memoriJawaban[idSoal].durasi_detik += durasiTambahan;
    if (this.state.memoriJawaban[idSoal].durasi_detik > 900)
      this.state.memoriJawaban[idSoal].durasi_detik = 900;
  }

  amankanJawabanLayar() {
    const radioTerpilih = document.querySelector(
      'input[name="jawaban"]:checked',
    );
    if (radioTerpilih) {
      const idSoalAktif =
        this.state.kumpulanSoal[this.state.indeksSaatIni].id_unik_sistem;
      this.inisialisasiMemoriSoal(idSoalAktif);
      this.state.memoriJawaban[idSoalAktif].jawaban_terakhir =
        radioTerpilih.value;
    }
  }

  async sinkronRiwayatFormatifSementara() {
    this.amankanJawabanLayar();
    this.simpanDurasiKeSoal(
      this.state.kumpulanSoal[this.state.indeksSaatIni].id_unik_sistem,
    );

    let tambahanWaktuSesiIni = 0;
    for (const idSoal in this.state.memoriJawaban) {
      if (this.state.memoriJawaban[idSoal].durasi_detik) {
        tambahanWaktuSesiIni += this.state.memoriJawaban[idSoal].durasi_detik;
      }
    }

    const durasiTotalKumulatif =
      this.state.durasiSebelumnya + tambahanWaktuSesiIni;
    let totalPoinSementara = 0;
    let detailJawabanGabungan = {};
    let jumlahSelesai = 0;

    for (const id in this.state.riwayatProgresGlobal) {
      totalPoinSementara += this.state.riwayatProgresGlobal[id].skor;
      detailJawabanGabungan[id] = this.state.riwayatProgresGlobal[id].jawaban;
      jumlahSelesai++;
    }

    for (const idSoal in this.state.memoriJawaban) {
      if (this.state.memoriJawaban[idSoal].status_selesai) {
        totalPoinSementara += this.state.memoriJawaban[idSoal].skor_soal;
        detailJawabanGabungan[idSoal] =
          this.state.memoriJawaban[idSoal].jawaban_terakhir;
        if (!this.state.riwayatProgresGlobal[idSoal]) jumlahSelesai++;
      }
    }

    const skorSementara =
      this.state.totalSoalKeseluruhan === 0
        ? 0
        : Math.round(totalPoinSementara / this.state.totalSoalKeseluruhan);

    const isLengkap =
      this.state.totalSoalKeseluruhan > 0 &&
      jumlahSelesai === this.state.totalSoalKeseluruhan;

    const dataHasil = {
      nis_siswa: this.state.nisAktif,
      nama_siswa: this.state.namaAktif,
      materi_utama: this.state.materiUtama,
      sub_materi: this.state.subMateriPilihan,
      nilai: skorSementara,
      durasi_detik: durasiTotalKumulatif,
      waktu_submit: new Date().toISOString(),
      detail_jawaban: detailJawabanGabungan,
      log_percobaan: {
        ...this.state.logPercobaanSebelumnya,
        ...this.state.memoriJawaban,
      },
      urutan_soal: this.state.urutanSoalGlobal,
      mode_latihan: MODE_LATIHAN.FORMATIF,
      keterangan: `Progres: ${jumlahSelesai} dari ${this.state.totalSoalKeseluruhan} Soal`,
      status: isLengkap ? STATUS_LATIHAN.SELESAI : STATUS_LATIHAN.DRAF,
    };

    const docIdKustom = `${this.state.nisAktif}_${this.state.subMateriPilihan.replace(/\s+/g, "")}_formatif_draft`;
    await simpanDrafFormatifDB(docIdKustom, dataHasil);
  }

  handleCekJawaban() {
    if (!this.el.btnCekJawaban || this.el.btnCekJawaban.disabled) return;
    this.el.btnCekJawaban.disabled = true;

    const radioTerpilih = document.querySelector(
      'input[name="jawaban"]:checked',
    );
    if (!radioTerpilih) {
      this.el.btnCekJawaban.disabled = false;
      return alert("Pilih jawaban dulu!");
    }

    const soal = this.state.kumpulanSoal[this.state.indeksSaatIni];
    const dataMemori = this.state.memoriJawaban[soal.id_unik_sistem];
    const jawabanUser = radioTerpilih.value;

    dataMemori.percobaan += 1;
    dataMemori.jawaban_terakhir = jawabanUser;

    if (jawabanUser === soal.jawaban_benar) {
      dataMemori.status_selesai = true;
      if (dataMemori.lihat_bahas) {
        dataMemori.skor_soal = 30;
        dataMemori.pesan_aktif = getPesanAcak(feedbackBenarBahas);
      } else if (dataMemori.lihat_clue || dataMemori.percobaan > 1) {
        dataMemori.skor_soal = 70;
        dataMemori.pesan_aktif = getPesanAcak(feedbackBenarSempurna);
      } else {
        dataMemori.skor_soal = 100;
        dataMemori.pesan_aktif = getPesanAcak(feedbackBenarSempurna);
      }

      if (this.state.modeLatihan === MODE_LATIHAN.FORMATIF) {
        simpanProgresSatuSoal(
          this.state.nisAktif,
          this.state.subMateriPilihan,
          soal.id_unik_sistem,
          dataMemori.skor_soal,
          jawabanUser,
        );
      }
    } else {
      if (dataMemori.percobaan >= 3) {
        dataMemori.lihat_bahas = true;
        dataMemori.pesan_aktif = getPesanAcak(feedbackSalahTiga);
      } else {
        const containerOpsi = document.getElementById(
          `opsi-container-${soal.id_unik_sistem}`,
        );
        if (containerOpsi) {
          containerOpsi.style.transform = "translateX(-5px)";
          setTimeout(
            () => (containerOpsi.style.transform = "translateX(5px)"),
            100,
          );
          setTimeout(
            () => (containerOpsi.style.transform = "translateX(0)"),
            200,
          );
        }
        dataMemori.pesan_aktif =
          dataMemori.percobaan === 2
            ? getPesanAcak(feedbackSalahDua)
            : getPesanAcak(feedbackSalahSatu);
        if (dataMemori.percobaan === 1) dataMemori.lihat_clue = true;
      }
    }
    this.simpanDurasiKeSoal(soal.id_unik_sistem);
    this.renderSoal();
  }

  handleLihatBahas() {
    const soal = this.state.kumpulanSoal[this.state.indeksSaatIni];
    const dataMemori = this.state.memoriJawaban[soal.id_unik_sistem];
    dataMemori.lihat_bahas = true;
    dataMemori.pesan_aktif = getPesanAcak(feedbackPilihBahas);
    this.simpanDurasiKeSoal(soal.id_unik_sistem);
    this.renderSoal();
  }

  handleNavigasi(arah) {
    this.simpanDurasiKeSoal(
      this.state.kumpulanSoal[this.state.indeksSaatIni].id_unik_sistem,
    );
    this.state.indeksSaatIni += arah;
    this.renderSoal();
  }

  async handleSelesai() {
    this.state.isSelesai = true;
    this.simpanDurasiKeSoal(
      this.state.kumpulanSoal[this.state.indeksSaatIni].id_unik_sistem,
    );

    if (this.state.modeLatihan !== MODE_LATIHAN.FORMATIF) {
      this.amankanJawabanLayar();
      if (this.state.indeksSaatIni < this.state.kumpulanSoal.length - 1) {
        if (
          !confirm(
            "Kamu belum melihat semua soal. Yakin ingin mengakhiri ujian?",
          )
        )
          return;
      }
    }

    clearInterval(this.state.intervalTimer);
    if (this.state.intervalAutosave) clearInterval(this.state.intervalAutosave);

    let durasiTotalKumulatif = 0;
    if (
      this.state.modeLatihan === MODE_LATIHAN.SPESIAL &&
      this.state.waktuMulaiLatihanSpesial
    ) {
      durasiTotalKumulatif = Math.floor(
        (Date.now() - this.state.waktuMulaiLatihanSpesial) / 1000,
      );
    } else {
      durasiTotalKumulatif =
        this.state.modeLatihan === MODE_LATIHAN.FORMATIF
          ? this.state.durasiSebelumnya
          : 0;
      for (const idSoal in this.state.memoriJawaban) {
        if (this.state.memoriJawaban[idSoal].durasi_detik) {
          durasiTotalKumulatif += this.state.memoriJawaban[idSoal].durasi_detik;
        }
      }
    }

    if (this.el.btnSelesai) {
      this.el.btnSelesai.innerText = "Mengirim...";
      this.el.btnSelesai.disabled = true;
    }

    let nilaiAkhir = 0;
    let jumlahBenar = 0;
    const formatDetailJawabanDB = {};

    if (this.state.modeLatihan === MODE_LATIHAN.FORMATIF) {
      let totalPoinFormatif = 0;
      for (const id in this.state.riwayatProgresGlobal) {
        totalPoinFormatif += this.state.riwayatProgresGlobal[id].skor;
        formatDetailJawabanDB[id] = this.state.riwayatProgresGlobal[id].jawaban;
        jumlahBenar++;
      }
      for (const idSoal in this.state.memoriJawaban) {
        if (this.state.memoriJawaban[idSoal].status_selesai) {
          totalPoinFormatif += this.state.memoriJawaban[idSoal].skor_soal;
          formatDetailJawabanDB[idSoal] =
            this.state.memoriJawaban[idSoal].jawaban_terakhir;
          jumlahBenar++;
        }
      }
      nilaiAkhir =
        this.state.totalSoalKeseluruhan === 0
          ? 0
          : Math.round(totalPoinFormatif / this.state.totalSoalKeseluruhan);
    } else {
      this.state.kumpulanSoal.forEach((soal) => {
        const memori = this.state.memoriJawaban[soal.id_unik_sistem];
        if (memori && memori.jawaban_terakhir) {
          formatDetailJawabanDB[soal.id_unik_sistem] = memori.jawaban_terakhir;
          if (memori.jawaban_terakhir === soal.jawaban_benar) jumlahBenar++;
        }
      });
      nilaiAkhir =
        Object.keys(this.state.memoriJawaban).length === 0
          ? 0
          : Math.round((jumlahBenar / this.state.kumpulanSoal.length) * 100);
    }

    const dataHasil = {
      nis_siswa: this.state.nisAktif,
      nama_siswa: this.state.namaAktif,
      nilai: nilaiAkhir,
      detail_jawaban: formatDetailJawabanDB,
      log_percobaan:
        this.state.modeLatihan === MODE_LATIHAN.FORMATIF
          ? {
              ...this.state.logPercobaanSebelumnya,
              ...this.state.memoriJawaban,
            }
          : this.state.memoriJawaban,
      urutan_soal:
        this.state.modeLatihan === MODE_LATIHAN.FORMATIF
          ? this.state.urutanSoalGlobal
          : this.state.kumpulanSoal.map((s) => s.id_unik_sistem),
      durasi_detik: durasiTotalKumulatif,
      waktu_submit: new Date().toISOString(),
      materi_utama: this.state.materiUtama,
      sub_materi: this.state.subMateriPilihan,
      mode_latihan: this.state.modeLatihan,
      status: STATUS_LATIHAN.SELESAI,
    };

    if (this.state.modeLatihan === MODE_LATIHAN.SPESIAL) {
      dataHasil.id_latihan_spesial = this.state.idLatihanSpesial;
    }

    try {
      await simpanHasilAkhirDB(dataHasil);

      if (this.state.modeLatihan === MODE_LATIHAN.FORMATIF) {
        const docIdKustom = `${this.state.nisAktif}_${dataHasil.sub_materi.replace(/\s+/g, "")}_formatif_draft`;
        await hapusDrafFormatifDB(docIdKustom);
      }

      const gelarDidapat = await cekMasteryDanGelar(
        this.state.nisAktif,
        dataHasil.sub_materi,
        nilaiAkhir,
        this.state.modeLatihan,
      );

      document.getElementById("skor-akhir").innerText = nilaiAkhir;
      const teksDurasi =
        Math.floor(durasiTotalKumulatif / 60) > 0
          ? `${Math.floor(durasiTotalKumulatif / 60)} menit ${durasiTotalKumulatif % 60} detik`
          : `${durasiTotalKumulatif} detik`;

      document.getElementById("detail-hasil").innerText =
        this.state.modeLatihan === MODE_LATIHAN.FORMATIF
          ? `Latihan Selesai, ${this.state.namaAktif}! Kamu menaklukkan ${jumlahBenar} soal dalam ${teksDurasi} dengan skor ${nilaiAkhir}.`
          : `Luar biasa, ${this.state.namaAktif}! Kamu menjawab benar ${jumlahBenar} dari ${this.state.totalSoalKeseluruhan} soal dalam ${teksDurasi}.`;

      const teksApresiasi = document.getElementById("teks-apresiasi");
      if (gelarDidapat) {
        teksApresiasi.innerHTML = `Luar Biasa!<br><span style="display:inline-block; margin-top:10px; font-size:1rem; color:#d97706; background:#fef3c7; padding:6px 15px; border-radius:20px; border:2px solid #fbbf24; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.2);">👑 Gelar Baru Terbuka: ${gelarDidapat}</span>`;
      } else {
        teksApresiasi.innerText =
          nilaiAkhir >= 80
            ? "Luar Biasa!"
            : nilaiAkhir >= 60
              ? "Bagus!"
              : "Ayo Belajar Lagi!";
      }

      document.getElementById("modal-hasil").style.display = "flex";

      // Cek Top 3 khusus Aturan Kuadran Mode Sumatif Normal
      if (
        this.state.modeLatihan === MODE_LATIHAN.NORMAL &&
        this.state.subMateriPilihan === "Aturan Kuadran" &&
        nilaiAkhir >= 80
      ) {
        const isTop3 = await cekTop3Tercepat(
          "Aturan Kuadran",
          this.state.nisAktif,
        );
        if (isTop3) {
          setTimeout(() => {
            alert(
              `🎉 SELAMAT! Waktu pengerjaanmu (${teksDurasi}) masuk dalam 3 Besar Tercepat untuk Aturan Kuadran!`,
            );
          }, 500);
        }
      }
    } catch (error) {
      alert("Koneksi gagal. Klik Selesai lagi.");
      if (this.el.btnSelesai) {
        this.el.btnSelesai.innerText = "Selesai Kerjakan";
        this.el.btnSelesai.disabled = false;
      }
    }
  }

  async mulaiAplikasi() {
    if (this.el.statusKoneksi)
      this.el.statusKoneksi.innerText = "Mengambil data petualangan...";

    try {
      let daftarSoalSelesai = [];

      if (this.state.modeLatihan === MODE_LATIHAN.FORMATIF) {
        this.state.riwayatProgresGlobal = await getProgresFormatif(
          this.state.nisAktif,
          this.state.subMateriPilihan,
        );
        daftarSoalSelesai = Object.keys(this.state.riwayatProgresGlobal);

        const draftData = await getDrafFormatif(
          this.state.nisAktif,
          this.state.subMateriPilihan,
        );
        if (draftData) {
          this.state.durasiSebelumnya = draftData.durasi_detik || 0;
          this.state.logPercobaanSebelumnya = draftData.log_percobaan || {};

          for (const idSoal in this.state.logPercobaanSebelumnya) {
            if (!daftarSoalSelesai.includes(idSoal)) {
              this.state.memoriJawaban[idSoal] = {
                ...this.state.logPercobaanSebelumnya[idSoal],
              };
            }
          }
        }
      }

      this.state.offsetNomorSoal =
        this.state.modeLatihan === MODE_LATIHAN.FORMATIF
          ? daftarSoalSelesai.length
          : 0;

      let semuaSoalUtuh = [];
      if (
        this.state.modeLatihan === MODE_LATIHAN.SPESIAL &&
        Array.isArray(this.state.subMateriPilihan)
      ) {
        for (const sub of this.state.subMateriPilihan) {
          const soalSub = await getBankSoalBySubMateri(sub);
          semuaSoalUtuh = semuaSoalUtuh.concat(soalSub);
        }
      } else {
        semuaSoalUtuh = await getBankSoalBySubMateri(
          this.state.subMateriPilihan,
        );
      }

      let semuaSoalValid = semuaSoalUtuh;
      if (this.state.modeLatihan === MODE_LATIHAN.FORMATIF) {
        semuaSoalUtuh.sort(
          (a, b) =>
            (parseInt(a.tingkat_kesulitan) || LEVEL_SOAL.MUDAH) -
            (parseInt(b.tingkat_kesulitan) || LEVEL_SOAL.MUDAH),
        );
        this.state.urutanSoalGlobal = semuaSoalUtuh.map(
          (s) => s.id_unik_sistem,
        );
        semuaSoalValid = semuaSoalUtuh.filter(
          (s) => !daftarSoalSelesai.includes(s.id_unik_sistem),
        );
      }

      this.state.kumpulanSoal = siapkanDraftSoal(
        semuaSoalValid,
        this.state.modeLatihan,
      );
      this.state.totalSoalKeseluruhan =
        this.state.modeLatihan === MODE_LATIHAN.FORMATIF
          ? semuaSoalUtuh.length
          : this.state.kumpulanSoal.length;

      if (this.state.kumpulanSoal.length > 0) {
        let textMode = "Mode Normal";
        let textSub = this.state.subMateriPilihan;

        if (this.state.modeLatihan === MODE_LATIHAN.ACAK)
          textMode = "Mode Tantangan";
        else if (this.state.modeLatihan === MODE_LATIHAN.FORMATIF)
          textMode = "Latihan Terbimbing";
        else if (this.state.modeLatihan === MODE_LATIHAN.SPESIAL) {
          textMode = "Latihan Spesial";
          textSub = this.state.judulLatihanSpesial || "Ulangan Harian";
          this.state.waktuMulaiLatihanSpesial = Date.now();
        }

        if (this.el.statusKoneksi)
          this.el.statusKoneksi.innerText = `${textMode} | ${textSub}`;
        if (this.el.areaNavigasi) this.el.areaNavigasi.style.display = "flex";
        this.renderSoal();

        if (this.el.elemenTimer) this.el.elemenTimer.style.display = "block";
        this.state.intervalTimer = setInterval(
          () => this.perbaruiTampilanTimer(),
          1000,
        );

        if (this.state.modeLatihan === MODE_LATIHAN.FORMATIF) {
          this.state.intervalAutosave = setInterval(() => {
            if (!document.hidden) {
              this.sinkronRiwayatFormatifSementara();
              console.log("Riwayat tersimpan");
            }
          }, 60000);
        }

        if (this.state.modeLatihan === MODE_LATIHAN.FORMATIF) {
          if (this.el.btnKembaliDasbor) {
            this.el.btnKembaliDasbor.innerText = "💾 Simpan & Kembali";
            this.el.btnKembaliDasbor.onclick = async () => {
              this.el.btnKembaliDasbor.innerText = "Menyimpan...";
              this.el.btnKembaliDasbor.disabled = true;
              try {
                await this.sinkronRiwayatFormatifSementara();
              } finally {
                window.location.href = this.dashboardUrl;
              }
            };
          }
        } else {
          if (this.el.btnKembaliDasbor) {
            this.el.btnKembaliDasbor.innerText = "❌ Batalkan Tes";
            this.el.btnKembaliDasbor.onclick = () => {
              if (
                confirm(
                  "Yakin ingin membatalkan ujian? Semua jawabanmu yang belum diselesaikan akan hangus dan tidak tersimpan.",
                )
              ) {
                window.location.href = this.dashboardUrl;
              }
            };
          }
        }
      } else {
        if (
          this.state.modeLatihan === MODE_LATIHAN.FORMATIF &&
          semuaSoalUtuh.length > 0
        ) {
          if (this.el.areaNavigasi) this.el.areaNavigasi.style.display = "none";
          if (this.el.elemenTimer) this.el.elemenTimer.style.display = "none";
          if (this.el.statusKoneksi)
            this.el.statusKoneksi.innerText = "Wilayah Tertaklukkan!";

          if (this.el.wadahSoal) {
            this.el.wadahSoal.innerHTML = createWilayahTertaklukkanHTML(
              this.state.namaAktif,
              this.state.subMateriPilihan,
            );
          }

          document
            .getElementById("btn-reset-progres")
            ?.addEventListener("click", async (e) => {
              e.target.innerText = "Mereset...";
              e.target.disabled = true;
              await resetProgresFormatif(
                this.state.nisAktif,
                this.state.subMateriPilihan,
              );

              const docIdKustom = `${this.state.nisAktif}_${this.state.subMateriPilihan.replace(/\s+/g, "")}_formatif_draft`;
              await hapusDrafFormatifDB(docIdKustom);

              window.location.reload();
            });

          document
            .getElementById("btn-kembali-tamat")
            ?.addEventListener(
              "click",
              () => (window.location.href = this.dashboardUrl),
            );
        } else {
          if (this.el.statusKoneksi)
            this.el.statusKoneksi.innerText =
              "Maaf, belum ada soal di wilayah ini.";
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
}
