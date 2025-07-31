


import React, { useState, useMemo } from 'react';
import { Teammate, Task, TaskStatus } from '../types';
import { Card } from './ui/Card';
import { StarRating } from './ui/StarRating';

interface PerformanceEvaluationProps {
  teammates: Teammate[];
  tasks: Task[];
}

type TimePeriod = 'weekly' | 'monthly';

export const PerformanceEvaluation: React.FC<PerformanceEvaluationProps> = ({ teammates, tasks }) => {
  const [period, setPeriod] = useState<TimePeriod>('weekly');

  const performanceData = useMemo(() => {
    const now = new Date();
    const fromDate = new Date();
    if (period === 'weekly') {
      fromDate.setDate(now.getDate() - 7);
    } else { // monthly
      fromDate.setMonth(now.getMonth() - 1);
    }

    const ratedTasks = tasks.filter(task => {
      const completionDate = new Date(task.deadline); 
      const hasRating = task.ratings && (typeof task.ratings.assigner === 'number' || typeof task.ratings.ceo === 'number');
      return task.status === TaskStatus.Done && hasRating && completionDate >= fromDate && completionDate <= now;
    });

    const data = teammates.map(teammate => {
      const teammateTasks = ratedTasks.filter(t => t.assignedToId === teammate.id);
      const ratedTasksCount = teammateTasks.length;
      
      if (ratedTasksCount === 0) {
        return {
          id: teammate.id,
          name: teammate.name,
          role: teammate.role,
          avgRating: 0,
          ratedTasksCount: 0,
        };
      }

      const totalRatingSum = teammateTasks.reduce((sum, task) => {
        const ratingsArray = Object.values(task.ratings || {}).filter(r => typeof r === 'number') as number[];
        if (ratingsArray.length === 0) return sum;
        const taskAvgRating = ratingsArray.reduce((a, b) => a + b, 0) / ratingsArray.length;
        return sum + taskAvgRating;
      }, 0);
      
      const avgRating = totalRatingSum / ratedTasksCount;

      return {
        id: teammate.id,
        name: teammate.name,
        role: teammate.role,
        avgRating,
        ratedTasksCount,
      };
    });

    return data.sort((a, b) => b.avgRating - a.avgRating);

  }, [teammates, tasks, period]);

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-3xl font-bold text-white mb-6">Performance Evaluation</h1>
      
      <div className="flex justify-start mb-6">
          <div className="flex rounded-lg bg-gray-800 p-1 border border-gray-700">
            <button
              onClick={() => setPeriod('weekly')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                period === 'weekly' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:bg-gray-700'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                period === 'monthly' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:bg-gray-700'
              }`}
            >
              Monthly
            </button>
          </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-gray-700">
                <tr>
                  <th className="p-4">Rank</th>
                  <th className="p-4">Teammate</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Rated Tasks</th>
                  <th className="p-4">Average Rating</th>
                </tr>
              </thead>
              <tbody>
                {performanceData.map((data, index) => (
                  <tr key={data.id} className="border-b border-gray-800 hover:bg-gray-700/50">
                    <td className="p-4 font-bold text-lg text-primary-400">#{index + 1}</td>
                    <td className="p-4 font-medium">{data.name}</td>
                    <td className="p-4 text-gray-300">{data.role}</td>
                    <td className="p-4 text-gray-300">{data.ratedTasksCount}</td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <StarRating rating={data.avgRating} disabled />
                        <span className="font-semibold text-white">{data.avgRating.toFixed(2)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {performanceData.filter(d => d.ratedTasksCount > 0).length === 0 && (
              <p className="p-4 text-center text-gray-400">No rated tasks found for this period.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {performanceData.map((data, index) => (
            <Card key={data.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-primary-400 font-bold">#{index + 1}</p>
                  <h3 className="font-bold text-lg text-white">{data.name}</h3>
                  <p className="text-sm text-gray-400">{data.role}</p>
                </div>
                 <div className="text-right">
                    <p className="text-sm text-gray-400">Rating</p>
                    <div className="flex items-center space-x-2">
                      <StarRating rating={data.avgRating} disabled />
                      <span className="font-semibold text-white text-sm">{data.avgRating.toFixed(2)}</span>
                    </div>
                 </div>
              </div>
               <p className="text-sm text-gray-300 mt-2">Based on {data.ratedTasksCount} rated task(s) this {period.replace('ly', '')}.</p>
            </Card>
        ))}
        {performanceData.filter(d => d.ratedTasksCount > 0).length === 0 && (
            <Card><p className="p-4 text-center text-gray-400">No rated tasks found for this period.</p></Card>
        )}
      </div>

    </div>
  );
};
