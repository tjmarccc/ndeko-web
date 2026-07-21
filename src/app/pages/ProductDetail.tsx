import { useParams, useNavigate } from 'react-router';
import {
  Heart, Share2, ArrowLeft, Loader2, AlertCircle,
  ShoppingCart, Star, ChevronLeft, ChevronRight, MapPin, Package, Truck
} from 'lucide-react';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { useCart } from '../contexts/CartContext';
import { fetchProductById, mapApiProduct, type ApiProduct } from '../services/api';
import type { Product } from '../types/product';
import { toast } from 'sonner';

interface QuantityControlProps {
  quantity: number;
  maxQuantity: number;
  onQuantityChange: (qty: number) => void;
}

// ─── QUANTITY CONTROL ─────────────────────────────────────────────────────────
function QuantityControl({ quantity, maxQuantity, onQuantityChange }: QuantityControlProps) {
  const [inputValue, setInputValue] = useState<string>(quantity.toString());
  const [holdTimeout, setHoldTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (value: number) => {
    const clamped = Math.max(1, Math.min(value, maxQuantity));
    onQuantityChange(clamped);
    setInputValue(clamped.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 0) {
      handleChange(num);
    }
  };

  const handleMouseDown = (direction: 'up' | 'down') => {
    const increment = direction === 'up' ? 1 : -1;
    let currentQty = quantity;

    const interval = setInterval(() => {
      currentQty += increment;
      if (currentQty < 1) currentQty = 1;
      if (currentQty > maxQuantity) currentQty = maxQuantity;
      handleChange(currentQty);
    }, 100);

    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 2000);

    setHoldTimeout(timeout);
  };

  const handleMouseUp = () => {
    if (holdTimeout) {
      clearTimeout(holdTimeout);
      setHoldTimeout(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
        <button
          onMouseDown={() => handleMouseDown('down')}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          disabled={quantity <= 1}
          className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
          aria-label="Decrease quantity"
        >
          −
        </button>
        <input
          type="number"
          min="1"
          max={maxQuantity}
          value={inputValue}
          onChange={handleInputChange}
          className="w-12 text-center font-bold py-2 border-0 dark:bg-gray-800 dark:text-white"
        />
        <button
          onMouseDown={() => handleMouseDown('up')}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          disabled={quantity >= maxQuantity}
          className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
      {maxQuantity < 10 && (
        <span className="text-xs text-amber-600 dark:text-amber-400">
          Only {maxQuantity} left
        </span>
      )}
    </div>
  );
}

// ─── IMAGE CAROUSEL ───────────────────────────────────────────────────────────
interface ImageCarouselProps {
  images: string[];
  productName: string;
}

function ImageCarousel({ images, productName }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const displayImages = images.length > 0 ? images : ['https://via.placeholder.com/500?text=No+Image'];

  const nextImage = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % displayImages.length);
  }, [displayImages.length]);

  const prevImage = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  }, [displayImages.length]);

  return (
    <div className="space-y-4">
      {/* Main image */}
      <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden group">
        <img
          src={displayImages[currentIndex]}
          alt={`${productName} - Image ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />

        {/* Navigation buttons */}
        {displayImages.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-black/60 hover:bg-white dark:hover:bg-black p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-black/60 hover:bg-white dark:hover:bg-black p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Image counter */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
            {currentIndex + 1} / {displayImages.length}
          </div>
        )}
      </div>

      {/* Thumbnail dots */}
      {displayImages.length > 1 && (
        <div className="flex justify-center gap-2">
          {displayImages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex
                  ? 'bg-[#8B1538] w-6'
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
              }`}
              aria-label={`Go to image ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PRODUCT DETAIL PAGE ──────────────────────────────────────────────────────
export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  // Fetch product
  useEffect(() => {
    const loadProduct = async () => {
      if (!id) {
        setError('Product not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const apiProduct = await fetchProductById(id);
        const mapped = mapApiProduct(apiProduct as ApiProduct);
        setProduct(mapped);
        setError(null);

        // Set default location if available
        if ((apiProduct as ApiProduct).location_stock?.[0]) {
          setSelectedLocation((apiProduct as ApiProduct).location_stock![0].location_id);
        }
      } catch (err) {
        setError('Failed to load product. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const maxQuantity = useMemo(() => {
    if (!product) return 0;
    const stock = product.inStock;
    return typeof stock === 'number' ? stock : 0;
  }, [product]);

  const handleAddToCart = async () => {
    if (!product || quantity < 1) return;

    try {
      setIsAdding(true);
      // Add to cart multiple times based on selected quantity
      for (let i = 0; i < quantity; i++) {
        addToCart(product, selectedLocation ? { locationId: selectedLocation } : undefined);
      }
      toast.success(`${product.name} added to cart`);
      setQuantity(1);
    } catch (err) {
      toast.error('Failed to add to cart');
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleShare = async () => {
    if (!product) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} on Ndeko Express`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      // Fallback: copy to clipboard
      const url = window.location.href;
      navigator.clipboard.writeText(url);
      toast.success('Product link copied to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#8B1538]" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <Card className="p-8 max-w-md w-full dark:bg-gray-800">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 shrink-0 mt-1" />
            <div>
              <h2 className="font-bold text-lg mb-2 dark:text-white">Error</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error || 'Product not found'}</p>
              <Button
                onClick={() => navigate('/products')}
                className="bg-[#8B1538] hover:bg-[#6B0F2A]"
              >
                Back to Products
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const images = product.image ? [product.image] : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-6xl">

        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/products')}
          className="mb-4 -ml-2 text-gray-600 dark:text-gray-400"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Main content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">

          {/* Images */}
          <div>
            <ImageCarousel images={images} productName={product.name} />
          </div>

          {/* Product info */}
          <div>
            {/* Header */}
            <div className="mb-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold dark:text-white mb-2">
                    {product.name}
                  </h1>
                  {product.brand && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                      Brand: <span className="font-medium">{product.brand}</span>
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsFavorited(!isFavorited)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Add to favorites"
                  >
                    <Heart
                      className={`h-6 w-6 ${
                        isFavorited
                          ? 'fill-red-600 text-red-600'
                          : 'text-gray-400 dark:text-gray-600'
                      }`}
                    />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Share product"
                  >
                    <Share2 className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Rating */}
              {product.rating && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.round(product.rating!)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    ({product.rating.toFixed(1)})
                  </span>
                </div>
              )}
            </div>

            {/* Price */}
            <Card className="p-4 mb-6 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-3xl font-bold text-[#8B1538]">
                  ₦{product.price.toLocaleString()}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-lg text-gray-400 line-through">
                    ₦{product.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>
              {product.discount && (
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  Save {product.discount}% on this item
                </p>
              )}
            </Card>

            {/* Stock status */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-blue-900 dark:text-blue-300">Stock Information</span>
              </div>
              <p className={`text-sm ${
                maxQuantity > 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {maxQuantity > 0 ? `${maxQuantity} items available` : 'Out of stock'}
              </p>
            </div>

            {/* Location selection (if available) */}
            {/* This section would show location-based stock if your API provides location_stock */}

            {/* Quantity + Add to cart */}
            {maxQuantity > 0 ? (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                    Quantity
                  </label>
                  <QuantityControl
                    quantity={quantity}
                    maxQuantity={maxQuantity}
                    onQuantityChange={setQuantity}
                  />
                </div>

                <Button
                  onClick={handleAddToCart}
                  disabled={isAdding || quantity < 1}
                  className="w-full bg-[#8B1538] hover:bg-[#6B0F2A] h-12 font-bold text-base"
                >
                  {isAdding ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Adding…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Add to Cart
                    </span>
                  )}
                </Button>
              </div>
            ) : (
              <Button disabled className="w-full mb-6 opacity-50">
                Out of Stock
              </Button>
            )}

            {/* Description */}
            {product.description && (
              <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="font-bold mb-3 dark:text-white">About this product</h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  {product.description}
                </p>
              </Card>
            )}

            {/* Delivery info */}
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium dark:text-white">Free Delivery</p>
                  <p className="text-gray-600 dark:text-gray-400">On orders over ₦20,000</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium dark:text-white">Delivery Across Nigeria</p>
                  <p className="text-gray-600 dark:text-gray-400">Fast & reliable shipping</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}