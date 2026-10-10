# Cosmic Portal

An interactive 3D animation built with Vite + Three.js (vanilla JavaScript, no
framework, no external 3D assets - all geometry and effects are procedural).

## What's in the scene

- **Dark space background** with a procedurally generated starfield
- **Glowing central sphere** with a custom fresnel shader, hot inner core and a
  soft canvas-generated halo
- **~2,600 colorful particles** orbiting on tilted shells (inner orbits move
  faster, Kepler-style)
- **Four rotating geometric rings** (torus geometry, solid + wireframe) with
  slow precession and glowing "beads" traveling along them

## Interaction

- Mouse move: smooth camera parallax
- Click / tap: light pulse from the core
- Space: pause / play
- HUD (top-left): pause button, speed slider, toggles for particles / rings / stars

## Launch

```bash
cd cosmic-portal
npm install
npm run dev
```

Then open http://localhost:5173 (Vite prints the exact URL).

Other scripts:

```bash
npm run build    # production build into dist/
npm run preview  # serve the production build
```

## Resize & performance

The renderer listens for `resize`, updates the camera aspect and size, and caps
the pixel ratio at 2x to keep high-refresh / 4K displays smooth. The animation
loop uses clamped delta time so tab-switching or hiccups never cause jumps.
