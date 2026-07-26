# Kunci Materi & Peta Materi — Catatan Rancangan

> Sebuah sub-materi di tab Trigonometri hanya bisa dikerjakan sebagai **ujian** bila semua prasyaratnya sudah berstatus **master**. Prasyaratnya disusun **manual oleh guru**; urutan tampil kartu diambil dari urutan mengajar di `PETA_TAHAPAN`.

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
| 10 | Lingkup penguncian | **Hanya tab Trigonometri.** Tab Prasyarat sepenuhnya terbuka |
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
INPUT : PRASYARAT_TRIGONOMETRI (tabel manual), setMaster
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

Field `konsep_prasyarat` tetap berharga sebagai **penasihat** — persentase pemakaiannya tersimpan sebagai komentar `// 63%` di sebelah tiap prasyarat di `PRASYARAT_TRIGONOMETRI` — tapi tidak boleh jadi sumber kebenaran urutan.

**Peta linear.** Bentuk lama (55 node, tiap node tepat 1 prasyarat dan 1 anak) membuat siswa **selalu** hanya melihat `master + 2` materi terbuka, dan membuat visualisasi pohon mustahil — tidak ada algoritma tata letak yang bisa menciptakan cabang yang tidak ada di datanya. Tabel manual bercabang menyelesaikan keduanya sekaligus.

---

## 8. Yang belum dikerjakan

**Panel diagnostik kurikulum di `admin.html`** (keputusan #5) — menampilkan `namaTakDikenal`, `urutanMundur`, dan `prasyaratTakMungkinMaster` dari `validasiKurikulum()`. Prioritas rendah: Gate A menemukan nol masalah, jadi panel ini murni pencegahan untuk materi yang ditambahkan nanti.

**Eksponen & Logaritma.** Soalnya belum masuk Firestore dan sub-materinya bersoal 1–4. Keduanya tidak ada di `PRASYARAT_TRIGONOMETRI`, jadi sepenuhnya terbuka dan tidak ada yang rusak. Saat soalnya nanti dimasukkan, perlu diputuskan apakah kedua tab itu ikut digerbangkan — kalau ya, tabelnya disusun manual dengan cara yang sama, **dan soalnya harus ≥10 dulu** (§4).

**Data lama di bawah ambang sengaja dibiarkan** (keputusan pemilik proyek, 2026-07-26). Jangan menghapusnya tanpa permintaan eksplisit.

---

## 9. Catatan yang tidak diambil

**Tabel alias nama lawas tidak dibangun.** Riwayat masih memuat `Sifat Sudut (Berseberangan & Berpelurus)` — nama gabungan yang kini dipecah dua. Pengecekan data live: **tepat 1 record**, dan materinya bukan prasyarat siapa pun, jadi dampaknya ke penguncian nol. Perlu ditinjau ulang kalau Sifat Sudut suatu saat menjadi prasyarat.

**Latihan spesial tidak pernah memberi status master.** Modenya di luar `MODE_UJIAN`, jadi berapa pun nilainya tidak membuka kunci apa pun. Sesuai desain, dicatat agar tidak jadi kejutan.
