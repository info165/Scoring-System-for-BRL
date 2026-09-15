import React, { useMemo } from 'react';
import { Trophy, AlertTriangle, AlertCircle } from 'lucide-react';
import { useCompetition } from '../../context/CompetitionContext';

const ROUND_META: Record<1 | 2 | 3, { label: string; short: string; badgeClass: string }> = {
  1: { label: 'ROUND 1: BLOCK PUSH', short: 'R1', badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  2: { label: 'ROUND 2: BLOCK PULL', short: 'R2', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  3: { label: 'ROUND 3: ROBO WAR', short: 'R3', badgeClass: 'bg-red-500/20 text-red-300 border-red-500/40' },
};

export const LeaderboardScreen: React.FC = () => {
  const { leaderboard, state, hasActiveTie } = useCompetition();
  const filter = state.leaderboardFilter || 'all';

  // When a single round is selected, re-rank teams by that round's score only.
  const displayRows = useMemo(() => {
    if (filter === 'all') return leaderboard;

    const key = filter === 1 ? 'round1Score' : filter === 2 ? 'round2Score' : 'round3Score';
    const sorted = [...leaderboard].sort((a, b) => {
      if (b[key] !== a[key]) return b[key] - a[key];
      return a.school.name.localeCompare(b.school.name);
    });

    const ranked: typeof sorted = [];
    for (let i = 0; i < sorted.length; i++) {
      const prevRank = i > 0 ? ranked[i - 1].rank : 0;
      const sameAsPrev = i > 0 && sorted[i - 1][key] === sorted[i][key];
      ranked.push({ ...sorted[i], rank: sameAsPrev ? prevRank : i + 1 });
    }

    return ranked.map((row, i) => {
      const tiedWithPrev = i > 0 && ranked[i - 1][key] === row[key] && row[key] > 0;
      const tiedWithNext = i < ranked.length - 1 && ranked[i + 1][key] === row[key] && row[key] > 0;
      return { ...row, isTied: tiedWithPrev || tiedWithNext };
    });
  }, [leaderboard, filter]);

  const roundMeta = filter !== 'all' ? ROUND_META[filter] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden font-sans select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-[700px] h-[500px] bg-amber-500/10 rounded-full blur-[170px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-[700px] h-[500px] bg-blue-500/10 rounded-full blur-[170px] pointer-events-none"></div>

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-5">
        <div className="flex items-center space-x-4">
          <img src="/brl-logo.png" alt="BRL Logo" className="w-14 h-14 rounded-2xl shadow-xl shadow-amber-500/20 object-contain bg-black" />
          <div>
            <div className="text-xs font-bold text-amber-400 tracking-widest font-display flex items-center gap-1.5 uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>OFFICIAL TOURNAMENT STANDINGS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black tracking-wide">
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-orange-300 to-orange-600">BHARAT</span>{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-300">ROBOTICS</span>{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-emerald-300 to-green-600">LEAGUE</span>{' '}
              <span className="text-white">2026 {roundMeta ? `${roundMeta.short} STANDINGS` : 'LEADERBOARD'}</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3 font-mono text-xs">
          <span className={`px-3.5 py-1.5 rounded-full font-bold uppercase border ${
            roundMeta ? roundMeta.badgeClass : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          }`}>
            {roundMeta ? `SHOWING: ${roundMeta.label} ONLY` : `STAGE: ROUND ${state.currentRound}`}
          </span>
          <span className="text-slate-400">29 SEPT 2026</span>
        </div>
      </header>

      {/* Active Tie Notification for Stage Audience & Referees */}
      {hasActiveTie && (
        <div className="relative z-10 my-2 mx-auto max-w-7xl w-full bg-amber-950/80 border-2 border-amber-500 rounded-2xl p-4 flex items-center justify-between shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500 text-slate-950">
              <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Official Regulation Notice
              </div>
              <div className="text-sm font-bold text-white">
                TIE DETECTED: Tied teams share equal rank. No secondary tie-breaker is applied automatically per official BRL rules.
              </div>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold text-xs border border-amber-500/40">
            REFEREE DECISION PENDING
          </span>
        </div>
      )}

      {/* Main Leaderboard Table Stage View */}
      <main className="relative z-10 my-auto py-4 max-w-7xl mx-auto w-full">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-display font-bold text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6 text-center w-24">RANK</th>
                  <th className="py-4 px-6">PARTICIPATING SCHOOL / TEAM</th>
                  <th className="py-4 px-6">CITY</th>
                  {filter === 'all' ? (
                    <>
                      <th className="py-4 px-6 text-center text-blue-400">R1: BLOCK PUSH</th>
                      <th className="py-4 px-6 text-center text-emerald-400">R2: BLOCK PULL</th>
                      <th className="py-4 px-6 text-center text-red-400">R3: ROBO WAR</th>
                      <th className="py-4 px-6 text-right font-bold text-amber-400">TOTAL SCORE</th>
                    </>
                  ) : (
                    <th className="py-4 px-6 text-right font-bold text-amber-400">{roundMeta!.label} SCORE</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200 text-sm">
                {displayRows.length === 0 ? (
                  <tr>
                    <td colSpan={filter === 'all' ? 7 : 4} className="py-12 text-center text-slate-500">
                      Awaiting initial score publication...
                    </td>
                  </tr>
                ) : (
                  displayRows.slice(0, 10).map((entry) => {
                    const isGold = entry.rank === 1;
                    const isSilver = entry.rank === 2;
                    const isBronze = entry.rank === 3;
                    const isTied = entry.isTied;

                    return (
                      <tr 
                        key={entry.school.id}
                        className={`transition ${
                          isGold 
                            ? 'bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent font-semibold' 
                            : isSilver 
                              ? 'bg-slate-800/30'
                              : isBronze 
                                ? 'bg-amber-900/10'
                                : 'hover:bg-slate-800/20'
                        }`}
                      >
                        {/* Rank Badge with TIE support */}
                        <td className="py-4 px-6 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <span
                              className={`inline-flex items-center justify-center min-w-[36px] h-9 px-2 rounded-full font-display font-black text-sm ${
                                isGold
                                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30'
                                  : isSilver
                                    ? 'bg-slate-200 text-slate-950 shadow-md'
                                    : isBronze
                                      ? 'bg-amber-800 text-amber-100 shadow'
                                      : 'text-slate-400 bg-slate-800/80 font-mono font-bold'
                              }`}
                            >
                              {isTied ? `T-${entry.rank}` : entry.rank}
                            </span>
                            {isTied && (
                              <span className="text-[10px] font-bold text-amber-400 font-mono mt-0.5">
                                TIED
                              </span>
                            )}
                          </div>
                        </td>

                        {/* School & Team */}
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <span className="text-base sm:text-lg font-bold text-white tracking-wide">
                              {entry.school.name}
                            </span>
                            {isGold && <Trophy className="w-4 h-4 text-amber-400" />}
                            {isTied && (
                              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold font-mono">
                                TIE
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-blue-300 font-semibold flex items-center space-x-2 mt-0.5">
                            <span className="font-mono text-slate-400">{entry.school.teamNumber}</span>
                            <span>•</span>
                            <span>{entry.school.teamName}</span>
                          </div>
                        </td>

                        {/* City */}
                        <td className="py-4 px-6 text-slate-400 text-xs">
                          {entry.school.city}
                        </td>

                        {filter === 'all' ? (
                          <>
                            {/* R1 (Blue) */}
                            <td className="py-4 px-6 text-center font-mono">
                              <span className="px-2.5 py-1 rounded-lg bg-blue-950/80 border border-blue-800 text-blue-300 font-bold text-xs">
                                {entry.round1Score}
                              </span>
                            </td>

                            {/* R2 (Green) */}
                            <td className="py-4 px-6 text-center font-mono">
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-bold text-xs">
                                {entry.round2Score}
                              </span>
                            </td>

                            {/* R3 (Red) */}
                            <td className="py-4 px-6 text-center font-mono">
                              <span className="px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-800 text-red-300 font-bold text-xs">
                                {entry.round3Score}
                              </span>
                            </td>

                            {/* Total (Gold) */}
                            <td className="py-4 px-6 text-right font-mono font-black text-xl sm:text-2xl text-amber-400">
                              {entry.totalScore}
                              <span className="text-xs font-normal text-slate-400 ml-1">pts</span>
                            </td>
                          </>
                        ) : (
                          /* Single Round Score (Gold) */
                          <td className="py-4 px-6 text-right font-mono font-black text-xl sm:text-2xl text-amber-400">
                            {filter === 1 ? entry.round1Score : filter === 2 ? entry.round2Score : entry.round3Score}
                            <span className="text-xs font-normal text-slate-400 ml-1">pts</span>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 pt-4 flex items-center justify-between text-xs font-mono text-slate-400">
        <div>BHARAT ROBOTICS LEAGUE 2026 • OFFICIAL LEADERBOARD SYSTEM</div>
        <div>STRICT TOTAL SCORE RANKING • NO ASSUMED TIE-BREAKS</div>
      </footer>
    </div>
  );
};
