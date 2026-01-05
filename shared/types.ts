export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export type TaskStatus = 'PENDING' | 'COMPLETED' | 'OVERDUE' | 'ABANDONED';
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
  stolenValor: Task[];
  failureRate: number;
  lastCalculatedAt: number;
  nickname?: string;
  lockoutUntil?: number;
}
export interface AuthResponse {
  user: User;
  token?: string;
}