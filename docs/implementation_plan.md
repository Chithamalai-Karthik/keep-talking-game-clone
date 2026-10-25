# Keep Talking and Nobody Explodes — Browser Game Clone (Final Plan)

> [!NOTE]
> **Revision 2 — Final**: All architecture decisions confirmed. Multiplayer server removed. PeerJS voice chat added. Hybrid 3D approach confirmed. Vanilla JS + Three.js + Vite stack locked in.

---

## Confirmed Decisions

| Decision | Choice |
|---|---|
| 3D Approach | **Hybrid** — Three.js for bomb shell/environment + HTML/CSS overlays for module UIs |
| Multiplayer | **No traditional multiplayer** — voice chat + role selection only |
| Voice Chat | **PeerJS** (WebRTC wrapper) — peer-to-peer audio |
| 3D Library | **Three.js** (vanilla, no React Three Fiber) |
| Language | **JavaScript** (start with JS, migrate to TypeScript later if desired) |
| UI Framework | **Vanilla JS** (no React/Vue/Svelte) |
| Build Tool | **Vite** |
| Art Style | **Stylized / Flat** |
| Module Scope | Step-by-step across phases |

---

## About the Original Game

**Keep Talking and Nobody Explodes** is a multiplayer puzzle game by Steel Crate Games (2015). It's an **asymmetric cooperative** game — one player sees the bomb, others read the manual. Communication under pressure is the core mechanic.

**How the original works**: The Defuser uses a PC/VR headset, and the Experts physically sit nearby reading a printed or digital manual. There is **no built-in online multiplayer** — players who play remotely use external voice chat (Discord, etc.). Our PeerJS approach brings native voice chat directly into the browser.

---

## Game Mechanics

### Bomb Structure
| Element | Details |
|---|---|
| **Modules** | Up to 11 per bomb. Each is independent and can be solved in any order |
| **Countdown Timer** | Bomb explodes when it reaches 0:00 |
| **Strikes** | Max 3 errors allowed (configurable). Each strike speeds up the timer |
| **Serial Number** | Alphanumeric code on the bomb casing — many modules depend on it |
| **Batteries** | Count of AA and D batteries — affects some module rules |
| **Indicators** | Labeled lights (lit/unlit) — e.g., CAR, FRK, SIG, NSA, etc. — affect some modules |
| **Ports** | DVI-D, Parallel, PS/2, RJ-45, Serial, Stereo RCA — affect some modules |

### Standard Modules (Section 1 — must all be disarmed)

| # | Module | Summary |
|---|---|---|
| 1 | **Wires** | 3–6 colored wires (red, blue, yellow, white, black). Cut exactly **one** correct wire based on wire colors, count, and serial number parity |
| 2 | **The Button** | A colored button (blue/red/white/yellow) with a label (Abort/Detonate/Hold/Press). Rules determine: press-and-release immediately vs. hold-and-release based on colored strip + timer digit |
| 3 | **Keypads** | 4 occult-like symbols shown on buttons. Match all 4 to one of 6 reference columns. Press buttons in the order symbols appear top-to-bottom in that column |
| 4 | **Simon Says** | 4 colored buttons (red/blue/green/yellow) flash in a growing sequence. Map flash colors to button colors using a table that depends on (a) whether serial has a vowel, and (b) current strike count |
| 5 | **Who's on First** | 2-step module, 3 stages. Step 1: display shows a word → determines which of 6 button positions to READ. Step 2: that button's label → find it in a lookup list → press the first matching button from the list |
| 6 | **Memory** | 5 stages. Each stage: display shows 1–4, four buttons labeled 1–4 (shuffled). Rules reference position or label from previous stages. Wrong answer resets to stage 1 |
| 7 | **Morse Code** | An LED blinks a word in Morse code. Decode the word → look up its frequency from a table → tune a dial to that frequency → submit (TX button) |
| 8 | **Complicated Wires** | Up to 6 wires, each can have: a color combination (red/blue/red+blue/white), an LED above it, and/or a star below it. A Venn diagram determines cut/don't-cut based on these 3 properties + serial/batteries/ports |
| 9 | **Wire Sequences** | Wires revealed one panel at a time (up to 3 per panel). Each wire is red, blue, or black. For each color, count the occurrence number → table says which letter(s) (A/B/C) to connect → cut if wire goes to matching letter |
| 10 | **Mazes** | 6×6 grid with invisible walls. Two green circles identify which of 9 predefined mazes it is. Move a white dot from start to a red triangle using up/down/left/right. Hitting a wall = strike |
| 11 | **Passwords** | 5 columns, each with 6 cycling letters. Cycle through each column to find a **5-letter** word from a fixed word list (e.g., ABOUT, AFTER, AGAIN, BELOW, COULD, EVERY, etc.) |

### Needy Modules (Section 2 — demand periodic attention, cannot be permanently disarmed)

| Module | Behavior |
|---|---|
| **Venting Gas** | Periodically activates. Asks "Vent Gas?" → press Y. If it says "Detonate?" → press N. Ignoring it causes a strike |
| **Capacitor Discharge** | A bar fills up over time. Hold a lever to drain it. If it fills completely → strike |
| **Knob** | 12 LEDs around a rotary knob. LED pattern determines which position to turn the knob to (Up/Down/Left/Right) |

### Bomb Info (Appendices)
- **Appendix A** — Indicator identification: Small labeled panels (e.g., SIG, FRK, CAR, IND, MSA, NSA, etc.). Can be **lit** (light on) or **unlit** (light off)
- **Appendix B** — Battery types: AA (small, cylindrical) and D (large, cylindrical). Module rules reference **total count**
- **Appendix C** — Port types: Visual identification guide for DVI-D, Parallel, PS/2, RJ-45, Serial, Stereo RCA. Some modules check presence of specific ports

---

## Architecture

### How It Works — No Server-Side Game Logic

```
┌──────────────────────┐      PeerJS Voice Chat       ┌──────────────────────┐
│      DEFUSER          │   (peer-to-peer WebRTC)      │       EXPERT          │
│     (Browser 1)       │ ◄══════════════════════════► │     (Browser 2)       │
│                       │                               │                       │
│  • 3D bomb (Three.js) │                               │  • Manual pages       │
│  • Module UIs (HTML)  │                               │  • Reference docs     │
│  • Timer, strikes     │                               │  • NO bomb info       │
│  • ALL game logic     │                               │  • NO live data       │
│    runs HERE          │                               │  • Listens to Defuser │
└──────────────────────┘                                └───────────────────────┘
         │                                                        │
         └──── Both connect to PeerJS signaling server ───────────┘
              (free cloud, or self-hosted, for initial pairing only)
```

**Key principle**: The Expert knows **nothing** about the bomb except what the Defuser tells them verbally. No sidebar, no live data, no progress indicators. This preserves the core game mechanic — communication under pressure.

### Cross-Country Play (e.g., Brazil ↔ India)

PeerJS uses WebRTC which establishes **direct peer-to-peer connections** between browsers. To handle NAT traversal:

| Server Type | Purpose | Default |
|---|---|---|
| **Signaling** | Helps peers find each other (exchange connection info) | PeerJS free cloud (`0.peerjs.com`) |
| **STUN** | Helps peers discover their public IP for direct connection | Google's free STUN servers (default in PeerJS) |
| **TURN** | Relays audio when direct P2P fails (~15-20% of cases) | Not included by default — add via Metered.ca free tier or similar |

We'll configure TURN as a fallback so it works reliably even on strict networks:
```js
const peer = new Peer('room-ABCD', {
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },           // Free STUN
      { urls: 'turn:your-turn-server.com',
        username: 'user', credential: 'pass' }              // TURN fallback
    ]
  }
});
```

### Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| 3D Rendering | **Three.js** (via npm) | Bomb casing, room environment, camera controls |
| Module UIs | **HTML5 + CSS** | Interactive module panels (overlaid on 3D scene) |
| Game Logic | **Vanilla JavaScript (ES6+ modules)** | Module rules, bomb state, timer, scoring |
| Styling | **Vanilla CSS** (custom properties, animations) | Design system, module visuals, HUD |
| Audio | **Howler.js** or Web Audio API | Sound effects, ambient tension audio |
| Voice Chat | **PeerJS** (WebRTC wrapper) | Peer-to-peer audio between Defuser & Expert |
| Build Tool | **Vite** | Fast dev server, module bundling, HMR |

> [!NOTE]
> **No backend server needed for gameplay.** The only "server" involved is PeerJS's signaling server (free cloud or self-hosted single npm package) which only handles the initial peer discovery — all audio and game logic is client-side.

### Project Structure
```
Keep Talking And Nobody Explodes Game Clone/
├── package.json
├── vite.config.js
├── index.html                     # Entry point
├── public/
│   └── assets/
│       ├── models/                # 3D models (.glb/.gltf) — bomb casing, room props
│       ├── textures/              # Materials for 3D objects
│       ├── sounds/                # SFX: tick, explosion, strike, success, ambient
│       ├── fonts/                 # Game typography (Special Elite, Orbitron)
│       └── images/                # Module symbols (keypads), icons
├── src/
│   ├── css/
│   │   ├── index.css              # Design tokens, global styles, typography
│   │   ├── menu.css               # Main menu + lobby styles
│   │   ├── game.css               # Game HUD, module overlay container
│   │   ├── modules/
│   │   │   ├── wires.css
│   │   │   ├── button.css
│   │   │   ├── keypads.css
│   │   │   ├── simon-says.css
│   │   │   ├── whos-on-first.css
│   │   │   ├── memory.css
│   │   │   ├── morse-code.css
│   │   │   ├── complicated-wires.css
│   │   │   ├── wire-sequences.css
│   │   │   ├── mazes.css
│   │   │   └── passwords.css
│   │   ├── manual.css             # Expert manual styles
│   │   └── animations.css         # Shared keyframe animations
│   ├── js/
│   │   ├── main.js                # App entry, router, scene setup
│   │   ├── three/
│   │   │   ├── SceneManager.js    # Three.js scene, camera, renderer, lights
│   │   │   ├── BombModel.js       # 3D bomb casing + module slot markers
│   │   │   ├── RoomEnvironment.js # Desk, walls, ambient objects
│   │   │   ├── CameraController.js# Orbit controls, zoom-to-module
│   │   │   └── Raycaster.js       # 3D click detection on module slots
│   │   ├── game/
│   │   │   ├── BombGenerator.js   # Procedural bomb generation (modules, serial, etc.)
│   │   │   ├── BombState.js       # Timer, strikes, serial, batteries, indicators, ports
│   │   │   ├── ModuleBase.js      # Base class for all modules
│   │   │   ├── Timer.js           # Countdown with strike acceleration
│   │   │   └── GameController.js  # Orchestrates game flow (start, win, lose)
│   │   ├── modules/
│   │   │   ├── Wires.js
│   │   │   ├── Button.js
│   │   │   ├── Keypads.js
│   │   │   ├── SimonSays.js
│   │   │   ├── WhosOnFirst.js
│   │   │   ├── Memory.js
│   │   │   ├── MorseCode.js
│   │   │   ├── ComplicatedWires.js
│   │   │   ├── WireSequences.js
│   │   │   ├── Mazes.js
│   │   │   ├── Passwords.js
│   │   │   ├── NeedyVentGas.js
│   │   │   ├── NeedyCapacitor.js
│   │   │   └── NeedyKnob.js
│   │   ├── voice/
│   │   │   ├── PeerManager.js     # PeerJS wrapper — create/join room, voice stream
│   │   │   └── VoiceUI.js         # Mute/unmute, connection status, audio indicators
│   │   ├── ui/
│   │   │   ├── ModuleOverlay.js   # HTML panel manager for focused module
│   │   │   ├── HUD.js            # Timer, strikes, module count display
│   │   │   ├── MenuUI.js         # Main menu, role selection, room pairing
│   │   │   └── ManualUI.js       # Expert manual rendering
│   │   └── utils/
│   │       ├── audio.js           # Sound manager (Howler.js wrapper)
│   │       ├── helpers.js         # Serial generator, random utils
│   │       └── constants.js       # Module rules data, word lists, symbol sets
│   └── manual/                    # Expert manual pages (HTML)
│       ├── index.html
│       ├── wires.html
│       ├── button.html
│       ├── keypads.html
│       ├── simon-says.html
│       ├── whos-on-first.html
│       ├── memory.html
│       ├── morse-code.html
│       ├── complicated-wires.html
│       ├── wire-sequences.html
│       ├── mazes.html
│       ├── passwords.html
│       └── appendices.html
```

### Key Differences from Previous Plan
- ❌ **Removed**: `server/` directory (no Express, no Socket.io)
- ❌ **Removed**: `multiplayer/` directory (no SocketClient, no RoomManager, no GameSync)
- ✅ **Added**: `voice/` directory (PeerManager.js, VoiceUI.js) — lightweight PeerJS integration
- ✅ **Simplified**: `MenuUI.js` handles role selection + room code entry (no server-side room management)

---

## Implementation Phases

> [!NOTE]
> Each phase produces a **playable result**. Voice chat is integrated in Phase 4 after core gameplay is solid.

### Phase 1: Project Setup + 3D Foundation
**Goal**: A spinning 3D bomb you can rotate and inspect in the browser.

- [ ] Initialize project with Vite (`npm create vite@latest`)
- [ ] Install Three.js (`npm install three`)
- [ ] Design system: CSS tokens, color palette (stylized/flat theme), typography (Google Fonts)
- [ ] Main menu page — dark, cinematic, polished UI
- [ ] Three.js scene setup: renderer, camera, orbit controls, lights
- [ ] 3D bomb casing: a box geometry with stylized materials (flat-shaded, bold colors)
- [ ] Module slot markers on bomb faces (front: up to 6 slots, back: up to 5 slots)
- [ ] Side panels: serial number, battery holders, indicator labels, port plates
- [ ] Camera zoom-to-module: click a slot → camera smoothly zooms in
- [ ] Ambient room: simple desk/table surface beneath the bomb

### Phase 2: Core Engine + First 4 Modules
**Goal**: A playable bomb with 4 modules, timer, and strikes (local single-player).

- [ ] Bomb state system: serial number generation, batteries, indicators, ports (randomized)
- [ ] Countdown timer with display (LED-style font, red glow)
- [ ] Strike system: strike counter, timer acceleration on strike
- [ ] Module overlay system: click 3D module slot → HTML panel appears → interact → close
- [ ] `ModuleBase` class: lifecycle (init, render, interact, solve, strike, destroy)
- [ ] **Wires module** — colored wires with cut animation
- [ ] **The Button module** — color + label, hold/release with timed strip
- [ ] **Keypads module** — symbol grid with click-to-select
- [ ] **Simon Says module** — flashing color sequence with mapping tables
- [ ] Sound effects: timer tick, wire cut snap, button click, strike buzzer, solve chime
- [ ] Win/lose screens: explosion animation (lose) / defused celebration (win)

### Phase 3: Remaining Modules + Expert Manual
**Goal**: All 11 standard modules + 3 needy modules complete. Expert manual as a web page.

- [ ] **Who's on First module** — display word lookup + button label priority lists
- [ ] **Memory module** — 5-stage state tracking with reset on error
- [ ] **Morse Code module** — LED blinking + frequency dial tuning
- [ ] **Complicated Wires module** — wire properties + Venn diagram logic
- [ ] **Wire Sequences module** — sequential panel reveal + table lookup
- [ ] **Mazes module** — 6×6 grid navigation with invisible walls
- [ ] **Passwords module** — 5 cycling columns to form a **5-letter word**
- [ ] **Needy: Venting Gas** — Y/N prompt on timer
- [ ] **Needy: Capacitor Discharge** — bar fill + lever drain
- [ ] **Needy: Knob** — LED pattern → knob position
- [ ] Expert Manual (web-based): all module instruction pages + appendices
- [ ] Difficulty levels: easy (3 modules, 5 min, 3 strikes) → hard (11 modules, 3 min, 1 strike)
- [ ] Custom game mode: choose module count, time, max strikes

### Phase 4: Voice Chat + Room Pairing 🎙️
**Goal**: Two players in different browsers (even different countries) can voice chat. One is the Defuser, the other is the Expert.

- [ ] Install PeerJS (`npm install peerjs`)
- [ ] `PeerManager.js`: create peer, generate room code, handle call/answer
- [ ] `VoiceUI.js`: mute/unmute button, connection status indicator, audio level visualization
- [ ] Room creation flow: Defuser clicks "Create Room" → gets a 4-character room code
- [ ] Room joining flow: Expert enters room code → voice connection established
- [ ] Role selection: Defuser → goes to game view, Expert → goes to manual view
- [ ] Configure STUN/TURN servers for reliable cross-country connections
- [ ] Audio controls: volume slider, mute toggle, push-to-talk option
- [ ] Connection error handling: retry logic, "peer disconnected" notification
- [ ] Text chat fallback: simple message input in case voice isn't available

### Phase 5: Polish, Audio & Juice 🎨
**Goal**: The game feels premium, immersive, and polished.

- [ ] Enhanced 3D: better materials, subtle shadows, ambient occlusion
- [ ] Room environment: desk texture, wall details, overhead lamp light cone
- [ ] Screen shake on strike
- [ ] Lights-out event: room goes dark briefly (increases tension)
- [ ] Full sound design: ambient tension drone, escalating music as timer drops
- [ ] Particle effects: sparks on wire cut, smoke on explosion, confetti on win
- [ ] Module animations: smooth open/close transitions, LED glows, button depth press
- [ ] Loading screen with bomb-themed progress bar
- [ ] Statistics: games played, modules solved, best times (localStorage)
- [ ] Responsive design: works on different screen sizes
- [ ] Cross-browser testing (Chrome, Firefox, Edge)

---

## Art Direction: Stylized / Flat

| Element | Style |
|---|---|
| **Color Palette** | Bold, saturated primary colors against dark backgrounds. Deep charcoal (#1a1a2e), electric blue (#0f3460), vivid red (#e94560), warm amber (#f5a623) |
| **Materials** | Flat-shaded, no realistic textures. Clean geometry with subtle gradients |
| **Bomb Casing** | Smooth dark surface with colored panel insets. Rounded edges. No photorealistic metal |
| **Module Panels** | Crisp borders, solid color fills, clear icons. High contrast for readability |
| **Typography** | Monospace for timer (Orbitron), bold sans-serif for labels (Inter/Outfit), quirky serif for manual (Special Elite) |
| **Lighting** | Soft ambient + single directional light. Subtle shadows for depth, no harsh realism |
| **Animations** | Smooth easing (cubic-bezier), subtle bounces, satisfying snaps |

---

## Verification Plan

### Automated Tests
- Module logic unit tests: every module's solve/strike condition paths
- Bomb generation: valid serial numbers, correct battery/indicator/port randomization
- Timer accuracy: countdown matches real seconds, acceleration after strikes

### Manual Verification
- Play through each of the 14 modules (11 standard + 3 needy) end-to-end
- Test every strike condition for each module
- Verify timer acceleration curves after 1 and 2 strikes
- Cross-browser testing: Chrome, Firefox, Edge
- Voice chat: test between two devices, test cross-network (different WiFi/cellular)
- Test Expert manual: verify all instructions match module logic exactly
- Mobile responsiveness for Expert manual (Expert might use a phone)
