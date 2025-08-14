
import React, { useState, useMemo } from 'react';
import { Project, Task, Client, Teammate, Comment, PendingUpdate, TaskStatus, TaskPriority, ProjectPendingUpdate } from '../types';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { RichTextEditor } from './ui/RichTextEditor';
import { StarRating } from './ui/StarRating';
import { ICONS } from '../constants';
import { Modal } from './ui/Modal';

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

const formatTime = (totalSeconds: number): string => {
    if (totalSeconds < 0) totalSeconds = 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
};

const renderValue = (key: string, value: any) => {
    if (value === undefined || value === null || value === '') return <span className="italic text-gray-500">empty</span>;
    if (Array.isArray(value)) return `[${value.join(', ')}]`;
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if ((key === 'deadline' || key === 'startDate' || key === 'endDate') && typeof value === 'string' && value) {
        return new Date(value).toLocaleDateString();
    }
    return String(value);
};

const timeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)}y ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)}mo ago`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)}d ago`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)}m ago`;
    return `${Math.floor(seconds)}s ago`;
};


interface ProjectDetailProps {
    project: Project;
    tasks: Task[];
    client?: Client;
    teammates: Teammate[];
    allTeammates: Teammate[];
    comments: Comment[];
    updateHistory: PendingUpdate[];
    onNavClick: (view: string) => void;
    onAddTask: (task: Omit<Task, 'id' | 'timeSpentSeconds' | 'timerStartTime' | 'assignedById' | 'ratings'>) => void;
    onUpdateTask: (task: Task) => void;
    onAddComment: (parentId: string, text: string) => void;
    currentUser: Teammate;
    divisions: string[];
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, tasks, client, teammates, allTeammates, comments, updateHistory, onNavClick, onAddTask, onUpdateTask, onAddComment, currentUser, divisions }) => {
    const [activeTab, setActiveTab] = useState('tasks');
    const [newComment, setNewComment] = useState('');
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [taskTimeError, setTaskTimeError] = useState<string | null>(null);

    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editedTaskData, setEditedTaskData] = useState<Task | null>(null);

    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportingTask, setReportingTask] = useState<Task | null>(null);
    const [completionReport, setCompletionReport] = useState('');
    const [workExperience, setWorkExperience] = useState<'smooth' | 'issues'>('smooth');
    const [suggestions, setSuggestions] = useState('');
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

    const emptyTaskForProject: Omit<Task, 'id' | 'timeSpentSeconds' | 'timerStartTime' | 'assignedById' | 'ratings'> = {
      title: '',
      description: '',
      status: TaskStatus.ToDo,
      deadline: '',
      priority: TaskPriority.Medium,
      assignedToId: '',
      allocatedTimeInSeconds: 0,
      projectId: project.id,
      clientId: project.clientId,
      divisions: [],
    };
    
    const [newTask, setNewTask] = useState(emptyTaskForProject);

    const team = useMemo(() => allTeammates.filter(t => project.teamMemberIds.includes(t.id)), [allTeammates, project.teamMemberIds]);
    const isCeo = currentUser.role === 'CEO';
    const creator = allTeammates.find(t => t.id === project.createdById);
    const isAssigner = currentUser.id === project.createdById;

    const isComplete = useMemo(() => {
        if (tasks.length === 0) return false;
        return tasks.every(t => t.status === TaskStatus.Completed);
    }, [tasks]);

    const canRateAsAssigner = currentUser.id === project.createdById && isComplete;
    const assignerRating = project.ratings?.assigner;
    const ceoRating = project.ratings?.ceo;
    
    const visibleRatings: number[] = [];
    if (assignerRating !== undefined) visibleRatings.push(assignerRating);
    if (isCeo && ceoRating !== undefined) visibleRatings.push(ceoRating);
    const avgRating = visibleRatings.length > 0 ? visibleRatings.reduce((a, b) => a + b, 0) / visibleRatings.length : 0;
    
    const progress = useMemo(() => {
        if (tasks.length === 0) return 0;
        const completedTasks = tasks.filter(t => t.status === TaskStatus.Completed).length;
        return Math.round((completedTasks / tasks.length) * 100);
    }, [tasks]);

    const timeSpentOnTasks = useMemo(() => {
        return tasks.reduce((acc, task) => {
            let spent = task.timeSpentSeconds;
            if (task.timerStartTime) {
                spent += (new Date().getTime() - new Date(task.timerStartTime).getTime()) / 1000;
            }
            return acc + spent;
        }, 0);
    }, [tasks]);
    
    const timeProgress = useMemo(() => {
        if (!project.allocatedTimeInSeconds) return 0;
        return Math.round((timeSpentOnTasks / project.allocatedTimeInSeconds) * 100);
    }, [timeSpentOnTasks, project.allocatedTimeInSeconds]);

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim()) {
            onAddComment(project.id, newComment);
            setNewComment('');
        }
    };
    
    const handleOpenTaskModal = () => {
      setNewTask(emptyTaskForProject);
      setIsTaskModalOpen(true);
      setTaskTimeError(null);
    };

    const handleCloseTaskModal = () => {
      setIsTaskModalOpen(false);
    };

    const handleTaskSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const currentTasksTotalTime = tasks.reduce((acc, task) => acc + task.allocatedTimeInSeconds, 0);
      const availableTime = project.allocatedTimeInSeconds - currentTasksTotalTime;

      if (newTask.allocatedTimeInSeconds > availableTime) {
          setTaskTimeError(`Exceeds project's remaining allocated time. You can assign up to ${formatTime(Math.max(0, availableTime))}.`);
          return;
      }

      onAddTask(newTask);
      handleCloseTaskModal();
    };
    
    const handleNewTaskChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setNewTask(prev => ({ ...prev, [name]: value }));
    };
    
    const handleAllocatedTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTaskTimeError(null);
        const { name, value } = e.target;
        const numValue = parseInt(value) || 0;
        const currentSeconds = newTask.allocatedTimeInSeconds || 0;
        const currentHours = Math.floor(currentSeconds / 3600);
        const currentMinutes = Math.floor((currentSeconds % 3600) / 60);

        let newTotalSeconds = 0;
        if (name === 'allocatedHoursInput') {
            newTotalSeconds = (numValue * 3600) + (currentMinutes * 60);
        } else if (name === 'allocatedMinutesInput') {
            newTotalSeconds = (currentHours * 3600) + (numValue * 60);
        }
        setNewTask(prev => ({...prev, allocatedTimeInSeconds: newTotalSeconds}));
    };

    const handleStartEdit = (task: Task) => {
        setEditingTaskId(task.id);
        setEditedTaskData({ ...task });
        setTaskTimeError(null);
    };

    const handleCancelEdit = () => {
        setEditingTaskId(null);
        setEditedTaskData(null);
    };

    const handleSaveEdit = () => {
        if (!editedTaskData) return;
        const otherTasksTime = tasks
            .filter(t => t.id !== editedTaskData.id)
            .reduce((acc, task) => acc + task.allocatedTimeInSeconds, 0);
        
        const availableTime = project.allocatedTimeInSeconds - otherTasksTime;

        if (editedTaskData.allocatedTimeInSeconds > availableTime) {
            setTaskTimeError(`Exceeds project's remaining allocated time. You can assign up to ${formatTime(Math.max(0, availableTime))}.`);
            return;
        }

        onUpdateTask(editedTaskData);
        handleCancelEdit();
    };

    const handleEditedTaskChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        if (!editedTaskData) return;
        const { name, value } = e.target;
        setEditedTaskData(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleEditedAllocatedTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editedTaskData) return;
        setTaskTimeError(null);
        const { name, value } = e.target;
        const numValue = parseInt(value) || 0;
        const currentSeconds = editedTaskData.allocatedTimeInSeconds || 0;
        const currentHours = Math.floor(currentSeconds / 3600);
        const currentMinutes = Math.floor((currentSeconds % 3600) / 60);

        let newTotalSeconds = 0;
        if (name === 'editedAllocatedHoursInput') {
            newTotalSeconds = (numValue * 3600) + (currentMinutes * 60);
        } else if (name === 'editedAllocatedMinutesInput') {
            newTotalSeconds = (currentHours * 3600) + (numValue * 60);
        }
        setEditedTaskData(prev => prev ? {...prev, allocatedTimeInSeconds: newTotalSeconds} : null);
    };

    const handleOpenReportModal = (task: Task) => {
        setReportingTask(task);
        setCompletionReport(task.completionReport || '');
        setWorkExperience(task.workExperience || 'smooth');
        setSuggestions(task.suggestions || '');
        setAttachedFiles([]);
        setIsReportModalOpen(true);
    };
    
    const handleCloseReportModal = () => {
        setIsReportModalOpen(false);
        setReportingTask(null);
        setCompletionReport('');
        setWorkExperience('smooth');
        setSuggestions('');
        setAttachedFiles([]);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const handleRemoveFile = (fileName: string) => {
        setAttachedFiles(prev => prev.filter(f => f.name !== fileName));
    };

    const handleTimerAction = (task: Task, action: 'start' | 'pause') => {
      if (action === 'start') {
          onUpdateTask({
              ...task,
              status: TaskStatus.InProgress,
              timerStartTime: new Date().toISOString(),
          });
      } else { // pause
          if (!task.timerStartTime) return; 
          const elapsedSeconds = (new Date().getTime() - new Date(task.timerStartTime).getTime()) / 1000;
          onUpdateTask({
              ...task,
              timeSpentSeconds: task.timeSpentSeconds + elapsedSeconds,
              timerStartTime: undefined,
          });
      }
    };

    const handleMarkAsCompleted = (task: Task) => {
      let taskToReport = { ...task };
      if (task.timerStartTime) {
          const elapsedSeconds = (new Date().getTime() - new Date(task.timerStartTime).getTime()) / 1000;
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
              status: TaskStatus.Completed,
              completionReport: completionReport,
              workExperience: workExperience,
              suggestions: suggestions,
              completionFiles: attachedFiles.map(f => f.name)
          });
          handleCloseReportModal();
      }
    };

    type CombinedHistoryItem = (Comment & { historyItemType: 'comment'; date: string }) | (ProjectPendingUpdate & { historyItemType: 'update'; date: string });

    const combinedHistory = useMemo((): CombinedHistoryItem[] => {
        const history = [
            ...comments.map(c => ({...c, historyItemType: 'comment' as const, date: c.timestamp})),
            ...updateHistory.filter(u => u.type === 'project').map(u => ({...(u as ProjectPendingUpdate), historyItemType: 'update' as const, date: u.requestedAt}))
        ];
        return history.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [comments, updateHistory]);

    return (
        <div className="p-4 sm:p-6">
            <div className="mb-6">
                <button onClick={() => onNavClick('projects')} className="text-sm text-primary-400 hover:underline">&larr; Back to Projects</button>
                <h1 className="text-3xl font-bold text-white mt-1">{project.name}</h1>
                <p className="text-gray-400">Client: {client?.name || 'N/A'}</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <h3 className="text-xl font-semibold text-white mb-4">Project Details</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span className="text-gray-400">Priority</span><Badge color={priorityColors[project.priority]}>{project.priority}</Badge></div>
                            <div className="flex justify-between"><span className="text-gray-400">Start Date</span><span className="font-medium text-white">{new Date(project.startDate).toLocaleDateString()}</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">End Date</span><span className="font-medium text-white">{new Date(project.endDate).toLocaleDateString()}</span></div>
                             <div className="flex justify-between"><span className="text-gray-400">Assigner</span><span className="font-medium text-white">{creator?.name || 'N/A'}</span></div>
                             <div>
                                <p className="text-gray-400 mb-1">Divisions</p>
                                <div className="flex flex-wrap gap-1">
                                    {project.divisions.map(d => <Badge key={d} color="gray">{d}</Badge>)}
                                </div>
                            </div>
                            <div className="pt-2">
                                <div className="flex justify-between mb-1"><span className="text-gray-400">Task Progress</span><span className="font-medium text-white">{progress}%</span></div>
                                <div className="w-full bg-gray-700 rounded-full h-2.5"><div className="bg-primary-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div></div>
                            </div>
                             <div className="pt-2">
                                <div className="flex justify-between mb-1"><span className="text-gray-400">Time Usage</span><span className="font-medium text-white">{timeProgress}%</span></div>
                                <p className="text-xs text-center text-gray-300">{formatTime(timeSpentOnTasks)} / {formatTime(project.allocatedTimeInSeconds)}</p>
                                <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1"><div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, timeProgress)}%` }}></div></div>
                            </div>
                        </div>
                    </Card>
                     <Card>
                        <h3 className="text-xl font-semibold text-white mb-4">Ratings</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center" title={!canRateAsAssigner ? (isComplete ? `Only project assigner (${creator?.name}) can rate` : "Project must be 100% complete") : ""}><span className="text-gray-400">Assigner Rating</span><StarRating rating={assignerRating || 0} disabled={!canRateAsAssigner} /></div>
                            {isCeo && <div className="flex justify-between items-center"><span className="text-gray-400">CEO Rating</span><StarRating rating={ceoRating || 0} disabled={!isComplete} /></div>}
                            <div className="flex justify-between items-center pt-3 border-t border-gray-700"><span className="text-gray-400 font-bold">Overall Rating</span><div className="flex items-center gap-2"><StarRating rating={avgRating} disabled /><span className="font-bold text-white">{avgRating.toFixed(1)}</span></div></div>
                        </div>
                    </Card>
                    <Card>
                        <h3 className="text-xl font-semibold text-white mb-4">Team</h3>
                        <div className="space-y-3">
                            {team.map(member => (
                                <div key={member.id} className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-gray-800">{member.name.charAt(0)}</div>
                                    <div>
                                        <p className="font-medium text-white">{member.name}</p>
                                        <p className="text-sm text-gray-400">{member.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
                
                {/* Right Column */}
                <div className="lg:col-span-2">
                     <Card>
                        <div className="pb-4 mb-4 border-b border-gray-700">
                            <h3 className="text-xl font-semibold text-white mb-2">Description</h3>
                            <p className="text-gray-300 whitespace-pre-wrap text-sm">{project.description || 'No description provided.'}</p>
                        </div>
                        <div className="flex justify-between items-center border-b border-gray-700 mb-4 overflow-x-auto">
                            <div className="flex flex-shrink-0">
                                <button onClick={() => setActiveTab('tasks')} className={`py-2 px-4 font-medium text-sm whitespace-nowrap ${activeTab === 'tasks' ? 'border-b-2 border-primary-500 text-primary-400' : 'text-gray-400'}`}>Tasks ({tasks.length})</button>
                                <button onClick={() => setActiveTab('history')} className={`py-2 px-4 font-medium text-sm whitespace-nowrap ${activeTab === 'history' ? 'border-b-2 border-primary-500 text-primary-400' : 'text-gray-400'}`}>History & Comments ({combinedHistory.length})</button>
                            </div>
                            {activeTab === 'tasks' && (isAssigner || isCeo) && (
                                <button onClick={handleOpenTaskModal} className="bg-primary-500/20 text-primary-300 hover:bg-primary-500/40 text-xs font-bold py-1 px-3 rounded-md flex items-center space-x-1 ml-auto flex-shrink-0">
                                    {ICONS.plus}
                                    <span className="hidden sm:inline">Assign Task</span>
                                </button>
                            )}
                        </div>

                        {activeTab === 'tasks' && (
                           <div className="space-y-2">
                                {tasks.map(task => {
                                    const isEditing = editingTaskId === task.id && editedTaskData;

                                    return isEditing ? (
                                        <div key={task.id} className="p-3 bg-gray-700/50 rounded-lg space-y-3">
                                            {/* Edit Form */}
                                            <input name="title" value={editedTaskData.title} onChange={handleEditedTaskChange} placeholder="Task Title" className="w-full p-2 bg-gray-800 rounded border border-gray-600 text-white" required />
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-400 mb-1">Assign To</label>
                                                    <select name="assignedToId" value={editedTaskData.assignedToId} onChange={handleEditedTaskChange} className="w-full p-2 bg-gray-800 rounded border border-gray-600 text-white" required>
                                                        {team.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-400 mb-1">Priority</label>
                                                    <select name="priority" value={editedTaskData.priority} onChange={handleEditedTaskChange} className="w-full p-2 bg-gray-800 rounded border border-gray-600 text-white" required>
                                                        {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-400 mb-1">Deadline</label>
                                                    <input name="deadline" type="date" value={new Date(editedTaskData.deadline).toISOString().substring(0, 10)} onChange={handleEditedTaskChange} className="w-full p-2 bg-gray-800 rounded border border-gray-600 text-white" required />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-400 mb-1">Allocated Time</label>
                                                    <div className="flex items-center space-x-2">
                                                        <input name="editedAllocatedHoursInput" type="number" value={String(Math.floor(editedTaskData.allocatedTimeInSeconds / 3600))} onChange={handleEditedAllocatedTimeChange} className="w-full p-2 bg-gray-800 rounded border border-gray-600 text-white" min="0" placeholder="H" />
                                                        <input name="editedAllocatedMinutesInput" type="number" value={String(Math.floor((editedTaskData.allocatedTimeInSeconds % 3600) / 60))} onChange={handleEditedAllocatedTimeChange} className="w-full p-2 bg-gray-800 rounded border border-gray-600 text-white" min="0" max="59" placeholder="M" />
                                                    </div>
                                                </div>
                                            </div>
                                            {taskTimeError && <p className="text-red-400 text-sm">{taskTimeError}</p>}
                                            <div className="flex justify-end items-center space-x-2 pt-2 border-t border-gray-600/50">
                                                <p className="text-xs text-yellow-400 mr-auto">{task.status !== TaskStatus.ToDo ? 'Changes require CEO approval' : ''}</p>
                                                <button onClick={handleCancelEdit} className="text-gray-300 hover:text-white text-sm font-medium py-1 px-3 rounded-md">Cancel</button>
                                                <button onClick={handleSaveEdit} className="bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold py-1 px-3 rounded-md">Save</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div key={task.id} className="p-3 bg-gray-900/50 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                            <div className="w-full sm:w-auto">
                                                <button onClick={() => onNavClick(`taskDetail/${task.id}`)} className="font-medium text-white hover:text-primary-400">{task.title}</button>
                                                <p className="text-xs text-gray-400">Assigned to: {teammates.find(t => t.id === task.assignedToId)?.name || 'N/A'}</p>
                                            </div>
                                            <div className="flex items-center space-x-3 w-full sm:w-auto justify-between">
                                                <Badge color={statusColors[task.status]}>{task.status}</Badge>
                                                <div className="flex items-center space-x-2">
                                                    {task.assignedToId === currentUser.id && task.status !== TaskStatus.Completed && (
                                                        <>
                                                            {task.status === TaskStatus.ToDo && (
                                                                <button onClick={() => handleTimerAction(task, 'start')} className="bg-green-500/20 text-green-300 hover:bg-green-500/40 text-xs font-bold py-1 px-2 rounded">Start</button>
                                                            )}
                                                            {task.status === TaskStatus.InProgress && task.timerStartTime && (
                                                                <button onClick={() => handleTimerAction(task, 'pause')} className="bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/40 text-xs font-bold py-1 px-2 rounded">Pause</button>
                                                            )}
                                                            {task.status === TaskStatus.InProgress && !task.timerStartTime && (
                                                                <button onClick={() => handleTimerAction(task, 'start')} className="bg-green-500/20 text-green-300 hover:bg-green-500/40 text-xs font-bold py-1 px-2 rounded">Resume</button>
                                                            )}
                                                            <button onClick={() => handleMarkAsCompleted(task)} className="bg-primary-500/20 text-primary-300 hover:bg-primary-500/40 text-xs font-bold py-1 px-2 rounded">Completed</button>
                                                        </>
                                                    )}
                                                    {(isAssigner || isCeo) && (
                                                        <button onClick={() => handleStartEdit(task)} className="text-gray-400 hover:text-white" title="Edit Task">{ICONS.edit}</button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                           </div>
                        )}
                         {activeTab === 'history' && (
                            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                               {combinedHistory.length === 0 && <p className="text-center text-gray-400">No history or comments yet.</p>}
                               {combinedHistory.map(item => {
                                    if (item.historyItemType === 'comment') {
                                        const author = allTeammates.find(t => t.id === item.authorId);
                                        return (
                                           <div key={item.id} className="flex items-start space-x-3">
                                               <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center font-bold text-sm flex-shrink-0">{author?.name.charAt(0) || '?'}</div>
                                               <div className="flex-1">
                                                   <p className="text-sm"><span className="font-semibold text-white">{author?.name || 'Unknown'}</span><span className="text-gray-400 ml-2">{timeAgo(item.date)}</span></p>
                                                   <p className="p-2 bg-gray-700/50 rounded-md mt-1 text-white">{item.text}</p>
                                               </div>
                                           </div>
                                        )
                                    }
                                    if (item.historyItemType === 'update') {
                                        const author = allTeammates.find(t => t.id === item.requestedBy);
                                        return (
                                           <div key={item.id} className="flex items-start space-x-3">
                                               <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center font-bold text-sm flex-shrink-0">{author?.name.charAt(0) || '?'}</div>
                                               <div className="flex-1">
                                                   <p className="text-sm"><span className="font-semibold text-white">{author?.name || 'Unknown'}</span><span className="text-gray-400 ml-2">{timeAgo(item.date)}</span></p>
                                                   <div className="p-2 border border-gray-700 rounded-md mt-1">
                                                       <p className="text-sm font-semibold text-gray-300 mb-1">Requested changes:</p>
                                                       <div className="space-y-1 text-xs">
                                                           {Object.entries(item.data).map(([key, value]) => (<div key={key}><strong className="capitalize font-normal text-gray-400">{key.replace(/([A-Z])/g, ' $1')}:</strong> <span className="font-mono text-red-400 line-through ml-2">{renderValue(key, (item.originalData as Record<string, any>)[key])}</span><span className="mx-1 text-gray-500">→</span><span className="font-mono text-green-400">{renderValue(key, value)}</span></div>))}
                                                       </div>
                                                       {item.status !== 'pending' && <p className={`mt-2 text-xs font-bold ${item.status === 'approved' ? 'text-green-400':'text-red-400'}`}>Status: {item.status} by {allTeammates.find(t => t.id === item.resolvedBy)?.name || 'N/A'}</p>}
                                                   </div>
                                               </div>
                                           </div>
                                        )
                                    }
                                    return null;
                               })}
                                <form onSubmit={handleCommentSubmit} className="flex items-center space-x-2 pt-4 border-t border-gray-700">
                                    <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment..." className="w-full p-2 bg-gray-700 rounded border border-gray-600"/>
                                    <button type="submit" className="bg-primary-500 hover:bg-primary-600 text-white font-bold p-2 rounded-lg">Send</button>
                                </form>
                            </div>
                        )}
                    </Card>
                </div>
            </div>

<Modal isOpen={isTaskModalOpen} onClose={handleCloseTaskModal} title="Assign New Task" closeOnOutsideClick={false}>
              <form onSubmit={handleTaskSubmit} className="space-y-4">
                  <input name="title" value={newTask.title} onChange={handleNewTaskChange} placeholder="Task Title" className="w-full p-2 bg-gray-700 rounded border border-gray-600" required />
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                    <RichTextEditor
                      value={newTask.description || ''}
                      onChange={(html) => setNewTask(prev => ({ ...prev, description: html }))}
                      placeholder="Describe the task details..."
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Assign To</label>
                          <select name="assignedToId" value={newTask.assignedToId} onChange={handleNewTaskChange} className="w-full p-2 bg-gray-700 rounded border border-gray-600" required>
                              <option value="">Select Teammate</option>
                              {team.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
                          <select name="priority" value={newTask.priority} onChange={handleNewTaskChange} className="w-full p-2 bg-gray-700 rounded border border-gray-600" required>
                              {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Deadline</label>
                          <input name="deadline" type="date" value={newTask.deadline} onChange={handleNewTaskChange} className="w-full p-2 bg-gray-700 rounded border border-gray-600" required />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Allocated Time</label>
                          <div className="flex items-center space-x-2">
                              <input name="allocatedHoursInput" type="number" value={String(Math.floor(newTask.allocatedTimeInSeconds / 3600))} onChange={handleAllocatedTimeChange} className="w-full p-2 bg-gray-700 rounded border border-gray-600" min="0" placeholder="Hours" />
                              <input name="allocatedMinutesInput" type="number" value={String(Math.floor((newTask.allocatedTimeInSeconds % 3600) / 60))} onChange={handleAllocatedTimeChange} className="w-full p-2 bg-gray-700 rounded border border-gray-600" min="0" max="59" placeholder="Minutes" />
                          </div>
                      </div>
                  </div>
                  {taskTimeError && <p className="text-red-400 text-sm">{taskTimeError}</p>}
                  <div className="flex justify-end pt-4">
                      <button type="submit" className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-lg">Assign Task</button>
                  </div>
              </form>
            </Modal>
            
            <Modal isOpen={isReportModalOpen} onClose={handleCloseReportModal} title="Submit Completion Report">
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
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Attach Files / Screenshots</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        <div className="flex text-sm text-gray-400">
                          <label htmlFor="file-upload-project" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-primary-400 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 focus-within:ring-primary-500">
                            <span>Upload a file</span>
                            <input id="file-upload-project" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, PDF, etc.</p>
                      </div>
                    </div>
                    {attachedFiles.length > 0 && (
                        <div className="mt-4 space-y-2">
                            <h4 className="text-sm font-medium text-gray-300">Attached files:</h4>
                            <ul className="divide-y divide-gray-700 border border-gray-700 rounded-md">
                                {attachedFiles.map(file => (
                                    <li key={file.name} className="px-3 py-2 flex items-center justify-between text-sm">
                                        <span className="text-gray-200 truncate">{file.name}</span>
                                        <button type="button" onClick={() => handleRemoveFile(file.name)} className="text-red-400 hover:text-red-300">
                                           {ICONS.trash}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end pt-4">
                      <button type="submit" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">Mark as Completed</button>
                  </div>
                </form>
              )}
            </Modal>
        </div>
    );
};