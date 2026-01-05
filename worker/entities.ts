import { IndexedEntity, Entity } from "./core-utils";
import type { Task, TaskBoardState, User } from "@shared/types";
export class UserAccountEntity extends IndexedEntity<User & { passwordHash: string }> {
  static readonly entityName = "user_account";
  static readonly indexName = "user_accounts";
  static readonly initialState = { id: "", email: "", passwordHash: "", nickname: "" };
  static async findByEmail(env: any, email: string): Promise<(User & { passwordHash: string }) | null> {
    const id = btoa(email.toLowerCase());
    const user = new UserAccountEntity(env, id);
    if (await user.exists()) {
      return user.getState();
    }
    return null;
  }
}
export class UserNightmareEntity extends Entity<TaskBoardState> {
  static readonly entityName = "user_nightmare";
  static readonly initialState: TaskBoardState = {
    id: "default",
    tasks: [],
    shameHistory: [],
    stolenValor: [],
    failureRate: 0,
    glitchLevel: 0,
    lastCalculatedAt: Date.now(),
    nickname: "",
    lockoutUntil: 0,
    isCheating: false
  };
  async addTask(task: Task): Promise<TaskBoardState> {
    return this.mutate(s => ({
      ...s,
      tasks: [task, ...s.tasks]
    }));
  }
  async updateTask(taskId: string, updates: Partial<Task>): Promise<TaskBoardState> {
    return this.mutate(s => {
      let isCheating = s.isCheating;
      let lockoutUntil = s.lockoutUntil || 0;
      const taskIndex = s.tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) return s;
      const task = s.tasks[taskIndex];
      // Boss Logic: Detecting Deadline manipulation
      if (updates.deadline && new Date(updates.deadline) > new Date(task.deadline)) {
        isCheating = true; // User is extending a deadline
      }
      if (updates.status === 'ABANDONED') {
        lockoutUntil = Date.now() + 30000; // 30s lockout
      }
      const tasks = s.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
      return { ...s, tasks, lockoutUntil, isCheating };
    });
  }
  async deleteTask(taskId: string): Promise<TaskBoardState> {
    return this.mutate(s => {
      const task = s.tasks.find(t => t.id === taskId);
      if (!task) return s;
      // The Unforgettable Sin: Overdue/Abandoned tasks are never deleted, just moved to history
      const shouldLogToShame = task.status === 'OVERDUE' || task.status === 'ABANDONED';
      const shameHistory = shouldLogToShame ? [...(s.shameHistory || []), task] : (s.shameHistory || []);
      const tasks = s.tasks.filter(t => t.id !== taskId);
      return { ...s, tasks, shameHistory };
    });
  }
  async setNickname(name: string): Promise<TaskBoardState> {
    return this.mutate(s => ({ ...s, nickname: name }));
  }
  async syncDeadlines(): Promise<TaskBoardState> {
    const now = Date.now();
    return this.mutate(s => {
      // 1. Mark Overdue
      const updatedTasks = s.tasks.map(t => {
        if (t.status === 'PENDING' && new Date(t.deadline).getTime() < now) {
          return { ...t, status: 'OVERDUE' as const };
        }
        return t;
      });
      // 2. Calculate Failure Rate
      const failures = updatedTasks.filter(t => t.status === 'OVERDUE' || t.status === 'ABANDONED').length;
      const historyFailures = (s.shameHistory || []).length;
      const total = updatedTasks.length + historyFailures;
      const rawRate = total === 0 ? 0 : ((failures + historyFailures) / total) * 100;
      // 3. Stolen Valor Logic
      let finalTasks = [...updatedTasks];
      let stolen = [...(s.stolenValor || [])];
      if (rawRate > 75 && finalTasks.some(t => t.status === 'COMPLETED')) {
        const completedIndex = finalTasks.findIndex(t => t.status === 'COMPLETED');
        if (completedIndex !== -1) {
          const stolenTask = finalTasks.splice(completedIndex, 1)[0];
          stolen.push(stolenTask);
        }
      }
      // 4. Glitch Level Calculation
      const glitchLevel = Math.min(rawRate + (s.isCheating ? 20 : 0), 100);
      return {
        ...s,
        tasks: finalTasks,
        stolenValor: stolen,
        failureRate: rawRate,
        glitchLevel,
        lastCalculatedAt: now
      };
    });
  }
}