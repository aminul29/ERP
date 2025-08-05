import { supabase, TABLES } from './supabase';
import { 
  Teammate, Client, Project, Task, TimeLog, Salary, 
  Notification, Attendance, Comment, PendingUpdate, ErpSettings 
} from '../types';
import {
  mapTeammate, mapClient, mapProject, mapTask, mapTimeLog,
  mapSalary, mapNotification, mapAttendance, mapComment,
  mapPendingUpdate, mapErpSettings
} from './mappers';

// Utility function to handle Supabase responses
const handleResponse = <T>(data: T[] | null, error: any): T[] => {
  if (error) {
    console.error('Database error:', error);
    throw error;
  }
  return data || [];
};

const handleSingleResponse = <T>(data: T | null, error: any): T | null => {
  if (error) {
    console.error('Database error:', error);
    throw error;
  }
  return data;
};

// Teammates
export const teammatesApi = {
  async getAll(): Promise<Teammate[]> {
    const { data, error } = await supabase
      .from(TABLES.TEAMMATES)
      .select('*')
      .order('created_at', { ascending: false });
    const rawData = handleResponse(data, error);
    return rawData.map(mapTeammate);
  },

  async create(teammate: Omit<Teammate, 'id'>): Promise<Teammate> {
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
    const rawData = handleSingleResponse(data, error)!;
    return mapTeammate(rawData);
  },

  async update(id: string, updates: Partial<Teammate>): Promise<Teammate> {
    const { data, error } = await supabase
      .from(TABLES.TEAMMATES)
      .update({
        name: updates.name,
        role: updates.role,
        join_date: updates.joinDate,
        salary: updates.salary,
        approved: updates.approved,
        email: updates.email,
        phone: updates.phone,
        avatar: updates.avatar,
        password: updates.password
      })
      .eq('id', id)
      .select()
      .single();
    return handleSingleResponse(data, error)!;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.TEAMMATES)
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// Clients
export const clientsApi = {
  async getAll(): Promise<Client[]> {
    const { data, error } = await supabase
      .from(TABLES.CLIENTS)
      .select('*')
      .order('created_at', { ascending: false });
    return handleResponse(data, error);
  },

  async create(client: Omit<Client, 'id'>): Promise<Client> {
    const { data, error } = await supabase
      .from(TABLES.CLIENTS)
      .insert([{
        name: client.name,
        contact_person: client.contactPerson,
        email: client.email,
        phone: client.phone
      }])
      .select()
      .single();
    return handleSingleResponse(data, error)!;
  },

  async update(id: string, updates: Partial<Client>): Promise<Client> {
    const { data, error } = await supabase
      .from(TABLES.CLIENTS)
      .update({
        name: updates.name,
        contact_person: updates.contactPerson,
        email: updates.email,
        phone: updates.phone
      })
      .eq('id', id)
      .select()
      .single();
    return handleSingleResponse(data, error)!;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.CLIENTS)
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// Projects
export const projectsApi = {
  async getAll(): Promise<Project[]> {
    const { data, error } = await supabase
      .from(TABLES.PROJECTS)
      .select('*')
      .order('created_at', { ascending: false });
    return handleResponse(data, error);
  },

  async create(project: Omit<Project, 'id'>): Promise<Project> {
    const { data, error } = await supabase
      .from(TABLES.PROJECTS)
      .insert([{
        name: project.name,
        description: project.description,
        client_id: project.clientId,
        start_date: project.startDate,
        end_date: project.endDate,
        allocated_time_in_seconds: project.allocatedTimeInSeconds,
        priority: project.priority,
        divisions: project.divisions,
        team_member_ids: project.teamMemberIds,
        created_by_id: project.createdById,
        ratings: project.ratings || {},
        acceptance: project.acceptance || {}
      }])
      .select()
      .single();
    return handleSingleResponse(data, error)!;
  },

  async update(id: string, updates: Partial<Project>): Promise<Project> {
    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.description) updateData.description = updates.description;
    if (updates.clientId) updateData.client_id = updates.clientId;
    if (updates.startDate) updateData.start_date = updates.startDate;
    if (updates.endDate) updateData.end_date = updates.endDate;
    if (updates.allocatedTimeInSeconds) updateData.allocated_time_in_seconds = updates.allocatedTimeInSeconds;
    if (updates.priority) updateData.priority = updates.priority;
    if (updates.divisions) updateData.divisions = updates.divisions;
    if (updates.teamMemberIds) updateData.team_member_ids = updates.teamMemberIds;
    if (updates.ratings) updateData.ratings = updates.ratings;
    if (updates.acceptance) updateData.acceptance = updates.acceptance;

    const { data, error } = await supabase
      .from(TABLES.PROJECTS)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    return handleSingleResponse(data, error)!;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.PROJECTS)
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// Tasks
export const tasksApi = {
  async getAll(): Promise<Task[]> {
    const { data, error } = await supabase
      .from(TABLES.TASKS)
      .select('*')
      .order('created_at', { ascending: false });
    return handleResponse(data, error);
  },

  async create(task: Omit<Task, 'id'>): Promise<Task> {
    const { data, error } = await supabase
      .from(TABLES.TASKS)
      .insert([{
        title: task.title,
        description: task.description,
        status: task.status,
        deadline: task.deadline,
        priority: task.priority,
        project_id: task.projectId,
        client_id: task.clientId,
        divisions: task.divisions,
        assigned_to_id: task.assignedToId,
        assigned_by_id: task.assignedById,
        completion_report: task.completionReport,
        work_experience: task.workExperience,
        suggestions: task.suggestions,
        completion_files: task.completionFiles,
        allocated_time_in_seconds: task.allocatedTimeInSeconds,
        time_spent_seconds: task.timeSpentSeconds,
        timer_start_time: task.timerStartTime,
        ratings: task.ratings || {}
      }])
      .select()
      .single();
    return handleSingleResponse(data, error)!;
  },

  async update(id: string, updates: Partial<Task>): Promise<Task> {
    const updateData: any = {};
    if (updates.title) updateData.title = updates.title;
    if (updates.description) updateData.description = updates.description;
    if (updates.status) updateData.status = updates.status;
    if (updates.deadline) updateData.deadline = updates.deadline;
    if (updates.priority) updateData.priority = updates.priority;
    if (updates.projectId) updateData.project_id = updates.projectId;
    if (updates.clientId) updateData.client_id = updates.clientId;
    if (updates.divisions) updateData.divisions = updates.divisions;
    if (updates.assignedToId) updateData.assigned_to_id = updates.assignedToId;
    if (updates.assignedById) updateData.assigned_by_id = updates.assignedById;
    if (updates.completionReport) updateData.completion_report = updates.completionReport;
    if (updates.workExperience) updateData.work_experience = updates.workExperience;
    if (updates.suggestions) updateData.suggestions = updates.suggestions;
    if (updates.completionFiles) updateData.completion_files = updates.completionFiles;
    if (updates.allocatedTimeInSeconds !== undefined) updateData.allocated_time_in_seconds = updates.allocatedTimeInSeconds;
    if (updates.timeSpentSeconds !== undefined) updateData.time_spent_seconds = updates.timeSpentSeconds;
    if (updates.timerStartTime) updateData.timer_start_time = updates.timerStartTime;
    if (updates.ratings) updateData.ratings = updates.ratings;

    const { data, error } = await supabase
      .from(TABLES.TASKS)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    return handleSingleResponse(data, error)!;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.TASKS)
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// Time Logs
export const timeLogsApi = {
  async getAll(): Promise<TimeLog[]> {
    const { data, error } = await supabase
      .from(TABLES.TIME_LOGS)
      .select('*')
      .order('date', { ascending: false });
    return handleResponse(data, error);
  },

  async create(timeLog: Omit<TimeLog, 'id'>): Promise<TimeLog> {
    const { data, error } = await supabase
      .from(TABLES.TIME_LOGS)
      .insert([{
        teammate_id: timeLog.teammateId,
        date: timeLog.date,
        hours: timeLog.hours
      }])
      .select()
      .single();
    return handleSingleResponse(data, error)!;
  }
};

// Salaries
export const salariesApi = {
  async getAll(): Promise<Salary[]> {
    const { data, error } = await supabase
      .from(TABLES.SALARIES)
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false });
    return handleResponse(data, error);
  },

  async create(salary: Omit<Salary, 'id'>): Promise<Salary> {
    const { data, error } = await supabase
      .from(TABLES.SALARIES)
      .insert([{
        teammate_id: salary.teammateId,
        month: salary.month,
        year: salary.year,
        amount: salary.amount,
        status: salary.status
      }])
      .select()
      .single();
    return handleSingleResponse(data, error)!;
  },

  async update(id: string, updates: Partial<Salary>): Promise<Salary> {
    const { data, error } = await supabase
      .from(TABLES.SALARIES)
      .update({
        teammate_id: updates.teammateId,
        month: updates.month,
        year: updates.year,
        amount: updates.amount,
        status: updates.status
      })
      .eq('id', id)
      .select()
      .single();
    return handleSingleResponse(data, error)!;
  }
};

// Notifications
export const notificationsApi = {
  async getAll(): Promise<Notification[]> {
    const { data, error } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .select('*')
      .order('created_at', { ascending: false });
    return handleResponse(data, error);
  },

  async create(notification: Omit<Notification, 'id' | 'timestamp'>): Promise<Notification> {
    const { data, error } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .insert([{
        user_id: notification.userId,
        message: notification.message,
        read: notification.read,
        link: notification.link
      }])
      .select()
      .single();
    return handleSingleResponse(data, error)!;
  },

  async update(id: string, updates: Partial<Notification>): Promise<Notification> {
    const { data, error } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .update({
        read: updates.read,
        message: updates.message,
        link: updates.link
      })
      .eq('id', id)
      .select()
      .single();
    return handleSingleResponse(data, error)!;
  }
};

// Attendance
export const attendanceApi = {
  async getAll(): Promise<Attendance[]> {
    const { data, error } = await supabase
      .from(TABLES.ATTENDANCE)
      .select('*')
      .order('date', { ascending: false });
    return handleResponse(data, error);
  },

  async create(attendance: Omit<Attendance, 'id'>): Promise<Attendance> {
    const { data, error } = await supabase
      .from(TABLES.ATTENDANCE)
      .insert([{
        teammate_id: attendance.teammateId,
        date: attendance.date,
        status: attendance.status,
        check_in_time: attendance.checkInTime,
        check_out_time: attendance.checkOutTime
      }])
      .select()
      .single();
    return handleSingleResponse(data, error)!;
  },

  async update(id: string, updates: Partial<Attendance>): Promise<Attendance> {
    const { data, error } = await supabase
      .from(TABLES.ATTENDANCE)
      .update({
        status: updates.status,
        check_in_time: updates.checkInTime,
        check_out_time: updates.checkOutTime
      })
      .eq('id', id)
      .select()
      .single();
    return handleSingleResponse(data, error)!;
  }
};

// Comments
export const commentsApi = {
  async getAll(): Promise<Comment[]> {
    const { data, error } = await supabase
      .from(TABLES.COMMENTS)
      .select('*')
      .order('created_at', { ascending: true });
    return handleResponse(data, error);
  },

  async create(comment: Omit<Comment, 'id' | 'timestamp'>): Promise<Comment> {
    const { data, error } = await supabase
      .from(TABLES.COMMENTS)
      .insert([{
        parent_id: comment.parentId,
        author_id: comment.authorId,
        text: comment.text
      }])
      .select()
      .single();
    return handleSingleResponse(data, error)!;
  }
};

// Pending Updates
export const pendingUpdatesApi = {
  async getAll(): Promise<PendingUpdate[]> {
    const { data, error } = await supabase
      .from(TABLES.PENDING_UPDATES)
      .select('*')
      .order('requested_at', { ascending: false });
    return handleResponse(data, error);
  },

  async create(update: Omit<PendingUpdate, 'id'>): Promise<PendingUpdate> {
    const { data, error } = await supabase
      .from(TABLES.PENDING_UPDATES)
      .insert([{
        type: update.type,
        item_id: update.itemId,
        requested_by: update.requestedBy,
        requester_name: update.requesterName,
        data: update.data,
        original_data: update.originalData,
        status: update.status
      }])
      .select()
      .single();
    return handleSingleResponse(data, error)!;
  },

  async update(id: string, updates: Partial<PendingUpdate>): Promise<PendingUpdate> {
    const { data, error } = await supabase
      .from(TABLES.PENDING_UPDATES)
      .update({
        status: updates.status,
        resolved_at: updates.resolvedAt,
        resolved_by: updates.resolvedBy
      })
      .eq('id', id)
      .select()
      .single();
    return handleSingleResponse(data, error)!;
  }
};

// ERP Settings
export const erpSettingsApi = {
  async get(): Promise<ErpSettings | null> {
    const { data, error } = await supabase
      .from(TABLES.ERP_SETTINGS)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    return handleSingleResponse(data, error);
  },

  async update(settings: ErpSettings): Promise<ErpSettings> {
    const { data, error } = await supabase
      .from(TABLES.ERP_SETTINGS)
      .update({
        company_name: settings.companyName,
        daily_time_goal: settings.dailyTimeGoal,
        currency_symbol: settings.currencySymbol,
        theme: settings.theme,
        color_scheme: settings.colorScheme,
        divisions: settings.divisions,
        roles: settings.roles
      })
      .order('created_at', { ascending: false })
      .limit(1)
      .select()
      .single();
    return handleSingleResponse(data, error)!;
  }
};
