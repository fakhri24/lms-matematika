import { describe, test, expect } from '@jest/globals';
import {
  acakArray,
  siapkanDraftSoal,
  kelompokkanSoalPerLevel,
  pilihSoalFormatifBerikutnya,
  perbaruiLevelAdaptif,
  acakOpsiSoal,
} from '../../public/js/utils/soalEngine.js';
import { MODE_LATIHAN } from '../../public/js/utils/constants.js';

describe('soalEngine', () => {
  test('acakArray should return array with same elements but shuffled', () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = acakArray(arr);

    expect(shuffled).toHaveLength(arr.length);
    expect(shuffled).toEqual(expect.arrayContaining(arr));
    // It's technically possible but very unlikely to match original order for large arrays,
    // but for unit test we just check it contains all elements.
  });

  describe('acakOpsiSoal', () => {
    test('mengacak urutan opsi tanpa mengubah jawaban_benar', () => {
      const soal = {
        id: 1,
        opsi: ['A', 'B', 'C', 'D', 'E'],
        jawaban_benar: 'C',
      };
      const hasil = acakOpsiSoal(soal);

      expect(hasil.opsi).toHaveLength(5);
      expect(hasil.opsi).toEqual(expect.arrayContaining(soal.opsi));
      expect(hasil.jawaban_benar).toBe('C');
      expect(hasil.opsi).toContain(hasil.jawaban_benar);
    });

    test('tidak memodifikasi array opsi asli (murni)', () => {
      const opsiAsli = ['A', 'B', 'C'];
      const soal = { opsi: opsiAsli, jawaban_benar: 'A' };
      acakOpsiSoal(soal);
      expect(soal.opsi).toBe(opsiAsli);
      expect(soal.opsi).toEqual(['A', 'B', 'C']);
    });

    test('field lain di luar opsi tetap utuh', () => {
      const soal = {
        id_unik_sistem: 'xyz',
        pertanyaan: 'Contoh?',
        opsi: ['A', 'B'],
        jawaban_benar: 'A',
      };
      const hasil = acakOpsiSoal(soal);
      expect(hasil.id_unik_sistem).toBe('xyz');
      expect(hasil.pertanyaan).toBe('Contoh?');
    });

    test('soal tanpa field opsi (bukan array) dikembalikan apa adanya', () => {
      const soal = { id: 1, jawaban_benar: 'A' };
      expect(acakOpsiSoal(soal)).toBe(soal);
    });
  });

  describe('kelompokkanSoalPerLevel', () => {
    test('mengelompokkan soal ke level 1/2/3 sesuai tingkat_kesulitan', () => {
      const soal = [
        { id: 1, tingkat_kesulitan: 3 },
        { id: 2, tingkat_kesulitan: 1 },
        { id: 3, tingkat_kesulitan: 2 },
        { id: 4, tingkat_kesulitan: 1 },
      ];
      const hasil = kelompokkanSoalPerLevel(soal);
      expect(hasil[1].map((s) => s.id)).toEqual([2, 4]);
      expect(hasil[2].map((s) => s.id)).toEqual([3]);
      expect(hasil[3].map((s) => s.id)).toEqual([1]);
    });

    test('soal tanpa tingkat_kesulitan valid dianggap level 1', () => {
      const soal = [{ id: 1 }, { id: 2, tingkat_kesulitan: 9 }];
      const hasil = kelompokkanSoalPerLevel(soal);
      expect(hasil[1].map((s) => s.id)).toEqual([1, 2]);
    });
  });

  describe('pilihSoalFormatifBerikutnya', () => {
    const soalPerLevel = {
      1: [{ id_unik_sistem: 'a', tingkat_kesulitan: 1 }],
      2: [
        { id_unik_sistem: 'b', tingkat_kesulitan: 2 },
        { id_unik_sistem: 'c', tingkat_kesulitan: 2 },
      ],
      3: [{ id_unik_sistem: 'd', tingkat_kesulitan: 3 }],
    };

    test('memilih soal dari level yang diminta', () => {
      const hasil = pilihSoalFormatifBerikutnya(soalPerLevel, 2, []);
      expect(['b', 'c']).toContain(hasil.id_unik_sistem);
    });

    test('mengecualikan soal yang sudah pernah benar', () => {
      const hasil = pilihSoalFormatifBerikutnya(soalPerLevel, 2, ['b']);
      expect(hasil.id_unik_sistem).toBe('c');
    });

    test('mengulang soal yang sudah benar kalau level itu habis (bukan pindah level)', () => {
      const hasil = pilihSoalFormatifBerikutnya(soalPerLevel, 1, ['a']);
      expect(hasil.id_unik_sistem).toBe('a');
    });

    test('fallback ke gabungan semua level kalau level yang diminta kosong sama sekali', () => {
      const hasil = pilihSoalFormatifBerikutnya(soalPerLevel, 2, []);
      // level 2 tidak kosong di fixture ini; uji level kosong pakai fixture terpisah
      expect(hasil).not.toBeNull();

      const perLevelTimpang = { 1: [{ id_unik_sistem: 'x', tingkat_kesulitan: 1 }], 2: [], 3: [] };
      const hasilFallback = pilihSoalFormatifBerikutnya(perLevelTimpang, 2, []);
      expect(hasilFallback.id_unik_sistem).toBe('x');
    });

    test('mengembalikan null kalau seluruh bank soal kosong', () => {
      const hasil = pilihSoalFormatifBerikutnya({ 1: [], 2: [], 3: [] }, 1, []);
      expect(hasil).toBeNull();
    });
  });

  describe('perbaruiLevelAdaptif', () => {
    const stateAwal = () => ({
      levelSaatIni: 1,
      levelTertinggiDicapai: 1,
      jumlahBenarMandiri: 0,
      totalSalahDiLevelIni: 0,
    });

    test('benar mandiri 1-3x di Level 1 belum menaikkan level (ambang 4)', () => {
      let state = stateAwal();
      state = perbaruiLevelAdaptif(state, true, true);
      state = perbaruiLevelAdaptif(state, true, true);
      state = perbaruiLevelAdaptif(state, true, true);
      expect(state.levelSaatIni).toBe(1);
      expect(state.jumlahBenarMandiri).toBe(3);
      expect(state.tuntas).toBe(false);
    });

    test('benar mandiri 4x kumulatif di Level 1 menaikkan level dan reset kedua counter', () => {
      let state = stateAwal();
      for (let i = 0; i < 4; i++) state = perbaruiLevelAdaptif(state, true, true);
      expect(state.levelSaatIni).toBe(2);
      expect(state.levelTertinggiDicapai).toBe(2);
      expect(state.jumlahBenarMandiri).toBe(0);
      expect(state.totalSalahDiLevelIni).toBe(0);
    });

    test('benar mandiri 4x TIDAK harus berturut-turut, boleh diselingi 1x salah', () => {
      let state = stateAwal();
      state = perbaruiLevelAdaptif(state, true, true); // mandiri 1
      state = perbaruiLevelAdaptif(state, false); // salah 1 (di bawah ambang turun)
      state = perbaruiLevelAdaptif(state, true, true); // mandiri 2
      state = perbaruiLevelAdaptif(state, true, true); // mandiri 3
      state = perbaruiLevelAdaptif(state, true, true); // mandiri 4 -> naik
      expect(state.levelSaatIni).toBe(2);
    });

    test('benar TAPI tidak mandiri (pakai clue/pembahasan) bersifat netral, tidak menambah hitungan', () => {
      let state = stateAwal();
      state = perbaruiLevelAdaptif(state, true, true); // mandiri 1
      state = perbaruiLevelAdaptif(state, true, false); // benar tapi tidak mandiri -> netral
      expect(state.levelSaatIni).toBe(1);
      expect(state.jumlahBenarMandiri).toBe(1);
    });

    test('Level 2 juga butuh 4 benar mandiri untuk naik', () => {
      let state = { levelSaatIni: 2, levelTertinggiDicapai: 2, jumlahBenarMandiri: 0, totalSalahDiLevelIni: 0 };
      for (let i = 0; i < 3; i++) state = perbaruiLevelAdaptif(state, true, true);
      expect(state.levelSaatIni).toBe(2);
      state = perbaruiLevelAdaptif(state, true, true);
      expect(state.levelSaatIni).toBe(3);
    });

    test('Level 3 cuma butuh 2 benar mandiri untuk tuntas (ambang lebih rendah)', () => {
      let state = { levelSaatIni: 3, levelTertinggiDicapai: 3, jumlahBenarMandiri: 0, totalSalahDiLevelIni: 0 };
      state = perbaruiLevelAdaptif(state, true, true);
      expect(state.tuntas).toBe(false);
      state = perbaruiLevelAdaptif(state, true, true);
      expect(state.levelSaatIni).toBe(3);
      expect(state.tuntas).toBe(true);
    });

    test('salah 1x tidak menurunkan level dan TIDAK mereset jumlah benar mandiri', () => {
      let state = { levelSaatIni: 2, levelTertinggiDicapai: 2, jumlahBenarMandiri: 2, totalSalahDiLevelIni: 0 };
      state = perbaruiLevelAdaptif(state, false);
      expect(state.levelSaatIni).toBe(2);
      expect(state.jumlahBenarMandiri).toBe(2);
      expect(state.totalSalahDiLevelIni).toBe(1);
    });

    test('salah 2x kumulatif (tidak harus berturut-turut) menurunkan level dan reset kedua counter', () => {
      let state = { levelSaatIni: 2, levelTertinggiDicapai: 2, jumlahBenarMandiri: 2, totalSalahDiLevelIni: 0 };
      state = perbaruiLevelAdaptif(state, false); // salah 1
      state = perbaruiLevelAdaptif(state, true, true); // benar mandiri di antaranya, tidak reset total salah
      state = perbaruiLevelAdaptif(state, false); // salah 2 -> turun
      expect(state.levelSaatIni).toBe(1);
      expect(state.jumlahBenarMandiri).toBe(0);
      expect(state.totalSalahDiLevelIni).toBe(0);
    });

    test('level mentok di 1, tidak turun lagi', () => {
      let state = { levelSaatIni: 1, levelTertinggiDicapai: 1, jumlahBenarMandiri: 0, totalSalahDiLevelIni: 1 };
      state = perbaruiLevelAdaptif(state, false);
      expect(state.levelSaatIni).toBe(1);
      expect(state.totalSalahDiLevelIni).toBe(0);
    });

    test('levelTertinggiDicapai tidak pernah turun walau level saat ini turun', () => {
      let state = { levelSaatIni: 3, levelTertinggiDicapai: 3, jumlahBenarMandiri: 0, totalSalahDiLevelIni: 1 };
      state = perbaruiLevelAdaptif(state, false);
      expect(state.levelSaatIni).toBe(2);
      expect(state.levelTertinggiDicapai).toBe(3);
    });

    test('tidak memodifikasi objek state input (murni)', () => {
      const state = stateAwal();
      const salinan = { ...state };
      perbaruiLevelAdaptif(state, true, true);
      expect(state).toEqual(salinan);
    });
  });

  test('siapkanDraftSoal NORMAL should return max 10, sorted by difficulty (4-4-2 ratio if possible)', () => {
    // create 20 mock questions
    const mockSoal = Array.from({length: 20}, (_, i) => ({
      id: i,
      tingkat_kesulitan: i % 3 + 1 // will have 1s, 2s, 3s
    }));
    
    const draft = siapkanDraftSoal(mockSoal, MODE_LATIHAN.NORMAL);
    expect(draft.length).toBeLessThanOrEqual(10);
    
    // Should be sorted
    for(let i = 0; i < draft.length - 1; i++) {
      expect(draft[i].tingkat_kesulitan).toBeLessThanOrEqual(draft[i+1].tingkat_kesulitan);
    }
  });

  test('siapkanDraftSoal ACAK should return max 10, unsorted', () => {
    const mockSoal = Array.from({length: 20}, (_, i) => ({
      id: i,
      tingkat_kesulitan: i % 3 + 1
    }));
    
    const draft = siapkanDraftSoal(mockSoal, MODE_LATIHAN.ACAK);
    expect(draft.length).toBeLessThanOrEqual(10);
    // Not explicitly asserting unsorted because it could randomly be sorted,
    // just ensuring it runs without error and returns right length.
  });
});
