import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  ArrowRight,
  Eye,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  ApiError,
  getMyBusiness,
  getStoreOverview,
  getOrderStats,
  fetchStoreProductStats,
  getStoreCustomers,
  getStoreNotifications,
  getStoreReviewModeration,
  type ApiStore,
  type StoreOverview,
  type OrderStats,
  type StoreProductStats,
  type StoreNotification,
  type StoreNotificationType,
} from '../../services/api';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
}

function MetricCard({
  title,
  value,
  change,
  isPositive,
  icon: Icon,
  gradient,
}: MetricCardProps) {
  return (
    <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-gray-50 to-white hover:shadow-xl transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${gradient}`}>
            <Icon className="text-white w-6 h-6" />
          </div>
        </div>
        {change && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'
              }`}
          >
            <TrendingUp
              className={`w-4 h-4 ${isPositive ? '' : 'rotate-180'}`}
            />
            {change} this month
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const NOTIF_PAGE_SIZE = 8;

// ── Formatting helpers ────────────────────────────────────────────────────────
const compact = new Intl.NumberFormat('en-NG', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

function formatNaira(n: number): string {
  return `₦${compact.format(n ?? 0)}`;
}

function formatDelta(d: number | null | undefined): {
  change: string;
  isPositive: boolean;
} {
  // Always render a badge — treat a missing delta as 0% so every card shows a
  // "±X% this month" line, matching the design.
  const rounded = Math.round(d ?? 0);
  return { change: `${rounded >= 0 ? '+' : ''}${rounded}%`, isPositive: rounded >= 0 };
}

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${Math.max(secs, 0)}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} minute${mins > 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

// Map notification event types to their feed icon + accent colour.
const NOTIF_STYLE: Record<
  StoreNotificationType,
  { icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  order_placed: { icon: ShoppingCart, color: 'bg-blue-500' },
  order_delivered: { icon: CheckCircle2, color: 'bg-purple-500' },
  review_received: { icon: Eye, color: 'bg-green-500' },
  low_stock: { icon: AlertCircle, color: 'bg-orange-500' },
};

// The backend's notification payload shape isn't fixed, so pull the trailing
// value (amount / rating / stock / status) from whatever key it lives under —
// top-level or nested in `data` — with a message-text fallback for ratings.
function activityMeta(n: StoreNotification): {
  amount?: number;
  rating?: number;
  units?: number;
  status?: string;
} {
  const d: Record<string, any> = { ...(n as any), ...(n.meta ?? {}), ...(n.data ?? {}) };
  const num = (v: any): number | undefined => {
    if (v === null || v === undefined || v === '') return undefined;
    const parsed = Number(v);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const amount = num(
    d.amount ?? d.total_amount ?? d.total ?? d.order_total ?? d.price
  );

  let rating = num(d.rating ?? d.stars ?? d.review_rating);
  if (rating === undefined && n.type === 'review_received') {
    const m = n.message?.match(/(\d(?:\.\d)?)[-\s]?star/i);
    if (m) rating = Number(m[1]);
  }

  let units = num(
    d.units ?? d.stock_quantity ?? d.quantity ?? d.remaining_stock ?? d.stock
  );
  if (units === undefined && n.type === 'low_stock') {
    // Fallback: pull the count out of "… down to 3 units" style messages.
    const m = n.message?.match(/(\d+)\s*(?:units?|left|remaining|in stock)/i);
    if (m) units = Number(m[1]);
  }

  const status = typeof d.status === 'string' ? d.status : undefined;

  return { amount, rating, units, status };
}

export function BusinessDashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [overview, setOverview] = useState<StoreOverview | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [productStats, setProductStats] = useState<StoreProductStats | null>(null);
  const [customerTotal, setCustomerTotal] = useState<number | null>(null);
  const [reviewTotal, setReviewTotal] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<StoreNotification[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [notifTotal, setNotifTotal] = useState(0);
  const [notifPage, setNotifPage] = useState(1);
  const [notifLoadingMore, setNotifLoadingMore] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const store: ApiStore | null = await getMyBusiness();
        if (!store) {
          setLoadError('No store found for this account.');
          setLoading(false);
          return;
        }
        setStoreId(store.id);

        // Fetch each panel independently so one failing endpoint doesn't blank
        // the whole dashboard.
        const [overviewR, orderStatsR, productStatsR, customersR, reviewsR, notifsR] =
          await Promise.allSettled([
            getStoreOverview(store.id),
            getOrderStats(store.id),
            fetchStoreProductStats(store.id),
            getStoreCustomers(store.id, 1, 1),
            getStoreReviewModeration(store.id, 1, 1),
            getStoreNotifications(store.id, 1, NOTIF_PAGE_SIZE),
          ]);

        if (overviewR.status === 'fulfilled') setOverview(overviewR.value);
        if (orderStatsR.status === 'fulfilled') setOrderStats(orderStatsR.value);
        if (productStatsR.status === 'fulfilled') setProductStats(productStatsR.value);
        if (customersR.status === 'fulfilled') setCustomerTotal(customersR.value.total);
        if (reviewsR.status === 'fulfilled') setReviewTotal(reviewsR.value.total);
        if (notifsR.status === 'fulfilled') {
          setNotifications(notifsR.value.data);
          setNotifTotal(notifsR.value.total);
          setNotifPage(1);
        }
      } catch (e: unknown) {
        setLoadError(e instanceof ApiError ? e.message : 'Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadMoreNotifications = async () => {
    if (!storeId || notifLoadingMore) return;
    const nextPage = notifPage + 1;
    setNotifLoadingMore(true);
    try {
      const res = await getStoreNotifications(storeId, nextPage, NOTIF_PAGE_SIZE);
      setNotifications((prev) => [...prev, ...res.data]);
      setNotifTotal(res.total);
      setNotifPage(nextPage);
    } catch {
      /* keep what we have; the button stays available to retry */
    } finally {
      setNotifLoadingMore(false);
    }
  };

  const hasMoreNotifications = notifications.length < notifTotal;

  // Prefer the single overview call for card values (revenue/orders), falling
  // back to the dedicated stat endpoints where overview doesn't carry the field.
  const totalSales = overview ? overview.revenue : orderStats?.total_revenue ?? 0;
  const totalOrders = overview ? overview.orders : orderStats?.total ?? 0;
  const activeProducts = productStats?.active_products ?? 0;
  const totalCustomers = customerTotal ?? 0;

  const pendingOrders = orderStats?.by_status?.pending ?? 0;
  const totalProducts = productStats?.total_products ?? 0;

  const quickActions = [
    {
      label: 'View Orders',
      path: '/business/orders',
      description:
        pendingOrders > 0 ? `${pendingOrders} pending orders` : 'Manage orders',
      color: 'from-blue-500 to-blue-600',
    },
    {
      label: 'Manage Inventory',
      path: '/business/inventory',
      description: `${totalProducts} products`,
      color: 'from-purple-500 to-purple-600',
    },
    {
      label: 'View Analytics',
      path: '/business/analytics',
      description: 'Sales & Traffic',
      color: 'from-green-500 to-green-600',
    },
    {
      label: 'Check Reviews',
      path: '/business/reviews',
      description: reviewTotal !== null ? `${reviewTotal} reviews` : 'Reviews',
      color: 'from-orange-500 to-orange-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-4 lg:ml-64">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 text-sm mt-1">
              Welcome back! Here's your store performance.
            </p>
          </div>
          <Button className="bg-gradient-to-r from-[#A81E54] to-[#E91E63] hover:from-[#8B1845] hover:to-[#C41A52] text-white border-0">
            Generate Report
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 lg:ml-64">
        {loadError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        )}

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Total Sales"
                value={formatNaira(totalSales)}
                {...formatDelta(overview?.deltas.revenue)}
                icon={TrendingUp}
                gradient="bg-gradient-to-br from-blue-500 to-blue-600"
              />
              <MetricCard
                title="Total Orders"
                value={totalOrders.toLocaleString()}
                {...formatDelta(overview?.deltas.orders)}
                icon={ShoppingCart}
                gradient="bg-gradient-to-br from-purple-500 to-purple-600"
              />
              <MetricCard
                title="Active Products"
                value={activeProducts.toLocaleString()}
                {...formatDelta(overview?.deltas.new_products)}
                icon={Package}
                gradient="bg-gradient-to-br from-green-500 to-green-600"
              />
              <MetricCard
                title="Total Customers"
                value={compact.format(totalCustomers)}
                {...formatDelta(overview?.deltas.new_customers)}
                icon={Users}
                gradient="bg-gradient-to-br from-orange-500 to-orange-600"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <div className="lg:col-span-2">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="border-b border-gray-200">
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                    {notifTotal > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Showing {notifications.length} of {notifTotal}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="p-0">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-sm text-gray-500">
                        No recent activity yet.
                      </div>
                    ) : (
                      <div className="max-h-[480px] overflow-y-auto divide-y divide-gray-200">
                        {notifications.map((activity) => {
                          const style =
                            NOTIF_STYLE[activity.type] ?? {
                              icon: AlertCircle,
                              color: 'bg-gray-400',
                            };
                          const ActivityIcon = style.icon;
                          const meta = activityMeta(activity);
                          return (
                            <div
                              key={activity.id}
                              className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4 cursor-pointer"
                            >
                              <div className={`p-2.5 rounded-lg ${style.color}`}>
                                <ActivityIcon className="text-white w-4.5 h-4.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">
                                  {activity.message}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {timeAgo(activity.created_at)}
                                </p>
                              </div>
                              {activity.type === 'review_received' &&
                                meta.rating != null && (
                                  <span className="text-sm font-semibold text-yellow-600 ml-2 whitespace-nowrap">
                                    {meta.rating} ★
                                  </span>
                                )}
                              {activity.type === 'low_stock' && meta.units != null && (
                                <span className="text-sm font-semibold text-orange-600 ml-2 whitespace-nowrap">
                                  {meta.units} {meta.units === 1 ? 'unit' : 'units'}
                                </span>
                              )}
                              {activity.type === 'order_delivered' &&
                                (meta.status != null ? (
                                  <span className="text-xs font-semibold text-purple-600 ml-2 px-2 py-1 bg-purple-100 rounded whitespace-nowrap">
                                    {meta.status}
                                  </span>
                                ) : (
                                  <span className="text-xs font-semibold text-purple-600 ml-2 px-2 py-1 bg-purple-100 rounded whitespace-nowrap">
                                    Delivered
                                  </span>
                                ))}
                              {activity.type === 'order_placed' &&
                                meta.amount != null && (
                                  <span className="text-sm font-semibold text-gray-900 ml-2 whitespace-nowrap">
                                    {formatNaira(meta.amount)}
                                  </span>
                                )}
                            </div>
                          );
                        })}
                        {hasMoreNotifications && (
                          <div className="p-3 text-center">
                            <button
                              onClick={loadMoreNotifications}
                              disabled={notifLoadingMore}
                              className="text-sm font-medium text-[#A81E54] hover:text-[#8B1845] disabled:opacity-50"
                            >
                              {notifLoadingMore ? 'Loading…' : 'Load more'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Quick Actions
                </h2>
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.path)}
                    className={`w-full p-4 rounded-lg bg-gradient-to-br ${action.color} text-white hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-left group`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm">{action.label}</p>
                        <p className="text-xs opacity-90 mt-1">{action.description}</p>
                      </div>
                      <ArrowRight
                        className="mt-1 w-4 h-4 group-hover:translate-x-1 transition-transform"
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-gray-200" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 rounded-xl bg-gray-200" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-gray-200" />
          ))}
        </div>
      </div>
    </div>
  );
}
