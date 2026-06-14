import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { 
  mulaiAtauLanjutStopwatch,
  dapatkanDanResetDurasiTerakhir,
  dapatkanTotalWaktuSekarang
} from '../../public/js/utils/timerSensor.js';

describe('timerSensor', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('dapatkanTotalWaktuSekarang returns accumulated time', () => {
    mulaiAtauLanjutStopwatch();
    
    // Advance time by 5 seconds
    jest.advanceTimersByTime(5000);
    
    const time = dapatkanTotalWaktuSekarang();
    expect(time).toBeGreaterThanOrEqual(5);
  });

  test('dapatkanDanResetDurasiTerakhir returns time and resets', () => {
    mulaiAtauLanjutStopwatch();
    
    jest.advanceTimersByTime(3000);
    
    const durasi = dapatkanDanResetDurasiTerakhir();
    expect(durasi).toBeGreaterThanOrEqual(3);
    
    jest.advanceTimersByTime(2000);
    const timeNow = dapatkanTotalWaktuSekarang();
    expect(timeNow).toBeGreaterThanOrEqual(2);
    expect(timeNow).toBeLessThan(4);
  });
});
