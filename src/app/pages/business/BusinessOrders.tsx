import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, Eye, ChevronDown, Package, Clock, CheckCircle,
  XCircle, Truck, Loader2, AlertCircle, RefreshCw, X,
} from 'lucide-react';
import {
  getMyStores,
  getStoreOrders,
  updateOrderStatus,
  type ApiOrder,
  type ApiStore,
} from '../../services/api';

const STATUS_CFG: Record<string, { bg: string; text: string; darkBg: string; darkText: string; icon: React.ElementType; label: string }> = {
  pending:    { bg: '#FEF3C7', text: '#D97706', darkBg: 'rgba(217,119,6,0.15)',   darkText: '#FCD34D', icon: Clock,        label: 'Pending'    },
  processing: { bg: '#DBEAFE', text: '#2563EB', darkBg: 'rgba(37,99,235,0.15)',   darkText: '#93C5FD', icon: Package,      label: 'Processing' },
  shipped:    { bg: '#E0F2FE', text: '#0284C7', darkBg: 'rgba(2,132,199,0.15)',   darkText: '#7DD3FC', icon: Truck,        label: 'Shipped'    },
  delivered:  { bg: '#D1FAE5', text: '#059669', darkBg: 'rgba(5,150,105,0.15)',   darkText: '#6EE7B7', icon: CheckCircle,  label: 'Delivered'  },
  cancelled:  { bg: '#FEE2E2', text: '#DC2626', darkBg: 'rgba(220,38,38,0.15)',   darkText: '#FCA5A5', icon: XCircle,      label: 'Cancelled'  },
};

const ALL_STATUSES = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

type NextStatus = 'processing' | 'shipped' | 'delivered' | 'cancelled';
const NEXT_STATUS: Record<string, { status: NextStatus; label: string; color: string } | null> = {
  pending:    { status: 'processing', label: 'Mark Processing', color: '#2563EB' },
  processing: { status: 'shipped',    label: 'Mark Shipped',    color: '#0284C7' },
  shipped:    { status: 'delivered',  label: 'Mark Delivered',  color: '#059669' },
  delivered:  null,
  cancelled:  null,
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending;
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold w-fit"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      <cfg.icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-gray-50 dark:divide-gray-700">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 sm:px-6 py-4 animate-pulse">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="flex-1 space-y-1.5 hidden sm:block">
            <div className="h-3.5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
          <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded hidden md:block" />
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded hidden lg:block" />
          <div className="h-7 w-7 bg-gray-200 dark:bg-gray-700 rounded-lg ml-auto" />
        </div>
      ))}
    </div>
  );
}

function OrderDetailModal({
  order,
  onClose,
  onStatusUpdate,
}: {
  order: ApiOrder;
  onClose: () => void;
  onStatusUpdate: (id: string, status: NextStatus) => Promise<void>;
}) {
  const next = NEXT_STATUS[order.status];
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = async () => {
    if (!next) return;
    setUpdating(true); setError(null);
    try {
      await onStatusUpdate(order.id, next.status);
      onClose();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 w-full sm:rounded-2xl sm:max-w-md shadow-2xl overflow-hidden rounded-t-2xl max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div
          className="px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #1A0812, #8B1538)' }}
        >
          <div>
            <p className="text-white/60 text-xs mb-0.5">Order Details</p>
            <h3 className="text-white font-bold font-mono text-sm sm:text-base">
              {order.order_number}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} />
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2.5">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Payment Method</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 capitalize">
                {order.payment_method.replace(/_/g, ' ')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Payment Status</p>
              <p className={`text-sm font-semibold capitalize ${
                order.payment_status === 'paid'
                  ? 'text-green-600 dark:text-green-400'
                  : order.payment_status === 'failed'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}>
                {order.payment_status}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Order Date</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {fmtDate(order.created_at)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Order Total</p>
              <p className="text-lg font-bold text-[#8B1538]">
                ₦{Number(order.total_amount).toLocaleString()}
              </p>
            </div>
          </div>

          {order.items && order.items.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">Items</p>
              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>{item.product_name} × {item.quantity}</span>
                    <span>₦{(item.unit_price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {order.payment_url && (
            <a
              href={order.payment_url}
              target="_blank"
              rel="noreferrer"
              className="block text-xs text-[#8B1538] underline truncate"
            >
              Payment link →
            </a>
          )}
        </div>

        <div className="px-4 sm:px-6 pb-5 sm:pb-6 flex flex-col xs:flex-row gap-3">
          {next && (
            <button
              onClick={handleNext}
              disabled={updating}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-60 transition-opacity"
              style={{ background: next.color }}
            >
              {updating ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</> : next.label}
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order, onClick }: { order: ApiOrder; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-4 cursor-pointer hover:border-[#8B1538]/30 hover:shadow-sm transition-all"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="font-mono text-xs font-bold text-[#8B1538] truncate">
            {order.order_number}
          </span>
          <StatusBadge status={order.status} />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 capitalize">
          {order.payment_method.replace(/_/g, ' ')} · {order.payment_status}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{fmtDate(order.created_at)}</span>
          <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
            ₦{Number(order.total_amount).toLocaleString()}
          </span>
        </div>
      </div>
      <Eye className="h-4 w-4 text-[#8B1538] flex-shrink-0" />
    </div>
  );
}

export function BusinessOrders() {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortDesc, setSortDesc] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 20;

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      let sid = storeId;
      if (!sid) {
        const res = await getMyStores();
        const storeList = Array.isArray(res) ? res : (res as any);
        sid = storeList[0]?.id ?? null;
        if (sid) setStoreId(sid);
      }
      if (!sid) throw new Error('No store found for this account.');
      
      const res = await getStoreOrders(sid, p, PAGE_SIZE);
      setOrders(prev => p === 1 ? res.data : [...prev, ...res.data]);
      setTotal(res.total);
      setPage(p);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => { load(1); }, [load]);

  const handleStatusUpdate = async (orderId: string, status: NextStatus) => {
    await updateOrderStatus(orderId, status);
    setOrders(prev =>
      prev.map(o => o.id === orderId ? { ...o, status } : o)
    );
  };

  const filtered = useMemo(() => {
    let list = orders.filter(o => {
      const q = search.toLowerCase();
      const matchSearch = !search || o.order_number.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
    list = [...list].sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDesc ? -diff : diff;
    });
    return list;
  }, [orders, search, statusFilter, sortDesc]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: orders.length };
    ALL_STATUSES.forEach(s => {
      if (s !== 'all') map[s] = orders.filter(o => o.status === s).length;
    });
    return map;
  }, [orders]);

  const hasMore = orders.length < total;

  return (
    <div className="space-y-4 sm:space-y-5">
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        {ALL_STATUSES.map(s => {
          const cfg = s !== 'all' ? STATUS_CFG[s] : null;
          const active = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex-shrink-0"
              style={{
                background: active
                  ? s === 'all' ? 'linear-gradient(135deg,#8B1538,#D4828F)' : cfg?.bg
                  : 'white',
                color: active ? (s === 'all' ? 'white' : cfg?.text) : '#6B7280',
                border: active ? 'none' : '1px solid #E5E7EB',
                boxShadow: active ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {cfg && <cfg.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
              {s === 'all' ? 'All' : cfg?.label}
              {!loading && (
                <span
                  className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: active ? 'rgba(255,255,255,0.25)' : '#F3F4F6', color: active ? 'inherit' : '#9CA3AF' }}
                >
                  {counts[s] ?? 0}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col xs:flex-row items-stretch xs:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by order number…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 outline-none focus:border-[#8B1538] transition-colors placeholder:text-gray-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between xs:justify-end gap-3">
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
            {loading ? '…' : `${filtered.length} order${filtered.length !== 1 ? 's' : ''}`}
          </p>
          <button
            onClick={() => setSortDesc(p => !p)}
            className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors flex-shrink-0"
          >
            {sortDesc ? 'Newest first' : 'Oldest first'}
            <ChevronDown className={`h-4 w-4 transition-transform ${sortDesc ? '' : 'rotate-180'}`} />
          </button>
          <button onClick={() => load(1)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => load(1)} className="flex items-center gap-1 text-xs font-semibold hover:underline">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      )}

      <div className="md:hidden space-y-3">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
            ))
          : filtered.length > 0
          ? filtered.map(o => (
              <OrderCard key={o.id} order={o} onClick={() => setSelectedOrder(o)} />
            ))
          : (
            <div className="py-16 text-center text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-sm">No orders found</p>
            </div>
          )
        }
      </div>

      <div className="hidden md:block bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50">
                {['Order ID', 'Payment', 'Amount', 'Status', 'Date', ''].map(h => (
                  <th key={h} className="px-4 lg:px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {loading
                ? null
                : filtered.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 lg:px-5 py-3.5 font-mono text-xs font-bold text-[#8B1538] whitespace-nowrap">
                        {order.order_number}
                      </td>
                      <td className="px-4 lg:px-5 py-3.5">
                        <p className="text-xs text-gray-600 dark:text-gray-300 capitalize">
                          {order.payment_method.replace(/_/g, ' ')}
                        </p>
                        <p className={`text-xs capitalize font-medium ${
                          order.payment_status === 'paid' ? 'text-green-600 dark:text-green-400' :
                          order.payment_status === 'failed' ? 'text-red-500' : 'text-amber-500'
                        }`}>
                          {order.payment_status}
                        </p>
                      </td>
                      <td className="px-4 lg:px-5 py-3.5 text-sm font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">
                        ₦{Number(order.total_amount).toLocaleString()}
                      </td>
                      <td className="px-4 lg:px-5 py-3.5">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 lg:px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                        {fmtDate(order.created_at)}
                      </td>
                      <td className="px-4 lg:px-5 py-3.5">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 rounded-lg hover:bg-[#8B1538]/10 text-[#8B1538] transition-colors"
                          title="View order"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>

          {loading && <TableSkeleton />}

          {!loading && filtered.length === 0 && (
            <div className="py-16 text-center text-gray-400">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No orders found</p>
            </div>
          )}
        </div>
      </div>

      {!loading && hasMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => load(page + 1)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Load more orders
          </button>
        </div>
      )}

      {!loading && !hasMore && orders.length > 0 && (
        <p className="text-center text-gray-400 dark:text-gray-600 text-xs py-2">
          All {total} orders loaded
        </p>
      )}
    </div>
  );
}

export default BusinessOrders;