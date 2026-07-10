# CACSMS Contents Backend Architecture

The backend follows an API-first Clean Architecture flow:

```text
Page
-> API Route Handler
-> Controller
-> Service
-> Repository
-> SQL Server
```

Pages must not import repositories or SQL clients. Business logic belongs in services. Repositories only perform persistence operations.

## Domains

- Identity
- Navigation
- Content
- Workflow
- AI
- Operations
- Analytics
- System

## Current Implemented Slice

- Navigation
- System Monitoring dashboards
- Database health
- Live SQL Server data access with explicit errors when the database is unavailable

## Response Standard

All enterprise API responses use:

```ts
{
  success: boolean
  status: 'success' | 'error'
  message: string
  data: unknown
  metadata: Record<string, unknown>
  timestamp: string
  requestId: string
}
```
