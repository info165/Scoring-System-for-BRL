import { useState, useEffect, useRef } from 'react';
import { useCompetition } from '../context/CompetitionContext';
import { 
  playArenaStartSound, 
  playTenSecondWarningSound, 
  playTimeOverBuzzerSound, 
  formatBrlTimer,
  unlockAudioContext 
} from '../utils/arenaAudio';

export interface ArenaTimerHookReturn {
  remainingSeconds: number;
  formattedTime: string; // e.g. "01:20", "00:47", "00:00"
  status: 'idle' | 'running' | 'stopped' | 'time_over';
  isUrgent: boolean; // <= 10s and running
  isTimeOver: boolean;
  start: (duration?: number) => void;
  stop: () => void;
  reset: (duration?: number) => void;
  elapsedSeconds: number;
}

export function useArenaTimer(): ArenaTimerHookReturn {
  const { 
    state, 
    startArenaTimer, 
    stopArenaTimer, 
    resetArenaTimer, 
    currentSchool 
  } = useCompetition();

  const arenaTimer = state.arenaTimer || {
    status: 'idle',
    totalDurationSeconds: 120,
    remainingSeconds: 120,
    startTimestamp: null,
    stopTimestamp: null,
    round: 1,
    schoolId: currentSchool?.id || null
  };

  const calculateRemaining = (): number => {
    if (state.activeRun && (state.activeRun.status === 'STOPPED' || state.activeRun.status === 'PUBLISHED')) {
      return Math.max(0, state.activeRun.timeLeftSeconds);
    }
    if (arenaTimer.status === 'idle') {
      return arenaTimer.totalDurationSeconds || 120;
    }
    if (arenaTimer.status === 'stopped' || arenaTimer.status === 'time_over') {
      return Math.max(0, arenaTimer.remainingSeconds || 0);
    }
    if (arenaTimer.status === 'running' && arenaTimer.startTimestamp) {
      const elapsed = Math.floor((Date.now() - arenaTimer.startTimestamp) / 1000);
      return Math.max(0, (arenaTimer.totalDurationSeconds || 120) - elapsed);
    }
    return 120;
  };

  const [remainingSeconds, setRemainingSeconds] = useState<number>(calculateRemaining);
  const warnedRef = useRef<boolean>(false);
  const overRef = useRef<boolean>(false);

  // Synchronize on external state change
  useEffect(() => {
    const current = calculateRemaining();
    setRemainingSeconds(current);

    if (arenaTimer.status === 'idle') {
      warnedRef.current = false;
      overRef.current = false;
    }
  }, [arenaTimer.status, arenaTimer.startTimestamp, arenaTimer.totalDurationSeconds, arenaTimer.remainingSeconds]);

  // High-frequency tick when running
  useEffect(() => {
    if (arenaTimer.status !== 'running' || !arenaTimer.startTimestamp) return;

    const interval = setInterval(() => {
      const sec = calculateRemaining();
      setRemainingSeconds(sec);

      // Trigger 10-second warning sound once
      if (sec <= 10 && sec > 0 && !warnedRef.current) {
        warnedRef.current = true;
        playTenSecondWarningSound();
      }

      // Trigger Time Over sound and freeze
      if (sec === 0 && !overRef.current) {
        overRef.current = true;
        playTimeOverBuzzerSound();
        stopArenaTimer();
      }
    }, 150);

    return () => clearInterval(interval);
  }, [arenaTimer.status, arenaTimer.startTimestamp, arenaTimer.totalDurationSeconds, stopArenaTimer]);

  const handleStart = (duration: number = 120) => {
    unlockAudioContext();
    playArenaStartSound();
    warnedRef.current = false;
    overRef.current = false;
    startArenaTimer(1, currentSchool?.id, duration);
  };

  const handleStop = () => {
    const currentSec = calculateRemaining();
    setRemainingSeconds(currentSec);
    stopArenaTimer(currentSec);
  };

  const handleReset = (duration: number = 120) => {
    warnedRef.current = false;
    overRef.current = false;
    setRemainingSeconds(duration);
    resetArenaTimer(duration);
  };

  const total = arenaTimer.totalDurationSeconds || 120;
  const isTimeOver = remainingSeconds === 0 || arenaTimer.status === 'time_over';
  const isUrgent = remainingSeconds <= 10 && remainingSeconds > 0 && arenaTimer.status === 'running';

  return {
    remainingSeconds,
    formattedTime: formatBrlTimer(remainingSeconds),
    status: isTimeOver && arenaTimer.status !== 'idle' ? 'time_over' : arenaTimer.status,
    isUrgent,
    isTimeOver,
    start: handleStart,
    stop: handleStop,
    reset: handleReset,
    elapsedSeconds: Math.max(0, total - remainingSeconds)
  };
}
