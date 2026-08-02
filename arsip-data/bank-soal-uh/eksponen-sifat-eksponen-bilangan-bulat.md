# Rencana Bank Soal UH — Sifat Eksponen Bilangan Bulat

> **Status: kandidat terverifikasi, naskah UH sudah dibuat.** Berkas ini BUKAN skema `bank_soal_*.json` yang dibaca `importBankSoalJSON` di `public/js/admin/bankSoalController.js` — jangan diimpor lewat panel admin. Sumber: `Eksponen 1.1.pdf` (Supermath Matematika Umum Kelas X, koleksi pribadi), 10 halaman.
>
> **Riwayat:** versi pertama (2026-07-31) hanya mendaftar kandidat tanpa kunci, bertanda "belum diverifikasi ulang — tandai TODO". **Diperbarui 2026-08-03: seluruh kunci sudah dihitung ulang dari nol dan diverifikasi numerik** (`✓`), menyamakan standar dengan berkas 1.2 dan 1.3. Naskahnya: `uh-eksponen-1-1-sifat-eksponen-bulat.docx`.

## 0. Kondisi bank latihan saat ini (Gate C, 2026-08-03)

```
=== Sifat Eksponen Bilangan Bulat (Eksponen) ===
  Total: 28  |  Level 1/2/3: 10/12/6  |  Cerita/Murni: 0/28
```

Tidak ada ⚠️ headroom. Sama seperti modul 1.2, sisa PDF ini murni bahan UH — tidak ada draf JSON yang perlu dibuat.

## 1. Kenapa dipisah dari `bank_soal_sifat_eksponen_bilangan_bulat.json`

Soal-soal di bawah levelnya jauh di atas level 3 yang sudah dikurasi ke bank soal utama (28 soal, level 1–3). Kalau dipaksa masuk level 3, gradasi 1→2→3 yang sudah dijaga konsisten akan pincang. Tiga pola yang membuatnya "kelas UH" bukan "kelas latihan bertahap":

1. **Eksponen dengan pangkat berupa variabel aljabar** (bukan sekadar basis variabel) — lompatan abstraksi besar.
2. **Banyak variabel simultan / sistem persamaan eksponensial** — butuh manipulasi aljabar tambahan di luar sifat eksponen itu sendiri.
3. **Kombinasi berat murni sifat eksponen** — rantai panjang, tapi tanpa variabel-sebagai-pangkat.

## 2. Pola A — eksponen dengan pangkat variabel

| Sumber | Soal | Kunci |
|---|---|---|
| L1.1.3 no.3 | $(3^a)^a \cdot 3^{1-a^2}$ | $3$ ✓ |
| L1.1.3 no.7 | $\left[\left((x y^a)^{1-a}\right)^2 \left((x y^a)^{a-1}\right)^2\right]$, $x,y \ne 0$ | $1$ ✓ |
| Eval no.25 | $p^a \cdot (p^a)^{1-a} \cdot (p^{1+a})^a$ | $p^{3a}$ ✓ |

> **Koreksi rujukan.** Versi pertama berkas ini menulis soal kedua sebagai "Latihan 1.1.4 no.7 (bagian S, halaman 4)". Yang benar **Latihan 1.1.3 no.7** — nomornya bersambung ke halaman 4, dan "S" di sana sebenarnya angka **5** yang terbaca salah oleh pemindai (lihat §6.2).

Ketiganya berstruktur sama dan indah: pangkatnya saling meniadakan sehingga hasilnya konstan atau sangat sederhana. Cocok jadi tiga nomor berurutan dengan kesulitan menanjak.

## 3. Pola B — banyak variabel simultan / sistem eksponensial

| Sumber | Soal | Kunci |
|---|---|---|
| Eval no.6 | Jika $8^m = 27$, nilai $2^{m+2} + 4^m$ | $21$ ✓ |
| Eval no.7 | $a, b$ bulat positif, $a^b = 2^{20} - 2^{19}$; cari $a+b$ | $21$ ✓ |
| Eval no.23 | $\frac{1}{1+x^{b-a}} + \frac{1}{1+x^{a-b}}$ | $1$ ✓ |
| Eval no.4 | $a=\frac12, b=2, c=1$; nilai $\frac{a^{-2}bc^3}{ab^2c^{-1}}$ | $4$ ✓ |
| Eval no.9 | $\frac{2^{n+2} \cdot 6^{n-4}}{12^{n-1}}$ | $\frac{1}{27}$ ✓ |
| Eval no.11 | $\frac{3^{n+1}-3^{n-1}}{3^{n-1}-3^{n-2}}$ | $12$ ✓ |
| Eval no.21 | $\left(\frac23\right)^2 \cdot \left(-\frac34\right)^2 - \frac{3}{2^3} : \frac58$ | $-0{,}35$ ✓ |
| Eval no.28 | $\frac{3^{n+4}-3 \cdot 3^{n+1}}{8 \cdot 3^{n+2}}$ | $1$ ✓ |
| Eval no.29 | $\frac{5^6 (6^6-3^8) 2^4}{11 \cdot 5^3 \cdot 10^4}$ | $3^6$ ✓ |
| Eval no.8 | $(a-b)^{-5}\left(\frac{a+b}{b-a}\right)^{-4}\frac{1}{(a+b)^{-4}}$ | $\frac{1}{a-b}$ ✓ |
| Eval no.19 | $\frac{x^{-1}+y^{-1}}{x^{-1}-y^{-1}}$ | $\frac{y+x}{y-x}$ ✓ |
| Eval no.26 | $\left(\frac{a^{-4}b^2c}{ab^{-6}c^3}\right)^4$ | $\frac{b^{32}}{a^{20}c^8}$ ✓ |

Eval no.7 dan no.29 adalah dua yang terbaik: keduanya runtuh jadi mudah begitu siswa memfaktorkan ($2^{20}-2^{19} = 2^{19}$; $6^6-3^8 = 3^6 \cdot 55$), tapi tak tertembus kalau dihitung mentah.

## 4. Pola C — kombinasi berat murni sifat eksponen (numerik)

Paling dekat dengan gaya level 3 yang sudah ada, jadi paling mudah "naik kelas" ke bank utama kalau suatu saat level 3 mau diperdalam.

| Sumber | Soal | Kunci |
|---|---|---|
| Eval no.1 | $\frac{2^{-4}\cdot2^7\cdot(-2)^{-7}\cdot(-2)^0}{2^3\cdot2^{-5}}$ | $-\frac14$ ✓ — **opsi PDF cacat, lihat §6.1** |
| Eval no.2 | $(16x^5y^3)\left(\frac{1}{2^3}x^{-3}y^{-2}\right)$ | $2x^2y$ ✓ |
| Eval no.10 | $\left(2-\frac12-\frac{1}{2^2}\right)^{-2}$ | $\frac{16}{25}$ ✓ |
| Eval no.13 | $\left[\left(\frac12\right)^3\right]^{-2}$ | $64$ ✓ |
| Eval no.17 | $\frac{(0{,}6)^0-(0{,}1)^{-1}}{\left(\frac{3}{2^3}\right)^{-1}\left(\frac32\right)^3+\left(-\frac13\right)^{-1}}$ | $-\frac32$ ✓ |
| Eval no.20 | $-p\left(-p \cdot (-p^{-3})\right)^{-3}$ | $-p^7$ ✓ |
| Eval no.27 | $10^4+10^2+10^0+10^{-2}+10^{-4}$ | $10101{,}0101$ ✓ |

## 5. Pola D — esai uraian (baru, tidak ada di versi pertama)

Evaluasi 1.1 no.30–31 adalah soal uraian tanpa opsi. Versi pertama berkas ini membuang **keduanya** dengan alasan "materi faktorisasi/aljabar, bukan sifat eksponen". Setelah dibaca ulang, alasan itu **hanya berlaku untuk no.31**; no.30 justru murni sifat eksponen dan sangat bagus:

| Sumber | Soal | Kunci |
|---|---|---|
| Eval no.30a | $\frac{4^{n+1}-2^{2n+1}}{4^n}$ | $2$ ✓ |
| Eval no.30b | $\frac{(a^{p+q})^2-a^{2q}}{a^q(a^{2p}-1)}$ | $a^q$ ✓ |

No.30b khususnya: siswa harus melihat bahwa pembilang memfaktor menjadi $a^{2q}(a^{2p}-1)$, lalu $(a^{2p}-1)$ saling hapus. Ini soal esai terbaik di seluruh PDF 1.1.

## 6. Peringatan sebelum menyalin

1. **`Evaluasi 1.1 no.1` opsinya cacat di sumbernya.** Jawaban yang benar $-\frac14 = -2^{-2}$, sedangkan opsi yang tersedia hanya $-2^7$, $2^{-28}$, $2^{-7}$, $2^7$, $2^{28}$ — **kunci yang benar tidak ada di antaranya**. Sudah dicek dengan aritmetika pecahan eksak, bukan desimal. Soalnya sendiri bagus (menguji $(-2)^{-7}$ bernilai negatif sementara $(-2)^0$ positif), jadi di naskah UH ia dipakai sebagai **esai** — yang cacat hanya daftar opsinya, bukan soalnya. Kelas cacat yang sama dengan `L1.2.6 no.4` di modul 1.2.
2. **Font pemindaian membuat angka 5 tampak seperti huruf S** di beberapa tempat (mis. "Latihan 1.1.3 no.S" = no.5, "$2^{-S}$" = $2^{-5}$). Jangan menyalin glif mentah-mentah.
3. **`Latihan 1.1.4 no.12` ($0^0$) sebaiknya dihindari.** PDF menjawab "Undefined", padahal di banyak konteks (kombinatorika, deret pangkat) $0^0$ didefinisikan $=1$. Ini perdebatan konvensi, bukan benar-salah, jadi tidak layak jadi soal ujian berskor. Bandingkan dengan `no.7` ($0^{-3}$) yang memang tak terdefinisi tanpa perdebatan — itu aman dipakai.

## 7. Dikeluarkan dari daftar kandidat (bukan topik ini)

- **Eval no.31** (ekspansi $(a+b)^n$, binomial pangkat tinggi) — materi faktorisasi/aljabar, bukan sifat eksponen. *(Catatan: no.30 sebelumnya ikut terbuang bersama no.31; keputusan itu dikoreksi di §5.)*
- **Latihan 1.1.2 no.6–11** (identitas selisih kuadrat, dst.) — sudah disaring keluar di sesi kurasi bank soal utama dengan alasan sama.
- **Latihan 1.1.1 no.6–7** (faktorisasi prima 2700; nilai polinomial untuk $x=6$) — aritmetika/aljabar dasar, bukan sifat eksponen.

## 8. Langkah lanjut

- [x] Verifikasi ulang tiap jawaban akhir (jangan asumsikan kunci di PDF benar) — **selesai, seluruhnya dihitung ulang; satu cacat sumber ditemukan (§6.1)**.
- [x] Tulis naskah UH — `uh-eksponen-1-1-sifat-eksponen-bulat.docx`, 13 soal, bobot 210.
- [x] Putuskan wadahnya — **selesai 2026-08-03: di luar alur adaptif**, ditangani website tes terpisah milik pemilik proyek (template impornya: `template-import-soal.docx`). Konsekuensinya tidak ada Level 4 di `soalEngine.js` dan tidak ada sub-materi baru di `kurikulumData.js`. Alasan lengkap + gagasan jangka panjang "pop-up latihan bonus setelah tuntas" di [plan/PLAN.md](../../plan/PLAN.md) §16.
- ~~Kalau jadi level baru dalam sub-materi yang sama: cek ulang `AMBANG_NAIK_LEVEL` & aturan headroom K di `soalEngine.js`.~~ **Gugur** — keputusan §16.1 PLAN.md menutup opsi "level baru", jadi `AMBANG_NAIK_LEVEL` tidak disentuh. Butir ini hidup lagi hanya kalau gagasan "bonus Level 4" (PLAN.md §16.2) suatu saat dikerjakan.
- [ ] Kalau ada yang "naik kelas" ke bank latihan: tulis `clue` + `pembahasan` bergaya bank utama, bukan sekadar salin kunci.
