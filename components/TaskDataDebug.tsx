import React from 'react';
import { Task } from '../types';

interface TaskDataDebugProps {
  task: Task;
}

export const TaskDataDebug: React.FC<TaskDataDebugProps> = ({ task }) => {
  const submissionFields = {
    completionReport: task.completionReport,
    workExperience: task.workExperience,
    suggestions: task.suggestions,
    driveLink: task.driveLink
  };

  const hasSubmissionData = task.completionReport || task.workExperience || task.suggestions || task.driveLink;
  const isComplete = task.status === 'Completed';
  const isUnderReview = task.status === 'Under Review';
  const shouldShow = (isComplete || isUnderReview) && hasSubmissionData;

  return (
    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
      <h3 className="text-red-400 font-bold mb-2">🐛 Task Debug Info</h3>
      <div className="text-sm space-y-1">
        <p><strong>Task ID:</strong> {task.id}</p>
        <p><strong>Task Status:</strong> "{task.status}"</p>
        <p><strong>Is Complete:</strong> {String(isComplete)}</p>
        <p><strong>Is Under Review:</strong> {String(isUnderReview)}</p>
        <p><strong>Has Submission Data:</strong> {String(hasSubmissionData)}</p>
        <p><strong>Should Show Submitted Report:</strong> {String(shouldShow)}</p>
        
        <div className="mt-2">
          <strong>Submission Fields:</strong>
          <div className="ml-2 space-y-1">
            {Object.entries(submissionFields).map(([key, value]) => (
              <p key={key}>
                <span className="text-gray-400">{key}:</span> 
                <span className={value ? "text-green-400" : "text-red-400"}>
                  {value ? `"${String(value).substring(0, 50)}${String(value).length > 50 ? '...' : ''}"` : 'null/undefined'}
                </span>
              </p>
            ))}
          </div>
        </div>
        
        <div className="mt-2">
          <strong>Full Task Data:</strong>
          <pre className="text-xs bg-gray-900 p-2 rounded overflow-auto max-h-32">
            {JSON.stringify(task, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};
