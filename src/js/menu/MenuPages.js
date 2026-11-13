/* ============================================================
   MenuPages.js — What the binder and folder pages say
   Each page is drawn on a canvas and returns the regions that
   can be clicked, in canvas pixels. No 3D code here, so the
   wording and the layout can be tested on their own.
   ============================================================ */

import { DIFFICULTY } from '../utils/constants.js';
import { formatTime, displayTime } from '../utils/helpers.js';
import { estimatedDifficulty } from '../game/rules/FreePlayRules.js';

export const TYPE_FONT = '"Special Elite", "Courier New", monospace';
const SANS_FONT = 'Arial, Helvetica, sans-serif';
const INK = '#1d1d1f';
const FADED_INK = '#8b8a85';
const PAPER = '#ecebe4';
const TAN = '#c8a66a';
const BLUE = '#2c4a86';
const HOVER = '#f2d530';   // The yellow bar behind a hovered menu line
const STAMP_RED = '#c8262b';
const STAMP_GREEN = '#2f8a3c';

// The levels in the binder, in order, with our own short brief for each
export const LEVELS = [
  { id: 'easy', number: '1.1', brief: 'A small bomb to learn the job on. Take your time and talk it through.' },
  { id: 'medium', number: '1.2', brief: 'More modules and a needy one that keeps asking for attention.' },
  { id: 'hard', number: '1.3', brief: 'Less time, and the second strike sets it off. Keep your answers short.' },
  { id: 'expert', number: '1.4', brief: 'Every module, two needy ones, and no room for a single mistake.' },
];

/**
 * When the bomb goes off, in plain words
 */
export function explodesOn(maxStrikes) {
  return maxStrikes === 1 ? 'the first strike' : `strike ${maxStrikes}`;
}

/**
 * The facts printed on a level's page
 */
export function levelFacts(id) {
  const config = DIFFICULTY[id];
  return [
    ['Modules', String(config.modules - config.needy)],
    ['Needy modules', config.needy ? String(config.needy) : 'None'],
    ['Time', formatTime(config.time)],
    ['Explodes on', explodesOn(config.maxStrikes)],
  ];
}

/* ----------------------------------------------------------
   Shared drawing helpers
---------------------------------------------------------- */

function paper(ctx, w, h, colour = PAPER) {
  ctx.fillStyle = colour;
  ctx.fillRect(0, 0, w, h);
  // A few faint specks so the sheet doesn't look printed by a screen
  ctx.fillStyle = 'rgba(60, 50, 30, 0.05)';
  for (let i = 0; i < 160; i++) {
    const x = (Math.sin(i * 12.9898) * 43758.5453 % 1 + 1) % 1;
    const y = (Math.sin(i * 78.233) * 12345.6789 % 1 + 1) % 1;
    ctx.fillRect(x * w, y * h, 2, 2);
  }
}

function text(ctx, value, x, y, size, { font = TYPE_FONT, colour = INK, align = 'left', weight = '' } = {}) {
  ctx.font = `${weight} ${size}px ${font}`.trim();
  ctx.fillStyle = colour;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(value, x, y);
  return ctx.measureText(value).width;
}

// Wraps a paragraph to a width, returning the y after its last line
function paragraph(ctx, value, x, y, width, size, lineHeight, options = {}) {
  ctx.font = `${size}px ${options.font ?? TYPE_FONT}`;
  let line = '';
  for (const word of value.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) {
      text(ctx, line, x, y, size, options);
      line = word;
      y += lineHeight;
    } else {
      line = next;
    }
  }
  if (line) text(ctx, line, x, y, size, options);
  return y + lineHeight;
}

function fileMarks(ctx, w, h) {
  text(ctx, 'TRAINING FILE: for the bomb squad only', 50, 46, 17, { font: SANS_FONT, weight: 'bold' });
  text(ctx, 'KEEP IN THE BINDER', w - 50, 46, 17, { font: SANS_FONT, weight: 'bold', align: 'right' });
  ctx.fillStyle = INK;
  ctx.fillRect(50, 54, w - 100, 2);
  text(ctx, 'TALK TO DEFUSE', 50, h - 58, 15, { font: SANS_FONT, weight: 'bold' });
  text(ctx, 'Return this file to the desk after every exercise.', 50, h - 38, 14, { font: SANS_FONT });
}

// A stamped button with a dark box, like a rubber stamp label
function stampButton(ctx, label, cx, cy, hovered) {
  ctx.font = `bold 44px ${SANS_FONT}`;
  const width = ctx.measureText(label).width + 90;
  const box = { x: cx - width / 2, y: cy - 44, w: width, h: 70 };
  ctx.fillStyle = hovered ? '#3a3a3e' : INK;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.letterSpacing = '8px';
  text(ctx, label, cx + 4, cy + 8, 44, { font: SANS_FONT, weight: 'bold', colour: PAPER, align: 'center' });
  ctx.letterSpacing = '0px';
  return box;
}

/* ----------------------------------------------------------
   Binder pages
---------------------------------------------------------- */

/**
 * The binder's cover: BOMBS and a bomb
 */
export function drawBinderCover(ctx, w, h) {
  ctx.fillStyle = BLUE;
  ctx.fillRect(0, 0, w, h);
  ctx.letterSpacing = '4px';
  text(ctx, 'BOMBS', w / 2, h * 0.24, 112, { font: '"Georgia", serif', weight: 'bold', colour: '#e9e6dc', align: 'center' });
  ctx.letterSpacing = '0px';

  // A round bomb with a fuse and a spark
  const cx = w / 2, cy = h * 0.58, r = w * 0.17;
  ctx.fillStyle = '#e9e6dc';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(cx + r * 0.35, cy - r * 1.18, r * 0.42, r * 0.36);
  ctx.strokeStyle = '#e9e6dc'; ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.56, cy - r * 1.18);
  ctx.quadraticCurveTo(cx + r * 0.8, cy - r * 1.6, cx + r * 1.15, cy - r * 1.45);
  ctx.stroke();
  ctx.lineWidth = 5;
  for (let k = 0; k < 8; k++) {
    const a = k * Math.PI / 4, sx = cx + r * 1.22, sy = cy - r * 1.5;
    ctx.beginPath();
    ctx.moveTo(sx + Math.cos(a) * 10, sy + Math.sin(a) * 10);
    ctx.lineTo(sx + Math.cos(a) * 24, sy + Math.sin(a) * 24);
    ctx.stroke();
  }
  // A highlight so it reads as round
  ctx.fillStyle = BLUE;
  ctx.beginPath(); ctx.arc(cx - r * 0.38, cy - r * 0.38, r * 0.16, 0, Math.PI * 2); ctx.fill();
  return [];
}

/**
 * The inside of the binder's cover: a plain sheet with a short note
 */
export function drawBinderInside(ctx, w, h) {
  paper(ctx, w, h);
  text(ctx, 'How this file works', 70, 170, 42);
  let y = 250;
  for (const line of [
    'Pick an exercise from the contents.',
    'The Defuser gets the bomb. The Expert gets the manual and must never see the bomb.',
    'Say everything out loud. Nobody else will.',
  ]) {
    y = paragraph(ctx, line, 70, y, w - 140, 32, 46) + 22;
  }
  return [];
}

/**
 * The contents page: every level, each one a line to click
 */
export function drawContents(ctx, w, h, hovered = null) {
  paper(ctx, w, h);
  fileMarks(ctx, w, h);
  text(ctx, 'Contents', w / 2, 140, 54, { align: 'center' });
  text(ctx, 'Section 1: Exercises', 70, 240, 44);

  const regions = [];
  LEVELS.forEach((level, i) => {
    const y = 340 + i * 100;
    const config = DIFFICULTY[level.id];
    const isHovered = hovered === level.id;
    text(ctx, level.number, 100, y, 46);
    const width = text(ctx, config.label, 205, y, 46);
    text(ctx, `${config.modules - config.needy} modules`, w - 70, y, 28, { align: 'right', colour: FADED_INK });
    if (isHovered) {
      ctx.fillStyle = INK;
      ctx.fillRect(205, y + 10, width, 4);
    }
    regions.push({ id: `level:${level.id}`, x: 80, y: y - 60, w: w - 140, h: 88 });
  });

  text(ctx, 'Choose an exercise to read its brief.', 70, h - 130, 28, { colour: FADED_INK });
  return regions;
}

/**
 * One level's page: its brief, its facts, and the Start stamp
 */
export function drawLevel(ctx, w, h, id, hovered = null) {
  const level = LEVELS.find(item => item.id === id);
  const config = DIFFICULTY[id];
  paper(ctx, w, h);
  fileMarks(ctx, w, h);

  text(ctx, `${level.number}  ${config.label}`, 70, 145, 58);
  let y = paragraph(ctx, level.brief, 70, 225, w - 140, 33, 48) + 40;

  for (const [label, value] of levelFacts(id)) {
    text(ctx, label, 90, y, 34);
    text(ctx, value, w - 90, y, 34, { align: 'right' });
    ctx.strokeStyle = 'rgba(29, 29, 31, 0.25)';
    ctx.setLineDash([4, 8]);
    ctx.beginPath(); ctx.moveTo(90, y + 12); ctx.lineTo(w - 90, y + 12); ctx.stroke();
    ctx.setLineDash([]);
    y += 78;
  }

  const start = stampButton(ctx, 'START', w / 2, h - 210, hovered === 'start');
  const backWidth = text(ctx, '< Contents', 70, h - 110, 32, { colour: hovered === 'back' ? INK : FADED_INK });
  return [
    { id: 'start', ...start },
    { id: 'back', x: 60, y: h - 145, w: backWidth + 30, h: 50 },
  ];
}

/* ----------------------------------------------------------
   Menu folder pages
---------------------------------------------------------- */

/**
 * The folder's cover: a stamped MENU near the tab
 */
export function drawFolderCover(ctx, w, h) {
  ctx.fillStyle = TAN;
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.translate(w * 0.5, h * 0.24);
  ctx.rotate(-0.04);
  ctx.letterSpacing = '6px';
  text(ctx, 'MENU', 0, 0, 170, { font: 'Impact, "Arial Black", sans-serif', colour: '#2a2620', align: 'center' });
  ctx.restore();
  ctx.letterSpacing = '0px';
  return [];
}

// A computer mouse with one part picked out in orange
function mouseDrawing(ctx, x, y, part) {
  const w = 62, h = 92;
  ctx.lineWidth = 4; ctx.strokeStyle = INK;
  ctx.fillStyle = '#f4f3ee';
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 30); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8902c';
  if (part === 'left' || part === 'right') {
    ctx.beginPath();
    const sx = part === 'left' ? x : x + w / 2;
    ctx.roundRect(sx + 3, y + 3, w / 2 - 5, 36, part === 'left' ? [26, 0, 0, 0] : [0, 26, 0, 0]);
    ctx.fill();
  }
  ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + 40); ctx.moveTo(x, y + 40); ctx.lineTo(x + w, y + 40); ctx.stroke();
  if (part === 'drag') {
    ctx.fillStyle = '#e8902c';
    ctx.beginPath(); ctx.roundRect(x + w / 2 + 2, y + 3, w / 2 - 5, 36, [0, 26, 0, 0]); ctx.fill();
    ctx.strokeStyle = '#e8902c'; ctx.lineWidth = 5;
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const ax = x + w / 2 + dx * 62, ay = y + h / 2 + dy * 70;
      ctx.beginPath(); ctx.moveTo(x + w / 2 + dx * 40, y + h / 2 + dy * 54); ctx.lineTo(ax, ay); ctx.stroke();
    }
  }
}

/**
 * Inside the folder's cover: a version slip and the controls card
 */
export function drawFolderInside(ctx, w, h) {
  ctx.fillStyle = TAN;
  ctx.fillRect(0, 0, w, h);

  // Version slip, taped on
  ctx.fillStyle = '#efe3b8';
  ctx.fillRect(w * 0.14, 50, w * 0.72, 230);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fillRect(w * 0.42, 36, w * 0.16, 34);
  text(ctx, 'Talk to Defuse', w / 2, 130, 48, { align: 'center' });
  text(ctx, 'Expert manual:', w / 2, 190, 32, { align: 'center' });
  text(ctx, '/manual.html', w / 2, 236, 32, { align: 'center' });

  // Controls card
  const top = 330;
  ctx.fillStyle = '#f2f1ec';
  ctx.fillRect(50, top, w - 100, h - top - 60);
  text(ctx, 'Controls', w / 2, top + 80, 54, { align: 'center' });
  const rows = [['left', 'Select or use'], ['right', 'Back'], ['drag', 'Hold and drag: rotate']];
  rows.forEach(([part, label], i) => {
    const y = top + 150 + i * 200;
    mouseDrawing(ctx, 140, y, part);
    paragraph(ctx, label, 290, y + 50, w - 350, 40, 46);
  });
  return [];
}

// The menu sheet in the office, and the one on the bomb room's desk
export const OFFICE_MENU = {
  title: 'Menu',
  items: [
    { id: 'manual', label: 'Expert Manual' },
    { id: 'options', label: 'Options' },
  ],
  footnote: 'The manual opens in a new tab. Give it to the Expert, or print it.',
};

export const GAME_MENU = {
  title: 'Menu',
  items: [
    { id: 'restart', label: 'Restart this bomb' },
    { id: 'leave', label: 'Back to the office' },
  ],
  footnote: 'The bomb keeps ticking while this folder is open.',
};

export const OPTIONS_MENU = {
  title: 'Options',
  items: [
    { id: 'sound', label: 'Sound' },
    { id: 'options-back', label: 'Back' },
  ],
  footnote: '',
};

// A menu line: the yellow bar behind it when hovered, and its clickable region
function menuLine(ctx, w, y, item, hovered) {
  const colour = item.disabled ? FADED_INK : INK;
  ctx.font = `60px ${TYPE_FONT}`;
  const width = ctx.measureText(item.label).width;
  if (!item.disabled && hovered === item.id) {
    ctx.fillStyle = HOVER;
    ctx.fillRect(40, y - 62, w - 80, 86);
  }
  text(ctx, item.label, w / 2, y, 60, { align: 'center', colour });
  if (item.note) text(ctx, item.note, w / 2, y + 44, 30, { align: 'center', colour });
  return item.disabled ? null : { id: item.id, x: 40, y: y - 62, w: w - 80, h: 86, width };
}

/**
 * A menu sheet: what can be done from here
 */
export function drawMenuSheet(ctx, w, h, hovered = null, menu = OFFICE_MENU) {
  paper(ctx, w, h);
  text(ctx, menu.title, w / 2, 200, 110, { align: 'center' });
  const regions = [];
  menu.items.forEach((item, i) => {
    const region = menuLine(ctx, w, 400 + i * 120, item, hovered);
    if (region) regions.push(region);
  });
  if (menu.footnote) paragraph(ctx, menu.footnote, 70, h - 190, w - 140, 32, 44, { colour: FADED_INK });
  return regions;
}

// A small black box with an arrow, like the original's volume buttons
function arrowButton(ctx, x, y, label, hovered) {
  const box = { x, y, w: 110, h: 84 };
  if (hovered) {
    ctx.fillStyle = HOVER;
    ctx.fillRect(x - 10, y - 10, box.w + 20, box.h + 20);
  }
  ctx.fillStyle = INK;
  ctx.fillRect(x, y, box.w, box.h);
  text(ctx, label, x + box.w / 2, y + 60, 56, { align: 'center', colour: PAPER });
  return box;
}

/**
 * The Sound page: the sound effect volume, in steps of ten
 * @param {number} volume - 0 to 1
 */
export function drawSoundSheet(ctx, w, h, hovered = null, volume = 1) {
  paper(ctx, w, h);
  text(ctx, 'Sound', w / 2, 200, 110, { align: 'center' });
  text(ctx, 'Sound Effect Volume', w / 2, 380, 46, { align: 'center' });
  const down = arrowButton(ctx, 110, 440, '<', hovered === 'volume-down');
  const up = arrowButton(ctx, w - 220, 440, '>', hovered === 'volume-up');
  text(ctx, `${Math.round(volume * 100)}%`, w / 2, 502, 58, { align: 'center' });
  const back = menuLine(ctx, w, 720, { id: 'sound-back', label: 'Back' }, hovered);
  return [{ id: 'volume-down', ...down }, { id: 'volume-up', ...up }, back];
}

/* ----------------------------------------------------------
   Results report
---------------------------------------------------------- */

/**
 * What the report says about a finished bomb
 * @param {object} game - { level, won, timeRemaining, cause }: level is a preset's name, or a Free Play config
 */
export function resultLines(game) {
  const preset = typeof game.level === 'string';
  const config = preset ? DIFFICULTY[game.level] : game.level;
  const number = preset ? LEVELS.find(item => item.id === game.level).number : null;
  return {
    identifier: preset ? `${number}  ${config.label}` : config.label,
    configuration: [formatTime(config.time), `${config.modules - config.needy} Modules`, `${config.maxStrikes} Strike${config.maxStrikes === 1 ? '' : 's'}`],
    stamp: game.won ? 'DEFUSED' : 'EXPLODED',
    timeRemaining: displayTime(game.timeRemaining),
    cause: game.won ? null : game.cause,
  };
}

// A rubber stamp: bold letters in a rounded double frame, slightly turned
function rubberStamp(ctx, label, cx, cy, colour) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.05);
  ctx.font = `bold 96px Impact, "Arial Black", sans-serif`;
  const width = ctx.measureText(label).width + 70;
  ctx.strokeStyle = colour;
  ctx.lineWidth = 9;
  ctx.beginPath(); ctx.roundRect(-width / 2, -78, width, 140, 22); ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(-width / 2 + 14, -64, width - 28, 112, 14); ctx.stroke();
  text(ctx, label, 0, 26, 96, { font: 'Impact, "Arial Black", sans-serif', colour, align: 'center' });
  ctx.restore();
}

/**
 * The results page: the bomb's details, the stamp, and Back and Retry
 */
export function drawResults(ctx, w, h, game, hovered = null) {
  const lines = resultLines(game);
  paper(ctx, w, h);
  fileMarks(ctx, w, h);
  const left = 60, right = w - 60;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;

  // 1. Exercise
  ctx.strokeRect(left, 90, right - left, 120);
  text(ctx, '1. Exercise', left + 14, 128, 28, { font: SANS_FONT });
  text(ctx, lines.identifier, w / 2, 188, 44, { align: 'center' });

  // 2. The bomb: time, modules, strikes
  ctx.strokeRect(left, 210, right - left, 120);
  text(ctx, '2. Bomb', left + 14, 248, 28, { font: SANS_FONT });
  const third = (right - left) / 3;
  lines.configuration.forEach((value, i) => {
    text(ctx, value, left + third * (i + 0.5), 310, 40, { align: 'center' });
    if (i) ctx.fillRect(left + third * i, 268, 3, 52);
  });

  // 3. Result
  const resultBottom = h - 200;
  ctx.strokeRect(left, 330, right - left, resultBottom - 330);
  text(ctx, '3. Result', left + 14, 368, 28, { font: SANS_FONT });
  rubberStamp(ctx, lines.stamp, w / 2, 450, game.won ? STAMP_GREEN : STAMP_RED);
  text(ctx, 'Time remaining:', w / 2, 565, 38, { align: 'center' });
  text(ctx, lines.timeRemaining, w / 2, 620, 52, { align: 'center' });
  if (lines.cause) {
    text(ctx, 'Cause of explosion:', w / 2, 690, 38, { align: 'center' });
    text(ctx, lines.cause, w / 2, 740, 38, { align: 'center' });
  }

  const back = stampButton(ctx, 'BACK', w * 0.3, h - 120, hovered === 'results-back');
  const retry = stampButton(ctx, 'RETRY', w * 0.7, h - 120, hovered === 'retry');
  return [{ id: 'results-back', ...back }, { id: 'retry', ...retry }];
}

/**
 * Which region a point on a page falls in
 */
export function regionAt(regions, x, y) {
  return regions.find(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) ?? null;
}

/* ----------------------------------------------------------
   Free Play case
---------------------------------------------------------- */

const PANEL = '#5d6470';
const PANEL_DARK = '#454b55';
const SCREEN = '#0c1622';
const SCREEN_TEXT = '#a9d8ff';
const DIGITS = '#ff8a3a';
const PANEL_FONT = '"Arial Black", Impact, sans-serif';

// What the info screen says about each control (our own wording)
export const FREE_PLAY_HELP = {
  none: ['SET UP A BOMB,', 'THEN PRESS START.'],
  time: ['TIME:', '', 'HOW LONG THE BOMB', 'RUNS BEFORE IT', 'GOES OFF.'],
  modules: ['MODULES:', '', 'HOW MANY MODULES', 'MUST BE DISARMED.'],
  needy: ['NEEDY MODULES:', '', "THEY CAN'T BE DISARMED,", 'AND KEEP NEEDING', 'ATTENTION UNTIL', 'THE BOMB IS DONE.'],
  hardcore: ['HARDCORE:', '', 'A SINGLE STRIKE', 'SETS THE BOMB OFF.'],
  start: ['START:', '', 'ARM A BOMB WITH', 'THESE SETTINGS.'],
};

/**
 * Which help a hovered control shows
 */
export function freePlayTopic(hovered) {
  if (!hovered) return 'none';
  const id = hovered.replace(/^fp-/, '').replace(/-(up|down)$/, '');
  return FREE_PLAY_HELP[id] ? id : 'none';
}

/**
 * The case's lid: FREE PLAY in big white letters
 */
export function drawCaseCover(ctx, w, h) {
  ctx.fillStyle = '#1c1d20';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  for (let y = 0; y < h; y += 6) ctx.fillRect(0, y, w, 2);
  ctx.save();
  ctx.translate(w / 2, h * 0.47);
  ctx.rotate(-0.06);
  ctx.letterSpacing = '6px';
  text(ctx, 'FREE PLAY', 0, 40, 120, { font: PANEL_FONT, colour: '#e9e7e1', align: 'center' });
  ctx.restore();
  ctx.letterSpacing = '0px';
  return [];
}

function screw(ctx, x, y) {
  ctx.fillStyle = '#8a919b';
  ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#3d424a'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y); ctx.stroke();
}

function plate(ctx, x, y, w, h, colour = PANEL_DARK) {
  ctx.fillStyle = colour;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.fill();
}

function hoverRing(ctx, box, hovered) {
  if (!hovered) return;
  ctx.strokeStyle = HOVER; ctx.lineWidth = 6;
  ctx.strokeRect(box.x - 5, box.y - 5, box.w + 10, box.h + 10);
}

// A small arrow key next to a display value
function arrowKey(ctx, x, y, left, hovered) {
  const box = { x, y, w: 78, h: 74 };
  ctx.fillStyle = '#2b2f35';
  ctx.fillRect(x, y, box.w, box.h);
  ctx.strokeStyle = '#9aa3ad'; ctx.lineWidth = 4;
  ctx.strokeRect(x + 8, y + 8, box.w - 16, box.h - 16);
  text(ctx, left ? '<' : '>', x + box.w / 2, y + 54, 46, { font: PANEL_FONT, colour: '#c9d1da', align: 'center' });
  hoverRing(ctx, box, hovered);
  return box;
}

// A toggle switch with its OFF / ON window
function toggle(ctx, x, y, label, on, hovered) {
  plate(ctx, x, y, 330, 80, '#2b2f35');
  text(ctx, label, x + 165, y + 56, 44, { font: PANEL_FONT, colour: SCREEN_TEXT, align: 'center' });
  // The lever
  ctx.fillStyle = '#8a919b';
  ctx.beginPath(); ctx.arc(x + 420, y + 40, 30, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c9ced4'; ctx.lineWidth = 16; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x + 420, y + 40); ctx.lineTo(x + 420 + (on ? 44 : -44), y + 40 - 24); ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.fillStyle = '#121418';
  ctx.fillRect(x + 500, y, 170, 80);
  text(ctx, on ? 'ON' : 'OFF', x + 585, y + 58, 52, { font: PANEL_FONT, colour: on ? '#3cff6a' : '#ff3b3b', align: 'center' });
  const box = { x, y: y - 6, w: 670, h: 92 };
  hoverRing(ctx, box, hovered);
  return box;
}

/**
 * Inside the lid: the controls. Returns the clickable regions.
 * @param {object} settings - { time, modules, needy, hardcore }
 */
export function drawFreePlayControls(ctx, w, h, settings, hovered = null) {
  ctx.fillStyle = PANEL;
  ctx.fillRect(0, 0, w, h);
  [[30, 30], [w - 30, 30], [30, h - 30], [w - 30, h - 30]].forEach(([x, y]) => screw(ctx, x, y));

  // Title plate
  ctx.fillStyle = '#0d1014';
  ctx.fillRect(w / 2 - 250, 70, 500, 100);
  ctx.letterSpacing = '6px';
  text(ctx, 'FREE PLAY', w / 2, 142, 64, { font: PANEL_FONT, colour: SCREEN_TEXT, align: 'center' });
  ctx.letterSpacing = '0px';

  // Time and modules display
  plate(ctx, 60, 220, w - 120, 330, '#15181c');
  const rows = [
    ['TIME', formatTime(settings.time), 'time', 320],
    ['MODULES', String(settings.modules), 'modules', 460],
  ];
  const regions = [];
  for (const [label, value, id, y] of rows) {
    text(ctx, label, 95, y + 20, 52, { font: PANEL_FONT, colour: SCREEN_TEXT });
    const down = arrowKey(ctx, 420, y - 37, true, hovered === `fp-${id}-down`);
    ctx.fillStyle = '#1e0f08';
    ctx.fillRect(510, y - 37, 180, 74);
    text(ctx, value, 600, y + 20, 56, { font: '"Courier New", monospace', weight: 'bold', colour: DIGITS, align: 'center' });
    const up = arrowKey(ctx, 702, y - 37, false, hovered === `fp-${id}-up`);
    regions.push({ id: `fp-${id}-down`, ...down }, { id: `fp-${id}-up`, ...up });
  }

  // Hazard-striped box with the two switches
  const hzTop = 600, hzBottom = 860;
  ctx.save();
  ctx.beginPath(); ctx.rect(60, hzTop, w - 120, hzBottom - hzTop); ctx.clip();
  ctx.fillStyle = '#d9a417'; ctx.fillRect(60, hzTop, w - 120, hzBottom - hzTop);
  ctx.fillStyle = '#22201c';
  for (let x = -300; x < w; x += 76) {
    ctx.beginPath();
    ctx.moveTo(x, hzBottom); ctx.lineTo(x + 38, hzBottom); ctx.lineTo(x + 298, hzTop); ctx.lineTo(x + 260, hzTop);
    ctx.fill();
  }
  ctx.restore();
  regions.push({ id: 'fp-needy', ...toggle(ctx, 115, 638, 'NEEDY', settings.needy, hovered === 'fp-needy') });
  regions.push({ id: 'fp-hardcore', ...toggle(ctx, 115, 748, 'HARDCORE', settings.hardcore, hovered === 'fp-hardcore') });

  // Vent grille and the big red START button
  plate(ctx, 90, 930, 280, 220, '#2b2f35');
  ctx.fillStyle = '#121418';
  for (let x = 115; x < 350; x += 36) ctx.fillRect(x, 952, 20, 176);
  const cx = 630, cy = 1040, r = 110;
  ctx.fillStyle = hovered === 'fp-start' ? '#ff4a3a' : '#e3271d';
  ctx.beginPath();
  for (let k = 0; k < 8; k++) {
    const a = Math.PI / 8 + k * Math.PI / 4;
    ctx[k ? 'lineTo' : 'moveTo'](cx + r * Math.cos(a), cy + r * Math.sin(a));
  }
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#8f140e'; ctx.lineWidth = 8; ctx.stroke();
  text(ctx, 'START', cx, cy + 22, 60, { font: PANEL_FONT, colour: '#ffffff', align: 'center' });
  regions.push({ id: 'fp-start', x: cx - r, y: cy - r, w: r * 2, h: r * 2 });
  return regions;
}

/**
 * Inside the base: a red lamp, the info screen and the difficulty gauge
 */
export function drawFreePlayInfo(ctx, w, h, settings, hovered = null) {
  ctx.fillStyle = PANEL;
  ctx.fillRect(0, 0, w, h);
  [[30, 30], [w - 30, 30], [30, h - 30], [w - 30, h - 30]].forEach(([x, y]) => screw(ctx, x, y));

  // Red lamp
  ctx.fillStyle = '#e3271d';
  ctx.beginPath(); ctx.arc(130, 130, 46, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.beginPath(); ctx.arc(116, 114, 14, 0, Math.PI * 2); ctx.fill();

  // Info screen
  plate(ctx, 190, 230, 560, 520, '#2b2f35');
  ctx.fillStyle = SCREEN;
  ctx.fillRect(214, 254, 512, 472);
  const lines = FREE_PLAY_HELP[freePlayTopic(hovered)];
  const top = 490 - (lines.length - 1) * 25;
  lines.forEach((line, i) => text(ctx, line, 470, top + i * 50, 36, { font: PANEL_FONT, colour: SCREEN_TEXT, align: 'center' }));

  // Estimated difficulty gauge: a cream dial, green to red, and a needle
  plate(ctx, 230, 800, 440, 360, '#2b2f35');
  const gx = 450, gy = 1010, gr = 165;
  ctx.fillStyle = '#ece6d6';
  ctx.beginPath(); ctx.arc(gx, gy, gr + 18, Math.PI, 0); ctx.fill();
  for (let k = 0; k <= 20; k++) {
    const f = k / 20;
    const a = Math.PI + f * Math.PI;
    const inner = gr - (k % 5 ? 18 : 32);
    ctx.strokeStyle = `hsl(${120 - f * 120}, 75%, 42%)`;
    ctx.lineWidth = k % 5 ? 5 : 9;
    ctx.beginPath();
    ctx.moveTo(gx + Math.cos(a) * inner, gy + Math.sin(a) * inner);
    ctx.lineTo(gx + Math.cos(a) * gr, gy + Math.sin(a) * gr);
    ctx.stroke();
  }
  const needle = Math.PI + estimatedDifficulty(settings) * Math.PI;
  ctx.strokeStyle = '#c21d14'; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + Math.cos(needle) * (gr - 14), gy + Math.sin(needle) * (gr - 14)); ctx.stroke();
  ctx.fillStyle = '#2b2f35';
  ctx.beginPath(); ctx.arc(gx, gy, 14, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d8cfb4';
  ctx.fillRect(gx - 150, gy + 22, 300, 96);
  text(ctx, 'ESTIMATED', gx, gy + 64, 36, { font: PANEL_FONT, colour: '#2a2620', align: 'center' });
  text(ctx, 'DIFFICULTY', gx, gy + 104, 36, { font: PANEL_FONT, colour: '#2a2620', align: 'center' });
  return [];
}
