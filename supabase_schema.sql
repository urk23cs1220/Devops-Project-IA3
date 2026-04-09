-- Execute this entire script in your Supabase SQL Editor
-- Project URL: https://supabase.com/dashboard/project/imsldanjgynkbayvefqo/sql

-- Create Users table (Mapping to User.model.js)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, -- Storing as password_hash but mapping it back for simplicity in backend
  role TEXT DEFAULT 'consumer' CHECK (role IN ('consumer', 'farmer', 'admin')),
  phone TEXT,
  address TEXT,
  location JSONB DEFAULT '{"type": "Point", "coordinates": [0, 0]}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Products table (Mapping to Product.model.js)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Rice', 'Vegetables', 'Fruits', 'Grains', 'Dairy', 'Spices', 'Other')),
  images JSONB DEFAULT '[]'::jsonb,
  price_per_unit NUMERIC NOT NULL CHECK (price_per_unit >= 0),
  measuring_unit TEXT NOT NULL CHECK (measuring_unit IN ('kg', 'g', 'packet', 'bunch', 'piece', 'litre')),
  min_order_qty NUMERIC NOT NULL CHECK (min_order_qty >= 1),
  shelf_life_days NUMERIC NOT NULL CHECK (shelf_life_days >= 1),
  quantity_available NUMERIC NOT NULL CHECK (quantity_available >= 0),
  location JSONB DEFAULT '{"type": "Point", "coordinates": [0, 0]}'::jsonb,
  delivery_radius_km NUMERIC NOT NULL CHECK (delivery_radius_km >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Orders table (Mapping to Order.model.js)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  farmer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of ordered products
  subtotal NUMERIC NOT NULL CHECK (subtotal >= 0),
  delivery_address TEXT NOT NULL,
  status TEXT DEFAULT 'placed' CHECK (status IN ('placed', 'accepted', 'packed', 'dispatched', 'delivered', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Setup some basic row level security (RLS) allowing all access for now (since backend handles logic)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow authenticating from standard backend server
CREATE POLICY "Allow all actions for users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow all actions for products" ON public.products FOR ALL USING (true);
CREATE POLICY "Allow all actions for orders" ON public.orders FOR ALL USING (true);
