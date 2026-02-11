-- =====================================================
-- RLS ROLLBACK SCRIPT (Emergency Use Only)
-- =====================================================
-- Run this if you need to disable RLS and go back to previous state
-- WARNING: This removes all security policies!

-- =====================================================
-- STEP 1: Drop all service role policies
-- =====================================================

-- Product-related tables
DROP POLICY IF EXISTS "Service role full access on products" ON products;
DROP POLICY IF EXISTS "Service role full access on product_variants" ON product_variants;
DROP POLICY IF EXISTS "Service role full access on product_options" ON product_options;
DROP POLICY IF EXISTS "Service role full access on product_option_values" ON product_option_values;
DROP POLICY IF EXISTS "Service role full access on product_collections" ON product_collections;
DROP POLICY IF EXISTS "Service role full access on product_categories" ON product_categories;
DROP POLICY IF EXISTS "Service role full access on product_tags" ON product_tags;
DROP POLICY IF EXISTS "Service role full access on product_images" ON product_images;
DROP POLICY IF EXISTS "Service role full access on product_reviews" ON product_reviews;

-- Catalog tables
DROP POLICY IF EXISTS "Service role full access on categories" ON categories;
DROP POLICY IF EXISTS "Service role full access on tags" ON tags;

-- User & Customer tables
DROP POLICY IF EXISTS "Service role full access on users" ON users;
DROP POLICY IF EXISTS "Service role full access on customers" ON customers;
DROP POLICY IF EXISTS "Service role full access on addresses" ON addresses;

-- Order-related tables
DROP POLICY IF EXISTS "Service role full access on orders" ON orders;
DROP POLICY IF EXISTS "Service role full access on line_items" ON line_items;

-- Regional & Pricing tables
DROP POLICY IF EXISTS "Service role full access on regions" ON regions;
DROP POLICY IF EXISTS "Service role full access on countries" ON countries;
DROP POLICY IF EXISTS "Service role full access on money_amounts" ON money_amounts;

-- Marketing & Content tables
DROP POLICY IF EXISTS "Service role full access on campaigns" ON campaigns;
DROP POLICY IF EXISTS "Service role full access on discounts" ON discounts;
DROP POLICY IF EXISTS "Service role full access on banners" ON banners;
DROP POLICY IF EXISTS "Service role full access on pages" ON pages;
DROP POLICY IF EXISTS "Service role full access on posts" ON posts;

-- Other tables
DROP POLICY IF EXISTS "Service role full access on settings" ON settings;
DROP POLICY IF EXISTS "Service role full access on courses" ON courses;
DROP POLICY IF EXISTS "Service role full access on lessons" ON lessons;
DROP POLICY IF EXISTS "Service role full access on wholesale_inquiries" ON wholesale_inquiries;

-- =====================================================
-- STEP 2: Disable FORCE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE products NO FORCE ROW LEVEL SECURITY;
ALTER TABLE product_variants NO FORCE ROW LEVEL SECURITY;
ALTER TABLE product_options NO FORCE ROW LEVEL SECURITY;
ALTER TABLE product_option_values NO FORCE ROW LEVEL SECURITY;
ALTER TABLE product_collections NO FORCE ROW LEVEL SECURITY;
ALTER TABLE product_categories NO FORCE ROW LEVEL SECURITY;
ALTER TABLE product_tags NO FORCE ROW LEVEL SECURITY;
ALTER TABLE product_images NO FORCE ROW LEVEL SECURITY;
ALTER TABLE product_reviews NO FORCE ROW LEVEL SECURITY;
ALTER TABLE categories NO FORCE ROW LEVEL SECURITY;
ALTER TABLE tags NO FORCE ROW LEVEL SECURITY;
ALTER TABLE users NO FORCE ROW LEVEL SECURITY;
ALTER TABLE customers NO FORCE ROW LEVEL SECURITY;
ALTER TABLE addresses NO FORCE ROW LEVEL SECURITY;
ALTER TABLE orders NO FORCE ROW LEVEL SECURITY;
ALTER TABLE line_items NO FORCE ROW LEVEL SECURITY;
ALTER TABLE regions NO FORCE ROW LEVEL SECURITY;
ALTER TABLE countries NO FORCE ROW LEVEL SECURITY;
ALTER TABLE money_amounts NO FORCE ROW LEVEL SECURITY;
ALTER TABLE campaigns NO FORCE ROW LEVEL SECURITY;
ALTER TABLE discounts NO FORCE ROW LEVEL SECURITY;
ALTER TABLE banners NO FORCE ROW LEVEL SECURITY;
ALTER TABLE pages NO FORCE ROW LEVEL SECURITY;
ALTER TABLE posts NO FORCE ROW LEVEL SECURITY;
ALTER TABLE settings NO FORCE ROW LEVEL SECURITY;
ALTER TABLE courses NO FORCE ROW LEVEL SECURITY;
ALTER TABLE lessons NO FORCE ROW LEVEL SECURITY;
ALTER TABLE wholesale_inquiries NO FORCE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 3: Disable RLS on all tables
-- =====================================================

ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_options DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_option_values DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_collections DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE addresses DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE line_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE regions DISABLE ROW LEVEL SECURITY;
ALTER TABLE countries DISABLE ROW LEVEL SECURITY;
ALTER TABLE money_amounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE discounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE banners DISABLE ROW LEVEL SECURITY;
ALTER TABLE pages DISABLE ROW LEVEL SECURITY;
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE lessons DISABLE ROW LEVEL SECURITY;
ALTER TABLE wholesale_inquiries DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 4: Drop helper function
-- =====================================================
DROP FUNCTION IF EXISTS is_service_role();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT 'RLS has been DISABLED on all tables. Rolled back to previous state.' AS status;
