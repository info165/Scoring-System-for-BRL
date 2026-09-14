import React from 'react';
import { Trophy, Medal, Sparkles, Crown, Award, Star, AlertTriangle } from 'lucide-react';
import { useCompetition } from '../../context/CompetitionContext';

interface WinnerScreenProps {
  onClose?: () => void;
}

export const WinnerScreen: React.FC<WinnerScreenProps> = ({ onClose }) => {
  const { leaderboard, hasActiveTie } = useCompetition();

  const champion = leaderboard[0];
  const runnerUp1 = leaderboard[1];
  const runnerUp2 = leaderboard[2];

  const isChampTied = champion?.isTied;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden font-sans select-none">
      {/* Dynamic Golden Aura */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-amber-500/20 via-yellow-500/10 to-transparent rounded-full blur-[180px] pointer-events-none"></div>
      
      {/* Decorative Sparkles */}
      <div className="absolute top-12 left-16 text-amber-400 opacity-60 animate-pulse">
        <Sparkles className="w-8 h-8" />
      </div>
      <div className="absolute top-20 right-20 text-yellow-300 opacity-60 animate-pulse">
        <Sparkles className="w-10 h-10" />
      </div>
      <div className="absolute bottom-24 left-1/4 text-amber-500 opacity-40">
        <Star className="w-6 h-6" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-amber-500/30 pb-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-display font-black text-2xl shadow-xl shadow-amber-500/30">
            BRL
          </div>
          <div>
            <div className="text-xs font-bold text-amber-400 tracking-widest font-display flex items-center gap-1.5 uppercase">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>OFFICIAL CHAMPIONSHIP PODIUM</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black tracking-wide text-white">
              BHARAT ROBOTICS LEAGUE 2026 AWARDS
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-xs font-mono text-amber-300 font-bold">29 SEPTEMBER 2026</div>
            <div className="text-xs text-slate-400">GRAND FINALE</div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition"
            >
              Exit Winner Mode
            </button>
          )}
        </div>
      </header>

      {/* Tie Alert on Podium if exists */}
      {hasActiveTie && (
        <div className="relative z-10 my-2 max-w-4xl mx-auto bg-amber-950/80 border border-amber-500/80 rounded-2xl p-3 px-4 flex items-center justify-between text-amber-200 text-xs">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              <strong>Official Note:</strong> Active tie in tournament scores. Per BRL 2026 rules, tied teams share honors pending referee/organizer determination.
            </span>
          </div>
        </div>
      )}

      {/* Main Podium Centerpiece */}
      <main className="relative z-10 my-auto py-6 max-w-6xl mx-auto w-full space-y-6">
        
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-widest">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>NATIONAL CHAMPION ANNOUNCEMENT</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-400">
            CONGRATULATIONS TO THE CHAMPIONS!
          </h2>
        </div>

        {/* 3-Tier Podium Layout */}
        <div className="grid grid-cols-1 md:grid-cols-11 gap-4 sm:gap-6 items-end pt-4">
          
          {/* Rank 2: Silver (1st Runner Up) */}
          {runnerUp1 && (
            <div className="md:col-span-3 bg-slate-900/90 border-2 border-slate-600/80 rounded-3xl p-6 relative overflow-hidden shadow-xl flex flex-col justify-between order-2 md:order-1 min-h-[350px]">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="w-10 h-10 rounded-full bg-slate-700 text-white flex items-center justify-center font-display font-black text-lg shadow">
                    {runnerUp1.isTied ? `T-2` : `#2`}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1">
                    <Medal className="w-4 h-4 text-slate-300" /> 1st Runner-Up
                  </span>
                </div>

                <h3 className="text-xl font-display font-bold text-white leading-tight">
                  {runnerUp1.school.name}
                </h3>
                <div className="text-sm font-semibold text-blue-300 mt-1">
                  {runnerUp1.school.teamName}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {runnerUp1.school.teamNumber} • {runnerUp1.school.city}
                </div>

                {runnerUp1.school.students.length > 0 && (
                  <div className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800">
                    {runnerUp1.school.students.slice(0, 3).join(', ')}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between font-mono">
                <span className="text-xs text-slate-400">Total Score:</span>
                <span className="text-3xl font-bold text-slate-100">{runnerUp1.totalScore} pts</span>
              </div>
            </div>
          )}

          {/* Rank 1: Gold (Grand Champion) */}
          {champion && (
            <div className="md:col-span-5 bg-gradient-to-b from-[#241a05] via-slate-900 to-[#191204] border-2 border-amber-400 rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-amber-500/30 flex flex-col justify-between order-1 md:order-2 min-h-[420px] z-20">
              <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500"></div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center font-display font-black text-2xl shadow-xl shadow-amber-500/40 border-2 border-yellow-200">
                    {isChampTied ? `T-1` : `#1`}
                  </div>
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/30 border border-amber-400 text-amber-300 text-xs font-display font-black tracking-widest uppercase">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>{isChampTied ? 'CO-GRAND CHAMPION' : 'GRAND CHAMPION'}</span>
                  </div>
                </div>

                <div className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">
                  NATIONAL CHAMPION SCHOOL 2026
                </div>
                <h3 className="text-2xl sm:text-3xl font-display font-black text-white leading-tight mt-1">
                  {champion.school.name}
                </h3>
                <div className="text-lg font-bold text-amber-300 mt-1">
                  {champion.school.teamName}
                </div>
                <div className="text-xs text-slate-300 mt-0.5">
                  {champion.school.teamNumber} • {champion.school.city}
                </div>

                {champion.school.students.length > 0 && (
                  <div className="bg-slate-950/60 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-200 mt-4">
                    <span className="text-[10px] text-slate-400 font-mono block">PILOTS & CREW:</span>
                    <span className="font-semibold">{champion.school.students.join(', ')}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-amber-500/30 flex items-center justify-between font-mono">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">CHAMPIONSHIP SCORE:</span>
                <span className="text-4xl sm:text-5xl font-display font-black text-amber-400">
                  {champion.totalScore} <span className="text-base font-normal text-slate-400">PTS</span>
                </span>
              </div>
            </div>
          )}

          {/* Rank 3: Bronze (2nd Runner Up) */}
          {runnerUp2 && (
            <div className="md:col-span-3 bg-slate-900/90 border-2 border-amber-900/60 rounded-3xl p-6 relative overflow-hidden shadow-xl flex flex-col justify-between order-3 min-h-[320px]">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="w-10 h-10 rounded-full bg-amber-950 border border-amber-700 text-amber-300 flex items-center justify-center font-display font-black text-lg shadow">
                    {runnerUp2.isTied ? `T-3` : `#3`}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1">
                    <Medal className="w-4 h-4 text-amber-600" /> 2nd Runner-Up
                  </span>
                </div>

                <h3 className="text-xl font-display font-bold text-white leading-tight">
                  {runnerUp2.school.name}
                </h3>
                <div className="text-sm font-semibold text-blue-300 mt-1">
                  {runnerUp2.school.teamName}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {runnerUp2.school.teamNumber} • {runnerUp2.school.city}
                </div>

                {runnerUp2.school.students.length > 0 && (
                  <div className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800">
                    {runnerUp2.school.students.slice(0, 3).join(', ')}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between font-mono">
                <span className="text-xs text-slate-400">Total Score:</span>
                <span className="text-3xl font-bold text-slate-200">{runnerUp2.totalScore} pts</span>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-amber-500/30 pt-4 flex items-center justify-between text-xs font-mono text-slate-400">
        <div>BHARAT ROBOTICS LEAGUE 2026 • OFFICIAL PODIUM PRESENTATION</div>
        <div>WWW.BRL.ORG.IN</div>
      </footer>
    </div>
  );
};
