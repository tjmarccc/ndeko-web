import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Product, CartItem } from '../types/product';

// ── All methods are declared in the interface ─────────────────────────────────
interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, location?: { locationId: string; locationLabel?: string }) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  // Backfills a location onto an existing cart line (e.g. items added before
  // location selection existed) without touching quantity.
  setCartItemLocation: (productId: string, locationId: string, locationLabel?: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('ndeko_cart');
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  // Persist cart to localStorage on every change
  useEffect(() => {
    localStorage.setItem('ndeko_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, location?: { locationId: string; locationLabel?: string }) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                // A later add can supply a location where an earlier one didn't (or update it).
                locationId: location?.locationId ?? item.locationId,
                locationLabel: location?.locationLabel ?? item.locationLabel,
              }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1, locationId: location?.locationId, locationLabel: location?.locationLabel }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const setCartItemLocation = (productId: string, locationId: string, locationLabel?: string) => {
    setCart(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, locationId, locationLabel } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        setCartItemLocation,
        clearCart,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within <CartProvider>');
  return context;
}