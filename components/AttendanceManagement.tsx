

import React, { useState, useMemo } from 'react';
import { Attendance, Teammate, AttendanceStatus } from '../types';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

interface AttendanceManagementProps {
  currentUser: Teammate;
  teammates: Teammate[];
  attendance: Attendance[];
  onClockIn: (teammateId: string) => void;
  onClockOut: (attendanceId: string) => void;
  onUpdateAttendance: (attendanceId: string, teammateId: string, date: string, status: AttendanceStatus) => void;
}

const statusColors: { [key in AttendanceStatus]: 'green' | 'blue' | 'red' } = {
  [AttendanceStatus.Present]: 'green',
  [AttendanceStatus.OnLeave]: 'blue',
  [AttendanceStatus.Absent]: 'red',
};

const formatTime = (isoString?: string) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const AttendanceManagement: React.FC<AttendanceManagementProps> = ({ currentUser, teammates, attendance, onClockIn, onClockOut, onUpdateAttendance }) => {
  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);
  
  const todayStr = new Date().toISOString().split('T')[0];

  const isHrOrAdmin = currentUser.role === 'HR and Admin';

  const todaysUserAttendance = useMemo(() => {
    return attendance.find(a => a.teammateId === currentUser.id && a.date === todayStr);
  }, [attendance, currentUser.id, todayStr]);
  
  const recentUserAttendance = useMemo(() => {
    return attendance
      .filter(a => a.teammateId === currentUser.id)
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 7);
  }, [attendance, currentUser.id]);

  const teamAttendanceForViewDate = useMemo(() => {
    return teammates.map(emp => {
      const record = attendance.find(a => a.teammateId === emp.id && a.date === viewDate);
      return {
        teammate: emp,
        attendance: record || {
            id: `temp-${emp.id}-${viewDate}`,
            teammateId: emp.id,
            date: viewDate,
            status: AttendanceStatus.Absent
        }
      };
    });
  }, [teammates, attendance, viewDate]);

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-3xl font-bold text-white mb-6">Attendance</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User's View */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <h2 className="text-xl font-semibold text-white mb-4">Today's Attendance ({new Date(todayStr).toLocaleDateString()})</h2>
            <div className="text-center p-4">
              {!todaysUserAttendance && (
                <button onClick={() => onClockIn(currentUser.id)} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-lg">
                  Clock In
                </button>
              )}
              {todaysUserAttendance && !todaysUserAttendance.checkOutTime && (
                <>
                  <p className="text-green-400 mb-4">Clocked in at {formatTime(todaysUserAttendance.checkInTime)}</p>
                  <button onClick={() => onClockOut(todaysUserAttendance.id)} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg text-lg">
                    Clock Out
                  </button>
                </>
              )}
              {todaysUserAttendance && todaysUserAttendance.checkOutTime && (
                 <div className="text-primary-400">
                    <p>Clocked In: {formatTime(todaysUserAttendance.checkInTime)}</p>
                    <p>Clocked Out: {formatTime(todaysUserAttendance.checkOutTime)}</p>
                    <p className="mt-2 font-bold">Session Complete</p>
                 </div>
              )}
            </div>
          </Card>
          <Card>
             <h2 className="text-xl font-semibold text-white mb-4">My Recent History</h2>
             <ul className="space-y-2">
               {recentUserAttendance.map(log => (
                 <li key={log.id} className="flex justify-between items-center p-2 bg-gray-700/50 rounded-md">
                   <span className="font-medium text-gray-200">{new Date(log.date).toLocaleDateString()}</span>
                   <Badge color={statusColors[log.status]}>{log.status}</Badge>
                 </li>
               ))}
             </ul>
          </Card>
        </div>

        {/* HR/Admin View */}
        {isHrOrAdmin && (
          <div className="lg:col-span-2">
            <Card>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                <h2 className="text-xl font-semibold text-white">Team Attendance</h2>
                <input
                  type="date"
                  value={viewDate}
                  onChange={e => setViewDate(e.target.value)}
                  className="p-2 bg-gray-700 rounded border border-gray-600 w-full sm:w-auto"
                />
              </div>

              {/* Desktop Table View */}
              <div className="overflow-x-auto hidden md:block">
                <table className="w-full text-left">
                  <thead className="border-b border-gray-700">
                    <tr>
                      <th className="p-4">Teammate</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Check In</th>
                      <th className="p-4">Check Out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamAttendanceForViewDate.map(({ teammate, attendance: record }) => (
                      <tr key={teammate.id} className="border-b border-gray-800 hover:bg-gray-700/50">
                        <td className="p-4 font-medium">{teammate.name}</td>
                        <td className="p-4">
                          <select 
                            value={record.status} 
                            onChange={(e) => onUpdateAttendance(record.id, teammate.id, viewDate, e.target.value as AttendanceStatus)}
                            className={`w-full p-1 text-sm rounded border-none focus:ring-0 text-white ${
                                record.status === AttendanceStatus.Present ? 'bg-green-900/50' :
                                record.status === AttendanceStatus.OnLeave ? 'bg-blue-900/50' : 'bg-red-900/50'
                            }`}
                           >
                            {Object.values(AttendanceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="p-4 text-gray-300 font-mono">{formatTime(record.checkInTime)}</td>
                        <td className="p-4 text-gray-300 font-mono">{formatTime(record.checkOutTime)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {teamAttendanceForViewDate.map(({ teammate, attendance: record }) => (
                  <div key={teammate.id} className="p-3 bg-gray-700/50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-white">{teammate.name}</h4>
                    </div>
                     <select 
                        value={record.status} 
                        onChange={(e) => onUpdateAttendance(record.id, teammate.id, viewDate, e.target.value as AttendanceStatus)}
                        className={`w-full p-2 text-sm rounded border-none focus:ring-0 text-white mb-2 ${
                            record.status === AttendanceStatus.Present ? 'bg-green-900/50' :
                            record.status === AttendanceStatus.OnLeave ? 'bg-blue-900/50' : 'bg-red-900/50'
                        }`}
                        >
                        {Object.values(AttendanceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    <div className="flex justify-between text-sm">
                      <p className="text-gray-400">In: <span className="text-white font-mono">{formatTime(record.checkInTime)}</span></p>
                      <p className="text-gray-400">Out: <span className="text-white font-mono">{formatTime(record.checkOutTime)}</span></p>
                    </div>
                  </div>
                ))}
              </div>

            </Card>
          </div>
        )}
      </div>
    </div>
  );
};