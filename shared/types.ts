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
  stolenValor: Task[];  // Tasks seized by the system
  newlyOverdue: string[]; // IDs of tasks that flipped status in last sync
  failureRate: number;
  glitchLevel: number; 
  lastCalculatedAt: number;
  lastAccess: number;    // Last time user fetched the board
  nickname?: string;
  lockoutUntil?: number;
  isCheating?: boolean;
  wasAway?: boolean;     // UI hint if user was gone > 24h
}
export interface AuthResponse {
  user: User;
  token?: string;
}