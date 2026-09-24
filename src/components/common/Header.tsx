import React from 'react';
import {
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
  RefreshCw,
  LogOut,
  User,
  ShieldAlert
} from 'lucide-react';
import { useCompetition } from '../../context/CompetitionContext';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeView?: 'operator' | 'display';
  setActiveView?: (view: 'operator' | 'display') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, activeView, setActiveView }) => {
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

  const { currentUser, userRole, logout, switchRoleQuickly } = useAuth();

  const openDisplayInNewTab = () => {
    window.open(`${window.location.origin}${window.location.pathname}?mode=display`, '_blank');
  };

  const allTabs = [
    { id: 'dashboard', label: '1. Dashboard', roles: ['ADMIN', 'CONTROLLER', 'EVALUATOR'] },
    { id: 'live_control', label: '2. Live Control & Queue', roles: ['ADMIN', 'CONTROLLER'] },
    { id: 'schools', label: '3. Schools / Teams', roles: ['ADMIN', 'CONTROLLER'] },
    { id: 'round_1', label: '4. Round 1: Robo Push', roles: ['ADMIN', 'CONTROLLER', 'EVALUATOR'] },
    { id: 'round_2', label: '5. Round 2: Robo Pull', roles: ['ADMIN', 'CONTROLLER', 'EVALUATOR'] },
    { id: 'round_3', label: '6. Round 3: Robo War', roles: ['ADMIN', 'CONTROLLER', 'EVALUATOR'] },
    { id: 'leaderboard', label: '7. Leaderboard', roles: ['ADMIN', 'CONTROLLER', 'EVALUATOR'] },
    { id: 'score_history', label: '8. Score History', roles: ['ADMIN', 'CONTROLLER', 'EVALUATOR'] },
    { id: 'display_view', label: '9. Display Mode', roles: ['ADMIN', 'CONTROLLER', 'EVALUATOR'] },
    { id: 'users', label: '10. User Management', roles: ['ADMIN'] },
    { id: 'settings', label: '11. Settings & Rules', roles: ['ADMIN'] },
  ];

  const visibleTabs = allTabs.filter(tab => !userRole || tab.roles.includes(userRole));

  return (
    <header className="bg-[#0b1329] border-b border-slate-800 sticky top-0 z-40 shadow-xl">
      {/* Top Branding Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-16 sm:min-h-18 py-2 gap-x-3">
          
          {/* Logo & League Branding */}
          <div className="flex items-center space-x-3.5">
            <img src="/brl-logo.png" alt="BRL Logo" className="w-12 h-12 object-contain drop-shadow-[0_0_10px_rgba(249,115,22,0.3)]" />
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
          <div className="hidden 2xl:flex items-center space-x-4">
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
            {/* Undo for screens too narrow for the quick action bar */}
            {canUndo && (
              <button
                onClick={undoLastAction}
                title="Undo last action"
                className="2xl:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-800 transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
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

            {/* Authenticated User Badge & Quick Role Switcher */}
            {currentUser && (
              <div className="flex items-center space-x-1.5 bg-slate-900/90 border border-slate-700/80 rounded-lg px-2 py-1">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${
                  userRole === 'ADMIN'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : userRole === 'CONTROLLER'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {userRole}
                </span>
                <span className="hidden xl:inline text-xs font-semibold text-slate-200 truncate max-w-[120px]">
                  {currentUser.displayName.split(' ')[0]}
                </span>

                {/* Quick Role Switcher */}
                <select
                  value={userRole}
                  onChange={(e) => switchRoleQuickly(e.target.value as UserRole)}
                  className="bg-slate-950 border border-slate-700 text-slate-300 text-[10px] font-mono rounded px-1 py-0.5 focus:outline-none"
                  title="Switch Active Role"
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="CONTROLLER">CTRL</option>
                  <option value="EVALUATOR">EVAL</option>
                </select>

                <button
                  onClick={logout}
                  title="Sign out of scoring console"
                  className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Navigation Tabs (Shown in Operator Mode, filtered by User Role) */}
        {!isDisplayMode && (
          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2 border-t border-slate-800/80 no-scrollbar text-xs sm:text-sm">
            {visibleTabs.map((tab) => (
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
