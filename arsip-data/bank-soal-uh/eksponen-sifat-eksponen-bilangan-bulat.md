# Rencana Bank Soal UH — Sifat Eksponen Bilangan Bulat

> **Status: rencana, belum jadi soal siap pakai.** Berkas ini BUKAN skema `bank_soal_*.json` yang dibaca `importBankSoalJSON` di `public/js/admin/bankSoalController.js` — jangan diimpor lewat panel admin. Isinya kandidat soal level ulangan harian (UH) yang disaring dari `Eksponen 1.1.pdf` (Supermath Matematika Umum Kelas X, koleksi pribadi), untuk dikembangkan nanti — entah jadi level 4 baru, sub-materi terpisah, atau bank soal UH tersendiri di luar alur formatif/sumatif biasa.

## Kenapa dipisah dari `bank_soal_sifat_eksponen_bilangan_bulat.json`

Soal-soal di bawah ini levelnya jauh di atas level 3 yang sudah dikurasi ke bank soal utama (lihat sesi kurasi sebelumnya: 28 soal, level 1–3). Kalau dipaksa masuk level 3, gradasi 1→2→3 yang sudah dijaga konsisten akan pincang. Dua pola yang membuatnya "kelas UH" bukan "kelas latihan bertahap":

1. **Eksponen dengan pangkat berupa variabel aljabar** (bukan sekadar basis variabel) — lompatan abstraksi besar.
2. **Banyak variabel simultan / sistem persamaan eksponensial** — butuh manipulasi aljabar tambahan di luar sifat eksponen itu sendiri.

## Kandidat soal (referensi ke `Eksponen 1.1.pdf`)

Jawaban akhir dan pembahasan **belum diverifikasi ulang / belum ditulis** — tandai TODO sebelum dipakai.

### Pola A — eksponen dengan pangkat variabel
- Latihan 1.1.3 no.3: $(3^a)^a \cdot 3^{1-a^2} = \cdots$
- Evaluasi 1.1 no.25: $p^a \cdot (p^a)^{1-a} \cdot (p^{1+a})^a = \cdots$
- Latihan 1.1.4 no.7 (bagian S, halaman 4) no.7: $[((x \cdot y^a)^{1-a})^2 \cdot ((x \cdot y^a)^{a-1})^2] = \cdots$ (untuk $x, y \ne 0$)

### Pola B — banyak variabel simultan / sistem eksponensial
- Evaluasi 1.1 no.6: Jika $8^m = 27$, nilai dari $2^{m+2} + 4^m = \cdots$
- Evaluasi 1.1 no.7: Jika $a, b$ bilangan bulat positif dengan $a^b = 2^{20} - 2^{19}$, maka $a+b = \cdots$
- Evaluasi 1.1 no.23: $\frac{1}{1+x^{b-a}} + \frac{1}{1+x^{a-b}} = \cdots$
- Evaluasi 1.1 no.4: Diketahui $a=\frac12, b=2, c=1$. Nilai dari $\frac{a^{-2}bc^3}{ab^2c^{-1}} = \cdots$
- Evaluasi 1.1 no.9, 11, 21, 28, 29: berbagai bentuk pecahan eksponensial bercampur ($3^{n+4}$, $5^6 \cdot (6^6-3^8) \cdot 2^4$, dst.)

### Pola C — kombinasi berat murni sifat eksponen (numerik, tanpa variabel-sebagai-pangkat)
Ini paling dekat dengan gaya level 3 yang sudah ada, jadi paling mudah "naik kelas" ke bank utama kalau suatu saat level 3 mau diperdalam lagi:
- Evaluasi 1.1 no.1: $\frac{2^{-4} \cdot 2^7 \cdot (-2)^{-7} \cdot (-2)^0}{2^3 \cdot 2^{-5}} = \cdots$
- Evaluasi 1.1 no.2: $(16x^5y^3)\left(\frac{1}{2^3}x^{-3}y^{-2}\right) = \cdots$
- Evaluasi 1.1 no.10: $\left(2 - \frac12 - \frac{1}{2^2}\right)^{-2} = \cdots$
- Evaluasi 1.1 no.13: $\left[\left(\frac12\right)^3\right]^{-2} = \cdots$

## Dikeluarkan dari daftar kandidat (bukan topik ini)

- Evaluasi 1.1 no.30–31 (ekspansi $(a+b)^n$, binomial pangkat tinggi) — materi faktorisasi/aljabar, bukan sifat eksponen.
- Latihan 1.1.2 no.6–11 (identitas selisih kuadrat, dst.) — sudah disaring keluar di sesi kurasi bank soal utama dengan alasan sama.

## Langkah lanjut (belum dikerjakan)

- [ ] Verifikasi ulang tiap jawaban akhir (jangan asumsikan kunci di PDF benar — beberapa soal cetak lama rawan typo cetak).
- [ ] Putuskan wadahnya: level 4 di sub-materi yang sama, sub-materi baru ("Sifat Eksponen Lanjutan"?), atau memang khusus bank UH terpisah dari alur formatif/sumatif adaptif.
- [ ] Kalau jadi level baru dalam sub-materi yang sama: cek ulang `AMBANG_NAIK_LEVEL` & aturan headroom K di `soalEngine.js` (lihat CLAUDE.md §4) — level baru butuh kuota naik-level sendiri, bukan otomatis warisan dari Level 3.
- [ ] Tulis `clue` + `pembahasan` bergaya sama dengan bank soal utama (bukan sekadar salin kunci jawaban PDF).
