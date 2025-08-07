import React, { useState } from 'react';
import { DatabaseOperations } from '../lib/db-operations';
import { loadFromDatabase } from '../lib/db-service';

export const NotificationTest: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testCreateNotification = async () => {
    setLoading(true);
    setResult('Creating notification...');

    try {
      console.log('Starting notification test...');
      
      // First, load teammates from database to get real UUIDs
      console.log('Loading teammates from database...');
      const teammates = await loadFromDatabase.teammates();
      console.log('Database teammates:', teammates);
      
      if (!teammates || teammates.length === 0) {
        setResult('❌ No teammates found in database');
        return;
      }
      
      // Find the CEO or use the first teammate
      const ceo = teammates.find(t => t.role === 'CEO') || teammates[0];
      console.log('Using teammate for test:', ceo);
      
      const testNotification = {
        userId: ceo.id, // Use the actual database ID
        message: 'Test notification from component',
        read: false,
        link: 'test'
      };

      console.log('Test notification data:', testNotification);
      
      const createdNotification = await DatabaseOperations.createNotification(testNotification);
      
      console.log('Result:', createdNotification);
      
      if (createdNotification) {
        setResult(`✅ Success! Notification created: ${JSON.stringify(createdNotification, null, 2)}`);
      } else {
        setResult('❌ Failed: Notification creation returned null');
      }
    } catch (error) {
      console.error('Test error:', error);
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        🔔 Notification Creation Test
      </h3>
      
      <button
        onClick={testCreateNotification}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Create Notification'}
      </button>
      
      {result && (
        <pre className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded text-sm overflow-x-auto text-gray-800 dark:text-gray-200">
          {result}
        </pre>
      )}
    </div>
  );
};
