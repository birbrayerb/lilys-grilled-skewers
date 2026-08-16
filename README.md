# Lily's Grilled Skewers 🔥

An arcade island-kitchen rush. Four steaks on the grill, four lobsters in the pot, one shared serving
tray, and a family that gets hungrier and faster every order.

Built for one kid on one phone: portrait-only, tap-only, no accounts.

## The loop

1. Tap the **STEAK** fridge door — a steak flies to the next free grill slot (4 slots)
2. Tap the **LOBSTER** door — a lobster drops into the next free pot well (4 wells)
3. Steaks flash **FLIP!** at the halfway mark. Tap it in the window for a perfect flip (+2 pts).
   Miss it and the steak still cooks — it just comes out well-done, no bonus. Lobsters need no flip.
4. Tap anything glowing **TAP!** to plate it on the serving tray (holds 8, shared across orders)
5. Tap the family when the order card is satisfied. Extra items stay on the tray for the next order.
6. Let the order timer hit zero and it's **game over**.

If a station is full the fridge door stamps **FULL** instead of adding. If the tray is full you can tap
any item on it to toss it — a deadlock valve, and the only time tray taps do anything.

## Difficulty

| Order | Items | Timer |
| ----- | ---------------- | ---- |
| 1 | 1 steak | 35s |
| 2 | 1 steak + 1 lobster | 30s |
| 3 | 2 steak + 1 lobster | 26s |
| 4 | 2 steak + 2 lobster | 22s |
| 5 | 3 steak + 2 lobster | 19s |
| 6 | 3 steak + 3 lobster | 17s |
| 7 | 4 steak + 3 lobster | 15s |
| 8 | 4 steak + 4 lobster | 14s |
| 9 | 4 steak + 4 lobster | 13s |
| 10+ | 4 steak + 4 lobster | 12s |

Order size caps at 8 because the tray holds 8 — an order you physically cannot carry would be
unwinnable rather than hard. Past order 10 the timer holds at the 12s floor.

**Scoring:** 10 pts per item in the order, +2 per perfectly-flipped steak used, +1 per whole second left
on the timer. Best score lives in `localStorage` under `lily-arcade-best-v1` (the cozy-mode key is left
untouched). First-ever play gets three dismissable tooltips, flagged by `lily-arcade-tips-v1`.

## Look

The kitchen is styled after the old-school Hawaiian plate-lunch joints in Honolulu: warm wood plank walls,
deep-red accents, a long black firebox with real glowing coals and live flames, strips of dried pipikaula
hanging on hooks, and a couple of monstera leaves in the corner. The dining room sits behind the line, so
the order ticket is pinned high where you can scan it while both hands are busy.

## Tech

- Vite + TypeScript + HTML5 Canvas 2D. No game framework, no image assets — every sprite is drawn with
  Canvas primitives and gradients.
- Web Audio API for all sound (layered per-slot sizzle, bubbles, flip, ding, cheer, whoosh, game-over
  "aww"). Synthesized at runtime; nothing to download.
- ~15 kB gzipped total.

Fixed 720 × 1480 design space, uniformly scaled to fit the viewport, with the backdrop bleeding past the
edges so there is no letterbox on any phone.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # -> dist/
```

In dev builds `window.__dev` exposes `{ tap(x, y), step(seconds), state() }` for driving the game
deterministically in design-space coordinates. It is stripped from production builds.
