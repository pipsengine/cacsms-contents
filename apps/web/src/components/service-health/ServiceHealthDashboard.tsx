'use client'

import { AlertCircle, BarChart3, Bot, CalendarDays, Cloud, CreditCard, Database, HardDrive, Mail, Network, PlayCircle, Send, Server, Workflow, Zap } from 'lucide-react'
import type { ComponentType } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

type ServiceStatus = 'Operational' | 'Degraded' | 'Failed' | 'Starting' | 'Stopped'

type ServiceHealthCard = {
  id: string
  name: string
  icon: string
  status: ServiceStatus
  health: number
  latency: string
  uptime?: string | null
  lastChecked?: string | null
  category?: string | null
}

type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
}

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
  bell: Send,
  send: Send,
  database: Database,
  storage: HardDrive,
  vector: Network,
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

function StatusBadge({ status }: { status: ServiceStatus }) {
  return <span className={`health-status ${statusTone[status]}`}>{status}</span>
}

function ServiceCard({ service }: { service: ServiceHealthCard }) {
  const Icon = iconMap[service.icon] ?? Server
  return (
    <article className="health-service-card">
      <header>
        <span className={`health-service-icon ${statusTone[service.status]}`}><Icon size={20} /></span>
        <span className={`health-kpi-dot ${statusTone[service.status]}`} />
      </header>
      <div className="health-service-title">
        <h3>{service.name}</h3>
        <StatusBadge status={service.status} />
      </div>
      <div className="health-service-meta">
        <span><b>{service.health}%</b> Health</span>
        <span><b>{service.latency}</b> Latency</span>
        <span><b>{service.uptime ?? '-'}</b> Uptime</span>
        <span><b>{service.lastChecked ?? '-'}</b> Checked</span>
      </div>
      <div className={`health-progress ${statusTone[service.status]}`}><span style={{ width: `${service.health}%` }} /></div>
    </article>
  )
}

export function ServiceHealthDashboard() {
  const [services, setServices] = useState<ServiceHealthCard[]>([])
  const [message, setMessage] = useState('Waiting for live service health data')

  const loadData = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/system-monitoring/service-health', { cache: 'no-store' })
      const payload = (await response.json()) as ApiEnvelope<{ services: ServiceHealthCard[] }>
      if (!response.ok || !payload.success) throw new Error(payload.message)
      setServices(payload.data.services)
      setMessage('Live service health data loaded')
    } catch (error) {
      setServices([])
      setMessage(error instanceof Error ? error.message : 'Live service health data unavailable')
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
    const operational = services.filter((service) => service.status === 'Operational').length
    const failed = services.filter((service) => service.status === 'Failed').length
    const degraded = services.filter((service) => service.status === 'Degraded').length
    const avgHealth = services.length ? Math.round(services.reduce((sum, service) => sum + service.health, 0) / services.length) : 0
    return { operational, failed, degraded, avgHealth }
  }, [services])

  return (
    <div className="health-dashboard">
      <section className="health-page-head">
        <div>
          <div className="health-breadcrumb">System Monitoring <span>/</span> Service Health</div>
          <h1>Service Health</h1>
          <p>{message}</p>
        </div>
      </section>

      <section className="health-kpi-grid">
        {[
          ['Services', services.length, 'Rows from system_services', 'blue'],
          ['Operational', stats.operational, 'Live operational services', 'green'],
          ['Degraded', stats.degraded, 'Live degraded services', 'orange'],
          ['Failed', stats.failed, 'Live failed services', 'red'],
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
              <div><h2>Service Health Grid</h2><p>Live readiness, latency, and availability by service.</p></div>
              <span>{services.length} services monitored</span>
            </div>
            <div className="health-service-grid">
              {services.map((service) => <ServiceCard key={service.id} service={service} />)}
            </div>
            {services.length === 0 ? <p>No system service rows found in the database.</p> : null}
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
