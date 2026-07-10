'use client'

import { AlertCircle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

type ApiStatus = 'Operational' | 'Degraded' | 'Failed' | 'Rate Limited' | 'Unauthorized' | 'Timeout'

type ApiEndpoint = {
  group: string
  endpoint: string
  method: string
  status: ApiStatus
  health: number
  avgLatency: string
  errorRate: string
  ownerModule?: string | null
}

type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
}

const statusTone: Record<ApiStatus, string> = {
  Operational: 'operational',
  Degraded: 'degraded',
  Failed: 'failed',
  'Rate Limited': 'starting',
  Unauthorized: 'failed',
  Timeout: 'degraded',
}

function ApiBadge({ status }: { status: ApiStatus }) {
  return <span className={`health-status ${statusTone[status]}`}>{status}</span>
}

export function ApiStatusDashboard() {
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([])
  const [message, setMessage] = useState('Waiting for live API status data')

  const loadData = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/system-monitoring/api-status', { cache: 'no-store' })
      const payload = (await response.json()) as ApiEnvelope<{ endpoints: ApiEndpoint[] }>
      if (!response.ok || !payload.success) throw new Error(payload.message)
      setEndpoints(payload.data.endpoints)
      setMessage('Live API endpoint data loaded')
    } catch (error) {
      setEndpoints([])
      setMessage(error instanceof Error ? error.message : 'Live API endpoint data unavailable')
    }
  }, [])

  useEffect(() => {
    const initialLoad = setTimeout(() => void loadData(), 0)
    const poll = window.setInterval(() => void loadData(), 30000)
    return () => {
      clearTimeout(initialLoad)
      window.clearInterval(poll)
    }
  }, [loadData])

  const stats = useMemo(() => {
    const failed = endpoints.filter((endpoint) => endpoint.status === 'Failed').length
    const degraded = endpoints.filter((endpoint) => endpoint.status === 'Degraded').length
    const operational = endpoints.filter((endpoint) => endpoint.status === 'Operational').length
    const avgHealth = endpoints.length ? Math.round(endpoints.reduce((sum, endpoint) => sum + endpoint.health, 0) / endpoints.length) : 0
    return { failed, degraded, operational, avgHealth }
  }, [endpoints])

  return (
    <div className="health-dashboard api-dashboard">
      <section className="health-page-head">
        <div>
          <div className="health-breadcrumb">System Monitoring <span>/</span> API Status</div>
          <h1>API Status</h1>
          <p>{message}</p>
        </div>
      </section>

      <section className="health-kpi-grid">
        {[
          ['Endpoints', endpoints.length, 'Rows from api_endpoints', 'blue'],
          ['Operational', stats.operational, 'Live operational endpoints', 'green'],
          ['Degraded', stats.degraded, 'Live degraded endpoints', 'orange'],
          ['Failed', stats.failed, 'Live failed endpoints', 'red'],
          ['Average Health', `${stats.avgHealth}%`, 'Calculated from database', 'purple'],
        ].map(([label, value, note, tone]) => (
          <article key={String(label)} className="health-kpi-card">
            <span className={`health-kpi-dot ${tone}`} />
            <div><small>{label}</small><b>{value}</b><p>{note}</p></div>
          </article>
        ))}
      </section>

      <section className="health-layout-grid">
        <div className="health-main-stack">
          <section className="health-card">
            <div className="health-section-head">
              <div><h2>API Endpoint Matrix</h2><p>Endpoint-level health from the production database.</p></div>
              <span>{endpoints.length} endpoints</span>
            </div>
            <div className="health-table-wrap">
              <table className="health-table api-endpoint-table">
                <thead><tr>{['API Group', 'Endpoint', 'Method', 'Status', 'Health %', 'Avg Latency', 'Error Rate', 'Owner Module'].map((head) => <th key={head}>{head}</th>)}</tr></thead>
                <tbody>
                  {endpoints.map((endpoint) => (
                    <tr key={`${endpoint.method}-${endpoint.endpoint}`}>
                      <td>{endpoint.group}</td>
                      <td>{endpoint.endpoint}</td>
                      <td><span className={`api-method ${endpoint.method.toLowerCase()}`}>{endpoint.method}</span></td>
                      <td><ApiBadge status={endpoint.status} /></td>
                      <td>{endpoint.health}%</td>
                      <td>{endpoint.avgLatency}</td>
                      <td>{endpoint.errorRate}</td>
                      <td>{endpoint.ownerModule ?? '-'}</td>
                    </tr>
                  ))}
                  {endpoints.length === 0 ? <tr><td colSpan={8}>No API endpoint rows found in the database.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="health-side-panel">
          <article className="health-card health-side-card">
            <h2>Live Data Status</h2>
            <p><AlertCircle size={15} />{message}</p>
          </article>
        </aside>
      </section>
    </div>
  )
}
