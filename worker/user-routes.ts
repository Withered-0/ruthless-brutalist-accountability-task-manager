import { Hono } from "hono";
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import type { Env } from './core-utils';
import { UserAccountEntity, UserNightmareEntity } from "./entities";
import { ok, bad } from './core-utils';
import type { Task } from "@shared/types";
const encoder = new TextEncoder();
async function hashPassword(password: string, salt: string): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
type Variables = {
  userId: string;
};
export function userRoutes(app: Hono<{ Bindings: Env; Variables: Variables }>) {
  app.post('/api/auth/register', async (c) => {
    const { email, password, nickname } = await c.req.json();
    if (!email || !password) return bad(c, 'Email and password required');
    const existing = await UserAccountEntity.findByEmail(c.env, email);
    if (existing) return bad(c, 'Email already in purgatory');
    const userId = btoa(email.toLowerCase());
    const passwordHash = await hashPassword(password, userId);
    const user = await UserAccountEntity.create(c.env, {
      id: userId,
      email,
      passwordHash,
      nickname: nickname || "Pathetic User"
    });
    const urlObj = new URL(c.req.url);
    const isSecure = urlObj.protocol === 'https:';
    setCookie(c, 'ruthless_session', userId, { httpOnly: true, secure: isSecure, sameSite: 'lax', maxAge: 2592000 });
    return ok(c, { user: { id: user.id, email: user.email, nickname: user.nickname } });
  });
  app.post('/api/auth/login', async (c) => {
    const { email, password } = await c.req.json();
    const user = await UserAccountEntity.findByEmail(c.env, email);
    if (!user) return bad(c, 'Invalid credentials. Typical.');
    const expectedHash = await hashPassword(password, user.id);
    if (expectedHash !== user.passwordHash) return bad(c, 'Invalid credentials. Typical.');
    const urlObj = new URL(c.req.url);
    const isSecure = urlObj.protocol === 'https:';
    setCookie(c, 'ruthless_session', user.id, { httpOnly: true, secure: isSecure, sameSite: 'lax', maxAge: 2592000 });
    return ok(c, { user: { id: user.id, email: user.email, nickname: user.nickname } });
  });
  app.post('/api/auth/logout', (c) => {
    deleteCookie(c, 'ruthless_session');
    return ok(c, { message: 'Exiled.' });
  });
  app.use('/api/board*', async (c, next) => {
    const userId = getCookie(c, 'ruthless_session');
    if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401);
    c.set('userId', userId);
    await next();
  });
  app.get('/api/board', async (c) => {
    const userId = c.get('userId');
    if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401);
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
      return bad(c, 'Locked out for cowardice.');
    }
    await board.updateTask(id, updates);
    // When a task is updated or viewed, we clear the 'newlyOverdue' queue
    const updated = await board.clearNewFailures();
    return ok(c, updated);
  });
  app.delete('/api/board/task/:id', async (c) => {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const board = new UserNightmareEntity(c.env, userId);
    const updated = await board.deleteTask(id);
    return ok(c, updated);
  });
  app.use('/api/user*', async (c, next) => {
    const userId = getCookie(c, 'ruthless_session');
    if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401);
    c.set('userId', userId);
    await next();
  });

  app.post('/api/user/onboard', async (c) => {
    const userId = c.get('userId');
    const { nickname } = await c.req.json();
    if (!nickname) return bad(c, 'Nickname required');
    const board = new UserNightmareEntity(c.env, userId);
    const updatedBoard = await board.setNickname(nickname);
    const account = new UserAccountEntity(c.env, userId);
    if (await account.exists()) {
      await account.patch({ nickname });
    }
    return ok(c, updatedBoard);
  });
}