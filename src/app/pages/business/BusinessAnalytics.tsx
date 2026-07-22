import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  ApiError,
  getMyBusiness,
  getStoreOverview,
  getMonthlyRevenue,
  getSalesByCategory,
  getTopProducts,
  type ApiStore,
  type StoreOverview,
  type MonthlyRevenuePoint,
  type SalesByCategoryEntry,
  type TopProductEntry,
} from '../../services/api';

// Palette reused for the category donut + legend (backend returns no colours).
const CATEGORY_COLORS = [
  '#0D9488',
  '#E91E63',
  '#A81E54',
  '#F59E0B',
  '#3B82F6',
  '#8B5CF6',
  '#10B981',
  '#EF4444',
];

// ── Traffic Sources: no backend endpoint yet (no per-channel breakdown). ──────
// TODO: wire once an analytics traffic-source endpoint exists.
const trafficSources = [
  { source: 'Ndeko Search', visits: 6420, percentage: 50 },
  { source: 'Direct Link', visits: 2568, percentage: 20 },
  { source: 'Social Media', visits: 1928, percentage: 15 },
  { source: 'Flash Deals', visits: 1284, percentage: 10 },
  { source: 'Other', visits: 642, percentage: 5 },
];

// ── Formatting helpers ────────────────────────────────────────────────────────
const compact = new Intl.NumberFormat('en-NG', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

function formatDelta(d: number | null | undefined): {
  change: string;
  isPositive: boolean;
} {
  const rounded = Math.round((d ?? 0) * 10) / 10;
  return { change: `${rounded >= 0 ? '+' : ''}${rounded}%`, isPositive: rounded >= 0 };
}

function MetricBox({
  label,
  value,
  change,
  isPositive,
}: {
  label: string;
  value: string | number;
  change: string;
  isPositive: boolean;
}) {
  return (
    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-gray-600 text-sm font-medium">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
          {isPositive ? (
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp size={18} className="text-green-600" />
            </div>
          ) : (
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown size={18} className="text-red-600" />
            </div>
          )}
        </div>
        <p
          className={`text-sm font-semibold ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {change}
        </p>
      </CardContent>
    </Card>
  );
}

export function BusinessAnalytics() {
  const [timeRange, setTimeRange] = useState('7d');

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [overview, setOverview] = useState<StoreOverview | null>(null);
  const [monthlySeries, setMonthlySeries] = useState<MonthlyRevenuePoint[]>([]);
  const [categories, setCategories] = useState<SalesByCategoryEntry[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductEntry[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const store: ApiStore | null = await getMyBusiness();
        if (!store) {
          setLoadError('No store found for this account.');
          setLoading(false);
          return;
        }

        // Each panel loads independently so one failing endpoint doesn't blank
        // the whole page.
        const [overviewR, monthlyR, categoryR, topR] = await Promise.allSettled([
          getStoreOverview(store.id, 7),
          getMonthlyRevenue(store.id, 7),
          getSalesByCategory(store.id),
          getTopProducts(store.id, 5),
        ]);

        if (overviewR.status === 'fulfilled') setOverview(overviewR.value);
        if (monthlyR.status === 'fulfilled') setMonthlySeries(monthlyR.value.series);
        if (categoryR.status === 'fulfilled') setCategories(categoryR.value.categories);
        if (topR.status === 'fulfilled') setTopProducts(topR.value.products);
      } catch (e: unknown) {
        setLoadError(e instanceof ApiError ? e.message : 'Failed to load analytics.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Chart-ready shapes.
  const revenueData = monthlySeries.map((p) => ({
    month: p.label,
    revenue: p.revenue,
  }));
  const monthlyOrders = monthlySeries.map((p) => ({
    month: p.label,
    orders: p.orders,
  }));
  const categoryData = categories.map((c, i) => ({
    name: c.name,
    value: Math.round(c.percentage),
    fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  const totalRevenue = overview?.revenue ?? 0;
  const totalOrders = overview?.orders ?? 0;
  const avgOrderValue = overview?.avg_order_value ?? 0;
  const conversionRate = overview?.conversion_rate ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-4 lg:ml-64">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 text-sm mt-1">Last 7 months</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 lg:ml-64 space-y-6">
        {loadError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        )}

        {loading ? (
          <AnalyticsSkeleton />
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricBox
                label="Total Revenue (7 months)"
                value={`₦${compact.format(totalRevenue)}`}
                {...formatDelta(overview?.deltas.revenue)}
              />
              <MetricBox
                label="Total Orders"
                value={totalOrders.toLocaleString()}
                {...formatDelta(overview?.deltas.orders)}
              />
              <MetricBox
                label="Avg Order Value"
                value={`₦${Math.round(avgOrderValue).toLocaleString()}`}
                {...formatDelta(overview?.deltas.avg_order_value)}
              />
              <MetricBox
                label="Conversion Rate"
                value={`${conversionRate.toFixed(1)}%`}
                {...formatDelta(overview?.deltas.conversion_rate)}
              />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Monthly Revenue Chart */}
              <div className="lg:col-span-2">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="border-b border-gray-200">
                    <CardTitle className="text-lg">Monthly Revenue</CardTitle>
                    <p className="text-xs text-gray-500 mt-1">Last 7 months</p>
                  </CardHeader>
                  <CardContent className="p-6">
                    {revenueData.length === 0 ? (
                      <EmptyChart />
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={revenueData}>
                          <defs>
                            <linearGradient
                              id="colorRevenue"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop offset="5%" stopColor="#E91E63" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#E91E63" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#E5E7EB"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="month"
                            stroke="#9CA3AF"
                            style={{ fontSize: 12 }}
                          />
                          <YAxis stroke="#9CA3AF" style={{ fontSize: 12 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1F2937',
                              border: 'none',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            }}
                            labelStyle={{ color: '#FFF' }}
                            formatter={(value: any) =>
                              `₦${(value / 1000000).toFixed(1)}M`
                            }
                          />
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="#A81E54"
                            strokeWidth={3}
                            dot={{ fill: '#A81E54', r: 5 }}
                            activeDot={{ r: 7 }}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sales by Category */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="text-lg">Sales by Category</CardTitle>
                </CardHeader>
                <CardContent className="p-6 flex justify-center items-center">
                  {categoryData.length === 0 ? (
                    <EmptyChart />
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: 'none',
                            borderRadius: '8px',
                          }}
                          labelStyle={{ color: '#FFF' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Monthly Orders & Category Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Monthly Orders */}
              <Card className="lg:col-span-2 border-0 shadow-lg">
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="text-lg">Monthly Orders</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {monthlyOrders.length === 0 ? (
                    <EmptyChart />
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={monthlyOrders}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#E5E7EB"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="month"
                          stroke="#9CA3AF"
                          style={{ fontSize: 12 }}
                        />
                        <YAxis stroke="#9CA3AF" style={{ fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: 'none',
                            borderRadius: '8px',
                          }}
                          labelStyle={{ color: '#FFF' }}
                        />
                        <Bar dataKey="orders" fill="#0D9488" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Category Legend */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="text-lg">Category Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {categoryData.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No category sales yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {categoryData.map((category) => (
                        <div
                          key={category.name}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.fill }}
                            />
                            <span className="text-sm text-gray-700">
                              {category.name}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {category.value}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Top Products */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-lg">Top Products by Revenue</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {topProducts.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No product sales yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {topProducts.map((product) => {
                      const maxRevenue = topProducts[0].revenue || 1;
                      const percentage = (product.revenue / maxRevenue) * 100;

                      return (
                        <div key={product.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">
                              {product.name}
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              ₦{(product.revenue / 1000000).toFixed(2)}M
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#A81E54] to-[#E91E63] rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Traffic Sources — static placeholder (no API yet) */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-lg">Traffic Sources</CardTitle>
                <p className="text-xs text-gray-500 mt-1">This week's orders</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {trafficSources.map((source) => (
                    <div key={source.source} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                          {source.source}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {source.visits.toLocaleString()} visits • {source.percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#A81E54] to-[#E91E63]"
                          style={{ width: `${source.percentage * 5}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[250px] items-center justify-center text-sm text-gray-500">
      No data for this period yet.
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-gray-200" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-96 rounded-xl bg-gray-200" />
        <div className="h-96 rounded-xl bg-gray-200" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-72 rounded-xl bg-gray-200" />
        <div className="h-72 rounded-xl bg-gray-200" />
      </div>
    </div>
  );
}
