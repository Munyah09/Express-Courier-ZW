import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const DEMO_ACCOUNTS = [
  { label: 'Super Admin',     email: 'super@admin.com',        password: '@@Griezmann177#$', role: 'super_admin' },
  { label: 'Admin',           email: 'admin@mufasa.co.zw',     password: 'Demo@1234',   role: 'admin' },
  { label: 'Branch Manager',  email: 'manager@mufasa.co.zw',   password: 'Demo@1234',   role: 'branch_manager' },
  { label: 'Driver',          email: 'driver@mufasa.co.zw',    password: 'Demo@1234',   role: 'driver' },
  { label: 'Shop Assistant',  email: 'agent@mufasa.co.zw',     password: 'Demo@1234',   role: 'shop_assistant' },
  { label: 'Clerk',           email: 'clerk@mufasa.co.zw',     password: 'Demo@1234',   role: 'clerk' },
];

const ROLE_COLORS: Record<string, string> = {
  super_admin:    'bg-purple-100 text-purple-700 border-purple-200',
  admin:          'bg-blue-100 text-blue-700 border-blue-200',
  branch_manager: 'bg-orange-100 text-orange-700 border-orange-200',
  driver:         'bg-green-100 text-green-700 border-green-200',
  shop_assistant: 'bg-teal-100 text-teal-700 border-teal-200',
  clerk:          'bg-slate-100 text-slate-700 border-slate-200',
};

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [filledFrom, setFilledFrom] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (account: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(account.email);
    setPassword(account.password);
    setFilledFrom(account.label);
    setError('');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-5">
        {/* Branding */}
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white font-black text-xl shadow-lg shadow-brand-500/30">S</div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-600">Starverse Express</p>
          <h1 className="mt-1.5 text-2xl font-semibold text-slate-900">Courier Platform</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to your account</p>
        </div>

        {/* Login form */}
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFilledFrom(''); }}
                required
                autoFocus
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 transition-colors"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFilledFrom(''); }}
                required
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {filledFrom && (
              <div className="flex items-center gap-2 rounded-xl bg-brand-50 border border-brand-200 px-3 py-2">
                <span className="text-brand-500 text-sm">✓</span>
                <p className="text-xs font-medium text-brand-700">
                  Filled with <strong>{filledFrom}</strong> demo credentials — click Sign In to continue
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60 transition-colors shadow-md shadow-brand-500/20"
            >
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>
        </div>

        {/* Demo accounts */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Demo Accounts</p>
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-[10px] text-slate-400">click to fill</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => fillDemo(acc)}
                className={`flex flex-col items-start gap-0.5 rounded-xl border px-3 py-2.5 text-left transition-all hover:shadow-sm active:scale-95 ${
                  filledFrom === acc.label
                    ? ROLE_COLORS[acc.role] + ' ring-2 ring-offset-1 ring-current'
                    : 'border-slate-200 hover:border-brand-300 hover:bg-brand-50'
                }`}
              >
                <span className="text-xs font-semibold text-slate-900">{acc.label}</span>
                <span className="text-[10px] text-slate-400 truncate w-full">{acc.email}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-center text-[10px] text-slate-400">
            Other accounts: <span className="font-mono font-semibold text-slate-600">Demo@1234</span>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400">
          Starverse Express Courier &mdash; Operations Platform
        </p>
      </div>
    </div>
  );
}
