// tests/utils/koreksiHelper.test.js

import { jest, describe, test, expect } from '@jest/globals';
import { normalisasiTopik, cariKecocokanSiswa, apakahNamaFileCocok } from '../../public/js/utils/koreksiHelper.js';

describe('koreksiHelper - normalisasiTopik', () => {
  test('harus mengubah huruf besar menjadi kecil dan mengganti spasi/simbol dengan underscore', () => {
    const hasil = normalisasiTopik("UH 3 MTL Kelas X - Sudut Berelasi Trigonometri");
    expect(hasil).toBe("uh_3_mtl_kelas_x_sudut_berelasi_trigonometri");
  });

  test('harus membuang spasi di awal/akhir dan karakter khusus yang tidak diperlukan', () => {
    const hasil = normalisasiTopik("  Trigonometri !!! ");
    expect(hasil).toBe("trigonometri");
  });

  test('harus menangani nilai null atau kosong dengan baik', () => {
    expect(normalisasiTopik(null)).toBe("");
    expect(normalisasiTopik(undefined)).toBe("");
    expect(normalisasiTopik("")).toBe("");
  });
});

describe('koreksiHelper - cariKecocokanSiswa', () => {
  const daftarProfil = [
    { id: "10001", nama_lengkap: "Aisyah Husnara Saniya", kelas: "X.MIPA-1" },
    { id: "10002", nama_lengkap: "Budi Pratama", kelas: "X.MIPA-1" },
    { id: "10003", nama_lengkap: "Fatimah Azzahra", kelas: "X.MIPA-2" }
  ];

  test('harus mencocokkan nama secara persis (case-insensitive & trim)', () => {
    const hasil = cariKecocokanSiswa("  aisyah husnara saniya  ", daftarProfil);
    expect(hasil).not.toBeNull();
    expect(hasil.id).toBe("10001");
  });

  test('harus mencocokkan berdasarkan nama depan jika nama lengkap tidak sama persis', () => {
    const hasil = cariKecocokanSiswa("Aisyah Saniya", daftarProfil);
    expect(hasil).not.toBeNull();
    expect(hasil.id).toBe("10001"); // Cocok karena dimulai dengan "Aisyah"
  });

  test('harus mengembalikan null jika tidak ada nama yang cocok', () => {
    const hasil = cariKecocokanSiswa("Tono Suhartono", daftarProfil);
    expect(hasil).toBeNull();
  });

  test('harus mengembalikan null jika input nama kosong atau daftar profil kosong', () => {
    expect(cariKecocokanSiswa("", daftarProfil)).toBeNull();
    expect(cariKecocokanSiswa("Aisyah", [])).toBeNull();
    expect(cariKecocokanSiswa(null, null)).toBeNull();
  });
});

describe('koreksiHelper - apakahNamaFileCocok', () => {
  test('harus mengembalikan true untuk nama berkas yang sama persis', () => {
    expect(apakahNamaFileCocok("uh3_nara", "uh3_nara")).toBe(true);
  });

  test('harus mengembalikan true jika berkas JSON memiliki prefix tambahan seperti koreksi_ atau evaluasi_', () => {
    expect(apakahNamaFileCocok("koreksi_uh3_nara", "uh3_nara")).toBe(true);
    expect(apakahNamaFileCocok("evaluasi_uh_3_nara", "uh_3_nara")).toBe(true);
  });

  test('harus menangani ekstensi berkas yang terbawa dalam perbandingan', () => {
    expect(apakahNamaFileCocok("koreksi_uh3_nara.json", "uh3_nara.pdf")).toBe(true);
  });

  test('harus mengembalikan false untuk berkas siswa yang berbeda meskipun namanya mirip', () => {
    expect(apakahNamaFileCocok("koreksi_uh3_anara", "uh3_nara")).toBe(false);
    expect(apakahNamaFileCocok("koreksi_uh3_nara", "uh3_anara")).toBe(false);
  });

  test('harus menangani huruf besar-kecil dan simbol dengan toleran', () => {
    expect(apakahNamaFileCocok("Koreksi-UH3_NARA.json", "uh3_nara.pdf")).toBe(true);
  });

  test('harus mengembalikan false jika salah satu input kosong atau null', () => {
    expect(apakahNamaFileCocok(null, "uh3_nara")).toBe(false);
    expect(apakahNamaFileCocok("koreksi_uh3", null)).toBe(false);
  });
});
