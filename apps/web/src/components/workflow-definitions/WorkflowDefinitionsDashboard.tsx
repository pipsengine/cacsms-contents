'use client'

import { Activity, AlertTriangle, CheckCircle2, Clock3, Database, FileText, GitBranch, Search, ShieldCheck, Workflow, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

type Row = Record<string, unknown>
type Data = { summary: Row & { kpis?: Row[] }; definitions: Row[]; categories: Row[]; recommendations: Row[]; filters: Record<string, string[]>; savedViews: string[]; dataSource: string }
type Envelope<T> = { success: boolean; message: string; data: T }
const emptyData: Data = { summary: {}, definitions: [], categories: [], recommendations: [], filters: {}, savedViews: [], dataSource: 'database' }

function fmt(value: unknown) { return value === null || value === undefined || value === '' ? '-' : String(value) }
function pct(value: unknown) { return `${Number(value ?? 0).toFixed(1)}%` }
function time(value?: string | null) { return value ? new Intl.DateTimeFormat('en-NG', { timeZone: 'Africa/Lagos', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : '-' }
function seconds(value: unknown) { const total = Math.max(0, Number(value ?? 0)); return `${Math.floor(total / 60)}m ${Math.round(total % 60)}s` }
function slug(value: unknown) { return fmt(value).toLowerCase().replace(/[^a-z0-9]+/g, '-') }
function Pill({ value }: { value: unknown }) { return <span className={`wf-def-pill ${slug(value)}`}>{fmt(value)}</span> }

function Kpi({ item, icon: Icon }: { item: Row; icon: LucideIcon }) {
  return <article className="wf-def-kpi"><span className={`wf-def-kpi-icon ${fmt(item.tone)}`}><Icon size={18} /></span><div><small>{fmt(item.label)}</small><b>{fmt(item.value)}</b><p>{fmt(item.note)}</p></div></article>
}

function HealthOverview({ data }: { data: Data }) {
  const items: Array<[string, unknown]> = [
    ['Valid', data.summary.validDefinitions],
    ['Warning', data.summary.warningDefinitions],
    ['Invalid', data.summary.invalidDefinitions],
    ['Disabled', data.summary.disabledDefinitions],
    ['Missing Recovery', data.summary.missingRecovery],
    ['Missing Final Output', data.summary.missingFinalOutput],
    ['Missing Analytics', data.summary.missingAnalytics],
    ['Missing Learning', data.summary.missingLearning],
    ['Missing Permissions', data.summary.missingPermissions],
    ['Outdated Agents/Models', data.summary.outdatedAgentsModels],
  ]
  return (
    <section className="wf-def-card">
      <div className="wf-def-section-head"><div><h2>Definition Health Overview</h2><p>Validation, readiness, permissions, recovery, analytics, learning, and agent/model freshness.</p></div><Pill value={pct(data.summary.averageHealth)} /></div>
      <div className="wf-def-health-grid">{items.map(([label, value]) => <div key={label}><span>{label}</span><b>{fmt(value)}</b></div>)}</div>
      <div className="wf-def-health-bar">{items.slice(0, 4).map(([label, value]) => <i key={label} className={slug(label)} style={{ width: `${Math.max(4, Number(value ?? 0) * 12)}%` }} title={`${label}: ${value}`} />)}</div>
    </section>
  )
}

function Categories({ categories }: { categories: Row[] }) {
  return (
    <section className="wf-def-card">
      <div className="wf-def-section-head"><div><h2>Workflow Categories</h2><p>Category readiness, execution health, recovery coverage, and final-output readiness.</p></div></div>
      <div className="wf-def-category-grid">{categories.map((category) => <article key={fmt(category.category)}><h3>{fmt(category.category)}</h3><b>{fmt(category.definitionCount)}</b><p>{fmt(category.published)} published / {fmt(category.draft)} draft / {fmt(category.invalid)} invalid</p><small>{pct(category.averageSuccessRate)} success / {seconds(category.averageDurationSeconds)} avg / {pct(category.healthPercent)} health</small></article>)}</div>
    </section>
  )
}

function DefinitionTable({ rows, selectedId, onSelect }: { rows: Row[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const heads = ['Workflow Code','Workflow Name','Category','Type','Current Version','Published Version','Status','Validation','Health','Stages','Transitions','Triggers','AI Agents','Approval Rules','Recovery','Final Output','Success Rate','Avg Duration','Last Execution','Last Updated','Owner','Environment']
  return (
    <section className="wf-def-card">
      <div className="wf-def-section-head"><div><h2>Workflow Definitions</h2><p>{rows.length} executable workflow assets loaded from MSSQL.</p></div><span>server-ready</span></div>
      <div className="wf-def-table-wrap"><table className="wf-def-table"><thead><tr>{heads.map((head) => <th key={head}>{head}</th>)}</tr></thead><tbody>
        {rows.map((row) => <tr key={fmt(row.id)} className={selectedId === fmt(row.id) ? 'selected' : ''} onClick={() => onSelect(fmt(row.id))}>
          <td>{fmt(row.code)}</td><td className="wf-def-title-cell">{fmt(row.name)}</td><td>{fmt(row.category)}</td><td>{fmt(row.workflowType)}</td><td>{fmt(row.currentVersion)}</td><td>{fmt(row.currentPublishedVersion)}</td><td><Pill value={row.status} /></td><td><Pill value={row.validationStatus} /></td><td>{pct(row.healthPercent)}</td><td>{fmt(row.stages)}</td><td>{fmt(row.transitions)}</td><td>{fmt(row.triggers)}</td><td>{fmt(row.aiAgents)}</td><td>{fmt(row.approvalRules)}</td><td>{fmt(row.recoveryPolicy)}</td><td>{fmt(row.finalOutput)}</td><td>{pct(row.successRate)}</td><td>{seconds(row.avgDurationSeconds)}</td><td>{time(row.lastExecution as string | null)}</td><td>{time(row.lastUpdated as string | null)}</td><td>{fmt(row.owner)}</td><td>{fmt(row.environment)}</td>
        </tr>)}
      </tbody></table></div>
    </section>
  )
}

function Details({ row, recommendations }: { row?: Row; recommendations: Row[] }) {
  if (!row) return <aside className="wf-def-card wf-def-detail"><h2>Definition Details</h2><p>Select a definition row to inspect structure, execution, recovery, outputs, validation, performance, and history.</p></aside>
  return (
    <aside className="wf-def-card wf-def-detail">
      <h2>{fmt(row.code)}</h2><Pill value={row.healthStatus} /><h3>{fmt(row.name)}</h3><p>{fmt(row.description)}</p>
      <dl>{([
        ['Category', row.category], ['Type', row.workflowType], ['Owner', row.owner], ['Environment', row.environment], ['Status', row.status], ['Current Version', row.currentVersion], ['Published Version', row.currentPublishedVersion],
        ['Stages', row.stages], ['Transitions', row.transitions], ['Triggers', row.triggers], ['AI Agents', row.aiAgents], ['Approval Rules', row.approvalRules], ['Recovery', row.recoveryPolicy], ['Final Output', row.finalOutput],
        ['Success Rate', pct(row.successRate)], ['Avg Duration', seconds(row.avgDurationSeconds)], ['Last Execution', time(row.lastExecution as string | null)], ['Last Updated', time(row.lastUpdated as string | null)],
      ] as Array<[string, unknown]>).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{fmt(value)}</dd></div>)}</dl>
      <section><h3>Recommendations</h3>{recommendations.filter((rec) => fmt(rec.workflowDefinitionId) === fmt(row.id)).slice(0, 4).map((rec) => <p key={fmt(rec.id)}><b>{fmt(rec.title)}</b><span>{fmt(rec.impact)} / {pct(rec.confidencePercent)}</span></p>)}</section>
    </aside>
  )
}

export function WorkflowDefinitionsDashboard() {
  const [data, setData] = useState<Data>(emptyData)
  const [query, setQuery] = useState('')
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({})
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(new Date())
  const url = useMemo(() => { const params = new URLSearchParams(); if (query.trim()) params.set('q', query.trim()); Object.entries(selectedFilters).forEach(([k, v]) => v && v !== 'All' && params.set(k, v)); return `/api/v1/workflow-definitions${params.toString() ? `?${params}` : ''}` }, [query, selectedFilters])
  const load = useCallback(async () => {
    try {
      const response = await fetch(url, { cache: 'no-store' })
      const payload = (await response.json()) as Envelope<Data>
      if (!response.ok || !payload.success) throw new Error(payload.message)
      setData(payload.data); setSelectedId((current) => current ?? fmt(payload.data.definitions[0]?.id)); setError(null)
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Workflow definitions unavailable') }
  }, [url])
  useEffect(() => { const initial = window.setTimeout(() => void load(), 0); const poll = window.setInterval(() => void load(), 10000); return () => { window.clearTimeout(initial); window.clearInterval(poll) } }, [load])
  useEffect(() => { const clock = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(clock) }, [])
  const selected = data.definitions.find((row) => fmt(row.id) === selectedId)
  const icons = [Workflow, CheckCircle2, FileText, AlertTriangle, GitBranch, ShieldCheck, Activity, Zap, Database, Clock3]
  const filterKeys = ['status', 'validationStatus', 'category', 'workflowType', 'owner', 'environment', 'recoveryPolicy', 'finalOutput']
  return (
    <main className="wf-def-page">
      <header className="wf-def-header"><div><nav>Workflow Automation / Workflow Definitions</nav><h1>Workflow Definitions</h1><p>Live database view of every autonomous workflow definition, readiness signal, version state, validation result, and optimization recommendation.</p><div className="wf-def-meta"><span><Workflow size={14} /> Total {fmt(data.summary.totalDefinitions)}</span><span><CheckCircle2 size={14} /> Published {fmt(data.summary.publishedVersions)}</span><span><AlertTriangle size={14} /> Invalid {fmt(data.summary.invalidDefinitions)}</span><span><Database size={14} /> {fmt(data.dataSource)}</span></div></div><div className="wf-def-clock">{new Intl.DateTimeFormat('en-NG', { timeZone: 'Africa/Lagos', weekday: 'short', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now)}</div></header>
      {error ? <div className="wf-def-error">{error}</div> : null}
      <section className="wf-def-kpis">{(data.summary.kpis ?? []).map((item, index) => <Kpi key={fmt(item.label)} item={item} icon={icons[index] ?? Activity} />)}</section>
      <HealthOverview data={data} />
      <Categories categories={data.categories} />
      <section className="wf-def-query"><label><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search code, name, category, owner..." /></label><div>{filterKeys.map((key) => <label key={key}>{key}<select value={selectedFilters[key] ?? 'All'} onChange={(event) => setSelectedFilters({ ...selectedFilters, [key]: event.target.value })}><option>All</option>{(data.filters[key] ?? []).map((value) => <option key={value}>{value}</option>)}</select></label>)}</div></section>
      <section className="wf-def-main"><DefinitionTable rows={data.definitions} selectedId={selectedId} onSelect={setSelectedId} /><Details row={selected} recommendations={data.recommendations} /></section>
      <section className="wf-def-card wf-def-bottom"><h2>Saved Views</h2><p>{data.savedViews.join(', ')}</p><h2>Autonomous Recommendations</h2>{data.recommendations.slice(0, 8).map((rec) => <p key={fmt(rec.id)}><b>{fmt(rec.name)}:</b> {fmt(rec.title)} / {fmt(rec.impact)} / {pct(rec.confidencePercent)}</p>)}</section>
    </main>
  )
}
