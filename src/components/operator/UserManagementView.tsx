import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Key, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Mail
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AppUser, UserRole } from '../../types';

export const UserManagementView: React.FC = () => {
  const { listUsers, createUser, deleteUser, resetPassword, currentUser } = useAuth();

  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('EVALUATOR');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (e) {
      console.warn('Error loading users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setStatusMessage({ text: 'All fields are required.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      await createUser(name, email, password, role);
      setStatusMessage({ text: `User ${name} (${role}) created successfully!`, type: 'success' });
      setName('');
      setEmail('');
      setPassword('');
      setRole('EVALUATOR');
      setShowAddModal(false);
      await loadUsers();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to create user.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (user: AppUser) => {
    if (user.uid === currentUser?.uid) {
      alert('You cannot delete your own logged-in account.');
      return;
    }
    if (!confirm(`Are you sure you want to delete ${user.displayName} (${user.email})?`)) {
      return;
    }

    try {
      await deleteUser(user.uid);
      setStatusMessage({ text: `User ${user.displayName} removed.`, type: 'success' });
      await loadUsers();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to delete user.', type: 'error' });
    }
  };

  const handleResetPassword = async (targetEmail: string) => {
    try {
      await resetPassword(targetEmail);
      setStatusMessage({ text: `Password reset dispatched to ${targetEmail}.`, type: 'success' });
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Reset failed.', type: 'error' });
    }
  };

  const getRoleBadge = (userRole: UserRole) => {
    switch (userRole) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            ADMIN
          </span>
        );
      case 'CONTROLLER':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            CONTROLLER
          </span>
        );
      case 'EVALUATOR':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            EVALUATOR
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">
              User Management & Access Control
            </h2>
            <p className="text-xs text-slate-400">
              Manage tournament officials, controllers, and arena evaluators with RBAC roles
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadUsers}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Refresh user list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Notification banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
              : 'bg-rose-500/15 border border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-white font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* User Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Name</th>
                <th className="px-5 py-3.5">Email / User ID</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {users.map((user) => {
                const isSelf = user.uid === currentUser?.uid;
                return (
                  <tr key={user.uid} className="hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3.5 text-white flex items-center space-x-2">
                      <Shield className="w-3.5 h-3.5 text-slate-500" />
                      <span>{user.displayName}</span>
                      {isSelf && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          YOU
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 font-mono">{user.email}</td>
                    <td className="px-5 py-3.5">{getRoleBadge(user.role)}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center text-emerald-400 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span>
                        Active
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleResetPassword(user.email)}
                          title="Send Password Reset"
                          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>
                        {!isSelf && (
                          <button
                            onClick={() => handleDeleteUser(user)}
                            title="Delete User"
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-amber-400">
                <UserPlus className="w-5 h-5" />
                <h3 className="font-bold text-white text-base">Provision New Official Account</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Nair"
                  required
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="official@brl2026.org"
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider">
                  Temporary Password
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  minLength={4}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider">
                  System Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100"
                >
                  <option value="EVALUATOR">EVALUATOR (Tablet scoring, Start/Stop/Record/Publish)</option>
                  <option value="CONTROLLER">CONTROLLER (Arena queue, live match control, overrides)</option>
                  <option value="ADMIN">ADMIN (Full event administration, user management)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl uppercase tracking-wider shadow-md"
                >
                  {isSubmitting ? 'Saving...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
