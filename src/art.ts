import {
  C,
  CARD,
  DH,
  DW,
  FLOOR_Y,
  FRIDGE,
  FAMILY_BASE,
  GRATE_Y0,
  GRILL,
  GRILL_METER_Y,
  HEART_Y,
  LILY_BASE,
  LILY_X,
  POT,
  POT_METER_Y,
  SLOTS,
  TABLE,
  TRAY,
  TRAY_CAP,
  TRAY_Y,
  clamp01,
  doorRect,
  easeOut,
  mixHex,
  rnd,
  roundRect,
  roundRectPath,
  slotX,
  trayX,
  type Rect,
} from "./layout.ts";
import type { GameState, Item, Kind } from "./state.ts";

const FONT = `"Avenir Next Rounded", "Avenir Next", ui-rounded, "Trebuchet MS", system-ui, sans-serif`;

export const POPUP_BTN: Rect = { x: 202, y: 824, w: 316, h: 104 };
/** Kept below design-y 36 so the iPhone status bar can't sit on it in standalone mode. */
export const MUTE_BTN: Rect = { x: 636, y: 36, w: 60, h: 60 };

type Ctx = CanvasRenderingContext2D;

function txt(
  c: Ctx,
  s: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: CanvasTextAlign = "center",
  weight = 800,
): void {
  c.font = `${weight} ${size}px ${FONT}`;
  c.textAlign = align;
  c.textBaseline = "middle";
  c.fillStyle = color;
  c.fillText(s, x, y);
}

function shadowTxt(
  c: Ctx,
  s: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: CanvasTextAlign = "center",
  weight = 800,
): void {
  txt(c, s, x, y + 3, size, "rgba(0,0,0,0.45)", align, weight);
  txt(c, s, x, y, size, color, align, weight);
}

function heartPath(c: Ctx, x: number, y: number, s: number): void {
  c.beginPath();
  c.moveTo(x, y + s * 0.42);
  c.bezierCurveTo(x - s, y - s * 0.42, x - s * 0.58, y - s * 1.25, x, y - s * 0.66);
  c.bezierCurveTo(x + s * 0.58, y - s * 1.25, x + s, y - s * 0.42, x, y + s * 0.42);
  c.closePath();
}

/* ------------------------------------------------------------------ backdrop */

function drawBackdrop(c: Ctx): void {
  // Upper wall: warm painted wood planks, running vertically.
  const wallTop = -520;
  const g = c.createLinearGradient(0, wallTop, 0, FLOOR_Y);
  g.addColorStop(0, C.wallShade);
  g.addColorStop(0.34, C.wallDark);
  g.addColorStop(0.8, C.wallPlank);
  g.addColorStop(1, "#63371f");
  c.fillStyle = g;
  c.fillRect(-520, wallTop, DW + 1040, FLOOR_Y - wallTop);

  const pw = 62;
  for (let i = -9; i * pw < DW + 560; i++) {
    const x = i * pw;
    const shade = rnd(i * 3.1);
    c.fillStyle = `rgba(255,215,160,${0.03 + shade * 0.05})`;
    c.fillRect(x + 3, wallTop, pw - 6, FLOOR_Y - wallTop);
    c.fillStyle = "rgba(0,0,0,0.30)";
    c.fillRect(x, wallTop, 3, FLOOR_Y - wallTop);
    c.fillStyle = "rgba(60,26,12,0.16)";
    for (let k = 0; k < 4; k++) {
      const gy = 40 + rnd(i * 7 + k) * (FLOOR_Y - 60);
      c.fillRect(x + 8 + rnd(i + k * 2) * 20, gy, 2, 60 + rnd(i * k + 1) * 90);
    }
  }

  // Warm ceiling shadow.
  const top = c.createLinearGradient(0, -520, 0, 300);
  top.addColorStop(0, "rgba(0,0,0,0.85)");
  top.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = top;
  c.fillRect(-520, -520, DW + 1040, 820);

  // Floor: dark terracotta tile.
  const fg = c.createLinearGradient(0, FLOOR_Y, 0, DH + 520);
  fg.addColorStop(0, "#5a2a18");
  fg.addColorStop(0.3, C.floor);
  fg.addColorStop(1, C.floorDark);
  c.fillStyle = fg;
  c.fillRect(-520, FLOOR_Y, DW + 1040, DH + 520 - FLOOR_Y);
  c.fillStyle = "rgba(0,0,0,0.35)";
  c.fillRect(-520, FLOOR_Y, DW + 1040, 8);
  for (let i = 0; i < 12; i++) {
    c.fillStyle = "rgba(0,0,0,0.12)";
    c.fillRect(-520, FLOOR_Y + 40 + i * 92, DW + 1040, 3);
  }
  for (let i = -4; i < 10; i++) {
    c.fillStyle = "rgba(0,0,0,0.10)";
    c.fillRect(i * 96, FLOOR_Y, 3, DH + 520 - FLOOR_Y);
  }

  // Warm lamp pool over the cooking line.
  const lamp = c.createRadialGradient(330, 700, 40, 330, 800, 700);
  lamp.addColorStop(0, "rgba(255,175,80,0.22)");
  lamp.addColorStop(1, "rgba(255,150,60,0)");
  c.fillStyle = lamp;
  c.fillRect(-520, -520, DW + 1040, DH + 1040);
}

/** Strips of dried pipikaula hanging on hooks — the signature Helena's detail. */
function drawRibs(c: Ctx, S: GameState, x0: number, x1: number, n: number, rodY: number): void {
  c.fillStyle = "#2a2320";
  roundRect(c, x0 - 14, rodY - 5, x1 - x0 + 28, 10, 5);
  c.fill();
  c.fillStyle = "rgba(255,220,170,0.25)";
  roundRect(c, x0 - 14, rodY - 5, x1 - x0 + 28, 3, 2);
  c.fill();

  for (let i = 0; i < n; i++) {
    const x = n === 1 ? (x0 + x1) / 2 : x0 + (i * (x1 - x0)) / (n - 1);
    const h = 70 + rnd(i * 5 + x0) * 48;
    const sway = Math.sin(S.t * 0.9 + i * 0.7 + x0 * 0.01) * 3.5;
    c.save();
    c.translate(x, rodY);
    c.rotate(sway * 0.006);
    c.strokeStyle = "#b9c0c6";
    c.lineWidth = 3;
    c.beginPath();
    c.arc(0, 4, 6, Math.PI, 0);
    c.stroke();
    const w = 20 + rnd(i * 11 + x0) * 10;
    const grd = c.createLinearGradient(-w / 2, 0, w / 2, 0);
    grd.addColorStop(0, "#4a1d13");
    grd.addColorStop(0.45, "#7c2f18");
    grd.addColorStop(1, "#3c1710");
    c.fillStyle = grd;
    c.beginPath();
    c.moveTo(-w / 2, 10);
    c.quadraticCurveTo(-w / 2 - 3, 10 + h * 0.6, -w * 0.3, 10 + h);
    c.quadraticCurveTo(0, 10 + h + 7, w * 0.3, 10 + h);
    c.quadraticCurveTo(w / 2 + 3, 10 + h * 0.6, w / 2, 10);
    c.closePath();
    c.fill();
    c.fillStyle = "rgba(255,190,120,0.16)";
    c.fillRect(-w * 0.18, 16, 4, h * 0.7);
    c.restore();
  }
}

function leaf(c: Ctx, x: number, y: number, len: number, ang: number, col: string, sway: number): void {
  c.save();
  c.translate(x, y);
  c.rotate(ang + sway);
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(len * 0.35, -len * 0.34, len, 0);
  c.quadraticCurveTo(len * 0.35, len * 0.34, 0, 0);
  c.fill();
  c.strokeStyle = "rgba(0,0,0,0.22)";
  c.lineWidth = 3;
  for (let i = 1; i < 5; i++) {
    const t = i / 5;
    c.beginPath();
    c.moveTo(len * t, -len * 0.2 * Math.sin(Math.PI * t));
    c.lineTo(len * t, len * 0.2 * Math.sin(Math.PI * t));
    c.stroke();
  }
  c.restore();
}

function drawPlants(c: Ctx, S: GameState): void {
  const sway = Math.sin(S.t * 0.6) * 0.03;
  leaf(c, 712, 470, 148, Math.PI * 0.9, C.greenDark, sway);
  leaf(c, 716, 528, 130, Math.PI * 1.02, C.green, -sway);
  leaf(c, 708, 428, 116, Math.PI * 0.76, C.greenLight, sway * 1.4);
  leaf(c, -6, 470, 96, Math.PI * 0.08, C.greenDark, -sway);
  leaf(c, -6, 512, 82, Math.PI * -0.08, C.green, sway);
}

/* -------------------------------------------------------------------- family */

function familyMember(
  c: Ctx,
  cx: number,
  baseY: number,
  scale: number,
  shirt: string,
  hair: string,
  happy: number,
  t: number,
  seed: number,
): void {
  const bounce = happy > 0 ? Math.abs(Math.sin(t * 5 + seed)) * 10 * happy : Math.sin(t * 1.4 + seed) * 2;
  c.save();
  c.translate(cx, baseY - bounce);
  c.scale(scale, scale);

  const g = c.createLinearGradient(0, -96, 0, 12);
  g.addColorStop(0, shirt);
  g.addColorStop(1, "rgba(0,0,0,0.35)");
  c.fillStyle = shirt;
  c.beginPath();
  c.moveTo(-40, 10);
  c.quadraticCurveTo(-42, -80, 0, -84);
  c.quadraticCurveTo(42, -80, 40, 10);
  c.closePath();
  c.fill();
  c.fillStyle = g;
  c.globalAlpha = 0.25;
  c.fill();
  c.globalAlpha = 1;

  c.strokeStyle = C.skinDeep;
  c.lineWidth = 13;
  c.lineCap = "round";
  const armY = happy > 0.3 ? -110 : -40;
  c.beginPath();
  c.moveTo(-34, -62);
  c.lineTo(-52, armY);
  c.moveTo(34, -62);
  c.lineTo(52, armY);
  c.stroke();

  c.fillStyle = hair;
  c.beginPath();
  c.arc(0, -122, 42, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = C.skin;
  c.beginPath();
  c.arc(0, -118, 36, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = hair;
  c.beginPath();
  c.arc(0, -130, 36, Math.PI * 1.05, Math.PI * 1.95);
  c.fill();

  c.fillStyle = "#2a1c14";
  if (happy > 0.3) {
    c.lineWidth = 4;
    c.strokeStyle = "#2a1c14";
    c.beginPath();
    c.arc(-13, -124, 8, Math.PI * 1.12, Math.PI * 1.88);
    c.arc(13, -124, 8, Math.PI * 1.12, Math.PI * 1.88);
    c.stroke();
  } else {
    c.beginPath();
    c.arc(-13, -122, 4.6, 0, Math.PI * 2);
    c.arc(13, -122, 4.6, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = "rgba(255,140,150,0.45)";
  c.beginPath();
  c.arc(-24, -110, 8, 0, Math.PI * 2);
  c.arc(24, -110, 8, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = "#2a1c14";
  c.lineWidth = 3.6;
  c.beginPath();
  c.arc(0, -112, 12 + happy * 6, 0.16 * Math.PI, 0.84 * Math.PI);
  c.stroke();
  c.restore();
}

function drawFamily(c: Ctx, S: GameState): void {
  const cheer = clamp01(S.cheer);
  familyMember(c, 258, FAMILY_BASE, 0.64, "#3f7fa8", "#3d241a", cheer, S.t, 0);
  familyMember(c, 462, FAMILY_BASE, 0.64, "#2f7d4f", "#241812", cheer, S.t, 2.1);
  familyMember(c, 360, FAMILY_BASE + 8, 0.48, "#e2a33c", "#5a3a22", cheer, S.t, 4.2);

  const T = TABLE;
  c.fillStyle = "rgba(0,0,0,0.3)";
  roundRect(c, T.x + 24, T.y + 96, T.w - 48, 14, 7);
  c.fill();
  c.fillStyle = C.woodDark;
  roundRect(c, T.x + 30, T.y + T.h - 6, 16, 62, 6);
  c.fill();
  roundRect(c, T.x + T.w - 46, T.y + T.h - 6, 16, 62, 6);
  c.fill();
  const g = c.createLinearGradient(0, T.y, 0, T.y + T.h);
  g.addColorStop(0, C.woodLight);
  g.addColorStop(1, C.woodDark);
  c.fillStyle = g;
  roundRect(c, T.x, T.y, T.w, T.h, 10);
  c.fill();
  c.fillStyle = "rgba(255,230,190,0.22)";
  roundRect(c, T.x + 4, T.y + 4, T.w - 8, 6, 3);
  c.fill();

  for (const px of [T.x + 74, T.x + 184, T.x + 294]) {
    c.fillStyle = "rgba(255,248,235,0.9)";
    c.beginPath();
    c.ellipse(px, T.y + 14, 38, 10, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "rgba(0,0,0,0.10)";
    c.beginPath();
    c.ellipse(px, T.y + 14, 26, 6, 0, 0, Math.PI * 2);
    c.fill();
  }
}

/** Cosmetic "you're feeding them well" meter — five hearts filling up. */
function drawHearts(c: Ctx, S: GameState): void {
  const n = 5;
  const pitch = 48;
  const fill = S.happy * n;
  for (let i = 0; i < n; i++) {
    const x = 360 + (i - (n - 1) / 2) * pitch;
    const k = clamp01(fill - i);
    heartPath(c, x, HEART_Y, 15);
    c.fillStyle = "rgba(0,0,0,0.34)";
    c.fill();
    c.strokeStyle = "rgba(255,220,180,0.5)";
    c.lineWidth = 3;
    c.stroke();
    if (k > 0) {
      c.save();
      heartPath(c, x, HEART_Y, 15);
      c.clip();
      const pop = k >= 1 ? 1 + Math.sin(S.t * 3 + i) * 0.04 : 1;
      c.fillStyle = "#ff5f7e";
      c.fillRect(x - 20, HEART_Y + 22 - 44 * k * pop, 40, 44 * k * pop);
      c.restore();
    }
  }
}

/* ---------------------------------------------------------------- order card */

const ICON: Item = {
  kind: "steak",
  x: 0,
  y: 0,
  scale: 1,
  rot: 0,
  cook: 1,
  pop: 0,
  glow: 0,
  flipped: true,
  perfect: false,
  awaitFlip: false,
  tween: null,
};

function icon(c: Ctx, kind: Kind, x: number, y: number, s: number, cook = 1): void {
  ICON.kind = kind;
  ICON.x = x;
  ICON.y = y;
  ICON.scale = s;
  ICON.cook = cook;
  if (kind === "steak") drawSteak(c, ICON);
  else drawLobster(c, ICON);
}

function orderGroup(c: Ctx, kind: Kind, gx: number, gy: number, have: number, need: number): void {
  icon(c, kind, gx - 52, gy, kind === "steak" ? 0.52 : 0.42);
  const ok = have >= need;
  const label = `${Math.min(have, need)}/${need}`;
  txt(c, label, gx + 8, gy + 2, 42, ok ? "#2f7d4f" : "#8a3a12", "left", 800);
  if (ok) {
    c.strokeStyle = "#2f7d4f";
    c.lineWidth = 6;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(gx + 84, gy + 2);
    c.lineTo(gx + 94, gy + 13);
    c.lineTo(gx + 114, gy - 14);
    c.stroke();
  }
}

function drawOrderCard(c: Ctx, S: GameState): void {
  const o = S.order;
  const shake = S.shake > 0 ? Math.sin(S.shake * 46) * S.shake * 14 : 0;
  c.save();
  c.translate(shake, 0);

  const x = CARD.x;
  const y = CARD.y;
  const w = CARD.w;
  const h = CARD.h;

  c.fillStyle = "rgba(0,0,0,0.45)";
  roundRect(c, x + 6, y + 10, w, h, 20);
  c.fill();
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, "#fff6e4");
  g.addColorStop(1, "#f3ddba");
  c.fillStyle = g;
  roundRect(c, x, y, w, h, 20);
  c.fill();
  c.strokeStyle = C.red;
  c.lineWidth = 6;
  roundRect(c, x + 9, y + 9, w - 18, h - 18, 14);
  c.stroke();

  // ready to serve — the only nudge this mode gives you
  const haveS = S.tray.filter((i) => i.kind === "steak").length;
  const haveL = S.tray.filter((i) => i.kind === "lobster").length;
  if (haveS >= o.steak && haveL >= o.lobster) {
    const pulse = 0.5 + 0.5 * Math.sin(S.t * 6);
    c.strokeStyle = `rgba(255,196,92,${0.45 + pulse * 0.55})`;
    c.lineWidth = 7;
    roundRect(c, x - 8, y - 8, w + 16, h + 16, 26);
    c.stroke();
    c.fillStyle = C.green;
    roundRect(c, x + w / 2 - 74, y + h - 12, 148, 40, 20);
    c.fill();
    txt(c, "TAP TO SERVE", x + w / 2, y + h + 9, 20, "#eafff0");
  }

  // pin
  c.fillStyle = "rgba(0,0,0,0.3)";
  c.beginPath();
  c.arc(x + w / 2 + 2, y + 2, 13, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = C.red;
  c.beginPath();
  c.arc(x + w / 2, y, 13, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "rgba(255,255,255,0.55)";
  c.beginPath();
  c.arc(x + w / 2 - 4, y - 4, 4.5, 0, Math.PI * 2);
  c.fill();

  txt(c, `ORDER #${o.n}`, x + w / 2, y + 46, 38, C.red);

  const gy = y + 118;
  if (o.lobster === 0) {
    orderGroup(c, "steak", x + w / 2 - 30, gy, haveS, o.steak);
  } else {
    orderGroup(c, "steak", x + w * 0.28, gy, haveS, o.steak);
    orderGroup(c, "lobster", x + w * 0.72, gy, haveL, o.lobster);
  }

  // timer bar
  const bx = x + 30;
  const bw = w - 60;
  const by = y + 152;
  const bh = 36;
  const k = clamp01(o.left / o.limit);
  c.fillStyle = "rgba(60,26,12,0.28)";
  roundRect(c, bx, by, bw, bh, 18);
  c.fill();
  const hot = k <= 0.22;
  const col = k > 0.5 ? ["#5fd07a", "#2f9d55"] : k > 0.22 ? ["#ffd166", "#f0a020"] : ["#ff7a5c", "#d92d20"];
  const bg = c.createLinearGradient(0, by, 0, by + bh);
  bg.addColorStop(0, col[0]);
  bg.addColorStop(1, col[1]);
  c.save();
  roundRect(c, bx, by, bw, bh, 18);
  c.clip();
  c.fillStyle = bg;
  c.fillRect(bx, by, Math.max(0, bw * k), bh);
  c.fillStyle = "rgba(255,255,255,0.25)";
  c.fillRect(bx, by + 4, Math.max(0, bw * k), 8);
  c.restore();
  if (hot) {
    const pulse = 0.45 + 0.55 * Math.abs(Math.sin(S.t * 7));
    c.strokeStyle = `rgba(255,120,90,${pulse})`;
    c.lineWidth = 4;
    roundRect(c, bx, by, bw, bh, 18);
    c.stroke();
  }
  shadowTxt(c, `${Math.ceil(Math.max(0, o.left))}s`, bx + bw / 2, by + bh / 2 + 1, 26, "#fff8ec");
  c.restore();
}

/* --------------------------------------------------------------------- grill */

function drawCoals(c: Ctx, S: GameState): void {
  const g = GRILL;
  const heat = S.ignite;
  const y0 = GRATE_Y0 - 8;
  const hh = 92;
  c.save();
  roundRect(c, g.x + 4, y0, g.w - 8, hh, 8);
  c.clip();
  c.fillStyle = "#0d0b0a";
  c.fillRect(g.x, y0 - 6, g.w, hh + 12);
  for (let i = 0; i < 54; i++) {
    const cx = g.x + 12 + rnd(i * 2.3) * (g.w - 24);
    const cy = y0 + 10 + rnd(i * 5.7) * (hh - 20);
    const r = 7 + rnd(i * 1.9) * 9;
    const flick = 0.55 + 0.45 * Math.sin(S.t * (2.2 + rnd(i) * 3) + i * 1.7);
    const hot = heat * flick;
    c.fillStyle = mixHex("#1b1614", "#ff5a00", hot * 0.85);
    c.beginPath();
    c.ellipse(cx, cy, r, r * 0.72, rnd(i * 3) * 3, 0, Math.PI * 2);
    c.fill();
    if (hot > 0.35) {
      c.fillStyle = `rgba(255,205,110,${(hot - 0.35) * 0.75})`;
      c.beginPath();
      c.ellipse(cx - r * 0.15, cy - r * 0.15, r * 0.45, r * 0.32, 0, 0, Math.PI * 2);
      c.fill();
    }
  }
  if (heat > 0.05) {
    c.globalCompositeOperation = "lighter";
    const gl = c.createRadialGradient(g.x + g.w / 2, y0 + hh / 2, 10, g.x + g.w / 2, y0 + hh / 2, g.w * 0.55);
    gl.addColorStop(0, `rgba(255,120,20,${0.5 * heat})`);
    gl.addColorStop(1, "rgba(255,80,0,0)");
    c.fillStyle = gl;
    c.fillRect(g.x, y0 - 10, g.w, hh + 20);
  }
  c.restore();
}

function drawGrate(c: Ctx, S: GameState): void {
  const g = GRILL;
  const x0 = g.x + 4;
  const w = g.w - 8;

  // slot wells — four clearly separated cook zones on the grate
  for (let i = 0; i < SLOTS; i++) {
    const sx = slotX(i);
    c.fillStyle = "rgba(0,0,0,0.4)";
    roundRect(c, sx - 62, GRATE_Y0 - 6, 124, 78, 14);
    c.fill();
    if (!S.grill[i]) {
      c.setLineDash([9, 9]);
      c.lineWidth = 3;
      c.strokeStyle = "rgba(255,214,150,0.26)";
      roundRect(c, sx - 54, GRATE_Y0 + 2, 108, 62, 12);
      c.stroke();
      c.setLineDash([]);
    }
  }

  for (let i = 0; i < 5; i++) {
    const y = GRATE_Y0 + i * 16;
    const bar = c.createLinearGradient(0, y, 0, y + 9);
    bar.addColorStop(0, "#b9c0c6");
    bar.addColorStop(0.4, "#767e85");
    bar.addColorStop(1, "#33383d");
    c.fillStyle = bar;
    roundRect(c, x0, y, w, 9, 5);
    c.fill();
  }
  // slot dividers
  c.fillStyle = "#5a6167";
  for (let i = 1; i < SLOTS; i++) {
    roundRect(c, slotX(i) - 76, GRATE_Y0 - 10, 9, 96, 5);
    c.fill();
  }
  c.fillStyle = "#4a5157";
  roundRect(c, x0 - 8, GRATE_Y0 - 12, 12, 100, 6);
  c.fill();
  roundRect(c, x0 + w - 4, GRATE_Y0 - 12, 12, 100, 6);
  c.fill();
}

function flameTongue(c: Ctx, x: number, baseY: number, w: number, h: number, t: number, seed: number): void {
  const wob = Math.sin(t * 5.2 + seed * 2.1) * w * 0.3 + Math.sin(t * 9.1 + seed) * w * 0.12;
  const layers: [string, number, number][] = [
    [C.flame1, 1, 0.5],
    [C.flame2, 0.66, 0.72],
    [C.flame3, 0.34, 0.85],
  ];
  for (const [col, k, alpha] of layers) {
    const ww = w * k;
    const hh = h * (0.42 + k * 0.58);
    c.fillStyle = col;
    c.globalAlpha = alpha;
    c.beginPath();
    c.moveTo(x - ww / 2, baseY);
    c.bezierCurveTo(x - ww * 0.62, baseY - hh * 0.42, x - ww * 0.3 + wob * 0.6, baseY - hh * 0.74, x + wob, baseY - hh);
    c.bezierCurveTo(x + ww * 0.3 + wob * 0.6, baseY - hh * 0.74, x + ww * 0.62, baseY - hh * 0.42, x + ww / 2, baseY);
    c.closePath();
    c.fill();
  }
  c.globalAlpha = 1;
}

function drawFlamesBack(c: Ctx, S: GameState): void {
  if (S.ignite <= 0.02) return;
  const g = GRILL;
  c.save();
  c.globalCompositeOperation = "lighter";
  const n = 11;
  for (let i = 0; i < n; i++) {
    const x = g.x + 24 + (i * (g.w - 48)) / (n - 1);
    const breathe = 0.68 + 0.32 * Math.sin(S.t * 3.1 + i * 1.9);
    const h = (58 + rnd(i * 3.3) * 52) * S.ignite * breathe;
    const w = 26 + rnd(i * 7.7) * 15;
    flameTongue(c, x, GRATE_Y0 + 24 - rnd(i) * 12, w, h, S.t, i);
  }
  const bloom = c.createRadialGradient(g.x + g.w / 2, GRATE_Y0 - 30, 8, g.x + g.w / 2, GRATE_Y0 - 30, 260 * S.ignite);
  bloom.addColorStop(0, `rgba(255,140,30,${0.24 * S.ignite})`);
  bloom.addColorStop(1, "rgba(255,90,0,0)");
  c.fillStyle = bloom;
  c.fillRect(g.x - 140, GRATE_Y0 - 300, g.w + 280, 340);
  c.restore();
}

function drawFlamesFront(c: Ctx, S: GameState): void {
  if (S.ignite <= 0.02) return;
  const g = GRILL;
  c.save();
  c.globalCompositeOperation = "lighter";
  c.globalAlpha = 0.85;
  for (let i = 0; i < 8; i++) {
    const x = g.x + 34 + (i * (g.w - 68)) / 7;
    const breathe = 0.6 + 0.4 * Math.sin(S.t * 4.3 + i * 2.6);
    const h = (26 + rnd(i * 9.1) * 24) * S.ignite * breathe;
    flameTongue(c, x, GRATE_Y0 + 74, 20 + rnd(i * 4.4) * 11, h, S.t * 1.2, i + 11);
  }
  c.restore();
}

function drawGrillBody(c: Ctx, S: GameState): void {
  const g = GRILL;
  const bot = g.y + g.h;
  c.fillStyle = "rgba(0,0,0,0.4)";
  roundRect(c, g.x - 6, bot - 12, g.w + 12, 20, 9);
  c.fill();

  // back lip — also the shelf the cook meters sit on
  c.fillStyle = "#191614";
  roundRect(c, g.x - 12, g.y, g.w + 24, 48, 10);
  c.fill();
  c.fillStyle = "rgba(255,220,170,0.12)";
  roundRect(c, g.x - 10, g.y + 2, g.w + 20, 5, 3);
  c.fill();

  drawCoals(c, S);
  drawGrate(c, S);

  // front lip
  const lipY = GRATE_Y0 + 86;
  const lip = c.createLinearGradient(0, lipY, 0, lipY + 30);
  lip.addColorStop(0, "#43494e");
  lip.addColorStop(1, "#15120f");
  c.fillStyle = lip;
  roundRect(c, g.x - 14, lipY, g.w + 28, 32, 9);
  c.fill();
  c.fillStyle = "rgba(255,220,170,0.22)";
  roundRect(c, g.x - 12, lipY + 2, g.w + 24, 4, 2);
  c.fill();

  // firebox front
  const boxY = lipY + 26;
  const box = c.createLinearGradient(0, boxY, 0, bot);
  box.addColorStop(0, "#2b2523");
  box.addColorStop(0.5, C.black2);
  box.addColorStop(1, C.black);
  c.fillStyle = box;
  roundRect(c, g.x - 6, boxY, g.w + 12, bot - boxY, 12);
  c.fill();

  if (S.ignite > 0.05) {
    c.save();
    c.globalCompositeOperation = "lighter";
    const seam = c.createLinearGradient(0, boxY + 8, 0, boxY + 40);
    seam.addColorStop(0, `rgba(255,120,20,${0.8 * S.ignite})`);
    seam.addColorStop(1, "rgba(255,60,0,0)");
    c.fillStyle = seam;
    roundRect(c, g.x + 22, boxY + 8, g.w - 44, 32, 8);
    c.fill();
    c.restore();
  }

  // brand plate
  const py = boxY + 46;
  c.fillStyle = "rgba(0,0,0,0.5)";
  roundRect(c, g.x + 128, py, g.w - 256, 34, 9);
  c.fill();
  c.strokeStyle = "rgba(255,196,92,0.5)";
  c.lineWidth = 2;
  roundRect(c, g.x + 132, py + 3, g.w - 264, 28, 7);
  c.stroke();
  txt(c, "LILY'S  ISLAND  GRILL", g.x + g.w / 2, py + 18, 20, "rgba(255,233,201,0.8)");

  // vent slots
  c.fillStyle = "rgba(0,0,0,0.75)";
  for (let i = 0; i < 6; i++) {
    roundRect(c, g.x + 24 + i * 92, py + 44, 44, 12, 6);
    c.fill();
  }
  c.fillStyle = `rgba(255,140,40,${0.5 * S.ignite})`;
  for (let i = 0; i < 6; i++) {
    roundRect(c, g.x + 26 + i * 92, py + 46, 40, 6, 3);
    c.fill();
  }

  // wooden handle rail
  c.fillStyle = C.woodDark;
  roundRect(c, g.x - 18, bot - 24, g.w + 36, 16, 8);
  c.fill();
  c.fillStyle = C.wood;
  roundRect(c, g.x - 18, bot - 24, g.w + 36, 10, 5);
  c.fill();
}

/* ----------------------------------------------------------------------- pot */

const POT_CX = POT.x + POT.w / 2;
const RIM_Y = POT.y + 32;

function drawPotBack(c: Ctx, S: GameState): void {
  const p = POT;
  const bot = p.y + p.h;

  c.fillStyle = "rgba(0,0,0,0.4)";
  roundRect(c, p.x + 10, bot - 10, p.w - 20, 18, 9);
  c.fill();

  // burner
  c.fillStyle = "#2c2724";
  roundRect(c, p.x + 40, bot - 22, p.w - 80, 16, 8);
  c.fill();

  // body
  const body = c.createLinearGradient(p.x, 0, p.x + p.w, 0);
  body.addColorStop(0, "#42484e");
  body.addColorStop(0.3, "#8f979e");
  body.addColorStop(0.62, "#5d656c");
  body.addColorStop(1, "#33383d");
  c.fillStyle = body;
  c.beginPath();
  c.moveTo(p.x + 6, RIM_Y);
  c.lineTo(p.x + p.w - 6, RIM_Y);
  c.lineTo(p.x + p.w - 30, bot - 14);
  c.lineTo(p.x + 30, bot - 14);
  c.closePath();
  c.fill();

  // handles
  c.strokeStyle = "#3a4046";
  c.lineWidth = 11;
  c.beginPath();
  c.arc(p.x + 12, RIM_Y + 46, 18, Math.PI * 0.4, Math.PI * 1.6);
  c.stroke();
  c.beginPath();
  c.arc(p.x + p.w - 12, RIM_Y + 46, 18, Math.PI * 1.4, Math.PI * 0.6);
  c.stroke();

  // rim
  const rim = c.createLinearGradient(0, RIM_Y - 24, 0, RIM_Y + 24);
  rim.addColorStop(0, "#c2cad1");
  rim.addColorStop(1, "#4b5258");
  c.fillStyle = rim;
  c.beginPath();
  c.ellipse(POT_CX, RIM_Y, p.w / 2 - 4, 46, 0, 0, Math.PI * 2);
  c.fill();

  // water
  const wob = Math.sin(S.t * 4) * 1.6;
  const water = c.createLinearGradient(0, RIM_Y - 38, 0, RIM_Y + 38);
  water.addColorStop(0, "#9fc6d6");
  water.addColorStop(0.45, "#cfe6ef");
  water.addColorStop(1, "#5d8496");
  c.fillStyle = water;
  c.beginPath();
  c.ellipse(POT_CX, RIM_Y + 4 + wob * 0.3, p.w / 2 - 20, 38, 0, 0, Math.PI * 2);
  c.fill();

  // four bubbling wells
  for (let i = 0; i < SLOTS; i++) {
    const sx = slotX(i);
    c.fillStyle = "rgba(30,70,90,0.28)";
    c.beginPath();
    c.ellipse(sx, RIM_Y + 6, 58, 28, 0, 0, Math.PI * 2);
    c.fill();
    if (!S.pot[i]) {
      c.setLineDash([9, 9]);
      c.lineWidth = 3;
      c.strokeStyle = "rgba(255,255,255,0.42)";
      c.beginPath();
      c.ellipse(sx, RIM_Y + 6, 48, 22, 0, 0, Math.PI * 2);
      c.stroke();
      c.setLineDash([]);
    } else {
      // simmering rings under each occupied well
      for (let k = 0; k < 3; k++) {
        const ph = (S.t * 0.9 + k * 0.33 + i * 0.21) % 1;
        c.strokeStyle = `rgba(255,255,255,${0.35 * (1 - ph)})`;
        c.lineWidth = 2.5;
        c.beginPath();
        c.ellipse(sx, RIM_Y + 6, 14 + ph * 40, 7 + ph * 19, 0, 0, Math.PI * 2);
        c.stroke();
      }
    }
  }
}

function drawPotFront(c: Ctx, S: GameState): void {
  const p = POT;
  // translucent water sheen over whatever is submerged
  c.save();
  c.beginPath();
  c.ellipse(POT_CX, RIM_Y + 4, p.w / 2 - 20, 38, 0, 0, Math.PI * 2);
  c.clip();
  c.fillStyle = "rgba(150,205,225,0.3)";
  c.fillRect(p.x, RIM_Y - 40, p.w, 90);
  c.fillStyle = "rgba(255,255,255,0.22)";
  c.beginPath();
  c.ellipse(POT_CX - 150, RIM_Y - 14, 60, 9, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();

  // rim highlight
  c.strokeStyle = "rgba(255,255,255,0.35)";
  c.lineWidth = 4;
  c.beginPath();
  c.ellipse(POT_CX, RIM_Y - 2, p.w / 2 - 8, 42, 0, Math.PI * 1.06, Math.PI * 1.94);
  c.stroke();

  if (S.potBoil > 0.05) {
    c.save();
    c.globalCompositeOperation = "lighter";
    const gl = c.createRadialGradient(POT_CX, RIM_Y, 6, POT_CX, RIM_Y, 240);
    gl.addColorStop(0, `rgba(180,230,255,${0.12 * S.potBoil})`);
    gl.addColorStop(1, "rgba(180,230,255,0)");
    c.fillStyle = gl;
    c.fillRect(p.x - 60, p.y - 60, p.w + 120, p.h + 120);
    c.restore();
  }
}

/* -------------------------------------------------------------------- fridge */

function drawDoor(c: Ctx, S: GameState, d: number, kind: Kind, label: string): void {
  const r = doorRect(d);
  const flash = S.doorFlash[d];
  const full = S.doorFull[d];
  const shake = full > 0 ? Math.sin(full * 52) * full * 9 : 0;
  c.save();
  c.translate(shake, 0);

  const g = c.createLinearGradient(r.x, 0, r.x + r.w, 0);
  g.addColorStop(0, "#f8ecd6");
  g.addColorStop(0.45, "#efdcbd");
  g.addColorStop(1, "#d6bd99");
  c.fillStyle = g;
  roundRect(c, r.x, r.y, r.w, r.h, 18);
  c.fill();
  c.strokeStyle = "rgba(90,50,25,0.55)";
  c.lineWidth = 5;
  c.stroke();

  // chilled interior window
  const ix = r.x + 22;
  const iy = r.y + 18;
  const iw = r.w - 74;
  const ih = r.h - 74;
  const cav = c.createLinearGradient(ix, iy, ix, iy + ih);
  cav.addColorStop(0, "#dfeef6");
  cav.addColorStop(1, "#a9c4d2");
  c.fillStyle = cav;
  roundRect(c, ix, iy, iw, ih, 12);
  c.fill();
  c.strokeStyle = "rgba(90,50,25,0.25)";
  c.lineWidth = 3;
  c.stroke();

  icon(c, kind, ix + iw / 2, iy + ih / 2 + (kind === "lobster" ? -4 : 0), kind === "steak" ? 0.94 : 0.78, 0);

  // wooden trim + chrome handle
  c.fillStyle = C.woodDark;
  roundRect(c, r.x + r.w - 42, r.y + 30, 18, r.h - 60, 9);
  c.fill();
  c.fillStyle = "#c9d2d8";
  roundRect(c, r.x + r.w - 40, r.y + 34, 14, r.h - 76, 7);
  c.fill();

  // label plate
  const ly = r.y + r.h - 44;
  c.fillStyle = C.red;
  roundRect(c, ix, ly, iw, 34, 9);
  c.fill();
  txt(c, label, ix + iw / 2, ly + 18, 24, C.cream);

  if (flash > 0) {
    c.fillStyle = `rgba(255,255,255,${flash * 0.5})`;
    roundRect(c, r.x, r.y, r.w, r.h, 18);
    c.fill();
  }
  if (full > 0) {
    c.fillStyle = `rgba(20,9,4,${full * 0.45})`;
    roundRect(c, r.x, r.y, r.w, r.h, 18);
    c.fill();
    c.save();
    c.globalAlpha = clamp01(full * 1.6);
    c.translate(r.x + r.w / 2, r.y + r.h / 2);
    c.rotate(-0.12);
    c.fillStyle = "rgba(20,9,4,0.8)";
    roundRect(c, -104, -30, 208, 60, 14);
    c.fill();
    c.strokeStyle = "#ff9a7a";
    c.lineWidth = 4;
    roundRect(c, -100, -26, 200, 52, 11);
    c.stroke();
    txt(c, "FULL", 0, 2, 40, "#ff9a7a");
    c.restore();
  }
  c.restore();
}

function drawFridge(c: Ctx, S: GameState): void {
  const F = FRIDGE;
  c.fillStyle = "rgba(0,0,0,0.42)";
  roundRect(c, F.x + 8, F.y + 14, F.w, F.h, 24);
  c.fill();
  const body = c.createLinearGradient(0, F.y, 0, F.y + F.h);
  body.addColorStop(0, "#5b6167");
  body.addColorStop(1, "#31363b");
  c.fillStyle = body;
  roundRect(c, F.x, F.y, F.w, F.h, 24);
  c.fill();

  drawDoor(c, S, 0, "steak", "STEAK");
  drawDoor(c, S, 1, "lobster", "LOBSTER");

  // wooden plinth
  c.fillStyle = C.woodDark;
  roundRect(c, F.x + 6, F.y + F.h - 14, F.w - 12, 20, 8);
  c.fill();
  c.fillStyle = C.wood;
  roundRect(c, F.x + 6, F.y + F.h - 14, F.w - 12, 12, 6);
  c.fill();
}

/* ------------------------------------------------------------- serving tray */

function drawTray(c: Ctx, S: GameState): void {
  const T = TRAY;
  const full = S.tray.length >= TRAY_CAP;
  const shake = S.trayShake > 0 ? Math.sin(S.trayShake * 48) * S.trayShake * 8 : 0;
  c.save();
  c.translate(shake, 0);

  c.fillStyle = "rgba(0,0,0,0.4)";
  roundRect(c, T.x + 8, T.y + 16, T.w, T.h, 16);
  c.fill();

  const g = c.createLinearGradient(0, T.y, 0, T.y + T.h);
  g.addColorStop(0, "#b6813f");
  g.addColorStop(0.35, C.woodLight);
  g.addColorStop(1, C.woodDark);
  c.fillStyle = g;
  roundRect(c, T.x, T.y, T.w, T.h, 16);
  c.fill();
  c.fillStyle = "rgba(255,230,190,0.24)";
  roundRect(c, T.x + 5, T.y + 5, T.w - 10, 7, 4);
  c.fill();
  // grain
  c.fillStyle = "rgba(60,26,12,0.16)";
  for (let i = 0; i < 14; i++) {
    const y = T.y + 16 + rnd(i * 4.4) * (T.h - 30);
    c.fillRect(T.x + 12 + rnd(i * 2.2) * 120, y, 60 + rnd(i) * 220, 2);
  }
  // front lip
  c.fillStyle = "rgba(0,0,0,0.28)";
  roundRect(c, T.x, T.y + T.h - 14, T.w, 14, 8);
  c.fill();

  for (let i = 0; i < TRAY_CAP; i++) {
    if (i < S.tray.length) continue;
    c.setLineDash([7, 8]);
    c.lineWidth = 3;
    c.strokeStyle = "rgba(255,238,210,0.24)";
    c.beginPath();
    c.ellipse(trayX(i), TRAY_Y + 6, 32, 20, 0, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);
  }

  if (full) {
    const pulse = 0.5 + 0.5 * Math.sin(S.t * 5);
    txt(c, "TRAY FULL — tap an item to toss it", T.x + T.w / 2, T.y - 14, 22, `rgba(255,196,92,${0.55 + pulse * 0.45})`);
  }
  c.restore();
}

/* ---------------------------------------------------------------------- Lily */

function drawLily(c: Ctx, S: GameState): void {
  const bob = Math.sin(S.t * 2) * 3 + S.lilyBob;
  const cheer = S.cheer > 0.2 ? Math.abs(Math.sin(S.t * 6)) * 10 * S.cheer : 0;

  c.fillStyle = "rgba(0,0,0,0.32)";
  c.beginPath();
  c.ellipse(LILY_X, LILY_BASE + 6, 54, 13, 0, 0, Math.PI * 2);
  c.fill();

  c.save();
  c.translate(LILY_X, LILY_BASE - bob - cheer);
  c.scale(0.94, 0.94);

  c.fillStyle = "#3b4a63";
  roundRect(c, -26, -96, 20, 96, 9);
  c.fill();
  roundRect(c, 6, -96, 20, 96, 9);
  c.fill();
  c.fillStyle = "#2a2320";
  roundRect(c, -32, -14, 30, 16, 7);
  c.fill();
  roundRect(c, 4, -14, 30, 16, 7);
  c.fill();

  const dress = c.createLinearGradient(0, -210, 0, -90);
  dress.addColorStop(0, "#e2555f");
  dress.addColorStop(1, "#a82f3d");
  c.fillStyle = dress;
  c.beginPath();
  c.moveTo(-34, -206);
  c.lineTo(34, -206);
  c.lineTo(46, -88);
  c.lineTo(-46, -88);
  c.closePath();
  c.fill();
  c.fillStyle = C.apron;
  c.beginPath();
  c.moveTo(-22, -194);
  c.lineTo(22, -194);
  c.lineTo(30, -92);
  c.lineTo(-30, -92);
  c.closePath();
  c.fill();
  c.fillStyle = "rgba(255,255,255,0.5)";
  roundRect(c, -12, -150, 24, 22, 5);
  c.fill();

  const lift = S.cheer > 0.2 ? -34 : -10;
  c.strokeStyle = C.skin;
  c.lineWidth = 15;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(-30, -188);
  c.lineTo(-52, -140 + lift);
  c.stroke();
  c.beginPath();
  c.moveTo(30, -188);
  c.lineTo(54, -142 + lift);
  c.stroke();

  c.fillStyle = C.hair;
  c.beginPath();
  c.arc(0, -244, 44, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = C.skin;
  c.beginPath();
  c.arc(0, -240, 37, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = C.hair;
  c.beginPath();
  c.arc(0, -252, 37, Math.PI * 1.06, Math.PI * 1.94);
  c.fill();
  c.beginPath();
  c.arc(-44, -232, 15, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.arc(44, -232, 15, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = "#2a1c14";
  if (Math.sin(S.t * 1.3) > 0.985) {
    c.lineWidth = 3;
    c.strokeStyle = "#2a1c14";
    c.beginPath();
    c.moveTo(-18, -240);
    c.lineTo(-8, -240);
    c.moveTo(8, -240);
    c.lineTo(18, -240);
    c.stroke();
  } else {
    c.beginPath();
    c.arc(-13, -242, 4.6, 0, Math.PI * 2);
    c.arc(13, -242, 4.6, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = "rgba(255,140,150,0.5)";
  c.beginPath();
  c.arc(-24, -230, 8, 0, Math.PI * 2);
  c.arc(24, -230, 8, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = "#2a1c14";
  c.lineWidth = 3.4;
  c.beginPath();
  c.arc(0, -232, 13, 0.18 * Math.PI, 0.82 * Math.PI);
  c.stroke();

  c.fillStyle = "#fffaf0";
  c.beginPath();
  c.arc(-22, -296, 19, 0, Math.PI * 2);
  c.arc(22, -296, 19, 0, Math.PI * 2);
  c.arc(0, -308, 22, 0, Math.PI * 2);
  c.fill();
  roundRect(c, -32, -292, 64, 22, 8);
  c.fill();
  c.fillStyle = "rgba(0,0,0,0.07)";
  roundRect(c, -32, -278, 64, 8, 4);
  c.fill();
  c.restore();
}

/* --------------------------------------------------------------------- items */

export function drawSteak(c: Ctx, it: Item): void {
  const s = it.scale * (1 + it.pop * 0.22);
  c.save();
  c.translate(it.x, it.y);
  c.rotate(it.rot);
  c.scale(s, s);

  if (it.glow > 0) {
    c.save();
    c.globalCompositeOperation = "lighter";
    const gl = c.createRadialGradient(0, 0, 4, 0, 0, 78);
    gl.addColorStop(0, `rgba(255,200,90,${0.45 * it.glow})`);
    gl.addColorStop(1, "rgba(255,180,60,0)");
    c.fillStyle = gl;
    c.fillRect(-90, -90, 180, 180);
    c.restore();
  }

  c.strokeStyle = "#c79a5f";
  c.lineWidth = 7;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(-64, 6);
  c.lineTo(64, -6);
  c.stroke();
  c.strokeStyle = "rgba(0,0,0,0.25)";
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(-64, 8);
  c.lineTo(64, -4);
  c.stroke();

  const meat = mixHex(C.steakRaw, C.steakDone, clamp01(it.cook * 1.05));
  const dark = mixHex("#8e3a44", "#43200f", clamp01(it.cook * 1.05));
  c.fillStyle = meat;
  c.beginPath();
  c.moveTo(-44, -6);
  c.bezierCurveTo(-48, -30, -18, -34, 6, -30);
  c.bezierCurveTo(38, -34, 50, -14, 44, 6);
  c.bezierCurveTo(48, 26, 20, 34, -6, 30);
  c.bezierCurveTo(-34, 34, -46, 14, -44, -6);
  c.closePath();
  c.fill();

  c.fillStyle = mixHex("#f2ddc0", "#d8b98c", clamp01(it.cook));
  c.beginPath();
  c.moveTo(-44, -6);
  c.bezierCurveTo(-48, -30, -18, -34, 6, -30);
  c.lineTo(2, -21);
  c.bezierCurveTo(-16, -25, -39, -22, -36, -6);
  c.closePath();
  c.fill();

  const marks = clamp01((it.cook - 0.12) * 2.1);
  if (marks > 0) {
    c.save();
    c.beginPath();
    c.moveTo(-44, -6);
    c.bezierCurveTo(-48, -30, -18, -34, 6, -30);
    c.bezierCurveTo(38, -34, 50, -14, 44, 6);
    c.bezierCurveTo(48, 26, 20, 34, -6, 30);
    c.bezierCurveTo(-34, 34, -46, 14, -44, -6);
    c.closePath();
    c.clip();
    c.globalAlpha = marks * 0.62;
    c.strokeStyle = "#2a1207";
    c.lineWidth = 6;
    c.lineCap = "butt";
    const a = it.flipped ? -0.5 : 0.5;
    for (let i = -2; i <= 2; i++) {
      c.save();
      c.rotate(a);
      c.beginPath();
      c.moveTo(i * 22, -60);
      c.lineTo(i * 22, 60);
      c.stroke();
      c.restore();
    }
    c.globalAlpha = 1;
    c.restore();
  }

  c.fillStyle = "rgba(255,255,255,0.16)";
  c.beginPath();
  c.ellipse(-10, -12, 16, 7, -0.4, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = dark;
  c.lineWidth = 2.5;
  c.beginPath();
  c.moveTo(-44, -6);
  c.bezierCurveTo(-48, -30, -18, -34, 6, -30);
  c.bezierCurveTo(38, -34, 50, -14, 44, 6);
  c.bezierCurveTo(48, 26, 20, 34, -6, 30);
  c.bezierCurveTo(-34, 34, -46, 14, -44, -6);
  c.closePath();
  c.stroke();
  c.restore();
}

/** One pincer claw, drawn at the origin pointing up; the V-notch is what makes it read. */
function pincer(c: Ctx, col: string, lite: string): void {
  c.fillStyle = col;
  c.beginPath();
  c.ellipse(0, 0, 15, 20, 0, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.moveTo(-12, -10);
  c.quadraticCurveTo(-18, -34, -3, -31);
  c.quadraticCurveTo(-4, -20, -3, -9);
  c.closePath();
  c.fill();
  c.beginPath();
  c.moveTo(5, -13);
  c.quadraticCurveTo(17, -33, 15, -12);
  c.quadraticCurveTo(12, -4, 6, -4);
  c.closePath();
  c.fill();
  c.fillStyle = lite;
  c.beginPath();
  c.ellipse(-4, -2, 6, 9, -0.3, 0, Math.PI * 2);
  c.fill();
}

export function drawLobster(c: Ctx, it: Item): void {
  const s = it.scale * (1 + it.pop * 0.22);
  const cooked = clamp01(it.cook * 1.05);
  const col = mixHex(C.lobRaw, C.lobDone, cooked);
  const dark = mixHex("#65626c", "#a02310", cooked);
  const lite = mixHex("#b6b3bd", "#ff8560", cooked);
  c.save();
  c.translate(it.x, it.y);
  c.rotate(it.rot);
  c.scale(s, s);

  if (it.glow > 0) {
    c.save();
    c.globalCompositeOperation = "lighter";
    const gl = c.createRadialGradient(0, 0, 4, 0, 0, 84);
    gl.addColorStop(0, `rgba(255,140,90,${0.45 * it.glow})`);
    gl.addColorStop(1, "rgba(255,120,60,0)");
    c.fillStyle = gl;
    c.fillRect(-96, -96, 192, 192);
    c.restore();
  }

  c.strokeStyle = dark;
  c.lineWidth = 2.6;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(-5, -42);
  c.quadraticCurveTo(-16, -56, -24, -58);
  c.moveTo(5, -42);
  c.quadraticCurveTo(16, -56, 24, -58);
  c.stroke();

  c.strokeStyle = dark;
  c.lineWidth = 4;
  for (let i = 0; i < 3; i++) {
    const y = -8 + i * 13;
    c.beginPath();
    c.moveTo(-12, y);
    c.quadraticCurveTo(-24, y + 4, -25, y + 14);
    c.moveTo(12, y);
    c.quadraticCurveTo(24, y + 4, 25, y + 14);
    c.stroke();
  }

  for (let i = 0; i < 4; i++) {
    const w = 19 - i * 2.6;
    c.fillStyle = mixHex(col, dark, 0.06 + i * 0.11);
    roundRect(c, -w, -6 + i * 13, w * 2, 15, 7);
    c.fill();
    c.fillStyle = "rgba(255,255,255,0.15)";
    roundRect(c, -w + 4, -4 + i * 13, w * 2 - 8, 4, 2);
    c.fill();
  }
  c.fillStyle = mixHex(col, dark, 0.4);
  c.beginPath();
  c.moveTo(-13, 44);
  c.quadraticCurveTo(-25, 62, -8, 62);
  c.quadraticCurveTo(0, 52, 8, 62);
  c.quadraticCurveTo(25, 62, 13, 44);
  c.closePath();
  c.fill();

  for (const sgn of [-1, 1]) {
    c.strokeStyle = col;
    c.lineWidth = 9;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(sgn * 13, -22);
    c.quadraticCurveTo(sgn * 30, -18, sgn * 38, -8);
    c.stroke();
    c.save();
    c.translate(sgn * 44, -24);
    c.rotate(sgn * 0.42);
    c.scale(sgn, 1);
    pincer(c, col, lite);
    c.restore();
  }

  c.fillStyle = col;
  c.beginPath();
  c.ellipse(0, -24, 19, 21, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = lite;
  c.beginPath();
  c.ellipse(-6, -31, 7, 9, -0.4, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = "#1a1414";
  c.beginPath();
  c.arc(-8, -36, 4.6, 0, Math.PI * 2);
  c.arc(8, -36, 4.6, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "rgba(255,255,255,0.9)";
  c.beginPath();
  c.arc(-6.6, -37.4, 1.8, 0, Math.PI * 2);
  c.arc(9.4, -37.4, 1.8, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function drawItem(c: Ctx, it: Item): void {
  if (it.kind === "steak") drawSteak(c, it);
  else drawLobster(c, it);
}

/* ----------------------------------------------------------------- particles */

function drawParticles(c: Ctx, S: GameState): void {
  for (const p of S.particles) {
    const k = p.life / p.max;
    const a = k > 0.75 ? (1 - k) * 4 : k * 1.2;
    c.save();
    c.globalAlpha = clamp01(a);
    switch (p.kind) {
      case "steam":
      case "puff": {
        c.fillStyle = p.kind === "steam" ? "rgba(255,255,255,0.5)" : "rgba(210,190,175,0.45)";
        c.beginPath();
        c.arc(p.x, p.y, p.size * (0.5 + k * 1.4), 0, Math.PI * 2);
        c.fill();
        break;
      }
      case "ember": {
        c.globalCompositeOperation = "lighter";
        c.fillStyle = k < 0.5 ? C.emberHot : C.ember;
        c.beginPath();
        c.arc(p.x, p.y, p.size * (1 - k * 0.6), 0, Math.PI * 2);
        c.fill();
        break;
      }
      case "bubble": {
        c.strokeStyle = "rgba(240,255,255,0.85)";
        c.lineWidth = 2;
        c.beginPath();
        c.arc(p.x, p.y, p.size * (0.6 + k * 0.7), 0, Math.PI * 2);
        c.stroke();
        c.fillStyle = "rgba(220,245,255,0.28)";
        c.fill();
        break;
      }
      case "sparkle": {
        c.globalCompositeOperation = "lighter";
        c.translate(p.x, p.y);
        c.rotate(p.rot + k * 3);
        c.fillStyle = C.gold;
        const r = p.size * (1 - k * 0.4);
        c.beginPath();
        for (let i = 0; i < 4; i++) {
          const ang = (i / 4) * Math.PI * 2;
          c.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
          c.lineTo(Math.cos(ang + Math.PI / 4) * r * 0.32, Math.sin(ang + Math.PI / 4) * r * 0.32);
        }
        c.closePath();
        c.fill();
        break;
      }
      case "heart": {
        c.fillStyle = "#ff5f7e";
        heartPath(c, p.x, p.y, p.size);
        c.fill();
        break;
      }
    }
    c.restore();
  }
}

/* ------------------------------------------------------------- slot displays */

function pill(c: Ctx, x: number, y: number, w: number, h: number, fill: string, stroke?: string): void {
  c.fillStyle = "rgba(0,0,0,0.55)";
  roundRect(c, x - 3, y - 3, w + 6, h + 6, h / 2 + 3);
  c.fill();
  c.fillStyle = fill;
  roundRect(c, x, y, w, h, h / 2);
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 3;
    roundRect(c, x, y, w, h, h / 2);
    c.stroke();
  }
}

function slotMeter(c: Ctx, it: Item, x: number, y: number, t: number): void {
  const w = 116;
  const h = 20;
  const left = x - w / 2;
  if (it.awaitFlip) {
    const pulse = 0.55 + 0.45 * Math.abs(Math.sin(t * 9));
    pill(c, left, y - h / 2, w, h, `rgba(255,238,180,${0.55 + pulse * 0.45})`, "#fff");
    txt(c, "FLIP!", x, y + 1, 17, "#8a3a12");
    return;
  }
  if (it.cook >= 1) {
    const pulse = 0.55 + 0.45 * Math.abs(Math.sin(t * 5));
    pill(c, left, y - h / 2, w, h, `rgba(90,200,120,${0.6 + pulse * 0.4})`, "rgba(255,255,255,0.8)");
    txt(c, "TAP!", x, y + 1, 17, "#0f3d22");
    return;
  }
  c.fillStyle = "rgba(0,0,0,0.55)";
  roundRect(c, left - 3, y - h / 2 - 3, w + 6, h + 6, 13);
  c.fill();
  c.fillStyle = "rgba(255,240,220,0.18)";
  roundRect(c, left, y - h / 2, w, h, 10);
  c.fill();
  const g = c.createLinearGradient(left, 0, left + w, 0);
  g.addColorStop(0, "#ffd166");
  g.addColorStop(0.6, "#ff9d2e");
  g.addColorStop(1, "#ff5f2e");
  c.fillStyle = g;
  roundRect(c, left, y - h / 2, Math.max(8, w * clamp01(it.cook)), h, 10);
  c.fill();
}

function drawMeters(c: Ctx, S: GameState): void {
  for (let i = 0; i < SLOTS; i++) {
    const g = S.grill[i];
    if (g && !g.tween) slotMeter(c, g, slotX(i), GRILL_METER_Y, S.t);
    const p = S.pot[i];
    if (p && !p.tween) slotMeter(c, p, slotX(i), POT_METER_Y, S.t);
  }
}

/* ----------------------------------------------------------------------- HUD */

function drawHud(c: Ctx, S: GameState, muted: boolean): void {
  const g = c.createLinearGradient(0, 0, 0, 116);
  g.addColorStop(0, "rgba(20,9,4,0.94)");
  g.addColorStop(1, "rgba(20,9,4,0)");
  c.fillStyle = g;
  c.fillRect(-40, -40, DW + 80, 156);

  shadowTxt(c, "SCORE", 30, 50, 17, "rgba(255,220,170,0.75)", "left");
  shadowTxt(c, String(S.score), 30, 80, 34, C.gold, "left");
  shadowTxt(c, "BEST", 600, 50, 17, "rgba(255,220,170,0.75)", "right");
  shadowTxt(c, String(S.best), 600, 80, 34, C.cream, "right");

  const m = MUTE_BTN;
  c.fillStyle = "rgba(255,235,205,0.14)";
  roundRect(c, m.x, m.y, m.w, m.h, 18);
  c.fill();
  c.fillStyle = C.cream;
  c.beginPath();
  c.moveTo(m.x + 20, m.y + 24);
  c.lineTo(m.x + 27, m.y + 24);
  c.lineTo(m.x + 36, m.y + 15);
  c.lineTo(m.x + 36, m.y + 45);
  c.lineTo(m.x + 27, m.y + 36);
  c.lineTo(m.x + 20, m.y + 36);
  c.closePath();
  c.fill();
  c.strokeStyle = C.cream;
  c.lineWidth = 3;
  if (muted) {
    c.beginPath();
    c.moveTo(m.x + 41, m.y + 22);
    c.lineTo(m.x + 51, m.y + 38);
    c.moveTo(m.x + 51, m.y + 22);
    c.lineTo(m.x + 41, m.y + 38);
    c.stroke();
  } else {
    c.beginPath();
    c.arc(m.x + 38, m.y + 30, 8, -0.7, 0.7);
    c.stroke();
    c.beginPath();
    c.arc(m.x + 38, m.y + 30, 14, -0.7, 0.7);
    c.stroke();
  }
}

function drawToast(c: Ctx, S: GameState): void {
  if (!S.toast) return;
  const k = clamp01(S.toast.t / 1.2);
  c.save();
  c.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : Math.min(1, k * 4);
  shadowTxt(c, S.toast.text, DW / 2, 760 - (1 - k) * 34, 46, C.gold);
  c.restore();
}

/* ------------------------------------------------------------------ tooltips */

const TIPS: { text: string; target: Rect }[] = [
  {
    text: "Tap the fridge — steak jumps on the grill, lobster drops in the pot. Four of each at once!",
    target: { x: FRIDGE.x, y: FRIDGE.y, w: FRIDGE.w, h: FRIDGE.h },
  },
  {
    text: "Flip a steak when it flashes FLIP, then tap anything glowing to plate it on the tray.",
    target: { x: GRILL.x - 8, y: GRILL.y, w: GRILL.w + 16, h: POT.y + POT.h - GRILL.y },
  },
  {
    text: "Feed the family exactly what the order card asks — before the timer runs out!",
    target: { x: CARD.x - 10, y: CARD.y - 14, w: CARD.w + 20, h: CARD.h + 28 },
  },
];

export const TIP_COUNT = TIPS.length;

function drawTips(c: Ctx, S: GameState): void {
  const tip = TIPS[Math.min(S.tip, TIPS.length - 1)];
  const r = tip.target;
  c.save();
  c.fillStyle = "rgba(16,7,3,0.74)";
  c.beginPath();
  c.rect(-60, -60, DW + 120, DH + 120);
  roundRectPath(c, r.x, r.y, r.w, r.h, 22);
  c.fill("evenodd");

  const pulse = 0.5 + 0.5 * Math.sin(S.t * 4);
  c.strokeStyle = `rgba(255,205,110,${0.5 + pulse * 0.5})`;
  c.lineWidth = 6;
  c.setLineDash([18, 14]);
  c.lineDashOffset = -S.t * 40;
  roundRect(c, r.x, r.y, r.w, r.h, 22);
  c.stroke();
  c.setLineDash([]);

  // callout — sits opposite the highlight so it never covers it
  const above = r.y > DH / 2;
  const bh = 250;
  const by = above ? r.y - bh - 40 : r.y + r.h + 40;
  const bx = 60;
  const bw = DW - 120;
  c.fillStyle = "rgba(0,0,0,0.45)";
  roundRect(c, bx + 6, by + 10, bw, bh, 26);
  c.fill();
  const g = c.createLinearGradient(0, by, 0, by + bh);
  g.addColorStop(0, "#fff6e4");
  g.addColorStop(1, "#f0d9b4");
  c.fillStyle = g;
  roundRect(c, bx, by, bw, bh, 26);
  c.fill();
  c.strokeStyle = C.red;
  c.lineWidth = 6;
  roundRect(c, bx + 10, by + 10, bw - 20, bh - 20, 18);
  c.stroke();

  txt(c, `TIP ${S.tip + 1} of ${TIPS.length}`, DW / 2, by + 46, 22, "#a97542");
  wrapText(c, tip.text, DW / 2, by + 98, bw - 76, 36, 30, "#8a3a12");
  txt(c, "tap to continue →", DW / 2, by + bh - 34, 24, C.red);
  c.restore();
}

function wrapText(
  c: Ctx,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number,
  size: number,
  color: string,
): void {
  c.font = `800 ${size}px ${FONT}`;
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (c.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  lines.forEach((l, i) => txt(c, l, x, y + i * lineH, size, color));
}

/* -------------------------------------------------------------------- popups */

function drawPopup(c: Ctx, S: GameState): void {
  if (S.popup <= 0.001) return;
  const start = S.popupKind === "start";
  const k = easeOut(clamp01(S.popup));
  c.save();
  c.globalAlpha = k * 0.76;
  c.fillStyle = "#160a05";
  c.fillRect(-60, -60, DW + 120, DH + 120);
  c.globalAlpha = 1;

  const w = 580;
  const h = 520;
  const x = DW / 2 - w / 2;
  const y = 440;
  c.translate(DW / 2, y + h / 2);
  c.scale(0.74 + k * 0.26, 0.74 + k * 0.26);
  c.translate(-DW / 2, -(y + h / 2));
  c.globalAlpha = k;

  c.fillStyle = "rgba(0,0,0,0.5)";
  roundRect(c, x + 8, y + 12, w, h, 34);
  c.fill();
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, "#fff4de");
  g.addColorStop(1, "#f6ddb6");
  c.fillStyle = g;
  roundRect(c, x, y, w, h, 34);
  c.fill();
  c.strokeStyle = C.red;
  c.lineWidth = 8;
  roundRect(c, x + 12, y + 12, w - 24, h - 24, 26);
  c.stroke();

  if (start) {
    shadowTxt(c, "LILY'S", DW / 2, y + 92, 46, C.red);
    shadowTxt(c, "ISLAND GRILL", DW / 2, y + 146, 46, C.red);
    txt(c, "— ARCADE RUSH —", DW / 2, y + 200, 25, "#a97542", "center", 800);
    icon(c, "steak", DW / 2 - 96, y + 274, 0.86);
    icon(c, "lobster", DW / 2 + 96, y + 274, 0.72);
    txt(c, `BEST  ${S.best}`, DW / 2, y + 348, 26, "#a97542", "center", 800);
  } else {
    shadowTxt(c, "Time's up!", DW / 2, y + 96, 56, C.red);
    txt(c, `You served ${S.served} order${S.served === 1 ? "" : "s"}`, DW / 2, y + 154, 26, "#8a5a34", "center", 700);
    txt(c, "SCORE", DW / 2, y + 226, 21, "#a97542", "center", 800);
    txt(c, String(S.score), DW / 2, y + 286, 72, "#c2410c");
    txt(
      c,
      S.newBest ? "★ NEW BEST ★" : `BEST  ${S.best}`,
      DW / 2,
      y + 348,
      25,
      S.newBest ? "#c98b0a" : "#a97542",
      "center",
      800,
    );
  }

  const b = POPUP_BTN;
  const bg = c.createLinearGradient(0, b.y, 0, b.y + b.h);
  bg.addColorStop(0, "#e2553d");
  bg.addColorStop(1, C.red);
  c.fillStyle = "rgba(0,0,0,0.25)";
  roundRect(c, b.x + 4, b.y + 7, b.w, b.h, 26);
  c.fill();
  c.fillStyle = bg;
  roundRect(c, b.x, b.y, b.w, b.h, 26);
  c.fill();
  txt(c, start ? "Start Cooking" : "Try Again", b.x + b.w / 2, b.y + b.h / 2 + 2, 34, C.cream);
  c.restore();
}

/* --------------------------------------------------------------------- scene */

export function render(c: Ctx, S: GameState, muted: boolean): void {
  const sh = S.overShake > 0 ? Math.sin(S.overShake * 40) * S.overShake * 16 : 0;
  c.save();
  c.translate(sh, sh * 0.4);

  drawBackdrop(c);
  drawPlants(c, S);
  drawRibs(c, S, 14, 92, 2, 150);
  drawRibs(c, S, 628, 706, 2, 150);

  drawFamily(c, S);
  drawHearts(c, S);
  drawOrderCard(c, S);

  drawGrillBody(c, S);
  drawFlamesBack(c, S);
  for (let i = 0; i < SLOTS; i++) {
    const it = S.grill[i];
    if (it && !it.tween) drawItem(c, it);
  }
  drawFlamesFront(c, S);

  drawPotBack(c, S);
  for (let i = 0; i < SLOTS; i++) {
    const it = S.pot[i];
    if (it && !it.tween) drawItem(c, it);
  }
  drawPotFront(c, S);

  drawLily(c, S);
  drawFridge(c, S);
  drawTray(c, S);
  for (const it of S.tray) if (!it.tween) drawItem(c, it);

  drawMeters(c, S);

  // everything mid-flight rides above the scene
  for (const it of S.tray) if (it.tween) drawItem(c, it);
  for (let i = 0; i < SLOTS; i++) {
    const g = S.grill[i];
    if (g && g.tween) drawItem(c, g);
    const p = S.pot[i];
    if (p && p.tween) drawItem(c, p);
  }
  for (const it of S.flying) drawItem(c, it);

  drawParticles(c, S);
  drawToast(c, S);
  drawHud(c, S, muted);
  if (S.phase === "tips") drawTips(c, S);
  drawPopup(c, S);
  c.restore();
}
