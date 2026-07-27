# Latihan Formatif Adaptif — Catatan Rancangan

> Latihan formatif diubah dari "ambil semua soal, urut level statis, lewati yang sudah benar" menjadi **adaptif**: satu soal per langkah, dipilih acak dari level saat ini, level naik/turun berdasarkan performa. Formatif tetap murni proses pembentukan — begitu "tuntas", siswa diarahkan ke sumatif (`tes_normal`/`tes_acak`) untuk benar-benar diuji, karena formatif **tidak pernah** jadi bukti penguasaan (§2, §3 [PLAN.md](PLAN.md); §3 [CLAUDE.md](../CLAUDE.md)).

**Status: SELESAI, terverifikasi 2026-07-27.** Jest 130/130 lolos (18 test baru untuk `soalEngine.js`). Diuji manual end-to-end di browser terhadap Firestore live (§7.5) — 3 bug ditemukan & diperbaiki dalam prosesnya.

> **Berkas ini tunduk pada [CLAUDE.md](../CLAUDE.md)** dan tidak bertentangan dengan [PLAN.md](PLAN.md) (topik berbeda: itu soal gerbang prasyarat & peta materi, ini soal mekanisme pengerjaan soal di dalam satu sesi latihan).

---

## 1. Cara kerja sekarang (baseline)

Mesin tunggal `siapkanDraftSoal` di `soalEngine.js` bercabang per mode:
- **Sumatif** (`tes_normal`/`tes_acak`): ambil maks 4 mudah + 4 sedang + 2 sulit = 10 soal, dari seluruh bank soal sub-materi.
- **Formatif** (`soalEngine.js:23-32`): ambil **SEMUA** soal sub-materi, urut level 1→3 statis, **tidak diacak**.

`LatihanController.mulaiAplikasi()` (`:669-854`) membangun seluruh antrean soal formatif **di muka** (baris 706-739): tarik seluruh bank soal, urutkan per level, buang soal yang sudah pernah dijawab **benar** (dicatat di `progres_belajar.log_progres`, ditulis di `latihanService.js:64-81`, dipanggil hanya saat jawaban benar). Skor sementara = `soal_benar / total_seluruh_bank_soal` (`sinkronRiwayatFormatifSementara`, `:337-401`) — ukuran "berapa persen bank soal sudah ditaklukkan", bukan akurasi.

"Simpan & Keluar" (tombol override `:779-791`, autosave 60 detik `:770-777`, `beforeunload` `:142-150`) menulis draf ke `hasil_latihan/{nis}_{subTanpaSpasi}_formatif_draft` (`setDoc` merge). Reset ("mulai dari awal lagi") sekarang **hanya muncul setelah bank soal habis** ("Wilayah Tertaklukkan", `soalView.js:163-175`) — hapus `log_progres` + draf, lalu reload.

---

## 2. Keputusan yang berlaku

| # | Pertanyaan | Keputusan |
|---|---|---|
| 1 | Pemilihan soal per langkah | **Acak** dari soal level saat ini yang belum pernah dijawab benar |
| 2 | Syarat naik level | **Benar 3x berturut-turut** → level+1. Mentok di level 3 (tidak naik lagi) |
| 3 | Syarat turun level | **Salah 2x, kumulatif — tidak harus berturut-turut** → level-1. Mentok di level 1 (tidak turun lagi) |
| 4 | Soal di level saat ini habis sebelum syarat naik/turun terpenuhi | Ulangi acak dari soal yang **sudah benar** di level itu (latihan tambahan) — jangan paksa pindah level, supaya aturan naik/turun murni berbasis performa |
| 5 | "Simpan & Keluar" → buka lagi | **Lanjutkan dari level & counter tersimpan**, bukan reset ke level 1 — resign progres yang sudah ditunjukkan siswa itu kontraproduktif |
| 6 | Skor formatif | Persentase **`soal_benar / soal_dikerjakan`** (ganti dari `/total_bank_soal`) |
| 7 | Indikator tambahan | **"Level tertinggi dicapai"** ditampilkan berdampingan dengan persentase (dua angka terpisah, bukan formula gabungan) — persentase murni bisa menyesatkan di sistem adaptif |
| 8 | "Mulai dari awal lagi" | **Selalu tersedia** (bukan cuma setelah bank soal habis) — reset level, kedua counter, `log_progres`, dan draf |
| 9 | Kondisi **tuntas** | **3x benar berturut-turut di level 3.** Ini BUKAN kenaikan level (mentok di 3) — melainkan status **tuntas** tersendiri |
| 10 | Setelah tuntas | Arahkan ke **sumatif** (`tes_normal`/`tes_acak`) sub-materi yang sama — formatif adalah proses, sumatif adalah ujian kompetensi sesungguhnya |

**Dasar #9/#10.** Ini menjaga pemisahan filosofis yang sudah ada di §2 [PLAN.md](PLAN.md): formatif tidak pernah dihitung sebagai bukti penguasaan (`isHasilMasterSumatif` sudah short-circuit `false` untuk `mode_latihan` apa pun selain `tes_normal`/`tes_acak`, `kurikulumEngine.js:50-51`). "Tuntas" formatif adalah sinyal kesiapan (readiness), bukan status mastery — mastery tetap **hanya** lahir dari sumatif ≥80 dengan ≥10 soal (§2, §4 PLAN.md). Rencana ini tidak menyentuh definisi itu sama sekali.

---

## 3. Perubahan skema data

### `progres_belajar/{nis}_{subMateri}` — field baru

```
level_saat_ini          number (1|2|3), default 1
streak_benar            number, reset ke 0 tiap kali salah
total_salah_di_level_ini  number, kumulatif, reset hanya saat level berubah
jumlah_dikerjakan       number, naik setiap soal final-dijawab (benar ATAU salah) — dipakai sebagai penyebut skor
```

`log_progres` (sudah ada) **tidak berubah maknanya** — tetap hanya mencatat soal yang **benar**, tetap dipakai untuk exclude dari pool pemilihan acak.

**Rekomendasi implementasi**: tulis field-field ini **real-time per soal** (bukan cuma saat autosave 60 detik/`beforeunload` seperti draf sekarang), memakai jalur yang sama dengan `simpanProgresSatuSoal`. Alasan: kalau cuma disimpan periodik, crash/tab tertutup mendadak menghapus state adaptif (level, streak) walau soal yang sudah benar tetap tercatat di `log_progres` — situasi state yang tidak konsisten (soal sudah dikerjakan tapi level "lupa").

### `hasil_latihan` draf formatif — perubahan formula, field baru

`nilai` dihitung ulang: `jumlah_benar / jumlah_dikerjakan * 100` (bukan `/ total_bank_soal` seperti sekarang). Field baru: `level_tertinggi_dicapai`, `status_tuntas` (boolean atau turunan dari `level_tertinggi_dicapai === 3 && streak_benar_di_level_3 === 3` pada saat penyimpanan terakhir).

---

## 4. Titik sentuh kode

| Berkas | Perubahan |
|---|---|
| `utils/soalEngine.js` | Cabang `FORMATIF` di `siapkanDraftSoal` (`:23-32`) diganti: bukan lagi array statis di muka, tapi fungsi pemilih-soal-berikutnya yang menerima `(poolLevelSaatIni, soalSudahBenar)` dan mengembalikan satu soal acak |
| `controllers/LatihanController.js` | `mulaiAplikasi()` (`:669-854`) — restrukturisasi bagian formatif: tidak lagi membangun `kumpulanSoal` penuh di muka, ambil satu soal per langkah setelah tiap jawaban. `handleCekJawaban` — tambah logic naik/turun level + deteksi kondisi tuntas (3x benar berturut-turut di level 3) |
| `services/latihanService.js` | `simpanProgresSatuSoal` (atau fungsi baru sejenis) perlu menulis field baru §3 secara real-time, termasuk saat jawaban **salah** (sekarang hanya dipanggil saat benar) |
| `views/soalView.js` | Badge level berjalan di UI soal; layar baru "Tuntas!" (terpisah dari "Wilayah Tertaklukkan" yang lama — lihat §5); tombol "mulai dari awal lagi" dipindah agar selalu terlihat, bukan cuma di layar akhir |
| `pages/pilihMateri.js` | Tidak perlu diubah untuk redirect — pola `localStorage.setItem("mode_latihan", MODE_LATIHAN.NORMAL)` + `window.location.href = "latihan.html"` (persis `:269-303`) dipakai ulang dari layar "Tuntas!" di `latihan.html`, dengan `materi_utama_aktif`/`sub_materi_aktif` yang sudah tersimpan tetap dipertahankan |

---

## 5. Keputusan sekunder (saya putuskan sebagai default wajar, bisa diralat)

1. ~~**"Wilayah Tertaklukkan" (soal habis total) masih relevan?** Ya, dipertahankan sebagai fallback langka~~ → **direvisi saat implementasi (§7): dihapus, bukan dipertahankan.** Ternyata tidak bisa jadi fallback yang genuinely reachable — lihat §7.1.
2. **Status tuntas — permanen atau per-sesi?** Diusulkan **permanen** (field `status_tuntas` tersimpan di draf/hasil): begitu tuntas, membuka kembali sub-materi itu di mode formatif menampilkan ringkasan "sudah tuntas" + tombol ke sumatif + tombol "latihan lagi dari awal" — bukan otomatis melanjutkan grinding dari level 1. Konsisten dengan filosofi "bukti langsung mengalahkan dugaan" di §1 PLAN.md (keputusan #8).

---

## 6. Belum diputuskan / perlu verifikasi saat implementasi

- Detail exact UI layar "Tuntas!" (copy, tombol) — belum di-mockup, beda dari proses di §12 PLAN.md yang mewajibkan mockup disetujui dulu sebelum implementasi peta materi. Untuk fitur ini mockup belum dibuat. → **Selesai di §7**, tapi tetap belum divalidasi visual di browser sungguhan.
- Apakah level_saat_ini dkk juga perlu tampil di riwayat (`riwayatSiswaView.js`) — belum dibahas. → **Tidak disentuh** di implementasi ini; `level_tertinggi_dicapai`/`status_tuntas` tersimpan di `hasil_latihan` tapi belum dirender di halaman riwayat manapun.
- Interaksi dengan `getRiwayatLatihanSiswa`/`getRiwayatLatihanAsc` — **aman**: keduanya cuma filter `nis_siswa`, field baru ikut lolos begitu saja sebagai field tambahan yang diabaikan consumer lama (additive, tidak breaking).

---

## 7. Implementasi (2026-07-27)

Dikerjakan langsung mengikuti §2–§5 di atas. Titik sentuh persis sesuai §4: `soalEngine.js`, `latihanService.js`, `LatihanController.js`, `soalView.js`, plus `latihan.html` (markup tombol baru). Tiga penyesuaian signifikan ditemukan **saat** coding, bukan direncanakan di muka:

### 7.1 "Wilayah Tertaklukkan" dihapus, bukan dipertahankan

Keputusan sekunder §5.1 mengusulkan mempertahankannya sebagai fallback. Ternyata **secara logis tidak pernah tercapai**: `pilihSoalFormatifBerikutnya` (soalEngine.js) SELALU mengembalikan sebuah soal selama bank sub-materi tidak benar-benar kosong — kalau soal-belum-benar di suatu level habis, ia otomatis mengulang soal yang sudah benar (keputusan §2.4), bukan mengembalikan `null`. `null` cuma terjadi kalau `semuaSoalUtuh.length === 0`, yang sudah punya pesan sendiri ("Maaf, belum ada soal di wilayah ini") sejak sebelum fitur ini ada. Layar & fungsi `createWilayahTertaklukkanHTML` dihapus penuh (bukan cuma tak dipakai) — kode mati yang tak pernah bisa dieksekusi bertentangan dengan konvensi proyek.

### 7.2 Bug ganda-hitung skor ditemukan & diperbaiki sebelum sempat nyata

`hitungRingkasanFormatif()` (baru, `LatihanController.js`) menggabungkan `riwayatProgresGlobal` (soal benar dari sesi-sesi lalu) dengan `memoriJawaban` (soal yang baru selesai di sesi ini). Kode ASLI (sebelum refactor ini) sudah punya bug laten di sini: penjumlahan `totalPoin` dari `memoriJawaban` tidak dijaga dari duplikat, hanya `jumlahSelesai` yang dijaga. Ini tidak pernah jadi masalah nyata di sistem lama karena soal yang sudah benar permanen tak pernah muncul lagi. Begitu keputusan §2.4 (mengulang soal yang sudah benar saat level habis) diimplementasikan, jalur ini jadi genuinely reachable dan akan menggelembungkan skor. Diperbaiki dengan menjaga PENJUMLAHAN, bukan cuma hitungan (baris terkait di `hitungRingkasanFormatif`).

**Konsekuensi lanjutan yang juga ditemukan**: soal ulangan yang sudah `status_selesai: true` DI SESI YANG SAMA (bukan cuma riwayat lama) akan tampil dalam kondisi "sudah selesai" tanpa pernah memberi kesempatan menjawab lagi — karena `memoriJawaban` menyimpan objek lama dengan `status_selesai` sudah `true`. Ini akan mengunci mekanisme naik/turun level begitu pool soal satu level habis dalam satu sesi (siswa cuma bisa klik "Lanjut" berulang tanpa pernah benar-benar menjawab). Diperbaiki lewat `sajikanSoalFormatif()`: setiap kali soal disajikan, kalau memori lamanya sudah `status_selesai`, dihapus dulu supaya soal itu benar-benar bisa dikerjakan ulang.

### 7.3 Denominator skor disederhanakan (bukan counter baru)

Rencana §3 awalnya mengusulkan field baru `jumlah_dikerjakan` di `progres_belajar`. Saat implementasi, disadari ini tidak perlu: karena sistem TIDAK punya mekanisme "menyerah permanen" (setiap soal pada akhirnya harus dijawab benar untuk `status_selesai`, poin partial-credit 100/70/30 sudah jadi sinyal "seberapa banyak siswa berjuang"), maka `jumlah_dikerjakan` selalu sama persis dengan jumlah soal yang sudah **benar** — yang sudah dihitung sistem lama sebagai `jumlahSelesai`. Jadi skor cukup mengganti PENYEBUT dari `totalSoalKeseluruhan` (ukuran bank) ke `jumlahSelesai` (soal yang benar-benar diselesaikan) tanpa field Firestore baru. Field baru yang benar-benar ditambahkan ke `progres_belajar`: `level_saat_ini`, `level_tertinggi_dicapai`, `streak_benar`, `total_salah_di_level_ini`, `formatif_tuntas`, `nilai_tuntas_terakhir` — enam, bukan tujuh.

### 7.4 Field baru di `hasil_latihan`

`level_tertinggi_dicapai` (draf & final) dan `status_tuntas` (final saja) — murni aditif, tidak breaking terhadap consumer lama (§6).

### 7.5 Verifikasi manual di browser (2026-07-27) — SELESAI, 3 bug ditemukan & diperbaiki

Diuji langsung di `localhost:5050` (`firebase serve --only hosting`, terhubung ke Firestore **live**) via akun NIS 1, lewat Chrome yang dikendalikan otomatis. Seluruh alur inti diverifikasi end-to-end dengan membaca Firestore langsung di antara tiap langkah (bukan cuma lihat UI): naik level (3x benar berturut → level 2, kedua counter reset), turun level (2x salah kumulatif → level 1, `level_tertinggi_dicapai` **tidak** ikut turun), Simpan & Keluar → resume (soal, jawaban terpilih, dan level persis sama saat dibuka lagi), skor `benar/dikerjakan` (6 soal, total poin 570 → tepat 95), tuntas di level 3 (tombol berubah jadi "Selesai Kerjakan", modal menampilkan skor + tombol redirect), redirect ke sumatif (`localStorage.mode_latihan` berpindah, sesi `tes_normal` baru terbuka dengan benar), dan layar ringkasan permanen saat sub-materi yang sudah tuntas dibuka lagi (skor & level tertinggi tersimpan tampil tanpa mengulang soal).

Tiga bug nyata ditemukan selama proses ini, semua sudah diperbaiki dan lolos Jest ulang:

1. **Data**: 28 dari 30 soal baru (`arsip-data/...`, sudah terhapus) memakai teks literal `&lt;br&gt;` di `pembahasan`, bukan tag `<br>` asli — salah kutip dari laporan riset sebelumnya (markdown menampilkan tag asli sebagai teks ter-escape, saya salah mengira itu nilai literal). Akibatnya siswa melihat "&lt;br&gt;" mentah di pembahasan, bukan baris baru. Diperbaiki langsung di Firestore live lewat skrip sekali-pakai di `akses-admin/` (dihapus lagi setelah dipakai, pola sama seperti skrip admin lain).
2. **Kode — race condition di reset**: `handleResetFormatif()` memanggil `window.location.reload()` setelah menghapus draf, tapi reload itu sendiri memicu `beforeunload`, yang menyinkronkan ulang (menghidupkan lagi) draf yang baru saja dihapus. Diperbaiki dengan set `this.state.isSelesai = true` + `clearInterval(intervalAutosave)` sebelum reload, supaya guard di listener `beforeunload` mencegah sinkron susulan itu.
3. **Kode — nomor soal beku**: label "Soal ke-N" tidak pernah bertambah dalam satu sesi karena `nomorTampil` dihitung dari `indeksSaatIni`, yang saya sengaja selalu reset ke 0 tiap soal baru (karena `kumpulanSoal` cuma menyimpan 1 elemen per giliran, bukan array penuh seperti sistem lama). Diperbaiki dengan counter terpisah (`langkahFormatif`) yang naik tiap kali `handleNavigasi` menyajikan soal baru, dipakai khusus untuk hitungan tampilan FORMATIF.

**Tidak menyentuh riwayat/rekap** — level tertinggi & status tuntas tersimpan tapi belum ditampilkan di halaman riwayat siswa manapun (§6).
