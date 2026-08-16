import { DRINK_SLOTS, SLOTS } from "./layout.ts";

export type Kind = "steak" | "lobster" | "fries" | "nuggets" | "lemonade" | "water";

/** Pantry order, left-to-right then top-to-bottom. Also the order-card group order. */
export const KINDS: Kind[] = ["steak", "lobster", "fries", "nuggets", "lemonade", "water"];
/** Anything that has to be cooked — every order needs at least one. */
export const FOODS: Kind[] = ["steak", "lobster", "fries", "nuggets"];
export const DRINKS_K: Kind[] = ["lemonade", "water"];

export const isDrink = (k: Kind): boolean => k === "lemonade" || k === "water";
export const isFried = (k: Kind): boolean => k === "fries" || k === "nuggets";

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
  /** Seconds spent sitting at cook === 1. Drives the fryer's golden -> over slide. */
  past: number;
  /** Bounce/pop animation counter used on arrival + completion. */
  pop: number;
  /** Halo strength once the item is ready. */
  glow: number;
  flipped: boolean;
  /** Steak flipped inside the window, or fryer item pulled while still golden — worth +2. */
  perfect: boolean;
  /** Steak is asking to be flipped right now. */
  awaitFlip: boolean;
  tween: Tween | null;
};

export type PKind = "steam" | "ember" | "bubble" | "sparkle" | "heart" | "puff" | "drop";

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
  /** Only "drop" uses this — lemonade yellow vs water blue. */
  col: string;
};

export type Order = {
  n: number;
  need: Record<Kind, number>;
  total: number;
  /** True when all six kinds appear — delivering it banks the variety bonus. */
  variety: boolean;
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
  fryer: (Item | null)[];
  /** Index 0 = lemonade spout, 1 = water spout. */
  drinks: (Item | null)[];
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
  /** Per-source press flash and blocked-tap shake, one entry per pantry button. */
  srcFlash: number[];
  srcFull: number[];
  srcMsg: string[];
  trayShake: number;
  ignite: number;
  potBoil: number;
  /** Eased oil shimmer, matched to potBoil. */
  fryHeat: number;
  lilyBob: number;
  popup: number;
  /** Latched when the popup is raised — the phase moves on while it is still fading out. */
  popupKind: "start" | "over";
};

export function newItem(kind: Kind, x: number, y: number, scale: number): Item {
  return {
    kind,
    x,
    y,
    scale,
    rot: 0,
    cook: 0,
    past: 0,
    pop: 0,
    glow: 0,
    flipped: false,
    perfect: false,
    awaitFlip: false,
    tween: null,
  };
}

/* ------------------------------------------------------------------- orders */

/** Order 1 gets 30s and every order after sheds one, holding at the floor from #19. */
const TIME_START = 30;
const TIME_FLOOR = 12;
/** The tray holds 12, so an order can never ask for more than the player can carry. */
export const MAX_ITEMS = 12;
/** Items per order = floor(n * GROWTH). Tuned by the auto-play balance pass. */
export const GROWTH = 0.6;
/** No kind can exceed one station-load, so a big order is always a varied order. */
const PER_KIND_CAP = SLOTS;
/** Seconds a finished fryer basket stays golden. Past this it is "over" — edible, no bonus. */
export const GOLDEN = 4;

export function orderTime(n: number): number {
  return Math.max(TIME_FLOOR, TIME_START - (n - 1));
}

export function orderSize(n: number): number {
  return Math.min(MAX_ITEMS, Math.max(1, Math.floor(n * GROWTH)));
}

const pick = <T,>(a: T[]): T => a[(Math.random() * a.length) | 0];

export function makeOrder(n: number): Order {
  const total = orderSize(n);
  const need: Record<Kind, number> = {
    steak: 0,
    lobster: 0,
    fries: 0,
    nuggets: 0,
    lemonade: 0,
    water: 0,
  };
  let left = total;
  // Drinks are filler, never the meal.
  const maxDrinks = Math.floor(total / 2);
  let drinks = 0;

  // From order 10 the family always wants one of everything off the cook line.
  if (n >= 10) {
    for (const k of FOODS) {
      if (left === 0) break;
      need[k]++;
      left--;
    }
  } else {
    // Otherwise just guarantee it is never a pure drinks order.
    need[pick(FOODS)]++;
    left--;
  }

  while (left > 0) {
    const pool = (drinks < maxDrinks ? KINDS : FOODS).filter(
      (k) => isDrink(k) || need[k] < PER_KIND_CAP,
    );
    const k = pick(pool.length ? pool : FOODS);
    if (isDrink(k)) drinks++;
    need[k]++;
    left--;
  }

  const limit = orderTime(n);
  return { n, need, total, variety: KINDS.every((k) => need[k] > 0), limit, left: limit };
}

/* --------------------------------------------------------------- persistence */

export const BEST_KEY = "lily-arcade-best-v1";
/** Bumped for the fryer + drink maker build so returning players see the new tip. */
export const TIPS_KEY = "lily-arcade-tips-v2";

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
    fryer: new Array(SLOTS).fill(null),
    drinks: new Array(DRINK_SLOTS).fill(null),
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
    srcFlash: [0, 0, 0, 0, 0, 0],
    srcFull: [0, 0, 0, 0, 0, 0],
    srcMsg: ["FULL", "FULL", "FULL", "FULL", "FULL", "FULL"],
    trayShake: 0,
    ignite: 0,
    potBoil: 0,
    fryHeat: 0,
    lilyBob: 0,
    popup: 1,
    popupKind: "start",
  };
}
