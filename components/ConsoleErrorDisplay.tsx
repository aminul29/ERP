import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { ICONS } from '../constants';

interface ConsoleError {
  id: string;
  message: string;
  timestamp: string;
  type: 'error' | 'warning' | 'log';
  stack?: string;
}

export const ConsoleErrorDisplay: React.FC = () => {
  const [errors, setErrors] = useState<ConsoleError[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Capture console errors
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;

    console.error = (...args) => {
      originalError.apply(console, args);
      const errorMsg = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      setErrors(prev => [...prev, {
        id: Date.now().toString(),
        message: errorMsg,
        timestamp: new Date().toLocaleTimeString(),
        type: 'error'
      }].slice(-20)); // Keep only last 20 errors
    };

    console.warn = (...args) => {
      originalWarn.apply(console, args);
      const warnMsg = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      setErrors(prev => [...prev, {
        id: Date.now().toString(),
        message: warnMsg,
        timestamp: new Date().toLocaleTimeString(),
        type: 'warning'
      }].slice(-20));
    };

    // Add some initial diagnostic info
    setErrors(prev => [...prev, {
      id: `init-${Date.now()}`,
      message: `Theme diagnosis: Current theme = ${document.documentElement.classList.contains('dark') ? 'dark' : 'light'}`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'log'
    }]);

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      console.log = originalLog;
    };
  }, []);

  const copyToClipboard = () => {
    const errorText = errors.map(error => 
      `[${error.timestamp}] ${error.type.toUpperCase()}: ${error.message}`
    ).join('\n');
    
    navigator.clipboard.writeText(errorText).then(() => {
      alert('Console errors copied to clipboard!');
    });
  };

  const clearErrors = () => {
    setErrors([]);
  };

  if (!isVisible && errors.length === 0) return null;

  return (
    <Card className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
          {/* <div className="w-5 h-5 text-red-400">{ICONS.warning || '⚠️'}</div> */}
          <span>Console Output ({errors.length})</span>
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
          >
            {isVisible ? 'Hide' : 'Show'}
          </button>
          <button
            onClick={copyToClipboard}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
            disabled={errors.length === 0}
          >
            Copy All
          </button>
          <button
            onClick={clearErrors}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
            disabled={errors.length === 0}
          >
            Clear
          </button>
        </div>
      </div>

      {isVisible && (
        <div className="bg-gray-900 rounded-lg p-4 max-h-64 overflow-y-auto">
          <div className="space-y-2 font-mono text-sm">
            {errors.length === 0 ? (
              <div className="text-gray-400">No console output captured</div>
            ) : (
              errors.map(error => (
                <div 
                  key={error.id}
                  className={`p-2 rounded ${
                    error.type === 'error' 
                      ? 'bg-red-500/20 text-red-200 border-l-4 border-red-500' 
                      : error.type === 'warning'
                      ? 'bg-yellow-500/20 text-yellow-200 border-l-4 border-yellow-500'
                      : 'bg-blue-500/20 text-blue-200 border-l-4 border-blue-500'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs uppercase">
                      {error.type}
                    </span>
                    <span className="text-xs text-gray-400">
                      {error.timestamp}
                    </span>
                  </div>
                  <div className="mt-1 whitespace-pre-wrap break-words">
                    {error.message}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </Card>
  );
};
