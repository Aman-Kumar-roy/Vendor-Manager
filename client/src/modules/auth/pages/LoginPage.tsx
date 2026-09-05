import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { Lock, Mail, ArrowRight, AlertCircle, ShieldCheck } from "lucide-react";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const companyName = import.meta.env.VITE_COMPANY_NAME || "Vasudha Polymer";

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || "/sellers";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailError(null);
    setPasswordError(null);

    let hasError = false;
    if (!email.trim()) {
      setEmailError("Admin email address is required");
      hasError = true;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Please enter a valid email address");
      hasError = true;
    }

    if (!password) {
      setPasswordError("Password is required");
      hasError = true;
    }

    if (hasError) return;

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

  return (
    <div className="min-h-screen bg-mesh-dark flex flex-col items-center justify-center py-12 px-4 sm:px-6 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-brand-500/10 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute bottom-10 right-10 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-[400px] mx-auto relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-1.5 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-glow">
            <div className="rounded-xl overflow-hidden shadow-inner" style={{ width: '72px', height: '72px', minWidth: '72px', minHeight: '72px' }}>
              <img src="/logo.jpg" alt={`${companyName} Logo`} className="w-full h-full object-cover" style={{ width: '72px', height: '72px' }} />
            </div>
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {companyName} Admin
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Vendor & Transaction Operations Hub
            </p>
          </div>
        </div>

        {/* Card Form */}
        <div
          className="glass-panel py-8 px-7 sm:px-8 shadow-card-elevated rounded-2xl border border-slate-800 space-y-5"
          style={{
            background: "var(--bg-card)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
          }}
        >
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5 flex items-start space-x-2.5 text-rose-300 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
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
                  value={email}
                  autoComplete="username"
                  style={{ colorScheme: 'dark' }}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
                  placeholder="admin@company.com"
                  className={`w-full bg-slate-950/80 border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all ${
                    emailError ? "border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500" : "border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  }`}
                />
              </div>
              {emailError && (
                <p className="text-xs text-rose-400 mt-1.5 font-medium">{emailError}</p>
              )}
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
                  value={password}
                  autoComplete="current-password"
                  style={{ colorScheme: 'dark' }}
                  onChange={(e) => { setPassword(e.target.value); setPasswordError(null); }}
                  placeholder="••••••••"
                  className={`w-full bg-slate-950/80 border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all ${
                    passwordError ? "border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500" : "border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  }`}
                />
              </div>
              {passwordError && (
                <p className="text-xs text-rose-400 mt-1.5 font-medium">{passwordError}</p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer shadow-glow"
                style={{
                  background: "linear-gradient(135deg, #0c8ce9 0%, #026ec7 100%)",
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
        </div>
      </div>
    </div>
  );
};
