import { describe, it, expect } from 'vitest';
import { getTechFamily } from './tech-family';

describe('getTechFamily', () => {
  it('should group forging tech correctly', () => {
    expect(getTechFamily('Phôi rèn')).toBe('forging');
    expect(getTechFamily('Rèn+Gia công')).toBe('forging');
  });

  it('should group casting tech correctly', () => {
    expect(getTechFamily('Phôi đúc')).toBe('casting');
    expect(getTechFamily('Đúc+Gia công')).toBe('casting');
  });

  it('should group sawing tech correctly', () => {
    expect(getTechFamily('Phôi cưa')).toBe('sawing');
    expect(getTechFamily('Phôi cưa+Gia công')).toBe('sawing');
  });

  it('should group machining tech correctly', () => {
    expect(getTechFamily('Chỉ gia công CNC')).toBe('machining');
  });

  it('should return unspecified for undefined or empty tech', () => {
    expect(getTechFamily(undefined)).toBe('unspecified');
    // @ts-ignore testing invalid edge case
    expect(getTechFamily('')).toBe('unspecified');
    // @ts-ignore testing invalid edge case
    expect(getTechFamily(null)).toBe('unspecified');
  });
});
