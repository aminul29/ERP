-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create teammates table
CREATE TABLE teammates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    join_date DATE NOT NULL,
    salary DECIMAL(10,2),
    approved BOOLEAN DEFAULT false,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    avatar TEXT,
    password VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clients table
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    allocated_time_in_seconds INTEGER DEFAULT 0,
    priority VARCHAR(50) DEFAULT 'Medium',
    divisions JSONB DEFAULT '[]',
    team_member_ids JSONB DEFAULT '[]',
    created_by_id UUID REFERENCES teammates(id),
    ratings JSONB DEFAULT '{}',
    acceptance JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'To Do',
    deadline DATE,
    priority VARCHAR(50) DEFAULT 'Medium',
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id),
    divisions JSONB DEFAULT '[]',
    assigned_to_id UUID REFERENCES teammates(id),
    assigned_by_id UUID REFERENCES teammates(id),
    completion_report TEXT,
    work_experience VARCHAR(50),
    suggestions TEXT,
    completion_files JSONB DEFAULT '[]',
    drive_link TEXT,
    allocated_time_in_seconds INTEGER DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,
    timer_start_time TIMESTAMP WITH TIME ZONE,
    revision_note TEXT,
    ratings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create time_logs table
CREATE TABLE time_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teammate_id UUID REFERENCES teammates(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hours DECIMAL(4,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create salaries table
CREATE TABLE salaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teammate_id UUID REFERENCES teammates(id) ON DELETE CASCADE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES teammates(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    link VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance table
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teammate_id UUID REFERENCES teammates(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Present',
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL, -- Can reference projects or tasks
    author_id UUID REFERENCES teammates(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pending_updates table
CREATE TABLE pending_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL, -- 'project', 'task', 'teammate'
    item_id UUID NOT NULL,
    requested_by UUID REFERENCES teammates(id) ON DELETE CASCADE,
    requester_name VARCHAR(255) NOT NULL,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data JSONB NOT NULL,
    original_data JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES teammates(id)
);

-- Create erp_settings table
CREATE TABLE erp_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) DEFAULT 'WebWizBD ERP',
    daily_time_goal DECIMAL(4,2) DEFAULT 1.5,
    currency_symbol VARCHAR(10) DEFAULT '$',
    theme VARCHAR(50) DEFAULT 'system',
    color_scheme VARCHAR(50) DEFAULT 'gold',
    divisions JSONB DEFAULT '[]',
    roles JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_teammates_email ON teammates(email);
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assigned_to_id ON tasks(assigned_to_id);
CREATE INDEX idx_time_logs_teammate_id ON time_logs(teammate_id);
CREATE INDEX idx_time_logs_date ON time_logs(date);
CREATE INDEX idx_salaries_teammate_id ON salaries(teammate_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_attendance_teammate_id ON attendance(teammate_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_pending_updates_item_id ON pending_updates(item_id);

-- Insert default ERP settings
INSERT INTO erp_settings (company_name, daily_time_goal, currency_symbol, theme, color_scheme, divisions, roles)
VALUES (
    'WebWizBD ERP',
    1.5,
    '$',
    'system',
    'gold',
    '["UI Ux Design", "Web Development", "SEO", "SMM", "Content Writing"]'::jsonb,
    '["CEO", "HR and Admin", "SMM and Design Lead", "Sales and PR Lead", "Lead Web Developer", "Lead SEO Expert", "Content Writer", "Developer", "Designer"]'::jsonb
);
