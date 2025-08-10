import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://pgrsoyyytmgdztuwbluo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncnNveXl5dG1nZHp0dXdibHVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5MDMxMjgsImV4cCI6MjA0OTQ3OTEyOH0.Oa97EJq-YOVpS49NL4NkNJvgaXGLqIw9mV6sQ4b7dKk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🔧 Running archive migration...');

  try {
    // Add archive columns
    console.log('📋 Adding archived column...');
    const { error: archivedError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE tasks ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;'
    });
    
    if (archivedError) {
      console.log('⚠️ Archived column might already exist:', archivedError.message);
    } else {
      console.log('✅ Archived column added successfully');
    }

    console.log('📋 Adding archived_at column...');
    const { error: archivedAtError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE tasks ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;'
    });
    
    if (archivedAtError) {
      console.log('⚠️ Archived_at column might already exist:', archivedAtError.message);
    } else {
      console.log('✅ Archived_at column added successfully');
    }

    console.log('📋 Adding completed_at column...');
    const { error: completedAtError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;'
    });
    
    if (completedAtError) {
      console.log('⚠️ Completed_at column might already exist:', completedAtError.message);
    } else {
      console.log('✅ Completed_at column added successfully');
    }

    // Check if columns exist by querying the table structure
    console.log('🔍 Checking table structure...');
    const { data: columns, error: columnsError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'tasks' 
        AND column_name IN ('archived', 'archived_at', 'completed_at')
        ORDER BY column_name;
      `
    });

    if (columnsError) {
      console.error('❌ Error checking columns:', columnsError);
    } else {
      console.log('📊 Archive columns status:');
      if (columns && columns.length > 0) {
        columns.forEach(col => {
          console.log(`  ✅ ${col.column_name}: ${col.data_type} (default: ${col.column_default || 'none'})`);
        });
      } else {
        console.log('⚠️ No archive columns found. Trying alternative approach...');
        
        // Try to update a task to test if columns exist
        const { data: testTask } = await supabase
          .from('tasks')
          .select('id')
          .limit(1)
          .single();
        
        if (testTask) {
          const { error: testError } = await supabase
            .from('tasks')
            .update({ archived: false })
            .eq('id', testTask.id);
          
          if (testError) {
            console.error('❌ Archive column does not exist:', testError.message);
            console.log('💡 You may need to run the SQL migration manually in Supabase dashboard');
          } else {
            console.log('✅ Archive column exists and is working');
          }
        }
      }
    }

    console.log('✅ Migration check completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run the migration
runMigration().then(() => {
  console.log('🏁 Script finished');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
