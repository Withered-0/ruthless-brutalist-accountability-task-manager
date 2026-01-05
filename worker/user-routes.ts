import { Hono } from "hono";
import type { Env } from './core-utils';
import { TaskBoardEntity } from "./entities";
import { ok, bad, isStr } from './core-utils';
import type { Task } from "@shared/types";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  const DEFAULT_BOARD_ID = "main_board";
  app.get('/api/board', async (c) => {
    const board = new TaskBoardEntity(c.env, DEFAULT_BOARD_ID);
    await board.syncDeadlines();
    const state = await board.getState();
    return ok(c, state);
  });
  app.post('/api/board/task', async (c) => {
    const { title, deadline, priority } = await c.req.json() as Partial<Task>;
    if (!title || !deadline) return bad(c, 'Title and deadline required');
    const board = new TaskBoardEntity(c.env, DEFAULT_BOARD_ID);
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      description: "",
      deadline,
      priority: priority || 'MEDIUM',
      status: 'PENDING',
      createdAt: Date.now(),
    };
    const updated = await board.addTask(newTask);
    return ok(c, updated);
  });
  app.patch('/api/board/task/:id', async (c) => {
    const id = c.req.param('id');
    const { status } = await c.req.json() as { status: Task['status'] };
    if (!status) return bad(c, 'Status required');
    const board = new TaskBoardEntity(c.env, DEFAULT_BOARD_ID);
    const updated = await board.updateTaskStatus(id, status);
    return ok(c, updated);
  });
}