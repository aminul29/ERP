import React, { useState, useEffect } from 'react';
import { Announcement, AnnouncementPriority, AnnouncementTargetAudience, Teammate } from '../types';
import { Modal } from './ui/Modal';
import { Badge } from './ui/Badge';
import { ICONS } from '../constants';

interface AnnouncementPopupProps {
  announcements: Announcement[];
  currentUser: Teammate;
  onMarkAsViewed: (announcementId: string) => void;
}

const priorityColors: { [key in AnnouncementPriority]: 'gray' | 'blue' | 'green' | 'yellow' | 'red' } = {
  [AnnouncementPriority.Low]: 'gray',
  [AnnouncementPriority.Medium]: 'blue',
  [AnnouncementPriority.High]: 'yellow',
  [AnnouncementPriority.Urgent]: 'red',
};

const getPriorityIcon = (priority: AnnouncementPriority) => {
  switch (priority) {
    case AnnouncementPriority.Urgent:
      return '🚨';
    case AnnouncementPriority.High:
      return '⚠️';
    case AnnouncementPriority.Medium:
      return 'ℹ️';
    case AnnouncementPriority.Low:
      return '📝';
    default:
      return 'ℹ️';
  }
};

const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};

const isExpired = (expiresAt?: string): boolean => {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
};

const shouldShowAnnouncement = (announcement: Announcement, currentUser: Teammate): boolean => {
  // Check if announcement is active and not expired
  if (!announcement.isActive || isExpired(announcement.expiresAt)) {
    return false;
  }

  // Check if user has already viewed this announcement
  if (announcement.viewedBy.includes(currentUser.id)) {
    return false;
  }

  // Check target audience
  switch (announcement.targetAudience) {
    case AnnouncementTargetAudience.All:
      return true;
    case AnnouncementTargetAudience.Management:
      return ['CEO', 'HR and Admin', 'Lead Web Developer', 'SMM and Design Lead', 'Sales and PR Lead', 'Lead SEO Expert'].includes(currentUser.role);
    case AnnouncementTargetAudience.Staff:
      return !['CEO', 'HR and Admin'].includes(currentUser.role);
    case AnnouncementTargetAudience.Specific:
      return announcement.targetRoles?.includes(currentUser.role) || false;
    default:
      return false;
  }
};

export const AnnouncementPopup: React.FC<AnnouncementPopupProps> = ({
  announcements,
  currentUser,
  onMarkAsViewed,
}) => {
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Filter announcements that should be shown to current user
  const unviewedAnnouncements = announcements
    .filter(announcement => shouldShowAnnouncement(announcement, currentUser))
    .sort((a, b) => {
      // Sort by priority (urgent first) then by creation date (newest first)
      const priorityOrder = {
        [AnnouncementPriority.Urgent]: 4,
        [AnnouncementPriority.High]: 3,
        [AnnouncementPriority.Medium]: 2,
        [AnnouncementPriority.Low]: 1,
      };
      
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Show popup when there are unviewed announcements
  useEffect(() => {
    if (unviewedAnnouncements.length > 0) {
      setIsVisible(true);
      setCurrentAnnouncementIndex(0);
    } else {
      setIsVisible(false);
    }
  }, [unviewedAnnouncements.length]);

  const currentAnnouncement = unviewedAnnouncements[currentAnnouncementIndex];

  const handleClose = () => {
    if (currentAnnouncement) {
      onMarkAsViewed(currentAnnouncement.id);
      
      // Show next announcement if available
      if (currentAnnouncementIndex < unviewedAnnouncements.length - 1) {
        setCurrentAnnouncementIndex(prev => prev + 1);
      } else {
        setIsVisible(false);
        setCurrentAnnouncementIndex(0);
      }
    }
  };

  const handleNext = () => {
    if (currentAnnouncement) {
      onMarkAsViewed(currentAnnouncement.id);
    }
    
    if (currentAnnouncementIndex < unviewedAnnouncements.length - 1) {
      setCurrentAnnouncementIndex(prev => prev + 1);
    } else {
      setIsVisible(false);
      setCurrentAnnouncementIndex(0);
    }
  };

  const handlePrevious = () => {
    if (currentAnnouncementIndex > 0) {
      setCurrentAnnouncementIndex(prev => prev - 1);
    }
  };

  const handleMarkAllAsViewed = () => {
    unviewedAnnouncements.forEach(announcement => {
      onMarkAsViewed(announcement.id);
    });
    setIsVisible(false);
    setCurrentAnnouncementIndex(0);
  };

  if (!isVisible || !currentAnnouncement) {
    return null;
  }

  return (
    <Modal
      isOpen={isVisible}
      onClose={handleClose}
      title="📢 Company Announcement"
      closeOnOutsideClick={false}
    >
      <div className="space-y-4">
        {/* Announcement Header */}
        <div className="flex items-start space-x-3">
          <div className="text-3xl">{getPriorityIcon(currentAnnouncement.priority)}</div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">{currentAnnouncement.title}</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge color={priorityColors[currentAnnouncement.priority]}>
                {currentAnnouncement.priority.charAt(0).toUpperCase() + currentAnnouncement.priority.slice(1)} Priority
              </Badge>
              {currentAnnouncement.expiresAt && !isExpired(currentAnnouncement.expiresAt) && (
                <Badge color="blue">
                  Expires: {formatDateTime(currentAnnouncement.expiresAt)}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Announcement Content */}
        <div
          className="text-gray-300 prose prose-invert max-w-none bg-gray-800 p-4 rounded-lg border border-gray-700"
          dangerouslySetInnerHTML={{ __html: currentAnnouncement.content }}
        />

        {/* Announcement Footer */}
        <div className="text-sm text-gray-400 border-t border-gray-700 pt-3">
          <div className="flex justify-between items-center">
            <span>Published: {formatDateTime(currentAnnouncement.createdAt)}</span>
            <span>
              {currentAnnouncementIndex + 1} of {unviewedAnnouncements.length} announcements
            </span>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-700">
          <div className="flex space-x-2">
            {currentAnnouncementIndex > 0 && (
              <button
                onClick={handlePrevious}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg flex items-center space-x-2"
              >
                <span>←</span>
                <span>Previous</span>
              </button>
            )}
          </div>

          <div className="flex space-x-2">
            {unviewedAnnouncements.length > 1 && (
              <button
                onClick={handleMarkAllAsViewed}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
              >
                Mark All as Read
              </button>
            )}
            
            {currentAnnouncementIndex < unviewedAnnouncements.length - 1 ? (
              <button
                onClick={handleNext}
                className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-lg flex items-center space-x-2"
              >
                <span>Next</span>
                <span>→</span>
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-lg flex items-center space-x-2"
              >
                <span>Got it!</span>
                <span>✓</span>
              </button>
            )}
          </div>
        </div>

        {/* Priority-based styling for urgent announcements */}
        {currentAnnouncement.priority === AnnouncementPriority.Urgent && (
          <div className="bg-red-900/20 border border-red-600 rounded-lg p-3 mt-4">
            <div className="flex items-center space-x-2 text-red-400">
              <span className="text-xl">🚨</span>
              <span className="font-semibold">This is an urgent announcement requiring immediate attention!</span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
