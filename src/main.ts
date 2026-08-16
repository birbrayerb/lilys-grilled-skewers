import { MUTE_BTN, POPUP_BTN, TIP_COUNT, render } from "./art.ts";
import {
  DH,
  DW,
  GRILL,
  GRILL_SLOT_Y,
  HIT,
  POT,
  POT_SLOT_Y,
  SLOTS,
  TABLE,
  TRAY_CAP,
  TRAY_Y,
  clamp01,
  doorHit,
  doorItem,
  ease,
  grillHit,
  hit,
  lerp,
  potHit,
  slotX,
  trayHit,
  trayX,
} from "./layout.ts";
import {
  loadBest,
  makeOrder,
  markTipsSeen,
  newItem,
  newState,
  saveBest,
  tipsSeen,
  type GameState,
  type Item,
  type Kind,
  type PKind,
} from "./state.ts";
import {
  isMuted,
  setMuted,
  sfxAww,
  sfxBonk,
  sfxBubble,
  sfxCheer,
  sfxDing,
  sfxFlip,
  sfxNudge,
  sfxPickup,
  sfxSizzle,
  sfxSparkle,
  sfxThunk,
  sfxWhoosh,
  unlockAudio,
} from "./audio.ts";

const STEAK_COOK_SECONDS = 5.2;
const LOBSTER_COOK_SECONDS = 4.4;
/** Flip window, in cook progress. Miss it and the steak still cooks — just no bonus. */
const FLIP_FROM = 0.44;
const FLIP_TO = 0.62;

const SCALE = {
  born: 0.34,
  grill: 0.62,
  pot: 0.46,
  traySteak: 0.5,
  trayLobster: 0.4,
  plate: 0.42,
};

const canvas = document.getElementById("game") as HTMLCanvasElement;
const c = canvas.getContext("2d", { alpha: false }) as CanvasRenderingContext2D;

let scale = 1;
let offX = 0;
let offY = 0;
let dpr = 1;

function resize(): void {
  const w = window.innerWidth;
  const h = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  scale = Math.min(w / DW, h / DH);
  offX = (w - DW * scale) / 2;
  offY = (h - DH * scale) / 2;
}

let S: GameState = newState(0, loadBest());

/* ------------------------------------------------------------------ tweening */

function move(
  it: Item,
  tx: number,
  ty: number,
  ts: number,
  dur: number,
  arc: number,
  spin: number,
  done: () => void,
): void {
  it.tween = { fx: it.x, fy: it.y, tx, ty, fs: it.scale, ts, arc, spin, t: 0, dur, done };
}

function stepTween(it: Item, dt: number): void {
  const w = it.tween;
  if (!w) return;
  w.t += dt;
  const k = clamp01(w.t / w.dur);
  const e = ease(k);
  it.x = lerp(w.fx, w.tx, e);
  it.y = lerp(w.fy, w.ty, e) - Math.sin(k * Math.PI) * w.arc;
  it.scale = lerp(w.fs, w.ts, e);
  it.rot = w.spin * e;
  if (k >= 1) {
    it.tween = null;
    it.rot = 0;
    it.pop = 1;
    w.done();
  }
}

/* ---------------------------------------------------------------- particles */

function emit(kind: PKind, x: number, y: number, vx: number, vy: number, size: number, life: number): void {
  if (S.particles.length > 260) return;
  S.particles.push({ kind, x, y, vx, vy, life: 0, max: life, size, rot: Math.random() * Math.PI * 2 });
}

function burst(kind: PKind, x: number, y: number, n: number, spread: number, size: number): void {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = Math.random() * spread;
    emit(kind, x, y, Math.cos(a) * s, Math.sin(a) * s - 40, size * (0.6 + Math.random() * 0.8), 1 + Math.random());
  }
}

function toast(text: string): void {
  S.toast = { text, t: 0 };
}

/* ------------------------------------------------------------------- actions */

function stationOf(kind: Kind): (Item | null)[] {
  return kind === "steak" ? S.grill : S.pot;
}

/** Fridge tap — send one raw item to the next free slot of its station. */
function addItem(kind: Kind): void {
  const arr = stationOf(kind);
  const d = kind === "steak" ? 0 : 1;
  const i = arr.indexOf(null);
  if (i < 0) {
    S.doorFull[d] = 1;
    sfxBonk();
    return;
  }
  S.doorFlash[d] = 1;
  const from = doorItem(d);
  const it = newItem(kind, from.x, from.y, SCALE.born);
  arr[i] = it;
  sfxPickup();
  const tx = slotX(i);
  const ty = kind === "steak" ? GRILL_SLOT_Y : POT_SLOT_Y;
  move(it, tx, ty, kind === "steak" ? SCALE.grill : SCALE.pot, 0.46, 300, 0, () => {
    if (kind === "steak") {
      sfxSizzle(1.4);
      burst("puff", tx, ty - 10, 7, 60, 12);
    } else {
      sfxBubble();
      burst("bubble", tx, ty - 20, 8, 60, 6);
    }
  });
}

function flip(it: Item): void {
  it.awaitFlip = false;
  it.flipped = true;
  it.perfect = true;
  sfxFlip();
  burst("puff", it.x, it.y - 12, 10, 70, 12);
  burst("ember", it.x, it.y, 8, 90, 4);
  const { x, y, scale: s } = it;
  move(it, x, y, s, 0.36, 54, Math.PI * 2, () => {});
  toast("Perfect flip!");
}

/** Lift a finished item onto the shared serving tray. */
function plate(arr: (Item | null)[], i: number): void {
  const it = arr[i];
  if (!it) return;
  if (S.tray.length >= TRAY_CAP) {
    S.trayShake = 1;
    sfxBonk();
    return;
  }
  const idx = S.tray.length;
  arr[i] = null;
  S.tray.push(it);
  it.glow = 0;
  sfxPickup();
  move(it, trayX(idx), TRAY_Y, it.kind === "steak" ? SCALE.traySteak : SCALE.trayLobster, 0.42, 210, 0, () => {
    sfxThunk();
  });
}

function relayoutTray(): void {
  S.tray.forEach((it, i) => {
    const tx = trayX(i);
    if (Math.abs(it.x - tx) < 1 && !it.tween) return;
    move(it, tx, TRAY_Y, it.scale, 0.24, 26, 0, () => {});
  });
}

function tapSlot(arr: (Item | null)[], i: number): void {
  const it = arr[i];
  if (!it || it.tween) return;
  if (it.awaitFlip) {
    flip(it);
    return;
  }
  if (it.cook >= 1) plate(arr, i);
}

/** Only unlocked when the tray is full — a deadlock valve, never an accident. */
function discard(i: number): void {
  const it = S.tray[i];
  if (!it) return;
  S.tray.splice(i, 1);
  burst("puff", it.x, it.y, 8, 70, 11);
  sfxThunk();
  relayoutTray();
}

function deliver(): void {
  const o = S.order;
  const steaks = S.tray.filter((i) => i.kind === "steak");
  const lobsters = S.tray.filter((i) => i.kind === "lobster");
  if (steaks.length < o.steak || lobsters.length < o.lobster) {
    S.shake = 1;
    sfxNudge();
    toast("Still hungry!");
    return;
  }

  // Spend perfectly-flipped steaks first so the player always banks the bonus.
  steaks.sort((a, b) => Number(b.perfect) - Number(a.perfect));
  const used = steaks.slice(0, o.steak).concat(lobsters.slice(0, o.lobster));
  const perfects = used.filter((i) => i.kind === "steak" && i.perfect).length;
  const secs = Math.max(0, Math.floor(o.left));
  const gained = 10 * (o.steak + o.lobster) + 2 * perfects + secs;

  S.tray = S.tray.filter((i) => !used.includes(i));
  relayoutTray();

  used.forEach((it, k) => {
    S.flying.push(it);
    const px = TABLE.x + 74 + (k % 3) * 110;
    move(it, px, TABLE.y + 10, SCALE.plate, 0.5 + k * 0.05, 260, 0, () => {
      sfxSparkle();
      burst("sparkle", it.x, it.y, 8, 110, 9);
      const at = S.flying.indexOf(it);
      if (at >= 0) S.flying.splice(at, 1);
    });
  });

  S.score += gained;
  S.served++;
  S.cheer = 1;
  S.lilyBob = 10;
  if (S.score > S.best) {
    S.best = S.score;
    S.newBest = true;
    saveBest(S.best);
  }
  sfxWhoosh();
  sfxCheer();
  toast(`+${gained}!`);
  for (let i = 0; i < 12; i++) {
    emit("heart", 240 + Math.random() * 240, 460 + Math.random() * 40, (Math.random() - 0.5) * 50, -80 - Math.random() * 60, 11 + Math.random() * 8, 2);
  }
  burst("sparkle", 360, 470, 24, 200, 11);

  S.order = makeOrder(o.n + 1);
}

function gameOver(): void {
  S.phase = "over";
  S.overShake = 1;
  S.popup = -0.55;
  S.shake = 1;
  sfxAww();
}

function restart(): void {
  const best = S.best;
  S = newState(S.t, best);
  S.phase = "play";
  S.popup = 0;
  sfxThunk();
}

/* -------------------------------------------------------------------- input */

function tap(x: number, y: number): void {
  unlockAudio();

  if (S.phase === "start" || S.phase === "over") {
    if (S.popup > 0.6 && hit(POPUP_BTN, x, y)) {
      if (S.phase === "over") restart();
      else if (tipsSeen()) S.phase = "play";
      else {
        S.phase = "tips";
        S.tip = 0;
      }
      sfxThunk();
    }
    return;
  }

  if (S.phase === "tips") {
    S.tip++;
    sfxPickup();
    if (S.tip >= TIP_COUNT) {
      markTipsSeen();
      S.phase = "play";
    }
    return;
  }

  if (hit(MUTE_BTN, x, y)) {
    setMuted(!isMuted());
    return;
  }

  if (hit(HIT.family, x, y)) {
    deliver();
    return;
  }

  for (let i = 0; i < SLOTS; i++) {
    if (hit(grillHit(i), x, y)) {
      tapSlot(S.grill, i);
      return;
    }
    if (hit(potHit(i), x, y)) {
      tapSlot(S.pot, i);
      return;
    }
  }

  if (hit(doorHit(0), x, y)) {
    addItem("steak");
    return;
  }
  if (hit(doorHit(1), x, y)) {
    addItem("lobster");
    return;
  }

  if (S.tray.length >= TRAY_CAP) {
    for (let i = 0; i < S.tray.length; i++) {
      if (hit(trayHit(i), x, y)) {
        discard(i);
        return;
      }
    }
  }
  // anything else is a harmless no-op
}

/* ------------------------------------------------------------------- update */

const sizzleAcc = [0, 0, 0, 0];
const bubbleAcc = [0, 0, 0, 0];
let emberAcc = 0;

function cookStation(arr: (Item | null)[], dt: number, kind: Kind): void {
  const seconds = kind === "steak" ? STEAK_COOK_SECONDS : LOBSTER_COOK_SECONDS;
  let cooking = 0;
  for (const it of arr) if (it && !it.tween && it.cook < 1) cooking++;
  const vol = cooking > 0 ? 1 / Math.sqrt(cooking) : 1;

  for (let i = 0; i < arr.length; i++) {
    const it = arr[i];
    if (!it || it.tween) continue;

    if (it.cook < 1) {
      const was = it.cook;
      it.cook = Math.min(1, it.cook + dt / seconds);

      if (kind === "steak" && !it.flipped) {
        if (was < FLIP_FROM && it.cook >= FLIP_FROM) {
          it.awaitFlip = true;
          sfxDing();
        }
        if (it.cook >= FLIP_TO && it.awaitFlip) {
          // Missed the window — it still cooks, it's just well-done.
          it.awaitFlip = false;
          it.flipped = true;
          it.perfect = false;
          burst("puff", it.x, it.y - 10, 6, 50, 10);
        }
      }

      if (it.cook >= 1) {
        it.pop = 1;
        sfxDing();
        burst("sparkle", it.x, it.y, 10, 110, 9);
        S.lilyBob = 6;
      }

      if (kind === "steak") {
        sizzleAcc[i] += dt;
        // staggered per slot so four grills crackle instead of pulsing in lockstep
        if (sizzleAcc[i] > 0.26 + i * 0.04) {
          sizzleAcc[i] = 0;
          sfxSizzle(vol);
          emit("puff", it.x + (Math.random() - 0.5) * 60, it.y - 6, (Math.random() - 0.5) * 16, -46 - Math.random() * 26, 7 + Math.random() * 6, 1.2);
        }
      } else {
        bubbleAcc[i] += dt;
        if (bubbleAcc[i] > 0.2) {
          bubbleAcc[i] = 0;
          if (Math.random() < 0.3) sfxBubble();
          emit("bubble", it.x + (Math.random() - 0.5) * 70, it.y - 8, (Math.random() - 0.5) * 10, -34 - Math.random() * 22, 4 + Math.random() * 5, 0.85);
          if (Math.random() < 0.35) {
            emit("steam", it.x + (Math.random() - 0.5) * 60, it.y - 26, (Math.random() - 0.5) * 14, -40 - Math.random() * 22, 8 + Math.random() * 6, 1.4);
          }
        }
      }
    } else {
      it.glow = 0.55 + 0.45 * Math.abs(Math.sin(S.t * 4 + i));
    }
  }
}

function update(dt: number): void {
  S.t += dt;

  const live = S.phase === "play";
  const wantPopup = S.phase === "start" || S.phase === "over";
  S.popup = wantPopup ? Math.min(1, S.popup + dt * 1.8) : Math.max(0, S.popup - dt * 3.4);

  S.ignite += ((S.phase === "over" ? 0.35 : 1) - S.ignite) * Math.min(1, dt * 1.6);
  S.potBoil += (1 - S.potBoil) * Math.min(1, dt * 2);
  S.shake = Math.max(0, S.shake - dt * 2.6);
  S.overShake = Math.max(0, S.overShake - dt * 1.6);
  S.trayShake = Math.max(0, S.trayShake - dt * 3);
  S.cheer = Math.max(0, S.cheer - dt * 0.55);
  S.lilyBob = Math.max(0, S.lilyBob - dt * 20);
  S.doorFlash[0] = Math.max(0, S.doorFlash[0] - dt * 4);
  S.doorFlash[1] = Math.max(0, S.doorFlash[1] - dt * 4);
  S.doorFull[0] = Math.max(0, S.doorFull[0] - dt * 2.4);
  S.doorFull[1] = Math.max(0, S.doorFull[1] - dt * 2.4);
  S.happy += (clamp01(S.served / 10) - S.happy) * Math.min(1, dt * 3);

  for (const arr of [S.grill, S.pot]) {
    for (const it of arr) if (it) stepTween(it, dt);
  }
  for (const it of S.tray) stepTween(it, dt);
  for (let i = S.flying.length - 1; i >= 0; i--) stepTween(S.flying[i], dt);

  for (const arr of [S.grill, S.pot, S.tray, S.flying]) {
    for (const it of arr) if (it) it.pop = Math.max(0, it.pop - dt * 3);
  }

  if (live) {
    cookStation(S.grill, dt, "steak");
    cookStation(S.pot, dt, "lobster");
    S.order.left -= dt;
    if (S.order.left <= 0) {
      S.order.left = 0;
      gameOver();
    }
  }

  // embers keep rising from the coals — the grill is always hot in arcade mode
  emberAcc += dt;
  if (emberAcc > 0.06) {
    emberAcc = 0;
    emit("ember", GRILL.x + 20 + Math.random() * (GRILL.w - 40), 640, (Math.random() - 0.5) * 26, -90 - Math.random() * 80, 2.5 + Math.random() * 3.5, 1 + Math.random() * 0.8);
  }
  if (Math.random() < dt * 6) {
    emit("steam", POT.x + 60 + Math.random() * (POT.w - 120), POT.y + 20, (Math.random() - 0.5) * 14, -34 - Math.random() * 20, 7 + Math.random() * 6, 1.4);
  }

  for (let i = S.particles.length - 1; i >= 0; i--) {
    const p = S.particles[i];
    p.life += dt;
    if (p.life >= p.max) {
      S.particles.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.kind === "ember") {
      p.vy -= 28 * dt;
      p.vx += Math.sin(S.t * 3 + p.rot) * 22 * dt;
    } else if (p.kind === "puff" || p.kind === "steam") {
      p.vy *= 1 - dt * 0.7;
      p.vx += Math.sin(S.t * 2 + p.rot) * 14 * dt;
    } else if (p.kind === "bubble") {
      p.vy -= 18 * dt;
    } else if (p.kind === "heart" || p.kind === "sparkle") {
      p.vy += 18 * dt;
    }
  }

  if (S.toast) {
    S.toast.t += dt;
    if (S.toast.t > 1.2) S.toast = null;
  }
}

/* --------------------------------------------------------------------- loop */

let last = performance.now();
let booted = false;

function draw(): void {
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.fillStyle = "#2a150d";
  c.fillRect(0, 0, canvas.width, canvas.height);
  c.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offX, dpr * offY);
  render(c, S, isMuted());

  if (!booted) {
    booted = true;
    const boot = document.getElementById("boot");
    if (boot) {
      boot.style.opacity = "0";
      setTimeout(() => boot.remove(), 320);
    }
  }
}

function frame(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}

/* ------------------------------------------------------------------ wiring */

function toDesign(clientX: number, clientY: number): { x: number; y: number } {
  const r = canvas.getBoundingClientRect();
  return { x: (clientX - r.left - offX) / scale, y: (clientY - r.top - offY) / scale };
}

canvas.addEventListener(
  "pointerdown",
  (e) => {
    e.preventDefault();
    const p = toDesign(e.clientX, e.clientY);
    tap(p.x, p.y);
  },
  { passive: false },
);

// Belt-and-braces against iOS double-tap zoom / pinch.
document.addEventListener("gesturestart", (e) => e.preventDefault());
document.addEventListener("dblclick", (e) => e.preventDefault());
document.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });

window.addEventListener("resize", resize);
window.addEventListener("orientationchange", () => setTimeout(resize, 120));
window.visualViewport?.addEventListener("resize", resize);

if (import.meta.env.DEV) {
  // Lets the harness drive the sim frame-by-frame while the preview pane is hidden.
  (window as unknown as Record<string, unknown>).__dev = {
    tap,
    state: () => S,
    step(seconds: number, fps = 60) {
      const dt = 1 / fps;
      for (let i = 0; i < Math.round(seconds * fps); i++) update(dt);
      draw();
    },
  };
}

resize();
requestAnimationFrame(frame);
