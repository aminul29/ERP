

import React from 'react';
import { ICONS } from '../constants';
import { Teammate, Task } from '../types';

interface SidebarProps {
  activeView: string;
  onNavClick: (view: string) => void;
  currentUser: Teammate;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (isOpen: boolean) => void;
  tasks: Task[];
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: ICONS.dashboard, allowedRoles: [] },
  { id: 'profile', label: 'My Profile', icon: ICONS.profile, allowedRoles: [] },
  { id: 'attendance', label: 'Attendance', icon: ICONS.attendance, allowedRoles: ['CEO', 'HR and Admin'] },
  { id: 'tasks', label: 'Tasks', icon: ICONS.tasks, allowedRoles: [] },
  { id: 'projects', label: 'Projects', icon: ICONS.projects, allowedRoles: ['CEO', 'HR and Admin'] },
  { id: 'time', label: 'Time Tracking', icon: ICONS.time, allowedRoles: ['CEO', 'HR and Admin'] },
  { id: 'performance', label: 'Performance', icon: ICONS.performance, allowedRoles: ['CEO', 'HR and Admin', 'Lead Web Developer', 'SMM and Design Lead', 'Sales and PR Lead', 'Lead SEO Expert'] },
  { id: 'teammates', label: 'Teammates', icon: ICONS.teammates, allowedRoles: ['HR and Admin'] },
  { id: 'clients', label: 'Clients', icon: ICONS.clients, allowedRoles: ['Sales and PR Lead'] },
  { id: 'salary', label: 'Salaries', icon: ICONS.salary, allowedRoles: ['HR and Admin'] },
  { id: 'approvals', label: 'Approvals', icon: ICONS.approvals, allowedRoles: ['CEO'] },
  { id: 'settings', label: 'ERP Settings', icon: ICONS.settings, allowedRoles: ['CEO'] },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavClick, currentUser, isMobileSidebarOpen, setIsMobileSidebarOpen, tasks }) => {
  const handleItemClick = (view: string) => {
    onNavClick(view);
    setIsMobileSidebarOpen(false);
  };
  
  // Calculate assigned tasks count for current user (excluding Done/Completed)
  const assignedTasksCount = tasks.filter(t => 
    t.assignedToId === currentUser.id && 
    t.status !== 'Done' && 
    t.status !== 'Completed'
  ).length;
  
  return (
    <>
      <div className={`fixed inset-0 bg-black/60 z-40 md:hidden ${isMobileSidebarOpen ? 'block' : 'hidden'}`} onClick={() => setIsMobileSidebarOpen(false)}></div>
      <aside className={`w-64 bg-gray-100 dark:bg-gray-900 p-4 border-r border-gray-200 dark:border-gray-800 flex flex-col fixed inset-y-0 left-0 transform transition-transform duration-300 ease-in-out z-50 md:relative md:translate-x-0 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <nav className="flex flex-col space-y-2">
          {navItems.map(item => {
            const isCeo = currentUser.role === 'CEO';
            const canAccess = item.allowedRoles.length === 0 || item.allowedRoles.includes(currentUser.role);
            
            if (!isCeo && !canAccess) {
              return null;
            }
            
            const isActive = activeView === item.id || 
                          (item.id === 'projects' && activeView.startsWith('projectDetail')) ||
                          (item.id === 'tasks' && activeView.startsWith('taskDetail'));

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`flex items-center justify-between p-2 rounded-lg text-left transition-colors duration-200 ${
                  isActive
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.id === 'tasks' && assignedTasksCount > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                    {assignedTasksCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
};