import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { ChevronRight, Zap, Truck, Shield, Headphones, Package } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { categories as fallbackCategories, products as fallbackProducts } from '../data/products';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { HeroCarousel } from '../components/HeroCarousel';
import { FlashDealsCarousel } from '../components/FlashDealsCarousel';
import {
  fetchCategories,
  fetchProducts,
  mapApiProduct,
  type ApiCategory,
} from '../services/api';
import type { Product, Category } from '../types/product';

// ─── Skeleton loaders ────────────────────────────────────────────────────────

function CategorySkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg border border-gray-100 dark:border-gray-700 animate-pulse">
      <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-full bg-gray-200 dark:bg-gray-700 mb-3" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mx-auto w-3/4" />
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-200 dark:bg-gray-700" />
      <div className="p-3 sm:p-4 space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mt-2" />
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full mt-3" />
      </div>
    </div>
  );
}

// ─── Category emoji helper ────────────────────────────────────────────────────

const EMOJI_MAP: Record<string, string> = {
  Smartphone: '📱', smartphone: '📱', electronics: '📱', tech: '📱',
  Shirt: '👕', fashion: '👕', clothing: '👕', apparel: '👕',
  Home: '🏠', home: '🏠', kitchen: '🏠',
  Dumbbell: '🏋️', sports: '🏋️', fitness: '🏋️',
  Sparkles: '✨', beauty: '✨', cosmetics: '✨',
  Gamepad2: '🎮', toys: '🎮', games: '🎮',
  BookOpen: '📚', books: '📚', education: '📚',
  Car: '🚗', automotive: '🚗', auto: '🚗',
};

function getCategoryEmoji(iconOrSlug: string): string {
  return EMOJI_MAP[iconOrSlug] ?? EMOJI_MAP[iconOrSlug.toLowerCase()] ?? '📦';
}

// ─── Map API category → local Category shape ─────────────────────────────────
function mapApiCategory(c: ApiCategory): Category {
  return {
    id: c.slug ?? c.id,
    name: c.name,
    icon: c.slug ?? c.name,
  };
}

// ─── Home page ────────────────────────────────────────────────────────────────

export function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [dealProducts, setDealProducts] = useState<Product[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories
  useEffect(() => {
    fetchCategories({ limit: 8 })
      .then((res) => {
        if (res.data?.length) {
          setCategories(res.data.map(mapApiCategory));
        } else {
          setCategories(fallbackCategories);
        }
      })
      .catch(() => setCategories(fallbackCategories))
      .finally(() => setLoadingCats(false));
  }, []);

  // Fetch products (new arrivals + deals)
  useEffect(() => {
    fetchProducts({ limit: 12, page: 1 })
      .then((res) => {
        // ✅ Fix: fetchProducts now correctly returns PaginatedResponse<ApiProduct>
        // No more (res as any) — res.data is typed and safe
        const raw = res.data;
        if (raw?.length) {
          const mapped = raw.map(mapApiProduct);
          setNewArrivals(mapped.slice(0, 6));
          // ✅ Fix: discount can be null from API — mapApiProduct normalises it to
          // undefined, so this filter now works correctly
          setDealProducts(mapped.filter((p) => p.discount != null && p.discount > 0));
        } else {
          setNewArrivals(fallbackProducts.slice(0, 6));
          setDealProducts(fallbackProducts.filter((p) => p.discount));
        }
      })
      .catch(() => {
        setNewArrivals(fallbackProducts.slice(0, 6));
        setDealProducts(fallbackProducts.filter((p) => p.discount));
        setError('Could not load live products — showing demo data.');
      })
      .finally(() => setLoadingProducts(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* Hero Carousel */}
      <HeroCarousel />

      {/* API error notice */}
      {error && (
        <div className="container mx-auto px-4 pt-4">
          <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded px-3 py-2">
            ⚠️ {error}
          </p>
        </div>
      )}

      {/* ── Features strip ─────────────────────────────────────────────── */}
      <section className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {[
            { icon: Truck, label: '10% Cashback', sub: 'On orders over ₦20,000', teal: false },
            { icon: Shield, label: 'Secure Payment', sub: '100% protected', teal: false },
            { icon: Zap, label: 'Flash Deals', sub: 'Daily offers', teal: true },
            { icon: Headphones, label: '24/7 Support', sub: "We're here to help", teal: false },
          ].map(({ icon: Icon, label, sub, teal }) => (
            <Card
              key={label}
              className="p-3 sm:p-4 lg:p-6 flex items-center gap-2 sm:gap-3 lg:gap-4 dark:bg-gray-800 dark:border-gray-700"
            >
              <div
                className={`shrink-0 p-2 sm:p-3 rounded-full ${
                  teal
                    ? 'bg-[#E8F5F3] dark:bg-[#3D9B8E]/20'
                    : 'bg-[#FDF2F4] dark:bg-[#8B1538]/20'
                }`}
              >
                <Icon
                  className={`h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 ${
                    teal ? 'text-[#3D9B8E]' : 'text-[#8B1538]'
                  }`}
                />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-xs sm:text-sm lg:text-base leading-tight dark:text-white truncate">
                  {label}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight mt-0.5 hidden sm:block">
                  {sub}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Shop by Category ───────────────────────────────────────────── */}
      <section className="container mx-auto px-3 sm:px-4 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold dark:text-white">Shop by Category</h2>
        </div>

        {loadingCats ? (
          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2 sm:gap-3 lg:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <CategorySkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2 sm:gap-3 lg:gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/products?category=${category.id}`}
                className="bg-white dark:bg-gray-800 p-2 sm:p-4 lg:p-6 rounded-lg text-center hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700 hover:border-[#D4828F] group"
              >
                <div className="bg-[#FDF2F4] dark:bg-[#8B1538]/20 w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 mx-auto rounded-full flex items-center justify-center mb-1.5 sm:mb-2 lg:mb-3 group-hover:scale-105 transition-transform">
                  <span className="text-lg sm:text-xl lg:text-2xl">
                    {getCategoryEmoji(category.icon)}
                  </span>
                </div>
                <h3 className="text-[10px] sm:text-xs lg:text-sm font-semibold dark:text-white leading-tight line-clamp-2">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Flash Deals ────────────────────────────────────────────────── */}
      {loadingProducts ? (
        <section
          className="relative overflow-hidden py-10"
          style={{
            background:
              'linear-gradient(135deg, #1a0008 0%, #3D0B1E 30%, #8B1538 60%, #C4526A 80%, #3D9B8E 100%)',
          }}
        >
          <div className="container mx-auto px-4">
            <div className="h-8 bg-white/10 rounded w-48 mb-7 animate-pulse" />
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 rounded-2xl bg-white/10 animate-pulse"
                  style={{ width: 210, height: 300 }}
                />
              ))}
            </div>
          </div>
        </section>
      ) : dealProducts.length > 0 ? (
        <FlashDealsCarousel products={dealProducts} />
      ) : null}

      {/* ── New Arrivals ───────────────────────────────────────────────── */}
      <section className="container mx-auto px-3 sm:px-4 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold dark:text-white">New Arrivals</h2>
          <Button
            variant="outline"
            asChild
            className="border-[#8B1538] text-[#8B1538] hover:bg-[#FDF2F4] dark:hover:bg-[#8B1538]/20 text-xs sm:text-sm px-2 sm:px-4"
          >
            <Link to="/products">
              View All
              <ChevronRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
            </Link>
          </Button>
        </div>

        {loadingProducts ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : newArrivals.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-600">
            <Package className="h-12 w-12 mb-3 opacity-40" />
            <p className="text-sm">No products available right now.</p>
          </div>
        )}
      </section>

      {/* ── Featured Banner ────────────────────────────────────────────── */}
      <section className="container mx-auto px-3 sm:px-4 py-8 sm:py-12">
        <div className="bg-gradient-to-r from-[#D4828F] to-[#8B1538] rounded-lg sm:rounded-xl p-6 sm:p-8 lg:p-12 text-white text-center">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3 lg:mb-4">
            Save up to 50% on Electronics
          </h2>
          <p className="text-sm sm:text-base lg:text-xl mb-4 sm:mb-5 lg:mb-6 opacity-90">
            Limited time offer on top brands
          </p>
          <Button
            size="lg"
            asChild
            className="bg-white text-[#8B1538] hover:bg-gray-100 text-sm sm:text-base px-4 sm:px-6 lg:px-8"
          >
            <Link to="/products?category=electronics">Shop Electronics</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}