# Keep Talking and Nobody Explodes clone

A browser clone of Keep Talking and Nobody Explodes: one player defuses a 3D bomb, another reads the manual, and they talk it through.

The Defuser sees the bomb and the Expert sees only the manual, so everything the Expert learns has to be said aloud. All game logic runs in the Defuser's browser, with no game server.

**Status:** the menus, 3D bomb, timer, strikes and game-over screens are built. Wires, The Button and Keypads are real modules. The rest are still placeholders, with a button that solves and a button that strikes. See `ROADMAP.md`.

## Setup

Install [Node.js](https://nodejs.org/), then install the dependencies once:

```bash
npm install
```

Python 3.8 or newer is only needed for the project board.

## Running it

```bash
npm run dev       # development server, usually at http://localhost:5173/
npm run build     # production build into dist/
npm run preview   # serve the production build
npm test          # run the automated tests
```

## Using it

Choose **Play**, then a difficulty. The Expert Manual, Settings and How to Play buttons aren't connected yet.

| Control | Action |
| --- | --- |
| Left click anywhere on the bomb | Pick it up |
| Left click on a module | Select it: the bomb turns to face that module |
| Left click on the selected module | Use it (press, cut and so on) |
| Hold left click on The Button | Hold it down; let go anywhere to release it |
| Hold right click and drag | Rotate the bomb; this keeps the selected module and works during a hold |
| Right click or Esc | Deselect: leave the selected module, or put the bomb down |

| Difficulty | Modules | Time | Strikes allowed |
| --- | --- | --- | --- |
| Easy | 3 | 5:00 | 3 |
| Medium | 6 | 4:00 | 3 |
| Hard | 9 | 3:00 | 2 |
| Expert | 11 | 3:00 | 1 |

Testing keys during a game: `T` skips 30 seconds, `K` adds a strike, `G` explodes the bomb and `W` wins. These only work in development (`npm run dev`).

## Project board

`python board/serve.py` opens ROADMAP.md as a kanban board (To do, Next, In progress, Done, On hold) with due dates
and a schedule timeline. It reads the roadmap each time it opens, so the roadmap is the one place to edit.
