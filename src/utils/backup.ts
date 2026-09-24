import { CompetitionState } from '../types';

// Saves the whole tournament record as a .json file on this computer. It can be restored later from
// Settings > Restore from Tournament Backup File.
export const downloadTournamentBackup = (state: CompetitionState, label: string = 'Backup') => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BRL_2026_${label}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
