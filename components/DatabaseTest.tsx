import React, { useState, useEffect } from 'react';
import { loadFromDatabase, initializeDatabase } from '../lib/db-service';

export const DatabaseTest: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testConnection = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Initialize database
        await initializeDatabase();
        
        // Try to load ERP settings to test connection
        const settings = await loadFromDatabase.erpSettings();
        
        setIsConnected(true);
        console.log('Database connection successful!', settings);
        
      } catch (err: any) {
        setIsConnected(false);
        setError(err.message || 'Unknown error');
        console.error('Database connection failed:', err);
      } finally {
        setLoading(false);
      }
    };

    testConnection();
  }, []);

  if (loading) {
    return (
      <div className="p-4 bg-blue-900/20 border border-blue-600 rounded-lg">
        <p className="text-blue-200">🔄 Testing database connection...</p>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="p-4 bg-green-900/20 border border-green-600 rounded-lg">
        <p className="text-green-200">✅ Database connected successfully!</p>
        <p className="text-sm text-green-300 mt-1">
          Your ERP is now using Supabase database instead of localStorage.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-red-900/20 border border-red-600 rounded-lg">
      <p className="text-red-200">❌ Database connection failed</p>
      <p className="text-sm text-red-300 mt-1">Error: {error}</p>
      <p className="text-xs text-red-400 mt-2">
        Check your environment variables and Supabase configuration.
      </p>
    </div>
  );
};
