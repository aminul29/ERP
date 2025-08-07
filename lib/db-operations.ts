// lib/db-operations.ts
// This service handles all CRUD operations for the ERP system

import { 
  Client, Teammate, Project, Task, TimeLog, Salary, Notification, 
  Attendance, ErpSettings, Comment, PendingUpdate 
} from '../types';
import { supabase } from './supabase';
import { mapTeammate, mapClient, mapProject, mapTask, 
         mapTimeLog, mapSalary, mapNotification, mapAttendance, 
         mapComment, mapPendingUpdate } from './mappers';

export class DatabaseOperations {
  // TEAMMATES OPERATIONS
  static async createTeammate(teammate: Omit<Teammate, 'id'>): Promise<Teammate | null> {
    try {
      console.log('📝 Creating teammate with data:', teammate);
      
      const insertData = {
        name: teammate.name,
        role: teammate.role,
        join_date: teammate.joinDate,
        salary: teammate.salary,
        approved: teammate.approved,
        email: teammate.email,
        phone: teammate.phone,
        password: teammate.password
      };
      
      console.log('📤 Sending to database:', insertData);
      
      const { data, error } = await supabase
        .from('teammates')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }
      
      console.log('✅ Database response:', data);
      const mappedData = mapTeammate(data);
      console.log('🗺️ Mapped teammate:', mappedData);
      
      return mappedData;
    } catch (error) {
      console.error('Error creating teammate:', error);
      return null;
    }
  }

  static async updateTeammate(teammate: Teammate): Promise<Teammate | null> {
    try {
      const { data, error } = await supabase
        .from('teammates')
        .update({
          name: teammate.name,
          role: teammate.role,
          join_date: teammate.joinDate,
          salary: teammate.salary,
          approved: teammate.approved,
          email: teammate.email,
          phone: teammate.phone,
          password: teammate.password
        })
        .eq('id', teammate.id)
        .select()
        .single();

      if (error) throw error;
      return mapTeammate(data);
    } catch (error) {
      console.error('Error updating teammate:', error);
      return null;
    }
  }

  static async deleteTeammate(teammateId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('teammates')
        .delete()
        .eq('id', teammateId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting teammate:', error);
      return false;
    }
  }

  // CLIENTS OPERATIONS
  static async createClient(client: Omit<Client, 'id'>): Promise<Client | null> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([{
          name: client.name,
          contact_person: client.contactPerson,
          email: client.email,
          phone: client.phone
        }])
        .select()
        .single();

      if (error) throw error;
      return mapClient(data);
    } catch (error) {
      console.error('Error creating client:', error);
      return null;
    }
  }

  static async updateClient(client: Client): Promise<Client | null> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update({
          name: client.name,
          contact_person: client.contactPerson,
          email: client.email,
          phone: client.phone
        })
        .eq('id', client.id)
        .select()
        .single();

      if (error) throw error;
      return mapClient(data);
    } catch (error) {
      console.error('Error updating client:', error);
      return null;
    }
  }

  static async deleteClient(clientId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting client:', error);
      return false;
    }
  }

  // PROJECTS OPERATIONS
  static async createProject(project: Omit<Project, 'id'>): Promise<Project | null> {
    try {
      const { data, error } = await supabase
        .from('projects')
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

      if (error) throw error;
      return mapProject(data);
    } catch (error) {
      console.error('Error creating project:', error);
      return null;
    }
  }

  static async updateProject(project: Project): Promise<Project | null> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({
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
        })
        .eq('id', project.id)
        .select()
        .single();

      if (error) throw error;
      return mapProject(data);
    } catch (error) {
      console.error('Error updating project:', error);
      return null;
    }
  }

  // TASKS OPERATIONS
  static async createTask(task: Omit<Task, 'id'>): Promise<Task | null> {
    try {
      console.log('🔍 createTask input:', task);
      
      // Helper function to validate UUID or convert to null
      const validateUUID = (id: string | undefined | null): string | null => {
        if (!id || id.trim() === '') return null;
        // Check if it's a hardcoded ID pattern (like 'cli1', 'proj1', 'emp1', etc.)
        if (/^(cli|proj|emp|task|notif|att|sal|log)\d+$/.test(id)) {
          console.warn(`⚠️ Converting hardcoded ID '${id}' to null`);
          return null;
        }
        // Basic UUID format check
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
          console.warn(`⚠️ Invalid UUID format '${id}', converting to null`);
          return null;
        }
        return id;
      };
      
      const insertData = {
        title: task.title,
        description: task.description,
        project_id: validateUUID(task.projectId),
        client_id: validateUUID(task.clientId),
        divisions: task.divisions,
        assigned_to_id: task.assignedToId, // This should be valid from database-loaded teammates
        assigned_by_id: task.assignedById, // This should be valid from database-loaded teammates
        status: task.status,
        deadline: task.deadline,
        priority: task.priority,
        completion_report: task.completionReport,
        allocated_time_in_seconds: task.allocatedTimeInSeconds,
        time_spent_seconds: Math.round(task.timeSpentSeconds || 0),
        timer_start_time: task.timerStartTime,
        ratings: task.ratings || {}
      };
      
      console.log('📤 createTask database insert data:', insertData);
      
      const { data, error } = await supabase
        .from('tasks')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      return mapTask(data);
    } catch (error) {
      console.error('Error creating task:', error);
      return null;
    }
  }

  static async updateTask(task: Task): Promise<Task | null> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          title: task.title,
          description: task.description,
          project_id: task.projectId || null,
          client_id: task.clientId || null,
          divisions: task.divisions,
          assigned_to_id: task.assignedToId,
          assigned_by_id: task.assignedById,
          status: task.status,
          deadline: task.deadline,
          priority: task.priority,
          completion_report: task.completionReport,
          allocated_time_in_seconds: task.allocatedTimeInSeconds,
          time_spent_seconds: Math.round(task.timeSpentSeconds || 0),
          timer_start_time: task.timerStartTime ?? null,
          ratings: task.ratings || {}
        })
        .eq('id', task.id)
        .select()
        .single();

      if (error) throw error;
      return mapTask(data);
    } catch (error) {
      console.error('Error updating task:', error);
      return null;
    }
  }

  static async deleteTask(taskId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  }

  // TIME LOGS OPERATIONS
  static async createTimeLog(timeLog: Omit<TimeLog, 'id'>): Promise<TimeLog | null> {
    try {
      const { data, error } = await supabase
        .from('time_logs')
        .insert([{
          teammate_id: timeLog.teammateId,
          date: timeLog.date,
          hours: timeLog.hours
        }])
        .select()
        .single();

      if (error) throw error;
      return mapTimeLog(data);
    } catch (error) {
      console.error('Error creating time log:', error);
      return null;
    }
  }

  // SALARIES OPERATIONS
  static async createSalary(salary: Omit<Salary, 'id'>): Promise<Salary | null> {
    try {
      const { data, error } = await supabase
        .from('salaries')
        .insert([{
          teammate_id: salary.teammateId,
          month: salary.month,
          year: salary.year,
          amount: salary.amount,
          status: salary.status
        }])
        .select()
        .single();

      if (error) throw error;
      return mapSalary(data);
    } catch (error) {
      console.error('Error creating salary:', error);
      return null;
    }
  }

  static async updateSalary(salary: Salary): Promise<Salary | null> {
    try {
      const { data, error } = await supabase
        .from('salaries')
        .update({
          teammate_id: salary.teammateId,
          month: salary.month,
          year: salary.year,
          amount: salary.amount,
          status: salary.status
        })
        .eq('id', salary.id)
        .select()
        .single();

      if (error) throw error;
      return mapSalary(data);
    } catch (error) {
      console.error('Error updating salary:', error);
      return null;
    }
  }

  // NOTIFICATIONS OPERATIONS
  static async createNotification(notification: Omit<Notification, 'id' | 'timestamp'>): Promise<Notification | null> {
    try {
      const insertData = {
        user_id: notification.userId,
        message: notification.message,
        read: notification.read,
        link: notification.link
        // Let database handle timestamp with created_at
      };
      
      const { data, error } = await supabase
        .from('notifications')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('❌ Database error creating notification:', error);
        throw error;
      }
      
      return mapNotification(data);
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  static async updateNotification(notification: Notification): Promise<Notification | null> {
    try {
      console.log('🔄 Updating notification in database:', notification.id);
      const { data, error } = await supabase
        .from('notifications')
        .update({
          user_id: notification.userId,
          message: notification.message,
          read: notification.read,
          link: notification.link
          // Don't update timestamp/created_at - it's a creation timestamp
        })
        .eq('id', notification.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Database error updating notification:', error);
        throw error;
      }
      
      console.log('✅ Database update successful:', data);
      return mapNotification(data);
    } catch (error) {
      console.error('Error updating notification:', error);
      return null;
    }
  }

  // ATTENDANCE OPERATIONS
  static async createAttendance(attendance: Omit<Attendance, 'id'>): Promise<Attendance | null> {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .insert([{
          teammate_id: attendance.teammateId,
          date: attendance.date,
          status: attendance.status,
          check_in_time: attendance.checkInTime,
          check_out_time: attendance.checkOutTime
        }])
        .select()
        .single();

      if (error) throw error;
      return mapAttendance(data);
    } catch (error) {
      console.error('Error creating attendance:', error);
      return null;
    }
  }

  static async updateAttendance(attendance: Attendance): Promise<Attendance | null> {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .update({
          teammate_id: attendance.teammateId,
          date: attendance.date,
          status: attendance.status,
          check_in_time: attendance.checkInTime,
          check_out_time: attendance.checkOutTime
        })
        .eq('id', attendance.id)
        .select()
        .single();

      if (error) throw error;
      return mapAttendance(data);
    } catch (error) {
      console.error('Error updating attendance:', error);
      return null;
    }
  }

  // COMMENTS OPERATIONS
  static async createComment(comment: Omit<Comment, 'id' | 'timestamp'>): Promise<Comment | null> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([{
          parent_id: comment.parentId,
          author_id: comment.authorId,
          text: comment.text,
          timestamp: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return mapComment(data);
    } catch (error) {
      console.error('Error creating comment:', error);
      return null;
    }
  }

  // PENDING UPDATES OPERATIONS
  static async createPendingUpdate(update: Omit<PendingUpdate, 'id'>): Promise<PendingUpdate | null> {
    try {
      const { data, error } = await supabase
        .from('pending_updates')
        .insert([{
          type: update.type,
          item_id: update.itemId,
          requested_by: update.requestedBy,
          requester_name: update.requesterName,
          requested_at: update.requestedAt,
          data: update.data,
          original_data: update.originalData,
          status: update.status,
          resolved_at: update.resolvedAt,
          resolved_by: update.resolvedBy
        }])
        .select()
        .single();

      if (error) throw error;
      return mapPendingUpdate(data);
    } catch (error) {
      console.error('Error creating pending update:', error);
      return null;
    }
  }

  static async updatePendingUpdate(update: PendingUpdate): Promise<PendingUpdate | null> {
    try {
      const { data, error } = await supabase
        .from('pending_updates')
        .update({
          type: update.type,
          item_id: update.itemId,
          requested_by: update.requestedBy,
          requester_name: update.requesterName,
          requested_at: update.requestedAt,
          data: update.data,
          original_data: update.originalData,
          status: update.status,
          resolved_at: update.resolvedAt,
          resolved_by: update.resolvedBy
        })
        .eq('id', update.id)
        .select()
        .single();

      if (error) throw error;
      return mapPendingUpdate(data);
    } catch (error) {
      console.error('Error updating pending update:', error);
      return null;
    }
  }

  // ERP SETTINGS OPERATIONS
  static async updateErpSettings(settings: ErpSettings): Promise<ErpSettings | null> {
    try {
      // First try to get existing settings
      const { data: existingSettings } = await supabase
        .from('erp_settings')
        .select('id')
        .limit(1)
        .single();

      let data, error;
      
      if (existingSettings) {
        // Update existing record
        const result = await supabase
          .from('erp_settings')
          .update({
            company_name: settings.companyName,
            daily_time_goal: settings.dailyTimeGoal,
            currency_symbol: settings.currencySymbol,
            theme: settings.theme,
            color_scheme: settings.colorScheme,
            divisions: settings.divisions,
            roles: settings.roles
          })
          .eq('id', existingSettings.id)
          .select()
          .single();
        data = result.data;
        error = result.error;
      } else {
        // Insert new record
        const result = await supabase
          .from('erp_settings')
          .insert([{
            company_name: settings.companyName,
            daily_time_goal: settings.dailyTimeGoal,
            currency_symbol: settings.currencySymbol,
            theme: settings.theme,
            color_scheme: settings.colorScheme,
            divisions: settings.divisions,
            roles: settings.roles
          }])
          .select()
          .single();
        data = result.data;
        error = result.error;
      }

      if (error) throw error;
      return {
        companyName: data.company_name,
        dailyTimeGoal: data.daily_time_goal,
        currencySymbol: data.currency_symbol,
        theme: data.theme,
        colorScheme: data.color_scheme,
        divisions: data.divisions,
        roles: data.roles
      };
    } catch (error) {
      console.error('Error updating ERP settings:', error);
      return null;
    }
  }
}
