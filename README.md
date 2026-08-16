# Lily's Grilled Skewers 🔥

A cozy, no-fail mobile cooking mini-game. Tap through eight steps — fridge → grill → pot → family — and
everybody goes home happy.

Built for one kid on one phone: portrait-only, tap-only, no timers, no fail state, no accounts.

## The loop

1. Tap the fridge to open it
2. Tap the steak — it hops onto the prep board
3. Tap the lobster
4. Tap the grill — charcoal catches, flames come up
5. Put the steak on the grate, then tap once at the halfway mark to flip it
6. Drop the lobster in the pot and watch it go from gray to bright red
7. Lift both off
8. Tap the family — hearts, sparkles, score

Best score lives in `localStorage`.

## Look

The kitchen is styled after the old-school Hawaiian plate-lunch joints in Honolulu: warm wood plank walls,
deep-red tiled counter apron, black charcoal firebox with real glowing coals, strips of dried pipikaula
hanging on hooks over the grill, and a couple of monstera leaves in the corner.

## Tech

- Vite + TypeScript + HTML5 Canvas 2D. No game framework, no image assets — every sprite is drawn with
  Canvas primitives and gradients.
- Web Audio API for all sound (sizzle, bubble, flip, ding, cheer). Synthesized at runtime; nothing to download.
- ~13 kB gzipped total.

Fixed 720 × 1320 design space, uniformly scaled to fit the viewport, with the backdrop bleeding past the
edges so there is no letterbox on any phone.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # -> dist/
```

In dev builds `window.__dev` exposes `{ tap(x, y), step(seconds), state() }` for driving the game
deterministically in design-space coordinates. It is stripped from production builds.
