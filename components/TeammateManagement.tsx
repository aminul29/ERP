
import React, { useState } from 'react';
import { Teammate } from '../types';
import { Card } from './ui/Card';
import { Modal } from './ui/Modal';
import { ICONS } from '../constants';
import { Badge } from './ui/Badge';

interface TeammateManagementProps {
  teammates: Teammate[];
  onAddTeammate: (teammate: Omit<Teammate, 'id' | 'approved'>) => void;
  onUpdateTeammate: (teammate: Teammate) => void;
  onDeleteTeammate: (teammateId: string) => void;
  onApproveTeammate: (teammateId: string) => void;
  currentUser: Teammate;
  currencySymbol: string;
  roles: string[];
  onAddRole: (role: string) => void;
}

const emptyTeammate: Omit<Teammate, 'id' | 'approved'> = { name: '', role: '', joinDate: '', salary: undefined, email: '', phone: '', password: '' };

export const TeammateManagement: React.FC<TeammateManagementProps> = ({ teammates, onAddTeammate, onUpdateTeammate, onDeleteTeammate, onApproveTeammate, currentUser, currencySymbol, roles, onAddRole }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeammate, setEditingTeammate] = useState<Omit<Teammate, 'id' | 'approved'> | Teammate | null>(null);
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');

  const canAdd = ['HR and Admin', 'CEO'].includes(currentUser.role);
  const canDelete = ['HR and Admin', 'CEO'].includes(currentUser.role);
  const canEdit = ['HR and Admin', 'CEO'].includes(currentUser.role);
  const isCeo = currentUser.role === 'CEO';

  const handleOpenModal = (teammate?: Teammate) => {
    setEditingTeammate(teammate || { ...emptyTeammate, role: roles.find(r => r !== 'CEO') || '' });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTeammate(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeammate) return;
    if ('id' in editingTeammate) {
      onUpdateTeammate(editingTeammate);
    } else {
      onAddTeammate(editingTeammate);
    }
    handleCloseModal();
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditingTeammate(prev => {
        if (!prev) return null;
        const updated = { ...prev };
        if (name === 'salary') {
            (updated as any)[name] = value === '' ? undefined : parseFloat(value);
        } else {
            (updated as any)[name] = value;
        }
        return updated;
    });
  };

  const handleAddNewRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRoleName.trim() && !roles.includes(newRoleName.trim())) {
      const newRole = newRoleName.trim();
      onAddRole(newRole);
      setEditingTeammate(prev => prev ? { ...prev, role: newRole } : null);
      setNewRoleName('');
      setIsAddRoleModalOpen(false);
    }
  };

  const assignableRoles = roles.filter(role => role !== 'CEO');

  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Teammate Management</h1>
        {canAdd && (
          <button onClick={() => handleOpenModal()} className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2">
            {ICONS.plus}
            <span className="hidden sm:inline">Add Teammate</span>
          </button>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Join Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teammates.map(teammate => (
                  <tr key={teammate.id} className={`border-b border-gray-100 dark:border-gray-800 ${!teammate.approved ? 'bg-yellow-500/10' : 'hover:bg-gray-50/50 dark:hover:bg-gray-700/50'}`}>
                    <td className="p-4 font-medium">{teammate.name}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">{teammate.role}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">{new Date(teammate.joinDate).toLocaleDateString()}</td>
                    <td className="p-4">
                      {!teammate.approved ? (
                          <Badge color="yellow">Pending Approval</Badge>
                      ) : (
                          <Badge color="green">Approved</Badge>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        {!teammate.approved && isCeo && (
                            <button onClick={() => onApproveTeammate(teammate.id)} className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-md text-xs">Approve</button>
                        )}
                        {teammate.approved && canEdit && (
                          <button onClick={() => handleOpenModal(teammate)} className="text-yellow-400 hover:text-yellow-300" title="Edit">{ICONS.edit}</button>
                        )}
                        {teammate.approved && canDelete && teammate.role !== 'CEO' && (
                          <button onClick={() => onDeleteTeammate(teammate.id)} className="text-red-500 hover:text-red-400" title="Delete">{ICONS.trash}</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {teammates.map(teammate => (
          <Card key={teammate.id} className="p-4">
              <div className="flex justify-between items-start">
                  <div>
                      <h3 className="font-bold text-lg text-white">{teammate.name}</h3>
                      <p className="text-sm text-gray-400">{teammate.role}</p>
                  </div>
                  {!teammate.approved ? (
                      <Badge color="yellow">Pending</Badge>
                  ) : (
                      <Badge color="green">Approved</Badge>
                  )}
              </div>
              <div className="mt-3 text-sm text-gray-300">
                  <p>Joined: {new Date(teammate.joinDate).toLocaleDateString()}</p>
              </div>
              <div className="flex space-x-2 mt-4 pt-3 border-t border-gray-700">
                  {!teammate.approved && isCeo && (
                      <button onClick={() => onApproveTeammate(teammate.id)} className="flex-grow bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded-md text-sm">Approve</button>
                  )}
                  {teammate.approved && canEdit && (
                    <button onClick={() => handleOpenModal(teammate)} className="text-yellow-400 hover:text-yellow-300 p-2 bg-gray-700 rounded-md" title="Edit">{ICONS.edit}</button>
                  )}
                  {teammate.approved && canDelete && teammate.role !== 'CEO' && (
                    <button onClick={() => onDeleteTeammate(teammate.id)} className="text-red-500 hover:text-red-400 p-2 bg-gray-700 rounded-md" title="Delete">{ICONS.trash}</button>
                  )}
              </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingTeammate && 'id' in editingTeammate ? 'Edit Teammate' : 'Add Teammate'}>
        {editingTeammate && (
          <form onSubmit={handleSubmit} className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Full Name</label>
                    <input name="name" value={editingTeammate.name} onChange={handleChange} placeholder="Name" className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Email</label>
                    <input name="email" type="email" value={editingTeammate.email || ''} onChange={handleChange} placeholder="Email Address" className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Phone</label>
                    <input name="phone" value={editingTeammate.phone || ''} onChange={handleChange} placeholder="Phone Number" className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600" />
                </div>
                <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Role</label>
                      {canAdd && (
                        <button
                            type="button"
                            onClick={() => setIsAddRoleModalOpen(true)}
                            className="text-xs text-primary-500 hover:underline flex items-center space-x-1"
                        >
                            <span className="w-4 h-4 inline-block">{ICONS.plus}</span>
                            <span>Add New</span>
                        </button>
                      )}
                    </div>
                    <select name="role" value={editingTeammate.role} onChange={handleChange} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600" required>
                        <option value="" disabled>Select a role</option>
                        {assignableRoles.map(role => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Join Date</label>
                    <input name="joinDate" type="date" value={editingTeammate.joinDate} onChange={handleChange} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600" required />
                </div>
                {editingTeammate && !('id' in editingTeammate) && (
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Password</label>
                        <input
                            name="password"
                            type="password"
                            value={editingTeammate.password || ''}
                            onChange={handleChange}
                            placeholder="Set initial password"
                            className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600"
                            required
                        />
                    </div>
                )}
             </div>
            <div className="flex justify-end pt-4">
              <button type="submit" className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-lg">Save</button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={isAddRoleModalOpen} onClose={() => setIsAddRoleModalOpen(false)} title="Add New Teammate Role">
          <form onSubmit={handleAddNewRoleSubmit} className="space-y-4">
              <div>
                  <label htmlFor="newRoleName" className="block text-sm font-medium text-gray-300 mb-1">New Role Name</label>
                  <input
                      id="newRoleName"
                      name="newRoleName"
                      type="text"
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      className="w-full p-2 bg-gray-700 rounded border border-gray-600"
                      placeholder="e.g., QA Tester"
                      required
                      autoFocus
                  />
              </div>
              <div className="flex justify-end pt-4">
                  <button type="submit" className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-lg">Save Role</button>
              </div>
          </form>
      </Modal>
    </div>
  );
};
