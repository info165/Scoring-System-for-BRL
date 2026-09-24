import React from 'react';

export type ArenaClockStatus = 'idle' | 'running' | 'stopped' | 'time_over';

interface ArenaClockProps {
  remaining: number;
  total: number;
  status: ArenaClockStatus;
  urgent: boolean;
  formatted: string;
}

const CENTER = 200;
const RING_RADIUS = 146;
const RING_STROKE = 16;
const TICK_INNER = 168;
const TICK_MINOR = 177;
const TICK_MAJOR = 187;

interface Theme {
  from: string;
  via: string;
  to: string;
  glow: string;
  digits: string;
  label: string;
  labelColor: string;
  labelBorder: string;
  labelBg: string;
}

// One colour story per state: steel while waiting, gold while the fight runs, red for the last
// ten seconds, ice-blue when the referee freezes the clock, deep red when time is up.
const THEMES: Record<'idle' | 'running' | 'urgent' | 'stopped' | 'time_over', Theme> = {
  idle: {
    from: '#f1f5f9', via: '#94a3b8', to: '#475569', glow: 'rgba(148,163,184,0.35)',
    digits: '#e2e8f0', label: 'READY TO FIGHT', labelColor: '#cbd5e1', labelBorder: 'rgba(148,163,184,0.45)', labelBg: 'rgba(51,65,85,0.45)'
  },
  running: {
    from: '#fef3c7', via: '#fbbf24', to: '#ea580c', glow: 'rgba(251,191,36,0.55)',
    digits: '#fde68a', label: 'COMBAT LIVE', labelColor: '#fcd34d', labelBorder: 'rgba(251,191,36,0.55)', labelBg: 'rgba(120,53,15,0.45)'
  },
  urgent: {
    from: '#ffe4e6', via: '#fb7185', to: '#be123c', glow: 'rgba(244,63,94,0.75)',
    digits: '#fecdd3', label: 'FINAL SECONDS', labelColor: '#fda4af', labelBorder: 'rgba(244,63,94,0.65)', labelBg: 'rgba(136,19,55,0.5)'
  },
  stopped: {
    from: '#cffafe', via: '#22d3ee', to: '#0284c7', glow: 'rgba(34,211,238,0.5)',
    digits: '#a5f3fc', label: 'CLOCK STOPPED', labelColor: '#67e8f9', labelBorder: 'rgba(34,211,238,0.55)', labelBg: 'rgba(8,51,68,0.5)'
  },
  time_over: {
    from: '#fecaca', via: '#ef4444', to: '#7f1d1d', glow: 'rgba(239,68,68,0.8)',
    digits: '#fecaca', label: 'TIME UP', labelColor: '#fca5a5', labelBorder: 'rgba(239,68,68,0.7)', labelBg: 'rgba(127,29,29,0.55)'
  }
};

export const ArenaClock: React.FC<ArenaClockProps> = ({ remaining, total, status, urgent, formatted }) => {
  const key = status === 'running' ? (urgent ? 'urgent' : 'running') : status;
  const theme = THEMES[key];
  const isRunning = status === 'running';
  const isOver = status === 'time_over';

  const safeTotal = Math.max(1, total);
  const clamped = Math.min(safeTotal, Math.max(0, remaining));
  const fraction = clamped / safeTotal;

  const circumference = 2 * Math.PI * RING_RADIUS;
  // At time up the whole ring lights up red as an alarm.
  const dashOffset = isOver ? 0 : circumference * (1 - fraction);

  // Leading edge of the arc: a small bright bead that travels round as the seconds fall away.
  const beadAngle = -Math.PI / 2 + fraction * 2 * Math.PI;
  const beadX = CENTER + RING_RADIUS * Math.cos(beadAngle);
  const beadY = CENTER + RING_RADIUS * Math.sin(beadAngle);
  const showBead = (isRunning || status === 'stopped') && fraction > 0 && fraction < 1;

  const ticks = Array.from({ length: safeTotal }, (_, i) => {
    const angle = (i / safeTotal) * 2 * Math.PI - Math.PI / 2;
    const major = i % 10 === 0;
    const outer = major ? TICK_MAJOR : TICK_MINOR;
    return {
      i,
      major,
      lit: i < clamped,
      x1: CENTER + TICK_INNER * Math.cos(angle),
      y1: CENTER + TICK_INNER * Math.sin(angle),
      x2: CENTER + outer * Math.cos(angle),
      y2: CENTER + outer * Math.sin(angle)
    };
  });

  return (
    <div className="relative mx-auto aspect-square w-[clamp(250px,22vw,390px)]" aria-label={`Time remaining ${formatted}`}>
      {/* Ambient halo behind the gauge */}
      <div
        className={`absolute -inset-[14%] rounded-full blur-3xl transition-all duration-700 ${isRunning || isOver ? 'animate-pulse' : ''}`}
        style={{ background: `radial-gradient(circle, ${theme.glow} 0%, transparent 62%)` }}
      />

      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full overflow-visible">
        <defs>
          <linearGradient id="arenaClockArc" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.from} />
            <stop offset="55%" stopColor={theme.via} />
            <stop offset="100%" stopColor={theme.to} />
          </linearGradient>
          <radialGradient id="arenaClockFace" cx="50%" cy="42%" r="65%">
            <stop offset="0%" stopColor="#111c33" />
            <stop offset="70%" stopColor="#060b18" />
            <stop offset="100%" stopColor="#020510" />
          </radialGradient>
          <filter id="arenaClockGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>

        {/* Bezel */}
        <circle cx={CENTER} cy={CENTER} r="197" fill="none" stroke="rgba(148,163,184,0.16)" strokeWidth="2" />
        <circle cx={CENTER} cy={CENTER} r="192" fill="url(#arenaClockFace)" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />

        {/* Slowly turning dashed outer band keeps the gauge alive while waiting */}
        <g className="origin-center [transform-box:fill-box] animate-[spin_60s_linear_infinite]">
          <circle cx={CENTER} cy={CENTER} r="160" fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="1" strokeDasharray="2 9" />
        </g>

        {/* One tick per second; each goes dark as its second is used up */}
        {ticks.map(t => (
          <line
            key={t.i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={t.lit ? theme.via : 'rgba(100,116,139,0.28)'}
            strokeWidth={t.major ? 3.2 : 1.6}
            strokeLinecap="round"
            opacity={t.lit ? (t.major ? 1 : 0.8) : 1}
            style={{ transition: 'stroke 0.4s ease' }}
          />
        ))}

        {/* Track */}
        <circle cx={CENTER} cy={CENTER} r={RING_RADIUS} fill="none" stroke="rgba(148,163,184,0.10)" strokeWidth={RING_STROKE} />

        {/* Neon glow under the arc */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RING_RADIUS}
          fill="none"
          stroke={theme.via}
          strokeWidth={RING_STROKE + 6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
          filter="url(#arenaClockGlow)"
          opacity={isRunning ? 0.75 : 0.5}
          className={isOver ? 'animate-pulse' : undefined}
          style={{ transition: 'stroke-dashoffset 0.3s linear, stroke 0.5s ease' }}
        />

        {/* The arc itself */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RING_RADIUS}
          fill="none"
          stroke="url(#arenaClockArc)"
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
          className={isOver ? 'animate-pulse' : undefined}
          style={{ transition: 'stroke-dashoffset 0.3s linear' }}
        />

        {showBead && (
          <>
            <circle cx={beadX} cy={beadY} r="13" fill={theme.via} opacity="0.35" filter="url(#arenaClockGlow)" />
            <circle cx={beadX} cy={beadY} r="6.5" fill="#ffffff" />
          </>
        )}

        {/* Inner ring */}
        <circle cx={CENTER} cy={CENTER} r="124" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
      </svg>

      {/* Digits */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-mono text-[clamp(0.6rem,0.85vw,0.85rem)] font-bold uppercase tracking-[0.4em] text-slate-400">
          Time Remaining
        </span>
        <span
          className={`mt-1 font-mono font-black leading-none tabular-nums ${isOver ? 'animate-pulse' : ''}`}
          style={{
            fontSize: 'clamp(2.4rem, 4.05vw, 4.7rem)',
            color: theme.digits,
            textShadow: `0 0 22px ${theme.glow}, 0 0 60px ${theme.glow}`,
            letterSpacing: '-0.02em'
          }}
        >
          {formatted}
        </span>
        <span
          className={`mt-3 rounded-full border px-4 py-1 font-display text-[clamp(0.6rem,0.85vw,0.9rem)] font-black uppercase tracking-[0.28em] ${urgent || isOver ? 'animate-pulse' : ''}`}
          style={{ color: theme.labelColor, borderColor: theme.labelBorder, background: theme.labelBg }}
        >
          {theme.label}
        </span>
      </div>
    </div>
  );
};
