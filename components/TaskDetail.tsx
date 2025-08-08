
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Task, Project, Client, Teammate, TaskStatus, TaskPriority, PendingUpdate, Comment } from '../types';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { ICONS } from '../constants';
import { StarRating } from './ui/StarRating';
import { formatDeadlineForDisplay } from '../lib/date-utils';
import { RevisionModal } from './RevisionModal';

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
    if (!totalSeconds || isNaN(totalSeconds) || totalSeconds < 0) totalSeconds = 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const TimerDisplay: React.FC<{task: Task}> = ({ task }) => {
    const calculateRemaining = () => {
        // Ensure we have valid numbers, default to 0
        const allocated = Number(task.allocatedTimeInSeconds) || 0;
        const spent = Number(task.timeSpentSeconds) || 0;
        
        // Only calculate elapsed time if timer is actually running (has timerStartTime)
        let elapsedSinceStart = 0;
        if (task.timerStartTime && task.timerStartTime.trim() !== '') {
            const startTime = new Date(task.timerStartTime).getTime();
            const currentTime = new Date().getTime();
            // Only count elapsed time if start time is valid and not in the future
            if (!isNaN(startTime) && startTime <= currentTime) {
                elapsedSinceStart = (currentTime - startTime) / 1000;
            }
        }
        
        const remaining = allocated - spent - elapsedSinceStart;
        return isNaN(remaining) ? allocated - spent : remaining;
    };

    const [remainingSeconds, setRemainingSeconds] = useState(calculateRemaining);

    useEffect(() => {
        const newRemaining = calculateRemaining();
        setRemainingSeconds(newRemaining);
        
        // Only start interval if timer is actually running
        if (task.timerStartTime && task.timerStartTime.trim() !== '') {
            const interval = setInterval(() => {
                setRemainingSeconds(calculateRemaining());
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [task.timerStartTime, task.timeSpentSeconds, task.allocatedTimeInSeconds]);
    
    const isOvertime = remainingSeconds < 0;

    return (
        <div className={`font-mono font-semibold ${isOvertime ? 'text-red-400' : 'text-primary-400'}`}>
            {isOvertime && '-'}{formatTime(Math.abs(remainingSeconds))}
        </div>
    );
};

const renderValue = (key: string, value: any) => {
    if (value === undefined || value === null || value === '') return <span className="italic text-gray-500">empty</span>;
    if (Array.isArray(value)) return `[${value.join(', ')}]`;
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (key === 'deadline' && typeof value === 'string') return new Date(value).toLocaleDateString();
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

// Enhanced description display component with line break support
const TaskDescription: React.FC<{ description: string; isExpanded?: boolean }> = ({ description, isExpanded = false }) => {
    const [isFullyExpanded, setIsFullyExpanded] = useState(isExpanded);
    const [showExpandButton, setShowExpandButton] = useState(false);
    const descriptionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (descriptionRef.current) {
            const element = descriptionRef.current;
            // Check if content is truncated
            setShowExpandButton(element.scrollHeight > element.clientHeight);
        }
    }, [description]);

    if (!description) {
        return <p className="text-gray-500 italic">No description provided.</p>;
    }

    // Enhanced text processing that preserves line breaks and handles HTML
    const processDescription = (text: string): string => {
        // First, handle HTML content if present
        let processedText = text;
        
        // If it contains HTML tags, extract text content but preserve structure
        if (text.includes('<')) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = text;
            
            // Replace common HTML elements with text equivalents
            tempDiv.innerHTML = tempDiv.innerHTML
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<\/p>/gi, '\n\n')
                .replace(/<p[^>]*>/gi, '')
                .replace(/<\/div>/gi, '\n')
                .replace(/<div[^>]*>/gi, '')
                .replace(/<\/li>/gi, '\n')
                .replace(/<li[^>]*>/gi, '• ')
                .replace(/<\/ul>/gi, '\n')
                .replace(/<ul[^>]*>/gi, '')
                .replace(/<\/ol>/gi, '\n')
                .replace(/<ol[^>]*>/gi, '');
            
            processedText = tempDiv.textContent || tempDiv.innerText || '';
        }
        
        // Clean up excessive line breaks and whitespace
        processedText = processedText
            .replace(/\n\s*\n\s*\n/g, '\n\n') // Replace triple+ line breaks with double
            .replace(/^\s+|\s+$/g, '') // Trim start and end
            .replace(/[ \t]+/g, ' '); // Replace multiple spaces/tabs with single space
        
        return processedText;
    };

    const processedDescription = processDescription(description);
    const isLongContent = processedDescription.length > 300 || processedDescription.split('\n').length > 5;

    return (
        <div className="space-y-3">
            <div 
                ref={descriptionRef}
                className={`text-gray-300 leading-relaxed transition-all duration-300 ${
                    isLongContent && !isFullyExpanded 
                        ? 'max-h-32 overflow-hidden relative' 
                        : 'max-h-none'
                }`}
                style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
            >
                {processedDescription}
                
                {/* Gradient fade for truncated content */}
                {isLongContent && !isFullyExpanded && (
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-800 to-transparent pointer-events-none" />
                )}
            </div>
            
            {/* Expand/Collapse button */}
            {isLongContent && (
                <button
                    onClick={() => setIsFullyExpanded(!isFullyExpanded)}
                    className="text-sm text-primary-400 hover:text-primary-300 font-medium flex items-center gap-1 transition-colors"
                >
                    {isFullyExpanded ? (
                        <>
                            <span>Show less</span>
                            <svg className="w-4 h-4 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                        </>
                    ) : (
                        <>
                            <span>Show more</span>
                            <svg className="w-4 h-4 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </>
                    )}
                </button>
            )}
            
            {/* Copy to clipboard button for long descriptions */}
            {processedDescription.length > 100 && (
                <button
                    onClick={() => {
                        navigator.clipboard.writeText(processedDescription);
                        // You could add a toast notification here
                    }}
                    className="text-xs text-gray-400 hover:text-gray-300 flex items-center gap-1 transition-colors"
                    title="Copy description to clipboard"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copy</span>
                </button>
            )}
        </div>
    );
};

// Utility function to strip HTML tags from text (kept for backward compatibility)
const stripHtmlTags = (html: string): string => {
    if (!html) return '';
    // Create a temporary div element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    // Extract text content (automatically strips HTML tags)
    return tempDiv.textContent || tempDiv.innerText || '';
};

interface TaskDetailProps {
    task: Task;
    project?: Project;
    client?: Client;
    teammates: Teammate[];
    allTeammates: Teammate[];
    currentUser: Teammate;
    comments: Comment[];
    updateHistory: PendingUpdate[];
    onAddComment: (parentId: string, text: string) => void;
    onUpdateTask: (task: Task) => void;
    onRateTask: (taskId: string, rating: number, rater: 'assigner' | 'ceo') => void;
    onApproveTask?: (taskId: string) => void;
    onRequestRevision?: (taskId: string, revisionMessage?: string) => void;
    onNavClick: (view: string) => void;
}

export const TaskDetail: React.FC<TaskDetailProps> = ({ task, project, client, allTeammates, currentUser, comments, updateHistory, onAddComment, onUpdateTask, onRateTask, onApproveTask, onRequestRevision, onNavClick }) => {
    const [newComment, setNewComment] = useState('');
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
    const [completionReport, setCompletionReport] = useState('');
    const [workExperience, setWorkExperience] = useState<'smooth' | 'issues'>('smooth');
    const [suggestions, setSuggestions] = useState('');
    const [driveLink, setDriveLink] = useState('');

    const assignedTo = allTeammates.find(t => t.id === task.assignedToId);
    const assignedBy = allTeammates.find(t => t.id === task.assignedById);
    const isCeo = currentUser.role === 'CEO';
    const isManager = ['HR and Admin', 'CEO', 'Lead Web Developer', 'SMM and Design Lead', 'Sales and PR Lead', 'Lead SEO Expert'].includes(currentUser.role);
    const isComplete = task.status === TaskStatus.Completed;
    const canRateAsCeo = isCeo && isComplete;
    const canRateAsAssigner = currentUser.id === task.assignedById && isComplete;
    
    // Review permissions - CEO and task assigner can review tasks
    const canReview = (isCeo || currentUser.id === task.assignedById) && task.status === TaskStatus.UnderReview;
    const needsRevision = task.status === TaskStatus.RevisionRequired && currentUser.id === task.assignedToId;


    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim()) {
            onAddComment(task.id, newComment);
            setNewComment('');
        }
    };

    const combinedHistory = useMemo(() => {
        const history = [
            ...comments.map(c => ({...c, historyItemType: 'comment' as const, date: c.timestamp})),
            ...updateHistory.map(u => ({...u, historyItemType: 'update' as const, date: u.requestedAt}))
        ];
        return history.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [comments, updateHistory]);

    const handleOpenReportModal = () => {
        setCompletionReport(task.completionReport || '');
        setWorkExperience(task.workExperience || 'smooth');
        setSuggestions(task.suggestions || '');
        setDriveLink(task.driveLink || '');
        setIsReportModalOpen(true);
    };

    const handleCloseReportModal = () => {
        setIsReportModalOpen(false);
        setCompletionReport('');
        setWorkExperience('smooth');
        setSuggestions('');
        setDriveLink('');
    };


    const handleTimerAction = (action: 'start' | 'pause') => {
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
                timerStartTime: null,
            });
        }
    };

    const handleMarkAsDone = () => {
        handleOpenReportModal();
    };

    const handleReportSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        let taskToSubmit = { ...task };
        if (taskToSubmit.timerStartTime) {
            const elapsedSeconds = Math.round((new Date().getTime() - new Date(taskToSubmit.timerStartTime).getTime()) / 1000);
            taskToSubmit.timeSpentSeconds += elapsedSeconds;
            taskToSubmit.timerStartTime = null;
        }
        onUpdateTask({
            ...taskToSubmit,
            status: TaskStatus.UnderReview,
            completionReport: completionReport,
            workExperience: workExperience,
            suggestions: suggestions,
            driveLink: driveLink
        });
        handleCloseReportModal();
    };

    // Revision modal handlers
    const handleOpenRevisionModal = () => {
        setIsRevisionModalOpen(true);
    };

    const handleCloseRevisionModal = () => {
        setIsRevisionModalOpen(false);
    };

    const handleRevisionSubmit = (revisionMessage: string) => {
        if (onRequestRevision) {
            onRequestRevision(task.id, revisionMessage);
        }
        setIsRevisionModalOpen(false);
    };


    return (
        <div className="p-6">
            <div className="mb-6">
                 <button onClick={() => onNavClick('tasks')} className="text-sm text-primary-400 hover:underline">&larr; Back to Tasks</button>
                <h1 className="text-3xl font-bold text-white mt-1">{task.title}</h1>
                <p className="text-gray-400">
                    In project: <button onClick={() => project && onNavClick(`projectDetail/${project.id}`)} className="hover:underline" disabled={!project}>{project?.name || 'N/A'}</button>
                </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Task Review UI - shown to reviewers when task is under review - MOVED TO FRONT */}
                    {canReview && onApproveTask && onRequestRevision && (
                        <Card>
                            <h3 className="text-xl font-semibold text-white mb-4">⚡ Task Review</h3>
                            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-4">
                                <p className="text-yellow-300 font-medium">🔍 Review Required</p>
                                <p className="text-gray-300 text-sm mt-1">This task has been submitted for review. Please review the completion report below and decide whether to approve or request revision.</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button 
                                    onClick={() => onApproveTask(task.id)}
                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                                >
                                    ✓ Approve & Complete Task
                                </button>
                                <button 
                                    onClick={handleOpenRevisionModal}
                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                                >
                                    ↺ Request Revision
                                </button>
                            </div>
                        </Card>
                    )}
                    
                    <Card>
                        <h3 className="text-xl font-semibold text-white mb-2">Description</h3>
                        <TaskDescription description={task.description} />
                    </Card>
                    <Card>
                        <h3 className="text-xl font-semibold text-white mb-4">Details</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div><p className="text-gray-400">Status</p><Badge color={statusColors[task.status]}>{task.status}</Badge></div>
                            <div><p className="text-gray-400">Priority</p><Badge color={priorityColors[task.priority]}>{task.priority}</Badge></div>
                            <div><p className="text-gray-400">Deadline</p><p className="font-medium text-white">{formatDeadlineForDisplay(task.deadline)}</p></div>
                            <div><p className="text-gray-400">Assigned To</p><p className="font-medium text-white">{assignedTo?.name || 'N/A'}</p></div>
                            <div><p className="text-gray-400">Assigned By</p><p className="font-medium text-white">{assignedBy?.name || 'N/A'}</p></div>
                            <div><p className="text-gray-400">Client</p><p className="font-medium text-white">{client?.name || 'N/A'}</p></div>
                            <div className="col-span-full"><p className="text-gray-400">Divisions</p><p className="font-medium text-white">{task.divisions?.join(', ') || 'N/A'}</p></div>
                        </div>
                    </Card>
                    {(isComplete || task.status === TaskStatus.UnderReview) && (task.completionReport || task.workExperience || task.suggestions || task.driveLink) && (
                         <Card>
                            <h3 className="text-xl font-semibold text-white mb-4">{task.status === TaskStatus.UnderReview ? 'Submitted Report - Awaiting Review' : 'Completion Report'}</h3>
                            {task.completionReport && (
                              <div className="mb-4">
                                <p className="text-sm text-gray-400 mb-1">Task Accomplishment</p>
                                <p className="text-gray-300 bg-gray-900/50 p-3 rounded-md whitespace-pre-wrap">{task.completionReport}</p>
                              </div>
                            )}
                            {task.workExperience && (
                              <div className="mb-4">
                                <p className="text-sm text-gray-400 mb-1">Work Experience</p>
                                <p className="text-gray-200 font-medium">
                                  {task.workExperience === 'smooth' ? 'Went smoothly' : 'Encountered issues'}
                                </p>
                              </div>
                            )}
                            {task.suggestions && (
                              <div className="mb-4">
                                <p className="text-sm text-gray-400 mb-1">Suggestions for Improvement</p>
                                <p className="text-gray-300 bg-gray-900/50 p-3 rounded-md whitespace-pre-wrap">{task.suggestions}</p>
                              </div>
                            )}
                            {task.driveLink && (
                              <div>
                                <p className="text-sm text-gray-400 mb-1">Google Drive Link</p>
                                <a 
                                  href={task.driveLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary-400 hover:text-primary-300 underline break-all"
                                >
                                  {task.driveLink}
                                </a>
                              </div>
                            )}
                        </Card>
                    )}
                    
                    {/* Revision Feedback Display - shown to assigned user when task requires revision */}
                    {needsRevision && task.revisionNote && (
                        <Card>
                            <h3 className="text-xl font-semibold text-white mb-4">🔄 Revision Feedback</h3>
                            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                                <p className="text-red-300 font-medium mb-3">📝 Review Comments</p>
                                <div className="text-gray-300 bg-gray-900/50 p-3 rounded-md whitespace-pre-wrap">
                                    {task.revisionNote}
                                </div>
                                <p className="text-red-400 text-sm mt-3">Please address the feedback above and resubmit the task.</p>
                            </div>
                        </Card>
                    )}
                </div>
                
                {/* Right Column */}
                <div className="lg:col-span-1 space-y-6">
                     <Card>
                        <h3 className="text-xl font-semibold text-white mb-4">Time Tracking</h3>
                        <div className="text-center">
                            <TimerDisplay task={task} />
                            <p className="text-sm text-gray-400">of {formatTime(task.allocatedTimeInSeconds)} allocated</p>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2.5 mt-4">
                            <div className="bg-primary-500 h-2.5 rounded-full" style={{ width: `${Math.min(100, task.allocatedTimeInSeconds ? ((task.timeSpentSeconds + (task.timerStartTime ? (Date.now() - new Date(task.timerStartTime).getTime()) / 1000 : 0)) / task.allocatedTimeInSeconds) * 100 : 0)}%` }}></div>
                        </div>
                        {/* Task timer controls - only visible to assigned teammate and only for To Do/In Progress */}
                        {currentUser.id === task.assignedToId && (task.status === TaskStatus.ToDo || task.status === TaskStatus.InProgress) && (
                            <div className="mt-6 flex items-center justify-center space-x-3">
                                {task.status === TaskStatus.ToDo && (
                                    <button onClick={() => handleTimerAction('start')} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">Start Task</button>
                                )}
                                {task.status === TaskStatus.InProgress && task.timerStartTime && (
                                    <button onClick={() => handleTimerAction('pause')} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg">Pause Timer</button>
                                )}
                                {task.status === TaskStatus.InProgress && !task.timerStartTime && (
                                    <button onClick={() => handleTimerAction('start')} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">Resume Timer</button>
                                )}
                                <button onClick={handleMarkAsDone} className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-lg">Submit for Review</button>
                            </div>
                        )}
                        
                        {/* Revision required message */}
                        {needsRevision && (
                            <div className="mt-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                                <p className="text-red-300 text-center font-medium mb-3">This task requires revision. Please review the feedback and resubmit.</p>
                                <div className="flex justify-center">
                                    <button onClick={handleMarkAsDone} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg">Resubmit for Review</button>
                                </div>
                            </div>
                        )}
                    </Card>
                    <Card>
                        <h3 className="text-xl font-semibold text-white mb-4">Ratings</h3>
                        {!isComplete ? <p className="text-sm text-center text-gray-400">Task must be completed to be rated.</p> : (
                        <div className="space-y-3 text-sm">
                            <div title={!canRateAsAssigner ? "Only task assigner can rate" : "Assigner Rating"} className="flex justify-between items-center"><span className="text-gray-400">Assigner</span><StarRating rating={task.ratings?.assigner || 0} onRatingChange={r => onRateTask(task.id, r, 'assigner')} disabled={!canRateAsAssigner} /></div>
                            {isCeo && <div title="CEO Rating" className="flex justify-between items-center"><span className="text-gray-400">CEO</span><StarRating rating={task.ratings?.ceo || 0} onRatingChange={r => onRateTask(task.id, r, 'ceo')} disabled={!canRateAsCeo} /></div>}
                        </div>
                        )}
                    </Card>
                </div>

                {/* Full-width history feed */}
                <div className="lg:col-span-3">
                     <Card>
                        <h3 className="text-xl font-semibold text-white mb-4">History & Comments</h3>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
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
                     </Card>
                </div>
            </div>

            <Modal isOpen={isReportModalOpen} onClose={handleCloseReportModal} title="Submit Completion Report">
              <form onSubmit={handleReportSubmit} className="space-y-6">
                <p className="text-gray-300">Submitting task: <span className="font-semibold text-white">{task.title}</span></p>
                
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
            </Modal>
            
            <RevisionModal 
                isOpen={isRevisionModalOpen}
                onClose={handleCloseRevisionModal}
                onSubmit={handleRevisionSubmit}
                taskTitle={task.title}
            />
        </div>
    )
}
