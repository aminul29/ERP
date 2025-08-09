# Enable Real-time Comments

This guide explains how to enable real-time functionality for the comments table in your Supabase database.

## Problem
Comments added in the TaskDetail page are not updating in real-time across different browser windows/tabs.

## Root Cause
The `comments` table is not enabled for real-time broadcasting in Supabase.

## Solution

### Step 1: Run the Migration
Execute the SQL migration file to prepare the table:

```sql
-- Run this in your Supabase SQL editor
-- File: database/enable_realtime_comments.sql

-- Enable replica identity for the comments table (required for realtime)
ALTER TABLE comments REPLICA IDENTITY FULL;

-- Enable row level security (recommended for realtime tables)
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create a simple RLS policy to allow authenticated users to manage comments
CREATE POLICY "Allow authenticated users to manage comments" ON comments
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
```

### Step 2: Enable Realtime Publication

**Option A: Using Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Database** → **Replication**
3. Find the "Tables in supabase_realtime publication" section
4. Click **Add table**
5. Select the `comments` table
6. Click **Add**

**Option B: Using SQL**
```sql
-- Run this in your Supabase SQL editor
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
```

### Step 3: Verify Real-time is Working

1. Open your ERP application in two different browser windows
2. Navigate to the same task detail page in both windows
3. Add a comment in one window
4. The comment should appear in real-time in the other window

### Troubleshooting

If comments are still not updating in real-time:

1. **Check Browser Console**: Look for real-time subscription messages and errors
2. **Verify Authentication**: Make sure users are properly authenticated
3. **Check RLS Policies**: Ensure the row-level security policy allows the current user to access comments
4. **Test with Different Users**: Try adding comments with different user accounts
5. **Check Network**: Ensure WebSocket connections are not blocked by firewalls or proxies

### Technical Notes

- The real-time subscription code is already implemented in `App.tsx` (lines 506-581)
- The subscription listens to all events (`INSERT`, `UPDATE`, `DELETE`) on the `comments` table
- Comments are filtered and mapped correctly from the database format to the frontend format
- The subscription automatically updates the local state when changes occur

### Security Considerations

The current RLS policy allows all authenticated users to manage all comments. You may want to implement more restrictive policies based on your requirements:

```sql
-- Example: More restrictive policy - users can only manage their own comments
DROP POLICY IF EXISTS "Allow authenticated users to manage comments" ON comments;

CREATE POLICY "Users can manage own comments" ON comments
    FOR ALL
    TO authenticated
    USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid());

-- Allow users to read all comments
CREATE POLICY "Users can read all comments" ON comments
    FOR SELECT
    TO authenticated
    USING (true);
```
