# Project layout

Which file controls what, so the project can be understood without reading all of it. Each source file also starts
with a comment saying what it does. ROADMAP.md says what is built and what comes next.

## Project root

| File | What it does |
| --- | --- |
| `index.html` | the game page: the loader (a bomb and fuse, styled inline so it shows at once), canvas container, the title over the desk menu, the game screen's hint, the Enter VR button, and the fade between rooms |
| `manual.html` | the Expert manual page |
| `vite.config.js` | builds both pages, keeping one copy of Three.js for the game and IWSDK |
| `package.json` | scripts and dependencies |
| `package-lock.json` | the exact dependency versions; npm writes it |
| `README.md` | how to set up, run and use the game |
| `ROADMAP.md` | what is built, what comes next, and the decisions behind each step |
| `LAYOUT.md` | this file: which file controls what |
| `AGENTS.md` | for an AI agent working on the project: where to start reading, and the standing rules |
| `CLAUDE.md` | one line, `@AGENTS.md`: Claude Code loads AGENTS.md through it |
| `board/` | the project board (a kanban view of ROADMAP.md): `python board/serve.py` |

## `src/js/`

| File | What it does |
| --- | --- |
| `main.js` | entry point: wires everything together; timer, strikes, game flow, moving between rooms, the alarm clock, input handling and debug keys |

## `src/js/input/`

| File | What it does |
| --- | --- |
| `GameInput.js` | the mouse and VR controllers as game actions (point, press, release, select, back, rotate, grab, drop), each with a ray; everything that reacts to input listens here |

## `src/js/xr/`

| File | What it does |
| --- | --- |
| `VrMode.js` | entering and leaving VR: the Enter VR button where VR is supported, the player standing at real size at each room's desk, where held props go, and the controllers' beams that stop at what they hit |

## `src/js/menu/`

The menu is the Bombs binder and the Menu folder on the desk, not HTML screens, so it can also work in VR.

| File | What it does |
| --- | --- |
| `DeskMenu.js` | the binder, Free Play case and folder on the office desk, the in-game folder on the bomb room's desk, and the binder's results report after a game: hover rim, lifting and opening them, page clicks, the hover highlight over a page, and moving the camera |
| `MenuPages.js` | what the binder and folder pages say and where their clickable lines are: the levels, their facts, the results report, the controls card, the menu, Options and Sound sheets, and the Free Play case's lid, controls and info screen |

## `src/js/manual/`

The Expert manual, a page of its own that never sees a live bomb.

| File | What it does |
| --- | --- |
| `main.js` | runs the manual page: its pages, the style toggle and the print button |
| `ManualContent.js` | everything the manual says; its tables come from the game's rule files |
| `ManualDrawings.js` | the black and white line drawings, mazes and Venn diagram |

## `src/js/three/`

| File | What it does |
| --- | --- |
| `SceneManager.js` | makes the IWSDK world (renderer, scene, camera and render loop), sets the game's look on it, holds the lights (with each room's light strengths), and runs the game's per-frame update as an IWSDK system |
| `BombModel.js` | the 3D bomb: loads the casing, widget and timer models, and builds slots with their empty-slot covers, the timer's digits and strike marks, and side panels |
| `BombController.js` | bomb states and animation: pick up, put down, turning by hand (from GameInput's rotate actions), focus a module, and in VR held in a hand and dropped |
| `Raycaster.js` | hover and clicks on the bomb, along GameInput's ray |
| `ModelLoader.js` | loads and caches `.glb` models exported from Blender, and textures |
| `Drop.js` | something let go of in VR falling to the desk: landing where it comes down (a box on the face nearest down), or going back to its place if it misses |
| `SevenSegment.js` | seven-segment digits and strike marks, drawn for the timer's two screens |
| `DeskClock.js` | the bomb room's alarm clock as an object: picking it up (on screen) or grabbing and dropping it (in VR), its SNOOZE bar, pressing it and putting it down |
| `TextLabel.js` | flat text labels for widgets and modules, and freeing them again |
| `Rooms.js` | the office (menu) and the bomb room (game), their lights and light balance, and the bomb room's desk clock display (its time and flashing), and the scale from real metres to game units |

## `src/js/game/`

| File | What it does |
| --- | --- |
| `BombState.js` | one bomb's random setup and rules state: serial, batteries, indicators, ports, modules, strikes |
| `ModuleBase.js` | base class for 3D modules: lifecycle, housing, status light, clickable `part_` objects, solve and strike |
| `ModuleManager.js` | module type registry; creates a module per slot and routes part clicks and hover to it |
| `WiresModule.js` | the Wires module on the bomb: wire colours and cutting |
| `ButtonModule.js` | The Button on the bomb: colour, label, press and hold, the strip light and the clear cover |
| `KeypadModule.js` | the Keypads module on the bomb: symbols on the keys, key presses and their light bars |
| `SimonModule.js` | the Simon Says module on the bomb: the flashing sequence, button presses and lights |
| `WhosOnFirstModule.js` | the Who's on First module on the bomb: its display and button words, and model names |
| `MemoryModule.js` | the Memory module on the bomb: its display digit, button labels and model names |
| `ComplicatedWiresModule.js` | the Complicated Wires module on the bomb: painted stripes, lights, stars and cutting |
| `WireSequencesModule.js` | the Wire Sequences module on the bomb: panels, wires, numbers, up and down buttons and stage lights |
| `NeedyModule.js` | base class for needy modules: their housing, red countdown, waking, and strikes when time runs out |
| `VentingModule.js` | the Venting Gas needy module on the bomb: the screen's messages and the Y and N keys |
| `CapacitorModule.js` | the Capacitor Discharge needy module on the bomb: the held lever and the meter |
| `KnobModule.js` | the Knob needy module on the bomb: the turning knob, the UP label and the twelve lights |
| `PasswordModule.js` | the Passwords module on the bomb: the letter columns, their buttons and submit |
| `MazeModule.js` | the Mazes module on the bomb: arrow keys, and placing the light, triangle and circles on the grid |
| `MorseModule.js` | the Morse Code module on the bomb: the flashing lamp, frequency display, needle, arrows and TX button |
| `StagedButtonModule.js` | shared by Who's on First and Memory: button presses, stage lights and the change between stages |
| `PlaceholderModule.js` | stand-in with a green solve button and a red strike button; every real module replaces it, so no bomb uses it now, and it can be removed |

## `src/js/game/rules/`

Module rules with no 3D code, so they can be tested without a renderer.

| File | What it does |
| --- | --- |
| `WiresRules.js` | which wire to cut, wire generation and cutting |
| `ButtonRules.js` | tap or hold, strip digits and release timing |
| `KeypadRules.js` | the symbol columns, key sets and press order |
| `SimonRules.js` | the flash-to-button tables, sequences and stages |
| `WhosOnFirstRules.js` | the display table, the label lists, stages and the right button to push |
| `MemoryRules.js` | the stage and display table, stages, and going back to stage 1 on a wrong push |
| `ComplicatedWiresRules.js` | the Venn diagram, wire generation and cutting |
| `WireSequencesRules.js` | the occurrence tables, panel generation, cutting and moving between panels |
| `NeedyTimer.js` | when a needy module wakes, its countdown, and adding time back |
| `VentingRules.js` | the Venting Gas questions and what each answer does |
| `FreePlayRules.js` | Free Play: the case's settings and their limits, the bomb config they make, and the estimated difficulty |
| `AlarmClockRules.js` | when the bomb room's desk clock rings, its beeps and flashing, and snooze |
| `KnobRules.js` | the Knob's light patterns, and reading its position against the UP label |
| `PasswordRules.js` | letter columns that spell one listed word only, cycling and submitting |
| `MazeRules.js` | the nine mazes, puzzle generation and moving the light |
| `MorseRules.js` | the word and frequency table, the Morse chart, the lamp's timing, tuning and transmitting |
| `PanelChange.js` | timing of a Wire Sequences panel change: one motion of the panel sinking under the closing doors, and back |
| `StageChange.js` | timing of a change of stage: buttons down and up one by one, then the display |
| `PlaceholderRules.js` | the placeholder module's solve and strike parts |

## `src/js/audio/`, `src/js/ui/` and `src/js/utils/`

| File | What it does |
| --- | --- |
| `src/js/audio/Sounds.js` | sound effects, all generated with the Web Audio API; add a new sound to `SOUNDS` |
| `src/js/ui/Loader.js` | the loader's spark burning down the fuse as the scene loads, then the blast that shows the scene |
| `src/js/ui/MenuUI.js` | switching between the menu and game screens, and hiding the title while a prop is held up |
| `src/js/utils/constants.js` | difficulty presets, module IDs and names, wire colours, game data lists |
| `src/js/utils/helpers.js` | random, serial and time-format helpers |
| `src/js/utils/settings.js` | the player's options (the sound effect volume and the Free Play case's last settings), kept in this browser |

## `src/css/`

| File | What it does |
| --- | --- |
| `index.css` | design tokens and global styles |
| `animations.css` | shared keyframe animations |
| `menu.css` | the title over the desk menu |
| `game.css` | game screen, hint, the explosion shake, the Enter VR button and the fade between rooms |
| `manual.css` | the Expert manual: its Field manual and Dossier styles, and the planned A4 print layout |

## `tests/`

| File | What it does |
| --- | --- |
| `BombState.test.js` | bomb generation: serial, batteries, indicators, ports, modules, timer slot, widgets |
| `timer.test.js` | timer text and strike speed |
| `ModuleBase.test.js` | module lifecycle, clickable parts, status light and placeholder rules |
| `BombController.test.js` | turning the bomb, and resetting it between games |
| `WiresRules.test.js` | every Wires rule, wire generation and cutting |
| `ButtonRules.test.js` | tap or hold for every rule, strip digits and release timing |
| `KeypadRules.test.js` | the symbol columns, one-column key sets and the press order |
| `SimonRules.test.js` | both Simon Says tables, stages, strikes and flash timing |
| `WhosOnFirstRules.test.js` | the Who's on First tables, the right button and the stages |
| `MemoryRules.test.js` | every stage and display of the Memory table, solving, and the reset on a wrong push |
| `ComplicatedWiresRules.test.js` | all 16 Venn regions, the instructions, generation and cutting |
| `WireSequencesRules.test.js` | all 27 table rows, panel generation, cutting, strikes and moving between panels |
| `Manual.test.js` | every written Wires and Button rule tried against the game, the Venn letters, and the manual's tables |
| `NeedyRules.test.js` | the needy timer, Venting Gas answers, the Knob's patterns and position, and needy modules on a bomb |
| `PasswordRules.test.js` | the word list, one-word columns for all 35 words, cycling and submitting |
| `MazeRules.test.js` | the nine mazes' circles and walls, puzzle generation, moves, strikes and solving |
| `MorseRules.test.js` | the Morse Code tables, the lamp's timing and looping, tuning, and every word on every frequency |
| `PanelChange.test.js` | the timing of a Wire Sequences panel change |
| `StageChange.test.js` | the order and timing of a change of stage |
| `FreePlayRules.test.js` | Free Play's controls and limits, needy modules fitting, hardcore and the difficulty estimate |
| `AlarmClockRules.test.js` | when the desk clock rings, beeps, snoozes and gives up |
| `Drop.test.js` | VR drops: landing where it falls, the hand's motion, landing on the nearest face, and going back when it misses |
| `SevenSegment.test.js` | the timer's digit segments, and laying out minutes or seconds as four digits |
| `Loader.test.js` | where the loader's spark is: following finished loads, never ahead of the minimum time |
| `GameInput.test.js` | mouse buttons and movement as actions: press, release, a right click as back, a right-drag as a turn |
| `MenuPages.test.js` | the binder's levels, their facts and briefs, the results report, the menu sheets' choices, volume steps, and finding the clicked line on a page |
| `Sounds.test.js` | sounds stay safe without browser audio, and every Simon Says colour has a tone |

## Other folders

| File | What it does |
| --- | --- |
| `docs/` | original plans and notes; some are out of date, and `ROADMAP.md` wins where they differ |
| `public/assets/models/` | `.glb` models exported from Blender, loaded by the game |
| `public/assets/keypad/` | the 27 Keypads symbols, drawn from DejaVu fonts, one image each, named as in `rules/KeypadRules.js` |
| `models/` | Blender source files for the models: `bomb_casing.blend` for the bomb and modules, `office.blend` for the office (collection `office`), the binder, Free Play case and folder (collection `menu`) and the bomb room (collection `bombroom`); edit these, then export the `.glb` again |
