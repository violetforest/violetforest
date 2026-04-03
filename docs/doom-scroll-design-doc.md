# Doom Scroll Shell - Design Document

> How the CodePen "Doom Scroll" demo works, and how to reuse its scroll-driven 3D architecture for any aesthetic.

**Original:** [codepen.io/cobra_winfrey/pen/oNOMRav](https://codepen.io/cobra_winfrey/pen/oNOMRav) by Cobra Winfrey (Front End Conf 2024)

---

## 1. Core Concept

A **pure CSS** first-person 3D walkthrough driven entirely by the browser's scroll position. There is **zero JavaScript** — the `script.js` is literally a comment. Everything runs on:

- **CSS `animation-timeline: scroll()`** — maps scroll position to animation progress
- **CSS 3D transforms** (`perspective`, `preserve-3d`, `rotateX/Y/Z`, `translateZ`) — builds the 3D environment
- **CSS `:has()` + checkbox hack** — manages state (start screen, enemy kills, victory)

The user scrolls the page, which drives a keyframe animation that translates/rotates a "camera" (`.inner`) through a 3D level built from grid-placed `<div>` walls.

---

## 2. Architecture Overview

```
body (height: 2000vh — the "scroll runway")
  |
  +-- #wrapper (600x600px, fixed, centered, has perspective)
  |     |
  |     +-- #level (3D container, rotateX 85deg = top-down tilt)
  |           |
  |           +-- .inner (THE CAMERA — animated by scroll)
  |                 |
  |                 +-- div (x5) — WALLS (rotated flat planes)
  |                 +-- span (x6) — INTERACTIVE ENTITIES (enemies)
  |                       +-- input[checkbox] — click hitboxes
  |
  +-- #logo (start screen overlay, checkbox to dismiss)
  +-- #weapon (fixed sprite, bottom of viewport)
  +-- #hud (fixed status bar)
```

### The Illusion

The 3D "level" is actually a flat grid (`9x9`) tilted nearly vertical (`rotateX(85deg)`). Walls are grid cells rotated 90 degrees to stand upright. The `.inner` element moves and rotates via keyframes, simulating the player walking through corridors. Because `#wrapper` has `perspective: 600px`, this all renders as a convincing first-person view.

---

## 3. Key Mechanisms (What to Keep)

### 3.1 Scroll-Driven Animation (THE CORE ENGINE)

This is the entire scroll-to-3D-movement system. **Keep this.**

```css
/* The body is extremely tall — this is the "scroll runway" */
body {
  height: clamp(1200px, 2000vh, 2000vh);
}

/* The camera movement animation is driven by scroll position */
.inner {
  animation: rotate linear;
  animation-timeline: scroll();        /* <-- THE MAGIC */
  animation-range: entry 0 cover 100%;
}

/* Each keyframe % = a scroll position */
@keyframes rotate {
  0%   { transform: translateY(0px); }
  20%  { transform: translateY(150px) rotate(0deg); }
  30%  { transform: translateY(200px) rotate(90deg); }
  /* ...etc — defines the camera path through the level */
  100% { transform: translateX(200px) translateY(800px) rotate(-180deg); }
}
```

**How it works:**
- `body` height = total scroll distance (2000vh = 20 full screens of scrolling)
- `animation-timeline: scroll()` binds the `@keyframes` progress to scroll position (0% = top, 100% = fully scrolled)
- The keyframes use `translateX/Y` (movement) and `rotate` (turning) to trace a path
- `transform-origin` shifts at key points to make turns feel natural

**Browser support:** Chrome/Edge 115+, Firefox (flag), Safari (not yet). The demo has a `@supports` fallback.

### 3.2 3D Perspective Setup

```css
#wrapper {
  width: 600px;
  height: 600px;
  position: fixed;           /* stays in viewport while body scrolls */
  perspective: 600px;        /* defines the 3D viewing distance */
}

#level {
  transform: translateZ(300px) rotateX(85deg);  /* tilt the floor plane */
  transform-style: preserve-3d;                 /* enable 3D for children */
}

/* EVERYTHING must preserve-3d */
#level * { transform-style: preserve-3d; }
#level *:before, #level *:after { transform-style: preserve-3d; }
```

### 3.3 State Management (Checkbox Hack)

No JS — state is tracked via hidden `<input type="checkbox">` elements and `:has()`:

| State | Mechanism |
|-------|-----------|
| Start game | `#logo input:checked` — dismisses splash, enables scroll |
| Kill enemy | `span input:checked` — hides sprite, shows explosion |
| Victory | `:has(.inner span:nth-of-type(6) input:checked)` — all killed |

```css
/* Before start: body is fixed (no scrolling) */
body, html { position: fixed; overflow: hidden; }

/* After clicking start: body becomes scrollable */
@supports (animation-timeline: scroll()) {
  body:has(#logo input:checked) {
    position: relative;
    overflow: auto;
  }
}
```

### 3.4 Wall Construction (Grid + Rotated Planes)

Walls are `<div>` elements placed on a CSS Grid, then rotated to stand upright:

```css
.inner {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  grid-template-rows: repeat(9, 1fr);
}

/* A wall segment */
.inner > div:nth-of-type(1) {
  grid-area: 9 / 4 / 10 / 6;              /* position on the floor grid */
  background: url("wall-texture.png");      /* wall texture */
  transform-origin: bottom;
  transform: rotateX(-90deg);               /* stand it up from the floor */
}

/* Perpendicular wall via ::before */
.inner > div:nth-of-type(1):before {
  transform: rotateY(-90deg);               /* turn 90 degrees */
}
```

**Pattern:** Each `<div>` = a floor-grid cell rotated upright. `::before`/`::after` pseudo-elements create perpendicular wall segments from the same cell.

### 3.5 Ceiling Layer

The `.inner::before` pseudo-element creates a second textured plane offset on the Z-axis:

```css
.inner:before {
  background: url("ceiling-texture.png");
  transform: translateZ(calc(600px / 9));  /* one grid-cell height up */
}
```

---

## 4. What to Swap (Aesthetics)

### 4.1 Textures

All visual identity comes from background images. Replace these:

| Element | Current | Replace With |
|---------|---------|-------------|
| `.inner` background | `C99.png` (Doom floor) | Your floor texture |
| `.inner:before` background | `C64.png` (Doom ceiling) | Your ceiling texture |
| Wall divs background | `C4.png`, `C19.png` (brick walls) | Your wall textures |
| Enemy sprites (span::before) | `demon1.gif`, `demon3.gif`, `demon4.gif`, `caco-cacodemon.gif` | Your objects/characters |
| `#weapon` background | Doom shotgun sprite sheet | Your UI element or remove |
| `#hud:before` background | Doomguy face gif | Your avatar or remove |
| `#logo` background | Doom logo PNG | Your splash/title image |

### 4.2 Fonts

```scss
/* Replace these two font imports */
@import url("https://fonts.googleapis.com/css2?family=Press+Start+2P");
@font-face { font-family: "Doom"; src: url("Upheaval.woff2"); }
```

### 4.3 Color Scheme

Key colors to change:
- `body { background: #000; }` — void/sky color
- `#hud { background: #333; }` — HUD bar
- Scrollbar: `#e9544b` to `#f9ef51` gradient
- Victory overlay: `rgba(255, 0, 0, 0.75)`
- Logo text gradient: `#e9544b` to `#f9ef51`

### 4.4 HUD / Weapon / Overlays

The `#weapon`, `#hud`, and `#logo` divs are pure presentation. You can:
- **Remove them entirely** for a clean exploration experience
- **Restyle them** as navigation UI, progress indicators, etc.
- The weapon "shoot" animation uses a sprite sheet + `steps()` — replaceable with any sprite sheet

---

## 5. What to Modify (Level Design)

### 5.1 Camera Path

Edit the `@keyframes rotate` to define your walkthrough route:

```css
@keyframes rotate {
  0%   { transform: translateY(0); }
  /* Each keyframe = a waypoint on the path */
  /* translateX/Y = move, rotate = turn */
  /* transform-origin = pivot point for turns */
  25%  { transform: translateY(200px); }
  50%  { transform: translateY(200px) rotate(90deg);
         transform-origin: 50% calc(50% - 100px); }
  /* ... */
}
```

**Tips:**
- Keep moves (translateX/Y) between turns gradual — sudden jumps look jarring
- Set `transform-origin` before a rotation keyframe to control the pivot point
- Percentage gaps = scroll distance between waypoints (20% gap = more scrolling for that segment)

### 5.2 Level Layout

The 9x9 grid is arbitrary. You can change grid dimensions:

```css
.inner {
  grid-template-columns: repeat(12, 1fr);  /* wider level */
  grid-template-rows: repeat(12, 1fr);
}
```

Then reposition walls with `grid-area`:

```css
.inner > div:nth-of-type(1) {
  grid-area: row-start / col-start / row-end / col-end;
}
```

### 5.3 Wall Height

The ceiling Z-offset controls perceived wall height:

```css
.inner:before {
  transform: translateZ(calc(600px / 9));  /* = one grid cell = ~67px */
}
```

Increase for taller walls, decrease for a more open feel.

### 5.4 Scroll Length

```css
body {
  height: clamp(1200px, 2000vh, 2000vh);  /* longer = slower movement */
}
```

- `2000vh` = 20 screens of scrolling. Reduce for a shorter experience, increase for slower pacing.
- `animation-range: entry 0 cover 100%` — you can also narrow this to use only part of the scroll.

### 5.5 Interactive Elements

Each `<span>` with an `<input type="checkbox">` is a clickable entity. The grid placement, rotation, and sprite are all CSS:

```html
<span><input type="checkbox" /></span>
```

```css
.inner > span:nth-of-type(N) {
  grid-area: row / col / row+1 / col+1;  /* position in level */
  --y: 90deg;                              /* face direction */
  --delay: 2s;                             /* animation delay */
}
.inner > span:nth-of-type(N):before {
  background: url("your-sprite.gif");      /* the visual */
}
```

These don't have to be enemies — they can be information cards, portfolio pieces, navigation points, etc.

---

## 6. Adaptation Ideas

### Portfolio / Gallery Walk
- Walls display project screenshots as textures
- Interactive spans show project cards that expand on click
- HUD becomes a navigation bar with section names
- Remove weapon, replace with a subtle cursor effect

### Product Showcase
- Each corridor section = a product feature
- Wall textures = product photography
- Interactive elements = "Learn more" hotspots
- End state = CTA instead of "victory"

### Storytelling / Narrative
- Wall textures change per section (environments)
- Spans hold character illustrations that animate on approach
- Text overlays at keyframe waypoints via `content:` on pseudo-elements
- Scroll length tuned for reading pace

### Museum / Exhibition
- Clean white/marble wall textures
- Artwork placed as span sprites on walls
- Click to reveal artwork details (checkbox → info overlay)
- Ambient lighting via box-shadows and gradients

---

## 7. Browser Support & Fallbacks

**Required APIs:**
- `animation-timeline: scroll()` — Chrome 115+, Edge 115+
- `:has()` selector — Chrome 105+, Safari 15.4+, Firefox 121+
- CSS `perspective` / `preserve-3d` — all modern browsers

**The demo already has a fallback pattern:**
```css
@supports (animation-timeline: scroll()) {
  /* scroll-driven behavior */
}
/* Without support: static view with "browser not supported" message */
```

For broader support, you could add a JS polyfill for scroll-timeline or fall back to a JS `scroll` event listener that manually sets `transform` based on `scrollY / maxScroll`.

---

## 8. File Structure for Your Version

```
your-project/
  index.html          <!-- keep structure: #wrapper > #level > .inner > divs + spans -->
  style.scss           <!-- or .css — all the magic lives here -->
  textures/
    floor.png
    ceiling.png
    wall-1.png
    wall-2.png
  sprites/
    entity-1.gif
    entity-2.png
  fonts/
    your-font.woff2
```

**Minimal HTML to keep:**
```html
<div id="wrapper">
  <div id="level">
    <div class="inner">
      <!-- div = wall, span = interactive entity -->
      <div></div>
      <span><input type="checkbox" /></span>
    </div>
  </div>
</div>
<!-- optional: -->
<div id="logo"><input type="checkbox"></div>
<div id="hud"></div>
```

---

## 9. Quick-Start Checklist

1. Copy the HTML structure (wrapper > level > inner > divs/spans)
2. Copy the CSS scroll-timeline engine (body height, `.inner` animation, `#wrapper` perspective, `#level` tilt)
3. Replace all texture URLs with your own images
4. Redesign `@keyframes rotate` for your level layout
5. Reposition wall `<div>`s on the grid via `grid-area`
6. Replace or remove `#weapon`, `#hud`, `#logo`
7. Update fonts and colors
8. Adjust `body height` for desired scroll pacing
9. Test in Chrome/Edge (primary), add fallback for other browsers
