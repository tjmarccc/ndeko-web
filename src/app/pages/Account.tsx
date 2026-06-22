import { useState, useEffect } from 'react';
import {
  User, Package, MapPin, CreditCard, Settings, LogOut, Bell, X, Plus, Lock,
  Check, Menu, Loader2, AlertCircle, RefreshCw, Trash2, Pencil, Star, ExternalLink, Eye, EyeOff,
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  getMe, updateMe, getMyOrders, logoutUser,
  changePassword, deleteAccount,
  getNotificationPreferences, updateNotificationPreferences,
  getMyAddresses as getAddresses, createAddress as addAddress, updateAddress, deleteAddress, setDefaultAddress,
  getSavedPaymentMethods, deleteSavedPaymentMethod, setDefaultPaymentMethod, initiateAddPaymentMethod,
  tokenStore, ApiError,
  type AuthUser, type ApiOrder, type ApiAddress as Address, type AddressBody,
  type NotificationPreferences, type SavedPaymentMethod,
} from '../services/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'orders', label: 'My Orders', icon: Package },
  { id: 'addresses', label: 'Addresses', icon: MapPin },
  { id: 'payment', label: 'Payment Methods', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const NOTIFICATION_META: { id: keyof NotificationPreferences; label: string; desc: string }[] = [
  { id: 'order_updates', label: 'Order Updates', desc: 'Shipping and delivery notifications' },
  { id: 'deals', label: 'Flash Deals & Offers', desc: 'Exclusive discounts and cashback alerts' },
  { id: 'wishlist', label: 'Wishlist Restocks', desc: 'When wishlisted items are back in stock' },
  { id: 'newsletter', label: 'Newsletter', desc: 'Weekly top picks and curated deals' },
  { id: 'sms', label: 'SMS Notifications', desc: 'Text alerts for important updates' },
];

const DEFAULT_NOTIF_PREFS: NotificationPreferences = {
  order_updates: true,
  deals: true,
  wishlist: false,
  newsletter: false,
  sms: true,
};

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

function errMsg(e: unknown, fallback: string) {
  if (e instanceof ApiError) return e.message || fallback;
  if (e instanceof Error) return e.message || fallback;
  return fallback;
}

// ─── Shared sub-components ─────────────────────────────────────────────────────

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

function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-900/30 text-sm text-emerald-700 dark:text-emerald-400">
      <Check className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1">{message}</span>
    </div>
  );
}

function Spinner({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'h-4 w-4' : 'h-8 w-8';
  return <Loader2 className={`${cls} animate-spin text-[#8B1538]`} />;
}

// ─── Confirm dialog (for destructive actions) ──────────────────────────────────

function ConfirmDialog({
  title,
  description,
  confirmLabel,
  requireText,
  danger = true,
  loading,
  error,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  requireText?: string; // if set, user must type this exact text to confirm
  danger?: boolean;
  loading: boolean;
  error: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [typed, setTyped] = useState('');
  const canConfirm = !requireText || typed === requireText;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold text-lg dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{description}</p>

        {requireText && (
          <div className="mb-4">
            <Label className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block">
              Type <span className="font-mono font-bold">{requireText}</span> to confirm
            </Label>
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="dark:bg-gray-800 dark:border-gray-700"
              autoFocus
            />
          </div>
        )}

        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            className={`flex-1 ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#8B1538] hover:bg-[#6B0F2A]'}`}
            onClick={onConfirm}
            disabled={loading || !canConfirm}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Profile ───────────────────────────────────────────────────────────────

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
    } catch (e) {
      setError(errMsg(e, 'Failed to save changes'));
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

// ─── Tab: Orders ────────────────────────────────────────────────────────────────

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
    } catch (e) {
      setError(errMsg(e, 'Failed to load orders'));
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

// ─── Tab: Addresses ─────────────────────────────────────────────────────────────

const EMPTY_ADDRESS_FORM: AddressBody = {
  label: '', recipient_name: '', recipient_phone: '', street: '', city: '', state: '', country: 'Nigeria', is_default: false,
};

function AddressFormModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: Address | null;
  onClose: () => void;
  onSave: (body: AddressBody) => Promise<void>;
}) {
  const [form, setForm] = useState<AddressBody>(
    initial
      ? { label: initial.label, recipient_name: initial.recipient_name ?? '', recipient_phone: initial.recipient_phone ?? '', street: initial.street, city: initial.city, state: initial.state, country: initial.country ?? 'Nigeria', is_default: initial.is_default }
      : EMPTY_ADDRESS_FORM
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.label.trim() || !form.street.trim() || !form.city.trim() || !form.state.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(form);
      onClose();
    } catch (e) {
      setError(errMsg(e, 'Failed to save address'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 flex items-center justify-between border-b dark:border-gray-800">
          <h2 className="font-bold text-lg dark:text-white">
            {initial ? 'Edit Address' : 'Add New Address'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center">
            <X className="h-4 w-4 dark:text-gray-300" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-3">
          {error && <ErrorBanner message={error} />}
          <div>
            <Label className="text-xs">Label (e.g. Home, Office)</Label>
            <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="dark:bg-gray-800 dark:border-gray-700" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Full Name</Label>
              <Input value={form.recipient_name ?? ''} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} className="dark:bg-gray-800 dark:border-gray-700" />
            </div>
            <div>
              <Label className="text-xs">Phone</Label>
              <Input value={form.recipient_phone ?? ''} onChange={(e) => setForm({ ...form, recipient_phone: e.target.value })} className="dark:bg-gray-800 dark:border-gray-700" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Street Address</Label>
            <Input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} className="dark:bg-gray-800 dark:border-gray-700" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">City</Label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="dark:bg-gray-800 dark:border-gray-700" />
            </div>
            <div>
              <Label className="text-xs">State</Label>
              <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="dark:bg-gray-800 dark:border-gray-700" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Country</Label>
            <Input value={form.country ?? ''} onChange={(e) => setForm({ ...form, country: e.target.value })} className="dark:bg-gray-800 dark:border-gray-700" />
          </div>
          <label className="flex items-center gap-2 text-sm dark:text-gray-300 pt-1">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
              className="rounded"
            />
            Set as default address
          </label>

          <Button type="submit" disabled={saving} className="w-full bg-[#8B1538] hover:bg-[#6B0F2A] mt-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : initial ? 'Save Changes' : 'Add Address'}
          </Button>
        </form>
      </div>
    </div>
  );
}

function AddressesTab() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAddresses();
      setAddresses(res);
    } catch (e) {
      setError(errMsg(e, 'Failed to load addresses'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (body: AddressBody) => {
    if (editing) {
      const updated = await updateAddress(editing.id, body);
      setAddresses((prev) => prev.map((a) => (a.id === editing.id ? updated : a)));
    } else {
      const created = await addAddress(body);
      setAddresses((prev) => [...prev, created]);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      setError(errMsg(e, 'Failed to delete address'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    setSettingDefaultId(id);
    try {
      await setDefaultAddress(id);
      setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === id })));
    } catch (e) {
      setError(errMsg(e, 'Failed to update default address'));
    } finally {
      setSettingDefaultId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold dark:text-white text-lg">Saved Addresses</h2>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      {showForm && (
        <AddressFormModal
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="md" /></div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-10 text-gray-400 dark:text-gray-500">
          <MapPin className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No saved addresses yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div key={addr.id} className="p-4 border dark:border-gray-700 rounded-xl">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold dark:text-white">{addr.label}</p>
                    {addr.is_default && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#8B1538]/10 text-[#8B1538] dark:bg-[#8B1538]/20">
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {addr.street}, {addr.city}, {addr.state}{addr.country ? `, ${addr.country}` : ''}
                  </p>
                  {(addr.recipient_name || addr.recipient_phone) && (
                    <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                      {[addr.recipient_name, addr.recipient_phone].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => { setEditing(addr); setShowForm(true); }}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                    aria-label="Edit address"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    disabled={deletingId === addr.id}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                    aria-label="Delete address"
                  >
                    {deletingId === addr.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              {!addr.is_default && (
                <button
                  onClick={() => handleSetDefault(addr.id)}
                  disabled={settingDefaultId === addr.id}
                  className="text-xs font-semibold text-[#8B1538] hover:underline mt-2 flex items-center gap-1"
                >
                  {settingDefaultId === addr.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Star className="h-3 w-3" />}
                  Set as default
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Button
        className="bg-[#3D9B8E] hover:bg-[#2F7A6F] w-full sm:w-auto"
        onClick={() => { setEditing(null); setShowForm(true); }}
      >
        <Plus className="h-4 w-4 mr-2" /> Add New Address
      </Button>
    </div>
  );
}

// ─── Tab: Payment Methods ───────────────────────────────────────────────────────

function PaymentMethodsTab() {
  const [cards, setCards] = useState<SavedPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getSavedPaymentMethods();
      setCards(res);
    } catch (e) {
      setError(errMsg(e, 'Failed to load payment methods'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteSavedPaymentMethod(id);
      setCards((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      setError(errMsg(e, 'Failed to remove card'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    setSettingDefaultId(id);
    try {
      await setDefaultPaymentMethod(id);
      setCards((prev) => prev.map((c) => ({ ...c, is_default: c.id === id })));
    } catch (e) {
      setError(errMsg(e, 'Failed to update default card'));
    } finally {
      setSettingDefaultId(null);
    }
  };

  // Real card capture goes through Paystack (PCI compliance) — we never collect
  // raw card numbers ourselves. This kicks off that redirect flow.
  const handleAddCard = async () => {
    setRedirecting(true);
    setError('');
    try {
      const { authorization_url } = await initiateAddPaymentMethod();
      window.location.href = authorization_url;
    } catch (e) {
      setError(errMsg(e, 'Could not start card setup. Please try again.'));
      setRedirecting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold dark:text-white text-lg">Payment Methods</h2>
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Lock className="h-3 w-3 text-[#3D9B8E]" /> Secured by Paystack
        </span>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="md" /></div>
      ) : cards.length === 0 ? (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500">
          <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No saved cards yet</p>
        </div>
      ) : (
        cards.map((card) => (
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
                <div className="flex items-center gap-2">
                  <p className="font-semibold dark:text-white text-sm truncate capitalize">
                    {card.card_type} •••• {card.last_four}
                  </p>
                  {card.is_default && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#8B1538]/10 text-[#8B1538] dark:bg-[#8B1538]/20 flex-shrink-0">
                      DEFAULT
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Expires {card.expiry} · {card.cardholder_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
              {!card.is_default && (
                <button
                  onClick={() => handleSetDefault(card.id)}
                  disabled={settingDefaultId === card.id}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-[#8B1538]"
                  aria-label="Set as default"
                  title="Set as default"
                >
                  {settingDefaultId === card.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
                </button>
              )}
              <button
                onClick={() => handleDelete(card.id)}
                disabled={deletingId === card.id}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600"
                aria-label="Remove card"
              >
                {deletingId === card.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              </button>
            </div>
          </div>
        ))
      )}

      <button
        onClick={handleAddCard}
        disabled={redirecting}
        className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-[#8B1538]/30 text-[#8B1538] hover:border-[#8B1538] hover:bg-[#8B1538]/5 transition-all text-sm font-semibold disabled:opacity-60"
      >
        {redirecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
        {redirecting ? 'Redirecting to Paystack…' : 'Add Payment Method'}
      </button>

      <p className="text-xs text-gray-400 text-center">
        We accept Verve, Visa and Mastercard. Card details are handled entirely by Paystack — Ndeko never sees or stores your card number.
      </p>
    </div>
  );
}

// ─── Tab: Notifications ──────────────────────────────────────────────────────────

function NotificationsTab() {
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_NOTIF_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getNotificationPreferences();
      setPrefs(res);
    } catch (e) {
      // If the endpoint isn't there yet / user has none saved, fall back to defaults
      // rather than blocking the whole tab.
      setPrefs(DEFAULT_NOTIF_PREFS);
      setError(errMsg(e, 'Could not load saved preferences — showing defaults.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggle = (id: keyof NotificationPreferences) => {
    setPrefs((prev) => ({ ...prev, [id]: !prev[id] }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const updated = await updateNotificationPreferences(prefs);
      setPrefs(updated);
      setDirty(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (e) {
      setError(errMsg(e, 'Failed to save preferences'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12"><Spinner size="md" /></div>
    );
  }

  return (
    <div className="space-y-5 max-w-lg">
      <h2 className="font-bold dark:text-white text-lg">Notification Preferences</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Manage how Ndeko Express contacts you about deals, orders, and updates.
      </p>

      {error && <ErrorBanner message={error} onRetry={load} />}
      {success && <SuccessBanner message="Preferences saved!" />}

      <div className="space-y-3">
        {NOTIFICATION_META.map((n) => (
          <div
            key={n.id}
            className="flex items-center justify-between p-4 rounded-xl border dark:border-gray-700 hover:border-[#8B1538]/30 transition-colors gap-4"
          >
            <div className="min-w-0">
              <p className="font-semibold text-sm dark:text-white">{n.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.desc}</p>
            </div>
            <button
              onClick={() => toggle(n.id)}
              className="relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0"
              style={{ background: prefs[n.id] ? '#8B1538' : '#E5E7EB' }}
              aria-label={`Toggle ${n.label}`}
              aria-pressed={prefs[n.id]}
            >
              <span
                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
                style={{ left: prefs[n.id] ? '1.5rem' : '0.25rem' }}
              />
            </button>
          </div>
        ))}
      </div>
      <Button
        className="bg-[#8B1538] hover:bg-[#6B0F2A] w-full sm:w-auto flex items-center gap-2"
        onClick={handleSave}
        disabled={saving || !dirty}
      >
        {saving && <Spinner />}
        Save Preferences
      </Button>
    </div>
  );
}

// ─── Tab: Settings (password + delete account) ───────────────────────────────────

function SettingsTab({ onAccountDeleted, onPasswordChanged }: { onAccountDeleted: () => void; onPasswordChanged: () => void }) {
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [showPw, setShowPw] = useState({ current: false, newPass: false, confirm: false });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handlePasswordSubmit = async () => {
    setPwError('');

    if (!passwordForm.current || !passwordForm.newPass || !passwordForm.confirm) {
      setPwError('Please fill in all password fields.');
      return;
    }
    if (passwordForm.newPass.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }
    if (passwordForm.newPass !== passwordForm.confirm) {
      setPwError('New password and confirmation do not match.');
      return;
    }

    setPwSaving(true);
    try {
      await changePassword({
        current_password: passwordForm.current,
        new_password: passwordForm.newPass,
      });
      tokenStore.clear();
      toast.success('Password updated. Please log in again.');
      setTimeout(onPasswordChanged, 1500);
    } catch (e) {
      setPwError(errMsg(e, 'Failed to update password. Check your current password and try again.'));
    } finally {
      setPwSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteAccount();
      tokenStore.clear();
      onAccountDeleted();
    } catch (e) {
      setDeleteError(errMsg(e, 'Failed to delete account. Please try again or contact support.'));
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h2 className="font-bold dark:text-white text-lg">Account Settings</h2>

      <div className="p-5 rounded-xl border dark:border-gray-700">
        <h3 className="font-semibold dark:text-white mb-4 text-sm">Change Password</h3>
        {pwError && <div className="mb-3"><ErrorBanner message={pwError} /></div>}
        <div className="space-y-3">
          {([
            { key: 'current', label: 'Current Password', placeholder: 'Enter current password' },
            { key: 'newPass', label: 'New Password', placeholder: 'Enter new password' },
            { key: 'confirm', label: 'Confirm New Password', placeholder: 'Confirm new password' },
          ] as const).map(({ key, label, placeholder }) => (
            <div key={key}>
              <Label>{label}</Label>
              <div className="relative">
                <Input
                  type={showPw[key] ? 'text' : 'password'}
                  placeholder={placeholder}
                  value={passwordForm[key]}
                  onChange={(e) => setPasswordForm({ ...passwordForm, [key]: e.target.value })}
                  className="dark:bg-gray-800 dark:border-gray-700 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => ({ ...s, [key]: !s[key] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPw[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ))}
          <Button
            className="bg-[#8B1538] hover:bg-[#6B0F2A] w-full sm:w-auto flex items-center gap-2"
            onClick={handlePasswordSubmit}
            disabled={pwSaving}
          >
            {pwSaving && <Spinner />}
            Update Password
          </Button>
        </div>
      </div>

      <div className="p-5 rounded-xl border border-red-100 bg-red-50/50 dark:bg-red-900/10 dark:border-red-900/30">
        <h3 className="font-semibold text-red-700 dark:text-red-400 mb-2 text-sm">Danger Zone</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <Button
          variant="outline"
          className="text-red-600 border-red-200 hover:bg-red-50 text-sm w-full sm:w-auto"
          onClick={() => setShowDeleteConfirm(true)}
        >
          Delete Account
        </Button>
      </div>

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete your account?"
          description="This will permanently delete your account, orders, wishlist, and saved data. This cannot be undone."
          confirmLabel="Delete Account"
          requireText="DELETE"
          loading={deleting}
          error={deleteError}
          onConfirm={handleDeleteAccount}
          onCancel={() => { setShowDeleteConfirm(false); setDeleteError(''); }}
        />
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
        if (!cached) setUserError(errMsg(e, 'Failed to load profile'));
      })
      .finally(() => setUserLoading(false));
  }, []);

  const handleSignOut = async () => {
    try {
      const refresh = tokenStore.getRefresh();
      if (refresh) await logoutUser(refresh);
    } catch {
      // best-effort — clear local session regardless
    }
    tokenStore.clear();
    navigate('/login');
  };

  const handleAccountDeleted = () => {
    navigate('/login');
  };

  const handlePasswordChanged = () => {
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
          {active === 'addresses' && <AddressesTab />}

          {/* ── Payment Methods ── */}
          {active === 'payment' && <PaymentMethodsTab />}

          {/* ── Notifications ── */}
          {active === 'notifications' && <NotificationsTab />}

          {/* ── Settings ── */}
          {active === 'settings' && <SettingsTab onAccountDeleted={handleAccountDeleted} onPasswordChanged={handlePasswordChanged} />}
        </Card>
      </div>
    </div>
  );
}