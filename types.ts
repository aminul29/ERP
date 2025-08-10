
export enum TaskStatus {
  ToDo = 'To Do',
  InProgress = 'In Progress',
  UnderReview = 'Under Review',
  RevisionRequired = 'Revision Required',
  Completed = 'Completed',
}

export enum TaskPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
}

export enum SalaryStatus {
  Pending = 'Pending',
  Paid = 'Paid',
  Delayed = 'Delayed',
}

export enum AttendanceStatus {
    Present = 'Present',
    OnLeave = 'On Leave',
    Absent = 'Absent',
}

export enum Theme {
    Light = 'light',
    Dark = 'dark',
    System = 'system',
}

export enum ColorScheme {
    Gold = 'gold',
    Cyan = 'cyan',
    Blue = 'blue',
    Violet = 'violet',
    Green = 'green',
    Rose = 'rose',
}

export enum ProjectAcceptanceStatus {
    Pending = 'pending',
    Accepted = 'accepted',
    Expired = 'expired',
}

export interface ErpSettings {
    companyName: string;
    dailyTimeGoal: number;
    currencySymbol: string;
    theme: Theme;
    colorScheme: ColorScheme;
    divisions: string[];
    roles: string[];
}

export interface Client {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
}

export interface Teammate {
  id: string;
  name: string;
  role: string;
  joinDate: string;
  salary?: number;
  approved: boolean;
  email?: string;
  phone?: string;
  avatar?: string; // Base64 encoded image
  password?: string;
}

export interface ProjectAcceptance {
    status: ProjectAcceptanceStatus;
    assignedAt: string; // ISO timestamp
}

export interface Project {
  id: string;
  name: string;
  description: string;
  clientId: string;
  startDate: string;
  endDate: string;
  allocatedTimeInSeconds: number;
  priority: TaskPriority;
  divisions: string[];
  teamMemberIds: string[];
  createdById: string;
  ratings?: {
      assigner?: number;
      ceo?: number;
  };
  acceptance?: { [teammateId: string]: ProjectAcceptance };
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  deadline:string;
  priority: TaskPriority;
  projectId?: string;
  clientId?: string;
  divisions?: string[];
  assignedToId: string;
  assignedById: string;
  completionReport?: string;
  workExperience?: 'smooth' | 'issues';
  suggestions?: string;
  completionFiles?: string[];
  driveLink?: string;
  allocatedTimeInSeconds: number;
  timeSpentSeconds: number;
  timerStartTime?: string;
  revisionNote?: string; // Added for storing revision feedback
  ratings?: {
    assigner?: number;
    ceo?: number;
  };
}

export interface TimeLog {
  id: string;
  teammateId: string;
  date: string;
  hours: number;
}

export interface Salary {
  id: string;
  teammateId: string;
  month: number;
  year: number;
  amount: number;
  status: SalaryStatus;
}

export interface Notification {
  id:string;
  userId: string;
  message: string;
  read: boolean;
  timestamp: string;
  link?: string;
}

export interface Attendance {
    id: string;
    teammateId: string;
    date: string; // YYYY-MM-DD
    status: AttendanceStatus;
    checkInTime?: string; // ISO String
    checkOutTime?: string; // ISO String
}

export interface Comment {
    id: string;
    parentId: string; // Project or Task ID
    authorId: string;
    text: string;
    timestamp: string;
    historyItemType?: 'comment';
    readBy?: string[]; // Array of user IDs who have read this comment
}

export type ProjectPendingUpdate = {
  id: string;
  type: 'project';
  itemId: string;
  requestedBy: string; // Teammate ID
  requestedAt: string; // ISO Timestamp
  data: Partial<Project>;
  originalData: Partial<Project>;
  requesterName: string;
  status: 'pending' | 'approved' | 'rejected';
  resolvedAt?: string;
  resolvedBy?: string; // Teammate ID of resolver
  historyItemType?: 'update';
}

export type TaskPendingUpdate = {
  id: string;
  type: 'task';
  itemId: string;
  requestedBy: string; // Teammate ID
  requestedAt: string; // ISO Timestamp
  data: Partial<Task>;
  originalData: Partial<Task>;
  requesterName: string;
  status: 'pending' | 'approved' | 'rejected';
  resolvedAt?: string;
  resolvedBy?: string; // Teammate ID of resolver
  historyItemType?: 'update';
}

export type TeammatePendingUpdate = {
  id: string;
  type: 'teammate';
  itemId: string; // Teammate ID
  requestedBy: string; // Teammate ID
  requestedAt: string; // ISO Timestamp
  data: { role: string; justification: string };
  originalData: { role: string };
  requesterName: string;
  status: 'pending' | 'approved' | 'rejected';
  resolvedAt?: string;
  resolvedBy?: string; // Teammate ID of resolver
  historyItemType?: 'update';
}

export type PendingUpdate = TaskPendingUpdate | ProjectPendingUpdate | TeammatePendingUpdate;