/**
 * Bharat Robotics League 2026 - Arena Audio & Timer Engine
 * Synthesizes official arena sounds via Web Audio API without external asset dependencies.
 */

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxClass) return null;
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioCtxClass();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

/**
 * Ensures the Web Audio context is unlocked on user interaction
 */
export function unlockAudioContext(): void {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

/**
 * 1. ARENA START SOUND: Energetic dual-tone arena chime (D5 -> A5)
 */
export function playArenaStartSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // First Tone: 587.33 Hz (D5)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(587.33, now);
  gain1.gain.setValueAtTime(0, now);
  gain1.gain.linearRampToValueAtTime(0.35, now + 0.02);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.25);

  // Second Tone: 880 Hz (A5)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(880, now + 0.12);
  gain2.gain.setValueAtTime(0, now + 0.12);
  gain2.gain.linearRampToValueAtTime(0.45, now + 0.15);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.12);
  osc2.stop(now + 0.7);
}

/**
 * 2. 10-SECOND WARNING SOUND: Rapid double warning alert pulse (880 Hz)
 */
export function playTenSecondWarningSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Beep 1
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(880, now);
  gain1.gain.setValueAtTime(0, now);
  gain1.gain.linearRampToValueAtTime(0.4, now + 0.01);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.1);

  // Beep 2
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(880, now + 0.14);
  gain2.gain.setValueAtTime(0, now + 0.14);
  gain2.gain.linearRampToValueAtTime(0.4, now + 0.15);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.23);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.14);
  osc2.stop(now + 0.25);
}

/**
 * 3. TIME OVER SOUND: Stadium arena finishing buzzer (electric sports horn)
 */
export function playTimeOverBuzzerSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const duration = 1.35;

  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const masterGain = ctx.createGain();

  // Dual detuned sawtooth oscillators to create the industrial arena horn buzz
  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(146.83, now); // D3
  osc2.type = 'sawtooth';
  osc2.frequency.setValueAtTime(151.5, now); // slight chorus beat

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1100, now);
  filter.Q.setValueAtTime(3.5, now);

  masterGain.gain.setValueAtTime(0, now);
  masterGain.gain.linearRampToValueAtTime(0.55, now + 0.03);
  masterGain.gain.setValueAtTime(0.55, now + duration - 0.2);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(masterGain);
  masterGain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + duration);
  osc2.stop(now + duration);
}

/**
 * Rounds a number to exactly two decimal places using standard mathematical rounding.
 */
export function roundToTwoDecimals(val: number): number {
  return Math.round(((val || 0) + Number.EPSILON) * 100) / 100;
}

/**
 * Formats scores to exactly two decimal places (e.g., "170.50", "90.00", "0.00").
 */
export function formatScore(score: number | null | undefined): string {
  const rounded = roundToTwoDecimals(score ?? 0);
  return rounded.toFixed(2);
}

/**
 * Formats competition timer strictly as SECONDS.HUNDREDTHS with exactly two decimal places.
 * - 120.00 -> "120.00"
 * - 119.99 -> "119.99"
 * - 95.42  -> "95.42"
 * - 47.83  -> "47.83"
 * - 10.25  -> "10.25"
 * - 9.99   -> "9.99"
 * - 1.50   -> "1.50"
 * - 0.50   -> "0.50"
 * - 0.01   -> "0.01"
 * - 0.00   -> "0.00"
 * DO NOT display minutes (no 01:20). DO NOT display 4 or 6 decimal places.
 */
export function formatBrlTimer(seconds: number): string {
  const safe = Math.max(0, roundToTwoDecimals(seconds || 0));
  return safe.toFixed(2);
}
