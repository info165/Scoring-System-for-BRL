import React from 'react';
import { 
  Clock, 
  AlertTriangle,
  Flame,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useCompetition } from '../../context/CompetitionContext';
import { useArenaTimer } from '../../hooks/useArenaTimer';

export const NowPlayingScreen: React.FC = () => {
  const { 
    state, 
    currentSchool, 
    upNextSchool, 
    followingSchool 
  } = useCompetition();

  const currentRound = state.currentRound;
  const { 
    remainingSeconds, 
    formattedTime, 
    status: timerStatus, 
    isUrgent, 
    isTimeOver 
  } = useArenaTimer();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden font-sans select-none">
      {/* Dynamic Arena Glows */}
      <div className={`absolute top-0 right-0 w-[650px] h-[650px] rounded-full blur-[170px] pointer-events-none transition-colors duration-700 ${
        isUrgent || isTimeOver ? 'bg-red-600/20' : 'bg-blue-600/15'
      }`}></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[160px] pointer-events-none"></div>

      {/* Top Header Bar */}
      <header className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-5">
        <div className="flex items-center space-x-3.5">
          <img 
            src="/brl-logo.png" 
            alt="BRL Logo" 
            className="w-14 h-14 object-contain drop-shadow-[0_0_12px_rgba(245,158,11,0.35)]" 
          />
          <div>
            <div className="text-xs font-bold text-amber-400 tracking-wider font-display flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${
                timerStatus === 'running' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}></span>
              <span>BHARAT ROBOTICS LEAGUE 2026 • OFFICIAL ARENA</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-white tracking-wide">
              {currentRound === 1 && 'ROUND 1 — ROBO PUSH CHALLENGE'}
              {currentRound === 2 && 'ROUND 2 — ROBO PULL CHALLENGE'}
              {currentRound === 3 && 'ROUND 3 — ROBO WAR ARENA COMBAT'}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-[11px] font-mono text-slate-400">ARENA STATUS</div>
            <div className="text-sm font-display font-bold text-slate-200">
              {timerStatus === 'running' ? 'MATCH IN PROGRESS' : isTimeOver ? 'TIME EXPIRED' : 'POD READY'}
            </div>
          </div>
          <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold font-mono uppercase tracking-wider border ${
            timerStatus === 'running' 
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
              : isTimeOver
                ? 'bg-red-500/20 text-red-300 border-red-500/40'
                : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
          }`}>
            {timerStatus === 'running' ? '● LIVE ARENA' : isTimeOver ? 'TIME OVER' : 'STAGED'}
          </span>
        </div>
      </header>

      {/* Main Stage Presentation Center */}
      <main className="relative z-10 my-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-7xl mx-auto w-full">
        
        {/* Left 8 Cols: NOW PLAYING HERO SPOTLIGHT & SYNCHRONIZED TIMER */}
        <div className={`lg:col-span-8 bg-gradient-to-br from-slate-900 via-[#0e1731] to-slate-900 border-2 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden transition-all duration-300 ${
          isUrgent 
            ? 'border-red-500 shadow-red-950/50' 
            : isTimeOver 
              ? 'border-red-600 bg-red-950/20' 
              : 'border-blue-500/60'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest border border-emerald-500/40">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>NOW PLAYING IN ARENA</span>
            </span>

            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              {currentSchool?.teamNumber || 'POD 1'}
            </span>
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
                  <span className="text-2xl font-bold text-amber-400">
                    {currentSchool.teamName}
                  </span>
                  <span className="text-slate-400 font-medium text-sm">• {currentSchool.city}</span>
                </div>
              </div>

              {currentSchool.students && currentSchool.students.length > 0 && (
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300">
                  <span className="text-slate-400 font-mono block text-[11px] mb-1">
                    STUDENT OPERATORS & PILOTS:
                  </span>
                  <span className="font-semibold text-white">
                    {currentSchool.students.join(' • ')}
                  </span>
                </div>
              )}

              {/* Prominent Synchronized Countdown Timer (STRICTLY NO SCORE SHOWN) */}
              <div className={`pt-6 border-t rounded-2xl p-6 transition-all duration-300 ${
                isTimeOver
                  ? 'bg-red-950/60 border-red-600/80 shadow-inner'
                  : isUrgent
                    ? 'bg-red-950/40 border-red-500 animate-pulse'
                    : 'bg-slate-950/80 border-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Clock className={`w-4 h-4 ${isUrgent || isTimeOver ? 'text-red-400' : 'text-cyan-400'}`} />
                    <span>TIME REMAINING</span>
                  </span>

                  {isUrgent && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 font-mono animate-bounce">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>FINAL 10 SECONDS!</span>
                    </span>
                  )}

                  {isTimeOver && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 font-mono">
                      <Flame className="w-3.5 h-3.5" />
                      <span>OFFICIAL RUN ENDED</span>
                    </span>
                  )}
                </div>

                {/* Big Timer Digits */}
                <div className="text-center py-4">
                  {isTimeOver ? (
                    <div className="space-y-1">
                      <div className="text-6xl sm:text-8xl font-mono font-black text-red-500 tracking-wider animate-pulse">
                        00:00
                      </div>
                      <div className="text-2xl sm:text-3xl font-display font-black text-red-400 tracking-wider uppercase">
                        TIME OVER
                      </div>
                    </div>
                  ) : (
                    <div className={`text-6xl sm:text-8xl lg:text-9xl font-mono font-black tracking-tight leading-none transition-colors ${
                      isUrgent 
                        ? 'text-red-500 drop-shadow-[0_0_25px_rgba(239,68,68,0.5)]' 
                        : timerStatus === 'running' 
                          ? 'text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.25)]' 
                          : 'text-slate-100'
                    }`}>
                      {formattedTime}
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-center gap-2 text-xs font-mono text-slate-400">
                    <span>STATUS:</span>
                    <span className={`font-bold ${
                      timerStatus === 'running' 
                        ? 'text-emerald-400' 
                        : isTimeOver 
                          ? 'text-red-400' 
                          : 'text-amber-400'
                    }`}>
                      {timerStatus === 'running' ? 'CLOCK RUNNING' : isTimeOver ? 'STOPPED (TIME OVER)' : timerStatus === 'stopped' ? 'CLOCK STOPPED' : 'AWAITING START'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>OFFICIAL ROUND TIME: 120 SECONDS</span>
                  <span>SCORES RELEASED ON LEADERBOARD AFTER RUN</span>
                </div>
              </div>

            </div>
          ) : (
            <div className="py-20 text-center text-slate-400 space-y-3">
              <Clock className="w-14 h-14 mx-auto text-slate-600 mb-2" />
              <h3 className="text-3xl font-display font-bold text-white">
                Arena Preparing For Next Run
              </h3>
              <p className="text-slate-400 text-sm">Teams are positioning in the staging pit.</p>
            </div>
          )}
        </div>

        {/* Right 4 Cols: UP NEXT & STAGING QUEUE (Strictly No Scores) */}
        <div className="lg:col-span-4 space-y-5">
          
          <div className="text-sm font-bold text-slate-300 uppercase tracking-wider font-display flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>ARENA QUEUE</span>
          </div>

          {/* UP NEXT CARD */}
          <div className="bg-slate-900/95 border-2 border-cyan-500/60 rounded-2xl p-6 relative overflow-hidden shadow-xl shadow-cyan-950/30">
            <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest mb-2 flex items-center justify-between">
              <span>UP NEXT (ON DECK)</span>
              <span className="font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">READY</span>
            </div>

            {upNextSchool ? (
              <div className="space-y-1.5">
                <div className="text-2xl font-display font-bold text-white">
                  {upNextSchool.name}
                </div>
                <div className="text-base text-amber-300 font-semibold">
                  {upNextSchool.teamName} ({upNextSchool.teamNumber})
                </div>
                <div className="text-xs text-slate-400">
                  {upNextSchool.city}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-4">No team in queue slot</div>
            )}
          </div>

          {/* FOLLOWING CARD */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              FOLLOWING IN QUEUE
            </div>

            {followingSchool ? (
              <div className="space-y-1">
                <div className="text-lg font-display font-bold text-slate-200">
                  {followingSchool.name}
                </div>
                <div className="text-sm text-slate-300 font-medium">
                  {followingSchool.teamName} ({followingSchool.teamNumber})
                </div>
                <div className="text-xs text-slate-500">
                  {followingSchool.city}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-600 py-3">Queue complete</div>
            )}
          </div>

          {/* Arena Challenge Notice */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-slate-300 mb-0.5">BRL Evaluator Pods</div>
              <div>Judges verify block boundary positions and log official times directly beside the arena ring.</div>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 pt-4 flex items-center justify-between text-xs font-mono text-slate-400">
        <div>BHARAT ROBOTICS LEAGUE 2026 • OFFICIAL ARENA STAGE</div>
        <div>SYNCHRONIZED ARENA TELEMETRY</div>
      </footer>
    </div>
  );
};
