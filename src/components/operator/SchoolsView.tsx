import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Users, 
  Database,
  Building,
  MapPin,
  Download
} from 'lucide-react';
import { useCompetition } from '../../context/CompetitionContext';
import { School } from '../../types';
import { downloadTournamentBackup } from '../../utils/backup';

export const SchoolsView: React.FC = () => {
  const { 
    state, 
    addSchool, 
    editSchool, 
    deleteSchool, 
    clearAllSchools 
  } = useCompetition();

  const [searchQuery, setSearchQuery] = useState('');
  // A team has played Round 3 once it has been in a published match, even if it lost and scored 0.
  const round3PlayedIds = new Set<string>();
  state.robotWarMatches.forEach(m => {
    if (m.status === 'completed' && !m.isDraft) {
      round3PlayedIds.add(m.teamAId);
      round3PlayedIds.add(m.teamBId);
    }
  });

  const [filterCategory, setFilterCategory] = useState<'all' | 'r1_done' | 'r2_done' | 'r3_done' | 'not_played' | 'active'>('all');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [deletingSchoolId, setDeletingSchoolId] = useState<string | null>(null);
  const [isConfirmClearAll, setIsConfirmClearAll] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    teamName: '',
    teamNumber: '',
    city: '',
    students: '',
    isActive: true
  });

  const handleOpenAdd = () => {
    const nextNum = String(state.schools.length + 1).padStart(2, '0');
    setFormData({
      name: '',
      teamName: '',
      teamNumber: `BRL-26-${nextNum}`,
      city: '',
      students: '',
      isActive: true
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (school: School) => {
    setEditingSchool(school);
    setFormData({
      name: school.name,
      teamName: school.teamName,
      teamNumber: school.teamNumber,
      city: school.city,
      students: school.students.join(', '),
      isActive: school.isActive
    });
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.teamName.trim()) return;

    addSchool({
      name: formData.name.trim(),
      teamName: formData.teamName.trim(),
      teamNumber: formData.teamNumber.trim() || `BRL-${Date.now().toString().slice(-4)}`,
      city: formData.city.trim() || 'India',
      students: formData.students.split(',').map(s => s.trim()).filter(Boolean),
      isActive: formData.isActive
    });
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchool || !formData.name.trim()) return;

    editSchool(editingSchool.id, {
      name: formData.name.trim(),
      teamName: formData.teamName.trim(),
      teamNumber: formData.teamNumber.trim(),
      city: formData.city.trim(),
      students: formData.students.split(',').map(s => s.trim()).filter(Boolean),
      isActive: formData.isActive
    });
    setEditingSchool(null);
  };

  const handleDelete = (id: string) => {
    deleteSchool(id);
    setDeletingSchoolId(null);
  };

  // Filter & Search Logic
  const filteredSchools = state.schools.filter(school => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      school.name.toLowerCase().includes(query) ||
      school.teamName.toLowerCase().includes(query) ||
      school.teamNumber.toLowerCase().includes(query) ||
      school.city.toLowerCase().includes(query) ||
      school.students.some(st => st.toLowerCase().includes(query));

    if (!matchesSearch) return false;

    const score = state.scores[school.id];
    const hasR1 = score?.round1 && !score.round1.isDraft;
    const hasR2 = score?.round2 && !score.round2.isDraft;
    const hasR3 = round3PlayedIds.has(school.id);

    if (filterCategory === 'active') return school.isActive;
    if (filterCategory === 'r1_done') return hasR1;
    if (filterCategory === 'r2_done') return hasR2;
    if (filterCategory === 'r3_done') return hasR3;
    if (filterCategory === 'not_played') return !hasR1 && !hasR2 && !hasR3;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Master Data Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-5 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <Building className="w-4 h-4" />
            <span>Master Data Management</span>
          </div>
          <h2 className="text-xl font-display font-bold text-white">
            Participating Schools & Teams ({state.schools.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure participating institutions before or during the competition.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsConfirmClearAll(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/50 text-xs font-semibold rounded-xl transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add School</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search school, team, ID, city, pilot..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto text-xs">
          {[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active Only' },
            { id: 'r1_done', label: 'R1 Done' },
            { id: 'r2_done', label: 'R2 Done' },
            { id: 'r3_done', label: 'R3 Done' },
            { id: 'not_played', label: 'Not Yet Played' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterCategory(f.id as any)}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap font-medium transition ${
                filterCategory === f.id
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Schools Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Team ID</th>
                <th className="py-3 px-4">School Name</th>
                <th className="py-3 px-4">Robotics Team</th>
                <th className="py-3 px-4">City / Region</th>
                <th className="py-3 px-4">Student Members</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Rounds Played</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredSchools.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No schools matching your search or filter.
                  </td>
                </tr>
              ) : (
                filteredSchools.map((school) => {
                  const score = state.scores[school.id];
                  const hasR1 = !!(score?.round1 && !score.round1.isDraft);
                  const hasR2 = !!(score?.round2 && !score.round2.isDraft);
                  const hasR3 = round3PlayedIds.has(school.id);

                  return (
                    <tr key={school.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">
                        {school.teamNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-white max-w-xs truncate">
                        {school.name}
                      </td>
                      <td className="py-3 px-4 text-cyan-300 font-medium">
                        {school.teamName}
                      </td>
                      <td className="py-3 px-4 text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{school.city}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                        {school.students.length > 0 ? school.students.join(', ') : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            school.isActive
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-700 text-slate-400'
                          }`}
                        >
                          {school.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center space-x-1 font-mono text-[11px]">
                          <span className={`px-1.5 py-0.5 rounded ${hasR1 ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'bg-slate-800 text-slate-600'}`}>
                            R1
                          </span>
                          <span className={`px-1.5 py-0.5 rounded ${hasR2 ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'bg-slate-800 text-slate-600'}`}>
                            R2
                          </span>
                          <span className={`px-1.5 py-0.5 rounded ${hasR3 ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'bg-slate-800 text-slate-600'}`}>
                            R3
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleOpenEdit(school)}
                            className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition"
                            title="Edit School"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingSchoolId(school.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                            title="Delete School"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Add School Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-display font-bold text-white">Add Participating School</h3>
            <form onSubmit={handleSaveAdd} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">School Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Modern High School"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Team Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Predators"
                    value={formData.teamName}
                    onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Team ID / Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="BRL-26-XX"
                    value={formData.teamNumber}
                    onChange={(e) => setFormData({ ...formData, teamNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">City / Region</label>
                <input
                  type="text"
                  placeholder="e.g. New Delhi, DL"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Student Members (comma-separated)</label>
                <input
                  type="text"
                  placeholder="Aarav Sharma, Rohan V, Tanya K"
                  value={formData.students}
                  onChange={(e) => setFormData({ ...formData, students: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="addActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0"
                />
                <label htmlFor="addActive" className="text-slate-300 cursor-pointer">
                  Mark as Active in Competition
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition"
                >
                  Save School
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit School Modal */}
      {editingSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-display font-bold text-white">Edit School Details</h3>
            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">School Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Team Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.teamName}
                    onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Team ID / Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.teamNumber}
                    onChange={(e) => setFormData({ ...formData, teamNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">City / Region</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Student Members (comma-separated)</label>
                <input
                  type="text"
                  value={formData.students}
                  onChange={(e) => setFormData({ ...formData, students: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="editActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0"
                />
                <label htmlFor="editActive" className="text-slate-300 cursor-pointer">
                  Mark as Active
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSchool(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Safety Rule) */}
      {deletingSchoolId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-rose-600/50 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h4 className="text-base font-bold text-white">Delete School Confirmation</h4>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to delete this school and its associated scores? This cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setDeletingSchoolId(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingSchoolId)}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow-md transition"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Safety Confirmation */}
      {isConfirmClearAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-rose-600 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h4 className="text-base font-bold text-white">Clear All Master Records?</h4>
            </div>
            <p className="text-xs text-slate-300">
              This will remove all participating schools, match queues, and scores. This cannot be undone.
            </p>
              <button
                type="button"
                onClick={() => downloadTournamentBackup(state, 'Before_Clear_All')}
                className="w-full py-2 bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60 text-xs font-bold rounded-lg flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download a backup first (recommended)</span>
              </button>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsConfirmClearAll(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearAllSchools();
                  setIsConfirmClearAll(false);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow-md"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
