import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database table names
export const TABLES = {
  TEAMMATES: 'teammates',
  CLIENTS: 'clients', 
  PROJECTS: 'projects',
  TASKS: 'tasks',
  TIME_LOGS: 'time_logs',
  SALARIES: 'salaries',
  NOTIFICATIONS: 'notifications',
  ATTENDANCE: 'attendance',
  COMMENTS: 'comments',
  PENDING_UPDATES: 'pending_updates',
  ERP_SETTINGS: 'erp_settings'
} as const
