
import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
}

const colorClasses = {
  blue: 'bg-blue-900 text-blue-300',
  green: 'bg-green-900 text-green-300',
  yellow: 'bg-yellow-900 text-yellow-300',
  red: 'bg-red-900 text-red-300',
  gray: 'bg-gray-700 text-gray-300',
};

export const Badge: React.FC<BadgeProps> = ({ children, color }) => {
  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${colorClasses[color]}`}
    >
      {children}
    </span>
  );
};
