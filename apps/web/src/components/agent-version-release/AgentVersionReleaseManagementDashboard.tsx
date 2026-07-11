'use client'

import { Activity, Boxes, CalendarDays, CheckCircle2, Database, GitBranch, GitCompare, PackageCheck, Rocket, Search, ShieldCheck, TrafficCone, Undo2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

type Row = Record<string, unknown>
type Data = {
  summary: Row & { kpis?: Row[] }
  headerIndicators: Row
  operationsStatus: Row
  componentVersions: Row[]
  releases: Row[]
  domains: Row[]
  lifecycle: Row[]
  dependencies: Row[]
  packages: Row[]
  environments: Row[]
  promotions: Row[]
  deployments: Row[]
  featureFlags: Row[]
  migrations: Row[]
  drift: Row[]
  gates: Row[]
  risks: Row[]
  approvals: Row[]
  health: Row[]
  regressions: Row[]
  rollbacks: Row[]
  recoveries: Row[]
  notes: Row[]
  analytics: Row[]
  traceability: Row[]
  decisions: Row[]
  filters: Record<string, string[]>
  selectedVersion: Row
  selectedRelease: Row
  realtime: Row
  dataSource: string
}
type Envelope<T> = { success: boolean; message: string; data: T }

const emptyData: Data = { summary: {}, headerIndicators: {}, operationsStatus: {}, componentVersions: [], releases: [], domains: [], lifecycle: [], dependencies: [], packages: [], environments: [], promotions: [], deployments: [], featureFlags: [], migrations: [], drift: [], gates: [], risks: [], approvals: [], health: [], regressions: [], rollbacks: [], recoveries: [], notes: [], analytics: [], traceability: [], decisions: [], filters: {}, selectedVersion: {}, selectedRelease: {}, realtime: {}, dataSource: 'database' }
function fmt(v: unknown) { return v === null || v === undefined || v === '' ? '-' : String(v) }
function n(v: unknown) { return Number(v ?? 0) }
function pct(v: unknown) { return `${n(v).toFixed(1)}%` }
function slug(v: unknown) { return fmt(v).toLowerCase().replace(/[^a-z0-9]+/g, '-') }
function clock(d: Date) { return new Intl.DateTimeFormat('en-NG', { timeZone: 'Africa/Lagos', weekday: 'short', year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' }).format(d) }
function Pill({ value }: { value: unknown }) { return <span className={`version-release-pill ${slug(value)}`}>{fmt(value)}</span> }
function Kpi({ item }: { item: Row }) {
  return <article className="version-release-kpi" title={`${fmt(item.label)} / Target ${fmt(item.target)} / Source ${fmt(item.source)}`}><span><PackageCheck size={18} /></span><div><small>{fmt(item.label)}</small><b>{fmt(item.value)}</b><p>{fmt(item.trend)} / target {fmt(item.target)}</p></div></article>
}
function Panel({ title, rows, fields, icon }: { title: string; rows: Row[]; fields: Array<[string, string]>; icon?: ReactNode }) {
  return <section className="version-release-card"><div className="version-release-section-head"><div><h2>{title}</h2><p>{rows.length} live database records loaded.</p></div>{icon}</div><div className="version-release-panel-list">{rows.slice(0, 10).map((row, i) => <article key={fmt(row.id ?? i)}>{fields.map(([label, key]) => <p key={key}><span>{label}</span><b>{fmt(row[key])}</b></p>)}</article>)}</div></section>
}

export function AgentVersionReleaseManagementDashboard() {
  const [data, setData] = useState<Data>(emptyData)
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
  const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState<Date | null>(null)

  const url = useMemo(() => {
    const p = new URLSearchParams()
    if (query.trim()) p.set('q', query.trim())
    Object.entries(filters).forEach(([k, v]) => v && v !== 'All' && p.set(k, v))
    return `/api/v1/version-releases${p.toString() ? `?${p}` : ''}`
  }, [query, filters])

  const load = useCallback(async () => {
    try {
      const r = await fetch(url, { cache: 'no-store' })
      const p = await r.json() as Envelope<Data>
      if (!r.ok || !p.success) throw new Error(p.message)
      setData(p.data)
      setSelectedVersionId((current) => current ?? fmt(p.data.componentVersions[0]?.id))
      setSelectedReleaseId((current) => current ?? fmt(p.data.releases[0]?.id))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Agent Version & Release Management unavailable')
    }
  }, [url])

  useEffect(() => { const t = window.setTimeout(() => void load(), 0); const p = window.setInterval(() => void load(), 10000); return () => { clearTimeout(t); clearInterval(p) } }, [load])
  useEffect(() => { const t = window.setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])

  const selectedVersion = data.componentVersions.find((v) => fmt(v.id) === selectedVersionId) ?? data.selectedVersion
  const selectedRelease = data.releases.find((r) => fmt(r.id) === selectedReleaseId) ?? data.selectedRelease
  const actions = ['Create Release','Create Version','Generate Release Plan','Validate Release','Compare Versions','Promote to Environment','Open Release Calendar','Export Release Report','Emergency Controls']

  return <main className="version-release-page">
    <header className="version-release-header">
      <div>
        <nav>AI Agents / Agent Version & Release Management</nav>
        <h1>Agent Version & Release Management</h1>
        <p>Version, validate, promote, deploy, monitor, and safely restore every component powering the autonomous AI platform.</p>
        <div className="version-release-meta">
          <span><Activity size={14} /> Release Orchestrator: {fmt(data.headerIndicators.releaseOrchestrator)}</span>
          <span><Boxes size={14} /> Version Registry: {fmt(data.headerIndicators.versionRegistry)}</span>
          <span><Rocket size={14} /> Active Releases: {fmt(data.headerIndicators.activeReleases)}</span>
          <span><ShieldCheck size={14} /> Rollback Readiness: {fmt(data.headerIndicators.rollbackReadiness)}</span>
          <span><CheckCircle2 size={14} /> Deployment Success: {fmt(data.headerIndicators.deploymentSuccessRate)}</span>
          <span><Database size={14} /> {fmt(data.headerIndicators.dataSource)}</span>
        </div>
        <div className="version-release-actions">{actions.map((a) => <span key={a}>{a}: governed job</span>)}</div>
      </div>
      <div className="version-release-clock">{now ? clock(now) : 'Loading Nigeria time'}</div>
    </header>

    {error ? <div className="version-release-error">{error}</div> : null}
    <section className="version-release-kpis">{(data.summary.kpis ?? []).map((k) => <Kpi key={fmt(k.key)} item={k} />)}</section>

    <section className="version-release-card">
      <div className="version-release-section-head"><div><h2>Release Operations Status</h2><p>Current mode: {fmt(data.operationsStatus.mode)}. Direct deployment controls are represented as governed queue work, not manual page actions.</p></div><Pill value={data.operationsStatus.mode} /></div>
      <div className="version-release-status-grid">{Object.entries(data.operationsStatus).filter(([k]) => k !== 'mode').map(([k, v]) => <div key={k}><span>{k.replace(/([A-Z])/g, ' $1')}</span><b>{fmt(v)}</b></div>)}</div>
    </section>

    <section className="version-release-card">
      <div className="version-release-section-head"><div><h2>Release Lifecycle</h2><p>Change detection through package build, validation, promotion, deployment, monitoring, rollback, recovery, and learning update.</p></div></div>
      <div className="version-release-lifecycle">{data.lifecycle.map((stage) => <article key={fmt(stage.sequenceNo)}><small>{fmt(stage.sequenceNo)}</small><h3>{fmt(stage.stageName)}</h3><dl><div><dt>Releases</dt><dd>{fmt(stage.releaseCount)}</dd></div><div><dt>Components</dt><dd>{fmt(stage.componentCount)}</dd></div><div><dt>Passed</dt><dd>{fmt(stage.passedCount)}</dd></div><div><dt>Blocked</dt><dd>{fmt(stage.blockedCount)}</dd></div><div><dt>Health</dt><dd>{pct(stage.healthPercent)}</dd></div></dl><p>{fmt(stage.currentBlockers)}</p></article>)}</div>
    </section>

    <section className="version-release-card">
      <div className="version-release-section-head"><div><h2>Version Domain Cards</h2><p>Every AI component family is versioned, covered by rollback, and linked to final-output impact.</p></div></div>
      <div className="version-release-domain-grid">{data.domains.map((d) => <article key={fmt(d.id)}><h3>{fmt(d.domainName)}</h3><strong>{fmt(d.totalVersions)} versions</strong><progress value={n(d.healthPercent)} max={100} /><p>{fmt(d.activeVersion)} active / {pct(d.rollbackCoverage)} rollback / {fmt(d.driftFindings)} drift</p></article>)}</div>
    </section>

    <section className="version-release-query">
      <label><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search components, versions, releases, owners..." /></label>
      <div>{['type','status','environment','risk'].map((key) => <label key={key}>{key}<select value={filters[key] ?? 'All'} onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}><option>All</option>{(data.filters[key] ?? []).map((v) => <option key={v}>{v}</option>)}</select></label>)}</div>
    </section>

    <section className="version-release-main">
      <div>
        <section className="version-release-card version-release-table-card">
          <div className="version-release-section-head"><div><h2>Component Version Registry</h2><p>{data.componentVersions.length} rows from `vw_agent_component_versions` with server-side filtering and live polling.</p></div></div>
          <div className="version-release-table-wrap"><table className="version-release-table"><thead><tr>{['Component Code','Component Name','Type','Current','Production','Latest','Status','Environment','Change','Compatibility','Dependencies','Validation','Tests','Security','Governance','Rollback','Drift','Release','Owner','Final Output'].map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{data.componentVersions.slice(0, 260).map((v) => <tr key={fmt(v.id)} onClick={() => setSelectedVersionId(fmt(v.id))} className={selectedVersionId === fmt(v.id) ? 'selected' : ''}><td>{fmt(v.componentCode)}</td><td className="version-release-title-cell">{fmt(v.componentName)}</td><td>{fmt(v.componentType)}</td><td>{fmt(v.currentVersion)}</td><td>{fmt(v.productionVersion)}</td><td>{fmt(v.latestVersion)}</td><td><Pill value={v.status} /></td><td>{fmt(v.environmentName)}</td><td>{fmt(v.changeType)}</td><td>{fmt(v.compatibility)}</td><td>{fmt(v.dependencyCount)}</td><td>{fmt(v.validationStatus)}</td><td>{fmt(v.testStatus)}</td><td>{fmt(v.securityStatus)}</td><td>{fmt(v.governanceStatus)}</td><td>{fmt(v.rollbackReady)}</td><td>{fmt(v.versionDrift)}</td><td>{fmt(v.releaseCode)}</td><td>{fmt(v.ownerName)}</td><td>{fmt(v.finalOutputImpact)}</td></tr>)}</tbody></table></div>
        </section>

        <section className="version-release-card version-release-table-card">
          <div className="version-release-section-head"><div><h2>Releases Table</h2><p>{data.releases.length} release rows from `vw_agent_releases` with governed deployment state.</p></div></div>
          <div className="version-release-table-wrap"><table className="version-release-table"><thead><tr>{['Release Code','Name','Type','Version','Status','Target','Components','Risk','Dependency','Validation','Tests','Security','Governance','Migration','Rollback','Strategy','Traffic','Health','Final Output','Owner'].map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{data.releases.map((r) => <tr key={fmt(r.id)} onClick={() => setSelectedReleaseId(fmt(r.id))} className={selectedReleaseId === fmt(r.id) ? 'selected' : ''}><td>{fmt(r.releaseCode)}</td><td className="version-release-title-cell">{fmt(r.releaseName)}</td><td>{fmt(r.releaseType)}</td><td>{fmt(r.versionNumber)}</td><td><Pill value={r.status} /></td><td>{fmt(r.targetEnvironment)}</td><td>{fmt(r.componentCount)}</td><td>{fmt(r.changeRisk)}</td><td>{fmt(r.dependencyStatus)}</td><td>{fmt(r.validationStatus)}</td><td>{fmt(r.testStatus)}</td><td>{fmt(r.securityStatus)}</td><td>{fmt(r.governanceStatus)}</td><td>{fmt(r.migrationStatus)}</td><td>{fmt(r.rollbackStatus)}</td><td>{fmt(r.deploymentStrategy)}</td><td>{fmt(r.trafficAllocation)}%</td><td>{pct(r.releaseHealth)}</td><td>{fmt(r.finalOutputImpact)}</td><td>{fmt(r.ownerName)}</td></tr>)}</tbody></table></div>
        </section>
      </div>

      <aside className="version-release-card version-release-detail">
        <h2>Version Details Drawer</h2>
        <h3>{fmt(selectedVersion?.componentCode)}</h3>
        <Pill value={selectedVersion?.status} />
        <dl><div><dt>Component</dt><dd>{fmt(selectedVersion?.componentName)}</dd></div><div><dt>Type</dt><dd>{fmt(selectedVersion?.componentType)}</dd></div><div><dt>Version Diff</dt><dd>{fmt(selectedVersion?.productionVersion)} to {fmt(selectedVersion?.latestVersion)}</dd></div><div><dt>Validation</dt><dd>{fmt(selectedVersion?.validationStatus)} / {fmt(selectedVersion?.testStatus)}</dd></div><div><dt>Rollback</dt><dd>{fmt(selectedVersion?.rollbackReady)}</dd></div><div><dt>Final Output</dt><dd>{fmt(selectedVersion?.finalOutputImpact)}</dd></div></dl>
        <h2>Release Details Drawer</h2>
        <h3>{fmt(selectedRelease?.releaseCode)}</h3>
        <Pill value={selectedRelease?.status} />
        <dl><div><dt>Name</dt><dd>{fmt(selectedRelease?.releaseName)}</dd></div><div><dt>Strategy</dt><dd>{fmt(selectedRelease?.deploymentStrategy)} at {fmt(selectedRelease?.trafficAllocation)}%</dd></div><div><dt>Risk</dt><dd>{fmt(selectedRelease?.changeRisk)}</dd></div><div><dt>Health</dt><dd>{pct(selectedRelease?.releaseHealth)}</dd></div><div><dt>Queue</dt><dd>{fmt(data.realtime.queue)}</dd></div></dl>
      </aside>
    </section>

    <section className="version-release-grid-two">
      <Panel title="AI Release Planning Assistant" rows={data.decisions} fields={[['Decision','decisionName'],['Release','releaseCode'],['Status','decisionStatus'],['Event','eventName']]} icon={<GitBranch size={18} />} />
      <Panel title="Version Comparison Workspace" rows={data.dependencies} fields={[['Release','releaseCode'],['Component','impactedComponent'],['Upstream','upstreamCount'],['Downstream','downstreamCount'],['Compatibility','compatibilityStatus']]} icon={<GitCompare size={18} />} />
      <Panel title="Release Package Management" rows={data.packages} fields={[['Package','packageCode'],['Release','releaseCode'],['Artifacts','artifactCount'],['Checksum','checksumStatus'],['Signature','signatureStatus']]} icon={<PackageCheck size={18} />} />
      <Panel title="Environment Management and Promotion" rows={[...data.environments, ...data.promotions]} fields={[['Environment','environmentName'],['Active Release','activeRelease'],['Health','healthPercent'],['Release','releaseCode'],['Status','status'],['To','toEnvironment']]} icon={<Rocket size={18} />} />
      <Panel title="Deployment Strategies" rows={data.deployments} fields={[['Deployment','deploymentCode'],['Release','releaseCode'],['Strategy','strategy'],['Traffic','trafficAllocation'],['Health','healthPercent']]} icon={<TrafficCone size={18} />} />
      <Panel title="Release Calendar and Trains" rows={data.releases} fields={[['Release','releaseCode'],['Window','startTime'],['Duration','durationMinutes'],['Status','status']]} icon={<CalendarDays size={18} />} />
      <Panel title="Feature Flags and Configuration Drift" rows={[...data.featureFlags.slice(0, 8), ...data.drift.slice(0, 8)]} fields={[['Flag','flagCode'],['Name','flagName'],['Exposure','exposurePercent'],['Drift','driftCode'],['Severity','severity'],['Resolution','resolutionStatus']]} />
      <Panel title="Database Migration Management" rows={data.migrations} fields={[['Migration','migrationCode'],['Release','releaseCode'],['Status','status'],['Rollback','rollbackEligible'],['Validation','validationStatus']]} />
      <Panel title="Validation Gates and Risk" rows={[...data.gates.slice(0, 10), ...data.risks.slice(0, 10)]} fields={[['Gate','gateName'],['Status','gateStatus'],['Pass Rate','passRate'],['Risk','riskLevel'],['Score','riskScore'],['Mitigation','mitigationStatus']]} />
      <Panel title="Approval and Governance Queue" rows={data.approvals} fields={[['Release','releaseCode'],['Type','approvalType'],['Status','status'],['Role','approverRole'],['SLA','slaMinutes']]} />
      <Panel title="Post-Release Validation and Health" rows={data.health} fields={[['Release','releaseCode'],['Availability','availability'],['Quality','quality'],['Reliability','reliability'],['Final Output','finalOutputPerformance']]} />
      <Panel title="Regression, Rollback and Recovery" rows={[...data.regressions, ...data.rollbacks, ...data.recoveries]} fields={[['Regression','regressionCode'],['Release','releaseCode'],['Severity','severity'],['Rollback','rollbackCode'],['Recovery','recoveryCode'],['Status','status']]} icon={<Undo2 size={18} />} />
      <Panel title="Release Notes and Analytics" rows={[...data.notes, ...data.analytics]} fields={[['Release','releaseCode'],['Title','noteTitle'],['Generated','generatedStatus'],['Metric','metricName'],['Value','metricValue'],['Trend','trend']]} />
      <Panel title="Final-Output Traceability" rows={data.traceability} fields={[['Release','releaseCode'],['Outcome','businessOutcome'],['Quality Delta','qualityDelta'],['Audience Delta','audienceDelta'],['Revenue Delta','revenueDelta']]} />
    </section>
  </main>
}
