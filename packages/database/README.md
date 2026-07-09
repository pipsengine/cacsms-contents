# CACSMS Database Package

This package contains the Microsoft SQL Server connection, repository layer, migration runners, and health-check helpers for CACSMS Contents.

## Environment

Create a local `.env` from `.env.example` and provide:

```env
MSSQL_SERVER=localhost
MSSQL_PORT=1433
MSSQL_DATABASE=db_cacsms-contents
MSSQL_USER=
MSSQL_PASSWORD=
MSSQL_ENCRYPT=false
MSSQL_TRUST_SERVER_CERTIFICATE=true
```

Do not commit real credentials.

## Repositories

Repositories expose the common CRUD shape:

- `findAll()`
- `findById(id)`
- `create(data)`
- `update(id, data)`
- `softDelete(id)`

Dashboard repositories also expose page-specific methods such as `getServiceHealthDashboard()` and `getBackgroundJobsDashboard()`.
