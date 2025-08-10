import React, { useState, useMemo } from 'react';
import { Announcement, AnnouncementPriority, AnnouncementTargetAudience, Teammate } from '../types';
import { Card } from './ui/Card';
import { Modal } from './ui/Modal';
import { Badge } from './ui/Badge';
import { ICONS } from '../constants';
import { RichTextEditor } from './ui/RichTextEditor';

interface AnnouncementManagementProps {
  announcements: Announcement[];
  teammates: Teammate[];
  currentUser: Teammate;
  onAddAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt' | 'viewedBy'>) => void;
  onUpdateAnnouncement: (announcement: Announcement) => void;
  onDeleteAnnouncement: (announcementId: string) => void;
}

const emptyAnnouncement: Omit<Announcement, 'id' | 'createdBy' | 'createdAt' | 'viewedBy'> = {
  title: '',
  content: '',
  priority: AnnouncementPriority.Medium,
  targetAudience: AnnouncementTargetAudience.All,
  targetRoles: [],
  isActive: true,
  expiresAt: '',
};

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

export const AnnouncementManagement: React.FC<AnnouncementManagementProps> = ({
  announcements,
  teammates,
  currentUser,
  onAddAnnouncement,
  onUpdateAnnouncement,
  onDeleteAnnouncement,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<
    (Omit<Announcement, 'id' | 'createdBy' | 'createdAt' | 'viewedBy'> & { id?: string }) | null
  >(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
  const [filterPriority, setFilterPriority] = useState<AnnouncementPriority | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Only CEO and HR can manage announcements
  const canManage = ['CEO', 'HR and Admin'].includes(currentUser.role);

  if (!canManage) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400">Only CEO and HR administrators can manage announcements.</p>
        </div>
      </div>
    );
  }

  // Filtered announcements
  const filteredAnnouncements = useMemo(() => {
    let filtered = [...announcements];

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (announcement) =>
          announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          announcement.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter((announcement) => announcement.priority === filterPriority);
    }

    // Apply status filter
    if (filterStatus === 'active') {
      filtered = filtered.filter((announcement) => announcement.isActive && !isExpired(announcement.expiresAt));
    } else if (filterStatus === 'expired') {
      filtered = filtered.filter((announcement) => !announcement.isActive || isExpired(announcement.expiresAt));
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return filtered;
  }, [announcements, searchTerm, filterPriority, filterStatus]);

  const handleOpenModal = (announcement?: Announcement) => {
    if (announcement) {
      setEditingAnnouncement({
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority,
        targetAudience: announcement.targetAudience,
        targetRoles: announcement.targetRoles || [],
        isActive: announcement.isActive,
        expiresAt: announcement.expiresAt || '',
      });
    } else {
      setEditingAnnouncement(emptyAnnouncement);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAnnouncement(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnnouncement) return;

    if (editingAnnouncement.id) {
      // Update existing announcement
      const fullAnnouncement = announcements.find((a) => a.id === editingAnnouncement.id);
      if (fullAnnouncement) {
        onUpdateAnnouncement({
          ...fullAnnouncement,
          ...editingAnnouncement,
        });
      }
    } else {
      // Add new announcement
      onAddAnnouncement({
        ...editingAnnouncement,
        createdBy: currentUser.id,
        isActive: true,
      });
    }

    handleCloseModal();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setEditingAnnouncement((prev) => {
      if (!prev) return null;
      if (type === 'checkbox') {
        return { ...prev, [name]: (e.target as HTMLInputElement).checked };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleRoleSelectionChange = (role: string, checked: boolean) => {
    setEditingAnnouncement((prev) => {
      if (!prev) return null;
      const currentRoles = prev.targetRoles || [];
      const newRoles = checked
        ? [...currentRoles, role]
        : currentRoles.filter((r) => r !== role);
      return { ...prev, targetRoles: newRoles };
    });
  };

  const handleOpenDeleteModal = (announcement: Announcement) => {
    setAnnouncementToDelete(announcement);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setAnnouncementToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (announcementToDelete) {
      onDeleteAnnouncement(announcementToDelete.id);
      handleCloseDeleteModal();
    }
  };

  const getTargetAudienceText = (announcement: Announcement): string => {
    switch (announcement.targetAudience) {
      case AnnouncementTargetAudience.All:
        return 'All Users';
      case AnnouncementTargetAudience.Management:
        return 'Management Only';
      case AnnouncementTargetAudience.Staff:
        return 'Staff Only';
      case AnnouncementTargetAudience.Specific:
        return `Specific Roles: ${announcement.targetRoles?.join(', ') || 'None'}`;
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Announcements</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2"
        >
          {ICONS.plus}
          <span className="hidden sm:inline">Create Announcement</span>
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex flex-wrap gap-3 flex-1">
            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as AnnouncementPriority | 'all')}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
            >
              <option value="all">All Priorities</option>
              {Object.values(AnnouncementPriority).map((priority) => (
                <option key={priority} value={priority}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'expired')}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired/Inactive</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-400">
          Showing {filteredAnnouncements.length} of {announcements.length} announcements
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📢</div>
              <h3 className="text-xl font-semibold text-white mb-2">No announcements found</h3>
              <p className="text-gray-400">
                {announcements.length === 0
                  ? 'Create your first announcement to keep everyone informed.'
                  : 'Try adjusting your search criteria.'}
              </p>
            </div>
          </Card>
        ) : (
          filteredAnnouncements.map((announcement) => {
            const creator = teammates.find((t) => t.id === announcement.createdBy);
            const expired = isExpired(announcement.expiresAt);

            return (
              <Card key={announcement.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="text-2xl">{getPriorityIcon(announcement.priority)}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2">{announcement.title}</h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge color={priorityColors[announcement.priority]}>
                          {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
                        </Badge>
                        {!announcement.isActive && <Badge color="gray">Inactive</Badge>}
                        {expired && <Badge color="red">Expired</Badge>}
                        {announcement.isActive && !expired && <Badge color="green">Active</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleOpenModal(announcement)}
                      className="text-yellow-400 hover:text-yellow-300 transition-colors"
                      title="Edit Announcement"
                    >
                      {ICONS.edit}
                    </button>
                    <button
                      onClick={() => handleOpenDeleteModal(announcement)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="Delete Announcement"
                    >
                      {ICONS.trash}
                    </button>
                  </div>
                </div>

                <div
                  className="text-gray-300 mb-4 prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: announcement.content }}
                />

                <div className="border-t border-gray-700 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400">
                    <div>
                      <span className="font-medium">Created by:</span> {creator?.name || 'Unknown'}
                    </div>
                    <div>
                      <span className="font-medium">Target:</span> {getTargetAudienceText(announcement)}
                    </div>
                    <div>
                      <span className="font-medium">Views:</span> {announcement.viewedBy.length} users
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400 mt-2">
                    <div>
                      <span className="font-medium">Created:</span> {formatDateTime(announcement.createdAt)}
                    </div>
                    {announcement.expiresAt && (
                      <div>
                        <span className="font-medium">Expires:</span> {formatDateTime(announcement.expiresAt)}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingAnnouncement?.id ? 'Edit Announcement' : 'Create New Announcement'}
        closeOnOutsideClick={false}
      >
        {editingAnnouncement && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              name="title"
              value={editingAnnouncement.title}
              onChange={handleChange}
              placeholder="Announcement Title"
              className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Content</label>
              <RichTextEditor
                value={editingAnnouncement.content}
                onChange={(html) => setEditingAnnouncement((prev) => (prev ? { ...prev, content: html } : prev))}
                placeholder="Enter announcement content..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
                <select
                  name="priority"
                  value={editingAnnouncement.priority}
                  onChange={handleChange}
                  className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
                  required
                >
                  {Object.values(AnnouncementPriority).map((priority) => (
                    <option key={priority} value={priority}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Target Audience</label>
                <select
                  name="targetAudience"
                  value={editingAnnouncement.targetAudience}
                  onChange={handleChange}
                  className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
                  required
                >
                  {Object.values(AnnouncementTargetAudience).map((audience) => (
                    <option key={audience} value={audience}>
                      {audience === 'all' ? 'All Users' : audience.charAt(0).toUpperCase() + audience.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {editingAnnouncement.targetAudience === AnnouncementTargetAudience.Specific && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Select Specific Roles</label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto bg-gray-800 p-2 rounded border border-gray-600">
                  {teammates
                    .map((t) => t.role)
                    .filter((role, index, arr) => arr.indexOf(role) === index) // Unique roles
                    .sort()
                    .map((role) => (
                      <label key={role} className="flex items-center space-x-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingAnnouncement.targetRoles?.includes(role) || false}
                          onChange={(e) => handleRoleSelectionChange(role, e.target.checked)}
                          className="form-checkbox bg-gray-700 border-gray-600 text-primary-500"
                        />
                        <span className="text-gray-200">{role}</span>
                      </label>
                    ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Expires At (Optional)
              </label>
              <input
                name="expiresAt"
                type="datetime-local"
                value={
                  editingAnnouncement.expiresAt
                    ? new Date(editingAnnouncement.expiresAt).toISOString().slice(0, 16)
                    : ''
                }
                onChange={(e) => {
                  const value = e.target.value ? new Date(e.target.value).toISOString() : '';
                  setEditingAnnouncement((prev) => (prev ? { ...prev, expiresAt: value } : prev));
                }}
                className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                name="isActive"
                type="checkbox"
                checked={editingAnnouncement.isActive}
                onChange={handleChange}
                className="form-checkbox bg-gray-700 border-gray-600 text-primary-500"
              />
              <label className="text-sm font-medium text-gray-300">Active</label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleCloseModal}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-lg"
              >
                {editingAnnouncement.id ? 'Update Announcement' : 'Create Announcement'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={handleCloseDeleteModal} title="Delete Announcement">
        {announcementToDelete && (
          <div className="space-y-4">
            <p className="text-gray-300">
              Are you sure you want to delete the announcement{' '}
              <span className="font-semibold text-white">"{announcementToDelete.title}"</span>?
            </p>
            <p className="text-sm text-gray-400">This action cannot be undone.</p>

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
                Delete Announcement
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
