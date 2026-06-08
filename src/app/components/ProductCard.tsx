import { Link } from 'react-router';
import { ShoppingCart, Star, Heart } from 'lucide-react';
import { Product } from '../types/product';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const wished = isInWishlist(product.id);

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

  return (
    <Link
      to={`/product/${product.id}`}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group border border-gray-100 dark:border-gray-700"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.discount && (
          <Badge className="absolute top-2 left-2 bg-[#D4828F] hover:bg-[#8B1538] text-white">
            -{product.discount}%
          </Badge>
        )}
        <button
          onClick={handleWishlist}
          aria-label="Toggle wishlist"
          className="absolute top-2 right-2 bg-white/90 dark:bg-gray-900/80 hover:bg-white p-2 rounded-full shadow"
        >
          <Heart
            className={`h-4 w-4 ${
              wished ? 'fill-[#8B1538] text-[#8B1538]' : 'text-gray-600 dark:text-gray-300'
            }`}
          />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-2">
        <h3 className="font-semibold line-clamp-2 min-h-[3rem] dark:text-white">{product.name}</h3>

        <div className="flex items-center gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-[#8B1538]">
              {product.price != null
                ? `₦${product.price.toLocaleString()}`
                : 'Price unavailable'}
            </span>
            {product.originalPrice != null && (
              <span className="text-sm text-gray-500 line-through">
                ₦{product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < Math.floor(product.rating ?? 0)
                  ? 'fill-[#3D9B8E] text-[#3D9B8E]'
                  : 'fill-gray-200 text-gray-200 dark:fill-gray-600 dark:text-gray-600'
              }`}
            />
          ))}
          <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
            ({product.reviews ?? 0})
          </span>
        </div>

        <Button
          onClick={handleAddToCart}
          className="w-full bg-[#8B1538] hover:bg-[#6B0F2A]"
          size="sm"
          disabled={product.price == null}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </Button>
      </div>
    </Link>
  );
}