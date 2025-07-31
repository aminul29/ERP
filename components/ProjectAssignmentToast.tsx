import React, { useState, useEffect } from 'react';
import { Project, Teammate, ProjectAcceptanceStatus } from '../types';
import { ICONS } from '../constants';

interface ProjectAssignmentToastProps {
    project: Project;
    currentUser: Teammate;
    onAccept: (projectId: string, teammateId: string) => void;
    onExpire: (projectId: string, teammateId: string) => void;
}

const EIGHT_HOURS_IN_MS = 8 * 60 * 60 * 1000;

export const ProjectAssignmentToast: React.FC<ProjectAssignmentToastProps> = ({ project, currentUser, onAccept, onExpire }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [remainingTime, setRemainingTime] = useState(0);

    const assignmentInfo = project.acceptance?.[currentUser.id];

    useEffect(() => {
        setIsVisible(true); // Trigger entry animation

        if (!assignmentInfo || assignmentInfo.status !== ProjectAcceptanceStatus.Pending) {
            setRemainingTime(0);
            return;
        }

        const assignedAt = new Date(assignmentInfo.assignedAt).getTime();
        const expiresAt = assignedAt + EIGHT_HOURS_IN_MS;

        const timerId = setInterval(() => {
            const now = Date.now();
            const timeLeft = expiresAt - now;
            
            if (timeLeft <= 0) {
                setRemainingTime(0);
                onExpire(project.id, currentUser.id);
                clearInterval(timerId);
            } else {
                setRemainingTime(timeLeft);
            }
        }, 1000);

        // Set initial time immediately
        const initialTimeLeft = expiresAt - Date.now();
        if (initialTimeLeft <= 0) {
            setRemainingTime(0);
            onExpire(project.id, currentUser.id);
        } else {
            setRemainingTime(initialTimeLeft);
        }

        return () => clearInterval(timerId);
    }, [project.id, currentUser.id, assignmentInfo, onExpire]);

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const handleAccept = () => {
        onAccept(project.id, currentUser.id);
        setIsVisible(false);
    };
    
    const handleClose = () => {
        setIsVisible(false);
    }

    if (!assignmentInfo || remainingTime <= 0) {
        return null;
    }

    return (
        <div 
            className={`max-w-lg w-full bg-gray-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden border border-gray-700 transition-all duration-300 ease-in-out ${
                isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
            }`}
        >
            <div className="p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                        <span className="text-primary-400 w-6 h-6">{ICONS.projects}</span>
                    </div>
                    <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-white">New Project Assignment</p>
                        <p className="mt-1 text-sm text-gray-300">You've been assigned to: <strong className="text-white">{project.name}</strong></p>
                        <p className="mt-2 text-xs font-mono text-yellow-400">Time to accept: {formatTime(remainingTime)}</p>
                        <div className="mt-3 flex space-x-3">
                            <button
                                onClick={handleAccept}
                                className="bg-primary-500 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 focus:ring-offset-gray-800"
                            >
                                Accept
                            </button>
                        </div>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button
                            onClick={handleClose}
                            className="inline-flex text-gray-400 rounded-md hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 focus:ring-offset-gray-800"
                        >
                            <span className="sr-only">Close</span>
                            <span className="w-6 h-6">{ICONS.close}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};