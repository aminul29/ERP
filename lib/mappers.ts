import { 
  Teammate, Client, Project, Task, TimeLog, Salary, 
  Notification, Attendance, Comment, PendingUpdate, ErpSettings, Announcement 
} from '../types';

// Map database row to Teammate interface
export const mapTeammate = (row: any): Teammate => ({
  id: row.id,
  name: row.name,
  role: row.role,
  joinDate: row.join_date,
  salary: row.salary,
  approved: row.approved,
  email: row.email,
  phone: row.phone,
  avatar: row.avatar,
  password: row.password
});

// Map database row to Client interface
export const mapClient = (row: any): Client => ({
  id: row.id,
  name: row.name,
  contactPerson: row.contact_person,
  email: row.email,
  phone: row.phone
});

// Map database row to Project interface
export const mapProject = (row: any): Project => ({
  id: row.id,
  name: row.name,
  description: row.description,
  clientId: row.client_id,
  startDate: row.start_date,
  endDate: row.end_date,
  allocatedTimeInSeconds: row.allocated_time_in_seconds,
  priority: row.priority,
  divisions: row.divisions || [],
  teamMemberIds: row.team_member_ids || [],
  createdById: row.created_by_id,
  ratings: row.ratings || {},
  acceptance: row.acceptance || {}
});

// Map database row to Task interface
export const mapTask = (row: any): Task => ({
  id: row.id,
  title: row.title,
  description: row.description,
  status: row.status,
  deadline: row.deadline,
  priority: row.priority,
  projectId: row.project_id,
  clientId: row.client_id,
  divisions: row.divisions || [],
  assignedToId: row.assigned_to_id,
  assignedById: row.assigned_by_id,
  completionReport: row.completion_report,
  workExperience: row.work_experience,
  suggestions: row.suggestions,
  completionFiles: row.completion_files || [],
  driveLink: row.drive_link,
allocatedTimeInSeconds: row.allocated_time_in_seconds,
  timeSpentSeconds: row.time_spent_seconds,
  timerStartTime: row.timer_start_time,
  revisionNote: row.revision_note,
  ratings: row.ratings || {}
});

// Map database row to TimeLog interface
export const mapTimeLog = (row: any): TimeLog => ({
  id: row.id,
  teammateId: row.teammate_id,
  date: row.date,
  hours: row.hours
});

// Map database row to Salary interface
export const mapSalary = (row: any): Salary => ({
  id: row.id,
  teammateId: row.teammate_id,
  month: row.month,
  year: row.year,
  amount: row.amount,
  status: row.status
});

// Map database row to Notification interface
export const mapNotification = (row: any): Notification => ({
  id: row.id,
  userId: row.user_id,
  message: row.message,
  read: row.read,
  timestamp: row.timestamp || row.created_at,
  link: row.link
});

// Map database row to Attendance interface
export const mapAttendance = (row: any): Attendance => ({
  id: row.id,
  teammateId: row.teammate_id,
  date: row.date,
  status: row.status,
  checkInTime: row.check_in_time,
  checkOutTime: row.check_out_time
});

// Map database row to Comment interface
export const mapComment = (row: any): Comment => ({
  id: row.id,
  parentId: row.parent_id,
  authorId: row.author_id,
  text: row.text,
  timestamp: row.created_at,
  readBy: row.read_by || []
});

// Map database row to PendingUpdate interface
export const mapPendingUpdate = (row: any): PendingUpdate => ({
  id: row.id,
  type: row.type,
  itemId: row.item_id,
  requestedBy: row.requested_by,
  requesterName: row.requester_name,
  requestedAt: row.requested_at,
  data: row.data,
  originalData: row.original_data,
  status: row.status,
  resolvedAt: row.resolved_at,
  resolvedBy: row.resolved_by
} as PendingUpdate);

// Map database row to Announcement interface
export const mapAnnouncement = (row: any): Announcement => ({
  id: row.id,
  title: row.title,
  content: row.content,
  priority: row.priority,
  targetAudience: row.target_audience,
  targetRoles: row.target_roles || [],
  createdBy: row.created_by,
  createdAt: row.created_at,
  expiresAt: row.expires_at,
  isActive: row.is_active,
  viewedBy: row.viewed_by || []
});

// Map database row to ErpSettings interface
export const mapErpSettings = (row: any): ErpSettings => ({
  companyName: row.company_name,
  dailyTimeGoal: row.daily_time_goal,
  currencySymbol: row.currency_symbol,
  theme: row.theme,
  colorScheme: row.color_scheme,
  divisions: row.divisions || [],
  roles: row.roles || []
});
