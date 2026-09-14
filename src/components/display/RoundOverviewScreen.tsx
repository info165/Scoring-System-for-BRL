import React from 'react';
import { Layers, Anchor, Swords, CheckCircle, Trophy, Clock } from 'lucide-react';
import { useCompetition } from '../../context/CompetitionContext';
import { 
  OFFICIAL_BLOCK_PUSH_TIERS, 
  OFFICIAL_BLOCK_PULL_TIERS, 
  OFFICIAL_ROBOT_WAR_RULES 
} from '../../data/officialRules';

export const RoundOverviewScreen: React.FC = () => {
  const { state, leaderboard } = useCompetition();
  const currentRound = state.currentRound;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden font-sans select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-amber-500/10 rounded-full blur-[160px] pointer-events-none"></div>

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-display font-black text-xl shadow-lg shadow-amber-500/20">
            BRL
          </div>
          <div>
            <span className="text-xs font-bold text-amber-400 tracking-wider font-display">
              BHARAT ROBOTICS LEAGUE 2026
            </span>
            <h1 className="text-2xl font-display font-bold text-white">
              Official Round Objectives & Scoring Rules
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
            ACTIVE STAGE: ROUND {currentRound}
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 my-auto py-8 max-w-6xl mx-auto w-full">
        {currentRound === 1 && (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <span className="text-cyan-400 font-mono text-sm font-bold tracking-widest uppercase">
                STAGE ONE
              </span>
              <h2 className="text-4xl sm:text-6xl font-display font-black text-white">
                BLOCK PUSH CHALLENGE
              </h2>
              <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto">
                Robots must maneuver and deposit designated mass categories into scored target zones under time limits.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {OFFICIAL_BLOCK_PUSH_TIERS.map((tier) => (
                <div key={tier.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between text-cyan-400 font-mono text-xs font-bold mb-2">
                    <span>{tier.weightRange}</span>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-200">
                      {tier.basePoints} PTS
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{tier.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{tier.description}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-xs text-slate-300">
              <div>
                <span className="font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                  Target Zone Multipliers:
                </span>
                <p>Outer Ring (1.0x) • Intermediate Ring (1.5x) • Central Bullseye (2.0x)</p>
              </div>
              <div>
                <span className="font-bold text-amber-400 uppercase tracking-wider block mb-1">
                  Autonomous & Speed Bonuses:
                </span>
                <p>Clean Autonomous Navigation (+20 pts) • Sub-60s Completion (+15 pts)</p>
              </div>
            </div>
          </div>
        )}

        {currentRound === 2 && (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <span className="text-amber-400 font-mono text-sm font-bold tracking-widest uppercase">
                STAGE TWO
              </span>
              <h2 className="text-4xl sm:text-6xl font-display font-black text-white">
                BLOCK PULL CHALLENGE
              </h2>
              <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto">
                High-torque friction drag competition across arena tracks with tiered sled loads.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {OFFICIAL_BLOCK_PULL_TIERS.map((tier) => (
                <div key={tier.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 text-center">
                  <div className="text-2xl font-mono font-black text-amber-400 mb-1">
                    {tier.weight}
                  </div>
                  <div className="text-xs font-bold text-white truncate">{tier.name}</div>
                  <div className="mt-3 inline-block px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-xs">
                    {tier.basePoints} PTS
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-xs text-slate-300">
              <div>
                <span className="font-bold text-amber-400 uppercase tracking-wider block mb-1">
                  Distance Multipliers:
                </span>
                <p>100% Full Track (1.0x) • 75% Distance (0.75x) • 50% Distance (0.50x)</p>
              </div>
              <div>
                <span className="font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                  Special Traction Bonuses:
                </span>
                <p>Sub-45s High-Speed Run (+25 pts) • Zero Wheel Slip (+15 pts)</p>
              </div>
            </div>
          </div>
        )}

        {currentRound === 3 && (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <span className="text-rose-400 font-mono text-sm font-bold tracking-widest uppercase">
                FINAL STAGE
              </span>
              <h2 className="text-4xl sm:text-6xl font-display font-black text-white">
                ROBOT WAR COMBAT ARENA
              </h2>
              <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto">
                Head-to-head robot battles. Machines clash until knockout, pit out, or judicial evaluation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-slate-900/80 border border-rose-900/50 rounded-2xl p-6">
                <div className="text-rose-400 font-mono text-xs font-bold uppercase mb-1">
                  DECISIVE KNOCKOUT
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Arena Knockout / Ring Out</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Disabling or pushing opponent robot out of the combat ring.
                </p>
                <div className="font-mono text-sm text-emerald-400 font-bold">
                  Winner: 100 PTS • Loser: 20 PTS
                </div>
              </div>

              <div className="bg-slate-900/80 border border-amber-900/50 rounded-2xl p-6">
                <div className="text-amber-400 font-mono text-xs font-bold uppercase mb-1">
                  END OF TIME LIMIT
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Judges Decision</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Evaluation on aggression, damage inflicted, and arena control.
                </p>
                <div className="font-mono text-sm text-amber-300 font-bold">
                  Winner: 75 PTS • Loser: 35 PTS
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
                <div className="text-slate-400 font-mono text-xs font-bold uppercase mb-1">
                  STALEMATE
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Technical Draw</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Mutual entanglement or equal performance scored by judges.
                </p>
                <div className="font-mono text-sm text-cyan-300 font-bold">
                  Team A: 50 PTS • Team B: 50 PTS
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800 pt-5 flex items-center justify-between text-xs font-mono text-slate-400">
        <div>BHARAT ROBOTICS LEAGUE 2026 • OFFICIAL RULEBOOK</div>
        <div>29 SEPTEMBER 2026</div>
      </footer>
    </div>
  );
};
