/* ============================================================
   ManualDrawings.js — Black and white line drawings for the manual
   Every drawing is SVG built here, with no colour and no rendered
   images. The mazes and the Venn diagram are drawn from the game's
   own data, so they can't disagree with it.
   ============================================================ */

import { VENN } from '../game/rules/ComplicatedWiresRules.js';
import { findCircles, GRID_SIZE, hasWall } from '../game/rules/MazeRules.js';

const svg = (width, height, body, label) => (
  `<svg class="drawing" viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}">${body}</svg>`
);

const line = (x1, y1, x2, y2, extra = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${extra}/>`;
const box = (x, y, w, h, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" ${extra}/>`;
const circle = (x, y, r, extra = '') => `<circle cx="${x}" cy="${y}" r="${r}" ${extra}/>`;
const poly = (points, extra = '') => `<polygon points="${points}" ${extra}/>`;
const text = (x, y, words, size = 9) => `<text x="${x}" y="${y}" font-size="${size}" text-anchor="middle" stroke="none" fill="#000">${words}</text>`;
const FILLED = 'fill="#000"';

// A module's outline with its status light, as seen from the front
const moduleFace = (body, label) => svg(120, 120, `${box(2, 2, 116, 116)}${circle(105, 14, 6)}${body}`, label);

// A needy module's outline: striped panels and a small timer instead of a status light
const needyFace = (body, label) => {
  const stripes = x => [0, 12, 24].map(step => line(x + step, 18, x + step + 8, 8)).join('');
  return svg(120, 120, `${box(2, 2, 116, 116)}${box(8, 7, 36, 12)}${box(76, 7, 36, 12)}${stripes(11)}${stripes(79)}${box(47, 5, 26, 15, FILLED)}${text(60, 16, '00', 11).replace('fill="#000"', 'fill="#fff"')}${body}`, label);
};

export const MODULE_DRAWINGS = {
  wires: moduleFace(
    `${box(12, 20, 8, 90)}${box(100, 28, 8, 82)}${[34, 48, 62, 76, 90, 104].map((y, i) => `<path d="M20 ${y} q 20 -7 40 0 t 40 ${i - 2}"/>`).join('')}`,
    'Wires module',
  ),
  button: moduleFace(
    `${circle(50, 62, 34)}${text(50, 66, 'PRESS', 11)}${box(94, 36, 12, 56)}`,
    'The Button module',
  ),
  keypads: moduleFace(
    [[28, 30], [62, 30], [28, 66], [62, 66]].map(([x, y]) => `${box(x, y, 30, 32)}${box(x + 9, y + 5, 12, 3, FILLED)}`).join(''),
    'Keypads module',
  ),
  simon: moduleFace(
    `${poly('56,20 96,62 56,104 16,62')}${line(36, 41, 76, 83)}${line(76, 41, 36, 83)}`,
    'Simon Says module',
  ),
  whosOnFirst: moduleFace(
    `${box(14, 14, 76, 20, FILLED)}${[0, 1, 2].flatMap(row => [0, 1].map(col => box(14 + col * 40, 44 + row * 24, 36, 18))).join('')}${[0, 1, 2].map(i => box(102, 48 + i * 22, 10, 16)).join('')}`,
    'Who\'s on First module',
  ),
  memory: moduleFace(
    `${box(16, 16, 72, 42, FILLED)}${[0, 1, 2, 3].map(i => box(14 + i * 19, 68, 17, 38)).join('')}${[0, 1, 2, 3, 4].map(i => box(102, 30 + i * 15, 10, 12)).join('')}`,
    'Memory module',
  ),
  morse: moduleFace(
    `${box(38, 12, 32, 14)}${line(10, 19, 38, 19)}${line(70, 19, 98, 19)}${box(12, 36, 96, 16)}${[0, 1, 2, 3, 4, 5, 6, 7].map(i => line(20 + i * 11, 40, 20 + i * 11, 48)).join('')}${box(30, 60, 60, 20, FILLED)}${poly('12,70 24,62 24,78', FILLED)}${poly('108,70 96,62 96,78', FILLED)}${box(42, 90, 36, 18)}${text(60, 103, 'TX', 10)}`,
    'Morse Code module',
  ),
  complicatedWires: moduleFace(
    `${box(10, 14, 84, 14)}${[0, 1, 2, 3, 4, 5].map(i => circle(18 + i * 14, 21, 4)).join('')}${[0, 1, 2, 3, 4, 5].map(i => `<path d="M${18 + i * 14} 28 q 5 25 0 50 t ${i * 2 - 5} 12"/>`).join('')}${box(10, 90, 100, 8, FILLED)}${[0, 1, 2, 3, 4, 5].map(i => box(10 + i * 17, 100, 15, 13)).join('')}`,
    'Complicated Wires module',
  ),
  wireSequences: moduleFace(
    `${box(26, 8, 44, 14)}${poly('48,11 42,19 54,19', FILLED)}${box(26, 100, 44, 14)}${poly('48,111 42,103 54,103', FILLED)}${box(14, 28, 68, 66)}${[0, 1, 2].map(i => `${box(24, 36 + i * 19, 8, 12)}${box(64, 36 + i * 19, 8, 12)}`).join('')}${line(32, 42, 64, 80)}${line(32, 61, 64, 42)}${[0, 1, 2, 3].map(i => box(96, 42 + i * 16, 12, 13)).join('')}`,
    'Wire Sequences module',
  ),
  mazes: moduleFace(
    `${box(26, 24, 70, 70, FILLED)}${[0, 1, 2, 3, 4, 5].flatMap(row => [0, 1, 2, 3, 4, 5].map(col => box(31 + col * 10.5, 29 + row * 10.5, 5, 5, 'fill="#fff" stroke="none"'))).join('')}${poly('60,8 52,18 68,18', FILLED)}${poly('60,112 52,102 68,102', FILLED)}${poly('10,59 20,51 20,67', FILLED)}${poly('110,59 100,51 100,67', FILLED)}`,
    'Mazes module',
  ),
  passwords: moduleFace(
    `${[0, 1, 2, 3, 4].map(i => `${poly(`${22 + i * 19},28 ${16 + i * 19},36 ${28 + i * 19},36`, FILLED)}${poly(`${22 + i * 19},90 ${16 + i * 19},82 ${28 + i * 19},82`, FILLED)}${box(13 + i * 19, 42, 18, 34)}${text(22 + i * 19, 64, 'A', 13)}`).join('')}${box(40, 98, 40, 13)}${text(60, 108, 'SUBMIT', 8)}`,
    'Passwords module',
  ),
  ventingGas: needyFace(
    `${box(12, 28, 96, 84)}${box(24, 36, 72, 44, FILLED)}${box(42, 90, 16, 14)}${text(50, 101, 'Y', 10)}${box(62, 90, 16, 14)}${text(70, 101, 'N', 10)}`,
    'Venting Gas needy module',
  ),
  capacitor: needyFace(
    `${box(12, 36, 14, 72)}${[0, 1, 2, 3, 4, 5].map(i => line(14, 44 + i * 11, 22, 44 + i * 11)).join('')}<ellipse cx="80" cy="74" rx="26" ry="34"/>${line(80, 44, 80, 104, 'stroke-width="4"')}${box(62, 28, 36, 10, FILLED)}${circle(46, 92, 9, FILLED)}<path d="M34 28 v22 h20 M40 28 v14 h20"/>`,
    'Capacitor Discharge needy module',
  ),
  knob: needyFace(
    `${circle(60, 54, 26)}${circle(60, 54, 11)}${poly('60,40 55,52 65,52', FILLED)}${text(60, 37, 'UP', 7)}${[[10, 76], [20, 84], [30, 92], [90, 92], [100, 84], [110, 76]].map(([x, y]) => `${circle(x, y, 4)}${circle(x, y + 13, 4)}`).join('')}`,
    'Knob needy module',
  ),
};

/* ----------------------------------------------------------
   MAZES — Drawn from the game's maze data
---------------------------------------------------------- */
const CELL = 26;

/**
 * @param {string[]} maze - from MAZES
 * @param {number} number - shown beside the maze
 */
export function drawMaze(maze, number) {
  const size = CELL * GRID_SIZE;
  const parts = [box(0, 0, size, size, 'stroke-width="4"')];
  const centre = i => CELL * i + CELL / 2;

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      parts.push(circle(centre(x), centre(y), 2, FILLED));
      if (x < GRID_SIZE - 1 && hasWall(maze, { x, y }, 'right')) {
        parts.push(line(CELL * (x + 1), CELL * y, CELL * (x + 1), CELL * (y + 1), 'stroke-width="2.5"'));
      }
      if (y < GRID_SIZE - 1 && hasWall(maze, { x, y }, 'down')) {
        parts.push(line(CELL * x, CELL * (y + 1), CELL * (x + 1), CELL * (y + 1), 'stroke-width="2.5"'));
      }
    }
  }
  findCircles(maze).forEach(({ x, y }) => parts.push(circle(centre(x), centre(y), 8, 'stroke-width="1.5"')));

  return svg(size, size, parts.join(''), `Maze ${number}`);
}

/* ----------------------------------------------------------
   VENN DIAGRAM — Each letter is placed by finding its region
   among the ellipses, so it can't land in the wrong overlap
---------------------------------------------------------- */
const VENN_WIDTH = 640;
const VENN_HEIGHT = 470;
const VENN_STEP = 4;

export const VENN_ELLIPSES = {
  R: { cx: 291, cy: 200, rx: 238, ry: 111, angle: 29, dash: '14 5 3 5', width: 2.5 },
  B: { cx: 332, cy: 191, rx: 228, ry: 119, angle: -33, dash: '', width: 3.5 },
  S: { cx: 243, cy: 264, rx: 220, ry: 104, angle: 37, dash: '2 5', width: 2.5 },
  L: { cx: 387, cy: 236, rx: 224, ry: 104, angle: -34, dash: '9 4', width: 6 },
};

// A wire with none of the four features goes outside every ellipse, in clear space
export const VENN_OUTSIDE = { x: 44, y: 44, room: 40 };

// Measures how far inside an ellipse a point is: below 1 means inside
function ellipseValue({ cx, cy, rx, ry, angle }, x, y) {
  const radians = angle * Math.PI / 180;
  const dx = x - cx;
  const dy = y - cy;
  const along = dx * Math.cos(radians) + dy * Math.sin(radians);
  const across = dy * Math.cos(radians) - dx * Math.sin(radians);
  return Math.sqrt((along / rx) ** 2 + (across / ry) ** 2);
}

/**
 * Which of the ellipses hold a point, as a VENN key
 */
export function vennKeyAt(x, y) {
  return Object.keys(VENN_ELLIPSES)
    .filter(key => ellipseValue(VENN_ELLIPSES[key], x, y) < 1)
    .join('');
}

/**
 * Find the roomiest point of every region, for its letter
 * @returns {Object} VENN key to {x, y}
 */
export function findVennRegions() {
  const best = {};

  for (let x = VENN_STEP; x < VENN_WIDTH; x += VENN_STEP) {
    for (let y = VENN_STEP; y < VENN_HEIGHT; y += VENN_STEP) {
      const key = vennKeyAt(x, y);
      const room = Math.min(...Object.values(VENN_ELLIPSES).map((e) => Math.abs(ellipseValue(e, x, y) - 1) * e.ry));
      if (room > (best[key]?.room ?? 0)) best[key] = { x, y, room };
    }
  }
  return best;
}

export function drawVenn() {
  const ellipses = Object.values(VENN_ELLIPSES).map(({ cx, cy, rx, ry, angle, dash, width }) => (
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${angle} ${cx} ${cy})" stroke-width="${width}" stroke-dasharray="${dash}"/>`
  )).join('');

  const regions = { ...findVennRegions(), '': VENN_OUTSIDE };
  const letters = Object.entries(VENN).map(([key, letter]) => {
    const { x, y, room } = regions[key];
    return text(x, y + 7, letter, room > 26 ? 24 : 15);
  }).join('');

  return svg(VENN_WIDTH, VENN_HEIGHT, ellipses + letters, 'Venn diagram of the wire rules');
}

export const vennKey = (dash, width) => svg(70, 14, line(2, 7, 68, 7, `stroke-dasharray="${dash}" stroke-width="${width}"`), 'Line style');

/* ----------------------------------------------------------
   APPENDICES — Batteries and ports
---------------------------------------------------------- */
export const BATTERY_DRAWINGS = {
  AA: svg(50, 100, `${box(19, 4, 12, 7)}<rect x="10" y="11" width="30" height="85" rx="6"/>${line(10, 28, 40, 28)}`, 'AA battery'),
  D: svg(90, 100, `${box(36, 12, 18, 7)}<rect x="8" y="19" width="74" height="70" rx="12"/>${line(8, 34, 82, 34)}`, 'D battery'),
};

const pins = (columns, rows, x, y, gapX, gapY, size) => Array.from({ length: rows }, (_, row) => (
  Array.from({ length: columns }, (_, col) => box(x + col * gapX, y + row * gapY, size, size)).join('')
)).join('');

const dShell = 'M26 8 H154 L146 52 H34 Z';

export const PORT_DRAWINGS = {
  'DVI-D': svg(180, 60, `<path d="${dShell}"/>${circle(14, 30, 7)}${circle(166, 30, 7)}${pins(8, 3, 42, 16, 8, 9, 5)}${line(120, 30, 136, 30, 'stroke-width="3"')}`, 'DVI-D port'),
  Parallel: svg(220, 60, `<path d="M28 8 H192 L184 52 H36 Z"/>${circle(14, 30, 7)}${circle(206, 30, 7)}${Array.from({ length: 13 }, (_, i) => circle(40 + i * 11.7, 22, 4)).join('')}${Array.from({ length: 12 }, (_, i) => circle(46 + i * 11.7, 38, 4)).join('')}`, 'Parallel port'),
  'PS/2': svg(70, 70, `${circle(35, 35, 31, 'stroke-width="3"')}${circle(35, 35, 24)}${[[23, 25], [47, 25], [18, 38], [52, 38], [26, 49], [44, 49]].map(([x, y]) => circle(x, y, 3, FILLED)).join('')}${box(30, 26, 10, 9, FILLED)}`, 'PS/2 port'),
  'RJ-45': svg(70, 70, `${box(6, 6, 58, 54, 'stroke-width="3"')}${box(13, 13, 44, 40, FILLED)}${box(27, 41, 16, 12, 'fill="#fff"')}${line(6, 64, 64, 64, 'stroke-width="3"')}`, 'RJ-45 port'),
  Serial: svg(140, 60, `<path d="M26 8 H114 L106 52 H34 Z"/>${circle(14, 30, 7)}${circle(126, 30, 7)}${pins(5, 1, 38, 15, 13, 0, 10)}${pins(4, 1, 45, 32, 13, 0, 10)}`, 'Serial port'),
  'Stereo RCA': svg(50, 96, [24, 72].map(y => `${circle(25, y, 20)}${circle(25, y, 14, 'stroke-width="3"')}${circle(25, y, 7, FILLED)}`).join(''), 'Stereo RCA port'),
};

/* ----------------------------------------------------------
   SMALL PIECES
---------------------------------------------------------- */

/**
 * The six Who's on First buttons with one marked
 * @param {number} position - 0 to 5, left to right, top to bottom
 */
export function drawButtonGrid(position) {
  const cells = Array.from({ length: 6 }, (_, i) => (
    box(1 + (i % 2) * 28, 1 + Math.floor(i / 2) * 18, 28, 18, i === position ? FILLED : '')
  )).join('');
  return svg(58, 56, cells, `Button ${position + 1} of 6, counted left to right, top to bottom`);
}
