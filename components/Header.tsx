
import React, { useState, useRef, useEffect } from 'react';
import { Teammate, Notification } from '../types';
import { ICONS } from '../constants';

interface HeaderProps {
  currentUser: Teammate;
  notifications: Notification[];
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onLogout: () => void;
  onSwitchUser: (teammateId: string) => void;
  allUsers: Teammate[];
  companyName: string;
  onToggleMobileSidebar: () => void;
  onNavClick: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, notifications, onMarkAsRead, onMarkAllAsRead, onLogout, onSwitchUser, allUsers, companyName, onToggleMobileSidebar, onNavClick }) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [popoverRef]);

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
  
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
        onMarkAsRead(notification.id);
    }
    if (notification.link) {
        onNavClick(notification.link);
        setIsPopoverOpen(false);
    }
  };

  return (
    <header className="bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center sticky top-0 z-30 flex-shrink-0">
      <div className="flex items-center">
        <button onClick={onToggleMobileSidebar} className="text-gray-500 dark:text-gray-400 mr-3 md:hidden">
            {ICONS.menu}
        </button>
        <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{companyName}</h1>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400" title={`Role: ${currentUser.role}`}>Welcome, {currentUser.name}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* User switcher for CEO role */}
        {currentUser.role === 'CEO' && (
          <div className="items-center space-x-2 hidden sm:flex">
            <label htmlFor="user-switch" className="text-sm font-medium text-gray-500 dark:text-gray-400 hidden lg:block">View As:</label>
            <select
              id="user-switch"
              value={currentUser.id}
              onChange={(e) => onSwitchUser(e.target.value)}
              className="bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
            >
              {allUsers.map(user => (
                <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
              ))}
            </select>
          </div>
        )}
        <div className="relative" ref={popoverRef}>
          <button onClick={() => setIsPopoverOpen(prev => !prev)} className="relative text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            {ICONS.bell}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white ring-2 ring-gray-50 dark:ring-gray-900">
                {unreadCount}
              </span>
            )}
          </button>
          {isPopoverOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50">
              <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={() => { onMarkAllAsRead(); }} className="text-sm text-primary-500 dark:text-primary-400 hover:underline">
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3 border-b border-gray-200/50 dark:border-gray-700/50 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${!n.read ? 'bg-primary-500/10' : ''}`}
                    >
                      <p className="text-gray-800 dark:text-gray-200">{n.message}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{timeAgo(n.timestamp)}</p>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-center text-gray-500 dark:text-gray-400">No notifications yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
        <button onClick={onLogout} title="Logout" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center space-x-2">
            {ICONS.logout}
            <span className="hidden sm:inline text-sm">Logout</span>
        </button>
      </div>
    </header>
  );
};
