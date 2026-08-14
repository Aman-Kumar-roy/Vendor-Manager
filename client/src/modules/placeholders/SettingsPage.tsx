import React from 'react';
import { Settings, ShieldCheck, Database, Key } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">System Settings</h2>
        <p className="text-xs text-slate-400 mt-1">Configure global application preferences, security, and database ORM settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">JWT Security & Expiry</h3>
          <p className="text-xs text-slate-400">
            Authentication tokens signed with HMAC SHA256 standard. Default expiration set to 7 days in environment configuration.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Database Swap Ready</h3>
          <p className="text-xs text-slate-400">
            Currently running on SQLite (`dev.db`). To migrate to PostgreSQL, simply change `provider = "postgresql"` in `schema.prisma`.
          </p>
        </div>
      </div>
    </div>
  );
};
