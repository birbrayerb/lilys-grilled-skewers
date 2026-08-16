import {
  BOARD,
  C,
  COUNTER,
  DH,
  DW,
  FAMILY,
  FLOOR_Y,
  FRIDGE,
  GRILL,
  P,
  POT,
  clamp01,
  easeOut,
  lerp,
  mixHex,
  rnd,
  roundRect,
  type Rect,
} from "./layout.ts";
import type { GameState, Item } from "./state.ts";

const FONT = `"Avenir Next Rounded", "Avenir Next", ui-rounded, "Trebuchet MS", system-ui, sans-serif`;

export const POPUP_BTN: Rect = { x: 202, y: 782, w: 316, h: 104 };
export const MUTE_BTN: Rect = { x: 636, y: 20, w: 60, h: 60 };

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

/* ------------------------------------------------------------------ backdrop */

function drawBackdrop(c: Ctx): void {
  // Upper wall: warm painted wood planks, running vertically.
  const wallTop = -520;
  const g = c.createLinearGradient(0, wallTop, 0, FLOOR_Y);
  g.addColorStop(0, C.wallShade);
  g.addColorStop(0.28, C.wallDark);
  g.addColorStop(0.75, C.wallPlank);
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
    // grain
    c.fillStyle = "rgba(60,26,12,0.16)";
    for (let k = 0; k < 5; k++) {
      const gy = 40 + rnd(i * 7 + k) * (FLOOR_Y - 60);
      c.fillRect(x + 8 + rnd(i + k * 2) * 20, gy, 2, 60 + rnd(i * k + 1) * 120);
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
  fg.addColorStop(0.35, C.floor);
  fg.addColorStop(1, C.floorDark);
  c.fillStyle = fg;
  c.fillRect(-520, FLOOR_Y, DW + 1040, DH + 520 - FLOOR_Y);
  c.fillStyle = "rgba(0,0,0,0.35)";
  c.fillRect(-520, FLOOR_Y, DW + 1040, 8);
  for (let i = 0; i < 9; i++) {
    const y = FLOOR_Y + 26 + i * 52;
    c.fillStyle = "rgba(0,0,0,0.13)";
    c.fillRect(-520, y, DW + 1040, 3);
  }
  for (let i = -4; i < 10; i++) {
    c.fillStyle = "rgba(0,0,0,0.10)";
    c.fillRect(i * 96, FLOOR_Y, 3, DH + 520 - FLOOR_Y);
  }

  // Warm lamp pool over the cooking station.
  const lamp = c.createRadialGradient(400, 420, 40, 400, 520, 640);
  lamp.addColorStop(0, "rgba(255,175,80,0.22)");
  lamp.addColorStop(1, "rgba(255,150,60,0)");
  c.fillStyle = lamp;
  c.fillRect(-520, -520, DW + 1040, DH + 1040);
}

/** Strips of dried pipikaula hanging on hooks over the grill — the signature detail. */
function drawHangingRibs(c: Ctx, S: GameState): void {
  const rodY = 244;
  const x0 = 236;
  const x1 = 508;
  c.fillStyle = "#2a2320";
  roundRect(c, x0 - 16, rodY - 5, x1 - x0 + 32, 10, 5);
  c.fill();
  c.fillStyle = "rgba(255,220,170,0.25)";
  roundRect(c, x0 - 16, rodY - 5, x1 - x0 + 32, 3, 2);
  c.fill();

  for (let i = 0; i < 6; i++) {
    const x = x0 + 14 + i * ((x1 - x0 - 28) / 5);
    const h = 62 + rnd(i * 5) * 40;
    const sway = Math.sin(S.t * 0.9 + i * 0.7) * 3.5;
    c.save();
    c.translate(x, rodY);
    c.rotate(sway * 0.006);
    // hook
    c.strokeStyle = "#b9c0c6";
    c.lineWidth = 3;
    c.beginPath();
    c.arc(0, 4, 6, Math.PI, 0);
    c.stroke();
    // dried rib strip
    const w = 20 + rnd(i * 11) * 10;
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
  // split fronds
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
  // top-right monstera cluster
  leaf(c, 726, 214, 150, Math.PI * 0.86, C.greenDark, sway);
  leaf(c, 730, 268, 132, Math.PI * 0.98, C.green, -sway);
  leaf(c, 722, 176, 118, Math.PI * 0.74, C.greenLight, sway * 1.4);
  leaf(c, 728, 322, 104, Math.PI * 1.1, C.greenDark, -sway * 1.2);
  // little sprig at the far-left top
  leaf(c, -6, 214, 96, Math.PI * 0.06, C.greenDark, -sway);
  leaf(c, -6, 254, 82, Math.PI * -0.1, C.green, sway);
}

/* -------------------------------------------------------------------- fridge */

function drawFridge(c: Ctx, S: GameState): void {
  const F = FRIDGE;
  c.fillStyle = "rgba(0,0,0,0.35)";
  roundRect(c, F.x + 10, F.y + 16, F.w, F.h, 22);
  c.fill();

  // interior cavity
  const inx = F.x + 12;
  const iny = F.y + 14;
  const inw = F.w - 24;
  const inh = F.h - 28;
  const cav = c.createLinearGradient(inx, iny, inx + inw, iny + inh);
  cav.addColorStop(0, "#20262c");
  cav.addColorStop(1, "#141a1f");
  c.fillStyle = cav;
  roundRect(c, inx, iny, inw, inh, 12);
  c.fill();

  if (S.fridge > 0.02) {
    c.save();
    roundRect(c, inx, iny, inw, inh, 12);
    c.clip();
    const glow = c.createLinearGradient(inx, iny, inx, iny + inh);
    glow.addColorStop(0, `rgba(190,225,255,${0.22 * S.fridge})`);
    glow.addColorStop(1, `rgba(120,170,210,${0.05 * S.fridge})`);
    c.fillStyle = glow;
    c.fillRect(inx, iny, inw, inh);
    // shelves
    c.fillStyle = `rgba(200,220,235,${0.5 * S.fridge})`;
    for (const sy of [496, 630, 760]) {
      roundRect(c, inx + 8, sy, inw - 16, 7, 3);
      c.fill();
    }
    // a few background groceries so it feels stocked
    c.fillStyle = `rgba(120,180,120,${0.55 * S.fridge})`;
    roundRect(c, inx + 20, 690, 34, 64, 8);
    c.fill();
    c.fillStyle = `rgba(230,190,90,${0.55 * S.fridge})`;
    roundRect(c, inx + 66, 700, 30, 54, 7);
    c.fill();
    c.fillStyle = `rgba(210,120,140,${0.5 * S.fridge})`;
    roundRect(c, inx + 108, 694, 40, 60, 9);
    c.fill();
    c.restore();
  }
}

/** Door is drawn after the fridge contents so it can swing over them. */
function drawFridgeDoor(c: Ctx, S: GameState): void {
  const F = FRIDGE;
  const open = S.fridge;
  const sx = lerp(1, 0.16, easeOut(open));
  c.save();
  c.translate(F.x, 0);
  c.scale(sx, 1);
  const body = c.createLinearGradient(0, F.y, F.w, F.y);
  body.addColorStop(0, "#f6ead2");
  body.addColorStop(0.45, "#efdcbd");
  body.addColorStop(1, "#d8bf9b");
  c.fillStyle = body;
  roundRect(c, 0, F.y, F.w, F.h, 22);
  c.fill();
  c.strokeStyle = "rgba(90,50,25,0.55)";
  c.lineWidth = 5;
  c.stroke();
  // divider between freezer and fridge
  c.fillStyle = "rgba(120,70,40,0.35)";
  c.fillRect(6, F.y + 172, F.w - 12, 6);
  // wooden trim + chrome handle
  c.fillStyle = C.woodDark;
  roundRect(c, F.w - 44, F.y + 200, 16, 190, 8);
  c.fill();
  c.fillStyle = C.wood;
  roundRect(c, F.w - 44, F.y + 200, 16, 178, 8);
  c.fill();
  c.fillStyle = "#c9d2d8";
  roundRect(c, F.w - 46, F.y + 44, 14, 96, 7);
  c.fill();
  // cute magnet
  c.fillStyle = C.red;
  c.beginPath();
  c.arc(46, F.y + 96, 15, 0, Math.PI * 2);
  c.fill();
  txt(c, "L", 46, F.y + 97, 20, C.cream);
  c.restore();

  // door edge highlight so the open door still reads as a door
  if (open > 0.02) {
    c.fillStyle = "rgba(0,0,0,0.35)";
    c.fillRect(F.x + F.w * sx - 4, F.y, 6, F.h);
  }
}

/* ------------------------------------------------------------------- counter */

function drawCounter(c: Ctx): void {
  const K = COUNTER;
  // wooden slab top
  const slab = c.createLinearGradient(0, K.y - 4, 0, K.y + 26);
  slab.addColorStop(0, C.woodLight);
  slab.addColorStop(1, C.woodDark);
  c.fillStyle = slab;
  roundRect(c, K.x - 12, K.y - 6, K.w + 24, 32, 8);
  c.fill();
  c.fillStyle = "rgba(255,225,180,0.22)";
  c.fillRect(K.x - 10, K.y - 4, K.w + 20, 4);

  // deep-red tiled apron
  const ap = c.createLinearGradient(0, K.y + 24, 0, FLOOR_Y);
  ap.addColorStop(0, C.red);
  ap.addColorStop(1, C.redDeep);
  c.fillStyle = ap;
  c.fillRect(K.x - 12, K.y + 24, K.w + 24, FLOOR_Y - (K.y + 24));
  c.strokeStyle = "rgba(0,0,0,0.22)";
  c.lineWidth = 2;
  for (let i = 1; i < 6; i++) {
    const x = K.x - 12 + (i * (K.w + 24)) / 6;
    c.beginPath();
    c.moveTo(x, K.y + 24);
    c.lineTo(x, FLOOR_Y);
    c.stroke();
  }
  c.beginPath();
  c.moveTo(K.x - 12, K.y + 92);
  c.lineTo(K.x + K.w + 12, K.y + 92);
  c.stroke();

  txt(c, "LILY'S  ISLAND  GRILL", K.x + K.w / 2 + 6, K.y + 58, 25, "rgba(0,0,0,0.35)", "center", 800);
  txt(c, "LILY'S  ISLAND  GRILL", K.x + K.w / 2 + 4, K.y + 55, 25, C.cream, "center", 800);
  c.fillStyle = "rgba(0,0,0,0.3)";
  c.fillRect(K.x - 12, FLOOR_Y - 10, K.w + 24, 10);
}

/* --------------------------------------------------------------------- grill */

function drawCoals(c: Ctx, S: GameState): void {
  const g = GRILL;
  const heat = S.ignite;
  c.save();
  roundRect(c, g.x + 4, 456, g.w - 8, 76, 8);
  c.clip();
  c.fillStyle = "#0d0b0a";
  c.fillRect(g.x, 450, g.w, 90);
  for (let i = 0; i < 40; i++) {
    const cx = g.x + 12 + rnd(i * 2.3) * (g.w - 24);
    const cy = 462 + rnd(i * 5.7) * 62;
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
    const gl = c.createRadialGradient(g.x + g.w / 2, 496, 10, g.x + g.w / 2, 496, g.w * 0.62);
    gl.addColorStop(0, `rgba(255,120,20,${0.55 * heat})`);
    gl.addColorStop(1, "rgba(255,80,0,0)");
    c.fillStyle = gl;
    c.fillRect(g.x, 440, g.w, 110);
  }
  c.restore();
}

function drawGrate(c: Ctx): void {
  const g = GRILL;
  const x0 = g.x + 2;
  const w = g.w - 4;
  for (let i = 0; i < 5; i++) {
    const y = 458 + i * 14;
    const bar = c.createLinearGradient(0, y, 0, y + 8);
    bar.addColorStop(0, "#b9c0c6");
    bar.addColorStop(0.4, "#767e85");
    bar.addColorStop(1, "#33383d");
    c.fillStyle = bar;
    roundRect(c, x0, y, w, 8, 4);
    c.fill();
  }
  // side rails
  c.fillStyle = "#4a5157";
  roundRect(c, x0 - 8, 452, 12, 92, 6);
  c.fill();
  roundRect(c, x0 + w - 4, 452, 12, 92, 6);
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
    c.bezierCurveTo(
      x - ww * 0.62,
      baseY - hh * 0.42,
      x - ww * 0.3 + wob * 0.6,
      baseY - hh * 0.74,
      x + wob,
      baseY - hh,
    );
    c.bezierCurveTo(
      x + ww * 0.3 + wob * 0.6,
      baseY - hh * 0.74,
      x + ww * 0.62,
      baseY - hh * 0.42,
      x + ww / 2,
      baseY,
    );
    c.closePath();
    c.fill();
  }
  c.globalAlpha = 1;
}

/** Tall tongues that rise behind whatever is on the grate. */
export function drawFlamesBack(c: Ctx, S: GameState): void {
  if (S.ignite <= 0.02) return;
  const g = GRILL;
  c.save();
  c.globalCompositeOperation = "lighter";
  const n = 7;
  for (let i = 0; i < n; i++) {
    const x = g.x + 22 + (i * (g.w - 44)) / (n - 1);
    const breathe = 0.68 + 0.32 * Math.sin(S.t * 3.1 + i * 1.9);
    const h = (66 + rnd(i * 3.3) * 58) * S.ignite * breathe;
    const w = 28 + rnd(i * 7.7) * 16;
    flameTongue(c, x, 498 - rnd(i) * 14, w, h, S.t, i);
  }
  const bloom = c.createRadialGradient(g.x + g.w / 2, 448, 8, g.x + g.w / 2, 448, 200 * S.ignite);
  bloom.addColorStop(0, `rgba(255,140,30,${0.28 * S.ignite})`);
  bloom.addColorStop(1, "rgba(255,90,0,0)");
  c.fillStyle = bloom;
  c.fillRect(g.x - 120, 260, g.w + 240, 300);
  c.restore();
}

/** Short tongues that lick over the front edge of the food. */
export function drawFlamesFront(c: Ctx, S: GameState): void {
  if (S.ignite <= 0.02) return;
  const g = GRILL;
  c.save();
  c.globalCompositeOperation = "lighter";
  c.globalAlpha = 0.85;
  for (let i = 0; i < 5; i++) {
    const x = g.x + 30 + (i * (g.w - 60)) / 4;
    const breathe = 0.6 + 0.4 * Math.sin(S.t * 4.3 + i * 2.6);
    const h = (30 + rnd(i * 9.1) * 26) * S.ignite * breathe;
    flameTongue(c, x, 516, 22 + rnd(i * 4.4) * 12, h, S.t * 1.2, i + 11);
  }
  c.restore();
}

function drawGrillBody(c: Ctx, S: GameState): void {
  const g = GRILL;
  c.fillStyle = "rgba(0,0,0,0.4)";
  roundRect(c, g.x - 6, 690, g.w + 12, 18, 8);
  c.fill();

  // back lip
  c.fillStyle = "#191614";
  roundRect(c, g.x - 12, 436, g.w + 24, 26, 8);
  c.fill();

  drawCoals(c, S);
  drawGrate(c);

  // front lip
  const lip = c.createLinearGradient(0, 528, 0, 556);
  lip.addColorStop(0, "#43494e");
  lip.addColorStop(1, "#15120f");
  c.fillStyle = lip;
  roundRect(c, g.x - 14, 528, g.w + 28, 30, 9);
  c.fill();
  c.fillStyle = "rgba(255,220,170,0.22)";
  roundRect(c, g.x - 12, 530, g.w + 24, 4, 2);
  c.fill();

  // firebox front
  const box = c.createLinearGradient(0, 556, 0, 700);
  box.addColorStop(0, "#2b2523");
  box.addColorStop(0.5, C.black2);
  box.addColorStop(1, C.black);
  c.fillStyle = box;
  roundRect(c, g.x - 6, 552, g.w + 12, 150, 12);
  c.fill();

  // ember seam glowing through the fire door
  if (S.ignite > 0.05) {
    c.save();
    c.globalCompositeOperation = "lighter";
    const seam = c.createLinearGradient(0, 568, 0, 600);
    seam.addColorStop(0, `rgba(255,120,20,${0.85 * S.ignite})`);
    seam.addColorStop(1, "rgba(255,60,0,0)");
    c.fillStyle = seam;
    roundRect(c, g.x + 22, 568, g.w - 44, 30, 8);
    c.fill();
    c.restore();
  }

  // vent slots
  c.fillStyle = "rgba(0,0,0,0.75)";
  for (let i = 0; i < 4; i++) {
    roundRect(c, g.x + 30 + i * 54, 632, 34, 12, 6);
    c.fill();
  }
  c.fillStyle = `rgba(255,140,40,${0.5 * S.ignite})`;
  for (let i = 0; i < 4; i++) {
    roundRect(c, g.x + 32 + i * 54, 634, 30, 6, 3);
    c.fill();
  }

  // wooden handle rail
  c.fillStyle = C.woodDark;
  roundRect(c, g.x - 18, 662, g.w + 36, 16, 8);
  c.fill();
  c.fillStyle = C.wood;
  roundRect(c, g.x - 18, 662, g.w + 36, 10, 5);
  c.fill();
}

/* ----------------------------------------------------------------------- pot */

function drawPotBack(c: Ctx, S: GameState): void {
  const p = POT;
  const cx = p.x + p.w / 2;
  // burner
  c.fillStyle = "#2c2724";
  roundRect(c, p.x + 12, 690, p.w - 24, 14, 7);
  c.fill();

  // body
  const body = c.createLinearGradient(p.x, 0, p.x + p.w, 0);
  body.addColorStop(0, "#42484e");
  body.addColorStop(0.35, "#8f979e");
  body.addColorStop(0.7, "#5d656c");
  body.addColorStop(1, "#33383d");
  c.fillStyle = body;
  c.beginPath();
  c.moveTo(p.x + 4, p.y + 8);
  c.lineTo(p.x + p.w - 4, p.y + 8);
  c.lineTo(p.x + p.w - 12, p.y + p.h);
  c.lineTo(p.x + 12, p.y + p.h);
  c.closePath();
  c.fill();

  // water surface
  const wob = Math.sin(S.t * 4) * 1.6;
  const water = c.createLinearGradient(0, p.y + 4, 0, p.y + 46);
  water.addColorStop(0, "#cfe6ef");
  water.addColorStop(1, "#6d94a6");
  c.fillStyle = water;
  c.beginPath();
  c.ellipse(cx, p.y + 16 + wob * 0.3, p.w / 2 - 10, 15, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "rgba(255,255,255,0.35)";
  c.beginPath();
  c.ellipse(cx - 18, p.y + 12 + wob * 0.4, 18, 5, 0, 0, Math.PI * 2);
  c.fill();
}

function drawPotFront(c: Ctx, S: GameState): void {
  const p = POT;
  const cx = p.x + p.w / 2;
  // rim
  const rim = c.createLinearGradient(0, p.y - 4, 0, p.y + 18);
  rim.addColorStop(0, "#b6bec5");
  rim.addColorStop(1, "#4b5258");
  c.fillStyle = rim;
  c.beginPath();
  c.ellipse(cx, p.y + 8, p.w / 2, 20, 0, 0, Math.PI * 2);
  c.ellipse(cx, p.y + 12, p.w / 2 - 11, 14, 0, 0, Math.PI * 2);
  c.fill("evenodd");

  // handles
  c.strokeStyle = "#3a4046";
  c.lineWidth = 9;
  c.beginPath();
  c.arc(p.x + 2, p.y + 44, 15, Math.PI * 0.4, Math.PI * 1.6);
  c.stroke();
  c.beginPath();
  c.arc(p.x + p.w - 2, p.y + 44, 15, Math.PI * 1.4, Math.PI * 0.6);
  c.stroke();

  // front sheen
  c.fillStyle = "rgba(255,255,255,0.14)";
  c.beginPath();
  c.moveTo(p.x + 22, p.y + 26);
  c.lineTo(p.x + 40, p.y + 26);
  c.lineTo(p.x + 34, p.y + p.h - 6);
  c.lineTo(p.x + 22, p.y + p.h - 6);
  c.closePath();
  c.fill();

  if (S.potBoil > 0.05) {
    c.save();
    c.globalCompositeOperation = "lighter";
    const gl = c.createRadialGradient(cx, p.y + 20, 4, cx, p.y + 20, 90);
    gl.addColorStop(0, `rgba(180,230,255,${0.14 * S.potBoil})`);
    gl.addColorStop(1, "rgba(180,230,255,0)");
    c.fillStyle = gl;
    c.fillRect(p.x - 60, p.y - 60, p.w + 120, p.h + 100);
    c.restore();
  }
}

/* ------------------------------------------------------------- prep / serving board */

function drawBoard(c: Ctx, S: GameState): void {
  const b = BOARD;
  c.fillStyle = "rgba(0,0,0,0.32)";
  roundRect(c, b.x + 6, b.y + b.h + 96, b.w, 16, 8);
  c.fill();
  // legs
  c.fillStyle = C.woodDark;
  roundRect(c, b.x + 16, b.y + 26, 14, 96, 6);
  c.fill();
  roundRect(c, b.x + b.w - 30, b.y + 26, 14, 96, 6);
  c.fill();
  // top
  const t = c.createLinearGradient(0, b.y, 0, b.y + b.h);
  t.addColorStop(0, C.woodLight);
  t.addColorStop(1, C.woodDark);
  c.fillStyle = t;
  roundRect(c, b.x, b.y, b.w, b.h, 9);
  c.fill();
  c.fillStyle = "rgba(255,230,190,0.2)";
  roundRect(c, b.x + 3, b.y + 3, b.w - 6, 5, 3);
  c.fill();

  // empty-slot hints
  const slots = [P.slotA, P.slotB];
  const occupied = [S.steak, S.lobster].filter((i) => i.place === "slot").length;
  c.setLineDash([7, 8]);
  c.lineWidth = 3;
  for (let i = occupied; i < 2; i++) {
    c.strokeStyle = "rgba(255,220,170,0.22)";
    c.beginPath();
    c.arc(slots[i].x, slots[i].y + 8, 27, 0, Math.PI * 2);
    c.stroke();
  }
  c.setLineDash([]);
}

/* ---------------------------------------------------------------------- Lily */

function drawLily(c: Ctx, S: GameState): void {
  const cx = 84;
  const bob = Math.sin(S.t * 2) * 3 + S.lilyBob;
  const cheer = S.step === "CELEBRATE" ? Math.abs(Math.sin(S.t * 6)) * 10 : 0;
  const y = 1256 - bob - cheer;

  c.fillStyle = "rgba(0,0,0,0.3)";
  c.beginPath();
  c.ellipse(cx, 1260, 52, 12, 0, 0, Math.PI * 2);
  c.fill();

  // legs
  c.fillStyle = "#3b4a63";
  roundRect(c, cx - 26, y - 96, 20, 96, 9);
  c.fill();
  roundRect(c, cx + 6, y - 96, 20, 96, 9);
  c.fill();
  c.fillStyle = "#2a2320";
  roundRect(c, cx - 32, y - 14, 30, 16, 7);
  c.fill();
  roundRect(c, cx + 4, y - 14, 30, 16, 7);
  c.fill();

  // dress + apron
  const dress = c.createLinearGradient(0, y - 210, 0, y - 90);
  dress.addColorStop(0, "#e2555f");
  dress.addColorStop(1, "#a82f3d");
  c.fillStyle = dress;
  c.beginPath();
  c.moveTo(cx - 34, y - 206);
  c.lineTo(cx + 34, y - 206);
  c.lineTo(cx + 46, y - 88);
  c.lineTo(cx - 46, y - 88);
  c.closePath();
  c.fill();
  c.fillStyle = C.apron;
  c.beginPath();
  c.moveTo(cx - 22, y - 194);
  c.lineTo(cx + 22, y - 194);
  c.lineTo(cx + 30, y - 92);
  c.lineTo(cx - 30, y - 92);
  c.closePath();
  c.fill();
  c.fillStyle = "rgba(255,255,255,0.5)";
  roundRect(c, cx - 12, y - 150, 24, 22, 5);
  c.fill();

  // arms — the near arm lifts while she is carrying or cheering
  const lift = S.step === "CELEBRATE" ? -34 : S.busy > 0 ? -22 : 0;
  c.strokeStyle = C.skin;
  c.lineWidth = 15;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(cx - 30, y - 188);
  c.lineTo(cx - 52, y - 140 + lift);
  c.stroke();
  c.beginPath();
  c.moveTo(cx + 30, y - 188);
  c.lineTo(cx + 54, y - 142 + lift);
  c.stroke();

  // head
  c.fillStyle = C.hair;
  c.beginPath();
  c.arc(cx, y - 244, 44, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = C.skin;
  c.beginPath();
  c.arc(cx, y - 240, 37, 0, Math.PI * 2);
  c.fill();
  // fringe
  c.fillStyle = C.hair;
  c.beginPath();
  c.arc(cx, y - 252, 37, Math.PI * 1.06, Math.PI * 1.94);
  c.fill();
  // pigtails
  c.beginPath();
  c.arc(cx - 44, y - 232, 15, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.arc(cx + 44, y - 232, 15, 0, Math.PI * 2);
  c.fill();

  // face
  c.fillStyle = "#2a1c14";
  const blink = Math.sin(S.t * 1.3) > 0.985 ? 1 : 0;
  if (blink) {
    c.lineWidth = 3;
    c.strokeStyle = "#2a1c14";
    c.beginPath();
    c.moveTo(cx - 18, y - 240);
    c.lineTo(cx - 8, y - 240);
    c.moveTo(cx + 8, y - 240);
    c.lineTo(cx + 18, y - 240);
    c.stroke();
  } else {
    c.beginPath();
    c.arc(cx - 13, y - 242, 4.6, 0, Math.PI * 2);
    c.arc(cx + 13, y - 242, 4.6, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = "rgba(255,140,150,0.5)";
  c.beginPath();
  c.arc(cx - 24, y - 230, 8, 0, Math.PI * 2);
  c.arc(cx + 24, y - 230, 8, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = "#2a1c14";
  c.lineWidth = 3.4;
  c.beginPath();
  c.arc(cx, y - 232, 13, 0.18 * Math.PI, 0.82 * Math.PI);
  c.stroke();

  // chef hat
  c.fillStyle = "#fffaf0";
  c.beginPath();
  c.arc(cx - 22, y - 296, 19, 0, Math.PI * 2);
  c.arc(cx + 22, y - 296, 19, 0, Math.PI * 2);
  c.arc(cx, y - 308, 22, 0, Math.PI * 2);
  c.fill();
  roundRect(c, cx - 32, y - 292, 64, 22, 8);
  c.fill();
  c.fillStyle = "rgba(0,0,0,0.07)";
  roundRect(c, cx - 32, y - 278, 64, 8, 4);
  c.fill();
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
  const bounce = happy > 0 ? Math.abs(Math.sin(t * 5 + seed)) * 9 * happy : Math.sin(t * 1.4 + seed) * 2;
  c.save();
  c.translate(cx, baseY - bounce);
  c.scale(scale, scale);

  // body
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

  // arms up when happy
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

  // head
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

  // face
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
  const smile = 12 + happy * 6;
  c.arc(0, -112, smile, 0.16 * Math.PI, 0.84 * Math.PI);
  c.stroke();
  c.restore();
}

function drawFamily(c: Ctx, S: GameState): void {
  const happy = clamp01(S.celebrate);
  familyMember(c, 400, 1112, 0.86, "#3f7fa8", "#3d241a", happy, S.t, 0);
  familyMember(c, 596, 1112, 0.86, "#2f7d4f", "#241812", happy, S.t, 2.1);
  familyMember(c, 500, 1122, 0.62, "#e2a33c", "#5a3a22", happy, S.t, 4.2);

  // table
  const F = FAMILY;
  c.fillStyle = "rgba(0,0,0,0.32)";
  roundRect(c, F.x + 18, 1250, F.w - 36, 16, 8);
  c.fill();
  c.fillStyle = C.woodDark;
  roundRect(c, F.x + 34, 1146, 18, 112, 6);
  c.fill();
  roundRect(c, F.x + F.w - 52, 1146, 18, 112, 6);
  c.fill();
  const t = c.createLinearGradient(0, 1104, 0, 1150);
  t.addColorStop(0, C.woodLight);
  t.addColorStop(1, C.woodDark);
  c.fillStyle = t;
  roundRect(c, F.x, 1104, F.w, 46, 10);
  c.fill();
  c.fillStyle = "rgba(255,230,190,0.22)";
  roundRect(c, F.x + 4, 1108, F.w - 8, 6, 3);
  c.fill();

  // plates
  for (const px of [P.steakTable.x, P.lobsterTable.x]) {
    c.fillStyle = "rgba(255,248,235,0.9)";
    c.beginPath();
    c.ellipse(px, 1118, 44, 12, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "rgba(0,0,0,0.10)";
    c.beginPath();
    c.ellipse(px, 1118, 30, 7, 0, 0, Math.PI * 2);
    c.fill();
  }
}

/* --------------------------------------------------------------------- items */

export function drawSteak(c: Ctx, it: Item): void {
  const s = it.scale * (1 + it.pop * 0.22);
  c.save();
  c.translate(it.x, it.y);
  c.rotate(it.rot);
  c.scale(s, s);

  if (it.cook >= 1) {
    c.save();
    c.globalCompositeOperation = "lighter";
    const gl = c.createRadialGradient(0, 0, 4, 0, 0, 70);
    gl.addColorStop(0, "rgba(255,200,90,0.4)");
    gl.addColorStop(1, "rgba(255,180,60,0)");
    c.fillStyle = gl;
    c.fillRect(-80, -80, 160, 160);
    c.restore();
  }

  // skewer
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

  // fat cap
  c.fillStyle = mixHex("#f2ddc0", "#d8b98c", clamp01(it.cook));
  c.beginPath();
  c.moveTo(-44, -6);
  c.bezierCurveTo(-48, -30, -18, -34, 6, -30);
  c.lineTo(2, -21);
  c.bezierCurveTo(-16, -25, -39, -22, -36, -6);
  c.closePath();
  c.fill();

  // grill marks appear as it cooks; angle flips with the meat
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

  // sheen
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
  // palm
  c.fillStyle = col;
  c.beginPath();
  c.ellipse(0, 0, 15, 20, 0, 0, Math.PI * 2);
  c.fill();
  // fixed finger
  c.beginPath();
  c.moveTo(-12, -10);
  c.quadraticCurveTo(-18, -34, -3, -31);
  c.quadraticCurveTo(-4, -20, -3, -9);
  c.closePath();
  c.fill();
  // movable finger — the gap between the two is the pincer
  c.beginPath();
  c.moveTo(5, -13);
  c.quadraticCurveTo(17, -33, 15, -12);
  c.quadraticCurveTo(12, -4, 6, -4);
  c.closePath();
  c.fill();
  // highlight
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

  if (it.cook >= 1) {
    c.save();
    c.globalCompositeOperation = "lighter";
    const gl = c.createRadialGradient(0, 0, 4, 0, 0, 78);
    gl.addColorStop(0, "rgba(255,140,90,0.42)");
    gl.addColorStop(1, "rgba(255,120,60,0)");
    c.fillStyle = gl;
    c.fillRect(-92, -92, 184, 184);
    c.restore();
  }

  // short antennae
  c.strokeStyle = dark;
  c.lineWidth = 2.6;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(-5, -42);
  c.quadraticCurveTo(-16, -56, -24, -58);
  c.moveTo(5, -42);
  c.quadraticCurveTo(16, -56, 24, -58);
  c.stroke();

  // walking legs
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

  // tail segments, then the fan
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

  // arms + claws
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

  // carapace
  c.fillStyle = col;
  c.beginPath();
  c.ellipse(0, -24, 19, 21, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = lite;
  c.beginPath();
  c.ellipse(-6, -31, 7, 9, -0.4, 0, Math.PI * 2);
  c.fill();

  // eyes
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
        c.translate(p.x, p.y);
        c.scale(p.size / 12, p.size / 12);
        c.fillStyle = "#ff5f7e";
        c.beginPath();
        c.moveTo(0, 5);
        c.bezierCurveTo(-12, -5, -7, -15, 0, -8);
        c.bezierCurveTo(7, -15, 12, -5, 0, 5);
        c.closePath();
        c.fill();
        break;
      }
    }
    c.restore();
  }
}

/* ----------------------------------------------------------------------- HUD */

function cookMeter(c: Ctx, x: number, y: number, v: number, label: string, warn: boolean, t: number): void {
  const w = 132;
  const h = 20;
  c.fillStyle = "rgba(0,0,0,0.55)";
  roundRect(c, x - w / 2 - 3, y - h / 2 - 3, w + 6, h + 6, 13);
  c.fill();
  c.fillStyle = "rgba(255,240,220,0.18)";
  roundRect(c, x - w / 2, y - h / 2, w, h, 10);
  c.fill();
  const g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  g.addColorStop(0, "#ffd166");
  g.addColorStop(0.6, "#ff9d2e");
  g.addColorStop(1, "#ff5f2e");
  c.fillStyle = g;
  roundRect(c, x - w / 2, y - h / 2, Math.max(6, w * clamp01(v)), h, 10);
  c.fill();
  if (warn) {
    const pulse = 0.6 + 0.4 * Math.sin(t * 8);
    c.strokeStyle = `rgba(255,255,255,${pulse})`;
    c.lineWidth = 3;
    roundRect(c, x - w / 2, y - h / 2, w, h, 10);
    c.stroke();
  }
  shadowTxt(c, label, x, y - 26, 21, warn ? "#fff2c2" : C.cream);
}

function drawHintSign(c: Ctx, text: string, t: number): void {
  const x = 44;
  const w = DW - 88;
  const y = 100;
  const h = 70;
  // ropes
  c.strokeStyle = "rgba(30,15,8,0.7)";
  c.lineWidth = 4;
  c.beginPath();
  c.moveTo(x + 40, y - 26);
  c.lineTo(x + 58, y + 4);
  c.moveTo(x + w - 40, y - 26);
  c.lineTo(x + w - 58, y + 4);
  c.stroke();

  c.fillStyle = "rgba(0,0,0,0.4)";
  roundRect(c, x + 4, y + 6, w, h, 16);
  c.fill();
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, "#a5522c");
  g.addColorStop(1, "#7a3a1e");
  c.fillStyle = g;
  roundRect(c, x, y, w, h, 16);
  c.fill();
  c.strokeStyle = C.gold;
  c.lineWidth = 3;
  roundRect(c, x + 6, y + 6, w - 12, h - 12, 11);
  c.stroke();

  const wob = Math.sin(t * 3) * 0.6;
  let size = 27;
  c.font = `800 ${size}px ${FONT}`;
  while (c.measureText(text).width > w - 40 && size > 16) {
    size -= 1;
    c.font = `800 ${size}px ${FONT}`;
  }
  shadowTxt(c, text, x + w / 2, y + h / 2 + wob, size, C.cream);
}

function drawHud(c: Ctx, S: GameState, muted: boolean): void {
  const g = c.createLinearGradient(0, 0, 0, 96);
  g.addColorStop(0, "rgba(20,9,4,0.92)");
  g.addColorStop(1, "rgba(20,9,4,0)");
  c.fillStyle = g;
  c.fillRect(-40, -40, DW + 80, 136);

  shadowTxt(c, "SCORE", 30, 34, 17, "rgba(255,220,170,0.75)", "left");
  shadowTxt(c, String(S.score), 30, 62, 30, C.gold, "left");
  shadowTxt(c, "BEST", 596, 34, 17, "rgba(255,220,170,0.75)", "right");
  shadowTxt(c, String(S.best), 596, 62, 30, C.cream, "right");

  // mute toggle
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

function drawRing(c: Ctx, S: GameState): void {
  if (!S.ring) return;
  const r = S.ring;
  const pulse = 0.5 + 0.5 * Math.sin(S.t * 4.2);
  const grow = pulse * 8;
  c.save();
  c.strokeStyle = `rgba(255,205,110,${0.35 + pulse * 0.45})`;
  c.lineWidth = 5;
  c.setLineDash([16, 12]);
  c.lineDashOffset = -S.t * 34;
  roundRect(c, r.x - grow, r.y - grow, r.w + grow * 2, r.h + grow * 2, 22);
  c.stroke();
  c.setLineDash([]);
  c.restore();
}

function drawNudge(c: Ctx, S: GameState): void {
  if (!S.nudge) return;
  const a = Math.min(clamp01(S.nudge.t * 5), clamp01((2 - S.nudge.t) * 3));
  const rise = (1 - clamp01(S.nudge.t / 1.8)) * 10;
  c.save();
  c.globalAlpha = a;
  const y = 236 + rise;
  c.font = `800 25px ${FONT}`;
  const w = Math.min(DW - 60, c.measureText(S.nudge.text).width + 56);
  const x = DW / 2 - w / 2;
  c.fillStyle = "rgba(255,240,214,0.97)";
  roundRect(c, x, y, w, 62, 22);
  c.fill();
  c.beginPath();
  c.moveTo(DW / 2 - 12, y);
  c.lineTo(DW / 2, y - 14);
  c.lineTo(DW / 2 + 12, y);
  c.closePath();
  c.fill();
  txt(c, S.nudge.text, DW / 2, y + 33, 25, "#8a3a12");
  c.restore();
}

function drawToast(c: Ctx, S: GameState): void {
  if (!S.toast) return;
  const k = clamp01(S.toast.t / 1.1);
  c.save();
  c.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : Math.min(1, k * 4);
  const y = 640 - (1 - k) * 34;
  shadowTxt(c, S.toast.text, DW / 2, y, 44, C.gold);
  c.restore();
}

function drawPopup(c: Ctx, S: GameState): void {
  if (S.popup <= 0.001) return;
  const k = easeOut(clamp01(S.popup));
  c.save();
  c.globalAlpha = k * 0.72;
  c.fillStyle = "#160a05";
  c.fillRect(-60, -60, DW + 120, DH + 120);
  c.globalAlpha = 1;

  const w = 560;
  const h = 470;
  const x = DW / 2 - w / 2;
  const y = 400;
  c.translate(DW / 2, y + h / 2);
  c.scale(0.72 + k * 0.28, 0.72 + k * 0.28);
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

  shadowTxt(c, "Delicious!", DW / 2, y + 92, 58, C.red);
  txt(c, "The family loved it ♡", DW / 2, y + 146, 24, "#8a5a34", "center", 700);
  txt(c, "SCORE", DW / 2, y + 210, 21, "#a97542", "center", 800);
  txt(c, String(S.score), DW / 2, y + 262, 62, "#c2410c");
  txt(
    c,
    S.score >= S.best ? "★ NEW BEST ★" : `BEST  ${S.best}`,
    DW / 2,
    y + 314,
    23,
    S.score >= S.best ? "#c98b0a" : "#a97542",
    "center",
    800,
  );

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
  txt(c, "Cook Again", b.x + b.w / 2, b.y + b.h / 2 + 2, 34, C.cream);
  c.restore();
}

/* --------------------------------------------------------------------- scene */

export function render(c: Ctx, S: GameState, hint: string, muted: boolean): void {
  drawBackdrop(c);
  drawPlants(c, S);
  drawHangingRibs(c, S);

  drawFridge(c, S);
  if (S.steak.place === "fridge") drawSteak(c, S.steak);
  if (S.lobster.place === "fridge") drawLobster(c, S.lobster);
  drawFridgeDoor(c, S);

  drawCounter(c);
  drawGrillBody(c, S);
  drawFlamesBack(c, S);
  if (S.steak.place === "station") drawSteak(c, S.steak);
  drawFlamesFront(c, S);

  drawPotBack(c, S);
  if (S.lobster.place === "station") drawLobster(c, S.lobster);
  drawPotFront(c, S);

  drawBoard(c, S);
  drawLily(c, S);
  drawFamily(c, S);

  if (S.steak.place === "table") drawSteak(c, S.steak);
  if (S.lobster.place === "table") drawLobster(c, S.lobster);

  drawParticles(c, S);
  drawRing(c, S);

  // in-flight and on-the-board items ride above the scene
  if (S.steak.place === "slot") drawSteak(c, S.steak);
  if (S.lobster.place === "slot") drawLobster(c, S.lobster);

  // cook meters
  if (S.steak.place === "station" && S.steak.cook < 1) {
    cookMeter(
      c,
      P.steakGrill.x,
      396,
      S.steak.cook,
      S.awaitingFlip ? "TAP TO FLIP!" : "cooking…",
      S.awaitingFlip,
      S.t,
    );
  }
  if (S.lobster.place === "station" && S.lobster.cook < 1) {
    cookMeter(c, P.lobsterPot.x, 552, S.lobster.cook, "boiling…", false, S.t);
  }

  drawHintSign(c, hint, S.t);
  drawToast(c, S);
  drawNudge(c, S);
  drawHud(c, S, muted);
  drawPopup(c, S);
}
