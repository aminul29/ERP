// hooks/useRealtimeSubscription.ts
// React hook for managing real-time subscriptions in components

import { useEffect, useRef, useCallback } from 'react';
import { realtimeService, RealtimeSubscriptionHandlers } from '../lib/real-time-service';
import { Task, Comment, Notification } from '../types';

export interface UseRealtimeSubscriptionOptions {
  // Task subscriptions
  tasks?: boolean;
  
  // Comment subscriptions
  comments?: boolean | string; // true for all comments, string for specific parent ID
  
  // Notification subscriptions  
  notifications?: boolean | string; // true for all notifications, string for specific user ID
  
  // Whether to automatically start subscription when component mounts
  autoStart?: boolean;
  
  // Whether to clean up subscription when component unmounts
  autoCleanup?: boolean;
}

export interface UseRealtimeSubscriptionReturn {
  // Subscribe manually
  subscribe: () => void;
  
  // Unsubscribe manually
  unsubscribe: () => void;
  
  // Whether currently subscribed
  isSubscribed: boolean;
  
  // Current channel name (if subscribed)
  channelName: string | null;
  
  // Get active subscription count
  getActiveSubscriptionCount: () => number;
  
  // Get all active channels
  getActiveChannels: () => string[];
}

export const useRealtimeSubscription = (
  options: UseRealtimeSubscriptionOptions,
  handlers: RealtimeSubscriptionHandlers
): UseRealtimeSubscriptionReturn => {
  const channelNameRef = useRef<string | null>(null);
  const isSubscribedRef = useRef<boolean>(false);
  const handlersRef = useRef(handlers);
  const optionsRef = useRef(options);
  
  // Update refs when handlers or options change
  useEffect(() => {
    handlersRef.current = handlers;
    optionsRef.current = options;
  }, [handlers, options]);
  
  const subscribe = useCallback(() => {
    if (isSubscribedRef.current) {
      console.warn('⚠️ Already subscribed, unsubscribing first');
      unsubscribe();
    }
    
    const opts = optionsRef.current;
    const hdlrs = handlersRef.current;
    
    console.log('🔄 Starting real-time subscription with options:', opts);
    
    // Determine subscription type
    if (opts.tasks && opts.comments && opts.notifications) {
      // Multi-table subscription for efficiency
      channelNameRef.current = realtimeService.subscribeToMultiple(
        {
          tasks: opts.tasks,
          comments: opts.comments,
          notifications: opts.notifications
        },
        hdlrs
      );
    } else if (opts.tasks && !opts.comments && !opts.notifications) {
      // Task-only subscription
      channelNameRef.current = realtimeService.subscribeToTaskChanges(hdlrs);
    } else if (!opts.tasks && opts.comments && !opts.notifications) {
      // Comment-only subscription
      if (typeof opts.comments === 'string') {
        channelNameRef.current = realtimeService.subscribeToComments(opts.comments, hdlrs);
      } else {
        channelNameRef.current = realtimeService.subscribeToAllComments(hdlrs);
      }
    } else if (!opts.tasks && !opts.comments && opts.notifications) {
      // Notification-only subscription
      if (typeof opts.notifications === 'string') {
        channelNameRef.current = realtimeService.subscribeToNotifications(opts.notifications, hdlrs);
      } else {
        channelNameRef.current = realtimeService.subscribeToAllNotifications(hdlrs);
      }
    } else if (Object.keys(opts).some(key => opts[key as keyof UseRealtimeSubscriptionOptions])) {
      // Mixed subscription
      channelNameRef.current = realtimeService.subscribeToMultiple(
        {
          tasks: opts.tasks,
          comments: opts.comments,
          notifications: opts.notifications
        },
        hdlrs
      );
    }
    
    if (channelNameRef.current) {
      isSubscribedRef.current = true;
      console.log('✅ Real-time subscription active:', channelNameRef.current);
    } else {
      console.error('❌ Failed to create real-time subscription');
    }
  }, []);
  
  const unsubscribe = useCallback(() => {
    if (channelNameRef.current) {
      console.log('🗑️ Cleaning up real-time subscription:', channelNameRef.current);
      realtimeService.unsubscribe(channelNameRef.current);
      channelNameRef.current = null;
      isSubscribedRef.current = false;
    }
  }, []);
  
  // Auto start subscription when component mounts (if enabled)
  useEffect(() => {
    if (options.autoStart !== false) { // Default to true
      subscribe();
    }
    
    // Auto cleanup when component unmounts (if enabled)
    return () => {
      if (options.autoCleanup !== false) { // Default to true
        unsubscribe();
      }
    };
  }, []); // Empty dependency array for mount/unmount only
  
  // Return interface
  return {
    subscribe,
    unsubscribe,
    isSubscribed: isSubscribedRef.current,
    channelName: channelNameRef.current,
    getActiveSubscriptionCount: () => realtimeService.getActiveSubscriptionCount(),
    getActiveChannels: () => realtimeService.getActiveChannels()
  };
};

// Specialized hooks for common use cases

export const useTaskRealtimeSubscription = (handlers: {
  onTaskInserted?: (task: Task) => void;
  onTaskUpdated?: (task: Task) => void;
  onTaskDeleted?: (taskId: string) => void;
}) => {
  return useRealtimeSubscription({ tasks: true }, handlers);
};

export const useCommentRealtimeSubscription = (
  parentId: string,
  handlers: {
    onCommentInserted?: (comment: Comment) => void;
    onCommentUpdated?: (comment: Comment) => void;
    onCommentDeleted?: (commentId: string) => void;
  }
) => {
  return useRealtimeSubscription({ comments: parentId }, handlers);
};

export const useNotificationRealtimeSubscription = (
  userId: string,
  handlers: {
    onNotificationInserted?: (notification: Notification) => void;
    onNotificationUpdated?: (notification: Notification) => void;
    onNotificationDeleted?: (notificationId: string) => void;
  }
) => {
  return useRealtimeSubscription({ notifications: userId }, handlers);
};

// Hook for task detail page that needs both task and comment updates
export const useTaskDetailRealtimeSubscription = (
  taskId: string,
  handlers: {
    onTaskUpdated?: (task: Task) => void;
    onTaskDeleted?: (taskId: string) => void;
    onCommentInserted?: (comment: Comment) => void;
    onCommentUpdated?: (comment: Comment) => void;
    onCommentDeleted?: (commentId: string) => void;
  }
) => {
  return useRealtimeSubscription(
    { 
      tasks: true, 
      comments: taskId // Subscribe to comments for this specific task
    }, 
    handlers
  );
};

// Hook for comprehensive task management that includes notifications
export const useTaskManagementRealtimeSubscription = (
  userId: string,
  handlers: {
    onTaskInserted?: (task: Task) => void;
    onTaskUpdated?: (task: Task) => void;
    onTaskDeleted?: (taskId: string) => void;
    onNotificationInserted?: (notification: Notification) => void;
    onNotificationUpdated?: (notification: Notification) => void;
  }
) => {
  return useRealtimeSubscription(
    {
      tasks: true,
      notifications: userId
    },
    handlers
  );
};
