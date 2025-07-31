


import React, { useState } from 'react';
import { Client, Teammate } from '../types';
import { Card } from './ui/Card';
import { Modal } from './ui/Modal';
import { ICONS } from '../constants';

interface ClientManagementProps {
  clients: Client[];
  onAddClient: (client: Omit<Client, 'id'>) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
  currentUser: Teammate;
}

const emptyClient: Omit<Client, 'id'> = { name: '', contactPerson: '', email: '', phone: '' };

export const ClientManagement: React.FC<ClientManagementProps> = ({ clients, onAddClient, onUpdateClient, onDeleteClient, currentUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Omit<Client, 'id'> | Client | null>(null);
  
  const canAccess = ['Sales and PR Lead', 'CEO'].includes(currentUser.role);

  if (!canAccess) {
    return <div className="p-6"><h1 className="text-2xl text-red-500">Access Denied</h1></div>;
  }

  const handleOpenModal = (client?: Client) => {
    setEditingClient(client || emptyClient);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    if ('id' in editingClient) {
      onUpdateClient(editingClient);
    } else {
      onAddClient(editingClient);
    }
    handleCloseModal();
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingClient(prev => prev ? { ...prev, [e.target.name]: e.target.value } : null);
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Client Management</h1>
        <button onClick={() => handleOpenModal()} className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2">
          {ICONS.plus}
          <span className="hidden sm:inline">Add Client</span>
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-gray-700">
                <tr>
                  <th className="p-4">Client Name</th>
                  <th className="p-4">Contact Person</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(client => (
                  <tr key={client.id} className="border-b border-gray-800 hover:bg-gray-700/50">
                    <td className="p-4 font-medium">{client.name}</td>
                    <td className="p-4 text-gray-300">{client.contactPerson}</td>
                    <td className="p-4 text-gray-300">{client.email}</td>
                    <td className="p-4 text-gray-300">{client.phone}</td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <button onClick={() => handleOpenModal(client)} className="text-yellow-400 hover:text-yellow-300">{ICONS.edit}</button>
                        <button onClick={() => onDeleteClient(client.id)} className="text-red-500 hover:text-red-400">{ICONS.trash}</button>
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
        {clients.map(client => (
          <Card key={client.id} className="p-4">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-lg text-white mb-2">{client.name}</h3>
              <div className="flex space-x-2">
                <button onClick={() => handleOpenModal(client)} className="text-yellow-400 hover:text-yellow-300">{ICONS.edit}</button>
                <button onClick={() => onDeleteClient(client.id)} className="text-red-500 hover:text-red-400">{ICONS.trash}</button>
              </div>
            </div>
            <div className="text-sm text-gray-300 space-y-1">
              <p><span className="font-semibold text-gray-400">Contact:</span> {client.contactPerson}</p>
              <p><span className="font-semibold text-gray-400">Email:</span> {client.email}</p>
              <p><span className="font-semibold text-gray-400">Phone:</span> {client.phone}</p>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingClient && 'id' in editingClient ? 'Edit Client' : 'Add Client'}>
        {editingClient && (
          <form onSubmit={handleSubmit} className="space-y-4">
             <input name="name" value={editingClient.name} onChange={handleChange} placeholder="Client Name" className="w-full p-2 bg-gray-700 rounded border border-gray-600" required />
             <input name="contactPerson" value={editingClient.contactPerson} onChange={handleChange} placeholder="Contact Person" className="w-full p-2 bg-gray-700 rounded border border-gray-600" required />
             <input name="email" type="email" value={editingClient.email} onChange={handleChange} placeholder="Email" className="w-full p-2 bg-gray-700 rounded border border-gray-600" required />
             <input name="phone" value={editingClient.phone} onChange={handleChange} placeholder="Phone" className="w-full p-2 bg-gray-700 rounded border border-gray-600" required />
            <div className="flex justify-end pt-4">
              <button type="submit" className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-lg">Save</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
