import { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, ShoppingBag, Package, Eye, AlertTriangle,
  AlertCircle, RefreshCw, Layers, Loader2, Building2, ChevronRight, ArrowUpRight,
} from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { useAuth } from '../../contexts/AuthContext';
import {
  ApiError,
  getMyBusiness,
  getStoreLocations,
  getStoreDashboard,
  getRevenueSeries,
  getVisitorStats,
  getStoreOrders,
  fetchStoreProductStats,
  type ApiStore,
  type ApiStoreLocation,
  type StoreProductStats,
  type StoreOrderSummary,
} from '../../services/api';
import { LocationDropdown, ALL_STORES_ID } from '../../components/business/LocationDropdown';

interface LocationComparisonRow {
  location: ApiStoreLocation;
  revenue: number;
  orders: number;
  lowStock: number;
  outOfStock: number;
}

interface DashboardMetrics {
  revenue: number;
  revenueChange: number | null;
  orders: number;
  ordersChange: number | null;
  activeProducts: number;
  visitors: number;
  visitorsChange: number | null;
}

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number | null;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, change, icon, iconBg, iconColor, loading }) => {
  return (
    <Card className="p-4 sm:p-6 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon}
        </div>
        {change !== undefined && change !== null && (
          <div
            className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
              change >= 0
                ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
            }`}
          >
            <TrendingUp className={`h-3 w-3 ${change < 0 ? 'rotate-180' : ''}`} />
            {change >= 0 ? '+' : ''}
            {change.toFixed(0)}%
          </div>
        )}
      </div>

      <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{label}</p>

      {loading ? (
        <div className="flex items-center gap-2 py-1">
          <Loader2 className="h-5 w-5 animate-spin text-[#8B1538]" />
        </div>
      ) : (
        <h3 className="text-2xl sm:text-3xl font-bold dark:text-white">{value}</h3>
      )}
    </Card>
  );
};

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function pctChange(current: number, previous: number): number | null {
  if (!previous) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

function formatCompactNaira(n: number): string {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n.toLocaleString()}`;
}

function buyerName(order: StoreOrderSummary): string {
  const name = [order.buyer?.first_name, order.buyer?.last_name].filter(Boolean).join(' ');
  return name || '—';
}

interface InventoryBarProps {
  label: string;
  value: number;
  total: number;
  color: string;
}

const InventoryBar: React.FC<InventoryBarProps> = ({ label, value, total, color }) => {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>
        <span className="text-sm font-bold" style={{ color }}>{value}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
};

export function BusinessDashboard() {
  const { user } = useAuth();
  const [store, setStore] = useState<ApiStore | null>(null);
  const [locations, setLocations] = useState<ApiStoreLocation[]>([]);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [productStats, setProductStats] = useState<StoreProductStats | null>(null);
  const [weeklyRevenue, setWeeklyRevenue] = useState<{ label: string; revenue: number }[]>([]);
  const [weeklyTotal, setWeeklyTotal] = useState(0);
  const [locationComparison, setLocationComparison] = useState<LocationComparisonRow[]>([]);
  const [recentOrders, setRecentOrders] = useState<StoreOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAllLocations = locationId === ALL_STORES_ID;

  // Bootstrap: load the seller's store + its locations
  useEffect(() => {
    (async () => {
      try {
        const myStore = await getMyBusiness();
        if (!myStore) {
          setLoading(false);
          setError('No store found. Create a store to see your dashboard.');
          return;
        }
        setStore(myStore);
        const storeLocations = await getStoreLocations(myStore.id);
        setLocations(storeLocations);
        if (storeLocations.length > 1) {
          setLocationId(ALL_STORES_ID);
        } else if (storeLocations.length === 1) {
          setLocationId(storeLocations[0].id);
        } else {
          setLocationId(ALL_STORES_ID);
        }
      } catch (err: unknown) {
        setError(err instanceof ApiError ? err.message : 'Failed to load store data.');
        setLoading(false);
      }
    })();
  }, []);

  const loadDashboard = useCallback(async () => {
    if (!store || !locationId) return;
    setError(null);
    try {
      const scopedLocationId = isAllLocations ? undefined : locationId;

      const today = new Date();
      const currentFrom = new Date(today.getFullYear(), today.getMonth(), 1);
      const prevPeriodStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const prevPeriodEnd = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

      const currentFromISO = toISODate(currentFrom);
      const todayISO = toISODate(today);
      const seriesFromISO = toISODate(prevPeriodStart);
      const prevPeriodEndISO = toISODate(prevPeriodEnd);

      const [dashboard, revenueSeries, visitorStats, stats, orders] = await Promise.all([
        // Snapshot fields with no history/series equivalent (active_products).
        getStoreDashboard(store.id, scopedLocationId, currentFromISO, todayISO),
        // One call spanning both months instead of hitting the dashboard endpoint twice.
        getRevenueSeries(store.id, scopedLocationId, seriesFromISO, todayISO),
        getVisitorStats(store.id, scopedLocationId, seriesFromISO, todayISO),
        fetchStoreProductStats(store.id, scopedLocationId),
        // No location_id param on this endpoint — recent orders are always store-wide.
        getStoreOrders(store.id, 1, 5),
      ]);

      const sumInRange = <T,>(points: T[], fromISO: string, toISO: string, dateOf: (p: T) => string, pick: (p: T) => number) =>
        points.filter(p => dateOf(p) >= fromISO && dateOf(p) <= toISO).reduce((sum, p) => sum + pick(p), 0);

      const currentRevenue = sumInRange(revenueSeries.series, currentFromISO, todayISO, p => p.date, p => p.revenue);
      const previousRevenue = sumInRange(revenueSeries.series, seriesFromISO, prevPeriodEndISO, p => p.date, p => p.revenue);
      const currentOrders = sumInRange(revenueSeries.series, currentFromISO, todayISO, p => p.date, p => p.orders);
      const previousOrders = sumInRange(revenueSeries.series, seriesFromISO, prevPeriodEndISO, p => p.date, p => p.orders);
      const currentVisitors = sumInRange(visitorStats.series, currentFromISO, todayISO, p => p.date, p => p.count);
      const previousVisitors = sumInRange(visitorStats.series, seriesFromISO, prevPeriodEndISO, p => p.date, p => p.count);

      // Last 7 days, sliced from the same revenueSeries call (no extra request).
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (6 - i));
        const iso = toISODate(d);
        const point = revenueSeries.series.find(p => p.date === iso);
        return { label: d.toLocaleDateString('en-US', { weekday: 'short' }), revenue: point?.revenue ?? 0 };
      });
      setWeeklyRevenue(last7Days);
      setWeeklyTotal(last7Days.reduce((sum, p) => sum + p.revenue, 0));

      setMetrics({
        revenue: currentRevenue,
        revenueChange: pctChange(currentRevenue, previousRevenue),
        orders: currentOrders,
        ordersChange: pctChange(currentOrders, previousOrders),
        activeProducts: dashboard.active_products ?? 0,
        visitors: currentVisitors,
        visitorsChange: pctChange(currentVisitors, previousVisitors),
      });

      setProductStats(stats);
      setRecentOrders(orders.data ?? []);

      // Store Comparison — only meaningful with multiple locations combined.
      if (isAllLocations && locations.length > 1) {
        const comparisons = await Promise.all(
          locations.map(async (loc): Promise<LocationComparisonRow> => {
            const [locDashboard, locStats] = await Promise.all([
              getStoreDashboard(store.id, loc.id, currentFromISO, todayISO),
              fetchStoreProductStats(store.id, loc.id),
            ]);
            const orders = Object.values(locDashboard.orders ?? {}).reduce((a, b) => a + b, 0);
            return {
              location: loc,
              revenue: locDashboard.revenue ?? 0,
              orders,
              lowStock: locStats.low_stock ?? 0,
              outOfStock: locStats.out_of_stock ?? 0,
            };
          })
        );
        setLocationComparison(comparisons.sort((a, b) => b.revenue - a.revenue));
      } else {
        setLocationComparison([]);
      }
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [store, locationId, isAllLocations, locations]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
  };

  const lowStock = productStats?.low_stock ?? 0;
  const outOfStock = productStats?.out_of_stock ?? 0;
  const inventoryTotal = productStats?.total_products ?? 0;
  const inStock = Math.max(0, inventoryTotal - lowStock - outOfStock);

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold dark:text-white mb-1">
            Welcome back, {user?.first_name || 'Seller'}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Here's what's happening with your store today.
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800 dark:text-red-300">Error loading dashboard</h3>
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-red-700 dark:text-red-300"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Store selector */}
      {store && locations.length > 0 && locationId && (
        <div className="mb-6 flex flex-wrap items-center gap-3 justify-between">
          <LocationDropdown
            storeName={store.store_name}
            locations={locations}
            value={locationId}
            onChange={id => setLocationId(id)}
            includeAll={locations.length > 1}
            variant="page"
            label="Select Store"
          />
          {isAllLocations && locations.length > 1 && (
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
              <Layers className="h-4 w-4 text-[#8B1538] dark:text-[#D4828F]" />
              Showing combined data across <span className="font-bold text-gray-900 dark:text-white">{locations.length}</span> locations
            </div>
          )}
        </div>
      )}

      {/* Low stock banner */}
      {!loading && (lowStock > 0 || outOfStock > 0) && (
        <Link
          to="/business/inventory"
          className="mb-6 flex items-center justify-between gap-3 rounded-2xl px-5 py-4 border border-amber-300 dark:border-amber-800"
          style={{ background: 'linear-gradient(135deg, #FDE68A, #FBBF24)' }}
        >
          <div className="flex items-center gap-3 text-amber-900">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span className="font-semibold text-sm sm:text-base">
              {lowStock} product{lowStock !== 1 ? 's' : ''} running low, {outOfStock} out of stock
            </span>
          </div>
          <span className="flex items-center gap-1 font-bold text-sm text-amber-900 whitespace-nowrap">
            View Inventory →
          </span>
        </Link>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          label="Revenue (MTD)"
          value={`₦${(metrics?.revenue ?? 0).toLocaleString()}`}
          change={metrics?.revenueChange}
          loading={loading}
          icon={<TrendingUp className="h-5 w-5" />}
          iconBg="#8B153818"
          iconColor="#8B1538"
        />
        <StatCard
          label="Orders This Month"
          value={metrics?.orders ?? 0}
          change={metrics?.ordersChange}
          loading={loading}
          icon={<ShoppingBag className="h-5 w-5" />}
          iconBg="#3D9B8E18"
          iconColor="#3D9B8E"
        />
        <StatCard
          label="Active Products"
          value={metrics?.activeProducts ?? 0}
          loading={loading}
          icon={<Package className="h-5 w-5" />}
          iconBg="#8B153818"
          iconColor="#8B1538"
        />
        <StatCard
          label="Visitors"
          value={(metrics?.visitors ?? 0).toLocaleString()}
          change={metrics?.visitorsChange}
          loading={loading}
          icon={<Eye className="h-5 w-5" />}
          iconBg="#6366F118"
          iconColor="#6366F1"
        />
      </div>

      {/* Weekly revenue trend + inventory snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 mt-4 sm:mt-6">
        <Card className="lg:col-span-3 p-4 sm:p-6 dark:bg-gray-800 dark:border-gray-700 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <h3 className="text-base sm:text-lg font-bold dark:text-white">Weekly Revenue</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Last 7 days · {isAllLocations ? 'all locations combined' : (locations.find(l => l.id === locationId)?.branch_name ?? 'this location')}
              </p>
            </div>
            <span
              className="shrink-0 px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold text-white whitespace-nowrap"
              style={{ background: 'linear-gradient(135deg, #8B1538, #D4828F)' }}
            >
              {formatCompactNaira(weeklyTotal)} Total
            </span>
          </div>

          {loading ? (
            <div className="h-[220px] flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#8B1538]" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={weeklyRevenue} margin={{ top: 20, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="weeklyRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B1538" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#8B1538" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                  width={54}
                  tickFormatter={(v: number) => (v >= 1000 ? `₦${(v / 1000).toFixed(0)}k` : `₦${v}`)}
                />
                <Tooltip
                  formatter={(v: number) => [`₦${v.toLocaleString()}`, 'Revenue']}
                  contentStyle={{ borderRadius: 12, border: '1px solid #F3F4F6', fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8B1538"
                  strokeWidth={2.5}
                  fill="url(#weeklyRevGrad)"
                  dot={{ r: 4, fill: '#8B1538', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="lg:col-span-2 p-4 sm:p-6 dark:bg-gray-800 dark:border-gray-700 flex flex-col min-w-0">
          <h3 className="text-base sm:text-lg font-bold dark:text-white mb-4">Inventory Snapshot</h3>
          <div className="space-y-4 flex-1">
            <InventoryBar label="In Stock" value={inStock} total={inventoryTotal} color="#059669" />
            <InventoryBar label="Low Stock" value={lowStock} total={inventoryTotal} color="#D97706" />
            <InventoryBar label="Out of Stock" value={outOfStock} total={inventoryTotal} color="#DC2626" />
          </div>
          <Link
            to="/business/inventory"
            className="mt-5 block text-center font-bold text-white rounded-xl py-3"
            style={{ background: 'linear-gradient(135deg, #8B1538, #D4828F)' }}
          >
            Manage Inventory
          </Link>
        </Card>
      </div>

      {/* Store comparison — only meaningful when viewing all locations combined */}
      {isAllLocations && locations.length > 1 && (
        <Card className="p-4 sm:p-6 dark:bg-gray-800 dark:border-gray-700 mt-4 sm:mt-6 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold dark:text-white">Store Comparison</h3>
              <p className="text-xs text-gray-400 mt-0.5">Revenue &amp; orders per location · this month</p>
            </div>
            <span className="hidden sm:inline text-xs text-gray-400 whitespace-nowrap">Click a row to drill in →</span>
          </div>

          {locationComparison.length === 0 ? (
            <div className="h-[160px] flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#8B1538]" />
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={locationComparison.length * 90}>
                <BarChart
                  data={locationComparison.map(c => ({
                    name: c.location.city || c.location.branch_name,
                    revenue: c.revenue,
                  }))}
                  layout="vertical"
                  margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
                  barCategoryGap="35%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: '#9CA3AF' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => (v >= 1000 ? `₦${(v / 1000).toFixed(0)}k` : `₦${v}`)}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                    width={90}
                  />
                  <Tooltip
                    formatter={(v: number) => [`₦${v.toLocaleString()}`, 'Revenue']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #F3F4F6', fontSize: 12 }}
                  />
                  <Bar dataKey="revenue" fill="#8B1538" radius={[8, 8, 8, 8]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                {locationComparison.map(c => (
                  <button
                    key={c.location.id}
                    type="button"
                    onClick={() => setLocationId(c.location.id)}
                    className="text-left rounded-xl border border-gray-100 dark:border-gray-700 p-4 hover:border-[#8B1538] dark:hover:border-[#D4828F] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-lg bg-[#3D9B8E] text-white flex items-center justify-center shrink-0">
                          <Building2 className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-sm dark:text-white truncate">
                            {store?.store_name} — {c.location.branch_name}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {[c.location.city, c.location.state].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Revenue</p>
                        <p className="text-sm font-bold text-[#8B1538] dark:text-[#D4828F]">{formatCompactNaira(c.revenue)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Orders</p>
                        <p className="text-sm font-bold dark:text-white">{c.orders}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Low / Out</p>
                        <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{c.lowStock} / {c.outOfStock}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      {/* Recent orders — store-wide (this endpoint has no location_id scope) */}
      <Card className="p-4 sm:p-6 dark:bg-gray-800 dark:border-gray-700 mt-4 sm:mt-6 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-bold dark:text-white">Recent Orders</h3>
          <Link
            to="/business/orders"
            className="flex items-center gap-1 text-sm font-bold text-[#8B1538] dark:text-[#D4828F] hover:underline"
          >
            View All <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="h-[160px] flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#8B1538]" />
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">No orders yet</div>
        ) : (
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="text-left border-b border-gray-100 dark:border-gray-700">
                  <th className="text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3 pr-4">Order ID</th>
                  <th className="text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3 pr-4">Customer</th>
                  <th className="text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3 pr-4">Items</th>
                  <th className="text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3 pr-4">Total</th>
                  <th className="text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3 pr-4">Status</th>
                  <th className="text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {recentOrders.map(order => (
                  <tr key={order.id}>
                    <td className="py-3 pr-4 text-sm font-bold text-[#8B1538] dark:text-[#D4828F] whitespace-nowrap">
                      {order.order_reference}
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {buyerName(order)}
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {order.items_count} item{order.items_count !== 1 ? 's' : ''}
                    </td>
                    <td className="py-3 pr-4 text-sm font-bold dark:text-white whitespace-nowrap">
                      ₦{order.total_amount.toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 text-sm font-bold dark:text-white capitalize whitespace-nowrap">
                      {order.status}
                    </td>
                    <td className="py-3 text-sm text-gray-400 whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString('en-CA')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default BusinessDashboard;
