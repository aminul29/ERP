import { NextApiRequest, NextApiResponse } from 'next';
import { ArchiveService } from '../../../lib/archive-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify this is a cron request (Vercel adds this header)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🕒 Starting scheduled auto-archive process...');
    
    const result = await ArchiveService.autoArchiveCompletedTasks();
    
    if (result.error) {
      console.error('❌ Auto-archive failed:', result.error);
      return res.status(500).json({ 
        success: false, 
        error: result.error,
        archivedCount: result.archivedCount 
      });
    }
    
    console.log(`✅ Auto-archive completed successfully. Archived ${result.archivedCount} tasks.`);
    
    return res.status(200).json({ 
      success: true, 
      message: `Successfully archived ${result.archivedCount} tasks`,
      archivedCount: result.archivedCount,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Unexpected error in auto-archive cron:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
