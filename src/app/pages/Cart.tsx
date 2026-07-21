import { Link, useNavigate } from 'react-router';
import {
  Trash2, ShoppingBag, ArrowLeft,
  AlertCircle, Loader2, Shield, Truck,
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { useState, useEffect, useCallback } from 'react';
import { fetchProductById, type ApiProduct } from '../services/api';
import { toast } from 'sonner';

interface StockInfo {
  productId: string;
  available: number;
  warning: boolean;
}

// ─── CART PAGE ────────────────────────────────────────────────────────────────
export function Cart() {
  const { cart, removeFromCart, updateQuantity, setCartItemLocation, cartTotal, clearCart } = useCart();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [stockInfo, setStockInfo] = useState<Map<string, StockInfo>>(new Map());
  const [removedItemNames, setRemovedItemNames] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const subtotal = cartTotal;
  const shipping = subtotal >= 20000 ? 0 : 2000;
  const total = subtotal + shipping;

  // ── Validate stock when cart loads ─────────────────────────────────────────
  const validateCartStock = useCallback(async () => {
    if (cart.length === 0) return;
    setIsValidating(true);
    try {
      const results = await Promise.allSettled(
        cart.map(item => fetchProductById(item.id))
      );
      const infoMap = new Map<string, StockInfo>();
      const itemsToRemove: string[] = [];
      const goneNames: string[] = [];

      results.forEach((result, idx) => {
        const item = cart[idx];
        if (result.status === 'fulfilled') {
          const product = result.value as ApiProduct;
          const available = product.stock_quantity ?? 0;

          // Product is completely out of stock
          if (available === 0 || product.stock_status === 'out_of_stock') {
            itemsToRemove.push(item.id);
            return;
          }

          // Check if requested quantity exceeds available stock
          const exceedsStock = item.quantity > available;
          if (exceedsStock) {
            updateQuantity(item.id, available);
            infoMap.set(item.id, { productId: item.id, available, warning: true });
          } else {
            infoMap.set(item.id, { productId: item.id, available, warning: false });
          }

          // Backfill a missing location on items added before location
          // selection existed, so they don't silently block checkout.
          if (!item.locationId) {
            const firstInStock = product.location_stock?.find(l => l.quantity > 0);
            if (firstInStock) {
              setCartItemLocation(item.id, firstInStock.location_id);
            }
          }
        } else {
          // Product no longer exists (e.g. removed, or stale cart pointing at
          // a different/reseeded backend) — drop it rather than leaving a
          // dead item that can never satisfy checkout.
          itemsToRemove.push(item.id);
          goneNames.push(item.name);
        }
      });

      itemsToRemove.forEach(id => removeFromCart(id));
      setStockInfo(infoMap);
      setRemovedItemNames(goneNames);
    } catch (err) {
      console.error('Stock validation error:', err);
    } finally {
      setIsValidating(false);
    }
  }, [cart, removeFromCart, updateQuantity, setCartItemLocation]);

  useEffect(() => {
    validateCartStock();
  }, [validateCartStock]);

  // ── Handle quantity change with validation ──────────────────────────────────
  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    const item = cart.find(i => i.id === itemId);
    if (!item) return;

    const stockData = stockInfo.get(itemId);
    const itemStock = typeof item.inStock === 'number' ? item.inStock : 0;
    const maxAvailable = stockData?.available || itemStock || 0;

    // Validate quantity
    if (newQuantity < 1) {
      removeFromCart(itemId);
      toast.success('Item removed from cart');
      return;
    }

    if (newQuantity > maxAvailable) {
      toast.error(`Only ${maxAvailable} item${maxAvailable !== 1 ? 's' : ''} available in stock`);
      return;
    }

    updateQuantity(itemId, newQuantity);
  };

  // ── Navigate to checkout ────────────────────────────────────────────────────
  const handleProceedToCheckout = () => {
    if (!token) {
      navigate(`/login?redirect=${encodeURIComponent('/checkout')}`);
      return;
    }
    navigate('/checkout');
  };

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center w-full max-w-sm">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <ShoppingBag className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mb-2 dark:text-white">
            Your cart is empty
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm sm:text-base">
            Start shopping to add items to your cart
          </p>
          <Button asChild className="bg-[#8B1538] hover:bg-[#6B0F2A] w-full sm:w-auto">
            <Link to="/products">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ── Order Summary ──────────────────────────────────────────────────────────
  const OrderSummary = ({ className = '' }: { className?: string }) => (
    <Card className={`p-4 sm:p-6 dark:bg-gray-800 dark:border-gray-700 ${className}`}>
      <h2 className="text-lg sm:text-xl font-bold mb-4 dark:text-white">Order Summary</h2>

      <div className="space-y-3 mb-6">
        {/* Subtotal */}
        <div className="flex justify-between text-sm sm:text-base">
          <span className="text-gray-600 dark:text-gray-400">
            Subtotal ({cart.reduce((n, i) => n + i.quantity, 0)} items)
          </span>
          <span className="font-semibold dark:text-white">₦{subtotal.toLocaleString()}</span>
        </div>

        {/* Shipping */}
        <div className="flex justify-between text-sm sm:text-base">
          <span className="text-gray-600 dark:text-gray-400">Shipping</span>
          <span className={`font-semibold ${shipping === 0 ? 'text-green-600 dark:text-green-400' : 'dark:text-white'}`}>
            {shipping === 0 ? 'FREE' : `₦${shipping.toLocaleString()}`}
          </span>
        </div>

        {/* Free shipping nudge */}
        {subtotal > 0 && subtotal < 20000 && (
          <div className="rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700 px-3 py-2">
            <p className="text-xs sm:text-sm text-teal-700 dark:text-teal-300">
              🚚 Add ₦{(20000 - subtotal).toLocaleString()} more for <strong>free shipping</strong>
            </p>
          </div>
        )}

        {/* Cashback nudge */}
        {subtotal >= 20000 && (
          <p className="text-xs sm:text-sm text-teal-600 dark:text-teal-400">
            🎉 You qualify for 10% cashback on this order!
          </p>
        )}

        {/* Divider + total */}
        <div className="border-t dark:border-gray-600 pt-3 flex justify-between text-base sm:text-lg">
          <span className="font-bold dark:text-white">Total</span>
          <span className="font-bold text-[#8B1538]">₦{total.toLocaleString()}</span>
        </div>
      </div>

      {/* Checkout button */}
      <Button
        onClick={handleProceedToCheckout}
        disabled={isValidating || cart.length === 0}
        className="w-full bg-[#8B1538] hover:bg-[#6B0F2A] h-11 sm:h-12 text-sm sm:text-base font-bold disabled:opacity-60"
      >
        {isValidating ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking stock…
          </span>
        ) : (
          `Proceed to Checkout · ₦${total.toLocaleString()}`
        )}
      </Button>

      {/* Trust icons */}
      <div className="mt-4 flex flex-row sm:flex-col gap-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          <Shield className="h-4 w-4 text-teal-500 shrink-0" />
          <span>Secure checkout</span>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          <Truck className="h-4 w-4 text-teal-500 shrink-0" />
          <span>Fast delivery across Nigeria</span>
        </div>
      </div>
    </Card>
  );

  // ── Main cart ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 max-w-6xl">

        {/* ── Header ── */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <Button
            variant="ghost"
            asChild
            className="mb-2 sm:mb-4 -ml-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <Link to="/products">
              <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Continue Shopping</span>
              <span className="xs:hidden inline">Back</span>
            </Link>
          </Button>

          <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold dark:text-white">
              Shopping Cart
            </h1>
            <span className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
              ({cart.length} {cart.length !== 1 ? 'items' : 'item'})
            </span>
            {isValidating && (
              <span className="inline-flex items-center text-xs text-gray-400 gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Checking stock…
              </span>
            )}
          </div>
        </div>

        {/* ── Removed items banner ── */}
        {removedItemNames.length > 0 && (
          <div className="mb-4 sm:mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-700 p-3 sm:p-4">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800 dark:text-red-300 text-xs sm:text-sm mb-0.5">
                Some items were removed
              </p>
              <p className="text-red-700 dark:text-red-400 text-xs sm:text-sm">
                {removedItemNames.join(', ')} {removedItemNames.length === 1 ? 'is' : 'are'} no longer available and {removedItemNames.length === 1 ? 'was' : 'were'} removed from your cart.
              </p>
            </div>
          </div>
        )}

        {/* ── Body: items + summary ── */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">

          {/* Cart items */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {cart.map(item => {
              const stockData = stockInfo.get(item.id);
              const itemStock = typeof item.inStock === 'number' ? item.inStock : 0;
              const maxAvailable: number = (stockData?.available) ?? itemStock;

              return (
                <Card
                  key={item.id}
                  className="p-3 sm:p-4 lg:p-5 dark:bg-gray-800 dark:border-gray-700 transition-shadow hover:shadow-md"
                >
                  <div className="flex gap-3 sm:gap-4">

                    {/* Product image */}
                    <Link to={`/product/${item.id}`} className="shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 object-cover rounded-xl"
                      />
                    </Link>

                    <div className="flex-1 min-w-0">
                      {/* Name + mobile delete */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <Link
                          to={`/product/${item.id}`}
                          className="font-semibold text-sm sm:text-base leading-snug hover:text-[#8B1538] dark:text-white dark:hover:text-[#D4828F] line-clamp-2 transition-colors"
                        >
                          {item.name}
                        </Link>
                        {/* Delete — mobile only */}
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="sm:hidden shrink-0 p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Brand */}
                      {item.brand && (
                        <p className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm mb-2">
                          {item.brand}
                        </p>
                      )}

                      {/* Stock warning */}
                      {stockData?.warning && (
                        <p className="text-amber-600 dark:text-amber-400 text-xs mb-2 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Only {maxAvailable} left — quantity adjusted to match available stock.
                        </p>
                      )}

                      {/* Stock availability */}
                      <p className={`text-xs mb-2 font-medium ${
                        maxAvailable === 0 
                          ? 'text-red-600 dark:text-red-400' 
                          : maxAvailable < 5 
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}>
                        {maxAvailable === 0 ? '❌ Out of stock' : maxAvailable < 5 ? `⚠️ ${maxAvailable} left` : `✓ ${maxAvailable} in stock`}
                      </p>

                      {/* Quantity stepper + price + desktop delete */}
                      <div className="flex items-center justify-between gap-2 flex-wrap mt-2">

                        {/* Stepper */}
                        <div className="flex items-center border dark:border-gray-600 rounded-xl overflow-hidden h-8 sm:h-9">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="h-full px-3 text-lg font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-40"
                            aria-label="Decrease quantity"
                            disabled={item.quantity <= 1}
                          >
                            −
                          </button>
                          <span className="px-3 font-bold text-sm sm:text-base dark:text-white min-w-[2rem] text-center tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="h-full px-3 text-lg font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-40"
                            aria-label="Increase quantity"
                            disabled={item.quantity >= maxAvailable}
                          >
                            +
                          </button>
                        </div>

                        {/* Price + desktop delete */}
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="text-right">
                            <span className="font-bold text-base sm:text-lg text-[#8B1538]">
                              ₦{(item.price * item.quantity).toLocaleString()}
                            </span>
                            {item.quantity > 1 && (
                              <p className="text-xs text-gray-400">
                                ₦{item.price.toLocaleString()} each
                              </p>
                            )}
                          </div>
                          {/* Delete — desktop only */}
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="hidden sm:flex items-center justify-center h-8 w-8 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* Clear cart */}
            <button
              onClick={clearCart}
              className="w-full py-2.5 sm:py-3 rounded-xl border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium transition-colors"
            >
              Clear Cart
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            {/* Mobile: inline after items */}
            <OrderSummary className="lg:hidden" />
            {/* Desktop: sticky sidebar */}
            <div className="hidden lg:block sticky top-6">
              <OrderSummary />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}