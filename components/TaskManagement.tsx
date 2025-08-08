
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Task, Project, Teammate, TaskStatus, TaskPriority, Client, PendingUpdate } from '../types';
import { Card } from './ui/Card';
import { Modal } from './ui/Modal';
import { Badge } from './ui/Badge';
import { ICONS } from '../constants';
import { StarRating } from './ui/StarRating';
import { RichTextEditor } from './ui/RichTextEditor';

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
  clients: Client[];
  divisions: string[];
  pendingUpdates: PendingUpdate[];
  onNavClick: (view: string) => void;
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

export const TaskManagement: React.FC<TaskManagementProps> = ({ tasks, projects, teammates, currentUser, onAddTask, onEditTask, onUpdateTask, onDeleteTask, onRateTask, clients, divisions, pendingUpdates, onNavClick }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Omit<Task, 'id' | 'timeSpentSeconds' | 'timerStartTime' | 'assignedById' | 'ratings'> | Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  
  const [reportingTask, setReportingTask] = useState<Task | null>(null);
  const [completionReport, setCompletionReport] = useState('');
  const [workExperience, setWorkExperience] = useState<'smooth' | 'issues'>('smooth');
  const [suggestions, setSuggestions] = useState('');
  const [driveLink, setDriveLink] = useState('');
  
  const [divisionSearch, setDivisionSearch] = useState('');
  const [isDivisionDropdownOpen, setIsDivisionDropdownOpen] = useState(false);
  const divisionDropdownRef = useRef<HTMLDivElement>(null);
  
  const isManager = ['HR and Admin', 'CEO', 'Lead Web Developer', 'SMM and Design Lead', 'Sales and PR Lead', 'Lead SEO Expert'].includes(currentUser.role);
  const isCeo = currentUser.role === 'CEO';

  const userTasks = useMemo(() => {
    return tasks
      .filter(task => isManager || task.assignedToId === currentUser.id)
      .sort((a,b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  }, [tasks, currentUser, isManager]);

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
    setEditingTask(prev => prev ? { ...prev, [name]: type === 'number' ? parseFloat(value) : value } : null);
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
            status: TaskStatus.Done,
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

      {/* Desktop Table View */}
      <div className="hidden md:block">
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
                {userTasks.map(task => {
                  const isPending = pendingUpdates.some(p => p.type === 'task' && p.itemId === task.id);
                  const isComplete = task.status === TaskStatus.Done;
                  const canRateAsCeo = isCeo && isComplete;
                  const canRateAsAssigner = currentUser.id === task.assignedById && isComplete;
                  const assignerRating = task.ratings?.assigner || 0;
                  const ceoRating = task.ratings?.ceo || 0;

                  return (
                  <tr key={task.id} className="border-b border-gray-800 hover:bg-gray-700/50">
                    <td className="p-4 font-medium">
                      <button onClick={() => onNavClick(`taskDetail/${task.id}`)} className="text-left hover:text-primary-400 transition-colors" title={task.description}>
                          {task.title}
                      </button>
                    </td>
                    {isManager && <td className="p-4 text-gray-300">{teammates.find(e => e.id === task.assignedToId)?.name}</td>}
                    <td className="p-4 text-gray-300">{projects.find(p => p.id === task.projectId)?.name}</td>
                    <td className="p-4 text-gray-300">{new Date(task.deadline).toLocaleDateString()}</td>
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
                          {(task.assignedToId === currentUser.id || isManager) && task.status !== TaskStatus.Done && (
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
                          {isManager && (
                              <>
                                  <button onClick={() => handleOpenModal(task)} className="text-yellow-400 hover:text-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isPending} title={isPending ? "Changes pending approval" : "Edit Task"}>
                                      {ICONS.edit}
                                  </button>
                                  <button onClick={() => handleOpenDeleteModal(task)} className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isPending} title={isPending ? "Changes pending approval" : "Delete Task"}>
                                      {ICONS.trash}
                                  </button>
                              </>
                          )}
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      
      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {userTasks.map(task => {
          const isPending = pendingUpdates.some(p => p.type === 'task' && p.itemId === task.id);
          const isComplete = task.status === TaskStatus.Done;
          const canRateAsCeo = isCeo && isComplete;
          const canRateAsAssigner = currentUser.id === task.assignedById && isComplete;
          const assignerRating = task.ratings?.assigner || 0;
          const ceoRating = task.ratings?.ceo || 0;
          return (
            <Card key={task.id} className="p-4">
              <div className="flex justify-between items-start">
                  <button onClick={() => onNavClick(`taskDetail/${task.id}`)} className="text-left font-semibold text-lg text-white hover:text-primary-400 pr-2">
                      {task.title}
                  </button>
                  <Badge color={priorityColors[task.priority]}>{task.priority}</Badge>
              </div>

              <div className="mt-2 space-y-2 text-sm text-gray-300">
                  {isManager && (
                    <div><span className="text-gray-400">To: </span>{teammates.find(e => e.id === task.assignedToId)?.name}</div>
                  )}
                  <div><span className="text-gray-400">Project: </span>{projects.find(p => p.id === task.projectId)?.name || 'N/A'}</div>
                  <div><span className="text-gray-400">Deadline: </span>{new Date(task.deadline).toLocaleDateString()}</div>
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
                {(task.assignedToId === currentUser.id || isManager) && task.status !== TaskStatus.Done && (
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
                  {isManager && (
                      <>
                          <button onClick={() => handleOpenModal(task)} className="text-yellow-400 hover:text-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isPending} title={isPending ? "Changes pending approval" : "Edit Task"}>
                              {ICONS.edit}
                          </button>
                          <button onClick={() => handleOpenDeleteModal(task)} className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isPending} title={isPending ? "Changes pending approval" : "Delete Task"}>
                              {ICONS.trash}
                          </button>
                      </>
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
                      <label className="block text-sm font-medium text-gray-300 mb-1">Deadline</label>
                      <input name="deadline" type="date" value={editingTask.deadline} onChange={handleChange} className="w-full p-2 bg-gray-700 rounded border border-gray-600" required />
                  </div>
                  
                  <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Allocated Time</label>
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
    </div>
  );
};
