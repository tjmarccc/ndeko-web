/// <reference types="vite/client" />
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Eye, EyeOff, ShoppingBag, Store, ArrowRight, Check, Loader2 } from 'lucide-react';
import { NdekoLogo } from '../components/NdekoLogo';
import { useAuth, extractApiErrorMessage } from '../contexts/AuthContext';

export function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const initialRole = searchParams.get('role') === 'business' ? 'business' : 'buyer';

  const [role, setRole] = useState<'buyer' | 'business'>(initialRole);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', businessName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingVerification, setPendingVerification] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        navigate(role === 'business' ? '/business' : '/');
      } else {
        const params: Parameters<typeof register>[0] = {
          name: form.name,
          email: form.email,
          password: form.password,
          role: role === 'business' ? 'SELLER' : 'BUYER',
        };
        if (role === 'business' && form.businessName) {
          params.business_name = form.businessName;
        }
        await register(params);
        setPendingVerification(true);
        setTimeout(() => navigate(role === 'business' ? '/business' : '/'), 2500);
      }
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const buyerPerks = [
    'Exclusive flash deals & cashback',
    'Track orders in real-time',
    'Save favourites to wishlist',
  ];
  const bizPerks = [
    'Full inventory management',
    'Sales analytics & reports',
    'Reach millions of buyers',
  ];

  return (
    <div className="min-h-screen flex" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── Left branding panel — hidden below lg ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[46%] p-12 relative overflow-hidden"
        style={{
          background:
            role === 'business'
              ? 'linear-gradient(145deg, #1A0812 0%, #3D0B1E 40%, #8B1538 80%, #3D9B8E 100%)'
              : 'linear-gradient(145deg, #2A0812 0%, #8B1538 50%, #D4828F 100%)',
          transition: 'background 0.8s ease',
        }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-[-60px] left-[-60px] w-64 h-64 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, rgba(212,130,143,0.6), transparent)' }}
          />
          <div
            className="absolute bottom-[-40px] right-[-40px] w-48 h-48 rounded-full opacity-25"
            style={{ background: 'radial-gradient(circle, rgba(61,155,142,0.7), transparent)' }}
          />
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }}
          />
        </div>

        <div className="relative z-10">
          <Link to="/">
            <NdekoLogo size="md" showTagline={true} />
          </Link>
        </div>

        <div className="relative z-10">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-semibold text-white/80"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            {role === 'business' ? '🏪 BUSINESS PORTAL' : '🛍️ BUYER PORTAL'}
          </div>

          <h2
            className="text-white mb-4 whitespace-pre-line"
            style={{
              fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
              fontWeight: 800,
              lineHeight: 1.15,
            }}
          >
            {role === 'business'
              ? 'Grow Your\nBusiness with Ndeko'
              : 'Shop Smarter,\nSave Bigger'}
          </h2>

          <p className="text-white/65 mb-8 text-sm" style={{ maxWidth: 340 }}>
            {role === 'business'
              ? 'Join thousands of Nigerian vendors selling on the fastest-growing marketplace.'
              : "Nigeria's #1 marketplace with millions of products and daily flash deals."}
          </p>

          <ul className="space-y-3">
            {(role === 'business' ? bizPerks : buyerPerks).map((perk, i) => (
              <li key={i} className="flex items-center gap-3 text-white/80 text-sm">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.2)' }}
                >
                  <Check className="h-3 w-3 text-white" />
                </span>
                {perk}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 text-white/40 text-xs">
          © 2026 Ndeko Express · All rights reserved
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-start lg:items-center justify-center bg-gray-50 dark:bg-gray-950 overflow-y-auto">
        {/*
          On mobile: py-8 gives breathing room top/bottom and allows the
          page to scroll naturally when the signup form is tall.
          On desktop: p-12 with items-center vertically centres it.
        */}
        <div className="w-full max-w-[420px] px-5 sm:px-8 py-8 lg:py-12">

          {/* Mobile-only header strip with gradient */}
          <div
            className="lg:hidden -mx-5 sm:-mx-8 -mt-8 mb-6 px-5 sm:px-8 pt-8 pb-6 relative overflow-hidden"
            style={{
              background:
                role === 'business'
                  ? 'linear-gradient(135deg, #1A0812 0%, #8B1538 100%)'
                  : 'linear-gradient(135deg, #2A0812 0%, #8B1538 100%)',
              transition: 'background 0.8s ease',
            }}
          >
            <div
              className="absolute top-[-30px] right-[-30px] w-40 h-40 rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle, rgba(212,130,143,0.8), transparent)' }}
            />
            <Link to="/" className="relative z-10 inline-block">
              <NdekoLogo size="sm" showTagline={false} />
            </Link>
            <p className="relative z-10 mt-2 text-white/60 text-xs">
              {role === 'business' ? '🏪 Business Portal' : '🛍️ Buyer Portal'}
            </p>
          </div>

          {/* Role toggle */}
          <div className="flex rounded-xl p-1 mb-6" style={{ background: '#F3F3F3' }}>
            {(['buyer', 'business'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => { setRole(r); setError(null); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200"
                style={{
                  background: role === r ? 'white' : 'transparent',
                  color: role === r ? '#8B1538' : '#9CA3AF',
                  boxShadow: role === r ? '0 1px 6px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {r === 'buyer'
                  ? <ShoppingBag className="h-3.5 w-3.5 flex-shrink-0" />
                  : <Store className="h-3.5 w-3.5 flex-shrink-0" />}
                <span>{r === 'buyer' ? 'Buyer Account' : 'Business Account'}</span>
              </button>
            ))}
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h1
              className="text-gray-900 dark:text-white mb-1 font-extrabold"
              style={{ fontSize: 'clamp(1.4rem, 5vw, 1.75rem)' }}
            >
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {mode === 'login'
                ? `Sign in to your ${role === 'business' ? 'business dashboard' : 'shopping account'}`
                : `Join Ndeko as a ${role === 'business' ? 'vendor/business' : 'buyer'}`}
            </p>
          </div>

          {/* Banners */}
          {pendingVerification && (
            <div
              className="mb-5 px-4 py-3 rounded-xl text-sm font-medium"
              style={{ background: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0' }}
            >
              ✅ Account created! Check your email to verify your address.
            </div>
          )}
          {error && (
            <div
              className="mb-5 px-4 py-3 rounded-xl text-sm font-medium"
              style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5' }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-[#8B1538]/30 focus:border-[#8B1538] transition-all"
                  required
                  autoComplete="name"
                />
              </div>
            )}

            {mode === 'signup' && role === 'business' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Business Name
                </label>
                <input
                  type="text"
                  placeholder="Your store / business name"
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-[#8B1538]/30 focus:border-[#8B1538] transition-all"
                  autoComplete="organization"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => { setForm({ ...form, email: e.target.value }); setError(null); }}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-[#8B1538]/30 focus:border-[#8B1538] transition-all"
                required
                autoComplete="email"
                inputMode="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                {mode === 'login' && (
                  <Link
                    to="/forgot-password"
                    className="text-xs text-[#8B1538] hover:underline"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => { setForm({ ...form, password: e.target.value }); setError(null); }}
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-[#8B1538]/30 focus:border-[#8B1538] transition-all"
                  required
                  minLength={mode === 'signup' ? 8 : undefined}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass
                    ? <EyeOff className="h-4 w-4" />
                    : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.99] mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #8B1538 0%, #D4828F 100%)',
                boxShadow: '0 4px 24px rgba(139,21,56,0.35)',
              }}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {mode === 'login'
                    ? `Sign in to ${role === 'business' ? 'Dashboard' : 'Shop'}`
                    : 'Create Account'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
            <span className="text-gray-400 text-xs">OR</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
          </div>

          {/* Google */}
          <GoogleButton role={role} mode={mode} />

          {/* Switch mode */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}
              className="text-[#8B1538] font-semibold hover:underline"
            >
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>

          <p className="text-center text-xs text-gray-400 mt-3 pb-2">
            <Link to="/" className="hover:underline">← Back to shopping</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Google sign-in button ──────────────────────────────────────────────────────

declare const google: {
  accounts: {
    id: {
      initialize: (cfg: { client_id: string; callback: (r: { credential: string }) => void }) => void;
      prompt: () => void;
    };
  };
};

function GoogleButton({
  role,
  mode,
}: {
  role: 'buyer' | 'business';
  mode: 'login' | 'signup';
}) {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleClick = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || typeof google === 'undefined') {
      setError('Google sign-in is not configured. Please use email/password.');
      return;
    }
    setLoading(true);
    setError(null);
    google.accounts.id.initialize({
      client_id: clientId,
      callback: async ({ credential }) => {
        try {
          await loginWithGoogle(
            credential,
            mode === 'signup' ? (role === 'business' ? 'SELLER' : 'BUYER') : undefined
          );
          navigate(role === 'business' ? '/business' : '/');
        } catch (err) {
          setError(extractApiErrorMessage(err));
        } finally {
          setLoading(false);
        }
      },
    });
    google.accounts.id.prompt();
  };

  return (
    <>
      {error && <p className="text-xs text-red-600 text-center mb-2">{error}</p>}
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </>
        )}
      </button>
    </>
  );
}