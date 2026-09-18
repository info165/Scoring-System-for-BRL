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
 * Formats seconds left strictly to the BRL Official Match Specification:
 * - 120s -> "01:20"
 * - 119s -> "01:19"
 * - 100s -> "01:00"
 * - 47s  -> "00:47"
 * - 10s  -> "00:10"
 * - 0s   -> "00:00"
 */
export function formatBrlTimer(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds || 0));
  if (s >= 100) {
    const rem = s - 100;
    return `01:${rem < 10 ? '0' : ''}${rem}`;
  }
  return `00:${s < 10 ? '0' : ''}${s}`;
}
