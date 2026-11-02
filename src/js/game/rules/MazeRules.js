/* ============================================================
   MazeRules.js — Rules for the Mazes module
   The two circles say which maze this is. The light must reach
   the triangle, and walking into one of the maze's invisible
   walls is a strike.
   ============================================================ */

import { randomChoice, randomInt } from '../../utils/helpers.js';

export const GRID_SIZE = 6;
const MIN_ROUTE = 4; // Fewest steps from the light to the triangle

// The manual's nine mazes, left to right, top to bottom. Taken from the lines
// in the PDF, not typed out. Cells are . or o (a circle), | and - are walls.
export const MAZES = [
  [
    '. . .|. . .',
    '  -     - -',
    'o|. .|. . .',
    '    - - -  ',
    '.|. .|. . o',
    '  -     -  ',
    '.|. . .|. .',
    '  - - - -  ',
    '. . .|. .|.',
    '  -     -  ',
    '. .|. .|. .',
  ],
  [
    '. . .|. . .',
    '-   -     -',
    '. .|. .|o .',
    '  -   - -  ',
    '.|. .|. . .',
    '    -   -  ',
    '. o|. .|.|.',
    '  -   -    ',
    '.|.|.|. .|.',
    '        -  ',
    '.|. .|. . .',
  ],
  [
    '. . .|.|. .',
    '  -        ',
    '.|.|.|. .|.',
    '-     - -  ',
    '. .|.|. .|.',
    '           ',
    '.|.|.|o|.|o',
    '           ',
    '.|. .|.|.|.',
    '  - -      ',
    '. . . .|. .',
  ],
  [
    'o .|. . . .',
    '    - - -  ',
    '.|.|. . . .',
    '      - -  ',
    '.|. .|. .|.',
    '  - -   -  ',
    'o|. . . . .',
    '  - - - -  ',
    '. . . . .|.',
    '  - - -    ',
    '. . .|. .|.',
  ],
  [
    '. . . . . .',
    '- - - -    ',
    '. . . . .|.',
    '  - -   - -',
    '. .|. .|o .',
    '    - -    ',
    '.|. . .|.|.',
    '  - -   -  ',
    '.|. . . .|.',
    '    - - -  ',
    '.|. . o . .',
  ],
  [
    '.|. .|. o .',
    '      -    ',
    '.|.|.|. .|.',
    '        -  ',
    '. .|.|.|. .',
    '  - -     -',
    '. .|. .|.|.',
    '-          ',
    '. .|o|.|. .',
    '  - -   -  ',
    '. . . .|. .',
  ],
  [
    '. o . .|. .',
    '  - -      ',
    '.|. .|. .|.',
    '    - - -  ',
    '. .|. .|. .',
    '- -   -   -',
    '. .|. . .|.',
    '      - -  ',
    '.|.|. . .|.',
    '  - - -    ',
    '. o . . . .',
  ],
  [
    '.|. . o|. .',
    '    -      ',
    '. . .|. .|.',
    '  - - - -  ',
    '.|. . . .|.',
    '    - -    ',
    '.|. o|. . .',
    '  -   - - -',
    '.|.|. . . .',
    '    - - - -',
    '. . . . . .',
  ],
  [
    '.|. . . . .',
    '    - -    ',
    '.|.|o .|.|.',
    '      -    ',
    '. . .|. .|.',
    '  - -   -  ',
    '.|.|. .|. .',
    '      - -  ',
    'o|.|.|. .|.',
    '          -',
    '. .|. .|. .',
  ],
];

export const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

/**
 * Find a maze's two circles
 * @param {string[]} maze
 * @returns {Array<{x: number, y: number}>}
 */
export function findCircles(maze) {
  const circles = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (maze[y * 2][x * 2] === 'o') circles.push({ x, y });
    }
  }
  return circles;
}

function isOnGrid({ x, y }) {
  return x >= 0 && y >= 0 && x < GRID_SIZE && y < GRID_SIZE;
}

/**
 * Is there a wall between a cell and the one next to it?
 * @param {string[]} maze
 * @param {{x: number, y: number}} cell
 * @param {string} direction - a key of DIRECTIONS
 */
export function hasWall(maze, { x, y }, direction) {
  const step = DIRECTIONS[direction];
  return maze[y * 2 + step.y][x * 2 + step.x] !== ' ';
}

/**
 * Count the steps from one cell to every other
 * @returns {number[][]} steps, by row then column
 */
export function stepsFrom(maze, start) {
  const steps = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(-1));
  const queue = [start];
  steps[start.y][start.x] = 0;

  while (queue.length > 0) {
    const cell = queue.shift();
    Object.entries(DIRECTIONS).forEach(([direction, step]) => {
      const next = { x: cell.x + step.x, y: cell.y + step.y };
      if (!isOnGrid(next) || hasWall(maze, cell, direction) || steps[next.y][next.x] !== -1) return;

      steps[next.y][next.x] = steps[cell.y][cell.x] + 1;
      queue.push(next);
    });
  }
  return steps;
}

function randomCell() {
  return { x: randomInt(0, GRID_SIZE - 1), y: randomInt(0, GRID_SIZE - 1) };
}

/**
 * Pick a maze, and a light and triangle far enough apart to need some directions
 * @returns {{maze: string[], light: Object, goal: Object}}
 */
export function createPuzzle() {
  const maze = randomChoice(MAZES);
  const light = randomCell();
  const steps = stepsFrom(maze, light);

  while (true) {
    const goal = randomCell();
    if (steps[goal.y][goal.x] >= MIN_ROUTE) return { maze, light, goal };
  }
}

export class MazeRules {
  /**
   * @param {{maze: string[], light: Object, goal: Object}} puzzle
   */
  constructor({ maze, light, goal } = createPuzzle()) {
    this.maze = maze;
    this.light = light;
    this.goal = goal;
    this.circles = findCircles(maze);
  }

  /**
   * Try to move the light
   * @param {string} direction - a key of DIRECTIONS
   * @returns {'move'|'solve'|'strike'|'edge'} 'edge' means off the grid: nothing happens
   */
  move(direction) {
    const step = DIRECTIONS[direction];
    const next = { x: this.light.x + step.x, y: this.light.y + step.y };

    if (!isOnGrid(next)) return 'edge';
    if (hasWall(this.maze, this.light, direction)) return 'strike';

    this.light = next;
    return next.x === this.goal.x && next.y === this.goal.y ? 'solve' : 'move';
  }
}
