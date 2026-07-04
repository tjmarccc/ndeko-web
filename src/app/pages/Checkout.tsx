import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import {
  Lock, Truck, CreditCard, Wallet, ArrowLeft, AlertCircle, Loader2, CheckCircle2, Shield,
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

interface ShippingForm {
  recipient_name: string;
  recipient_phone: string;
  street: string;
  city: string;
  state: string;
}

type PaymentMethod = 'card' | 'bank_transfer' | 'pay_on_delivery';

export function Checkout() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [shipping, setShipping] = useState<ShippingForm>({
    recipient_name: user?.first_name ? `${user.first_name} ${user.last_name}` : '',
    recipient_phone: user?.phone || '',
    street: '',
    city: '',
    state: '',
  });

  const [addresses, setAddresses] = useState<api.ApiAddress[]>([]);
  const [payment, setPayment] = useState<PaymentMethod>('card');
  const [promo, setPromo] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<ShippingForm>>({});
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  const VALID_PROMOS: Record<string, number> = {
    WELCOME10: 0.10,
    NDEKO20: 0.20,
    SAVE5: 0.05,
  };

  const promoKey = promo.trim().toUpperCase();
  const discount = promoApplied && VALID_PROMOS[promoKey]
    ? Math.round(cartTotal * VALID_PROMOS[promoKey])
    : 0;
  const shippingFee = cartTotal >= 20000 ? 0 : 2000;
  const total = cartTotal + shippingFee - discount;

  // Load saved addresses
  useEffect(() => {
    if (!token) {
      navigate(`/login?redirect=${encodeURIComponent('/checkout')}`);
      return;
    }

    const loadAddresses = async () => {
      try {
        setLoadingAddresses(true);
        const response = await api.getMyAddresses();
        setAddresses(response || []);

        // Pre-fill with default address
        const defaultAddr = response?.find((a) => a.is_default);
        if (defaultAddr) {
          setShipping({
            recipient_name: defaultAddr.recipient_name || '',
            recipient_phone: defaultAddr.recipient_phone || '',
            street: defaultAddr.street,
            city: defaultAddr.city,
            state: defaultAddr.state || '',
          });
        }
      } catch (err) {
        console.error('Failed to load addresses:', err);
      } finally {
        setLoadingAddresses(false);
      }
    };

    loadAddresses();
  }, [token, navigate]);

  const validateForm = (): boolean => {
    const errs: Partial<ShippingForm> = {};
    if (!shipping.recipient_name.trim()) errs.recipient_name = 'Full name is required';
    if (!shipping.recipient_phone.trim()) errs.recipient_phone = 'Phone number is required';
    if (!shipping.street.trim()) errs.street = 'Address is required';
    if (!shipping.city.trim()) errs.city = 'City is required';
    if (!shipping.state.trim()) errs.state = 'State is required';

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleApplyPromo = () => {
    if (VALID_PROMOS[promoKey]) {
      setPromoApplied(true);
      setError(null);
      toast.success(`Promo code ${promoKey} applied!`);
    } else {
      setError('Invalid promo code. Try WELCOME10, NDEKO20, or SAVE5.');
      setPromoApplied(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token || !user) {
      navigate(`/login?redirect=${encodeURIComponent('/checkout')}`);
      return;
    }

    if (!validateForm()) {
      setError('Please fill in all required fields');
      return;
    }

    if (cart.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    const missingLocation = cart.find((item) => !item.locationId);
    if (missingLocation) {
      setError(`"${missingLocation.name}" doesn't have a pickup location set — remove it and re-add it from the product page.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      const body: api.CheckoutBody = {
        items: cart.map((item) => ({
          product_id: item.id,
          location_id: item.locationId!,
          quantity: item.quantity,
        })),
        delivery_address: {
          label: 'home',
          recipient_name: shipping.recipient_name.trim(),
          recipient_phone: shipping.recipient_phone.trim(),
          street: shipping.street.trim(),
          city: shipping.city.trim(),
          state: shipping.state.trim(),
          country: 'Nigeria',
        },
        payment_method: payment,
        ...(promoApplied && promoKey ? { promo_code: promoKey } : {}),
      };

      const orders = await api.checkout(body);
      clearCart();

      // Multi-store carts return one order per store; redirect to the first
      // order that needs payment (card/bank_transfer). pay_on_delivery orders
      // have no payment_url and are already "processing".
      const orderNeedingPayment = orders.find((o) => o.payment_url);
      if (orderNeedingPayment?.payment_url) {
        window.location.href = orderNeedingPayment.payment_url;
        return;
      }

      const firstOrder = orders[0];
      navigate(
        `/order-confirmation?id=${firstOrder?.id ?? ''}`,
        { state: { orders } }
      );
    } catch (err) {
      if (err instanceof api.ApiError && (err.body as any)?.code === 'INSUFFICIENT_STOCK') {
        const items = (err.body as any)?.details?.items as { productId: string; requested: number; available: number }[] | undefined;
        const names = items?.map((i) => {
          const match = cart.find((c) => c.id === i.productId);
          return `${match?.name ?? 'An item'} (only ${i.available} left, ${i.requested} requested)`;
        });
        setError(names?.length ? `Not enough stock: ${names.join('; ')}` : 'One or more items no longer have enough stock.');
      } else {
        const msg = err instanceof Error ? err.message : 'Checkout failed. Please try again.';
        setError(msg);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center max-w-xs w-full">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <CreditCard className="h-9 w-9 text-gray-400" />
          </div>
          <h1 className="text-xl font-bold mb-2 dark:text-white">Nothing to checkout</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            Add items to your cart before checking out.
          </p>
          <Button asChild className="bg-[#8B1538] hover:bg-[#6B0F2A] w-full">
            <Link to="/products">Browse Products</Link>
          </Button>
        </div>
      </div>
    );
  }

  const Field = ({
    id,
    label,
    value,
    onChange,
    placeholder,
    type = 'text',
    error: fe,
  }: {
    id: keyof ShippingForm;
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
    error?: string;
  }) => (
    <div>
      <Label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
        {label}<span className="text-red-500 ml-0.5">*</span>
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          if (fieldErrors[id]) setFieldErrors((prev) => ({ ...prev, [id]: undefined }));
        }}
        placeholder={placeholder}
        className={`h-11 ${fe ? 'border-red-400 focus:ring-red-300' : ''}`}
      />
      {fe && <p className="text-red-500 text-xs mt-1">{fe}</p>}
    </div>
  );

  const PaymentOption = ({
    value,
    icon: Icon,
    label,
    sublabel,
  }: {
    value: PaymentMethod;
    icon: React.ElementType;
    label: string;
    sublabel: string;
  }) => (
    <label
      className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all ${
        payment === value
          ? 'border-[#8B1538] bg-[#8B1538]/5 dark:bg-[#8B1538]/10'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <input
        type="radio"
        name="payment"
        value={value}
        checked={payment === value}
        onChange={() => setPayment(value)}
        className="sr-only"
      />
      <div
        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
          payment === value ? 'border-[#8B1538]' : 'border-gray-300 dark:border-gray-600'
        }`}
      >
        {payment === value && <div className="w-2 h-2 rounded-full bg-[#8B1538]" />}
      </div>
      <Icon className={`h-4 w-4 shrink-0 ${payment === value ? 'text-[#8B1538]' : 'text-gray-400'}`} />
      <div className="min-w-0">
        <p
          className={`text-sm font-semibold ${
            payment === value ? 'text-[#8B1538] dark:text-[#D4828F]' : 'text-gray-800 dark:text-gray-200'
          }`}
        >
          {label}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{sublabel}</p>
      </div>
    </label>
  );

  const steps = ['Cart', 'Checkout', 'Confirmation'];
  const currentStep = 1;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 max-w-6xl">
        {/* Back button */}
        <div className="mb-4 sm:mb-6">
          <Button
            variant="ghost"
            asChild
            className="-ml-2 mb-3 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
          >
            <Link to="/cart">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Cart
            </Link>
          </Button>

          {/* Progress bar */}
          <div className="flex items-center gap-0">
            {steps.map((step, i) => (
              <div key={step} className="flex items-center">
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      i < currentStep
                        ? 'bg-green-500 text-white'
                        : i === currentStep
                        ? 'bg-[#8B1538] text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                    }`}
                  >
                    {i < currentStep ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  <span
                    className={`text-xs font-medium hidden sm:inline ${
                      i === currentStep ? 'text-[#8B1538] dark:text-[#D4828F]' : 'text-gray-400'
                    }`}
                  >
                    {step}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`h-px w-8 sm:w-16 mx-1 sm:mx-2 ${
                      i < currentStep ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold dark:text-white mb-4 sm:mb-6">Checkout</h1>

        {/* Error message */}
        {error && (
          <div className="mb-4 sm:mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-700 p-3 sm:p-4">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800 dark:text-red-300 text-sm">Order failed</p>
              <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] gap-4 sm:gap-6 lg:gap-8">
            {/* Left: Shipping + Payment */}
            <div className="space-y-4 sm:space-y-5">
              {/* Shipping address */}
              <Card className="p-4 sm:p-6 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center gap-2.5 mb-4 sm:mb-5">
                  <div className="w-8 h-8 rounded-full bg-[#8B1538]/10 dark:bg-[#8B1538]/20 flex items-center justify-center">
                    <Truck className="h-4 w-4 text-[#8B1538]" />
                  </div>
                  <div>
                    <h2 className="font-bold text-base sm:text-lg dark:text-white">Shipping Address</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Where should we deliver?</p>
                  </div>
                </div>

                {loadingAddresses ? (
                  <div className="mb-4 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-gray-500">Loading addresses...</span>
                  </div>
                ) : addresses.length > 0 ? (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {addresses.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setShipping({
                          recipient_name: a.recipient_name || '',
                          recipient_phone: a.recipient_phone || '',
                          street: a.street,
                          city: a.city,
                          state: a.state || '',
                        })}
                        className="px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors border-[#8B1538] text-[#8B1538] hover:bg-[#8B1538]/5"
                      >
                        {a.label}{a.is_default ? ' ★' : ''}
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Field
                    id="recipient_name"
                    label="Full Name"
                    placeholder="Chidi Ndeko"
                    value={shipping.recipient_name}
                    onChange={(v) => setShipping((p) => ({ ...p, recipient_name: v }))}
                    error={fieldErrors.recipient_name}
                  />
                  <Field
                    id="recipient_phone"
                    label="Phone Number"
                    placeholder="+234 801 234 5678"
                    type="tel"
                    value={shipping.recipient_phone}
                    onChange={(v) => setShipping((p) => ({ ...p, recipient_phone: v }))}
                    error={fieldErrors.recipient_phone}
                  />
                  <div className="sm:col-span-2">
                    <Field
                      id="street"
                      label="Street Address"
                      placeholder="12 Adeola Odeku Street"
                      value={shipping.street}
                      onChange={(v) => setShipping((p) => ({ ...p, street: v }))}
                      error={fieldErrors.street}
                    />
                  </div>
                  <Field
                    id="city"
                    label="City"
                    placeholder="Lagos"
                    value={shipping.city}
                    onChange={(v) => setShipping((p) => ({ ...p, city: v }))}
                    error={fieldErrors.city}
                  />
                  <Field
                    id="state"
                    label="State"
                    placeholder="Lagos"
                    value={shipping.state}
                    onChange={(v) => setShipping((p) => ({ ...p, state: v }))}
                    error={fieldErrors.state}
                  />
                </div>
              </Card>

              {/* Payment method */}
              <Card className="p-4 sm:p-6 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center gap-2.5 mb-4 sm:mb-5">
                  <div className="w-8 h-8 rounded-full bg-teal-500/10 dark:bg-teal-500/20 flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <h2 className="font-bold text-base sm:text-lg dark:text-white">Payment Method</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Powered by Paystack — 100% secure</p>
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <PaymentOption
                    value="card"
                    icon={CreditCard}
                    label="Credit / Debit Card"
                    sublabel="Visa, Mastercard, Verve — via Paystack"
                  />
                  <PaymentOption
                    value="bank_transfer"
                    icon={Wallet}
                    label="Bank Transfer (USSD)"
                    sublabel="Pay via internet banking or USSD"
                  />
                  <PaymentOption
                    value="pay_on_delivery"
                    icon={Shield}
                    label="Pay on Delivery"
                    sublabel="Cash or POS on delivery"
                  />
                </div>

                {payment === 'card' && (
                  <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
                    <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      You'll be redirected to Paystack's secure page to enter your card details. We never store card information.
                    </p>
                  </div>
                )}
              </Card>
            </div>

            {/* Right: Order Summary */}
            <div>
              <div className="lg:sticky lg:top-6">
                <Card className="p-4 sm:p-6 dark:bg-gray-800 dark:border-gray-700">
                  <h2 className="font-bold text-lg sm:text-xl dark:text-white mb-4">Order Summary</h2>

                  {/* Items list */}
                  <div className="space-y-3 mb-4 max-h-48 sm:max-h-56 overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-start gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-lg shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium dark:text-white line-clamp-1">{item.name}</p>
                          <p className="text-xs text-gray-400">
                            Qty: {item.quantity}
                            {item.locationLabel ? ` · from ${item.locationLabel}` : ''}
                          </p>
                          {!item.locationId && (
                            <p className="text-xs text-red-500">No pickup location set</p>
                          )}
                        </div>
                        <p className="text-sm font-bold text-[#8B1538] shrink-0">
                          ₦{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Promo code */}
                  <div className="mb-4">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                      Promo Code
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g. WELCOME10"
                        value={promo}
                        onChange={(e) => {
                          setPromo(e.target.value);
                          setPromoApplied(false);
                        }}
                        className="h-10 uppercase text-sm"
                        disabled={promoApplied}
                      />
                      <Button
                        type="button"
                        onClick={handleApplyPromo}
                        disabled={!promo.trim() || promoApplied}
                        variant="outline"
                        className="h-10 shrink-0 text-sm border-[#8B1538] text-[#8B1538] hover:bg-[#8B1538]/5"
                      >
                        {promoApplied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : 'Apply'}
                      </Button>
                    </div>
                    {promoApplied && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        ✅ {promoKey} applied — {Math.round((VALID_PROMOS[promoKey] ?? 0) * 100)}% off!
                      </p>
                    )}
                  </div>

                  {/* Price breakdown */}
                  <div className="space-y-2.5 border-t dark:border-gray-700 pt-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Subtotal ({cart.reduce((n, i) => n + i.quantity, 0)} items)
                      </span>
                      <span className="font-medium dark:text-white">₦{cartTotal.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                      <span className={`font-medium ${shippingFee === 0 ? 'text-green-600 dark:text-green-400' : 'dark:text-white'}`}>
                        {shippingFee === 0 ? 'FREE' : `₦${shippingFee.toLocaleString()}`}
                      </span>
                    </div>

                    {cartTotal > 0 && cartTotal < 20000 && (
                      <p className="text-xs text-teal-600 dark:text-teal-400">
                        Add ₦{(20000 - cartTotal).toLocaleString()} more for free shipping
                      </p>
                    )}

                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                        <span>Promo ({promoKey})</span>
                        <span>−₦{discount.toLocaleString()}</span>
                      </div>
                    )}

                    <div className="flex justify-between font-bold text-base sm:text-lg border-t dark:border-gray-700 pt-2.5">
                      <span className="dark:text-white">Total</span>
                      <span className="text-[#8B1538]">₦{total.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Place order button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting || cart.length === 0}
                    className="w-full bg-[#8B1538] hover:bg-[#6B0F2A] h-12 sm:h-13 text-sm sm:text-base font-bold disabled:opacity-60 transition-all"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Placing order…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Place Order · ₦{total.toLocaleString()}
                      </span>
                    )}
                  </Button>

                  {/* Trust badges */}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {[
                      { icon: Shield, text: 'Secure checkout' },
                      { icon: Lock, text: 'SSL encrypted' },
                      { icon: Truck, text: 'Fast delivery' },
                      { icon: CheckCircle2, text: 'Easy returns' },
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <Icon className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                        {text}
                      </div>
                    ))}
                  </div>

                  <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3">
                    By placing your order you agree to our{' '}
                    <Link to="/help" className="underline hover:text-[#8B1538]">
                      Terms
                    </Link>
                    {' & '}
                    <Link to="/contact" className="underline hover:text-[#8B1538]">
                      Privacy Policy
                    </Link>
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Checkout;