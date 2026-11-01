# Project layout

Which file controls what, so the project can be understood without reading all of it. Each source file also starts
with a comment saying what it does. ROADMAP.md says what is built and what comes next.

## Project root

| File | What it does |
| --- | --- |
| `index.html` | the page: canvas container, menu, difficulty, game and game-over screens |
| `package.json` | scripts and dependencies |
| `ROADMAP.md` | what is built, what comes next, and the decisions behind each step |
| `LAYOUT.md` | this file: which file controls what |
| `AGENTS.md` | for an AI agent working on the project: where to start reading, and the standing rules |
| `CLAUDE.md` | one line, `@AGENTS.md`: Claude Code loads AGENTS.md through it |
| `board/` | the project board (a kanban view of ROADMAP.md): `python board/serve.py` |

## `src/js/`

| File | What it does |
| --- | --- |
| `main.js` | entry point: wires everything together; timer, strikes, game flow, input handling and debug keys |

## `src/js/three/`

| File | What it does |
| --- | --- |
| `SceneManager.js` | Three.js scene, camera, renderer, lights and render loop |
| `BombModel.js` | the 3D bomb: loads the casing and widget models, and builds slots, timer display, strike lights and side panels |
| `BombController.js` | bomb states and animation: pick up, put down, drag to rotate, focus a module |
| `Raycaster.js` | detects clicks and hovers on 3D objects |
| `ModelLoader.js` | loads and caches `.glb` models exported from Blender, and textures |
| `TextLabel.js` | flat text labels for widgets and modules |
| `RoomEnvironment.js` | the desk, floor, walls and lamp |

## `src/js/game/`

| File | What it does |
| --- | --- |
| `BombState.js` | one bomb's random setup and rules state: serial, batteries, indicators, ports, modules, strikes |
| `ModuleBase.js` | base class for 3D modules: lifecycle, housing, status light, clickable `part_` objects, solve and strike |
| `ModuleManager.js` | module type registry; creates a module per slot and routes part clicks and hover to it |
| `WiresModule.js` | the Wires module on the bomb: wire colours and cutting |
| `ButtonModule.js` | The Button on the bomb: colour, label, press and hold, the strip light and the clear cover |
| `KeypadModule.js` | the Keypads module on the bomb: symbols on the keys, key presses and their light bars |
| `PlaceholderModule.js` | stand-in registered for all module types until real ones exist; its green button solves and its red button strikes |
| `rules/` | module rules with no 3D code, so they can be tested without a renderer |

## `src/js/ui/` and `src/js/utils/`

| File | What it does |
| --- | --- |
| `ui/MenuUI.js` | menu buttons and switching between screens |
| `utils/constants.js` | difficulty presets, module IDs and names, game data lists |
| `utils/helpers.js` | random, serial and time-format helpers, and the menu particles |

## `src/css/`

| File | What it does |
| --- | --- |
| `index.css` | design tokens and global styles |
| `animations.css` | shared keyframe animations |
| `menu.css` | main menu and difficulty screen |
| `game.css` | game screen, hint and game-over overlay |

## `tests/`

| File | What it does |
| --- | --- |
| `BombState.test.js` | bomb generation: serial, batteries, indicators, ports, modules, timer slot, widgets |
| `timer.test.js` | timer text and strike speed |
| `ModuleBase.test.js` | module lifecycle, clickable parts, status light and placeholder rules |
| `BombController.test.js` | resetting the bomb between games |
| `WiresRules.test.js` | every Wires rule, wire generation and cutting |
| `ButtonRules.test.js` | tap or hold for every rule, strip digits and release timing |
| `KeypadRules.test.js` | the symbol columns, one-column key sets and the press order |

## Other folders

| File | What it does |
| --- | --- |
| `docs/` | original plans and notes; some are out of date, and `ROADMAP.md` wins where they differ |
| `public/assets/models/` | `.glb` models exported from Blender, loaded by the game |
| `public/assets/keypad/` | the 27 Keypads symbols, drawn from DejaVu fonts, one image each, named as in `rules/KeypadRules.js` |
| `models/` | Blender source files for the models; edit these, then export the `.glb` again |
