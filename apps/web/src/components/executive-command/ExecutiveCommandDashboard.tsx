'use client'

import { AlertTriangle, BarChart3, BriefcaseBusiness, Building2, CircleDollarSign, Database, FileText, Gauge, LineChart, Search, ShieldCheck, Target, TrendingUp, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

type Row = Record<string, unknown>
type Data = {
  summary: Row
  headerIndicators: Row
  kpis: Row[]
  intelligenceStatus: Row
  valueChain: Row[]
  strategicObjectives: Row[]
  portfolioOverview: Row[]
  initiatives: Row[]
  selectedInitiative: Row
  businessValue: Row[]
  attribution: Row[]
  roi: Row[]
  financial: Row[]
  productivity: Row[]
  adoption: Row[]
  maturity: Row[]
  risks: Row[]
  governance: Row[]
  security: Row[]
  resilience: Row[]
  capacity: Row[]
  investments: Row[]
  organizationComparison: Row[]
  brandComparison: Row[]
  contentPortfolio: Row[]
  platforms: Row[]
  campaigns: Row[]
  workforce: Row[]
  scenarios: Row[]
  forecasts: Row[]
  recommendations: Row[]
  decisionQueue: Row[]
  alerts: Row[]
  reports: Row[]
  reportSchedules: Row[]
  dataQuality: Row[]
  dataLineage: Row[]
  finalOutcomeTraceability: Row[]
  emergencyExecutiveView: Row
  timeline: Row[]
  dataSource: string
  realtime: Row
}
type Envelope<T> = { success: boolean; message: string; data: T }

const emptyData: Data = {
  summary: {}, headerIndicators: {}, kpis: [], intelligenceStatus: {}, valueChain: [], strategicObjectives: [], portfolioOverview: [], initiatives: [], selectedInitiative: {}, businessValue: [], attribution: [], roi: [], financial: [], productivity: [], adoption: [], maturity: [], risks: [], governance: [], security: [], resilience: [], capacity: [], investments: [], organizationComparison: [], brandComparison: [], contentPortfolio: [], platforms: [], campaigns: [], workforce: [], scenarios: [], forecasts: [], recommendations: [], decisionQueue: [], alerts: [], reports: [], reportSchedules: [], dataQuality: [], dataLineage: [], finalOutcomeTraceability: [], emergencyExecutiveView: {}, timeline: [], dataSource: 'database', realtime: {},
}

const icons: LucideIcon[] = [Gauge, Target, TrendingUp, CircleDollarSign, BarChart3, BriefcaseBusiness, Users, LineChart, AlertTriangle, ShieldCheck, Building2, FileText]

function fmt(value: unknown) {
  return value === null || value === undefined || value === '' ? '-' : String(value)
}

function n(value: unknown) {
  return Number(value ?? 0)
}

function pct(value: unknown) {
  return `${n(value).toFixed(1)}%`
}

function money(value: unknown) {
  return `$${n(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

function slug(value: unknown) {
  return fmt(value).toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

function clock(value: Date) {
  return new Intl.DateTimeFormat('en-NG', { timeZone: 'Africa/Lagos', weekday: 'short', year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' }).format(value)
}

function Pill({ value }: { value: unknown }) {
  return <span className={`exec-pill ${slug(value)}`}>{fmt(value)}</span>
}

function KpiCard({ item, icon: Icon }: { item: Row; icon: LucideIcon }) {
  return <article className={`exec-kpi ${slug(item.status)}`} title={fmt(item.tooltip)}>
    <span><Icon size={20} /></span>
    <div>
      <small>{fmt(item.label)}</small>
      <b>{fmt(item.value)}</b>
      <p>{fmt(item.executiveExplanation)}</p>
      <em>{fmt(item.target)} / {fmt(item.confidence)} / {fmt(item.source)}</em>
    </div>
  </article>
}

function Empty({ label }: { label: string }) {
  return <div className="exec-empty">{label} has no live database rows yet.</div>
}

function StatusCard({ status }: { status: Row }) {
  const engineKeys = ['portfolioAnalyticsEngine', 'businessValueAttributionEngine', 'financialAnalyticsEngine', 'strategicObjectiveMonitor', 'aiMaturityEngine', 'executiveRiskEngine', 'investmentAnalyticsEngine', 'capacityForecastingEngine', 'scenarioPlanningEngine', 'crossOrganizationComparisonEngine', 'executiveRecommendationEngine', 'boardReportGenerator', 'dataQualityValidator', 'auditPipeline']
  const metricKeys = ['dataFreshness', 'organizationsReporting', 'brandsReporting', 'initiativesMonitored', 'businessKpisConnected', 'forecastJobsRunning', 'openStrategicRisks', 'recommendationsAwaitingReview', 'currentStrategicBottleneck', 'lastAutonomousExecutiveInsight', 'humanAttentionRequired']
  return <section className="exec-card exec-status">
    <div className="exec-section-head"><div><h2>Executive Intelligence Status</h2><p>Portfolio, value, finance, maturity, risk, investment, capacity, recommendations, reporting, quality, and audit pipeline.</p></div><Pill value={status.currentExecutiveIntelligenceMode} /></div>
    <div className="exec-engine-grid">{engineKeys.map((key) => <div key={key}><span>{key.replace(/([A-Z])/g, ' $1')}</span><b>{fmt(status[key])}</b></div>)}</div>
    <div className="exec-runtime-strip">{metricKeys.map((key) => <span key={key}>{key.replace(/([A-Z])/g, ' $1')}: <b>{fmt(status[key])}</b></span>)}</div>
  </section>
}

function ValueChain({ rows }: { rows: Row[] }) {
  return <section className="exec-card">
    <div className="exec-section-head"><div><h2>Executive Value Chain</h2><p>Business strategy through enterprise value with health, target, actual, variance, forecast, risk, impact, and completeness.</p></div></div>
    {rows.length ? <div className="exec-chain">{rows.map((row) => <article key={fmt(row.stageName)}><h3>{fmt(row.stageName)}</h3><Pill value={row.status} /><strong>{pct(row.currentHealth)}</strong><progress value={n(row.currentHealth)} max={100} /><dl><div><dt>Target</dt><dd>{fmt(row.targetValue)}</dd></div><div><dt>Actual</dt><dd>{fmt(row.actualValue)}</dd></div><div><dt>Risk</dt><dd>{fmt(row.riskLevel)}</dd></div><div><dt>Impact</dt><dd>{fmt(row.businessImpact)}</dd></div></dl></article>)}</div> : <Empty label="Executive value chain" />}
  </section>
}

function ObjectivesTable({ rows }: { rows: Row[] }) {
  const heads = ['Code', 'Strategic Objective', 'Owner', 'Organization', 'Target', 'Actual', 'Progress', 'Forecast', 'Confidence', 'AI Contribution', 'Business Value', 'Risk', 'Status', 'Due Date', 'Action']
  return <section className="exec-card exec-table-card"><div className="exec-section-head"><div><h2>Strategic Objectives</h2><p>{rows.length} executive objectives loaded from the database.</p></div></div><div className="exec-table-wrap"><table className="exec-table"><thead><tr>{heads.map((head) => <th key={head}>{head}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={fmt(row.id)}><td>{fmt(row.objectiveCode)}</td><td className="exec-title-cell">{fmt(row.strategicObjective)}</td><td>{fmt(row.executiveOwner)}</td><td>{fmt(row.organizationName)}</td><td>{fmt(row.targetValue)}</td><td>{fmt(row.actualValue)}</td><td>{pct(row.progressPercent)}</td><td>{fmt(row.forecastValue)}</td><td>{pct(row.confidence)}</td><td>{pct(row.aiContribution)}</td><td>{money(row.businessValue)}</td><td><Pill value={row.riskLevel} /></td><td><Pill value={row.status} /></td><td>{fmt(row.dueDate)}</td><td>governed</td></tr>)}</tbody></table></div>{rows.length ? null : <Empty label="Strategic objectives" />}</section>
}

function InitiativesTable({ rows, selectedId, onSelect }: { rows: Row[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const heads = ['Code', 'Initiative', 'Category', 'Organization', 'Brand', 'Sponsor', 'Owner', 'Stage', 'Status', 'Alignment', 'Investment', 'Cost', 'Business Value', 'ROI', 'Maturity', 'Risk', 'Adoption', 'Health', 'Hours Avoided', 'Revenue', 'Final Outcome', 'Action']
  return <section className="exec-card exec-table-card"><div className="exec-section-head"><div><h2>AI Initiatives</h2><p>{rows.length} portfolio initiatives loaded from the executive database contract.</p></div><span>read-only executive intelligence</span></div><div className="exec-table-wrap"><table className="exec-table"><thead><tr>{heads.map((head) => <th key={head}>{head}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={fmt(row.id)} className={selectedId === fmt(row.id) ? 'selected' : ''} onClick={() => onSelect(fmt(row.id))}><td>{fmt(row.initiativeCode)}</td><td className="exec-title-cell">{fmt(row.initiativeName)}</td><td>{fmt(row.category)}</td><td>{fmt(row.organizationName)}</td><td>{fmt(row.brandName)}</td><td>{fmt(row.executiveSponsor)}</td><td>{fmt(row.businessOwner)}</td><td>{fmt(row.stage)}</td><td><Pill value={row.status} /></td><td>{pct(row.strategicAlignment)}</td><td>{money(row.investment)}</td><td>{money(row.operatingCost)}</td><td>{money(row.businessValue)}</td><td>{pct(row.roiPercent)}</td><td>{fmt(row.aiMaturity)}</td><td><Pill value={row.riskLevel} /></td><td>{pct(row.adoptionRate)}</td><td>{pct(row.productionHealth)}</td><td>{fmt(row.humanHoursAvoided)}</td><td>{money(row.revenueContribution)}</td><td>{pct(row.finalOutcomeReadiness)}</td><td>drawer</td></tr>)}</tbody></table></div>{rows.length ? null : <Empty label="AI initiatives" />}</section>
}

function InitiativeDrawer({ initiative, recommendations }: { initiative?: Row; recommendations: Row[] }) {
  return <aside className="exec-card exec-detail">
    <h2>Initiative Details</h2>
    <h3>{fmt(initiative?.initiativeName)}</h3>
    <Pill value={initiative?.status} />
    <dl>
      <div><dt>Business Case</dt><dd>{fmt(initiative?.strategicObjective)} / investment {money(initiative?.investment)} / expected ROI {pct(initiative?.roiPercent)}</dd></div>
      <div><dt>AI Architecture</dt><dd>{fmt(initiative?.agentCount)} agents / {fmt(initiative?.workflowCount)} workflows / {fmt(initiative?.modelCount)} models / {fmt(initiative?.toolCount)} tools</dd></div>
      <div><dt>Performance</dt><dd>{pct(initiative?.productionHealth)} health / {pct(initiative?.adoptionRate)} adoption / {pct(initiative?.finalOutcomeReadiness)} final outcome</dd></div>
      <div><dt>Business Impact</dt><dd>{money(initiative?.businessValue)} value / {money(initiative?.revenueContribution)} revenue / {fmt(initiative?.humanHoursAvoided)} hours avoided</dd></div>
      <div><dt>Risk</dt><dd>{fmt(initiative?.riskLevel)} / residual {fmt(initiative?.residualRisk)}</dd></div>
      <div><dt>Forecast</dt><dd>{fmt(initiative?.forecastValue)} / confidence {pct(initiative?.forecastConfidence)}</dd></div>
    </dl>
    <div className="exec-detail-list">{recommendations.slice(0, 5).map((row) => <p key={fmt(row.id)}><span>{fmt(row.recommendationType)}</span><b>{fmt(row.recommendation)}</b></p>)}</div>
  </aside>
}

function Panel({ title, rows, fields }: { title: string; rows: Row[]; fields: Array<[string, string, ('money' | 'pct' | 'text')?]> }) {
  return <section className="exec-card"><div className="exec-section-head"><div><h2>{title}</h2><p>{rows.length} live database records.</p></div></div>{rows.length ? <div className="exec-panel-list">{rows.slice(0, 8).map((row, index) => <article key={fmt(row.id ?? row.name ?? row.metricName ?? index)}>{fields.map(([label, key, kind]) => <p key={key}><span>{label}</span><b>{kind === 'money' ? money(row[key]) : kind === 'pct' ? pct(row[key]) : fmt(row[key])}</b></p>)}</article>)}</div> : <Empty label={title} />}</section>
}

export function ExecutiveCommandDashboard() {
  const [data, setData] = useState<Data>(emptyData)
  const [query, setQuery] = useState('')
  const [selectedInitiativeId, setSelectedInitiativeId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState<Date | null>(() => new Date())
  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/executive-command', { cache: 'no-store' })
      const payload = (await response.json()) as Envelope<Data>
      if (!response.ok || !payload.success) throw new Error(payload.message)
      setData(payload.data)
      setSelectedInitiativeId((current) => current ?? fmt(payload.data.initiatives[0]?.id))
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Executive command data unavailable')
    }
  }, [])
  useEffect(() => { const initial = window.setTimeout(() => void load(), 0); const poll = window.setInterval(() => void load(), 10000); return () => { window.clearTimeout(initial); window.clearInterval(poll) } }, [load])
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(timer) }, [])
  const filteredInitiatives = useMemo(() => data.initiatives.filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase())), [data.initiatives, query])
  const selectedInitiative = filteredInitiatives.find((row) => fmt(row.id) === selectedInitiativeId) ?? filteredInitiatives[0]
  const actions = ['Generate Executive Brief', 'Open AI Portfolio', 'Compare Organizations', 'Run Strategic Scenario', 'Review Investment Plan', 'Open Risk Review', 'Export Board Report', 'Schedule Executive Report']

  return <main className="exec-page">
    <header className="exec-header">
      <div>
        <nav>AI Agents / AI Executive Command Center</nav>
        <h1>AI Executive Command Center</h1>
        <p>Translate autonomous AI operations into strategic performance, investment, risk, and business outcome intelligence.</p>
        <div className="exec-meta">
          <span><Gauge size={14} /> Engine: {fmt(data.headerIndicators.executiveIntelligenceEngine)}</span>
          <span><Target size={14} /> Objectives: {fmt(data.headerIndicators.strategicObjectivesOnTrack)}</span>
          <span><TrendingUp size={14} /> ROI: {fmt(data.headerIndicators.aiRoi)}</span>
          <span><CircleDollarSign size={14} /> Value: {fmt(data.headerIndicators.businessValueGenerated)}</span>
          <span><AlertTriangle size={14} /> Risk: {fmt(data.headerIndicators.executiveRiskLevel)}</span>
          <span><Database size={14} /> {fmt(data.headerIndicators.dataSource)}</span>
        </div>
        <div className="exec-actions">{actions.map((action) => <span key={action}>{action}: governed job</span>)}</div>
      </div>
      <div className="exec-clock">{now ? clock(now) : 'Loading Nigeria time'}</div>
    </header>
    {error ? <div className="exec-error">{error}</div> : null}
    <section className="exec-search"><label><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search initiatives, objectives, risks, brands, organizations..." /></label></section>
    <section className="exec-kpis">{data.kpis.map((item, index) => <KpiCard key={fmt(item.key)} item={item} icon={icons[index] ?? BarChart3} />)}</section>
    <StatusCard status={data.intelligenceStatus} />
    <ValueChain rows={data.valueChain} />
    <ObjectivesTable rows={data.strategicObjectives} />
    <section className="exec-grid-two">
      <Panel title="AI Portfolio Overview" rows={data.portfolioOverview} fields={[['Portfolio', 'portfolioName'], ['Level', 'portfolioLevel'], ['Initiatives', 'totalInitiatives'], ['Investment', 'totalInvestment', 'money'], ['Value', 'businessValue', 'money'], ['ROI', 'roiPercent', 'pct'], ['Risk', 'riskLevel'], ['Maturity', 'maturityScore']]} />
      <Panel title="Business Value Attribution" rows={[...data.businessValue, ...data.attribution]} fields={[['Initiative', 'initiativeName'], ['Method', 'attributionMethod'], ['Business Value', 'businessValue', 'money'], ['Financial Value', 'financialValue', 'money'], ['Confidence', 'confidence', 'pct'], ['Outcome', 'businessOutcome']]} />
    </section>
    <section className="exec-main">
      <div className="exec-stack"><InitiativesTable rows={filteredInitiatives} selectedId={selectedInitiativeId} onSelect={setSelectedInitiativeId} /></div>
      <InitiativeDrawer initiative={selectedInitiative} recommendations={data.recommendations} />
    </section>
    <section className="exec-grid-three">
      <Panel title="AI ROI" rows={data.roi} fields={[['Scope', 'scopeName'], ['Gross Value', 'grossBusinessValue', 'money'], ['Total Cost', 'totalAiCost', 'money'], ['Net Value', 'netAiValue', 'money'], ['ROI', 'roiPercent', 'pct'], ['Payback', 'paybackPeriod']]} />
      <Panel title="Financial Performance" rows={data.financial} fields={[['Metric', 'metricName'], ['Actual', 'actualSpend', 'money'], ['Budget', 'budget', 'money'], ['Variance', 'variance', 'money'], ['Forecast', 'forecast', 'money'], ['Net Benefit', 'netBenefit', 'money']]} />
      <Panel title="Productivity and Human Effort" rows={data.productivity} fields={[['Area', 'productivityArea'], ['Before', 'humanEffortBefore'], ['After', 'humanEffortAfter'], ['Hours Saved', 'humanHoursAvoided'], ['Cost Saved', 'costSaved', 'money'], ['Gain', 'productivityGain', 'pct']]} />
      <Panel title="AI Adoption" rows={data.adoption} fields={[['Scope', 'scopeName'], ['Stage', 'adoptionStage'], ['Teams', 'teamsUsingAi'], ['Workflow Adoption', 'workflowAdoption', 'pct'], ['AI Output Share', 'aiGeneratedOutputShare', 'pct'], ['Adoption', 'adoptionRate', 'pct']]} />
      <Panel title="AI Maturity" rows={data.maturity} fields={[['Dimension', 'dimensionName'], ['Current', 'currentScore'], ['Target', 'targetScore'], ['Gap', 'gapScore'], ['Trend', 'trend'], ['Owner', 'executiveOwner']]} />
      <Panel title="Executive Risk Heatmap" rows={data.risks} fields={[['Domain', 'riskDomain'], ['Likelihood', 'likelihood'], ['Impact', 'impact'], ['Severity', 'severity'], ['Owner', 'riskOwner'], ['Mitigation', 'mitigationStatus']]} />
      <Panel title="Governance and Compliance Readiness" rows={data.governance} fields={[['Domain', 'governanceDomain'], ['Readiness', 'readinessPercent', 'pct'], ['Gaps', 'openGaps'], ['Violations', 'violationCount'], ['Evidence', 'evidenceCompleteness', 'pct'], ['Decision', 'executiveDecisionRequired']]} />
      <Panel title="Security Readiness" rows={data.security} fields={[['Domain', 'securityDomain'], ['Readiness', 'readinessPercent', 'pct'], ['Incidents', 'incidentCount'], ['Identity Risk', 'identityRisk'], ['Exposure', 'vulnerabilityExposure'], ['Decision', 'executiveDecisionRequired']]} />
      <Panel title="Operational Resilience" rows={data.resilience} fields={[['Domain', 'resilienceDomain'], ['Availability', 'availabilityPercent', 'pct'], ['Reliability', 'reliabilityPercent', 'pct'], ['Recovery', 'recoverySuccess', 'pct'], ['Headroom', 'capacityHeadroom', 'pct'], ['Risk', 'businessContinuityRisk']]} />
      <Panel title="Capacity and Demand Forecast" rows={data.capacity} fields={[['Resource', 'resourceName'], ['Horizon', 'forecastHorizon'], ['Capacity', 'currentCapacity'], ['Demand', 'forecastDemand'], ['Gap', 'capacityGap'], ['Investment', 'requiredInvestment', 'money']]} />
      <Panel title="Investment Planning" rows={data.investments} fields={[['Investment', 'investmentName'], ['Category', 'investmentCategory'], ['Budget', 'requiredBudget', 'money'], ['Return', 'expectedReturn', 'money'], ['Priority', 'priority'], ['Recommendation', 'recommendation']]} />
      <Panel title="Recommendations and Decisions" rows={[...data.recommendations, ...data.decisionQueue]} fields={[['Type', 'recommendationType'], ['Recommendation', 'recommendation'], ['Decision', 'decisionTitle'], ['Priority', 'priority'], ['Confidence', 'confidence', 'pct'], ['Owner', 'owner']]} />
      <Panel title="Organization and Brand Comparison" rows={[...data.organizationComparison, ...data.brandComparison]} fields={[['Name', 'organizationName'], ['Brand', 'brandName'], ['Value', 'businessValue', 'money'], ['ROI', 'roiPercent', 'pct'], ['Risk', 'riskLevel'], ['Maturity', 'maturityScore']]} />
      <Panel title="Content, Platform, Campaign, and Workforce" rows={[...data.contentPortfolio, ...data.platforms, ...data.campaigns, ...data.workforce]} fields={[['Name', 'contentName'], ['Platform', 'platformName'], ['Campaign', 'campaignName'], ['Workforce', 'workforceName'], ['Value', 'businessValue', 'money'], ['ROI', 'roiPercent', 'pct']]} />
      <Panel title="Scenarios, Forecasts, Alerts, Reports, and Schedules" rows={[...data.scenarios, ...data.forecasts, ...data.alerts, ...data.reports, ...data.reportSchedules]} fields={[['Scenario', 'scenarioName'], ['Forecast', 'forecastName'], ['Alert', 'alertName'], ['Report', 'reportName'], ['Status', 'status'], ['Confidence', 'confidence', 'pct']]} />
      <Panel title="Data Quality, Lineage, and Final Outcome Traceability" rows={[...data.dataQuality, ...data.dataLineage, ...data.finalOutcomeTraceability]} fields={[['Source', 'sourceName'], ['Metric', 'metricName'], ['Quality', 'qualityScore', 'pct'], ['Lineage', 'lineageState'], ['Outcome', 'finalOutcome'], ['Value', 'businessValue', 'money']]} />
    </section>
  </main>
}
