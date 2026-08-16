/** Fixed portrait design space. Everything is authored in these units and scaled to fit. */
export const DW = 720;
export const DH = 1480;

export type Rect = { x: number; y: number; w: number; h: number };

/** Wall/floor seam. The dining room sits behind it, the kitchen line in front. */
export const FLOOR_Y = 404;

/* ---------------------------------------------------------- dining room (back) */

export const CARD: Rect = { x: 104, y: 86, w: 512, h: 230 };
export const HEART_Y = 362;
export const FAMILY_BASE = 496;
export const TABLE: Rect = { x: 176, y: 472, w: 368, h: 42 };

/** Lily now stands in the dining room — the kitchen line needs every unit it can get. */
export const LILY_X = 660;
export const LILY_BASE = 532;

/* ------------------------------------------------------- kitchen line (front) */

/** Four cook slots per cook station, laid out 2x2 so two stations fit side by side. */
export const SLOTS = 4;
/** The drink maker has one pour position per spout: 0 = lemonade, 1 = water. */
export const DRINK_SLOTS = 2;

const scol = (i: number): number => i % 2;
const srow = (i: number): number => (i / 2) | 0;

/* row one — grill + pot */
export const GRILL: Rect = { x: 14, y: 536, w: 344, h: 316 };
export const POT: Rect = { x: 362, y: 536, w: 344, h: 316 };

export const GRATE_Y0 = 582;
const COOK_ROW_Y = [634, 742];
const COOK_METER_Y = [564, 690];

export const grillSlot = (i: number) => ({ x: GRILL.x + 92 + scol(i) * 160, y: COOK_ROW_Y[srow(i)] });
export const potSlot = (i: number) => ({ x: POT.x + 92 + scol(i) * 160, y: COOK_ROW_Y[srow(i)] });
export const cookMeterY = (i: number): number => COOK_METER_Y[srow(i)];

/* row two — fryer + drink maker */
export const FRYER: Rect = { x: 14, y: 866, w: 344, h: 262 };
export const DRINKS: Rect = { x: 362, y: 866, w: 344, h: 262 };

export const OIL_Y0 = 906;
export const OIL_Y1 = 1092;
const FRY_ROW_Y = [952, 1046];
const FRY_METER_Y = [900, 998];

export const fryerSlot = (i: number) => ({ x: FRYER.x + 92 + scol(i) * 160, y: FRY_ROW_Y[srow(i)] });
export const fryMeterY = (i: number): number => FRY_METER_Y[srow(i)];

export const DRINK_HEAD: Rect = { x: 362, y: 878, w: 344, h: 124 };
export const drinkSlot = (i: number) => ({ x: DRINKS.x + 90 + i * 164, y: 1046 });
export const drinkTap = (i: number) => ({ x: DRINKS.x + 90 + i * 164, y: 946 });

/* ------------------------------------------------------------- tray + pantry */

export const TRAY: Rect = { x: 14, y: 1146, w: 692, h: 96 };
/** Twelve slots — matches the largest order the curve can ask for. */
export const TRAY_CAP = 12;
export const trayX = (i: number): number => 44 + i * 56;
export const TRAY_Y = 1194;

export const FRIDGE: Rect = { x: 14, y: 1252, w: 692, h: 214 };
/** Six source buttons, 3 across x 2 down. */
export const SOURCES = 6;
export const srcRect = (i: number): Rect => ({
  x: 22 + (i % 3) * 230,
  y: 1262 + ((i / 3) | 0) * 98,
  w: 214,
  h: 86,
});
/** Where an item is born when it leaves the pantry. */
export const srcItem = (i: number): { x: number; y: number } => {
  const r = srcRect(i);
  return { x: r.x + 45, y: r.y + r.h / 2 };
};

/* ----------------------------------------------------------------- tap zones */

/** Generously padded — thumb-friendly, no precision required. */
export const HIT = {
  /** Order card + happiness meter + the family themselves are all "feed them". */
  family: { x: 40, y: 76, w: 640, h: 452 },
} satisfies Record<string, Rect>;

/** Padded out to the cell edges so a sloppy thumb still lands on a source. */
export const srcHit = (i: number): Rect => ({
  x: 14 + (i % 3) * 231,
  y: 1252 + ((i / 3) | 0) * 100,
  w: 231,
  h: 100,
});

export const grillHit = (i: number): Rect => {
  const s = grillSlot(i);
  return { x: s.x - 78, y: s.y - 56, w: 156, h: 110 };
};
export const potHit = (i: number): Rect => {
  const s = potSlot(i);
  return { x: s.x - 78, y: s.y - 56, w: 156, h: 110 };
};
export const fryerHit = (i: number): Rect => {
  const s = fryerSlot(i);
  return { x: s.x - 78, y: s.y - 48, w: 156, h: 96 };
};
/** Each spout owns half the drink maker, top to bottom — a huge, forgiving target. */
export const drinkHit = (i: number): Rect => ({ x: DRINKS.x + i * 172, y: 878, w: 172, h: 240 });

export const trayHit = (i: number): Rect => ({ x: trayX(i) - 28, y: 1150, w: 56, h: 90 });

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
  /* fryer + drinks */
  oil: "#c98a2a",
  oilLight: "#e8b757",
  fryRaw: "#efe0b4",
  fryDone: "#f6b93b",
  fryOver: "#a3701f",
  nugRaw: "#e8d5a6",
  nugDone: "#cf8f3c",
  nugOver: "#7f4c1c",
  lemon: "#ffd93b",
  lemonDeep: "#e8a71b",
  aqua: "#9fdcf2",
  aquaDeep: "#4aa6cc",
  steel: "#c2cad1",
  steelDark: "#4b5258",
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
