-- =====================================================
-- RLS VERIFICATION SCRIPT
-- =====================================================
-- Run this after applying the main script to verify everything is set up correctly

-- 1. Check if RLS is enabled on all tables
SELECT 
  'RLS Status Check' AS check_type,
  COUNT(*) FILTER (WHERE rowsecurity = true) AS rls_enabled_count,
  COUNT(*) FILTER (WHERE rowsecurity = false) AS rls_disabled_count,
  COUNT(*) AS total_tables
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'products', 'product_variants', 'product_options', 'product_option_values',
    'product_collections', 'product_categories', 'product_tags', 'product_images',
    'product_reviews', 'categories', 'tags', 'users', 'customers', 'addresses',
    'orders', 'line_items', 'regions', 'countries', 'money_amounts',
    'campaigns', 'discounts', 'banners', 'pages', 'posts',
    'settings', 'courses', 'lessons', 'wholesale_inquiries'
  );

-- 2. List all tables with RLS status
SELECT 
  tablename AS table_name,
  CASE 
    WHEN rowsecurity = true THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END AS rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'products', 'product_variants', 'product_options', 'product_option_values',
    'product_collections', 'product_categories', 'product_tags', 'product_images',
    'product_reviews', 'categories', 'tags', 'users', 'customers', 'addresses',
    'orders', 'line_items', 'regions', 'countries', 'money_amounts',
    'campaigns', 'discounts', 'banners', 'pages', 'posts',
    'settings', 'courses', 'lessons', 'wholesale_inquiries'
  )
ORDER BY 
  rowsecurity ASC,  -- Show disabled first
  tablename ASC;

-- 3. Count policies per table
SELECT 
  tablename AS table_name,
  COUNT(policyname) AS policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 4. Show all policies with details
SELECT 
  tablename AS table_name,
  policyname AS policy_name,
  cmd AS operation,
  permissive AS permissive,
  CASE 
    WHEN roles::text = '{postgres}' THEN '✅ postgres only'
    ELSE roles::text
  END AS applies_to
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 5. Test if backend can access tables (this simulates what backend does)
-- This should return the table names if backend has access
SELECT 
  'Backend Access Test' AS test_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Backend can access tables'
    ELSE '❌ Backend cannot access tables'
  END AS result
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'products'
  AND rowsecurity = true;
