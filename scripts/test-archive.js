import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://pgrsoyyytmgdztuwbluo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncnNveXl5dG1nZHp0dXdibHVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5MDMxMjgsImV4cCI6MjA0OTQ3OTEyOH0.Oa97EJq-YOVpS49NL4NkNJvgaXGLqIw9mV6sQ4b7dKk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testArchive() {
  console.log('🧪 Testing archive functionality...');

  try {
    // Get a completed task
    console.log('🔍 Looking for completed tasks...');
    const { data: tasks, error: fetchError } = await supabase
      .from('tasks')
      .select('id, title, status, archived')
      .in('status', ['Completed', 'Done'])
      .limit(3);

    if (fetchError) {
      console.error('❌ Error fetching tasks:', fetchError);
      return;
    }

    if (!tasks || tasks.length === 0) {
      console.log('⚠️ No completed tasks found to test with');
      return;
    }

    console.log(`📋 Found ${tasks.length} completed task(s):`);
    tasks.forEach(task => {
      console.log(`  - ${task.title} (${task.status}) - Archived: ${task.archived || false}`);
    });

    // Test archiving the first task
    const testTask = tasks[0];
    console.log(`\n📦 Testing archive functionality with task: "${testTask.title}"`);

    const newArchivedState = !testTask.archived;
    console.log(`🔄 Setting archived to: ${newArchivedState}`);

    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update({ 
        archived: newArchivedState,
        archived_at: newArchivedState ? new Date().toISOString() : null
      })
      .eq('id', testTask.id)
      .select('id, title, archived, archived_at')
      .single();

    if (updateError) {
      console.error('❌ Error updating task:', updateError);
      
      if (updateError.message.includes('column "archived" does not exist')) {
        console.log('\n💡 SOLUTION: The archived column does not exist in the database.');
        console.log('   Please run this SQL in your Supabase dashboard SQL editor:');
        console.log('\n   ALTER TABLE tasks ADD COLUMN archived BOOLEAN DEFAULT false;');
        console.log('   ALTER TABLE tasks ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;');
        console.log('   ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;');
      }
      
      return;
    }

    if (updatedTask) {
      console.log('✅ Archive functionality is working!');
      console.log(`📊 Task "${updatedTask.title}" updated:`);
      console.log(`   - Archived: ${updatedTask.archived}`);
      console.log(`   - Archived at: ${updatedTask.archived_at || 'N/A'}`);
      
      // Test retrieving with archive status
      console.log('\n🔍 Testing filtered retrieval...');
      const { data: archivedTasks, error: archivedError } = await supabase
        .from('tasks')
        .select('id, title, archived')
        .eq('archived', true)
        .limit(3);

      if (archivedError) {
        console.error('❌ Error fetching archived tasks:', archivedError);
      } else {
        console.log(`📦 Found ${archivedTasks?.length || 0} archived tasks`);
      }

    } else {
      console.error('❌ No data returned from update');
    }

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run the test
testArchive().then(() => {
  console.log('\n🏁 Test finished');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});
