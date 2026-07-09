'use client'

import {
  Activity,
  AlertCircle,
  BarChart3,
  Bell,
  Bot,
  CalendarDays,
  ChevronRight,
  Clock3,
  Cloud,
  CreditCard,
  Database,
  Download,
  HardDrive,
  Mail,
  MoreHorizontal,
  Network,
  PlayCircle,
  RefreshCw,
  Send,
  Server,
  ShieldCheck,
  Workflow,
  Zap,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { useEffect, useState } from 'react'
import { serviceHealthMockData, type ServiceHealthCard, type ServiceStatus } from '@/data/serviceHealthMockData'
import { ActionGuard } from '@/components/auth/ActionGuard'

type IconComponent = ComponentType<{ size?: number }>

const iconMap: Record<string, IconComponent> = {
  api: Network,
  web: Server,
  bot: Bot,
  agent: Bot,
  workflow: Workflow,
  calendar: CalendarDays,
  render: PlayCircle,
  analytics: BarChart3,
  bell: Bell,
  send: Send,
  database: Database,
  storage: HardDrive,
  vector: Activity,
  cache: Zap,
  queue: Workflow,
  email: Mail,
  social: Cloud,
  payment: CreditCard,
}

const statusTone: Record<ServiceStatus, string> = {
  Operational: 'operational',
  Degraded: 'degraded',
  Failed: 'failed',
  Starting: 'starting',
  Stopped: 'stopped',
}

function placeholder(action: string, target?: string) {
  // Placeholder only. Wire this to a real service command API later.
  console.info(`[service-health] ${action}`, target ?? 'all services')
}

function StatusBadge({ status }: { status: ServiceStatus }) {
  return <span className={`health-status ${statusTone[status]}`}>{status}</span>
}

function ServiceCard({ service }: { service: ServiceHealthCard }) {
  const Icon = iconMap[service.icon] ?? Server

  return (
    <article className="health-service-card">
      <header>
        <span className={`health-service-icon ${statusTone[service.status]}`}><Icon size={20} /></span>
        <button type="button" aria-label={`Actions for ${service.name}`} onClick={() => placeholder('Open action menu', service.name)}>
          <MoreHorizontal size={18} />
        </button>
      </header>
      <div className="health-service-title">
        <h3>{service.name}</h3>
        <StatusBadge status={service.status} />
      </div>
      <div className="health-service-meta">
        <span><b>{service.health}%</b> Health</span>
        <span><b>{service.latency}</b> Latency</span>
        <span><b>{service.uptime}</b> Uptime</span>
        <span><b>{service.lastChecked}</b> Checked</span>
      </div>
      <div className={`health-progress ${statusTone[service.status]}`}><span style={{ width: `${service.health}%` }} /></div>
      <div className="health-card-actions">
        {['View Details', 'Restart', 'Open Logs', 'Disable'].map((action) => (
          <ActionGuard key={action} permission={action === 'Restart' ? 'system_monitoring.restart_service' : 'system_monitoring.view'} mode="disable">
            <button type="button" onClick={() => placeholder(action, service.name)}>{action}</button>
          </ActionGuard>
        ))}
      </div>
    </article>
  )
}

export function ServiceHealthDashboard() {
  const [data, setData] = useState(serviceHealthMockData)

  useEffect(() => {
    let mounted = true
    fetch('/api/system-monitoring/service-health', { cache: 'no-store' })
      .then((response) => response.json())
      .then((payload: { data?: typeof serviceHealthMockData }) => {
        if (mounted && payload.data) setData(payload.data)
      })
      .catch((error) => console.error('[service-health] API fallback active', error))

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="health-dashboard">
      <section className="health-page-head">
        <div>
          <div className="health-breadcrumb">System Monitoring <span>/</span> Service Health</div>
          <h1>Service Health</h1>
          <p>Monitor the operational status, latency, uptime, incidents, and readiness of all system services.</p>
        </div>
        <div className="health-page-actions">
          <button type="button" onClick={() => placeholder('Refresh Status')}><RefreshCw size={16} />Refresh Status</button>
          <ActionGuard permission="system_monitoring.run_validation" mode="disable">
            <button type="button" className="health-primary-button" onClick={() => placeholder('Run Health Check')}><ShieldCheck size={16} />Run Health Check</button>
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
              <div><h2>Service Health Grid</h2><p>Live readiness, latency, and availability by service.</p></div>
              <span>{data.services.length} services monitored</span>
            </div>
            <div className="health-service-grid">
              {data.services.map((service) => <ServiceCard key={service.id} service={service} />)}
            </div>
          </section>

          <section className="health-card">
            <div className="health-section-head">
              <div><h2>Dependency Map</h2><p>Primary request and output path across CACSMS Contents.</p></div>
            </div>
            <div className="health-dependency-flow">
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
            <div className="health-section-head">
              <div><h2>Incident Panel</h2><p>Active and recently monitored service incidents.</p></div>
            </div>
            <div className="health-table-wrap">
              <table className="health-table">
                <thead><tr>{['Incident ID', 'Service', 'Severity', 'Status', 'Started', 'Duration', 'Impact', 'Assigned To', 'Action'].map((head) => <th key={head}>{head}</th>)}</tr></thead>
                <tbody>
                  {data.incidents.map((incident) => (
                    <tr key={incident.id}>
                      <td>{incident.id}</td><td>{incident.service}</td><td><span className={`health-severity ${incident.severity.toLowerCase()}`}>{incident.severity}</span></td><td>{incident.status}</td><td>{incident.started}</td><td>{incident.duration}</td><td>{incident.impact}</td><td>{incident.assignedTo}</td>
                      <td><button type="button" onClick={() => placeholder('View Incident', incident.id)}>View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="health-card">
            <div className="health-section-head">
              <div><h2>Service Metrics Table</h2><p>Operational telemetry prepared for live API replacement.</p></div>
            </div>
            <div className="health-table-wrap">
              <table className="health-table metrics">
                <thead><tr>{['Service', 'Status', 'Health %', 'Latency', 'Error Rate', 'Uptime', 'CPU', 'Memory', 'Queue Depth', 'Last Restart', 'Last Checked', 'Action'].map((head) => <th key={head}>{head}</th>)}</tr></thead>
                <tbody>
                  {data.metrics.map((metric) => (
                    <tr key={metric.service}>
                      <td>{metric.service}</td><td><StatusBadge status={metric.status} /></td><td>{metric.health}%</td><td>{metric.latency}</td><td>{metric.errorRate}</td><td>{metric.uptime}</td><td>{metric.cpu}</td><td>{metric.memory}</td><td>{metric.queueDepth}</td><td>{metric.lastRestart}</td><td>{metric.lastChecked}</td>
                      <td><button type="button" onClick={() => placeholder('View Metrics', metric.service)}>Open</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="health-side-panel">
          <SideList title="Critical Alerts" items={data.sidePanel.criticalAlerts} tone="failed" />
          <SideList title="Degraded Services" items={data.sidePanel.degradedServices} tone="degraded" />
          <SideList title="Failed Health Checks" items={data.sidePanel.failedHealthChecks} tone="failed" />
          <SideList title="Recommended Actions" items={data.sidePanel.recommendedActions} tone="operational" />
        </aside>
      </section>

      <section className="health-bottom-grid">
        <BottomList title="Recent Status Changes" items={data.bottom.statusChanges} />
        <BottomList title="Health Check History" items={data.bottom.healthHistory} />
        <article className="health-card">
          <h2>SLA Compliance Summary</h2>
          <div className="health-sla-list">
            {data.bottom.slaSummary.map((sla) => (
              <p key={sla.label}><span>{sla.label}</span><b>{sla.value}</b></p>
            ))}
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

function BottomList({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="health-card">
      <h2>{title}</h2>
      <div className="health-bottom-list">
        {items.map((item) => <p key={item}><Clock3 size={14} />{item}</p>)}
      </div>
    </article>
  )
}
