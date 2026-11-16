# Talk to Defuse roadmap

The plan for this project: what is built, what comes next and why. The project board (`board/`) shows it as a kanban
board: `python board/serve.py`. Format: `board/FORMAT.md`. Last updated 16 November 2026.

## About the project

A browser game inspired by Keep Talking and Nobody Explodes: one player defuses a 3D bomb, another reads the manual, and they talk it through.

The Defuser sees the bomb and the Expert sees only the manual, so everything the Expert learns has to be said aloud. The aim is the full game: all 14 modules as real 3D objects on the bomb, an Expert manual, built-in voice chat with room codes, and sound and polish.

All game logic runs in the Defuser's browser, with no game server. Voice chat is peer-to-peer through PeerJS, and the only outside service is the one that helps the two browsers find each other.

## Schedule

**Schedule:** start 2026-10-31 · end 2027-07-17 · 260 days, 80 working days (7 days a week) · effort S=1 M=1.5 L=2 XL=4.5 working days · off 2026-11-02, 2026-11-03, 2026-11-04, 2026-11-05, 2026-11-06, 2026-11-09, 2026-11-10, 2026-11-11, 2026-11-12, 2026-11-13, 2026-11-16, 2026-11-17, 2026-11-18, 2026-11-19, 2026-11-20, 2026-11-23, 2026-11-24, 2026-11-25, 2026-11-26, 2026-11-27, 2026-11-30, 2026-12-01, 2026-12-02, 2026-12-03, 2026-12-04, 2026-12-07, 2026-12-08, 2026-12-09, 2026-12-10, 2026-12-11, 2026-12-14, 2026-12-15, 2026-12-16, 2026-12-17, 2026-12-18, 2026-12-21, 2026-12-22, 2026-12-23, 2026-12-24, 2026-12-25, 2026-12-28, 2026-12-29, 2026-12-30, 2026-12-31, 2027-01-01, 2027-01-04, 2027-01-05, 2027-01-06, 2027-01-07, 2027-01-08, 2027-01-11, 2027-01-12, 2027-01-13, 2027-01-14, 2027-01-15, 2027-01-18, 2027-01-19, 2027-01-20, 2027-01-21, 2027-01-22, 2027-01-25, 2027-01-26, 2027-01-27, 2027-01-28, 2027-01-29, 2027-02-01, 2027-02-02, 2027-02-03, 2027-02-04, 2027-02-05, 2027-02-08, 2027-02-09, 2027-02-10, 2027-02-11, 2027-02-12, 2027-02-15, 2027-02-16, 2027-02-17, 2027-02-18, 2027-02-19, 2027-02-22, 2027-02-23, 2027-02-24, 2027-02-25, 2027-02-26, 2027-03-01, 2027-03-02, 2027-03-03, 2027-03-04, 2027-03-05, 2027-03-08, 2027-03-09, 2027-03-10, 2027-03-11, 2027-03-12, 2027-03-15, 2027-03-16, 2027-03-17, 2027-03-18, 2027-03-19, 2027-03-22, 2027-03-23, 2027-03-24, 2027-03-25, 2027-03-26, 2027-03-29, 2027-03-30, 2027-03-31, 2027-04-01, 2027-04-02, 2027-04-05, 2027-04-06, 2027-04-07, 2027-04-08, 2027-04-09, 2027-04-12, 2027-04-13, 2027-04-14, 2027-04-15, 2027-04-16, 2027-04-19, 2027-04-20, 2027-04-21, 2027-04-22, 2027-04-23, 2027-04-26, 2027-04-27, 2027-04-28, 2027-04-29, 2027-04-30, 2027-05-03, 2027-05-04, 2027-05-05, 2027-05-06, 2027-05-07, 2027-05-10, 2027-05-11, 2027-05-12, 2027-05-13, 2027-05-14, 2027-05-17, 2027-05-18, 2027-05-19, 2027-05-20, 2027-05-21, 2027-05-24, 2027-05-25, 2027-05-26, 2027-05-27, 2027-05-28, 2027-05-31, 2027-06-01, 2027-06-02, 2027-06-03, 2027-06-04, 2027-06-07, 2027-06-08, 2027-06-09, 2027-06-10, 2027-06-11, 2027-06-14, 2027-06-15, 2027-06-16, 2027-06-17, 2027-06-18, 2027-06-21, 2027-06-22, 2027-06-23, 2027-06-24, 2027-06-25, 2027-06-28, 2027-06-29, 2027-06-30, 2027-07-01, 2027-07-02, 2027-07-05, 2027-07-06, 2027-07-07, 2027-07-08, 2027-07-09, 2027-07-12, 2027-07-13, 2027-07-14, 2027-07-15, 2027-07-16, 2027-07-19, 2027-07-20, 2027-07-21, 2027-07-22, 2027-07-23, 2027-07-26, 2027-07-27, 2027-07-28, 2027-07-29, 2027-07-30, 2027-08-02, 2027-08-03, 2027-08-04, 2027-08-05, 2027-08-06, 2027-08-09, 2027-08-10, 2027-08-11, 2027-08-12, 2027-08-13, 2027-08-16, 2027-08-17, 2027-08-18, 2027-08-19, 2027-08-20, 2027-08-23, 2027-08-24, 2027-08-25, 2027-08-26, 2027-08-27, 2027-08-30, 2027-08-31, 2027-09-01, 2027-09-02, 2027-09-03, 2027-09-06, 2027-09-07, 2027-09-08, 2027-09-09, 2027-09-10, 2027-09-13, 2027-09-14, 2027-09-15, 2027-09-16, 2027-09-17, 2027-09-20, 2027-09-21, 2027-09-22, 2027-09-23, 2027-09-24, 2027-09-27, 2027-09-28, 2027-09-29, 2027-09-30, 2027-10-01, 2027-10-04, 2027-10-05, 2027-10-06, 2027-10-07, 2027-10-08, 2027-10-11, 2027-10-12, 2027-10-13, 2027-10-14, 2027-10-15, 2027-10-18, 2027-10-19, 2027-10-20, 2027-10-21, 2027-10-22, 2027-10-25, 2027-10-26, 2027-10-27, 2027-10-28, 2027-10-29

## How we work

- **Statuses:** Not started → Next → In progress → Done YYYY-MM-DD. "Built, waiting for …" while something outside
  the code is pending (a test, a review). On hold (with a "Step N is **on hold**" note saying why).
- **Dates:** each step's Due date comes from its effort size and its order (`roadmap.py schedule`). When a step slips,
  the steps after it are rescheduled and the change is noted under the phase's decisions.
- **Working days are Saturday and Sunday.** Extra days in the week simply bring the dates forward. The Schedule line
  says 7 days a week and lists every weekday as off, because that is how `roadmap.py` counts weekends.
- **Decisions** are recorded under each phase, with the date, so the reasons stay with the plan.

## Phase A: the 3D foundation (already built)

The menus, the 3D bomb and the core game loop. Done dates are the date of the initial commit.

| # | Feature | Effort | Due | Status |
| --- | --- | --- | --- | --- |
| 1 | **Menus and design system.** Main menu, difficulty selection, CSS tokens and animations. | M | 2026-10-25 | Done 2026-10-25 |
| 2 | **3D bomb and room.** Bomb casing, 11 module slots plus the timer slot, side panels, desk and lighting. | L | 2026-10-25 | Done 2026-10-25 |
| 3 | **Bomb handling.** Pick up, rotate by dragging, put down, and turn to face a module. | M | 2026-10-25 | Done 2026-10-25 |
| 4 | **Random bomb generator.** Serial number, batteries, indicators, ports and module assignment. | M | 2026-10-25 | Done 2026-10-25 |
| 5 | **Countdown and strikes.** Wall-clock timer on the bomb, strike lights, and a faster timer after each strike. | M | 2026-10-25 | Done 2026-10-25 |
| 6 | **Game over and replay.** Explosion and defused screens with stats, Play Again and Back to Menu. | S | 2026-10-25 | Done 2026-10-25 |

Decisions for Phase A:

- Rotate the bomb, not the camera (recorded in the code): the player handles the bomb as a held object. No on-screen HUD: the timer and strikes are on the bomb itself.
- Vanilla JavaScript, Three.js and Vite, with no UI framework and no game server (recorded in `docs/implementation_plan.md`).

## Phase B: fix the foundation

Every problem found in the code review fixed, and a 3D module system ready for real modules to plug into.

| # | Feature | Effort | Due | Status |
| --- | --- | --- | --- | --- |
| 7 | **Expert bombs can be finished.** All 11 assigned modules land on real slots; `back-4` is the timer and is never assigned. | S | 2026-10-31 | Done 2026-10-31 |
| 8 | **Clicks do one thing.** A click on a module focuses it without pressing it, a drag never counts as a click, and clicks on a focused module reach that module. | M | 2026-11-01 | Done 2026-10-31 |
| 9 | **Timer reads correctly.** No wrong time at minute boundaries (now 1:59.5 shows `1:00` and 0:59.5 shows `0:00`). | S | 2026-11-07 | Done 2026-10-31 |
| 10 | **Debug keys are development only.** `T`, `K`, `G` and `W` do nothing in a production build. | S | 2026-11-08 | Done 2026-10-31 |
| 11 | **One source for game data.** Remove the duplicate generators and lists, settle on one set of module IDs, and delete `CameraController.js` and the leftover Vite template assets. | S | 2026-11-14 | Done 2026-10-31 |
| 12 | **Bomb info is readable.** The casing shows the real battery count, every port, and every indicator with its label and lit state. | M | 2026-11-15 | Done 2026-10-31 |
| 13 | **Automated tests run.** A test runner is set up with `npm test`, starting with bomb generation and timer maths. | S | 2026-11-21 | Done 2026-10-31 |
| 40 | **Blender pipeline works.** Blender MCP is connected, modelling can be watched live in Blender, and a test model exports as `.glb` and appears on the bomb in the game. | S | 2026-11-28 | Done 2026-10-31 |
| 41 | **Bomb casing modelled in Blender.** The primitive casing, side panels and details are replaced by a Blender model, with slots, timer and strikes still working. | M | 2026-11-28 | Done 2026-10-31 |
| 42 | **Casing restyled from the reference.** Pale blue-silver rim with rounded corners, a deep dark tray, slim bars, and orange side latches, at the same size. | M | 2026-11-28 | Done 2026-10-31 |
| 43 | **Timer can be in any slot.** Each bomb picks a random slot for the timer, as in the original game, and modules fill the rest. | S |  | Done 2026-10-31 |
| 14 | **3D module system.** A module is a 3D object in its slot with clickable parts, with rules kept separate from the 3D so they can be tested. | L | 2026-12-05 | Done 2026-11-01 |
| 15 | **Clean replay.** A new game leaves nothing behind from the last one, including when moving to an easier difficulty. | S | 2026-12-06 | Done 2026-11-01 |

Step 14 is built in parts:

| Part | What | Effort | Due | Status |
| --- | --- | --- | --- | --- |
| 14a | Module lifecycle that sets up its own data before building or drawing, replacing the canvas `ModuleBase`. | S | 2026-11-29 | Done 2026-11-01 |
| 14b | Clicking and hovering on individual 3D parts of a module. | M | 2026-11-29 | Done 2026-11-01 |
| 14c | Shared module housing with a status light for solved and strike, plus a 3D placeholder module. | S | 2026-12-05 | Done 2026-11-01 |

Decisions for Phase B:

- Modules are real 3D, like the original game (2026-10-31, the user's decision): wires, buttons and displays are 3D objects on the bomb, replacing both the canvas textures in the code and the HTML overlays in `docs/implementation_plan.md` and `docs/task.md`. Each module is larger as a result, and the sizes below allow for it.
- Blender Lab's official MCP is used (2026-10-31): the user already had its `mcp` extension, and it has no telemetry or third-party asset services, unlike the `ahujasid` server tried first.
- The bomb casing is modelled in Blender too (2026-10-31, the user's decision), replacing the primitives. It goes before the module system so modules are fitted to the final slots.
- `references/` is a style reference only (2026-10-31, the user's decision): match its look, not its measurements, and keep it out of git. The timer's slot is random on each bomb, as in the original.
- Bomb details are randomly placed 3D widgets on the sides, as in the original (2026-10-31), with batteries as holders of one D cell or a pair of AA, so a bomb has 0 to 4 batteries.
- Module models are made in Blender through Blender MCP (2026-10-31, the user's decision), and the user watches the modelling live in Blender. Each module's step includes its model, exported as `.glb`.
- All assets are made for this project, with nothing taken from the original game (2026-10-31, confirmed by the user).
- Rescheduled (2026-10-31): the user cut the plan to 60 working days on Saturdays and Sundays, with the full scope kept. Effort sizes went from S=1 M=3 L=5 XL=10 to S=1 M=1.5 L=2 XL=4.5, and the end moved from 2028-01-10 to the date in the Schedule line.
- Module rules live in `src/js/game/rules/`, and Blender objects named `part_<id>` become clickable parts (2026-11-01). The placeholder has green solve and red strike buttons, so a full game can be played before real modules exist.
- The review's render-before-setup bug is fixed by step 14a rather than on its own, because that step replaces the code it lives in.

## Phase C: the first playable bomb

A real game: four 3D modules, won or lost by playing, with core sound effects.

| # | Feature | Effort | Due | Status |
| --- | --- | --- | --- | --- |
| 16 | **Wires.** 3 to 6 coloured 3D wires that cut visibly, following the full manual rules. | L | 2026-12-13 | Done 2026-11-01 |
| 17 | **The Button.** A 3D button with press or hold logic, and a coloured strip that sets the release digit. | L | 2026-12-20 | Done 2026-11-02 |
| 18 | **Keypads.** Four symbol keys pressed in the correct column order. | M | 2026-12-26 | Done 2026-11-02 |
| 44 | **Ports match the manual.** DVI-D, Parallel and Serial get their D-shaped shells and correct pin rows, RJ-45 its notch at the bottom, and Stereo RCA its stacked jacks. | S | 2026-12-26 | Done 2026-11-02 |
| 45 | **Controls match the original.** Left click selects, right click deselects, and holding right click rotates the bomb, even during a Button hold. | S | 2026-12-26 | Done 2026-11-02 |
| 19 | **Simon Says.** Four lit buttons with growing sequences, mapped by strikes and serial vowels. | L | 2027-01-02 | Done 2026-11-02 |
| 20 | **Core sound effects.** Timer tick, strike, solve, explosion, and button and wire sounds. | M | 2027-01-09 | Done 2026-11-02 |

Decisions for Phase C:

- Module parts can be held (2026-11-01): a module returns true from `onPartPress` to keep a part until the mouse is released, anywhere on the screen. Deselecting waits for the release, and leaving the browser window counts as a release.
- Controls match the original game's options screen (2026-11-01, the user's decision): left click selects, right click deselects, and holding right click rotates. Rotating keeps the selected module, so a Button can be held while the bomb turns. Buttons can land on either face, as in the original, so the timer may need finding during a hold.
- A press of 0.5 seconds or more counts as a hold, and the strip lights at that point (2026-11-01). The strip's colour is picked again on each press, so a retry after a strike can need a different digit.
- The Button has a clear hinged cover, from the user's reference (2026-11-01). It opens by itself while the module is focused, and it never blocks clicks.
- The 27 Keypads symbols are Unicode characters drawn from the free DejaVu fonts (2026-11-01, the user's decision), not images copied from the original manual, because the repo is public. Their shapes stay close enough that the original manual still works. Each was compared with the manual's symbol, and step 29 must use these same images. The column table was read from the manual by matching each cell against its symbols.
- A Keypads bomb only uses symbol sets that one column holds (2026-11-01), because some sets of four fit two columns. A wrong press strikes but keeps the keys already pressed.
- Simon Says has 3 to 5 stages (2026-11-02), which is my memory of the original: the manual doesn't give a number. A wrong press strikes and restarts the current stage's entry, and keeps the flashes. The strike count is read on every press, so a strike anywhere on the bomb changes the table straight away.
- Simon Says buttons glow in their own colour on hover (2026-11-02), not the usual blue, which would look like a flash. The sequence flashes all the time, selected or not, and pauses for 4 seconds after a press, or 1 second after a finished stage.
- Sounds are generated in code with the Web Audio API (2026-11-02), so the game ships no audio files and copies none. They stay at a moderate volume so the players can hear each other. There is no volume or mute control until Settings (step 37).
- Simon Says flashes only beep while the module is selected (2026-11-02), so an unattended module doesn't talk over the players. Button presses always beep. Keypads use the press sound for now; unique sounds per module wait for step 36.
- Ports follow the manual's Appendix C (2026-11-01). PS/2 stayed as it was: it is the only round plug with a ring of pins, though it lacks the manual's top notch and centre key.

## Phase D: the complete game for two people

All 14 modules, the Expert manual and custom games. Two people can play fully at this point, using any voice call.

| # | Feature | Effort | Due | Status |
| --- | --- | --- | --- | --- |
| 21 | **Who's on First.** Display word, position and label lookup over 3 stages. | M | 2027-01-10 | Done 2026-11-02 |
| 22 | **Memory.** 5 stages whose rules depend on earlier answers. | M | 2027-01-17 | Done 2026-11-02 |
| 23 | **Morse Code.** A blinking light, a frequency dial and a transmit button. | L | 2027-01-24 | Done 2026-11-02 |
| 24 | **Complicated Wires.** Wires with lights, stars and colours, decided by the Venn diagram rules. | L | 2027-01-31 | Done 2026-11-02 |
| 25 | **Wire Sequences.** Panels of wires revealed in turn, cut by lookup table. | L | 2027-02-07 | Done 2026-11-02 |
| 26 | **Mazes.** 9 mazes with invisible walls, navigated by arrow buttons. | L | 2027-02-14 | Done 2026-11-02 |
| 27 | **Passwords.** Spinning letter columns and a submit button. | M | 2027-02-20 | Done 2026-11-02 |
| 28 | **Needy modules.** The three modules that demand attention throughout the game. | XL | 2027-03-07 | In progress: built; the user will check the needy behaviour against the original |
| 29 | **Expert manual.** A web manual for every module and appendix, wired to the menu button. | XL | 2027-03-21 | In progress: the user is reviewing the wording and choosing a page style |
| 30 | **Custom games.** Choose the timer, modules, needy modules and hardcore in the Free Play case. | M | 2027-03-28 | Done 2026-11-13 |

Step 28 is built in parts:

| Part | What | Effort | Due | Status |
| --- | --- | --- | --- | --- |
| 28a | Needy module timing: activating, counting down, and causing strikes. | M | 2027-02-27 | In progress |
| 28b | Venting Gas. | S | 2027-02-28 | In progress |
| 28c | Capacitor Discharge. | M | 2027-03-06 | In progress |
| 28d | Knob. | M | 2027-03-07 | In progress |

Step 29 is built in parts:

| Part | What | Effort | Due | Status |
| --- | --- | --- | --- | --- |
| 29a | Manual layout: styled, one long page, and printable. | M | 2027-03-13 | In progress |
| 29b | Instructions for all 11 standard modules. | L | 2027-03-20 | In progress |
| 29c | Needy modules and the appendices for indicators, batteries and ports. | S | 2027-03-21 | In progress |
| 29d | A full check that every instruction matches the module's real rules. | S | 2027-03-21 | In progress |

Decisions for Phase D:

- Who's on First buttons always come from one of the manual's two word groups (2026-11-02). Each list only names its own group, so this is how the lists are built, though the manual doesn't say it and it is my memory of the original.
- A wrong Who's on First press strikes, keeps the finished stages and brings new words (2026-11-02). This is also from memory.
- Each module's Blender objects get names of their own, such as `part_mem_0` (2026-11-02). All modules share one `.blend`, where object names must be unique: a repeated `part_btn_0` silently becomes `part_btn_0.001`, and the game can't find it.
- A wrong Memory push strikes and goes back to stage 1 with new digits, as the manual says, and the stage lights go out (2026-11-02).
- Each module is modelled from a reference image in `references/`, asked for before modelling starts (2026-11-02). Simon Says, Who's on First, Memory and the first Morse Code were built without one. Morse Code, Who's on First and Memory have since been remodelled from theirs; the original's silver module frame and raised status light are shared by every module and are not done.
- All labelled buttons share one cream colour, on Keypads, Morse Code's TX, Who's on First and Memory (2026-11-02). The original's are tan; the user chose cream as a small difference from it.
- A Complicated Wires module has 4 to 6 wires and always at least one to cut, or it couldn't be solved (2026-11-02). The manual gives neither rule; the count comes from the six modules in the user's reference, none of which has fewer than 4. Its star tiles are cream, to match the buttons.
- Wire Sequences has 4 panels of 1 to 3 wires, with numbers running on from panel to panel (2026-11-02); the user's references show the 4 stage lights and the numbers. Leaving a panel with a wire uncut that needed it is a strike and stays on that panel, and passing the last panel solves it. The manual only warns against leaving early, so the strike and the solve are from my memory of the original. A panel change is one motion, as the user saw in the original: as the panel sinks, two doors slide out from top and bottom and fold over it at the same time, then all of it reverses with the next panel. The timings and the door's lean are my choice.
- The manual has two styles and a toggle: Field manual and Dossier (2026-11-02). The user liked both. The Dossier adds handwritten notes that give advice only, never a rule. Stains, tape and paper stay on screen; a print is clean black ink in the chosen style's fonts.
- The printed manual is planned as 15 numbered A4 sheets, with short sections sharing a sheet and no half-empty pages (2026-11-02), because the user found blank space in the first print.
- The Expert manual has no search and no page list (2026-11-02). The user removed them: having to scroll or leaf through it under pressure is part of the game. It can still be printed.
- The Expert manual keeps the original's rules, tables, mazes and Venn diagram, in our own words and design, with black and white line drawings (2026-11-02). The user asked to see every changed sentence: the list is `references/manual-wording-changes.md`, kept out of git because it quotes the original. Tables come from the game's rule files, and written rules are tested against the game. Three sentences differ to match our game: strikes by difficulty, where the strike marks are, and how needy modules wake.
- Needy modules count towards a difficulty's module total: Easy 0, Medium 1, Hard 1, Expert 2 (2026-11-02). They can't be solved and don't count towards a win. The number on each difficulty is my choice, and it means Expert has 9 modules to solve, not 11.
- Needy timing is my choice, as the manual gives none (2026-11-02): each wakes 30 to 60 seconds in, then 20 to 45 seconds after each rest, with 45 seconds to tend Venting Gas and Capacitor and 40 for Knob. Timer runs on game time at normal speed, so strikes don't hurry it.
- Needy behaviour may change by level in the original, and the user will check it (2026-11-02); until then all levels behave the same. The manual doesn't cover this behaviour, so it is from my memory of the original: no to VENT GAS only warns, yes to DETONATE strikes, a full discharge rests the Capacitor, and the Knob is judged once, at zero.
- Slots with no module are covered by an orange ribbed plate with brown corner rivets, as in the original (2026-11-02). The user asked for this before the needy modules; it comes from `references/keypad ref 2.jpeg` and the Who's on First reference.
- Each Passwords column has 6 letters in random order, and a wrong submit strikes and keeps the letters (2026-11-02). The column size is from the original's look and my memory of it; the manual only says one combination matches a word, so generation retries until it does.
- The nine mazes were read from the lines in the manual's PDF, not typed from the picture (2026-11-02). Walking into a wall is a strike and the light stays; pressing towards the edge of the grid does nothing. The manual doesn't cover the edge, so that is from my memory of the original. The light and triangle start at least 4 steps apart, which is my choice.
- The Morse Code dial steps through the manual's 16 frequencies and stops at each end, starting on 3.505 MHz (2026-11-02). This is from memory of the original; the manual's picture shows 3.500, which isn't a frequency in its table.
- Morse Code flashes last 0.25 and 0.75 seconds, with gaps of 0.25 within a letter, 0.75 between letters and 3 before the word repeats (2026-11-02). The manual only says short, long and very long, so these are my choice, and the lamp is silent.
- Who's on First and Memory change stage as the original does, seen by the user in a stream (2026-11-02): the display clears, the buttons sink one by one, the labels change while they are hidden, the buttons rise one by one, and the display comes back last. Buttons ignore clicks until then. The change takes 1.0 second on Memory and 1.4 on Who's on First; those timings are my choice.
- Custom games are a Free Play case on the office desk, from the user's references (2026-11-13): time from 1 to 10 minutes in half minutes, 1 to 11 modules, needy modules on or off (one, or two on bombs of six modules or more, always fitting the 11 slots), and Hardcore, where one strike explodes the bomb (from my memory of the original). Its screen explains each control in our words, and the Estimated Difficulty gauge is our own estimate from modules per minute, needy and hardcore. The case remembers its last settings in the browser. The case opens like a briefcase, its lid hinged on the long back edge, and is held with that hinge upright so its two panels stand side by side (2026-11-13, the user's correction). Sharing a seed for the same bomb moved to Later (2026-11-13, the user's decision): it isn't in the original, and nothing depends on it.
- The timer is a modelled module like the original's (2026-11-13, from `references/Original game bomb reference.png`): no module frame, a raised silver box with red seven-segment digits whose unlit segments show faintly, a small strike box with two X marks above it, and a round speaker. It shows 05:00 style minutes, and seconds with hundredths in the last minute if the game sends them.

## Phase G: VR

The Defuser can play in a VR headset, as well as on a computer, in the same game. An Expert in the same room can read the manual aloud, so VR doesn't need voice chat.

| # | Feature | Effort | Due | Status |
| --- | --- | --- | --- | --- |
| 46 | **VR mode (WebXR).** An Enter VR button for the Defuser, who picks up the bomb, turns it and uses the modules with controllers and hands, built with Meta's Immersive Web SDK (IWSDK) and tested on the connected headset. The mouse game keeps working exactly as it does now. | 15d | 2027-05-22 | Not started |

Step 46 is built in parts:

| Part | What | Effort | Due | Status |
| --- | --- | --- | --- | --- |
| 46a | Move the game onto IWSDK and its Three.js build, with the desktop game unchanged. | M | 2027-04-04 | Done 2026-11-13 |
| 46b | Separate input from the mouse, so clicks and VR drive the same game actions. | M | 2027-04-10 | Done 2026-11-13 |
| 46c | Enter and leave VR, from the menu and during a game, with the button only on supported devices. | S | 2027-04-11 | Done 2026-11-16 |
| 46d | The VR room: desk height, where the player stands, and real-world scale. | M | 2027-04-18 | Done 2026-11-16 |
| 46e | Pick up, hold and rotate the bomb with controllers and with hands. | M | 2027-04-24 | In progress |
| 46f | Use every module with controllers and hands, including held parts, wires, dials and small buttons. | L | 2027-05-01 | In progress |
| 46g | A new menu matching the original game's, shared by the browser and VR, with difficulty, hints and game over. | L | 2027-05-08 | Done 2026-11-13 |
| 46h | Sound placed in the room, and vibration on presses and strikes. | S | 2027-05-09 | Not started |
| 46i | Headset performance: frame rate, shadows and sharp text. | M | 2027-05-16 | Not started |
| 46j | A full play test on the headset, with an Expert in the same room. | S | 2027-05-22 | Not started |

Decisions for Phase G:

- VR is part of the same game, not a separate mode (2026-11-02, the user's decision). One site, with an Enter VR button on the menu and during a game. Mouse clicks and VR must both work, so every step from here keeps the browser game working.
- Use IWSDK, not plain Three.js VR (2026-11-02, the user's decision). It gives ready-made grabbing, pointers and panels, so the whole game moves onto its Three.js build and dev tools in part 46a.
- The menu is redesigned to match the original game's, and the same menu serves the browser and VR (2026-11-02, the user's decision). HTML screens can't appear in VR, so this replaces them. It needs reference images of the original menu before part 46g.
- Part 46g starts early, before 46a (2026-11-13, agreed with the user). The menu is built as 3D objects in the current Three.js, so it moves to IWSDK with the rest of the game. It copies the original's idea: an office seen from a chair, a Bombs binder whose contents page lists the levels, and a Menu folder with the controls and options. The models and page text are our own.
- The game is called Talk to Defuse (2026-11-13, the user's choice). The original's name stays out of the title and the menu; the docs say the game is inspired by it.
- The title shows over the desk view in the browser only (2026-11-13, the user's decision). A browser page feels empty without one; a standalone or VR view doesn't need it.
- The title font is Special Elite, a free Google Font (Apache 2.0), not the original's font (2026-11-13). The hint line sits at the bottom of the screen (the user's choice).
- All four levels are open from the start, with no ticks for beaten levels (2026-11-13, the user's decision).
- First pass of 46g done (2026-11-13): the office room, the binder with its contents and level pages, and the folder with the controls card and the Expert Manual. The game is played in a separate dark bomb room, as in the original, with a fade between the rooms and a desk clock showing the real time (2026-11-13, from the user's reference). The Menu folder also lies on the bomb room's desk as the in-game menu: Restart this bomb and Back to the office, without the Expert Manual (the user's decision); the timer keeps running while it is open (2026-11-13, the user's decision to add it; running timer is my choice). The bomb room's light is soft and even, with its own light balance, and its back wall has an alarm light, a speaker and conduit from the user's second reference (2026-11-13). The desk clock's alarm rings now and then as a distraction, like the original: click it to snooze, or it stops after 30 seconds; it never causes a strike (2026-11-13, the user's request; the timing is my choice). The clock is picked up before snooze can be pressed, as in the original: a click lifts it (putting the bomb down), and right click, Esc or a click off the clock puts it back (2026-11-13, the user's description). The game-over overlay is replaced by a results report in the binder over a black screen, with Back and Retry, from the user's reference (2026-11-13). Options in the office folder has Sound, with the sound effect volume saved in the browser; Music, Graphics, Vibration, Leaderboards and Credits are left out until the game has something behind them (2026-11-13, my call from the user's reference). The binder has real rings (2026-11-13). The report names the module whose strike set the bomb off (2026-11-13, the user's request).
- Controllers and hands both come in the first version (2026-11-02, the user's decision), as IWSDK supports both.
- The first VR version has the Expert in the same room, with voice chat from the headset later as step 47 (2026-11-02, agreed with the user).
- VR comes before voice chat and release (2026-11-02, the user's decision, replacing the earlier plan to do it after release). Voice chat and release move back eight weekends, and the end date moves from 2027-06-06 to 2027-07-17.
- Part 46a done (2026-11-13): `three` is now `super-three` 0.181 (pinned with an npm override so IWSDK and the game share one copy), with `@iwsdk/core` 1.0.1 and Vite 7. `SceneManager` gets the renderer, scene, camera and loop from `World.create` and sets the game's tone mapping, shadows, background and lights on them, so the look is unchanged; the game's update runs as an IWSDK system. IWSDK's canvas pointer events, spatial UI, locomotion and grabbing are off, and XR is enabled but not offered. The game keeps importing `three` (the same copy IWSDK uses) instead of rewriting every import to `@iwsdk/core`. The IWSDK CLI dev server and its Vite plugin are left for part 46c, when the headset is first needed; `npm run dev` is still plain Vite.
- Part 46b done (2026-11-13): `GameInput` turns the mouse and VR controllers into the same actions, each carrying a ray: point, press, release, select, back and rotate. The bomb's raycaster, `main.js`, the desk menu and the desk clock all listen there instead of to the mouse. Mouse: left button press, release and click; a right click is back, a right-drag turns the bomb; Esc is back. VR (my first mapping, to be tried on the headset from part 46c): the trigger is press, release and select along that hand's ray, B or Y is back, and the thumbstick turns the held bomb; picking the bomb up by hand comes in 46e.
- A loader covers the page while the 3D scene loads (2026-11-13, the user's request): a bomb with a fuse, the spark burning towards it as the world, rooms and desk props load, then the bomb blasts in a flash that fades to the office. It is in `index.html` itself, so it shows before any script runs, and it shows for at least 1.6 seconds so the spark is seen.
- Part 46c (2026-11-13): the Enter VR button shows only when `navigator.xr` supports immersive VR, at the bottom right on the menu and during a game; Leave VR is added to both folders' menus in VR. In VR the player's rig is scaled by ROOM_SCALE (8), so the rooms are real size, and stands on the floor behind the desk of the room showing, moving with the room. Held props and the clock come to the player's eyes. Headset testing uses `adb reverse` and Meta's `metavr capture screenshot` (from the TCS project), as plain screencap is blank on the Quest; IWSDK's managed dev server isn't needed for this.
- VR interaction, tried on the headset with the user (2026-11-16):
  - Each controller has a beam that stops at the first surface it meets, with a dot there (the user's request: a pointer was needed to aim).
  - The grip grabs the bomb or the alarm clock only when the hand is within about 10 cm of it, never from afar (the user's decision), and keeps the pose it was grabbed in, with no snap. Let go, it falls with the hand's motion; on the desk the bomb settles onto whichever face is nearest facing down, turning only as much as that takes, and anything that misses the desk goes back to its place (the user's decisions). With the bomb in a hand, the other hand's trigger works the modules straight away, with no focus step. The thumbstick no longer turns the bomb.
  - The alarm clock is grabbed like the bomb, and the trigger on its snooze bar snoozes it, on the desk or in the hand (the user's request).
  - In VR the bomb room's folder and the clock come to the same reading distance as the office props, at full size (the user found them too close).
  - Hover on the desk props' pages is a highlight shape over the page (a highlighter-yellow fill, or a frame round dark buttons), not a redraw of the page: measured on the headset, each redraw cost about two frames in the bomb room, which showed as flicker, and the highlight costs none.
  - The levels get the highlight, and a level's page has BACK and START stamps (the user's request).
  - Testing from the laptop: `metavr capture screenshot` for the headset's view, and remote debugging of the Quest browser (`adb forward tcp:9222 localabstract:chrome_devtools_remote`) to read the game's state and measure frame times. The dev server listens on 127.0.0.1, which `adb reverse` reaches.
- Still to do in 46e and 46f: hand tracking (no controllers), and checking every module's small parts with the beam.
- Check VR directly on the headset connected to the laptop (2026-11-02, the user's way of working): the user's TCS CSR Family Day VR project already does this. It uses the `iwsdk-runtime`, `iwsdk-reference` and `metavr` MCP servers in `.mcp.json`, adb over USB with `adb reverse tcp:8081 tcp:8081`, and `runtime pair-headset`. Copy that setup from its `AGENTS.md` and `DESIGN.md`. The agent checks in the headset, then the user reviews.

## Phase E: voice chat and rooms

Two players in different places connect with a room code and talk in the browser, even across countries.

| # | Feature | Effort | Due | Status |
| --- | --- | --- | --- | --- |
| 31 | **Rooms.** Create a room, join with a code, and see the connection status. | L | 2027-05-30 | Not started |
| 32 | **Roles and lobby.** Pick Defuser or Expert; the game starts when both are ready, and each sees only their own view. | M | 2027-06-05 | Not started |
| 33 | **Voice chat.** Microphone audio with mute, a volume indicator, and a relay server for networks that block direct connections. | L | 2027-06-12 | Not started |
| 47 | **Voice chat in VR.** The headset's microphone and speakers work in rooms, so a VR Defuser and a remote Expert can talk. | S | 2027-06-13 | Not started |

Decisions for Phase E:

- The Expert gets no live bomb data, only what the Defuser says aloud (recorded in `docs/implementation_plan.md`): this is the core of the game.

## Phase F: polish and release

The game feels finished, works across browsers, and is ready to deploy.

| # | Feature | Effort | Due | Status |
| --- | --- | --- | --- | --- |
| 34 | **Visual polish.** Better materials, a richer room, and sparks, smoke and confetti. | L | 2027-06-19 | Not started |
| 35 | **Animation and tension.** Screen transitions, solve animations, a pulsing low timer, and the lights-out event. | M | 2027-06-26 | Not started |
| 36 | **Full sound design.** Ambient tension, music, and unique sounds for each module. | L | 2027-07-03 | Not started |
| 37 | **Settings and How to Play.** Audio and graphics settings, a colour-blind mode, and a tutorial, wired to the menu buttons. | M | 2027-07-04 | Not started |
| 38 | **Statistics.** Games played, win rate and best times, saved in the browser. | S | 2027-07-10 | Not started |
| 39 | **Release.** Tested on Chrome, Firefox, Edge and Safari, performance checked, and a production build ready to deploy. | L | 2027-07-17 | Not started |

## Later

- Mobile touch controls for the Defuser.
- Key rebinding.
- Move to TypeScript.
- A text chat fallback for when voice isn't available.
- Live sync between players (visible actions, shared timer): the plan marks this optional, and it isn't needed for the game to work.
- Push-to-talk.
- A seed: a short code that rebuilds exactly the same bomb, so two Defuser teams can play an identical one (moved from step 30 on 2026-11-13).

## Risks and open questions

- **The 60-day plan is tight.** Sizes were halved with the scope unchanged, while Blender modelling added work: a large module now gets one weekend, model included. Wires (step 16) is the first real test, so review the later sizes after it. If it runs over, the polish steps (34 to 36) are the first candidates to shrink.
- **Modelling needs Blender open.** Blender MCP drives a running copy of Blender, so model work happens in sessions where it is open on this computer. Blender, the MCP server and its add-on still need setting up in step 40.
- **IWSDK is a framework, not a plug-in.** It is built on Three.js but has its own entity system and project tooling. It expects its own Three.js build (`super-three`, 0.181 in the TCS project, while this game uses 0.186), Vite 7 (this game uses 8) and its CLI-managed dev server. Part 46a has to move the game across without changing the desktop game, so it may turn out larger than its size, and every module's look needs rechecking afterwards.
- **Relay server for voice chat.** Roughly 15 to 20% of connections need one, and the free options need checking at step 33. Costs and limits are unknown for now.
