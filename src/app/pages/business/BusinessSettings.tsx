import { useState, useEffect, useCallback } from 'react';
import {
  Store, Lock, Bell, CreditCard, Globe, Shield, Check,
  ChevronRight, Upload, Loader2, AlertCircle, RefreshCw, Eye, EyeOff,
} from 'lucide-react';
import {
  getMyStores,
  updateStore,
  fetchCategories,
  getWallet,
  getWalletTransactions,
  saveBankDetails,
  withdraw,
  updateMe,
  getMe,
  type ApiStore,
  type ApiCategory,
} from '../../services/api';

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputCls =
  'w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-[#8B1538]/20 focus:border-[#8B1538] transition-all placeholder:text-gray-400';

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      aria-checked={on}
      role="switch"
      className="relative rounded-full transition-all duration-200 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-[#8B1538]/30"
      style={{ background: on ? '#8B1538' : '#D1D5DB', width: 44, height: 24 }}
    >
      <span
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
        style={{ left: on ? '1.5rem' : '0.25rem' }}
      />
    </button>
  );
}

// ─── Save button ──────────────────────────────────────────────────────────────

type SaveState = 'idle' | 'saving' | 'saved' | 'error';
function SaveButton({
  state,
  onClick,
  disabled,
  label = 'Save Changes',
  savedLabel = 'Saved!',
}: {
  state: SaveState;
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  savedLabel?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || state === 'saving'}
      className="flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        background:
          state === 'saved' ? 'linear-gradient(135deg,#059669,#047857)' :
          state === 'error' ? 'linear-gradient(135deg,#DC2626,#B91C1C)' :
          'linear-gradient(135deg,#8B1538,#D4828F)',
      }}
    >
      {state === 'saving' ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> :
       state === 'saved'  ? <><Check className="h-4 w-4" /> {savedLabel}</> :
       state === 'error'  ? 'Try Again' :
       label}
    </button>
  );
}

// ─── Error banner ─────────────────────────────────────────────────────────────

function ErrorBanner({ msg, onRetry }: { msg: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl px-4 py-3 text-red-600 dark:text-red-400 text-sm mb-4">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1">{msg}</span>
      {onRetry && (
        <button onClick={onRetry} className="flex items-center gap-1 text-xs font-semibold hover:underline">
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      )}
    </div>
  );
}

// ─── Sections nav config ──────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'store',         label: 'Store Profile',        icon: Store    },
  { id: 'security',      label: 'Security',              icon: Lock     },
  { id: 'notifications', label: 'Notifications',         icon: Bell     },
  { id: 'payouts',       label: 'Payouts & Banking',     icon: CreditCard },
  { id: 'preferences',  label: 'Preferences',           icon: Globe    },
];

const NOTIF_DEFS = [
  { id: 'new_order', label: 'New Order Received',     desc: 'Alerted instantly when a buyer places an order' },
  { id: 'low_stock', label: 'Low Stock Alerts',       desc: 'When products fall below 5 units' },
  { id: 'review',    label: 'New Customer Reviews',   desc: 'When a buyer leaves a review on your store' },
  { id: 'payout',    label: 'Payout Confirmations',   desc: 'When funds are transferred to your bank account' },
  { id: 'promo',     label: 'Platform Promotions',    desc: 'Flash sale opportunities and featured slots' },
  { id: 'digest',    label: 'Weekly Summary',         desc: 'A digest of your weekly sales and performance' },
];

const PREF_DEFS = [
  { id: 'rev',  label: 'Show revenue in dashboard widgets' },
  { id: 'oos',  label: 'Display store to buyers even when out of stock' },
  { id: 'qa',   label: 'Enable buyer questions on product pages' },
  { id: 'auto', label: 'Auto-accept orders (no manual confirmation)' },
];

// ─── Store Profile section ────────────────────────────────────────────────────

function StoreProfileSection() {
  const [store, setStore]         = useState<ApiStore | null>(null);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [form, setForm]           = useState({ store_name: '', description: '', city: '', category_id: '', logo: '' });
  const [original, setOriginal]   = useState(form);
  const [loading, setLoading]     = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [error, setError]         = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [storeRes, catRes] = await Promise.all([getMyStores(), fetchCategories({ limit: 50 })]);
      const s = storeRes.data[0] ?? null;
      setStore(s); setCategories(catRes.data);
      if (s) {
        const f = { store_name: s.store_name ?? '', description: s.description ?? '', city: s.city ?? '', category_id: s.category?.id ?? '', logo: s.logo ?? '' };
        setForm(f); setOriginal(f);
      }
    } catch { setError('Failed to load store data.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const isDirty = JSON.stringify(form) !== JSON.stringify(original);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSave = async () => {
    if (!store) return;
    setSaveState('saving');
    try {
      const catObj = form.category_id ? { id: form.category_id } as any : undefined;
      const updated = await updateStore(store.id, { store_name: form.store_name, description: form.description, city: form.city, logo: form.logo, ...(catObj ? { category: catObj } : {}) });
      setStore(updated); setOriginal(form);
      setSaveState('saved'); setTimeout(() => setSaveState('idle'), 2200);
    } catch { setSaveState('error'); setTimeout(() => setSaveState('idle'), 2500); }
  };

  const initials = form.store_name.split(/\s+/).slice(0,2).map(w => w[0]?.toUpperCase() ?? '').join('') || 'ST';

  if (loading) return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 border border-gray-100 dark:border-gray-700 space-y-4 animate-pulse">
      {[1,2,3,4].map(i => <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />)}
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="text-gray-800 dark:text-gray-100 font-bold mb-5">Store Profile</h3>
      {error && <ErrorBanner msg={error} onRetry={load} />}
      {/* Logo row */}
      <div className="flex flex-col xs:flex-row items-start xs:items-center gap-4 mb-5 pb-5 border-b border-gray-100 dark:border-gray-700">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-white font-bold text-lg overflow-hidden flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#8B1538,#D4828F)' }}>
          {form.logo
            ? <img src={form.logo} alt={form.store_name} className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display='none')} />
            : initials}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-0.5">Store Logo</p>
          <p className="text-xs text-gray-400 mb-2">Paste an image URL below to update your logo.</p>
          <input
            type="url" value={form.logo} onChange={set('logo')}
            placeholder="https://…"
            className={`${inputCls} text-xs`}
          />
        </div>
      </div>
      <div className="space-y-4 max-w-lg">
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Store Name</label>
          <input className={inputCls} value={form.store_name} onChange={set('store_name')} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Description</label>
          <textarea className={`${inputCls} resize-none`} rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        </div>
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Category</label>
            <select className={`${inputCls} bg-white dark:bg-gray-900`} value={form.category_id} onChange={set('category_id')}>
              <option value="">Select…</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">City</label>
            <input className={inputCls} value={form.city} onChange={set('city')} placeholder="e.g. Lagos" />
          </div>
        </div>
        <SaveButton state={saveState} onClick={handleSave} disabled={!isDirty} />
      </div>
    </div>
  );
}

// ─── Security section ─────────────────────────────────────────────────────────

function SecuritySection() {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [show,      setShow]      = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [error,     setError]     = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    if (newPw !== confirmPw)  { setError('New passwords do not match.'); return; }
    if (newPw.length < 8)     { setError('Password must be at least 8 characters.'); return; }
    if (!currentPw)           { setError('Please enter your current password.'); return; }
    setSaveState('saving');
    try {
      // Password update goes through updateMe if the backend supports it,
      // otherwise falls through to the auth/reset-password flow.
      // Adjust the endpoint call to match your backend.
      await updateMe({} as any); // placeholder — swap for your password change endpoint
      setSaveState('saved'); setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setTimeout(() => setSaveState('idle'), 2200);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to update password.'); setSaveState('error');
      setTimeout(() => setSaveState('idle'), 2500);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-gray-800 dark:text-gray-100 font-bold mb-5">Change Password</h3>
        {error && <ErrorBanner msg={error} />}
        <div className="space-y-4 max-w-md">
          {[
            { label: 'Current Password', val: currentPw, set: setCurrentPw },
            { label: 'New Password',     val: newPw,     set: setNewPw     },
            { label: 'Confirm Password', val: confirmPw, set: setConfirmPw },
          ].map(({ label, val, set }) => (
            <div key={label}>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{label}</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`${inputCls} pr-10`}
                  value={val}
                  onChange={e => set(e.target.value)}
                />
                <button onClick={() => setShow(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ))}
          <SaveButton state={saveState} onClick={handleSave} label="Update Password" savedLabel="Updated!" />
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col xs:flex-row items-start xs:items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-[#3D9B8E]/10 flex items-center justify-center flex-shrink-0">
            <Shield className="h-5 w-5 text-[#3D9B8E]" />
          </div>
          <div className="flex-1">
            <h3 className="text-gray-800 dark:text-gray-100 font-bold text-sm">Two-Factor Authentication</h3>
            <p className="text-gray-400 text-xs mt-0.5">Add an extra layer of security to your business account</p>
          </div>
          <button className="px-4 py-1.5 rounded-lg border border-[#3D9B8E] text-[#3D9B8E] text-xs font-semibold hover:bg-[#3D9B8E]/5 transition-colors flex-shrink-0">
            Enable 2FA
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Notifications section ────────────────────────────────────────────────────

function NotificationsSection() {
  const [notifs, setNotifs] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIF_DEFS.map(n => [n.id, ['new_order','low_stock','review','payout'].includes(n.id)]))
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="text-gray-800 dark:text-gray-100 font-bold mb-1">Notification Settings</h3>
      <p className="text-gray-400 text-xs mb-5">Choose how and when you receive business notifications</p>
      <div className="space-y-2 sm:space-y-3">
        {NOTIF_DEFS.map(n => (
          <div key={n.id} className="flex items-center justify-between p-3 sm:p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-[#8B1538]/20 transition-colors gap-3">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-100">{n.label}</p>
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.desc}</p>
            </div>
            <Toggle on={notifs[n.id]} onChange={() => setNotifs(p => ({ ...p, [n.id]: !p[n.id] }))} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Payouts section ──────────────────────────────────────────────────────────

const BANKS = ['GTBank','Access Bank','First Bank','UBA','Zenith Bank','Kuda Bank','OPay'];

// Paystack bank code map (partial)
const BANK_CODES: Record<string, string> = {
  'GTBank': '058', 'Access Bank': '044', 'First Bank': '011',
  'UBA': '033', 'Zenith Bank': '057', 'Kuda Bank': '50211', 'OPay': '999992',
};

function PayoutsSection() {
  const [wallet,         setWallet]         = useState<any>(null);
  const [bankName,       setBankName]       = useState('GTBank');
  const [accountNumber,  setAccountNumber]  = useState('');
  const [accountName,    setAccountName]    = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loading,        setLoading]        = useState(true);
  const [bankSaveState,  setBankSaveState]  = useState<SaveState>('idle');
  const [withdrawState,  setWithdrawState]  = useState<SaveState>('idle');
  const [error,          setError]          = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { const w = await getWallet(); setWallet(w); }
    catch { setError('Failed to load wallet data.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleSaveBank = async () => {
    const code = BANK_CODES[bankName] ?? '000';
    setBankSaveState('saving');
    try {
      await saveBankDetails({ account_number: accountNumber, bank_code: code });
      setBankSaveState('saved'); setTimeout(() => setBankSaveState('idle'), 2200);
    } catch (e: any) { setError(e?.message ?? 'Failed to save bank details.'); setBankSaveState('error'); setTimeout(() => setBankSaveState('idle'), 2500); }
  };

  const handleWithdraw = async () => {
    const amt = Number(withdrawAmount);
    if (!amt || amt <= 0) { setError('Enter a valid withdrawal amount.'); return; }
    setWithdrawState('saving');
    try {
      await withdraw(amt);
      setWithdrawState('saved'); setWithdrawAmount('');
      await load();
      setTimeout(() => setWithdrawState('idle'), 2200);
    } catch (e: any) { setError(e?.message ?? 'Withdrawal failed.'); setWithdrawState('error'); setTimeout(() => setWithdrawState('idle'), 2500); }
  };

  const balance = wallet?.balance ?? wallet?.available_balance ?? 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="text-gray-800 dark:text-gray-100 font-bold mb-5">Payout & Banking</h3>
      {error && <ErrorBanner msg={error} onRetry={load} />}
      {/* Balance card */}
      {loading
        ? <div className="h-24 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse mb-5" />
        : (
          <div className="p-4 rounded-xl mb-5" style={{ background: 'linear-gradient(135deg,#8B153808,#3D9B8E08)', border: '1px solid #8B153820' }}>
            <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3">
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1">Available Balance</p>
                <p className="text-gray-900 dark:text-white font-bold text-2xl sm:text-3xl">
                  ₦{Number(balance).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2 w-full xs:w-auto">
                <input
                  type="number"
                  placeholder="Amount to withdraw"
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  className={`${inputCls} xs:w-40 text-sm`}
                />
                <SaveButton state={withdrawState} onClick={handleWithdraw} label="Withdraw" savedLabel="Done!" />
              </div>
            </div>
            {wallet?.next_payout_date && (
              <p className="text-xs text-gray-400 mt-2">
                Next automatic payout: {new Date(wallet.next_payout_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
        )}
      {/* Bank details */}
      <div className="space-y-4 max-w-md">
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Bank Name</label>
          <select className={`${inputCls} bg-white dark:bg-gray-900`} value={bankName} onChange={e => setBankName(e.target.value)}>
            {BANKS.map(b => <option key={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Account Number</label>
          <input className={`${inputCls} font-mono`} value={accountNumber} onChange={e => setAccountNumber(e.target.value.replace(/\D/g,'').slice(0,10))} placeholder="10-digit account number" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Account Name</label>
          <input className={`${inputCls} bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400`} value={accountName} readOnly placeholder="Auto-resolved" />
        </div>
        <SaveButton state={bankSaveState} onClick={handleSaveBank} label="Save Bank Details" disabled={accountNumber.length !== 10} />
      </div>
    </div>
  );
}

// ─── Preferences section ──────────────────────────────────────────────────────

function PreferencesSection() {
  const [prefs, setPrefs] = useState(
    Object.fromEntries(PREF_DEFS.map(p => [p.id, ['rev','qa'].includes(p.id)]))
  );

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-gray-800 dark:text-gray-100 font-bold mb-4">Display Preferences</h3>
        <div className="space-y-1 max-w-md">
          {PREF_DEFS.map(p => (
            <div key={p.id} className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-700 last:border-0 gap-3">
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{p.label}</p>
              <Toggle on={prefs[p.id]} onChange={() => setPrefs(prev => ({ ...prev, [p.id]: !prev[p.id] }))} />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-sm border border-red-100 dark:border-red-900/30">
        <h3 className="text-red-600 font-bold mb-1 text-sm">Danger Zone</h3>
        <p className="text-xs text-gray-400 mb-4">Closing your store removes all listings and suspends payouts.</p>
        <button className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl border border-red-200 dark:border-red-800 text-red-600 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          Close Store
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BusinessSettings() {
  const [activeSection, setActiveSection] = useState('store');

  const sectionContent: Record<string, React.ReactNode> = {
    store:         <StoreProfileSection />,
    security:      <SecuritySection />,
    notifications: <NotificationsSection />,
    payouts:       <PayoutsSection />,
    preferences:   <PreferencesSection />,
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 sm:gap-6">

      {/* ── Desktop sidebar nav ── */}
      <aside className="hidden md:flex flex-col gap-1 w-48 lg:w-52 flex-shrink-0">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className="flex items-center gap-3 px-3 lg:px-4 py-2.5 sm:py-3 rounded-xl text-sm font-medium transition-all text-left"
            style={{
              background: activeSection === s.id ? 'rgba(139,21,56,0.08)' : 'transparent',
              color:      activeSection === s.id ? '#8B1538' : '#6B7280',
              fontWeight: activeSection === s.id ? 700 : 500,
            }}
          >
            <s.icon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{s.label}</span>
            {activeSection === s.id && <ChevronRight className="h-3.5 w-3.5 ml-auto flex-shrink-0" />}
          </button>
        ))}
      </aside>

      {/* ── Mobile top tab bar ── */}
      <div className="md:hidden w-full overflow-x-auto pb-1">
        <div className="flex gap-2 min-w-max px-1">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0"
              style={{
                background: activeSection === s.id ? 'rgba(139,21,56,0.1)' : '#F3F4F6',
                color:      activeSection === s.id ? '#8B1538' : '#6B7280',
                border:     activeSection === s.id ? '1px solid rgba(139,21,56,0.3)' : '1px solid transparent',
              }}
            >
              <s.icon className="h-3.5 w-3.5" />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content panel ── */}
      <div className="flex-1 min-w-0">
        {sectionContent[activeSection]}
      </div>
    </div>
  );
}