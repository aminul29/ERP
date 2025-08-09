-- Fix for comments table RLS policy
-- This addresses the issue where comments stopped working after enabling RLS
-- Since this ERP system uses local authentication, we need to adjust the policy

-- Option 1: Disable RLS entirely (simplest solution for local ERP)
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;

-- Option 2: If you prefer to keep RLS enabled, use a permissive policy
-- Uncomment the following lines if you want to keep RLS but allow all operations:

-- DROP POLICY IF EXISTS "Allow authenticated users to manage comments" ON comments;
-- CREATE POLICY "Allow all operations on comments" ON comments
--     FOR ALL
--     USING (true)
--     WITH CHECK (true);

-- Note: Choose either Option 1 OR Option 2, not both
-- Option 1 is recommended for local ERP systems without Supabase authentication
-- Option 2 is better if you plan to implement proper authentication later
