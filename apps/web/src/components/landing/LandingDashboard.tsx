import {
  BarChart3,
  Bell,
  Bot,
  CalendarDays,
  CheckCircle2,
  CircleHelp,
  Clapperboard,
  Clock3,
  FileText,
  Image,
  Play,
  Plus,
  Search,
  Send,
  Sparkles,
  Video,
} from 'lucide-react'

const metrics = [
  ['Total Content', '12,846', '+18.6% vs last 7 days', FileText, 'purple'],
  ['Published Content', '8,642', '+22.4% vs last 7 days', Send, 'green'],
  ['Total Views', '2.45M', '+16.3% vs last 7 days', Sparkles, 'orange'],
  ['Engagement Rate', '8.74%', '+12.5% vs last 7 days', BarChart3, 'blue'],
  ['AI Generations', '24,562', '+25.8% vs last 7 days', Bot, 'pink'],
] as const

const startupSteps = [
  ['Core Services', 'Initializing core system services', '100%', 'complete'],
  ['Database & Storage', 'Connecting and verifying databases', '100%', 'complete'],
  ['AI Services', 'Starting AI models and inference engines', '85%', 'active'],
  ['Content Pipeline', 'Loading content pipeline and processors', '62%', 'warning'],
  ['Workflow Engine', 'Activating workflow orchestrator', '40%', 'pending'],
  ['Integrations', 'Connecting external integrations', '0%', 'idle'],
  ['Monitoring', 'Starting monitoring and alerting', '0%', 'idle'],
] as const

const quickActions = [
  ['Create Content', FileText],
  ['Research Topic', Search],
  ['Generate Script', Sparkles],
  ['Create Video', Video],
  ['Design Thumbnail', Image],
  ['Schedule Content', CalendarDays],
  ['View Analytics', BarChart3],
  ['AI Agent Chat', Bot],
] as const

const pipeline = [
  ['Ideation', '324', 'Ideas', Bot, 'purple'],
  ['Research', '256', 'In Progress', Search, 'blue'],
  ['Production', '189', 'In Progress', Sparkles, 'orange'],
  ['Review', '143', 'Pending', CheckCircle2, 'orange'],
  ['Approval', '98', 'Approved', Send, 'green'],
  ['Publishing', '76', 'Scheduled', Clapperboard, 'cyan'],
  ['Analytics', '1,247', 'Live', BarChart3, 'blue'],
  ['Learning', '89', 'Analyzing', Bot, 'pink'],
] as const

const recentWorkflows = [
  ['AI Tools Video Series', 'Completed', '2 min ago'],
  ['Product Launch Campaign', 'In Progress', '15 min ago'],
  ['Weekly Content Batch', 'Completed', '1 hour ago'],
  ['Social Media Package', 'In Progress', '2 hours ago'],
  ['Blog Content Strategy', 'Completed', '3 hours ago'],
] as const

export function LandingDashboard() {
  return (
    <div className="landing-dashboard">
      <header className="landing-topbar">
        <div>
          <h1>Welcome back, John! <span aria-hidden="true">{'\uD83D\uDC4B'}</span></h1>
          <p>AI Media Operating System Dashboard</p>
        </div>
        <div className="landing-search">
          <Search size={18} />
          <span>Search modules, content, workflows...</span>
          <kbd>{'\u2318'}K</kbd>
        </div>
        <button type="button" className="landing-create"><Plus size={18} />Create</button>
        <button type="button" className="landing-icon-button"><Bell size={18} /><b>12</b></button>
        <button type="button" className="landing-icon-button"><CircleHelp size={18} /></button>
        <div className="landing-avatar">JD</div>
        <div className="landing-date-row">
          <span><CalendarDays size={15} />May 31, 2025</span>
          <span><Clock3 size={15} />10:30 AM</span>
        </div>
      </header>

      <section className="landing-hero-grid">
        <article className="landing-card landing-status-card">
          <div className="landing-card-head">
            <h2>System Overall Status</h2>
            <span>All Systems Operational</span>
          </div>
          <div className="landing-status-body">
            <div className="landing-health-ring"><b>92%</b><small>Healthy</small></div>
            <div className="landing-checks">
              {['Core Services', 'AI Services', 'Database', 'Storage', 'CDN & Delivery', 'Integrations'].map((item) => (
                <p key={item}><i />{item}<b>Operational</b></p>
              ))}
            </div>
          </div>
          <footer><span>Last checked: 10:30:15 AM</span><a>View System Health {'\u2192'}</a></footer>
        </article>

        {metrics.map(([label, value, change, Icon, tone]) => (
          <article key={label} className={`landing-metric-card ${tone}`}>
            <span><Icon size={22} /></span>
            <small>{label}</small>
            <h2>{value}</h2>
            <p>{change}</p>
            <svg viewBox="0 0 120 48" aria-hidden="true"><polyline points="0,40 15,31 27,18 42,35 55,24 70,39 84,20 98,27 112,12 120,16" /></svg>
          </article>
        ))}
      </section>

      <section className="landing-startup-layout">
        <article className="landing-card landing-startup">
          <div className="landing-card-head">
            <div><h2>System Startup Sequence</h2><p>Progressive startup of all modules and services</p></div>
            <div className="landing-startup-actions"><button type="button">Stop Startup</button><span>Elapsed Time: 02:14</span><button type="button">View Logs</button></div>
          </div>
          <div className="landing-startup-steps">
            {startupSteps.map(([title, copy, percent, state], index) => (
              <article key={title} className={`landing-step ${state}`}>
                <b>{index + 1}</b>
                <h3>{title}</h3>
                <p>{copy}</p>
                <strong>{percent}</strong>
                <div><i style={{ width: percent }} /></div>
                <em>{state === 'complete' ? '\u2713' : state === 'idle' ? '\u25F7' : ''}</em>
              </article>
            ))}
          </div>
          <div className="landing-overall"><span>Overall Startup Progress</span><div><i /></div><b>57%</b><small>Estimated Time Remaining: 01:42</small></div>
        </article>

        <article className="landing-card landing-details">
          <h2>Startup Details</h2>
          {startupSteps.map(([title, , , state], index) => (
            <p key={title}><i className={state} />{title}<b>{state === 'complete' ? 'Completed' : state === 'idle' ? 'Pending' : 'In Progress'}</b><span>{index < 4 ? `0${index}:${index === 0 ? '18' : index === 1 ? '22' : index === 2 ? '05' : '45'}` : '--:--'}</span></p>
          ))}
          <div className="landing-toggle">Auto-start enabled<span /></div>
        </article>
      </section>

      <section className="landing-middle-grid">
        <article className="landing-card landing-quick">
          <h2>Quick Start</h2><p>Jump into your most important workflows</p>
          <div>{quickActions.map(([label, Icon]) => <button type="button" key={label}><Icon size={25} />{label}</button>)}</div>
        </article>
        <article className="landing-card landing-pipeline">
          <div className="landing-card-head"><div><h2>Content Pipeline Overview</h2><p>Real-time overview of content across the pipeline</p></div><button type="button">All Workflows</button></div>
          <div className="landing-pipe-items">{pipeline.map(([label, count, status, Icon, tone]) => <div key={label} className={tone}><Icon size={28} /><b>{count}</b><span>{label}</span><small>{status}</small></div>)}</div>
          <div className="landing-multi-bar" />
        </article>
        <article className="landing-card landing-controls">
          <h2>System Controls</h2><p>Control and manage your AI Media OS</p>
          <ul>{['System Status', 'AI Services', 'Content Pipeline', 'Automation Engines', 'Scheduled Jobs', 'Notifications'].map((item, index) => <li key={item}>{item}<span>{index === 4 ? 'Pending' : index === 5 ? 'Enabled' : 'Running'}</span></li>)}</ul>
          <div><button type="button"><Play size={15} />Start All Services</button><button type="button">Stop All Services</button></div>
        </article>
      </section>

      <section className="landing-bottom-grid">
        <article className="landing-card"><h2>Top Performing Content</h2><p>Based on engagement in the last 7 days</p><table><tbody>{['AI Tools Ultimate Guide 2025', 'How AI Will Change Content Creation', 'Content Strategy for 2025'].map((title, index) => <tr key={title}><td>{title}</td><td>{index === 1 ? 'Blog' : 'Video'}</td><td>{['128.4K', '96.2K', '75.1K'][index]}</td><td>{['8.7%', '7.3%', '6.9%'][index]}</td><td>{'\u2197'}</td></tr>)}</tbody></table></article>
        <article className="landing-card landing-workflows"><h2>Recent Workflows <a>View All</a></h2><p>Your recently executed workflows</p>{recentWorkflows.map(([title, status, time]) => <div key={title}><span>{title}</span><b className={status === 'Completed' ? 'complete' : 'progress'}>{status}</b><small>{time}</small></div>)}</article>
        <article className="landing-card landing-activity"><h2>AI Agents Activity <a>View All</a></h2>{['Research Agent', 'Writing Agent', 'SEO Agent', 'Video Agent', 'Analytics Agent'].map((agent) => <p key={agent}>{agent}<span>Active</span></p>)}</article>
        <article className="landing-card landing-feed"><h2>System Activity Feed <a>View All</a></h2>{['10:30 AM - AI content generated successfully', '10:28 AM - Content published to YouTube', '10:25 AM - New user registration', '10:22 AM - Workflow completed', '10:20 AM - Database backup completed'].map((item) => <p key={item}>{item}</p>)}</article>
      </section>
    </div>
  )
}
