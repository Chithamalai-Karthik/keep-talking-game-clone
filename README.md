# Talk to Defuse

A browser game inspired by Keep Talking and Nobody Explodes: one player defuses a 3D bomb, another reads the manual, and they talk it through.

The Defuser sees the bomb and the Expert sees only the manual, so everything the Expert learns has to be said aloud. All game logic runs in the Defuser's browser, with no game server.

**Status:** the office, the bomb room, the desk menu (a Bombs binder, a Free Play case and a Menu folder, with Options), the 3D bomb, timer, strikes and the results report are built. All eleven regular modules are built, with core sound effects: Wires, The Button, Keypads, Simon Says, Who's on First, Memory, Morse Code, Complicated Wires, Wire Sequences, Mazes and Passwords. The three needy modules are built too: Venting Gas, Capacitor Discharge and Knob. See `ROADMAP.md`.

## Setup

Install [Node.js](https://nodejs.org/) 20.19, 22.12 or 24 or newer (what Vite 7 and IWSDK need), then install the dependencies once:

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

While the 3D scene loads, a spark burns down a bomb's fuse; when it reaches the bomb, the bomb blasts away and the game opens at a desk in an office. Click the **Bombs** binder to lift it and open it: its contents page lists the four levels, a click on one shows its brief, and **Start** takes you to the bomb room with that bomb on the desk. Click the black **Free Play** case to set up your own bomb: the time (1 to 10 minutes), how many modules, needy modules on or off, and Hardcore (one strike explodes it); its screen explains each control and a gauge estimates the difficulty, and **Start** arms it. The case remembers its last settings. Click the **Menu** folder for the controls, **Options** (the sound effect volume, remembered in this browser) and the **Expert Manual**, which opens in a new tab for the Expert to scroll or print, in a Field manual or Dossier style; it's also at `/manual.html`. Right click, Esc or a click beside the binder or folder puts it back down. In the bomb room, the **Menu** folder beside the bomb offers **Restart this bomb** and **Back to the office**; it can be picked up while the bomb is down on the desk, and the timer keeps running while it is open. When the bomb explodes or is defused, the screen goes black and the binder opens on a report: the level, the bomb, a stamp saying EXPLODED or DEFUSED, the time remaining and what set it off: the module that gave the final strike, or time running out. **Retry** gives a new bomb of the same level, and **Back** returns to the office. Options aren't built yet.

| Control | Action |
| --- | --- |
| Left click anywhere on the bomb | Pick it up |
| Left click on a module | Select it: the bomb turns to face that module |
| Left click on the selected module | Use it (press, cut and so on) |
| Hold left click on The Button or the Capacitor lever | Hold it down; let go anywhere to release it |
| Hold right click and drag | Rotate the bomb; this keeps the selected module and works during a hold |
| Right click or Esc | Deselect: leave the selected module, or put the bomb down |

| Difficulty | Modules | Of those, needy | Time | Strikes allowed |
| --- | --- | --- | --- | --- |
| Easy | 3 | 0 | 5:00 | 3 |
| Medium | 6 | 1 | 4:00 | 3 |
| Hard | 9 | 1 | 3:00 | 2 |
| Expert | 11 | 2 | 3:00 | 1 |

Needy modules can't be solved and don't count towards defusing the bomb. They wake from time to time, and take a strike if their red countdown ends before they are tended.

The alarm clock on the bomb room's desk rings now and then, beeping and flashing. Click the clock to pick it up (this puts the bomb down), then click its SNOOZE bar; right click, Esc or a click anywhere off the clock puts it back. Left alone, it stops after 30 seconds. It's only a distraction and never causes a strike.

**VR:** on a browser that can run VR, such as a Meta Quest's, an **Enter VR** button shows at the bottom right, on the menu and during a game. In VR you stand at the desk at real size. Each controller has a beam that stops at what it points at, with a dot there; the trigger clicks along it (pages, wires, buttons, the clock's snooze bar), and B or Y steps back. Squeeze the grip with your hand at the bomb or the alarm clock (within about 10 cm) to pick it up as it is; let go and it falls with your hand's motion, landing on the desk on whichever face it comes down on, or going back to its place if it misses the desk. With the bomb in one hand, the other hand's trigger works its modules straight away. **Leave VR** is in the office folder and the bomb room's folder, or use the headset's own button. To try it on a Quest connected by USB: `adb reverse tcp:5173 tcp:5173`, then open `http://localhost:5173/` in the Quest browser (the dev server listens on 127.0.0.1 for this). For checking from the laptop, `adb forward tcp:9222 localabstract:chrome_devtools_remote` opens the Quest browser to remote debugging.

Testing keys during a game: `T` skips 30 seconds, `K` adds a strike, `N` wakes the needy modules, `A` rings the desk clock's alarm, `G` explodes the bomb and `W` wins. These only work in development (`npm run dev`).

## Project board

`python board/serve.py` opens ROADMAP.md as a kanban board (To do, Next, In progress, Done, On hold) with due dates
and a schedule timeline. It reads the roadmap each time it opens, so the roadmap is the one place to edit.
