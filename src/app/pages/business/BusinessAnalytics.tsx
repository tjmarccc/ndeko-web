import { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  TrendingUp, TrendingDown, ShoppingBag, BarChart3, Eye,
  RefreshCw, AlertCircle, Store, Calendar,
} from 'lucide-react';
import {
  getStoreDashboard,
  getTopProducts,
  getMyStores,
  getStoreOrders,
  type ApiProduct,
  type ApiStore,
  type ApiOrder,
} from '../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardData {
  revenue: number;
  order_count: number;
  visitor_count: number;
  revenue_change_pct?: number;
  order_change_pct?: number;
  visitor_change_pct?: number;
  revenue_by_day?: { date: string; revenue: number; orders: number }[];
  orders_by_status?: Record<string, number>;
}

interface ChartPoint {
  label: string;
  revenue: number;
  orders: number;
}

interface CategoryPoint {
  name: string;
  value: number;
  color: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PIE_COLORS = ['#8B1538', '#D4828F', '#3D9B8E', '#6366F1', '#F59E0B', '#9CA3AF'];
const RADIAN = Math.PI / 180;

const MON_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n.toLocaleString()}`;
}

function fmtFull(n: number) {
  return `₦${n.toLocaleString()}`;
}

function dateToLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? dateStr : `${MON_ABBR[d.getMonth()]} ${d.getDate()}`;
}

/** Build chart points from revenue_by_day array */
function buildChartPoints(raw?: { date: string; revenue: number; orders: number }[]): ChartPoint[] {
  if (!raw || raw.length === 0) return [];
  // Group by week if > 14 days, else show daily
  if (raw.length > 14) {
    // Group into ~7 buckets
    const bucket = Math.ceil(raw.length / 7);
    const buckets: ChartPoint[] = [];
    for (let i = 0; i < raw.length; i += bucket) {
      const slice = raw.slice(i, i + bucket);
      buckets.push({
        label: dateToLabel(slice[0].date),
        revenue: slice.reduce((s, r) => s + r.revenue, 0),
        orders: slice.reduce((s, r) => s + r.orders, 0),
      });
    }
    return buckets;
  }
  return raw.map((r) => ({ label: dateToLabel(r.date), revenue: r.revenue, orders: r.orders }));
}

/** Build category breakdown from orders_by_status */
function buildCategoryBreakdown(statusMap?: Record<string, number>): CategoryPoint[] {
  if (!statusMap) return [];
  const total = Object.values(statusMap).reduce((s, v) => s + v, 0) || 1;
  return Object.entries(statusMap).map(([name, count], i) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: Math.round((count / total) * 100),
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));
}

/** Build top-product rows from ApiProduct[] */
function buildTopProducts(products: ApiProduct[]) {
  return products.slice(0, 5).map((p) => ({
    name: p.name.length > 22 ? p.name.slice(0, 22) + '…' : p.name,
    revenue: p.price * (p.stock_quantity ?? 0),
    units: p.stock_quantity ?? 0,
  }));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  label, value, change, up, icon: Icon, color,
}: {
  label: string; value: string; change?: string; up?: boolean;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="p-2 sm:p-2.5 rounded-xl" style={{ background: `${color}18` }}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color }} />
        </div>
        {change !== undefined && (
          <span
            className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
            style={{ background: up ? '#D1FAE5' : '#FEE2E2', color: up ? '#059669' : '#DC2626' }}
          >
            {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {change}
          </span>
        )}
      </div>
      <div>
        <p className="text-gray-500 text-xs font-medium mb-1 leading-snug">{label}</p>
        <p className="text-gray-900 font-bold text-xl sm:text-2xl leading-none">{value}</p>
      </div>
    </div>
  );
}

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.06) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
      <BarChart3 className="h-8 w-8 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 text-xs font-semibold bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors"
      >
        <RefreshCw className="h-3 w-3" /> Retry
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BusinessAnalytics() {
  const [stores, setStores] = useState<ApiStore[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [topProducts, setTopProducts] = useState<ApiProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<ApiOrder[]>([]);

  const [loadingStores, setLoadingStores] = useState(true);
  const [loadingDash, setLoadingDash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load stores on mount ──
  useEffect(() => {
    setLoadingStores(true);
    getMyStores()
      .then((res) => {
        const list = res.data ?? [];
        setStores(list);
        if (list.length > 0) setSelectedStoreId(list[0].id);
      })
      .catch((e) => setError(e.message ?? 'Failed to load stores'))
      .finally(() => setLoadingStores(false));
  }, []);

  // ── Date range helpers ──
  const getDateRange = useCallback(() => {
    const to = new Date();
    const from = new Date();
    if (dateRange === '7d') from.setDate(to.getDate() - 7);
    else if (dateRange === '30d') from.setDate(to.getDate() - 30);
    else from.setDate(to.getDate() - 90);
    return {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
    };
  }, [dateRange]);

  // ── Load dashboard data when store or range changes ──
  const loadDashboard = useCallback(async () => {
    if (!selectedStoreId) return;
    setLoadingDash(true);
    setError(null);
    const { from, to } = getDateRange();
    try {
      const [dash, products, orders] = await Promise.all([
        (getStoreDashboard(selectedStoreId, from, to) as unknown) as Promise<DashboardData>,
        getTopProducts(selectedStoreId, 5),
        getStoreOrders(selectedStoreId, 1, 5).then((r) => r.data ?? []),
      ]);
      setDashboard(dash);
      setTopProducts(products);
      setRecentOrders(orders);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load analytics data');
    } finally {
      setLoadingDash(false);
    }
  }, [selectedStoreId, getDateRange]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // ── Derived chart data ──
  const chartPoints = buildChartPoints(dashboard?.revenue_by_day);
  const categoryBreakdown = buildCategoryBreakdown(dashboard?.orders_by_status);
  const topProductRows = buildTopProducts(topProducts);

  const totalRevenue = dashboard?.revenue ?? 0;
  const totalOrders = dashboard?.order_count ?? 0;
  const totalVisitors = dashboard?.visitor_count ?? 0;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  const revChange = dashboard?.revenue_change_pct;
  const ordChange = dashboard?.order_change_pct;
  const visChange = dashboard?.visitor_change_pct;

  // ── Render ──
  if (loadingStores) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
        <RefreshCw className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading your stores…</span>
      </div>
    );
  }

  if (stores.length === 0 && !loadingStores) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
        <Store className="h-10 w-10 opacity-40" />
        <p className="text-sm font-medium">No stores found. Create a store to see analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">

      {/* ── Header controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-gray-900 font-bold text-lg sm:text-xl">Analytics</h2>
          <p className="text-gray-400 text-xs mt-0.5">Live data from your store</p>
        </div>

        {/* Store picker */}
        {stores.length > 1 && (
          <div className="flex items-center gap-2 min-w-0">
            <Store className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8B1538] focus:ring-offset-0 min-w-0 max-w-[180px] truncate"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.store_name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Date range picker */}
        <div className="flex items-center gap-1.5 bg-gray-100 rounded-xl p-1 self-start sm:self-auto">
          {(['7d', '30d', '90d'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                dateRange === r
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {r === '7d' ? '7 days' : r === '30d' ? '30 days' : '90 days'}
            </button>
          ))}
        </div>

        <button
          onClick={loadDashboard}
          disabled={loadingDash}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loadingDash ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* ── Error ── */}
      {error && <ErrorBanner message={error} onRetry={loadDashboard} />}

      {/* ── Loading overlay ── */}
      {loadingDash && (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-1">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          Fetching latest data…
        </div>
      )}

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label="Total Revenue"
          value={fmt(totalRevenue)}
          change={revChange !== undefined ? `${revChange > 0 ? '+' : ''}${revChange.toFixed(1)}%` : undefined}
          up={(revChange ?? 0) >= 0}
          icon={TrendingUp}
          color="#8B1538"
        />
        <KpiCard
          label="Total Orders"
          value={totalOrders.toString()}
          change={ordChange !== undefined ? `${ordChange > 0 ? '+' : ''}${ordChange.toFixed(1)}%` : undefined}
          up={(ordChange ?? 0) >= 0}
          icon={ShoppingBag}
          color="#3D9B8E"
        />
        <KpiCard
          label="Avg Order Value"
          value={fmt(avgOrderValue)}
          icon={BarChart3}
          color="#D4828F"
        />
        <KpiCard
          label="Store Visitors"
          value={totalVisitors.toLocaleString()}
          change={visChange !== undefined ? `${visChange > 0 ? '+' : ''}${visChange.toFixed(1)}%` : undefined}
          up={(visChange ?? 0) >= 0}
          icon={Eye}
          color="#6366F1"
        />
      </div>

      {/* ── Revenue trend + Category breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5">
        {/* Revenue area chart */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-gray-800 font-bold text-sm sm:text-base">Revenue Trend</h3>
              <p className="text-gray-400 text-xs mt-0.5 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {dateRange === '7d' ? 'Last 7 days' : dateRange === '30d' ? 'Last 30 days' : 'Last 90 days'}
              </p>
            </div>
          </div>

          {chartPoints.length === 0 ? (
            <EmptyState message="No revenue data for this period" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartPoints} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B1538" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8B1538" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={fmt} width={52} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === 'revenue' ? fmtFull(value) : value,
                      name === 'revenue' ? 'Revenue' : 'Orders',
                    ]}
                    contentStyle={{ borderRadius: 12, border: '1px solid #F3F4F6', fontSize: 12 }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="revenue" stroke="#8B1538" strokeWidth={2.5} fill="url(#revGrad)" name="revenue" dot={false} />
                </AreaChart>
              </ResponsiveContainer>

              <div className="mt-4 pt-4 border-t border-gray-50">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Orders</p>
                <ResponsiveContainer width="100%" height={70}>
                  <BarChart data={chartPoints} margin={{ top: 0, right: 5, bottom: 0, left: 0 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={24} />
                    <Tooltip formatter={(v: number) => [v, 'Orders']} contentStyle={{ borderRadius: 10, fontSize: 11 }} />
                    <Bar dataKey="orders" radius={[4, 4, 0, 0]} fill="#3D9B8E" opacity={0.8} name="orders" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>

        {/* Orders by status pie */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 min-w-0">
          <h3 className="text-gray-800 font-bold text-sm sm:text-base mb-4">Orders by Status</h3>
          {categoryBreakdown.length === 0 ? (
            <EmptyState message="No order status data" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={80}
                    innerRadius={32}
                    dataKey="value"
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, 'Share']} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {categoryBreakdown.map((c) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
                      <span className="text-xs text-gray-600 truncate">{c.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-700 flex-shrink-0 ml-2">{c.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Top Products + Recent Orders ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Top products bar chart */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 min-w-0">
          <h3 className="text-gray-800 font-bold text-sm sm:text-base mb-4">Top Products by Stock Value</h3>
          {topProductRows.length === 0 ? (
            <EmptyState message="No products found" />
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={topProductRows} layout="vertical" margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={fmt} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#6B7280' }}
                  axisLine={false}
                  tickLine={false}
                  width={110}
                />
                <Tooltip formatter={(v: number) => [fmtFull(v), 'Stock Value']} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                  {topProductRows.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i] ?? '#9CA3AF'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent orders table */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 min-w-0 overflow-hidden">
          <h3 className="text-gray-800 font-bold text-sm sm:text-base mb-4">Recent Orders</h3>
          {recentOrders.length === 0 ? (
            <EmptyState message="No recent orders" />
          ) : (
            <div className="overflow-x-auto -mx-1 px-1">
              <table className="w-full min-w-[340px]">
                <thead>
                  <tr className="text-left">
                    <th className="text-xs font-semibold text-gray-400 pb-3 pr-3">Order</th>
                    <th className="text-xs font-semibold text-gray-400 pb-3 pr-3">Amount</th>
                    <th className="text-xs font-semibold text-gray-400 pb-3 pr-3">Status</th>
                    <th className="text-xs font-semibold text-gray-400 pb-3">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="py-2.5 pr-3 text-xs text-gray-700 font-medium truncate max-w-[90px]">
                        #{order.order_number}
                      </td>
                      <td className="py-2.5 pr-3 text-xs font-semibold text-gray-800">
                        {fmtFull(order.total_amount)}
                      </td>
                      <td className="py-2.5 pr-3">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{
                            background:
                              order.status === 'delivered' ? '#D1FAE5' :
                              order.status === 'shipped' ? '#DBEAFE' :
                              order.status === 'processing' ? '#FEF3C7' :
                              order.status === 'cancelled' ? '#FEE2E2' : '#F3F4F6',
                            color:
                              order.status === 'delivered' ? '#059669' :
                              order.status === 'shipped' ? '#1D4ED8' :
                              order.status === 'processing' ? '#D97706' :
                              order.status === 'cancelled' ? '#DC2626' : '#6B7280',
                          }}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{
                            background: order.payment_status === 'paid' ? '#D1FAE5' : order.payment_status === 'failed' ? '#FEE2E2' : '#FEF3C7',
                            color: order.payment_status === 'paid' ? '#059669' : order.payment_status === 'failed' ? '#DC2626' : '#D97706',
                          }}
                        >
                          {order.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}