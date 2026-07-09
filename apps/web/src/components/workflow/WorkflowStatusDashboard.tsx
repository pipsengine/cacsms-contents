'use client'

import {
  BarChart3,
  Brain,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Cpu,
  Database,
  FileText,
  Lightbulb,
  Network,
  PenLine,
  Plane,
  Presentation,
  ShieldCheck,
  Sparkles,
  Target,
  Youtube,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect } from 'react'

type StageTone = 'purple' | 'blue' | 'indigo' | 'orange' | 'teal' | 'green' | 'violet' | 'pink'

type WorkflowStage = {
  number: number
  title: string
  shortTitle: string
  count: string
  countLabel: string
  percent: string
  description: string
  tone: StageTone
  Icon: LucideIcon
}

type AgentFlowItem = [name: string, description: string, Icon: LucideIcon, tone: StageTone]
type SystemFlowItem = [name: string, description: string, Icon: LucideIcon, tone: StageTone]

const stages: WorkflowStage[] = [
  {
    number: 1,
    title: 'Idea & Research',
    shortTitle: 'IDEA & RESEARCH',
    count: '24',
    countLabel: 'Ideas',
    percent: '100%',
    description: 'Discover trends, validate ideas, and build content brief.',
    tone: 'purple',
    Icon: Lightbulb,
  },
  {
    number: 2,
    title: 'Planning & Strategy',
    shortTitle: 'PLANNING & STRATEGY',
    count: '18',
    countLabel: 'Planned',
    percent: '75%',
    description: 'Create strategy, outline, and content plan.',
    tone: 'blue',
    Icon: Target,
  },
  {
    number: 3,
    title: 'Content Production',
    shortTitle: 'CONTENT PRODUCTION',
    count: '32',
    countLabel: 'In Progress',
    percent: '60%',
    description: 'Generate content, script, design, and assets.',
    tone: 'indigo',
    Icon: PenLine,
  },
  {
    number: 4,
    title: 'Review & Approval',
    shortTitle: 'REVIEW & APPROVAL',
    count: '16',
    countLabel: 'Pending',
    percent: '40%',
    description: 'Review content quality and approve for publishing.',
    tone: 'orange',
    Icon: ShieldCheck,
  },
  {
    number: 5,
    title: 'Scheduling',
    shortTitle: 'SCHEDULING',
    count: '12',
    countLabel: 'Scheduled',
    percent: '80%',
    description: 'Schedule content for optimal time.',
    tone: 'teal',
    Icon: CalendarDays,
  },
  {
    number: 6,
    title: 'Publishing',
    shortTitle: 'PUBLISHING',
    count: '14',
    countLabel: 'Published',
    percent: '90%',
    description: 'Publish content across selected channels.',
    tone: 'green',
    Icon: Plane,
  },
  {
    number: 7,
    title: 'Analytics & Performance',
    shortTitle: 'ANALYTICS & PERFORMANCE',
    count: '14',
    countLabel: 'Live',
    percent: '100%',
    description: 'Track performance and audience engagement.',
    tone: 'violet',
    Icon: BarChart3,
  },
  {
    number: 8,
    title: 'Learning & Optimization',
    shortTitle: 'LEARNING & OPTIMIZATION',
    count: '6',
    countLabel: 'Analyzing',
    percent: '30%',
    description: 'AI learns and improves future content.',
    tone: 'pink',
    Icon: Brain,
  },
]

const overviewStats = [
  ['Completed', '54 (40%)', 'purple'],
  ['In Progress', '32 (24%)', 'blue'],
  ['Pending', '28 (21%)', 'orange'],
  ['Scheduled', '12 (9%)', 'teal'],
  ['Failed', '6 (6%)', 'red'],
]

const agents: AgentFlowItem[] = [
  ['Research Agent', 'Finds trending topics & insights', Lightbulb, 'purple'],
  ['Strategy Agent', 'Creates plans & content strategy', Target, 'blue'],
  ['Writing Agent', 'Generates scripts & content', FileText, 'indigo'],
  ['Creative Agent', 'Generates visuals & thumbnails', ShieldCheck, 'orange'],
  ['Publishing Agent', 'Handles scheduling & publishing', CalendarDays, 'teal'],
  ['Analytics Agent', 'Tracks performance & metrics', BarChart3, 'green'],
  ['Learning Agent', 'Learns & optimizes future content', Brain, 'pink'],
]

const systemFlow: SystemFlowItem[] = [
  ['Data Collection', 'Multi-source data', Database, 'purple'],
  ['AI Processing', 'Analyze & generate', Cpu, 'blue'],
  ['Content Creation', 'Multi-format content', FileText, 'orange'],
  ['Human Review', 'Quality assurance', Presentation, 'pink'],
  ['Multi-Channel Distribution', 'Publish everywhere', Network, 'green'],
  ['Performance Tracking', 'Real-time analytics', BarChart3, 'teal'],
  ['AI Learning', 'Continuous improvement', Sparkles, 'pink'],
]

function Sparkline() {
  return (
    <svg className="workflow-sparkline" viewBox="0 0 92 28" aria-hidden="true">
      <polyline points="0,22 12,18 24,20 36,10 48,15 60,8 72,12 84,3 92,7" />
    </svg>
  )
}

export function WorkflowStatusDashboard() {
  useEffect(() => {
    fetch('/api/system-monitoring/workflow-status', { cache: 'no-store' })
      .catch((error) => console.error('[workflow-status] API fallback active', error))
  }, [])

  return (
    <div className="workflow-dashboard">
      <header className="workflow-header">
        <div>
          <h2>End-to-End Workflow Status</h2>
          <p>Complete content lifecycle from idea to performance & learning.</p>
        </div>
        <div className="workflow-actions">
          <button type="button">All Workflows</button>
          <button type="button">May 01 - May 31, 2025</button>
          <button type="button" className="workflow-primary-button">
            Export Report
          </button>
        </div>
      </header>

      <section className="workflow-timeline" aria-label="Workflow stages">
        <div className="workflow-timeline-line" />
        {stages.map(({ Icon, tone, title }) => (
          <div key={title} className={`workflow-stage-icon ${tone}`} title={title}>
            <Icon size={26} />
          </div>
        ))}
      </section>

      <section className="workflow-summary-grid">
        {stages.map((stage) => (
          <article key={stage.title} className={`workflow-summary-card ${stage.tone}`}>
            <div className="workflow-card-title-row">
              <span className="workflow-stage-number">{stage.number}</span>
              <h3>{stage.title}</h3>
            </div>
            <div className="workflow-summary-stats">
              <b>{stage.count}</b>
              <b>{stage.percent}</b>
            </div>
            <div className="workflow-summary-labels">
              <small>{stage.countLabel}</small>
              <small>Complete</small>
            </div>
            <div className="workflow-progress thin">
              <span style={{ width: stage.percent }} />
            </div>
            <p>{stage.description}</p>
          </article>
        ))}
      </section>

      <section className="workflow-detail-grid">
        {stages.map((stage) => (
          <div key={stage.shortTitle} className={`workflow-detail-label ${stage.tone}`}>
            <span>{stage.number}</span>
            {stage.shortTitle}
          </div>
        ))}

        <article className="workflow-work-card purple">
          <p className="workflow-field-label">Trending Topic</p>
          <h3>AI Tools for Content Creation</h3>
          <span className="workflow-pill success">High Opportunity</span>
          <div className="workflow-score">
            <span>Research Score</span>
            <b>89/100</b>
          </div>
          <ul className="workflow-source-list">
            <li>Google Trends <CheckCircle2 size={13} /></li>
            <li>YouTube Trends <CheckCircle2 size={13} /></li>
            <li>Reddit <CircleDot size={13} /></li>
            <li>Industry Reports <CircleDot size={13} /></li>
          </ul>
          <p><b>Key Insight</b><span>AI tools content is trending with high engagement across all major platforms.</span></p>
          <button type="button" className="workflow-card-action">View Research</button>
        </article>

        <article className="workflow-work-card blue">
          <p className="workflow-field-label">Content Plan</p>
          <h3>AI Tools Ultimate Guide 2025</h3>
          <p><b>Content Pillar</b><span>Technology</span></p>
          <p><b>Target Audience</b><span>Content Creators, Marketers, Entrepreneurs</span></p>
          <div className="workflow-formats"><span>Video</span><span>Blog</span><span>Social</span></div>
          <div className="workflow-channel-row"><Youtube size={16} /><span>WordPress</span><span>LinkedIn</span><span>X</span><span>Instagram</span></div>
          <p><b>Due Date</b><span>May 15, 2025</span></p>
          <button type="button" className="workflow-card-action">View Plan</button>
        </article>

        <article className="workflow-work-card indigo">
          <p className="workflow-field-label">Script Progress</p>
          <h3>AI Tools Ultimate Guide 2025</h3>
          <div className="workflow-progress"><span style={{ width: '75%' }} /></div>
          <ul className="workflow-checklist">
            <li>Script Writing <b>Done</b></li>
            <li>Visual Assets <b>In Progress</b></li>
            <li>Voice Over <b>Done</b></li>
            <li>Video Editing <b>In Progress</b></li>
            <li>Thumbnail <b>Pending</b></li>
            <li>SEO Optimization <b>Pending</b></li>
          </ul>
          <button type="button" className="workflow-card-action">Open Production</button>
        </article>

        <article className="workflow-work-card orange">
          <p className="workflow-field-label">Review Status</p>
          <h3 className="workflow-warning-title">Pending Review</h3>
          <p><b>Reviewer</b><span>Sarah Johnson</span><small>Content Manager</small></p>
          <ul className="workflow-checklist">
            <li>Content Quality <CircleDot size={13} /></li>
            <li>Accuracy <CircleDot size={13} /></li>
            <li>Brand Compliance <CircleDot size={13} /></li>
            <li>SEO Optimization <CircleDot size={13} /></li>
            <li>Engagement Potential <CircleDot size={13} /></li>
          </ul>
          <div className="workflow-split-actions"><button type="button" className="workflow-approve-button">Approve</button><button type="button" className="workflow-change-button">Request Changes</button></div>
          <button type="button" className="workflow-card-action">View Details</button>
        </article>

        <article className="workflow-work-card teal">
          <p className="workflow-field-label">Scheduled For</p>
          <h3>May 16, 2025<br />10:00 AM</h3>
          <p><b>Best Time Suggestion</b><span>10:00 AM - 12:00 PM</span></p>
          <p><b>Timezone</b><span>(GMT-05:00) New York</span></p>
          <p><b>Repeat</b><span>One Time</span></p>
          <div className="workflow-avatar-row"><span /><span /><span /><b>+3</b></div>
          <button type="button" className="workflow-card-action">Reschedule</button>
        </article>

        <article className="workflow-work-card green">
          <p className="workflow-field-label">Publishing Status</p>
          <h3><span className="workflow-pill success">Published Successfully</span></h3>
          <ul className="workflow-platforms">
            {['YouTube', 'Blog', 'LinkedIn', 'Facebook', 'X (Twitter)', 'Instagram', 'TikTok'].map((platform) => (
              <li key={platform}>{platform} <b>Success</b></li>
            ))}
          </ul>
          <button type="button" className="workflow-card-action">View Post</button>
        </article>

        <article className="workflow-work-card violet">
          <p className="workflow-field-label">Performance Overview</p>
          <h3>Last 7 Days</h3>
          {[
            ['128.4K', 'Views +16.6%'],
            ['8.7%', 'Engagement Rate +12.3%'],
            ['2.4K', 'Watch Time +15.4%'],
            ['6.2K', 'Clicks +11.2%'],
          ].map(([value, label]) => (
            <div key={label} className="workflow-metric"><div><b>{value}</b><span>{label}</span></div><Sparkline /></div>
          ))}
          <button type="button" className="workflow-card-action">View Analytics</button>
        </article>

        <article className="workflow-work-card pink">
          <p className="workflow-field-label">AI Insights</p>
          <h3>Great performance! Audience loves in-depth comparisons.</h3>
          <p><b>What Worked</b></p>
          <ul className="workflow-checklist">
            <li>Detailed Examples <CheckCircle2 size={13} /></li>
            <li>Visual Demonstrations <CheckCircle2 size={13} /></li>
            <li>Clear Explanations <CheckCircle2 size={13} /></li>
          </ul>
          <p><b>Recommendations</b><span>Create more comparison videos.</span></p>
          <p><b>Next Best Topic</b><span>AI Tools for Beginners</span></p>
          <button type="button" className="workflow-card-action">Apply Insights</button>
        </article>
      </section>

      <section className="workflow-bottom-grid">
        <article className="workflow-panel workflow-overview-panel">
          <h3>Workflow Overview</h3>
          <div className="workflow-overview-body">
            <div className="workflow-donut"><b>136</b><span>Total Workflows</span></div>
            <ul>{overviewStats.map(([label, value, tone]) => <li key={label}><span className={`legend-dot ${tone}`} />{label}<b>{value}</b></li>)}</ul>
          </div>
          <button type="button" className="workflow-full-button">View All Workflows</button>
        </article>

        <div className="workflow-middle-stack">
          <article className="workflow-panel">
            <div className="workflow-agent-flow">
              {agents.map(([agent, copy, Icon, tone]) => (
                <div key={agent} className="workflow-agent-node">
                  <span className={`workflow-agent-icon ${tone}`}><Icon size={20} /></span>
                  <b>{agent}</b>
                  <small>{copy}</small>
                </div>
              ))}
            </div>
          </article>
          <article className="workflow-panel">
            <h3>System Flow</h3>
            <div className="workflow-system-flow">
              {systemFlow.map(([title, copy, Icon, tone]) => (
                <div key={title}>
                  <span className={`workflow-system-icon ${tone}`}>
                    <Icon size={18} />
                  </span>
                  <b>{title}</b>
                  <small>{copy}</small>
                </div>
              ))}
            </div>
          </article>
        </div>

        <article className="workflow-panel workflow-health-panel">
          <h3>Workflow Health</h3>
          <div className="workflow-health">92%</div>
          <ul>
            <li><span className="legend-dot green" />Healthy <b>122 (92%)</b></li>
            <li><span className="legend-dot orange" />Warning <b>8 (6%)</b></li>
            <li><span className="legend-dot red" />Critical <b>2 (2%)</b></li>
          </ul>
          <button type="button" className="workflow-full-button">View Health Dashboard</button>
        </article>
      </section>

      <footer className="workflow-footer">
        <div><b>Status Legend</b><span className="legend-dot green" />Completed<span className="legend-dot blue" />In Progress<span className="legend-dot orange" />Pending<span className="legend-dot pink" />Analyzing<span className="legend-dot red" />Failed</div>
        <div><b>CACSMS Contents</b><span>AI Media Operating System</span></div>
      </footer>
    </div>
  )
}
