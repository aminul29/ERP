
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Task, Project, Teammate, TaskStatus, TaskPriority, Client, PendingUpdate, Comment, Notification } from '../types';
import { Card } from './ui/Card';
import { Modal } from './ui/Modal';
import { Badge } from './ui/Badge';
import { ICONS } from '../constants';
import { StarRating } from './ui/StarRating';
import { RichTextEditor } from './ui/RichTextEditor';
import { formatDeadlineForDisplay, formatDeadlineForStorage } from '../lib/date-utils';
import { ToastNotifications } from './ToastNotifications';
// Removed conflicting real-time subscriptions - using App.tsx real-time instead

const formatTime = (totalSeconds: number): string => {
    // Handle invalid numbers
    if (!totalSeconds || isNaN(totalSeconds) || totalSeconds < 0) {
        return '00:00:00';
    }
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const TimerDisplay: React.FC<{task: Task}> = ({ task }) => {
    // When allocated time is not set (>0), we show elapsed time counting up.
    // When allocated time is set, we show remaining time but never below 0.
    const computeTimes = () => {
        const allocated = Number(task.allocatedTimeInSeconds) || 0; // seconds
        const spent = Number(task.timeSpentSeconds) || 0; // seconds already accumulated

        let elapsedSinceStart = 0;
        if (task.timerStartTime && typeof task.timerStartTime === 'string' && task.timerStartTime.trim() !== '') {
            const startTime = new Date(task.timerStartTime).getTime();
            const now = Date.now();
            if (!isNaN(startTime) && startTime <= now) {
                elapsedSinceStart = Math.floor((now - startTime) / 1000);
            }
        }

        const totalElapsed = spent + elapsedSinceStart;
        if (allocated <= 0) {
            return { mode: 'elapsed' as const, value: totalElapsed };
        }
        const remainingRaw = allocated - totalElapsed;
        const clampedRemaining = Math.max(remainingRaw, 0);
        const overtime = Math.max(-remainingRaw, 0);
        return { mode: 'remaining' as const, value: clampedRemaining, overtime };
    };

    const [timeState, setTimeState] = useState(computeTimes);

    useEffect(() => {
        setTimeState(computeTimes());
        if (task.timerStartTime && typeof task.timerStartTime === 'string' && task.timerStartTime.trim() !== '') {
            const interval = setInterval(() => setTimeState(computeTimes()), 1000);
            return () => clearInterval(interval);
        }
    }, [task.timerStartTime, task.timeSpentSeconds, task.allocatedTimeInSeconds]);

    const isElapsedMode = timeState.mode === 'elapsed';
    const isOvertime = !isElapsedMode && (timeState as any).overtime > 0;

    return (
        <div className={`font-mono font-semibold ${isOvertime ? 'text-red-400' : 'text-primary-400'}`}>
            {formatTime(timeState.value)}{isElapsedMode ? '' : ''}
        </div>
    );
};


interface TaskManagementProps {
  tasks: Task[];
  projects: Project[];
  teammates: Teammate[];
  currentUser: Teammate;
  onAddTask: (task: Omit<Task, 'id' | 'timeSpentSeconds' | 'timerStartTime' | 'assignedById' | 'ratings'>) => void;
  onEditTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void; // For direct updates like timer/status
  onDeleteTask: (taskId: string) => void;
  onRateTask: (taskId: string, rating: number, rater: 'assigner' | 'ceo') => void;
  onArchiveTask: (taskId: string, archived: boolean) => void; // Add archive handler prop
  clients: Client[];
  divisions: string[];
  pendingUpdates: PendingUpdate[];
  onNavClick: (view: string) => void;
  comments: Comment[]; // Add comments prop
}

const emptyTask: Omit<Task, 'id' | 'timeSpentSeconds' | 'timerStartTime' | 'assignedById' | 'ratings'> = {
  title: '',
  description: '',
  status: TaskStatus.ToDo,
  deadline: '',
  priority: TaskPriority.Medium,
  assignedToId: '',
  allocatedTimeInSeconds: 0,
  divisions: [],
  clientId: '',
};

const statusColors: { [key in TaskStatus]: 'gray' | 'blue' | 'green' | 'yellow' | 'red' } = {
  [TaskStatus.ToDo]: 'gray',
  [TaskStatus.InProgress]: 'blue',
  [TaskStatus.UnderReview]: 'yellow',
  [TaskStatus.RevisionRequired]: 'red',
  [TaskStatus.Completed]: 'green',
};

const priorityColors: { [key in TaskPriority]: 'green' | 'yellow' | 'red' } = {
  [TaskPriority.Low]: 'green',
  [TaskPriority.Medium]: 'yellow',
  [TaskPriority.High]: 'red',
};

export const TaskManagement: React.FC<TaskManagementProps> = ({ tasks, projects, teammates, currentUser, onAddTask, onEditTask, onUpdateTask, onDeleteTask, onRateTask, onArchiveTask, clients, divisions, pendingUpdates, onNavClick, comments }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Omit<Task, 'id' | 'timeSpentSeconds' | 'timerStartTime' | 'assignedById' | 'ratings'> | Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  
  // Toast notifications state
  const [toasts, setToasts] = useState<Array<{id: string, type: 'success' | 'info' | 'warning' | 'error', message: string}>>([]);
  
  // Add toast function
  const addToast = (type: 'success' | 'info' | 'warning' | 'error', message: string) => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, type, message }]);
    // Auto remove toast after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };
  
  // Note: Real-time subscriptions removed to avoid conflicts with App.tsx
  
  const [reportingTask, setReportingTask] = useState<Task | null>(null);
  const [completionReport, setCompletionReport] = useState('');
  const [workExperience, setWorkExperience] = useState<'smooth' | 'issues'>('smooth');
  const [suggestions, setSuggestions] = useState('');
  const [driveLink, setDriveLink] = useState('');
  
  const [divisionSearch, setDivisionSearch] = useState('');
  const [isDivisionDropdownOpen, setIsDivisionDropdownOpen] = useState(false);
  const divisionDropdownRef = useRef<HTMLDivElement>(null);
  
  // View and Filter States
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card'); // Default to card view
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [showArchived, setShowArchived] = useState<boolean>(false); // Add archive filter
  const [sortBy, setSortBy] = useState<'deadline' | 'priority' | 'status' | 'title'>('deadline');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  
  const isManager = ['HR and Admin', 'CEO', 'Lead Web Developer', 'SMM and Design Lead', 'Sales and PR Lead', 'Lead SEO Expert'].includes(currentUser.role);
  const isCeo = currentUser.role === 'CEO';
  
  // Helper function to check if user can edit/delete a specific task
  const canEditTask = (task: Task) => {
    return isCeo || currentUser.id === task.assignedById;
  };
  
  const canDeleteTask = (task: Task) => {
    const canDelete = isCeo || currentUser.id === task.assignedById;
    // If task has moved out of "To Do" status, only CEO can delete
    if (task.status !== TaskStatus.ToDo && !isCeo) {
      return false;
    }
    return canDelete;
  };

  // Helper function to count unread comments for a specific task
  const getUnreadCommentsCount = (taskId: string): number => {
    // Handle case where comments is undefined or null
    if (!comments || !Array.isArray(comments)) {
      return 0;
    }
    
    const taskComments = comments.filter(c => c.parentId === taskId);
    return taskComments.filter(comment => {
      // Skip own comments
      if (comment.authorId === currentUser.id) return false;
      // Check if current user has read this comment
      return !comment.readBy?.includes(currentUser.id);
    }).length;
  };

  // Filtered and Sorted Tasks
  const filteredAndSortedTasks = useMemo(() => {
    console.log('🔍 Filtering tasks:', {
      totalTasks: tasks.length,
      showArchived,
      archivedTasks: tasks.filter(t => t.archived === true).length,
      activeTasks: tasks.filter(t => !t.archived).length
    });
    
    let filtered = tasks.filter(task => isManager || task.assignedToId === currentUser.id);
    console.log('👥 After permission filter:', filtered.length);
    
    // Apply archive filter - by default hide archived tasks unless showArchived is true
    // Handle null/undefined archived values by treating them as false
    filtered = filtered.filter(task => {
      const isArchived = task.archived === true;
      const shouldShow = showArchived ? isArchived : !isArchived;
      return shouldShow;
    });
    console.log(`📦 After archive filter (showArchived: ${showArchived}):`, filtered.length);
    
    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        projects.find(p => p.id === task.projectId)?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teammates.find(t => t.id === task.assignedToId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log('🔎 After search filter:', filtered.length);
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus);
    }
    
    // Apply priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter(task => task.priority === filterPriority);
    }
    
    // Apply assignee filter
    if (filterAssignee !== 'all') {
      filtered = filtered.filter(task => task.assignedToId === filterAssignee);
    }
    
    // Apply sorting with priority for current user's tasks
    filtered.sort((a, b) => {
      // First priority: Tasks assigned to current user should come first
      const aIsCurrentUser = a.assignedToId === currentUser.id;
      const bIsCurrentUser = b.assignedToId === currentUser.id;
      
      if (aIsCurrentUser && !bIsCurrentUser) {
        return -1; // a (current user's task) comes before b
      }
      if (!aIsCurrentUser && bIsCurrentUser) {
        return 1; // b (current user's task) comes before a
      }
      
      // If both tasks have the same assignment priority (both current user's or both others'),
      // then sort by the selected criteria
      let aValue, bValue;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'deadline':
          aValue = new Date(a.deadline).getTime();
          bValue = new Date(b.deadline).getTime();
          break;
        case 'priority':
          const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
          aValue = priorityOrder[a.priority] || 0;
          bValue = priorityOrder[b.priority] || 0;
          break;
        case 'status':
          const statusOrder = { 
            'To Do': 1, 'In Progress': 2, 'Under Review': 3, 
            'Revision Required': 4, 'Completed': 5 
          };
          aValue = statusOrder[a.status] || 0;
          bValue = statusOrder[b.status] || 0;
          break;
        default:
          aValue = new Date(a.deadline).getTime();
          bValue = new Date(b.deadline).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
    
    return filtered;
  }, [tasks, currentUser, isManager, searchTerm, filterStatus, filterPriority, filterAssignee, showArchived, sortBy, sortOrder, projects, teammates]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (divisionDropdownRef.current && !divisionDropdownRef.current.contains(event.target as Node)) {
        setIsDivisionDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleOpenModal = (task?: Task) => {
    setEditingTask(task || emptyTask);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };
  
  const handleOpenReportModal = (task: Task) => {
    setReportingTask(task);
    setCompletionReport(task.completionReport || '');
    setWorkExperience(task.workExperience || 'smooth');
    setSuggestions(task.suggestions || '');
    setDriveLink(task.driveLink || '');
    setIsReportModalOpen(true);
  };
  
  const handleCloseReportModal = () => {
    setIsReportModalOpen(false);
    setReportingTask(null);
    setCompletionReport('');
    setWorkExperience('smooth');
    setSuggestions('');
    setDriveLink('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    if ('id' in editingTask) {
        onEditTask(editingTask);
    } else {
        onAddTask(editingTask);
    }
    handleCloseModal();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'deadline') {
      // Convert from YYYY-MM-DD (HTML date input) to DD/MM/YYYY (storage format)
      const formattedDate = formatDeadlineForStorage(value.split('-').reverse().join('/'));
      setEditingTask(prev => prev ? { ...prev, deadline: formattedDate } : null);
    } else {
      setEditingTask(prev => prev ? { ...prev, [name]: type === 'number' ? parseFloat(value) : value } : null);
    }
  };
  
  const handleAllocatedTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value) || 0;

    setEditingTask(prev => {
        if (!prev) return null;

        const seconds = prev.allocatedTimeInSeconds || 0;
        const currentHours = Math.floor(seconds / 3600);
        const currentMinutes = Math.floor((seconds % 3600) / 60);

        let newTotalSeconds = 0;
        if (name === 'allocatedHoursInput') {
            newTotalSeconds = (numValue * 3600) + (currentMinutes * 60);
        } else if (name === 'allocatedMinutesInput') {
            newTotalSeconds = (currentHours * 3600) + (numValue * 60);
        }
        
        return { ...prev, allocatedTimeInSeconds: newTotalSeconds };
    });
  };

  const handleDivisionSelection = (division: string) => {
    setEditingTask(prev => {
        if (!prev) return null;
        const currentDivisions = prev.divisions || [];
        const newDivisions = currentDivisions.includes(division)
            ? currentDivisions.filter(d => d !== division)
            : [...currentDivisions, division];
        return { ...prev, divisions: newDivisions };
    });
    setIsDivisionDropdownOpen(false);
  };

  const filteredDivisions = useMemo(() => {
    if (!divisionSearch) return divisions;
    return divisions.filter(d => d.toLowerCase().includes(divisionSearch.toLowerCase()));
  }, [divisionSearch, divisions]);

  const handleTimerAction = (task: Task, action: 'start' | 'pause') => {
      if (action === 'start') {
          onUpdateTask({
              ...task,
              status: TaskStatus.InProgress,
              timerStartTime: new Date().toISOString(),
          });
      } else { // pause
          if (!task.timerStartTime) return; 
          const elapsedSeconds = Math.round((new Date().getTime() - new Date(task.timerStartTime).getTime()) / 1000);
          onUpdateTask({
              ...task,
              timeSpentSeconds: task.timeSpentSeconds + elapsedSeconds,
              timerStartTime: undefined,
          });
      }
  };

  const handleMarkAsDone = (task: Task) => {
    let taskToReport = { ...task };
    if (task.timerStartTime) {
        const elapsedSeconds = Math.round((new Date().getTime() - new Date(task.timerStartTime).getTime()) / 1000);
        taskToReport.timeSpentSeconds += elapsedSeconds;
        taskToReport.timerStartTime = undefined;
    }
    handleOpenReportModal(taskToReport);
  };
  

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(reportingTask) {
        onUpdateTask({
            ...reportingTask,
            status: TaskStatus.UnderReview,
            completionReport: completionReport,
            workExperience: workExperience,
            suggestions: suggestions,
            driveLink: driveLink
        });
        handleCloseReportModal();
    }
  };

  const handleOpenDeleteModal = (task: Task) => {
    setTaskToDelete(task);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setTaskToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (taskToDelete) {
      onDeleteTask(taskToDelete.id);
      handleCloseDeleteModal();
    }
  };

  const allocatedHoursValue = editingTask ? Math.floor((editingTask.allocatedTimeInSeconds || 0) / 3600) : 0;
  const allocatedMinutesValue = editingTask ? Math.floor(((editingTask.allocatedTimeInSeconds || 0) % 3600) / 60) : 0;

  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">{isManager ? 'Task Management' : 'Tasks'}</h1>
        <button onClick={() => handleOpenModal()} className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2">
          {ICONS.plus}
          <span className="hidden sm:inline">Assign Task</span>
        </button>
      </div>
      
      {/* Filters and Controls */}
      <div className="mb-6 space-y-4">
        {/* Search and View Toggle */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
            />
          </div>
          
          {/* View Toggle - Hidden on mobile since mobile already defaults to card view */}
          <div className="hidden md:flex bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('card')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'card'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                <span>Cards</span>
              </div>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                <span>List</span>
              </div>
            </button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex flex-wrap gap-3 flex-1">
            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'all')}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
            >
              <option value="all">All Status</option>
              {Object.values(TaskStatus).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            
            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as TaskPriority | 'all')}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
            >
              <option value="all">All Priority</option>
              {Object.values(TaskPriority).map(priority => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>
            
            {/* Assignee Filter (Only for managers) */}
            {isManager && (
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
              >
                <option value="all">All Assignees</option>
                {teammates.map(teammate => (
                  <option key={teammate.id} value={teammate.id}>{teammate.name}</option>
                ))}
              </select>
            )}
            
            {/* Archive Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const newState = !showArchived;
                  console.log('🔄 Archive toggle clicked:', { from: showArchived, to: newState });
                  setShowArchived(newState);
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showArchived
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-700 border border-gray-600 text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
                title={showArchived ? 'Showing archived tasks' : 'Showing active tasks'}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    {showArchived ? (
                      // Archive box icon (for when showing archived)
                      <path d="M4 3a2 2 0 00-2 2v1.816a2 2 0 00.586 1.414l.812.812A2 2 0 004.812 9H15a2 2 0 001.414-.586l.812-.812A2 2 0 0018 6.586V5a2 2 0 00-2-2H4zm3 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z"/>
                    ) : (
                      // Inbox/active icon (for when showing active)
                      <path fillRule="evenodd" d="M2 3a1 1 0 00-1 1v12a1 1 0 001 1h16a1 1 0 001-1V4a1 1 0 00-1-1H2zm2 2h12v10H4V5zm2 4a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd"/>
                    )}
                  </svg>
                  <span>{showArchived ? 'Archived' : 'Active'}</span>
                </div>
              </button>
            </div>
          </div>
          
          {/* Sort Controls */}
          <div className="flex gap-2 items-center">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'deadline' | 'priority' | 'status' | 'title')}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
            >
              <option value="deadline">Sort by Deadline</option>
              <option value="title">Sort by Title</option>
              <option value="priority">Sort by Priority</option>
              <option value="status">Sort by Status</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm hover:bg-gray-600 focus:outline-none focus:border-primary-500 transition-colors"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
        
        {/* Results Count */}
        <div className="text-sm text-gray-400">
          Showing {filteredAndSortedTasks.length} of {tasks.filter(task => isManager || task.assignedToId === currentUser.id).length} tasks
        </div>
      </div>

      {/* Desktop Views */}
      <div className="hidden md:block">
        {viewMode === 'list' ? (
          /* List View */
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-gray-700">
                  <tr>
                    <th className="p-4">Title</th>
                    {isManager && <th className="p-4">Assigned To</th>}
                    <th className="p-4">Project</th>
                    <th className="p-4">Deadline</th>
                    <th className="p-4">Priority</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Rating{isCeo ? ' (A/C)' : ''}</th>
                    <th className="p-4">Timer (Rem/Alloc)</th>
                    <th className="p-4 w-56 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedTasks.map(task => {
                    const isPending = pendingUpdates.some(p => p.type === 'task' && p.itemId === task.id);
                    const isComplete = task.status === TaskStatus.Completed;
                    const canRateAsCeo = isCeo && isComplete;
                    const canRateAsAssigner = currentUser.id === task.assignedById && isComplete;
                    const assignerRating = task.ratings?.assigner || 0;
                    const ceoRating = task.ratings?.ceo || 0;

                    return (
                    <tr key={task.id} className="border-b border-gray-800 hover:bg-gray-700/50">
                      <td className="p-4 font-medium">
                        <button onClick={() => onNavClick(`taskDetail/${task.id}`)} className="text-left hover:text-primary-400 transition-colors" title={task.description}>
                            <div className="flex items-center space-x-2">
                              <span>{task.title}</span>
                              {getUnreadCommentsCount(task.id) > 0 && (
                                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center">
                                  {getUnreadCommentsCount(task.id)}
                                </span>
                              )}
                            </div>
                        </button>
                      </td>
                      {isManager && <td className="p-4 text-gray-300">{teammates.find(e => e.id === task.assignedToId)?.name}</td>}
                      <td className="p-4 text-gray-300">{projects.find(p => p.id === task.projectId)?.name}</td>
                      <td className="p-4 text-gray-300">{formatDeadlineForDisplay(task.deadline)}</td>
                      <td className="p-4"><Badge color={priorityColors[task.priority]}>{task.priority}</Badge></td>
                      <td className="p-4">
                        <div className="flex flex-col space-y-1 items-start">
                            <Badge color={statusColors[task.status]}>{task.status}</Badge>
                            {isPending && <Badge color="yellow">Pending</Badge>}
                        </div>
                      </td>
                      <td className="p-4">
                        {isComplete ? (
                            <div className="flex flex-col space-y-1">
                                <div title={!canRateAsAssigner ? "Only the task assigner can rate" : "Assigner Rating"}>
                                    <StarRating
                                        rating={assignerRating}
                                        onRatingChange={(newRating) => onRateTask(task.id, newRating, 'assigner')}
                                        disabled={!canRateAsAssigner}
                                    />
                                </div>
                                {isCeo && (
                                  <div title={!canRateAsCeo ? "Only the CEO can rate" : "CEO Rating"}>
                                      <StarRating
                                          rating={ceoRating}
                                          onRatingChange={(newRating) => onRateTask(task.id, newRating, 'ceo')}
                                          disabled={!canRateAsCeo}
                                      />
                                  </div>
                                )}
                            </div>
                        ) : (
                            <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div>
                            <TimerDisplay task={task} />
                            <span className="text-xs text-gray-400">of {formatTime(task.allocatedTimeInSeconds)}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center space-x-2">
                            {/* Task timer controls - only visible to assigned teammate or CEO for active tasks */}
                            {(task.assignedToId === currentUser.id || isCeo) && [TaskStatus.ToDo, TaskStatus.InProgress].includes(task.status) && (
                            <>
                                {task.status === TaskStatus.ToDo && (
                                <button onClick={() => handleTimerAction(task, 'start')} className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-1 px-3 rounded">Start</button>
                                )}
                                {task.status === TaskStatus.InProgress && task.timerStartTime && (
                                <button onClick={() => handleTimerAction(task, 'pause')} className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold py-1 px-3 rounded">Pause</button>
                                )}
                                {task.status === TaskStatus.InProgress && !task.timerStartTime && (
                                <button onClick={() => handleTimerAction(task, 'start')} className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-1 px-3 rounded">Resume</button>
                                )}
                                <button onClick={() => handleMarkAsDone(task)} className="bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold py-1 px-3 rounded">Done</button>
                            </>
                            )}
                            {task.status === TaskStatus.Done && <span className="text-gray-400 text-sm flex items-center justify-center">Completed</span>}
                            {/* Edit and Delete buttons - only for task assigner and CEO */}
                            {(canEditTask(task) || canDeleteTask(task)) && (
                                <>
                                    {canEditTask(task) && (
                                        <button onClick={() => handleOpenModal(task)} className="text-yellow-400 hover:text-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isPending} title={isPending ? "Changes pending approval" : "Edit Task"}>
                                            {ICONS.edit}
                                        </button>
                                    )}
                                    {canDeleteTask(task) && (
                                        <button onClick={() => handleOpenDeleteModal(task)} className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isPending || !canDeleteTask(task)} title={!canDeleteTask(task) ? "Only CEO can delete tasks that have started" : isPending ? "Changes pending approval" : "Delete Task"}>
                                            {ICONS.trash}
                                        </button>
                                    )}
                                </>
                            )}
                            
                            {/* Archive/Unarchive buttons - only for completed tasks */}
                            {(task.status === TaskStatus.Done || task.status === TaskStatus.Completed) && (
                                <button 
                                    onClick={() => onArchiveTask(task.id, !task.archived)}
                                    className={`hover:scale-110 transition-transform ${
                                        task.archived ? 'text-blue-400 hover:text-blue-300' : 'text-gray-400 hover:text-gray-300'
                                    }`}
                                    title={task.archived ? 'Unarchive task' : 'Archive task'}
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        {task.archived ? (
                                            // Unarchive icon (box with arrow up)
                                            <path d="M4 3a2 2 0 00-2 2v1.816a2 2 0 00.586 1.414l.812.812A2 2 0 004.812 9H15a2 2 0 001.414-.586l.812-.812A2 2 0 0018 6.586V5a2 2 0 00-2-2H4zm6 6a1 1 0 00-1 1v3a1 1 0 102 0v-3a1 1 0 00-1-1zm-3 2a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z"/>
                                        ) : (
                                            // Archive icon (box with arrow down)
                                            <path d="M4 3a2 2 0 00-2 2v1.816a2 2 0 00.586 1.414l.812.812A2 2 0 004.812 9H15a2 2 0 001.414-.586l.812-.812A2 2 0 0018 6.586V5a2 2 0 00-2-2H4zm3 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z"/>
                                        )}
                                    </svg>
                                </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          /* Card View for Desktop */
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredAndSortedTasks.map(task => {
              const isPending = pendingUpdates.some(p => p.type === 'task' && p.itemId === task.id);
              const isComplete = task.status === TaskStatus.Completed;
              const canRateAsCeo = isCeo && isComplete;
              const canRateAsAssigner = currentUser.id === task.assignedById && isComplete;
              const assignerRating = task.ratings?.assigner || 0;
              const ceoRating = task.ratings?.ceo || 0;
              
              return (
                <Card key={task.id} className="p-4 hover:bg-gray-800/50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                      <button onClick={() => onNavClick(`taskDetail/${task.id}`)} className="text-left font-semibold text-lg text-white hover:text-primary-400 pr-2 line-clamp-2">
                          <div className="flex items-center space-x-2">
                            <span>{task.title}</span>
                            {getUnreadCommentsCount(task.id) > 0 && (
                              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center">
                                {getUnreadCommentsCount(task.id)}
                              </span>
                            )}
                          </div>
                      </button>
                      <Badge color={priorityColors[task.priority]}>{task.priority}</Badge>
                  </div>

                  <div className="space-y-2 text-sm text-gray-300 mb-4">
                      {isManager && (
                        <div><span className="text-gray-400">To: </span>{teammates.find(e => e.id === task.assignedToId)?.name}</div>
                      )}
                      <div><span className="text-gray-400">Project: </span>{projects.find(p => p.id === task.projectId)?.name || 'N/A'}</div>
                      <div><span className="text-gray-400">Deadline: </span>{formatDeadlineForDisplay(task.deadline)}</div>
                      <div className="flex items-center space-x-2"><span className="text-gray-400">Status: </span> <Badge color={statusColors[task.status]}>{task.status}</Badge> {isPending && <Badge color="yellow">Pending</Badge>}</div>
                  </div>

                  <div className="flex justify-between items-center text-sm mb-4 pt-3 border-t border-gray-700">
                    <div>
                      <div className="text-gray-400 text-xs">Time Remaining</div>
                      <TimerDisplay task={task} />
                      <div className="text-xs text-gray-500">of {formatTime(task.allocatedTimeInSeconds)}</div>
                    </div>
                    {isComplete ? (
                      <div className="text-right">
                          <div className="text-gray-400 text-xs mb-1">Rating</div>
                          <div className="space-y-1">
                            <StarRating rating={assignerRating} disabled={!canRateAsAssigner} onRatingChange={(newRating) => onRateTask(task.id, newRating, 'assigner')}/>
                            {isCeo && <StarRating rating={ceoRating} disabled={!canRateAsCeo} onRatingChange={(newRating) => onRateTask(task.id, newRating, 'ceo')}/>}
                          </div>
                      </div>
                    ) : 
                      <div className="text-gray-400 text-sm">Not Rated</div>
                    }
                  </div>

                  <div className="pt-3 border-t border-gray-700 flex items-center justify-center space-x-2 flex-wrap gap-2">
                    {/* Task timer controls - only visible to assigned teammate or CEO for active tasks */}
                    {(task.assignedToId === currentUser.id || isCeo) && [TaskStatus.ToDo, TaskStatus.InProgress].includes(task.status) && (
                      <>
                          {task.status === TaskStatus.ToDo && (
                          <button onClick={() => handleTimerAction(task, 'start')} className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-1 px-3 rounded">Start</button>
                          )}
                          {task.status === TaskStatus.InProgress && task.timerStartTime && (
                          <button onClick={() => handleTimerAction(task, 'pause')} className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold py-1 px-3 rounded">Pause</button>
                          )}
                          {task.status === TaskStatus.InProgress && !task.timerStartTime && (
                          <button onClick={() => handleTimerAction(task, 'start')} className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-1 px-3 rounded">Resume</button>
                          )}
                          <button onClick={() => handleMarkAsDone(task)} className="bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold py-1 px-3 rounded">Done</button>
                      </>
                      )}
                      {task.status === TaskStatus.Done && <span className="text-gray-400 text-sm flex items-center justify-center">Completed</span>}
                      {/* Edit and Delete buttons - only for task assigner and CEO */}
                      {(canEditTask(task) || canDeleteTask(task)) && (
                          <>
                              {canEditTask(task) && (
                                  <button onClick={() => handleOpenModal(task)} className="text-yellow-400 hover:text-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isPending} title={isPending ? "Changes pending approval" : "Edit Task"}>
                                      {ICONS.edit}
                                  </button>
                              )}
                              {canDeleteTask(task) && (
                                  <button onClick={() => handleOpenDeleteModal(task)} className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isPending || !canDeleteTask(task)} title={!canDeleteTask(task) ? "Only CEO can delete tasks that have started" : isPending ? "Changes pending approval" : "Delete Task"}>
                                      {ICONS.trash}
                                  </button>
                              )}
                          </>
                      )}
                      
                      {/* Archive/Unarchive buttons - only for completed tasks */}
                      {(task.status === TaskStatus.Done || task.status === TaskStatus.Completed) && (
                          <button 
                              onClick={() => onArchiveTask(task.id, !task.archived)}
                              className={`hover:scale-110 transition-transform ${
                                  task.archived ? 'text-blue-400 hover:text-blue-300' : 'text-gray-400 hover:text-gray-300'
                              }`}
                              title={task.archived ? 'Unarchive task' : 'Archive task'}
                          >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  {task.archived ? (
                                      // Unarchive icon (box with arrow up)
                                      <path d="M4 3a2 2 0 00-2 2v1.816a2 2 0 00.586 1.414l.812.812A2 2 0 004.812 9H15a2 2 0 001.414-.586l.812-.812A2 2 0 0018 6.586V5a2 2 0 00-2-2H4zm6 6a1 1 0 00-1 1v3a1 1 0 102 0v-3a1 1 0 00-1-1zm-3 2a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z"/>
                                  ) : (
                                      // Archive icon (box with arrow down)
                                      <path d="M4 3a2 2 0 00-2 2v1.816a2 2 0 00.586 1.414l.812.812A2 2 0 004.812 9H15a2 2 0 001.414-.586l.812-.812A2 2 0 0018 6.586V5a2 2 0 00-2-2H4zm3 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z"/>
                                  )}
                              </svg>
                          </button>
                      )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
      
      {/* Mobile Card View - Always card view */}
      <div className="md:hidden space-y-4">
        {filteredAndSortedTasks.map(task => {
          const isPending = pendingUpdates.some(p => p.type === 'task' && p.itemId === task.id);
          const isComplete = task.status === TaskStatus.Completed;
          const canRateAsCeo = isCeo && isComplete;
          const canRateAsAssigner = currentUser.id === task.assignedById && isComplete;
          const assignerRating = task.ratings?.assigner || 0;
          const ceoRating = task.ratings?.ceo || 0;
          return (
            <Card key={task.id} className="p-4">
              <div className="flex justify-between items-start">
                  <button onClick={() => onNavClick(`taskDetail/${task.id}`)} className="text-left font-semibold text-lg text-white hover:text-primary-400 pr-2">
                      <div className="flex items-center space-x-2">
                        <span>{task.title}</span>
                        {getUnreadCommentsCount(task.id) > 0 && (
                          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center">
                            {getUnreadCommentsCount(task.id)}
                          </span>
                        )}
                      </div>
                  </button>
                  <Badge color={priorityColors[task.priority]}>{task.priority}</Badge>
              </div>

              <div className="mt-2 space-y-2 text-sm text-gray-300">
                  {isManager && (
                    <div><span className="text-gray-400">To: </span>{teammates.find(e => e.id === task.assignedToId)?.name}</div>
                  )}
                  <div><span className="text-gray-400">Project: </span>{projects.find(p => p.id === task.projectId)?.name || 'N/A'}</div>
                  <div><span className="text-gray-400">Deadline: </span>{formatDeadlineForDisplay(task.deadline)}</div>
                  <div className="flex items-center space-x-2"><span className="text-gray-400">Status: </span> <Badge color={statusColors[task.status]}>{task.status}</Badge> {isPending && <Badge color="yellow">Pending</Badge>}</div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-700">
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <div className="text-gray-400">Time Remaining</div>
                    <TimerDisplay task={task} />
                  </div>
                  {isComplete ? (
                    <div>
                        <div className="text-gray-400">Rating</div>
                        <StarRating rating={assignerRating} disabled={true}/>
                        {isCeo && <StarRating rating={ceoRating} disabled={true}/>}
                    </div>
                  ) : 
                    <div className="text-gray-400 text-sm">Not Rated</div>
                  }
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-700 flex items-center justify-center space-x-2 flex-wrap gap-2">
                {/* Task timer controls - only visible to assigned teammate or CEO for active tasks */}
                {(task.assignedToId === currentUser.id || isCeo) && [TaskStatus.ToDo, TaskStatus.InProgress].includes(task.status) && (
                  <>
                      {task.status === TaskStatus.ToDo && (
                      <button onClick={() => handleTimerAction(task, 'start')} className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-1 px-3 rounded">Start</button>
                      )}
                      {task.status === TaskStatus.InProgress && task.timerStartTime && (
                      <button onClick={() => handleTimerAction(task, 'pause')} className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold py-1 px-3 rounded">Pause</button>
                      )}
                      {task.status === TaskStatus.InProgress && !task.timerStartTime && (
                      <button onClick={() => handleTimerAction(task, 'start')} className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-1 px-3 rounded">Resume</button>
                      )}
                      <button onClick={() => handleMarkAsDone(task)} className="bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold py-1 px-3 rounded">Done</button>
                  </>
                  )}
                  {task.status === TaskStatus.Done && <span className="text-gray-400 text-sm flex items-center justify-center">Completed</span>}
                  {/* Edit and Delete buttons - only for task assigner and CEO */}
                  {(canEditTask(task) || canDeleteTask(task)) && (
                      <>
                          {canEditTask(task) && (
                              <button onClick={() => handleOpenModal(task)} className="text-yellow-400 hover:text-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isPending} title={isPending ? "Changes pending approval" : "Edit Task"}>
                                  {ICONS.edit}
                              </button>
                          )}
                          {canDeleteTask(task) && (
                              <button onClick={() => handleOpenDeleteModal(task)} className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isPending || !canDeleteTask(task)} title={!canDeleteTask(task) ? "Only CEO can delete tasks that have started" : isPending ? "Changes pending approval" : "Delete Task"}>
                                  {ICONS.trash}
                              </button>
                          )}
                      </>
                  )}
                  
                  {/* Archive/Unarchive buttons - only for completed tasks */}
                  {(task.status === TaskStatus.Done || task.status === TaskStatus.Completed) && (
                      <button 
                          onClick={() => onArchiveTask(task.id, !task.archived)}
                          className={`hover:scale-110 transition-transform ${
                              task.archived ? 'text-blue-400 hover:text-blue-300' : 'text-gray-400 hover:text-gray-300'
                          }`}
                          title={task.archived ? 'Unarchive task' : 'Archive task'}
                      >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              {task.archived ? (
                                  // Unarchive icon (box with arrow up)
                                  <path d="M4 3a2 2 0 00-2 2v1.816a2 2 0 00.586 1.414l.812.812A2 2 0 004.812 9H15a2 2 0 001.414-.586l.812-.812A2 2 0 0018 6.586V5a2 2 0 00-2-2H4zm6 6a1 1 0 00-1 1v3a1 1 0 102 0v-3a1 1 0 00-1-1zm-3 2a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z"/>
                              ) : (
                                  // Archive icon (box with arrow down)
                                  <path d="M4 3a2 2 0 00-2 2v1.816a2 2 0 00.586 1.414l.812.812A2 2 0 004.812 9H15a2 2 0 001.414-.586l.812-.812A2 2 0 0018 6.586V5a2 2 0 00-2-2H4zm3 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z"/>
                              )}
                          </svg>
                      </button>
                  )}
              </div>
            </Card>
          )
        })}
      </div>
      
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingTask && 'id' in editingTask ? 'Edit Task' : 'Assign New Task'} closeOnOutsideClick={false}>
          {editingTask && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input name="title" value={editingTask.title} onChange={handleChange} placeholder="Task Title" className="w-full p-2 bg-gray-700 rounded border border-gray-600" required />
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <RichTextEditor
                  value={editingTask.description || ''}
                  onChange={(html) => setEditingTask(prev => prev ? { ...prev, description: html } : prev)}
                  placeholder="Describe the task details..."
                />
                </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Project (Optional)</label>
                      <select name="projectId" value={editingTask.projectId || ''} onChange={handleChange} className="w-full p-2 bg-gray-700 rounded border border-gray-600">
                          <option value="">Select Project</option>
                          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                  </div>

                  <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Client (Optional)</label>
                      <select name="clientId" value={editingTask.clientId || ''} onChange={handleChange} className="w-full p-2 bg-gray-700 rounded border border-gray-600">
                          <option value="">Select Client</option>
                          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                  </div>

                  <div className="md:col-span-2 relative" ref={divisionDropdownRef}>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Divisions</label>
                    <div className="bg-gray-700 border border-gray-600 rounded-lg p-2 flex flex-wrap gap-2 items-center min-h-[42px] cursor-pointer" onClick={() => setIsDivisionDropdownOpen(true)}>
                        {(editingTask.divisions || []).map(division => (
                            <span key={division} className="bg-gray-600 text-white px-2 py-0.5 rounded-full text-sm flex items-center gap-2">
                                {division}
                                <button type="button" onClick={(e) => { e.stopPropagation(); handleDivisionSelection(division); }} className="font-bold text-base hover:text-red-300">&times;</button>
                            </span>
                        ))}
                        {(editingTask.divisions || []).length === 0 && <span className="text-gray-400 px-2">Select divisions...</span>}
                    </div>
                    {isDivisionDropdownOpen && (
                        <div className="absolute z-30 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg">
                            <input type="text" placeholder="Search divisions..." value={divisionSearch} onChange={e => setDivisionSearch(e.target.value)} className="w-full p-2 bg-gray-900 border-b border-gray-600" />
                            <ul className="max-h-48 overflow-y-auto">
                                {filteredDivisions.map(division => (
                                    <li key={division} onClick={() => handleDivisionSelection(division)} className={`p-2 cursor-pointer hover:bg-primary-500 flex items-center justify-between ${(editingTask.divisions || []).includes(division) ? 'bg-primary-600' : ''}`}>
                                        {division}
                                        {(editingTask.divisions || []).includes(division) && <span className="text-white">✓</span>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                  <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Assign To</label>
                      <select name="assignedToId" value={editingTask.assignedToId} onChange={handleChange} className="w-full p-2 bg-gray-700 rounded border border-gray-600" required>
                          <option value="">Assign To</option>
                          {teammates.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                  </div>

                  <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
                      <select name="priority" value={editingTask.priority} onChange={handleChange} className="w-full p-2 bg-gray-700 rounded border border-gray-600" required>
                          {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                  </div>

                  <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Deadline (DD/MM/YYYY)</label>
                      <input name="deadline" type="date" value={formatDeadlineForStorage(editingTask.deadline)} onChange={handleChange} className="w-full p-2 bg-gray-700 rounded border border-gray-600" required />
                  </div>
                  
                  <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Allocated Time HH:MM</label>
                      <div className="flex items-center space-x-2">
                          <input 
                              name="allocatedHoursInput" 
                              type="number" 
                              value={String(allocatedHoursValue)}
                              onChange={handleAllocatedTimeChange} 
                              className="w-full p-2 bg-gray-700 rounded border border-gray-600" 
                              min="0" 
                              placeholder="Hours" 
                          />
                          <input 
                              name="allocatedMinutesInput" 
                              type="number" 
                              value={String(allocatedMinutesValue)}
                              onChange={handleAllocatedTimeChange} 
                              className="w-full p-2 bg-gray-700 rounded border border-gray-600" 
                              min="0" 
                              max="59" 
                              placeholder="Minutes" 
                          />
                      </div>
                  </div>
              </div>
              <div className="flex justify-end pt-4">
                  <button type="submit" className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-lg">
                      {'id' in editingTask ? 'Save Changes' : 'Assign Task'}
                  </button>
              </div>
            </form>
          )}
      </Modal>

       <Modal isOpen={isReportModalOpen} onClose={handleCloseReportModal} title="Submit Completion Report" closeOnOutsideClick={false}>
            {reportingTask && (
              <form onSubmit={handleReportSubmit} className="space-y-6">
                <p className="text-gray-300">Submitting task: <span className="font-semibold text-white">{reportingTask.title}</span></p>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Accomplishments</label>
                  <div className="bg-gray-800 border border-gray-600 rounded-lg">
                    <div className="flex items-center p-1.5 border-b border-gray-600 space-x-1">
                        <button type="button" className="px-2 py-1 rounded hover:bg-gray-700 text-gray-300 font-bold text-sm">B</button>
                        <button type="button" className="px-2 py-1 rounded hover:bg-gray-700 text-gray-300 italic text-sm">I</button>
                        <button type="button" className="px-2 py-1 rounded hover:bg-gray-700 text-gray-300 underline text-sm">U</button>
                    </div>
                    <textarea 
                        name="completionReport" 
                        value={completionReport} 
                        onChange={(e) => setCompletionReport(e.target.value)} 
                        placeholder="Provide a brief report on what was accomplished..." 
                        className="w-full p-2 bg-gray-800 rounded-b-lg border-none focus:ring-0 min-h-[100px] resize-y" 
                        required 
                    ></textarea>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Work Experience</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="radio" name="workExperience" value="smooth" checked={workExperience === 'smooth'} onChange={() => setWorkExperience('smooth')} className="form-radio bg-gray-900 text-primary-500 border-gray-600 focus:ring-primary-500" />
                      <span className="text-gray-200">Went smoothly</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="radio" name="workExperience" value="issues" checked={workExperience === 'issues'} onChange={() => setWorkExperience('issues')} className="form-radio bg-gray-900 text-primary-500 border-gray-600 focus:ring-primary-500" />
                      <span className="text-gray-200">Encountered issues</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Suggestions for Improvement</label>
                  <textarea 
                      name="suggestions"
                      value={suggestions}
                      onChange={e => setSuggestions(e.target.value)}
                      placeholder="Any suggestions for the project, task, or work environment?" 
                      className="w-full p-2 bg-gray-700 rounded border border-gray-600 min-h-[80px]" 
                  >
                  </textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Google Drive Link</label>
                  <input 
                      type="url"
                      value={driveLink}
                      onChange={e => setDriveLink(e.target.value)}
                      placeholder="https://drive.google.com/file/d/..." 
                      className="w-full p-2 bg-gray-700 rounded border border-gray-600" 
                  />
                  <p className="text-xs text-gray-500 mt-1">Paste a Google Drive URL to your files or folder</p>
                </div>

                <div className="flex justify-end pt-4">
                    <button type="submit" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">Mark as Done</button>
                </div>
              </form>
            )}
        </Modal>
        
        {/* Delete Confirmation Modal */}
        <Modal isOpen={isDeleteModalOpen} onClose={handleCloseDeleteModal} title="Delete Task">
            {taskToDelete && (
                <div className="space-y-4">
                    <p className="text-gray-300">
                        Are you sure you want to delete the task 
                        <span className="font-semibold text-white">"{taskToDelete.title}"</span>?
                    </p>
                    <p className="text-sm text-gray-400">
                        This action cannot be undone.
                    </p>
                    
                    <div className="flex justify-end space-x-3 pt-4">
                        <button 
                            onClick={handleCloseDeleteModal} 
                            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleConfirmDelete} 
                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg"
                        >
                            Delete Task
                        </button>
                    </div>
                </div>
            )}
        </Modal>
        
        {/* Real-time Toast Notifications */}
        <ToastNotifications toasts={toasts} />
    </div>
  );
};
