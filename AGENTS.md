# Keep Talking and Nobody Explodes clone

A browser clone of Keep Talking and Nobody Explodes: one player defuses a 3D bomb, another reads the manual, and they talk it through.

## Read first

- **README.md**: how to set it up, run and use it.
- **LAYOUT.md**: which file controls what. Start there instead of reading the whole codebase, then open only the
  files the task needs.
- **ROADMAP.md**: what is built, what comes next and the decisions behind each step. It overrides `docs/`, which is
  partly out of date (for example, it describes HTML module overlays).

## How it is built

Vanilla JavaScript ES modules, Three.js and Vite, with no UI framework and no backend. `main.js` owns the game flow.
`BombState` holds one bomb's data, `BombModel` and `BombController` handle the 3D bomb, and each module registers its
class with `ModuleManager`. Files open with a banner comment and use `_` for private members and `[KTANE]` log prefixes.

## Standing rules

- **Modules are real 3D objects on the bomb,** like the original game, not canvas textures or HTML overlays. The user decided this on 2026-10-31.
- **Keep module rules separate from the 3D,** so they can be tested without a renderer.
- **The Expert never gets live bomb data.** It would remove the point of the game: all information passes by voice.
- **Rotate the bomb, not the camera, and keep the timer and strikes on the bomb** rather than in a HUD.
- **Model modules in Blender through Blender Lab's official MCP (`mcp` extension plus the `blender-mcp` server), with Blender open.** Don't wait for the user before modelling: they watch if they want to. Models go into the game as `.glb`. The user decided this on 2026-10-31.
- **Don't copy assets from the original game.** Models, sounds and manual text are made for this project. `references/` holds style references only, and stays out of git.- **Commit and push to GitHub at the end of each working day,** so the day's work is never left only on this computer.
- **Keep the docs current as you work.** When you add, rename or remove a file, update LAYOUT.md;
  when a feature, command, control or option changes, update the README section that describes it.

## Roadmap and board

The plan is in ROADMAP.md (format: board/FORMAT.md); the board is board/index.html (`python board/serve.py`).
Keep it live: set a step In progress when you start it and `Done YYYY-MM-DD` when it's finished, update parts the
same way, add decisions with their date, and update "Last updated". Check after each edit:
`python board/roadmap.py check ROADMAP.md`. Never renumber steps; new steps take the next free number.

## Testing

Run `npm test` and `npm run build`. Tests live in `tests/`, and game rules should get tests there. Then use `npm run dev` and the development-only debug keys
in the README to reach win, lose and strike states. How a module looks and feels needs a person to check in the browser.
