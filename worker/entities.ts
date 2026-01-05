import { IndexedEntity } from "./core-utils";
import type { Task, TaskBoardState } from "@shared/types";
export class TaskBoardEntity extends IndexedEntity<TaskBoardState> {
  static readonly entityName = "taskboard";
  static readonly indexName = "taskboards";
  static readonly initialState: TaskBoardState = { 
    id: "default", 
    tasks: [], 
    failureRate: 0,
    lastCalculatedAt: Date.now() 
  };
  async addTask(task: Task): Promise<TaskBoardState> {
    return this.mutate(s => ({
      ...s,
      tasks: [task, ...s.tasks]
    }));
  }
  async updateTaskStatus(taskId: string, status: Task['status']): Promise<TaskBoardState> {
    return this.mutate(s => ({
      ...s,
      tasks: s.tasks.map(t => t.id === taskId ? { ...t, status } : t)
    }));
  }
  async syncDeadlines(): Promise<TaskBoardState> {
    const now = Date.now();
    return this.mutate(s => {
      const updatedTasks = s.tasks.map(t => {
        if (t.status === 'PENDING' && new Date(t.deadline).getTime() < now) {
          return { ...t, status: 'OVERDUE' as const };
        }
        return t;
      });
      return { ...s, tasks: updatedTasks };
    });
  }
}
export class UserEntity extends IndexedEntity<{ id: string; name: string }> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState = { id: "", name: "" };
}