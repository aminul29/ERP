-- Migration to add revision_note field to tasks table
-- Run this if your database already exists and is missing the revision_note column

-- Add revision_note column to tasks table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' 
        AND column_name = 'revision_note'
    ) THEN
        ALTER TABLE tasks ADD COLUMN revision_note TEXT;
    END IF;
END $$;
