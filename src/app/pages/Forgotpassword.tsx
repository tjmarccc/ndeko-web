import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight, Loader2, KeyRound, Mail } from 'lucide-react';
import { NdekoLogo } from '../components/NdekoLogo';
import { forgotPassword, resetPassword } from '../services/api';

type Step = 'email' | 'otp' | 'done';

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Please try again.';
}

export function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await forgotPassword(email);
      setStep('otp');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const doReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await resetPassword({ email, otp, password: newPassword });
      setStep('done');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    /*
      min-h-screen + flex col keeps the page full-height on desktop
      while letting it scroll naturally on small phones if the content
      somehow overflows.
    */
    <div
      className="min-h-screen flex flex-col items-center justify-start sm:justify-center bg-gray-50 dark:bg-gray-950 px-5 py-10 sm:py-16"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Logo */}
      <Link to="/" className="mb-8">
        <NdekoLogo size="sm" showTagline={false} />
      </Link>

      {/* Card — full-width on tiny screens, capped at 420px above */}
      <div className="w-full max-w-[420px] rounded-2xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">

        {step === 'done' ? (
          /* ── Success state ── */
          <div className="px-6 sm:px-8 py-10 text-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: 'linear-gradient(135deg, #8B1538, #D4828F)' }}
            >
              <KeyRound className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold mb-2 dark:text-white">Password Updated!</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
              Your password has been reset successfully. You can now sign in with your new password.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #8B1538 0%, #D4828F 100%)' }}
            >
              Go to Sign In
            </button>
          </div>

        ) : (
          <>
            {/* ── Gradient header strip ── */}
            <div
              className="px-6 sm:px-8 pt-7 pb-6 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #1A0812 0%, #8B1538 100%)',
              }}
            >
              <div
                className="absolute top-[-20px] right-[-20px] w-32 h-32 rounded-full opacity-20"
                style={{ background: 'radial-gradient(circle, rgba(212,130,143,0.8), transparent)' }}
              />
              <Link
                to="/login"
                className="relative z-10 inline-flex items-center gap-1.5 text-white/60 hover:text-white text-xs mb-4 transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to sign in
              </Link>
              <div className="relative z-10 flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.15)' }}
                >
                  {step === 'email'
                    ? <Mail className="h-4 w-4 text-white" />
                    : <KeyRound className="h-4 w-4 text-white" />}
                </div>
                <div>
                  <h1 className="text-white font-bold text-lg leading-tight">
                    {step === 'email' ? 'Forgot password?' : 'Check your email'}
                  </h1>
                  <p className="text-white/55 text-xs mt-0.5">
                    {step === 'email'
                      ? "We'll send a 6-digit reset code"
                      : `Code sent to ${email}`}
                  </p>
                </div>
              </div>

              {/* Step dots */}
              <div className="relative z-10 flex gap-1.5 mt-5">
                <div
                  className="h-1 rounded-full flex-1 transition-all duration-300"
                  style={{ background: 'rgba(255,255,255,0.9)' }}
                />
                <div
                  className="h-1 rounded-full flex-1 transition-all duration-300"
                  style={{
                    background: step === 'otp' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)',
                  }}
                />
              </div>
            </div>

            {/* ── Form body ── */}
            <div className="px-6 sm:px-8 py-7">

              {error && (
                <div
                  className="mb-5 px-4 py-3 rounded-xl text-sm font-medium"
                  style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5' }}
                >
                  {error}
                </div>
              )}

              {step === 'email' ? (
                <form onSubmit={sendOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(null); }}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-[#8B1538]/30 focus:border-[#8B1538] transition-all"
                      autoComplete="email"
                      inputMode="email"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg, #8B1538 0%, #D4828F 100%)' }}
                  >
                    {loading
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <><span>Send Reset Code</span><ArrowRight className="h-4 w-4" /></>}
                  </button>
                </form>

              ) : (
                <form onSubmit={doReset} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      6-Digit Code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      placeholder="• • • • • •"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(null); }}
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xl font-mono text-center tracking-[0.5em] outline-none focus:ring-2 focus:ring-[#8B1538]/30 focus:border-[#8B1538] transition-all"
                      autoComplete="one-time-code"
                    />
                    <p className="text-xs text-gray-400 mt-1.5">
                      Expires in 10 minutes. Check your spam folder if not received.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      placeholder="Min 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-[#8B1538]/30 focus:border-[#8B1538] transition-all"
                      autoComplete="new-password"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.length < 6 || newPassword.length < 8}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg, #8B1538 0%, #D4828F 100%)' }}
                  >
                    {loading
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <><span>Reset Password</span><ArrowRight className="h-4 w-4" /></>}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setOtp(''); setStep('email'); setError(null); }}
                    className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 py-1 transition-colors"
                  >
                    Use a different email
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </div>

      <p className="mt-6 text-xs text-gray-400">
        © 2026 Ndeko Express
      </p>
    </div>
  );
}