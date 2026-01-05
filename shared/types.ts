export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export type TaskStatus = 'PENDING' | 'COMPLETED' | 'OVERDUE' | 'ABANDONED' | 'EXPIRED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string; // ISO String
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: number;
}
export interface User {
  id: string;
  email: string;
  nickname?: string;
}
export interface TaskBoardState {
  id: string;
  tasks: Task[];
  shameHistory: Task[]; // Permanent record of failures
  stolenValor: Task[];
  failureRate: number;
  glitchLevel: number; // 0-100 driving UI intensity
  lastCalculatedAt: number;
  nickname?: string;
  lockoutUntil?: number;
  isCheating?: boolean; // Flag if user tries to manipulate deadlines
}
export interface AuthResponse {
  user: User;
  token?: string;
}