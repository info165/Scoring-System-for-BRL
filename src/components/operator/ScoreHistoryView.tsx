import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Download, 
  ShieldCheck, 
  Filter, 
  Clock, 
  Send, 
  CheckCircle,
  FileText
} from 'lucide-react';
import { useCompetition } from '../../context/CompetitionContext';

export const ScoreHistoryView: React.FC = () => {
  const { state } = useCompetition();
  const [searchTerm, setSearchTerm] = useState('');
  const [roundFilter, setRoundFilter] = useState<string>('all');

  const logs = state.auditLog || [];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.schoolName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRound = 
      roundFilter === 'all' || 
      (log.round !== undefined && String(log.round) === roundFilter);

    return matchesSearch && matchesRound;
  });

  const handleExportLog = () => {
    const jsonStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BRL_2026_Audit_Trail_${new Date().toISOString().slice(0, 19)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-5 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Immutable Integrity Log</span>
          </div>
          <h2 className="text-xl font-display font-bold text-white">
            OFFICIAL SCORING AUDIT TRAIL
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Every published score, queue change, and referee decision is timestamped and recorded for complete competition transparency.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportLog}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Download Audit Log (.json)</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search action, school, referee notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Round Filter */}
        <div className="flex items-center space-x-1.5 text-xs">
          <span className="text-slate-400 mr-1">Filter Round:</span>
          {['all', '1', '2', '3'].map((r) => (
            <button
              key={r}
              onClick={() => setRoundFilter(r)}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                roundFilter === r
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {r === 'all' ? 'All' : `R${r}`}
            </button>
          ))}
        </div>
      </div>

      {/* Log Feed */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Total Recorded Events: <strong className="text-white">{filteredLogs.length}</strong></span>
          <span>Event Date: 29 September 2026</span>
        </div>

        <div className="divide-y divide-slate-800/80 max-h-[600px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No audit logs recorded for this criteria.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const formattedTime = new Date(log.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              });

              return (
                <div key={log.id} className="p-4 hover:bg-slate-800/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[11px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 font-bold">
                        {log.action}
                      </span>
                      {log.round && (
                        <span className="font-mono text-[10px] text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded">
                          Round {log.round}
                        </span>
                      )}
                      {log.schoolName && (
                        <span className="font-bold text-white">
                          {log.schoolName}
                        </span>
                      )}
                    </div>
                    <div className="text-slate-300 text-[11px] pl-0.5">
                      {log.details}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-slate-400 font-mono text-[11px] self-end sm:self-auto flex-shrink-0">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formattedTime}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
