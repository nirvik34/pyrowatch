# PyroWatch AI — Frontend Design System
## Complete UI/UX Specification for Phase 4

---

## Aesthetic Direction

**Theme: Industrial Command Center**
Think NOAA ops room meets military satellite terminal. Dark, data-dense, authoritative.
Not a startup dashboard — a tool that saves lives. Every pixel earns its place.

**Palette**
```
--bg-void:       #080C10   /* near-black, base layer */
--bg-panel:      #0D1117   /* panel backgrounds */
--bg-elevated:   #161B22   /* cards, modals */
--bg-border:     #21262D   /* subtle borders */

--fire-extreme:  #FF3B1F   /* emergency red — used sparingly */
--fire-high:     #FF6B2B   /* high risk orange */
--fire-moderate: #FFAA00   /* moderate amber */
--fire-low:      #2ECC71   /* low risk green */
--fire-none:     #3D4F5C   /* no data slate */

--text-primary:  #E6EDF3   /* headings */
--text-secondary:#8B949E   /* labels, meta */
--text-muted:    #484F58   /* disabled, placeholder */

--accent-glow:   rgba(255, 59, 31, 0.15)  /* red glow for alerts */
--scanner-line:  rgba(255, 107, 43, 0.4)  /* scanning animation */
```

**Typography**
```
Display / Headers:  'Rajdhani', sans-serif  — military-technical feel, all-caps headings
Body / Data:        'IBM Plex Mono', monospace — data readouts, coordinates, scores
Labels / UI:        'Inter', sans-serif — clean utility text
```
All three available on Google Fonts. Load via index.html.

**Motion Principles**
- Alert state changes: 200ms ease-out
- Map tile loads: fade-in 400ms
- Replay frame transitions: 150ms crossfade
- Pulsing alert badge: CSS keyframe, 1.5s infinite
- Scanner line sweep on map: CSS animation, 3s linear infinite (subtle, on hover)
- Number counters: animate from 0 on mount (risk score, fire pixels)
- No bouncing. No spring physics. This is not a todo app.

---

## Page Architecture

```
/                  → Landing Page (pre-load, dramatic intro)
/dashboard         → Main Command Dashboard (primary page)
/replay            → Full-screen Replay Theater
/alerts            → County Alert Board
```

Single-page app with React Router. All pages share the TopBar component.

---

## Page 1: Landing Page  `/`

**Purpose:** Judges see this first. 8 seconds to hook them before they lose interest.
**Layout:** Full viewport, centered, dark background with animated particle embers rising.

### Visual Structure

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                                                         │
│              🔥  [animated ember particles]             │
│                                                         │
│           PYROWATCH  AI                                 │
│    ─────────────────────────────────────                │
│    AI-Driven Wildfire Early Warning System              │
│                                                         │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│    │  0.9727  │  │  6 HRS   │  │  5 ZONES │           │
│    │  AUC ROC │  │  ADVANCE │  │ MONITORED│           │
│    └──────────┘  └──────────┘  └──────────┘           │
│                                                         │
│              [ ENTER COMMAND CENTER → ]                 │
│                                                         │
│    EnviroCast GEO Hackathon  ·  Dixie Fire Demo        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Components

**`<LandingHero>`**
- Full-viewport dark background (`--bg-void`)
- Ember particle system: 40–60 tiny orange dots floating upward, CSS-only using `@keyframes`, randomized delay/duration per particle via inline styles
- Title "PYROWATCH AI" in Rajdhani 72px, letter-spacing 0.15em, white
- Subtitle in IBM Plex Mono 16px, `--text-secondary`
- Thin horizontal divider line in `--fire-high`

**`<StatCounter>`** — 3 instances in a row
- Dark card `--bg-elevated`, 1px border `--bg-border`
- Large number in Rajdhani 48px, color `--fire-high`
- Count-up animation on mount (0 → final value over 1.5s)
- Label below in IBM Plex Mono 11px uppercase, `--text-muted`
- Stats: `0.9727 / AUC-ROC`, `6 HRS / ADVANCE WARNING`, `5 ZONES / MONITORED`

**`<EnterButton>`**
- Full-width max 320px, height 52px
- Background: `--fire-extreme` with 2px solid border same color
- Text: "ENTER COMMAND CENTER →" in Rajdhani 18px tracking-widest
- Hover: background transparent, text `--fire-extreme`, border stays — invert effect
- Transition 200ms
- onClick: navigate to `/dashboard`

**`<LandingFooter>`**
- Bottom of viewport, centered
- "EnviroCast GEO Hackathon · Dixie Fire, Plumas County CA · July 2021"
- IBM Plex Mono 12px, `--text-muted`

### Animations
```css
/* Ember particle — duplicate with varied delays */
@keyframes ember-rise {
  0%   { transform: translateY(0) translateX(0);   opacity: 0; }
  10%  { opacity: 0.8; }
  90%  { opacity: 0.3; }
  100% { transform: translateY(-100vh) translateX(40px); opacity: 0; }
}
```
Title fades in at 600ms delay. Stats stagger in at 900ms, 1050ms, 1200ms. Button at 1500ms.

---

## Page 2: Main Command Dashboard  `/dashboard`

**The primary page. Everything judges need to see in one view.**
**Layout:** 2-column on desktop (map left 60%, panel right 40%). Stack on mobile.

```
┌─────────────────────────────────────────────────────────┐
│ TOPBAR: 🔥 PYROWATCH AI  [●LIVE]  Plumas Co  [ALERTS▼] │
├─────────────────────────┬───────────────────────────────┤
│                         │  RISK SCORE                   │
│   LEAFLET MAP           │  ████████░░  0.84             │
│   (choropleth overlay)  │  EXTREME — EMERGENCY          │
│                         │                               │
│   [county labels]       │  ─────────────────────────   │
│   [fire spread pulse]   │  FIRE METRICS                 │
│                         │  Hotspots    220 px           │
│   ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬  │  Wind        15.2 m/s NE     │
│   REPLAY CONTROLS       │  Humidity    8.3%             │
│   ◀ ▐▐  ▶  [━━●━━━━]   │  Temp        41.1°C           │
│   Hour +20 / 48  1×     │                               │
│                         │  ─────────────────────────   │
│                         │  SITUATION REPORT             │
│                         │  [LLM text scrollable]        │
│                         │  [REFRESH REPORT ↻]           │
│                         │                               │
│                         │  ─────────────────────────   │
│                         │  COUNTY ALERTS                │
│                         │  Plumas    ████ EMERGENCY     │
│                         │  Butte     ███░ WARNING       │
│                         │  Lassen    ██░░ WATCH         │
│                         │  Shasta    █░░░ WATCH         │
│                         │  Tehama    ░░░░ CLEAR         │
└─────────────────────────┴───────────────────────────────┘
```

### Component Breakdown

---

#### `<TopBar>`
Sticky, height 56px, background `--bg-panel`, bottom border `--bg-border`.

Left section:
- Fire emoji + "PYROWATCH AI" in Rajdhani 20px bold white
- Thin separator
- "DIXIE FIRE · PLUMAS COUNTY CA" in IBM Plex Mono 11px `--text-secondary`

Center:
- Live indicator: pulsing green dot + "LIVE" text
- When alert active: replaces with pulsing red dot + "EMERGENCY ACTIVE"

Right section:
- Current timestamp (updates every second): IBM Plex Mono 12px
- `<AlertBadge>` showing highest active tier with color coding
- Link to `/alerts` full alert board

```jsx
// Live clock
const [time, setTime] = useState(new Date())
useEffect(() => {
  const t = setInterval(() => setTime(new Date()), 1000)
  return () => clearInterval(t)
}, [])
```

---

#### `<FireMap>`
The centrepiece. Left column, full height minus TopBar.

**Base map:** Leaflet with dark tile layer
```js
// Dark tile — matches the black UI
tileLayer: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
attribution: '© OpenStreetMap © CARTO'
initialView: [40.0, -121.2]  // Plumas County center
initialZoom: 9
```

**Risk overlay:** GeoJSON choropleth layer
- Source: `/api/risk-map` response
- Each polygon colored by `feature.properties.color`
- Opacity from `feature.properties.opacity`
- On hover: show tooltip with county name + risk score
- Updates when replay frame advances

**County label markers:** Custom Leaflet DivIcon
- Show county name + alert tier badge
- Only for counties in `_DEMO_COUNTIES` list
- Pulse animation when tier = emergency

**Fire spread pulse:** When `alert_tier === 'emergency'`
- Leaflet CircleMarker at fire center `[40.0, -121.2]`
- Animated expanding rings (CSS keyframes via DivIcon)
- 3 concentric rings, orange-red, expanding and fading

```jsx
// Replay frame update
useEffect(() => {
  if (!map || !currentFrame) return
  // Remove old GeoJSON layer
  // Add new GeoJSON layer with new colors
  // Smooth transition: brief opacity animation
}, [currentFrame])
```

**Map legend:** Bottom-left corner, floating card
```
RISK LEVEL
■ EXTREME  > 0.75
■ HIGH     0.55–0.75
■ MODERATE 0.35–0.55
■ LOW      < 0.35
```

---

#### `<ReplayControls>`
Docked to bottom of map. Dark panel, height 72px.

Elements (left to right):
- **Fire name:** "DIXIE FIRE — JULY 2021" in Rajdhani 13px
- **◀ button:** jump to first frame
- **⏪ button:** step back 1 frame
- **▶▐▐ button:** play/pause toggle — main CTA, larger size
- **⏩ button:** step forward 1 frame
- **▶▶ button:** jump to last frame
- **Progress scrubber:** custom styled `<input type="range">`, orange thumb, dark track, full-width
- **Frame counter:** "Hour +20 / 48" in IBM Plex Mono
- **Speed selector:** "1× 2× 4×" toggle chips

Play behavior:
```js
// Auto-advance every 800ms / speed multiplier
useEffect(() => {
  if (!isPlaying) return
  const interval = setInterval(() => {
    setCurrentFrame(f => {
      if (f >= totalFrames - 1) { setIsPlaying(false); return f }
      return f + 1
    })
  }, 800 / playbackSpeed)
  return () => clearInterval(interval)
}, [isPlaying, playbackSpeed])
```

Alert moment: When frame crosses `alert_frame` from API:
- Brief full-screen red flash (200ms, 10% opacity overlay)
- Alert sound optional (Web Audio API, short beep)
- Alert badge in TopBar switches to EMERGENCY

---

#### `<RiskScorePanel>`
Top of right column.

```
CURRENT RISK ASSESSMENT
━━━━━━━━━━━━━━━━━━━━━━
      0.84
   ████████░░
   EXTREME RISK
   EMERGENCY TIER
━━━━━━━━━━━━━━━━━━━━━━
6-HOUR FORECAST   +0.07
MODEL AUC         0.9727
```

- Large risk score number: Rajdhani 72px, colored by tier
- Progress bar: custom CSS, segmented into 4 zones (low/moderate/high/extreme), marker at current score
- Risk level label: all-caps, matching tier color, with pulsing dot if emergency
- Forecast delta: shows change from previous frame (+0.07 means rising)

Color logic:
```js
const tierColor = {
  emergency: 'var(--fire-extreme)',
  warning:   'var(--fire-high)',
  watch:     'var(--fire-moderate)',
  none:      'var(--fire-low)',
}
```

---

#### `<MetricsGrid>`
4 data cards in 2×2 grid.

Each `<MetricCard>`:
- Label: IBM Plex Mono 10px uppercase `--text-muted`
- Value: IBM Plex Mono 24px `--text-primary`
- Unit: IBM Plex Mono 12px `--text-secondary`
- Subtle left border colored by relevance

Cards:
```
┌─────────────┐  ┌─────────────┐
│ FIRE PIXELS │  │    WIND     │
│     220     │  │  15.2 m/s  │
│   hotspots  │  │  NE / 45°  │
└─────────────┘  └─────────────┘
┌─────────────┐  ┌─────────────┐
│  HUMIDITY   │  │    TEMP     │
│    8.3%     │  │   41.1°C   │
│  CRITICAL   │  │   EXTREME  │
└─────────────┘  └─────────────┘
```

Data source: current replay frame's summary object. Updates per frame.

---

#### `<SituationReport>`
LLM-generated text panel.

Header row: "SITUATION REPORT" label + "↻ REFRESH" button (right-aligned)
Body: scrollable div, max-height 160px
- IBM Plex Mono 13px, line-height 1.7
- `--text-secondary` color
- Subtle left border `--fire-moderate`
- Typing animation on first load: characters appear one by one (30ms per char)
- Loading state: "Generating report..." with blinking cursor

```jsx
// Typing effect
const [displayed, setDisplayed] = useState('')
useEffect(() => {
  if (!report) return
  let i = 0
  const timer = setInterval(() => {
    setDisplayed(report.slice(0, i))
    i++
    if (i > report.length) clearInterval(timer)
  }, 20)
  return () => clearInterval(timer)
}, [report])
```

REFRESH button: calls `/api/situation-report` with current frame data.
Show subtle spinner during loading. Never show error — fall back to template.

---

#### `<CountyAlertList>`
Bottom of right panel.

Header: "COUNTY ALERTS" + active count badge

Each `<CountyAlertRow>`:
```
Plumas County    ████████  EMERGENCY  0.84
Butte County     ██████░░  WARNING    0.67
Lassen County    ████░░░░  WATCH      0.51
Shasta County    ███░░░░░  WATCH      0.44
Tehama County    ░░░░░░░░  CLEAR      0.21
```

- County name: Inter 13px `--text-primary`
- Progress bar: 80px wide, colored by tier
- Tier badge: colored pill, 8px border-radius
- Score: IBM Plex Mono 12px `--text-secondary`
- Hover: highlight row background, show "VIEW ON MAP" ghost button
- Clicking a row: pans map to that county center

---

## Page 3: Replay Theater  `/replay`

**Full-screen immersive replay. Used during the 2-minute demo video.**

```
┌─────────────────────────────────────────────────────────┐
│ ← BACK     DIXIE FIRE REPLAY — 48 HOURS          LIVE  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│              FULL SCREEN MAP (90vh)                     │
│              (no right panel, map fills everything)     │
│                                                         │
│    ┌─────────────────────────────────────────────┐     │
│    │  Hour +20/48   Risk: 0.84   🔴 EMERGENCY    │     │
│    │  ◀  ⏪  ▐▐  ⏩  ▶▶   ━━━━━●━━━   2×       │     │
│    └─────────────────────────────────────────────┘     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Key difference from dashboard:** No side panel. Map is everything.
Floating HUD overlay (bottom center, translucent dark pill):
- Current timestamp + hour counter
- Risk score with tier color
- Play controls

**Alert moment (frame ~20):** Full dramatic treatment
- Map overlays flash red briefly
- Large centered text fades in: "⚠ EMERGENCY ALERT TRIGGERED" for 3 seconds
- Then fades out — replay continues

This is the moment from the 2-min demo script. Practice hitting play at the start of your video and letting it run to frame 20.

---

## Page 4: County Alert Board  `/alerts`

**Full alert status — shown to judges as "scalability" proof.**

```
┌─────────────────────────────────────────────────────────┐
│ ← BACK              COUNTY ALERT BOARD                  │
│                     Northern California · Live          │
├─────────────────────────────────────────────────────────┤
│ 🔴 1 EMERGENCY  🟠 1 WARNING  🟡 2 WATCH  ⚫ 1 CLEAR  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🔴  PLUMAS COUNTY              EMERGENCY  0.84  │   │
│  │     Evacuation order in effect · 220 hotspots   │   │
│  │     Wind 15.2 m/s NE · Humidity 8.3%            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🟠  BUTTE COUNTY               WARNING    0.67  │   │
│  │     Prepare for evacuation · 89 hotspots        │   │
│  │     Wind 12.1 m/s NE · Humidity 11.2%           │   │
│  └─────────────────────────────────────────────────┘   │
│  ... (one card per county)                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### `<AlertSummaryBar>`
Top strip with counts per tier. Clicking a tier filters the list below.
Each tier count: icon + number + label, colored pill background.

### `<AlertCard>`  (one per county)
Full-width card, left border 4px colored by tier.
- Header row: tier icon + county name + tier badge + score
- Detail row: situation summary (generated from metrics, not full LLM report)
- Metrics row: hotspots · wind · humidity inline chips
- Hover: slight background lift + "VIEW ON MAP →" appears right-aligned

### Sort order
Always: emergency → warning → watch → clear.
Within same tier: sort by risk_score descending.

---

## Shared Components

### `<TierBadge>`
```jsx
// Props: tier ('emergency' | 'warning' | 'watch' | 'none')
const configs = {
  emergency: { label: 'EMERGENCY', bg: '#FF3B1F22', border: '#FF3B1F', text: '#FF3B1F' },
  warning:   { label: 'WARNING',   bg: '#FF6B2B22', border: '#FF6B2B', text: '#FF6B2B' },
  watch:     { label: 'WATCH',     bg: '#FFAA0022', border: '#FFAA00', text: '#FFAA00' },
  none:      { label: 'CLEAR',     bg: '#3D4F5C22', border: '#3D4F5C', text: '#8B949E' },
}
```
Pill shape, 6px border-radius, 10px horizontal padding, 4px vertical.
Pulse animation on emergency only.

### `<RiskBar>`
```jsx
// Props: score (0-1), width (optional, default 100%)
// Segmented bar: 4 zones colored, marker at score position
```
The bar has 4 segments (low=green, moderate=amber, high=orange, extreme=red).
A white tick mark slides to the score position.

### `<DataChip>`
Small inline metric: `label: value unit`
Dark background, rounded, IBM Plex Mono 11px.
```
Wind: 15.2 m/s     Humidity: 8.3%     Temp: 41°C
```

### `<LoadingPulse>`
For map loading states, API calls in progress.
3 horizontal bars, staggered pulse animation. Dark variant.

### `<AlertFlash>`
Full-viewport overlay, pointer-events none.
```css
@keyframes alert-flash {
  0%   { opacity: 0; }
  20%  { opacity: 0.12; }
  100% { opacity: 0; }
}
background: var(--fire-extreme);
animation: alert-flash 600ms ease-out forwards;
```
Triggered by React state when alert tier first crosses to emergency.

---

## State Management

Use React Context (`AppContext`) — no Redux needed for this scope.

```js
// AppContext shape
{
  // Replay state
  replayData:      null,       // full /replay response
  currentFrame:    0,          // active frame index
  isPlaying:       false,
  playbackSpeed:   1,

  // Current data (derived from currentFrame)
  currentRisk:     0,
  currentTier:     'none',
  currentGeoJSON:  null,
  currentMetrics:  {},

  // Alerts
  countyAlerts:    [],

  // Situation report
  situationReport: '',
  reportLoading:   false,

  // UI
  alertFlash:      false,      // triggers <AlertFlash>
  hasTriggered:    false,      // true once alert_frame passed
}
```

---

## API Hooks

```
src/hooks/
├── useReplay.js         — fetches /replay, manages frame state
├── useRiskMap.js        — fetches /risk-map for current frame date
├── useAlerts.js         — fetches /alerts, polls every 30s
├── useSituationReport.js — POST /situation-report on demand
└── useModelInfo.js      — fetches /model-info once on mount
```

### `useReplay.js` pattern
```js
export function useReplay(fireId = 'dixie_2021', nFrames = 48) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [frame, setFrame]     = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed]     = useState(1)

  useEffect(() => {
    api.getReplayFrames(fireId)
       .then(r => { setData(r.data); setLoading(false) })
  }, [fireId])

  // Playback timer
  useEffect(() => {
    if (!playing || !data) return
    const id = setInterval(() => {
      setFrame(f => f >= data.total_frames - 1 ? (setPlaying(false), f) : f + 1)
    }, 800 / speed)
    return () => clearInterval(id)
  }, [playing, speed, data])

  const currentFrame = data?.frames[frame] ?? null
  return { data, loading, frame, setFrame, playing, setPlaying, speed, setSpeed, currentFrame }
}
```

---

## File Structure

```
frontend/src/
├── main.jsx
├── App.jsx                    ← Router setup
├── index.css                  ← CSS variables + global styles
│
├── pages/
│   ├── Landing.jsx            ← / route
│   ├── Dashboard.jsx          ← /dashboard route
│   ├── ReplayTheater.jsx      ← /replay route
│   └── AlertBoard.jsx         ← /alerts route
│
├── components/
│   ├── layout/
│   │   └── TopBar.jsx
│   ├── map/
│   │   ├── FireMap.jsx        ← Leaflet container
│   │   ├── RiskOverlay.jsx    ← GeoJSON choropleth layer
│   │   └── MapLegend.jsx
│   ├── replay/
│   │   └── ReplayControls.jsx
│   ├── panels/
│   │   ├── RiskScorePanel.jsx
│   │   ├── MetricsGrid.jsx
│   │   ├── SituationReport.jsx
│   │   └── CountyAlertList.jsx
│   ├── alerts/
│   │   ├── AlertSummaryBar.jsx
│   │   └── AlertCard.jsx
│   └── ui/
│       ├── TierBadge.jsx
│       ├── RiskBar.jsx
│       ├── DataChip.jsx
│       ├── StatCounter.jsx
│       ├── LoadingPulse.jsx
│       └── AlertFlash.jsx
│
├── hooks/
│   ├── useReplay.js
│   ├── useAlerts.js
│   ├── useSituationReport.js
│   └── useModelInfo.js
│
├── services/
│   └── api.js                 ← already built in Phase 1
│
└── context/
    └── AppContext.jsx
```

---

## Build Priority Order

Build in this exact order — each step is immediately demоable:

**Step 1 — Shell (30 min)**
App.jsx with React Router, index.css with all CSS variables, TopBar, Landing page static.

**Step 2 — Map (45 min)**
FireMap.jsx with Leaflet dark tiles. Hit `/risk-map` and render GeoJSON overlay. 
You have a working map with colored risk cells.

**Step 3 — Replay (45 min)**
useReplay hook + ReplayControls. Play button advances frames, map updates.
This is the demo. When this works, you can record the video.

**Step 4 — Right Panel (30 min)**
RiskScorePanel + MetricsGrid wired to currentFrame data.
Numbers update as replay plays.

**Step 5 — Situation Report (20 min)**
SituationReport component + useSituationReport hook.
Typing animation, refresh button.

**Step 6 — Alert Board (20 min)**
CountyAlertList on dashboard + full AlertBoard page at /alerts.

**Step 7 — Landing + Polish (30 min)**
Ember particles, count-up animations, alert flash, mobile layout.

**Total: ~4 hours for a complete, polished, demo-ready dashboard.**

---

## Demo-Critical Checklist

Before recording the 2-minute video:

- [ ] Leaflet map loads with dark tiles, no white flash
- [ ] GeoJSON overlay renders with correct colors (green → red gradient)
- [ ] Play button starts replay, map colors update per frame
- [ ] Frame ~20 triggers EMERGENCY tier — red badge fires in TopBar
- [ ] AlertFlash red overlay appears at alert moment
- [ ] Situation report text visible in right panel
- [ ] County alert list shows 5 counties with tiers
- [ ] Mobile layout doesn't break (stack columns)
- [ ] No console errors during replay playback
- [ ] Dashboard loads in < 2 seconds on first visit