import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://pgrsoyyytmgdztuwbluo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncnNveXl5dG1nZHp0dXdibHVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5MDMxMjgsImV4cCI6MjA0OTQ3OTEyOH0.Oa97EJq-YOVpS49NL4NkNJvgaXGLqIw9mV6sQ4b7dKk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugArchive() {
  console.log('🔍 Debugging archive functionality...');

  try {
    console.log('1️⃣ Checking if we can connect to database...');
    const { data: connection, error: connectionError } = await supabase
      .from('tasks')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Connection error:', connectionError);
      return;
    }
    console.log('✅ Database connection working');

    console.log('2️⃣ Fetching a completed task...');
    const { data: tasks, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .in('status', ['Done', 'Completed'])
      .limit(1);

    if (fetchError) {
      console.error('❌ Error fetching tasks:', fetchError);
      return;
    }

    if (!tasks || tasks.length === 0) {
      console.log('⚠️ No completed tasks found to test with');
      
      // Let's check what tasks exist
      const { data: allTasks, error: allError } = await supabase
        .from('tasks')
        .select('id, title, status')
        .limit(5);
      
      if (allError) {
        console.error('❌ Error fetching all tasks:', allError);
      } else {
        console.log('📋 Available tasks:', allTasks);
      }
      return;
    }

    const testTask = tasks[0];
    console.log('📋 Found completed task:', {
      id: testTask.id,
      title: testTask.title,
      status: testTask.status,
      archived: testTask.archived,
      has_archived_field: 'archived' in testTask
    });

    console.log('3️⃣ Testing archive update...');
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update({ 
        archived: true,
        archived_at: new Date().toISOString()
      })
      .eq('id', testTask.id)
      .select('*')
      .single();

    if (updateError) {
      console.error('❌ Error updating task:', updateError);
      
      // Let's check what columns exist in the tasks table
      console.log('4️⃣ Checking table schema...');
      const { data: schemaData, error: schemaError } = await supabase
        .rpc('exec_sql', {
          sql: `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'tasks' 
            AND table_schema = 'public'
            ORDER BY ordinal_position;
          `
        });
      
      if (schemaError) {
        console.log('⚠️ Cannot check schema via RPC, trying different approach...');
        
        // Try to insert a new task with archive fields to see what happens
        console.log('5️⃣ Testing task insertion with archive fields...');
        const { data: insertTest, error: insertError } = await supabase
          .from('tasks')
          .insert([{
            title: 'Archive Test Task',
            description: 'Test task to check archive fields',
            status: 'Done',
            deadline: '2024-12-31',
            priority: 'Low',
            assigned_to_id: testTask.assigned_to_id || 'emp1',
            assigned_by_id: testTask.assigned_by_id || 'emp1',
            allocated_time_in_seconds: 3600,
            time_spent_seconds: 3600,
            archived: false,
            archived_at: null,
            completed_at: new Date().toISOString()
          }])
          .select()
          .single();
        
        if (insertError) {
          console.error('❌ Error inserting test task:', insertError);
          console.log('💡 This suggests the archive columns do not exist in the database.');
          console.log('');
          console.log('📝 SOLUTION: Please add the archive columns to your Supabase database.');
          console.log('   Go to your Supabase dashboard > SQL Editor and run:');
          console.log('');
          console.log('   ALTER TABLE tasks ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;');
          console.log('   ALTER TABLE tasks ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;');
          console.log('   ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;');
          console.log('');
        } else {
          console.log('✅ Archive columns exist and working!', insertTest);
          
          // Clean up test task
          await supabase
            .from('tasks')
            .delete()
            .eq('id', insertTest.id);
          console.log('🧹 Cleaned up test task');
        }
      } else {
        console.log('📊 Table schema:', schemaData);
      }
      
      return;
    }

    console.log('✅ Archive update successful!');
    console.log('📊 Updated task:', {
      id: updatedTask.id,
      title: updatedTask.title,
      archived: updatedTask.archived,
      archived_at: updatedTask.archived_at
    });
    
    // Test unarchiving
    console.log('6️⃣ Testing unarchive...');
    const { data: unarchivedTask, error: unarchiveError } = await supabase
      .from('tasks')
      .update({ 
        archived: false,
        archived_at: null
      })
      .eq('id', testTask.id)
      .select('*')
      .single();

    if (unarchiveError) {
      console.error('❌ Error unarchiving task:', unarchiveError);
    } else {
      console.log('✅ Unarchive successful!');
      console.log('📊 Unarchived task:', {
        id: unarchivedTask.id,
        title: unarchivedTask.title,
        archived: unarchivedTask.archived,
        archived_at: unarchivedTask.archived_at
      });
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the debug
debugArchive().then(() => {
  console.log('\n🏁 Debug finished');
  process.exit(0);
}).catch(error => {
  console.error('💥 Debug script failed:', error);
  process.exit(1);
});
