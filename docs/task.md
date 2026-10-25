# KTANE Clone — Task Tracker

---

## Phase 1: Project Setup + 3D Foundation ✅

- [x] Initialize project with Vite + Three.js + Howler.js
- [x] Design system: CSS tokens, typography, color palette
- [x] Main menu — cinematic UI, responsive at any zoom/screen
- [x] Three.js scene: renderer, camera, lights, room environment
- [x] 3D bomb casing (primitives), correct orientation (3.2×2.2×0.9)
- [x] Module slots on large faces (6 front + 5 back + 1 timer slot)
- [x] Bomb rotation via mouse drag (not camera orbit)
- [x] Pick-up / put-down interaction (click → lift, right-click → put down)
- [x] Timer display on bomb (canvas texture, back face)
- [x] Strike X indicators on bomb (near timer)
- [x] Side panels: serial plate, batteries, indicator LED, ports
- [x] Removed floating HUD entirely
- [x] Fixed Three.js deprecation warnings

---

## Phase 2: Core Engine + First 4 Modules

### 2A — Bomb State Generator
- [ ] BombState class — generates randomized bomb configuration
- [ ] Random serial number (letter/digit mix, last char odd/even matters)
- [ ] Random batteries (0–2), indicators (lit/unlit labels), ports
- [ ] Module assignment — pick N modules from pool, assign to slots
- [ ] Wire side panel info onto the 3D bomb (serial text, battery count)

### 2B — Countdown Timer
- [ ] Timer countdown logic (seconds → bomb display)
- [ ] Timer ticking animation on the bomb's canvas texture
- [ ] Timer acceleration after strikes (speed multiplier)
- [ ] Danger mode visual (red glow when < 60s)

### 2C — Strike System + Game Over
- [ ] Strike tracking (wrong answer → strike, light up X indicator)
- [ ] Max strikes reached → explosion (game over)
- [ ] All modules solved → defused (win)
- [ ] Game-over overlay screen (explosion / defused, with animations)
- [ ] "Play Again" / "Back to Menu" buttons

### 2D — Module Overlay System
- [ ] ModuleBase class (shared logic: solve, strike, reset, render)
- [ ] Click module slot → bomb rotates to face it → HTML overlay appears
- [ ] Module panel UI (glassmorphic card with title, close button)
- [ ] Close panel → overlay hides, bomb returns to free rotation
- [ ] Slot LED updates (empty → active → solved / strike flash)

### 2E — Wires Module
- [ ] 3–6 randomly colored wires (red, blue, yellow, white, black)
- [ ] Full rule logic from the manual (based on wire count, colors, serial)
- [ ] Click a wire to cut it — visual snap + animation
- [ ] Correct wire → module solved, wrong wire → strike

### 2F — The Button Module
- [ ] Large colored button with random label (Abort, Detonate, Hold, Press)
- [ ] Press vs Hold logic (based on color, label, batteries, indicators)
- [ ] If hold: colored strip appears → release at correct timer digit
- [ ] Visual feedback: button press animation, strip color glow

### 2G — Keypads Module
- [ ] 4 random symbols from the symbol columns
- [ ] Player must press symbols in correct column order
- [ ] Symbol rendering (Unicode/SVG glyphs)
- [ ] Visual feedback: symbol lights up green when correct, strike on wrong order

### 2H — Simon Says Module
- [ ] 4 colored buttons (red, blue, green, yellow) that flash in sequence
- [ ] Rules differ based on number of strikes and serial vowel
- [ ] Sequence grows each stage (3–5 stages based on difficulty)
- [ ] Flash animation + sound cues per color

### 2I — Sound Effects
- [ ] Timer tick sound (every second, faster when accelerated)
- [ ] Strike buzz sound
- [ ] Module solve chime
- [ ] Explosion sound + screen shake
- [ ] Button click / wire cut SFX
- [ ] Background ambient tension loop

---

## Phase 3: Remaining Modules + Expert Manual

### 3A — Who's on First Module
- [ ] Display word on screen → find correct button label
- [ ] Two-step logic: display word → position → button label → reading order
- [ ] Full rule table from manual

### 3B — Memory Module
- [ ] 5 stages, each showing a display number + 4 button numbers
- [ ] Rules depend on current display AND previous stage answers
- [ ] Stage tracking and recall logic

### 3C — Morse Code Module
- [ ] Flashing light spells out a word in Morse code
- [ ] Player identifies the word → tunes radio to correct frequency
- [ ] Frequency dial UI + submit button

### 3D — Complicated Wires Module
- [ ] Wires with combinations: LED lit, star symbol, red/blue coloring
- [ ] Venn diagram logic (LED + star + color → cut or don't cut)
- [ ] Visual wire rendering with indicators

### 3E — Wire Sequences Module
- [ ] 3 panels of up to 3 wires each (9 total, progressive reveal)
- [ ] Each wire: color + connected letter → lookup table for cut/don't
- [ ] Panel navigation (next/previous)

### 3F — Mazes Module
- [ ] 9 possible mazes (identified by circle markers)
- [ ] Player navigates white square to red triangle
- [ ] Arrow button controls (up/down/left/right)
- [ ] Invisible walls — struck if you walk into one

### 3G — Passwords Module
- [ ] 6 columns of spinning letters (cycle up/down)
- [ ] Find the 5-letter word from the valid word list
- [ ] Submit button when the correct word is displayed

### 3H — Needy Modules (3 types)
- [ ] Needy Vent Gas — "Vent Gas?" → Yes/No (always yes)
- [ ] Needy Capacitor Discharge — hold button to prevent overcharge
- [ ] Needy Knob — read LED pattern → set dial to correct position

### 3I — Expert Manual Page
- [ ] Separate HTML page (or in-game tab) with all module instructions
- [ ] Styled to match the game's visual design
- [ ] Searchable / collapsible sections per module
- [ ] Printable layout option

### 3J — Difficulty + Custom Game Mode
- [ ] Custom game settings (choose timer, strikes, specific modules)
- [ ] Difficulty presets apply correct module count + timer + strike limits
- [ ] Seed-based generation (share a seed for same bomb)

---

## Phase 4: Voice Chat + Room Pairing

### 4A — PeerJS Setup + Room System
- [ ] Install and configure PeerJS
- [ ] Room creation (generate room code)
- [ ] Room joining (enter room code)
- [ ] Connection status UI (connected/disconnected indicator)

### 4B — Role Selection + Lobby
- [ ] Role picker: Defuser or Expert
- [ ] Lobby screen showing both players + roles
- [ ] "Start Game" only when both players are ready
- [ ] Role enforcement (Defuser sees bomb, Expert sees manual)

### 4C — Voice Chat
- [ ] getUserMedia for microphone access
- [ ] PeerJS audio stream between players
- [ ] Mute/unmute toggle
- [ ] Volume indicator (visual feedback that audio is flowing)
- [ ] STUN/TURN config for cross-country connectivity

### 4D — Synced Game State (Optional Enhancement)
- [ ] Defuser actions visible to both players in real-time
- [ ] Timer sync between players
- [ ] Game-over state broadcast

---

## Phase 5: Polish, Audio & Juice

### 5A — Enhanced 3D Visuals
- [ ] Improve bomb materials (PBR textures, normal maps)
- [ ] Room environment polish (better props, lighting)
- [ ] Particle effects (sparks on strike, confetti on win)
- [ ] Screen shake on explosion

### 5B — Animations & Transitions
- [ ] Smooth screen transitions (menu → difficulty → game)
- [ ] Module solve celebration animation
- [ ] Timer pulse animation in danger zone
- [ ] Bomb wiggle/vibration when time is low

### 5C — Full Sound Design
- [ ] Ambient background loop (tension building)
- [ ] Per-module unique sounds (Simon Says tones, Morse beeps)
- [ ] Music: menu theme, gameplay tension, win/lose stingers
- [ ] Volume settings in settings menu

### 5D — Settings & Accessibility
- [ ] Settings page: audio volume, graphics quality, controls
- [ ] Key rebinding (optional)
- [ ] Color-blind friendly mode for modules
- [ ] Tutorial / "How to Play" interactive walkthrough

### 5E — Statistics & Persistence
- [ ] Track: games played, win/loss ratio, best times, modules solved
- [ ] LocalStorage persistence
- [ ] Stats page accessible from main menu

### 5F — Final QA & Cross-Browser
- [ ] Test on Chrome, Firefox, Edge, Safari
- [ ] Mobile touch controls (stretch goal)
- [ ] Performance profiling and optimization
- [ ] Production build + deployment-ready bundle
