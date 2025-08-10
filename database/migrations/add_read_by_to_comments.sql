-- Add read_by column to comments table
-- This column will store an array of user IDs who have marked the comment as read

ALTER TABLE comments 
ADD COLUMN read_by JSONB DEFAULT '[]';

-- Add an index for better performance when querying read status
CREATE INDEX idx_comments_read_by ON comments USING GIN (read_by);

-- Update existing comments to have empty read_by arrays (they're already defaulted, but just to be explicit)
UPDATE comments SET read_by = '[]' WHERE read_by IS NULL;
