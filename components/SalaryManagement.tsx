

import React, { useState } from 'react';
import { Salary, Teammate, SalaryStatus } from '../types';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';

interface SalaryManagementProps {
  salaries: Salary[];
  teammates: Teammate[];
  onUpdateSalaryStatus: (salaryId: string, status: SalaryStatus) => void;
  currentUser: Teammate;
  currencySymbol: string;
}

const statusColors: { [key in SalaryStatus]: 'yellow' | 'green' | 'red' } = {
  [SalaryStatus.Pending]: 'yellow',
  [SalaryStatus.Paid]: 'green',
  [SalaryStatus.Delayed]: 'red',
};

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const SalaryManagement: React.FC<SalaryManagementProps> = ({ salaries, teammates, onUpdateSalaryStatus, currentUser, currencySymbol }) => {
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedTeammate, setSelectedTeammate] = useState<Teammate | null>(null);
  
  const canAccess = ['HR and Admin', 'CEO'].includes(currentUser.role);

  if (!canAccess) {
    return <div className="p-6"><h1 className="text-2xl text-red-500">Access Denied</h1></div>;
  }

  const handleShowHistory = (teammate: Teammate) => {
    setSelectedTeammate(teammate);
    setHistoryModalOpen(true);
  };
  
  const handleCloseHistory = () => {
    setSelectedTeammate(null);
    setHistoryModalOpen(false);
  };
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentSalaries = teammates.map(emp => {
    const salaryRecord = salaries.find(s => s.teammateId === emp.id && s.month === currentMonth && s.year === currentYear);
    return salaryRecord || { 
        id: `temp-${emp.id}`, 
        teammateId: emp.id, 
        month: currentMonth, 
        year: currentYear, 
        amount: emp.salary ? emp.salary / 12 : 0, 
        status: SalaryStatus.Pending 
    };
  });
  
  const teammateSalaryHistory = selectedTeammate ? salaries
    .filter(s => s.teammateId === selectedTeammate.id)
    .sort((a,b) => new Date(b.year, b.month).getTime() - new Date(a.year, a.month).getTime()) 
    : [];

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Salary Management ({monthNames[currentMonth]} {currentYear})</h1>
      
      {/* Desktop Table View */}
      <Card className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="p-4">Teammate</th>
                <th className="p-4">Salary Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentSalaries.map(salary => {
                const teammate = teammates.find(e => e.id === salary.teammateId);
                if (!teammate) return null;
                
                return (
                  <tr key={salary.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-700/50">
                    <td className="p-4 font-medium">{teammate.name}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">{currencySymbol}{salary.amount.toLocaleString()}</td>
                    <td className="p-4"><Badge color={statusColors[salary.status]}>{salary.status}</Badge></td>
                    <td className="p-4 flex space-x-2">
                      <select
                        value={salary.status}
                        onChange={(e) => onUpdateSalaryStatus(salary.id, e.target.value as SalaryStatus)}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm"
                        disabled={salary.id.startsWith('temp-')}
                      >
                        {Object.values(SalaryStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button onClick={() => handleShowHistory(teammate)} className="text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 text-sm font-semibold">History</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {currentSalaries.map(salary => {
          const teammate = teammates.find(e => e.id === salary.teammateId);
          if (!teammate) return null;

          return (
            <Card key={salary.id} className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg text-white">{teammate.name}</h3>
                <Badge color={statusColors[salary.status]}>{salary.status}</Badge>
              </div>
              <p className="text-gray-300 mt-1">{currencySymbol}{salary.amount.toLocaleString()}</p>
              <div className="mt-4 pt-3 border-t border-gray-700 flex items-center space-x-2">
                <select
                  value={salary.status}
                  onChange={(e) => onUpdateSalaryStatus(salary.id, e.target.value as SalaryStatus)}
                  className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-2 py-2 text-sm"
                  disabled={salary.id.startsWith('temp-')}
                >
                  {Object.values(SalaryStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => handleShowHistory(teammate)} className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-md text-sm">History</button>
              </div>
            </Card>
          );
        })}
      </div>
      
      <Modal isOpen={historyModalOpen} onClose={handleCloseHistory} title={`Salary History for ${selectedTeammate?.name}`}>
        <div className="max-h-96 overflow-y-auto">
          <ul className="space-y-2">
            {teammateSalaryHistory.length > 0 ? teammateSalaryHistory.map(s => (
                <li key={s.id} className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-700/50 rounded-md">
                   <div>
                       <p className="font-semibold text-gray-900 dark:text-white">{monthNames[s.month]} {s.year}</p>
                       <p className="text-sm text-gray-600 dark:text-gray-300">{currencySymbol}{s.amount.toLocaleString()}</p>
                   </div>
                   <Badge color={statusColors[s.status]}>{s.status}</Badge>
                </li>
            )) : <p className="text-gray-500 dark:text-gray-400">No payment history found.</p>}
          </ul>
        </div>
      </Modal>
    </div>
  );
};