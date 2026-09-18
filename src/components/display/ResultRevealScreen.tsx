import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Award, CheckCircle2, Clock, Zap, ShieldCheck } from 'lucide-react';
import { useCompetition } from '../../context/CompetitionContext';

export const ResultRevealScreen: React.FC = () => {
  const { state, currentSchool } = useCompetition();
  const publishedResult = state.lastPublishedResult;

  // Fallback to current school published score if lastPublishedResult is not populated yet
  const fallbackSchool = currentSchool || state.schools.find(s => s.id === publishedResult?.schoolId) || state.schools[0];
  const round1Score = fallbackSchool ? state.scores[fallbackSchool.id]?.round1 : null;
  const round2Score = fallbackSchool ? state.scores[fallbackSchool.id]?.round2 : null;

  const round = publishedResult?.round || state.currentRound || 1;
  const teamName = publishedResult?.teamName || fallbackSchool?.teamName || 'Team';
  const schoolName = publishedResult?.schoolName || fallbackSchool?.name || 'School';
  const teamNumber = publishedResult?.teamNumber || fallbackSchool?.teamNumber || '';
  const city = publishedResult?.city || fallbackSchool?.city || '';

  const finalScore = publishedResult?.finalScore ?? (
    round === 1 ? (round1Score?.finalScore ?? 0) : round === 2 ? (round2Score?.finalScore ?? 0) : 0
  );

  const blockScore = publishedResult?.blockScore ?? (
    round === 1 ? (round1Score?.blockScore ?? 0) : round === 2 ? (round2Score?.blockScore ?? 0) : 0
  );

  const timeLeft = publishedResult?.timeLeft ?? (
    round === 1 ? (round1Score?.timeLeftSeconds ?? 0) : round === 2 ? (round2Score?.timeLeftSeconds ?? 0) : 0
  );

  const timeBonus = publishedResult?.timeBonus ?? (
    round === 1 ? (round1Score?.timeBonus ?? 0) : round === 2 ? (round2Score?.timeBonus ?? 0) : 0
  );

  const blocks = publishedResult?.blocks || round1Score?.blocks || [];
  const activeBlocks = blocks.filter(b => b.status !== 'none');

  const roundTitle = round === 1 
    ? 'BLOCK PUSH CHALLENGE' 
    : round === 2 
      ? 'BLOCK PULL CHALLENGE' 
      : 'ROBO WAR ARENA COMBAT';

  return (
    <div 
      id="brl-result-reveal-screen"
      className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden font-sans select-none"
    >
      {/* Visual Ambient Glows for Post-Publish Reveal */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[550px] bg-gradient-to-tr from-amber-500/20 via-blue-600/15 to-emerald-500/15 rounded-full blur-[180px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-amber-400/10 rounded-full blur-[160px] pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Top Header Bar */}
      <header className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center space-x-3.5">
          <img 
            src="/brl-logo.png" 
            alt="Bharat Robotics League Logo" 
            className="w-14 h-14 object-contain drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]" 
          />
          <div>
            <div className="text-xs font-bold text-amber-400 tracking-widest font-display flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <span>BHARAT ROBOTICS LEAGUE 2026 • OFFICIAL ARENA RESULT</span>
            </div>
            <div className="text-lg sm:text-xl font-display font-black text-white tracking-wide">
              ROUND {round} — {roundTitle}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <span className="px-3.5 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>OFFICIAL PUBLISHED SCORE</span>
          </span>
        </div>
      </header>

      {/* Main Congratulatory Stage — Optimized for Photography on LED Walls & Projectors */}
      <main className="relative z-10 my-auto py-4 max-w-6xl mx-auto w-full">
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="text-center space-y-6"
        >
          {/* 1. Large CONGRATULATIONS Announcement */}
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/40 text-amber-300 text-sm sm:text-base font-bold font-display uppercase tracking-widest mb-1 shadow-lg shadow-amber-950/30">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>BHARAT ROBOTICS LEAGUE 2026</span>
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-amber-200 tracking-tight leading-none drop-shadow-[0_4px_25px_rgba(245,158,11,0.25)]">
              CONGRATULATIONS!
            </h1>
          </div>

          {/* 2. TEAM NAME & SCHOOL NAME (Prominent & Clear for Photos) */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-3">
              {teamNumber && (
                <span className="px-3 py-1 rounded-xl bg-blue-500/20 text-blue-300 font-mono font-bold text-base sm:text-lg border border-blue-500/40 shadow-inner">
                  {teamNumber}
                </span>
              )}
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-display font-black text-amber-400 tracking-tight">
                {teamName}
              </h2>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-slate-200 max-w-3xl mx-auto leading-snug">
              {schoolName} {city ? `• ${city}` : ''}
            </div>
            <div className="text-xs sm:text-sm font-mono text-slate-400 uppercase tracking-wider">
              Official Result for {roundTitle}
            </div>
          </div>

          {/* 3. HERO SCORE DISPLAY & COMPLETE TRANSPARENT BREAKDOWN */}
          <div className="bg-gradient-to-b from-slate-900/95 to-slate-950/95 border-2 border-amber-500/60 rounded-3xl p-6 sm:p-8 max-w-4xl mx-auto shadow-2xl shadow-amber-950/40 relative overflow-hidden backdrop-blur-md">
            
            {/* Top row: The Big Final Score */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800/90 pb-6">
              <div className="text-center sm:text-left">
                <div className="text-xs sm:text-sm font-mono font-bold text-slate-400 uppercase tracking-widest">
                  FINAL OFFICIAL SCORE
                </div>
                <div className="text-sm font-medium text-slate-300">
                  Calculated automatically according to official BRL 2026 scoring rules
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-6xl sm:text-8xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 tracking-tight leading-none drop-shadow-[0_0_35px_rgba(245,158,11,0.5)]">
                  {finalScore}
                </span>
                <span className="text-xl sm:text-2xl font-display font-black text-amber-400">
                  PTS
                </span>
              </div>
            </div>

            {/* Bottom: Transparent Score Breakdown */}
            <div className="pt-6 space-y-4">
              <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider text-left flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>OFFICIAL SCORE CALCULATION BREAKDOWN</span>
              </div>

              {/* Round 1 Block Breakdown */}
              {round === 1 && (
                <div className="space-y-3">
                  {/* Detailed Pushed Blocks Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-left">
                    {activeBlocks.length > 0 ? (
                      activeBlocks.map((block) => (
                        <div 
                          key={block.weightId} 
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono ${
                            block.status === 'complete' 
                              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200' 
                              : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                          }`}
                        >
                          <div>
                            <span className="font-bold text-white block">{block.weightLabel}</span>
                            <span className="text-[10px] uppercase opacity-80">
                              {block.status === 'complete' ? 'COMPLETE' : 'INCOMPLETE (50%)'}
                            </span>
                          </div>
                          <span className="text-sm font-black font-display ml-2">
                            +{block.pointsEarned} pts
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-2 text-xs font-mono text-slate-400 text-center">
                        No official target blocks pushed inside zone (0 block points)
                      </div>
                    )}
                  </div>

                  {/* Summary math calculation bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-left">
                      <div className="text-[11px] font-mono text-slate-400 uppercase">BLOCK POINTS</div>
                      <div className="text-2xl font-display font-black text-white mt-0.5">
                        {blockScore} <span className="text-xs font-normal text-slate-400">pts</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {activeBlocks.length} of 6 blocks pushed
                      </div>
                    </div>

                    <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-left">
                      <div className="text-[11px] font-mono text-slate-400 uppercase">TIME REMAINING</div>
                      <div className="text-2xl font-display font-black text-cyan-400 mt-0.5">
                        {timeLeft} <span className="text-xs font-normal text-slate-400">sec</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Allocated: 120s (Used: {Math.max(0, 120 - timeLeft)}s)
                      </div>
                    </div>

                    <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-left">
                      <div className="text-[11px] font-mono text-slate-400 uppercase">TIME BONUS</div>
                      <div className="text-2xl font-display font-black text-emerald-400 mt-0.5">
                        +{timeBonus} <span className="text-xs font-normal text-slate-400">pts</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        +1 pt per unused second
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Round 2 Block Pull Breakdown */}
              {round === 2 && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                  <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-left">
                    <div className="text-[11px] font-mono text-slate-400 uppercase">BLOCK POINTS</div>
                    <div className="text-2xl font-display font-black text-white mt-0.5">
                      {blockScore} <span className="text-xs font-normal text-slate-400">pts</span>
                    </div>
                  </div>
                  <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-left">
                    <div className="text-[11px] font-mono text-slate-400 uppercase">TIME REMAINING</div>
                    <div className="text-2xl font-display font-black text-cyan-400 mt-0.5">
                      {timeLeft} <span className="text-xs font-normal text-slate-400">sec</span>
                    </div>
                  </div>
                  <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-left">
                    <div className="text-[11px] font-mono text-slate-400 uppercase">TIME BONUS</div>
                    <div className="text-2xl font-display font-black text-emerald-400 mt-0.5">
                      +{timeBonus} <span className="text-xs font-normal text-slate-400">pts</span>
                    </div>
                  </div>
                  <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-left">
                    <div className="text-[11px] font-mono text-slate-400 uppercase">BOUNDARY PENALTY</div>
                    <div className="text-2xl font-display font-black text-rose-400 mt-0.5">
                      -{publishedResult?.round2Details?.boundaryPenalty ?? (round2Score?.boundaryPenalty ?? 0)} <span className="text-xs font-normal text-slate-400">pts</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Round 3 Combat Breakdown */}
              {round === 3 && publishedResult?.round3Details && (
                <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 text-left">
                  <div className="text-sm font-bold text-amber-300">
                    Winner: {publishedResult.round3Details.winnerName}
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-1">
                    Arena Pit: {publishedResult.round3Details.pitType?.toUpperCase() || 'STANDARD'} • Multiplier: {publishedResult.round3Details.multiplier || 1}x • Time Left: {timeLeft}s
                  </div>
                </div>
              )}

            </div>

          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 pt-4 flex items-center justify-between text-xs font-mono text-slate-400">
        <div>BHARAT ROBOTICS LEAGUE 2026 • OFFICIAL COMPETITION RESULT</div>
        <div>VERIFIED BY POD REFEREES & ARENA CONTROL</div>
      </footer>
    </div>
  );
};
