import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { Slider } from '../components/ui/slider';
import { SlidersHorizontal, ChevronLeft, ChevronRight, X, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import {
  fetchProducts,
  fetchCategories,
  mapApiProduct,
  type ApiProduct,
  type ApiCategory,
} from '../services/api';
import type { Product } from '../types/product';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;
const MAX_PRICE = 3_000_000; // naira

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden animate-pulse border border-gray-100 dark:border-gray-700">
      <div className="aspect-square bg-gray-200 dark:bg-gray-700" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mt-2" />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function Products() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') || '';

  // ── Filter / sort state ──
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam || 'all');
  const [priceRange, setPriceRange] = useState([0, MAX_PRICE]);
  const [sortBy, setSortBy] = useState('featured');
  const [filterOpen, setFilterOpen] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // ── Data state ──
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catLoading, setCatLoading] = useState(false);

  // ── Refs ──
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ── Active filter count ──
  const activeFilterCount = [
    selectedCategory !== 'all' ? 1 : 0,
    priceRange[0] > 0 || priceRange[1] < MAX_PRICE ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  // ── Fetch categories ──
  useEffect(() => {
    setCatLoading(true);
    fetchCategories({ limit: 50 })
      .then((res) => setCategories(res.data))
      .catch(() => {/* silent – filters still usable */})
      .finally(() => setCatLoading(false));
  }, []);

  // ── Fetch products ──
  const loadProducts = useCallback(
    async (page: number, append = false) => {
      // Cancel previous request
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      append ? setLoadingMore(true) : setLoading(true);
      setError(null);

      try {
        const params: Parameters<typeof fetchProducts>[0] = {
          page,
          limit: PAGE_SIZE,
        };
        if (selectedCategory !== 'all') params.category = selectedCategory;

        const res = await fetchProducts(params);

        // API can return single product or paginated list
        if ('data' in res) {
          const mapped = res.data.map(mapApiProduct);

          // Client-side price filter (API may not support range filter)
          const priceFiltered = mapped.filter(
            (p) => (p.price ?? 0) >= priceRange[0] && (p.price ?? 0) <= priceRange[1]
          );

          // Client-side search filter
          const searched = searchQuery
            ? priceFiltered.filter(
                (p) =>
                  (p.name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (p.description ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (p.brand ?? '').toLowerCase().includes(searchQuery.toLowerCase())
              )
            : priceFiltered;

          setProducts((prev) => (append ? [...prev, ...searched] : searched));
          setTotalProducts(res.total ?? 0);
          setCurrentPage(page);
        } else {
          // Single product response
          const mapped = mapApiProduct(res as ApiProduct);
          setProducts([mapped]);
          setTotalProducts(1);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedCategory, priceRange, searchQuery]
  );

  // Re-fetch when filters/search change
  useEffect(() => {
    setProducts([]);
    loadProducts(1, false);
  }, [loadProducts]);

  // Sync category param from URL
  useEffect(() => {
    setSelectedCategory(categoryParam || 'all');
  }, [categoryParam]);

  // ── Client-side sort (already loaded data) ──
  const sortedProducts = useMemo(() => {
    const copy = [...products];
    switch (sortBy) {
      case 'price-low': return copy.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
      case 'price-high': return copy.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
      case 'rating': return copy.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      case 'discount': return copy.sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0));
      default: return copy;
    }
  }, [products, sortBy]);

  const hasMore = products.length < totalProducts;

  // ── Infinite scroll via IntersectionObserver ──
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || loadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadProducts(currentPage + 1, true);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, currentPage, loadProducts]);

  // ── Reset helpers ──
  const clearFilters = () => {
    setSelectedCategory('all');
    setPriceRange([0, MAX_PRICE]);
    setMobileFilterOpen(false);
  };

  // ── Filter panel ──
  const FilterContent = () => (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 dark:text-white" />
          <h2 className="font-semibold text-lg dark:text-white">Filters</h2>
          {activeFilterCount > 0 && (
            <Badge className="bg-[#8B1538] text-white text-xs px-2">{activeFilterCount}</Badge>
          )}
        </div>
        <button
          onClick={() => setMobileFilterOpen(false)}
          className="lg:hidden p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Close filters"
        >
          <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Categories */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3 dark:text-white">Categories</h3>
        {catLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
            {/* All option */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="cat-all"
                checked={selectedCategory === 'all'}
                onCheckedChange={() => setSelectedCategory('all')}
              />
              <Label htmlFor="cat-all" className="cursor-pointer dark:text-gray-300">
                All Categories
              </Label>
            </div>
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-2">
                <Checkbox
                  id={`cat-${cat.id}`}
                  checked={selectedCategory === cat.id || selectedCategory === cat.slug}
                  onCheckedChange={() =>
                    setSelectedCategory(
                      selectedCategory === cat.id || selectedCategory === cat.slug
                        ? 'all'
                        : cat.slug ?? cat.id
                    )
                  }
                />
                <Label
                  htmlFor={`cat-${cat.id}`}
                  className="cursor-pointer dark:text-gray-300 capitalize"
                >
                  {cat.name}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Price range */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3 dark:text-white">Price Range</h3>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={MAX_PRICE}
          step={1000}
          className="mb-3"
        />
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
          <span>₦{(priceRange[0] ?? 0).toLocaleString()}</span>
          <span>₦{(priceRange[1] ?? MAX_PRICE).toLocaleString()}</span>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full border-[#8B1538] text-[#8B1538] hover:bg-[#FDF2F4]"
        onClick={clearFilters}
      >
        Clear Filters
      </Button>
    </>
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="flex gap-4 lg:gap-6 relative">

          {/* ── Desktop Collapsible Sidebar ── */}
          <aside
            className="hidden lg:block flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden"
            style={{ width: filterOpen ? 256 : 0 }}
          >
            <div
              className="w-64 bg-white dark:bg-gray-800 p-6 rounded-lg h-fit sticky top-24 dark:border dark:border-gray-700"
              style={{
                opacity: filterOpen ? 1 : 0,
                transform: filterOpen ? 'translateX(0)' : 'translateX(-20px)',
                transition: 'opacity 0.25s ease, transform 0.25s ease',
                pointerEvents: filterOpen ? 'auto' : 'none',
              }}
            >
              <FilterContent />
            </div>
          </aside>

          {/* ── Mobile Overlay Sidebar ── */}
          {mobileFilterOpen && (
            <div
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setMobileFilterOpen(false)}
            />
          )}
          <aside
            className="fixed top-0 left-0 h-full w-[min(288px,85vw)] bg-white dark:bg-gray-800 z-50 p-5 overflow-y-auto shadow-2xl lg:hidden transition-transform duration-300"
            style={{ transform: mobileFilterOpen ? 'translateX(0)' : 'translateX(-100%)' }}
          >
            <FilterContent />
          </aside>

          {/* ── Products Grid ── */}
          <div className="flex-1 min-w-0">

            {/* Header bar */}
            <div className="bg-white dark:bg-gray-800 dark:border dark:border-gray-700 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 flex flex-wrap items-center gap-3 justify-between">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {/* Desktop toggle */}
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium dark:text-gray-200 transition-all flex-shrink-0"
                  title={filterOpen ? 'Collapse filters' : 'Expand filters'}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {filterOpen
                    ? <ChevronLeft className="h-3.5 w-3.5" />
                    : <ChevronRight className="h-3.5 w-3.5" />}
                  {!filterOpen && activeFilterCount > 0 && (
                    <Badge className="bg-[#8B1538] text-white text-xs px-1.5 py-0">
                      {activeFilterCount}
                    </Badge>
                  )}
                </button>

                {/* Mobile toggle */}
                <button
                  onClick={() => setMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 text-sm font-medium dark:text-gray-200 flex-shrink-0"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="hidden xs:inline">Filters</span>
                  {activeFilterCount > 0 && (
                    <Badge className="bg-[#8B1538] text-white text-xs px-1.5">
                      {activeFilterCount}
                    </Badge>
                  )}
                </button>

                <div className="min-w-0">
                  <h1 className="text-base sm:text-xl font-bold dark:text-white truncate">
                    {searchQuery
                      ? `Results for "${searchQuery}"`
                      : categoryParam
                      ? (categories.find((c) => c.id === categoryParam || c.slug === categoryParam)?.name ?? 'Products')
                      : 'All Products'}
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">
                    {loading ? 'Loading…' : `${(totalProducts ?? 0).toLocaleString()} products found`}
                  </p>
                </div>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm flex-shrink-0 max-w-[160px] sm:max-w-none"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low → High</option>
                <option value="price-high">Price: High → Low</option>
                <option value="rating">Highest Rated</option>
                <option value="discount">Best Discount</option>
              </select>
            </div>

            {/* Error state */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 flex items-center gap-3 text-red-700 dark:text-red-400">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => loadProducts(1)}
                >
                  Retry
                </Button>
              </div>
            )}

            {/* Loading skeleton */}
            {loading && (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {/* Products grid */}
            {!loading && sortedProducts.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                {sortedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && sortedProducts.length === 0 && (
              <div className="bg-white dark:bg-gray-800 dark:border dark:border-gray-700 rounded-lg p-8 sm:p-12 text-center">
                <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg mb-3">
                  No products found
                </p>
                {activeFilterCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#8B1538] text-[#8B1538] hover:bg-[#FDF2F4]"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            )}

            {/* Infinite scroll sentinel */}
            {!loading && hasMore && (
              <div ref={loadMoreRef} className="py-6 flex justify-center">
                {loadingMore && (
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading more…
                  </div>
                )}
              </div>
            )}

            {/* End of results */}
            {!loading && !hasMore && sortedProducts.length > 0 && (
              <p className="text-center text-gray-400 dark:text-gray-600 text-xs py-6">
                You've seen all {(totalProducts ?? 0).toLocaleString()} products
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}