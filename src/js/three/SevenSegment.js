/* ============================================================
   SevenSegment.js — Digits drawn as lit and unlit segments
   For the timer's red display: every segment is drawn, lit or
   dark, like a real seven-segment display. Also draws the
   strike display's X marks.
   ============================================================ */

// Which segments each digit lights: a top, b top right, c bottom right,
// d bottom, e bottom left, f top left, g middle
const DIGITS = {
  0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc',
  5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg',
};

/**
 * Which segments a character lights (an unknown character lights none)
 */
export function segmentsFor(char) {
  return DIGITS[char] ?? '';
}

/**
 * The timer's text as four digits with a separator, like 05:00 or 59.84
 */
export function timerCells(timeString) {
  const separator = timeString.includes('.') ? '.' : ':';
  const [left = '', right = ''] = timeString.split(separator);
  return { left: left.padStart(2, '0').slice(-2), right: right.padEnd(2, '0').slice(0, 2), separator };
}

// One segment: a long hexagon between two points
function bar(ctx, x1, y1, x2, y2, thick) {
  const horizontal = y1 === y2;
  const t = thick / 2;
  ctx.beginPath();
  if (horizontal) {
    ctx.moveTo(x1, y1); ctx.lineTo(x1 + t, y1 - t); ctx.lineTo(x2 - t, y2 - t);
    ctx.lineTo(x2, y2); ctx.lineTo(x2 - t, y2 + t); ctx.lineTo(x1 + t, y1 + t);
  } else {
    ctx.moveTo(x1, y1); ctx.lineTo(x1 + t, y1 + t); ctx.lineTo(x2 + t, y2 - t);
    ctx.lineTo(x2, y2); ctx.lineTo(x2 - t, y2 - t); ctx.lineTo(x1 - t, y1 + t);
  }
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw one digit in a box, every segment either lit or dark
 */
export function drawDigit(ctx, char, x, y, w, h, lit, unlit) {
  const thick = w * 0.2;
  const gap = thick * 0.18;
  const left = x + thick / 2, right = x + w - thick / 2;
  const top = y + thick / 2, mid = y + h / 2, bottom = y + h - thick / 2;
  const segments = {
    a: [left + gap, top, right - gap, top],
    g: [left + gap, mid, right - gap, mid],
    d: [left + gap, bottom, right - gap, bottom],
    f: [left, top + gap, left, mid - gap],
    b: [right, top + gap, right, mid - gap],
    e: [left, mid + gap, left, bottom - gap],
    c: [right, mid + gap, right, bottom - gap],
  };
  const on = segmentsFor(char);
  for (const [name, [x1, y1, x2, y2]] of Object.entries(segments)) {
    ctx.fillStyle = on.includes(name) ? lit : unlit;
    bar(ctx, x1, y1, x2, y2, thick);
  }
}

/**
 * An X made of two slanted bars, lit or dark, for the strike display
 */
export function drawStrike(ctx, x, y, w, h, isLit, lit, unlit) {
  ctx.strokeStyle = isLit ? lit : unlit;
  ctx.lineWidth = w * 0.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(x + w, y + h);
  ctx.moveTo(x + w, y); ctx.lineTo(x, y + h);
  ctx.stroke();
  ctx.lineCap = 'butt';
}
