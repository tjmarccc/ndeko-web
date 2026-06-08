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
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  subcategories?: string[];
}