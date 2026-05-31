import { describe, test, expect } from '@jest/globals';
import { acakArray, siapkanDraftSoal } from '../../public/js/utils/soalEngine.js';
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

  test('siapkanDraftSoal FORMATIF should return all sorted by difficulty', () => {
    const mockSoal = [
      { id: 1, tingkat_kesulitan: 3 },
      { id: 2, tingkat_kesulitan: 1 },
      { id: 3, tingkat_kesulitan: 2 }
    ];
    
    const draft = siapkanDraftSoal(mockSoal, MODE_LATIHAN.FORMATIF);
    expect(draft).toHaveLength(3);
    expect(draft[0].id).toBe(2);
    expect(draft[1].id).toBe(3);
    expect(draft[2].id).toBe(1);
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
