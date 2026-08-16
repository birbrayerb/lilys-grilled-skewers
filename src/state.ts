import { SLOTS } from "./layout.ts";

export type Kind = "steak" | "lobster";

/** start = title card, tips = first-play onboarding, play = arcade, over = game over. */
export type Phase = "start" | "tips" | "play" | "over";

export type Tween = {
  fx: number;
  fy: number;
  tx: number;
  ty: number;
  fs: number;
  ts: number;
  arc: number;
  spin: number;
  t: number;
  dur: number;
  done: () => void;
};

export type Item = {
  kind: Kind;
  x: number;
  y: number;
  scale: number;
  rot: number;
  /** 0 = raw, 1 = ready to plate. */
  cook: number;
  /** Bounce/pop animation counter used on arrival + completion. */
  pop: number;
  /** Halo strength once the item is ready. */
  glow: number;
  flipped: boolean;
  /** Flipped inside the window — worth a small bonus. */
  perfect: boolean;
  /** Steak is asking to be flipped right now. */
  awaitFlip: boolean;
  tween: Tween | null;
};

export type PKind = "steam" | "ember" | "bubble" | "sparkle" | "heart" | "puff";

export type Particle = {
  kind: PKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  rot: number;
};

export type Order = {
  n: number;
  steak: number;
  lobster: number;
  /** Seconds allowed. */
  limit: number;
  /** Seconds remaining. */
  left: number;
};

export type GameState = {
  phase: Phase;
  tip: number;
  /** Wall-clock seconds since the page loaded — drives all idle animation. */
  t: number;
  grill: (Item | null)[];
  pot: (Item | null)[];
  tray: Item[];
  /** Items mid-flight to the family table; purely cosmetic once they leave the tray. */
  flying: Item[];
  order: Order;
  served: number;
  score: number;
  best: number;
  newBest: boolean;
  /** Eased 0..1 fill of the family's happiness meter. */
  happy: number;
  /** Order-card shake on a "still hungry" tap. */
  shake: number;
  /** Whole-scene shake when the timer runs out. */
  overShake: number;
  /** Spikes on every delivery — drives the family cheer. */
  cheer: number;
  particles: Particle[];
  toast: { text: string; t: number } | null;
  /** Per-door press flash and "station full" shake. */
  doorFlash: number[];
  doorFull: number[];
  trayShake: number;
  ignite: number;
  potBoil: number;
  lilyBob: number;
  popup: number;
};

export function newItem(kind: Kind, x: number, y: number, scale: number): Item {
  return {
    kind,
    x,
    y,
    scale,
    rot: 0,
    cook: 0,
    pop: 0,
    glow: 0,
    flipped: false,
    perfect: false,
    awaitFlip: false,
    tween: null,
  };
}

/** Seconds per order; anything past the table holds at the floor. */
const TIMES = [35, 30, 26, 22, 19, 17, 15, 14, 13, 12];
const TIME_FLOOR = 12;
/** The tray holds 8, so an order can never ask for more than the player can carry. */
const MAX_ITEMS = 8;

export function makeOrder(n: number): Order {
  const total = Math.min(n, MAX_ITEMS);
  const steak = Math.ceil(total / 2);
  const limit = n <= TIMES.length ? TIMES[n - 1] : TIME_FLOOR;
  return { n, steak, lobster: total - steak, limit, left: limit };
}

export const BEST_KEY = "lily-arcade-best-v1";
export const TIPS_KEY = "lily-arcade-tips-v1";

export function loadBest(): number {
  try {
    const v = Number(localStorage.getItem(BEST_KEY));
    return Number.isFinite(v) && v > 0 ? v : 0;
  } catch {
    return 0;
  }
}

export function saveBest(v: number): void {
  try {
    localStorage.setItem(BEST_KEY, String(v));
  } catch {
    /* private mode — best score is just not persisted */
  }
}

export function tipsSeen(): boolean {
  try {
    return localStorage.getItem(TIPS_KEY) === "1";
  } catch {
    return true;
  }
}

export function markTipsSeen(): void {
  try {
    localStorage.setItem(TIPS_KEY, "1");
  } catch {
    /* nothing to do */
  }
}

export function newState(t: number, best: number): GameState {
  return {
    phase: "start",
    tip: 0,
    t,
    grill: new Array(SLOTS).fill(null),
    pot: new Array(SLOTS).fill(null),
    tray: [],
    flying: [],
    order: makeOrder(1),
    served: 0,
    score: 0,
    best,
    newBest: false,
    happy: 0,
    shake: 0,
    overShake: 0,
    cheer: 0,
    particles: [],
    toast: null,
    doorFlash: [0, 0],
    doorFull: [0, 0],
    trayShake: 0,
    ignite: 0,
    potBoil: 0,
    lilyBob: 0,
    popup: 1,
  };
}
