import React, { useState, useEffect } from 'react';

interface LogEntry {
  timestamp: string;
  level: 'log' | 'error' | 'warn' | 'info';
  message: string;
}

export const ConsoleLogger: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const originalConsoleError = console.error;
    const originalConsoleLog = console.log;
    const originalConsoleWarn = console.warn;
    const originalConsoleInfo = console.info;

    const addLog = (level: 'log' | 'error' | 'warn' | 'info', ...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      const logEntry: LogEntry = {
        timestamp: new Date().toLocaleTimeString(),
        level,
        message
      };
      
      setLogs(prev => [logEntry, ...prev.slice(0, 99)]); // Keep only last 100 logs
    };

    console.error = (...args) => {
      originalConsoleError(...args);
      addLog('error', ...args);
    };

    console.log = (...args) => {
      originalConsoleLog(...args);
      // Only capture logs related to our app (with emoji indicators)
      const message = args[0];
      if (typeof message === 'string' && (message.includes('📋') || message.includes('🚀') || message.includes('❌') || message.includes('✅') || message.includes('🔄') || message.includes('👤'))) {
        addLog('log', ...args);
      }
    };

    console.warn = (...args) => {
      originalConsoleWarn(...args);
      addLog('warn', ...args);
    };

    console.info = (...args) => {
      originalConsoleInfo(...args);
      addLog('info', ...args);
    };

    return () => {
      console.error = originalConsoleError;
      console.log = originalConsoleLog;
      console.warn = originalConsoleWarn;
      console.info = originalConsoleInfo;
    };
  }, []);

  const clearLogs = () => setLogs([]);

  const copyToClipboard = () => {
    const logText = logs.map(log => `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`).join('\n');
    navigator.clipboard.writeText(logText);
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-300 bg-red-900/20';
      case 'warn': return 'text-yellow-300 bg-yellow-900/20';
      case 'info': return 'text-blue-300 bg-blue-900/20';
      default: return 'text-gray-300 bg-gray-900/20';
    }
  };

  return (
    <div className="mb-4">
      <div className="p-4 bg-gray-800 border border-gray-600 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-white flex items-center">
            🖥️ Console Logger
            {logs.filter(l => l.level === 'error').length > 0 && (
              <span className="ml-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                {logs.filter(l => l.level === 'error').length} errors
              </span>
            )}
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded"
            >
              {isExpanded ? 'Hide' : 'Show'} ({logs.length})
            </button>
            <button
              onClick={copyToClipboard}
              className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded"
              disabled={logs.length === 0}
            >
              Copy All
            </button>
            <button
              onClick={clearLogs}
              className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded"
              disabled={logs.length === 0}
            >
              Clear
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="max-h-96 overflow-y-auto space-y-1">
            {logs.length === 0 ? (
              <p className="text-gray-400 text-sm">No logs captured yet...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`p-2 rounded text-xs ${getLogColor(log.level)}`}>
                  <div className="flex justify-between items-start">
                    <span className="font-bold uppercase">{log.level}</span>
                    <span className="text-xs opacity-70">{log.timestamp}</span>
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-xs mt-1 break-all">
                    {log.message}
                  </pre>
                </div>
              ))
            )}
          </div>
        )}

        {!isExpanded && logs.length > 0 && (
          <p className="text-gray-400 text-sm">
            Latest: {logs[0].level.toUpperCase()} - {logs[0].message.substring(0, 100)}
            {logs[0].message.length > 100 && '...'}
          </p>
        )}
      </div>
    </div>
  );
};
