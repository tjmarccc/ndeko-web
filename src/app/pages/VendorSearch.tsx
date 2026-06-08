import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Star, Shield, Package, MapPin, ChevronRight, X, ArrowRight, AlertCircle } from 'lucide-react';
import { Link } from 'react-router';
import {
  fetchPublicStores,
  fetchCategories,
  fetchProducts,
  mapApiProduct,
  type ApiStore,
  type ApiCategory,
  type ApiProduct,
} from '../services/api';
import type { Product } from '../types/product';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Derive initials from a store name */
function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

/** Deterministic accent colours based on store id */
const PALETTE = [
  { cover: '#1A0812', accent: '#8B1538' },
  { cover: '#0C2340', accent: '#3D9B8E' },
  { cover: '#1A2412', accent: '#4D8B38' },
  { cover: '#1A1212', accent: '#B05B2A' },
  { cover: '#0D1A2A', accent: '#3A7CBD' },
  { cover: '#1A0A20', accent: '#7B3DB0' },
];
function palette(id: string) {
  const idx = id.charCodeAt(0) % PALETTE.length;
  return PALETTE[idx];
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-pulse">
      <div className="h-28 bg-gray-200 dark:bg-gray-700" />
      <div className="px-5 py-4 space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        <div className="flex gap-2">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
        </div>
        <div className="h-px bg-gray-100 dark:bg-gray-700" />
        <div className="flex justify-between">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

// ─── Vendor card ──────────────────────────────────────────────────────────────

interface StoreWithProducts extends ApiStore {
  products: Product[];
  categoryNames: string[];
}

function VendorCard({ store, onClick }: { store: StoreWithProducts; onClick: () => void }) {
  const { cover, accent } = palette(store.id);
  const initials = getInitials(store.store_name);
  const isVerified = store.status === 'active' || store.status === 'verified';

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300 cursor-pointer group"
      onClick={onClick}
    >
      {/* Cover */}
      <div
        className="relative h-28 flex items-end px-5 pb-3"
        style={{ background: `linear-gradient(135deg, ${cover} 0%, ${accent}88 100%)` }}
      >
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)`,
            backgroundSize: '25px 25px',
          }}
        />
        {/* Avatar */}
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-xl"
          style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(6px)', border: '3px solid white' }}
        >
          {store.logo ? (
            <img src={store.logo} alt={store.store_name} className="w-full h-full object-cover rounded-xl" />
          ) : (
            initials
          )}
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="flex items-start justify-between mb-1">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-gray-800 dark:text-gray-100 font-bold text-base group-hover:text-[#8B1538] transition-colors truncate">
                {store.store_name}
              </h3>
              {isVerified && (
                <Shield className="h-4 w-4 text-[#3D9B8E] flex-shrink-0" fill="#3D9B8E" />
              )}
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5 line-clamp-1">
              {store.description ?? store.category?.name ?? 'Ndeko Store'}
            </p>
          </div>
        </div>

        {/* Rating */}
        {store.average_rating != null && (
          <div className="flex items-center gap-1.5 mt-2 mb-3">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="h-3 w-3"
                  fill={i < Math.floor(store.average_rating ?? 0) ? '#F59E0B' : '#E5E7EB'}
                  stroke="none"
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {store.average_rating?.toFixed(1)}
            </span>
          </div>
        )}

        {/* Category tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {store.categoryNames.slice(0, 2).map((cat) => (
            <span
              key={cat}
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ background: `${accent}18`, color: accent }}
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 pt-3 border-t border-gray-50 dark:border-gray-700">
          {store.products.length > 0 && (
            <span className="flex items-center gap-1">
              <Package className="h-3.5 w-3.5" /> {store.products.length} products
            </span>
          )}
          {store.city && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {store.city}
            </span>
          )}
          <span className="text-[#8B1538] font-semibold group-hover:underline flex items-center gap-0.5">
            View Store <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Detail modal ─────────────────────────────────────────────────────────────

function VendorDetailModal({ store, onClose }: { store: StoreWithProducts; onClose: () => void }) {
  const { cover, accent } = palette(store.id);
  const initials = getInitials(store.store_name);
  const isVerified = store.status === 'active' || store.status === 'verified';

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 w-full sm:rounded-3xl sm:max-w-2xl shadow-2xl overflow-hidden max-h-[92vh] sm:max-h-[90vh] overflow-y-auto rounded-t-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="relative px-5 sm:px-6 py-7 sm:py-8"
          style={{ background: `linear-gradient(135deg, ${cover} 0%, ${accent}88 100%)` }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 text-white flex items-center justify-center hover:bg-black/40 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)`,
              backgroundSize: '30px 30px',
            }}
          />
          <div className="relative flex items-end gap-4">
            <div
              className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-xl flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '3px solid rgba(255,255,255,0.4)' }}
            >
              {store.logo ? (
                <img src={store.logo} alt={store.store_name} className="w-full h-full object-cover rounded-2xl" />
              ) : initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-white font-bold text-lg sm:text-xl truncate">{store.store_name}</h2>
                {isVerified && <Shield className="h-5 w-5 text-white fill-white flex-shrink-0" />}
              </div>
              <p className="text-white/75 text-sm line-clamp-1">
                {store.description ?? store.category?.name ?? 'Ndeko Store'}
              </p>
              {store.average_rating != null && (
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-3.5 w-3.5"
                        fill={i < Math.floor(store.average_rating ?? 0) ? '#FCD34D' : 'rgba(255,255,255,0.3)'}
                        stroke="none"
                      />
                    ))}
                    <span className="text-white/80 text-xs ml-1">{store.average_rating?.toFixed(1)}</span>
                  </div>
                  {store.city && (
                    <span className="text-white/60 text-xs flex items-center gap-1">
                      <MapPin className="h-3 w-3" />{store.city}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* About */}
        <div className="px-5 sm:px-6 py-5 border-b border-gray-100 dark:border-gray-700">
          <h4 className="text-gray-700 dark:text-gray-200 font-semibold mb-2 text-sm">About this Store</h4>
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
            {store.description
              ? store.description
              : `${store.store_name} is a verified seller on Ndeko Express${store.city ? `, based in ${store.city}` : ''}. Browse their full catalogue to find great deals.`}
          </p>
        </div>

        {/* Products */}
        {store.products.length > 0 && (
          <div className="px-5 sm:px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-gray-700 dark:text-gray-200 font-semibold text-sm">Featured Products</h4>
              <span className="text-xs text-gray-400">{store.products.length} shown</span>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {store.products.slice(0, 6).map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  onClick={onClose}
                >
                  <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-[#D4828F] transition-colors group">
                    <div className="aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-1.5 sm:p-2">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{product.name}</p>
                      <p className="text-xs font-bold text-[#8B1538]">₦{product.price.toLocaleString()}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="px-5 sm:px-6 pb-6 flex flex-col xs:flex-row gap-3">
          <Link
            to={`/products?store=${store.store_slug}`}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #8B1538, #D4828F)' }}
            onClick={onClose}
          >
            Visit Full Store
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function VendorSearch() {
  const [query, setQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [selectedStore, setSelectedStore] = useState<StoreWithProducts | null>(null);

  // API data
  const [stores, setStores] = useState<StoreWithProducts[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch categories + stores in parallel ──
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, storeRes] = await Promise.all([
        fetchCategories({ limit: 50 }),
        fetchPublicStores({ status: 'active', limit: 50 }),
      ]);

      setCategories(catRes.data);

      // For each store, fetch a handful of products
      const enriched: StoreWithProducts[] = await Promise.all(
        storeRes.data.map(async (store) => {
          let products: Product[] = [];
          try {
            const prodRes = await fetchProducts({ page: 1, limit: 6 });
            if ('data' in prodRes) {
              products = (prodRes.data as ApiProduct[]).map(mapApiProduct);
            }
          } catch {
            // Products are optional; don't fail the whole card
          }
          const categoryNames = store.category?.name
            ? [store.category.name]
            : [];
          return { ...store, products, categoryNames };
        })
      );

      setStores(enriched);
    } catch {
      setError('Failed to load vendors. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Dynamic category pills (from API + "All") ──
  const categoryPills = useMemo(() => {
    const names = Array.from(new Set(categories.map((c) => c.name)));
    return ['All', ...names.slice(0, 6)];
  }, [categories]);

  // ── Filter ──
  const filtered = useMemo(() => {
    return stores.filter((s) => {
      const q = query.toLowerCase();
      const matchQuery =
        !query ||
        s.store_name.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.category?.name.toLowerCase().includes(q) ||
        s.products.some((p) => p.name.toLowerCase().includes(q));

      const matchCat =
        selectedCat === 'All' ||
        s.category?.name === selectedCat ||
        s.categoryNames.includes(selectedCat);

      return matchQuery && matchCat;
    });
  }, [stores, query, selectedCat]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* ── Hero ── */}
      <div
        className="py-10 sm:py-16 px-4 text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1A0812 0%, #8B1538 55%, #3D9B8E 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative">
          <p className="text-white/60 text-xs sm:text-sm font-medium mb-3 tracking-widest uppercase">
            Vendor Marketplace
          </p>
          <h1
            className="text-white mb-3"
            style={{ fontSize: 'clamp(1.5rem, 5vw, 3rem)', fontWeight: 900, letterSpacing: '-0.03em' }}
          >
            Find Your Trusted Vendors
          </h1>
          <p className="text-white/65 mb-6 sm:mb-8 max-w-lg mx-auto text-sm sm:text-base px-2">
            Search by product, brand, or category — discover verified sellers and browse their catalogues.
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto px-0 sm:px-4">
            <div className="relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <input
                type="text"
                placeholder='Search vendors, products or categories…'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-0 text-gray-800 text-sm outline-none shadow-xl"
                style={{ background: 'white' }}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Category chips */}
            <div className="flex gap-2 mt-3 sm:mt-4 flex-wrap justify-center">
              {categoryPills.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCat(cat)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200"
                  style={{
                    background: selectedCat === cat ? 'white' : 'rgba(255,255,255,0.12)',
                    color: selectedCat === cat ? '#8B1538' : 'rgba(255,255,255,0.75)',
                    border: selectedCat === cat ? 'none' : '1px solid rgba(255,255,255,0.2)',
                    boxShadow: selectedCat === cat ? '0 2px 12px rgba(0,0,0,0.15)' : 'none',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal ── */}
      {selectedStore && (
        <VendorDetailModal store={selectedStore} onClose={() => setSelectedStore(null)} />
      )}

      {/* ── Content ── */}
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-10">

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6 flex items-center gap-3 text-red-700 dark:text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm flex-1">{error}</span>
            <button
              onClick={load}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-300 hover:bg-red-100 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Results count */}
        {!loading && !error && (
          <div className="flex items-center justify-between mb-5 sm:mb-6">
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
              {filtered.length > 0
                ? `${filtered.length} vendor${filtered.length !== 1 ? 's' : ''} found${query ? ` for "${query}"` : ''}`
                : 'No vendors found'}
            </p>
            {(query || selectedCat !== 'All') && (
              <button
                onClick={() => { setQuery(''); setSelectedCat('All'); }}
                className="text-xs sm:text-sm text-[#8B1538] hover:underline flex items-center gap-1"
              >
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}
          </div>
        )}

        {/* Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Vendors grid */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filtered.map((s) => (
              <VendorCard key={s.id} store={s} onClick={() => setSelectedStore(s)} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-16 sm:py-20">
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg, #8B153818, #D4828F18)' }}
            >
              <Search className="h-6 w-6 sm:h-7 sm:w-7 text-[#8B1538]" />
            </div>
            <h3 className="text-gray-700 dark:text-white font-bold text-base sm:text-lg mb-2">
              No vendors found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Try a different search or browse all categories
            </p>
            <button
              onClick={() => { setQuery(''); setSelectedCat('All'); }}
              className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-white text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #8B1538, #D4828F)' }}
            >
              View All Vendors
            </button>
          </div>
        )}

        {/* CTA for sellers */}
        <div
          className="mt-10 sm:mt-16 rounded-2xl sm:rounded-3xl px-6 sm:px-8 py-8 sm:py-10 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1A0812, #8B1538 50%, #3D9B8E)' }}
        >
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)`,
              backgroundSize: '30px 30px',
            }}
          />
          <div className="relative">
            <h3
              className="text-white font-bold mb-2"
              style={{ fontSize: 'clamp(1.1rem, 3vw, 1.5rem)' }}
            >
              Are you a seller? Join Ndeko Express
            </h3>
            <p className="text-white/65 text-xs sm:text-sm mb-5 sm:mb-6 max-w-md mx-auto">
              List your products and reach millions of Nigerian buyers. Free to start, no setup fees.
            </p>
            <Link
              to="/login?role=business"
              className="inline-flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-bold transition-all hover:scale-105"
              style={{ background: 'white', color: '#8B1538' }}
            >
              Start Selling Today
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}