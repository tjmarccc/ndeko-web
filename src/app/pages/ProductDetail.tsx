import { useParams, Link } from 'react-router';
import {
  ShoppingCart, Heart, Star, Truck, Shield, ArrowLeft,
  Loader2, AlertCircle, RefreshCw, User, Check, MessageSquare,
} from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useCart } from '../contexts/CartContext';
import { toast } from 'sonner';
import { useState, useEffect, useCallback } from 'react';
import {
  fetchProducts, fetchProductReviews, addProductReview,
  addToWishlist, removeFromWishlist, mapApiProduct,
  tokenStore,
  type ApiProduct, type ApiReview,
} from '../services/api';
import type { Product } from '../types/product';

// ─── Sub-components ───────────────────────────────────────────────────────────

function StarRow({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${cls} ${
            i < Math.floor(rating)
              ? 'fill-[#3D9B8E] text-[#3D9B8E]'
              : 'fill-gray-200 text-gray-200 dark:fill-gray-600 dark:text-gray-600'
          }`}
        />
      ))}
    </div>
  );
}

function ReviewForm({ productId, onPosted }: { productId: string; onPosted: () => void }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!tokenStore.getAccess()) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return toast.error('Please select a star rating');
    setSubmitting(true);
    try {
      await addProductReview(productId, { rating, comment: comment.trim() || undefined });
      toast.success('Review posted!');
      setRating(0);
      setComment('');
      onPosted();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to post review';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border dark:border-gray-700 rounded-2xl p-4 sm:p-5 space-y-3 bg-gray-50 dark:bg-gray-900/50">
      <p className="font-semibold dark:text-white text-sm">Leave a Review</p>
      {/* Star picker */}
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setHovered(i + 1)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(i + 1)}
            className="p-0.5"
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                i < (hovered || rating)
                  ? 'fill-[#3D9B8E] text-[#3D9B8E]'
                  : 'fill-gray-200 text-gray-200 dark:fill-gray-600'
              }`}
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience (optional)…"
        rows={3}
        className="w-full text-sm rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#8B1538]/30"
      />
      <button
        type="submit"
        disabled={submitting}
        className="flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg, #8B1538, #D4828F)' }}
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        {submitting ? 'Posting…' : 'Post Review'}
      </button>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  // Product state
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Related products
  const [related, setRelated] = useState<Product[]>([]);

  // Reviews
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewTotal, setReviewTotal] = useState(0);

  // Wishlist
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Load product by id
  const loadProduct = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetchProducts({ id });
      const raw = res as ApiProduct;
      const mapped = mapApiProduct(raw);
      setProduct(mapped);

      // load related by same category
      if (raw.category?.slug) {
        const rel = await fetchProducts({ category: raw.category.slug, limit: 5 });
        const relPaginated = rel as { data: ApiProduct[] };
        setRelated(
          relPaginated.data
            .filter((p) => p.id !== id)
            .slice(0, 4)
            .map(mapApiProduct)
        );
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Product not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Load reviews
  const loadReviews = useCallback(async () => {
    if (!id) return;
    setReviewsLoading(true);
    try {
      const res = await fetchProductReviews(id, 1, 10);
      setReviews(res.data);
      setReviewTotal(res.total);
    } catch {}
    finally { setReviewsLoading(false); }
  }, [id]);

  useEffect(() => { loadProduct(); }, [loadProduct]);
  useEffect(() => { loadReviews(); }, [loadReviews]);

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) addToCart(product);
    toast.success(`${quantity}× ${product.name} added to cart!`);
  };

  const handleWishlist = async () => {
    if (!id) return;
    if (!tokenStore.getAccess()) return toast.error('Sign in to save items');
    setWishlistLoading(true);
    try {
      if (wishlisted) {
        await removeFromWishlist(id);
        setWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await addToWishlist(id);
        setWishlisted(true);
        toast.success('Saved to wishlist');
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Wishlist error');
    } finally {
      setWishlistLoading(false);
    }
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin text-[#8B1538]" />
          <span className="text-sm">Loading product…</span>
        </div>
      </div>
    );
  }

  // ── Error / not found ──
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold mb-2 dark:text-white">Product Not Found</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{error || 'This product may have been removed.'}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={loadProduct} variant="outline" className="flex items-center gap-2 dark:border-gray-700 dark:text-white">
              <RefreshCw className="h-4 w-4" /> Retry
            </Button>
            <Button asChild className="bg-[#8B1538] hover:bg-[#6B0F2A]">
              <Link to="/products">Browse Products</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">

        {/* ── Breadcrumb ── */}
        <div className="mb-5">
          <Button variant="ghost" asChild className="text-sm dark:text-gray-300 -ml-2">
            <Link to="/products">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back to Products
            </Link>
          </Button>
        </div>

        {/* ── Product card ── */}
        <div className="bg-white dark:bg-gray-800 dark:border dark:border-gray-700 rounded-2xl p-5 sm:p-8 mb-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

            {/* Image */}
            <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.discount && (
                <Badge className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-[#D4828F] text-white text-sm sm:text-base px-2.5 py-1">
                  -{product.discount}% OFF
                </Badge>
              )}
              {!product.inStock && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="bg-white text-gray-800 font-bold px-4 py-2 rounded-xl text-sm">Out of Stock</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col">
              {product.brand && (
                <p className="text-xs font-semibold text-[#3D9B8E] uppercase tracking-widest mb-2">{product.brand}</p>
              )}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold dark:text-white mb-3 leading-tight">
                {product.name}
              </h1>

              {/* Rating row */}
              <div className="flex items-center gap-2 mb-4">
                <StarRow rating={product.rating} size="lg" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {product.rating.toFixed(1)} ({product.reviews} review{product.reviews !== 1 ? 's' : ''})
                </span>
              </div>

              {/* Price */}
              <div className="border-t dark:border-gray-700 border-b dark:border-b-gray-700 py-4 mb-5">
                <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
                  <span className="text-3xl sm:text-4xl font-bold text-[#8B1538]">
                    ₦{product.price.toLocaleString()}
                  </span>
                  {product.originalPrice && (
                    <>
                      <span className="text-lg sm:text-xl text-gray-400 line-through">
                        ₦{product.originalPrice.toLocaleString()}
                      </span>
                      <Badge className="bg-[#3D9B8E] hover:bg-[#2F7C72] text-xs">
                        Save ₦{(product.originalPrice - product.price).toLocaleString()}
                      </Badge>
                    </>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mb-5">
                <h2 className="font-semibold mb-1.5 dark:text-white text-sm">Description</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{product.description}</p>
              </div>

              {/* Quantity */}
              <div className="mb-5">
                <p className="text-sm font-semibold dark:text-white mb-2">Quantity</p>
                <div className="flex items-center border dark:border-gray-600 rounded-xl w-fit overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white transition-colors text-lg font-medium"
                  >
                    −
                  </button>
                  <span className="px-5 py-2.5 font-bold dark:text-white text-base min-w-[3rem] text-center border-x dark:border-gray-600">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white transition-colors text-lg font-medium"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mb-6">
                <Button
                  onClick={handleAddToCart}
                  className="flex-1 bg-[#8B1538] hover:bg-[#6B0F2A] h-11 sm:h-12 text-sm sm:text-base shadow-md shadow-[#8B1538]/20"
                  disabled={!product.inStock}
                >
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                </Button>
                <button
                  onClick={handleWishlist}
                  disabled={wishlistLoading}
                  className={`h-11 sm:h-12 w-11 sm:w-12 flex-shrink-0 rounded-xl border transition-all flex items-center justify-center ${
                    wishlisted
                      ? 'bg-[#FDF2F4] border-[#D4828F] text-[#D4828F] dark:bg-[#8B1538]/20 dark:border-[#D4828F]/50'
                      : 'border-[#D4828F]/40 text-[#D4828F] hover:bg-[#FDF2F4] dark:hover:bg-[#8B1538]/10'
                  }`}
                  aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  {wishlistLoading
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${wishlisted ? 'fill-[#D4828F]' : ''}`} />
                  }
                </button>
              </div>

              {/* Feature pills */}
              <div className="border-t dark:border-gray-700 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: Truck, title: '10% Cashback', sub: 'On orders over ₦20,000' },
                  { icon: Shield, title: 'Secure Payment', sub: '100% protected checkout' },
                ].map(({ icon: Icon, title, sub }) => (
                  <div key={title} className="flex items-center gap-3">
                    <div className="bg-[#FDF2F4] dark:bg-[#8B1538]/20 p-2 rounded-lg flex-shrink-0">
                      <Icon className="h-4 w-4 text-[#8B1538]" />
                    </div>
                    <div>
                      <p className="font-semibold dark:text-white text-sm">{title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Reviews section ── */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold dark:text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#8B1538]" />
              Reviews
              {reviewTotal > 0 && (
                <span className="text-sm font-normal text-gray-400 dark:text-gray-500">({reviewTotal})</span>
              )}
            </h2>
          </div>

          {/* Review form */}
          <div className="mb-5">
            <ReviewForm productId={id!} onPosted={loadReviews} />
          </div>

          {/* Review list */}
          {reviewsLoading ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading reviews…
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No reviews yet — be the first!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#8B1538]/10 flex items-center justify-center flex-shrink-0">
                      {r.user.avatar
                        ? <img src={r.user.avatar} alt={r.user.name} className="w-9 h-9 rounded-full object-cover" />
                        : <User className="h-4 w-4 text-[#8B1538]" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="font-semibold dark:text-white text-sm">{r.user.name}</p>
                        {r.is_verified_purchase && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full font-medium">
                            Verified Purchase
                          </span>
                        )}
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
                          {new Date(r.created_at).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <StarRow rating={r.rating} />
                      {r.comment && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">{r.comment}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Related Products ── */}
        {related.length > 0 && (
          <section>
            <h2 className="text-lg sm:text-xl font-bold dark:text-white mb-4">Related Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}