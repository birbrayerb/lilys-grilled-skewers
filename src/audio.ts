/**
 * Tiny synthesized SFX kit — Web Audio only, zero assets.
 * Everything is created lazily on the first user gesture so iOS Safari unlocks it.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let muted = false;

export function unlockAudio(): void {
  if (ctx) {
    if (ctx.state === "suspended") void ctx.resume();
    return;
  }
  const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
  if (!Ctor) return;
  ctx = new Ctor();
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);

  // 2s of white noise, reused by every sizzle / whoosh / bubble burst.
  const len = ctx.sampleRate * 2;
  noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

  if (ctx.state === "suspended") void ctx.resume();
}

export function setMuted(m: boolean): void {
  muted = m;
  if (master && ctx) master.gain.setTargetAtTime(m ? 0 : 0.5, ctx.currentTime, 0.05);
}

export function isMuted(): boolean {
  return muted;
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType,
  gain: number,
  delay = 0,
  endFreq?: number,
): void {
  if (!ctx || !master) return;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (endFreq !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function noise(dur: number, gain: number, freq: number, q: number, delay = 0, endFreq?: number): void {
  if (!ctx || !master || !noiseBuf) return;
  const t = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(freq, t);
  if (endFreq !== undefined) bp.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), t + dur);
  bp.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.05, dur * 0.3));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(bp).connect(g).connect(master);
  src.start(t);
  src.stop(t + dur + 0.05);
}

/** Soft wooden thunk — fridge door, placing things down. */
export function sfxThunk(): void {
  tone(150, 0.18, "sine", 0.35, 0, 70);
  noise(0.12, 0.12, 400, 1.2);
}

/** Bright pickup blip. */
export function sfxPickup(): void {
  tone(660, 0.1, "triangle", 0.22);
  tone(990, 0.14, "triangle", 0.16, 0.06);
}

/** Charcoal catching — a rising whoosh. */
export function sfxWhoosh(): void {
  noise(0.9, 0.3, 220, 0.8, 0, 1800);
  tone(90, 0.7, "sawtooth", 0.1, 0, 40);
}

/** One crackle of the sizzle bed; called repeatedly while meat cooks. */
export function sfxSizzle(intensity = 1): void {
  noise(0.16 + Math.random() * 0.14, 0.075 * intensity, 2400 + Math.random() * 2600, 0.9);
}

/** One water bubble popping. */
export function sfxBubble(): void {
  const f = 320 + Math.random() * 380;
  tone(f, 0.1, "sine", 0.11, 0, f * 2.4);
}

/** Little wet slap for the flip. */
export function sfxFlip(): void {
  noise(0.22, 0.22, 1100, 0.7, 0, 3200);
  tone(300, 0.12, "sine", 0.16, 0, 520);
}

/** Two-tone "it's ready" bell. */
export function sfxDing(): void {
  tone(1046, 0.5, "sine", 0.24);
  tone(1568, 0.65, "sine", 0.17, 0.08);
}

/** Happy little arpeggio when the family is fed. */
export function sfxCheer(): void {
  const notes = [523, 659, 784, 1046, 1318];
  notes.forEach((n, i) => tone(n, 0.42, "triangle", 0.2, i * 0.09));
  notes.forEach((n, i) => tone(n * 2, 0.3, "sine", 0.07, i * 0.09 + 0.02));
}

/** Gentle "not yet" nudge — warm, never harsh. */
export function sfxNudge(): void {
  tone(520, 0.12, "sine", 0.14);
  tone(392, 0.18, "sine", 0.12, 0.1);
}

export function sfxSparkle(): void {
  tone(1400 + Math.random() * 900, 0.22, "sine", 0.08);
}
