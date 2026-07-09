'use client'

import {
  AlertCircle,
  Bell,
  Bot,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Database,
  FileText,
  GitBranch,
  Grid2X2,
  Layers3,
  Network,
  Plus,
  RefreshCw,
  Route,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Table2,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { useEffect } from 'react'

type Tone = 'blue' | 'green' | 'purple' | 'red' | 'cyan' | 'orange' | 'yellow' | 'pink'
type Status = 'completed' | 'progress' | 'pending' | 'failed' | 'blocked' | 'na'
type IconComponent = ComponentType<{ size?: number }>

type Kpi = {
  label: string
  value: string
  note: string
  tone: Tone
  Icon: IconComponent
}

type PipelineStep = {
  title: string
  value: string
  percent: number
  tone: Tone
  Icon: IconComponent
}

type MatrixRow = {
  module: string
  page: string
  checks: Status[]
  status: 'Completed' | 'In Progress' | 'Pending'
  health: string
  action: string
}

const kpis: Kpi[] = [
  { label: 'Total Modules', value: '30', note: '100% Registered', tone: 'blue', Icon: Layers3 },
  { label: 'Total Pages', value: '512', note: '98% Created', tone: 'green', Icon: FileText },
  { label: 'Routes', value: '1,248', note: '97% Active', tone: 'purple', Icon: Route },
  { label: 'AI Agents', value: '78', note: '95% Connected', tone: 'red', Icon: Bot },
  { label: 'Workflows', value: '156', note: '93% Linked', tone: 'cyan', Icon: GitBranch },
]

const pipeline: PipelineStep[] = [
  { title: 'Module & Sidebar Registration', value: '30 / 30', percent: 100, tone: 'purple', Icon: Layers3 },
  { title: 'Route & Page Creation', value: '502 / 512', percent: 98, tone: 'blue', Icon: FileText },
  { title: 'UI Component Implementation', value: '487 / 512', percent: 95, tone: 'purple', Icon: Sparkles },
  { title: 'API & Service Linkage', value: '468 / 512', percent: 91, tone: 'orange', Icon: ShieldCheck },
  { title: 'AI Agent Linkage', value: '74 / 78', percent: 95, tone: 'cyan', Icon: Bot },
  { title: 'Workflow & Approval Linkage', value: '142 / 156', percent: 91, tone: 'yellow', Icon: ShieldCheck },
  { title: 'Output / Storage Validation', value: '441 / 512', percent: 86, tone: 'green', Icon: Database },
  { title: 'Publishing / Analytics / Learning', value: '398 / 512', percent: 78, tone: 'pink', Icon: BrainIcon },
]

const checks = [
  'Sidebar',
  'Route',
  'Page',
  'Component',
  'API',
  'AI Agent',
  'Workflow',
  'Storage',
  'Approval',
  'Publishing',
  'Analytics',
  'Learning',
  'RBAC',
  'Final Output',
]

const matrixRows: MatrixRow[] = [
  {
    module: 'Content Production',
    page: 'Script Generator',
    checks: Array(14).fill('completed'),
    status: 'Completed',
    health: '100%',
    action: '-',
  },
  {
    module: 'Creative Studio',
    page: 'Thumbnail Designer',
    checks: Array(14).fill('completed'),
    status: 'Completed',
    health: '98%',
    action: '-',
  },
  {
    module: 'Video Studio',
    page: 'Video Projects',
    checks: ['completed', 'completed', 'progress', 'progress', 'progress', 'pending', 'progress', 'completed', 'progress', 'progress', 'pending', 'progress', 'pending', 'progress'],
    status: 'In Progress',
    health: '92%',
    action: 'Missing API',
  },
  {
    module: 'Publishing Center',
    page: 'Scheduled Posts',
    checks: ['completed', 'completed', 'progress', 'progress', 'progress', 'progress', 'progress', 'pending', 'progress', 'progress', 'pending', 'progress', 'na', 'progress'],
    status: 'In Progress',
    health: '90%',
    action: 'Analytics',
  },
  {
    module: 'AI Agents',
    page: 'Research Agents',
    checks: Array(14).fill('completed'),
    status: 'Completed',
    health: '100%',
    action: '-',
  },
  {
    module: 'Workflow Automation',
    page: 'Approval Workflows',
    checks: ['completed', 'completed', 'completed', 'completed', 'completed', 'progress', 'completed', 'completed', 'progress', 'progress', 'progress', 'pending', 'pending', 'progress'],
    status: 'In Progress',
    health: '88%',
    action: 'Missing Approval',
  },
  {
    module: 'Analytics & Intelligence',
    page: 'Content Analytics',
    checks: ['completed', 'completed', 'progress', 'completed', 'progress', 'progress', 'progress', 'progress', 'progress', 'progress', 'progress', 'pending', 'pending', 'pending'],
    status: 'In Progress',
    health: '85%',
    action: 'Learning',
  },
  {
    module: 'Monetization Center',
    page: 'Ad Revenue',
    checks: ['progress', 'progress', 'progress', 'pending', 'pending', 'pending', 'pending', 'pending', 'progress', 'progress', 'progress', 'pending', 'failed', 'na'],
    status: 'Pending',
    health: '65%',
    action: 'No Workflow',
  },
  {
    module: 'Security Center',
    page: 'Role Management',
    checks: Array(14).fill('completed'),
    status: 'Completed',
    health: '100%',
    action: '-',
  },
  {
    module: 'Help & Support',
    page: 'Support Tickets',
    checks: Array(14).fill('completed'),
    status: 'Completed',
    health: '97%',
    action: '-',
  },
]

const blockers = [
  ['Video Studio - Video Projects', 'Missing API connection', 'Today'],
  ['Workflow Automation - Failed Jobs', 'No retry workflow defined', 'Today'],
  ['Monetization - Ad Revenue', 'No workflow linked', '2 days ago'],
  ['Analytics - Learning Feedback', 'Learning loop not configured', '2 days ago'],
  ['Publishing - Bulk Publishing', 'Storage validation failed', '3 days ago'],
]

const outputFlow = [
  ['Idea', '100%', LightbulbIcon, 'purple'],
  ['Production', '95%', Sparkles, 'purple'],
  ['Review', '90%', ShieldCheck, 'orange'],
  ['Approval', '85%', CheckCircle2, 'green'],
  ['Publishing', '90%', Send, 'cyan'],
  ['Analytics', '88%', BarChartIcon, 'purple'],
  ['Learning', '75%', BrainIcon, 'pink'],
] as const

function BrainIcon({ size = 20 }: { size?: number }) {
  return <Bot size={size} />
}

function LightbulbIcon({ size = 20 }: { size?: number }) {
  return <Sparkles size={size} />
}

function BarChartIcon({ size = 20 }: { size?: number }) {
  return <Network size={size} />
}

function StatusDot({ status }: { status: Status }) {
  if (status === 'completed') return <CheckCircle2 className="impl-dot completed" size={15} />
  if (status === 'progress') return <span className="impl-dot-ring progress" />
  if (status === 'pending') return <span className="impl-dot-ring pending" />
  if (status === 'failed') return <AlertCircle className="impl-dot failed" size={15} />
  if (status === 'blocked') return <AlertCircle className="impl-dot blocked" size={15} />
  return <span className="impl-dot-ring na" />
}

export function ImplementationStatusDashboard() {
  useEffect(() => {
    fetch('/api/system-monitoring/implementation-status', { cache: 'no-store' })
      .catch((error) => console.error('[implementation-status] API fallback active', error))
  }, [])

  return (
    <div className="impl-dashboard">
      <header className="impl-topbar">
        <div className="impl-top-search">
          <Search size={17} />
          <span>Search anything...</span>
          <kbd>⌘K</kbd>
        </div>
        <button type="button" className="impl-circle-button"><Plus size={18} /></button>
        <button type="button" className="impl-circle-button alert"><Bell size={18} /><span>12</span></button>
        <button type="button" className="impl-circle-button"><CircleHelp size={18} /></button>
        <div className="impl-mini-avatar">JD</div>
      </header>

      <section className="impl-page-head">
        <div>
          <div className="impl-breadcrumb">System Monitoring <span>/</span> <b>Implementation Status</b></div>
          <h1>End-to-End Implementation Status <ShieldCheck size={22} /></h1>
          <p>Validate complete linkage from modules to final output and results</p>
        </div>
        <div className="impl-page-actions">
          <button type="button" className="impl-primary-button">Run Full Validation</button>
          <button type="button"><RefreshCw size={15} /> Recheck Module <ChevronDown size={15} /></button>
          <button type="button">Export Report <ChevronDown size={15} /></button>
          <button type="button"><CalendarDays size={15} /> May 31, 2025&nbsp;&nbsp;10:30 AM</button>
        </div>
      </section>

      <section className="impl-kpi-grid">
        {kpis.map(({ Icon, label, value, note, tone }) => (
          <article key={label} className="impl-kpi-card">
            <div className={`impl-kpi-icon ${tone}`}><Icon size={25} /></div>
            <div><span>{label}</span><b>{value}</b><small>{note}</small></div>
          </article>
        ))}
        <article className="impl-kpi-card ready">
          <div className="impl-ring small"><b>87%</b></div>
          <div><span>Final Output Ready</span><b>87%</b><small>Overall Readiness</small></div>
        </article>
      </section>

      <section className="impl-pipeline-card">
        <h2>End-to-End Workflow Pipeline</h2>
        <div className="impl-pipeline-row">
          {pipeline.map(({ Icon, title, value, percent, tone }) => (
            <article key={title} className="impl-pipe-item">
              <div className={`impl-pipe-bubble ${tone}`}><Icon size={26} /></div>
              <h3>{title}</h3>
              <div className="impl-pipe-meta"><span>{value}</span><b>{percent}%</b></div>
              <div className={`impl-bar ${tone}`}><span style={{ width: `${percent}%` }} /></div>
            </article>
          ))}
        </div>
      </section>

      <div className="impl-main-grid">
        <section className="impl-matrix-card">
          <div className="impl-section-head">
            <h2>Implementation Linkage Matrix <CircleHelp size={14} /></h2>
            <div>
              <label><Search size={15} /><input placeholder="Search module or page..." /></label>
              <button type="button">All Status <ChevronDown size={14} /></button>
              <button type="button">All Modules <ChevronDown size={14} /></button>
              <button type="button"><Table2 size={15} /></button>
              <button type="button"><Grid2X2 size={15} /></button>
            </div>
          </div>
          <div className="impl-table-wrap">
            <table className="impl-table">
              <thead>
                <tr>
                  <th>Module</th>
                  <th>Page / Sub-module</th>
                  {checks.map((check) => <th key={check}>{check}</th>)}
                  <th>Status</th>
                  <th>Health %</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {matrixRows.map((row) => (
                  <tr key={`${row.module}-${row.page}`}>
                    <td>{row.module}</td>
                    <td>{row.page}</td>
                    {row.checks.map((status, index) => <td key={`${row.module}-${index}`}><StatusDot status={status} /></td>)}
                    <td><span className={`impl-tag ${row.status.toLowerCase().replace(' ', '-')}`}>{row.status}</span></td>
                    <td>{row.health}</td>
                    <td className={row.action === '-' ? 'muted' : 'warning'}>{row.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="impl-table-footer">
            <span>Showing 1 to 10 of 30 modules</span>
            <div className="impl-status-legend">
              <span><i className="completed" />Completed</span>
              <span><i className="progress" />In Progress</span>
              <span><i className="pending" />Pending</span>
              <span><i className="failed" />Failed</span>
              <span><i className="blocked" />Blocked</span>
              <span><i className="na" />Not Required</span>
            </div>
          </div>
        </section>

        <aside className="impl-right-stack">
          <article className="impl-side-card">
            <h2>Implementation Health Score</h2>
            <div className="impl-health-layout">
              <div className="impl-ring large"><b>87%</b><span>Overall Health</span></div>
              <ul className="impl-health-list">
                <li><i className="completed" />Completed <b>441 (61%)</b></li>
                <li><i className="progress" />In Progress <b>156 (22%)</b></li>
                <li><i className="pending" />Pending <b>82 (11%)</b></li>
                <li><i className="failed" />Failed <b>18 (3%)</b></li>
                <li><i className="blocked" />Blocked <b>15 (2%)</b></li>
                <li><i className="na" />N/A <b>24 (1%)</b></li>
              </ul>
            </div>
          </article>

          <article className="impl-side-card">
            <h2>Critical Blockers (5) <a>View All</a></h2>
            <div className="impl-list">
              {blockers.map(([title, copy, time]) => (
                <div key={title}>
                  <AlertCircle size={15} />
                  <p><b>{title}</b><span>{copy}</span></p>
                  <small>{time}</small>
                </div>
              ))}
            </div>
          </article>

          <article className="impl-side-card">
            <h2>Broken Links (12) <a>View All</a></h2>
            <div className="impl-link-list">
              <p>/dashboard/video-studio/templates</p>
              <p>/dashboard/ai-agents/voice-agents</p>
              <p>/dashboard/integrations/old-apis</p>
              <span>+ 9 more</span>
            </div>
          </article>

          <article className="impl-side-card">
            <h2>Quick Actions</h2>
            <div className="impl-quick-grid">
              <button type="button">Run Validation</button>
              <button type="button">Recheck Module</button>
              <button type="button">View Reports</button>
              <button type="button">Export Report</button>
            </div>
            <h2>Top Recommendations</h2>
            <div className="impl-recs">
              {['Connect missing API in Video Projects', 'Define approval workflow for Failed Jobs', 'Configure learning feedback for Analytics'].map((rec) => (
                <p key={rec}><CheckCircle2 size={14} />{rec}<button type="button">Fix Now</button></p>
              ))}
            </div>
          </article>
        </aside>
      </div>

      <section className="impl-bottom-grid">
        <article className="impl-side-card readiness">
          <h2>Final Output Readiness</h2>
          <div className="impl-ring large"><b>87%</b></div>
          <p>Systems are ready to produce final results</p>
          <button type="button">View Details</button>
        </article>
        <article className="impl-side-card output">
          <h2>Output Pipeline Flow</h2>
          <div className="impl-output-flow">
            {outputFlow.map(([label, percent, Icon, tone]) => (
              <div key={label}>
                <span className={`impl-output-icon ${tone}`}><Icon size={24} /></span>
                <b>{label}</b>
                <small>{percent}</small>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  )
}
