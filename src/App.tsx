import React, { useState, useEffect } from 'react';
import { CompetitionProvider, useCompetition } from './context/CompetitionContext';
import { AuthProvider, useAuth } from './context/AuthContext';
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
import { UserManagementView } from './components/operator/UserManagementView';
import { LoginPage } from './components/auth/LoginPage';
import { PublicDisplay } from './components/display/PublicDisplay';
import { WinnerScreen } from './components/display/WinnerScreen';
import { ShieldAlert } from 'lucide-react';

function MainCompetitionApp() {
  const { state, setDisplayState, cloudStatus, cloudError, undoNotice, dismissUndoNotice } = useCompetition();
  const { isAuthenticated, userRole, isLoading, currentUser } = useAuth();

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

  // If public display is active, render the dedicated public display screen WITHOUT requiring auth
  if (activeView === 'display') {
    return (
      <PublicDisplay 
        onSwitchToOperator={() => handleSwitchView('operator')} 
      />
    );
  }

  // Operator Auth Guard
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
        <img 
          src="/brl-logo.png" 
          alt="BRL Logo" 
          className="w-16 h-16 object-contain animate-pulse mb-4 drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]" 
        />
        <h2 className="text-lg font-display font-bold text-amber-400">BHARAT ROBOTICS LEAGUE 2026</h2>
        <p className="text-xs text-slate-400 font-mono mt-1">Verifying official credentials & role security...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginPage onOpenDisplay={() => handleSwitchView('display')} />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Editing is disabled until the tournament record has been read from the database */}
      {cloudStatus !== 'ready' && (
        <div className={`px-4 py-2 text-center text-xs font-bold border-b ${
          cloudStatus === 'error'
            ? 'bg-rose-950 text-rose-200 border-rose-800'
            : 'bg-amber-950 text-amber-200 border-amber-800'
        }`}>
          {cloudStatus === 'error'
            ? `Cannot reach the database, so nothing can be saved right now. Retrying automatically… ${cloudError ? `(${cloudError})` : ''}`
            : 'Connecting to the database… editing is disabled until the connection is ready.'}
        </div>
      )}

      {/* Explains why Undo was refused or removed (someone else changed the data) */}
      {undoNotice && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] max-w-xl w-[92%] flex items-start gap-3 px-4 py-3 rounded-xl border border-amber-500/60 bg-slate-900 text-amber-200 text-xs font-semibold shadow-2xl" role="status">
          <span className="flex-1">{undoNotice}</span>
          <button onClick={dismissUndoNotice} className="text-amber-400 hover:text-white font-bold" aria-label="Dismiss">OK</button>
        </div>
      )}

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
          userRole === 'EVALUATOR' ? (
            <RestrictedView role={userRole} neededRole="CONTROLLER or ADMIN" onRedirect={() => setActiveTab('round_1')} />
          ) : (
            <LiveControlView setActiveTab={setActiveTab} />
          )
        )}

        {activeTab === 'schools' && (
          userRole === 'EVALUATOR' ? (
            <RestrictedView role={userRole} neededRole="CONTROLLER or ADMIN" onRedirect={() => setActiveTab('round_1')} />
          ) : (
            <SchoolsView />
          )
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

        {(activeTab === 'history' || activeTab === 'score_history') && (
          <ScoreHistoryView />
        )}

        {activeTab === 'display_view' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center max-w-xl mx-auto space-y-4">
            <h3 className="text-lg font-display font-bold text-white">Arena Secondary Public Display</h3>
            <p className="text-xs text-slate-400">
              Launch the synchronized public arena view in full screen mode for projector or audience screens.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => handleSwitchView('display')}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition"
              >
                Switch to Display View
              </button>
              <button
                onClick={() => window.open(`${window.location.origin}${window.location.pathname}?mode=display`, '_blank')}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold rounded-xl text-xs border border-cyan-500/40 transition"
              >
                Open in New Tab (HDMI Screen)
              </button>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          userRole !== 'ADMIN' ? (
            <RestrictedView role={userRole} neededRole="ADMIN" onRedirect={() => setActiveTab('dashboard')} />
          ) : (
            <UserManagementView />
          )
        )}

        {activeTab === 'settings' && (
          userRole !== 'ADMIN' ? (
            <RestrictedView role={userRole} neededRole="ADMIN" onRedirect={() => setActiveTab('dashboard')} />
          ) : (
            <SettingsView />
          )
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

function RestrictedView({ role, neededRole, onRedirect }: { role: string | null; neededRole: string; onRedirect: () => void }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center max-w-lg mx-auto space-y-4 shadow-xl my-10">
      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-display font-bold text-white">Restricted Operator Area</h3>
      <p className="text-xs text-slate-400 leading-relaxed">
        Your current role (<strong className="text-amber-400">{role || 'GUEST'}</strong>) does not have permission to access this view. This section requires <strong className="text-cyan-300">{neededRole}</strong> privileges.
      </p>
      <button
        onClick={onRedirect}
        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition"
      >
        Return to Permitted Console
      </button>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CompetitionProvider>
        <MainCompetitionApp />
      </CompetitionProvider>
    </AuthProvider>
  );
}
