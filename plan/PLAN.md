# Kunci Materi & Peta Materi — Catatan Rancangan

> Sebuah sub-materi hanya bisa dikerjakan sebagai **ujian** bila semua prasyaratnya sudah berstatus **master**. Prasyaratnya disusun **manual oleh guru**; urutan tampil kartu diambil dari urutan mengajar di `PETA_TAHAPAN`. Sampai 2026-07-26 ini cuma berlaku untuk tab Trigonometri (tabelnya dulu bernama `PETA_PRASYARAT`); sejak §11, cakupannya digeneralisasi ke tab manapun lewat `PETA_PRASYARAT`.

**Status: selesai dan terverifikasi terhadap Firestore live.** Dokumen ini bukan lagi rencana kerja — isinya keputusan yang berlaku, alasannya, dan catatan jalan buntu yang sudah dicoba agar tidak diulang.

> **Berkas ini tunduk pada [CLAUDE.md](../CLAUDE.md).** CLAUDE.md menetapkan struktur dan aturan yang mengikat; PLAN.md menyimpan *mengapa*-nya untuk satu fitur. Kalau keduanya bertentangan, CLAUDE.md yang benar dan berkas ini yang harus diperbarui. Aturan di sini yang ternyata mengikat lintas fitur harus **dinaikkan ke CLAUDE.md** — PLAN.md tidak dibaca otomatis oleh agen.

Riwayat lengkap penyusunannya (rencana bertahap, hasil Gate A/B, analisis `konsep_prasyarat`, tiga kali perubahan arah) ada di riwayat git berkas ini sampai commit `96a2e71`. Sengaja dipangkas 2026-07-26 karena sudah terlaksana semua.

---

## 1. Keputusan yang berlaku

| # | Pertanyaan | Keputusan |
|---|---|---|
| 1 | Lingkup evaluasi prasyarat | **Lintas-tab** — materi Trigonometri boleh mensyaratkan materi tab Prasyarat |
| 2 | Mode yang dikunci | **Hanya mode ujian** (`tes_normal`/`tes_acak`). Formatif **selalu terbuka** |
| 3 | Definisi `master` | **Sumatif lulus saja** — formatif tidak disyaratkan tuntas |
| 4 | Rollout siswa lama | **Strict** — berlaku penuh, tanpa grandfathering |
| 5 | Prasyarat tanpa soal cukup | **Tetap memblokir** + tampilkan peringatan ke admin |
| 6 | Sub-materi belum dipetakan | **Terbuka** (dianggap titik masuk) |
| 7 | UX klik kartu terkunci | **Toast** berisi daftar prasyarat yang belum master |
| 8 | Materi yang sendirinya sudah master | **Tidak pernah dikunci**, walau prasyaratnya belum |
| 9 | Sumber peta prasyarat | **Disusun manual oleh guru**, bukan diturunkan dari data soal |
| 10 | Lingkup penguncian | ~~Hanya tab Trigonometri~~ → **direvisi 2026-07-26 (§11): tab manapun boleh digerbang**, mengikuti rantai prasyarat bab di prota. Tab Prasyarat (SMP) tetap selalu terbuka |
| 11 | Sumber urutan kartu | **`PETA_TAHAPAN`** (urutan mengajar), bukan hasil topological sort |

**Dasar keputusan #8.** Gerbang ini memakai prasyarat untuk *menduga* kesiapan siswa. Nilai sumatif ≥80 atas materi itu sendiri adalah *bukti langsung*, dan bukti langsung mengalahkan dugaan. Tanpa aturan ini, siswa yang menguasai materi lewat urutan lain justru terhalang mengulang materinya sendiri. Uji manual menemukan 7 kasus nyata pada satu akun saja.

**Konsekuensi #10 yang disengaja.** `Rasio Trigonometri Dasar` digerbangkan oleh `Teorema Pythagoras`, jadi siswa yang belum menyentuh tab Prasyarat melihat **0 materi terbuka** di tab Trigonometri. Tab Prasyarat adalah jalur wajib, bukan opsional.

---

## 2. Definisi "master" — sumber kebenaran tunggal

Sebuah sub-materi berstatus **master** bagi seorang siswa jika ada minimal 1 entri `hasil_latihan` dengan:

- `mode_latihan` ∈ {`tes_normal`, `tes_acak`} (termasuk penamaan lama `normal`, `acak`)
- `status` ≠ `draf`
- `nilai >= MASTERY.NILAI_MIN` (80)
- jumlah soal dikerjakan `>= MASTERY.SOAL_MIN` (10) — dari `detail_jawaban` atau `log_percobaan`

Aturan ini ditulis **hanya di satu tempat**: `isHasilMasterSumatif()` di `kurikulumEngine.js`. `isSubMateriMaster()` adalah `.some()` di atasnya. `gelarService` dan `ketuntasanController` mengimpornya — **jangan menyalin ulang aturannya.**

> Sebelum 2026-07-26 aturan ini disalin di tiga tempat dan ketiganya berselisih. Akibatnya nyata di data live: panel Ketuntasan menghitung 149 "lulus", gerbang & gelar menghitung 140. Selisih 9 record / 6 siswa, lima di antaranya ujian **1 soal** bernilai ≥80. Enam dari sembilan ada di `Rasio Trigonometri Dasar` — siswa tertulis ✅ di panel guru sementara seluruh tab Trigonometri terkunci bagi mereka.

`gelar_terbuka` **tidak boleh** dipakai sebagai sumber status master: nama gelar dipotong 25 karakter sehingga lossy dan ambigu antar sub-materi berawalan sama.

**Biaya baca:** satu kueri `getRiwayatLatihanSiswa(nis)`, tanpa tambahan.

---

## 3. Cara penguncian bekerja

Tidak ada algoritma graf. Penguncian hanyalah pencarian di tabel:

```
INPUT : PETA_PRASYARAT (tabel manual), setMaster
PROSES: untuk tiap entri (materi → daftar prasyarat):
          prereqBelum = prasyarat yang ∉ setMaster
          locked      = (materi ∉ setMaster) ∧ (prereqBelum tidak kosong)
OUTPUT: { subMateri → { locked, prereqBelum } }
```

- **Transitivitas otomatis** — cukup cek prasyarat *langsung*. Prasyarat yang terkunci pasti belum master, jadi materi sesudahnya ikut tertahan.
- **Materi tak terdaftar → terbuka** (#6). Inilah cara tab Prasyarat dibiarkan bebas: materinya memang tidak ditulis (#10).
- **Siklus tidak mungkin terbentuk**, jadi fail-safe siklus tidak ada. Penggantinya `urutanMundur`: pada daftar berurut, satu-satunya cara peta memutar balik adalah menulis prasyarat *sesudah* materinya — perbandingan indeks, bukan penelusuran graf.
- **Penguncian ini UX sisi-klien, bukan kontrol keamanan.** Siswa yang paham teknis bisa membuka `latihan.html` langsung; itu dapat diterima karena skor tetap tercatat per-siswa. Menegakkannya sungguhan butuh Cloud Function — di luar cakupan (hosting statis).
- **Fail-safe:** bila kueri riwayat gagal, jangan mengunci apa pun. Kegagalan jaringan tidak boleh memblokir seluruh siswa.

Bentuk tabel sekarang: **45 sisi, 18 materi berprasyarat ganda, kedalaman 6.** Lapisan pembukaan tab Trigonometri `[2, 3, 6, 7, 6, 1]`.

---

## 4. Ambang 10 soal — jebakan yang harus dijaga

Status master sepenuhnya bergantung pada satu ujian dengan **minimal 10 soal dikerjakan**. Konsekuensinya:

> Sub-materi yang total soalnya di bank soal **< 10** tidak akan pernah bisa di-master oleh siapa pun. Jika ia menjadi prasyarat, seluruh rantai sesudahnya **terkunci permanen**.

Kriteria bahaya bukan `jumlah_soal = 0` melainkan `jumlah_soal < 10`. Sub-materi bersoal 7 terlihat normal di UI tapi berperilaku seperti dinding buntu.

Saat ini **aman**: semua 34 node peta bersoal ≥10. Yang di bawah ambang hanya 6 sub-materi Eksponen & Logaritma (1–4 soal), dan tak satu pun ada di peta. Aturan lengkapnya di [CLAUDE.md](../CLAUDE.md).

Jalankan [`gate-a-audit-kurikulum.mjs`](diagnostik/gate-a-audit-kurikulum.mjs) setiap kali tabel prasyarat atau bank soal berubah.

---

## 5. Penjaga tabel manual

Tabel tulisan tangan salah secara **senyap** — materi yang tak pernah terbuka tidak melempar error, ia hanya hilang dari jangkauan siswa. Lima pemeriksaan menggantikan jaminan yang dulu diberikan algoritma:

| Pemeriksaan | Menangkap | Di mana |
|---|---|---|
| `namaTakDikenal` | salah ketik (`Teorema Pytagoras`) | Jest + `validasiKurikulum` |
| `urutanMundur` | prasyarat ditulis sesudah materinya | Jest + `validasiKurikulum` |
| kunci di dalam blok Trigonometri | materi tab Prasyarat ikut terkunci | Jest |
| tidak ada materi yatim | materi yang mustahil dibuka | Jest |
| prasyarat ber-soal < 10 | deadlock permanen (§4) | skrip Gate A |

Empat yang pertama jalan tiap kali tabel disunting. Yang kelima butuh data bank soal, jadi tetap di skrip.

---

## 6. Peta materi (`peta-materi.html`)

Layered kiri→kanan. **Kolom dihitung dari simulasi pembukaan berulang**, bukan kedalaman topologis, dan **tidak bergantung pada siswa** — peta yang menyusun ulang dirinya per siswa berhenti menjadi peta. Status siswa hanya mewarnai node (`master` / `siap` / `terkunci`).

Urutan baris memakai **barycenter** (rata-rata baris induk, urutan mengajar sebagai tiebreak) untuk menekan persilangan garis. Judul kolom dirender **di dalam SVG** supaya tidak bisa melenceng dari kolomnya saat peta diskalakan.

Berkas: [`utils/tataLetakPeta.js`](../public/js/utils/tataLetakPeta.js) (tata letak murni) → [`views/petaMateriView.js`](../public/js/views/petaMateriView.js) (SVG) → [`pages/petaMateri.js`](../public/js/pages/petaMateri.js) (kontroler).

Catatan implementasi yang mudah terlupa:
- SVG `<text>` **tidak** membungkus baris — pemecahan baris dihitung sendiri (`pecahBaris`).
- Jangan pakai `scrollIntoView` untuk memfokuskan node: fungsi itu ikut menggulung halaman sehingga siswa terlempar dari kepala halaman. Geser `.peta-scroll` saja.
- Zoom mobile ditangani lewat kontainer bergulir + tombol "lihat utuh" (toggle kelas CSS), **bukan** pinch-zoom transform — proyek ini punya riwayat bug Safari.

---

## 7. Jalan buntu yang sudah dicoba — jangan diulang

**Algoritma Kahn / topological sort — dilarang, termasuk "sekadar untuk tata letak".** Dulu dipakai untuk mengurutkan kartu. Dibongkar karena urutan mengajar adalah keputusan pedagogis milik guru dan tidak boleh disusun ulang mesin. Urutan kartu sekarang dari `PETA_TAHAPAN`; kolom peta dari simulasi pembukaan.

**Menurunkan peta prasyarat dari `konsep_prasyarat` per-soal — dicoba sampai tuntas, lalu dibuang.** Alias sudah dinormalisasi, 2 siklus dihilangkan, transitive reduction diterapkan, hasilnya rapi secara angka (75 sisi, 17 node bercabang). Dibatalkan karena dua hal mendasar:

1. **Urutan mengajar terbalik di 30 dari 53 pasangan.** `konsep_prasyarat` mencatat apa yang dibutuhkan untuk **mengerjakan** sebuah soal, bukan apa yang harus **dipelajari lebih dulu**. Soal "Bentuk Khusus" memang tidak membutuhkan materi "Lanjutan".
2. **Prasyarat konseptual tidak tercatat.** `Aturan Kuadran` menyebut `Rasio Trigonometri Dasar` hanya di 2 dari 20 soal, jadi tersaring ambang — padahal mustahil mengajarkan kuadran tanpa rasio.

> Kalau algoritmanya butuh dua tambalan buatan agar tidak melawan urutan guru, maka urutan guru yang benar dan algoritmanya yang mengganggu.

Field `konsep_prasyarat` tetap berharga sebagai **penasihat** — persentase pemakaiannya tersimpan sebagai komentar `// 63%` di sebelah tiap prasyarat di `PETA_PRASYARAT` — tapi tidak boleh jadi sumber kebenaran urutan.

**Peta linear.** Bentuk lama (55 node, tiap node tepat 1 prasyarat dan 1 anak) membuat siswa **selalu** hanya melihat `master + 2` materi terbuka, dan membuat visualisasi pohon mustahil — tidak ada algoritma tata letak yang bisa menciptakan cabang yang tidak ada di datanya. Tabel manual bercabang menyelesaikan keduanya sekaligus.

---

## 8. Yang belum dikerjakan

**Panel diagnostik kurikulum di `admin.html`** (keputusan #5) — menampilkan `namaTakDikenal`, `urutanMundur`, dan `prasyaratTakMungkinMaster` dari `validasiKurikulum()`. Prioritas rendah: Gate A menemukan nol masalah, jadi panel ini murni pencegahan untuk materi yang ditambahkan nanti.

**Eksponen & Logaritma.** ~~Soalnya belum masuk Firestore~~ → superseded oleh §11: kedua tab ini sekarang bagian dari ekspansi kurikulum penuh, dikerjakan bertahap (Fase 1 & 2). "Operasi Bentuk Akar" sudah pindah ke tab Eksponen per 2026-07-26.

**Data lama di bawah ambang sengaja dibiarkan** (keputusan pemilik proyek, 2026-07-26). Jangan menghapusnya tanpa permintaan eksplisit.

~~**Soal duplikat di tab Eksponen.**~~ **SELESAI, diperbaiki 2026-07-27.** Ditemukan saat verifikasi Fase 8 (di luar cakupan Fase 8, dibahas setelah Fase 9 selesai sesuai kesepakatan): dua soal di sub-materi **Operasi Bentuk Akar** ternyata sebenarnya soal "Merasionalkan Penyebut" yang salah tempat (subbab yang secara pedagogis diajarkan SETELAH Operasi Bentuk Akar) — salah satunya (`id: UHxUqe2COIic9B0N5H98`) bahkan teks pertanyaannya identik dengan soal `VdtVC8D6Ddn3B7lu9Uhz` di sub-materi Merasionalkan Penyebut, yang lainnya (`id: BwDPIii9EXsJXxNEfAud`) sama-sama tentang merasionalkan meski tekstualnya tidak identik. Karena **Operasi Bentuk Akar cuma punya tepat 10 soal** (pas di ambang §4, bukan 20 seperti dugaan awal), keduanya **ditulis ulang di tempat** (bukan dihapus) jadi soal operasi bentuk akar murni (kombinasi sederhanakan/jumlah/kurang/kali bentuk akar, tidak menyinggung rasionalisasi), lewat alur ekspor-edit-impor ulang dengan `id` dipertahankan. Diverifikasi lewat ekspor Firestore live segar: isi kedua soal sudah berubah, jumlah "Operasi Bentuk Akar" tetap 10, dan nol duplikat `pertanyaan` di seluruh 1070 soal.

---

## 9. Catatan yang tidak diambil

**Tabel alias nama lawas tidak dibangun.** Riwayat masih memuat `Sifat Sudut (Berseberangan & Berpelurus)` — nama gabungan yang kini dipecah dua. Pengecekan data live: **tepat 1 record**, dan materinya bukan prasyarat siapa pun, jadi dampaknya ke penguncian nol. Perlu ditinjau ulang kalau Sifat Sudut suatu saat menjadi prasyarat.

**Latihan spesial tidak pernah memberi status master.** Modenya di luar `MODE_UJIAN`, jadi berapa pun nilainya tidak membuka kunci apa pun. Sesuai desain, dicatat agar tidak jadi kejutan.

---

## 10. Cakupan tes diagnostik numerasi kelas X vs. tab "Prasyarat" (2026-07-26)

Analisis ad-hoc atas berkas eksternal *Tes Diagnostik Numerasi — Kelas X* (50 soal, PDF, bukan bagian repo) dibandingkan dengan sub-materi yang tampil di tab "Prasyarat" (`pilih-materi.html`). Dicatat di sini karena menyingkap celah kurikulum, bukan karena ada perubahan kode.

**Metode:** tab "Prasyarat" berisi setiap sub-materi dengan `materi_utama` di luar `["Eksponen","Logaritma","Trigonometri"]` (`pilihMateri.js:113-122`). Isinya di-cross-check ke `arsip-data/bank_soal.json` (455 soal, arsip — tidak ikut di-deploy) per teks `pertanyaan`, bukan cuma nama sub-materi, supaya tidak menebak dari label.

| Bagian & No. Soal (PDF) | Topik | Sub-materi Prasyarat yang cocok | Status |
|---|---|---|---|
| Bagian 1, No. 1–3, 6–8 | Operasi hitung campuran, bilangan negatif | **Operasi Aritmatika Dasar** | Tercakup |
| Bagian 1, No. 4–5 | Sifat distributif/komutatif/asosiatif (bilangan murni) | — | Tidak tercakup |
| Bagian 2, No. 9–14 | Faktorisasi prima, FPB, KPK | **KPK dan FPB** | Tercakup |
| Bagian 3, No. 15–17 | Operasi pecahan (+, −, ÷) | **Operasi Pecahan** | Tercakup |
| Bagian 3, No. 18–24 | Desimal (operasi, konversi, bandingkan, urutkan) | — | Tidak tercakup |
| Bagian 4, No. 25–29 | Sederhanakan & jabarkan bentuk aljabar (termasuk distributif aljabar) | **Manipulasi Aljabar Dasar** | Tercakup |
| Bagian 4, No. 30–31 | Substitusi fungsi linear notasi $f(x)$ | — (`f(x)` di bank soal hanya dipakai untuk Fungsi Kuadrat & Trigonometri) | Tidak tercakup |
| Bagian 5, No. 32–35 | Persamaan linear satu variabel | **Persamaan Linear Satu Variabel** | Tercakup |
| Bagian 5, No. 36–39 | Sistem persamaan linear dua variabel | **Sistem Persamaan Linear** | Tercakup |
| Bagian 6, No. 40–50 | Persen, perbandingan/rasio senilai, skala, estimasi, pembulatan | — | Tidak tercakup |

**Hasil: 28/50 soal (56%) tercakup, 22/50 (44%) tidak.** Tiga celah konkret:

1. **Sifat operasi pada bilangan murni** (No. 4–5) — versi aljabarnya ada (Manipulasi Aljabar Dasar), versi bilangan polos tidak.
2. **Bilangan desimal** (No. 18–24, 7 soal) — "Operasi Pecahan" yang ada murni pecahan biasa; tidak ada satu pun soal desimal di 10 soalnya.
3. **Bagian 6 · Numerasi Terapan** (No. 40–50, 11 soal / 22% dari seluruh tes) — persen, perbandingan senilai, skala, estimasi, pembulatan **tidak punya representasi di kurikulum aplikasi manapun**, bukan cuma di tab Prasyarat. Dicek ke seluruh 455 soal arsip, bukan cuma yang berlabel Prasyarat.

**Belum ada keputusan atau pekerjaan kode dari analisis ini.** Kalau nanti sub-materi baru dibuat untuk menutup celah ini, berlaku ambang 10 soal (§4) — sub-materi baru tidak boleh dipakai untuk ujian sumatif sebelum bank soalnya ≥10.

**Update 2026-07-26 — celah Bagian 6 ditutup.** Dibuat 3 sub-materi baru, masing-masing 10 soal, `materi_utama: "Numerasi Terapan"` (grup baru, otomatis masuk tab Prasyarat karena bukan Eksponen/Logaritma/Trigonometri):

- **Persentase** — mencakup gaya soal No. 40–44 (persen dasar, diskon, kenaikan harga, persen dari perbandingan).
- **Perbandingan dan Skala** — mencakup gaya soal No. 45–48 (sederhanakan rasio, perbandingan senilai & berbalik nilai, skala peta/denah).
- **Pembulatan dan Estimasi** — mencakup gaya soal No. 49–50 (pembulatan bilangan bulat & desimal, taksiran hasil operasi).

Soalnya sempat berupa berkas arsip di `arsip-data/bank_soal/prasyarat/numerasi-terapan/*.json` (format sama seperti dump arsip lain), lalu **sudah diimpor ke Firestore** lewat `admin.html` → tab Bank Soal → tombol "Impor JSON" (2026-07-26). Berkas arsipnya dihapus lagi setelah impor sukses supaya tidak ter-impor dobel bila di-upload ulang tanpa sengaja — sumber kebenarannya sekarang Firestore, bukan berkas ini. Urutan tampilnya didaftarkan sebagai `"Tahap 7: Numerasi Terapan"` di `PETA_TAHAPAN` (`kurikulumData.js`) — posisi ini pilihan sementara penulis dokumen, **belum ditinjau guru**, dan mudah diubah karena tak ada satu pun sub-materi baru ini yang menjadi prasyarat di `PETA_PRASYARAT`. Gate A (`gate-a-audit-kurikulum.mjs`) dan seluruh test Jest sudah dijalankan ulang dan lolos sebelum impor.

Celah No. 4–5 (sifat operasi bilangan murni), No. 18–24 (desimal), dan No. 30–31 (substitusi fungsi linear $f(x)$) **belum digarap** — di luar cakupan permintaan ini.

**Update 2026-07-26 — tiga celah sisanya juga ditutup.** Dibuat 3 sub-materi baru, masing-masing 10 soal, `materi_utama: "Aritmatika dan Aljabar Dasar"` (grup yang sudah ada, sejalan dengan sub-materi sejenis seperti "Operasi Aritmatika Dasar" dan "Manipulasi Aljabar Dasar"):

- **Sifat Operasi Bilangan** — menutup No. 4–5 (distributif/komutatif/asosiatif pada bilangan murni, versi bukan-aljabar dari "Manipulasi Aljabar Dasar").
- **Operasi dan Konversi Desimal** — menutup No. 18–24 (operasi hitung desimal, konversi pecahan↔desimal, membandingkan & mengurutkan campuran pecahan-desimal).
- **Substitusi Fungsi Linear** — menutup No. 30–31 (evaluasi $f(x)$ untuk fungsi linear, termasuk mencari $x$ atau koefisien dari $f(x)$ yang diketahui).

Didaftarkan di `PETA_TAHAPAN`: "Sifat Operasi Bilangan" dan "Operasi dan Konversi Desimal" masuk **Tahap 1: Aritmatika** (bersanding dengan Operasi Aritmatika Dasar / Operasi Pecahan); "Substitusi Fungsi Linear" masuk **Tahap 2: Gerbang Logika & Sudut**, tepat setelah "Manipulasi Aljabar Dasar" — sebagai jembatan sebelum notasi $f(x)$ dipakai serius di "Fungsi Kuadrat" (Tahap 5) dan "Analisis Grafik Fungsi" (Tahap 6). Ketiga posisi tahap ini pilihan sementara penulis dokumen, **belum ditinjau guru**.

Soalnya sempat berupa berkas arsip di `arsip-data/bank_soal/prasyarat/aritmatika-dan-aljabar-dasar/*.json`, lalu **sudah diimpor ke Firestore** lewat `admin.html` → tab Bank Soal → "Impor JSON" (2026-07-26). Berkas arsipnya dihapus lagi setelah impor sukses (pola yang sama seperti Numerasi Terapan di atas) — sumber kebenarannya sekarang Firestore. Gate A dan seluruh test Jest sudah dijalankan ulang dan lolos sebelum impor.

**Cakupan Tes Diagnostik Numerasi Kelas X kini lengkap (50/50 soal)** — enam celah yang tercatat di analisis awal (§10 bagian atas) semuanya sudah punya sub-materi padanan dan sudah masuk Firestore.

**Update 2026-07-27 — urutan tahap dirombak mengikuti urutan tes.** `TAHAPAN_PRASYARAT_SMP` (`kurikulumData.js`) disusun ulang supaya tahap-tahapnya mengikuti urutan Bagian tes diagnostik (Bilangan Bulat → Faktorisasi → Non-Bulat → Aljabar → Numerasi Terapan), lalu sub-materi yang **tidak** diuji tes ini (sudut/geometri, sistem & realita, area kuadratik, fungsi & transformasi) ditaruh setelahnya, diurutkan dari paling dasar ke paling lanjut:

- **Tahap 1: Aritmatika** — tidak berubah (Bagian 1–3 tes).
- **Tahap 2: Aljabar Dasar** — Pengenalan Variabel + Manipulasi Aljabar Dasar, dipisah dari sudut (dulu bersanding di "Tahap 2: Gerbang Logika & Sudut"). Bagian 4 tes.
- **Tahap 3: Numerasi Terapan** — Persentase, Perbandingan dan Skala, Pembulatan dan Estimasi, naik dari Tahap 7 lama. Bagian 6 tes (Bagian 5/PLSV-SPLDV dilewati karena sudah pindah ke tab "Sistem Persamaan" sejak §11, dan sub-materinya sendiri tidak digerbang oleh apa pun).
- **Tahap 4: Sudut & Spasial** — gabungan sudut (dulu separuh Tahap 2) + spasial (dulu Tahap 3), tidak diuji tes tapi paling dasar di antara sisanya.
- **Tahap 5: Sistem & Realita**, **Tahap 6: Area Kuadratik**, **Tahap 7: Fungsi & Transformasi Dasar** — nomor tahap naik satu (dulu 4/5/6), isi tidak berubah.

Perubahan ini murni tata letak kartu peta materi — Prasyarat SMP tetap tidak pernah dikunci dan tidak ada satu pun sub-materinya yang jadi target gerbang sub-materi lain di tab yang sama, jadi tidak menyentuh `PETA_PRASYARAT` maupun logika kunci. Gate A dan seluruh test Jest (116) sudah dijalankan ulang dan lolos. Posisi tahap 4-7 tetap pilihan sementara penulis dokumen, **belum ditinjau guru**.

---

## 11. Ekspansi kurikulum ke prota/prosem penuh (2026-07-26, berjalan)

Sumber: `/Users/fakhri246/project/matematika/supermath-mtk-x/index.html` (rencana pembelajaran satu tahun, di luar repo ini) — 11 bab + 1 sisipan (Nilai Mutlak), lengkap dengan urutan ajar (`RENCANA[].urut`), prasyarat antar-bab (`RENCANA[].prasyarat`), dan halaman per subbab. Tujuannya: aplikasi ini akhirnya mencakup seluruh materi kelas X, bukan cuma Trigonometri.

### 11.1 Keputusan

| # | Pertanyaan | Keputusan |
|---|---|---|
| 1 | Nama sub-materi baru | **Tidak mengikuti judul bab/subbab buku persis.** Buku kadang menggabung terlalu banyak konsep dalam satu subbab (bab 7.2 "Jenis-jenis Fungsi" = 15 halaman), kadang memecah konsep yang sama jadi dua (logaritma 4.2+4.3 = sifat +/− basis sama). Nama & granularitas ditentukan sendiri, lihat §11.2 |
| 2 | Cakupan gerbang prasyarat | **Diperluas ke semua tab baru** (sebelumnya cuma Trigonometri, keputusan #10 di §1 direvisi) |
| 3 | Sumber gerbang antar-tab | `RENCANA[].prasyarat` di file prota — *seluruh* sub-materi bab prasyarat harus master dulu, bukan cuma representasi sebagian |
| 4 | Kerumitan gerbang di tab baru | **Rantai sekuensial dulu** (tiap sub-materi cuma butuh satu pendahulu langsung). Jaringan bercabang ala Trigonometri (bukti `konsep_prasyarat`, banyak-ke-banyak) baru disusun setelah soalnya ada dan polanya kelihatan — persis riwayat Trigonometri sendiri |
| 5 | "Pengenalan Eksponen" | **Ditolak** sebagai sub-materi tab Eksponen — pangkat bilangan bulat positif materi SMP, bukan hal baru di kelas X. Kalau untuk remedial, masuk **tab Prasyarat**, bukan tab Eksponen |
| 6 | Fungsi Eksponen/Logaritma | **Dimasukkan** — bukan subbab resmi buku, tapi ROADMAP di file prota sendiri menandainya sebagai celah CP Fase E/SNBT |
| 7 | Folder `artefak/` (stub lama, "percobaan_gagal") | **Diabaikan sepenuhnya** — pengingat sejarah, bukan bahan baku |
| 8 | Sumber soal SNBT/TKA (disebut di `RAMBU_ASESMEN`) | **Ditunda** — pemilik proyek sudah punya referensi soal asli, akan dipakai belakangan, di luar rencana ini dulu |

### 11.2 Prinsip penamaan sub-materi

1. Frasa benda (noun phrase), Title Case — bukan kalimat instruksi.
2. Nama menggambarkan **konsep**, bukan lokasi di buku (tidak ada "7.2"/"Bab 6" dalam nama).
3. "Dasar"/"Lanjutan" hanya untuk jenjang tingkat yang jelas — bukan tempat sampah generik.
4. Akronim baku dalam kurung untuk istilah yang memang lazim disingkat guru/siswa (PLSV, SPLDV, SPLTV, FPB/KPK) — bukan singkatan buatan sendiri.
5. Varian dalam kurung untuk memecah satu konsep jadi beberapa sub-materi paralel (pola sudah ada: "Sudut Berelasi (Horizontal/Vertikal)").
6. **Pisah** kalau dua konsep butuh mastery terpisah — indikator: teknik pengerjaan beda, atau prota menandainya sebagai unit asesmen/proyek sendiri, atau jumlah halaman subbab jauh di atas tetangganya.
7. **Gabung** kalau dua subbab cuma dipecah demi tata letak buku, padahal satu keterampilan sama (indikator: berdekatan, kecil, salah satu operasi invers dari yang lain).

### 11.3 Rename engine (2026-07-26)

`PRASYARAT_TRIGONOMETRI` → **`PETA_PRASYARAT`** di `kurikulumData.js` — satu tabel gabungan untuk gerbang tab manapun, bukan cuma Trigonometri. Mesinnya (`hitungStatusKunci`) sudah generik sejak awal, jadi tidak ada perubahan logika, cuma nama + isi tabel. Semua pemanggil ikut diperbarui: `pilihMateri.js`, `petaMateri.js`, `kurikulumEngine.test.js`, `tataLetakPeta.test.js`, `gate-a-audit-kurikulum.mjs`.

`DAFTAR_MATERI_INTI` bertambah: `["Eksponen", "Logaritma", "Trigonometri", "Sistem Persamaan"]` — tab baru lain menyusul per fase (§11.5).

**Teorema Pythagoras** pindah dari tab Prasyarat ke tab **Trigonometri** sendiri (sesuai buku, subbab 2.2 — tepat sebelum rasio sisi-sisi 2.3), sebagai sub-materi Trigonometri PERTAMA di `PETA_TAHAPAN`. Ia tetap gerbang untuk "Rasio Trigonometri Dasar" — mekanismenya di `PETA_PRASYARAT` tidak berubah, cuma `materi_utama`-nya.

### 11.4 Gerbang antar-tab (diturunkan dari `RENCANA[].prasyarat`)

| Tab | Digerbangkan oleh | Sumber |
|---|---|---|
| Eksponen, Relasi dan Fungsi, Persamaan Kuadrat, Sistem Persamaan, Kaidah Pencacahan | — (terbuka) | Bab 1/7/5/3/10 prasyarat `[]` |
| Trigonometri | Teorema Pythagoras (gerbang internal, sudah ada) | Independen dari rantai bab |
| Peluang (11.x, dalam tab Kaidah Pencacahan & Peluang yang sama) | Semua sub-materi Kaidah Pencacahan (10.x) | Bab 11 prasyarat `["bab10"]` |
| Logaritma | Semua sub-materi Eksponen | Bab 4 prasyarat `["bab1"]` |
| Fungsi Kuadrat | Semua sub-materi Relasi dan Fungsi + Persamaan Kuadrat | Bab 9 prasyarat `["bab7","bab5"]` |
| Pertidaksamaan | Semua sub-materi Eksponen + Fungsi Kuadrat + Sistem Persamaan | Bab 6 prasyarat `["bab1","bab9","bab3"]` |
| Fungsi Rasional | Semua sub-materi Relasi dan Fungsi + Fungsi Kuadrat + Pertidaksamaan | Bab 8 prasyarat `["bab7","bab9","bab6"]` |
| Nilai Mutlak | **Semua** sub-materi semua tab lain | Bab sisipan prasyarat `["semua"]` — kasus khusus, dikerjakan terakhir (Fase 9) |

Entri gerbang di atas baru bisa ditulis ke `PETA_PRASYARAT` setelah tab prasyaratnya benar-benar punya sub-materi lengkap (mis. gerbang Logaritma baru final setelah Fase 1/Eksponen selesai seluruhnya).

### 11.5 Rencana bertahap

**Fase 0 (kode, sedang berjalan)** — rename engine (§11.3), reklasifikasi 3 kelompok sub-materi existing tanpa soal baru:
- Tab "Sistem Persamaan" baru: "Persamaan Linear Satu Variabel (PLSV)" · "Sistem Persamaan Linear Dua Variabel (SPLDV)" · "Sistem Persamaan Linear Tiga Variabel (SPLTV)" — Tahap 1/2/3 masing-masing.
- "Operasi Bentuk Akar" → tab Eksponen (`Tahap 1: Eksponen dan Bentuk Akar`).
- "Teorema Pythagoras" → tab Trigonometri (§11.3).

Fase 1–9 (isi konten baru, urutan mengikuti `RENCANA[].urut`): Eksponen (+ Fungsi Eksponen) → Logaritma (+ Fungsi Logaritma) → Relasi dan Fungsi → Persamaan Kuadrat → Fungsi Kuadrat → *(Sistem Persamaan sudah kelar di Fase 0)* → Pertidaksamaan → Fungsi Rasional → Kaidah Pencacahan & Peluang → Nilai Mutlak. Rincian sub-materi tiap fase (nama + status baru/pindah/split/gabung) ada di riwayat obrolan penyusunan rencana ini — dipindahkan ke sini saat fase itu benar-benar dikerjakan, supaya bagian ini tidak jadi terlalu panjang sebelum konten aslinya ada.

### 11.6 Alur impor aman (menghindari duplikat)

`upsertSoalImportDB`: ada `id` di JSON → replace dokumen; tanpa `id` → dokumen baru. Konsekuensinya:
- **Soal benar-benar baru** (belum ada di Firestore): tulis JSON tanpa `id`, aman diimpor langsung — pola yang sudah dipakai di §10.
- **Reklasifikasi soal existing** (ganti `materi_utama`/`sub_materi` pada soal yang SUDAH ada di Firestore, seperti Fase 0 di atas): **wajib** diekspor dulu lewat `admin.html` → Bank Soal → filter sub-materi → "Unduh JSON" (otomatis menyertakan `id`), field-nya diedit dengan `id` tetap utuh, baru diimpor ulang — supaya jadi *replace*, bukan duplikat. Setiap kali sebuah fase butuh langkah ini, akan ditandai eksplisit sebelum soal ditulis/diedit.

### 11.7 Status saat ini

**Fase 0 — SELESAI (kode + data), terverifikasi 2026-07-26.** Kode lolos Jest + Gate A sejak commit `d4b74c3`. Reklasifikasi 5 kelompok soal (lihat §11.6) sudah diekspor dari `admin.html`, diedit (`materi_utama`/`sub_materi`, `id` tetap utuh), dan diimpor ulang oleh pemilik proyek. Diverifikasi dengan ekspor "semua materi" segar dari Firestore live (`arsip-data/bank_soal_all.json`, 680 soal) dijalankan lewat Gate A — **✅ LOLOS**, nol deadlock, DAG valid, kelima sub-materi berada di `materi_utama` yang benar dengan 10 soal masing-masing:

1. "Persamaan Linear Satu Variabel (PLSV)" — `materi_utama: "Sistem Persamaan"`.
2. "Sistem Persamaan Linear Dua Variabel (SPLDV)" — `materi_utama: "Sistem Persamaan"`.
3. "Sistem Persamaan Linear Tiga Variabel (SPLTV)" — `materi_utama: "Sistem Persamaan"`.
4. "Operasi Bentuk Akar" — `materi_utama: "Eksponen"`.
5. "Teorema Pythagoras" — `materi_utama: "Trigonometri"`.

Tab "Sistem Persamaan" sekarang aktif dan terisi penuh di `pilih-materi.html`. Siap lanjut ke Fase 1.

**Housekeeping selesai (2026-07-26).** `arsip-data/bank_soal.json` (455 soal, kedaluwarsa) dihapus. `gate-a-audit-kurikulum.mjs` sekarang menunjuk ke `arsip-data/bank_soal_all.json` (715 soal unik gabungan seluruh dump per audit terakhir) sebagai sumber utama — nama berkas ini sengaja dipertahankan karena itulah nama default saat diekspor lewat `admin.html` → Bank Soal → "Unduh JSON" tanpa filter. Ekspor ulang berkas yang sama (timpa langsung) setiap kali butuh audit terbaru.

**Fase 1 — SELESAI (kode + data), terverifikasi 2026-07-26.** Tab Eksponen sekarang berisi 5 sub-materi (40 soal baru + Operasi Bentuk Akar dari Fase 0):

1. **Sifat Eksponen Bilangan Bulat** (Tahap 1) — pangkat positif/negatif/nol, sifat kali/bagi basis sama, pangkat berpangkat.
2. **Operasi Bentuk Akar** (Tahap 2, sudah ada sejak Fase 0).
3. **Merasionalkan Penyebut** (Tahap 2) — penyebut tunggal & berbentuk sekawan ($a \pm \sqrt{b}$).
4. **Eksponen Rasional (Pangkat Pecahan)** (Tahap 3) — konversi pangkat pecahan ↔ akar dua arah.
5. **Fungsi Eksponen** (Tahap 4, sisipan) — evaluasi $f(x)=a^x$, konteks pertumbuhan.

Gerbang ditambahkan sebagai **rantai sekuensial** di `PETA_PRASYARAT` (§11 keputusan #4): Sifat Eksponen Bilangan Bulat → Operasi Bentuk Akar → Merasionalkan Penyebut → Eksponen Rasional → Fungsi Eksponen. Soal ditulis & diimpor **sebelum** gerbangnya ditambahkan ke kode (bukan urutan sebaliknya seperti Fase 0) — supaya "Operasi Bentuk Akar" yang sudah live tidak pernah mendadak terkunci di rentang waktu antara push kode dan impor data. Ini pola yang dipakai untuk semua fase berikutnya yang menambah gerbang baru pada sub-materi yang sudah live.

`PETA_TAHAPAN` direfaktor jadi blok per tab (`TAHAPAN_EKSPONEN`, `TAHAPAN_SISTEM_PERSAMAAN`, `TAHAPAN_PRASYARAT_SMP`, `TAHAPAN_TRIGONOMETRI`, digabung lewat spread) supaya batas "mana yang tab Prasyarat SMP (tak pernah dikunci) vs mana yang tab materi utama (boleh digerbang)" tidak lagi bergantung pada posisi/komentar. `SUB_MATERI_PRASYARAT_SMP` diekspor dari `kurikulumData.js` untuk keperluan ini; test `kurikulumEngine.test.js` yang lama ("hanya materi tab Trigonometri yang dikunci", berasumsi posisi-sebelum-Trigonometri = tab Prasyarat) diganti jadi cek keanggotaan `SUB_MATERI_PRASYARAT_SMP`, karena asumsi lama gugur sejak gerbang meluas ke tab lain.

Diverifikasi dengan ekspor Firestore live segar (720 soal) lewat Gate A — **✅ LOLOS**, DAG 38 node valid, kelima sub-materi Eksponen 10 soal masing-masing di `materi_utama: "Eksponen"`. Test Jest 95/95 lolos (tambahan: cek rantai gerbang Eksponen bisa dibuka berurutan tanpa deadlock).

**Catatan terbuka:** gerbang antar-tab Logaritma → "semua sub-materi Eksponen" (§11.4) sekarang **bisa** ditulis karena tab Eksponen sudah lengkap 5/5 — akan ditambahkan saat Fase 2 (Logaritma) dikerjakan.

**Fase 2 — Logaritma, SELESAI (kode + data), terverifikasi 2026-07-26.** 6 sub-materi baru (60 soal) untuk tab Logaritma:

1. **Pengenalan Logaritma** (Tahap 1) — definisi & notasi $\log_a b=c \iff a^c=b$, syarat basis, evaluasi langsung.
2. **Sifat Operasi Logaritma** (Tahap 2) — gabungan 4.2+4.3 buku (penjumlahan & pengurangan basis sama, satu sifat dua arah), plus sifat pangkat.
3. **Mengubah Basis Logaritma** (Tahap 3) — rumus ubah basis, sifat kebalikan basis, rantai basis berseri.
4. **Identitas Pangkat Logaritma** (Tahap 4) — $a^{\log_a b}=b$ dan variannya.
5. **Persamaan Logaritma** (Tahap 5) — termasuk soal yang menguji kesadaran syarat numerus $>0$ (akar ganda, salah satu ditolak).
6. **Fungsi Logaritma** (Tahap 6, sisipan) — evaluasi $f(x)=\log_a x$, domain, satu soal konteks (desibel). Sama seperti "Fungsi Eksponen", menutup celah yang dicatat ROADMAP prota.

Gerbang: **"Pengenalan Logaritma" digerbangkan oleh SELURUH 5 sub-materi Eksponen** (bukan representasi sebagian — belum ada data `konsep_prasyarat` untuk memilih mana yang paling relevan), lalu rantai sekuensial internal seperti Eksponen. Karena keenam sub-materi ini seluruhnya baru (tidak ada yang sudah live), gerbang & soal ditulis **bersamaan** — tidak ada risiko regresi live seperti catatan di Fase 1.

`peta-materi.html` **catatan efek samping**: karena Eksponen(5)→Logaritma(6) tersambung jadi satu rantai lurus, kedalaman peta gabungan naik ke 11 kolom (dari sebelumnya ~8). Ambang tes `tataLetakPeta.test.js` dinaikkan ke 15 sebagai solusi sementara — **belum diputuskan** apakah peta ini akan tetap satu gabungan semua tab (akan makin panjang & sulit dibaca tiap fase baru) atau dipisah per tab. Perlu didiskusikan sebelum Fase 3+ menambah rantai lagi.

Diverifikasi dengan ekspor Firestore live segar (780 soal) lewat Gate A — **✅ LOLOS**, DAG 44 node valid, keenam sub-materi Logaritma 10 soal masing-masing di `materi_utama: "Logaritma"`. Test Jest 97/97 lolos (tambahan: cek rantai gerbang Logaritma bisa dibuka setelah Eksponen master, dan cek tab Logaritma tetap terkunci bila Eksponen belum lengkap).

Tab Logaritma sekarang aktif dan terisi penuh. Gerbang antar-tab Fungsi Kuadrat → "semua sub-materi Relasi dan Fungsi + Persamaan Kuadrat" (§11.4) masih menunggu kedua tab itu dibangun (Fase 3 & 4).

**Fase 3 — Relasi dan Fungsi, SELESAI (kode + data), terverifikasi 2026-07-26.** 5 sub-materi baru (50 soal) + 2 reklasifikasi/pindahan untuk tab Relasi dan Fungsi:

1. **Substitusi Fungsi Linear** (Tahap 1, pintu masuk) — **dipindahkan** dari tab Prasyarat (`materi_utama` "Aritmatika dan Aljabar Dasar" → "Relasi dan Fungsi"), sudah 10 soal live sejak §10.
2. **Definisi Relasi dan Fungsi** (Tahap 2, baru) — syarat fungsi, uji garis vertikal, domain-kodomain-range.
3. **Jenis-jenis Fungsi** (Tahap 3, baru) — fungsi konstan, identitas, linear, kuadrat (pengenalan).
4. **Fungsi Piecewise** (Tahap 4, baru) — evaluasi fungsi tercacah, termasuk konteks tarif berjenjang.
5. **Analisis Grafik Fungsi** (Tahap 5) — **tidak disentuh isinya**, cuma dipindah dari blok Prasyarat SMP di `PETA_TAHAPAN`; `materi_utama`-nya sudah persis "Relasi dan Fungsi" sejak awal jadi otomatis ikut tab baru tanpa reklasifikasi data.
6. **Sifat-sifat Fungsi** (Tahap 6, baru) — injektif, surjektif, bijektif.
7. **Operasi Aljabar Fungsi** (Tahap 7, baru) — jumlah/kurang/kali/bagi/komposisi fungsi.

Gerbang: tab ini **tidak punya gerbang antar-tab** (Bab 7 prasyarat `[]` di RENCANA prota) — rantai sekuensial internal saja: Substitusi Fungsi Linear → Definisi → Jenis-jenis → Piecewise → Sifat-sifat → Operasi Aljabar.

**"Analisis Grafik Fungsi" digerbang belakangan** — soal Fase 3 utama diimpor dulu (termasuk reklasifikasi "Substitusi Fungsi Linear" lewat ekspor-edit-impor ber-`id`), baru setelah "Fungsi Piecewise" dikonfirmasi live, entri `"Analisis Grafik Fungsi": ["Fungsi Piecewise"]` ditambahkan ke `PETA_PRASYARAT` — supaya sub-materi yang sudah live itu tidak sempat mendadak terkunci di rentang push-vs-impor (pola sama seperti Fase 1).

Diverifikasi dengan ekspor Firestore live segar (830 soal) lewat Gate A — **✅ LOLOS**, DAG 51 node valid, ketujuh sub-materi Relasi dan Fungsi 10 soal masing-masing di `materi_utama: "Relasi dan Fungsi"`, dan tidak ada sisa soal "Substitusi Fungsi Linear" tertinggal di grup lama. Test Jest 98/98 lolos (tambahan: cek rantai gerbang Relasi dan Fungsi bisa dibuka berurutan).

Tab Relasi dan Fungsi sekarang aktif dan terisi penuh. Gerbang antar-tab Fungsi Kuadrat → "semua sub-materi Relasi dan Fungsi + Persamaan Kuadrat" (§11.4) sekarang separuh siap (Relasi dan Fungsi selesai); masih menunggu tab Persamaan Kuadrat dibangun (Fase 4).

**Fase 4 — Persamaan Kuadrat, SELESAI (kode + data), terverifikasi 2026-07-26.** 3 sub-materi baru (30 soal) + 2 reklasifikasi (satu di antaranya rombak isi total) untuk tab Persamaan Kuadrat:

1. **Akar Persamaan Kuadrat** (Tahap 1, pintu masuk) — **rename** dari "Persamaan Kuadrat Dasar" (`materi_utama` "Aljabar Lanjutan" → "Persamaan Kuadrat"), isi TIDAK diubah: faktorisasi/kuadrat sempurna/rumus abc.
2. **Diskriminan dan Jenis Akar** (Tahap 2) — **rename + rombak total isi** dari "Persamaan Kuadrat Lanjutan" (`id` sama, `materi_utama` "Aljabar Lanjutan" → "Persamaan Kuadrat"). 10 soal lama campur diskriminan/Vieta/PK baru — ditulis ulang jadi murni diskriminan & jenis akar (mengganti seluruh `pertanyaan`/`opsi`/`jawaban_benar`/`pembahasan`, `id` tetap dipertahankan).
3. **Jumlah dan Hasil Kali Akar (Vieta)** (Tahap 3, baru) — 10 soal murni Vieta yang tadinya bercampur di "Lanjutan".
4. **Menyusun Persamaan Kuadrat Baru** (Tahap 4, baru) — 10 soal murni menyusun PK baru dari transformasi akar.
5. **Aplikasi Persamaan Kuadrat** (Tahap 5, baru) — konteks optimasi (luas maksimum, gerak parabola, keuntungan), sesuai `temaPM` Bab 5 di file prota.

Gerbang: Bab 5 prasyarat `[]` — tidak ada gerbang antar-tab. Rantai internal lengkap: Akar Persamaan Kuadrat → Diskriminan dan Jenis Akar → Vieta → Menyusun PK Baru → Aplikasi Persamaan Kuadrat. Gerbang pertama (`"Diskriminan dan Jenis Akar": ["Akar Persamaan Kuadrat"]`) sempat ditahan sampai kedua rename dikonfirmasi live, lalu ditambahkan begitu terverifikasi (pola sama seperti Fase 1/3).

Referensi lama di `PETA_PRASYARAT` juga diperbarui: "Persamaan Trigonometri Lanjutan" tadinya mensyaratkan `"Persamaan Kuadrat Dasar"`, sekarang `"Akar Persamaan Kuadrat"`.

Diverifikasi dengan ekspor Firestore live segar (860 soal) lewat Gate A — **✅ LOLOS**, DAG 55 node valid, kelima sub-materi Persamaan Kuadrat 10 soal masing-masing di `materi_utama: "Persamaan Kuadrat"`, nama lama ("Persamaan Kuadrat Dasar"/"Lanjutan") sudah 0 soal (tidak ada sisa). Test Jest 98/98 lolos.

Tab Persamaan Kuadrat sekarang aktif dan terisi penuh. Gerbang antar-tab Fungsi Kuadrat → "semua sub-materi Relasi dan Fungsi + Persamaan Kuadrat" (§11.4) sekarang **bisa ditulis penuh** — kedua tab prasyaratnya sudah lengkap. Akan ditambahkan saat Fase 5 (Fungsi Kuadrat) dikerjakan.

**Fase 5 — Fungsi Kuadrat, SELESAI (kode + data), terverifikasi 2026-07-26.** 2 sub-materi baru (20 soal) + 1 reklasifikasi (rename saja, isi tidak diubah) untuk tab Fungsi Kuadrat, dari Bab 9 prota (subbab 9.1 Definisi dan Karakteristik / 9.2 Menyusun Persamaan Parabola / 9.3 Penyelesaian Masalah):

1. **Sifat dan Grafik Fungsi Kuadrat** (Tahap 1, pintu masuk) — **rename** dari "Fungsi Kuadrat" (`materi_utama` "Aljabar Lanjutan" → "Fungsi Kuadrat", tab Prasyarat → tab sendiri), isi TIDAK diubah: sifat & grafik parabola (arah buka, titik puncak, translasi, akar dari grafik).
2. **Menyusun Persamaan Parabola** (Tahap 2, baru) — menyusun persamaan dari akar-akar+titik, titik puncak+titik, tiga titik sembarang, akar kembar (tangen sumbu X), dan penalaran sumbu simetri.
3. **Aplikasi Fungsi Kuadrat** (Tahap 3, baru) — pemodelan dari deskripsi verbal (bukan fungsi yang sudah diberikan) lalu optimasi lewat titik puncak: luas maksimum berpagar, lintasan proyektil, titik impas (BEP), laba maksimum — sesuai `temaPM` Bab 9 ("Model lintasan, titik impas, laba maksimum").

Gerbang: **"Sifat dan Grafik Fungsi Kuadrat" digerbangkan oleh SELURUH sub-materi Relasi dan Fungsi (7) + SELURUH sub-materi Persamaan Kuadrat (5)** — beda dari Fase 1/3/4, gerbang ini **langsung ditulis penuh sekaligus** (tidak ditunda) karena kedua tab prasyaratnya sudah lengkap & terverifikasi sejak Fase 3 & 4. Konsekuensi yang disengaji: begitu data reimport (nama baru) masuk, 10 soal "Sifat dan Grafik Fungsi Kuadrat" yang sebelumnya TIDAK PERNAH terkunci (tab Prasyarat) langsung menjadi gerbang pertama tab baru — bagian dari promosi "Fungsi Kuadrat" jadi tab materi utama sendiri, bukan bug. Rantai internal: Sifat dan Grafik → Menyusun Persamaan Parabola → Aplikasi Fungsi Kuadrat.

`TAHAPAN_FUNGSI_KUADRAT` ditambahkan ke `PETA_TAHAPAN`; entri "fungsi kuadrat" dihapus dari `TAHAPAN_PRASYARAT_SMP` (Tahap 5: Area Kuadratik kini cuma 3 sub-materi tersisa).

**Alur impor**: dua file baru (`bank_soal_menyusun_persamaan_parabola.json`, `bank_soal_aplikasi_fungsi_kuadrat.json`, tanpa `id`) aman diimpor langsung. File reklasifikasi (`~/Downloads/reimport/bank_soal_sifat_dan_grafik_fungsi_kuadrat.json`, `id` diambil dari ekspor Firestore live terakhir, `materi_utama`/`sub_materi` diganti) **wajib** diimpor lewat jalur replace (§11.6), bukan file baru — supaya tidak duplikat dengan 10 soal "Fungsi Kuadrat" lama.

Diverifikasi dengan ekspor Firestore live segar (880 soal) lewat Gate A — **✅ LOLOS**, DAG 58 node valid, tidak ada deadlock, ketiga sub-materi Fungsi Kuadrat 10 soal masing-masing di `materi_utama: "Fungsi Kuadrat"`, nama lama ("Fungsi Kuadrat" di tab Prasyarat) sudah 0 soal (tidak ada sisa). Test Jest 100/100 lolos.

Tab Fungsi Kuadrat sekarang aktif dan terisi penuh — 6 dari 8 tab baru selesai (Eksponen, Logaritma, Sistem Persamaan, Relasi dan Fungsi, Persamaan Kuadrat, Fungsi Kuadrat). Gerbang antar-tab Pertidaksamaan → "semua sub-materi Eksponen + Fungsi Kuadrat + Sistem Persamaan" (§11.4) sekarang **bisa ditulis penuh** — ketiga tab prasyaratnya sudah lengkap. Akan ditambahkan saat Fase 6 (Pertidaksamaan) dikerjakan.

**Fase 6 — Pertidaksamaan, SELESAI (kode + data), terverifikasi 2026-07-26.** 5 sub-materi baru (50 soal) + 1 reklasifikasi (`materi_utama` saja, isi tidak diubah) untuk tab Pertidaksamaan, dari Bab 6 prota (subbab 6.1 Pertidaksamaan Linear — termasuk Program Linear / 6.2 Pertidaksamaan Kuadrat / 6.3 Pertidaksamaan Rasional / 6.4 Pertidaksamaan Irasional / 6.5 Penyelesaian Masalah):

1. **Pertidaksamaan Linear** (Tahap 1, pintu masuk, baru) — **dipecah** dari subbab 6.1 buku bersama Program Linear (dua unit asesmen berbeda di prota: UH tulis vs proyek, jadi layak dipisah, bukan digabung sesuai judul buku). Solusi pertidaksamaan linear satu variabel, majemuk, dan pecahan.
2. **Program Linear** (Tahap 2, baru) — sisi lain subbab 6.1: menyusun sistem pertidaksamaan dari kendala verbal, mencari titik pojok daerah penyelesaian, mengevaluasi fungsi objektif (maksimum/minimum).
3. **Pertidaksamaan Kuadrat** (Tahap 3) — **reklasifikasi** `materi_utama` saja ("Aljabar Lanjutan" → "Pertidaksamaan"), nama TIDAK diubah (sudah persis subbab 6.2 buku), isi tidak disentuh.
4. **Pertidaksamaan Rasional** (Tahap 4, baru) — pertidaksamaan bentuk pecahan aljabar, garis bilangan tanda dengan titik kritis dari pembilang & penyebut.
5. **Pertidaksamaan Irasional** (Tahap 5, baru) — pertidaksamaan bentuk akar, analisis domain + kasus pengkuadratan.
6. **Aplikasi Pertidaksamaan** (Tahap 6, baru) — dari subbab 6.5 "Penyelesaian Masalah" (nama disesuaikan standar "Aplikasi X"), konteks linear/kuadrat/rasional gabungan sesuai `temaPM` Bab 6 ("Optimasi produksi & batas anggaran").

Gerbang: **"Pertidaksamaan Linear" digerbangkan oleh SELURUH sub-materi Eksponen (5) + Fungsi Kuadrat (3) + Sistem Persamaan (3)** — sama seperti Fase 5, gerbang ini **langsung ditulis penuh sekaligus** (tidak ditunda) karena ketiga tab prasyaratnya sudah lengkap & terverifikasi (Fase 1, 5, dan 0). Rantai internal: Pertidaksamaan Linear → Program Linear → Pertidaksamaan Kuadrat → Pertidaksamaan Rasional → Pertidaksamaan Irasional → Aplikasi Pertidaksamaan (urutan sekuensial mengikuti urutan subbab buku, bukan berdasarkan dependensi konten sebenarnya — konsisten dengan keputusan "sekuensial dulu, prasyarat rumit belakangan" di §11).

`TAHAPAN_PERTIDAKSAMAAN` ditambahkan ke `PETA_TAHAPAN` (ditempatkan setelah `TAHAPAN_SISTEM_PERSAMAAN` dalam urutan spread — urutan ini penting karena `validasiKurikulum` memakai urutan `Object.keys(PETA_TAHAPAN)` untuk mendeteksi "prasyarat diajarkan sebelum materinya"; SPLDV/SPLTV harus muncul sebelum Pertidaksamaan Linear di urutan itu). Entri "pertidaksamaan kuadrat" dihapus dari `TAHAPAN_PRASYARAT_SMP` (Tahap 5: Area Kuadratik kini cuma 2 sub-materi tersisa). "Sistem Persamaan Linear Dua/Tiga Variabel (SPLDV/SPLTV)" untuk pertama kalinya jadi node di `PETA_PRASYARAT` (sebagai akar/prasyarat, bukan target) — sebelumnya tak pernah dirujuk di tabel ini.

**Alur impor**: 5 file baru (`bank_soal_pertidaksamaan_linear.json`, `bank_soal_program_linear.json`, `bank_soal_pertidaksamaan_rasional.json`, `bank_soal_pertidaksamaan_irasional.json`, `bank_soal_aplikasi_pertidaksamaan.json`, semua tanpa `id`) aman diimpor langsung. File reklasifikasi (`~/Downloads/reimport/bank_soal_pertidaksamaan_kuadrat.json`, `id` dipertahankan, hanya `materi_utama` yang diganti) **wajib** diimpor lewat jalur replace (§11.6) — meski nama `sub_materi`-nya sama persis dengan yang lama, field `materi_utama` tetap harus di-replace supaya soal ini ikut pindah tab di `pilih-materi.html`.

Kode lolos Jest 102/102 lokal (tambahan: cek rantai gerbang Pertidaksamaan bisa dibuka setelah Eksponen + Fungsi Kuadrat + Sistem Persamaan master, dan cek tab ini tetap terkunci bila Sistem Persamaan belum lengkap). Gate A lokal (arsip campuran) LOLOS tanpa deadlock — beda dari pola rename Fase 4/5, di sini "pertidaksamaan kuadrat" tidak perlu menunggu reimport untuk *terlihat* di Gate A karena nama `sub_materi`-nya tidak berubah (cuma `materi_utama`), tapi reimport tetap wajib di Firestore live agar soal itu benar-benar pindah tab.

`peta-materi.html` **catatan**: kolom peta gabungan sekarang tepat di ambang `15` (naik dari sebelumnya, karena rantai Eksponen→Pertidaksamaan makin panjang). Ambang test belum perlu dinaikkan lagi, tapi ini sinyal makin kuat bahwa keputusan pemisahan peta per tab (masih **belum diputuskan**, lihat catatan Fase 2) akan segera dibutuhkan di fase-fase berikutnya.

Diverifikasi dengan ekspor Firestore live segar (930 soal) lewat Gate A — **✅ LOLOS**, DAG 66 node valid, tidak ada deadlock, keenam sub-materi Pertidaksamaan 10 soal masing-masing di `materi_utama: "Pertidaksamaan"` (termasuk "Pertidaksamaan Kuadrat" yang sudah berpindah tab meski nama `sub_materi`-nya tidak berubah). Test Jest 102/102 lolos.

Tab Pertidaksamaan sekarang aktif dan terisi penuh — 7 dari 8 tab baru selesai (Eksponen, Logaritma, Sistem Persamaan, Relasi dan Fungsi, Persamaan Kuadrat, Fungsi Kuadrat, Pertidaksamaan). Gerbang antar-tab Fungsi Rasional → "semua sub-materi Relasi dan Fungsi + Fungsi Kuadrat + Pertidaksamaan" (§11.4) sekarang **bisa ditulis penuh** — ketiga tab prasyaratnya sudah lengkap. Akan ditambahkan saat Fase 7 (Fungsi Rasional) dikerjakan.

**Fase 7 — Fungsi Rasional, SELESAI (kode + data), terverifikasi 2026-07-26.** 4 sub-materi baru (40 soal), semuanya baru (tidak ada reklasifikasi), untuk tab Fungsi Rasional, dari Bab 8 prota (subbab beralfabet A. Pengertian / B. Mengidentifikasi / C. Domain / D. Daerah Hasil (Range) / E. Asimtot / F. Menggambar Fungsi Rasional):

1. **Pengertian Fungsi Rasional** (Tahap 1, pintu masuk) — **gabungan** subbab A+B buku (definisi bentuk $\frac{p(x)}{q(x)}$ + identifikasi contoh/bukan-contoh) — terlalu tipis untuk 2 sub-materi terpisah mengingat total bab ini cuma 8 JP. Termasuk pengantar konsep lubang (hole) lewat penyederhanaan aljabar.
2. **Domain dan Range Fungsi Rasional** (Tahap 2) — **gabungan** subbab C+D buku (dua sisi dari batasan nilai yang berkaitan: domain dari titik tak terdefinisi penyebut, range dari nilai yang tidak pernah dicapai akibat asimtot horizontal).
3. **Asimtot Fungsi Rasional** (Tahap 3) — subbab E, tetap sendiri (substansial, 6 halaman buku): asimtot vertikal, horizontal (3 kasus derajat), dan miring (oblique).
4. **Menggambar Grafik Fungsi Rasional** (Tahap 4) — subbab F, sintesis akhir: titik potong sumbu, lubang vs asimtot, sketsa grafik dari ciri-ciri yang diberikan.

Catatan: bab ini **di luar CP Fase E resmi** (dicatat ROADMAP prota) dan dinilai lewat **proyek** ("Analisis Grafik"), bukan UH tulis — konsisten dengan tidak adanya sub-materi "Aplikasi" terpisah seperti fase-fase lain; "Menggambar Grafik Fungsi Rasional" sudah berfungsi sebagai sintesis akhirnya.

Gerbang: **"Pengertian Fungsi Rasional" digerbangkan oleh SELURUH sub-materi Relasi dan Fungsi (7) + Fungsi Kuadrat (3) + Pertidaksamaan (6)** — sama seperti Fase 5/6, gerbang ini **langsung ditulis penuh sekaligus** (tidak ditunda) karena ketiga tab prasyaratnya sudah lengkap & terverifikasi (Fase 3, 5, dan 6). Rantai internal: Pengertian → Domain dan Range → Asimtot → Menggambar Grafik. Karena keempat sub-materi ini seluruhnya baru (tidak ada yang sudah live sebelumnya), tidak ada risiko regresi live seperti Fase 5/6.

`TAHAPAN_FUNGSI_RASIONAL` ditambahkan ke `PETA_TAHAPAN`, ditempatkan setelah `TAHAPAN_PERTIDAKSAMAAN` dalam urutan spread (urutan ini dipakai `validasiKurikulum` untuk cek "prasyarat diajarkan sebelum materinya" — seluruh sub-materi Pertidaksamaan harus muncul sebelum Fungsi Rasional).

**Alur impor**: 4 file baru (`bank_soal_pengertian_fungsi_rasional.json`, `bank_soal_domain_dan_range_fungsi_rasional.json`, `bank_soal_asimtot_fungsi_rasional.json`, `bank_soal_menggambar_grafik_fungsi_rasional.json`, semua tanpa `id`) aman diimpor langsung — tidak ada file reklasifikasi di fase ini.

Kode lolos Jest 104/104 lokal (tambahan: cek rantai gerbang Fungsi Rasional bisa dibuka setelah Relasi dan Fungsi + Fungsi Kuadrat + Pertidaksamaan master, dan cek tab ini tetap terkunci bila Pertidaksamaan belum lengkap). Gate A lokal LOLOS tanpa deadlock, DAG 70 node valid.

`peta-materi.html` **catatan penting**: kolom peta gabungan melonjak ke **19** (dari ambang 15 sebelumnya) karena "Pengertian Fungsi Rasional" mewarisi kedalaman rantai Pertidaksamaan yang sendirinya mewarisi rantai Eksponen. Ambang test dinaikkan lagi jadi **20** — ini kenaikan ke-3 (8→15 Fase 2, 15→20 di sini) hanya dalam 7 fase. Peta gabungan **sudah** sulit dibaca, bukan lagi sekadar berisiko; keputusan pemisahan peta per tab (masih belum diputuskan sejak Fase 2) semestinya diambil sebelum fase-fase berikutnya menambah kedalaman lagi.

Diverifikasi dengan ekspor Firestore live segar (970 soal) lewat Gate A — **✅ LOLOS**, DAG 70 node valid, tidak ada deadlock, keempat sub-materi Fungsi Rasional 10 soal masing-masing di `materi_utama: "Fungsi Rasional"`. Test Jest 104/104 lolos.

Tab Fungsi Rasional sekarang aktif dan terisi penuh — 8 dari 8 tab bab-utama selesai (Eksponen, Logaritma, Sistem Persamaan, Relasi dan Fungsi, Persamaan Kuadrat, Fungsi Kuadrat, Pertidaksamaan, Fungsi Rasional). Sisa 2 fase di §11.5: Fase 8 (Kaidah Pencacahan & Peluang) dan Fase 9 (Nilai Mutlak) — keduanya berdiri sendiri tanpa gerbang antar-tab rumit (Bab 10 prasyarat `[]`, Bab 11 prasyarat `["bab10"]` saja), jadi tidak akan menambah kedalaman peta gabungan seperti fase-fase sebelumnya.

**Fase 8 — Kaidah Pencacahan & Peluang, SELESAI (kode + data), terverifikasi 2026-07-27.** 6 sub-materi baru (60 soal), semuanya baru (tidak ada reklasifikasi), untuk tab baru "Kaidah Pencacahan & Peluang" — satu tab UI yang menggabungkan **dua bab buku sekaligus** (Bab 10 Kaidah Pencacahan, Bab 11 Peluang), karena Bab 11 di RENCANA prota digerbang penuh oleh Bab 10 (`prasyarat:["bab10"]`) sehingga secara pedagogis ia memang lanjutan langsung, bukan tab terpisah:

1. **Aturan Penjumlahan dan Perkalian** (Tahap 1, pintu masuk) — subbab 10.1, kaidah dasar berhitung (aturan penjumlahan untuk kejadian saling lepas, aturan perkalian untuk tahap berurutan).
2. **Permutasi** (Tahap 2) — subbab 10.2: susunan berurutan, termasuk faktorial, permutasi dengan unsur berulang, dan permutasi siklis.
3. **Kombinasi** (Tahap 3) — subbab 10.3: pemilihan tanpa memperhatikan urutan.
4. **Ruang Sampel dan Peluang Kejadian Tunggal** (Tahap 4, pintu masuk Bab 11) — **dipendekkan** dari judul subbab 11.1 asli ("Ruang Sampel, Peluang Kejadian Tunggal dan Komplemennya") agar konsisten dengan gaya penamaan tab lain; isinya tetap mencakup komplemen.
5. **Frekuensi Relatif dan Harapan** (Tahap 5) — subbab 11.2.
6. **Peluang Kejadian Majemuk** (Tahap 6) — subbab 11.3: kejadian saling lepas vs tidak saling lepas, saling bebas, dan peluang bersyarat sederhana (pengambilan tanpa pengembalian).

Gerbang: **"Aturan Penjumlahan dan Perkalian" (pintu masuk tab) TIDAK digerbang tab lain** — Bab 10 prasyarat `[]` di RENCANA prota, sama seperti Persamaan Kuadrat/Relasi dan Fungsi di fase-fase awal. **"Ruang Sampel dan Peluang Kejadian Tunggal" (pintu masuk Bab 11) digerbangkan oleh SELURUH sub-materi Kaidah Pencacahan (Aturan Penjumlahan dan Perkalian, Permutasi, Kombinasi)** — pola sama seperti gerbang antar-tab di fase lain, hanya saja di sini kedua sisi gerbang ada di tab UI yang sama. Rantai internal: Aturan Penjumlahan dan Perkalian → Permutasi → Kombinasi → Ruang Sampel dan Peluang Kejadian Tunggal → Frekuensi Relatif dan Harapan → Peluang Kejadian Majemuk. Dicek di seluruh field `prasyarat` RENCANA prota: **tidak ada bab lain yang menjadikan Bab 10/11 sebagai prasyaratnya** (satu-satunya pengecualian Nilai Mutlak/Fase 9, yang butuh "semua" tab sebagai kasus khusus), jadi tab ini juga tidak menggerbang tab manapun.

`TAHAPAN_KAIDAH_PENCACAHAN_PELUANG` ditambahkan ke `PETA_TAHAPAN`, ditempatkan setelah `TAHAPAN_FUNGSI_RASIONAL` dalam urutan spread (mengikuti urutan ajar prota: Fase 8 setelah Fase 7).

**Alur impor**: 6 file baru (`bank_soal_aturan_penjumlahan_dan_perkalian.json`, `bank_soal_permutasi.json`, `bank_soal_kombinasi.json`, `bank_soal_ruang_sampel_dan_peluang_kejadian_tunggal.json`, `bank_soal_frekuensi_relatif_dan_harapan.json`, `bank_soal_peluang_kejadian_majemuk.json`, semua tanpa `id`) aman diimpor langsung — tidak ada file reklasifikasi di fase ini.

Kode lolos Jest 114/114 lokal (tambahan: cek rantai gerbang Kaidah Pencacahan & Peluang bisa dibuka secara sekuensial tanpa gerbang antar-tab, dan cek Bab 11/Peluang tetap terkunci bila Bab 10/Kaidah Pencacahan belum lengkap). Gate A lokal LOLOS tanpa deadlock, DAG 76 node valid.

`peta-materi.html`: ambang kolom test **TETAP 20** (tidak dinaikkan) — tab ini tidak digerbang tab manapun dan tidak menggerbang tab lain, jadi tidak menambah kedalaman jalur terpanjang (jalur terpanjang tetap dari rantai Fungsi Rasional/Fase 7). Node bertambah 70→76 (+5 target, +1 akar baru "Aturan Penjumlahan dan Perkalian" karena pintu masuk tab ini — beda dari kebanyakan tab lain — tidak digerbang tab sebelumnya).

Diverifikasi dengan ekspor Firestore live segar (1030 soal) lewat Gate A — **✅ LOLOS**, DAG 76 node valid, tidak ada deadlock, keenam sub-materi baru 10 soal masing-masing di `materi_utama: "Kaidah Pencacahan & Peluang"`. Test Jest 114/114 lolos.

Sisa 1 fase di §11.5: **Fase 9 (Nilai Mutlak)** — sisipan lintas-semua-tab (prasyarat `["semua"]`), sengaja dikerjakan paling akhir.

**Fase 9 — Nilai Mutlak, SELESAI (kode + data), terverifikasi 2026-07-27. Roadmap §11.5 tuntas — seluruh kurikulum kelas X sekarang tercakup.** 4 sub-materi baru (40 soal), tab sisipan "Nilai Mutlak" yang TIDAK ada di buku cetak (RENCANA prota: handout ±15 halaman, prasyarat literal `["semua"]`):

1. **Definisi dan Sifat Nilai Mutlak** (Tahap 1, pintu masuk) — definisi piecewise $|x|$, makna geometris (jarak dari 0), sifat dasar ($|ab|=|a||b|$, $\sqrt{x^2}=|x|$, pertidaksamaan segitiga). Judul "Definisi dan sifat" di RENCANA **diperjelas** jadi "Definisi dan Sifat Nilai Mutlak" — tiga sub-materi lain sudah menyebut "nilai mutlak" di judulnya sendiri, judul asli ini satu-satunya yang generik.
2. **Persamaan Nilai Mutlak** (Tahap 2) — $|x|=a$, kasus tanpa penyelesaian ($a<0$), persamaan dua nilai mutlak ($|f(x)|=|g(x)|$).
3. **Pertidaksamaan Nilai Mutlak** (Tahap 3) — $|x|<a$, $|x|>a$, dan variasinya ($\le$, $\ge$).
4. **Grafik Fungsi Nilai Mutlak** (Tahap 4) — bentuk V, translasi titik puncak $(h,k)$ dari $y=|x-h|+k$, efek koefisien dan tanda negatif, domain/range.

**Gerbang KHUSUS — satu-satunya di seluruh kurikulum**: "Definisi dan Sifat Nilai Mutlak" digerbangkan oleh **SELURUH 71 sub-materi SELURUH tab lain** (Eksponen, Logaritma, Sistem Persamaan, Relasi dan Fungsi, Persamaan Kuadrat, Fungsi Kuadrat, Pertidaksamaan, Fungsi Rasional, Kaidah Pencacahan & Peluang, Trigonometri — TIDAK termasuk tab Prasyarat SMP, yang memang tidak pernah jadi target gerbang siapa pun) — sesuai RENCANA prota yang menulis prasyaratnya literal `["semua"]`, bukan daftar bab tertentu.

**Implementasi teknis** (`public/js/utils/kurikulumData.js`): daftar 71 sub-materi ini **tidak ditulis tangan** sebagai entri literal di tabel `PETA_PRASYARAT` utama (rawan salah ketik/lupa sinkron), melainkan **dihasilkan lewat assignment** `PETA_PRASYARAT["Definisi dan Sifat Nilai Mutlak"] = ...` di paling akhir modul, setelah `PETA_TAB_SUB_MATERI` selesai dideklarasikan — memakai `PETA_TAB_SUB_MATERI` (dikecualikan tab "Nilai Mutlak" sendiri) sebagai sumber daftar, lalu helper lokal `labelAsli()` (reimplementasi kecil dari `kumpulkanLabel()` di `tataLetakPeta.js`) untuk memastikan ejaan Title Case-nya tetap benar di panel "Kuasai dulu: ..." — bukan kunci ternormalisasi huruf kecil. Tiga sub-materi lain (Persamaan, Pertidaksamaan, Grafik) tetap entri literal biasa di tabel utama seperti tab lain. `TAHAPAN_NILAI_MUTLAK` ditambahkan ke `PETA_TAHAPAN`, ditempatkan **paling akhir** dalam urutan spread (setelah `TAHAPAN_TRIGONOMETRI`) — wajib, karena gerbangnya mensyaratkan SEMUA tab lain (termasuk Trigonometri) sudah diajarkan lebih dulu.

**Alur impor**: 4 file baru (`bank_soal_definisi_dan_sifat_nilai_mutlak.json`, `bank_soal_persamaan_nilai_mutlak.json`, `bank_soal_pertidaksamaan_nilai_mutlak.json`, `bank_soal_grafik_fungsi_nilai_mutlak.json`, semua tanpa `id`) aman diimpor langsung.

Kode lolos Jest 116/116 lokal (tambahan: cek rantai Nilai Mutlak bisa dibuka setelah SELURUH tab lain kecuali Prasyarat SMP master, dan cek tetap terkunci bila SATU SAJA sub-materi tab lain — mis. Peluang Kejadian Majemuk — belum master, membuktikan gerbang "semua" benar-benar berarti semua). Gate A lokal LOLOS tanpa deadlock, DAG 80 node valid.

`peta-materi.html`: ambang kolom test dinaikkan dari 20 ke **23** — kenaikan ke-4 dan **terakhir** (roadmap §11.5 sudah tuntas, tidak ada tab baru lagi yang akan memperdalam peta gabungan). "Definisi dan Sifat Nilai Mutlak" menempati kolom 19 (satu kolom setelah kolom terdalam dari SEMUA rantai lain sekaligus), lalu +3 kolom untuk rantai internalnya sendiri = 23 kolom. Fitur lipat-tab-tuntas (§12) tetap jadi mitigasi utama untuk kepadatan visual peta yang belum dilipat.

Diverifikasi dengan ekspor Firestore live segar (1070 soal) lewat Gate A — **✅ LOLOS**, DAG 80 node valid, tidak ada deadlock, keempat sub-materi baru 10 soal masing-masing di `materi_utama: "Nilai Mutlak"`, gerbang "semua" tepat 71 entri. Test Jest 116/116 lolos.

**Roadmap §11.5 SELESAI** — 9/9 tab bab-utama + tab sisipan Nilai Mutlak, seluruh kurikulum kelas X (Fase 0-9) sudah tercakup di `PETA_PRASYARAT`/`PETA_TAHAPAN`. Kerja rutin berikutnya di luar §11 adalah pemeliharaan data (lihat §8 soal duplikat Eksponen yang masih menunggu dibahas) dan penyempurnaan UI peta materi (§12).

## 12. Peta materi: melipat tab tuntas jadi satu simpul (2026-07-26)

Sejak Fase 2 (§11.5) ambang lebar kolom `tataLetakPeta.test.js` sudah dinaikkan tiga kali (8→15→20) karena setiap gerbang antar-tab baru menggambar SELURUH sub-materi tab prasyaratnya satu per satu — mis. "Pertidaksamaan Linear" menyebut 11 sub-materi dari 3 tab sekaligus. Ini keputusan yang sempat ditunda ("diputuskan belakangan") sejak Fase 2, diselesaikan sekarang setelah 8/8 tab bab-utama selesai (Fase 7).

**Keputusan**: bukan memisah `peta-materi.html` jadi banyak peta per tab (tab-tab itu benar-benar saling bergantung — Logaritma butuh Eksponen, Pertidaksamaan butuh tiga tab sekaligus — jadi pemisahan akan menduplikasi atau memutus simpul), melainkan **melipat satu tab jadi satu simpul "persimpangan" begitu SELURUH sub-materinya sudah master**. `PETA_PRASYARAT` sendiri **tidak diubah sama sekali** — ini murni transformasi presentasi yang dijalankan sebelum tata letak dihitung.

Mockup dibuat lebih dulu (metafora peta transit: tab = jalur, tab tuntas = stasiun persimpangan) dan disetujui sebelum implementasi.

**Implementasi:**
- `PETA_TAB_SUB_MATERI` (baru, `kurikulumData.js`) — memetakan nama tab ke daftar sub-materi ternormalisasi anggotanya, diturunkan dari blok `TAHAPAN_*` yang sudah ada. Tab Prasyarat (SMP) sengaja tidak dimasukkan (bukan target gerbang siapa pun).
- `kolapsTabTuntas()` (baru, `tataLetakPeta.js`) — fungsi murni: menerima `PETA_PRASYARAT`, urutan mengajar, `PETA_TAB_SUB_MATERI`, dan `setMaster` siswa; mengembalikan peta baru di mana tab yang 100% master diganti jadi satu simpul bernama tab tersebut (sisi internal tab itu hilang, sisi lintas-tab dialihkan ke simpul barunya, deduplikasi otomatis). Parameter `kecualikanTab` memungkinkan satu tab sengaja TIDAK dilipat (dipakai untuk fitur buka-manual). 8 unit test, termasuk satu test terhadap `PETA_PRASYARAT` produksi yang membuktikan "Pertidaksamaan Linear" benar-benar terlipat jadi 3 nama tab.
- `petaMateriView.js` — simpul tab-tuntas dirender dengan cincin luar tambahan (`.peta-kotak-luar`) dan tombol "+" (`data-aksi="perluas"`) untuk membuka rinciannya; panel detail menampilkan daftar anggota asli tab tersebut.
- `petaMateri.js` (controller) — `muatPeta()` dipecah jadi pengambilan riwayat (sekali, ke Firestore) dan `renderPeta()` (bisa dipanggil berulang tanpa refetch). Status "master" simpul tab-tuntas ditambahkan ke `setMaster` efektif hanya untuk perhitungan tata letak, bukan disimpan sebagai data siswa. Klik tombol "+" membuka satu tab manual (state sesi, tidak disimpan); tombol baru "🧩 Lipat semua tab" mengembalikannya.

**Konsekuensi yang disengaja**: peta jadi **berbeda per siswa** — siswa yang lebih maju melihat peta lebih ringkas (tab-tab yang sudah dikuasainya terlipat) daripada siswa yang baru mulai. Ini konsisten dengan filosofi "fokus ke garis depan" yang sudah ada sebelumnya di halaman ini.

Diverifikasi: Jest 112/112 lolos (8 test baru untuk `kolapsTabTuntas`, termasuk kasus produksi nyata). Karena tidak ada alat browser di lingkungan pengerjaan ini, verifikasi render+interaksi (klik simpul, klik tombol +, klik "Lipat semua tab") dilakukan lewat skrip jsdom sekali pakai (di-mock `getRiwayatLatihanSiswa`, dihapus setelah dipakai) — bukan pengecekan visual di browser sungguhan. Hasilnya: render awal melipat Eksponen jadi 1 simpul (66 dari 70 simpul tampil), panel detail menampilkan kelima nama sub-materi aslinya dengan benar, tombol + membuka lagi sub-materi individual, dan "Lipat semua tab" melipatnya kembali.

## 13. Pengayaan PETA_PRASYARAT dari data konsep_prasyarat riil (2026-07-27, berjalan)

Sejak §11 keputusan #4, gerbang tab selain Trigonometri ditulis sebagai **rantai sekuensial sederhana** (satu prasyarat langsung per node) karena saat itu soalnya belum ada, jadi belum ada `konsep_prasyarat` untuk memilih mana yang paling relevan. Sekarang bank soal sudah lengkap (1100+ soal, hampir semua tab 100% terisi `konsep_prasyarat`) — pekerjaan ini memanfaatkan data itu untuk memperkaya rantai jadi jaringan bercabang, tab demi tab, persis seperti riwayat Trigonometri sendiri (bukti pemakaian, bukan topological sort — lihat CLAUDE.md §4).

**Tahap 0 — Bersihkan nama usang di `konsep_prasyarat` (2026-07-27).** Ditemukan 128 referensi ke nama sub-materi yang sudah di-rename sejak Fase 4 (mis. "Persamaan Kuadrat Dasar" → "Akar Persamaan Kuadrat") atau nama generik yang bukan sub-materi sungguhan ("Pemodelan Matematika" = nama tab, bukan node; "Sistem Persamaan Linear" tanpa akronim = ambigu SPLDV/SPLTV). 121 soal diperbaiki lewat jalur replace (§11.6), diverifikasi bersih 0 sisa nama usang. Satu koreksi isi (bukan cuma rename) ditandai eksplisit untuk ditinjau pemilik proyek: soal `kxdE8z11AJBSrFPLeRBE` (Nilai Sudut Istimewa) tadinya menyebut SPLTV padahal soalnya cuma 2 variabel — diganti SPLDV.

**Tahap 1 — Skrip analisis (`plan/diagnostik/gate-b-analisis-konsep-prasyarat.mjs`, baru).** Untuk tiap sub-materi, menghitung % soal yang menyebut tiap konsep di `konsep_prasyarat`, dibandingkan dengan `PETA_PRASYARAT` yang berlaku sekarang. Ambang disepakati **30%** (bahan pertimbangan, bukan aturan mutlak — kasus di ambang tetap ditinjau manual). Skrip juga memfilter "edge yang disarankan data tapi sudah otomatis terpenuhi transitif lewat rantai yang ada" (mis. kalau A→B→C, menambahkan A sebagai syarat langsung C tidak mengubah gating apa pun) supaya rekomendasinya cuma yang benar-benar mengubah perilaku gerbang.

**Tahap 2a — Eksponen + Logaritma, SELESAI (2026-07-27).** 5 edge baru diterapkan ke `kurikulumData.js`:
- "Sifat Eksponen Bilangan Bulat" (pintu masuk tab, dulu tanpa syarat sama sekali) ← **+ Operasi Aritmatika Dasar** (data: 100%) — temuan utama: sub-materi paling sering disebut sebagai prasyarat di SELURUH bank soal (lintas hampir semua tab) ternyata sebelumnya punya leverage NOL di `PETA_PRASYARAT` karena rantai lama belum sempat menjangkaunya.
- "Merasionalkan Penyebut" ← + Manipulasi Aljabar Dasar (data: 30%, pas di ambang).
- "Fungsi Eksponen" ← + Pengenalan Variabel (data: 80%, gerbang antar-tab baru dari Prasyarat SMP).
- "Persamaan Logaritma" ← + **Persamaan Linear Satu Variabel (PLSV)** (data: 100%, gerbang antar-tab baru dari Sistem Persamaan — masuk akal karena persamaan logaritma memang direduksi ke PLSV).
- "Fungsi Logaritma" ← + Pengenalan Variabel (data: 60%).

**Efek samping struktural yang ditemukan & diperbaiki:** menambah gerbang lintas-tab dari "Sistem Persamaan" (Bab 3 prota) ke "Logaritma" (Bab 4 prota) memicu kegagalan test `urutanMundur` (`validasiKurikulum`) karena urutan flat `PETA_TAHAPAN` — yang dipakai sebagai proksi "urutan mengajar" — ternyata sudah lama tidak konsisten dengan urutan bab prota sendiri (§11.4). Dua perbaikan diterapkan:
1. Blok `TAHAPAN_PRASYARAT_SMP` dipindah ke **paling depan** urutan spread `PETA_TAHAPAN`. Tidak mengubah apa pun yang terlihat siswa (tab "Prasyarat" sudah selalu tampil pertama di `pilihMateri.js`), cuma menyamakan urutan internal dengan kenyataan itu.
2. `DAFTAR_MATERI_INTI` (urutan tab yang terlihat siswa) dan blok `TAHAPAN_SISTEM_PERSAMAAN` dipindah ke **sebelum** Logaritma, sesuai Bab 3 < Bab 4 di RENCANA prota — **ini mengubah urutan tab yang dilihat siswa** (Sistem Persamaan sekarang tampil sebelum Logaritma, bukan sesudah Trigonometri). Bukan keputusan baru yang diambil di sini, cuma menyamakan dengan bab prota yang sudah didokumentasikan sejak §11.4, tapi tetap dicatat karena dampaknya terlihat.

Diverifikasi: Gate A **✅ LOLOS** (82 node, nol deadlock, DAG valid). Jest 130/130 lolos (3 test fixture disesuaikan: dua rantai-gerbang Eksponen/Logaritma butuh set master diperluas dengan prasyarat lintas-tab barunya, satu jumlah-node `tataLetakPeta.test.js` naik dari 80 ke 82 karena "Operasi Aritmatika Dasar" & "Pengenalan Variabel" kini jadi node baru di peta).

**Tahap 2b — Persamaan Kuadrat + Fungsi Kuadrat, SELESAI (2026-07-28).** Tahap 0 dikonfirmasi sudah live (0 nama usang tersisa di ekspor segar). Gate B menyarankan 3 edge untuk "Aplikasi Fungsi Kuadrat" & "Sifat dan Grafik Fungsi Kuadrat" (semua "+ Manipulasi Aljabar Dasar"), tapi begitu edge pertama diterapkan ke "Akar Persamaan Kuadrat" (akar rantai, pintu masuk tab), skrip dijalankan ulang dan mengonfirmasi ketiganya **otomatis terpenuhi transitif** — tidak ditulis, supaya `PETA_PRASYARAT` tidak menumpuk edge percuma. Hasil akhir cuma **1 edge**:
- "Akar Persamaan Kuadrat" (pintu masuk tab, dulu tanpa syarat) ← + Manipulasi Aljabar Dasar (data: 70%), + Operasi Pecahan (data: 40%), + Operasi Bentuk Akar (data: 30%, lintas-tab dari Eksponen).

Ini gerbang KONSEP spesifik, beda dari gerbang antar-tab §11.4 (yang mensyaratkan SELURUH sub-materi satu tab) — cuma 3 skill dasar yang benar-benar dipakai, bukan representasi "seluruh tab Eksponen" seperti gerbang Logaritma.

**Efek samping berulang:** kolom terdalam `tataLetakPeta.js` naik lagi dari 23 ke **25** (lihat `tests/utils/tataLetakPeta.test.js`) — menambah prasyarat ke sub-materi manapun yang jadi bagian rantai leluhur "Definisi dan Sifat Nilai Mutlak" (gerbang "semua tab", §11.5 Fase 9) otomatis memperdalam kolomnya, walau tidak ada tab baru. Ambang ini kemungkinan **akan naik lagi** tiap kali Tahap 2 mengerjakan tab berikutnya — dulu dikira final di Fase 9, ternyata keliru begitu §13 mulai menambah gerbang ke sub-materi yang sudah ada.

Diverifikasi: Gate A **✅ LOLOS** (82 node, jadi target 69/jadi prasyarat 13 akar — tidak ada node baru, cuma "Akar Persamaan Kuadrat" pindah dari akar ke target). Jest 130/130 lolos (1 test disesuaikan: ambang kolom 23→25 + komentar penjelasan).

**Tahap 2c — Relasi dan Fungsi, SELESAI (2026-07-28).** 2 edge diterapkan:
- "Substitusi Fungsi Linear" (pintu masuk tab, dulu tanpa syarat) ← + Manipulasi Aljabar Dasar (data: 100%), + Pengenalan Variabel (data: 60%), + Persamaan Linear Satu Variabel (PLSV) (data: 30%, pas di ambang).
- "Analisis Grafik Fungsi" ← + Representasi Aljabar (data: 100%).

Saran ketiga dari Gate B ("Operasi Aljabar Fungsi" + Manipulasi Aljabar Dasar) terkonfirmasi redundan transitif setelah edge pertama ditulis (pola sama seperti Tahap 2b) — tidak ditulis.

**Temuan penting: satu saran Gate B DITOLAK karena akan membentuk siklus**, bukan cuma soal ambang data. "Analisis Grafik Fungsi" + "Pertidaksamaan Kuadrat" (data: 30%) terlihat masuk akal sekilas, tapi `Pertidaksamaan Kuadrat` mensyaratkan (transitif, lewat `Pertidaksamaan Linear` → `Program Linear`) seluruh tab Fungsi Kuadrat, dan Fungsi Kuadrat sendiri mensyaratkan SELURUH sub-materi Relasi dan Fungsi — termasuk "Analisis Grafik Fungsi" itu sendiri. Kalau edge ini ditulis, Gate A akan menangkapnya sebagai siklus (Temuan 2). Ini pengingat bahwa filter "redundan transitif" saja tidak cukup untuk tiap saran Gate B — cek arah dependency lintas-tab tetap perlu sebelum menulis, terutama untuk sub-materi yang dirinya sendiri jadi bagian gerbang "seluruh tab" di tempat lain.

Diverifikasi: Gate A **✅ LOLOS** (83 node, nol deadlock, DAG valid). Jest 130/130 lolos (3 test disesuaikan: rantai-gerbang Relasi dan Fungsi butuh set master diperluas, jumlah-node `tataLetakPeta.test.js` naik 82→83 karena "Representasi Aljabar" jadi node baru; kolom peta TIDAK naik dari 25, kedalaman rantai ini tidak melebihi cabang lain).

**Tahap 2d — Sistem Persamaan, SELESAI (2026-07-28).** Temuan berbeda dari tab lain: sebelum ini, tab Sistem Persamaan **tidak punya rantai internal sama sekali** — PLSV/SPLDV/SPLTV bertiga terbuka independen di `PETA_PRASYARAT` (meski `TAHAPAN_SISTEM_PERSAMAAN` sudah menandainya Tahap 1/2/3 sejak Fase 0). Gate B mengonfirmasi & akhirnya menuliskan rantai yang memang dimaksud sejak awal:
- "Persamaan Linear Satu Variabel (PLSV)" (pintu masuk tab) ← + Operasi Aritmatika Dasar (data: 70%), + Manipulasi Aljabar Dasar (data: 40%), + Operasi Pecahan (data: 30%, pas di ambang).
- "Sistem Persamaan Linear Dua Variabel (SPLDV)" ← + Persamaan Linear Satu Variabel (PLSV) (data: 100%).
- "Sistem Persamaan Linear Tiga Variabel (SPLTV)" ← + Sistem Persamaan Linear Dua Variabel (SPLDV) (data: 100%), + Representasi Aljabar (data: 40%).

Saran "SPLDV + Manipulasi Aljabar Dasar" (90%) terkonfirmasi redundan transitif (sudah lewat PLSV) — tidak ditulis.

Diverifikasi: Gate A **✅ LOLOS** (83 node — PLSV/SPLDV/SPLTV pindah dari akar ke target, tidak ada node baru sama sekali karena keempat prasyaratnya sudah ada semua). Jest 130/130 lolos **tanpa perlu penyesuaian test apa pun** — rantai ini (kedalaman 3) tidak melebihi cabang Persamaan Kuadrat/Fungsi Kuadrat yang sudah jadi patokan kolom terdalam (25).

**Tahap 2e — Pertidaksamaan, SELESAI tanpa perubahan kode (2026-07-28).** Gate B tidak menyarankan satu edge baru pun — SEMUA saran (Manipulasi Aljabar Dasar, Operasi Bentuk Akar, Akar Persamaan Kuadrat, Diskriminan dan Jenis Akar, dll di berbagai sub-materi tab ini) terkonfirmasi sudah otomatis terpenuhi transitif, karena "Pertidaksamaan Linear" (pintu masuk tab) sudah punya mega-gerbang §11.4 (SELURUH Eksponen + Fungsi Kuadrat + Sistem Persamaan master) yang jauh lebih luas dari apa pun yang disarankan data konsep_prasyarat per sub-materi. Tidak ada perubahan `kurikulumData.js`, tidak ada perubahan test, Gate A & Jest tidak perlu dijalankan ulang (state tidak berubah dari Tahap 2d).

**Tahap 2f — Fungsi Rasional, SELESAI tanpa perubahan kode (2026-07-28).** Pola sama seperti Pertidaksamaan (Tahap 2e): "Pengertian Fungsi Rasional" (pintu masuk tab) sudah punya mega-gerbang §11.4 (SELURUH Relasi dan Fungsi + Fungsi Kuadrat + Pertidaksamaan master), jadi seluruh saran Gate B untuk 4 sub-materi tab ini sudah otomatis terpenuhi transitif. Tidak ada perubahan `kurikulumData.js`/test.

**Tahap 2g — Kaidah Pencacahan & Peluang, SELESAI (2026-07-28).** 1 edge diterapkan:
- "Aturan Penjumlahan dan Perkalian" (pintu masuk tab, dulu tanpa syarat) ← + Operasi Aritmatika Dasar (data: 100%).

Saran "Peluang Kejadian Majemuk + Ruang Sampel dan Peluang Kejadian Tunggal" (100%) terkonfirmasi redundan transitif (sudah lewat Frekuensi Relatif dan Harapan) — tidak ditulis.

Diverifikasi: Gate A **✅ LOLOS** (83 node, tidak ada node baru — "Aturan Penjumlahan dan Perkalian" pindah dari akar ke target, "Operasi Aritmatika Dasar" sudah node lama). Jest 130/130 lolos (1 test disesuaikan: rantai-gerbang Kaidah Pencacahan & Peluang butuh set master diperluas). Kolom peta tetap di ambang sebelumnya.

**Tahap 2h — Nilai Mutlak, SELESAI tanpa perubahan kode (2026-07-28).** Sesuai dugaan: "Definisi dan Sifat Nilai Mutlak" sudah punya mega-gerbang "SEMUA tab lain" (§11.5 Fase 9), jadi seluruh saran Gate B untuk 4 sub-materi tab ini sudah otomatis terpenuhi transitif. Tidak ada perubahan `kurikulumData.js`/test.

**Tahap 2 SELESAI — seluruh 9 tab bab-utama sudah dianalisis Gate B (2026-07-28).** Ringkasan hasil per tab:

| Tab | Edge baru ditulis | Catatan |
|---|---|---|
| Eksponen (2a) | 3 | Sifat Eksponen Bilangan Bulat, Merasionalkan Penyebut, Fungsi Eksponen |
| Logaritma (2a) | 2 | Persamaan Logaritma (gerbang antar-tab baru ke PLSV), Fungsi Logaritma |
| Persamaan Kuadrat (2b) | 1 | Akar Persamaan Kuadrat |
| Fungsi Kuadrat (2b) | 0 | Semua saran redundan transitif lewat Persamaan Kuadrat |
| Relasi dan Fungsi (2c) | 2 | Substitusi Fungsi Linear, Analisis Grafik Fungsi — 1 saran DITOLAK (siklus) |
| Sistem Persamaan (2d) | 3 | Tab ini sebelumnya TANPA rantai internal sama sekali — PLSV→SPLDV→SPLTV baru ditulis |
| Pertidaksamaan (2e) | 0 | Mega-gerbang §11.4 sudah menutupi semua |
| Fungsi Rasional (2f) | 0 | Mega-gerbang §11.4 sudah menutupi semua |
| Kaidah Pencacahan & Peluang (2g) | 1 | Aturan Penjumlahan dan Perkalian |
| Nilai Mutlak (2h) | 0 | Mega-gerbang "semua tab" sudah menutupi semua |

Total 12 edge baru + 1 saran ditolak (siklus) + rekonstruksi rantai internal Sistem Persamaan yang sebelumnya tidak ada. Node peta naik dari 80 → 83, kolom terdalam naik dari 23 → 25. Semua diverifikasi Gate A (nol deadlock/siklus di tiap langkah) dan Jest (130/130 di commit akhir).

### 13.1 Kurasi bank soal "Operasi Aritmatika Dasar" (2026-07-28, SELESAI)

Dari analisis leverage awal §13, "Operasi Aritmatika Dasar" ternyata sub-materi dengan bukti pemakaian `konsep_prasyarat` terluas di seluruh kurikulum (dipakai hampir semua tab), jadi 40 soalnya bukan salah alokasi — tapi isinya perlu dikurasi: 25 dari 40 soal cuma ekspresi angka murni ("Hasil dari ...") yang menguji skill identik (urutan operasi hitung bilangan bulat) dengan angka diganti-ganti, sementara 15 soal cerita kontekstualnya jauh lebih beragam (suhu, utang, kedalaman, lift, berbagi barang).

**Riset pembanding** (web search, Ruangguru/Twinkl/TPT grade 7 & sumber Indonesia serupa): konteks umum utk skill ini = suhu, elevasi/permukaan laut, keuangan (utang/setor/tarik), berbagi barang — semuanya sudah terwakili di bank kita. Yang **belum ada sama sekali**: skor kuis/permainan, transaksi rekening bank (setor/tarik eksplisit), selisih gol pertandingan, poin nyawa game.

**Rencana (dieksekusi manual oleh pemilik proyek via admin.html, 2026-07-28):**
1. **Hapus 16 soal** duplikat template ekspresi angka murni (menyisakan representasi tiap operasi per level kesulitan, bukan menghapus semuanya) + 2 soal cerita yang strukturnya identik dengan soal cerita lain (gudang/pedagang sayur sama-sama pola "n kelompok × m barang − rusak ÷ penerima"; mesin cetak redundan dengan toko roti). Daftar ID lengkap: `plan/hapus-operasi-aritmatika-dasar.md`. Dilakukan manual satu-satu lewat `admin.html` → Bank Soal → hapus.
2. **Tambah 5 soal baru** (orisinal, ditulis sendiri terinspirasi pola umum internasional/Indonesia, bukan salinan) untuk menutup celah konteks yang belum ada: skor kuis (level 1), transaksi rekening bank (level 2), selisih gol pertandingan (level 2), poin nyawa game (level 3), transaksi rekening bank multi-langkah (level 3). File: `~/Downloads/reimport/bank_soal_operasi_aritmatika_dasar_tambahan.json` — tanpa `id`, diimpor sebagai dokumen baru.

**Verifikasi ke Firestore live (2026-07-28)**: 29 soal (persis 40 − 16 + 5), 0 dari 16 ID yang seharusnya terhapus masih tersisa, kelima soal baru ditemukan, distribusi 13 mudah / 9 sedang / 7 sulit — sesuai rencana. Masih jauh di atas kuota draf sumatif 4/4/2, dan lebih dalam untuk formatif adaptif dibanding ambang minimum tab lain.

**Alat baru untuk kurasi berikutnya**: `akses-admin/hapus-soal.js` (mode satuan/batch, pola sama seperti `hapus-siswa.js`) supaya penghapusan massal berikutnya tidak perlu manual satu-satu lewat admin.html lagi.

### 13.2 Algoritma perluasan bank soal + kurasi 11 sub-materi Prasyarat/Sistem Persamaan (2026-07-28, SELESAI)

Pemilik proyek menanyakan apakah kurasi §13.1 layak jadi standar untuk sub-materi lain, dan minta algoritma perluasan bank soal yang konsisten: tidak terlalu luas, tapi cukup mewakili semua sisi sub-materi + variasi tipe soal. Audit `arsip-data/bank_soal_all.json` menunjukkan **94 dari 100 sub-materi** persis mentok di `SOAL_MIN` (10) — bukan target desain, cuma ambang minimum yang tak pernah dilewati. §13.1 metodologinya layak ditiru (identifikasi duplikat struktural + riset pembanding konteks + verifikasi live), tapi **ukuran akhirnya (29 soal, rasio 13/9/7) tidak layak jadi angka baku** — itu residu dari berapa banyak yang kebetulan dihapus, dan Operasi Aritmatika Dasar adalah node hub (139 referensi `konsep_prasyarat` lintas tab) sehingga wajar lebih besar dari sub-materi daun.

**Temuan kunci (dari pertanyaan pemilik proyek soal risiko formatif adaptif mengulang soal)**: naik level formatif butuh 3 benar **berturut-turut** (`perbaruiLevelAdaptif`, `soalEngine.js`), dan tiap jawaban benar BARU mengunci soal itu keluar dari pool "belum benar" secara permanen. Ditelusuri ke `LatihanController.js:849-856` — `idSoalSudahBenar` direstore dari `progres_belajar/{nis}_{sub_materi}` (`latihanService.js:getProgresFormatif`), **bukan direset per sesi**, jadi akumulasinya sepanjang seluruh riwayat remedial siswa di sub-materi itu sampai `formatif_tuntas`. Turunan rumusnya: **minimum soal per level = 3 (syarat streak) + K**, K = toleransi salah sebelum siswa dipaksa diberi soal yang jawabannya sudah dia tahu. K negatif = cacat struktural (bahkan tanpa satu kesalahan pun, stok soal segar tak cukup untuk streak 3).

**Kebijakan ambang K (tidak simetris)**: Level 1 adalah lantai tanpa penurunan di bawahnya — siswa lemah bisa terjebak lama di situ, butuh buffer terbesar → **K≥4 (min 7 soal)**. Level 2 & 3 lebih transit (2x salah langsung turun level) → **K≥2 (min 5 soal)**. Total lantai minimum ≈ 17/sub-materi dari kendala ini saja, konvergen dengan estimasi terpisah dari sudut cakupan konsep (matriks skill × level, target ~2 soal per sel).

**Alat baru**: `plan/diagnostik/gate-c-audit-bank-soal.mjs` (pola Gate A/B) — untuk satu/lebih sub-materi, menghitung distribusi level, rasio ekspresi-telanjang vs cerita (heuristik kata penanda, lemah untuk soal cerita — dicatat eksplisit di komentar skrip), K per level dengan ambang di atas, dan kandidat duplikat struktural (signature dari kerangka operator setelah angka dilepas; sinyal KUAT untuk ekspresi telanjang, sinyal lemah untuk cerita karena kata kerja operasi ikut terlepas oleh heuristik).

**Algoritma perluasan per sub-materi** (dipakai berulang untuk 11 sub-materi di bawah): (1) baca semua soal existing, verifikasi matematikanya benar; (2) petakan skill/konsep yang diuji vs yang seharusnya ada di kurikulum sub-materi itu (tabel manual, bukan otomatis); (3) identifikasi celah nyata (konsep hilang total, arah pengujian yang tidak pernah dibalik, konteks cerita yang timpang/nol, tipe tugas yang monoton); (4) tulis soal baru menutup celah, opsi pengecoh mewakili miskonsepsi spesifik (bukan angka acak), matematika diverifikasi lewat Python/sympy sebelum ditulis; (5) kalau ada duplikat struktural asli (skill identik, cuma angka beda) rekomendasikan hapus by ID, TIDAK dieksekusi sendiri — tetap manual oleh pemilik proyek.

**12 sub-materi yang dikerjakan berurutan** (urutan penguasaan materi dari pemilik proyek, tab Prasyarat SMP + Sistem Persamaan):

| # | Sub-materi | Sebelum | Sesudah (L1/L2/L3) | Catatan celah utama |
|---|---|---:|---|---|
| 1 | Operasi Aritmatika Dasar | 40 | 29 (13/9/7) | §13.1, sudah selesai sebelumnya |
| 2 | Sifat Operasi Bilangan | 10 | 19 (8/6/5) | Asosiatif perkalian, identitas +/×, invers +/× hilang total; leverage 0 (bukan hub) |
| 3 | KPK dan FPB | 10 | 17 (7/5/5) | Nol soal komputasi telanjang, faktorisasi prima tak pernah diuji eksplisit, rumus KPK×FPB=a×b hilang |
| 4 | Operasi Pecahan | 10 | 17 (7/5/5) | Bilangan pecahan campuran nol; L2 timpang (4/5 soal bertema pembagian). 1 duplikat asli dihapus (`tt9TAhLpbWbqhWFOR4dg`, sama persis dengan `XtIqN7...`) |
| 5 | Operasi dan Konversi Desimal | 10 | 17 (7/5/5) | Desimal negatif nol, urutan operasi dgn desimal nol, konteks nyata cuma 1/10 |
| 6 | Pengenalan Variabel | 10 | 17 (7/5/5) | Kosakata "suku"/"suku sejenis" tak pernah diuji langsung, arah ekspresi→situasi nyata nol |
| 7 | Manipulasi Aljabar Dasar | 10 | 19 (7/7/5) | Pemfaktoran trinomial ($x^2+6x+8$) nol — cuma arah penjabaran (FOIL) yang diuji |
| 8 | PLSV | 10 | 18 (7/6/5) | 0/10 soal cerita (hub 100 referensi!), solusi negatif nol |
| 9 | SPLDV | 10 | 17 (7/5/5) | Nyaris 0 soal cerita asli, semua "diketahui sistem persamaan..." abstrak |
| 10 | Persentase | 10 | 17 (7/5/5) | Konteks untung/rugi nol (cuma diskon), konversi persen→pecahan/desimal nol |
| 11 | Perbandingan dan Skala | 10 | 19 (7/7/5) | Perbandingan berbalik nilai cuma 1 soal vs 3 soal senilai — timpang |
| 12 | Pembulatan dan Estimasi | 10 | 18 (7/6/5) | Pembulatan ke ribuan berdiri sendiri nol, taksiran pengurangan nol, "pembulatan ke atas" (ceiling) nol |

Sub-materi #2–12 ditulis sebagai file JSON tanpa `id` di `~/Downloads/reimport/bank_soal_<nama>_tambahan.json`, direview pemilik proyek, diimpor manual via admin.html, dan `tt9TAhLpbWbqhWFOR4dg` dihapus manual. **Diverifikasi ke ekspor Firestore segar (2026-07-28)**: seluruh 12 sub-materi persis sesuai tabel di atas, Gate C menunjukkan nol peringatan K di semua sub-materi (dibanding 9 dari 12 yang tadinya punya level cacat struktural K<0 sebelum kurasi — termasuk hub besar Manipulasi Aljabar Dasar dan PLSV yang level 1-nya cuma 2 soal).

**Sub-materi lain di luar 12 ini** (82 sisanya) belum disentuh — masih di ambang `SOAL_MIN`=10 apa adanya, beberapa kemungkinan juga punya K negatif. Algoritma & Gate C di atas siap dipakai ulang kalau pemilik proyek mau memperluas sub-materi lain berikutnya.

### 13.3 Ronde kedua: variasi tipe tugas terinspirasi SAT/TIMSS/PISA (2026-07-28, SELESAI)

Setelah §13.2, pemilik proyek minta ditinjau ulang: 190+ soal baru kemarin kuat di variasi *konteks* tapi riset pembanding (SAT, TIMSS grade 8, PISA numeracy — lihat sumber di respons sesi, tidak disalin ke sini) menunjukkan bank kita nyaris seragam di *tipe tugas* — hampir semuanya "hitung/selesaikan". Tiga tipe tugas yang berulang muncul di soal SAT/TIMSS/PISA tapi nol di bank kita: **analisis kesalahan** (diberi solusi salah, cari letak salahnya), **bandingkan dua opsi** (bukan hitung satu nilai, tapi tentukan mana lebih baik), dan **kasus batas/jebakan konseptual** (tanpa solusi, desimal berulang, skala luas, naik-turun persentase).

**16 soal baru ditulis**, satu file gabungan `~/Downloads/reimport/bank_soal_gabungan_tambahan2.json` (union dari 11 file per-sub-materi yang ditulis lebih dulu):
- Sifat Operasi Bilangan (+1, L2): anotasi-langkah — identifikasi sifat yang dipakai di satu langkah solusi bertahap ($25\times17\times4$).
- KPK dan FPB (+2, L2): kasus khusus saat satu bilangan kelipatan langsung yang lain (FPB/KPK langsung tanpa faktorisasi penuh).
- Operasi Pecahan (+1, L2): estimasi benchmark — pecahan mana paling dekat ke $1$, tanpa hitung presisi.
- Operasi dan Konversi Desimal (+1, L3): klasifikasi desimal berulang vs berhenti (konsep yang sebelumnya nol sama sekali).
- Pengenalan Variabel (+1, L2): analisis kesalahan ($3x+2x=5x^2$, siswa keliru mengalikan pangkat).
- Manipulasi Aljabar Dasar (+1, L3): analisis kesalahan faktorisasi trinomial (cek jumlah TAPI lupa cek hasil kali pasangan faktor).
- PLSV (+2, L3): titik impas dua tarif linear (mirip SAT value/break-even problem) + persamaan tanpa solusi ($3x+5=3x-2$).
- SPLDV (+2, L3): sistem sejajar tanpa solusi unik (nilai $k$ yang membuat dua garis berimpit vs sejajar-tidak-berpotongan) + soal tiket bioskop 2-harga (elimination genuine, bukan PLSV berkedok 2 variabel — draf awal salah desain, diperbaiki sebelum ditulis).
- Persentase (+2, L3): jebakan naik-$20\%$-turun-$20\%$ (tidak kembali ke nilai semula) + poin persentase vs persen perubahan relatif.
- Perbandingan dan Skala (+2, L2/L3): bandingkan harga per unit dua kemasan + skala luas (berbanding kuadrat, bukan linear — jebakan klasik).
- Pembulatan dan Estimasi (+1, L2): cek kewajaran hasil hitungan berdasarkan taksiran kasar.

**Dibuang dari daftar**: ide PISA berbasis diagram (mis. hitung persentase dari gambar segitiga berwarna) — skema `bank_soal` tidak punya field gambar (dicek `arsip-data/bank_soal_all.json`, field cuma teks/LaTeX), jadi tidak bisa diadaptasi tanpa dukungan gambar di kode.

Diverifikasi ke ekspor Firestore segar (2026-07-28): jumlah per sub-materi persis 20 (Sifat Operasi Bilangan), 19 (KPK dan FPB), 18 (Operasi Pecahan), 18 (Operasi dan Konversi Desimal), 18 (Pengenalan Variabel), 20 (Manipulasi Aljabar Dasar), 20 (PLSV), 19 (SPLDV), 19 (Persentase), 21 (Perbandingan dan Skala), 19 (Pembulatan dan Estimasi) — sesuai §13.2 + soal ronde ini.

## 14. Formatif adaptif: dari streak-3 ke tally kumulatif benar-mandiri (2026-07-28)

Pemilik proyek minta aturan naik/turun level formatif diubah: **Level 1 & 2** butuh **4 kali benar MANDIRI** (tanpa lihat clue/pembahasan) untuk naik, **Level 3** cukup **2 kali** — sengaja disamakan dengan kuota draf sumatif (4 mudah, 4 sedang, 2 sulit, lihat `siapkanDraftSoal`) supaya "lulus formatif" merepresentasikan volume bukti yang sama dengan yang akan ditemui siswa saat ujian sumatif. Aturan turun level (salah 2x kumulatif, tidak harus berturut-turut) tidak berubah.

**Keputusan desain yang perlu diklarifikasi dulu**: apakah 4/2 kali benar mandiri itu harus **berturut-turut** (streak, seperti aturan lama) atau **kumulatif** (tally, boleh diselingi salah/tidak-mandiri, direset cuma saat level berubah). Ditanyakan eksplisit ke pemilik proyek — jawabannya **kumulatif** (direkomendasikan juga oleh Root Agent: selaras dengan analogi kuota sumatif yang murni hitungan bukan streak, dan lebih adil karena satu kepleset tidak menghapus semua progres jawaban mandiri sebelumnya).

**"Mandiri" ternyata sudah punya definisi persis di kode** — tidak perlu state baru: `dataMemori.skor_soal === 100` di `LatihanController.js` (`handleCekJawaban`) persis berarti "benar di percobaan pertama, `lihat_clue` dan `lihat_bahas` masih `false`". Implementasi tinggal menyalurkan boolean ini ke `perbaruiLevelAdaptif`.

**Perubahan kode**:
- `soalEngine.js` — `perbaruiLevelAdaptif(stateLevel, benar, mandiri)` (param baru). Field `streakBenar` diganti nama jadi `jumlahBenarMandiri` (bukan streak lagi, jadi nama lama menyesatkan). Logika: benar+mandiri menambah `jumlahBenarMandiri` (tidak reset oleh salah/tidak-mandiri, cuma reset saat level berubah — naik atau turun); benar-tapi-tidak-mandiri bersifat netral (tidak menambah maupun mengurangi apa pun); ambang naik per level ada di `AMBANG_NAIK_LEVEL = { 1: 4, 2: 4, 3: 2 }`.
- `LatihanController.js` — state `streakBenar` → `jumlahBenarMandiri`; `perbaruiLevelDanSimpan` terima param `mandiri` baru; dipanggil dengan `dataMemori.skor_soal === 100` sebagai nilainya; resume state (`mulaiAplikasi`) baca field baru.
- `latihanService.js` — field Firestore `streak_benar` → `jumlah_benar_mandiri` di `getProgresFormatif`, `simpanProgresAdaptif`, `resetProgresFormatif`.
- `tests/utils/soalEngine.test.js` — ditulis ulang total untuk `perbaruiLevelAdaptif` (25 test, semua lolos): kumulatif-boleh-diselingi-salah, benar-tidak-mandiri netral, ambang beda per level (4 vs 2), plus test lama yang masih relevan (turun level, `levelTertinggiDicapai` tidak pernah turun, kemurnian fungsi).

**Migrasi data**: dokumen `progres_belajar` lama yang masih di tengah satu level (field `streak_benar`) tidak dibaca lagi oleh field baru `jumlah_benar_mandiri` — fallback `|| 0` di `getProgresFormatif` berarti siswa yang sedang di tengah remedial saat deploy ini akan mulai hitung ulang dari 0 untuk level yang sedang dikerjakan. Tidak ada kehilangan data (level/skor/riwayat soal tidak tersentuh), cuma counter kecil yang soft-reset — dampaknya minor untuk alat latihan formatif berisiko rendah.

**Efek berantai ke ambang bank soal (§13.2/§13.3)**: rumus `min soal per level = 3 + K` (berbasis syarat streak lama) berubah jadi **`benar-mandiri-untuk-naik + K`**: Level 1 = 4+K (K≥4 → min **8**, sebelumnya 7), Level 2 = 4+K (K≥2 → min **6**, sebelumnya 5), Level 3 = 2+K (K≥2 → min **4**, sebelumnya 5 — justru turun karena ambang naiknya lebih rendah). `gate-c-audit-bank-soal.mjs` diperbarui mengikuti rumus baru ini.

**Audit ulang 12 sub-materi §13.2/§13.3 dengan ambang baru** (2026-07-28): 9 dari 12 kini di bawah ambang Level 1 baru (K=3, butuh K≥4 — kurang 1 soal dari min 8), karena semuanya berhenti tepat di 7 soal Level 1 saat dikerjakan dengan rumus lama. Tiga di antaranya (Operasi dan Konversi Desimal, SPLDV, Persentase) juga kurang 1 di Level 2 (K=1, butuh K≥2). Operasi Aritmatika Dasar dan Sifat Operasi Bilangan tetap bersih (Level 1 masing-masing 13 dan 8 soal).

**Gap ditutup (2026-07-28, SELESAI)**: 13 soal baru ditulis — 1 di Level 1 untuk tiap sub-materi yang kurang (KPK dan FPB, Operasi Pecahan, Operasi dan Konversi Desimal, Pengenalan Variabel, Manipulasi Aljabar Dasar, PLSV, SPLDV, Persentase, Perbandingan dan Skala, Pembulatan dan Estimasi), plus 1 di Level 2 untuk Operasi dan Konversi Desimal, SPLDV, dan Persentase. Bukan cuma pengisi kuantitas — tiap soal menutup celah kecil yang masih tersisa dari audit sebelumnya (mis. konversi desimal→pecahan di Level 1 yang sebelumnya cuma ada di Level 2; arah pecahan-biasa→campuran yang sebelumnya cuma ada arah sebaliknya; pengenalan konsep "ekspresi ekuivalen" ala SAT yang belum pernah dipakai). File gabungan: `~/Downloads/reimport/bank_soal_gabungan_tambahan3_gap_level.json`. Diverifikasi ke ekspor Firestore segar: nol peringatan K di seluruh 12 sub-materi dengan ambang baru (min L1=8, L2=6, L3=4).

---

## 15. Rencana bank soal matrikulasi numerasi — tanpa konteks (2026-07-29, rencana)

Pemilik proyek minta jalur remedial untuk kelas matrikulasi: siswa berkemampuan numerasi sangat lemah butuh materi yang **tidak membingungkan arahnya** dan soal yang **tidak menambah beban baca** di atas beban konsep. Alasan diagnostik juga disebutkan eksplisit: soal berkonteks (cerita) mengaburkan apakah siswa salah karena **konsep** (mis. aturan tanda) atau karena **salah baca soal** — untuk siswa yang levelnya serendah ini, itu dua masalah berbeda yang butuh intervensi berbeda, dan bank soal saat ini tidak bisa memisahkannya.

### 15.1 Keputusan yang sudah diambil

- **(Koreksi 2026-07-29)** Draf pertama section ini salah menyimpulkan "bagian tabnya dihilangkan saja" sebagai *jangan buat tab baru*. Pemilik proyek mengonfirmasi ulang: maksudnya **tab baru tetap dibuat** — kalimat itu cuma berarti "abaikan kolom Tab di tabel yang saya kirim, itu cuma referensi tab lama". Keputusan final: **tab baru "Matrikulasi Numerasi"**, berisi 12 sub-materi bernama **`Matrikulasi - <nama sub-materi lama>`** (format final, dikonfirmasi pemilik proyek 2026-07-29).
- **Kode strukturnya SUDAH dikerjakan** (2026-07-29): `DAFTAR_MATERI_INTI` (`kurikulumData.js`) dapat entri `"Matrikulasi Numerasi"`; `urutanTab` (`pilihMateri.js`) diubah eksplisit supaya tab ini tampil sebelum "Prasyarat"; `TAHAPAN_MATRIKULASI_NUMERASI` (baru) di-spread ke `PETA_TAHAPAN` dengan 4 tahap meniru struktur Bagian tes diagnostik (Aritmatika / Aljabar Dasar / Persamaan Linear / Numerasi Terapan). `PETA_PRASYARAT` sengaja tidak diisi. 137 test Jest lolos. Tab belum tampil di UI karena belum ada soal (`jumlah_soal === 0` disaring di `pilihMateri.js:153`) — baru muncul setelah soal pertama diimpor.
- **Nama unik itu bukan soal gaya, tapi wajib secara teknis.** Dicek tiga tempat yang key-nya **flat, cuma nama sub-materi, tidak ikut sertakan `materi_utama`**:
  1. `PETA_TAHAPAN` & `PETA_PRASYARAT` (`kurikulumData.js`) — digabung dari semua tab lewat spread (`kurikulumData.js:718-731`), nama yang sama dari tab berbeda saling timpa.
  2. `hitungSetMaster` (`kurikulumEngine.js:76-77`) — kunci status master cuma `normalisasiNama(hasil.sub_materi)` (lowercase+trim, tidak strip tanda kurung/bracket — prefiks aman dari normalisasi ini).
  3. Query progres (`gelarService.js:40`, `latihanService.js:40,188`) — `where("sub_materi", "==", subMateri)`, tanpa `materi_utama`.

  Kalau nama sub-materi baru identik dengan yang lama, status master/progres siswa di dua tab akan **tercampur**. Prefiks unik menghindari ini sepenuhnya.
- **Kode yang perlu diubah untuk tab-nya sendiri** (di luar authoring soal):
  - `DAFTAR_MATERI_INTI` (`kurikulumData.js`) — tambah `"Matrikulasi Numerasi"`. Tanpa ini, `pilihMateri.js:118-122` melempar semua sub-materi barunya ke tab "Prasyarat" generik (materi_utama di luar daftar otomatis masuk situ).
  - `urutanTab` (`pilihMateri.js:130`) — saat ini hardcode `["Prasyarat", ...DAFTAR_MATERI_INTI]`, jadi Prasyarat **selalu** tab pertama apa pun isi array. Supaya Matrikulasi Numerasi tampil **sebelum** Prasyarat (sesuai permintaan awal), urutan ini perlu diubah eksplisit.
  - `PETA_TAHAPAN` — perlu entri baru untuk 12 nama sub-materi baru (boleh satu "Tahap" tunggal kalau tidak perlu sub-pengelompokan visual, atau dipecah kalau mau).
  - `PETA_PRASYARAT` — **sengaja tidak diisi apa pun** untuk 12 sub-materi baru ini, supaya semuanya leaf node = terbuka penuh (formatif *dan* ujian) dan **tidak menggerbang apa pun juga** — persis "no connection" yang diminta di pesan pertama.
- **Bank soal `all` yang ada sekarang tidak disentuh** — karena sub-materi barunya punya nama sendiri (bukan menambah ke sub-materi lama), pemisahannya otomatis lewat struktur data, **tidak perlu** field tag (`tanpa_konteks`) atau perubahan ke "Latihan Spesial" seperti draf pertama section ini. Dibuang dari rencana.
- **(Dibuang 2026-07-29)** Rencana lembar cetak asrama dari bank soal ini — pemilik proyek memutuskan materi cetak asrama akan dibuat lewat alat/web lain, di luar cakupan proyek ini.

### 15.2 Definisi "tanpa konteks" per sub-materi

Untuk 9 dari 12 sub-materi ini "tanpa konteks" berarti murni: ekspresi/simbol matematis, nol narasi ("Andi membeli...", "Sebuah toko..."). **3 sub-materi Numerasi Terapan (Persentase, Perbandingan dan Skala, Pembulatan dan Estimasi) memakai "konteks minimal" — dikonfirmasi 2026-07-29**, karena soal aslinya di tes diagnostik (Bagian 6, No. 40-50) memang begitu: sebagian murni simbolik ("Berapakah 10% dari 200?", "Sederhanakan perbandingan 12:18", "Taksirlah hasil 19×21..."), sebagian pakai satu objek generik tanpa nama orang/tempat/narasi bertahap ("Sebuah baju berharga Rp80.000 mendapat diskon 20%...", "Sebuah denah berskala 1:1.000..."). Pola persis ini (No. 40-50) jadi acuan gaya untuk ketiga sub-materi tersebut — bukan didesain ulang dari nol, tinggal direplikasi & divariasikan angkanya.

### 15.3 Checklist konsep per sub-materi (dasar bank soal baru)

Fokusnya konsep-benar-atau-salah (sesuai arahan "bukan variasi, tapi konsep"), bukan gaya soal:

1. **Operasi Aritmatika Dasar** — *(dicatat eksplisit: wajib termasuk urutan operasi/PEMDAS-KaliBaTaKu)*: urutan operasi (kali/bagi sebelum tambah/kurang, dengan & tanpa kurung); penjumlahan tanda (+/+, +/−, −/−); pengurangan termasuk "kurang negatif = tambah"; perkalian tanda (empat kombinasi ±×±); pembagian tanda; operasi bertingkat 2-3 langkah.
2. **Sifat Operasi Bilangan** — komutatif (berlaku di +,× — TIDAK di −,÷); asosiatif (+,×); distributif perkalian atas +/−; unsur identitas (0 dan 1) & invers.
3. **KPK dan FPB** — faktorisasi prima; FPB via faktor persekutuan/faktorisasi; KPK via faktorisasi; hubungan FPB×KPK = a×b (level 3).
4. **Operasi Pecahan** — menyamakan penyebut untuk +/−; kali pecahan (langsung); bagi pecahan (kali kebalikan); campuran↔biasa dua arah; menyederhanakan (FPB).
5. **Operasi dan Konversi Desimal** — +/−/×/÷ desimal (penjajaran koma/pergeseran); konversi pecahan↔desimal dua arah; bandingkan/urutkan campuran pecahan-desimal.
6. **Pengenalan Variabel** — substitusi nilai ke ekspresi (evaluasi murni, bukan translasi cerita→ekspresi); membaca koefisien/variabel.
7. **Manipulasi Aljabar Dasar** — suku sejenis (gabung/kurangi); distribusi termasuk tanda negatif di depan kurung `-a(b-c)`; faktorisasi sederhana (FPB suku).
8. **PLSV** — isolasi variabel (operasi kebalikan kedua ruas); variabel di kedua ruas; koefisien pecahan/desimal; kasus tak-terhingga/tanpa-solusi (level 3).
9. **SPLDV** — substitusi; eliminasi; murni dua persamaan eksplisit (bukan translasi cerita).
10. **Persentase** — persen-dari-bilangan; konversi persen↔pecahan↔desimal; naik/turun persen sederhana (konteks minimal, lihat §15.2).
11. **Perbandingan dan Skala** — sederhanakan rasio a:b; perbandingan senilai; perbandingan berbalik nilai; skala (konteks minimal).
12. **Pembulatan dan Estimasi** — pembulatan bilangan bulat (puluhan/ratusan terdekat); pembulatan desimal (n angka di belakang koma); taksiran hasil operasi (bulatkan dulu, baru hitung).

### 15.4 Level (bintang) — eskalasi angka, bukan eskalasi tipe

Sesuai arahan awal ("dasar banget semuanya, walaupun bintang 3"): ketiga level tetap dalam skill family yang sama per sub-materi di atas — Level 3 **tidak** memperkenalkan konsep baru, cuma menambah beban kerja (angka lebih besar/pecahan lebih rumit/lebih banyak langkah dirantai, lebih banyak tanda negatif bertumpuk). Ini beda prinsip dari bank soal reguler (yang levelnya memang boleh naik kompleksitas konsep).

### 15.5 Target jumlah soal

Pakai ambang K yang sudah berlaku (§14): minimal **8 soal Level 1, 6 Level 2, 4 Level 3 = 18/sub-materi**, supaya tab Matrikulasi Numerasi memenuhi ambang 10 soal (§4) untuk ujian sumatif dan headroom K formatif dengan sendirinya (pool-nya memang berdiri sendiri sejak awal, bukan cuma "cukup dipakai" seperti draf sebelumnya — sekarang ini satu-satunya pool untuk nama sub-materi itu). 12 sub-materi × 18 = **216 soal baru**. Ini baseline sesuai ambang resmi, bukan target variasi — pengulangan struktur dengan angka berbeda di dalam satu level itu diharapkan, bukan cacat (persis seperti maksud "variasi duplikat dari soal tes diagnostik").

### 15.6 Rencana eksekusi (belum dikerjakan)

1. **Putuskan nama final 12 sub-materi** (prefiks — lihat §15.1) sebelum authoring, supaya `id`/nama tidak perlu diganti-ganti belakangan.
2. Kode struktur tab: tambah `"Matrikulasi Numerasi"` ke `DAFTAR_MATERI_INTI`, ubah `urutanTab` di `pilihMateri.js` supaya tab ini tampil sebelum "Prasyarat", tambah entri `PETA_TAHAPAN` untuk 12 nama baru. **Tidak** menyentuh `PETA_PRASYARAT` (sengaja kosong, lihat §15.1). Jalankan test Jest terkait (`kurikulumEngine.test.js`, `tataLetakPeta.test.js`) setelah perubahan ini.
3. Authoring soal per sub-materi, format sama seperti `arsip-data/bank_soal/prasyarat/*.json` (field sama, `sub_materi` pakai nama baru), ditaruh di folder baru (usul: `arsip-data/bank_soal/matrikulasi-numerasi/*.json`).
4. Jalankan `gate-c-audit-bank-soal.mjs "<nama sub-materi baru>"` setelah authoring untuk cek distribusi level & duplikat struktural sebelum impor — pola yang sama seperti §13/§14.
5. Impor lewat `admin.html` → Bank Soal → "Impor JSON" (pola §10), lalu hapus berkas arsip supaya tidak ter-impor dobel. Jalankan Gate A (`gate-a-audit-kurikulum.mjs`) sekali lagi setelah impor karena `DAFTAR_MATERI_INTI`/`PETA_TAHAPAN` berubah.
6. **Belum diputuskan, tidak memblokir langkah 1-5**: aturan turun-level formatif "2× salah berturut-turut, reset ke 0 kalau benar" yang diusulkan pemilik proyek — berbeda dari aturan kumulatif yang berlaku sekarang (`soalEngine.js:106-113`). Kalau mau dipakai khusus tab ini, butuh parameter baru di `perbaruiLevelAdaptif` + audit K ulang (streak lebih longgar terhadap error menyebar, mengubah seberapa sering siswa didorong turun level).

**Authoring SELESAI (2026-07-29)**: 216 soal ditulis (12 sub-materi × 18, didelegasikan ke 11 agent paralel — 1 sub-materi dikerjakan Root Agent sendiri sebagai sampel gaya yang disetujui pemilik proyek sebelum scale-up). File di `arsip-data/bank_soal/matrikulasi-numerasi/matrikulasi-<slug>.json`, satu file per sub-materi. Validasi agregat lintas 12 file (dijalankan Root Agent, bukan cuma laporan tiap agent): total 216 soal, distribusi level `{1:8, 2:6, 3:4}` tepat di SEMUA sub-materi, nol soal dengan `jawaban_benar` hilang dari `opsi`, nol opsi duplikat, nol pertanyaan identik lintas file, `materi_utama`/`sub_materi` di semua 216 soal cocok persis dengan 12 nama resmi (match ke key `TAHAPAN_MATRIKULASI_NUMERASI`). Spot-check manual ~12 soal (KPK-FPB hubungan FPB×KPK, PLSV kasus tanpa-solusi/tak-terhingga, SPLDV eliminasi 2-langkah, Persentase, Perbandingan-Skala, Pembulatan) — semua perhitungan diverifikasi ulang, tidak ditemukan kesalahan.

**Digabung jadi satu file (2026-07-29)**: 12 file per sub-materi digabung ke `arsip-data/bank_soal/matrikulasi-numerasi/matrikulasi_numerasi_gabungan.json` (216 soal, urutan per sub-materi dijaga) supaya impor cukup sekali lewat "Impor JSON", bukan 12×. Divalidasi ulang setelah digabung (total 216, distribusi 8/6/4 tepat di semua 12 sub-materi, nol jawaban hilang/opsi duplikat). 12 file per sub-materi yang lama **dihapus** setelah tergabung, supaya tidak ada risiko ter-impor dobel (satu file lama + gabungan).

**SELESAI (2026-07-29)**: pemilik proyek sudah mengimpor `matrikulasi_numerasi_gabungan.json` ke Firestore lewat `admin.html` → Bank Soal → "Impor JSON" (berjalan aman, dikonfirmasi pemilik proyek). Verifikasi pasca-impor: `gate-a-audit-kurikulum.mjs` → VERDIKT LOLOS, ke-12 sub-materi muncul dengan 18 soal masing-masing di kategori "punya soal, tidak ada di peta = default TERBUKA" (sesuai desain §15.1 — sengaja tidak didaftarkan ke `PETA_PRASYARAT`); 137 test Jest lolos. File arsip gabungan **sudah dihapus** dari `arsip-data/bank_soal/matrikulasi-numerasi/` (folder ikut dihapus karena jadi kosong) supaya tidak ter-impor dobel — sumber kebenarannya sekarang Firestore, pola sama seperti §10/§14.

**Sisa pekerjaan (belum dikerjakan, di luar cakupan yang diminta sejauh ini)**:
- Keputusan turun-level formatif "2× salah berturut-turut, reset kalau benar" (§15.6 langkah 6) — belum diputuskan, tidak memblokir apa pun yang sudah selesai.
- Verifikasi visual tab "Matrikulasi Numerasi" di `pilih-materi.html` langsung di browser (soal sudah di Firestore, kode tab sudah benar secara test, tapi belum ada pengecekan visual manual).

---

## 16. Materi UH: di luar alur adaptif, plus gagasan "bonus Level 4" (2026-08-03)

Konteks: pembedahan tiga PDF sumber (`Eksponen 1.1/1.2/1.3`) menghasilkan soal yang levelnya jelas di atas Level 3 bank latihan — variabel sebagai pangkat, akar bersusun, penyebut tiga suku, esai uraian. Catatannya di `arsip-data/bank-soal-uh/*.md`, naskahnya di `arsip-data/bank-soal-uh/uh-eksponen-1-*.docx`. Sejak berkas UH pertama dibuat (2026-07-31) selalu tertulis pertanyaan terbuka "wadahnya di mana" — sekarang terjawab.

### 16.1 Keputusan: materi UH TIDAK masuk alur adaptif (sementara)

Keputusan pemilik proyek 2026-08-03. Materi UH ditangani **website tes terpisah milik pemilik proyek** (berbasis tes, punya template impor `.docx` sendiri — salinannya di `arsip-data/bank-soal-uh/template-import-soal.docx`), bukan lewat LMS ini.

Konsekuensinya, dan ini yang penting supaya tidak salah kaprah nanti:

- **Tidak ada Level 4** di `soalEngine.js`. `AMBANG_NAIK_LEVEL` tetap 4/4/2 untuk Level 1/2/3.
- **Tidak ada sub-materi baru** ("Sifat Eksponen Lanjutan" dsb.) di `kurikulumData.js`. Tiga opsi wadah yang dulu didaftar di berkas UH — level 4, sub-materi terpisah, bank UH tersendiri — yang dipilih adalah **yang ketiga, dan di luar repo ini**.
- **Ambang §4 dan headroom §14 tidak tersentuh.** Ini bukan detail administratif: menambah Level 4 ke sub-materi yang sudah ada akan membuat ambang naik-level dan headroom K harus dihitung ulang untuk SELURUH sub-materi, bukan cuma yang dapat soal UH.
- Berkas di `arsip-data/bank-soal-uh/` statusnya **dokumen kerja guru**, bukan sumber data aplikasi. Tidak pernah diimpor lewat `admin.html`, tidak pernah ter-deploy (`firebase.json` hanya menyajikan `public/`).

### 16.2 Gagasan jangka panjang: pop-up "latihan bonus" setelah tuntas

Diusulkan pemilik proyek 2026-08-03, **eksplisit ditandai sebagai rencana jangka panjang — tidak untuk dikerjakan sekarang.** Dicatat di sini supaya tidak hilang, bukan sebagai antrean kerja.

Gagasannya: begitu siswa menuntaskan sebuah sub-materi (bintang 3 / master), muncul tawaran latihan "Level 4" sebagai **bonus** — opsional, di luar jalur ketuntasan.

Yang membuat gagasan ini menarik: ia memberi wadah bagi materi UH **tanpa** menyentuh mesin ketuntasan, karena sifatnya menawarkan bukan mewajibkan. Itu berbeda dari "menambah Level 4 ke tangga adaptif", yang justru yang dihindari di §16.1.

Pertanyaan yang harus dijawab sebelum ini boleh dikerjakan — belum satu pun dijawab:

1. **Apakah hasilnya tercatat, dan di mana?** Kalau masuk `hasil_latihan`, ia berisiko ikut terhitung oleh `isHasilMasterSumatif()` dan mencemari status master. Preseden yang relevan: "Latihan spesial tidak pernah memberi status master" (§9) — modenya di luar `MODE_UJIAN` sehingga nilainya tidak membuka kunci apa pun. Bonus Level 4 kemungkinan besar harus mengikuti pola yang sama.
2. **Soalnya dari mana?** Bank UH sekarang hidup di `.docx` di luar Firestore. Memakainya di LMS berarti mengarangnya ulang sebagai JSON — dengan `clue` + `pembahasan` bergaya bank utama, bukan sekadar salin kunci.
3. **Berapa soal minimum?** Kalau ia punya level sendiri, ia butuh headroom sendiri (§14). Kalau ia sekadar kumpulan pengayaan tanpa naik-turun level, tidak. Ini menentukan apakah biayanya ~4 soal atau ~18 soal per sub-materi.
4. **Pop-up muncul sekali atau tiap kali?** Pop-up yang muncul berulang setelah tiap ujian tuntas akan cepat jadi gangguan.

Jangan mulai mengarang soal Level 4 sebelum pertanyaan 1 dan 3 dijawab — urutan itu yang menentukan berapa banyak soal yang perlu ditulis.
