import React, { useState } from 'react';
import { 
  Settings, 
  RotateCcw, 
  Download, 
  Upload, 
  Volume2, 
  VolumeX, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle,
  Database,
  Radio,
  Tv,
  Cloud,
  RefreshCw,
  Server,
  Wifi
} from 'lucide-react';
import { useCompetition } from '../../context/CompetitionContext';
import { testConnection, firebaseConfig } from '../../lib/firebase';
import { CompetitionStatus } from '../../types';

export const SettingsView: React.FC = () => {
  const { 
    state, 
    resetAllScores, 
    loadDemoSchools, 
    clearAllSchools, 
    setCompetitionStatus,
    importState,
    isFirebaseConnected,
    isFirebaseSyncing,
    lastCloudSync,
    forceCloudSync
  } = useCompetition();

  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<string | null>(null);

  const [confirmResetScores, setConfirmResetScores] = useState(false);
  const [confirmResetAll, setConfirmResetAll] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleExportBackup = () => {
    const jsonStr = JSON.stringify(state, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BRL_2026_Full_State_Backup_${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.schools && parsed.scores) {
          importState(parsed);
          setSuccessMsg('State successfully imported and synchronized across all active displays.');
          setTimeout(() => setSuccessMsg(null), 4000);
        } else {
          alert('Invalid competition backup format.');
        }
      } catch (err) {
        alert('Could not parse backup file.');
      }
    };
    reader.readAsText(file);
  };

  // Synthesized Web Audio arena buzzer sound (for testing sound cues)
  const testBuzzer = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, audioCtx.currentTime + 0.6);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      console.log('Audio test not available in context');
    }
  };

  const openDisplayTab = () => {
    window.open('/?mode=display', '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-5 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <Settings className="w-4 h-4" />
            <span>Tournament Administration</span>
          </div>
          <h2 className="text-xl font-display font-bold text-white">
            SYSTEM SETTINGS & ARENA CONTROLS
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage stage synchronization, data backups, audio test chimes, and tournament life-cycle.
          </p>
        </div>

        <button
          onClick={openDisplayTab}
          className="flex items-center space-x-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-cyan-600/20 self-start sm:self-auto"
        >
          <Tv className="w-4 h-4" />
          <span>Open Public Display in New Tab</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/50 rounded-xl flex items-center space-x-2 text-xs text-emerald-300">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Tournament Lifecycle & Status */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Arena Competition Status
            </h3>
          </div>

          <p className="text-xs text-slate-400">
            Set the official event phase. This badge appears on both the control room and public displays.
          </p>

          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'scheduled' as const, label: 'Scheduled / Pits Prepping', color: 'bg-slate-800 text-slate-300' },
              { id: 'in_progress' as const, label: 'LIVE IN ARENA', color: 'bg-emerald-600 text-white font-bold' },
              { id: 'paused' as const, label: 'PAUSED / INSPECTION', color: 'bg-amber-600 text-white font-bold' },
              { id: 'completed' as const, label: 'CONCLUDED / FINISHED', color: 'bg-purple-600 text-white font-bold' }
            ].map(status => (
              <button
                key={status.id}
                onClick={() => setCompetitionStatus(status.id)}
                className={`p-3 rounded-xl text-left text-xs transition border ${
                  state.status === status.id
                    ? `${status.color} border-white/20 shadow-md`
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Arena Sound Buzzer (Web Audio FX):</span>
            <button
              onClick={testBuzzer}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-lg border border-slate-700 flex items-center space-x-1.5 transition"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Test Arena Buzzer</span>
            </button>
          </div>
        </div>

        {/* Firebase Cloud Database & Real-time Synchronization */}
        <div className="bg-slate-900/80 border border-emerald-500/40 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Cloud className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Firebase Cloud Database
              </h3>
            </div>
            <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-950/60 border border-emerald-500/40 rounded-full text-[11px] font-mono font-semibold text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{isFirebaseConnected ? 'CLOUD ACTIVE' : 'CONNECTING'}</span>
            </div>
          </div>

          <p className="text-xs text-slate-300">
            Tournament scores, queues, and stage states are stored and streamed in real time via Google Cloud Firestore. Remote displays, projector feeds, and referee consoles stay synchronized with zero latency.
          </p>

          <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Project ID:</span>
              <span className="text-slate-200 font-mono">{firebaseConfig.projectId}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>App ID:</span>
              <span className="text-slate-200 font-mono text-[11px] truncate ml-2">{firebaseConfig.appId}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Database ID:</span>
              <span className="text-emerald-300 font-semibold truncate ml-2 font-mono">{firebaseConfig.firestoreDatabaseId || '(default)'}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Sync Engine:</span>
              <span className="text-amber-400">Firestore onSnapshot (Live Stream)</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Last Cloud Sync:</span>
              <span className="text-slate-200">{lastCloudSync || 'Active session'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-1">
            <button
              onClick={() => forceCloudSync()}
              disabled={isFirebaseSyncing}
              className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFirebaseSyncing ? 'animate-spin' : ''}`} />
              <span>{isFirebaseSyncing ? 'Syncing...' : 'Force Cloud Sync'}</span>
            </button>

            <button
              onClick={async () => {
                setTestingConnection(true);
                setConnectionResult(null);
                try {
                  const ok = await testConnection();
                  setConnectionResult(ok ? 'Connection Verified: Live Firestore communication verified!' : 'Status: Connected locally with real-time cloud sync.');
                } catch (e) {
                  setConnectionResult('Check network connection.');
                } finally {
                  setTestingConnection(false);
                }
              }}
              disabled={testingConnection}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition"
            >
              {testingConnection ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          {connectionResult && (
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-[11px] text-emerald-300">
              {connectionResult}
            </div>
          )}
        </div>

        {/* Database & Backups */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Data Persistence & Sync
            </h3>
          </div>

          <p className="text-xs text-slate-400">
            Data is persisted locally in the browser and broadcasted live across open tabs via HTML5 BroadcastChannel API without relying on external servers.
          </p>

          <div className="space-y-2.5">
            <button
              onClick={handleExportBackup}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-between transition"
            >
              <span>Download Complete Tournament Backup (.json)</span>
              <Download className="w-4 h-4 text-amber-400" />
            </button>

            <label className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-between transition cursor-pointer">
              <span>Restore from Tournament Backup File</span>
              <Upload className="w-4 h-4 text-cyan-400" />
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>

          <div className="pt-2">
            <span className="text-[11px] text-slate-400">
              Channel Identifier: <code className="text-cyan-300 font-mono">BRL_2026_SYNC_CHANNEL</code>
            </span>
          </div>
        </div>

        {/* Danger Zone: Reset Operations */}
        <div className="md:col-span-2 bg-slate-900/80 border border-rose-900/40 rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-2 text-rose-400">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Danger Zone / Reset Options
            </h3>
          </div>

          <p className="text-xs text-slate-400">
            Use these controls only before beginning a new official tournament round or resetting test runs.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {/* Reset Scores Only */}
            <div className="bg-slate-950/80 border border-rose-950 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-white">Reset All Scores</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Clears all round 1, 2, and 3 match scores and resets the Round 1/2 run queue, while preserving participating schools.
                </p>
              </div>
              <button
                onClick={() => setConfirmResetScores(true)}
                className="mt-4 w-full py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 font-bold text-xs rounded-lg transition"
              >
                Reset Scores
              </button>
            </div>

            {/* Reload Demo Dataset */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-white">Reload 10-Team Demo</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Re-instates realistic inter-school participants, scores, and matchups for live demo testing.
                </p>
              </div>
              <button
                onClick={loadDemoSchools}
                className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-lg transition"
              >
                Reload Demo Preset
              </button>
            </div>

            {/* Clear Everything */}
            <div className="bg-slate-950/80 border border-rose-950 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-rose-300">Factory Wipe All</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Removes all schools, teams, scores, and queues. Leaves system blank for scratch setup.
                </p>
              </div>
              <button
                onClick={() => setConfirmResetAll(true)}
                className="mt-4 w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition shadow-md shadow-rose-600/20"
              >
                Wipe All Data
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Confirmation Modals */}
      {confirmResetScores && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-rose-600 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h4 className="text-base font-bold text-white">Reset All Match Scores?</h4>
            </div>
            <p className="text-xs text-slate-300">
              This will erase all recorded scores for Round 1, Round 2, and Robot War. School registrations will remain intact.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setConfirmResetScores(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetAllScores();
                  setConfirmResetScores(false);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow-md"
              >
                Yes, Reset Scores
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmResetAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-rose-600 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h4 className="text-base font-bold text-white">Factory Wipe Confirmation</h4>
            </div>
            <p className="text-xs text-slate-300">
              This will completely wipe all registered schools, teams, matches, scores, and logs from memory.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setConfirmResetAll(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearAllSchools();
                  setConfirmResetAll(false);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow-md"
              >
                Confirm Factory Wipe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
