import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Task } from "@shared/types"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function calculateFailureRate(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  const failures = tasks.filter(t => t.status === 'OVERDUE' || t.status === 'ABANDONED').length;
  const rawRate = (failures / tasks.length) * 100;
  // Aggressive time-based decay logic
  const now = Date.now();
  let decayBonus = 0;
  tasks.forEach(t => {
    if (t.status === 'OVERDUE') {
      const deadlineTime = new Date(t.deadline).getTime();
      const diffMs = now - deadlineTime;
      if (diffMs > 0) {
        const overdueDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        // Aggressive penalty: 5% per day overdue, max 50% extra shame per task
        decayBonus += Math.min(overdueDays * 5, 50);
      }
    }
  });
  return Math.min(rawRate + decayBonus, 100);
}