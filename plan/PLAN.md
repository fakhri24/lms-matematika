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

**Fase 5 — Fungsi Kuadrat, disiapkan 2026-07-26 (menunggu impor & verifikasi).** 2 sub-materi baru (20 soal) + 1 reklasifikasi (rename saja, isi tidak diubah) untuk tab Fungsi Kuadrat, dari Bab 9 prota (subbab 9.1 Definisi dan Karakteristik / 9.2 Menyusun Persamaan Parabola / 9.3 Penyelesaian Masalah):

1. **Sifat dan Grafik Fungsi Kuadrat** (Tahap 1, pintu masuk) — **rename** dari "Fungsi Kuadrat" (`materi_utama` "Aljabar Lanjutan" → "Fungsi Kuadrat", tab Prasyarat → tab sendiri), isi TIDAK diubah: sifat & grafik parabola (arah buka, titik puncak, translasi, akar dari grafik).
2. **Menyusun Persamaan Parabola** (Tahap 2, baru) — menyusun persamaan dari akar-akar+titik, titik puncak+titik, tiga titik sembarang, akar kembar (tangen sumbu X), dan penalaran sumbu simetri.
3. **Aplikasi Fungsi Kuadrat** (Tahap 3, baru) — pemodelan dari deskripsi verbal (bukan fungsi yang sudah diberikan) lalu optimasi lewat titik puncak: luas maksimum berpagar, lintasan proyektil, titik impas (BEP), laba maksimum — sesuai `temaPM` Bab 9 ("Model lintasan, titik impas, laba maksimum").

Gerbang: **"Sifat dan Grafik Fungsi Kuadrat" digerbangkan oleh SELURUH sub-materi Relasi dan Fungsi (7) + SELURUH sub-materi Persamaan Kuadrat (5)** — beda dari Fase 1/3/4, gerbang ini **langsung ditulis penuh sekaligus** (tidak ditunda) karena kedua tab prasyaratnya sudah lengkap & terverifikasi sejak Fase 3 & 4. Konsekuensi yang disengaji: begitu data reimport (nama baru) masuk, 10 soal "Sifat dan Grafik Fungsi Kuadrat" yang sebelumnya TIDAK PERNAH terkunci (tab Prasyarat) langsung menjadi gerbang pertama tab baru — bagian dari promosi "Fungsi Kuadrat" jadi tab materi utama sendiri, bukan bug. Rantai internal: Sifat dan Grafik → Menyusun Persamaan Parabola → Aplikasi Fungsi Kuadrat.

`TAHAPAN_FUNGSI_KUADRAT` ditambahkan ke `PETA_TAHAPAN`; entri "fungsi kuadrat" dihapus dari `TAHAPAN_PRASYARAT_SMP` (Tahap 5: Area Kuadratik kini cuma 3 sub-materi tersisa).

**Alur impor**: dua file baru (`bank_soal_menyusun_persamaan_parabola.json`, `bank_soal_aplikasi_fungsi_kuadrat.json`, tanpa `id`) aman diimpor langsung. File reklasifikasi (`~/Downloads/reimport/bank_soal_sifat_dan_grafik_fungsi_kuadrat.json`, `id` diambil dari ekspor Firestore live terakhir, `materi_utama`/`sub_materi` diganti) **wajib** diimpor lewat jalur replace (§11.6), bukan file baru — supaya tidak duplikat dengan 10 soal "Fungsi Kuadrat" lama.

Kode lolos Jest 100/100 lokal (tambahan: cek rantai gerbang Fungsi Kuadrat bisa dibuka setelah Relasi dan Fungsi + Persamaan Kuadrat master, dan cek tab ini tetap terkunci bila Persamaan Kuadrat belum lengkap). Gate A lokal terhadap arsip campuran menunjukkan "sifat dan grafik fungsi kuadrat" 0 soal (temuan 1, deadlock) — **ini diharapkan**, karena datanya masih bernama "fungsi kuadrat" di Firestore sampai reimport dilakukan; sama seperti pola rename Fase 4. Belum di-push — menunggu konfirmasi impor lalu verifikasi ekspor Firestore live segar.

Lalu diverifikasi dengan ekspor segar sebelum di-commit & push.
