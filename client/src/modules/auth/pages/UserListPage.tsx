import React, { useState, useEffect, useMemo } from 'react';
import { authApi, User, CreateUserDto } from '../api';
import { useAuth } from '../../../context/AuthContext';
import { AddUserModal } from '../components/AddUserModal';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { StatCard } from '../../../components/common/StatCard';
import { Badge } from '../../../components/common/Badge';
import {
  Users,
  ShieldCheck,
  UserPlus,
  Search,
  RefreshCw,
  AlertCircle,
  Trash2,
  Calendar,
  Mail,
  User as UserIcon,
} from 'lucide-react';

export const UserListPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Confirm / Alert dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const [alertDialog, setAlertDialog] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: '',
  });

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.getAdminUsers();
      if (response.success && response.data?.users) {
        setUsers(response.data.users);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load system users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (dto: CreateUserDto) => {
    const res = await authApi.createAdminUser(dto);
    if (res.success) {
      await fetchUsers();
    }
  };

  const handleDeleteUser = (targetUser: User) => {
    if (!isAdmin) {
      setAlertDialog({
        isOpen: true,
        message: 'Access Denied: Only users with the Administrator role have permission to delete user accounts.',
      });
      return;
    }

    if (targetUser.id === currentUser?.id) {
      setAlertDialog({
        isOpen: true,
        message: 'You cannot delete your own active administrator account.',
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Remove User Account',
      message: `Are you sure you want to delete "${targetUser.name}" (${targetUser.email})? They will no longer be able to log in to this portal. This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          await authApi.deleteAdminUser(targetUser.id);
          await fetchUsers();
        } catch (err: any) {
          setAlertDialog({
            isOpen: true,
            message:
              err.response?.data?.error ||
              err.response?.data?.message ||
              'Failed to delete user account. Please try again.',
          });
        }
      },
    });
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase().trim();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.role && u.role.toLowerCase().includes(q))
    );
  }, [users, searchQuery]);

  // Metrics
  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === 'admin').length;
    const managers = users.filter((u) => u.role === 'manager').length;
    return { total, admins, managers };
  }, [users]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-brand-400" />
            User Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage administrative credentials, system access, and roles
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-glow transition-all duration-200 cursor-pointer w-full sm:w-auto shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New User</span>
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Users"
          value={stats.total}
          icon={<Users className="w-5 h-5" />}
          accentColor="brand"
          subtitle="Registered accounts"
        />
        <StatCard
          title="Administrators"
          value={stats.admins}
          icon={<ShieldCheck className="w-5 h-5" />}
          accentColor="emerald"
          subtitle="Full portal privileges"
        />
        <StatCard
          title="Managers"
          value={stats.managers}
          icon={<UserIcon className="w-5 h-5" />}
          accentColor="indigo"
          subtitle="Operations & Edit Access"
        />
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Table Card */}
      <div
        className="rounded-2xl border transition-colors duration-200 overflow-hidden"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border-card)',
        }}
      >
        {/* Search & Actions Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or role..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              onClick={fetchUsers}
              disabled={loading}
              title="Refresh User List"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 bg-slate-950/40 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 sm:px-6">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading user accounts...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-300">No users found</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {searchQuery ? 'Try adjusting your search criteria' : 'Click "Add New User" to register the first account'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = u.id === currentUser?.id;
                  const roleBadgeVariant =
                    u.role === 'admin' ? 'emerald' : u.role === 'manager' ? 'brand' : 'slate';

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xs shadow-glow-sm shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-white text-sm">{u.name}</span>
                              {isCurrent && (
                                <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/40">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-1 text-slate-400 text-xs mt-0.5">
                              <Mail className="w-3 h-3 text-slate-500" />
                              <span className="font-mono">{u.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <Badge variant={roleBadgeVariant} size="sm">
                          {u.role ? u.role.toUpperCase() : 'ADMIN'}
                        </Badge>
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 text-slate-400">
                        <div className="flex items-center space-x-1.5 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>
                            {u.createdAt
                              ? new Date(u.createdAt).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '—'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteUser(u);
                            }}
                            disabled={isCurrent}
                            title={isCurrent ? 'You cannot delete your own active account' : 'Delete User'}
                            className={`p-2 rounded-xl transition-all ${
                              isCurrent
                                ? 'text-slate-600 cursor-not-allowed'
                                : 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer'
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-500 px-2 py-1 rounded bg-slate-900/60 border border-slate-800">
                            Read Only
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateUser}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Alert / Notification Dialog */}
      <ConfirmDialog
        isOpen={alertDialog.isOpen}
        title="Notice"
        message={alertDialog.message}
        confirmLabel="Understood"
        variant="info"
        onConfirm={() => setAlertDialog((prev) => ({ ...prev, isOpen: false }))}
        onCancel={() => setAlertDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
