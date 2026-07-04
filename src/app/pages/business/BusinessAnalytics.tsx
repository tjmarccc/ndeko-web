import { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, TrendingDown, ShoppingBag, BarChart3, Percent,
  RefreshCw, AlertCircle,
} from 'lucide-react';
import {
  getMyBusiness,
  getStoreOverview,
  getMonthlyRevenue,
  getSalesByCategory,
  getTopProducts,
  type ApiStore,
  type StoreOverview,
  type MonthlyRevenue,
  type SalesByCategory,
  type TopProductEntry,
} from '../../services/api';

const MONTHS_WINDOW = 7;
const CATEGORY_COLORS = ['#8B1538', '#D4828F', '#3D9B8E', '#6366F1', '#F59E0B', '#9CA3AF'];
const TOP_PRODUCT_COLORS = ['#8B1538', '#D4828F', '#3D9B8E'];

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function fmt(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n.toLocaleString()}`;
}

function KpiCard({
  label, value, change, icon: Icon, color,
}: {
  label: string; value: string; change: number | null;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="p-2 sm:p-2.5 rounded-xl" style={{ background: `${color}18` }}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color }} />
        </div>
        {change !== null && (
          <span
            className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
            style={{ background: change >= 0 ? '#D1FAE5' : '#FEE2E2', color: change >= 0 ? '#059669' : '#DC2626' }}
          >
            {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {change >= 0 ? '+' : ''}{change.toFixed(1)}%
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

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function BusinessAnalytics() {
  const [store, setStore] = useState<ApiStore | null>(null);
  const [overview, setOverview] = useState<StoreOverview | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue | null>(null);
  const [salesByCategory, setSalesByCategory] = useState<SalesByCategory | null>(null);
  const [topProducts, setTopProducts] = useState<TopProductEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const myStore = store ?? await getMyBusiness();
      if (!myStore) throw new Error('No store found for this account.');
      if (!store) setStore(myStore);

      const today = new Date();
      const from = new Date(today.getFullYear(), today.getMonth() - (MONTHS_WINDOW - 1), 1);

      const [overviewRes, monthlyRes, categoryRes, topProductsRes] = await Promise.all([
        getStoreOverview(myStore.id, MONTHS_WINDOW),
        getMonthlyRevenue(myStore.id, MONTHS_WINDOW),
        getSalesByCategory(myStore.id, toISODate(from), toISODate(today)),
        getTopProducts(myStore.id, 5, undefined, toISODate(from), toISODate(today)),
      ]);

      setOverview(overviewRes);
      setMonthlyRevenue(monthlyRes);
      setSalesByCategory(categoryRes);
      setTopProducts(topProductsRes.products);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [store]);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
        <RefreshCw className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading analytics…</span>
      </div>
    );
  }

  const categoryData = (salesByCategory?.categories ?? []).map((c, i) => ({
    name: c.name,
    value: c.percentage,
    revenue: c.revenue,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 font-bold text-lg sm:text-xl">Analytics</h2>
          <p className="text-gray-400 text-xs mt-0.5">{store?.store_name}</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      {overview && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard
            label={`Total Revenue (${MONTHS_WINDOW} months)`}
            value={fmt(overview.revenue)}
            change={overview.deltas.revenue}
            icon={TrendingUp}
            color="#8B1538"
          />
          <KpiCard
            label="Total Orders"
            value={overview.orders.toLocaleString()}
            change={overview.deltas.orders}
            icon={ShoppingBag}
            color="#3D9B8E"
          />
          <KpiCard
            label="Avg Order Value"
            value={fmt(overview.avg_order_value)}
            change={overview.deltas.avg_order_value}
            icon={BarChart3}
            color="#D4828F"
          />
          <KpiCard
            label="Conversion Rate"
            value={`${overview.conversion_rate.toFixed(1)}%`}
            change={overview.deltas.conversion_rate}
            icon={Percent}
            color="#6366F1"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5">
        <div className="lg:col-span-3 bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 min-w-0">
          <h3 className="text-gray-800 font-bold text-sm sm:text-base">Monthly Revenue</h3>
          <p className="text-gray-400 text-xs mt-0.5 mb-4">Last {MONTHS_WINDOW} months</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyRevenue?.series ?? []} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="monthlyRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B1538" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#8B1538" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={fmt} width={54} />
              <Tooltip formatter={(v: number) => [fmt(v), 'Revenue']} contentStyle={{ borderRadius: 12, border: '1px solid #F3F4F6', fontSize: 12 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="revenue" stroke="#8B1538" strokeWidth={2.5} fill="url(#monthlyRevGrad)" dot={{ r: 4, fill: '#8B1538', strokeWidth: 0 }} name="revenue" />
            </AreaChart>
          </ResponsiveContainer>

          <div className="mt-4 pt-4 border-t border-gray-50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Monthly Orders</p>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={monthlyRevenue?.series ?? []} margin={{ top: 0, right: 5, bottom: 0, left: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={28} />
                <Tooltip formatter={(v: number) => [v, 'Orders']} contentStyle={{ borderRadius: 10, fontSize: 11 }} />
                <Bar dataKey="orders" radius={[4, 4, 0, 0]} fill="#3D9B8E" opacity={0.85} name="orders" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 min-w-0">
          <h3 className="text-gray-800 font-bold text-sm sm:text-base mb-4">Sales by Category</h3>
          {categoryData.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-gray-400 gap-2 py-10">
              <p className="text-xs">No delivered orders in this period yet.</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={80}
                    innerRadius={32}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(_value, _name, item) => [fmt(item.payload.revenue), item.payload.name]} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {categoryData.map((c) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5">
        <div className="lg:col-span-3 bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 min-w-0">
          <h3 className="text-gray-800 font-bold text-sm sm:text-base mb-4">Top Products by Revenue</h3>
          {topProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-gray-400 gap-2 py-10">
              <p className="text-xs">No product sales in this period yet.</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={Math.max(180, topProducts.length * 56)}>
                <BarChart
                  data={topProducts.map(p => ({ name: p.name, revenue: p.revenue, units_sold: p.units_sold, stock_status: p.stock_status }))}
                  layout="vertical"
                  margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: '#9CA3AF' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={fmt}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                    width={110}
                  />
                  <Tooltip
                    formatter={(v: number, _name, item) => [
                      `${fmt(v)} · ${item.payload.units_sold} sold${item.payload.stock_status === 'out_of_stock' ? ' · out of stock' : ''}`,
                      'Revenue',
                    ]}
                    contentStyle={{ borderRadius: 12, border: '1px solid #F3F4F6', fontSize: 12 }}
                  />
                  <Bar dataKey="revenue" radius={[0, 8, 8, 0]} barSize={28}>
                    {topProducts.map((p, i) => (
                      <Cell key={i} fill={p.stock_status === 'out_of_stock' ? '#DC2626' : TOP_PRODUCT_COLORS[i] ?? '#9CA3AF'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {topProducts.some(p => p.stock_status === 'out_of_stock') && (
                <p className="text-xs text-red-600 mt-3 flex items-start gap-1.5">
                  <span>⚠️</span>
                  <span>
                    {topProducts.filter(p => p.stock_status === 'out_of_stock').map(p => p.name).join(', ')} {topProducts.filter(p => p.stock_status === 'out_of_stock').length === 1 ? 'is' : 'are'} a top seller but currently out of stock — consider restocking.
                  </span>
                </p>
              )}
            </>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 min-w-0 flex flex-col">
          <h3 className="text-gray-800 font-bold text-sm sm:text-base mb-4">Traffic Sources</h3>
          <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 gap-2 py-6">
            <p className="text-xs max-w-[220px]">
              Not available yet — no endpoint returns visits broken down by referral source.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BusinessAnalytics;
