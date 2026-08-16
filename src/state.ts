import { P, type Rect } from "./layout.ts";

export type StepId =
  | "GET_STEAK"
  | "GET_LOBSTER"
  | "LIGHT_GRILL"
  | "COOK_STEAK"
  | "COOK_LOBSTER"
  | "TAKE_STEAK"
  | "TAKE_LOBSTER"
  | "SERVE"
  | "CELEBRATE";

export type Place = "fridge" | "slot" | "station" | "table" | "gone";

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
  x: number;
  y: number;
  scale: number;
  rot: number;
  /** 0 = raw, 1 = perfectly cooked. */
  cook: number;
  flipped: boolean;
  place: Place;
  tween: Tween | null;
  /** Bounce/pop animation counter used on pickup + completion. */
  pop: number;
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

export type GameState = {
  step: StepId;
  /** Wall-clock seconds since the page loaded — drives all idle animation. */
  t: number;
  roundT: number;
  fridge: number;
  fridgeOpen: boolean;
  grillLit: boolean;
  ignite: number;
  steak: Item;
  lobster: Item;
  awaitingFlip: boolean;
  flipWaitT: number;
  flipBonus: number;
  potBoil: number;
  particles: Particle[];
  nudge: { text: string; t: number } | null;
  toast: { text: string; t: number } | null;
  celebrate: number;
  popup: number;
  score: number;
  best: number;
  lilyBob: number;
  /** Non-null while a "correct target" ring should pulse. */
  ring: Rect | null;
  busy: number;
};

function makeItem(x: number, y: number): Item {
  return { x, y, scale: 1, rot: 0, cook: 0, flipped: false, place: "fridge", tween: null, pop: 0 };
}

export const BEST_KEY = "lily-grill-best-v1";

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

export function newState(t: number, best: number): GameState {
  return {
    step: "GET_STEAK",
    t,
    roundT: 0,
    fridge: 0,
    fridgeOpen: false,
    grillLit: false,
    ignite: 0,
    steak: makeItem(P.steakFridge.x, P.steakFridge.y),
    lobster: makeItem(P.lobsterFridge.x, P.lobsterFridge.y),
    awaitingFlip: false,
    flipWaitT: 0,
    flipBonus: 0,
    potBoil: 0,
    particles: [],
    nudge: null,
    toast: null,
    celebrate: 0,
    popup: 0,
    score: 0,
    best,
    lilyBob: 0,
    ring: null,
    busy: 0,
  };
}
