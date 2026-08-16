# Lily's Grilled Skewers 🔥

An arcade island-kitchen rush. Four stations, six things to make, one shared serving tray, and a family
that gets hungrier and faster every single order.

Built for one kid on one phone: portrait-only, tap-only, no accounts.

## The line

| Station | Slots | Makes |
| ------- | ----- | ----- |
| **Grill** | 4 | steak (flip mechanic) |
| **Steam pot** | 4 | lobster |
| **Deep fryer** | 4 | fries **and** nuggets, mixed freely across the four baskets |
| **Drink maker** | 2 | lemonade (left spout), water (right spout) |

The pantry at the bottom is six buttons in a 3 × 2 grid. Each one routes to its own station's next free
slot — you never pick a slot yourself.

## The loop

1. Tap a pantry button. The item flies to its station and starts cooking.
2. Steaks flash **FLIP!** at the halfway mark. Tap inside the window for a perfect flip (+2 pts). Miss it
   and the steak still cooks — it just comes out well-done, no bonus.
3. Fries and nuggets are set-and-pull: no flip. They finish **golden** (+2 if you pull them then) and
   after four more seconds slide to **OVER** — still edible, still servable, just no bonus. Nothing burns.
4. Drinks pour themselves. Tap a spout (or its pantry button), the glass fills in ~1s and walks itself
   onto the tray. They are the easy filler of an order.
5. Tap anything glowing **TAP!** to plate it on the serving tray (holds 12, shared across orders).
6. Tap the family when the order card is satisfied. Extra items stay on the tray for the next order.
7. Let the order timer hit zero and it's **game over**.

If a station is full, its pantry button stamps **FULL**. If the tray is full, every pantry button stamps
**TRAY FULL** and you can tap any tray item to toss it — a deadlock valve, and the only time tray taps
do anything.

## Difficulty

**Timer** starts at 30s and sheds exactly one second per order, holding at a 12s floor:

| Order | 1 | 2 | 5 | 10 | 15 | 18 | 19+ |
| ----- | - | - | - | -- | -- | -- | --- |
| Timer | 30s | 29s | 26s | 21s | 16s | 13s | 12s |

**Order size** is `min(12, max(1, floor(order × 0.6)))` — 1 item at order 1, 3 at order 5, 6 at order 10,
9 at order 15, 12 from order 20 on. It caps at 12 because the tray holds 12; an order you physically
cannot carry would be unwinnable rather than hard.

The mix is random per order, with rules:

- always at least one cooked food — never a pure drinks order
- drinks never exceed half the order
- no single kind exceeds 4 (one station-load), so big orders are always varied orders
- from order 10, every order includes at least one steak, lobster, fries *and* nuggets

**Scoring:** 10 pts per item in the order, +2 per perfect item used (flipped steak or golden fryer
basket), +1 per whole second left on the timer, and a **+15 variety bonus** when a single order contains
all six kinds. About 30% of orders past #10 qualify.

Best score lives in `localStorage` under `lily-arcade-best-v1`. First-ever play gets four dismissable
tooltips, flagged by `lily-arcade-tips-v2`.

## Balance

Measured with an auto-play bot driving the real simulation at a fixed tap cadence, with a share of taps
burned to model hesitation. Median wall over 9 runs each:

| Player model | Tap rate | Wasted taps | Wall |
| ------------ | -------- | ----------- | ---- |
| Perfect | 5/s | 0% | order 26 |
| Fast adult | 4/s | 15% | order 19 |
| Casual adult | 3/s | 25% | order 18 |
| Kid | 2.2/s | 35% | order 16 |
| Young kid | 1.7/s | 45% | order 13 |

Spare time per order falls off a cliff between order 16 (~7s left) and order 17 (~1.5s left). Difficulty
is a single knob: `GROWTH` in `src/state.ts`.

## Look

The kitchen is styled after the old-school Hawaiian plate-lunch joints in Honolulu: warm wood plank walls,
deep-red accents, a long black firebox with real glowing coals and live flames, a steel steam pot, a
wire basket sitting in shimmering oil, strips of dried pipikaula hanging on hooks, and a couple of
monstera leaves in the corner. The dining room sits behind the line, so the order ticket is pinned high
where you can scan it while both hands are busy.

## Tech

- Vite + TypeScript + HTML5 Canvas 2D. No game framework, no image assets — every sprite, including all
  six food items and all four stations, is drawn with Canvas primitives and gradients.
- Web Audio API for all sound (layered per-slot sizzle, fryer crackle, pour gurgle, bubbles, flip, ding,
  cheer, whoosh, game-over "aww"). Synthesized at runtime; nothing to download.
- ~18 kB gzipped total.

Fixed 720 × 1480 design space, uniformly scaled to fit the viewport, with the backdrop bleeding past the
edges so there is no letterbox on any phone.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # -> dist/
```

In dev builds `window.__dev` exposes `{ tap(x, y), step(seconds, fps, paint), state(), makeOrder(n), hits }`
for driving the game deterministically in design-space coordinates. It is stripped from production builds.
