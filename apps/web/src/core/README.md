# CACSMS Contents Enterprise Core Framework

The `src/core` folder contains reusable enterprise engines that all CACSMS Contents modules should depend on.

## Engine Contract

Each engine follows the same boundary:

`API Route -> Controller -> Service -> Repository -> MSSQL`

Pages must call API routes only. Pages must not import repositories or SQL clients.

## Engines

- `identity`: organizations, users, roles, permissions, sessions, login history
- `navigation`: modules, submodules, pages, routes, sidebar sections, sidebar items
- `permissions`: RBAC, page permissions, action permissions, API permissions
- `audit`: audit logs, activity logs, user actions, system actions
- `configuration`: system settings, feature flags, tenant settings
- `monitoring`: service health, API status, database health, queue health, implementation status, workflow status
- `workflow`: definitions, stages, transitions, approvals, execution logs
- `queue`: job queues, workers, background jobs, retry and failed job records
- `notifications`: templates, system notifications, approval notifications, job notifications
- `events`: domain events, event handlers, event logs, subscriptions
- `storage`: asset storage, metadata, file references, providers
- `ai-orchestrator`: providers, models, agents, prompts, agent runs, usage logs

## API

Core engine snapshots are exposed through:

- `/api/v1/core/identity`
- `/api/v1/core/navigation`
- `/api/v1/core/permissions`
- `/api/v1/core/audit`
- `/api/v1/core/configuration`
- `/api/v1/core/monitoring`
- `/api/v1/core/workflow`
- `/api/v1/core/queue`
- `/api/v1/core/notifications`
- `/api/v1/core/events`
- `/api/v1/core/storage`
- `/api/v1/core/ai-orchestrator`

Each response uses the standard envelope:

```json
{
  "success": true,
  "status": "success",
  "message": "Loaded from database.",
  "data": {},
  "metadata": { "source": "database" },
  "timestamp": "2026-07-09T00:00:00.000Z",
  "requestId": "..."
}
```

## Database Setup

1. Copy `.env.example` to `.env`.
2. Fill `MSSQL_SERVER`, `MSSQL_USER`, and `MSSQL_PASSWORD`.
3. Run `npm run db:create`.
4. Run `npm run db:migrate`.
5. Run `npm run db:seed`.
6. Verify with `npm run db:status`.

Credentials must stay in environment variables only.

