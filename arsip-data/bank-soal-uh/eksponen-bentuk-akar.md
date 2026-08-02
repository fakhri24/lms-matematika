# Rencana Bank Soal UH — Bentuk Akar (Operasi Bentuk Akar + Merasionalkan Penyebut)

> **Status: rencana, belum jadi soal siap pakai.** Berkas ini BUKAN skema `bank_soal_*.json` yang dibaca `importBankSoalJSON` di `public/js/admin/bankSoalController.js` — jangan diimpor lewat panel admin. Sumber: `Eksponen 1.2.pdf` (Supermath Matematika Umum Kelas X, koleksi pribadi), 13 halaman, **91 soal**.
>
> Berbeda dari dua berkas UH lain yang satu berkas = satu sub-materi, modul 1.2 memayungi **dua** sub-materi sekaligus — `Operasi Bentuk Akar` dan `Merasionalkan Penyebut`, keduanya `Tahap 2: Bentuk Akar` di `TAHAPAN_EKSPONEN`. Buku tidak memisahkan keduanya, jadi berkas ini pun tidak.
>
> **Kunci jawaban di bawah dihitung ulang dari nol, bukan disalin dari PDF.** Yang bertanda ✓ diverifikasi numerik. (Ini menyimpang dari berkas 1.1 yang kuncinya sengaja dibiarkan TODO — standar verifikasi dinaikkan sejak sesi 1.3.)

## 0. Kondisi bank latihan saat ini (Gate C, 2026-08-03)

```
=== Operasi Bentuk Akar (Eksponen) ===
  Total: 28  |  Level 1/2/3: 10/12/6  |  Cerita/Murni: 0/28
=== Merasionalkan Penyebut (Eksponen) ===
  Total: 28  |  Level 1/2/3: 10/11/7  |  Cerita/Murni: 0/28
```

**Tidak ada ⚠️ headroom di kedua sub-materi.** Ini sebabnya modul 1.2 tidak menghasilkan draf JSON seperti modul 1.3 — bank latihannya sudah sehat, jadi yang tersisa dari PDF memang murni bahan UH. Yang perlu diawasi hanya konsentrasi duplikat struktural (mis. 8 soal pola `Bentuk rasional dari $\frac{a}{\sqrt{b}}$` di L1 Merasionalkan Penyebut) — bukan masalah headroom, tapi berarti menambah soal berpola sama ke bank tidak lagi memberi nilai.

## 1. Kriteria "kelas UH" untuk topik bentuk akar

Bank latihan sudah menutup: menyederhanakan akar, penjumlahan/pengurangan akar sejenis, perkalian/pembagian akar, dan merasionalkan penyebut (monomial maupun binomial dengan sekawan). Yang di atas itu:

1. **Akar bersusun / akar dalam akar** — $\sqrt{a \pm 2\sqrt{b}}$ dan susunan bertingkat. Butuh mencari sepasang bilangan yang jumlahnya $a$ dan hasil kalinya $b$ — langkah pencarian yang tidak ada di manapun dalam alur latihan.
2. **Penyebut tiga suku** — sekawan dipakai dua kali berturut-turut.
3. **Variabel / parameter**, termasuk akar kuadrat sempurna bervariabel yang jawabannya bergantung syarat ($\sqrt{x^2-6x+9}$ untuk $x>3$).
4. **Radikal tak hingga** — $\sqrt{2\sqrt{2\sqrt{2\cdots}}}$, diselesaikan dengan persamaan swa-rujuk.
5. **Kombinasi berat numerik** — rantai ≥4 langkah atau butuh identitas aljabar (selisih kuadrat, kuadrat jumlah).

## 2. Kandidat soal UH

### Pola A — akar bersusun $\sqrt{a \pm 2\sqrt{b}}$ (paling bernilai; nol di bank)

| Sumber | Soal | Kunci |
|---|---|---|
| L1.2.6 no.1 | $\sqrt{9-2\sqrt{20}}$ | $\sqrt5-2$ |
| L1.2.6 no.2 | $\sqrt{18+8\sqrt2}$ | $4+\sqrt2$ |
| L1.2.6 no.3 | $\sqrt{28-10\sqrt3}$ | $5-\sqrt3$ |
| L1.2.6 no.4 | $\sqrt{14-8\sqrt3}$ | $\sqrt8-\sqrt6$ |
| L1.2.6 no.5 | $\sqrt{19+4\sqrt{21}}$ | $2\sqrt3+\sqrt7$ |
| L1.2.6 no.6 | $y=\sqrt{8+2\sqrt{15}}$, cari $\frac2y$ | $\sqrt5-\sqrt3$ |
| L1.2.6 no.7 | $a=\sqrt{10-2\sqrt{21}}$, cari $\frac4a$ | $\sqrt7+\sqrt3$ |
| L1.2.6 no.10 | $\sqrt{\sqrt{97+56\sqrt3}}$ | $2+\sqrt3$ ✓ |
| Eval no.16 | $\sqrt{21+8\sqrt5}-\sqrt{8-\sqrt{60}}$ | $4+\sqrt3$ |
| Eval no.17 | $\frac{44}{\sqrt{28-10\sqrt3}}$ | $10+2\sqrt3$ |
| Eval no.21 | $\frac{1}{\sqrt{\sqrt{49-20\sqrt6}}}$ | $\sqrt3+\sqrt2$ ✓ |

Ini **satu topik utuh yang sama sekali tidak ada di bank latihan**, dan 11 soal cukup untuk jadi satu bagian UH sendiri. Kalau suatu saat mau dijadikan sub-materi baru (misal "Akar Bersusun"), ingat ambang 10 soal + headroom per level di CLAUDE.md §4 — 11 soal ini belum cukup karena harus terbagi ke 3 level (butuh min 8/6/4 = 18).

### Pola B — penyebut tiga suku

| Sumber | Soal | Kunci |
|---|---|---|
| L1.2.5 no.9 | $\frac{12}{\sqrt2+\sqrt3+\sqrt5}$ | $2\sqrt3+3\sqrt2-\sqrt{30}$ ✓ |
| Eval no.19 | $\frac{12}{2+\sqrt3-\sqrt7}$ | $2\sqrt3+3+\sqrt{21}$ ✓ |

Keduanya memakai trik yang sama: kelompokkan dua suku, kalikan sekawan, lalu rasionalkan lagi. Pasangan yang bagus untuk satu nomor UH bertingkat.

### Pola C — variabel / parameter

| Sumber | Soal | Kunci |
|---|---|---|
| L1.2.3 no.8 | $\sqrt x+\sqrt{9x}-3\sqrt{4x}+2\sqrt{25x}$ | $8\sqrt x$ |
| L1.2.4 no.14 | $y=\sqrt{x\sqrt x}$, $x>0$ | $y^4=x^3$ |
| L1.2.4 no.15 | $a=b\sqrt{b\sqrt{b^3}}$, $b>0$ | $a^4=b^9$ |
| L1.2.5 no.8 | $\frac{\sqrt{x+1}+\sqrt x}{\sqrt{x+1}-\sqrt x}$ | $2x+1+2\sqrt{x(x+1)}$ |
| L1.2.6 no.8 | $\sqrt{x^2-6x+9}$ untuk $x>3$ | $x-3$ |
| L1.2.6 no.9 | $\sqrt{x^2+10x+25}$ untuk $x<-5$ | $-x-5$ |
| Eval no.1 | $\sqrt p+\sqrt{4p}+\sqrt{25p}-2\sqrt{9p}$ | $2\sqrt p$ |
| Eval no.6 | $\left(\sqrt{a+3}+\sqrt{a-3}\right)^2$ | $2a+2\sqrt{a^2-9}$ |
| Eval no.8 | $\sqrt{\frac{y^2-x^2}{\sqrt x\sqrt y}}$, $x=6,y=24$ | $3\sqrt5$ |
| Eval no.25 | $x+y+3\sqrt{x+y}=18$ dan $x-y-2\sqrt{x-y}=15$, cari $xy$ | $-136$ |
| Eval no.27 | $A+B=9$ dengan $A=\sqrt{14y^2-20y+48}$, $B=\sqrt{14y^2-20y-15}$; cari $A-B$ | $7$ |

**L1.2.6 no.8 & no.9 layak dinaikkan prioritasnya.** Keduanya menguji $\sqrt{x^2}=|x|$ — miskonsepsi yang sangat umum (siswa menjawab $x-3$ tanpa memeriksa syarat, kebetulan benar di no.8, lalu salah total di no.9). Eval no.25 dan no.27 adalah dua soal terbaik di seluruh PDF: keduanya diselesaikan lewat substitusi/identitas, bukan hitungan brutal.

### Pola D — kombinasi berat numerik

| Sumber | Soal | Kunci |
|---|---|---|
| Eval no.5 | $\frac{2+\sqrt6}{2-\sqrt6}$ | $-5-2\sqrt6$ |
| Eval no.7 | $\frac{\frac12-\frac{1}{\sqrt5}}{\frac12+\frac{1}{\sqrt5}}=a+b\sqrt5$, cari $a+b$ | $5$ |
| Eval no.12 | $(\sqrt5+\sqrt3+\sqrt2)(\sqrt5+\sqrt3-\sqrt2)$ | $6+2\sqrt{15}$ |
| Eval no.13 | $1+\frac{1}{\sqrt2}+\frac{1}{1-\sqrt2}$ | $-\frac12\sqrt2$ |
| Eval no.15 | $a=\frac{2+\sqrt3}{2-\sqrt3}$, $b=\frac{2-\sqrt3}{2+\sqrt3}$, cari $a+b$ | $14$ |
| Eval no.18 | $\left(\frac{2+\sqrt5}{2-\sqrt5}\right)^2+\left(\frac{2-\sqrt5}{2+\sqrt5}\right)^2$ | $322$ ✓ |
| Eval no.23 | $a=\frac{1}{\sqrt{2025}+\sqrt{2024}}$, $b=\frac{1}{\sqrt{2025}-\sqrt{2024}}$, cari $a^2-2024ab+b^2$ | $6074$ |
| Eval no.24 | $(\sqrt5+\sqrt6+\sqrt7)(\sqrt5+\sqrt6-\sqrt7)(\sqrt5-\sqrt6+\sqrt7)(-\sqrt5+\sqrt6+\sqrt7)$ | $104$ ✓ |
| Eval no.26 | $(3-\sqrt5)\sqrt{3+\sqrt5}+(3+\sqrt5)\sqrt{3-\sqrt5}$ | $2\sqrt{10}$ ✓ |
| L1.2.5 no.7 | $\frac{55-11\sqrt3}{5+\sqrt3}$ | $14-5\sqrt3$ |

Eval no.23 (angka 2024/2025) dan no.24 pantas jadi nomor penutup UH — keduanya runtuh jadi mudah begitu siswa melihat $ab=1$ / selisih kuadrat berulang, tapi tak tertembus kalau dikerjakan mentah.

### Pola E — radikal tak hingga

| Sumber | Soal | Kunci |
|---|---|---|
| Eval no.20 | $\sqrt{2\sqrt{2\sqrt{2\sqrt{\cdots}}}}$ | $2$ |
| Eval no.22 | $\sqrt{12+\sqrt{12+\sqrt{12+\cdots}}}-\sqrt{6+\sqrt{6+\sqrt{6+\cdots}}}$ | $1$ |

Dua soal ini butuh gagasan yang sama sekali baru (misalkan hasilnya $L$, lalu $L^2 = 12 + L$). Nilai pedagogisnya tinggi tapi **hanya cocok sebagai soal bonus/pengayaan**, bukan penentu ketuntasan — tekniknya tidak diajarkan di manapun dalam alur materi kita.

## 3. Temuan penting: dua celah di bank latihan

Dua hal muncul dari pembacaan PDF ini yang **bukan** soal UH, tapi perlu dicatat karena menyangkut bank latihan:

1. **Latihan 1.2.1 (14 soal) — konsep bilangan rasional vs irasional tidak ada sama sekali di bank kita.** Isinya: mengenali bilangan rasional/irasional, desimal berulang vs tak berulang, `√49 = 7` (bukan `±7`) versus `y² = 64 → y = ±8`. Levelnya 1–2, bukan UH. Ini fondasi yang menjelaskan *mengapa* penyebut perlu dirasionalkan — dan bank kita punya satu soal yang menyentuhnya (`vFIMoHl7SWJ2zJVNJ26j`, "Mengapa bentuk $\frac{1}{\sqrt5}$ perlu dirasionalkan?") tanpa ada materi pendukungnya. Layak dipertimbangkan sebagai tambahan bank latihan tersendiri, bukan UH.
2. **Nol soal berkonteks** di kedua sub-materi (0/28 dan 0/28), dan PDF ini pun hanya menyumbang satu (Eval no.14, keliling segitiga siku-siku sama kaki → $8-4\sqrt2$). Sama seperti temuan di modul 1.3: kalau mau soal cerita, harus dikarang sendiri.

## 4. Dikeluarkan dari daftar kandidat (bukan topik ini)

- **L1.2.1 no.13** ($i=\sqrt{-1}$, $\sqrt{-100}=10i$) — bilangan imajiner, di luar cakupan Fase E.
- **Eval no.9** ($a+ar=25$, $ar^2+ar^3=225$, cari $r$; kunci $\pm3$) — barisan geometri, bukan bentuk akar.
- **Eval no.11** ($\left(\sqrt{\frac{2^3}{3^4}}\right)^4 \cdot 6^2 \cdot \left(\sqrt{2^3\cdot3^6}\right)^{-2}$; kunci $2^5\cdot3^{-12}$) — sifat eksponen bilangan bulat, materi modul 1.1. Kalau mau dipakai, tempatnya di berkas UH 1.1.
- **Eval no.14** (keliling segitiga siku-siku sama kaki; kunci $8-4\sqrt2$) — geometri berbungkus bentuk akar. Bukan dikeluarkan karena salah topik, tapi karena ia satu-satunya soal berkonteks; lihat §3.2.
- **Eval no.10** ($\sqrt{0,0625}+\frac{1}{\sqrt{16}}-(0,5)^2$; kunci $0,25$) — akar desimal, levelnya latihan biasa bukan UH.

## 5. Peringatan sebelum menyalin

1. **`L1.2.2 no.8` bukan $\sqrt{121{,}25}$.** Yang tercetak adalah $\sqrt{121.25}$ dengan **titik sebagai tanda kali**, jadi maksudnya $\sqrt{121 \times 25} = 11 \times 5 = 55$ ✓. Dibaca sebagai desimal maupun sebagai pemisah ribuan, tidak ada opsi yang cocok. Jangan salin notasi titiknya — tulis ulang sebagai $\sqrt{121 \times 25}$.
2. **`L1.2.4 no.11` cetakannya buram** pada kedua pangkat: $\frac{2\sqrt{64^{2x}}}{\sqrt{16^{3x}}}$. Pembacaan $2x$ dan $3x$ disimpulkan dari fakta bahwa hanya kombinasi itu yang membuat $x$ saling hapus dan menghasilkan konstanta ($=2$), sebagaimana dituntut oleh opsi yang semuanya konstanta. Verifikasi ke buku fisik sebelum dipakai.
3. **`L1.2.6 no.4` opsinya cacat.** Kunci yang benar $\sqrt8-\sqrt6$ (opsi C). Opsi D adalah $\sqrt6-\sqrt8$ yang **bernilai negatif** sehingga mustahil jadi hasil sebuah akar kuadrat, dan opsi E berbunyi "C dan D benar" — jelas salah. Kalau soal ini dipakai, buang opsi D dan E.
4. **`L1.2.1 no.5`–`no.6` adalah soal pilihan-pernyataan** ("Pernyataan yang pasti benar mengenai bilangan rasional adalah..."), bukan hitungan. Formatnya berbeda dari seluruh bank kita; kalau dipakai, tulis ulang opsinya sendiri — beberapa opsi PDF tumpang tindih maknanya.

## 6. Langkah lanjut (belum dikerjakan)

- [ ] Verifikasi 2 titik cetakan/notasi bermasalah (§5.1, §5.2) ke buku fisik.
- [ ] Putuskan wadah UH. Sekarang sudah ada tiga berkas rencana UH (1.1, 1.2, 1.3) tanpa satu pun wadah nyata — keputusan ini makin mendesak, bukan makin bisa ditunda.
- [ ] Pertimbangkan Pola A (akar bersusun) sebagai sub-materi baru. Butuh 18 soal (8/6/4) untuk memenuhi headroom; PDF ini menyumbang 11, jadi 7 sisanya harus dikarang.
- [ ] Pertimbangkan menambah materi "bilangan rasional vs irasional" ke bank latihan (§3.1) — ini celah fondasi, bukan pengayaan.
- [ ] Tulis `clue` + `pembahasan` bergaya bank utama untuk soal yang akhirnya dipakai; jangan salin kunci mentah.
