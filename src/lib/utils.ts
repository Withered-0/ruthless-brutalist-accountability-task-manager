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
  // Add time-based decay logic if tasks are overdue
  const now = Date.now();
  let decayBonus = 0;
  tasks.forEach(t => {
    if (t.status === 'OVERDUE') {
      const overdueDays = Math.floor((now - new Date(t.deadline).getTime()) / (1000 * 60 * 60 * 24));
      decayBonus += Math.min(overdueDays * 2, 20); // Max 20% extra shame per task
    }
  });
  return Math.min(rawRate + decayBonus, 100);
}