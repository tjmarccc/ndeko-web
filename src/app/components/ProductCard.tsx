import { Link } from 'react-router';
import { ShoppingCart, Star, Heart, ImageOff } from 'lucide-react';
import type { Product } from '../types/product';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { toast } from 'sonner';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const wished = isInWishlist(product.id);
  const [imgError, setImgError] = useState(false);

  // ─── CRITICAL: Both handlers call e.stopPropagation() so clicks
  // don't bubble up to the wrapping <Link> and trigger navigation. ───

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    toast.success(`${product.name} added to cart`);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
    toast.success(wished ? 'Removed from wishlist' : 'Added to wishlist');
  };

  // Resolve image: use product.image if valid, otherwise show placeholder UI
  const hasImage = !imgError && product.image && !product.image.includes('placeholder');

  return (
    <Link
      to={`/product/${product.id}`}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group border border-gray-100 dark:border-gray-700 flex flex-col"
    >
      {/* ── Image area ── */}
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
        {hasImage ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          /* Placeholder shown when image is missing or broken */
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
            <ImageOff className="h-8 w-8 text-gray-300 dark:text-gray-600" />
            <span className="text-[10px] text-gray-400 dark:text-gray-500 text-center px-2 line-clamp-2">
              {product.name}
            </span>
          </div>
        )}

        {/* Discount badge */}
        {product.discount != null && product.discount > 0 && (
          <Badge className="absolute top-2 left-2 bg-[#D4828F] hover:bg-[#8B1538] text-white text-[10px] px-1.5 py-0.5">
            -{product.discount}%
          </Badge>
        )}

        {/* Out of stock overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <span className="bg-white/90 text-gray-700 text-[10px] font-semibold px-2.5 py-1 rounded-full">
              Out of stock
            </span>
          </div>
        )}

        {/* Wishlist button — stopPropagation prevents Link navigation */}
        <button
          onClick={handleWishlist}
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-2 right-2 bg-white/90 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-900 p-2 rounded-full shadow transition-colors"
        >
          <Heart
            className={`h-4 w-4 ${
              wished ? 'fill-[#8B1538] text-[#8B1538]' : 'text-gray-600 dark:text-gray-300'
            }`}
          />
        </button>
      </div>

      {/* ── Info area ── */}
      <div className="p-3 sm:p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem] dark:text-white leading-snug">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-base sm:text-lg font-bold text-[#8B1538]">
            {product.price != null ? `₦${product.price.toLocaleString()}` : 'Price unavailable'}
          </span>
          {product.originalPrice != null && (
            <span className="text-xs text-gray-400 line-through">
              ₦{product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>

        {/* Stars */}
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${
                i < Math.floor(product.rating ?? 0)
                  ? 'fill-[#3D9B8E] text-[#3D9B8E]'
                  : 'fill-gray-200 text-gray-200 dark:fill-gray-600 dark:text-gray-600'
              }`}
            />
          ))}
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-0.5">
            ({product.reviews ?? 0})
          </span>
        </div>

        {/* Add to Cart — stopPropagation prevents Link navigation */}
        <Button
          onClick={handleAddToCart}
          className="w-full bg-[#8B1538] hover:bg-[#6B0F2A] mt-auto text-xs sm:text-sm h-9"
          size="sm"
          disabled={!product.inStock || product.price == null}
        >
          <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
          {product.inStock ? 'Add to Cart' : 'Out of Stock'}
        </Button>
      </div>
    </Link>
  );
}