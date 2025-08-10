-- Add comments table to Supabase real-time publication
-- This allows the table to broadcast changes in real-time to subscribed clients

ALTER PUBLICATION supabase_realtime ADD TABLE comments;
