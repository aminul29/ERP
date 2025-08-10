// lib/db-operations.ts
// This service handles all CRUD operations for the ERP system

import { 
  Client, Teammate, Project, Task, TimeLog, Salary, Notification, 
  Attendance, ErpSettings, Comment, PendingUpdate, Announcement 
} from '../types';
import { supabase } from './supabase';
import { mapTeammate, mapClient, mapProject, mapTask, 
         mapTimeLog, mapSalary, mapNotification, mapAttendance, 
         mapComment, mapPendingUpdate, mapAnnouncement } from './mappers';

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
        work_experience: task.workExperience,
        suggestions: task.suggestions,
        completion_files: task.completionFiles || [],
        drive_link: task.driveLink,
        allocated_time_in_seconds: task.allocatedTimeInSeconds,
        time_spent_seconds: Math.round(task.timeSpentSeconds || 0),
        timer_start_time: task.timerStartTime,
        revision_note: task.revisionNote,
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
      const updateData: any = {
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
        work_experience: task.workExperience,
        suggestions: task.suggestions,
        completion_files: task.completionFiles || [],
        drive_link: task.driveLink,
        allocated_time_in_seconds: task.allocatedTimeInSeconds,
        time_spent_seconds: Math.round(task.timeSpentSeconds || 0),
        timer_start_time: task.timerStartTime ?? null,
        revision_note: task.revisionNote,
        ratings: task.ratings || {}
      };
      
      // Handle archive-related fields
      if (task.archived !== undefined) {
        updateData.archived = task.archived;
      }
      if (task.archivedAt !== undefined) {
        updateData.archived_at = task.archivedAt;
      }
      if (task.completedAt !== undefined) {
        updateData.completed_at = task.completedAt;
      }
      
      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
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
          text: comment.text
          // Let database handle created_at timestamp automatically
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

  static async updateComment(comment: Comment): Promise<Comment | null> {
    try {
      console.log('🔄 Updating comment in database:', comment.id);
      console.log('📋 Comment data to update:', comment);
      
      const updateData: any = {
        text: comment.text
      };
      
      // Include readBy if it exists
      if (comment.readBy !== undefined) {
        updateData.read_by = comment.readBy;
        console.log('📖 Updating readBy field:', comment.readBy);
      }
      
      const { data, error } = await supabase
        .from('comments')
        .update(updateData)
        .eq('id', comment.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Database error updating comment:', error);
        throw error;
      }
      
      console.log('✅ Comment update successful:', data);
      return mapComment(data);
    } catch (error) {
      console.error('Error updating comment:', error);
      return null;
    }
  }

  static async deleteComment(commentId: string): Promise<boolean> {
    try {
      console.log('🗑️ Deleting comment from database:', commentId);
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error('❌ Database error deleting comment:', error);
        throw error;
      }
      
      console.log('✅ Comment deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
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

  // ANNOUNCEMENTS OPERATIONS
  static async createAnnouncement(announcement: Omit<Announcement, 'id' | 'createdAt' | 'viewedBy'>): Promise<Announcement | null> {
    try {
      console.log('📝 Creating announcement with data:', announcement);
      
      const insertData = {
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority,
        target_audience: announcement.targetAudience,
        target_roles: announcement.targetRoles || [],
        created_by: announcement.createdBy,
        expires_at: announcement.expiresAt || null,
        is_active: announcement.isActive,
        viewed_by: [] // Start with empty array
      };
      
      console.log('📤 Sending announcement to database:', insertData);
      
      const { data, error } = await supabase
        .from('announcements')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }
      
      console.log('✅ Announcement database response:', data);
      const mappedData = mapAnnouncement(data);
      console.log('🗺️ Mapped announcement:', mappedData);
      
      return mappedData;
    } catch (error) {
      console.error('Error creating announcement:', error);
      return null;
    }
  }

  static async updateAnnouncement(announcement: Announcement): Promise<Announcement | null> {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .update({
          title: announcement.title,
          content: announcement.content,
          priority: announcement.priority,
          target_audience: announcement.targetAudience,
          target_roles: announcement.targetRoles || [],
          expires_at: announcement.expiresAt || null,
          is_active: announcement.isActive,
          viewed_by: announcement.viewedBy
        })
        .eq('id', announcement.id)
        .select()
        .single();

      if (error) throw error;
      return mapAnnouncement(data);
    } catch (error) {
      console.error('Error updating announcement:', error);
      return null;
    }
  }

  static async deleteAnnouncement(announcementId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcementId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting announcement:', error);
      return false;
    }
  }

  static async markAnnouncementAsViewed(announcementId: string, userId: string): Promise<Announcement | null> {
    try {
      // First get the current announcement
      const { data: currentAnnouncement, error: fetchError } = await supabase
        .from('announcements')
        .select('viewed_by')
        .eq('id', announcementId)
        .single();

      if (fetchError) throw fetchError;

      // Add user to viewed_by array if not already present
      const viewedBy = currentAnnouncement.viewed_by || [];
      if (!viewedBy.includes(userId)) {
        viewedBy.push(userId);

        const { data, error } = await supabase
          .from('announcements')
          .update({ viewed_by: viewedBy })
          .eq('id', announcementId)
          .select()
          .single();

        if (error) throw error;
        return mapAnnouncement(data);
      }

      // Return current data if user already viewed
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('id', announcementId)
        .single();

      if (error) throw error;
      return mapAnnouncement(data);
    } catch (error) {
      console.error('Error marking announcement as viewed:', error);
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
