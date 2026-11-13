/* ============================================================
   SevenSegment.test.js — The timer's digits and their segments
   ============================================================ */

import { describe, it, expect } from 'vitest';
import { segmentsFor, timerCells } from '../src/js/three/SevenSegment.js';

describe('Seven-segment digits', () => {
  it('lights the right segments for each digit', () => {
    expect(segmentsFor('1')).toBe('bc');
    expect(segmentsFor('8')).toBe('abcdefg');
    expect(segmentsFor('0')).not.toContain('g');
    expect(segmentsFor('x')).toBe('');
  });

  it('shows minutes and seconds as four digits with a colon', () => {
    expect(timerCells('5:00')).toEqual({ left: '05', right: '00', separator: ':' });
    expect(timerCells('10:30')).toEqual({ left: '10', right: '30', separator: ':' });
  });

  it('shows seconds and hundredths with a dot in the last minute', () => {
    expect(timerCells('9.84')).toEqual({ left: '09', right: '84', separator: '.' });
  });
});
