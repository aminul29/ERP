


import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Project, Task, Client, Teammate, TaskStatus, PendingUpdate, TaskPriority } from '../types';
import { Card } from './ui/Card';
import { Modal } from './ui/Modal';
import { ICONS } from '../constants';
import { Badge } from './ui/Badge';
import { StarRating } from './ui/StarRating';

interface ProjectManagementProps {
  projects: Project[];
  tasks: Task[];
  clients: Client[];
  teammates: Teammate[];
  onAddProject: (project: Omit<Project, 'id' | 'createdById' | 'ratings'>) => void;
  onUpdateProject: (project: Project) => void;
  onRateProject: (projectId: string, rating: number, rater: 'assigner' | 'ceo') => void;
  currentUser: Teammate;
  pendingUpdates: PendingUpdate[];
  onNavClick: (view: string) => void;
  divisions: string[];
  onAddClient: (client: Omit<Client, 'id'>, callback?: (newClientId: string) => void) => void;
}

const emptyProject: Omit<Project, 'id' | 'createdById' | 'ratings'> = { name: '', description: '', clientId: '', startDate: '', endDate: '', allocatedTimeInSeconds: 0, teamMemberIds: [], priority: TaskPriority.Medium, divisions: [] };
const emptyNewClient: Omit<Client, 'id'> = { name: '', contactPerson: '', email: '', phone: '' };

export const ProjectManagement: React.FC<ProjectManagementProps> = ({ projects, tasks, clients, teammates, onAddProject, onUpdateProject, onRateProject, currentUser, pendingUpdates, onNavClick, divisions, onAddClient }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Omit<Project, 'id' | 'createdById' | 'ratings'> | Project | null>(null);
  
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [newClientData, setNewClientData] = useState<Omit<Client, 'id'>>(emptyNewClient);
  const [clientSearch, setClientSearch] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const clientInputRef = useRef<HTMLDivElement>(null);
  
  const [teamSearch, setTeamSearch] = useState('');
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
  const teamDropdownRef = useRef<HTMLDivElement>(null);

  const [divisionSearch, setDivisionSearch] = useState('');
  const [isDivisionDropdownOpen, setIsDivisionDropdownOpen] = useState(false);
  const divisionDropdownRef = useRef<HTMLDivElement>(null);
  
  const canModifyProject = true; // Everyone can add/request edits for projects.
  const isCeo = currentUser.role === 'CEO';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (clientInputRef.current && !clientInputRef.current.contains(event.target as Node)) setIsClientDropdownOpen(false);
        if (teamDropdownRef.current && !teamDropdownRef.current.contains(event.target as Node)) setIsTeamDropdownOpen(false);
        if (divisionDropdownRef.current && !divisionDropdownRef.current.contains(event.target as Node)) setIsDivisionDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpenModal = (project?: Project) => {
    setEditingProject(project || emptyProject);
    setClientSearch('');
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    if ('id' in editingProject) {
        onUpdateProject(editingProject);
    } else {
        const newProjectData = editingProject as Omit<Project, 'id' | 'createdById' | 'ratings'>;
        if(newProjectData.name && newProjectData.clientId && newProjectData.startDate && newProjectData.endDate && newProjectData.teamMemberIds.length > 0) {
            onAddProject(newProjectData);
        }
    }
    handleCloseModal();
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setEditingProject(prev => prev ? { ...prev, [e.target.name]: e.target.value } : null);
  };

   const handleAllocatedTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value) || 0;

    setEditingProject(prev => {
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

  const handleTeamSelection = (teammateId: string) => {
    setEditingProject(prev => {
        if (!prev) return null;
        const currentTeam = prev.teamMemberIds || [];
        const newTeam = currentTeam.includes(teammateId)
            ? currentTeam.filter(id => id !== teammateId)
            : [...currentTeam, teammateId];
        return { ...prev, teamMemberIds: newTeam };
    });
  };

  const handleDivisionSelection = (division: string) => {
    setEditingProject(prev => {
        if (!prev) return null;
        const currentDivisions = prev.divisions || [];
        const newDivisions = currentDivisions.includes(division)
            ? currentDivisions.filter(d => d !== division)
            : [...currentDivisions, division];
        return { ...prev, divisions: newDivisions };
    });
  };
  
  const getProjectProgress = (projectId: string) => {
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    if (projectTasks.length === 0) return 0;
    const completedTasks = projectTasks.filter(t => t.status === TaskStatus.Done).length;
    return Math.round((completedTasks / projectTasks.length) * 100);
  };
  
  const handleSelectClient = (client: Client) => {
    if (!editingProject) return;
    setEditingProject({ ...editingProject, clientId: client.id });
    setClientSearch(client.name);
    setIsClientDropdownOpen(false);
  };
  
  const handleOpenAddClientModal = () => {
    setNewClientData({ ...emptyNewClient, name: clientSearch });
    setIsAddClientModalOpen(true);
    setIsClientDropdownOpen(false);
  };
  
  const handleNewClientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewClientData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddClient(newClientData, (newClientId) => {
        if (!editingProject) return;
        setEditingProject({ ...editingProject, clientId: newClientId });
        const newClient = clients.find(c => c.id === newClientId) || {...newClientData, id: newClientId};
        setClientSearch(newClient.name);
        setIsAddClientModalOpen(false);
        setNewClientData(emptyNewClient);
    });
  };

  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients;
    return clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()));
  }, [clientSearch, clients]);

  const filteredTeammates = useMemo(() => {
    if (!teamSearch) return teammates;
    return teammates.filter(t => t.name.toLowerCase().includes(teamSearch.toLowerCase()));
  }, [teamSearch, teammates]);
  
  const filteredDivisions = useMemo(() => {
    if (!divisionSearch) return divisions;
    return divisions.filter(d => d.toLowerCase().includes(divisionSearch.toLowerCase()));
  }, [divisionSearch, divisions]);
  
  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Projects</h1>
        {canModifyProject && (
          <button onClick={() => handleOpenModal()} className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2">
            {ICONS.plus}
            <span className="hidden sm:inline">Add Project</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => {
          const client = clients.find(c => c.id === project.clientId);
          const team = teammates.filter(e => project.teamMemberIds.includes(e.id));
          const progress = getProjectProgress(project.id);
          const isPending = pendingUpdates.some(p => p.type === 'project' && p.itemId === project.id);
          const isComplete = progress === 100;
          
          const creator = teammates.find(t => t.id === project.createdById);
          const canRateAsCeo = isCeo && isComplete;
          const canRateAsAssigner = currentUser.id === project.createdById && isComplete;

          const assignerRating = project.ratings?.assigner;
          const ceoRating = project.ratings?.ceo;
          
          const visibleRatings: number[] = [];
          if (assignerRating !== undefined) visibleRatings.push(assignerRating);
          if (isCeo && ceoRating !== undefined) visibleRatings.push(ceoRating);
          
          const avgRating = visibleRatings.length > 0 ? visibleRatings.reduce((a, b) => a + b, 0) / visibleRatings.length : 0;

          return (
            <Card key={project.id} className="flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <button onClick={() => onNavClick(`projectDetail/${project.id}`)} className="text-left w-full">
                            <h2 className="text-xl font-bold text-white mb-1 hover:text-primary-400 transition-colors">{project.name}</h2>
                        </button>
                        <p className="text-primary-400 mb-2">{client?.name}</p>
                    </div>
                    {canModifyProject && (
                        <button 
                            onClick={() => handleOpenModal(project)} 
                            className="text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed ml-2"
                            disabled={isPending}
                            title={isPending ? "Changes pending approval" : "Edit Project"}
                        >
                            {ICONS.edit}
                        </button>
                    )}
                </div>
                {isPending && <div className="mb-2"><Badge color="yellow">Pending Approval</Badge></div>}
                <p className="text-sm text-gray-400 mb-4">End Date: {new Date(project.endDate).toLocaleDateString()}</p>
                
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-300 mb-2">Team:</p>
                  <div className="flex flex-wrap -space-x-2">
                    {team.map(member => (
                       <div key={member.id} className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold text-xs border-2 border-gray-800" title={member.name}>
                         {member.name.charAt(0)}
                       </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-gray-700">
                <div className="space-y-2 mb-2">
                    <div className="flex justify-between items-center" title={!canRateAsAssigner ? (isComplete ? `Only the project assigner (${creator?.name || 'N/A'}) can rate` : "Project must be 100% complete to rate") : ""}>
                        <p className="text-sm text-gray-300">Assigner Rating</p>
                        <StarRating
                            rating={assignerRating || 0}
                            onRatingChange={(newRating) => onRateProject(project.id, newRating, 'assigner')}
                            disabled={!canRateAsAssigner}
                        />
                    </div>
                    {isCeo && (
                      <div className="flex justify-between items-center" title={!canRateAsCeo ? (isComplete ? "Only the CEO can rate" : "Project must be 100% complete to rate") : ""}>
                          <p className="text-sm text-gray-300">CEO Rating</p>
                          <StarRating
                              rating={ceoRating || 0}
                              onRatingChange={(newRating) => onRateProject(project.id, newRating, 'ceo')}
                              disabled={!canRateAsCeo}
                          />
                      </div>
                    )}
                </div>

                <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-700/50">
                    <p className="text-sm font-medium text-gray-300">Overall Rating</p>
                    <div className="flex items-center space-x-2">
                        <StarRating rating={avgRating} disabled />
                        <span className="font-semibold text-white">{avgRating.toFixed(1)}</span>
                    </div>
                </div>

                <div className="mt-2">
                  <div className="flex justify-between mb-1">
                    <p className="text-sm text-gray-400">Progress</p>
                    <p className="text-sm text-gray-300">{progress}%</p>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div className="bg-primary-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingProject && 'id' in editingProject ? 'Edit Project' : 'Add New Project'}>
        {editingProject && (
            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Project Name</label>
                    <input name="name" value={editingProject.name} onChange={handleChange} placeholder="e.g., New Corporate Website" className="w-full p-2 bg-gray-700 rounded border border-gray-600" required />
                </div>
                
                <div ref={clientInputRef} className="relative">
                    <label htmlFor="client-search" className="block text-sm font-medium text-gray-300 mb-1">Client</label>
                     <input
                        id="client-search"
                        type="text"
                        value={clientSearch || (clients.find(c => c.id === editingProject.clientId)?.name || '')}
                        onChange={(e) => {
                            setClientSearch(e.target.value);
                            if (editingProject.clientId) setEditingProject(prev => prev ? { ...prev, clientId: '' } : null);
                            setIsClientDropdownOpen(true);
                        }}
                        onFocus={() => { setClientSearch(''); setIsClientDropdownOpen(true); }}
                        placeholder="Search or add client"
                        className="w-full p-2 bg-gray-700 rounded border border-gray-600"
                        autoComplete="off"
                        required={!editingProject.clientId}
                    />
                    {isClientDropdownOpen && (
                        <div className="absolute z-20 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {filteredClients.map(client => (
                                <div key={client.id} onClick={() => handleSelectClient(client)} className="cursor-pointer p-2 hover:bg-primary-500">
                                    {client.name}
                                </div>
                            ))}
                            {clientSearch && !filteredClients.some(c => c.name.toLowerCase() === clientSearch.toLowerCase()) && (
                                <div onClick={handleOpenAddClientModal} className="cursor-pointer p-2 hover:bg-primary-500 border-t border-gray-700 flex items-center space-x-2">
                                    {ICONS.plus} <span>Add new client "{clientSearch}"</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
                    <select name="priority" value={editingProject.priority} onChange={handleChange} className="w-full p-2 bg-gray-700 rounded border border-gray-600" required>
                        {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
                    <input name="startDate" type="date" value={editingProject.startDate} onChange={handleChange} className="w-full p-2 bg-gray-700 rounded border border-gray-600" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">End Date</label>
                    <input name="endDate" type="date" value={editingProject.endDate} onChange={handleChange} className="w-full p-2 bg-gray-700 rounded border border-gray-600" required />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Allocated Project Time</label>
                    <div className="flex items-center space-x-2">
                        <input name="allocatedHoursInput" type="number" value={String(Math.floor((editingProject.allocatedTimeInSeconds || 0) / 3600))} onChange={handleAllocatedTimeChange} className="w-full p-2 bg-gray-700 rounded border border-gray-600" min="0" placeholder="Hours" />
                        <input name="allocatedMinutesInput" type="number" value={String(Math.floor(((editingProject.allocatedTimeInSeconds || 0) % 3600) / 60))} onChange={handleAllocatedTimeChange} className="w-full p-2 bg-gray-700 rounded border border-gray-600" min="0" max="59" placeholder="Minutes" />
                    </div>
                </div>
                
                <div className="md:col-span-2 relative" ref={teamDropdownRef}>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Assign Team</label>
                    <div className="bg-gray-700 border border-gray-600 rounded-lg p-2 flex flex-wrap gap-2 items-center min-h-[42px] cursor-pointer" onClick={() => setIsTeamDropdownOpen(true)}>
                        {editingProject.teamMemberIds.map(id => {
                            const member = teammates.find(t => t.id === id);
                            return (
                                <span key={id} className="bg-primary-500/80 text-white px-2 py-0.5 rounded-full text-sm flex items-center gap-2">
                                    {member?.name}
                                    <button type="button" onClick={(e) => { e.stopPropagation(); handleTeamSelection(id); }} className="font-bold text-base hover:text-red-300">&times;</button>
                                </span>
                            );
                        })}
                        {editingProject.teamMemberIds.length === 0 && <span className="text-gray-400 px-2">Select teammates...</span>}
                    </div>
                    {isTeamDropdownOpen && (
                        <div className="absolute z-30 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg">
                            <input type="text" placeholder="Search team..." value={teamSearch} onChange={e => setTeamSearch(e.target.value)} className="w-full p-2 bg-gray-900 border-b border-gray-600" />
                            <ul className="max-h-48 overflow-y-auto">
                                {filteredTeammates.map(member => (
                                    <li key={member.id} onClick={() => handleTeamSelection(member.id)} className={`p-2 cursor-pointer hover:bg-primary-500 flex items-center justify-between ${editingProject.teamMemberIds.includes(member.id) ? 'bg-primary-600' : ''}`}>
                                        {member.name}
                                        {editingProject.teamMemberIds.includes(member.id) && <span className="text-white">✓</span>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="md:col-span-2 relative" ref={divisionDropdownRef}>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Divisions</label>
                    <div className="bg-gray-700 border border-gray-600 rounded-lg p-2 flex flex-wrap gap-2 items-center min-h-[42px] cursor-pointer" onClick={() => setIsDivisionDropdownOpen(true)}>
                        {editingProject.divisions.map(division => (
                             <span key={division} className="bg-gray-600 text-white px-2 py-0.5 rounded-full text-sm flex items-center gap-2">
                                {division}
                                <button type="button" onClick={(e) => { e.stopPropagation(); handleDivisionSelection(division); }} className="font-bold text-base hover:text-red-300">&times;</button>
                            </span>
                        ))}
                        {editingProject.divisions.length === 0 && <span className="text-gray-400 px-2">Select divisions...</span>}
                    </div>
                    {isDivisionDropdownOpen && (
                        <div className="absolute z-30 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg">
                            <input type="text" placeholder="Search divisions..." value={divisionSearch} onChange={e => setDivisionSearch(e.target.value)} className="w-full p-2 bg-gray-900 border-b border-gray-600" />
                            <ul className="max-h-48 overflow-y-auto">
                                {filteredDivisions.map(division => (
                                    <li key={division} onClick={() => handleDivisionSelection(division)} className={`p-2 cursor-pointer hover:bg-primary-500 flex items-center justify-between ${editingProject.divisions.includes(division) ? 'bg-primary-600' : ''}`}>
                                        {division}
                                        {editingProject.divisions.includes(division) && <span className="text-white">✓</span>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                    <div className="bg-gray-800 border border-gray-600 rounded-lg">
                        <div className="flex items-center p-1.5 border-b border-gray-600 space-x-1">
                            <button type="button" className="px-2 py-1 rounded hover:bg-gray-700 text-gray-300 font-bold text-sm">B</button>
                            <button type="button" className="px-2 py-1 rounded hover:bg-gray-700 text-gray-300 italic text-sm">I</button>
                            <button type="button" className="px-2 py-1 rounded hover:bg-gray-700 text-gray-300 underline text-sm">U</button>
                        </div>
                        <textarea name="description" value={editingProject.description} onChange={handleChange} placeholder="Provide a detailed description of the project..." className="w-full p-2 bg-gray-800 rounded-b-lg border-none focus:ring-0 h-32 resize-y" required />
                    </div>
                </div>
            </div>
            
            <div className="flex justify-end pt-4">
                <button type="submit" className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-lg">
                    {editingProject && 'id' in editingProject ? 'Save Changes' : 'Create Project'}
                </button>
            </div>
            </form>
        )}
      </Modal>

      <Modal isOpen={isAddClientModalOpen} onClose={() => setIsAddClientModalOpen(false)} title="Add New Client">
        <form onSubmit={handleClientSubmit} className="space-y-4">
            <input name="name" value={newClientData.name} onChange={handleNewClientChange} placeholder="Client Name" className="w-full p-2 bg-gray-700 rounded border border-gray-600" required />
            <input name="contactPerson" value={newClientData.contactPerson} onChange={handleNewClientChange} placeholder="Contact Person" className="w-full p-2 bg-gray-700 rounded border border-gray-600" required />
            <input name="email" type="email" value={newClientData.email} onChange={handleNewClientChange} placeholder="Email" className="w-full p-2 bg-gray-700 rounded border border-gray-600" required />
            <input name="phone" value={newClientData.phone} onChange={handleNewClientChange} placeholder="Phone" className="w-full p-2 bg-gray-700 rounded border border-gray-600" required />
            <div className="flex justify-end pt-4">
                <button type="submit" className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-lg">Save Client</button>
            </div>
        </form>
      </Modal>

    </div>
  );
};
