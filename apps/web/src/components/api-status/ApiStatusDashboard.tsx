'use client'

import { AlertCircle, ChevronRight, Download, FileWarning, RefreshCw, SearchCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { apiStatusMockData, type ApiHealthCard, type ApiStatus } from '@/data/apiStatusMockData'
import { ActionGuard } from '@/components/auth/ActionGuard'

const statusTone: Record<ApiStatus, string> = {
  Operational: 'operational',
  Degraded: 'degraded',
  Failed: 'failed',
  'Rate Limited': 'starting',
  Unauthorized: 'failed',
  Timeout: 'degraded',
}

function placeholder(action: string, target?: string) {
  console.info(`[api-status] ${action}`, target ?? 'all APIs')
}

function ApiBadge({ status }: { status: ApiStatus }) {
  return <span className={`health-status ${statusTone[status]}`}>{status}</span>
}

function Sparkline({ points }: { points: number[] }) {
  const max = Math.max(...points)
  const min = Math.min(...points)
  const coords = points.map((point, index) => {
    const x = (index / (points.length - 1)) * 110
    const y = 36 - ((point - min) / Math.max(max - min, 1)) * 28
    return `${x},${y}`
  }).join(' ')

  return <svg className="api-sparkline" viewBox="0 0 110 42" aria-hidden="true"><polyline points={coords} /></svg>
}

function ApiCard({ api }: { api: ApiHealthCard }) {
  return (
    <article className="api-card">
      <div className="api-card-head">
        <div><h3>{api.name}</h3><ApiBadge status={api.status} /></div>
        <b>{api.health}%</b>
      </div>
      <div className="api-card-metrics">
        <span>Avg latency <b>{api.latency}</b></span>
        <span>Error rate <b>{api.errorRate}</b></span>
        <span>Requests <b>{api.requests}</b></span>
        <span>Checked <b>{api.lastChecked}</b></span>
      </div>
      <Sparkline points={api.sparkline} />
      <div className={`health-progress ${statusTone[api.status]}`}><span style={{ width: `${api.health}%` }} /></div>
      <div className="api-card-actions">
        <button type="button" onClick={() => placeholder('View Details', api.name)}>View Details</button>
        <ActionGuard permission="system_monitoring.run_validation" mode="disable">
          <button type="button" onClick={() => placeholder('Retry Failed API', api.name)}>Retry Failed API</button>
        </ActionGuard>
        <button type="button" onClick={() => placeholder('Open Logs', api.name)}>Open Logs</button>
        <ActionGuard permission="module.manage" mode="disable">
          <button type="button" onClick={() => placeholder('Disable Endpoint', api.name)}>Disable Endpoint</button>
        </ActionGuard>
      </div>
    </article>
  )
}

export function ApiStatusDashboard() {
  const [data, setData] = useState(apiStatusMockData)

  useEffect(() => {
    let mounted = true
    fetch('/api/system-monitoring/api-status', { cache: 'no-store' })
      .then((response) => response.json())
      .then((payload: { data?: typeof apiStatusMockData }) => {
        if (mounted && payload.data) setData(payload.data)
      })
      .catch((error) => console.error('[api-status] API fallback active', error))

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="health-dashboard api-dashboard">
      <section className="health-page-head">
        <div>
          <div className="health-breadcrumb">System Monitoring <span>/</span> API Status</div>
          <h1>API Status</h1>
          <p>Track uptime, latency, error rates, request volume, failures, and integration readiness across all API endpoints.</p>
        </div>
        <div className="health-page-actions">
          <button type="button" onClick={() => placeholder('Refresh APIs')}><RefreshCw size={16} />Refresh APIs</button>
          <ActionGuard permission="system_monitoring.run_validation" mode="disable">
            <button type="button" className="health-primary-button" onClick={() => placeholder('Run API Diagnostics')}><SearchCheck size={16} />Run API Diagnostics</button>
          </ActionGuard>
          <ActionGuard permission="system_monitoring.export_report" mode="disable">
            <button type="button" onClick={() => placeholder('Export Report')}><Download size={16} />Export Report</button>
          </ActionGuard>
        </div>
      </section>

      <section className="health-kpi-grid">
        {data.kpis.map((kpi) => (
          <article key={kpi.label} className="health-kpi-card">
            <span className={`health-kpi-dot ${kpi.tone}`} />
            <div><small>{kpi.label}</small><b>{kpi.value}</b><p>{kpi.note}</p></div>
          </article>
        ))}
      </section>

      <section className="health-layout-grid">
        <div className="health-main-stack">
          <section className="health-card">
            <div className="health-section-head">
              <div><h2>API Health Overview</h2><p>Endpoint groups, request readiness, and failure posture.</p></div>
              <span>{data.apis.length} API groups</span>
            </div>
            <div className="api-card-grid">
              {data.apis.map((api) => <ApiCard key={api.id} api={api} />)}
            </div>
          </section>

          <section className="health-card">
            <div className="health-section-head"><div><h2>API Dependency Flow</h2><p>Primary API execution path from frontend to learning systems.</p></div></div>
            <div className="api-dependency-flow">
              {data.dependencyFlow.map((item, index) => (
                <div key={item} className="health-dependency-node">
                  <span>{index + 1}</span>
                  <b>{item}</b>
                  {index < data.dependencyFlow.length - 1 ? <ChevronRight size={18} /> : null}
                </div>
              ))}
            </div>
          </section>

          <section className="health-card">
            <div className="health-section-head"><div><h2>API Endpoint Matrix</h2><p>Endpoint-level health, latency, auth, ownership, and limits.</p></div></div>
            <div className="health-table-wrap">
              <table className="health-table api-endpoint-table">
                <thead><tr>{['API Group', 'Endpoint', 'Method', 'Status', 'Health %', 'Avg Latency', 'P95 Latency', 'Error Rate', 'Requests Today', 'Auth Required', 'Rate Limit', 'Last Failure', 'Owner Module', 'Action'].map((head) => <th key={head}>{head}</th>)}</tr></thead>
                <tbody>
                  {data.endpoints.map((endpoint) => (
                    <tr key={endpoint.endpoint}>
                      <td>{endpoint.group}</td><td>{endpoint.endpoint}</td><td><span className={`api-method ${endpoint.method.toLowerCase()}`}>{endpoint.method}</span></td><td><ApiBadge status={endpoint.status} /></td><td>{endpoint.health}%</td><td>{endpoint.avgLatency}</td><td>{endpoint.p95Latency}</td><td>{endpoint.errorRate}</td><td>{endpoint.requestsToday}</td><td>{endpoint.authRequired}</td><td>{endpoint.rateLimit}</td><td>{endpoint.lastFailure}</td><td>{endpoint.ownerModule}</td>
                      <td><button type="button" onClick={() => placeholder('View Endpoint', endpoint.endpoint)}>View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="api-failure-grid">
            {Object.entries(data.failures).map(([title, items]) => (
              <article key={title} className="health-card api-failure-card">
                <h2>{title.replace(/([A-Z])/g, ' $1')}</h2>
                {items.map((item) => <p key={item}><FileWarning size={15} />{item}</p>)}
              </article>
            ))}
          </section>
        </div>

        <aside className="health-side-panel">
          <SideList title="Critical API Alerts" items={data.intelligence.criticalAlerts} tone="failed" />
          <SideList title="Slowest APIs" items={data.intelligence.slowestApis} tone="degraded" />
          <SideList title="Most Used APIs" items={data.intelligence.mostUsedApis} tone="operational" />
          <SideList title="Failed External APIs" items={data.intelligence.failedExternalApis} tone="failed" />
          <SideList title="Recommended Fixes" items={data.intelligence.recommendedFixes} tone="operational" />
        </aside>
      </section>

      <section className="health-bottom-grid api-bottom-grid">
        <TrendCard title="API Request Trend" values={data.trends.requestTrend} suffix="k" />
        <TrendCard title="Latency Trend" values={data.trends.latencyTrend} suffix="ms" />
        <TrendCard title="Error Rate Trend" values={data.trends.errorTrend} suffix="%" />
        <article className="health-card">
          <h2>Webhook Delivery Status</h2>
          <div className="health-sla-list">
            {data.trends.webhookStatus.map((item) => <p key={item.label}><span>{item.label}</span><b>{item.value}</b></p>)}
          </div>
        </article>
      </section>
    </div>
  )
}

function SideList({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  return (
    <article className="health-card health-side-card">
      <h2>{title}</h2>
      {items.map((item) => <p key={item}><AlertCircle className={tone} size={15} />{item}</p>)}
    </article>
  )
}

function TrendCard({ title, values, suffix }: { title: string; values: number[]; suffix: string }) {
  return (
    <article className="health-card api-trend-card">
      <h2>{title}</h2>
      <Sparkline points={values} />
      <b>{values[values.length - 1]}{suffix}</b>
    </article>
  )
}
