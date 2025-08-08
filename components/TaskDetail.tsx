
import React, { useState, useMemo, useEffect } from 'react';
import { Task, Project, Client, Teammate, Comment, PendingUpdate, TaskStatus, TaskPriority } from '../types';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { StarRating } from './ui/StarRating';
import { Modal } from './ui/Modal';

const statusColors: { [key in TaskStatus]: 'gray' | 'blue' | 'green' } = {
  [TaskStatus.ToDo]: 'gray',
  [TaskStatus.InProgress]: 'blue',
  [TaskStatus.Done]: 'green',
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
    onNavClick: (view: string) => void;
}

export const TaskDetail: React.FC<TaskDetailProps> = ({ task, project, client, allTeammates, currentUser, comments, updateHistory, onAddComment, onUpdateTask, onRateTask, onNavClick }) => {
    const [newComment, setNewComment] = useState('');
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [completionReport, setCompletionReport] = useState('');
const [workExperience, setWorkExperience] = useState<'smooth' | 'issues'>('smooth');
    const [suggestions, setSuggestions] = useState('');
const [driveLink, setDriveLink] = useState('');

    const assignedTo = allTeammates.find(t => t.id === task.assignedToId);
    const assignedBy = allTeammates.find(t => t.id === task.assignedById);
    const isCeo = currentUser.role === 'CEO';
    const isManager = ['HR and Admin', 'CEO', 'Lead Web Developer', 'SMM and Design Lead', 'Sales and PR Lead', 'Lead SEO Expert'].includes(currentUser.role);
    const isComplete = task.status === TaskStatus.Done;
    const canRateAsCeo = isCeo && isComplete;
    const canRateAsAssigner = currentUser.id === task.assignedById && isComplete;


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
            status: TaskStatus.Done,
            completionReport: completionReport,
            workExperience: workExperience,
            suggestions: suggestions,
            driveLink: driveLink
        });
        handleCloseReportModal();
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
                    <Card>
                        <h3 className="text-xl font-semibold text-white mb-2">Description</h3>
                        <p className="text-gray-300 whitespace-pre-wrap">{task.description || 'No description provided.'}</p>
                    </Card>
                    <Card>
                        <h3 className="text-xl font-semibold text-white mb-4">Details</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div><p className="text-gray-400">Status</p><Badge color={statusColors[task.status]}>{task.status}</Badge></div>
                            <div><p className="text-gray-400">Priority</p><Badge color={priorityColors[task.priority]}>{task.priority}</Badge></div>
                            <div><p className="text-gray-400">Deadline</p><p className="font-medium text-white">{new Date(task.deadline).toLocaleDateString()}</p></div>
                            <div><p className="text-gray-400">Assigned To</p><p className="font-medium text-white">{assignedTo?.name || 'N/A'}</p></div>
                            <div><p className="text-gray-400">Assigned By</p><p className="font-medium text-white">{assignedBy?.name || 'N/A'}</p></div>
                            <div><p className="text-gray-400">Client</p><p className="font-medium text-white">{client?.name || 'N/A'}</p></div>
                            <div className="col-span-full"><p className="text-gray-400">Divisions</p><p className="font-medium text-white">{task.divisions?.join(', ') || 'N/A'}</p></div>
                        </div>
                    </Card>
                    {isComplete && (task.completionReport || task.workExperience || task.suggestions || task.driveLink) && (
                         <Card>
                            <h3 className="text-xl font-semibold text-white mb-4">Completion Report</h3>
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
                        {(currentUser.id === task.assignedToId || isManager) && task.status !== TaskStatus.Done && (
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
                                <button onClick={handleMarkAsDone} className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-lg">Mark as Done</button>
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
        </div>
    )
}
