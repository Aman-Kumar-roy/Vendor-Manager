import React, { useState } from 'react';
import { Modal } from '../../../components/common/Modal';
import { CreateUserDto } from '../api';
import { UserPlus, Mail, Lock, User as UserIcon, Shield, Eye, EyeOff } from 'lucide-react';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserDto) => Promise<void>;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'manager'>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleClose = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('admin');
    setShowPassword(false);
    setFieldErrors({});
    setServerError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setFieldErrors({});

    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      });
      handleClose();
    } catch (err: any) {
      setServerError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Failed to create user account'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New User"
      subtitle="Create a new administrative or staff account with login credentials"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            form="add-user-form"
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 shadow-glow disabled:opacity-50 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating User...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create User</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <form id="add-user-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        {serverError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
            {serverError}
          </div>
        )}

        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Full Name <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <UserIcon className="w-4 h-4" />
            </div>
            <input
              id="user-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: '' }));
              }}
              placeholder="e.g. Rahul Sharma"
              className={`w-full bg-slate-950/80 border rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors ${
                fieldErrors.name
                  ? 'border-rose-500 focus:border-rose-500'
                  : 'border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
              }`}
            />
          </div>
          {fieldErrors.name && (
            <p className="text-xs text-rose-400 mt-1 font-medium">{fieldErrors.name}</p>
          )}
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Email Address <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: '' }));
              }}
              placeholder="rahul@vasudhapolymer.com"
              className={`w-full bg-slate-950/80 border rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors ${
                fieldErrors.email
                  ? 'border-rose-500 focus:border-rose-500'
                  : 'border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
              }`}
            />
          </div>
          {fieldErrors.email && (
            <p className="text-xs text-rose-400 mt-1 font-medium">{fieldErrors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Initial Password <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="user-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: '' }));
              }}
              placeholder="At least 6 characters"
              className={`w-full bg-slate-950/80 border rounded-xl pl-10 pr-10 py-2 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors ${
                fieldErrors.password
                  ? 'border-rose-500 focus:border-rose-500'
                  : 'border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="text-xs text-rose-400 mt-1 font-medium">{fieldErrors.password}</p>
          )}
          <p className="text-[11px] text-slate-400 mt-1">
            The user will use this email & password to sign in immediately.
          </p>
        </div>

        {/* Role Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Account Role <span className="text-rose-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: 'admin', label: 'Administrator', desc: 'Full System Access' },
              { id: 'manager', label: 'Manager', desc: 'Orders, Vendors & Edits' },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id as any)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  role === r.id
                    ? 'bg-brand-500/15 border-brand-500 text-white shadow-glow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <Shield className={`w-3.5 h-3.5 ${role === r.id ? 'text-brand-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold">{r.label}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{r.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
};
