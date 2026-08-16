/** Fixed portrait design space. Everything is authored in these units and scaled to fit. */
export const DW = 720;
export const DH = 1480;

export type Rect = { x: number; y: number; w: number; h: number };

/** Wall/floor seam. The dining room sits behind it, the kitchen line in front. */
export const FLOOR_Y = 420;

/* ---------------------------------------------------------- dining room (back) */

export const CARD: Rect = { x: 104, y: 104, w: 512, h: 204 };
export const HEART_Y = 368;
export const FAMILY_BASE = 500;
export const TABLE: Rect = { x: 176, y: 484, w: 368, h: 48 };

/* ------------------------------------------------------- kitchen line (front) */

/** Four cook slots per station, sharing one column grid. */
export const SLOTS = 4;
export const slotX = (i: number): number => 90 + i * 144;

export const GRILL: Rect = { x: 18, y: 560, w: 576, h: 260 };
export const GRATE_Y0 = 604;
export const GRILL_SLOT_Y = 636;
export const GRILL_METER_Y = 580;

export const POT: Rect = { x: 18, y: 866, w: 576, h: 180 };
export const POT_SLOT_Y = 904;
export const POT_METER_Y = 856;

export const LILY_X = 656;
export const LILY_BASE = 1080;

export const FRIDGE: Rect = { x: 18, y: 1090, w: 684, h: 200 };
export const doorRect = (d: number): Rect => ({ x: d === 0 ? 26 : 364, y: 1098, w: 330, h: 184 });
/** Where an item is born when it leaves the fridge. */
export const doorItem = (d: number): { x: number; y: number } => ({ x: d === 0 ? 191 : 529, y: 1170 });

export const TRAY: Rect = { x: 18, y: 1330, w: 684, h: 104 };
export const TRAY_CAP = 8;
export const trayX = (i: number): number => 60 + i * 84;
export const TRAY_Y = 1380;

/* ----------------------------------------------------------------- tap zones */

/** Generously padded — thumb-friendly, no precision required. */
export const HIT = {
  /** Order card + happiness meter + the family themselves are all "feed them". */
  family: { x: 56, y: 96, w: 608, h: 470 },
} satisfies Record<string, Rect>;

/** Padded out to the unit edges so a sloppy thumb still lands on a door. */
export const doorHit = (d: number): Rect => ({ x: d === 0 ? 18 : 360, y: 1086, w: 342, h: 208 });

export const grillHit = (i: number): Rect => ({ x: slotX(i) - 70, y: 572, w: 140, h: 128 });
export const potHit = (i: number): Rect => ({ x: slotX(i) - 70, y: 858, w: 140, h: 154 });
export const trayHit = (i: number): Rect => ({ x: trayX(i) - 40, y: 1332, w: 80, h: 96 });

export const C = {
  wallDark: "#3a1d12",
  wallPlank: "#7a4527",
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

/** Accepts "#rrggbb" or the "rgb(r,g,b)" this function itself returns, so mixes can chain. */
function parseCol(s: string): [number, number, number] {
  if (s.charCodeAt(0) === 35) {
    const v = parseInt(s.slice(1), 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }
  const p = s.slice(s.indexOf("(") + 1, s.lastIndexOf(")")).split(",");
  return [Number(p[0]), Number(p[1]), Number(p[2])];
}

export function mixHex(a: string, b: string, t: number): string {
  const pa = parseCol(a);
  const pb = parseCol(b);
  const r = Math.round(lerp(pa[0], pb[0], t));
  const g = Math.round(lerp(pa[1], pb[1], t));
  const bl = Math.round(lerp(pa[2], pb[2], t));
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
  c.beginPath();
  roundRectPath(c, x, y, w, h, r);
}

/** Appends a rounded-rect subpath without resetting the current path. */
export function roundRectPath(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
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
