import React from 'react';
import { 
  Bot, 
  Tv, 
  ExternalLink, 
  Play, 
  Pause, 
  Trophy, 
  SkipForward, 
  RotateCcw, 
  ShieldCheck,
  Cloud,
  CloudOff,
  RefreshCw
} from 'lucide-react';
import { useCompetition } from '../../context/CompetitionContext';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { 
    state, 
    setCompetitionStatus, 
    advanceQueue, 
    triggerWinnerMode, 
    currentSchool,
    undoLastAction,
    canUndo,
    isDisplayMode,
    setIsDisplayMode,
    isFirebaseConnected,
    isFirebaseSyncing,
    lastCloudSync,
    forceCloudSync
  } = useCompetition();

  const openDisplayInNewTab = () => {
    window.open(`${window.location.origin}${window.location.pathname}?mode=display`, '_blank');
  };

  return (
    <header className="bg-[#0b1329] border-b border-slate-800 sticky top-0 z-40 shadow-xl">
      {/* Top Branding Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Logo & League Branding */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 flex items-center justify-center shadow-lg shadow-orange-500/20 border border-amber-400/40">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-display font-bold text-lg sm:text-xl tracking-wider text-white uppercase">
                  Bharat Robotics League
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  BRL 2026
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <span className="text-amber-400 font-medium">29 SEPTEMBER 2026</span>
                <span>•</span>
                <span className="flex items-center text-slate-400">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span>
                  Official Scoring System
                </span>
              </div>
            </div>
          </div>

          {/* Quick Arena Status & Live Action Bar */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* Status Selector */}
            <div className="flex items-center bg-slate-900/80 rounded-lg p-1 border border-slate-700/60">
              <button
                onClick={() => setCompetitionStatus('live')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
                  state.status === 'live' 
                    ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30 animate-pulse' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-white"></span>
                <span>LIVE</span>
              </button>
              <button
                onClick={() => setCompetitionStatus('paused')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  state.status === 'paused' 
                    ? 'bg-amber-600 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Pause className="w-3 h-3" />
                <span>PAUSED</span>
              </button>
              <button
                onClick={() => setCompetitionStatus('completed')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  state.status === 'completed' 
                    ? 'bg-emerald-600 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                <span>COMPLETED</span>
              </button>
            </div>

            {/* Quick Next Team Button */}
            {currentSchool && (
              <button
                onClick={advanceQueue}
                title={`Advance to next team. Currently: ${currentSchool.name}`}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-all hover:border-slate-500"
              >
                <SkipForward className="w-3.5 h-3.5 text-cyan-400" />
                <span>Next Team</span>
              </button>
            )}

            {/* Quick Winner Mode Trigger */}
            <button
              onClick={() => triggerWinnerMode()}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-amber-600/20"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Show Winner</span>
            </button>

            {/* Undo */}
            {canUndo && (
              <button
                onClick={undoLastAction}
                title="Undo last action"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-800 transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* View Mode Switching & Launch Public Display Window */}
          <div className="flex items-center space-x-2">
            {/* Real-time Firebase Cloud Sync Badge */}
            <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 bg-slate-900/90 border border-slate-700/70 rounded-lg text-xs">
              {isFirebaseSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              ) : isFirebaseConnected ? (
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              ) : (
                <CloudOff className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className={`font-mono text-[11px] font-semibold ${isFirebaseConnected ? 'text-emerald-300' : 'text-slate-400'}`}>
                {isFirebaseSyncing ? 'Syncing...' : isFirebaseConnected ? 'Cloud Realtime' : 'Connecting...'}
              </span>
              <button
                onClick={() => forceCloudSync()}
                disabled={isFirebaseSyncing}
                title={`Last synced: ${lastCloudSync || 'Active'}. Click to push full sync`}
                className="p-0.5 text-slate-400 hover:text-emerald-300 transition rounded"
              >
                <RefreshCw className="w-2.5 h-2.5" />
              </button>
            </div>

            <button
              onClick={openDisplayInNewTab}
              title="Launch Public Display in a new separate window (ideal for HDMI projector/LED wall)"
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-semibold transition-all"
            >
              <Tv className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open Display (HDMI Tab)</span>
              <ExternalLink className="w-3 h-3 text-cyan-400" />
            </button>

            <button
              onClick={() => setIsDisplayMode(!isDisplayMode)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                isDisplayMode 
                  ? 'bg-amber-500 text-black border-amber-400 font-bold' 
                  : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
              }`}
            >
              {isDisplayMode ? 'Back to Operator' : 'Preview Display'}
            </button>
          </div>

        </div>

        {/* Navigation Tabs (Shown in Operator Mode) */}
        {!isDisplayMode && (
          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2 border-t border-slate-800/80 no-scrollbar text-xs sm:text-sm">
            {[
              { id: 'dashboard', label: '1. Dashboard' },
              { id: 'live_control', label: '2. Live Control & Queue' },
              { id: 'schools', label: '3. Schools / Teams' },
              { id: 'round_1', label: '4. Round 1: Block Push' },
              { id: 'round_2', label: '5. Round 2: Block Pull' },
              { id: 'round_3', label: '6. Round 3: Robot War' },
              { id: 'leaderboard', label: '7. Leaderboard' },
              { id: 'score_history', label: '8. Score History' },
              { id: 'display_view', label: '9. Display Mode' },
              { id: 'settings', label: '10. Settings & Rules' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};
