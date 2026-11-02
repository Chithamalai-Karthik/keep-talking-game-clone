import { describe, expect, it } from 'vitest';
import {
  createPuzzle,
  DIRECTIONS,
  findCircles,
  GRID_SIZE,
  hasWall,
  MAZES,
  MazeRules,
  stepsFrom,
} from '../src/js/game/rules/MazeRules.js';

// Read off the page by eye, separately from the data taken out of the PDF
const CIRCLES = [
  [[0, 1], [5, 2]],
  [[4, 1], [1, 3]],
  [[3, 3], [5, 3]],
  [[0, 0], [0, 3]],
  [[4, 2], [3, 5]],
  [[4, 0], [2, 4]],
  [[1, 0], [1, 5]],
  [[3, 0], [2, 3]],
  [[2, 1], [0, 4]],
];

describe('Maze data', () => {
  it('has the manual\'s nine mazes', () => {
    expect(MAZES).toHaveLength(9);
  });

  it.each(CIRCLES.map((circles, i) => [i + 1, circles]))('maze %i has its two circles', (number, circles) => {
    const found = findCircles(MAZES[number - 1]).map(({ x, y }) => [x, y]);

    expect(found.sort()).toEqual([...circles].sort());
  });

  it('tells every maze apart by its circles', () => {
    const keys = MAZES.map(maze => JSON.stringify(findCircles(maze)));

    expect(new Set(keys).size).toBe(9);
  });

  it('can reach every cell of every maze', () => {
    MAZES.forEach((maze) => {
      expect(stepsFrom(maze, { x: 0, y: 0 }).flat()).not.toContain(-1);
    });
  });

  it('has exactly one route between any two cells', () => {
    // 36 cells joined by 35 open sides: 60 sides, less the 25 walls
    MAZES.forEach((maze) => {
      const walls = maze.join('').match(/[|-]/g);
      expect(walls).toHaveLength(25);
    });
  });

  it('matches walls read off the page by eye', () => {
    // Maze 1: a wall right of the top row's third cell
    expect(hasWall(MAZES[0], { x: 2, y: 0 }, 'right')).toBe(true);
    expect(hasWall(MAZES[0], { x: 0, y: 0 }, 'right')).toBe(false);
    // Maze 4: a wall under the third and fourth cells of the top row
    expect(hasWall(MAZES[3], { x: 2, y: 0 }, 'down')).toBe(true);
    // Maze 5: a wall under the first cell of the top row
    expect(hasWall(MAZES[4], { x: 0, y: 0 }, 'down')).toBe(true);
    // Maze 9: a wall right of the top left cell
    expect(hasWall(MAZES[8], { x: 0, y: 0 }, 'right')).toBe(true);
  });

  it('sees a wall from both sides', () => {
    expect(hasWall(MAZES[0], { x: 3, y: 0 }, 'left')).toBe(true);
    expect(hasWall(MAZES[3], { x: 2, y: 1 }, 'up')).toBe(true);
  });
});

describe('Maze puzzles', () => {
  it('keeps the light and triangle at least four steps apart', () => {
    for (let i = 0; i < 300; i++) {
      const { maze, light, goal } = createPuzzle();

      expect(MAZES).toContain(maze);
      expect(stepsFrom(maze, light)[goal.y][goal.x]).toBeGreaterThanOrEqual(4);
    }
  });
});

describe('Maze moves', () => {
  const puzzle = (light, goal, maze = MAZES[0]) => ({ maze, light, goal });

  it('moves through open space', () => {
    const rules = new MazeRules(puzzle({ x: 0, y: 0 }, { x: 5, y: 5 }));

    expect(rules.move('right')).toBe('move');
    expect(rules.light).toEqual({ x: 1, y: 0 });
  });

  it('strikes on a wall and stays put', () => {
    const rules = new MazeRules(puzzle({ x: 2, y: 0 }, { x: 5, y: 5 }));

    expect(rules.move('right')).toBe('strike');
    expect(rules.light).toEqual({ x: 2, y: 0 });
  });

  it('does nothing at the edge of the grid', () => {
    const rules = new MazeRules(puzzle({ x: 0, y: 0 }, { x: 5, y: 5 }));

    expect(rules.move('up')).toBe('edge');
    expect(rules.move('left')).toBe('edge');
    expect(rules.light).toEqual({ x: 0, y: 0 });
  });

  it('solves on reaching the triangle', () => {
    const rules = new MazeRules(puzzle({ x: 0, y: 0 }, { x: 1, y: 0 }));

    expect(rules.move('right')).toBe('solve');
  });

  it('can walk every puzzle to the triangle without a strike', () => {
    for (let i = 0; i < 200; i++) {
      const rules = new MazeRules();
      let result;

      while (result !== 'solve') {
        const steps = stepsFrom(rules.maze, rules.goal);
        const here = steps[rules.light.y][rules.light.x];
        const direction = Object.keys(DIRECTIONS).find((name) => {
          const { x, y } = DIRECTIONS[name];
          const next = steps[rules.light.y + y]?.[rules.light.x + x];
          return next === here - 1 && !hasWall(rules.maze, rules.light, name);
        });
        result = rules.move(direction);
        expect(result).not.toBe('strike');
      }
    }
  });

  it('keeps the grid size the manual uses', () => {
    expect(GRID_SIZE).toBe(6);
  });
});
