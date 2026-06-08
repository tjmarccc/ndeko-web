import { Zap, Clock, Loader2, AlertCircle, RefreshCw, Tag, SlidersHorizontal } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
// import { Badge } from '../components/ui/badge';
import { useState, useEffect, useCallback } from 'react';
import { fetchProducts, fetchCategories, mapApiProduct, type ApiProduct, type ApiCategory } from '../services/api';
import type { Product } from '../types/product';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useCountdown(targetHours = 23, targetMinutes = 45, targetSeconds = 30) {
  const [timeLeft, setTimeLeft] = useState({
    hours: targetHours,
    minutes: targetMinutes,
    seconds: targetSeconds,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) return { hours, minutes, seconds: seconds - 1 };
        if (minutes > 0) return { hours, minutes: minutes - 1, seconds: 59 };
        if (hours > 0) return { hours: hours - 1, minutes: 59, seconds: 59 };
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return timeLeft;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function getMaxDiscount(products: Product[]) {
  return products.reduce((max, p) => {
    const disc = p.discount ?? 0;
    return disc > max ? disc : max;
  }, 0);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-white text-[#8B1538] px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-lg sm:text-2xl min-w-[48px] sm:min-w-[64px] text-center shadow-lg shadow-black/10 tabular-nums">
        {pad(value)}
      </div>
      <span className="text-white/60 text-[10px] sm:text-xs mt-1 tracking-widest uppercase">{label}</span>
    </div>
  );
}

function Separator() {
  return <span className="text-white/80 text-xl sm:text-3xl font-bold pb-4">:</span>;
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white dark:bg-gray-800 border dark:border-gray-700 animate-pulse">
      <div className="aspect-square bg-gray-200 dark:bg-gray-700" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/2" />
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
        <AlertCircle className="h-7 w-7 text-red-500" />
      </div>
      <div className="text-center">
        <p className="font-semibold dark:text-white mb-1">Failed to load deals</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#8B1538] text-white text-sm font-semibold hover:bg-[#6B0F2A] transition-colors"
      >
        <RefreshCw className="h-4 w-4" /> Try Again
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-14 h-14 rounded-2xl bg-[#8B1538]/10 flex items-center justify-center">
        <Tag className="h-7 w-7 text-[#8B1538]" />
      </div>
      <div className="text-center">
        <p className="font-semibold dark:text-white mb-1">No deals available right now</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Check back soon — flash deals drop daily.</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const DISCOUNT_FILTERS = [
  { label: 'All Deals', min: 0 },
  { label: 'Up to 25% OFF', min: 1, max: 25 },
  { label: '25–50% OFF', min: 25, max: 50 },
  { label: '50%+ OFF', min: 50 },
];

export function Deals() {
  const timeLeft = useCountdown(23, 45, 30);

  // Products
  const [allDeals, setAllDeals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const LIMIT = 20;

  // Filters
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDiscount, setSelectedDiscount] = useState(0); // index into DISCOUNT_FILTERS
  const [showFilters, setShowFilters] = useState(false);

  // Derived: filter locally by discount band
  const filtered = allDeals.filter((p) => {
    const f = DISCOUNT_FILTERS[selectedDiscount];
    const disc = p.discount ?? 0;
    if (f.min === 0 && !f.max) return true;
    if (f.max) return disc >= f.min && disc <= f.max;
    return disc >= f.min;
  });

  const maxDiscount = getMaxDiscount(allDeals);

  const loadProducts = useCallback(async (pageNum: number, catSlug: string, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);
    setError('');
    try {
      const res = await fetchProducts({
        page: pageNum,
        limit: LIMIT,
        ...(catSlug ? { category: catSlug } : {}),
      });

      // fetchProducts returns PaginatedResponse<ApiProduct> when no id is passed
      const paginated = res as { data: ApiProduct[]; total: number };
      const mapped = paginated.data
        .filter((p) => p.discount && p.discount > 0)
        .map(mapApiProduct);

      setAllDeals((prev) => (append ? [...prev, ...mapped] : mapped));
      setTotal(paginated.total);
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetchCategories({ limit: 20 });
      setCategories(res.data);
    } catch {}
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    setPage(1);
    setAllDeals([]);
    loadProducts(1, selectedCategory, false);
  }, [selectedCategory, loadProducts]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadProducts(nextPage, selectedCategory, true);
  };

  const hasMore = allDeals.length < total;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">

        {/* ── Hero Banner ── */}
        <div
          className="rounded-2xl sm:rounded-3xl p-6 sm:p-8 mb-6 sm:mb-8 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #8B1538 0%, #C0374F 50%, #D4828F 100%)' }}
        >
          {/* decorative circles */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/5" />
          <div className="absolute top-4 right-24 w-16 h-16 rounded-full bg-white/10" />

          <div className="relative">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">Flash Deals</h1>
            </div>
            <p className="text-white/80 text-sm sm:text-lg mb-5 sm:mb-6 max-w-md">
              Limited-time offers — grab them before they're gone!
            </p>

            {/* Countdown */}
            <div className="flex flex-wrap items-end gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 text-white/80 text-xs sm:text-sm mr-1">
                <Clock className="h-4 w-4" />
                <span className="hidden xs:inline">Ends in</span>
              </div>
              <TimeBlock value={timeLeft.hours} label="hrs" />
              <Separator />
              <TimeBlock value={timeLeft.minutes} label="min" />
              <Separator />
              <TimeBlock value={timeLeft.seconds} label="sec" />
            </div>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[
            { value: loading ? '—' : String(total), label: 'Active Deals' },
            { value: loading ? '—' : `${maxDiscount}%`, label: 'Max Discount' },
            { value: '24hrs', label: 'Deal Duration' },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl p-4 sm:p-5 text-center"
            >
              <p className="text-xl sm:text-3xl font-bold text-[#8B1538]">{s.value}</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="mb-6 sm:mb-8">
          {/* mobile filter toggle */}
          <div className="flex items-center justify-between mb-3 sm:hidden">
            <p className="text-sm font-semibold dark:text-white">
              {filtered.length} deal{filtered.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border dark:border-gray-700 text-sm dark:text-white"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
          </div>

          {/* Discount filter row — always visible on sm+, toggleable on mobile */}
          <div className={`${showFilters ? 'block' : 'hidden'} sm:block`}>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none flex-nowrap">
              {DISCOUNT_FILTERS.map((f, i) => (
                <button
                  key={f.label}
                  onClick={() => setSelectedDiscount(i)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border transition-all flex-shrink-0 ${
                    selectedDiscount === i
                      ? 'bg-[#8B1538] text-white border-[#8B1538]'
                      : 'bg-white dark:bg-gray-800 text-[#8B1538] border-[#8B1538]/40 hover:border-[#8B1538] dark:text-[#D4828F] dark:border-[#D4828F]/30'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Category filter row */}
            {categories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none flex-nowrap mt-2">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border transition-all flex-shrink-0 ${
                    selectedCategory === ''
                      ? 'bg-[#3D9B8E] text-white border-[#3D9B8E]'
                      : 'bg-white dark:bg-gray-800 text-[#3D9B8E] border-[#3D9B8E]/40 hover:border-[#3D9B8E] dark:border-[#3D9B8E]/30'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border transition-all flex-shrink-0 ${
                      selectedCategory === cat.slug
                        ? 'bg-[#3D9B8E] text-white border-[#3D9B8E]'
                        : 'bg-white dark:bg-gray-800 text-[#3D9B8E] border-[#3D9B8E]/40 hover:border-[#3D9B8E] dark:text-[#3D9B8E] dark:border-[#3D9B8E]/30'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Products grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          ) : error ? (
            <ErrorState message={error} onRetry={() => loadProducts(1, selectedCategory, false)} />
          ) : filtered.length === 0 ? (
            <EmptyState />
          ) : (
            filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>

        {/* ── Load More ── */}
        {!loading && !error && hasMore && filtered.length > 0 && (
          <div className="flex justify-center mt-8 sm:mt-10">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-white dark:bg-gray-800 border dark:border-gray-700 text-[#8B1538] dark:text-[#D4828F] font-semibold text-sm hover:border-[#8B1538] transition-all disabled:opacity-50 shadow-sm"
            >
              {loadingMore ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Loading...</>
              ) : (
                <>Load More Deals</>
              )}
            </button>
          </div>
        )}

        {/* result count footer */}
        {!loading && !error && filtered.length > 0 && (
          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
            Showing {filtered.length} of {total} deals
          </p>
        )}
      </div>
    </div>
  );
}