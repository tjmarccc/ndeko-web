import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { Product } from '../types/product';
import {
  addToWishlist as apiAdd,
  removeFromWishlist as apiRemove,
  getWishlist,
  tokenStore,
  type WishlistItem,
} from '../services/api';

interface WishlistContextType {
  wishlistedIds: Set<string>;
  toggleWishlist: (product: Product) => Promise<void>;
  isInWishlist: (id: string) => boolean;
  removeFromWishlist: (id: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());

  // On mount, if logged in, pre-populate so hearts render correctly
  useEffect(() => {
    if (!tokenStore.getAccess()) return;
    getWishlist(1, 100)
      .then(res => {
        const ids = new Set(res.data.map((item: WishlistItem) => item.product_id));
        setWishlistedIds(ids);
      })
      .catch(() => {});
  }, []);

  const toggleWishlist = useCallback(async (product: Product) => {
    const already = wishlistedIds.has(product.id);
    // Optimistic update
    setWishlistedIds(prev => {
      const next = new Set(prev);
      if (already) next.delete(product.id); else next.add(product.id);
      return next;
    });
    try {
      if (already) {
        await apiRemove(product.id);
        toast.success('Removed from wishlist');
      } else {
        await apiAdd(product.id);
        toast.success('Added to wishlist');
      }
    } catch (e: unknown) {
      // Roll back on failure
      setWishlistedIds(prev => {
        const next = new Set(prev);
        if (already) next.add(product.id); else next.delete(product.id);
        return next;
      });
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('401') || msg.includes('403')) {
        toast.error('Please log in to save items');
      } else {
        toast.error('Could not update wishlist');
      }
    }
  }, [wishlistedIds]);

  const removeFromWishlist = useCallback(async (id: string) => {
    setWishlistedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    try {
      await apiRemove(id);
    } catch {
      setWishlistedIds(prev => { const next = new Set(prev); next.add(id); return next; });
    }
  }, []);

  const isInWishlist = useCallback((id: string) => wishlistedIds.has(id), [wishlistedIds]);

  return (
    <WishlistContext.Provider value={{ wishlistedIds, toggleWishlist, isInWishlist, removeFromWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
