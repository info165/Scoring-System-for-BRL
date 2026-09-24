import React, { useState, useEffect } from 'react';
import { Maximize2, Minimize2, Settings, ArrowLeft } from 'lucide-react';
import { useCompetition } from '../../context/CompetitionContext';
import { WelcomeScreen } from './WelcomeScreen';
import { RoundOverviewScreen } from './RoundOverviewScreen';
import { NowPlayingScreen } from './NowPlayingScreen';
import { ResultRevealScreen } from './ResultRevealScreen';
import { LeaderboardScreen } from './LeaderboardScreen';
import { RobotWarScreen } from './RobotWarScreen';
import { WinnerScreen } from './WinnerScreen';

interface PublicDisplayProps {
  onSwitchToOperator?: () => void;
}

export const PublicDisplay: React.FC<PublicDisplayProps> = ({ onSwitchToOperator }) => {
  const { state, setDisplayState, setLeaderboardFilter } = useCompetition();
  // True for both the on-screen full-screen button and the browser's F11 mode. While it is true the
  // whole control bar is removed, so the audience never sees operator controls.
  const detectFullscreen = () =>
    typeof window !== 'undefined' && (
      !!document.fullscreenElement ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      // F11 mode: the page fills the screen. The outer size is checked too because the inner size
      // shrinks when the browser is zoomed.
      (window.innerWidth >= window.screen.width && window.innerHeight >= window.screen.height) ||
      (window.outerWidth >= window.screen.width - 1 && window.outerHeight >= window.screen.height - 1)
    );
  const [isFullscreen, setIsFullscreen] = useState<boolean>(detectFullscreen);

  useEffect(() => {
    const update = () => setIsFullscreen(detectFullscreen());
    const media = window.matchMedia('(display-mode: fullscreen)');
    document.addEventListener('fullscreenchange', update);
    window.addEventListener('resize', update);
    media.addEventListener('change', update);
    update();
    return () => {
      document.removeEventListener('fullscreenchange', update);
      window.removeEventListener('resize', update);
      media.removeEventListener('change', update);
    };
  }, []);
  const [showControls, setShowControls] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-white select-none">
      {/* Active Screen Selection */}
      {state.displayState === 'welcome' && <WelcomeScreen />}
      {state.displayState === 'current_round' && <RoundOverviewScreen />}
      {state.displayState === 'live_run' && <NowPlayingScreen />}
      {state.displayState === 'result_reveal' && <ResultRevealScreen />}
      {state.displayState === 'leaderboard' && <LeaderboardScreen />}
      {state.displayState === 'robot_war' && <RobotWarScreen />}
      {state.displayState === 'winner' && <WinnerScreen />}

      {/* Floating Hover Controls (Discreet for Stage Techs) */}
      {!isFullscreen && (
      <div 
        className="fixed bottom-4 right-4 z-50 transition-opacity duration-300"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <div className={`flex items-center space-x-2 bg-slate-900/90 border border-slate-700/80 backdrop-blur-md p-2 rounded-2xl shadow-2xl transition-all ${
          showControls ? 'opacity-100' : 'opacity-20 hover:opacity-100'
        }`}>
          {onSwitchToOperator && (
            <button
              onClick={onSwitchToOperator}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl flex items-center space-x-1.5 transition"
              title="Return to Operator Control Panel"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Operator Panel</span>
            </button>
          )}

          {/* Quick Screen Picker */}
          <select
            value={state.displayState}
            onChange={(e) => setDisplayState(e.target.value as any)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none"
          >
            <option value="welcome">1. Welcome</option>
            <option value="current_round">2. Round Overview</option>
            <option value="live_run">3. Now Playing</option>
            <option value="leaderboard">4. Leaderboard</option>
            <option value="robot_war">5. Robot War</option>
            <option value="winner">6. Winner Podium</option>
          </select>

          {/* Leaderboard Round Filter (only relevant on the Leaderboard screen) */}
          {state.displayState === 'leaderboard' && (
            <select
              value={state.leaderboardFilter || 'all'}
              onChange={(e) => setLeaderboardFilter((e.target.value === 'all' ? 'all' : Number(e.target.value)) as any)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none"
              title="Leaderboard scope"
            >
              <option value="all">All Rounds</option>
              <option value="1">Round 1 Only</option>
              <option value="2">Round 2 Only</option>
              <option value="3">Round 3 Only</option>
            </select>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl transition"
            title="Toggle Fullscreen (F11)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
      )}
    </div>
  );
};
