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
  Zap
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
    ? (!round1Data?.isDraft ? round1Data?.calculatedScore : null)
    : currentRound === 2 
      ? (!round2Data?.isDraft ? round2Data?.calculatedScore : null)
      : round3Score;

  // Find team's overall rank on leaderboard
  const teamLeaderboardEntry = currentSchool 
    ? leaderboard.find(e => e.school.id === currentSchool.id)
    : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden font-sans select-none">
      {/* Dynamic Arena Glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[160px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[160px] pointer-events-none"></div>

      {/* Top Header Bar */}
      <header className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-5">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-display font-black text-xl shadow-lg shadow-amber-500/20">
            BRL
          </div>
          <div>
            <div className="text-xs font-bold text-amber-400 tracking-wider font-display flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>LIVE ARENA RUN • BHARAT ROBOTICS LEAGUE 2026</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-white tracking-wide">
              {currentRound === 1 && 'Round 1: Precision Block Push Challenge'}
              {currentRound === 2 && 'Round 2: Heavy Sled Block Pull Challenge'}
              {currentRound === 3 && 'Round 3: Robot War Combat Arena'}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-[11px] font-mono text-slate-400">ARENA DATE</div>
            <div className="text-sm font-display font-bold text-slate-200">29 SEPT 2026</div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold font-mono">
            ARENA ACTIVE
          </span>
        </div>
      </header>

      {/* Main Stage Presentation Center */}
      <main className="relative z-10 my-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-7xl mx-auto w-full">
        
        {/* Left 8 Cols: NOW PLAYING HERO SPOTLIGHT */}
        <div className="lg:col-span-8 bg-gradient-to-br from-slate-900 via-[#0e1731] to-slate-900 border-2 border-emerald-500/60 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-emerald-950/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest border border-emerald-500/40">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>NOW PLAYING IN ARENA</span>
            </span>

            {teamLeaderboardEntry && (
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                OVERALL RANK #{teamLeaderboardEntry.rank} ({teamLeaderboardEntry.totalScore} PTS)
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
                  <span className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono font-bold text-sm border border-cyan-500/30">
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
                    {currentRoundScore !== null ? 'Officially Verified & Scored' : 'Judges evaluating arena run'}
                  </span>
                </div>

                {/* Performance Breakdown Highlights */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between text-xs text-slate-300">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                    ARENA SPECIFICATIONS
                  </span>
                  
                  {currentRound === 1 && round1Data && (
                    <div className="space-y-1 my-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Mass Tier:</span>
                        <span className="font-bold text-white">{round1Data.weightCategoryLabel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Zone Multiplier:</span>
                        <span className="font-mono text-cyan-300">{round1Data.zoneMultiplier}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Bonus / Penalty:</span>
                        <span className="font-mono text-emerald-400">+{round1Data.bonusPoints} / -{round1Data.penaltyPoints}</span>
                      </div>
                    </div>
                  )}

                  {currentRound === 2 && round2Data && (
                    <div className="space-y-1 my-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Sled Mass:</span>
                        <span className="font-bold text-white">{round2Data.pullTierLabel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Track Distance:</span>
                        <span className="font-mono text-amber-300">{round2Data.distanceMultiplier * 100}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Traction Bonus:</span>
                        <span className="font-mono text-emerald-400">+{round2Data.bonusPoints} pts</span>
                      </div>
                    </div>
                  )}

                  {currentRound === 3 && (
                    <div className="my-2">
                      <div className="text-sm font-bold text-rose-400">Direct Arena Combat</div>
                      <div className="text-slate-400 mt-1">Head-to-head robot elimination match.</div>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-900">
                    Official Bharat Robotics League Scoring Standards
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
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
              <span>FOLLOWING</span>
              <span className="font-mono">PIT INSPECTION</span>
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
              <div className="text-xs text-slate-500 py-2">End of queue</div>
            )}
          </div>

          {/* Quick Standings Peek */}
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4">
            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>CURRENT LEADER</span>
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
            </div>
            {leaderboard[0] ? (
              <div className="flex items-center justify-between">
                <div className="truncate pr-2">
                  <div className="text-xs font-bold text-white truncate">{leaderboard[0].school.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{leaderboard[0].school.teamName}</div>
                </div>
                <span className="font-mono font-bold text-amber-400 text-sm flex-shrink-0">
                  {leaderboard[0].totalScore} PTS
                </span>
              </div>
            ) : null}
          </div>

        </div>

      </main>

      {/* Footer Ticker */}
      <footer className="relative z-10 border-t border-slate-800/80 pt-4 flex items-center justify-between text-xs font-mono text-slate-400">
        <div>BHARAT ROBOTICS LEAGUE 2026 • OFFICIAL ARENA STAGE DISPLAY</div>
        <div>REAL-TIME VERIFIED SCORES</div>
      </footer>
    </div>
  );
};
