
import React from 'react';
import { Project, Teammate } from '../types';
import { ProjectAssignmentToast } from './ProjectAssignmentToast';

interface ToastContainerProps {
    assignments: Project[];
    currentUser: Teammate;
    onAccept: (projectId: string, teammateId: string) => void;
    onExpire: (projectId: string, teammateId: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ assignments, currentUser, onAccept, onExpire }) => {
    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end space-y-4">
            {assignments.map(project => (
                <ProjectAssignmentToast
                    key={project.id}
                    project={project}
                    currentUser={currentUser}
                    onAccept={onAccept}
                    onExpire={onExpire}
                />
            ))}
        </div>
    );
}
