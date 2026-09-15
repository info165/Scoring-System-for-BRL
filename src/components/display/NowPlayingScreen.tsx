import React from 'react';
import { 
  Play, 
  Clock, 
  Trophy, 
  Sparkles, 
  CheckCircle, 
  Layers, 
  ShieldAlert,
  ArrowRight,
  Zap,
  Check
} from 'lucide-react';
import { useCompetition } from '../../context/CompetitionContext';

export const NowPlayingScreen: React.FC = () => {
  const { 
    state, 
    currentSchool, 
    upNextSchool, 
    followingSchool, 
    leaderboard 
  } = useCompetition();

  const currentScoreRecord = currentSchool ? state.scores[currentSchool.id] : null;
  const currentRound = state.currentRound;

  // Published score for current round
  const round1Data = currentScoreRecord?.round1;
  const round2Data = currentScoreRecord?.round2;
  const round3Score = currentScoreRecord?.round3Score || 0;

  const currentRoundScore = currentRound === 1 
    ? (!round1Data?.isDraft ? round1Data?.finalScore : null)
    : currentRound === 2 
      ? (!round2Data?.isDraft ? round2Data?.finalScore : null)
      : round3Score;

  // Find team's overall rank on leaderboard
  const teamLeaderboardEntry = currentSchool 
    ? leaderboard.find(e => e.school.id === currentSchool.id)
    : null;

  const getThemeColor = () => {
    if (currentRound === 1) return { border: 'border-blue-500/60', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
    if (currentRound === 2) return { border: 'border-emerald-500/60', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    return { border: 'border-red-500/60', text: 'text-red-400', badge: 'bg-red-500/20 text-red-300 border-red-500/30' };
  };

  const theme = getThemeColor();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden font-sans select-none">
      {/* Dynamic Arena Glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[160px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[160px] pointer-events-none"></div>

      {/* Top Header Bar */}
      <header className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-5">
        <div className="flex items-center space-x-3.5">
          <img src="/brl-logo.png" alt="BRL Logo" className="w-12 h-12 rounded-xl shadow-lg shadow-amber-500/20 object-contain bg-black" />
          <div>
            <div className="text-xs font-bold text-amber-400 tracking-wider font-display flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>LIVE ARENA RUN • BHARAT ROBOTICS LEAGUE 2026</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-white tracking-wide">
              {currentRound === 1 && 'Round 1: Block Push Challenge (Blue)'}
              {currentRound === 2 && 'Round 2: Block Pull Challenge (Green)'}
              {currentRound === 3 && 'Round 3: Robo War Arena Combat (Red)'}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-[11px] font-mono text-slate-400">ARENA DATE</div>
            <div className="text-sm font-display font-bold text-slate-200">29 SEPT 2026</div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold font-mono">
            LIVE ARENA
          </span>
        </div>
      </header>

      {/* Main Stage Presentation Center */}
      <main className="relative z-10 my-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-7xl mx-auto w-full">
        
        {/* Left 8 Cols: NOW PLAYING HERO SPOTLIGHT */}
        <div className={`lg:col-span-8 bg-gradient-to-br from-slate-900 via-[#0e1731] to-slate-900 border-2 ${theme.border} rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden`}>
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest border border-emerald-500/40">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>NOW PLAYING IN ARENA</span>
            </span>

            {teamLeaderboardEntry && (
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {teamLeaderboardEntry.isTied ? `T-RANK #${teamLeaderboardEntry.rank} [TIED]` : `OVERALL RANK #${teamLeaderboardEntry.rank}`} ({teamLeaderboardEntry.totalScore} PTS)
              </span>
            )}
          </div>

          {currentSchool ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl sm:text-5xl font-display font-black text-white tracking-tight leading-none">
                  {currentSchool.name}
                </h2>
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <span className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 font-mono font-bold text-sm border border-blue-500/30">
                    {currentSchool.teamNumber}
                  </span>
                  <span className="text-xl font-bold text-amber-400">
                    {currentSchool.teamName}
                  </span>
                  <span className="text-slate-400 font-medium text-sm">• {currentSchool.city}</span>
                </div>
              </div>

              {currentSchool.students && currentSchool.students.length > 0 && (
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300">
                  <span className="text-slate-400 font-mono block text-[11px] mb-1">
                    STUDENT OPERATORS & PILOTS:
                  </span>
                  <span className="font-semibold text-white">
                    {currentSchool.students.join(' • ')}
                  </span>
                </div>
              )}

              {/* Live Run Score Display */}
              <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Official Round Score Status */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                    ROUND {currentRound} OFFICIAL POINTS
                  </span>
                  <div className="my-2">
                    {currentRoundScore !== null && currentRoundScore !== undefined ? (
                      <div className="text-5xl font-display font-black text-amber-400 tracking-tight">
                        {currentRoundScore}
                        <span className="text-base font-normal text-slate-400 ml-2">PTS</span>
                      </div>
                    ) : (
                      <div className="text-2xl font-display font-bold text-cyan-300 animate-pulse">
                        RUN IN PROGRESS...
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {currentRoundScore !== null ? 'Officially Verified & Published' : 'Arena run in progress'}
                  </span>
                </div>

                {/* Performance Breakdown Highlights */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between text-xs text-slate-300">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                    SCORE BREAKDOWN
                  </span>
                  
                  {currentRound === 1 && round1Data && !round1Data.isDraft && (
                    <div className="space-y-1 my-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Block Subtotal:</span>
                        <span className="font-bold text-white">+{round1Data.blockScore} pts</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Time Left ({round1Data.timeLeftSeconds}s):</span>
                        <span className="font-mono text-emerald-400">+{round1Data.timeBonus} pts</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-800">
                        <span className="text-slate-300 font-bold">Round 1 Final:</span>
                        <span className="font-mono font-bold text-blue-400">{round1Data.finalScore} pts</span>
                      </div>
                    </div>
                  )}

                  {currentRound === 2 && round2Data && !round2Data.isDraft && (
                    <div className="space-y-1 my-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Pulled Subtotal:</span>
                        <span className="font-bold text-white">+{round2Data.blockScore} pts</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Time Left ({round2Data.timeLeftSeconds}s):</span>
                        <span className="font-mono text-emerald-400">+{round2Data.timeBonus} pts</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Boundary Touches ({round2Data.boundaryTouches}):</span>
                        <span className="font-mono text-rose-400">-{round2Data.boundaryPenalty} pts</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-800">
                        <span className="text-slate-300 font-bold">Round 2 Final:</span>
                        <span className="font-mono font-bold text-emerald-400">{round2Data.finalScore} pts</span>
                      </div>
                    </div>
                  )}

                  {currentRound === 3 && (
                    <div className="my-2 space-y-1">
                      <div className="text-sm font-bold text-rose-400">Head-to-Head Robo War</div>
                      <div className="text-slate-400 text-[11px]">
                        IN-PIT: Time Left × 3 • OUT-PIT: Time Left × 2
                      </div>
                      <div className="text-slate-300 pt-1 font-mono">
                        Round 3 Score: {round3Score} pts
                      </div>
                    </div>
                  )}

                  {((currentRound === 1 && (!round1Data || round1Data.isDraft)) ||
                    (currentRound === 2 && (!round2Data || round2Data.isDraft))) && (
                    <div className="my-2 text-slate-500 italic">
                      Judges calculating score breakdown...
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-900">
                    Official Bharat Robotics League 2026 Rules
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Clock className="w-12 h-12 mx-auto text-slate-600 mb-2" />
              <h3 className="text-2xl font-display font-bold text-white">
                Arena Preparing For Next Run
              </h3>
              <p className="text-slate-400 text-sm">Teams are positioning in the staging pit.</p>
            </div>
          )}
        </div>

        {/* Right 4 Cols: UP NEXT & STAGING QUEUE */}
        <div className="lg:col-span-4 space-y-5">
          
          <div className="text-sm font-bold text-slate-300 uppercase tracking-wider font-display flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>ARENA RUN QUEUE</span>
          </div>

          {/* UP NEXT CARD */}
          <div className="bg-slate-900/90 border-2 border-cyan-500/60 rounded-2xl p-5 relative overflow-hidden shadow-xl shadow-cyan-950/30">
            <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
              <span>UP NEXT (ON DECK)</span>
              <span className="font-mono">PRE-ARENA</span>
            </div>

            {upNextSchool ? (
              <div className="space-y-1">
                <div className="text-xl font-display font-bold text-white truncate">
                  {upNextSchool.name}
                </div>
                <div className="text-xs text-amber-300 font-semibold truncate">
                  {upNextSchool.teamName} ({upNextSchool.teamNumber})
                </div>
                <div className="text-xs text-slate-400">
                  {upNextSchool.city}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-3">No team in slot</div>
            )}
          </div>

          {/* FOLLOWING CARD */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              FOLLOWING
            </div>

            {followingSchool ? (
              <div className="space-y-1">
                <div className="text-base font-display font-bold text-slate-200 truncate">
                  {followingSchool.name}
                </div>
                <div className="text-xs text-slate-400 truncate">
                  {followingSchool.teamName} ({followingSchool.teamNumber})
                </div>
                <div className="text-xs text-slate-500">
                  {followingSchool.city}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-600 py-2">Queue complete</div>
            )}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 pt-4 flex items-center justify-between text-xs font-mono text-slate-400">
        <div>BHARAT ROBOTICS LEAGUE 2026 • OFFICIAL ARENA STAGE</div>
        <div>REAL-TIME ARENA TELEMETRY</div>
      </footer>
    </div>
  );
};
