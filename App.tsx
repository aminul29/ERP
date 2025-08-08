
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Client, Teammate, Project, Task, TimeLog, Salary, Notification, Attendance, TaskStatus, TaskPriority, SalaryStatus, AttendanceStatus, ErpSettings, Theme, ColorScheme, PendingUpdate, ProjectPendingUpdate, TaskPendingUpdate, TeammatePendingUpdate, Comment, ProjectAcceptanceStatus, ProjectAcceptance } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { TeammateManagement } from './components/TeammateManagement';
import { ProjectManagement } from './components/ProjectManagement';
import { TaskManagement } from './components/TaskManagement';
import { TimeTracking } from './components/TimeTracking';
import { SalaryManagement } from './components/SalaryManagement';
import { ClientManagement } from './components/ClientManagement';
import { AttendanceManagement } from './components/AttendanceManagement';
import { Profile } from './components/Profile';
import { Login } from './components/Login';
import { ErpSettings as ErpSettingsComponent } from './components/ErpSettings';
import { ApprovalManagement } from './components/ApprovalManagement';
import { PerformanceEvaluation } from './components/PerformanceEvaluation';
import { ProjectDetail } from './components/ProjectDetail';
import { TaskDetail } from './components/TaskDetail';
import { ToastContainer } from './components/ToastContainer';
import { DatabaseOperations } from './lib/db-operations';
import { loadFromDatabase, initializeDatabase } from './lib/db-service';
import { supabase } from './lib/supabase';
import { COLOR_PALETTES, CHART_COLORS } from './constants';

// --- SEED DATA (used as fallback) ---
const initialTeammates: Teammate[] = [
  { id: 'emp1', name: 'Md. Aminul islam', role: 'CEO', joinDate: '2022-01-15', salary: 200000, approved: true, email: 'iislamaminul@gmail.com', phone: '111-111-1111', password: 'password123' },
  { id: 'emp2', name: 'Md. Al-Amin', role: 'HR and Admin', joinDate: '2022-02-10', salary: 70000, approved: true, email: 'akhalifa@webwizbd.com', phone: '222-222-2222', password: 'password123' },
  { id: 'emp3', name: 'Madhabi Baral', role: 'SMM and Design Lead', joinDate: '2023-01-05', salary: 65000, approved: true, email: 'design.lead@webwizbd.com', phone: '333-333-3333', password: 'password123' },
  { id: 'emp4', name: 'Sohel Mazumder', role: 'Sales and PR Lead', joinDate: '2022-11-15', salary: 68000, approved: true, email: 'sales.pr@webwizbd.com', phone: '444-444-4444', password: 'password123' },
  { id: 'emp5', name: 'Hossain Rabbi', role: 'Lead Web Developer', joinDate: '2022-03-01', salary: 90000, approved: true, email: 'hossain.rabbi@webwizbd.com', phone: '555-555-5555', password: 'password123' },
  { id: 'emp6', name: 'Shadia Nafrin Ema', role: 'Content Writer', joinDate: '2023-06-20', salary: 55000, approved: true, email: 'nafrin.writer@webwizbd.com', phone: '666-666-6666', password: 'password123' },
  { id: 'emp7', name: 'Mohammad Mithu', role: 'Lead SEO Expert', joinDate: '2023-08-01', salary: 62000, approved: true, email: 'seo@webwizbd.com', phone: '777-777-7777', password: 'password123' },
];
const initialClients: Client[] = [
    { id: 'cli1', name: 'Innovate Inc.', contactPerson: 'John Smith', email: 'john@innovate.com', phone: '123-456-7890' },
    { id: 'cli2', name: 'Quantum Solutions', contactPerson: 'Jane Doe', email: 'jane@quantum.com', phone: '098-765-4321' },
];
const initialProjects: Project[] = [
    { id: 'proj1', name: 'InnovateSphere Platform', description: 'Developing a next-generation B2B SaaS platform for Innovate Inc. to streamline their internal workflows and customer interactions. Key features include a dynamic dashboard, user management, and reporting tools.', clientId: 'cli1', startDate: '2024-07-01', endDate: '2024-12-31', allocatedTimeInSeconds: 720000, priority: TaskPriority.High, divisions: ['Web Development', 'UI Ux Design'], teamMemberIds: ['emp1', 'emp5'], createdById: 'emp5', ratings: { assigner: 5, ceo: 5 }, acceptance: { 'emp1': { status: ProjectAcceptanceStatus.Accepted, assignedAt: '2024-07-01T09:00:00Z'}, 'emp5': { status: ProjectAcceptanceStatus.Accepted, assignedAt: '2024-07-01T09:00:00Z'} } },
    { id: 'proj2', name: 'QuantumLeap Website', description: 'Complete redesign and development of the public-facing marketing website for Quantum Solutions. The project focuses on a modern UI, fast performance, and improved SEO.', clientId: 'cli2', startDate: '2024-06-15', endDate: '2024-10-15', allocatedTimeInSeconds: 540000, priority: TaskPriority.High, divisions: ['Web Development', 'UI Ux Design', 'SEO', 'Content Writing'], teamMemberIds: ['emp3', 'emp5', 'emp6', 'emp7'], createdById: 'emp5', acceptance: { 'emp3': { status: ProjectAcceptanceStatus.Accepted, assignedAt: '2024-06-15T09:00:00Z'}, 'emp5': { status: ProjectAcceptanceStatus.Accepted, assignedAt: '2024-06-15T09:00:00Z'}, 'emp6': { status: ProjectAcceptanceStatus.Accepted, assignedAt: '2024-06-15T09:00:00Z'}, 'emp7': { status: ProjectAcceptanceStatus.Accepted, assignedAt: '2024-06-15T09:00:00Z'} } },
    { id: 'proj3', name: 'Internal Design System', description: 'Creation of a comprehensive internal design system to be used across all WebWizBD projects. This will standardize components, improve consistency, and speed up development.', clientId: 'cli1', startDate: '2024-08-01', endDate: '2024-11-30', allocatedTimeInSeconds: 360000, priority: TaskPriority.Medium, divisions: ['UI Ux Design'], teamMemberIds: ['emp1', 'emp3'], createdById: 'emp1', ratings: { assigner: 4, ceo: 4 }, acceptance: { 'emp1': { status: ProjectAcceptanceStatus.Accepted, assignedAt: '2024-08-01T09:00:00Z'}, 'emp3': { status: ProjectAcceptanceStatus.Accepted, assignedAt: '2024-08-01T09:00:00Z'} } },
    { id: 'proj4', name: 'Client SEO Audit', description: 'Perform a full SEO audit for Quantum Solutions to identify areas for improvement and create a strategic roadmap for increasing organic traffic.', clientId: 'cli2', startDate: '2024-09-01', endDate: '2024-12-15', allocatedTimeInSeconds: 288000, priority: TaskPriority.Medium, divisions: ['SEO'], teamMemberIds: ['emp7', 'emp6'], createdById: 'emp7', acceptance: { 'emp7': { status: ProjectAcceptanceStatus.Accepted, assignedAt: '2024-09-01T09:00:00Z'}, 'emp6': { status: ProjectAcceptanceStatus.Accepted, assignedAt: '2024-09-01T09:00:00Z'} } },
];
const initialTasks: Task[] = [
    { id: 'task1', title: 'Setup Authentication', description: 'Implement JWT-based auth.', projectId: 'proj1', clientId: 'cli1', divisions: ['Web Development'], assignedToId: 'emp5', assignedById: 'emp1', status: TaskStatus.Done, deadline: '2024-08-15', priority: TaskPriority.High, completionReport: 'Auth flow complete with token refresh.', allocatedTimeInSeconds: 28800, timeSpentSeconds: 28800, ratings: { assigner: 5, ceo: 5 } },
    { id: 'task2', title: 'Design Landing Page Mockups', description: 'Create high-fidelity mockups in Figma.', projectId: 'proj2', clientId: 'cli2', divisions: ['UI Ux Design'], assignedToId: 'emp3', assignedById: 'emp5', status: TaskStatus.InProgress, deadline: '2024-09-01', priority: TaskPriority.High, allocatedTimeInSeconds: 57600, timeSpentSeconds: 5400 },
    { id: 'task3', title: 'Develop Component Library', description: 'Build reusable React components.', projectId: 'proj3', clientId: 'cli1', divisions: ['Web Development', 'UI Ux Design'], assignedToId: 'emp5', assignedById: 'emp1', status: TaskStatus.InProgress, deadline: '2024-09-10', priority: TaskPriority.Medium, allocatedTimeInSeconds: 144000, timeSpentSeconds: 14400, timerStartTime: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
    { id: 'task4', title: 'API Integration for User Profile', description: 'Connect frontend to user profile endpoints.', projectId: 'proj1', clientId: 'cli1', divisions: ['Web Development'], assignedToId: 'emp5', assignedById: 'emp1', status: TaskStatus.ToDo, deadline: '2024-09-20', priority: TaskPriority.Medium, allocatedTimeInSeconds: 43200, timeSpentSeconds: 0 },
    { id: 'task5', title: 'Create Style Guide', description: 'Document colors, typography, and spacing.', projectId: 'proj3', clientId: 'cli1', divisions: ['UI Ux Design'], assignedToId: 'emp3', assignedById: 'emp1', status: TaskStatus.Done, deadline: '2024-08-20', priority: TaskPriority.Low, completionReport: 'Style guide finalized and shared.', allocatedTimeInSeconds: 14400, timeSpentSeconds: 10800, ratings: { assigner: 4 } },
    { id: 'task6', title: 'Keyword Research for Quantum Solutions', description: 'Identify primary and secondary keywords for the QuantumLeap website.', projectId: 'proj4', clientId: 'cli2', divisions: ['SEO'], assignedToId: 'emp7', assignedById: 'emp1', status: TaskStatus.ToDo, deadline: '2024-09-30', priority: TaskPriority.High, allocatedTimeInSeconds: 72000, timeSpentSeconds: 0 },
    { id: 'task7', title: 'Write Homepage Content', description: 'Draft compelling copy for the main sections of the QuantumLeap website homepage.', projectId: 'proj2', clientId: 'cli2', divisions: ['Content Writing'], assignedToId: 'emp6', assignedById: 'emp5', status: TaskStatus.ToDo, deadline: '2024-09-15', priority: TaskPriority.High, allocatedTimeInSeconds: 28800, timeSpentSeconds: 0 },
];
const initialTimeLogs: TimeLog[] = [
    { id: 'log1', teammateId: 'emp5', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], hours: 2 },
    { id: 'log2', teammateId: 'emp6', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], hours: 1.5 },
    { id: 'log3', teammateId: 'emp1', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], hours: 1.5 },
];
const initialSalaries: Salary[] = [
    { id: 'sal1', teammateId: 'emp1', month: new Date().getMonth() - 1, year: new Date().getFullYear(), amount: 200000 / 12, status: SalaryStatus.Paid },
    { id: 'sal2', teammateId: 'emp5', month: new Date().getMonth() - 1, year: new Date().getFullYear(), amount: 90000 / 12, status: SalaryStatus.Paid },
    { id: 'sal3', teammateId: 'emp6', month: new Date().getMonth() - 1, year: new Date().getFullYear(), amount: 55000 / 12, status: SalaryStatus.Paid },
    { id: 'sal4', teammateId: 'emp1', month: new Date().getMonth(), year: new Date().getFullYear(), amount: 200000 / 12, status: SalaryStatus.Pending },
    { id: 'sal5', teammateId: 'emp2', month: new Date().getMonth() - 1, year: new Date().getFullYear(), amount: 70000 / 12, status: SalaryStatus.Paid },
    { id: 'sal6', teammateId: 'emp3', month: new Date().getMonth() - 1, year: new Date().getFullYear(), amount: 65000 / 12, status: SalaryStatus.Paid },
    { id: 'sal7', teammateId: 'emp4', month: new Date().getMonth() - 1, year: new Date().getFullYear(), amount: 68000 / 12, status: SalaryStatus.Paid },
    { id: 'sal8', teammateId: 'emp7', month: new Date().getMonth() - 1, year: new Date().getFullYear(), amount: 62000 / 12, status: SalaryStatus.Paid },
];
const initialNotifications: Notification[] = [
    { id: 'notif1', userId: 'emp1', message: 'Welcome to WebWizBD ERP!', read: true, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { id: 'notif2', userId: 'emp1', message: 'Task "Develop Component Library" is approaching its deadline.', read: false, timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), link: 'taskDetail/task3' },
    { id: 'notif3', userId: 'emp5', message: 'You have been assigned to project "InnovateSphere Platform".', read: true, timestamp: new Date().toISOString(), link: 'projectDetail/proj1' },
];

const todayStr = new Date().toISOString().split('T')[0];
const initialAttendance: Attendance[] = [
    { id: 'att1', teammateId: 'emp1', date: todayStr, status: AttendanceStatus.Present, checkInTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { id: 'att2', teammateId: 'emp6', date: todayStr, status: AttendanceStatus.Present, checkInTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), checkOutTime: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
    { id: 'att3', teammateId: 'emp5', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: AttendanceStatus.Present, checkInTime: '2024-01-01T09:00:00Z', checkOutTime: '2024-01-01T17:00:00Z' },
    { id: 'att4', teammateId: 'emp7', date: todayStr, status: AttendanceStatus.Present, checkInTime: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString() },
];

const initialErpSettings: ErpSettings = {
    companyName: 'WebWizBD ERP',
    dailyTimeGoal: 1.5,
    currencySymbol: '$',
    theme: Theme.Dark,
    colorScheme: ColorScheme.Gold,
    divisions: [
        'UI Ux Design',
        'Web Development',
        'SEO',
        'SMM',
        'Content Writing',
    ],
    roles: ['CEO', 'HR and Admin', 'SMM and Design Lead', 'Sales and PR Lead', 'Lead Web Developer', 'Lead SEO Expert', 'Content Writer', 'Developer', 'Designer'],
};

const initialComments: Comment[] = [
    {id: 'comment1', parentId: 'task1', authorId: 'emp1', text: 'Great job on this, looks solid.', timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString()},
    {id: 'comment2', parentId: 'task1', authorId: 'emp5', text: 'Thanks! Let me know if any revisions are needed.', timestamp: new Date(Date.now() - 23 * 3600 * 1000).toISOString()},
    {id: 'comment3', parentId: 'proj1', authorId: 'emp1', text: 'This project is on track. Good work team.', timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString()},
];


// Helper function to load state from localStorage or use a default
const loadState = <T,>(key: string, defaultValue: T): T => {
    try {
        const savedState = localStorage.getItem(key);
        if (savedState) {
            return JSON.parse(savedState);
        }
    } catch (error) {
        console.error(`Error loading state for ${key} from localStorage`, error);
    }
    return defaultValue;
};


function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Load state from localStorage or use initial data (gradually migrating to database)
  // Teammates now loaded from database
  const [teammates, setTeammates] = useState<Teammate[]>(initialTeammates);
  const [teammatesLoaded, setTeammatesLoaded] = useState(false);
  // Clients now loaded from database
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoaded, setClientsLoaded] = useState(false);
  const [projects, setProjects] = useState<Project[]>(() => loadState('erp_projects', initialProjects));
  // Tasks now loaded from database
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>(() => loadState('erp_timeLogs', initialTimeLogs));
  const [salaries, setSalaries] = useState<Salary[]>(() => loadState('erp_salaries', initialSalaries));
  // Notifications now loaded from database
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [notificationsLoaded, setNotificationsLoaded] = useState(false);
  const [attendance, setAttendance] = useState<Attendance[]>(() => loadState('erp_attendance', initialAttendance));
  // ERP Settings now loaded from database
  const [erpSettings, setErpSettings] = useState<ErpSettings>(initialErpSettings);
  const [erpSettingsLoaded, setErpSettingsLoaded] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState<PendingUpdate[]>(() => loadState('erp_pendingUpdates', []));
  const [comments, setComments] = useState<Comment[]>(() => loadState('erp_comments', initialComments));
  const [pendingAssignments, setPendingAssignments] = useState<Project[]>([]);


  // For testing: persist the current user's ID
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => loadState('erp_currentUserId', null));
  const currentUser = useMemo(() => teammates.find(t => t.id === currentUserId) || null, [currentUserId, teammates]);

  // Initialize database and load ERP Settings on app start
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // First initialize database with default data
        await initializeDatabase();
        
        // Then load settings
        const settings = await loadFromDatabase.erpSettings();
        if (settings) {
          setErpSettings(settings);
        } else {
          // If no settings in database, use initial settings
          setErpSettings(initialErpSettings);
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
        // Fallback to initial settings
        setErpSettings(initialErpSettings);
      } finally {
        setErpSettingsLoaded(true);
      }
    };
    
    initializeApp();
  }, []);

  // Load Teammates from database on app start
  useEffect(() => {
    const loadTeammates = async () => {
      try {
        const teammatesData = await loadFromDatabase.teammates();
        console.log('👥 Loaded teammates from database:', teammatesData);
        if (teammatesData && teammatesData.length > 0) {
          setTeammates(teammatesData);
        } else {
          // If no teammates in database, fallback to initial data
          console.log('No teammates found in database, using fallback data...');
          console.log('👥 Using fallback teammates:', initialTeammates);
          setTeammates(initialTeammates);
        }
      } catch (error) {
        console.error('Failed to load teammates from database:', error);
        // Fallback to localStorage then initial data
        const localTeammates = loadState('erp_teammates', initialTeammates);
        console.log('👥 Error fallback teammates:', localTeammates);
        setTeammates(localTeammates);
      } finally {
        setTeammatesLoaded(true);
      }
    };
    
    loadTeammates();
  }, []);

  // Load Notifications from database on app start
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const notificationsData = await loadFromDatabase.notifications();
        console.log('📧 Loaded notifications from database:', notificationsData);
        if (notificationsData && notificationsData.length > 0) {
          setNotifications(notificationsData);
        } else {
          // If no notifications in database, fallback to localStorage then initial data
          console.log('No notifications found in database, using fallback data...');
          const localNotifications = loadState('erp_notifications', initialNotifications);
          console.log('📧 Using fallback notifications:', localNotifications);
          setNotifications(localNotifications);
        }
      } catch (error) {
        console.error('Failed to load notifications from database:', error);
        // Fallback to localStorage then initial data
        const localNotifications = loadState('erp_notifications', initialNotifications);
        console.log('📧 Error fallback notifications:', localNotifications);
        setNotifications(localNotifications);
      } finally {
        setNotificationsLoaded(true);
      }
    };
    
    loadNotifications();
  }, []);

  // Load Clients from database on app start
  useEffect(() => {
    const loadClients = async () => {
      try {
        const clientsData = await loadFromDatabase.clients();
        console.log('🏢 Loaded clients from database:', clientsData);
        if (clientsData && clientsData.length > 0) {
          setClients(clientsData);
        } else {
          // If no clients in database, fallback to initial data
          console.log('No clients found in database, using fallback data...');
          console.log('🏢 Using fallback clients:', initialClients);
          setClients(initialClients);
        }
      } catch (error) {
        console.error('Failed to load clients from database:', error);
        // Fallback to localStorage then initial data
        const localClients = loadState('erp_clients', initialClients);
        console.log('🏢 Error fallback clients:', localClients);
        setClients(localClients);
      } finally {
        setClientsLoaded(true);
      }
    };
    
    loadClients();
  }, []);

  // Load Tasks from database on app start
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const tasksData = await loadFromDatabase.tasks();
        console.log('📋 Loaded tasks from database:', tasksData);
        if (tasksData && tasksData.length > 0) {
          setTasks(tasksData);
        } else {
          // If no tasks in database, keep tasks empty (no fallback to localStorage or initialTasks)
          console.log('No tasks found in database, keeping tasks empty...');
          setTasks([]);
        }
      } catch (error) {
        console.error('Failed to load tasks from database:', error);
        // On error, keep tasks empty (no fallback to localStorage or initialTasks)
        console.log('📋 Error loading tasks, keeping tasks empty...');
        setTasks([]);
      } finally {
        setTasksLoaded(true);
      }
    };
    
    loadTasks();
  }, []);

  // Real-time notifications subscription
  useEffect(() => {
    if (!notificationsLoaded) return;
    
    console.log('🔄 Setting up real-time notifications subscription...');
    
    // Subscribe to notifications table changes
    const subscription = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'notifications'
        },
        async (payload) => {
          console.log('🔔 Real-time notification change:', payload);
          
          if (payload.eventType === 'INSERT') {
            // New notification created
            const newNotificationData = payload.new;
            console.log('🆕 New notification inserted:', newNotificationData);
            
            // Map the database row to our notification format
            const newNotification: Notification = {
              id: newNotificationData.id,
              userId: newNotificationData.user_id,
              message: newNotificationData.message,
              read: newNotificationData.read,
              timestamp: newNotificationData.created_at,
              link: newNotificationData.link
            };
            
            // Add to local state if not already present
            setNotifications(prev => {
              const exists = prev.find(n => n.id === newNotification.id);
              if (!exists) {
                console.log('➕ Adding new notification to state:', newNotification);
                return [newNotification, ...prev];
              }
              console.log('🔄 Notification already exists in state:', newNotification.id);
              return prev;
            });
          } else if (payload.eventType === 'UPDATE') {
            // Notification updated (e.g., marked as read)
            const updatedNotificationData = payload.new;
            console.log('🔄 Notification updated:', updatedNotificationData);
            
            const updatedNotification: Notification = {
              id: updatedNotificationData.id,
              userId: updatedNotificationData.user_id,
              message: updatedNotificationData.message,
              read: updatedNotificationData.read,
              timestamp: updatedNotificationData.created_at,
              link: updatedNotificationData.link
            };
            
            setNotifications(prev => prev.map(n => 
              n.id === updatedNotification.id ? updatedNotification : n
            ));
          }
        }
      )
      .subscribe();
      
    console.log('✓ Real-time notifications subscription active');
    
    // Cleanup subscription on unmount
    return () => {
      console.log('🗑️ Cleaning up notifications subscription');
      subscription.unsubscribe();
    };
  }, [notificationsLoaded]);

  // Real-time tasks subscription
  useEffect(() => {
    if (!tasksLoaded) return;
    
    console.log('🔄 Setting up real-time tasks subscription...');
    
    // Subscribe to tasks table changes
    const subscription = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'tasks'
        },
        async (payload) => {
          console.log('📋 Real-time task change:', payload);
          
          if (payload.eventType === 'INSERT') {
            // New task created
            const newTaskData = payload.new;
            console.log('🆕 New task inserted:', newTaskData);
            
            // Map the database row to our task format
            const newTask: Task = {
              id: newTaskData.id,
              title: newTaskData.title,
              description: newTaskData.description,
              projectId: newTaskData.project_id,
              clientId: newTaskData.client_id,
              divisions: newTaskData.divisions,
              assignedToId: newTaskData.assigned_to_id,
              assignedById: newTaskData.assigned_by_id,
              status: newTaskData.status,
              deadline: newTaskData.deadline,
              priority: newTaskData.priority,
              completionReport: newTaskData.completion_report,
              allocatedTimeInSeconds: newTaskData.allocated_time_seconds,
              timeSpentSeconds: newTaskData.time_spent_seconds,
              timerStartTime: newTaskData.timer_start_time,
              ratings: newTaskData.ratings || {}
            };
            
            // Add to local state if not already present
            setTasks(prev => {
              const exists = prev.find(t => t.id === newTask.id);
              if (!exists) {
                console.log('➕ Adding new task to state:', newTask);
                return [newTask, ...prev];
              }
              console.log('🔄 Task already exists in state:', newTask.id);
              return prev;
            });
          } else if (payload.eventType === 'UPDATE') {
            // Task updated
            const updatedTaskData = payload.new;
            console.log('🔄 Task updated:', updatedTaskData);
            
            const updatedTask: Task = {
              id: updatedTaskData.id,
              title: updatedTaskData.title,
              description: updatedTaskData.description,
              projectId: updatedTaskData.project_id,
              clientId: updatedTaskData.client_id,
              divisions: updatedTaskData.divisions,
              assignedToId: updatedTaskData.assigned_to_id,
              assignedById: updatedTaskData.assigned_by_id,
              status: updatedTaskData.status,
              deadline: updatedTaskData.deadline,
              priority: updatedTaskData.priority,
              completionReport: updatedTaskData.completion_report,
              allocatedTimeInSeconds: updatedTaskData.allocated_time_seconds,
              timeSpentSeconds: updatedTaskData.time_spent_seconds,
              timerStartTime: updatedTaskData.timer_start_time,
              ratings: updatedTaskData.ratings || {}
            };
            
            setTasks(prev => prev.map(t => 
              t.id === updatedTask.id ? updatedTask : t
            ));
          } else if (payload.eventType === 'DELETE') {
            // Task deleted
            const deletedTaskData = payload.old;
            console.log('🗑️ Task deleted:', deletedTaskData);
            
            setTasks(prev => prev.filter(t => t.id !== deletedTaskData.id));
          }
        }
      )
      .subscribe();
      
    console.log('✓ Real-time tasks subscription active');
    
    // Cleanup subscription on unmount
    return () => {
      console.log('🗑️ Cleaning up tasks subscription');
      subscription.unsubscribe();
    };
  }, [tasksLoaded]);

  // Effects to save state changes to localStorage (gradually migrating to database)
  // Teammates now managed through database operations, no localStorage sync needed
  // Clients now managed through database operations, no localStorage sync needed
  useEffect(() => { localStorage.setItem('erp_projects', JSON.stringify(projects)); }, [projects]);
  // Tasks now managed through database operations, no localStorage sync needed
  useEffect(() => { localStorage.setItem('erp_timeLogs', JSON.stringify(timeLogs)); }, [timeLogs]);
  useEffect(() => { localStorage.setItem('erp_salaries', JSON.stringify(salaries)); }, [salaries]);
  // Notifications now managed through database operations, no localStorage sync needed
  useEffect(() => { localStorage.setItem('erp_attendance', JSON.stringify(attendance)); }, [attendance]);
  // ERP Settings now saved to database instead of localStorage
  useEffect(() => {
    if (erpSettingsLoaded) {
      const saveErpSettings = async () => {
        try {
          await DatabaseOperations.updateErpSettings(erpSettings);
        } catch (error) {
          console.error('Failed to save ERP settings to database:', error);
        }
      };
      saveErpSettings();
    }
  }, [erpSettings, erpSettingsLoaded]);
  useEffect(() => { localStorage.setItem('erp_currentUserId', JSON.stringify(currentUserId)); }, [currentUserId]);
  useEffect(() => { localStorage.setItem('erp_pendingUpdates', JSON.stringify(pendingUpdates)); }, [pendingUpdates]);
  useEffect(() => { localStorage.setItem('erp_comments', JSON.stringify(comments)); }, [comments]);

  useEffect(() => {
    if (!currentUser) {
        setPendingAssignments([]);
        return;
    }
    const assignmentsForUser = projects.filter(p => 
        p.acceptance?.[currentUser.id]?.status === ProjectAcceptanceStatus.Pending
    );
    setPendingAssignments(assignmentsForUser);
  }, [projects, currentUser]);


  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    
    body.classList.add('bg-white', 'dark:bg-gray-950', 'text-gray-900', 'dark:text-gray-100', 'transition-colors', 'duration-300');

    // Apply theme based on settings
    if (erpSettings.theme === Theme.System) {
      const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', systemIsDark);
    } else {
      root.classList.toggle('dark', erpSettings.theme === Theme.Dark || erpSettings.theme === 'dark');
    }
  }, [erpSettings.theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    const palette = COLOR_PALETTES[erpSettings.colorScheme];
    if (palette) {
        for (const [shade, value] of Object.entries(palette)) {
            root.style.setProperty(`--color-primary-${shade}`, value);
        }
    }
  }, [erpSettings.colorScheme]);

  const approvedTeammates = useMemo(() => teammates.filter(e => e.approved), [teammates]);

  const currentUserNotifications = useMemo(() => {
    if (!currentUser) return [];
    console.log('🔍 Filtering notifications for current user:', {
      currentUserId: currentUser.id,
      totalNotifications: notifications.length,
      notifications: notifications.map(n => ({ id: n.id, userId: n.userId, message: n.message }))
    });
    const filtered = notifications
      .filter(n => n.userId === currentUser.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    console.log('🎯 Filtered notifications:', filtered);
    return filtered;
  }, [notifications, currentUser]);

  const addNotification = useCallback(async (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    // Create notification in database
    const createdNotification = await DatabaseOperations.createNotification(notification);
    if (createdNotification) {
      setNotifications(prev => [createdNotification, ...prev]);
    }
  }, []);

  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    // Update notification in database
    const notificationToUpdate = notifications.find(n => n.id === notificationId);
    if (notificationToUpdate) {
      const updatedNotification = { ...notificationToUpdate, read: true };
      const result = await DatabaseOperations.updateNotification(updatedNotification);
      if (result) {
        setNotifications(prev => prev.map(n => n.id === notificationId ? result : n));
      }
    }
  }, [notifications]);

  const handleMarkAllAsRead = useCallback(async () => {
    console.log('🔄 Mark all as read clicked');
    if (!currentUser) {
      console.log('❌ No current user found');
      return;
    }
    
    // Find all unread notifications for current user
    const unreadNotifications = notifications.filter(n => n.userId === currentUser.id && !n.read);
    console.log('📧 Unread notifications to mark:', unreadNotifications.length, unreadNotifications);
    
    if (unreadNotifications.length === 0) {
      console.log('✅ No unread notifications to mark');
      return;
    }
    
    // Update each notification in database
    const updatePromises = unreadNotifications.map(async (notification) => {
      const updatedNotification = { ...notification, read: true };
      console.log('🔄 Updating notification:', notification.id);
      return DatabaseOperations.updateNotification(updatedNotification);
    });
    
    try {
      const results = await Promise.all(updatePromises);
      console.log('✅ Database update results:', results);
      // Update local state with successful database updates
      const validResults = results.filter(result => result !== null);
      if (validResults.length > 0) {
        console.log('🔄 Updating local state with', validResults.length, 'notifications');
        setNotifications(prev => prev.map(n => {
          const updatedResult = validResults.find(r => r?.id === n.id);
          return updatedResult ? updatedResult : n;
        }));
      } else {
        console.log('❌ No valid results from database updates');
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      console.log('🔄 Falling back to local update');
      // Fallback to local update if database fails
      setNotifications(prev => prev.map(n => n.userId === currentUser.id ? { ...n, read: true } : n));
    }
  }, [currentUser, notifications]);

  const handleLogin = (email: string, password?: string): boolean => {
    const user = teammates.find(e => e.email?.toLowerCase() === email.toLowerCase() && e.password === password && e.approved);
    if (user) {
      setCurrentUserId(user.id);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setCurrentUserId(null);
    setActiveView('dashboard'); // Reset view on logout
  };
  
  const handleSwitchUser = useCallback((teammateId: string) => {
    const userToSwitchTo = teammates.find(e => e.id === teammateId && e.approved);
    if (userToSwitchTo) {
      setCurrentUserId(teammateId);
    }
  }, [teammates]);

  const handleNavClick = (view: string) => {
    setActiveView(view);
  };
  
  const handleToggleMobileSidebar = () => {
    setIsMobileSidebarOpen(prev => !prev);
  }

  const handleAddTeammate = useCallback(async (teammate: Omit<Teammate, 'id' | 'approved'>) => {
    if (!currentUser) {
      console.error('No current user found');
      return;
    }
    
    console.log('Adding teammate:', teammate);
    const newTeammateData = { ...teammate, approved: false };
    
    try {
      const createdTeammate = await DatabaseOperations.createTeammate(newTeammateData);
      
      if (createdTeammate) {
        console.log('Teammate created successfully:', createdTeammate);
        setTeammates(prev => [...prev, createdTeammate]);
        
        // Load teammates from database to get actual UUIDs
        const dbTeammates = await loadFromDatabase.teammates();
        const ceo = dbTeammates?.find(e => e.role === 'CEO');
        console.log('Found CEO for notification:', ceo);
        
        if(ceo) {
            try {
              const notification = await DatabaseOperations.createNotification({
                  userId: ceo.id,
                  message: `${currentUser.name} added '${teammate.name}', pending approval.`,
                  read: false,
                  link: 'teammates'
              });
              if (notification) {
                setNotifications(prev => [notification, ...prev]);
              }
            } catch (error) {
              console.error('Error creating notification:', error);
            }
        }
      } else {
        console.error('Failed to create teammate - no data returned');
        // You could show a user-friendly error message here
      }
    } catch (error) {
      console.error('Error in handleAddTeammate:', error);
      // You could show a user-friendly error message here
    }
  }, [teammates, currentUser]);
  
  const handleApproveTeammate = useCallback(async (teammateId: string) => {
    try {
      // Find the teammate to approve
      const teammateToApprove = teammates.find(emp => emp.id === teammateId);
      if (!teammateToApprove) return;

      // Update teammate in database
      const approvedTeammate = { ...teammateToApprove, approved: true };
      const updatedTeammate = await DatabaseOperations.updateTeammate(approvedTeammate);
      
      if (updatedTeammate) {
        // Update local state
        setTeammates(prev => prev.map(emp => 
          emp.id === teammateId ? updatedTeammate : emp
        ));

        // Add notification for the approved teammate
        const notification = await DatabaseOperations.createNotification({
          userId: updatedTeammate.id,
          message: 'Your account has been approved by the CEO.',
          read: false,
          link: 'profile'
        });
        if (notification) {
          setNotifications(prev => [notification, ...prev]);
        }

        // Notify admins and HR managers
        const adminsAndHrs = teammates.filter(e => e.role === 'Admin' || e.role === 'HR Manager');
        for (const manager of adminsAndHrs) {
          const managerNotification = await DatabaseOperations.createNotification({
            userId: manager.id,
            message: `Account for ${updatedTeammate.name} was approved.`,
            read: false,
            link: 'teammates'
          });
          if (managerNotification) {
            setNotifications(prev => [managerNotification, ...prev]);
          }
        }
      }
    } catch (error) {
      console.error('Failed to approve teammate:', error);
      // Could show user-friendly error message here
    }
  }, [teammates, setNotifications]);

  const handleUpdateTeammate = useCallback(async (updatedTeammate: Teammate) => {
    try {
      // Update teammate in database
      const result = await DatabaseOperations.updateTeammate(updatedTeammate);
      
      if (result) {
        // Update local state only if database update succeeds
        setTeammates(prev => prev.map(item => 
          item.id === updatedTeammate.id ? result : item
        ));
      }
    } catch (error) {
      console.error('Failed to update teammate:', error);
      // Could show user-friendly error message here
    }
  }, []);

  const handleDeleteTeammate = useCallback(async (teammateId: string) => {
    try {
      // Delete teammate from database
      const success = await DatabaseOperations.deleteTeammate(teammateId);
      
      if (success) {
        // Remove from local state only if database deletion succeeds
        setTeammates(prev => prev.filter(item => item.id !== teammateId));
      }
    } catch (error) {
      console.error('Failed to delete teammate:', error);
      // Could show user-friendly error message here
    }
  }, []);
  
  const handleAddRole = useCallback((role: string) => {
      setErpSettings(prev => {
          if (role && !prev.roles.includes(role)) {
              if(currentUser) {
                  addNotification({
                      userId: currentUser.id,
                      message: `New teammate role created: "${role}".`,
                      read: false,
                      link: 'settings'
                  });
              }
              return { ...prev, roles: [...prev.roles, role] };
          }
          return prev;
      });
  }, [addNotification, currentUser]);

  const handleChangePassword = useCallback(async (teammateId: string, oldPass: string, newPass: string): Promise<{ success: boolean; message: string }> => {
    try {
      const user = teammates.find(t => t.id === teammateId);
      if (!user || user.password !== oldPass) {
          return { success: false, message: 'Current password is incorrect.' };
      }

      // Update password in database
      const updatedUser = { ...user, password: newPass };
      const result = await DatabaseOperations.updateTeammate(updatedUser);
      
      if (result) {
        // Update local state only if database update succeeds
        setTeammates(prev => prev.map(t => t.id === teammateId ? result : t));
        return { success: true, message: 'Password updated successfully!' };
      } else {
        return { success: false, message: 'Failed to update password. Please try again.' };
      }
    } catch (error) {
      console.error('Failed to update password:', error);
      return { success: false, message: 'Failed to update password. Please try again.' };
    }
  }, [teammates]);
  
  const handleRequestRoleChange = useCallback((newRole: string, justification: string) => {
    if (!currentUser) return;
    const newUpdate: TeammatePendingUpdate = {
        id: `update_${new Date().getTime()}`,
        type: 'teammate',
        itemId: currentUser.id,
        requestedBy: currentUser.id,
        requesterName: currentUser.name,
        requestedAt: new Date().toISOString(),
        data: { role: newRole, justification },
        originalData: { role: currentUser.role },
        status: 'pending',
    };
    setPendingUpdates(prev => [...prev, newUpdate]);

    const ceo = teammates.find(e => e.role === 'CEO');
    if (ceo) {
        addNotification({
            userId: ceo.id,
            message: `${currentUser.name} requested a role change to ${newRole}.`,
            read: false,
            link: 'approvals'
        });
    }
  }, [currentUser, teammates, addNotification]);

  const handleAddClient = useCallback((client: Omit<Client, 'id'>, callback?: (newClientId: string) => void) => {
    const newClient = { ...client, id: `cli_${new Date().getTime()}` } as Client;
    setClients(prev => [...prev, newClient]);
    if (callback) {
        callback(newClient.id);
    }
  }, []);

  const handleUpdateClient = useCallback((updatedClient: Client) => {
    setClients(prev => prev.map(item => item.id === updatedClient.id ? updatedClient : item));
  }, []);

  const handleDeleteClient = useCallback((clientId: string) => {
    setClients(prev => prev.filter(item => item.id !== clientId));
  }, []);

  const handleAddProject = useCallback((project: Omit<Project, 'id' | 'createdById' | 'ratings'>) => {
    if (!currentUser) return;

    const acceptance: { [teammateId: string]: ProjectAcceptance } = {};
    const assignedAt = new Date().toISOString();
    project.teamMemberIds.forEach(id => {
        acceptance[id] = {
            status: ProjectAcceptanceStatus.Pending,
            assignedAt: assignedAt,
        };
    });

    const newProject: Project = { 
      ...project, 
      id: `proj_${new Date().getTime()}`, 
      createdById: currentUser.id,
      ratings: {},
      acceptance: acceptance,
    };
    setProjects(prev => [...prev, newProject]);
  }, [currentUser]);
  
  const handleRateProject = useCallback((projectId: string, rating: number, rater: 'assigner' | 'ceo') => {
    setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
            const newRatings = { ...p.ratings, [rater]: rating };
            return { ...p, ratings: newRatings };
        }
        return p;
    }));
    const project = projects.find(p => p.id === projectId);
    if (project && currentUser) {
        addNotification({
            userId: currentUser.id,
            message: `You rated project "${project.name}" ${rating} stars as ${rater}.`,
            read: true,
            link: `projectDetail/${project.id}`
        });
    }
  }, [projects, addNotification, currentUser]);

  const handleUpdateProject = useCallback((updatedProject: Project) => {
    if (!currentUser) return;
    if (currentUser.role === 'CEO') {
        setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
        addNotification({
            userId: currentUser.id,
            message: `Project "${updatedProject.name}" was updated directly.`,
            read: true,
            link: `projectDetail/${updatedProject.id}`
        });
    } else {
        const originalProject = projects.find(p => p.id === updatedProject.id);
        if (!originalProject) return;

        const changes: Partial<Project> = {};
        const originalChanges: Partial<Project> = {};

        (Object.keys(updatedProject) as Array<keyof Project>).forEach(key => {
            if (key === 'ratings' || key === 'acceptance') return;
            if (JSON.stringify(originalProject[key]) !== JSON.stringify(updatedProject[key])) {
                (changes as any)[key] = updatedProject[key];
                (originalChanges as any)[key] = originalProject[key];
            }
        });

        if (Object.keys(changes).length === 0) return;

        const newUpdate: ProjectPendingUpdate = {
            id: `update_${new Date().getTime()}`,
            type: 'project',
            itemId: updatedProject.id,
            requestedBy: currentUser.id,
            requesterName: currentUser.name,
            requestedAt: new Date().toISOString(),
            data: changes,
            originalData: originalChanges,
            status: 'pending',
        };
        setPendingUpdates(prev => [...prev, newUpdate]);
        
        const ceo = teammates.find(e => e.role === 'CEO');
        if (ceo) {
            addNotification({
                userId: ceo.id,
                message: `${currentUser.name} requested changes to project "${updatedProject.name}".`,
                read: false,
                link: 'approvals'
            });
        }
    }
  }, [currentUser, projects, teammates, addNotification]);

  const handleAddTask = useCallback(async (task: Omit<Task, 'id' | 'timeSpentSeconds' | 'timerStartTime' | 'assignedById' | 'ratings'>) => {
    console.log('🚀 handleAddTask called with:', task);
    
    if (!currentUser) {
      console.error('❌ No current user found');
      return;
    }
    
    console.log('👤 Current user:', currentUser);
    
    const newTaskData = { 
      ...task, 
      timeSpentSeconds: 0,
      assignedById: currentUser.id,
      ratings: {}
    };
    
    console.log('📋 New task data prepared:', newTaskData);
    
    try {
      console.log('🔄 Calling DatabaseOperations.createTask...');
      // Create task in database
      const createdTask = await DatabaseOperations.createTask(newTaskData);
      
      console.log('📥 Database response:', createdTask);
      
      if (createdTask) {
        console.log('✅ Task created successfully:', createdTask);
        // Update local state only if database create succeeds
        setTasks(prev => {
          console.log('🔄 Updating local tasks state, previous tasks count:', prev.length);
          return [createdTask, ...prev];
        });
        
        // Send notification to assigned user if different from current user
        if (task.assignedToId !== currentUser.id) {
            console.log('📬 Sending notification to assigned user:', task.assignedToId);
            await addNotification({
                userId: task.assignedToId,
                message: `You were assigned a new task: "${task.title}"`,
                read: false,
                link: `taskDetail/${createdTask.id}`
            });
        }
      } else {
        console.error('❌ Failed to create task - no data returned');
      }
    } catch (error) {
      console.error('❌ Error creating task:', error);
      console.error('❌ Error stack:', error.stack);
      // Could show user-friendly error message here
    }
  }, [addNotification, currentUser]);
  
  const handleRateTask = useCallback((taskId: string, rating: number, rater: 'assigner' | 'ceo') => {
    setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
            const newRatings = { ...t.ratings, [rater]: rating };
            return { ...t, ratings: newRatings };
        }
        return t;
    }));
    const task = tasks.find(t => t.id === taskId);
    if (task && currentUser) {
        addNotification({
            userId: currentUser.id,
            message: `You rated task "${task.title}" ${rating} stars as ${rater}.`,
            read: true,
            link: `taskDetail/${task.id}`
        });
    }
  }, [tasks, addNotification, currentUser]);

  const handleEditTask = useCallback(async (editedTask: Task) => {
     if (!currentUser) return;
     
     console.log('✏️ Editing task:', editedTask);
     
     const originalTask = tasks.find(t => t.id === editedTask.id);
     if (!originalTask) return;

     // Check if work has been started on the task
     const hasWorkStarted = (
       originalTask.status !== TaskStatus.ToDo || 
       (originalTask.timeSpentSeconds && originalTask.timeSpentSeconds > 0) ||
       originalTask.timerStartTime
     );

     // Check if current user is the task assigner
     const isTaskAssigner = currentUser.id === originalTask.assignedById;
     
     // Determine if direct update is allowed
     const canDirectUpdate = (
       currentUser.role === 'CEO' || 
       (isTaskAssigner && !hasWorkStarted)
     );
     
     if (canDirectUpdate) {
        // CEO or task assigner (for unstarted tasks) can directly update tasks in database
        try {
          const result = await DatabaseOperations.updateTask(editedTask);
          if (result) {
            console.log('✅ Task edited successfully:', result);
            setTasks(prev => prev.map(t => t.id === editedTask.id ? result : t));
            
            const updateReason = currentUser.role === 'CEO' ? 'by CEO' : 'by task assigner (task not started)';
            console.log(`✅ Task updated directly ${updateReason}`);
            
            await addNotification({
              userId: currentUser.id,
              message: `Task "${editedTask.title}" was updated directly.`,
              read: true,
              link: `taskDetail/${editedTask.id}`
            });
            
            // Notify assigned person if they're different and it's not the CEO making the change
            if (currentUser.role !== 'CEO' && editedTask.assignedToId !== currentUser.id) {
              await addNotification({
                userId: editedTask.assignedToId,
                message: `Task "${editedTask.title}" has been updated by the task assigner.`,
                read: false,
                link: `taskDetail/${editedTask.id}`
              });
            }
          } else {
            console.error('❌ Failed to edit task - no data returned');
          }
        } catch (error) {
          console.error('❌ Error editing task:', error);
        }
     } else {
        // Task assigner editing started task or other users - need CEO approval
        const changes: Partial<Task> = {};
        const originalChanges: Partial<Task> = {};
        
        (Object.keys(editedTask) as Array<keyof Task>).forEach(key => {
            if (key === 'ratings') return; // Exclude ratings from pending changes
            if (JSON.stringify(originalTask[key]) !== JSON.stringify(editedTask[key])) {
                (changes as any)[key] = editedTask[key];
                (originalChanges as any)[key] = originalTask[key];
            }
        });

        if (Object.keys(changes).length === 0) return;

        const approvalReason = isTaskAssigner ? 
          '(task has been started)' : 
          '(not task assigner)';
        console.log(`📋 Sending task edit for CEO approval ${approvalReason}`);

        const newUpdate: TaskPendingUpdate = {
            id: `update_${new Date().getTime()}`,
            type: 'task',
            itemId: editedTask.id,
            requestedBy: currentUser.id,
            requesterName: currentUser.name,
            requestedAt: new Date().toISOString(),
            data: changes,
            originalData: originalChanges,
            status: 'pending',
        };
        setPendingUpdates(prev => [...prev, newUpdate]);

        const ceo = teammates.find(e => e.role === 'CEO');
        if (ceo) {
            await addNotification({
                userId: ceo.id,
                message: `${currentUser.name} requested changes to task "${editedTask.title}".`,
                read: false,
                link: 'approvals'
            });
        }
     }
  }, [currentUser, tasks, teammates, addNotification]);
  
    const handleProjectTaskUpdate = useCallback((updatedTask: Task) => {
        if (!currentUser) return;
        const originalTask = tasks.find(t => t.id === updatedTask.id);
        if (!originalTask) return;

        const performDirectUpdate = () => {
            setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
            if (updatedTask.assignedToId !== currentUser.id) {
                 addNotification({
                    userId: updatedTask.assignedToId,
                    message: `An update was made to your task: "${updatedTask.title}".`,
                    read: false,
                    link: `taskDetail/${updatedTask.id}`
                });
            }
        };
        
        const sendForApproval = () => {
            const changes: Partial<Task> = {};
            const originalChanges: Partial<Task> = {};
            (Object.keys(updatedTask) as Array<keyof Task>).forEach(key => {
                if (key === 'ratings') return;
                if (JSON.stringify(originalTask[key]) !== JSON.stringify(updatedTask[key])) {
                    (changes as any)[key] = updatedTask[key];
                    (originalChanges as any)[key] = originalTask[key];
                }
            });
            if (Object.keys(changes).length === 0) return;
            const newUpdate: TaskPendingUpdate = {
                id: `update_${new Date().getTime()}`,
                type: 'task',
                itemId: updatedTask.id,
                requestedBy: currentUser.id,
                requesterName: currentUser.name,
                requestedAt: new Date().toISOString(),
                data: changes,
                originalData: originalChanges,
                status: 'pending',
            };
            setPendingUpdates(prev => [...prev, newUpdate]);
            const ceo = teammates.find(e => e.role === 'CEO');
            if (ceo) {
                addNotification({
                    userId: ceo.id,
                    message: `${currentUser.name} requested changes to task "${updatedTask.title}".`,
                    read: false,
                    link: 'approvals'
                });
            }
        };

        if (originalTask.status === TaskStatus.ToDo || currentUser.role === 'CEO') {
            performDirectUpdate();
        } else {
            sendForApproval();
        }
    }, [currentUser, tasks, teammates, addNotification, setPendingUpdates]);


  const handleUpdateTask = useCallback(async (updatedTask: Task) => {
    console.log('📝 Updating task:', updatedTask);
    const originalTask = tasks.find(t => t.id === updatedTask.id);
    
    try {
      // Update task in database
      const result = await DatabaseOperations.updateTask(updatedTask);
      
      if (result) {
        console.log('✅ Task updated successfully in database:', result);
        // Update local state only if database update succeeds
        setTasks(prev => prev.map(item => item.id === updatedTask.id ? result : item));
        
        // Check if task was just completed and notify managers
        if (originalTask?.status !== TaskStatus.Done && result.status === TaskStatus.Done) {
          const managers = teammates.filter(e => e.role === 'Admin' || e.role === 'CEO' || e.role.includes('Lead'));
          const teammate = teammates.find(e => e.id === result.assignedToId);
          
          // Send notifications to managers
          const notificationPromises = managers.map(async (manager) => {
            if (manager.id !== teammate?.id) {
              return addNotification({
                userId: manager.id,
                message: `${teammate?.name || 'Someone'} completed the task: "${result.title}"`,
                read: false,
                link: `taskDetail/${result.id}`
              });
            }
            return null;
          });
          
          await Promise.all(notificationPromises);
        }
      } else {
        console.error('❌ Failed to update task - no data returned');
      }
    } catch (error) {
      console.error('❌ Error updating task:', error);
      // Could show user-friendly error message here
    }
  }, [tasks, teammates, addNotification]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    console.log('🗑️ Deleting task:', taskId);
    
    if (!currentUser) {
      console.error('❌ No current user found');
      return;
    }
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      console.error('❌ Task not found:', taskId);
      return;
    }
    
    // Check permissions
    const isTaskAssigner = currentUser.id === task.assignedById;
    const isCeo = currentUser.role === 'CEO';
    
    // Only task assigner and CEO can delete tasks
    if (!isTaskAssigner && !isCeo) {
      console.error('❌ User does not have permission to delete this task');
      return;
    }
    
    // If task has moved out of "To Do" status, only CEO can delete directly
    if (task.status !== TaskStatus.ToDo && !isCeo) {
      console.log('📋 Task has started - sending delete request for CEO approval');
      
      // Create a pending update for deletion
      const deleteRequest: TaskPendingUpdate = {
        id: `delete_${new Date().getTime()}`,
        type: 'task',
        itemId: taskId,
        requestedBy: currentUser.id,
        requesterName: currentUser.name,
        requestedAt: new Date().toISOString(),
        data: { _action: 'delete' }, // Special marker for delete requests
        originalData: task,
        status: 'pending',
      };
      
      setPendingUpdates(prev => [...prev, deleteRequest]);
      
      // Notify CEO
      const ceo = teammates.find(e => e.role === 'CEO');
      if (ceo) {
        await addNotification({
          userId: ceo.id,
          message: `${currentUser.name} requested to delete task "${task.title}" (task has been started).`,
          read: false,
          link: 'approvals'
        });
      }
      return;
    }
    
    // Direct deletion allowed (CEO or task assigner for unstarted tasks)
    try {
      // Delete task from database
      const success = await DatabaseOperations.deleteTask(taskId);
      
      if (success) {
        console.log('✅ Task deleted successfully from database');
        // Remove from local state only if database deletion succeeds
        setTasks(prev => prev.filter(item => item.id !== taskId));
        
        await addNotification({
          userId: currentUser.id,
          message: `Task "${task.title}" was deleted successfully.`,
          read: true,
          link: 'tasks'
        });
      } else {
        console.error('❌ Failed to delete task - operation returned false');
      }
    } catch (error) {
      console.error('❌ Error deleting task:', error);
      // Could show user-friendly error message here
    }
  }, [currentUser, tasks, teammates, addNotification]);

  // Task Review and Approval Handlers
  const handleApproveTask = useCallback(async (taskId: string) => {
    console.log('✅ Approving task:', taskId);
    
    if (!currentUser) {
      console.error('❌ No current user found');
      return;
    }
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      console.error('❌ Task not found:', taskId);
      return;
    }
    
    const updatedTask = {
      ...task,
      status: TaskStatus.Completed
    };
    
    try {
      // Update task status in database
      const result = await DatabaseOperations.updateTask(updatedTask);
      
      if (result) {
        console.log('✅ Task approved and marked as completed:', result);
        // Update local state
        setTasks(prev => prev.map(t => t.id === taskId ? result : t));
        
        // Notify the task assignee
        const assignee = teammates.find(t => t.id === task.assignedToId);
        if (assignee) {
          await addNotification({
            userId: assignee.id,
            message: `Your task "${task.title}" has been approved and marked as completed!`,
            read: false,
            link: `taskDetail/${task.id}`
          });
        }
      } else {
        console.error('❌ Failed to approve task - no data returned');
      }
    } catch (error) {
      console.error('❌ Error approving task:', error);
    }
  }, [tasks, teammates, currentUser, addNotification]);
  
  const handleRequestRevision = useCallback(async (taskId: string, revisionMessage?: string) => {
    console.log('🔄 Requesting revision for task:', taskId);
    
    if (!currentUser) {
      console.error('❌ No current user found');
      return;
    }
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      console.error('❌ Task not found:', taskId);
      return;
    }
    
    const updatedTask = {
      ...task,
      status: TaskStatus.RevisionRequired,
      revisionNote: revisionMessage || 'Please review and make necessary revisions.'
    };
    
    try {
      // Update task status in database
      const result = await DatabaseOperations.updateTask(updatedTask);
      
      if (result) {
        console.log('✅ Task marked for revision:', result);
        // Update local state
        setTasks(prev => prev.map(t => t.id === taskId ? result : t));
        
        // Notify the task assignee
        const assignee = teammates.find(t => t.id === task.assignedToId);
        if (assignee) {
          const message = revisionMessage 
            ? `Your task "${task.title}" requires revision: ${revisionMessage}`
            : `Your task "${task.title}" requires revision. Please review and resubmit.`;
          
          await addNotification({
            userId: assignee.id,
            message: message,
            read: false,
            link: `taskDetail/${task.id}`
          });
        }
        
        // Notify other reviewers (CEO and task assigner if different)
        const reviewers = [];
        
        // Add CEO
        const ceo = teammates.find(t => t.role === 'CEO');
        if (ceo && ceo.id !== currentUser.id && ceo.id !== assignee?.id) {
          reviewers.push(ceo);
        }
        
        // Add task assigner if different from CEO and current user
        const assigner = teammates.find(t => t.id === task.assignedById);
        if (assigner && assigner.id !== currentUser.id && assigner.id !== ceo?.id && assigner.id !== assignee?.id) {
          reviewers.push(assigner);
        }
        
        // Send notifications to other reviewers
        const reviewerNotifications = reviewers.map(async (reviewer) => {
          return addNotification({
            userId: reviewer.id,
            message: `${currentUser.name} requested revision for task "${task.title}".`,
            read: false,
            link: `taskDetail/${task.id}`
          });
        });
        
        await Promise.all(reviewerNotifications);
      } else {
        console.error('❌ Failed to request revision - no data returned');
      }
    } catch (error) {
      console.error('❌ Error requesting revision:', error);
    }
  }, [tasks, teammates, currentUser, addNotification]);
  
  const handleLogTime = useCallback((log: Omit<TimeLog, 'id'>) => {
    setTimeLogs(prev => [{ ...log, id: `log_${new Date().getTime()}` } as TimeLog, ...prev]);
  }, []);

  const handleUpdateSalaryStatus = useCallback((salaryId: string, status: SalaryStatus) => {
    const salaryToUpdate = salaries.find(s => s.id === salaryId);
    
    if (salaryToUpdate) {
        setSalaries(prev => prev.map(s => s.id === salaryId ? { ...s, status } : s));
    } else if (salaryId.startsWith('temp-')) {
        const teammateId = salaryId.replace('temp-', '');
        const teammate = teammates.find(e => e.id === teammateId);
        if (teammate && teammate.salary) {
            const newSalary: Salary = {
                id: `sal_${new Date().getTime()}`,
                teammateId: teammate.id,
                month: new Date().getMonth(),
                year: new Date().getFullYear(),
                amount: teammate.salary / 12,
                status: status
            };
            setSalaries(prev => [...prev, newSalary]);
        }
    }
  }, [salaries, teammates]);

  const handleClockIn = useCallback((teammateId: string) => {
    const newAttendance: Attendance = {
      id: `att_${new Date().getTime()}`,
      teammateId,
      date: new Date().toISOString().split('T')[0],
      status: AttendanceStatus.Present,
      checkInTime: new Date().toISOString(),
    };
    setAttendance(prev => [...prev, newAttendance]);
  }, []);

  const handleClockOut = useCallback((attendanceId: string) => {
    setAttendance(prev => prev.map(att => 
      att.id === attendanceId ? { ...att, checkOutTime: new Date().toISOString() } : att
    ));
  }, []);

  const handleUpdateAttendance = useCallback((attendanceId: string, teammateId: string, date: string, status: AttendanceStatus) => {
     const existingRecord = attendance.find(a => a.id === attendanceId || (a.teammateId === teammateId && a.date === date));
     
     if (existingRecord) {
         setAttendance(prev => prev.map(a => a.id === existingRecord.id ? {...a, status} : a));
     } else {
         const newRecord: Attendance = {
             id: `att_${new Date().getTime()}`,
             teammateId,
             date,
             status,
         };
         setAttendance(prev => [...prev, newRecord]);
     }
  }, [attendance]);
  
  const handleAddComment = useCallback((parentId: string, text: string) => {
    if (!currentUser || !text.trim()) return;
    const newComment: Comment = {
        id: `comment_${new Date().getTime()}`,
        parentId,
        authorId: currentUser.id,
        text: text.trim(),
        timestamp: new Date().toISOString(),
    };
    setComments(prev => [...prev, newComment]);
  }, [currentUser]);

  const handleApproveUpdate = useCallback(async (updateId: string) => {
    const update = pendingUpdates.find(u => u.id === updateId);
    if (!update || !currentUser) return;

    if (update.type === 'project') {
        const originalProject = projects.find(p => p.id === update.itemId);
        if (!originalProject) return;

        const updatedData = { ...originalProject, ...update.data } as Project;

        const originalMembers = new Set(originalProject.teamMemberIds);
        const updatedMembers = new Set(updatedData.teamMemberIds);
        
        if (JSON.stringify(Array.from(originalMembers).sort()) !== JSON.stringify(Array.from(updatedMembers).sort())) {
            const newMembers = updatedData.teamMemberIds.filter((id: string) => !originalMembers.has(id));
            if (newMembers.length > 0) {
                const newAcceptance = { ...(updatedData.acceptance || {}) };
                const assignedAt = new Date().toISOString();
                newMembers.forEach((id: string) => {
                    newAcceptance[id] = { status: ProjectAcceptanceStatus.Pending, assignedAt };
                });
                updatedData.acceptance = newAcceptance;
            }
        }

        setProjects(prev => prev.map(p => p.id === update.itemId ? updatedData : p));
    } else if (update.type === 'task') {
        // Check if this is a deletion request
        if ((update.data as any)._action === 'delete') {
          // Handle task deletion
          const success = await DatabaseOperations.deleteTask(update.itemId);
          if (success) {
            setTasks(prev => prev.filter(t => t.id !== update.itemId));
            // Send notification to requester
            await addNotification({
              userId: update.requestedBy,
              message: `Your request to delete task "${(update.originalData as Task).title}" has been approved.`,
              read: false,
              link: 'tasks'
            });
          }
        } else {
          // Handle task update
          const result = await DatabaseOperations.updateTask({ ...tasks.find(t => t.id === update.itemId), ...update.data } as Task);
          if (result) {
            setTasks(prev => prev.map(t => t.id === update.itemId ? result : t));
          }
        }
    } else if (update.type === 'teammate') {
        setTeammates(prev => prev.map(t =>
            t.id === update.itemId ? { ...t, role: update.data.role } : t
        ));
    }


    setPendingUpdates(prev => prev.map(u => u.id === updateId ? {
        ...u,
        status: 'approved',
        resolvedAt: new Date().toISOString(),
        resolvedBy: currentUser.id,
    } : u));

    addNotification({
        userId: update.requestedBy,
        message: `Your requested change for ${update.type} has been approved.`,
        read: false,
        link: `${update.type}Detail/${update.itemId}`
    });
  }, [pendingUpdates, addNotification, currentUser, projects]);

  const handleRejectUpdate = useCallback((updateId: string) => {
      const update = pendingUpdates.find(u => u.id === updateId);
      if (!update || !currentUser) return;

      setPendingUpdates(prev => prev.map(u => u.id === updateId ? {
          ...u,
          status: 'rejected',
          resolvedAt: new Date().toISOString(),
          resolvedBy: currentUser.id,
      } : u));

      addNotification({
        userId: update.requestedBy,
        message: `Your requested change for ${update.type} was rejected.`,
        read: false,
        link: `${update.type}Detail/${update.itemId}`
    });
  }, [pendingUpdates, addNotification, currentUser]);
  
  const handleAcceptProjectAssignment = (projectId: string, teammateId: string) => {
    setProjects(prev => prev.map(p => {
        if (p.id === projectId && p.acceptance?.[teammateId]) {
            const newAcceptance = { ...p.acceptance };
            newAcceptance[teammateId] = { ...newAcceptance[teammateId], status: ProjectAcceptanceStatus.Accepted };
            return { ...p, acceptance: newAcceptance };
        }
        return p;
    }));
  };

  const handleExpireProjectAssignment = (projectId: string, teammateId: string) => {
    setProjects(prev => prev.map(p => {
        if (p.id === projectId && p.acceptance?.[teammateId]?.status === ProjectAcceptanceStatus.Pending) {
            const newAcceptance = { ...p.acceptance };
            newAcceptance[teammateId] = { ...newAcceptance[teammateId], status: ProjectAcceptanceStatus.Expired };
            return { ...p, acceptance: newAcceptance };
        }
        return p;
    }));
    
    const project = projects.find(p => p.id === projectId);
    const teammate = teammates.find(t => t.id === teammateId);
    const ceo = teammates.find(t => t.role === 'CEO');
    if (project && teammate && ceo) {
        addNotification({
            userId: ceo.id,
            message: `${teammate.name} did not accept the assignment for project "${project.name}" in time.`,
            read: false,
            link: `projectDetail/${project.id}`
        });
    }
  };

  const renderContent = (currentUser: Teammate) => {
    const [view, id] = activeView.split('/');
    switch (view) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <Dashboard
              projects={projects} 
              tasks={tasks} 
              teammates={approvedTeammates} 
              timeLogs={timeLogs} 
              chartColor={CHART_COLORS[erpSettings.colorScheme]}
              onNavClick={handleNavClick}
              currentUser={currentUser}
              notifications={notifications}
              allTeammates={teammates}
            />
          </div>
        );
      case 'profile':
        return <Profile
            currentUser={currentUser}
            onUpdateProfile={handleUpdateTeammate}
            onChangePassword={handleChangePassword}
            onRequestRoleChange={handleRequestRoleChange}
            roles={erpSettings.roles}
        />;
      case 'teammates':
        return <TeammateManagement teammates={teammates} onAddTeammate={handleAddTeammate} onUpdateTeammate={handleUpdateTeammate} onDeleteTeammate={handleDeleteTeammate} onApproveTeammate={handleApproveTeammate} currentUser={currentUser} currencySymbol={erpSettings.currencySymbol} roles={erpSettings.roles} onAddRole={handleAddRole} />;
      case 'projects':
        return <ProjectManagement projects={projects} tasks={tasks} clients={clients} teammates={approvedTeammates} onAddProject={handleAddProject} onUpdateProject={handleUpdateProject} onRateProject={handleRateProject} currentUser={currentUser} pendingUpdates={pendingUpdates.filter(u=>u.status === 'pending')} onNavClick={handleNavClick} divisions={erpSettings.divisions} onAddClient={handleAddClient} />;
      case 'tasks':
        return <TaskManagement tasks={tasks} projects={projects} teammates={approvedTeammates} currentUser={currentUser} onAddTask={handleAddTask} onEditTask={handleEditTask} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} onRateTask={handleRateTask} clients={clients} divisions={erpSettings.divisions} pendingUpdates={pendingUpdates.filter(u=>u.status === 'pending')} onNavClick={handleNavClick} />;
      case 'time':
        return <TimeTracking timeLogs={timeLogs} teammates={approvedTeammates} currentUser={currentUser} onLogTime={handleLogTime} dailyTimeGoal={erpSettings.dailyTimeGoal} />;
      case 'salary':
        return <SalaryManagement salaries={salaries} teammates={approvedTeammates} onUpdateSalaryStatus={handleUpdateSalaryStatus} currentUser={currentUser} currencySymbol={erpSettings.currencySymbol}/>;
      case 'clients':
        return <ClientManagement clients={clients} onAddClient={handleAddClient} onUpdateClient={handleUpdateClient} onDeleteClient={handleDeleteClient} currentUser={currentUser} />;
      case 'attendance':
        return <AttendanceManagement currentUser={currentUser} teammates={approvedTeammates} attendance={attendance} onClockIn={handleClockIn} onClockOut={handleClockOut} onUpdateAttendance={handleUpdateAttendance} />;
      case 'settings':
        return <ErpSettingsComponent settings={erpSettings} onSettingsChange={setErpSettings} />;
      case 'approvals':
        return <ApprovalManagement pendingUpdates={pendingUpdates.filter(u => u.status === 'pending')} projects={projects} tasks={tasks} teammates={teammates} onApprove={handleApproveUpdate} onReject={handleRejectUpdate} />;
      case 'performance':
        return <PerformanceEvaluation teammates={approvedTeammates} tasks={tasks} />;
      case 'projectDetail': {
        const project = projects.find(p => p.id === id);
        if (!project) return <div className="p-6 text-white">Project not found</div>;
        return <ProjectDetail
            project={project}
            tasks={tasks.filter(t => t.projectId === id)}
            client={clients.find(c => c.id === project.clientId)}
            teammates={approvedTeammates}
            allTeammates={teammates}
            comments={comments.filter(c => c.parentId === id)}
            updateHistory={pendingUpdates.filter(u => u.itemId === id)}
            onNavClick={handleNavClick}
            onAddTask={handleAddTask}
            onUpdateTask={handleProjectTaskUpdate}
            onAddComment={handleAddComment}
            currentUser={currentUser}
            divisions={erpSettings.divisions}
        />;
      }
      case 'taskDetail': {
        const task = tasks.find(t => t.id === id);
        if (!task) return <div className="p-6 text-white">Task not found</div>;
        return <TaskDetail
            task={task}
            project={projects.find(p => p.id === task.projectId)}
            client={clients.find(c => c.id === task.clientId)}
            teammates={approvedTeammates}
            allTeammates={teammates}
            currentUser={currentUser}
            comments={comments.filter(c => c.parentId === id)}
            updateHistory={pendingUpdates.filter(u => u.itemId === id)}
            onAddComment={handleAddComment}
            onUpdateTask={handleUpdateTask}
            onRateTask={handleRateTask}
            onApproveTask={handleApproveTask}
            onRequestRevision={handleRequestRevision}
            onNavClick={handleNavClick}
        />;
      }
      default:
        return <Dashboard 
            projects={projects} 
            tasks={tasks} 
            teammates={approvedTeammates} 
            timeLogs={timeLogs} 
            chartColor={CHART_COLORS[erpSettings.colorScheme]}
            onNavClick={handleNavClick}
            currentUser={currentUser}
            notifications={notifications}
            allTeammates={teammates}
         />;
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950">
      <Sidebar 
        activeView={activeView} 
        onNavClick={handleNavClick} 
        currentUser={currentUser}
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          currentUser={currentUser}
          onLogout={handleLogout}
          notifications={currentUserNotifications}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onSwitchUser={handleSwitchUser}
          allUsers={approvedTeammates}
          companyName={erpSettings.companyName}
          onToggleMobileSidebar={handleToggleMobileSidebar}
          onNavClick={handleNavClick}
        />
        <main className="flex-1 overflow-y-auto">
          {renderContent(currentUser)}
        </main>
      </div>
       <ToastContainer
            assignments={pendingAssignments}
            currentUser={currentUser}
            onAccept={handleAcceptProjectAssignment}
            onExpire={handleExpireProjectAssignment}
        />
    </div>
  );
}

export default App;
