import { Hono } from "hono";
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import type { Env } from './core-utils';
import { UserAccountEntity, UserNightmareEntity } from "./entities";
import { ok, bad } from './core-utils';
import type { Task } from "@shared/types";
type Variables = {
  userId: string;
};
export function userRoutes(app: Hono<{ Bindings: Env; Variables: Variables }>) {
  // --- AUTH ROUTES ---
  app.post('/api/auth/register', async (c) => {
    const { email, password, nickname } = await c.req.json();
    if (!email || !password) return bad(c, 'Email and password required');
    const existing = await UserAccountEntity.findByEmail(c.env, email);
    if (existing) return bad(c, 'Email already in purgatory');
    const userId = btoa(email.toLowerCase());
    const user = await UserAccountEntity.create(c.env, {
      id: userId,
      email,
      passwordHash: password,
      nickname: nickname || "Pathetic User"
    });
    setCookie(c, 'ruthless_session', userId, { httpOnly: true, secure: true, sameSite: 'Strict', maxAge: 86400 });
    return ok(c, { user: { id: user.id, email: user.email, nickname: user.nickname } });
  });
  app.post('/api/auth/login', async (c) => {
    const { email, password } = await c.req.json();
    const user = await UserAccountEntity.findByEmail(c.env, email);
    if (!user || user.passwordHash !== password) {
      return bad(c, 'Invalid credentials. Typical.');
    }
    setCookie(c, 'ruthless_session', user.id, { httpOnly: true, secure: true, sameSite: 'Strict', maxAge: 86400 });
    return ok(c, { user: { id: user.id, email: user.email, nickname: user.nickname } });
  });
  app.post('/api/auth/logout', (c) => {
    deleteCookie(c, 'ruthless_session');
    return ok(c, { message: 'Exiled.' });
  });
  // --- SESSION MIDDLEWARE ---
  app.use('/api/board/*', async (c, next) => {
    const userId = getCookie(c, 'ruthless_session');
    if (!userId) return c.json({ success: false, error: 'Unauthorized. Enter purgatory first.' }, 401);
    c.set('userId', userId);
    await next();
  });
  app.use('/api/user/*', async (c, next) => {
    const userId = getCookie(c, 'ruthless_session');
    if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401);
    c.set('userId', userId);
    await next();
  });
  // --- BOARD ROUTES ---
  app.get('/api/board', async (c) => {
    const userId = c.get('userId');
    const board = new UserNightmareEntity(c.env, userId);
    const state = await board.syncDeadlines();
    return ok(c, state);
  });
  app.post('/api/board/task', async (c) => {
    const userId = c.get('userId');
    const { title, deadline, priority, description } = await c.req.json() as Partial<Task>;
    if (!title || !deadline) return bad(c, 'Title and deadline required');
    const board = new UserNightmareEntity(c.env, userId);
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      description: description || "",
      deadline,
      priority: priority || 'MEDIUM',
      status: 'PENDING',
      createdAt: Date.now(),
    };
    const updated = await board.addTask(newTask);
    return ok(c, updated);
  });
  app.patch('/api/board/task/:id', async (c) => {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const updates = await c.req.json() as Partial<Task>;
    const board = new UserNightmareEntity(c.env, userId);
    const state = await board.getState();
    if (state.lockoutUntil && state.lockoutUntil > Date.now()) {
      return bad(c, 'You are currently locked out for your cowardice.');
    }
    const updated = await board.updateTask(id, updates);
    return ok(c, updated);
  });
  app.delete('/api/board/task/:id', async (c) => {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const board = new UserNightmareEntity(c.env, userId);
    const updated = await board.deleteTask(id);
    return ok(c, updated);
  });
  app.post('/api/user/onboard', async (c) => {
    const userId = c.get('userId');
    const { nickname } = await c.req.json();
    const board = new UserNightmareEntity(c.env, userId);
    const updated = await board.setNickname(nickname);
    return ok(c, updated);
  });
}