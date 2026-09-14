import React from 'react';
import { Trophy, Swords, Zap, Shield, Sparkles, Flag } from 'lucide-react';
import { useCompetition } from '../../context/CompetitionContext';

export const WelcomeScreen: React.FC = () => {
  const { state } = useCompetition();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden font-sans select-none">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Top Header Bar */}
      <header className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-display font-black text-2xl shadow-xl shadow-amber-500/20 border border-amber-300">
            BRL
          </div>
          <div>
            <div className="text-sm font-bold text-amber-400 tracking-widest uppercase flex items-center gap-2 font-display">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>LIVE COMPETITION ARENA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black tracking-wide text-white">
              BHARAT ROBOTICS LEAGUE 2026
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-xs text-slate-400 font-mono">OFFICIAL EVENT DATE</div>
            <div className="text-lg font-display font-bold text-white tracking-wider">
              29 SEPTEMBER 2026
            </div>
          </div>
          <div className="px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-cyan-300">
            brl.org.in
          </div>
        </div>
      </header>

      {/* Hero Showcase Center */}
      <main className="relative z-10 my-auto py-8 text-center space-y-8 max-w-5xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-semibold tracking-wide shadow-lg">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>NATIONAL INTER-SCHOOL ROBOTICS CHAMPIONSHIP</span>
        </div>

        <h2 className="text-4xl sm:text-6xl lg:text-7xl font-display font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-amber-200">
          ENGINEERING THE FUTURE OF AUTONOMY
        </h2>

        <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
          Schools across the nation compete across three elite engineering disciplines: Precision Block Push, Heavy Sled Block Pull, and the Combat Robot War Arena.
        </p>

        {/* 3 Challenge Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 text-left">
          {/* Round 1 Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
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
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
            <div className="text-amber-400 font-mono text-xs font-bold uppercase tracking-wider mb-2">
              ROUND 02
            </div>
            <h3 className="text-xl font-display font-bold text-white mb-2">
              Block Pull Sled
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              High-torque friction towing across lane tracks up to 5.0 kg maximum resistance payload tiers.
            </p>
          </div>

          {/* Round 3 Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
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
