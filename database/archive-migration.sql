-- Migration for Task Archive functionality
-- Add these columns to the existing tasks table

-- Add archive-related columns to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Add index for archived tasks for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_archived ON tasks(archived);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at);
CREATE INDEX IF NOT EXISTS idx_tasks_archived_at ON tasks(archived_at);

-- Update existing completed tasks to set completed_at if it's null
-- This handles existing data where completed_at wasn't tracked
UPDATE tasks 
SET completed_at = updated_at 
WHERE status = 'Completed' 
AND completed_at IS NULL;

-- Create a view for active (non-archived) tasks for easier queries
CREATE OR REPLACE VIEW active_tasks AS
SELECT * FROM tasks WHERE archived = false;

-- Create a view for archived tasks
CREATE OR REPLACE VIEW archived_tasks AS
SELECT * FROM tasks WHERE archived = true;
