import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag, AlertTriangle, Star, TrendingUp,
  Bell, Check, Trash2, Filter, RefreshCw,
} from 'lucide-react';

// ─── API layer ────────────────────────────────────────────────────────────────

const BASE_URL = 'https://ndeko-backend-prod.onrender.com';

const tokenStore = {
  getAccess: () => localStorage.getItem('ndeko_access_token'),
  getRefresh: () => localStorage.getItem('ndeko_refresh_token'),
  setAccess: (t: string) => localStorage.setItem('ndeko_access_token', t),
  setRefresh: (t: string) => localStorage.setItem('ndeko_refresh_token', t),
  clear: () => {
    localStorage.removeItem('ndeko_access_token');
    localStorage.removeItem('ndeko_refresh_token');
    localStorage.removeItem('ndeko_user');
  },
};

class ApiError extends Error {
  constructor(public message: string, public status: number, public body: unknown = null) {
    super(message);
    this.name = 'ApiError';
  }
}

async function publicFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers as object) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(json?.message ?? `Request failed: ${res.status}`, res.status, json);
  return json as T;
}

async function authFetch<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const token = tokenStore.getAccess();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as object),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && retry) {
    const refresh = tokenStore.getRefresh();
    if (refresh) {
      try {
        const tokens = await publicFetch<{ access_token: string; refresh_token?: string }>(
          '/api/v1/auth/refresh',
          { method: 'POST', body: JSON.stringify({ refresh_token: refresh }) }
        );
        tokenStore.setAccess(tokens.access_token);
        if (tokens.refresh_token) tokenStore.setRefresh(tokens.refresh_token);
        return authFetch<T>(path, options, false);
      } catch { /* fall through */ }
    }
    tokenStore.clear();
    window.location.href = '/login';
    throw new ApiError('Session expired', 401);
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(json?.message ?? `Request failed: ${res.status}`, res.status, json);
  return json as T;
}

// ─── Remote types ─────────────────────────────────────────────────────────────

interface ApiStore { id: string; store_name: string; store_slug: string; status: string }
interface ApiOrder {
  id: string; order_number: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed';
  total_amount: number; created_at: string;
}
interface ApiProduct {
  id: string; name: string; price: number;
  stock_quantity: number; stock_status: 'in_stock' | 'out_of_stock' | 'low_stock';
  images: string[];
}
interface ApiReview {
  id: string; rating: number; comment?: string;
  user: { id: string; name: string; avatar?: string };
  created_at: string;
}
interface PaginatedResponse<T> { data: T[]; total: number; page: number; limit: number }
interface WalletTx {
  id: string; type?: string; amount: number;
  status?: string; description?: string; created_at: string;
}

// ─── API calls ────────────────────────────────────────────────────────────────

const getMyStores = () =>
  authFetch<PaginatedResponse<ApiStore> | ApiStore[]>('/api/v1/stores/my');

const getStoreOrders = (storeId: string, page = 1, limit = 20) =>
  authFetch<PaginatedResponse<ApiOrder>>(
    `/api/v1/orders/stores/${storeId}?page=${page}&limit=${limit}`
  );

const getStoreProducts = (storeId: string, limit = 100) =>
  authFetch<PaginatedResponse<ApiProduct>>(
    `/api/v1/products/stores/${storeId}?page=1&limit=${limit}`
  );

const fetchStoreReviews = (storeId: string, page = 1, limit = 20) =>
  publicFetch<PaginatedResponse<ApiReview>>(
    `/api/v1/reviews/stores/${storeId}?page=${page}&limit=${limit}`
  );

const getWalletTransactions = (page = 1, limit = 10) =>
  authFetch<PaginatedResponse<WalletTx>>(
    `/api/v1/wallet/transactions?page=${page}&limit=${limit}`
  );

// ─── Notification model ───────────────────────────────────────────────────────

type NotifType = 'order' | 'stock' | 'review' | 'payout' | 'system';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  time: string;       // ISO string for sorting
  timeLabel: string;  // human-readable
  read: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

// Deterministic ID so de-duplication works across refreshes
function makeId(prefix: string, entityId: string) {
  return `${prefix}:${entityId}`;
}

// ─── Derive notifications from API data ───────────────────────────────────────

function deriveNotifications(
  orders: ApiOrder[],
  products: ApiProduct[],
  reviews: ApiReview[],
  wallet: WalletTx[],
): Notification[] {
  const notifs: Notification[] = [];

  // Orders → recent status changes
  for (const o of orders) {
    const statusMessages: Partial<Record<ApiOrder['status'], { title: string; msg: string }>> = {
      pending: { title: 'New Order Received', msg: `Order #${o.order_number} is awaiting processing. Total: ₦${o.total_amount.toLocaleString()}` },
      processing: { title: 'Order in Processing', msg: `Order #${o.order_number} (₦${o.total_amount.toLocaleString()}) is being prepared.` },
      shipped: { title: 'Order Shipped', msg: `Order #${o.order_number} has been picked up by the courier.` },
      delivered: { title: 'Order Delivered', msg: `Order #${o.order_number} was delivered successfully.` },
      cancelled: { title: 'Order Cancelled', msg: `Order #${o.order_number} was cancelled.` },
    };
    const cfg = statusMessages[o.status];
    if (cfg) {
      notifs.push({
        id: makeId('order', o.id),
        type: 'order',
        title: cfg.title,
        message: cfg.msg,
        time: o.created_at,
        timeLabel: relativeTime(o.created_at),
        read: false,
      });
    }
  }

  // Products → low / out of stock
  for (const p of products) {
    if (p.stock_status === 'out_of_stock') {
      notifs.push({
        id: makeId('stock-out', p.id),
        type: 'stock',
        title: 'Out of Stock',
        message: `"${p.name}" is now out of stock. Update inventory to hide the listing.`,
        time: new Date(Date.now() - 3_600_000).toISOString(),
        timeLabel: '1 hr ago',
        read: false,
      });
    } else if (p.stock_status === 'low_stock' || p.stock_quantity <= 5) {
      notifs.push({
        id: makeId('stock-low', p.id),
        type: 'stock',
        title: 'Low Stock Alert',
        message: `"${p.name}" is down to ${p.stock_quantity} unit${p.stock_quantity !== 1 ? 's' : ''}. Restock soon to avoid losing sales.`,
        time: new Date(Date.now() - 7_200_000).toISOString(),
        timeLabel: '2 hrs ago',
        read: false,
      });
    }
  }

  // Reviews → new ratings
  for (const r of reviews) {
    const stars = '⭐'.repeat(r.rating);
    notifs.push({
      id: makeId('review', r.id),
      type: 'review',
      title: `${r.rating}-Star Review from ${r.user.name}`,
      message: r.comment
        ? `${r.user.name} left a ${stars} review: "${r.comment}"`
        : `${r.user.name} gave your store ${r.rating} star${r.rating !== 1 ? 's' : ''}.`,
      time: r.created_at,
      timeLabel: relativeTime(r.created_at),
      read: true,
    });
  }

  // Wallet → payouts / credits
  for (const tx of wallet) {
    const amt = `₦${Number(tx.amount).toLocaleString()}`;
    const desc = tx.description ?? (tx.type === 'withdrawal' ? 'Payout processed' : 'Wallet credited');
    notifs.push({
      id: makeId('wallet', tx.id),
      type: 'payout',
      title: tx.type === 'withdrawal' ? 'Payout Processed' : 'Wallet Credited',
      message: `${amt} — ${desc}`,
      time: tx.created_at,
      timeLabel: relativeTime(tx.created_at),
      read: true,
    });
  }

  // Sort newest first
  return notifs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
}

// ─── Local persistence (read + deleted sets) ──────────────────────────────────

const STORAGE_KEY = 'ndeko_notif_state';

interface PersistedState { readIds: string[]; deletedIds: string[] }

function loadPersisted(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { readIds: [], deletedIds: [] };
  } catch { return { readIds: [], deletedIds: [] }; }
}

function savePersisted(state: PersistedState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* quota */ }
}

// ─── Type config ──────────────────────────────────────────────────────────────

const TYPE_CFG: Record<NotifType, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  order: { icon: ShoppingBag, color: '#8B1538', bg: '#FDF2F4', label: 'Orders' },
  stock: { icon: AlertTriangle, color: '#D97706', bg: '#FFFBEB', label: 'Stock' },
  review: { icon: Star, color: '#6366F1', bg: '#EEF2FF', label: 'Reviews' },
  payout: { icon: TrendingUp, color: '#3D9B8E', bg: '#F0FDFA', label: 'Payouts' },
  system: { icon: Bell, color: '#D4828F', bg: '#FDF2F8', label: 'System' },
};

const FILTER_TYPES: Array<'all' | NotifType> = ['all', 'order', 'stock', 'review', 'payout', 'system'];

// ─── Main component ───────────────────────────────────────────────────────────

export function BusinessNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [persisted, setPersisted] = useState<PersistedState>(loadPersisted);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | NotifType>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // ── Apply persisted read/delete on top of derived notifications ─────────────
  const applyPersisted = useCallback(
    (raw: Notification[], state: PersistedState): Notification[] =>
      raw
        .filter(n => !state.deletedIds.includes(n.id))
        .map(n => ({ ...n, read: n.read || state.readIds.includes(n.id) })),
    []
  );

  // ── Fetch all data and derive notifications ──────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Get store(s)
      const storesRaw = await getMyStores();
      const stores: ApiStore[] = Array.isArray(storesRaw)
        ? storesRaw
        : (storesRaw as PaginatedResponse<ApiStore>).data ?? [];

      const storeId = stores[0]?.id;
      if (!storeId) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      // 2. Fetch data in parallel; individual failures don't block the rest
      const [ordersRes, productsRes, reviewsRes, walletRes] = await Promise.allSettled([
        getStoreOrders(storeId, 1, 20),
        getStoreProducts(storeId, 100),
        fetchStoreReviews(storeId, 1, 20),
        getWalletTransactions(1, 10),
      ]);

      const orders = ordersRes.status === 'fulfilled' ? ordersRes.value.data ?? [] : [];
      const products = productsRes.status === 'fulfilled' ? productsRes.value.data ?? [] : [];
      const reviews = reviewsRes.status === 'fulfilled' ? reviewsRes.value.data ?? [] : [];
      const wallet = walletRes.status === 'fulfilled' ? walletRes.value.data ?? [] : [];

      const derived = deriveNotifications(orders, products, reviews, wallet);
      const state = loadPersisted();
      setPersisted(state);
      setNotifications(applyPersisted(derived, state));
    } catch (e) {
      const msg = e instanceof ApiError ? `${e.message} (${e.status})` : 'Failed to load notifications.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [applyPersisted]);

  useEffect(() => { load(); }, [load]);

  // ── Mutations ────────────────────────────────────────────────────────────────

  const markRead = (id: string) => {
    const next = { ...persisted, readIds: [...new Set([...persisted.readIds, id])] };
    setPersisted(next);
    savePersisted(next);
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    const ids = notifications.map(n => n.id);
    const next = { ...persisted, readIds: [...new Set([...persisted.readIds, ...ids])] };
    setPersisted(next);
    savePersisted(next);
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
  };

  const deleteNotif = (id: string) => {
    const next = { ...persisted, deletedIds: [...new Set([...persisted.deletedIds, id])] };
    setPersisted(next);
    savePersisted(next);
    setNotifications(ns => ns.filter(n => n.id !== id));
  };

  const clearAll = () => {
    const ids = notifications.map(n => n.id);
    const next = { ...persisted, deletedIds: [...new Set([...persisted.deletedIds, ...ids])] };
    setPersisted(next);
    savePersisted(next);
    setNotifications([]);
  };

  // ── Filtered view ────────────────────────────────────────────────────────────

  const filtered = notifications.filter(n => {
    if (filter !== 'all' && n.type !== filter) return false;
    if (showUnreadOnly && n.read) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

        .nb-root {
          --brand: #8B1538;
          --brand-light: #D4828F;
          --gray-50:  #F9FAFB;
          --gray-100: #F3F4F6;
          --gray-200: #E5E7EB;
          --gray-400: #9CA3AF;
          --gray-500: #6B7280;
          --gray-700: #374151;
          --gray-800: #1F2937;
          --radius: 16px;
          --shadow: 0 1px 3px rgba(0,0,0,.05), 0 4px 14px rgba(0,0,0,.04);
          font-family: 'DM Sans', 'Segoe UI', sans-serif;
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 16px;
          background: var(--gray-50);
          min-height: 100dvh;
        }

        /* ── Header bar ──────────────────────────── */
        .nb-header {
          background: #fff;
          border-radius: var(--radius);
          padding: 14px 18px;
          box-shadow: var(--shadow);
          border: 1px solid var(--gray-100);
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
        }
        .nb-header__left { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
        .nb-header__icon {
          width: 38px; height: 38px; border-radius: 12px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #8B153812, #D4828F12);
        }
        .nb-header__title { font-size: 14px; font-weight: 800; color: var(--gray-800); }
        .nb-header__sub { font-size: 11px; color: var(--gray-400); margin-top: 1px; }
        .nb-header__actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

        /* ── Buttons ─────────────────────────────── */
        .nb-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 7px 13px; border-radius: 10px;
          font-size: 12px; font-weight: 600; cursor: pointer;
          border: 1.5px solid var(--gray-200);
          background: #fff; color: var(--gray-500);
          transition: all .15s; white-space: nowrap;
        }
        .nb-btn:hover { border-color: var(--brand); color: var(--brand); background: #FDF2F4; }
        .nb-btn--active { border-color: var(--brand) !important; color: var(--brand) !important; background: #FDF2F4 !important; }
        .nb-btn--danger:hover { border-color: #FCA5A5; color: #DC2626; background: #FEF2F2; }
        .nb-btn:disabled { opacity: .5; cursor: not-allowed; }

        /* ── Filter pills ────────────────────────── */
        .nb-filters {
          display: flex; flex-wrap: wrap; gap: 8px;
        }
        .nb-pill {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 13px; border-radius: 20px;
          font-size: 12px; font-weight: 600; cursor: pointer;
          border: 1.5px solid var(--gray-200);
          background: var(--gray-50); color: var(--gray-400);
          transition: all .15s;
        }
        .nb-pill:hover { color: var(--gray-700); border-color: var(--gray-300); }
        .nb-pill--active { border-color: var(--brand) !important; background: #FDF2F4 !important; color: var(--brand) !important; }
        .nb-pill__count {
          padding: 1px 6px; border-radius: 20px;
          font-size: 10px; background: var(--gray-200); color: var(--gray-500);
        }
        .nb-pill--active .nb-pill__count { background: #8B153820; color: var(--brand); }

        /* ── Notification card ───────────────────── */
        .nb-list { display: flex; flex-direction: column; gap: 8px; }

        .nb-card {
          background: #fff;
          border-radius: var(--radius);
          padding: 14px 16px;
          box-shadow: var(--shadow);
          border: 1.5px solid var(--gray-100);
          cursor: pointer;
          transition: box-shadow .15s, border-color .15s;
          position: relative;
        }
        .nb-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,.09); }
        .nb-card--unread { border-color: #8B153825; background: #FDF8F9; }
        .nb-card__inner { display: flex; align-items: flex-start; gap: 12px; }
        .nb-card__icon {
          width: 38px; height: 38px; border-radius: 11px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; margin-top: 1px;
        }
        .nb-card__body { flex: 1; min-width: 0; }
        .nb-card__row { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
        .nb-card__title-wrap { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .nb-card__title { font-size: 13px; font-weight: 700; color: var(--gray-800); }
        .nb-card__dot { width: 7px; height: 7px; border-radius: 50%; background: var(--brand); flex-shrink: 0; }
        .nb-card__message { font-size: 12px; color: var(--gray-500); margin-top: 3px; line-height: 1.5; }
        .nb-card__meta { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .nb-card__time { font-size: 11px; color: var(--gray-400); white-space: nowrap; }
        .nb-card__delete {
          display: flex; align-items: center;
          padding: 4px; border-radius: 7px; border: none;
          background: transparent; cursor: pointer;
          color: var(--gray-300); transition: all .15s;
          opacity: 0;
        }
        .nb-card:hover .nb-card__delete { opacity: 1; }
        .nb-card__delete:hover { background: #FEF2F2; color: #DC2626; }
        /* Always show delete on touch devices */
        @media (hover: none) { .nb-card__delete { opacity: 1; } }

        /* ── Stats grid ──────────────────────────── */
        .nb-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        @media (min-width: 540px) { .nb-stats { grid-template-columns: repeat(4, 1fr); } }

        .nb-stat {
          background: #fff;
          border-radius: var(--radius);
          padding: 14px;
          box-shadow: var(--shadow);
          border: 1px solid var(--gray-100);
          text-align: center;
        }
        .nb-stat__icon {
          width: 34px; height: 34px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center; margin: 0 auto 8px;
        }
        .nb-stat__count { font-size: 20px; font-weight: 800; color: var(--gray-800); line-height: 1; }
        .nb-stat__label { font-size: 11px; color: var(--gray-400); margin-top: 3px; }

        /* ── Empty state ─────────────────────────── */
        .nb-empty {
          background: #fff;
          border-radius: var(--radius);
          padding: 56px 24px;
          box-shadow: var(--shadow);
          border: 1px solid var(--gray-100);
          text-align: center;
          color: var(--gray-400);
        }
        .nb-empty__icon {
          width: 52px; height: 52px; border-radius: 16px;
          display: flex; align-items: center; justify-content: center; margin: 0 auto 14px;
          background: linear-gradient(135deg, #8B153812, #D4828F12);
        }
        .nb-empty h3 { font-size: 15px; font-weight: 800; color: var(--gray-700); margin-bottom: 6px; }
        .nb-empty p { font-size: 13px; }

        /* ── Error ───────────────────────────────── */
        .nb-error {
          display: flex; align-items: center; gap: 10px;
          padding: 13px 16px;
          background: #FEF2F2; border: 1px solid #FECACA;
          border-radius: var(--radius);
          font-size: 13px; font-weight: 500; color: #DC2626;
        }

        /* ── Loading ─────────────────────────────── */
        .nb-loading {
          display: flex; align-items: center; justify-content: center;
          gap: 10px; padding: 60px; color: var(--gray-400); font-size: 13px;
        }
        .nb-spin { animation: nb-rotate 1s linear infinite; }
        @keyframes nb-rotate { to { transform: rotate(360deg); } }

        /* ── Skeleton ────────────────────────────── */
        .nb-skel {
          border-radius: 8px;
          background: linear-gradient(90deg, #F3F4F6 25%, #EAEBEC 50%, #F3F4F6 75%);
          background-size: 200% 100%;
          animation: nb-shimmer 1.4s infinite;
        }
        @keyframes nb-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div className="nb-root">

        {/* Header */}
        <div className="nb-header">
          <div className="nb-header__left">
            <div className="nb-header__icon">
              <Bell style={{ width: 17, height: 17, color: '#8B1538' }} />
            </div>
            <div>
              <div className="nb-header__title">Notifications</div>
              <div className="nb-header__sub">
                {loading ? 'Loading…' : unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </div>
            </div>
          </div>

          <div className="nb-header__actions">
            <button
              className={`nb-btn${showUnreadOnly ? ' nb-btn--active' : ''}`}
              onClick={() => setShowUnreadOnly(v => !v)}
            >
              <Filter style={{ width: 13, height: 13 }} /> Unread only
            </button>

            {unreadCount > 0 && (
              <button className="nb-btn" onClick={markAllRead}>
                <Check style={{ width: 13, height: 13 }} /> Mark all read
              </button>
            )}

            {notifications.length > 0 && (
              <button className="nb-btn nb-btn--danger" onClick={clearAll}>
                <Trash2 style={{ width: 13, height: 13 }} /> Clear all
              </button>
            )}

            <button className="nb-btn" onClick={load} disabled={loading}>
              <RefreshCw style={{ width: 13, height: 13, ...(loading ? { animation: 'nb-rotate 1s linear infinite' } : {}) }} />
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="nb-error">
            <AlertTriangle style={{ width: 16, height: 16, flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* Filter pills */}
        {!loading && notifications.length > 0 && (
          <div className="nb-filters">
            {FILTER_TYPES.map(type => {
              const count = type === 'all'
                ? notifications.length
                : notifications.filter(n => n.type === type).length;
              const cfg = type !== 'all' ? TYPE_CFG[type] : null;
              const isActive = filter === type;
              return (
                <button
                  key={type}
                  className={`nb-pill${isActive ? ' nb-pill--active' : ''}`}
                  onClick={() => setFilter(type)}
                >
                  {cfg && <cfg.icon style={{ width: 11, height: 11 }} />}
                  {type === 'all' ? 'All' : cfg!.label}
                  <span className="nb-pill__count">{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{
                background: '#fff', borderRadius: 16, padding: '14px 16px',
                border: '1px solid #F3F4F6', display: 'flex', gap: 12, alignItems: 'flex-start'
              }}>
                <div className="nb-skel" style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="nb-skel" style={{ height: 14, width: '45%' }} />
                  <div className="nb-skel" style={{ height: 11, width: '80%' }} />
                  <div className="nb-skel" style={{ height: 11, width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="nb-empty">
            <div className="nb-empty__icon">
              <Bell style={{ width: 22, height: 22, color: '#8B1538' }} />
            </div>
            <h3>No notifications</h3>
            <p>
              {showUnreadOnly
                ? 'No unread notifications right now.'
                : filter !== 'all'
                  ? `No ${TYPE_CFG[filter as NotifType]?.label.toLowerCase()} notifications yet.`
                  : "You're all caught up! Check back later."}
            </p>
          </div>
        ) : (
          <div className="nb-list">
            {filtered.map(n => {
              const cfg = TYPE_CFG[n.type];
              const Icon = cfg.icon;
              return (
                <div
                  key={n.id}
                  className={`nb-card${!n.read ? ' nb-card--unread' : ''}`}
                  onClick={() => markRead(n.id)}
                >
                  <div className="nb-card__inner">
                    <div className="nb-card__icon" style={{ background: cfg.bg }}>
                      <Icon style={{ width: 16, height: 16, color: cfg.color }} />
                    </div>
                    <div className="nb-card__body">
                      <div className="nb-card__row">
                        <div className="nb-card__title-wrap">
                          <span className="nb-card__title">{n.title}</span>
                          {!n.read && <span className="nb-card__dot" />}
                        </div>
                        <div className="nb-card__meta">
                          <span className="nb-card__time">{n.timeLabel}</span>
                          <button
                            className="nb-card__delete"
                            onClick={e => { e.stopPropagation(); deleteNotif(n.id); }}
                            title="Dismiss"
                          >
                            <Trash2 style={{ width: 13, height: 13 }} />
                          </button>
                        </div>
                      </div>
                      <p className="nb-card__message">{n.message}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats summary */}
        {!loading && notifications.length > 0 && (
          <div className="nb-stats">
            {(Object.keys(TYPE_CFG) as NotifType[]).map(type => {
              const count = notifications.filter(n => n.type === type).length;
              const cfg = TYPE_CFG[type];
              return (
                <div key={type} className="nb-stat" onClick={() => setFilter(type)} style={{ cursor: 'pointer' }}>
                  <div className="nb-stat__icon" style={{ background: cfg.bg }}>
                    <cfg.icon style={{ width: 15, height: 15, color: cfg.color }} />
                  </div>
                  <div className="nb-stat__count">{count}</div>
                  <div className="nb-stat__label">{cfg.label}</div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </>
  );
}

export default BusinessNotifications;