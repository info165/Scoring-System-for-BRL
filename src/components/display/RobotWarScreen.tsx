import React from 'react';
import { Swords, Flame, Trophy, ShieldAlert, Zap } from 'lucide-react';
import { useCompetition } from '../../context/CompetitionContext';

export const RobotWarScreen: React.FC = () => {
  const { state, activeRobotWarMatch } = useCompetition();

  const teamASchool = state.schools.find(s => s.id === activeRobotWarMatch?.teamAId);
  const teamBSchool = state.schools.find(s => s.id === activeRobotWarMatch?.teamBId);

  const isCompleted = activeRobotWarMatch?.status === 'completed';
  const isTeamAWinner = activeRobotWarMatch?.result === 'team_a_win';
  const isTeamBWinner = activeRobotWarMatch?.result === 'team_b_win';
  const isDraw = activeRobotWarMatch?.result === 'draw';

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden font-sans select-none">
      {/* Background glow flares */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[160px] pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-[160px] pointer-events-none"></div>

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-5">
        <div className="flex items-center space-x-3.5">
          <img src="/brl-logo.png" alt="BRL Logo" className="w-14 h-14 object-contain drop-shadow-[0_0_12px_rgba(225,29,72,0.35)]" />
          <div>
            <div className="text-xs font-bold text-rose-400 tracking-wider font-display flex items-center gap-1.5 uppercase">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              <span>COMBAT ARENA • ROUND 3</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-bold tracking-wide">
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-orange-300 to-orange-600">BHARAT</span>{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-300">ROBOTICS</span>{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-emerald-300 to-green-600">LEAGUE</span>{' '}
              <span className="text-white">2026 ROBOT WAR</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="px-3.5 py-1.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold uppercase">
            {activeRobotWarMatch ? `MATCH #${activeRobotWarMatch.matchNumber}` : 'ARENA BATTLE'}
          </span>
          <span className="text-xs font-mono text-slate-400">29 SEPT 2026</span>
        </div>
      </header>

      {/* Main Face-Off Arena Screen */}
      <main className="relative z-10 my-auto py-6 max-w-7xl mx-auto w-full">
        {activeRobotWarMatch && teamASchool && teamBSchool ? (
          <div className="space-y-6">
            
            {/* Match Status Banner */}
            <div className="text-center">
              {isCompleted ? (
                <div className="inline-flex items-center space-x-2 px-5 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-display font-bold text-sm tracking-wider uppercase shadow-xl animate-bounce">
                  <Trophy className="w-4 h-4 text-emerald-400" />
                  <span>MATCH COMPLETED • RESULT OFFICIALLY VERIFIED</span>
                </div>
              ) : (
                <div className="inline-flex items-center space-x-2 px-5 py-2 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 font-display font-bold text-sm tracking-wider uppercase">
                  <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>ARENA COMBAT IN PROGRESS</span>
                </div>
              )}
            </div>

            {/* Split Arena Card */}
            <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-stretch">
              
              {/* Team A Corner (Cyan) */}
              <div 
                className={`lg:col-span-5 p-8 rounded-3xl border-2 transition-all duration-500 flex flex-col justify-between ${
                  isTeamAWinner
                    ? 'bg-gradient-to-b from-cyan-950/80 via-slate-900 to-cyan-950/90 border-cyan-400 shadow-2xl shadow-cyan-950/80 scale-[1.02]'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold uppercase">
                      BLUE CORNER • {teamASchool.teamNumber}
                    </span>
                    {isTeamAWinner && (
                      <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-display font-black tracking-wider uppercase">
                        WINNER
                      </span>
                    )}
                    {isDraw && (
                      <span className="px-3 py-1 rounded-full bg-slate-700 text-slate-100 text-xs font-display font-black tracking-wider uppercase">
                        DRAW
                      </span>
                    )}
                  </div>

                  <h2 className="text-3xl sm:text-4xl font-display font-black text-white leading-tight">
                    {teamASchool.name}
                  </h2>
                  <div className="text-xl font-bold text-cyan-400 mt-2">
                    {teamASchool.teamName}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{teamASchool.city}</div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">WAR POINTS AWARDED:</span>
                  <span className="font-display font-black text-4xl text-cyan-300 font-mono">
                    {activeRobotWarMatch.teamAPoints} <span className="text-sm font-normal text-slate-400">PTS</span>
                  </span>
                </div>
              </div>

              {/* Center VS Nexus */}
              <div className="lg:col-span-1 flex flex-col items-center justify-center my-4 lg:my-0">
                <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-rose-500/60 flex items-center justify-center text-rose-400 font-display font-black text-xl shadow-2xl shadow-rose-950/60">
                  VS
                </div>
                {activeRobotWarMatch.winType && isCompleted && (
                  <span className="text-[11px] font-mono font-bold text-slate-400 mt-3 text-center uppercase tracking-wider">
                    {activeRobotWarMatch.winType.replace('_', ' ')}
                  </span>
                )}
              </div>

              {/* Team B Corner (Rose) */}
              <div 
                className={`lg:col-span-5 p-8 rounded-3xl border-2 transition-all duration-500 flex flex-col justify-between ${
                  isTeamBWinner
                    ? 'bg-gradient-to-b from-rose-950/80 via-slate-900 to-rose-950/90 border-rose-400 shadow-2xl shadow-rose-950/80 scale-[1.02]'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold uppercase">
                      RED CORNER • {teamBSchool.teamNumber}
                    </span>
                    {isTeamBWinner && (
                      <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-display font-black tracking-wider uppercase">
                        WINNER
                      </span>
                    )}
                    {isDraw && (
                      <span className="px-3 py-1 rounded-full bg-slate-700 text-slate-100 text-xs font-display font-black tracking-wider uppercase">
                        DRAW
                      </span>
                    )}
                  </div>

                  <h2 className="text-3xl sm:text-4xl font-display font-black text-white leading-tight">
                    {teamBSchool.name}
                  </h2>
                  <div className="text-xl font-bold text-rose-400 mt-2">
                    {teamBSchool.teamName}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{teamBSchool.city}</div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">WAR POINTS AWARDED:</span>
                  <span className="font-display font-black text-4xl text-rose-300 font-mono">
                    {activeRobotWarMatch.teamBPoints} <span className="text-sm font-normal text-slate-400">PTS</span>
                  </span>
                </div>
              </div>

            </div>

            {/* Match Classification Details */}
            {activeRobotWarMatch.matchNotes && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-center text-xs text-slate-300 max-w-xl mx-auto">
                <span className="text-slate-400 font-mono">REFEREE / BOUT NOTE:</span> {activeRobotWarMatch.matchNotes}
              </div>
            )}

          </div>
        ) : (
          <div className="text-center py-20 space-y-4">
            <Swords className="w-16 h-16 mx-auto text-slate-700" />
            <h2 className="text-2xl font-display font-bold text-white">
              Next Combat Bout Staging
            </h2>
            <p className="text-slate-400 text-sm">Arena technicians are inspecting combatants.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 pt-4 flex items-center justify-between text-xs font-mono text-slate-400">
        <div>BHARAT ROBOTICS LEAGUE 2026 • COMBAT ROBOT WAR ARENA</div>
        <div>OFFICIAL KNOCKOUT & DECISION SCORING</div>
      </footer>
    </div>
  );
};
