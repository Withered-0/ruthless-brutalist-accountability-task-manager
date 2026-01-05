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
export interface TaskBoardState {
  id: string;
  tasks: Task[];
  failureRate: number;
  lastCalculatedAt: number;
}
export interface User {
  id: string;
  name: string;
}