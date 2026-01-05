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
  const now = Date.now();
  let decayBonus = 0;
  tasks.forEach(t => {
    if (t.status === 'OVERDUE') {
      const deadlineTime = new Date(t.deadline).getTime();
      const diffMs = now - deadlineTime;
      if (diffMs > 0) {
        const overdueDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        decayBonus += Math.min(overdueDays * 5, 50);
      }
    }
  });
  return Math.min(rawRate + decayBonus, 100);
}
export function getExaggeratedFailureRate(tasks: Task[]): string {
  if (tasks.length === 0) return "0%";
  const overdue = tasks.filter(t => t.status === 'OVERDUE').length;
  if (overdue === 0) return "0%";
  // Exaggerate for psychological impact: -100% per overdue task relative to total
  const factor = (overdue / tasks.length) * -4900;
  return `${Math.round(factor)}%`;
}
export function getLifeWastedEstimate(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  const pendingOrOverdue = tasks.filter(t => t.status === 'PENDING' || t.status === 'OVERDUE').length;
  // Assume each task is 2 hours of wasted potential if not done
  const wastedHours = pendingOrOverdue * 2;
  const totalMonthlyHours = 720; 
  return Math.min((wastedHours / totalMonthlyHours) * 100, 100);
}
export function getSarcasticStatusMessage(tasks: Task[]): string {
  if (tasks.length === 0) return "YOUR EXISTENCE IS A PRODUCTIVITY VACUUM.";
  const completed = tasks.filter(t => t.status === 'COMPLETED').length;
  const rate = (completed / tasks.length) * 100;
  if (rate < 20) return "PATHETIC EFFORT. TRY BREATHING LESS.";
  if (rate < 50) return "BELOW AVERAGE. AS EXPECTED.";
  if (rate < 80) return "MEDIOCRE. YOU'RE STILL A DISAPPOINTMENT.";
  if (rate < 100) {
    const remaining = tasks.length - completed;
    return `DON'T GET COCKY. YOU STILL MISSED ${remaining} THINGS.`;
  }
  return "ALL TASKS DONE? YOU PROBABLY CHEATED.";
}