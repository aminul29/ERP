

import React, { useMemo } from 'react';
import { Project, Task, Teammate, TimeLog, TaskStatus, Notification } from '../types';
import { Card } from './ui/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Badge } from './ui/Badge';
import { ICONS } from '../constants';

interface DashboardProps {
  projects: Project[];
  tasks: Task[];
  teammates: Teammate[]; // Approved teammates
  allTeammates: Teammate[]; // All teammates for lookups
  timeLogs: TimeLog[];
  notifications: Notification[];
  currentUser: Teammate;
  onNavClick: (view: string) => void;
  chartColor: string;
}

const timeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
};

export const Dashboard: React.FC<DashboardProps> = ({ projects, tasks, teammates, allTeammates, timeLogs, notifications, currentUser, onNavClick, chartColor }) => {
  const totalProjects = projects.length;
  const ongoingProjects = projects.filter(p => {
    const projectTasks = tasks.filter(t => t.projectId === p.id);
    return projectTasks.some(t => t.status !== TaskStatus.Done);
  }).length;

  const pendingTasks = tasks.filter(t => t.status !== TaskStatus.Done).length;
  const myOpenTasks = useMemo(() => {
    return tasks.filter(t => t.assignedToId === currentUser.id && t.status !== TaskStatus.Done).length;
  }, [tasks, currentUser.id]);
  
  const weeklyTimeData = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyLogs = timeLogs.filter(log => new Date(log.date) >= oneWeekAgo);

    const data = teammates.map(emp => {
      const totalHours = weeklyLogs
        .filter(log => log.teammateId === emp.id)
        .reduce((sum, log) => sum + log.hours, 0);
      return { name: emp.name.split(' ')[0], hours: totalHours };
    });

    return data;
  }, [timeLogs, teammates]);

  const recentCompletedTasks = tasks
    .filter(t => t.status === TaskStatus.Done)
    .sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime())
    .slice(0, 5);
    
  const getProjectProgress = (projectId: string) => {
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    if (projectTasks.length === 0) return 0;
    const completedTasks = projectTasks.filter(t => t.status === TaskStatus.Done).length;
    return Math.round((completedTasks / projectTasks.length) * 100);
  };

  const projectsNearingDeadline = useMemo(() => {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);
    return projects
        .filter(p => {
            const endDate = new Date(p.endDate);
            const progress = getProjectProgress(p.id);
            return endDate > now && endDate <= thirtyDaysFromNow && progress < 100;
        })
        .sort((a,b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
        .slice(0, 5);
  }, [projects, tasks]);
  
  const recentActivity = useMemo(() => {
    return [...notifications]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 7);
  }, [notifications]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-3xl font-bold text-white">Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <button onClick={() => onNavClick('projects')} className="text-left w-full h-full">
          <Card className="h-full transition-all duration-300 hover:bg-gray-700/50 hover:border-gray-600">
            <h3 className="text-gray-400">Total Projects</h3>
            <p className="text-3xl font-bold text-white">{totalProjects}</p>
            <p className="text-sm text-green-400">{ongoingProjects} Ongoing</p>
          </Card>
        </button>
        <button onClick={() => onNavClick('tasks')} className="text-left w-full h-full">
          <Card className="h-full transition-all duration-300 hover:bg-gray-700/50 hover:border-gray-600">
            <h3 className="text-gray-400">Total Tasks</h3>
            <p className="text-3xl font-bold text-white">{tasks.length}</p>
            <p className="text-sm text-yellow-400">{pendingTasks} Pending</p>
          </Card>
        </button>
        <button onClick={() => onNavClick('teammates')} className="text-left w-full h-full">
          <Card className="h-full transition-all duration-300 hover:bg-gray-700/50 hover:border-gray-600">
            <h3 className="text-gray-400">Team Size</h3>
            <p className="text-3xl font-bold text-white">{teammates.length}</p>
            <p className="text-sm text-primary-400">Active Members</p>
          </Card>
        </button>
        <Card>
          <h3 className="text-gray-400">My Open Tasks</h3>
          <p className="text-3xl font-bold text-white">{myOpenTasks}</p>
          <p className="text-sm text-gray-400">Assigned to you</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Time Contribution Chart */}
        <Card className="lg:col-span-2">
          <h3 className="text-xl font-semibold mb-4 text-white">Weekly Time Contribution (Hours)</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={weeklyTimeData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  cursor={{ fill: 'rgba(100, 116, 139, 0.2)' }}
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                />
                <Bar dataKey="hours" fill={chartColor} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        {/* Projects Nearing Deadline */}
        <Card>
            <h3 className="text-xl font-semibold mb-4 text-white">Projects Nearing Deadline</h3>
            <div className="space-y-3">
                {projectsNearingDeadline.length > 0 ? projectsNearingDeadline.map(project => (
                    <div key={project.id} className="text-sm">
                        <button onClick={() => onNavClick(`projectDetail/${project.id}`)} className="font-medium text-gray-200 hover:text-primary-400 transition-colors truncate text-left w-full">
                            {project.name}
                        </button>
                        <div className="flex justify-between items-center text-gray-400">
                            <span>Due: {new Date(project.endDate).toLocaleDateString()}</span>
                            <span className="text-xs font-bold">{getProjectProgress(project.id)}%</span>
                        </div>
                    </div>
                )) : <p className="text-gray-400 text-sm">No projects due within 30 days.</p>}
            </div>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Log */}
        <Card className="lg:col-span-2">
            <h3 className="text-xl font-semibold mb-4 text-white">Activity Log</h3>
            <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                {recentActivity.map(activity => {
                    const user = allTeammates.find(t => t.id === activity.userId);
                    return (
                        <div key={activity.id} className="flex items-start space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-primary-400 flex-shrink-0">
                                <div className="w-5 h-5">{ICONS.bell}</div>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-300">
                                    <strong className="font-semibold text-white">{user?.name || 'System'}</strong> {activity.message}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">{timeAgo(activity.timestamp)}</p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </Card>

        {/* Recent Activity */}
        <Card>
          <h3 className="text-xl font-semibold mb-4 text-white">Recent Completions</h3>
          <div className="space-y-3">
            {recentCompletedTasks.length > 0 ? recentCompletedTasks.map(task => (
              <div key={task.id} className="text-sm">
                <button onClick={() => onNavClick(`taskDetail/${task.id}`)} className="font-medium text-gray-200 truncate text-left w-full hover:text-primary-400 transition-colors">
                    {task.title}
                </button>
                <div className="flex justify-between items-center text-gray-400">
                    <span>by {teammates.find(e => e.id === task.assignedToId)?.name || 'Unknown'}</span>
                    <Badge color="green">{task.status}</Badge>
                </div>
              </div>
            )) : <p className="text-gray-400 text-sm">No recent activity.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
};
