import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { Heart, ShoppingCart, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import {
  getWishlist,
  mapApiProduct,
  type WishlistItem,
} from '../services/api';
import type { Product } from '../types/product';

// ─── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-pulse bg-white dark:bg-gray-800">
      <div className="w-full h-44 sm:h-48 bg-gray-200 dark:bg-gray-700" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="flex gap-2 pt-1">
          <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
          <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function Wishlist() {
  const { addToCart } = useCart();
  const { removeFromWishlist: contextRemove } = useWishlist();

  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Track which item IDs are mid-action
  const [removing, setRemoving] = useState<Set<string>>(new Set());
  const [addingToCart, setAddingToCart] = useState<Set<string>>(new Set());

  // ── Fetch wishlist ──
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getWishlist();
      setItems(res.data.map((item: WishlistItem) => mapApiProduct(item.product)));
    } catch {
      setError('Failed to load your wishlist. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Remove ──
  const handleRemove = async (productId: string) => {
    setRemoving((prev) => new Set(prev).add(productId));
    try {
      await contextRemove(productId);
      setItems((prev) => prev.filter((p) => p.id !== productId));
    } catch {
      // Silently revert — item stays in list
    } finally {
      setRemoving((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  // ── Add to cart ──
  const handleAddToCart = async (product: Product) => {
    setAddingToCart((prev) => new Set(prev).add(product.id));
    try {
      // Sync local cart context
      addToCart(product);
    } finally {
      setAddingToCart((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }
  };

  // ─── Empty state ──────────────────────────────────────────────────────────

  if (!loading && !error && items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 text-center">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: 'linear-gradient(135deg, #8B153818, #D4828F22)' }}
        >
          <Heart className="h-9 w-9 text-[#D4828F]" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold mb-2 dark:text-white">
          Your Wishlist is Empty
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-7 max-w-xs text-sm sm:text-base">
          Save your favourite products to revisit them later.
        </p>
        <Button asChild className="bg-[#8B1538] hover:bg-[#6B0F2A] px-7 py-2.5 rounded-xl text-sm font-semibold">
          <Link to="/products">Discover Products</Link>
        </Button>
      </div>
    );
  }

  // ─── Main render ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 sm:mb-6">
          <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-[#D4828F]" fill="#D4828F" />
          <h1 className="text-lg sm:text-2xl font-bold dark:text-white">
            My Wishlist
            {!loading && (
              <span className="ml-2 text-sm sm:text-base font-normal text-gray-400 dark:text-gray-500">
                ({items.length})
              </span>
            )}
          </h1>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6 flex items-center gap-3 text-red-700 dark:text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm flex-1">{error}</span>
            <button
              onClick={load}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Skeleton */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Grid */}
        {!loading && !error && items.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {items.map((p) => {
              const isRemoving = removing.has(p.id);
              const isAddingCart = addingToCart.has(p.id);

              return (
                <Card
                  key={p.id}
                  className={`overflow-hidden dark:bg-gray-800 dark:border-gray-700 transition-opacity duration-300 ${isRemoving ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}
                >
                  {/* Image */}
                  <Link to={`/product/${p.id}`} className="block overflow-hidden">
                    <ImageWithFallback
                      src={p.image}
                      alt={p.name}
                      className="w-full h-36 sm:h-48 object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </Link>

                  <div className="p-3 sm:p-4 space-y-2">
                    {/* Name */}
                    <Link
                      to={`/product/${p.id}`}
                      className="text-xs sm:text-sm font-semibold dark:text-white line-clamp-2 hover:text-[#8B1538] transition-colors leading-snug block"
                    >
                      {p.name}
                    </Link>

                    {/* Price */}
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-[#8B1538] font-bold text-sm sm:text-base">
                        ₦{p.price.toLocaleString()}
                      </span>
                      {p.originalPrice && p.originalPrice > p.price && (
                        <span className="text-gray-400 line-through text-xs">
                          ₦{p.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Stock badge */}
                    <span
                      className={`inline-block text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full ${
                        p.inStock
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {p.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        className="flex-1 bg-[#8B1538] hover:bg-[#6B0F2A] text-xs sm:text-sm h-8 sm:h-9 disabled:opacity-60"
                        onClick={() => handleAddToCart(p)}
                        disabled={!p.inStock || isAddingCart}
                      >
                        {isAddingCart
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <><ShoppingCart className="h-3.5 w-3.5 mr-1 sm:mr-1.5" /><span className="hidden xs:inline">Add</span></>
                        }
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemove(p.id)}
                        disabled={isRemoving}
                        className="text-red-500 hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-900/20 dark:border-gray-600 h-8 sm:h-9 w-8 sm:w-9 p-0 flex-shrink-0"
                        aria-label="Remove from wishlist"
                      >
                        {isRemoving
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />
                        }
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}