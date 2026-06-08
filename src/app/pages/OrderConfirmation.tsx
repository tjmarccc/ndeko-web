import { Link, useSearchParams } from 'react-router';
import { CheckCircle2, Package, Mail, Loader2, AlertCircle, CreditCard, Clock, ArrowRight, Copy, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { useState, useEffect } from 'react';
import { getOrder, type ApiOrder } from '../services/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusLabel(s: ApiOrder['status']) {
  return { pending: 'Pending', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' }[s] ?? s;
}

function paymentLabel(m: string) {
  return { card: 'Card', bank_transfer: 'Bank Transfer', wallet: 'Wallet' }[m] ?? m;
}

function paymentStatusColor(s: ApiOrder['payment_status']) {
  return s === 'paid'
    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
    : s === 'failed'
    ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
    : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20';
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function OrderConfirmation() {
  const [params] = useSearchParams();
  const orderId = params.get('id') ?? '';

  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [loading, setLoading] = useState(!!orderId);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    getOrder(orderId)
      .then(setOrder)
      .catch((e: Error) => setError(e.message ?? 'Could not load order details'))
      .finally(() => setLoading(false));
  }, [orderId]);

  const displayRef = order?.order_number ?? (orderId || 'NDK-00000');

  const handleCopy = () => {
    navigator.clipboard.writeText(displayRef).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-md">

        {/* ── Success card ── */}
        <Card className="p-6 sm:p-8 dark:bg-gray-800 dark:border-gray-700 text-center overflow-hidden relative">
          {/* decorative top band */}
          <div
            className="absolute top-0 left-0 right-0 h-1.5 rounded-t-lg"
            style={{ background: 'linear-gradient(90deg, #3D9B8E, #8B1538)' }}
          />

          {/* icon */}
          <div className="relative mx-auto mb-5 w-20 h-20 sm:w-24 sm:h-24">
            <div className="absolute inset-0 rounded-full bg-[#3D9B8E]/15 animate-pulse" />
            <div className="absolute inset-3 rounded-full bg-[#3D9B8E]/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 sm:h-14 sm:w-14 text-[#3D9B8E]" strokeWidth={1.5} />
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold dark:text-white mb-2 tracking-tight">
            Order Placed Successfully!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base mb-6">
            Thank you for shopping with Ndeko Express.
          </p>

          {/* ── Order reference ── */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 mb-5">
            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
              Order Reference
            </p>
            <div className="flex items-center justify-center gap-2">
              <p className="font-black text-[#8B1538] text-lg sm:text-xl tracking-tight">
                {displayRef}
              </p>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-400 hover:text-[#8B1538]"
                aria-label="Copy order reference"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* ── Live order details (from API) ── */}
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-gray-400 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading order details…
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 text-xs text-left mb-5">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>Could not load full order details — your order was still placed.</span>
            </div>
          ) : order ? (
            <div className="grid grid-cols-2 gap-3 mb-5 text-left">
              {/* Total */}
              <div className="col-span-2 sm:col-span-1 bg-white dark:bg-gray-900/60 rounded-xl p-3 border dark:border-gray-700">
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Order Total</p>
                <p className="font-bold text-[#8B1538] text-base">
                  ₦{(order.total_amount ?? 0).toLocaleString()}
                </p>
              </div>
              {/* Payment status */}
              <div className="col-span-2 sm:col-span-1 bg-white dark:bg-gray-900/60 rounded-xl p-3 border dark:border-gray-700">
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Payment</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${paymentStatusColor(order.payment_status)}`}>
                  {order.payment_status}
                </span>
              </div>
              {/* Payment method */}
              <div className="bg-white dark:bg-gray-900/60 rounded-xl p-3 border dark:border-gray-700">
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Method</p>
                <div className="flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-[#8B1538]" />
                  <p className="text-xs font-semibold dark:text-white">
                    {paymentLabel(order.payment_method ?? '')}
                  </p>
                </div>
              </div>
              {/* Status */}
              <div className="bg-white dark:bg-gray-900/60 rounded-xl p-3 border dark:border-gray-700">
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Status</p>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#3D9B8E]" />
                  <p className="text-xs font-semibold dark:text-white capitalize">
                    {statusLabel(order.status)}
                  </p>
                </div>
              </div>
              {/* Pay online link if present */}
              {order.payment_url && (
                <div className="col-span-2">
                  <a
                    href={order.payment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
                    style={{ background: 'linear-gradient(135deg, #8B1538, #D4828F)' }}
                  >
                    Complete Payment <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              )}
            </div>
          ) : null}

          {/* ── Info rows ── */}
          <div className="space-y-3 text-left mb-6">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
              <Mail className="h-4 w-4 text-[#8B1538] mt-0.5 flex-shrink-0" />
              <p className="text-xs sm:text-sm dark:text-gray-300 leading-relaxed">
                A confirmation email has been sent to your registered address.
              </p>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
              <Package className="h-4 w-4 text-[#3D9B8E] mt-0.5 flex-shrink-0" />
              <p className="text-xs sm:text-sm dark:text-gray-300 leading-relaxed">
                Estimated delivery: <span className="font-semibold">2–5 business days</span> within Lagos, 3–7 for other states.
              </p>
            </div>
          </div>

          {/* ── CTAs ── */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              asChild
              variant="outline"
              className="flex-1 border-[#8B1538]/30 text-[#8B1538] hover:bg-[#FDF2F4] dark:hover:bg-[#8B1538]/10 dark:text-[#D4828F] dark:border-[#D4828F]/30 h-11 text-sm font-semibold"
            >
              <Link to="/account">View My Orders</Link>
            </Button>
            <Button
              asChild
              className="flex-1 bg-[#8B1538] hover:bg-[#6B0F2A] h-11 text-sm font-semibold shadow-md shadow-[#8B1538]/20"
            >
              <Link to="/">Continue Shopping</Link>
            </Button>
          </div>
        </Card>

        {/* ── Support note ── */}
        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-5">
          Need help?{' '}
          <Link to="/contact" className="text-[#8B1538] dark:text-[#D4828F] hover:underline font-medium">
            Contact support
          </Link>
        </p>

      </div>
    </div>
  );
}