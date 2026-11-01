# Keep Talking and Nobody Explodes clone

A browser clone of Keep Talking and Nobody Explodes: one player defuses a 3D bomb, another reads the manual, and they talk it through.

The Defuser sees the bomb and the Expert sees only the manual, so everything the Expert learns has to be said aloud. All game logic runs in the Defuser's browser, with no game server.

**Status:** the menus, 3D bomb, timer, strikes and game-over screens are built. Modules are still placeholders, so a game can't yet be won by playing. See `ROADMAP.md`.

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
| Drag | Rotate the held bomb |
| Left click on a module | Focus it: the bomb turns to face that module |
| Left click on the focused module | Use it (press, cut and so on) |
| Left click on the casing, or drag | Leave the focused module |
| Right click or Esc | Leave a focused module, or put the bomb down |

| Difficulty | Modules | Time | Strikes allowed |
| --- | --- | --- | --- |
| Easy | 3 | 5:00 | 3 |
| Medium | 6 | 4:00 | 3 |
| Hard | 9 | 3:00 | 2 |
| Expert | 11 | 3:00 | 1 |

Testing keys during a game: `T` skips 30 seconds, `K` adds a strike, `G` explodes the bomb and `W` wins. These only work in development (`npm run dev`).

Open the development server with `?modelTest` (http://localhost:5173/?modelTest) to show the Blender test model on the first module of a new game. This only works in development.

## Project layout

Which file controls what, so the project can be understood without reading all of it. Each source file also starts
with a comment saying what it does. ROADMAP.md says what is built and what comes next.

### Project root

| File | What it does |
| --- | --- |
| `index.html` | the page: canvas container, menu, difficulty, game and game-over screens |
| `package.json` | scripts and dependencies |
| `ROADMAP.md` | what is built, what comes next, and the decisions behind each step |
| `AGENTS.md` | for an AI agent working on the project: where to start reading, and the standing rules |
| `CLAUDE.md` | one line, `@AGENTS.md`: Claude Code loads AGENTS.md through it |
| `board/` | the project board (a kanban view of ROADMAP.md): `python board/serve.py` |

### `src/js/`

| File | What it does |
| --- | --- |
| `main.js` | entry point: wires everything together; timer, strikes, game flow, input handling and debug keys |

### `src/js/three/`

| File | What it does |
| --- | --- |
| `SceneManager.js` | Three.js scene, camera, renderer, lights and render loop |
| `BombModel.js` | the 3D bomb: loads the casing and widget models, and builds slots, timer display, strike lights and side panels |
| `BombController.js` | bomb states and animation: pick up, put down, drag to rotate, focus a module |
| `Raycaster.js` | detects clicks and hovers on 3D objects |
| `ModelLoader.js` | loads and caches `.glb` models exported from Blender |
| `RoomEnvironment.js` | the desk, floor, walls and lamp |

### `src/js/game/`

| File | What it does |
| --- | --- |
| `BombState.js` | one bomb's random setup and rules state: serial, batteries, indicators, ports, modules, strikes |
| `ModuleBase.js` | base class for modules, drawn as canvas textures (to be replaced in step 14) |
| `ModuleManager.js` | module type registry; creates a module per slot and routes clicks to it |
| `PlaceholderModule.js` | stand-in registered for all four module types until real ones exist |

### `src/js/ui/` and `src/js/utils/`

| File | What it does |
| --- | --- |
| `ui/MenuUI.js` | menu buttons and switching between screens |
| `utils/constants.js` | difficulty presets, module IDs and names, game data lists |
| `utils/helpers.js` | random, serial and time-format helpers, and the menu particles |

### `src/css/`

| File | What it does |
| --- | --- |
| `index.css` | design tokens and global styles |
| `animations.css` | shared keyframe animations |
| `menu.css` | main menu and difficulty screen |
| `game.css` | game screen, hint and game-over overlay |

### `tests/`

| File | What it does |
| --- | --- |
| `BombState.test.js` | bomb generation: serial, batteries, indicators, ports, modules, timer slot, widgets |
| `timer.test.js` | timer text and strike speed |

### Other folders

| File | What it does |
| --- | --- |
| `docs/` | original plans and notes; some are out of date, and `ROADMAP.md` wins where they differ |
| `public/assets/models/` | `.glb` models exported from Blender, loaded by the game |
| `models/` | Blender source files for the models; edit these, then export the `.glb` again |

## Project board

`python board/serve.py` opens ROADMAP.md as a kanban board (To do, Next, In progress, Done, On hold) with due dates
and a schedule timeline. It reads the roadmap each time it opens, so the roadmap is the one place to edit.
