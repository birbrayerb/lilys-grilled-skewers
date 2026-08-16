/** Fixed portrait design space. Everything is authored in these units and scaled to fit. */
export const DW = 720;
export const DH = 1320;

export type Rect = { x: number; y: number; w: number; h: number };

export const FLOOR_Y = 878;

export const FRIDGE: Rect = { x: 16, y: 250, w: 194, h: 628 };
export const COUNTER: Rect = { x: 214, y: 700, w: 500, h: 178 };
export const GRILL: Rect = { x: 232, y: 452, w: 264, h: 248 };
export const GRATE_Y = 480;
export const COAL_Y = 566;
export const POT: Rect = { x: 536, y: 592, w: 154, h: 108 };
export const BOARD: Rect = { x: 158, y: 986, w: 164, h: 40 };
export const FAMILY: Rect = { x: 330, y: 928, w: 376, h: 326 };

/** Anchor points items animate between. */
export const P = {
  steakFridge: { x: 112, y: 432 },
  lobsterFridge: { x: 112, y: 566 },
  slotA: { x: 196, y: 948 },
  slotB: { x: 284, y: 948 },
  steakGrill: { x: 364, y: 482 },
  lobsterPot: { x: 613, y: 644 },
  steakTable: { x: 452, y: 1092 },
  lobsterTable: { x: 584, y: 1092 },
} as const;

/** Generously padded tap zones — thumb-friendly, no precision required. */
export const HIT = {
  fridge: { x: 8, y: 244, w: 216, h: 640 },
  fridgeSteak: { x: 34, y: 372, w: 158, h: 122 },
  fridgeLobster: { x: 34, y: 502, w: 158, h: 128 },
  grill: { x: 222, y: 372, w: 286, h: 336 },
  pot: { x: 518, y: 548, w: 192, h: 168 },
  family: { x: 326, y: 924, w: 386, h: 336 },
} satisfies Record<string, Rect>;

export const C = {
  wallDark: "#3a1d12",
  wallPlank: "#7a4527",
  wallPlank2: "#8a5030",
  wallSeam: "#4a2716",
  wallShade: "#25120a",
  floor: "#442014",
  floorDark: "#31170e",
  red: "#9e1b1b",
  redDeep: "#6d1010",
  cream: "#ffe9c9",
  gold: "#ffc45c",
  wood: "#8a5a34",
  woodDark: "#5c3a1f",
  woodLight: "#a97542",
  steel: "#9aa1a8",
  steelDark: "#5b6167",
  black: "#141110",
  black2: "#241f1c",
  ember: "#ff7a18",
  emberHot: "#ffd166",
  flame1: "#ff2d00",
  flame2: "#ff8c14",
  flame3: "#ffe066",
  green: "#2f7d4f",
  greenLight: "#48a86a",
  greenDark: "#1d5535",
  skin: "#f4cba4",
  skinDeep: "#d9a578",
  hair: "#3d241a",
  apron: "#ff9fb2",
  steakRaw: "#c2646d",
  steakDone: "#8a4a26",
  lobRaw: "#a3919a",
  lobDone: "#e33b1c",
} as const;

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
export const clamp01 = (v: number) => clamp(v, 0, 1);
/** Smooth ease-in-out used by every tween. */
export const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export function mixHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r = Math.round(lerp((pa >> 16) & 255, (pb >> 16) & 255, t));
  const g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, t));
  const bl = Math.round(lerp(pa & 255, pb & 255, t));
  return `rgb(${r},${g},${bl})`;
}

export function hit(r: Rect, x: number, y: number): boolean {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function roundRect(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + rr, y);
  c.arcTo(x + w, y, x + w, y + h, rr);
  c.arcTo(x + w, y + h, x, y + h, rr);
  c.arcTo(x, y + h, x, y, rr);
  c.arcTo(x, y, x + w, y, rr);
  c.closePath();
}

/** Deterministic pseudo-random so wood grain / coals don't shimmer between frames. */
export function rnd(seed: number): number {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}
