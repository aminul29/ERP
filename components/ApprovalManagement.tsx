
import React from 'react';
import { PendingUpdate, Task, Project, TeammatePendingUpdate, Teammate } from '../types';
import { Card } from './ui/Card';

interface ApprovalManagementProps {
  pendingUpdates: PendingUpdate[];
  projects: Project[];
  tasks: Task[];
  teammates: Teammate[];
  onApprove: (updateId: string) => void;
  onReject: (updateId: string) => void;
}

const renderValue = (key: string, value: any) => {
    if (value === undefined || value === null || value === '') return <span className="italic text-gray-500">empty</span>;
    if (Array.isArray(value)) {
        return `[${value.join(', ')}]`;
    }
    if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
    }
    if ((key === 'deadline' || key === 'startDate' || key === 'endDate') && typeof value === 'string' && value) {
        return new Date(value).toLocaleDateString();
    }
    return String(value);
};

export const ApprovalManagement: React.FC<ApprovalManagementProps> = ({ pendingUpdates, projects, tasks, teammates, onApprove, onReject }) => {
    
    const getTargetName = (update: PendingUpdate) => {
        if (update.type === 'project') {
            const project = projects.find(p => p.id === update.itemId);
            return project?.name || 'Unknown Project';
        }
        if (update.type === 'task') {
            const task = tasks.find(t => t.id === update.itemId);
            return task?.title || 'Unknown Task';
        }
        if (update.type === 'teammate') {
            const teammate = teammates.find(t => t.id === update.itemId);
            return teammate?.name || 'Unknown Teammate';
        }
        return 'Unknown';
    };

    const renderChanges = (update: PendingUpdate) => {
        if (update.type === 'teammate') {
            const { role, justification } = update.data;
            const originalRole = update.originalData.role;
            return (
                <>
                    <div key="role" className="text-sm">
                        <strong className="capitalize font-medium text-gray-300">Role:</strong> 
                        <span className="font-mono text-red-400 line-through ml-2">{originalRole}</span>
                        <span className="mx-2 text-gray-400">→</span>
                        <span className="font-mono text-green-400">{role}</span>
                    </div>
                    <div key="justification" className="text-sm mt-2">
                        <strong className="capitalize font-medium text-gray-300">Justification:</strong>
                        <p className="whitespace-pre-wrap text-gray-200 bg-gray-800 p-2 rounded-md mt-1 font-normal">{justification}</p>
                    </div>
                </>
            );
        }

        return Object.entries(update.data).map(([key, newValue]) => {
            const oldValue = (update.originalData as Record<string, any>)[key];
            return (
                <div key={key} className="text-sm">
                    <strong className="capitalize font-medium text-gray-300">{key.replace(/([A-Z])/g, ' $1')}:</strong> 
                    <span className="font-mono text-red-400 line-through ml-2">{renderValue(key, oldValue)}</span>
                    <span className="mx-2 text-gray-400">→</span>
                    <span className="font-mono text-green-400">{renderValue(key, newValue)}</span>
                </div>
            );
        });
    };

    const sortedUpdates = [...pendingUpdates].sort((a,b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());

    return (
        <div className="p-4 sm:p-6">
            <h1 className="text-3xl font-bold text-white mb-6">Pending Approvals</h1>
            {sortedUpdates.length === 0 ? (
                <Card><p className="text-center text-gray-400">No pending approvals.</p></Card>
            ) : (
                <div className="space-y-6">
                    {sortedUpdates.map(update => (
                        <Card key={update.id}>
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-white capitalize">{update.type} Change Request: "{getTargetName(update)}"</h2>
                                    <p className="text-sm text-gray-400">Requested by <span className="font-semibold">{update.requesterName}</span> on {new Date(update.requestedAt).toLocaleString()}</p>
                                </div>
                                <div className="flex justify-end space-x-2 mt-4 sm:mt-0">
                                    <button onClick={() => onReject(update.id)} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg text-sm">
                                        Reject
                                    </button>
                                    <button onClick={() => onApprove(update.id)} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg text-sm">
                                        Approve
                                    </button>
                                </div>
                            </div>
                            <div className="my-4 p-4 bg-gray-900/50 border border-gray-700 rounded-md space-y-2">
                                <h3 className="font-semibold text-gray-200">Proposed Changes:</h3>
                                {renderChanges(update)}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};