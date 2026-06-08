import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import {
  TrendingUp, ShoppingBag, Package, Eye, ArrowUpRight,
  AlertTriangle, ChevronRight, Loader2, RefreshCw, Store,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

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
      } catch { /* fall through to redirect */ }
    }
    tokenStore.clear();
    window.location.href = '/login';
    throw new ApiError('Session expired', 401);
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(json?.message ?? `Request failed: ${res.status}`, res.status, json);
  return json as T;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiStore {
  id: string;
  store_name: string;
  store_slug: string;
  status: string;
  average_rating?: number;
  visitor_count?: number;
}

interface ApiOrder {
  id: string;
  order_number: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed';
  payment_method: string;
  total_amount: number;
  created_at: string;
}

interface ApiProduct {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  stock_status: 'in_stock' | 'out_of_stock' | 'low_stock';
  images: string[];
  review_count?: number;
}

interface PaginatedResponse<T> { data: T[]; total: number; page: number; limit: number }

interface DashboardData {
  total_revenue?: number;
  revenue?: number;
  total_orders?: number;
  orders_count?: number;
  total_products?: number;
  active_products?: number;
  visitors?: number;
  visitor_count?: number;
  revenue_by_day?: { date: string; revenue: number }[];
  order_status_summary?: Record<string, number>;
  [key: string]: unknown;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

const getMyStores = () =>
  authFetch<PaginatedResponse<ApiStore> | ApiStore[]>('/api/v1/stores/my');

const getStoreDashboard = (storeId: string, from?: string, to?: string) => {
  const q = new URLSearchParams();
  if (from) q.set('from', from);
  if (to) q.set('to', to);
  return authFetch<DashboardData>(`/api/v1/analytics/stores/${storeId}/dashboard?${q}`);
};

const getTopProducts = (storeId: string, limit = 5) =>
  authFetch<ApiProduct[] | PaginatedResponse<ApiProduct>>(
    `/api/v1/analytics/stores/${storeId}/top-products?limit=${limit}`
  );

const getStoreOrders = (storeId: string, page = 1, limit = 5) =>
  authFetch<PaginatedResponse<ApiOrder>>(
    `/api/v1/orders/stores/${storeId}?page=${page}&limit=${limit}`
  );

const getStoreProducts = (storeId: string, page = 1, limit = 100) =>
  authFetch<PaginatedResponse<ApiProduct>>(
    `/api/v1/products/stores/${storeId}?page=${page}&limit=${limit}`
  );

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  const safe = n ?? 0;
  if (safe >= 1_000_000) return `₦${(safe / 1_000_000).toFixed(2)}M`;
  if (safe >= 1_000) return `₦${(safe / 1_000).toFixed(1)}K`;
  return `₦${safe.toLocaleString()}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Build a 7-day revenue array from dashboard data or order list fallback
function buildRevenueChart(
  revByDay?: { date: string; revenue: number }[],
  orders?: ApiOrder[]
): { day: string; revenue: number }[] {
  if (revByDay && revByDay.length > 0) {
    return revByDay.slice(-7).map(d => ({
      day: new Date(d.date).toLocaleDateString('en-NG', { weekday: 'short' }),
      revenue: d.revenue ?? 0,
    }));
  }
  // Fallback: bucket recent orders by day
  const days: Record<string, number> = {};
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days[d.toDateString()] = 0;
  }
  (orders ?? []).forEach(o => {
    const key = new Date(o.created_at).toDateString();
    if (key in days) days[key] = (days[key] ?? 0) + (o.total_amount ?? 0);
  });
  return Object.entries(days).map(([d, revenue]) => ({
    day: new Date(d).toLocaleDateString('en-NG', { weekday: 'short' }),
    revenue,
  }));
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { bg: string; color: string; label: string }> = {
  pending:    { bg: '#FEF3C7', color: '#D97706', label: 'Pending' },
  processing: { bg: '#DBEAFE', color: '#2563EB', label: 'Processing' },
  shipped:    { bg: '#D1FAE5', color: '#059669', label: 'Shipped' },
  delivered:  { bg: '#F0FDF4', color: '#16A34A', label: 'Delivered' },
  cancelled:  { bg: '#FEE2E2', color: '#DC2626', label: 'Cancelled' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Skeleton({ w = '100%', h = 20, r = 8 }: { w?: string | number; h?: number; r?: number }) {
  return (
    <div
      style={{
        width: w, height: h, borderRadius: r,
        background: 'linear-gradient(90deg, #F3F4F6 25%, #E9EAEC 50%, #F3F4F6 75%)',
        backgroundSize: '200% 100%',
        animation: 'db-shimmer 1.4s infinite',
        flexShrink: 0,
      }}
    />
  );
}

function StatCard({
  icon: Icon, label, value, sub, color, loading,
}: {
  icon: React.ElementType; label: string; value: string;
  sub?: string; color: string; loading?: boolean;
}) {
  return (
    <div className="db-card db-stat-card">
      <div className="db-stat-card__top">
        <div className="db-stat-card__icon" style={{ background: `${color}18` }}>
          <Icon style={{ width: 18, height: 18, color }} />
        </div>
        {sub && !loading && (
          <span className="db-stat-card__change">
            <TrendingUp style={{ width: 11, height: 11 }} /> {sub}
          </span>
        )}
      </div>
      <p className="db-stat-card__label">{label}</p>
      {loading
        ? <Skeleton h={28} w="60%" />
        : <p className="db-stat-card__value">{value}</p>}
    </div>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? { bg: '#F3F4F6', color: '#6B7280', label: status };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 9px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        background: cfg.bg,
        color: cfg.color,
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.label}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BusinessDashboard() {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [stores, setStores] = useState<ApiStore[]>([]);

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [topProducts, setTopProducts] = useState<ApiProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<ApiOrder[]>([]);
  const [allProducts, setAllProducts] = useState<ApiProduct[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load stores on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await getMyStores();
        const list: ApiStore[] = Array.isArray(raw) ? raw : (raw as PaginatedResponse<ApiStore>).data ?? [];
        setStores(list);
        if (list[0]?.id) setStoreId(list[0].id);
        else { setLoading(false); setError('No stores found. Create a store to see your dashboard.'); }
      } catch (e) {
        const msg = e instanceof ApiError ? `${e.message} (${e.status})` : 'Failed to load stores.';
        setError(msg);
        setLoading(false);
      }
    })();
  }, []);

  // Load all dashboard data when storeId changes
  const loadDashboard = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    setError('');
    try {
      // Get date range: last 30 days
      const to = new Date().toISOString().split('T')[0];
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 30);
      const from = fromDate.toISOString().split('T')[0];

      const [dash, tpRaw, ordersRes, prodsRes] = await Promise.allSettled([
        getStoreDashboard(storeId, from, to),
        getTopProducts(storeId, 5),
        getStoreOrders(storeId, 1, 5),
        getStoreProducts(storeId, 1, 100),
      ]);

      if (dash.status === 'fulfilled') setDashboard(dash.value);
      if (tpRaw.status === 'fulfilled') {
        const v = tpRaw.value;
        setTopProducts(Array.isArray(v) ? v : (v as PaginatedResponse<ApiProduct>).data ?? []);
      }
      if (ordersRes.status === 'fulfilled') setRecentOrders(ordersRes.value.data ?? []);
      if (prodsRes.status === 'fulfilled') setAllProducts(prodsRes.value.data ?? []);
    } catch (e) {
      const msg = e instanceof ApiError ? `${e.message} (${e.status})` : 'Failed to load dashboard.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  // ── Derived values ──────────────────────────────────────────────────────────

  const revenue = ((dashboard?.total_revenue ?? dashboard?.revenue ?? 0) as number);
  const ordersCount = ((dashboard?.total_orders ?? dashboard?.orders_count ?? 0) as number);
  const activeProducts = ((dashboard?.total_products ?? dashboard?.active_products ?? allProducts.filter(p => p.stock_status !== 'out_of_stock').length) as number);
  const visitors = ((dashboard?.visitors ?? dashboard?.visitor_count ?? stores.find(s => s.id === storeId)?.visitor_count ?? 0) as number);

  const lowStock = allProducts.filter(p => p.stock_status === 'low_stock').length;
  const outOfStock = allProducts.filter(p => p.stock_status === 'out_of_stock').length;

  const statusSummary = (dashboard?.order_status_summary as Record<string, number> | undefined) ?? (() => {
    const s: Record<string, number> = { pending: 0, processing: 0, shipped: 0, delivered: 0 };
    recentOrders.forEach(o => { if (o.status in s) s[o.status]++; });
    return s;
  })();

  const chartData = buildRevenueChart(
    dashboard?.revenue_by_day as { date: string; revenue: number }[] | undefined,
    recentOrders
  );

  // Max sold for % bar scaling
  const maxSold = Math.max(...topProducts.map(p => p.stock_quantity ?? 1), 1);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

        .db-root {
          --brand: #8B1538;
          --brand-light: #D4828F;
          --teal: #3D9B8E;
          --gray-50: #F9FAFB;
          --gray-100: #F3F4F6;
          --gray-200: #E5E7EB;
          --gray-400: #9CA3AF;
          --gray-500: #6B7280;
          --gray-700: #374151;
          --gray-800: #1F2937;
          --radius: 16px;
          --shadow: 0 1px 4px rgba(0,0,0,.05), 0 4px 16px rgba(0,0,0,.04);
          font-family: 'DM Sans', 'Segoe UI', sans-serif;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 16px;
          background: var(--gray-50);
          min-height: 100dvh;
        }

        /* ── Store switcher row ─────────────────── */
        .db-topbar {
          display: flex; align-items: center;
          gap: 10px; flex-wrap: wrap;
        }
        .db-store-select {
          padding: 8px 14px;
          border: 1.5px solid var(--brand);
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          color: var(--brand);
          background: #fff;
          outline: none;
          cursor: pointer;
          flex-shrink: 0;
        }
        .db-refresh-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 14px;
          border: 1.5px solid var(--gray-200);
          border-radius: 10px;
          font-size: 12px; font-weight: 600;
          color: var(--gray-500);
          background: #fff;
          cursor: pointer;
          margin-left: auto;
          transition: border-color .15s, color .15s;
        }
        .db-refresh-btn:hover { border-color: var(--brand); color: var(--brand); }
        .db-refresh-btn:disabled { opacity: .5; cursor: not-allowed; }

        /* ── Alert banner ──────────────────────── */
        .db-alert {
          display: flex; align-items: center;
          justify-content: space-between;
          flex-wrap: wrap; gap: 10px;
          padding: 14px 18px;
          border-radius: var(--radius);
          background: linear-gradient(135deg, #FEF3C7, #FDE68A);
        }
        .db-alert__left { display: flex; align-items: center; gap: 10px; }
        .db-alert__text { font-size: 13px; font-weight: 500; color: #92400E; }
        .db-alert__link {
          display: flex; align-items: center; gap: 4px;
          font-size: 12px; font-weight: 700;
          color: #78350F; white-space: nowrap;
          text-decoration: none;
        }
        .db-alert__link:hover { text-decoration: underline; }

        /* ── Card base ─────────────────────────── */
        .db-card {
          background: #fff;
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          border: 1px solid var(--gray-100);
        }

        /* ── Stat cards grid ───────────────────── */
        .db-stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (min-width: 900px) {
          .db-stats-grid { grid-template-columns: repeat(4, 1fr); }
        }

        .db-stat-card { padding: 16px; }
        .db-stat-card__top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .db-stat-card__icon {
          width: 38px; height: 38px; border-radius: 11px;
          display: flex; align-items: center; justify-content: center;
        }
        .db-stat-card__change {
          display: flex; align-items: center; gap: 3px;
          font-size: 11px; font-weight: 700;
          color: #059669; background: #D1FAE5;
          padding: 3px 8px; border-radius: 20px;
        }
        .db-stat-card__label { font-size: 11px; color: var(--gray-500); font-weight: 500; margin-bottom: 5px; }
        .db-stat-card__value { font-size: 22px; font-weight: 800; color: var(--gray-800); line-height: 1.1; }

        /* ── Middle section grid ───────────────── */
        .db-mid-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }
        @media (min-width: 900px) {
          .db-mid-grid { grid-template-columns: 3fr 2fr; }
        }

        /* ── Chart card ────────────────────────── */
        .db-chart-card { padding: 20px; }
        .db-chart-card__header {
          display: flex; align-items: flex-start; justify-content: space-between;
          margin-bottom: 18px; flex-wrap: wrap; gap: 8px;
        }
        .db-chart-card__title { font-size: 15px; font-weight: 800; color: var(--gray-800); }
        .db-chart-card__sub { font-size: 11px; color: var(--gray-400); margin-top: 2px; }
        .db-chart-card__badge {
          padding: 4px 12px; border-radius: 20px;
          font-size: 11px; font-weight: 700; color: #fff;
          background: linear-gradient(135deg, var(--brand), var(--brand-light));
          white-space: nowrap;
        }

        /* ── Right column ──────────────────────── */
        .db-right-col { display: flex; flex-direction: column; gap: 14px; }

        .db-mini-card { padding: 18px; }
        .db-mini-card__title { font-size: 14px; font-weight: 800; color: var(--gray-800); margin-bottom: 14px; }

        /* Top products */
        .db-top-product { margin-bottom: 12px; }
        .db-top-product:last-child { margin-bottom: 0; }
        .db-top-product__row {
          display: flex; align-items: center; gap: 10px; margin-bottom: 5px;
        }
        .db-top-product__img {
          width: 30px; height: 30px; border-radius: 8px;
          object-fit: cover; background: var(--gray-100); flex-shrink: 0;
        }
        .db-top-product__name {
          font-size: 12px; font-weight: 600; color: var(--gray-700);
          flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .db-top-product__price {
          font-size: 12px; font-weight: 700; color: var(--gray-800); white-space: nowrap;
        }
        .db-bar-track {
          height: 5px; background: var(--gray-100); border-radius: 10px; overflow: hidden;
        }
        .db-bar-fill {
          height: 100%; border-radius: 10px;
          background: linear-gradient(to right, var(--brand), var(--brand-light));
          transition: width .6s ease;
        }

        /* Order summary grid */
        .db-order-summary-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
        }
        .db-order-summary-cell {
          padding: 10px; border-radius: 12px; text-align: center;
        }
        .db-order-summary-cell__count {
          font-size: 20px; font-weight: 800; line-height: 1.1;
        }
        .db-order-summary-cell__label { font-size: 11px; color: var(--gray-500); margin-top: 2px; }

        /* ── Orders table ──────────────────────── */
        .db-orders-card { overflow: hidden; }
        .db-orders-card__header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 20px;
          border-bottom: 1px solid var(--gray-100);
        }
        .db-orders-card__title { font-size: 15px; font-weight: 800; color: var(--gray-800); }
        .db-orders-card__link {
          display: flex; align-items: center; gap: 4px;
          font-size: 13px; font-weight: 700; color: var(--brand);
          text-decoration: none;
        }
        .db-orders-card__link:hover { text-decoration: underline; }

        .db-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        table.db-table { width: 100%; border-collapse: collapse; min-width: 520px; }
        .db-table th {
          padding: 9px 16px;
          text-align: left; font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: .05em;
          color: var(--gray-400); background: var(--gray-50);
          white-space: nowrap;
        }
        .db-table td {
          padding: 12px 16px;
          border-top: 1px solid var(--gray-50);
          font-size: 13px; color: var(--gray-700);
          vertical-align: middle;
        }
        .db-table tr:hover td { background: #FAFAFA; }

        /* Mobile order cards */
        .db-order-mobile-cards { display: none; }
        @media (max-width: 599px) {
          .db-table-wrap { display: none; }
          .db-order-mobile-cards { display: flex; flex-direction: column; }
        }
        .db-order-mobile-card {
          padding: 12px 16px;
          border-top: 1px solid var(--gray-100);
          display: flex; align-items: center; gap: 10px;
        }
        .db-order-mobile-card:first-child { border-top: none; }
        .db-order-mobile-card__info { flex: 1; min-width: 0; }
        .db-order-mobile-card__id {
          font-size: 12px; font-family: monospace;
          font-weight: 700; color: var(--brand); margin-bottom: 2px;
        }
        .db-order-mobile-card__date { font-size: 11px; color: var(--gray-400); }
        .db-order-mobile-card__right { text-align: right; flex-shrink: 0; }
        .db-order-mobile-card__amount { font-size: 13px; font-weight: 800; color: var(--gray-800); margin-bottom: 4px; }

        /* ── Error / empty ─────────────────────── */
        .db-error {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 16px;
          background: #FEF2F2; border: 1px solid #FECACA;
          border-radius: var(--radius);
          font-size: 13px; font-weight: 500; color: #DC2626;
        }
        .db-empty {
          padding: 48px 24px; text-align: center;
          color: var(--gray-400);
        }
        .db-empty p { font-weight: 600; margin-bottom: 4px; }

        /* ── Loading spinner ───────────────────── */
        .db-spin { animation: db-rotate 1s linear infinite; }
        @keyframes db-rotate { to { transform: rotate(360deg); } }
        @keyframes db-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div className="db-root">

        {/* Top bar: store switcher + refresh */}
        <div className="db-topbar">
          {stores.length > 1 && (
            <select
              className="db-store-select"
              value={storeId ?? ''}
              onChange={e => setStoreId(e.target.value)}
            >
              {stores.map(s => <option key={s.id} value={s.id}>{s.store_name}</option>)}
            </select>
          )}
          {stores.length === 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 700, color: 'var(--brand)' }}>
              <Store style={{ width: 16, height: 16 }} /> {stores[0].store_name}
            </div>
          )}
          <button className="db-refresh-btn" onClick={loadDashboard} disabled={loading}>
            <RefreshCw style={{ width: 13, height: 13 }} className={loading ? 'db-spin' : ''} />
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="db-error">
            <AlertTriangle style={{ width: 16, height: 16, flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* Alert: low / out of stock */}
        {(lowStock > 0 || outOfStock > 0) && !loading && (
          <div className="db-alert">
            <div className="db-alert__left">
              <AlertTriangle style={{ width: 18, height: 18, color: '#D97706', flexShrink: 0 }} />
              <p className="db-alert__text">
                {lowStock > 0 && `${lowStock} product${lowStock > 1 ? 's' : ''} running low`}
                {lowStock > 0 && outOfStock > 0 && ', '}
                {outOfStock > 0 && `${outOfStock} out of stock`}
              </p>
            </div>
            <Link to="/business/inventory" className="db-alert__link">
              View Inventory <ChevronRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>
        )}

        {/* Stat cards */}
        <div className="db-stats-grid">
          <StatCard icon={TrendingUp} label="Revenue (30 days)" value={loading ? '—' : fmt(revenue)} color="#8B1538" loading={loading} />
          <StatCard icon={ShoppingBag} label="Orders (30 days)" value={loading ? '—' : (ordersCount ?? 0).toString()} color="#3D9B8E" loading={loading} />
          <StatCard icon={Package} label="Active Products" value={loading ? '—' : (activeProducts ?? 0).toString()} color="#D4828F" loading={loading} />
          <StatCard icon={Eye} label="Store Visitors" value={loading ? '—' : (visitors ?? 0).toLocaleString()} color="#6366F1" loading={loading} />
        </div>

        {/* Chart + side panel */}
        <div className="db-mid-grid">
          {/* Revenue chart */}
          <div className="db-card db-chart-card">
            <div className="db-chart-card__header">
              <div>
                <div className="db-chart-card__title">Weekly Revenue</div>
                <div className="db-chart-card__sub">Last 7 days</div>
              </div>
              {!loading && <span className="db-chart-card__badge">{fmt(revenue)} MTD</span>}
            </div>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: 10, color: 'var(--gray-400)', fontSize: 13 }}>
                <Loader2 className="db-spin" style={{ width: 18, height: 18 }} /> Loading chart…
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="dbRevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B1538" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#8B1538" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `₦${((v ?? 0) / 1000).toFixed(0)}k`} width={44} />
                  <Tooltip
                    formatter={(v: number) => [`₦${(v ?? 0).toLocaleString()}`, 'Revenue']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #F3F4F6', boxShadow: '0 4px 20px rgba(0,0,0,.08)', fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#8B1538" strokeWidth={2.5} fill="url(#dbRevGrad)" dot={{ fill: '#8B1538', r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Right column */}
          <div className="db-right-col">
            {/* Top Products */}
            <div className="db-card db-mini-card">
              <div className="db-mini-card__title">Top Products</div>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[1, 2, 3].map(i => <Skeleton key={i} h={36} />)}
                </div>
              ) : topProducts.length === 0 ? (
                <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>No product data yet.</p>
              ) : (
                topProducts.map((p, i) => (
                  <div key={p.id ?? i} className="db-top-product">
                    <div className="db-top-product__row">
                      <img
                        src={p.images?.[0] ?? 'https://via.placeholder.com/30?text=?'}
                        alt={p.name}
                        className="db-top-product__img"
                        onError={e => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/30?text=?'; }}
                      />
                      <span className="db-top-product__name">{p.name}</span>
                      <span className="db-top-product__price">{fmt(p.price ?? 0)}</span>
                    </div>
                    <div className="db-bar-track">
                      <div className="db-bar-fill" style={{ width: `${Math.round(((p.stock_quantity ?? 0) / maxSold) * 100)}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Order Status Summary */}
            <div className="db-card db-mini-card">
              <div className="db-mini-card__title">Order Summary</div>
              <div className="db-order-summary-grid">
                {[
                  { key: 'pending',    label: 'Pending',    color: '#D97706' },
                  { key: 'processing', label: 'Processing', color: '#2563EB' },
                  { key: 'shipped',    label: 'Shipped',    color: '#059669' },
                  { key: 'delivered',  label: 'Delivered',  color: '#16A34A' },
                ].map(s => (
                  <div
                    key={s.key}
                    className="db-order-summary-cell"
                    style={{ background: `${s.color}12` }}
                  >
                    {loading
                      ? <Skeleton h={22} w="50%" r={4} />
                      : <div className="db-order-summary-cell__count" style={{ color: s.color }}>{statusSummary[s.key] ?? 0}</div>}
                    <div className="db-order-summary-cell__label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="db-card db-orders-card">
          <div className="db-orders-card__header">
            <h3 className="db-orders-card__title">Recent Orders</h3>
            <Link to="/business/orders" className="db-orders-card__link">
              View All <ArrowUpRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 20px' }}>
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} h={24} />)}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="db-empty">
              <ShoppingBag style={{ width: 36, height: 36, margin: '0 auto 12px', opacity: .3 }} />
              <p>No orders yet</p>
              <span style={{ fontSize: 12 }}>Orders will appear here once customers start buying</span>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="db-table-wrap">
                <table className="db-table">
                  <thead>
                    <tr>
                      {['Order ID', 'Total', 'Payment', 'Status', 'Date'].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(o => (
                      <tr key={o.id}>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand)', fontSize: 12 }}>
                            #{o.order_number}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--gray-800)' }}>
                          ₦{(o.total_amount ?? 0).toLocaleString()}
                        </td>
                        <td>
                          <span style={{
                            padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                            background: o.payment_status === 'paid' ? '#D1FAE5' : o.payment_status === 'failed' ? '#FEE2E2' : '#FEF3C7',
                            color: o.payment_status === 'paid' ? '#059669' : o.payment_status === 'failed' ? '#DC2626' : '#D97706',
                          }}>
                            {o.payment_status}
                          </span>
                        </td>
                        <td><OrderStatusBadge status={o.status} /></td>
                        <td style={{ color: 'var(--gray-400)', fontSize: 12 }}>{fmtDate(o.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="db-order-mobile-cards">
                {recentOrders.map(o => (
                  <div key={o.id} className="db-order-mobile-card">
                    <div className="db-order-mobile-card__info">
                      <div className="db-order-mobile-card__id">#{o.order_number}</div>
                      <div className="db-order-mobile-card__date">{fmtDate(o.created_at)}</div>
                    </div>
                    <div className="db-order-mobile-card__right">
                      <div className="db-order-mobile-card__amount">₦{(o.total_amount ?? 0).toLocaleString()}</div>
                      <OrderStatusBadge status={o.status} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </div>
    </>
  );
}

export default BusinessDashboard;