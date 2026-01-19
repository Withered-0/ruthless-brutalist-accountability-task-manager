import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Task } from "@shared/types"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function calculateFailureRate(tasks: Task[]): number {
  if (!tasks || tasks.length === 0) return 0;
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
  if (!tasks || tasks.length === 0) return "0.0%";
  const overdue = tasks.filter(t => t.status === 'OVERDUE').length;
  const abandoned = tasks.filter(t => t.status === 'ABANDONED').length;
  if (overdue === 0 && abandoned === 0) return "0.0%";
  // Create a terrifyingly large number for the UI
  const factor = ((overdue + abandoned) / tasks.length) * -666.6;
  return `${factor.toFixed(1)}%`;
}
export function getLifeWastedEstimate(tasks: Task[]): number {
  if (!tasks || tasks.length === 0) return 0;
  const pendingOrOverdue = tasks.filter(t => t.status === 'PENDING' || t.status === 'OVERDUE').length;
  // Estimate: each pending task represents 4 hours of potential stress/procrastination
  const wastedHours = pendingOrOverdue * 4;
  const totalMonthlyHours = 720;
  return Math.min((wastedHours / totalMonthlyHours) * 100, 100);
}
export function getSarcasticStatusMessage(tasks: Task[], nickname?: string): string {
  const name = nickname?.toUpperCase() || "PATHETIC_USER";
  if (!tasks || tasks.length === 0) return `HEY ${name}, YOUR EXISTENCE IS A PRODUCTIVITY VACUUM.`;
  const completed = tasks.filter(t => t.status === 'COMPLETED').length;
  const rate = (completed / (tasks.length || 1)) * 100;
  if (rate < 10) return `${name}: TOTAL DISASTER. DELETE YOURSELF.`;
  if (rate < 30) return `${name}: BELOW AVERAGE. AS EXPECTED.`;
  if (rate < 50) return `${name}: MEDIOCRE EFFORT. TRY BREATHING LESS.`;
  if (rate < 80) return `${name}: DON'T GET COCKY. YOU'RE STILL A DISAPPOINTMENT.`;
  if (rate < 100) return `${name}: ALMOST THERE. BUT ALMOST IS FOR LOSERS.`;
  return `${name}: ALL TASKS DONE? YOU DEFINITELY CHEATED.`;
}