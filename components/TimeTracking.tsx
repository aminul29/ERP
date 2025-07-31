

import React, { useState, useMemo } from 'react';
import { TimeLog, Teammate } from '../types';
import { Card } from './ui/Card';

interface TimeTrackingProps {
  timeLogs: TimeLog[];
  teammates: Teammate[];
  currentUser: Teammate;
  onLogTime: (log: Omit<TimeLog, 'id'>) => void;
  dailyTimeGoal: number;
}

export const TimeTracking: React.FC<TimeTrackingProps> = ({ timeLogs, teammates, currentUser, onLogTime, dailyTimeGoal }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState(dailyTimeGoal);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogTime({
      teammateId: currentUser.id,
      date,
      hours: Number(hours),
    });
  };

  const userTimeLogs = useMemo(() => {
    return timeLogs
      .filter(log => log.teammateId === currentUser.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [timeLogs, currentUser.id]);
  
  const isManager = ['HR and Admin', 'CEO', 'Lead Web Developer', 'SMM and Design Lead', 'Sales and PR Lead', 'Lead SEO Expert'].includes(currentUser.role);

  const weeklySummary = useMemo(() => {
    if (!isManager) return [];
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return teammates.map(emp => {
      const totalHours = timeLogs
        .filter(log => log.teammateId === emp.id && new Date(log.date) >= oneWeekAgo)
        .reduce((sum, log) => sum + log.hours, 0);
      return { ...emp, totalHours };
    });
  }, [timeLogs, teammates, isManager]);

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Time Tracking</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Log Your Hours</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Date</label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600"
                  required
                />
              </div>
              <div>
                <label htmlFor="hours" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Hours (Goal: {dailyTimeGoal}h/day)</label>
                <input
                  type="number"
                  id="hours"
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  step="0.1"
                  min="0"
                  className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600"
                  required
                />
              </div>
              <button type="submit" className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-lg">
                Log Time
              </button>
            </form>
          </Card>
          
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">My Recent Logs</h2>
            <ul className="space-y-2">
              {userTimeLogs.map(log => (
                <li key={log.id} className="flex justify-between p-2 bg-gray-100 dark:bg-gray-700/50 rounded-md">
                  <span className="text-gray-600 dark:text-gray-300">{new Date(log.date).toLocaleDateString()}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{log.hours} hours</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {isManager && (
          <div className="lg:col-span-2">
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Weekly Team Contribution</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="p-4">Teammate</th>
                      <th className="p-4">Total Hours (Last 7 Days)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklySummary.map(summary => (
                      <tr key={summary.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-700/50">
                        <td className="p-4 font-medium">{summary.name}</td>
                        <td className="p-4 text-primary-500 dark:text-primary-400 font-bold">{summary.totalHours.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};