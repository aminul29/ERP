-- Migration to enable realtime functionality on comments table
-- This ensures that comments will broadcast real-time changes

-- Enable replica identity for the comments table (required for realtime)
ALTER TABLE comments REPLICA IDENTITY FULL;

-- Enable row level security (recommended for realtime tables)
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create a simple RLS policy to allow authenticated users to manage comments
-- (You may want to adjust this policy based on your specific security requirements)
CREATE POLICY "Allow authenticated users to manage comments" ON comments
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Note: After running this migration, you also need to:
-- 1. Go to your Supabase dashboard
-- 2. Navigate to Settings > Database > Replication
-- 3. Add the 'comments' table to the list of publications for realtime
-- 4. Or run the following in the Supabase SQL editor:
--    ALTER PUBLICATION supabase_realtime ADD TABLE comments;
