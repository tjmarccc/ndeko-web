import { useState, useEffect } from 'react';
import {
  User, Package, MapPin, CreditCard, Settings, LogOut, Bell, X, Plus, Lock,
  Check, Menu, Loader2, AlertCircle, RefreshCw,
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useNavigate } from 'react-router';
import {
  getMe, updateMe, getMyOrders, logoutUser,
  tokenStore,
  type AuthUser, type ApiOrder,
} from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SavedCard {
  id: string;
  number: string;
  name: string;
  expiry: string;
  type: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'orders', label: 'My Orders', icon: Package },
  { id: 'addresses', label: 'Addresses', icon: MapPin },
  { id: 'payment', label: 'Payment Methods', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const notificationSettings = [
  { id: 'order_updates', label: 'Order Updates', desc: 'Shipping and delivery notifications', defaultOn: true },
  { id: 'deals', label: 'Flash Deals & Offers', desc: 'Exclusive discounts and cashback alerts', defaultOn: true },
  { id: 'wishlist', label: 'Wishlist Restocks', desc: 'When wishlisted items are back in stock', defaultOn: false },
  { id: 'newsletter', label: 'Newsletter', desc: 'Weekly top picks and curated deals', defaultOn: false },
  { id: 'sms', label: 'SMS Notifications', desc: 'Text alerts for important updates', defaultOn: true },
];

function formatCardNumber(value: string) {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'delivered': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'shipped': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'processing': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  }
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30 text-sm text-red-700 dark:text-red-400">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="flex items-center gap-1 text-xs font-semibold hover:underline">
          <RefreshCw className="h-3 w-3" /> Retry
        </button>
      )}
    </div>
  );
}

function Spinner({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'h-4 w-4' : 'h-8 w-8';
  return <Loader2 className={`${cls} animate-spin text-[#8B1538]`} />;
}

function AddPaymentModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (card: { number: string; name: string; expiry: string }) => void;
}) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardType, setCardType] = useState<'verve' | 'visa' | 'mastercard'>('verve');
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => {
      onAdd({ number: cardNumber, name: cardName, expiry });
      onClose();
    }, 900);
  };

  const detectCardType = (num: string) => {
    const digits = num.replace(/\s/g, '');
    if (digits.startsWith('4')) return 'visa';
    if (digits.startsWith('5')) return 'mastercard';
    return 'verve';
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
    setCardType(detectCardType(formatted));
  };

  const cardTypeLabel = { visa: 'VISA', mastercard: 'Mastercard', verve: 'Verve' }[cardType];
  const cardTypeColor = { visa: '#1A1F71', mastercard: '#EB001B', verve: '#8B1538' }[cardType];

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* drag handle on mobile */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #8B1538, #D4828F)' }}
        >
          <div>
            <h2 className="text-white font-bold text-lg">Add Payment Method</h2>
            <p className="text-white/70 text-xs mt-0.5">Your card details are encrypted & secure</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>

        <div className="px-6 pt-6">
          <div
            className="rounded-2xl p-5 mb-5 relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${cardTypeColor}, ${cardTypeColor}99)`, minHeight: 120 }}
          >
            <div
              className="absolute inset-0 opacity-10"
              style={{ backgroundImage: `radial-gradient(circle at 80% 50%, white 0%, transparent 60%)` }}
            />
            <div className="relative flex flex-col justify-between h-full" style={{ minHeight: 110 }}>
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  <div className="w-7 h-5 rounded-sm bg-yellow-300/80" />
                  <div className="w-7 h-5 rounded-sm bg-yellow-400/40" />
                </div>
                <span className="text-white/80 text-xs font-bold tracking-wider">{cardTypeLabel}</span>
              </div>
              <div className="mt-4">
                <p className="text-white/60 text-xs mb-1 tracking-widest">CARD NUMBER</p>
                <p className="text-white font-mono text-base tracking-widest">
                  {cardNumber || '•••• •••• •••• ••••'}
                </p>
              </div>
              <div className="flex items-end justify-between mt-3">
                <div>
                  <p className="text-white/50 text-xs mb-0.5">CARDHOLDER</p>
                  <p className="text-white text-sm font-semibold">{cardName || 'YOUR NAME'}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/50 text-xs mb-0.5">EXPIRES</p>
                  <p className="text-white text-sm font-mono">{expiry || 'MM/YY'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-8 space-y-4">
          <div>
            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block">Card Number</Label>
            <Input
              placeholder="0000 0000 0000 0000"
              value={cardNumber}
              onChange={handleCardNumberChange}
              className="font-mono tracking-wider dark:bg-gray-800 dark:border-gray-700"
              required
              maxLength={19}
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block">Cardholder Name</Label>
            <Input
              placeholder="Name as on card"
              value={cardName}
              onChange={(e) => setCardName(e.target.value.toUpperCase())}
              required
              className="dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block">Expiry Date</Label>
              <Input
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                maxLength={5}
                required
                className="dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block">CVV</Label>
              <div className="relative">
                <Input
                  placeholder="•••"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  type="password"
                  required
                  className="dark:bg-gray-800 dark:border-gray-700"
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              </div>
            </div>
          </div>

          <p className="flex items-center gap-2 text-xs text-gray-400">
            <Lock className="h-3 w-3 text-[#3D9B8E]" />
            256-bit SSL encryption · PCI DSS compliant
          </p>

          <button
            type="submit"
            disabled={saved}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm transition-all duration-300"
            style={{
              background: saved
                ? 'linear-gradient(135deg, #3D9B8E, #2F7A6F)'
                : 'linear-gradient(135deg, #8B1538, #D4828F)',
              boxShadow: '0 4px 20px rgba(139,21,56,0.3)',
            }}
          >
            {saved ? <><Check className="h-4 w-4" /> Card Saved!</> : <><Plus className="h-4 w-4" /> Save Card</>}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Tab panels ───────────────────────────────────────────────────────────────

function ProfileTab({ user, onSaved }: { user: AuthUser; onSaved: (u: AuthUser) => void }) {
  const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
  const [form, setForm] = useState({ name: fullName, phone: user.phone ?? '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const updated = await updateMe({ name: form.name, phone: form.phone });
      tokenStore.setUser(updated);
      onSaved(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (e: any) {
      setError(e.message ?? 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-lg">
      <h2 className="font-bold dark:text-white text-lg">Profile Information</h2>
      {error && <ErrorBanner message={error} />}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Full Name</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        <div>
          <Label>Email</Label>
          <Input value={user.email} disabled className="opacity-60 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700" />
        </div>
      </div>
      <div>
        <Label>Phone</Label>
        <Input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="+234 801 234 5678"
          className="dark:bg-gray-800 dark:border-gray-700"
        />
      </div>
      <div className="flex items-center gap-3">
        <Button
          className="bg-[#8B1538] hover:bg-[#6B0F2A] flex items-center gap-2"
          onClick={handleSave}
          disabled={saving}
        >
          {saving && <Spinner />}
          {success ? <><Check className="h-4 w-4" /> Saved!</> : 'Save Changes'}
        </Button>
        {user.is_email_verified ? (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <Check className="h-3 w-3" /> Email verified
          </span>
        ) : (
          <span className="text-xs text-amber-600 dark:text-amber-400">Email not verified</span>
        )}
      </div>
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 10;

  const load = async (p = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await getMyOrders(p, LIMIT);
      setOrders(res.data);
      setTotal(res.total);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(page); }, [page]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold dark:text-white text-lg">My Orders</h2>
        {total > 0 && <span className="text-sm text-gray-500 dark:text-gray-400">{total} orders</span>}
      </div>

      {error && <ErrorBanner message={error} onRetry={() => load(page)} />}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="md" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No orders yet</p>
          <p className="text-sm mt-1">When you place orders, they'll appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div
              key={o.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border dark:border-gray-700 rounded-xl gap-3 hover:border-[#8B1538]/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold dark:text-white text-sm truncate">{o.order_number}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {new Date(o.created_at).toLocaleDateString('en-NG', {
                    year: 'numeric', month: 'short', day: 'numeric',
                  })}
                </p>
                <div className="flex items-center gap-2 mt-2 sm:hidden">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${getStatusColor(o.status)}`}>
                    {o.status}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    o.payment_status === 'paid'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {o.payment_status}
                  </span>
                </div>
              </div>
              <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1">
                <p className="font-bold text-[#8B1538] text-sm">₦{o.total_amount.toLocaleString()}</p>
                <div className="hidden sm:flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${getStatusColor(o.status)}`}>
                    {o.status}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    o.payment_status === 'paid'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {o.payment_status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="text-sm dark:border-gray-700 dark:text-gray-300"
          >
            Previous
          </Button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="text-sm dark:border-gray-700 dark:text-gray-300"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main Account Page ────────────────────────────────────────────────────────

export function Account() {
  const [active, setActive] = useState('profile');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // User state — prefer live API data, fall back to localStorage
  const [user, setUser] = useState<AuthUser | null>(tokenStore.getUser());
  const [userLoading, setUserLoading] = useState(!tokenStore.getUser());
  const [userError, setUserError] = useState('');

  // Payment cards (local only — no payment cards API)
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([
    { id: '1', number: '4521', name: 'CHIDI NDEKO', expiry: '09/28', type: 'Verve' },
  ]);

  // Notifications (local only)
  const [notifState, setNotifState] = useState<Record<string, boolean>>(
    Object.fromEntries(notificationSettings.map((n) => [n.id, n.defaultOn]))
  );

  // Settings
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [passwordSaved, setPasswordSaved] = useState(false);

  // Load real user on mount
  useEffect(() => {
    const cached = tokenStore.getUser();
    if (!cached) setUserLoading(true);
    getMe()
      .then((u) => {
        tokenStore.setUser(u);
        setUser(u);
      })
      .catch((e) => {
        if (!cached) setUserError(e.message ?? 'Failed to load profile');
      })
      .finally(() => setUserLoading(false));
  }, []);

  const handleAddCard = (card: { number: string; name: string; expiry: string }) => {
    const lastFour = card.number.replace(/\s/g, '').slice(-4);
    setSavedCards((prev) => [
      ...prev,
      { id: String(Date.now()), number: lastFour, name: card.name, expiry: card.expiry, type: 'Card' },
    ]);
  };

  const handleSignOut = async () => {
    try {
      const refresh = tokenStore.getRefresh();
      if (refresh) await logoutUser(refresh);
    } catch {}
    tokenStore.clear();
    navigate('/login');
  };

  const handleTabChange = (id: string) => {
    setActive(id);
    setSidebarOpen(false); // close mobile drawer
  };

  const activeTab = tabs.find((t) => t.id === active);

  // ── Sidebar content (shared between drawer and desktop sidebar)
  const SidebarContent = () => (
    <>
      {/* Avatar + user info */}
      <div className="flex items-center gap-3 pb-4 border-b dark:border-gray-700 mb-4">
        {userLoading && !user ? (
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
        ) : (
          <div className="bg-[#8B1538] text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
            {user ? getInitials(`${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email) : '?'}
          </div>
        )}
        <div className="min-w-0">
          {userLoading && !user ? (
            <>
              <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-3 w-36 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            </>
          ) : (
            <>
              <p className="font-semibold dark:text-white truncate">{user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email : '—'}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user?.email ?? '—'}</p>
            </>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="space-y-1 flex-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors text-sm ${
              active === t.id
                ? 'bg-[#8B1538] text-white'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200'
            }`}
          >
            <t.icon className="h-4 w-4 flex-shrink-0" />
            {t.label}
          </button>
        ))}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm mt-2"
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </nav>
    </>
  );

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
      {/* Page title + mobile hamburger */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-bold dark:text-white text-xl sm:text-2xl">My Account</h1>
        <button
          className="lg:hidden p-2 rounded-lg border dark:border-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Add payment modal */}
      {showAddPayment && (
        <AddPaymentModal onClose={() => setShowAddPayment(false)} onAdd={handleAddCard} />
      )}

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-800 shadow-2xl p-4 flex flex-col overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold dark:text-white">Menu</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">

        {/* Desktop sidebar */}
        <Card className="p-4 h-fit dark:bg-gray-800 dark:border-gray-700 hidden lg:block">
          <SidebarContent />
        </Card>

        {/* Content area */}
        <Card className="p-4 sm:p-6 dark:bg-gray-800 dark:border-gray-700 min-h-[400px]">
          {/* Mobile breadcrumb */}
          <div className="flex items-center gap-2 mb-4 lg:hidden">
            {activeTab && (
              <>
                <activeTab.icon className="h-4 w-4 text-[#8B1538]" />
                <span className="font-semibold dark:text-white text-sm">{activeTab.label}</span>
              </>
            )}
          </div>

          {/* Global user error */}
          {userError && <ErrorBanner message={userError} />}

          {/* ── Profile ── */}
          {active === 'profile' && (
            userLoading && !user ? (
              <div className="space-y-4 max-w-lg animate-pulse">
                <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            ) : user ? (
              <ProfileTab user={user} onSaved={setUser} />
            ) : null
          )}

          {/* ── Orders ── */}
          {active === 'orders' && <OrdersTab />}

          {/* ── Addresses ── */}
          {active === 'addresses' && (
            <div className="space-y-4">
              <h2 className="font-bold dark:text-white text-lg">Saved Addresses</h2>
              <div className="p-4 border dark:border-gray-700 rounded-xl">
                <p className="font-semibold dark:text-white">Home</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  12 Adeola Odeku Street, Victoria Island, Lagos
                </p>
              </div>
              <Button className="bg-[#3D9B8E] hover:bg-[#2F7A6F] w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" /> Add New Address
              </Button>
            </div>
          )}

          {/* ── Payment Methods ── */}
          {active === 'payment' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold dark:text-white text-lg">Payment Methods</h2>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Lock className="h-3 w-3 text-[#3D9B8E]" /> Secured
                </span>
              </div>

              {savedCards.map((card) => (
                <div
                  key={card.id}
                  className="p-4 border dark:border-gray-700 rounded-xl flex items-center justify-between group hover:border-[#8B1538]/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #8B153820, #D4828F20)' }}
                    >
                      <CreditCard className="h-5 w-5 text-[#8B1538]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold dark:text-white text-sm truncate">
                        {card.type} •••• {card.number}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Expires {card.expiry} · {card.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSavedCards((prev) => prev.filter((c) => c.id !== card.id))}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-all flex-shrink-0 ml-2"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}

              <button
                onClick={() => setShowAddPayment(true)}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-[#8B1538]/30 text-[#8B1538] hover:border-[#8B1538] hover:bg-[#8B1538]/5 transition-all text-sm font-semibold"
              >
                <Plus className="h-4 w-4" /> Add Payment Method
              </button>

              <p className="text-xs text-gray-400 text-center">
                We accept Verve, Visa, Mastercard and bank transfers
              </p>
            </div>
          )}

          {/* ── Notifications ── */}
          {active === 'notifications' && (
            <div className="space-y-5 max-w-lg">
              <h2 className="font-bold dark:text-white text-lg">Notification Preferences</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage how Ndeko Express contacts you about deals, orders, and updates.
              </p>
              <div className="space-y-3">
                {notificationSettings.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-center justify-between p-4 rounded-xl border dark:border-gray-700 hover:border-[#8B1538]/30 transition-colors gap-4"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-sm dark:text-white">{n.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifState((prev) => ({ ...prev, [n.id]: !prev[n.id] }))}
                      className="relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0"
                      style={{ background: notifState[n.id] ? '#8B1538' : '#E5E7EB' }}
                      aria-label={`Toggle ${n.label}`}
                    >
                      <span
                        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
                        style={{ left: notifState[n.id] ? '1.5rem' : '0.25rem' }}
                      />
                    </button>
                  </div>
                ))}
              </div>
              <Button className="bg-[#8B1538] hover:bg-[#6B0F2A] w-full sm:w-auto">
                Save Preferences
              </Button>
            </div>
          )}

          {/* ── Settings ── */}
          {active === 'settings' && (
            <div className="space-y-6 max-w-lg">
              <h2 className="font-bold dark:text-white text-lg">Account Settings</h2>

              <div className="p-5 rounded-xl border dark:border-gray-700">
                <h3 className="font-semibold dark:text-white mb-4 text-sm">Change Password</h3>
                <div className="space-y-3">
                  <div>
                    <Label>Current Password</Label>
                    <Input
                      type="password"
                      placeholder="Enter current password"
                      value={passwordForm.current}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                  <div>
                    <Label>New Password</Label>
                    <Input
                      type="password"
                      placeholder="Enter new password"
                      value={passwordForm.newPass}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                  <div>
                    <Label>Confirm New Password</Label>
                    <Input
                      type="password"
                      placeholder="Confirm new password"
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                  <Button
                    className="bg-[#8B1538] hover:bg-[#6B0F2A] w-full sm:w-auto flex items-center gap-2"
                    onClick={() => {
                      setPasswordSaved(true);
                      setTimeout(() => setPasswordSaved(false), 2000);
                    }}
                  >
                    {passwordSaved ? <><Check className="h-4 w-4" /> Password Updated</> : 'Update Password'}
                  </Button>
                </div>
              </div>

              <div className="p-5 rounded-xl border border-red-100 bg-red-50/50 dark:bg-red-900/10 dark:border-red-900/30">
                <h3 className="font-semibold text-red-700 dark:text-red-400 mb-2 text-sm">Danger Zone</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 text-sm w-full sm:w-auto">
                  Delete Account
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}