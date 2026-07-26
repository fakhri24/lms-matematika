# RENCANA FITUR: "Kunci Materi" (Prerequisite Gating)

> **Tujuan:** Sebuah sub-materi di tab Trigonometri bisa dibuka **hanya jika** semua materi prasyaratnya sudah berstatus **`master`**. Prasyaratnya disusun **manual oleh guru** dalam tabel `PRASYARAT_TRIGONOMETRI`; urutan tampil kartu diambil dari urutan mengajar di `PETA_TAHAPAN`.

**Status:** terimplementasi dan terverifikasi terhadap Firestore live (§7).

> ### ⚠️ PERUBAHAN ARAH 2026-07-26 — algoritma diganti tabel manual
>
> Rencana ini semula dibangun di atas **Algoritma Kahn (topological sort)** dan peta prasyarat yang **diturunkan dari data soal**. Keduanya sudah **dibongkar**. Alasannya dicatat di **§12**; ringkasnya: `konsep_prasyarat` per-soal mencatat apa yang dibutuhkan untuk *mengerjakan* soal, bukan apa yang harus *dipelajari lebih dulu*, sehingga penurunan otomatis membalik 30 dari 53 urutan mengajar.
>
> Bagian yang masih menyebut Kahn, `PETA_PRASYARAT_MANUAL`, atau deteksi siklus sebagai rencana **sudah diperbarui**. Hasil Gate A dan Gate B (§8) sengaja **dipertahankan apa adanya** sebagai catatan sejarah — angka-angkanya benar untuk peta yang berlaku saat itu, dan justru itulah yang memicu perubahan arah ini.

---

## 1. Kondisi Saat Ini (Temuan)

| Komponen | Berkas | Kondisi sekarang |
|---|---|---|
| Peta prasyarat (hard-code) | `public/js/utils/kurikulumData.js` → `PETA_PRASYARAT_MANUAL` | Rantai linear `target → [prasyarat]`. Sudah ada. **→ Diganti `PRASYARAT_TRIGONOMETRI` (§12).** |
| Graf + Algoritma Kahn | `public/js/pages/pilihMateri.js` → `bangunGraphKurikulum()` + BFS `inDegree` | Sudah memakai Kahn, tapi **hanya untuk mengurutkan** kartu, bukan mengunci. **→ Dihapus; urutan kini dari `PETA_TAHAPAN` (§12).** |
| Render kartu | `public/js/views/pilihMateriView.js` → `createMateriCardHTML()` | Kartu selalu bisa diklik; belum ada state terkunci. |
| Klik → navigasi | `pilihMateri.js` listener `wadah-konten-tab` | Selalu mengarahkan ke `latihan.html`/halaman formatif. |
| Definisi "master" | `services/gelarService.js` (`nilai>=80` & `>=10 soal`) dan `admin/ketuntasanController.js` (`sumatif_lulus`) | Logika **terduplikasi** di dua tempat, belum ada helper murni bersama. Definisi final (§3) **identik** dengan aturan `gelarService`. |
| Sumber data hasil | koleksi `hasil_latihan` (sumatif **dan** draf formatif), `progres_belajar` (log per-soal) | `getRiwayatLatihanSiswa(nis)` sudah tersedia di `latihanService.js`. |
| Identitas siswa | `localStorage.nis_siswa` | Tersedia di sisi klien. |

**Kesimpulan (saat rencana ini ditulis):** infrastruktur graf + Kahn sudah ada. Yang belum ada: (a) definisi "master" tunggal & murni, (b) lapisan penilaian status kunci, (c) tampilan & pemblokiran klik kartu terkunci, (d) diagnostik kurikulum untuk admin.

> **Ditinjau ulang 2026-07-26:** poin (a)–(c) selesai. Infrastruktur Kahn ternyata **bukan aset melainkan beban** — lihat §12.

---

## 2. KEPUTUSAN DESAIN (FINAL)

| # | Pertanyaan | Keputusan |
|---|---|---|
| 1 | Lingkup evaluasi prasyarat | **Lintas-tab (global)** — filter `materiSahDiTabIni` tidak dipakai untuk penguncian |
| 2 | Mode yang dikunci | **Hanya mode ujian** (`tes_normal`/`tes_acak`) — formatif **selalu terbuka** *(revisi 2026-07-25, mitigasi Gate B opsi C)* |
| 3 | Definisi `master` | **Sumatif lulus saja** — formatif **tidak** disyaratkan tuntas *(revisi 2026-07-25)* |
| 4 | Rollout siswa lama | **Strict** — berlaku penuh sejak rilis, tanpa grandfathering |
| 5 | Prasyarat tanpa soal | **Tetap memblokir** + tampilkan peringatan ke admin |
| 6 | Sub-materi belum dipetakan | **Terbuka** (dianggap titik masuk) |
| 7 | UX klik kartu terkunci | **Toast** berisi daftar prasyarat yang belum master |
| 8 | Materi yang sendirinya sudah master | **Tidak pernah dikunci**, walau prasyaratnya belum *(baru 2026-07-25, temuan uji manual)* |
| 9 | Sumber peta prasyarat | **Disusun manual oleh guru**, bukan diturunkan dari `konsep_prasyarat` *(2026-07-26, lihat §12)* |
| 10 | Lingkup penguncian | **Hanya tab Trigonometri.** Tab Prasyarat sepenuhnya terbuka *(2026-07-26)* |
| 11 | Sumber urutan kartu | **`PETA_TAHAPAN`** (urutan mengajar di kelas), bukan hasil topological sort *(2026-07-26)* |

### Dasar keputusan #9–#11
Lihat §12. Inti: urutan mengajar adalah keputusan pedagogis milik guru, dan tidak dapat disimpulkan dari data soal. Keputusan #10 menggantikan keputusan #1 dalam praktik — prasyarat masih boleh **lintas-tab** (materi Trigonometri boleh mensyaratkan Teorema Pythagoras), tetapi yang **dikunci** hanya kartu di tab Trigonometri.

### Dasar keputusan #8
Gerbang ini memakai prasyarat untuk **menduga** kesiapan siswa. Nilai sumatif ≥80 atas materi itu sendiri adalah **bukti langsung** kesiapan, dan bukti langsung mengalahkan dugaan. Tanpa aturan ini, siswa yang menguasai materi lewat urutan lain — atau di bawah kurikulum lama — justru terhalang mengulang materinya sendiri untuk memperbaiki nilai. Aturan ini juga mengalahkan fail-safe siklus (§4), karena penyebab terkuncinya di situ adalah peta yang rusak, bukan siswa yang belum siap.

Uji manual menemukan **7 kasus nyata** pada satu akun saja, jadi ini bukan kasus tepi.

### Catatan penting atas kombinasi #4 + #5
Kombinasi **strict** + **prasyarat bermasalah tetap memblokir** berpotensi mengunci banyak siswa sekaligus di hari rilis. Karena semua rantai di `PETA_PRASYARAT_MANUAL` bersifat **linear**, satu simpul bermasalah dapat mengunci seluruh rantai sesudahnya. Karena itu **§8 Gate Pra-Rilis wajib dijalankan dan dinyatakan lolos sebelum fitur diaktifkan** — bukan langkah opsional.

> **Diperbarui 2026-07-26:** peta manual (§12) memperlonggar risiko ini secara struktural. Rantai terpanjang kini **6 langkah**, bukan 25, dan tab Prasyarat tidak dikunci sama sekali — jadi satu materi bermasalah tidak lagi mematikan seluruh rantai di belakangnya.

Revisi #3 **meringankan** risiko dari sisi siswa (definisi master kini sama dengan aturan gelar yang sudah berjalan), tapi **memperberat** risiko dari sisi data soal — lihat **§4.1**, ambang 10 soal sekarang menjadi satu-satunya penentu dan bisa mengunci rantai secara permanen.

---

## 3. Definisi "Master" (Sumber Kebenaran Tunggal)

> **Revisi 2026-07-25:** syarat "formatif tuntas" **dihapus**. Alasan: sub-materi bisa punya banyak soal, sehingga mewajibkan seluruh formatif selesai berisiko membuat banyak siswa tidak pernah mencapai status master.

Sebuah **sub-materi** berstatus **`master`** bagi seorang siswa jika ada minimal 1 entri di `hasil_latihan` dengan:
- `mode_latihan` ∈ {`tes_normal`, `tes_acak`} (termasuk fallback lama `normal`, `acak`),
- `status` ≠ `draf`,
- `nilai >= MASTERY.NILAI_MIN` (80),
- jumlah soal dikerjakan `>= MASTERY.SOAL_MIN` (10) — dari `detail_jawaban` atau `log_percobaan`.

Formatif tetap berperan sebagai sarana belajar, tapi **tidak** menjadi syarat unlock. Siswa boleh melompat langsung ke sumatif jika mampu.

Ambang `80` dan `10` diangkat ke konstanta `MASTERY` di `constants.js`.

**Konsekuensi positif — definisi ini praktis sama dengan aturan gelar**, sehingga siswa yang sudah bergelar untuk suatu sub-materi hampir selalu sudah master, dan **dampak rollout strict jauh lebih ringan** daripada rencana sebelumnya.

> **Dikoreksi 2026-07-26 (§13):** "identik" ternyata terlalu percaya diri. `gelarService` tidak mengecek `status ≠ draf` dan tidak mengenal mode ujian warisan; `ketuntasanController` melewatkan syarat ≥10 soal sama sekali. Ketiganya kini memanggil `isHasilMasterSumatif()` yang sama, jadi barulah sekarang kata "identik" benar-benar berlaku.

> Meski begitu, `gelar_terbuka` **tidak boleh** dipakai sebagai sumber status master: nama gelar dipotong 25 karakter ([`gelarService.js:70-73`](public/js/services/gelarService.js:70)) sehingga lossy dan ambigu antar sub-materi berawalan sama. Status master tetap dihitung dari `hasil_latihan`.

**Efisiensi kueri:** dihitung dari **satu** kueri `getRiwayatLatihanSiswa(nis)`. **Tidak ada penambahan biaya baca Firestore selain itu.**

**Tidak ada deadlock:** kartu materi X terkunci oleh status master **prasyarat X**, bukan oleh status X sendiri. Begitu prasyarat terbuka, siswa langsung bisa mengerjakan X.

---

## 4. Bagaimana Tabel Manual Dipakai untuk Mengunci

*(Direvisi 2026-07-26. Versi sebelumnya memakai Algoritma Kahn; lihat §12.)*

Tidak ada algoritma graf. Penguncian hanyalah pencarian di tabel:

```
INPUT : PRASYARAT_TRIGONOMETRI (tabel manual, hanya tab Trigonometri),
        setMaster (sub-materi yang sudah master)
PROSES:
  untuk tiap entri (materi → daftar prasyarat):
    prereqBelum = prasyarat yang ∉ setMaster
    locked      = (materi ∉ setMaster) ∧ (prereqBelum tidak kosong)
OUTPUT: { subMateri → { locked, prereqBelum } }
```

Sifat penting:
- **Transitivitas otomatis** — cukup cek prasyarat **langsung**. Jika prasyarat terkunci maka ia belum master, sehingga materi sesudahnya ikut tertahan.
- **Materi yang tidak terdaftar di tabel** → tidak muncul di hasil, artinya **terbuka** (keputusan #6). Inilah cara tab Prasyarat dibiarkan bebas: materinya memang tidak ditulis (keputusan #10).
- **Prasyarat boleh lintas-tab** (keputusan #1) — `Rasio Trigonometri Dasar` mensyaratkan `Teorema Pythagoras` yang ada di tab Prasyarat. Yang tidak pernah dikunci adalah **kartunya**, bukan perannya sebagai syarat.
- **Prasyarat yang tak mungkin di-master** (keputusan #5) — tetap masuk `prereqBelum` (memblokir), **dan** dicatat ke daftar diagnostik untuk admin (§5.5). Lihat peringatan §4.1.
- **Siklus tidak lagi mungkin terbentuk**, jadi fail-safe siklus dihapus. Penggantinya `urutanMundur` di `validasiKurikulum`: pada daftar berurut, satu-satunya cara peta memutar balik adalah menulis prasyarat **sesudah** materinya. Itu perbandingan indeks, bukan penelusuran graf — dan pesan salahnya jauh lebih berguna bagi penyusun kurikulum ("prasyarat C ditulis sesudah A") ketimbang "ada siklus".

### 4.1 ⚠️ RISIKO BARU akibat revisi #3: ambang `SOAL_MIN` bisa mengunci permanen

Setelah syarat formatif dihapus, status master **sepenuhnya** bergantung pada satu ujian dengan **minimal 10 soal dikerjakan**. Konsekuensinya:

> Sub-materi yang **total soalnya di bank_soal < 10** tidak akan pernah bisa di-master oleh siapa pun — `soalDikerjakan >= 10` mustahil tercapai. Jika sub-materi itu menjadi prasyarat, seluruh rantai sesudahnya **terkunci permanen**.

Ini memperluas risiko keputusan #5: kriteria bahaya **bukan** `jumlah_soal = 0`, melainkan **`jumlah_soal < 10`**. Sub-materi dengan 7 soal terlihat normal di UI (tetap dirender, tetap bisa dikerjakan) tapi berperilaku seperti dinding buntu.

**Penanganan:** Gate A (§8) mengaudit ini lebih dulu. Dua kemungkinan hasil:
- **Tidak ada** prasyarat bersoal < 10 → tidak perlu keputusan tambahan, lanjut sesuai rencana.
- **Ada** → perlu keputusan Anda antara: (i) tambah soal sampai ≥ 10, atau (ii) longgarkan ambang menjadi efektif `min(SOAL_MIN, jumlah_soal)` sehingga materi bersoal 7 cukup dikerjakan 7 soal. **Rekomendasi saya: opsi (ii)**, karena membuat aturan tahan terhadap penambahan sub-materi baru di masa depan tanpa perlu audit ulang tiap kali.

Keputusan ini **ditunda sampai ada angka dari Gate A** — bisa jadi tidak ada satu pun materi terdampak, sehingga tak perlu diputuskan sama sekali.

---

## 5. Arsitektur Perubahan (per lapisan MVC/Service)

### 5.1 Utils — **BARU** `public/js/utils/kurikulumEngine.js` (fungsi murni, dapat di-Jest)
- `isSubMateriMaster(riwayatSub, ambang)` → bool — menerapkan definisi §3.
- `hitungSetMaster(riwayatLatihan)` → `Set<string>` — sub-materi yang sudah master.
- `hitungStatusKunci(petaPrasyarat, setMaster)` → `{ [subLower]: { locked, prereqBelum } }` — gerbang unlock (§4).
- `validasiKurikulum(petaPrasyarat, urutanKurikulum, petaJumlahSoal, ambang)` → `{ namaTakDikenal[], urutanMundur[], prasyaratTakMungkinMaster[], valid }` — penjaga tabel manual (§12.3) sekaligus bahan diagnostik admin (keputusan #5).

*(Direvisi 2026-07-26: `hitungUrutanTopologis()` dihapus bersama Kahn; `validasiKurikulum` bertambah parameter `urutanKurikulum` dan mengganti keluaran `siklus` dengan `namaTakDikenal` + `urutanMundur`.)*

Semua murni: tanpa DOM, tanpa Firestore.

### 5.2 Konstanta — `public/js/utils/constants.js`
Tambah `MASTERY = { NILAI_MIN: 80, SOAL_MIN: 10 }`.

### 5.3 Service — **reuse, tanpa kueri baru**
Pakai `getRiwayatLatihanSiswa(nis)` yang sudah ada. *(Refactor opsional §7: arahkan `gelarService` & `ketuntasanController` memakai helper baru agar DRY.)*

### 5.4 Controller — `public/js/pages/pilihMateri.js`
- Di `muatMateri()`: ambil `nis` dari localStorage → `getRiwayatLatihanSiswa(nis)` → `hitungSetMaster(riwayat)`.
- Hitung `hitungStatusKunci()` **sekali** dengan tabel penuh, lalu pakai hasilnya saat merender tiap tab.
- **Urutan kartu** (keputusan #11): `urutkanMateriTab()` menyaring `Object.keys(PETA_TAHAPAN)` sesuai isi tab. Materi yang belum tercantum di sana ditempel di akhir agar tidak hilang dari layar hanya karena kurikulumnya belum diperbarui.
- Teruskan `{ locked, prereqBelum }` ke `createMateriCardHTML`.
- **Reaktif terhadap mode (revisi #2):** kunci hanya aktif untuk mode ujian. Simpan `prereqBelum` di `data-prereq-belum` pada kartu, lalu fungsi `segarkanStatusKunci(mode)` menyalakan/mematikan kelas `.locked` — dipanggil saat render **dan** dari `ubahTampilanMode()` setiap kali radio mode berubah.
- Listener klik: jika kartu terkunci **dan** mode aktif adalah mode ujian → **cegah navigasi**, tampilkan toast berisi `prereqBelum` (keputusan #7).
- **Fail-safe:** jika kueri riwayat gagal, jangan mengunci semuanya — log error dan render tanpa kunci (agar kegagalan jaringan tidak memblokir seluruh siswa).

### 5.5 View
- `pilihMateriView.js` → `createMateriCardHTML(...)` menerima `{ locked, prereqBelum }`:
  - Terkunci → kelas `locked`, ikon 🔒, teks "Selesaikan dulu: <daftar>", `data-locked="true"`.
  - Terbuka → tampilan sekarang (opsional badge ✅ bila sudah master).
- **BARU** helper toast (mis. `createToastHTML` + fungsi tampil) — cek dulu apakah sudah ada pola toast/notifikasi di proyek agar tidak duplikat.
- **Diagnostik admin** (keputusan #5): tampilkan `namaTakDikenal`, `urutanMundur`, dan `prasyaratTakMungkinMaster` dari `validasiKurikulum()` di `admin.html`. Penempatan pasti ditentukan saat implementasi (kandidat: dekat panel Ketuntasan). *(Keluaran `siklus` sudah tidak ada sejak §12 — jangan dicari lagi.)*

### 5.6 CSS
Tambah `.materi-card.locked` (redup, `cursor: not-allowed`, gembok) + gaya toast, di berkas CSS yang relevan di `public/css/`.

### 5.7 Firestore Rules — **tidak berubah**
Penguncian ini **UX sisi-klien**, bukan kontrol keamanan. Siswa yang paham teknis bisa membuka `latihan.html` langsung. Ini dapat diterima: mengerjakan latihan bukan aksi merusak, dan skor tetap tercatat per-siswa. **Jika suatu saat penguncian harus ditegakkan sungguhan, perlu Cloud Function** — di luar cakupan (hosting statis, tanpa functions).

---

## 6. Rencana Uji (Jest)

`tests/utils/kurikulumEngine.test.js`:
1. `isSubMateriMaster` — lolos saat nilai≥80 ∧ soal≥10 ∧ mode ujian ∧ bukan draf; gagal bila salah satu tak terpenuhi; mode lama (`normal`/`acak`) tetap dihitung; **formatif diabaikan sepenuhnya** (revisi #3).
2. `hitungSetMaster` — sumatif lulus **tanpa** formatif apa pun → tetap **master**.
3. `hitungStatusKunci`:
   - Rantai `A → B → C`, `setMaster = {}` → `B` dan `C` terkunci.
   - `setMaster = {A}` → `B` terbuka, `C` terkunci.
   - Materi tak terdaftar tidak muncul di hasil = terbuka (keputusan #6).
   - Prasyarat lintas-tab tetap dievaluasi (keputusan #1).
   - Materi yang sendirinya master tidak pernah terkunci (keputusan #8).
   - `prereqBelum` memuat nama prasyarat yang tepat (untuk toast).
4. `validasiKurikulum` — mendeteksi `namaTakDikenal` (salah ketik), `urutanMundur` (prasyarat ditulis sesudah materinya), dan prasyarat dengan `jumlah_soal < SOAL_MIN` (§4.1).
5. **Integritas tabel produksi** — `PRASYARAT_TRIGONOMETRI` diuji langsung, bukan hanya lewat fixture; lihat §12.3.
6. **Data legacy defensif** — record tanpa `nilai`, tanpa `mode_latihan`, atau tanpa `detail_jawaban` tidak menyebabkan exception.

Semua wajib hijau sebelum commit (aturan global [AGENTS.md](AGENTS.md)).

---

## 7. Urutan Implementasi

1. [x] **Gate Pra-Rilis (§8)** — Gate A lolos, Gate B menghasilkan keputusan A+C.
2. [x] Tambah konstanta `MASTERY` di `utils/constants.js`.
3. [x] Buat `utils/kurikulumEngine.js` (§5.1) — termasuk `apakahModeDikunci()`. *(`hitungUrutanTopologis()` sempat ada, lalu dihapus 2026-07-26 — §12.)*
4. [x] `tests/utils/kurikulumEngine.test.js` — **32 test hijau**.
5. [x] Perbarui `views/pilihMateriView.js` (state terkunci, lencana master, toast, escaping) + `tests/views/pilihMateriView.test.js` — **10 test hijau**.
6. [x] Perbarui `pages/pilihMateri.js` (riwayat, hitung kunci, `segarkanStatusKunci()` reaktif mode, blokir klik, fail-safe).
7. [x] Tambah CSS `.materi-card.locked`, `.materi-info-kunci`, `.toast-kunci` di `pilih-materi.html`.
8. [ ] Tambah panel diagnostik kurikulum di `admin.html` (keputusan #5). *Prioritas turun: Gate A menemukan nol masalah, jadi panel ini bersifat pencegahan untuk materi yang ditambahkan nanti.*
9. [x] Uji manual dengan **akun siswa sungguhan** — lolos 7/7, memunculkan keputusan #8. Lihat "Uji manual" di bawah.
10. [x] Satukan definisi master: `gelarService` & `ketuntasanController` memakai `isHasilMasterSumatif()`. *Label "opsional" dicabut — ini bukan kerapian kode, ketiganya terbukti berselisih di data live (§13).*
11. [x] ~~**Opsi A Gate B**: turunkan peta dari `konsep_prasyarat`~~ → **dibatalkan**, diganti tabel manual. Lihat §12.
12. [x] Visualisasi peta materi (§11) — `peta-materi.html` + `tataLetakPeta.js` + `petaMateriView.js`, **21 test hijau**, terverifikasi terhadap Firestore live.

### Verifikasi yang sudah dilakukan (2026-07-25)

- **Unit test:** 66 test hijau, 6 suite, tanpa regresi pada 4 suite lama.
- **Sanity check mesin vs peta sungguhan:** `hitungStatusKunci(PETA_PRASYARAT_MANUAL, ∅)` menghasilkan **tepat 2** materi terbuka (`operasi aritmatika dasar`, `rasio trigonometri dasar`) — **cocok persis dengan angka Gate B dari Firestore live**, dan pola (master + 2) terkonfirmasi. Tanpa siklus; kedalaman maksimum 29.
- **Uji integrasi di browser** (server statis lokal, modul & CSS sungguhan):
  - Mode **Formatif** → 0 kartu terkunci, `cursor: pointer`, info prasyarat tersembunyi. ✅
  - Mode **Sumatif Normal** → kartu berprasyarat-belum-tuntas terkunci, `cursor: not-allowed`, banner prasyarat tampil. ✅
  - Perpindahan mode lewat event `change` sungguhan → kunci menyala/mati secara reaktif. ✅
  - Klik kartu terkunci → navigasi **tercegah**, toast muncul dengan daftar prasyarat. ✅
  - Lencana ✅ tampil pada materi yang sudah master.

### Uji manual dengan akun siswa sungguhan (2026-07-25)

Akun **NIS 1 "Siswa Albago"**, 128 rekam riwayat, 22 sub-materi master. Dijalankan lewat server statis lokal terhadap Firestore live; siswa login sendiri, tanpa kredensial dipegang asisten. Tidak ada soal yang dikerjakan agar riwayat tidak bertambah.

| Cek | Hasil |
|---|---|
| Formatif | 0/55 terkunci walau 32 kartu ber-`data-terkunci` ✅ |
| Sumatif Normal & Acak | terkunci, `cursor: not-allowed`, info prasyarat tampil ✅ |
| Ganti mode bolak-balik | reaktif tanpa reload ✅ |
| Klik kartu terkunci | toast muncul, navigasi tercegah ✅ |
| Klik kartu terbuka | masuk `latihan.html`, 10 soal, 0 error konsol ✅ |
| Lencana master | tak ada yang salah pasang ✅ |
| **Silang-periksa engine vs DOM** | himpunan terkunci **identik**, 0 selisih dua arah ✅ |

Silang-periksa terakhir adalah buktinya: `hitungStatusKunci` atas riwayat Firestore live menghasilkan daftar yang persis sama dengan yang dirender — mesinnya benar terhadap data asli, bukan hanya lolos Jest. Nol siklus terdeteksi.

**Temuan → keputusan #8.** Sebelum perbaikan: 32 terkunci, **7 di antaranya sudah master** (Sifat Sudut Berseberangan, Sifat Bangun Datar, Lingkaran Luar Segitiga, Sistem Persamaan Linear, Sudut Berelasi Vertikal, Identitas Trigonometri Dasar, Persamaan Trigonometri Dasar). Sesudah perbaikan: **25 terkunci, 0 master-tapi-terkunci**, dan silang-periksa engine↔DOM tetap 25 = 25 tanpa selisih.

**Temuan sampingan — nama sub-materi lawas di riwayat.** Riwayat memuat `sifat sudut (berseberangan & berpelurus)` yang sudah tidak punya kartu karena kurikulum sekarang memecahnya jadi dua. Akibatnya penguasaan lama siswa hangus: master versi gabungan, tapi `Sifat Sudut (Berpelurus)` versi baru tercatat belum. Bukan cacat mesin — ini persis kasus yang butuh **tabel alias (§10.2)**, dan menambah alasan mengerjakan opsi A.

---

## 8. Gate Pra-Rilis (WAJIB — konsekuensi keputusan #4 + #5)

Dijalankan **sebelum** fitur diaktifkan untuk siswa. Berupa skrip diagnostik sekali-jalan (read-only, boleh di `plan/` atau scratchpad, **tidak** di-deploy):

Skrip tersimpan di [`plan/diagnostik/`](plan/diagnostik) (tidak ikut ter-deploy — `firebase.json` hanya menyajikan `public/`).

**Yang masih ada:** hanya [`gate-a-audit-kurikulum.mjs`](plan/diagnostik/gate-a-audit-kurikulum.mjs), karena pemeriksaannya berulang — setiap kali tabel prasyarat atau bank soal berubah. Dua skrip sekali-jalan (`gate-a-dampak-per-tab.mjs`, `gate-b-simulasi-dampak.js`) **dihapus 2026-07-26**; hasilnya sudah tercatat lengkap di bawah, dan menyimpan skripnya hanya mengundang orang menjalankan ulang analisis yang sudah usang terhadap peta yang sudah diganti (§12).

### ✅ HASIL GATE A — LOLOS (dijalankan 2026-07-25)

Sumber: dump `arsip-data/` + `artefak/` — 22 berkas, 993 baris → **645 soal unik**, 62 sub-materi.
Perintah: `node plan/diagnostik/gate-a-audit-kurikulum.mjs`

| Pemeriksaan | Hasil |
|---|---|
| Prasyarat dengan `jumlah_soal < 10` | ✅ **KOSONG** — tidak ada deadlock permanen |
| Siklus di peta prasyarat | ✅ **KOSONG** — DAG valid, 55/55 node terurut |
| Akar rantai | `operasi aritmatika dasar` (10 soal), `rasio trigonometri dasar` (30 soal) — **keduanya bersoal cukup** |

**→ Keputusan §4.1 TIDAK diperlukan.** Ambang `SOAL_MIN = 10` dipertahankan apa adanya; opsi pelonggaran `min(SOAL_MIN, jumlah_soal)` tidak perlu diambil sekarang.

Verifikasi tambahan: engine ujian menargetkan **tepat 10 soal** (kuota 4-4-2 + fallback pengisi, [`soalEngine.js:93-105`](public/js/utils/soalEngine.js:93)), sehingga pool 10 soal tetap tersaji penuh. Ambang 10 terbukti tercapai — aturan ini memang sudah berjalan di produksi lewat `gelarService`.

### ⚠️ TEMUAN TAMBAHAN GATE A — cakupan fitur tidak merata antar tab

Sumber: `gate-a-dampak-per-tab.mjs` (skrip sudah dihapus, angka di bawah adalah catatan hasilnya)

| Tab | Sub-materi | Dipetakan | Efek fitur kunci |
|---|---|---|---|
| Prasyarat | 30 | 30 | ✅ berlaku penuh |
| Trigonometri | 26 | 25 | ✅ berlaku (1 lolos: `aturan sinus, cosinus, dan luas`, 10 soal) |
| **Eksponen** | 3 | **0** | ❌ **tidak berpengaruh sama sekali** |
| **Logaritma** | 3 | **0** | ❌ **tidak berpengaruh sama sekali** |

`PETA_PRASYARAT_MANUAL` **tidak memuat satu pun** sub-materi Eksponen/Logaritma, jadi dengan keputusan #6 (default terbuka) kedua tab itu sepenuhnya tanpa gerbang. Sub-materinya juga bersoal sangat sedikit (1–4 soal) sehingga **tak akan pernah bisa di-master** — aman sekarang karena bukan prasyarat, tapi **akan langsung menimbulkan deadlock** jika suatu saat dimasukkan ke peta tanpa menambah soal.

**Ini bukan penghambat rilis** (fitur tetap berfungsi di 55 dari 62 sub-materi), tapi perlu Anda ketahui: kunci materi tidak akan terasa di tab Eksponen & Logaritma. Menutup celah ini = pekerjaan kurikulum (menulis prasyarat + menambah soal), bukan pekerjaan kode.

### ⚠️ HASIL GATE B — DIJALANKAN 2026-07-25, PERLU KEPUTUSAN

Dijalankan di sesi admin terautentikasi (read-only). Data live: **50 siswa terdaftar, 49 punya riwayat, 584 record `hasil_latihan`, 55 sub-materi di `metadata/statistik_soal`**.

**Verifikasi Gate A dengan data live: ✅ dikonfirmasi** — `prasyarat dengan jumlah_soal < 10` = **kosong**. Semua 55 node peta ada di metadata dan bersoal cukup. Hasil dump arsip terbukti akurat.

| Metrik | Angka |
|---|---|
| Rata-rata materi **master** per siswa | **2,47** dari 55 |
| Rata-rata materi **terkunci** per siswa | **50,6** dari 55 |
| Siswa dengan 0 master | 7 |
| Siswa yang **semua** materi terkunci | 0 ✅ |
| Master tertinggi (akun uji `nis=1`) | 22 |
| Master tertinggi (siswa sungguhan) | 5 |
| Materi terkunci bagi **100%** siswa (49/49) | ≥ 10 sub-materi |

**Angka-angka ini bukan bug — ini konsekuensi matematis dari peta yang berbentuk RANTAI LINEAR MURNI.**

`PETA_PRASYARAT_MANUAL` tidak punya percabangan sama sekali: 55 node, setiap node **tepat 1** prasyarat dan **tepat 1** anak — dua rantai lurus terpisah (Prasyarat 30 node, Trigonometri 25 node). Pada rantai lurus, jumlah materi "siap dikerjakan" pada satu waktu **selalu tepat 1 per rantai**. Karena ada 2 rantai:

> **Setiap siswa selalu hanya melihat: (jumlah master) + 2 materi terbuka.** Tidak pernah lebih.

Terbukti di data: siswa 0-master → **2** terbuka (tepat 2 akar: `operasi aritmatika dasar`, `rasio trigonometri dasar`). Siswa 5-master → 7 terbuka.

**Risiko pedagogis:** rata-rata master hanya 2,47 dari 584 record — artinya siswa kesulitan mencapai ambang master. Digabung keputusan #2 (kunci seluruh kartu), siswa yang mentok di satu materi akan **terkunci total dari 53 materi lain** tanpa jalan alternatif. Corong ini sangat sempit dan tidak memberi pilihan.

**Verdikt Gate B: ⏸️ TERTAHAN** — bukan karena cacat teknis, tapi karena bentuk kurikulumnya. Lihat §10 untuk opsi mitigasi; keputusan ada di Anda (kriteria lolos §8.B = angka diterima secara sadar).

### Catatan status tab Eksponen & Logaritma
`metadata/statistik_soal` live hanya memuat **55** sub-materi — sub-materi Eksponen & Logaritma **belum ada** karena soalnya belum dimasukkan (dikonfirmasi pemilik proyek, akan menyusul). Jadi Temuan Tambahan Gate A soal "2 tab tanpa gerbang" **belum relevan sekarang** (tab-nya praktis kosong; `pilihMateri` melewati materi dengan `jumlah_soal = 0`). Yang perlu diingat: **saat soalnya nanti dimasukkan, perlu diputuskan apakah kedua tab itu ikut digerbangkan** — kalau ya, tabel prasyaratnya disusun manual dengan cara yang sama seperti §12; kalau tidak, keduanya tetap sepenuhnya terbuka.

### Skrip Gate B

**A. Audit integritas kurikulum** ← *paling kritis setelah revisi #3*
- Daftar semua sub-materi yang muncul sebagai **prasyarat** di `PETA_PRASYARAT_MANUAL` tetapi **`jumlah_soal < 10`** di `metadata/statistik_soal` (termasuk yang tidak ada sama sekali / `jumlah_soal = 0`). Lihat §4.1 — inilah sumber deadlock permanen.
- Perhatian khusus: `Operasi Aritmatika Dasar` dan `Rasio Trigonometri Dasar` hanya pernah muncul sebagai **nilai**, tidak pernah sebagai **key** — keduanya akar rantai. Jika salah satunya bersoal < 10, seluruh rantai di bawahnya terkunci permanen.
- Deteksi siklus.
- **Kriteria lolos:** daftar temuan **kosong**. Jika tidak kosong → putuskan §4.1 opsi (i) tambah soal, atau (ii) longgarkan ambang jadi `min(SOAL_MIN, jumlah_soal)` (rekomendasi).

**B. Simulasi dampak ke siswa lama**
- Untuk setiap siswa, hitung `setMaster` dengan definisi §3 dan hitung berapa sub-materi yang **berubah dari dapat diakses menjadi terkunci**.
- Laporkan: jumlah siswa terdampak, materi yang paling sering terkunci, dan siswa yang terkunci total.
- **Ekspektasi setelah revisi #3:** dampaknya jauh lebih ringan daripada rencana sebelumnya, karena definisi master sekarang identik dengan aturan gelar yang sudah berjalan — siswa yang sudah bergelar otomatis master. Gate ini tetap dijalankan untuk mengonfirmasi, bukan untuk berjaga-jaga saja.
- **Kriteria lolos:** angkanya Anda terima secara sadar. Jika terlalu besar, keputusan #4 (strict) dapat ditinjau ulang **dengan data di tangan**, bukan berdasarkan dugaan.

**Cara menjalankan Gate B** — skrip `gate-b-simulasi-dampak.js` **sudah dihapus 2026-07-26**; Gate B sudah dijalankan dan hasilnya tercatat di atas, dan peta yang disimulasikannya sudah diganti (§12), jadi menjalankan ulang skrip itu hanya menghasilkan angka yang menyesatkan.

Bila suatu saat perlu disimulasikan ulang (misalnya sesudah tab Eksponen/Logaritma digerbangkan), tulis ulang dari pola yang sama: baca `hasil_latihan` dengan sesi login (rules mewajibkan autentikasi), **hanya membaca** — tanpa `setDoc`/`updateDoc`/`deleteDoc` — lalu jalankan `hitungSetMaster()` + `hitungStatusKunci()` per siswa. Login dilakukan sendiri oleh pemilik proyek di panel Browser; skrip tidak pernah menerima sandi.

---

## 10. Akar Masalah Bersama: Peta Linear (mitigasi Gate B **dan** visualisasi pohon)

Dua hal yang tampak terpisah ternyata satu akar masalah:

1. **Gate B tertahan** karena rantai linear hanya memberi 2 pilihan pada satu waktu.
2. **Visualisasi "cabang pohon"** tidak mungkin dibuat dari data yang tidak bercabang — layout apa pun (LR, radial, force) akan merender rantai lurus sebagai **dua garis panjang**, bukan pohon. Tidak ada algoritma tata letak yang bisa menciptakan cabang yang tidak ada di datanya.

**Memperbaiki bentuk peta menyelesaikan keduanya sekaligus.**

### 10.1 Bahan yang sudah tersedia: field `konsep_prasyarat`

Dokumen `bank_soal` punya field `konsep_prasyarat` per-soal, dan isinya **sudah bercabang secara alami**. Diukur dari dump arsip (skrip Gate A + analisis graf):

| Properti | `PETA_PRASYARAT_MANUAL` (hard-code) | `konsep_prasyarat` (per-soal) |
|---|---|---|
| Node | 55 | 71 |
| Edge | 54 | 306 → **106 setelah transitive reduction** |
| Node bercabang (>1 anak) | **0** | **28** |
| Node konvergen (>1 prasyarat) | **0** | **33** |
| Bentuk | rantai lurus | **DAG bercabang** ✅ |
| Kedalaman (kolom layout) | 30 & 25 | **16** |

Hub terbesar: `operasi pecahan` (32 anak), `manipulasi aljabar dasar` (27), `operasi aritmatika dasar` (23), `persamaan linear satu variabel` (20).

**Transitive reduction wajib**: 306 edge mentah = rata-rata 5,7 prasyarat/materi — terlalu padat untuk divisualkan *dan* terlalu ketat untuk gerbang kunci. Setelah reduksi tinggal 106 edge (1,5/node) — itulah kerangka pohon yang bersih.

### 10.2 Dua masalah data yang harus dibereskan lebih dulu

1. **2 siklus** di `konsep_prasyarat`:
   - `identitas trigonometri dasar` → `rasio trigonometri dasar`
   - `persamaan trigonometri dasar` → `nilai sudut istimewa`
2. **Nama tidak ternormalisasi** — 17 "akar" muncul, sebagian jelas nama lain untuk konsep yang sama atau bukan sub-materi resmi: `perbandingan dasar trigonometri` (≈ `rasio trigonometri dasar`?), `teorema heron`, `pemodelan matematika`, `aplikasi kontekstual`, `manipulasi aljabar lanjutan`, `pemfaktoran aljabar`, `persamaan linear dasar`, `operasi aljabar pecahan`, `sifat pecahan trigonometri`. Perlu tabel pemetaan alias sebelum data ini bisa dipakai.

### 10.3 Opsi mitigasi Gate B (perlu keputusan)

| Opsi | Isi | Efek |
|---|---|---|
| **A. Perkaya peta** | Turunkan/lengkapi `PETA_PRASYARAT_MANUAL` dari `konsep_prasyarat` (setelah §10.2 dibereskan + transitive reduction) | Menyelesaikan Gate B **dan** membuka jalan visualisasi pohon. Pekerjaan kurikulum, paling berdampak. |
| **B. Lookahead** | Buka N materi ke depan meski prasyarat belum master (mis. N=2) | Cepat, murah, melonggarkan corong tanpa mengubah data. Melemahkan makna "kunci". |
| **C. Tinjau keputusan #2** | Formatif selalu terbuka, hanya ujian yang dikunci | Siswa selalu bisa **belajar**, hanya *dinilai*-nya yang bergerbang. Mengatasi risiko "mentok lalu terkunci total". |
| **D. Terima apa adanya** | Rilis strict sesuai keputusan #4 | Paling tegas; siswa fokus 1 materi per rantai. Risiko frustrasi tinggi. |

Opsi ini **tidak saling eksklusif** — B atau C bisa dipakai sebagai jembatan sementara sambil A dikerjakan.

### ✅ KEPUTUSAN GATE B (2026-07-25): **A + C** *(opsi A kemudian dibatalkan — §12)*

- **C dipakai sekarang** → merevisi keputusan #2: **formatif selalu terbuka, hanya ujian yang dikunci.** Siswa tak akan pernah terkunci dari belajar; gerbang hanya berlaku saat hendak *dinilai*. Ini yang membuat Gate B lolos: siswa yang mentok tetap punya 55 materi untuk dipelajari.
- **A dikerjakan menyusul** → memperkaya peta prasyarat (§10.1–10.2) sebagai pekerjaan kurikulum terpisah, yang nanti sekaligus membuka jalan visualisasi pohon (§11).
- **Urutan kerja:** fitur kunci (logika) lebih dulu, lalu A, lalu visualisasi.

> **Dibatalkan 2026-07-26.** Opsi A dikerjakan sampai tuntas (peta 75 sisi, 17 node bercabang), lalu **dibuang** setelah terbukti melawan urutan mengajar. Tujuannya — peta bercabang — tetap tercapai lewat tabel manual: 45 sisi, kedalaman 6, lapisan pembukaan `[2,3,6,7,6,1]`. Rinciannya di §12.

**Implikasi teknis penting dari C:** status terkunci sebuah kartu sekarang **bergantung pada mode yang sedang dipilih** di radio `mode_latihan`. Kartu harus **memperbarui tampilan kuncinya saat mode diganti** — bukan hanya sekali saat render. Lihat §5.4.

---

## 11. Visualisasi Peta Materi — ✅ TERIMPLEMENTASI (2026-07-26)

Halaman [`peta-materi.html`](public/peta-materi.html), ditautkan dari tombol "🗺️ Peta Materi" di `pilih-materi.html`. Tampilan daftar **tetap ada** dan tetap jadi jalur utama mengerjakan soal; peta ini menjelaskan, bukan menggantikan.

**Prasyarat mutlak — data prasyarat harus bercabang — terpenuhi sejak §12** (18 materi berprasyarat ganda, kedalaman 6).

### 11.1 Bentuk yang dipilih: layered kiri→kanan

Peta metro sempat direkomendasikan sebagai langkah awal, **tapi dilewati**: saran itu ditulis untuk rantai linear 53 sisi, di mana "jalur" adalah satu-satunya struktur yang ada. Tabel manual sudah bercabang, jadi bentuk berlapis bisa langsung dipakai tanpa tahap antara.

| Bentuk | Putusan |
|---|---|
| **Layered kiri→kanan** | ✅ **Dipakai.** 7 kolom, kolom terlebar 9 simpul, 34 simpul, 45 sisi. Arah kiri→kanan langsung terbaca "maju". |
| Peta metro / jalur | ⏭️ Dilewati — dirancang untuk data linear yang sudah tidak berlaku. |
| Radial | ❌ Label panjang (`Sudut Berelasi (Negatif dan >360°)`) bertumpuk saat diputar, dan akarnya ada 9, bukan 1. |
| Force-directed | ❌ Tidak menunjukkan arah progresi. |

### 11.2 Cara kolom dihitung

Kolom = **lapisan pembukaan**: kolom ke-N berisi materi yang terbuka setelah seluruh isi kolom 0..N-1 dikuasai. Dihitung di [`utils/tataLetakPeta.js`](public/js/utils/tataLetakPeta.js) dengan menjalankan `hitungStatusKunci()` berulang — mesin yang sama dengan yang mengunci kartu, jadi peta mustahil berbohong tentang gerbangnya. **Kahn tidak dihidupkan kembali**, termasuk untuk tata letak (§12).

Hasil pada tabel produksi: `[9, 2, 3, 6, 7, 6, 1]`. Kolom 0 berisi 9 materi tab Prasyarat yang jadi pintu masuk.

> **Menyimpang dari rencana awal:** lapisan dihitung **tanpa** status master siswa, sehingga bentuk peta sama untuk semua orang. Rencana semula menghitungnya per-siswa ("kapan ini terbuka bagimu"), tapi itu membuat peta menyusun ulang dirinya setiap kali satu materi tuntas — sebuah peta yang berubah bentuk berhenti berfungsi sebagai peta. Keadaan siswa dipakai untuk **mewarnai** simpul, bukan memindahkannya; simpul "siap" sudah menjadi garis depan yang dicari.

Urutan baris dalam satu kolom memakai **barycenter** (rerata baris prasyaratnya), dengan urutan mengajar sebagai pemecah seri agar hasilnya stabil dan tidak bergantung urutan penulisan tabel.

### 11.3 Implementasi

| Lapisan | Berkas | Isi |
|---|---|---|
| Utils | `utils/tataLetakPeta.js` | lapisan, koordinat grid, status simpul, pemenggalan label — murni, 21 test |
| Utils | `utils/teksAman.js` | `amankanTeks()` yang tadinya terkubur di `pilihMateriView.js` |
| View | `views/petaMateriView.js` | SVG murni tanpa dependensi; geometri piksel hanya di sini |
| Controller | `pages/petaMateri.js` | muat riwayat → status → render → interaksi |

- **Status simpul** = 3 keadaan: ✅ master (hijau terisi) / ▶ siap (garis tebal) / 🔒 terkunci (redup).
- **Gagal muat riwayat dilaporkan**, tidak diam-diam fail-safe seperti halaman daftar. Di sana fail-safe berarti "tidak ada yang terkunci" — aman. Di sini artinya "semua materi tampak siap", yang menyesatkan.
- **Mobile** — peta digulung di dalam wadahnya sendiri (bukan `scrollIntoView`, yang ikut menggeser halaman), plus tombol **🎯 Materi siapku** dan **🔍 Lihat utuh**. Pinch-zoom SVG sengaja dihindari mengingat riwayat bug Safari proyek ini; menggulung wadah + satu tombol ikhtisar mencapai tujuan yang sama dengan risiko jauh lebih kecil.
- **Aksesibilitas** — tiap simpul `tabindex`/`role="button"` dengan `aria-label` berisi status dan prasyarat yang belum tuntas, serta `<title>` untuk tooltip.
- **Penamaan** — kolom disebut **"Lapis"**, bukan "Tahap". "Tahap" sudah dipakai `PETA_TAHAPAN` untuk tahap mengajar di kelas, dan keduanya **tidak** sama; memakai kata yang sama akan menyesatkan guru maupun siswa.

### 11.4 Verifikasi (2026-07-26, Firestore live, akun NIS 1)

| Pemeriksaan | Hasil |
|---|---|
| Simpul & sisi terender | 34 simpul, 45 sisi — sama persis dengan tabel |
| Status DOM vs mesin | ✅ identik untuk 34 simpul (15 master, 9 siap, 10 terkunci) |
| 10 terkunci di peta vs 10 terkunci di daftar materi | ✅ cocok |
| Prasyarat selalu di kolom kiri materinya | ✅ 0 pelanggaran (dijaga test) |
| Materi yatim | ✅ kosong |
| Galat console | ✅ tidak ada |
| Ponsel 375px | ✅ tanpa overflow mendatar pada halaman |

---

## 12. PERUBAHAN ARAH (2026-07-26): Algoritma Diganti Tabel Manual

Keputusan pemilik proyek: **urutan materi disusun manual oleh guru; sistem hanya menegakkannya.** Algoritma Kahn dibongkar, peta turunan dibuang.

### 12.1 Mengapa penurunan otomatis gagal

Opsi A (§10.3) dikerjakan sampai tuntas lebih dulu: alias dinormalisasi, 2 siklus dihilangkan, ambang bobot 25% dipasang, transitive reduction diterapkan. Hasilnya secara angka bagus — 75 sisi, 17 node bercabang, kedalaman 11. Tapi dua temuan membatalkannya:

1. **Urutan mengajar terbalik di 30 dari 53 pasangan.** `Persamaan Trigonometri Bentuk Khusus` bisa terbuka sebelum `Lanjutan`; `Periode` sebelum `Amplitudo`. Sebabnya mendasar: `konsep_prasyarat` mencatat apa yang dibutuhkan untuk **mengerjakan** sebuah soal, bukan apa yang harus **dipelajari lebih dulu**. Soal "Bentuk Khusus" memang tidak membutuhkan materi "Lanjutan".
2. **Prasyarat konseptual tidak tercatat.** `Aturan Kuadran` menyebut `Rasio Trigonometri Dasar` hanya di 2 dari 20 soal (10%), jadi tersaring ambang — padahal mustahil mengajarkan kuadran tanpa rasio.

Keduanya harus ditambal dengan aturan koreksi buatan. **Kalau algoritmanya butuh dua tambalan agar tidak melawan urutan guru, maka urutan guru yang benar dan algoritmanya yang mengganggu.**

Analisis per-soal itu **tidak sia-sia**: angka persentasenya dipakai sebagai bahan pertimbangan saat menyusun tabel manual, dan tersimpan sebagai komentar `// 63%` di sebelah tiap prasyarat. Perannya berubah dari penentu menjadi penasihat.

### 12.2 Bentuk sesudahnya

| | Rantai lama | Peta turunan (dibuang) | **Tabel manual** |
|---|---|---|---|
| Sisi | 53 | 75 | **45** |
| Materi berprasyarat ganda | 0 | 17 | **18** |
| Kedalaman | 29 | 11 | **6** |
| Lingkup kunci | 2 tab | 2 tab | **hanya Trigonometri** |

Lapisan pembukaan tab Trigonometri: `[2, 3, 6, 7, 6, 1]` — 25 materi tuntas dalam 6 lapis.

**Konsekuensi yang disengaja** (disetujui pemilik proyek): `Rasio Trigonometri Dasar` digerbangkan oleh `Teorema Pythagoras`, sehingga siswa yang belum menyentuh tab Prasyarat melihat **0 materi terbuka** di tab Trigonometri. Tab Prasyarat menjadi jalur wajib, bukan opsional.

### 12.3 Penjaga tabel manual

Tabel tulisan tangan salah secara **senyap**: materi yang tak pernah terbuka tidak melempar error, ia hanya hilang dari jangkauan siswa. Empat pemeriksaan menggantikan jaminan yang dulu diberikan algoritma:

| Pemeriksaan | Menangkap | Di mana |
|---|---|---|
| `namaTakDikenal` | salah ketik (`Teorema Pytagoras`) | test + `validasiKurikulum` |
| `urutanMundur` | prasyarat ditulis sesudah materinya — **pengganti deteksi siklus** | test + `validasiKurikulum` |
| kunci di dalam blok Trigonometri | materi tab Prasyarat ikut terkunci | test |
| tidak ada materi yatim | materi yang mustahil dibuka walau semua prasyarat tuntas | test |
| prasyarat ber-soal < 10 | deadlock permanen (§4.1) | `gate-a-audit-kurikulum.mjs` |

Empat yang pertama jalan di Jest tiap kali tabel disunting. Yang kelima butuh data bank soal, jadi tetap di skrip Gate A.

### 12.4 Yang dibuang dari kode

| Dihapus | Penggantinya | Δ baris |
|---|---|---|
| `bangunGraphKurikulum()` + BFS di `pilihMateri.js` | `Object.keys(PETA_TAHAPAN)` | −40 |
| `hitungUrutanTopologis()` di `kurikulumEngine.js` | cek indeks di `validasiKurikulum` | −38 |
| fail-safe siklus di `hitungStatusKunci` | mustahil terbentuk pada daftar berurut | — |

`PETA_PRASYARAT_MANUAL` → `PRASYARAT_TRIGONOMETRI`. `latihanSpesialController` ikut disesuaikan: pengurutan sampel soal beralih ke `PETA_TAHAPAN`, karena tabel prasyarat kini hanya memuat satu tab.

### 12.5 Verifikasi (2026-07-26)

- **69 test hijau**, 6 suite — termasuk 5 test integritas tabel produksi (§12.3).
- **Gate A dijalankan ulang: lolos** — nol prasyarat bersoal < 10.
- **Uji live** dengan akun NIS 1 terhadap Firestore, siswa login sendiri, tanpa mengerjakan soal:

| Cek | Hasil |
|---|---|
| Tab Prasyarat | 30 kartu, **0 terkunci** ✅ |
| Tab Trigonometri | 25 kartu, 12 terkunci ✅ |
| Silang-periksa engine ↔ DOM | **identik**, 0 selisih ✅ |
| Separator Tahap 1→6 | urut rapi (dulu bisa teracak topological sort) ✅ |
| Mode Sumatif → klik kartu terkunci | navigasi tercegah, toast menyebut prasyaratnya ✅ |
| Mode Formatif | 0 terkunci ✅ |
| Error konsol | nihil ✅ |

### 12.6 Catatan yang tidak diambil

**Tabel alias nama lawas tidak dibangun.** Riwayat masih memuat `Sifat Sudut (Berseberangan & Berpelurus)` — nama gabungan yang kini dipecah dua. Pengecekan atas data live: **tepat 1 record**, dan materinya bukan prasyarat siapa pun, jadi dampaknya ke penguncian **nol**. Kalau suatu saat Sifat Sudut menjadi prasyarat, ini perlu ditinjau ulang.

**Latihan spesial tidak pernah memberi status master.** Modenya di luar `MODE_UJIAN`, jadi berapa pun nilainya tidak membuka kunci apa pun. Sesuai desain sekarang, dicatat agar tidak jadi kejutan.

---

## 9. Catatan untuk Ditinjau Nanti (di luar cakupan)

**Field `konsep_prasyarat` per-soal.** Dokumen di `bank_soal` punya field `konsep_prasyarat` (mis. soal Aturan Kuadran mencantumkan `["Pengenalan Sudut Dasar", "Operasi Aritmatika Dasar"]`) — yaitu sumber prasyarat **berbasis data** yang hidup berdampingan dengan peta hard-code. Keduanya berpotensi tidak sinkron. Rencana ini sengaja **hanya** memakai peta hard-code sesuai permintaan Anda; menyatukan keduanya (atau menurunkan peta dari data) adalah kandidat perbaikan terpisah.

> **Sudah dicoba dan ditutup 2026-07-26 (§12).** Menurunkan peta dari data terbukti melawan urutan mengajar. Field ini tetap berharga sebagai **penasihat** — persentase pemakaiannya tercatat sebagai komentar di `PRASYARAT_TRIGONOMETRI` — tapi tidak boleh jadi sumber kebenaran urutan.

**Eksponen & Logaritma belum punya gerbang.** Kedua tab itu tidak ada di `PRASYARAT_TRIGONOMETRI` (keputusan #10), dan soalnya juga belum masuk Firestore. Saat soalnya nanti dimasukkan, perlu diputuskan apakah kedua tab itu ikut digerbangkan — kalau ya, tabel prasyaratnya disusun manual dengan cara yang sama.

---

## 13. SATU DEFINISI "MASTER" (2026-07-26)

Aturan "sumatif lulus" ternyata ditulis di **tiga** tempat, dan ketiganya tidak sama:

| Tempat | Mode ujian | Nilai ≥80 | Status ≠ draf | **Soal ≥10** |
|---|---|---|---|---|
| `kurikulumEngine` (gerbang prasyarat) | termasuk mode lama | ✅ | ✅ | ✅ |
| `gelarService` | **hanya** `tes_normal`/`tes_acak` | ✅ | ❌ **tidak dicek** | ✅ |
| `ketuntasanController` (panel Ketuntasan) | termasuk mode lama | ✅ | ✅ | ❌ **tidak dicek** |

### 13.1 Akibatnya di data sungguhan

Diukur atas seluruh `hasil_latihan` (585 rekaman, agregat tanpa identitas):

| | Jumlah |
|---|---|
| "Lulus" versi panel Ketuntasan (aturan lama) | 149 |
| "Master" versi gerbang & gelar | 140 |
| **Rekaman berselisih** | **9, menyangkut 6 siswa** |

Sebaran jumlah soal pada 9 rekaman itu: lima ujian **1 soal**, dua ujian 2 soal, dua ujian 9 soal — semuanya bernilai ≥80.

Sebarannya per sub-materi: `Rasio Trigonometri Dasar` (6), `Aturan Kuadran` (1), `Identitas Trigonometri Dasar` (1), `Sudut Berelasi (Horizontal)` (1).

Enam dari sembilan menumpuk di **`Rasio Trigonometri Dasar`** — pintu masuk seluruh tab Trigonometri. Artinya siswa-siswa itu melihat ✅ "Lulus" di panel guru sementara **seluruh tab Trigonometri** tetap terkunci bagi mereka, dan gelarnya tidak pernah terbit. Tiga sumber kebenaran, tiga jawaban berbeda, di layar yang dilihat orang berbeda.

### 13.2 Perbaikan

`isHasilMasterSumatif(hasil, ambang)` di `kurikulumEngine.js` menjadi **satu-satunya** tempat aturan ini ditulis. `isSubMateriMaster()` kini hanya `.some()` di atasnya, dan kedua pemanggil lain ikut memakainya.

Efek samping yang disengaja, keduanya menyelaraskan ke definisi §3:
- **Gelar jadi lebih ketat** — draf tidak lagi bisa menerbitkan gelar.
- **Gelar jadi lebih longgar untuk data lama** — mode `normal`/`acak` warisan kini diakui.

Ambang `80` yang sebelumnya ditulis literal di `gelarService` diganti `MASTERY.NILAI_MIN`.

### 13.3 Catatan pengukuran

Pengukuran pertama sempat melaporkan "2 rekaman, 2 siswa". Itu **salah**: kueri pembandingnya lupa menyertakan fallback `d.mode_latihan || MODE_LATIHAN.NORMAL` yang dipakai kode panel, sehingga rekaman lama tanpa `mode_latihan` tidak ikut terhitung. Angka yang benar — hasil replikasi persis kode panel lama — adalah **9 rekaman, 6 siswa**.
