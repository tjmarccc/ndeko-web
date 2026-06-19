import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Product } from '../types/product';
import {
  getWishlist,
  addToWishlist as apiAddToWishlist,
  removeFromWishlist as apiRemoveFromWishlist,
  mapApiProduct,
  tokenStore,
  ApiError,
  type ApiProduct,
} from '../services/api';

interface WishlistContextType {
  wishlist: Product[];
  loading: boolean;
  error: string | null;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (id: string) => boolean;
  removeFromWishlist: (id: string) => void;
  /** ids currently mid-flight (add or remove) — useful for disabling buttons */
  pendingIds: Set<string>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const GUEST_STORAGE_KEY = 'ndeko_guest_wishlist';

// ─── Guest (logged-out) fallback ───────────────────────────────────────────
// Logged-out users can't hit the authenticated wishlist endpoints, so we keep
// a small local-only list for them. The moment they log in, this is what the
// API-backed wishlist replaces — guest data is intentionally NOT auto-merged
// into the account wishlist, since silently merging anonymous local state
// into a real account on login is a common source of surprising behavior.
function readGuestWishlist(): Product[] {
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Product[]) : [];
  } catch {
    return [];
  }
}

function writeGuestWishlist(items: Product[]) {
  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(items));
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  // Track whether we're authenticated right now (re-checked on each call,
  // since tokenStore can change without this component re-rendering).
  const isAuthed = () => !!tokenStore.getAccess();

  const setPending = (id: string, on: boolean) => {
    setPendingIds((prev) => {
      const next = new Set(prev);
      on ? next.add(id) : next.delete(id);
      return next;
    });
  };

  // ── Load wishlist (API for logged-in users, localStorage for guests) ──
  const load = useCallback(async () => {
    if (!isAuthed()) {
      setWishlist(readGuestWishlist());
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await getWishlist(1, 100);
      setWishlist(res.data.map((p: ApiProduct) => mapApiProduct(p)));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Keep guest wishlist persisted whenever it changes (no-op once authed,
  // since authed state is driven by the API, not this effect)
  useEffect(() => {
    if (!isAuthed()) {
      writeGuestWishlist(wishlist);
    }
  }, [wishlist]);

  const isInWishlist = (id: string) => wishlist.some((p) => p.id === id);

  // ── Add ──
  const add = async (product: Product) => {
    if (!isAuthed()) {
      setWishlist((prev) => (prev.some((p) => p.id === product.id) ? prev : [...prev, product]));
      return;
    }

    // Optimistic add
    setWishlist((prev) => (prev.some((p) => p.id === product.id) ? prev : [...prev, product]));
    setPending(product.id, true);
    try {
      await apiAddToWishlist(product.id);
    } catch (e) {
      // Roll back on failure
      setWishlist((prev) => prev.filter((p) => p.id !== product.id));
      setError(e instanceof ApiError ? e.message : 'Failed to add to wishlist');
      throw e;
    } finally {
      setPending(product.id, false);
    }
  };

  // ── Remove ──
  const remove = async (id: string) => {
    if (!isAuthed()) {
      setWishlist((prev) => prev.filter((p) => p.id !== id));
      return;
    }

    // Optimistic remove — keep a copy in case we need to roll back
    const removedItem = wishlist.find((p) => p.id === id);
    setWishlist((prev) => prev.filter((p) => p.id !== id));
    setPending(id, true);
    try {
      await apiRemoveFromWishlist(id);
    } catch (e) {
      // Roll back on failure
      if (removedItem) {
        setWishlist((prev) => (prev.some((p) => p.id === id) ? prev : [...prev, removedItem]));
      }
      setError(e instanceof ApiError ? e.message : 'Failed to remove from wishlist');
      throw e;
    } finally {
      setPending(id, false);
    }
  };

  const toggleWishlist = (product: Product) => {
    if (isInWishlist(product.id)) {
      remove(product.id).catch(() => {
        // error already surfaced via `error` state; swallow here so callers
        // (e.g. ProductCard's onClick) don't need to handle a rejected promise
      });
    } else {
      add(product).catch(() => {});
    }
  };

  const removeFromWishlist = (id: string) => {
    remove(id).catch(() => {});
  };

  return (
    <WishlistContext.Provider
      value={{ wishlist, loading, error, toggleWishlist, isInWishlist, removeFromWishlist, pendingIds }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}