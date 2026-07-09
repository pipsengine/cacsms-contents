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
- Mock fallback when MSSQL is unavailable

## Response Standard

All enterprise API responses use:

```ts
{
  success: boolean
  status: 'success' | 'fallback' | 'error'
  message: string
  data: unknown
  metadata: Record<string, unknown>
  timestamp: string
  requestId: string
}
```
