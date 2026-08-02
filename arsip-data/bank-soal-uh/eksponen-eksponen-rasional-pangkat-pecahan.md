# Analisis Soal `Eksponen 1.3.pdf` — Eksponen Rasional (Pangkat Pecahan)

> **Status: analisis + rencana, belum jadi soal siap pakai.** Berkas ini BUKAN skema `bank_soal_*.json` — jangan diimpor lewat panel admin. Sumber: `Eksponen 1.3.pdf` (Supermath Matematika Umum Kelas X, koleksi pribadi), 11 halaman, 80 soal: Latihan 1.3.1 (30), Latihan 1.3.2 (24), Evaluasi 1.3 (26 — no. 21–26 esai tanpa opsi).
>
> Sub-materi sasaran: **`Eksponen Rasional (Pangkat Pecahan)`** = `Tahap 3: Bentuk Pangkat Rasional` di `TAHAPAN_EKSPONEN` (`public/js/utils/kurikulumData.js`).
>
> **Semua kunci jawaban di bawah dihitung ulang dari nol, bukan disalin dari PDF.** Yang dicek numerik ditandai ✓.

## 0. Kondisi bank soal saat ini (Gate C, 2026-08-03)

```
=== Eksponen Rasional (Pangkat Pecahan) (Eksponen) ===
  Total: 10  |  Level 1/2/3: 4/4/2  |  Cerita/Murni: 0/10
  ⚠️  Level 1: K=0 (target K>=4 / min 8 soal)
  ⚠️  Level 2: K=0 (target K>=2 / min 6 soal)
  ⚠️  Level 3: K=0 (target K>=2 / min 4 soal)
  Kandidat duplikat struktural: 3x di L1 (27^(1/3), 5^(1/3), 8^(1/3)), 2x di L2 (4^(3/2), 16^(3/4))
```

Sub-materi ini **melanggar ketiga ambang headroom** CLAUDE.md §4 sekaligus — K=0 di semua level. Ini bukan sekadar "kurang soal": siswa remedial pasti dipaksa mengerjakan ulang soal yang jawabannya sudah dia hafal. Menambal ini adalah alasan utama PDF 1.3 dibedah, bukan sekadar memperkaya.

## 1. Kriteria pemisahan: bank latihan vs bank UH

Melanjutkan kriteria yang sudah dipakai di [`eksponen-sifat-eksponen-bilangan-bulat.md`](eksponen-sifat-eksponen-bilangan-bulat.md):

| Masuk **bank latihan** (`bank_soal_*.json`, alur formatif/sumatif) | Masuk **bank UH** (di luar alur adaptif) |
|---|---|
| Numerik murni, atau variabel sebagai **basis** dengan hasil bulat | Variabel sebagai **pangkat** (`3^{x+2}`, `2^{3x+1}`) |
| Rantai ≤ 3 langkah operasi | Rantai ≥ 4 langkah, atau akar bertingkat 3+ level |
| Jawaban tunggal berupa bilangan / bentuk akar sederhana | Jawaban berupa ekspresi aljabar multivariabel (`1,5ab`, `0,16x²y⁻⁴`) |
| Bisa diselesaikan dengan 1–2 sifat eksponen | Butuh pemfaktoran, invers fungsi, atau identitas kuadrat |
| Format PG 5 opsi | Esai / uraian |

## 2. Latihan 1.3.1 — 30 soal (konversi akar ↔ pangkat, akar pangkat-n)

| No | Soal | Kunci (verifikasi sendiri) | Level | Rekomendasi |
|---:|---|---|:---:|---|
| 1 | Karena $7^3=343$, maka $\sqrt[3]{343}$ | D. $7$ | 1 | **AMBIL** — versi "dituntun", pintu masuk L1 yang landai |
| 2 | $\sqrt[4]{256}$ | B. $4$ | 1 | **AMBIL** — indeks 4, basis belum ada di bank |
| 3 | Karena $4^5=1024$, maka $\sqrt[5]{1024}$ | C. $4$ | 1 | Lewati — pola identik no.1 |
| 4 | $\sqrt[7]{128}$ | A. $2$ | 1 | Cadangan — pola identik no.2 |
| 5 | $\sqrt[6]{4096}$ | B. $4$ ✓ | 1 | Lewati — pola identik no.2 |
| 6 | $\sqrt[3]{3^9}$ | E. $27$ | 2 | Cadangan — sifat $\sqrt[n]{a^m}$, hasil bulat |
| 7 | $8^{\frac13}$ | A. $2$ | 1 | **TOLAK — sudah ada di bank** (`A0nXT7...`), memperparah duplikat L1 |
| 8 | $243^{\frac15}$ | B. $3$ | 1 | **AMBIL** — notasi pangkat pecahan, basis 243 baru |
| 9 | $27000^{\frac13}$ | C. $30$ ✓ | 2 | Cadangan — butuh faktorisasi $27\times1000$ |
| 10 | $1{,}331^{\frac13}$ | A. $1{,}1$ | 2 | **AMBIL** — basis desimal, konsep yang belum tersentuh sama sekali |
| 11 | $1296^{\frac14}$ | B. $6$ | 2 | Cadangan |
| 12 | $1{,}728^{\frac13}$ | B. $1{,}2$ | 2 | Lewati — pola identik no.10 |
| 13 | $(-343)^{\frac13}$ | C. $-7$ | 2 | **AMBIL** — basis negatif, indeks ganjil |
| 14 | $(-1024)^{\frac15}$ | A. $-4$ | 2 | Lewati — pola no.13. ⚠️ **cetakan buram** di penyebut pangkat |
| 15 | $-(729)^{\frac16}$ | C. $-3$ | 2 | **AMBIL** — letak tanda minus (luar vs dalam); pasangan kontras no.13 |
| 16 | $\sqrt[4]{625}$ | C. $5$ | 1 | **AMBIL** — distraktor $-5$ mengajarkan akar genap tak bernilai negatif |
| 17 | $\sqrt[3]{-2197}$ | B. $-13$ | 2 | Cadangan — pola no.13 |
| 18 | $\sqrt[3]{\frac{1}{64}}$ | B. $\frac14$ | 2 | Cadangan — basis pecahan; distraktor $\pm\frac14$ bagus |
| 19 | $\sqrt[3]{2^{12}}$ | C. $2^4$ | 2 | Cadangan — jawaban tetap bentuk pangkat |
| 20 | $\sqrt[4]{3^8}$ | B. $3^2$ | 2 | Lewati — pola identik no.19 |
| 21 | $\left(\frac{1}{32}\right)^{\frac15}$ | A. $\frac12$ | 2 | Cadangan |
| 22 | $\sqrt[6]{\frac{1}{729}}$ | A. $3^{-1}$ | 2 | Cadangan — jawaban pangkat negatif |
| 23 | $\sqrt{2^3}$ (opsi bentuk pangkat) | C. $2^{\frac32}$ | 2 | Cadangan — inti Tahap 3 |
| 24 | $\sqrt{2^3}$ (opsi bentuk akar) | C. $2\sqrt2$ | 2 | ⚠️ **soal identik no.23**, hanya opsi beda — lihat §5 |
| 25 | $\sqrt{3^5}$ | D. $9\sqrt3$ | 3 | **AMBIL** — pangkat rasional + sederhanakan akar |
| 26 | $\sqrt[3]{625}$ | C. $5\sqrt[3]{5}$ | 3 | Cadangan — pola no.25 |
| 27 | $\sqrt[5]{32^3}$ | E. $8$ | 3 | Cadangan |
| 28 | $\sqrt[4]{25^6}$ | E. $125$ | 3 | Cadangan |
| 29 | $9^{2\frac12}$ | E. $243$ ✓ | 3 | **AMBIL** — pangkat pecahan **campuran**, tak ada di bank |
| 30 | $8^{3\frac23}$ | E. $2048$ ✓ | 3 | Lewati — pola identik no.29 |

**Ringkas:** 30 soal, tapi hanya ~12 konsep berbeda. Sisanya beda angka, bukan beda ide. Nilai tertinggi bagian ini ada di no.13/15 (tanda minus) dan no.29 (pangkat campuran).

## 3. Latihan 1.3.2 — 24 soal (operasi sifat eksponen rasional)

Ini jantung Tahap 3 dan bagian terbaik dari PDF.

| No | Soal | Kunci (verifikasi sendiri) | Level | Rekomendasi |
|---:|---|---|:---:|---|
| 1 | $49^{\frac16}\cdot49^{\frac13}$ | C. $7$ | 2 | Cadangan — sifat $a^m\cdot a^n$ |
| 2 | $36^{\frac16}\cdot6^{\frac23}\cdot\sqrt{36}$ | E. $36$ ✓ | 3 | Cadangan kuat — samakan basis ke 6 |
| 3 | $\sqrt[3]{9^2}\cdot3\cdot\sqrt[3]{3^2}$ | D. $27$ ✓ | 3 | Cadangan kuat |
| 4 | $2\sqrt[4]{8}\cdot\sqrt[4]{4^3}\cdot\frac{1}{2^2}\sqrt[4]{2^3}$ | B. $4$ ✓ | 3 | UH — rantai 5 faktor, terlalu panjang untuk L3 |
| 5 | $8^{\frac35}:8^{\frac{4}{15}}$ | B. $2$ ✓ | 3 | Cadangan — pengurangan pecahan beda penyebut |
| 6 | $3\sqrt[3]{9}:\sqrt[3]{3}$ | A. $3\sqrt[3]{3}$ | 3 | Cadangan |
| 7 | $\frac{\sqrt5\cdot\sqrt[4]{625^3}}{\sqrt[4]{25^3}}$ | B. $25$ ✓ | 3 | Cadangan |
| 8 | $\left(16^{\frac13}\right)^{\frac32}$ | C. $4$ | 2 | **AMBIL** — sifat pangkat-berpangkat, belum ada di bank |
| 9 | $\left(\sqrt[3]{729^2}\right)^{\frac34}$ | D. $27$ | 3 | Cadangan |
| 10 | $\sqrt[4]{\sqrt[3]{\sqrt{9^{12}}}}$ | D. $3$ ✓ | 3 | UH — akar bertingkat 3 level |
| 11 | $27^{-\frac23}$ | B. $\frac19$ | 2 | Cadangan kuat — pangkat negatif, pembilang $\ne1$ |
| 12 | $\frac{1}{8^{-\frac23}}$ | D. $4$ | 3 | Cadangan |
| 13 | $\left(\sqrt[3]7\right)^{-\frac32}$ | C. $\frac17\sqrt7$ | 3 | Cadangan — hasil irasional |
| 14 | $\frac{25^{-\frac34}}{5^{-\frac12}}$ | B. $\frac15$ | 3 | Cadangan kuat — samakan basis + pangkat negatif |
| 15 | $\left(4^{\frac23}\cdot9^{\frac16}\right)^3$ | B. $48$ ✓ | 3 | Cadangan |
| 16 | $\left(\sqrt[3]{2\sqrt3}\right)^6$ | B. $12$ | 3 | Cadangan |
| 17 | $\left(\sqrt{\sqrt[3]{\sqrt{27}}}\right)^4$ | B. $3$ ✓ | 3 | UH — akar bertingkat 3 level |
| 18 | $\left(\frac{5^{\frac13}}{25^{\frac16}}\right)^{\frac35}$ | D. $1$ | 3 | **AMBIL** — jebakan bagus: pembilang & penyebut ternyata sama |
| 19 | $125^{-\frac23}$ | E. $0{,}04$ | 2 | Cadangan — jawaban desimal |
| 20 | $8^{\frac12}\cdot8^{\frac13}\cdot8^{-\frac16}$ | B. $4$ | 3 | Cadangan |
| 21 | $\left(\left(\sqrt9\right)^{\frac13}\right)^6$ | C. $9$ ✓ | 2 | Cadangan |
| 22 | $\sqrt[3]{\frac{8^2x^3}{y^{-6}}}$ | E. $4xy^2$ | — | **UH** — jawaban ekspresi aljabar |
| 23 | $\left(\sqrt{\frac{3^{x+2}}{9^{1-x}}}\right)^{\frac23}$ | D. $3^x$ | — | **UH** — variabel sebagai pangkat |
| 24 | $\left(\frac{27a^{2\frac13}b^{1\frac34}}{8a^{-\frac23}b^{-1\frac14}}\right)^{\frac13}$ | D. $1{,}5ab$ | — | **UH** — dua variabel + pecahan campuran |

## 4. Evaluasi 1.3 — 26 soal (level UH)

| No | Soal | Kunci (verifikasi sendiri) | Rekomendasi |
|---:|---|---|---|
| 1 | $x=3,y=4$: $\left(\frac{x^{\frac23}y^{-\frac43}}{y^{\frac23}x^2}\right)^{-\frac34}$ | D. $24$ ✓ | **UH** |
| 2 | $\sqrt[p]{\sqrt[q]{\sqrt[r]{a}}}$ | A. $a^{\frac{1}{pqr}}$ | **UH** — indeks akar berupa variabel |
| 3 | $\frac{125^{\frac13}-81^{\frac14}}{8^{\frac13}+25^{\frac12}}$ | E. $\frac27$ ✓ | **AMBIL ke bank latihan (L3)** — numerik murni, 4 akar sekaligus |
| 4 | $\left(\frac{3p^{\frac13}q^{\frac34}r^{\frac32}}{4p^{-\frac23}q^{\frac14}r^{\frac52}}\right)^2$ | C. $\frac{9p^2q}{16r^2}$ | **UH** |
| 5 | $\sqrt[3]{\sqrt[4]5\times\sqrt3}$ | D. $5^{\frac{1}{12}}\times3^{\frac16}$ | UH / L3 batas atas — basis berbeda |
| 6 | $V=\frac{\pi pr^4}{8ts}$, $p{=}8,t{=}4,s{=}0{,}5,V{=}128$ | E. $4\sqrt[4]{\frac1\pi}$ | **UH** — satu-satunya soal berkonteks di seluruh PDF |
| 7 | $\sqrt[3]{\frac{2^{3x+1}}{4^2}}$ | A. $2^{x-1}$ | **UH** — variabel di pangkat |
| 8 | $L=a^{\frac12}b^{-\frac13}$, $a{=}100,b{=}64$ | C. $2{,}5$ ✓ | Cadangan bank latihan (L3) — substitusi numerik saja |
| 9 | $\left(\frac{8x^2y^{-4}}{125x^{-1}y^2}\right)^{\frac23}$ | C. $0{,}16x^2y^{-4}$ | **UH** |
| 10 | $y=\sqrt{x\sqrt[3]{x\sqrt x}}$ | B. $y^{12}=x^9$ | **UH** |
| 11 | $(x+1)^{\frac25}$ untuk $x=4\sqrt2-1$ | B. $2$ ✓ | **UH** — kuncinya melihat $4\sqrt2=2^{\frac52}$ |
| 12 | $x=3^{12}$, $\sqrt[3]{\sqrt{\sqrt x}}$ | C. $3$ | Cadangan bank latihan (L3) |
| 13 | $\frac{5^{-1}}{25^{1-3x}}$ | C. $5^{6x-3}$ | **UH** — variabel di pangkat |
| 14 | $9\cdot\sqrt{3^{x-3}}\cdot\sqrt{3^{x+5}}$ | C. $3^{x+3}$ | **UH** — variabel di pangkat |
| 15 | $y=\sqrt[3]{(x-1)^2}+2$, cari $x$ | E. $\left[(y-2)^3\right]^{\frac12}+1$ | **UH** — invers |
| 16 | $\left(\sqrt[4]{\left(\sqrt[3]{\sqrt{1024}}\right)^2}\right)^{-\frac35}$ | C. $\frac12\sqrt2$ ✓ | **UH** — rantai 5 operasi |
| 17 | $\left[(81)^{-\sqrt8}\right]^{\frac{1}{16}\sqrt2}$ | D. $\frac13$ ✓ | **UH** — pangkat irasional |
| 18 | $\left(\sqrt{\frac{16^x\cdot2^7}{2^{x-2}}}\right)^{\frac23}$ | E. $4\cdot2^{x+1}$ | **UH** — variabel di pangkat |
| 19 | $\frac{7x^{-\frac32}\sqrt[6]{y^5}}{\left(x^{\frac54}-6y^{-\frac13}\right)x^{-2}}$, $x{=}4,y{=}27$ | B. $(1+2\sqrt2)9\sqrt3$ ✓ | **UH** — paling berat di bagian PG |
| 20 | $2^x+2^{-x}=5$, cari $4^x+4^{-x}$ | C. $23$ | **UH** — ⚠️ sebenarnya materi *sifat eksponen bulat*/persamaan eksponen, bukan pangkat rasional |
| 21 | *(esai)* $y=\sqrt[3]{\frac{\pi(2x+3)^2}{3}}-4$, nyatakan $x$ | $x=\frac{\sqrt{3(y+4)^3/\pi}-3}{2}$ | **UH esai** |
| 22 | *(esai)* $\frac{(2a)^3\cdot3a^{\frac13}}{a^{-\frac23}\cdot6a^2}$ | $4a^2$ | **UH esai** |
| 23 | *(esai)* $\frac{(-b^3)^2\left(b^{\frac14}\right)^{-3}b^3}{(b^2)^4\cdot b^{\frac14}}$ | $1$ | **UH esai** — hasil $1$, elegan |
| 24 | *(esai)* $\left[\sqrt[3]{\left(2^{9x^2}\right)^{4x}\cdot64}\right]^{\frac12}=\frac{1}{32}$, cari $4x^4+3x^3+2x^2+x$ | $x=-1 \Rightarrow 2$ ✓ | **UH esai** — puncak kesulitan |
| 25 | *(esai)* $\frac{p^{\frac53}q^{\frac12}-p^{\frac23}q^{\frac32}}{p^{\frac76}q^{\frac12}-p^{\frac23}q}$ | $\sqrt p+\sqrt q$ | **UH esai** — pemfaktoran + selisih kuadrat |
| 26 | *(esai)* $k=\left(x^{\frac32}+x^{\frac12}\right)\left(x^{\frac13}-x^{-\frac13}\right)$, $m=\left(x^{\frac12}+x^{-\frac12}\right)\left(x-x^{\frac13}\right)$, cari $\frac km$ | $\sqrt[3]{x}$ | **UH esai** |

## 5. Peringatan sebelum menyalin

1. **Latihan 1.3.1 no.23 dan no.24 adalah soal yang SAMA** ($\sqrt{2^3}$), hanya opsinya beda bentuk (pangkat vs akar). Jangan digabung menjadi satu soal dengan opsi campuran: $2^{\frac32}$ dan $2\sqrt2$ **bernilai sama**, jadi soal itu akan punya dua jawaban benar — persis kelas cacat yang ditangkap Gate D. Ambil salah satu saja.
2. **Tiga titik cetakan buram** yang saya baca dari konteks, bukan dari glif — verifikasi ulang ke buku fisik sebelum dipakai:
   - L1.3.1 no.14: penyebut pangkat terbaca samar; disimpulkan $\frac15$ karena $(-1024)^{\frac{1}{10}}$ tidak real dan $1024=4^5$.
   - Eval no.17: $\sqrt8$ (bukan $\sqrt6$/$\sqrt0$); hanya $\sqrt8$ yang menghasilkan opsi yang tersedia.
   - Eval no.19: radikan terbaca $\sqrt[6]{y^5}$; $\sqrt[6]{y^6}$ tidak menghasilkan opsi manapun.
3. **Notasi desimal koma**: $1{,}331$ di no.10 adalah *satu koma tiga tiga satu*, bukan seribu tiga ratus tiga puluh satu ($\sqrt[3]{1331}=11$ tidak ada di opsi). Konsisten dengan bank kita yang sudah memakai koma desimal.
4. **Kunci PDF tidak dipakai**: seluruh kunci di atas hasil hitung ulang. Yang bertanda ✓ diverifikasi numerik lewat skrip.

## 6. Rencana ambil ke bank latihan (12 soal → total 22)

Target akhir: **L1 8 / L2 8 / L3 6**, di atas ambang headroom CLAUDE.md §4 (8/6/4) dengan margin untuk kuota draf sumatif 4-4-2.

| Level | Sumber | Soal | Konsep yang ditambah (belum ada di bank) |
|:---:|---|---|---|
| 1 | L1.3.1 no.1 | $\sqrt[3]{343}$ (dituntun $7^3=343$) | pola "dituntun", basis 7 |
| 1 | L1.3.1 no.2 | $\sqrt[4]{256}$ | indeks akar 4 |
| 1 | L1.3.1 no.8 | $243^{\frac15}$ | indeks 5, notasi pangkat pecahan |
| 1 | L1.3.1 no.16 | $\sqrt[4]{625}$ | distraktor $-5$: akar genap tak negatif |
| 2 | L1.3.1 no.10 | $1{,}331^{\frac13}$ | basis desimal |
| 2 | L1.3.1 no.13 | $(-343)^{\frac13}$ | basis negatif, indeks ganjil |
| 2 | L1.3.1 no.15 | $-(729)^{\frac16}$ | letak tanda minus (luar vs dalam) |
| 2 | L1.3.2 no.8 | $\left(16^{\frac13}\right)^{\frac32}$ | pangkat berpangkat |
| 3 | L1.3.1 no.25 | $\sqrt{3^5}$ | hasil bentuk akar tersederhana |
| 3 | L1.3.1 no.29 | $9^{2\frac12}$ | pangkat pecahan campuran |
| 3 | L1.3.2 no.18 | $\left(\frac{5^{\frac13}}{25^{\frac16}}\right)^{\frac35}$ | samakan basis, hasil $1$ |
| 3 | Eval no.3 | $\frac{125^{\frac13}-81^{\frac14}}{8^{\frac13}+25^{\frac12}}$ | empat akar dalam satu ekspresi |

Cadangan bila salah satu ditolak saat penulisan: L1.3.1 no.4/6/18/21/23, L1.3.2 no.11/14/19/21, Eval no.8/12.

## 7. Langkah lanjut

Draf siap impor: **`arsip-data/bank_soal/eksponen/bank_soal_eksponen_rasional__pangkat_pecahan_.json`** (12 soal, tanpa `id`).

- [x] Tulis `clue` + `pembahasan` bergaya bank utama untuk 12 soal §6 — bukan sekadar kunci. `clue` di bank ini berbentuk *petunjuk strategi*, bukan langkah pertama penyelesaian.
- [x] Tulis distraktor sendiri; opsi PDF hanya dipakai kalau memang mendidik (mis. $-5$ di $\sqrt[4]{625}$).
- [x] Jalankan Gate D — **LOLOS, 0 temuan fatal**, proyeksi `4/4/2 (10) -> 8/8/6 (22)`, headroom aman di semua level. Dua `PERIKSA` yang muncul sudah diperiksa manual dan bukan cacat soal:
  - soal ke-5 ($1,331^{\frac13}$): penerjemah LaTeX Gate D membaca koma sebagai pemisah, bukan koma desimal, lalu menghitung $331^{\frac13}=6{,}917$. Nilai soal yang benar $1,1^3 = 1,331$ sudah diverifikasi tangan.
  - soal ke-6 ($(-343)^{\frac13}$): opsi "Tidak terdefinisi" bukan LaTeX sehingga tak bisa dievaluasi numerik. Disengaja — opsi itu justru inti jebakannya.
- [ ] Verifikasi 3 titik cetakan buram (§5.2) ke buku fisik. **Tidak menghalangi impor** — ketiganya ada di soal yang TIDAK diambil.
- [x] Impor lewat panel admin, lalu jalankan ulang Gate C — **selesai 2026-08-03**. Bank live sekarang `Total: 22 | Level 1/2/3: 8/8/6`, ketiga ⚠️ headroom hilang. `bank_soal_all.json` sudah diekspor ulang (1473 → 1485 soal).
- [ ] **Nol soal berkonteks** masih akan tersisa (bank 0/10, PDF hanya punya 1 yaitu Eval no.6 yang levelnya UH). Kalau mau ada soal cerita di Tahap 3, harus dikarang sendiri — PDF ini tidak menyediakannya.
- [x] Putuskan wadahnya — **selesai 2026-08-03: di luar alur adaptif**, ditangani website tes terpisah milik pemilik proyek (template impornya: `template-import-soal.docx`). Konsekuensinya tidak ada Level 4 di `soalEngine.js` dan tidak ada sub-materi baru di `kurikulumData.js`. Alasan lengkap + gagasan jangka panjang "pop-up latihan bonus setelah tuntas" di [plan/PLAN.md](../../plan/PLAN.md) §16.
