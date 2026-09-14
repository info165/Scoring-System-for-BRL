import React, { useState, useEffect } from 'react';
import { CompetitionProvider, useCompetition } from './context/CompetitionContext';
import { Header } from './components/common/Header';
import { DashboardView } from './components/operator/DashboardView';
import { LiveControlView } from './components/operator/LiveControlView';
import { SchoolsView } from './components/operator/SchoolsView';
import { Round1BlockPushView } from './components/operator/Round1BlockPushView';
import { Round2BlockPullView } from './components/operator/Round2BlockPullView';
import { Round3RobotWarView } from './components/operator/Round3RobotWarView';
import { LeaderboardView } from './components/operator/LeaderboardView';
import { ScoreHistoryView } from './components/operator/ScoreHistoryView';
import { SettingsView } from './components/operator/SettingsView';
import { PublicDisplay } from './components/display/PublicDisplay';
import { WinnerScreen } from './components/display/WinnerScreen';

function MainCompetitionApp() {
  const { state, setDisplayState } = useCompetition();

  // Determine initial view from URL query param or hash (e.g. ?mode=display or #display)
  const [activeView, setActiveView] = useState<'operator' | 'display'>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('mode') === 'display' || window.location.hash === '#display') {
        return 'display';
      }
    }
    return 'operator';
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showWinnerModal, setShowWinnerModal] = useState<boolean>(false);

  // Synchronize URL query parameter when view changes
  const handleSwitchView = (view: 'operator' | 'display') => {
    setActiveView(view);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (view === 'display') {
        url.searchParams.set('mode', 'display');
      } else {
        url.searchParams.delete('mode');
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  // If public display is active, render the dedicated public display screen
  if (activeView === 'display') {
    return (
      <PublicDisplay 
        onSwitchToOperator={() => handleSwitchView('operator')} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Central Header Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeView={activeView}
        setActiveView={handleSwitchView}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'dashboard' && (
          <DashboardView setActiveTab={setActiveTab} />
        )}

        {activeTab === 'live_control' && (
          <LiveControlView setActiveTab={setActiveTab} />
        )}

        {activeTab === 'schools' && (
          <SchoolsView />
        )}

        {activeTab === 'round_1' && (
          <Round1BlockPushView />
        )}

        {activeTab === 'round_2' && (
          <Round2BlockPullView />
        )}

        {activeTab === 'round_3' && (
          <Round3RobotWarView />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardView 
            onShowWinnerMode={() => setShowWinnerModal(true)} 
          />
        )}

        {activeTab === 'history' && (
          <ScoreHistoryView />
        )}

        {activeTab === 'settings' && (
          <SettingsView />
        )}
      </main>

      {/* Winner Mode Fullscreen Overlay when triggered */}
      {showWinnerModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950">
          <WinnerScreen onClose={() => setShowWinnerModal(false)} />
        </div>
      )}

      {/* Persistent Status Footer for Operator */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-3 px-6 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Broadcast Channel: <code className="text-cyan-400 font-mono">BRL_2026_SYNC_CHANNEL</code></span>
          <span>•</span>
          <span>Target Date: <strong>29 September 2026</strong></span>
        </div>
        <div className="flex items-center space-x-3 text-slate-400">
          <span>Active Display State: <strong className="text-amber-400 uppercase">{state.displayState}</strong></span>
          <span>•</span>
          <a 
            href="https://brl.org.in" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-amber-400 hover:underline"
          >
            brl.org.in
          </a>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <CompetitionProvider>
      <MainCompetitionApp />
    </CompetitionProvider>
  );
}
