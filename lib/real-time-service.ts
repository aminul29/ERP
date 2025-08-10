// lib/real-time-service.ts
// Centralized service for managing real-time subscriptions across all task-related features

import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, TABLES } from './supabase';
import { Task, Comment, Notification, Teammate, TaskStatus, TaskPriority } from '../types';

export interface RealtimeSubscriptionHandlers {
  onTaskInserted?: (task: Task) => void;
  onTaskUpdated?: (task: Task) => void;
  onTaskDeleted?: (taskId: string) => void;
  onCommentInserted?: (comment: Comment) => void;
  onCommentUpdated?: (comment: Comment) => void;
  onCommentDeleted?: (commentId: string) => void;
  onNotificationInserted?: (notification: Notification) => void;
  onNotificationUpdated?: (notification: Notification) => void;
  onNotificationDeleted?: (notificationId: string) => void;
}

export class RealtimeService {
  private static instance: RealtimeService;
  private subscriptions: Map<string, RealtimeChannel> = new Map();
  
  private constructor() {}
  
  static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }
  
  // Subscribe to all task-related changes
  subscribeToTaskChanges(handlers: RealtimeSubscriptionHandlers): string {
    const channelName = `task-changes-${Date.now()}`;
    console.log('🔄 Setting up real-time task subscription:', channelName);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.TASKS
        },
        (payload) => {
          console.log('📋 Real-time task change:', payload);
          this.handleTaskChange(payload, handlers);
        }
      )
      .subscribe((status) => {
        console.log(`📡 Task subscription status: ${status} for channel: ${channelName}`);
      });
    
    this.subscriptions.set(channelName, channel);
    return channelName;
  }
  
  // Subscribe to comment changes for specific parent (task/project)
  subscribeToComments(parentId: string, handlers: RealtimeSubscriptionHandlers): string {
    const channelName = `comments-${parentId}-${Date.now()}`;
    console.log('🔄 Setting up real-time comments subscription for parent:', parentId);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.COMMENTS,
          filter: `parent_id=eq.${parentId}`
        },
        (payload) => {
          console.log('💬 Real-time comment change:', payload);
          this.handleCommentChange(payload, handlers);
        }
      )
      .subscribe((status) => {
        console.log(`📡 Comments subscription status: ${status} for channel: ${channelName}`);
      });
    
    this.subscriptions.set(channelName, channel);
    return channelName;
  }
  
  // Subscribe to all comments changes (for global comment management)
  subscribeToAllComments(handlers: RealtimeSubscriptionHandlers): string {
    const channelName = `all-comments-${Date.now()}`;
    console.log('🔄 Setting up real-time all comments subscription');
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.COMMENTS
        },
        (payload) => {
          console.log('💬 Real-time comment change (all):', payload);
          this.handleCommentChange(payload, handlers);
        }
      )
      .subscribe((status) => {
        console.log(`📡 All comments subscription status: ${status} for channel: ${channelName}`);
      });
    
    this.subscriptions.set(channelName, channel);
    return channelName;
  }
  
  // Subscribe to notification changes for specific user
  subscribeToNotifications(userId: string, handlers: RealtimeSubscriptionHandlers): string {
    const channelName = `notifications-${userId}-${Date.now()}`;
    console.log('🔄 Setting up real-time notifications subscription for user:', userId);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.NOTIFICATIONS,
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('🔔 Real-time notification change:', payload);
          this.handleNotificationChange(payload, handlers);
        }
      )
      .subscribe((status) => {
        console.log(`📡 Notifications subscription status: ${status} for channel: ${channelName}`);
      });
    
    this.subscriptions.set(channelName, channel);
    return channelName;
  }
  
  // Subscribe to all notifications (for admin/management purposes)
  subscribeToAllNotifications(handlers: RealtimeSubscriptionHandlers): string {
    const channelName = `all-notifications-${Date.now()}`;
    console.log('🔄 Setting up real-time all notifications subscription');
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.NOTIFICATIONS
        },
        (payload) => {
          console.log('🔔 Real-time notification change (all):', payload);
          this.handleNotificationChange(payload, handlers);
        }
      )
      .subscribe((status) => {
        console.log(`📡 All notifications subscription status: ${status} for channel: ${channelName}`);
      });
    
    this.subscriptions.set(channelName, channel);
    return channelName;
  }
  
  // Subscribe to multiple tables at once with a single channel
  subscribeToMultiple(subscriptions: {
    tasks?: boolean;
    comments?: boolean | string; // true for all, string for specific parent
    notifications?: boolean | string; // true for all, string for specific user
  }, handlers: RealtimeSubscriptionHandlers): string {
    const channelName = `multi-subscription-${Date.now()}`;
    console.log('🔄 Setting up multi-table subscription:', channelName, subscriptions);
    
    let channel = supabase.channel(channelName);
    
    // Subscribe to tasks if requested
    if (subscriptions.tasks) {
      channel = channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.TASKS
        },
        (payload) => {
          console.log('📋 Real-time task change (multi):', payload);
          this.handleTaskChange(payload, handlers);
        }
      );
    }
    
    // Subscribe to comments if requested
    if (subscriptions.comments) {
      const commentConfig: any = {
        event: '*',
        schema: 'public',
        table: TABLES.COMMENTS
      };
      
      // If specific parent ID provided, filter by it
      if (typeof subscriptions.comments === 'string') {
        commentConfig.filter = `parent_id=eq.${subscriptions.comments}`;
      }
      
      channel = channel.on('postgres_changes', commentConfig, (payload) => {
        console.log('💬 Real-time comment change (multi):', payload);
        this.handleCommentChange(payload, handlers);
      });
    }
    
    // Subscribe to notifications if requested
    if (subscriptions.notifications) {
      const notificationConfig: any = {
        event: '*',
        schema: 'public',
        table: TABLES.NOTIFICATIONS
      };
      
      // If specific user ID provided, filter by it
      if (typeof subscriptions.notifications === 'string') {
        notificationConfig.filter = `user_id=eq.${subscriptions.notifications}`;
      }
      
      channel = channel.on('postgres_changes', notificationConfig, (payload) => {
        console.log('🔔 Real-time notification change (multi):', payload);
        this.handleNotificationChange(payload, handlers);
      });
    }
    
    // Subscribe to the channel
    channel.subscribe((status) => {
      console.log(`📡 Multi-subscription status: ${status} for channel: ${channelName}`);
    });
    
    this.subscriptions.set(channelName, channel);
    return channelName;
  }
  
  // Unsubscribe from a specific channel
  unsubscribe(channelName: string): void {
    const channel = this.subscriptions.get(channelName);
    if (channel) {
      console.log('🗑️ Unsubscribing from channel:', channelName);
      channel.unsubscribe();
      this.subscriptions.delete(channelName);
    } else {
      console.warn('⚠️ Channel not found for unsubscription:', channelName);
    }
  }
  
  // Unsubscribe from all channels
  unsubscribeAll(): void {
    console.log('🗑️ Unsubscribing from all channels');
    this.subscriptions.forEach((channel, channelName) => {
      console.log('🗑️ Unsubscribing from:', channelName);
      channel.unsubscribe();
    });
    this.subscriptions.clear();
  }
  
  // Get active subscription count
  getActiveSubscriptionCount(): number {
    return this.subscriptions.size;
  }
  
  // Get list of active channel names
  getActiveChannels(): string[] {
    return Array.from(this.subscriptions.keys());
  }
  
  // Private method to handle task changes
  private handleTaskChange(payload: any, handlers: RealtimeSubscriptionHandlers): void {
    if (payload.eventType === 'INSERT' && handlers.onTaskInserted) {
      const newTask = this.mapDatabaseTaskToTask(payload.new);
      handlers.onTaskInserted(newTask);
    } else if (payload.eventType === 'UPDATE' && handlers.onTaskUpdated) {
      const updatedTask = this.mapDatabaseTaskToTask(payload.new);
      handlers.onTaskUpdated(updatedTask);
    } else if (payload.eventType === 'DELETE' && handlers.onTaskDeleted) {
      handlers.onTaskDeleted(payload.old.id);
    }
  }
  
  // Private method to handle comment changes
  private handleCommentChange(payload: any, handlers: RealtimeSubscriptionHandlers): void {
    if (payload.eventType === 'INSERT' && handlers.onCommentInserted) {
      const newComment = this.mapDatabaseCommentToComment(payload.new);
      handlers.onCommentInserted(newComment);
    } else if (payload.eventType === 'UPDATE' && handlers.onCommentUpdated) {
      const updatedComment = this.mapDatabaseCommentToComment(payload.new);
      handlers.onCommentUpdated(updatedComment);
    } else if (payload.eventType === 'DELETE' && handlers.onCommentDeleted) {
      handlers.onCommentDeleted(payload.old.id);
    }
  }
  
  // Private method to handle notification changes
  private handleNotificationChange(payload: any, handlers: RealtimeSubscriptionHandlers): void {
    if (payload.eventType === 'INSERT' && handlers.onNotificationInserted) {
      const newNotification = this.mapDatabaseNotificationToNotification(payload.new);
      handlers.onNotificationInserted(newNotification);
    } else if (payload.eventType === 'UPDATE' && handlers.onNotificationUpdated) {
      const updatedNotification = this.mapDatabaseNotificationToNotification(payload.new);
      handlers.onNotificationUpdated(updatedNotification);
    } else if (payload.eventType === 'DELETE' && handlers.onNotificationDeleted) {
      handlers.onNotificationDeleted(payload.old.id);
    }
  }
  
  // Private mapping functions
  private mapDatabaseTaskToTask(dbTask: any): Task {
    return {
      id: dbTask.id,
      title: dbTask.title,
      description: dbTask.description,
      projectId: dbTask.project_id,
      clientId: dbTask.client_id,
      divisions: dbTask.divisions,
      assignedToId: dbTask.assigned_to_id,
      assignedById: dbTask.assigned_by_id,
      status: dbTask.status as TaskStatus,
      deadline: dbTask.deadline,
      priority: dbTask.priority as TaskPriority,
      completionReport: dbTask.completion_report,
      allocatedTimeInSeconds: dbTask.allocated_time_seconds,
      timeSpentSeconds: dbTask.time_spent_seconds || 0,
      timerStartTime: dbTask.timer_start_time,
      ratings: dbTask.ratings || {},
      workExperience: dbTask.work_experience,
      suggestions: dbTask.suggestions,
      driveLink: dbTask.drive_link,
      revisionNote: dbTask.revision_note
    };
  }
  
  private mapDatabaseCommentToComment(dbComment: any): Comment {
    return {
      id: dbComment.id,
      parentId: dbComment.parent_id,
      authorId: dbComment.author_id,
      text: dbComment.text,
      timestamp: dbComment.created_at,
      readBy: dbComment.read_by || []
    };
  }
  
  private mapDatabaseNotificationToNotification(dbNotification: any): Notification {
    return {
      id: dbNotification.id,
      userId: dbNotification.user_id,
      message: dbNotification.message,
      read: dbNotification.read,
      timestamp: dbNotification.created_at,
      link: dbNotification.link
    };
  }
}

// Export singleton instance
export const realtimeService = RealtimeService.getInstance();
