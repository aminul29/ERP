import { useEffect, useState } from 'react';
import { ArchiveService } from '../lib/archive-service';

export const useAutoArchive = () => {
  const [isArchiving, setIsArchiving] = useState(false);
  const [lastArchiveRun, setLastArchiveRun] = useState<string | null>(null);

  useEffect(() => {
    const runAutoArchive = async () => {
      try {
        // Check if we've already run auto-archive today
        const today = new Date().toDateString();
        const lastRun = localStorage.getItem('lastAutoArchiveRun');
        
        if (lastRun === today) {
          console.log('✅ Auto-archive already ran today, skipping...');
          setLastArchiveRun(lastRun);
          return;
        }

        console.log('🕒 Running auto-archive check...');
        setIsArchiving(true);

        const result = await ArchiveService.autoArchiveCompletedTasks();
        
        if (result.error) {
          console.error('❌ Auto-archive failed:', result.error);
        } else {
          console.log(`✅ Auto-archive completed. Archived ${result.archivedCount} tasks.`);
          // Mark as completed for today
          localStorage.setItem('lastAutoArchiveRun', today);
          setLastArchiveRun(today);
        }
        
      } catch (error) {
        console.error('❌ Error in auto-archive:', error);
      } finally {
        setIsArchiving(false);
      }
    };

    // Run auto-archive on app startup with a small delay
    const timer = setTimeout(runAutoArchive, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  return { isArchiving, lastArchiveRun };
};
