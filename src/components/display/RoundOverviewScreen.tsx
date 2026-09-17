import React from 'react';
import { Layers, Swords, ShieldAlert, Clock, Trophy, Flame } from 'lucide-react';
import { useCompetition } from '../../context/CompetitionContext';
import { 
  OFFICIAL_BLOCK_WEIGHTS, 
  BLOCK_PUSH_CONFIG, 
  BLOCK_PULL_CONFIG, 
  ROBO_WAR_CONFIG 
} from '../../data/officialRules';

export const RoundOverviewScreen: React.FC = () => {
  const { state } = useCompetition();
  const currentRound = state.currentRound;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden font-sans select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-amber-500/10 rounded-full blur-[160px] pointer-events-none"></div>

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-3.5">
          <img src="/brl-logo.png" alt="BRL Logo" className="w-14 h-14 object-contain drop-shadow-[0_0_12px_rgba(245,158,11,0.35)]" />
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
            STAGE: ROUND {currentRound}
          </span>
          <span className="text-xs font-mono text-slate-400">29 SEPT 2026</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 my-auto py-8 max-w-6xl mx-auto w-full">
        {currentRound === 1 && (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <span className="text-blue-400 font-mono text-sm font-bold tracking-widest uppercase">
                EVENT 1 • BLUE THEME
              </span>
              <h2 className="text-4xl sm:text-6xl font-display font-black text-white">
                BLOCK PUSH CHALLENGE
              </h2>
              <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto">
                Push blocks across the arena floor into the designated scoring box within 120 seconds.
              </p>
            </div>

            {/* 6 Block Weights Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {OFFICIAL_BLOCK_WEIGHTS.map((weight) => (
                <div key={weight.id} className="bg-slate-900/80 border border-blue-500/30 rounded-2xl p-4 text-center">
                  <div className="text-2xl font-display font-black text-white mb-1">
                    {weight.label}
                  </div>
                  <div className="text-xs text-blue-400 font-bold font-mono">
                    100%: +{weight.fullPoints} pts
                  </div>
                  <div className="text-[11px] text-indigo-300 font-mono mt-0.5">
                    50%: +{weight.incompletePoints} pts
                  </div>
                </div>
              ))}
            </div>

            {/* Official Scoring Rules Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <span className="font-bold text-blue-400 uppercase tracking-wider block mb-1">
                  Complete Placement (100%):
                </span>
                <p>If block is completely inside the designated box, full points are awarded for that weight.</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <span className="font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                  Incomplete Placement (50%):
                </span>
                <p>If any portion of the block remains outside the designated box, 50% of points are awarded.</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <span className="font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                  Time Bonus:
                </span>
                <p>Total time 120s. Unused seconds award 1 bonus point per second (Time Bonus = Time Left).</p>
              </div>
            </div>
          </div>
        )}

        {currentRound === 2 && (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <span className="text-emerald-400 font-mono text-sm font-bold tracking-widest uppercase">
                EVENT 2 • GREEN THEME
              </span>
              <h2 className="text-4xl sm:text-6xl font-display font-black text-white">
                BLOCK PULL CHALLENGE
              </h2>
              <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto">
                Two-member team: Member 1 hooks block, Member 2 drives robot from Point A to the finish line within 120 seconds.
              </p>
            </div>

            {/* 6 Block Weights Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {OFFICIAL_BLOCK_WEIGHTS.map((weight) => (
                <div key={weight.id} className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-4 text-center">
                  <div className="text-2xl font-display font-black text-white mb-1">
                    {weight.label}
                  </div>
                  <div className="text-sm text-emerald-400 font-bold font-mono">
                    +{weight.fullPoints} PTS
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Past Finish Line
                  </div>
                </div>
              ))}
            </div>

            {/* Official Scoring Rules Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <span className="font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                  Block Pull Scoring:
                </span>
                <p>Each block successfully pulled across the finish line awards its official full points.</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <span className="font-bold text-teal-400 uppercase tracking-wider block mb-1">
                  Time Bonus:
                </span>
                <p>Total time 120s. Unused seconds award 1 bonus point per second (Time Bonus = Time Left).</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <span className="font-bold text-rose-400 uppercase tracking-wider block mb-1">
                  Boundary Penalty:
                </span>
                <p>Every time robot touches or crosses boundary line: 5 points deducted per touch.</p>
              </div>
            </div>
          </div>
        )}

        {currentRound === 3 && (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <span className="text-red-400 font-mono text-sm font-bold tracking-widest uppercase">
                EVENT 3 • RED THEME
              </span>
              <h2 className="text-4xl sm:text-6xl font-display font-black text-white flex items-center justify-center gap-3">
                <span>ROBO WAR COMBAT ARENA</span>
                <Flame className="w-10 h-10 text-amber-500" />
              </h2>
              <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto">
                Direct head-to-head robot combat. Total fight time 90 seconds. Winner takes all; loser receives 0 points. A draw awards {ROBO_WAR_CONFIG.drawPoints} points to each team.
              </p>
            </div>

            {/* Pit multipliers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <div className="bg-gradient-to-br from-red-950/60 to-slate-900 border-2 border-red-500/60 rounded-3xl p-6 text-center shadow-xl shadow-red-950/40">
                <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 font-mono font-bold text-xs border border-red-500/30">
                  SCORING ZONE 1
                </span>
                <h3 className="text-2xl font-display font-black text-white mt-2">IN-PIT</h3>
                <div className="text-3xl font-display font-black text-red-400 my-2">
                  Time Left × 3
                </div>
                <p className="text-xs text-slate-300">
                  Awarded to winner when opposing robot is pushed into the inner arena pit.
                </p>
              </div>

              <div className="bg-gradient-to-br from-orange-950/60 to-slate-900 border-2 border-orange-500/60 rounded-3xl p-6 text-center shadow-xl shadow-orange-950/40">
                <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 font-mono font-bold text-xs border border-orange-500/30">
                  SCORING ZONE 2
                </span>
                <h3 className="text-2xl font-display font-black text-white mt-2">OUT-PIT</h3>
                <div className="text-3xl font-display font-black text-orange-400 my-2">
                  Time Left × 2
                </div>
                <p className="text-xs text-slate-300">
                  Awarded to winner when opposing robot is pushed outside the arena perimeter.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto text-xs text-slate-400">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 text-center">
                <strong className="text-white">Winner Takes All:</strong> Only the winning team receives points. The losing team receives 0 points.
              </div>
              <div className="bg-amber-950/40 border border-amber-600/40 rounded-2xl p-5 text-center">
                <strong className="text-amber-300">Draw:</strong> If neither robot pushes the other into a pit, both teams receive {ROBO_WAR_CONFIG.drawPoints} points each.
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800 pt-4 flex items-center justify-between text-xs font-mono text-slate-400">
        <div>BHARAT ROBOTICS LEAGUE 2026 • OFFICIAL COMPETITION HANDBOOK</div>
        <div>AUTHORITATIVE BRL SCORING CRITERIA</div>
      </footer>
    </div>
  );
};
