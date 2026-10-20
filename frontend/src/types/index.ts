export interface User {
  id: string;
  student_id: string;
  email: string;
  full_name: string;
  department: string;
  semester: string;
  timezone: string;
  daily_goal_minutes: number;
  passing_threshold: number;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  category: string;
  due_date?: string;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskStats {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  today_pending: number;
  completion_rate_percentage: number;
}

export interface StudySession {
  id: string;
  subject: string;
  start_time: string;
  end_time?: string;
  duration_seconds: number;
  status: 'ACTIVE' | 'COMPLETED' | 'INTERRUPTED';
  last_heartbeat: string;
  notes?: string;
  created_at: string;
}

export interface DailyStudyPoint {
  date_str: string;
  day_name: string;
  duration_seconds: number;
  duration_minutes: number;
  duration_formatted: string;
}

export interface TimerStatus {
  is_active: boolean;
  current_session: StudySession | null;
  today_total_seconds: number;
  today_total_formatted: string;
  daily_goal_minutes: number;
  goal_progress_percentage: number;
}

export interface StudyAnalytics {
  today_seconds: number;
  today_formatted: string;
  weekly_total_seconds: number;
  weekly_total_formatted: string;
  daily_average_seconds: number;
  daily_average_formatted: string;
  total_sessions_count: number;
  consistency_percentage: number;
  weekly_history: DailyStudyPoint[];
  recent_sessions: StudySession[];
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  event_date: string;
  event_time?: string;
  category: 'EXAM' | 'ASSIGNMENT' | 'PROJECT' | 'REVISION' | 'COLLEGE' | 'STUDY';
  reminder_enabled: boolean;
  reminder_time?: string;
  reminder_sent: boolean;
  created_at: string;
}

export interface Question {
  id: string;
  question_number: number;
  question_text: string;
  question_type: 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  options: string[];
  points: number;
}

export interface Assessment {
  id: string;
  title: string;
  subject_topic: string;
  assessment_type: string;
  difficulty: string;
  time_limit_minutes: number;
  passing_threshold: number;
  question_count: number;
  questions: Question[];
  created_at: string;
}

export interface AssessmentListItem {
  id: string;
  title: string;
  subject_topic: string;
  assessment_type: string;
  difficulty: string;
  time_limit_minutes: number;
  question_count: number;
  latest_percentage?: number | null;
  attempts_count: number;
  created_at: string;
}

export interface QuestionResult {
  question_id: string;
  question_number: number;
  question_text: string;
  question_type: string;
  options: string[];
  student_answer?: string;
  correct_answer: string;
  is_correct: boolean;
  points_awarded: number;
  explanation?: string;
}

export interface AttemptResult {
  attempt_id: string;
  assessment_id: string;
  title: string;
  subject_topic: string;
  score_obtained: number;
  total_possible_score: number;
  percentage: number;
  is_passed: boolean;
  time_spent_seconds: number;
  weak_topics: string[];
  questions: QuestionResult[];
  completed_at: string;
  revision_plan?: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
}

export interface StudySuggestion {
  title: string;
  subject: string;
  reason: string;
  suggested_action: string;
  action_type: 'REVISE_TOPIC' | 'TAKE_QUIZ' | 'STUDY_SESSION' | 'COMPLETE_TASK';
  reference_id?: string;
}

export interface WeakTopicDetail {
  topic: string;
  assessment_title: string;
  percentage: number;
  assessment_id: string;
  attempt_id: string;
  date_flagged: string;
}

export interface SubjectPerformance {
  subject: string;
  assessments_count: number;
  average_score: number;
  status: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT';
}

export interface PerformanceReport {
  total_study_seconds: number;
  total_study_formatted: string;
  weekly_study_seconds: number;
  weekly_study_formatted: string;
  study_consistency_score: number;
  tasks_total: number;
  tasks_completed: number;
  tasks_pending: number;
  task_completion_rate: number;
  total_assessments_taken: number;
  average_assessment_percentage: number;
  highest_assessment_percentage: number;
  latest_assessment_percentage?: number | null;
  weak_topics: WeakTopicDetail[];
  subject_performances: SubjectPerformance[];
  recent_attempts: any[];
  ai_insights: string;
}
