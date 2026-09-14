import React, { useState } from 'react';
import { 
  Trophy, 
  Download, 
  Printer, 
  Search, 
  Medal, 
  Award, 
  Layers, 
  CheckCircle, 
  Sparkles,
  Tv,
  ArrowUpDown
} from 'lucide-react';
import { useCompetition } from '../../context/CompetitionContext';

interface LeaderboardViewProps {
  onShowWinnerMode?: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ onShowWinnerMode }) => {
  const { leaderboard, state, setDisplayState, triggerWinnerMode } = useCompetition();
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'rank' | 'total' | 'r1' | 'r2' | 'r3'>('rank');

  const filteredLeaderboard = leaderboard.filter(entry => {
    const q = search.toLowerCase();
    return (
      entry.school.name.toLowerCase().includes(q) ||
      entry.school.teamName.toLowerCase().includes(q) ||
      entry.school.teamNumber.toLowerCase().includes(q) ||
      entry.school.city.toLowerCase().includes(q)
    );
  });

  const handleExportCSV = () => {
    const headers = ['Rank', 'Team Number', 'School Name', 'Team Name', 'City', 'Round 1 (Push)', 'Round 2 (Pull)', 'Round 3 (War)', 'Total Points', 'Completed Runs'];
    const rows = leaderboard.map(e => [
      e.rank,
      `"${e.school.teamNumber}"`,
      `"${e.school.name}"`,
      `"${e.school.teamName}"`,
      `"${e.school.city}"`,
      e.round1Score,
      e.round2Score,
      e.round3Score,
      e.totalScore,
      e.completedRoundsCount
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BRL_2026_Official_Leaderboard_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-5 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <Trophy className="w-4 h-4" />
            <span>Official Rankings</span>
          </div>
          <h2 className="text-xl font-display font-bold text-white">
            COMPETITION LEADERBOARD & STANDINGS
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Deterministic standings calculated from published scores using official BRL tie-breaking rules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setDisplayState('leaderboard')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-semibold transition"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Show on Stage Display</span>
          </button>

          <button
            onClick={() => {
              if (onShowWinnerMode) onShowWinnerMode();
              else triggerWinnerMode();
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-md shadow-amber-500/20"
          >
            <Award className="w-4 h-4" />
            <span>Grand Champion Ceremony</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
            title="Export official CSV"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
            title="Print Official Score Sheet"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Podium Cards for Top 3 */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Rank 2 (Silver) */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between order-2 md:order-1">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-display font-bold text-sm text-slate-200 shadow">
                #2
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Medal className="w-3.5 h-3.5 text-slate-300" /> 1st Runner-Up
              </span>
            </div>
            <div className="my-4">
              <div className="text-lg font-display font-bold text-white leading-tight">
                {leaderboard[1].school.name}
              </div>
              <div className="text-xs text-cyan-300 mt-1">
                {leaderboard[1].school.teamName} ({leaderboard[1].school.teamNumber})
              </div>
              <div className="text-[11px] text-slate-400">{leaderboard[1].school.city}</div>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between font-mono">
              <span className="text-xs text-slate-400">Total Points</span>
              <span className="text-2xl font-bold text-white">{leaderboard[1].totalScore} pts</span>
            </div>
          </div>

          {/* Rank 1 (Gold) */}
          <div className="bg-gradient-to-b from-[#1b1506] to-[#0f101d] border-2 border-amber-500/70 rounded-2xl p-6 relative overflow-hidden shadow-2xl shadow-amber-950/40 flex flex-col justify-between order-1 md:order-2 md:-translate-y-2">
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500"></div>
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-display font-bold text-base shadow-lg shadow-amber-500/30">
                #1
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Trophy className="w-4 h-4 text-amber-400" /> Grand Champion
              </span>
            </div>
            <div className="my-4">
              <div className="text-xl font-display font-bold text-white leading-tight">
                {leaderboard[0].school.name}
              </div>
              <div className="text-sm text-amber-300 font-semibold mt-1">
                {leaderboard[0].school.teamName} ({leaderboard[0].school.teamNumber})
              </div>
              <div className="text-xs text-slate-400">{leaderboard[0].school.city}</div>
            </div>
            <div className="pt-3 border-t border-amber-500/30 flex items-center justify-between font-mono">
              <span className="text-xs text-amber-200/80">Championship Score</span>
              <span className="text-3xl font-bold text-amber-400">{leaderboard[0].totalScore} pts</span>
            </div>
          </div>

          {/* Rank 3 (Bronze) */}
          <div className="bg-slate-900/90 border border-amber-900/50 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between order-3">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-full bg-amber-900/60 text-amber-300 flex items-center justify-center font-display font-bold text-sm shadow">
                #3
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1">
                <Medal className="w-3.5 h-3.5 text-amber-600" /> 2nd Runner-Up
              </span>
            </div>
            <div className="my-4">
              <div className="text-lg font-display font-bold text-white leading-tight">
                {leaderboard[2].school.name}
              </div>
              <div className="text-xs text-cyan-300 mt-1">
                {leaderboard[2].school.teamName} ({leaderboard[2].school.teamNumber})
              </div>
              <div className="text-[11px] text-slate-400">{leaderboard[2].school.city}</div>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between font-mono">
              <span className="text-xs text-slate-400">Total Points</span>
              <span className="text-2xl font-bold text-white">{leaderboard[2].totalScore} pts</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search school name, team, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <span>Tie-break rule: Total &gt; R3 &gt; R2 &gt; R1 &gt; Least Fouls</span>
        </div>
      </div>

      {/* Full Official Standings Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 text-center w-14">Rank</th>
                <th className="py-3.5 px-4">Team / School</th>
                <th className="py-3.5 px-4">Region</th>
                <th className="py-3.5 px-4 text-center">Round 1 (Push)</th>
                <th className="py-3.5 px-4 text-center">Round 2 (Pull)</th>
                <th className="py-3.5 px-4 text-center">Round 3 (War)</th>
                <th className="py-3.5 px-4 text-right font-bold text-amber-400">Total Points</th>
                <th className="py-3.5 px-4 text-center">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No teams found matching search.
                  </td>
                </tr>
              ) : (
                filteredLeaderboard.map((entry) => {
                  const isTop3 = entry.rank <= 3;

                  return (
                    <tr 
                      key={entry.school.id}
                      className={`hover:bg-slate-800/40 transition ${
                        entry.rank === 1 ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      {/* Rank badge */}
                      <td className="py-3.5 px-4 text-center font-display font-bold">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                            entry.rank === 1
                              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                              : entry.rank === 2
                                ? 'bg-slate-300 text-slate-950'
                                : entry.rank === 3
                                  ? 'bg-amber-800 text-amber-100'
                                  : 'text-slate-400 bg-slate-800'
                          }`}
                        >
                          {entry.rank}
                        </span>
                      </td>

                      {/* Team Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white max-w-sm truncate text-sm">
                          {entry.school.name}
                        </div>
                        <div className="text-[11px] text-cyan-300 font-medium truncate flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-slate-400">{entry.school.teamNumber}</span>
                          <span>•</span>
                          <span>{entry.school.teamName}</span>
                        </div>
                      </td>

                      {/* City */}
                      <td className="py-3.5 px-4 text-slate-400 text-xs">
                        {entry.school.city}
                      </td>

                      {/* R1 Score */}
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-cyan-300 font-semibold">
                          {entry.round1Score}
                        </span>
                      </td>

                      {/* R2 Score */}
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-amber-300 font-semibold">
                          {entry.round2Score}
                        </span>
                      </td>

                      {/* R3 Score */}
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-rose-300 font-semibold">
                          {entry.round3Score}
                        </span>
                      </td>

                      {/* Total Score */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-base text-amber-400">
                        {entry.totalScore}
                      </td>

                      {/* Runs Completed */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center space-x-1 text-[10px] font-mono">
                          <span className={`px-1 rounded ${entry.round1Score > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>
                            R1
                          </span>
                          <span className={`px-1 rounded ${entry.round2Score > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>
                            R2
                          </span>
                          <span className={`px-1 rounded ${entry.round3Score > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>
                            R3
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
