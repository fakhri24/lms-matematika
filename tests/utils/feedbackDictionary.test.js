import { describe, test, expect } from '@jest/globals';
import { 
  getPesanAcak, 
  feedbackSalahSatu,
  feedbackSalahDua,
  feedbackSalahTiga,
  feedbackPilihBahas,
  feedbackBenarSempurna,
  feedbackBenarBahas
} from '../../public/js/utils/feedbackDictionary.js';

describe('feedbackDictionary', () => {
  test('getPesanAcak returns an element from the array', () => {
    const arr = ['a', 'b', 'c'];
    const result = getPesanAcak(arr);
    expect(arr).toContain(result);
  });

  test('feedback arrays are populated and exported correctly', () => {
    expect(feedbackSalahSatu.length).toBeGreaterThan(0);
    expect(feedbackSalahDua.length).toBeGreaterThan(0);
    expect(feedbackSalahTiga.length).toBeGreaterThan(0);
    expect(feedbackPilihBahas.length).toBeGreaterThan(0);
    expect(feedbackBenarSempurna.length).toBeGreaterThan(0);
    expect(feedbackBenarBahas.length).toBeGreaterThan(0);
  });
});
