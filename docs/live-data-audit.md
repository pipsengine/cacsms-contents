# CACSMS Contents Live Data Audit

Date: 2026-07-11  
Scope: 43 dashboard routes, 43 dashboard components, 37 repository modules, database migrations/seeds 001-043, workflow Start/Stop runtime.

## Definitions

- Green: implemented, database/API backed, no visible mock data, autonomous/read-only, with polling or stream refresh.
- Yellow: implemented and database backed, but contains static descriptive labels, governed-control text, or needs deeper source-by-source review.
- Red: visible placeholder/mock/fake data, missing DB/API binding, or exposed manual mutation flow.

## Executive Status

| Area | Status | Notes |
| --- | --- | --- |
| Landing dashboard | Green | Start/Stop is global, Nigeria time is client-hydrated, system stopped shows 0%, startup progress comes from workflow tables. Placeholder panels were replaced with live workflow summaries. |
| Workflow Start/Stop | Green | Serialized, idempotent system controls create real workflow instances, jobs, steps, logs, status persistence, and stream/poll updates. |
| Workflow runtime | Green | `workflow_definitions`, `workflow_instances`, `workflow_instance_steps`, `background_jobs`, and logs are used end-to-end. |
| Login | Green | Login remains disabled for build mode. |
| Global shell/sidebar | Yellow | Stable layout is in place, but every route still needs visual smoke coverage after each page addition. |
| Implemented pages | Yellow | Pages are DB/API backed, but static header labels and governed-control copy need continued cleanup where they can be misread as live state. |
| Manual controls | Yellow | Routine dashboard actions are governed/read-only; API scan still shows some operational mutation endpoints that should remain disabled or removed from UI until elevated controls are explicitly enabled. |

## Status Matrix

| Page | Implemented | DB-backed | Mock-free | Autonomous | Issues | Next fix |
| --- | --- | --- | --- | --- | --- | --- |
| `/` landing dashboard | Yes | Yes | Yes | Start/Stop only | Needs visual regression coverage | Add Playwright route smoke |
| `/dashboard/system-monitoring/workflow-status` | Yes | Yes | Yes | Yes | Confirm no hidden approval/manual buttons remain | Route smoke and contract assert |
| `/dashboard/system-monitoring/service-health` | Yes | Yes | Yellow | Yes | Static labels may read as live if API omits values | Replace static status labels with API fields |
| `/dashboard/system-monitoring/api-status` | Yes | Yes | Yellow | Yes | Needs endpoint-by-endpoint source verification | Contract assert |
| `/dashboard/system-monitoring/background-jobs` | Yes | Yes | Yes | Yes | Queue refresh currently polling | Add SSE/polling contract note |
| `/dashboard/system-monitoring/implementation-status` | Yes | Yes | Yellow | Yes | Validation/action endpoints must remain governed | 405 smoke for mutations |
| `/dashboard/system-monitoring/incident-management` | Yes | Yes | Yellow | Mostly | Incident action endpoints exist | Keep UI passive or require elevated mode |
| `/dashboard/system-monitoring/logs` | Yes | Yes | Yellow | Yes | Saved-view/action labels are governed copy | Verify no POST buttons |
| `/dashboard/system-monitoring/uptime-monitoring` | Yes | Yes | Yellow | Mostly | Monitor run/pause/resume APIs exist | Ensure no routine manual buttons |
| `/dashboard/workflow-automation` | Yes | Yes | Yellow | Yes | Header says engine running statically | Bind to system status/API |
| `/dashboard/workflow-automation/active-workflows` | Yes | Yes | Yellow | Yes | Header says engine running statically | Bind to runtime status |
| `/dashboard/workflow-automation/actions` | Yes | Yes | Yellow | Yes | Governed action copy is static | Keep read-only, add 405 tests |
| `/dashboard/workflow-automation/automation-rules` | Yes | Yes | Yellow | Yes | Static governance copy | Deeper panel source review |
| `/dashboard/workflow-automation/autonomous-recovery-policies` | Yes | Yes | Yellow | Yes | Header says policy engine running statically | Bind to engine/status row |
| `/dashboard/workflow-automation/failed-workflows` | Yes | Yes | Yellow | Mostly | Recovery action APIs exist | Ensure UI remains governed |
| `/dashboard/workflow-automation/scheduled-workflows` | Yes | Yes | Yellow | Yes | Header says scheduler running statically | Bind to scheduler status |
| `/dashboard/workflow-automation/triggers` | Yes | Yes | Yellow | Yes | Governed action copy | Deeper panel source review |
| `/dashboard/workflow-automation/workflow-analytics` | Yes | Yes | Yellow | Yes | Static analytics contract copy | Deeper panel source review |
| `/dashboard/workflow-automation/workflow-definitions` | Yes | Yes | Yellow | Yes | Definition editor actions are governed | Verify no mutation buttons |
| `/dashboard/workflow-automation/workflow-designer` | Yes | Yes | Yellow | Yes | Designer is read-only build mode | Ensure no save/publish mutation |
| `/dashboard/workflow-automation/workflow-logs` | Yes | Yes | Yellow | Yes | Search/action labels need source review | Contract assert |
| `/dashboard/workflow-automation/workflow-queue` | Yes | Yes | Yellow | Yes | Queue controls must stay governed | 405 smoke for queue mutations |
| `/dashboard/workflow-automation/workflow-templates` | Yes | Yes | Yellow | Yes | Template instantiation actions governed | Verify UI passive |
| `/dashboard/workflow-automation/workflow-versions` | Yes | Yes | Yellow | Yes | Emergency controls are copy-only | Keep 405 mutations |
| `/dashboard/ai-agents/active-agent-runs` | Yes | Yes | Yes | Yes | Header static queued/orchestrator values fixed | Add route smoke |
| `/dashboard/ai-agents/agent-analytics` | Yes | Yes | Yellow | Yes | Header labels come from API, verify all panels | Deeper panel source review |
| `/dashboard/ai-agents/agent-capabilities` | Yes | Yes | Yellow | Yes | Static contract panels may be descriptive | Deeper panel source review |
| `/dashboard/ai-agents/agent-collaboration` | Yes | Yes | Yellow | Yes | Static governed copy | Deeper panel source review |
| `/dashboard/ai-agents/agent-registry` | Yes | Yes | Yellow | Yes | Registry mutations governed | 405 smoke for mutations |
| `/dashboard/ai-agents/agent-roles-and-teams` | Yes | Yes | Yellow | Yes | Static governance copy | Deeper panel source review |
| `/dashboard/ai-agents/agent-tasks` | Yes | Yes | Yellow | Yes | Task actions governed | Verify UI passive |
| `/dashboard/ai-agents/audit-decision-trace` | Yes | Yes | Yellow | Yes | Audit panels are read-only | Contract assert |
| `/dashboard/ai-agents/autonomous-learning-engine` | Yes | Yes | Yellow | Yes | Static engine status risk | Bind status if needed |
| `/dashboard/ai-agents/evaluation-benchmarking` | Yes | Yes | Yellow | Yes | Static governed copy | Deeper panel source review |
| `/dashboard/ai-agents/governance-center` | Yes | Yes | Yellow | Yes | Governance actions must be passive | 405 smoke for mutations |
| `/dashboard/ai-agents/knowledge-base-management` | Yes | Yes | Yellow | Yes | Header values appear API-bound | Verify all panels |
| `/dashboard/ai-agents/memory-management` | Yes | Yes | Yellow | Yes | Static contract panels possible | Deeper panel source review |
| `/dashboard/ai-agents/model-provider-management` | Yes | Yes | Yellow | Yes | Provider actions governed | Verify UI passive |
| `/dashboard/ai-agents/prompt-management` | Yes | Yes | Yellow | Yes | Prompt actions governed | Verify UI passive |
| `/dashboard/ai-agents/rag-management` | Yes | Yes | Yellow | Yes | Static contract panels possible | Deeper panel source review |
| `/dashboard/ai-agents/security-center` | Yes | Yes | Yellow | Yes | Security actions governed | Verify UI passive |
| `/dashboard/ai-agents/simulation-studio` | Yes | Yes | Yellow | Yes | Simulation controls governed | Verify UI passive |
| `/dashboard/ai-agents/tool-registry` | Yes | Yes | Yellow | Yes | Tool actions governed | Verify UI passive |
| `/dashboard/ai-agents/version-release-management` | Yes | Yes | Yellow | Yes | Release actions governed | Verify UI passive |

## Live Data Contract Checklist

Every implemented page must now satisfy this checklist before being called complete:

| Contract Item | Required Evidence |
| --- | --- |
| Database source | Migration/table/view name listed for the module. |
| Seed/migration | Migration and seed exist, or page displays a truthful empty state from an empty query. |
| API source | UI fetches a module API route and handles API failure. |
| UI binding | Metrics, tables, stage progress, and statuses are rendered from API payload fields. |
| Empty state | Empty database result is shown as no records, not as fake placeholder content. |
| Real-time path | SSE or bounded polling documented and working. |
| Autonomy | Routine create/edit/approve/retry/pause/manual action buttons are absent or displayed only as governed read-only state. |
| Final output | Workflow pages expose final output/status fields from workflow/runtime tables where relevant. |
| Test coverage | Route loads, API succeeds, and mutation guardrails are covered by smoke tests. |

## Workflow E2E Contract

The target workflow contract is:

Dashboard Start/Stop or workflow create action -> real `workflow_instances` row -> real `background_jobs` rows -> real `workflow_instance_steps` progress -> persisted status -> SSE/poll UI update -> final output log/reference.

Implemented evidence:

- System Start/Stop uses `/api/v1/system/start`, `/api/v1/system/stop`, `/api/v1/system/status`.
- Content workflow uses `/api/v1/workflows/instances` and `/api/v1/workflows/instances/{id}`.
- Queues are visible through `/api/v1/workflows/queues`.
- New smoke script: `npm run test:e2e:workflow`.

## Next Red/Yellow Fix Queue

1. Replace remaining static header labels such as "Engine: Running" with API/system-status fields.
2. Add route-level visual smoke for sidebar persistence across all 43 implemented routes.
3. Add mutation guardrail tests for workflow, incident, uptime, agent, and registry POST/PATCH routes.
4. Expand the live data contract into per-module docs as pages move from Yellow to Green.
