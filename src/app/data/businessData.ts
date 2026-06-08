export interface Vendor {
  id: string;
  name: string;
  tagline: string;
  owner: string;
  categories: string[];
  rating: number;
  reviewCount: number;
  productCount: number;
  joinedDate: string;
  verified: boolean;
  location: string;
  initials: string;
  coverColor: string;
  accentColor: string;
  featured: boolean;
  products: VendorProduct[];
}

export interface VendorProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  sold: number;
  image: string;
  status: 'active' | 'inactive' | 'out_of_stock';
}

export interface BusinessOrder {
  id: string;
  customer: string;
  customerEmail: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  date: string;
  address: string;
  paymentMethod: string;
}

export const mockVendors: Vendor[] = [
  {
    id: 'v1',
    name: 'TechHub Lagos',
    tagline: 'Premium electronics & gadgets for the modern Nigerian',
    owner: 'Emeka Okafor',
    categories: ['Electronics', 'Gadgets', 'Accessories'],
    rating: 4.8,
    reviewCount: 1240,
    productCount: 142,
    joinedDate: '2022-03',
    verified: true,
    location: 'Lagos, Nigeria',
    initials: 'TH',
    coverColor: '#0D2137',
    accentColor: '#3D9B8E',
    featured: true,
    products: [
      { id: 'vp1', name: 'iPhone 15 Pro', price: 895000, image: 'https://images.unsplash.com/photo-1612519348055-5948319a0714?w=400&q=80', category: 'Electronics' },
      { id: 'vp2', name: 'Sony WH-1000XM5', price: 185000, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80', category: 'Electronics' },
      { id: 'vp3', name: 'Samsung Galaxy Tab', price: 320000, image: 'https://images.unsplash.com/photo-1587558873118-9edb4d1e7e97?w=400&q=80', category: 'Gadgets' },
    ],
  },
  {
    id: 'v2',
    name: 'FashionNaija',
    tagline: 'Trendy African & international fashion at your fingertips',
    owner: 'Chioma Nwosu',
    categories: ['Fashion', 'Accessories', 'Shoes'],
    rating: 4.6,
    reviewCount: 876,
    productCount: 389,
    joinedDate: '2021-07',
    verified: true,
    location: 'Abuja, Nigeria',
    initials: 'FN',
    coverColor: '#4A0E1F',
    accentColor: '#D4828F',
    featured: true,
    products: [
      { id: 'vp4', name: 'Ankara Print Dress', price: 28000, image: 'https://images.unsplash.com/photo-1592840054664-6bc0f6fbc3d6?w=400&q=80', category: 'Fashion' },
      { id: 'vp5', name: 'Designer Handbag', price: 65000, image: 'https://images.unsplash.com/photo-1637868796504-32f45a96d5a0?w=400&q=80', category: 'Accessories' },
      { id: 'vp6', name: 'Stiletto Heels', price: 22000, image: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=400&q=80', category: 'Shoes' },
    ],
  },
  {
    id: 'v3',
    name: 'HomeWorks NG',
    tagline: 'Transform your home with quality appliances & décor',
    owner: 'Babatunde Adeyemi',
    categories: ['Home & Kitchen', 'Appliances', 'Decor'],
    rating: 4.5,
    reviewCount: 543,
    productCount: 215,
    joinedDate: '2022-11',
    verified: true,
    location: 'Port Harcourt, Nigeria',
    initials: 'HW',
    coverColor: '#1C3A2F',
    accentColor: '#3D9B8E',
    featured: false,
    products: [
      { id: 'vp7', name: 'Air Fryer Pro', price: 45000, image: 'https://images.unsplash.com/photo-1586495777744-4e6232bf5198?w=400&q=80', category: 'Appliances' },
      { id: 'vp8', name: 'Modern Bedsheet Set', price: 18000, image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80', category: 'Home' },
      { id: 'vp9', name: 'Coffee Maker', price: 38000, image: 'https://images.unsplash.com/photo-1510017803434-a899398421b3?w=400&q=80', category: 'Appliances' },
    ],
  },
  {
    id: 'v4',
    name: 'SportZone Nigeria',
    tagline: 'Gear up for greatness — top sports & fitness products',
    owner: 'Aisha Mohammed',
    categories: ['Sports', 'Fitness', 'Outdoors'],
    rating: 4.7,
    reviewCount: 412,
    productCount: 98,
    joinedDate: '2023-01',
    verified: false,
    location: 'Kano, Nigeria',
    initials: 'SZ',
    coverColor: '#1A2F4E',
    accentColor: '#3D9B8E',
    featured: false,
    products: [
      { id: 'vp10', name: 'Dumbbell Set 20kg', price: 32000, image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80', category: 'Fitness' },
      { id: 'vp11', name: 'Running Shoes', price: 48000, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80', category: 'Shoes' },
      { id: 'vp12', name: 'Yoga Mat', price: 12000, image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80', category: 'Fitness' },
    ],
  },
  {
    id: 'v5',
    name: 'BeautyGlow NG',
    tagline: 'Authentic beauty & wellness products for every skin type',
    owner: 'Fatima Hassan',
    categories: ['Beauty', 'Skincare', 'Wellness'],
    rating: 4.9,
    reviewCount: 2180,
    productCount: 267,
    joinedDate: '2020-09',
    verified: true,
    location: 'Lagos, Nigeria',
    initials: 'BG',
    coverColor: '#5C1430',
    accentColor: '#D4828F',
    featured: true,
    products: [
      { id: 'vp13', name: 'Vitamin C Serum', price: 15000, image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80', category: 'Skincare' },
      { id: 'vp14', name: 'Hair Growth Oil', price: 8500, image: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=400&q=80', category: 'Beauty' },
      { id: 'vp15', name: 'Luxury Perfume Set', price: 42000, image: 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=400&q=80', category: 'Wellness' },
    ],
  },
  {
    id: 'v6',
    name: 'AutoParts Connect',
    tagline: 'Original car parts & accessories delivered nationwide',
    owner: 'Chukwudi Eze',
    categories: ['Automotive', 'Car Parts', 'Accessories'],
    rating: 4.4,
    reviewCount: 329,
    productCount: 513,
    joinedDate: '2021-04',
    verified: true,
    location: 'Enugu, Nigeria',
    initials: 'AC',
    coverColor: '#1A1A2E',
    accentColor: '#3D9B8E',
    featured: false,
    products: [
      { id: 'vp16', name: 'Car Dash Camera', price: 28000, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', category: 'Automotive' },
      { id: 'vp17', name: 'Tyre Inflator', price: 14000, image: 'https://images.unsplash.com/photo-1584089209226-a3f785f73b09?w=400&q=80', category: 'Automotive' },
      { id: 'vp18', name: 'Car Seat Covers', price: 18500, image: 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=400&q=80', category: 'Automotive' },
    ],
  },
];

export const mockInventory: InventoryItem[] = [
  {
    id: 'inv1',
    name: 'Samsung Galaxy S24 Ultra',
    sku: 'TECH-SGS24-001',
    category: 'Electronics',
    price: 899000,
    cost: 650000,
    stock: 23,
    sold: 142,
    image: 'https://images.unsplash.com/photo-1612519348055-5948319a0714?w=200&q=80',
    status: 'active',
  },
  {
    id: 'inv2',
    name: 'MacBook Pro 14" M3',
    sku: 'TECH-MBP14-002',
    category: 'Electronics',
    price: 1899000,
    cost: 1400000,
    stock: 8,
    sold: 87,
    image: 'https://images.unsplash.com/photo-1511385348-a52b4a160dc2?w=200&q=80',
    status: 'active',
  },
  {
    id: 'inv3',
    name: 'Sony WH-1000XM5',
    sku: 'TECH-SXWH5-003',
    category: 'Electronics',
    price: 349000,
    cost: 240000,
    stock: 2,
    sold: 234,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80',
    status: 'active',
  },
  {
    id: 'inv4',
    name: 'Ankara Print Dress (M)',
    sku: 'FASH-APD-M-004',
    category: 'Fashion',
    price: 28000,
    cost: 12000,
    stock: 45,
    sold: 321,
    image: 'https://images.unsplash.com/photo-1592840054664-6bc0f6fbc3d6?w=200&q=80',
    status: 'active',
  },
  {
    id: 'inv5',
    name: 'Vitamin C Serum 30ml',
    sku: 'BEAU-VCS-005',
    category: 'Beauty',
    price: 15000,
    cost: 6000,
    stock: 0,
    sold: 582,
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=200&q=80',
    status: 'out_of_stock',
  },
  {
    id: 'inv6',
    name: 'Air Fryer Pro 5L',
    sku: 'HOME-AFP5-006',
    category: 'Home & Kitchen',
    price: 45000,
    cost: 28000,
    stock: 15,
    sold: 67,
    image: 'https://images.unsplash.com/photo-1586495777744-4e6232bf5198?w=200&q=80',
    status: 'active',
  },
  {
    id: 'inv7',
    name: 'Dumbbell Set 20kg',
    sku: 'SPRT-DB20-007',
    category: 'Sports',
    price: 32000,
    cost: 18000,
    stock: 4,
    sold: 43,
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&q=80',
    status: 'active',
  },
  {
    id: 'inv8',
    name: 'Luxury Perfume Set',
    sku: 'BEAU-LPS-008',
    category: 'Beauty',
    price: 42000,
    cost: 22000,
    stock: 0,
    sold: 128,
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=200&q=80',
    status: 'inactive',
  },
];

export const mockBusinessOrders: BusinessOrder[] = [
  {
    id: 'ORD-2026050101',
    customer: 'Adaeze Okonkwo',
    customerEmail: 'adaeze@email.com',
    items: [{ name: 'Samsung Galaxy S24 Ultra', qty: 1, price: 899000 }],
    total: 899000,
    status: 'delivered',
    date: '2026-05-01',
    address: 'Lekki Phase 1, Lagos',
    paymentMethod: 'Card',
  },
  {
    id: 'ORD-2026043002',
    customer: 'Tunde Obaseki',
    customerEmail: 'tunde@email.com',
    items: [
      { name: 'Sony WH-1000XM5', qty: 1, price: 349000 },
      { name: 'Air Fryer Pro 5L', qty: 1, price: 45000 },
    ],
    total: 394000,
    status: 'shipped',
    date: '2026-04-30',
    address: 'Ikeja GRA, Lagos',
    paymentMethod: 'Bank Transfer',
  },
  {
    id: 'ORD-2026042903',
    customer: 'Ngozi Ibe',
    customerEmail: 'ngozi@email.com',
    items: [{ name: 'MacBook Pro 14" M3', qty: 1, price: 1899000 }],
    total: 1899000,
    status: 'processing',
    date: '2026-04-29',
    address: 'Wuse Zone 5, Abuja',
    paymentMethod: 'Pay on Delivery',
  },
  {
    id: 'ORD-2026042804',
    customer: 'Ibrahim Musa',
    customerEmail: 'ibrahim@email.com',
    items: [
      { name: 'Ankara Print Dress (M)', qty: 2, price: 56000 },
      { name: 'Luxury Perfume Set', qty: 1, price: 42000 },
    ],
    total: 98000,
    status: 'pending',
    date: '2026-04-28',
    address: 'Maitama, Abuja',
    paymentMethod: 'Card',
  },
  {
    id: 'ORD-2026042705',
    customer: 'Blessing Osei',
    customerEmail: 'blessing@email.com',
    items: [{ name: 'Vitamin C Serum 30ml', qty: 3, price: 45000 }],
    total: 45000,
    status: 'cancelled',
    date: '2026-04-27',
    address: 'Trans-Amadi, Port Harcourt',
    paymentMethod: 'Card',
  },
  {
    id: 'ORD-2026042606',
    customer: 'Chinedu Obi',
    customerEmail: 'chinedu@email.com',
    items: [{ name: 'Dumbbell Set 20kg', qty: 1, price: 32000 }],
    total: 32000,
    status: 'delivered',
    date: '2026-04-26',
    address: 'New Haven, Enugu',
    paymentMethod: 'Bank Transfer',
  },
];

export const weeklyRevenue = [
  { day: 'Mon', revenue: 284000, orders: 8 },
  { day: 'Tue', revenue: 412000, orders: 12 },
  { day: 'Wed', revenue: 198000, orders: 6 },
  { day: 'Thu', revenue: 567000, orders: 15 },
  { day: 'Fri', revenue: 893000, orders: 22 },
  { day: 'Sat', revenue: 1240000, orders: 31 },
  { day: 'Sun', revenue: 654000, orders: 18 },
];

export const categoryBreakdown = [
  { name: 'Electronics', value: 45, color: '#3D9B8E' },
  { name: 'Fashion', value: 28, color: '#D4828F' },
  { name: 'Beauty', value: 14, color: '#8B1538' },
  { name: 'Home', value: 8, color: '#F59E0B' },
  { name: 'Sports', value: 5, color: '#6366F1' },
];
