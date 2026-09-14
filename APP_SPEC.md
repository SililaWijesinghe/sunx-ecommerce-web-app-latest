# SUNX Technologies - Advanced Application Specification (APP_SPEC.md)

## 1. Project Overview & Tech Stack

**SUNX Technologies** is a top-tier, high-performance e-commerce platform delivering a premium tech shopping experience. It features a public storefront, a secure admin dashboard, and an integrated AI shopping assistant.

*   **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, Lucide React.
*   **State Management & Logic**: Zustand (Persistent stores for Cart, Wishlists, Auth).
*   **Animations & Interactions**: Framer Motion (page transitions, 3D card effects).
*   **Database & Authentication**: Supabase (PostgreSQL & Supabase Auth).
*   **Image Storage**: Hostinger. Product images are uploaded directly to a separate Hostinger server (e.g., `/uploads/`), saving only absolute URLs in Supabase.
*   **AI Integration**: Gemini API (Google Gen AI SDK) for the intelligent shopping assistant.
*   **Deployment**: Hostinger (Static files served via Apache/LiteSpeed with SPA routing).

---

## 2. High-End UI/UX & Interaction Standards

*   **Design Language**: Modern "premium tech" aesthetic utilizing sharp geometric edges (e.g., zero or minimal border-radius on cards, aggressive angles) and a high-contrast dark/red color scheme (#111827 / #0B0F19 backgrounds with #E50914 accents).
*   **Media Formatting Standards**: 
    *   **Standard Grid Thumbnails**: All product thumbnails in grids/carousels MUST be formatted to a strict **1:1 square aspect ratio**.
    *   **Immersive Discovery**: Mobile product discovery feeds and highlighted hero slots MUST support **9:16 portrait video/image** formats for full-screen immersive browsing.
*   **Micro-Animations**: 
    *   Use `framer-motion` for fluid page transitions.
    *   Implement interactive 3D tilt/hover effects on product cards.
*   **Optimistic UI Updates**: Cart additions, wishlist toggles, and review submissions must update the client-side UI instantly before waiting for Supabase database confirmation, ensuring a zero-latency feel.

---

## 3. AI Shopping Assistant (Gemini API)

An interactive AI chatbot embedded directly into the React frontend to act as a technical shopping assistant.
*   **Capabilities**: Compare complex PC components, find compatible motherboards/RAM, answer specific technical product questions, and recommend builds.
*   **Architecture**: The Gemini API calls must be routed through a server-side proxy (or edge function) to keep the `GEMINI_API_KEY` secure. The UI will feature a collapsible chat widget with streaming text responses.

---

## 4. Advanced Search & Filtering

*   **Faceted Search Architecture**: Users can filter products by exact tech specs (RAM, storage, CPU), dynamic price range sliders, and brands.
*   **Instant Results**: Filtering must operate strictly without page reloads, utilizing URL search parameters (`?ram=16gb&brand=asus`) and optimized client-side state/caching to instantly render results.

---

## 5. Database Schema (Supabase PostgreSQL)

The expanded relational schema supporting variants, verified reviews, and multiple wishlists.

```sql
-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Categories & Brands
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE brands (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Products & Variants
CREATE TABLE products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  discount INTEGER,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  base_image_url TEXT NOT NULL, -- 1:1 Aspect Ratio Requirement
  discovery_media_url TEXT, -- 9:16 Portrait Media Requirement
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE product_variants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE NOT NULL,
  color TEXT,
  ram_size TEXT,
  storage_capacity TEXT,
  price_adjustment DECIMAL(10,2) DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0
);

-- Reviews
CREATE TABLE product_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Multiple Wishlists
CREATE TABLE wishlists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Dream PC Build", "Gifts"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE wishlist_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  wishlist_id UUID REFERENCES wishlists(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(wishlist_id, product_id)
);

-- Orders
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_time DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

---

## 6. TypeScript Interfaces (`src/types/index.ts`)

```typescript
export type UserRole = 'customer' | 'admin';
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  originalPrice?: number;
  discount?: number;
  rating: number;
  reviewCount: number;
  baseImageUrl: string;
  discoveryMediaUrl?: string;
  categoryId: string;
  brandId: string;
  variants?: ProductVariant[];
  reviews?: ProductReview[];
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  color?: string;
  ramSize?: string;
  storageCapacity?: string;
  priceAdjustment: number;
  stock: number;
}

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  reviewText?: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export interface Wishlist {
  id: string;
  userId: string;
  name: string;
  items?: Product[];
}

export interface CartItem extends Product {
  selectedVariantId: string;
  quantity: number;
  finalPrice: number;
}
```

---

## 7. Folder Structure & Architecture

```text
/
├── public/                 
├── src/
│   ├── components/         
│   │   ├── ai/             # Gemini Assistant Chat Widget & Hooks
│   │   ├── search/         # Faceted search, sliders, dynamic filters
│   │   ├── admin/          
│   │   ├── home/           
│   │   ├── layout/         
│   │   └── shared/         # 3D ProductCards (1:1), Discovery Feeds (9:16)
│   ├── data/               
│   ├── lib/                # supabaseClient.ts, geminiClient.ts
│   ├── pages/              
│   ├── store/              # useCartStore, useWishlistStore (Multi-list logic)
│   ├── types/              
│   ├── App.tsx             
│   └── index.css           
├── .env.example            # VITE_SUPABASE_*, GEMINI_API_KEY
├── APP_SPEC.md             
└── index.html              
```

---

## 8. Deployment Rules (Hostinger SPA)

### Environment Variables
*   Frontend variables MUST be prefixed with `VITE_` (e.g., `VITE_SUPABASE_URL`).
*   **CRITICAL**: `GEMINI_API_KEY` MUST NOT be prefixed with `VITE_` and MUST remain server-side or proxied.
*   Access variables exclusively via `import.meta.env`.

### Hostinger Apache Routing (.htaccess)
To support seamless client-side routing on Hostinger, place this `.htaccess` file in your `public/` (or `dist/`) folder:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```
