import { supabase } from './supabase';
import { Task, TaskStatus } from '../types';
import { mapTask } from './mappers';

export class ArchiveService {
  /**
   * Auto-archive completed tasks that are older than 3 days
   * This function should be called periodically (e.g., daily via cron or on app startup)
   */
  static async autoArchiveCompletedTasks(): Promise<{ archivedCount: number; error?: string }> {
    try {
      console.log('🕒 Starting auto-archive process...');
      
      // Calculate the cutoff date (3 days ago)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 3);
      const cutoffISO = cutoffDate.toISOString();
      
      console.log(`📅 Auto-archiving tasks completed before: ${cutoffDate.toLocaleDateString()}`);
      
      // Find completed tasks that are older than 3 days and not yet archived
      const { data: tasksToArchive, error: fetchError } = await supabase
        .from('tasks')
        .select('id, title, completed_at, status')
        .eq('status', TaskStatus.Completed)
        .eq('archived', false)
        .lt('completed_at', cutoffISO);
      
      if (fetchError) {
        console.error('❌ Error fetching tasks for auto-archive:', fetchError);
        return { archivedCount: 0, error: fetchError.message };
      }
      
      if (!tasksToArchive || tasksToArchive.length === 0) {
        console.log('✅ No tasks found for auto-archiving');
        return { archivedCount: 0 };
      }
      
      console.log(`📦 Found ${tasksToArchive.length} tasks to auto-archive`);
      
      // Archive the tasks
      const taskIds = tasksToArchive.map(task => task.id);
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          archived: true,
          archived_at: new Date().toISOString()
        })
        .in('id', taskIds);
      
      if (updateError) {
        console.error('❌ Error auto-archiving tasks:', updateError);
        return { archivedCount: 0, error: updateError.message };
      }
      
      console.log(`✅ Successfully auto-archived ${tasksToArchive.length} tasks`);
      
      // Log the archived tasks for reference
      tasksToArchive.forEach(task => {
        console.log(`  📦 Archived: "${task.title}" (completed: ${new Date(task.completed_at).toLocaleDateString()})`);
      });
      
      return { archivedCount: tasksToArchive.length };
      
    } catch (error) {
      console.error('❌ Unexpected error in auto-archive process:', error);
      return { archivedCount: 0, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  /**
   * Manually archive a specific task
   */
  static async archiveTask(taskId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📦 Manually archiving task: ${taskId}`);
      
      const { data, error } = await supabase
        .from('tasks')
        .update({
          archived: true,
          archived_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error archiving task:', error);
        return { success: false, error: error.message };
      }
      
      console.log(`✅ Successfully archived task: "${data.title}"`);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Unexpected error archiving task:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  /**
   * Unarchive a task (restore it to active status)
   */
  static async unarchiveTask(taskId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📤 Unarchiving task: ${taskId}`);
      
      const { data, error } = await supabase
        .from('tasks')
        .update({
          archived: false,
          archived_at: null
        })
        .eq('id', taskId)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error unarchiving task:', error);
        return { success: false, error: error.message };
      }
      
      console.log(`✅ Successfully unarchived task: "${data.title}"`);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Unexpected error unarchiving task:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  /**
   * Get all archived tasks
   */
  static async getArchivedTasks(): Promise<{ tasks: Task[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('archived', true)
        .order('archived_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching archived tasks:', error);
        return { tasks: [], error: error.message };
      }
      
      const tasks = (data || []).map(mapTask);
      return { tasks };
      
    } catch (error) {
      console.error('❌ Unexpected error fetching archived tasks:', error);
      return { tasks: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  /**
   * Get active (non-archived) tasks
   */
  static async getActiveTasks(): Promise<{ tasks: Task[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching active tasks:', error);
        return { tasks: [], error: error.message };
      }
      
      const tasks = (data || []).map(mapTask);
      return { tasks };
      
    } catch (error) {
      console.error('❌ Unexpected error fetching active tasks:', error);
      return { tasks: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  /**
   * Update task to set completed_at timestamp when status changes to Completed
   * This should be called whenever a task status is updated
   */
  static async updateTaskCompletedAt(taskId: string, newStatus: TaskStatus): Promise<void> {
    try {
      if (newStatus === TaskStatus.Completed) {
        // Set completed_at when task is completed
        await supabase
          .from('tasks')
          .update({ 
            completed_at: new Date().toISOString() 
          })
          .eq('id', taskId);
        
        console.log(`✅ Set completed_at timestamp for task: ${taskId}`);
      } else {
        // Clear completed_at if task is moved back from completed status
        const { data: currentTask } = await supabase
          .from('tasks')
          .select('status, completed_at')
          .eq('id', taskId)
          .single();
        
        if (currentTask?.status === TaskStatus.Completed && currentTask.completed_at) {
          await supabase
            .from('tasks')
            .update({ 
              completed_at: null 
            })
            .eq('id', taskId);
          
          console.log(`🔄 Cleared completed_at timestamp for task: ${taskId}`);
        }
      }
    } catch (error) {
      console.error('❌ Error updating completed_at timestamp:', error);
    }
  }
  
  /**
   * Get tasks that will be auto-archived soon (within next 24 hours)
   * Useful for showing warnings to users
   */
  static async getTasksNearAutoArchive(): Promise<{ tasks: Task[]; error?: string }> {
    try {
      // Calculate tomorrow (tasks completed before tomorrow will be auto-archived in next run)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Calculate 3 days ago from tomorrow 
      const cutoffDate = new Date(tomorrow);
      cutoffDate.setDate(cutoffDate.getDate() - 3);
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', TaskStatus.Completed)
        .eq('archived', false)
        .lt('completed_at', tomorrow.toISOString())
        .gte('completed_at', cutoffDate.toISOString());
      
      if (error) {
        console.error('❌ Error fetching tasks near auto-archive:', error);
        return { tasks: [], error: error.message };
      }
      
      const tasks = (data || []).map(mapTask);
      return { tasks };
      
    } catch (error) {
      console.error('❌ Unexpected error fetching tasks near auto-archive:', error);
      return { tasks: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  /**
   * Get archive statistics
   */
  static async getArchiveStats(): Promise<{
    totalArchived: number;
    archivedThisWeek: number;
    archivedThisMonth: number;
    error?: string;
  }> {
    try {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      // Get total archived count
      const { count: totalArchived, error: totalError } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('archived', true);
      
      if (totalError) throw totalError;
      
      // Get archived this week
      const { count: archivedThisWeek, error: weekError } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('archived', true)
        .gte('archived_at', oneWeekAgo.toISOString());
      
      if (weekError) throw weekError;
      
      // Get archived this month
      const { count: archivedThisMonth, error: monthError } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('archived', true)
        .gte('archived_at', oneMonthAgo.toISOString());
      
      if (monthError) throw monthError;
      
      return {
        totalArchived: totalArchived || 0,
        archivedThisWeek: archivedThisWeek || 0,
        archivedThisMonth: archivedThisMonth || 0
      };
      
    } catch (error) {
      console.error('❌ Error getting archive stats:', error);
      return {
        totalArchived: 0,
        archivedThisWeek: 0,
        archivedThisMonth: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
