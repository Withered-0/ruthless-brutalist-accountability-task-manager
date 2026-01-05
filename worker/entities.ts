import { IndexedEntity, Entity } from "./core-utils";
import type { Task, TaskBoardState, User } from "@shared/types";
export class UserAccountEntity extends IndexedEntity<User & { passwordHash: string }> {
  static readonly entityName = "user_account";
  static readonly indexName = "user_accounts";
  static readonly initialState = { id: "", email: "", passwordHash: "", nickname: "" };
  static async findByEmail(env: any, email: string): Promise<(User & { passwordHash: string }) | null> {
    // In a real app, you'd use a dedicated email-to-id index. 
    // For this template, we'll iterate or use a naming convention for the ID.
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
    stolenValor: [],
    failureRate: 0,
    lastCalculatedAt: Date.now(),
    nickname: "",
    lockoutUntil: 0
  };
  async addTask(task: Task): Promise<TaskBoardState> {
    return this.mutate(s => ({
      ...s,
      tasks: [task, ...s.tasks]
    }));
  }
  async updateTaskStatus(taskId: string, status: Task['status']): Promise<TaskBoardState> {
    return this.mutate(s => {
      let lockoutUntil = s.lockoutUntil || 0;
      if (status === 'ABANDONED') {
        lockoutUntil = Date.now() + 30000; // 30s lockout
      }
      const tasks = s.tasks.map(t => t.id === taskId ? { ...t, status } : t);
      return { ...s, tasks, lockoutUntil };
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
      // 2. Calculate Failure Rate (Helper-like logic inside DO)
      const failures = updatedTasks.filter(t => t.status === 'OVERDUE' || t.status === 'ABANDONED').length;
      const total = updatedTasks.length;
      const rawRate = total === 0 ? 0 : (failures / total) * 100;
      // Boss Logic: Stolen Valor
      let finalTasks = [...updatedTasks];
      let stolen = [...(s.stolenValor || [])];
      // If failure rate is insanely high (>150% conceptually or just high)
      // Here we use a threshold of 150 calculated as (failures/total)*100 + some penalty
      if (rawRate > 75 && finalTasks.some(t => t.status === 'COMPLETED')) {
        const completedIndex = finalTasks.findIndex(t => t.status === 'COMPLETED');
        if (completedIndex !== -1) {
          const stolenTask = finalTasks.splice(completedIndex, 1)[0];
          stolen.push(stolenTask);
        }
      }
      return { 
        ...s, 
        tasks: finalTasks, 
        stolenValor: stolen, 
        failureRate: rawRate, 
        lastCalculatedAt: now 
      };
    });
  }
  async deleteTask(taskId: string): Promise<TaskBoardState> {
    return this.mutate(s => ({
      ...s,
      tasks: s.tasks.filter(t => t.id !== taskId)
    }));
  }
  async updateTask(taskId: string, updates: Partial<Task>): Promise<TaskBoardState> {
    return this.mutate(s => ({
      ...s,
      tasks: s.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
    }));
  }
}