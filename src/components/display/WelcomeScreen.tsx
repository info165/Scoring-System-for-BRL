import React from 'react';
import { Trophy, Swords, Zap, Shield, Sparkles, Flag } from 'lucide-react';
import { useCompetition } from '../../context/CompetitionContext';

export const WelcomeScreen: React.FC = () => {
  const { state } = useCompetition();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden font-sans select-none">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Top Header Bar */}
      <header className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-6">
        <div className="flex items-center space-x-4">
          <img src="/brl-logo.png" alt="BRL Logo" className="w-20 h-20 rounded-2xl shadow-xl shadow-amber-500/20 border border-amber-300/40 object-contain bg-black" />
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-lg font-display font-bold text-white tracking-wider">
              29 SEPTEMBER 2026
            </div>
          </div>
        </div>
      </header>

      {/* Hero Showcase Center */}
      <main className="relative z-10 my-auto py-4 text-center space-y-5 max-w-5xl mx-auto">

        {/* Sponsor Presents Bar */}
        <div className="flex flex-col items-center gap-2">
          <img src="/funscholar-logo.png" alt="Funscholar" className="h-8 sm:h-9 object-contain drop-shadow-[0_0_18px_rgba(249,115,22,0.35)]" />
          <div className="flex items-center gap-3 text-slate-400">
            <span className="h-px w-8 bg-slate-600"></span>
            <span className="text-[11px] sm:text-xs font-semibold tracking-[0.35em] uppercase">Presents</span>
            <span className="h-px w-8 bg-slate-600"></span>
          </div>
        </div>

        {/* Premium Tricolor Wordmark */}
        <div className="leading-none select-none py-1">
          <div
            className="font-display font-black text-5xl sm:text-6xl lg:text-7xl tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-orange-300 to-orange-600 drop-shadow-[0_0_30px_rgba(249,115,22,0.45)]"
          >
            BHARAT
          </div>
          <div className="font-display font-black text-5xl sm:text-6xl lg:text-7xl tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-300 drop-shadow-[0_0_30px_rgba(226,232,240,0.35)] flex items-center justify-center">
            <span>ROB</span>
            <img
              src="/brl-chakra.png"
              alt=""
              className="inline-block h-[0.78em] w-[0.78em] mx-0.5 rounded-full align-middle drop-shadow-[0_0_18px_rgba(37,99,235,0.6)] animate-[spin_6s_linear_infinite]"
            />
            <span>TICS</span>
          </div>
          <div className="font-display font-black text-5xl sm:text-6xl lg:text-7xl tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-emerald-300 to-green-600 drop-shadow-[0_0_30px_rgba(34,197,94,0.45)]">
            LEAGUE
          </div>
        </div>

        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-semibold tracking-wide shadow-lg">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>NATIONAL INTER-SCHOOL ROBOTICS CHAMPIONSHIP</span>
        </div>

        {/* 3 Challenge Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-left">
          {/* Round 1 Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur-md">
            <div className="text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider mb-2">
              ROUND 01
            </div>
            <h3 className="text-xl font-display font-bold text-white mb-2">
              Block Push Challenge
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Targeted mass displacement into high-value concentric zones with autonomous precision bonuses.
            </p>
          </div>

          {/* Round 2 Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur-md">
            <div className="text-amber-400 font-mono text-xs font-bold uppercase tracking-wider mb-2">
              ROUND 02
            </div>
            <h3 className="text-xl font-display font-bold text-white mb-2">
              Block Pull Challenge
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              High-torque friction towing across lane tracks up to 4.0 kg maximum resistance payload tiers.
            </p>
          </div>

          {/* Round 3 Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur-md">
            <div className="text-rose-400 font-mono text-xs font-bold uppercase tracking-wider mb-2">
              ROUND 03
            </div>
            <h3 className="text-xl font-display font-bold text-white mb-2">
              Combat Robot War
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Head-to-head tactical arena combat. Points awarded for knockouts, ring-outs, and judges decisions.
            </p>
          </div>
        </div>
      </main>

      {/* Footer Ticker / Status */}
      <footer className="relative z-10 border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
        <div className="flex items-center space-x-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <span>COMPETITION STATUS: <strong className="text-white uppercase">{state.status.replace('_', ' ')}</strong></span>
          <span>•</span>
          <span>REGISTERED TEAMS: <strong className="text-cyan-300">{state.schools.filter(s => s.isActive).length}</strong></span>
        </div>

        <div className="text-slate-400 flex items-center space-x-2">
          <span>POWERED BY OFFICIAL BRL TOURNAMENT ENGINE 2026</span>
        </div>
      </footer>
    </div>
  );
};
