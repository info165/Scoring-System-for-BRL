import React, { useState } from 'react';
import { 
  Trophy, 
  Search, 
  Download, 
  Printer, 
  Medal, 
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';
import { useCompetition } from '../../context/CompetitionContext';

export const LeaderboardView: React.FC = () => {
  const { leaderboard, state, hasActiveTie } = useCompetition();
  const [search, setSearch] = useState('');

  const filteredLeaderboard = leaderboard.filter((entry) => {
    const q = search.toLowerCase();
    return (
      entry.school.name.toLowerCase().includes(q) ||
      entry.school.teamName.toLowerCase().includes(q) ||
      entry.school.teamNumber.toLowerCase().includes(q) ||
      entry.school.city.toLowerCase().includes(q)
    );
  });

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Rank',
      'Tie Status',
      'School Name',
      'Team Number',
      'Team Name',
      'City',
      'Round 1 Score (Push)',
      'Round 2 Score (Pull)',
      'Round 3 Score (War)',
      'Total Score'
    ];

    const rows = leaderboard.map((row) => [
      row.isTied ? `T-${row.rank}` : row.rank,
      row.isTied ? 'TIED' : 'CLEAR',
      `"${row.school.name.replace(/"/g, '""')}"`,
      row.school.teamNumber,
      `"${row.school.teamName.replace(/"/g, '""')}"`,
      `"${row.school.city.replace(/"/g, '""')}"`,
      row.round1Score,
      row.round2Score,
      row.round3Score,
      row.totalScore
    ]);

    const csvContent = [
      '# BHARAT ROBOTICS LEAGUE 2026 OFFICIAL TOURNAMENT STANDINGS',
      `# Generated: ${new Date().toISOString()}`,
      `# Rule: Ranked strictly by Total Score. Tied ranks remain flagged for organizer/referee resolution.`,
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BRL_2026_Official_Standings_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Print view
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-5 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <Trophy className="w-4 h-4" />
            <span>Official Tournament Standings</span>
          </div>
          <h2 className="text-xl font-display font-bold text-white">
            COMPETITION LEADERBOARD
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Rankings derived strictly from total score. Tied teams are flagged for organizer/referee decision.
          </p>
        </div>

        <div className="flex items-center space-x-2">
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

      {/* Active Tie Alert Banner */}
      {hasActiveTie && (
        <div className="bg-amber-950/60 border-2 border-amber-500/70 rounded-2xl p-4 flex items-center justify-between text-amber-200 text-xs">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <span className="font-bold uppercase tracking-wider text-amber-300 block">
                Official Tie Detected in Standings
              </span>
              <span>
                Multiple teams share identical total points. Under official BRL 2026 rules, no secondary metric is used to automatically break ties; tied teams remain flagged for referee or organizer resolution.
              </span>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold whitespace-nowrap ml-3">
            FLAGGED [TIE]
          </span>
        </div>
      )}

      {/* Podium Cards for Top 3 */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Rank 2 (Silver) */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between order-2 md:order-1">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-display font-bold text-sm text-slate-200 shadow">
                {leaderboard[1].isTied ? `T-2` : `#2`}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Medal className="w-3.5 h-3.5 text-slate-300" /> 1st Runner-Up
              </span>
            </div>
            <div className="my-4">
              <div className="text-lg font-display font-bold text-white leading-tight">
                {leaderboard[1].school.name}
              </div>
              <div className="text-xs text-blue-300 mt-1">
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
                {leaderboard[0].isTied ? `T-1` : `#1`}
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
                {leaderboard[2].isTied ? `T-3` : `#3`}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1">
                <Medal className="w-3.5 h-3.5 text-amber-600" /> 2nd Runner-Up
              </span>
            </div>
            <div className="my-4">
              <div className="text-lg font-display font-bold text-white leading-tight">
                {leaderboard[2].school.name}
              </div>
              <div className="text-xs text-blue-300 mt-1">
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
          <Info className="w-3.5 h-3.5 text-amber-400" />
          <span>Official Rule: Ranked strictly by Total Score. Ties remain flagged.</span>
        </div>
      </div>

      {/* Full Official Standings Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 text-center w-16">Rank</th>
                <th className="py-3.5 px-4">Team / School</th>
                <th className="py-3.5 px-4">City</th>
                <th className="py-3.5 px-4 text-center text-blue-400">R1: Block Push</th>
                <th className="py-3.5 px-4 text-center text-emerald-400">R2: Block Pull</th>
                <th className="py-3.5 px-4 text-center text-red-400">R3: Robo War</th>
                <th className="py-3.5 px-4 text-right font-bold text-amber-400">Total Points</th>
                <th className="py-3.5 px-4 text-center">Rounds Scored</th>
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
                        <div className="flex flex-col items-center justify-center">
                          <span
                            className={`inline-flex items-center justify-center px-2 py-0.5 min-w-[28px] h-7 rounded-full text-xs font-bold ${
                              entry.rank === 1
                                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                                : entry.rank === 2
                                  ? 'bg-slate-300 text-slate-950'
                                  : entry.rank === 3
                                    ? 'bg-amber-800 text-amber-100'
                                    : 'text-slate-400 bg-slate-800 font-mono'
                            }`}
                          >
                            {entry.isTied ? `T-${entry.rank}` : entry.rank}
                          </span>
                          {entry.isTied && (
                            <span className="text-[9px] font-bold text-amber-400 font-mono mt-0.5">
                              TIE
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Team Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white max-w-sm truncate text-sm">
                            {entry.school.name}
                          </span>
                          {entry.isTied && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold font-mono">
                              TIE
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-blue-300 font-medium truncate flex items-center gap-1.5 mt-0.5">
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
                        <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-blue-300 font-semibold">
                          {entry.round1Score}
                        </span>
                      </td>

                      {/* R2 Score */}
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-emerald-300 font-semibold">
                          {entry.round2Score}
                        </span>
                      </td>

                      {/* R3 Score */}
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-red-300 font-semibold">
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
                          <span className={`px-1.5 py-0.5 rounded ${entry.round1Score > 0 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-600'}`}>
                            R1
                          </span>
                          <span className={`px-1.5 py-0.5 rounded ${entry.round2Score > 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-600'}`}>
                            R2
                          </span>
                          <span className={`px-1.5 py-0.5 rounded ${entry.round3Score > 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-800 text-slate-600'}`}>
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
