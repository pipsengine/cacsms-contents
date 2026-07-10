'use client'

import { Activity, AlertTriangle, Brain, CheckCircle2, Clock3, Database, GitBranch, Search, ShieldCheck, Workflow, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

type Row = Record<string, unknown>
type Data = { summary: Row & { kpis?: Row[] }; engineStatus: Row; lifecycle: Row[]; executionLifecycle: Row[]; categories: Row[]; rules: Row[]; conflicts: Row[]; performance: Row[]; recommendations: Row[]; finalOutputImpact: Row[]; filters: Record<string, string[]>; savedViews: string[]; dataSource: string; realtime: Row }
type Envelope<T> = { success: boolean; message: string; data: T }
const emptyData: Data = { summary: {}, engineStatus: {}, lifecycle: [], executionLifecycle: [], categories: [], rules: [], conflicts: [], performance: [], recommendations: [], finalOutputImpact: [], filters: {}, savedViews: [], dataSource: 'database', realtime: {} }

function fmt(value: unknown) { return value === null || value === undefined || value === '' ? '-' : String(value) }
function pct(value: unknown) { return `${Number(value ?? 0).toFixed(1)}%` }
function time(value?: string | null) { return value ? new Intl.DateTimeFormat('en-NG', { timeZone: 'Africa/Lagos', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : '-' }
function slug(value: unknown) { return fmt(value).toLowerCase().replace(/[^a-z0-9]+/g, '-') }
function Pill({ value }: { value: unknown }) { return <span className={`ar-pill ${slug(value)}`}>{fmt(value)}</span> }

function Kpi({ item, icon: Icon, onFilter }: { item: Row; icon: LucideIcon; onFilter: () => void }) {
  return <article className={`ar-kpi ${slug(item.status)}`} onClick={onFilter} title={`${fmt(item.label)} / ${fmt(item.dataSource)}`}><span><Icon size={18} /></span><div><small>{fmt(item.label)}</small><b>{fmt(item.value)}</b><p>{fmt(item.trend)} / {fmt(item.status)}</p></div></article>
}

function EngineStatus({ status }: { status: Row }) {
  const items: Array<[string, unknown]> = [['Rule engine', status.ruleEngineState], ['Event consumer', status.eventConsumerState], ['Condition evaluator', status.conditionEvaluatorState], ['Action executor', status.actionExecutorState], ['Conflict detector', status.conflictDetectorState], ['Recovery engine', status.recoveryEngineState], ['Scheduler', status.schedulerState], ['Idempotency', status.idempotencyEngineState], ['Learning optimizer', status.learningOptimizerState], ['Audit pipeline', status.auditPipelineState], ['Evaluations/sec', status.evaluationsPerSecond], ['Events waiting', status.eventsWaiting], ['Actions in progress', status.actionsInProgress], ['Conflicts', status.conflictsDetected], ['Recoveries', status.recoveriesInProgress], ['Last decision', status.lastAutonomousDecision]]
  return <section className="ar-card"><div className="ar-section-head"><div><h2>Automation Engine Status</h2><p>Rule evaluation, action execution, idempotency, recovery, learning, and audit pipeline state.</p></div><Pill value={status.operatingMode} /></div><div className="ar-status-grid">{items.map(([label, value]) => <div key={label}><span>{label}</span><b>{fmt(value)}</b></div>)}</div></section>
}

function Lifecycle({ title, rows }: { title: string; rows: Row[] }) {
  return <section className="ar-card"><div className="ar-section-head"><div><h2>{title}</h2><p>Rule and execution stages with health, failures, durations, and blockers.</p></div></div><div className="ar-life">{rows.map((row) => <article key={fmt(row.name)}><h3>{fmt(row.name)}</h3><b>{fmt(row.ruleCount)} rules</b><p>{fmt(row.executionCount)} exec / {fmt(row.failureCount)} fail</p><small>{fmt(row.averageDurationMs)} ms / {pct(row.healthPercent)} health / blockers {fmt(row.currentBlockers)}</small></article>)}</div></section>
}

function Categories({ rows }: { rows: Row[] }) {
  return <section className="ar-card"><div className="ar-section-head"><div><h2>Rule Categories</h2><p>Autonomous rule coverage across operating domains.</p></div></div><div className="ar-category-grid">{rows.map((row) => <article key={fmt(row.category)}><h3>{fmt(row.category)}</h3><b>{fmt(row.totalRules)}</b><p>{fmt(row.activeRules)} active / {fmt(row.executionCount)} executions</p><small>{pct(row.successRate)} success / {fmt(row.conflicts)} conflicts / {pct(row.healthPercent)} health</small></article>)}</div></section>
}

function RulesTable({ rows, selectedId, onSelect }: { rows: Row[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const heads = ['Rule Code','Rule Name','Category','Description','Trigger Type','Trigger Source','Conditions','Actions','Priority','Status','Version','Environment','Execution Mode','Success Rate','Avg Evaluation','Executions Today','Failed Actions','Recoveries','Conflict','Last Execution','Next Evaluation','Owner','Organization','Action']
  return <section className="ar-card ar-table-card"><div className="ar-section-head"><div><h2>Automation Rules</h2><p>{rows.length} rules loaded from MSSQL views with polling updates.</p></div><span>server-ready</span></div><div className="ar-table-wrap"><table className="ar-table"><thead><tr>{heads.map((head) => <th key={head}>{head}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={fmt(row.id)} className={selectedId === fmt(row.id) ? 'selected' : ''} onClick={() => onSelect(fmt(row.id))}><td>{fmt(row.ruleCode)}</td><td className="ar-title-cell">{fmt(row.ruleName)}</td><td>{fmt(row.category)}</td><td>{fmt(row.description)}</td><td>{fmt(row.triggerType)}</td><td>{fmt(row.triggerSource)}</td><td>{fmt(row.conditionCount)}</td><td>{fmt(row.actionCount)}</td><td><Pill value={row.priority} /></td><td><Pill value={row.status} /></td><td>{fmt(row.currentVersion)}</td><td>{fmt(row.environment)}</td><td>{fmt(row.executionMode)}</td><td>{pct(row.successRate)}</td><td>{fmt(row.avgEvaluationTime)} ms</td><td>{fmt(row.executionsToday)}</td><td>{fmt(row.failedActions)}</td><td>{fmt(row.recoveries)}</td><td><Pill value={row.conflictStatus} /></td><td>{time(row.lastExecution as string | null)}</td><td>{time(row.nextScheduledEvaluation as string | null)}</td><td>{fmt(row.owner)}</td><td>{fmt(row.organization)}</td><td>{fmt(row.triggerSource)} observed</td></tr>)}</tbody></table></div></section>
}

function Details({ row }: { row?: Row }) {
  if (!row) return <aside className="ar-card ar-detail"><h2>Rule Details</h2><p>Select a rule to inspect trigger, conditions, actions, recovery, guardrails, performance, versioning, and audit context.</p></aside>
  const sections: Array<[string, Array<[string, unknown]>]> = [
    ['Overview', [['Code', row.ruleCode], ['Name', row.ruleName], ['Category', row.category], ['Owner', row.owner], ['Organization', row.organization], ['Environment', row.environment], ['Status', row.status], ['Version', row.currentVersion], ['Effective', time(row.effectiveAt as string | null)], ['Expiry', time(row.expiresAt as string | null)]]],
    ['Trigger', [['Type', row.triggerType], ['Source', row.triggerSource], ['Event', row.ruleName], ['Scope', row.organization], ['Idempotency', `${fmt(row.ruleCode)}:{{reference}}`]]],
    ['Performance', [['Executions', row.executionsToday], ['Success', pct(row.successRate)], ['Failure actions', row.failedActions], ['Evaluation', `${fmt(row.avgEvaluationTime)} ms`], ['Recoveries', row.recoveries], ['Conflict', row.conflictStatus]]],
    ['Guardrails', [['Recovery enabled', row.recoveryEnabled], ['Human escalation', row.humanEscalationEnabled], ['Priority', row.priority], ['Execution mode', row.executionMode], ['Boundary', 'tenant-boundary']]],
  ]
  return <aside className="ar-card ar-detail"><h2>{fmt(row.ruleCode)}</h2><Pill value={row.status} />{sections.map(([title, items]) => <section key={title}><h3>{title}</h3><dl>{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{fmt(value)}</dd></div>)}</dl></section>)}</aside>
}

function Panel({ title, rows, fields }: { title: string; rows: Row[]; fields: Array<[string, string]> }) {
  return <section className="ar-card"><div className="ar-section-head"><div><h2>{title}</h2><p>{rows.length ? 'Database-backed records loaded.' : 'No current records.'}</p></div></div><div className="ar-panel-list">{rows.slice(0, 8).map((row, index) => <article key={fmt(row.id ?? index)}>{fields.map(([label, key]) => <p key={key}><span>{label}</span><b>{fmt(row[key])}</b></p>)}</article>)}</div></section>
}

export function AutomationRulesDashboard() {
  const [data, setData] = useState<Data>(emptyData)
  const [query, setQuery] = useState('')
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({})
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(new Date())
  const url = useMemo(() => { const params = new URLSearchParams(); if (query.trim()) params.set('q', query.trim()); Object.entries(selectedFilters).forEach(([k, v]) => v && v !== 'All' && params.set(k, v)); return `/api/v1/automation-rules${params.toString() ? `?${params}` : ''}` }, [query, selectedFilters])
  const load = useCallback(async () => { try { const response = await fetch(url, { cache: 'no-store' }); const payload = (await response.json()) as Envelope<Data>; if (!response.ok || !payload.success) throw new Error(payload.message); setData(payload.data); setSelectedId((current) => current ?? fmt(payload.data.rules[0]?.id)); setError(null) } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Automation rules unavailable') } }, [url])
  useEffect(() => { const initial = window.setTimeout(() => void load(), 0); const poll = window.setInterval(() => void load(), 10000); return () => { window.clearTimeout(initial); window.clearInterval(poll) } }, [load])
  useEffect(() => { const clock = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(clock) }, [])
  const selected = data.rules.find((row) => fmt(row.id) === selectedId)
  const icons = [Workflow, CheckCircle2, Activity, ShieldCheck, AlertTriangle, Database, GitBranch, Zap, Clock3, Brain]
  const filterKeys = ['status', 'category', 'triggerType', 'environment', 'owner', 'organization', 'priority', 'executionMode', 'conflictStatus']
  return <main className="ar-page"><header className="ar-header"><div><nav>Workflow Automation / Automation Rules</nav><h1>Automation Rules</h1><p>Define, validate, execute, and optimize the autonomous rules that control decisions and actions across the AI Media Operating System.</p><div className="ar-meta"><span><Workflow size={14} /> Automation Engine: Running</span><span><Activity size={14} /> Active {fmt(data.summary.activeRules)}</span><span><Zap size={14} /> Executions {fmt(data.summary.executionsToday)}</span><span><Database size={14} /> {fmt(data.dataSource)}</span></div></div><div className="ar-clock">{new Intl.DateTimeFormat('en-NG', { timeZone: 'Africa/Lagos', weekday: 'short', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now)}</div></header>{error ? <div className="ar-error">{error}</div> : null}<section className="ar-kpis">{(data.summary.kpis ?? []).map((item, index) => <Kpi key={fmt(item.key)} item={item} icon={icons[index] ?? Activity} onFilter={() => setSelectedFilters({ ...selectedFilters, status: fmt(item.key) === 'active' ? 'active' : selectedFilters.status ?? 'All' })} />)}</section><EngineStatus status={data.engineStatus} /><section className="ar-grid-two"><Lifecycle title="Automation Rule Lifecycle" rows={data.lifecycle} /><Lifecycle title="Execution Lifecycle" rows={data.executionLifecycle} /></section><Categories rows={data.categories} /><section className="ar-query"><label><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search rules, categories, owners..." /></label><div>{filterKeys.map((key) => <label key={key}>{key}<select value={selectedFilters[key] ?? 'All'} onChange={(event) => setSelectedFilters({ ...selectedFilters, [key]: event.target.value })}><option>All</option>{(data.filters[key] ?? []).map((value) => <option key={value}>{value}</option>)}</select></label>)}</div></section><section className="ar-main"><RulesTable rows={data.rules} selectedId={selectedId} onSelect={setSelectedId} /><Details row={selected} /></section><section className="ar-grid-two"><Panel title="Rule Conflict Detection" rows={data.conflicts} fields={[['Rule', 'ruleName'], ['Trigger', 'triggerName'], ['Type', 'conflictType'], ['Risk', 'riskScore'], ['Resolution', 'suggestedResolution'], ['Governance', 'governanceReviewRequired']]} /><Panel title="Execution Log" rows={data.performance} fields={[['Rule', 'ruleName'], ['Executions', 'executionCountToday'], ['Success', 'successRate'], ['Failure', 'failureRate'], ['Evaluation', 'avgEvaluationMs'], ['Cost savings', 'costSavings']]} /><Panel title="Autonomous Optimization" rows={data.recommendations} fields={[['Rule', 'ruleName'], ['Type', 'recommendationType'], ['Title', 'title'], ['Impact', 'impact'], ['Confidence', 'confidencePercent'], ['Guardrails', 'insideGuardrails']]} /><Panel title="Final Output Impact" rows={data.finalOutputImpact} fields={[['Rule', 'ruleName'], ['Category', 'category'], ['Impact', 'impactType'], ['Score', 'impactScore'], ['SLA', 'slaImprovementPercent'], ['Outcome', 'outcome']]} /></section><section className="ar-card ar-bottom"><h2>Rule Builder and AI Assistant</h2><p>WHEN / IF / THEN / ELSE / ON FAILURE / AFTER SUCCESS structures are represented by the rule schema and API resources. Routine create, edit, validate, simulate, publish, disable, archive, and conflict-resolution mutations are present as endpoints but return 405 until governed editing is enabled.</p><h2>Saved Views</h2><p>{data.savedViews.join(', ')}</p></section></main>
}
