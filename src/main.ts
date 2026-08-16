import { MUTE_BTN, POPUP_BTN, render } from "./art.ts";
import {
  DH,
  DW,
  GRILL,
  HIT,
  P,
  POT,
  clamp01,
  ease,
  hit,
  lerp,
  type Rect,
} from "./layout.ts";
import {
  loadBest,
  newState,
  saveBest,
  type GameState,
  type Item,
  type PKind,
} from "./state.ts";
import {
  isMuted,
  setMuted,
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

const STEAK_COOK_SECONDS = 5.4;
const LOBSTER_COOK_SECONDS = 4.6;

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
  it.tween = {
    fx: it.x,
    fy: it.y,
    tx,
    ty,
    fs: it.scale,
    ts,
    arc,
    spin,
    t: 0,
    dur,
    done,
  };
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
  if (S.particles.length > 220) return;
  S.particles.push({
    kind,
    x,
    y,
    vx,
    vy,
    life: 0,
    max: life,
    size,
    rot: Math.random() * Math.PI * 2,
  });
}

function burst(kind: PKind, x: number, y: number, n: number, spread: number, size: number): void {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = Math.random() * spread;
    emit(kind, x, y, Math.cos(a) * s, Math.sin(a) * s - 40, size * (0.6 + Math.random() * 0.8), 1 + Math.random());
  }
}

/* --------------------------------------------------------------- step copy */

function hintFor(s: GameState): string {
  switch (s.step) {
    case "GET_STEAK":
      return s.fridgeOpen ? "Tap the steak!" : "Tap the fridge to open it!";
    case "GET_LOBSTER":
      return "Now grab the lobster!";
    case "LIGHT_GRILL":
      return "Tap the grill to light the charcoal!";
    case "COOK_STEAK":
      if (s.steak.place === "slot") return "Put the steak on the grill!";
      if (s.awaitingFlip) return "Tap the steak to flip it!";
      return "Sizzling… let it cook.";
    case "COOK_LOBSTER":
      if (s.lobster.place === "slot") return "Drop the lobster in the pot!";
      return "Bubbling away… almost red!";
    case "TAKE_STEAK":
      return "Take the steak off the grill!";
    case "TAKE_LOBSTER":
      return "Scoop the lobster out!";
    case "SERVE":
      return "Serve it to the family!";
    case "CELEBRATE":
      return "Yum yum yum!";
  }
}

function ringFor(s: GameState): Rect | null {
  if (s.busy > 0) return null;
  switch (s.step) {
    case "GET_STEAK":
      return s.fridgeOpen ? HIT.fridgeSteak : HIT.fridge;
    case "GET_LOBSTER":
      return HIT.fridgeLobster;
    case "LIGHT_GRILL":
      return HIT.grill;
    case "COOK_STEAK":
      return s.steak.place === "slot" || s.awaitingFlip ? HIT.grill : null;
    case "COOK_LOBSTER":
      return s.lobster.place === "slot" ? HIT.pot : null;
    case "TAKE_STEAK":
      return HIT.grill;
    case "TAKE_LOBSTER":
      return HIT.pot;
    case "SERVE":
      return HIT.family;
    default:
      return null;
  }
}

function nudge(text: string): void {
  S.nudge = { text, t: 0 };
  sfxNudge();
}

function toast(text: string): void {
  S.toast = { text, t: 0 };
}

/* -------------------------------------------------------------------- input */

function tap(x: number, y: number): void {
  unlockAudio();

  if (hit(MUTE_BTN, x, y)) {
    setMuted(!isMuted());
    return;
  }

  if (S.step === "CELEBRATE") {
    if (S.popup > 0.6 && hit(POPUP_BTN, x, y)) restart();
    return;
  }

  if (S.busy > 0) return;

  switch (S.step) {
    case "GET_STEAK": {
      if (!S.fridgeOpen) {
        if (hit(HIT.fridge, x, y)) {
          S.fridgeOpen = true;
          sfxThunk();
        } else nudge("Open the fridge first!");
        return;
      }
      if (hit(HIT.fridgeSteak, x, y)) {
        pickFromFridge(S.steak, P.slotA.x, P.slotA.y, "GET_LOBSTER");
      } else if (hit(HIT.fridgeLobster, x, y)) {
        nudge("Steak first, then the lobster!");
      } else nudge("Tap the steak in the fridge!");
      return;
    }
    case "GET_LOBSTER": {
      if (hit(HIT.fridgeLobster, x, y)) {
        pickFromFridge(S.lobster, P.slotB.x, P.slotB.y, "LIGHT_GRILL");
      } else nudge("Grab the lobster next!");
      return;
    }
    case "LIGHT_GRILL": {
      if (hit(HIT.grill, x, y)) {
        S.grillLit = true;
        S.busy = 1.5;
        sfxWhoosh();
        burst("ember", GRILL.x + GRILL.w / 2, 500, 26, 130, 5);
        burst("puff", GRILL.x + GRILL.w / 2, 486, 10, 90, 16);
        S.step = "COOK_STEAK";
        toast("Whoosh!");
      } else nudge("Light the grill!");
      return;
    }
    case "COOK_STEAK": {
      if (S.steak.place === "slot") {
        if (hit(HIT.grill, x, y)) {
          S.steak.place = "station";
          move(S.steak, P.steakGrill.x, P.steakGrill.y, 0.95, 0.5, 170, 0, () => {
            sfxSizzle(2);
            burst("puff", P.steakGrill.x, P.steakGrill.y - 10, 8, 60, 13);
          });
        } else nudge("Pop the steak on the grill!");
        return;
      }
      if (S.awaitingFlip) {
        if (hit(HIT.grill, x, y)) flipSteak();
        else nudge("Tap the grill to flip!");
        return;
      }
      nudge("It's still cooking!");
      return;
    }
    case "COOK_LOBSTER": {
      if (S.lobster.place === "slot") {
        if (hit(HIT.pot, x, y)) {
          S.lobster.place = "station";
          move(S.lobster, P.lobsterPot.x, P.lobsterPot.y, 0.72, 0.5, 150, 0, () => {
            sfxBubble();
            burst("bubble", P.lobsterPot.x, POT.y + 20, 10, 60, 7);
          });
        } else nudge("Into the pot with the lobster!");
        return;
      }
      nudge("Let it boil a moment!");
      return;
    }
    case "TAKE_STEAK": {
      if (hit(HIT.grill, x, y)) {
        S.steak.place = "slot";
        sfxPickup();
        move(S.steak, P.slotA.x, P.slotA.y, 0.62, 0.55, 190, 0, () => {
          S.step = "TAKE_LOBSTER";
        });
      } else nudge("Take the steak off the grill!");
      return;
    }
    case "TAKE_LOBSTER": {
      if (hit(HIT.pot, x, y)) {
        S.lobster.place = "slot";
        sfxPickup();
        move(S.lobster, P.slotB.x, P.slotB.y, 0.62, 0.55, 190, 0, () => {
          S.step = "SERVE";
        });
      } else nudge("Scoop the lobster out of the pot!");
      return;
    }
    case "SERVE": {
      if (hit(HIT.family, x, y)) serve();
      else nudge("Bring it to the table!");
      return;
    }
  }
}

function pickFromFridge(it: Item, tx: number, ty: number, next: GameState["step"]): void {
  sfxPickup();
  it.place = "slot";
  move(it, tx, ty, 0.62, 0.6, 210, 0, () => {
    S.step = next;
    if (next === "LIGHT_GRILL") {
      S.fridgeOpen = false;
      sfxThunk();
    }
  });
}

function flipSteak(): void {
  const st = S.steak;
  S.awaitingFlip = false;
  S.flipBonus = Math.round(200 * clamp01(1 - (S.flipWaitT - 0.5) / 3.2));
  sfxFlip();
  burst("puff", st.x, st.y - 12, 12, 70, 14);
  burst("ember", st.x, st.y, 10, 90, 4);
  move(st, st.x, st.y, st.scale, 0.42, 68, Math.PI * 2, () => {
    st.flipped = true;
  });
  toast(S.flipBonus > 140 ? "Nice flip!" : "Flipped!");
}

function serve(): void {
  S.busy = 2.2;
  S.steak.place = "table";
  S.lobster.place = "table";
  sfxPickup();
  move(S.steak, P.steakTable.x, P.steakTable.y, 0.58, 0.6, 230, 0, () => {
    sfxSparkle();
  });
  move(S.lobster, P.lobsterTable.x, P.lobsterTable.y, 0.58, 0.78, 250, 0, () => {
    finishRound();
  });
}

function finishRound(): void {
  const speed = Math.round(200 * clamp01(1 - (S.roundT - 45) / 105));
  S.score = Math.round((600 + S.flipBonus + speed) / 10) * 10;
  S.step = "CELEBRATE";
  sfxCheer();
  for (let i = 0; i < 14; i++) {
    emit("heart", 380 + Math.random() * 240, 1000 + Math.random() * 60, (Math.random() - 0.5) * 40, -70 - Math.random() * 60, 14 + Math.random() * 12, 2.2);
  }
  burst("sparkle", 500, 1030, 26, 190, 12);
  if (S.score > S.best) {
    S.best = S.score;
    saveBest(S.best);
  }
}

function restart(): void {
  const best = S.best;
  const t = S.t;
  S = newState(t, best);
  sfxThunk();
}

/* ------------------------------------------------------------------- update */

let sizzleAcc = 0;
let bubbleAcc = 0;
let emberAcc = 0;
let sparkleAcc = 0;

function update(dt: number): void {
  S.t += dt;
  if (S.step !== "CELEBRATE") S.roundT += dt;
  S.busy = Math.max(0, S.busy - dt);
  if (S.steak.tween || S.lobster.tween) S.busy = Math.max(S.busy, 0.001);

  S.fridge += ((S.fridgeOpen ? 1 : 0) - S.fridge) * Math.min(1, dt * 7);
  S.ignite += ((S.grillLit ? 1 : 0) - S.ignite) * Math.min(1, dt * 1.6);
  const wantBoil = S.lobster.place === "station" || S.step === "TAKE_LOBSTER" ? 1 : 0;
  S.potBoil += (wantBoil - S.potBoil) * Math.min(1, dt * 2);

  stepTween(S.steak, dt);
  stepTween(S.lobster, dt);
  S.steak.pop = Math.max(0, S.steak.pop - dt * 3);
  S.lobster.pop = Math.max(0, S.lobster.pop - dt * 3);
  S.lilyBob = Math.max(0, S.lilyBob - dt * 20);

  // steak cooking
  if (S.step === "COOK_STEAK" && S.steak.place === "station" && !S.steak.tween) {
    if (S.awaitingFlip) {
      S.flipWaitT += dt;
    } else if (S.steak.cook < 1) {
      S.steak.cook = Math.min(1, S.steak.cook + dt / STEAK_COOK_SECONDS);
      if (!S.steak.flipped && S.steak.cook >= 0.5) {
        S.steak.cook = 0.5;
        S.awaitingFlip = true;
        S.flipWaitT = 0;
        sfxDing();
      }
      if (S.steak.cook >= 1) {
        S.steak.cook = 1;
        S.step = "COOK_LOBSTER";
        sfxDing();
        toast("Steak's ready!");
        burst("sparkle", S.steak.x, S.steak.y, 12, 110, 10);
        S.lilyBob = 8;
      }
    }
    sizzleAcc += dt;
    const rate = S.awaitingFlip ? 0.34 : 0.16;
    if (sizzleAcc > rate) {
      sizzleAcc = 0;
      sfxSizzle(S.awaitingFlip ? 0.5 : 1);
      emit("puff", S.steak.x + (Math.random() - 0.5) * 70, S.steak.y - 6, (Math.random() - 0.5) * 16, -46 - Math.random() * 30, 8 + Math.random() * 7, 1.3);
    }
  }

  // lobster boiling
  if (S.lobster.place === "station" && !S.lobster.tween) {
    if (S.step === "COOK_LOBSTER" && S.lobster.cook < 1) {
      S.lobster.cook = Math.min(1, S.lobster.cook + dt / LOBSTER_COOK_SECONDS);
      if (S.lobster.cook >= 1) {
        S.step = "TAKE_STEAK";
        sfxDing();
        toast("Lobster's ready!");
        burst("sparkle", S.lobster.x, S.lobster.y - 30, 12, 110, 10);
        S.lilyBob = 8;
      }
    }
    bubbleAcc += dt;
    if (bubbleAcc > 0.13) {
      bubbleAcc = 0;
      if (Math.random() < 0.45) sfxBubble();
      emit("bubble", POT.x + 24 + Math.random() * (POT.w - 48), POT.y + 16, (Math.random() - 0.5) * 10, -34 - Math.random() * 26, 4 + Math.random() * 6, 0.9);
      if (Math.random() < 0.4) {
        emit("steam", POT.x + 30 + Math.random() * (POT.w - 60), POT.y, (Math.random() - 0.5) * 14, -40 - Math.random() * 24, 9 + Math.random() * 7, 1.5);
      }
    }
  }

  // embers rise from the coals whenever the grill is hot
  if (S.ignite > 0.15) {
    emberAcc += dt;
    if (emberAcc > 0.07) {
      emberAcc = 0;
      emit("ember", GRILL.x + 20 + Math.random() * (GRILL.w - 40), 494, (Math.random() - 0.5) * 26, -90 - Math.random() * 80, 2.5 + Math.random() * 3.5, 1.1 + Math.random() * 0.8);
    }
  }

  // celebration
  if (S.step === "CELEBRATE") {
    S.celebrate = Math.min(1, S.celebrate + dt * 2.2);
    S.popup = Math.min(1, S.popup + (S.celebrate >= 1 ? dt * 1.5 : 0));
    sparkleAcc += dt;
    if (sparkleAcc > 0.12 && S.popup < 0.9) {
      sparkleAcc = 0;
      sfxSparkle();
      emit("sparkle", 350 + Math.random() * 340, 950 + Math.random() * 140, (Math.random() - 0.5) * 50, -40 - Math.random() * 40, 8 + Math.random() * 8, 1.4);
      if (Math.random() < 0.5) {
        emit("heart", 370 + Math.random() * 280, 990, (Math.random() - 0.5) * 34, -70, 12 + Math.random() * 10, 2);
      }
    }
  }

  // particles
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

  if (S.nudge) {
    S.nudge.t += dt;
    if (S.nudge.t > 2) S.nudge = null;
  }
  if (S.toast) {
    S.toast.t += dt;
    if (S.toast.t > 1.1) S.toast = null;
  }

  S.ring = ringFor(S);
}

/* --------------------------------------------------------------------- loop */

let last = performance.now();
let booted = false;

function draw(): void {
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.fillStyle = "#2a150d";
  c.fillRect(0, 0, canvas.width, canvas.height);
  c.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offX, dpr * offY);
  render(c, S, hintFor(S), isMuted());

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

/* ------------------------------------------------------------------- wiring */

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
