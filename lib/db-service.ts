import { supabase, TABLES } from './supabase';
import {
  Teammate, Client, Project, Task, TimeLog, Salary,
  Notification, Attendance, Comment, PendingUpdate, ErpSettings
} from '../types';

// Data loading functions that will replace localStorage
export const loadFromDatabase = {
  async teammates(): Promise<Teammate[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.TEAMMATES)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        role: row.role,
        joinDate: row.join_date,
        salary: row.salary,
        approved: row.approved,
        email: row.email,
        phone: row.phone,
        avatar: row.avatar,
        password: row.password
      }));
    } catch (error) {
      console.error('Error loading teammates:', error);
      return [];
    }
  },

  async clients(): Promise<Client[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.CLIENTS)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        contactPerson: row.contact_person,
        email: row.email,
        phone: row.phone
      }));
    } catch (error) {
      console.error('Error loading clients:', error);
      return [];
    }
  },

  async projects(): Promise<Project[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PROJECTS)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        clientId: row.client_id,
        startDate: row.start_date,
        endDate: row.end_date,
        allocatedTimeInSeconds: row.allocated_time_in_seconds,
        priority: row.priority,
        divisions: row.divisions || [],
        teamMemberIds: row.team_member_ids || [],
        createdById: row.created_by_id,
        ratings: row.ratings || {},
        acceptance: row.acceptance || {}
      }));
    } catch (error) {
      console.error('Error loading projects:', error);
      return [];
    }
  },

  async tasks(): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.TASKS)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        deadline: row.deadline,
        priority: row.priority,
        projectId: row.project_id,
        clientId: row.client_id,
        divisions: row.divisions || [],
        assignedToId: row.assigned_to_id,
        assignedById: row.assigned_by_id,
        completionReport: row.completion_report,
        workExperience: row.work_experience,
        suggestions: row.suggestions,
        completionFiles: row.completion_files || [],
        allocatedTimeInSeconds: row.allocated_time_in_seconds,
        timeSpentSeconds: row.time_spent_seconds,
        timerStartTime: row.timer_start_time,
        revisionNote: row.revision_note,
        ratings: row.ratings || {}
      }));
    } catch (error) {
      console.error('Error loading tasks:', error);
      return [];
    }
  },

  async timeLogs(): Promise<TimeLog[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.TIME_LOGS)
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((row: any) => ({
        id: row.id,
        teammateId: row.teammate_id,
        date: row.date,
        hours: row.hours
      }));
    } catch (error) {
      console.error('Error loading time logs:', error);
      return [];
    }
  },

  async salaries(): Promise<Salary[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.SALARIES)
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((row: any) => ({
        id: row.id,
        teammateId: row.teammate_id,
        month: row.month,
        year: row.year,
        amount: row.amount,
        status: row.status
      }));
    } catch (error) {
      console.error('Error loading salaries:', error);
      return [];
    }
  },

  async notifications(): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        message: row.message,
        read: row.read,
        timestamp: row.created_at,
        link: row.link
      }));
    } catch (error) {
      console.error('Error loading notifications:', error);
      return [];
    }
  },

  async attendance(): Promise<Attendance[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.ATTENDANCE)
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((row: any) => ({
        id: row.id,
        teammateId: row.teammate_id,
        date: row.date,
        status: row.status,
        checkInTime: row.check_in_time,
        checkOutTime: row.check_out_time
      }));
    } catch (error) {
      console.error('Error loading attendance:', error);
      return [];
    }
  },

  async comments(): Promise<Comment[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.COMMENTS)
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      return (data || []).map((row: any) => ({
        id: row.id,
        parentId: row.parent_id,
        authorId: row.author_id,
        text: row.text,
        timestamp: row.created_at
      }));
    } catch (error) {
      console.error('Error loading comments:', error);
      return [];
    }
  },

  async pendingUpdates(): Promise<PendingUpdate[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PENDING_UPDATES)
        .select('*')
        .order('requested_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((row: any) => ({
        id: row.id,
        type: row.type,
        itemId: row.item_id,
        requestedBy: row.requested_by,
        requesterName: row.requester_name,
        requestedAt: row.requested_at,
        data: row.data,
        originalData: row.original_data,
        status: row.status,
        resolvedAt: row.resolved_at,
        resolvedBy: row.resolved_by
      } as PendingUpdate));
    } catch (error) {
      console.error('Error loading pending updates:', error);
      return [];
    }
  },

  async erpSettings(): Promise<ErpSettings | null> {
    try {
      const { data, error } = await supabase
        .from(TABLES.ERP_SETTINGS)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
      
      if (!data) return null;
      
      return {
        companyName: data.company_name,
        dailyTimeGoal: data.daily_time_goal,
        currencySymbol: data.currency_symbol,
        theme: data.theme,
        colorScheme: data.color_scheme,
        divisions: data.divisions || [],
        roles: data.roles || []
      };
    } catch (error) {
      console.error('Error loading ERP settings:', error);
      return null;
    }
  }
};

// Simple save functions (we'll add the full CRUD operations later)
export const saveToDatabase = {
  async teammate(teammate: Omit<Teammate, 'id'>): Promise<Teammate | null> {
    try {
      const { data, error } = await supabase
        .from(TABLES.TEAMMATES)
        .insert([{
          name: teammate.name,
          role: teammate.role,
          join_date: teammate.joinDate,
          salary: teammate.salary,
          approved: teammate.approved,
          email: teammate.email,
          phone: teammate.phone,
          avatar: teammate.avatar,
          password: teammate.password
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        name: data.name,
        role: data.role,
        joinDate: data.join_date,
        salary: data.salary,
        approved: data.approved,
        email: data.email,
        phone: data.phone,
        avatar: data.avatar,
        password: data.password
      };
    } catch (error) {
      console.error('Error saving teammate:', error);
      return null;
    }
  }
};

// Initialize database with default data
export const initializeDatabase = async () => {
  try {
    console.log('🚀 Checking database initialization...');
    
    // Check if we already have the default CEO
    const { data: ceoExists } = await supabase
      .from(TABLES.TEAMMATES)
      .select('id')
      .eq('email', 'iislamaminul@gmail.com')
      .limit(1);
    
    if (ceoExists && ceoExists.length > 0) {
      console.log('✅ Database already has default CEO account');
      return;
    }

    console.log('🌱 Seeding database with initial data...');
    
    // Create default CEO account
    const defaultCEO = {
      name: 'Md. Aminul Islam',
      role: 'CEO',
      join_date: '2022-01-15',
      salary: 200000,
      approved: true,
      email: 'iislamaminul@gmail.com',
      phone: '111-111-1111',
      password: '12345'
    };
    
    const { data: ceoResult, error: ceoError } = await supabase
      .from(TABLES.TEAMMATES)
      .insert([defaultCEO])
      .select()
      .single();
    
    if (ceoError) {
      console.error('❌ Failed to create default CEO:', ceoError);
      return;
    }
    
    console.log('✅ Default CEO account created:', ceoResult.name);
    
    // Initialize ERP Settings if they don't exist
    const { data: settingsExists } = await supabase
      .from(TABLES.ERP_SETTINGS)
      .select('id')
      .limit(1);
    
    if (!settingsExists || settingsExists.length === 0) {
      const defaultSettings = {
        company_name: 'WebWizBD ERP',
        daily_time_goal: 1.5,
        currency_symbol: '$',
        theme: 'dark',
        color_scheme: 'gold',
        divisions: ['UI Ux Design', 'Web Development', 'SEO', 'SMM', 'Content Writing'],
        roles: ['CEO', 'HR and Admin', 'SMM and Design Lead', 'Sales and PR Lead', 'Lead Web Developer', 'Lead SEO Expert', 'Content Writer', 'Developer', 'Designer']
      };
      
      const { error: settingsError } = await supabase
        .from(TABLES.ERP_SETTINGS)
        .insert([defaultSettings]);
      
      if (settingsError) {
        console.error('❌ Failed to create default settings:', settingsError);
      } else {
        console.log('✅ Default ERP settings created');
      }
    }
    
    // Create a welcome notification for the CEO
    const welcomeNotification = {
      user_id: ceoResult.id,
      message: 'Welcome to WebWizBD ERP! Your account has been set up successfully.',
      read: false,
      timestamp: new Date().toISOString()
    };
    
    const { error: notificationError } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .insert([welcomeNotification]);
    
    if (notificationError) {
      console.error('❌ Failed to create welcome notification:', notificationError);
    } else {
      console.log('✅ Welcome notification created');
    }
    
    console.log('🎉 Database initialization complete!');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  }
};
