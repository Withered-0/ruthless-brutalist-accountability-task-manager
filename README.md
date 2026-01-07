# Ruthless Task Manager

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Withered-0/ruthless-brutalist-accountability-task-manager)

A high-performance, full-stack task management application built on Cloudflare Workers with Durable Objects for stateful entities. Features real-time collaboration, indexed entity lists, and a modern React frontend with shadcn/ui components.

## Features

- **Serverless Backend**: Cloudflare Workers with Hono routing and Durable Objects for multi-tenant entity storage (tasks, users, boards).
- **Indexed Entities**: Efficient listing, creation, and deletion of tasks/boards with prefix-based indexes.
- **Type-Safe API**: Shared TypeScript types between frontend and backend.
- **Modern UI**: React 18, Tailwind CSS, shadcn/ui components, TanStack Query for data fetching.
- **Real-time Ready**: Durable Objects enable collaborative features like live task updates.
- **Seed Data**: Pre-populated mock data for quick demos.
- **Responsive Design**: Mobile-first with dark mode and theme support.
- **Production-Ready**: Error handling, CORS, logging, and Cloudflare observability.

## Tech Stack

- **Backend**: Cloudflare Workers, Hono, Durable Objects, TypeScript
- **Frontend**: React, Vite, TypeScript, Tailwind CSS, shadcn/ui, Lucide React, TanStack Query, React Router
- **State & Data**: Zustand, React Hook Form, Zod validation
- **Utilities**: Immer, Framer Motion, Date-fns, UUID
- **Dev Tools**: Bun, ESLint, Wrangler

## Prerequisites

- [Bun](https://bun.sh/) (package manager)
- [Cloudflare Account](https://dash.cloudflare.com/) with Workers enabled
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/installation/) (`bunx wrangler@latest`)

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd ruthless-task-manage-_tyzn9rqwdktuywoxcpmb
   ```

2. Install dependencies:
   ```
   bun install
   ```

3. (Optional) Generate Worker types:
   ```
   bun run cf-typegen
   ```

## Development

1. Start the development server:
   ```
   bun dev
   ```
   - Frontend: http://localhost:3000 (Vite dev server)
   - Backend: Automatically deployed to a preview Worker (via `@cloudflare/vite-plugin`)

2. Open http://localhost:3000 in your browser.

3. Edit `src/pages/HomePage.tsx` for frontend changes or `worker/user-routes.ts` + `worker/entities.ts` for backend entities/APIs.

**Hot Reload**: Frontend auto-reloads. Backend changes require redeploy (`bun dev` restarts Worker).

**Linting**:
```
bun run lint
```

## Usage

### API Endpoints

Extend `worker/user-routes.ts` for custom routes. Current demo includes:

- `GET /api/users` - List users (paginated)
- `POST /api/users` - Create user `{ name: string }`
- `DELETE /api/users/:id` - Delete user
- Similar for `/api/tasks` or custom entities

### Custom Entities

1. Define in `worker/entities.ts` (extend `IndexedEntity`):
   ```ts
   export class TaskEntity extends IndexedEntity<Task> {
     static readonly entityName = "task";
     static readonly indexName = "tasks";
     static readonly initialState: Task = { id: "", title: "", completed: false };
   }
   ```

2. Add routes in `worker/user-routes.ts` using entity statics:
   ```ts
   app.get("/api/tasks", async (c) => ok(c, await TaskEntity.list(c.env)));
   ```

3. Seed data via `static seedData = [...]` and `TaskEntity.ensureSeed(env)`.

Frontend uses `src/lib/api-client.ts` for type-safe fetches.

## Deployment

1. Build the frontend:
   ```
   bun run build
   ```

2. Deploy to Cloudflare Workers:
   ```
   bun run deploy
   ```
   - Deploys Worker + static assets (SPA mode).
   - Sets up Durable Object migrations automatically.

3. Configure custom domain in Cloudflare Dashboard > Workers > Your Worker > Triggers.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Withered-0/ruthless-brutalist-accountability-task-manager)

**Production Tips**:
- Enable **Cloudflare Observability** (already configured).
- Use **KV/R2** for static files if needed.
- Monitor via **Tail Workers** or **Logs**.

## Project Structure

```
├── src/              # React frontend
├── worker/           # Cloudflare Workers backend
├── shared/           # Shared TS types
├── package.json      # Bun dependencies
└── wrangler.jsonc    # Worker config
```

## Customization

- **Add shadcn components**: `bunx shadcn@latest add <component>`
- **Tailwind config**: `tailwind.config.js`
- **New Pages**: Add to `src/main.tsx` router.
- **Entities**: Extend `worker/entities.ts` (DO NOT modify `core-utils.ts`).

## Troubleshooting

- **Worker errors**: Check `wrangler tail`.
- **Types missing**: Run `bun run cf-typegen`.
- **CORS issues**: Pre-configured for `*`.
- **Bun issues**: Ensure Bun >=1.0.

## Contributing

Fork, create a feature branch, and submit a PR. Focus on type safety and performance.

## License

MIT - See [LICENSE](LICENSE) for details.

Built with ❤️ for Cloudflare Workers.