import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft, Loader2, AlertCircle, ShieldCheck, Truck,
  MapPin, Package,
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';

interface FormData {
  recipient_name: string;
  recipient_phone: string;
  recipient_email: string;
  delivery_address: string;
  city: string;
  state: string;
  postal_code: string;
  promo_code: string;
}

interface FormErrors {
  [key: string]: string;
}

// ─── CHECKOUT PAGE ────────────────────────────────────────────────────────────
export function Checkout() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { cart, cartTotal } = useCart();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    recipient_name: user?.name || '',
    recipient_phone: user?.phone || '',
    recipient_email: user?.email || '',
    delivery_address: '',
    city: '',
    state: '',
    postal_code: '',
    promo_code: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);
  const [stockErrors, setStockErrors] = useState<string[]>([]);

  // Use refs to track mounted state for auth redirect
  const isMountedRef = useRef(true);
  const hasRedirectedRef = useRef(false);

  // Auth check - redirect if not logged in (only once, on first render)
  useEffect(() => {
    if (!token && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      navigate(`/login?redirect=${encodeURIComponent('/checkout')}`, { replace: true });
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [token, navigate]);

  // If not authenticated, don't render anything (redirect will happen)
  if (!token) {
    return null;
  }

  // If no cart items, show empty state
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center w-full max-w-sm">
          <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h1 className="text-2xl font-bold mb-2 dark:text-white">Your cart is empty</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Add items to your cart before proceeding to checkout
          </p>
          <Button
            onClick={() => navigate('/products')}
            className="bg-[#8B1538] hover:bg-[#6B0F2A]"
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.recipient_name.trim()) {
      newErrors.recipient_name = 'Name is required';
    }
    if (!formData.recipient_phone.trim()) {
      newErrors.recipient_phone = 'Phone number is required';
    } else if (!/^[\d\s\-+()]+$/.test(formData.recipient_phone)) {
      newErrors.recipient_phone = 'Invalid phone number';
    }
    if (!formData.recipient_email.trim()) {
      newErrors.recipient_email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.recipient_email)) {
      newErrors.recipient_email = 'Invalid email address';
    }
    if (!formData.delivery_address.trim()) {
      newErrors.delivery_address = 'Delivery address is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!formData.postal_code.trim()) {
      newErrors.postal_code = 'Postal code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change - with proper focus management
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);

  // Apply promo code
  const handleApplyPromo = useCallback(() => {
    const code = formData.promo_code.trim().toUpperCase();

    if (!code) {
      toast.error('Please enter a promo code');
      return;
    }

    // Simple promo code validation (replace with actual API call)
    const validPromos: { [key: string]: number } = {
      'SAVE10': 10,
      'SAVE20': 20,
      'NEWUSER': 15,
    };

    if (validPromos[code]) {
      setAppliedPromo({ code, discount: validPromos[code] });
      toast.success(`Promo code ${code} applied! ${validPromos[code]}% discount`);
    } else {
      toast.error('Invalid promo code');
    }
  }, [formData.promo_code]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill in all required fields correctly');
      return;
    }

    setIsSubmitting(true);
    setStockErrors([]);

    try {
      // Simulate API call - replace with actual checkout API
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Here you would call your payment API
      // const response = await initiateCheckout(formData, cart);

      toast.success('Order placed successfully!');
      
      // Clear cart and redirect to order confirmation
      if (isMountedRef.current) {
        setTimeout(() => {
          navigate('/order-confirmation');
        }, 1500);
      }
    } catch (err: unknown) {
      if (isMountedRef.current) {
        const errorMsg = err instanceof Error ? err.message : 'Checkout failed';
        
        // Check if it's a stock error
        if (errorMsg.includes('stock')) {
          const items = errorMsg.match(/\[(.*?)\]/g) || [];
          setStockErrors(items);
          toast.error('Some items are no longer in stock');
        } else {
          toast.error(errorMsg);
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  }, [navigate]);

  // Calculate totals
  const subtotal = cartTotal;
  const shippingFee = subtotal >= 20000 ? 0 : 2000;
  const promoDiscount = appliedPromo ? Math.round((subtotal * appliedPromo.discount) / 100) : 0;
  const total = subtotal + shippingFee - promoDiscount;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-6xl">

        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/cart')}
          className="mb-6 -ml-2 text-gray-600 dark:text-gray-400"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cart
        </Button>

        {/* Header */}
        <h1 className="text-3xl font-bold mb-2 dark:text-white">Checkout</h1>

        {/* Progress indicator */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#8B1538] text-white flex items-center justify-center font-bold text-sm">
              1
            </div>
            <span className="text-sm font-medium dark:text-gray-300">Shipping</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-300 dark:bg-gray-600" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Payment</span>
          </div>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

          {/* Form section */}
          <div className="lg:col-span-2">

            {/* Delivery information */}
            <Card className="p-6 mb-6 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-6">
                <MapPin className="h-5 w-5 text-[#8B1538]" />
                <h2 className="text-xl font-bold dark:text-white">Delivery Information</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Recipient name */}
                <div>
                  <label htmlFor="recipient_name" className="block text-sm font-medium mb-2 dark:text-gray-300">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="recipient_name"
                    name="recipient_name"
                    value={formData.recipient_name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-[#8B1538] focus:border-transparent ${
                      errors.recipient_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="John Doe"
                  />
                  {errors.recipient_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.recipient_name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="recipient_email" className="block text-sm font-medium mb-2 dark:text-gray-300">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="recipient_email"
                    name="recipient_email"
                    value={formData.recipient_email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-[#8B1538] focus:border-transparent ${
                      errors.recipient_email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="john@example.com"
                  />
                  {errors.recipient_email && (
                    <p className="text-red-500 text-sm mt-1">{errors.recipient_email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="recipient_phone" className="block text-sm font-medium mb-2 dark:text-gray-300">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="recipient_phone"
                    name="recipient_phone"
                    value={formData.recipient_phone}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-[#8B1538] focus:border-transparent ${
                      errors.recipient_phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="+234 802 123 4567"
                  />
                  {errors.recipient_phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.recipient_phone}</p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label htmlFor="delivery_address" className="block text-sm font-medium mb-2 dark:text-gray-300">
                    Street Address *
                  </label>
                  <textarea
                    id="delivery_address"
                    name="delivery_address"
                    value={formData.delivery_address}
                    onChange={handleInputChange}
                    rows={3}
                    className={`w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-[#8B1538] focus:border-transparent resize-none ${
                      errors.delivery_address ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your full delivery address"
                  />
                  {errors.delivery_address && (
                    <p className="text-red-500 text-sm mt-1">{errors.delivery_address}</p>
                  )}
                </div>

                {/* City, State, Postal Code */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium mb-2 dark:text-gray-300">
                      City *
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-[#8B1538] focus:border-transparent ${
                        errors.city ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Lagos"
                    />
                    {errors.city && (
                      <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium mb-2 dark:text-gray-300">
                      State *
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-[#8B1538] focus:border-transparent ${
                        errors.state ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Lagos"
                    />
                    {errors.state && (
                      <p className="text-red-500 text-sm mt-1">{errors.state}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="postal_code" className="block text-sm font-medium mb-2 dark:text-gray-300">
                      Postal Code *
                    </label>
                    <input
                      type="text"
                      id="postal_code"
                      name="postal_code"
                      value={formData.postal_code}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-[#8B1538] focus:border-transparent ${
                        errors.postal_code ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="100001"
                    />
                    {errors.postal_code && (
                      <p className="text-red-500 text-sm mt-1">{errors.postal_code}</p>
                    )}
                  </div>
                </div>

                {/* Stock errors */}
                {stockErrors.length > 0 && (
                  <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <div className="flex gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-red-800 dark:text-red-300 mb-2">Stock issues:</p>
                        <ul className="text-red-700 dark:text-red-400 text-sm space-y-1">
                          {stockErrors.map((error, idx) => (
                            <li key={idx}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Promo code */}
                <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <label htmlFor="promo_code" className="block text-sm font-medium mb-2 dark:text-gray-300">
                    Promo Code (Optional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="promo_code"
                      name="promo_code"
                      value={formData.promo_code}
                      onChange={handleInputChange}
                      className="flex-1 px-4 py-2 rounded-lg border border-blue-300 dark:bg-gray-700 dark:text-white dark:border-blue-600 focus:ring-2 focus:ring-[#8B1538]"
                      placeholder="Enter promo code"
                    />
                    <Button
                      type="button"
                      onClick={handleApplyPromo}
                      variant="outline"
                      className="border-[#8B1538] text-[#8B1538]"
                    >
                      Apply
                    </Button>
                  </div>
                </Card>

                {/* Submit button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#8B1538] hover:bg-[#6B0F2A] h-12 font-bold text-base"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing…
                    </span>
                  ) : (
                    'Continue to Payment'
                  )}
                </Button>
              </form>
            </Card>
          </div>

          {/* Order summary sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 dark:bg-gray-800 dark:border-gray-700 sticky top-6">
              <h2 className="text-xl font-bold mb-4 dark:text-white">Order Summary</h2>

              {/* Items */}
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {item.name} <span className="font-medium">x{item.quantity}</span>
                    </span>
                    <span className="font-medium dark:text-white">
                      ₦{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 border-t dark:border-gray-600 pt-4 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="dark:text-white">₦{subtotal.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                  <span className={`${shippingFee === 0 ? 'text-green-600 dark:text-green-400' : 'dark:text-white'}`}>
                    {shippingFee === 0 ? 'FREE' : `₦${shippingFee.toLocaleString()}`}
                  </span>
                </div>

                {appliedPromo && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Discount ({appliedPromo.code})</span>
                    <span className="text-green-600 dark:text-green-400">−₦{promoDiscount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-base font-bold pt-2 border-t dark:border-gray-600">
                  <span className="dark:text-white">Total</span>
                  <span className="text-[#8B1538]">₦{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Trust badges */}
              <div className="space-y-3 pt-4 border-t dark:border-gray-600">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Secure checkout with SSL encryption
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Truck className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Fast delivery across Nigeria
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}