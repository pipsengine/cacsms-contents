# CACSMS Contents MSSQL Database

This directory contains SQL Server database assets.

## Structure

- `migrations`: schema migrations
- `seeds`: seed data
- `schemas`: future schema split files
- `procedures`: stored procedures
- `views`: reporting views
- `indexes`: index-only scripts
- `functions`: scalar/table-valued functions

## Initial Setup

1. Copy `.env.example` to `.env`.
2. Fill in local SQL Server credentials.
3. Run:

```bash
npm install
npm run db:create
npm run db:migrate
npm run db:seed
npm run db:status
```

Core engine migrations are additive and run in filename order. The current enterprise core files are:

- `001_initial_schema.sql`
- `002_enterprise_core_engines.sql`
- `003_workflow_engine_runtime.sql`

Seed files run in filename order and include the 30-module navigation seed plus System Monitoring pages.

## Reset

```bash
npm run db:reset
```

This drops and recreates the configured database. Use carefully.
