import { useEffect, useState } from 'react';
import {
  TrendingUp, Package, ShoppingBag, DollarSign, AlertCircle,
  RefreshCw, ArrowUpRight, ArrowDownRight, Eye, Heart, Loader2,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardMetrics {
  total_sales: number;
  total_orders: number;
  total_products: number;
  total_customers: number;
  pending_orders: number;
  views_today: number;
  likes_today: number;
  sales_growth: number;
  orders_growth: number;
  recent_orders: Order[];
  top_products: Product[];
}

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  items_count: number;
}

interface Product {
  id: string;
  name: string;
  stock_quantity: number;
  price: number;
  sales_count: number;
  views: number;
}

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
  error?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  change,
  icon,
  trend = 'neutral',
  loading = false,
  error,
}) => {
  return (
    <Card className="p-4 sm:p-6 dark:bg-gray-800 dark:border-gray-700">
      {error ? (
        <div className="flex items-start gap-3 text-red-600 dark:text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">{error}</div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-medium">
              {label}
            </span>
            <div className="text-[#8B1538] dark:text-[#D4828F]">{icon}</div>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 py-3">
              <Loader2 className="h-5 w-5 animate-spin text-[#8B1538]" />
              <span className="text-xs text-gray-500">Loading...</span>
            </div>
          ) : (
            <>
              <h3 className="text-2xl sm:text-3xl font-bold dark:text-white mb-2">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </h3>

              {change !== undefined && (
                <div
                  className={`flex items-center gap-1 text-xs sm:text-sm font-medium ${
                    trend === 'up'
                      ? 'text-green-600 dark:text-green-400'
                      : trend === 'down'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {trend === 'up' && <ArrowUpRight className="h-3 w-3" />}
                  {trend === 'down' && <ArrowDownRight className="h-3 w-3" />}
                  <span>{Math.abs(change).toFixed(1)}% vs last month</span>
                </div>
              )}
            </>
          )}
        </>
      )}
    </Card>
  );
};

export function BusinessDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/v1/analytics/dashboard', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('ndeko_token')}` },
      });

      if (!res.ok) throw new Error('Failed to fetch dashboard');
      const data = await res.json();
      setMetrics(data);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load dashboard';
      setError(msg);
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-[#8B1538] mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

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
          disabled={refreshing}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800 dark:text-red-300">
              Error loading dashboard
            </h3>
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Metrics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <StatCard
          label="Total Sales"
          value={`₦${metrics?.total_sales.toLocaleString() || '0'}`}
          change={metrics?.sales_growth}
          trend={metrics?.sales_growth ? (metrics.sales_growth > 0 ? 'up' : 'down') : 'neutral'}
          icon={<DollarSign className="h-5 w-5" />}
        />

        <StatCard
          label="Orders"
          value={metrics?.total_orders || '0'}
          change={metrics?.orders_growth}
          trend={metrics?.orders_growth ? (metrics.orders_growth > 0 ? 'up' : 'down') : 'neutral'}
          icon={<ShoppingBag className="h-5 w-5" />}
        />

        <StatCard
          label="Products"
          value={metrics?.total_products || '0'}
          icon={<Package className="h-5 w-5" />}
        />

        <StatCard
          label="Customers"
          value={metrics?.total_customers || '0'}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
        <StatCard
          label="Views Today"
          value={metrics?.views_today || '0'}
          icon={<Eye className="h-5 w-5" />}
        />
        <StatCard
          label="Likes Today"
          value={metrics?.likes_today || '0'}
          icon={<Heart className="h-5 w-5" />}
        />
      </div>

      {/* Recent orders */}
      {metrics?.recent_orders && metrics.recent_orders.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold dark:text-white mb-4">Recent Orders</h2>
          <div className="grid gap-3">
            {metrics.recent_orders.slice(0, 5).map((order) => (
              <Card
                key={order.id}
                className="p-4 dark:bg-gray-800 dark:border-gray-700 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold dark:text-white text-sm sm:text-base">
                    {order.order_number}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    {order.items_count} items • {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#8B1538] dark:text-[#D4828F] text-sm sm:text-base">
                    ₦{order.total_amount.toLocaleString()}
                  </p>
                  <p
                    className={`text-xs sm:text-sm font-medium ${
                      order.status === 'COMPLETED'
                        ? 'text-green-600 dark:text-green-400'
                        : order.status === 'PENDING'
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {order.status.replace('_', ' ')}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Top products */}
      {metrics?.top_products && metrics.top_products.length > 0 && (
        <div>
          <h2 className="text-lg sm:text-xl font-bold dark:text-white mb-4">Top Products</h2>
          <div className="grid gap-3">
            {metrics.top_products.slice(0, 5).map((product) => (
              <Card
                key={product.id}
                className="p-4 dark:bg-gray-800 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold dark:text-white text-sm sm:text-base line-clamp-2">
                    {product.name}
                  </h3>
                  <span className="text-xs sm:text-sm font-bold text-[#8B1538] dark:text-[#D4828F]">
                    ₦{product.price.toLocaleString()}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Sales</span>
                    <p className="font-bold dark:text-white">{product.sales_count}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Views</span>
                    <p className="font-bold dark:text-white">{product.views}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Stock</span>
                    <p
                      className={`font-bold ${
                        product.stock_quantity > 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {product.stock_quantity}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}