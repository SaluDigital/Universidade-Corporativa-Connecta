export type UserRole = 'admin' | 'manager' | 'employee';
export type UserStatus = 'active' | 'inactive';
export type ContentType = 'video' | 'text' | 'pdf' | 'link' | 'quiz';
export type TrackStatus = 'not_started' | 'in_progress' | 'completed' | 'overdue';
export type CourseStatus = 'not_started' | 'in_progress' | 'completed' | 'failed';
export type LessonStatus = 'not_started' | 'completed';
export type TargetType = 'department' | 'position' | 'manual';

export interface Department {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface Position {
  id: string;
  name: string;
  department_id: string;
  description?: string;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department_id: string;
  department?: Department;
  position_id: string;
  position?: Position;
  manager_id?: string;
  manager?: User;
  hire_date: string;
  status: UserStatus;
  avatar_url?: string;
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail_url?: string;
  video_url?: string;
  workload_hours: number;
  is_active: boolean;
  has_certificate: boolean;
  requires_exam: boolean;
  minimum_grade?: number;
  version: number;
  created_by: string;
  created_at: string;
  modules?: CourseModule[];
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  sort_order: number;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  content_type: ContentType;
  content_url?: string;
  content_html?: string;
  duration_minutes: number;
  sort_order: number;
  is_required: boolean;
}

export interface Track {
  id: string;
  title: string;
  description: string;
  target_type: TargetType;
  deadline_days?: number;
  is_mandatory: boolean;
  is_blocking: boolean;
  is_active: boolean;
  created_by: string;
  created_at: string;
  courses?: TrackCourse[];
  rules?: TrackRule[];
}

export interface TrackCourse {
  id: string;
  track_id: string;
  course_id: string;
  course?: Course;
  sort_order: number;
  is_required: boolean;
}

export interface TrackRule {
  id: string;
  track_id: string;
  department_id?: string;
  position_id?: string;
  auto_assign: boolean;
}

export interface UserTrack {
  id: string;
  user_id: string;
  user?: User;
  track_id: string;
  track?: Track;
  assigned_by?: string;
  assigned_reason?: string;
  assigned_at: string;
  deadline_at?: string;
  status: TrackStatus;
  progress_percent: number;
  completed_at?: string;
}

export interface UserCourseProgress {
  id: string;
  user_id: string;
  course_id: string;
  course?: Course;
  status: CourseStatus;
  progress_percent: number;
  started_at?: string;
  completed_at?: string;
  grade?: number;
  last_access_at?: string;
}

export interface Certificate {
  id: string;
  user_id: string;
  user?: User;
  course_id: string;
  course?: Course;
  certificate_code: string;
  pdf_url?: string;
  issued_at: string;
}

export interface Quiz {
  id: string;
  lesson_id?: string;
  course_id?: string;
  title: string;
  minimum_grade: number;
  attempt_limit: number;
  questions?: QuizQuestion[];
}

export interface ExamAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  passed: boolean;
  attempt_number: number;
  started_at: string;
  finished_at?: string;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: 'single' | 'multiple';
  sort_order: number;
  answers?: QuizAnswer[];
}

export interface QuizAnswer {
  id: string;
  question_id: string;
  answer_text: string;
  is_correct: boolean;
  sort_order: number;
}

export interface UserLessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  status: LessonStatus;
  watched_seconds: number;
  completed_at?: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user?: User;
  action: string;
  entity_type: string;
  entity_id: string;
  ip_address?: string;
  created_at: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalCourses: number;
  totalTracks: number;
  completionRate: number;
  certificatesIssued: number;
  overdueTrack: number;
  pendingTracks: number;
}
