import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { Lock, Mail, ArrowRight, AlertCircle, Sparkles, ShieldCheck } from "lucide-react";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || "/sellers";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoAdmin = () => {
    setEmail("admin@example.com");
    setPassword("admin123");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-mesh-dark flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute bottom-10 right-10 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px]" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center p-1 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-glow mb-3">
          <div className="w-16 h-16 rounded-xl overflow-hidden">
            <img src="/logo.jpg" alt="Vasudha Polymer Logo" className="w-full h-full object-cover" />
          </div>
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Vasudha Polymer Admin
        </h2>
        <p className="mt-1.5 text-xs text-slate-400 font-medium">
          Vendor & Transaction Operations Hub
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div
          className="glass-panel py-8 px-6 shadow-card-elevated rounded-2xl sm:px-10 border border-slate-800"
          style={{
            background: "var(--bg-card)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
          }}
        >
          {error && (
            <div className="mb-6 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-start space-x-3 text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Admin Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #0c8ce9 0%, #026ec7 100%)",
                  boxShadow: "0 0 24px rgba(12,140,233,0.45), inset 0 1px 0 rgba(255,255,255,0.15)",
                }}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Admin Hub</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Helper */}
          <div className="mt-6 pt-6 border-t border-slate-800/80">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
              <div className="text-xs">
                <p className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Seed Admin Credentials
                </p>
                <p className="text-slate-400 mt-0.5 font-mono text-[11px]">
                  admin@example.com / admin123
                </p>
              </div>
              <button
                type="button"
                onClick={fillDemoAdmin}
                className="text-xs text-brand-400 hover:text-brand-300 font-bold px-3 py-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20 hover:bg-brand-500/20 transition-all"
              >
                Auto Fill
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
