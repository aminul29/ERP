-- Create announcements table
-- This table will store system-wide announcements that can be targeted to specific roles or all users

CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    target_audience VARCHAR(20) NOT NULL DEFAULT 'all', -- 'all', 'management', 'staff', 'specific'
    target_roles JSONB DEFAULT '[]',
    created_by UUID REFERENCES teammates(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    viewed_by JSONB DEFAULT '[]', -- Array of user IDs who have viewed the announcement
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_announcements_created_by ON announcements(created_by);
CREATE INDEX idx_announcements_created_at ON announcements(created_at);
CREATE INDEX idx_announcements_priority ON announcements(priority);
CREATE INDEX idx_announcements_target_audience ON announcements(target_audience);
CREATE INDEX idx_announcements_is_active ON announcements(is_active);
CREATE INDEX idx_announcements_expires_at ON announcements(expires_at);
CREATE INDEX idx_announcements_viewed_by ON announcements USING GIN (viewed_by);
CREATE INDEX idx_announcements_target_roles ON announcements USING GIN (target_roles);
