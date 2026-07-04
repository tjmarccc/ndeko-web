import type { LocationStock } from '../services/api';

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  reviews: number;        // ✅ was already correct — keep as `reviews`
  description: string;
  brand: string;
  inStock: boolean;
  discount?: number;
  storeId?: string;
  locationStock?: LocationStock[];
}

export interface CartItem extends Product {
  quantity: number;
  // Which branch this line will be fulfilled from — required by checkout.
  locationId?: string;
  locationLabel?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  subcategories?: string[];
}