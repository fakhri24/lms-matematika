# RENCANA FITUR: "Kunci Materi" (Prerequisite Gating)

> **Tujuan:** Sebuah sub-materi bisa dibuka **hanya jika** semua materi prasyaratnya sudah berstatus **`master`**. Fitur ini menggabungkan **Algoritma Kahn (topological sort)** yang sudah ada dengan **peta prasyarat hard-code** (`PETA_PRASYARAT_MANUAL`).

**Status:** keputusan desain sudah final (§2). Siap implementasi setelah **Gate Pra-Rilis** (§8) lolos.

---

## 1. Kondisi Saat Ini (Temuan)

| Komponen | Berkas | Kondisi sekarang |
|---|---|---|
| Peta prasyarat (hard-code) | `public/js/utils/kurikulumData.js` → `PETA_PRASYARAT_MANUAL` | Rantai linear `target → [prasyarat]`. Sudah ada. |
| Graf + Algoritma Kahn | `public/js/pages/pilihMateri.js` → `bangunGraphKurikulum()` + BFS `inDegree` | Sudah memakai Kahn, tapi **hanya untuk mengurutkan** kartu, bukan mengunci. Prasyarat difilter per-tab (`materiSahDiTabIni`) — filter ini **akan dilepas** untuk evaluasi kunci. |
| Render kartu | `public/js/views/pilihMateriView.js` → `createMateriCardHTML()` | Kartu selalu bisa diklik; belum ada state terkunci. |
| Klik → navigasi | `pilihMateri.js` listener `wadah-konten-tab` | Selalu mengarahkan ke `latihan.html`/halaman formatif. |
| Definisi "master" | `services/gelarService.js` (`nilai>=80` & `>=10 soal`) dan `admin/ketuntasanController.js` (`sumatif_lulus`) | Logika **terduplikasi** di dua tempat, belum ada helper murni bersama. Definisi final (§3) **identik** dengan aturan `gelarService`. |
| Sumber data hasil | koleksi `hasil_latihan` (sumatif **dan** draf formatif), `progres_belajar` (log per-soal) | `getRiwayatLatihanSiswa(nis)` sudah tersedia di `latihanService.js`. |
| Identitas siswa | `localStorage.nis_siswa` | Tersedia di sisi klien. |

**Kesimpulan:** infrastruktur graf + Kahn sudah ada. Yang belum ada: (a) definisi "master" tunggal & murni, (b) lapisan penilaian status kunci, (c) tampilan & pemblokiran klik kartu terkunci, (d) diagnostik kurikulum untuk admin.

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

### Dasar keputusan #8
Gerbang ini memakai prasyarat untuk **menduga** kesiapan siswa. Nilai sumatif ≥80 atas materi itu sendiri adalah **bukti langsung** kesiapan, dan bukti langsung mengalahkan dugaan. Tanpa aturan ini, siswa yang menguasai materi lewat urutan lain — atau di bawah kurikulum lama — justru terhalang mengulang materinya sendiri untuk memperbaiki nilai. Aturan ini juga mengalahkan fail-safe siklus (§4), karena penyebab terkuncinya di situ adalah peta yang rusak, bukan siswa yang belum siap.

Uji manual menemukan **7 kasus nyata** pada satu akun saja, jadi ini bukan kasus tepi.

### Catatan penting atas kombinasi #4 + #5
Kombinasi **strict** + **prasyarat bermasalah tetap memblokir** berpotensi mengunci banyak siswa sekaligus di hari rilis. Karena semua rantai di `PETA_PRASYARAT_MANUAL` bersifat **linear**, satu simpul bermasalah dapat mengunci seluruh rantai sesudahnya. Karena itu **§8 Gate Pra-Rilis wajib dijalankan dan dinyatakan lolos sebelum fitur diaktifkan** — bukan langkah opsional.

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

**Konsekuensi positif — definisi ini kini identik dengan aturan gelar** di [`gelarService.js:59-63`](public/js/services/gelarService.js:59). Artinya: siswa yang sudah punya gelar untuk suatu sub-materi otomatis sudah master, sehingga **dampak rollout strict jauh lebih ringan** daripada rencana sebelumnya, dan refactor DRY (§7 langkah 10) menjadi lurus.

> Meski begitu, `gelar_terbuka` **tidak boleh** dipakai sebagai sumber status master: nama gelar dipotong 25 karakter ([`gelarService.js:70-73`](public/js/services/gelarService.js:70)) sehingga lossy dan ambigu antar sub-materi berawalan sama. Status master tetap dihitung dari `hasil_latihan`.

**Efisiensi kueri:** dihitung dari **satu** kueri `getRiwayatLatihanSiswa(nis)`. **Tidak ada penambahan biaya baca Firestore selain itu.**

**Tidak ada deadlock:** kartu materi X terkunci oleh status master **prasyarat X**, bukan oleh status X sendiri. Begitu prasyarat terbuka, siswa langsung bisa mengerjakan X.

---

## 4. Bagaimana Kahn + Hard-code Digabung untuk Mengunci

Algoritma Kahn tidak lagi hanya mengurutkan, tapi menjadi **gerbang unlock bertahap**:

```
INPUT : daftar sub-materi, PETA_PRASYARAT_MANUAL (penuh, tanpa filter tab),
        setMaster (sub-materi yang sudah master), katalogMateri (yang punya soal > 0)
PROSES:
  1. Bangun graf berarah prasyarat→target + inDegree
  2. Kahn BFS untuk urutan topologis
  3. Untuk tiap node, tandai:
       prereqBelum = prasyarat langsung yang ∉ setMaster
       locked      = prereqBelum.length > 0
OUTPUT: { subMateri → { locked, prereqBelum } }
```

Sifat penting:
- **Transitivitas otomatis** — cukup cek prasyarat **langsung**. Jika prasyarat terkunci maka ia belum master, sehingga node sesudahnya ikut terkunci.
- **Node tanpa prasyarat** → `locked = false` (keputusan #6).
- **Lintas-tab** (keputusan #1) — evaluasi kunci memakai peta **penuh**. Pengurutan kartu tetap boleh per-tab agar tampilan tidak berubah; hanya penguncian yang global.
- **Prasyarat yang tak mungkin di-master** (keputusan #5) — tetap masuk `prereqBelum` (memblokir), **dan** dicatat ke daftar diagnostik untuk admin (§5.5). Lihat peringatan §4.1 — kriterianya **bukan** hanya "tanpa soal".
- **Deteksi siklus** — node yang tak pernah keluar dari antrian Kahn (`inDegree > 0` tersisa) menandakan siklus di peta hard-code → diperlakukan **terkunci** (fail-safe) + masuk diagnostik admin.

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
- `hitungStatusKunci(daftarSubMateri, petaPrasyarat, setMaster)` → `{ [subLower]: { locked, prereqBelum } }` — Kahn + gerbang unlock (§4).
- `validasiKurikulum(petaPrasyarat, metaDataMap, ambang)` → `{ prasyaratTakMungkinMaster[], siklus[] }` — untuk diagnostik admin (keputusan #5). Menandai prasyarat dengan `jumlah_soal < ambang.SOAL_MIN`, **termasuk** yang tidak ada di katalog (§4.1).

Semua murni: tanpa DOM, tanpa Firestore.

### 5.2 Konstanta — `public/js/utils/constants.js`
Tambah `MASTERY = { NILAI_MIN: 80, SOAL_MIN: 10 }`.

### 5.3 Service — **reuse, tanpa kueri baru**
Pakai `getRiwayatLatihanSiswa(nis)` yang sudah ada. *(Refactor opsional §7: arahkan `gelarService` & `ketuntasanController` memakai helper baru agar DRY.)*

### 5.4 Controller — `public/js/pages/pilihMateri.js`
- Di `muatMateri()`: ambil `nis` dari localStorage → `getRiwayatLatihanSiswa(nis)` → `hitungSetMaster(riwayat)`.
- Hitung `hitungStatusKunci()` **sekali** dengan peta penuh (bukan per-tab), lalu pakai hasilnya saat merender tiap tab.
- Teruskan `{ locked, prereqBelum }` ke `createMateriCardHTML`.
- **Reaktif terhadap mode (revisi #2):** kunci hanya aktif untuk mode ujian. Simpan `prereqBelum` di `data-prereq-belum` pada kartu, lalu fungsi `segarkanStatusKunci(mode)` menyalakan/mematikan kelas `.locked` — dipanggil saat render **dan** dari `ubahTampilanMode()` setiap kali radio mode berubah.
- Listener klik: jika kartu terkunci **dan** mode aktif adalah mode ujian → **cegah navigasi**, tampilkan toast berisi `prereqBelum` (keputusan #7).
- **Fail-safe:** jika kueri riwayat gagal, jangan mengunci semuanya — log error dan render tanpa kunci (agar kegagalan jaringan tidak memblokir seluruh siswa).

### 5.5 View
- `pilihMateriView.js` → `createMateriCardHTML(...)` menerima `{ locked, prereqBelum }`:
  - Terkunci → kelas `locked`, ikon 🔒, teks "Selesaikan dulu: <daftar>", `data-locked="true"`.
  - Terbuka → tampilan sekarang (opsional badge ✅ bila sudah master).
- **BARU** helper toast (mis. `createToastHTML` + fungsi tampil) — cek dulu apakah sudah ada pola toast/notifikasi di proyek agar tidak duplikat.
- **Diagnostik admin** (keputusan #5): tampilkan daftar `prasyaratTakMungkinMaster` + `siklus` dari `validasiKurikulum()` di `admin.html`. Penempatan pasti ditentukan saat implementasi (kandidat: dekat panel Ketuntasan).

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
   - Rantai `A → B → C`, `setMaster = {}` → hanya `A` terbuka.
   - `setMaster = {A}` → `B` terbuka, `C` terkunci.
   - Node tanpa prasyarat selalu terbuka (keputusan #6).
   - Prasyarat lintas-tab tetap dievaluasi (keputusan #1).
   - Prasyarat yang belum master → memblokir (keputusan #5).
   - Siklus → node terlibat terkunci, tidak crash.
   - `prereqBelum` memuat nama prasyarat yang tepat (untuk toast).
4. `validasiKurikulum` — mendeteksi prasyarat dengan `jumlah_soal < SOAL_MIN`, prasyarat di luar katalog, dan siklus (§4.1).
5. **Data legacy defensif** — record tanpa `nilai`, tanpa `mode_latihan`, atau tanpa `detail_jawaban` tidak menyebabkan exception.

Semua wajib hijau sebelum commit (aturan global [AGENTS.md](AGENTS.md)).

---

## 7. Urutan Implementasi

1. [x] **Gate Pra-Rilis (§8)** — Gate A lolos, Gate B menghasilkan keputusan A+C.
2. [x] Tambah konstanta `MASTERY` di `utils/constants.js`.
3. [x] Buat `utils/kurikulumEngine.js` (§5.1) — termasuk `apakahModeDikunci()` & `hitungUrutanTopologis()` (kedalaman untuk tata letak §11).
4. [x] `tests/utils/kurikulumEngine.test.js` — **32 test hijau**.
5. [x] Perbarui `views/pilihMateriView.js` (state terkunci, lencana master, toast, escaping) + `tests/views/pilihMateriView.test.js` — **10 test hijau**.
6. [x] Perbarui `pages/pilihMateri.js` (riwayat, hitung kunci, `segarkanStatusKunci()` reaktif mode, blokir klik, fail-safe).
7. [x] Tambah CSS `.materi-card.locked`, `.materi-info-kunci`, `.toast-kunci` di `pilih-materi.html`.
8. [ ] Tambah panel diagnostik kurikulum di `admin.html` (keputusan #5). *Prioritas turun: Gate A menemukan nol masalah, jadi panel ini bersifat pencegahan untuk materi yang ditambahkan nanti.*
9. [x] Uji manual dengan **akun siswa sungguhan** — lolos 7/7, memunculkan keputusan #8. Lihat "Uji manual" di bawah.
10. [ ] (Opsional) Refactor `gelarService` & `ketuntasanController` memakai helper baru (DRY).
11. [ ] **Opsi A Gate B**: perkaya peta prasyarat (§10.1–10.2) — pekerjaan kurikulum.
12. [ ] Visualisasi peta materi (§11) — sesudah langkah 11.

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

Perintah: `node plan/diagnostik/gate-a-dampak-per-tab.mjs`

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
`metadata/statistik_soal` live hanya memuat **55** sub-materi — sub-materi Eksponen & Logaritma **belum ada** karena soalnya belum dimasukkan (dikonfirmasi pemilik proyek, akan menyusul). Jadi Temuan Tambahan Gate A soal "2 tab tanpa gerbang" **belum relevan sekarang** (tab-nya praktis kosong; `pilihMateri` melewati materi dengan `jumlah_soal = 0`). Yang perlu diingat: **saat soalnya nanti dimasukkan, materi Eksponen/Logaritma wajib sekalian dipetakan ke `PETA_PRASYARAT_MANUAL`**, kalau tidak kedua tab itu akan sepenuhnya tanpa kunci.

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

**Cara menjalankan Gate B** — skrip: [`plan/diagnostik/gate-b-simulasi-dampak.js`](plan/diagnostik/gate-b-simulasi-dampak.js)

Butuh sesi login (rules `hasil_latihan` mewajibkan autentikasi). Skrip **hanya membaca** — tidak ada `setDoc`/`updateDoc`/`deleteDoc`. Dua cara:
1. **Console browser** — buka situs hosting, login sebagai admin, DevTools → Console, tempel seluruh isi skrip.
2. **Panel Browser di sesi ini** — Anda login sendiri di panel (Anda yang mengetikkan sandi), lalu skrip dieksekusi dari sini dan hasilnya langsung dibahas.

Skrip juga **memverifikasi ulang Gate A dengan data live** (`metadata/statistik_soal`), karena hasil Gate A di atas berbasis dump arsip yang bisa tertinggal dari Firestore.

---

## 10. Akar Masalah Bersama: Peta Linear (mitigasi Gate B **dan** visualisasi pohon)

Dua hal yang tampak terpisah ternyata satu akar masalah:

1. **Gate B tertahan** karena rantai linear hanya memberi 2 pilihan pada satu waktu.
2. **Visualisasi "cabang pohon"** tidak mungkin dibuat dari data yang tidak bercabang — layout apa pun (LR, radial, force) akan merender rantai lurus sebagai **dua garis panjang**, bukan pohon. Tidak ada algoritma tata letak yang bisa menciptakan cabang yang tidak ada di datanya.

**Memperbaiki bentuk peta menyelesaikan keduanya sekaligus.**

### 10.1 Bahan yang sudah tersedia: field `konsep_prasyarat`

Dokumen `bank_soal` punya field `konsep_prasyarat` per-soal, dan isinya **sudah bercabang secara alami**. Diukur dari dump arsip (`node plan/diagnostik/gate-a-*.mjs` + analisis graf):

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

### ✅ KEPUTUSAN GATE B (2026-07-25): **A + C**

- **C dipakai sekarang** → merevisi keputusan #2: **formatif selalu terbuka, hanya ujian yang dikunci.** Siswa tak akan pernah terkunci dari belajar; gerbang hanya berlaku saat hendak *dinilai*. Ini yang membuat Gate B lolos: siswa yang mentok tetap punya 55 materi untuk dipelajari.
- **A dikerjakan menyusul** → memperkaya peta prasyarat (§10.1–10.2) sebagai pekerjaan kurikulum terpisah, yang nanti sekaligus membuka jalan visualisasi pohon (§11).
- **Urutan kerja:** fitur kunci (logika) lebih dulu, lalu A, lalu visualisasi.

**Implikasi teknis penting dari C:** status terkunci sebuah kartu sekarang **bergantung pada mode yang sedang dipilih** di radio `mode_latihan`. Kartu harus **memperbarui tampilan kuncinya saat mode diganti** — bukan hanya sekali saat render. Lihat §5.4.

---

## 11. Visualisasi Peta Materi (fase terpisah, sesudah fitur kunci)

**Prasyarat mutlak:** §10.1–10.2 selesai. Tanpa data bercabang, visual pohon tidak ada gunanya.

### 11.1 Pilihan tata letak

| Bentuk | Cocok untuk | Catatan atas data ini |
|---|---|---|
| **Layered kiri→kanan** (Sugiyama-lite: kolom = kedalaman topologis) | Progresi berprasyarat, "skill tree" | ✅ **Rekomendasi utama.** 16 kolom, kolom terlebar 17 node. Arah kiri→kanan langsung membaca sebagai "maju". Status kunci memetakan mulus ke warna simpul. |
| **Radial / dari tengah ke segala arah** | Pohon dangkal & lebar, satu akar | ⚠️ Kedalaman 16 + label panjang (`Sistem Persamaan Kuadrat-Kuadrat (SPKK)`) bikin label berputar & bertumpuk. Butuh akar tunggal (sekarang ada banyak). Terlihat mengesankan, tapi sulit dibaca. |
| **Peta metro / jalur** | Rantai panjang dengan sesekali cabang | ✅ Alternatif kuat: `PETA_TAHAPAN` sudah menyediakan "jalur" (6 tahap Prasyarat + 6 tahap Trigonometri) sebagai warna garis, materi sebagai stasiun. Cocok dengan bentuk data **sekarang** tanpa menunggu §10. |
| Force-directed | Eksplorasi jaringan | ❌ Tidak menunjukkan urutan/arah progresi. Hindari. |

**Saran bertahap:** mulai **peta metro** (bisa dikerjakan dengan data linear hari ini, langsung terasa manfaatnya), lalu naik ke **layered kiri→kanan** begitu peta diperkaya (§10.1). Radial disimpan sebagai mode tampilan opsional, bukan default.

### 11.2 Implementasi

- **SVG murni, tanpa dependensi** — konsisten dengan gaya proyek (vanilla ES modules, tanpa build step). Tata letak berlapis = kedalaman topologis (Kahn, **sudah ada** di `kurikulumEngine`) → kolom; urutan dalam kolom diminimalkan persilangannya. Sekitar 100–150 baris; tidak perlu d3.
- **Satu sumber logika** — visual ini adalah **View murni** di atas `hitungStatusKunci()` yang sama. Tambahkan `hitungKedalaman()` ke `kurikulumEngine.js` agar layout dan kunci memakai satu Kahn yang sama (DRY).
- **Status simpul** = 3 keadaan: 🔒 terkunci (redup) / ▶ siap (menonjol) / ✅ master (terisi). Ini membuat "kunci materi" bisa **dilihat**, bukan cuma dirasakan saat diklik.
- **Mobile** — 16 kolom tidak muat di layar ponsel. Perlu pan + pinch-zoom (transform pada `<g>`), plus tombol "fokus ke materi saya" yang men-scroll ke frontier siswa. Uji di Safari iOS (proyek ini punya riwayat bug Safari).
- **Aksesibilitas & fallback** — tampilan daftar sekarang tetap dipertahankan sebagai mode alternatif, jangan dihapus.

---

## 9. Catatan untuk Ditinjau Nanti (di luar cakupan)

**Field `konsep_prasyarat` per-soal.** Dokumen di `bank_soal` punya field `konsep_prasyarat` (mis. soal Aturan Kuadran mencantumkan `["Pengenalan Sudut Dasar", "Operasi Aritmatika Dasar"]`) — yaitu sumber prasyarat **berbasis data** yang hidup berdampingan dengan `PETA_PRASYARAT_MANUAL` yang hard-code. Keduanya berpotensi tidak sinkron. Rencana ini sengaja **hanya** memakai peta hard-code sesuai permintaan Anda; menyatukan keduanya (atau menurunkan peta dari data) adalah kandidat perbaikan terpisah.
