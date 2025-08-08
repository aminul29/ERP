# ERP System Troubleshooting Guide

This document contains common errors encountered during development and their proven solutions. Use this as a quick reference to resolve similar issues across different features.

## Table of Contents
1. [Database Integration Errors](#database-integration-errors)
2. [React Component Errors](#react-component-errors)
3. [TypeScript Type Errors](#typescript-type-errors)
4. [Supabase-Specific Issues](#supabase-specific-issues)
5. [Real-time Subscription Issues](#real-time-subscription-issues)
6. [UI/UX Component Issues](#uiux-component-issues)

---

## Database Integration Errors

### ❌ Error: `TypeError: onDeleteTask is not a function`

**Problem**: Component prop function is undefined when called, causing runtime error.

**Symptoms**:
```
TaskManagement.tsx:280 Uncaught TypeError: onDeleteTask is not a function
```

**Root Cause**: Missing prop in parent component when passing functions to child components.

**Solution**:
```typescript
// ❌ Incorrect - Missing onDeleteTask prop
<TaskManagement 
  tasks={tasks} 
  onAddTask={handleAddTask} 
  onEditTask={handleEditTask} 
  onUpdateTask={handleUpdateTask} 
  onRateTask={handleRateTask} 
/>

// ✅ Correct - Include all required props
<TaskManagement 
  tasks={tasks} 
  onAddTask={handleAddTask} 
  onEditTask={handleEditTask} 
  onUpdateTask={handleUpdateTask} 
  onDeleteTask={handleDeleteTask}  // ← Added missing prop
  onRateTask={handleRateTask} 
/>
```

**Prevention**: Always check component interfaces/props and ensure all required functions are passed from parent components.

**Applies to**: Projects, Clients, Approvals, and any component using callback functions.

---

### ❌ Error: `22P02 - invalid input syntax for type integer`

**Problem**: Sending decimal/float values to database columns expecting integers.

**Symptoms**:
```
{code: '22P02', details: null, hint: null, message: 'invalid input syntax for type integer: "1087.217"'}
```

**Root Cause**: JavaScript time calculations (milliseconds ÷ 1000) produce decimals, but database expects integers.

**Solution**:
```typescript
// ❌ Incorrect - Sends decimal
const elapsedSeconds = (new Date().getTime() - new Date(startTime).getTime()) / 1000;

// ✅ Correct - Round to integer  
const elapsedSeconds = Math.round((new Date().getTime() - new Date(startTime).getTime()) / 1000);

// Also fix in database operations:
// ❌ Incorrect
time_spent_seconds: task.timeSpentSeconds || 0,

// ✅ Correct
time_spent_seconds: Math.round(task.timeSpentSeconds || 0),
```

**Prevention**: Always use `Math.round()`, `Math.floor()`, or `Math.ceil()` when sending numeric values to integer database columns.

**Applies to**: Any feature involving time tracking, counters, or numeric calculations.

---

### ❌ Error: `400 Bad Request` from Supabase

**Problem**: Supabase API request fails due to malformed data or missing headers.

**Symptoms**:
```
https://xxx.supabase.co/rest/v1/tasks?id=eq.xxx 400 (Bad Request)
```

**Root Cause**: Usually caused by:
- Invalid JSON body
- Missing `Content-Type: application/json` header
- Schema mismatch between frontend and database

**Solution**:
```typescript
// ✅ Ensure proper data structure matches database schema
const insertData = {
  title: task.title,                    // string
  time_spent_seconds: Math.round(task.timeSpentSeconds || 0), // integer
  assigned_to_id: task.assignedToId,   // valid UUID
  status: task.status,                  // enum value
  // ... other fields
};

// ✅ Supabase operations should include .select()
const { data, error } = await supabase
  .from('tasks')
  .update(insertData)
  .eq('id', taskId)
  .select()    // ← Important: ensures data is returned
  .single();
```

**Prevention**: 
- Validate data types before sending to database
- Always use `.select()` after `.insert()` or `.update()`
- Check database schema matches frontend expectations

**Applies to**: All database operations across Projects, Clients, Tasks, etc.

---

### ❌ Error: `Failed to update task - no data returned`

**Problem**: Database operation appears successful but returns null/undefined.

**Symptoms**:
```
Failed to update task - no data returned
console.error @ App.tsx:1179
```

**Root Cause**: Missing `.select()` in Supabase query or invalid filter conditions.

**Solution**:
```typescript
// ❌ Incorrect - No .select()
const { data, error } = await supabase
  .from('tasks')
  .update(updateData)
  .eq('id', taskId);

// ✅ Correct - Include .select()
const { data, error } = await supabase
  .from('tasks')
  .update(updateData)
  .eq('id', taskId)
  .select()
  .single();

// ✅ Also verify the ID exists
console.log('Updating task with ID:', taskId);
```

**Prevention**: 
- Always add `.select()` after database mutations
- Log IDs to verify they're valid UUIDs
- Add error handling for cases where no rows are affected

**Applies to**: All CRUD operations across the entire system.

---

### ❌ Error: Database column name mismatch

**Problem**: Database operations fail due to incorrect column names in SQL queries.

**Symptoms**:
```
column "allocated_time_seconds" of relation "tasks" does not exist
column "allocated_time_seconds" of relation "projects" does not exist
```

**Root Cause**: Database schema uses different column names than what's coded in the application.

**Solution**:
```typescript
// ❌ Incorrect - Missing "_in_" in column name
allocated_time_seconds: task.allocatedTimeInSeconds,

// ✅ Correct - Match exact database column name
allocated_time_in_seconds: task.allocatedTimeInSeconds,

// Always verify database schema:
// Database Column Name    →  JavaScript Property
// allocated_time_in_seconds → allocatedTimeInSeconds
// client_id              → clientId  
// assigned_to_id         → assignedToId
// created_by_id          → createdById
```

**Common Mismatches**:
- `allocated_time_seconds` ❌ → `allocated_time_in_seconds` ✅
- `time_spent` ❌ → `time_spent_seconds` ✅  
- `assignedTo` ❌ → `assigned_to_id` ✅
- `clientId` (in code) ❌ → `client_id` (in database) ✅

**Prevention**: 
- Always check actual database column names before coding
- Use database inspection tools to verify schema
- Create a mapping reference between JS properties and DB columns

**Applies to**: All database operations across Tasks, Projects, Clients, etc.

---

### ❌ Error: Invalid UUID format for foreign keys

**Problem**: Attempting to use hardcoded IDs (like 'cli1', 'proj1', 'internal-webwizbd') in database columns expecting UUID format.

**Symptoms**:
```
invalid input syntax for type uuid: "cli1"
invalid input syntax for type uuid: "internal-webwizbd"
invalid input syntax for type uuid: "proj1"
Foreign key constraint violation
```

**Root Cause**: Database uses UUID primary keys, but application is sending localStorage-based legacy IDs, hardcoded strings, or special placeholder values.

**Solution**:
```typescript
// ❌ Incorrect - Using hardcoded legacy IDs
const task = {
  clientId: 'cli1',                    // Invalid UUID
  clientId: 'internal-webwizbd',       // Invalid UUID
  projectId: 'proj1',                  // Invalid UUID
  assignedToId: 'emp1'                 // Invalid UUID
};

// ✅ Correct - Validate and convert IDs
const validateUUID = (id: string | undefined | null): string | null => {
  if (!id || id.trim() === '') return null;
  
  // Check for hardcoded legacy patterns
  if (/^(cli|proj|emp|task|notif|att|sal|log)\d+$/.test(id)) {
    console.warn(`Converting hardcoded ID '${id}' to null`);
    return null;  // Let database handle as optional
  }
  
  // Check for special hardcoded values
  if (['internal-webwizbd', 'internal', 'webwizbd'].includes(id)) {
    console.warn(`Converting special client ID '${id}' to null`);
    return null;  // Should use real client UUID from database
  }
  
  // Basic UUID format validation
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    console.warn(`Invalid UUID format '${id}', converting to null`);
    return null;
  }
  
  return id;
};

// Usage in database operations
const insertData = {
  title: task.title,
  client_id: validateUUID(task.clientId),     // Validates UUID or converts to null
  project_id: validateUUID(task.projectId),   // Validates UUID or converts to null
  assigned_to_id: task.assignedToId,          // Should be valid from database-loaded teammates
};
```

**Migration Strategy for Legacy Data**:
```typescript
// When migrating from localStorage to database:
// 1. Load existing localStorage data
const legacyClients = loadState('erp_clients', []);

// 2. Create database entries and get real UUIDs
for (const legacyClient of legacyClients) {
  const dbClient = await DatabaseOperations.createClient({
    name: legacyClient.name,
    contactPerson: legacyClient.contactPerson,
    email: legacyClient.email,
    phone: legacyClient.phone
  });
  
  // 3. Map legacy ID to new UUID for reference
  idMappings[legacyClient.id] = dbClient.id;
}

// 4. Use mappings when creating related records
const realClientId = idMappings[legacyTask.clientId] || null;

// 5. Handle special internal clients
if (task.clientId === 'internal-webwizbd') {
  // Find or create internal client in database
  const internalClient = await DatabaseOperations.getInternalClient() || 
    await DatabaseOperations.createClient({
      name: 'WebWizBD',
      contactPerson: 'Internal Team',
      email: 'internal@webwizbd.com',
      phone: '+1234567890',
      isInternal: true
    });
  task.clientId = internalClient.id;
}
```

**Prevention**:
- Always use database-generated UUIDs for foreign key relationships
- Implement UUID validation before database operations
- Migrate legacy data to proper UUID format before production
- Use optional foreign keys (nullable) when relationships might not exist
- Create proper database records for special clients (like "Internal")

**Applies to**: All foreign key relationships across Tasks, Projects, Clients, Assignments, etc.

---

## React Component Errors

### ❌ Error: Missing delete button in mobile view

**Problem**: Feature works in desktop view but missing in mobile responsive design.

**Root Cause**: Inconsistent component structure between desktop and mobile layouts.

**Solution**:
```tsx
{/* ✅ Ensure both desktop AND mobile views have the same functionality */}

{/* Desktop View */}
{isManager && (
  <>
    <button onClick={() => handleEdit(item)}>Edit</button>
    <button onClick={() => handleDelete(item)}>Delete</button>
  </>
)}

{/* Mobile View - Must include same functionality */}
{isManager && (
  <>
    <button onClick={() => handleEdit(item)}>Edit</button>
    <button onClick={() => handleDelete(item)}>Delete</button>  {/* ← Don't forget! */}
  </>
)}
```

**Prevention**: Always implement features in both desktop and mobile views simultaneously.

**Applies to**: All responsive components across the system.

---

### ❌ Error: Modal doesn't open or close properly

**Problem**: Modal state management issues causing UI to appear broken.

**Root Cause**: Missing state handlers or incorrect state initialization.

**Solution**:
```typescript
// ✅ Complete modal state management
const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
const [itemToDelete, setItemToDelete] = useState<Item | null>(null);

const handleOpenDeleteModal = (item: Item) => {
  setItemToDelete(item);
  setIsDeleteModalOpen(true);
};

const handleCloseDeleteModal = () => {
  setIsDeleteModalOpen(false);
  setItemToDelete(null);  // ← Important: reset item
};

const handleConfirmDelete = () => {
  if (itemToDelete) {
    onDeleteItem(itemToDelete.id);
    handleCloseDeleteModal();  // ← Close after action
  }
};
```

**Prevention**: Always create complete handler triplets for modals (open, close, confirm).

**Applies to**: All modal dialogs across Projects, Clients, Approvals, etc.

---

## TypeScript Type Errors

### ❌ Error: `Property 'onDeleteTask' does not exist on type`

**Problem**: Missing prop in TypeScript interface definition.

**Solution**:
```typescript
// ✅ Add missing prop to interface
interface TaskManagementProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onEditTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;  // ← Add missing prop
  onRateTask: (taskId: string, rating: number) => void;
}
```

**Prevention**: Update interfaces whenever adding new functionality.

**Applies to**: All component interfaces across the system.

---

## Supabase-Specific Issues

### ❌ Error: Real-time subscriptions not working

**Problem**: Changes in database don't reflect in UI immediately.

**Root Cause**: Subscription not properly configured or component not re-rendering.

**Solution**:
```typescript
// ✅ Proper real-time subscription setup
useEffect(() => {
  if (!dataLoaded) return;  // Wait for initial data load
  
  const subscription = supabase
    .channel('table-changes')
    .on('postgres_changes', {
      event: '*',  // Listen to INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'tasks'
    }, (payload) => {
      console.log('Real-time change:', payload);
      
      // Handle different event types
      if (payload.eventType === 'INSERT') {
        const newItem = mapDatabaseItem(payload.new);
        setItems(prev => [newItem, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        const updatedItem = mapDatabaseItem(payload.new);
        setItems(prev => prev.map(item => 
          item.id === updatedItem.id ? updatedItem : item
        ));
      } else if (payload.eventType === 'DELETE') {
        setItems(prev => prev.filter(item => item.id !== payload.old.id));
      }
    })
    .subscribe();
    
  return () => subscription.unsubscribe();  // ← Important: cleanup
}, [dataLoaded]);
```

**Prevention**: Always implement proper cleanup and wait for initial data load.

**Applies to**: All features using real-time data synchronization.

---

### ❌ Error: Notifications not showing after creation

**Problem**: New notifications are created in database but don't appear in the notification UI panel.

**Symptoms**:
```
Notification created successfully in database
Notification count shows 0 in header
Notification panel is empty
```

**Root Cause**: Usually caused by:
- User ID mismatch between current user and notification target user
- Missing real-time subscription for notifications table
- Incorrect filtering logic in notification display component
- Missing `link` property causing notifications to be filtered out

**Solution**:
```typescript
// ✅ Ensure user IDs match when creating notifications
const currentUser = getCurrentUser(); // Should return database UUID
const notification = {
  user_id: currentUser.id,     // Must be valid UUID from database
  title: 'New Task Assigned',
  message: 'You have been assigned a new task',
  link: 'tasks',              // ← Required: must have valid link
  is_read: false,
  timestamp: new Date().toISOString()
};

// ✅ Add debugging to notification filtering
const filteredNotifications = useMemo(() => {
  console.log('Current user ID:', currentUser?.id);
  console.log('All notifications:', notifications);
  const filtered = notifications.filter(n => n.userId === currentUser?.id);
  console.log('Filtered notifications:', filtered);
  return filtered;
}, [notifications, currentUser?.id]);

// ✅ Ensure real-time subscription updates notifications
useEffect(() => {
  const subscription = supabase
    .channel('notifications-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'notifications'
    }, (payload) => {
      if (payload.eventType === 'INSERT') {
        const newNotification = mapNotification(payload.new);
        setNotifications(prev => [newNotification, ...prev]);
      }
    })
    .subscribe();
  
  return () => subscription.unsubscribe();
}, []);
```

**Prevention**:
- Always use database UUIDs for user references
- Include required `link` property in all notifications
- Implement real-time subscriptions for immediate updates
- Add debug logging to notification filtering logic

**Applies to**: All notification-related features across teammates, tasks, projects, approvals.

---

### ❌ Error: "Mark all as read" button not working

**Problem**: Clicking "Mark all as read" doesn't update notification status or throws database errors.

**Symptoms**:
```
PostgreSQL error: column "timestamp" does not exist
mark-all-as-read operation failed
Notifications remain unread after clicking button
```

**Root Cause**: Database update operation tries to modify non-existent columns or uses incorrect column names.

**Solution**:
```typescript
// ❌ Incorrect - Trying to update non-existent columns
const { error } = await supabase
  .from('notifications')
  .update({
    is_read: true,
    timestamp: new Date().toISOString()  // ← Column doesn't exist
  })
  .eq('user_id', userId)
  .eq('is_read', false);

// ✅ Correct - Only update existing columns
const { error } = await supabase
  .from('notifications')
  .update({
    is_read: true,
    // Don't try to update timestamp/created_at - it's auto-managed
  })
  .eq('user_id', userId)
  .eq('is_read', false)
  .select();  // ← Important: return updated data

// ✅ Add proper error handling and state updates
const handleMarkAllAsRead = async () => {
  try {
    const { data, error } = await DatabaseOperations.markAllNotificationsAsRead(currentUser.id);
    if (error) throw error;
    
    // Update local state
    setNotifications(prev => prev.map(n => 
      n.userId === currentUser.id ? { ...n, isRead: true } : n
    ));
    
    console.log('Marked all notifications as read successfully');
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
  }
};
```

**Prevention**:
- Verify database schema before implementing update operations
- Don't try to manually update auto-managed timestamp columns
- Always include `.select()` in update operations
- Implement proper error handling for all database operations

**Applies to**: All batch update operations across notifications, tasks, projects.

---

### ❌ Error: Real-time updates causing duplicate data

**Problem**: Real-time subscriptions add duplicate entries when multiple tabs are open or operations are performed.

**Symptoms**:
```
Duplicate notifications in notification panel
Same task appears multiple times in task list
Inconsistent data across different UI components
```

**Root Cause**: Real-time subscription handlers don't check for existing data before adding new items.

**Solution**:
```typescript
// ❌ Incorrect - Adds duplicates
useEffect(() => {
  const subscription = supabase
    .channel('tasks-changes')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'tasks'
    }, (payload) => {
      const newTask = mapTask(payload.new);
      setTasks(prev => [newTask, ...prev]);  // ← Can create duplicates
    })
    .subscribe();
}, []);

// ✅ Correct - Prevent duplicates
useEffect(() => {
  const subscription = supabase
    .channel('tasks-changes')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'tasks'
    }, (payload) => {
      const newTask = mapTask(payload.new);
      setTasks(prev => {
        // Check if task already exists
        if (prev.some(task => task.id === newTask.id)) {
          console.log('Task already exists, skipping duplicate:', newTask.id);
          return prev;
        }
        return [newTask, ...prev];
      });
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'tasks'
    }, (payload) => {
      const updatedTask = mapTask(payload.new);
      setTasks(prev => prev.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      ));
    })
    .subscribe();
    
  return () => subscription.unsubscribe();
}, []);
```

**Prevention**:
- Always check for existing items before adding in real-time handlers
- Use unique keys for React list rendering
- Implement proper deduplication logic
- Test real-time updates with multiple browser tabs

**Applies to**: All real-time features across tasks, projects, notifications, teammates.

---

### ❌ Error: Data mapper mismatches causing undefined values

**Problem**: Database fields don't map correctly to TypeScript objects, causing undefined or null values in UI.

**Symptoms**:
```
allocatedTimeInSeconds is undefined
timeSpentSeconds shows as 0 when it should have a value
Task time tracking displays incorrectly
```

**Root Cause**: Mapper functions use incorrect database column names that don't match the actual schema.

**Solution**:
```typescript
// ❌ Incorrect - Wrong column name
export const mapTask = (row: any): Task => ({
  id: row.id,
  title: row.title,
  allocatedTimeInSeconds: row.allocated_time_seconds,  // ← Wrong column name
  timeSpentSeconds: row.time_spent_seconds,
  // ... other fields
});

// ✅ Correct - Match exact database schema
export const mapTask = (row: any): Task => ({
  id: row.id,
  title: row.title,
  allocatedTimeInSeconds: row.allocated_time_in_seconds,  // ← Correct column name
  timeSpentSeconds: row.time_spent_seconds,
  // ... other fields
});

// ✅ Add validation and fallbacks
export const mapTask = (row: any): Task => ({
  id: row.id,
  title: row.title || 'Untitled Task',
  allocatedTimeInSeconds: row.allocated_time_in_seconds || 0,
  timeSpentSeconds: row.time_spent_seconds || 0,
  status: row.status || 'pending',
  assignedToId: row.assigned_to_id || null,
  clientId: row.client_id || null,
  projectId: row.project_id || null,
  createdAt: row.created_at || new Date().toISOString(),
  // ... ensure all fields have fallbacks
});
```

**Database Column Reference**:
```
// Common column name patterns:
Database Column          → TypeScript Property
allocated_time_in_seconds → allocatedTimeInSeconds
time_spent_seconds       → timeSpentSeconds
assigned_to_id           → assignedToId
created_by_id            → createdById
client_id                → clientId
project_id               → projectId
is_read                  → isRead
created_at               → createdAt
updated_at               → updatedAt
```

**Prevention**:
- Always verify database column names before creating mappers
- Add fallback values for all mapped properties
- Test mappers with actual database data
- Use database inspection tools to confirm schema

**Applies to**: All data mapping across tasks, projects, clients, notifications, teammates.

---

## UI/UX Component Issues

### ❌ Error: Buttons disabled when they shouldn't be

**Problem**: UI elements appear disabled due to incorrect conditional logic.

**Root Cause**: Complex boolean logic or missing edge cases.

**Solution**:
```typescript
// ❌ Complex, hard to debug
disabled={isPending || (task.status === 'done' && !isManager) || !canEdit}

// ✅ Clear, debuggable logic
const shouldDisableButton = useMemo(() => {
  if (isPending) return true;
  if (task.status === 'done' && !isManager) return true;
  if (!canEdit) return true;
  return false;
}, [isPending, task.status, isManager, canEdit]);

// Usage
disabled={shouldDisableButton}
```

**Prevention**: Extract complex conditional logic into named variables or `useMemo`.

**Applies to**: All conditional UI rendering across the system.

---

## Error Prevention Checklist

When implementing new features, use this checklist:

### ✅ Database Operations
- [ ] All props are passed from parent to child components
- [ ] Interface types include all required props
- [ ] Numeric values are rounded before sending to integer columns
- [ ] All database operations include `.select()` 
- [ ] Real-time subscriptions are properly configured
- [ ] Database schema matches frontend expectations
- [ ] Column names match exactly (e.g., `allocated_time_in_seconds` not `allocated_time_seconds`)
- [ ] Foreign key IDs are valid UUIDs or null (not hardcoded strings like 'cli1')
- [ ] UUID validation is implemented for all foreign key relationships
- [ ] Legacy localStorage data is properly migrated to database format

### ✅ Component Development  
- [ ] Both desktop and mobile views include same functionality
- [ ] Modal state management is complete (open, close, reset)
- [ ] Complex conditional logic is extracted into named variables
- [ ] All useEffect hooks have proper cleanup functions
- [ ] Error handling is implemented for all async operations

### ✅ Testing
- [ ] Test in both desktop and mobile views
- [ ] Test with different user roles and permissions
- [ ] Test edge cases (empty data, network errors, etc.)
- [ ] Verify real-time updates work across browser tabs
- [ ] Check browser console for any warnings or errors

---

## Quick Debug Commands

When troubleshooting, use these commands:

```bash
# Check current working directory and files
pwd && ls -la

# Search for specific error patterns
grep -r "onDeleteTask" components/
grep -r "Math.round" lib/

# Find all TypeScript interfaces
grep -r "interface.*Props" components/

# Check for missing database operations
grep -r "select()" lib/db-operations.ts
```

---

### ❌ Error: Missing database column for new features

**Problem**: New feature fields are not saving to database due to missing columns in database schema.

**Symptoms**:
```
column "drive_link" of relation "tasks" does not exist
Bad Request: Unknown column name in database operation
Feature data not persisting after page refresh
```

**Root Cause**: Database schema is not updated to include new columns added in application code.

**Solution**:
```sql
-- Check if column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position;

-- Add missing column if needed
ALTER TABLE tasks ADD COLUMN drive_link TEXT;

-- Verify database operations match schema
-- ❌ Incorrect - Column doesn't exist yet
const insertData = {
  title: task.title,
  drive_link: task.driveLink  // Column doesn't exist in database
};

-- ✅ Correct - After adding column to database
const insertData = {
  title: task.title,
  drive_link: task.driveLink  // Now supported in database
};
```

**Database Schema Management**:
```typescript
// In db-operations.ts, ensure all fields match database columns
export const createTask = async (task: Omit<Task, 'id'>) => {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: task.title,
      description: task.description,
      // ... other existing fields
      drive_link: task.driveLink,           // ← New field
      work_experience: task.workExperience, // ← New field
      suggestions: task.suggestions,        // ← New field
      completion_files: task.completionFiles || []
    })
    .select()
    .single();
    
  if (error) throw error;
  return mapTask(data);
};

// Update mapper to handle new fields
export const mapTask = (row: any): Task => ({
  id: row.id,
  title: row.title,
  // ... other existing fields
  driveLink: row.drive_link || undefined,
  workExperience: row.work_experience || undefined,
  suggestions: row.suggestions || undefined,
  completionFiles: row.completion_files || []
});
```

**Prevention**:
- Always update database schema before deploying new features
- Check schema file (`database/schema.sql`) matches actual database
- Test database operations in development before production
- Use database migrations for schema changes
- Verify all columns exist before adding them to code

**Common New Feature Columns**:
```sql
-- Task completion features
ALTER TABLE tasks ADD COLUMN drive_link TEXT;
ALTER TABLE tasks ADD COLUMN work_experience VARCHAR(50);
ALTER TABLE tasks ADD COLUMN suggestions TEXT;

-- Project features
ALTER TABLE projects ADD COLUMN completion_notes TEXT;
ALTER TABLE projects ADD COLUMN client_feedback TEXT;
```

**Applies to**: All new feature development requiring database schema changes.

---

### ❌ Error: File upload replaced with link input not working

**Problem**: UI changed from file upload to link input but form validation or submission is still expecting files.

**Symptoms**:
```
Google Drive link not saving to database
Form validation errors about missing files
Submit button disabled when link is provided
```

**Root Cause**: Form handling code still validates or processes file uploads instead of link input.

**Solution**:
```typescript
// ❌ Incorrect - Still handling file uploads
const handleSubmit = () => {
  if (!completionFiles || completionFiles.length === 0) {
    setError('Please upload completion files');
    return;
  }
  
  const formData = {
    accomplishments,
    workExperience,
    suggestions,
    attachedFiles: completionFiles  // Still expecting files
  };
};

// ✅ Correct - Handle Google Drive link
const handleSubmit = () => {
  if (!driveLink || driveLink.trim() === '') {
    setError('Please provide a Google Drive link');
    return;
  }
  
  const formData = {
    accomplishments,
    workExperience,
    suggestions,
    driveLink: driveLink.trim()  // Handle link instead
  };
};

// Update UI to show link instead of files
{/* ❌ Incorrect - Still showing file list */}
{completionFiles && completionFiles.length > 0 && (
  <div>
    <h4>Attached Files:</h4>
    <ul>{completionFiles.map(file => <li key={file}>{file}</li>)}</ul>
  </div>
)}

{/* ✅ Correct - Show clickable Google Drive link */}
{driveLink && (
  <div>
    <h4>Google Drive Link:</h4>
    <a href={driveLink} target="_blank" rel="noopener noreferrer" 
       className="text-blue-600 hover:underline">
      {driveLink.length > 50 ? `${driveLink.substring(0, 50)}...` : driveLink}
    </a>
  </div>
)}
```

**Prevention**:
- Update all form validation logic when changing input types
- Test form submission with new input format
- Update display components to match new data structure
- Ensure database operations handle new field names

**Applies to**: Any UI changes from file uploads to text/link inputs across all features.

---

### ❌ Error: Unauthorized users can access restricted functionality

**Problem**: UI buttons and controls are visible to users who shouldn't have access to them, leading to security concerns or unintended actions.

**Symptoms**:
```
Non-assigned users can see Start/Pause/Done buttons for tasks
Managers can control task timers for tasks not assigned to them
Security controls are too permissive
```

**Root Cause**: Role-based access control logic is too broad or incorrectly implemented in conditional rendering.

**Solution**:
```typescript
// ❌ Incorrect - Too permissive access control
{(currentUser.id === task.assignedToId || isManager) && (
  <>
    <button onClick={() => handleTimerAction('start')}>Start</button>
    <button onClick={() => handleTimerAction('pause')}>Pause</button>
    <button onClick={() => handleMarkAsDone()}>Done</button>
  </>
)}

// ✅ Correct - Restrict to assigned teammate and CEO only
{(currentUser.id === task.assignedToId || isCeo) && (
  <>
    <button onClick={() => handleTimerAction('start')}>Start</button>
    <button onClick={() => handleTimerAction('pause')}>Pause</button>
    <button onClick={() => handleMarkAsDone()}>Done</button>
  </>
)}

// ✅ Define clear role hierarchies
const isCeo = currentUser.role === 'CEO';
const isManager = ['HR and Admin', 'CEO', 'Lead Web Developer', 'SMM and Design Lead', 'Sales and PR Lead', 'Lead SEO Expert'].includes(currentUser.role);
const isAssignedUser = currentUser.id === task.assignedToId;

// ✅ Use specific permissions for specific actions
const canControlTimer = isAssignedUser || isCeo;  // Only assigned user or CEO
const canEditTask = isManager;                     // Any manager can edit
const canDeleteTask = isCeo;                       // Only CEO can delete
const canViewTask = isManager || isAssignedUser;   // Managers or assigned user

{canControlTimer && (
  <div className="timer-controls">
    {/* Timer buttons only for assigned user or CEO */}
  </div>
)}

{canEditTask && (
  <button onClick={handleEdit}>Edit Task</button>
)}
```

**Security Best Practices**:
```typescript
// ✅ Always validate permissions on both frontend AND backend
const handleTimerAction = async (action) => {
  // Frontend validation
  if (!canControlTimer) {
    console.warn('Unauthorized timer action attempt');
    return;
  }
  
  // Backend should also validate permissions
  const result = await DatabaseOperations.updateTask(task, {
    userId: currentUser.id,
    action: action
  });
};

// ✅ Log security-related actions
const auditLog = {
  userId: currentUser.id,
  action: 'timer_start',
  taskId: task.id,
  timestamp: new Date().toISOString(),
  authorized: canControlTimer
};
console.log('Security audit:', auditLog);

// ✅ Use consistent permission checking across components
const useTaskPermissions = (task: Task, currentUser: Teammate) => {
  return {
    canControlTimer: currentUser.id === task.assignedToId || currentUser.role === 'CEO',
    canEdit: ['HR and Admin', 'CEO', 'Lead Web Developer', 'SMM and Design Lead', 'Sales and PR Lead', 'Lead SEO Expert'].includes(currentUser.role),
    canDelete: currentUser.role === 'CEO',
    canView: ['HR and Admin', 'CEO', 'Lead Web Developer', 'SMM and Design Lead', 'Sales and PR Lead', 'Lead SEO Expert'].includes(currentUser.role) || currentUser.id === task.assignedToId
  };
};
```

**Prevention**:
- Always use principle of least privilege - grant minimum necessary permissions
- Create reusable permission checking functions
- Validate permissions on both frontend and backend
- Log security-related actions for audit trails
- Test with different user roles to ensure correct access control
- Document permission requirements clearly in code comments

**Common Permission Patterns**:
```typescript
// Task timer controls: Only assigned user or CEO
const canControlTimer = currentUser.id === task.assignedToId || currentUser.role === 'CEO';

// Task editing: Any manager
const canEditTask = isManager;

// Task deletion: CEO only
const canDeleteTask = currentUser.role === 'CEO';

// Task viewing: Managers or assigned user
const canViewTask = isManager || currentUser.id === task.assignedToId;

// Salary management: HR and CEO only
const canManageSalaries = ['HR and Admin', 'CEO'].includes(currentUser.role);

// Performance ratings: Task assigner or CEO
const canRateTask = currentUser.id === task.assignedById || currentUser.role === 'CEO';
```

**Applies to**: All role-based functionality across tasks, projects, user management, and administrative features.

---

**Last Updated**: January 2025  
**Applies to**: Task Management, Project Management, Client Management, Approval Management, and all future features

---

*This document should be updated whenever new error patterns are discovered and resolved.*
