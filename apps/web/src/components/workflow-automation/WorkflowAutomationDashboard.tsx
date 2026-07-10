'use client'

import { Activity, AlertTriangle, Brain, CheckCircle2, Clock3, Database, ListFilter, Network, Search, ShieldCheck, Sparkles, Workflow, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

type Row = Record<string, unknown>
type DashboardData = {
  summary: Row & { kpis?: Row[] }
  engineStatus: Row
  pipeline: Row[]
  categories: Row[]
  activeInstances: Row[]
  recoveries: Row[]
  queueHealth: Row[]
  definitionHealth: Row[]
  autonomousDecisions: Row[]
  analytics: Row
  finalOutputReadiness: Row
  filters: Record<string, string[]>
  dataSource: string
}
type Envelope<T> = { success: boolean; message: string; data: T }

const emptyData: DashboardData = {
  summary: {},
  engineStatus: {},
  pipeline: [],
  categories: [],
  activeInstances: [],
  recoveries: [],
  queueHealth: [],
  definitionHealth: [],
  autonomousDecisions: [],
  analytics: {},
  finalOutputReadiness: {},
  filters: {},
  dataSource: 'database',
}

function fmt(value: unknown) {
  return value === null || value === undefined || value === '' ? '-' : String(value)
}

function pct(value: unknown) {
  return `${Number(value ?? 0).toFixed(1)}%`
}

function time(value?: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('en-NG', { timeZone: 'Africa/Lagos', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(value))
}

function seconds(value: unknown) {
  const total = Math.max(0, Number(value ?? 0))
  const mins = Math.floor(total / 60)
  return `${mins}m ${Math.round(total % 60)}s`
}

function Pill({ value }: { value: unknown }) {
  const slug = fmt(value).toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return <span className={`wf-auto-pill ${slug}`}>{fmt(value)}</span>
}

function Kpi({ item, icon: Icon }: { item: Row; icon: LucideIcon }) {
  return (
    <article className="wf-auto-kpi">
      <span className={`wf-auto-kpi-icon ${fmt(item.tone)}`}><Icon size={18} /></span>
      <div><small>{fmt(item.label)}</small><b>{fmt(item.value)}</b><p>{fmt(item.note)}</p></div>
    </article>
  )
}

function EngineStatus({ data }: { data: DashboardData }) {
  const items: Array<[string, unknown]> = [
    ['Workflow Engine', data.engineStatus.workflowEngine],
    ['Scheduler', data.engineStatus.scheduler],
    ['Event Bus', data.engineStatus.eventBus],
    ['Queue Manager', data.engineStatus.queueManager],
    ['Worker Fleet', data.engineStatus.workerFleet],
    ['AI Orchestrator', data.engineStatus.aiOrchestrator],
    ['Approval Engine', data.engineStatus.approvalEngine],
    ['Autonomous Recovery', data.engineStatus.autonomousRecovery],
    ['Learning Feedback', data.engineStatus.learningFeedback],
  ]
  return (
    <section className="wf-auto-card wf-auto-status">
      <div className="wf-auto-section-head"><div><h2>Autonomous Workflow Control</h2><p>Engine, queues, workers, AI, approvals, recovery, and learning feedback.</p></div><Pill value={data.engineStatus.operatingMode ?? 'Fully Autonomous'} /></div>
      <div className="wf-auto-status-grid">
        {items.map(([label, value]) => <div key={label}><span>{label}</span><b>{fmt(value)}</b></div>)}
      </div>
      <div className="wf-auto-status-foot">
        <span>Running workflows <b>{fmt(data.summary.activeInstances)}</b></span>
        <span>Queue depth <b>{fmt(data.engineStatus.queueDepth)}</b></span>
        <span>Failed <b>{fmt(data.summary.failed)}</b></span>
        <span>Bottleneck <b>{fmt(data.engineStatus.currentBottleneck)}</b></span>
        <span>Decision confidence <b>{pct(data.engineStatus.decisionConfidence)}</b></span>
        <span>Human attention <b>{fmt(data.engineStatus.humanAttentionRequired)}</b></span>
      </div>
    </section>
  )
}

function Pipeline({ items }: { items: Row[] }) {
  return (
    <section className="wf-auto-card">
      <div className="wf-auto-section-head"><div><h2>End-to-End Workflow Pipeline</h2><p>Trigger through final output, analytics, learning, and completion.</p></div><span>live stages</span></div>
      <div className="wf-auto-pipeline">
        {items.map((stage) => (
          <article key={fmt(stage.stageName)}>
            <span>{fmt(stage.stageOrder)}</span>
            <h3>{fmt(stage.stageName)}</h3>
            <b>{fmt(stage.activeWorkflowCount)}</b>
            <p>{fmt(stage.completedCount)} completed · {fmt(stage.failedCount)} failed</p>
            <small>{seconds(stage.averageDurationSeconds)} avg · {fmt(stage.queueDepth)} queued</small>
            <div><i style={{ width: `${Math.max(0, Math.min(100, Number(stage.healthPercent ?? 0)))}%` }} /></div>
            <em>{fmt(stage.autonomousRecoveryCount)} recoveries · {fmt(stage.currentBlockers)} blockers</em>
          </article>
        ))}
      </div>
    </section>
  )
}

function InstancesTable({ rows, selectedId, onSelect }: { rows: Row[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const heads = ['Instance ID','Workflow Name','Workflow Type','Trigger','Reference','Current Stage','Progress %','Status','Priority','Started At','Elapsed','ETA','AI Agents','Jobs','Approval','Retry','Recovery','Final Output','Owner']
  return (
    <section className="wf-auto-card">
      <div className="wf-auto-section-head"><div><h2>Active Workflow Instances</h2><p>{rows.length} workflow rows from dashboard views.</p></div><span>server-ready</span></div>
      <div className="wf-auto-table-wrap">
        <table className="wf-auto-table">
          <thead><tr>{heads.map((head) => <th key={head}>{head}</th>)}</tr></thead>
          <tbody>
            {rows.map((row) => {
              const id = fmt(row.id)
              return (
                <tr key={id} className={selectedId === id ? 'selected' : ''} onClick={() => onSelect(id)}>
                  <td>{id.slice(0, 8)}</td>
                  <td className="wf-auto-title-cell">{fmt(row.workflowName)}</td>
                  <td>{fmt(row.workflowType)}</td>
                  <td>{fmt(row.triggerType)}</td>
                  <td>{fmt(row.referenceId)}</td>
                  <td>{fmt(row.currentStage)}</td>
                  <td><div className="wf-auto-progress"><i style={{ width: `${Number(row.progressPercent ?? 0)}%` }} /></div>{pct(row.progressPercent)}</td>
                  <td><Pill value={row.status} /></td>
                  <td><Pill value={row.priority} /></td>
                  <td>{time(row.startedAt as string | null)}</td>
                  <td>{seconds(row.elapsedSeconds)}</td>
                  <td>{time(row.estimatedCompletion as string | null)}</td>
                  <td>{fmt(row.aiAgents)}</td>
                  <td>{fmt(row.jobs)}</td>
                  <td>{fmt(row.approvalState)}</td>
                  <td>{fmt(row.retryCount)}</td>
                  <td>{fmt(row.recoveryState)}</td>
                  <td>{fmt(row.finalOutput)}</td>
                  <td>{fmt(row.owner)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Detail({ row }: { row?: Row }) {
  return (
    <aside className="wf-auto-card wf-auto-detail">
      <h2>Workflow Details</h2>
      {!row ? <p>Select a workflow instance to inspect execution, approval, recovery, outputs, jobs, agents, and final readiness.</p> : (
        <>
          <Pill value={row.status} />
          <h3>{fmt(row.workflowName)}</h3>
          <dl>
            {[
              ['Instance', fmt(row.id)],
              ['Version', fmt(row.workflowVersion ?? 'current')],
              ['Trigger', fmt(row.triggerType)],
              ['Reference', fmt(row.referenceId)],
              ['Current Stage', fmt(row.currentStage)],
              ['Progress', pct(row.progressPercent)],
              ['Started', time(row.startedAt as string | null)],
              ['Estimated Completion', time(row.estimatedCompletion as string | null)],
              ['AI Agents', fmt(row.aiAgents)],
              ['Jobs', fmt(row.jobs)],
              ['Approval', fmt(row.approvalState)],
              ['Recovery', fmt(row.recoveryState)],
              ['Final Output', fmt(row.finalOutput)],
              ['Correlation', fmt(row.correlationId)],
            ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
        </>
      )}
    </aside>
  )
}

function Cards({ title, rows, kind }: { title: string; rows: Row[]; kind: 'category' | 'queue' }) {
  return (
    <section className="wf-auto-card">
      <div className="wf-auto-section-head"><div><h2>{title}</h2><p>Database-backed health and throughput summary.</p></div></div>
      <div className="wf-auto-mini-grid">
        {rows.slice(0, 18).map((row) => (
          <article key={fmt(row.id ?? row.queueName ?? row.categoryName)}>
            <h3>{fmt(row.categoryName ?? row.queueName)}</h3>
            <b>{kind === 'category' ? pct(row.healthPercent) : fmt(row.waitingJobs)}</b>
            <p>{kind === 'category' ? `${fmt(row.totalDefinitions)} definitions · ${fmt(row.activeInstances)} active` : `${fmt(row.activeJobs)} active · ${fmt(row.failedJobs)} failed`}</p>
            <small>{kind === 'category' ? `${fmt(row.failedInstances)} failed · ${fmt(row.autoRecoveredInstances)} recovered` : `${pct(row.healthPercent)} health · ${fmt(row.queueStatus)}`}</small>
          </article>
        ))}
      </div>
    </section>
  )
}

function RecoveryAndDecisions({ data }: { data: DashboardData }) {
  return (
    <section className="wf-auto-two">
      <article className="wf-auto-card">
        <div className="wf-auto-section-head"><div><h2>Autonomous Recovery</h2><p>Recovery actions, strategy, checkpoint, confidence, and outcome.</p></div></div>
        <div className="wf-auto-feed">
          {data.recoveries.map((item) => <div key={fmt(item.id)}><b>{fmt(item.workflowName)}</b><span>{fmt(item.recoveryStrategy)} · {fmt(item.recoveryStage)} · {pct(item.confidencePercent)}</span><p>{fmt(item.failureReason)}</p></div>)}
        </div>
      </article>
      <article className="wf-auto-card">
        <div className="wf-auto-section-head"><div><h2>Autonomous Decisions</h2><p>What the system detected, decided, executed, and learned.</p></div></div>
        <div className="wf-auto-feed">
          {data.autonomousDecisions.map((item) => <div key={fmt(item.id)}><b>{fmt(item.decisionTitle)}</b><span>{fmt(item.policyUsed)} · {fmt(item.outcome)} · {pct(item.confidencePercent)}</span><p>{fmt(item.actionTaken)}</p></div>)}
        </div>
      </article>
    </section>
  )
}

export function WorkflowAutomationDashboard() {
  const [data, setData] = useState<DashboardData>(emptyData)
  const [query, setQuery] = useState('')
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({})
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(new Date())

  const url = useMemo(() => {
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    Object.entries(selectedFilters).forEach(([key, value]) => value && value !== 'All' && params.set(key, value))
    return `/api/v1/workflows/dashboard${params.toString() ? `?${params}` : ''}`
  }, [query, selectedFilters])

  const load = useCallback(async () => {
    try {
      const response = await fetch(url, { cache: 'no-store' })
      const payload = (await response.json()) as Envelope<DashboardData>
      if (!response.ok || !payload.success) throw new Error(payload.message)
      setData(payload.data)
      setSelectedId((current) => current ?? fmt(payload.data.activeInstances[0]?.id))
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Workflow dashboard unavailable')
    }
  }, [url])

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0)
    const poll = window.setInterval(() => void load(), 5000)
    return () => {
      window.clearTimeout(initial)
      window.clearInterval(poll)
    }
  }, [load])

  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(clock)
  }, [])

  const selected = data.activeInstances.find((row) => fmt(row.id) === selectedId)
  const icons = [Workflow, Activity, CheckCircle2, Zap, Clock3, AlertTriangle, ShieldCheck, Sparkles, Brain, Network]
  const filterKeys = ['status', 'workflowType', 'priority', 'recoveryState']

  return (
    <main className="wf-auto-page">
      <header className="wf-auto-header">
        <div>
          <nav>Workflow Automation / Workflow Dashboard</nav>
          <h1>Workflow Automation</h1>
          <p>Monitor, recover, and optimize every autonomous workflow across the AI Media Operating System.</p>
          <div className="wf-auto-meta">
            <span><Workflow size={14} /> Workflow Engine: Running</span>
            <span><ShieldCheck size={14} /> Automation Mode: Fully Autonomous</span>
            <span><Database size={14} /> {fmt(data.dataSource)}</span>
            <span><Clock3 size={14} /> {time(data.summary.lastWorkflowEvent as string | null)}</span>
          </div>
        </div>
        <div className="wf-auto-clock">{new Intl.DateTimeFormat('en-NG', { timeZone: 'Africa/Lagos', weekday: 'short', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now)}</div>
      </header>
      {error ? <div className="wf-auto-error">{error}</div> : null}
      <section className="wf-auto-kpis">{(data.summary.kpis ?? []).map((item, index) => <Kpi key={fmt(item.label)} item={item} icon={icons[index] ?? Activity} />)}</section>
      <EngineStatus data={data} />
      <Pipeline items={data.pipeline} />
      <Cards title="Workflow Categories" rows={data.categories} kind="category" />
      <section className="wf-auto-query">
        <label><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search workflow name, code, reference, current stage..." /></label>
        <div>{filterKeys.map((key) => <label key={key}>{key}<select value={selectedFilters[key] ?? 'All'} onChange={(event) => setSelectedFilters({ ...selectedFilters, [key]: event.target.value })}><option>All</option>{(data.filters[key] ?? []).map((value) => <option key={value}>{value}</option>)}</select></label>)}</div>
      </section>
      <section className="wf-auto-main">
        <InstancesTable rows={data.activeInstances} selectedId={selectedId} onSelect={setSelectedId} />
        <Detail row={selected} />
      </section>
      <RecoveryAndDecisions data={data} />
      <section className="wf-auto-two">
        <Cards title="Workflow Queues" rows={data.queueHealth} kind="queue" />
        <article className="wf-auto-card">
          <div className="wf-auto-section-head"><div><h2>Final Output Readiness</h2><p>Final output, analytics, learning, and validation completion.</p></div><Pill value={pct(data.finalOutputReadiness.readinessPercent)} /></div>
          <div className="wf-auto-output-grid">
            <span>Total <b>{fmt(data.finalOutputReadiness.totalWorkflows)}</b></span>
            <span>Ready <b>{fmt(data.finalOutputReadiness.readyOutputs)}</b></span>
            <span>Validated <b>{fmt(data.finalOutputReadiness.validatedOutputs)}</b></span>
            <span>Analytics <b>{fmt(data.finalOutputReadiness.analyticsCompleted)}</b></span>
            <span>Learning <b>{fmt(data.finalOutputReadiness.learningCompleted)}</b></span>
          </div>
          <div className="wf-auto-feed">
            {data.definitionHealth.slice(0, 8).map((item) => <div key={fmt(item.id)}><b>{fmt(item.name)}</b><span>{fmt(item.instances)} instances · {fmt(item.stages)} stages · {pct(item.healthPercent)} health</span></div>)}
          </div>
        </article>
      </section>
      <section className="wf-auto-card wf-auto-footer-note"><ListFilter size={18} /><span>Saved views and manual actions are represented by server-side data structures only. Routine workflow operation remains autonomous; operator Start/Stop stays on the landing page.</span></section>
    </main>
  )
}
